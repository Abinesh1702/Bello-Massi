/**
 * Communication › Call History.
 *
 * A manual call log: users record calls they made or received. No telephony is connected — nothing is dialled,
 * connected or recorded by the platform. Calls are linked to the customer, the responsible salesman and,
 * when the call produced one, the sales order. Salesmen (own-records scope) see only their calls.
 */
import dayjs from 'dayjs'
import storage from './storageService'
import { STORAGE_KEYS } from '../utils/constants'
import { can } from '../config/permissions'
import { ROLES } from '../config/roles'
import { getCurrentUser } from './authService'
import { scopeOf } from './rbacService'
import { pushNotification } from './notificationService'
import { uid } from '../utils/helpers'

const K = STORAGE_KEYS
const read = (k, f = []) => storage.getItem(k, f) || f
const deny = (msg, errors) => ({ ok: false, error: msg, errors: errors || { form: msg } })

export const CALL_DIRECTIONS = ['Incoming', 'Outgoing']
export const CALL_STATUSES = ['Connected', 'Missed', 'Busy', 'No Answer', 'Voicemail']
export const CALL_OUTCOMES = ['Order Received', 'Interested', 'Follow-up Required', 'No Response', 'Busy', 'Not Interested', 'Complaint', 'Payment Follow-up', 'Other']
export const STATUS_TONE = { Connected: 'success', Missed: 'danger', Busy: 'warning', 'No Answer': 'warning', Voicemail: 'neutral' }
export const OUTCOME_TONE = {
  'Order Received': 'success', Interested: 'info', 'Follow-up Required': 'warning', 'No Response': 'neutral', Busy: 'neutral', 'Not Interested': 'neutral',
  Complaint: 'danger', 'Payment Follow-up': 'accent', Other: 'neutral',
}
/** Outcomes that need a follow-up date by default. */
export const FOLLOW_UP_OUTCOMES = ['Follow-up Required', 'Interested', 'Complaint', 'Payment Follow-up', 'No Response']

export const getCalls = () => read(K.CALL_HISTORY)

/** Own-records roles (Salesman scope) see their calls; other roles with the permission see all. */
export const canViewCall = (user, call) => {
  if (!user || !call || !can(user, 'communication.calls')) return false
  if (scopeOf(user) === ROLES.SALESMAN) return call.salesmanId === user.id || call.createdBy === user.id
  return true
}
export const canManageCall = (user, call) => canViewCall(user, call) && can(user, 'calls.manage')
export const getVisibleCalls = (user, list = getCalls()) => list.filter((c) => canViewCall(user, c))

export const nextCallNumber = (list = getCalls(), year = dayjs().year()) => {
  const nums = list.map((c) => String(c.callNumber || '')).filter((n) => n.startsWith(`CALL-${year}-`)).map((n) => Number(n.split('-').pop()) || 0)
  return `CALL-${year}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0')}`
}

/** 'today' | 'upcoming' | 'overdue' | 'completed' | null */
export const followUpBucket = (c, today = dayjs().format('YYYY-MM-DD')) => {
  if (!c.followUpRequired) return null
  if (c.followUpStatus === 'Completed') return 'completed'
  if (!c.followUpDate) return 'upcoming'
  if (c.followUpDate < today) return 'overdue'
  if (c.followUpDate === today) return 'today'
  return 'upcoming'
}

