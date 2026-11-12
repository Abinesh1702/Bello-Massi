import { useMemo } from 'react'
import { useStoredValue } from './useLocalStorage'
import { STORAGE_KEYS as K } from '../utils/constants'
import { DEFAULT_AI_SETTINGS, DEFAULT_FORECAST_SETTINGS, DEFAULT_JARVIS_SETTINGS } from '../config/aiConfig'

const E = []
const index = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]))

/** Reactive access to the Phase 6 collections and the master records they reference. */
export const usePhase6Data = () => {
  const aiSettings = useStoredValue(K.AI_SETTINGS, DEFAULT_AI_SETTINGS)
  const jarvisSettings = useStoredValue(K.JARVIS_SETTINGS, DEFAULT_JARVIS_SETTINGS)
  const forecastSettings = useStoredValue(K.FORECAST_SETTINGS, DEFAULT_FORECAST_SETTINGS)
  const conversations = useStoredValue(K.AI_CONVERSATIONS, E)
  const messages = useStoredValue(K.AI_MESSAGES, E)
  const insights = useStoredValue(K.AI_INSIGHTS, E)
  const activity = useStoredValue(K.AI_ACTIVITY, E)
  const jarvisHistory = useStoredValue(K.JARVIS_HISTORY, E)
  const forecasts = useStoredValue(K.FORECASTS, E)
  const prediction = useStoredValue(K.INVENTORY_PREDICTIONS, null)
  const recommendations = useStoredValue(K.REORDER_RECOMMENDATIONS, E)
  const models = useStoredValue(K.AI_MODELS, E)
  const drafts = useStoredValue(K.REPLENISHMENT_DRAFTS, E)
  const salesHistory = useStoredValue(K.SALES_HISTORY, null)
  const products = useStoredValue(K.PRODUCTS, E)
  const hubs = useStoredValue(K.HUBS, E)
  const customers = useStoredValue(K.CUSTOMERS, E)
  const inventory = useStoredValue(K.INVENTORY, E)
  const orders = useStoredValue(K.ORDERS, E)
  const receipts = useStoredValue(K.STOCK_RECEIPTS, E)
  const users = useStoredValue(K.DEMO_USERS, E)
  return useMemo(() => ({
    aiSettings, jarvisSettings, forecastSettings: { ...DEFAULT_FORECAST_SETTINGS, ...forecastSettings }, conversations, messages, insights, activity, jarvisHistory,
    forecasts, prediction, recommendations, models, drafts, salesHistory, products, hubs, customers, inventory, orders, receipts, users,
    lk: { products: index(products), hubs: index(hubs), customers: index(customers), users: index(users), forecasts: index(forecasts), drafts: index(drafts) },
  }), [aiSettings, jarvisSettings, forecastSettings, conversations, messages, insights, activity, jarvisHistory, forecasts, prediction, recommendations, models, drafts, salesHistory, products, hubs, customers, inventory, orders, receipts, users])
}

export default usePhase6Data
