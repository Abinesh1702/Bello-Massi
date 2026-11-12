/**
 * Sales orders (Phase 3).
 *
 * Every status change goes through this module (or approvalService / consolidationService).
 * Each operation:
 *   1. checks the signed-in user's role and ownership,
 *   2. re-reads the order from storage and validates the status transition,
 *   3. writes the order, its timeline event(s) and the order-number sequence in ONE transaction,
 *   4. then raises notifications and the activity-feed entry.
 * Approval reserves stock (approvalService); cancellation here releases it. Orders never change on-hand stock,
 * credit balances or invoices.
 */
import { fireEvent } from './automationService'
import dayjs from 'dayjs'
import storage from './storageService'
import { getCurrentUser } from './authService'
import { pushNotification } from './notificationService'
import { makeTimelineEvent, logOrderActivity } from './orderTimelineService'
import { getCreditInfo } from './customerService'
import { DECIMAL_UNITS } from './productService'
import { STORAGE_KEYS as K, ORDER_STATUS as S, APPROVAL_STATUS as A, CONSOLIDATION_STATUS as CS, POST_APPROVAL_STATUSES } from '../utils/constants'
import { uid } from '../utils/helpers'
import { calcLine, calcTotals, round2 } from '../utils/orderMath'
import { getAvailable } from '../utils/stock'
import { releaseOrder } from '../utils/stockReservation'
import { ROLES } from '../config/roles'
import { can } from '../config/permissions'
import { ORDER_PRIORITIES, ORDER_TYPES, PAYMENT_TERMS } from '../config/orderConfig'
import { isIsoDate, isPincode } from './validation'
import { formatOrderNumber } from './seed/orderSeed'
import { formatMoney } from '../utils/formatters'
import { scopeOf } from './rbacService'

const read = (key, fallback = []) => storage.getItem(key, fallback) || fallback

export const getOrders = () => read(K.ORDERS)
export const getOrderById = (id, list = getOrders()) => list.find((o) => o.id === id) || null
export const getOrderByNumber = (number, list = getOrders()) => list.find((o) => o.orderNumber === number) || null
export const getOrdersByStatus = (status, list = getOrders()) => list.filter((o) => o.orderStatus === status)
export const getOrdersByCustomer = (customerId, list = getOrders()) => list.filter((o) => o.customerId === customerId)
export const getOrdersBySalesman = (salesmanId, list = getOrders()) => list.filter((o) => o.salesmanId === salesmanId)
export const getOrdersByHub = (hubId, list = getOrders()) => list.filter((o) => o.hubId === hubId)

/* ------------------------------------------------------------------ */
/* Visibility & permissions                                            */
/* ------------------------------------------------------------------ */

const DISPATCH_VISIBLE = [S.CONSOLIDATED, S.READY_FOR_DISPATCH, S.DISPATCHED, S.OUT_FOR_DELIVERY, S.PARTIALLY_DELIVERED, S.DELIVERED, S.DELIVERY_FAILED, S.RETURNED_TO_HUB]

export const isOwnOrder = (user, o) => Boolean(user) && (o.salesmanId === user.id || o.createdBy === user.id)

/** Role-scoped visibility. Drafts are visible only to their creator and Admin. */
export const canViewOrder = (user, o) => {
  if (!user || !o) return false
  switch (scopeOf(user)) {
    case ROLES.ADMIN: return true
    case ROLES.SALESMAN: return isOwnOrder(user, o)
    case ROLES.SALES_MANAGER:
    case ROLES.FINANCE: return o.orderStatus !== S.DRAFT
    case ROLES.CUSTOMER_SERVICE: return POST_APPROVAL_STATUSES.includes(o.orderStatus)
    case ROLES.DISPATCHER: return DISPATCH_VISIBLE.includes(o.orderStatus)
    case ROLES.CUSTOMER: return Boolean(user.customerId) && o.customerId === user.customerId && o.orderStatus !== S.DRAFT
    default: return false
  }
}

export const getVisibleOrders = (user, list = getOrders()) => list.filter((o) => canViewOrder(user, o))

