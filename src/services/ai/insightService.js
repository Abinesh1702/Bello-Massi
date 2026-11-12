/**
 * Business insights (bellomassi_ai_insights): rule-based detection, permission-filtered listing and
 * the New → Reviewed → Resolved workflow.
 */
import dayjs from 'dayjs'
import storage from '../storageService'
import { getCurrentUser } from '../authService'
import { can } from '../../config/permissions'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { INSIGHT_STATUS, SEVERITY_META } from '../../config/aiConfig'
import { generateInsights, mergeInsights } from '../ml/insightsEngine'
import { logAiActivity } from './aiActivityService'
import { getDataBundle, getIndex } from './dataBundle'
import { ensureFreshPrediction } from './inventoryPredictionService'

const deny = (error) => ({ ok: false, error })
export const getAllInsights = () => storage.getItem(K.AI_INSIGHTS, []) || []

/** Insights the user may see: their role must hold the insight's underlying permission. */
export const visibleInsights = (user = getCurrentUser(), list = getAllInsights()) =>
  list.filter((i) => can(user, i.permission || 'ai.insights.view'))
    .sort((a, b) => (a.status === b.status ? 0 : a.status === INSIGHT_STATUS.RESOLVED ? 1 : b.status === INSIGHT_STATUS.RESOLVED ? -1 : 0) || (SEVERITY_META[a.severity]?.rank ?? 9) - (SEVERITY_META[b.severity]?.rank ?? 9))

export const refreshInsights = () => {
  const user = getCurrentUser()
  if (!can(user, 'ai.insights.view')) return deny('You do not have permission to refresh insights.')
  const prediction = ensureFreshPrediction()
  const bundle = getDataBundle()
  const fresh = generateInsights(bundle, { now: dayjs(), index: getIndex(bundle), prediction })
  const merged = mergeInsights(getAllInsights(), fresh)
  const res = storage.setItem(K.AI_INSIGHTS, merged)
  if (!res.ok) return deny(res.error)
  logAiActivity({ kind: 'insight', action: 'refresh_insights', summary: `${fresh.length} active insights` })
  return { ok: true, count: fresh.length }
}

export const setInsightStatus = (id, status, note = '') => {
  const user = getCurrentUser()
  if (!can(user, 'ai.insights.manage')) return deny('You do not have permission to update insights.')
  if (!Object.values(INSIGHT_STATUS).includes(status)) return deny('Unknown status.')
  const list = getAllInsights()
  const ins = list.find((i) => i.id === id)
  if (!ins) return deny('Insight not found.')
  if (!can(user, ins.permission || 'ai.insights.view')) return deny('You do not have access to this insight.')
  const at = new Date().toISOString()
  const res = storage.setItem(K.AI_INSIGHTS, list.map((i) => (i.id === id ? { ...i, status, statusAt: at, statusBy: user.id, statusByName: user.name, history: [...(i.history || []), { at, status, by: user.id, byName: user.name, note }] } : i)))
  if (!res.ok) return deny(res.error)
  logAiActivity({ kind: 'insight', action: `insight_${status.toLowerCase()}`, args: { id, title: ins.title } })
  return { ok: true }
}
