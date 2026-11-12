/**
 * Dispatch planning, assignment, confirmation and cancellation (Phase 4).
 *
 * Lifecycle: DRAFT → PLANNED → ASSIGNED → CONFIRMED → IN_TRANSIT → COMPLETED (or PARTIALLY_DELIVERED
 * when some stops failed / were partial), and CANCELLED. Every command:
 *   1. checks the signed-in user's permission,
 *   2. re-reads current storage and validates the transition,
 *   3. writes dispatches, orders, deliveries, stock, movements, fleet status and both timelines in ONE transaction,
 *   4. then raises notifications and activity entries.
 *
 * Stock policy: stock leaves the hub exactly once, when the dispatch is CONFIRMED (Stock Dispatch movements
 * linked to the dispatch and order). Draft / planned / assigned dispatches never touch stock. A confirmed
 * dispatch can be cancelled only before the driver starts, with a controlled reversal recorded once.
 */
import { fireEvent } from './automationService'
import dayjs from 'dayjs'
import storage from './storageService'
import { getCurrentUser } from './authService'
import { pushNotification } from './notificationService'
import { makeTimelineEvent } from './orderTimelineService'
import { makeDispatchEvent, logDispatchActivity } from './dispatchTimelineService'
import { driverAssignmentIssues, syncFleet } from './driverService'
import { vehicleAssignmentIssues } from './vehicleService'
import { STORAGE_KEYS as K, ORDER_STATUS as S } from '../utils/constants'
import { uid } from '../utils/helpers'
import { deductDispatchStock, mergeMovements, reverseDispatchStock } from '../utils/dispatchStock'
import { consumeReservation, reservedQtyFor, restoreReservation } from '../utils/stockReservation'
import { getAvailable } from '../utils/stock'
import { can } from '../config/permissions'
import { ROLES } from '../config/roles'
import {
  ACTIVE_DISPATCH_STATUSES, DISPATCH_STATUS as DS, DELIVERY_STATUS as DL, EDITABLE_DISPATCH_STATUSES, PENDING_DELIVERY_STATUSES,
} from '../config/dispatchConfig'
import { formatDispatchNumber } from './seed/dispatchSeed'
import { isIsoDate } from './validation'
import { scopeOf } from './rbacService'

const read = (key, fallback = []) => storage.getItem(key, fallback) || fallback
const deny = (msg, errors) => ({ ok: false, error: msg, errors: errors || { form: msg } })
const today = () => dayjs().format('YYYY-MM-DD')
const PRIORITY_RANK = { Urgent: 0, High: 1, Normal: 2, Low: 3 }

export const getDispatches = () => read(K.DISPATCHES)
export const getDispatchById = (id, list = getDispatches()) => list.find((d) => d.id === id) || null
export const isActiveDispatch = (d) => Boolean(d) && ACTIVE_DISPATCH_STATUSES.includes(d.status)

/* ------------------------------------------------------------------ */
/* Visibility                                                          */
/* ------------------------------------------------------------------ */

export const canViewDispatch = (user, d) => {
  if (!user || !d) return false
  if (can(user, 'dispatch.view')) return true
  if (scopeOf(user) === ROLES.DRIVER) {
    const driver = read(K.DRIVERS).find((x) => x.userId === user.id)
    return Boolean(driver) && d.driverId === driver.id && d.status !== DS.DRAFT
  }
  return false
}

/* ------------------------------------------------------------------ */
/* Eligibility, totals, sequence                                       */
/* ------------------------------------------------------------------ */

const STATUS_REASON = {
  [S.DRAFT]: 'is a draft and has not been submitted',
  [S.SUBMITTED]: 'is still waiting for Sales Manager approval',
  [S.REJECTED]: 'was rejected',
  [S.RETURNED]: 'was returned for correction',
  [S.APPROVED]: 'is approved but not yet consolidated by Customer Service',
  [S.CONSOLIDATED]: 'is consolidated but not yet released for dispatch',
}

/** Why an order cannot go on a dispatch (null when it can). */
export const orderIneligibility = (order, { dispatchId = null, dispatches = getDispatches() } = {}) => {
  if (!order) return 'This order no longer exists.'
  const label = order.orderNumber || 'This order'
  if (order.orderStatus !== S.READY_FOR_DISPATCH) {
    return STATUS_REASON[order.orderStatus]
      ? `${label} ${STATUS_REASON[order.orderStatus]}. Only orders ready for dispatch can be dispatched.`
      : `${label} has already been dispatched (${order.orderStatus.toLowerCase().replace(/_/g, ' ')}).`
  }
  if (order.dispatchId && order.dispatchId !== dispatchId) {
    const other = getDispatchById(order.dispatchId, dispatches)
    if (isActiveDispatch(other)) return `${label} is already on ${other.dispatchNumber}.`
  }
  if (!String(order.deliveryAddress || '').trim() || !String(order.deliveryPincode || '').trim()) return `${label} has no complete delivery address.`
  return null
}

export const getEligibleOrders = ({ hubId = null, dispatchId = null } = {}, orders = read(K.ORDERS), dispatches = getDispatches()) =>
  orders.filter((o) => (!hubId || o.hubId === hubId) && !orderIneligibility(o, { dispatchId, dispatches }))

/** Ready orders that are not yet on any active plan. */
export const getUnplannedReadyOrders = (orders = read(K.ORDERS), dispatches = getDispatches()) =>
  orders.filter((o) => o.orderStatus === S.READY_FOR_DISPATCH && !(o.dispatchId && isActiveDispatch(getDispatchById(o.dispatchId, dispatches))))

