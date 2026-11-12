/**
 * Supplier directory. Suppliers live in the forecast / planning settings (bellomassi_forecast_settings.suppliers)
 * because replenishment planning uses their lead times and minimum order values. Edits check suppliers.manage.
 */
import storage from './storageService'
import { STORAGE_KEYS } from '../utils/constants'
import { can } from '../config/permissions'
import { getCurrentUser } from './authService'
import { isValidEmail } from '../utils/helpers'

const K = STORAGE_KEYS

export const getSuppliers = () => storage.getItem(K.FORECAST_SETTINGS, null)?.suppliers || []

export const saveSupplier = (id, values) => {
  if (!can(getCurrentUser(), 'suppliers.manage')) return { ok: false, error: 'You do not have permission to edit suppliers.' }
  const fs = storage.getItem(K.FORECAST_SETTINGS, null)
  const existing = (fs?.suppliers || []).find((s) => s.id === id)
  if (!existing) return { ok: false, error: 'This supplier no longer exists.' }
  const e = {}
  const name = String(values.name || '').trim()
  const lead = Number(values.leadTimeDays)
  const mov = Number(values.minOrderValue || 0)
  if (name.length < 2) e.name = 'Enter the supplier name.'
  else if (fs.suppliers.some((s) => s.id !== id && s.name.toLowerCase() === name.toLowerCase())) e.name = 'Another supplier has this name.'
  if (!Number.isInteger(lead) || lead < 1 || lead > 180) e.leadTimeDays = 'Enter 1–180 days.'
  if (!Number.isFinite(mov) || mov < 0) e.minOrderValue = 'Enter 0 or more.'
  if (values.contactEmail && !isValidEmail(values.contactEmail)) e.contactEmail = 'Enter a valid email address.'
  if (values.contactPhone && !/^[+\d][\d\s-]{6,19}$/.test(String(values.contactPhone).trim())) e.contactPhone = 'Enter a valid phone number.'
  if (Object.keys(e).length) return { ok: false, errors: e, error: 'Please fix the highlighted fields.' }
  const record = { ...existing, name, leadTimeDays: lead, minOrderValue: mov, contactEmail: String(values.contactEmail || '').trim(), contactPhone: String(values.contactPhone || '').trim() }
  const res = storage.setItem(K.FORECAST_SETTINGS, { ...fs, suppliers: fs.suppliers.map((s) => (s.id === id ? record : s)) })
  return res.ok ? { ok: true, record } : { ok: false, error: res.error }
}

export default { getSuppliers, saveSupplier }
