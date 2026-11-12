/**
 * Phase 4 — dispatch, fleet and delivery configuration. Option lists and status metadata live here
 * so pages, services and reports stay in step.
 */
const opts = (values) => values.map((v) => ({ value: v, label: v }))

export const DISPATCH_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PLANNED: 'PLANNED',
  ASSIGNED: 'ASSIGNED',
  CONFIRMED: 'CONFIRMED',
  IN_TRANSIT: 'IN_TRANSIT',
  PARTIALLY_DELIVERED: 'PARTIALLY_DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
})

export const DISPATCH_STATUS_META = {
  DRAFT: { label: 'Draft', tone: 'neutral', step: 0 },
  PLANNED: { label: 'Planned', tone: 'info', step: 1 },
  ASSIGNED: { label: 'Assigned', tone: 'brand', step: 2 },
  CONFIRMED: { label: 'Confirmed', tone: 'accent', step: 3 },
  IN_TRANSIT: { label: 'In transit', tone: 'warning', step: 4 },
  PARTIALLY_DELIVERED: { label: 'Closed with exceptions', tone: 'danger', step: 5 },
  COMPLETED: { label: 'Completed', tone: 'success', step: 5 },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', step: -1 },
}

/** Dispatches that hold their orders, driver and vehicle. */
export const ACTIVE_DISPATCH_STATUSES = ['DRAFT', 'PLANNED', 'ASSIGNED', 'CONFIRMED', 'IN_TRANSIT']
/** Dispatches that occupy a driver and vehicle. */
export const RESOURCE_DISPATCH_STATUSES = ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT']
/** Still editable (orders, sequence, driver, vehicle) — nothing has left the warehouse. */
export const EDITABLE_DISPATCH_STATUSES = ['DRAFT', 'PLANNED', 'ASSIGNED']

export const DELIVERY_STATUS = Object.freeze({
  DISPATCHED: 'DISPATCHED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  PARTIALLY_DELIVERED: 'PARTIALLY_DELIVERED',
  FAILED: 'FAILED',
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED',
})

export const DELIVERY_STATUS_META = {
  DISPATCHED: { label: 'Dispatched', tone: 'info' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', tone: 'accent' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
  PARTIALLY_DELIVERED: { label: 'Partially delivered', tone: 'warning' },
  FAILED: { label: 'Delivery failed', tone: 'danger' },
  RETURNED: { label: 'Returned to hub', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
}

/** A delivery outcome has been recorded — the stop is closed for the driver. */
export const TERMINAL_DELIVERY_STATUSES = ['DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED']
export const PENDING_DELIVERY_STATUSES = ['DISPATCHED', 'OUT_FOR_DELIVERY']

export const FAILURE_REASONS = ['Customer Not Available', 'Customer Refused', 'Customer Requested Reschedule', 'Incorrect Address', 'Damaged Goods', 'Partial Delivery', 'Other']
export const CANCEL_REASONS = ['Vehicle breakdown', 'Driver unavailable', 'Customer requested reschedule', 'Stock issue at hub', 'Planning error', 'Other']

export const ZONE_STATUSES = ['Active', 'Inactive']
export const DRIVER_STATUSES = ['Active', 'Inactive']
export const DRIVER_AVAILABILITY = ['Available', 'Assigned', 'On Delivery', 'Offline']
export const VEHICLE_TYPES = ['Bike', 'Van', 'Mini Truck', 'Truck', 'Heavy Vehicle', 'Other']
export const VEHICLE_STATUSES = ['Available', 'Assigned', 'In Transit', 'Maintenance', 'Inactive']
/** Capacity is compared with the dispatch's total ordered quantity (all units). */
export const CAPACITY_UNITS = ['Units', 'Cartons']

export const AVAILABILITY_TONE = { Available: 'success', Assigned: 'brand', 'On Delivery': 'accent', Offline: 'neutral' }
export const VEHICLE_STATUS_TONE = { Available: 'success', Assigned: 'brand', 'In Transit': 'accent', Maintenance: 'warning', Inactive: 'neutral' }
export const ACTIVE_TONE = { Active: 'success', Inactive: 'neutral' }

/** Days before expiry when a driving licence is flagged. */
export const LICENSE_WARNING_DAYS = 30

/** Simulated OTP — no SMS, WhatsApp or other provider is contacted. */
export const OTP_CONFIG = { length: 6, maxAttempts: 5, defaultExpiryMinutes: 10, minExpiryMinutes: 1, maxExpiryMinutes: 60 }
export const OTP_STATUS = { ACTIVE: 'ACTIVE', VERIFIED: 'VERIFIED', EXPIRED: 'EXPIRED', INVALIDATED: 'INVALIDATED', LOCKED: 'LOCKED' }
export const OTP_STATUS_META = {
  ACTIVE: { label: 'Awaiting entry', tone: 'info' },
  VERIFIED: { label: 'Verified', tone: 'success' },
  EXPIRED: { label: 'Expired', tone: 'warning' },
  INVALIDATED: { label: 'Replaced', tone: 'neutral' },
  LOCKED: { label: 'Locked — too many attempts', tone: 'danger' },
  NONE: { label: 'Not generated', tone: 'neutral' },
}

export const DISPATCH_EVENTS = {
  DISPATCH_CREATED: 'Dispatch created',
  DISPATCH_PLANNED: 'Dispatch planned',
  DISPATCH_UPDATED: 'Dispatch plan updated',
  DRIVER_ASSIGNED: 'Driver assigned',
  VEHICLE_ASSIGNED: 'Vehicle assigned',
  SEQUENCE_UPDATED: 'Delivery sequence updated',
  DISPATCH_CONFIRMED: 'Dispatch confirmed — stock deducted',
  DISPATCH_STARTED: 'Dispatch started',
  DELIVERY_STARTED: 'Delivery started',
  DRIVER_ARRIVED: 'Driver arrived at customer',
  OTP_GENERATED: 'Delivery OTP generated (simulated)',
  DELIVERY_COMPLETED: 'Delivery completed',
  PARTIAL_DELIVERY: 'Partial delivery recorded',
  DELIVERY_FAILED: 'Delivery failed',
  DELIVERY_NOTE_GENERATED: 'Delivery note generated',
  DELIVERY_REVIEWED: 'Delivery exception reviewed',
  STOCK_RETURNED: 'Undelivered stock returned to hub',
  DISPATCH_COMPLETED: 'Dispatch completed',
  DISPATCH_CANCELLED: 'Dispatch cancelled',
  STOCK_REVERSED: 'Dispatch stock reversed',
}

export const DISPATCH_OPTIONS = {
  zoneStatuses: opts(ZONE_STATUSES),
  driverStatuses: opts(DRIVER_STATUSES),
  driverAvailability: opts(DRIVER_AVAILABILITY),
  vehicleTypes: opts(VEHICLE_TYPES),
  vehicleStatuses: opts(VEHICLE_STATUSES),
  capacityUnits: opts(CAPACITY_UNITS),
  failureReasons: opts(FAILURE_REASONS),
  cancelReasons: opts(CANCEL_REASONS),
  dispatchStatuses: Object.entries(DISPATCH_STATUS_META).map(([value, m]) => ({ value, label: m.label })),
  deliveryStatuses: Object.entries(DELIVERY_STATUS_META).map(([value, m]) => ({ value, label: m.label })),
}