/** Editable: drafts and returned orders, by their salesman/creator or Admin. */
export const canEditOrder = (user, o) => {
  if (!user || !o || !can(user, 'orders.create')) return false
  if (![S.DRAFT, S.RETURNED].includes(o.orderStatus)) return false
  return scopeOf(user) === ROLES.ADMIN || isOwnOrder(user, o)
}

export const editBlockReason = (user, o) => {
  if (!o) return 'This order no longer exists.'
  if (o.orderStatus === S.SUBMITTED) return 'This order is waiting for Sales Manager approval and cannot be edited.'
  if (o.orderStatus === S.REJECTED) return 'Rejected orders are kept as history. Duplicate it as a new draft instead.'
  if (![S.DRAFT, S.RETURNED].includes(o.orderStatus)) return `${o.orderNumber} is ${o.orderStatus.toLowerCase().replace(/_/g, ' ')} and can no longer be edited.`
  if (!can(user, 'orders.create')) return 'Your role cannot edit orders.'
  return 'You can only edit your own orders.'
}

/* ------------------------------------------------------------------ */
/* Stock & credit context                                              */
/* ------------------------------------------------------------------ */

export const getHubStockLevel = (productId, hubId, inventory = read(K.INVENTORY)) => {
  const rec = inventory.find((r) => r.productId === productId && r.hubId === hubId)
  if (!rec) return { exists: false, available: 0, reorderLevel: 0, low: true }
  const available = round2(getAvailable(rec))
  return { exists: true, available, reorderLevel: rec.reorderLevel, low: available <= rec.reorderLevel }
}

/** Credit position if this order were approved (balance is never posted in Phase 3). */
export const getOrderCreditPosition = (customer, orderTotal) => {
  const info = getCreditInfo(customer)
  const projected = info.balance + (Number(orderTotal) || 0)
  return {
    ...info,
    projectedBalance: projected,
    projectedAvailable: info.limit - projected,
    exceedsAfterOrder: info.enabled && projected > info.limit,
    alreadyExceeded: info.enabled && info.balance > info.limit,
  }
}

/* ------------------------------------------------------------------ */
/* Form model                                                          */
/* ------------------------------------------------------------------ */

export const newItemKey = () => uid('ln')

/** Delivery fields defaulted from the customer master (order form, customer cart, standing orders). */
export const deliveryFromCustomer = (c) => ({
  deliveryAddress: c ? [c.addressLine1, c.addressLine2].filter(Boolean).join(', ') : '',
  deliveryCity: c?.city || '',
  deliveryState: c?.state || '',
  deliveryPincode: c?.pincode || '',
})

export const emptyOrderInput = (user) => ({
  orderDate: dayjs().format('YYYY-MM-DD'),
  orderType: 'Standard',
  orderPriority: 'Normal',
  orderSource: 'call',
  customerId: '',
  salesmanId: scopeOf(user) === ROLES.SALESMAN ? user.id : '',
  hubId: '',
  deliveryAddress: '',
  deliveryCity: '',
  deliveryState: '',
  deliveryPincode: '',
  requestedDeliveryDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
  deliveryInstructions: '',
  paymentTerms: 'Credit',
  customerReference: '',
  notes: '',
  items: [],
})

/** Convert a stored order back into editable form state. */
export const orderToInput = (o) => ({
  orderDate: o.orderDate, orderType: o.orderType, orderPriority: o.orderPriority, orderSource: o.orderSource || 'call',
  customerId: o.customerId, salesmanId: o.salesmanId, hubId: o.hubId,
  deliveryAddress: o.deliveryAddress, deliveryCity: o.deliveryCity, deliveryState: o.deliveryState, deliveryPincode: o.deliveryPincode,
  requestedDeliveryDate: o.requestedDeliveryDate, requestedDeliveryTime: o.requestedDeliveryTime || '', deliveryInstructions: o.deliveryInstructions || '', paymentTerms: o.paymentTerms,
  customerReference: o.customerReference || '', notes: o.notes || '',
  items: o.items.map((it) => ({ key: newItemKey(), productId: it.productId, orderedQuantity: String(it.orderedQuantity), discountPercentage: String(it.discountPercentage || 0), itemNotes: it.itemNotes || '' })),
})

