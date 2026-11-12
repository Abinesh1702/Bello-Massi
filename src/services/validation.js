/** Shared field validators (Indian formats). Each returns an error message or null. */
export const clean = (v) => (typeof v === 'string' ? v.trim() : v)

export const required = (v, label) => (v === undefined || v === null || String(v).trim() === '' ? `${label} is required.` : null)

export const isMobile = (v) => /^(\+91|91|0)?[6-9]\d{9}$/.test(String(v || '').replace(/[\s-]/g, ''))
export const isPhone = (v) => /^\+?\d{8,13}$/.test(String(v || '').replace(/[\s-]/g, ''))
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim())
export const isPincode = (v) => /^[1-9]\d{5}$/.test(String(v || '').trim())
export const isPan = (v) => /^[A-Z]{5}\d{4}[A-Z]$/.test(String(v || '').trim().toUpperCase())
export const isGst = (v) => /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(String(v || '').trim().toUpperCase())
export const isIsoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !Number.isNaN(new Date(v).getTime())

/** Parse a number input; returns NaN for empty/invalid. */
export const num = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v))

export const nonNegative = (v, label, { requiredField = true } = {}) => {
  const n = num(v)
  if (Number.isNaN(n)) return requiredField ? `${label} is required.` : null
  if (n < 0) return `${label} cannot be negative.`
  return null
}

/** Next document number: PREFIX-YYYY-NNNN based on the highest existing suffix. */
export const nextNumber = (prefix, existing, pad = 4) => {
  const year = new Date().getFullYear()
  const max = existing.reduce((m, v) => {
    const match = String(v || '').match(/(\d+)$/)
    return match ? Math.max(m, Number(match[1])) : m
  }, 0)
  return `${prefix}-${year}-${String(max + 1).padStart(pad, '0')}`
}

export const nextCode = (prefix, existing, pad = 3) => {
  const max = existing.reduce((m, v) => {
    const match = String(v || '').match(/(\d+)$/)
    return match ? Math.max(m, Number(match[1])) : m
  }, 0)
  return `${prefix}-${String(max + 1).padStart(pad, '0')}`
}
