/** Phase 5 — central document repository and OCR configuration. */

/** Entities a document can belong to. `master` names the existing collection it links to (no new masters). */
export const DOCUMENT_ENTITIES = [
  { value: 'customer', label: 'Customer', master: 'customers' },
  { value: 'vehicle', label: 'Vehicle', master: 'vehicles' },
  { value: 'driver', label: 'Driver', master: 'drivers' },
  { value: 'order', label: 'Order', master: 'orders' },
  { value: 'deliveryNote', label: 'Delivery note', master: 'notes' },
  { value: 'invoice', label: 'Invoice', master: 'invoices' },
  { value: 'hub', label: 'Hub', master: 'hubs' },
  { value: 'employee', label: 'Employee', master: 'users' },
  // No vendor master exists in the platform yet — vendor documents carry a free-text vendor name.
  { value: 'vendor', label: 'Vendor', master: null },
  { value: 'other', label: 'Other', master: null },
]
export const ENTITY_LABEL = Object.fromEntries(DOCUMENT_ENTITIES.map((e) => [e.value, e.label]))

/** OCR field catalogue. Document types pick which fields they extract. */
export const OCR_FIELDS = {
  documentNumber: { label: 'Document number' },
  name: { label: 'Name' },
  address: { label: 'Address' },
  dateOfBirth: { label: 'Date of birth', type: 'date' },
  issueDate: { label: 'Issue date', type: 'date' },
  expiryDate: { label: 'Expiry date', type: 'date' },
  gstNumber: { label: 'GST number', pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, hint: '15 characters, e.g. 33AABCB1234C1Z5' },
  panNumber: { label: 'PAN number', pattern: /^[A-Z]{5}\d{4}[A-Z]$/, hint: 'e.g. AABCB1234C' },
  vehicleRegistrationNumber: { label: 'Vehicle registration number', pattern: /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{1,4}$/, hint: 'e.g. TN 01 BX 4521' },
  licenseNumber: { label: 'Licence number' },
  customerName: { label: 'Customer name' },
  vendorName: { label: 'Vendor name' },
  invoiceNumber: { label: 'Invoice number' },
  invoiceDate: { label: 'Invoice date', type: 'date' },
  invoiceAmount: { label: 'Invoice amount', type: 'number' },
  taxAmount: { label: 'Tax amount', type: 'number' },
  totalAmount: { label: 'Total amount', type: 'number' },
}

export const DOCUMENT_STATUS = Object.freeze({
  PENDING_OCR: 'PENDING_OCR',
  OCR_COMPLETED: 'OCR_COMPLETED',
  PENDING_REVIEW: 'PENDING_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
})
export const DOCUMENT_STATUS_META = {
  PENDING_OCR: { label: 'Pending OCR', tone: 'neutral' },
  OCR_COMPLETED: { label: 'OCR completed', tone: 'info' },
  PENDING_REVIEW: { label: 'Pending review', tone: 'warning' },
  VERIFIED: { label: 'Verified', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  EXPIRED: { label: 'Expired', tone: 'danger' },
}
/** Documents waiting for someone in the OCR / review queue. */
export const QUEUE_STATUSES = ['PENDING_OCR', 'OCR_COMPLETED', 'PENDING_REVIEW']

export const OCR_PROVIDERS = {
  MOCK: { id: 'MOCK', label: 'Simulated OCR (demo)', simulated: true, description: 'Pre-fills fields from the linked record and the file name. It does not read the image.' },
  BROWSER: { id: 'BROWSER', label: 'Browser OCR', simulated: false, description: 'Needs an in-browser OCR library. None is bundled with this prototype, so it is unavailable.' },
  BACKEND: { id: 'BACKEND', label: 'Backend OCR service', simulated: false, description: 'Sends the file to the integration gateway’s OCR endpoint. Requires VITE_INTEGRATION_GATEWAY_URL.' },
}

/** File limits for the temporary browser file store. */
export const FILE_LIMITS = { maxBytes: 5 * 1024 * 1024, accept: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], acceptAttr: '.pdf,.jpg,.jpeg,.png,.webp' }

