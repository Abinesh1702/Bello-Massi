/**
 * Audit log — reusable across every phase.
 *
 * 1. Automatic: a storage write hook compares the previous and new value of audited collections and records
 *    CREATE / EDIT / DELETE / STATUS_CHANGE / APPROVAL / REJECTION / SETTINGS_CHANGE entries with the changed fields'
 *    previous and new values. Any service that writes through storageService is audited without extra code.
 * 2. Explicit: logAudit() for events that are not a data change (login, logout, failed login, export, import, reset).
 *
 * Secrets (passwords, tokens, API keys) are never written to the log — they are shown as "(changed)".
 * Bulk writes (seed, reset, import, migration) run with hooks suspended and are logged once as a summary.
 * Prototype: the log lives in this browser and can be altered by anyone with access to it — it is not tamper-proof.
 */
import storage from './storageService'
import { MAX_AUDIT_LOGS, STORAGE_KEYS } from '../utils/constants'
import { isPlainObject } from '../utils/helpers'

const K = STORAGE_KEYS

export const AUDIT_ACTIONS = {
  LOGIN: { label: 'Login', tone: 'info' },
  LOGOUT: { label: 'Logout', tone: 'neutral' },
  LOGIN_FAILED: { label: 'Failed login', tone: 'danger' },
  ACCOUNT_LOCKED: { label: 'Account locked', tone: 'danger' },
  CREATE: { label: 'Create', tone: 'success' },
  EDIT: { label: 'Edit', tone: 'brand' },
  DELETE: { label: 'Delete', tone: 'danger' },
  APPROVAL: { label: 'Approval', tone: 'success' },
  REJECTION: { label: 'Rejection', tone: 'danger' },
  STATUS_CHANGE: { label: 'Status change', tone: 'warning' },
  SETTINGS_CHANGE: { label: 'Settings change', tone: 'accent' },
  PASSWORD_CHANGE: { label: 'Password change', tone: 'warning' },
  EXPORT: { label: 'Export', tone: 'neutral' },
  IMPORT: { label: 'Import', tone: 'warning' },
  RESET: { label: 'Reset', tone: 'warning' },
  SYSTEM: { label: 'System', tone: 'neutral' },
}

const SECRET = /pass(word)?|secret|token|api_?key|authorization|credential/i
const IGNORED_FIELDS = new Set(['updatedAt', 'updatedBy', 'history', 'timeline', 'lastLoginAt', 'createdAt', 'createdBy', 'readBy', 'statusHistory', 'events'])
const STATUS_FIELDS = ['orderStatus', 'status']
const LABEL_FIELDS = ['scrapNumber', 'callNumber', 'orderNumber', 'dispatchNumber', 'invoiceNumber', 'noteNumber', 'number', 'vehicleNumber', 'name', 'code', 'email', 'title', 'subject']

