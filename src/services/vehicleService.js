/** Vehicles (Phase 4). Assigned / Available follow the vehicle's dispatches; Maintenance and Inactive are set by hand. */
import storage from './storageService'
import { logActivity } from './activityService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { CAPACITY_UNITS, RESOURCE_DISPATCH_STATUSES, VEHICLE_STATUSES, VEHICLE_TYPES } from '../config/dispatchConfig'
import { clean, num, required } from './validation'
import { vehicleComplianceIssues } from './complianceService'
import { FUEL_TYPES, OWNERSHIP_TYPES, VEHICLE_CATEGORIES } from '../config/vmsConfig'
import dayjs from 'dayjs'

export const getVehicles = () => storage.getItem(K.VEHICLES, []) || []
export const getVehicleById = (id, list = getVehicles()) => list.find((v) => v.id === id) || null

export const emptyVehicle = () => ({
  vehicleNumber: '', registrationNumber: '', type: 'Van', category: 'Refrigerated', manufacturer: '', model: '', manufacturingYear: '', fuelType: 'Diesel',
  capacity: '', capacityUnit: 'Units', ownershipType: 'Owned', ownerName: 'Bellomassi Foods Pvt. Ltd.', insuranceProvider: '', insurancePolicyNumber: '',
  insuranceExpiry: '', registrationExpiry: '', pollutionExpiry: '', fitnessExpiry: '', permitExpiry: '', hubId: '', assignedDriverId: '', status: 'Available', notes: '',
})
const EXPIRY_KEYS = ['insuranceExpiry', 'registrationExpiry', 'pollutionExpiry', 'fitnessExpiry', 'permitExpiry']

const activeDispatchesFor = (vehicleId) => (storage.getItem(K.DISPATCHES, []) || []).filter((d) => d.vehicleId === vehicleId && RESOURCE_DISPATCH_STATUSES.includes(d.status))

export const normaliseNumber = (v) => clean(v || '').toUpperCase().replace(/\s+/g, ' ')

export const validateVehicle = (input, { id = null } = {}) => {
  const e = {}
  const set = (f, m) => { if (m && !e[f]) e[f] = m }
  const list = getVehicles()
  const hubs = storage.getItem(K.HUBS, []) || []
  set('vehicleNumber', required(input.vehicleNumber, 'Vehicle number'))
  const n = normaliseNumber(input.vehicleNumber)
  if (n && !/^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{1,4}$/.test(n)) set('vehicleNumber', 'Use an Indian registration format, e.g. TN 01 BX 4521.')
  if (n && list.some((v) => v.id !== id && normaliseNumber(v.vehicleNumber).replace(/\s/g, '') === n.replace(/\s/g, ''))) set('vehicleNumber', 'This vehicle number is already registered.')
  if (!VEHICLE_TYPES.includes(input.type)) set('type', 'Choose a vehicle type.')
  const cap = num(input.capacity)
  if (Number.isNaN(cap)) set('capacity', 'Capacity is required.')
  else if (cap <= 0) set('capacity', 'Capacity must be greater than zero.')
  else if (cap > 100000) set('capacity', 'Capacity is too large.')
  if (!CAPACITY_UNITS.includes(input.capacityUnit)) set('capacityUnit', 'Choose a capacity unit.')
  if (!hubs.some((h) => h.id === input.hubId)) set('hubId', 'Select the hub this vehicle operates from.')
  if (!VEHICLE_STATUSES.includes(input.status)) set('status', 'Choose a status.')
  // Phase 5 VMS fields (optional unless noted)
  const reg = normaliseNumber(input.registrationNumber || input.vehicleNumber)
  if (reg && list.some((v) => v.id !== id && normaliseNumber(v.registrationNumber || v.vehicleNumber).replace(/\s/g, '') === reg.replace(/\s/g, ''))) set('registrationNumber', 'This registration number belongs to another vehicle.')
  if (input.manufacturingYear !== '' && input.manufacturingYear !== undefined && input.manufacturingYear !== null) {
    const y = Number(input.manufacturingYear)
    if (!Number.isInteger(y) || y < 1990 || y > new Date().getFullYear() + 1) set('manufacturingYear', `Enter a year between 1990 and ${new Date().getFullYear() + 1}.`)
  }
  if (input.fuelType && !FUEL_TYPES.includes(input.fuelType)) set('fuelType', 'Choose a fuel type.')
  if (input.category && !VEHICLE_CATEGORIES.includes(input.category)) set('category', 'Choose a category.')
  if (input.ownershipType && !OWNERSHIP_TYPES.includes(input.ownershipType)) set('ownershipType', 'Choose an ownership type.')
  EXPIRY_KEYS.forEach((k) => { if (input[k] && !/^\d{4}-\d{2}-\d{2}$/.test(input[k])) set(k, 'Enter a valid date.') })
  if (input.insuranceExpiry && !clean(input.insuranceProvider)) set('insuranceProvider', 'Enter the insurer for this policy.')
  if (input.assignedDriverId) {
    const drv = (storage.getItem(K.DRIVERS, []) || []).find((d) => d.id === input.assignedDriverId)
    if (!drv) set('assignedDriverId', 'Select a valid driver.')
    else if (drv.hubId !== input.hubId) set('assignedDriverId', 'The driver works from another hub.')
    else if (drv.status !== 'Active') set('assignedDriverId', 'The driver is inactive.')
  }
  if (id) {
    const active = activeDispatchesFor(id)
    const existing = getVehicleById(id, list)
    if (active.length && ['Maintenance', 'Inactive'].includes(input.status)) set('status', `On ${active[0].dispatchNumber}. Complete or reassign that dispatch before changing the status.`)
    if (active.length && existing && existing.hubId !== input.hubId) set('hubId', `On ${active[0].dispatchNumber} — the hub cannot change until it is completed.`)
  }
  return e
}

