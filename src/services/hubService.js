/** Hub master data. Hubs holding stock cannot be deleted — mark them Inactive instead. */
import storage from './storageService'
import { logActivity } from './activityService'
import { STORAGE_KEYS } from '../utils/constants'
import { uid } from '../utils/helpers'
import { HUB_STATUSES, HUB_TYPES } from '../config/masterData'
import { clean, isEmail, isPhone, isPincode, required } from './validation'

const KEY = STORAGE_KEYS.HUBS

export const getHubs = () => storage.getItem(KEY, []) || []
export const getHubById = (id, list = getHubs()) => list.find((h) => h.id === id) || null
export const getActiveHubs = (list = getHubs()) => list.filter((h) => h.status === 'Active')

export const STATUS_TONE = { Active: 'success', Inactive: 'neutral' }

export const formatHubAddress = (h) => (h ? [h.addressLine1, h.addressLine2, h.city, [h.state, h.pincode].filter(Boolean).join(' ')].filter(Boolean).join(', ') : '')

export const emptyHub = () => ({
  code: '', name: '', hubType: 'Branch Hub', managerName: '', contactNumber: '', email: '', addressLine1: '', addressLine2: '',
  city: '', state: 'Tamil Nadu', pincode: '', country: 'India', status: 'Active', operatingHours: 'Mon–Sat 06:00–21:00', notes: '',
  capacityPallets: '', coldRooms: '',
})

export const validateHub = (input, { id = null } = {}) => {
  const e = {}
  const set = (f, m) => { if (m && !e[f]) e[f] = m }
  const list = getHubs()
  set('code', required(input.code, 'Hub code'))
  if (input.code && !/^[A-Z0-9]{2,6}$/i.test(clean(input.code))) set('code', 'Use 2–6 letters or numbers, e.g. CHE.')
  if (input.code && list.some((h) => h.id !== id && h.code.toLowerCase() === clean(input.code).toLowerCase())) set('code', 'This hub code is already used.')
  set('name', required(input.name, 'Hub name'))
  if (input.name && list.some((h) => h.id !== id && h.name.toLowerCase() === clean(input.name).toLowerCase())) set('name', 'A hub with this name already exists.')
  if (!HUB_TYPES.includes(input.hubType)) set('hubType', 'Choose a hub type.')
  if (!HUB_STATUSES.includes(input.status)) set('status', 'Choose a status.')
  set('managerName', required(input.managerName, 'Hub manager'))
  set('contactNumber', required(input.contactNumber, 'Contact number'))
  if (input.contactNumber && !isPhone(input.contactNumber)) set('contactNumber', 'Enter a valid phone number.')
  if (input.email && !isEmail(input.email)) set('email', 'Enter a valid email address.')
  set('addressLine1', required(input.addressLine1, 'Address line 1'))
  set('city', required(input.city, 'City'))
  set('state', required(input.state, 'State'))
  set('pincode', required(input.pincode, 'Pincode'))
  if (input.pincode && !isPincode(input.pincode)) set('pincode', 'Enter a valid 6-digit pincode.')
  ;['capacityPallets', 'coldRooms'].forEach((f) => {
    if (input[f] !== '' && input[f] !== undefined && input[f] !== null && (Number(input[f]) < 0 || !Number.isInteger(Number(input[f])))) set(f, 'Enter a whole number of 0 or more.')
  })
  return e
}

const normalise = (input) => ({
  code: clean(input.code).toUpperCase(),
  name: clean(input.name),
  hubType: input.hubType,
  managerName: clean(input.managerName),
  contactNumber: clean(input.contactNumber),
  email: clean(input.email)?.toLowerCase() || '',
  addressLine1: clean(input.addressLine1),
  addressLine2: clean(input.addressLine2) || '',
  city: clean(input.city),
  state: input.state,
  pincode: clean(input.pincode),
  country: clean(input.country) || 'India',
  status: input.status,
  operatingHours: clean(input.operatingHours) || '',
  notes: clean(input.notes) || '',
  capacityPallets: input.capacityPallets === '' ? 0 : Number(input.capacityPallets) || 0,
  coldRooms: input.coldRooms === '' ? 0 : Number(input.coldRooms) || 0,
})

