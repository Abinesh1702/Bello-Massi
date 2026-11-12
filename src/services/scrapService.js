/**
 * Inventory Scrap Management.
 *
 * Workflow: DRAFT → PENDING_APPROVAL (submitted) → APPROVED | REJECTED → COMPLETED (stock written off) ; CANCELLED.
 * Business rules:
 * - Only an APPROVED request can create a stock write-off, and only once (COMPLETED requests are never written off again).
 * - The write-off reduces the selected stock source (available or damaged/quarantined) and records a
 *   "Scrap Write-off" stock movement in the same transaction — never below zero, never above the eligible quantity.
 * - Requesters cannot approve their own requests. Every action re-checks the caller's permission.
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { STORAGE_KEYS } from '../utils/constants'
import { can } from '../config/permissions'
import { getCurrentUser } from './authService'
import { pushNotification } from './notificationService'
import { postScrapWriteOff, scrapEligibleQuantity } from './inventoryService'
import { DECIMAL_UNITS } from './productService'
import { ROLES } from '../config/roles'
import { uid } from '../utils/helpers'

const K = STORAGE_KEYS
const read = (k, f = []) => storage.getItem(k, f) || f
const round = (n) => Math.round(n * 1000) / 1000
const deny = (msg, errors) => ({ ok: false, error: msg, errors: errors || { form: msg } })

export const SCRAP_STATUS = Object.freeze({
  DRAFT: 'DRAFT', PENDING_APPROVAL: 'PENDING_APPROVAL', APPROVED: 'APPROVED', REJECTED: 'REJECTED', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED',
})
export const SCRAP_STATUS_META = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  PENDING_APPROVAL: { label: 'Pending approval', tone: 'warning' },
  APPROVED: { label: 'Approved — awaiting write-off', tone: 'info' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  COMPLETED: { label: 'Written off', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
}
/** Approval status shown in lists / filters. */
export const approvalStatusOf = (r) => ({ DRAFT: 'Not submitted', PENDING_APPROVAL: 'Pending', APPROVED: 'Approved', COMPLETED: 'Approved', REJECTED: 'Rejected', CANCELLED: 'Cancelled' }[r.status])
export const SCRAP_REASONS = ['Expired', 'Damaged', 'Quality Rejected', 'Temperature Excursion', 'Contamination', 'Packaging Damage', 'Other']
export const STOCK_SOURCES = [{ value: 'available', label: 'Available stock' }, { value: 'damaged', label: 'Damaged / quarantined stock' }]
/** Reasons that need photo proof before submission. */
export const PHOTO_REQUIRED_REASONS = ['Damaged', 'Packaging Damage', 'Contamination']
const OPEN = [SCRAP_STATUS.PENDING_APPROVAL, SCRAP_STATUS.APPROVED]
const MAX_FILE_CHARS = 450 * 1024

export const getScrapRequests = () => read(K.SCRAP_REQUESTS)
export const getScrapById = (id, list = getScrapRequests()) => list.find((r) => r.id === id) || null

export const nextScrapNumber = (list = getScrapRequests(), year = dayjs().year()) => {
  const nums = list.map((r) => String(r.scrapNumber || '')).filter((n) => n.startsWith(`SCR-${year}-`)).map((n) => Number(n.split('-').pop()) || 0)
  return `SCR-${year}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0')}`
}

/** Quantity already committed by other open requests for the same stock line and source. */
export const committedQuantity = ({ productId, hubId, source }, list = getScrapRequests(), exceptId = null) =>
  round(list.filter((r) => r.id !== exceptId && OPEN.includes(r.status) && r.productId === productId && r.hubId === hubId && r.stockSource === source).reduce((s, r) => s + r.quantity, 0))

/** Stock eligible for a new / edited request = stock source − quantities already committed to other open requests. */
export const eligibleFor = ({ productId, hubId, source = 'available' }, exceptId = null) => {
  const rec = read(K.INVENTORY).find((r) => r.productId === productId && r.hubId === hubId)
  const onHand = scrapEligibleQuantity(rec, source)
  const committed = committedQuantity({ productId, hubId, source }, getScrapRequests(), exceptId)
  return { onHand, committed, eligible: round(Math.max(0, onHand - committed)), record: rec || null }
}

