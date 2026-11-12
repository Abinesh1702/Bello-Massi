/**
 * Phase 5 seed + migration (pure). Extends Phase 4 vehicles / drivers in place and builds the document
 * repository, OCR history, invoice templates and invoices, email / WhatsApp templates and demo history,
 * and automated-notification rules — all from existing records, so nothing is duplicated.
 */
import dayjs from 'dayjs'
import { DEFAULT_DOCUMENT_TYPES } from '../../config/documentConfig'
import { DEFAULT_INVOICE_SETTINGS, INVOICE_FIELDS } from '../../config/invoiceConfig'
import { DEFAULT_COMMUNICATION_SETTINGS, DEFAULT_EMAIL_SETTINGS, DEFAULT_OPENWA_SETTINGS } from '../../config/communicationConfig'
import { DEFAULT_VMS_SETTINGS } from '../../config/vmsConfig'
import { buildInvoiceRecord, formatInvoiceNumber } from '../../utils/invoiceSnapshot'
import { formatMoney } from '../../utils/formatters'

const pad = (n, w) => String(n).padStart(w, '0')
const iso = (d) => d.toISOString()
const day = (d) => d.format('YYYY-MM-DD')

const MANUFACTURERS = { Bike: 'Hero', Van: 'Tata Motors', 'Mini Truck': 'Ashok Leyland', Truck: 'Eicher', 'Heavy Vehicle': 'BharatBenz', Other: 'Mahindra' }
const INSURERS = ['ICICI Lombard', 'HDFC ERGO', 'New India Assurance', 'Bajaj Allianz', 'Tata AIG']
/** Expiry offsets (days from today) per vehicle index — gives a realistic mix of expired / expiring / valid. */
const VEHICLE_EXPIRY_PLAN = [
  { insurance: 210, registration: 1900, pollution: 95, fitness: 300, permit: 400 },
  { insurance: 5, registration: 1500, pollution: 40, fitness: 250, permit: 380 },
  { insurance: 160, registration: 1200, pollution: -6, fitness: 190, permit: 350 },
  { insurance: 25, registration: 900, pollution: 120, fitness: 22, permit: 300 },
  { insurance: -12, registration: 800, pollution: 60, fitness: 140, permit: 270 },
  { insurance: 300, registration: 2100, pollution: 150, fitness: 0, permit: 500 },
  { insurance: 250, registration: 1700, pollution: 10, fitness: 330, permit: 420 },
]

export const buildDocumentTypes = (now) => DEFAULT_DOCUMENT_TYPES.map((t, i) => ({
  id: `dt-${t.code.toLowerCase().replace(/_/g, '-')}`,
  code: t.code,
  name: t.name,
  description: t.description || '',
  entity: t.entity,
  fields: t.fields,
  ocrEnabled: t.ocrEnabled !== false,
  verificationRequired: t.verificationRequired !== false,
  expiryRequired: Boolean(t.expiryRequired),
  warningDays: t.warningDays,
  vehicleField: t.vehicleField || null,
  driverField: t.driverField || null,
  active: true,
  builtIn: true,
  createdAt: iso(now.subtract(200 - i, 'day')),
  updatedAt: iso(now.subtract(200 - i, 'day')),
}))

