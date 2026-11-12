/**
 * SMTP (sending) + IMAP (inbox) settings (Phase 5).
 *
 * Only non-secret settings are stored in the browser. Passwords are never written to LocalStorage:
 *   - Demo mode: the password field is used for format validation only and then discarded.
 *   - Backend mode: the password is sent once over HTTPS to the integration gateway, which keeps it in its
 *     own secret store / environment (SMTP_PASSWORD, IMAP_PASSWORD). The browser keeps only "password set".
 * Connection tests in backend mode are performed BY THE GATEWAY; the result shown is the gateway's answer.
 */
import storage from './storageService'
import { getCurrentUser } from './authService'
import { logActivity } from './activityService'
import { callGateway, isGatewayConfigured } from './integrationGateway'
import { STORAGE_KEYS as K } from '../utils/constants'
import { can } from '../config/permissions'
import { DEFAULT_EMAIL_SETTINGS, ENCRYPTION_OPTIONS } from '../config/communicationConfig'
import { INTEGRATION_MODE as M, SECRET_FIELDS } from '../config/integrationConfig'
import { clean, isEmail } from './validation'

const HOST = /^(?=.{1,253}$)([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,}$|^localhost$|^(\d{1,3}\.){3}\d{1,3}$/i
const stripSecrets = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => !SECRET_FIELDS.includes(k)))

export const getSettings = () => {
  const s = storage.getItem(K.EMAIL_SETTINGS, {}) || {}
  return { ...DEFAULT_EMAIL_SETTINGS, ...s, smtp: { ...DEFAULT_EMAIL_SETTINGS.smtp, ...(s.smtp || {}) }, imap: { ...DEFAULT_EMAIL_SETTINGS.imap, ...(s.imap || {}) } }
}

/** DEMO unless the Admin chose backend mode; backend mode is CONNECTED only after a successful gateway test. */
export const getEmailMode = (s = getSettings(), channel = 'smtp') => {
  if (s.mode !== 'LIVE') return M.DEMO
  if (!isGatewayConfigured()) return M.PENDING
  const st = channel === 'imap' ? s.imapStatus : s.smtpStatus
  if (st?.state === 'CONNECTED') return M.CONNECTED
  if (st?.state === 'FAILED') return M.DISCONNECTED
  return M.PENDING
}

const validPort = (p) => Number.isInteger(Number(p)) && Number(p) >= 1 && Number(p) <= 65535

/** Returns { smtp: {...errors}, imap: {...errors} } using `smtp.` / `imap.` prefixed keys. */
export const validateConfiguration = (input, { part = 'both' } = {}) => {
  const e = {}
  if (part !== 'imap') {
    const s = input.smtp || {}
    if (!HOST.test(clean(s.host || ''))) e['smtp.host'] = 'Enter a valid SMTP host, e.g. smtp.example.com.'
    if (!validPort(s.port)) e['smtp.port'] = 'Port must be 1–65535 (usually 465 or 587).'
    if (!clean(s.username)) e['smtp.username'] = 'SMTP username is required.'
    if (!ENCRYPTION_OPTIONS.some((o) => o.value === s.encryption)) e['smtp.encryption'] = 'Choose an encryption option.'
    if (!isEmail(s.fromEmail)) e['smtp.fromEmail'] = 'Enter the From email address.'
    if (!clean(s.fromName)) e['smtp.fromName'] = 'Enter the From name.'
    if (s.replyTo && !isEmail(s.replyTo)) e['smtp.replyTo'] = 'Enter a valid Reply-To address.'
    if (s.encryption === 'SSL' && Number(s.port) === 587) e['smtp.port'] = 'Port 587 normally uses STARTTLS, not SSL (465).'
  }
  if (part !== 'smtp') {
    const i = input.imap || {}
    if (!HOST.test(clean(i.host || ''))) e['imap.host'] = 'Enter a valid IMAP host, e.g. imap.example.com.'
    if (!validPort(i.port)) e['imap.port'] = 'Port must be 1–65535 (usually 993).'
    if (!clean(i.username)) e['imap.username'] = 'IMAP username is required.'
    if (!ENCRYPTION_OPTIONS.some((o) => o.value === i.encryption)) e['imap.encryption'] = 'Choose an encryption option.'
    if (!clean(i.folder)) e['imap.folder'] = 'Enter the mailbox folder (usually INBOX).'
  }
  return e
}

const guard = () => {
  const u = getCurrentUser()
  return can(u, 'communication.settings') ? u : null
}

/**
 * Save settings. secrets: { smtpPassword, imapPassword } — forwarded to the gateway in backend mode,
 * never stored here. Returns { ok, record, secretsStored: 'gateway' | 'discarded' | 'unchanged' }.
 */
