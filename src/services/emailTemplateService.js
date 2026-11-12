/**
 * Message templates for both channels (Phase 5). Email templates have subject + body; WhatsApp templates
 * a body only. Variables use {{name}} placeholders (TEMPLATE_VARIABLES) and are replaced from real records.
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { getCurrentUser } from './authService'
import { logActivity } from './activityService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { TEMPLATE_VARIABLES } from '../config/communicationConfig'
import { clean, required } from './validation'
import { formatMoney } from '../utils/formatters'

const VAR_KEYS = TEMPLATE_VARIABLES.map((v) => v.key)

/** Replace {{variables}}; unknown or empty variables are left visible so they are noticed before sending. */
export const renderTemplate = (text, vars = {}) => String(text || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null && vars[k] !== '' ? String(vars[k]) : m))
export const unresolvedVariables = (text) => [...new Set([...String(text || '').matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]))]
export const unknownVariables = (text) => unresolvedVariables(text).filter((k) => !VAR_KEYS.includes(k))

/**
 * Variables from related records. ctx: { customerId, orderId, dispatchId, invoiceId, deliveryNoteId, document, extra }
 * Everything is looked up from storage so the values are the real ones.
 */
export const buildVariables = (ctx = {}) => {
  const r = (key) => storage.getItem(key, []) || []
  const order = ctx.orderId ? r(K.ORDERS).find((o) => o.id === ctx.orderId) : null
  const invoice = ctx.invoiceId ? r(K.INVOICES).find((i) => i.id === ctx.invoiceId) : null
  const note = ctx.deliveryNoteId ? r(K.DELIVERY_NOTES).find((n) => n.id === ctx.deliveryNoteId) : (order?.deliveryNoteId ? r(K.DELIVERY_NOTES).find((n) => n.id === order.deliveryNoteId) : null)
  const dispatch = ctx.dispatchId ? r(K.DISPATCHES).find((d) => d.id === ctx.dispatchId) : (note ? r(K.DISPATCHES).find((d) => d.id === note.dispatchId) : order?.dispatchId ? r(K.DISPATCHES).find((d) => d.id === order.dispatchId) : null)
  const customerId = ctx.customerId || order?.customerId || invoice?.customerId || note?.customerId
  const customer = customerId ? r(K.CUSTOMERS).find((c) => c.id === customerId) : null
  const amount = invoice ? invoice.totals.grandTotal : order?.totalAmount
  return {
    customer_name: customer?.name || order?.customerName || invoice?.customerSnapshot?.name || '',
    order_number: order?.orderNumber || invoice?.orderNumber || note?.orderNumber || '',
    dispatch_number: dispatch?.dispatchNumber || '',
    driver_name: dispatch?.driverName || note?.driverName || '',
    invoice_number: invoice?.invoiceNumber || '',
    delivery_note_number: note?.noteNumber || '',
    amount: amount !== undefined && amount !== null ? formatMoney(amount) : '',
    delivery_date: note?.deliveryDate ? dayjs(note.deliveryDate).format('DD MMM YYYY') : dispatch?.dispatchDate ? dayjs(dispatch.dispatchDate).format('DD MMM YYYY') : order?.requestedDeliveryDate ? dayjs(order.requestedDeliveryDate).format('DD MMM YYYY') : '',
    document_name: ctx.document?.name || '',
    expiry_date: ctx.document?.expiryDate ? dayjs(ctx.document.expiryDate).format('DD MMM YYYY') : '',
    reason: order?.rejectionReason || '',
    ...(ctx.extra || {}),
  }
}

export const sampleVariables = () => Object.fromEntries(TEMPLATE_VARIABLES.map((v) => [v.key, v.sample]))

/** Template store factory for a channel. */
const createStore = (key, { channel, hasSubject }) => {
  const list = () => storage.getItem(key, []) || []
  const byId = (id, all = list()) => all.find((t) => t.id === id) || null
  const validate = (t, { id = null } = {}) => {
    const e = {}
    if (required(t.name, 'Template name')) e.name = required(t.name, 'Template name')
    else if (list().some((x) => x.id !== id && x.name.toLowerCase() === clean(t.name).toLowerCase())) e.name = 'A template with this name exists.'
    if (hasSubject && !clean(t.subject)) e.subject = 'Subject is required.'
    if (!clean(t.body)) e.body = 'Message body is required.'
    if (channel === 'WHATSAPP' && String(t.body || '').length > 4096) e.body = 'WhatsApp messages are limited to 4,096 characters.'
    const bad = unknownVariables(`${t.subject || ''} ${t.body || ''}`)
    if (bad.length) e.body = `Unknown variable${bad.length > 1 ? 's' : ''}: ${bad.map((b) => `{{${b}}}`).join(', ')}`
    return e
  }
  const save = (input, { id = null } = {}) => {
    const user = getCurrentUser()
    if (!can(user, 'communication.templates')) return { ok: false, error: 'Only the Admin can manage message templates.' }
    const errors = validate(input, { id })
    if (Object.keys(errors).length) return { ok: false, errors, error: Object.values(errors)[0] }
    const all = list()
    const now = new Date().toISOString()
    const fields = { name: clean(input.name), body: String(input.body).trim(), active: input.active !== false, ...(hasSubject ? { subject: clean(input.subject) } : {}) }
    let record
    if (id) {
      const existing = byId(id, all)
      if (!existing) return { ok: false, error: 'This template no longer exists.' }
      record = { ...existing, ...fields, updatedAt: now }
    } else {
      record = { id: uid(channel === 'EMAIL' ? 'et' : 'wt'), code: 'CUSTOM', builtIn: false, ...fields, createdAt: now, updatedAt: now, createdBy: user.id }
    }
    const res = storage.setItem(key, id ? all.map((t) => (t.id === id ? record : t)) : [...all, record])
    if (!res.ok) return { ok: false, error: res.error }
    logActivity({ type: 'communication', message: `${id ? 'updated' : 'created'} ${channel === 'EMAIL' ? 'email' : 'WhatsApp'} template ${record.name}`, entityType: 'template', entityId: record.id })
    return { ok: true, record }
  }
  const remove = (id) => {
    const user = getCurrentUser()
    if (!can(user, 'communication.templates')) return { ok: false, error: 'Only the Admin can manage message templates.' }
    const t = byId(id)
    if (!t) return { ok: false, error: 'This template no longer exists.' }
    if (t.builtIn) return { ok: false, error: 'Built-in templates can be edited or deactivated, not deleted.' }
    const rules = storage.getItem(K.NOTIFICATION_TEMPLATES, []) || []
    if (rules.some((r) => r.emailTemplateId === id || r.whatsappTemplateId === id)) return { ok: false, error: 'An automated notification uses this template. Change that rule first.' }
    const res = storage.setItem(key, list().filter((x) => x.id !== id))
    return res.ok ? { ok: true } : { ok: false, error: res.error }
  }
  return { list, byId, validate, save, remove }
}

const store = createStore(K.EMAIL_TEMPLATES, { channel: 'EMAIL', hasSubject: true })
export const getEmailTemplates = store.list
export const getEmailTemplateById = store.byId
export const validateEmailTemplate = store.validate
export const saveEmailTemplate = store.save
export const deleteEmailTemplate = store.remove
export const createTemplateStore = createStore

export default { getEmailTemplates, getEmailTemplateById, saveEmailTemplate, deleteEmailTemplate, validateEmailTemplate, renderTemplate, buildVariables }
