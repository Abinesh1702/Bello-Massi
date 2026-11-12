/**
 * Display formatters. Currency, number locale, timezone and date/time formats come from the organisation's
 * localization settings (config/runtimeConfig.js, filled from Application Settings) — never hardcoded here.
 * Amounts are displayed in the configured base currency; no exchange-rate conversion is applied.
 */
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { getLocaleConfig, getRuntimeVersion } from '../config/runtimeConfig'

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

/* Intl formatters are cached per configuration version. */
let cacheVersion = -1
const cache = new Map()
const fmt = (id, build) => {
  const v = getRuntimeVersion()
  if (v !== cacheVersion) { cache.clear(); cacheVersion = v }
  if (!cache.has(id)) {
    try { cache.set(id, build(getLocaleConfig())) } catch { cache.set(id, build({ ...getLocaleConfig(), numberLocale: 'en-US' })) }
  }
  return cache.get(id)
}

const currencyOpts = (c) => ({ style: 'currency', currency: c.currency || 'AED', currencyDisplay: c.currencyDisplay === 'code' ? 'code' : 'symbol' })


/** Whole-unit currency (KPI tables). */
export const formatCurrency = (value) => fmt('cur0', (c) => new Intl.NumberFormat(c.numberLocale, { ...currencyOpts(c), maximumFractionDigits: 0 })).format(Number(value) || 0)

/** Exact amounts with the configured decimals (order screens). */
export const formatMoney = (value) => fmt('money', (c) => {
  const d = Number.isInteger(c.decimals) ? c.decimals : 2
  return new Intl.NumberFormat(c.numberLocale, { ...currencyOpts(c), minimumFractionDigits: d, maximumFractionDigits: d })
}).format(Number(value) || 0)

/** Compact amounts for KPI cards: AED 1.2M (international) or ₹12.4 L (Indian lakh/crore style). */
export const formatCompactCurrency = (value) => {
  const n = Number(value) || 0
  const c = getLocaleConfig()
  if (c.compactStyle === 'indian') {
    const sym = currencySymbol()
    if (Math.abs(n) >= 1e7) return `${sym}${(n / 1e7).toFixed(2)} Cr`
    if (Math.abs(n) >= 1e5) return `${sym}${(n / 1e5).toFixed(1)} L`
    return formatCurrency(n)
  }
  if (Math.abs(n) < 1e4) return formatCurrency(n)
  return fmt('curCompact', (cc) => new Intl.NumberFormat(cc.numberLocale, { ...currencyOpts(cc), notation: 'compact', maximumFractionDigits: 1 })).format(n)
}

/** Currency symbol / code as displayed, e.g. "AED". */
export const currencySymbol = () => {
  const parts = fmt('curParts', (c) => new Intl.NumberFormat(c.numberLocale, currencyOpts(c))).formatToParts(0)
  return parts.find((p) => p.type === 'currency')?.value || getLocaleConfig().currency
}

export const formatNumber = (value) => fmt('num', (c) => new Intl.NumberFormat(c.numberLocale)).format(Number(value) || 0)
export const formatCompact = (value) => fmt('compact', (c) => new Intl.NumberFormat(c.numberLocale, { notation: 'compact', maximumFractionDigits: 1 })).format(Number(value) || 0)

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
/** Timestamps are shown in the organisation timezone; plain calendar dates are never shifted. */
export const toOrgTime = (value) => {
  if (DATE_ONLY.test(String(value))) return dayjs(value)
  const d = dayjs(value)
  try { return d.tz(getLocaleConfig().timezone) } catch { return d }
}

export const getDateFormat = () => getLocaleConfig().dateFormat || 'DD MMM YYYY'
export const getTimeFormat = () => getLocaleConfig().timeFormat || 'h:mm A'

export const formatDate = (value, pattern) => (value ? toOrgTime(value).format(pattern || getDateFormat()) : '—')
export const formatDateTime = (value) => (value ? toOrgTime(value).format(`${getDateFormat()}, ${getTimeFormat()}`) : '—')
export const formatTime = (value) => (value ? toOrgTime(value).format(getTimeFormat()) : '—')
export const formatRelative = (value) => (value ? dayjs(value).fromNow() : '—')

export const formatPercent = (value, digits = 0) => `${(Number(value) || 0).toFixed(digits)}%`

export const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`
}

export const getInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?'
