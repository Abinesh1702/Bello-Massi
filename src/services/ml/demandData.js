/**
 * Turns prototype records into daily series for forecasting and predictive inventory (pure functions).
 *
 * Sources, always reported with every result:
 *  - Platform orders: orders that reached approval or later (booked sales). Drafts, submitted,
 *    returned and rejected orders are not sales.
 *  - Platform fulfilment: dispatched quantities (delivery lines) and delivered quantities (delivery
 *    confirmation), kept separate from ordered quantities.
 *  - Demo historical baseline (bellomassi_sales_history): a synthetic 180-day history generated for the
 *    prototype so forecasts have enough data. Used only for days before the first platform order so
 *    nothing is counted twice. It can be switched off in Forecast settings.
 */
import dayjs from 'dayjs'
import { dayKey, dayRange } from './timeSeries'

export const NOT_BOOKED = ['DRAFT', 'SUBMITTED', 'RETURNED', 'REJECTED']
export const isBooked = (o) => !NOT_BOOKED.includes(o.orderStatus)

const lineRevenue = (it) => Number(it.taxableAmount ?? (Number(it.orderedQuantity) || 0) * (Number(it.unitPrice) || 0)) || 0

/** Expand the compact baseline into order-like rows. */
export const expandBaseline = (history) => {
  if (!history || !Array.isArray(history.orders)) return []
  const from = dayjs(history.from)
  return history.orders.map(([offset, c, h, lines], i) => {
    const items = []
    for (let k = 0; k < lines.length; k += 2) {
      const pIdx = lines[k]
      items.push({ productId: history.products[pIdx], qty: lines[k + 1], revenue: lines[k + 1] * (history.prices[pIdx] || 0) })
    }
    return { id: `hist-${i}`, day: from.add(offset, 'day').format('YYYY-MM-DD'), customerId: history.customers[c], hubId: history.hubs[h], items }
  })
}

/**
 * One pass over every source → indexes keyed by day. Built once per data bundle.
 *  sales: [{ day, customerId, hubId, revenue, items:[{productId, category, qty, revenue}], source }]
 *  demand: Map `${productId}|${hubId}` → { ordered:{day:qty}, dispatched:{day:qty}, delivered:{day:qty} }
 */
export const buildIndex = (data, { includeBaseline = true } = {}) => {
  const P = Object.fromEntries((data.products || []).map((p) => [p.id, p]))
  const orders = data.orders || []
  const booked = orders.filter(isBooked)
  const platformDays = booked.map((o) => o.orderDate).filter(Boolean).sort()
  const platformStart = platformDays[0] || null
  const sales = []
  const demand = new Map()
  const bucket = (p, h) => {
    const k = `${p}|${h}`
    if (!demand.has(k)) demand.set(k, { ordered: {}, dispatched: {}, delivered: {} })
    return demand.get(k)
  }
  const add = (obj, day, q) => { obj[day] = (obj[day] || 0) + q }

  const history = data.salesHistory
  const baseline = includeBaseline && history?.orders ? expandBaseline(history) : []
  let baselineUsed = null
  baseline.forEach((o) => {
    if (platformStart && o.day >= platformStart) return
    baselineUsed = baselineUsed || { from: o.day, to: o.day }
    if (o.day < baselineUsed.from) baselineUsed.from = o.day
    if (o.day > baselineUsed.to) baselineUsed.to = o.day
    const items = o.items.map((it) => ({ ...it, category: P[it.productId]?.category || 'Other' }))
    sales.push({ day: o.day, customerId: o.customerId, hubId: o.hubId, revenue: items.reduce((s, it) => s + it.revenue, 0), items, source: 'baseline' })
    items.forEach((it) => {
      const b = bucket(it.productId, o.hubId)
      add(b.ordered, o.day, it.qty)
      add(b.dispatched, o.day, it.qty)
      add(b.delivered, o.day, it.qty)
    })
  })

  booked.forEach((o) => {
    const items = (o.items || []).map((it) => ({ productId: it.productId, category: P[it.productId]?.category || 'Other', qty: Number(it.orderedQuantity) || 0, revenue: lineRevenue(it) }))
    sales.push({ day: o.orderDate, customerId: o.customerId, hubId: o.hubId, revenue: items.reduce((s, it) => s + it.revenue, 0), items, source: 'platform' })
    items.forEach((it) => add(bucket(it.productId, o.hubId).ordered, o.orderDate, it.qty))
  })

  const O = Object.fromEntries(orders.map((o) => [o.id, o]))
  const D = Object.fromEntries((data.dispatches || []).map((d) => [d.id, d]))
  ;(data.deliveries || []).forEach((dl) => {
    if (dl.status === 'CANCELLED') return
    const order = O[dl.orderId]
    const dispatch = D[dl.dispatchId]
    const dispatchedAt = order?.dispatchedAt || dispatch?.confirmedAt || dispatch?.dispatchedAt || dl.startedAt
    const hubId = dl.hubId || order?.hubId
    ;(dl.items || []).forEach((it) => {
      const b = bucket(it.productId, hubId)
      if (dispatchedAt && it.dispatchedQuantity) add(b.dispatched, dayKey(dispatchedAt), Number(it.dispatchedQuantity) || 0)
      if (dl.completedAt && it.deliveredQuantity) add(b.delivered, dayKey(dl.completedAt), Number(it.deliveredQuantity) || 0)
    })
  })

  const sources = []
  if (baselineUsed) sources.push({ kind: 'demo', label: 'Demo historical baseline (synthetic)', from: baselineUsed.from, to: baselineUsed.to })
  if (platformStart) sources.push({ kind: 'platform', label: 'Platform orders & deliveries', from: platformStart, to: platformDays[platformDays.length - 1] })
  return { sales, demand, platformStart, sources, includeBaseline }
}

