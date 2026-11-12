/**
 * External integrations (Phase 5): SMTP, IMAP, OpenWA WhatsApp and backend OCR.
 *
 * The browser never talks to an SMTP/IMAP server or to OpenWA directly and never holds their
 * passwords or API keys. Real integration goes through a Bellomassi integration gateway (a small
 * backend you deploy) that keeps credentials in its own environment variables. Its endpoint
 * contract is documented in docs/INTEGRATION_GATEWAY.md.
 *
 * Set VITE_INTEGRATION_GATEWAY_URL at build time to enable the backend providers. Without it the
 * app runs every channel in clearly labelled Demo mode.
 */
const raw = (import.meta.env?.VITE_INTEGRATION_GATEWAY_URL || '').trim()

export const GATEWAY_URL = raw.replace(/\/+$/, '')
export const GATEWAY_CONFIGURED = Boolean(GATEWAY_URL)
export const GATEWAY_TIMEOUT_MS = 12000

/** Integration modes shown across the Communication Center. */
export const INTEGRATION_MODE = Object.freeze({
  DEMO: 'DEMO',
  PENDING: 'API_INTEGRATION_PENDING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
})

export const INTEGRATION_MODE_META = {
  DEMO: { label: 'Demo mode', tone: 'warning', description: 'Simulated — nothing leaves this browser.' },
  API_INTEGRATION_PENDING: { label: 'API integration pending', tone: 'info', description: 'Configured for real integration, but the backend gateway has not confirmed a connection.' },
  CONNECTED: { label: 'Connected', tone: 'success', description: 'Verified by a live response from the backend gateway.' },
  DISCONNECTED: { label: 'Disconnected', tone: 'danger', description: 'The backend gateway reported the connection is down.' },
}

/** Values that must never be written to browser storage. */
export const SECRET_FIELDS = ['password', 'smtpPassword', 'imapPassword', 'apiToken', 'apiKey', 'token', 'secret']
