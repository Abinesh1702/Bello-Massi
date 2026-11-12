/**
 * Driver deliveries (Phase 4): start, OTP-confirmed completion (full or partial), failure, and the
 * Dispatcher's review of exceptions.
 *
 * Delivery confirmation NEVER moves stock — stock left the hub when the dispatch was confirmed.
 * The only stock change here is the Dispatcher accepting undelivered goods back into the hub
 * (a Delivery Return movement), recorded at most once per delivery.
 */
import { fireEvent } from './automationService'
import dayjs from 'dayjs'
import storage from './storageService'
import { getCurrentUser } from './authService'
import { makeTimelineEvent } from './orderTimelineService'
import { makeDispatchEvent, logDispatchActivity } from './dispatchTimelineService'
import { notifyDispatch } from './dispatchService'
import { syncFleet } from './driverService'
import { evaluateOtp, generateOtp, getLatestOtp, recordOtpOutcome } from './otpService'
import { nextDeliveryNoteNumber } from './deliveryNoteService'
import { pushNotification } from './notificationService'
import { buildNoteRecord } from './seed/dispatchSeed'
import { DECIMAL_UNITS } from './productService'
import { STORAGE_KEYS as K, ORDER_STATUS as S } from '../utils/constants'
import { uid } from '../utils/helpers'
import { mergeMovements, returnDeliveryStock } from '../utils/dispatchStock'
import { reserveOrder } from '../utils/stockReservation'
import { can } from '../config/permissions'
import { ROLES } from '../config/roles'
import { DELIVERY_STATUS as DL, DISPATCH_STATUS as DS, FAILURE_REASONS, TERMINAL_DELIVERY_STATUSES } from '../config/dispatchConfig'
import { scopeOf } from './rbacService'
import { openSessionWrite, patchSessionWrite } from './trackingService'

const read = (key, fallback = []) => storage.getItem(key, fallback) || fallback
const deny = (msg, errors) => ({ ok: false, error: msg, errors: errors || { form: msg } })
const round = (n) => Math.round(n * 1000) / 1000

export const getDeliveries = () => read(K.DELIVERIES)
export const getDeliveryById = (id, list = getDeliveries()) => list.find((d) => d.id === id) || null
export const getDeliveriesForDispatch = (dispatchId, list = getDeliveries()) => list.filter((d) => d.dispatchId === dispatchId).sort((a, b) => a.sequence - b.sequence)
export const getDriverRecordForUser = (user, drivers = read(K.DRIVERS)) => (user ? drivers.find((d) => d.userId === user.id) || null : null)

/** Office roles with tracking / history access see all deliveries; salesmen their own orders; drivers their own stops. */
export const canViewDelivery = (user, d, { orders = read(K.ORDERS), drivers = read(K.DRIVERS) } = {}) => {
  if (!user || !d) return false
  if (scopeOf(user) === ROLES.DRIVER) return getDriverRecordForUser(user, drivers)?.id === d.driverId
  if (scopeOf(user) === ROLES.SALESMAN) {
    const o = orders.find((x) => x.id === d.orderId)
    return Boolean(o) && (o.salesmanId === user.id || o.createdBy === user.id)
  }
  return can(user, 'dispatch.tracking') || can(user, 'dispatch.history')
}

/** Notify the customer-portal users of a delivery's customer (customer app). */
const notifyCustomer = (delivery, { title, message, type = 'info', link }) => {
  const ids = read(K.DEMO_USERS).filter((u) => u.customerId && u.customerId === delivery.customerId && u.status !== 'inactive').map((u) => u.id)
  if (ids.length) pushNotification({ title, message, type, userIds: ids, link: link || `/customer/tracking/${delivery.orderId}`, category: 'delivery', relatedOrderId: delivery.orderId })
}

/** True when a dispatch's date is still in the future (tomorrow's plan): it cannot be started yet. */
export const isFutureDispatch = (dispatch) => Boolean(dispatch?.dispatchDate) && dayjs(dispatch.dispatchDate).isAfter(dayjs(), 'day')

/** The next stop the driver should work on (lowest sequence still pending). */
export const getNextStop = (dispatchDeliveries) => {
  const out = dispatchDeliveries.find((d) => d.status === DL.OUT_FOR_DELIVERY)
  if (out) return out
  return [...dispatchDeliveries].filter((d) => d.status === DL.DISPATCHED).sort((a, b) => a.sequence - b.sequence)[0] || null
}

const requireDriverFor = (delivery) => {
  const user = getCurrentUser()
  const driver = getDriverRecordForUser(user)
  if (!driver || driver.id !== delivery.driverId) return { error: 'This delivery is assigned to another driver.' }
  return { user, driver }
}

