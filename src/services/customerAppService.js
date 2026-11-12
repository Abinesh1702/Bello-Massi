/**
 * Customer app (mobile) — cart, order placement and the customer's own order / delivery view.
 *
 * Every function is scoped to the signed-in user's linked customer account (user.customerId); a customer never
 * sees another customer's orders, deliveries, drivers or vehicles. Orders placed here go through the normal
 * approval workflow (Submitted → Sales Manager approval → consolidation → dispatch).
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { STORAGE_KEYS as K, ORDER_STATUS_META } from '../utils/constants'
import { can } from '../config/permissions'
import { getCurrentUser } from './authService'
import { priceOrderInput, submitOrder } from './orderService'
import { getAvailable } from '../utils/stock'
import { DECIMAL_UNITS } from './productService'

const read = (k, f = []) => storage.getItem(k, f) ?? f
const deny = (msg, errors) => ({ ok: false, error: msg, errors: errors || { form: msg } })

export const customerOf = (user = getCurrentUser()) => (user?.customerId ? read(K.CUSTOMERS).find((c) => c.id === user.customerId) || null : null)

/** Stock availability label for the customer's hub (no exact quantities are shown to customers). */
export const availabilityOf = (product, hubId, inventory = read(K.INVENTORY)) => {
  if (!product.trackInventory) return { label: 'Available', tone: 'success', orderable: true }
  const rec = inventory.find((r) => r.productId === product.id && r.hubId === hubId)
  const a = rec ? getAvailable(rec) : 0
  if (a <= 0) return { label: 'Out of stock', tone: 'danger', orderable: true, note: 'Can be ordered — delivery depends on replenishment.' }
  if (rec && a <= (Number(rec.reorderLevel) || 0)) return { label: 'Limited stock', tone: 'warning', orderable: true }
  return { label: 'In stock', tone: 'success', orderable: true }
}

/* ----- Cart ----- */

export const getCart = (userId, all = read(K.CUSTOMER_CARTS, {})) => all?.[userId] || { items: [], updatedAt: null }
const writeCart = (userId, items) => {
  const all = read(K.CUSTOMER_CARTS, {}) || {}
  return storage.setItem(K.CUSTOMER_CARTS, { ...all, [userId]: { items, updatedAt: new Date().toISOString() } })
}
const guard = () => {
  const user = getCurrentUser()
  if (!user || !can(user, 'customer.order') || !user.customerId) return { error: 'Only customer accounts can use the cart.' }
  return { user }
}
const validQty = (product, q) => {
  const n = Number(q)
  if (Number.isNaN(n) || n <= 0) return 'Quantity must be greater than zero.'
  if (!DECIMAL_UNITS.includes(product.unit) && !Number.isInteger(n)) return `Whole ${product.unit} only.`
  if (n > 10000) return 'Quantity is too large.'
  return null
}

export const addToCart = (productId, qty = 1) => {
  const g = guard()
  if (g.error) return deny(g.error)
  const product = read(K.PRODUCTS).find((p) => p.id === productId && p.status === 'Active')
  if (!product) return deny('This product is not available.')
  const items = getCart(g.user.id).items
  const existing = items.find((i) => i.productId === productId)
  const next = Number(existing?.quantity || 0) + Number(qty)
  const err = validQty(product, next)
  if (err) return deny(err)
  const res = writeCart(g.user.id, existing ? items.map((i) => (i.productId === productId ? { ...i, quantity: next } : i)) : [...items, { productId, quantity: Number(qty) }])
  return res.ok ? { ok: true, quantity: next } : deny(res.error)
}

export const setCartQuantity = (productId, qty) => {
  const g = guard()
  if (g.error) return deny(g.error)
  const items = getCart(g.user.id).items
  if (Number(qty) <= 0) return removeFromCart(productId)
  const product = read(K.PRODUCTS).find((p) => p.id === productId)
  const err = product ? validQty(product, qty) : 'This product is no longer available.'
  if (err) return deny(err)
  const res = writeCart(g.user.id, items.map((i) => (i.productId === productId ? { ...i, quantity: Number(qty) } : i)))
  return res.ok ? { ok: true } : deny(res.error)
}

export const removeFromCart = (productId) => {
  const g = guard()
  if (g.error) return deny(g.error)
  const res = writeCart(g.user.id, getCart(g.user.id).items.filter((i) => i.productId !== productId))
  return res.ok ? { ok: true } : deny(res.error)
}


/** Price the cart exactly as the order will be priced (same product master, tax and credit rules). */
export const priceCart = (customer, items) => priceOrderInput({
  customerId: customer?.id || '', hubId: customer?.hubId || '', items: items.map((i) => ({ key: i.productId, productId: i.productId, orderedQuantity: String(i.quantity), discountPercentage: '0' })),
})

