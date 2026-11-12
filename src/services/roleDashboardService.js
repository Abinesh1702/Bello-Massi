/**
 * Metrics for the role dashboards added with Phase 1 completion (Admin operations strip, Warehouse, Inventory,
 * QA, Customer portal, Supplier portal, Sales targets). Every figure is computed from stored records; where a
 * capability is not built yet (batch expiry, temperature sensors, collections) the dashboards say so instead of
 * showing a number.
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { STORAGE_KEYS, ORDER_STATUS as S } from '../utils/constants'
import { buildStockRows } from './inventoryService'
import { expiryRegister } from './complianceService'
import { getCreditInfo } from './customerService'
import { ACTIVE_DISPATCH_STATUSES } from '../config/dispatchConfig'
import { QUEUE_STATUSES } from '../config/documentConfig'
import { EXPIRY_STATE } from '../config/vmsConfig'
import { isPlainObject } from '../utils/helpers'
import { STOCK_STATUS, TRANSFER_STATUS } from '../config/masterData'
import { can } from '../config/permissions'

const K = STORAGE_KEYS
const read = (k) => storage.getItem(k, []) || []

export const getOpsSnapshot = () => ({
  orders: read(K.ORDERS), products: read(K.PRODUCTS), hubs: read(K.HUBS), inventory: read(K.INVENTORY), customers: read(K.CUSTOMERS),
  receipts: read(K.STOCK_RECEIPTS), transfers: read(K.STOCK_TRANSFERS), adjustments: read(K.STOCK_ADJUSTMENTS),
  dispatches: read(K.DISPATCHES), deliveries: read(K.DELIVERIES), invoices: read(K.INVOICES), drafts: read(K.REPLENISHMENT_DRAFTS),
  insights: read(K.AI_INSIGHTS), documents: read(K.DOCUMENTS), vehicles: read(K.VEHICLES), drivers: read(K.DRIVERS),
})

const within = (iso, days, now) => iso && dayjs(iso).isAfter(now.subtract(days, 'day'))
const total = (o) => Number(o.totalAmount) || 0

/** Admin operations strip: orders, sales, inventory, purchase, dispatch, delivery, finance, AI. */
export const adminOps = (s = getOpsSnapshot(), now = dayjs()) => {
  const rows = buildStockRows(s.inventory, s.products, s.hubs)
  const live = s.orders.filter((o) => o.orderStatus !== S.DRAFT)
  const delivered30 = s.orders.filter((o) => [S.DELIVERED, S.PARTIALLY_DELIVERED].includes(o.orderStatus) && within(o.deliveredAt || o.updatedAt, 30, now))
  const issued = s.invoices.filter((i) => i.status === 'ISSUED')
  const outstanding = s.customers.filter((c) => c.creditEnabled).reduce((sum, c) => sum + (Number(c.creditBalance) || 0), 0)
  return {
    orders: { total: s.orders.length, last30: live.filter((o) => within(o.submittedAt || o.createdAt, 30, now)).length, pending: live.filter((o) => o.orderStatus === S.SUBMITTED).length },
    sales: { delivered30Value: delivered30.reduce((a, o) => a + total(o), 0), delivered30: delivered30.length, approvedValue: live.filter((o) => ![S.SUBMITTED, S.REJECTED, S.RETURNED].includes(o.orderStatus)).reduce((a, o) => a + total(o), 0) },
    inventory: { value: rows.reduce((a, r) => a + r.value, 0), low: rows.filter((r) => r.status === STOCK_STATUS.LOW).length, out: rows.filter((r) => r.status === STOCK_STATUS.OUT).length },
    purchase: { submitted: s.drafts.filter((d) => d.status === 'SUBMITTED').length, approved: s.drafts.filter((d) => ['APPROVED', 'CONVERTED'].includes(d.status)).length, openValue: s.drafts.filter((d) => ['SUBMITTED', 'APPROVED', 'CONVERTED'].includes(d.status)).reduce((a, d) => a + (d.estimatedValue || 0), 0) },
    dispatch: { active: s.dispatches.filter((d) => ACTIVE_DISPATCH_STATUSES.includes(d.status)).length, ready: s.orders.filter((o) => o.orderStatus === S.READY_FOR_DISPATCH && !o.dispatchId).length },
    delivery: { delivered7: s.deliveries.filter((d) => d.status === 'DELIVERED' && within(d.deliveredAt || d.updatedAt, 7, now)).length, failed: s.deliveries.filter((d) => d.status === 'FAILED' && !d.reviewedAt).length, out: s.deliveries.filter((d) => d.status === 'OUT_FOR_DELIVERY').length },
    finance: { invoiced: issued.reduce((a, i) => a + (Number(i.totals?.grandTotal) || 0), 0), invoices: issued.length, outstanding },
    ai: { open: s.insights.filter((i) => i.status !== 'RESOLVED').length, critical: s.insights.filter((i) => i.status !== 'RESOLVED' && i.severity === 'critical').length },
  }
}

