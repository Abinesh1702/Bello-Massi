/**
 * DEMO GPS — simulated positions, distances and ETAs.
 *
 * The prototype has no GPS feed and no maps API. Hubs get approximate city-centre coordinates and each customer a
 * stable pseudo-random offset (hash of its id) within the hub's city, so routes look plausible and stay the same on
 * every load. Nothing here is a real location; screens that use it are labelled "DEMO GPS".
 */
import dayjs from 'dayjs'
import { getLocaleConfig } from '../config/runtimeConfig'

/** Requested wall-clock time (organisation time zone) → instant. */
const orgInstant = (date, time) => {
  try { return dayjs.tz ? dayjs.tz(`${date}T${time}`, getLocaleConfig().timezone) : dayjs(`${date}T${time}`) } catch { return dayjs(`${date}T${time}`) }
}

const CITY = {
  chennai: [13.0827, 80.2707], bengaluru: [12.9716, 77.5946], bangalore: [12.9716, 77.5946], hyderabad: [17.385, 78.4867],
  coimbatore: [11.0168, 76.9558], kochi: [9.9312, 76.2673], madurai: [9.9252, 78.1198], dubai: [25.2048, 55.2708],
  'abu dhabi': [24.4539, 54.3773], sharjah: [25.3463, 55.4209],
}
const DEFAULT = CITY.chennai

const hash = (s) => {
  let h = 2166136261
  for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  return (h >>> 0) / 4294967295
}

/** Approximate coordinates of a hub (city centre). */
export const hubCoords = (hub) => {
  const key = String(hub?.city || hub?.name || '').toLowerCase()
  const city = Object.keys(CITY).find((c) => key.includes(c))
  return city ? CITY[city] : DEFAULT
}

/** Stable demo coordinates for a customer / delivery address near its hub city (≈ 2–12 km away). */
export const customerCoords = (entity, hub) => {
  const [lat, lng] = hubCoords(hub)
  const id = entity?.customerId || entity?.id || entity?.customerName || 'x'
  const angle = hash(`${id}:a`) * Math.PI * 2
  const km = 2 + hash(`${id}:d`) * 10
  return [lat + (km / 111) * Math.cos(angle), lng + (km / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)]
}

export const distanceKm = ([a1, o1], [a2, o2]) => {
  const R = 6371
  const dA = ((a2 - a1) * Math.PI) / 180
  const dO = ((o2 - o1) * Math.PI) / 180
  const x = Math.sin(dA / 2) ** 2 + Math.cos((a1 * Math.PI) / 180) * Math.cos((a2 * Math.PI) / 180) * Math.sin(dO / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

/** Road distance estimate (straight line × 1.35) and urban drive time at 24 km/h. */
export const roadKm = (a, b) => Math.round(distanceKm(a, b) * 1.35 * 10) / 10
export const driveMinutes = (km) => Math.max(5, Math.round((km / 24) * 60))
export const SERVICE_MINUTES = 12

/**
 * ETA plan for a driver's stops in the dispatcher's sequence (never re-ordered).
 * Returns per stop: distanceKm (from previous point), eta (ISO), late (true when the ETA misses the requested time).
 */
export const etaPlan = (stops, { hub, start = dayjs(), customers = {} } = {}) => {
  let point = hubCoords(hub)
  let clock = dayjs(start)
  return stops.map((d) => {
    const dest = customerCoords(customers[d.customerId] || d, hub)
    const km = roadKm(point, dest)
    const closed = ['DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED'].includes(d.status)
    let eta = null
    if (!closed) {
      clock = clock.add(driveMinutes(km), 'minute')
      eta = clock.toISOString()
      clock = clock.add(SERVICE_MINUTES, 'minute')
    }
    point = dest
    const requested = d.requestedDeliveryTime && d.requestedDeliveryDate ? orgInstant(d.requestedDeliveryDate, d.requestedDeliveryTime) : null
    return { id: d.id, distanceKm: km, eta, coords: dest, late: Boolean(eta && requested && dayjs(eta).isAfter(requested)), requestedAt: requested ? requested.toISOString() : null }
  })
}

/**
 * Simulated position along a tracking session: moves from origin to destination over the planned drive time
 * (stops at 95 % until the driver taps Reach Location, then sits at the destination).
 */
export const simulatedPosition = (session, now = Date.now()) => {
  if (!session) return null
  const [a1, o1] = session.origin
  const [a2, o2] = session.destination
  let progress
  if (session.arrivedAt || session.stoppedAt) progress = 1
  else {
    const elapsed = (now - Date.parse(session.startedAt)) / 60000
    progress = Math.min(0.95, Math.max(0.02, elapsed / Math.max(1, session.plannedMinutes || 20)))
  }
  return {
    coords: [a1 + (a2 - a1) * progress, o1 + (o2 - o1) * progress],
    progress,
    remainingKm: Math.round(session.distanceKm * (1 - progress) * 10) / 10,
    etaMinutes: progress >= 1 ? 0 : Math.max(1, Math.round((session.plannedMinutes || 20) * (1 - progress))),
    updatedAt: new Date(session.stoppedAt ? Date.parse(session.stoppedAt) : now).toISOString(),
  }
}
