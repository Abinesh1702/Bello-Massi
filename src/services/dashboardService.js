/**
 * Pure selectors that turn demo data into dashboard metrics and chart series.
 * No storage access — callers pass in the data snapshot.
 */
import dayjs from 'dayjs'
import { ORDER_STATUS as S } from '../utils/constants'
import { getCreditInfo } from './customerService'

export const inStatus = (orders, ...statuses) => orders.filter((o) => statuses.includes(o.status))
export const sumValue = (orders) => orders.reduce((s, o) => s + (o.totalValue || 0), 0)
export const isToday = (iso, now = dayjs()) => Boolean(iso) && dayjs(iso).isSame(now, 'day')
/** Timestamp of a workflow step, from the order's own audit fields. */
const STEP_FIELD = { SUBMITTED: 'submittedAt', APPROVED: 'approvedAt', REJECTED: 'rejectedAt', RETURNED: 'returnedAt', CONSOLIDATED: 'consolidatedAt', READY_FOR_DISPATCH: 'readyForDispatchAt', DELIVERED: 'deliveredAt' }
export const historyEventAt = (order, status) => order[STEP_FIELD[status]] || null

/** Orders created vs delivered per day across the last `days` days. */
export const getOrderTrend = (orders, days = 14, now = dayjs()) =>
  Array.from({ length: days }, (_, i) => {
    const day = now.subtract(days - 1 - i, 'day')
    return {
      date: day.format('DD MMM'),
      created: orders.filter((o) => dayjs(o.createdAt).isSame(day, 'day')).length,
      delivered: orders.filter((o) => o.deliveredAt && dayjs(o.deliveredAt).isSame(day, 'day')).length,
      value: Math.round(sumValue(orders.filter((o) => dayjs(o.createdAt).isSame(day, 'day'))) / 1000),
    }
  })

export const STATUS_BUCKETS = [
  { key: 'approval', label: 'Draft / awaiting approval', statuses: [S.DRAFT, S.SUBMITTED, S.RETURNED], color: 'var(--chart-4)' },
  { key: 'processing', label: 'Approved / consolidating', statuses: [S.APPROVED, S.CONSOLIDATED, S.READY_FOR_DISPATCH], color: 'var(--chart-1)' },
  { key: 'delivery', label: 'In delivery', statuses: [S.DISPATCHED, S.OUT_FOR_DELIVERY], color: 'var(--chart-2)' },
  { key: 'delivered', label: 'Delivered', statuses: [S.DELIVERED, S.PARTIALLY_DELIVERED], color: 'var(--chart-3)' },
  { key: 'exceptions', label: 'Rejected / failed', statuses: [S.REJECTED, S.DELIVERY_FAILED, S.RETURNED_TO_HUB], color: 'var(--chart-5)' },
]

export const getStatusDistribution = (orders) =>
  STATUS_BUCKETS.map((b) => ({ name: b.label, key: b.key, value: inStatus(orders, ...b.statuses).length, color: b.color }))

/** Delivered on time vs late vs delivery problems, by hub. */
export const getDeliveryPerformanceByHub = (orders, hubs) =>
  hubs.filter((h) => orders.some((o) => o.hubId === h.id)).map((h) => {
    const hubOrders = orders.filter((o) => o.hubId === h.id)
    const delivered = inStatus(hubOrders, S.DELIVERED)
    return {
      hub: h.city,
      onTime: delivered.filter((o) => o.onTime).length,
      late: delivered.filter((o) => !o.onTime).length,
      problem: inStatus(hubOrders, S.DELIVERY_FAILED, S.RETURNED_TO_HUB).length,
    }
  })

export const getOnTimeRate = (orders) => {
  const delivered = inStatus(orders, S.DELIVERED)
  if (!delivered.length) return 0
  return (delivered.filter((o) => o.onTime).length / delivered.length) * 100
}

/** Approval decisions per day (approved / returned / rejected) from the order timeline. */
export const getApprovalTrend = (timeline, days = 7, now = dayjs()) =>
  Array.from({ length: days }, (_, i) => {
    const day = now.subtract(days - 1 - i, 'day')
    const count = (type) => timeline.filter((e) => e.eventType === type && dayjs(e.timestamp).isSame(day, 'day')).length
    return { date: day.format('ddd DD'), approved: count(S.APPROVED), returned: count(S.RETURNED), rejected: count(S.REJECTED) }
  })

/** Credit utilisation per active, credit-enabled customer, highest first. */
export const getCreditOverview = (customers) =>
  customers
    .filter((c) => c.status === 'Active' && c.creditEnabled)
    .map((c) => {
      const info = getCreditInfo(c)
      return {
        id: c.id,
        name: c.name,
        city: c.city,
        limit: info.limit,
        outstanding: info.balance,
        available: info.available,
        utilisation: info.utilisation,
        status: info.status,
      }
    })
    .sort((a, b) => b.utilisation - a.utilisation)


/** Per-salesman grouping of orders waiting for Customer Service. */
export const getConsolidationQueue = (orders) => {
  const groups = {}
  orders.filter((o) => o.status === S.APPROVED && o.consolidationStatus === 'PENDING').forEach((o) => {
    groups[o.salesmanName] ||= { salesman: o.salesmanName, orders: 0, value: 0 }
    groups[o.salesmanName].orders += 1
    groups[o.salesmanName].value += o.totalValue
  })
  return Object.values(groups)
}

/** Driver-facing list of today's stops for a given driver. */
export const getDriverDay = (orders, driverId, now = dayjs()) => {
  const mine = orders.filter((o) => o.driverId === driverId)
  const today = mine.filter((o) => o.deliveryDate && dayjs(o.deliveryDate).isSame(now, 'day'))
  const tomorrow = mine.filter((o) => o.deliveryDate && dayjs(o.deliveryDate).isSame(now.add(1, 'day'), 'day'))
  return {
    all: mine,
    today,
    tomorrow,
    pending: inStatus(today, S.DISPATCHED, S.OUT_FOR_DELIVERY),
    completed: inStatus(today, S.DELIVERED),
    problems: inStatus(mine, S.DELIVERY_FAILED),
  }
}
