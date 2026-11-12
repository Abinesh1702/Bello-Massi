/**
 * Reading email (IMAP side, Phase 5). The browser never connects to IMAP itself.
 *   Demo mode: a seeded demo mailbox; "sync" may add a simulated new message, labelled as demo.
 *   Backend mode: the integration gateway holds the IMAP credentials and returns messages
 *   (GET /email/imap/messages). Messages it returns replace the demo mailbox.
 */
import storage from './storageService'
import { getCurrentUser } from './authService'
import { callGateway, isGatewayConfigured } from './integrationGateway'
import { getEmailMode, getSettings, validateConfiguration } from './emailSettingsService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { INTEGRATION_MODE as M } from '../config/integrationConfig'

const read = () => storage.getItem(K.EMAIL_INBOX, []) || []
const deny = (error) => ({ ok: false, error })
const allowed = () => can(getCurrentUser()?.role, 'communication.inbox')

export const getInboxMessages = (folder = 'INBOX', list = read()) => list.filter((m) => (folder === 'ALL' ? true : m.folder === folder)).sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))
export const getEmailDetails = (id, list = read()) => list.find((m) => m.id === id) || null
export const getFolders = (list = read()) => {
  const names = [...new Set(['INBOX', ...list.map((m) => m.folder)])]
  return names.map((name) => ({ name, total: list.filter((m) => m.folder === name).length, unread: list.filter((m) => m.folder === name && !m.read).length }))
}
export const searchInbox = (q, f = {}, list = read()) => {
  const query = (q || '').trim().toLowerCase()
  return list.filter((m) => {
    if (f.folder && f.folder !== 'ALL' && m.folder !== f.folder) return false
    if (f.unread && m.read) return false
    if (f.customerId && m.customerId !== f.customerId) return false
    if (query && ![m.subject, m.body, m.from, m.fromName].some((v) => String(v || '').toLowerCase().includes(query))) return false
    return true
  })
}

const setSettings = (patch) => storage.setItem(K.EMAIL_SETTINGS, { ...getSettings(), ...patch })

export const connectInbox = async () => {
  if (!can(getCurrentUser()?.role, 'communication.settings')) return deny('Only the Admin can connect the inbox.')
  const s = getSettings()
  const errors = validateConfiguration(s, { part: 'imap' })
  if (Object.keys(errors).length) return deny(`Save a valid IMAP configuration first: ${Object.values(errors)[0]}`)
  if (getEmailMode(s, 'imap') === M.DEMO) {
    setSettings({ inboxConnected: true, inboxConnectedAt: new Date().toISOString() })
    return { ok: true, demo: true }
  }
  if (!isGatewayConfigured()) return deny('Backend mode is selected but no integration gateway is configured.')
  const res = await callGateway('/email/imap/connect', { method: 'POST', body: { folder: s.imap.folder } })
  if (!res.ok || res.data?.connected !== true) {
    setSettings({ inboxConnected: false, imapStatus: { state: 'FAILED', checkedAt: new Date().toISOString(), message: res.data?.message || res.error || 'IMAP connection failed.' } })
    return deny(res.data?.message || res.error || 'IMAP connection failed.')
  }
  setSettings({ inboxConnected: true, inboxConnectedAt: new Date().toISOString(), imapStatus: { state: 'CONNECTED', checkedAt: new Date().toISOString(), message: 'Connected through the integration gateway.' } })
  return { ok: true }
}

export const disconnectInbox = async () => {
  if (!can(getCurrentUser()?.role, 'communication.settings')) return deny('Only the Admin can disconnect the inbox.')
  if (getSettings().mode === 'LIVE' && isGatewayConfigured()) await callGateway('/email/imap/disconnect', { method: 'POST' })
  setSettings({ inboxConnected: false })
  return { ok: true }
}

const DEMO_NEW = [
  ['Annapoorna Caterers', 'orders@annapoorna.demo', 'Weekend bulk order', 'Hi, we need 40 cartons of Veg Spring Rolls for a weekend event. Can you deliver on Saturday morning?'],
  ['TechPark Cafeterias', 'procurement@techpark.demo', 'Monthly contract renewal', 'Please share the revised price list for the next quarter so we can renew the supply contract.'],
  ['Hotel Saravana Bhavan', 'stores@saravana.demo', 'Payment remittance', 'We have transferred the payment for last week’s invoice. Please confirm receipt.'],
]

export const syncInbox = async () => {
  if (!allowed()) return deny('Your role cannot read the shared inbox.')
  const s = getSettings()
  if (!s.inboxConnected) return deny('Connect the inbox first (Email settings → IMAP).')
  const now = new Date().toISOString()
  if (getEmailMode(s, 'imap') === M.DEMO) {
    const list = read()
    const pending = DEMO_NEW.filter(([, from, subject]) => !list.some((m) => m.from === from && m.subject === subject))
    const added = pending.slice(0, 1).map(([fromName, from, subject, body]) => {
      const c = (storage.getItem(K.CUSTOMERS, []) || []).find((x) => x.name === fromName)
      return { id: uid('in'), folder: 'INBOX', fromName, from, to: ['operations@bellomassi.demo'], subject, body, receivedAt: now, read: false, starred: false, customerId: c?.id || null, demo: true }
    })
    storage.setItem(K.EMAIL_INBOX, [...added, ...list])
    setSettings({ lastSyncAt: now })
    return { ok: true, demo: true, added: added.length }
  }
  if (!isGatewayConfigured()) return deny('Backend mode is selected but no integration gateway is configured.')
  const res = await callGateway(`/email/imap/messages?folder=${encodeURIComponent(s.imap.folder)}&limit=100`)
  if (!res.ok || !Array.isArray(res.data?.messages)) return deny(res.error || 'The gateway returned no messages list.')
  const real = res.data.messages.map((m) => ({ id: `imap-${m.uid ?? m.id}`, folder: m.folder || s.imap.folder, fromName: m.fromName || '', from: m.from, to: m.to || [], subject: m.subject || '(no subject)', body: m.text || m.body || '', receivedAt: m.date || now, read: Boolean(m.seen), starred: Boolean(m.flagged), customerId: null, demo: false }))
  const kept = read().filter((m) => !m.demo && !real.some((r) => r.id === m.id))
  storage.setItem(K.EMAIL_INBOX, [...real, ...kept])
  setSettings({ lastSyncAt: now })
  return { ok: true, added: real.length }
}

export const markAsRead = async (id, read_ = true) => {
  if (!allowed()) return deny('Your role cannot read the shared inbox.')
  const msg = getEmailDetails(id)
  if (!msg) return deny('This message no longer exists.')
  if (!msg.demo && getSettings().mode === 'LIVE' && isGatewayConfigured()) {
    const res = await callGateway(`/email/imap/messages/${encodeURIComponent(id.replace(/^imap-/, ''))}/flags`, { method: 'POST', body: { seen: read_ } })
    if (!res.ok) return deny(res.error)
  }
  storage.setItem(K.EMAIL_INBOX, read().map((m) => (m.id === id ? { ...m, read: read_ } : m)))
  return { ok: true }
}

export default { connectInbox, disconnectInbox, syncInbox, getInboxMessages, getEmailDetails, markAsRead, searchInbox, getFolders }
