/** Product master data. */
import storage from './storageService'
import { logActivity } from './activityService'
import { STORAGE_KEYS } from '../utils/constants'
import { uid } from '../utils/helpers'
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES, PRODUCT_TYPES, UNITS } from '../config/masterData'
import { clean, nextCode, nonNegative, num, required } from './validation'
import { formatMoney } from '../utils/formatters'
import { getInventoryConfig } from '../config/runtimeConfig'

const KEY = STORAGE_KEYS.PRODUCTS

export const getProducts = () => storage.getItem(KEY, []) || []
export const getProductById = (id, list = getProducts()) => list.find((p) => p.id === id) || null

export const STATUS_TONE = { Active: 'success', Inactive: 'neutral', Discontinued: 'danger' }
/** Units that may be stocked in fractions (e.g. 12.5 KG). */
export const DECIMAL_UNITS = ['KG', 'LTR', 'MTR']

export const nextProductCode = () => nextCode('PRD', getProducts().map((p) => p.code), 4)

export const emptyProduct = () => ({
  code: nextProductCode(), name: '', category: 'Frozen Food', description: '', brand: '', status: 'Active',
  sku: '', barcode: '', unit: 'CTN', packSize: '', productType: 'Stockable', storageCondition: 'Frozen',
  sellingPrice: '', purchasePrice: '', taxPercent: '5', discountAllowed: false, maxDiscountPercent: '',
  // Stock levels default from Application Settings › Inventory.
  trackInventory: true, minStockLevel: String(getInventoryConfig().defaultMinimumStock ?? 0), maxStockLevel: String(getInventoryConfig().defaultMaximumStock ?? ''), reorderLevel: String(getInventoryConfig().defaultReorderLevel ?? 0), allowNegativeStock: false,
  image: null, notes: '',
})

const stockQuantityFor = (productId) =>
  (storage.getItem(STORAGE_KEYS.INVENTORY, []) || []).filter((r) => r.productId === productId).reduce((s, r) => s + (r.totalQuantity || 0), 0)

export const validateProduct = (input, { id = null } = {}) => {
  const e = {}
  const list = getProducts()
  const set = (f, m) => { if (m && !e[f]) e[f] = m }
  set('name', required(input.name, 'Product name'))
  set('code', required(input.code, 'Product code'))
  if (input.code && !/^[A-Z0-9-]{3,20}$/i.test(clean(input.code))) set('code', 'Use 3–20 letters, numbers or hyphens.')
  if (input.code && list.some((p) => p.id !== id && p.code.toLowerCase() === clean(input.code).toLowerCase())) set('code', 'This product code is already used.')
  set('sku', required(input.sku, 'SKU'))
  if (input.sku && list.some((p) => p.id !== id && p.sku.toLowerCase() === clean(input.sku).toLowerCase())) set('sku', 'This SKU is already used by another product.')
  if (input.barcode && !/^\d{8,14}$/.test(clean(input.barcode))) set('barcode', 'Barcode must be 8–14 digits.')
  if (input.barcode && list.some((p) => p.id !== id && p.barcode && p.barcode === clean(input.barcode))) set('barcode', 'This barcode is already used.')
  if (!PRODUCT_CATEGORIES.includes(input.category)) set('category', 'Choose a category.')
  if (!PRODUCT_STATUSES.includes(input.status)) set('status', 'Choose a status.')
  if (!UNITS.includes(input.unit)) set('unit', 'Choose a unit.')
  if (!PRODUCT_TYPES.includes(input.productType)) set('productType', 'Choose a product type.')
  set('sellingPrice', nonNegative(input.sellingPrice, 'Selling price'))
  set('purchasePrice', nonNegative(input.purchasePrice, 'Purchase price'))
  const tax = num(input.taxPercent)
  if (Number.isNaN(tax)) set('taxPercent', 'Tax percentage is required.')
  else if (tax < 0 || tax > 100) set('taxPercent', 'Tax percentage must be between 0 and 100.')
  if (input.discountAllowed) {
    const d = num(input.maxDiscountPercent)
    if (Number.isNaN(d)) set('maxDiscountPercent', 'Enter the maximum discount.')
    else if (d < 0 || d > 100) set('maxDiscountPercent', 'Discount must be between 0 and 100%.')
  }
  if (input.trackInventory) {
    set('minStockLevel', nonNegative(input.minStockLevel, 'Minimum stock'))
    set('reorderLevel', nonNegative(input.reorderLevel, 'Reorder level'))
    set('maxStockLevel', nonNegative(input.maxStockLevel, 'Maximum stock', { requiredField: false }))
    const min = num(input.minStockLevel)
    const max = num(input.maxStockLevel)
    const reorder = num(input.reorderLevel)
    if (!Number.isNaN(max) && max > 0 && !Number.isNaN(min) && max < min) set('maxStockLevel', 'Maximum stock must be greater than minimum stock.')
    if (!Number.isNaN(max) && max > 0 && !Number.isNaN(reorder) && reorder > max) set('reorderLevel', 'Reorder level cannot exceed maximum stock.')
  }
  if (input.productType === 'Service' && input.trackInventory) set('trackInventory', 'Service products cannot track inventory.')
  if (id && !input.trackInventory && stockQuantityFor(id) > 0) set('trackInventory', 'Stock exists for this product. Move or adjust it to zero before turning tracking off.')
  return e
}

