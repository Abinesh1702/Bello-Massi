/**
 * Demo data for the finalisation release (data v8): scrap requests and call history.
 *
 * Pure functions over a data snapshot, so they run on a fresh seed AND on the v7 → v8 migration of existing
 * browser data. Completed scrap write-offs are posted into the stock ledger consistently: the stock record is
 * reduced, a "Scrap Write-off" movement is inserted at its date and every later movement of that stock line is
 * shifted, so on-hand quantities, the movement ledger and the scrap register always agree.
 */
import dayjs from 'dayjs'
import { customerCoords, driveMinutes, hubCoords, roadKm } from '../../utils/demoGeo'

const SCRAP_MT = 'Scrap Write-off'
const r3 = (n) => Math.round(n * 1000) / 1000
const pad = (n, w = 4) => String(n).padStart(w, '0')

const hist = (at, action, user, note = '') => ({ id: `sch-${action.replace(/\W+/g, '').toLowerCase()}-${Date.parse(at)}`, at, action, by: user?.id || null, byName: user?.name || 'System', note })

/**
 * Insert a past-dated write-off into the ledger of one stock line. Returns the movement, or null when the line
 * never had enough stock (in which case nothing changes).
 */
const insertWriteOff = ({ movements, rec, quantity, at, reference, notes, by, source }) => {
  const line = movements.filter((m) => m.productId === rec.productId && m.hubId === rec.hubId)
  const before = line.filter((m) => m.date <= at).sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  const after = line.filter((m) => m.date > at)
  const avail = (r) => r.totalQuantity - (r.reservedQuantity || 0) - (r.damagedQuantity || 0)
  const prevTotal = before ? before.newQuantity : after.length ? after.sort((a, b) => (a.date < b.date ? -1 : 1))[0].previousQuantity : rec.totalQuantity
  const prevAvail = before ? before.newAvailable : after.length ? after[0].previousAvailable : avail(rec)
  const floor = Math.min(prevAvail, avail(rec), ...after.map((m) => Math.min(m.previousAvailable, m.newAvailable)))
  const q = source === 'damaged' ? Math.min(quantity, rec.damagedQuantity || 0) : Math.min(quantity, Math.floor(floor * 0.1))
  if (!(q >= 1)) return null
  after.forEach((m) => {
    m.previousQuantity = r3(m.previousQuantity - q); m.newQuantity = r3(m.newQuantity - q)
    if (source !== 'damaged') { m.previousAvailable = r3(m.previousAvailable - q); m.newAvailable = r3(m.newAvailable - q) }
  })
  rec.totalQuantity = r3(rec.totalQuantity - q)
  if (source === 'damaged') rec.damagedQuantity = r3(rec.damagedQuantity - q)
  const maxNo = Math.max(1000, ...movements.map((m) => Number(String(m.movementNumber || '').split('-').pop()) || 0))
  const movement = {
    id: `mov-scr-${reference}`, movementNumber: `MOV-${dayjs(at).year()}-${pad(maxNo + 1, 5)}`, date: at, productId: rec.productId, hubId: rec.hubId,
    movementType: SCRAP_MT, quantity: q, previousQuantity: prevTotal, newQuantity: r3(prevTotal - q),
    previousAvailable: prevAvail, newAvailable: source === 'damaged' ? prevAvail : r3(prevAvail - q), referenceNumber: reference, createdBy: by, notes,
  }
  movements.push(movement)
  return movement
}

