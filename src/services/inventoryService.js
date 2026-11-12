/**
 * Hub-wise inventory, stock documents and the movement ledger.
 *
 * Every stock-changing operation:
 *  1. re-reads current storage (never trusts stale UI state),
 *  2. validates against live quantities,
 *  3. writes stock + document + movements in ONE storage transaction (rolled back on failure),
 *  4. logs activity and raises a low-stock notification when a line drops to Low/Out.
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { logActivity, currentUserId } from './activityService'
import { pushNotification } from './notificationService'
import { STORAGE_KEYS } from '../utils/constants'
import { uid } from '../utils/helpers'
import { getAvailable, getStockStatus, isLowOrOut } from '../utils/stock'
import { ADJUSTMENT_REASONS, ADJUSTMENT_TYPES, MOVEMENT_TYPES as MT, STOCK_STATUS, TRANSFER_STATUS as TS } from '../config/masterData'
import { ROLES } from '../config/roles'
import { DECIMAL_UNITS } from './productService'
import { isIsoDate, nextNumber, num, required } from './validation'

const K = STORAGE_KEYS
const read = (key) => storage.getItem(key, []) || []

export const getInventory = () => read(K.INVENTORY)
export const getStockReceipts = () => read(K.STOCK_RECEIPTS)
export const getStockTransfers = () => read(K.STOCK_TRANSFERS)
export const getStockAdjustments = () => read(K.STOCK_ADJUSTMENTS)
export const getStockMovements = () => read(K.STOCK_MOVEMENTS)

const round = (n) => Math.round(n * 1000) / 1000

/* ------------------------------------------------------------------ */
/* Read models                                                         */
/* ------------------------------------------------------------------ */

/**
 * Stock rows joined with product + hub for display. Pass collections from hooks to stay reactive.
 */
export const buildStockRows = (inventory, products, hubs) => {
  const P = Object.fromEntries(products.map((p) => [p.id, p]))
  const H = Object.fromEntries(hubs.map((h) => [h.id, h]))
  return inventory.map((r) => {
    const product = P[r.productId] || null
    const hub = H[r.hubId] || null
    const available = round(getAvailable(r))
    return {
      ...r,
      product,
      hub,
      productCode: product?.code ?? '—',
      productName: product?.name ?? 'Deleted product',
      category: product?.category ?? '—',
      unit: product?.unit ?? '',
      hubName: hub?.name ?? 'Deleted hub',
      hubCode: hub?.code ?? '—',
      available,
      status: getStockStatus(r),
      value: (r.totalQuantity || 0) * (product?.purchasePrice || 0),
    }
  })
}

export const getStockRows = () => buildStockRows(getInventory(), read(K.PRODUCTS), read(K.HUBS))
export const getStockByProduct = (productId, rows = getStockRows()) => rows.filter((r) => r.productId === productId)
export const getStockByHub = (hubId, rows = getStockRows()) => rows.filter((r) => r.hubId === hubId)
export const getLowStockProducts = (rows = getStockRows()) =>
  rows.filter((r) => r.status === STOCK_STATUS.LOW || r.status === STOCK_STATUS.OUT).sort((a, b) => a.available - b.available)

/** KPI summary for the inventory dashboard. */
export const getStockSummary = (rows, products, hubs) => {
  const tracked = products.filter((p) => p.trackInventory)
  const lowProducts = new Set(rows.filter((r) => r.status === STOCK_STATUS.LOW).map((r) => r.productId))
  const outProducts = new Set(rows.filter((r) => r.status === STOCK_STATUS.OUT).map((r) => r.productId))
  return {
    totalProducts: products.length,
    trackedProducts: tracked.length,
    totalQuantity: rows.reduce((s, r) => s + (r.totalQuantity || 0), 0),
    availableQuantity: rows.reduce((s, r) => s + Math.max(0, r.available), 0),
    totalValue: rows.reduce((s, r) => s + r.value, 0),
    lowStockProducts: lowProducts.size,
    lowStockLines: rows.filter((r) => r.status === STOCK_STATUS.LOW).length,
    outOfStockProducts: outProducts.size,
    outOfStockLines: rows.filter((r) => r.status === STOCK_STATUS.OUT).length,
    overstockLines: rows.filter((r) => r.status === STOCK_STATUS.OVER).length,
    activeHubs: hubs.filter((h) => h.status === 'Active').length,
    totalHubs: hubs.length,
  }
}