/** Close the dispatch when every stop has an outcome; returns { record, events }. */
const progressDispatch = (dispatch, deliveries, now) => {
  const mine = deliveries.filter((d) => d.dispatchId === dispatch.id && d.status !== DL.CANCELLED)
  const done = mine.every((d) => TERMINAL_DELIVERY_STATUSES.includes(d.status))
  if (!done || !mine.length) return { record: { ...dispatch, status: DS.IN_TRANSIT, updatedAt: now }, events: [], closed: false }
  const allDelivered = mine.every((d) => d.status === DL.DELIVERED)
  const record = { ...dispatch, status: allDelivered ? DS.COMPLETED : DS.PARTIALLY_DELIVERED, completedAt: now, updatedAt: now }
  const delivered = mine.filter((d) => d.status === DL.DELIVERED).length
  return {
    record,
    closed: true,
    allDelivered,
    events: [makeDispatchEvent(record, 'DISPATCH_COMPLETED', { description: `${delivered} of ${mine.length} delivered${allDelivered ? '' : ' — exceptions need review'}`, at: now })],
  }
}

const commit = ({ dispatches, deliveries, orders, dispatchEvents = [], orderEvents = [], extra = [] }) => {
  const fleet = syncFleet(dispatches)
  return storage.transaction([
    [K.DELIVERIES, deliveries],
    [K.DISPATCHES, dispatches],
    [K.ORDERS, orders],
    [K.DRIVERS, fleet.drivers],
    [K.VEHICLES, fleet.vehicles],
    [K.DISPATCH_TIMELINE, [...read(K.DISPATCH_TIMELINE), ...dispatchEvents]],
    [K.ORDER_TIMELINE, [...read(K.ORDER_TIMELINE), ...orderEvents]],
    ...extra,
  ])
}

const announceClose = (dispatch, closing) => {
  if (!closing.closed) return
  notifyDispatch(closing.record, {
    title: `Dispatch completed: ${dispatch.dispatchNumber}`,
    message: closing.allDelivered ? `${dispatch.driverName} delivered every stop. Driver and vehicle are available again.` : `${dispatch.driverName} finished the route with exceptions — review failed or partial deliveries.`,
    roles: [ROLES.ADMIN, ROLES.DISPATCHER],
    type: closing.allDelivered ? 'success' : 'warning',
  })
}

/* ------------------------------------------------------------------ */
/* Start                                                               */
/* ------------------------------------------------------------------ */

export const startDelivery = (id) => {
  const deliveries = getDeliveries()
  const delivery = getDeliveryById(id, deliveries)
  if (!delivery) return deny('This delivery no longer exists.')
  const who = requireDriverFor(delivery)
  if (who.error) return deny(who.error)
  if (delivery.status === DL.OUT_FOR_DELIVERY) return deny(`${delivery.orderNumber} is already out for delivery.`)
  if (TERMINAL_DELIVERY_STATUSES.includes(delivery.status)) return deny(`${delivery.orderNumber} is ${delivery.status === DL.DELIVERED ? 'already delivered' : delivery.status.toLowerCase().replace(/_/g, ' ')} and cannot be restarted.`)
  const dispatches = read(K.DISPATCHES)
  const dispatch = dispatches.find((d) => d.id === delivery.dispatchId)
  if (!dispatch || ![DS.CONFIRMED, DS.IN_TRANSIT].includes(dispatch.status)) return deny('The dispatch has not been confirmed by the Dispatcher yet.')
  if (dispatch.driverId !== who.driver.id) return deny('This dispatch is assigned to another driver.')
  if (isFutureDispatch(dispatch)) return deny(`This dispatch is planned for ${dayjs(dispatch.dispatchDate).format('DD MMM YYYY')} — you can start it on that day.`)
  const mine = deliveries.filter((d) => d.dispatchId === dispatch.id)
  const out = mine.find((d) => d.status === DL.OUT_FOR_DELIVERY)
  if (out) return deny(`Finish stop ${out.sequence} (${out.customerName}) before starting the next delivery.`)
  const next = getNextStop(mine)
  if (next && next.id !== id) return deny(`Deliveries follow the planned sequence — start stop ${next.sequence} (${next.customerName}) first.`)

  const now = new Date().toISOString()
  const record = { ...delivery, status: DL.OUT_FOR_DELIVERY, startedAt: now, startedBy: who.user.id, arrivedAt: null, updatedAt: now }
  const tracking = openSessionWrite(record, { deliveries, now })
  const firstStart = dispatch.status === DS.CONFIRMED
  const dRecord = { ...dispatch, status: DS.IN_TRANSIT, startedAt: dispatch.startedAt || now, updatedAt: now }
  const orders = read(K.ORDERS)
  const order = orders.find((o) => o.id === delivery.orderId)
  const oRecord = order ? { ...order, orderStatus: S.OUT_FOR_DELIVERY, outForDeliveryAt: now, updatedAt: now, updatedBy: who.user.id } : null
  const events = []
  if (firstStart) events.push(makeDispatchEvent(dRecord, 'DISPATCH_STARTED', { description: `${dispatch.driverName} left the hub with ${dispatch.vehicleNumber}` }))
  events.push(makeDispatchEvent(dRecord, 'DELIVERY_STARTED', { orderId: delivery.orderId, deliveryId: id, description: `Stop ${delivery.sequence} · ${delivery.orderNumber} · ${delivery.customerName}` }))
  const res = commit({
    deliveries: deliveries.map((d) => (d.id === id ? record : d)),
    dispatches: dispatches.map((d) => (d.id === dispatch.id ? dRecord : d)),
    orders: orders.map((o) => (o.id === delivery.orderId && oRecord ? oRecord : o)),
    dispatchEvents: events,
    orderEvents: oRecord ? [makeTimelineEvent(oRecord, 'OUT_FOR_DELIVERY', { remarks: `${dispatch.dispatchNumber} · stop ${delivery.sequence} · ${dispatch.driverName}` })] : [],
    extra: [tracking.write],
  })
  if (!res.ok) return deny(res.error)
  notifyCustomer(record, { title: `Out for delivery: ${delivery.orderNumber}`, message: `${dispatch.driverName} (${dispatch.vehicleNumber}) is on the way. Track the delivery in the app (DEMO GPS).` })
  logDispatchActivity(`started delivery ${delivery.orderNumber} (stop ${delivery.sequence} on ${dispatch.dispatchNumber})`, id, 'delivery')
  notifyDispatch(dRecord, {
    title: firstStart ? `Dispatch started: ${dispatch.dispatchNumber}` : `Delivery started: ${delivery.orderNumber}`,
    message: `${dispatch.driverName} is on the way to ${delivery.customerName} (stop ${delivery.sequence} of ${mine.length}).`,
    roles: [ROLES.DISPATCHER],
  })
  fireEvent('DELIVERY_STARTED', { key: record.id, orderId: record.orderId, customerId: record.customerId, dispatchId: record.dispatchId })
  return { ok: true, record, dispatch: dRecord }
}