/** Warehouse Manager / Inventory Executive. hubId narrows to one hub ('' = all hubs). */
export const warehouseOps = (s = getOpsSnapshot(), { hubId = '' } = {}, now = dayjs()) => {
  const inHub = (id) => !hubId || id === hubId
  const rows = buildStockRows(s.inventory, s.products, s.hubs).filter((r) => inHub(r.hubId))
  const receipts7 = s.receipts.filter((r) => inHub(r.hubId) && within(r.receiptDate || r.createdAt, 7, now))
  const transfersOpen = s.transfers.filter((t) => t.status === TRANSFER_STATUS.DRAFT && (inHub(t.sourceHubId) || inHub(t.destinationHubId)))
  const picking = s.orders.filter((o) => inHub(o.hubId) && (o.orderStatus === S.CONSOLIDATED || (o.orderStatus === S.READY_FOR_DISPATCH)))
  const loading = s.dispatches.filter((d) => inHub(d.hubId) && ['PLANNED', 'ASSIGNED'].includes(d.status))
  const low = rows.filter((r) => r.status === STOCK_STATUS.LOW || r.status === STOCK_STATUS.OUT).sort((a, b) => a.available - b.available)
  const damaged = rows.filter((r) => (r.damagedQuantity || 0) > 0)
  const docs = expiryRegister({ vehicles: s.vehicles, drivers: s.drivers }).filter((r) => [EXPIRY_STATE.EXPIRED, EXPIRY_STATE.TODAY, EXPIRY_STATE.WEEK, EXPIRY_STATE.MONTH].includes(r.state))
  const incoming = s.drafts.filter((d) => inHub(d.hubId) && ['APPROVED', 'CONVERTED'].includes(d.status))
  return {
    rows, low, damaged, picking, loading, incoming, docs,
    receipts7: { count: receipts7.length, quantity: receipts7.reduce((a, r) => a + (Number(r.quantity) || 0), 0), list: [...receipts7].sort((a, b) => ((b.receiptDate || b.createdAt) > (a.receiptDate || a.createdAt) ? 1 : -1)) },
    transfersOpen,
    stockValue: rows.reduce((a, r) => a + r.value, 0),
    stockLines: rows.length,
    damagedQty: damaged.reduce((a, r) => a + (r.damagedQuantity || 0), 0),
  }
}

/** QA Manager: inspections (document review queue), quarantine (damaged stock), expiry (VMS documents), temperature. */
export const qaOps = (s = getOpsSnapshot()) => {
  const rows = buildStockRows(s.inventory, s.products, s.hubs)
  const queue = s.documents.filter((d) => QUEUE_STATUSES.includes(d.status))
  const rejected = s.documents.filter((d) => d.status === 'REJECTED')
  const damaged = rows.filter((r) => (r.damagedQuantity || 0) > 0).sort((a, b) => (b.damagedQuantity || 0) - (a.damagedQuantity || 0))
  const expiry = expiryRegister({ vehicles: s.vehicles, drivers: s.drivers })
  const expired = expiry.filter((r) => r.state === EXPIRY_STATE.EXPIRED)
  const soon = expiry.filter((r) => [EXPIRY_STATE.TODAY, EXPIRY_STATE.WEEK, EXPIRY_STATE.MONTH].includes(r.state))
  const coldItems = s.products.filter((p) => ['Frozen', 'Chilled'].includes(p.storageCondition) && p.status === 'Active')
  const lossAdjustments = s.adjustments.filter((a) => ['DAMAGED', 'LOST', 'EXPIRED'].includes(String(a.type).toUpperCase())).slice(0, 8)
  return { queue, rejected, damaged, damagedQty: damaged.reduce((a, r) => a + (r.damagedQuantity || 0), 0), expired, soon, coldItems, lossAdjustments }
}