export const formatDuration = (sec) => {
  const s = Number(sec) || 0
  if (!s) return '0:00'
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Salesmen a call can be assigned to: sales reps + users with the Salesman role. */
export const salesmanOptions = () => {
  const reps = read(K.DEMO_DATA, {})?.salesReps || []
  const users = read(K.DEMO_USERS).filter((u) => u.role === ROLES.SALESMAN && u.status !== 'inactive')
  const map = new Map()
  ;[...users.map((u) => [u.id, u.name]), ...reps.map((r) => [r.userId || r.id, r.name])].forEach(([id, name]) => { if (!map.has(id)) map.set(id, name) })
  return [...map.entries()].map(([value, label]) => ({ value, label }))
}

export const validateCall = (v) => {
  const e = {}
  const customer = read(K.CUSTOMERS).find((c) => c.id === v.customerId)
  if (!customer) e.customerId = 'Select the customer.'
  if (!salesmanOptions().some((s) => s.value === v.salesmanId)) e.salesmanId = 'Select the salesman responsible.'
  if (!CALL_DIRECTIONS.includes(v.direction)) e.direction = 'Choose incoming or outgoing.'
  if (!CALL_STATUSES.includes(v.status)) e.status = 'Choose the call status.'
  if (!CALL_OUTCOMES.includes(v.outcome)) e.outcome = 'Choose the outcome.'
  if (!v.callDate || !dayjs(v.callDate).isValid()) e.callDate = 'Enter the call date.'
  else if (dayjs(v.callDate).isAfter(dayjs(), 'day')) e.callDate = 'A call cannot be logged in the future.'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v.callTime || ''))) e.callTime = 'Enter the time (HH:MM).'
  const mins = Number(v.durationMinutes || 0)
  const secs = Number(v.durationSeconds || 0)
  if (Number.isNaN(mins) || Number.isNaN(secs) || mins < 0 || secs < 0 || secs > 59 || mins > 600) e.durationMinutes = 'Enter a valid duration.'
  if (v.status === 'Connected' && !(mins * 60 + secs > 0)) e.durationMinutes = 'A connected call needs a duration.'
  const phone = String(v.phone || '').trim()
  if (!phone) e.phone = 'Enter the phone number.'
  else if (!/^\+?[\d\s()-]{7,20}$/.test(phone)) e.phone = 'Enter a valid phone number.'
  if (String(v.remarks || '').length > 500) e.remarks = 'Use 500 characters or fewer.'
  if (v.followUpRequired) {
    if (!v.followUpDate || !dayjs(v.followUpDate).isValid()) e.followUpDate = 'Choose the follow-up date.'
    else if (v.callDate && v.followUpDate < v.callDate) e.followUpDate = 'Follow-up cannot be before the call.'
  }
  if (v.relatedOrderId && !read(K.ORDERS).some((o) => o.id === v.relatedOrderId && o.customerId === v.customerId)) e.relatedOrderId = 'Pick an order of this customer.'
  return { errors: e, customer }
}

const note = (user, text) => ({ id: uid('cn'), at: new Date().toISOString(), by: user?.id || null, byName: user?.name || 'System', text })
const salesName = (id) => salesmanOptions().find((s) => s.value === id)?.label || 'Sales team'

export const saveCall = (values, { id = null } = {}) => {
  const user = getCurrentUser()
  if (!can(user, 'calls.manage')) return deny('You do not have permission to log calls.')
  const list = getCalls()
  const existing = id ? list.find((c) => c.id === id) : null
  if (id && !existing) return deny('This call no longer exists.')
  if (existing && !canManageCall(user, existing)) return deny('You cannot edit this call.')
  const v = scopeOf(user) === ROLES.SALESMAN ? { ...values, salesmanId: user.id } : values
  const { errors, customer } = validateCall(v)
  if (Object.keys(errors).length) return deny('Please fix the highlighted fields.', errors)
  const order = v.relatedOrderId ? read(K.ORDERS).find((o) => o.id === v.relatedOrderId) : null
  const now = new Date().toISOString()
  const base = {
    customerId: customer.id, customerName: customer.name, customerCode: customer.code, contactPerson: String(v.contactPerson || '').trim(), phone: String(v.phone).trim(),
    salesmanId: v.salesmanId, salesmanName: salesName(v.salesmanId), direction: v.direction, callDate: v.callDate, callTime: v.callTime,
    durationSeconds: Math.round(Number(v.durationMinutes || 0) * 60 + Number(v.durationSeconds || 0)), status: v.status, outcome: v.outcome, remarks: String(v.remarks || '').trim(),
    followUpRequired: Boolean(v.followUpRequired), followUpDate: v.followUpRequired ? v.followUpDate : null, followUpNotes: v.followUpRequired ? String(v.followUpNotes || '').trim() : '',
    relatedOrderId: order?.id || null, relatedOrderNumber: order?.orderNumber || null, updatedAt: now,
  }
  let record
  if (existing) {
    const followStatus = base.followUpRequired ? (existing.followUpRequired ? existing.followUpStatus || 'Pending' : 'Pending') : null
    record = { ...existing, ...base, followUpStatus: followStatus, followUpCompletedAt: followStatus === 'Completed' ? existing.followUpCompletedAt : null, notes: [...existing.notes, note(user, 'Call details updated.')] }
  } else {
    record = {
      id: uid('call'), callNumber: nextCallNumber(list), ...base, followUpStatus: base.followUpRequired ? 'Pending' : null, followUpCompletedAt: null, followUpCompletedBy: null,
      notes: base.remarks ? [note(user, base.remarks)] : [], source: 'Manual log', createdBy: user.id, createdByName: user.name, createdAt: now,
    }
  }
  const res = storage.setItem(K.CALL_HISTORY, existing ? list.map((c) => (c.id === id ? record : c)) : [record, ...list])
  if (!res.ok) return deny(res.error)
  if (!existing && record.followUpRequired && record.salesmanId !== user.id) {
    pushNotification({ title: `Follow-up: ${record.customerName}`, message: `${user.name} logged a call that needs your follow-up on ${dayjs(record.followUpDate).format('DD MMM')}.`, type: 'info', userIds: [record.salesmanId], link: `/communication/calls/${record.id}`, category: 'orders' })
  }
  return { ok: true, record }
}

