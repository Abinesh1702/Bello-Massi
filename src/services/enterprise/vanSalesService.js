/**
 * Van sales: stock leaves the hub onto the van (VAN_LOAD movement), is sold from the van, and what is left comes back
 * at settlement (VAN_RETURN movement) — all through the single stock ledger. Van stock is never a second ledger:
 * it is loaded − sold − returned for one assignment.
 */
import { STORAGE_KEYS as K } from '../../utils/constants'
import { MOVEMENT_TYPES as MT } from '../../config/masterData'
import { postStockMovement } from '../inventoryService'
import { createRecord, read } from './recordService'

const r2 = (n) => Math.round((Number(n) || 0) * 1000) / 1000

export const salesForAssignment = (assignmentId) => read(K.VAN_SALES).filter((s) => s.assignmentId === assignmentId && s.status === 'COMPLETED')

/** Van stock per product for one assignment. */
export const vanStock = (a) => {
  const sold = {}
  salesForAssignment(a.id).forEach((s) => (s.lines || []).forEach((l) => { sold[l.productId] = r2((sold[l.productId] || 0) + Number(l.quantity || 0)) }))
  return (a.lines || []).map((l) => ({ productId: l.productId, loaded: Number(l.loadedQty) || 0, sold: sold[l.productId] || 0, onVan: a.status === 'SETTLED' ? 0 : r2((Number(l.loadedQty) || 0) - (sold[l.productId] || 0)) }))
}

export const validateVanAssignment = (v, list, existingId) => {
  const e = {}
  const vehicle = read(K.VEHICLES).find((x) => x.id === v.vehicleId)
  if (vehicle && ['Inactive', 'Maintenance'].includes(vehicle.status)) e.vehicleId = `${vehicle.vehicleNumber} is ${vehicle.status.toLowerCase()}.`
  if (list.some((a) => a.id !== existingId && a.routeDate === v.routeDate && ['PLANNED', 'LOADED', 'ON_ROUTE'].includes(a.status) && (a.vehicleId === v.vehicleId || a.salesExecId === v.salesExecId))) e.vehicleId = 'This van or sales executive already has an open assignment on that date.'
  const qty = (v.lines || []).reduce((s, l) => s + (Number(l.loadedQty) || 0), 0)
  if (vehicle?.capacity && qty > vehicle.capacity) e.lines = `Load of ${qty} exceeds the van capacity of ${vehicle.capacity} ${vehicle.capacityUnit || 'units'}.`
  return e
}

export const loadVan = (a) => {
  const done = []
  for (const l of a.lines || []) {
    if (!(Number(l.loadedQty) > 0)) continue
    const r = postStockMovement({ productId: l.productId, hubId: a.hubId, type: MT.VAN_LOAD, quantity: l.loadedQty, reference: a.number, notes: `Loaded on van for ${a.routeName || a.number}`, orderId: a.id, orderNumber: a.number })
    if (!r.ok) {
      // Undo what was already loaded so the ledger stays consistent
      done.forEach((d) => postStockMovement({ productId: d.productId, hubId: a.hubId, type: MT.VAN_RETURN, quantity: d.qty, reference: a.number, notes: 'Load reversed', orderId: a.id, orderNumber: a.number }))
      return { ok: false, error: r.error }
    }
    done.push({ productId: l.productId, qty: l.loadedQty })
  }
  return { ok: true, patch: { loadedAt: new Date().toISOString() } }
}

/** Settle: unsold stock returns to the hub, cash expected from cash sales vs cash deposited. Creates the settlement record. */
export const settleVan = (a, { cashDeposited }, user) => {
  const stock = vanStock(a)
  const returned = []
  for (const s of stock) {
    if (s.onVan <= 0) continue
    const r = postStockMovement({ productId: s.productId, hubId: a.hubId, type: MT.VAN_RETURN, quantity: s.onVan, reference: a.number, notes: `Unsold van stock returned at settlement (${a.number})`, orderId: a.id, orderNumber: a.number })
    if (!r.ok) return { ok: false, error: r.error }
    returned.push({ productId: s.productId, quantity: s.onVan })
  }
  const sales = salesForAssignment(a.id)
  const expectedCash = Math.round(sales.filter((s) => s.paymentMode === 'Cash').reduce((x, s) => x + Number(s.total || 0), 0) * 100) / 100
  const deposited = Number(cashDeposited) || 0
  const st = createRecord('van_settlements', {
    assignmentId: a.id, salesExecId: a.salesExecId, hubId: a.hubId, routeDate: a.routeDate,
    salesCount: sales.length, salesValue: Math.round(sales.reduce((x, s) => x + Number(s.total || 0), 0) * 100) / 100, expectedCash, cashDeposited: deposited, variance: Math.round((deposited - expectedCash) * 100) / 100,
    returnedLines: returned,
  }, user, { system: true })
  if (!st.ok) return st
  return { ok: true, patch: { settledAt: new Date().toISOString(), settlementId: st.record.id, settlementNumber: st.record.number, returnedLines: returned } }
}
