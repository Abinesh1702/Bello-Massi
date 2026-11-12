/**
 * Migration check: loads a LocalStorage snapshot made by an earlier release (JSON of key → string), starts the
 * current code on it and verifies the upgrade keeps user data, rebuilds reservations consistently and is idempotent.
 *   node --import ./scripts/register.mjs scripts/migration-check.mjs <snapshot.json>
 */
import fs from 'node:fs'
const snap = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const mem = new Map(Object.entries(snap))
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size } }
globalThis.window = globalThis; globalThis.addEventListener = () => {}; globalThis.dispatchEvent = () => true
const src = new URL('../src/', import.meta.url).href
const { initializeStorage } = await import(src + 'services/storageService.js')
const { syncCatalog } = await import(src + 'services/rbacService.js')
const { STORAGE_KEYS: K, APP_DATA_VERSION } = await import(src + 'utils/constants.js')
const { openReservationLines } = await import(src + 'utils/stockReservation.js')
const { getAvailable } = await import(src + 'utils/stock.js')
const get = (k) => JSON.parse(mem.get(k))
let fails = 0
const check = (n, c, d = '') => { if (!c) fails += 1; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${!c && d ? ` — ${JSON.stringify(d)}` : ''}`) }

const before = { orders: get(K.ORDERS), customers: get(K.CUSTOMERS), inventory: get(K.INVENTORY), movements: get(K.STOCK_MOVEMENTS), users: get(K.DEMO_USERS), roles: get(K.ROLES) }
const report = initializeStorage(); syncCatalog()
check(`migrated from v${report.migratedFrom} to v${APP_DATA_VERSION}`, report.migratedFrom === 9 && get(K.APP_VERSION).dataVersion === APP_DATA_VERSION, report)
check('no key was reseeded or repaired', report.seeded.length === 0 && report.repaired.length === 0, report)
const after = { orders: get(K.ORDERS), customers: get(K.CUSTOMERS), inventory: get(K.INVENTORY), movements: get(K.STOCK_MOVEMENTS), users: get(K.DEMO_USERS), roles: get(K.ROLES) }
check('orders kept (same count, ids, statuses)', after.orders.length === before.orders.length && after.orders.every((o, i) => o.id === before.orders[i].id && o.orderStatus === before.orders[i].orderStatus))
check('user edit kept (customer name)', after.customers[0].name.endsWith('(edited)'))
check('users kept', after.users.length === before.users.length)
check('on-hand stock and movements untouched', after.movements.length === before.movements.length && after.inventory.every((r, i) => r.totalQuantity === before.inventory[i].totalQuantity && (r.damagedQuantity || 0) === (before.inventory[i].damagedQuantity || 0)))
const open = {}
after.orders.forEach((o) => openReservationLines(o).forEach((l) => { const k = `${l.productId}|${o.hubId}`; open[k] = (open[k] || 0) + l.quantity }))
const mism = after.inventory.filter((r) => Math.abs((r.reservedQuantity || 0) - (open[`${r.productId}|${r.hubId}`] || 0)) > 1e-6)
check('reserved stock equals open-order reservations', mism.length === 0, mism.slice(0, 3).map((r) => [r.productId, r.hubId, r.reservedQuantity]))
check('no negative available stock after migration', after.inventory.every((r) => getAvailable(r) >= -1e-6))
const reserving = after.orders.filter((o) => ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH'].includes(o.orderStatus))
check(`every approved, not yet loaded order carries a reservation (${reserving.length})`, reserving.every((o) => o.reservation && ['RESERVED', 'PARTIAL', 'SHORT'].includes(o.reservation.status)))
const reportRoles = after.roles.filter((r) => (r.permissions || []).some((k) => ['orders.reports', 'dispatch.reports', 'invoices.reports', 'documents.reports', 'vms.view'].includes(k)))
check('roles with a module report page can open the Reports Center', reportRoles.every((r) => r.permissions.includes('reports.center')))
// idempotent: a second start changes nothing
const frozen = JSON.stringify([...mem.entries()].filter(([k]) => ![K.APP_VERSION, K.AUDIT_LOGS, K.PERMISSIONS].includes(k)))
initializeStorage(); syncCatalog()
check('second start changes nothing (idempotent)', JSON.stringify([...mem.entries()].filter(([k]) => ![K.APP_VERSION, K.AUDIT_LOGS, K.PERMISSIONS].includes(k))) === frozen)
console.log(fails ? `\n${fails} check(s) failed` : '\nmigration checks passed')
process.exit(fails ? 1 : 0)
