/**
 * Pure builders for the administration data added when Phase 1 was completed:
 * system roles (from the default permission map), permission-catalog state, company profile (UAE defaults),
 * organization masters, Phase 1 demo notifications and the initial audit entry. No storage access here.
 */
import { ENTERPRISE_ROLE_BY_CODE, ENTERPRISE_ROLE_CODES, SYSTEM_ROLE_DEPARTMENTS } from '../../config/enterprise/roles'
import dayjs from 'dayjs'
import { ALL_ROLES, LOCKED_ROLES, PROTECTED_ROLES, ROLE_META, ROLES } from '../../config/roles'
import { defaultPermissionsFor } from '../../config/permissions'
import { ALL_PERMISSION_KEYS, CATALOG_VERSION } from '../../config/rbacCatalog'
import { ORG_DEFAULTS } from '../../config/runtimeConfig'

const ROLE_COLORS = {
  SUPER_ADMIN: '#0F172A', ADMIN: '#232B5F', SALESMAN: '#0E7490', SALES_MANAGER: '#7C3AED', CUSTOMER_SERVICE: '#DB2777',
  DISPATCHER: '#EA580C', DRIVER: '#16A34A', FINANCE: '#B45309', WAREHOUSE_MANAGER: '#0369A1', INVENTORY_EXECUTIVE: '#4D7C0F',
  QA_MANAGER: '#9F1239', CUSTOMER: '#155E75', SUPPLIER: '#6D28D9',
}

const LANDING = { DRIVER: '/driver/dashboard', CUSTOMER: '/customer/dashboard', SUPPLIER: '/supplier' }

export const buildSystemRole = (code, now = dayjs()) => ({
  id: `role-${code.toLowerCase().replace(/_/g, '-')}`,
  code,
  name: ROLE_META[code].label,
  description: ROLE_META[code].description,
  workspace: ROLE_META[code].workspace,
  department: ENTERPRISE_ROLE_BY_CODE[code]?.department || SYSTEM_ROLE_DEPARTMENTS[code] || '',
  dataScope: ROLE_META[code].scope,
  landingPath: ENTERPRISE_ROLE_BY_CODE[code]?.landing || LANDING[code] || '/dashboard',
  color: ROLE_COLORS[code] || '#232B5F',
  status: 'active',
  system: true,
  protected: PROTECTED_ROLES.includes(code),
  locked: LOCKED_ROLES.includes(code),
  permissions: defaultPermissionsFor(code),
  createdAt: now.subtract(140, 'day').toISOString(),
  updatedAt: now.subtract(140, 'day').toISOString(),
  createdBy: 'system',
})

export const buildRoles = (now = dayjs()) => [...ALL_ROLES, ...ENTERPRISE_ROLE_CODES].map((code) => buildSystemRole(code, now))

/** Which catalog keys the stored roles already know about — lets later versions add keys without undoing admin edits. */
export const buildPermissionState = (now = dayjs()) => ({
  catalogVersion: CATALOG_VERSION,
  knownKeys: [...ALL_PERMISSION_KEYS],
  syncedAt: now.toISOString(),
})

export const buildCompany = (now = dayjs()) => ({
  id: 'company',
  name: 'Bellomassi',
  legalName: 'Bellomassi Foods Trading L.L.C.',
  logo: null,
  tagline: 'Order-to-Delivery Management',
  addressLine1: 'Office 1204, Building 3, Dubai Investments Park',
  addressLine2: 'PO Box 51234',
  city: 'Dubai',
  region: 'Dubai',
  postalCode: '',
  country: ORG_DEFAULTS.country,
  countryCode: ORG_DEFAULTS.countryCode,
  currency: ORG_DEFAULTS.currency,
  timezone: ORG_DEFAULTS.timezone,
  phone: '+971 4 555 0100',
  email: 'info@bellomassi.demo',
  website: 'www.bellomassi.demo',
  taxRegistrationNumber: '100123456700003',
  taxRegistrationLabel: 'TRN',
  tradeLicenseNumber: 'DED-1056632',
  fiscalYearStartMonth: 1,
  updatedAt: now.subtract(30, 'day').toISOString(),
})

const mk = (prefix) => (rows, now) => rows.map(([id, code, name, extra = {}], i) => ({
  id, code, name, status: 'active', description: '', ...extra, createdAt: now.subtract(140 - i, 'day').toISOString(), updatedAt: now.subtract(140 - i, 'day').toISOString(), _type: prefix,
})).map(({ _type, ...r }) => r)

