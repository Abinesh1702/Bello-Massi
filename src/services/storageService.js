/**
 * Centralised browser-storage service.
 * The ONLY module that touches window.localStorage / window.sessionStorage.
 *
 * - JSON (de)serialisation with corruption handling
 * - In-memory fallback when browser storage is blocked (private mode, disabled cookies)
 * - Read cache + change subscriptions (used by useStoredValue / useSyncExternalStore)
 * - Versioned seeding, reset, export and validated import
 */
import dayjs from 'dayjs'
import { buildPhase6Data } from './seed/phase6Seed'
import { APP_DATA_VERSION, DATA_KEYS, PHASE6_KEYS, EXPORT_SIGNATURE, MAX_ACTIVITIES, STORAGE_KEYS, ENTERPRISE_COLLECTION_KEYS, ENTERPRISE_OBJECT_KEYS, ENTERPRISE_KEYS } from '../utils/constants'
import { buildEnterpriseData, enterpriseInputFromSnapshot, mergeOrganization, mergeSuppliers } from './seed/enterpriseSeed'
import { reconcileReservations } from '../utils/stockReservation'
import { withReportsCenter } from '../config/enterprise/roles'
import { isPlainObject } from '../utils/helpers'
import { appConfig } from '../config/appConfig'
import {
  buildActivities, buildDemoData, buildDemoUser, buildDemoUsers, buildNotifications, DEFAULT_SETTINGS, DEFAULT_THEME, DEMO_CREDENTIALS,
} from './seed/demoSeed'
import {
  buildCompany, buildDemoReplenishment, buildInitialAudit, buildOrganization, buildPermissionState, buildRoles, PHASE1_NOTIFICATIONS,
} from './seed/adminSeed'
import { buildCatalogue, buildMasterData } from './seed/masterDataSeed'
import { convertLegacyOrders } from './seed/orderSeed'
import { buildPhase5Data } from './seed/phase5Seed'
import { buildDispatchData } from './seed/dispatchSeed'
import { buildCallData, buildScrapData, buildTrackingSeed, withVipDeliveryTimes } from './seed/completionSeed'
import { isLowOrOut } from '../utils/stock'
import { PERMISSIONS } from '../config/permissions'

const PREFIX = 'bellomassi_'

/* ---------- Backend detection with in-memory fallback ---------- */

const createMemoryStore = () => {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size },
  }
}

const probe = (type) => {
  try {
    const store = window[type]
    const test = `${PREFIX}__probe__`
    store.setItem(test, '1')
    store.removeItem(test)
    return store
  } catch {
    return null
  }
}

const local = typeof window !== 'undefined' ? probe('localStorage') : null
const session = typeof window !== 'undefined' ? probe('sessionStorage') : null
const memoryLocal = createMemoryStore()
const memorySession = createMemoryStore()

const backend = (scope = 'local') => (scope === 'session' ? session || memorySession : local || memoryLocal)

/* ---------- Cache & subscriptions ---------- */

const cache = new Map() // `${scope}:${key}` -> parsed value
const listeners = new Set()
const issues = [] // corruption / write problems seen this session

const cacheKey = (key, scope) => `${scope}:${key}`

const notify = (key) => listeners.forEach((fn) => fn(key))

export const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

if (typeof window !== 'undefined') {
  // Keep tabs in sync: another tab changed storage
  window.addEventListener('storage', (e) => {
    if (e.key && !e.key.startsWith(PREFIX)) return
    cache.clear()
    notify(e.key || '*')
  })
}

/* ---------- Write hooks (used by the audit service) ---------- */

const writeHooks = new Set()
let hooksSuspended = 0

/** fn(key, previousValue, nextValue) runs after every successful local write. Returns an unsubscribe function. */
export const addWriteHook = (fn) => {
  writeHooks.add(fn)
  return () => writeHooks.delete(fn)
}

/** Run bulk writes (seed, reset, import, migration, rollback) without per-record hooks. */
export const withoutWriteHooks = (fn) => {
  hooksSuspended += 1
  try { return fn() } finally { hooksSuspended -= 1 }
}

/* ---------- Core CRUD ---------- */

/**
 * Read and parse a value. Returns `fallback` when missing or corrupted.
 * Results are cached so repeated reads return the same reference.
 */
export const getItem = (key, fallback = null, { scope = 'local' } = {}) => {
  const ck = cacheKey(key, scope)
  if (cache.has(ck)) return cache.get(ck) ?? fallback
  let raw = null
  try {
    raw = backend(scope).getItem(key)
  } catch {
    raw = null
  }
  if (raw === null || raw === undefined) {
    cache.set(ck, null)
    return fallback
  }
  try {
    const parsed = JSON.parse(raw)
    cache.set(ck, parsed)
    return parsed
  } catch {
    issues.push({ key, problem: 'corrupted JSON', at: new Date().toISOString() })
    cache.set(ck, null)
    return fallback
  }
}

/** Serialise and store a value. Returns { ok, error }. Never throws. */
export const setItem = (key, value, { scope = 'local', silent = false } = {}) => {
  const ck = cacheKey(key, scope)
  const hooked = scope === 'local' && writeHooks.size > 0 && hooksSuspended === 0
  const previous = hooked ? getItem(key) : undefined
  try {
    backend(scope).setItem(key, JSON.stringify(value))
    cache.set(ck, value)
    if (!silent) notify(key)
    if (hooked) {
      writeHooks.forEach((fn) => {
        try { fn(key, previous, value) } catch (err) { console.warn('[Bellomassi] write hook failed', err) }
      })
    }
    return { ok: true }
  } catch (error) {
    const quota = error && (error.name === 'QuotaExceededError' || error.code === 22)
    issues.push({ key, problem: quota ? 'storage quota exceeded' : 'write failed', at: new Date().toISOString() })
    return { ok: false, error: quota ? 'Browser storage is full. Export a backup and reset demo data.' : 'Could not save to browser storage.' }
  }
}

/** Update a stored value with a function: updateItem(key, prev => next, fallback). */
export const updateItem = (key, updater, fallback = null, options) => {
  const next = updater(getItem(key, fallback, options))
  return { ...setItem(key, next, options), value: next }
}

export const removeItem = (key, { scope = 'local' } = {}) => {
  try {
    backend(scope).removeItem(key)
  } catch {
    /* ignore */
  }
  cache.delete(cacheKey(key, scope))
  notify(key)
}

/** Remove a key from both local and session scopes. */
export const clearItem = (key) => {
  removeItem(key, { scope: 'local' })
  removeItem(key, { scope: 'session' })
}

const appKeys = (store) => {
  const keys = []
  for (let i = 0; i < store.length; i += 1) {
    const k = store.key(i)
    if (k && k.startsWith(PREFIX)) keys.push(k)
  }
  return keys
}

/** Remove every Bellomassi key in local and session storage (including the session). */
export const clearAllAppData = () => {
  ;[backend('local'), backend('session')].forEach((store) => {
    appKeys(store).forEach((k) => {
      try { store.removeItem(k) } catch { /* ignore */ }
    })
  })
  cache.clear()
  notify('*')
}

/* ---------- Validation ---------- */

const isArrayOf = (v, check) => Array.isArray(v) && v.every(check)
const hasId = (x) => isPlainObject(x) && typeof x.id === 'string'
const recordsWith = (...fields) => (v) => isArrayOf(v, (x) => hasId(x) && fields.every((f) => x[f] !== undefined && x[f] !== null))

