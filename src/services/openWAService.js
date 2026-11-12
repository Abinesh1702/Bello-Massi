/**
 * OpenWA WhatsApp transport (Phase 5).
 *
 * Providers:
 *   Mock (Demo mode)   — a simulated session; messages are recorded as "Sent · demo" and never leave the browser.
 *   Backend (LIVE)     — the integration gateway proxies OpenWA's REST API (docs/INTEGRATION_GATEWAY.md):
 *                          GET  /openwa/health                              → OpenWA GET  /api/health
 *                          GET  /openwa/sessions/:name                      → OpenWA GET  /api/sessions/:id
 *                          POST /openwa/sessions/:name/start | /stop        → OpenWA POST /api/sessions/:id/start | stop
 *                          GET  /openwa/sessions/:name/qr                   → OpenWA GET  /api/sessions/:id/qr
 *                          POST /openwa/sessions/:name/messages/send-text   → OpenWA POST /api/sessions/:id/messages/send-text
 *                        The gateway adds OpenWA's X-API-Key header from its own environment — the browser never sees it.
 *
 * "Connected" is shown only when OpenWA (through the gateway) reports the session status as `ready`.
 * A 201 from send-text means OpenWA handed the message to WhatsApp — not that it was delivered.
 */
import storage from './storageService'
import { getCurrentUser } from './authService'
import { logActivity } from './activityService'
import { callGateway, isGatewayConfigured } from './integrationGateway'
import { STORAGE_KEYS as K } from '../utils/constants'
import { can } from '../config/permissions'
import { INTEGRATION_MODE as M, SECRET_FIELDS } from '../config/integrationConfig'
import { DEFAULT_OPENWA_SETTINGS, DEFAULT_COUNTRY_CODE } from '../config/communicationConfig'
import { clean } from './validation'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const deny = (error, errors) => ({ ok: false, error, errors: errors || { form: error } })

export const getSettings = () => ({ ...DEFAULT_OPENWA_SETTINGS, ...(storage.getItem(K.OPENWA_SETTINGS, {}) || {}) })
const patch = (p) => storage.setItem(K.OPENWA_SETTINGS, { ...getSettings(), ...p })
const sessionPath = (s) => `/openwa/sessions/${encodeURIComponent(s.sessionName)}`

/** Integration mode for display: DEMO, API_INTEGRATION_PENDING, CONNECTED (verified), DISCONNECTED. */
export const getIntegrationMode = (s = getSettings()) => {
  if (s.mode !== 'LIVE') return M.DEMO
  if (!isGatewayConfigured()) return M.PENDING
  if (s.sessionStatus === 'ready' && s.verified) return M.CONNECTED
  if (s.lastCheckedAt) return M.DISCONNECTED
  return M.PENDING
}

/**
 * Normalise a phone number to digits with country code. Returns { ok, digits, e164, chatId, error }.
 * Accepts +91 98410 22301, 09841022301, 9841022301 (default country code applied).
 */
export const validatePhoneNumber = (raw, countryCode = getSettings().countryCode || DEFAULT_COUNTRY_CODE) => {
  const s = String(raw || '').trim()
  if (!s) return { ok: false, error: 'Enter a mobile number.' }
  if (/[^\d\s()+-]/.test(s)) return { ok: false, error: 'Use digits only (spaces, +, - and brackets are fine).' }
  let digits = s.replace(/\D/g, '')
  if (s.startsWith('+')) { /* already international */ } else if (digits.startsWith('00')) digits = digits.slice(2)
  else if (digits.startsWith('0') && digits.length === 11) digits = `${countryCode}${digits.slice(1)}`
  else if (digits.length === 10) digits = `${countryCode}${digits}`
  if (digits.length < 8 || digits.length > 15) return { ok: false, error: 'Number must have 8–15 digits including the country code.' }
  if (digits.startsWith('91') && !/^91[6-9]\d{9}$/.test(digits)) return { ok: false, error: 'Indian mobile numbers have 10 digits starting with 6–9.' }
  return { ok: true, digits, e164: `+${digits}`, chatId: `${digits}@c.us` }
}

const guard = () => {
  const u = getCurrentUser()
  return can(u, 'communication.settings') ? u : null
}