/**
 * Price an order input against the live product master and hub stock.
 * Used by the form (live totals) and by every save, so they always agree.
 */
export const priceOrderInput = (input, ctx = loadContext()) => {
  const items = input.items.map((line) => {
    const p = ctx.P[line.productId]
    const stock = p && input.hubId && p.trackInventory ? getHubStockLevel(p.id, input.hubId, ctx.inventory) : null
    const base = {
      orderedQuantity: Number(line.orderedQuantity) || 0,
      unitPrice: p ? p.sellingPrice : 0,
      discountPercentage: Number(line.discountPercentage) || 0,
      taxPercentage: p ? p.taxPercent : 0,
    }
    return {
      key: line.key,
      id: line.id || line.key,
      productId: line.productId,
      productCode: p?.code || '',
      productName: p?.name || (line.productId ? 'Product no longer exists' : ''),
      sku: p?.sku || '',
      unit: p?.unit || '',
      ...base,
      ...calcLine(base),
      stockAvailable: stock ? stock.available : null,
      stockLow: stock ? stock.low : false,
      stockShort: Boolean(stock && base.orderedQuantity > stock.available),
      tracked: Boolean(p?.trackInventory),
      itemNotes: (line.itemNotes || '').trim(),
      product: p || null,
    }
  })
  const totals = calcTotals(items.filter((i) => i.productId))
  const customer = ctx.C[input.customerId] || null
  const credit = customer ? getOrderCreditPosition(customer, totals.totalAmount) : null
  return {
    items,
    totals,
    customer,
    hub: ctx.H[input.hubId] || null,
    credit,
    creditWarning: Boolean(credit && (credit.exceedsAfterOrder || credit.alreadyExceeded)),
    stockWarning: items.some((i) => i.stockShort),
  }
}

