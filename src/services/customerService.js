/** Customer master data, credit configuration and VIP rules. */
import dayjs from 'dayjs'
import storage from './storageService'
import { logActivity } from './activityService'
import { STORAGE_KEYS } from '../utils/constants'
import { uid } from '../utils/helpers'
import { CREDIT_NEAR_THRESHOLD, CREDIT_STATUS, CUSTOMER_STATUSES, CUSTOMER_TYPES, VIP_STATUS } from '../config/masterData'
import { clean, isEmail, isGst, isIsoDate, isMobile, isPan, isPincode, nextCode, nonNegative, num, required } from './validation'

const KEY = STORAGE_KEYS.CUSTOMERS

export const getCustomers = () => storage.getItem(KEY, []) || []
export const getCustomerById = (id, list = getCustomers()) => list.find((c) => c.id === id) || null

/* ---------- Derived values ---------- */

export const getCreditInfo = (c) => {
  const limit = Number(c?.creditLimit) || 0
  const balance = Number(c?.creditBalance) || 0
  const enabled = Boolean(c?.creditEnabled)
  const utilisation = enabled && limit > 0 ? (balance / limit) * 100 : 0
  let status = CREDIT_STATUS.WITHIN
  if (!enabled) status = CREDIT_STATUS.DISABLED
  else if (balance > limit) status = CREDIT_STATUS.EXCEEDED
  else if (utilisation >= CREDIT_NEAR_THRESHOLD) status = CREDIT_STATUS.NEAR
  return { enabled, limit, balance, available: enabled ? limit - balance : 0, utilisation, status, days: Number(c?.creditDays) || 0 }
}

export const CREDIT_TONE = {
  [CREDIT_STATUS.WITHIN]: 'success',
  [CREDIT_STATUS.NEAR]: 'warning',
  [CREDIT_STATUS.EXCEEDED]: 'danger',
  [CREDIT_STATUS.DISABLED]: 'neutral',
}

/** VIP pass status — expired passes are detected automatically from the expiry date. */
export const getVipStatus = (c, today = dayjs()) => {
  if (!c?.isVip || !c?.vipPassEnabled) return VIP_STATUS.DISABLED
  if (!c.vipPassExpiry || dayjs(c.vipPassExpiry).endOf('day').isBefore(today)) return VIP_STATUS.EXPIRED
  return VIP_STATUS.ACTIVE
}

export const VIP_TONE = { [VIP_STATUS.ACTIVE]: 'accent', [VIP_STATUS.EXPIRED]: 'danger', [VIP_STATUS.DISABLED]: 'neutral' }
export const STATUS_TONE = { Active: 'success', Inactive: 'neutral', Blocked: 'danger' }

export const formatAddress = (c) =>
  c ? [c.addressLine1, c.addressLine2, c.city, [c.state, c.pincode].filter(Boolean).join(' '), c.country === 'India' ? '' : c.country].filter(Boolean).join(', ') : ''

/** Orders that reference the customer (Phase 1 order data). */
export const getCustomerOrders = (customerId) =>
  (storage.getItem(STORAGE_KEYS.ORDERS, []) || []).filter((o) => o.customerId === customerId)

/* ---------- Validation ---------- */

export const emptyCustomer = () => ({
  code: nextCustomerCode(), name: '', businessName: '', type: 'Retail', category: '', contactPerson: '', mobile: '', altMobile: '',
  email: '', gstNumber: '', panNumber: '', addressLine1: '', addressLine2: '', city: '', state: 'Tamil Nadu', pincode: '', country: 'India',
  status: 'Active', customerSince: dayjs().format('YYYY-MM-DD'), salesRepId: '', hubId: '', zoneId: '', notes: '',
  creditEnabled: true, creditLimit: '', creditBalance: '0', creditDays: '30',
  isVip: false, vipPassEnabled: false, vipPassNumber: '', vipPassExpiry: '',
})

export const nextCustomerCode = () => nextCode('CUS', getCustomers().map((c) => c.code))