/* ------------------------------------------------------------------ */
/* Reach location                                                      */
/* ------------------------------------------------------------------ */

/** Driver taps "Reach location": records the arrival, closes the simulated route and issues the customer OTP. */
export const markArrived = (id) => {
  const deliveries = getDeliveries()
  const delivery = getDeliveryById(id, deliveries)
  if (!delivery) return deny('This delivery no longer exists.')
  const who = requireDriverFor(delivery)
  if (who.error) return deny(who.error)
  if (delivery.status !== DL.OUT_FOR_DELIVERY) return deny(delivery.status === DL.DISPATCHED ? 'Start the delivery first.' : `${delivery.orderNumber} is already closed.`)
  if (delivery.arrivedAt) return { ok: true, record: delivery, already: true }
  const now = new Date().toISOString()
  const record = { ...delivery, arrivedAt: now, updatedAt: now }
  const dispatch = read(K.DISPATCHES).find((d) => d.id === delivery.dispatchId) || { id: delivery.dispatchId, dispatchNumber: delivery.dispatchNumber }
  const writes = [[K.DELIVERIES, deliveries.map((d) => (d.id === id ? record : d))],
    [K.DISPATCH_TIMELINE, [...read(K.DISPATCH_TIMELINE), makeDispatchEvent(dispatch, 'DRIVER_ARRIVED', { orderId: delivery.orderId, deliveryId: id, description: `Arrived at ${delivery.customerName} (stop ${delivery.sequence})`, at: now })]]]
  const t = patchSessionWrite(id, { arrivedAt: now })
  if (t) writes.push(t)
  const res = storage.transaction(writes)
  if (!res.ok) return deny(res.error)
  const latest = getLatestOtp(id)
  const otp = latest && latest.status === 'ACTIVE' && dayjs(latest.expiresAt).isAfter(dayjs()) ? { ok: true, otp: latest } : generateOtp(id)
  notifyCustomer(record, { title: `Driver arrived: ${delivery.orderNumber}`, message: 'Your driver has arrived. Share the delivery OTP shown in the app to receive the goods (demo OTP — no SMS is sent).', type: 'warning' })
  logDispatchActivity(`arrived at ${delivery.customerName} (${delivery.orderNumber})`, id, 'delivery')
  return { ok: true, record: getDeliveryById(id) || record, otp: otp.ok ? otp.otp : null }
}

/* ------------------------------------------------------------------ */
/* Confirm (OTP)                                                       */
/* ------------------------------------------------------------------ */

