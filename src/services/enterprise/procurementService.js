/**
 * Procure-to-pay integration: purchase orders from requisitions or awarded quotes, goods receipt posting into the
 * single stock ledger (createStockReceipt — batch, expiry and QA hold are attached by batchService), put-away and
 * QA follow-ups, and the 3-way match (PO price × received quantity vs supplier invoice).
 */
import dayjs from 'dayjs'
import { can } from '../../config/permissions'
import { STORAGE_KEYS as K } from '../../utils/constants'
import storage from '../storageService'
import { createStockReceipt } from '../inventoryService'
import { createRecord, patchRecord, read } from './recordService'

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100
const products = () => Object.fromEntries(read(K.PRODUCTS).map((p) => [p.id, p]))

export const poLineValue = (l) => r2((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0))

export const createPoFromRequisition = (pr, supplierId, user) => {
  if (!supplierId) return { ok: false, error: 'Choose a supplier.' }
  const P = products()
  return createRecord('purchase_orders', {
    supplierId, hubId: pr.hubId, requisitionId: pr.id, orderDate: dayjs().format('YYYY-MM-DD'), expectedDate: pr.requiredBy, currency: 'Base currency', incoterm: 'DAP', paymentTerms: 'Net 30',
    lines: (pr.lines || []).map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.estimatedPrice || P[l.productId]?.purchasePrice || 0, taxPercent: 5, receivedQty: 0 })),
    notes: `From requisition ${pr.number}`,
  }, user)
}

export const createPoFromQuote = (quote, rfq, user) => createRecord('purchase_orders', {
  supplierId: quote.supplierId, hubId: rfq?.hubId || read(K.PURCHASE_REQUISITIONS).find((p) => p.id === rfq?.requisitionId)?.hubId || 'hub-che', requisitionId: rfq?.requisitionId || '', rfqId: rfq?.id || '', quoteId: quote.id,
  orderDate: dayjs().format('YYYY-MM-DD'), expectedDate: dayjs().add(Number(quote.leadTimeDays) || 7, 'day').format('YYYY-MM-DD'), currency: 'Base currency', incoterm: quote.incoterm || 'DAP', paymentTerms: quote.paymentTerms || 'Net 30',
  lines: (quote.lines || []).map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice, taxPercent: 5, receivedQty: 0 })),
  notes: `Awarded from ${rfq?.number || 'RFQ'} — quote ${quote.number}`,
}, user)

/** Remaining quantity per product on a PO. */
export const poRemaining = (po) => {
  const rem = {}
  ;(po?.lines || []).forEach((l) => { rem[l.productId] = r2((rem[l.productId] || 0) + (Number(l.quantity) || 0) - (Number(l.receivedQty) || 0)) })
  return rem
}

/** GRN line validation shared by the form and posting. */
export const validateGrnLines = (grn) => {
  const e = {}
  const P = products()
  const today = dayjs().format('YYYY-MM-DD')
  ;(grn.lines || []).forEach((l, i) => {
    const p = P[l.productId]
    const rec = Number(l.receivedQty) || 0
    const rej = Number(l.rejectedQty) || 0
    if (rej > rec) e[`lines.${i}.rejectedQty`] = `Line ${i + 1}: rejected cannot exceed received.`
    if (p && p.status !== 'Active') e[`lines.${i}.productId`] = `${p.name} is inactive and cannot be received.`
    if (p && ['Frozen', 'Chilled'].includes(p.storageCondition)) {
      if (!String(l.batchNumber || '').trim()) e[`lines.${i}.batchNumber`] = `Line ${i + 1}: batch number is required for ${p.storageCondition.toLowerCase()} products.`
      if (!l.expiryDate) e[`lines.${i}.expiryDate`] = `Line ${i + 1}: expiry date is required for ${p.storageCondition.toLowerCase()} products.`
    }
    if (l.expiryDate && l.expiryDate <= today) e[`lines.${i}.expiryDate`] = `Line ${i + 1}: the product is already expired — reject it instead of receiving it.`
    if (l.mfgDate && l.expiryDate && l.mfgDate >= l.expiryDate) e[`lines.${i}.mfgDate`] = `Line ${i + 1}: manufacture date must be before expiry.`
    if (l.mfgDate && l.mfgDate > today) e[`lines.${i}.mfgDate`] = `Line ${i + 1}: manufacture date cannot be in the future.`
  })
  return e
}

