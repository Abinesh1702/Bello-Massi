/**
 * Role-based access control (prototype — enforced in the browser by the same checks a server would run).
 *
 * - Roles live in bellomassi_roles: { code, name, description, dataScope, landingPath, status, system, protected,
 *   locked, permissions: [keys] }. System roles are seeded from config/permissions.js defaults.
 * - Registers the permission resolver used by config/permissions.can() and the role lookup used for labels,
 *   so every check reads the live, editable definitions.
 * - Users can hold a primary role plus additional roles; permissions are the union of all active roles.
 * - The data scope of the PRIMARY role decides which records a user sees (scopeOf).
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { STORAGE_KEYS } from '../utils/constants'
import { can, defaultPermissionsFor, setPermissionResolver } from '../config/permissions'
import { ALL_ROLES, LOCKED_ROLES, PROTECTED_ROLES, ROLE_META, ROLES, setRoleLookup, userRoleCodes } from '../config/roles'
import { ALL_PERMISSION_KEYS, CATALOG_VERSION, DATA_SCOPES, PERMISSION_BY_KEY } from '../config/rbacCatalog'
import { buildSystemRole } from './seed/adminSeed'
import { ENTERPRISE_ROLE_BY_CODE, ENTERPRISE_ROLE_CODES, SYSTEM_ROLE_DEPARTMENTS } from '../config/enterprise/roles'

const K = STORAGE_KEYS

export const getRoles = () => storage.getItem(K.ROLES, []) || []
export const getRoleByCode = (code, list = getRoles()) => list.find((r) => r.code === code) || null
export const getRoleById = (id, list = getRoles()) => list.find((r) => r.id === id) || null
const getUsers = () => storage.getItem(K.DEMO_USERS, []) || []

/* ---------- Resolver registration ---------- */

let indexSource = null
let index = new Map()
const roleIndex = () => {
  const list = getRoles()
  if (list !== indexSource) {
    indexSource = list
    index = new Map(list.map((r) => [r.code, { ...r, set: new Set(r.permissions || []) }]))
  }
  return index
}

setPermissionResolver((code, permission) => {
  const role = roleIndex().get(code)
  if (!role) return null // unknown → static default (only before the store exists)
  if (role.status !== 'active') return false
  if (role.locked) return true // Super Admin: locked full access
  return role.set.has(permission)
})

setRoleLookup((code) => roleIndex().get(code) || null)

/* ---------- Subjects & scopes ---------- */

/** The data scope of a user's primary role (falls back to the system role's default scope). */
export const scopeOf = (user) => {
  if (!user) return null
  const role = roleIndex().get(user.role)
  return role?.dataScope || ROLE_META[user.role]?.scope || null
}

/** True for users whose data scope is "all records" (Admin and Super Admin, or custom roles with that scope). */
export const isAdminScope = (user) => scopeOf(user) === ROLES.ADMIN
export const isSuperAdmin = (user) => userRoleCodes(user).includes(ROLES.SUPER_ADMIN)

/** Role codes a notification addressed to `roles` reaches for this user: own roles plus their data-scope role. */
export const audienceCodes = (user) => {
  const codes = new Set(userRoleCodes(user))
  const scope = scopeOf(user)
  if (scope === ROLES.ADMIN) codes.add(ROLES.ADMIN)
  return codes
}

/** Effective permission keys of a user (union of active roles). */
export const effectivePermissions = (user) => {
  const out = new Set()
  userRoleCodes(user).forEach((code) => {
    const r = roleIndex().get(code)
    if (!r || r.status !== 'active') return
    ;(r.locked ? ALL_PERMISSION_KEYS : r.permissions || []).forEach((k) => out.add(k))
  })
  return out
}

/** Where to send a user after sign-in (role landing page, if the user can open it). */
export const landingPathFor = (user) => roleIndex().get(user?.role)?.landingPath || (user?.role === ROLES.DRIVER ? '/driver/dashboard' : '/dashboard')

/* ---------- Validation ---------- */

const deny = (msg, errors) => ({ ok: false, error: msg, errors: errors || { form: msg } })
const clean = (v) => String(v ?? '').trim()
const CODE = /^[A-Z][A-Z0-9_]{1,29}$/

