/**
 * Rule-based business insights (pure). Each insight is derived from explicit thresholds over the
 * prototype data — no model is involved. Every insight carries the permission needed to see it,
 * the supporting numbers and the data sources used.
 */
import dayjs from 'dayjs'
import { INSIGHT_STATUS, INSIGHT_TYPES as T, RISK, RISK_FLAGS } from '../../config/aiConfig'
import { VEHICLE_EXPIRY_FIELDS } from '../../config/vmsConfig'
import { mean, round, std } from './timeSeries'
import { formatCurrency } from '../../utils/formatters'

const money = (v) => formatCurrency(v)
const OPEN = ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'OUT_FOR_DELIVERY']

const revenueBetween = (index, from, to, f = () => true) => index.sales.filter((s) => s.day >= from && s.day <= to && f(s)).reduce((t, s) => t + s.revenue, 0)
const sourcesFor = (index, from) => index.sources.filter((s) => s.to >= from).map((s) => s.label)

export const generateInsights = (data, { now = dayjs(), index, prediction }) => {
  const today = dayjs(now).startOf('day')
  const d = (n) => today.subtract(n, 'day').format('YYYY-MM-DD')
  const at = dayjs(now).toISOString()
  const out = []
  const push = (x) => out.push({ generatedAt: at, ...x })

  // 1 Sales trend: last 7 complete days vs the 7 before.
  const cur = revenueBetween(index, d(7), d(1))
  const prev = revenueBetween(index, d(14), d(8))
  if (prev > 0) {
    const chg = ((cur - prev) / prev) * 100
    if (Math.abs(chg) >= 10) {
      push({
        key: 'sales-trend', type: 'SALES_TREND', severity: chg < 0 ? (chg <= -25 ? 'high' : 'medium') : 'positive', permission: 'orders.reports',
        title: `Sales ${chg < 0 ? 'decreased' : 'increased'} ${Math.abs(round(chg, 1))}% week on week`,
        description: `Booked revenue (ex-tax) for the last 7 days is ${money(cur)} against ${money(prev)} in the previous 7 days.`,
        entity: { type: 'report', id: 'sales', label: 'Order reports', path: '/reports/view/sales-register' },
        data: [{ label: 'Last 7 days', value: money(cur) }, { label: 'Previous 7 days', value: money(prev) }, { label: 'Change', value: `${round(chg, 1)}%` }],
        action: { label: chg < 0 ? 'Review customer orders' : 'Check stock for rising demand', path: chg < 0 ? '/reports/view/sales-by-customer' : '/ai/predictive-inventory' },
        sources: sourcesFor(index, d(14)),
      })
    }
  }

  // 2 Inventory shortage
  const lowRows = (prediction?.rows || []).filter((r) => r.flags.includes(RISK_FLAGS.LOW_STOCK))
  if (lowRows.length) {
    const out0 = lowRows.filter((r) => r.available <= 0).length
    push({
      key: 'inventory-shortage', type: 'INVENTORY_SHORTAGE', severity: out0 ? 'high' : 'medium', permission: 'inventory.lowstock.view',
      title: `${lowRows.length} stock lines at or below reorder level`, description: `${out0} line(s) have nothing available. Low stock is measured against each line's reorder level.`,
      entity: { type: 'page', id: 'low-stock', label: 'Low stock', path: '/inventory/low-stock' },
      data: [{ label: 'Low / out lines', value: String(lowRows.length) }, { label: 'Out of stock', value: String(out0) }],
      action: { label: 'Open low stock', path: '/inventory/low-stock' }, sources: ['Current inventory'],
    })
  }

  // 3 Unusual order activity: booked order value > mean + 2.5σ, created in the last 14 days
  const booked = (data.orders || []).filter((o) => !['DRAFT', 'REJECTED'].includes(o.orderStatus))
  const vals = booked.map((o) => Number(o.totalAmount) || 0)
  const threshold = mean(vals) + 2.5 * std(vals)
  booked.filter((o) => o.orderDate >= d(14) && (Number(o.totalAmount) || 0) > threshold && vals.length >= 10).slice(0, 2).forEach((o) => push({
    key: `unusual-order:${o.id}`, type: 'UNUSUAL_ORDERS', severity: 'medium', permission: 'orders.view', scope: { orderId: o.id },
    title: `Unusually large order ${o.orderNumber}`, description: `${o.customerName} ordered ${money(o.totalAmount)}, above the ${money(threshold)} threshold (mean + 2.5σ of ${vals.length} orders).`,
    entity: { type: 'order', id: o.id, label: o.orderNumber, path: `/orders/${o.id}` },
    data: [{ label: 'Order value', value: money(o.totalAmount) }, { label: 'Typical (mean)', value: money(mean(vals)) }],
    action: { label: 'Review order', path: `/orders/${o.id}` }, sources: ['Platform orders'],
  }))

  // 4 Delayed deliveries: open orders past their requested delivery date
  const overdue = (data.orders || []).filter((o) => OPEN.includes(o.orderStatus) && o.requestedDeliveryDate && o.requestedDeliveryDate < today.format('YYYY-MM-DD'))
  if (overdue.length) {
    push({
      key: 'delayed-deliveries', type: 'DELAYED_DELIVERIES', severity: overdue.length >= 5 ? 'high' : 'medium', permission: 'orders.view', scope: { orderIds: overdue.map((o) => o.id) },
      title: `${overdue.length} order(s) past the requested delivery date`,
      description: `Oldest: ${overdue.map((o) => o.orderNumber).slice(0, 3).join(', ')}. These are approved but not yet delivered.`,
      entity: { type: 'page', id: 'tracking', label: 'Delivery tracking', path: '/dispatch/delivery-tracking' },
      data: [{ label: 'Overdue orders', value: String(overdue.length) }, { label: 'Customers affected', value: String(new Set(overdue.map((o) => o.customerId)).size) }],
      action: { label: 'Open delivery tracking', path: '/dispatch/delivery-tracking' }, sources: ['Platform orders'],
    })
  }

  // 5 High demand / spikes
  ;(prediction?.rows || []).filter((r) => r.flags.includes(RISK_FLAGS.SPIKE)).sort((a, b) => b.last7Avg / (b.priorAvg || 1) - a.last7Avg / (a.priorAvg || 1)).slice(0, 3).forEach((r) => push({
    key: `demand-spike:${r.id}`, type: 'HIGH_DEMAND', severity: 'medium', permission: 'inventory.predictions.view',
    title: `Demand spike: ${r.productName} at ${r.hubName}`, description: `Last 7 days average ${r.last7Avg} ${r.unit}/day vs ${r.priorAvg} before (${r.basis} basis).`,
    entity: { type: 'product', id: r.productId, label: r.productName, path: `/products/${r.productId}` },
    data: [{ label: 'Last 7-day avg', value: `${r.last7Avg}/day` }, { label: 'Earlier avg', value: `${r.priorAvg}/day` }, { label: 'Coverage', value: r.coverageDays === null ? '—' : `${r.coverageDays} days` }],
    action: { label: 'View prediction', path: `/ai/predictive-inventory?q=${encodeURIComponent(r.productCode)}` }, sources: sourcesFor(index, d(56)),
  }))

  // 6 Low-performing products: active products with no booked sales in 30 days
  const sold = new Set(index.sales.filter((s) => s.day >= d(30)).flatMap((s) => s.items.map((it) => it.productId)))
  const idle = (data.products || []).filter((p) => p.status === 'Active' && !sold.has(p.id))
  if (idle.length) {
    push({
      key: 'low-performing', type: 'LOW_PERFORMING', severity: 'low', permission: 'products.view',
      title: `${idle.length} active product(s) with no sales in 30 days`, description: `${idle.slice(0, 4).map((p) => p.name).join(', ')}${idle.length > 4 ? '…' : ''}.`,
      entity: { type: 'page', id: 'products', label: 'Products', path: '/products' },
      data: idle.slice(0, 5).map((p) => ({ label: p.code, value: p.name })),
      action: { label: 'Review products', path: '/products' }, sources: sourcesFor(index, d(30)),
    })
  }

  // 7 Customer trend: biggest decline, last 30 vs previous 30 days
  const custRev = (from, to) => {
    const m = {}
    index.sales.filter((s) => s.day >= from && s.day <= to).forEach((s) => { m[s.customerId] = (m[s.customerId] || 0) + s.revenue })
    return m
  }
  const a = custRev(d(30), d(1))
  const b = custRev(d(60), d(31))
  const C = Object.fromEntries((data.customers || []).map((c) => [c.id, c]))
  const changes = Object.keys(b).filter((id) => b[id] > 0 && C[id]).map((id) => ({ id, cur: a[id] || 0, prev: b[id], pct: (((a[id] || 0) - b[id]) / b[id]) * 100 }))
  const worst = changes.sort((x, y) => x.pct - y.pct)[0]
  if (worst && worst.pct <= -20) {
    push({
      key: `customer-decline:${worst.id}`, type: 'CUSTOMER_TREND', severity: worst.pct <= -50 ? 'high' : 'medium', permission: 'customers.view', scope: { customerId: worst.id },
      title: `${C[worst.id].name} ordering ${Math.abs(round(worst.pct))}% less`, description: `${money(worst.cur)} in the last 30 days vs ${money(worst.prev)} in the 30 days before.`,
      entity: { type: 'customer', id: worst.id, label: C[worst.id].name, path: `/customers/${worst.id}` },
      data: [{ label: 'Last 30 days', value: money(worst.cur) }, { label: 'Previous 30 days', value: money(worst.prev) }],
      action: { label: 'Open customer', path: `/customers/${worst.id}` }, sources: sourcesFor(index, d(60)),
    })
  }
  const best = [...changes].sort((x, y) => y.pct - x.pct)[0]
  if (best && best.pct >= 25) {
    push({
      key: `customer-growth:${best.id}`, type: 'CUSTOMER_TREND', severity: 'positive', permission: 'customers.view', scope: { customerId: best.id },
      title: `${C[best.id].name} up ${round(best.pct)}% month on month`, description: `${money(best.cur)} in the last 30 days vs ${money(best.prev)} before.`,
      entity: { type: 'customer', id: best.id, label: C[best.id].name, path: `/customers/${best.id}` },
      data: [{ label: 'Last 30 days', value: money(best.cur) }, { label: 'Previous 30 days', value: money(best.prev) }],
      action: { label: 'Open customer', path: `/customers/${best.id}` }, sources: sourcesFor(index, d(60)),
    })
  }

  // 8 Stock-out risk (critical lines)
  ;(prediction?.rows || []).filter((r) => r.risk === RISK.CRITICAL && r.avgDaily > 0).sort((x, y) => (x.coverageDays ?? 0) - (y.coverageDays ?? 0)).slice(0, 5).forEach((r) => push({
    key: `stockout:${r.id}`, type: 'STOCKOUT_RISK', severity: 'critical', permission: 'inventory.predictions.view',
    title: `${r.productName} at ${r.hubName} may run out ${r.daysUntilStockout <= 0 ? 'now' : `in ~${r.daysUntilStockout} days`}`,
    description: `${r.reason} Recommended reorder: ${r.recommendedQty} ${r.unit}.`,
    entity: { type: 'product', id: r.productId, label: r.productName, path: `/products/${r.productId}` },
    data: [{ label: 'Available', value: `${r.available} ${r.unit}` }, { label: 'Forecast/day', value: String(r.forecastDaily) }, { label: 'Lead time', value: `${r.leadTimeDays} days` }, { label: 'Stock-out date', value: r.stockoutDate ? dayjs(r.stockoutDate).format('DD MMM') : '—' }],
    action: { label: 'Review reorder', path: '/ai/predictive-inventory/reorder' }, sources: sourcesFor(index, d(56)),
  }))

  // 9 Excess inventory
  const excess = (prediction?.rows || []).filter((r) => r.flags.includes(RISK_FLAGS.EXCESS) || r.flags.includes(RISK_FLAGS.NON_MOVING))
  if (excess.length) {
    const tied = excess.reduce((s, r) => s + (r.impact?.kind === 'capital_tied' ? r.impact.value : 0), 0)
    push({
      key: 'excess-inventory', type: 'EXCESS_INVENTORY', severity: 'low', permission: 'inventory.predictions.view',
      title: `${excess.length} stock line(s) hold excess or non-moving stock`, description: `About ${money(tied)} is tied up above target stock (valued at purchase price).`,
      entity: { type: 'page', id: 'risks', label: 'Inventory risks', path: '/ai/predictive-inventory/risks' },
      data: [{ label: 'Lines', value: String(excess.length) }, { label: 'Capital above target', value: money(tied) }],
      action: { label: 'Open risk analysis', path: '/ai/predictive-inventory/risks?flag=excess' }, sources: ['Current inventory', ...sourcesFor(index, d(56))],
    })
  }

  // 10 Vehicle document expiry (≤ 30 days or expired)
  const exp = []
  ;(data.vehicles || []).filter((v) => v.status !== 'Inactive').forEach((v) => VEHICLE_EXPIRY_FIELDS.forEach((f) => {
    if (!v[f.field]) return
    const days = dayjs(v[f.field]).startOf('day').diff(today, 'day')
    if (days <= 30) exp.push({ v, f, days })
  }))
  if (exp.length) {
    const expired = exp.filter((x) => x.days < 0)
    push({
      key: 'vehicle-docs', type: 'VEHICLE_DOCS', severity: expired.length ? 'high' : 'medium', permission: 'vms.view',
      title: `${exp.length} vehicle document(s) expired or expiring within 30 days`,
      description: `${expired.length} already expired. ${exp.slice(0, 3).map((x) => `${x.v.vehicleNumber} ${x.f.label}`).join(', ')}.`,
      entity: { type: 'page', id: 'expiry', label: 'Document expiry', path: '/vms/document-expiry' },
      data: [{ label: 'Expired', value: String(expired.length) }, { label: 'Expiring ≤ 30 days', value: String(exp.length - expired.length) }],
      action: { label: 'Open expiry register', path: '/vms/document-expiry' }, sources: ['Vehicle master'],
    })
  }

  // 11 Order backlog
  const pending = (data.orders || []).filter((o) => o.orderStatus === 'SUBMITTED')
  const oldPending = pending.filter((o) => o.submittedAt && dayjs(now).diff(dayjs(o.submittedAt), 'hour') >= 24)
  const ready = (data.orders || []).filter((o) => o.orderStatus === 'READY_FOR_DISPATCH')
  if (pending.length + ready.length) {
    push({
      key: 'order-backlog', type: 'ORDER_BACKLOG', severity: oldPending.length ? 'medium' : 'low', permission: 'orders.view',
      title: `${pending.length} order(s) awaiting approval, ${ready.length} ready for dispatch`,
      description: `${oldPending.length} approval request(s) have waited more than 24 hours.`,
      entity: { type: 'page', id: 'approval', label: 'Order approval', path: '/orders/approval' },
      data: [{ label: 'Awaiting approval', value: String(pending.length) }, { label: 'Waiting > 24 h', value: String(oldPending.length) }, { label: 'Ready for dispatch', value: String(ready.length) }],
      action: { label: 'Open approvals', path: '/orders/approval' }, sources: ['Platform orders'],
    })
  }

  return out.map((x) => ({ ...x, typeLabel: T[x.type], demo: (x.sources || []).some((s) => /demo/i.test(s)) }))
}

