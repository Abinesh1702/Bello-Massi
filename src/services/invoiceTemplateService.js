/**
 * Invoice templates (Phase 5). Editing a template bumps its version; issued invoices keep the snapshot
 * they were issued with, so template changes never alter old invoices.
 */
import storage from './storageService'
import { getCurrentUser } from './authService'
import { logActivity } from './activityService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { FONTS, FOOTER_LAYOUTS, HEADER_LAYOUTS, INVOICE_FIELDS, NUMBER_FORMATS, PAGE_FORMATS, CURRENCIES } from '../config/invoiceConfig'
import { clean, isEmail, isGst, isPan, required } from './validation'

export const getTemplates = () => storage.getItem(K.INVOICE_TEMPLATES, []) || []
export const getTemplateById = (id, list = getTemplates()) => list.find((t) => t.id === id) || null
export const getDefaultTemplate = (list = getTemplates()) => list.find((t) => t.isDefault && t.active) || list.find((t) => t.active) || null

export const emptyTemplate = () => {
  const base = getDefaultTemplate() || getTemplates()[0]
  return {
    ...(base ? JSON.parse(JSON.stringify(base)) : {}),
    id: undefined, name: '', code: '', isDefault: false, active: true, version: 1,
    fields: base?.fields || INVOICE_FIELDS.map((f) => ({ key: f.key, visible: true })),
  }
}

const HEX = /^#[0-9a-f]{6}$/i

export const validateTemplate = (t, { id = null } = {}) => {
  const e = {}
  const set = (f, m) => { if (m && !e[f]) e[f] = m }
  const list = getTemplates()
  set('name', required(t.name, 'Template name'))
  set('code', required(t.code, 'Template code'))
  if (t.code && !/^[A-Z0-9_-]{2,12}$/i.test(clean(t.code))) set('code', 'Use 2–12 letters, numbers, dashes or underscores.')
  if (t.code && list.some((x) => x.id !== id && x.code.toLowerCase() === clean(t.code).toLowerCase())) set('code', 'This template code is already used.')
  set('companyName', required(t.company?.name, 'Company name'))
  set('companyAddress', required(t.company?.address, 'Company address'))
  if (t.company?.gstNumber && !isGst(t.company.gstNumber)) set('companyGst', 'Enter a valid 15-character GSTIN.')
  if (t.company?.panNumber && !isPan(t.company.panNumber)) set('companyPan', 'Enter a valid PAN, e.g. AABCB1234C.')
  if (t.company?.email && !isEmail(t.company.email)) set('companyEmail', 'Enter a valid email address.')
  set('invoiceTitle', required(t.invoiceTitle, 'Invoice title'))
  if (!PAGE_FORMATS.some((p) => p.value === t.pageFormat)) set('pageFormat', 'Choose a page format.')
  if (t.pageFormat === 'CUSTOM') {
    const w = Number(t.customWidth); const h = Number(t.customHeight)
    if (!(w >= 100 && w <= 500)) set('customWidth', 'Width must be 100–500 mm.')
    if (!(h >= 100 && h <= 500)) set('customHeight', 'Height must be 100–500 mm.')
  }
  if (!FONTS.some((f) => f.value === t.font)) set('font', 'Choose a font.')
  const fs = Number(t.fontSize)
  if (!(fs >= 8 && fs <= 14)) set('fontSize', 'Font size must be 8–14 pt.')
  if (!HEX.test(t.primaryColor || '')) set('primaryColor', 'Use a hex colour like #232B5F.')
  if (!HEX.test(t.accentColor || '')) set('accentColor', 'Use a hex colour like #F5A623.')
  if (!HEADER_LAYOUTS.some((x) => x.value === t.headerLayout)) set('headerLayout', 'Choose a header layout.')
  if (!FOOTER_LAYOUTS.some((x) => x.value === t.footerLayout)) set('footerLayout', 'Choose a footer layout.')
  if (!CURRENCIES.some((x) => x.value === t.currency)) set('currency', 'Choose a currency.')
  if (!NUMBER_FORMATS.some((x) => x.value === t.numberFormat)) set('numberFormat', 'Choose a number format.')
  const keys = (t.fields || []).map((f) => f.key)
  if (INVOICE_FIELDS.some((f) => !keys.includes(f.key))) set('fields', 'The field list is incomplete.')
  if (INVOICE_FIELDS.filter((f) => f.locked).some((f) => !t.fields.find((x) => x.key === f.key)?.visible)) set('fields', 'Quantity and grand total must stay visible.')
  if (t.company?.logo && t.company.logo !== 'builtin' && !/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(t.company.logo)) set('logo', 'Upload a PNG, JPG, WebP or SVG logo.')
  if (t.company?.logo && t.company.logo.length > 280000) set('logo', 'Logo is too large — keep it under 200 KB.')
  return e
}