/** Per-hub totals: products carried, quantity, value, low-stock count. */
export const getHubStockSummary = (rows, hubs) =>
  hubs.map((h) => {
    const hr = rows.filter((r) => r.hubId === h.id)
    return {
      id: h.id,
      hub: h,
      name: h.name,
      city: h.city,
      status: h.status,
      products: hr.filter((r) => r.totalQuantity > 0).length,
      lines: hr.length,
      quantity: hr.reduce((s, r) => s + r.totalQuantity, 0),
      available: hr.reduce((s, r) => s + Math.max(0, r.available), 0),
      reserved: hr.reduce((s, r) => s + (r.reservedQuantity || 0), 0),
      damaged: hr.reduce((s, r) => s + (r.damagedQuantity || 0), 0),
      value: hr.reduce((s, r) => s + r.value, 0),
      low: hr.filter((r) => r.status === STOCK_STATUS.LOW).length,
      out: hr.filter((r) => r.status === STOCK_STATUS.OUT).length,
    }
  })

export const filterStockRows = (rows, q = '', f = {}) => {
  const query = q.trim().toLowerCase()
  return rows.filter((r) => {
    if (query && ![r.productName, r.productCode, r.product?.sku, r.hubName, r.category].some((v) => String(v || '').toLowerCase().includes(query))) return false
    if (f.productId && r.productId !== f.productId) return false
    if (f.hubId && r.hubId !== f.hubId) return false
    if (f.category && r.category !== f.category) return false
    if (f.status && r.status !== f.status) return false
    return true
  })
}

export const filterMovements = (movements, q = '', f = {}, lookups = {}) => {
  const query = q.trim().toLowerCase()
  const from = f.from ? dayjs(f.from).startOf('day') : null
  const to = f.to ? dayjs(f.to).endOf('day') : null
  return movements.filter((m) => {
    if (query) {
      const p = lookups.products?.[m.productId]
      const h = lookups.hubs?.[m.hubId]
      if (![m.movementNumber, m.referenceNumber, m.notes, p?.name, p?.code, h?.name].some((v) => String(v || '').toLowerCase().includes(query))) return false
    }
    if (f.hubId && m.hubId !== f.hubId) return false
    if (f.productId && m.productId !== f.productId) return false
    if (f.type && m.movementType !== f.type) return false
    if (from && dayjs(m.date).isBefore(from)) return false
    if (to && dayjs(m.date).isAfter(to)) return false
    return true
  })
}

/** Signed effect of a movement on available quantity (for display). */
export const movementSign = (m) => ([MT.RECEIPT, MT.TRANSFER_IN, MT.ADJ_INCREASE, MT.DISPATCH_REVERSAL, MT.DELIVERY_RETURN, MT.VAN_RETURN, MT.SALES_RETURN].includes(m.movementType) ? 1 : -1)

/* ------------------------------------------------------------------ */
/* Shared validation helpers                                           */
/* ------------------------------------------------------------------ */

const validateQuantity = (value, product) => {
  const q = num(value)
  if (Number.isNaN(q)) return 'Quantity is required.'
  if (q <= 0) return 'Quantity must be greater than zero.'
  if (product && !DECIMAL_UNITS.includes(product.unit) && !Number.isInteger(q)) return `Quantity must be a whole number of ${product.unit}.`
  if (q > 1000000) return 'Quantity is too large.'
  return null
}

const validateProductForStock = (product) => {
  if (!product) return 'Select a product.'
  if (!product.trackInventory) return `${product.name} does not track inventory.`
  if (product.status !== 'Active') return `${product.name} is ${product.status.toLowerCase()} and cannot be stocked.`
  return null
}

const validateDate = (value, label) => {
  if (!value) return `${label} is required.`
  if (!isIsoDate(value)) return 'Enter a valid date.'
  if (dayjs(value).isAfter(dayjs(), 'day')) return `${label} cannot be in the future.`
  return null
}

