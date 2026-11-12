/**
 * Option lists for master data. Centralised so they can be tuned to Bellomassi's
 * real catalogue without touching pages or services.
 * Product categories/units include the Phase 2 spec list plus food-distribution
 * entries (Frozen Food, Chilled Food, CTN) used by Bellomassi's catalogue.
 */
const opts = (values) => values.map((v) => ({ value: v, label: v }))

export const CUSTOMER_TYPES = ['Retail', 'Wholesale', 'Distributor', 'Corporate', 'Dealer', 'Other']
export const CUSTOMER_STATUSES = ['Active', 'Inactive', 'Blocked']
export const CUSTOMER_CATEGORIES = ['HoReCa', 'Modern Trade', 'General Trade', 'Institutional', 'Catering', 'Cash & Carry']

export const CREDIT_STATUS = {
  WITHIN: 'Within Limit',
  NEAR: 'Near Limit',
  EXCEEDED: 'Limit Exceeded',
  DISABLED: 'Credit Disabled',
}
export const CREDIT_NEAR_THRESHOLD = 80 // % utilisation

export const VIP_STATUS = { ACTIVE: 'Active', EXPIRED: 'Expired', DISABLED: 'Disabled' }

export const PRODUCT_CATEGORIES = ['Frozen Food', 'Chilled Food', 'Industrial', 'Electrical', 'Mechanical', 'Spare Parts', 'Consumables', 'General', 'Other']
export const PRODUCT_STATUSES = ['Active', 'Inactive', 'Discontinued']
export const PRODUCT_TYPES = ['Stockable', 'Consumable', 'Service']
export const UNITS = ['CTN', 'PCS', 'BOX', 'KG', 'LTR', 'MTR', 'SET', 'PACK']
export const TAX_RATES = [0, 5, 12, 18, 28]
export const STORAGE_CONDITIONS = ['Frozen', 'Chilled', 'Ambient']

export const HUB_TYPES = ['Main Hub', 'Regional Hub', 'Branch Hub', 'Distribution Hub', 'Warehouse']
export const HUB_STATUSES = ['Active', 'Inactive']

export const STOCK_STATUS = { IN: 'In Stock', LOW: 'Low Stock', OUT: 'Out of Stock', OVER: 'Overstock' }

export const ADJUSTMENT_TYPES = ['Increase', 'Decrease', 'Damaged', 'Lost', 'Correction']
export const ADJUSTMENT_REASONS = ['Physical Stock Correction', 'Damaged Stock', 'Lost Stock', 'Expired Stock', 'Data Correction', 'Other']

export const TRANSFER_STATUS = { DRAFT: 'Draft', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }

export const MOVEMENT_TYPES = {
  RECEIPT: 'Stock Receipt',
  TRANSFER_IN: 'Stock Transfer In',
  TRANSFER_OUT: 'Stock Transfer Out',
  ADJ_INCREASE: 'Stock Adjustment Increase',
  ADJ_DECREASE: 'Stock Adjustment Decrease',
  DAMAGE: 'Damage',
  LOST: 'Lost Stock',
  DISPATCH: 'Stock Dispatch',
  DISPATCH_REVERSAL: 'Stock Dispatch Reversal',
  DELIVERY_RETURN: 'Delivery Return',
  SCRAP: 'Scrap Write-off',
  // Enterprise expansion (data v9)
  VAN_LOAD: 'Van Stock Load',
  VAN_RETURN: 'Van Stock Return',
  SALES_RETURN: 'Sales Return',
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra', 'Puducherry', 'Tamil Nadu', 'Telangana', 'Delhi', 'Gujarat', 'Other',
]

export const OPTIONS = {
  customerTypes: opts(CUSTOMER_TYPES),
  customerStatuses: opts(CUSTOMER_STATUSES),
  customerCategories: opts(CUSTOMER_CATEGORIES),
  productCategories: opts(PRODUCT_CATEGORIES),
  productStatuses: opts(PRODUCT_STATUSES),
  productTypes: opts(PRODUCT_TYPES),
  units: opts(UNITS),
  taxRates: TAX_RATES.map((t) => ({ value: String(t), label: `${t}%` })),
  storageConditions: opts(STORAGE_CONDITIONS),
  hubTypes: opts(HUB_TYPES),
  hubStatuses: opts(HUB_STATUSES),
  adjustmentTypes: opts(ADJUSTMENT_TYPES),
  adjustmentReasons: opts(ADJUSTMENT_REASONS),
  states: opts(INDIAN_STATES),
  stockStatuses: opts(Object.values(STOCK_STATUS)),
  creditStatuses: opts(Object.values(CREDIT_STATUS)),
  vipStatuses: opts(Object.values(VIP_STATUS)),
  movementTypes: opts(Object.values(MOVEMENT_TYPES)),
  transferStatuses: opts(Object.values(TRANSFER_STATUS)),
}
