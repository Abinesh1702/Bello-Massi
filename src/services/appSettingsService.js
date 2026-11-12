/**
 * Application settings — stored in bellomassi_settings.application.<section> (UI preferences such as the sidebar
 * state stay at the top level of the same key). Company identity (country, base currency, timezone) lives in
 * bellomassi_company and is edited from Organization › Company or the Localization / Currency sections.
 *
 * applyRuntimeConfig() copies the values that low-level helpers need into config/runtimeConfig.js
 * (formatters, number generators), on start-up and after every change.
 */
import storage from './storageService'
import { STORAGE_KEYS } from '../utils/constants'
import { can } from '../config/permissions'
import { DEFAULT_NUMBERING, ORG_DEFAULTS, setRuntimeConfig } from '../config/runtimeConfig'
import { isPlainObject } from '../utils/helpers'

const K = STORAGE_KEYS

export const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'company', label: 'Company' },
  { id: 'localization', label: 'Localization' },
  { id: 'currency', label: 'Currency' },
  { id: 'numbering', label: 'Numbering' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'approval', label: 'Approval Settings' },
  { id: 'inventory', label: 'Inventory Settings' },
  { id: 'warehouse', label: 'Warehouse Settings' },
  { id: 'coldChain', label: 'Cold Chain Settings' },
  { id: 'integration', label: 'Integration Settings' },
  { id: 'ai', label: 'AI Settings' },
]

export const DEFAULT_APP_SETTINGS = Object.freeze({
  general: { applicationName: 'Bellomassi', supportEmail: 'support@bellomassi.demo', defaultPageSize: 10, showPrototypeBadge: true },
  localization: { numberLocale: ORG_DEFAULTS.numberLocale, dateFormat: ORG_DEFAULTS.dateFormat, timeFormat: ORG_DEFAULTS.timeFormat, weekStartsOn: 'monday' },
  currency: { currencyDisplay: 'symbol', decimals: 2, compactStyle: 'international' },
  numbering: { ...DEFAULT_NUMBERING },
  notifications: { disabledCategories: [], allowUserMuting: true, maxStored: 400 },
  security: { sessionTimeoutMinutes: 60, maxFailedAttempts: 5, lockoutMinutes: 15, passwordMinLength: 8, requireMixedPassword: true, resetCodeMinutes: 15, forcePasswordChangeAfterReset: true },
  approval: { requireApprovalRemarks: false, blockWhenCreditExceeded: false, rejectionRemarksMinLength: 5 },
  inventory: { defaultMinimumStock: 10, defaultReorderLevel: 20, defaultMaximumStock: 200, expiryWarningDays: 30 },
  warehouse: { defaultReceivingHubId: '', pickingStrategy: 'FEFO', putawayConfirmation: true, qaHoldOnReceipt: false },
  coldChain: { frozenMin: -25, frozenMax: -18, chilledMin: 0, chilledMax: 4, excursionToleranceMinutes: 30, loggingIntervalMinutes: 15 },
  integration: { erpSystem: 'Not connected', erpNotes: '' },
  ai: { aiFeaturesEnabled: true, jarvisFloatingButton: true },
})