/** Audited collections: storage key → module, entity and options. */
const COLLECTIONS = {
  [K.DEMO_USERS]: { module: 'settings', entity: 'User', ignore: ['avatarImage'] },
  [K.ROLES]: { module: 'settings', entity: 'Role' },
  [K.CUSTOMERS]: { module: 'customers', entity: 'Customer' },
  [K.PRODUCTS]: { module: 'products', entity: 'Product' },
  [K.HUBS]: { module: 'warehouse', entity: 'Hub' },
  [K.ORDERS]: { module: 'orders', entity: 'Order', ignore: ['items', 'stockWarning'] },
  [K.DISPATCHES]: { module: 'dispatch', entity: 'Dispatch', ignore: ['stops'] },
  [K.DELIVERIES]: { module: 'delivery', entity: 'Delivery', ignore: ['items', 'proof'] },
  [K.DRIVERS]: { module: 'dispatch', entity: 'Driver' },
  [K.VEHICLES]: { module: 'vms', entity: 'Vehicle' },
  [K.DISPATCH_ZONES]: { module: 'dispatch', entity: 'Zone' },
  [K.STOCK_RECEIPTS]: { module: 'warehouse', entity: 'Stock receipt' },
  [K.STOCK_TRANSFERS]: { module: 'warehouse', entity: 'Stock transfer' },
  [K.STOCK_ADJUSTMENTS]: { module: 'inventory', entity: 'Stock adjustment' },
  [K.INVOICES]: { module: 'invoices', entity: 'Invoice', ignore: ['lines', 'snapshot', 'calculationInput'] },
  [K.INVOICE_TEMPLATES]: { module: 'invoices', entity: 'Invoice template', ignore: ['fields', 'layout'] },
  [K.DOCUMENTS]: { module: 'documents', entity: 'Document', ignore: ['ocrFields', 'fileData', 'preview', 'pages'] },
  [K.DOCUMENT_TYPES]: { module: 'documents', entity: 'Document type' },
  [K.EMAIL_TEMPLATES]: { module: 'email', entity: 'Email template' },
  [K.WHATSAPP_TEMPLATES]: { module: 'whatsapp', entity: 'WhatsApp template' },
  [K.NOTIFICATION_TEMPLATES]: { module: 'email', entity: 'Notification rule' },
  [K.EMAIL_HISTORY]: { module: 'email', entity: 'Email', createOnly: true },
  [K.WHATSAPP_MESSAGES]: { module: 'whatsapp', entity: 'WhatsApp message', createOnly: true },
  [K.REPLENISHMENT_DRAFTS]: { module: 'procurement', entity: 'Replenishment draft', ignore: ['lines'] },
  [K.FORECASTS]: { module: 'ai', entity: 'Forecast', createOnly: true },
  [K.SCRAP_REQUESTS]: { module: 'inventory', entity: 'Scrap request', ignore: ['photos', 'documents', 'history'] },
  [K.CALL_HISTORY]: { module: 'communication', entity: 'Call log', ignore: ['notes'] },
}

/** Settings-like objects: storage key → module and label. */
const SETTINGS = {
  [K.COMPANY]: { module: 'settings', entity: 'Company profile' },
  [K.VMS_SETTINGS]: { module: 'vms', entity: 'VMS compliance rules' },
  [K.EMAIL_SETTINGS]: { module: 'email', entity: 'Email settings' },
  [K.OPENWA_SETTINGS]: { module: 'whatsapp', entity: 'OpenWA settings' },
  [K.COMMUNICATION_SETTINGS]: { module: 'email', entity: 'Communication settings' },
  [K.AI_SETTINGS]: { module: 'ai', entity: 'AI settings' },
  [K.JARVIS_SETTINGS]: { module: 'ai', entity: 'Jarvis settings' },
  [K.INVOICE_SETTINGS]: { module: 'invoices', entity: 'Invoice numbering', ignore: ['lastNumber'] },
  [K.FORECAST_SETTINGS]: { module: 'ai', entity: 'Forecast settings', ignore: ['lastForecastNumber'] },
}

const ORG_SECTIONS = { branches: 'Branch', businessUnits: 'Business unit', departments: 'Department', designations: 'Designation', warehouses: 'Warehouse' }

/* ---------- Helpers ---------- */

const currentActor = () => {
  const s = storage.getItem(K.SESSION, null, { scope: 'local' }) || storage.getItem(K.SESSION, null, { scope: 'session' })
  if (!s) return { userId: null, userName: 'System', userRole: null }
  const u = (storage.getItem(K.DEMO_USERS, []) || []).find((x) => x.id === s.userId)
  return u ? { userId: u.id, userName: u.name, userRole: u.role } : { userId: null, userName: 'System', userRole: null }
}

const short = (text, n = 140) => (text.length > n ? `${text.slice(0, n - 1)}…` : text)

export const formatAuditValue = (v) => {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'number' || typeof v === 'string') return short(String(v))
  if (Array.isArray(v)) return v.every((x) => x === null || typeof x !== 'object') ? short(v.join(', ') || '—') : `${v.length} item${v.length === 1 ? '' : 's'}`
  try { return short(JSON.stringify(v)) } catch { return '[object]' }
}

const fieldLabel = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_.]/g, ' ').replace(/^./, (c) => c.toUpperCase())

const labelOf = (rec) => {
  if (!isPlainObject(rec)) return ''
  const f = LABEL_FIELDS.find((k) => rec[k])
  return f ? String(rec[f]) : rec.id || ''
}

const same = (a, b) => {
  if (a === b) return true
  try { return JSON.stringify(a) === JSON.stringify(b) } catch { return false }
}

