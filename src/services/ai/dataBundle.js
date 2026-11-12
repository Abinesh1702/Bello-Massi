/**
 * Read-only access to the records the analytics engines need, plus a memoised demand/sales index.
 * The index is rebuilt only when one of its source collections changes (storage returns stable refs).
 */
import storage from '../storageService'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { DEFAULT_FORECAST_SETTINGS } from '../../config/aiConfig'
import { buildIndex } from '../ml/demandData'
import { inputsFingerprint as pureFingerprint } from '../ml/fingerprint'

const arr = (k) => storage.getItem(k, []) || []

export const getForecastSettings = () => {
  const s = storage.getItem(K.FORECAST_SETTINGS, {}) || {}
  return { ...DEFAULT_FORECAST_SETTINGS, ...s, productParams: s.productParams || {}, suppliers: Array.isArray(s.suppliers) ? s.suppliers : DEFAULT_FORECAST_SETTINGS.suppliers }
}

export const getDataBundle = () => ({
  orders: arr(K.ORDERS),
  products: arr(K.PRODUCTS),
  customers: arr(K.CUSTOMERS),
  hubs: arr(K.HUBS),
  inventory: arr(K.INVENTORY),
  deliveries: arr(K.DELIVERIES),
  dispatches: arr(K.DISPATCHES),
  movements: arr(K.STOCK_MOVEMENTS),
  receipts: arr(K.STOCK_RECEIPTS),
  vehicles: arr(K.VEHICLES),
  drivers: arr(K.DRIVERS),
  invoices: arr(K.INVOICES),
  documents: arr(K.DOCUMENTS),
  replenishments: arr(K.REPLENISHMENT_DRAFTS),
  salesHistory: storage.getItem(K.SALES_HISTORY, null),
})

let memo = null
export const getIndex = (bundle = getDataBundle(), { includeBaseline = getForecastSettings().includeDemoBaseline } = {}) => {
  const deps = [bundle.orders, bundle.deliveries, bundle.dispatches, bundle.products, bundle.salesHistory, includeBaseline]
  if (memo && memo.deps.every((d, i) => d === deps[i])) return memo.index
  const index = buildIndex(bundle, { includeBaseline })
  memo = { deps, index }
  return index
}

/** Fingerprint of the inputs that change predictions — used to flag a stale stored run. */
export const inputsFingerprint = (bundle = getDataBundle()) => pureFingerprint(bundle)
