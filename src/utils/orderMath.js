/**
 * Order calculations in integer paise to avoid floating-point errors, returned as rupees
 * rounded to 2 decimals.
 *   Line subtotal = qty × price
 *   Line discount = subtotal × discount% / 100
 *   Taxable       = subtotal − discount
 *   Line tax      = taxable × tax% / 100
 *   Line total    = taxable + tax
 *   Grand total   = Σsubtotal − Σdiscount + Σtax
 */
const toPaise = (rupees) => Math.round((Number(rupees) || 0) * 100)
const toRupees = (paise) => Math.round(paise) / 100

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

export const calcLine = ({ orderedQuantity, unitPrice, discountPercentage, taxPercentage }) => {
  const qty = Number(orderedQuantity) || 0
  const subtotalP = Math.round(qty * toPaise(unitPrice))
  const discountP = Math.round((subtotalP * (Number(discountPercentage) || 0)) / 100)
  const taxableP = subtotalP - discountP
  const taxP = Math.round((taxableP * (Number(taxPercentage) || 0)) / 100)
  return {
    subtotal: toRupees(subtotalP),
    discountAmount: toRupees(discountP),
    taxableAmount: toRupees(taxableP),
    taxAmount: toRupees(taxP),
    totalAmount: toRupees(taxableP + taxP),
  }
}

export const calcTotals = (items) => {
  let sub = 0
  let disc = 0
  let tax = 0
  let qty = 0
  items.forEach((it) => {
    const l = calcLine(it)
    sub += toPaise(l.subtotal)
    disc += toPaise(l.discountAmount)
    tax += toPaise(l.taxAmount)
    qty += Number(it.orderedQuantity) || 0
  })
  return {
    subtotal: toRupees(sub),
    discountAmount: toRupees(disc),
    taxAmount: toRupees(tax),
    totalAmount: toRupees(sub - disc + tax),
    totalQuantity: round2(qty),
    lineCount: items.length,
  }
}
