/**
 * Centralised role configuration. UI-level prototype authorisation only — not server-side security.
 *
 * System role codes are fixed; administrators can rename them, edit their permissions and add custom roles
 * (stored in bellomassi_roles). Labels are resolved at runtime through the role lookup registered by
 * services/rbacService.js, so renamed and custom roles show their current name everywhere.
 */
import { ENTERPRISE_ROLES } from './enterprise/roles'

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SALESMAN: 'SALESMAN',
  SALES_MANAGER: 'SALES_MANAGER',
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE',
  DISPATCHER: 'DISPATCHER',
  DRIVER: 'DRIVER',
  FINANCE: 'FINANCE',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  INVENTORY_EXECUTIVE: 'INVENTORY_EXECUTIVE',
  QA_MANAGER: 'QA_MANAGER',
  CUSTOMER: 'CUSTOMER',
  SUPPLIER: 'SUPPLIER',
})

/** System role codes (custom roles are added at runtime). */
export const ALL_ROLES = Object.values(ROLES)

/** Roles whose definition cannot be deleted. Super Admin's permissions are also locked. */
export const PROTECTED_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN]
export const LOCKED_ROLES = [ROLES.SUPER_ADMIN]

export const ROLE_META = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    short: 'Super Admin',
    workspace: 'Admin Panel',
    description: 'Full, locked access to every module, role and setting. Can grant the Super Admin role.',
    scope: 'ADMIN',
  },
  ADMIN: {
    label: 'Administrator',
    short: 'Admin',
    workspace: 'Admin Panel',
    description: 'Manages users, customers, items, zones and rules. Monitors every order live.',
    scope: 'ADMIN',
  },
  SALESMAN: {
    label: 'Sales Executive',
    short: 'Sales',
    workspace: 'Order Taking App',
    description: 'Captures orders from calls, email and WhatsApp and submits them for approval.',
    scope: 'SALESMAN',
  },
  SALES_MANAGER: {
    label: 'Sales Manager',
    short: 'Manager',
    workspace: 'Order Taking App',
    description: 'Approves value, quantity and credit limit — accepts, rejects or returns with a reason.',
    scope: 'SALES_MANAGER',
  },
  CUSTOMER_SERVICE: {
    label: 'Customer Service',
    short: 'CS',
    workspace: 'Order Taking App',
    description: 'Consolidates approved orders per salesman and releases them to dispatch.',
    scope: 'CUSTOMER_SERVICE',
  },
  DISPATCHER: {
    label: 'Dispatcher',
    short: 'Dispatch',
    workspace: 'Order Taking App',
    description: 'Places orders in delivery zones and assigns them to drivers.',
    scope: 'DISPATCHER',
  },
  DRIVER: {
    label: 'Driver',
    short: 'Driver',
    workspace: 'Drivers App',
    description: 'Sees next-day deliveries, follows the route and confirms handover with OTP.',
    scope: 'DRIVER',
  },
  FINANCE: {
    label: 'Finance Executive',
    short: 'Finance',
    workspace: 'Notifications & Reports',
    description: 'Notified of approved orders and credit-limit exceptions. Issues prototype invoices and manages invoice templates.',
    scope: 'FINANCE',
  },
  WAREHOUSE_MANAGER: {
    label: 'Warehouse Manager',
    short: 'Warehouse',
    workspace: 'Warehouse',
    description: 'Runs receiving, stock, transfers and picking readiness across hubs; raises replenishment.',
    scope: 'DISPATCHER',
  },
  INVENTORY_EXECUTIVE: {
    label: 'Inventory Executive',
    short: 'Inventory',
    workspace: 'Warehouse',
    description: 'Records goods receipts and transfers and keeps stock levels accurate.',
    scope: 'DISPATCHER',
  },
  QA_MANAGER: {
    label: 'QA Manager',
    short: 'QA',
    workspace: 'Quality & Cold Chain',
    description: 'Reviews documents, quarantines damaged stock and watches expiry and cold-chain alerts.',
    scope: 'DISPATCHER',
  },
  CUSTOMER: {
    label: 'Customer (Portal)',
    short: 'Customer',
    workspace: 'Customer Portal',
    description: 'Read-only view of one customer account’s orders, deliveries and invoices.',
    scope: 'CUSTOMER',
  },
  SUPPLIER: {
    label: 'Supplier (Portal)',
    short: 'Supplier',
    workspace: 'Supplier Portal',
    description: 'Read-only view of approved replenishment addressed to one supplier.',
    scope: 'SUPPLIER',
  },
}

// Enterprise roles (config/enterprise/roles.js) — label, department-as-workspace and default data scope.
ENTERPRISE_ROLES.forEach((r) => {
  if (!ROLE_META[r.code]) ROLE_META[r.code] = { label: r.name, short: r.name.split(' ')[0], workspace: r.department, description: r.description, scope: r.scope }
})

/* ---------- Runtime lookup (registered by rbacService to avoid an import cycle) ---------- */

let lookup = null
/** fn(code) → role record ({ code, name, description, dataScope, … }) or null */
export const setRoleLookup = (fn) => { lookup = fn }

export const getRoleRecord = (code) => (lookup ? lookup(code) : null)

export const getRoleLabel = (role) => getRoleRecord(role)?.name ?? ROLE_META[role]?.label ?? role

export const getRoleMeta = (role) => {
  const rec = getRoleRecord(role)
  const base = ROLE_META[role] || {}
  return {
    label: rec?.name ?? base.label ?? role,
    short: base.short ?? rec?.name ?? role,
    workspace: rec?.workspace ?? base.workspace ?? 'Workspace',
    description: rec?.description ?? base.description ?? '',
    scope: rec?.dataScope ?? base.scope ?? null,
  }
}

/** All role codes a user holds: primary role first, then additional roles. */
export const userRoleCodes = (user) => (user ? [user.role, ...(Array.isArray(user.additionalRoles) ? user.additionalRoles : [])].filter(Boolean) : [])

