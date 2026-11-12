/**
 * Batch / lot layer of the single stock ledger.
 *
 * Quantities live in ONE place: bellomassi_inventory (product × hub totals) + bellomassi_stock_movements (ledger).
 * This service derives lot detail (batch, lot, expiry, bin, QA status) by replaying every new ledger movement:
 *   • inbound movements create lots — goods receipts carry the batch / expiry / QA-hold captured on the GRN;
 *     delivery returns and dispatch reversals go back to the lots the order consumed;
 *   • outbound movements consume lots FEFO (first-expiry-first-out) from AVAILABLE, unexpired lots and record which
 *     order / document took which lot — that is the batch traceability used by recalls.
 * Stock in lots that are QA_HOLD, QUARANTINE, REJECTED or expired is written to inventory.qaHoldQuantity, which
 * getAvailable() subtracts — so blocked stock cannot be ordered, picked or dispatched anywhere in the app.
 * Invariant: Σ lot quantity per product × hub = inventory.totalQuantity (checked by reconcile()).
 */
import dayjs from 'dayjs'
import storage from '../storageService'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { MOVEMENT_TYPES as MT } from '../../config/masterData'
import { getCurrentUser } from '../authService'
import { can } from '../../config/permissions'
import { logAudit } from '../auditService'
import { uid } from '../../utils/helpers'

const read = (k, f = []) => storage.getItem(k, f) ?? f
const round = (n) => Math.round((Number(n) || 0) * 1000) / 1000
export const QA_STATUS = {
  AVAILABLE: { label: 'Available', tone: 'success' },
  QA_HOLD: { label: 'QA hold', tone: 'warning' },
  QUARANTINE: { label: 'Quarantine', tone: 'danger' },
  REJECTED: { label: 'QA rejected', tone: 'danger' },
}
const INBOUND = [MT.RECEIPT, MT.TRANSFER_IN, MT.ADJ_INCREASE, MT.DISPATCH_REVERSAL, MT.DELIVERY_RETURN, MT.VAN_RETURN, MT.SALES_RETURN]

export const isExpired = (b, today = dayjs()) => Boolean(b.expiryDate) && dayjs(b.expiryDate).isBefore(today, 'day')
export const isBlocked = (b, today = dayjs()) => b.qaStatus !== 'AVAILABLE' || isExpired(b, today)
export const daysToExpiry = (b, today = dayjs()) => (b.expiryDate ? dayjs(b.expiryDate).startOf('day').diff(today.startOf('day'), 'day') : null)
export const expiryBand = (b) => {
  const d = daysToExpiry(b)
  if (d === null) return { label: 'No expiry', tone: 'neutral' }
  if (d < 0) return { label: 'Expired', tone: 'danger' }
  if (d <= 7) return { label: `${d} d left`, tone: 'danger' }
  if (d <= 30) return { label: `${d} d left`, tone: 'warning' }
  return { label: `${d} d left`, tone: 'success' }
}

export const getBatches = () => read(K.BATCHES)
export const getLedgerState = () => read(K.BATCH_LEDGER_STATE, null) || { processedIds: [], unmatched: [], syncedAt: null }

/** FEFO (default) or FIFO ordering of lots. */
const order = (rule) => (a, b) => {
  if (rule === 'FIFO') return String(a.receivedAt || '').localeCompare(String(b.receivedAt || ''))
  const ea = a.expiryDate || '9999-12-31'
  const eb = b.expiryDate || '9999-12-31'
  return ea === eb ? String(a.receivedAt || '').localeCompare(String(b.receivedAt || '')) : ea.localeCompare(eb)
}
export const pickingRule = () => read(K.ENTERPRISE_SETTINGS, {})?.warehouse?.pickingRule || 'FEFO'

const nextLotNumber = (batches, productCode = 'LOT') => {
  const year = dayjs().format('YY')
  const n = batches.filter((b) => String(b.batchNumber).startsWith(`LT${year}`)).length + 1
  return `LT${year}-${productCode.replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase()}-${String(n).padStart(4, '0')}`
}

