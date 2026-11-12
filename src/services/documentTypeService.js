/** Dynamic document types (Phase 5) — Admin-configurable without code changes. */
import storage from './storageService'
import { getCurrentUser } from './authService'
import { logActivity } from './activityService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { DOCUMENT_ENTITIES, OCR_FIELDS } from '../config/documentConfig'
import { clean, required } from './validation'

export const getDocumentTypes = () => storage.getItem(K.DOCUMENT_TYPES, []) || []
export const getDocumentTypeById = (id, list = getDocumentTypes()) => list.find((t) => t.id === id) || null
export const getDocumentTypeByCode = (code, list = getDocumentTypes()) => list.find((t) => t.code === code) || null
/** Active types usable for an entity ('any' types apply everywhere). */
export const typesForEntity = (entity, list = getDocumentTypes()) => list.filter((t) => t.active && (t.entity === entity || t.entity === 'any'))

export const emptyDocumentType = () => ({
  name: '', code: '', description: '', entity: 'any', fields: ['documentNumber'], ocrEnabled: true, verificationRequired: true,
  expiryRequired: false, warningDays: 30, active: true,
})

export const validateDocumentType = (input, { id = null } = {}) => {
  const e = {}
  const list = getDocumentTypes()
  const set = (f, m) => { if (m && !e[f]) e[f] = m }
  set('name', required(input.name, 'Document type name'))
  set('code', required(input.code, 'Document code'))
  const code = clean(input.code || '').toUpperCase()
  if (code && !/^[A-Z0-9_]{2,20}$/.test(code)) set('code', 'Use 2–20 capital letters, numbers or underscores, e.g. FSSAI_LICENSE.')
  if (code && list.some((t) => t.id !== id && t.code === code)) set('code', 'This code is already used by another document type.')
  if (input.name && list.some((t) => t.id !== id && t.name.toLowerCase() === clean(input.name).toLowerCase())) set('name', 'A document type with this name exists.')
  if (![...DOCUMENT_ENTITIES.map((x) => x.value), 'any'].includes(input.entity)) set('entity', 'Choose the entity this document belongs to.')
  if (!Array.isArray(input.fields) || !input.fields.length) set('fields', 'Pick at least one field to capture.')
  else if (input.fields.some((f) => !OCR_FIELDS[f])) set('fields', 'Unknown field selected.')
  if (input.expiryRequired && !input.fields?.includes('expiryDate')) set('fields', 'Expiry is required, so include the “Expiry date” field.')
  const wd = Number(input.warningDays)
  if (!Number.isInteger(wd) || wd < 0 || wd > 365) set('warningDays', 'Enter 0–365 days.')
  if (id) {
    const existing = getDocumentTypeById(id, list)
    if (existing?.builtIn && code !== existing.code) set('code', 'Built-in document codes cannot change (VMS rules refer to them).')
  }
  return e
}

const normalise = (input) => ({
  name: clean(input.name), code: clean(input.code).toUpperCase(), description: clean(input.description) || '', entity: input.entity,
  fields: [...new Set(input.fields)], ocrEnabled: Boolean(input.ocrEnabled), verificationRequired: Boolean(input.verificationRequired),
  expiryRequired: Boolean(input.expiryRequired), warningDays: Number(input.warningDays), active: Boolean(input.active),
})

const guard = () => {
  const user = getCurrentUser()
  return can(user, 'documents.types') ? user : null
}

export const createDocumentType = (input) => {
  const user = guard()
  if (!user) return { ok: false, error: 'Only the Admin can configure document types.' }
  const errors = validateDocumentType(input)
  if (Object.keys(errors).length) return { ok: false, errors, error: Object.values(errors)[0] }
  const now = new Date().toISOString()
  const record = { id: uid('dt'), ...normalise(input), vehicleField: null, driverField: null, builtIn: false, createdAt: now, updatedAt: now, createdBy: user.id }
  const res = storage.setItem(K.DOCUMENT_TYPES, [...getDocumentTypes(), record])
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'document', message: `created document type ${record.name}`, entityType: 'documentType', entityId: record.id })
  return { ok: true, record }
}

export const updateDocumentType = (id, input) => {
  const user = guard()
  if (!user) return { ok: false, error: 'Only the Admin can configure document types.' }
  const list = getDocumentTypes()
  const existing = getDocumentTypeById(id, list)
  if (!existing) return { ok: false, error: 'This document type no longer exists.' }
  const errors = validateDocumentType(input, { id })
  if (Object.keys(errors).length) return { ok: false, errors, error: Object.values(errors)[0] }
  const record = { ...existing, ...normalise(input), updatedAt: new Date().toISOString() }
  const res = storage.setItem(K.DOCUMENT_TYPES, list.map((t) => (t.id === id ? record : t)))
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'document', message: `updated document type ${record.name}`, entityType: 'documentType', entityId: id })
  return { ok: true, record }
}

export default { getDocumentTypes, getDocumentTypeById, getDocumentTypeByCode, typesForEntity, createDocumentType, updateDocumentType, validateDocumentType }