const patch = (id, fn) => {
  const user = getCurrentUser()
  const list = getCalls()
  const c = list.find((x) => x.id === id)
  if (!c) return deny('This call no longer exists.')
  if (!canManageCall(user, c)) return deny('You cannot change this call.')
  const out = fn(c, user)
  if (out.error) return deny(out.error, out.errors)
  const record = { ...c, ...out, updatedAt: new Date().toISOString() }
  const res = storage.setItem(K.CALL_HISTORY, list.map((x) => (x.id === id ? record : x)))
  return res.ok ? { ok: true, record } : deny(res.error)
}

export const scheduleFollowUp = (id, { date, notes = '' }) => patch(id, (c, user) => {
  if (!date || !dayjs(date).isValid()) return { error: 'Choose the follow-up date.', errors: { date: 'Choose the follow-up date.' } }
  if (date < c.callDate) return { error: 'Follow-up cannot be before the call.', errors: { date: 'Follow-up cannot be before the call.' } }
  const was = c.followUpRequired && c.followUpStatus === 'Pending'
  return {
    followUpRequired: true, followUpDate: date, followUpNotes: String(notes || c.followUpNotes || '').trim(), followUpStatus: 'Pending', followUpCompletedAt: null, followUpCompletedBy: null,
    notes: [...c.notes, note(user, `${was ? 'Follow-up rescheduled' : 'Follow-up scheduled'} for ${dayjs(date).format('DD MMM YYYY')}${notes ? ` — ${notes}` : ''}`)],
  }
})

export const completeFollowUp = (id, { notes = '' } = {}) => patch(id, (c, user) => {
  if (!c.followUpRequired || c.followUpStatus === 'Completed') return { error: 'There is no open follow-up on this call.' }
  return { followUpStatus: 'Completed', followUpCompletedAt: new Date().toISOString(), followUpCompletedBy: user.id, notes: [...c.notes, note(user, `Follow-up completed${notes ? ` — ${notes}` : ''}`)] }
})

export const addCallNote = (id, text) => patch(id, (c, user) => {
  const t = String(text || '').trim()
  if (t.length < 2) return { error: 'Write a note first.', errors: { text: 'Write a note first.' } }
  if (t.length > 500) return { error: 'Use 500 characters or fewer.', errors: { text: 'Use 500 characters or fewer.' } }
  return { notes: [...c.notes, note(user, t)] }
})

export const deleteCall = (id) => {
  const user = getCurrentUser()
  const list = getCalls()
  const c = list.find((x) => x.id === id)
  if (!c) return deny('This call no longer exists.')
  if (!canManageCall(user, c)) return deny('You cannot delete this call.')
  const res = storage.setItem(K.CALL_HISTORY, list.filter((x) => x.id !== id))
  return res.ok ? { ok: true } : deny(res.error)
}

/** Called after an order is saved from "Create order from call": links the order back to the call. */
export const linkOrderToCall = (callId, order) => {
  const list = getCalls()
  const c = list.find((x) => x.id === callId)
  if (!c || !order || order.customerId !== c.customerId) return { ok: false }
  const user = getCurrentUser()
  const record = {
    ...c, relatedOrderId: order.id, relatedOrderNumber: order.orderNumber, outcome: c.outcome === 'Order Received' ? c.outcome : 'Order Received', updatedAt: new Date().toISOString(),
    followUpStatus: c.followUpRequired && c.followUpStatus === 'Pending' ? 'Completed' : c.followUpStatus,
    followUpCompletedAt: c.followUpRequired && c.followUpStatus === 'Pending' ? new Date().toISOString() : c.followUpCompletedAt,
    notes: [...c.notes, note(user, `Sales order ${order.orderNumber} created from this call.`)],
  }
  return storage.setItem(K.CALL_HISTORY, list.map((x) => (x.id === callId ? record : x)))
}
