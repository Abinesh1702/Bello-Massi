/**
 * Model registry (bellomassi_ai_models) and Jarvis preferences (bellomassi_jarvis_settings).
 * Prototype models are browser formulas; backend models stay "Integration pending" until the gateway
 * answers their health check. Nothing is ever labelled trained or active without that response.
 */
import storage from '../storageService'
import { getCurrentUser } from '../authService'
import { can } from '../../config/permissions'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { DEFAULT_JARVIS_SETTINGS, FORECAST_STATUS } from '../../config/aiConfig'
import { callGateway, isGatewayConfigured } from '../integrationGateway'
import { uid } from '../../utils/helpers'
import { logAiActivity } from './aiActivityService'
import { getForecastSettings } from './dataBundle'
import { round } from '../ml/timeSeries'

const deny = (error) => ({ ok: false, error })

export const getModels = () => storage.getItem(K.AI_MODELS, []) || []

export const MODEL_STATUS_META = {
  ACTIVE: { label: 'Active', tone: 'success' },
  DISABLED: { label: 'Disabled', tone: 'neutral' },
  INTEGRATION_PENDING: { label: 'Integration pending', tone: 'info' },
  UNAVAILABLE: { label: 'Unavailable', tone: 'danger' },
}

const guard = () => {
  const user = getCurrentUser()
  return can(user, 'ai.models.manage') ? null : deny('Only an Administrator can manage models.')
}

const write = (list, action, args) => {
  const res = storage.setItem(K.AI_MODELS, list)
  if (!res.ok) return deny(res.error)
  logAiActivity({ kind: 'settings', action, args })
  return { ok: true }
}

export const setModelEnabled = (id, enabled) => {
  const g = guard()
  if (g) return g
  const list = getModels()
  const m = list.find((x) => x.id === id)
  if (!m) return deny('Model not found.')
  if (m.engine === 'PROTOTYPE' && m.kind === 'forecasting' && !enabled) {
    const settings = getForecastSettings()
    if (settings.defaultModel === m.code) return deny('This is the default forecasting model. Choose another default first.')
    if (list.filter((x) => x.engine === 'PROTOTYPE' && x.kind === 'forecasting' && x.enabled && x.id !== id).length === 0) return deny('At least one prototype forecasting model must stay enabled.')
  }
  if (enabled && m.status === 'INTEGRATION_PENDING') return deny('This model is not reachable yet — run a health check through the integration gateway first.')
  return write(list.map((x) => (x.id === id ? { ...x, enabled, status: enabled ? (x.status === 'DISABLED' ? 'ACTIVE' : x.status) : 'DISABLED' } : x)), enabled ? 'model_enabled' : 'model_disabled', { id, name: m.name })
}

export const validateBackendModel = (input, list = getModels()) => {
  const e = {}
  if (!String(input.name || '').trim()) e.name = 'Name is required.'
  if (!/^[A-Z0-9_]{3,30}$/.test(String(input.code || ''))) e.code = 'Code: 3–30 capitals, digits or underscores.'
  else if (list.some((m) => m.code === input.code)) e.code = 'That code is already registered.'
  if (!String(input.library || '').trim()) e.library = 'Library / framework is required.'
  if (!/^\/[a-z0-9/_-]*$/i.test(String(input.endpoint || ''))) e.endpoint = 'Gateway path, e.g. /ml/forecast.'
  return e
}

export const registerBackendModel = (input) => {
  const g = guard()
  if (g) return g
  const list = getModels()
  const errors = validateBackendModel(input, list)
  if (Object.keys(errors).length) return { ok: false, errors, error: 'Please fix the highlighted fields.' }
  const m = { id: uid('mdl'), kind: 'forecasting', engine: 'BACKEND', code: input.code, name: input.name.trim(), library: input.library.trim(), endpoint: input.endpoint, version: String(input.version || '—').trim() || '—', status: 'INTEGRATION_PENDING', enabled: false, trained: false, description: String(input.description || '').trim(), registeredAt: new Date().toISOString() }
  return { ...write([...list, m], 'model_registered', { code: m.code }), record: m }
}