const VALIDATORS = {
  [STORAGE_KEYS.DEMO_USERS]: (v) =>
    isArrayOf(v, (u) => isPlainObject(u) && typeof u.id === 'string' && typeof u.email === 'string' && typeof u.role === 'string' && u.role.length > 0) && v.length > 0,
  [STORAGE_KEYS.DEMO_DATA]: (v) => isPlainObject(v) && Array.isArray(v.salesReps),
  [STORAGE_KEYS.CUSTOMERS]: recordsWith('code', 'name'),
  [STORAGE_KEYS.PRODUCTS]: recordsWith('code', 'name', 'sku'),
  [STORAGE_KEYS.HUBS]: recordsWith('code', 'name'),
  [STORAGE_KEYS.INVENTORY]: (v) => isArrayOf(v, (x) => hasId(x) && typeof x.productId === 'string' && typeof x.hubId === 'string' && Number.isFinite(x.totalQuantity)),
  [STORAGE_KEYS.STOCK_RECEIPTS]: recordsWith('productId', 'hubId', 'quantity'),
  [STORAGE_KEYS.STOCK_TRANSFERS]: recordsWith('productId', 'sourceHubId', 'destinationHubId', 'status'),
  [STORAGE_KEYS.STOCK_ADJUSTMENTS]: recordsWith('productId', 'hubId', 'type'),
  [STORAGE_KEYS.STOCK_MOVEMENTS]: recordsWith('productId', 'hubId', 'movementType'),
  [STORAGE_KEYS.ORDERS]: (v) => isArrayOf(v, (o) => hasId(o) && typeof o.orderStatus === 'string' && Array.isArray(o.items)),
  [STORAGE_KEYS.ORDER_SEQUENCE]: (v) => isPlainObject(v) && Number.isInteger(v.lastNumber) && Number.isInteger(v.year),
  [STORAGE_KEYS.APPROVALS]: recordsWith('orderId', 'decision'),
  [STORAGE_KEYS.CONSOLIDATIONS]: recordsWith('orderId', 'consolidationNumber'),
  [STORAGE_KEYS.ORDER_TIMELINE]: recordsWith('orderId', 'eventType', 'timestamp'),
  [STORAGE_KEYS.DISPATCH_ZONES]: recordsWith('code', 'name', 'hubId'),
  [STORAGE_KEYS.DRIVERS]: recordsWith('code', 'name', 'hubId'),
  [STORAGE_KEYS.VEHICLES]: recordsWith('vehicleNumber', 'hubId', 'status'),
  [STORAGE_KEYS.DISPATCHES]: (v) => isArrayOf(v, (d) => hasId(d) && typeof d.status === 'string' && Array.isArray(d.orderIds)),
  [STORAGE_KEYS.DISPATCH_SEQUENCE]: (v) => isPlainObject(v) && Number.isInteger(v.lastNumber),
  [STORAGE_KEYS.DELIVERIES]: (v) => isArrayOf(v, (d) => hasId(d) && typeof d.dispatchId === 'string' && typeof d.orderId === 'string' && typeof d.status === 'string' && Array.isArray(d.items)),
  [STORAGE_KEYS.DELIVERY_SEQUENCE]: (v) => isPlainObject(v) && Number.isInteger(v.lastNumber),
  [STORAGE_KEYS.DELIVERY_OTPS]: recordsWith('deliveryId', 'status'),
  [STORAGE_KEYS.DELIVERY_NOTES]: recordsWith('noteNumber', 'deliveryId'),
  [STORAGE_KEYS.DISPATCH_TIMELINE]: recordsWith('dispatchId', 'eventType', 'timestamp'),
  // Phase 5
  [STORAGE_KEYS.VMS_SETTINGS]: (v) => isPlainObject(v) && Array.isArray(v.requiredVehicleDocs) && Array.isArray(v.requiredDriverDocs),
  [STORAGE_KEYS.DOCUMENT_TYPES]: recordsWith('code', 'name', 'entity'),
  [STORAGE_KEYS.DOCUMENTS]: (v) => isArrayOf(v, (d) => hasId(d) && typeof d.typeCode === 'string' && typeof d.status === 'string' && typeof d.entityType === 'string'),
  [STORAGE_KEYS.OCR_RESULTS]: recordsWith('documentId', 'provider'),
  [STORAGE_KEYS.INVOICE_TEMPLATES]: (v) => isArrayOf(v, (t) => hasId(t) && typeof t.name === 'string' && Array.isArray(t.fields)),
  [STORAGE_KEYS.INVOICES]: (v) => isArrayOf(v, (i) => hasId(i) && typeof i.invoiceNumber === 'string' && typeof i.orderId === 'string' && isPlainObject(i.totals)),
  [STORAGE_KEYS.INVOICE_SETTINGS]: (v) => isPlainObject(v) && typeof v.prefix === 'string' && Number.isInteger(v.lastNumber) && Number.isInteger(v.digits),
  [STORAGE_KEYS.EMAIL_TEMPLATES]: recordsWith('name', 'body'),
  [STORAGE_KEYS.EMAIL_DRAFTS]: recordsWith('status'),
  [STORAGE_KEYS.EMAIL_HISTORY]: recordsWith('status', 'subject'),
  [STORAGE_KEYS.EMAIL_INBOX]: recordsWith('from', 'subject'),
  [STORAGE_KEYS.EMAIL_SETTINGS]: (v) => isPlainObject(v) && isPlainObject(v.smtp) && isPlainObject(v.imap),
  [STORAGE_KEYS.WHATSAPP_TEMPLATES]: recordsWith('name', 'body'),
  [STORAGE_KEYS.WHATSAPP_MESSAGES]: recordsWith('status', 'body'),
  [STORAGE_KEYS.OPENWA_SETTINGS]: (v) => isPlainObject(v) && typeof v.mode === 'string',
  [STORAGE_KEYS.COMMUNICATION_SETTINGS]: (v) => isPlainObject(v),
  [STORAGE_KEYS.NOTIFICATION_TEMPLATES]: recordsWith('event', 'channel'),
  [STORAGE_KEYS.NOTIFICATION_HISTORY]: recordsWith('event', 'dedupeKey'),
  // Phase 6
  [STORAGE_KEYS.AI_SETTINGS]: (v) => isPlainObject(v) && typeof v.provider === 'string',
  [STORAGE_KEYS.AI_CONVERSATIONS]: recordsWith('userId', 'title'),
  [STORAGE_KEYS.AI_MESSAGES]: recordsWith('conversationId', 'role'),
  [STORAGE_KEYS.AI_INSIGHTS]: recordsWith('key', 'type', 'status'),
  [STORAGE_KEYS.AI_ACTIVITY]: recordsWith('userId', 'kind'),
  [STORAGE_KEYS.JARVIS_SETTINGS]: (v) => isPlainObject(v) && typeof v.ttsEngine === 'string',
  [STORAGE_KEYS.JARVIS_HISTORY]: recordsWith('userId', 'text'),
  [STORAGE_KEYS.FORECASTS]: (v) => isArrayOf(v, (f) => hasId(f) && typeof f.status === 'string' && Array.isArray(f.predictions) && isPlainObject(f.request)),
  [STORAGE_KEYS.FORECAST_SETTINGS]: (v) => isPlainObject(v) && Array.isArray(v.suppliers) && isPlainObject(v.productParams),
  [STORAGE_KEYS.INVENTORY_PREDICTIONS]: (v) => isPlainObject(v) && Array.isArray(v.rows) && isPlainObject(v.summary),
  [STORAGE_KEYS.REORDER_RECOMMENDATIONS]: recordsWith('productId', 'hubId', 'status'),
  [STORAGE_KEYS.AI_MODELS]: recordsWith('name', 'kind'),
  [STORAGE_KEYS.REPLENISHMENT_DRAFTS]: (v) => isArrayOf(v, (d) => hasId(d) && typeof d.status === 'string' && Array.isArray(d.lines)),
  [STORAGE_KEYS.SALES_HISTORY]: (v) => isPlainObject(v) && Array.isArray(v.orders) && Array.isArray(v.products),
  // Administration
  [STORAGE_KEYS.ROLES]: (v) => isArrayOf(v, (r) => hasId(r) && typeof r.code === 'string' && typeof r.name === 'string' && Array.isArray(r.permissions)) && v.length > 0,
  [STORAGE_KEYS.PERMISSIONS]: (v) => isPlainObject(v) && Array.isArray(v.knownKeys) && Number.isInteger(v.catalogVersion),
  [STORAGE_KEYS.COMPANY]: (v) => isPlainObject(v) && typeof v.name === 'string' && typeof v.currency === 'string' && typeof v.timezone === 'string',
  [STORAGE_KEYS.ORGANIZATION]: (v) => isPlainObject(v) && ['branches', 'businessUnits', 'departments', 'designations', 'warehouses'].every((k) => isArrayOf(v[k], hasId)),
  [STORAGE_KEYS.AUDIT_LOGS]: (v) => isArrayOf(v, (a) => hasId(a) && typeof a.action === 'string' && typeof a.at === 'string'),
  [STORAGE_KEYS.NOTIFICATION_PREFS]: (v) => isPlainObject(v),
  [STORAGE_KEYS.ACTIVITIES]: (v) => isArrayOf(v, (a) => isPlainObject(a) && typeof a.id === 'string'),
  [STORAGE_KEYS.NOTIFICATIONS]: (v) => isArrayOf(v, (n) => isPlainObject(n) && typeof n.id === 'string' && Array.isArray(n.readBy)),
  [STORAGE_KEYS.SETTINGS]: (v) => isPlainObject(v),
  [STORAGE_KEYS.THEME]: (v) => v === 'light' || v === 'dark',
  // Finalisation (v8)
  [STORAGE_KEYS.SCRAP_REQUESTS]: (v) => isArrayOf(v, (r) => hasId(r) && typeof r.scrapNumber === 'string' && typeof r.status === 'string' && Array.isArray(r.history)),
  [STORAGE_KEYS.CALL_HISTORY]: (v) => isArrayOf(v, (c) => hasId(c) && typeof c.customerId === 'string' && typeof c.callDate === 'string' && Array.isArray(c.notes)),
  [STORAGE_KEYS.DRIVER_TRACKING]: (v) => isPlainObject(v) && Array.isArray(v.sessions),
  [STORAGE_KEYS.DELIVERY_POD]: (v) => isArrayOf(v, (p) => hasId(p) && typeof p.deliveryId === 'string'),
  [STORAGE_KEYS.CUSTOMER_CARTS]: (v) => isPlainObject(v),
  [STORAGE_KEYS.REPORT_PREFS]: (v) => isPlainObject(v),
  // Enterprise expansion (v9): every record has a string id; settings objects are plain objects
  ...Object.fromEntries(ENTERPRISE_COLLECTION_KEYS.map((k) => [k, (v) => isArrayOf(v, hasId)])),
  ...Object.fromEntries(ENTERPRISE_OBJECT_KEYS.map((k) => [k, (v) => isPlainObject(v)])),
}