/** Validate delivered / damaged quantities. items: [{ id, deliveredQuantity, damagedQuantity }]. */
export const validateDeliveryQuantities = (delivery, items, { receivedBy } = {}) => {
  const errors = {}
  let delivered = 0
  delivery.items.forEach((it) => {
    const input = items.find((x) => x.id === it.id) || {}
    const dq = input.deliveredQuantity === '' || input.deliveredQuantity === undefined ? NaN : Number(input.deliveredQuantity)
    const mq = input.damagedQuantity === '' || input.damagedQuantity === undefined ? 0 : Number(input.damagedQuantity)
    const whole = !DECIMAL_UNITS.includes(it.unit)
    if (Number.isNaN(dq)) errors[`item:${it.id}:delivered`] = 'Enter the delivered quantity.'
    else if (dq < 0) errors[`item:${it.id}:delivered`] = 'Cannot be negative.'
    else if (whole && !Number.isInteger(dq)) errors[`item:${it.id}:delivered`] = `Whole ${it.unit} only.`
    else if (dq > it.dispatchedQuantity) errors[`item:${it.id}:delivered`] = `Cannot exceed the ${it.dispatchedQuantity} dispatched.`
    if (Number.isNaN(mq) || mq < 0) errors[`item:${it.id}:damaged`] = 'Enter 0 or more.'
    else if (whole && !Number.isInteger(mq)) errors[`item:${it.id}:damaged`] = `Whole ${it.unit} only.`
    else if (mq > it.dispatchedQuantity) errors[`item:${it.id}:damaged`] = `Cannot exceed the ${it.dispatchedQuantity} dispatched.`
    else if (!Number.isNaN(dq) && dq + mq > it.dispatchedQuantity) errors[`item:${it.id}:damaged`] = `Delivered + damaged cannot exceed ${it.dispatchedQuantity}.`
    if (!Number.isNaN(dq)) delivered += dq
  })
  if (!Object.keys(errors).length && delivered <= 0) errors.form = 'Nothing was delivered. Use “Mark delivery failed” instead.'
  if (!String(receivedBy || '').trim()) errors.receivedBy = 'Enter the name of the person who received the goods.'
  return errors
}