const guard = () => {
  const u = getCurrentUser()
  return can(u, 'invoices.templates') ? u : null
}
const persist = (list) => storage.setItem(K.INVOICE_TEMPLATES, list)
const normalise = (t) => ({
  ...t, name: clean(t.name), code: clean(t.code).toUpperCase(), invoiceTitle: clean(t.invoiceTitle),
  fontSize: Number(t.fontSize), customWidth: Number(t.customWidth) || 210, customHeight: Number(t.customHeight) || 297,
  company: Object.fromEntries(Object.entries(t.company || {}).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])),
})

export const saveTemplate = (input, { id = null } = {}) => {
  const user = guard()
  if (!user) return { ok: false, error: 'Only Admin or Finance can manage invoice templates.' }
  const errors = validateTemplate(input, { id })
  if (Object.keys(errors).length) return { ok: false, errors, error: Object.values(errors)[0] }
  const list = getTemplates()
  const now = new Date().toISOString()
  let record
  let next
  if (id) {
    const existing = getTemplateById(id, list)
    if (!existing) return { ok: false, error: 'This template no longer exists.' }
    record = { ...existing, ...normalise(input), id, isDefault: existing.isDefault, version: (existing.version || 1) + 1, updatedAt: now, updatedBy: user.id }
    if (record.isDefault && !record.active) return { ok: false, error: 'The default template cannot be deactivated. Make another template the default first.', errors: { active: 'Default template must stay active.' } }
    next = list.map((t) => (t.id === id ? record : t))
  } else {
    record = { ...normalise(input), id: uid('tpl'), isDefault: list.length === 0, version: 1, createdAt: now, updatedAt: now, createdBy: user.id }
    next = [...list, record]
  }
  const res = persist(next)
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'invoice', message: `${id ? 'updated' : 'created'} invoice template ${record.name}`, entityType: 'invoiceTemplate', entityId: record.id })
  return { ok: true, record }
}

export const duplicateTemplate = (id) => {
  const user = guard()
  if (!user) return { ok: false, error: 'Only Admin or Finance can manage invoice templates.' }
  const list = getTemplates()
  const src = getTemplateById(id, list)
  if (!src) return { ok: false, error: 'This template no longer exists.' }
  let n = 2
  while (list.some((t) => t.code === `${src.code}${n}`.slice(0, 12))) n += 1
  const now = new Date().toISOString()
  const record = { ...JSON.parse(JSON.stringify(src)), id: uid('tpl'), name: `${src.name} (copy)`, code: `${src.code}${n}`.slice(0, 12), isDefault: false, version: 1, createdAt: now, updatedAt: now, createdBy: user.id }
  const res = persist([...list, record])
  return res.ok ? { ok: true, record } : { ok: false, error: res.error }
}

export const setDefaultTemplate = (id) => {
  if (!guard()) return { ok: false, error: 'Only Admin or Finance can manage invoice templates.' }
  const list = getTemplates()
  const t = getTemplateById(id, list)
  if (!t) return { ok: false, error: 'This template no longer exists.' }
  if (!t.active) return { ok: false, error: 'Activate the template before making it the default.' }
  const res = persist(list.map((x) => ({ ...x, isDefault: x.id === id })))
  return res.ok ? { ok: true, record: { ...t, isDefault: true } } : { ok: false, error: res.error }
}

export const setTemplateActive = (id, active) => {
  if (!guard()) return { ok: false, error: 'Only Admin or Finance can manage invoice templates.' }
  const list = getTemplates()
  const t = getTemplateById(id, list)
  if (!t) return { ok: false, error: 'This template no longer exists.' }
  if (!active && t.isDefault) return { ok: false, error: 'The default template cannot be deactivated. Make another template the default first.' }
  const res = persist(list.map((x) => (x.id === id ? { ...x, active, updatedAt: new Date().toISOString() } : x)))
  return res.ok ? { ok: true } : { ok: false, error: res.error }
}

export default { getTemplates, getTemplateById, getDefaultTemplate, saveTemplate, duplicateTemplate, setDefaultTemplate, setTemplateActive, validateTemplate, emptyTemplate }