/**
 * Integrity checks across collections. Orders and stock must point at existing
 * customers / products / hubs; historical documents are allowed to outlive a record.
 */
const validateRelations = (snapshot) => {
  const ids = (arr) => new Set((arr || []).map((x) => x.id))
  const customers = ids(snapshot[STORAGE_KEYS.CUSTOMERS])
  const products = ids(snapshot[STORAGE_KEYS.PRODUCTS])
  const hubs = ids(snapshot[STORAGE_KEYS.HUBS])
  const drivers = ids(snapshot[STORAGE_KEYS.DRIVERS])
  const orderIds = ids(snapshot[STORAGE_KEYS.ORDERS])
  const errors = []
  if (Array.isArray(snapshot[STORAGE_KEYS.ROLES])) {
    const roleCodes = new Set(snapshot[STORAGE_KEYS.ROLES].map((r) => r.code))
    ;(snapshot[STORAGE_KEYS.DEMO_USERS] || []).forEach((u) => {
      ;[u.role, ...(u.additionalRoles || [])].forEach((r) => { if (!roleCodes.has(r)) errors.push(`user ${u.email}: unknown role ${r}`) })
    })
  }
  ;(snapshot[STORAGE_KEYS.ORDERS] || []).forEach((o) => {
    if (!customers.has(o.customerId)) errors.push(`${o.id}: unknown customer ${o.customerId}`)
    if (o.hubId && !hubs.has(o.hubId)) errors.push(`${o.id}: unknown hub ${o.hubId}`)
    if (o.driverId && !drivers.has(o.driverId)) errors.push(`${o.id}: unknown driver ${o.driverId}`)
    ;(o.items || []).forEach((it) => {
      if (!products.has(it.productId)) errors.push(`${o.id}: unknown product ${it.productId}`)
    })
  })
  ;(snapshot[STORAGE_KEYS.DISPATCHES] || []).forEach((d) => {
    if (!hubs.has(d.hubId)) errors.push(`${d.dispatchNumber || d.id}: unknown hub ${d.hubId}`)
    d.orderIds.forEach((oid) => { if (!orderIds.has(oid)) errors.push(`${d.dispatchNumber || d.id}: unknown order ${oid}`) })
  })
  snapshot[STORAGE_KEYS.INVENTORY].forEach((r) => {
    if (!products.has(r.productId)) errors.push(`stock ${r.id}: unknown product ${r.productId}`)
    if (!hubs.has(r.hubId)) errors.push(`stock ${r.id}: unknown hub ${r.hubId}`)
  })
  return errors
}

/* ---------- Seeding ---------- */

export const buildSeed = () => {
  const base = buildBaseSeed()
  base[STORAGE_KEYS.ORGANIZATION] = mergeOrganization(base[STORAGE_KEYS.ORGANIZATION])
  base[STORAGE_KEYS.FORECAST_SETTINGS] = mergeSuppliers(base[STORAGE_KEYS.FORECAST_SETTINGS])
  const out = { ...base, ...buildEnterpriseData(enterpriseInputFromSnapshot(base)) }
  return withReconciledReservations(out)
}

/** Reserved stock is rebuilt from the approved, not yet dispatched orders (data v10, utils/stockReservation). */
const withReconciledReservations = (snap) => {
  const K = STORAGE_KEYS
  if (![K.ORDERS, K.INVENTORY, K.PRODUCTS].every((k) => Array.isArray(snap[k]))) return snap
  // Stock in blocked lots (QA hold, quarantine, rejected, expired) cannot be reserved — same rule as batchService
  const held = {}
  const today = dayjs()
  ;(Array.isArray(snap[K.BATCHES]) ? snap[K.BATCHES] : []).forEach((b) => {
    if (!(b.quantity > 0) || (b.qaStatus === 'AVAILABLE' && !(b.expiryDate && dayjs(b.expiryDate).isBefore(today, 'day')))) return
    const k = `${b.productId}|${b.hubId}`
    held[k] = (held[k] || 0) + b.quantity
  })
  const inventory = snap[K.INVENTORY].map((r) => (held[`${r.productId}|${r.hubId}`] ? { ...r, qaHoldQuantity: Math.round(held[`${r.productId}|${r.hubId}`] * 1000) / 1000 } : r))
  const r = reconcileReservations({ orders: snap[K.ORDERS], inventory, products: snap[K.PRODUCTS], dispatches: Array.isArray(snap[K.DISPATCHES]) ? snap[K.DISPATCHES] : [] })
  return r.changed ? { ...snap, [K.ORDERS]: r.orders, [K.INVENTORY]: r.inventory } : snap
}

