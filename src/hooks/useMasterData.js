import { useMemo } from 'react'
import { useStoredValue } from './useLocalStorage'
import { STORAGE_KEYS as K } from '../utils/constants'
import { buildStockRows } from '../services/inventoryService'

const EMPTY = []
const EMPTY_DATA = { salesReps: [] }
const index = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]))

/**
 * Reactive access to Phase 2 master data. Every component using this re-renders when
 * any of the collections change (CRUD, stock operations, reset, import, other tabs).
 */
export const useMasterData = () => {
  const customers = useStoredValue(K.CUSTOMERS, EMPTY)
  const products = useStoredValue(K.PRODUCTS, EMPTY)
  const hubs = useStoredValue(K.HUBS, EMPTY)
  const inventory = useStoredValue(K.INVENTORY, EMPTY)
  const receipts = useStoredValue(K.STOCK_RECEIPTS, EMPTY)
  const transfers = useStoredValue(K.STOCK_TRANSFERS, EMPTY)
  const adjustments = useStoredValue(K.STOCK_ADJUSTMENTS, EMPTY)
  const movements = useStoredValue(K.STOCK_MOVEMENTS, EMPTY)
  const demo = useStoredValue(K.DEMO_DATA, EMPTY_DATA)
  const orders = useStoredValue(K.ORDERS, EMPTY)
  const users = useStoredValue(K.DEMO_USERS, EMPTY)
  const zones = useStoredValue(K.DISPATCH_ZONES, EMPTY)
  const drivers = useStoredValue(K.DRIVERS, EMPTY)

  return useMemo(() => {
    const salesReps = demo.salesReps || EMPTY
    const people = { ...index(salesReps), ...index(users), ...index(drivers) }
    return {
      customers, products, hubs, inventory, receipts, transfers, adjustments, movements,
      orders,
      zones,
      drivers,
      salesReps,
      users,
      lookups: { customers: index(customers), products: index(products), hubs: index(hubs), people },
      stockRows: buildStockRows(inventory, products, hubs),
    }
  }, [customers, products, hubs, inventory, receipts, transfers, adjustments, movements, demo, users, orders, zones, drivers])
}


export default useMasterData
