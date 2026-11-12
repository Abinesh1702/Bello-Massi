/**
 * Sales Manager approval: approve, reject, return for correction.
 * Only SUBMITTED orders with a PENDING approval can be decided — re-checked against live
 * storage on every call, so double clicks or two open tabs cannot decide twice.
 * Approval reserves the order's stock at its hub (utils/stockReservation) in the same transaction; it never
 * changes on-hand stock (that happens once, at dispatch confirmation) or credit balances.
 */
import { fireEvent } from './automationService'
import storage from './storageService'
import { getCurrentUser } from './authService'
import { makeTimelineEvent, logOrderActivity } from './orderTimelineService'
import { canViewOrder, getHubStockLevel, getOrderCreditPosition, getOrderById, getOrders, notifyOrder } from './orderService'
import { STORAGE_KEYS as K, ORDER_STATUS as S, APPROVAL_STATUS as A, CONSOLIDATION_STATUS as CS } from '../utils/constants'
import { uid } from '../utils/helpers'
import { can } from '../config/permissions'
import { ROLES } from '../config/roles'
import { REJECTION_REASONS, RETURN_REASONS } from '../config/orderConfig'
import { formatCurrency, formatMoney } from '../utils/formatters'
import { getApprovalConfig } from '../config/runtimeConfig'
import { reserveOrder } from '../utils/stockReservation'

const read = (key, fallback = []) => storage.getItem(key, fallback) || fallback

export const isPending = (o) => o?.orderStatus === S.SUBMITTED && o?.approvalStatus === A.PENDING
export const getPendingApprovals = (list = getOrders()) => list.filter(isPending)
export const getApprovalHistory = (orderId, all = read(K.APPROVALS)) =>
  (orderId ? all.filter((a) => a.orderId === orderId) : all).sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1))

/**
 * Live approval checks. severity 'block' prevents approval; 'warn' needs the manager to acknowledge.
 */
export const getApprovalChecks = (order, ctx = {}) => {
  const customers = ctx.customers || read(K.CUSTOMERS)
  const hubs = ctx.hubs || read(K.HUBS)
  const products = ctx.products || read(K.PRODUCTS)
  const inventory = ctx.inventory || read(K.INVENTORY)
  const customer = customers.find((c) => c.id === order.customerId)
  const hub = hubs.find((h) => h.id === order.hubId)
  const P = Object.fromEntries(products.map((p) => [p.id, p]))
  const credit = customer ? getOrderCreditPosition(customer, order.totalAmount) : null
  const shortLines = order.items.filter((it) => {
    const p = P[it.productId]
    if (!p?.trackInventory) return false
    return it.orderedQuantity > getHubStockLevel(it.productId, order.hubId, inventory).available
  })
  const inactiveProducts = order.items.filter((it) => P[it.productId]?.status !== 'Active')

  return [
    { key: 'customer', label: 'Customer active', severity: 'block', ok: customer?.status === 'Active',
      detail: !customer ? 'Customer record no longer exists.' : customer.status === 'Active' ? `${customer.name} is active.` : `${customer.name} is ${customer.status.toLowerCase()}.` },
    { key: 'hub', label: 'Hub active', severity: 'block', ok: hub?.status === 'Active',
      detail: !hub ? 'Hub record no longer exists.' : hub.status === 'Active' ? `${hub.name} is active.` : `${hub.name} is inactive.` },
    { key: 'credit', label: 'Credit within limit', severity: getApprovalConfig().blockWhenCreditExceeded ? 'block' : 'warn', ok: Boolean(credit) && !credit.exceedsAfterOrder && !credit.alreadyExceeded,
      detail: !credit ? 'No customer.' : !credit.enabled ? `Credit disabled — ${order.paymentTerms}.` : credit.alreadyExceeded
        ? `Already over limit by ${formatCurrency(credit.balance - credit.limit)} before this order.`
        : credit.exceedsAfterOrder ? `This order would exceed the limit by ${formatCurrency(credit.projectedBalance - credit.limit)}.`
          : `${formatCurrency(credit.projectedAvailable)} credit left after this order.` },
    { key: 'stock', label: 'Stock available', severity: 'warn', ok: shortLines.length === 0,
      detail: shortLines.length ? `${shortLines.length} line${shortLines.length > 1 ? 's' : ''} exceed available stock at ${order.hubName}: ${shortLines.map((l) => l.productName).join(', ')}.` : `All lines are covered by ${order.hubName} stock.` },
    { key: 'total', label: 'Order total valid', severity: 'block', ok: order.totalAmount > 0 && order.items.length > 0,
      detail: order.items.length ? `${order.items.length} lines · total ${formatMoney(order.totalAmount)}.` : 'Order has no lines.' },
    { key: 'products', label: 'Products active', severity: 'block', ok: inactiveProducts.length === 0,
      detail: inactiveProducts.length ? `Not orderable: ${inactiveProducts.map((l) => l.productName).join(', ')}.` : 'All products are active.' },
  ]
}