const loadContext = () => {
  const customers = read(K.CUSTOMERS)
  const products = read(K.PRODUCTS)
  const hubs = read(K.HUBS)
  return {
    customers, products, hubs,
    C: Object.fromEntries(customers.map((x) => [x.id, x])),
    P: Object.fromEntries(products.map((x) => [x.id, x])),
    H: Object.fromEntries(hubs.map((x) => [x.id, x])),
    inventory: read(K.INVENTORY),
    people: Object.fromEntries([...(read(K.DEMO_DATA, {}).salesReps || []), ...read(K.DEMO_USERS)].map((x) => [x.id, x])),
  }
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/**
 * mode 'draft': customer required, anything entered must be valid.
 * mode 'submit': everything required for approval.
 * Item errors use keys like `item:<lineKey>:orderedQuantity`.
 */
export const validateOrder = (input, { mode = 'submit', ctx = loadContext() } = {}) => {
  const e = {}
  const set = (k, m) => { if (m && !e[k]) e[k] = m }
  const submit = mode === 'submit'
  const customer = ctx.C[input.customerId]

  if (!input.customerId) set('customerId', 'Select a customer.')
  else if (!customer) set('customerId', 'This customer no longer exists.')
  else if (customer.status === 'Blocked') set('customerId', `${customer.name} is blocked and cannot place orders.`)
  else if (customer.status !== 'Active') set('customerId', `${customer.name} is inactive and cannot place orders.`)

  if (!input.salesmanId) set('salesmanId', 'Assign a salesman.')
  else if (!ctx.people[input.salesmanId]) set('salesmanId', 'This salesman no longer exists.')

  const hub = ctx.H[input.hubId]
  if (submit && !input.hubId) set('hubId', 'Select the fulfilment hub.')
  if (input.hubId && !hub) set('hubId', 'This hub no longer exists.')
  else if (hub && hub.status !== 'Active') set('hubId', `${hub.name} is inactive and cannot fulfil orders.`)

  if (!ORDER_TYPES.includes(input.orderType)) set('orderType', 'Choose an order type.')
  if (!ORDER_PRIORITIES.includes(input.orderPriority)) set('orderPriority', 'Choose a priority.')
  if (!PAYMENT_TERMS.includes(input.paymentTerms)) set('paymentTerms', 'Choose payment terms.')
  if (input.paymentTerms === 'Credit' && customer && !customer.creditEnabled) set('paymentTerms', `${customer.name} has credit disabled — choose Cash on Delivery or Advance Payment.`)
  if (submit && input.paymentTerms === 'Credit' && customer?.creditHold) set('paymentTerms', `${customer.name} is on credit hold (Finance)${customer.creditHoldReason ? ` — ${customer.creditHoldReason}` : ''}. Choose Cash on Delivery or Advance Payment, or ask Finance to release the hold.`)

  if (!isIsoDate(input.orderDate)) set('orderDate', 'Enter a valid order date.')
  else if (dayjs(input.orderDate).isAfter(dayjs(), 'day')) set('orderDate', 'Order date cannot be in the future.')

  if (submit || input.requestedDeliveryDate) {
    if (!isIsoDate(input.requestedDeliveryDate)) set('requestedDeliveryDate', 'Enter the requested delivery date.')
    else if (isIsoDate(input.orderDate) && dayjs(input.requestedDeliveryDate).isBefore(dayjs(input.orderDate), 'day')) set('requestedDeliveryDate', 'Delivery date cannot be before the order date.')
  }
  if (submit) {
    if (!String(input.deliveryAddress || '').trim()) set('deliveryAddress', 'Delivery address is required.')
    if (!String(input.deliveryCity || '').trim()) set('deliveryCity', 'City is required.')
    if (!String(input.deliveryState || '').trim()) set('deliveryState', 'State is required.')
  }
  if ((submit || input.deliveryPincode) && !isPincode(input.deliveryPincode)) set('deliveryPincode', 'Enter a valid 6-digit pincode.')

  const lines = input.items || []
  if (submit && !lines.length) set('items', 'Add at least one product.')
  const seen = new Set()
  lines.forEach((line) => {
    const k = (f) => `item:${line.key}:${f}`
    const p = ctx.P[line.productId]
    if (!line.productId) { set(k('productId'), 'Select a product.'); return }
    if (!p) { set(k('productId'), 'This product no longer exists.'); return }
    if (p.status !== 'Active') set(k('productId'), `${p.name} is ${p.status.toLowerCase()} and cannot be ordered.`)
    if (seen.has(p.id)) set(k('productId'), `${p.name} is already on this order — change the quantity on the first line instead.`)
    seen.add(p.id)
    if (!(p.sellingPrice > 0)) set(k('productId'), `${p.name} has no valid selling price.`)
    const q = Number(line.orderedQuantity)
    if (line.orderedQuantity === '' || line.orderedQuantity === null || Number.isNaN(q)) set(k('orderedQuantity'), 'Enter a quantity.')
    else if (q <= 0) set(k('orderedQuantity'), 'Quantity must be greater than zero.')
    else if (!DECIMAL_UNITS.includes(p.unit) && !Number.isInteger(q)) set(k('orderedQuantity'), `Whole ${p.unit} only.`)
    else if (q > 100000) set(k('orderedQuantity'), 'Quantity is too large.')
    const d = Number(line.discountPercentage || 0)
    if (Number.isNaN(d) || d < 0 || d > 100) set(k('discountPercentage'), 'Discount must be 0–100%.')
    else if (d > 0 && !p.discountAllowed) set(k('discountPercentage'), 'No discount allowed on this product.')
    else if (d > (p.maxDiscountPercent || 0)) set(k('discountPercentage'), `Maximum discount is ${p.maxDiscountPercent}%.`)
    if (!(p.taxPercent >= 0 && p.taxPercent <= 100)) set(k('productId'), `${p.name} has an invalid tax rate.`)
  })
  if (submit && lines.length && !Object.keys(e).some((x) => x.startsWith('item:'))) {
    const priced = priceOrderInput(input, ctx)
    if (!(priced.totals.totalAmount > 0)) set('items', 'Order total must be greater than zero.')
  }
  return e
}

/* ------------------------------------------------------------------ */
/* Persistence helpers                                                 */
/* ------------------------------------------------------------------ */

const buildRecord = (input, existing, ctx) => {
  const priced = priceOrderInput(input, ctx)
  const customer = priced.customer
  const hub = priced.hub
  return {
    ...(existing || {}),
    orderDate: input.orderDate,
    orderType: input.orderType,
    orderPriority: input.orderPriority,
    orderSource: input.orderSource || 'call',
    customerId: input.customerId,
    customerName: customer?.name || existing?.customerName || '',
    customerCode: customer?.code || existing?.customerCode || '',
    salesmanId: input.salesmanId,
    salesmanName: ctx.people[input.salesmanId]?.name || '',
    hubId: input.hubId || '',
    hubName: hub?.name || '',
    zoneId: customer?.hubId === input.hubId ? customer?.zoneId || '' : '',
    deliveryAddress: String(input.deliveryAddress || '').trim(),
    deliveryCity: String(input.deliveryCity || '').trim(),
    deliveryState: input.deliveryState || '',
    deliveryPincode: String(input.deliveryPincode || '').trim(),
    requestedDeliveryDate: input.requestedDeliveryDate || '',
    requestedDeliveryTime: input.requestedDeliveryTime ?? existing?.requestedDeliveryTime ?? '',
    deliveryInstructions: String(input.deliveryInstructions || '').trim(),
    paymentTerms: input.paymentTerms,
    creditDays: input.paymentTerms === 'Credit' ? customer?.creditDays || 0 : 0,
    customerReference: String(input.customerReference || '').trim(),
    notes: String(input.notes || '').trim(),
    items: priced.items.filter((i) => i.productId).map(({ key: _k, product: _p, stockLow: _l, stockShort: _s, tracked: _t, taxableAmount: _x, ...it }, idx) => ({ ...it, id: `${existing?.id || 'new'}-l${idx + 1}` })),
    ...priced.totals,
    creditWarning: priced.creditWarning,
    stockWarning: priced.stockWarning,
  }
}

/** Reserve the next order number (read → increment). The caller writes the new sequence in its transaction. */
const nextNumber = () => {
  const seq = storage.getItem(K.ORDER_SEQUENCE, null) || { year: dayjs().year(), lastNumber: 0, consolidationLast: 0 }
  const year = dayjs().year()
  const used = new Set(getOrders().map((o) => o.orderNumber).filter(Boolean))
  let n = seq.year === year ? seq.lastNumber + 1 : 1
  while (used.has(formatOrderNumber(year, n))) n += 1 // never duplicate, even after a restore
  return { number: formatOrderNumber(year, n), sequence: { ...seq, year, lastNumber: n } }
}

export const peekNextOrderNumber = () => nextNumber().number

const commit = ({ orders, events = [], sequence }) => {
  const writes = [[K.ORDERS, orders]]
  if (events.length) writes.push([K.ORDER_TIMELINE, [...read(K.ORDER_TIMELINE), ...events]])
  if (sequence) writes.push([K.ORDER_SEQUENCE, sequence])
  return storage.transaction(writes)
}

export const notifyOrder = (order, { title, message, type = 'info', roles = null, toSalesman = false, link }) =>
  pushNotification({
    title,
    message,
    type,
    roles,
    userIds: toSalesman && order.salesmanId ? [order.salesmanId] : null,
    link: link || `/orders/${order.id}`,
    relatedOrderId: order.id,
  })

const deny = (msg) => ({ ok: false, error: msg, errors: { form: msg } })

/* ------------------------------------------------------------------ */
/* Commands                                                            */
/* ------------------------------------------------------------------ */

/** Save a new draft. */
export const createOrder = (input) => {
  const user = getCurrentUser()
  if (!can(user, 'orders.create')) return deny('Your role cannot create orders.')
  const ctx = loadContext()
  const errors = validateOrder(input, { mode: 'draft', ctx })
  if (Object.keys(errors).length) return { ok: false, errors }
  const now = new Date().toISOString()
  const id = uid('ord')
  const record = {
    ...buildRecord(input, { id }, ctx),
    id,
    orderNumber: null,
    orderStatus: S.DRAFT,
    approvalStatus: A.NOT_SUBMITTED,
    consolidationStatus: CS.NOT_STARTED,
    resubmissionCount: 0,
    duplicatedFrom: input.duplicatedFrom || null,
    createdAt: now,
    updatedAt: now,
    createdBy: user.id,
    updatedBy: user.id,
  }
  const res = commit({ orders: [record, ...getOrders()], events: [makeTimelineEvent(record, 'DRAFT_CREATED')] })
  if (!res.ok) return deny(res.error)
  logOrderActivity(record, 'DRAFT_CREATED')
  return { ok: true, record }
}

/** Update a draft or a returned order. */
export const updateOrder = (id, input) => {
  const user = getCurrentUser()
  const orders = getOrders()
  const existing = getOrderById(id, orders)
  if (!existing) return deny('This order no longer exists.')
  if (!canEditOrder(user, existing)) return deny(editBlockReason(user, existing))
  const ctx = loadContext()
  const errors = validateOrder(input, { mode: 'draft', ctx })
  if (Object.keys(errors).length) return { ok: false, errors }
  const record = { ...buildRecord(input, existing, ctx), updatedAt: new Date().toISOString(), updatedBy: user.id }
  const res = commit({ orders: orders.map((o) => (o.id === id ? record : o)), events: [makeTimelineEvent(record, 'ORDER_UPDATED')] })
  if (!res.ok) return deny(res.error)
  return { ok: true, record }
}

/**
 * Submit a draft (or resubmit a returned order) for approval.
 * Pass `input` to save the latest form values in the same step.
 */
const submitInternal = (id, input, { resubmit }) => {
  const user = getCurrentUser()
  const orders = getOrders()
  const existing = id ? getOrderById(id, orders) : null
  if (id && !existing) return deny('This order no longer exists.')
  // Customer-app users may submit new orders for their own linked customer account only.
  const customerSelf = !existing && Boolean(input) && can(user, 'customer.order') && Boolean(user?.customerId) && input.customerId === user.customerId
  if (!can(user, 'orders.create') && !customerSelf) return deny('Your role cannot submit orders.')
  const expected = resubmit ? S.RETURNED : S.DRAFT
  if (existing && existing.orderStatus !== expected) {
    if (existing.orderStatus === S.SUBMITTED) return deny(`${existing.orderNumber} has already been submitted and is waiting for approval.`)
    return deny(`Only ${resubmit ? 'returned' : 'draft'} orders can be ${resubmit ? 're' : ''}submitted. This order is ${existing.orderStatus.toLowerCase().replace(/_/g, ' ')}.`)
  }
  if (existing && !canEditOrder(user, existing)) return deny(editBlockReason(user, existing))

  const ctx = loadContext()
  if (customerSelf) ctx.people = { ...ctx.people, [user.id]: user }
  const formInput = input || orderToInput(existing)
  const errors = validateOrder(formInput, { mode: 'submit', ctx })
  if (Object.keys(errors).length) return { ok: false, errors }

  const now = new Date().toISOString()
  const newId = existing?.id || uid('ord')
  const base = buildRecord(formInput, existing || { id: newId }, ctx)
  const events = []
  let sequence = null
  let orderNumber = existing?.orderNumber || null
  if (!orderNumber) {
    const next = nextNumber()
    orderNumber = next.number
    sequence = next.sequence
  }
  const record = {
    ...base,
    id: newId,
    orderNumber,
    orderStatus: S.SUBMITTED,
    approvalStatus: A.PENDING,
    consolidationStatus: CS.NOT_STARTED,
    submittedAt: now,
    submittedBy: user.id,
    resubmissionCount: (existing?.resubmissionCount || 0) + (resubmit ? 1 : 0),
    createdAt: existing?.createdAt || now,
    createdBy: existing?.createdBy || user.id,
    duplicatedFrom: existing?.duplicatedFrom || formInput.duplicatedFrom || null,
    updatedAt: now,
    updatedBy: user.id,
  }
  if (!existing) events.push(makeTimelineEvent(record, 'DRAFT_CREATED'))
  else if (input) events.push(makeTimelineEvent(record, 'ORDER_UPDATED'))
  const warn = [record.creditWarning && 'credit limit', record.stockWarning && 'stock shortage'].filter(Boolean)
  events.push(makeTimelineEvent(record, resubmit ? 'RESUBMITTED' : 'SUBMITTED', {
    remarks: warn.length ? `Submitted with ${warn.join(' and ')} warning${warn.length > 1 ? 's' : ''} for review.` : '',
  }))
  const nextOrders = existing ? orders.map((o) => (o.id === record.id ? record : o)) : [record, ...orders]
  const res = commit({ orders: nextOrders, events, sequence })
  if (!res.ok) return deny(res.error)

  logOrderActivity(record, resubmit ? 'RESUBMITTED' : 'SUBMITTED')
  const amount = formatMoney(record.totalAmount)
  notifyOrder(record, {
    title: resubmit ? `Order resubmitted: ${record.orderNumber}` : `New order for approval: ${record.orderNumber}`,
    message: `${record.salesmanName} ${resubmit ? 'corrected and resubmitted' : 'submitted'} ${record.customerName} · ${amount}${warn.length ? ` · ${warn.join(' & ')} warning` : ''}.`,
    type: warn.length ? 'warning' : 'info',
    roles: [ROLES.SALES_MANAGER],
    link: `/orders/approval/${record.id}`,
  })
  notifyOrder(record, {
    title: `Order ${resubmit ? 'resubmitted' : 'submitted'}: ${record.orderNumber}`,
    message: `${record.customerName} · ${amount} is waiting for Sales Manager approval.`,
    toSalesman: true,
  })
  if (!resubmit) fireEvent('ORDER_CREATED', { key: record.id, orderId: record.id, customerId: record.customerId })
  return { ok: true, record }
}

export const submitOrder = (id, input) => submitInternal(id, input, { resubmit: false })
export const resubmitOrder = (id, input) => submitInternal(id, input, { resubmit: true })

export const deleteDraftOrder = (id) => {
  const user = getCurrentUser()
  const orders = getOrders()
  const existing = getOrderById(id, orders)
  if (!existing) return deny('This order no longer exists.')
  if (existing.orderStatus !== S.DRAFT) return deny('Only draft orders can be deleted. Submitted orders are kept for the audit trail.')
  if (!(scopeOf(user) === ROLES.ADMIN || isOwnOrder(user, existing))) return deny('You can only delete your own drafts.')
  const res = storage.setItem(K.ORDERS, orders.filter((o) => o.id !== id))
  if (!res.ok) return deny(res.error)
  return { ok: true }
}

/** Statuses in which an order can still be cancelled (nothing has left the hub). */
export const CANCELLABLE_STATUSES = [S.SUBMITTED, S.RETURNED, S.APPROVED, S.CONSOLIDATED, S.READY_FOR_DISPATCH]

/** Why an order cannot be cancelled right now (null when it can). */
export const cancelBlockReason = (order, dispatches = read(K.DISPATCHES)) => {
  if (!order) return 'This order no longer exists.'
  if (order.orderStatus === S.CANCELLED) return `${order.orderNumber} is already cancelled.`
  if (order.orderStatus === S.DRAFT) return 'Drafts are deleted, not cancelled.'
  if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) return `${order.orderNumber} is ${order.orderStatus.toLowerCase().replace(/_/g, ' ')} — record a failed delivery or a sales return instead.`
  const planned = dispatches.find((d) => (d.orderIds || []).includes(order.id) && !['CANCELLED', 'COMPLETED', 'PARTIALLY_DELIVERED'].includes(d.status))
  if (planned) return `${order.orderNumber} is planned on dispatch ${planned.dispatchNumber} — remove it from the dispatch first.`
  return null
}

