/**
 * In-memory copy of the configuration that low-level helpers need (formatters, number generators).
 * services/appSettingsService.js fills it from bellomassi_company + bellomassi_settings on start-up and
 * whenever those keys change, so formatters never import storage (no import cycles) and nothing hardcodes
 * the currency, locale, timezone or date format.
 *
 * The defaults below are the organisation defaults for a fresh install (United Arab Emirates).
 */

export const ORG_DEFAULTS = Object.freeze({
  country: 'United Arab Emirates',
  countryCode: 'AE',
  currency: 'AED',
  timezone: 'Asia/Dubai',
  numberLocale: 'en-AE',
  dateFormat: 'DD MMM YYYY',
  timeFormat: 'h:mm A',
})

export const DEFAULT_NUMBERING = Object.freeze({
  order: 'BM-ORD',
  dispatch: 'BM-DSP',
  deliveryNote: 'BM-DN',
  replenishment: 'RPL',
  forecast: 'FC',
  employee: 'EMP',
})

const initial = () => ({
  locale: {
    currency: ORG_DEFAULTS.currency,
    numberLocale: ORG_DEFAULTS.numberLocale,
    timezone: ORG_DEFAULTS.timezone,
    dateFormat: ORG_DEFAULTS.dateFormat,
    timeFormat: ORG_DEFAULTS.timeFormat,
    currencyDisplay: 'symbol', // 'symbol' | 'code'
    decimals: 2,
    compactStyle: 'international', // 'international' (K/M) | 'indian' (L/Cr)
  },
  numbering: { ...DEFAULT_NUMBERING },
  ui: { applicationName: 'Bellomassi', defaultPageSize: 10, showPrototypeBadge: true, aiFeaturesEnabled: true, jarvisFloatingButton: true, supportEmail: 'support@bellomassi.demo' },
  security: { sessionTimeoutMinutes: 60, maxFailedAttempts: 5, lockoutMinutes: 15, passwordMinLength: 8, requireMixedPassword: true, resetCodeMinutes: 15, forcePasswordChangeAfterReset: true },
  approval: { requireApprovalRemarks: false, blockWhenCreditExceeded: false, rejectionRemarksMinLength: 5 },
  notifications: { disabledCategories: [], allowUserMuting: true, maxStored: 400 },
  inventory: { defaultMinimumStock: 10, defaultReorderLevel: 20, defaultMaximumStock: 200, expiryWarningDays: 30 },
  warehouse: { defaultReceivingHubId: '' },
})

let state = initial()
let version = 0
const listeners = new Set()

export const getRuntimeVersion = () => version
export const getLocaleConfig = () => state.locale
export const getNumberingPrefix = (type) => state.numbering[type] || DEFAULT_NUMBERING[type] || type.toUpperCase()
export const getUiConfig = () => state.ui
export const getSecurityConfig = () => state.security
export const getApprovalConfig = () => state.approval
export const getNotificationConfig = () => state.notifications
export const getInventoryConfig = () => state.inventory
export const getWarehouseConfig = () => state.warehouse

export const setRuntimeConfig = (patch) => {
  state = Object.fromEntries(Object.keys(state).map((k) => [k, { ...state[k], ...(patch[k] || {}) }]))
  version += 1
  listeners.forEach((fn) => fn(state))
}

export const subscribeRuntimeConfig = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
