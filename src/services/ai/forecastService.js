/**
 * Forecast management: generate, list, compare, export and evaluate forecasts.
 * Engine PROTOTYPE runs the browser models (services/ml). Engine BACKEND posts the prepared series to
 * the integration gateway (/ml/forecast) and only stores what the backend actually returns.
 */
import dayjs from 'dayjs'
import storage from '../storageService'
import { getCurrentUser } from '../authService'
import { can } from '../../config/permissions'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { FORECAST_LIMIT, FORECAST_STATUS, FORECAST_TARGETS } from '../../config/aiConfig'
import { callGateway, isGatewayConfigured } from '../integrationGateway'
import { logActivity } from '../activityService'
import { logAiActivity } from './aiActivityService'
import { getDataBundle, getForecastSettings, getIndex } from './dataBundle'
import { actualsFor, buildForecast, validateForecastRequest } from '../ml/forecastBuilder'
import { actualVsPredicted } from '../ml/forecastEngine'
import { periodLabel, round } from '../ml/timeSeries'
import { toCsv } from '../csvService'
import { getNumberingPrefix } from '../../config/runtimeConfig'

const deny = (error) => ({ ok: false, error })

export const getForecasts = () => storage.getItem(K.FORECASTS, []) || []
export const getForecastById = (id) => getForecasts().find((f) => f.id === id) || null
export { getForecastSettings }

const lookups = (b) => ({
  products: Object.fromEntries(b.products.map((p) => [p.id, p])),
  hubs: Object.fromEntries(b.hubs.map((h) => [h.id, h])),
  customers: Object.fromEntries(b.customers.map((c) => [c.id, c])),
})

/** Validate and save forecasting parameters (models, smoothing, baseline). */
export const saveForecastSettings = (patch) => {
  const user = getCurrentUser()
  const keys = Object.keys(patch)
  const planning = ['suppliers', 'productParams', 'defaultLeadTimeDays', 'safetyDays', 'serviceLevel', 'reviewPeriodDays', 'demandBasis', 'lookbackDays', 'forecastHorizonDays', 'excessCoverageDays', 'slowMovingCoverageDays', 'spikeFactor']
  const needsPlanning = keys.some((k) => planning.includes(k))
  const needsForecast = keys.some((k) => !planning.includes(k))
  if (needsPlanning && !can(user, 'inventory.predictions.manage')) return deny('Only an Administrator can change inventory planning parameters.')
  if (needsForecast && !can(user, 'forecasting.generate') && !can(user, 'ai.models.manage')) return deny('You do not have permission to change forecasting settings.')
  const e = {}
  const num = (k, min, max, int = false) => {
    if (patch[k] === undefined) return
    const v = Number(patch[k])
    if (!Number.isFinite(v) || v < min || v > max || (int && !Number.isInteger(v))) e[k] = `Enter ${int ? 'a whole number' : 'a value'} between ${min} and ${max}.`
  }
  num('maWindow', 2, 60, true); num('sesAlpha', 0.01, 0.99); num('holtAlpha', 0.01, 0.99); num('holtBeta', 0.01, 0.99)
  num('historyDays', 28, 730, true); num('lookbackDays', 14, 365, true); num('forecastHorizonDays', 7, 90, true)
  num('defaultLeadTimeDays', 1, 120, true); num('safetyDays', 0, 60, true); num('reviewPeriodDays', 1, 90, true)
  num('excessCoverageDays', 14, 365, true); num('slowMovingCoverageDays', 30, 730, true); num('spikeFactor', 1.1, 10)
  if (patch.serviceLevel !== undefined && ![90, 95, 97.5, 99].includes(Number(patch.serviceLevel))) e.serviceLevel = 'Choose 90, 95, 97.5 or 99%.'
  if (patch.confidenceLevel !== undefined && ![80, 90, 95, 99].includes(Number(patch.confidenceLevel))) e.confidenceLevel = 'Choose 80, 90, 95 or 99%.'
  if (patch.demandBasis !== undefined && !['ordered', 'dispatched', 'delivered'].includes(patch.demandBasis)) e.demandBasis = 'Choose a demand basis.'
  if (patch.engine === 'BACKEND' && !isGatewayConfigured()) e.engine = 'Backend ML needs the integration gateway (VITE_INTEGRATION_GATEWAY_URL). Integration pending.'
  if (patch.suppliers) {
    patch.suppliers.forEach((s, i) => {
      if (!String(s.name || '').trim()) e[`suppliers.${i}.name`] = 'Supplier name is required.'
      if (!(Number(s.leadTimeDays) >= 1 && Number(s.leadTimeDays) <= 120)) e[`suppliers.${i}.leadTimeDays`] = 'Lead time 1–120 days.'
    })
  }
  if (patch.productParams) {
    Object.entries(patch.productParams).forEach(([pid, p]) => {
      if (p.leadTimeDays !== '' && p.leadTimeDays !== undefined && !(Number(p.leadTimeDays) >= 1 && Number(p.leadTimeDays) <= 120)) e[`productParams.${pid}.leadTimeDays`] = 'Lead time 1–120 days.'
      if (p.moq !== '' && p.moq !== undefined && !(Number(p.moq) >= 0)) e[`productParams.${pid}.moq`] = 'MOQ cannot be negative.'
      if (p.packMultiple !== '' && p.packMultiple !== undefined && !(Number(p.packMultiple) >= 1)) e[`productParams.${pid}.packMultiple`] = 'Pack multiple must be at least 1.'
    })
  }
  if (Object.keys(e).length) return { ok: false, errors: e, error: 'Please fix the highlighted fields.' }
  const next = { ...getForecastSettings(), ...patch }
  const res = storage.setItem(K.FORECAST_SETTINGS, next)
  if (!res.ok) return deny(res.error)
  logAiActivity({ kind: 'settings', action: 'forecast_settings_saved', args: { keys } })
  return { ok: true, record: next }
}

