import { useMemo } from 'react'
import { useStoredValue } from './useLocalStorage'
import { useDashboardPeriod } from './useDashboardPeriod'
import { STORAGE_KEYS } from '../utils/constants'
import { getOpsSnapshot } from '../services/roleDashboardService'
import { applyPeriod } from '../utils/dashboardFilter'

const K = STORAGE_KEYS

/**
 * Live snapshot of the operational collections used by the role dashboards. Inside a dashboard period, dated
 * collections are narrowed to the period (each on its own business date); stock, customers, products, hubs, vehicles
 * and drivers stay current. `snap.previous` = same selection for the comparison period (or null).
 */
export const useOpsSnapshot = () => {
  const period = useDashboardPeriod()
  const a = useStoredValue(K.ORDERS, null)
  const b = useStoredValue(K.INVENTORY, null)
  const c = useStoredValue(K.STOCK_RECEIPTS, null)
  const d = useStoredValue(K.STOCK_TRANSFERS, null)
  const e = useStoredValue(K.DISPATCHES, null)
  const f = useStoredValue(K.DELIVERIES, null)
  const g = useStoredValue(K.INVOICES, null)
  const h = useStoredValue(K.REPLENISHMENT_DRAFTS, null)
  const i = useStoredValue(K.DOCUMENTS, null)
  const j = useStoredValue(K.VEHICLES, null)
  const k = useStoredValue(K.DRIVERS, null)
  const l = useStoredValue(K.STOCK_ADJUSTMENTS, null)
  const m = useStoredValue(K.CUSTOMERS, null)
  const n = useStoredValue(K.PRODUCTS, null)
  const o = useStoredValue(K.HUBS, null)
  const p = useStoredValue(K.AI_INSIGHTS, null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const raw = useMemo(() => getOpsSnapshot(), [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p])
  const range = period?.range || null
  const prevRange = period?.compare ? period.previous : null
  return useMemo(() => {
    const cur = applyPeriod(raw, range)
    return { ...cur, range, previous: prevRange ? { ...applyPeriod(raw, prevRange), range: prevRange } : null }
  }, [raw, range, prevRange])
}

export default useOpsSnapshot
