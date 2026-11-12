/**
 * Converts Phase 1/2 ("legacy") orders into the Phase 3 sales-order schema, producing
 * orders, an append-only timeline, approval decisions, consolidations and the order sequence.
 * Used both for fresh seeding and for migrating version-2 browser data and backups.
 */
import dayjs from 'dayjs'
import { calcLine, calcTotals } from '../../utils/orderMath'
import { TIMELINE_EVENTS } from '../../config/orderConfig'
import { formatMoney } from '../../utils/formatters'
import { getNumberingPrefix } from '../../config/runtimeConfig'

const LEGACY_STATUS = {
  DRAFT: 'DRAFT', PENDING_APPROVAL: 'SUBMITTED', RETURNED: 'RETURNED', REJECTED: 'REJECTED', APPROVED: 'APPROVED',
  WITH_CS: 'CONSOLIDATED', READY_FOR_DISPATCH: 'READY_FOR_DISPATCH', PLANNED: 'PLANNED', OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED', DELIVERY_PROBLEM: 'DELIVERY_PROBLEM',
}
const LEGACY_EVENT = {
  DRAFT: 'DRAFT_CREATED', PENDING_APPROVAL: 'SUBMITTED', APPROVED: 'APPROVED', RETURNED: 'RETURNED', REJECTED: 'REJECTED',
  WITH_CS: 'CONSOLIDATED', READY_FOR_DISPATCH: 'READY_FOR_DISPATCH', PLANNED: 'PLANNED', OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED', DELIVERY_PROBLEM: 'DELIVERY_PROBLEM',
}
const APPROVAL_FOR = { DRAFT: 'NOT_SUBMITTED', SUBMITTED: 'PENDING', RETURNED: 'RETURNED', REJECTED: 'REJECTED' }

const pad = (n, w) => String(n).padStart(w, '0')
export const formatOrderNumber = (year, n) => `${getNumberingPrefix('order')}-${year}-${pad(n, 5)}`

const legacyIndex = (legacyId) => Number(String(legacyId).replace(/\D/g, '').slice(-4)) - 1000

const classifyReject = (note = '') => (/duplicate/i.test(note) ? 'Duplicate order' : /credit/i.test(note) ? 'Credit limit exceeded' : 'Other')
const classifyReturn = (note = '') => (/quantity/i.test(note) ? 'Quantity needs confirmation' : /credit/i.test(note) ? 'Reduce order value (credit)' : 'Other')