const buildBaseSeed = () => {
  const now = dayjs()
  const catalogue = buildCatalogue(now)
  const { orders: legacyOrders, ...data } = buildDemoData(now, catalogue)
  const master = buildMasterData(now, legacyOrders, catalogue)
  const users = buildDemoUsers(now)
  const sales = convertLegacyOrders(legacyOrders, { ...master, salesReps: data.salesReps, users, drivers: data.drivers })
  const { zones: legacyZones, drivers: legacyDrivers, ...demo } = data
  const ds = buildDispatchData({
    now, orders: sales.orders, orderTimeline: sales.timeline, customers: master.customers, products: master.products, hubs: master.hubs,
    users, legacyZones, legacyDrivers, inventory: master.inventory, movements: master.movements, seededAt: data.seededAt,
  })
  const p5 = buildPhase5Data({
    now, vehicles: ds.vehicles, drivers: ds.drivers, customers: master.customers, orders: ds.orders, dispatches: ds.dispatches,
    deliveries: ds.deliveries, notes: ds.notes, hubs: master.hubs, products: master.products, users,
  })
  const comp = completionKeys({
    now, products: master.products, hubs: master.hubs, inventory: ds.inventory, movements: ds.movements, users,
    customers: master.customers, orders: ds.orders, salesReps: data.salesReps, deliveries: ds.deliveries,
  })
  ds.orders = withVipDeliveryTimes(ds.orders, master.customers)
  const p6 = buildPhase6Data({
    now,
    data: {
      products: master.products, customers: master.customers, hubs: master.hubs, orders: ds.orders, inventory: ds.inventory, deliveries: ds.deliveries,
      dispatches: ds.dispatches, receipts: master.receipts, vehicles: p5.vehicles,
    },
  })
  return {
    ...phase5Keys(p5),
    ...phase6Keys(p6),
    ...comp,
    ...adminKeys(now, master.hubs),
    [STORAGE_KEYS.REPLENISHMENT_DRAFTS]: buildDemoReplenishment(now, master.products, master.hubs),
    [STORAGE_KEYS.DEMO_USERS]: users,
    [STORAGE_KEYS.DEMO_DATA]: demo,
    [STORAGE_KEYS.ACTIVITIES]: buildActivities({ timeline: sales.timeline, orders: sales.orders, seededAt: data.seededAt }),
    [STORAGE_KEYS.NOTIFICATIONS]: [...PHASE1_NOTIFICATIONS(now), ...buildNotifications(now, { lowStockCount: master.inventory.filter(isLowOrOut).length })],
    [STORAGE_KEYS.SETTINGS]: { ...DEFAULT_SETTINGS },
    [STORAGE_KEYS.THEME]: DEFAULT_THEME,
    [STORAGE_KEYS.CUSTOMERS]: master.customers,
    [STORAGE_KEYS.PRODUCTS]: master.products,
    [STORAGE_KEYS.HUBS]: master.hubs,
    [STORAGE_KEYS.INVENTORY]: ds.inventory,
    [STORAGE_KEYS.STOCK_RECEIPTS]: master.receipts,
    [STORAGE_KEYS.STOCK_TRANSFERS]: master.transfers,
    [STORAGE_KEYS.STOCK_ADJUSTMENTS]: master.adjustments,
    [STORAGE_KEYS.STOCK_MOVEMENTS]: ds.movements,
    [STORAGE_KEYS.ORDERS]: ds.orders,
    [STORAGE_KEYS.ORDER_SEQUENCE]: sales.sequence,
    [STORAGE_KEYS.APPROVALS]: sales.approvals,
    [STORAGE_KEYS.CONSOLIDATIONS]: sales.consolidations,
    [STORAGE_KEYS.ORDER_TIMELINE]: sales.timeline,
    ...dispatchKeys(ds),
    [STORAGE_KEYS.VEHICLES]: p5.vehicles,
    [STORAGE_KEYS.DRIVERS]: p5.drivers,
  }
}

/** v8 collections. Mutates the given inventory / movements arrays (completed scrap write-offs are posted into them). */
const completionKeys = ({ now, products, hubs, inventory, movements, users, customers, orders, salesReps, deliveries = [] }) => {
  const scrap = buildScrapData({ now, products, hubs, inventory, movements, users })
  return {
    [STORAGE_KEYS.SCRAP_REQUESTS]: scrap.requests,
    [STORAGE_KEYS.CALL_HISTORY]: buildCallData({ now, customers, orders, users, salesReps }),
    [STORAGE_KEYS.DRIVER_TRACKING]: buildTrackingSeed({ deliveries, customers, hubs, now }),
    [STORAGE_KEYS.DELIVERY_POD]: [],
    [STORAGE_KEYS.CUSTOMER_CARTS]: {},
    [STORAGE_KEYS.REPORT_PREFS]: {},
  }
}

const adminKeys = (now, hubs) => ({
  [STORAGE_KEYS.ROLES]: buildRoles(now),
  [STORAGE_KEYS.PERMISSIONS]: buildPermissionState(now),
  [STORAGE_KEYS.COMPANY]: buildCompany(now),
  [STORAGE_KEYS.ORGANIZATION]: buildOrganization(now, hubs || []),
  [STORAGE_KEYS.AUDIT_LOGS]: buildInitialAudit(now),
  [STORAGE_KEYS.NOTIFICATION_PREFS]: {},
})

const phase5Keys = (p5) => ({
  [STORAGE_KEYS.VMS_SETTINGS]: p5.vmsSettings,
  [STORAGE_KEYS.DOCUMENT_TYPES]: p5.documentTypes,
  [STORAGE_KEYS.DOCUMENTS]: p5.documents,
  [STORAGE_KEYS.OCR_RESULTS]: p5.ocrResults,
  [STORAGE_KEYS.INVOICE_TEMPLATES]: p5.invoiceTemplates,
  [STORAGE_KEYS.INVOICES]: p5.invoices,
  [STORAGE_KEYS.INVOICE_SETTINGS]: p5.invoiceSettings,
  [STORAGE_KEYS.EMAIL_TEMPLATES]: p5.emailTemplates,
  [STORAGE_KEYS.EMAIL_DRAFTS]: p5.emailDrafts,
  [STORAGE_KEYS.EMAIL_HISTORY]: p5.emailHistory,
  [STORAGE_KEYS.EMAIL_INBOX]: p5.emailInbox,
  [STORAGE_KEYS.EMAIL_SETTINGS]: p5.emailSettings,
  [STORAGE_KEYS.WHATSAPP_TEMPLATES]: p5.whatsappTemplates,
  [STORAGE_KEYS.WHATSAPP_MESSAGES]: p5.whatsappMessages,
  [STORAGE_KEYS.OPENWA_SETTINGS]: p5.openwaSettings,
  [STORAGE_KEYS.COMMUNICATION_SETTINGS]: p5.communicationSettings,
  [STORAGE_KEYS.NOTIFICATION_TEMPLATES]: p5.notificationTemplates,
  [STORAGE_KEYS.NOTIFICATION_HISTORY]: p5.notificationHistory,
})