export const buildOrganization = (now = dayjs(), hubs = []) => {
  const branches = mk('br')([
    ['br-dxb', 'DXB', 'Dubai Head Office', { country: 'United Arab Emirates', city: 'Dubai', address: 'Dubai Investments Park, Dubai', manager: 'Omar Al Mansoori', phone: '+971 4 555 0100', isHeadOffice: true }],
    ['br-auh', 'AUH', 'Abu Dhabi Sales Office', { country: 'United Arab Emirates', city: 'Abu Dhabi', address: 'Mussafah Industrial Area, Abu Dhabi', manager: 'Layla Haddad', phone: '+971 2 555 0200', isHeadOffice: false }],
    ['br-ind', 'IND', 'India Operations — Chennai', { country: 'India', city: 'Chennai', address: 'SIDCO Industrial Estate, Ambattur, Chennai', manager: 'Arjun Mehta', phone: '+91 44 2625 1100', isHeadOffice: false }],
  ], now)
  const businessUnits = mk('bu')([
    ['bu-food', 'FDS', 'Food Distribution', { description: 'Frozen and chilled food sales to trade, HoReCa and modern retail.', head: 'Priya Natarajan' }],
    ['bu-cold', 'CCL', 'Cold Chain Logistics', { description: 'Temperature-controlled warehousing, dispatch and last-mile delivery.', head: 'Ramesh Iyer' }],
    ['bu-shared', 'SHS', 'Shared Services', { description: 'Finance, IT, HR and quality assurance.', head: 'Omar Al Mansoori' }],
  ], now)
  const departments = mk('dep')([
    ['dep-admin', 'ADM', 'Administration & IT', { businessUnitId: 'bu-shared', branchId: 'br-dxb' }],
    ['dep-sales', 'SAL', 'Sales', { businessUnitId: 'bu-food', branchId: 'br-ind' }],
    ['dep-cs', 'CSV', 'Customer Service', { businessUnitId: 'bu-food', branchId: 'br-ind' }],
    ['dep-logistics', 'LOG', 'Logistics & Dispatch', { businessUnitId: 'bu-cold', branchId: 'br-ind' }],
    ['dep-warehouse', 'WHS', 'Warehouse & Inventory', { businessUnitId: 'bu-cold', branchId: 'br-ind' }],
    ['dep-finance', 'FIN', 'Finance', { businessUnitId: 'bu-shared', branchId: 'br-dxb' }],
    ['dep-qa', 'QAS', 'Quality Assurance', { businessUnitId: 'bu-shared', branchId: 'br-dxb' }],
    ['dep-external', 'EXT', 'External Partners (portal)', { businessUnitId: 'bu-food', branchId: 'br-dxb', description: 'Customer and supplier portal accounts.' }],
  ], now)
  const designations = mk('des')([
    ['des-it-director', 'ITD', 'Group IT Director', { departmentId: 'dep-admin', level: 'Executive' }],
    ['des-sysadmin', 'SYS', 'System Administrator', { departmentId: 'dep-admin', level: 'Manager' }],
    ['des-sales-manager', 'SM', 'Sales Manager', { departmentId: 'dep-sales', level: 'Manager' }],
    ['des-sales-exec', 'SE', 'Sales Executive', { departmentId: 'dep-sales', level: 'Staff' }],
    ['des-cs-lead', 'CSL', 'Customer Service Lead', { departmentId: 'dep-cs', level: 'Supervisor' }],
    ['des-dispatch', 'DC', 'Dispatch Coordinator', { departmentId: 'dep-logistics', level: 'Supervisor' }],
    ['des-driver', 'DRV', 'Delivery Driver', { departmentId: 'dep-logistics', level: 'Staff' }],
    ['des-wh-manager', 'WHM', 'Warehouse Manager', { departmentId: 'dep-warehouse', level: 'Manager' }],
    ['des-inv-exec', 'INV', 'Inventory Executive', { departmentId: 'dep-warehouse', level: 'Staff' }],
    ['des-finance-exec', 'FE', 'Finance Executive', { departmentId: 'dep-finance', level: 'Staff' }],
    ['des-qa-manager', 'QAM', 'QA Manager', { departmentId: 'dep-qa', level: 'Manager' }],
    ['des-portal', 'PRT', 'Portal User', { departmentId: 'dep-external', level: 'External' }],
  ], now)
  const warehouses = hubs.flatMap((h, i) => {
    const active = String(h.status || '').toLowerCase() !== 'inactive'
    return [
      { id: `wh-${h.id}-frz`, code: `${h.code}-FRZ`, name: `${h.name} — Frozen store`, hubId: h.id, type: 'Frozen', temperatureMin: -22, temperatureMax: -18, capacityPallets: Math.round((h.capacityPallets || 400) * 0.6), status: active ? 'active' : 'inactive', description: '' },
      { id: `wh-${h.id}-chl`, code: `${h.code}-CHL`, name: `${h.name} — Chiller`, hubId: h.id, type: 'Chilled', temperatureMin: 0, temperatureMax: 4, capacityPallets: Math.round((h.capacityPallets || 400) * 0.4), status: active ? 'active' : 'inactive', description: '' },
    ].map((w, j) => ({ ...w, createdAt: now.subtract(130 - i * 2 - j, 'day').toISOString(), updatedAt: now.subtract(130 - i * 2 - j, 'day').toISOString() }))
  })
  return { branches, businessUnits, departments, designations, warehouses }
}