/** Customer portal: one customer's orders, deliveries, invoices and credit (read-only). */
export const customerPortal = (customerId, s = getOpsSnapshot()) => {
  const customer = s.customers.find((c) => c.id === customerId) || null
  const orders = s.orders.filter((o) => o.customerId === customerId && o.orderStatus !== S.DRAFT).sort((a, b) => ((b.submittedAt || b.createdAt) > (a.submittedAt || a.createdAt) ? 1 : -1))
  const open = orders.filter((o) => ![S.DELIVERED, S.REJECTED, S.RETURNED_TO_HUB].includes(o.orderStatus))
  const deliveries = s.deliveries.filter((d) => d.customerId === customerId || orders.some((o) => o.id === d.orderId))
  const invoices = s.invoices.filter((i) => i.customerId === customerId || orders.some((o) => o.id === i.orderId))
  return { customer, orders, open, deliveries, invoices, credit: customer ? getCreditInfo(customer) : null }
}

/** Supplier portal: replenishment approved for one supplier (read-only). */
export const supplierPortal = (supplierId, s = getOpsSnapshot()) => {
  const fs = storage.getItem(K.FORECAST_SETTINGS, null)
  const supplier = (isPlainObject(fs) ? fs.suppliers : []).find((x) => x.id === supplierId) || null
  const drafts = s.drafts.filter((d) => d.supplierId === supplierId && ['APPROVED', 'CONVERTED', 'RECEIVED'].includes(d.status))
  const receipts = s.receipts.filter((r) => drafts.some((d) => d.number && r.referenceNumber === d.number))
  return { supplier, drafts, receipts, hubs: s.hubs }
}

/* ---------- Sales targets (Sales Manager) ---------- */

export const DEFAULT_SALES_TARGETS = { monthlyValue: 2500000, monthlyOrders: 40, perSalesman: {} }

export const getSalesTargets = () => {
  const app = (storage.getItem(K.SETTINGS, {}) || {}).application || {}
  return { ...DEFAULT_SALES_TARGETS, ...(isPlainObject(app.salesTargets) ? app.salesTargets : {}) }
}

const actor = () => {
  const ss = storage.getItem(K.SESSION, null, { scope: 'local' }) || storage.getItem(K.SESSION, null, { scope: 'session' })
  return ss ? read(K.DEMO_USERS).find((u) => u.id === ss.userId) || null : null
}

export const saveSalesTargets = (values) => {
  if (!can(actor(), 'sales.targets.manage')) return { ok: false, error: 'You do not have permission to set sales targets.' }
  const errors = {}
  const v = Number(values.monthlyValue)
  const n = Number(values.monthlyOrders)
  if (!Number.isFinite(v) || v <= 0) errors.monthlyValue = 'Enter a monthly value target above 0.'
  if (!Number.isInteger(n) || n <= 0) errors.monthlyOrders = 'Enter a whole number of orders above 0.'
  if (Object.keys(errors).length) return { ok: false, errors, error: 'Please fix the highlighted fields.' }
  const raw = storage.getItem(K.SETTINGS, {}) || {}
  const res = storage.setItem(K.SETTINGS, { ...raw, application: { ...(raw.application || {}), salesTargets: { ...getSalesTargets(), monthlyValue: v, monthlyOrders: n, updatedAt: new Date().toISOString() } } })
  return res.ok ? { ok: true } : { ok: false, error: res.error }
}

/** Month-to-date progress against the targets (approved-or-later orders by approval / submission date). */
export const salesProgress = (orders, targets = getSalesTargets(), now = dayjs()) => {
  const start = now.startOf('month')
  const counted = orders.filter((o) => ![S.DRAFT, S.SUBMITTED, S.REJECTED, S.RETURNED].includes(o.orderStatus) && dayjs(o.approvedAt || o.submittedAt || o.createdAt).isAfter(start))
  const value = counted.reduce((a, o) => a + total(o), 0)
  const daysIn = now.daysInMonth()
  const elapsed = now.date()
  const bySalesman = Object.values(counted.reduce((acc, o) => {
    const k = o.salesmanId || 'unassigned'
    acc[k] = acc[k] || { id: k, name: o.salesmanName || 'Unassigned', value: 0, orders: 0 }
    acc[k].value += total(o)
    acc[k].orders += 1
    return acc
  }, {})).sort((a, b) => b.value - a.value)
  return {
    value, orders: counted.length, targets,
    valuePct: targets.monthlyValue ? (value / targets.monthlyValue) * 100 : 0,
    ordersPct: targets.monthlyOrders ? (counted.length / targets.monthlyOrders) * 100 : 0,
    expectedPct: (elapsed / daysIn) * 100,
    projectedValue: elapsed ? (value / elapsed) * daysIn : 0,
    bySalesman,
  }
}