/* ---------- Replay ledger movements into lots ---------- */
const grnDetailsFor = (movement, receipts, grns) => {
  if (movement.movementType !== MT.RECEIPT) return null
  const rcp = receipts.find((r) => r.receiptNumber === movement.referenceNumber)
  const grnNo = rcp?.referenceNumber
  const grn = grnNo && grns.find((g) => g.number === grnNo)
  const line = grn?.lines?.find((l) => l.receiptNumber === movement.referenceNumber) || grn?.lines?.find((l) => l.productId === movement.productId)
  return grn && line ? { grn, line } : null
}

export const syncBatches = () => storage.withoutWriteHooks(() => {
  const movements = read(K.STOCK_MOVEMENTS)
  const state = getLedgerState()
  const done = new Set(state.processedIds || [])
  const fresh = movements.filter((m) => !done.has(m.id))
  if (!fresh.length) return refreshHoldQuantities()
  const batches = getBatches().map((b) => ({ ...b, consumption: [...(b.consumption || [])] }))
  const products = Object.fromEntries(read(K.PRODUCTS).map((p) => [p.id, p]))
  const receipts = read(K.STOCK_RECEIPTS)
  const grns = read(K.GOODS_RECEIPTS)
  const transferPool = { ...(state.transferPool || {}) }
  const unmatched = [...(state.unmatched || [])]
  const rule = pickingRule()
  fresh.sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.movementNumber || '').localeCompare(b.movementNumber || ''))
  for (const m of fresh) {
    const qty = round(m.quantity)
    const p = products[m.productId]
    if (!(qty > 0)) { done.add(m.id); continue }
    if (m.movementType === MT.DAMAGE) { done.add(m.id); continue } // damaged stays on hand (tracked as damagedQuantity)
    if (INBOUND.includes(m.movementType)) {
      let remaining = qty
      // Returns go back into the lots the order consumed
      if ([MT.DELIVERY_RETURN, MT.DISPATCH_REVERSAL, MT.VAN_RETURN, MT.SALES_RETURN].includes(m.movementType) && m.orderId) {
        for (const b of batches.filter((x) => x.productId === m.productId && x.hubId === m.hubId)) {
          const used = b.consumption.filter((c) => c.orderId === m.orderId).reduce((s, c) => s + c.qty, 0)
          if (used <= 0 || remaining <= 0) continue
          const back = Math.min(used, remaining)
          b.quantity = round(b.quantity + back)
          b.consumption.push({ movementId: m.id, movementNumber: m.movementNumber, type: m.movementType, orderId: m.orderId, orderNumber: m.orderNumber, qty: -back, at: m.date })
          remaining = round(remaining - back)
        }
      }
      // Transfers carry their lots across hubs
      if (m.movementType === MT.TRANSFER_IN && transferPool[m.referenceNumber]?.length) {
        const pool = transferPool[m.referenceNumber]
        while (remaining > 0 && pool.length) {
          const src = pool[0]
          const take = Math.min(src.qty, remaining)
          batches.push({ ...src.lot, id: uid('bat'), hubId: m.hubId, locationId: null, quantity: take, receivedAt: m.date, sourceMovement: m.movementNumber, consumption: [], createdAt: new Date().toISOString() })
          src.qty = round(src.qty - take)
          remaining = round(remaining - take)
          if (src.qty <= 0) pool.shift()
        }
        if (!pool.length) delete transferPool[m.referenceNumber]
      }
      if (remaining > 0) {
        const g = grnDetailsFor(m, receipts, grns)
        batches.push({
          id: uid('bat'),
          batchNumber: g?.line?.batchNumber || nextLotNumber(batches, p?.code),
          lotNumber: g?.line?.lotNumber || '',
          productId: m.productId,
          hubId: m.hubId,
          locationId: g?.line?.locationId || null,
          quantity: remaining,
          receivedQuantity: remaining,
          mfgDate: g?.line?.mfgDate || null,
          expiryDate: g?.line?.expiryDate || null,
          supplierBatch: g?.line?.supplierBatch || '',
          originCountry: g?.line?.originCountry || '',
          supplierId: g?.grn?.supplierId || null,
          grnId: g?.grn?.id || null,
          grnNumber: g?.grn?.number || null,
          sourceMovement: m.movementNumber,
          sourceType: m.movementType,
          qaStatus: g?.line?.qaRequired || g?.grn?.qaRequired ? 'QA_HOLD' : 'AVAILABLE',
          receivedAt: m.date,
          consumption: [],
          createdAt: new Date().toISOString(),
        })
      }
    } else {
      // Outbound: FEFO / FIFO from available, unexpired lots first; then any lot (keeps totals consistent)
      let remaining = qty
      const lots = batches.filter((b) => b.productId === m.productId && b.hubId === m.hubId && b.quantity > 0)
      const usable = lots.filter((b) => !isBlocked(b)).sort(order(rule))
      const rest = lots.filter((b) => isBlocked(b)).sort(order(rule))
      const takenForTransfer = []
      for (const b of [...usable, ...rest]) {
        if (remaining <= 0) break
        const take = Math.min(b.quantity, remaining)
        b.quantity = round(b.quantity - take)
        b.consumption.push({ movementId: m.id, movementNumber: m.movementNumber, type: m.movementType, reference: m.referenceNumber, orderId: m.orderId || null, orderNumber: m.orderNumber || null, qty: take, at: m.date })
        remaining = round(remaining - take)
        if (m.movementType === MT.TRANSFER_OUT) takenForTransfer.push({ qty: take, lot: { batchNumber: b.batchNumber, lotNumber: b.lotNumber, productId: b.productId, mfgDate: b.mfgDate, expiryDate: b.expiryDate, supplierBatch: b.supplierBatch, originCountry: b.originCountry, supplierId: b.supplierId, grnId: b.grnId, grnNumber: b.grnNumber, qaStatus: b.qaStatus, receivedQuantity: take } })
      }
      if (takenForTransfer.length) transferPool[m.referenceNumber] = [...(transferPool[m.referenceNumber] || []), ...takenForTransfer]
      if (remaining > 0) unmatched.push({ movementNumber: m.movementNumber, productId: m.productId, hubId: m.hubId, qty: remaining, at: m.date })
    }
    done.add(m.id)
  }
  storage.setItem(K.BATCHES, batches)
  storage.setItem(K.BATCH_LEDGER_STATE, { processedIds: [...done], unmatched: unmatched.slice(-200), transferPool, syncedAt: new Date().toISOString() })
  return refreshHoldQuantities(batches)
})