/** Notification categories (derived from links for older notifications). */
export const PHASE1_NOTIFICATIONS = (now = dayjs()) => {
  const at = (mins) => now.subtract(mins, 'minute').toISOString()
  const { ADMIN, SUPER_ADMIN, SALES_MANAGER, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE, DISPATCHER, QA_MANAGER, FINANCE } = ROLES
  return [
    { id: 'n-p1-approval', category: 'approvals', title: 'Pending order approval', message: 'Orders submitted by the sales team are waiting for your approval decision.', type: 'warning', roles: [SALES_MANAGER, ADMIN, SUPER_ADMIN], link: '/orders/approval', createdAt: at(12), readBy: [] },
    { id: 'n-p1-lowstock', category: 'inventory', title: 'Low stock alert', message: 'Several stock lines are at or below their reorder level. Review and raise receipts or transfers.', type: 'warning', roles: [WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE, ADMIN, SUPER_ADMIN], link: '/inventory/low-stock', createdAt: at(18), readBy: [] },
    { id: 'n-p1-expiry', category: 'quality', title: 'Expiry alert', message: 'Batch-level expiry tracking is not yet recorded in stock. Review product shelf-life rules and document expiry until batch tracking is added.', type: 'info', roles: [QA_MANAGER, WAREHOUSE_MANAGER], link: '/products', createdAt: at(26), readBy: [] },
    { id: 'n-p1-dispatch', category: 'dispatch', title: 'Dispatch ready', message: 'Consolidated orders are ready to be planned into a dispatch.', type: 'info', roles: [DISPATCHER, WAREHOUSE_MANAGER], link: '/dispatch/ready-orders', createdAt: at(34), readBy: [] },
    { id: 'n-p1-failed', category: 'delivery', title: 'Delivery failed', message: 'A delivery stop was marked as failed and needs a review decision.', type: 'danger', roles: [DISPATCHER, ADMIN, SUPER_ADMIN], link: '/dispatch/delivery-history', createdAt: at(48), readBy: [] },
    { id: 'n-p1-vehicle', category: 'vms', title: 'Vehicle document expiry', message: 'One or more vehicle documents have expired or expire soon. Renew them before assigning the vehicle.', type: 'warning', roles: [DISPATCHER, QA_MANAGER, ADMIN, SUPER_ADMIN], link: '/vms/document-expiry', createdAt: at(62), readBy: [] },
    { id: 'n-p1-purchase', category: 'procurement', title: 'Purchase approval', message: 'Replenishment drafts submitted for approval will appear in the replenishment queue.', type: 'info', roles: [ADMIN, SUPER_ADMIN, WAREHOUSE_MANAGER, FINANCE], link: '/ai/replenishment', createdAt: at(80), readBy: [] },
    { id: 'n-p1-qa', category: 'quality', title: 'QA inspection required', message: 'Uploaded documents are waiting for OCR review and verification.', type: 'warning', roles: [QA_MANAGER], link: '/documents/ocr-queue', createdAt: at(95), readBy: [] },
  ]
}

export const buildInitialAudit = (now = dayjs()) => [{
  id: 'aud-init',
  at: now.toISOString(),
  userId: null,
  userName: 'System',
  action: 'SYSTEM',
  module: 'settings',
  entity: 'Environment',
  recordId: null,
  recordLabel: 'Demo environment',
  description: 'Demo environment initialised with sample data.',
  changes: [],
}]

/**
 * One approved replenishment draft addressed to the demo supplier (sup-01), so the Supplier portal has data.
 * Created by the Warehouse Manager and approved by the Administrator — labelled as demo seed data.
 */
export const buildDemoReplenishment = (now = dayjs(), products = [], hubs = []) => {
  const hub = hubs.find((h) => h.id === 'hub-che') || hubs[0]
  const lines = products.filter((p) => p.category === 'Frozen Food' && p.status === 'Active').slice(0, 3)
  if (!hub || !lines.length) return []
  const at = (d) => now.subtract(d, 'day').toISOString()
  const qty = [60, 40, 50]
  const draftLines = lines.map((p, i) => ({ productId: p.id, productName: p.name, productCode: p.code, unit: p.unit, recommendedQty: qty[i], quantity: qty[i], unitCost: Number(p.purchasePrice) || 0, recommendationId: null }))
  return [{
    id: 'rpl-demo-001', number: `RPL-${now.year()}-0001`, status: 'APPROVED', hubId: hub.id, supplierId: 'sup-01', supplierName: 'Coastal Frozen Foods Pvt Ltd', leadTimeDays: 6,
    lines: draftLines, estimatedValue: Math.round(draftLines.reduce((s, l) => s + l.quantity * l.unitCost, 0)), notes: 'Demo seed: monthly frozen poultry top-up for Chennai.', source: 'manual', warnings: [],
    createdBy: 'u-warehouse', createdByName: 'Ramesh Iyer', createdAt: at(3), submittedAt: at(3), approvedAt: at(2), approvedBy: 'u-admin',
    history: [
      { at: at(3), action: 'Created', by: 'u-warehouse', byName: 'Ramesh Iyer', note: 'Demo seed data' },
      { at: at(3), action: 'Submitted', by: 'u-warehouse', byName: 'Ramesh Iyer', note: '' },
      { at: at(2), action: 'Approved', by: 'u-admin', byName: 'Arjun Mehta', note: 'Approved for next week’s delivery.' },
    ],
  }]
}
