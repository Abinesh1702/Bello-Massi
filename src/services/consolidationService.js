/**
 * Customer Service consolidation and the hand-off to dispatch.
 * APPROVED (consolidation PENDING) → CONSOLIDATED → READY_FOR_DISPATCH.
 * Consolidation never deducts stock, creates delivery records or invoices.
 */
import { fireEvent } from './automationService'
import dayjs from 'dayjs'
import storage from './storageService'
import { getCurrentUser } from './authService'
import { reserveOrder, reservedQtyFor } from '../utils/stockReservation'
import { makeTimelineEvent, logOrderActivity } from './orderTimelineService'
import { getHubStockLevel, getOrderById, getOrders, notifyOrder } from './orderService'
import { STORAGE_KEYS as K, ORDER_STATUS as S, CONSOLIDATION_STATUS as CS } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { ROLES } from '../config/roles'

const read = (key, fallback = []) => storage.getItem(key, fallback) || fallback

export const isAwaitingConsolidation = (o) => o?.orderStatus === S.APPROVED && o?.consolidationStatus === CS.PENDING
export const getConsolidationQueue = (list = getOrders()) => list.filter(isAwaitingConsolidation)
export const getConsolidatedOrders = (list = getOrders()) => list.filter((o) => o.orderStatus === S.CONSOLIDATED)
export const getReadyForDispatch = (list = getOrders()) => list.filter((o) => o.orderStatus === S.READY_FOR_DISPATCH)
export const getConsolidations = () => read(K.CONSOLIDATIONS)
export const getConsolidationForOrder = (orderId, all = getConsolidations()) => all.find((c) => c.orderId === orderId) || null

/** Items the consolidator must confirm before the order is consolidated. */
export const VERIFICATION_STEPS = [
  { key: 'customer', label: 'Customer and delivery address verified' },
  { key: 'hub', label: 'Fulfilment hub confirmed' },
  { key: 'products', label: 'Products and units checked' },
  { key: 'quantities', label: 'Quantities match the approved order' },
  { key: 'stock', label: 'Hub stock availability reviewed' },
]

/** Current stock coverage per line at the order's hub: the order's own reservation plus what is still free. */
export const getStockReview = (order, inventory = read(K.INVENTORY)) =>
  order.items.map((it) => {
    const s = getHubStockLevel(it.productId, order.hubId, inventory)
    const reserved = reservedQtyFor(order, it)
    const available = s.exists ? s.available + reserved : null
    return { ...it, reserved, available, short: s.exists ? it.orderedQuantity > available : false, tracked: s.exists }
  })

const deny = (msg) => ({ ok: false, error: msg, errors: { form: msg } })

