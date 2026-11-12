/**
 * Period-aware versions of the dashboard trend series. Same counting rules as services/dashboardService
 * (created on createdAt, delivered on deliveredAt, value in thousands; approvals from the order timeline) — only the
 * time axis follows the selected period: daily up to ~6 weeks, weekly up to ~6 months, monthly beyond.
 */
import dayjs from 'dayjs'
import { inRange, orgNow, trendBuckets } from './periods'
import { sumValue } from '../services/dashboardService'
import { ORDER_STATUS as S } from './constants'

const earliest = (values) => values.filter(Boolean).sort()[0] || null
const within = (v, b) => inRange(v, b)

export const getOrderTrendForRange = (orders, range, { allOrders } = {}) => {
  const { buckets } = trendBuckets(range, { fallbackStart: earliest((allOrders || orders).map((o) => o.orderDate || o.createdAt)), maxEnd: orgNow() })
  return buckets.map((b) => {
    const created = orders.filter((o) => within(o.createdAt, b))
    return {
      date: b.label,
      created: created.length,
      delivered: orders.filter((o) => o.deliveredAt && within(o.deliveredAt, b)).length,
      value: Math.round(sumValue(created) / 1000),
    }
  })
}

export const getApprovalTrendForRange = (timeline, range) => {
  const { buckets } = trendBuckets(range, { fallbackStart: earliest(timeline.map((e) => e.timestamp)), maxEnd: orgNow() })
  return buckets.map((b) => {
    const count = (type) => timeline.filter((e) => e.eventType === type && within(e.timestamp, b)).length
    return { date: b.label, approved: count(S.APPROVED), returned: count(S.RETURNED), rejected: count(S.REJECTED) }
  })
}

/** Subtitle fragment describing the axis, e.g. "per day, 01-Nov-2026 – 12-Nov-2026". */
export const trendAxisText = (range) => {
  if (!range?.start) return 'all time'
  const days = dayjs(range.end).diff(range.start, 'day') + 1
  const unit = days <= 45 ? 'day' : days <= 182 ? 'week' : 'month'
  return `per ${unit}`
}