const nextNumber = (settings) => {
  const used = new Set(getForecasts().map((f) => f.number))
  let n = (Number(settings.lastForecastNumber) || 0) + 1
  while (used.has(`${getNumberingPrefix('forecast')}-${dayjs().year()}-${String(n).padStart(4, '0')}`)) n += 1
  return n
}

/** Build a forecast in the browser without saving it (used for previews and the assistant). */
export const previewForecast = (request) => {
  const b = getDataBundle()
  const settings = getForecastSettings()
  return buildForecast(getIndex(b), request, settings, { lk: lookups(b), user: getCurrentUser() })
}

const backendForecast = async (request, settings, local) => {
  if (!isGatewayConfigured()) return { ok: false, error: 'Backend ML is not available — the integration gateway is not configured (integration pending).' }
  const res = await callGateway('/ml/forecast', {
    method: 'POST', timeoutMs: 60000,
    body: { target: request.target, granularity: request.granularity, horizonPeriods: local.horizonPeriods, model: request.model, history: local.history, confidenceLevel: settings.confidenceLevel },
  })
  if (!res.ok) return { ok: false, error: res.error }
  const d = res.data || {}
  if (!Array.isArray(d.predictions)) return { ok: false, error: 'The ML service returned no predictions.' }
  return {
    ok: true,
    patch: {
      engine: 'BACKEND', model: d.model || request.model, modelName: d.modelName || d.model || 'Backend model', modelVersion: d.version || '—',
      predictions: d.predictions.map((p, i) => ({ key: p.key || local.predictions[i]?.key, value: round(p.value), lower: p.lower ?? null, upper: p.upper ?? null })),
      metrics: d.metrics || null, backtest: d.backtest || null, candidates: [], notes: [...(d.notes || []), 'Produced by the backend ML service.'],
      status: FORECAST_STATUS.COMPLETED, statusOk: true,
    },
  }
}

export const generateForecast = async (request, { engine } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'forecasting.generate')) return deny('You do not have permission to generate forecasts.')
  const errors = validateForecastRequest(request)
  if (Object.keys(errors).length) return { ok: false, errors, error: 'Please fix the highlighted fields.' }
  const started = Date.now()
  const b = getDataBundle()
  const settings = getForecastSettings()
  const n = nextNumber(settings)
  const number = `${getNumberingPrefix('forecast')}-${dayjs().year()}-${String(n).padStart(4, '0')}`
  let record = buildForecast(getIndex(b), request, settings, { id: `fc-${Date.now().toString(36)}`, number, user, lk: lookups(b) })
  const useEngine = engine || settings.engine
  if (useEngine === 'BACKEND' && record.status === FORECAST_STATUS.COMPLETED) {
    const be = await backendForecast(request, settings, record)
    if (!be.ok) return deny(be.error)
    record = { ...record, ...be.patch, predictedTotal: round(be.patch.predictions.reduce((s, p) => s + p.value, 0)) }
  }
  const list = [record, ...getForecasts()].slice(0, FORECAST_LIMIT)
  const res = storage.transaction([[K.FORECASTS, list], [K.FORECAST_SETTINGS, { ...settings, lastForecastNumber: n }]])
  if (!res.ok) return deny(res.error)
  logAiActivity({ kind: 'forecast', action: 'generate_forecast', args: request, ok: true, durationMs: Date.now() - started, summary: `${record.number} · ${record.status}` })
  logActivity({ type: 'ai', message: `generated forecast ${record.number} (${record.name})`, entityType: 'forecast', entityId: record.id })
  return { ok: true, record }
}