const newStockRecord = (product, hub) => ({
  id: `stk-${hub.code}-${product.code}-${uid('').slice(-4)}`,
  productId: product.id,
  hubId: hub.id,
  totalQuantity: 0,
  reservedQuantity: 0,
  damagedQuantity: 0,
  minimumStock: product.minStockLevel || 0,
  reorderLevel: product.reorderLevel || 0,
  maximumStock: product.maxStockLevel || 0,
  lastUpdated: new Date().toISOString(),
})

/** Context with fresh copies of everything an operation touches. */
const loadContext = () => {
  const products = read(K.PRODUCTS)
  const hubs = read(K.HUBS)
  return {
    products,
    hubs,
    P: Object.fromEntries(products.map((p) => [p.id, p])),
    H: Object.fromEntries(hubs.map((h) => [h.id, h])),
    inventory: read(K.INVENTORY).map((r) => ({ ...r })),
    movements: read(K.STOCK_MOVEMENTS),
  }
}

const findOrCreate = (ctx, product, hub) => {
  let rec = ctx.inventory.find((r) => r.productId === product.id && r.hubId === hub.id)
  if (!rec) {
    rec = newStockRecord(product, hub)
    ctx.inventory.push(rec)
  }
  return rec
}

/** Apply a delta to a stock record and return the movement row. */
const applyMovement = (ctx, rec, { type, quantity, dTotal = 0, dDamaged = 0, reference, notes, date }) => {
  const before = { total: rec.totalQuantity, available: getAvailable(rec) }
  rec.totalQuantity = round(rec.totalQuantity + dTotal)
  rec.damagedQuantity = round((rec.damagedQuantity || 0) + dDamaged)
  rec.lastUpdated = new Date().toISOString()
  const seq = ctx.movements.length + ctx.pending.length
  const movement = {
    id: uid('mov'),
    movementNumber: nextNumber('MOV', [...ctx.movements, ...ctx.pending].map((m) => m.movementNumber), 5),
    date: date || new Date().toISOString(),
    productId: rec.productId,
    hubId: rec.hubId,
    movementType: type,
    quantity,
    previousQuantity: before.total,
    newQuantity: rec.totalQuantity,
    previousAvailable: round(before.available),
    newAvailable: round(getAvailable(rec)),
    referenceNumber: reference,
    createdBy: currentUserId(),
    notes: notes || '',
    seq,
  }
  ctx.pending.push(movement)
  return { before, movement }
}

/** Timestamp for a document dated `dateStr`: now if today, else midday on that date. */
const documentTimestamp = (dateStr) => (dayjs(dateStr).isSame(dayjs(), 'day') ? new Date().toISOString() : dayjs(dateStr).hour(12).toISOString())

const alertIfLow = (ctx, recs) => {
  recs.forEach(({ rec, wasLow }) => {
    if (!wasLow && isLowOrOut(rec)) {
      const p = ctx.P[rec.productId]
      const h = ctx.H[rec.hubId]
      const out = getAvailable(rec) <= 0
      pushNotification({
        title: out ? `Out of stock: ${p?.name}` : `Low stock: ${p?.name}`,
        message: `${h?.name} now has ${round(getAvailable(rec))} ${p?.unit || ''} available (reorder level ${rec.reorderLevel}).`,
        type: out ? 'danger' : 'warning',
        roles: [ROLES.ADMIN, ROLES.DISPATCHER],
        link: '/inventory/low-stock',
      })
    }
  })
}

const commit = (ctx, documentKey, documents) => {
  const movements = [...ctx.pending.map(({ seq: _s, ...m }) => m).reverse(), ...ctx.movements]
  const writes = [[K.INVENTORY, ctx.inventory], [K.STOCK_MOVEMENTS, movements]]
  if (documentKey) writes.push([documentKey, documents])
  return storage.transaction(writes)
}

/* ------------------------------------------------------------------ */
/* Stock receipts                                                      */
/* ------------------------------------------------------------------ */

export const nextReceiptNumber = () => nextNumber('GRN', getStockReceipts().map((r) => r.receiptNumber))

