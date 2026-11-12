/**
 * AI provider adapters. The rest of the app only calls getProviderStatus / testConnection / chat /
 * synthesizeSpeech / transcribeSpeech; switching provider never touches the UI.
 *
 *  Demo           — no network. The rule-based engine answers (aiChatService).
 *  OpenJarvis     — verified against the OpenJarvis server source:
 *                   GET /health · GET /v1/info · GET /v1/models · POST /v1/chat/completions (OpenAI format)
 *                   POST /v1/speech/synthesize {text, voice_id?, speed?} → audio/wav
 *                   POST /v1/speech/transcribe multipart {file, language?} → {text, language, confidence}
 *  Ollama         — GET /api/tags · POST /api/chat {model, messages, stream:false}
 *  Gateway        — any provider through the integration gateway (/ai/*), which holds API keys.
 *
 * "direct" mode is only offered for keyless local servers. A server that needs an API key, and every
 * cloud provider, must use the gateway. Keys are never written to browser storage.
 * Status is CONNECTED only after a successful health check AND a model/info response.
 */
import storage from '../storageService'
import { getCurrentUser } from '../authService'
import { can } from '../../config/permissions'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { AI_PROVIDERS as P, AI_STATUS, DEFAULT_AI_SETTINGS, PROVIDER_META } from '../../config/aiConfig'
import { callGateway, isGatewayConfigured } from '../integrationGateway'
import { logAiActivity } from './aiActivityService'

const deny = (error) => ({ ok: false, error })

export const getAiSettings = () => ({ ...DEFAULT_AI_SETTINGS, ...(storage.getItem(K.AI_SETTINGS, {}) || {}) })

/** Effective status shown everywhere. Never CONNECTED without a verified response. */
export const getProviderStatus = (s = getAiSettings()) => {
  if (s.provider === P.DEMO) return AI_STATUS.DEMO
  const meta = PROVIDER_META[s.provider]
  if (!meta) return AI_STATUS.UNAVAILABLE
  if (meta.cloud && !s.allowCloudProviders) return AI_STATUS.DISABLED
  if (s.connection === 'gateway' && !isGatewayConfigured()) return AI_STATUS.PENDING
  if (s.status === AI_STATUS.CONNECTED && s.verifiedFor === `${s.provider}|${s.connection}|${s.endpoint}|${s.model}`) return AI_STATUS.CONNECTED
  if (s.status === AI_STATUS.UNAVAILABLE) return AI_STATUS.UNAVAILABLE
  return AI_STATUS.PENDING
}

/** Whether chat should go to the configured provider (otherwise the demo engine answers). */
export const providerActive = (s = getAiSettings()) => getProviderStatus(s) === AI_STATUS.CONNECTED

const validUrl = (v) => {
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch { return false }
}

export const validateAiSettings = (input) => {
  const e = {}
  const meta = PROVIDER_META[input.provider]
  if (!meta) e.provider = 'Choose a provider.'
  else if (input.provider !== P.DEMO) {
    if (!meta.connections.includes(input.connection)) e.connection = `${meta.short} supports: ${meta.connections.join(', ')}.`
    if (meta.cloud && !input.allowCloudProviders) e.provider = 'Cloud providers are disabled. Enable them first, or choose a local provider.'
    if (input.connection === 'direct') {
      if (!validUrl(input.endpoint)) e.endpoint = 'Enter a full http(s) URL, e.g. http://localhost:8000.'
      else if (!meta.local) e.endpoint = 'Direct mode is only for local providers.'
    }
    if (input.provider === P.OLLAMA && !String(input.model || '').trim()) e.model = 'Enter the Ollama model name (e.g. llama3.2).'
    if (input.connection === 'gateway' && input.endpoint && !validUrl(input.endpoint)) e.endpoint = 'Enter a full http(s) URL for the provider endpoint, or leave it blank for the gateway default.'
  }
  const t = Number(input.temperature)
  if (!(t >= 0 && t <= 1.5)) e.temperature = 'Temperature 0–1.5.'
  const mt = Number(input.maxTokens)
  if (!(Number.isInteger(mt) && mt >= 64 && mt <= 4096)) e.maxTokens = 'Max tokens 64–4096.'
  const to = Number(input.timeoutMs)
  if (!(Number.isInteger(to) && to >= 3000 && to <= 120000)) e.timeoutMs = 'Timeout 3–120 seconds.'
  const r = Number(input.retries)
  if (!(Number.isInteger(r) && r >= 0 && r <= 3)) e.retries = 'Retries 0–3.'
  return e
}

