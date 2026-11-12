/**
 * AI tool registry — the only way the assistant and Jarvis read or change data.
 *
 * Every tool: validates input → checks the user's permissions (and per-record scope) → returns a
 * structured result → logs execution. Read tools run directly when authorised. Write tools return a
 * confirmation proposal first and execute only when called again with confirmed: true.
 * There is no tool that runs arbitrary code, shell commands or unrestricted queries.
 *
 * Result shape: { ok, title, text, kpis[], table{columns,rows}, chart{kind,xKey,series,data}, actions[],
 *                 warnings[], sources[], confidence, navigate, context (compact, for an AI provider) }
 */
import dayjs from 'dayjs'
import { can } from '../../config/permissions'
import { canAccessPath, NAV_ITEMS } from '../../config/navigation'
import { ORDER_STATUS_META } from '../../utils/constants'
import { RECOMMENDATION_STATUS, RISK, RISK_META } from '../../config/aiConfig'
import { buildStockRows } from '../inventoryService'
import { canViewOrder } from '../orderService'
import { approveOrder, canDecide, getApprovalChecks, rejectOrder } from '../approvalService'
import { expiryRegister } from '../complianceService'
import { getNotificationsForUser } from '../notificationService'
import { logAiActivity } from './aiActivityService'
import { getDataBundle, getForecastSettings, getIndex } from './dataBundle'
import { previewForecast } from './forecastService'
import { ensureFreshPrediction, getRecommendations } from './inventoryPredictionService'
import { createDraft } from './replenishmentService'
import { periodLabel, round } from '../ml/timeSeries'
import { formatCurrency } from '../../utils/formatters'
import { getLocaleConfig } from '../../config/runtimeConfig'
import { scopeOf } from '../rbacService'

const money = (v) => formatCurrency(v)
const num = (v) => (Number(v) || 0).toLocaleString(getLocaleConfig().numberLocale, { maximumFractionDigits: 1 })
const anyPerm = (role, perms) => perms.some((p) => can(role, p))
const statusLabel = (s) => ORDER_STATUS_META[s]?.label || s
const NOT_BOOKED = ['DRAFT', 'SUBMITTED', 'RETURNED', 'REJECTED']
const OPEN_DELIVERY = ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'OUT_FOR_DELIVERY']
const PLATFORM = 'Platform data (live, this browser)'

