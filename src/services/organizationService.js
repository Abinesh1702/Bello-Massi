/**
 * Organization master — company profile (bellomassi_company) and the branch, business-unit, department,
 * designation and warehouse masters (bellomassi_organization). Hubs keep their own Phase 2 master (/hubs);
 * the Employee Master is the user list seen through the organisation fields.
 * Every write checks organization.manage; deletes are blocked while another record still references the item.
 */
import storage from './storageService'
import { STORAGE_KEYS } from '../utils/constants'
import { can } from '../config/permissions'
import { isPlainObject, isValidEmail } from '../utils/helpers'

const K = STORAGE_KEYS

export const ORG_MASTERS = {
  branches: { label: 'Branch', plural: 'Branches', path: '/admin/organization/branches' },
  businessUnits: { label: 'Business unit', plural: 'Business units', path: '/admin/organization/business-units' },
  departments: { label: 'Department', plural: 'Departments', path: '/admin/organization/departments' },
  designations: { label: 'Designation', plural: 'Designations', path: '/admin/organization/designations' },
  warehouses: { label: 'Warehouse', plural: 'Warehouses', path: '/admin/organization/warehouses' },
}

export const WAREHOUSE_TYPES = ['Frozen', 'Chilled', 'Ambient', 'Quarantine']
export const DESIGNATION_LEVELS = ['Executive', 'Manager', 'Supervisor', 'Staff', 'External']

const EMPTY = { branches: [], businessUnits: [], departments: [], designations: [], warehouses: [] }

export const getOrganization = () => {
  const v = storage.getItem(K.ORGANIZATION, null)
  return isPlainObject(v) ? { ...EMPTY, ...v } : EMPTY
}
export const getMaster = (type, org = getOrganization()) => org[type] || []
export const getCompany = () => storage.getItem(K.COMPANY, null)

const deny = (msg, errors) => ({ ok: false, error: msg, errors: errors || { form: msg } })
const clean = (v) => String(v ?? '').trim()
const actor = () => {
  const s = storage.getItem(K.SESSION, null, { scope: 'local' }) || storage.getItem(K.SESSION, null, { scope: 'session' })
  return s ? (storage.getItem(K.DEMO_USERS, []) || []).find((u) => u.id === s.userId) || null : null
}

/* ---------- Company ---------- */

const TRN = /^\d{15}$/
const MAX_LOGO_CHARS = 400 * 1024

export const validateCompany = (v) => {
  const e = {}
  if (clean(v.name).length < 2) e.name = 'Enter the company name.'
  if (clean(v.legalName).length < 2) e.legalName = 'Enter the registered legal name.'
  if (clean(v.addressLine1).length < 3) e.addressLine1 = 'Enter the company address.'
  if (clean(v.city).length < 2) e.city = 'Enter the city.'
  if (!clean(v.country)) e.country = 'Choose a country.'
  if (!/^[A-Z]{3}$/.test(clean(v.currency))) e.currency = 'Choose a currency.'
  if (!clean(v.timezone)) e.timezone = 'Choose a timezone.'
  if (v.email && !isValidEmail(v.email)) e.email = 'Enter a valid email address.'
  if (v.phone && !/^[+\d][\d\s-]{6,19}$/.test(clean(v.phone))) e.phone = 'Enter a valid phone number, e.g. +971 4 555 0100.'
  const trn = clean(v.taxRegistrationNumber).replace(/\s/g, '')
  if (!trn) e.taxRegistrationNumber = 'Enter the tax registration number.'
  else if (v.country === 'United Arab Emirates' && !TRN.test(trn)) e.taxRegistrationNumber = 'A UAE TRN has 15 digits.'
  else if (trn.length > 20) e.taxRegistrationNumber = 'Use 20 characters or fewer.'
  if (v.logo && String(v.logo).length > MAX_LOGO_CHARS) e.logo = 'Logo is too large for browser storage. Use an image under 300 KB.'
  return e
}

export const saveCompany = (values) => {
  if (!can(actor(), 'organization.manage')) return deny('You do not have permission to edit the company profile.')
  const errors = validateCompany(values)
  if (Object.keys(errors).length) return deny('Please fix the highlighted fields.', errors)
  const prev = getCompany() || {}
  const record = {
    ...prev,
    ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])),
    taxRegistrationNumber: clean(values.taxRegistrationNumber).replace(/\s/g, ''),
    id: 'company',
    updatedAt: new Date().toISOString(),
  }
  const res = storage.setItem(K.COMPANY, record)
  return res.ok ? { ok: true, record } : deny(res.error)
}

/* ---------- Masters ---------- */

const CODE = /^[A-Z0-9][A-Z0-9-]{1,11}$/

