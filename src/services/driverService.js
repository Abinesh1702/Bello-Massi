/**
 * Drivers (Phase 4). Availability "Assigned" / "On Delivery" follows the driver's dispatches;
 * "Available" / "Offline" is set by hand. Drivers are validated before every assignment.
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { logActivity } from './activityService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { DRIVER_STATUSES, LICENSE_WARNING_DAYS, RESOURCE_DISPATCH_STATUSES } from '../config/dispatchConfig'
import { deriveDriverAvailability, deriveVehicleStatus } from './seed/dispatchSeed'
import { driverComplianceIssues } from './complianceService'
import { clean, isEmail, isIsoDate, isMobile, nextCode, required } from './validation'

export const getDrivers = () => storage.getItem(K.DRIVERS, []) || []
export const getDriverById = (id, list = getDrivers()) => list.find((d) => d.id === id) || null
export const getDriverForUser = (userId, list = getDrivers()) => list.find((d) => d.userId === userId) || null

/** { state: 'Valid' | 'Expiring' | 'Expired' | 'Missing', days } relative to `on` (default today). */
export const licenseState = (driver, on = dayjs()) => {
  if (!driver?.licenseExpiry || !isIsoDate(driver.licenseExpiry)) return { state: 'Missing', days: null }
  const days = dayjs(driver.licenseExpiry).startOf('day').diff(dayjs(on).startOf('day'), 'day')
  if (days < 0) return { state: 'Expired', days }
  if (days <= LICENSE_WARNING_DAYS) return { state: 'Expiring', days }
  return { state: 'Valid', days }
}

export const emptyDriver = () => ({
  code: nextCode('DRV', getDrivers().map((d) => d.code)), name: '', employeeNumber: '', mobile: '', email: '', hubId: '', zoneId: '',
  licenseNumber: '', licenseExpiry: '', status: 'Active', availability: 'Available', vehicleId: '', address: '', notes: '',
})

const activeDispatchesFor = (driverId) => (storage.getItem(K.DISPATCHES, []) || []).filter((d) => d.driverId === driverId && RESOURCE_DISPATCH_STATUSES.includes(d.status))

export const validateDriver = (input, { id = null } = {}) => {
  const e = {}
  const set = (f, m) => { if (m && !e[f]) e[f] = m }
  const list = getDrivers()
  const hubs = storage.getItem(K.HUBS, []) || []
  const zones = storage.getItem(K.DISPATCH_ZONES, []) || []
  const vehicles = storage.getItem(K.VEHICLES, []) || []
  set('code', required(input.code, 'Driver code'))
  if (input.code && !/^[A-Z0-9-]{3,12}$/i.test(clean(input.code))) set('code', 'Use 3–12 letters, numbers or dashes, e.g. DRV-009.')
  if (input.code && list.some((d) => d.id !== id && d.code.toLowerCase() === clean(input.code).toLowerCase())) set('code', 'This driver code is already used.')
  set('name', required(input.name, 'Driver name'))
  if (input.employeeNumber && list.some((d) => d.id !== id && d.employeeNumber && d.employeeNumber.toLowerCase() === clean(input.employeeNumber).toLowerCase())) set('employeeNumber', 'This employee number is already used.')
  set('mobile', required(input.mobile, 'Mobile number'))
  if (input.mobile && !isMobile(input.mobile)) set('mobile', 'Enter a valid 10-digit Indian mobile number.')
  if (input.email && !isEmail(input.email)) set('email', 'Enter a valid email address.')
  if (!hubs.some((h) => h.id === input.hubId)) set('hubId', 'Select the driver’s hub.')
  if (input.zoneId) {
    const zone = zones.find((z) => z.id === input.zoneId)
    if (!zone) set('zoneId', 'Select a valid zone.')
    else if (zone.hubId !== input.hubId) set('zoneId', 'The zone must belong to the driver’s hub.')
  }
  set('licenseNumber', required(input.licenseNumber, 'Driving licence number'))
  if (input.licenseNumber && list.some((d) => d.id !== id && d.licenseNumber.replace(/\s/g, '').toLowerCase() === clean(input.licenseNumber).replace(/\s/g, '').toLowerCase())) set('licenseNumber', 'This licence number belongs to another driver.')
  set('licenseExpiry', required(input.licenseExpiry, 'Licence expiry date'))
  if (input.licenseExpiry && !isIsoDate(input.licenseExpiry)) set('licenseExpiry', 'Enter a valid date.')
  if (!DRIVER_STATUSES.includes(input.status)) set('status', 'Choose a status.')
  if (!['Available', 'Offline', 'Assigned', 'On Delivery'].includes(input.availability)) set('availability', 'Choose availability.')
  if (input.vehicleId) {
    const v = vehicles.find((x) => x.id === input.vehicleId)
    if (!v) set('vehicleId', 'Select a valid vehicle.')
    else if (v.hubId !== input.hubId) set('vehicleId', 'The vehicle must operate from the driver’s hub.')
    else if (list.some((d) => d.id !== id && d.vehicleId === input.vehicleId)) set('vehicleId', `${v.vehicleNumber} is already the regular vehicle of another driver.`)
  }
  if (id) {
    const active = activeDispatchesFor(id)
    const existing = getDriverById(id, list)
    if (active.length && input.status === 'Inactive') set('status', `Assigned to ${active[0].dispatchNumber}. Reassign or complete it first.`)
    if (active.length && existing && existing.hubId !== input.hubId) set('hubId', `Assigned to ${active[0].dispatchNumber} — the hub cannot change until it is completed.`)
  }
  return e
}