export const validateScrap = (v, { forSubmit = false, existing = null } = {}) => {
  const e = {}
  const product = read(K.PRODUCTS).find((p) => p.id === v.productId)
  const hub = read(K.HUBS).find((h) => h.id === v.hubId)
  if (!product) e.productId = 'Select a product.'
  if (!hub) e.hubId = 'Select a hub.'
  if (product?.batchControlled && !String(v.batchNumber || '').trim()) e.batchNumber = 'Batch number is required for batch-controlled products.'
  if (String(v.batchNumber || '').length > 40) e.batchNumber = 'Use 40 characters or fewer.'
  if (v.warehouseId) {
    const wh = (storage.getItem(K.ORGANIZATION, null)?.warehouses || []).find((w) => w.id === v.warehouseId)
    if (!wh || (hub && wh.hubId !== hub.id)) e.warehouseId = 'Choose a warehouse inside the selected hub.'
  }
  if (!STOCK_SOURCES.some((s) => s.value === v.stockSource)) e.stockSource = 'Choose the stock source.'
  const q = Number(v.quantity)
  if (String(v.quantity ?? '').trim() === '' || Number.isNaN(q)) e.quantity = 'Enter the scrap quantity.'
  else if (q <= 0) e.quantity = 'Quantity must be greater than zero.'
  else if (product && !DECIMAL_UNITS.includes(product.unit) && !Number.isInteger(q)) e.quantity = `Whole ${product.unit} only.`
  else if (product && hub && !e.stockSource) {
    const { eligible, committed } = eligibleFor({ productId: product.id, hubId: hub.id, source: v.stockSource }, existing?.id)
    if (q > eligible) e.quantity = `Only ${eligible} ${product.unit} eligible${committed ? ` (${committed} already in other open requests)` : ''}.`
  }
  if (!SCRAP_REASONS.includes(v.reason)) e.reason = 'Choose a scrap reason.'
  if (v.reason === 'Other' && String(v.remarks || '').trim().length < 5) e.remarks = 'Describe the reason (at least 5 characters).'
  if (String(v.remarks || '').length > 500) e.remarks = 'Use 500 characters or fewer.'
  if (forSubmit && PHOTO_REQUIRED_REASONS.includes(v.reason) && !(v.photos || []).length) e.photos = `Add at least one photo as proof for “${v.reason}”.`
  if ([...(v.photos || []), ...(v.documents || [])].some((f) => String(f.dataUrl || '').length > MAX_FILE_CHARS)) e.photos = 'Each file must be under 300 KB (files are kept in this browser).'
  if (!v.requestDate || !dayjs(v.requestDate).isValid()) e.requestDate = 'Enter the request date.'
  else if (dayjs(v.requestDate).isAfter(dayjs(), 'day')) e.requestDate = 'Request date cannot be in the future.'
  return { errors: e, product, hub }
}

const histItem = (user, action, note = '') => ({ id: uid('sch'), at: new Date().toISOString(), action, by: user?.id || null, byName: user?.name || 'System', note })
const write = (list) => storage.setItem(K.SCRAP_REQUESTS, list)

/** Create (draft) or create-and-submit. Duplicate open requests for the same line, batch and reason are refused. */
export const saveScrap = (values, { id = null, submit = false } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'scrap.create')) return deny('You do not have permission to create scrap requests.')
  const list = getScrapRequests()
  const existing = id ? getScrapById(id, list) : null
  if (id && !existing) return deny('This scrap request no longer exists.')
  if (existing && existing.status !== SCRAP_STATUS.DRAFT) return deny('Only draft requests can be edited.')
  if (existing && existing.requestedBy !== user.id && !can(user, 'scrap.approve')) return deny('Only the requester can edit this draft.')
  const { errors, product, hub } = validateScrap(values, { forSubmit: submit, existing })
  if (Object.keys(errors).length) return deny('Please fix the highlighted fields.', errors)
  const dup = list.find((r) => r.id !== existing?.id && OPEN.includes(r.status) && r.productId === product.id && r.hubId === hub.id
    && (r.batchNumber || '') === String(values.batchNumber || '').trim() && r.reason === values.reason && r.stockSource === values.stockSource)
  if (submit && dup) return deny(`An open request (${dup.scrapNumber}) already covers ${product.name} at ${hub.name} for “${values.reason}”. Update that request instead.`)
  const now = new Date().toISOString()
  const quantity = round(Number(values.quantity))
  const unitCost = Number(product.purchasePrice) || 0
  const base = {
    productId: product.id, productName: product.name, productCode: product.code, category: product.category, unit: product.unit,
    batchNumber: String(values.batchNumber || '').trim(), hubId: hub.id, hubName: hub.name, warehouseId: values.warehouseId || null,
    stockSource: values.stockSource, quantity, unitCost, value: Math.round(quantity * unitCost * 100) / 100, reason: values.reason,
    remarks: String(values.remarks || '').trim(), photos: values.photos || [], documents: values.documents || [], requestDate: values.requestDate,
  }
  let record
  if (existing) {
    record = { ...existing, ...base, updatedAt: now, history: [...existing.history, histItem(user, 'Draft updated')] }
  } else {
    record = {
      id: uid('scr'), scrapNumber: nextScrapNumber(list), status: SCRAP_STATUS.DRAFT, ...base,
      requestedBy: user.id, requestedByName: user.name, createdAt: now, updatedAt: now, history: [histItem(user, 'Draft created')],
      approvedBy: null, approvedByName: null, approvedAt: null, approvalRemarks: '', rejectedBy: null, rejectedByName: null, rejectedAt: null, rejectionReason: '',
      writeOff: null, cancelledAt: null, cancelReason: '',
    }
  }
  if (submit) record = submitted(record, user)
  const res = write(existing ? list.map((r) => (r.id === id ? record : r)) : [record, ...list])
  if (!res.ok) return deny(res.error)
  if (submit) announceSubmitted(record)
  return { ok: true, record }
}