const phase6Keys = (p6) => ({
  [STORAGE_KEYS.AI_SETTINGS]: p6.aiSettings,
  [STORAGE_KEYS.AI_CONVERSATIONS]: [],
  [STORAGE_KEYS.AI_MESSAGES]: [],
  [STORAGE_KEYS.AI_INSIGHTS]: p6.insights,
  [STORAGE_KEYS.AI_ACTIVITY]: [],
  [STORAGE_KEYS.JARVIS_SETTINGS]: p6.jarvisSettings,
  [STORAGE_KEYS.JARVIS_HISTORY]: [],
  [STORAGE_KEYS.FORECASTS]: p6.forecasts,
  [STORAGE_KEYS.FORECAST_SETTINGS]: { ...p6.forecastSettings, lastForecastNumber: p6.forecastSequence },
  [STORAGE_KEYS.INVENTORY_PREDICTIONS]: p6.prediction,
  [STORAGE_KEYS.REORDER_RECOMMENDATIONS]: p6.recommendations,
  [STORAGE_KEYS.AI_MODELS]: p6.models,
  [STORAGE_KEYS.REPLENISHMENT_DRAFTS]: [],
  [STORAGE_KEYS.SALES_HISTORY]: p6.salesHistory || { demo: true, from: null, to: null, products: [], prices: [], customers: [], hubs: [], orders: [] },
})

/** Phase 6 data built from whatever Phase 1–5 records a snapshot holds (seed, migration, AI reset). */
const phase6FromSnapshot = (snap, now = dayjs()) => buildPhase6Data({
  now,
  data: {
    products: snap[STORAGE_KEYS.PRODUCTS] || [], customers: snap[STORAGE_KEYS.CUSTOMERS] || [], hubs: snap[STORAGE_KEYS.HUBS] || [], orders: snap[STORAGE_KEYS.ORDERS] || [],
    inventory: snap[STORAGE_KEYS.INVENTORY] || [], deliveries: snap[STORAGE_KEYS.DELIVERIES] || [], dispatches: snap[STORAGE_KEYS.DISPATCHES] || [],
    receipts: snap[STORAGE_KEYS.STOCK_RECEIPTS] || [], vehicles: snap[STORAGE_KEYS.VEHICLES] || [],
  },
})

const dispatchKeys = (ds) => ({
  [STORAGE_KEYS.DISPATCH_ZONES]: ds.zones,
  [STORAGE_KEYS.DRIVERS]: ds.drivers,
  [STORAGE_KEYS.VEHICLES]: ds.vehicles,
  [STORAGE_KEYS.DISPATCHES]: ds.dispatches,
  [STORAGE_KEYS.DISPATCH_SEQUENCE]: ds.dispatchSequence,
  [STORAGE_KEYS.DELIVERIES]: ds.deliveries,
  [STORAGE_KEYS.DELIVERY_SEQUENCE]: ds.deliverySequence,
  [STORAGE_KEYS.DELIVERY_OTPS]: ds.otps,
  [STORAGE_KEYS.DELIVERY_NOTES]: ds.notes,
  [STORAGE_KEYS.DISPATCH_TIMELINE]: ds.timeline,
})

/**
 * Snapshot migrations: { fromVersion: (snapshot) => snapshot }. Pure, so they run both on
 * start-up (browser data) and on import (older backups).
 */
const MIGRATIONS = {
  // v1 → v2: customers/products/hubs/stock move out of bellomassi_demo_data into their own keys
  // with the Phase 2 schema. Record IDs are unchanged, so existing orders keep their relations.
  1: (snap) => {
    const next = { ...snap }
    const old = isPlainObject(snap[STORAGE_KEYS.DEMO_DATA]) ? snap[STORAGE_KEYS.DEMO_DATA] : null
    const now = dayjs()
    const orders = Array.isArray(old?.orders) ? old.orders : []
    const master = buildMasterData(now, orders)
    ;[
      [STORAGE_KEYS.CUSTOMERS, master.customers], [STORAGE_KEYS.PRODUCTS, master.products], [STORAGE_KEYS.HUBS, master.hubs],
      [STORAGE_KEYS.INVENTORY, master.inventory], [STORAGE_KEYS.STOCK_RECEIPTS, master.receipts],
      [STORAGE_KEYS.STOCK_TRANSFERS, master.transfers], [STORAGE_KEYS.STOCK_ADJUSTMENTS, master.adjustments],
      [STORAGE_KEYS.STOCK_MOVEMENTS, master.movements],
    ].forEach(([key, value]) => { if (!Array.isArray(next[key])) next[key] = value })
    if (old) {
      const { customers: _c, products: _p, hubs: _h, stock: _s, ...rest } = old
      next[STORAGE_KEYS.DEMO_DATA] = rest
    }
    return next
  },
  // v2 → v3: orders move out of bellomassi_demo_data into the Phase 3 sales-order schema
  // (bellomassi_orders + timeline, approvals, consolidations and the order-number sequence).
  2: (snap) => {
    const next = { ...snap }
    const demo = isPlainObject(snap[STORAGE_KEYS.DEMO_DATA]) ? snap[STORAGE_KEYS.DEMO_DATA] : null
    if (!Array.isArray(next[STORAGE_KEYS.ORDERS]) && demo && Array.isArray(demo.orders)) {
      const sales = convertLegacyOrders(demo.orders, {
        customers: snap[STORAGE_KEYS.CUSTOMERS] || [],
        products: snap[STORAGE_KEYS.PRODUCTS] || [],
        hubs: snap[STORAGE_KEYS.HUBS] || [],
        salesReps: demo.salesReps || [],
        users: snap[STORAGE_KEYS.DEMO_USERS] || [],
        drivers: demo.drivers || [],
      })
      next[STORAGE_KEYS.ORDERS] = sales.orders
      next[STORAGE_KEYS.ORDER_SEQUENCE] = sales.sequence
      next[STORAGE_KEYS.APPROVALS] = sales.approvals
      next[STORAGE_KEYS.CONSOLIDATIONS] = sales.consolidations
      next[STORAGE_KEYS.ORDER_TIMELINE] = sales.timeline
    }
    if (demo && 'orders' in demo) {
      const { orders: _o, ...rest } = demo
      next[STORAGE_KEYS.DEMO_DATA] = rest
    }
    return next
  },
  // v3 → v4: zones and drivers move out of bellomassi_demo_data into the Phase 4 fleet keys; orders already
  // planned / on the road / delivered become dispatches, deliveries, OTP records and delivery notes.
  3: (snap) => {
    const next = { ...snap }
    const demo = isPlainObject(snap[STORAGE_KEYS.DEMO_DATA]) ? snap[STORAGE_KEYS.DEMO_DATA] : {}
    if (!Array.isArray(next[STORAGE_KEYS.DISPATCHES])) {
      const ds = buildDispatchData({
        orders: snap[STORAGE_KEYS.ORDERS] || [],
        orderTimeline: snap[STORAGE_KEYS.ORDER_TIMELINE] || [],
        customers: snap[STORAGE_KEYS.CUSTOMERS] || [],
        products: snap[STORAGE_KEYS.PRODUCTS] || [],
        hubs: snap[STORAGE_KEYS.HUBS] || [],
        users: snap[STORAGE_KEYS.DEMO_USERS] || [],
        legacyZones: demo.zones || [],
        legacyDrivers: demo.drivers || [],
        inventory: snap[STORAGE_KEYS.INVENTORY] || [],
        movements: snap[STORAGE_KEYS.STOCK_MOVEMENTS] || [],
        seededAt: demo.seededAt,
      })
      Object.assign(next, dispatchKeys(ds))
      next[STORAGE_KEYS.ORDERS] = ds.orders
      next[STORAGE_KEYS.INVENTORY] = ds.inventory
      next[STORAGE_KEYS.STOCK_MOVEMENTS] = ds.movements
    }
    const { zones: _z, drivers: _d, ...rest } = demo
    next[STORAGE_KEYS.DEMO_DATA] = { salesReps: [], ...rest }
    return next
  },
}

