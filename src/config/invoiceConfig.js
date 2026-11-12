/** Phase 5 — invoice templates and numbering. Tax here is configurable DEMO tax, not a compliance engine. */

export const INVOICE_STATUS_META = {
  ISSUED: { label: 'Issued', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
}

export const PAGE_FORMATS = [
  { value: 'A4_PORTRAIT', label: 'A4 portrait', width: 210, height: 297 },
  { value: 'A4_LANDSCAPE', label: 'A4 landscape', width: 297, height: 210 },
  { value: 'CUSTOM', label: 'Custom size' },
]
export const FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Georgia', label: 'Georgia (serif)' },
  { value: 'Helvetica', label: 'Helvetica / Arial' },
  { value: 'Courier New', label: 'Courier (monospace)' },
]
export const HEADER_LAYOUTS = [
  { value: 'logo-left', label: 'Logo left, title right' },
  { value: 'centered', label: 'Centred' },
  { value: 'banner', label: 'Coloured banner' },
]
export const FOOTER_LAYOUTS = [
  { value: 'simple', label: 'Single line' },
  { value: 'columns', label: 'Terms and signature in columns' },
]
export const NUMBER_FORMATS = [
  { value: 'en-AE', label: 'UAE / International (123,456.00)' },
  { value: 'en-IN', label: 'Indian (1,23,456.00)' },
  { value: 'en-US', label: 'International (123,456.00)' },
]
export const CURRENCIES = [{ value: 'AED', label: 'AED (UAE Dirham)', symbol: 'AED' }, { value: 'INR', label: 'INR (₹)', symbol: '₹' }, { value: 'USD', label: 'USD ($)', symbol: '$' }]

/** Configurable invoice fields, in default order. `section` groups them in the builder. */
export const INVOICE_FIELDS = [
  { key: 'companyLogo', label: 'Company logo', section: 'Header' },
  { key: 'gstNumber', label: 'Company GST number', section: 'Header' },
  { key: 'panNumber', label: 'Company PAN number', section: 'Header' },
  { key: 'billingAddress', label: 'Billing address', section: 'Parties' },
  { key: 'shippingAddress', label: 'Shipping address', section: 'Parties' },
  { key: 'customerAddress', label: 'Customer address', section: 'Parties' },
  { key: 'customerGst', label: 'Customer GST number', section: 'Parties' },
  { key: 'hubDetails', label: 'Hub details', section: 'References' },
  { key: 'orderReference', label: 'Order reference', section: 'References' },
  { key: 'dispatchReference', label: 'Dispatch reference', section: 'References' },
  { key: 'deliveryNoteReference', label: 'Delivery note reference', section: 'References' },
  { key: 'productSku', label: 'Product SKU', section: 'Items' },
  { key: 'productDescription', label: 'Product description', section: 'Items' },
  { key: 'quantity', label: 'Quantity', section: 'Items', locked: true },
  { key: 'unitPrice', label: 'Unit price', section: 'Items' },
  { key: 'discount', label: 'Discount', section: 'Items' },
  { key: 'tax', label: 'Tax', section: 'Items' },
  { key: 'subtotal', label: 'Subtotal', section: 'Totals' },
  { key: 'grandTotal', label: 'Grand total', section: 'Totals', locked: true },
  { key: 'amountInWords', label: 'Amount in words', section: 'Totals' },
  { key: 'termsAndConditions', label: 'Terms & conditions', section: 'Footer' },
  { key: 'paymentInstructions', label: 'Payment instructions', section: 'Footer' },
  { key: 'signature', label: 'Signature', section: 'Footer' },
  { key: 'qrCode', label: 'QR code placeholder', section: 'Footer' },
]

export const DEFAULT_INVOICE_SETTINGS = { prefix: 'BM-INV', includeYear: true, startingNumber: 1, digits: 5, year: new Date().getFullYear(), lastNumber: 0 }

/** Orders that can be invoiced — approved or later, never cancelled / rejected / drafts. */
export const INVOICEABLE_ORDER_STATUSES = ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'PARTIALLY_DELIVERED', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNED_TO_HUB']
