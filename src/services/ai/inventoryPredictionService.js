/**
 * Predictive inventory: runs the prediction over current data and stores the run
 * (bellomassi_inventory_predictions) plus open reorder recommendations (bellomassi_reorder_recommendations).
 * Running a prediction never changes stock.
 */
import storage from '../storageService'
import { getCurrentUser } from '../authService'
import { can } from '../../config/permissions'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { RECOMMENDATION_STATUS } from '../../config/aiConfig'
import { predictInventory } from '../ml/inventoryPrediction'
import { recommendationsFrom } from '../seed/phase6Seed'
import { logAiActivity } from './aiActivityService'
import { getDataBundle, getForecastSettings, getIndex, inputsFingerprint } from './dataBundle'

const deny = (error) => ({ ok: false, error })

export const getPrediction = () => storage.getItem(K.INVENTORY_PREDICTIONS, null)
export const getRecommendations = () => storage.getItem(K.REORDER_RECOMMENDATIONS, []) || []

/** True when stock, orders, deliveries or replenishments changed since the stored run (or it is from an earlier day). */
export const isPredictionStale = (prediction = getPrediction()) => !prediction || prediction.fingerprint !== inputsFingerprint()

export const runPrediction = ({ silent = false } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'inventory.predictions.view')) return deny('You do not have permission to run inventory predictions.')
  const started = Date.now()
  const bundle = getDataBundle()
  const settings = getForecastSettings()
  const result = predictInventory(bundle, settings, { index: getIndex(bundle) })
  const record = {
    ...result,
    fingerprint: inputsFingerprint(bundle),
    runBy: user.id, runByName: user.name,
    settings: { basis: settings.demandBasis, lookbackDays: settings.lookbackDays, horizon: settings.forecastHorizonDays, includeBaseline: settings.includeDemoBaseline, serviceLevel: settings.serviceLevel, model: settings.defaultModel },
  }
  const recs = recommendationsFrom(result, getRecommendations())
  const res = storage.transaction([[K.INVENTORY_PREDICTIONS, record], [K.REORDER_RECOMMENDATIONS, recs]])
  if (!res.ok) return deny(res.error)
  if (!silent) logAiActivity({ kind: 'tool', action: 'run_inventory_prediction', ok: true, durationMs: Date.now() - started, summary: `${result.rows.length} lines · ${result.summary.reorder} reorder · ${result.summary.predictedStockouts} predicted stock-outs` })
  return { ok: true, record, recommendations: recs }
}

/** Latest run, re-running first when inputs changed. */
export const ensureFreshPrediction = () => {
  const p = getPrediction()
  if (!isPredictionStale(p)) return p
  const res = runPrediction({ silent: true })
  return res.ok ? res.record : p
}

export const dismissRecommendation = (id, reason) => {
  const user = getCurrentUser()
  if (!can(user, 'inventory.replenishment.create') && !can(user, 'inventory.predictions.manage')) return deny('You do not have permission to dismiss recommendations.')
  if (!String(reason || '').trim()) return { ok: false, errors: { reason: 'Give a reason for dismissing.' }, error: 'A reason is required.' }
  const list = getRecommendations()
  const rec = list.find((r) => r.id === id)
  if (!rec) return deny('Recommendation not found.')
  if (rec.status !== RECOMMENDATION_STATUS.OPEN) return deny('Only open recommendations can be dismissed.')
  const res = storage.setItem(K.REORDER_RECOMMENDATIONS, list.map((r) => (r.id === id ? { ...r, status: RECOMMENDATION_STATUS.DISMISSED, dismissedReason: reason.trim(), dismissedBy: user.id, dismissedAt: new Date().toISOString() } : r)))
  if (!res.ok) return deny(res.error)
  logAiActivity({ kind: 'replenishment', action: 'dismiss_recommendation', args: { id, reason } })
  return { ok: true }
}

export const reopenRecommendation = (id) => {
  const user = getCurrentUser()
  if (!can(user, 'inventory.replenishment.create') && !can(user, 'inventory.predictions.manage')) return deny('You do not have permission.')
  const list = getRecommendations()
  const res = storage.setItem(K.REORDER_RECOMMENDATIONS, list.map((r) => (r.id === id && r.status === RECOMMENDATION_STATUS.DISMISSED ? { ...r, status: RECOMMENDATION_STATUS.OPEN, dismissedReason: '' } : r)))
  return res.ok ? { ok: true } : deny(res.error)
}
