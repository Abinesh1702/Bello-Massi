/**
 * Fine-grained UI permissions. Prototype only — enforced in the browser, not a server.
 *
 * PERMISSIONS holds the DEFAULT grants of the system roles (used to seed bellomassi_roles and as the fallback
 * before the roles store is available). At runtime can() asks the resolver registered by services/rbacService.js,
 * which reads the live, editable role definitions — so permission changes made in Role Management take effect
 * immediately in navigation, routes, buttons and the service-layer checks that run before every action.
 */
import { ROLES } from './roles'
import { ALL_PERMISSION_KEYS } from './rbacCatalog'
import { ENTERPRISE_PERMISSIONS } from './enterprise/permissionCatalog'
import { ENTERPRISE_ROLE_BY_CODE } from './enterprise/roles'

const {
  ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, DRIVER, FINANCE,
  WAREHOUSE_MANAGER: WM, INVENTORY_EXECUTIVE: IE, QA_MANAGER: QA, CUSTOMER, SUPPLIER,
} = ROLES
const OFFICE = [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE]

export const PERMISSIONS = {
  'dashboard.view': [...OFFICE, DRIVER, WM, IE, QA, CUSTOMER, SUPPLIER],

  'customers.view': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE],
  'customers.manage': [ADMIN],
  'customers.credit.view': [ADMIN, SALES_MANAGER, FINANCE],

  'products.view': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE, WM, IE, QA],
  'products.manage': [ADMIN],

  'suppliers.view': [ADMIN, SALES_MANAGER, DISPATCHER, FINANCE, WM],
  'suppliers.manage': [ADMIN],

  'hubs.view': [ADMIN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, WM, IE, QA],
  'hubs.manage': [ADMIN],

  'inventory.dashboard': [ADMIN, DISPATCHER, FINANCE, WM, IE],
  'inventory.stock.view': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE, WM, IE, QA],
  'inventory.lowstock.view': [ADMIN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, WM, IE, QA],
  'inventory.movements.view': [ADMIN, DISPATCHER, WM, IE, QA],
  'inventory.documents.view': [ADMIN, DISPATCHER, WM, IE, QA],
  'inventory.receipts.manage': [ADMIN, WM, IE],
  'inventory.transfers.manage': [ADMIN, WM, IE],
  'inventory.adjustments.manage': [ADMIN, WM, QA],
  'inventory.scrap.view': [ADMIN, DISPATCHER, WM, IE, QA],
  'scrap.create': [ADMIN, DISPATCHER, WM, IE, QA],
  'scrap.approve': [ADMIN, WM],
  'scrap.reject': [ADMIN, WM],

  'warehouse.dashboard': [ADMIN, WM, IE, QA],
  'warehouse.qa.view': [ADMIN, WM, QA],

  // Phase 3 — orders. What each role sees inside lists is scoped by orderService.canViewOrder (data scope).
  'orders.view': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE, WM],
  'orders.create': [ADMIN, SALESMAN],
  'orders.mine': [ADMIN, SALESMAN],
  'orders.corrections.view': [ADMIN, SALESMAN, SALES_MANAGER],
  'orders.approval.view': [ADMIN, SALES_MANAGER],
  'orders.approve': [SALES_MANAGER],
  'orders.reject': [SALES_MANAGER],
  'orders.consolidation.view': [ADMIN, CUSTOMER_SERVICE],
  'orders.consolidate': [CUSTOMER_SERVICE],
  'orders.reports': [ADMIN, SALES_MANAGER, FINANCE],
  'sales.targets.manage': [ADMIN, SALES_MANAGER],
  'customer.app': [CUSTOMER],
  'customer.order': [CUSTOMER],
  'tracking.fleet': [ADMIN, DISPATCHER],

  // Phase 4 — dispatch & delivery. Admin has full access; the Dispatcher runs the workflow.
  'dispatch.view': [ADMIN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE, WM],
  'dispatch.ready.view': [ADMIN, CUSTOMER_SERVICE, DISPATCHER, WM],
  'dispatch.manage': [ADMIN, DISPATCHER],
  'dispatch.tracking': [ADMIN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER],
  'dispatch.history': [ADMIN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE, WM],
  'dispatch.reports': [ADMIN, DISPATCHER, FINANCE],
  'dispatch.otp.inspect': [ADMIN, DISPATCHER],
  'deliveries.view': [ADMIN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE, SALESMAN, WM],
  'fleet.view': [ADMIN, DISPATCHER],
  'fleet.manage': [ADMIN],
  'deliveryNotes.view': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE, WM],
  'driver.app': [DRIVER],

  // Phase 5 — VMS (extends the fleet permissions)
  'vms.view': [ADMIN, DISPATCHER, QA],
  'vms.manage': [ADMIN],
  'vms.documents.upload': [ADMIN, DISPATCHER, CUSTOMER_SERVICE],
  'vms.settings': [ADMIN],
  // Central document repository & OCR. Salesmen see documents of their own customers / orders.
  'documents.view': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE, WM, IE, QA],
  'documents.upload': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE, DRIVER, WM, IE, QA],
  'documents.review': [ADMIN, CUSTOMER_SERVICE, QA],
  'documents.reject': [ADMIN, CUSTOMER_SERVICE, QA],
  'documents.types': [ADMIN],
  'documents.reports': [ADMIN, CUSTOMER_SERVICE, QA],
  // Invoices
  'invoices.view': [ADMIN, SALES_MANAGER, FINANCE],
  'invoices.manage': [ADMIN, FINANCE],
  'invoices.templates': [ADMIN, FINANCE],
  'invoices.reports': [ADMIN, FINANCE],
  // Communication
  'communication.view': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE],
  'communication.send': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE],
  'communication.inbox': [ADMIN, CUSTOMER_SERVICE, SALES_MANAGER],
  'communication.templates': [ADMIN],
  'communication.settings': [ADMIN],
  'communication.automation': [ADMIN],
  'communication.calls': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE],
  'calls.manage': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE],
  'whatsapp.view': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE],
  'whatsapp.send': [ADMIN, SALESMAN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE],

  // Phase 6 — AI & intelligence. Tools inside the assistant also check the underlying module permission.
  'ai.assistant.view': [...OFFICE, WM, IE, QA],
  'ai.assistant.use': [...OFFICE, WM, IE, QA],
  'ai.insights.view': [ADMIN, SALES_MANAGER, CUSTOMER_SERVICE, DISPATCHER, FINANCE, WM, QA],
  'ai.insights.manage': [ADMIN, SALES_MANAGER, DISPATCHER],
  'jarvis.view': [...OFFICE, WM],
  'jarvis.use': [...OFFICE, WM],
  'forecasting.view': [ADMIN, SALES_MANAGER, DISPATCHER, FINANCE, WM],
  'forecasting.generate': [ADMIN, SALES_MANAGER],
  'forecasting.export': [ADMIN, SALES_MANAGER, FINANCE],
  'inventory.predictions.view': [ADMIN, SALES_MANAGER, DISPATCHER, FINANCE, WM],
  'inventory.predictions.manage': [ADMIN],
  'inventory.replenishment.create': [ADMIN, DISPATCHER, WM, IE],
  'procurement.view': [ADMIN, SALES_MANAGER, DISPATCHER, FINANCE, WM, IE],
  'procurement.approve': [ADMIN],
  'procurement.reject': [ADMIN],
  'ai.settings.manage': [ADMIN],
  'ai.models.manage': [ADMIN],

  // Reports, finance & data exchange
  'reports.inventory': [ADMIN, SALES_MANAGER, FINANCE, WM],
  'reports.center': [...OFFICE, WM, IE, QA],
  'data.export': [...OFFICE, WM, IE, QA],
  'data.import': [ADMIN],
  'finance.view': [ADMIN, FINANCE],

  // Administration (Phase 1 completion)
  'settings.view': [ADMIN],
  'settings.manage': [ADMIN],
  'organization.view': [ADMIN],
  'organization.manage': [ADMIN],
  'users.view': [ADMIN],
  'users.create': [ADMIN],
  'users.edit': [ADMIN],
  'users.delete': [ADMIN],
  'users.manage': [ADMIN],
  'roles.view': [ADMIN],
  'roles.create': [ADMIN],
  'roles.edit': [ADMIN],
  'roles.delete': [ADMIN],
  'audit.view': [ADMIN],

  // Project workspace (catalog v3 — granted to system roles on start-up by rbacService.syncCatalog): device emulator and project documentation library
  'mobile.preview': [ADMIN, SALES_MANAGER, DISPATCHER],
  'project.documents.view': [ADMIN, SALES_MANAGER, DISPATCHER, FINANCE],
  'project.documents.restricted': [ADMIN],
}

