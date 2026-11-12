/**
 * Append-only dispatch timeline (Phase 4). Entries are only ever added — there is no update or delete.
 * Events are built with makeDispatchEvent() and committed inside the same storage transaction as the
 * dispatch / delivery change they describe.
 */
import storage from './storageService'
import { logActivity } from './activityService'
import { getCurrentUser } from './authService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { DISPATCH_EVENTS } from '../config/dispatchConfig'

export const getDispatchTimeline = () => storage.getItem(K.DISPATCH_TIMELINE, []) || []

const chrono = (a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0)
export const getTimelineForDispatch = (dispatchId, all = getDispatchTimeline()) => all.filter((e) => e.dispatchId === dispatchId).sort(chrono)
export const getTimelineForDelivery = (deliveryId, all = getDispatchTimeline()) => all.filter((e) => e.deliveryId === deliveryId).sort(chrono)
export const getTimelineForOrder = (orderId, all = getDispatchTimeline()) => all.filter((e) => e.orderId === orderId).sort(chrono)

/** Build an event (pure apart from reading the signed-in user). */
export const makeDispatchEvent = (dispatch, eventType, { orderId = null, deliveryId = null, remarks = '', description, at } = {}) => {
  const user = getCurrentUser()
  return {
    id: uid('dtl'),
    dispatchId: dispatch.id,
    dispatchNumber: dispatch.dispatchNumber,
    orderId,
    deliveryId,
    eventType,
    title: DISPATCH_EVENTS[eventType] || eventType,
    description: description || DISPATCH_EVENTS[eventType] || eventType,
    userId: user?.id ?? null,
    userName: user?.name ?? 'System',
    timestamp: at || new Date().toISOString(),
    remarks,
  }
}


export const logDispatchActivity = (message, entityId, entityType = 'dispatch') =>
  logActivity({ type: 'DISPATCH', message, entityType, entityId })

const dispatchTimelineService = { getDispatchTimeline, getTimelineForDispatch, getTimelineForDelivery, getTimelineForOrder, makeDispatchEvent }
export default dispatchTimelineService