export const buildInvoiceTemplates = (now) => {
  const fields = (hidden = []) => INVOICE_FIELDS.map((f) => ({ key: f.key, visible: !hidden.includes(f.key) }))
  const company = {
    name: 'Bellomassi Foods Pvt. Ltd.', logo: 'builtin', address: '42 Cold Chain Park, Guindy Industrial Estate, Chennai, Tamil Nadu 600032',
    gstNumber: '33AABCB1234C1Z5', panNumber: 'AABCB1234C', phone: '+91 44 4000 1234', email: 'accounts@bellomassi.demo', website: 'bellomassi.demo',
  }
  const base = {
    company, invoiceTitle: 'Tax Invoice (Demo)', headerLayout: 'logo-left', footerLayout: 'columns', pageFormat: 'A4_PORTRAIT', customWidth: 210, customHeight: 297,
    font: 'Inter', fontSize: 10, primaryColor: '#232B5F', accentColor: '#F5A623', currency: 'INR', numberFormat: 'en-IN',
    headerText: '', footerText: 'This is a computer-generated invoice from the Bellomassi prototype.',
    terms: '1. Goods once delivered will not be taken back except for quality issues reported within 24 hours.\n2. Interest at 18% p.a. on overdue amounts.\n3. Subject to Chennai jurisdiction.',
    paymentInstructions: 'Bank transfer to Bellomassi Foods Pvt. Ltd. · Demo Bank · A/C 000123456789 · IFSC DEMO0001234',
    signatureLabel: 'For Bellomassi Foods Pvt. Ltd.', active: true, version: 1, createdBy: 'u-admin',
  }
  return [
    { ...base, id: 'tpl-standard', code: 'STD', name: 'Standard invoice', isDefault: true, fields: fields(), createdAt: iso(now.subtract(60, 'day')), updatedAt: iso(now.subtract(60, 'day')) },
    { ...base, id: 'tpl-compact', code: 'CMP', name: 'Compact (no SKU / description)', isDefault: false, headerLayout: 'centered', footerLayout: 'simple', fontSize: 9, fields: fields(['productSku', 'productDescription', 'hubDetails', 'qrCode', 'customerAddress']), createdAt: iso(now.subtract(45, 'day')), updatedAt: iso(now.subtract(45, 'day')) },
    { ...base, id: 'tpl-landscape', code: 'LND', name: 'Landscape — banner header', isDefault: false, headerLayout: 'banner', pageFormat: 'A4_LANDSCAPE', primaryColor: '#1F4E79', accentColor: '#F5A623', fields: fields([]), active: false, createdAt: iso(now.subtract(30, 'day')), updatedAt: iso(now.subtract(30, 'day')) },
  ]
}