/** Write blocked lot quantities (QA hold, quarantine, rejected, expired) to inventory.qaHoldQuantity. */
export const refreshHoldQuantities = (batches = getBatches()) => {
  const today = dayjs()
  const held = {}
  batches.forEach((b) => { if (b.quantity > 0 && isBlocked(b, today)) held[`${b.productId}|${b.hubId}`] = round((held[`${b.productId}|${b.hubId}`] || 0) + b.quantity) })
  const inv = read(K.INVENTORY)
  let changed = false
  const next = inv.map((r) => {
    const h = held[`${r.productId}|${r.hubId}`] || 0
    if ((Number(r.qaHoldQuantity) || 0) === h) return r
    changed = true
    return { ...r, qaHoldQuantity: h }
  })
  if (changed) storage.withoutWriteHooks(() => storage.setItem(K.INVENTORY, next))
  return { ok: true, changed }
}

let installed = false
/** Keep lots in step with the ledger: replay after every movement write; refresh expiry blocks daily. */
export const installBatchSync = () => {
  if (installed) return
  installed = true
  storage.addWriteHook((key) => {
    if (key === K.STOCK_MOVEMENTS || key === K.GOODS_RECEIPTS) queueMicrotask(() => syncBatches())
  })
  syncBatches()
}

/* ---------- Queries ---------- */
export const lotsFor = (productId, hubId, batches = getBatches()) => batches.filter((b) => b.productId === productId && b.hubId === hubId && b.quantity > 0)