/**
 * Save provider configuration. An API key (if typed) is forwarded once to the gateway and never stored.
 * Returns secretsStored: 'gateway' | 'discarded' | 'none'.
 */
export const saveAiSettings = async (input, { apiKey = '' } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'ai.settings.manage')) return deny('Only an Administrator can change AI provider settings.')
  const clean = Object.fromEntries(Object.entries(input).filter(([k]) => !/^(api_?key|api_?token|token|secret|password|authorization)$/i.test(k)))
  const errors = validateAiSettings(clean)
  if (Object.keys(errors).length) return { ok: false, errors, error: 'Please fix the highlighted fields.' }
  const prev = getAiSettings()
  let secretsStored = 'none'
  if (apiKey) {
    if (clean.connection === 'gateway' && isGatewayConfigured()) {
      const res = await callGateway('/ai/settings', { method: 'PUT', body: { provider: clean.provider, endpoint: clean.endpoint || undefined, model: clean.model || undefined, apiKey } })
      if (!res.ok) return deny(`The integration gateway did not accept the key: ${res.error}`)
      secretsStored = 'gateway'
    } else secretsStored = 'discarded'
  }
  const changed = ['provider', 'connection', 'endpoint', 'model'].some((k) => prev[k] !== clean[k])
  const next = {
    ...prev, ...clean,
    temperature: Number(clean.temperature), maxTokens: Number(clean.maxTokens), timeoutMs: Number(clean.timeoutMs), retries: Number(clean.retries), maxContextRows: Number(clean.maxContextRows ?? prev.maxContextRows),
    ...(changed ? { status: clean.provider === P.DEMO ? AI_STATUS.DEMO : AI_STATUS.PENDING, verifiedFor: null, modelInfo: null, lastError: '' } : {}),
  }
  if (next.provider === P.DEMO) next.connection = 'none'
  const res = storage.setItem(K.AI_SETTINGS, next)
  if (!res.ok) return deny(res.error)
  logAiActivity({ kind: 'settings', action: 'ai_settings_saved', args: { provider: next.provider, connection: next.connection, endpoint: next.endpoint, model: next.model, apiKeyProvided: Boolean(apiKey) }, summary: `secret: ${secretsStored}` })
  return { ok: true, record: next, secretsStored }
}

export const setCloudProvidersAllowed = (allowed) => {
  const user = getCurrentUser()
  if (!can(user, 'ai.settings.manage')) return deny('Only an Administrator can change this.')
  const s = getAiSettings()
  const next = { ...s, allowCloudProviders: Boolean(allowed) }
  if (!allowed && PROVIDER_META[s.provider]?.cloud) Object.assign(next, { provider: P.DEMO, connection: 'none', status: AI_STATUS.DEMO, verifiedFor: null })
  const res = storage.setItem(K.AI_SETTINGS, next)
  logAiActivity({ kind: 'settings', action: allowed ? 'cloud_providers_enabled' : 'cloud_providers_disabled' })
  return res.ok ? { ok: true, record: next } : deny(res.error)
}

/* ---------------- transport ---------------- */

const directFetch = async (url, { method = 'GET', body, formData, timeoutMs, raw = false }) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method,
      headers: formData ? { Accept: 'application/json' } : { 'Content-Type': 'application/json', Accept: raw ? '*/*' : 'application/json' },
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
      signal: ctrl.signal,
    })
    if (raw) return res.ok ? { ok: true, status: res.status, blob: await res.blob() } : { ok: false, status: res.status, error: `Server responded ${res.status}.` }
    const text = await res.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch { data = { raw: text } }
    if (res.status === 401) return { ok: false, status: 401, data, error: 'The server requires an API key. Use gateway mode so the key stays on the server — keys are never stored in the browser.' }
    if (!res.ok) return { ok: false, status: res.status, data, error: data?.detail || data?.error || data?.message || `Server responded ${res.status}.` }
    return { ok: true, status: res.status, data }
  } catch (e) {
    return { ok: false, status: 0, error: e?.name === 'AbortError' ? `No response within ${Math.round(timeoutMs / 1000)} s.` : `Could not reach ${new URL(url).origin} (${e?.message || 'network error'}). Check that the server is running and allows this origin (CORS).` }
  } finally {
    clearTimeout(timer)
  }
}

const withRetry = async (fn, retries) => {
  let last = null
  for (let i = 0; i <= retries; i += 1) {
    last = await fn()
    // Retry network failures and 5xx only — never 4xx (bad request / auth).
    if (last.ok || (last.status >= 400 && last.status < 500)) return last
  }
  return last
}

const base = (s) => String(s.endpoint || PROVIDER_META[s.provider]?.defaultEndpoint || '').replace(/\/+$/, '')