const EMAIL_TEMPLATE_DEFS = [
  ['ORDER_CONFIRMATION', 'Order confirmation', 'Order {{order_number}} received', 'Dear {{customer_name}},\n\nThank you — we have received your order {{order_number}} for {{amount}}. Our team will confirm it shortly.\n\nRegards,\nBellomassi Operations'],
  ['ORDER_APPROVED', 'Order approved', 'Order {{order_number}} approved', 'Dear {{customer_name}},\n\nYour order {{order_number}} ({{amount}}) has been approved and is being prepared for dispatch.\n\nRegards,\nBellomassi Operations'],
  ['ORDER_REJECTED', 'Order rejected', 'Update on order {{order_number}}', 'Dear {{customer_name}},\n\nWe are unable to process order {{order_number}}: {{reason}}. Your sales representative will contact you.\n\nRegards,\nBellomassi Operations'],
  ['DISPATCH_NOTIFICATION', 'Dispatch notification', 'Order {{order_number}} is on its way', 'Dear {{customer_name}},\n\nOrder {{order_number}} has been dispatched on {{dispatch_number}} with {{driver_name}}. Expected delivery: {{delivery_date}}.\n\nRegards,\nBellomassi Operations'],
  ['DELIVERY_CONFIRMATION', 'Delivery confirmation', 'Delivered: order {{order_number}}', 'Dear {{customer_name}},\n\nOrder {{order_number}} was delivered. Delivery note: {{delivery_note_number}}.\n\nRegards,\nBellomassi Operations'],
  ['INVOICE_EMAIL', 'Invoice email', 'Invoice {{invoice_number}} for order {{order_number}}', 'Dear {{customer_name}},\n\nPlease find invoice {{invoice_number}} for {{amount}} against order {{order_number}}.\n\nRegards,\nBellomassi Accounts'],
  ['DOCUMENT_EXPIRY', 'Document expiry alert', 'Expiry alert: {{document_name}}', 'Hello,\n\n{{document_name}} expires on {{expiry_date}}. Please upload the renewed document.\n\nBellomassi Fleet'],
  ['OTP_NOTIFICATION', 'OTP notification', 'Delivery OTP for order {{order_number}}', 'Dear {{customer_name}},\n\nYour delivery OTP for order {{order_number}} is {{otp}}. Share it with the driver only at handover.\n\nBellomassi'],
  ['CUSTOM', 'Custom message', '', 'Dear {{customer_name}},\n\n\n\nRegards,\nBellomassi'],
]
const WA_TEMPLATE_DEFS = [
  ['ORDER_CONFIRMATION', 'Order confirmation', 'Hi {{customer_name}}, we received your order {{order_number}} ({{amount}}). — Bellomassi'],
  ['ORDER_APPROVED', 'Order approved', 'Hi {{customer_name}}, order {{order_number}} is approved and being prepared. — Bellomassi'],
  ['ORDER_REJECTED', 'Order rejected', 'Hi {{customer_name}}, we could not process order {{order_number}}: {{reason}}. Your sales rep will call you. — Bellomassi'],
  ['DISPATCH_ASSIGNED', 'Dispatch assigned', 'Hi {{customer_name}}, order {{order_number}} is planned on {{dispatch_number}} for {{delivery_date}}. — Bellomassi'],
  ['DRIVER_ON_THE_WAY', 'Driver on the way', 'Hi {{customer_name}}, {{driver_name}} is on the way with order {{order_number}}. Please keep the OTP ready. — Bellomassi'],
  ['DELIVERY_CONFIRMATION', 'Delivery confirmation', 'Hi {{customer_name}}, order {{order_number}} is delivered. Delivery note {{delivery_note_number}}. Thank you! — Bellomassi'],
  ['INVOICE_NOTIFICATION', 'Invoice notification', 'Hi {{customer_name}}, invoice {{invoice_number}} for {{amount}} has been issued for order {{order_number}}. — Bellomassi'],
  ['DOCUMENT_EXPIRY', 'Document expiry alert', 'Reminder: {{document_name}} expires on {{expiry_date}}. Please renew it. — Bellomassi Fleet'],
  ['CUSTOM', 'Custom message', 'Hi {{customer_name}}, '],
]
const RULES = [
  ['ORDER_CREATED', 'CUSTOMER', 'BOTH', 'ORDER_CONFIRMATION', 'ORDER_CONFIRMATION', true],
  ['ORDER_APPROVED', 'CUSTOMER', 'BOTH', 'ORDER_APPROVED', 'ORDER_APPROVED', true],
  ['ORDER_REJECTED', 'SALESMAN', 'EMAIL', 'ORDER_REJECTED', 'ORDER_REJECTED', true],
  ['ORDER_READY', 'CUSTOMER', 'WHATSAPP', 'DISPATCH_NOTIFICATION', 'DISPATCH_ASSIGNED', false],
  ['DISPATCH_ASSIGNED', 'CUSTOMER', 'WHATSAPP', 'DISPATCH_NOTIFICATION', 'DISPATCH_ASSIGNED', true],
  ['DELIVERY_STARTED', 'CUSTOMER', 'WHATSAPP', 'DISPATCH_NOTIFICATION', 'DRIVER_ON_THE_WAY', true],
  ['DELIVERY_COMPLETED', 'CUSTOMER', 'BOTH', 'DELIVERY_CONFIRMATION', 'DELIVERY_CONFIRMATION', true],
  ['DELIVERY_FAILED', 'OPERATIONS', 'EMAIL', 'CUSTOM', 'CUSTOM', true],
  ['INVOICE_GENERATED', 'CUSTOMER', 'EMAIL', 'INVOICE_EMAIL', 'INVOICE_NOTIFICATION', true],
  ['DOCUMENT_EXPIRING', 'OPERATIONS', 'EMAIL', 'DOCUMENT_EXPIRY', 'DOCUMENT_EXPIRY', true],
  ['DOCUMENT_EXPIRED', 'OPERATIONS', 'BOTH', 'DOCUMENT_EXPIRY', 'DOCUMENT_EXPIRY', true],
]