export const saveSettings = async (input, secrets = {}) => {
  const user = guard()
  if (!user) return { ok: false, error: 'Only the Admin can configure email.' }
  const errors = validateConfiguration(input)
  if (Object.keys(errors).length) return { ok: false, errors, error: Object.values(errors)[0] }
  const current = getSettings()
  const changedSmtp = JSON.stringify(stripSecrets(input.smtp)) !== JSON.stringify(stripSecrets(current.smtp))
  const changedImap = JSON.stringify(stripSecrets(input.imap)) !== JSON.stringify(stripSecrets(current.imap))
  let secretsStored = 'unchanged'
  if (input.mode === 'LIVE' && isGatewayConfigured()) {
    const res = await callGateway('/email/settings', { method: 'PUT', body: { smtp: { ...stripSecrets(input.smtp), password: secrets.smtpPassword || undefined }, imap: { ...stripSecrets(input.imap), password: secrets.imapPassword || undefined } } })
    if (!res.ok) return { ok: false, error: `The integration gateway did not accept the settings: ${res.error}` }
    if (secrets.smtpPassword || secrets.imapPassword) secretsStored = 'gateway'
  } else if (secrets.smtpPassword || secrets.imapPassword) secretsStored = 'discarded'
  const record = {
    ...current,
    mode: input.mode === 'LIVE' ? 'LIVE' : 'DEMO',
    smtp: { ...stripSecrets(input.smtp), port: Number(input.smtp.port), passwordSet: secretsStored === 'gateway' ? true : current.smtp.passwordSet || false },
    imap: { ...stripSecrets(input.imap), port: Number(input.imap.port), passwordSet: secretsStored === 'gateway' ? true : current.imap.passwordSet || false },
    smtpStatus: changedSmtp || input.mode !== current.mode ? { state: 'NOT_TESTED', checkedAt: null, message: '' } : current.smtpStatus,
    imapStatus: changedImap || input.mode !== current.mode ? { state: 'NOT_TESTED', checkedAt: null, message: '' } : current.imapStatus,
    inboxConnected: changedImap || input.mode !== current.mode ? false : current.inboxConnected,
    updatedAt: new Date().toISOString(), updatedBy: user.id,
  }
  const res = storage.setItem(K.EMAIL_SETTINGS, record)
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'communication', message: `updated email settings (${record.mode === 'LIVE' ? 'backend' : 'demo'} mode)`, entityType: 'emailSettings', entityId: 'email' })
  return { ok: true, record, secretsStored }
}

const recordStatus = (which, status) => {
  const s = getSettings()
  storage.setItem(K.EMAIL_SETTINGS, { ...s, [which]: status })
  return status
}

const testConnection = async (part) => {
  if (!guard()) return { ok: false, error: 'Only the Admin can test email connections.' }
  const s = getSettings()
  const errors = validateConfiguration(s, { part })
  const key = part === 'smtp' ? 'smtpStatus' : 'imapStatus'
  const label = part.toUpperCase()
  if (Object.keys(errors).length) {
    recordStatus(key, { state: 'INVALID', checkedAt: new Date().toISOString(), message: Object.values(errors)[0] })
    return { ok: false, error: `Save a valid ${label} configuration first: ${Object.values(errors)[0]}`, errors }
  }
  if (s.mode !== 'LIVE') {
    const status = recordStatus(key, { state: 'DEMO_OK', checkedAt: new Date().toISOString(), message: `Demo check only — the ${label} settings are well-formed, but no connection was attempted.` })
    return { ok: true, demo: true, status }
  }
  if (!isGatewayConfigured()) {
    const status = recordStatus(key, { state: 'PENDING', checkedAt: new Date().toISOString(), message: 'Backend mode is selected but no integration gateway is configured, so the connection cannot be tested.' })
    return { ok: false, pending: true, status, error: status.message }
  }
  const res = await callGateway(`/email/${part}/test`, { method: 'POST' })
  const ok = res.ok && res.data?.connected === true
  const status = recordStatus(key, { state: ok ? 'CONNECTED' : 'FAILED', checkedAt: new Date().toISOString(), message: ok ? (res.data?.message || `${label} server accepted the connection.`) : (res.data?.message || res.error || `${label} connection failed.`) })
  return ok ? { ok: true, status } : { ok: false, status, error: status.message }
}

export const testSMTPConnection = () => testConnection('smtp')
export const testIMAPConnection = () => testConnection('imap')

export default { getSettings, saveSettings, validateConfiguration, testSMTPConnection, testIMAPConnection, getEmailMode }
