/**
 * Phase 6 seed (pure). Builds:
 *  - bellomassi_sales_history: a SYNTHETIC 180-day demo sales baseline ending the day before the first
 *    platform order. It exists only so the prototype's forecasts have enough history; every screen that
 *    uses it says "Demo historical baseline". Prices are a snapshot of current list prices.
 *  - default AI / Jarvis / forecast settings, the model registry, a first predictive-inventory run,
 *    reorder recommendations, insights and two example forecasts (one generated 14 days ago so
 *    actual-vs-predicted can be shown with real platform actuals).
 */
import dayjs from 'dayjs'
import { DEFAULT_AI_SETTINGS, DEFAULT_FORECAST_SETTINGS, DEFAULT_JARVIS_SETTINGS, FORECAST_MODEL_META, PROTOTYPE_MODEL_VERSION, RECOMMENDATION_STATUS } from '../../config/aiConfig'
import { seededRandom } from '../../utils/helpers'
import { buildIndex } from '../ml/demandData'
import { buildForecast } from '../ml/forecastBuilder'
import { generateInsights, mergeInsights } from '../ml/insightsEngine'
import { predictInventory } from '../ml/inventoryPrediction'
import { inputsFingerprint } from '../ml/fingerprint'

const WEEKDAY = [0.45, 1.1, 1.0, 1.0, 1.05, 1.2, 0.95] // Sun … Sat

const generateRaw = ({ now = dayjs(), products = [], customers = [], hubs = [], orders = [], volume = 1 }) => {
  const rand = seededRandom(20261111)
  const activeHubs = hubs.filter((h) => h.status === 'Active')
  const hubIdx = Object.fromEntries(activeHubs.map((h, i) => [h.id, i]))
  const prods = products.filter((p) => p.status === 'Active' && p.trackInventory !== false)
  const custs = customers.filter((c) => c.status === 'Active' && hubIdx[c.hubId] !== undefined)
  if (!prods.length || !custs.length || !activeHubs.length) return null
  const firstOrder = orders.map((o) => o.orderDate).filter(Boolean).sort()[0]
  const end = firstOrder ? dayjs(firstOrder).subtract(1, 'day') : dayjs(now).subtract(15, 'day')
  const days = 180
  const start = end.subtract(days - 1, 'day')

  // Product popularity: a few fast movers, a long tail, one product that stops selling 45 days before the end.
  const weight = prods.map((p, i) => {
    const r = rand()
    return i % 7 === 0 ? 3 + r * 2 : i % 5 === 0 ? 0.25 + r * 0.3 : 0.7 + r * 1.3
  })
  const fading = prods.length > 3 ? prods.length - 2 : -1
  const custWeight = custs.map(() => 0.4 + rand() * 1.6)
  const pick = (weights) => {
    const total = weights.reduce((s, w) => s + w, 0)
    let x = rand() * total
    for (let i = 0; i < weights.length; i += 1) { x -= weights[i]; if (x <= 0) return i }
    return weights.length - 1
  }
  const rows = []
  for (let d = 0; d < days; d += 1) {
    const date = start.add(d, 'day')
    const trend = 1 + 0.0018 * d
    const festive = d > days - 25 ? 1.18 : 1
    const expected = 6.5 * volume * WEEKDAY[date.day()] * trend * festive
    const n = Math.max(0, Math.round(expected + (rand() - 0.5) * 3))
    for (let k = 0; k < n; k += 1) {
      const ci = pick(custWeight)
      const c = custs[ci]
      const lines = []
      const used = new Set()
      const lineCount = 2 + Math.floor(rand() * 4)
      for (let l = 0; l < lineCount; l += 1) {
        const w = weight.map((x, i) => (used.has(i) || (i === fading && d > days - 45) ? 0 : x))
        if (!w.some((x) => x > 0)) break
        const pi = pick(w)
        used.add(pi)
        const qty = Math.max(1, Math.round((4 + rand() * 18) * Math.min(2, Math.sqrt(weight[pi]))))
        lines.push(pi, qty)
      }
      rows.push([d, ci, hubIdx[c.hubId], lines])
    }
  }
  return {
    demo: true,
    label: 'Demo historical baseline (synthetic)',
    description: 'Synthetic order history generated for the prototype so forecasting has enough data. Not real sales. Used only for dates before the first platform order.',
    generatedAt: dayjs(now).toISOString(),
    from: start.format('YYYY-MM-DD'),
    to: end.format('YYYY-MM-DD'),
    products: prods.map((p) => p.id),
    prices: prods.map((p) => Number(p.sellingPrice) || 0),
    customers: custs.map((c) => c.id),
    hubs: activeHubs.map((h) => h.id),
    orders: rows,
  }
}

