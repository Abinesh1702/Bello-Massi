/**
 * DEMO GPS tracking sessions.
 *
 * A session opens when the driver taps Start delivery and closes when the delivery is completed or fails. The
 * position shown to the dispatcher and the customer is SIMULATED (utils/demoGeo) — it moves along the straight
 * line from the previous stop to the customer over the estimated drive time. No device location is read and
 * nothing claims to be real-time GPS.
 */
import storage from './storageService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { customerCoords, driveMinutes, hubCoords, roadKm, simulatedPosition } from '../utils/demoGeo'
import { uid } from '../utils/helpers'

const read = (k, f) => storage.getItem(k, f) ?? f
export const getTrackingState = () => read(K.DRIVER_TRACKING, { sessions: [] }) || { sessions: [] }
export const getSessions = () => getTrackingState().sessions || []
export const getSessionForDelivery = (deliveryId, sessions = getSessions()) => sessions.filter((s) => s.deliveryId === deliveryId).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0] || null

/** Build a new session for a delivery being started; returns the [key, value] write for a transaction. */
export const openSessionWrite = (delivery, { deliveries, now }) => {
  const hubs = read(K.HUBS, [])
  const customers = read(K.CUSTOMERS, [])
  const hub = hubs.find((h) => h.id === delivery.hubId)
  const prev = deliveries.filter((d) => d.dispatchId === delivery.dispatchId && d.sequence < delivery.sequence && d.completedAt).sort((a, b) => b.sequence - a.sequence)[0]
  const origin = prev ? customerCoords(customers.find((c) => c.id === prev.customerId) || prev, hub) : hubCoords(hub)
  const destination = customerCoords(customers.find((c) => c.id === delivery.customerId) || delivery, hub)
  const distanceKm = roadKm(origin, destination)
  const session = {
    id: uid('trk'), deliveryId: delivery.id, dispatchId: delivery.dispatchId, driverId: delivery.driverId, vehicleId: delivery.vehicleId, customerId: delivery.customerId,
    orderId: delivery.orderId, origin, destination, distanceKm, plannedMinutes: driveMinutes(distanceKm), startedAt: now, arrivedAt: null, stoppedAt: null, outcome: null, simulated: true,
  }
  const state = getTrackingState()
  // Any earlier open session of this driver is closed (one live session per driver)
  const sessions = (state.sessions || []).map((s) => (s.driverId === delivery.driverId && !s.stoppedAt ? { ...s, stoppedAt: now, outcome: s.outcome || 'superseded' } : s))
  return { write: [K.DRIVER_TRACKING, { ...state, sessions: [session, ...sessions].slice(0, 300) }], session }
}

/** Patch the latest session of a delivery (arrival / stop); returns the transaction write or null. */
export const patchSessionWrite = (deliveryId, patch) => {
  const state = getTrackingState()
  const s = getSessionForDelivery(deliveryId, state.sessions || [])
  if (!s) return null
  return [K.DRIVER_TRACKING, { ...state, sessions: state.sessions.map((x) => (x.id === s.id ? { ...x, ...patch } : x)) }]
}

/** Simulated live view of a session (null when there is none). */
export const livePosition = (session, now = Date.now()) => (session ? simulatedPosition(session, now) : null)
