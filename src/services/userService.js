/**
 * User administration (prototype). Every action checks the caller's permission before it runs:
 * users.create / users.edit / users.delete / users.manage (activate, reset demo password, unlock, assign roles & hubs).
 *
 * Safeguards: only a Super Admin can grant or remove the Super Admin role; you cannot deactivate or delete
 * yourself; the last active Super Admin cannot be removed; users that own business records (orders, customers,
 * driver records) are deactivated instead of deleted so history stays intact.
 */
import storage from './storageService'
import { STORAGE_KEYS } from '../utils/constants'
import { can } from '../config/permissions'
import { ROLES, userRoleCodes } from '../config/roles'
import { demoHash, isValidEmail } from '../utils/helpers'
import { getNumberingPrefix, getSecurityConfig } from '../config/runtimeConfig'
import { getRoles, getRoleByCode, isSuperAdmin } from './rbacService'
import { getOrganization } from './organizationService'
import { clearFailures, getCurrentUser, getLockState, validateNewPassword } from './authService'

const K = STORAGE_KEYS

export const getUsers = () => storage.getItem(K.DEMO_USERS, []) || []
export const getUserById = (id, list = getUsers()) => list.find((u) => u.id === id) || null
const sanitize = (u) => {
  if (!u) return null
  const { passwordHash: _omit, ...safe } = u
  return safe
}

const deny = (msg, errors) => ({ ok: false, error: msg, errors: errors || { form: msg } })
const clean = (v) => String(v ?? '').trim()
const PHONE = /^[+\d][\d\s-]{7,17}$/
const USERNAME = /^[a-z0-9][a-z0-9._-]{2,29}$/

export const nextEmployeeId = (list = getUsers()) => {
  const prefix = getNumberingPrefix('employee')
  const nums = list.map((u) => String(u.employeeId || '')).filter((e) => e.startsWith(`${prefix}-`)).map((e) => Number(e.split('-').pop()) || 0)
  return `${prefix}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0')}`
}

export const validateUser = (v, { existing = null, list = getUsers(), actor = getCurrentUser() } = {}) => {
  const e = {}
  const roles = getRoles()
  const org = getOrganization()
  const hubs = storage.getItem(K.HUBS, []) || []
  const name = clean(v.name)
  const email = clean(v.email).toLowerCase()
  const username = clean(v.username).toLowerCase()
  if (name.length < 2) e.name = 'Enter the full name.'
  else if (name.length > 60) e.name = 'Use 60 characters or fewer.'
  if (!isValidEmail(email)) e.email = 'Enter a valid email address.'
  else if (list.some((u) => u.id !== existing?.id && u.email.toLowerCase() === email)) e.email = 'Another user already uses this email.'
  if (!USERNAME.test(username)) e.username = 'Use 3–30 lowercase letters, digits, dots, dashes or underscores.'
  else if (list.some((u) => u.id !== existing?.id && String(u.username || '').toLowerCase() === username)) e.username = 'This username is taken.'
  else if (list.some((u) => u.id !== existing?.id && u.email.toLowerCase() === username)) e.username = 'This username is taken.'
  if (clean(v.phone) && !PHONE.test(clean(v.phone))) e.phone = 'Enter a valid phone number, e.g. +971 50 123 4567.'
  const empId = clean(v.employeeId).toUpperCase()
  if (!/^[A-Z0-9][A-Z0-9-]{2,19}$/.test(empId)) e.employeeId = 'Use 3–20 capital letters, digits or dashes.'
  else if (list.some((u) => u.id !== existing?.id && String(u.employeeId || '').toUpperCase() === empId)) e.employeeId = 'This employee ID is already in use.'
  const role = roles.find((r) => r.code === v.role)
  if (!role) e.role = 'Choose a role.'
  else if (role.status !== 'active' && role.code !== existing?.role) e.role = `${role.name} is inactive.`
  const extra = Array.isArray(v.additionalRoles) ? v.additionalRoles : []
  if (extra.includes(v.role)) e.additionalRoles = 'The primary role cannot also be an additional role.'
  else if (extra.some((c) => !roles.some((r) => r.code === c))) e.additionalRoles = 'One of the additional roles no longer exists.'
  const before = existing ? userRoleCodes(existing) : []
  const after = [v.role, ...extra]
  const touchesSuper = before.includes(ROLES.SUPER_ADMIN) !== after.includes(ROLES.SUPER_ADMIN)
  if (touchesSuper && !isSuperAdmin(actor)) e.role = 'Only a Super Admin can grant or remove the Super Admin role.'
  if (v.department && !org.departments.some((d) => d.id === v.department)) e.department = 'Choose a department.'
  if (!v.department) e.department = 'Choose a department.'
  if (!v.designation) e.designation = 'Choose a designation.'
  else if (!org.designations.some((d) => d.id === v.designation)) e.designation = 'Choose a designation.'
  if (v.hubId && !hubs.some((h) => h.id === v.hubId)) e.hubId = 'Choose an existing hub.'
  const scope = role?.dataScope
  if (scope === 'CUSTOMER') {
    const customers = storage.getItem(K.CUSTOMERS, []) || []
    if (!customers.some((c) => c.id === v.customerId)) e.customerId = 'Portal users need a linked customer account.'
  }
  if (scope === 'SUPPLIER') {
    const suppliers = storage.getItem(K.FORECAST_SETTINGS, null)?.suppliers || []
    if (!suppliers.some((s) => s.id === v.supplierId)) e.supplierId = 'Portal users need a linked supplier.'
  }
  if (scope === 'DRIVER' && !v.hubId) e.hubId = 'Drivers need a home hub.'
  if (!['active', 'inactive'].includes(v.status)) e.status = 'Choose a status.'
  return e
}