export const confirmDelivery = (id, { items = [], receivedBy = '', remarks = '', otp = '', pod = null } = {}) => {
  const deliveries = getDeliveries()
  const delivery = getDeliveryById(id, deliveries)
  if (!delivery) return deny('This delivery no longer exists.')
  const who = requireDriverFor(delivery)
  if (who.error) return deny(who.error)
  if ([DL.DELIVERED, DL.PARTIALLY_DELIVERED].includes(delivery.status)) return deny(`${delivery.orderNumber} is already delivered. It was not confirmed again.`)
  if ([DL.FAILED, DL.RETURNED].includes(delivery.status)) return deny(`${delivery.orderNumber} was already marked failed.`)
  if (delivery.status !== DL.OUT_FOR_DELIVERY) return deny('Start the delivery before confirming it.')
  const qErrors = validateDeliveryQuantities(delivery, items, { receivedBy })
  if (Object.keys(qErrors).length) return { ok: false, errors: qErrors, error: qErrors.form || 'Check the delivered quantities.' }
  const podErrors = validatePod(delivery, items, pod)
  if (Object.keys(podErrors).length) return { ok: false, errors: podErrors, error: Object.values(podErrors)[0] }

  // OTP: wrong / expired / locked attempts are stored even though the delivery does not change
  const latest = getLatestOtp(id)
  const check = evaluateOtp(latest, otp)
  if (check.result !== 'ok') {
    if (check.next) recordOtpOutcome(check.next)
    if (check.next && latest) {
      const fresh = getDeliveries()
      storage.setItem(K.DELIVERIES, fresh.map((d) => (d.id === id ? { ...d, otpStatus: check.next.status } : d)))
    }
    return { ok: false, error: check.message, errors: { otp: check.message }, otpResult: check.result, attemptsLeft: check.attemptsLeft }
  }

  const now = new Date().toISOString()
  const lines = delivery.items.map((it) => {
    const input = items.find((x) => x.id === it.id) || {}
    const deliveredQuantity = round(Number(input.deliveredQuantity))
    const damagedQuantity = round(Number(input.damagedQuantity) || 0)
    return { ...it, deliveredQuantity, damagedQuantity, remainingQuantity: round(it.dispatchedQuantity - deliveredQuantity - damagedQuantity) }
  })
  const full = lines.every((l) => l.deliveredQuantity === l.dispatchedQuantity)
  const status = full ? DL.DELIVERED : DL.PARTIALLY_DELIVERED
  const dispatches = read(K.DISPATCHES)
  const dispatch = dispatches.find((d) => d.id === delivery.dispatchId)
  const notes = read(K.DELIVERY_NOTES)
  const { number, sequence } = nextDeliveryNoteNumber(notes)
  const noteId = uid('dn')
  const record = {
    ...delivery, items: lines, status, completedAt: now, completedBy: who.user.id, otpStatus: 'VERIFIED', otpVerifiedAt: now,
    receivedBy: receivedBy.trim(), remarks: remarks.trim(), deliveryNoteId: noteId, deliveryNoteNumber: number,
    reviewStatus: full ? null : 'PENDING', updatedAt: now,
  }
  const drivers = read(K.DRIVERS)
  const note = buildNoteRecord({
    id: noteId, noteNumber: number, delivery: record, dispatch, driver: drivers.find((d) => d.id === delivery.driverId),
    vehicle: read(K.VEHICLES).find((v) => v.id === delivery.vehicleId), hub: read(K.HUBS).find((h) => h.id === delivery.hubId), generatedAt: now, generatedBy: who.user.id,
  })
  const nextDeliveries = deliveries.map((d) => (d.id === id ? record : d))
  const closing = progressDispatch(dispatch, nextDeliveries, now)
  const orders = read(K.ORDERS)
  const order = orders.find((o) => o.id === delivery.orderId)
  const oStatus = full ? S.DELIVERED : S.PARTIALLY_DELIVERED
  const oRecord = order ? { ...order, orderStatus: oStatus, deliveredAt: now, deliveryNoteId: noteId, deliveryNoteNumber: number, updatedAt: now, updatedBy: who.user.id } : null
  const delivered = lines.reduce((s, l) => s + l.deliveredQuantity, 0)
  const remaining = lines.reduce((s, l) => s + l.remainingQuantity, 0)
  const damaged = lines.reduce((s, l) => s + l.damagedQuantity, 0)
  const events = [
    makeDispatchEvent(closing.record, full ? 'DELIVERY_COMPLETED' : 'PARTIAL_DELIVERY', {
      orderId: delivery.orderId, deliveryId: id, at: now,
      description: full ? `${delivery.orderNumber} · ${delivered} units · received by ${record.receivedBy} · OTP verified (simulated)` : `${delivery.orderNumber} · ${delivered} delivered, ${remaining} remaining, ${damaged} damaged · OTP verified (simulated)`,
      remarks: record.remarks,
    }),
    makeDispatchEvent(closing.record, 'DELIVERY_NOTE_GENERATED', { orderId: delivery.orderId, deliveryId: id, description: number, at: now }),
    ...closing.events,
  ]
  const res = commit({
    deliveries: nextDeliveries,
    dispatches: dispatches.map((d) => (d.id === dispatch.id ? closing.record : d)),
    orders: orders.map((o) => (o.id === delivery.orderId && oRecord ? oRecord : o)),
    dispatchEvents: events,
    orderEvents: oRecord ? [makeTimelineEvent(oRecord, oStatus, { remarks: `${number}${full ? '' : ` · ${remaining} remaining, ${damaged} damaged`}` })] : [],
    extra: [
      [K.DELIVERY_OTPS, read(K.DELIVERY_OTPS).map((o) => (o.id === check.next.id ? check.next : o))],
      [K.DELIVERY_NOTES, [note, ...notes]],
      [K.DELIVERY_SEQUENCE, sequence],
      ...podWrites(record, pod, { now, userId: who.user.id, noteId, noteNumber: number, outcome: full ? 'Full delivery' : 'Partial delivery' }),
    ],
  })
  if (!res.ok) return deny(res.error)
  logDispatchActivity(`${full ? 'delivered' : 'partially delivered'} ${delivery.orderNumber} to ${delivery.customerName} (${number})`, id, 'delivery')
  notifyDispatch(closing.record, {
    title: full ? `Delivery completed: ${delivery.orderNumber}` : `Partial delivery: ${delivery.orderNumber}`,
    message: full ? `${delivery.customerName} received ${delivered} units. Delivery note ${number}.` : `${delivery.customerName}: ${delivered} delivered, ${remaining} remaining, ${damaged} damaged. Review required.`,
    roles: [ROLES.ADMIN, ROLES.DISPATCHER], type: full ? 'success' : 'warning', link: `/dispatch/deliveries/${id}`,
  })
  if (order?.salesmanId) pushNotification({ title: full ? `Delivered: ${delivery.orderNumber}` : `Partially delivered: ${delivery.orderNumber}`, message: `${delivery.customerName} · delivery note ${number}.`, type: full ? 'success' : 'warning', userIds: [order.salesmanId], link: `/orders/${order.id}`, relatedOrderId: order.id })
  notifyCustomer(record, { title: full ? `Delivered: ${delivery.orderNumber}` : `Partially delivered: ${delivery.orderNumber}`, message: `OTP verified. Delivery note ${number} is now available in your documents.`, type: full ? 'success' : 'warning', link: `/customer/delivery-notes/${note.id}` })
  announceClose(dispatch, closing)
  fireEvent('DELIVERY_COMPLETED', { key: record.id, orderId: record.orderId, customerId: record.customerId, dispatchId: record.dispatchId, deliveryNoteId: note.id })
  return { ok: true, record, note, dispatch: closing.record }
}

