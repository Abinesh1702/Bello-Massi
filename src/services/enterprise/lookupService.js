/**
 * Option lists and labels for enterprise forms, tables and reports — always read from the live master data
 * (customers, products, suppliers, hubs, users, employees, vehicles, drivers, orders, invoices, other modules).
 */
import storage from '../storageService'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { getSuppliers } from '../supplierService'
import { getRoleByCode } from '../rbacService'

const read = (k) => storage.getItem(k, []) || []
const SOURCES = {
  customers: () => read(K.CUSTOMERS).map((c) => ({ value: c.id, label: `${c.name} (${c.code})`, record: c, inactive: c.status && c.status !== 'Active' })),
  products: () => read(K.PRODUCTS).map((p) => ({ value: p.id, label: `${p.name} · ${p.sku || p.code}`, record: p, inactive: p.status !== 'Active' })),
  suppliers: () => getSuppliers().map((s) => ({ value: s.id, label: s.name, record: s, inactive: s.status === 'Inactive' })),
  hubs: () => read(K.HUBS).map((h) => ({ value: h.id, label: h.name, record: h })),
  users: () => read(K.DEMO_USERS).filter((u) => u.status !== 'inactive').map((u) => ({ value: u.id, label: `${u.name} — ${getRoleByCode(u.role)?.name || u.role}`, record: u })),
  employees: () => read(K.EMPLOYEES).map((e) => ({ value: e.id, label: `${e.name} (${e.employeeCode})`, record: e, inactive: e.status !== 'ACTIVE' })),
  vehicles: () => read(K.VEHICLES).map((v) => ({ value: v.id, label: `${v.vehicleNumber} · ${v.type || ''}`, record: v, inactive: !['Available', 'active', 'Active', 'Assigned', 'On Trip'].includes(v.status) })),
  drivers: () => read(K.DRIVERS).map((d) => ({ value: d.id, label: `${d.name} (${d.code})`, record: d, inactive: d.status && d.status !== 'Active' })),
  orders: () => read(K.ORDERS).filter((o) => o.orderStatus !== 'DRAFT').map((o) => ({ value: o.id, label: o.orderNumber, record: o })),
  invoices: () => read(K.INVOICES).filter((i) => i.status !== 'DRAFT' && i.status !== 'CANCELLED').map((i) => ({ value: i.id, label: i.invoiceNumber, record: i })),
  zones: () => read(K.DISPATCH_ZONES).map((z) => ({ value: z.id, label: z.name, record: z })),
  dispatches: () => read(K.DISPATCHES).map((d) => ({ value: d.id, label: d.dispatchNumber, record: d })),
  departments: () => (storage.getItem(K.ORGANIZATION, {})?.departments || []).map((d) => ({ value: d.id, label: d.name, record: d })),
  designations: () => (storage.getItem(K.ORGANIZATION, {})?.designations || []).map((d) => ({ value: d.id, label: d.name, record: d })),
  branches: () => (storage.getItem(K.ORGANIZATION, {})?.branches || []).map((d) => ({ value: d.id, label: d.name, record: d })),
  businessUnits: () => (storage.getItem(K.ORGANIZATION, {})?.businessUnits || []).map((d) => ({ value: d.id, label: d.name, record: d })),
  locations: () => read(K.WAREHOUSE_LOCATIONS).filter((l) => l.level === 'BIN').map((l) => ({ value: l.id, label: `${l.code} · ${l.storageType}`, record: l })),
  batches: () => read(K.BATCHES).filter((b) => b.quantity > 0).map((b) => ({ value: b.id, label: `${b.batchNumber} · ${b.expiryDate || 'no expiry'}`, record: b })),
  bankAccounts: () => read(K.BANK_ACCOUNTS).map((b) => ({ value: b.id, label: `${b.bankName} · ${b.accountNumber}`, record: b })),
  roles: () => (storage.getItem(K.ROLES, []) || []).filter((r) => r.status === 'active').map((r) => ({ value: r.code, label: r.name, record: r })),
}

const MODULE_KEYS = {
  purchase_requisitions: [K.PURCHASE_REQUISITIONS, 'number'], rfqs: [K.RFQS, 'number'], purchase_orders: [K.PURCHASE_ORDERS, 'number'],
  goods_receipts: [K.GOODS_RECEIPTS, 'number'], import_shipments: [K.IMPORT_SHIPMENTS, 'number'], leads: [K.LEADS, 'number'],
  opportunities: [K.OPPORTUNITIES, 'number'], horeca_accounts: [K.HORECA_ACCOUNTS, 'number'], van_assignments: [K.VAN_ASSIGNMENTS, 'number'],
  job_requisitions: [K.JOB_REQUISITIONS, 'number'], supplier_invoices: [K.SUPPLIER_INVOICES, 'number'], product_recalls: [K.PRODUCT_RECALLS, 'number'],
  qa_inspections: [K.QA_INSPECTIONS, 'number'], service_tickets: [K.SERVICE_TICKETS, 'number'],
}

let cache = { at: 0, data: {} }
/** Options for a lookup name (cached for 1 s so long forms stay fast). */
export const optionsFor = (name) => {
  if (Date.now() - cache.at > 1000) cache = { at: Date.now(), data: {} }
  if (cache.data[name]) return cache.data[name]
  let out = []
  if (SOURCES[name]) out = SOURCES[name]()
  else if (name?.startsWith('module:')) {
    const [key, field] = MODULE_KEYS[name.slice(7)] || []
    if (key) out = read(key).map((r) => ({ value: r.id, label: `${r[field] || r.id}${r.title ? ` · ${r.title}` : r.name ? ` · ${r.name}` : ''}`, record: r }))
  }
  cache.data[name] = out
  return out
}

export const labelFor = (name, value) => {
  if (value === null || value === undefined || value === '') return '—'
  const o = optionsFor(name).find((x) => x.value === value)
  return o ? o.label.replace(/ — .*$/, '') : String(value)
}

export const recordFor = (name, value) => optionsFor(name).find((x) => x.value === value)?.record || null