export const validateReceipt = (input) => {
  const ctx = loadContext()
  const e = {}
  const hub = ctx.H[input.hubId]
  const product = ctx.P[input.productId]
  if (!hub) e.hubId = 'Select a hub.'
  else if (hub.status !== 'Active') e.hubId = `${hub.name} is inactive and cannot receive stock.`
  const pErr = validateProductForStock(product)
  if (pErr) e.productId = pErr
  const qErr = validateQuantity(input.quantity, product)
  if (qErr) e.quantity = qErr
  const dErr = validateDate(input.receiptDate, 'Receipt date')
  if (dErr) e.receiptDate = dErr
  if (input.referenceNumber && input.referenceNumber.length > 40) e.referenceNumber = 'Keep the reference under 40 characters.'
  return e
}

export const createStockReceipt = (input) => {
  const errors = validateReceipt(input)
  if (Object.keys(errors).length) return { ok: false, errors }
  const ctx = { ...loadContext(), pending: [] }
  const product = ctx.P[input.productId]
  const hub = ctx.H[input.hubId]
  const quantity = num(input.quantity)
  const receipts = getStockReceipts()
  const receiptNumber = nextNumber('GRN', receipts.map((r) => r.receiptNumber))
  const rec = findOrCreate(ctx, product, hub)
  applyMovement(ctx, rec, { type: MT.RECEIPT, quantity, dTotal: quantity, reference: receiptNumber, notes: input.notes, date: documentTimestamp(input.receiptDate) })
  const receipt = {
    id: uid('rcp'),
    receiptNumber,
    receiptDate: input.receiptDate,
    hubId: hub.id,
    productId: product.id,
    quantity,
    referenceNumber: (input.referenceNumber || '').trim(),
    notes: (input.notes || '').trim(),
    status: 'Completed',
    createdBy: currentUserId(),
    createdAt: new Date().toISOString(),
  }
  const res = commit(ctx, K.STOCK_RECEIPTS, [receipt, ...receipts])
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'STOCK', message: `received ${quantity} ${product.unit} of ${product.name} at ${hub.name} (${receiptNumber})`, entityType: 'product', entityId: product.id })
  return { ok: true, record: receipt, stock: rec }
}

/* ------------------------------------------------------------------ */
/* Stock transfers                                                     */
/* ------------------------------------------------------------------ */

export const nextTransferNumber = () => nextNumber('TRF', getStockTransfers().map((t) => t.transferNumber))

/** `forCompletion` adds the live stock check that must pass before stock moves. */
export const validateTransfer = (input, { forCompletion = false } = {}) => {
  const ctx = loadContext()
  const e = {}
  const src = ctx.H[input.sourceHubId]
  const dest = ctx.H[input.destinationHubId]
  const product = ctx.P[input.productId]
  if (!src) e.sourceHubId = 'Select the source hub.'
  if (!dest) e.destinationHubId = 'Select the destination hub.'
  else if (dest.status !== 'Active') e.destinationHubId = `${dest.name} is inactive and cannot receive stock.`
  if (src && dest && src.id === dest.id) e.destinationHubId = 'Source and destination hubs must be different.'
  const pErr = validateProductForStock(product)
  if (pErr) e.productId = pErr
  const qErr = validateQuantity(input.quantity, product)
  if (qErr) e.quantity = qErr
  const dErr = validateDate(input.transferDate, 'Transfer date')
  if (dErr) e.transferDate = dErr
  if (forCompletion && !e.quantity && !e.productId && src) {
    const rec = ctx.inventory.find((r) => r.productId === product.id && r.hubId === src.id)
    const available = rec ? getAvailable(rec) : 0
    if (num(input.quantity) > available) e.quantity = `Only ${round(Math.max(0, available))} ${product.unit} available at ${src.name}.`
  }
  return e
}

const transferRecord = (input, existing) => ({
  ...(existing || {}),
  transferDate: input.transferDate,
  sourceHubId: input.sourceHubId,
  destinationHubId: input.destinationHubId,
  productId: input.productId,
  quantity: num(input.quantity),
  notes: (input.notes || '').trim(),
})

