/**
 * Invoice calculation engine (Phase 5). Pure functions, integer paise internally, rupees out.
 *
 *   line subtotal      = qty × unit price
 *   item discount      = line subtotal × item discount %
 *   order discount     = flat amount or % of (Σ subtotal − Σ item discount), allocated to lines in
 *                        proportion to their value so tax is charged on the discounted amount
 *   taxable amount     = line subtotal − item discount − allocated order discount
 *   tax                = taxable × tax % (the product's rate from the order, or a flat demo rate)
 *   charges            = shipping + additional charges, taxed at chargesTaxPercentage (default 0)
 *   grand total        = Σ taxable + Σ tax + charges + charges tax
 *
 * Tax is a configurable DEMO calculation for the prototype — it is not GST-compliant invoicing.
 */
const P = (rupees) => Math.round((Number(rupees) || 0) * 100)
const R = (paise) => Math.round(paise) / 100

export const calculateSubtotal = (lines) => R(lines.reduce((s, l) => s + Math.round((Number(l.quantity) || 0) * P(l.unitPrice)), 0))

export const calculateItemDiscount = (line) => {
  const sub = Math.round((Number(line.quantity) || 0) * P(line.unitPrice))
  return R(Math.round((sub * (Number(line.discountPercentage) || 0)) / 100))
}

/** { type: 'NONE' | 'AMOUNT' | 'PERCENT', value } applied to the amount after item discounts. */
export const calculateOrderDiscount = (afterItemDiscount, orderDiscount = {}) => {
  const base = P(afterItemDiscount)
  const v = Number(orderDiscount.value) || 0
  if (orderDiscount.type === 'AMOUNT') return R(Math.min(base, Math.max(0, P(v))))
  if (orderDiscount.type === 'PERCENT') return R(Math.round((base * Math.min(100, Math.max(0, v))) / 100))
  return 0
}

export const calculateTaxableAmount = (lineSubtotal, itemDiscount, allocatedOrderDiscount = 0) => R(P(lineSubtotal) - P(itemDiscount) - P(allocatedOrderDiscount))
export const calculateTax = (taxable, rate) => R(Math.round((P(taxable) * (Number(rate) || 0)) / 100))

/**
 * Full computation. input: { lines: [{ quantity, unitPrice, discountPercentage, taxPercentage, ...rest }],
 *   orderDiscount, shippingCharges, additionalCharges, chargesTaxPercentage, taxMode: 'PRODUCT' | 'FLAT', flatTaxPercentage }
 */
export const calculateInvoice = ({ lines = [], orderDiscount = { type: 'NONE', value: 0 }, shippingCharges = 0, additionalCharges = 0, chargesTaxPercentage = 0, taxMode = 'PRODUCT', flatTaxPercentage = 0, currency = 'INR' } = {}) => {
  const base = lines.map((l) => {
    const subP = Math.round((Number(l.quantity) || 0) * P(l.unitPrice))
    const discP = Math.round((subP * (Number(l.discountPercentage) || 0)) / 100)
    return { l, subP, discP, netP: subP - discP }
  })
  const netTotalP = base.reduce((s, b) => s + b.netP, 0)
  const orderDiscP = P(calculateOrderDiscount(R(netTotalP), orderDiscount))
  // Allocate the order discount by value; the last line absorbs rounding so the sum is exact
  let allocated = 0
  const out = base.map((b, i) => {
    const share = i === base.length - 1 ? orderDiscP - allocated : (netTotalP ? Math.round((orderDiscP * b.netP) / netTotalP) : 0)
    allocated += share
    const taxableP = b.netP - share
    const rate = taxMode === 'FLAT' ? Number(flatTaxPercentage) || 0 : Number(b.l.taxPercentage) || 0
    const taxP = Math.round((taxableP * rate) / 100)
    return {
      ...b.l, taxRate: rate,
      lineSubtotal: R(b.subP), itemDiscount: R(b.discP), orderDiscountShare: R(share), taxableAmount: R(taxableP), taxAmount: R(taxP), lineTotal: R(taxableP + taxP),
    }
  })
  const sum = (k) => out.reduce((s, x) => s + P(x[k]), 0)
  const chargesP = P(shippingCharges) + P(additionalCharges)
  const chargesTaxP = Math.round((chargesP * (Number(chargesTaxPercentage) || 0)) / 100)
  const taxableP = sum('taxableAmount')
  const taxP = sum('taxAmount')
  const grandP = taxableP + taxP + chargesP + chargesTaxP
  return {
    lines: out,
    subtotal: R(sum('lineSubtotal')),
    itemDiscount: R(sum('itemDiscount')),
    orderDiscount: R(orderDiscP),
    taxableAmount: R(taxableP),
    taxAmount: R(taxP + chargesTaxP),
    shippingCharges: R(P(shippingCharges)),
    additionalCharges: R(P(additionalCharges)),
    chargesTax: R(chargesTaxP),
    grandTotal: R(grandP),
    totalQuantity: Math.round(out.reduce((s, x) => s + (Number(x.quantity) || 0), 0) * 1000) / 1000,
    amountInWords: convertAmountToWords(R(grandP), { currency }),
  }
}

