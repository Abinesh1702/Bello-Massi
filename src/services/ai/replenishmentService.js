/**
 * Replenishment drafts (bellomassi_replenishment_drafts) — the AI proposal step in front of Procurement.
 * DRAFT → SUBMITTED → APPROVED → CONVERTED (sent to procurement) → RECEIVED, or REJECTED / CANCELLED.
 *
 * Nothing here changes stock and nothing here is a purchase order. "Send to procurement" raises a purchase
 * requisition (submitted for approval) with the draft's lines; buying and receiving then follow the one procurement
 * flow (requisition → RFQ / PO → goods receipt → QA). Progress is read back from the requisition's purchase orders.
 * Drafts converted before data v10 were received with Stock Receipts carrying the draft number — still matched.
 */
import dayjs from 'dayjs'
import storage from '../storageService'
import { getCurrentUser } from '../authService'
import { can } from '../../config/permissions'
import { ROLES } from '../../config/roles'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { RECOMMENDATION_STATUS as RS, REPLENISHMENT_STATUS as S } from '../../config/aiConfig'
import { logActivity } from '../activityService'
import { pushNotification } from '../notificationService'
import { uid } from '../../utils/helpers'
import { logAiActivity } from './aiActivityService'
import { getForecastSettings } from './dataBundle'
import { formatCurrency } from '../../utils/formatters'
import { getNumberingPrefix } from '../../config/runtimeConfig'
import { createRecord, patchRecord, runAction } from '../enterprise/recordService'

const deny = (error) => ({ ok: false, error })
const read = () => storage.getItem(K.REPLENISHMENT_DRAFTS, []) || []


/** Received quantity per line — from the requisition's purchase orders, or (older drafts) matching stock receipts. */
export const receiptProgress = (draft, receipts = storage.getItem(K.STOCK_RECEIPTS, []) || []) => {
  if (draft.requisitionId) {
    const pos = (storage.getItem(K.PURCHASE_ORDERS, []) || []).filter((po) => po.requisitionId === draft.requisitionId && !['CANCELLED', 'REJECTED'].includes(po.status))
    const lines = draft.lines.map((l) => {
      const received = pos.reduce((s, po) => s + (po.lines || []).filter((x) => x.productId === l.productId).reduce((t, x) => t + (Number(x.receivedQty) || 0), 0), 0)
      return { ...l, received, receipts: pos.map((po) => ({ id: po.id, number: po.number, quantity: null, date: po.orderDate })), outstanding: Math.max(0, (Number(l.quantity) || 0) - received) }
    })
    return { lines, complete: lines.every((l) => l.outstanding === 0), receivedAny: lines.some((l) => l.received > 0), purchaseOrders: pos }
  }
  const lines = draft.lines.map((l) => {
    const recs = receipts.filter((r) => r.referenceNumber === draft.number && r.productId === l.productId && r.hubId === draft.hubId)
    const received = recs.reduce((s, r) => s + (Number(r.quantity) || 0), 0)
    return { ...l, received, receipts: recs.map((r) => ({ id: r.id, number: r.receiptNumber, quantity: r.quantity, date: r.receiptDate })), outstanding: Math.max(0, (Number(l.quantity) || 0) - received) }
  })
  return { lines, complete: lines.every((l) => l.outstanding === 0), receivedAny: lines.some((l) => l.received > 0) }
}

/** Status shown to users: a converted draft whose lines are all received reads as RECEIVED. */
export const effectiveDraftStatus = (draft, receipts) => (draft.status === S.CONVERTED && receiptProgress(draft, receipts).complete ? S.RECEIVED : draft.status)

const nextNumber = (list) => {
  const year = dayjs().year()
  const nums = list.map((d) => Number(String(d.number).split('-').pop()) || 0)
  return `${getNumberingPrefix('replenishment')}-${year}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0')}`
}