export const createHub = (input) => {
  const errors = validateHub(input)
  if (Object.keys(errors).length) return { ok: false, errors }
  const now = new Date().toISOString()
  const record = { id: uid('hub'), ...normalise(input), createdAt: now, updatedAt: now }
  const res = storage.setItem(KEY, [...getHubs(), record])
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'HUB', message: `created hub ${record.name} (${record.code})`, entityType: 'hub', entityId: record.id })
  return { ok: true, record }
}

export const updateHub = (id, input) => {
  const existing = getHubById(id)
  if (!existing) return { ok: false, errors: { form: 'This hub no longer exists.' } }
  const errors = validateHub(input, { id })
  if (Object.keys(errors).length) return { ok: false, errors }
  const record = { ...existing, ...normalise(input), updatedAt: new Date().toISOString() }
  const res = storage.setItem(KEY, getHubs().map((h) => (h.id === id ? record : h)))
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'HUB', message: `updated hub ${record.name}${existing.status !== record.status ? ` — status to ${record.status}` : ''}`, entityType: 'hub', entityId: id })
  return { ok: true, record }
}

/** Reasons a hub cannot be deleted. Stock is the primary rule; references keep history consistent. */
export const getHubDeleteBlockers = (id) => {
  const blockers = []
  const stock = (storage.getItem(STORAGE_KEYS.INVENTORY, []) || []).filter((r) => r.hubId === id && r.totalQuantity > 0)
  if (stock.length) blockers.push({ kind: 'stock', text: `holds ${stock.reduce((s, r) => s + r.totalQuantity, 0)} units across ${stock.length} product${stock.length === 1 ? '' : 's'}` })
  const orders = (storage.getItem(STORAGE_KEYS.ORDERS, []) || []).filter((o) => o.hubId === id)
  if (orders.length) blockers.push({ kind: 'orders', text: `is used by ${orders.length} order${orders.length === 1 ? '' : 's'}` })
  const customers = (storage.getItem(STORAGE_KEYS.CUSTOMERS, []) || []).filter((c) => c.hubId === id)
  if (customers.length) blockers.push({ kind: 'customers', text: `is the preferred hub of ${customers.length} customer${customers.length === 1 ? '' : 's'}` })
  const drivers = (storage.getItem(STORAGE_KEYS.DRIVERS, []) || []).filter((d) => d.hubId === id)
  if (drivers.length) blockers.push({ kind: 'drivers', text: `has ${drivers.length} driver${drivers.length === 1 ? '' : 's'} assigned` })
  const zones = (storage.getItem(STORAGE_KEYS.DISPATCH_ZONES, []) || []).filter((z) => z.hubId === id)
  if (zones.length) blockers.push({ kind: 'zones', text: `has ${zones.length} dispatch zone${zones.length === 1 ? '' : 's'}` })
  const vehicles = (storage.getItem(STORAGE_KEYS.VEHICLES, []) || []).filter((v) => v.hubId === id)
  if (vehicles.length) blockers.push({ kind: 'vehicles', text: `has ${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'} based there` })
  return blockers
}

export const deleteHub = (id) => {
  const existing = getHubById(id)
  if (!existing) return { ok: false, error: 'This hub no longer exists.' }
  const blockers = getHubDeleteBlockers(id)
  if (blockers.length) return { ok: false, blockers, error: `${existing.name} ${blockers.map((b) => b.text).join('; ')}. Mark the hub Inactive instead.` }
  const res = storage.transaction([
    [KEY, getHubs().filter((h) => h.id !== id)],
    [STORAGE_KEYS.INVENTORY, (storage.getItem(STORAGE_KEYS.INVENTORY, []) || []).filter((r) => r.hubId !== id)],
  ])
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'HUB', message: `deleted hub ${existing.name} (${existing.code})`, entityType: 'hub', entityId: id })
  return { ok: true }
}

export const searchHubs = (query = '', filters = {}, list = getHubs()) => {
  const q = String(query).trim().toLowerCase()
  return list.filter((h) => {
    if (q && ![h.name, h.code, h.city, h.managerName, h.state].some((v) => String(v || '').toLowerCase().includes(q))) return false
    if (filters.hubType && h.hubType !== filters.hubType) return false
    if (filters.status && h.status !== filters.status) return false
    return true
  })
}

const hubService = { getHubs, getHubById, createHub, updateHub, deleteHub, searchHubs, validateHub, getHubDeleteBlockers, getActiveHubs }
export default hubService
