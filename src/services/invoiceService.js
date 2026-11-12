/**
 * Invoices (Phase 5). An issued invoice is an immutable snapshot (template, customer, items, totals).
 * Generating an invoice never touches inventory, dispatch or delivery status. One active invoice per
 * order: a cancelled invoice keeps its number and frees the order for a new one.
 * Receivables: issuing adds the invoice total to the customer's outstanding balance (the figure the order credit
 * check uses); receipts and credit notes reduce it (Finance › Customer Receipts / Credit Notes); cancelling an
 * invoice without receipts or credit notes reverses it. Payment status comes from invoiceBalances().
 */
import { fireEvent } from './automationService'
import storage from './storageService'
import { getCurrentUser } from './authService'
import { logActivity } from './activityService'
import { pushNotification } from './notificationService'
import { getDefaultTemplate, getTemplateById } from './invoiceTemplateService'
import { validateInvoiceTotals } from './invoiceCalculationService'
import { buildInvoiceRecord, formatInvoiceNumber } from '../utils/invoiceSnapshot'
import { STORAGE_KEYS as K } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { ROLES } from '../config/roles'
import { DEFAULT_INVOICE_SETTINGS, INVOICEABLE_ORDER_STATUSES } from '../config/invoiceConfig'
import { clean, isIsoDate } from './validation'
import { postCustomerBalance } from './customerService'
import { invoiceBalances } from './enterprise/financeService'

const read = (key) => storage.getItem(key, []) || []
const deny = (error, errors) => ({ ok: false, error, errors: errors || { form: error } })

export const getInvoices = () => read(K.INVOICES)
export const getInvoiceById = (id, list = getInvoices()) => list.find((i) => i.id === id) || null
export const getActiveInvoiceForOrder = (orderId, list = getInvoices()) => list.find((i) => i.orderId === orderId && i.status === 'ISSUED') || null
export const getInvoiceSettings = () => ({ ...DEFAULT_INVOICE_SETTINGS, ...(storage.getItem(K.INVOICE_SETTINGS, {}) || {}) })

/** Next number without consuming it. Skips any number already used (never duplicates). */
export const peekNextInvoiceNumber = (settings = getInvoiceSettings(), invoices = getInvoices()) => {
  const used = new Set(invoices.map((i) => i.invoiceNumber))
  let n = Math.max(settings.lastNumber + 1, settings.startingNumber)
  while (used.has(formatInvoiceNumber(settings, n))) n += 1
  return { number: formatInvoiceNumber(settings, n), sequence: n }
}

export const saveInvoiceSettings = (input) => {
  const user = getCurrentUser()
  if (!can(user, 'invoices.templates')) return deny('Only Admin or Finance can change invoice numbering.')
  const current = getInvoiceSettings()
  const e = {}
  const prefix = clean(input.prefix || '').toUpperCase()
  if (!/^[A-Z0-9-]{1,12}$/.test(prefix)) e.prefix = 'Use 1–12 capital letters, numbers or dashes.'
  const digits = Number(input.digits)
  if (!Number.isInteger(digits) || digits < 3 || digits > 8) e.digits = 'Use 3–8 digits.'
  const start = Number(input.startingNumber)
  if (!Number.isInteger(start) || start < 1) e.startingNumber = 'Starting number must be 1 or more.'
  const year = Number(input.year)
  if (input.includeYear && (!Number.isInteger(year) || year < 2000 || year > 2100)) e.year = 'Enter a valid year.'
  if (Object.keys(e).length) return deny(Object.values(e)[0], e)
  const sameSeries = prefix === current.prefix && Boolean(input.includeYear) === current.includeYear && year === current.year
  const next = { prefix, includeYear: Boolean(input.includeYear), year, digits, startingNumber: start, lastNumber: sameSeries ? current.lastNumber : start - 1 }
  const preview = peekNextInvoiceNumber(next)
  const res = storage.setItem(K.INVOICE_SETTINGS, next)
  if (!res.ok) return deny(res.error)
  logActivity({ type: 'invoice', message: `updated invoice numbering (next ${preview.number})`, entityType: 'invoiceSettings', entityId: 'invoice' })
  return { ok: true, record: next, next: preview.number }
}