export const calculateGrandTotal = (input) => calculateInvoice(input).grandTotal

/** Recompute from the stored inputs and compare with the stored totals (to the paisa). */
export const validateInvoiceTotals = (invoice) => {
  const again = calculateInvoice(invoice.calculationInput)
  const issues = ['subtotal', 'itemDiscount', 'orderDiscount', 'taxableAmount', 'taxAmount', 'grandTotal']
    .filter((k) => P(again[k]) !== P(invoice.totals?.[k]))
    .map((k) => `${k} is ${invoice.totals?.[k]} but recalculates to ${again[k]}`)
  if (again.grandTotal < 0) issues.push('Grand total cannot be negative.')
  return { ok: issues.length === 0, issues, recalculated: again }
}

/* ---------- amount in words (Indian numbering) ---------- */
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const two = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`)
const three = (n) => [n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred` : '', two(n % 100)].filter(Boolean).join(' ')
const indianWords = (n) => {
  if (n === 0) return 'Zero'
  const parts = []
  const crore = Math.floor(n / 1e7)
  const lakh = Math.floor((n % 1e7) / 1e5)
  const thousand = Math.floor((n % 1e5) / 1000)
  const rest = n % 1000
  if (crore) parts.push(`${crore >= 1000 ? indianWords(crore) : three(crore)} Crore`)
  if (lakh) parts.push(`${two(lakh)} Lakh`)
  if (thousand) parts.push(`${two(thousand)} Thousand`)
  if (rest) parts.push(three(rest))
  return parts.join(' ')
}

/** International grouping (million / billion) — used for AED and USD. */
const internationalWords = (n) => {
  if (n === 0) return 'Zero'
  const parts = []
  const scales = [[1e9, 'Billion'], [1e6, 'Million'], [1e3, 'Thousand']]
  let rest = n
  scales.forEach(([size, name]) => {
    const q = Math.floor(rest / size)
    if (q) parts.push(`${three(q)} ${name}`)
    rest %= size
  })
  if (rest) parts.push(three(rest))
  return parts.join(' ')
}

const CURRENCY_WORDS = { INR: ['Rupees', 'Paise', indianWords], USD: ['Dollars', 'Cents', internationalWords], AED: ['UAE Dirhams', 'Fils', internationalWords] }

/** 110829.6 → "Rupees One Lakh Ten Thousand Eight Hundred Twenty Nine and Sixty Paise Only" */
export const convertAmountToWords = (amount, { currency = 'INR' } = {}) => {
  const paise = Math.round(Math.abs(Number(amount) || 0) * 100)
  const whole = Math.floor(paise / 100)
  const fraction = paise % 100
  const [major, minor, words] = CURRENCY_WORDS[currency] || CURRENCY_WORDS.INR
  return `${major} ${words(whole)}${fraction ? ` and ${two(fraction)} ${minor}` : ''} Only`
}

const invoiceCalculationService = { calculateSubtotal, calculateItemDiscount, calculateOrderDiscount, calculateTaxableAmount, calculateTax, calculateGrandTotal, calculateInvoice, convertAmountToWords, validateInvoiceTotals }
export default invoiceCalculationService