// [productIndex, hubIndex, status, reason, daysAgo, quantity, source, batch, remarks]
const SCRAP_PLAN = [
  [0, 0, 'COMPLETED', 'Expired', 26, 6, 'available', 'B-2608-CH', 'Shelf life ended in the frozen store.'],
  [3, 1, 'COMPLETED', 'Temperature Excursion', 19, 4, 'available', 'B-2610-07', 'Chiller alarm for 3 hours; QA hold confirmed loss.'],
  [5, 0, 'COMPLETED', 'Packaging Damage', 12, 5, 'available', '', 'Cartons crushed during unloading.'],
  [8, 2, 'COMPLETED', 'Quality Rejected', 6, 3, 'available', 'B-2611-02', 'Failed QA colour and odour check.'],
  [2, 0, 'PENDING_APPROVAL', 'Damaged', 2, 3, 'available', '', 'Forklift damage in aisle 4.'],
  [6, 1, 'PENDING_APPROVAL', 'Expired', 1, 4, 'available', 'B-2609-11', 'Batch expired on the 9th.'],
  [10, 0, 'APPROVED', 'Contamination', 1, 2, 'available', 'B-2611-05', 'Foreign matter found during inspection.'],
  [4, 2, 'REJECTED', 'Damaged', 9, 8, 'available', '', 'Outer cartons dented.'],
  [7, 0, 'DRAFT', 'Other', 0, 2, 'available', '', 'Labels unreadable after condensation.'],
  [1, 1, 'CANCELLED', 'Expired', 40, 5, 'available', 'B-2607-03', 'Raised in error — stock was within shelf life.'],
  [9, 0, 'COMPLETED', 'Expired', 70, 4, 'available', 'B-2608-19', 'Expired stock found in the monthly count.'],
  [11, 1, 'COMPLETED', 'Packaging Damage', 105, 3, 'available', '', 'Pallet wrap failure in transit.'],
]

export const buildScrapData = ({ now = dayjs(), products = [], hubs = [], inventory = [], movements = [], users = [] }) => {
  const by = (id) => users.find((u) => u.id === id) || null
  const requesters = [by('u-inventory'), by('u-qa'), by('u-warehouse'), by('u-dispatcher')].filter(Boolean)
  const approver = by('u-warehouse') || by('u-admin') || users[0] || { id: 'u-admin', name: 'Administrator' }
  const adminApprover = by('u-admin') || approver
  const activeHubs = hubs.filter((h) => h.status !== 'Inactive')
  const requests = []
  const plan = [...SCRAP_PLAN].sort((a, b) => b[4] - a[4])
  let n = 0
  plan.forEach(([pi, hi, status, reason, daysAgo, qty, source, batch, remarks], i) => {
    const product = products[pi % Math.max(1, products.length)]
    const hub = activeHubs[hi % Math.max(1, activeHubs.length)]
    if (!product || !hub) return
    const rec = inventory.find((r) => r.productId === product.id && r.hubId === hub.id)
    if (!rec) return
    const requester = requesters[i % requesters.length] || approver
    const approverUser = requester.id === approver.id ? adminApprover : approver
    const created = now.subtract(daysAgo, 'day').hour(9 + (i % 6)).minute((i * 13) % 60).second(0).millisecond(0)
    const at = (h) => created.add(h, 'hour').toISOString()
    const year = created.year()
    n += 1
    const scrapNumber = `SCR-${year}-${pad(n)}`
    const unitCost = Number(product.purchasePrice) || 0
    const history = [hist(created.toISOString(), 'Draft created', requester)]
    const base = {
      id: `scr-${pad(n)}`, scrapNumber, status, productId: product.id, productName: product.name, productCode: product.code, category: product.category, unit: product.unit,
      batchNumber: batch, hubId: hub.id, hubName: hub.name, warehouseId: null, stockSource: source, quantity: qty, unitCost, value: Math.round(qty * unitCost * 100) / 100,
      reason, remarks, photos: [], documents: [], requestDate: created.format('YYYY-MM-DD'), requestedBy: requester.id, requestedByName: requester.name,
      createdAt: created.toISOString(), updatedAt: created.toISOString(), submittedAt: null,
      approvedBy: null, approvedByName: null, approvedAt: null, approvalRemarks: '', rejectedBy: null, rejectedByName: null, rejectedAt: null, rejectionReason: '',
      writeOff: null, cancelledAt: null, cancelReason: '', demo: true,
    }
    if (status !== 'DRAFT') { base.submittedAt = at(1); history.push(hist(at(1), 'Submitted', requester), hist(at(1), 'Pending approval', requester, 'Waiting for an approver')) }
    if (status === 'CANCELLED') { base.cancelledAt = at(3); base.cancelReason = 'Raised in error.'; history.push(hist(at(3), 'Cancelled', requester, 'Raised in error.')) }
    if (status === 'REJECTED') {
      Object.assign(base, { rejectedBy: approverUser.id, rejectedByName: approverUser.name, rejectedAt: at(5), rejectionReason: 'Inner packs intact — move to the outlet sale bin instead of scrapping.' })
      history.push(hist(at(5), 'Rejected', approverUser, base.rejectionReason))
    }
    if (status === 'APPROVED' || status === 'COMPLETED') {
      Object.assign(base, { approvedBy: approverUser.id, approvedByName: approverUser.name, approvedAt: at(4), approvalRemarks: 'Verified physically.' })
      history.push(hist(at(4), 'Approved', approverUser, 'Verified physically.'))
    }
    if (status === 'APPROVED' || status === 'PENDING_APPROVAL') {
      // Keep open requests within what is actually eligible today.
      const avail = rec.totalQuantity - (rec.reservedQuantity || 0) - (rec.damagedQuantity || 0)
      const committed = requests.filter((r) => ['APPROVED', 'PENDING_APPROVAL'].includes(r.status) && r.productId === product.id && r.hubId === hub.id).reduce((s, r) => s + r.quantity, 0)
      const q = Math.min(qty, Math.max(0, Math.floor(avail - committed)))
      if (q < 1) { n -= 1; return }
      base.quantity = q
      base.value = Math.round(q * unitCost * 100) / 100
    }
    if (status === 'COMPLETED') {
      const mv = insertWriteOff({ movements, rec, quantity: qty, at: at(5), reference: scrapNumber, notes: `${reason}${batch ? ` · batch ${batch}` : ''} — ${remarks}`, by: approverUser.id, source })
      if (!mv) { n -= 1; return }
      base.quantity = mv.quantity
      base.value = Math.round(mv.quantity * unitCost * 100) / 100
      base.writeOff = { movementId: mv.id, movementNumber: mv.movementNumber, at: mv.date, by: approverUser.id, byName: approverUser.name, quantity: mv.quantity, previousQuantity: mv.previousQuantity, newQuantity: mv.newQuantity, value: base.value }
      history.push(hist(at(5), 'Stock written off', approverUser, `${mv.movementNumber} · on hand ${mv.previousQuantity} → ${mv.newQuantity} ${product.unit}`), hist(at(5), 'Completed', approverUser))
    }
    base.updatedAt = history[history.length - 1].at
    base.history = history
    requests.push(base)
  })
  movements.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return { requests: requests.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), inventory, movements }
}

