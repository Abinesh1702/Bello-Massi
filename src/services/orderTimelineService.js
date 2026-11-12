/**
 * Append-only order timeline. There is deliberately no update or delete function:
 * entries can only be added, and the UI never offers to change them.
 */
import storage from './storageService'
import { logActivity } from './activityService'
import { getCurrentUser } from './authService'
import { STORAGE_KEYS } from '../utils/constants'
import { uid } from '../utils/helpers'
import { TIMELINE_EVENTS } from '../config/orderConfig'
import { formatMoney } from '../utils/formatters'

const KEY = STORAGE_KEYS.ORDER_TIMELINE

export const getOrderTimeline = () => storage.getItem(KEY, []) || []

/** Chronological (oldest first) events for one order. */
export const getOrderTimelineByOrderId = (orderId, all = getOrderTimeline()) =>
  all.filter((e) => e.orderId === orderId).sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0))

/** Build an event (pure) — used inside order transactions so the timeline commits with the order. */
export const makeTimelineEvent = (order, eventType, { remarks = '', description } = {}) => {
  const user = getCurrentUser()
  return {
    id: uid('tl'),
    orderId: order.id,
    orderNumber: order.orderNumber || null,
    eventType,
    title: TIMELINE_EVENTS[eventType] || eventType,
    description: description || `${order.orderNumber || 'Draft'} · ${order.customerName} · ${formatMoney(order.totalAmount)}`,
    userId: user?.id ?? null,
    userName: user?.name ?? 'System',
    timestamp: new Date().toISOString(),
    remarks,
  }
}

const VERB = {
  DRAFT_CREATED: 'saved a draft order for', ORDER_UPDATED: 'updated', SUBMITTED: 'submitted', RESUBMITTED: 'resubmitted',
  APPROVED: 'approved', REJECTED: 'rejected', RETURNED: 'returned for correction', CONSOLIDATED: 'consolidated',
  READY_FOR_DISPATCH: 'marked ready for dispatch', DUPLICATED: 'duplicated', CANCELLED: 'cancelled',
}

/** Mirror an order event into the global activity feed. */
export const logOrderActivity = (order, eventType) =>
  logActivity({
    type: eventType,
    message: `${VERB[eventType] || eventType.toLowerCase()} ${order.orderNumber || 'a draft order'} · ${order.customerName}`,
    entityType: 'order',
    entityId: order.id,
  })

/** Stand-alone append (outside a transaction). */
export const addOrderTimelineEvent = (order, eventType, options) => {
  const event = makeTimelineEvent(order, eventType, options)
  const res = storage.updateItem(KEY, (list) => [...(list || []), event], [])
  return res.ok ? { ok: true, event } : res
}

const orderTimelineService = { getOrderTimeline, getOrderTimelineByOrderId, addOrderTimelineEvent, makeTimelineEvent }
export default orderTimelineService