export const saveSettings = async (input) => {
  const user = guard()
  if (!user) return deny('Only the Admin can configure OpenWA.')
  const e = {}
  if (input.mode === 'LIVE' && !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(clean(input.baseUrl || ''))) e.baseUrl = 'Enter the OpenWA base URL, e.g. https://openwa.example.com.'
  if (input.baseUrl && !/^https?:\/\//i.test(clean(input.baseUrl))) e.baseUrl = 'The URL must start with http:// or https://.'
  if (!/^\/[\w/-]*$/.test(clean(input.apiEndpoint || ''))) e.apiEndpoint = 'API endpoint must start with “/”, e.g. /api.'
  if (!/^[a-z0-9-]{3,50}$/i.test(clean(input.sessionName || ''))) e.sessionName = 'Session name: 3–50 letters, numbers or hyphens (OpenWA rule).'
  if (!/^\d{1,4}$/.test(String(input.countryCode || ''))) e.countryCode = 'Choose a country code.'
  if (Object.keys(e).length) return deny(Object.values(e)[0], e)
  const clean_ = Object.fromEntries(Object.entries(input).filter(([k]) => !SECRET_FIELDS.includes(k)))
  const current = getSettings()
  const changed = ['mode', 'baseUrl', 'apiEndpoint', 'sessionName'].some((k) => clean(String(clean_[k] ?? '')) !== clean(String(current[k] ?? '')))
  if (clean_.mode === 'LIVE' && isGatewayConfigured()) {
    // The gateway keeps the OpenWA URL and API key; the token typed here (if any) goes only to the gateway.
    const res = await callGateway('/openwa/settings', { method: 'PUT', body: { baseUrl: clean(clean_.baseUrl), apiEndpoint: clean(clean_.apiEndpoint), sessionName: clean(clean_.sessionName), apiKey: input.apiToken || undefined } })
    if (!res.ok) return deny(`The integration gateway did not accept the settings: ${res.error}`)
  }
  const record = {
    ...current, baseUrl: clean(clean_.baseUrl) || '', apiEndpoint: clean(clean_.apiEndpoint), sessionName: clean(clean_.sessionName), countryCode: String(clean_.countryCode), mode: clean_.mode === 'LIVE' ? 'LIVE' : 'DEMO',
    tokenSet: input.apiToken && clean_.mode === 'LIVE' && isGatewayConfigured() ? true : current.tokenSet || false,
    ...(changed ? { sessionStatus: clean_.mode === 'LIVE' ? 'unknown' : 'not_started', verified: false, lastCheckedAt: null, qrStatus: 'none', qr: null, lastError: '' } : {}),
    updatedAt: new Date().toISOString(), updatedBy: user.id,
  }
  const res = storage.setItem(K.OPENWA_SETTINGS, record)
  if (!res.ok) return deny(res.error)
  logActivity({ type: 'communication', message: `updated OpenWA settings (${record.mode === 'LIVE' ? 'backend' : 'demo'} mode)`, entityType: 'openwaSettings', entityId: 'openwa' })
  return { ok: true, record, tokenDiscarded: Boolean(input.apiToken) && !(clean_.mode === 'LIVE' && isGatewayConfigured()) }
}

/** Ask OpenWA (through the gateway) for the session. Updates the stored status from the real response only. */
export const getConnectionStatus = async () => {
  const s = getSettings()
  if (s.mode !== 'LIVE') return { ok: true, mode: M.DEMO, sessionStatus: s.sessionStatus, demo: true }
  if (!isGatewayConfigured()) return { ok: false, mode: M.PENDING, error: 'Backend mode is selected but no integration gateway is configured.' }
  const res = await callGateway(sessionPath(s))
  const now = new Date().toISOString()
  if (!res.ok) {
    patch({ sessionStatus: res.status === 404 ? 'not_found' : 'unreachable', verified: false, lastCheckedAt: now, lastError: res.error })
    return { ok: false, mode: M.DISCONNECTED, error: res.error }
  }
  const status = String(res.data?.status || 'unknown')
  patch({ sessionStatus: status, verified: status === 'ready', lastCheckedAt: now, lastError: '', phone: res.data?.phone || null, pushName: res.data?.pushName || null, ...(status === 'ready' ? { lastConnectedAt: res.data?.connectedAt || now, qrStatus: 'none', qr: null } : {}) })
  return { ok: true, mode: status === 'ready' ? M.CONNECTED : M.DISCONNECTED, sessionStatus: status, session: res.data }
}

export const getSessionInfo = () => {
  const s = getSettings()
  return { name: s.sessionName, status: s.sessionStatus, phone: s.phone || null, pushName: s.pushName || null, lastConnectedAt: s.lastConnectedAt, lastCheckedAt: s.lastCheckedAt, qrStatus: s.qrStatus, mode: getIntegrationMode(s), demo: s.mode !== 'LIVE' }
}

export const testConnection = async () => {
  if (!guard()) return deny('Only the Admin can test OpenWA.')
  const s = getSettings()
  if (s.mode !== 'LIVE') {
    await wait(300)
    patch({ lastCheckedAt: new Date().toISOString() })
    return { ok: true, demo: true, message: 'Demo mode — no OpenWA server was contacted. Switch to backend mode to test a real connection.' }
  }
  if (!isGatewayConfigured()) return deny('Backend mode is selected but no integration gateway is configured (VITE_INTEGRATION_GATEWAY_URL).')
  const health = await callGateway('/openwa/health')
  if (!health.ok) {
    patch({ verified: false, lastCheckedAt: new Date().toISOString(), lastError: health.error, sessionStatus: 'unreachable' })
    return deny(`OpenWA health check failed: ${health.error}`)
  }
  const st = await getConnectionStatus()
  return st.ok ? { ok: true, message: `OpenWA reachable · session “${s.sessionName}” is ${st.sessionStatus}.`, status: st } : deny(st.error)
}

export const connectSession = async () => {
  if (!guard()) return deny('Only the Admin can manage the WhatsApp session.')
  const s = getSettings()
  if (s.mode !== 'LIVE') {
    await wait(500)
    patch({ sessionStatus: 'demo_ready', lastConnectedAt: new Date().toISOString(), lastCheckedAt: new Date().toISOString(), qrStatus: 'none' })
    return { ok: true, demo: true }
  }
  if (!isGatewayConfigured()) return deny('Backend mode is selected but no integration gateway is configured.')
  const start = await callGateway(`${sessionPath(s)}/start`, { method: 'POST' })
  if (!start.ok && start.status !== 409) return deny(`OpenWA could not start the session: ${start.error}`)
  const st = await getConnectionStatus()
  if (st.sessionStatus === 'qr_ready') {
    const qr = await callGateway(`${sessionPath(s)}/qr`)
    const img = qr.ok ? qr.data?.qrCode || qr.data?.qr || null : null
    patch({ qrStatus: img ? 'ready' : 'unavailable', qr: img })
    return { ok: true, needsQr: true, qr: img, message: 'Scan the QR code with WhatsApp on the business phone, then refresh the status.' }
  }
  return st.ok ? { ok: true, status: st } : deny(st.error)
}

export const disconnectSession = async () => {
  if (!guard()) return deny('Only the Admin can manage the WhatsApp session.')
  const s = getSettings()
  if (s.mode !== 'LIVE') {
    patch({ sessionStatus: 'demo_stopped', lastCheckedAt: new Date().toISOString() })
    return { ok: true, demo: true }
  }
  if (!isGatewayConfigured()) return deny('No integration gateway is configured.')
  const res = await callGateway(`${sessionPath(s)}/stop`, { method: 'POST' })
  if (!res.ok) return deny(`OpenWA could not stop the session: ${res.error}`)
  patch({ sessionStatus: 'disconnected', verified: false, lastCheckedAt: new Date().toISOString() })
  return { ok: true }
}

/** Transport-level send. Returns { ok, demo, status, providerMessageId, error }. Records are kept by whatsappMessageService. */
export const sendMessage = async ({ chatId, text }) => {
  const s = getSettings()
  if (s.mode !== 'LIVE') {
    await wait(350)
    if (s.sessionStatus !== 'demo_ready') return { ok: false, demo: true, status: 'FAILED_DEMO', error: 'Demo WhatsApp session is not connected. Connect it in WhatsApp settings.' }
    return { ok: true, demo: true, status: 'SENT_DEMO', providerMessageId: null }
  }
  if (!isGatewayConfigured()) return { ok: false, status: 'FAILED', error: 'Backend mode is selected but no integration gateway is configured. Nothing was sent.' }
  const res = await callGateway(`${sessionPath(s)}/messages/send-text`, { method: 'POST', body: { chatId, text } })
  if (!res.ok) return { ok: false, status: 'FAILED', error: res.data?.message || res.error }
  return { ok: true, status: 'SENT', providerMessageId: res.data?.messageId || null }
}

export const getMessageHistory = () => (storage.getItem(K.WHATSAPP_MESSAGES, []) || []).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

const openWAService = { getConnectionStatus, connectSession, disconnectSession, sendMessage, getMessageHistory, validatePhoneNumber, getSessionInfo, testConnection, saveSettings, getSettings, getIntegrationMode }
export default openWAService
