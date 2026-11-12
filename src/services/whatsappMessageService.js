/** WhatsApp messages (Phase 5): validate, record, send through openWAService, retry failures only. */
import storage from './storageService'
import { getCurrentUser } from './authService'
import { logActivity } from './activityService'
import { getSettings, sendMessage as transportSend, validatePhoneNumber } from './openWAService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { MESSAGE_STATUS as S } from '../config/communicationConfig'
import { clean } from './validation'

const read = () => storage.getItem(K.WHATSAPP_MESSAGES, []) || []
const deny = (error, errors) => ({ ok: false, error, errors: errors || { form: error } })
const update = (id, p) => storage.updateItem(K.WHATSAPP_MESSAGES, (list) => (list || []).map((m) => (m.id === id ? { ...m, ...p } : m)), [])

export const getMessages = () => read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const validateWhatsappMessage = (msg) => {
  const e = {}
  const phone = validatePhoneNumber(msg.recipient, msg.countryCode)
  if (!phone.ok) e.recipient = phone.error
  if (!clean(msg.body)) e.body = 'Message text is required.'
  else if (msg.body.length > 4096) e.body = 'WhatsApp text messages are limited to 4,096 characters.'
  if (/\{\{\s*\w+\s*\}\}/.test(msg.body || '')) e.body = 'Some template variables are still unfilled ({{…}}). Pick the related record or edit the text.'
  return { errors: e, phone }
}

const refs = (m) => ({ customerId: m.customerId || null, orderId: m.orderId || null, dispatchId: m.dispatchId || null, invoiceId: m.invoiceId || null, deliveryNoteId: m.deliveryNoteId || null, templateId: m.templateId || null })

export const saveWhatsappDraft = (msg) => {
  const user = getCurrentUser()
  if (!can(user, 'communication.send')) return deny('Your role cannot compose messages.')
  if (!clean(msg.body) && !clean(msg.recipient)) return deny('Nothing to save yet.')
  const now = new Date().toISOString()
  const record = { id: uid('wa'), recipient: clean(msg.recipient) || '', body: msg.body || '', ...refs(msg), status: S.DRAFT, mode: getSettings().mode === 'LIVE' ? 'LIVE' : 'DEMO', createdBy: user.id, createdAt: now, sentAt: null, error: '' }
  const res = storage.setItem(K.WHATSAPP_MESSAGES, [record, ...read()])
  return res.ok ? { ok: true, record } : deny(res.error)
}

export const sendWhatsapp = async (msg, { automated = false, draftId = null } = {}) => {
  const user = getCurrentUser()
  if (!automated && !can(user, 'communication.send')) return deny('Your role cannot send WhatsApp messages.')
  const { errors, phone } = validateWhatsappMessage(msg)
  if (Object.keys(errors).length) return deny(Object.values(errors)[0], errors)
  const demo = getSettings().mode !== 'LIVE'
  const now = new Date().toISOString()
  const record = {
    id: draftId || uid('wa'), recipient: phone.e164, body: msg.body.trim(), ...refs(msg), status: demo ? S.QUEUED_DEMO : S.QUEUED, mode: demo ? 'DEMO' : 'LIVE',
    provider: demo ? 'demo' : 'openwa-gateway', providerMessageId: null, createdBy: user?.id || 'system', createdAt: now, sentAt: null, error: '', automated,
  }
  const list = read().filter((m) => m.id !== draftId)
  const res = storage.setItem(K.WHATSAPP_MESSAGES, [record, ...list])
  if (!res.ok) return deny(res.error)
  if (!demo) update(record.id, { status: S.SENDING })
  const out = await transportSend({ chatId: phone.chatId, text: record.body })
  const final = out.ok ? { status: out.status, sentAt: new Date().toISOString(), providerMessageId: out.providerMessageId || null, error: '' } : { status: out.status || (demo ? S.FAILED_DEMO : S.FAILED), error: out.error }
  update(record.id, final)
  if (!automated) logActivity({ type: 'communication', message: `${demo ? 'sent demo WhatsApp' : 'sent WhatsApp'} to ${phone.e164}`, entityType: 'whatsapp', entityId: record.id })
  return out.ok ? { ok: true, demo, record: { ...record, ...final } } : { ok: false, demo, error: out.error, record: { ...record, ...final } }
}

export const retryWhatsapp = async (id) => {
  const user = getCurrentUser()
  if (!can(user, 'communication.send')) return deny('Your role cannot send WhatsApp messages.')
  const m = read().find((x) => x.id === id)
  if (!m) return deny('This message no longer exists.')
  if (![S.FAILED, S.FAILED_DEMO].includes(m.status)) return deny('Only failed messages can be retried — this avoids sending duplicates.')
  const phone = validatePhoneNumber(m.recipient)
  if (!phone.ok) return deny(phone.error)
  const demo = getSettings().mode !== 'LIVE'
  update(id, { status: demo ? S.QUEUED_DEMO : S.SENDING, error: '', retries: (m.retries || 0) + 1, mode: demo ? 'DEMO' : 'LIVE' })
  const out = await transportSend({ chatId: phone.chatId, text: m.body })
  const final = out.ok ? { status: out.status, sentAt: new Date().toISOString(), providerMessageId: out.providerMessageId || null, error: '' } : { status: out.status || (demo ? S.FAILED_DEMO : S.FAILED), error: out.error }
  update(id, final)
  return out.ok ? { ok: true, demo } : { ok: false, error: out.error }
}

export const deleteWhatsappDraft = (id) => {
  const m = read().find((x) => x.id === id)
  if (!m || m.status !== S.DRAFT) return deny('Only drafts can be deleted.')
  const res = storage.setItem(K.WHATSAPP_MESSAGES, read().filter((x) => x.id !== id))
  return res.ok ? { ok: true } : deny(res.error)
}

export default { getMessages, sendWhatsapp, saveWhatsappDraft, retryWhatsapp, deleteWhatsappDraft, validateWhatsappMessage }