export const OPTIONS = {
  numberLocale: [
    { value: 'en-AE', label: 'English (UAE) — 123,456.78' },
    { value: 'ar-AE', label: 'Arabic (UAE) — ١٢٣٬٤٥٦٫٧٨' },
    { value: 'en-GB', label: 'English (UK) — 123,456.78' },
    { value: 'en-US', label: 'English (US) — 123,456.78' },
    { value: 'en-IN', label: 'English (India) — 1,23,456.78' },
  ],
  dateFormat: [
    { value: 'DD MMM YYYY', label: '11 Nov 2026' },
    { value: 'DD/MM/YYYY', label: '11/11/2026' },
    { value: 'MM/DD/YYYY', label: '11/11/2026 (US)' },
    { value: 'YYYY-MM-DD', label: '2026-11-11 (ISO)' },
    { value: 'D MMMM YYYY', label: '11 November 2026' },
  ],
  timeFormat: [{ value: 'h:mm A', label: '12-hour (2:30 PM)' }, { value: 'HH:mm', label: '24-hour (14:30)' }],
  weekStartsOn: [{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }, { value: 'saturday', label: 'Saturday' }],
  currency: [
    { value: 'AED', label: 'AED — UAE Dirham' }, { value: 'SAR', label: 'SAR — Saudi Riyal' }, { value: 'OMR', label: 'OMR — Omani Rial' },
    { value: 'QAR', label: 'QAR — Qatari Riyal' }, { value: 'KWD', label: 'KWD — Kuwaiti Dinar' }, { value: 'BHD', label: 'BHD — Bahraini Dinar' },
    { value: 'INR', label: 'INR — Indian Rupee' }, { value: 'USD', label: 'USD — US Dollar' }, { value: 'EUR', label: 'EUR — Euro' }, { value: 'GBP', label: 'GBP — Pound Sterling' },
  ],
  timezone: [
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST, UTC+4)' }, { value: 'Asia/Riyadh', label: 'Asia/Riyadh (UTC+3)' }, { value: 'Asia/Muscat', label: 'Asia/Muscat (UTC+4)' },
    { value: 'Asia/Qatar', label: 'Asia/Qatar (UTC+3)' }, { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)' }, { value: 'Europe/London', label: 'Europe/London' }, { value: 'UTC', label: 'UTC' },
  ],
  country: ['United Arab Emirates', 'Saudi Arabia', 'Oman', 'Qatar', 'Kuwait', 'Bahrain', 'India', 'United Kingdom', 'United States'],
  currencyDisplay: [{ value: 'symbol', label: 'Symbol / local code (AED 1,250.00)' }, { value: 'code', label: 'ISO code (AED 1,250.00)' }],
  compactStyle: [{ value: 'international', label: 'International — K / M / B' }, { value: 'indian', label: 'Indian — Lakh / Crore' }],
  pickingStrategy: [{ value: 'FEFO', label: 'FEFO — first expiry, first out' }, { value: 'FIFO', label: 'FIFO — first in, first out' }],
  erpSystem: ['Not connected', 'SAP Business One', 'SAP S/4HANA', 'Oracle NetSuite', 'Microsoft Dynamics 365', 'Odoo', 'Other'],
}

/* ---------- Read ---------- */

const rawSettings = () => storage.getItem(K.SETTINGS, {}) || {}

export const mergeAppSettings = (app) => Object.fromEntries(Object.entries(DEFAULT_APP_SETTINGS).map(([sec, def]) => [sec, { ...def, ...(isPlainObject(app?.[sec]) ? app[sec] : {}) }]))

export const getAppSettings = (raw = rawSettings()) => mergeAppSettings(raw.application)
export const getSection = (section, raw) => getAppSettings(raw)[section]
export const getCompany = () => storage.getItem(K.COMPANY, null)

/* ---------- Validation ---------- */

const int = (v) => Number.isInteger(Number(v)) && String(v).trim() !== ''
const PREFIX = /^[A-Z0-9][A-Z0-9-]{0,11}$/