/** Changed top-level fields with previous / new display values. */
export const diffFields = (prev = {}, next = {}, ignore = []) => {
  const skip = new Set([...IGNORED_FIELDS, ...ignore])
  const keys = [...new Set([...Object.keys(prev || {}), ...Object.keys(next || {})])].filter((k) => !skip.has(k))
  return keys.filter((k) => !same(prev?.[k], next?.[k])).map((k) => {
    if (SECRET.test(k)) return { field: fieldLabel(k).replace(/ hash$/i, ''), previous: prev?.[k] ? '••••••' : '—', next: next?.[k] ? '•••••• (changed)' : '—', secret: true }
    if (k === 'permissions' && Array.isArray(prev?.[k]) && Array.isArray(next?.[k])) {
      const a = new Set(prev[k])
      const b = new Set(next[k])
      const added = next[k].filter((x) => !a.has(x))
      const removed = prev[k].filter((x) => !b.has(x))
      return { field: 'Permissions', previous: `${prev[k].length} permissions`, next: `${next[k].length} permissions${added.length ? ` · +${added.slice(0, 4).join(', +')}${added.length > 4 ? '…' : ''}` : ''}${removed.length ? ` · −${removed.slice(0, 4).join(', −')}${removed.length > 4 ? '…' : ''}` : ''}` }
    }
    return { field: fieldLabel(k), previous: formatAuditValue(prev?.[k]), next: formatAuditValue(next?.[k]) }
  })
}

const classify = (prev, next, changes) => {
  if (changes.length && changes.every((c) => c.secret)) return 'PASSWORD_CHANGE'
  const sf = STATUS_FIELDS.find((f) => prev?.[f] !== undefined && prev[f] !== next?.[f])
  if (!sf) return 'EDIT'
  const v = String(next?.[sf] || '').toUpperCase()
  if (['APPROVED', 'VERIFIED'].includes(v)) return 'APPROVAL'
  if (v === 'REJECTED') return 'REJECTION'
  return 'STATUS_CHANGE'
}

const ACTION_VERB = { CREATE: 'created', DELETE: 'deleted', EDIT: 'updated', STATUS_CHANGE: 'changed the status of', APPROVAL: 'approved', REJECTION: 'rejected', PASSWORD_CHANGE: 'changed the password of', SETTINGS_CHANGE: 'changed' }