const normalise = (input, id) => {
  const base = {
    code: clean(input.code).toUpperCase(),
    name: clean(input.name),
    employeeNumber: clean(input.employeeNumber) || '',
    mobile: clean(input.mobile),
    email: clean(input.email)?.toLowerCase() || '',
    hubId: input.hubId,
    zoneId: input.zoneId || '',
    licenseNumber: clean(input.licenseNumber).toUpperCase(),
    licenseExpiry: input.licenseExpiry,
    status: input.status,
    vehicleId: input.vehicleId || null,
    address: clean(input.address) || '',
    notes: clean(input.notes) || '',
  }
  // Only Available / Offline are chosen by hand; dispatches decide Assigned / On Delivery
  const manual = input.availability === 'Offline' ? 'Offline' : 'Available'
  const availability = deriveDriverAvailability({ ...base, id, availability: manual }, id ? storage.getItem(K.DISPATCHES, []) || [] : [])
  return { ...base, availability }
}

export const createDriver = (input) => {
  const errors = validateDriver(input)
  if (Object.keys(errors).length) return { ok: false, errors }
  const now = new Date().toISOString()
  const record = { id: uid('drv'), ...normalise(input, null), userId: null, createdAt: now, updatedAt: now }
  const res = storage.setItem(K.DRIVERS, [...getDrivers(), record])
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'DRIVER', message: `added driver ${record.name} (${record.code})`, entityType: 'driver', entityId: record.id })
  return { ok: true, record }
}

export const updateDriver = (id, input) => {
  const existing = getDriverById(id)
  if (!existing) return { ok: false, errors: { form: 'This driver no longer exists.' } }
  const errors = validateDriver(input, { id })
  if (Object.keys(errors).length) return { ok: false, errors }
  const record = { ...existing, ...normalise(input, id), updatedAt: new Date().toISOString() }
  const res = storage.setItem(K.DRIVERS, getDrivers().map((d) => (d.id === id ? record : d)))
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'DRIVER', message: `updated driver ${record.name}${existing.status !== record.status ? ` — status to ${record.status}` : ''}`, entityType: 'driver', entityId: id })
  return { ok: true, record }
}

export const getDriverDeleteBlockers = (id) => {
  const blockers = []
  const active = activeDispatchesFor(id)
  if (active.length) blockers.push({ kind: 'dispatches', text: `is assigned to ${active.length} active dispatch${active.length === 1 ? '' : 'es'} (${active.map((d) => d.dispatchNumber).join(', ')})` })
  const driver = getDriverById(id)
  if (driver?.userId) blockers.push({ kind: 'login', text: 'is linked to a demo login account (the driver app needs it)' })
  return blockers
}

export const deleteDriver = (id) => {
  const existing = getDriverById(id)
  if (!existing) return { ok: false, error: 'This driver no longer exists.' }
  const blockers = getDriverDeleteBlockers(id)
  if (blockers.length) return { ok: false, blockers, error: `${existing.name} ${blockers.map((b) => b.text).join('; ')}. Mark the driver Inactive instead.` }
  const res = storage.setItem(K.DRIVERS, getDrivers().filter((d) => d.id !== id))
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'DRIVER', message: `deleted driver ${existing.name} (${existing.code}) — past dispatches keep the name`, entityType: 'driver', entityId: id })
  return { ok: true }
}