const submitted = (record, user) => ({
  ...record, status: SCRAP_STATUS.PENDING_APPROVAL, submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  history: [...record.history, histItem(user, 'Submitted'), histItem(user, 'Pending approval', 'Waiting for an approver')],
})
const announceSubmitted = (r) => pushNotification({
  title: `Scrap approval: ${r.scrapNumber}`, message: `${r.requestedByName} requests a write-off of ${r.quantity} ${r.unit} ${r.productName} at ${r.hubName} (${r.reason}).`,
  type: 'warning', roles: [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER], link: `/inventory/scrap/requests/${r.id}`, category: 'inventory',
})

export const submitScrap = (id) => {
  const user = getCurrentUser()
  if (!can(user, 'scrap.create')) return deny('You do not have permission to submit scrap requests.')
  const list = getScrapRequests()
  const r = getScrapById(id, list)
  if (!r) return deny('This scrap request no longer exists.')
  if (r.status !== SCRAP_STATUS.DRAFT) return deny(`${r.scrapNumber} is already ${SCRAP_STATUS_META[r.status].label.toLowerCase()}.`)
  const { errors } = validateScrap({ ...r, quantity: r.quantity }, { forSubmit: true, existing: r })
  if (Object.keys(errors).length) return deny(Object.values(errors)[0], errors)
  const record = submitted(r, user)
  const res = write(list.map((x) => (x.id === id ? record : x)))
  if (!res.ok) return deny(res.error)
  announceSubmitted(record)
  return { ok: true, record }
}

/** Approve; optionally post the write-off immediately (default). */
export const approveScrap = (id, { remarks = '', writeOffNow = true } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'scrap.approve')) return deny('You do not have permission to approve scrap requests.')
  const list = getScrapRequests()
  const r = getScrapById(id, list)
  if (!r) return deny('This scrap request no longer exists.')
  if (r.status !== SCRAP_STATUS.PENDING_APPROVAL) return deny(`${r.scrapNumber} is not pending approval.`)
  if (r.requestedBy === user.id) return deny('You cannot approve your own scrap request.')
  const now = new Date().toISOString()
  const record = {
    ...r, status: SCRAP_STATUS.APPROVED, approvedBy: user.id, approvedByName: user.name, approvedAt: now, approvalRemarks: String(remarks).trim(), updatedAt: now,
    history: [...r.history, histItem(user, 'Approved', String(remarks).trim())],
  }
  const res = write(list.map((x) => (x.id === id ? record : x)))
  if (!res.ok) return deny(res.error)
  pushNotification({ title: `Scrap approved: ${r.scrapNumber}`, message: `${user.name} approved the write-off of ${r.quantity} ${r.unit} ${r.productName}.`, type: 'success', userIds: [r.requestedBy], link: `/inventory/scrap/requests/${r.id}`, category: 'inventory' })
  if (!writeOffNow) return { ok: true, record }
  const w = writeOffScrap(id)
  return w.ok ? w : { ok: true, record, writeOffError: w.error }
}