export const validateMasterRecord = (type, v, { existing = null, org = getOrganization() } = {}) => {
  const e = {}
  const list = getMaster(type, org)
  const code = clean(v.code).toUpperCase()
  const name = clean(v.name)
  if (!CODE.test(code)) e.code = 'Use 2–12 capital letters, digits or dashes.'
  else if (list.some((x) => x.id !== existing?.id && x.code === code)) e.code = 'This code is already in use.'
  if (name.length < 2) e.name = 'Enter a name.'
  else if (name.length > 80) e.name = 'Use 80 characters or fewer.'
  else if (list.some((x) => x.id !== existing?.id && x.name.toLowerCase() === name.toLowerCase())) e.name = 'This name is already in use.'
  if (!['active', 'inactive'].includes(v.status)) e.status = 'Choose a status.'
  if (type === 'departments') {
    if (!org.businessUnits.some((b) => b.id === v.businessUnitId)) e.businessUnitId = 'Choose a business unit.'
    if (!org.branches.some((b) => b.id === v.branchId)) e.branchId = 'Choose a branch.'
  }
  if (type === 'designations') {
    if (!org.departments.some((d) => d.id === v.departmentId)) e.departmentId = 'Choose a department.'
    if (!DESIGNATION_LEVELS.includes(v.level)) e.level = 'Choose a level.'
  }
  if (type === 'branches') {
    if (!clean(v.country)) e.country = 'Enter the country.'
    if (!clean(v.city)) e.city = 'Enter the city.'
  }
  if (type === 'warehouses') {
    const hubs = storage.getItem(K.HUBS, []) || []
    if (!hubs.some((h) => h.id === v.hubId)) e.hubId = 'Choose the hub this warehouse belongs to.'
    if (!WAREHOUSE_TYPES.includes(v.type)) e.type = 'Choose a storage type.'
    const min = Number(v.temperatureMin)
    const max = Number(v.temperatureMax)
    if (v.type !== 'Ambient') {
      if (!Number.isFinite(min) || clean(v.temperatureMin) === '') e.temperatureMin = 'Enter the minimum temperature.'
      if (!Number.isFinite(max) || clean(v.temperatureMax) === '') e.temperatureMax = 'Enter the maximum temperature.'
      if (!e.temperatureMin && !e.temperatureMax && min >= max) e.temperatureMax = 'Maximum must be above the minimum.'
    }
    if (!Number.isInteger(Number(v.capacityPallets)) || Number(v.capacityPallets) < 0) e.capacityPallets = 'Enter the pallet capacity (0 or more).'
  }
  return e
}

const NUMERIC = { warehouses: ['temperatureMin', 'temperatureMax', 'capacityPallets'] }

const normalise = (type, v) => {
  const out = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === 'string' ? x.trim() : x]))
  out.code = clean(v.code).toUpperCase()
  ;(NUMERIC[type] || []).forEach((k) => { out[k] = out[k] === '' || out[k] === null || out[k] === undefined ? null : Number(out[k]) })
  if (type === 'warehouses' && out.type === 'Ambient') { out.temperatureMin = out.temperatureMin ?? null; out.temperatureMax = out.temperatureMax ?? null }
  return out
}

/** Records that still point at a master item (blocks delete / deactivation). */
export const referencesTo = (type, id, org = getOrganization()) => {
  const users = storage.getItem(K.DEMO_USERS, []) || []
  const refs = []
  const add = (label, items) => { if (items.length) refs.push(`${items.length} ${label}${items.length === 1 ? '' : 's'}`) }
  if (type === 'branches') add('department', org.departments.filter((d) => d.branchId === id))
  if (type === 'businessUnits') add('department', org.departments.filter((d) => d.businessUnitId === id))
  if (type === 'departments') {
    add('designation', org.designations.filter((d) => d.departmentId === id))
    add('user', users.filter((u) => u.department === id))
  }
  if (type === 'designations') add('user', users.filter((u) => u.designation === id))
  return refs
}

export const saveMasterRecord = (type, values, id = null) => {
  if (!can(actor(), 'organization.manage')) return deny('You do not have permission to edit the organization master.')
  if (!ORG_MASTERS[type]) return deny('Unknown master.')
  const org = getOrganization()
  const existing = id ? getMaster(type, org).find((x) => x.id === id) : null
  if (id && !existing) return deny('This record no longer exists.')
  const errors = validateMasterRecord(type, values, { existing, org })
  if (Object.keys(errors).length) return deny('Please fix the highlighted fields.', errors)
  if (existing && existing.status === 'active' && values.status === 'inactive') {
    const activeUsers = (storage.getItem(K.DEMO_USERS, []) || []).filter((u) => u.status === 'active' && (u.department === id || u.designation === id))
    if (activeUsers.length) return deny(`${existing.name} is assigned to ${activeUsers.length} active user${activeUsers.length === 1 ? '' : 's'}. Reassign them before deactivating.`)
  }
  const now = new Date().toISOString()
  const record = existing
    ? { ...existing, ...normalise(type, values), id, updatedAt: now }
    : { ...normalise(type, values), id: `${type.slice(0, 3)}-${Date.now().toString(36)}`, createdAt: now, updatedAt: now }
  const list = existing ? getMaster(type, org).map((x) => (x.id === id ? record : x)) : [...getMaster(type, org), record]
  const res = storage.setItem(K.ORGANIZATION, { ...org, [type]: list })
  return res.ok ? { ok: true, record } : deny(res.error)
}

export const deleteMasterRecord = (type, id) => {
  if (!can(actor(), 'organization.manage')) return deny('You do not have permission to edit the organization master.')
  const org = getOrganization()
  const existing = getMaster(type, org).find((x) => x.id === id)
  if (!existing) return deny('This record no longer exists.')
  if (type === 'branches' && existing.isHeadOffice) return deny('The head office branch cannot be deleted.')
  const refs = referencesTo(type, id, org)
  if (refs.length) return deny(`${existing.name} is still used by ${refs.join(' and ')}. Reassign them first or set it to inactive.`)
  const res = storage.setItem(K.ORGANIZATION, { ...org, [type]: getMaster(type, org).filter((x) => x.id !== id) })
  return res.ok ? { ok: true, record: existing } : deny(res.error)
}

export const nameOf = (type, id, org = getOrganization()) => getMaster(type, org).find((x) => x.id === id)?.name || ''

const organizationService = {
  getOrganization, getMaster, getCompany, saveCompany, validateCompany, saveMasterRecord, deleteMasterRecord, validateMasterRecord, referencesTo, nameOf,
  ORG_MASTERS, WAREHOUSE_TYPES, DESIGNATION_LEVELS,
}
export default organizationService