/**
 * Post a goods receipt: accepted quantity (received − rejected) of every line is received into the hub through the
 * normal stock receipt (one ledger), the PO received quantities are updated, and QA inspection / put-away tasks open.
 */
export const postGoodsReceipt = (grn, user) => {
  const po = grn.purchaseOrderId ? read(K.PURCHASE_ORDERS).find((p) => p.id === grn.purchaseOrderId) : null
  if (grn.purchaseOrderId && !po) return { ok: false, error: 'The purchase order no longer exists.' }
  if (po && !['APPROVED', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(po.status)) return { ok: false, error: `PO ${po.number} is ${po.status.replace(/_/g, ' ').toLowerCase()} — only approved / sent / confirmed POs can be received.` }
  const lineErrors = validateGrnLines(grn)
  if (Object.keys(lineErrors).length) return { ok: false, error: Object.values(lineErrors)[0], errors: lineErrors }
  if (dayjs(grn.receivedDate).isAfter(dayjs(), 'day')) return { ok: false, error: 'Received date cannot be in the future.' }
  if (po) {
    const rem = poRemaining(po)
    const incoming = {}
    grn.lines.forEach((l) => { incoming[l.productId] = (incoming[l.productId] || 0) + (Number(l.receivedQty) || 0) })
    for (const [pid, q] of Object.entries(incoming)) {
      if (rem[pid] === undefined) return { ok: false, error: 'A received product is not on the purchase order.' }
      if (q > rem[pid] + 1e-9 && !can(user, 'procurement.po.overreceive')) return { ok: false, error: `Receiving ${q} exceeds the ${Math.max(0, rem[pid])} still open on ${po.number}. Over-receipt needs the "Approve over-receipt" permission.` }
    }
  }
  const lines = []
  const P = products()
  for (const l of grn.lines) {
    const accepted = r2((Number(l.receivedQty) || 0) - (Number(l.rejectedQty) || 0))
    if (accepted <= 0) { lines.push({ ...l, acceptedQty: 0 }); continue }
    const res = createStockReceipt({ hubId: grn.hubId, productId: l.productId, quantity: accepted, receiptDate: grn.receivedDate, referenceNumber: grn.number, notes: `${grn.number}${po ? ` · ${po.number}` : ''} · batch ${l.batchNumber || '—'}` })
    if (!res.ok) return { ok: false, error: Object.values(res.errors || {})[0] || 'Stock receipt failed.' }
    lines.push({ ...l, acceptedQty: accepted, receiptNumber: res.record.receiptNumber })
  }
  if (po) {
    const got = {}
    lines.forEach((l) => { got[l.productId] = (got[l.productId] || 0) + (Number(l.receivedQty) || 0) - (Number(l.rejectedQty) || 0) })
    const poLines = po.lines.map((l) => {
      const add = Math.min(got[l.productId] || 0, Math.max(0, l.quantity - (l.receivedQty || 0)))
      got[l.productId] = r2((got[l.productId] || 0) - add)
      return { ...l, receivedQty: r2((Number(l.receivedQty) || 0) + add) }
    })
    // Approved over-receipt lands on the last line of that product
    Object.entries(got).forEach(([pid, extra]) => {
      if (extra <= 0) return
      const idx = poLines.map((l) => l.productId).lastIndexOf(pid)
      if (idx >= 0) poLines[idx] = { ...poLines[idx], receivedQty: r2(poLines[idx].receivedQty + extra) }
    })
    const full = poLines.every((l) => l.receivedQty >= l.quantity - 1e-9)
    patchRecord('purchase_orders', po.id, { lines: poLines, status: full ? 'RECEIVED' : 'PARTIALLY_RECEIVED', lastGrnNumber: grn.number }, { user, action: `Goods received (${grn.number})` })
  }
  const followUps = { putaway: [], qa: null }
  lines.filter((l) => l.acceptedQty > 0).forEach((l) => {
    const t = createRecord('putaway_tasks', { grnId: grn.id, grnNumber: grn.number, productId: l.productId, hubId: grn.hubId, quantity: l.acceptedQty, batchNumber: l.batchNumber || '', toLocationId: l.locationId || '', storageType: P[l.productId]?.storageCondition || 'Frozen' }, user, { silent: true, system: true })
    if (t.ok) followUps.putaway.push(t.record.number)
  })
  if (grn.qaRequired) {
    const q = createRecord('qa_inspections', { sourceType: 'Goods receipt', grnId: grn.id, hubId: grn.hubId, productId: lines[0]?.productId || '', batchNumbers: lines.map((l) => l.batchNumber).filter(Boolean).join(', '), plannedDate: dayjs().format('YYYY-MM-DD'), notes: `Incoming inspection for ${grn.number}` }, user, { silent: true, system: true })
    if (q.ok) followUps.qa = q.record.number
  }
  return { ok: true, patch: { lines, postedAt: new Date().toISOString(), putawayTasks: followUps.putaway, qaInspectionNumber: followUps.qa } }
}

/** 3-way match: PO unit price × quantity received (GRNs) vs the supplier invoice subtotal. */
export const threeWayMatch = (inv) => {
  const po = inv.purchaseOrderId ? read(K.PURCHASE_ORDERS).find((p) => p.id === inv.purchaseOrderId) : null
  if (!po) return { status: 'NO_PO', receivedValue: 0, orderedValue: 0, variance: Number(inv.subtotal || 0), variancePct: 100 }
  const receivedValue = r2(po.lines.reduce((s, l) => s + (Number(l.receivedQty) || 0) * (Number(l.unitPrice) || 0), 0))
  const orderedValue = r2(po.lines.reduce((s, l) => s + poLineValue(l), 0))
  const variance = r2(Number(inv.subtotal || 0) - receivedValue)
  const variancePct = receivedValue ? r2((variance / receivedValue) * 100) : 100
  const tol = Number(storage.getItem(K.ENTERPRISE_SETTINGS, {})?.finance?.matchTolerancePct ?? 1)
  return { status: Math.abs(variancePct) <= tol && receivedValue > 0 ? 'MATCHED' : 'VARIANCE', receivedValue, orderedValue, variance, variancePct, tolerance: tol, poNumber: po.number }
}

export const supplierScore = (supplierId) => {
  const pos = read(K.PURCHASE_ORDERS).filter((p) => p.supplierId === supplierId && !['DRAFT', 'CANCELLED', 'REJECTED'].includes(p.status))
  const grns = read(K.GOODS_RECEIPTS).filter((g) => g.supplierId === supplierId && g.status === 'POSTED')
  const onTime = grns.filter((g) => { const po = pos.find((p) => p.id === g.purchaseOrderId); return po && g.receivedDate <= po.expectedDate }).length
  const rec = grns.reduce((s, g) => s + g.lines.reduce((x, l) => x + (Number(l.receivedQty) || 0), 0), 0)
  const rej = grns.reduce((s, g) => s + g.lines.reduce((x, l) => x + (Number(l.rejectedQty) || 0), 0), 0)
  const ncrs = read(K.NONCONFORMANCES).filter((n) => n.supplierId === supplierId).length
  const value = r2(pos.reduce((s, p) => s + Number(p.total || 0), 0))
  const onTimePct = grns.length ? Math.round((onTime / grns.length) * 100) : null
  const qualityPct = rec ? Math.round(((rec - rej) / rec) * 100) : null
  const score = onTimePct === null && qualityPct === null ? null : Math.round(((onTimePct ?? 100) * 0.5) + ((qualityPct ?? 100) * 0.4) + Math.max(0, 10 - ncrs * 5))
  return { supplierId, orders: pos.length, value, receipts: grns.length, onTimePct, qualityPct, rejectedQty: rej, ncrs, score }
}