/** Orders an invoice can be raised for, with the reason when not. */
export const invoiceEligibility = (order, invoices = getInvoices()) => {
  if (!order) return 'Select a valid order.'
  if (!order.orderNumber) return 'Draft orders cannot be invoiced.'
  if (!INVOICEABLE_ORDER_STATUSES.includes(order.orderStatus)) return `${order.orderNumber} is ${order.orderStatus.toLowerCase().replace(/_/g, ' ')} — only approved orders can be invoiced.`
  const existing = getActiveInvoiceForOrder(order.id, invoices)
  if (existing) return `${order.orderNumber} already has invoice ${existing.invoiceNumber}. Cancel it first to issue a new one.`
  return null
}

const context = (order) => {
  const notes = read(K.DELIVERY_NOTES)
  const note = order.deliveryNoteId ? notes.find((n) => n.id === order.deliveryNoteId) : notes.filter((n) => n.orderId === order.id).sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1))[0]
  return {
    customer: read(K.CUSTOMERS).find((c) => c.id === order.customerId),
    products: read(K.PRODUCTS),
    hub: read(K.HUBS).find((h) => h.id === order.hubId),
    note: note || null,
    dispatch: note ? read(K.DISPATCHES).find((d) => d.id === note.dispatchId) : read(K.DISPATCHES).find((d) => d.id === order.dispatchId) || null,
  }
}

/** Build (but don't save) an invoice — used for the live preview. */
export const previewInvoice = (orderId, options = {}) => {
  const order = read(K.ORDERS).find((o) => o.id === orderId)
  if (!order) return null
  const template = getTemplateById(options.templateId) || getDefaultTemplate()
  if (!template) return null
  const ctx = context(order)
  const { number, sequence } = peekNextInvoiceNumber()
  return buildInvoiceRecord({ id: 'preview', invoiceNumber: number, sequence, order, ...ctx, template, options, user: getCurrentUser(), now: new Date().toISOString() })
}

export const validateInvoiceOptions = (options) => {
  const e = {}
  if (options.invoiceDate && !isIsoDate(options.invoiceDate)) e.invoiceDate = 'Enter a valid date.'
  if (options.dueDate && !isIsoDate(options.dueDate)) e.dueDate = 'Enter a valid date.'
  if (options.dueDate && options.invoiceDate && options.dueDate < options.invoiceDate) e.dueDate = 'Due date cannot be before the invoice date.'
  ;['shippingCharges', 'additionalCharges', 'chargesTaxPercentage', 'flatTaxPercentage'].forEach((k) => {
    const v = Number(options[k] || 0)
    if (Number.isNaN(v) || v < 0) e[k] = 'Enter 0 or more.'
  })
  if (Number(options.flatTaxPercentage) > 40) e.flatTaxPercentage = 'Demo tax rate cannot exceed 40%.'
  if (Number(options.chargesTaxPercentage) > 40) e.chargesTaxPercentage = 'Demo tax rate cannot exceed 40%.'
  const od = options.orderDiscount || {}
  if (od.type === 'PERCENT' && (Number(od.value) < 0 || Number(od.value) > 100)) e.orderDiscount = 'Discount must be 0–100%.'
  if (od.type === 'AMOUNT' && Number(od.value) < 0) e.orderDiscount = 'Discount cannot be negative.'
  return e
}

