/**
 * Builds the immutable invoice record (pure — used by invoiceService and the seed).
 * Everything the printed invoice shows is copied in: template, company, customer, items and totals,
 * so later template / master-data changes never alter an issued invoice.
 */
import { calculateInvoice } from '../services/invoiceCalculationService'

const pad = (n, w) => String(n).padStart(w, '0')

/** "BM-INV-2026-00001" from numbering settings and a sequence value. */
export const formatInvoiceNumber = (settings, n) => [settings.prefix, settings.includeYear ? settings.year : null, pad(n, settings.digits)].filter(Boolean).join('-')

export const customerAddress = (c) => (c ? [c.addressLine1, c.addressLine2, c.city, c.state, c.pincode].filter(Boolean).join(', ') : '')

/**
 * Invoice lines from an order. basis 'DELIVERED' bills what the delivery note recorded as delivered
 * (when a note exists); otherwise the ordered quantities are billed.
 */
export const invoiceLinesFor = (order, { products = [], note = null, basis = 'ORDERED' } = {}) => {
  const P = Object.fromEntries(products.map((p) => [p.id, p]))
  return order.items.map((it) => {
    const delivered = note?.items?.find((n) => n.productId === it.productId)
    const quantity = basis === 'DELIVERED' && delivered ? delivered.deliveredQuantity : it.orderedQuantity
    const p = P[it.productId] || {}
    return {
      productId: it.productId, productCode: it.productCode || p.code || '', sku: p.sku || it.sku || '', productName: it.productName,
      description: p.description || '', unit: it.unit, quantity, orderedQuantity: it.orderedQuantity,
      unitPrice: it.unitPrice, discountPercentage: it.discountPercentage || 0, taxPercentage: it.taxPercentage || 0,
    }
  })
}

export const buildInvoiceRecord = ({ id, invoiceNumber, sequence, order, customer, products, hub, dispatch, note, template, options = {}, user, now }) => {
  const basis = options.quantityBasis === 'DELIVERED' && note ? 'DELIVERED' : 'ORDERED'
  const calculationInput = {
    lines: invoiceLinesFor(order, { products, note, basis }),
    orderDiscount: options.orderDiscount || { type: 'NONE', value: 0 },
    shippingCharges: Number(options.shippingCharges) || 0,
    additionalCharges: Number(options.additionalCharges) || 0,
    chargesTaxPercentage: Number(options.chargesTaxPercentage) || 0,
    taxMode: options.taxMode || 'PRODUCT',
    flatTaxPercentage: Number(options.flatTaxPercentage) || 0,
    currency: template?.currency || 'INR',
  }
  const totals = calculateInvoice(calculationInput)
  const at = now || new Date().toISOString()
  return {
    id,
    invoiceNumber,
    sequence,
    status: 'ISSUED',
    invoiceDate: options.invoiceDate || at.slice(0, 10),
    dueDate: options.dueDate || '',
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    hubId: order.hubId,
    dispatchId: dispatch?.id || null,
    dispatchNumber: dispatch?.dispatchNumber || '',
    deliveryNoteId: note?.id || null,
    deliveryNoteNumber: note?.noteNumber || '',
    quantityBasis: basis,
    templateId: template.id,
    templateVersion: template.version || 1,
    // Immutable snapshots
    templateSnapshot: JSON.parse(JSON.stringify(template)),
    customerSnapshot: {
      name: customer?.name || order.customerName, code: customer?.code || order.customerCode || '', gstNumber: customer?.gstNumber || '', panNumber: customer?.panNumber || '',
      contactPerson: customer?.contactPerson || '', mobile: customer?.mobile || '', email: customer?.email || '',
      billingAddress: customerAddress(customer), shippingAddress: [order.deliveryAddress, order.deliveryCity, order.deliveryPincode].filter(Boolean).join(', '),
    },
    hubSnapshot: hub ? { name: hub.name, code: hub.code, address: [hub.address, hub.city, hub.state].filter(Boolean).join(', '), phone: hub.phone || '' } : null,
    calculationInput,
    totals,
    notes: options.notes || '',
    demoTax: true,
    createdBy: user?.id || null,
    createdByName: user?.name || '',
    createdAt: at,
    cancelledAt: null, cancelledBy: null, cancelReason: '',
    emailedAt: null,
  }
}
