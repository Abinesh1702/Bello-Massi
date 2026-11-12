/**
 * AI activity / audit log (bellomassi_ai_activity). Every tool run, chat answer, Jarvis command,
 * confirmation, provider test and AI-related setting change is recorded per user.
 * Arguments are stored, credentials never (any secret-looking field is masked).
 */
import storage from '../storageService'
import { getCurrentUser } from '../authService'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { AI_LOG_LIMIT } from '../../config/aiConfig'
import { SECRET_FIELDS } from '../../config/integrationConfig'
import { uid } from '../../utils/helpers'

const mask = (v) => {
  if (!v || typeof v !== 'object') return v
  if (Array.isArray(v)) return v.map(mask)
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, SECRET_FIELDS.some((s) => k.toLowerCase().includes(s.toLowerCase())) ? '••••' : mask(x)]))
}

/** kind: chat | tool | command | confirm | navigation | provider | settings | insight | forecast | replenishment */
export const logAiActivity = ({ kind, action, tool = null, args = null, ok = true, error = '', summary = '', durationMs = null, source = 'assistant', entity = null }) => {
  const user = getCurrentUser()
  const entry = {
    id: uid('aia'), userId: user?.id || 'anonymous', userName: user?.name || '—', role: user?.role || null,
    kind, action: action || tool || kind, tool, args: mask(args), ok, error, summary: String(summary || '').slice(0, 300), durationMs, source, entity, at: new Date().toISOString(),
  }
  storage.updateItem(K.AI_ACTIVITY, (list) => [entry, ...(Array.isArray(list) ? list : [])].slice(0, AI_LOG_LIMIT), [])
  return entry
}

