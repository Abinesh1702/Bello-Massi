import { useMemo } from 'react'
import { useStoredValue } from './useLocalStorage'
import { useDashboardPeriod } from './useDashboardPeriod'
import { STORAGE_KEYS } from '../utils/constants'
import { getOrdersWithRelations } from '../services/demoDataService'
import { filterByPeriod } from '../utils/dashboardFilter'

const EMPTY = { salesReps: [] }
const NONE = []

/**
 * Live demo data snapshot + joined orders. Re-computes when storage changes (reset/import).
 * Inside a dashboard (DashboardPeriodProvider) the dated collections are narrowed to the selected period — orders on
 * their order date, the approval timeline and activity on their event date. `previous` holds the same selection for
 * the comparison period (when comparison is on). Master data is never filtered.
 */
export const useDashboardData = () => {
  const period = useDashboardPeriod()
  const demo = useStoredValue(STORAGE_KEYS.DEMO_DATA, EMPTY)
  const customers = useStoredValue(STORAGE_KEYS.CUSTOMERS, NONE)
  const products = useStoredValue(STORAGE_KEYS.PRODUCTS, NONE)
  const hubs = useStoredValue(STORAGE_KEYS.HUBS, NONE)
  const inventory = useStoredValue(STORAGE_KEYS.INVENTORY, NONE)
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, NONE)
  const allActivities = useStoredValue(STORAGE_KEYS.ACTIVITIES, NONE)
  const rawOrders = useStoredValue(STORAGE_KEYS.ORDERS, NONE)
  const allTimeline = useStoredValue(STORAGE_KEYS.ORDER_TIMELINE, NONE)
  const zones = useStoredValue(STORAGE_KEYS.DISPATCH_ZONES, NONE)
  const drivers = useStoredValue(STORAGE_KEYS.DRIVERS, NONE)
  const range = period?.range || null
  const prevRange = period?.compare ? period.previous : null
  const build = (r) => {
    const data = { ...demo, customers, products, hubs, inventory, orders: filterByPeriod('orders', rawOrders, r), zones, drivers }
    return { data, orders: getOrdersWithRelations(data, users) }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cur = useMemo(() => build(range), [demo, customers, products, hubs, inventory, rawOrders, zones, drivers, users, range])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prev = useMemo(() => (prevRange ? build(prevRange) : null), [demo, customers, products, hubs, inventory, rawOrders, zones, drivers, users, prevRange])
  const activities = useMemo(() => filterByPeriod('activities', allActivities, range), [allActivities, range])
  const timeline = useMemo(() => filterByPeriod('timeline', allTimeline, range), [allTimeline, range])
  return {
    data: cur.data, users, orders: cur.orders, activities, timeline, range,
    previous: prev ? { orders: prev.orders, timeline: filterByPeriod('timeline', allTimeline, prevRange), range: prevRange } : null,
  }
}

export default useDashboardData