/* ------------------------------------------------------------------ */
/* Proof of delivery                                                   */
/* ------------------------------------------------------------------ */

export const POD_MAX_CHARS = 350 * 1024
/**
 * pod: { signature (PNG data URL), photo (JPEG data URL), customerRemarks, rejected: { [itemId]: qty }, shortReason }
 * Rejected quantity is part of the undelivered (remaining) quantity, so it cannot exceed it.
 */
export const validatePod = (delivery, items, pod) => {
  const e = {}
  if (!pod) return e
  delivery.items.forEach((it) => {
    const input = items.find((x) => x.id === it.id) || {}
    const rem = it.dispatchedQuantity - (Number(input.deliveredQuantity) || 0) - (Number(input.damagedQuantity) || 0)
    const rq = pod.rejected?.[it.id]
    if (rq === undefined || rq === '') return
    const n = Number(rq)
    if (Number.isNaN(n) || n < 0) e[`item:${it.id}:rejected`] = 'Enter 0 or more.'
    else if (n > rem) e[`item:${it.id}:rejected`] = `Cannot exceed the ${round(Math.max(0, rem))} not delivered.`
  })
  if (pod.signature && String(pod.signature).length > POD_MAX_CHARS) e.signature = 'The signature image is too large.'
  if (pod.photo && String(pod.photo).length > POD_MAX_CHARS) e.photo = 'The photo is too large — retake it.'
  if (String(pod.customerRemarks || '').length > 300) e.customerRemarks = 'Use 300 characters or fewer.'
  return e
}

const podWrites = (record, pod, { now, userId, noteId, noteNumber, outcome }) => {
  const writes = []
  const stop = patchSessionWrite(record.id, { stoppedAt: now, arrivedAt: record.arrivedAt || now, outcome: 'delivered' })
  if (stop) writes.push(stop)
  const rejected = Object.fromEntries(Object.entries(pod?.rejected || {}).map(([k, v]) => [k, round(Number(v) || 0)]).filter(([, v]) => v > 0))
  const entry = {
    id: uid('pod'), deliveryId: record.id, orderId: record.orderId, customerId: record.customerId, driverId: record.driverId, noteId, noteNumber, outcome,
    receivedBy: record.receivedBy, signature: pod?.signature || null, photo: pod?.photo || null, customerRemarks: String(pod?.customerRemarks || '').trim(),
    deliveryRemarks: record.remarks || '', shortReason: pod?.shortReason || '', rejected,
    lines: record.items.map((it) => ({ itemId: it.id, productName: it.productName, unit: it.unit, dispatched: it.dispatchedQuantity, delivered: it.deliveredQuantity, damaged: it.damagedQuantity, short: it.remainingQuantity, rejected: rejected[it.id] || 0 })),
    otpVerifiedAt: now, arrivedAt: record.arrivedAt || null, capturedAt: now, capturedBy: userId,
  }
  writes.push([K.DELIVERY_POD, [entry, ...read(K.DELIVERY_POD)].slice(0, 200)])
  return writes
}


/* ------------------------------------------------------------------ */
/* Failure                                                             */
/* ------------------------------------------------------------------ */

