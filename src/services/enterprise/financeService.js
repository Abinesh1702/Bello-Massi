/**
 * Finance calculations — every figure is derived from prototype records (invoices, customer payments, credit notes,
 * supplier invoices / payments, expenses, vouchers). Nothing is hard-coded and nothing is posted to a real ledger,
 * bank or tax authority. VAT is computed at the configured rate (UAE standard rate 5 % by default).
 */
import dayjs from 'dayjs'
import storage from '../storageService'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { getSuppliers } from '../supplierService'
import { postCustomerBalance } from '../customerService'

const read = (k, f = []) => storage.getItem(k, f) ?? f
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100
export const settings = () => read(K.ENTERPRISE_SETTINGS, {}) || {}
export const vatRate = () => Number(settings()?.finance?.vatRate ?? 5)
export const vatOn = (amount, rate = vatRate()) => r2((Number(amount) || 0) * rate / 100)

/** UAE TRN: 15 digits, starting with 100 (format check only — not verified with the FTA). */
export const validateTrn = (trn) => {
  const v = String(trn || '').replace(/\s/g, '')
  if (!v) return null
  if (!/^\d{15}$/.test(v)) return 'TRN must be 15 digits.'
  if (!v.startsWith('100')) return 'UAE TRNs start with 100.'
  return null
}

const LIVE_INVOICE = (i) => !['DRAFT', 'CANCELLED', 'VOID'].includes(i.status)
export const invoiceTotal = (i) => Number(i?.totals?.grandTotal) || 0

/** Per-invoice receivable position from posted receipts and approved / applied credit notes. */
export const invoiceBalances = (asOf = dayjs()) => {
  const invoices = read(K.INVOICES).filter(LIVE_INVOICE)
  const paid = {}
  read(K.CUSTOMER_PAYMENTS).filter((p) => p.status === 'POSTED').forEach((p) => (p.allocations || []).forEach((a) => { paid[a.invoiceId] = r2((paid[a.invoiceId] || 0) + Number(a.amount || 0)) }))
  const credited = {}
  read(K.CREDIT_NOTES).filter((c) => ['APPROVED', 'APPLIED'].includes(c.status) && c.invoiceId).forEach((c) => { credited[c.invoiceId] = r2((credited[c.invoiceId] || 0) + Number(c.total || 0)) })
  return invoices.map((i) => {
    const total = invoiceTotal(i)
    const balance = r2(Math.max(0, total - (paid[i.id] || 0) - (credited[i.id] || 0)))
    const overdueDays = i.dueDate && balance > 0 ? Math.max(0, asOf.startOf('day').diff(dayjs(i.dueDate), 'day')) : 0
    return { id: i.id, invoiceNumber: i.invoiceNumber, customerId: i.customerId, invoiceDate: i.invoiceDate, dueDate: i.dueDate, total, paid: paid[i.id] || 0, credited: credited[i.id] || 0, balance, overdueDays, status: balance <= 0 ? 'PAID' : (paid[i.id] || credited[i.id]) ? 'PARTIAL' : 'OPEN' }
  })
}
export const invoiceBalance = (invoiceId) => invoiceBalances().find((b) => b.id === invoiceId)?.balance ?? 0

export const AGING_BUCKETS = [
  { id: 'current', label: 'Not due', test: (d) => d <= 0 },
  { id: 'd30', label: '1–30 days', test: (d) => d > 0 && d <= 30 },
  { id: 'd60', label: '31–60 days', test: (d) => d > 30 && d <= 60 },
  { id: 'd90', label: '61–90 days', test: (d) => d > 60 && d <= 90 },
  { id: 'd90p', label: '90+ days', test: (d) => d > 90 },
]
const bucketOf = (d) => AGING_BUCKETS.find((b) => b.test(d))?.id || 'current'