/** Assigned is derived from dispatches: a vehicle only becomes Assigned through dispatch assignment. */
const statusFor = (input, id) => {
  if (['Maintenance', 'Inactive'].includes(input.status)) return input.status
  const active = id ? activeDispatchesFor(id) : []
  if (active.some((d) => d.status === 'IN_TRANSIT')) return 'In Transit'
  return active.length ? 'Assigned' : 'Available'
}

const normalise = (input, id) => ({
  vehicleNumber: normaliseNumber(input.vehicleNumber),
  type: input.type,
  model: clean(input.model) || '',
  capacity: num(input.capacity),
  capacityUnit: input.capacityUnit,
  hubId: input.hubId,
  status: statusFor(input, id),
  notes: clean(input.notes) || '',
  // Phase 5 VMS
  registrationNumber: normaliseNumber(input.registrationNumber || input.vehicleNumber),
  category: input.category || '',
  manufacturer: clean(input.manufacturer) || '',
  manufacturingYear: input.manufacturingYear === '' || input.manufacturingYear === undefined ? '' : Number(input.manufacturingYear),
  fuelType: input.fuelType || '',
  ownershipType: input.ownershipType || '',
  ownerName: clean(input.ownerName) || '',
  insuranceProvider: clean(input.insuranceProvider) || '',
  insurancePolicyNumber: clean(input.insurancePolicyNumber) || '',
  ...Object.fromEntries(EXPIRY_KEYS.map((k) => [k, input[k] || ''])),
  assignedDriverId: input.assignedDriverId || null,
  remarks: clean(input.notes) || '',
  vmsExtended: true,
})

export const createVehicle = (input) => {
  const errors = validateVehicle(input)
  if (Object.keys(errors).length) return { ok: false, errors }
  const now = new Date().toISOString()
  const record = { id: uid('veh'), ...normalise(input), createdAt: now, updatedAt: now }
  const res = storage.setItem(K.VEHICLES, [...getVehicles(), record])
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'VEHICLE', message: `registered vehicle ${record.vehicleNumber} (${record.type})`, entityType: 'vehicle', entityId: record.id })
  return { ok: true, record }
}