/** Apply a transfer's stock movement. Caller guarantees the transfer is still a Draft. */
const applyTransfer = (transfer) => {
  const errors = validateTransfer(transfer, { forCompletion: true })
  if (Object.keys(errors).length) return { ok: false, errors }
  const ctx = { ...loadContext(), pending: [] }
  const product = ctx.P[transfer.productId]
  const src = ctx.H[transfer.sourceHubId]
  const dest = ctx.H[transfer.destinationHubId]
  const srcRec = findOrCreate(ctx, product, src)
  const destRec = findOrCreate(ctx, product, dest)
  const wasLow = isLowOrOut(srcRec)
  const date = new Date().toISOString()
  applyMovement(ctx, srcRec, { type: MT.TRANSFER_OUT, quantity: transfer.quantity, dTotal: -transfer.quantity, reference: transfer.transferNumber, notes: `To ${dest.name}. ${transfer.notes || ''}`.trim(), date })
  applyMovement(ctx, destRec, { type: MT.TRANSFER_IN, quantity: transfer.quantity, dTotal: transfer.quantity, reference: transfer.transferNumber, notes: `From ${src.name}. ${transfer.notes || ''}`.trim(), date })
  return { ok: true, ctx, product, src, dest, srcRec, wasLow }
}

/**
 * Create a transfer. complete=false saves a Draft (no stock change);
 * complete=true validates stock and moves it immediately.
 */
export const createStockTransfer = (input, { complete = false } = {}) => {
  const errors = validateTransfer(input, { forCompletion: complete })
  if (Object.keys(errors).length) return { ok: false, errors }
  const transfers = getStockTransfers()
  const now = new Date().toISOString()
  const transfer = {
    id: uid('trf'),
    transferNumber: nextNumber('TRF', transfers.map((t) => t.transferNumber)),
    ...transferRecord(input),
    status: TS.DRAFT,
    createdBy: currentUserId(),
    createdAt: now,
    completedAt: null,
    cancelledAt: null,
  }
  if (!complete) {
    const res = storage.setItem(K.STOCK_TRANSFERS, [transfer, ...transfers])
    if (!res.ok) return { ok: false, errors: { form: res.error } }
    logActivity({ type: 'STOCK', message: `saved draft transfer ${transfer.transferNumber}`, entityType: 'transfer', entityId: transfer.id })
    return { ok: true, record: transfer }
  }
  const applied = applyTransfer(transfer)
  if (!applied.ok) return applied
  const done = { ...transfer, status: TS.COMPLETED, completedAt: now }
  const res = commit(applied.ctx, K.STOCK_TRANSFERS, [done, ...transfers])
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'STOCK', message: `transferred ${done.quantity} ${applied.product.unit} of ${applied.product.name} from ${applied.src.name} to ${applied.dest.name} (${done.transferNumber})`, entityType: 'product', entityId: done.productId })
  alertIfLow(applied.ctx, [{ rec: applied.srcRec, wasLow: applied.wasLow }])
  return { ok: true, record: done }
}

export const updateDraftTransfer = (id, input) => {
  const transfers = getStockTransfers()
  const existing = transfers.find((t) => t.id === id)
  if (!existing) return { ok: false, errors: { form: 'This transfer no longer exists.' } }
  if (existing.status !== TS.DRAFT) return { ok: false, errors: { form: `Only draft transfers can be edited. This transfer is ${existing.status.toLowerCase()}.` } }
  const errors = validateTransfer(input)
  if (Object.keys(errors).length) return { ok: false, errors }
  const updated = { ...transferRecord(input, existing), updatedAt: new Date().toISOString() }
  const res = storage.setItem(K.STOCK_TRANSFERS, transfers.map((t) => (t.id === id ? updated : t)))
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  return { ok: true, record: updated }
}

/** Complete a draft. Re-reads the transfer so a second click can never apply stock twice. */
export const completeTransfer = (id) => {
  const transfers = getStockTransfers()
  const transfer = transfers.find((t) => t.id === id)
  if (!transfer) return { ok: false, error: 'This transfer no longer exists.' }
  if (transfer.status !== TS.DRAFT) return { ok: false, error: `${transfer.transferNumber} is already ${transfer.status.toLowerCase()} — stock was not changed again.` }
  const applied = applyTransfer(transfer)
  if (!applied.ok) return { ok: false, error: Object.values(applied.errors).join(' '), errors: applied.errors }
  const done = { ...transfer, status: TS.COMPLETED, completedAt: new Date().toISOString() }
  const res = commit(applied.ctx, K.STOCK_TRANSFERS, transfers.map((t) => (t.id === id ? done : t)))
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'STOCK', message: `completed transfer ${done.transferNumber}: ${done.quantity} ${applied.product.unit} of ${applied.product.name} to ${applied.dest.name}`, entityType: 'product', entityId: done.productId })
  alertIfLow(applied.ctx, [{ rec: applied.srcRec, wasLow: applied.wasLow }])
  return { ok: true, record: done }
}