const entry = (actor, { action, module, entity, recordId = null, recordLabel = '', description, changes = [] }) => ({
  id: `aud-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
  at: new Date().toISOString(),
  ...actor,
  action,
  module,
  entity,
  recordId,
  recordLabel,
  description: description || `${actor.userName} ${ACTION_VERB[action] || action.toLowerCase()} ${entity.toLowerCase()} ${recordLabel}`.trim(),
  changes: changes.slice(0, 25),
})

const write = (entries) => {
  if (!entries.length) return
  storage.updateItem(K.AUDIT_LOGS, (prev) => [...entries.reverse(), ...(Array.isArray(prev) ? prev : [])].slice(0, MAX_AUDIT_LOGS), [])
}

const diffCollection = (actor, cfg, prev, next) => {
  const before = new Map((Array.isArray(prev) ? prev : []).filter((r) => r && r.id).map((r) => [r.id, r]))
  const after = new Map((Array.isArray(next) ? next : []).filter((r) => r && r.id).map((r) => [r.id, r]))
  const out = []
  after.forEach((rec, id) => {
    const old = before.get(id)
    if (!old) {
      out.push(entry(actor, { action: 'CREATE', module: cfg.module, entity: cfg.entity, recordId: id, recordLabel: labelOf(rec) }))
      return
    }
    if (cfg.createOnly || old === rec) return
    const changes = diffFields(old, rec, cfg.ignore)
    if (!changes.length) return
    const action = classify(old, rec, changes)
    const sf = STATUS_FIELDS.find((f) => old[f] !== undefined && old[f] !== rec[f])
    const what = action === 'STATUS_CHANGE' && sf ? ` (${formatAuditValue(old[sf])} → ${formatAuditValue(rec[sf])})` : action === 'EDIT' ? ` — ${changes.slice(0, 4).map((c) => c.field.toLowerCase()).join(', ')}${changes.length > 4 ? '…' : ''}` : ''
    out.push(entry(actor, {
      action, module: cfg.module, entity: cfg.entity, recordId: id, recordLabel: labelOf(rec), changes,
      description: `${actor.userName} ${ACTION_VERB[action]} ${cfg.entity.toLowerCase()} ${labelOf(rec)}${what}`,
    }))
  })
  if (!cfg.createOnly) {
    before.forEach((rec, id) => {
      if (!after.has(id)) out.push(entry(actor, { action: 'DELETE', module: cfg.module, entity: cfg.entity, recordId: id, recordLabel: labelOf(rec) }))
    })
  }
  return out.slice(0, 60)
}

const diffSettingsObject = (actor, cfg, prev, next) => {
  if (!isPlainObject(prev) || !isPlainObject(next)) return []
  const changes = diffFields(prev, next, cfg.ignore)
  if (!changes.length) return []
  return [entry(actor, {
    action: 'SETTINGS_CHANGE', module: cfg.module, entity: cfg.entity, recordId: null, recordLabel: cfg.entity, changes,
    description: `${actor.userName} changed ${cfg.entity.toLowerCase()} — ${changes.slice(0, 4).map((c) => c.field.toLowerCase()).join(', ')}${changes.length > 4 ? '…' : ''}`,
  })]
}

/** Application settings live under bellomassi_settings.application.<section>; UI preferences are not audited. */
const diffAppSettings = (actor, prev, next) => {
  const a = isPlainObject(prev?.application) ? prev.application : {}
  const b = isPlainObject(next?.application) ? next.application : {}
  return Object.keys({ ...a, ...b }).filter((sec) => !same(a[sec], b[sec])).map((sec) => {
    const changes = diffFields(a[sec] || {}, b[sec] || {})
    return entry(actor, {
      action: 'SETTINGS_CHANGE', module: 'settings', entity: 'Application settings', recordId: sec, recordLabel: fieldLabel(sec), changes,
      description: `${actor.userName} changed ${fieldLabel(sec).toLowerCase()} settings${changes.length ? ` — ${changes.slice(0, 4).map((c) => c.field.toLowerCase()).join(', ')}` : ''}`,
    })
  })
}

const onWrite = (key, prev, next) => {
  if (key === K.AUDIT_LOGS || prev === next || prev === null || prev === undefined) return
  let entries = []
  const actor = COLLECTIONS[key] || SETTINGS[key] || key === K.ORGANIZATION || key === K.SETTINGS ? currentActor() : null
  if (!actor) return
  if (COLLECTIONS[key]) entries = diffCollection(actor, COLLECTIONS[key], prev, next)
  else if (SETTINGS[key]) entries = diffSettingsObject(actor, SETTINGS[key], prev, next)
  else if (key === K.ORGANIZATION) {
    entries = Object.entries(ORG_SECTIONS).flatMap(([sec, entity]) => diffCollection(actor, { module: 'settings', entity }, prev?.[sec], next?.[sec]))
  } else if (key === K.SETTINGS) entries = diffAppSettings(actor, prev, next)
  write(entries)
}

let installed = false
/** Install the storage write hook once (called from main.jsx). */
export const installAuditHook = () => {
  if (installed) return
  installed = true
  storage.addWriteHook(onWrite)
}

/** Explicit audit entry for events that are not a data change. */
export const logAudit = ({ action, module = 'settings', entity = 'Session', recordId = null, recordLabel = '', description = '', changes = [], actorOverride = null }) => {
  const actor = actorOverride || currentActor()
  write([entry(actor, { action, module, entity, recordId, recordLabel, description, changes })])
}

export const getAuditLogs = () => storage.getItem(K.AUDIT_LOGS, []) || []
export const getAuditForRecord = (recordId, list = getAuditLogs()) => list.filter((a) => a.recordId === recordId)
export const getAuditForUser = (userId, list = getAuditLogs()) => list.filter((a) => a.userId === userId)

const auditService = { installAuditHook, logAudit, getAuditLogs, getAuditForRecord, getAuditForUser, diffFields, formatAuditValue, AUDIT_ACTIONS }
export default auditService