MIGRATIONS[4] = (snap) => {
  // v4 → v5: vehicles and drivers gain VMS fields in place; Phase 5 collections are built from existing records.
  const next = { ...snap }
  if (Array.isArray(next[STORAGE_KEYS.DOCUMENTS])) return next
  const p5 = buildPhase5Data({
    vehicles: snap[STORAGE_KEYS.VEHICLES] || [], drivers: snap[STORAGE_KEYS.DRIVERS] || [], customers: snap[STORAGE_KEYS.CUSTOMERS] || [],
    orders: snap[STORAGE_KEYS.ORDERS] || [], dispatches: snap[STORAGE_KEYS.DISPATCHES] || [], deliveries: snap[STORAGE_KEYS.DELIVERIES] || [],
    notes: snap[STORAGE_KEYS.DELIVERY_NOTES] || [], hubs: snap[STORAGE_KEYS.HUBS] || [], products: snap[STORAGE_KEYS.PRODUCTS] || [], users: snap[STORAGE_KEYS.DEMO_USERS] || [],
  })
  Object.assign(next, phase5Keys(p5))
  next[STORAGE_KEYS.VEHICLES] = p5.vehicles
  next[STORAGE_KEYS.DRIVERS] = p5.drivers
  return next
}

MIGRATIONS[5] = (snap) => {
  // v5 → v6: Phase 6 AI collections are added; Phase 1–5 data is untouched.
  const next = { ...snap }
  if (isPlainObject(next[STORAGE_KEYS.AI_SETTINGS])) return next
  Object.assign(next, phase6Keys(phase6FromSnapshot(snap)))
  return next
}

MIGRATIONS[6] = (snap) => {
  // v6 → v7: data-driven roles, organization, company, audit log and notification preferences are added.
  // Existing users keep id, email, password and role; they gain the new profile fields. Missing demo accounts
  // (Super Admin, Warehouse, Inventory, QA, Customer and Supplier) are appended. Nothing else changes.
  const next = { ...snap }
  const now = dayjs()
  if (!Array.isArray(next[STORAGE_KEYS.ROLES])) Object.assign(next, adminKeys(now, snap[STORAGE_KEYS.HUBS] || []))
  const users = Array.isArray(snap[STORAGE_KEYS.DEMO_USERS]) ? snap[STORAGE_KEYS.DEMO_USERS] : []
  const byId = new Map(DEMO_CREDENTIALS.map((c, i) => [c.id, buildDemoUser(c, i, now)]))
  const upgraded = users.map((u) => {
    const def = byId.get(u.id) || {}
    return {
      employeeId: def.employeeId || null, username: def.username || String(u.email || '').split('@')[0], additionalRoles: [],
      department: def.department || null, designation: def.designation || null, customerId: null, supplierId: null,
      mustChangePassword: false, createdBy: 'system',
      ...u,
      hubId: u.hubId === undefined ? (def.hubId ?? null) : u.hubId,
    }
  })
  const emails = new Set(upgraded.map((u) => String(u.email).toLowerCase()))
  const ids = new Set(upgraded.map((u) => u.id))
  DEMO_CREDENTIALS.forEach((c, i) => {
    if (!emails.has(c.email.toLowerCase()) && !ids.has(c.id)) upgraded.push(buildDemoUser(c, i, now))
  })
  if (users.length) next[STORAGE_KEYS.DEMO_USERS] = upgraded
  if (Array.isArray(snap[STORAGE_KEYS.REPLENISHMENT_DRAFTS]) && !snap[STORAGE_KEYS.REPLENISHMENT_DRAFTS].length) {
    next[STORAGE_KEYS.REPLENISHMENT_DRAFTS] = buildDemoReplenishment(now, snap[STORAGE_KEYS.PRODUCTS] || [], snap[STORAGE_KEYS.HUBS] || [])
  }
  if (Array.isArray(snap[STORAGE_KEYS.NOTIFICATIONS])) {
    const have = new Set(snap[STORAGE_KEYS.NOTIFICATIONS].map((n) => n.id))
    next[STORAGE_KEYS.NOTIFICATIONS] = [...PHASE1_NOTIFICATIONS(now).filter((n) => !have.has(n.id)), ...snap[STORAGE_KEYS.NOTIFICATIONS]]
  }
  return next
}

MIGRATIONS[7] = (snap) => {
  // v7 → v8: scrap requests, call history, driver tracking / POD, customer carts and report preferences are added.
  // Existing records are kept; demo scrap write-offs are posted into copies of the stock and movement ledger only
  // where eligible stock exists. Roles gain the new permissions their defaults allow; the Customer role lands on the
  // customer app. VIP customers' open orders get a requested delivery time (used for ETA warnings).
  const next = { ...snap }
  const now = dayjs()
  if (Array.isArray(next[STORAGE_KEYS.SCRAP_REQUESTS])) return next
  const inventory = (snap[STORAGE_KEYS.INVENTORY] || []).map((r) => ({ ...r }))
  const movements = (snap[STORAGE_KEYS.STOCK_MOVEMENTS] || []).map((m) => ({ ...m }))
  const comp = completionKeys({
    now, products: snap[STORAGE_KEYS.PRODUCTS] || [], hubs: snap[STORAGE_KEYS.HUBS] || [], inventory, movements, users: snap[STORAGE_KEYS.DEMO_USERS] || [],
    customers: snap[STORAGE_KEYS.CUSTOMERS] || [], orders: snap[STORAGE_KEYS.ORDERS] || [], salesReps: snap[STORAGE_KEYS.DEMO_DATA]?.salesReps || [],
    deliveries: snap[STORAGE_KEYS.DELIVERIES] || [],
  })
  Object.assign(next, comp)
  if (Array.isArray(snap[STORAGE_KEYS.INVENTORY])) next[STORAGE_KEYS.INVENTORY] = inventory
  if (Array.isArray(snap[STORAGE_KEYS.STOCK_MOVEMENTS])) next[STORAGE_KEYS.STOCK_MOVEMENTS] = movements
  if (Array.isArray(snap[STORAGE_KEYS.ORDERS])) next[STORAGE_KEYS.ORDERS] = withVipDeliveryTimes(snap[STORAGE_KEYS.ORDERS], snap[STORAGE_KEYS.CUSTOMERS] || [])
  if (Array.isArray(snap[STORAGE_KEYS.ROLES])) {
    next[STORAGE_KEYS.ROLES] = snap[STORAGE_KEYS.ROLES].map((r) => {
      if (!r.system) return r
      const add = V8_PERMISSION_KEYS.filter((k) => (PERMISSIONS[k] || []).includes(r.code) && !r.permissions.includes(k))
      const landingPath = r.code === 'CUSTOMER' && (!r.landingPath || r.landingPath === '/dashboard') ? '/customer/dashboard' : r.landingPath
      return add.length || landingPath !== r.landingPath ? { ...r, permissions: [...r.permissions, ...add], landingPath } : r
    })
  }
  return next
}