export const rejectScrap = (id, { reason = '' } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'scrap.reject')) return deny('You do not have permission to reject scrap requests.')
  const list = getScrapRequests()
  const r = getScrapById(id, list)
  if (!r) return deny('This scrap request no longer exists.')
  if (r.status !== SCRAP_STATUS.PENDING_APPROVAL) return deny(`${r.scrapNumber} is not pending approval.`)
  if (String(reason).trim().length < 5) return deny('Enter a rejection reason (at least 5 characters).', { reason: 'Enter a rejection reason (at least 5 characters).' })
  const now = new Date().toISOString()
  const record = { ...r, status: SCRAP_STATUS.REJECTED, rejectedBy: user.id, rejectedByName: user.name, rejectedAt: now, rejectionReason: String(reason).trim(), updatedAt: now, history: [...r.history, histItem(user, 'Rejected', String(reason).trim())] }
  const res = write(list.map((x) => (x.id === id ? record : x)))
  if (!res.ok) return deny(res.error)
  pushNotification({ title: `Scrap rejected: ${r.scrapNumber}`, message: `${user.name}: ${String(reason).trim()}`, type: 'danger', userIds: [r.requestedBy], link: `/inventory/scrap/requests/${r.id}`, category: 'inventory' })
  return { ok: true, record }
}

/** Stock write-off for an APPROVED request — exactly once. */
export const writeOffScrap = (id) => {
  const user = getCurrentUser()
  if (!can(user, 'scrap.approve')) return deny('Only an approver can post a stock write-off.')
  const list = getScrapRequests()
  const r = getScrapById(id, list)
  if (!r) return deny('This scrap request no longer exists.')
  if (r.status === SCRAP_STATUS.COMPLETED || r.writeOff) return deny(`${r.scrapNumber} has already been written off. Stock was not reduced again.`)
  if (r.status !== SCRAP_STATUS.APPROVED) return deny('Only an approved scrap request can create a stock write-off.')
  let record
  const res = postScrapWriteOff(
    { productId: r.productId, hubId: r.hubId, quantity: r.quantity, source: r.stockSource, reference: r.scrapNumber, notes: `${r.reason}${r.batchNumber ? ` · batch ${r.batchNumber}` : ''}${r.remarks ? ` — ${r.remarks}` : ''}` },
    (movement) => {
      const now = new Date().toISOString()
      record = {
        ...r, status: SCRAP_STATUS.COMPLETED, updatedAt: now,
        writeOff: { movementId: movement.id, movementNumber: movement.movementNumber, at: now, by: user.id, byName: user.name, quantity: movement.quantity, previousQuantity: movement.previousQuantity, newQuantity: movement.newQuantity, value: r.value },
        history: [...r.history, histItem(user, 'Stock written off', `${movement.movementNumber} · on hand ${movement.previousQuantity} → ${movement.newQuantity} ${r.unit}`), histItem(user, 'Completed')],
      }
      return getScrapRequests().map((x) => (x.id === id ? record : x))
    },
  )
  if (!res.ok) return deny(res.error)
  return { ok: true, record, movement: res.movement }
}

export const cancelScrap = (id, { reason = '' } = {}) => {
  const user = getCurrentUser()
  const list = getScrapRequests()
  const r = getScrapById(id, list)
  if (!r) return deny('This scrap request no longer exists.')
  const mine = r.requestedBy === user?.id
  if (!(can(user, 'scrap.approve') || (mine && can(user, 'scrap.create')))) return deny('You cannot cancel this scrap request.')
  if (![SCRAP_STATUS.DRAFT, SCRAP_STATUS.PENDING_APPROVAL, SCRAP_STATUS.APPROVED].includes(r.status)) return deny(`${r.scrapNumber} is ${SCRAP_STATUS_META[r.status].label.toLowerCase()} and cannot be cancelled.`)
  const now = new Date().toISOString()
  const record = { ...r, status: SCRAP_STATUS.CANCELLED, cancelledAt: now, cancelledBy: user.id, cancelReason: String(reason).trim(), updatedAt: now, history: [...r.history, histItem(user, 'Cancelled', String(reason).trim())] }
  const res = write(list.map((x) => (x.id === id ? record : x)))
  return res.ok ? { ok: true, record } : deny(res.error)
}

/** Read a file as a data URL (images are downscaled to keep LocalStorage small). */
export const readScrapFile = (file, { maxDim = 1000, quality = 0.7 } = {}) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = () => reject(new Error('The file could not be read.'))
  reader.onload = () => {
    const dataUrl = String(reader.result)
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return resolve({ name: file.name, type: file.type, size: file.size, dataUrl })
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      const out = canvas.toDataURL('image/jpeg', quality)
      resolve({ name: file.name, type: 'image/jpeg', size: Math.round(out.length * 0.75), dataUrl: out })
    }
    img.onerror = () => reject(new Error('This image could not be opened.'))
    img.src = dataUrl
  }
  reader.readAsDataURL(file)
})

const scrapService = { getScrapRequests, getScrapById, saveScrap, submitScrap, approveScrap, rejectScrap, writeOffScrap, cancelScrap, eligibleFor, validateScrap, nextScrapNumber }
export default scrapService