export const generateInvoice = (orderId, options = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'invoices.manage')) return deny('Only Finance or Admin can issue invoices.')
  const invoices = getInvoices()
  const order = read(K.ORDERS).find((o) => o.id === orderId)
  const reason = invoiceEligibility(order, invoices)
  if (reason) return deny(reason, { orderId: reason })
  const template = getTemplateById(options.templateId) || getDefaultTemplate()
  if (!template) return deny('Create an invoice template first.', { templateId: 'No template available.' })
  if (!template.active) return deny(`${template.name} is inactive.`, { templateId: 'Choose an active template.' })
  const oErr = validateInvoiceOptions(options)
  if (Object.keys(oErr).length) return deny(Object.values(oErr)[0], oErr)
  const ctx = context(order)
  if (!ctx.customer) return deny('The order’s customer record no longer exists.')
  const settings = getInvoiceSettings()
  const { number, sequence } = peekNextInvoiceNumber(settings, invoices)
  const now = new Date().toISOString()
  const record = buildInvoiceRecord({ id: uid('inv'), invoiceNumber: number, sequence, order, ...ctx, template, options: { ...options, notes: clean(options.notes) || '' }, user, now })
  const check = validateInvoiceTotals(record)
  if (!check.ok) return deny(`Totals did not reconcile: ${check.issues[0]}`)
  if (record.totals.grandTotal <= 0) return deny('The invoice total must be greater than zero (check delivered quantities and discounts).')
  // Inventory, dispatch and delivery collections are deliberately untouched.
  const res = storage.transaction([
    [K.INVOICES, [record, ...invoices]],
    [K.INVOICE_SETTINGS, { ...settings, lastNumber: Math.max(settings.lastNumber, sequence) }],
    [K.CUSTOMERS, postCustomerBalance(read(K.CUSTOMERS), order.customerId, record.totals.grandTotal)],
  ])
  if (!res.ok) return deny(res.error)
  logActivity({ type: 'invoice', message: `issued invoice ${number} for ${order.orderNumber}`, entityType: 'invoice', entityId: record.id })
  pushNotification({ title: `Invoice issued: ${number}`, message: `${order.customerName} · ${order.orderNumber}`, type: 'success', roles: [ROLES.ADMIN, ROLES.FINANCE], link: `/invoices/${record.id}` })
  fireEvent('INVOICE_GENERATED', { key: record.id, invoiceId: record.id, orderId: order.id, customerId: order.customerId })
  return { ok: true, record }
}

export const cancelInvoice = (id, { reason = '' } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'invoices.manage')) return deny('Only Finance or Admin can cancel invoices.')
  const list = getInvoices()
  const inv = getInvoiceById(id, list)
  if (!inv) return deny('This invoice no longer exists.')
  if (inv.status === 'CANCELLED') return deny(`${inv.invoiceNumber} is already cancelled.`)
  if (!clean(reason)) return deny('Give a reason for cancelling.', { reason: 'A reason is required.' })
  const settled = invoiceBalances().find((b) => b.id === id)
  if (settled && (settled.paid > 0 || settled.credited > 0)) return deny(`${inv.invoiceNumber} already has receipts or credit notes applied. Reverse the receipt or cancel the credit note in Finance before cancelling the invoice.`)
  const now = new Date().toISOString()
  // Only status fields change — the issued snapshot stays exactly as it was
  const record = { ...inv, status: 'CANCELLED', cancelledAt: now, cancelledBy: user.id, cancelReason: clean(reason) }
  const res = storage.transaction([
    [K.INVOICES, list.map((i) => (i.id === id ? record : i))],
    [K.CUSTOMERS, postCustomerBalance(read(K.CUSTOMERS), inv.customerId, -(Number(inv.totals?.grandTotal) || 0))],
  ])
  if (!res.ok) return deny(res.error)
  logActivity({ type: 'invoice', message: `cancelled invoice ${inv.invoiceNumber}`, entityType: 'invoice', entityId: id })
  return { ok: true, record }
}

export const markInvoiceEmailed = (id) => storage.updateItem(K.INVOICES, (list) => (list || []).map((i) => (i.id === id ? { ...i, emailedAt: new Date().toISOString() } : i)), [])

export const searchInvoices = (q, f = {}, list = getInvoices()) => {
  const query = (q || '').trim().toLowerCase()
  return list.filter((i) => {
    if (query && ![i.invoiceNumber, i.orderNumber, i.customerSnapshot?.name, i.dispatchNumber, i.deliveryNoteNumber].some((v) => String(v || '').toLowerCase().includes(query))) return false
    if (f.status && i.status !== f.status) return false
    if (f.customerId && i.customerId !== f.customerId) return false
    if (f.hubId && i.hubId !== f.hubId) return false
    if (f.templateId && i.templateId !== f.templateId) return false
    if (f.from && i.invoiceDate < f.from) return false
    if (f.to && i.invoiceDate > f.to) return false
    return true
  })
}

const invoiceService = { getInvoices, getInvoiceById, generateInvoice, cancelInvoice, previewInvoice, invoiceEligibility, peekNextInvoiceNumber, getInvoiceSettings, saveInvoiceSettings, searchInvoices }
export default invoiceService
