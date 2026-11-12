/**
 * Reports Center — report definitions and the data context they read.
 *
 * Every report is computed from the live LocalStorage collections at the moment it is opened (or refreshed); nothing
 * is hard-coded. Each user sees only the records their data scope allows (orders / deliveries / calls / documents).
 * This is the one report catalogue of the application: module pages link here (?category=…) instead of keeping
 * their own report screens. Receipts, credit notes, payables, expenses, batches, cycle counts and fleet costs are
 * reported by the department reports (services/enterprise/enterpriseReports.js) in the same viewer.
 *
 * Row convention: every row may carry the standard filter fields — date (YYYY-MM-DD), customer, supplier, product,
 * category, hub, warehouse, salesman, driver, vehicle, status, zone — which drive the viewer's global filters.
 */
import dayjs from 'dayjs'
import { ENTERPRISE_REPORTS, ENTERPRISE_REPORT_CATEGORIES } from './enterprise/enterpriseReports'
import storage from './storageService'
import { STORAGE_KEYS, ORDER_STATUS_META } from '../utils/constants'
import { can } from '../config/permissions'
import { getVisibleOrders } from './orderService'
import { canViewDelivery } from './deliveryService'
import { getVisibleCalls, followUpBucket, formatDuration } from './callService'
import { DELIVERY_STATUS_META, DISPATCH_STATUS_META } from '../config/dispatchConfig'
import { REPLENISHMENT_META } from '../config/aiConfig'
import { SCRAP_STATUS_META, approvalStatusOf } from './scrapService'
import { getAvailable, getStockStatus } from '../utils/stock'
import { getCurrentUser } from './authService'
import { canViewDocument, effectiveStatus, expiryState } from './documentService'
import { expiryRegister } from './complianceService'
import { invoiceBalances } from './enterprise/financeService'
import { DOCUMENT_STATUS_META, ENTITY_LABEL, QUEUE_STATUSES } from '../config/documentConfig'
import { EXPIRY_META } from '../config/vmsConfig'

const K = STORAGE_KEYS
const read = (k, f = []) => storage.getItem(k, f) ?? f
const idx = (arr) => Object.fromEntries((arr || []).map((x) => [x.id, x]))
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100
const day = (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '')
const pct = (a, b) => (b ? r2((a / b) * 100) : 0)

export const REPORT_CATEGORIES = [
  { id: 'sales', label: 'Sales', permission: 'orders.reports' },
  { id: 'inventory', label: 'Inventory', permission: 'reports.inventory' },
  { id: 'dispatch', label: 'Dispatch & Delivery', permission: ['dispatch.reports', 'dispatch.history'] },
  { id: 'finance', label: 'Finance', permission: ['finance.view', 'invoices.reports'] },
  { id: 'customer', label: 'Customer', permission: 'customers.view' },
  { id: 'supplier', label: 'Supplier', permission: 'suppliers.view' },
  { id: 'fleet', label: 'Fleet', permission: ['fleet.view', 'vms.view'] },
  { id: 'documents', label: 'Documents', permission: ['documents.reports', 'documents.view'] },
  { id: 'communication', label: 'Communication', permission: 'communication.calls' },
  { id: 'scrap', label: 'Scrap', permission: 'inventory.scrap.view' },
  { id: 'ai', label: 'AI', permission: 'ai.insights.view' },
  // Enterprise departments (services/enterprise/enterpriseReports.js)
  ...ENTERPRISE_REPORT_CATEGORIES,
]

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

export const buildReportContext = (user = getCurrentUser()) => {
  const customers = read(K.CUSTOMERS)
  const products = read(K.PRODUCTS)
  const hubs = read(K.HUBS)
  const drivers = read(K.DRIVERS)
  const vehicles = read(K.VEHICLES)
  const zones = read(K.DISPATCH_ZONES)
  const users = read(K.DEMO_USERS)
  const reps = read(K.DEMO_DATA, {})?.salesReps || []
  const allOrders = read(K.ORDERS)
  const orders = getVisibleOrders(user, allOrders)
  const deliveries = read(K.DELIVERIES).filter((d) => canViewDelivery(user, d, { orders: allOrders, drivers }))
  const fs = read(K.FORECAST_SETTINGS, {}) || {}
  const documents = read(K.DOCUMENTS)
  const balances = invoiceBalances()
  const L = {
    customers: idx(customers), products: idx(products), hubs: idx(hubs), drivers: idx(drivers), vehicles: idx(vehicles), zones: idx(zones), orders: idx(allOrders),
    documentTypes: idx(read(K.DOCUMENT_TYPES)),
    people: { ...idx(reps), ...idx(users), ...idx(drivers) }, suppliers: idx(fs.suppliers || []),
  }
  return {
    user, L, customers, products, hubs, drivers, vehicles, zones, orders, deliveries,
    dispatches: read(K.DISPATCHES), notes: read(K.DELIVERY_NOTES).filter((n) => deliveries.some((d) => d.id === n.deliveryId)), otps: read(K.DELIVERY_OTPS),
    inventory: read(K.INVENTORY), movements: read(K.STOCK_MOVEMENTS), receipts: read(K.STOCK_RECEIPTS), transfers: read(K.STOCK_TRANSFERS), adjustments: read(K.STOCK_ADJUSTMENTS),
    scrap: read(K.SCRAP_REQUESTS), calls: getVisibleCalls(user, read(K.CALL_HISTORY)), invoices: read(K.INVOICES), drafts: read(K.REPLENISHMENT_DRAFTS),
    suppliers: fs.suppliers || [], predictions: read(K.INVENTORY_PREDICTIONS, {})?.rows || [], recommendations: read(K.REORDER_RECOMMENDATIONS), insights: read(K.AI_INSIGHTS),
    forecasts: read(K.FORECASTS), documents, pods: read(K.DELIVERY_POD), warehouses: read(K.ORGANIZATION, {})?.warehouses || [],
    documentsVisible: documents.filter((d) => canViewDocument(user, d, { customers, orders: allOrders, drivers, vehicles })),
    approvals: read(K.APPROVALS), consolidations: read(K.CONSOLIDATIONS), orderIds: new Set(orders.map((o) => o.id)),
    invoiceBalances: balances, B: idx(balances),
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const col = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra })
const money = (key, label) => col(key, label, 'currency', { sum: true })
const qty = (key, label) => col(key, label, 'number', { sum: true })

const group = (rows, keyFn) => {
  const m = new Map()
  rows.forEach((r) => {
    const k = keyFn(r)
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(r)
  })
  return m
}

const SALES_EXCLUDED = ['DRAFT', 'REJECTED', 'RETURNED', 'CANCELLED']
const isSale = (o) => !SALES_EXCLUDED.includes(o.orderStatus)
const orderStatus = (o) => ORDER_STATUS_META[o.orderStatus]?.label || o.orderStatus

const orderRow = (ctx, o) => {
  const c = ctx.L.customers[o.customerId]
  return {
    id: o.id, link: `/orders/${o.id}`, date: o.orderDate, orderNumber: o.orderNumber, customer: o.customerName, customerCode: o.customerCode, salesman: o.salesmanName || ctx.L.people[o.salesmanId]?.name || '',
    hub: o.hubName || ctx.L.hubs[o.hubId]?.name || '', zone: ctx.L.zones[o.zoneId]?.name || '', status: orderStatus(o), approval: o.approvalStatus, priority: o.orderPriority,
    requestedDate: o.requestedDeliveryDate, lines: (o.items || []).length, quantity: Number(o.totalQuantity) || (o.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0),
    subtotal: r2(o.subtotal), discount: r2(o.discountAmount), tax: r2(o.taxAmount), total: r2(o.totalAmount), vip: c?.isVip ? 'VIP' : '', creditWarning: o.creditWarning ? 'Yes' : 'No',
    creditLimit: c?.creditLimit || 0, creditBalance: c?.creditBalance || 0,
  }
}