const ADAPTERS = {
  [P.OPENJARVIS]: {
    health: async (s) => {
      const h = await directFetch(`${base(s)}/health`, { timeoutMs: s.timeoutMs })
      if (!h.ok) return h
      const info = await directFetch(`${base(s)}/v1/info`, { timeoutMs: s.timeoutMs })
      const models = await directFetch(`${base(s)}/v1/models`, { timeoutMs: s.timeoutMs })
      if (!info.ok && !models.ok) return { ok: false, status: info.status, error: `Health OK but model information failed: ${info.error}` }
      return { ok: true, info: { model: info.data?.model || s.model || '', agent: info.data?.agent || null, engine: info.data?.engine || '', models: (models.data?.data || []).map((m) => m.id).slice(0, 30) } }
    },
    chat: async (s, messages) => {
      const r = await directFetch(`${base(s)}/v1/chat/completions`, { method: 'POST', timeoutMs: s.timeoutMs, body: { model: s.model || s.modelInfo?.model || '', messages, temperature: s.temperature, max_tokens: s.maxTokens, stream: false } })
      if (!r.ok) return r
      const content = r.data?.choices?.[0]?.message?.content
      return content ? { ok: true, content, model: r.data?.model || s.model } : { ok: false, error: 'OpenJarvis returned no message content.' }
    },
  },
  [P.OLLAMA]: {
    health: async (s) => {
      const r = await directFetch(`${base(s)}/api/tags`, { timeoutMs: s.timeoutMs })
      if (!r.ok) return r
      const models = (r.data?.models || []).map((m) => m.name)
      if (s.model && !models.some((m) => m === s.model || m.startsWith(`${s.model}:`))) return { ok: false, status: 404, error: `Ollama is running but model "${s.model}" is not pulled. Available: ${models.join(', ') || 'none'}.` }
      return { ok: true, info: { model: s.model, engine: 'ollama', models } }
    },
    chat: async (s, messages) => {
      const r = await directFetch(`${base(s)}/api/chat`, { method: 'POST', timeoutMs: s.timeoutMs, body: { model: s.model, messages, stream: false, options: { temperature: s.temperature, num_predict: s.maxTokens } } })
      if (!r.ok) return r
      return r.data?.message?.content ? { ok: true, content: r.data.message.content, model: r.data.model || s.model } : { ok: false, error: 'Ollama returned no message content.' }
    },
  },
}

const GATEWAY_ADAPTER = {
  health: async (s) => {
    const r = await callGateway(`/ai/health?provider=${encodeURIComponent(s.provider)}`, { timeoutMs: s.timeoutMs })
    if (!r.ok) return r
    if (r.data?.ok !== true) return { ok: false, error: r.data?.message || 'The gateway reported the provider is not ready.' }
    return { ok: true, info: { model: r.data.model || s.model, engine: r.data.engine || s.provider, models: r.data.models || [] } }
  },
  chat: async (s, messages) => {
    const r = await callGateway('/ai/chat', { method: 'POST', timeoutMs: s.timeoutMs, body: { provider: s.provider, endpoint: s.endpoint || undefined, model: s.model || undefined, messages, temperature: s.temperature, maxTokens: s.maxTokens } })
    if (!r.ok) return r
    return r.data?.content ? { ok: true, content: r.data.content, model: r.data.model || s.model } : { ok: false, error: 'The gateway returned no content.' }
  },
}

const adapterFor = (s) => (s.connection === 'gateway' ? GATEWAY_ADAPTER : ADAPTERS[s.provider])