const NOT_BOOKED = ['DRAFT', 'SUBMITTED', 'RETURNED', 'REJECTED']

/**
 * Generate the baseline, then rescale its order volume so its recent daily revenue matches the
 * platform's own booked revenue per day — the synthetic history continues the real level instead of
 * jumping when platform data starts.
 */
export const generateSalesHistory = (args) => {
  const first = generateRaw({ ...args, volume: 1 })
  if (!first) return null
  const booked = (args.orders || []).filter((o) => !NOT_BOOKED.includes(o.orderStatus) && o.orderDate)
  if (!booked.length) return first
  const days = booked.map((o) => o.orderDate).sort()
  const span = Math.max(7, dayjs(days[days.length - 1]).diff(dayjs(days[0]), 'day') + 1)
  const platformDaily = booked.reduce((t, o) => t + (o.items || []).reduce((q, it) => q + (Number(it.taxableAmount) || 0), 0), 0) / span
  const lastDays = 28
  const recent = first.orders.filter(([d]) => d >= 180 - lastDays)
  const baseDaily = recent.reduce((t, [, , , lines]) => { let r = 0; for (let k = 0; k < lines.length; k += 2) r += lines[k + 1] * (first.prices[lines[k]] || 0); return t + r }, 0) / lastDays
  if (!baseDaily || !platformDaily) return first
  const volume = Math.min(3, Math.max(0.15, platformDaily / baseDaily))
  return { ...generateRaw({ ...args, volume }), calibration: { volume: Math.round(volume * 100) / 100, platformDailyRevenue: Math.round(platformDaily) } }
}

export const buildModelRegistry = (now = dayjs()) => {
  const at = dayjs(now).toISOString()
  const proto = ['MA', 'WMA', 'SES', 'HOLT', 'SEASONAL'].map((m) => ({
    id: `mdl-${m.toLowerCase()}`, kind: 'forecasting', engine: 'PROTOTYPE', code: m, name: FORECAST_MODEL_META[m].label, version: PROTOTYPE_MODEL_VERSION,
    status: 'ACTIVE', enabled: true, library: 'Bellomassi browser engine', description: FORECAST_MODEL_META[m].description, trained: false, registeredAt: at,
  }))
  const backend = [
    { id: 'mdl-be-ets', code: 'BE_ETS', name: 'Exponential smoothing (statsmodels ETS)', library: 'statsmodels' },
    { id: 'mdl-be-sarimax', code: 'BE_SARIMAX', name: 'Seasonal ARIMA (statsmodels SARIMAX)', library: 'statsmodels' },
    { id: 'mdl-be-prophet', code: 'BE_PROPHET', name: 'Prophet', library: 'prophet (if deployment allows)' },
    { id: 'mdl-be-gbr', code: 'BE_GBR', name: 'Gradient boosting regression', library: 'scikit-learn' },
  ].map((m) => ({ ...m, kind: 'forecasting', engine: 'BACKEND', version: '—', status: 'INTEGRATION_PENDING', enabled: false, endpoint: '/ml/forecast', trained: false, description: 'Runs on the backend ML service through the integration gateway. Not available until the gateway confirms it.', registeredAt: at }))
  const chat = [
    { id: 'mdl-demo-intents', code: 'DEMO', name: 'Demo intent engine', version: '1.0.0', status: 'ACTIVE', enabled: true, engine: 'PROTOTYPE', library: 'Rule-based (no LLM)', description: 'Keyword and pattern matching to Bellomassi tools.' },
    { id: 'mdl-openjarvis', code: 'OPENJARVIS', name: 'OpenJarvis server model', version: '—', status: 'INTEGRATION_PENDING', enabled: false, engine: 'PROVIDER', library: 'OpenJarvis', description: 'Model reported by OpenJarvis /v1/info once connected.' },
    { id: 'mdl-ollama', code: 'OLLAMA', name: 'Ollama local model', version: '—', status: 'INTEGRATION_PENDING', enabled: false, engine: 'PROVIDER', library: 'Ollama', description: 'Model reported by Ollama /api/tags once connected.' },
  ].map((m) => ({ ...m, kind: 'assistant', trained: false, registeredAt: at }))
  return [...proto, ...backend, ...chat]
}

