/**
 * VMS compliance (Phase 5): expiry of vehicle / driver documents and the rules that block dispatch
 * assignment. Pure helpers take data as arguments so dashboards, reports and Phase 4 dispatch
 * validation all use the same calculation.
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { getCurrentUser } from './authService'
import { logActivity } from './activityService'
import { expiryState } from './documentService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { can } from '../config/permissions'
import { DEFAULT_VMS_SETTINGS, DRIVER_EXPIRY_FIELDS, EXPIRY_META, EXPIRY_STATE, VEHICLE_EXPIRY_FIELDS } from '../config/vmsConfig'

export const getVmsSettings = () => ({ ...DEFAULT_VMS_SETTINGS, ...(storage.getItem(K.VMS_SETTINGS, {}) || {}) })

export const saveVmsSettings = (input) => {
  const user = getCurrentUser()
  if (!can(user, 'vms.settings')) return { ok: false, error: 'Only the Admin can change compliance rules.' }
  const wd = Number(input.warningDays)
  if (!Number.isInteger(wd) || wd < 1 || wd > 90) return { ok: false, error: 'Warning window must be 1–90 days.', errors: { warningDays: 'Enter 1–90 days.' } }
  const next = {
    requiredVehicleDocs: [...new Set(input.requiredVehicleDocs || [])],
    requiredDriverDocs: [...new Set(input.requiredDriverDocs || [])],
    blockOnExpired: true, // critical expiry always blocks
    blockOnWarning: Boolean(input.blockOnWarning),
    blockOnMissing: Boolean(input.blockOnMissing),
    warningDays: wd,
  }
  const res = storage.setItem(K.VMS_SETTINGS, next)
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'vms', message: 'updated VMS compliance rules', entityType: 'vmsSettings', entityId: 'vms' })
  return { ok: true, record: next }
}

/** Every compliance date of a vehicle: [{ field, label, docCode, date, state, days, required }] */
export const vehicleCompliance = (vehicle, settings = getVmsSettings(), on = dayjs()) =>
  VEHICLE_EXPIRY_FIELDS.map((f) => ({ ...f, date: vehicle?.[f.field] || '', ...expiryState(vehicle?.[f.field], on), required: settings.requiredVehicleDocs.includes(f.docCode) }))

export const driverCompliance = (driver, settings = getVmsSettings(), on = dayjs()) =>
  DRIVER_EXPIRY_FIELDS.map((f) => ({ ...f, date: driver?.[f.field] || '', ...expiryState(driver?.[f.field], on), required: settings.requiredDriverDocs.includes(f.docCode) }))

/** Worst state among a list of compliance rows (for badges). */
export const worstState = (rows) => rows.filter((r) => r.state !== EXPIRY_STATE.MISSING || r.required).sort((a, b) => EXPIRY_META[a.state].rank - EXPIRY_META[b.state].rank)[0]?.state || EXPIRY_STATE.VALID

const issuesFrom = (rows, settings, name, on) => {
  const out = []
  const day = dayjs(on).format('DD MMM YYYY')
  rows.filter((r) => r.required).forEach((r) => {
    if (r.state === EXPIRY_STATE.EXPIRED) out.push({ code: 'doc-expired', level: 'critical', message: `${name}: ${r.label} expired on ${dayjs(r.date).format('DD MMM YYYY')}.` })
    else if (r.state === EXPIRY_STATE.MISSING && settings.blockOnMissing) out.push({ code: 'doc-missing', level: 'critical', message: `${name}: no ${r.label} expiry on record.` })
    else if (settings.blockOnWarning && r.days !== null && r.days <= settings.warningDays) out.push({ code: 'doc-expiring', level: 'warning', message: `${name}: ${r.label} expires ${r.days === 0 ? 'on' : 'within ' + settings.warningDays + ' days of'} ${day} (${dayjs(r.date).format('DD MMM YYYY')}).` })
  })
  return out
}

/** Compliance problems that block a vehicle on `on` (the dispatch date). */
export const vehicleComplianceIssues = (vehicle, on = dayjs(), settings = getVmsSettings()) =>
  vehicle ? issuesFrom(vehicleCompliance(vehicle, settings, on), settings, vehicle.vehicleNumber, on) : []

export const driverComplianceIssues = (driver, on = dayjs(), settings = getVmsSettings()) =>
  // An expired licence is already reported by driverAssignmentIssues (Phase 4) — avoid a duplicate message
  driver ? issuesFrom(driverCompliance(driver, settings, on).filter((r) => !(r.field === 'licenseExpiry' && r.state === EXPIRY_STATE.EXPIRED)), settings, driver.name, on) : []

/** Flat list of every tracked expiry (vehicles + drivers) for dashboards, alerts and reports. */
export const expiryRegister = ({ vehicles = storage.getItem(K.VEHICLES, []) || [], drivers = storage.getItem(K.DRIVERS, []) || [], settings = getVmsSettings(), on = dayjs() } = {}) => [
  ...vehicles.flatMap((v) => vehicleCompliance(v, settings, on).map((r) => ({ ...r, ownerType: 'vehicle', ownerId: v.id, ownerName: v.vehicleNumber, hubId: v.hubId, status: v.status }))),
  ...drivers.flatMap((d) => driverCompliance(d, settings, on).map((r) => ({ ...r, ownerType: 'driver', ownerId: d.id, ownerName: d.name, hubId: d.hubId, status: d.status }))),
]

export const countByState = (rows) => Object.fromEntries(Object.keys(EXPIRY_META).map((k) => [k, rows.filter((r) => r.state === k).length]))

export default { getVmsSettings, saveVmsSettings, vehicleCompliance, driverCompliance, vehicleComplianceIssues, driverComplianceIssues, expiryRegister, countByState, worstState }