const INBOX = [
  ['ABC Enterprises', 'orders@abcenterprises.demo', 'Need 10 more cartons of Paneer Block', 'Hi team,\n\nCan you add 10 cartons of Paneer Block to our next order? Please confirm the delivery date.\n\nRajesh Kannan\nABC Enterprises', 2, false],
  ['Marina Hotels & Caterers', 'purchase@marinahotels.demo', 'Re: Delivery timing for Friday', 'Please deliver before 10 AM on Friday — the kitchen receives stock only in the morning.\n\nThanks,\nPurchase Desk', 5, false],
  ['Chennai Industrial Supplies', 'accounts@cis.demo', 'Invoice copy request', 'Hello,\n\nKindly email the invoice for our last delivery. Our accounts team needs it for month-end.\n\nRegards,\nAccounts', 9, true],
  ['Global Distributors', 'ops@globaldist.demo', 'Credit limit review', 'Hi Priya,\n\nWe would like to request a credit limit increase given our order volume this quarter.\n\nBest,\nGlobal Distributors', 20, true],
  ['Metro Wholesale', 'stores@metrowholesale.demo', 'Damaged cartons in last delivery', 'Two cartons of Chicken Nuggets were damaged in the last delivery. Photos attached in our records. Please advise.\n\nStores team', 28, false],
  ['Green Leaf Restaurants', 'chef@greenleaf.demo', 'New menu — product availability', 'Do you stock frozen sweet corn kernels in 1 kg packs? We are launching a new menu next month.', 46, true],
  ['Sri Lakshmi Traders', 'srilakshmi@traders.demo', 'Reschedule delivery', 'Our shop will be closed tomorrow. Can the delivery move to the day after?', 70, true],
]

/**
 * input: { now, vehicles, drivers, customers, orders, dispatches, deliveries, notes, hubs, products, users }
 */