/** FEFO / FIFO allocation proposal for picking. Never proposes blocked or expired lots. */
export const allocate = (productId, hubId, quantity, rule = pickingRule()) => {
  let remaining = round(quantity)
  const out = []
  for (const b of lotsFor(productId, hubId).filter((x) => !isBlocked(x)).sort(order(rule))) {
    if (remaining <= 0) break
    const take = Math.min(b.quantity, remaining)
    out.push({ batchId: b.id, batchNumber: b.batchNumber, expiryDate: b.expiryDate, locationId: b.locationId, quantity: take })
    remaining = round(remaining - take)
  }
  return { lines: out, shortQuantity: remaining > 0 ? remaining : 0 }
}

/** Orders / customers that received stock from the given lots (via recorded consumption). */
export const traceBatches = (batchIds) => {
  const batches = getBatches().filter((b) => batchIds.includes(b.id))
  const orders = Object.fromEntries(read(K.ORDERS).map((o) => [o.id, o]))
  const map = {}
  batches.forEach((b) => b.consumption.forEach((c) => {
    if (!c.orderId) return
    const o = orders[c.orderId]
    const key = c.orderId
    map[key] ||= { orderId: c.orderId, orderNumber: c.orderNumber || o?.orderNumber, customerId: o?.customerId || null, quantity: 0, batches: new Set() }
    map[key].quantity = round(map[key].quantity + c.qty)
    map[key].batches.add(b.batchNumber)
  }))
  return Object.values(map).filter((x) => x.quantity > 0).map((x) => ({ ...x, batches: [...x.batches] }))
}

/* ---------- Status changes (QA, recall) ---------- */
const STATUS_PERMISSION = { AVAILABLE: 'qa.release', QA_HOLD: 'qa.inspection.manage', QUARANTINE: 'qa.inspection.manage', REJECTED: 'qa.reject' }

export const setBatchStatus = (batchIds, qaStatus, { reason = '', user = getCurrentUser(), source = 'QA' } = {}) => {
  const perm = STATUS_PERMISSION[qaStatus]
  if (!perm || !can(user, perm)) return { ok: false, error: `You do not have permission to set lots to ${QA_STATUS[qaStatus]?.label || qaStatus}.` }
  if (qaStatus === 'AVAILABLE' && !reason) return { ok: false, error: 'A release reason is required.' }
  const ids = new Set(batchIds)
  let n = 0
  const next = getBatches().map((b) => {
    if (!ids.has(b.id) || b.qaStatus === qaStatus) return b
    n += 1
    return { ...b, qaStatus, qaHistory: [...(b.qaHistory || []), { at: new Date().toISOString(), by: user?.name, from: b.qaStatus, to: qaStatus, reason, source }] }
  })
  storage.setItem(K.BATCHES, next)
  refreshHoldQuantities(next)
  logAudit({ action: qaStatus === 'AVAILABLE' ? 'APPROVAL' : qaStatus === 'REJECTED' ? 'REJECTION' : 'STATUS_CHANGE', module: 'qa', entity: 'Stock lot', recordLabel: `${n} lot(s)`, description: `${n} lot(s) set to ${QA_STATUS[qaStatus].label} (${source})${reason ? ` — ${reason}` : ''}.` })
  return { ok: true, count: n }
}

export const assignBin = (batchId, locationId, { user = getCurrentUser() } = {}) => {
  if (!can(user, 'warehouse.putaway.manage') && !can(user, 'inventory.batch.manage')) return { ok: false, error: 'You do not have permission to move stock between bins.' }
  const next = getBatches().map((b) => (b.id === batchId ? { ...b, locationId, putawayAt: new Date().toISOString() } : b))
  storage.setItem(K.BATCHES, next)
  return { ok: true }
}

/** Consistency check: lot totals vs inventory totals per product × hub. */
export const reconcile = () => {
  const sums = {}
  getBatches().forEach((b) => { sums[`${b.productId}|${b.hubId}`] = round((sums[`${b.productId}|${b.hubId}`] || 0) + b.quantity) })
  return read(K.INVENTORY).map((r) => ({ productId: r.productId, hubId: r.hubId, inventory: r.totalQuantity, lots: sums[`${r.productId}|${r.hubId}`] || 0 }))
    .filter((x) => Math.abs(x.inventory - x.lots) > 0.001)
}

