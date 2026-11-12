/**
 * Sending email (SMTP side, Phase 5).
 *
 * Demo mode: nothing is sent. The message is recorded as QUEUED_DEMO then SENT_DEMO ("Sent · demo (not sent)").
 * Backend mode: POST /email/send on the integration gateway. "SENT" means the gateway's SMTP server ACCEPTED the
 * message — it is never shown as delivered unless the provider later reports delivery (DELIVERED).
 */
import storage from './storageService'
import { getCurrentUser } from './authService'
import { logActivity } from './activityService'
import { callGateway, isGatewayConfigured } from './integrationGateway'
import { getEmailMode, getSettings } from './emailSettingsService'
import { getDocumentById } from './documentService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { INTEGRATION_MODE as M } from '../config/integrationConfig'
import { MESSAGE_STATUS as S } from '../config/communicationConfig'
import { clean, isEmail } from './validation'
import { scopeOf } from './rbacService'

const read = (key) => storage.getItem(key, []) || []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const deny = (error, errors) => ({ ok: false, error, errors: errors || { form: error } })

export const parseAddresses = (v) => (Array.isArray(v) ? v : String(v || '').split(/[,;\s]+/)).map((x) => clean(x)).filter(Boolean)

export const getDrafts = () => read(K.EMAIL_DRAFTS).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
export const getHistory = () => read(K.EMAIL_HISTORY).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
export const getSentHistory = () => getHistory().filter((m) => m.status !== S.DRAFT)
export const getEmailStatus = (id) => read(K.EMAIL_HISTORY).find((m) => m.id === id)?.status || null

/** Validate a message. mode 'send' requires recipients + subject + body. */
export const validateEmail = (msg, { mode = 'send' } = {}) => {
  const e = {}
  const to = parseAddresses(msg.to)
  const cc = parseAddresses(msg.cc)
  const bcc = parseAddresses(msg.bcc)
  const bad = [...to, ...cc, ...bcc].filter((a) => !isEmail(a))
  if (bad.length) e[to.some((a) => !isEmail(a)) ? 'to' : cc.some((a) => !isEmail(a)) ? 'cc' : 'bcc'] = `Invalid address: ${bad[0]}`
  if (mode === 'send') {
    if (!to.length) e.to = 'Add at least one recipient.'
    if (!clean(msg.subject)) e.subject = 'Subject is required.'
    if (!clean(msg.body)) e.body = 'Message body is required.'
    if (/\{\{\s*\w+\s*\}\}/.test(`${msg.subject} ${msg.body}`)) e.body = 'Some template variables are still unfilled ({{…}}). Pick the related record or edit the text.'
  }
  if (to.length + cc.length + bcc.length > 50) e.to = 'At most 50 recipients per message.'
  return e
}

const normalise = (msg) => ({
  to: parseAddresses(msg.to), cc: parseAddresses(msg.cc), bcc: parseAddresses(msg.bcc), subject: clean(msg.subject) || '', body: String(msg.body || ''),
  templateId: msg.templateId || null, customerId: msg.customerId || null, orderId: msg.orderId || null, invoiceId: msg.invoiceId || null,
  deliveryNoteId: msg.deliveryNoteId || null, attachments: (msg.attachments || []).map((a) => ({ documentId: a.documentId, name: a.name })),
})

export const saveDraft = (msg, { id = null } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'communication.send')) return deny('Your role cannot compose email.')
  const errors = validateEmail(msg, { mode: 'draft' })
  if (Object.keys(errors).length) return deny(Object.values(errors)[0], errors)
  const now = new Date().toISOString()
  const drafts = read(K.EMAIL_DRAFTS)
  const existing = id ? drafts.find((d) => d.id === id) : null
  if (existing && existing.createdBy !== user.id && scopeOf(user) !== 'ADMIN') return deny('This draft belongs to another user.')
  const record = { ...(existing || { id: uid('ed'), createdBy: user.id, createdAt: now }), ...normalise(msg), status: S.DRAFT, updatedAt: now }
  const res = storage.setItem(K.EMAIL_DRAFTS, existing ? drafts.map((d) => (d.id === id ? record : d)) : [record, ...drafts])
  return res.ok ? { ok: true, record } : deny(res.error)
}

export const deleteDraft = (id) => {
  const res = storage.setItem(K.EMAIL_DRAFTS, read(K.EMAIL_DRAFTS).filter((d) => d.id !== id))
  return res.ok ? { ok: true } : deny(res.error)
}

const updateHistory = (id, patch) => storage.updateItem(K.EMAIL_HISTORY, (list) => (list || []).map((m) => (m.id === id ? { ...m, ...patch, events: [...(m.events || []), { at: new Date().toISOString(), status: patch.status }] } : m)), [])