const normalise = (input) => ({
  code: clean(input.code).toUpperCase(),
  name: clean(input.name),
  category: input.category,
  description: clean(input.description) || '',
  brand: clean(input.brand) || '',
  status: input.status,
  sku: clean(input.sku).toUpperCase(),
  barcode: clean(input.barcode) || '',
  unit: input.unit,
  packSize: clean(input.packSize) || '',
  productType: input.productType,
  storageCondition: input.storageCondition || 'Ambient',
  sellingPrice: num(input.sellingPrice),
  purchasePrice: num(input.purchasePrice),
  taxPercent: num(input.taxPercent),
  discountAllowed: Boolean(input.discountAllowed),
  maxDiscountPercent: input.discountAllowed ? num(input.maxDiscountPercent) : 0,
  trackInventory: Boolean(input.trackInventory),
  minStockLevel: input.trackInventory ? num(input.minStockLevel) : 0,
  maxStockLevel: input.trackInventory && !Number.isNaN(num(input.maxStockLevel)) ? num(input.maxStockLevel) : 0,
  reorderLevel: input.trackInventory ? num(input.reorderLevel) : 0,
  allowNegativeStock: input.trackInventory ? Boolean(input.allowNegativeStock) : false,
  image: input.image || null,
  notes: clean(input.notes) || '',
})

export const createProduct = (input) => {
  const errors = validateProduct(input)
  if (Object.keys(errors).length) return { ok: false, errors }
  const now = new Date().toISOString()
  const record = { id: uid('prd'), ...normalise(input), createdAt: now, updatedAt: now }
  const res = storage.setItem(KEY, [record, ...getProducts()])
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  logActivity({ type: 'PRODUCT', message: `created product ${record.name} (${record.code})`, entityType: 'product', entityId: record.id })
  return { ok: true, record }
}

export const updateProduct = (id, input) => {
  const existing = getProductById(id)
  if (!existing) return { ok: false, errors: { form: 'This product no longer exists.' } }
  const errors = validateProduct(input, { id })
  if (Object.keys(errors).length) return { ok: false, errors }
  const record = { ...existing, ...normalise(input), updatedAt: new Date().toISOString() }
  const res = storage.setItem(KEY, getProducts().map((p) => (p.id === id ? record : p)))
  if (!res.ok) return { ok: false, errors: { form: res.error } }
  const notes = []
  if (existing.sellingPrice !== record.sellingPrice) notes.push(`price ${formatMoney(existing.sellingPrice)} → ${formatMoney(record.sellingPrice)}`)
  if (existing.status !== record.status) notes.push(`status to ${record.status}`)
  logActivity({ type: 'PRODUCT', message: `updated ${record.name}${notes.length ? ` — ${notes.join(', ')}` : ''}`, entityType: 'product', entityId: id })
  return { ok: true, record }
}

export const getProductDeleteBlockers = (id) => {
  const blockers = []
  const qty = stockQuantityFor(id)
  if (qty > 0) blockers.push(`${qty} units are in stock`)
  const orders = (storage.getItem(STORAGE_KEYS.ORDERS, []) || []).filter((o) => o.items.some((it) => it.productId === id))
  if (orders.length) blockers.push(`${orders.length} order${orders.length === 1 ? '' : 's'} include this product`)
  const moves = (storage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS, []) || []).filter((m) => m.productId === id)
  if (moves.length) blockers.push(`${moves.length} stock movement${moves.length === 1 ? '' : 's'} are recorded`)
  return blockers
}

export const deleteProduct = (id) => {
  const existing = getProductById(id)
  if (!existing) return { ok: false, error: 'This product no longer exists.' }
  const blockers = getProductDeleteBlockers(id)
  if (blockers.length) return { ok: false, error: `${existing.name} cannot be deleted: ${blockers.join('; ')}. Mark it Inactive or Discontinued instead.`, blockers }
  const res = storage.transaction([
    [KEY, getProducts().filter((p) => p.id !== id)],
    [STORAGE_KEYS.INVENTORY, (storage.getItem(STORAGE_KEYS.INVENTORY, []) || []).filter((r) => r.productId !== id)],
  ])
  if (!res.ok) return { ok: false, error: res.error }
  logActivity({ type: 'PRODUCT', message: `deleted product ${existing.name} (${existing.code})`, entityType: 'product', entityId: id })
  return { ok: true }
}

export const searchProducts = (query = '', filters = {}, list = getProducts()) => {
  const q = String(query).trim().toLowerCase()
  return list.filter((p) => {
    if (q && ![p.name, p.code, p.sku, p.barcode, p.brand, p.category].some((v) => String(v || '').toLowerCase().includes(q))) return false
    if (filters.category && p.category !== filters.category) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.tracking === 'tracked' && !p.trackInventory) return false
    if (filters.tracking === 'untracked' && p.trackInventory) return false
    return true
  })
}

const productService = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, searchProducts, validateProduct, nextProductCode, getProductDeleteBlockers }
export default productService