const itemRows = (ctx) => ctx.orders.filter(isSale).flatMap((o) => (o.items || []).map((it, i) => {
  const p = ctx.L.products[it.productId]
  return {
    id: `${o.id}-${i}`, date: o.orderDate, orderNumber: o.orderNumber, customer: o.customerName, salesman: o.salesmanName, hub: o.hubName, product: it.productName || p?.name, productCode: p?.code,
    category: p?.category || 'Uncategorised', quantity: Number(it.quantity) || 0, value: r2(it.lineTotal ?? (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), status: orderStatus(o),
  }
}))

const summarise = (rows, keyFn, label, extra = () => ({})) => [...group(rows, keyFn).entries()].map(([k, list]) => ({
  id: String(k), [label]: k, orders: list.length, quantity: list.reduce((s, r) => s + (r.quantity || 0), 0), value: r2(list.reduce((s, r) => s + (r.total ?? r.value ?? 0), 0)),
  avgValue: r2(list.reduce((s, r) => s + (r.total ?? r.value ?? 0), 0) / list.length), ...extra(list, k),
})).sort((a, b) => b.value - a.value)

const stockRow = (ctx, s) => {
  const p = ctx.L.products[s.productId]
  const h = ctx.L.hubs[s.hubId]
  const available = getAvailable(s)
  return {
    id: s.id, product: p?.name || s.productId, productCode: p?.code, category: p?.category || '', hub: h?.name || s.hubId, unit: p?.unit, onHand: s.totalQuantity, reserved: s.reservedQuantity || 0,
    damaged: s.damagedQuantity || 0, available, reorderLevel: s.reorderLevel, status: getStockStatus(s), unitCost: Number(p?.purchasePrice) || 0, value: r2(s.totalQuantity * (Number(p?.purchasePrice) || 0)),
    lastUpdated: day(s.lastUpdated), date: day(s.lastUpdated),
  }
}

const deliveryRow = (ctx, d) => {
  const o = ctx.orders.find((x) => x.id === d.orderId)
  const dispatch = ctx.dispatches.find((x) => x.id === d.dispatchId)
  const c = ctx.L.customers[d.customerId]
  const closedAt = d.completedAt || d.failedAt
  const onTime = d.completedAt && o?.requestedDeliveryDate ? (day(d.completedAt) <= o.requestedDeliveryDate ? 'On time' : 'Late') : ''
  return {
    id: d.id, link: `/dispatch/deliveries/${d.id}`, date: day(dispatch?.dispatchDate || d.createdAt), dispatchNumber: d.dispatchNumber, orderNumber: d.orderNumber, customer: d.customerName,
    driver: ctx.L.drivers[d.driverId]?.name || '', vehicle: ctx.L.vehicles[d.vehicleId]?.vehicleNumber || '', hub: ctx.L.hubs[d.hubId]?.name || '', zone: ctx.L.zones[d.zoneId]?.name || '',
    status: DELIVERY_STATUS_META[d.status]?.label || d.status, quantity: Number(d.totalQuantity) || 0, value: r2(d.totalAmount), sequence: d.sequence, completedAt: closedAt || '',
    otp: d.otpStatus || '', receivedBy: d.receivedBy || '', failureReason: d.failureReason || '', onTime, vip: c?.isVip ? 'VIP' : '', requestedDate: o?.requestedDeliveryDate || '',
    noteNumber: d.deliveryNoteNumber || '', pod: ctx.pods.some((p) => p.deliveryId === d.id) ? 'Captured' : (d.deliveryNoteNumber ? 'Delivery note only' : ''),
  }
}


/* ------------------------------------------------------------------ */
/* Definitions                                                         */
/* ------------------------------------------------------------------ */

const ORDER_COLS = [
  col('orderNumber', 'Order no.'), col('date', 'Order date', 'date'), col('customer', 'Customer'), col('salesman', 'Salesman'), col('hub', 'Hub'), col('status', 'Status', 'badge'),
  qty('quantity', 'Quantity'), money('subtotal', 'Subtotal'), money('discount', 'Discount'), money('tax', 'Tax'), money('total', 'Total'),
]
const SUMMARY_COLS = (label, title) => [col(label, title), col('orders', 'Orders', 'number', { sum: true }), qty('quantity', 'Quantity'), money('value', 'Value'), col('avgValue', 'Avg / order', 'currency')]
const orderKpis = (rows) => {
  const orders = rows.reduce((s, r) => s + (r.orders ?? 1), 0)
  const value = rows.reduce((s, r) => s + (r.total ?? r.value ?? 0), 0)
  return [
    { label: 'Orders', value: orders, type: 'number' }, { label: 'Quantity', value: rows.reduce((s, r) => s + (r.quantity || 0), 0), type: 'number' },
    { label: 'Value', value, type: 'currency' }, { label: 'Avg order', value: orders ? value / orders : 0, type: 'currency' },
  ]
}

export const REPORTS = [
  /* Sales */
  { id: 'sales-register', category: 'sales', title: 'Sales Order Register', description: 'Every sales order (excluding drafts) with customer, salesman, status and amounts.', popular: true,
    columns: [...ORDER_COLS.slice(0, 6), col('approval', 'Approval'), ...ORDER_COLS.slice(6)], rows: (ctx) => ctx.orders.filter((o) => o.orderStatus !== 'DRAFT').map((o) => orderRow(ctx, o)), kpis: orderKpis, chart: { by: 'status', value: 'count' } },
  { id: 'sales-summary', category: 'sales', title: 'Sales Order Summary', description: 'Orders, quantity and value per day (confirmed sales only).',
    columns: SUMMARY_COLS('date', 'Date').map((c) => (c.key === 'date' ? { ...c, type: 'date' } : c)), rows: (ctx) => summarise(ctx.orders.filter(isSale).map((o) => orderRow(ctx, o)), (r) => r.date, 'date').sort((a, b) => (a.date < b.date ? 1 : -1)), kpis: orderKpis, chart: { by: 'date', value: 'value', sort: 'label' } },
  { id: 'sales-by-customer', category: 'sales', title: 'Sales by Customer', description: 'Confirmed sales value and volume per customer.', popular: true,
    columns: SUMMARY_COLS('customer', 'Customer'), rows: (ctx) => summarise(ctx.orders.filter(isSale).map((o) => orderRow(ctx, o)), (r) => r.customer, 'customer'), kpis: orderKpis, chart: { by: 'customer', value: 'value' } },
  { id: 'sales-by-salesman', category: 'sales', title: 'Sales by Salesman', description: 'Confirmed sales per salesman.',
    columns: SUMMARY_COLS('salesman', 'Salesman'), rows: (ctx) => summarise(ctx.orders.filter(isSale).map((o) => orderRow(ctx, o)), (r) => r.salesman, 'salesman'), kpis: orderKpis, chart: { by: 'salesman', value: 'value' } },
  { id: 'sales-by-product', category: 'sales', title: 'Sales by Product', description: 'Quantity and value sold per product (order lines).', popular: true,
    columns: [col('product', 'Product'), col('category', 'Category'), col('orders', 'Order lines', 'number', { sum: true }), qty('quantity', 'Quantity'), money('value', 'Value')],
    rows: (ctx) => summarise(itemRows(ctx), (r) => r.product, 'product', (list) => ({ category: list[0].category })), chart: { by: 'product', value: 'value' } },
  { id: 'sales-by-category', category: 'sales', title: 'Sales by Category', description: 'Quantity and value sold per product category.',
    columns: [col('category', 'Category'), col('orders', 'Order lines', 'number', { sum: true }), qty('quantity', 'Quantity'), money('value', 'Value')], rows: (ctx) => summarise(itemRows(ctx), (r) => r.category, 'category'), chart: { by: 'category', value: 'value' } },
  { id: 'sales-by-month', category: 'sales', title: 'Sales by Month', description: 'Confirmed sales per calendar month.',
    columns: SUMMARY_COLS('month', 'Month'), rows: (ctx) => summarise(ctx.orders.filter(isSale).map((o) => ({ ...orderRow(ctx, o), month: dayjs(o.orderDate).format('YYYY-MM') })), (r) => r.month, 'month').sort((a, b) => (a.month < b.month ? -1 : 1)), kpis: orderKpis, chart: { by: 'month', value: 'value', sort: 'label' } },
  { id: 'sales-status', category: 'sales', title: 'Sales Order Status', description: 'Orders and value in each lifecycle status.',
    columns: SUMMARY_COLS('status', 'Status'), rows: (ctx) => summarise(ctx.orders.map((o) => orderRow(ctx, o)), (r) => r.status, 'status'), chart: { by: 'status', value: 'orders' } },
  { id: 'sales-pending-approval', category: 'sales', title: 'Pending Approval', description: 'Submitted orders waiting for the Sales Manager.',
    columns: [...ORDER_COLS.slice(0, 5), col('priority', 'Priority'), col('creditWarning', 'Credit warning'), money('total', 'Total')], rows: (ctx) => ctx.orders.filter((o) => o.orderStatus === 'SUBMITTED').map((o) => orderRow(ctx, o)), kpis: orderKpis },
  { id: 'sales-rejected', category: 'sales', title: 'Rejected Orders', description: 'Orders rejected or returned for correction, with the reason.',
    columns: [...ORDER_COLS.slice(0, 4), col('status', 'Status', 'badge'), col('reason', 'Reason'), col('remarks', 'Remarks'), money('total', 'Total')],
    rows: (ctx) => ctx.orders.filter((o) => ['REJECTED', 'RETURNED'].includes(o.orderStatus)).map((o) => ({ ...orderRow(ctx, o), reason: o.rejectionReason || o.returnReason || '', remarks: o.rejectionRemarks || o.returnRemarks || '' })), chart: { by: 'reason', value: 'count' } },
  { id: 'sales-approvals', category: 'sales', title: 'Approval Decisions', description: 'Every approval decision — approved, returned for correction or rejected — with the manager, date and reason.',
    columns: [col('orderNumber', 'Order'), col('date', 'Decided', 'date'), col('customer', 'Customer'), col('salesman', 'Salesman'), col('status', 'Decision', 'badge'), col('decidedBy', 'Decided by'), col('reason', 'Reason / remarks'), money('total', 'Order total')],
    rows: (ctx) => ctx.approvals.filter((a) => ctx.orderIds.has(a.orderId)).map((a) => { const o = ctx.L.orders[a.orderId] || {}; return { id: a.id, link: `/orders/${a.orderId}`, orderNumber: a.orderNumber, date: day(a.decidedAt), customer: o.customerName, salesman: o.salesmanName, hub: o.hubName, status: { APPROVED: 'Approved', RETURNED: 'Returned', REJECTED: 'Rejected' }[a.decision] || a.decision, decidedBy: a.decidedByName, reason: [a.reason, a.remarks].filter(Boolean).join(' — '), total: r2(a.orderTotal) } }),
    chart: { by: 'status', value: 'count' } },
  { id: 'sales-consolidation', category: 'sales', title: 'Consolidation Register', description: 'Orders consolidated by Customer Service and released to dispatch.',
    columns: [col('number', 'Consolidation no.'), col('date', 'Consolidated', 'date'), col('orderNumber', 'Order'), col('hub', 'Hub'), col('consolidatedBy', 'By'), qty('quantity', 'Quantity'), money('total', 'Value'), col('status', 'Released to dispatch', 'badge')],
    rows: (ctx) => ctx.consolidations.filter((c) => ctx.orderIds.has(c.orderId)).map((c) => ({ id: c.id, link: `/orders/${c.orderId}`, number: c.consolidationNumber, date: day(c.consolidationDate), orderNumber: c.orderNumber, customer: ctx.L.orders[c.orderId]?.customerName, hub: ctx.L.hubs[c.hubId]?.name, consolidatedBy: c.consolidatedByName, quantity: c.totalQuantity, total: r2(c.totalAmount), status: c.readyForDispatchAt ? 'Released' : 'Pending release' })) },
  { id: 'sales-credit-exceptions', category: 'sales', title: 'Credit Limit Exceptions', description: 'Orders flagged because the customer’s balance plus the order exceeds the credit limit.',
    columns: [...ORDER_COLS.slice(0, 3), col('status', 'Status', 'badge'), col('creditLimit', 'Credit limit', 'currency'), col('creditBalance', 'Balance', 'currency'), money('total', 'Order total')],
    rows: (ctx) => ctx.orders.filter((o) => o.creditWarning).map((o) => orderRow(ctx, o)) },
  { id: 'sales-conversion', category: 'sales', title: 'Order Conversion', description: 'Per salesman: submitted orders that were approved and delivered.',
    columns: [col('salesman', 'Salesman'), col('submitted', 'Submitted', 'number', { sum: true }), col('approved', 'Approved', 'number', { sum: true }), col('rejected', 'Rejected / returned', 'number', { sum: true }), col('delivered', 'Delivered', 'number', { sum: true }), col('approvalRate', 'Approval %', 'percent'), col('deliveryRate', 'Delivered %', 'percent')],
    rows: (ctx) => [...group(ctx.orders.filter((o) => o.orderStatus !== 'DRAFT'), (o) => o.salesmanName || 'Unassigned').entries()].map(([salesman, list]) => {
      const approved = list.filter((o) => (ORDER_STATUS_META[o.orderStatus]?.step || 0) >= 3).length
      const delivered = list.filter((o) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.orderStatus)).length
      return { id: salesman, salesman, submitted: list.length, approved, rejected: list.filter((o) => ['REJECTED', 'RETURNED'].includes(o.orderStatus)).length, delivered, approvalRate: pct(approved, list.length), deliveryRate: pct(delivered, list.length) }
    }), chart: { by: 'salesman', value: 'approved' } },
  { id: 'sales-customer-analysis', category: 'sales', title: 'Customer Sales Analysis', description: 'Order count, value, average order, first and last order per customer.',
    columns: [col('customer', 'Customer'), col('orders', 'Orders', 'number', { sum: true }), money('value', 'Value'), col('avgValue', 'Avg / order', 'currency'), col('firstOrder', 'First order', 'date'), col('lastOrder', 'Last order', 'date'), col('vip', 'VIP')],
    rows: (ctx) => summarise(ctx.orders.filter(isSale).map((o) => orderRow(ctx, o)), (r) => r.customer, 'customer', (list) => ({ firstOrder: list.map((r) => r.date).sort()[0], lastOrder: list.map((r) => r.date).sort().pop(), vip: list[0].vip })) },
  { id: 'sales-vip', category: 'sales', title: 'VIP Orders', description: 'Orders from VIP customers.', columns: [...ORDER_COLS.slice(0, 6), col('requestedDate', 'Requested delivery', 'date'), money('total', 'Total')],
    rows: (ctx) => ctx.orders.filter((o) => o.orderStatus !== 'DRAFT' && ctx.L.customers[o.customerId]?.isVip).map((o) => orderRow(ctx, o)), kpis: orderKpis },

  /* Inventory */
  { id: 'inv-overview', category: 'inventory', title: 'Stock Overview', description: 'On hand, reserved, damaged and available stock per product and hub.', popular: true,
    columns: [col('product', 'Product'), col('category', 'Category'), col('hub', 'Hub'), qty('onHand', 'On hand'), qty('reserved', 'Reserved'), qty('damaged', 'Damaged'), qty('available', 'Available'), col('reorderLevel', 'Reorder level', 'number'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.inventory.map((s) => stockRow(ctx, s)), chart: { by: 'status', value: 'count' } },
  { id: 'inv-valuation', category: 'inventory', title: 'Stock Valuation', description: 'On-hand stock valued at purchase cost.', popular: true,
    columns: [col('product', 'Product'), col('category', 'Category'), col('hub', 'Hub'), qty('onHand', 'On hand'), col('unitCost', 'Unit cost', 'currency'), money('value', 'Stock value')],
    rows: (ctx) => ctx.inventory.map((s) => stockRow(ctx, s)), kpis: (rows) => [{ label: 'Stock value', value: rows.reduce((s, r) => s + r.value, 0), type: 'currency' }, { label: 'Units on hand', value: rows.reduce((s, r) => s + r.onHand, 0), type: 'number' }], chart: { by: 'hub', value: 'value' } },
  { id: 'inv-movement', category: 'inventory', title: 'Stock Movement', description: 'Inflows and outflows per product and movement type.',
    columns: [col('product', 'Product'), col('hub', 'Hub'), col('type', 'Movement type'), col('movements', 'Movements', 'number', { sum: true }), qty('quantity', 'Quantity')],
    rows: (ctx) => [...group(ctx.movements, (m) => `${m.productId}|${m.hubId}|${m.movementType}`).entries()].map(([k, list]) => ({ id: k, date: day(list[0].date), product: ctx.L.products[list[0].productId]?.name, category: ctx.L.products[list[0].productId]?.category, hub: ctx.L.hubs[list[0].hubId]?.name, type: list[0].movementType, movements: list.length, quantity: list.reduce((s, m) => s + m.quantity, 0) })), chart: { by: 'type', value: 'quantity' } },
  { id: 'inv-expired', category: 'inventory', title: 'Expired Stock', description: 'Stock written off or requested for scrap because it expired.', note: 'Expiry dates are not tracked on stock; this report lists scrap requests with the reason “Expired”.',
    columns: [col('scrapNumber', 'Scrap no.'), col('date', 'Date', 'date'), col('product', 'Product'), col('batch', 'Batch'), col('hub', 'Hub'), qty('quantity', 'Quantity'), money('value', 'Value'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.scrap.filter((r) => r.reason === 'Expired').map((r) => scrapRow(r)) },
  { id: 'inv-slow', category: 'inventory', title: 'Slow Moving Stock', description: 'Stock lines with low average daily demand relative to stock (from the latest inventory prediction run).',
    columns: [col('product', 'Product'), col('hub', 'Hub'), qty('onHand', 'On hand'), col('avgDaily', 'Avg daily demand', 'number'), col('coverageDays', 'Days of cover', 'number'), col('trend', 'Trend')],
    rows: (ctx) => ctx.predictions.filter((p) => p.onHand > 0 && (p.coverageDays === null || p.coverageDays > 45) && p.avgDaily > 0).map((p) => ({ id: p.id, product: p.productName, category: p.category, hub: p.hubName, onHand: p.onHand, avgDaily: p.avgDaily, coverageDays: p.coverageDays === null ? null : Math.round(p.coverageDays), trend: p.trend })) },
  { id: 'inv-non-moving', category: 'inventory', title: 'Non Moving Stock', description: 'Stock lines with stock on hand and no demand in the lookback window.',
    columns: [col('product', 'Product'), col('hub', 'Hub'), qty('onHand', 'On hand'), money('value', 'Value'), col('lookbackDays', 'Days analysed', 'number')],
    rows: (ctx) => ctx.predictions.filter((p) => p.onHand > 0 && !p.avgDaily).map((p) => ({ id: p.id, product: p.productName, category: p.category, hub: p.hubName, onHand: p.onHand, value: r2(p.value || p.onHand * (p.unitCost || 0)), lookbackDays: p.lookbackDays })) },
  { id: 'inv-stockout', category: 'inventory', title: 'Stock-Out Report', description: 'Lines that are out of stock or below the reorder level.',
    columns: [col('product', 'Product'), col('hub', 'Hub'), qty('available', 'Available'), col('reorderLevel', 'Reorder level', 'number'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.inventory.map((s) => stockRow(ctx, s)).filter((r) => ['Out of Stock', 'Low Stock'].includes(r.status)), chart: { by: 'hub', value: 'count' } },
  { id: 'inv-transfer', category: 'inventory', title: 'Stock Transfer', description: 'Transfers between hubs.',
    columns: [col('transferNumber', 'Transfer no.'), col('date', 'Date', 'date'), col('product', 'Product'), col('from', 'From hub'), col('hub', 'To hub'), qty('quantity', 'Quantity'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.transfers.map((t) => ({ id: t.id, transferNumber: t.transferNumber, date: t.transferDate, product: ctx.L.products[t.productId]?.name, category: ctx.L.products[t.productId]?.category, from: ctx.L.hubs[t.sourceHubId]?.name, hub: ctx.L.hubs[t.destinationHubId]?.name, quantity: t.quantity, status: t.status })) },
  { id: 'inv-adjustment', category: 'inventory', title: 'Stock Adjustment', description: 'Stock adjustments with type and reason.',
    columns: [col('adjustmentNumber', 'Adjustment no.'), col('date', 'Date', 'date'), col('product', 'Product'), col('hub', 'Hub'), col('type', 'Type'), qty('quantity', 'Quantity'), col('reason', 'Reason')],
    rows: (ctx) => ctx.adjustments.map((a) => ({ id: a.id, adjustmentNumber: a.adjustmentNumber, date: a.adjustmentDate, product: ctx.L.products[a.productId]?.name, category: ctx.L.products[a.productId]?.category, hub: ctx.L.hubs[a.hubId]?.name, type: a.type, quantity: a.quantity, reason: a.reason })), chart: { by: 'type', value: 'quantity' } },
  { id: 'inv-scrap-register', category: 'inventory', title: 'Scrap Register', description: 'All scrap requests (see also the Scrap category).', rows: (ctx) => ctx.scrap.map(scrapRow), columns: () => SCRAP_COLS },
  { id: 'inv-scrap-valuation', category: 'inventory', title: 'Scrap Valuation', description: 'Written-off value by product.', rows: (ctx) => scrapBy(ctx, (r) => r.productName, 'product'), columns: () => SCRAP_SUM_COLS('product', 'Product'), chart: { by: 'product', value: 'value' } },
  { id: 'inv-warehouse-util', category: 'inventory', title: 'Warehouse Utilization', description: 'Stock units held per hub against the hub’s pallet capacity.', note: 'Pallet occupancy is not tracked; units on hand are shown next to configured capacity.',
    columns: [col('hub', 'Hub'), col('capacity', 'Capacity (pallets)', 'number'), col('coldRooms', 'Cold rooms', 'number'), col('lines', 'Stock lines', 'number', { sum: true }), qty('onHand', 'Units on hand'), money('value', 'Stock value')],
    rows: (ctx) => ctx.hubs.map((h) => { const st = ctx.inventory.filter((s) => s.hubId === h.id).map((s) => stockRow(ctx, s)); return { id: h.id, hub: h.name, capacity: h.capacityPallets || 0, coldRooms: h.coldRooms || 0, lines: st.length, onHand: st.reduce((s, r) => s + r.onHand, 0), value: r2(st.reduce((s, r) => s + r.value, 0)) } }), chart: { by: 'hub', value: 'onHand' } },
  { id: 'inv-transactions', category: 'inventory', title: 'Inventory Transaction History', description: 'The full stock movement ledger.', popular: true,
    columns: [col('movementNumber', 'Movement'), col('date', 'Date', 'date'), col('product', 'Product'), col('hub', 'Hub'), col('type', 'Type'), qty('quantity', 'Quantity'), col('before', 'Before', 'number'), col('after', 'After', 'number'), col('reference', 'Reference')],
    rows: (ctx) => ctx.movements.map((m) => ({ id: m.id, movementNumber: m.movementNumber, date: day(m.date), product: ctx.L.products[m.productId]?.name, category: ctx.L.products[m.productId]?.category, hub: ctx.L.hubs[m.hubId]?.name, type: m.movementType, quantity: m.quantity, before: m.previousQuantity, after: m.newQuantity, reference: m.referenceNumber })) },

  { id: 'inv-receipt-register', category: 'inventory', title: 'Stock Receipt Register', description: 'Stock receipts posted into hubs (purchase goods receipts are in Purchasing › Goods Receipts).',
    columns: [col('receiptNumber', 'GRN no.'), col('date', 'Date', 'date'), col('product', 'Product'), col('hub', 'Hub'), qty('quantity', 'Quantity'), col('reference', 'Reference'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.receipts.map((r) => ({ id: r.id, receiptNumber: r.receiptNumber, date: r.receiptDate, product: ctx.L.products[r.productId]?.name, category: ctx.L.products[r.productId]?.category, hub: ctx.L.hubs[r.hubId]?.name, quantity: r.quantity, reference: r.referenceNumber, status: r.status })), chart: { by: 'hub', value: 'quantity' } },

  /* Dispatch & delivery */
  { id: 'dsp-register', category: 'dispatch', title: 'Dispatch Register', description: 'Every dispatch with driver, vehicle, stops and status.', popular: true,
    columns: [col('dispatchNumber', 'Dispatch no.'), col('date', 'Date', 'date'), col('hub', 'Hub'), col('zone', 'Zone'), col('driver', 'Driver'), col('vehicle', 'Vehicle'), col('stops', 'Stops', 'number', { sum: true }), qty('quantity', 'Quantity'), money('value', 'Value'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.dispatches.map((d) => dispatchRow(ctx, d)), chart: { by: 'status', value: 'count' } },
  { id: 'dsp-summary', category: 'dispatch', title: 'Dispatch Summary', description: 'Dispatches, stops and value per day.', columns: [col('date', 'Date', 'date'), col('orders', 'Dispatches', 'number', { sum: true }), qty('quantity', 'Quantity'), money('value', 'Value')],
    rows: (ctx) => summarise(ctx.dispatches.map((d) => dispatchRow(ctx, d)), (r) => r.date, 'date').sort((a, b) => (a.date < b.date ? 1 : -1)), chart: { by: 'date', value: 'orders', sort: 'label' } },
  { id: 'dsp-by-zone', category: 'dispatch', title: 'Dispatch by Zone', description: 'Dispatches per delivery zone.', columns: [col('zone', 'Zone'), col('orders', 'Dispatches', 'number', { sum: true }), qty('quantity', 'Quantity'), money('value', 'Value')], rows: (ctx) => summarise(ctx.dispatches.map((d) => dispatchRow(ctx, d)), (r) => r.zone || 'No zone', 'zone'), chart: { by: 'zone', value: 'orders' } },
  { id: 'dsp-by-driver', category: 'dispatch', title: 'Dispatch by Driver', description: 'Dispatches per driver.', columns: [col('driver', 'Driver'), col('orders', 'Dispatches', 'number', { sum: true }), qty('quantity', 'Quantity'), money('value', 'Value')], rows: (ctx) => summarise(ctx.dispatches.map((d) => dispatchRow(ctx, d)), (r) => r.driver || 'Unassigned', 'driver'), chart: { by: 'driver', value: 'orders' } },
  { id: 'dsp-by-vehicle', category: 'dispatch', title: 'Dispatch by Vehicle', description: 'Dispatches per vehicle.', columns: [col('vehicle', 'Vehicle'), col('orders', 'Dispatches', 'number', { sum: true }), qty('quantity', 'Quantity'), money('value', 'Value')], rows: (ctx) => summarise(ctx.dispatches.map((d) => dispatchRow(ctx, d)), (r) => r.vehicle || 'Unassigned', 'vehicle'), chart: { by: 'vehicle', value: 'orders' } },
  { id: 'dlv-register', category: 'dispatch', title: 'Delivery Register', description: 'Every delivery stop with outcome, OTP and POD.', popular: true, columns: () => DLV_COLS, rows: (ctx) => ctx.deliveries.map((d) => deliveryRow(ctx, d)), chart: { by: 'status', value: 'count' } },
  { id: 'dlv-delivered', category: 'dispatch', title: 'Delivered Orders', description: 'Deliveries completed in full or partially.', columns: () => DLV_COLS, rows: (ctx) => ctx.deliveries.filter((d) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(d.status)).map((d) => deliveryRow(ctx, d)) },
  { id: 'dlv-pending', category: 'dispatch', title: 'Pending Deliveries', description: 'Deliveries dispatched or out for delivery.', columns: () => DLV_COLS, rows: (ctx) => ctx.deliveries.filter((d) => ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(d.status)).map((d) => deliveryRow(ctx, d)) },
  { id: 'dlv-failed', category: 'dispatch', title: 'Failed Deliveries', description: 'Failed and returned deliveries with the reason.', columns: [...DLV_BASE(), col('failureReason', 'Failure reason')], rows: (ctx) => ctx.deliveries.filter((d) => ['FAILED', 'RETURNED'].includes(d.status)).map((d) => deliveryRow(ctx, d)), chart: { by: 'failureReason', value: 'count' } },
  { id: 'dlv-partial', category: 'dispatch', title: 'Partial Deliveries', description: 'Deliveries where less than the dispatched quantity was accepted.', columns: () => DLV_COLS, rows: (ctx) => ctx.deliveries.filter((d) => d.status === 'PARTIALLY_DELIVERED').map((d) => deliveryRow(ctx, d)) },
  { id: 'dlv-performance', category: 'dispatch', title: 'Delivery Performance', description: 'Outcomes per hub: delivered, partial, failed and success rate.', columns: () => PERF_COLS('hub', 'Hub'), rows: (ctx) => perf(ctx, (r) => r.hub, 'hub'), chart: { by: 'hub', value: 'rate' } },
  { id: 'dlv-on-time', category: 'dispatch', title: 'On-Time Delivery', description: 'Completed deliveries compared with the requested delivery date.', columns: [...DLV_BASE(), col('requestedDate', 'Requested', 'date'), col('completedAt', 'Completed', 'datetime'), col('onTime', 'On time?', 'badge')],
    rows: (ctx) => ctx.deliveries.filter((d) => d.completedAt).map((d) => deliveryRow(ctx, d)), kpis: (rows) => [{ label: 'Completed', value: rows.length, type: 'number' }, { label: 'On time', value: rows.filter((r) => r.onTime === 'On time').length, type: 'number' }, { label: 'On-time rate', value: pct(rows.filter((r) => r.onTime === 'On time').length, rows.length), type: 'percent' }], chart: { by: 'onTime', value: 'count' } },
  { id: 'dlv-vip', category: 'dispatch', title: 'VIP Delivery Performance', description: 'Deliveries to VIP customers and their outcomes.', columns: [...DLV_BASE(), col('requestedDate', 'Requested', 'date'), col('onTime', 'On time?', 'badge')], rows: (ctx) => ctx.deliveries.filter((d) => ctx.L.customers[d.customerId]?.isVip).map((d) => deliveryRow(ctx, d)), chart: { by: 'status', value: 'count' } },
  { id: 'dlv-pod', category: 'dispatch', title: 'Delivery Proof Report', description: 'Proof of delivery captured per completed delivery (receiver, OTP, signature/photo, delivery note).', columns: [...DLV_BASE(), col('receivedBy', 'Received by'), col('otp', 'OTP'), col('pod', 'POD'), col('noteNumber', 'Delivery note')],
    rows: (ctx) => ctx.deliveries.filter((d) => d.completedAt).map((d) => deliveryRow(ctx, d)) },
  { id: 'dlv-otp', category: 'dispatch', title: 'OTP Verification Report', description: 'Delivery OTPs generated, verified, failed and expired (simulated OTP — no SMS is sent).', columns: [col('orderNumber', 'Order'), col('customer', 'Customer'), col('date', 'Generated', 'date'), col('attempts', 'Attempts', 'number'), col('status', 'Status', 'badge'), col('verifiedAt', 'Verified', 'datetime')],
    rows: (ctx) => ctx.otps.filter((o) => ctx.deliveries.some((d) => d.id === o.deliveryId)).map((o) => { const d = ctx.deliveries.find((x) => x.id === o.deliveryId); return { id: o.id, orderNumber: d?.orderNumber, customer: d?.customerName, driver: ctx.L.drivers[d?.driverId]?.name, date: day(o.generatedAt), attempts: o.attempts, status: o.status, verifiedAt: o.verifiedAt || '' } }), chart: { by: 'status', value: 'count' } },
  { id: 'dlv-notes', category: 'dispatch', title: 'Delivery Note Register', description: 'Delivery notes issued.', columns: [col('noteNumber', 'Note no.'), col('date', 'Date', 'date'), col('orderNumber', 'Order'), col('customer', 'Customer'), col('driver', 'Driver'), col('vehicle', 'Vehicle'), col('hub', 'Hub'), qty('quantity', 'Delivered qty')],
    rows: (ctx) => ctx.notes.map((n) => ({ id: n.id, link: `/dispatch/delivery-notes/${n.id}`, noteNumber: n.noteNumber, date: day(n.deliveryDate), orderNumber: n.orderNumber, customer: n.customerName, driver: n.driverName, vehicle: n.vehicleNumber, hub: n.hubName, quantity: (n.items || []).reduce((s, i) => s + (Number(i.deliveredQuantity) || 0), 0) })) },
  { id: 'dlv-driver-performance', category: 'dispatch', title: 'Driver Performance', description: 'Outcomes and success rate per driver.', columns: () => PERF_COLS('driver', 'Driver'), rows: (ctx) => perf(ctx, (r) => r.driver || 'Unassigned', 'driver'), chart: { by: 'driver', value: 'rate' } },
  { id: 'dlv-route-performance', category: 'dispatch', title: 'Route Performance', description: 'Outcomes and success rate per delivery zone (route).', columns: () => PERF_COLS('zone', 'Zone'), rows: (ctx) => perf(ctx, (r) => r.zone || 'No zone', 'zone'), chart: { by: 'zone', value: 'rate' } },
  { id: 'dlv-customer-history', category: 'dispatch', title: 'Customer Delivery History', description: 'Deliveries per customer with outcomes.', columns: () => PERF_COLS('customer', 'Customer'), rows: (ctx) => perf(ctx, (r) => r.customer, 'customer') },

  /* Finance */
  { id: 'fin-outstanding', category: 'finance', title: 'Customer Outstanding', description: 'Credit balance per customer against the credit limit.', popular: true, columns: () => OUTSTANDING_COLS, rows: (ctx) => outstanding(ctx), chart: { by: 'customer', value: 'balance' } },
  { id: 'fin-receivables', category: 'finance', title: 'Receivable Summary', description: 'Per customer: invoiced, received / credited and still open (posted receipts and approved credit notes).',
    columns: [col('customer', 'Customer'), col('invoices', 'Invoices', 'number', { sum: true }), money('value', 'Invoiced'), money('settled', 'Received / credited'), money('open', 'Open balance'), money('balance', 'Account outstanding')],
    rows: (ctx) => [...group(ctx.invoiceBalances, (b) => b.customerId).entries()].map(([cid, list]) => ({ id: cid, customer: ctx.L.customers[cid]?.name || cid, invoices: list.length, value: r2(list.reduce((s, b) => s + b.total, 0)), settled: r2(list.reduce((s, b) => s + b.paid + b.credited, 0)), open: r2(list.reduce((s, b) => s + b.balance, 0)), balance: ctx.L.customers[cid]?.creditBalance || 0 })), chart: { by: 'customer', value: 'open' } },
  { id: 'fin-invoices', category: 'finance', title: 'Invoice Register', description: 'Customer invoices with payment status (posted receipts and credit notes).', popular: true,
    columns: [col('invoiceNumber', 'Invoice no.'), col('date', 'Date', 'date'), col('customer', 'Customer'), col('orderNumber', 'Order'), col('hub', 'Hub'), money('taxable', 'Taxable'), money('tax', 'Tax'), money('total', 'Total'), money('paid', 'Received / credited'), money('open', 'Open'), col('dueDate', 'Due', 'date'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.invoices.map((i) => invoiceRow(ctx, i)), kpis: (rows) => [{ label: 'Invoices', value: rows.length, type: 'number' }, { label: 'Invoiced', value: rows.filter((r) => r.status !== 'Cancelled').reduce((s, r) => s + r.total, 0), type: 'currency' }, { label: 'Open', value: rows.reduce((s, r) => s + r.open, 0), type: 'currency' }], chart: { by: 'status', value: 'count' } },
  { id: 'fin-invoices-by-customer', category: 'finance', title: 'Invoices by Customer', description: 'Invoice count, value, tax and open balance per customer.', columns: () => INVOICE_SUM_COLS('customer', 'Customer'), rows: (ctx) => invoiceSummary(ctx, (r) => r.customer, 'customer'), chart: { by: 'customer', value: 'value' } },
  { id: 'fin-invoices-by-hub', category: 'finance', title: 'Invoices by Hub', description: 'Invoice count, value, tax and open balance per hub.', columns: () => INVOICE_SUM_COLS('hub', 'Hub'), rows: (ctx) => invoiceSummary(ctx, (r) => r.hub || 'No hub', 'hub'), chart: { by: 'hub', value: 'value' } },
  { id: 'fin-invoices-by-month', category: 'finance', title: 'Invoices by Month', description: 'Invoice count, value, tax and open balance per month.', columns: () => INVOICE_SUM_COLS('month', 'Month'), rows: (ctx) => invoiceSummary(ctx, (r) => String(r.date || '').slice(0, 7), 'month').sort((a, b) => (a.month < b.month ? -1 : 1)), chart: { by: 'month', value: 'value', sort: 'label' } },
  { id: 'fin-summary', category: 'finance', title: 'Finance Summary', description: 'Sales booked, invoiced, outstanding credit and scrap losses.', columns: [col('metric', 'Metric'), col('value', 'Amount', 'currency')],
    rows: (ctx) => [
      { id: 'booked', metric: 'Sales booked (confirmed orders)', value: r2(ctx.orders.filter(isSale).reduce((s, o) => s + (o.totalAmount || 0), 0)) },
      { id: 'delivered', metric: 'Sales delivered', value: r2(ctx.orders.filter((o) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.orderStatus)).reduce((s, o) => s + (o.totalAmount || 0), 0)) },
      { id: 'invoiced', metric: 'Invoiced', value: r2(ctx.invoices.filter((i) => i.status !== 'CANCELLED').reduce((s, i) => s + (i.totals?.grandTotal || 0), 0)) },
      { id: 'credit', metric: 'Customer credit outstanding', value: r2(ctx.customers.reduce((s, c) => s + (c.creditBalance || 0), 0)) },
      { id: 'stock', metric: 'Stock value (at cost)', value: r2(ctx.inventory.reduce((s, x) => s + x.totalQuantity * (Number(ctx.L.products[x.productId]?.purchasePrice) || 0), 0)) },
      { id: 'scrap', metric: 'Scrap written off', value: r2(ctx.scrap.filter((r) => r.status === 'COMPLETED').reduce((s, r) => s + r.value, 0)) },
    ] },

  /* Customer */
  { id: 'cus-master', category: 'customer', title: 'Customer Master', description: 'Customer accounts with type, hub, salesman, credit and VIP status.', popular: true,
    columns: [col('code', 'Code'), col('customer', 'Customer'), col('type', 'Type'), col('city', 'City'), col('hub', 'Hub'), col('salesman', 'Salesman'), col('creditLimit', 'Credit limit', 'currency'), col('vip', 'VIP'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.customers.map((c) => ({ id: c.id, link: `/customers/${c.id}`, code: c.code, customer: c.name, type: c.type, city: c.city, hub: ctx.L.hubs[c.hubId]?.name, zone: ctx.L.zones[c.zoneId]?.name, salesman: ctx.L.people[c.salesRepId]?.name || '', creditLimit: c.creditLimit || 0, vip: c.isVip ? 'VIP' : '', status: c.status, date: day(c.customerSince || c.createdAt) })), chart: { by: 'type', value: 'count' } },
  { id: 'cus-sales', category: 'customer', title: 'Customer Sales', description: 'Confirmed sales per customer.', columns: SUMMARY_COLS('customer', 'Customer'), rows: (ctx) => summarise(ctx.orders.filter(isSale).map((o) => orderRow(ctx, o)), (r) => r.customer, 'customer'), chart: { by: 'customer', value: 'value' } },
  { id: 'cus-outstanding', category: 'customer', title: 'Customer Outstanding', description: 'Credit balance per customer.', columns: () => OUTSTANDING_COLS, rows: (ctx) => outstanding(ctx), permission: ['customers.credit.view', 'finance.view'] },
  { id: 'cus-orders', category: 'customer', title: 'Customer Order History', description: 'Every order per customer.', columns: ORDER_COLS, rows: (ctx) => ctx.orders.filter((o) => o.orderStatus !== 'DRAFT').map((o) => orderRow(ctx, o)) },
  { id: 'cus-deliveries', category: 'customer', title: 'Customer Delivery History', description: 'Deliveries per customer with outcome.', columns: () => DLV_COLS, rows: (ctx) => ctx.deliveries.map((d) => deliveryRow(ctx, d)) },
  { id: 'cus-performance', category: 'customer', title: 'Customer Performance', description: 'Orders, value, delivery success and calls per customer.',
    columns: [col('customer', 'Customer'), col('orders', 'Orders', 'number', { sum: true }), money('value', 'Value'), col('deliveries', 'Deliveries', 'number', { sum: true }), col('success', 'Delivery success %', 'percent'), col('calls', 'Calls', 'number', { sum: true })],
    rows: (ctx) => ctx.customers.map((c) => { const os = ctx.orders.filter((o) => o.customerId === c.id && isSale(o)); const ds = ctx.deliveries.filter((d) => d.customerId === c.id && ['DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED', 'RETURNED'].includes(d.status)); return { id: c.id, customer: c.name, orders: os.length, value: r2(os.reduce((s, o) => s + o.totalAmount, 0)), deliveries: ds.length, success: pct(ds.filter((d) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(d.status)).length, ds.length), calls: ctx.calls.filter((x) => x.customerId === c.id).length } }).filter((r) => r.orders || r.calls) },

  /* Supplier */
  { id: 'sup-master', category: 'supplier', title: 'Supplier Master', description: 'Suppliers with lead time, minimum order value and categories.', columns: [col('supplier', 'Supplier'), col('leadTime', 'Lead time (days)', 'number'), col('moq', 'Min. order value', 'currency'), col('categories', 'Categories')],
    rows: (ctx) => ctx.suppliers.map((s) => ({ id: s.id, supplier: s.name, leadTime: s.leadTimeDays, moq: s.minOrderValue || 0, categories: (s.categories || []).join(', ') })) },

  /* Documents */
  { id: 'doc-register', category: 'documents', title: 'Document Register', description: 'Every document in the repository with type, related record, expiry and status.', popular: true,
    columns: [col('reference', 'Reference'), col('date', 'Uploaded', 'date'), col('type', 'Type'), col('number', 'Document no.'), col('entity', 'Entity'), col('related', 'Related to'), col('expiry', 'Expiry', 'date'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.documentsVisible.map((d) => documentRow(ctx, d)), chart: { by: 'status', value: 'count' } },
  { id: 'doc-by-type', category: 'documents', title: 'Documents by Type', description: 'Documents per type with verified, in-review, rejected and expired counts.', columns: () => DOC_SUM_COLS('type', 'Document type'), rows: (ctx) => documentSummary(ctx, (r) => r.type, 'type'), chart: { by: 'type', value: 'documents' } },
  { id: 'doc-by-entity', category: 'documents', title: 'Documents by Entity', description: 'Documents per related entity (customer, order, driver, vehicle, invoice …).', columns: () => DOC_SUM_COLS('entity', 'Entity'), rows: (ctx) => documentSummary(ctx, (r) => r.entity, 'entity'), chart: { by: 'entity', value: 'documents' } },
  { id: 'doc-expiry', category: 'documents', title: 'Document Expiry', description: 'Documents with an expiry date — expired, expiring this week / month, valid.', columns: [col('type', 'Type'), col('related', 'Related to'), col('expiry', 'Expiry', 'date'), col('daysLeft', 'Days left', 'number'), col('status', 'State', 'badge')],
    rows: (ctx) => ctx.documentsVisible.filter((d) => d.expiryDate).map((d) => { const e = expiryState(d.expiryDate); return { ...documentRow(ctx, d), daysLeft: e.days, status: EXPIRY_META[e.state]?.label || e.state } }).sort((a, b) => a.daysLeft - b.daysLeft), chart: { by: 'status', value: 'count' } },
  { id: 'doc-ocr', category: 'documents', title: 'OCR & Review', description: 'Documents processed by OCR: provider, values corrected in review and outcome.', note: 'OCR is simulated (MOCK) — it pre-fills values from records and never reads the image. Every result is reviewed by a person before verification.',
    columns: [col('reference', 'Reference'), col('type', 'Type'), col('related', 'Related to'), col('provider', 'OCR provider'), col('edited', 'Values edited in review', 'number', { sum: true }), col('processedAt', 'Processed', 'datetime'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.documentsVisible.filter((d) => d.ocrProvider).map((d) => ({ ...documentRow(ctx, d), provider: d.ocrProvider === 'MOCK' ? 'MOCK (simulated)' : d.ocrProvider, edited: Object.keys(d.ocrOriginal || {}).filter((k) => String(d.ocrOriginal[k] ?? '') !== String(d.ocrFields?.[k] ?? '')).length, processedAt: d.ocrProcessedAt || '' })), chart: { by: 'status', value: 'count' } },

  /* Fleet */
  { id: 'fleet-vehicles', category: 'fleet', title: 'Vehicle Register', description: 'Vehicles with type, hub, status and document expiry dates.', popular: true,
    columns: [col('vehicle', 'Vehicle'), col('type', 'Type'), col('model', 'Model'), col('hub', 'Hub'), col('capacity', 'Capacity', 'number'), col('insurance', 'Insurance expiry', 'date'), col('fitness', 'Fitness expiry', 'date'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.vehicles.map((v) => ({ id: v.id, link: `/vms/vehicles/${v.id}`, vehicle: v.vehicleNumber, type: v.type, model: v.model, hub: ctx.L.hubs[v.hubId]?.name, capacity: v.capacity, insurance: v.insuranceExpiry || '', fitness: v.fitnessExpiry || '', status: v.status })), chart: { by: 'status', value: 'count' } },
  { id: 'fleet-drivers', category: 'fleet', title: 'Driver Register', description: 'Drivers with hub, licence expiry, vehicle and availability.',
    columns: [col('code', 'Code'), col('driver', 'Driver'), col('mobile', 'Mobile'), col('hub', 'Hub'), col('vehicle', 'Vehicle'), col('licence', 'Licence expiry', 'date'), col('availability', 'Availability'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.drivers.map((d) => ({ id: d.id, link: `/dispatch/drivers/${d.id}`, code: d.code, driver: d.name, mobile: d.mobile, hub: ctx.L.hubs[d.hubId]?.name, zone: ctx.L.zones[d.zoneId]?.name, vehicle: ctx.L.vehicles[d.vehicleId]?.vehicleNumber || '', licence: d.licenseExpiry, availability: d.availability, status: d.status })) },
  { id: 'fleet-utilization', category: 'fleet', title: 'Vehicle Utilization', description: 'Dispatches, stops and load per vehicle against its capacity.', columns: [col('vehicle', 'Vehicle'), col('capacity', 'Capacity', 'number'), col('dispatches', 'Dispatches', 'number', { sum: true }), col('stops', 'Stops', 'number', { sum: true }), qty('quantity', 'Units carried'), col('avgLoad', 'Avg load %', 'percent')],
    rows: (ctx) => ctx.vehicles.map((v) => { const ds = ctx.dispatches.filter((d) => d.vehicleId === v.id && d.status !== 'CANCELLED'); const q = ds.reduce((s, d) => s + (d.totalQuantity || 0), 0); return { id: v.id, vehicle: v.vehicleNumber, hub: ctx.L.hubs[v.hubId]?.name, capacity: v.capacity, dispatches: ds.length, stops: ds.reduce((s, d) => s + (d.totalDeliveries || 0), 0), quantity: q, avgLoad: ds.length && v.capacity ? pct(q / ds.length, v.capacity) : 0 } }), chart: { by: 'vehicle', value: 'dispatches' } },
  { id: 'fleet-doc-expiry', category: 'fleet', title: 'Vehicle & Driver Document Expiry', description: 'Required vehicle and driver documents (VMS compliance rules) with expiry date and days left.', popular: true,
    columns: [col('owner', 'Vehicle / driver'), col('ownerType', 'Type'), col('document', 'Document'), col('required', 'Required'), col('expiry', 'Expiry', 'date'), col('daysLeft', 'Days left', 'number'), col('status', 'State', 'badge')],
    rows: (ctx) => expiryRegister({ vehicles: ctx.vehicles, drivers: ctx.drivers }).map((r) => ({ id: `${r.ownerId}-${r.field}`, link: r.ownerType === 'vehicle' ? `/vms/vehicles/${r.ownerId}/documents` : `/vms/drivers/${r.ownerId}/documents`, owner: r.ownerName, ownerType: r.ownerType === 'vehicle' ? 'Vehicle' : 'Driver', document: r.label, required: r.required ? 'Yes' : 'No', expiry: r.date || '', date: r.date || '', daysLeft: r.days, hub: ctx.L.hubs[r.hubId]?.name, vehicle: r.ownerType === 'vehicle' ? r.ownerName : '', driver: r.ownerType === 'driver' ? r.ownerName : '', status: EXPIRY_META[r.state]?.label || r.state })).sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)),
    chart: { by: 'status', value: 'count' } },
  { id: 'fleet-doc-status', category: 'fleet', title: 'Vehicle Document Status', description: 'Documents per vehicle in the repository: uploaded, verified and pending review, with the worst compliance state.',
    columns: [col('vehicle', 'Vehicle'), col('hub', 'Hub'), col('documents', 'Documents', 'number', { sum: true }), col('verified', 'Verified', 'number', { sum: true }), col('pending', 'Pending review', 'number', { sum: true }), col('status', 'Compliance', 'badge')],
    rows: (ctx) => { const reg = expiryRegister({ vehicles: ctx.vehicles, drivers: [] }); const rank = ['EXPIRED', 'TODAY', 'WEEK', 'MONTH', 'MISSING', 'VALID']; return ctx.vehicles.map((v) => { const docs = ctx.documents.filter((d) => d.entityType === 'vehicle' && d.entityId === v.id); const worst = reg.filter((r) => r.ownerId === v.id).map((r) => r.state).sort((a, b) => rank.indexOf(a) - rank.indexOf(b))[0] || 'VALID'; return { id: v.id, link: `/vms/vehicles/${v.id}`, vehicle: v.vehicleNumber, hub: ctx.L.hubs[v.hubId]?.name, documents: docs.length, verified: docs.filter((d) => effectiveStatus(d) === 'VERIFIED').length, pending: docs.filter((d) => QUEUE_STATUSES.includes(d.status)).length, status: EXPIRY_META[worst]?.label || worst } }) }, chart: { by: 'status', value: 'count' } },
  { id: 'fleet-per-vehicle', category: 'fleet', title: 'Delivery per Vehicle', description: 'Delivery outcomes per vehicle.', columns: () => PERF_COLS('vehicle', 'Vehicle'), rows: (ctx) => perf(ctx, (r) => r.vehicle || 'Unassigned', 'vehicle'), chart: { by: 'vehicle', value: 'delivered' } },

  /* Communication */
  { id: 'com-calls', category: 'communication', title: 'Call History', description: 'Every logged call (manual log — no telephony connected).', popular: true,
    columns: [col('callNumber', 'Call ID'), col('date', 'Date', 'date'), col('time', 'Time'), col('customer', 'Customer'), col('salesman', 'Salesman'), col('direction', 'Direction'), col('duration', 'Duration'), col('status', 'Status', 'badge'), col('outcome', 'Outcome'), col('relatedOrder', 'Related SO')],
    rows: (ctx) => ctx.calls.map(callRow), chart: { by: 'outcome', value: 'count' } },
  { id: 'com-by-salesman', category: 'communication', title: 'Calls by Salesman', description: 'Calls, connected calls and orders per salesman.', columns: () => CALL_SUM_COLS('salesman', 'Salesman'), rows: (ctx) => callSummary(ctx, (c) => c.salesmanName, 'salesman'), chart: { by: 'salesman', value: 'calls' } },
  { id: 'com-by-customer', category: 'communication', title: 'Calls by Customer', description: 'Calls per customer.', columns: () => CALL_SUM_COLS('customer', 'Customer'), rows: (ctx) => callSummary(ctx, (c) => c.customerName, 'customer'), chart: { by: 'customer', value: 'calls' } },
  { id: 'com-outcome', category: 'communication', title: 'Call Outcome', description: 'Calls per outcome.', columns: [col('outcome', 'Outcome'), col('calls', 'Calls', 'number', { sum: true }), col('share', 'Share %', 'percent')],
    rows: (ctx) => [...group(ctx.calls, (c) => c.outcome).entries()].map(([o, list]) => ({ id: o, outcome: o, calls: list.length, share: pct(list.length, ctx.calls.length) })), chart: { by: 'outcome', value: 'calls' } },
  { id: 'com-followup-pending', category: 'communication', title: 'Follow-up Pending', description: 'Open follow-ups due today or later.', columns: () => FOLLOW_COLS, rows: (ctx) => ctx.calls.filter((c) => ['today', 'upcoming'].includes(followUpBucket(c))).map(callRow) },
  { id: 'com-followup-overdue', category: 'communication', title: 'Overdue Follow-ups', description: 'Follow-ups past their date.', columns: () => FOLLOW_COLS, rows: (ctx) => ctx.calls.filter((c) => followUpBucket(c) === 'overdue').map(callRow) },
  { id: 'com-conversion', category: 'communication', title: 'Call-to-Order Conversion', description: 'Connected calls that produced a sales order, per salesman.', columns: [col('salesman', 'Salesman'), col('calls', 'Calls', 'number', { sum: true }), col('connected', 'Connected', 'number', { sum: true }), col('orders', 'Orders', 'number', { sum: true }), col('conversion', 'Conversion %', 'percent')],
    rows: (ctx) => callSummary(ctx, (c) => c.salesmanName, 'salesman'), chart: { by: 'salesman', value: 'conversion' } },

  /* Scrap */
  { id: 'scrap-register', category: 'scrap', title: 'Scrap Register', description: 'All scrap requests with status and write-off.', popular: true, columns: () => SCRAP_COLS, rows: (ctx) => ctx.scrap.map(scrapRow), chart: { by: 'status', value: 'count' } },
  { id: 'scrap-by-product', category: 'scrap', title: 'Scrap by Product', description: 'Written-off quantity and value per product.', columns: () => SCRAP_SUM_COLS('product', 'Product'), rows: (ctx) => scrapBy(ctx, (r) => r.productName, 'product'), chart: { by: 'product', value: 'value' } },
  { id: 'scrap-by-batch', category: 'scrap', title: 'Scrap by Batch', description: 'Scrap requests per batch reference.', columns: () => SCRAP_SUM_COLS('batch', 'Batch'), rows: (ctx) => scrapBy(ctx, (r) => r.batchNumber || 'No batch', 'batch', true) },
  { id: 'scrap-by-hub', category: 'scrap', title: 'Scrap by Hub', description: 'Written-off quantity and value per hub.', columns: () => SCRAP_SUM_COLS('hub', 'Hub'), rows: (ctx) => scrapBy(ctx, (r) => r.hubName, 'hub'), chart: { by: 'hub', value: 'value' } },
  { id: 'scrap-by-reason', category: 'scrap', title: 'Scrap by Reason', description: 'Written-off quantity and value per reason.', columns: () => SCRAP_SUM_COLS('reason', 'Reason'), rows: (ctx) => scrapBy(ctx, (r) => r.reason, 'reason'), chart: { by: 'reason', value: 'value' } },
  { id: 'scrap-valuation', category: 'scrap', title: 'Scrap Valuation', description: 'Value of stock written off, by month.', columns: () => SCRAP_SUM_COLS('month', 'Month'), rows: (ctx) => scrapBy(ctx, (r) => dayjs(r.writeOff?.at || r.requestDate).format('YYYY-MM'), 'month').sort((a, b) => (a.month < b.month ? -1 : 1)), chart: { by: 'month', value: 'value', sort: 'label' } },
  { id: 'scrap-approvals', category: 'scrap', title: 'Scrap Approval History', description: 'Approval decisions with approver, date and remarks.',
    columns: [col('scrapNumber', 'Scrap no.'), col('date', 'Requested', 'date'), col('product', 'Product'), col('requestedBy', 'Requested by'), col('approval', 'Decision', 'badge'), col('decidedBy', 'Decided by'), col('decidedAt', 'Decided at', 'datetime'), col('remarks', 'Remarks')],
    rows: (ctx) => ctx.scrap.filter((r) => r.approvedAt || r.rejectedAt).map((r) => ({ ...scrapRow(r), approval: approvalStatusOf(r), decidedBy: r.approvedByName || r.rejectedByName, decidedAt: r.approvedAt || r.rejectedAt, remarks: r.approvalRemarks || r.rejectionReason })) },

  /* AI */
  { id: 'ai-sales', category: 'ai', title: 'Sales Insights', description: 'AI insights about sales from the latest insight run.', columns: () => INSIGHT_COLS, rows: (ctx) => insightRows(ctx, /SALES|CUSTOMER|ORDER/) },
  { id: 'ai-inventory', category: 'ai', title: 'Inventory Insights', description: 'AI insights about stock.', columns: () => INSIGHT_COLS, rows: (ctx) => insightRows(ctx, /STOCK|INVENTORY|REORDER|EXPIRY|OVERSTOCK/) },
  { id: 'ai-forecast', category: 'ai', title: 'Demand Forecast', description: 'Forecast demand per stock line (latest prediction run).', columns: [col('product', 'Product'), col('hub', 'Hub'), col('model', 'Model'), col('forecast', 'Forecast demand', 'number', { sum: true }), col('avgDaily', 'Avg daily', 'number'), col('trend', 'Trend'), col('stockoutDate', 'Stock-out date', 'date')],
    rows: (ctx) => ctx.predictions.map((p) => ({ id: p.id, product: p.productName, category: p.category, hub: p.hubName, model: p.forecastModel, forecast: r2(p.forecastDemand), avgDaily: p.avgDaily, trend: p.trend, stockoutDate: p.stockoutDate || '' })) },
  { id: 'ai-expiry-risk', category: 'ai', title: 'Expiry Risk', description: 'Stock lines with high cover (risk of ageing) from the prediction run.', note: 'Estimated from days of cover; lot expiry dates are in Batches, Expiry & QA › Batch Expiry (FEFO).',
    columns: [col('product', 'Product'), col('hub', 'Hub'), qty('onHand', 'On hand'), col('coverageDays', 'Days of cover', 'number'), col('risk', 'Risk', 'badge')],
    rows: (ctx) => ctx.predictions.filter((p) => p.onHand > 0 && (p.coverageDays === null || p.coverageDays > 60)).map((p) => ({ id: p.id, product: p.productName, category: p.category, hub: p.hubName, onHand: p.onHand, coverageDays: p.coverageDays === null ? null : Math.round(p.coverageDays), risk: p.coverageDays === null || p.coverageDays > 120 ? 'High' : 'Medium' })) },
  { id: 'ai-slow', category: 'ai', title: 'Slow-Moving Products', description: 'Products with decreasing or no demand.', columns: [col('product', 'Product'), col('hub', 'Hub'), col('avgDaily', 'Avg daily', 'number'), col('trendPct', 'Trend % / week', 'number'), qty('onHand', 'On hand')],
    rows: (ctx) => ctx.predictions.filter((p) => p.onHand > 0 && (p.trend === 'Decreasing' || !p.avgDaily)).map((p) => ({ id: p.id, product: p.productName, category: p.category, hub: p.hubName, avgDaily: p.avgDaily, trendPct: p.trendPctWeek, onHand: p.onHand })) },
  { id: 'ai-delivery', category: 'ai', title: 'Delivery Insights', description: 'AI insights about dispatch and delivery.', columns: () => INSIGHT_COLS, rows: (ctx) => insightRows(ctx, /DELIVER|DISPATCH|DRIVER|ROUTE|FLEET|VEHICLE/) },
  { id: 'ai-replenishment', category: 'ai', title: 'Replenishment Proposals', description: 'AI replenishment drafts and their hand-over to procurement (purchase requisitions).', permission: ['procurement.view', 'inventory.predictions.view'],
    columns: [col('number', 'Draft no.'), col('date', 'Date', 'date'), col('supplier', 'Supplier'), col('hub', 'Hub'), col('lines', 'Lines', 'number'), qty('quantity', 'Quantity'), money('value', 'Value'), col('status', 'Status', 'badge')],
    rows: (ctx) => ctx.drafts.map((d) => poRow(ctx, d)), chart: { by: 'status', value: 'count' } },
  { id: 'ai-summary', category: 'ai', title: 'Business Summary', description: 'All current AI insights, by severity.', columns: () => INSIGHT_COLS, rows: (ctx) => insightRows(ctx, /./), chart: { by: 'severity', value: 'count' } },
  // Enterprise reports — same shape, viewer, export and preferences as every other report
  ...ENTERPRISE_REPORTS,
]

/* ----- builders used above (hoisted function declarations) ----- */

function scrapRow(r) {
  return {
    id: r.id, link: `/inventory/scrap/requests/${r.id}`, scrapNumber: r.scrapNumber, date: r.requestDate, product: r.productName, category: r.category, batch: r.batchNumber, hub: r.hubName,
    warehouse: r.warehouseId || '', quantity: r.quantity, unit: r.unit, value: r.value, reason: r.reason, status: SCRAP_STATUS_META[r.status]?.label || r.status, requestedBy: r.requestedByName,
    movement: r.writeOff?.movementNumber || '',
  }
}
const SCRAP_COLS = [col('scrapNumber', 'Scrap no.'), col('date', 'Date', 'date'), col('product', 'Product'), col('batch', 'Batch'), col('hub', 'Hub'), qty('quantity', 'Quantity'), money('value', 'Value'), col('reason', 'Reason'), col('requestedBy', 'Requested by'), col('status', 'Status', 'badge'), col('movement', 'Write-off movement')]
const SCRAP_SUM_COLS = (key, label) => [col(key, label), col('requests', 'Requests', 'number', { sum: true }), qty('quantity', 'Quantity written off'), money('value', 'Value written off')]
function scrapBy(ctx, keyFn, label, all = false) {
  const list = ctx.scrap.filter((r) => (all ? r.status !== 'CANCELLED' : r.status === 'COMPLETED'))
  return [...group(list, keyFn).entries()].map(([k, rows]) => ({
    id: String(k), [label]: k, category: rows[0].category, hub: label === 'hub' ? k : undefined, product: label === 'product' ? k : undefined, reason: label === 'reason' ? k : rows[0].reason,
    requests: rows.length, quantity: rows.filter((r) => r.status === 'COMPLETED').reduce((s, r) => s + r.quantity, 0), value: r2(rows.filter((r) => r.status === 'COMPLETED').reduce((s, r) => s + r.value, 0)),
  })).sort((a, b) => b.value - a.value)
}
function poRow(ctx, d) {
  return {
    id: d.id, link: `/ai/replenishment/${d.id}`, number: d.number, date: day(d.createdAt), supplier: d.supplierName || ctx.L.suppliers[d.supplierId]?.name, hub: ctx.L.hubs[d.hubId]?.name, lines: (d.lines || []).length,
    quantity: (d.lines || []).reduce((s, l) => s + (l.quantity || 0), 0), value: r2((d.lines || []).reduce((s, l) => s + (l.quantity || 0) * (l.unitCost || 0), 0)), status: REPLENISHMENT_META[d.status]?.label || d.status,
  }
}
function dispatchRow(ctx, d) {
  return {
    id: d.id, link: `/dispatch/${d.id}`, dispatchNumber: d.dispatchNumber, date: d.dispatchDate, hub: ctx.L.hubs[d.hubId]?.name, zone: ctx.L.zones[d.zoneId]?.name || '', driver: d.driverName || ctx.L.drivers[d.driverId]?.name || '',
    vehicle: d.vehicleNumber || ctx.L.vehicles[d.vehicleId]?.vehicleNumber || '', stops: d.totalDeliveries || (d.orderIds || []).length, quantity: d.totalQuantity || 0, value: r2(d.totalValue), status: DISPATCH_STATUS_META[d.status]?.label || d.status,
  }
}
function DLV_BASE() { return [col('orderNumber', 'Order'), col('date', 'Dispatch date', 'date'), col('customer', 'Customer'), col('driver', 'Driver'), col('vehicle', 'Vehicle'), col('status', 'Status', 'badge')] }
const DLV_COLS = [...DLV_BASE(), col('hub', 'Hub'), qty('quantity', 'Quantity'), money('value', 'Value'), col('otp', 'OTP'), col('pod', 'POD'), col('noteNumber', 'Delivery note')]
const PERF_COLS = (key, label) => [col(key, label), col('total', 'Stops', 'number', { sum: true }), col('delivered', 'Delivered', 'number', { sum: true }), col('partial', 'Partial', 'number', { sum: true }), col('failed', 'Failed', 'number', { sum: true }), col('open', 'Open', 'number', { sum: true }), col('rate', 'Success %', 'percent')]
function perf(ctx, keyFn, label) {
  return [...group(ctx.deliveries.map((d) => deliveryRow(ctx, d)), keyFn).entries()].map(([k, list]) => {
    const delivered = list.filter((r) => r.status === DELIVERY_STATUS_META.DELIVERED.label).length
    const partial = list.filter((r) => r.status === DELIVERY_STATUS_META.PARTIALLY_DELIVERED.label).length
    const failed = list.filter((r) => [DELIVERY_STATUS_META.FAILED.label, DELIVERY_STATUS_META.RETURNED.label].includes(r.status)).length
    const open = list.length - delivered - partial - failed
    return { id: String(k), [label]: k, total: list.length, delivered, partial, failed, open, rate: pct(delivered + partial, delivered + partial + failed) }
  }).sort((a, b) => b.total - a.total)
}
const OUTSTANDING_COLS = [col('customer', 'Customer'), col('creditEnabled', 'Credit'), col('creditLimit', 'Credit limit', 'currency', { sum: true }), money('balance', 'Outstanding'), col('available', 'Available credit', 'currency', { sum: true }), col('utilisation', 'Utilisation %', 'percent'), col('creditDays', 'Credit days', 'number')]
function outstanding(ctx) {
  return ctx.customers.filter((c) => c.creditEnabled || c.creditBalance).map((c) => ({ id: c.id, customer: c.name, hub: ctx.L.hubs[c.hubId]?.name, salesman: ctx.L.people[c.salesRepId]?.name, creditEnabled: c.creditEnabled ? 'Enabled' : 'Off', creditLimit: c.creditLimit || 0, balance: c.creditBalance || 0, available: Math.max(0, (c.creditLimit || 0) - (c.creditBalance || 0)), utilisation: pct(c.creditBalance || 0, c.creditLimit || 0), creditDays: c.creditDays || 0 })).sort((a, b) => b.balance - a.balance)
}
const invoiceRow = (ctx, i) => {
  const b = ctx.B[i.id]
  const cancelled = i.status === 'CANCELLED'
  return {
    id: i.id, link: `/invoices/${i.id}`, invoiceNumber: i.invoiceNumber, date: i.invoiceDate, dueDate: i.dueDate || '', customer: i.customerSnapshot?.name || ctx.L.customers[i.customerId]?.name, orderNumber: i.orderNumber,
    hub: ctx.L.hubs[i.hubId]?.name, taxable: r2(i.totals?.taxableAmount), tax: r2(i.totals?.taxAmount), total: r2(i.totals?.grandTotal),
    paid: cancelled ? 0 : r2((b?.paid || 0) + (b?.credited || 0)), open: cancelled ? 0 : r2(b?.balance ?? i.totals?.grandTotal),
    status: cancelled ? 'Cancelled' : !b ? 'Issued' : b.status === 'PAID' ? 'Paid' : b.status === 'PARTIAL' ? 'Partially paid' : b.overdueDays > 0 ? 'Overdue' : 'Open',
  }
}
const INVOICE_SUM_COLS = (key, label) => [col(key, label), col('invoices', 'Invoices', 'number', { sum: true }), money('value', 'Invoiced'), money('tax', 'Tax'), money('open', 'Open balance')]
function invoiceSummary(ctx, keyFn, key) {
  const rows = ctx.invoices.filter((i) => i.status !== 'CANCELLED').map((i) => invoiceRow(ctx, i))
  return [...group(rows, keyFn).entries()].map(([k, list]) => ({ id: k, [key]: k, invoices: list.length, value: r2(list.reduce((s, r) => s + r.total, 0)), tax: r2(list.reduce((s, r) => s + r.tax, 0)), open: r2(list.reduce((s, r) => s + r.open, 0)) })).sort((a, b) => b.value - a.value)
}
const documentRow = (ctx, d) => ({
  id: d.id, link: `/documents/${d.id}`, reference: d.documentNumberRef, date: day(d.uploadedAt), type: ctx.L.documentTypes[d.typeId]?.name || d.typeCode, number: d.documentNumber || '',
  entity: ENTITY_LABEL[d.entityType] || d.entityType, related: d.entityLabel || '', expiry: d.expiryDate || '', status: DOCUMENT_STATUS_META[effectiveStatus(d)]?.label || d.status,
})
const DOC_SUM_COLS = (key, label) => [col(key, label), col('documents', 'Documents', 'number', { sum: true }), col('verified', 'Verified', 'number', { sum: true }), col('inReview', 'In OCR / review', 'number', { sum: true }), col('rejected', 'Rejected', 'number', { sum: true }), col('expired', 'Expired', 'number', { sum: true })]
function documentSummary(ctx, keyFn, key) {
  return [...group(ctx.documentsVisible.map((d) => ({ ...documentRow(ctx, d), raw: effectiveStatus(d), queued: QUEUE_STATUSES.includes(d.status) })), keyFn).entries()].map(([k, list]) => ({ id: k, [key]: k, documents: list.length, verified: list.filter((r) => r.raw === 'VERIFIED').length, inReview: list.filter((r) => r.queued).length, rejected: list.filter((r) => r.raw === 'REJECTED').length, expired: list.filter((r) => r.raw === 'EXPIRED').length })).sort((a, b) => b.documents - a.documents)
}
function callRow(c) {
  return {
    id: c.id, link: `/communication/calls/${c.id}`, callNumber: c.callNumber, date: c.callDate, time: c.callTime, customer: c.customerName, salesman: c.salesmanName, direction: c.direction,
    duration: formatDuration(c.durationSeconds), status: c.status, outcome: c.outcome, relatedOrder: c.relatedOrderNumber || '', followUpDate: c.followUpDate || '', followUpNotes: c.followUpNotes || '', phone: c.phone,
  }
}
const FOLLOW_COLS = [col('callNumber', 'Call ID'), col('customer', 'Customer'), col('phone', 'Phone'), col('salesman', 'Salesman'), col('outcome', 'Outcome'), col('followUpDate', 'Follow-up date', 'date'), col('followUpNotes', 'Notes')]
const CALL_SUM_COLS = (key, label) => [col(key, label), col('calls', 'Calls', 'number', { sum: true }), col('connected', 'Connected', 'number', { sum: true }), col('missed', 'Missed', 'number', { sum: true }), col('orders', 'Orders', 'number', { sum: true }), col('conversion', 'Conversion %', 'percent')]
function callSummary(ctx, keyFn, label) {
  return [...group(ctx.calls, keyFn).entries()].map(([k, list]) => {
    const connected = list.filter((c) => c.status === 'Connected').length
    const orders = list.filter((c) => c.relatedOrderId || c.outcome === 'Order Received').length
    return { id: String(k), [label]: k, calls: list.length, connected, missed: list.filter((c) => c.status === 'Missed').length, orders, conversion: pct(orders, connected) }
  }).sort((a, b) => b.calls - a.calls)
}
const INSIGHT_COLS = [col('title', 'Insight'), col('severity', 'Severity', 'badge'), col('type', 'Type'), col('description', 'Details'), col('date', 'Generated', 'date')]
function insightRows(ctx, re) {
  return ctx.insights.filter((i) => re.test(i.type || '') && (!i.permission || can(ctx.user, i.permission))).map((i) => ({ id: i.key || i.id, title: i.title, severity: i.severity, type: i.type, description: i.description, date: day(i.generatedAt), link: i.entity?.path }))
}

/* ------------------------------------------------------------------ */
/* Access, lookup, run                                                 */
/* ------------------------------------------------------------------ */

const permsOf = (p) => (Array.isArray(p) ? p : p ? [p] : [])
export const categoryOf = (id) => REPORT_CATEGORIES.find((c) => c.id === id)
export const canViewReport = (user, report) => {
  if (!report || !can(user, 'reports.center')) return false
  const perms = permsOf(report.permission || categoryOf(report.category)?.permission)
  return perms.some((k) => can(user, k))
}
export const getReport = (id) => REPORTS.find((r) => r.id === id) || null
export const visibleReports = (user) => REPORTS.filter((r) => canViewReport(user, r))
export const reportColumns = (report) => (typeof report.columns === 'function' ? report.columns() : report.columns)

/** Run a report → { rows, columns, error } */
export const runReport = (report, ctx) => {
  try {
    return { rows: report.unavailable ? [] : report.rows(ctx), columns: reportColumns(report), error: null }
  } catch (err) {
    return { rows: [], columns: reportColumns(report), error: err.message || 'This report could not be built from the current data.' }
  }
}

/* ------------------------------------------------------------------ */
/* Favourites / recent / popularity (per user)                         */
/* ------------------------------------------------------------------ */

const EMPTY_PREFS = { favorites: [], recent: [], views: {} }
export const getReportPrefs = (userId, all = read(K.REPORT_PREFS, {})) => ({ ...EMPTY_PREFS, ...(all?.[userId] || {}) })
const writePrefs = (userId, fn) => {
  const all = read(K.REPORT_PREFS, {}) || {}
  const next = fn(getReportPrefs(userId, all))
  return storage.setItem(K.REPORT_PREFS, { ...all, [userId]: next })
}
export const toggleFavoriteReport = (userId, id) => writePrefs(userId, (p) => ({ ...p, favorites: p.favorites.includes(id) ? p.favorites.filter((x) => x !== id) : [...p.favorites, id] }))
export const recordReportView = (userId, id) => writePrefs(userId, (p) => ({ ...p, recent: [id, ...p.recent.filter((x) => x !== id)].slice(0, 8), views: { ...p.views, [id]: (p.views[id] || 0) + 1 } }))
/** Views across all users (for "Popular"). */
export const reportViewCounts = (all = read(K.REPORT_PREFS, {})) => {
  const out = {}
  Object.values(all || {}).forEach((p) => Object.entries(p?.views || {}).forEach(([id, n]) => { out[id] = (out[id] || 0) + n }))
  return out
}
