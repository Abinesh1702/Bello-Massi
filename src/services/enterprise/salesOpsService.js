/**
 * Sales operations that touch the existing order and stock ledgers: approved order change requests, order
 * cancellation, sales returns (stock back through the single movement ledger) and standing-order templates
 * (creating a normal draft order — HORECA customers stay ordinary customer records).
 */
import dayjs from 'dayjs'
import storage from '../storageService'
import { STORAGE_KEYS as K, ORDER_STATUS as S } from '../../utils/constants'
import { MOVEMENT_TYPES as MT } from '../../config/masterData'
import { ACTIVE_DISPATCH_STATUSES } from '../../config/dispatchConfig'
import { makeTimelineEvent } from '../orderTimelineService'
import { cancelOrder, createOrder, deliveryFromCustomer, emptyOrderInput, newItemKey } from '../orderService'
import { postStockMovement } from '../inventoryService'
import { logAudit } from '../auditService'

const read = (k) => storage.getItem(k, []) || []
const CANCELLABLE = [S.DRAFT, S.SUBMITTED, S.RETURNED, S.APPROVED, S.CONSOLIDATED, S.READY_FOR_DISPATCH]

export const orderOf = (id) => read(K.ORDERS).find((o) => o.id === id) || null

const writeOrder = (order, patch, event, remarks) => {
  const next = { ...order, ...patch, updatedAt: new Date().toISOString() }
  const res = storage.transaction([
    [K.ORDERS, read(K.ORDERS).map((o) => (o.id === order.id ? next : o))],
    [K.ORDER_TIMELINE, [...read(K.ORDER_TIMELINE), makeTimelineEvent(next, event, { remarks })]],
  ])
  return res.ok ? { ok: true, order: next } : { ok: false, error: res.error }
}

/** Apply an approved change request to its order. Dispatched / delivered orders cannot be changed this way. */
export const applyOrderChange = (req) => {
  const order = orderOf(req.orderId)
  if (!order) return { ok: false, error: 'The order no longer exists.' }
  if (!CANCELLABLE.includes(order.orderStatus)) return { ok: false, error: `Order ${order.orderNumber} is ${order.orderStatus.replace(/_/g, ' ').toLowerCase()} — it can no longer be changed.` }
  const inDispatch = read(K.DISPATCHES).find((d) => d.orderIds.includes(order.id) && ACTIVE_DISPATCH_STATUSES.includes(d.status))
  if (inDispatch && req.changeType !== 'INSTRUCTIONS') return { ok: false, error: `Order is planned on dispatch ${inDispatch.dispatchNumber} — remove it from the dispatch first.` }
  const v = String(req.requestedValue || '').trim()
  // Cancellation goes through the one order cancellation path (releases the stock reservation, notifies)
  if (req.changeType === 'CANCELLATION') {
    const c = cancelOrder(order.id, { reason: req.reason, reference: req.number, system: true })
    if (c.ok) logAudit({ action: 'STATUS_CHANGE', module: 'orders', entity: 'Order', recordId: order.id, recordLabel: order.orderNumber, description: `Order ${order.orderNumber}: change request ${req.number} applied (CANCELLATION).` })
    return c.ok ? { ok: true, order: c.record } : c
  }
  let patch = {}
  if (req.changeType === 'DELIVERY_DATE') {
    if (!dayjs(v).isValid() || dayjs(v).isBefore(dayjs(), 'day')) return { ok: false, error: 'The requested delivery date must be today or later (YYYY-MM-DD).' }
    patch = { requestedDeliveryDate: dayjs(v).format('YYYY-MM-DD') }
  } else if (req.changeType === 'ADDRESS') {
    if (v.length < 5) return { ok: false, error: 'Enter the new delivery address.' }
    patch = { deliveryAddress: v }
  } else if (req.changeType === 'INSTRUCTIONS') patch = { deliveryInstructions: v }
  else return { ok: false, error: 'Unknown change type.' }
  const res = writeOrder(order, patch, 'CHANGE_APPLIED', `${req.number}: ${req.changeType.replace(/_/g, ' ').toLowerCase()}${v ? ` → ${v}` : ''}`)
  if (res.ok) logAudit({ action: 'EDIT', module: 'orders', entity: 'Order', recordId: order.id, recordLabel: order.orderNumber, description: `Order ${order.orderNumber}: change request ${req.number} applied (${req.changeType}).` })
  return res
}

/** Receive an approved sales return: resaleable quantities go back to stock (SALES_RETURN movement); others are logged. */
export const receiveSalesReturn = (ret) => {
  const posted = []
  for (const ln of ret.lines || []) {
    if (ln.condition !== 'Resaleable' || !(Number(ln.quantity) > 0)) continue
    const order = ret.orderId ? orderOf(ret.orderId) : null
    const r = postStockMovement({ productId: ln.productId, hubId: ret.hubId, type: MT.SALES_RETURN, quantity: ln.quantity, reference: ret.number, notes: `Sales return ${ret.number} (${ln.condition})`, orderId: ret.orderId || null, orderNumber: order?.orderNumber || null })
    if (!r.ok) return { ok: false, error: r.error }
    posted.push(r.movement.movementNumber)
  }
  return { ok: true, movements: posted }
}

/** Create a normal draft order from a standing-order template. */
export const orderFromTemplate = (tpl, user) => {
  const customer = read(K.CUSTOMERS).find((c) => c.id === tpl.customerId)
  if (!customer) return { ok: false, error: 'Customer not found.' }
  if (customer.status !== 'Active') return { ok: false, error: `${customer.name} is ${String(customer.status).toLowerCase()} — orders cannot be created.` }
  const input = {
    ...emptyOrderInput(user),
    customerId: customer.id, hubId: customer.hubId, salesmanId: customer.salesRepId || user.id,
    ...deliveryFromCustomer(customer),
    customerReference: tpl.number, notes: `Standing order from template ${tpl.number} — ${tpl.name}`,
    items: (tpl.lines || []).filter((l) => Number(l.quantity) > 0).map((l) => ({ key: newItemKey(), productId: l.productId, orderedQuantity: String(l.quantity), discountPercentage: '0', itemNotes: '' })),
  }
  const res = createOrder(input)
  if (!res.ok) return { ok: false, error: res.error || Object.values(res.errors || {})[0] || 'Could not create the order.' }
  return res
}

/** Sales achieved by a user in a month (YYYY-MM) from live orders (excludes drafts, rejected, returned, cancelled). */
export const salesAchieved = (userId, period, orders = read(K.ORDERS)) => orders
  .filter((o) => o.salesmanId === userId && String(o.orderDate || '').startsWith(period) && ![S.DRAFT, S.REJECTED, S.RETURNED, S.CANCELLED].includes(o.orderStatus))
  .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0)