export const computeTotals = (orders) => ({
  totalDeliveries: orders.length,
  totalProducts: new Set(orders.flatMap((o) => o.items.map((it) => it.productId))).size,
  totalLines: orders.reduce((s, o) => s + o.items.length, 0),
  totalQuantity: orders.reduce((s, o) => s + (Number(o.totalQuantity) || 0), 0),
  totalValue: Math.round(orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0) * 100) / 100,
})

/** Suggested route: urgent first, then by pincode (keeps neighbouring stops together), then order number. */
export const suggestSequence = (orders) => [...orders].sort((a, b) =>
  (PRIORITY_RANK[a.orderPriority] ?? 2) - (PRIORITY_RANK[b.orderPriority] ?? 2)
  || String(a.deliveryPincode).localeCompare(String(b.deliveryPincode))
  || String(a.orderNumber).localeCompare(String(b.orderNumber)))

/** Per-line stock coverage at the hub (each order's own reservation counts as available to it). */
export const getStockCheck = (orders, hubId, inventory = read(K.INVENTORY), products = read(K.PRODUCTS)) => {
  const P = Object.fromEntries(products.map((p) => [p.id, p]))
  const need = {}
  orders.forEach((o) => o.items.forEach((it) => {
    const k = it.productId
    need[k] ||= { productId: k, productName: it.productName, unit: it.unit, quantity: 0, reservedForThese: 0, orders: [] }
    need[k].quantity += Number(it.orderedQuantity) || 0
    need[k].reservedForThese += reservedQtyFor(o, it)
    need[k].orders.push(o.orderNumber)
  }))
  return Object.values(need).map((n) => {
    const product = P[n.productId]
    const rec = inventory.find((r) => r.productId === n.productId && r.hubId === hubId)
    const tracked = Boolean(product?.trackInventory)
    const available = rec ? getAvailable(rec) + Math.min(rec.reservedQuantity || 0, n.reservedForThese) : 0
    return { ...n, tracked, available: tracked ? available : null, short: tracked && n.quantity > available && !product?.allowNegativeStock }
  })
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Validate a plan. mode 'draft' needs only a hub; 'plan' needs date, zone and at least one order.
 * Returns { errors, warnings, totals, orders } (orders in the given sequence).
 */
export const validateDispatch = (input, { mode = 'plan', dispatchId = null } = {}) => {
  const errors = {}
  const warnings = []
  const set = (f, m) => { if (m && !errors[f]) errors[f] = m }
  const hubs = read(K.HUBS)
  const zones = read(K.DISPATCH_ZONES)
  const allOrders = read(K.ORDERS)
  const dispatches = getDispatches()
  const hub = hubs.find((h) => h.id === input.hubId)
  if (!hub) set('hubId', 'Select the dispatching hub.')
  else if (hub.status !== 'Active') set('hubId', `${hub.name} is inactive and cannot dispatch.`)

  const ids = [...new Set(input.orderIds || [])]
  if (ids.length !== (input.orderIds || []).length) set('orderIds', 'An order appears twice in the sequence.')
  const orders = ids.map((id) => allOrders.find((o) => o.id === id) || { id, missing: true })
  orders.forEach((o) => {
    if (o.missing) return set('orderIds', 'One of the selected orders no longer exists. Refresh the plan.')
    const why = orderIneligibility(o, { dispatchId, dispatches })
    if (why) set('orderIds', why)
    else if (hub && o.hubId !== hub.id) set('orderIds', `${o.orderNumber} is fulfilled from another hub. All orders on a dispatch must share the same hub.`)
  })
  const valid = orders.filter((o) => !o.missing)
  const totals = computeTotals(valid)

  if (mode === 'plan') {
    if (!input.dispatchDate) set('dispatchDate', 'Choose the dispatch date.')
    else if (!isIsoDate(input.dispatchDate)) set('dispatchDate', 'Enter a valid date.')
    else if (input.dispatchDate < today()) set('dispatchDate', 'The dispatch date cannot be in the past.')
    const zone = zones.find((z) => z.id === input.zoneId)
    if (!zone) set('zoneId', 'Choose the delivery zone.')
    else if (hub && zone.hubId !== hub.id) set('zoneId', 'The zone must belong to the dispatching hub.')
    else if (zone.status !== 'Active') set('zoneId', `${zone.name} is inactive and cannot receive new dispatches.`)
    if (!ids.length) set('orderIds', 'Add at least one order to the dispatch.')
    if (zone) {
      const other = valid.filter((o) => o.zoneId && o.zoneId !== zone.id)
      if (other.length) warnings.push(`${other.length} order${other.length === 1 ? ' is' : 's are'} in a neighbouring zone of the same hub (${other.map((o) => o.orderNumber).slice(0, 3).join(', ')}).`)
    }
  } else if (input.dispatchDate && !isIsoDate(input.dispatchDate)) set('dispatchDate', 'Enter a valid date.')

  const wantsAssignment = Boolean(input.driverId || input.vehicleId)
  if (wantsAssignment && mode === 'plan') {
    if (!input.driverId) set('driverId', 'Select a driver, or clear the vehicle to plan without assigning.')
    if (!input.vehicleId) set('vehicleId', 'Select a vehicle, or clear the driver to plan without assigning.')
    const ctx = { hubId: input.hubId, dispatchDate: input.dispatchDate, dispatchId, load: totals.totalQuantity }
    if (input.driverId) {
      const issues = driverAssignmentIssues(read(K.DRIVERS).find((d) => d.id === input.driverId), ctx, dispatches)
      if (issues.length) set('driverId', issues.map((i) => i.message).join(' '))
    }
    if (input.vehicleId) {
      const issues = vehicleAssignmentIssues(read(K.VEHICLES).find((v) => v.id === input.vehicleId), ctx, dispatches)
      if (issues.length) set('vehicleId', issues.map((i) => i.message).join(' '))
    }
  }
  if (hub && valid.length) {
    const short = getStockCheck(valid, hub.id).filter((l) => l.short)
    if (short.length) warnings.push(`Stock is short for ${short.map((l) => l.productName).slice(0, 3).join(', ')} at ${hub.name}. The dispatch cannot be confirmed until stock is available.`)
  }
  return { errors, warnings, totals, orders: valid }
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

const driverUserId = (driverId) => read(K.DRIVERS).find((d) => d.id === driverId)?.userId || null
export const notifyDispatch = (dispatch, { title, message, type = 'info', roles = null, driverId = null, link }) => {
  const uidTarget = driverId ? driverUserId(driverId) : null
  if (driverId && !uidTarget && !roles) return
  pushNotification({
    title, message, type,
    roles: roles || null,
    userIds: uidTarget ? [uidTarget] : null,
    link: link || (uidTarget && !roles ? '/driver/dashboard' : `/dispatch/${dispatch.id}`),
  })
}

/* ------------------------------------------------------------------ */
/* Commands                                                            */
/* ------------------------------------------------------------------ */

const requireManager = () => {
  const user = getCurrentUser()
  return can(user, 'dispatch.manage') ? user : null
}

const nextDispatchNumber = () => {
  const seq = storage.getItem(K.DISPATCH_SEQUENCE, null) || { year: dayjs().year(), lastNumber: 0 }
  const used = new Set(getDispatches().map((d) => d.dispatchNumber))
  const year = dayjs().year()
  let n = (seq.year === year ? seq.lastNumber : 0) + 1
  while (used.has(formatDispatchNumber(year, n))) n += 1
  return { number: formatDispatchNumber(year, n), sequence: { year, lastNumber: n } }
}

export const peekNextDispatchNumber = () => nextDispatchNumber().number

/** Shared write: dispatches + orders + fleet + timelines in one transaction. */
const commit = ({ dispatches, orders, orderEvents = [], dispatchEvents = [], extra = [] }) => {
  const fleet = syncFleet(dispatches)
  const writes = [
    [K.DISPATCHES, dispatches],
    [K.DRIVERS, fleet.drivers],
    [K.VEHICLES, fleet.vehicles],
    [K.DISPATCH_TIMELINE, [...read(K.DISPATCH_TIMELINE), ...dispatchEvents]],
    ...extra,
  ]
  if (orders) writes.push([K.ORDERS, orders])
  if (orderEvents.length) writes.push([K.ORDER_TIMELINE, [...read(K.ORDER_TIMELINE), ...orderEvents]])
  return storage.transaction(writes)
}

const snapshotNames = (input) => {
  const driver = read(K.DRIVERS).find((d) => d.id === input.driverId)
  const vehicle = read(K.VEHICLES).find((v) => v.id === input.vehicleId)
  return { driverName: driver?.name || null, vehicleNumber: vehicle?.vehicleNumber || null, driver, vehicle }
}

const announceAssignment = (dispatch, driver, vehicle, { reassigned = false } = {}) => {
  const what = `${dispatch.totalDeliveries} stop${dispatch.totalDeliveries === 1 ? '' : 's'} · ${dayjs(dispatch.dispatchDate).format('ddd DD MMM')} · ${vehicle?.vehicleNumber || ''}`
  notifyDispatch(dispatch, { title: `New dispatch assigned: ${dispatch.dispatchNumber}`, message: `${what}. It appears in your plan once the Dispatcher confirms it.`, driverId: driver?.id })
  notifyDispatch(dispatch, { title: `${reassigned ? 'Driver changed' : 'Driver assigned'}: ${dispatch.dispatchNumber}`, message: `${driver?.name} with ${vehicle?.vehicleNumber} · ${what}.`, roles: [ROLES.ADMIN, ROLES.DISPATCHER] })
  // Customer notification per order (once per dispatch + order — reassignments do not message the customer again)
  const orders = read(K.ORDERS)
  dispatch.orderIds.forEach((oid) => {
    const o = orders.find((x) => x.id === oid)
    if (o) fireEvent('DISPATCH_ASSIGNED', { key: `${dispatch.id}:${oid}`, orderId: oid, customerId: o.customerId, dispatchId: dispatch.id })
  })
}

/**
 * Create a dispatch. mode 'draft' → DRAFT; mode 'plan' → PLANNED, or ASSIGNED when a driver and vehicle are given.
 * input: { hubId, dispatchDate, zoneId, orderIds (in sequence), driverId, vehicleId, notes }
 */
export const createDispatch = (input, { mode = 'plan' } = {}) => {
  const user = requireManager()
  if (!user) return deny('Only the Dispatcher or Admin can create dispatches.')
  const check = validateDispatch(input, { mode })
  if (Object.keys(check.errors).length) return { ok: false, errors: check.errors, error: Object.values(check.errors)[0] }
  const now = new Date().toISOString()
  const { number, sequence } = nextDispatchNumber()
  const assigned = mode === 'plan' && input.driverId && input.vehicleId
  const names = assigned ? snapshotNames(input) : {}
  const dispatch = {
    id: uid('dsp'),
    dispatchNumber: number,
    dispatchDate: input.dispatchDate || '',
    hubId: input.hubId,
    zoneId: input.zoneId || '',
    driverId: assigned ? input.driverId : null,
    driverName: names.driverName || null,
    vehicleId: assigned ? input.vehicleId : null,
    vehicleNumber: names.vehicleNumber || null,
    orderIds: check.orders.map((o) => o.id),
    ...check.totals,
    estimatedLoad: check.totals.totalQuantity,
    status: mode === 'draft' ? DS.DRAFT : assigned ? DS.ASSIGNED : DS.PLANNED,
    notes: (input.notes || '').trim(),
    createdBy: user.id,
    createdByName: user.name,
    createdAt: now,
    updatedAt: now,
    assignedAt: assigned ? now : null,
    assignedBy: assigned ? user.id : null,
    confirmedAt: null, confirmedBy: null, startedAt: null, completedAt: null,
    cancelledAt: null, cancelledBy: null, cancelReason: '', cancelRemarks: '',
    stockDeducted: false, stockDeductedAt: null, stockSnapshot: [], stockReversed: false, reversalMovementIds: [],
  }
  const orders = read(K.ORDERS).map((o) => (dispatch.orderIds.includes(o.id) ? { ...o, dispatchId: dispatch.id, updatedAt: now } : o))
  const events = [makeDispatchEvent(dispatch, 'DISPATCH_CREATED', { description: `${dispatch.dispatchNumber} · ${dispatch.totalDeliveries} order${dispatch.totalDeliveries === 1 ? '' : 's'}` })]
  if (dispatch.status !== DS.DRAFT) events.push(makeDispatchEvent(dispatch, 'DISPATCH_PLANNED', { description: `${dispatch.totalQuantity} units · sequence of ${dispatch.totalDeliveries} stops` }))
  if (assigned) {
    events.push(makeDispatchEvent(dispatch, 'DRIVER_ASSIGNED', { description: `${names.driver.name} (${names.driver.code})` }))
    events.push(makeDispatchEvent(dispatch, 'VEHICLE_ASSIGNED', { description: `${names.vehicle.vehicleNumber} · ${names.vehicle.type}` }))
  }
  const orderEvents = check.orders.map((o) => makeTimelineEvent(o, 'ADDED_TO_DISPATCH', { remarks: dispatch.dispatchNumber }))
  const res = commit({ dispatches: [dispatch, ...getDispatches()], orders, orderEvents, dispatchEvents: events, extra: [[K.DISPATCH_SEQUENCE, sequence]] })
  if (!res.ok) return deny(res.error)
  logDispatchActivity(`${dispatch.status === DS.DRAFT ? 'saved draft dispatch' : 'planned dispatch'} ${dispatch.dispatchNumber} (${dispatch.totalDeliveries} orders)`, dispatch.id)
  if (assigned) announceAssignment(dispatch, names.driver, names.vehicle)
  return { ok: true, record: dispatch, warnings: check.warnings }
}

/** Edit a DRAFT / PLANNED / ASSIGNED dispatch (orders, sequence, date, zone, driver, vehicle, notes). */
export const updateDispatch = (id, input, { mode = 'plan' } = {}) => {
  const user = requireManager()
  if (!user) return deny('Only the Dispatcher or Admin can edit dispatches.')
  const dispatches = getDispatches()
  const existing = getDispatchById(id, dispatches)
  if (!existing) return deny('This dispatch no longer exists.')
  if (!EDITABLE_DISPATCH_STATUSES.includes(existing.status)) return deny(`${existing.dispatchNumber} is ${existing.status.toLowerCase().replace(/_/g, ' ')} and can no longer be edited.`)
  const effectiveMode = existing.status === DS.DRAFT ? mode : 'plan'
  const check = validateDispatch(input, { mode: effectiveMode, dispatchId: id })
  if (Object.keys(check.errors).length) return { ok: false, errors: check.errors, error: Object.values(check.errors)[0] }
  const now = new Date().toISOString()
  const assigned = effectiveMode === 'plan' && input.driverId && input.vehicleId
  const names = assigned ? snapshotNames(input) : {}
  const status = effectiveMode === 'draft' ? DS.DRAFT : assigned ? DS.ASSIGNED : DS.PLANNED
  const record = {
    ...existing,
    dispatchDate: input.dispatchDate || '',
    hubId: input.hubId,
    zoneId: input.zoneId || '',
    driverId: assigned ? input.driverId : null,
    driverName: names.driverName || null,
    vehicleId: assigned ? input.vehicleId : null,
    vehicleNumber: names.vehicleNumber || null,
    orderIds: check.orders.map((o) => o.id),
    ...check.totals,
    estimatedLoad: check.totals.totalQuantity,
    status,
    notes: (input.notes || '').trim(),
    updatedAt: now,
    assignedAt: assigned ? (existing.driverId === input.driverId && existing.vehicleId === input.vehicleId ? existing.assignedAt : now) : null,
    assignedBy: assigned ? (existing.assignedBy || user.id) : null,
  }
  const added = record.orderIds.filter((x) => !existing.orderIds.includes(x))
  const removed = existing.orderIds.filter((x) => !record.orderIds.includes(x))
  const allOrders = read(K.ORDERS)
  const orders = allOrders.map((o) => {
    if (added.includes(o.id)) return { ...o, dispatchId: id, updatedAt: now }
    if (removed.includes(o.id) && o.dispatchId === id) return { ...o, dispatchId: null, updatedAt: now }
    return o
  })
  const events = [makeDispatchEvent(record, existing.status === DS.DRAFT && status !== DS.DRAFT ? 'DISPATCH_PLANNED' : 'DISPATCH_UPDATED', {
    description: [added.length && `${added.length} added`, removed.length && `${removed.length} removed`, `${record.totalDeliveries} stops`].filter(Boolean).join(' · '),
  })]
  const driverChanged = assigned && existing.driverId !== record.driverId
  const vehicleChanged = assigned && existing.vehicleId !== record.vehicleId
  if (driverChanged) events.push(makeDispatchEvent(record, 'DRIVER_ASSIGNED', { description: `${names.driver.name} (${names.driver.code})` }))
  if (vehicleChanged) events.push(makeDispatchEvent(record, 'VEHICLE_ASSIGNED', { description: `${names.vehicle.vehicleNumber} · ${names.vehicle.type}` }))
  if (JSON.stringify(existing.orderIds) !== JSON.stringify(record.orderIds) && !added.length && !removed.length) events.push(makeDispatchEvent(record, 'SEQUENCE_UPDATED'))
  const orderEvents = [
    ...added.map((oid) => makeTimelineEvent(allOrders.find((o) => o.id === oid), 'ADDED_TO_DISPATCH', { remarks: record.dispatchNumber })),
    ...removed.map((oid) => makeTimelineEvent(allOrders.find((o) => o.id === oid), 'REMOVED_FROM_DISPATCH', { remarks: record.dispatchNumber })),
  ]
  const res = commit({ dispatches: dispatches.map((d) => (d.id === id ? record : d)), orders, orderEvents, dispatchEvents: events })
  if (!res.ok) return deny(res.error)
  logDispatchActivity(`updated dispatch ${record.dispatchNumber}`, id)
  if (driverChanged || vehicleChanged) {
    if (existing.driverId && existing.driverId !== record.driverId) notifyDispatch(record, { title: `Removed from ${record.dispatchNumber}`, message: 'The Dispatcher assigned this dispatch to another driver.', driverId: existing.driverId, type: 'warning' })
    announceAssignment(record, names.driver, names.vehicle, { reassigned: Boolean(existing.driverId) })
  } else if (assigned) {
    notifyDispatch(record, { title: `Dispatch updated: ${record.dispatchNumber}`, message: `${record.totalDeliveries} stops on ${dayjs(record.dispatchDate).format('DD MMM')}. Review your plan.`, driverId: record.driverId })
  }
  return { ok: true, record, warnings: check.warnings }
}

/** Assign (or change) driver and vehicle on a PLANNED / ASSIGNED dispatch. */
export const assignDispatch = (id, { driverId, vehicleId, dispatchDate, zoneId } = {}) => {
  const existing = getDispatchById(id)
  if (!existing) return deny('This dispatch no longer exists.')
  if (![DS.PLANNED, DS.ASSIGNED].includes(existing.status)) {
    return deny(existing.status === DS.DRAFT ? 'Complete the draft plan before assigning a driver.' : `${existing.dispatchNumber} is ${existing.status.toLowerCase().replace(/_/g, ' ')} — the driver can no longer change.`)
  }
  if (existing.status === DS.ASSIGNED && existing.driverId === driverId && existing.vehicleId === vehicleId && (!dispatchDate || dispatchDate === existing.dispatchDate)) {
    return deny(`${existing.dispatchNumber} is already assigned to this driver and vehicle.`)
  }
  return updateDispatch(id, {
    hubId: existing.hubId, dispatchDate: dispatchDate || existing.dispatchDate, zoneId: zoneId || existing.zoneId,
    orderIds: existing.orderIds, driverId, vehicleId, notes: existing.notes,
  })
}

/** Final checks shown on the confirmation screen. Returns { blocks: string[], warnings: string[], stock, orders }. */
export const getConfirmationReview = (dispatch) => {
  const blocks = []
  const warnings = []
  if (!dispatch) return { blocks: ['This dispatch no longer exists.'], warnings, stock: [], orders: [] }
  const allOrders = read(K.ORDERS)
  const orders = dispatch.orderIds.map((oid) => allOrders.find((o) => o.id === oid)).filter(Boolean)
  if (orders.length !== dispatch.orderIds.length) blocks.push('One or more orders on this dispatch no longer exist.')
  if (!orders.length) blocks.push('The dispatch has no orders.')
  orders.forEach((o) => {
    const why = orderIneligibility(o, { dispatchId: dispatch.id })
    if (why) blocks.push(why)
    if (o.hubId !== dispatch.hubId) blocks.push(`${o.orderNumber} is fulfilled from another hub.`)
  })
  if (dispatch.status !== DS.ASSIGNED) blocks.push(dispatch.stockDeducted ? `${dispatch.dispatchNumber} is already confirmed — stock was deducted once and will not be deducted again.` : 'Assign a driver and vehicle before confirming.')
  if (dispatch.dispatchDate && dispatch.dispatchDate !== today()) blocks.push(`Dispatches are confirmed on the dispatch date (${dayjs(dispatch.dispatchDate).format('DD MMM YYYY')}). Change the date to today to load the vehicle now.`)
  const zone = read(K.DISPATCH_ZONES).find((z) => z.id === dispatch.zoneId)
  if (!zone || zone.status !== 'Active') blocks.push('The delivery zone is missing or inactive.')
  const ctx = { hubId: dispatch.hubId, dispatchDate: dispatch.dispatchDate, dispatchId: dispatch.id, load: computeTotals(orders).totalQuantity }
  driverAssignmentIssues(read(K.DRIVERS).find((d) => d.id === dispatch.driverId), ctx).forEach((i) => blocks.push(i.message))
  vehicleAssignmentIssues(read(K.VEHICLES).find((v) => v.id === dispatch.vehicleId), ctx).forEach((i) => blocks.push(i.message))
  const stock = getStockCheck(orders, dispatch.hubId)
  stock.filter((l) => l.short).forEach((l) => blocks.push(`Insufficient stock: ${l.productName} needs ${l.quantity} ${l.unit}, ${Math.max(0, l.available)} available.`))
  stock.filter((l) => !l.tracked).forEach((l) => warnings.push(`${l.productName} does not track inventory — no stock movement will be recorded.`))
  return { blocks: [...new Set(blocks)], warnings, stock, orders }
}

/** Confirm an ASSIGNED dispatch: deduct stock once, create deliveries, mark orders DISPATCHED. */
export const confirmDispatch = (id, { acknowledged = false } = {}) => {
  const user = requireManager()
  if (!user) return deny('Only the Dispatcher or Admin can confirm dispatches.')
  const dispatches = getDispatches()
  const dispatch = getDispatchById(id, dispatches)
  if (!dispatch) return deny('This dispatch no longer exists.')
  if (dispatch.stockDeducted || dispatch.status !== DS.ASSIGNED) {
    return deny(dispatch.stockDeducted ? `${dispatch.dispatchNumber} is already confirmed. Stock was deducted once and was not deducted again.` : 'Assign a driver and vehicle before confirming.')
  }
  if (!acknowledged) return deny('Review the orders, driver, vehicle, route and stock, then tick the confirmation.')
  const review = getConfirmationReview(dispatch)
  if (review.blocks.length) return { ok: false, error: review.blocks[0], errors: { form: review.blocks[0] }, blocks: review.blocks }

  const now = new Date().toISOString()
  const stock = deductDispatchStock({
    inventory: read(K.INVENTORY), movements: read(K.STOCK_MOVEMENTS), orders: review.orders, hubId: dispatch.hubId,
    products: read(K.PRODUCTS), dispatch, userId: user.id, at: now,
  })
  if (!stock.ok) return { ok: false, error: stock.errors[0], errors: { form: stock.errors[0] }, blocks: stock.errors }

  const customers = Object.fromEntries(read(K.CUSTOMERS).map((c) => [c.id, c]))
  const previous = read(K.DELIVERIES)
  const priorAttempts = (orderId) => previous.filter((x) => x.orderId === orderId && x.status !== DL.CANCELLED).length
  const deliveries = review.orders.map((o, i) => {
    const did = uid('dlv')
    const c = customers[o.customerId] || {}
    return {
      id: did, dispatchId: dispatch.id, dispatchNumber: dispatch.dispatchNumber, orderId: o.id, orderNumber: o.orderNumber,
      customerId: o.customerId, customerName: o.customerName, customerMobile: c.mobile || '', contactPerson: c.contactPerson || '',
      deliveryAddress: o.deliveryAddress, city: o.deliveryCity, pincode: o.deliveryPincode, instructions: o.deliveryInstructions || '',
      priority: o.orderPriority, hubId: o.hubId, zoneId: o.zoneId, driverId: dispatch.driverId, vehicleId: dispatch.vehicleId,
      sequence: i + 1, status: DL.DISPATCHED,
      items: o.items.map((it) => ({
        id: `${did}-${it.id}`, orderItemId: it.id, productId: it.productId, productCode: it.productCode, productName: it.productName, unit: it.unit,
        orderedQuantity: it.orderedQuantity, dispatchedQuantity: it.orderedQuantity, deliveredQuantity: 0, damagedQuantity: 0, remainingQuantity: it.orderedQuantity,
      })),
      totalQuantity: o.totalQuantity, totalAmount: o.totalAmount, attempt: priorAttempts(o.id) + 1,
      startedAt: null, startedBy: null, completedAt: null, completedBy: null, failedAt: null, failureReason: '', failureRemarks: '',
      otpStatus: 'NONE', otpVerifiedAt: null, receivedBy: '', remarks: '', deliveryNoteId: null, deliveryNoteNumber: null,
      reviewStatus: null, reviewedAt: null, reviewedBy: null, reviewRemarks: '', returnedToHub: false, returnMovementIds: [],
      createdAt: now, updatedAt: now,
    }
  })
  const byOrder = Object.fromEntries(deliveries.map((d) => [d.orderId, d]))
  const record = {
    ...dispatch, status: DS.CONFIRMED, confirmedAt: now, confirmedBy: user.id, updatedAt: now,
    stockDeducted: true, stockDeductedAt: now, stockSnapshot: stock.snapshot,
  }
  const orders = read(K.ORDERS).map((o) => (byOrder[o.id]
    ? { ...consumeReservation(o, now), orderStatus: S.DISPATCHED, dispatchId: dispatch.id, deliveryId: byOrder[o.id].id, driverId: dispatch.driverId, vehicleId: dispatch.vehicleId, dispatchedAt: now, updatedAt: now, updatedBy: user.id }
    : o))
  const movedLines = stock.snapshot.filter((s) => s.movementId).length
  const res = commit({
    dispatches: dispatches.map((d) => (d.id === id ? record : d)),
    orders,
    orderEvents: review.orders.map((o) => makeTimelineEvent({ ...o, orderStatus: S.DISPATCHED }, 'DISPATCHED', { remarks: `${dispatch.dispatchNumber} · ${dispatch.driverName} · ${dispatch.vehicleNumber}` })),
    dispatchEvents: [makeDispatchEvent(record, 'DISPATCH_CONFIRMED', { description: `${record.totalQuantity} units · ${movedLines} stock movement${movedLines === 1 ? '' : 's'} recorded` })],
    extra: [
      [K.INVENTORY, stock.inventory],
      [K.STOCK_MOVEMENTS, mergeMovements(stock.created, read(K.STOCK_MOVEMENTS))],
      [K.DELIVERIES, [...deliveries, ...read(K.DELIVERIES)]],
    ],
  })
  if (!res.ok) return deny(res.error)
  logDispatchActivity(`confirmed dispatch ${record.dispatchNumber} — ${record.totalQuantity} units left ${read(K.HUBS).find((h) => h.id === record.hubId)?.name || 'the hub'}`, id)
  notifyDispatch(record, { title: `Dispatch confirmed: ${record.dispatchNumber}`, message: `${record.totalDeliveries} stops are loaded on ${record.vehicleNumber}. Start your first delivery when you leave the hub.`, driverId: record.driverId, type: 'success' })
  notifyDispatch(record, { title: `Dispatch confirmed: ${record.dispatchNumber}`, message: `${record.driverName} · ${record.totalDeliveries} stops · stock deducted (${movedLines} movement${movedLines === 1 ? '' : 's'}).`, roles: [ROLES.ADMIN], type: 'success' })
  return { ok: true, record, deliveries, movements: stock.created }
}

/**
 * Cancel a dispatch. Before confirmation nothing touched stock. A CONFIRMED dispatch (no delivery started)
 * gets a controlled reversal — exactly once. Once the driver has started, cancellation is refused.
 */
export const cancelDispatch = (id, { reason = '', remarks = '' } = {}) => {
  const user = requireManager()
  if (!user) return deny('Only the Dispatcher or Admin can cancel dispatches.')
  const dispatches = getDispatches()
  const dispatch = getDispatchById(id, dispatches)
  if (!dispatch) return deny('This dispatch no longer exists.')
  if (dispatch.status === DS.CANCELLED) return deny(`${dispatch.dispatchNumber} is already cancelled. No change was made.`)
  if (!reason) return deny('Choose a cancellation reason.', { reason: 'Choose a cancellation reason.' })
  if (reason === 'Other' && !remarks.trim()) return deny('Describe the reason in the remarks.', { remarks: 'Describe the reason in the remarks.' })
  const allDeliveries = read(K.DELIVERIES)
  const mine = allDeliveries.filter((d) => d.dispatchId === id)
  if (![...EDITABLE_DISPATCH_STATUSES, DS.DRAFT, DS.CONFIRMED].includes(dispatch.status) || mine.some((d) => d.status !== DL.DISPATCHED)) {
    return deny(`${dispatch.dispatchNumber} is already on the road. Record failed or returned deliveries instead of cancelling — stock is not restored automatically.`)
  }
  if (dispatch.stockReversed) return deny(`Stock for ${dispatch.dispatchNumber} was already reversed. No change was made.`)

  const now = new Date().toISOString()
  const wasConfirmed = dispatch.status === DS.CONFIRMED && dispatch.stockDeducted
  const extra = []
  let reversal = null
  if (wasConfirmed) {
    reversal = reverseDispatchStock({ inventory: read(K.INVENTORY), movements: read(K.STOCK_MOVEMENTS), snapshot: dispatch.stockSnapshot, hubId: dispatch.hubId, dispatch, userId: user.id, at: now, reason })
    extra.push([K.INVENTORY, reversal.inventory], [K.STOCK_MOVEMENTS, mergeMovements(reversal.created, read(K.STOCK_MOVEMENTS))])
    extra.push([K.DELIVERIES, allDeliveries.map((d) => (d.dispatchId === id ? { ...d, status: DL.CANCELLED, updatedAt: now } : d))])
  }
  const record = {
    ...dispatch, status: DS.CANCELLED, cancelledAt: now, cancelledBy: user.id, cancelReason: reason, cancelRemarks: remarks.trim(), updatedAt: now,
    stockReversed: wasConfirmed, reversalMovementIds: reversal ? reversal.created.map((m) => m.id) : [],
  }
  const allOrders = read(K.ORDERS)
  const products = read(K.PRODUCTS)
  const affected = allOrders.filter((o) => dispatch.orderIds.includes(o.id) && o.dispatchId === id)
  const orders = allOrders.map((o) => (affected.some((a) => a.id === o.id)
    ? { ...(wasConfirmed ? restoreReservation(o, dispatch.stockSnapshot || [], products, now) : o), orderStatus: S.READY_FOR_DISPATCH, dispatchId: null, deliveryId: null, driverId: null, vehicleId: null, dispatchedAt: null, updatedAt: now, updatedBy: user.id }
    : o))
  const events = [makeDispatchEvent(record, 'DISPATCH_CANCELLED', { description: reason, remarks: remarks.trim() })]
  if (wasConfirmed) events.push(makeDispatchEvent(record, 'STOCK_REVERSED', { description: `${reversal.created.length} reversal movement${reversal.created.length === 1 ? '' : 's'} — stock restored to the hub` }))
  const res = commit({
    dispatches: dispatches.map((d) => (d.id === id ? record : d)),
    orders,
    orderEvents: affected.map((o) => makeTimelineEvent(o, 'DISPATCH_CANCELLED', { remarks: `${dispatch.dispatchNumber} — ${reason}` })),
    dispatchEvents: events,
    extra,
  })
  if (!res.ok) return deny(res.error)
  logDispatchActivity(`cancelled dispatch ${record.dispatchNumber}${wasConfirmed ? ' and reversed its stock' : ''} (${reason})`, id)
  if (dispatch.driverId) notifyDispatch(record, { title: `Dispatch cancelled: ${record.dispatchNumber}`, message: `${reason}${remarks ? ` — ${remarks.trim()}` : ''}. These stops are no longer in your plan.`, driverId: dispatch.driverId, type: 'warning' })
  notifyDispatch(record, { title: `Dispatch cancelled: ${record.dispatchNumber}`, message: `${reason}. ${affected.length} order${affected.length === 1 ? '' : 's'} back in the ready queue${wasConfirmed ? '; stock restored' : ''}.`, roles: [ROLES.ADMIN, ROLES.DISPATCHER], type: 'warning' })
  return { ok: true, record, reversal: reversal?.created || [] }
}

/**
 * Save a new stop order. orderIds must be the dispatch's full set; stops already started or finished
 * keep their position. Before confirmation this reorders the plan; afterwards it reorders the deliveries.
 */
export const updateSequence = (id, orderIds) => {
  const user = requireManager()
  if (!user) return deny('Only the Dispatcher or Admin can change the delivery sequence.')
  const dispatches = getDispatches()
  const dispatch = getDispatchById(id, dispatches)
  if (!dispatch) return deny('This dispatch no longer exists.')
  if (!isActiveDispatch(dispatch)) return deny(`${dispatch.dispatchNumber} is ${dispatch.status.toLowerCase().replace(/_/g, ' ')} — the sequence is final.`)
  if (new Set(orderIds).size !== orderIds.length || orderIds.length !== dispatch.orderIds.length || orderIds.some((x) => !dispatch.orderIds.includes(x))) {
    return deny('Invalid delivery sequence: every stop must appear exactly once.')
  }
  if (JSON.stringify(orderIds) === JSON.stringify(dispatch.orderIds)) return deny('The sequence has not changed.')
  const allDeliveries = read(K.DELIVERIES)
  const mine = allDeliveries.filter((d) => d.dispatchId === id)
  const locked = mine.filter((d) => !PENDING_DELIVERY_STATUSES.includes(d.status) || d.status === DL.OUT_FOR_DELIVERY)
  const moved = locked.find((d) => orderIds.indexOf(d.orderId) + 1 !== d.sequence)
  if (moved) return deny(`Stop ${moved.sequence} (${moved.orderNumber}) is ${moved.status === DL.OUT_FOR_DELIVERY ? 'in progress' : 'completed'} and keeps its position.`)
  const now = new Date().toISOString()
  const record = { ...dispatch, orderIds, updatedAt: now }
  const extra = []
  if (mine.length) extra.push([K.DELIVERIES, allDeliveries.map((d) => (d.dispatchId === id ? { ...d, sequence: orderIds.indexOf(d.orderId) + 1, updatedAt: now } : d))])
  const res = commit({ dispatches: dispatches.map((d) => (d.id === id ? record : d)), dispatchEvents: [makeDispatchEvent(record, 'SEQUENCE_UPDATED', { description: `${orderIds.length} stops re-ordered` })], extra })
  if (!res.ok) return deny(res.error)
  if (dispatch.driverId && dispatch.status !== DS.DRAFT) notifyDispatch(record, { title: `Delivery sequence updated: ${record.dispatchNumber}`, message: 'The Dispatcher changed the order of your stops. Check your next delivery.', driverId: dispatch.driverId })
  return { ok: true, record }
}

/** Suggested sequence for the stops that can still move (started/finished stops stay where they are). */
export const getSuggestedSequence = (dispatch) => {
  const allOrders = read(K.ORDERS)
  const mine = read(K.DELIVERIES).filter((d) => d.dispatchId === dispatch.id)
  const fixed = new Map(mine.filter((d) => d.status !== DL.DISPATCHED).map((d) => [d.orderId, d.sequence]))
  const movable = suggestSequence(dispatch.orderIds.filter((x) => !fixed.has(x)).map((x) => allOrders.find((o) => o.id === x)).filter(Boolean)).map((o) => o.id)
  const out = []
  for (let i = 1; i <= dispatch.orderIds.length; i += 1) {
    const f = [...fixed.entries()].find(([, seq]) => seq === i)
    out.push(f ? f[0] : movable.shift())
  }
  return out.filter(Boolean)
}

export const searchDispatches = (q, f = {}, list = getDispatches()) => {
  const query = (q || '').trim().toLowerCase()
  return list.filter((d) => {
    if (query && ![d.dispatchNumber, d.driverName, d.vehicleNumber, d.notes].some((v) => String(v || '').toLowerCase().includes(query))) return false
    if (f.hubId && d.hubId !== f.hubId) return false
    if (f.zoneId && d.zoneId !== f.zoneId) return false
    if (f.driverId && d.driverId !== f.driverId) return false
    if (f.status && d.status !== f.status) return false
    if (f.from && d.dispatchDate < f.from) return false
    if (f.to && d.dispatchDate > f.to) return false
    return true
  })
}

const dispatchService = {
  getDispatches, getDispatchById, createDispatch, updateDispatch, assignDispatch, confirmDispatch, cancelDispatch, updateSequence,
  validateDispatch, getEligibleOrders, getConfirmationReview, computeTotals, suggestSequence, getStockCheck, searchDispatches,
}
export default dispatchService
