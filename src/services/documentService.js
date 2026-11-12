/**
 * Central document repository (Phase 5). One collection for every proof / document; vehicle and driver
 * documents are the same records with entityType 'vehicle' / 'driver' (see vehicleDocumentService /
 * driverDocumentService). Files live in documentStorageService; only metadata is stored here.
 *
 * Lifecycle: upload → PENDING_OCR (OCR-enabled types) → OCR_COMPLETED → PENDING_REVIEW (after edits)
 *            → VERIFIED | REJECTED. EXPIRED is derived from the expiry date, never stored.
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { getCurrentUser } from './authService'
import { logActivity } from './activityService'
import { pushNotification } from './notificationService'
import { getDocumentTypeById, getDocumentTypes } from './documentTypeService'
import { deleteFile, saveFile } from './documentStorageService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { ROLES } from '../config/roles'
import { DOCUMENT_STATUS as DS, ENTITY_LABEL, OCR_FIELDS } from '../config/documentConfig'
import { EXPIRY_STATE } from '../config/vmsConfig'
import { clean, isIsoDate } from './validation'
import { scopeOf } from './rbacService'

const read = (key) => storage.getItem(key, []) || []
const deny = (error, errors) => ({ ok: false, error, errors: errors || { form: error } })

export const getDocuments = () => read(K.DOCUMENTS)
export const getDocumentById = (id, list = getDocuments()) => list.find((d) => d.id === id) || null
export const getDocumentsForEntity = (entityType, entityId, list = getDocuments()) => list.filter((d) => d.entityType === entityType && d.entityId === entityId)

/** Days until expiry → category. `on` defaults to today. */
export const expiryState = (date, on = dayjs()) => {
  if (!date || !isIsoDate(date)) return { state: EXPIRY_STATE.MISSING, days: null }
  const days = dayjs(date).startOf('day').diff(dayjs(on).startOf('day'), 'day')
  if (days < 0) return { state: EXPIRY_STATE.EXPIRED, days }
  if (days === 0) return { state: EXPIRY_STATE.TODAY, days }
  if (days <= 7) return { state: EXPIRY_STATE.WEEK, days }
  if (days <= 30) return { state: EXPIRY_STATE.MONTH, days }
  return { state: EXPIRY_STATE.VALID, days }
}

/** Stored status, except a non-rejected document past its expiry date shows as EXPIRED. */
export const effectiveStatus = (doc, on = dayjs()) => (doc.status !== DS.REJECTED && doc.expiryDate && expiryState(doc.expiryDate, on).state === EXPIRY_STATE.EXPIRED ? DS.EXPIRED : doc.status)

/** Owner checks for scoped roles. ctx: { customers, orders, drivers, vehicles, notes, invoices }. */
export const canViewDocument = (user, doc, ctx = {}) => {
  if (!user || !doc || !can(user, 'documents.view') && scopeOf(user) !== ROLES.DRIVER) return false
  const r = scopeOf(user)
  if (r === ROLES.ADMIN || r === ROLES.CUSTOMER_SERVICE) return true
  const t = doc.entityType
  if (r === ROLES.SALES_MANAGER) return ['customer', 'order', 'invoice', 'deliveryNote'].includes(t)
  if (r === ROLES.DISPATCHER) return ['vehicle', 'driver', 'deliveryNote', 'order', 'hub'].includes(t)
  if (r === ROLES.FINANCE) return ['invoice', 'vendor', 'customer', 'order', 'deliveryNote'].includes(t)
  if (r === ROLES.SALESMAN) {
    const customers = ctx.customers || read(K.CUSTOMERS)
    const orders = ctx.orders || read(K.ORDERS)
    if (t === 'customer') return customers.some((c) => c.id === doc.entityId && c.salesRepId === user.id)
    if (t === 'order') return orders.some((o) => o.id === doc.entityId && (o.salesmanId === user.id || o.createdBy === user.id))
    return doc.uploadedBy === user.id
  }
  if (r === ROLES.DRIVER) {
    const drivers = ctx.drivers || read(K.DRIVERS)
    const me = drivers.find((d) => d.userId === user.id)
    if (!me) return false
    if (t === 'driver') return doc.entityId === me.id
    if (t === 'vehicle') return doc.entityId === me.vehicleId
    return doc.uploadedBy === user.id
  }
  return false
}