/** Seeded, built-in document types. Admin can add more (and edit these) at /documents/types. */
export const DEFAULT_DOCUMENT_TYPES = [
  // Vehicle (VMS)
  { code: 'VEH_RC', name: 'Registration Certificate (RC)', entity: 'vehicle', fields: ['documentNumber', 'vehicleRegistrationNumber', 'name', 'issueDate', 'expiryDate'], expiryRequired: true, warningDays: 30, vehicleField: 'registrationExpiry', description: 'Vehicle registration certificate.' },
  { code: 'VEH_INSURANCE', name: 'Vehicle Insurance', entity: 'vehicle', fields: ['documentNumber', 'vehicleRegistrationNumber', 'name', 'issueDate', 'expiryDate'], expiryRequired: true, warningDays: 30, vehicleField: 'insuranceExpiry', description: 'Insurance policy covering the vehicle.' },
  { code: 'VEH_PUC', name: 'Pollution Certificate (PUC)', entity: 'vehicle', fields: ['documentNumber', 'vehicleRegistrationNumber', 'issueDate', 'expiryDate'], expiryRequired: true, warningDays: 15, vehicleField: 'pollutionExpiry', description: 'Pollution under control certificate.' },
  { code: 'VEH_FITNESS', name: 'Fitness Certificate', entity: 'vehicle', fields: ['documentNumber', 'vehicleRegistrationNumber', 'issueDate', 'expiryDate'], expiryRequired: true, warningDays: 30, vehicleField: 'fitnessExpiry', description: 'Commercial vehicle fitness certificate.' },
  { code: 'VEH_PERMIT', name: 'Permit', entity: 'vehicle', fields: ['documentNumber', 'vehicleRegistrationNumber', 'issueDate', 'expiryDate'], expiryRequired: true, warningDays: 30, vehicleField: 'permitExpiry', description: 'Goods carriage permit.' },
  { code: 'VEH_ROAD_TAX', name: 'Road Tax', entity: 'vehicle', fields: ['documentNumber', 'vehicleRegistrationNumber', 'issueDate', 'expiryDate'], expiryRequired: false, warningDays: 30, description: 'Road tax receipt.' },
  { code: 'VEH_OTHER', name: 'Other Vehicle Document', entity: 'vehicle', fields: ['documentNumber', 'issueDate', 'expiryDate'], expiryRequired: false, warningDays: 30, ocrEnabled: false },
  // Driver
  { code: 'DRV_LICENSE', name: 'Driving License', entity: 'driver', fields: ['licenseNumber', 'name', 'dateOfBirth', 'address', 'issueDate', 'expiryDate'], expiryRequired: true, warningDays: 30, driverField: 'licenseExpiry', description: 'Commercial driving licence.' },
  { code: 'DRV_ID', name: 'ID Proof', entity: 'driver', fields: ['documentNumber', 'name', 'dateOfBirth'], expiryRequired: false, warningDays: 30, description: 'Government photo ID.' },
  { code: 'DRV_ADDRESS', name: 'Address Proof', entity: 'driver', fields: ['documentNumber', 'name', 'address'], expiryRequired: false, warningDays: 30 },
  { code: 'DRV_MEDICAL', name: 'Medical Certificate', entity: 'driver', fields: ['documentNumber', 'name', 'issueDate', 'expiryDate'], expiryRequired: true, warningDays: 30, driverField: 'medicalExpiry', description: 'Medical fitness to drive.' },
  { code: 'DRV_OTHER', name: 'Other Driver Document', entity: 'driver', fields: ['documentNumber', 'issueDate', 'expiryDate'], expiryRequired: false, warningDays: 30, ocrEnabled: false },
  // General
  { code: 'AADHAAR', name: 'Aadhaar', entity: 'any', fields: ['documentNumber', 'name', 'dateOfBirth', 'address'], expiryRequired: false, warningDays: 30, description: 'Store masked copies only — the prototype is not a secure vault.' },
  { code: 'PAN', name: 'PAN Card', entity: 'any', fields: ['panNumber', 'name', 'dateOfBirth'], expiryRequired: false, warningDays: 30 },
  { code: 'GST_CERT', name: 'GST Certificate', entity: 'customer', fields: ['gstNumber', 'customerName', 'address', 'issueDate'], expiryRequired: false, warningDays: 30 },
  { code: 'DELIVERY_PROOF', name: 'Delivery Proof', entity: 'deliveryNote', fields: ['documentNumber', 'customerName', 'issueDate'], expiryRequired: false, warningDays: 30, verificationRequired: false, description: 'Signed delivery note or photo of the handover.' },
  { code: 'INVOICE_DOC', name: 'Invoice', entity: 'invoice', fields: ['invoiceNumber', 'invoiceDate', 'customerName', 'invoiceAmount', 'taxAmount', 'totalAmount'], expiryRequired: false, warningDays: 30 },
  { code: 'PURCHASE_PROOF', name: 'Purchase Proof', entity: 'vendor', fields: ['invoiceNumber', 'invoiceDate', 'vendorName', 'totalAmount', 'gstNumber'], expiryRequired: false, warningDays: 30 },
  { code: 'CUSTOMER_PROOF', name: 'Customer Proof', entity: 'customer', fields: ['documentNumber', 'customerName', 'address'], expiryRequired: false, warningDays: 30 },
  { code: 'VENDOR_PROOF', name: 'Vendor Proof', entity: 'vendor', fields: ['documentNumber', 'vendorName', 'gstNumber', 'address'], expiryRequired: false, warningDays: 30 },
  { code: 'OTHER', name: 'Other', entity: 'any', fields: ['documentNumber', 'name', 'issueDate'], expiryRequired: false, warningDays: 30, ocrEnabled: false, verificationRequired: false },
]