export const validateDraft = (input, { products, hubs }) => {
  const e = {}
  const settings = getForecastSettings()
  const warnings = []
  const hub = hubs.find((h) => h.id === input.hubId)
  if (!hub) e.hubId = 'Select a destination hub.'
  else if (hub.status !== 'Active') e.hubId = `${hub.name} is inactive.`
  const sup = settings.suppliers.find((s) => s.id === input.supplierId)
  if (!sup) e.supplierId = 'Select a supplier.'
  if (!input.lines?.length) e.lines = 'Add at least one product.'
  const seen = new Set()
  let value = 0
  ;(input.lines || []).forEach((l, i) => {
    const p = products.find((x) => x.id === l.productId)
    if (!p) { e[`lines.${i}.productId`] = 'Select a product.'; return }
    if (p.status !== 'Active') e[`lines.${i}.productId`] = `${p.name} is not active.`
    if (seen.has(l.productId)) e[`lines.${i}.productId`] = `${p.name} appears twice.`
    seen.add(l.productId)
    const q = Number(l.quantity)
    if (!Number.isFinite(q) || q <= 0) e[`lines.${i}.quantity`] = 'Quantity must be greater than zero.'
    else if (!['KG', 'LTR', 'MTR'].includes(p.unit) && !Number.isInteger(q)) e[`lines.${i}.quantity`] = `${p.unit} quantities must be whole numbers.`
    else {
      const params = settings.productParams?.[p.id] || {}
      const moq = Number(params.moq ?? 10)
      const pack = Number(params.packMultiple ?? 5)
      if (q < moq) e[`lines.${i}.quantity`] = `Minimum order quantity for ${p.name} is ${moq}.`
      else if (pack > 1 && q % pack !== 0) warnings.push(`${p.name}: ${q} is not a multiple of the pack size ${pack}.`)
    }
    value += (Number(l.quantity) || 0) * (Number(p.purchasePrice) || 0)
  })
  if (sup && sup.minOrderValue && value > 0 && value < sup.minOrderValue) warnings.push(`Order value ${formatCurrency(value)} is below ${sup.name}'s minimum of ${formatCurrency(sup.minOrderValue)}.`)
  if (String(input.notes || '').length > 500) e.notes = 'Keep notes under 500 characters.'
  return { errors: e, warnings, value }
}

const setRecs = (ids, patch) => {
  if (!ids.length) return
  storage.updateItem(K.REORDER_RECOMMENDATIONS, (list) => (list || []).map((r) => (ids.includes(r.id) ? { ...r, ...patch } : r)), [])
}

const history = (d, action, user, note = '') => [...(d.history || []), { at: new Date().toISOString(), action, by: user.id, byName: user.name, note }]

export const createDraft = (input) => {
  const user = getCurrentUser()
  if (!can(user, 'inventory.replenishment.create')) return deny('You do not have permission to create replenishment drafts.')
  const products = storage.getItem(K.PRODUCTS, []) || []
  const hubs = storage.getItem(K.HUBS, []) || []
  const { errors, warnings, value } = validateDraft(input, { products, hubs })
  if (Object.keys(errors).length) return { ok: false, errors, error: 'Please fix the highlighted fields.' }
  const list = read()
  const P = Object.fromEntries(products.map((p) => [p.id, p]))
  const sup = getForecastSettings().suppliers.find((s) => s.id === input.supplierId)
  const draft = {
    id: uid('rpl'), number: nextNumber(list), status: S.DRAFT, hubId: input.hubId, supplierId: sup.id, supplierName: sup.name, leadTimeDays: sup.leadTimeDays,
    lines: input.lines.map((l) => ({ productId: l.productId, productName: P[l.productId].name, productCode: P[l.productId].code, unit: P[l.productId].unit, recommendedQty: Number(l.recommendedQty) || null, quantity: Number(l.quantity), unitCost: Number(P[l.productId].purchasePrice) || 0, recommendationId: l.recommendationId || null })),
    estimatedValue: Math.round(value), notes: (input.notes || '').trim(), source: input.source || 'manual', warnings,
    createdBy: user.id, createdByName: user.name, createdAt: new Date().toISOString(), history: [],
  }
  draft.history = history(draft, 'Created', user, input.source === 'ai' ? 'From AI reorder recommendations' : '')
  const res = storage.setItem(K.REPLENISHMENT_DRAFTS, [draft, ...list])
  if (!res.ok) return deny(res.error)
  setRecs(draft.lines.map((l) => l.recommendationId).filter(Boolean), { status: RS.IN_DRAFT, draftId: draft.id })
  logActivity({ type: 'replenishment', message: `created replenishment draft ${draft.number}`, entityType: 'replenishment', entityId: draft.id })
  logAiActivity({ kind: 'replenishment', action: 'create_replenishment_draft', args: { number: draft.number, lines: draft.lines.length, hubId: draft.hubId }, summary: draft.number })
  return { ok: true, record: draft, warnings }
}