/** Backend model health check through the gateway. ACTIVE only with a successful response. */
export const checkBackendModel = async (id) => {
  const g = guard()
  if (g) return g
  const m = getModels().find((x) => x.id === id)
  if (!m || m.engine === 'PROTOTYPE') return deny('Only backend and provider models have a health check.')
  if (!isGatewayConfigured()) {
    logAiActivity({ kind: 'provider', action: 'model_health', args: { code: m.code }, ok: false, error: 'Gateway not configured' })
    return { ok: false, status: 'INTEGRATION_PENDING', error: 'Integration pending — the integration gateway is not configured, so the ML service cannot be reached.' }
  }
  const r = await callGateway(`/ml/models/${encodeURIComponent(m.code)}`, { timeoutMs: 15000 })
  const status = r.ok && r.data?.ready === true ? 'ACTIVE' : 'UNAVAILABLE'
  const list = getModels().map((x) => (x.id === id ? { ...x, status, enabled: status === 'ACTIVE' ? x.enabled : false, version: r.data?.version || x.version, trained: Boolean(r.data?.trainedAt), trainedAt: r.data?.trainedAt || null, lastCheckedAt: new Date().toISOString(), lastError: r.ok ? '' : r.error } : x))
  storage.setItem(K.AI_MODELS, list)
  logAiActivity({ kind: 'provider', action: 'model_health', args: { code: m.code }, ok: status === 'ACTIVE', error: r.ok ? '' : r.error })
  return status === 'ACTIVE' ? { ok: true, status } : { ok: false, status, error: r.error || 'The ML service reported the model is not ready.' }
}

/** Evaluation summary per model, from stored forecasts' real backtests only. */
export const modelPerformance = (forecasts) => {
  const by = {}
  forecasts.filter((f) => f.status === FORECAST_STATUS.COMPLETED && f.metrics).forEach((f) => {
    const g = (by[f.model] ||= { model: f.model, count: 0, accuracy: [], rmse: [], mape: [], bias: [] })
    g.count += 1
    if (f.metrics.accuracy !== null) g.accuracy.push(f.metrics.accuracy)
    if (f.metrics.mape !== null) g.mape.push(f.metrics.mape)
    g.bias.push(f.metrics.bias)
  })
  const avg = (a) => (a.length ? round(a.reduce((s, v) => s + v, 0) / a.length, 1) : null)
  return Object.fromEntries(Object.values(by).map((g) => [g.model, { count: g.count, accuracy: avg(g.accuracy), mape: avg(g.mape) }]))
}


/* ---------------- Jarvis settings ---------------- */

export const getJarvisSettings = () => ({ ...DEFAULT_JARVIS_SETTINGS, ...(storage.getItem(K.JARVIS_SETTINGS, {}) || {}) })

export const saveJarvisSettings = (patch) => {
  const user = getCurrentUser()
  if (!can(user, 'jarvis.use')) return deny('You cannot change Jarvis settings.')
  const e = {}
  if (patch.rate !== undefined && !(Number(patch.rate) >= 0.5 && Number(patch.rate) <= 2)) e.rate = 'Speed 0.5–2.'
  if (patch.volume !== undefined && !(Number(patch.volume) >= 0 && Number(patch.volume) <= 1)) e.volume = 'Volume 0–100%.'
  if (patch.floatingPosition !== undefined && !['bottom-right', 'bottom-left'].includes(patch.floatingPosition)) e.floatingPosition = 'Choose a position.'
  if (patch.wakeWord !== undefined && !/^[a-z]{3,20}$/i.test(patch.wakeWord)) e.wakeWord = 'Wake word: 3–20 letters.'
  if (Object.keys(e).length) return { ok: false, errors: e, error: 'Please fix the highlighted fields.' }
  const next = { ...getJarvisSettings(), ...patch }
  const res = storage.setItem(K.JARVIS_SETTINGS, next)
  if (!res.ok) return deny(res.error)
  logAiActivity({ kind: 'settings', action: 'jarvis_settings_saved', args: patch, source: 'jarvis' })
  return { ok: true, record: next }
}