const fields = (v) => ({
  name: clean(v.name),
  email: clean(v.email).toLowerCase(),
  username: clean(v.username).toLowerCase(),
  employeeId: clean(v.employeeId).toUpperCase(),
  phone: clean(v.phone),
  title: clean(v.title).slice(0, 60),
  role: v.role,
  additionalRoles: [...new Set(Array.isArray(v.additionalRoles) ? v.additionalRoles : [])],
  department: v.department || null,
  designation: v.designation || null,
  hubId: v.hubId || null,
  customerId: v.customerId || null,
  supplierId: v.supplierId || null,
  status: v.status,
})

const write = (list) => storage.setItem(K.DEMO_USERS, list)
const COLORS = ['#232B5F', '#0E7490', '#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#B45309', '#0369A1']

export const createUser = (values) => {
  const actor = getCurrentUser()
  if (!can(actor, 'users.create')) return deny('You do not have permission to create users.')
  const list = getUsers()
  const errors = validateUser(values, { list, actor })
  const pwdError = validateNewPassword(values.password || '')
  if (pwdError) errors.password = pwdError
  else if (values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match.'
  if (Object.keys(errors).length) return deny('Please fix the highlighted fields.', errors)
  const now = new Date().toISOString()
  const record = {
    id: `u-${Date.now().toString(36)}`,
    ...fields(values),
    avatarColor: COLORS[list.length % COLORS.length],
    avatarImage: null,
    passwordHash: demoHash(values.password),
    mustChangePassword: Boolean(values.mustChangePassword),
    createdAt: now,
    createdBy: actor.id,
    updatedAt: now,
    lastLoginAt: null,
  }
  const res = write([...list, record])
  return res.ok ? { ok: true, record: sanitize(record) } : deny(res.error)
}

export const updateUser = (id, values) => {
  const actor = getCurrentUser()
  if (!can(actor, 'users.edit')) return deny('You do not have permission to edit users.')
  const list = getUsers()
  const existing = getUserById(id, list)
  if (!existing) return deny('This user no longer exists.')
  const roleChanged = existing.role !== values.role || JSON.stringify([...(existing.additionalRoles || [])].sort()) !== JSON.stringify([...(values.additionalRoles || [])].sort())
  if (roleChanged && !can(actor, 'users.manage')) return deny('Changing roles needs the “assign roles” permission (users.manage).')
  if (existing.status !== values.status && !can(actor, 'users.manage')) return deny('Activating or deactivating users needs users.manage.')
  if (id === actor.id && values.status !== 'active') return deny('You cannot deactivate your own account.')
  if (id === actor.id && roleChanged && !can([values.role, ...(values.additionalRoles || [])], 'users.edit')) return deny('This change would remove your own access to user management.')
  const errors = validateUser(values, { existing, list, actor })
  if (Object.keys(errors).length) return deny('Please fix the highlighted fields.', errors)
  const guard = lastSuperAdminGuard(existing, { ...existing, ...fields(values) }, list)
  if (guard) return deny(guard)
  const record = { ...existing, ...fields(values), updatedAt: new Date().toISOString(), updatedBy: actor.id }
  const res = write(list.map((u) => (u.id === id ? record : u)))
  return res.ok ? { ok: true, record: sanitize(record) } : deny(res.error)
}

const activeSupers = (list) => list.filter((u) => u.status === 'active' && userRoleCodes(u).includes(ROLES.SUPER_ADMIN))
const lastSuperAdminGuard = (before, after, list) => {
  const wasSuper = before.status === 'active' && userRoleCodes(before).includes(ROLES.SUPER_ADMIN)
  const staysSuper = after && after.status === 'active' && userRoleCodes(after).includes(ROLES.SUPER_ADMIN)
  if (wasSuper && !staysSuper && activeSupers(list).length <= 1) return 'This is the last active Super Admin. Assign the role to another user first.'
  return null
}

export const setUserStatus = (id, status) => {
  const actor = getCurrentUser()
  if (!can(actor, 'users.manage')) return deny('You do not have permission to activate or deactivate users.')
  const list = getUsers()
  const existing = getUserById(id, list)
  if (!existing) return deny('This user no longer exists.')
  if (id === actor.id && status !== 'active') return deny('You cannot deactivate your own account.')
  if (userRoleCodes(existing).includes(ROLES.SUPER_ADMIN) && !isSuperAdmin(actor)) return deny('Only a Super Admin can change a Super Admin account.')
  const guard = lastSuperAdminGuard(existing, { ...existing, status }, list)
  if (guard) return deny(guard)
  const record = { ...existing, status, updatedAt: new Date().toISOString(), updatedBy: actor.id }
  const res = write(list.map((u) => (u.id === id ? record : u)))
  return res.ok ? { ok: true, record: sanitize(record) } : deny(res.error)
}

/** Business records that reference a user (deletion would orphan them). */
export const userReferences = (id) => {
  const refs = []
  const orders = (storage.getItem(K.ORDERS, []) || []).filter((o) => o.salesmanId === id || o.createdBy === id)
  const customers = (storage.getItem(K.CUSTOMERS, []) || []).filter((c) => c.salesRepId === id)
  const drivers = (storage.getItem(K.DRIVERS, []) || []).filter((d) => d.userId === id)
  if (orders.length) refs.push(`${orders.length} order${orders.length === 1 ? '' : 's'}`)
  if (customers.length) refs.push(`${customers.length} customer${customers.length === 1 ? '' : 's'}`)
  if (drivers.length) refs.push('a driver record')
  return refs
}

export const deleteUser = (id) => {
  const actor = getCurrentUser()
  if (!can(actor, 'users.delete')) return deny('You do not have permission to delete users.')
  const list = getUsers()
  const existing = getUserById(id, list)
  if (!existing) return deny('This user no longer exists.')
  if (id === actor.id) return deny('You cannot delete your own account.')
  if (userRoleCodes(existing).includes(ROLES.SUPER_ADMIN) && !isSuperAdmin(actor)) return deny('Only a Super Admin can delete a Super Admin account.')
  const guard = lastSuperAdminGuard(existing, null, list)
  if (guard) return deny(guard)
  const refs = userReferences(id)
  if (refs.length) return deny(`${existing.name} is linked to ${refs.join(', ')}. Deactivate the account instead so history stays intact.`)
  const res = write(list.filter((u) => u.id !== id))
  return res.ok ? { ok: true, record: sanitize(existing) } : deny(res.error)
}

const TEMP_WORDS = ['Falcon', 'Harbor', 'Desert', 'Coral', 'Cedar', 'Pearl', 'Oasis', 'Summit']
const tempPassword = () => {
  const min = Number(getSecurityConfig().passwordMinLength) || 8
  let p = `${TEMP_WORDS[Math.floor(Math.random() * TEMP_WORDS.length)]}-${Math.floor(1000 + Math.random() * 9000)}`
  while (p.length < min) p += String(Math.floor(Math.random() * 10))
  return p
}

/**
 * Reset a user's demo password to a generated temporary password (shown once to the administrator).
 * With Security › force password change, the user must choose a new password at the next sign-in.
 */
export const resetUserPassword = (id) => {
  const actor = getCurrentUser()
  if (!can(actor, 'users.manage')) return deny('You do not have permission to reset passwords.')
  const list = getUsers()
  const existing = getUserById(id, list)
  if (!existing) return deny('This user no longer exists.')
  if (userRoleCodes(existing).includes(ROLES.SUPER_ADMIN) && !isSuperAdmin(actor)) return deny('Only a Super Admin can reset a Super Admin password.')
  const password = tempPassword()
  const record = { ...existing, passwordHash: demoHash(password), mustChangePassword: getSecurityConfig().forcePasswordChangeAfterReset !== false, passwordResetAt: new Date().toISOString(), passwordResetBy: actor.id }
  const res = write(list.map((u) => (u.id === id ? record : u)))
  if (!res.ok) return deny(res.error)
  clearFailures(id)
  return { ok: true, password, mustChangePassword: record.mustChangePassword }
}

export const unlockUser = (id) => {
  const actor = getCurrentUser()
  if (!can(actor, 'users.manage')) return deny('You do not have permission to unlock users.')
  if (!getUserById(id)) return deny('This user no longer exists.')
  clearFailures(id)
  return { ok: true }
}

/** Assign primary + additional roles (User Role Assignment page). */
export const assignRoles = (id, { role, additionalRoles = [] }) => {
  const actor = getCurrentUser()
  if (!can(actor, 'users.manage')) return deny('You do not have permission to assign roles.')
  const existing = getUserById(id)
  if (!existing) return deny('This user no longer exists.')
  return updateUserAs(actor, id, { ...existing, role, additionalRoles })
}

/** Assign a hub (several users at once). */
export const assignHub = (ids, hubId) => {
  const actor = getCurrentUser()
  if (!can(actor, 'users.manage')) return deny('You do not have permission to assign hubs.')
  const hubs = storage.getItem(K.HUBS, []) || []
  if (hubId && !hubs.some((h) => h.id === hubId)) return deny('Choose an existing hub.')
  const set = new Set(ids)
  const list = getUsers()
  const drivers = list.filter((u) => set.has(u.id) && !hubId && getRoleByCode(u.role)?.dataScope === 'DRIVER')
  if (drivers.length) return deny('Drivers need a home hub.')
  const now = new Date().toISOString()
  const res = write(list.map((u) => (set.has(u.id) ? { ...u, hubId: hubId || null, updatedAt: now, updatedBy: actor.id } : u)))
  return res.ok ? { ok: true, count: set.size } : deny(res.error)
}

const updateUserAs = (actor, id, values) => {
  const list = getUsers()
  const existing = getUserById(id, list)
  if (id === actor.id && !can([values.role, ...(values.additionalRoles || [])], 'users.manage')) return deny('This change would remove your own access to role assignment.')
  const errors = validateUser(values, { existing, list, actor })
  if (Object.keys(errors).length) return deny(Object.values(errors)[0], errors)
  const guard = lastSuperAdminGuard(existing, { ...existing, ...fields(values) }, list)
  if (guard) return deny(guard)
  const record = { ...existing, ...fields(values), updatedAt: new Date().toISOString(), updatedBy: actor.id }
  const res = write(list.map((u) => (u.id === id ? record : u)))
  return res.ok ? { ok: true, record: sanitize(record) } : deny(res.error)
}

export const userStatusInfo = (u) => {
  const lock = getLockState(u.id)
  return { ...lock, inactive: u.status !== 'active' }
}


const userService = {
  getUsers, getUserById, createUser, updateUser, setUserStatus, deleteUser, resetUserPassword, unlockUser, assignRoles, assignHub,
  validateUser, nextEmployeeId, userReferences, userStatusInfo,
}
export default userService