/** May this user upload a document for this entity type? */
export const canUploadFor = (user, entityType) => {
  if (!user || !can(user, 'documents.upload')) return false
  const r = scopeOf(user)
  // Office users upload vehicle / driver compliance documents only with the VMS upload permission (drivers: own records).
  if (['vehicle', 'driver'].includes(entityType) && r !== ROLES.DRIVER && !can(user, 'vms.documents.upload')) return false
  if (r === ROLES.ADMIN || r === ROLES.CUSTOMER_SERVICE) return true
  if (r === ROLES.DRIVER) return ['driver', 'vehicle', 'deliveryNote'].includes(entityType)
  if (r === ROLES.DISPATCHER) return ['vehicle', 'driver', 'deliveryNote', 'order', 'hub'].includes(entityType)
  if (r === ROLES.FINANCE) return ['invoice', 'vendor', 'customer', 'order'].includes(entityType)
  if (r === ROLES.SALES_MANAGER || r === ROLES.SALESMAN) return ['customer', 'order'].includes(entityType)
  return false
}

/** Verify / reject: Admin and Customer Service (OCR review); vehicle & driver documents: Admin only. */
export const canReview = (user, doc) => {
  if (!user || !doc) return false
  if (['vehicle', 'driver'].includes(doc.entityType)) return scopeOf(user) === ROLES.ADMIN
  return can(user, 'documents.review')
}

/** Validate field values against the type's field catalogue. Returns { field: message }. */
export const validateFields = (type, fields = {}, { forVerify = false } = {}) => {
  const e = {}
  ;(type?.fields || []).forEach((f) => {
    const def = OCR_FIELDS[f]
    const v = fields[f]
    if (v === undefined || v === null || String(v).trim() === '') return
    if (def?.type === 'date' && !isIsoDate(v)) e[f] = 'Enter a valid date.'
    else if (def?.type === 'number' && (Number.isNaN(Number(v)) || Number(v) < 0)) e[f] = 'Enter an amount of 0 or more.'
    else if (def?.pattern && !def.pattern.test(String(v).trim().toUpperCase())) e[f] = `Format looks wrong${def.hint ? ` — ${def.hint}` : ''}.`
  })
  if (forVerify && type?.expiryRequired && !fields.expiryDate) e.expiryDate = 'Expiry date is required to verify this document.'
  if (fields.issueDate && fields.expiryDate && isIsoDate(fields.issueDate) && isIsoDate(fields.expiryDate) && fields.expiryDate < fields.issueDate) e.expiryDate = 'Expiry cannot be before the issue date.'
  return e
}

const entityRecord = (entityType, entityId) => {
  const map = { customer: K.CUSTOMERS, vehicle: K.VEHICLES, driver: K.DRIVERS, order: K.ORDERS, deliveryNote: K.DELIVERY_NOTES, invoice: K.INVOICES, hub: K.HUBS, employee: K.DEMO_USERS }
  return map[entityType] ? read(map[entityType]).find((x) => x.id === entityId) || null : null
}
export const entityName = (entityType, rec) => {
  if (!rec) return ''
  return { vehicle: rec.vehicleNumber, order: rec.orderNumber || 'Draft order', deliveryNote: rec.noteNumber, invoice: rec.invoiceNumber }[entityType] || rec.name || rec.code || rec.id
}
/** Link to the related record in the app (for "related entity navigation"). */
export const entityPath = (entityType, entityId) => ({
  customer: `/customers/${entityId}`, vehicle: `/vms/vehicles/${entityId}`, driver: `/vms/drivers/${entityId}/documents`, order: `/orders/${entityId}`,
  deliveryNote: `/dispatch/delivery-notes/${entityId}`, invoice: `/invoices/${entityId}`, hub: `/hubs/${entityId}`,
}[entityType] || null)

const commit = (list) => storage.setItem(K.DOCUMENTS, list)
const historyEntry = (user, action, note = '', extra = {}) => ({ at: new Date().toISOString(), by: user?.id || null, byName: user?.name || '', action, note, ...extra })

/**
 * Upload a document (async — the file is written first, metadata only after the file is confirmed).
 * input: { typeId, entityType, entityId, entityLabel (vendor/other), name, documentNumber, issueDate, expiryDate, remarks, file }
 */