/** Cancel a draft. Completed transfers are final (reverse with a new transfer). */
export const cancelTransfer = (id) => {
  const transfers = getStockTransfers()
  const transfer = transfers.find((t) => t.id === id)
  if (!transfer) return { ok: false, error: 'This transfer no longer exists.' }
  if (transfer.status !== TS.DRAFT) return { ok: false, error: `Only draft transfers can be cancelled. ${transfer.transferNumber} is ${transfer.status.toLowerCase()}.` }
  const done = { ...transfer, status: TS.CANCELLED, cancelledAt: new Date().toISOString() }
  const res = storage.setItem(K.STOCK_TRANSFERS, transfers.map((t) => (t.id === id ? done : t)))
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'STOCK', message: `cancelled transfer ${done.transferNumber} (no stock moved)`, entityType: 'transfer', entityId: id })
  return { ok: true, record: done }
}

/* ------------------------------------------------------------------ */
/* Stock adjustments                                                   */
/* ------------------------------------------------------------------ */

export const nextAdjustmentNumber = () => nextNumber('ADJ', getStockAdjustments().map((a) => a.adjustmentNumber))

/** Resolve the effect of an adjustment: movement type and deltas. */
export const adjustmentEffect = (type, direction, q) => {
  switch (type) {
    case 'Increase': return { movementType: MT.ADJ_INCREASE, dTotal: q, dDamaged: 0, reducesAvailable: false }
    case 'Decrease': return { movementType: MT.ADJ_DECREASE, dTotal: -q, dDamaged: 0, reducesAvailable: true }
    case 'Lost': return { movementType: MT.LOST, dTotal: -q, dDamaged: 0, reducesAvailable: true }
    case 'Damaged': return { movementType: MT.DAMAGE, dTotal: 0, dDamaged: q, reducesAvailable: true }
    case 'Correction':
      return direction === 'increase'
        ? { movementType: MT.ADJ_INCREASE, dTotal: q, dDamaged: 0, reducesAvailable: false }
        : { movementType: MT.ADJ_DECREASE, dTotal: -q, dDamaged: 0, reducesAvailable: true }
    default: return null
  }
}

export const validateAdjustment = (input) => {
  const ctx = loadContext()
  const e = {}
  const hub = ctx.H[input.hubId]
  const product = ctx.P[input.productId]
  if (!hub) e.hubId = 'Select a hub.'
  if (!product) e.productId = 'Select a product.'
  else if (!product.trackInventory) e.productId = `${product.name} does not track inventory.`
  if (!ADJUSTMENT_TYPES.includes(input.type)) e.type = 'Choose an adjustment type.'
  if (input.type === 'Correction' && !['increase', 'decrease'].includes(input.direction)) e.direction = 'Choose whether the correction adds or removes stock.'
  const qErr = validateQuantity(input.quantity, product)
  if (qErr) e.quantity = qErr
  if (!ADJUSTMENT_REASONS.includes(input.reason)) e.reason = 'Every adjustment needs a reason.'
  if (input.reason === 'Other') {
    const r = required(input.notes, 'Notes')
    if (r) e.notes = 'Describe the reason when “Other” is selected.'
  }
  const dErr = validateDate(input.adjustmentDate, 'Adjustment date')
  if (dErr) e.adjustmentDate = dErr

  if (hub && product && !e.quantity && !e.type && !e.direction) {
    const effect = adjustmentEffect(input.type, input.direction, num(input.quantity))
    const rec = ctx.inventory.find((r) => r.productId === product.id && r.hubId === hub.id)
    const available = rec ? getAvailable(rec) : 0
    if (effect.reducesAvailable) {
      if (!rec) e.quantity = `${product.name} has no stock at ${hub.name}.`
      else if (input.type === 'Damaged' && num(input.quantity) > available) e.quantity = `Cannot mark more than the ${round(Math.max(0, available))} ${product.unit} available as damaged.`
      else if (num(input.quantity) > available && !product.allowNegativeStock) e.quantity = `Cannot remove more than the ${round(Math.max(0, available))} ${product.unit} available. This product does not allow negative stock.`
    } else if (hub.status !== 'Active') e.hubId = `${hub.name} is inactive — stock can only be reduced there.`
  }
  return e
}