const mutate = (id, fn) => {
  const list = read()
  const d = list.find((x) => x.id === id)
  if (!d) return deny('Replenishment draft not found.')
  const out = fn(d)
  if (!out.ok) return out
  const res = storage.setItem(K.REPLENISHMENT_DRAFTS, list.map((x) => (x.id === id ? out.record : x)))
  return res.ok ? out : deny(res.error)
}

export const updateDraft = (id, input) => {
  const user = getCurrentUser()
  return mutate(id, (d) => {
    if (d.status !== S.DRAFT) return deny('Only drafts can be edited.')
    if (!(d.createdBy === user?.id || can(user, 'inventory.predictions.manage'))) return deny('Only the creator or an Administrator can edit this draft.')
    const products = storage.getItem(K.PRODUCTS, []) || []
    const { errors, warnings, value } = validateDraft({ ...d, ...input }, { products, hubs: storage.getItem(K.HUBS, []) || [] })
    if (Object.keys(errors).length) return { ok: false, errors, error: 'Please fix the highlighted fields.' }
    const sup = getForecastSettings().suppliers.find((s) => s.id === (input.supplierId || d.supplierId))
    const P = Object.fromEntries(products.map((p) => [p.id, p]))
    const lines = (input.lines || d.lines).map((l) => ({ ...l, productName: P[l.productId].name, productCode: P[l.productId].code, unit: P[l.productId].unit, quantity: Number(l.quantity), unitCost: Number(P[l.productId].purchasePrice) || 0 }))
    const removed = d.lines.filter((l) => l.recommendationId && !lines.some((x) => x.recommendationId === l.recommendationId)).map((l) => l.recommendationId)
    setRecs(removed, { status: RS.OPEN, draftId: null })
    return { ok: true, warnings, record: { ...d, ...input, lines, supplierName: sup.name, leadTimeDays: sup.leadTimeDays, estimatedValue: Math.round(value), warnings, updatedAt: new Date().toISOString(), history: history(d, 'Edited', user) } }
  })
}

export const submitDraft = (id) => {
  const user = getCurrentUser()
  const res = mutate(id, (d) => {
    if (d.status !== S.DRAFT) return deny('Only drafts can be submitted.')
    if (!can(user, 'inventory.replenishment.create')) return deny('You do not have permission to submit.')
    return { ok: true, record: { ...d, status: S.SUBMITTED, submittedAt: new Date().toISOString(), submittedBy: user.id, history: history(d, 'Submitted for approval', user) } }
  })
  if (res.ok) {
    pushNotification({ title: 'Replenishment awaiting approval', message: `${res.record.number} (${res.record.lines.length} lines) was submitted by ${user.name}.`, type: 'info', roles: [ROLES.ADMIN], link: `/ai/replenishment/${id}` })
    logAiActivity({ kind: 'replenishment', action: 'submit_replenishment', args: { number: res.record.number } })
  }
  return res
}

export const approveDraft = (id, note = '') => {
  const user = getCurrentUser()
  const res = mutate(id, (d) => {
    if (!can(user, 'procurement.approve')) return deny('You do not have permission to approve replenishment.')
    if (d.status !== S.SUBMITTED) return deny('Only submitted drafts can be approved.')
    return { ok: true, record: { ...d, status: S.APPROVED, approvedAt: new Date().toISOString(), approvedBy: user.id, approvedByName: user.name, history: history(d, 'Approved', user, note) } }
  })
  if (res.ok) {
    pushNotification({ title: 'Replenishment approved', message: `${res.record.number} was approved. Record the goods receipt when stock arrives.`, type: 'success', userIds: [res.record.createdBy], link: `/ai/replenishment/${id}` })
    logActivity({ type: 'replenishment', message: `approved replenishment ${res.record.number}`, entityType: 'replenishment', entityId: id })
    logAiActivity({ kind: 'replenishment', action: 'approve_replenishment', args: { number: res.record.number } })
  }
  return res
}

