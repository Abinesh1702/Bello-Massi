/** Order option lists and workflow vocabulary (centralised so the client can tune them). */
const opts = (values) => values.map((v) => ({ value: v, label: v }))

export const ORDER_TYPES = ['Standard', 'Bulk', 'Urgent Replenishment', 'Sample']
export const ORDER_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent']
export const PAYMENT_TERMS = ['Credit', 'Cash on Delivery', 'Advance Payment']
export const ORDER_SOURCES = [
  { value: 'call', label: 'Phone call' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'customer_app', label: 'Customer app' },
  { value: 'visit', label: 'Field visit' },
]

export const REJECTION_REASONS = ['Credit limit exceeded', 'Duplicate order', 'Customer cancelled', 'Pricing not approved', 'Stock not available', 'Other']
export const CANCEL_ORDER_REASONS = ['Customer cancelled', 'Duplicate order', 'Stock not available', 'Pricing or credit issue', 'Delivery not possible', 'Other']
export const RETURN_REASONS = ['Quantity needs confirmation', 'Pricing or discount correction', 'Reduce order value (credit)', 'Delivery details incomplete', 'Wrong product selected', 'Other']

/** Which form section a return reason asks the salesman to fix (highlighted on the edit screen). */
export const RETURN_REASON_SECTIONS = {
  'Quantity needs confirmation': ['items'],
  'Pricing or discount correction': ['items'],
  'Reduce order value (credit)': ['items', 'summary'],
  'Delivery details incomplete': ['delivery'],
  'Wrong product selected': ['items'],
  Other: [],
}

export const PRIORITY_TONE = { Low: 'neutral', Normal: 'info', High: 'warning', Urgent: 'danger' }

export const TIMELINE_EVENTS = {
  DRAFT_CREATED: 'Draft created',
  CHANGE_APPLIED: 'Approved change applied',
  CANCELLED: 'Order cancelled',
  ORDER_UPDATED: 'Order updated',
  SUBMITTED: 'Order submitted',
  APPROVED: 'Order approved',
  REJECTED: 'Order rejected',
  RETURNED: 'Returned for correction',
  RESUBMITTED: 'Order resubmitted',
  CONSOLIDATED: 'Order consolidated',
  READY_FOR_DISPATCH: 'Ready for dispatch',
  DUPLICATED: 'Duplicated as new draft',
  STOCK_RESERVED: 'Stock reserved at hub',
  STOCK_RELEASED: 'Stock reservation released',
  // Phase 4 — dispatch & delivery
  PLANNED: 'Planned in delivery zone',
  ADDED_TO_DISPATCH: 'Added to dispatch plan',
  REMOVED_FROM_DISPATCH: 'Removed from dispatch plan',
  DISPATCHED: 'Dispatched from hub',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered (OTP confirmed)',
  PARTIALLY_DELIVERED: 'Partially delivered (OTP confirmed)',
  DELIVERY_FAILED: 'Delivery failed',
  DELIVERY_PROBLEM: 'Delivery problem reported',
  RETURNED_TO_HUB: 'Undelivered goods returned to hub',
  REQUEUED_FOR_DISPATCH: 'Back in the ready-for-dispatch queue',
  DISPATCH_CANCELLED: 'Dispatch cancelled — back in queue',
}

export const ORDER_OPTIONS = {
  types: opts(ORDER_TYPES),
  priorities: opts(ORDER_PRIORITIES),
  paymentTerms: opts(PAYMENT_TERMS),
  sources: ORDER_SOURCES,
  rejectionReasons: opts(REJECTION_REASONS),
  returnReasons: opts(RETURN_REASONS),
  cancelReasons: opts(CANCEL_ORDER_REASONS),
}
