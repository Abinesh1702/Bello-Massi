/**
 * Delivery notes (Phase 4). A note is generated only when a delivery outcome is recorded
 * (delivered or partially delivered) and is never edited afterwards. Numbering: BM-DN-YYYY-NNNNN.
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { STORAGE_KEYS as K } from '../utils/constants'
import { can } from '../config/permissions'
import { ROLES } from '../config/roles'
import { formatDeliveryNoteNumber } from './seed/dispatchSeed'
import { scopeOf } from './rbacService'

const read = (key, fallback = []) => storage.getItem(key, fallback) || fallback

export const getDeliveryNotes = () => read(K.DELIVERY_NOTES)
export const getDeliveryNoteById = (id, list = getDeliveryNotes()) => list.find((n) => n.id === id) || null
export const getDeliveryNoteForDelivery = (deliveryId, list = getDeliveryNotes()) => list.find((n) => n.deliveryId === deliveryId) || null

/** Next unused number and the sequence value to store with it. */
export const nextDeliveryNoteNumber = (notes = getDeliveryNotes()) => {
  const seq = storage.getItem(K.DELIVERY_SEQUENCE, null) || { year: dayjs().year(), lastNumber: 0 }
  const year = dayjs().year()
  const used = new Set(notes.map((n) => n.noteNumber))
  let n = (seq.year === year ? seq.lastNumber : 0) + 1
  while (used.has(formatDeliveryNoteNumber(year, n))) n += 1
  return { number: formatDeliveryNoteNumber(year, n), sequence: { year, lastNumber: n } }
}

/** Office roles see every note; a salesman sees notes for own orders; a driver sees notes for own deliveries. */
export const canViewDeliveryNote = (user, note, { orders = read(K.ORDERS), drivers = read(K.DRIVERS) } = {}) => {
  if (!user || !note) return false
  if (scopeOf(user) === ROLES.DRIVER) return drivers.find((d) => d.userId === user.id)?.id === note.driverId
  if (scopeOf(user) === ROLES.CUSTOMER) return Boolean(user.customerId) && note.customerId === user.customerId
  if (scopeOf(user) === ROLES.SALESMAN) {
    const o = orders.find((x) => x.id === note.orderId)
    return Boolean(o) && (o.salesmanId === user.id || o.createdBy === user.id)
  }
  return can(user, 'deliveryNotes.view')
}

export const searchDeliveryNotes = (q, f = {}, list = getDeliveryNotes()) => {
  const query = (q || '').trim().toLowerCase()
  return list.filter((n) => {
    if (query && ![n.noteNumber, n.orderNumber, n.dispatchNumber, n.customerName, n.driverName, n.vehicleNumber].some((v) => String(v || '').toLowerCase().includes(query))) return false
    if (f.hubId && n.hubId !== f.hubId) return false
    if (f.driverId && n.driverId !== f.driverId) return false
    if (f.status && n.deliveryStatus !== f.status) return false
    if (f.from && String(n.deliveryDate).slice(0, 10) < f.from) return false
    if (f.to && String(n.deliveryDate).slice(0, 10) > f.to) return false
    return true
  })
}

const deliveryNoteService = { getDeliveryNotes, getDeliveryNoteById, getDeliveryNoteForDelivery, canViewDeliveryNote, searchDeliveryNotes }
export default deliveryNoteService