/** Receivables aging per customer. */
export const arAging = () => {
  const customers = Object.fromEntries(read(K.CUSTOMERS).map((c) => [c.id, c]))
  const map = {}
  invoiceBalances().filter((b) => b.balance > 0).forEach((b) => {
    const c = customers[b.customerId]
    map[b.customerId] ||= { customerId: b.customerId, customer: c?.name || b.customerId, creditLimit: c?.creditLimit || 0, creditHold: Boolean(c?.creditHold), total: 0, current: 0, d30: 0, d60: 0, d90: 0, d90p: 0, invoices: 0 }
    const row = map[b.customerId]
    row[bucketOf(b.overdueDays)] = r2(row[bucketOf(b.overdueDays)] + b.balance)
    row.total = r2(row.total + b.balance)
    row.invoices += 1
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
}

/** Unallocated customer receipts (on-account credit). */
export const unappliedCash = (customerId) => r2(read(K.CUSTOMER_PAYMENTS).filter((p) => p.status === 'POSTED' && (!customerId || p.customerId === customerId)).reduce((s, p) => s + Math.max(0, Number(p.amount || 0) - (p.allocations || []).reduce((x, a) => x + Number(a.amount || 0), 0)), 0))

/** Statement of account: invoices, receipts and credit notes in date order with running balance. */
export const customerStatement = (customerId) => {
  const rows = []
  read(K.INVOICES).filter((i) => LIVE_INVOICE(i) && i.customerId === customerId).forEach((i) => rows.push({ date: i.invoiceDate, type: 'Invoice', ref: i.invoiceNumber, debit: invoiceTotal(i), credit: 0, link: `/invoices/${i.id}` }))
  read(K.CUSTOMER_PAYMENTS).filter((p) => p.status === 'POSTED' && p.customerId === customerId).forEach((p) => rows.push({ date: p.paymentDate, type: `Receipt · ${p.method}`, ref: p.number, debit: 0, credit: Number(p.amount) || 0, link: `/finance/payments/${p.id}` }))
  read(K.CREDIT_NOTES).filter((c) => ['APPROVED', 'APPLIED'].includes(c.status) && c.customerId === customerId).forEach((c) => rows.push({ date: c.date || c.createdAt?.slice(0, 10), type: 'Credit note', ref: c.number, debit: 0, credit: Number(c.total) || 0, link: `/finance/credit-notes/${c.id}` }))
  rows.sort((a, b) => String(a.date).localeCompare(String(b.date)))
  let bal = 0
  return rows.map((r) => { bal = r2(bal + r.debit - r.credit); return { ...r, balance: bal } })
}

/* ---------- Payables ---------- */
export const supplierInvoiceBalances = () => {
  const paid = {}
  read(K.SUPPLIER_PAYMENTS).filter((p) => p.status === 'PAID').forEach((p) => { paid[p.supplierInvoiceId] = r2((paid[p.supplierInvoiceId] || 0) + Number(p.amount || 0)) })
  return read(K.SUPPLIER_INVOICES).filter((s) => !['REJECTED', 'CANCELLED'].includes(s.status)).map((s) => {
    const balance = r2(Math.max(0, Number(s.total || 0) - (paid[s.id] || 0)))
    const overdueDays = s.dueDate && balance > 0 ? Math.max(0, dayjs().startOf('day').diff(dayjs(s.dueDate), 'day')) : 0
    return { id: s.id, number: s.number, supplierId: s.supplierId, supplierInvoiceNo: s.supplierInvoiceNo, dueDate: s.dueDate, total: Number(s.total || 0), paid: paid[s.id] || 0, balance, overdueDays, status: s.status }
  })
}
export const supplierInvoiceBalance = (id) => supplierInvoiceBalances().find((b) => b.id === id)?.balance ?? 0
export const apAging = () => {
  const sup = Object.fromEntries(getSuppliers().map((s) => [s.id, s]))
  const map = {}
  supplierInvoiceBalances().filter((b) => b.balance > 0).forEach((b) => {
    map[b.supplierId] ||= { supplierId: b.supplierId, supplier: sup[b.supplierId]?.name || b.supplierId, total: 0, current: 0, d30: 0, d60: 0, d90: 0, d90p: 0, invoices: 0 }
    const row = map[b.supplierId]
    row[bucketOf(b.overdueDays)] = r2(row[bucketOf(b.overdueDays)] + b.balance)
    row.total = r2(row.total + b.balance)
    row.invoices += 1
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
}

/* ---------- Cash & bank ---------- */
export const bankBalance = (accountId) => {
  const acc = read(K.BANK_ACCOUNTS).find((a) => a.id === accountId)
  if (!acc) return 0
  const inflow = read(K.CUSTOMER_PAYMENTS).filter((p) => p.status === 'POSTED' && p.bankAccountId === accountId).reduce((s, p) => s + Number(p.amount || 0), 0)
  const supplierOut = read(K.SUPPLIER_PAYMENTS).filter((p) => p.status === 'PAID' && p.bankAccountId === accountId).reduce((s, p) => s + Number(p.amount || 0), 0)
  const expOut = read(K.EXPENSES).filter((e) => e.status === 'PAID' && e.paidFromAccountId === accountId).reduce((s, e) => s + Number(e.total || e.amount || 0), 0)
  const vouchers = read(K.VOUCHERS).filter((v) => v.status === 'POSTED' && v.bankAccountId === accountId).reduce((s, v) => s + (v.voucherType === 'Receipt' ? 1 : v.voucherType === 'Payment' ? -1 : 0) * Number(v.amount || 0), 0)
  return r2(Number(acc.openingBalance || 0) + inflow - supplierOut - expOut + vouchers)
}

/* ---------- VAT summary (from records) ---------- */
export const vatSummary = (from, to) => {
  const inRange = (d) => (!from || String(d) >= from) && (!to || String(d) <= to)
  const outputInv = read(K.INVOICES).filter((i) => LIVE_INVOICE(i) && inRange(i.invoiceDate))
  const output = r2(outputInv.reduce((s, i) => s + Number(i.totals?.taxAmount ?? 0), 0))
  const outputBase = r2(outputInv.reduce((s, i) => s + (invoiceTotal(i) - Number(i.totals?.taxAmount ?? 0)), 0))
  const creditVat = r2(read(K.CREDIT_NOTES).filter((c) => ['APPROVED', 'APPLIED'].includes(c.status) && inRange(c.date)).reduce((s, c) => s + Number(c.vatAmount || 0), 0))
  const inputSup = r2(read(K.SUPPLIER_INVOICES).filter((s) => ['APPROVED', 'PAID', 'MATCHED', 'PARTIALLY_PAID'].includes(s.status) && inRange(s.invoiceDate)).reduce((s, x) => s + Number(x.vatAmount || 0), 0))
  const inputExp = r2(read(K.EXPENSES).filter((e) => ['APPROVED', 'PAID'].includes(e.status) && inRange(e.date)).reduce((s, x) => s + Number(x.vatAmount || 0), 0))
  return { outputBase, output, creditVat, netOutput: r2(output - creditVat), inputSup, inputExp, input: r2(inputSup + inputExp), payable: r2(output - creditVat - inputSup - inputExp), invoices: outputInv.length }
}

/** Customer outstanding (creditBalance) follows posted receipts / credit notes so order credit checks see them. */
export const adjustCustomerOutstanding = (customerId, delta) => {
  const list = read(K.CUSTOMERS)
  if (!list.some((x) => x.id === customerId)) return { ok: false, error: 'Customer not found.' }
  return storage.setItem(K.CUSTOMERS, postCustomerBalance(list, customerId, delta))
}
export const setCreditHold = (customerId, hold, reason = '') => {
  const list = read(K.CUSTOMERS)
  return storage.setItem(K.CUSTOMERS, list.map((x) => (x.id === customerId ? { ...x, creditHold: hold, creditHoldReason: hold ? reason : '', creditHoldAt: hold ? new Date().toISOString() : null } : x)))
}

export const financeKpis = () => {
  const balances = invoiceBalances()
  const ar = r2(balances.reduce((s, b) => s + b.balance, 0))
  const overdue = r2(balances.filter((b) => b.overdueDays > 0).reduce((s, b) => s + b.balance, 0))
  const ap = r2(supplierInvoiceBalances().reduce((s, b) => s + b.balance, 0))
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
  const collectedMonth = r2(read(K.CUSTOMER_PAYMENTS).filter((p) => p.status === 'POSTED' && p.paymentDate >= monthStart).reduce((s, p) => s + Number(p.amount || 0), 0))
  const salesMonth = r2(read(K.INVOICES).filter((i) => LIVE_INVOICE(i) && i.invoiceDate >= monthStart).reduce((s, i) => s + invoiceTotal(i), 0))
  const expensesMonth = r2(read(K.EXPENSES).filter((e) => ['APPROVED', 'PAID'].includes(e.status) && e.date >= monthStart).reduce((s, e) => s + Number(e.total || 0), 0))
  const cash = r2(read(K.BANK_ACCOUNTS).filter((a) => a.status !== 'INACTIVE').reduce((s, a) => s + bankBalance(a.id), 0))
  return { ar, overdue, ap, collectedMonth, salesMonth, expensesMonth, cash, openInvoices: balances.filter((b) => b.balance > 0).length }
}