const deny = (msg) => ({ ok: false, error: msg, errors: { form: msg } })

const guard = (id, permission = 'orders.approve') => {
  const user = getCurrentUser()
  if (!can(user, permission)) return { error: deny(permission === 'orders.approve' ? 'You do not have permission to approve orders.' : 'You do not have permission to reject or return orders.') }
  const orders = getOrders()
  const order = getOrderById(id, orders)
  if (!order) return { error: deny('This order no longer exists.') }
  if (order.orderStatus === S.DRAFT) return { error: deny('Draft orders cannot be decided — the salesman has not submitted it.') }
  if (!isPending(order)) {
    const done = { APPROVED: 'approved', REJECTED: 'rejected', RETURNED: 'returned for correction' }[order.approvalStatus]
    return { error: deny(`${order.orderNumber} has already been ${done || 'decided'}. No change was made.`) }
  }
  return { user, orders, order }
}

const decide = (g, patch, decision, { reason = '', remarks = '' }, { prepare } = {}) => {
  const now = new Date().toISOString()
  let record = { ...g.order, ...patch, updatedAt: now, updatedBy: g.user.id }
  const extra = []
  const events = []
  if (prepare) {
    const p = prepare(record, now)
    record = p.record
    extra.push(...(p.writes || []))
    events.push(...(p.events || []))
  }
  const approval = {
    id: uid('apv'),
    orderId: record.id,
    orderNumber: record.orderNumber,
    decision,
    reason,
    remarks,
    decidedBy: g.user.id,
    decidedByName: g.user.name,
    decidedAt: now,
    orderTotal: record.totalAmount,
    creditWarning: record.creditWarning,
    stockWarning: record.stockWarning,
  }
  const event = makeTimelineEvent(record, decision, { remarks: [reason, remarks].filter(Boolean).join(' — ') })
  const res = storage.transaction([
    [K.ORDERS, g.orders.map((o) => (o.id === record.id ? record : o))],
    [K.APPROVALS, [approval, ...read(K.APPROVALS)]],
    [K.ORDER_TIMELINE, [...read(K.ORDER_TIMELINE), event, ...events]],
    ...extra,
  ])
  if (!res.ok) return deny(res.error)
  logOrderActivity(record, decision)
  return { ok: true, record, approval }
}