export const failDelivery = (id, { reason = '', remarks = '' } = {}) => {
  const deliveries = getDeliveries()
  const delivery = getDeliveryById(id, deliveries)
  if (!delivery) return deny('This delivery no longer exists.')
  const who = requireDriverFor(delivery)
  if (who.error) return deny(who.error)
  if ([DL.DELIVERED, DL.PARTIALLY_DELIVERED].includes(delivery.status)) return deny(`${delivery.orderNumber} is already delivered and cannot be marked failed.`)
  if ([DL.FAILED, DL.RETURNED].includes(delivery.status)) return deny(`${delivery.orderNumber} is already marked failed.`)
  if (delivery.status !== DL.OUT_FOR_DELIVERY) return deny('Start the delivery before reporting a failure.')
  const errors = {}
  if (!FAILURE_REASONS.includes(reason)) errors.reason = 'Choose a failure reason.'
  if (reason === 'Other' && !remarks.trim()) errors.remarks = 'Describe what happened.'
  if (Object.keys(errors).length) return { ok: false, errors, error: Object.values(errors)[0] }

  const now = new Date().toISOString()
  const record = {
    ...delivery, status: DL.FAILED, failedAt: now, failureReason: reason, failureRemarks: remarks.trim(), reviewStatus: 'PENDING', updatedAt: now,
    items: delivery.items.map((it) => ({ ...it, deliveredQuantity: 0, damagedQuantity: 0, remainingQuantity: it.dispatchedQuantity })),
  }
  const dispatches = read(K.DISPATCHES)
  const dispatch = dispatches.find((d) => d.id === delivery.dispatchId)
  const nextDeliveries = deliveries.map((d) => (d.id === id ? record : d))
  const closing = progressDispatch(dispatch, nextDeliveries, now)
  const orders = read(K.ORDERS)
  const order = orders.find((o) => o.id === delivery.orderId)
  const oRecord = order ? { ...order, orderStatus: S.DELIVERY_FAILED, updatedAt: now, updatedBy: who.user.id } : null
  const res = commit({
    deliveries: nextDeliveries,
    dispatches: dispatches.map((d) => (d.id === dispatch.id ? closing.record : d)),
    orders: orders.map((o) => (o.id === delivery.orderId && oRecord ? oRecord : o)),
    dispatchEvents: [makeDispatchEvent(closing.record, 'DELIVERY_FAILED', { orderId: delivery.orderId, deliveryId: id, description: `${delivery.orderNumber} · ${reason} · attempt ${delivery.attempt || 1}`, remarks: remarks.trim(), at: now }), ...closing.events],
    orderEvents: oRecord ? [makeTimelineEvent(oRecord, 'DELIVERY_FAILED', { remarks: `${reason}${remarks.trim() ? ` — ${remarks.trim()}` : ''}` })] : [],
    extra: [patchSessionWrite(id, { stoppedAt: now, outcome: 'failed' })].filter(Boolean),
  })
  if (!res.ok) return deny(res.error)
  logDispatchActivity(`reported failed delivery ${delivery.orderNumber} (${reason})`, id, 'delivery')
  notifyDispatch(closing.record, { title: `Delivery failed: ${delivery.orderNumber}`, message: `${delivery.customerName} · ${reason}${remarks.trim() ? ` — ${remarks.trim()}` : ''}. Review required.`, roles: [ROLES.ADMIN, ROLES.DISPATCHER], type: 'danger', link: `/dispatch/deliveries/${id}` })
  notifyCustomer(record, { title: `Delivery not completed: ${delivery.orderNumber}`, message: `${reason}. Our team will contact you to reschedule.`, type: 'danger' })
  if (order?.salesmanId) pushNotification({ title: `Delivery failed: ${delivery.orderNumber}`, message: `${delivery.customerName} · ${reason}.`, type: 'danger', userIds: [order.salesmanId], link: `/orders/${order.id}`, relatedOrderId: order.id })
  announceClose(dispatch, closing)
  fireEvent('DELIVERY_FAILED', { key: record.id, orderId: record.orderId, customerId: record.customerId, dispatchId: record.dispatchId, extra: { reason: record.failureReason } })
  return { ok: true, record, dispatch: closing.record }
}

/* ------------------------------------------------------------------ */
/* Dispatcher review of failed / partial deliveries                    */
/* ------------------------------------------------------------------ */

/**
 * opts: { remarks, returnToHub, requeue }. returnToHub books the undelivered (not damaged) quantity back into
 * hub stock once. requeue (failed deliveries only, requires returnToHub) puts the order back in the ready queue.
 */