export const deleteForecast = (id) => {
  const user = getCurrentUser()
  if (!can(user, 'forecasting.generate')) return deny('You do not have permission to delete forecasts.')
  const f = getForecastById(id)
  if (!f) return deny('Forecast not found.')
  const res = storage.setItem(K.FORECASTS, getForecasts().filter((x) => x.id !== id))
  if (!res.ok) return deny(res.error)
  logAiActivity({ kind: 'forecast', action: 'delete_forecast', args: { id, number: f.number } })
  return { ok: true }
}

/** Actual vs predicted for the elapsed part of a stored forecast. */
export const evaluateForecast = (forecast) => {
  if (!forecast?.predictions?.length) return { rows: [], metrics: null }
  const b = getDataBundle()
  const actual = actualsFor(getIndex(b), forecast)
  return actualVsPredicted(forecast.predictions, actual)
}

export const forecastCsv = (forecast) => {
  const ev = evaluateForecast(forecast)
  const act = Object.fromEntries(ev.rows.map((r) => [r.key, r.actual]))
  const rows = [
    ...forecast.history.keys.map((k, i) => ({ period: k, label: periodLabel(k, forecast.granularity), type: 'history', value: forecast.history.values[i], lower: '', upper: '', actual: forecast.history.values[i] })),
    ...forecast.predictions.map((p) => ({ period: p.key, label: periodLabel(p.key, forecast.granularity), type: 'forecast', value: p.value, lower: p.lower ?? '', upper: p.upper ?? '', actual: act[p.key] ?? '' })),
  ]
  const header = [
    `# ${forecast.number} ${forecast.name}`,
    `# Model: ${forecast.modelName} v${forecast.modelVersion} (${forecast.engine === 'BACKEND' ? 'backend ML service' : 'prototype statistical model, not a trained ML model'})`,
    `# Generated: ${forecast.createdAt} · Status: ${forecast.status}${forecast.message ? ` — ${forecast.message}` : ''}`,
    `# Data: ${forecast.sources.map((s) => `${s.label} ${s.from}–${s.to}`).join('; ')}`,
  ].join('\n')
  return `${header}\n${toCsv(rows, [
    { header: 'Period', value: (r) => r.period }, { header: 'Label', value: (r) => r.label }, { header: 'Type', value: (r) => r.type },
    { header: 'Value', value: (r) => r.value }, { header: 'Lower', value: (r) => r.lower }, { header: 'Upper', value: (r) => r.upper }, { header: 'Actual', value: (r) => r.actual },
  ])}`
}

export const downloadForecastCsv = (forecast) => {
  const blob = new Blob([`﻿${forecastCsv(forecast)}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bellomassi-${forecast.number}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 500)
  logAiActivity({ kind: 'forecast', action: 'export_forecast_csv', args: { id: forecast.id, number: forecast.number } })
  return { ok: true }
}

/** KPIs for the forecasting dashboard — taken from stored forecasts, never estimated. */
export const forecastKpis = (forecasts = getForecasts(), prediction = null) => {
  const ok = forecasts.filter((f) => f.status === FORECAST_STATUS.COMPLETED)
  const latest = (target) => ok.find((f) => f.request.target === target && !f.request.filters?.productId && !f.request.filters?.hubId && !f.request.filters?.customerId && !f.request.filters?.category)
  const acc = ok.map((f) => f.metrics?.accuracy).filter((v) => v !== null && v !== undefined)
  return {
    sales: latest('revenue'),
    orders: latest('orders'),
    demand: latest('quantity'),
    accuracy: acc.length ? round(acc.reduce((s, v) => s + v, 0) / acc.length, 1) : null,
    accuracyCount: acc.length,
    atRisk: prediction ? prediction.summary.byRisk.CRITICAL + prediction.summary.byRisk.HIGH : null,
    stockouts: prediction ? prediction.summary.predictedStockouts : null,
  }
}

export const targetLabel = (t) => FORECAST_TARGETS.find((x) => x.value === t)?.label || t