/**
 * Cancel an order (single path for the order screen and approved cancellation requests). Releases the order's
 * stock reservation in the same transaction, closes its approval / consolidation, notifies the salesman, Customer
 * Service and the Dispatcher. `system` skips the permission check when an approved change request applies it.
 */
export const cancelOrder = (id, { reason = '', remarks = '', reference = '', system = false } = {}) => {
  const user = getCurrentUser()
  if (!system && !can(user, 'sales.orderchanges.approve')) return deny('Only the Sales Manager or an Administrator can cancel orders. Raise an order change request instead.')
  const orders = getOrders()
  const order = getOrderById(id, orders)
  const why = cancelBlockReason(order)
  if (why) return deny(why)
  if (String(reason).trim().length < 3) return { ok: false, error: 'Give the cancellation reason.', errors: { reason: 'Give the cancellation reason.' } }
  const now = new Date().toISOString()
  const rel = releaseOrder({ order, inventory: read(K.INVENTORY), at: now, reason: String(reason).trim() })
  const record = {
    ...rel.order, orderStatus: S.CANCELLED, cancelledAt: now, cancelledBy: user?.id || null, cancelReason: String(reason).trim(), cancelRemarks: String(remarks).trim(),
    cancelRequestNumber: reference || null,
    approvalStatus: order.approvalStatus === A.PENDING ? A.NOT_SUBMITTED : order.approvalStatus,
    consolidationStatus: order.consolidationStatus === CS.PENDING ? CS.NOT_STARTED : order.consolidationStatus,
    updatedAt: now, updatedBy: user?.id || null,
  }
  const events = [makeTimelineEvent(record, 'CANCELLED', { remarks: [reference, String(reason).trim(), String(remarks).trim()].filter(Boolean).join(' — ') })]
  if (rel.released > 0) events.push(makeTimelineEvent(record, 'STOCK_RELEASED', { remarks: `${rel.released} reserved units returned to available stock.` }))
  const res = storage.transaction([
    [K.ORDERS, orders.map((o) => (o.id === id ? record : o))],
    [K.ORDER_TIMELINE, [...read(K.ORDER_TIMELINE), ...events]],
    ...(rel.released > 0 ? [[K.INVENTORY, rel.inventory]] : []),
  ])
  if (!res.ok) return deny(res.error)
  logOrderActivity(record, 'CANCELLED')
  notifyOrder(record, { title: `Order cancelled: ${record.orderNumber}`, message: `${record.customerName} — ${record.cancelReason}.`, type: 'warning', toSalesman: true })
  if ([S.APPROVED, S.CONSOLIDATED, S.READY_FOR_DISPATCH].includes(order.orderStatus)) notifyOrder(record, { title: `Order cancelled: ${record.orderNumber}`, message: `${record.customerName} — removed from fulfilment${rel.released > 0 ? `; ${rel.released} reserved units released` : ''}.`, type: 'warning', roles: [ROLES.CUSTOMER_SERVICE, ROLES.DISPATCHER] })
  fireEvent('ORDER_CANCELLED', { key: record.id, orderId: record.id, customerId: record.customerId, extra: { reason: record.cancelReason } })
  return { ok: true, record, released: rel.released }
}