export const approveOrder = (id, { remarks = '', acknowledgeWarnings = false } = {}) => {
  const g = guard(id, 'orders.approve')
  if (g.error) return g.error
  if (getApprovalConfig().requireApprovalRemarks && !String(remarks).trim()) return { ok: false, error: 'Approval remarks are required (Application Settings › Approval).', errors: { remarks: 'Enter approval remarks.' } }
  const checks = getApprovalChecks(g.order)
  const blocking = checks.filter((c) => c.severity === 'block' && !c.ok)
  if (blocking.length) return deny(`Cannot approve: ${blocking.map((c) => c.detail).join(' ')}`)
  const warnings = checks.filter((c) => c.severity === 'warn' && !c.ok)
  if (warnings.length && !acknowledgeWarnings) return { ok: false, needsAcknowledgement: true, error: 'Confirm that you have reviewed the credit and stock warnings.', errors: { acknowledge: 'Confirm that you have reviewed the warnings.' } }
  const now = new Date().toISOString()
  const res = decide(g, {
    orderStatus: S.APPROVED, approvalStatus: A.APPROVED, consolidationStatus: CS.PENDING,
    approvedAt: now, approvedBy: g.user.id, approvalRemarks: remarks.trim(),
    approvedWithWarnings: warnings.map((w) => w.key),
  }, 'APPROVED', { remarks: remarks.trim() || (warnings.length ? `Approved with ${warnings.map((w) => w.label.toLowerCase()).join(' and ')} warnings reviewed.` : '') }, {
    // Stock availability check + reservation at the order's hub, committed with the approval
    prepare: (record, now) => {
      const r = reserveOrder({ order: record, inventory: read(K.INVENTORY), products: read(K.PRODUCTS), at: now })
      const st = r.order.reservation.status
      const remarksText = st === 'RESERVED' ? 'All tracked lines reserved at the hub.' : st === 'PARTIAL' ? 'Part of the stock reserved — the rest is reserved when it becomes available (consolidation).' : 'No stock available to reserve yet — reserved at consolidation when stock arrives.'
      return { record: r.order, writes: [[K.INVENTORY, r.inventory]], events: [makeTimelineEvent(r.order, 'STOCK_RESERVED', { remarks: `${r.reservedNow} units · ${remarksText}` })] }
    },
  })
  if (!res.ok) return res
  const r = res.record
  notifyOrder(r, { title: `Order approved: ${r.orderNumber}`, message: `${r.customerName} was approved by ${g.user.name}.${remarks ? ` “${remarks.trim()}”` : ''}`, type: 'success', toSalesman: true })
  notifyOrder(r, { title: `Order awaiting consolidation: ${r.orderNumber}`, message: `${r.customerName} · ${r.salesmanName} — approved and ready for consolidation.`, roles: [ROLES.CUSTOMER_SERVICE], link: `/orders/consolidation/${r.id}` })
  fireEvent('ORDER_APPROVED', { key: r.id, orderId: r.id, customerId: r.customerId })
  return res
}

const validateReason = (reason, remarks, reasons, label) => {
  const errors = {}
  if (!reasons.includes(reason)) errors.reason = `Select a ${label} reason.`
  if (!String(remarks || '').trim()) errors.remarks = 'Remarks are required so the salesman knows what to do.'
  else if (String(remarks).trim().length < (Number(getApprovalConfig().rejectionRemarksMinLength) || 5)) errors.remarks = 'Please give a little more detail.'
  return errors
}

export const rejectOrder = (id, { reason, remarks } = {}) => {
  const g = guard(id, 'orders.reject')
  if (g.error) return g.error
  const errors = validateReason(reason, remarks, REJECTION_REASONS, 'rejection')
  if (Object.keys(errors).length) return { ok: false, errors }
  const now = new Date().toISOString()
  const res = decide(g, {
    orderStatus: S.REJECTED, approvalStatus: A.REJECTED, consolidationStatus: CS.NOT_STARTED,
    rejectedAt: now, rejectedBy: g.user.id, rejectionReason: reason, rejectionRemarks: remarks.trim(),
  }, 'REJECTED', { reason, remarks: remarks.trim() })
  if (!res.ok) return res
  notifyOrder(res.record, { title: `Order rejected: ${res.record.orderNumber}`, message: `${reason} — ${remarks.trim()}`, type: 'danger', toSalesman: true })
  fireEvent('ORDER_REJECTED', { key: res.record.id, orderId: res.record.id, customerId: res.record.customerId, extra: { reason } })
  return res
}

export const returnOrderForCorrection = (id, { reason, remarks } = {}) => {
  const g = guard(id, 'orders.reject')
  if (g.error) return g.error
  const errors = validateReason(reason, remarks, RETURN_REASONS, 'correction')
  if (Object.keys(errors).length) return { ok: false, errors }
  const now = new Date().toISOString()
  const res = decide(g, {
    orderStatus: S.RETURNED, approvalStatus: A.RETURNED, consolidationStatus: CS.NOT_STARTED,
    returnedAt: now, returnedBy: g.user.id, returnReason: reason, returnRemarks: remarks.trim(),
  }, 'RETURNED', { reason, remarks: remarks.trim() })
  if (!res.ok) return res
  notifyOrder(res.record, { title: `Order returned for correction: ${res.record.orderNumber}`, message: `${reason} — ${remarks.trim()}`, type: 'warning', toSalesman: true, link: `/orders/${res.record.id}/edit` })
  return res
}

export const canDecide = (user, order) => (can(user, 'orders.approve') || can(user, 'orders.reject')) && isPending(order) && canViewOrder(user, order)

const approvalService = { getPendingApprovals, approveOrder, rejectOrder, returnOrderForCorrection, getApprovalHistory, getApprovalChecks }
export default approvalService