export const rejectDraft = (id, reason) => {
  const user = getCurrentUser()
  if (!String(reason || '').trim()) return { ok: false, errors: { reason: 'A reason is required.' }, error: 'A reason is required.' }
  const res = mutate(id, (d) => {
    if (!can(user, 'procurement.reject')) return deny('You do not have permission to reject replenishment.')
    if (d.status !== S.SUBMITTED) return deny('Only submitted drafts can be rejected.')
    return { ok: true, record: { ...d, status: S.REJECTED, rejectedAt: new Date().toISOString(), rejectedBy: user.id, rejectionReason: reason.trim(), history: history(d, 'Rejected', user, reason.trim()) } }
  })
  if (res.ok) {
    setRecs(res.record.lines.map((l) => l.recommendationId).filter(Boolean), { status: RS.OPEN, draftId: null })
    pushNotification({ title: 'Replenishment rejected', message: `${res.record.number}: ${reason.trim()}`, type: 'warning', userIds: [res.record.createdBy], link: `/ai/replenishment/${id}` })
    logAiActivity({ kind: 'replenishment', action: 'reject_replenishment', args: { number: res.record.number, reason } })
  }
  return res
}

/**
 * Send an approved draft to Procurement: a purchase requisition with the same lines (submitted for approval) is
 * created and linked. No stock changes; receiving happens on the requisition's purchase order.
 */
export const convertDraft = (id) => {
  const user = getCurrentUser()
  if (!can(user, 'procurement.approve')) return deny('You do not have permission to send replenishment to procurement.')
  const draft = read().find((d) => d.id === id)
  if (!draft) return deny('Replenishment draft not found.')
  if (draft.status !== S.APPROVED) return deny('Only approved drafts can be sent to procurement.')
  const pr = createRecord('purchase_requisitions', {
    title: `Replenishment ${draft.number} — ${draft.supplierName}`,
    hubId: draft.hubId,
    requiredBy: dayjs().add(Number(draft.leadTimeDays) || 7, 'day').format('YYYY-MM-DD'),
    priority: 'Normal',
    requestedBy: user.id,
    justification: `AI replenishment proposal ${draft.number}, approved by ${user.name}. Preferred supplier: ${draft.supplierName}.${draft.notes ? ` ${draft.notes}` : ''}`,
    preferredSupplierId: draft.supplierId,
    replenishmentDraftId: draft.id,
    replenishmentNumber: draft.number,
    lines: draft.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, estimatedPrice: l.unitCost })),
  }, user, { system: true })
  if (!pr.ok) return deny(pr.error || 'The purchase requisition could not be created.')
  // Into the approval queue (with its notification) — the same step a person takes with "Submit"
  const sub = runAction('purchase_requisitions', pr.record.id, 'submit', {}, user)
  if (!sub.ok) patchRecord('purchase_requisitions', pr.record.id, { status: 'SUBMITTED' }, { user, action: 'Submitted', note: `From replenishment ${draft.number}` })
  const res = mutate(id, (d) => ({
    ok: true,
    record: { ...d, status: S.CONVERTED, convertedAt: new Date().toISOString(), convertedBy: user.id, requisitionId: pr.record.id, requisitionNumber: pr.record.number, history: history(d, 'Sent to procurement', user, `Purchase requisition ${pr.record.number} submitted for approval.`) },
  }))
  if (res.ok) logAiActivity({ kind: 'replenishment', action: 'convert_replenishment', args: { number: res.record.number, requisition: pr.record.number } })
  return res.ok ? { ...res, requisition: pr.record } : res
}

export const cancelDraft = (id, reason = '') => {
  const user = getCurrentUser()
  const res = mutate(id, (d) => {
    if (![S.DRAFT, S.SUBMITTED, S.APPROVED].includes(d.status)) return deny('This replenishment can no longer be cancelled.')
    if (!(d.createdBy === user?.id || can(user, 'inventory.predictions.manage'))) return deny('Only the creator or an Administrator can cancel.')
    return { ok: true, record: { ...d, status: S.CANCELLED, cancelledAt: new Date().toISOString(), cancelledBy: user.id, history: history(d, 'Cancelled', user, reason) } }
  })
  if (res.ok) {
    setRecs(res.record.lines.map((l) => l.recommendationId).filter(Boolean), { status: RS.OPEN, draftId: null })
    logAiActivity({ kind: 'replenishment', action: 'cancel_replenishment', args: { number: res.record.number } })
  }
  return res
}

/** Older drafts (converted before procurement hand-over): Stock Receipt form prefilled for one outstanding line. */
export const receiptLink = (draft, line) => `/inventory/stock-receipts/create?${new URLSearchParams({ hubId: draft.hubId, productId: line.productId, quantity: String(line.outstanding ?? line.quantity), reference: draft.number })}`