export const buildPhase5Data = (input) => {
  const now = input.now ? dayjs(input.now) : dayjs()
  const { customers = [], orders = [], dispatches = [], notes = [], hubs = [], products = [], deliveries = [] } = input
  const H = Object.fromEntries(hubs.map((h) => [h.id, h]))

  /* ---------- VMS: extend vehicles and drivers in place ---------- */
  const driverByVehicle = Object.fromEntries((input.drivers || []).filter((d) => d.vehicleId).map((d) => [d.vehicleId, d.id]))
  const vehicles = (input.vehicles || []).map((v, i) => {
    if (v.vmsExtended) return v
    const plan = VEHICLE_EXPIRY_PLAN[i % VEHICLE_EXPIRY_PLAN.length]
    const at = (d) => day(now.add(d + (i >= VEHICLE_EXPIRY_PLAN.length ? 400 : 0), 'day'))
    return {
      ...v,
      registrationNumber: v.registrationNumber || v.vehicleNumber,
      category: v.category || (v.type === 'Bike' ? 'Two-wheeler' : /reefer|chill|frozen/i.test(`${v.model} ${v.notes}`) || i % 2 === 0 ? 'Refrigerated' : 'Insulated'),
      manufacturer: v.manufacturer || MANUFACTURERS[v.type] || 'Tata Motors',
      manufacturingYear: v.manufacturingYear || 2019 + (i % 6),
      fuelType: v.fuelType || (v.type === 'Bike' ? 'Petrol' : i % 5 === 3 ? 'CNG' : 'Diesel'),
      ownershipType: v.ownershipType || (i % 4 === 3 ? 'Leased' : 'Owned'),
      ownerName: v.ownerName || (i % 4 === 3 ? 'Sundaram Fleet Leasing' : 'Bellomassi Foods Pvt. Ltd.'),
      insuranceProvider: v.insuranceProvider || INSURERS[i % INSURERS.length],
      insurancePolicyNumber: v.insurancePolicyNumber || `POL-${2026}-${pad(4810 + i * 37, 6)}`,
      insuranceExpiry: v.insuranceExpiry || at(plan.insurance),
      registrationExpiry: v.registrationExpiry || at(plan.registration),
      pollutionExpiry: v.pollutionExpiry || at(plan.pollution),
      fitnessExpiry: v.fitnessExpiry || at(plan.fitness),
      permitExpiry: v.permitExpiry || at(plan.permit),
      assignedDriverId: v.assignedDriverId ?? driverByVehicle[v.id] ?? null,
      remarks: v.remarks ?? v.notes ?? '',
      createdAt: v.createdAt || iso(now.subtract(300, 'day')),
      updatedAt: v.updatedAt || iso(now.subtract(10, 'day')),
      vmsExtended: true,
    }
  })
  const drivers = (input.drivers || []).map((d, i) => (d.medicalExpiry !== undefined ? d : { ...d, medicalExpiry: day(now.add([140, 18, -3, 260, 75, 400, 33, 210][i % 8], 'day')) }))

  /* ---------- documents ---------- */
  const documentTypes = buildDocumentTypes(now)
  const T = Object.fromEntries(documentTypes.map((t) => [t.code, t]))
  const documents = []
  const ocrResults = []
  let docN = 0
  const addDoc = ({ code, entityType, entityId, entityLabel, number, issue, expiry, status, fields = {}, days = 30, by = 'u-admin', reviewer = 'u-admin', remarks = '' }) => {
    docN += 1
    const t = T[code]
    const id = `doc-${pad(docN, 4)}`
    const uploadedAt = now.subtract(days, 'day')
    const extracted = { documentNumber: number, issueDate: issue || '', expiryDate: expiry || '', ...fields }
    const original = Object.fromEntries(t.fields.map((f) => [f, extracted[f] ?? '']))
    const ran = status !== 'PENDING_OCR' && t.ocrEnabled
    const edited = status === 'VERIFIED' && docN % 3 === 0 ? { ...original, documentNumber: number } : original
    if (ran) {
      ocrResults.push({
        id: `ocr-${pad(docN, 4)}`, documentId: id, provider: 'MOCK', simulated: true, processedAt: iso(uploadedAt.add(2, 'minute')), processedBy: by,
        fields: original, confidence: 0.82 + (docN % 10) / 100, durationMs: 380 + (docN % 7) * 40, note: 'Simulated OCR — values pre-filled from the linked record, not read from the image.',
      })
    }
    const verified = status === 'VERIFIED'
    const rejected = status === 'REJECTED'
    const reviewedAt = uploadedAt.add(1, 'day')
    documents.push({
      id, documentNumberRef: `DOC-${pad(docN, 5)}`,
      name: `${t.name} — ${entityLabel}`, typeId: t.id, typeCode: code, entityType, entityId, entityLabel,
      documentNumber: number || '', issueDate: issue || '', expiryDate: expiry || '',
      status, fileId: null, fileName: '', fileType: '', fileSize: 0, storage: 'none',
      demoRecord: true,
      ocrProvider: ran ? 'MOCK' : null, ocrFields: ran ? edited : {}, ocrOriginal: ran ? original : {}, ocrProcessedAt: ran ? iso(uploadedAt.add(2, 'minute')) : null,
      verifiedBy: verified ? reviewer : null, verifiedAt: verified ? iso(reviewedAt) : null,
      rejectedBy: rejected ? reviewer : null, rejectedAt: rejected ? iso(reviewedAt) : null,
      reviewRemarks: rejected ? 'Image is blurred — the expiry date is not readable. Please upload a clearer scan.' : verified ? 'Checked against original.' : '',
      remarks,
      uploadedBy: by, uploadedAt: iso(uploadedAt), updatedAt: iso(verified || rejected ? reviewedAt : uploadedAt),
      history: [
        { at: iso(uploadedAt), by, action: 'UPLOADED', note: 'Demo record — seeded without a file' },
        ...(ran ? [{ at: iso(uploadedAt.add(2, 'minute')), by, action: 'OCR_PROCESSED', note: 'Simulated OCR' }] : []),
        ...(verified ? [{ at: iso(reviewedAt), by: reviewer, action: 'VERIFIED', note: 'Checked against original.' }] : []),
        ...(rejected ? [{ at: iso(reviewedAt), by: reviewer, action: 'REJECTED', note: 'Image is blurred' }] : []),
      ],
    })
  }

  vehicles.forEach((v, i) => {
    const label = v.vehicleNumber
    const reg = { vehicleRegistrationNumber: v.vehicleNumber, name: v.ownerName }
    addDoc({ code: 'VEH_RC', entityType: 'vehicle', entityId: v.id, entityLabel: label, number: `RC${pad(330001 + i * 913, 8)}`, issue: day(dayjs(v.registrationExpiry).subtract(15, 'year')), expiry: v.registrationExpiry, status: 'VERIFIED', fields: reg, days: 120 - i })
    addDoc({ code: 'VEH_INSURANCE', entityType: 'vehicle', entityId: v.id, entityLabel: label, number: v.insurancePolicyNumber, issue: day(dayjs(v.insuranceExpiry).subtract(1, 'year')), expiry: v.insuranceExpiry, status: i === 3 ? 'PENDING_REVIEW' : 'VERIFIED', fields: reg, days: 60 - i })
    addDoc({ code: 'VEH_PUC', entityType: 'vehicle', entityId: v.id, entityLabel: label, number: `PUC/${pad(77100 + i * 31, 6)}`, issue: day(dayjs(v.pollutionExpiry).subtract(6, 'month')), expiry: v.pollutionExpiry, status: i === 6 ? 'OCR_COMPLETED' : i === 8 ? 'PENDING_OCR' : 'VERIFIED', fields: { vehicleRegistrationNumber: v.vehicleNumber }, days: 40 - (i % 20) })
    if (i % 3 !== 2) addDoc({ code: 'VEH_FITNESS', entityType: 'vehicle', entityId: v.id, entityLabel: label, number: `FC-${pad(5100 + i, 5)}`, issue: day(dayjs(v.fitnessExpiry).subtract(2, 'year')), expiry: v.fitnessExpiry, status: i === 4 ? 'REJECTED' : 'VERIFIED', fields: { vehicleRegistrationNumber: v.vehicleNumber }, days: 90 - i })
  })
  drivers.forEach((d, i) => {
    addDoc({ code: 'DRV_LICENSE', entityType: 'driver', entityId: d.id, entityLabel: d.name, number: d.licenseNumber, issue: day(dayjs(d.licenseExpiry).subtract(20, 'year')), expiry: d.licenseExpiry, status: i === 5 ? 'PENDING_REVIEW' : 'VERIFIED', fields: { licenseNumber: d.licenseNumber, name: d.name, address: d.address || '' }, days: 150 - i * 3, by: d.userId || 'u-admin' })
    if (i % 2 === 0) addDoc({ code: 'DRV_MEDICAL', entityType: 'driver', entityId: d.id, entityLabel: d.name, number: `MED-${pad(2200 + i, 5)}`, issue: day(dayjs(d.medicalExpiry).subtract(1, 'year')), expiry: d.medicalExpiry, status: 'VERIFIED', fields: { name: d.name }, days: 80 - i })
    if (i === 1) addDoc({ code: 'DRV_ID', entityType: 'driver', entityId: d.id, entityLabel: d.name, number: 'XXXX-XXXX-4821', status: 'OCR_COMPLETED', fields: { name: d.name }, days: 3 })
  })
  customers.slice(0, 6).forEach((c, i) => {
    addDoc({ code: 'GST_CERT', entityType: 'customer', entityId: c.id, entityLabel: c.name, number: c.gstNumber, issue: day(now.subtract(3 + i, 'year')), status: i === 2 ? 'PENDING_REVIEW' : i === 5 ? 'PENDING_OCR' : 'VERIFIED', fields: { gstNumber: c.gstNumber, customerName: c.name, address: [c.addressLine1, c.city].filter(Boolean).join(', ') }, days: 100 - i * 9, by: 'u-cs', reviewer: 'u-cs' })
  })
  notes.slice(0, 4).forEach((n, i) => {
    addDoc({ code: 'DELIVERY_PROOF', entityType: 'deliveryNote', entityId: n.id, entityLabel: n.noteNumber, number: n.noteNumber, issue: String(n.deliveryDate).slice(0, 10), status: 'VERIFIED', fields: { customerName: n.customerName }, days: 12 - i, by: 'u-driver', reviewer: 'u-dispatcher' })
  })
  addDoc({ code: 'PURCHASE_PROOF', entityType: 'vendor', entityId: '', entityLabel: 'Sri Murugan Cold Storage', number: 'SMC/26/0412', issue: day(now.subtract(9, 'day')), status: 'PENDING_REVIEW', fields: { invoiceNumber: 'SMC/26/0412', vendorName: 'Sri Murugan Cold Storage', totalAmount: 48260, gstNumber: '33AAJFS4521K1Z2', invoiceDate: day(now.subtract(10, 'day')) }, days: 9, by: 'u-finance' })

  /* ---------- invoices ---------- */
  const invoiceTemplates = buildInvoiceTemplates(now)
  const settings = { ...DEFAULT_INVOICE_SETTINGS, year: now.year() }
  const delivered = orders.filter((o) => o.orderStatus === 'DELIVERED' && o.deliveryNoteId).sort((a, b) => (a.deliveredAt < b.deliveredAt ? -1 : 1)).slice(0, 5)
  const C = Object.fromEntries(customers.map((c) => [c.id, c]))
  const invoices = delivered.map((o, i) => {
    const note = notes.find((n) => n.id === o.deliveryNoteId) || null
    const n = settings.startingNumber + i
    const at = dayjs(o.deliveredAt || now).add(4, 'hour')
    return buildInvoiceRecord({
      id: `inv-${pad(n, 4)}`, invoiceNumber: formatInvoiceNumber(settings, n), sequence: n, order: o, customer: C[o.customerId], products, hub: H[o.hubId],
      dispatch: dispatches.find((d) => d.id === note?.dispatchId) || null, note, template: invoiceTemplates[0],
      options: { quantityBasis: 'DELIVERED', shippingCharges: i === 1 ? 750 : 0, orderDiscount: i === 2 ? { type: 'PERCENT', value: 2 } : { type: 'NONE', value: 0 }, invoiceDate: day(at), dueDate: day(at.add(30, 'day')) },
      user: { id: 'u-finance', name: 'Anitha Rao' }, now: iso(at),
    })
  })
  const invoiceSettings = { ...settings, lastNumber: settings.startingNumber + invoices.length - 1 }
  if (!invoices.length) invoiceSettings.lastNumber = 0

  /* ---------- email ---------- */
  const emailTemplates = EMAIL_TEMPLATE_DEFS.map(([code, name, subject, body], i) => ({ id: `et-${code.toLowerCase().replace(/_/g, '-')}`, code, name, subject, body, active: true, builtIn: true, createdAt: iso(now.subtract(90 - i, 'day')), updatedAt: iso(now.subtract(90 - i, 'day')) }))
  const recentOrders = orders.filter((o) => o.orderNumber).slice(-12)
  const ref = (o) => ({ customerId: o.customerId, orderId: o.id })
  const fill = (s, o, extra = {}) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => ({ customer_name: o.customerName, order_number: o.orderNumber, amount: formatMoney(o.totalAmount), ...extra }[k] ?? m))
  const emailHistory = recentOrders.slice(0, 7).map((o, i) => {
    const t = emailTemplates[i % 2 === 0 ? 0 : 1]
    const at = now.subtract(1 + i * 2, 'day')
    const failed = i === 4
    return {
      id: `em-${pad(i + 1, 4)}`, to: [C[o.customerId]?.email || 'customer@example.demo'], cc: [], bcc: [], subject: fill(t.subject, o), body: fill(t.body, o), templateId: t.id,
      ...ref(o), invoiceId: null, deliveryNoteId: null, attachments: [], status: failed ? 'FAILED_DEMO' : 'SENT_DEMO', mode: 'DEMO', provider: 'demo',
      error: failed ? 'Simulated failure: recipient mailbox rejected (demo).' : '', createdBy: 'u-cs', createdAt: iso(at), sentAt: failed ? null : iso(at.add(1, 'minute')), automated: false, events: [{ at: iso(at), status: 'QUEUED_DEMO' }, { at: iso(at.add(1, 'minute')), status: failed ? 'FAILED_DEMO' : 'SENT_DEMO' }],
    }
  })
  const emailDrafts = recentOrders.slice(7, 9).map((o, i) => ({
    id: `ed-${pad(i + 1, 4)}`, to: [C[o.customerId]?.email || ''], cc: [], bcc: [], subject: fill(emailTemplates[3].subject, o), body: fill(emailTemplates[3].body, o, { dispatch_number: '(to be planned)', driver_name: '(to be assigned)', delivery_date: day(now.add(1, 'day')) }),
    templateId: emailTemplates[3].id, ...ref(o), invoiceId: null, deliveryNoteId: null, attachments: [], status: 'DRAFT', createdBy: 'u-cs', createdAt: iso(now.subtract(i + 1, 'hour')), updatedAt: iso(now.subtract(i + 1, 'hour')),
  }))
  const emailInbox = INBOX.map(([fromName, from, subject, body, hoursAgo, read], i) => {
    const c = customers.find((x) => x.name === fromName)
    return { id: `in-${pad(i + 1, 4)}`, folder: i === 6 ? 'Archive' : 'INBOX', fromName, from, to: ['operations@bellomassi.demo'], subject, body, receivedAt: iso(now.subtract(hoursAgo, 'hour')), read, starred: i === 0, customerId: c?.id || null, demo: true }
  })

  /* ---------- WhatsApp ---------- */
  const whatsappTemplates = WA_TEMPLATE_DEFS.map(([code, name, body], i) => ({ id: `wt-${code.toLowerCase().replace(/_/g, '-')}`, code, name, body, active: true, builtIn: true, createdAt: iso(now.subtract(80 - i, 'day')), updatedAt: iso(now.subtract(80 - i, 'day')) }))
  const doneDeliveries = deliveries.filter((d) => d.status === 'DELIVERED').slice(-6)
  const whatsappMessages = doneDeliveries.map((d, i) => {
    const t = whatsappTemplates[i % 2 === 0 ? 5 : 4]
    const at = dayjs(d.completedAt || d.updatedAt || now).subtract(i % 2 === 0 ? 0 : 1, 'hour')
    const failed = i === 3
    const mobile = String(d.customerMobile || '').replace(/\D/g, '').slice(-10)
    return {
      id: `wa-${pad(i + 1, 4)}`, recipient: mobile ? `+91${mobile}` : '', customerId: d.customerId, templateId: t.id,
      body: t.body.replace('{{customer_name}}', d.customerName).replace('{{order_number}}', d.orderNumber).replace('{{delivery_note_number}}', d.deliveryNoteNumber || '').replace('{{driver_name}}', dispatches.find((x) => x.id === d.dispatchId)?.driverName || 'our driver'),
      orderId: d.orderId, dispatchId: d.dispatchId, invoiceId: null, deliveryNoteId: d.deliveryNoteId || null, status: failed ? 'FAILED_DEMO' : 'SENT_DEMO', mode: 'DEMO', provider: 'demo',
      error: failed ? 'Simulated failure: number is not on WhatsApp (demo).' : '', providerMessageId: null, createdBy: 'u-dispatcher', createdAt: iso(at), sentAt: failed ? null : iso(at), automated: i % 2 === 0,
    }
  })

  /* ---------- automation ---------- */
  const notificationTemplates = RULES.map(([event, recipientRule, channel, emailCode, waCode, enabled]) => ({
    id: `nt-${event.toLowerCase().replace(/_/g, '-')}`, event, recipientRule, channel, enabled,
    emailTemplateId: `et-${emailCode.toLowerCase().replace(/_/g, '-')}`, whatsappTemplateId: `wt-${waCode.toLowerCase().replace(/_/g, '-')}`, updatedAt: iso(now.subtract(20, 'day')),
  }))
  const notificationHistory = whatsappMessages.filter((m) => m.automated).map((m, i) => ({
    id: `nh-${pad(i + 1, 4)}`, event: 'DELIVERY_COMPLETED', dedupeKey: `DELIVERY_COMPLETED:${deliveries.find((d) => d.orderId === m.orderId)?.id || m.orderId}`, entityType: 'order', entityId: m.orderId,
    channel: 'WHATSAPP', recipient: m.recipient, mode: 'DEMO', status: m.status, messageIds: [m.id], createdAt: m.createdAt, note: 'Seeded demo automation',
  }))

  return {
    vehicles, drivers, documentTypes, documents, ocrResults,
    invoiceTemplates, invoices, invoiceSettings,
    emailTemplates, emailDrafts, emailHistory, emailInbox, emailSettings: { ...DEFAULT_EMAIL_SETTINGS },
    whatsappTemplates, whatsappMessages, openwaSettings: { ...DEFAULT_OPENWA_SETTINGS, sessionStatus: 'demo_ready', lastConnectedAt: iso(now.subtract(2, 'day')), lastCheckedAt: iso(now.subtract(2, 'day')) },
    communicationSettings: { ...DEFAULT_COMMUNICATION_SETTINGS }, notificationTemplates, notificationHistory,
    vmsSettings: { ...DEFAULT_VMS_SETTINGS },
  }
}