/* ------------------------------------------------------------------ */
/* Call history                                                         */
/* ------------------------------------------------------------------ */

// [customerIndex, daysAgo, hh:mm, direction, durationSec, status, outcome, followUp: null | [inDays, status], remarks]
const CALL_PLAN = [
  [0, 0, '09:15', 'Outgoing', 312, 'Connected', 'Order Received', null, 'Weekly frozen chicken order confirmed.'],
  [9, 0, '10:05', 'Incoming', 185, 'Connected', 'Follow-up Required', [0, 'Pending'], 'Wants revised pricing for banquet volumes.'],
  [3, 0, '11:40', 'Outgoing', 0, 'Missed', 'No Response', [1, 'Pending'], 'No answer — try after lunch.'],
  [7, 1, '14:20', 'Outgoing', 246, 'Connected', 'Interested', [2, 'Pending'], 'Interested in the new seafood range.'],
  [1, 1, '16:05', 'Incoming', 128, 'Connected', 'Complaint', [-1, 'Pending'], 'Two cartons arrived thawed; wants credit note.'],
  [4, 2, '09:50', 'Outgoing', 95, 'Connected', 'Payment Follow-up', [-2, 'Pending'], 'Promised payment of the overdue invoice by Friday.'],
  [11, 2, '12:30', 'Outgoing', 0, 'Busy', 'Busy', [0, 'Pending'], 'Line busy.'],
  [5, 3, '10:10', 'Incoming', 420, 'Connected', 'Order Received', null, 'Festival stock order placed over the phone.'],
  [8, 3, '15:45', 'Outgoing', 60, 'Connected', 'Not Interested', null, 'Has a running contract with another supplier.'],
  [2, 4, '11:00', 'Outgoing', 210, 'Connected', 'Follow-up Required', [-3, 'Completed'], 'Asked for the price list by email.'],
  [12, 5, '09:30', 'Incoming', 275, 'Connected', 'Order Received', null, 'Banquet order for the weekend.'],
  [6, 5, '17:10', 'Outgoing', 0, 'Missed', 'No Response', [-4, 'Completed'], 'Called back next morning.'],
  [10, 6, '10:20', 'Outgoing', 154, 'Connected', 'Interested', [5, 'Pending'], 'Will trial the frozen paneer.'],
  [13, 7, '13:15', 'Outgoing', 330, 'Connected', 'Order Received', null, 'Restocked dairy line.'],
  [14, 8, '11:45', 'Incoming', 88, 'Connected', 'Payment Follow-up', [-6, 'Completed'], 'Cheque handed to the driver.'],
  [0, 9, '09:05', 'Outgoing', 140, 'Connected', 'Other', null, 'Confirmed the new delivery window 08:00–10:00.'],
  [15, 10, '16:40', 'Outgoing', 0, 'Missed', 'No Response', null, 'No answer.'],
  [16, 11, '12:00', 'Incoming', 365, 'Connected', 'Order Received', null, 'Hotel supplies replenishment.'],
  [9, 12, '10:30', 'Outgoing', 198, 'Connected', 'Order Received', null, 'Monthly order for Marina Hotels.'],
  [3, 13, '15:00', 'Outgoing', 76, 'Connected', 'Follow-up Required', [-10, 'Completed'], 'Needed approval from their owner.'],
  [7, 15, '11:20', 'Incoming', 230, 'Connected', 'Order Received', null, 'Added vegetables to the standing order.'],
  [1, 17, '09:40', 'Outgoing', 0, 'Busy', 'Busy', null, 'Line busy.'],
  [4, 19, '14:35', 'Outgoing', 312, 'Connected', 'Interested', [-12, 'Completed'], 'Requested samples.'],
  [11, 21, '10:55', 'Incoming', 145, 'Connected', 'Complaint', [-18, 'Completed'], 'Short delivery of 2 cartons — resolved.'],
  [5, 24, '16:15', 'Outgoing', 260, 'Connected', 'Order Received', null, 'Weekend stock order.'],
  [12, 27, '11:10', 'Outgoing', 180, 'Connected', 'Interested', null, 'Asked about catering packs.'],
]

