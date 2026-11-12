/** Phase 5 — email, WhatsApp and automated notification configuration. */

/** Message status. Demo statuses are separate values so a simulated send is never shown as a real one. */
export const MESSAGE_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  QUEUED: 'QUEUED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  QUEUED_DEMO: 'QUEUED_DEMO',
  SENT_DEMO: 'SENT_DEMO',
  FAILED_DEMO: 'FAILED_DEMO',
})
export const MESSAGE_STATUS_META = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  QUEUED: { label: 'Queued', tone: 'info' },
  SENDING: { label: 'Sending', tone: 'info' },
  SENT: { label: 'Sent (accepted by provider)', tone: 'success' },
  DELIVERED: { label: 'Delivered (provider confirmed)', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
  QUEUED_DEMO: { label: 'Queued · demo', tone: 'warning' },
  SENT_DEMO: { label: 'Sent · demo (not sent)', tone: 'warning' },
  FAILED_DEMO: { label: 'Failed · demo', tone: 'danger' },
}
export const FAILED_STATUSES = ['FAILED', 'FAILED_DEMO']
export const SENT_STATUSES = ['SENT', 'DELIVERED', 'SENT_DEMO']

export const ENCRYPTION_OPTIONS = [
  { value: 'SSL', label: 'SSL / TLS (implicit)' },
  { value: 'STARTTLS', label: 'STARTTLS' },
  { value: 'NONE', label: 'None (demo only)' },
]

/** Template variables (both channels). */
export const TEMPLATE_VARIABLES = [
  { key: 'customer_name', label: 'Customer name', sample: 'ABC Enterprises' },
  { key: 'order_number', label: 'Order number', sample: 'BM-ORD-2026-00016' },
  { key: 'dispatch_number', label: 'Dispatch number', sample: 'BM-DSP-2026-00016' },
  { key: 'driver_name', label: 'Driver name', sample: 'Murugan Selvam' },
  { key: 'invoice_number', label: 'Invoice number', sample: 'BM-INV-2026-00001' },
  { key: 'delivery_note_number', label: 'Delivery note number', sample: 'BM-DN-2026-00016' },
  { key: 'amount', label: 'Amount', sample: 'AED 110,829.60' },
  { key: 'delivery_date', label: 'Delivery date', sample: '11 Nov 2026' },
  { key: 'otp', label: 'OTP', sample: '••••••' },
  { key: 'document_name', label: 'Document', sample: 'Vehicle Insurance — TN 01 BX 4521' },
  { key: 'expiry_date', label: 'Expiry date', sample: '30 Nov 2026' },
  { key: 'reason', label: 'Reason', sample: 'Credit limit exceeded' },
]

/** Workflow events the automation engine listens to. */
export const NOTIFICATION_EVENTS = [
  { value: 'ORDER_CREATED', label: 'Order created (submitted)' },
  { value: 'ORDER_APPROVED', label: 'Order approved' },
  { value: 'ORDER_REJECTED', label: 'Order rejected' },
  { value: 'ORDER_READY', label: 'Order ready for dispatch' },
  { value: 'DISPATCH_ASSIGNED', label: 'Dispatch assigned' },
  { value: 'DELIVERY_STARTED', label: 'Delivery started' },
  { value: 'DELIVERY_COMPLETED', label: 'Delivery completed' },
  { value: 'DELIVERY_FAILED', label: 'Delivery failed' },
  { value: 'INVOICE_GENERATED', label: 'Invoice generated' },
  { value: 'DOCUMENT_EXPIRING', label: 'Document expiring' },
  { value: 'DOCUMENT_EXPIRED', label: 'Document expired' },
]
export const EVENT_LABEL = Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e.value, e.label]))

export const CHANNELS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'BOTH', label: 'Email + WhatsApp' },
]
export const RECIPIENT_RULES = [
  { value: 'CUSTOMER', label: 'Customer contact' },
  { value: 'SALESMAN', label: 'Order salesman' },
  { value: 'OPERATIONS', label: 'Operations team (Admin / Dispatcher)' },
  { value: 'ENTITY_OWNER', label: 'Document owner (driver / vehicle hub)' },
]

export const DEFAULT_COUNTRY_CODE = '91'
export const COUNTRY_CODES = [
  { value: '91', label: '+91 India' },
  { value: '971', label: '+971 UAE' },
  { value: '65', label: '+65 Singapore' },
  { value: '1', label: '+1 US / Canada' },
  { value: '44', label: '+44 UK' },
]

export const DEFAULT_EMAIL_SETTINGS = {
  smtp: { host: '', port: 587, username: '', encryption: 'STARTTLS', fromEmail: '', fromName: 'Bellomassi Operations', replyTo: '' },
  imap: { host: '', port: 993, username: '', encryption: 'SSL', folder: 'INBOX' },
  smtpStatus: { state: 'NOT_TESTED', checkedAt: null, message: '' },
  imapStatus: { state: 'NOT_TESTED', checkedAt: null, message: '' },
  inboxConnected: false,
  inboxConnectedAt: null,
  lastSyncAt: null,
}
export const DEFAULT_OPENWA_SETTINGS = {
  baseUrl: '', apiEndpoint: '/api', sessionName: 'bellomassi', countryCode: DEFAULT_COUNTRY_CODE,
  mode: 'DEMO', sessionStatus: 'not_started', lastConnectedAt: null, lastCheckedAt: null, qrStatus: 'none', lastError: '',
}
export const DEFAULT_COMMUNICATION_SETTINGS = { automationEnabled: true, demoSendDelayMs: 400 }
