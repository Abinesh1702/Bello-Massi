/**
 * Read access to the seeded demo business data (customers, products, hubs, zones, stock,
 * drivers, orders). Phase 1 is read-only; CRUD operations are added module by module.
 */
import storage from './storageService'
import { STORAGE_KEYS } from '../utils/constants'

const EMPTY = { salesReps: [] }

/**
 * Operational data plus (since Phase 2) customers/products/hubs read from their own keys,
 * merged so Phase 1 consumers keep the same shape.
 */
export const getDemoData = () => ({
  ...(storage.getItem(STORAGE_KEYS.DEMO_DATA, EMPTY) || EMPTY),
  customers: storage.getItem(STORAGE_KEYS.CUSTOMERS, []) || [],
  products: storage.getItem(STORAGE_KEYS.PRODUCTS, []) || [],
  hubs: storage.getItem(STORAGE_KEYS.HUBS, []) || [],
  inventory: storage.getItem(STORAGE_KEYS.INVENTORY, []) || [],
  orders: storage.getItem(STORAGE_KEYS.ORDERS, []) || [],
  zones: storage.getItem(STORAGE_KEYS.DISPATCH_ZONES, []) || [],
  drivers: storage.getItem(STORAGE_KEYS.DRIVERS, []) || [],
})
export const getUsers = () => storage.getItem(STORAGE_KEYS.DEMO_USERS, []) || []

export const getCustomers = () => getDemoData().customers
export const getProducts = () => getDemoData().products
export const getHubs = () => getDemoData().hubs
export const getDrivers = () => getDemoData().drivers
export const getOrders = () => getDemoData().orders

const indexBy = (arr) => Object.fromEntries((arr || []).map((x) => [x.id, x]))

/** Lookup tables built from a data snapshot, so joins stay cheap. */
export const buildLookups = (data = getDemoData(), users = getUsers()) => ({
  customers: indexBy(data.customers),
  products: indexBy(data.products),
  hubs: indexBy(data.hubs),
  zones: indexBy(data.zones),
  drivers: indexBy(data.drivers),
  people: { ...indexBy(data.salesReps), ...indexBy(users), ...indexBy(data.drivers) },
})

/**
 * Orders joined with live customer / hub / driver records. Display names come from the order's
 * own snapshot (so history stays readable if master data changes).
 * Adds Phase 1 aliases used by dashboards: status, totalValue, ref (order number or "Draft").
 */
export const getOrdersWithRelations = (data = getDemoData(), users = getUsers()) => {
  const lk = buildLookups(data, users)
  return (data.orders || []).map((o) => ({
    ...o,
    status: o.orderStatus,
    totalValue: o.totalAmount,
    ref: o.orderNumber || 'Draft',
    customer: lk.customers[o.customerId] || null,
    customerName: o.customerName || lk.customers[o.customerId]?.name || 'Unknown customer',
    hubName: o.hubName || lk.hubs[o.hubId]?.name || '—',
    zoneName: lk.zones[o.zoneId]?.name ?? '—',
    driverName: o.driverId ? lk.drivers[o.driverId]?.name ?? '—' : null,
    salesmanName: o.salesmanName || lk.people[o.salesmanId]?.name || '—',
  }))
}

export const getDriverForUser = (userId, data = getDemoData()) => (data.drivers || []).find((d) => d.userId === userId) || null

export const getDatasetSummary = (data = getDemoData(), users = getUsers()) => ({
  users: users.length,
  customers: data.customers.length,
  products: data.products.length,
  hubs: data.hubs.length,
  zones: data.zones?.length ?? 0,
  drivers: data.drivers?.length ?? 0,
  orders: data.orders.length,
  stockRows: data.inventory?.length ?? 0,
  seededAt: data.seededAt,
})

const demoDataService = {
  getDemoData, getUsers, getCustomers, getProducts, getHubs, getDrivers, getOrders,
  buildLookups, getOrdersWithRelations, getDriverForUser, getDatasetSummary,
}
export default demoDataService