export const uploadDocument = async (input) => {
  const user = getCurrentUser()
  const type = getDocumentTypeById(input.typeId)
  const errors = {}
  if (!type || !type.active) errors.typeId = 'Choose an active document type.'
  if (!input.entityType) errors.entityType = 'Choose what this document belongs to.'
  if (type && type.entity !== 'any' && type.entity !== input.entityType) errors.typeId = `${type.name} documents belong to a ${ENTITY_LABEL[type.entity]?.toLowerCase()}.`
  const needsMaster = !['vendor', 'other'].includes(input.entityType)
  const rec = needsMaster ? entityRecord(input.entityType, input.entityId) : null
  if (needsMaster && !rec) errors.entityId = 'Select the related record.'
  if (!needsMaster && !clean(input.entityLabel)) errors.entityLabel = input.entityType === 'vendor' ? 'Enter the vendor name.' : 'Describe what this document relates to.'
  if (!input.file) errors.file = 'Choose a file to upload.'
  if (user && input.entityType && !canUploadFor(user, input.entityType)) errors.form = 'Your role cannot upload documents for this record.'
  if (rec && user && !canViewDocument(user, { entityType: input.entityType, entityId: input.entityId, uploadedBy: user.id })) errors.entityId = 'You can only upload documents for your own records.'
  const fieldErrors = validateFields(type, { issueDate: input.issueDate, expiryDate: input.expiryDate })
  Object.assign(errors, fieldErrors)
  if (Object.keys(errors).length) return deny(Object.values(errors)[0], errors)

  let file
  try { file = await saveFile(input.file) } catch (e) { return deny(e.message, { file: e.message }) }
  const now = new Date().toISOString()
  const label = needsMaster ? entityName(input.entityType, rec) : clean(input.entityLabel)
  const all = getDocuments()
  const doc = {
    id: uid('doc'),
    documentNumberRef: `DOC-${String(all.length + 1).padStart(5, '0')}`,
    name: clean(input.name) || `${type.name} — ${label}`,
    typeId: type.id, typeCode: type.code, entityType: input.entityType, entityId: needsMaster ? input.entityId : '', entityLabel: label,
    documentNumber: clean(input.documentNumber) || '', issueDate: input.issueDate || '', expiryDate: input.expiryDate || '',
    status: type.ocrEnabled ? DS.PENDING_OCR : type.verificationRequired ? DS.PENDING_REVIEW : DS.VERIFIED,
    ...file, demoRecord: false,
    ocrProvider: null, ocrFields: {}, ocrOriginal: {}, ocrProcessedAt: null,
    verifiedBy: type.ocrEnabled || type.verificationRequired ? null : user?.id, verifiedAt: type.ocrEnabled || type.verificationRequired ? null : now,
    rejectedBy: null, rejectedAt: null, reviewRemarks: '', remarks: clean(input.remarks) || '',
    uploadedBy: user?.id || null, uploadedAt: now, updatedAt: now,
    history: [historyEntry(user, 'UPLOADED', `${file.fileName} · ${(file.fileSize / 1024).toFixed(0)} KB · temporary browser file`, { fileId: file.fileId })],
  }
  const res = commit([doc, ...all])
  if (!res.ok) { await deleteFile(file.fileId); return deny(res.error) }
  logActivity({ type: 'document', message: `uploaded ${doc.name}`, entityType: 'document', entityId: doc.id })
  if (doc.status !== DS.VERIFIED) {
    const reviewers = ['vehicle', 'driver'].includes(doc.entityType) ? [ROLES.ADMIN] : [ROLES.ADMIN, ROLES.CUSTOMER_SERVICE]
    pushNotification({ title: `Document to review: ${type.name}`, message: `${doc.entityLabel} · uploaded by ${user?.name || 'a user'}`, type: 'info', roles: reviewers, link: `/documents/${doc.id}/review` })
  }
  return { ok: true, record: doc }
}

/** Replace the file of a document; the old file stays referenced in history. Status returns to OCR / review. */
export const replaceDocumentFile = async (id, newFile) => {
  const user = getCurrentUser()
  const doc = getDocumentById(id)
  if (!doc) return deny('This document no longer exists.')
  if (!canUploadFor(user, doc.entityType) || !canViewDocument(user, doc)) return deny('You cannot replace this document.')
  const type = getDocumentTypeById(doc.typeId)
  let file
  try { file = await saveFile(newFile) } catch (e) { return deny(e.message, { file: e.message }) }
  const record = {
    ...doc, ...file, demoRecord: false, status: type?.ocrEnabled ? DS.PENDING_OCR : DS.PENDING_REVIEW,
    verifiedBy: null, verifiedAt: null, rejectedBy: null, rejectedAt: null, updatedAt: new Date().toISOString(),
    history: [...doc.history, historyEntry(user, 'FILE_REPLACED', `${file.fileName} replaces ${doc.fileName || 'the demo record'}`, { fileId: file.fileId, previousFileId: doc.fileId || null })],
  }
  const res = commit(getDocuments().map((d) => (d.id === id ? record : d)))
  if (!res.ok) return deny(res.error)
  return { ok: true, record }
}