/** Filter predicate for a sales row + contribution of the row to the target. */
const contribution = (row, target, f) => {
  if (f.hubId && row.hubId !== f.hubId) return 0
  if (f.customerId && row.customerId !== f.customerId) return 0
  const itemMatch = (it) => (!f.productId || it.productId === f.productId) && (!f.category || it.category === f.category)
  const items = f.productId || f.category ? row.items.filter(itemMatch) : row.items
  if ((f.productId || f.category) && !items.length) return 0
  if (target === 'orders') return 1
  if (target === 'quantity') return items.reduce((s, it) => s + it.qty, 0)
  return items.reduce((s, it) => s + it.revenue, 0)
}

/**
 * Daily series for sales forecasting.
 * @returns { days, values, sources, firstDay, lastDay }
 */
export const salesSeries = (index, { target = 'revenue', filters = {}, from, to }) => {
  const days = dayRange(from, to)
  const pos = Object.fromEntries(days.map((d, i) => [d, i]))
  const values = days.map(() => 0)
  index.sales.forEach((row) => {
    const i = pos[row.day]
    if (i === undefined) return
    values[i] += contribution(row, target, filters)
  })
  const nz = days.filter((_, i) => values[i] > 0)
  return { days, values, sources: index.sources.filter((s) => s.to >= from && s.from <= to), firstDay: nz[0] || null, lastDay: nz[nz.length - 1] || null }
}

/** Daily demand for one product at one hub for the chosen basis, plus the other two for transparency. */
export const demandSeries = (index, productId, hubId, { from, to }) => {
  const days = dayRange(from, to)
  const b = index.demand.get(`${productId}|${hubId}`) || { ordered: {}, dispatched: {}, delivered: {} }
  return {
    days,
    ordered: days.map((d) => b.ordered[d] || 0),
    dispatched: days.map((d) => b.dispatched[d] || 0),
    delivered: days.map((d) => b.delivered[d] || 0),
  }
}

/** Open demand already committed on the platform: booked orders not yet dispatched (and not reserved in stock). */
export const committedOpenDemand = (orders, productId, hubId) =>
  (orders || [])
    .filter((o) => ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH'].includes(o.orderStatus) && o.hubId === hubId && !o.stockReserved)
    .reduce((s, o) => s + (o.items || []).filter((it) => it.productId === productId).reduce((q, it) => q + (Number(it.orderedQuantity) || 0), 0), 0)
