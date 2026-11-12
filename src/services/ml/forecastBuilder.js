/**
 * Builds a complete, storable forecast record from a request (pure).
 */
import dayjs from 'dayjs'
import { FORECAST_MODEL_META, FORECAST_STATUS, FORECAST_TARGETS, PROTOTYPE_MODEL_VERSION } from '../../config/aiConfig'
import { salesSeries } from './demandData'
import { forecastSeries } from './forecastEngine'
import { aggregate, periodsForDays, round } from './timeSeries'

export const emptyForecastRequest = () => ({
  name: '', target: 'revenue', level: 'total', granularity: 'day', horizonDays: 30, model: 'AUTO',
  filters: { hubId: '', customerId: '', productId: '', category: '' }, historyFrom: '', historyTo: '',
})

export const validateForecastRequest = (r) => {
  const e = {}
  if (!FORECAST_TARGETS.some((t) => t.value === r.target)) e.target = 'Choose what to forecast.'
  if (!['day', 'week', 'month', 'quarter'].includes(r.granularity)) e.granularity = 'Choose a period.'
  const h = Number(r.horizonDays)
  if (!Number.isInteger(h) || h < 1 || h > 365) e.horizonDays = 'Horizon must be a whole number of days between 1 and 365.'
  if (r.level === 'product' && !r.filters?.productId) e.productId = 'Select a product.'
  if (r.level === 'hub' && !r.filters?.hubId) e.hubId = 'Select a hub.'
  if (r.level === 'customer' && !r.filters?.customerId) e.customerId = 'Select a customer.'
  if (r.level === 'category' && !r.filters?.category) e.category = 'Select a category.'
  if (r.historyFrom && r.historyTo && r.historyFrom > r.historyTo) e.historyFrom = 'Start must be before end.'
  if (r.historyTo && dayjs(r.historyTo).isAfter(dayjs(), 'day')) e.historyTo = 'History cannot end in the future.'
  return e
}

export const describeScope = (r, lk = {}) => {
  const f = r.filters || {}
  const parts = []
  if (f.productId) parts.push(lk.products?.[f.productId]?.name || 'Product')
  if (f.category) parts.push(f.category)
  if (f.hubId) parts.push(lk.hubs?.[f.hubId]?.name || 'Hub')
  if (f.customerId) parts.push(lk.customers?.[f.customerId]?.name || 'Customer')
  return parts.length ? parts.join(' · ') : 'All business'
}

/**
 * @param asOf forecast date — history ends the day before (a part-day would look like a drop).
 */
export const buildForecast = (index, request, settings, { now = dayjs(), asOf = now, id, number, user, lk } = {}) => {
  const asOfDay = dayjs(asOf).startOf('day')
  const to = request.historyTo || asOfDay.subtract(1, 'day').format('YYYY-MM-DD')
  const from = request.historyFrom || dayjs(to).subtract((Number(settings.historyDays) || 180) - 1, 'day').format('YYYY-MM-DD')
  const s = salesSeries(index, { target: request.target, filters: request.filters || {}, from, to })
  const agg = aggregate(s.days, s.values, request.granularity)
  const horizonPeriods = periodsForDays(Number(request.horizonDays), request.granularity)
  const lastDataAgeDays = s.lastDay ? asOfDay.diff(dayjs(s.lastDay), 'day') : 999
  const result = forecastSeries({
    values: agg.values, keys: agg.keys, granularity: request.granularity, horizonPeriods,
    model: request.model || settings.defaultModel, settings, confidenceLevel: Number(settings.confidenceLevel) || 95, lastDataAgeDays,
  })
  const total = result.predictions.reduce((t, p) => t + p.value, 0)
  return {
    id,
    number,
    name: request.name || `${FORECAST_TARGETS.find((t) => t.value === request.target)?.label} · ${describeScope(request, lk)}`,
    createdAt: dayjs(now).toISOString(),
    asOf: asOfDay.format('YYYY-MM-DD'),
    createdBy: user?.id || null,
    createdByName: user?.name || 'System',
    request,
    scope: describeScope(request, lk),
    engine: 'PROTOTYPE',
    modelName: result.modelUsed in FORECAST_MODEL_META ? FORECAST_MODEL_META[result.modelUsed].label : result.modelUsed,
    model: result.modelUsed,
    modelVersion: PROTOTYPE_MODEL_VERSION,
    params: result.params || null,
    status: result.status,
    message: result.message || '',
    granularity: request.granularity,
    horizonDays: Number(request.horizonDays),
    horizonPeriods,
    historyPeriod: { from, to, periods: agg.keys.length },
    history: { keys: agg.keys, values: agg.values.map((v) => round(v)) },
    predictions: result.predictions,
    predictedTotal: round(total),
    confidenceLevel: result.confidenceLevel || null,
    sigma: result.sigma ?? null,
    backtest: result.backtest,
    metrics: result.metrics,
    candidates: result.candidates,
    quality: result.quality,
    sufficiency: result.sufficiency,
    notes: result.notes,
    sources: s.sources,
    usesDemoData: s.sources.some((x) => x.kind === 'demo'),
    statusOk: result.status === FORECAST_STATUS.COMPLETED,
  }
}

/** Actuals for a stored forecast's predicted periods (only complete periods are compared). */
export const actualsFor = (index, forecast, { now = dayjs() } = {}) => {
  const req = forecast.request
  const from = forecast.predictions[0]?.key
  if (!from) return {}
  const start = req.granularity === 'month' ? `${from}-01` : req.granularity === 'quarter' ? null : from
  if (!start) return {}
  const to = dayjs(now).subtract(1, 'day').format('YYYY-MM-DD')
  if (start > to) return {}
  const s = salesSeries(index, { target: req.target, filters: req.filters || {}, from: start, to })
  const agg = aggregate(s.days, s.values, req.granularity)
  return Object.fromEntries(agg.keys.map((k, i) => [k, round(agg.values[i])]))
}
