/**
 * Stock reservation for approved orders (pure — no storage access). Callers pass copies of orders / inventory /
 * products and commit the result themselves in one storage transaction, like utils/dispatchStock.js.
 *
 * Life cycle of a reservation (order.reservation):
 *   approval ............ reserve   → RESERVED (every tracked line covered) / PARTIAL (some short) / SHORT (none)
 *   consolidation ....... top up    → reserves what became available since approval
 *   dispatch confirm .... consume   → CONSUMED (the dispatch movement deducts on-hand and releases the reservation)
 *   dispatch cancelled .. restore   → RESERVED / PARTIAL again (the reversal re-reserves the released quantity)
 *   order cancelled ..... release   → RELEASED
 *
 * Invariant: for every product × hub, inventory.reservedQuantity === Σ open reservation lines of the hub's orders.
 * A reservation never takes stock below zero available, so it never creates negative inventory.
 */
import { getAvailable } from './stock'

export const OPEN_RESERVATION = ['RESERVED', 'PARTIAL', 'SHORT']
export const RESERVATION_META = {
  RESERVED: { label: 'Stock reserved', tone: 'success' },
  PARTIAL: { label: 'Partly reserved', tone: 'warning' },
  SHORT: { label: 'Awaiting stock', tone: 'danger' },
  CONSUMED: { label: 'Dispatched', tone: 'neutral' },
  RELEASED: { label: 'Released', tone: 'neutral' },
}

const round = (n) => Math.round(n * 1000) / 1000
const isOpen = (order) => Boolean(order?.reservation && OPEN_RESERVATION.includes(order.reservation.status))

/**
 * Quantity of one order line currently reserved. Orders seeded before data v10 carried a whole-order flag
 * (stockReserved) instead of per-line reservations: they count as fully reserved.
 */
export const reservedQtyFor = (order, item) => {
  if (isOpen(order)) return Number(order.reservation.lines?.[item.id]) || 0
  if (!order?.reservation && order?.stockReserved) return Number(item.orderedQuantity) || 0
  return 0
}

/** Open reservation lines of an order as [{ itemId, productId, quantity }] (for integrity checks and the UI). */
export const openReservationLines = (order) => (isOpen(order)
  ? order.items.map((it) => ({ itemId: it.id, productId: it.productId, quantity: Number(order.reservation.lines?.[it.id]) || 0 })).filter((l) => l.quantity > 0)
  : [])

const statusOf = (order, lines, P) => {
  const tracked = order.items.filter((it) => P[it.productId]?.trackInventory)
  if (!tracked.length) return 'RESERVED'
  const full = tracked.every((it) => (lines[it.id] || 0) >= (Number(it.orderedQuantity) || 0) - 1e-9)
  if (full) return 'RESERVED'
  return tracked.some((it) => (lines[it.id] || 0) > 0) ? 'PARTIAL' : 'SHORT'
}


/**
 * Reserve (or top up) an order's tracked lines at its hub from available stock.
 * Returns { order, inventory, reservedNow } — inventory is a new array (records touched are copied).
 */
export const reserveOrder = ({ order, inventory, products, at = new Date().toISOString() }) => {
  const P = Object.fromEntries(products.map((p) => [p.id, p]))
  const inv = inventory.map((r) => r)
  const lines = { ...(isOpen(order) ? order.reservation.lines : {}) }
  const untracked = []
  let reservedNow = 0
  order.items.forEach((it) => {
    const p = P[it.productId]
    if (!p?.trackInventory) { untracked.push(it.id); return }
    const want = round((Number(it.orderedQuantity) || 0) - (lines[it.id] || 0))
    if (want <= 0) return
    const i = inv.findIndex((r) => r.productId === it.productId && r.hubId === order.hubId)
    if (i < 0) return
    const take = round(Math.max(0, Math.min(want, getAvailable(inv[i]))))
    if (take <= 0) return
    inv[i] = { ...inv[i], reservedQuantity: round((Number(inv[i].reservedQuantity) || 0) + take), lastUpdated: at }
    lines[it.id] = round((lines[it.id] || 0) + take)
    reservedNow = round(reservedNow + take)
  })
  const status = statusOf(order, lines, P)
  const prev = order.reservation || {}
  const reservation = { status, lines, untracked, reservedAt: prev.reservedAt && isOpen(order) ? prev.reservedAt : at, updatedAt: at }
  return { order: { ...order, reservation, stockReserved: false }, inventory: inv, reservedNow }
}