MIGRATIONS[8] = (snap) => {
  // v8 → v9: enterprise departments (sales/CRM, HORECA, van sales, procurement, import, WMS, QA, logistics, fleet,
  // finance, HR, operations). Nothing existing is replaced: new demo accounts are added only if their id / email /
  // username is free, departments / designations / suppliers only if missing, and each enterprise collection is
  // seeded only when it does not exist yet — built from the live data so every reference is real. Idempotent.
  const next = { ...snap }
  const now = dayjs()
  const users = Array.isArray(snap[STORAGE_KEYS.DEMO_USERS]) ? [...snap[STORAGE_KEYS.DEMO_USERS]] : null
  if (users) {
    const taken = new Set(users.flatMap((u) => [u.id, String(u.email).toLowerCase(), String(u.username || '').toLowerCase()]))
    DEMO_CREDENTIALS.forEach((c, i) => {
      if (taken.has(c.id) || taken.has(c.email.toLowerCase()) || taken.has(c.username.toLowerCase())) return
      users.push(buildDemoUser(c, i, now))
    })
    next[STORAGE_KEYS.DEMO_USERS] = users
  }
  if (Array.isArray(snap[STORAGE_KEYS.ROLES])) {
    // Enterprise roles (same definitions syncCatalog adds at runtime) so imported v8 backups keep valid user → role links
    const codes = new Set(snap[STORAGE_KEYS.ROLES].map((r) => r.code))
    const add = buildRoles(now).filter((r) => !codes.has(r.code))
    // The Supplier role now lands on the supplier portal — only if its landing page was never changed
    const roles = snap[STORAGE_KEYS.ROLES].map((r) => (r.code === 'SUPPLIER' && r.system && (!r.landingPath || r.landingPath === '/dashboard') ? { ...r, landingPath: '/supplier' } : r))
    next[STORAGE_KEYS.ROLES] = [...roles, ...add]
  }
  if (isPlainObject(snap[STORAGE_KEYS.ORGANIZATION])) next[STORAGE_KEYS.ORGANIZATION] = mergeOrganization(snap[STORAGE_KEYS.ORGANIZATION], now)
  if (isPlainObject(snap[STORAGE_KEYS.FORECAST_SETTINGS])) next[STORAGE_KEYS.FORECAST_SETTINGS] = mergeSuppliers(snap[STORAGE_KEYS.FORECAST_SETTINGS])
  const missing = ENTERPRISE_KEYS.filter((k) => snap[k] === null || snap[k] === undefined)
  if (missing.length) {
    const fresh = buildEnterpriseData(enterpriseInputFromSnapshot({ ...snap, [STORAGE_KEYS.DEMO_USERS]: users || [] }), now)
    // Lots and their ledger cursor always travel together
    if (missing.includes(STORAGE_KEYS.BATCHES) || missing.includes(STORAGE_KEYS.BATCH_LEDGER_STATE)) {
      next[STORAGE_KEYS.BATCHES] = Array.isArray(snap[STORAGE_KEYS.BATCHES]) ? snap[STORAGE_KEYS.BATCHES] : fresh[STORAGE_KEYS.BATCHES]
      next[STORAGE_KEYS.BATCH_LEDGER_STATE] = isPlainObject(snap[STORAGE_KEYS.BATCH_LEDGER_STATE]) ? snap[STORAGE_KEYS.BATCH_LEDGER_STATE] : fresh[STORAGE_KEYS.BATCH_LEDGER_STATE]
    }
    missing.forEach((k) => { if (next[k] === null || next[k] === undefined) next[k] = fresh[k] })
  }
  return next
}

MIGRATIONS[9] = (snap) => {
  // v9 → v10 (workflow clean-up):
  // 1. Approved orders reserve their stock per line (order.reservation). Reserved quantities are rebuilt from the
  //    orders that hold stock (approved / consolidated / ready, not yet loaded); reserved stock that no order accounts
  //    for is released. On-hand quantities, movements and lots are not touched.
  // 2. Module report pages moved into the Reports Center: roles (system or custom) holding one of their permission
  //    keys also get reports.center, so nobody loses a report. Nothing is removed. Idempotent.
  const next = withReconciledReservations(snap)
  const roles = snap[STORAGE_KEYS.ROLES]
  if (Array.isArray(roles)) {
    const fixed = roles.map((r) => (Array.isArray(r.permissions) && withReportsCenter(r.permissions) !== r.permissions ? { ...r, permissions: withReportsCenter(r.permissions) } : r))
    if (fixed.some((r, i) => r !== roles[i])) return { ...next, [STORAGE_KEYS.ROLES]: fixed }
  }
  return next
}

/** Permission keys introduced (or re-granted) in data v8. */
const V8_PERMISSION_KEYS = ['inventory.scrap.view', 'scrap.create', 'scrap.approve', 'scrap.reject', 'communication.calls', 'calls.manage', 'customer.app', 'customer.order', 'tracking.fleet', 'reports.center']

export const migrateSnapshot = (snapshot, fromVersion) => {
  let snap = snapshot
  let v = Number(fromVersion) || 1
  while (v < APP_DATA_VERSION) {
    if (MIGRATIONS[v]) snap = MIGRATIONS[v](snap)
    v += 1
  }
  return snap
}

/**
 * Ensure storage holds valid data. Seeds only what is missing or corrupted and
 * never overwrites valid user changes on normal start-up.
 * Returns a report: { seeded: string[], repaired: string[], migratedFrom, persistent }.
 */
export const initializeStorage = () => withoutWriteHooks(() => initializeStorageInner())

const initializeStorageInner = () => {
  const report = { seeded: [], repaired: [], migratedFrom: null, persistent: Boolean(local) }
  const storedVersion = getItem(STORAGE_KEYS.APP_VERSION)
  const firstRun = storedVersion === null

  if (!firstRun && Number(storedVersion?.dataVersion) < APP_DATA_VERSION) {
    const from = Number(storedVersion?.dataVersion) || 1
    report.migratedFrom = from
    const snapshot = Object.fromEntries(DATA_KEYS.map((k) => [k, getItem(k)]))
    const migrated = migrateSnapshot(snapshot, from)
    Object.entries(migrated).forEach(([k, v]) => { if (v !== snapshot[k] && v !== null) setItem(k, v, { silent: true }) })
  }

  let seed = null
  const getSeed = () => (seed ||= buildSeed())
  // Enterprise collections are rebuilt from the live data (not a fresh seed) so their references stay real
  let live = null
  const getLive = () => (live ||= buildEnterpriseData(enterpriseInputFromSnapshot(Object.fromEntries(DATA_KEYS.map((k) => [k, getItem(k)])))))
  const enterprise = new Set(ENTERPRISE_KEYS)

  DATA_KEYS.forEach((key) => {
    const raw = (() => { try { return backend('local').getItem(key) } catch { return null } })()
    const value = getItem(key)
    const valid = value !== null && VALIDATORS[key](value)
    if (valid) return
    setItem(key, enterprise.has(key) && !firstRun ? getLive()[key] : getSeed()[key], { silent: true })
    if (raw === null) report.seeded.push(key)
    else report.repaired.push(key)
  })

  // Settings: add any new default keys without dropping user choices
  const settings = getItem(STORAGE_KEYS.SETTINGS, {})
  const merged = { ...DEFAULT_SETTINGS, ...settings }
  if (Object.keys(merged).length !== Object.keys(settings).length) setItem(STORAGE_KEYS.SETTINGS, merged, { silent: true })

  setItem(
    STORAGE_KEYS.APP_VERSION,
    {
      dataVersion: APP_DATA_VERSION,
      prototypeVersion: appConfig.prototypeVersion,
      initializedAt: firstRun ? new Date().toISOString() : storedVersion?.initializedAt || new Date().toISOString(),
      lastStartedAt: new Date().toISOString(),
    },
    { silent: true },
  )
  return report
}