export const validateSection = (section, v) => {
  const e = {}
  const range = (k, min, max, label) => { if (!int(v[k]) || Number(v[k]) < min || Number(v[k]) > max) e[k] = `${label} must be a whole number between ${min} and ${max}.` }
  switch (section) {
    case 'general':
      if (String(v.applicationName || '').trim().length < 2) e.applicationName = 'Enter an application name.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v.supportEmail || '').trim())) e.supportEmail = 'Enter a valid support email.'
      if (![10, 25, 50].includes(Number(v.defaultPageSize))) e.defaultPageSize = 'Choose 10, 25 or 50.'
      break
    case 'localization':
      if (!OPTIONS.numberLocale.some((o) => o.value === v.numberLocale)) e.numberLocale = 'Choose a number format.'
      if (!String(v.dateFormat || '').trim() || !/[DY]/.test(v.dateFormat)) e.dateFormat = 'Choose or enter a date format containing day and year tokens.'
      if (!OPTIONS.timeFormat.some((o) => o.value === v.timeFormat)) e.timeFormat = 'Choose a time format.'
      if (!OPTIONS.timezone.some((o) => o.value === v.timezone)) e.timezone = 'Choose a timezone.'
      if (!OPTIONS.country.includes(v.country)) e.country = 'Choose a country.'
      break
    case 'currency':
      if (!OPTIONS.currency.some((o) => o.value === v.currency)) e.currency = 'Choose a base currency.'
      if (![0, 2, 3].includes(Number(v.decimals))) e.decimals = 'Choose 0, 2 or 3 decimals.'
      if (!OPTIONS.compactStyle.some((o) => o.value === v.compactStyle)) e.compactStyle = 'Choose a compact style.'
      break
    case 'numbering': {
      Object.keys(DEFAULT_NUMBERING).forEach((k) => { if (!PREFIX.test(String(v[k] || ''))) e[k] = 'Use 1–12 capital letters, digits or dashes.' })
      const seen = {}
      Object.keys(DEFAULT_NUMBERING).forEach((k) => {
        const p = String(v[k] || '')
        if (seen[p] && !e[k]) e[k] = `Already used for ${seen[p]}. Each document type needs its own prefix.`
        seen[p] = k
      })
      break
    }
    case 'notifications':
      range('maxStored', 100, 1000, 'Stored notifications')
      break
    case 'security':
      range('sessionTimeoutMinutes', 5, 1440, 'Session timeout')
      range('maxFailedAttempts', 3, 20, 'Failed attempts')
      range('lockoutMinutes', 1, 1440, 'Lockout duration')
      range('passwordMinLength', 6, 32, 'Minimum password length')
      range('resetCodeMinutes', 5, 120, 'Reset code validity')
      break
    case 'approval':
      range('rejectionRemarksMinLength', 1, 200, 'Minimum rejection remarks')
      break
    case 'inventory':
      range('defaultReorderLevel', 0, 100000, 'Default reorder level')
      range('defaultMaximumStock', 1, 1000000, 'Default maximum stock')
      if (!e.defaultReorderLevel && !e.defaultMaximumStock && Number(v.defaultMaximumStock) <= Number(v.defaultReorderLevel)) e.defaultMaximumStock = 'Maximum stock must be above the reorder level.'
      range('defaultMinimumStock', 0, 100000, 'Default minimum stock')
      if (!e.defaultMinimumStock && !e.defaultReorderLevel && Number(v.defaultMinimumStock) > Number(v.defaultReorderLevel)) e.defaultMinimumStock = 'Minimum stock cannot be above the reorder level.'
      range('expiryWarningDays', 1, 365, 'Expiry warning')
      break
    case 'warehouse':
      if (!OPTIONS.pickingStrategy.some((o) => o.value === v.pickingStrategy)) e.pickingStrategy = 'Choose a picking strategy.'
      break
    case 'coldChain': {
      ;['frozenMin', 'frozenMax', 'chilledMin', 'chilledMax'].forEach((k) => { if (!Number.isFinite(Number(v[k])) || String(v[k]).trim() === '') e[k] = 'Enter a temperature.' })
      if (!e.frozenMin && !e.frozenMax && Number(v.frozenMin) >= Number(v.frozenMax)) e.frozenMax = 'Maximum must be above the minimum.'
      if (!e.chilledMin && !e.chilledMax && Number(v.chilledMin) >= Number(v.chilledMax)) e.chilledMax = 'Maximum must be above the minimum.'
      if (!e.frozenMax && !e.chilledMin && Number(v.frozenMax) >= Number(v.chilledMin)) e.frozenMax = 'Frozen range must be colder than the chilled range.'
      range('excursionToleranceMinutes', 0, 720, 'Excursion tolerance')
      range('loggingIntervalMinutes', 1, 240, 'Logging interval')
      break
    }
    case 'integration':
      if (!OPTIONS.erpSystem.includes(v.erpSystem)) e.erpSystem = 'Choose an ERP system.'
      if (String(v.erpNotes || '').length > 500) e.erpNotes = 'Use 500 characters or fewer.'
      break
    default:
  }
  return e
}

const NUMERIC = {
  general: ['defaultPageSize'], currency: ['decimals'], notifications: ['maxStored'],
  security: ['sessionTimeoutMinutes', 'maxFailedAttempts', 'lockoutMinutes', 'passwordMinLength', 'resetCodeMinutes'],
  approval: ['rejectionRemarksMinLength'], inventory: ['defaultMinimumStock', 'defaultReorderLevel', 'defaultMaximumStock', 'expiryWarningDays'],
  coldChain: ['frozenMin', 'frozenMax', 'chilledMin', 'chilledMax', 'excursionToleranceMinutes', 'loggingIntervalMinutes'],
}
const normalise = (section, v) => {
  const out = { ...v }
  ;(NUMERIC[section] || []).forEach((k) => { out[k] = Number(out[k]) })
  if (section === 'numbering') Object.keys(out).forEach((k) => { out[k] = String(out[k]).trim().toUpperCase() })
  return out
}

/* Company-owned fields edited from the Localization / Currency sections. */
const COMPANY_FIELDS = { localization: ['timezone', 'country'], currency: ['currency'] }

/** The editable values of a section, including company-owned fields. */
export const getSectionValues = (section) => {
  const s = getSection(section) || {}
  const company = getCompany() || {}
  const extra = Object.fromEntries((COMPANY_FIELDS[section] || []).map((k) => [k, company[k] ?? ORG_DEFAULTS[k]]))
  return { ...s, ...extra }
}