/** Save reviewed / edited field values (no decision yet). */
export const saveReview = (id, { fields = {}, documentNumber, issueDate, expiryDate, remarks } = {}) => {
  const user = getCurrentUser()
  const doc = getDocumentById(id)
  if (!doc) return deny('This document no longer exists.')
  if (!canReview(user, doc) && !(doc.uploadedBy === user?.id && doc.status !== DS.VERIFIED)) return deny('You cannot edit this document.')
  if (doc.status === DS.VERIFIED) return deny('Verified documents are locked. Replace the file to start a new review.')
  const type = getDocumentTypeById(doc.typeId)
  const merged = { ...doc.ocrFields, ...fields }
  const values = { ...merged, documentNumber: documentNumber ?? merged.documentNumber ?? doc.documentNumber, issueDate: issueDate ?? merged.issueDate ?? doc.issueDate, expiryDate: expiryDate ?? merged.expiryDate ?? doc.expiryDate }
  const errors = validateFields(type, values)
  if (Object.keys(errors).length) return deny(Object.values(errors)[0], errors)
  const changed = Object.keys(values).filter((k) => String(values[k] ?? '') !== String(doc.ocrOriginal?.[k] ?? '') && doc.ocrOriginal && k in doc.ocrOriginal)
  const record = {
    ...doc, ocrFields: values, documentNumber: clean(values.documentNumber) || doc.documentNumber, issueDate: values.issueDate || '', expiryDate: values.expiryDate || '',
    remarks: remarks !== undefined ? clean(remarks) : doc.remarks,
    status: [DS.PENDING_OCR, DS.OCR_COMPLETED, DS.REJECTED].includes(doc.status) ? DS.PENDING_REVIEW : doc.status,
    updatedAt: new Date().toISOString(),
    history: [...doc.history, historyEntry(user, 'FIELDS_EDITED', changed.length ? `Edited: ${changed.map((k) => OCR_FIELDS[k]?.label || k).join(', ')}` : 'Values accepted as extracted')],
  }
  const res = commit(getDocuments().map((d) => (d.id === id ? record : d)))
  if (!res.ok) return deny(res.error)
  return { ok: true, record }
}

/** Sync a verified compliance date onto the vehicle / driver record (only moves the date forward). */
const syncEntityExpiry = (doc, type) => {
  if (!doc.expiryDate) return []
  if (doc.entityType === 'vehicle' && type.vehicleField) {
    const list = read(K.VEHICLES)
    const v = list.find((x) => x.id === doc.entityId)
    if (v && (!v[type.vehicleField] || doc.expiryDate > v[type.vehicleField])) return [[K.VEHICLES, list.map((x) => (x.id === v.id ? { ...x, [type.vehicleField]: doc.expiryDate, updatedAt: new Date().toISOString() } : x))]]
  }
  if (doc.entityType === 'driver' && type.driverField) {
    const list = read(K.DRIVERS)
    const d = list.find((x) => x.id === doc.entityId)
    const patch = { [type.driverField]: doc.expiryDate, ...(type.code === 'DRV_LICENSE' && doc.documentNumber ? { licenseNumber: doc.documentNumber } : {}) }
    if (d && (!d[type.driverField] || doc.expiryDate > d[type.driverField])) return [[K.DRIVERS, list.map((x) => (x.id === d.id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x))]]
  }
  return []
}

export const verifyDocument = (id, { remarks = '', fields } = {}) => {
  const user = getCurrentUser()
  const doc = getDocumentById(id)
  if (!doc) return deny('This document no longer exists.')
  if (!canReview(user, doc)) return deny(['vehicle', 'driver'].includes(doc.entityType) ? 'Only the Admin can verify vehicle and driver documents.' : 'Only Admin or Customer Service can verify documents.')
  if (doc.status === DS.VERIFIED) return deny(`${doc.name} is already verified.`)
  if (doc.status === DS.PENDING_OCR && getDocumentTypeById(doc.typeId)?.ocrEnabled && !doc.demoRecord) return deny('Run OCR (or enter the fields manually and save) before verifying.')
  const type = getDocumentTypeById(doc.typeId)
  const values = { ...doc.ocrFields, ...(fields || {}), documentNumber: (fields?.documentNumber ?? doc.ocrFields?.documentNumber ?? doc.documentNumber), issueDate: fields?.issueDate ?? doc.issueDate, expiryDate: fields?.expiryDate ?? doc.expiryDate }
  const errors = validateFields(type, values, { forVerify: true })
  if (Object.keys(errors).length) return deny(Object.values(errors)[0], errors)
  const now = new Date().toISOString()
  const record = {
    ...doc, ocrFields: values, documentNumber: clean(values.documentNumber) || doc.documentNumber, issueDate: values.issueDate || '', expiryDate: values.expiryDate || '',
    status: DS.VERIFIED, verifiedBy: user.id, verifiedAt: now, rejectedBy: null, rejectedAt: null, reviewRemarks: clean(remarks) || '', updatedAt: now,
    history: [...doc.history, historyEntry(user, 'VERIFIED', clean(remarks) || '')],
  }
  const res = storage.transaction([[K.DOCUMENTS, getDocuments().map((d) => (d.id === id ? record : d))], ...syncEntityExpiry(record, type)])
  if (!res.ok) return deny(res.error)
  logActivity({ type: 'document', message: `verified ${record.name}`, entityType: 'document', entityId: id })
  return { ok: true, record }
}

