/**
 * Thin client for the Bellomassi integration gateway (backend proxy) — see docs/INTEGRATION_GATEWAY.md.
 * Credentials live only in the gateway's environment. The browser sends business data, never secrets.
 *
 * Every call resolves to { ok, status, data, error } and never throws, so callers can show honest status:
 * a channel is "Connected" only after the gateway answers successfully.
 */
import { GATEWAY_CONFIGURED, GATEWAY_TIMEOUT_MS, GATEWAY_URL } from '../config/integrationConfig'
import { getCurrentUser } from './authService'

export const isGatewayConfigured = () => GATEWAY_CONFIGURED

export const callGateway = async (path, { method = 'GET', body, timeoutMs = GATEWAY_TIMEOUT_MS, formData } = {}) => {
  if (!GATEWAY_CONFIGURED) return { ok: false, status: 0, data: null, error: 'No integration gateway is configured (VITE_INTEGRATION_GATEWAY_URL is not set).' }
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null
  try {
    const user = getCurrentUser()
    const res = await fetch(`${GATEWAY_URL}${path}`, {
      method,
      headers: {
        ...(formData ? {} : { 'Content-Type': 'application/json' }),
        Accept: 'application/json',
        // Identifies the acting prototype user for the gateway's audit log. Real deployments replace this with a session token.
        'X-Bellomassi-User': user?.id || 'anonymous',
      },
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
      signal: ctrl?.signal,
    })
    const text = await res.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch { data = { raw: text } }
    if (!res.ok) return { ok: false, status: res.status, data, error: data?.message || data?.error || `Gateway responded ${res.status}.` }
    return { ok: true, status: res.status, data, error: null }
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e?.name === 'AbortError' ? 'The integration gateway did not respond in time.' : `Could not reach the integration gateway (${e?.message || 'network error'}).` }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export default { callGateway, isGatewayConfigured }