export const validateCustomer = (input, { id = null, existing = null } = {}) => {
  const e = {}
  const list = getCustomers()
  const set = (field, msg) => { if (msg && !e[field]) e[field] = msg }

  set('name', required(input.name, 'Customer name'))
  set('code', required(input.code, 'Customer code'))
  if (input.code && !/^[A-Z0-9-]{3,20}$/i.test(clean(input.code))) set('code', 'Use 3–20 letters, numbers or hyphens.')
  if (input.code && list.some((c) => c.id !== id && c.code.toLowerCase() === clean(input.code).toLowerCase())) set('code', 'This customer code is already used by another customer.')
  if (!CUSTOMER_TYPES.includes(input.type)) set('type', 'Choose a customer type.')
  if (!CUSTOMER_STATUSES.includes(input.status)) set('status', 'Choose a status.')
  set('contactPerson', required(input.contactPerson, 'Contact person'))
  set('mobile', required(input.mobile, 'Mobile number'))
  if (input.mobile && !isMobile(input.mobile)) set('mobile', 'Enter a valid 10-digit Indian mobile number.')
  if (input.altMobile && !isMobile(input.altMobile)) set('altMobile', 'Enter a valid 10-digit Indian mobile number.')
  if (input.email && !isEmail(input.email)) set('email', 'Enter a valid email address.')
  if (input.panNumber && !isPan(input.panNumber)) set('panNumber', 'PAN format is AAAAA9999A.')
  if (input.gstNumber && !isGst(input.gstNumber)) set('gstNumber', 'GSTIN format is 15 characters, e.g. 33ABCDE1234F1Z5.')
  if (input.gstNumber && input.panNumber && isGst(input.gstNumber) && isPan(input.panNumber) && clean(input.gstNumber).toUpperCase().slice(2, 12) !== clean(input.panNumber).toUpperCase())
    set('gstNumber', 'GSTIN must contain the customer’s PAN (characters 3–12).')
  set('addressLine1', required(input.addressLine1, 'Address line 1'))
  set('city', required(input.city, 'City'))
  set('state', required(input.state, 'State'))
  set('pincode', required(input.pincode, 'Pincode'))
  if (input.pincode && !isPincode(input.pincode)) set('pincode', 'Enter a valid 6-digit pincode.')
  if (input.customerSince && !isIsoDate(input.customerSince)) set('customerSince', 'Enter a valid date.')
  if (input.customerSince && dayjs(input.customerSince).isAfter(dayjs(), 'day')) set('customerSince', 'Customer since cannot be in the future.')
  set('hubId', required(input.hubId, 'Preferred hub'))

  if (input.creditEnabled) {
    set('creditLimit', nonNegative(input.creditLimit, 'Credit limit'))
    set('creditBalance', nonNegative(input.creditBalance, 'Current credit balance'))
    set('creditDays', nonNegative(input.creditDays, 'Credit days'))
    if (!Number.isNaN(num(input.creditDays)) && !Number.isInteger(num(input.creditDays))) set('creditDays', 'Credit days must be a whole number.')
    if (num(input.creditDays) > 365) set('creditDays', 'Credit days cannot exceed 365.')
  }

  if (input.isVip && input.vipPassEnabled) {
    set('vipPassNumber', required(input.vipPassNumber, 'VIP pass number'))
    if (input.vipPassNumber && !/^[A-Z0-9-]{4,20}$/i.test(clean(input.vipPassNumber))) set('vipPassNumber', 'Use 4–20 letters, numbers or hyphens.')
    if (input.vipPassNumber && list.some((c) => c.id !== id && c.vipPassEnabled && c.vipPassNumber?.toLowerCase() === clean(input.vipPassNumber).toLowerCase()))
      set('vipPassNumber', 'This VIP pass number is already assigned.')
    set('vipPassExpiry', required(input.vipPassExpiry, 'VIP pass expiry'))
    if (input.vipPassExpiry && !isIsoDate(input.vipPassExpiry)) set('vipPassExpiry', 'Enter a valid date.')
    // A newly entered or changed expiry must be in the future; an untouched stored date may already be expired.
    const changed = !existing || existing.vipPassExpiry !== input.vipPassExpiry
    if (changed && isIsoDate(input.vipPassExpiry) && dayjs(input.vipPassExpiry).isBefore(dayjs(), 'day')) set('vipPassExpiry', 'Expiry date must be today or later.')
  }
  return e
}

const normalise = (input) => {
  const creditEnabled = Boolean(input.creditEnabled)
  const isVip = Boolean(input.isVip)
  const vipPassEnabled = isVip && Boolean(input.vipPassEnabled)
  return {
    code: clean(input.code).toUpperCase(),
    name: clean(input.name),
    businessName: clean(input.businessName) || clean(input.name),
    type: input.type,
    category: input.category || '',
    contactPerson: clean(input.contactPerson),
    mobile: clean(input.mobile),
    altMobile: clean(input.altMobile) || '',
    email: clean(input.email)?.toLowerCase() || '',
    gstNumber: clean(input.gstNumber)?.toUpperCase() || '',
    panNumber: clean(input.panNumber)?.toUpperCase() || '',
    addressLine1: clean(input.addressLine1),
    addressLine2: clean(input.addressLine2) || '',
    city: clean(input.city),
    state: input.state,
    pincode: clean(input.pincode),
    country: clean(input.country) || 'India',
    status: input.status,
    customerSince: input.customerSince || dayjs().format('YYYY-MM-DD'),
    salesRepId: input.salesRepId || '',
    hubId: input.hubId,
    zoneId: input.zoneId || '',
    notes: clean(input.notes) || '',
    creditEnabled,
    creditLimit: creditEnabled ? num(input.creditLimit) : 0,
    creditBalance: creditEnabled ? num(input.creditBalance) || 0 : Number(input.creditBalance) || 0,
    creditDays: creditEnabled ? num(input.creditDays) : 0,
    isVip,
    vipPassEnabled,
    vipPassNumber: vipPassEnabled ? clean(input.vipPassNumber).toUpperCase() : isVip ? clean(input.vipPassNumber)?.toUpperCase() || '' : '',
    vipPassExpiry: vipPassEnabled ? input.vipPassExpiry : isVip ? input.vipPassExpiry || '' : '',
  }
}