/**
 * Why a driver cannot take a dispatch. ctx: { hubId, dispatchDate, dispatchId }.
 * Returns [{ code, message }] — empty when the driver can be assigned.
 */
export const driverAssignmentIssues = (driver, { hubId, dispatchDate, dispatchId = null }, dispatches = storage.getItem(K.DISPATCHES, []) || []) => {
  if (!driver) return [{ code: 'missing', message: 'Select a driver.' }]
  const issues = []
  if (driver.status !== 'Active') issues.push({ code: 'inactive', message: `${driver.name} is inactive.` })
  const other = dispatches.find((d) => d.driverId === driver.id && d.id !== dispatchId && RESOURCE_DISPATCH_STATUSES.includes(d.status))
  if (other) issues.push({ code: 'busy', message: `${driver.name} already has an active dispatch (${other.dispatchNumber}).` })
  else if (driver.availability === 'Offline') issues.push({ code: 'offline', message: `${driver.name} is offline.` })
  if (hubId && driver.hubId !== hubId) issues.push({ code: 'hub', message: `${driver.name} works from another hub.` })
  const lic = licenseState(driver, dispatchDate || dayjs())
  if (lic.state === 'Expired') issues.push({ code: 'license', message: `${driver.name}'s driving licence expired on ${dayjs(driver.licenseExpiry).format('DD MMM YYYY')}.` })
  if (lic.state === 'Missing') issues.push({ code: 'license', message: `${driver.name} has no valid licence expiry on record.` })
  // Phase 5 VMS: required driver documents (critical expiry always blocks; warning level per Admin settings)
  issues.push(...driverComplianceIssues(driver, dispatchDate ? dayjs(dispatchDate) : dayjs()))
  return issues
}

/** Recompute driver availability and vehicle status after dispatches change (pure). */
export const syncFleet = (dispatches, drivers = getDrivers(), vehicles = storage.getItem(K.VEHICLES, []) || []) => ({
  drivers: drivers.map((d) => {
    const availability = deriveDriverAvailability(d, dispatches)
    return availability === d.availability ? d : { ...d, availability, updatedAt: new Date().toISOString() }
  }),
  vehicles: vehicles.map((v) => {
    const status = deriveVehicleStatus(v, dispatches)
    return status === v.status ? v : { ...v, status, updatedAt: new Date().toISOString() }
  }),
})

/** Delivery performance from delivery records. */
export const getDriverPerformance = (driverId, deliveries = storage.getItem(K.DELIVERIES, []) || [], dispatches = storage.getItem(K.DISPATCHES, []) || []) => {
  const mine = deliveries.filter((d) => d.driverId === driverId && d.status !== 'CANCELLED')
  const delivered = mine.filter((d) => d.status === 'DELIVERED').length
  const partial = mine.filter((d) => d.status === 'PARTIALLY_DELIVERED').length
  const failed = mine.filter((d) => ['FAILED', 'RETURNED'].includes(d.status)).length
  const closed = delivered + partial + failed
  const D = Object.fromEntries(dispatches.map((d) => [d.id, d]))
  const onTime = mine.filter((d) => d.completedAt && D[d.dispatchId] && dayjs(d.completedAt).format('YYYY-MM-DD') <= D[d.dispatchId].dispatchDate).length
  return {
    stops: mine.length,
    delivered,
    partial,
    failed,
    pending: mine.length - closed,
    closed,
    successRate: closed ? ((delivered + partial) / closed) * 100 : 0,
    onTimeRate: delivered + partial ? (onTime / (delivered + partial)) * 100 : 0,
    dispatches: dispatches.filter((d) => d.driverId === driverId && d.status !== 'CANCELLED').length,
  }
}

export const searchDrivers = (q, f = {}, list = getDrivers()) => {
  const query = (q || '').trim().toLowerCase()
  return list.filter((d) => {
    if (query && ![d.code, d.name, d.employeeNumber, d.mobile, d.licenseNumber, d.email].some((v) => String(v || '').toLowerCase().includes(query))) return false
    if (f.hubId && d.hubId !== f.hubId) return false
    if (f.zoneId && d.zoneId !== f.zoneId) return false
    if (f.availability && d.availability !== f.availability) return false
    if (f.status && d.status !== f.status) return false
    if (f.license && licenseState(d).state !== f.license) return false
    return true
  })
}

const driverService = { getDrivers, getDriverById, getDriverForUser, createDriver, updateDriver, deleteDriver, getDriverDeleteBlockers, driverAssignmentIssues, licenseState, getDriverPerformance, searchDrivers, syncFleet }
export default driverService
