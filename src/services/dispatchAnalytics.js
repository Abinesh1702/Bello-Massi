/**
 * Pure selectors for the dispatch dashboard and delivery reports (Phase 4).
 * Every figure is computed from stored dispatches / deliveries — nothing is hard-coded.
 */
import dayjs from 'dayjs'
import { ORDER_STATUS as S } from '../utils/constants'
import { DELIVERY_STATUS_META } from '../config/dispatchConfig'

const closedAt = (d) => d.completedAt || d.failedAt || null

export const getDispatchKpis = ({ orders, dispatches, deliveries, drivers, vehicles }) => {
  const count = (st) => dispatches.filter((d) => d.status === st).length
  const live = deliveries.filter((d) => d.status !== 'CANCELLED')
  return {
    ready: orders.filter((o) => o.orderStatus === S.READY_FOR_DISPATCH).length,
    readyUnplanned: orders.filter((o) => o.orderStatus === S.READY_FOR_DISPATCH && !(o.dispatchId && dispatches.some((d) => d.id === o.dispatchId && ['DRAFT', 'PLANNED', 'ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'].includes(d.status)))).length,
    drafts: count('DRAFT'),
    planned: count('PLANNED'),
    assigned: count('ASSIGNED'),
    confirmed: count('CONFIRMED'),
    inTransit: count('IN_TRANSIT'),
    completedDispatches: count('COMPLETED') + count('PARTIALLY_DELIVERED'),
    completedDeliveries: live.filter((d) => d.status === 'DELIVERED').length,
    failedDeliveries: live.filter((d) => ['FAILED', 'RETURNED'].includes(d.status)).length,
    partialDeliveries: live.filter((d) => d.status === 'PARTIALLY_DELIVERED').length,
    outForDelivery: live.filter((d) => d.status === 'OUT_FOR_DELIVERY').length,
    pendingReview: live.filter((d) => d.reviewStatus === 'PENDING').length,
    activeDrivers: drivers.filter((d) => d.status === 'Active').length,
    availableDrivers: drivers.filter((d) => d.status === 'Active' && d.availability === 'Available').length,
    availableVehicles: vehicles.filter((v) => v.status === 'Available').length,
    totalVehicles: vehicles.length,
  }
}

const days = (n, now) => Array.from({ length: n }, (_, i) => now.subtract(n - 1 - i, 'day'))

/** Dispatches per dispatch date (cancelled excluded). */
export const getDispatchTrend = (dispatches, n = 14, now = dayjs()) =>
  days(n, now).map((day) => ({
    name: day.format('DD MMM'),
    value: dispatches.filter((d) => d.status !== 'CANCELLED' && d.dispatchDate === day.format('YYYY-MM-DD')).length,
  }))

/** Delivery outcomes per day. */
export const getCompletionTrend = (deliveries, n = 14, now = dayjs()) =>
  days(n, now).map((day) => {
    const on = deliveries.filter((d) => closedAt(d) && dayjs(closedAt(d)).isSame(day, 'day'))
    return {
      name: day.format('DD MMM'),
      delivered: on.filter((d) => d.status === 'DELIVERED').length,
      partial: on.filter((d) => d.status === 'PARTIALLY_DELIVERED').length,
      failed: on.filter((d) => ['FAILED', 'RETURNED'].includes(d.status)).length,
    }
  })

const DIST_COLORS = { DISPATCHED: 'var(--chart-1)', OUT_FOR_DELIVERY: 'var(--chart-2)', DELIVERED: 'var(--chart-3)', PARTIALLY_DELIVERED: 'var(--chart-4)', FAILED: 'var(--chart-5)' }
export const getDeliveryStatusDistribution = (deliveries) =>
  ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED'].map((k) => ({
    key: k,
    name: k === 'FAILED' ? 'Failed / returned' : DELIVERY_STATUS_META[k].label,
    value: deliveries.filter((d) => (k === 'FAILED' ? ['FAILED', 'RETURNED'].includes(d.status) : d.status === k)).length,
    color: DIST_COLORS[k],
  }))

const outcomeBy = (deliveries, keyOf, labelOf) => {
  const g = {}
  deliveries.filter((d) => closedAt(d)).forEach((d) => {
    const k = keyOf(d)
    if (!k) return
    g[k] ||= { id: k, name: labelOf(k), delivered: 0, partial: 0, failed: 0 }
    if (d.status === 'DELIVERED') g[k].delivered += 1
    else if (d.status === 'PARTIALLY_DELIVERED') g[k].partial += 1
    else if (['FAILED', 'RETURNED'].includes(d.status)) g[k].failed += 1
  })
  return Object.values(g).map((r) => ({ ...r, total: r.delivered + r.partial + r.failed, successRate: r.delivered + r.partial + r.failed ? ((r.delivered + r.partial) / (r.delivered + r.partial + r.failed)) * 100 : 0 })).sort((a, b) => b.total - a.total)
}

export const getDriverOutcomes = (deliveries, drivers) => {
  const D = Object.fromEntries(drivers.map((d) => [d.id, d]))
  return outcomeBy(deliveries, (d) => d.driverId, (id) => D[id]?.name || 'Former driver')
}

export const getZoneOutcomes = (deliveries, dispatches, zones) => {
  const DS = Object.fromEntries(dispatches.map((d) => [d.id, d]))
  const Z = Object.fromEntries(zones.map((z) => [z.id, z]))
  return outcomeBy(deliveries, (d) => DS[d.dispatchId]?.zoneId || d.zoneId, (id) => Z[id]?.name || 'No zone')
}

export const OUTCOME_SERIES = [
  { key: 'delivered', label: 'Delivered', color: 'var(--chart-3)' },
  { key: 'partial', label: 'Partial', color: 'var(--chart-4)' },
  { key: 'failed', label: 'Failed / returned', color: 'var(--chart-5)' },
]