/**
 * Merge a fresh run into stored insights: keeps review status, reopens a resolved insight that is
 * detected again on a later day, and auto-resolves insights whose condition has gone.
 */
export const mergeInsights = (existing = [], fresh = [], { now = dayjs() } = {}) => {
  const at = dayjs(now).toISOString()
  const byKey = Object.fromEntries(existing.map((x) => [x.key, x]))
  const freshKeys = new Set(fresh.map((x) => x.key))
  const merged = fresh.map((x) => {
    const old = byKey[x.key]
    if (!old) return { ...x, id: `ins-${x.key.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`, status: INSIGHT_STATUS.NEW, firstSeenAt: at, history: [{ at, status: INSIGHT_STATUS.NEW, by: 'system', note: 'Detected' }] }
    const reopen = old.status === INSIGHT_STATUS.RESOLVED && dayjs(old.statusAt || old.generatedAt).isBefore(dayjs(now), 'day')
    return {
      ...old, ...x, id: old.id, firstSeenAt: old.firstSeenAt,
      status: reopen ? INSIGHT_STATUS.NEW : old.status,
      statusAt: reopen ? at : old.statusAt, statusBy: reopen ? null : old.statusBy,
      history: reopen ? [...(old.history || []), { at, status: INSIGHT_STATUS.NEW, by: 'system', note: 'Detected again after resolution' }] : old.history || [],
    }
  })
  existing.filter((x) => !freshKeys.has(x.key)).forEach((x) => {
    merged.push(x.status === INSIGHT_STATUS.RESOLVED ? x : { ...x, status: INSIGHT_STATUS.RESOLVED, statusAt: at, statusBy: 'system', history: [...(x.history || []), { at, status: INSIGHT_STATUS.RESOLVED, by: 'system', note: 'Condition no longer detected' }] })
  })
  return merged
}