export const createStockAdjustment = (input) => {
  const errors = validateAdjustment(input)
  if (Object.keys(errors).length) return { ok: false, errors }
  const ctx = { ...loadContext(), pending: [] }
  const product = ctx.P[input.productId]
  const hub = ctx.H[input.hubId]
  const quantity = num(input.quantity)
  const adjustments = getStockAdjustments()
  const adjustmentNumber = nextNumber('ADJ', adjustments.map((a) => a.adjustmentNumber))
  const effect = adjustmentEffect(input.type, input.direction, quantity)
  const rec = findOrCreate(ctx, product, hub)
  const wasLow = isLowOrOut(rec)
  applyMovement(ctx, rec, {
    type: effect.movementType, quantity, dTotal: effect.dTotal, dDamaged: effect.dDamaged,
    reference: adjustmentNumber, notes: `${input.reason}${input.notes ? ` — ${input.notes.trim()}` : ''}`, date: documentTimestamp(input.adjustmentDate),
  })
  const adjustment = {
    id: uid('adj'),
    adjustmentNumber,
    adjustmentDate: input.adjustmentDate,
    hubId: hub.id,
    productId: product.id,
    type: input.type,
    direction: input.type === 'Correction' ? input.direction : null,
    quantity,
    reason: input.reason,
    notes: (input.notes || '').trim(),
    createdBy: currentUserId(),
    createdAt: new Date().toISOString(),
  }
  const res = commit(ctx, K.STOCK_ADJUSTMENTS, [adjustment, ...adjustments])
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'STOCK', message: `adjusted ${product.name} at ${hub.name}: ${input.type.toLowerCase()} ${quantity} ${product.unit} (${adjustmentNumber})`, entityType: 'product', entityId: product.id })
  alertIfLow(ctx, [{ rec, wasLow }])
  return { ok: true, record: adjustment, stock: rec }
}

/* ------------------------------------------------------------------ */
/* Stock line settings (reorder level per hub)                          */
/* ------------------------------------------------------------------ */

export const updateStockLevels = (stockId, { minimumStock, reorderLevel, maximumStock }) => {
  const errors = {}
  const min = num(minimumStock)
  const reorder = num(reorderLevel)
  const max = num(maximumStock)
  if (Number.isNaN(min) || min < 0) errors.minimumStock = 'Minimum stock cannot be negative.'
  if (Number.isNaN(reorder) || reorder < 0) errors.reorderLevel = 'Reorder level cannot be negative.'
  if (!Number.isNaN(max) && max < 0) errors.maximumStock = 'Maximum stock cannot be negative.'
  if (!Number.isNaN(max) && max > 0 && reorder > max) errors.reorderLevel = 'Reorder level cannot exceed maximum stock.'
  if (Object.keys(errors).length) return { ok: false, errors }
  const inventory = getInventory()
  const rec = inventory.find((r) => r.id === stockId)
  if (!rec) return { ok: false, errors: { form: 'This stock line no longer exists.' } }
  const updated = { ...rec, minimumStock: min, reorderLevel: reorder, maximumStock: Number.isNaN(max) ? 0 : max, lastUpdated: new Date().toISOString() }
  const res = storage.setItem(K.INVENTORY, inventory.map((r) => (r.id === stockId ? updated : r)))
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'STOCK', message: `changed stock levels for ${stockId} (reorder ${reorder})`, entityType: 'product', entityId: rec.productId })
  return { ok: true, record: updated }
}