/** Deliver one stored message through the active channel (demo or gateway). */
const dispatchMessage = async (record) => {
  const settings = getSettings()
  const mode = getEmailMode(settings)
  if (mode === M.DEMO) {
    await wait(350)
    const final = { status: S.SENT_DEMO, sentAt: new Date().toISOString(), error: '' }
    updateHistory(record.id, final)
    return { ok: true, demo: true, record: { ...record, ...final } }
  }
  if (!isGatewayConfigured()) {
    const final = { status: S.FAILED, error: 'Backend email is selected but no integration gateway is configured. Nothing was sent.' }
    updateHistory(record.id, final)
    return { ok: false, error: final.error, record: { ...record, ...final } }
  }
  updateHistory(record.id, { status: S.SENDING })
  const attachments = record.attachments.map((a) => ({ documentId: a.documentId, name: a.name }))
  const res = await callGateway('/email/send', { method: 'POST', body: { messageId: record.id, from: { email: settings.smtp.fromEmail, name: settings.smtp.fromName }, replyTo: settings.smtp.replyTo || undefined, to: record.to, cc: record.cc, bcc: record.bcc, subject: record.subject, text: record.body, attachments } })
  const accepted = res.ok && res.data?.accepted === true
  const final = accepted
    ? { status: res.data?.delivered === true ? S.DELIVERED : S.SENT, sentAt: new Date().toISOString(), providerMessageId: res.data?.providerMessageId || null, error: '' }
    : { status: S.FAILED, error: res.data?.message || res.error || 'The SMTP server did not accept the message.' }
  updateHistory(record.id, final)
  return accepted ? { ok: true, record: { ...record, ...final } } : { ok: false, error: final.error, record: { ...record, ...final } }
}

/** Send (or queue) an email. Returns { ok, demo, record, error }. */
export const sendEmail = async (msg, { draftId = null, automated = false, test = false } = {}) => {
  const user = getCurrentUser()
  if (!automated && !can(user, 'communication.send')) return deny('Your role cannot send email.')
  const errors = validateEmail(msg)
  if (Object.keys(errors).length) return deny(Object.values(errors)[0], errors)
  const missing = (msg.attachments || []).find((a) => !getDocumentById(a.documentId))
  if (missing) return deny(`Attachment “${missing.name}” no longer exists.`)
  const settings = getSettings()
  const mode = getEmailMode(settings)
  const now = new Date().toISOString()
  const record = {
    id: uid('em'), ...normalise(msg), status: mode === M.DEMO ? S.QUEUED_DEMO : S.QUEUED, mode: mode === M.DEMO ? 'DEMO' : 'LIVE',
    provider: mode === M.DEMO ? 'demo' : 'gateway-smtp', error: '', createdBy: user?.id || 'system', createdAt: now, sentAt: null, automated, test,
    from: settings.smtp.fromEmail || 'operations@bellomassi.demo', events: [{ at: now, status: mode === M.DEMO ? S.QUEUED_DEMO : S.QUEUED }],
  }
  const writes = [[K.EMAIL_HISTORY, [record, ...read(K.EMAIL_HISTORY)]]]
  if (draftId) writes.push([K.EMAIL_DRAFTS, read(K.EMAIL_DRAFTS).filter((d) => d.id !== draftId)])
  const res = storage.transaction(writes)
  if (!res.ok) return deny(res.error)
  if (!automated) logActivity({ type: 'communication', message: `${mode === M.DEMO ? 'sent demo email' : 'queued email'} “${record.subject}”`, entityType: 'email', entityId: record.id })
  return dispatchMessage(record)
}

export const sendTestEmail = async (to) => {
  const s = getSettings()
  return sendEmail({ to, subject: 'Bellomassi test email', body: `This is a test message from the Bellomassi prototype (${s.mode === 'LIVE' ? 'backend' : 'demo'} mode).` }, { test: true })
}

export const retryEmail = async (id) => {
  const user = getCurrentUser()
  if (!can(user, 'communication.send')) return deny('Your role cannot send email.')
  const msg = read(K.EMAIL_HISTORY).find((m) => m.id === id)
  if (!msg) return deny('This message no longer exists.')
  if (![S.FAILED, S.FAILED_DEMO].includes(msg.status)) return deny('Only failed messages can be retried — this avoids sending duplicates.')
  const mode = getEmailMode()
  updateHistory(id, { status: mode === M.DEMO ? S.QUEUED_DEMO : S.QUEUED, error: '', retries: (msg.retries || 0) + 1 })
  return dispatchMessage({ ...msg, status: S.QUEUED })
}

export const searchEmails = (q, f = {}, list = getHistory()) => {
  const query = (q || '').trim().toLowerCase()
  return list.filter((m) => {
    if (query && ![m.subject, m.body, ...(m.to || [])].some((v) => String(v || '').toLowerCase().includes(query))) return false
    if (f.status && m.status !== f.status) return false
    if (f.customerId && m.customerId !== f.customerId) return false
    if (f.from && m.createdAt.slice(0, 10) < f.from) return false
    if (f.to && m.createdAt.slice(0, 10) > f.to) return false
    return true
  })
}

const emailService = { sendEmail, saveDraft, getDrafts, getSentHistory, getEmailStatus, retryEmail, deleteDraft, sendTestEmail, validateEmail, getHistory, searchEmails }
export default emailService