export const convertLegacyOrders = (legacy, { customers, products, hubs, salesReps = [], users = [], drivers = [] }) => {
  const C = Object.fromEntries(customers.map((c) => [c.id, c]))
  const P = Object.fromEntries(products.map((p) => [p.id, p]))
  const H = Object.fromEntries(hubs.map((h) => [h.id, h]))
  const people = Object.fromEntries([...salesReps, ...users, ...drivers].map((x) => [x.id, x.name]))
  const nameOf = (id) => people[id] || 'System'

  const orders = []
  const timeline = []
  const approvals = []
  const consolidations = []
  let lastNumber = 0
  let year = dayjs().year()

  ;[...legacy].sort((a, b) => legacyIndex(a.id) - legacyIndex(b.id)).forEach((lo) => {
    const n = legacyIndex(lo.id)
    const id = `ord-${pad(n, 4)}`
    const customer = C[lo.customerId] || {}
    const hub = H[lo.hubId] || {}
    const status = LEGACY_STATUS[lo.status] || 'DRAFT'
    const oYear = dayjs(lo.createdAt).year()
    const orderNumber = status === 'DRAFT' ? null : formatOrderNumber(oYear, n)
    if (orderNumber && n > lastNumber) { lastNumber = n; year = oYear }

    const items = (lo.items || []).map((it, li) => {
      const p = P[it.productId] || {}
      const discountPercentage = p.discountAllowed && (n + li) % 3 === 0 ? Math.min(2.5, p.maxDiscountPercent || 0) : 0
      const base = { orderedQuantity: it.quantity, unitPrice: it.unitPrice, discountPercentage, taxPercentage: p.taxPercent ?? 0 }
      return {
        id: `${id}-l${li + 1}`,
        productId: it.productId,
        productCode: p.code || '',
        productName: p.name || 'Unknown product',
        sku: p.sku || '',
        unit: p.unit || '',
        ...base,
        ...calcLine(base),
        stockAvailable: null,
        itemNotes: '',
      }
    })
    const totals = calcTotals(items)

    const ev = (st) => [...(lo.history || [])].reverse().find((h) => h.status === st)
    const at = (st) => ev(st)?.at || null
    const by = (st) => ev(st)?.byUserId || null
    const rej = ev('REJECTED')
    const ret = ev('RETURNED')
    const createdAt = lo.createdAt

    const order = {
      id,
      orderNumber,
      orderDate: dayjs(createdAt).format('YYYY-MM-DD'),
      orderSource: lo.channel || 'call',
      customerId: lo.customerId,
      customerName: customer.name || 'Unknown customer',
      customerCode: customer.code || '',
      salesmanId: lo.salesmanId,
      salesmanName: nameOf(lo.salesmanId),
      hubId: lo.hubId,
      hubName: hub.name || '',
      zoneId: lo.zoneId || customer.zoneId || '',
      orderType: n % 9 === 0 ? 'Bulk' : n % 13 === 0 ? 'Urgent Replenishment' : 'Standard',
      orderPriority: n % 11 === 0 ? 'Urgent' : n % 7 === 0 ? 'High' : n % 5 === 0 ? 'Low' : 'Normal',
      deliveryAddress: [customer.addressLine1, customer.addressLine2].filter(Boolean).join(', '),
      deliveryCity: customer.city || '',
      deliveryState: customer.state || '',
      deliveryPincode: customer.pincode || '',
      requestedDeliveryDate: dayjs(lo.deliveryDate || dayjs(createdAt).add(1, 'day')).format('YYYY-MM-DD'),
      deliveryInstructions: n % 4 === 0 ? 'Deliver to the cold-room entrance before 11:00.' : '',
      paymentTerms: customer.creditEnabled ? 'Credit' : 'Cash on Delivery',
      creditDays: customer.creditEnabled ? customer.creditDays : 0,
      customerReference: lo.channel === 'email' ? `PO/${customer.code}/${pad(n, 3)}` : lo.channel === 'whatsapp' ? 'WhatsApp order' : '',
      notes: '',
      items,
      ...totals,
      orderStatus: status,
      approvalStatus: APPROVAL_FOR[status] || 'APPROVED',
      consolidationStatus: ['CONSOLIDATED', 'READY_FOR_DISPATCH', 'PLANNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_PROBLEM'].includes(status)
        ? 'COMPLETED' : status === 'APPROVED' ? 'PENDING' : 'NOT_STARTED',
      creditWarning: Boolean(customer.creditEnabled && customer.creditBalance + totals.totalAmount > customer.creditLimit),
      stockWarning: false,
      resubmissionCount: 0,
      duplicatedFrom: null,
      createdAt,
      updatedAt: lo.updatedAt || createdAt,
      createdBy: lo.salesmanId,
      updatedBy: (lo.history || []).slice(-1)[0]?.byUserId || lo.salesmanId,
      submittedAt: at('PENDING_APPROVAL'),
      submittedBy: by('PENDING_APPROVAL'),
      approvedAt: at('APPROVED'),
      approvedBy: by('APPROVED'),
      approvalRemarks: at('APPROVED') ? 'Within agreed terms.' : '',
      rejectedAt: rej?.at || null,
      rejectedBy: rej?.byUserId || null,
      rejectionReason: rej ? classifyReject(rej.note) : '',
      rejectionRemarks: rej?.note || '',
      returnedAt: ret?.at || null,
      returnedBy: ret?.byUserId || null,
      returnReason: ret ? classifyReturn(ret.note) : '',
      returnRemarks: ret?.note || '',
      consolidatedAt: at('WITH_CS'),
      consolidatedBy: by('WITH_CS'),
      consolidationId: null,
      readyForDispatchAt: at('READY_FOR_DISPATCH'),
      readyForDispatchBy: by('READY_FOR_DISPATCH'),
      // Dispatch / delivery fields (later phases)
      driverId: lo.driverId || null,
      deliveryDate: lo.deliveryDate || null,
      deliveredAt: lo.deliveredAt || null,
      onTime: lo.onTime ?? null,
    }

    ;(lo.history || []).forEach((h, hi) => {
      const type = LEGACY_EVENT[h.status]
      if (!type) return
      timeline.push({
        id: `tl-${id}-${hi}`,
        orderId: id,
        orderNumber,
        eventType: type,
        title: TIMELINE_EVENTS[type],
        description: `${orderNumber || 'Draft'} · ${order.customerName} · ${formatMoney(totals.totalAmount)}`,
        userId: h.byUserId,
        userName: nameOf(h.byUserId),
        timestamp: h.at,
        remarks: h.note || (type === 'APPROVED' ? order.approvalRemarks : ''),
      })
      if (['APPROVED', 'REJECTED', 'RETURNED'].includes(type)) {
        approvals.push({
          id: `apv-${id}-${hi}`,
          orderId: id,
          orderNumber,
          decision: type,
          reason: type === 'REJECTED' ? order.rejectionReason : type === 'RETURNED' ? order.returnReason : '',
          remarks: h.note || order.approvalRemarks,
          decidedBy: h.byUserId,
          decidedByName: nameOf(h.byUserId),
          decidedAt: h.at,
          orderTotal: totals.totalAmount,
          creditWarning: order.creditWarning,
          stockWarning: false,
        })
      }
    })

    if (order.consolidatedAt) {
      consolidations.push({ order, at: order.consolidatedAt })
    }
    orders.push(order)
  })

  const conRecords = consolidations
    .sort((a, b) => (a.at < b.at ? -1 : 1))
    .map(({ order }, i) => {
      const cid = `con-${pad(i + 1, 4)}`
      order.consolidationId = cid
      return {
        id: cid,
        consolidationNumber: `CON-${dayjs(order.consolidatedAt).year()}-${pad(i + 1, 4)}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        consolidatedBy: order.consolidatedBy,
        consolidatedByName: nameOf(order.consolidatedBy),
        consolidationDate: order.consolidatedAt,
        hubId: order.hubId,
        status: 'COMPLETED',
        notes: 'Checked against customer order and hub stock.',
        productSummary: order.items.map((it) => ({ productId: it.productId, productName: it.productName, quantity: it.orderedQuantity, unit: it.unit })),
        totalQuantity: order.totalQuantity,
        totalAmount: order.totalAmount,
        readyForDispatchAt: order.readyForDispatchAt,
        readyForDispatchBy: order.readyForDispatchBy,
      }
    })

  timeline.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
  return {
    orders,
    timeline,
    approvals: approvals.sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1)),
    consolidations: conRecords,
    sequence: { year, lastNumber, consolidationLast: conRecords.length },
  }
}