/** Re-seed all demo data. Keeps the current theme. The session is preserved (caller re-validates it). */
export const resetDemoData = () => withoutWriteHooks(() => {
  const theme = getItem(STORAGE_KEYS.THEME, DEFAULT_THEME)
  const seed = buildSeed()
  seed[STORAGE_KEYS.THEME] = theme
  const results = Object.entries(seed).map(([key, value]) => setItem(key, value, { silent: true }))
  const version = getItem(STORAGE_KEYS.APP_VERSION, {})
  setItem(STORAGE_KEYS.APP_VERSION, { ...version, dataVersion: APP_DATA_VERSION, lastResetAt: new Date().toISOString() }, { silent: true })
  notify('*')
  const failed = results.find((r) => !r.ok)
  return failed || { ok: true }
})

/* ---------- Multi-key transaction ---------- */

/**
 * Write several keys as one unit. If any write fails (e.g. quota), every key already
 * written is restored to its previous value so stock, documents and the movement ledger
 * never disagree. writes: [[key, value], …]
 */
/**
 * Reset only the Phase 6 AI / forecasting collections (conversations, insights, forecasts, predictions,
 * recommendations, drafts, settings) and rebuild them from the current Phase 1–5 data, which is not touched.
 */
export const resetAiData = () => withoutWriteHooks(() => {
  const snap = Object.fromEntries(DATA_KEYS.map((k) => [k, getItem(k)]))
  const fresh = phase6Keys(phase6FromSnapshot(snap))
  const results = PHASE6_KEYS.map((k) => setItem(k, fresh[k], { silent: true }))
  notify('*')
  const failed = results.find((r) => !r.ok)
  return failed ? { ok: false, error: failed.error } : { ok: true, keys: PHASE6_KEYS.length }
})

export const transaction = (writes) => {
  const previous = []
  for (const [key, value] of writes) {
    const before = getItem(key)
    const res = setItem(key, value, { silent: true })
    if (!res.ok) {
      withoutWriteHooks(() => previous.reverse().forEach(([k, v]) => setItem(k, v, { silent: true })))
      return res
    }
    previous.push([key, before])
  }
  writes.forEach(([key]) => notify(key))
  return { ok: true }
}

/* ---------- Activities helper (shared by services) ---------- */

export const appendActivity = (activity) =>
  updateItem(STORAGE_KEYS.ACTIVITIES, (prev) => [activity, ...(prev || [])].slice(0, MAX_ACTIVITIES), [])

/* ---------- Export / import ---------- */

export const exportAppData = () => ({
  signature: EXPORT_SIGNATURE,
  application: appConfig.name,
  prototypeVersion: appConfig.prototypeVersion,
  dataVersion: APP_DATA_VERSION,
  exportedAt: new Date().toISOString(),
  data: Object.fromEntries(DATA_KEYS.map((key) => [key, getItem(key)])),
})

/** Validate an exported payload without writing anything. Returns { ok, errors, summary }. */
const normalisePayload = (payload) => {
  if (!isPlainObject(payload) || !isPlainObject(payload.data)) return payload
  const from = Number(payload.dataVersion) || 1
  if (from >= APP_DATA_VERSION) return payload
  return { ...payload, dataVersion: APP_DATA_VERSION, migratedFrom: from, data: migrateSnapshot({ ...payload.data }, from) }
}

export const validateImportPayload = (rawPayload) => {
  const payload = normalisePayload(rawPayload)
  const errors = []
  if (!isPlainObject(payload)) return { ok: false, errors: ['File is not a JSON object.'] }
  if (payload.signature !== EXPORT_SIGNATURE) errors.push('This file is not a Bellomassi prototype backup.')
  if (Number(payload.dataVersion) > APP_DATA_VERSION)
    errors.push(`Backup was made with a newer data version (${payload.dataVersion}). This app supports version ${APP_DATA_VERSION}.`)
  if (!isPlainObject(payload.data)) errors.push('Backup has no "data" section.')
  if (errors.length) return { ok: false, errors }

  DATA_KEYS.forEach((key) => {
    if (!(key in payload.data)) errors.push(`Missing section: ${key}`)
    else if (!VALIDATORS[key](payload.data[key])) errors.push(`Invalid or corrupted section: ${key}`)
  })
  if (!errors.length) {
    const relationErrors = validateRelations(payload.data)
    if (relationErrors.length) errors.push(...relationErrors.slice(0, 5).map((e) => `Broken relation — ${e}`))
  }
  if (errors.length) return { ok: false, errors }

  const d = payload.data
  return {
    ok: true,
    errors: [],
    payload,
    summary: {
      exportedAt: payload.exportedAt,
      migratedFrom: payload.migratedFrom || null,
      users: d[STORAGE_KEYS.DEMO_USERS].length,
      customers: d[STORAGE_KEYS.CUSTOMERS].length,
      products: d[STORAGE_KEYS.PRODUCTS].length,
      hubs: d[STORAGE_KEYS.HUBS].length,
      stockLines: d[STORAGE_KEYS.INVENTORY].length,
      orders: d[STORAGE_KEYS.ORDERS].length,
      dispatches: d[STORAGE_KEYS.DISPATCHES].length,
      drivers: d[STORAGE_KEYS.DRIVERS].length,
      documents: d[STORAGE_KEYS.DOCUMENTS].length,
      invoices: d[STORAGE_KEYS.INVOICES].length,
      roles: d[STORAGE_KEYS.ROLES].length,
    },
  }
}

/** Replace all app data with a validated backup. Returns { ok, errors }. */
export const importAppData = (payload) => {
  const check = validateImportPayload(payload)
  if (!check.ok) return check
  const results = withoutWriteHooks(() => DATA_KEYS.map((key) => setItem(key, check.payload.data[key], { silent: true })))
  notify('*')
  const failed = results.find((r) => !r.ok)
  return failed ? { ok: false, errors: [failed.error] } : { ok: true, errors: [], summary: check.summary }
}

/* ---------- Diagnostics ---------- */

const QUOTA_ESTIMATE = 5 * 1024 * 1024

/** Approximate usage (UTF-16 → 2 bytes per char) per Bellomassi key. */
export const getStorageUsage = () => {
  const store = backend('local')
  const keys = appKeys(store).map((key) => {
    let raw = ''
    try { raw = store.getItem(key) || '' } catch { /* ignore */ }
    return { key, bytes: (key.length + raw.length) * 2 }
  })
  keys.sort((a, b) => b.bytes - a.bytes)
  const total = keys.reduce((s, k) => s + k.bytes, 0)
  return {
    keys,
    totalBytes: total,
    quotaBytes: QUOTA_ESTIMATE,
    percent: Math.min(100, (total / QUOTA_ESTIMATE) * 100),
    persistent: Boolean(local),
    sessionPersistent: Boolean(session),
  }
}

export const isPersistent = () => Boolean(local)
export const getStorageIssues = () => [...issues]

const storageService = {
  getItem, setItem, updateItem, removeItem, clearItem, clearAllAppData, initializeStorage,
  exportAppData, importAppData, validateImportPayload, getStorageUsage, resetDemoData, resetAiData,
  subscribe, appendActivity, isPersistent, getStorageIssues, transaction, migrateSnapshot, addWriteHook, withoutWriteHooks,
}

export default storageService
