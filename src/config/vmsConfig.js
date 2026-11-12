/** Phase 5 — Vehicle Management System options. Extends the Phase 4 fleet configuration. */
const opts = (values) => values.map((v) => ({ value: v, label: v }))

export const VEHICLE_CATEGORIES = ['Refrigerated', 'Insulated', 'Dry cargo', 'Two-wheeler', 'Other']
export const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric', 'Hybrid']
export const OWNERSHIP_TYPES = ['Owned', 'Leased', 'Hired', 'Contracted']

/** Vehicle compliance dates kept on the vehicle record (synced from verified documents). */
export const VEHICLE_EXPIRY_FIELDS = [
  { field: 'registrationExpiry', label: 'Registration (RC)', docCode: 'VEH_RC' },
  { field: 'insuranceExpiry', label: 'Insurance', docCode: 'VEH_INSURANCE' },
  { field: 'pollutionExpiry', label: 'Pollution (PUC)', docCode: 'VEH_PUC' },
  { field: 'fitnessExpiry', label: 'Fitness certificate', docCode: 'VEH_FITNESS' },
  { field: 'permitExpiry', label: 'Permit', docCode: 'VEH_PERMIT' },
]
export const DRIVER_EXPIRY_FIELDS = [
  { field: 'licenseExpiry', label: 'Driving licence', docCode: 'DRV_LICENSE' },
  { field: 'medicalExpiry', label: 'Medical certificate', docCode: 'DRV_MEDICAL' },
]

/** Expiry categories, most urgent first. */
export const EXPIRY_STATE = Object.freeze({ EXPIRED: 'EXPIRED', TODAY: 'TODAY', WEEK: 'WEEK', MONTH: 'MONTH', VALID: 'VALID', MISSING: 'MISSING' })
export const EXPIRY_META = {
  EXPIRED: { label: 'Expired', tone: 'danger', rank: 0 },
  TODAY: { label: 'Expires today', tone: 'danger', rank: 1 },
  WEEK: { label: 'Within 7 days', tone: 'warning', rank: 2 },
  MONTH: { label: 'Within 30 days', tone: 'accent', rank: 3 },
  VALID: { label: 'Valid', tone: 'success', rank: 4 },
  MISSING: { label: 'Not on record', tone: 'neutral', rank: 5 },
}

/** Default compliance policy — Admin can change it at /vms/settings. */
export const DEFAULT_VMS_SETTINGS = {
  requiredVehicleDocs: ['VEH_RC', 'VEH_INSURANCE', 'VEH_FITNESS'],
  requiredDriverDocs: ['DRV_LICENSE'],
  /** Expired required document blocks assignment (critical — always on). */
  blockOnExpired: true,
  /** Also block when a required document expires within warningDays of the dispatch date. */
  blockOnWarning: false,
  warningDays: 7,
  /** Block when a required compliance date is not on record at all. */
  blockOnMissing: false,
}

export const VMS_OPTIONS = {
  categories: opts(VEHICLE_CATEGORIES),
  fuelTypes: opts(FUEL_TYPES),
  ownership: opts(OWNERSHIP_TYPES),
  expiryStates: Object.entries(EXPIRY_META).map(([value, m]) => ({ value, label: m.label })),
}