const STATUS_DURATION_ZERO = ['Missed', 'Busy', 'No Answer']

export const buildCallData = ({ now = dayjs(), customers = [], orders = [], users = [], salesReps = [] }) => {
  const active = customers.filter((c) => c.status !== 'Inactive')
  const nameOf = (id) => users.find((u) => u.id === id)?.name || salesReps.find((s) => s.id === id)?.name || 'Sales team'
  const usedOrders = new Set()
  const calls = []
  CALL_PLAN.forEach(([ci, daysAgo, time, direction, duration, status, outcome, fu, remarks], i) => {
    const c = active[ci % Math.max(1, active.length)]
    if (!c) return
    const day = now.subtract(daysAgo, 'day')
    const [hh, mm] = time.split(':').map(Number)
    const at = day.hour(hh).minute(mm).second(0).millisecond(0)
    const salesmanId = c.salesRepId || 'u-salesman'
    let related = null
    if (outcome === 'Order Received') {
      related = orders.filter((o) => o.customerId === c.id && !usedOrders.has(o.id))
        .sort((a, b) => Math.abs(dayjs(a.createdAt).diff(at)) - Math.abs(dayjs(b.createdAt).diff(at)))[0] || null
      if (related) usedOrders.add(related.id)
    }
    const fuDate = fu ? now.add(fu[0], 'day').format('YYYY-MM-DD') : null
    const createdBy = salesmanId.startsWith('u-') ? salesmanId : 'u-cs'
    const notes = [{ id: `cn-${pad(i + 1)}-1`, at: at.add(duration || 30, 'second').toISOString(), by: createdBy, byName: nameOf(createdBy), text: remarks }]
    if (fu && fu[1] === 'Completed') notes.push({ id: `cn-${pad(i + 1)}-2`, at: now.add(fu[0], 'day').hour(17).minute(0).toISOString(), by: createdBy, byName: nameOf(createdBy), text: 'Follow-up done — customer contacted.' })
    calls.push({
      id: `call-${pad(i + 1)}`, callNumber: `CALL-${at.year()}-${pad(CALL_PLAN.length - i)}`,
      customerId: c.id, customerName: c.name, customerCode: c.code, contactPerson: c.contactPerson || '', phone: c.mobile || c.phone || '',
      salesmanId, salesmanName: nameOf(salesmanId), direction, callDate: at.format('YYYY-MM-DD'), callTime: time,
      durationSeconds: STATUS_DURATION_ZERO.includes(status) ? 0 : duration, status, outcome, remarks,
      followUpRequired: Boolean(fu), followUpDate: fuDate, followUpNotes: fu ? (fu[1] === 'Completed' ? 'Call back as agreed.' : 'Call back as agreed with the customer.') : '',
      followUpStatus: fu ? fu[1] : null, followUpCompletedAt: fu && fu[1] === 'Completed' ? now.add(fu[0], 'day').hour(17).toISOString() : null,
      followUpCompletedBy: fu && fu[1] === 'Completed' ? createdBy : null,
      relatedOrderId: related?.id || null, relatedOrderNumber: related?.orderNumber || null,
      notes, source: 'Manual log', createdBy, createdByName: nameOf(createdBy), createdAt: at.toISOString(), updatedAt: notes[notes.length - 1].at, demo: true,
    })
  })
  return calls.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

/** Requested delivery time windows for VIP customers' open orders (used for ETA warnings in the driver app). */
export const withVipDeliveryTimes = (orders = [], customers = []) => {
  const vip = new Set(customers.filter((c) => c.isVip).map((c) => c.id))
  return orders.map((o, i) => (vip.has(o.customerId) && !o.requestedDeliveryTime ? { ...o, requestedDeliveryTime: ['10:00', '11:00', '11:30', '12:00'][i % 4] } : o))
}

/** DEMO GPS sessions for deliveries already out for delivery in the seed (so tracking works from the first load). */
export const buildTrackingSeed = ({ deliveries = [], customers = [], hubs = [], now = dayjs() }) => {
  const C = Object.fromEntries(customers.map((c) => [c.id, c]))
  const H = Object.fromEntries(hubs.map((h) => [h.id, h]))
  const sessions = deliveries.filter((d) => d.status === 'OUT_FOR_DELIVERY').map((d, i) => {
    const hub = H[d.hubId]
    const prev = deliveries.filter((x) => x.dispatchId === d.dispatchId && x.sequence < d.sequence && x.completedAt).sort((a, b) => b.sequence - a.sequence)[0]
    const origin = prev ? customerCoords(C[prev.customerId] || prev, hub) : hubCoords(hub)
    const destination = customerCoords(C[d.customerId] || d, hub)
    const distanceKm = roadKm(origin, destination)
    return {
      id: `trk-seed-${i + 1}`, deliveryId: d.id, dispatchId: d.dispatchId, driverId: d.driverId, vehicleId: d.vehicleId, customerId: d.customerId, orderId: d.orderId,
      origin, destination, distanceKm, plannedMinutes: driveMinutes(distanceKm), startedAt: d.startedAt || now.subtract(10, 'minute').toISOString(), arrivedAt: null, stoppedAt: null, outcome: null, simulated: true,
    }
  })
  return { sessions }
}
