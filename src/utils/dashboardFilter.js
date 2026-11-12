/**
 * Dashboard period filter — presentation-level data selection.
 *
 * Each collection is filtered on ITS OWN business date (never a generic createdAt for everything). Master data and
 * point-in-time snapshots (stock levels, customers, products, hubs, vehicles, drivers, credit balances) are not
 * date-filtered; widgets built only on them are labelled "Current" in the UI.
 */
import { inRange } from './periods'

export const DATE_FIELDS = {
  orders: (o) => o.orderDate || o.createdAt,
  timeline: (e) => e.timestamp,
  activities: (a) => a.createdAt || a.timestamp,
  dispatches: (d) => d.dispatchDate,
  deliveries: (d) => d.completedAt || d.failedAt || d.startedAt || d.createdAt,
  invoices: (i) => i.invoiceDate,
  receipts: (r) => r.receiptDate || r.createdAt,
  transfers: (t) => t.transferDate || t.createdAt,
  adjustments: (a) => a.adjustmentDate || a.createdAt,
  drafts: (d) => d.createdAt,
  documents: (d) => d.uploadedAt || d.createdAt,
  insights: (i) => i.generatedAt || i.firstSeenAt,
  notes: (n) => n.deliveryDate || n.generatedAt,
  scrap: (r) => r.requestDate,
  calls: (c) => c.callDate,
  movements: (m) => m.date,
}

/** Human description of the date used per collection (shown in the filter's help popover). */
export const DATE_FIELD_LABELS = {
  orders: 'Orders — order date', dispatches: 'Dispatches — dispatch date', deliveries: 'Deliveries — delivery (completion) date',
  invoices: 'Invoices — invoice date', receipts: 'Stock receipts — receipt date', transfers: 'Transfers — transfer date',
  adjustments: 'Adjustments — adjustment date', drafts: 'Replenishment / purchase — created date', documents: 'Documents — upload date',
  insights: 'AI insights — generated date', scrap: 'Scrap — request date', calls: 'Calls — call date', timeline: 'Approvals — decision date',
  activities: 'Activity — event date', notes: 'Delivery notes — delivery date',
}

export const filterByPeriod = (kind, rows, range) => {
  if (!Array.isArray(rows) || !range || !range.start) return rows
  const f = DATE_FIELDS[kind]
  return f ? rows.filter((r) => inRange(f(r), range)) : rows
}

/** Filter the date-bearing collections of a snapshot object; other keys pass through unchanged. */
export const applyPeriod = (snap, range) => {
  if (!snap || !range || !range.start) return snap
  const out = { ...snap }
  Object.keys(DATE_FIELDS).forEach((k) => { if (Array.isArray(snap[k])) out[k] = filterByPeriod(k, snap[k], range) })
  return out
}

/** Change vs previous period → { diff, pct, dir } or null when there is no valid previous value. */
export const compareValues = (current, previous) => {
  if (previous === null || previous === undefined || Number.isNaN(Number(previous)) || current === null || current === undefined) return null
  const c = Number(current)
  const p = Number(previous)
  const diff = c - p
  return { current: c, previous: p, diff, pct: p ? (diff / Math.abs(p)) * 100 : null, dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat' }
}
