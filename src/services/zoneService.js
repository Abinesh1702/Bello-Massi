/** Dispatch zones (Phase 4). Zones linked to active dispatches or customers cannot be deleted — mark them Inactive. */
import storage from './storageService'
import { logActivity } from './activityService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { ACTIVE_DISPATCH_STATUSES, ZONE_STATUSES } from '../config/dispatchConfig'
import { clean, isPincode, required } from './validation'

export const getZones = () => storage.getItem(K.DISPATCH_ZONES, []) || []
export const getZoneById = (id, list = getZones()) => list.find((z) => z.id === id) || null
export const getActiveZones = (hubId, list = getZones()) => list.filter((z) => z.status === 'Active' && (!hubId || z.hubId === hubId))

/** "600001, 600004 600011" → ['600001', '600004', '600011'] (unique, in order). */
export const parsePincodes = (value) => {
  const list = Array.isArray(value) ? value : String(value || '').split(/[\s,;]+/)
  return [...new Set(list.map((p) => String(p).trim()).filter(Boolean))]
}

export const emptyZone = () => ({
  code: '', name: '', description: '', managerName: '', hubId: '', status: 'Active', city: '', state: 'Tamil Nadu', pincodes: '', deliveryArea: '', notes: '',
})

export const zoneToInput = (z) => ({ ...z, pincodes: (z.pincodes || []).join(', ') })

export const validateZone = (input, { id = null } = {}) => {
  const e = {}
  const set = (f, m) => { if (m && !e[f]) e[f] = m }
  const list = getZones()
  const hubs = storage.getItem(K.HUBS, []) || []
  set('code', required(input.code, 'Zone code'))
  if (input.code && !/^[A-Z0-9-]{2,12}$/i.test(clean(input.code))) set('code', 'Use 2–12 letters, numbers or dashes, e.g. ZN-CHE-N.')
  if (input.code && list.some((z) => z.id !== id && z.code.toLowerCase() === clean(input.code).toLowerCase())) set('code', 'This zone code is already used.')
  set('name', required(input.name, 'Zone name'))
  if (input.name && list.some((z) => z.id !== id && z.hubId === input.hubId && z.name.toLowerCase() === clean(input.name).toLowerCase())) set('name', 'This hub already has a zone with this name.')
  const hub = hubs.find((h) => h.id === input.hubId)
  if (!hub) set('hubId', 'Select a valid hub.')
  else if (hub.status !== 'Active' && !id) set('hubId', `${hub.name} is inactive. Choose an active hub.`)
  if (!ZONE_STATUSES.includes(input.status)) set('status', 'Choose a status.')
  set('city', required(input.city, 'City'))
  const pins = parsePincodes(input.pincodes)
  if (!pins.length) set('pincodes', 'Add at least one pincode.')
  const bad = pins.filter((p) => !isPincode(p))
  if (bad.length) set('pincodes', `Invalid pincode${bad.length > 1 ? 's' : ''}: ${bad.slice(0, 3).join(', ')}.`)
  if (input.status === 'Inactive' && id) {
    const active = activeDispatchesForZone(id)
    if (active.length) set('status', `This zone has ${active.length} active dispatch${active.length === 1 ? '' : 'es'} (${active.map((d) => d.dispatchNumber).slice(0, 2).join(', ')}). Complete or cancel them first.`)
  }
  return e
}

const normalise = (input) => ({
  code: clean(input.code).toUpperCase(),
  name: clean(input.name),
  description: clean(input.description) || '',
  managerName: clean(input.managerName) || '',
  hubId: input.hubId,
  status: input.status,
  city: clean(input.city),
  state: input.state || '',
  pincodes: parsePincodes(input.pincodes),
  deliveryArea: clean(input.deliveryArea) || '',
  notes: clean(input.notes) || '',
})

export const createZone = (input) => {
  const errors = validateZone(input)
  if (Object.keys(errors).length) return { ok: false, errors }
  const now = new Date().toISOString()
  const record = { id: uid('zone'), ...normalise(input), createdAt: now, updatedAt: now }
  const res = storage.setItem(K.DISPATCH_ZONES, [...getZones(), record])
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'ZONE', message: `created dispatch zone ${record.name} (${record.code})`, entityType: 'zone', entityId: record.id })
  return { ok: true, record }
}

export const updateZone = (id, input) => {
  const existing = getZoneById(id)
  if (!existing) return { ok: false, errors: { form: 'This zone no longer exists.' } }
  const errors = validateZone(input, { id })
  if (Object.keys(errors).length) return { ok: false, errors }
  const record = { ...existing, ...normalise(input), updatedAt: new Date().toISOString() }
  const res = storage.setItem(K.DISPATCH_ZONES, getZones().map((z) => (z.id === id ? record : z)))
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'ZONE', message: `updated dispatch zone ${record.name}${existing.status !== record.status ? ` — status to ${record.status}` : ''}`, entityType: 'zone', entityId: id })
  return { ok: true, record }
}

export const activeDispatchesForZone = (id) => (storage.getItem(K.DISPATCHES, []) || []).filter((d) => d.zoneId === id && ACTIVE_DISPATCH_STATUSES.includes(d.status))

export const getZoneDeleteBlockers = (id) => {
  const blockers = []
  const active = activeDispatchesForZone(id)
  if (active.length) blockers.push({ kind: 'dispatches', text: `is used by ${active.length} active dispatch${active.length === 1 ? '' : 'es'} (${active.map((d) => d.dispatchNumber).slice(0, 3).join(', ')})` })
  const customers = (storage.getItem(K.CUSTOMERS, []) || []).filter((c) => c.zoneId === id)
  if (customers.length) blockers.push({ kind: 'customers', text: `is the delivery zone of ${customers.length} customer${customers.length === 1 ? '' : 's'}` })
  const drivers = (storage.getItem(K.DRIVERS, []) || []).filter((d) => d.zoneId === id)
  if (drivers.length) blockers.push({ kind: 'drivers', text: `is the home zone of ${drivers.length} driver${drivers.length === 1 ? '' : 's'}` })
  return blockers
}

export const deleteZone = (id) => {
  const existing = getZoneById(id)
  if (!existing) return { ok: false, error: 'This zone no longer exists.' }
  const blockers = getZoneDeleteBlockers(id)
  if (blockers.length) return { ok: false, blockers, error: `${existing.name} ${blockers.map((b) => b.text).join('; ')}. Mark the zone Inactive instead.` }
  const res = storage.setItem(K.DISPATCH_ZONES, getZones().filter((z) => z.id !== id))
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'ZONE', message: `deleted dispatch zone ${existing.name} (${existing.code})`, entityType: 'zone', entityId: id })
  return { ok: true }
}

export const searchZones = (q, f = {}, list = getZones()) => {
  const query = (q || '').trim().toLowerCase()
  return list.filter((z) => {
    if (query && ![z.code, z.name, z.city, z.managerName, z.deliveryArea, ...(z.pincodes || [])].some((v) => String(v || '').toLowerCase().includes(query))) return false
    if (f.hubId && z.hubId !== f.hubId) return false
    if (f.status && z.status !== f.status) return false
    if (f.city && z.city !== f.city) return false
    return true
  })
}

const zoneService = { getZones, getZoneById, getActiveZones, createZone, updateZone, deleteZone, getZoneDeleteBlockers, searchZones, parsePincodes }
export default zoneService