/** Health check + model info. The only place that can set CONNECTED. */
export const testConnection = async (override = null) => {
  const user = getCurrentUser()
  if (!can(user, 'ai.settings.manage')) return deny('Only an Administrator can test the AI provider.')
  const s = { ...getAiSettings(), ...(override || {}) }
  const status = getProviderStatus({ ...s, status: AI_STATUS.PENDING })
  if (s.provider === P.DEMO) return { ok: true, status: AI_STATUS.DEMO, message: 'Demo AI needs no connection. Answers are rule-based and labelled as demo.' }
  if (status === AI_STATUS.DISABLED) return deny('Cloud providers are disabled in AI settings.')
  if (status === AI_STATUS.PENDING && s.connection === 'gateway') {
    storage.setItem(K.AI_SETTINGS, { ...getAiSettings(), status: AI_STATUS.PENDING, lastCheckedAt: new Date().toISOString(), lastError: 'Integration gateway not configured.' })
    return { ok: false, status: AI_STATUS.PENDING, error: 'Integration pending — VITE_INTEGRATION_GATEWAY_URL is not set, so the gateway cannot be reached.' }
  }
  const adapter = adapterFor(s)
  if (!adapter) return deny('No adapter for this provider.')
  const started = Date.now()
  const r = await withRetry(() => adapter.health(s), Number(s.retries) || 0)
  const at = new Date().toISOString()
  const next = r.ok
    ? { ...getAiSettings(), status: AI_STATUS.CONNECTED, verifiedFor: `${s.provider}|${s.connection}|${s.endpoint}|${s.model}`, lastCheckedAt: at, lastError: '', modelInfo: r.info }
    : { ...getAiSettings(), status: AI_STATUS.UNAVAILABLE, verifiedFor: null, lastCheckedAt: at, lastError: r.error || 'Connection failed.' }
  storage.setItem(K.AI_SETTINGS, next)
  logAiActivity({ kind: 'provider', action: 'test_connection', args: { provider: s.provider, connection: s.connection, endpoint: s.endpoint }, ok: r.ok, error: r.ok ? '' : r.error, durationMs: Date.now() - started })
  return r.ok ? { ok: true, status: AI_STATUS.CONNECTED, info: r.info } : { ok: false, status: AI_STATUS.UNAVAILABLE, error: r.error }
}

/** Send a chat to the configured provider. Callers fall back to the demo engine on failure. */
export const providerChat = async (messages) => {
  const s = getAiSettings()
  if (!providerActive(s)) return deny('No connected AI provider.')
  const adapter = adapterFor(s)
  const r = await withRetry(() => adapter.chat(s, messages), Number(s.retries) || 0)
  if (!r.ok) {
    storage.setItem(K.AI_SETTINGS, { ...getAiSettings(), status: AI_STATUS.UNAVAILABLE, lastError: r.error, lastCheckedAt: new Date().toISOString() })
    return r
  }
  return { ok: true, content: r.content, model: r.model, provider: s.provider }
}

/* ---------------- speech adapters (OpenJarvis) ---------------- */

const speechBase = (s) => (s.provider === P.OPENJARVIS && s.connection === 'direct' ? base(s) : null)

export const openJarvisSpeechAvailable = (s = getAiSettings()) =>
  s.provider === P.OPENJARVIS && getProviderStatus(s) === AI_STATUS.CONNECTED

/** TTS via OpenJarvis: returns an audio Blob (WAV). */
export const synthesizeSpeech = async (text, { voiceId, speed } = {}) => {
  const s = getAiSettings()
  if (!openJarvisSpeechAvailable(s)) return deny('OpenJarvis text-to-speech needs a connected OpenJarvis provider.')
  const body = { text: String(text).slice(0, 4000), voice_id: voiceId || undefined, speed: speed || undefined }
  if (s.connection === 'gateway') {
    // Gateway returns base64 audio to keep callGateway JSON-only.
    const r = await callGateway('/ai/speech/synthesize', { method: 'POST', body, timeoutMs: s.timeoutMs })
    if (!r.ok || !r.data?.audioBase64) return deny(r.error || 'No audio returned.')
    const bytes = Uint8Array.from(atob(r.data.audioBase64), (c) => c.charCodeAt(0))
    return { ok: true, blob: new Blob([bytes], { type: r.data.mimeType || 'audio/wav' }) }
  }
  const r = await directFetch(`${speechBase(s)}/v1/speech/synthesize`, { method: 'POST', body, timeoutMs: s.timeoutMs, raw: true })
  return r.ok ? { ok: true, blob: r.blob } : deny(r.status === 501 ? 'OpenJarvis has no text-to-speech backend configured (501).' : r.error)
}

/** STT via OpenJarvis: uploads a recorded clip, returns { text }. */
export const transcribeSpeech = async (blob, { language } = {}) => {
  const s = getAiSettings()
  if (!openJarvisSpeechAvailable(s)) return deny('OpenJarvis speech-to-text needs a connected OpenJarvis provider.')
  const form = new FormData()
  const ext = (blob.type.split('/')[1] || 'webm').split(';')[0]
  form.append('file', blob, `clip.${ext}`)
  if (language) form.append('language', language.split('-')[0])
  const r = s.connection === 'gateway'
    ? await callGateway('/ai/speech/transcribe', { method: 'POST', formData: form, timeoutMs: s.timeoutMs })
    : await directFetch(`${speechBase(s)}/v1/speech/transcribe`, { method: 'POST', formData: form, timeoutMs: s.timeoutMs })
  if (!r.ok) return deny(r.status === 501 ? 'OpenJarvis has no speech-to-text backend configured (501).' : r.error)
  return { ok: true, text: r.data?.text || '', confidence: r.data?.confidence ?? null }
}