const periodRange = (period, now = dayjs()) => {
  const t = now.startOf('day')
  switch (period) {
    case 'today': return { from: t.format('YYYY-MM-DD'), to: t.format('YYYY-MM-DD'), label: 'today' }
    case 'yesterday': return { from: t.subtract(1, 'day').format('YYYY-MM-DD'), to: t.subtract(1, 'day').format('YYYY-MM-DD'), label: 'yesterday' }
    case 'week': return { from: t.subtract(6, 'day').format('YYYY-MM-DD'), to: t.format('YYYY-MM-DD'), label: 'the last 7 days' }
    case 'month': return { from: t.startOf('month').format('YYYY-MM-DD'), to: t.format('YYYY-MM-DD'), label: t.format('MMMM YYYY') }
    case 'last_month': return { from: t.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'), to: t.subtract(1, 'month').endOf('month').format('YYYY-MM-DD'), label: t.subtract(1, 'month').format('MMMM YYYY') }
    case 'year': return { from: t.startOf('year').format('YYYY-MM-DD'), to: t.format('YYYY-MM-DD'), label: String(t.year()) }
    default: return { from: t.subtract(29, 'day').format('YYYY-MM-DD'), to: t.format('YYYY-MM-DD'), label: 'the last 30 days' }
  }
}

/** Orders the user may see (same scoping as the Orders module). Drafts are private to their author. */
const visibleOrders = (ctx) => ctx.bundle.orders.filter((o) => canViewOrder(ctx.user, o) && (o.orderStatus !== 'DRAFT' || o.createdBy === ctx.user.id))
const visibleCustomers = (ctx) => (scopeOf(ctx.user) === 'SALESMAN' ? ctx.bundle.customers.filter((c) => c.salesRepId === ctx.user.id) : ctx.bundle.customers)

const orderTable = (orders) => ({
  columns: [{ key: 'orderNumber', label: 'Order' }, { key: 'customerName', label: 'Customer' }, { key: 'orderDate', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'value', label: 'Value', align: 'right' }],
  rows: orders.map((o) => ({ id: o.id, orderNumber: o.orderNumber, customerName: o.customerName, orderDate: dayjs(o.orderDate).format('DD MMM'), status: statusLabel(o.orderStatus), value: money(o.totalAmount), _path: `/orders/${o.id}` })),
})

/* ---------------- param validation ---------------- */

const validate = (spec = {}, args = {}) => {
  const out = {}
  const errors = []
  Object.entries(spec).forEach(([k, s]) => {
    let v = args[k]
    if (v === undefined || v === null || v === '') {
      if (s.required) errors.push(`${k} is required`)
      if (s.default !== undefined) out[k] = s.default
      return
    }
    if (s.type === 'number') {
      v = Number(v)
      if (!Number.isFinite(v)) { errors.push(`${k} must be a number`); return }
      if (s.min !== undefined && v < s.min) v = s.min
      if (s.max !== undefined && v > s.max) v = s.max
    } else if (s.type === 'string') {
      v = String(v).slice(0, s.max || 120)
    } else if (s.type === 'array') {
      if (!Array.isArray(v)) { errors.push(`${k} must be a list`); return }
      v = v.slice(0, s.max || 50)
    } else if (s.type === 'boolean') v = Boolean(v)
    if (s.enum && !s.enum.includes(v)) { errors.push(`${k} must be one of ${s.enum.join(', ')}`); return }
    out[k] = v
  })
  return { args: out, errors }
}

/* ---------------- tools ---------------- */

export const TOOLS = {
  get_dashboard_summary: {
    label: 'Business summary', kind: 'read', permissions: ['ai.assistant.use'],
    description: "Today's orders, approvals, dispatch, deliveries, stock and compliance — limited to what the user may see.",
    params: {},
    run: (_a, ctx) => {
      const { user } = ctx
      const today = dayjs().format('YYYY-MM-DD')
      const orders = visibleOrders(ctx)
      const todays = orders.filter((o) => o.orderDate === today && o.orderStatus !== 'DRAFT')
      const kpis = [
        { label: "Today's orders", value: String(todays.length), hint: money(todays.reduce((s, o) => s + (o.totalAmount || 0), 0)) },
      ]
      const lines = [`${todays.length} order(s) placed today worth ${money(todays.reduce((s, o) => s + (o.totalAmount || 0), 0))}.`]
      if (can(user, 'orders.approval.view')) {
        const p = orders.filter((o) => o.orderStatus === 'SUBMITTED').length
        kpis.push({ label: 'Awaiting approval', value: String(p), path: '/orders/approval' }); lines.push(`${p} awaiting approval.`)
      }
      const ready = orders.filter((o) => o.orderStatus === 'READY_FOR_DISPATCH').length
      const transit = orders.filter((o) => ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length
      const deliveredToday = orders.filter((o) => o.deliveredAt && dayjs(o.deliveredAt).format('YYYY-MM-DD') === today).length
      kpis.push({ label: 'Ready for dispatch', value: String(ready) }, { label: 'Out for delivery', value: String(transit) }, { label: 'Delivered today', value: String(deliveredToday) })
      lines.push(`${ready} ready for dispatch, ${transit} on the road, ${deliveredToday} delivered today.`)
      const warnings = []
      if (anyPerm(user, ['inventory.lowstock.view'])) {
        const rows = buildStockRows(ctx.bundle.inventory, ctx.bundle.products, ctx.bundle.hubs).filter((r) => r.status === 'Low Stock' || r.status === 'Out of Stock')
        kpis.push({ label: 'Low / out of stock lines', value: String(rows.length), path: '/inventory/low-stock', tone: rows.length ? 'warning' : 'success' })
      }
      if (can(user, 'inventory.predictions.view')) {
        const pred = ensureFreshPrediction()
        const crit = pred?.summary?.byRisk?.CRITICAL || 0
        if (crit) warnings.push(`${crit} stock line(s) are at critical stock-out risk (statistical prediction).`)
      }
      if (can(user, 'vms.view')) {
        const exp = expiryRegister({ vehicles: ctx.bundle.vehicles, drivers: ctx.bundle.drivers }).filter((r) => r.state === 'EXPIRED' && r.required)
        if (exp.length) warnings.push(`${exp.length} required vehicle/driver document(s) have expired.`)
      }
      if (can(user, 'invoices.view')) {
        const inv = ctx.bundle.invoices.filter((i) => i.status === 'ISSUED' && dayjs(i.issuedAt || i.createdAt).format('YYYY-MM-DD') === today)
        kpis.push({ label: 'Invoices issued today', value: String(inv.length) })
      }
      return { title: `Business summary · ${dayjs().format('DD MMM YYYY')}`, text: lines.join(' '), kpis, warnings, sources: [PLATFORM], actions: [{ type: 'navigate', label: 'Open dashboard', path: '/dashboard' }], navigate: '/dashboard' }
    },
  },

  get_orders: {
    label: 'Find orders', kind: 'read', permissions: ['orders.view'],
    description: 'Orders filtered by status, period, customer or number (only orders the user may see).',
    params: { status: { type: 'string' }, period: { type: 'string', enum: ['today', 'yesterday', 'week', 'month', 'last_month', 'year', 'all'] }, q: { type: 'string' }, limit: { type: 'number', min: 1, max: 50, default: 10 } },
    run: (a, ctx) => {
      let orders = visibleOrders(ctx)
      const statuses = a.status ? a.status.split(',') : null
      if (statuses) orders = orders.filter((o) => statuses.includes(o.orderStatus))
      let label = ''
      if (a.period && a.period !== 'all') {
        const r = periodRange(a.period)
        orders = orders.filter((o) => o.orderDate >= r.from && o.orderDate <= r.to)
        label = ` for ${r.label}`
      }
      if (a.q) {
        const q = a.q.toLowerCase()
        orders = orders.filter((o) => [o.orderNumber, o.customerName, o.customerCode].some((v) => String(v || '').toLowerCase().includes(q)))
      }
      orders = [...orders].sort((x, y) => (x.createdAt < y.createdAt ? 1 : -1))
      const total = orders.reduce((s, o) => s + (o.totalAmount || 0), 0)
      const stTxt = statuses ? statuses.map(statusLabel).join(' / ') : 'all statuses'
      const params = new URLSearchParams()
      if (statuses?.length === 1) params.set('status', statuses[0])
      if (a.period && a.period !== 'all') { const r = periodRange(a.period); params.set('from', r.from); params.set('to', r.to) }
      if (a.q) params.set('q', a.q)
      const path = statuses?.length === 1 && statuses[0] === 'SUBMITTED' && can(ctx.user, 'orders.approval.view') ? '/orders/approval' : `/orders${params.toString() ? `?${params}` : ''}`
      return {
        title: `Orders (${stTxt})${label}`,
        text: orders.length ? `${orders.length} order(s)${label}, total ${money(total)}.` : `No orders match (${stTxt}${label}).`,
        kpis: [{ label: 'Orders', value: String(orders.length) }, { label: 'Value', value: money(total) }],
        table: orders.length ? { ...orderTable(orders.slice(0, a.limit)), total: orders.length } : null,
        actions: [{ type: 'navigate', label: 'Open order list', path }],
        sources: [PLATFORM], navigate: path,
        context: { count: orders.length, total, orders: orders.slice(0, 8).map((o) => ({ n: o.orderNumber, c: o.customerName, s: o.orderStatus, v: o.totalAmount, d: o.orderDate })) },
      }
    },
  },

  search_customer: {
    label: 'Search customers', kind: 'read', permissions: ['customers.view'],
    description: 'Find customers by name, code, city or mobile.',
    params: { q: { type: 'string', required: true, max: 60 } },
    run: (a, ctx) => {
      const q = a.q.toLowerCase().trim()
      const list = visibleCustomers(ctx).filter((c) => [c.name, c.businessName, c.code, c.city, c.mobile, c.contactPerson].some((v) => String(v || '').toLowerCase().includes(q)))
      const orders = visibleOrders(ctx)
      return {
        title: `Customers matching “${a.q}”`,
        text: list.length ? `${list.length} customer(s) found.` : `No customer you can access matches “${a.q}”.`,
        table: list.length ? {
          columns: [{ key: 'name', label: 'Customer' }, { key: 'code', label: 'Code' }, { key: 'city', label: 'City' }, { key: 'orders', label: 'Orders', align: 'right' }, { key: 'status', label: 'Status' }],
          rows: list.slice(0, 15).map((c) => ({ id: c.id, name: c.name, code: c.code, city: c.city, orders: String(orders.filter((o) => o.customerId === c.id).length), status: c.status, _path: `/customers/${c.id}` })),
          total: list.length,
        } : null,
        actions: list.length === 1 ? [{ type: 'navigate', label: `Open ${list[0].name}`, path: `/customers/${list[0].id}` }] : [{ type: 'navigate', label: 'Open customer list', path: `/customers?q=${encodeURIComponent(a.q)}` }],
        navigate: list.length === 1 ? `/customers/${list[0].id}` : `/customers?q=${encodeURIComponent(a.q)}`,
        sources: [PLATFORM], context: list.slice(0, 8).map((c) => ({ name: c.name, code: c.code, city: c.city, status: c.status })),
      }
    },
  },

  search_product: {
    label: 'Search products', kind: 'read', permissions: ['products.view'],
    description: 'Find products by name, code, SKU or category with stock on hand.',
    params: { q: { type: 'string', required: true, max: 60 } },
    run: (a, ctx) => {
      const q = a.q.toLowerCase().trim()
      const list = ctx.bundle.products.filter((p) => [p.name, p.code, p.sku, p.category, p.brand].some((v) => String(v || '').toLowerCase().includes(q)))
      const stock = (pid) => ctx.bundle.inventory.filter((r) => r.productId === pid).reduce((s, r) => s + (r.totalQuantity || 0), 0)
      const canStock = can(ctx.user, 'inventory.stock.view')
      return {
        title: `Products matching “${a.q}”`,
        text: list.length ? `${list.length} product(s) found.` : `No product matches “${a.q}”.`,
        table: list.length ? {
          columns: [{ key: 'name', label: 'Product' }, { key: 'code', label: 'Code' }, { key: 'category', label: 'Category' }, ...(canStock ? [{ key: 'stock', label: 'On hand', align: 'right' }] : []), { key: 'status', label: 'Status' }],
          rows: list.slice(0, 15).map((p) => ({ id: p.id, name: p.name, code: p.code, category: p.category, stock: canStock ? `${num(stock(p.id))} ${p.unit}` : undefined, status: p.status, _path: `/products/${p.id}` })),
          total: list.length,
        } : null,
        actions: list.length === 1 ? [{ type: 'navigate', label: 'View product', path: `/products/${list[0].id}` }, ...(canStock ? [{ type: 'navigate', label: 'View inventory', path: `/inventory/stock?productId=${list[0].id}` }] : [])] : [{ type: 'navigate', label: 'Open products', path: '/products' }],
        navigate: list.length === 1 ? `/products/${list[0].id}` : '/products',
        sources: [PLATFORM], context: list.slice(0, 8).map((p) => ({ name: p.name, code: p.code, category: p.category, stock: canStock ? stock(p.id) : undefined })),
      }
    },
  },

  get_inventory: {
    label: 'Inventory overview', kind: 'read', permissions: ['inventory.stock.view'],
    description: 'Available stock by hub, category or product; can explain why stock is going down.',
    params: { groupBy: { type: 'string', enum: ['hub', 'category', 'product'], default: 'hub' }, productId: { type: 'string' }, hubId: { type: 'string' }, explain: { type: 'boolean' } },
    run: (a, ctx) => {
      const rows = buildStockRows(ctx.bundle.inventory, ctx.bundle.products, ctx.bundle.hubs).filter((r) => (!a.productId || r.productId === a.productId) && (!a.hubId || r.hubId === a.hubId))
      if (a.explain) {
        if (!can(ctx.user, 'inventory.movements.view')) return { title: 'Why inventory is changing', text: 'Explaining stock changes needs access to stock movements, which your role does not have.', warnings: ['Permission: inventory.movements.view'], sources: [] }
        const since = dayjs().subtract(30, 'day')
        const mv = ctx.bundle.movements.filter((m) => dayjs(m.date).isAfter(since) && (!a.productId || m.productId === a.productId) && (!a.hubId || m.hubId === a.hubId))
        const IN = ['Stock Receipt', 'Stock Transfer In', 'Stock Adjustment Increase', 'Stock Dispatch Reversal', 'Delivery Return']
        const by = {}
        mv.forEach((m) => { by[m.movementType] = (by[m.movementType] || 0) + (IN.includes(m.movementType) ? 1 : -1) * (Number(m.quantity) || 0) })
        const entries = Object.entries(by).sort((x, y) => x[1] - y[1])
        const net = entries.reduce((s, [, v]) => s + v, 0)
        const out = entries.filter(([, v]) => v < 0)
        const committed = ctx.bundle.orders.filter((o) => ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH'].includes(o.orderStatus) && (!a.hubId || o.hubId === a.hubId)).reduce((s, o) => s + (o.items || []).filter((it) => !a.productId || it.productId === a.productId).reduce((q, it) => q + (it.orderedQuantity || 0), 0), 0)
        return {
          title: 'Why inventory is changing (last 30 days)',
          text: `Recorded stock movements changed on-hand stock by ${net >= 0 ? '+' : ''}${num(net)} units. ${out.length ? `The biggest reductions were ${out.slice(0, 3).map(([t, v]) => `${t.toLowerCase()} (${num(v)})`).join(', ')}.` : 'There were no reductions.'} A further ${num(committed)} units are committed to approved orders not yet dispatched, which will reduce available stock next.`,
          chart: { kind: 'bar', xKey: 'type', series: [{ key: 'qty', label: 'Units' }], data: entries.map(([type, qty]) => ({ type, qty: round(qty) })) },
          table: { columns: [{ key: 'type', label: 'Movement type' }, { key: 'qty', label: 'Net units', align: 'right' }], rows: entries.map(([type, qty]) => ({ id: type, type, qty: num(qty) })) },
          actions: [{ type: 'navigate', label: 'Open stock movements', path: '/inventory/movements' }],
          sources: ['Stock movements (platform)', 'Approved orders'], context: { net, byType: by, committed },
        }
      }
      const key = a.groupBy === 'category' ? 'category' : a.groupBy === 'product' ? 'productName' : 'hubName'
      const groups = {}
      rows.forEach((r) => {
        const g = (groups[r[key]] ||= { name: r[key], available: 0, onHand: 0, value: 0, lines: 0 })
        g.available += r.available; g.onHand += r.totalQuantity; g.value += r.value; g.lines += 1
      })
      const list = Object.values(groups).sort((x, y) => y.onHand - x.onHand)
      const top = list[0]
      return {
        title: `Inventory by ${a.groupBy}`,
        text: top ? `${top.name} holds the most stock: ${num(top.onHand)} units on hand (${num(top.available)} available), valued at ${money(top.value)}. Total across ${list.length} ${a.groupBy === 'hub' ? 'hubs' : 'groups'}: ${num(list.reduce((s, g) => s + g.onHand, 0))} units, ${money(list.reduce((s, g) => s + g.value, 0))}.` : 'No stock records.',
        kpis: [{ label: 'Units on hand', value: num(list.reduce((s, g) => s + g.onHand, 0)) }, { label: 'Available', value: num(list.reduce((s, g) => s + g.available, 0)) }, { label: 'Stock value (cost)', value: money(list.reduce((s, g) => s + g.value, 0)) }],
        chart: { kind: 'bar', xKey: 'name', series: [{ key: 'onHand', label: 'On hand' }, { key: 'available', label: 'Available' }], data: list.slice(0, 10).map((g) => ({ name: g.name, onHand: round(g.onHand), available: round(g.available) })) },
        table: { columns: [{ key: 'name', label: a.groupBy === 'hub' ? 'Hub' : a.groupBy === 'category' ? 'Category' : 'Product' }, { key: 'onHand', label: 'On hand', align: 'right' }, { key: 'available', label: 'Available', align: 'right' }, { key: 'value', label: 'Value', align: 'right' }], rows: list.slice(0, 15).map((g) => ({ id: g.name, name: g.name, onHand: num(g.onHand), available: num(g.available), value: money(g.value) })), total: list.length },
        actions: [{ type: 'navigate', label: 'Open stock overview', path: '/inventory/stock' }],
        navigate: '/inventory/stock', sources: ['Current inventory (platform)'], context: list.slice(0, 10),
      }
    },
  },

  get_low_stock: {
    label: 'Low stock', kind: 'read', permissions: ['inventory.lowstock.view', 'inventory.stock.view'],
    description: 'Stock lines at or below their reorder level, or out of stock.',
    params: { hubId: { type: 'string' } },
    run: (a, ctx) => {
      const rows = buildStockRows(ctx.bundle.inventory, ctx.bundle.products, ctx.bundle.hubs).filter((r) => (r.status === 'Low Stock' || r.status === 'Out of Stock') && (!a.hubId || r.hubId === a.hubId)).sort((x, y) => x.available - y.available)
      const path = can(ctx.user, 'inventory.lowstock.view') ? '/inventory/low-stock' : `/inventory/stock?status=${encodeURIComponent('Low Stock')}`
      return {
        title: 'Low stock products',
        text: rows.length ? `${rows.length} stock line(s) are low or out: ${rows.filter((r) => r.status === 'Out of Stock').length} out of stock.` : 'No stock line is at or below its reorder level.',
        table: rows.length ? { columns: [{ key: 'product', label: 'Product' }, { key: 'hub', label: 'Hub' }, { key: 'available', label: 'Available', align: 'right' }, { key: 'reorder', label: 'Reorder at', align: 'right' }, { key: 'status', label: 'Status' }], rows: rows.slice(0, 20).map((r) => ({ id: r.id, product: r.productName, hub: r.hubName, available: `${num(r.available)} ${r.unit}`, reorder: num(r.reorderLevel), status: r.status, _path: `/inventory/stock/${r.id}` })), total: rows.length } : null,
        actions: [{ type: 'navigate', label: 'Open low stock', path }, ...(can(ctx.user, 'inventory.predictions.view') ? [{ type: 'navigate', label: 'View reorder recommendations', path: '/ai/predictive-inventory/reorder' }] : [])],
        navigate: path, sources: ['Current inventory (platform)'], context: rows.slice(0, 10).map((r) => ({ p: r.productName, h: r.hubName, available: r.available, reorderLevel: r.reorderLevel })),
      }
    },
  },

  get_dispatches: {
    label: 'Dispatches', kind: 'read', permissions: ['dispatch.view'],
    description: 'Dispatch plans by status; "pending" means planned, assigned or confirmed but not yet on the road.',
    params: { status: { type: 'string', enum: ['pending', 'active', 'all'], default: 'pending' } },
    run: (a, ctx) => {
      const map = { pending: ['DRAFT', 'PLANNED', 'ASSIGNED', 'CONFIRMED'], active: ['IN_TRANSIT', 'PARTIALLY_DELIVERED'], all: null }
      const st = map[a.status]
      const list = ctx.bundle.dispatches.filter((d) => !st || st.includes(d.status)).sort((x, y) => (x.dispatchDate > y.dispatchDate ? 1 : -1))
      const ready = visibleOrders(ctx).filter((o) => o.orderStatus === 'READY_FOR_DISPATCH' && !o.dispatchId).length
      return {
        title: a.status === 'pending' ? 'Pending dispatches' : a.status === 'active' ? 'Dispatches on the road' : 'Dispatches',
        text: `${list.length} dispatch(es) ${a.status === 'pending' ? 'not yet on the road' : a.status === 'active' ? 'in transit' : 'in total'}. ${ready} ready order(s) are not yet planned on any dispatch.`,
        kpis: [{ label: 'Dispatches', value: String(list.length) }, { label: 'Unplanned ready orders', value: String(ready), path: '/dispatch/ready-orders' }],
        table: list.length ? { columns: [{ key: 'n', label: 'Dispatch' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'orders', label: 'Orders', align: 'right' }], rows: list.slice(0, 15).map((d) => ({ id: d.id, n: d.dispatchNumber, date: dayjs(d.dispatchDate).format('DD MMM'), status: d.status.replace(/_/g, ' ').toLowerCase(), orders: String(d.orderIds.length), _path: `/dispatch/${d.id}` })), total: list.length } : null,
        actions: [{ type: 'navigate', label: 'Open dispatch planning', path: '/dispatch/planning' }],
        navigate: '/dispatch/planning', sources: [PLATFORM], context: { count: list.length, unplannedReady: ready },
      }
    },
  },

  get_deliveries: {
    label: 'Deliveries', kind: 'read', permissions: ['dispatch.tracking', 'orders.view'],
    description: 'Delayed / overdue deliveries (open orders past their requested delivery date), optionally by customer.',
    params: { delayed: { type: 'boolean', default: true }, groupBy: { type: 'string', enum: ['order', 'customer'], default: 'order' } },
    run: (a, ctx) => {
      const today = dayjs().format('YYYY-MM-DD')
      const orders = visibleOrders(ctx).filter((o) => OPEN_DELIVERY.includes(o.orderStatus) && (!a.delayed || (o.requestedDeliveryDate && o.requestedDeliveryDate < today)))
      const late = visibleOrders(ctx).filter((o) => o.onTime === false).length
      if (a.groupBy === 'customer') {
        const by = {}
        orders.forEach((o) => { const g = (by[o.customerId] ||= { id: o.customerId, name: o.customerName, orders: 0, oldest: o.requestedDeliveryDate }); g.orders += 1; if (o.requestedDeliveryDate < g.oldest) g.oldest = o.requestedDeliveryDate })
        const list = Object.values(by).sort((x, y) => y.orders - x.orders)
        return {
          title: 'Customers with overdue deliveries', text: list.length ? `${list.length} customer(s) have ${orders.length} overdue order(s).` : 'No customer has an overdue delivery.',
          table: list.length ? { columns: [{ key: 'name', label: 'Customer' }, { key: 'orders', label: 'Overdue orders', align: 'right' }, { key: 'oldest', label: 'Oldest due' }], rows: list.map((g) => ({ id: g.id, name: g.name, orders: String(g.orders), oldest: dayjs(g.oldest).format('DD MMM'), _path: `/customers/${g.id}` })) } : null,
          actions: [{ type: 'navigate', label: 'Open delivery tracking', path: '/dispatch/delivery-tracking' }], navigate: '/dispatch/delivery-tracking', sources: [PLATFORM], context: list,
        }
      }
      return {
        title: a.delayed ? 'Delayed deliveries' : 'Open deliveries',
        text: orders.length ? `${orders.length} order(s) are ${a.delayed ? 'past their requested delivery date and not yet delivered' : 'open'}. ${late} delivered order(s) arrived late historically.` : `No ${a.delayed ? 'delayed' : 'open'} deliveries. ${late} delivered order(s) arrived late historically.`,
        table: orders.length ? { ...orderTable(orders), columns: [{ key: 'orderNumber', label: 'Order' }, { key: 'customerName', label: 'Customer' }, { key: 'due', label: 'Requested' }, { key: 'status', label: 'Status' }], rows: orders.map((o) => ({ id: o.id, orderNumber: o.orderNumber, customerName: o.customerName, due: dayjs(o.requestedDeliveryDate).format('DD MMM'), status: statusLabel(o.orderStatus), _path: `/orders/${o.id}` })) } : null,
        actions: can(ctx.user, 'dispatch.tracking') ? [{ type: 'navigate', label: 'Open delivery tracking', path: '/dispatch/delivery-tracking' }] : [{ type: 'navigate', label: 'Open my orders', path: '/orders' }],
        navigate: can(ctx.user, 'dispatch.tracking') ? '/dispatch/delivery-tracking' : '/orders', sources: [PLATFORM],
        context: orders.slice(0, 10).map((o) => ({ n: o.orderNumber, c: o.customerName, due: o.requestedDeliveryDate, s: o.orderStatus })),
      }
    },
  },

  get_vehicle_status: {
    label: 'Vehicle status', kind: 'read', permissions: ['vms.view', 'fleet.view'],
    description: 'Fleet status, and vehicles whose documents are expired or expiring within 30 days.',
    params: { expiring: { type: 'boolean', default: false }, days: { type: 'number', min: 1, max: 120, default: 30 } },
    run: (a, ctx) => {
      if (a.expiring) {
        const reg = expiryRegister({ vehicles: ctx.bundle.vehicles, drivers: [] }).filter((r) => r.date && r.days !== null && r.days <= a.days).sort((x, y) => x.days - y.days)
        const path = can(ctx.user, 'vms.view') ? '/vms/document-expiry' : '/vms/vehicles'
        return {
          title: `Vehicles with documents expired or expiring within ${a.days} days`,
          text: reg.length ? `${new Set(reg.map((r) => r.ownerId)).size} vehicle(s), ${reg.length} document(s): ${reg.filter((r) => r.days < 0).length} already expired.` : `No vehicle document expires within ${a.days} days.`,
          table: reg.length ? { columns: [{ key: 'v', label: 'Vehicle' }, { key: 'doc', label: 'Document' }, { key: 'date', label: 'Expiry' }, { key: 'state', label: 'State' }], rows: reg.slice(0, 20).map((r, i) => ({ id: `${r.ownerId}-${i}`, v: r.ownerName, doc: r.label, date: dayjs(r.date).format('DD MMM YYYY'), state: r.days < 0 ? `Expired ${-r.days} d ago` : r.days === 0 ? 'Expires today' : `In ${r.days} d`, _path: `/vms/vehicles/${r.ownerId}` })), total: reg.length } : null,
          warnings: reg.some((r) => r.days < 0 && r.required) ? ['Vehicles with an expired required document are blocked from new dispatch assignments.'] : [],
          actions: [{ type: 'navigate', label: 'Open expiry register', path }], navigate: path, sources: ['Vehicle master (platform)'],
          context: reg.slice(0, 12).map((r) => ({ v: r.ownerName, doc: r.label, date: r.date, days: r.days })),
        }
      }
      const by = {}
      ctx.bundle.vehicles.forEach((v) => { by[v.status] = (by[v.status] || 0) + 1 })
      return {
        title: 'Fleet status', text: `${ctx.bundle.vehicles.length} vehicles: ${Object.entries(by).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(', ')}.`,
        chart: { kind: 'bar', xKey: 'status', series: [{ key: 'count', label: 'Vehicles' }], data: Object.entries(by).map(([status, count]) => ({ status, count })) },
        actions: [{ type: 'navigate', label: 'Open vehicles', path: '/vms/vehicles' }], navigate: can(ctx.user, 'vms.view') ? '/vms' : '/dispatch/vehicles', sources: ['Vehicle master (platform)'], context: by,
      }
    },
  },

  get_sales_summary: {
    label: 'Sales summary', kind: 'read', permissions: ['orders.view'],
    description: 'Booked sales (approved orders and later) for a period, optionally grouped by customer, product, hub, day or month.',
    params: { period: { type: 'string', enum: ['today', 'yesterday', 'week', 'month', 'last_month', 'year', '30d'], default: 'month' }, groupBy: { type: 'string', enum: ['none', 'customer', 'product', 'hub', 'day', 'month'], default: 'none' } },
    run: (a, ctx) => {
      const { user } = ctx
      // Monthly trend uses the longer history (incl. the demo baseline) — only for roles with company-wide reporting.
      if (a.groupBy === 'month') {
        if (!anyPerm(user, ['orders.reports', 'forecasting.view'])) return { title: 'Monthly sales trend', text: 'A company-wide monthly trend needs reporting access. Ask for your own orders instead, e.g. “my sales this month”.', warnings: ['Permission: orders.reports'], sources: [] }
        const index = getIndex(ctx.bundle)
        const by = {}
        index.sales.forEach((s) => { const m = s.day.slice(0, 7); (by[m] ||= { month: m, revenue: 0, orders: 0, demo: 0 }); by[m].revenue += s.revenue; by[m].orders += 1; if (s.source === 'baseline') by[m].demo += 1 })
        const list = Object.values(by).sort((x, y) => (x.month > y.month ? 1 : -1)).slice(-12)
        const last = list[list.length - 1]
        const prev = list[list.length - 2]
        const chg = prev?.revenue ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : null
        return {
          title: 'Monthly sales trend (booked revenue, ex-tax)',
          text: `${list.length} months shown. ${last ? `${periodLabel(last.month, 'month')} so far: ${money(last.revenue)}` : ''}${chg !== null ? ` (${chg >= 0 ? '+' : ''}${round(chg, 1)}% vs ${periodLabel(prev.month, 'month')}, which was a full month).` : '.'}`,
          chart: { kind: 'bar', xKey: 'label', series: [{ key: 'revenue', label: 'Revenue' }], data: list.map((m) => ({ label: periodLabel(m.month, 'month'), revenue: round(m.revenue) })), money: true },
          warnings: index.sources.some((s) => s.kind === 'demo') ? ['Months before the first platform order use the synthetic demo baseline, not real sales.'] : [],
          actions: [{ type: 'navigate', label: 'View sales forecast', path: '/ai/forecasting' }], sources: index.sources.map((s) => `${s.label} (${s.from} → ${s.to})`),
          context: list.map((m) => ({ month: m.month, revenue: round(m.revenue), orders: m.orders, demoShare: m.orders ? round(m.demo / m.orders, 2) : 0 })),
        }
      }
      const r = periodRange(a.period === '30d' ? '30d' : a.period)
      const orders = visibleOrders(ctx).filter((o) => !NOT_BOOKED.includes(o.orderStatus) && o.orderDate >= r.from && o.orderDate <= r.to)
      const total = orders.reduce((s, o) => s + (o.totalAmount || 0), 0)
      const qty = orders.reduce((s, o) => s + (o.totalQuantity || 0), 0)
      const scopeNote = scopeOf(user) === 'SALESMAN' ? ' (your orders only)' : ''
      const base = {
        kpis: [{ label: 'Booked orders', value: String(orders.length) }, { label: 'Sales value (incl. tax)', value: money(total) }, { label: 'Units', value: num(qty) }, { label: 'Avg order', value: orders.length ? money(total / orders.length) : '—' }],
        sources: [PLATFORM], actions: can(user, 'orders.reports') ? [{ type: 'navigate', label: 'Open sales register', path: `/reports/view/sales-register?from=${r.from}&to=${r.to}` }] : [{ type: 'navigate', label: 'Open orders', path: `/orders?from=${r.from}&to=${r.to}` }],
      }
      if (a.groupBy === 'none' || a.groupBy === 'day') {
        const days = {}
        orders.forEach((o) => { days[o.orderDate] = (days[o.orderDate] || 0) + (o.totalAmount || 0) })
        return {
          ...base, title: `Sales for ${r.label}${scopeNote}`,
          text: `${orders.length} booked order(s) for ${r.label}${scopeNote}, worth ${money(total)} (${num(qty)} units). Booked = approved or later; submitted orders awaiting approval are not counted.`,
          chart: Object.keys(days).length > 1 ? { kind: 'area', xKey: 'day', series: [{ key: 'value', label: 'Sales' }], data: Object.entries(days).sort().map(([d, v]) => ({ day: dayjs(d).format('DD MMM'), value: round(v) })), money: true } : null,
          navigate: base.actions[0].path, context: { period: r, orders: orders.length, total, qty },
        }
      }
      const groups = {}
      orders.forEach((o) => {
        if (a.groupBy === 'customer' || a.groupBy === 'hub') {
          const k = a.groupBy === 'customer' ? o.customerId : o.hubId
          const g = (groups[k] ||= { id: k, name: a.groupBy === 'customer' ? o.customerName : o.hubName, orders: 0, value: 0, qty: 0 })
          g.orders += 1; g.value += o.totalAmount || 0; g.qty += o.totalQuantity || 0
        } else {
          (o.items || []).forEach((it) => {
            const g = (groups[it.productId] ||= { id: it.productId, name: it.productName, orders: 0, value: 0, qty: 0 })
            g.orders += 1; g.value += it.totalAmount || 0; g.qty += it.orderedQuantity || 0
          })
        }
      })
      const list = Object.values(groups).sort((x, y) => (a.groupBy === 'product' ? y.qty - x.qty : y.value - x.value))
      const top = list[0]
      const what = { customer: 'customers', product: 'products', hub: 'hubs' }[a.groupBy]
      return {
        ...base, title: `Top ${what} · ${r.label}${scopeNote}`,
        text: top ? `${top.name} leads with ${a.groupBy === 'product' ? `${num(top.qty)} units` : `${top.orders} orders worth ${money(top.value)}`}. ${list.length} ${what} had booked orders in ${r.label}.` : `No booked orders in ${r.label}.`,
        chart: list.length ? { kind: 'bar', xKey: 'name', series: [{ key: a.groupBy === 'product' ? 'qty' : 'value', label: a.groupBy === 'product' ? 'Units' : 'Sales' }], data: list.slice(0, 8).map((g) => ({ name: g.name.length > 18 ? `${g.name.slice(0, 17)}…` : g.name, value: round(g.value), qty: round(g.qty) })), money: a.groupBy !== 'product' } : null,
        table: list.length ? { columns: [{ key: 'name', label: a.groupBy[0].toUpperCase() + a.groupBy.slice(1) }, { key: 'orders', label: a.groupBy === 'product' ? 'Lines' : 'Orders', align: 'right' }, { key: 'qty', label: 'Units', align: 'right' }, { key: 'value', label: 'Value', align: 'right' }], rows: list.slice(0, 15).map((g) => ({ id: g.id, name: g.name, orders: String(g.orders), qty: num(g.qty), value: money(g.value), _path: a.groupBy === 'customer' ? `/customers/${g.id}` : a.groupBy === 'product' ? `/products/${g.id}` : undefined })), total: list.length } : null,
        navigate: base.actions[0].path, context: list.slice(0, 10).map((g) => ({ name: g.name, orders: g.orders, units: g.qty, value: round(g.value) })),
      }
    },
  },

  generate_sales_forecast: {
    label: 'Sales forecast (preview)', kind: 'read', permissions: ['forecasting.view'],
    description: 'Statistical forecast preview of revenue, orders or units. Saving a forecast is done on the Forecasting page.',
    params: { target: { type: 'string', enum: ['revenue', 'orders', 'quantity'], default: 'revenue' }, horizonDays: { type: 'number', min: 7, max: 90, default: 30 }, granularity: { type: 'string', enum: ['day', 'week', 'month'], default: 'day' }, productId: { type: 'string' }, hubId: { type: 'string' } },
    run: (a) => {
      const req = { target: a.target, level: a.productId ? 'product' : a.hubId ? 'hub' : 'total', granularity: a.granularity, horizonDays: a.horizonDays, model: getForecastSettings().defaultModel, filters: { productId: a.productId || '', hubId: a.hubId || '', customerId: '', category: '' } }
      const f = previewForecast(req)
      const path = `/ai/forecasting/new?${new URLSearchParams({ target: a.target, horizonDays: String(a.horizonDays), granularity: a.granularity, ...(a.productId ? { productId: a.productId } : {}), ...(a.hubId ? { hubId: a.hubId } : {}) })}`
      if (!f.statusOk) return { title: 'Sales forecast', text: f.message, warnings: f.notes, sources: f.sources.map((s) => s.label), actions: [{ type: 'navigate', label: 'Open forecasting', path: '/ai/forecasting' }] }
      const unit = a.target === 'revenue' ? money : num
      const m = f.metrics
      return {
        title: `${f.name} · next ${a.horizonDays} days`,
        text: `Projected ${a.target === 'revenue' ? 'revenue' : a.target === 'orders' ? 'orders' : 'units'} for the next ${a.horizonDays} days: ${unit(f.predictedTotal)} (${f.modelName}). This is a statistical projection from history, not a trained ML prediction.`,
        kpis: [{ label: 'Forecast total', value: unit(f.predictedTotal) }, { label: 'Model', value: f.modelName }, { label: 'Backtest accuracy (1 − WAPE)', value: m?.accuracy !== null && m?.accuracy !== undefined ? `${m.accuracy}%` : 'n/a' }, { label: 'Data quality', value: `${f.quality.score}/100` }],
        chart: { kind: 'forecast', xKey: 'label', data: [...f.history.keys.slice(-30).map((k, i, arr) => ({ label: periodLabel(k, f.granularity), actual: f.history.values[f.history.values.length - arr.length + i] })), ...f.predictions.map((p) => ({ label: periodLabel(p.key, f.granularity), forecast: p.value, lower: p.lower, upper: p.upper }))], money: a.target === 'revenue' },
        confidence: { level: f.quality.score >= 75 && (m?.accuracy ?? 0) >= 70 ? 'medium' : 'low', note: `Approx. ${f.confidenceLevel}% interval from model residuals; backtest on ${m?.points ?? 0} holdout periods.` },
        warnings: f.usesDemoData ? ['Uses the synthetic demo baseline for history before the first platform order.'] : [],
        actions: [{ type: 'navigate', label: 'Open in Forecasting', path }], navigate: '/ai/forecasting', sources: f.sources.map((s) => `${s.label} (${s.from} → ${s.to})`),
        context: { total: f.predictedTotal, model: f.modelName, metrics: m, quality: f.quality.score, next: f.predictions.slice(0, 7) },
      }
    },
  },

  get_stockout_predictions: {
    label: 'Stock-out predictions', kind: 'read', permissions: ['inventory.predictions.view'],
    description: 'Products predicted to run out within N days (statistical demand forecast vs available stock).',
    params: { days: { type: 'number', min: 1, max: 90, default: 7 }, hubId: { type: 'string' } },
    run: (a) => {
      const pred = ensureFreshPrediction()
      const rows = (pred?.rows || []).filter((r) => r.avgDaily > 0 && r.daysUntilStockout !== null && r.daysUntilStockout <= a.days && (!a.hubId || r.hubId === a.hubId)).sort((x, y) => x.daysUntilStockout - y.daysUntilStockout)
      return {
        title: `Products that may run out in the next ${a.days} days`,
        text: rows.length ? `${rows.length} stock line(s) are projected to run out within ${a.days} days. ${rows.filter((r) => r.risk === RISK.CRITICAL).length} are critical — stock lasts less than the supplier lead time.` : `No stock line is projected to run out within ${a.days} days.`,
        table: rows.length ? {
          columns: [{ key: 'product', label: 'Product' }, { key: 'hub', label: 'Hub' }, { key: 'stock', label: 'Current stock', align: 'right' }, { key: 'demand', label: `Forecast (${pred.rows[0]?.forecastHorizon || 14} d)`, align: 'right' }, { key: 'date', label: 'Stock-out' }, { key: 'risk', label: 'Risk' }, { key: 'reorder', label: 'Reorder qty', align: 'right' }],
          rows: rows.slice(0, 20).map((r) => ({ id: r.id, product: r.productName, hub: r.hubName, stock: `${num(r.available)} ${r.unit}`, demand: num(r.forecastDemand), date: r.daysUntilStockout <= 0 ? 'Now' : dayjs(r.stockoutDate).format('DD MMM'), risk: RISK_META[r.risk].label, reorder: r.recommendedQty ? num(r.recommendedQty) : '—', _path: `/products/${r.productId}` })),
          total: rows.length,
        } : null,
        confidence: { level: 'medium', note: 'Statistical forecast from recent demand; accuracy depends on history quality. Not a trained ML model.' },
        warnings: pred?.settings?.includeBaseline ? ['Demand history includes the synthetic demo baseline before the first platform order.'] : [],
        actions: [{ type: 'navigate', label: 'View Forecast', path: '/ai/predictive-inventory' }, { type: 'navigate', label: 'View Inventory', path: '/inventory/low-stock' }, { type: 'navigate', label: 'Reorder recommendations', path: '/ai/predictive-inventory/reorder' }, { type: 'tool', label: 'Create Replenishment Draft', tool: 'create_replenishment_draft', args: { hubId: rows[0]?.hubId || '' } }],
        navigate: '/ai/predictive-inventory', sources: ['Current inventory', `Demand basis: ${pred?.settings?.basis || 'dispatched'}`, `Prediction run ${dayjs(pred?.generatedAt).format('DD MMM HH:mm')}`],
        context: rows.slice(0, 12).map((r) => ({ p: r.productName, h: r.hubName, available: r.available, forecastDaily: r.forecastDaily, stockout: r.stockoutDate, risk: r.risk, reorderQty: r.recommendedQty, leadTime: r.leadTimeDays })),
      }
    },
  },

  get_reorder_recommendations: {
    label: 'Reorder recommendations', kind: 'read', permissions: ['inventory.predictions.view'],
    description: 'Open reorder recommendations: reorder point, safety stock and recommended quantity per product and hub.',
    params: { hubId: { type: 'string' } },
    run: (a) => {
      ensureFreshPrediction()
      const recs = getRecommendations().filter((r) => r.status === RECOMMENDATION_STATUS.OPEN && (!a.hubId || r.hubId === a.hubId)).sort((x, y) => RISK_META[x.risk].rank - RISK_META[y.risk].rank)
      return {
        title: 'Products to reorder',
        text: recs.length ? `${recs.length} open recommendation(s). Most urgent: ${recs.slice(0, 3).map((r) => `${r.productName} at ${r.hubName} (${num(r.recommendedQty)} ${r.unit})`).join('; ')}.` : 'No open reorder recommendations — projected stock is above every reorder point.',
        table: recs.length ? { columns: [{ key: 'product', label: 'Product' }, { key: 'hub', label: 'Hub' }, { key: 'pos', label: 'Position', align: 'right' }, { key: 'rop', label: 'Reorder point', align: 'right' }, { key: 'qty', label: 'Recommended', align: 'right' }, { key: 'risk', label: 'Risk' }], rows: recs.slice(0, 20).map((r) => ({ id: r.id, product: r.productName, hub: r.hubName, pos: num(r.position), rop: num(r.reorderPoint), qty: num(r.recommendedQty), risk: RISK_META[r.risk].label })), total: recs.length } : null,
        actions: [{ type: 'navigate', label: 'Review recommendations', path: '/ai/predictive-inventory/reorder' }, ...(recs.length ? [{ type: 'tool', label: 'Create replenishment draft', tool: 'create_replenishment_draft', args: { hubId: recs[0].hubId } }] : [])],
        navigate: '/ai/predictive-inventory/reorder', sources: ['Predictive inventory run', 'Reorder point = avg daily demand × lead time + safety stock'],
        context: recs.slice(0, 12).map((r) => ({ p: r.productName, h: r.hubName, qty: r.recommendedQty, rop: r.reorderPoint, position: r.position, risk: r.risk })),
      }
    },
  },

  create_replenishment_draft: {
    label: 'Create replenishment draft', kind: 'write', permissions: ['inventory.replenishment.create'],
    description: 'Creates a replenishment DRAFT from open recommendations for one hub. Never changes stock.',
    params: { hubId: { type: 'string' }, supplierId: { type: 'string' } },
    propose: (a, ctx) => {
      const recs = getRecommendations().filter((r) => r.status === RECOMMENDATION_STATUS.OPEN)
      const hubId = a.hubId || Object.entries(recs.reduce((m, r) => ({ ...m, [r.hubId]: (m[r.hubId] || 0) + (r.risk === RISK.CRITICAL ? 3 : 1) }), {})).sort((x, y) => y[1] - x[1])[0]?.[0]
      const lines = recs.filter((r) => r.hubId === hubId)
      const hub = ctx.bundle.hubs.find((h) => h.id === hubId)
      const settings = getForecastSettings()
      const supplierId = a.supplierId || lines[0]?.supplierId || settings.suppliers[0]?.id
      const supplier = settings.suppliers.find((s) => s.id === supplierId)
      if (!lines.length) return { ok: false, error: 'There are no open reorder recommendations for that hub.' }
      return {
        ok: true,
        summary: `Create a replenishment DRAFT for ${hub?.name} from ${supplier?.name} with ${lines.length} product line(s). Stock does not change — the draft must be submitted, approved and received.`,
        affected: lines.map((r) => `${r.productName} — ${num(r.recommendedQty)} ${r.unit}`),
        args: { hubId, supplierId, lines: lines.map((r) => ({ productId: r.productId, quantity: r.recommendedQty, recommendedQty: r.recommendedQty, recommendationId: r.id })) },
      }
    },
    run: (a) => {
      const res = createDraft({ hubId: a.hubId, supplierId: a.supplierId, lines: a.lines, source: 'ai', notes: 'Created from AI reorder recommendations after user confirmation.' })
      if (!res.ok) return { ok: false, error: res.error, errors: res.errors }
      return { title: `Draft ${res.record.number} created`, text: `Replenishment draft ${res.record.number} was created with ${res.record.lines.length} line(s). Review and submit it for approval. Stock has not changed.`, warnings: res.warnings, actions: [{ type: 'navigate', label: `Open ${res.record.number}`, path: `/ai/replenishment/${res.record.id}` }], navigate: `/ai/replenishment/${res.record.id}`, sources: [PLATFORM] }
    },
  },

  approve_order: {
    label: 'Approve order', kind: 'write', permissions: ['orders.approve'],
    description: 'Approves a submitted order after explicit confirmation (same checks as the approval screen).',
    params: { orderNumber: { type: 'string', required: true } },
    propose: (a, ctx) => {
      const o = ctx.bundle.orders.find((x) => x.orderNumber.toLowerCase() === a.orderNumber.toLowerCase())
      if (!o || !canViewOrder(ctx.user, o)) return { ok: false, error: `Order ${a.orderNumber} was not found.` }
      if (!canDecide(ctx.user, o)) return { ok: false, error: `${o.orderNumber} is ${statusLabel(o.orderStatus).toLowerCase()} and cannot be approved by you.` }
      const checks = getApprovalChecks(o)
      const blocking = checks.filter((c) => c.severity === 'block' && !c.ok)
      if (blocking.length) return { ok: false, error: `Cannot approve ${o.orderNumber}: ${blocking.map((c) => c.detail).join(' ')}` }
      const warns = checks.filter((c) => c.severity === 'warn' && !c.ok)
      return { ok: true, summary: `Approve ${o.orderNumber} for ${o.customerName} (${money(o.totalAmount)}).${warns.length ? ' By confirming you acknowledge the warnings listed.' : ''}`, affected: [`${o.orderNumber} · ${o.customerName} · ${money(o.totalAmount)}`, ...warns.map((w) => `⚠ ${w.label}: ${w.detail}`)], args: { orderId: o.id, orderNumber: o.orderNumber } }
    },
    run: (a) => {
      const res = approveOrder(a.orderId, { remarks: 'Approved via AI assistant after confirmation.', acknowledgeWarnings: true })
      if (!res.ok) return { ok: false, error: res.error || Object.values(res.errors || {})[0] }
      return { title: `${a.orderNumber} approved`, text: `${a.orderNumber} was approved and moves to consolidation.`, actions: [{ type: 'navigate', label: 'Open order', path: `/orders/${a.orderId}` }], navigate: `/orders/${a.orderId}`, sources: [PLATFORM] }
    },
  },

  reject_order: {
    label: 'Reject order', kind: 'write', permissions: ['orders.approve'],
    description: 'Rejects a submitted order with a reason after explicit confirmation.',
    params: { orderNumber: { type: 'string', required: true }, reason: { type: 'string', max: 200 } },
    propose: (a, ctx) => {
      const o = ctx.bundle.orders.find((x) => x.orderNumber.toLowerCase() === a.orderNumber.toLowerCase())
      if (!o || !canViewOrder(ctx.user, o)) return { ok: false, error: `Order ${a.orderNumber} was not found.` }
      if (!canDecide(ctx.user, o)) return { ok: false, error: `${o.orderNumber} cannot be rejected by you in its current status.` }
      return { ok: true, needsReason: true, summary: `Reject ${o.orderNumber} for ${o.customerName} (${money(o.totalAmount)}). The salesman is notified.`, affected: [`${o.orderNumber} · ${o.customerName}`], args: { orderId: o.id, orderNumber: o.orderNumber, reason: a.reason || '' } }
    },
    run: (a) => {
      if (!String(a.reason || '').trim()) return { ok: false, error: 'A rejection reason is required.' }
      const res = rejectOrder(a.orderId, { reason: 'Other', remarks: a.reason })
      if (!res.ok) return { ok: false, error: res.error || Object.values(res.errors || {})[0] }
      return { title: `${a.orderNumber} rejected`, text: `${a.orderNumber} was rejected: ${a.reason}`, actions: [{ type: 'navigate', label: 'Open order', path: `/orders/${a.orderId}` }], sources: [PLATFORM] }
    },
  },

  get_notifications: {
    label: 'My notifications', kind: 'read', permissions: ['ai.assistant.use', 'jarvis.use'],
    description: 'Your unread notifications.',
    params: { unreadOnly: { type: 'boolean', default: true } },
    run: (a, ctx) => {
      const list = getNotificationsForUser(ctx.user).filter((n) => !a.unreadOnly || !n.read)
      return {
        title: a.unreadOnly ? 'Unread notifications' : 'Notifications',
        text: list.length ? `You have ${list.length} ${a.unreadOnly ? 'unread ' : ''}notification(s). Latest: “${list[0].title}”.` : 'You have no unread notifications.',
        table: list.length ? { columns: [{ key: 'title', label: 'Notification' }, { key: 'when', label: 'When' }], rows: list.slice(0, 10).map((n) => ({ id: n.id, title: n.title, when: dayjs(n.createdAt).format('DD MMM, HH:mm'), _path: n.link || undefined })), total: list.length } : null,
        sources: ['Your notifications'], context: list.slice(0, 8).map((n) => ({ title: n.title, message: n.message })),
      }
    },
  },

  navigate_to_page: {
    label: 'Open a page', kind: 'read', permissions: ['ai.assistant.use'],
    description: 'Navigates to an application page the user is allowed to open.',
    params: { path: { type: 'string', required: true, max: 200 } },
    run: (a, ctx) => {
      const path = a.path.startsWith('/') ? a.path : `/${a.path}`
      const pathname = path.split('?')[0]
      const known = NAV_ITEMS.some((i) => i.path === pathname) || NAV_ITEMS.some((i) => i.path.includes(':') && new RegExp(`^${i.path.replace(/:[^/]+/g, '[^/]+')}$`).test(pathname))
      if (!known) return { ok: false, error: `There is no page at ${pathname}.` }
      if (!canAccessPath(pathname, ctx.user)) return { ok: false, error: 'Your role cannot open that page.' }
      const item = NAV_ITEMS.find((i) => i.path === pathname)
      return { title: `Opening ${item?.label || pathname}`, text: `Opening ${item?.label || pathname}.`, navigate: path, actions: [{ type: 'navigate', label: `Open ${item?.label || 'page'}`, path }], sources: [] }
    },
  },

  generate_report: {
    label: 'Generate report', kind: 'read', permissions: ['ai.assistant.use'],
    description: 'Prepares a report summary and opens the matching report page with filters (sales, delivery, inventory, invoices, forecast).',
    params: { report: { type: 'string', enum: ['sales', 'delivery', 'inventory', 'invoices', 'forecast'], default: 'sales' }, period: { type: 'string', enum: ['today', 'week', 'month', 'last_month', 'year', '30d'], default: 'month' } },
    run: (a, ctx) => {
      const r = periodRange(a.period)
      const map = {
        sales: { perm: ['orders.reports', 'orders.view'], path: can(ctx.user, 'orders.reports') ? `/reports/view/sales-register?from=${r.from}&to=${r.to}` : `/orders?from=${r.from}&to=${r.to}`, base: () => TOOLS.get_sales_summary.run({ period: a.period, groupBy: 'customer' }, ctx) },
        delivery: { perm: ['dispatch.reports'], path: `/reports/view/dlv-register?from=${r.from}&to=${r.to}`, base: () => TOOLS.get_deliveries.run({ delayed: true, groupBy: 'order' }, ctx) },
        inventory: { perm: ['inventory.stock.view'], path: '/inventory/stock', base: () => TOOLS.get_inventory.run({ groupBy: 'category' }, ctx) },
        invoices: { perm: ['invoices.reports'], path: `/reports/view/fin-invoices?from=${r.from}&to=${r.to}`, base: () => ({ text: `${ctx.bundle.invoices.filter((i) => (i.issuedAt || i.createdAt || '').slice(0, 10) >= r.from).length} invoice(s) issued in ${r.label}.` }) },
        forecast: { perm: ['forecasting.view'], path: '/ai/forecasting', base: () => TOOLS.generate_sales_forecast.run({ target: 'revenue', horizonDays: 30, granularity: 'day' }, ctx) },
      }
      const m = map[a.report]
      if (!anyPerm(ctx.user, m.perm)) return { ok: false, error: `Your role cannot open the ${a.report} report.` }
      const res = m.base()
      return { ...res, title: `${a.report[0].toUpperCase()}${a.report.slice(1)} report · ${r.label}`, actions: [{ type: 'navigate', label: 'Open report', path: m.path }, ...(res.table ? [{ type: 'download', label: 'Download CSV' }] : [])], navigate: m.path }
    },
  },
}

/** Tools a role may use (for the assistant's help panel and the AI provider tool list). */
export const toolsForRole = (role) => Object.entries(TOOLS).filter(([, t]) => anyPerm(role, t.permissions)).map(([name, t]) => ({ name, label: t.label, kind: t.kind, description: t.description }))

/**
 * Execute a tool. Write tools return { needsConfirmation, proposal } unless confirmed is true.
 * Every call is logged to the AI activity history.
 */
export const executeTool = (name, rawArgs = {}, { user, confirmed = false, source = 'assistant' } = {}) => {
  const started = Date.now()
  const tool = TOOLS[name]
  const log = (ok, extra = {}) => logAiActivity({ kind: tool?.kind === 'write' ? (confirmed ? 'confirm' : 'tool') : 'tool', tool: name, args: rawArgs, ok, durationMs: Date.now() - started, source, ...extra })
  if (!tool) { log(false, { error: 'Unknown tool' }); return { ok: false, error: `Unknown tool ${name}.` } }
  if (!user || !(can(user, 'ai.assistant.use') || can(user, 'jarvis.use'))) { log(false, { error: 'Not allowed' }); return { ok: false, error: 'You cannot use the AI assistant.' } }
  if (!anyPerm(user, tool.permissions)) {
    log(false, { error: 'Permission denied' })
    return { ok: false, denied: true, error: `Your role does not have access to “${tool.label}”.` }
  }
  const { args, errors } = validate(tool.params, rawArgs)
  if (errors.length && tool.kind === 'read') { log(false, { error: errors.join('; ') }); return { ok: false, error: `Invalid input: ${errors.join('; ')}.` } }
  const ctx = { user, bundle: getDataBundle() }
  try {
    if (tool.kind === 'write' && !confirmed) {
      if (errors.length) { log(false, { error: errors.join('; ') }); return { ok: false, error: `Invalid input: ${errors.join('; ')}.` } }
      const p = tool.propose(args, ctx)
      log(p.ok, { error: p.ok ? '' : p.error, summary: p.ok ? 'Proposed — awaiting confirmation' : '' })
      if (!p.ok) return p
      return { ok: true, needsConfirmation: true, proposal: { tool: name, label: tool.label, summary: p.summary, affected: p.affected, args: p.args, needsReason: Boolean(p.needsReason) } }
    }
    const res = tool.run(tool.kind === 'write' ? rawArgs : args, ctx)
    const ok = res.ok !== false
    log(ok, { error: ok ? '' : res.error, summary: res.title || '' })
    return { ok, tool: name, ...res }
  } catch (e) {
    log(false, { error: e?.message || 'Tool failed' })
    return { ok: false, error: `The ${tool.label} tool failed: ${e?.message || 'unknown error'}.` }
  }
}
