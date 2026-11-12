/**
 * Pure stock arithmetic for dispatch (Phase 4). Shared by dispatchService/deliveryService and the
 * seed builder, so it never touches storage. Callers pass copies of inventory and the existing
 * movement ledger and commit the result themselves in one storage transaction.
 *
 * Policy: stock leaves the hub exactly once — when the dispatch is CONFIRMED. The order's reservation
 * (made at approval, utils/stockReservation) is released by the same movement, so available stock is not
 * reduced twice. Delivery confirmation never moves stock again.
 */
import { MOVEMENT_TYPES as MT } from '../config/masterData'
import { getAvailable } from './stock'
import { reservedQtyFor } from './stockReservation'
import { uid } from './helpers'
import { nextNumber } from '../services/validation'

const round = (n) => Math.round(n * 1000) / 1000

const makeLedger = (inventory, movements) => {
  const inv = inventory.map((r) => ({ ...r }))
  const numbers = movements.map((m) => m.movementNumber)
  const created = []
  const find = (productId, hubId) => inv.find((r) => r.productId === productId && r.hubId === hubId) || null
  const post = (rec, { type, quantity, dTotal = 0, dReserved = 0, dDamaged = 0, at, userId, reference, dispatchId = null, orderId = null, orderNumber = null, deliveryId = null, notes = '' }) => {
    const before = { total: rec.totalQuantity, available: getAvailable(rec) }
    rec.totalQuantity = round(rec.totalQuantity + dTotal)
    rec.reservedQuantity = round(Math.max(0, (rec.reservedQuantity || 0) + dReserved))
    rec.damagedQuantity = round(Math.max(0, (rec.damagedQuantity || 0) + dDamaged))
    rec.lastUpdated = at
    const movementNumber = nextNumber('MOV', numbers, 5)
    numbers.push(movementNumber)
    const movement = {
      id: uid('mov'),
      movementNumber,
      date: at,
      productId: rec.productId,
      hubId: rec.hubId,
      movementType: type,
      quantity,
      previousQuantity: before.total,
      newQuantity: rec.totalQuantity,
      previousAvailable: round(before.available),
      newAvailable: round(getAvailable(rec)),
      referenceNumber: reference,
      dispatchId,
      orderId,
      orderNumber,
      deliveryId,
      createdBy: userId,
      notes,
    }
    created.push(movement)
    return movement
  }
  return { inv, created, find, post }
}

/** Ledger order is newest first: prepend the new movements (created oldest → newest). */
export const mergeMovements = (created, movements) => [...[...created].reverse(), ...movements]

/**
 * Check and deduct every item of every order in the dispatch.
 * Returns { ok, errors: string[], inventory, created, snapshot } — nothing is applied when errors exist.
 */
export const deductDispatchStock = ({ inventory, movements, orders, hubId, products, dispatch, userId, at }) => {
  const P = Object.fromEntries(products.map((p) => [p.id, p]))
  const L = makeLedger(inventory, movements)
  const errors = []
  const snapshot = []
  orders.forEach((order) => {
    order.items.forEach((it) => {
      const product = P[it.productId]
      const qty = Number(it.orderedQuantity) || 0
      if (!product?.trackInventory) {
        snapshot.push({ orderId: order.id, orderNumber: order.orderNumber, orderItemId: it.id, productId: it.productId, productName: it.productName, unit: it.unit, quantity: qty, tracked: false, movementId: null, reservedReleased: 0, previousAvailable: null, newAvailable: null })
        return
      }
      const rec = L.find(it.productId, hubId)
      const reservedRelease = rec ? Math.min(rec.reservedQuantity || 0, reservedQtyFor(order, it), qty) : 0
      const usable = rec ? getAvailable(rec) + reservedRelease : 0
      if (!rec || (qty > usable && !product.allowNegativeStock)) {
        errors.push(`${order.orderNumber}: ${it.productName} needs ${qty} ${it.unit}, only ${round(Math.max(0, usable))} available at the hub.`)
        return
      }
      const m = L.post(rec, {
        type: MT.DISPATCH, quantity: qty, dTotal: -qty, dReserved: -reservedRelease, at, userId,
        reference: dispatch.dispatchNumber, dispatchId: dispatch.id, orderId: order.id, orderNumber: order.orderNumber,
        notes: `Dispatched on ${dispatch.dispatchNumber} · ${order.orderNumber} · ${order.customerName}`,
      })
      snapshot.push({
        orderId: order.id, orderNumber: order.orderNumber, orderItemId: it.id, productId: it.productId, productName: it.productName, unit: it.unit,
        quantity: qty, tracked: true, movementId: m.id, movementNumber: m.movementNumber, reservedReleased: reservedRelease,
        previousAvailable: m.previousAvailable, newAvailable: m.newAvailable, previousQuantity: m.previousQuantity, newQuantity: m.newQuantity,
      })
    })
  })
  if (errors.length) return { ok: false, errors }
  return { ok: true, errors, inventory: L.inv, created: L.created, snapshot }
}

/** Put a confirmed dispatch's stock back (cancelled before the driver started). Re-reserves what the dispatch released. */
export const reverseDispatchStock = ({ inventory, movements, snapshot, hubId, dispatch, userId, at, reason }) => {
  const L = makeLedger(inventory, movements)
  snapshot.filter((s) => s.tracked && s.movementId).forEach((s) => {
    const rec = L.find(s.productId, hubId)
    if (!rec) return
    L.post(rec, {
      type: MT.DISPATCH_REVERSAL, quantity: s.quantity, dTotal: s.quantity, dReserved: s.reservedReleased || 0, at, userId,
      reference: dispatch.dispatchNumber, dispatchId: dispatch.id, orderId: s.orderId, orderNumber: s.orderNumber,
      notes: `Reversal of ${dispatch.dispatchNumber} · ${s.orderNumber}${reason ? ` — ${reason}` : ''}`,
    })
  })
  return { inventory: L.inv, created: L.created }
}

/** Undelivered goods brought back by the driver and accepted into hub stock after review. */
export const returnDeliveryStock = ({ inventory, movements, lines, hubId, dispatch, delivery, userId, at, products }) => {
  const P = Object.fromEntries(products.map((p) => [p.id, p]))
  const L = makeLedger(inventory, movements)
  lines.filter((l) => l.quantity > 0 && P[l.productId]?.trackInventory).forEach((l) => {
    const rec = L.find(l.productId, hubId)
    if (!rec) return
    L.post(rec, {
      type: MT.DELIVERY_RETURN, quantity: l.quantity, dTotal: l.quantity, at, userId,
      reference: dispatch.dispatchNumber, dispatchId: dispatch.id, orderId: delivery.orderId, orderNumber: delivery.orderNumber, deliveryId: delivery.id,
      notes: `Returned from ${delivery.orderNumber} (${dispatch.dispatchNumber})`,
    })
  })
  return { inventory: L.inv, created: L.created }
}