export const rejectDocument = (id, { remarks = '' } = {}) => {
  const user = getCurrentUser()
  const doc = getDocumentById(id)
  if (!doc) return deny('This document no longer exists.')
  if (!canReview(user, doc)) return deny('You cannot review this document.')
  if (!can(user, 'documents.reject')) return deny('You do not have permission to reject documents.')
  if (doc.status === DS.REJECTED) return deny(`${doc.name} is already rejected.`)
  if (!clean(remarks)) return deny('Add a reason so the uploader knows what to fix.', { remarks: 'A rejection reason is required.' })
  const now = new Date().toISOString()
  const record = { ...doc, status: DS.REJECTED, rejectedBy: user.id, rejectedAt: now, verifiedBy: null, verifiedAt: null, reviewRemarks: clean(remarks), updatedAt: now, history: [...doc.history, historyEntry(user, 'REJECTED', clean(remarks))] }
  const res = commit(getDocuments().map((d) => (d.id === id ? record : d)))
  if (!res.ok) return deny(res.error)
  if (doc.uploadedBy && doc.uploadedBy !== user.id) pushNotification({ title: `Document rejected: ${doc.name}`, message: clean(remarks), type: 'warning', userIds: [doc.uploadedBy], link: `/documents/${id}` })
  logActivity({ type: 'document', message: `rejected ${record.name}`, entityType: 'document', entityId: id })
  return { ok: true, record }
}

/** Internal: apply an OCR result (used by ocrService). */
export const applyOcrResult = (id, result, user) => {
  const doc = getDocumentById(id)
  if (!doc) return deny('This document no longer exists.')
  const record = {
    ...doc, ocrProvider: result.provider, ocrOriginal: result.fields, ocrFields: { ...result.fields }, ocrProcessedAt: result.processedAt,
    documentNumber: doc.documentNumber || result.fields.documentNumber || result.fields.licenseNumber || result.fields.gstNumber || result.fields.panNumber || result.fields.invoiceNumber || '',
    issueDate: doc.issueDate || result.fields.issueDate || '', expiryDate: doc.expiryDate || result.fields.expiryDate || '',
    status: doc.status === DS.VERIFIED ? DS.VERIFIED : DS.OCR_COMPLETED, updatedAt: result.processedAt,
    history: [...doc.history, historyEntry(user, 'OCR_PROCESSED', `${result.simulated ? 'Simulated OCR' : result.providerLabel} · ${Object.values(result.fields).filter(Boolean).length} fields`)],
  }
  return { ok: true, record }
}

export const searchDocuments = (q, f = {}, list = getDocuments(), { types = getDocumentTypes() } = {}) => {
  const query = (q || '').trim().toLowerCase()
  const T = Object.fromEntries(types.map((t) => [t.id, t]))
  return list.filter((d) => {
    if (query && ![d.name, d.documentNumber, d.entityLabel, d.documentNumberRef, d.fileName, T[d.typeId]?.name].some((v) => String(v || '').toLowerCase().includes(query))) return false
    if (f.typeId && d.typeId !== f.typeId) return false
    if (f.entityType && d.entityType !== f.entityType) return false
    if (f.status && effectiveStatus(d) !== f.status) return false
    if (f.from && String(d.uploadedAt).slice(0, 10) < f.from) return false
    if (f.to && String(d.uploadedAt).slice(0, 10) > f.to) return false
    if (f.expiry && expiryState(d.expiryDate).state !== f.expiry) return false
    return true
  })
}

const documentService = { getDocuments, getDocumentById, getDocumentsForEntity, uploadDocument, replaceDocumentFile, saveReview, verifyDocument, rejectDocument, searchDocuments, effectiveStatus, expiryState, canViewDocument, canReview, canUploadFor }
export default documentService