export const consolidateOrder = (id, { notes = '', verified = {} } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'orders.consolidate')) return deny('Only Customer Service can consolidate orders.')
  const orders = getOrders()
  const order = getOrderById(id, orders)
  if (!order) return deny('This order no longer exists.')
  const consolidations = getConsolidations()
  if (order.consolidationStatus === CS.COMPLETED || getConsolidationForOrder(id, consolidations)) return deny(`${order.orderNumber} has already been consolidated. No change was made.`)
  if (order.orderStatus !== S.APPROVED) return deny(`Only approved orders can be consolidated. ${order.orderNumber || 'This order'} is ${order.orderStatus.toLowerCase().replace(/_/g, ' ')}.`)
  const missing = VERIFICATION_STEPS.filter((s) => !verified[s.key])
  if (missing.length) return { ok: false, errors: { verified: `Confirm every check before consolidating (${missing.length} left).` }, error: 'Complete the verification checklist first.' }

  const now = new Date().toISOString()
  const seq = storage.getItem(K.ORDER_SEQUENCE, null) || { year: dayjs().year(), lastNumber: 0, consolidationLast: 0 }
  const conN = (seq.consolidationLast || consolidations.length) + 1
  const consolidation = {
    id: uid('con'),
    consolidationNumber: `CON-${dayjs().year()}-${String(conN).padStart(4, '0')}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    consolidatedBy: user.id,
    consolidatedByName: user.name,
    consolidationDate: now,
    hubId: order.hubId,
    status: CS.COMPLETED,
    notes: notes.trim(),
    productSummary: order.items.map((it) => ({ productId: it.productId, productName: it.productName, quantity: it.orderedQuantity, unit: it.unit })),
    totalQuantity: order.totalQuantity,
    totalAmount: order.totalAmount,
    readyForDispatchAt: null,
    readyForDispatchBy: null,
  }
  // Top up the approval reservation with stock that arrived since (never beyond available)
  const topUp = reserveOrder({ order, inventory: read(K.INVENTORY), products: read(K.PRODUCTS), at: now })
  const record = {
    ...topUp.order, orderStatus: S.CONSOLIDATED, consolidationStatus: CS.COMPLETED, consolidatedAt: now, consolidatedBy: user.id,
    consolidationId: consolidation.id, consolidationNotes: notes.trim(), updatedAt: now, updatedBy: user.id,
  }
  const extraEvents = topUp.reservedNow > 0 ? [makeTimelineEvent(record, 'STOCK_RESERVED', { remarks: `${topUp.reservedNow} more units reserved at consolidation.` })] : []
  const res = storage.transaction([
    ...(topUp.reservedNow > 0 ? [[K.INVENTORY, topUp.inventory]] : []),
    [K.ORDERS, orders.map((o) => (o.id === id ? record : o))],
    [K.CONSOLIDATIONS, [consolidation, ...consolidations]],
    [K.ORDER_SEQUENCE, { ...seq, consolidationLast: conN }],
    [K.ORDER_TIMELINE, [...read(K.ORDER_TIMELINE), makeTimelineEvent(record, 'CONSOLIDATED', { remarks: [consolidation.consolidationNumber, notes.trim()].filter(Boolean).join(' — ') }), ...extraEvents]],
  ])
  if (!res.ok) return deny(res.error)
  logOrderActivity(record, 'CONSOLIDATED')
  notifyOrder(record, { title: `Order consolidated: ${record.orderNumber}`, message: `${record.customerName} (${record.hubName}) is consolidated and will be marked ready for dispatch shortly.`, roles: [ROLES.DISPATCHER] })
  return { ok: true, record, consolidation }
}

export const markReadyForDispatch = (id) => {
  const user = getCurrentUser()
  if (!can(user, 'orders.consolidate')) return deny('Only Customer Service can release orders to dispatch.')
  const orders = getOrders()
  const order = getOrderById(id, orders)
  if (!order) return deny('This order no longer exists.')
  if (order.orderStatus === S.READY_FOR_DISPATCH) return deny(`${order.orderNumber} is already ready for dispatch.`)
  if (order.orderStatus !== S.CONSOLIDATED) return deny('Only consolidated orders can be marked ready for dispatch.')
  const now = new Date().toISOString()
  const record = { ...order, orderStatus: S.READY_FOR_DISPATCH, readyForDispatchAt: now, readyForDispatchBy: user.id, updatedAt: now, updatedBy: user.id }
  const consolidations = getConsolidations().map((c) => (c.orderId === id ? { ...c, readyForDispatchAt: now, readyForDispatchBy: user.id } : c))
  const res = storage.transaction([
    [K.ORDERS, orders.map((o) => (o.id === id ? record : o))],
    [K.CONSOLIDATIONS, consolidations],
    [K.ORDER_TIMELINE, [...read(K.ORDER_TIMELINE), makeTimelineEvent(record, 'READY_FOR_DISPATCH')]],
  ])
  if (!res.ok) return deny(res.error)
  logOrderActivity(record, 'READY_FOR_DISPATCH')
  notifyOrder(record, { title: `Ready for dispatch: ${record.orderNumber}`, message: `${record.customerName} · ${record.totalQuantity} units at ${record.hubName}. Plan it into a delivery zone.`, type: 'success', roles: [ROLES.DISPATCHER] })
  notifyOrder(record, { title: `Order ready for dispatch: ${record.orderNumber}`, message: `${record.customerName} has been released to the Dispatcher.`, type: 'success', toSalesman: true })
  fireEvent('ORDER_READY', { key: record.id, orderId: record.id, customerId: record.customerId })
  return { ok: true, record }
}

const consolidationService = { getConsolidationQueue, consolidateOrder, markReadyForDispatch, getConsolidatedOrders, getReadyForDispatch, getConsolidations }
export default consolidationService
