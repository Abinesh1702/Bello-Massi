/**
 * OCR service (Phase 5) with pluggable providers.
 *
 *   MOCK     — SIMULATED OCR. It does not read the image: it pre-fills fields from the linked master record
 *              (vehicle, driver, customer, order…), the values already typed on the upload form and the file
 *              name. Every result is stored with simulated: true and labelled "Simulated OCR" in the UI.
 *   BROWSER  — placeholder for an in-browser OCR library. No such library is bundled (to keep the app light),
 *              so this provider reports itself unavailable instead of pretending.
 *   BACKEND  — posts the stored file to the integration gateway's /ocr/process endpoint. Available only
 *              when VITE_INTEGRATION_GATEWAY_URL is configured; the gateway's answer is used as-is.
 *
 * All extracted values remain editable; original values are kept for the audit trail.
 */
import storage from './storageService'
import { getCurrentUser } from './authService'
import { applyOcrResult, getDocumentById, getDocuments, validateFields } from './documentService'
import { getDocumentTypeById, getDocumentTypes } from './documentTypeService'
import { getFile } from './documentStorageService'
import { callGateway, isGatewayConfigured } from './integrationGateway'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { DOCUMENT_STATUS as DS, OCR_PROVIDERS } from '../config/documentConfig'

const read = (key) => storage.getItem(key, []) || []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export const getProviders = () => [
  { ...OCR_PROVIDERS.MOCK, available: true },
  { ...OCR_PROVIDERS.BROWSER, available: false, unavailableReason: 'No browser OCR library is installed in this prototype.' },
  { ...OCR_PROVIDERS.BACKEND, available: isGatewayConfigured(), unavailableReason: 'Set VITE_INTEGRATION_GATEWAY_URL to enable the backend OCR service.' },
]

export const getSupportedDocumentTypes = (types = getDocumentTypes()) => types.filter((t) => t.active && t.ocrEnabled)
export const validateExtractedFields = (type, fields) => validateFields(type, fields)
export const getOCRHistory = (documentId, all = read(K.OCR_RESULTS)) => all.filter((r) => r.documentId === documentId).sort((a, b) => (a.processedAt < b.processedAt ? 1 : -1))

const entityOf = (doc) => {
  const key = { customer: K.CUSTOMERS, vehicle: K.VEHICLES, driver: K.DRIVERS, order: K.ORDERS, deliveryNote: K.DELIVERY_NOTES, invoice: K.INVOICES, hub: K.HUBS, employee: K.DEMO_USERS }[doc.entityType]
  return key ? read(key).find((x) => x.id === doc.entityId) || null : null
}

/** Simulated extraction: values a reviewer would expect, sourced from records — never from the image. */
export const extractFields = (doc, type) => {
  const e = entityOf(doc) || {}
  const fileHint = String(doc.fileName || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim()
  const address = [e.addressLine1, e.addressLine2, e.city, e.state, e.pincode].filter(Boolean).join(', ') || e.address || ''
  const pool = {
    documentNumber: doc.documentNumber || (/\d{4,}/.test(fileHint) ? fileHint.match(/[A-Z0-9/-]*\d{4,}[A-Z0-9/-]*/i)?.[0] || '' : ''),
    name: e.ownerName || e.name || e.customerName || doc.entityLabel || '',
    address,
    dateOfBirth: '',
    issueDate: doc.issueDate || '',
    expiryDate: doc.expiryDate || (type?.vehicleField ? e[type.vehicleField] : type?.driverField ? e[type.driverField] : '') || '',
    gstNumber: e.gstNumber || '',
    panNumber: e.panNumber || '',
    vehicleRegistrationNumber: e.vehicleNumber || '',
    licenseNumber: e.licenseNumber || '',
    customerName: e.customerName || (doc.entityType === 'customer' ? e.name : '') || '',
    vendorName: doc.entityType === 'vendor' ? doc.entityLabel : '',
    invoiceNumber: e.invoiceNumber || '',
    invoiceDate: e.invoiceDate || '',
    invoiceAmount: e.totals ? e.totals.taxableAmount : '',
    taxAmount: e.totals ? e.totals.taxAmount : '',
    totalAmount: e.totals ? e.totals.grandTotal : e.totalAmount ?? '',
  }
  return Object.fromEntries((type?.fields || []).map((f) => [f, pool[f] ?? '']))
}

/** Persist an OCR result and apply it to the document in one transaction. */
export const saveOCRResult = (documentId, result) => {
  const user = getCurrentUser()
  const applied = applyOcrResult(documentId, result, user)
  if (!applied.ok) return applied
  const res = storage.transaction([
    [K.OCR_RESULTS, [result, ...read(K.OCR_RESULTS)]],
    [K.DOCUMENTS, getDocuments().map((d) => (d.id === documentId ? applied.record : d))],
  ])
  return res.ok ? { ok: true, record: applied.record, result } : { ok: false, error: res.error }
}

/** Run OCR for a document. provider: 'MOCK' | 'BROWSER' | 'BACKEND'. Async. */
export const processDocument = async (documentId, { provider = 'MOCK' } = {}) => {
  const user = getCurrentUser()
  const doc = getDocumentById(documentId)
  if (!doc) return { ok: false, error: 'This document no longer exists.' }
  const type = getDocumentTypeById(doc.typeId)
  if (!type?.ocrEnabled) return { ok: false, error: `OCR is switched off for ${type?.name || 'this document type'}. Enter the fields manually.` }
  if (doc.status === DS.VERIFIED) return { ok: false, error: 'Verified documents are locked. Replace the file to process it again.' }
  const p = getProviders().find((x) => x.id === provider)
  if (!p?.available) return { ok: false, error: p?.unavailableReason || 'Unknown OCR provider.' }
  const started = Date.now()

  let fields
  let confidence = null
  if (provider === 'MOCK') {
    await wait(450)
    fields = extractFields(doc, type)
  } else {
    // BACKEND — send the stored file; the gateway runs real OCR and returns { fields, confidence }
    const file = await getFile(doc.fileId)
    if (!file?.blob) return { ok: false, error: 'The file is not stored in this browser, so it cannot be sent for OCR.' }
    const form = new FormData()
    form.append('file', file.blob, file.name)
    form.append('documentType', type.code)
    form.append('fields', JSON.stringify(type.fields))
    const res = await callGateway('/ocr/process', { method: 'POST', formData: form, timeoutMs: 60000 })
    if (!res.ok) return { ok: false, error: `Backend OCR failed: ${res.error}` }
    fields = Object.fromEntries(type.fields.map((f) => [f, res.data?.fields?.[f] ?? '']))
    confidence = Number(res.data?.confidence) || null
  }
  const filled = Object.values(fields).filter((v) => v !== '' && v !== null && v !== undefined).length
  const result = {
    id: uid('ocr'), documentId, provider, providerLabel: p.label, simulated: provider === 'MOCK',
    processedAt: new Date().toISOString(), processedBy: user?.id || null, fields,
    confidence: confidence ?? (provider === 'MOCK' ? Math.round((filled / Math.max(1, type.fields.length)) * 100) / 100 : null),
    durationMs: Date.now() - started,
    note: provider === 'MOCK' ? 'Simulated OCR — values pre-filled from the linked record, not read from the image.' : `Extracted by ${p.label}.`,
  }
  return saveOCRResult(documentId, result)
}

export const reprocessDocument = (documentId, opts) => processDocument(documentId, opts)

const ocrService = { processDocument, extractFields, getSupportedDocumentTypes, validateExtractedFields, saveOCRResult, getOCRHistory, reprocessDocument, getProviders }
export default ocrService