export const reviewDelivery = (id, { remarks = '', returnToHub = false, requeue = false } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'dispatch.manage')) return deny('Only the Dispatcher or Admin can review delivery exceptions.')
  const deliveries = getDeliveries()
  const delivery = getDeliveryById(id, deliveries)
  if (!delivery) return deny('This delivery no longer exists.')
  if (![DL.FAILED, DL.PARTIALLY_DELIVERED].includes(delivery.status)) return deny('Only failed or partial deliveries need review.')
  if (delivery.reviewStatus === 'REVIEWED') return deny(`${delivery.orderNumber} was already reviewed${delivery.returnedToHub ? ' and its stock returned' : ''}. No change was made.`)
  if (!remarks.trim()) return deny('Add review remarks.', { remarks: 'Add review remarks.' })
  if (requeue && (!returnToHub || delivery.status !== DL.FAILED)) return deny('Only a failed delivery whose goods are returned to the hub can be re-queued for dispatch.')
  if (returnToHub && delivery.returnedToHub) return deny('These goods were already returned to the hub.')

  const now = new Date().toISOString()
  const dispatches = read(K.DISPATCHES)
  const dispatch = dispatches.find((d) => d.id === delivery.dispatchId) || { id: delivery.dispatchId, dispatchNumber: delivery.dispatchNumber }
  const extra = []
  let created = []
  let inventoryAfter = null
  if (returnToHub) {
    const lines = delivery.items.map((it) => ({ productId: it.productId, quantity: it.remainingQuantity }))
    const r = returnDeliveryStock({ inventory: read(K.INVENTORY), movements: read(K.STOCK_MOVEMENTS), lines, hubId: delivery.hubId, dispatch, delivery, userId: user.id, at: now, products: read(K.PRODUCTS) })
    created = r.created
    inventoryAfter = r.inventory
    extra.push([K.STOCK_MOVEMENTS, mergeMovements(r.created, read(K.STOCK_MOVEMENTS))])
  }
  const returnedFailed = returnToHub && delivery.status === DL.FAILED
  const record = {
    ...delivery, status: returnedFailed ? DL.RETURNED : delivery.status, reviewStatus: 'REVIEWED', reviewedAt: now, reviewedBy: user.id, reviewRemarks: remarks.trim(),
    returnedToHub: returnToHub || delivery.returnedToHub, returnMovementIds: [...(delivery.returnMovementIds || []), ...created.map((m) => m.id)], updatedAt: now,
  }
  const orders = read(K.ORDERS)
  const order = orders.find((o) => o.id === delivery.orderId)
  let oRecord = null
  const orderEvents = []
  if (order && returnedFailed) {
    oRecord = requeue
      ? { ...order, orderStatus: S.READY_FOR_DISPATCH, dispatchId: null, deliveryId: null, driverId: null, vehicleId: null, dispatchedAt: null, outForDeliveryAt: null, updatedAt: now, updatedBy: user.id }
      : { ...order, orderStatus: S.RETURNED_TO_HUB, updatedAt: now, updatedBy: user.id }
    orderEvents.push(makeTimelineEvent(oRecord, 'RETURNED_TO_HUB', { remarks: remarks.trim() }))
    if (requeue) {
      // The returned goods are reserved again for the order, so the next dispatch can load them
      const rs = reserveOrder({ order: { ...oRecord, reservation: null }, inventory: inventoryAfter || read(K.INVENTORY), products: read(K.PRODUCTS), at: now })
      oRecord = rs.order
      inventoryAfter = rs.inventory
      orderEvents.push(makeTimelineEvent(oRecord, 'REQUEUED_FOR_DISPATCH', { remarks: 'Will be planned on a new dispatch.' }))
      orderEvents.push(makeTimelineEvent(oRecord, 'STOCK_RESERVED', { remarks: `${rs.reservedNow} units reserved again for the next dispatch.` }))
    }
  }
  if (inventoryAfter) extra.push([K.INVENTORY, inventoryAfter])
  const events = [makeDispatchEvent(dispatch, 'DELIVERY_REVIEWED', { orderId: delivery.orderId, deliveryId: id, description: `${delivery.orderNumber}${requeue ? ' · re-queued for dispatch' : ''}`, remarks: remarks.trim(), at: now })]
  if (created.length) events.push(makeDispatchEvent(dispatch, 'STOCK_RETURNED', { orderId: delivery.orderId, deliveryId: id, description: `${created.reduce((s, m) => s + m.quantity, 0)} units back in stock (${created.length} movement${created.length === 1 ? '' : 's'})`, at: now }))
  const res = commit({
    deliveries: deliveries.map((d) => (d.id === id ? record : d)),
    dispatches,
    orders: orders.map((o) => (oRecord && o.id === oRecord.id ? oRecord : o)),
    dispatchEvents: events,
    orderEvents,
    extra,
  })
  if (!res.ok) return deny(res.error)
  logDispatchActivity(`reviewed ${delivery.status === DL.FAILED ? 'failed' : 'partial'} delivery ${delivery.orderNumber}${created.length ? ' and returned stock to the hub' : ''}${requeue ? ' — re-queued' : ''}`, id, 'delivery')
  return { ok: true, record, movements: created, requeued: requeue }
}

/** Deliveries filtered for tracking / history pages. */
export const searchDeliveries = (q, f = {}, list = getDeliveries(), { dispatches = read(K.DISPATCHES) } = {}) => {
  const query = (q || '').trim().toLowerCase()
  const D = Object.fromEntries(dispatches.map((d) => [d.id, d]))
  return list.filter((d) => {
    const ds = D[d.dispatchId]
    if (query && ![d.orderNumber, d.customerName, d.dispatchNumber, d.deliveryNoteNumber, ds?.driverName, ds?.vehicleNumber].some((v) => String(v || '').toLowerCase().includes(query))) return false
    if (f.hubId && d.hubId !== f.hubId) return false
    if (f.zoneId && (ds?.zoneId || d.zoneId) !== f.zoneId) return false
    if (f.driverId && d.driverId !== f.driverId) return false
    if (f.customerId && d.customerId !== f.customerId) return false
    if (f.status && d.status !== f.status) return false
    if (f.dispatchStatus && ds?.status !== f.dispatchStatus) return false
    if (f.from && ds?.dispatchDate < f.from) return false
    if (f.to && ds?.dispatchDate > f.to) return false
    if (f.order && !String(d.orderNumber || '').toLowerCase().includes(f.order.toLowerCase())) return false
    return true
  })
}


const deliveryService = { getDeliveries, getDeliveryById, getDeliveriesForDispatch, startDelivery, confirmDelivery, failDelivery, reviewDelivery, canViewDelivery, searchDeliveries }
export default deliveryService
