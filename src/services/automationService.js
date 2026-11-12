/**
 * Automated notifications (Phase 5). Workflow services call `fireEvent(event, ctx)` after a successful
 * change; the matching Admin-configured rule decides channel, recipients and templates.
 *
 * - Never sends the same event for the same record twice (dedupeKey stored in notification history).
 * - Demo mode: messages are recorded as demo sends — nothing leaves the browser.
 * - Backend mode: messages go through the integration gateway; the history shows the provider's answer.
 * - A disabled rule, disabled automation, or a recipient without email / mobile is recorded as SKIPPED.
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { getCurrentUser } from './authService'
import { pushNotification } from './notificationService'
import { buildVariables, getEmailTemplateById, renderTemplate } from './emailTemplateService'
import { getWhatsappTemplateById } from './whatsappTemplateService'
import { sendEmail } from './emailService'
import { sendWhatsapp } from './whatsappMessageService'
import { expiryRegister, getVmsSettings } from './complianceService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { ROLES, userRoleCodes } from '../config/roles'
import { DEFAULT_COMMUNICATION_SETTINGS, EVENT_LABEL } from '../config/communicationConfig'
import { EXPIRY_STATE } from '../config/vmsConfig'

const read = (key, fb = []) => storage.getItem(key, fb) || fb

export const getRules = () => read(K.NOTIFICATION_TEMPLATES)
export const getHistory = () => read(K.NOTIFICATION_HISTORY).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
export const getCommunicationSettings = () => ({ ...DEFAULT_COMMUNICATION_SETTINGS, ...(storage.getItem(K.COMMUNICATION_SETTINGS, {}) || {}) })

export const saveRule = (id, input) => {
  const user = getCurrentUser()
  if (!can(user, 'communication.automation')) return { ok: false, error: 'Only the Admin can configure automated notifications.' }
  const rules = getRules()
  const rule = rules.find((r) => r.id === id)
  if (!rule) return { ok: false, error: 'This rule no longer exists.' }
  const e = {}
  if (['EMAIL', 'BOTH'].includes(input.channel) && !getEmailTemplateById(input.emailTemplateId)) e.emailTemplateId = 'Choose an email template.'
  if (['WHATSAPP', 'BOTH'].includes(input.channel) && !getWhatsappTemplateById(input.whatsappTemplateId)) e.whatsappTemplateId = 'Choose a WhatsApp template.'
  if (Object.keys(e).length) return { ok: false, errors: e, error: Object.values(e)[0] }
  const record = { ...rule, channel: input.channel, recipientRule: input.recipientRule, emailTemplateId: input.emailTemplateId, whatsappTemplateId: input.whatsappTemplateId, enabled: Boolean(input.enabled), updatedAt: new Date().toISOString(), updatedBy: user.id }
  const res = storage.setItem(K.NOTIFICATION_TEMPLATES, rules.map((r) => (r.id === id ? record : r)))
  return res.ok ? { ok: true, record } : { ok: false, error: res.error }
}

export const setAutomationEnabled = (enabled) => {
  if (!can(getCurrentUser()?.role, 'communication.automation')) return { ok: false, error: 'Only the Admin can switch automation.' }
  return storage.setItem(K.COMMUNICATION_SETTINGS, { ...getCommunicationSettings(), automationEnabled: Boolean(enabled) })
}

/** Who receives the message: [{ name, email, mobile }] */
const recipientsFor = (rule, ctx) => {
  const users = read(K.DEMO_USERS)
  const order = ctx.orderId ? read(K.ORDERS).find((o) => o.id === ctx.orderId) : null
  const customerId = ctx.customerId || order?.customerId || (ctx.invoiceId ? read(K.INVOICES).find((i) => i.id === ctx.invoiceId)?.customerId : null)
  if (rule.recipientRule === 'CUSTOMER') {
    const c = read(K.CUSTOMERS).find((x) => x.id === customerId)
    return c ? [{ name: c.name, email: c.email, mobile: c.mobile }] : []
  }
  if (rule.recipientRule === 'SALESMAN') {
    const u = users.find((x) => x.id === order?.salesmanId)
    return u ? [{ name: u.name, email: u.email, mobile: u.phone || '' }] : []
  }
  if (rule.recipientRule === 'ENTITY_OWNER') {
    const drivers = read(K.DRIVERS)
    const d = ctx.ownerType === 'driver' ? drivers.find((x) => x.id === ctx.ownerId) : drivers.find((x) => x.vehicleId === ctx.ownerId)
    if (d) return [{ name: d.name, email: d.email, mobile: d.mobile }]
  }
  return users.filter((u) => u.status !== 'inactive' && userRoleCodes(u).some((r) => [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISPATCHER].includes(r))).map((u) => ({ name: u.name, email: u.email, mobile: '' }))
}

/**
 * Fire a workflow event. ctx: { key (unique record id for dedupe), orderId, customerId, dispatchId, invoiceId,
 * deliveryNoteId, document, ownerType, ownerId, extra }. Returns a promise; callers do not need to await it.
 */
const inFlight = new Set()