const inventoryService = {
  getInventory, getStockRows, getStockByProduct, getStockByHub, getStockSummary, getLowStockProducts, getHubStockSummary,
  createStockReceipt, createStockTransfer, completeTransfer, cancelTransfer, updateDraftTransfer, createStockAdjustment,
  getStockMovements, getStockReceipts, getStockTransfers, getStockAdjustments, updateStockLevels,
}
/**
 * Enterprise stock postings (van loading / unloading, approved sales returns) through the same ledger as every other
 * stock change: one inventory record per product × hub, one movement per change. Batch / expiry detail is derived
 * from these movements by batchService. Outbound postings never take stock below what is available.
 */
export const postStockMovement = ({ productId, hubId, type, quantity, reference, notes, orderId = null, orderNumber = null }) => {
  const ctx = { ...loadContext(), pending: [] }
  const product = ctx.P[productId]
  const hub = ctx.H[hubId]
  const q = num(quantity)
  if (!product || !hub) return { ok: false, error: 'Unknown product or hub.' }
  if (!(q > 0)) return { ok: false, error: 'Quantity must be greater than zero.' }
  const inbound = [MT.VAN_RETURN, MT.SALES_RETURN].includes(type)
  const rec = findOrCreate(ctx, product, hub)
  if (!inbound && q > getAvailable(rec) + 1e-9) return { ok: false, error: `Only ${round(Math.max(0, getAvailable(rec)))} ${product.unit} of ${product.name} available at ${hub.name}.` }
  const { movement } = applyMovement(ctx, rec, { type, quantity: q, dTotal: inbound ? q : -q, reference, notes })
  if (orderId) Object.assign(movement, { orderId, orderNumber })
  const res = commit(ctx)
  return res.ok ? { ok: true, movement } : { ok: false, error: res.error }
}

export default inventoryService


/* ------------------------------------------------------------------ */
/* Scrap write-off (called only by scrapService for APPROVED requests)  */
/* ------------------------------------------------------------------ */

/** Eligible quantity for a scrap source: 'available' (on hand − reserved − damaged) or 'damaged' (quarantined). */
export const scrapEligibleQuantity = (rec, source) => {
  if (!rec) return 0
  return round(Math.max(0, source === 'damaged' ? Number(rec.damagedQuantity) || 0 : getAvailable(rec)))
}

/**
 * Reduce stock for an approved scrap request and write the Scrap Write-off movement, in one transaction together
 * with the updated scrap documents (buildDocuments receives the movement and returns the new scrap list).
 * Never allows negative stock or more than the eligible quantity.
 */
export const postScrapWriteOff = ({ productId, hubId, quantity, source, reference, notes }, buildDocuments) => {
  const ctx = { ...loadContext(), pending: [] }
  const product = ctx.P[productId]
  const hub = ctx.H[hubId]
  if (!product || !hub) return { ok: false, error: 'The product or hub no longer exists.' }
  const rec = ctx.inventory.find((r) => r.productId === productId && r.hubId === hubId)
  const q = round(Number(quantity))
  const eligible = scrapEligibleQuantity(rec, source)
  if (!rec) return { ok: false, error: `${product.name} has no stock at ${hub.name}.` }
  if (!(q > 0)) return { ok: false, error: 'Write-off quantity must be greater than zero.' }
  if (q > eligible) return { ok: false, error: `Only ${eligible} ${product.unit} ${source === 'damaged' ? 'damaged (quarantined)' : 'available'} at ${hub.name} — the write-off of ${q} would exceed it.` }
  if (round(rec.totalQuantity - q) < 0) return { ok: false, error: 'The write-off would make stock negative.' }
  const wasLow = isLowOrOut(rec)
  const { movement } = applyMovement(ctx, rec, {
    type: MT.SCRAP, quantity: q, dTotal: -q, dDamaged: source === 'damaged' ? -q : 0, reference, notes,
  })
  const documents = buildDocuments(movement)
  const res = commit(ctx, K.SCRAP_REQUESTS, documents)
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'STOCK', message: `wrote off ${q} ${product.unit} of ${product.name} at ${hub.name} (${reference})`, entityType: 'product', entityId: product.id })
  alertIfLow(ctx, [{ rec, wasLow }])
  const { seq: _s, ...m } = movement
  return { ok: true, movement: m, stock: rec }
}