export const recommendationsFrom = (prediction, previous = []) => {
  const prev = Object.fromEntries(previous.map((r) => [r.id, r]))
  return prediction.rows.filter((r) => r.recommendedQty > 0).map((r) => {
    const id = `rec-${r.productId}-${r.hubId}`
    const keep = prev[id] && prev[id].status !== RECOMMENDATION_STATUS.OPEN ? { status: prev[id].status, draftId: prev[id].draftId || null, dismissedReason: prev[id].dismissedReason || '' } : { status: RECOMMENDATION_STATUS.OPEN, draftId: null, dismissedReason: '' }
    return {
      id, runAt: prediction.generatedAt, productId: r.productId, hubId: r.hubId, productName: r.productName, productCode: r.productCode, hubName: r.hubName, category: r.category, unit: r.unit,
      recommendedQty: r.recommendedQty, risk: r.risk, reason: r.reason, suggestedReorderDate: r.suggestedReorderDate, supplierId: r.supplierId, supplierName: r.supplierName,
      leadTimeDays: r.leadTimeDays, avgDaily: r.avgDaily, forecastDemand: r.forecastDemand, safetyStock: r.safetyStock, reorderPoint: r.reorderPoint, targetStock: r.targetStock,
      available: r.available, reserved: r.reserved, committed: r.committed, incoming: r.incoming, position: r.position, moq: r.moq, packMultiple: r.packMultiple, unitCost: r.unitCost,
      ...keep,
    }
  })
}

export const buildPhase6Data = ({ now = dayjs(), data }) => {
  const salesHistory = generateSalesHistory({ now, products: data.products, customers: data.customers, hubs: data.hubs, orders: data.orders })
  const settings = { ...DEFAULT_FORECAST_SETTINGS }
  const bundle = { ...data, salesHistory, replenishments: [], receipts: data.receipts || [] }
  const index = buildIndex(bundle, { includeBaseline: true })
  const prediction = predictInventory(bundle, settings, { now, index })
  const insights = mergeInsights([], generateInsights(bundle, { now, index, prediction }), { now })
  const lk = { products: Object.fromEntries((data.products || []).map((p) => [p.id, p])), hubs: Object.fromEntries((data.hubs || []).map((h) => [h.id, h])), customers: {} }
  const system = { id: 'system', name: 'System (demo seed)' }
  const forecasts = [
    buildForecast(index, { name: 'Daily revenue — next 30 days', target: 'revenue', level: 'total', granularity: 'day', horizonDays: 30, model: 'AUTO', filters: {} }, settings, { now, asOf: now, id: 'fc-0002', number: 'FC-2026-0002', user: system, lk }),
    buildForecast(index, { name: 'Daily revenue — generated 14 days ago', target: 'revenue', level: 'total', granularity: 'day', horizonDays: 14, model: 'AUTO', filters: {} }, settings, { now: dayjs(now).subtract(14, 'day'), asOf: dayjs(now).subtract(14, 'day'), id: 'fc-0001', number: 'FC-2026-0001', user: system, lk }),
  ].map((f) => ({ ...f, seeded: true }))
  return {
    salesHistory,
    aiSettings: { ...DEFAULT_AI_SETTINGS },
    jarvisSettings: { ...DEFAULT_JARVIS_SETTINGS },
    forecastSettings: settings,
    models: buildModelRegistry(now),
    prediction: { ...prediction, fingerprint: inputsFingerprint(bundle, now), settings: { basis: settings.demandBasis, lookbackDays: settings.lookbackDays, horizon: settings.forecastHorizonDays, includeBaseline: true }, seeded: true },
    recommendations: recommendationsFrom(prediction),
    insights,
    forecasts,
    forecastSequence: 2,
  }
}