export const codeFromName = (name) => clean(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'ROLE'

export const validateRole = (input, { existing = null, list = getRoles() } = {}) => {
  const errors = {}
  const name = clean(input.name)
  const code = existing ? existing.code : clean(input.code).toUpperCase()
  if (name.length < 3) errors.name = 'Enter a role name (at least 3 characters).'
  else if (name.length > 40) errors.name = 'Use 40 characters or fewer.'
  else if (list.some((r) => r.id !== existing?.id && r.name.toLowerCase() === name.toLowerCase())) errors.name = 'Another role already uses this name.'
  if (!existing) {
    if (!CODE.test(code)) errors.code = 'Use 2–30 capital letters, numbers or underscores, starting with a letter.'
    else if (list.some((r) => r.code === code)) errors.code = 'This role code is already in use.'
  }
  if (clean(input.description).length > 240) errors.description = 'Use 240 characters or fewer.'
  if (!DATA_SCOPES.some((s) => s.id === input.dataScope)) errors.dataScope = 'Choose a data scope.'
  if (!['active', 'inactive'].includes(input.status)) errors.status = 'Choose a status.'
  const unknown = (input.permissions || []).filter((k) => !PERMISSION_BY_KEY[k])
  if (unknown.length) errors.permissions = `Unknown permission keys: ${unknown.slice(0, 3).join(', ')}`
  if (!clean(input.landingPath).startsWith('/')) errors.landingPath = 'Choose a landing page.'
  return errors
}

/* ---------- Actions (each validates the caller's permission first) ---------- */

const actor = () => {
  // Read the session directly (authService imports this module).
  const s = storage.getItem(K.SESSION, null, { scope: 'local' }) || storage.getItem(K.SESSION, null, { scope: 'session' })
  return s ? getUsers().find((u) => u.id === s.userId) || null : null
}

const commitRoles = (roles) => storage.setItem(K.ROLES, roles)

export const createRole = (input) => {
  const user = actor()
  if (!can(user, 'roles.create')) return deny('You do not have permission to create roles.')
  const list = getRoles()
  const errors = validateRole(input, { list })
  if (Object.keys(errors).length) return deny(Object.values(errors)[0], errors)
  const now = new Date().toISOString()
  const record = {
    id: `role-${Date.now().toString(36)}`,
    code: clean(input.code).toUpperCase(),
    name: clean(input.name),
    description: clean(input.description),
    workspace: clean(input.workspace) || 'Workspace',
    department: clean(input.department),
    dataScope: input.dataScope,
    landingPath: clean(input.landingPath) || '/dashboard',
    color: input.color || '#232B5F',
    status: input.status,
    system: false,
    protected: false,
    locked: false,
    permissions: [...new Set(input.permissions || [])].filter((k) => PERMISSION_BY_KEY[k]),
    createdAt: now,
    updatedAt: now,
    createdBy: user.id,
  }
  const res = commitRoles([...list, record])
  return res.ok ? { ok: true, record } : deny(res.error)
}

export const updateRole = (id, input) => {
  const user = actor()
  if (!can(user, 'roles.edit')) return deny('You do not have permission to edit roles.')
  const list = getRoles()
  const existing = getRoleById(id, list)
  if (!existing) return deny('This role no longer exists.')
  if (existing.locked) return deny(`${existing.name} is a locked system role. Its permissions cannot be changed.`)
  if (existing.code === ROLES.ADMIN && !userRoleCodes(user).some((c) => c === ROLES.SUPER_ADMIN || c === ROLES.ADMIN)) return deny('Only an Administrator or Super Admin can change the Administrator role.')
  const errors = validateRole({ ...existing, ...input }, { existing, list })
  if (Object.keys(errors).length) return deny(Object.values(errors)[0], errors)
  if (existing.protected && input.status === 'inactive') return deny(`${existing.name} is a protected system role and cannot be deactivated.`)
  // Never let an administrator lock themselves out of role management.
  const nextPerms = [...new Set(input.permissions ?? existing.permissions)].filter((k) => PERMISSION_BY_KEY[k])
  if (userRoleCodes(user).includes(existing.code) && !userRoleCodes(user).some((c) => c !== existing.code && can(c, 'roles.edit')) && !nextPerms.includes('roles.edit')) {
    return deny('You cannot remove “Edit roles & permissions” from your own role — you would lose access to this page.')
  }
  const record = {
    ...existing,
    name: clean(input.name ?? existing.name),
    description: clean(input.description ?? existing.description),
    workspace: clean(input.workspace ?? existing.workspace) || existing.workspace,
    department: clean(input.department ?? existing.department ?? ''),
    dataScope: existing.system ? existing.dataScope : (input.dataScope ?? existing.dataScope),
    landingPath: clean(input.landingPath ?? existing.landingPath) || '/dashboard',
    color: input.color || existing.color,
    status: input.status ?? existing.status,
    permissions: nextPerms,
    updatedAt: new Date().toISOString(),
    updatedBy: user.id,
  }
  const res = commitRoles(list.map((r) => (r.id === id ? record : r)))
  return res.ok ? { ok: true, record } : deny(res.error)
}

export const setRoleStatus = (id, status) => {
  const role = getRoleById(id)
  if (!role) return deny('This role no longer exists.')
  return updateRole(id, { ...role, status })
}

export const duplicateRole = (id) => {
  const user = actor()
  if (!can(user, 'roles.create')) return deny('You do not have permission to create roles.')
  const list = getRoles()
  const src = getRoleById(id, list)
  if (!src) return deny('This role no longer exists.')
  let n = 1
  let name = `${src.name} (copy)`
  while (list.some((r) => r.name.toLowerCase() === name.toLowerCase())) { n += 1; name = `${src.name} (copy ${n})` }
  let code = `${src.code}_COPY`.slice(0, 26)
  let c = 1
  while (list.some((r) => r.code === code)) { c += 1; code = `${src.code.slice(0, 22)}_COPY${c}` }
  return createRole({
    name, code, description: src.description, workspace: src.workspace, dataScope: src.dataScope, landingPath: src.landingPath,
    color: src.color, status: 'active', permissions: src.locked ? [...ALL_PERMISSION_KEYS] : src.permissions,
  })
}

export const usersWithRole = (code, users = getUsers()) => users.filter((u) => userRoleCodes(u).includes(code))

export const deleteRole = (id) => {
  const user = actor()
  if (!can(user, 'roles.delete')) return deny('You do not have permission to delete roles.')
  const list = getRoles()
  const role = getRoleById(id, list)
  if (!role) return deny('This role no longer exists.')
  if (role.protected || PROTECTED_ROLES.includes(role.code)) return deny(`${role.name} is a protected system role and cannot be deleted.`)
  if (role.system) return deny(`${role.name} is a system role used by built-in workflows. Deactivate it or remove its permissions instead.`)
  const holders = usersWithRole(role.code)
  if (holders.length) return deny(`${role.name} is assigned to ${holders.length} user${holders.length === 1 ? '' : 's'} (${holders.slice(0, 3).map((u) => u.name).join(', ')}${holders.length > 3 ? '…' : ''}). Reassign them first.`)
  const res = commitRoles(list.filter((r) => r.id !== id))
  return res.ok ? { ok: true, record: role } : deny(res.error)
}

/** Restore a system role's default permissions. */
export const resetRolePermissions = (id) => {
  const role = getRoleById(id)
  if (!role) return deny('This role no longer exists.')
  if (!role.system) return deny('Only system roles have default permissions.')
  return updateRole(id, { ...role, permissions: defaultPermissionsFor(role.code) })
}

/**
 * Keep the stored roles in line with the code's permission catalog on start-up:
 * - missing system roles are added (with default permissions);
 * - permission keys introduced by a newer catalog are granted to the system roles that have them by default,
 *   without re-adding keys an administrator removed earlier.
 */
export const syncCatalog = () => storage.withoutWriteHooks(() => {
  const state = storage.getItem(K.PERMISSIONS, null)
  const roles = getRoles()
  if (!roles.length) return { changed: false }
  const known = new Set(state?.knownKeys || [])
  const added = ALL_PERMISSION_KEYS.filter((k) => !known.has(k))
  let changed = false
  let next = roles.map((r) => {
    if (!r.system || !added.length) return r
    const grant = defaultPermissionsFor(r.code).filter((k) => added.includes(k) && !r.permissions.includes(k))
    const patch = r.department === undefined ? { department: ENTERPRISE_ROLE_BY_CODE[r.code]?.department || SYSTEM_ROLE_DEPARTMENTS[r.code] || '' } : {}
    if (!grant.length && !patch.department) return r
    changed = true
    return { ...r, ...patch, permissions: [...r.permissions, ...grant] }
  })
  // System roles and the predefined enterprise roles (catalog v4) that are not in the store yet.
  const missing = [...ALL_ROLES, ...ENTERPRISE_ROLE_CODES].filter((code) => !next.some((r) => r.code === code))
  if (missing.length) {
    changed = true
    next = [...next, ...missing.map((code) => buildSystemRole(code, dayjs()))]
  }
  if (changed) storage.setItem(K.ROLES, next)
  if (added.length || !state || state.catalogVersion !== CATALOG_VERSION) {
    storage.setItem(K.PERMISSIONS, { catalogVersion: CATALOG_VERSION, knownKeys: [...ALL_PERMISSION_KEYS], syncedAt: new Date().toISOString() })
  }
  return { changed, added }
})

export const isProtectedRole = (role) => Boolean(role?.protected || PROTECTED_ROLES.includes(role?.code))
export const isLockedRole = (role) => Boolean(role?.locked || LOCKED_ROLES.includes(role?.code))

const rbacService = {
  getRoles, getRoleByCode, getRoleById, scopeOf, isAdminScope, isSuperAdmin, effectivePermissions, landingPathFor,
  createRole, updateRole, setRoleStatus, duplicateRole, deleteRole, resetRolePermissions, syncCatalog, usersWithRole, validateRole,
  audienceCodes, codeFromName,
}
export default rbacService
