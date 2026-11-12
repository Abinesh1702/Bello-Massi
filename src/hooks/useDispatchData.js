import { useMemo } from 'react'
import { useStoredValue } from './useLocalStorage'
import { STORAGE_KEYS as K } from '../utils/constants'

const EMPTY = []
const index = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]))

/**
 * Reactive access to Phase 4 dispatch data (dispatches, deliveries, fleet, zones, notes, OTPs, timeline)
 * plus the orders / hubs / customers they reference. Re-renders on any change, reset or import.
 */
export const useDispatchData = () => {
  const dispatches = useStoredValue(K.DISPATCHES, EMPTY)
  const deliveries = useStoredValue(K.DELIVERIES, EMPTY)
  const drivers = useStoredValue(K.DRIVERS, EMPTY)
  const vehicles = useStoredValue(K.VEHICLES, EMPTY)
  const zones = useStoredValue(K.DISPATCH_ZONES, EMPTY)
  const notes = useStoredValue(K.DELIVERY_NOTES, EMPTY)
  const otps = useStoredValue(K.DELIVERY_OTPS, EMPTY)
  const timeline = useStoredValue(K.DISPATCH_TIMELINE, EMPTY)
  const orders = useStoredValue(K.ORDERS, EMPTY)
  const hubs = useStoredValue(K.HUBS, EMPTY)
  const customers = useStoredValue(K.CUSTOMERS, EMPTY)
  const inventory = useStoredValue(K.INVENTORY, EMPTY)
  const products = useStoredValue(K.PRODUCTS, EMPTY)

  return useMemo(() => ({
    dispatches, deliveries, drivers, vehicles, zones, notes, otps, timeline, orders, hubs, customers, inventory, products,
    lk: {
      dispatches: index(dispatches), deliveries: index(deliveries), drivers: index(drivers), vehicles: index(vehicles), zones: index(zones),
      orders: index(orders), hubs: index(hubs), customers: index(customers), notes: index(notes),
    },
  }), [dispatches, deliveries, drivers, vehicles, zones, notes, otps, timeline, orders, hubs, customers, inventory, products])
}

export default useDispatchData