/** Release an order's open reservation (cancellation). status: RELEASED (or CONSUMED when called for dispatch). */
export const releaseOrder = ({ order, inventory, at = new Date().toISOString(), status = 'RELEASED', reason = '' }) => {
  const inv = inventory.map((r) => r)
  let released = 0
  order.items.forEach((it) => {
    const q = reservedQtyFor(order, it)
    if (!(q > 0)) return
    const i = inv.findIndex((r) => r.productId === it.productId && r.hubId === order.hubId)
    if (i < 0) return
    const take = round(Math.min(Number(inv[i].reservedQuantity) || 0, q))
    inv[i] = { ...inv[i], reservedQuantity: round((Number(inv[i].reservedQuantity) || 0) - take), lastUpdated: at }
    released = round(released + take)
  })
  const reservation = { ...(order.reservation || { lines: {} }), status, releasedAt: at, releaseReason: reason, updatedAt: at }
  return { order: { ...order, reservation, stockReserved: false }, inventory: inv, released }
}

/** Mark a reservation consumed by a confirmed dispatch (the dispatch movement already released reserved stock). */
export const consumeReservation = (order, at = new Date().toISOString()) => ({
  ...order,
  stockReserved: false,
  reservation: order.reservation || order.stockReserved ? { ...(order.reservation || { lines: Object.fromEntries(order.items.map((it) => [it.id, Number(it.orderedQuantity) || 0])) }), status: 'CONSUMED', consumedAt: at, updatedAt: at } : order.reservation,
})

/** Restore a reservation after a confirmed dispatch was cancelled and its stock reversed (re-reserved per line). */
export const restoreReservation = (order, snapshotLines, products, at = new Date().toISOString()) => {
  const P = Object.fromEntries(products.map((p) => [p.id, p]))
  const lines = {}
  snapshotLines.filter((s) => s.orderId === order.id && s.reservedReleased > 0).forEach((s) => { lines[s.orderItemId] = round((lines[s.orderItemId] || 0) + s.reservedReleased) })
  const status = statusOf(order, lines, P)
  return { ...order, stockReserved: false, reservation: { ...(order.reservation || {}), status, lines, restoredAt: at, updatedAt: at } }
}

/** Statuses in which an order holds stock (approved, not yet loaded). */
export const RESERVING_ORDER_STATUSES = ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH']

/**
 * Rebuild every reservation from the orders (data migration / fresh seed). Reserved stock that no open order
 * accounts for is released; approved orders not yet loaded reserve in approval order, never beyond available.
 * Returns { orders, inventory, changed } — pure.
 */
export const reconcileReservations = ({ orders, inventory, products, dispatches = [], at = new Date().toISOString() }) => {
  const loaded = new Set(dispatches.filter((d) => d.stockDeducted && !d.stockReversed && d.status !== 'CANCELLED').flatMap((d) => d.orderIds || []))
  let inv = inventory.map((r) => ({ ...r, reservedQuantity: 0 }))
  const next = new Map(orders.map((o) => [o.id, o]))
  const eligible = orders
    .filter((o) => RESERVING_ORDER_STATUSES.includes(o.orderStatus) && !loaded.has(o.id))
    .sort((a, b) => String(a.approvedAt || a.orderDate || '').localeCompare(String(b.approvedAt || b.orderDate || '')))
  eligible.forEach((o) => {
    const base = { ...o, reservation: null, stockReserved: false }
    const r = reserveOrder({ order: base, inventory: inv, products, at: o.reservation?.reservedAt || o.approvedAt || at })
    inv = r.inventory
    next.set(o.id, r.order)
  })
  // Orders that no longer hold stock keep their history but lose any stale flag
  orders.forEach((o) => {
    if (eligible.some((e) => e.id === o.id)) return
    if (o.stockReserved || isOpen(o)) next.set(o.id, { ...o, stockReserved: false, reservation: o.reservation ? { ...o.reservation, status: loaded.has(o.id) ? 'CONSUMED' : 'RELEASED', updatedAt: at } : null })
  })
  const outOrders = orders.map((o) => next.get(o.id))
  const changed = inventory.some((r, i) => (Number(r.reservedQuantity) || 0) !== inv[i].reservedQuantity) || outOrders.some((o, i) => o !== orders[i])
  return { orders: outOrders, inventory: inv.map((r, i) => ((Number(inventory[i].reservedQuantity) || 0) === r.reservedQuantity ? inventory[i] : { ...inventory[i], reservedQuantity: r.reservedQuantity })), changed }
}