/** Place the cart as a SUBMITTED order (goes to Sales Manager approval). */
export const placeCustomerOrder = ({ deliveryAddress, deliveryCity, deliveryState, deliveryPincode, requestedDeliveryDate, requestedDeliveryTime, remarks, customerReference }) => {
  const g = guard()
  if (g.error) return deny(g.error)
  const customer = customerOf(g.user)
  if (!customer) return deny('Your login is not linked to a customer account.')
  const items = getCart(g.user.id).items
  if (!items.length) return deny('Your cart is empty.')
  const e = {}
  if (!requestedDeliveryDate || !dayjs(requestedDeliveryDate).isValid()) e.requestedDeliveryDate = 'Choose a delivery date.'
  else if (dayjs(requestedDeliveryDate).isBefore(dayjs().add(1, 'day'), 'day')) e.requestedDeliveryDate = 'The earliest delivery date is tomorrow.'
  else if (dayjs(requestedDeliveryDate).isAfter(dayjs().add(60, 'day'), 'day')) e.requestedDeliveryDate = 'Choose a date within the next 60 days.'
  if (requestedDeliveryTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(requestedDeliveryTime)) e.requestedDeliveryTime = 'Enter a valid time.'
  if (String(remarks || '').length > 300) e.remarks = 'Use 300 characters or fewer.'
  if (Object.keys(e).length) return deny(Object.values(e)[0], e)
  const input = {
    orderDate: dayjs().format('YYYY-MM-DD'), orderType: 'Standard', orderPriority: customer.isVip ? 'High' : 'Normal', orderSource: 'customer_app',
    customerId: customer.id, salesmanId: customer.salesRepId || '', hubId: customer.hubId,
    deliveryAddress, deliveryCity, deliveryState, deliveryPincode, requestedDeliveryDate, requestedDeliveryTime: requestedDeliveryTime || '',
    deliveryInstructions: String(remarks || '').trim(), paymentTerms: customer.creditEnabled ? 'Credit' : 'Cash on Delivery', customerReference: String(customerReference || '').trim() || 'Customer app', notes: 'Placed by the customer in the customer app.',
    items: items.map((i) => ({ key: i.productId, productId: i.productId, orderedQuantity: String(i.quantity), discountPercentage: '0', itemNotes: '' })),
  }
  const res = submitOrder(null, input)
  if (!res.ok) {
    const first = res.error || Object.values(res.errors || {})[0] || 'The order could not be placed.'
    return { ok: false, error: first, errors: res.errors || {} }
  }
  writeCart(g.user.id, [])
  return res
}

/** Duplicate a previous order's lines into the cart. */
export const reorderToCart = (order) => {
  const g = guard()
  if (g.error) return deny(g.error)
  if (order.customerId !== g.user.customerId) return deny('This order belongs to another account.')
  const products = read(K.PRODUCTS)
  const lines = (order.items || []).filter((it) => products.some((p) => p.id === it.productId && p.status === 'Active'))
  if (!lines.length) return deny('None of the products on this order can be ordered now.')
  const items = [...getCart(g.user.id).items]
  lines.forEach((it) => {
    const i = items.findIndex((x) => x.productId === it.productId)
    if (i >= 0) items[i] = { ...items[i], quantity: Number(items[i].quantity) + Number(it.orderedQuantity) }
    else items.push({ productId: it.productId, quantity: Number(it.orderedQuantity) })
  })
  const res = writeCart(g.user.id, items)
  return res.ok ? { ok: true, added: lines.length, skipped: (order.items || []).length - lines.length } : deny(res.error)
}

/* ----- Order tracking stages ----- */

export const TRACK_STAGES = ['Order placed', 'Pending approval', 'Approved', 'Prepared', 'Dispatch planned', 'Out for delivery', 'Driver arrived', 'OTP verified', 'Delivered']
const STEP = { DRAFT: 0, SUBMITTED: 1, RETURNED: 1, REJECTED: 1, APPROVED: 2, CONSOLIDATED: 3, READY_FOR_DISPATCH: 3, DISPATCHED: 4, OUT_FOR_DELIVERY: 5, PARTIALLY_DELIVERED: 8, DELIVERED: 8, DELIVERY_FAILED: 5, RETURNED_TO_HUB: 5 }

/** Current stage index (0-based) for an order and its delivery. */
export const trackStage = (order, delivery, dispatch) => {
  let s = STEP[order.orderStatus] ?? 0
  if (s === 3 && (order.dispatchId || dispatch)) s = 4
  if (order.orderStatus === 'OUT_FOR_DELIVERY' && delivery?.arrivedAt) s = delivery.otpStatus === 'VERIFIED' ? 7 : 6
  return s
}
export const customerStatusLabel = (o) => {
  if (o.orderStatus === 'RETURNED') return 'Under review'
  if (o.orderStatus === 'REJECTED') return 'Not accepted'
  return ORDER_STATUS_META[o.orderStatus]?.label || o.orderStatus
}
export const approvalLabel = (o) => ({ PENDING: 'Pending approval', APPROVED: 'Approved', REJECTED: 'Rejected', NOT_SUBMITTED: 'Not submitted' }[o.approvalStatus] || (o.orderStatus === 'RETURNED' ? 'Under review' : o.approvalStatus))
export const deliveryLabel = (o, d) => {
  if (d) return { DISPATCHED: 'Dispatched', OUT_FOR_DELIVERY: d.arrivedAt ? 'Driver arrived' : 'Out for delivery', DELIVERED: 'Delivered', PARTIALLY_DELIVERED: 'Partially delivered', FAILED: 'Delivery failed', RETURNED: 'Returned to hub', CANCELLED: 'Cancelled' }[d.status] || d.status
  if (['CONSOLIDATED', 'READY_FOR_DISPATCH'].includes(o.orderStatus)) return o.dispatchId ? 'Dispatch planned' : 'Being prepared'
  if (['SUBMITTED', 'APPROVED', 'RETURNED'].includes(o.orderStatus)) return 'Not scheduled'
  return '—'
}