/** Default permission keys of a system role (Super Admin: every key). */
// Enterprise keys: default grants for the original system roles come from the enterprise catalog.
ENTERPRISE_PERMISSIONS.forEach(([key, , , , roles]) => { PERMISSIONS[key] = [...new Set([...(PERMISSIONS[key] || []), ...roles])] })

const KNOWN = new Set(ALL_PERMISSION_KEYS)
export const defaultPermissionsFor = (role) => {
  if (role === ROLES.SUPER_ADMIN) return [...ALL_PERMISSION_KEYS]
  const ent = ENTERPRISE_ROLE_BY_CODE[role]
  if (ent) return ent.permissions.filter((k) => KNOWN.has(k))
  return ALL_PERMISSION_KEYS.filter((k) => (PERMISSIONS[k] || []).includes(role))
}

/** Static default check, used before the roles store exists. */
const staticAllows = (role, permission) => role === ROLES.SUPER_ADMIN || (PERMISSIONS[permission] || []).includes(role) || Boolean(ENTERPRISE_ROLE_BY_CODE[role]?.permissions.includes(permission))

let resolver = null
/** fn(roleCode, permission) → boolean | null (null = unknown role → static default). Registered by rbacService. */
export const setPermissionResolver = (fn) => { resolver = fn }

/** A permission subject: a role code, an array of role codes, or a user ({ role, additionalRoles }). */
export const subjectRoles = (subject) => {
  if (!subject) return []
  if (typeof subject === 'string') return [subject]
  if (Array.isArray(subject)) return subject.filter(Boolean)
  return [subject.role, ...(Array.isArray(subject.additionalRoles) ? subject.additionalRoles : [])].filter(Boolean)
}

const roleAllows = (role, permission) => {
  if (resolver) {
    const r = resolver(role, permission)
    if (r !== null && r !== undefined) return r
  }
  return staticAllows(role, permission)
}

/** can(user | role | roles, 'module.permission') — true if ANY of the subject's roles grants the permission. */
export const can = (subject, permission) => subjectRoles(subject).some((r) => roleAllows(r, permission))