const deny = (msg, errors) => ({ ok: false, error: msg, errors: errors || { form: msg } })
const actor = () => {
  const s = storage.getItem(K.SESSION, null, { scope: 'local' }) || storage.getItem(K.SESSION, null, { scope: 'session' })
  return s ? (storage.getItem(K.DEMO_USERS, []) || []).find((u) => u.id === s.userId) || null : null
}

/** Save one section (validated, permission-checked). Company-owned fields are written to bellomassi_company. */
export const saveSection = (section, values) => {
  if (!can(actor(), 'settings.manage')) return deny('You do not have permission to change application settings.')
  if (!DEFAULT_APP_SETTINGS[section]) return deny('Unknown settings section.')
  const errors = validateSection(section, values)
  if (Object.keys(errors).length) return deny('Please fix the highlighted fields.', errors)
  const own = COMPANY_FIELDS[section] || []
  const clean = normalise(section, Object.fromEntries(Object.entries(values).filter(([k]) => !own.includes(k) && k in DEFAULT_APP_SETTINGS[section])))
  const writes = [[K.SETTINGS, { ...rawSettings(), application: { ...(rawSettings().application || {}), [section]: clean } }]]
  if (own.length) {
    const company = getCompany() || {}
    const patch = Object.fromEntries(own.map((k) => [k, values[k]]))
    if (own.some((k) => company[k] !== patch[k])) {
      const countryCode = section === 'localization' ? { 'United Arab Emirates': 'AE', 'Saudi Arabia': 'SA', Oman: 'OM', Qatar: 'QA', Kuwait: 'KW', Bahrain: 'BH', India: 'IN', 'United Kingdom': 'GB', 'United States': 'US' }[values.country] : company.countryCode
      writes.push([K.COMPANY, { ...company, ...patch, countryCode: countryCode || company.countryCode, updatedAt: new Date().toISOString() }])
    }
  }
  const res = storage.transaction(writes)
  if (!res.ok) return deny(res.error)
  applyRuntimeConfig()
  return { ok: true }
}

/** Restore one section to its defaults (company-owned fields go back to the organisation defaults too). */
export const resetSection = (section) => {
  if (!DEFAULT_APP_SETTINGS[section]) return deny('Unknown settings section.')
  const defaults = { ...DEFAULT_APP_SETTINGS[section], ...Object.fromEntries((COMPANY_FIELDS[section] || []).map((k) => [k, ORG_DEFAULTS[k]])) }
  return saveSection(section, defaults)
}

/* ---------- Runtime wiring ---------- */

export const applyRuntimeConfig = () => {
  const app = getAppSettings()
  const company = getCompany() || {}
  setRuntimeConfig({
    locale: {
      currency: company.currency || ORG_DEFAULTS.currency,
      timezone: company.timezone || ORG_DEFAULTS.timezone,
      numberLocale: app.localization.numberLocale,
      dateFormat: app.localization.dateFormat,
      timeFormat: app.localization.timeFormat,
      currencyDisplay: app.currency.currencyDisplay,
      decimals: Number(app.currency.decimals),
      compactStyle: app.currency.compactStyle,
    },
    numbering: app.numbering,
    ui: {
      applicationName: app.general.applicationName, defaultPageSize: Number(app.general.defaultPageSize), showPrototypeBadge: app.general.showPrototypeBadge,
      supportEmail: app.general.supportEmail, aiFeaturesEnabled: app.ai.aiFeaturesEnabled, jarvisFloatingButton: app.ai.jarvisFloatingButton,
    },
    security: app.security,
    approval: app.approval,
    notifications: app.notifications,
    inventory: app.inventory,
    warehouse: { defaultReceivingHubId: app.warehouse.defaultReceivingHubId },
  })
}

let lastSig = ''
const signature = () => {
  const c = getCompany() || {}
  return JSON.stringify([rawSettings().application || null, c.currency, c.timezone])
}

/** Start-up: apply once and re-apply whenever settings or company change (other tabs, imports, resets). */
export const initRuntimeConfig = () => {
  applyRuntimeConfig()
  lastSig = signature()
  storage.subscribe((key) => {
    if (key !== '*' && key !== K.SETTINGS && key !== K.COMPANY) return
    const sig = signature()
    if (sig === lastSig) return
    lastSig = sig
    applyRuntimeConfig()
  })
}

const appSettingsService = { getAppSettings, getSection, getSectionValues, saveSection, resetSection, validateSection, applyRuntimeConfig, initRuntimeConfig, SETTINGS_SECTIONS, DEFAULT_APP_SETTINGS, OPTIONS }
export default appSettingsService
