import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useAuth } from './useAuth'
import { useDispatchData } from './useDispatchData'
import { useStoredValue } from './useLocalStorage'
import { getDriverRecordForUser, getNextStop, isFutureDispatch } from '../services/deliveryService'
import { PENDING_DELIVERY_STATUSES, RESOURCE_DISPATCH_STATUSES } from '../config/dispatchConfig'
import { STORAGE_KEYS as K } from '../utils/constants'
import { etaPlan } from '../utils/demoGeo'

const EMPTY = []
const EMPTY_TRACK = { sessions: [] }

const byDate = (a, b) => (a.dispatchDate < b.dispatchDate ? -1 : a.dispatchDate > b.dispatchDate ? 1 : (a.createdAt < b.createdAt ? -1 : 1))

/**
 * Everything the signed-in driver may see: their driver record, their dispatches and their delivery stops.
 * Nothing belonging to another driver is returned.
 */
export const useDriverWorkspace = () => {
  const { user } = useAuth()
  const data = useDispatchData()
  const tracking = useStoredValue(K.DRIVER_TRACKING, EMPTY_TRACK)
  const pods = useStoredValue(K.DELIVERY_POD, EMPTY)
  return useMemo(() => {
    const driver = getDriverRecordForUser(user, data.drivers)
    if (!driver) return { ...data, driver: null, dispatches: [], deliveries: [], notes: [], current: null, stops: [], next: null, tomorrow: [], plan: {}, completedToday: [], sessions: [], pods: [] }
    const allMine = data.dispatches.filter((d) => d.driverId === driver.id)
    const dispatches = allMine
    const tomorrow = allMine.filter((d) => isFutureDispatch(d) && !['CANCELLED', 'COMPLETED'].includes(d.status)).sort(byDate)
    const deliveries = data.deliveries.filter((d) => d.driverId === driver.id && d.status !== 'CANCELLED')
    const notes = data.notes.filter((n) => deliveries.some((d) => d.id === n.deliveryId))
    // Current dispatch: the one on the road, else the earliest confirmed / assigned one
    const active = dispatches.filter((d) => RESOURCE_DISPATCH_STATUSES.includes(d.status) && !isFutureDispatch(d)).sort(byDate)
    const current = active.find((d) => d.status === 'IN_TRANSIT') || active.find((d) => d.status === 'CONFIRMED') || active[0]
      || dispatches.filter((d) => dayjs(d.dispatchDate).isSame(dayjs(), 'day') && d.status !== 'CANCELLED').sort(byDate).at(-1) || null
    const stops = current ? deliveries.filter((d) => d.dispatchId === current.id).sort((a, b) => a.sequence - b.sequence) : []
    const next = getNextStop(stops)
    const count = (fn) => stops.filter(fn).length
    const summary = {
      total: stops.length,
      completed: count((d) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(d.status)),
      failed: count((d) => ['FAILED', 'RETURNED'].includes(d.status)),
      pending: count((d) => PENDING_DELIVERY_STATUSES.includes(d.status)),
    }
    summary.progress = summary.total ? Math.round(((summary.completed + summary.failed) / summary.total) * 100) : 0
    summary.active = count((d) => d.status === 'OUT_FOR_DELIVERY')
    summary.tomorrow = tomorrow.reduce((s, d) => s + (d.totalDeliveries || (d.orderIds || []).length), 0)
    const hubRec = current ? data.lk.hubs[current.hubId] : data.lk.hubs[driver.hubId]
    const withTimes = stops.map((d) => ({ ...d, requestedDeliveryTime: data.lk.orders[d.orderId]?.requestedDeliveryTime || null, requestedDeliveryDate: data.lk.orders[d.orderId]?.requestedDeliveryDate || null }))
    const plan = Object.fromEntries(etaPlan(withTimes, { hub: hubRec, customers: data.lk.customers }).map((p) => [p.id, p]))
    const completedToday = deliveries.filter((d) => d.completedAt && dayjs(d.completedAt).isSame(dayjs(), 'day')).sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1))
    const sessions = (tracking.sessions || []).filter((t) => t.driverId === driver.id)
    return {
      ...data, driver, dispatches, deliveries, notes, current, stops, next, summary, tomorrow, plan, completedToday, sessions, pods: pods.filter((p) => p.driverId === driver.id),
      vehicle: current ? data.lk.vehicles[current.vehicleId] : data.lk.vehicles[driver.vehicleId] || null,
      zone: current ? data.lk.zones[current.zoneId] : data.lk.zones[driver.zoneId] || null,
      hub: current ? data.lk.hubs[current.hubId] : data.lk.hubs[driver.hubId] || null,
    }
  }, [user, data, tracking, pods])
}

/** Google Maps directions link for a delivery address (opens the phone's maps app; nothing is sent from here). */
export const navigationUrl = (d) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([d.deliveryAddress, d.city, d.pincode].filter(Boolean).join(', '))}`

export default useDriverWorkspace
