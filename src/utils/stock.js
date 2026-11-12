/** Pure stock calculations shared by services, seed data and pages. */
import { STOCK_STATUS } from '../config/masterData'

/**
 * Available to sell / allocate = on hand − reserved − damaged − blocked. `qaHoldQuantity` (data v9) is the part of
 * the stock held by batch status — QA hold, quarantine, QA rejected or expired lots — maintained by batchService,
 * so blocked stock can never be ordered, picked or dispatched.
 */
export const getAvailable = (r) => (Number(r?.totalQuantity) || 0) - (Number(r?.reservedQuantity) || 0) - (Number(r?.damagedQuantity) || 0) - (Number(r?.qaHoldQuantity) || 0)

/** Out of Stock → Low Stock → Overstock → In Stock (first match wins). */
export const getStockStatus = (record) => {
  const available = getAvailable(record)
  if (available <= 0) return STOCK_STATUS.OUT
  if (available <= (Number(record.reorderLevel) || 0)) return STOCK_STATUS.LOW
  if (record.maximumStock && record.totalQuantity > record.maximumStock) return STOCK_STATUS.OVER
  return STOCK_STATUS.IN
}

export const STOCK_STATUS_TONE = {
  [STOCK_STATUS.IN]: 'success',
  [STOCK_STATUS.LOW]: 'warning',
  [STOCK_STATUS.OUT]: 'danger',
  [STOCK_STATUS.OVER]: 'info',
}

export const isLowOrOut = (record) => {
  const s = getStockStatus(record)
  return s === STOCK_STATUS.LOW || s === STOCK_STATUS.OUT
}