/** Copy any visible order into a new draft, re-priced from the current product master. */
export const duplicateOrder = (id) => {
  const user = getCurrentUser()
  const source = getOrderById(id)
  if (!source) return deny('This order no longer exists.')
  if (!canViewOrder(user, source) || !can(user, 'orders.create')) return deny('You cannot duplicate this order.')
  const input = {
    ...orderToInput(source),
    orderDate: dayjs().format('YYYY-MM-DD'),
    requestedDeliveryDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    salesmanId: scopeOf(user) === ROLES.SALESMAN ? user.id : source.salesmanId,
    duplicatedFrom: source.id,
  }
  // Drop lines whose product is no longer orderable, keep the rest
  const ctx = loadContext()
  input.items = input.items.filter((l) => ctx.P[l.productId]?.status === 'Active')
  const res = createOrder(input)
  if (!res.ok) return res
  const events = [makeTimelineEvent(source, 'DUPLICATED', { remarks: `Copied to a new draft for ${res.record.customerName}.` })]
  commit({ orders: getOrders(), events })
  return res
}

const orderService = {
  getOrders, getOrderById, getOrderByNumber, createOrder, updateOrder, deleteDraftOrder, submitOrder, resubmitOrder, cancelOrder,
  duplicateOrder, getOrdersByStatus, getOrdersByCustomer, getOrdersBySalesman, getOrdersByHub, canViewOrder, canEditOrder,
  getVisibleOrders, validateOrder, priceOrderInput,
}
export default orderService