export const fireEvent = async (event, ctx = {}) => {
  const dedupeKey = `${event}:${ctx.key || ctx.orderId || ctx.invoiceId || ctx.document?.id || 'global'}`
  // Same event already logged, or still being sent by an earlier call in this tab → skip.
  if (inFlight.has(dedupeKey)) return { ok: true, skipped: 'duplicate' }
  inFlight.add(dedupeKey)
  try {
    if (getHistory().some((h) => h.dedupeKey === dedupeKey)) return { ok: true, skipped: 'duplicate' }
    const rule = getRules().find((r) => r.event === event)
    const base = { id: uid('nh'), event, dedupeKey, entityType: ctx.entityType || (ctx.orderId ? 'order' : ctx.invoiceId ? 'invoice' : 'document'), entityId: ctx.orderId || ctx.invoiceId || ctx.document?.id || ctx.ownerId || null, createdAt: new Date().toISOString(), messageIds: [] }
    const log = (entry) => storage.updateItem(K.NOTIFICATION_HISTORY, (list) => [{ ...base, ...entry }, ...(list || [])].slice(0, 1000), [])
    if (!getCommunicationSettings().automationEnabled) { log({ channel: rule?.channel || '—', status: 'SKIPPED', note: 'Automation is switched off' }); return { ok: true, skipped: 'disabled' } }
    if (!rule || !rule.enabled) { log({ channel: rule?.channel || '—', status: 'SKIPPED', note: 'No enabled rule for this event' }); return { ok: true, skipped: 'rule' } }
    const vars = buildVariables(ctx)
    const recipients = recipientsFor(rule, ctx)
    const results = []
    for (const r of recipients) {
      if (['EMAIL', 'BOTH'].includes(rule.channel)) {
        const t = getEmailTemplateById(rule.emailTemplateId)
        if (!t || !r.email) results.push({ channel: 'EMAIL', recipient: r.name, status: 'SKIPPED', note: !t ? 'Email template missing' : 'No email address' })
        else {
          const res = await sendEmail({ to: [r.email], subject: renderTemplate(t.subject, vars), body: renderTemplate(t.body, vars), templateId: t.id, customerId: ctx.customerId, orderId: ctx.orderId, invoiceId: ctx.invoiceId, deliveryNoteId: ctx.deliveryNoteId }, { automated: true })
          results.push({ channel: 'EMAIL', recipient: r.email, status: res.record?.status || 'FAILED', messageId: res.record?.id, note: res.ok ? '' : res.error })
        }
      }
      if (['WHATSAPP', 'BOTH'].includes(rule.channel)) {
        const t = getWhatsappTemplateById(rule.whatsappTemplateId)
        if (!t || !r.mobile) results.push({ channel: 'WHATSAPP', recipient: r.name, status: 'SKIPPED', note: !t ? 'WhatsApp template missing' : 'No mobile number' })
        else {
          const res = await sendWhatsapp({ recipient: r.mobile, body: renderTemplate(t.body, vars), templateId: t.id, customerId: ctx.customerId, orderId: ctx.orderId, dispatchId: ctx.dispatchId, invoiceId: ctx.invoiceId, deliveryNoteId: ctx.deliveryNoteId }, { automated: true })
          results.push({ channel: 'WHATSAPP', recipient: r.mobile, status: res.record?.status || 'FAILED', messageId: res.record?.id, note: res.ok ? '' : res.error })
        }
      }
    }
    const statuses = results.map((x) => x.status)
    log({
      channel: rule.channel, recipient: results.map((x) => x.recipient).join(', ') || '—', mode: statuses.some((s) => s.endsWith('_DEMO')) ? 'DEMO' : 'LIVE',
      status: !results.length ? 'SKIPPED' : statuses.every((s) => s === 'SKIPPED') ? 'SKIPPED' : statuses.some((s) => s.startsWith('FAILED')) ? 'PARTIAL' : statuses.find((s) => s !== 'SKIPPED'),
      messageIds: results.map((x) => x.messageId).filter(Boolean), results, note: results.length ? '' : 'No recipient found',
    })
    return { ok: true, results }
  } catch (e) {
    return { ok: false, error: e?.message || 'Automation failed.' }
  } finally {
    inFlight.delete(dedupeKey)
  }
}

/** Scan VMS compliance dates; fires DOCUMENT_EXPIRING / DOCUMENT_EXPIRED once per document date. */
let scanning = null
export const scanDocumentExpiries = () => {
  // A scan already running (e.g. dashboard mount + button click) is shared rather than started twice.
  if (!scanning) scanning = runExpiryScan().finally(() => { scanning = null })
  return scanning
}

const runExpiryScan = async () => {
  const settings = getVmsSettings()
  const rows = expiryRegister({ settings }).filter((r) => r.required && r.date && r.status !== 'Inactive')
  const fired = []
  for (const r of rows) {
    const event = r.state === EXPIRY_STATE.EXPIRED ? 'DOCUMENT_EXPIRED' : [EXPIRY_STATE.TODAY, EXPIRY_STATE.WEEK, EXPIRY_STATE.MONTH].includes(r.state) ? 'DOCUMENT_EXPIRING' : null
    if (!event) continue
    const key = `${r.ownerType}:${r.ownerId}:${r.field}:${r.date}`
    if (getHistory().some((h) => h.dedupeKey === `${event}:${key}`)) continue
    const doc = { id: key, name: `${r.label} — ${r.ownerName}`, expiryDate: r.date }
    pushNotification({ title: `${EVENT_LABEL[event]}: ${r.label}`, message: `${r.ownerName} · ${r.state === EXPIRY_STATE.EXPIRED ? 'expired' : 'expires'} ${dayjs(r.date).format('DD MMM YYYY')}`, type: event === 'DOCUMENT_EXPIRED' ? 'danger' : 'warning', roles: [ROLES.ADMIN, ROLES.DISPATCHER], link: '/vms/document-expiry' })
    // eslint-disable-next-line no-await-in-loop
    await fireEvent(event, { key, document: doc, ownerType: r.ownerType, ownerId: r.ownerId, entityType: r.ownerType })
    fired.push({ event, key })
  }
  return { ok: true, fired }
}

export default { fireEvent, scanDocumentExpiries, getRules, saveRule, getHistory, getCommunicationSettings, setAutomationEnabled }