/**
 * Post a change to a customer's outstanding balance (pure — returns the new customer list). Used by invoice issue /
 * cancellation, customer receipts and credit notes so the order credit check always sees the same figure.
 */
export const postCustomerBalance = (customers, customerId, delta) => customers.map((c) => (c.id === customerId
  ? { ...c, creditBalance: Math.max(0, Math.round(((Number(c.creditBalance) || 0) + (Number(delta) || 0)) * 100) / 100), updatedAt: new Date().toISOString() }
  : c))

/* ---------- CRUD ---------- */

export const createCustomer = (input) => {
  const errors = validateCustomer(input)
  if (Object.keys(errors).length) return { ok: false, errors }
  const now = new Date().toISOString()
  const record = { id: uid('cus'), ...normalise(input), createdAt: now, updatedAt: now }
  const res = storage.setItem(KEY, [record, ...getCustomers()])
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'CUSTOMER', message: `created customer ${record.name} (${record.code})`, entityType: 'customer', entityId: record.id })
  return { ok: true, record }
}

export const updateCustomer = (id, input) => {
  const existing = getCustomerById(id)
  if (!existing) return { ok: false, errors: { form: 'This customer no longer exists.' } }
  const errors = validateCustomer(input, { id, existing })
  if (Object.keys(errors).length) return { ok: false, errors }
  // The outstanding balance is an opening figure at creation; afterwards invoices, receipts and credit notes
  // maintain it (postCustomerBalance) — the customer form cannot overwrite it.
  const record = { ...existing, ...normalise(input), creditBalance: Number(existing.creditBalance) || 0, updatedAt: new Date().toISOString() }
  const res = storage.setItem(KEY, getCustomers().map((c) => (c.id === id ? record : c)))
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  const changes = []
  if (existing.creditLimit !== record.creditLimit || existing.creditEnabled !== record.creditEnabled) changes.push('credit configuration')
  if (existing.isVip !== record.isVip || existing.vipPassEnabled !== record.vipPassEnabled || existing.vipPassExpiry !== record.vipPassExpiry) changes.push('VIP configuration')
  if (existing.status !== record.status) changes.push(`status to ${record.status}`)
  logActivity({ type: 'CUSTOMER', message: `updated ${record.name}${changes.length ? ` — ${changes.join(', ')}` : ''}`, entityType: 'customer', entityId: id })
  return { ok: true, record }
}

/** Customers referenced by orders cannot be deleted (history must stay intact) — mark them Inactive instead. */
export const getCustomerDeleteBlockers = (id) => {
  const orders = getCustomerOrders(id)
  return orders.length ? [`${orders.length} order${orders.length === 1 ? '' : 's'} reference this customer`] : []
}

export const deleteCustomer = (id) => {
  const existing = getCustomerById(id)
  if (!existing) return { ok: false, error: 'This customer no longer exists.' }
  const blockers = getCustomerDeleteBlockers(id)
  if (blockers.length) return { ok: false, error: `${existing.name} cannot be deleted: ${blockers.join('; ')}. Mark the customer Inactive instead.`, blockers }
  const res = storage.setItem(KEY, getCustomers().filter((c) => c.id !== id))
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'CUSTOMER', message: `deleted customer ${existing.name} (${existing.code})`, entityType: 'customer', entityId: id })
  return { ok: true }
}

/* ---------- Search & filter ---------- */

export const searchCustomers = (query = '', filters = {}, list = getCustomers()) => {
  const q = String(query).trim().toLowerCase()
  return list.filter((c) => {
    if (q && ![c.name, c.code, c.businessName, c.contactPerson, c.city, c.mobile, c.email, c.gstNumber].some((v) => String(v || '').toLowerCase().includes(q))) return false
    if (filters.type && c.type !== filters.type) return false
    if (filters.status && c.status !== filters.status) return false
    if (filters.vip === 'yes' && !c.isVip) return false
    if (filters.vip === 'no' && c.isVip) return false
    if (filters.vip && !['yes', 'no'].includes(filters.vip) && getVipStatus(c) !== filters.vip) return false
    if (filters.credit === 'enabled' && !c.creditEnabled) return false
    if (filters.credit === 'disabled' && c.creditEnabled) return false
    if (filters.creditStatus && getCreditInfo(c).status !== filters.creditStatus) return false
    if (filters.salesRepId && c.salesRepId !== filters.salesRepId) return false
    if (filters.hubId && c.hubId !== filters.hubId) return false
    return true
  })
}

const customerService = {
  getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer, searchCustomers,
  getCreditInfo, getVipStatus, formatAddress, validateCustomer, nextCustomerCode, getCustomerOrders, getCustomerDeleteBlockers,
}
export default customerService