export const updateVehicle = (id, input) => {
  const existing = getVehicleById(id)
  if (!existing) return { ok: false, errors: { form: 'This vehicle no longer exists.' } }
  const errors = validateVehicle(input, { id })
  if (Object.keys(errors).length) return { ok: false, errors }
  const record = { ...existing, ...normalise(input, id), updatedAt: new Date().toISOString() }
  const res = storage.setItem(K.VEHICLES, getVehicles().map((v) => (v.id === id ? record : v)))
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'VEHICLE', message: `updated vehicle ${record.vehicleNumber}${existing.status !== record.status ? ` — status to ${record.status}` : ''}`, entityType: 'vehicle', entityId: id })
  return { ok: true, record }
}

export const getVehicleDeleteBlockers = (id) => {
  const blockers = []
  const active = activeDispatchesFor(id)
  if (active.length) blockers.push({ kind: 'dispatches', text: `is on ${active.length} active dispatch${active.length === 1 ? '' : 'es'} (${active.map((d) => d.dispatchNumber).join(', ')})` })
  const drivers = (storage.getItem(K.DRIVERS, []) || []).filter((d) => d.vehicleId === id)
  if (drivers.length) blockers.push({ kind: 'drivers', text: `is the regular vehicle of ${drivers.map((d) => d.name).join(', ')}` })
  return blockers
}

export const deleteVehicle = (id) => {
  const existing = getVehicleById(id)
  if (!existing) return { ok: false, error: 'This vehicle no longer exists.' }
  const blockers = getVehicleDeleteBlockers(id)
  if (blockers.length) return { ok: false, blockers, error: `${existing.vehicleNumber} ${blockers.map((b) => b.text).join('; ')}. Mark it Inactive instead.` }
  const res = storage.setItem(K.VEHICLES, getVehicles().filter((v) => v.id !== id))
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'VEHICLE', message: `deleted vehicle ${existing.vehicleNumber}`, entityType: 'vehicle', entityId: id })
  return { ok: true }
}

/**
 * Why a vehicle cannot take a dispatch. ctx: { hubId, load, dispatchId }.
 * Returns [{ code, message }] — empty when the vehicle can be assigned.
 */
export const vehicleAssignmentIssues = (vehicle, { hubId, load = 0, dispatchId = null, dispatchDate = null }, dispatches = storage.getItem(K.DISPATCHES, []) || []) => {
  if (!vehicle) return [{ code: 'missing', message: 'Select a vehicle.' }]
  const issues = []
  if (vehicle.status === 'Inactive') issues.push({ code: 'inactive', message: `${vehicle.vehicleNumber} is inactive.` })
  if (vehicle.status === 'Maintenance') issues.push({ code: 'maintenance', message: `${vehicle.vehicleNumber} is under maintenance.` })
  const other = dispatches.find((d) => d.vehicleId === vehicle.id && d.id !== dispatchId && RESOURCE_DISPATCH_STATUSES.includes(d.status))
  if (other) issues.push({ code: 'busy', message: `${vehicle.vehicleNumber} is already on ${other.dispatchNumber}.` })
  if (hubId && vehicle.hubId !== hubId) issues.push({ code: 'hub', message: `${vehicle.vehicleNumber} belongs to another hub.` })
  if (load > vehicle.capacity) issues.push({ code: 'capacity', message: `Load of ${load} exceeds ${vehicle.vehicleNumber}'s capacity of ${vehicle.capacity} ${vehicle.capacityUnit.toLowerCase()}.` })
  // Phase 5 VMS: insurance / RC / fitness and other required documents
  issues.push(...vehicleComplianceIssues(vehicle, dispatchDate ? dayjs(dispatchDate) : dayjs()))
  return issues
}

export const searchVehicles = (q, f = {}, list = getVehicles()) => {
  const query = (q || '').trim().toLowerCase()
  return list.filter((v) => {
    if (query && ![v.vehicleNumber, v.registrationNumber, v.model, v.manufacturer, v.type, v.notes].some((x) => String(x || '').toLowerCase().includes(query))) return false
    if (f.hubId && v.hubId !== f.hubId) return false
    if (f.status && v.status !== f.status) return false
    if (f.type && v.type !== f.type) return false
    return true
  })
}

const vehicleService = { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle, getVehicleDeleteBlockers, vehicleAssignmentIssues, searchVehicles }
export default vehicleService
