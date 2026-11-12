/**
 * End-to-end business workflow check (service layer, no browser).
 *
 *   node --import ./scripts/register.mjs scripts/workflow-check.mjs
 *
 * Runs the Order-to-Cash scenario against a fresh in-memory LocalStorage seeded exactly like the app:
 * sales order → approval (stock reservation) → consolidation → dispatch → driver (start, arrive, OTP, POD) →
 * delivery → invoice → payment → outstanding balance, plus the negative cases (rejection, cancellation, partial /
 * failed / rescheduled delivery, insufficient stock, wrong OTP, unauthorised access, duplicate invoice / payment).
 * Exits with code 1 when any check fails.
 */
const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() { return mem.size },
}
globalThis.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
globalThis.window = globalThis
globalThis.addEventListener = () => {}
globalThis.removeEventListener = () => {}
globalThis.dispatchEvent = () => true
if (!globalThis.CustomEvent) globalThis.CustomEvent = class CustomEvent extends Event { constructor(t, o) { super(t); this.detail = o?.detail } }

const src = new URL('../src/', import.meta.url).href
const imp = (p) => import(src + p)

const { initializeStorage } = await imp('services/storageService.js')
const { syncCatalog } = await imp('services/rbacService.js')
const { initRuntimeConfig } = await imp('services/appSettingsService.js')
const { installAuditHook } = await imp('services/auditService.js')
const { ensureEnterpriseModules } = await imp('config/enterprise/modules/index.js')
const { installBatchSync } = await imp('services/enterprise/batchService.js')
initializeStorage(); syncCatalog(); initRuntimeConfig(); installAuditHook(); ensureEnterpriseModules(); installBatchSync()

const storage = (await imp('services/storageService.js')).default
const { STORAGE_KEYS: K, ORDER_STATUS: S } = await imp('utils/constants.js')
const auth = await imp('services/authService.js')
const orders = await imp('services/orderService.js')
const approval = await imp('services/approvalService.js')
const consolidation = await imp('services/consolidationService.js')
const dispatch = await imp('services/dispatchService.js')
const delivery = await imp('services/deliveryService.js')
const otp = await imp('services/otpService.js')
const invoice = await imp('services/invoiceService.js')
const records = await imp('services/enterprise/recordService.js')
const finance = await imp('services/enterprise/financeService.js')
const { getAvailable } = await imp('utils/stock.js')
const { can } = await imp('config/permissions.js')
const orderCfg = await imp('config/orderConfig.js')
const reservation = await imp('utils/stockReservation.js')

const read = (k) => storage.getItem(k, []) || []
const addr = (c) => ({ deliveryAddress: [c.addressLine1, c.addressLine2].filter(Boolean).join(', '), deliveryCity: c.city, deliveryState: c.state, deliveryPincode: c.pincode })
let failures = 0
const results = []
const check = (name, cond, detail = '') => {
  results.push({ name, ok: !!cond })
  if (!cond) failures += 1
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? `  — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`)
}
const PASSWORDS = { superadmin: 'Super@123', admin: 'Admin@123', manager: 'Manager@123', salesman: 'Sales@123', cs: 'Cs@123', dispatcher: 'Dispatch@123', driver: 'Driver@123', finance: 'Finance@123', customer: 'Customer@123', warehouse: 'Warehouse@123', supplier: 'Supplier@123' }
const as = async (u) => { auth.logout('switch'); const r = await auth.login(u, PASSWORDS[u]); if (!r.ok) throw new Error(`login ${u}: ${r.error}`); return auth.getCurrentUser() }
const inv = (productId, hubId) => read(K.INVENTORY).find((r) => r.productId === productId && r.hubId === hubId)
const order = (id) => orders.getOrderById(id)


/** Plan a dispatch for today with the first driver + vehicle the service accepts (the demo data has busy crews). */
const planDispatch = (orderIds, { preferDriverUser = null } = {}) => {
  const os = orderIds.map((id) => order(id))
  const hub = os[0].hubId
  const zones = read(K.DISPATCH_ZONES).filter((z) => z.hubId === hub && z.status === 'Active')
  const zoneId = (zones.find((z) => z.id === os[0].zoneId) || zones[0])?.id
  const drivers = read(K.DRIVERS).filter((d) => !preferDriverUser || d.userId === preferDriverUser).sort((a, b) => (a.userId === preferDriverUser ? -1 : b.userId === preferDriverUser ? 1 : 0))
  const vehicles = read(K.VEHICLES)
  for (const d of drivers) for (const v of vehicles) {
    const input = { hubId: hub, dispatchDate: new Date().toISOString().slice(0, 10), driverId: d.id, vehicleId: v.id, zoneId, orderIds, notes: '' }
    const val = dispatch.validateDispatch(input, { mode: 'plan' })
    if (Object.keys(val.errors).length) continue
    const r = dispatch.createDispatch(input, { mode: 'plan' })
    if (r.ok) return r
  }
  if (process.env.DEBUG) { const d = drivers[0], v = vehicles[0]; console.log('DBG', JSON.stringify(dispatch.validateDispatch({ hubId: hub, dispatchDate: new Date().toISOString().slice(0, 10), driverId: d.id, vehicleId: v.id, zoneId, orderIds }, { mode: 'plan' }).errors), drivers.length, vehicles.length, vehicles.map((x) => [x.vehicleNumber, x.status, x.hubId]).slice(0, 12), hub) }
  return dispatch.createDispatch({ hubId: hub, dispatchDate: new Date().toISOString().slice(0, 10), zoneId, orderIds }, { mode: 'plan' })
}

/* ------------------------------------------------------------------ main scenario */
const salesman = await as('salesman')
const customers = read(K.CUSTOMERS).filter((c) => c.status === 'Active' && !c.creditHold)
const products = read(K.PRODUCTS).filter((p) => p.status === 'Active' && p.trackInventory)
const scoped = customers.filter((c) => !c.salesmanId || c.salesmanId === salesman.id)
const customer = scoped.find((c) => (c.creditLimit || 0) - (c.outstandingBalance || 0) > 5000) || scoped[0]
const hubId = customer.hubId || read(K.HUBS)[0].id
const stocked = products.filter((p) => (getAvailable(inv(p.id, hubId)) || 0) > 20).slice(0, 2)
check('scenario data: customer and 2 stocked products found', customer && stocked.length === 2)
const mk = async (qty = 2, user = 'salesman', prods = stocked) => {
  const u = await as(user)
  const i = orders.emptyOrderInput(u)
  Object.assign(i, addr(customer), { customerId: customer.id, hubId, paymentTerms: 'Cash on Delivery', items: prods.map((p) => ({ key: orders.newItemKey(), productId: p.id, orderedQuantity: qty })) })
  const c = orders.createOrder(i)
  if (!c.ok) return { error: c }
  const cid = (c.record || c.order).id
  const s = orders.submitOrder(cid, orders.orderToInput(order(cid)))
  return s.ok ? order(cid) : { error: s }
}

const input = orders.emptyOrderInput(salesman)
Object.assign(input, addr(customer), { customerId: customer.id, hubId, paymentTerms: 'Cash on Delivery', items: stocked.map((p) => ({ key: orders.newItemKey(), productId: p.id, orderedQuantity: 5 })) })
const created = orders.createOrder(input)
check('1-4 sales executive creates order (draft)', created.ok && (created.record || created.order)?.orderStatus === S.DRAFT, created.error || created.errors)
const oid = (created.record || created.order)?.id
const sub = orders.submitOrder(oid, orders.orderToInput(order(oid)))
check('5 order submitted → pending approval', sub.ok && order(oid).orderStatus === S.SUBMITTED && order(oid).approvalStatus === 'PENDING', sub.error || sub.errors)

const availBefore = stocked.map((p) => getAvailable(inv(p.id, hubId)))
const reservedBefore = stocked.map((p) => inv(p.id, hubId).reservedQuantity || 0)
await as('manager')
const ap = approval.approveOrder(oid, { remarks: 'ok', acknowledgeWarnings: true })
check('7 sales manager approves order', ap.ok && order(oid).orderStatus === S.APPROVED, ap.error)
check('8 approval reserves stock (reserved +5 per line)', stocked.every((p, i) => (inv(p.id, hubId).reservedQuantity || 0) === reservedBefore[i] + 5), stocked.map((p, i) => [reservedBefore[i], inv(p.id, hubId).reservedQuantity]))
check('8 available stock reduced by the reservation', stocked.every((p, i) => getAvailable(inv(p.id, hubId)) === availBefore[i] - 5), stocked.map((p, i) => [availBefore[i], getAvailable(inv(p.id, hubId))]))
check('notification raised for the salesman on approval', read(K.NOTIFICATIONS).some((n) => (n.link || '').includes(oid) || (n.message || '').includes(order(oid).orderNumber)))

await as('cs')
const con = consolidation.consolidateOrder(oid, { notes: 'checked', verified: Object.fromEntries(consolidation.VERIFICATION_STEPS.map((s) => [s.id || s.key, true])) })
check('9 customer service consolidates order', con.ok && order(oid).orderStatus === S.CONSOLIDATED, con.error || con.errors)
const rdy = consolidation.markReadyForDispatch(oid)
check('9 order released ready for dispatch', rdy.ok && order(oid).orderStatus === S.READY_FOR_DISPATCH, rdy.error)

// The demo driver is mid-route in the seed data: finish his current stops first (sequence, OTP, POD each time).
const pod = { signature: 'data:image/png;base64,iVBORw0KGgo=', photo: null, signedBy: 'Store manager' }
const drvUserId = read(K.DEMO_USERS).find((u) => u.username === 'driver')?.id
const finishRoute = async (driverUserId) => {
  const u = read(K.DEMO_USERS).find((x) => x.id === driverUserId)
  const drv = read(K.DRIVERS).find((d) => d.userId === driverUserId)
  PASSWORDS[u.username] ||= 'Driver@123'
  await as(u.username)
  let guard = 0
  for (;;) {
    const active = dispatch.getDispatches().find((d) => d.driverId === drv.id && ['CONFIRMED', 'IN_TRANSIT'].includes(d.status) && !delivery.isFutureDispatch(d))
    if (!active || guard++ > 20) break
    const next = delivery.getNextStop(delivery.getDeliveriesForDispatch(active.id))
    if (!next) break
    if (next.status !== 'OUT_FOR_DELIVERY') { const r = delivery.startDelivery(next.id); if (!r.ok) { console.log('   finishRoute start:', r.error); break } }
    if (!delivery.getDeliveryById(next.id).arrivedAt) delivery.markArrived(next.id)
    const d = delivery.getDeliveryById(next.id)
    const its = d.items.map((it) => ({ ...it, deliveredQuantity: it.orderedQuantity ?? it.quantity, damagedQuantity: 0, shortQuantity: 0, rejectedQuantity: 0 }))
    const r = delivery.confirmDelivery(next.id, { items: its, receivedBy: 'Receiver', otp: otp.getLatestOtp(next.id)?.otp, pod })
    if (!r.ok) { console.log('   finishRoute confirm:', r.error || JSON.stringify(r.errors)); break }
  }
}
await finishRoute(drvUserId)

await as('dispatcher')
const today = new Date().toISOString().slice(0, 10)
let dc = planDispatch([oid], { preferDriverUser: drvUserId })
check('10-12 dispatch created with vehicle and driver', dc.ok && !!(dc.record || dc.dispatch)?.driverId && !!(dc.record || dc.dispatch)?.vehicleId, dc.error || dc.errors)
const did = (dc.record || dc.dispatch)?.id
const dispatched = dispatch.getDispatchById(did)
const totalBefore = stocked.map((p) => inv(p.id, hubId).totalQuantity)
const reservedMid = stocked.map((p) => inv(p.id, hubId).reservedQuantity || 0)
const cf = dispatch.confirmDispatch(did, { acknowledged: true })
check('13 dispatch confirmed → order dispatched', cf.ok && order(oid).orderStatus === S.DISPATCHED, cf.error || cf.errors)
check('13 stock deducted once at dispatch (on hand −5)', stocked.every((p, i) => inv(p.id, hubId).totalQuantity === totalBefore[i] - 5), stocked.map((p, i) => [totalBefore[i], inv(p.id, hubId).totalQuantity]))
check('13 reservation released at dispatch (reserved −5)', stocked.every((p, i) => (inv(p.id, hubId).reservedQuantity || 0) === reservedMid[i] - 5), stocked.map((p, i) => [reservedMid[i], inv(p.id, hubId).reservedQuantity]))
const dlv = delivery.getDeliveries().find((d) => d.dispatchId === did && d.orderId === oid)
check('delivery record created for the order', !!dlv)

// driver
const driverUser = read(K.DEMO_USERS).find((u) => u.id === dispatched?.driverId || read(K.DRIVERS).find((d) => d.id === dispatch.getDispatchById(did)?.driverId)?.userId === u.id)
const drvUsername = driverUser?.username
if (drvUsername && !PASSWORDS[drvUsername]) PASSWORDS[drvUsername] = 'Driver@123'
await as(drvUsername || 'driver')
const st = delivery.startDelivery(dlv.id)
check('16 driver starts route (out for delivery)', st.ok && order(oid).orderStatus === S.OUT_FOR_DELIVERY, st.error)
const ar = delivery.markArrived(dlv.id)
check('17 driver reaches customer location (OTP issued)', ar.ok && !!otp.getLatestOtp(dlv.id), ar.error)
const items = (delivery.getDeliveryById(dlv.id).items || []).map((it) => ({ ...it, deliveredQuantity: it.orderedQuantity ?? it.quantity, damagedQuantity: 0, shortQuantity: 0, rejectedQuantity: 0 }))
const wrong = delivery.confirmDelivery(dlv.id, { items, receivedBy: 'Store manager', otp: '000000', pod })
check('invalid OTP blocks completion', !wrong.ok && order(oid).orderStatus !== S.DELIVERED, wrong)
const code = otp.getLatestOtp(dlv.id)?.otp
const okc = delivery.confirmDelivery(dlv.id, { items, receivedBy: 'Store manager', otp: code, pod })
check('18-20 OTP verified, POD captured, delivery completed', okc.ok, okc.error || okc.errors)
check('21 order delivered', order(oid).orderStatus === S.DELIVERED)
const dsp = dispatch.getDispatchById(did)
check('21 dispatch completed when its only stop is delivered', ['COMPLETED', 'DELIVERED'].includes(dsp.status), dsp.status)
check('20 delivery note generated', read(K.DELIVERY_NOTES).some((n) => n.deliveryId === dlv.id))
check('20 POD stored for the delivery', read(K.DELIVERY_POD).some((p) => p.deliveryId === dlv.id))

// customer tracking: the customer account linked to this customer sees the order
const custUser = read(K.DEMO_USERS).find((u) => u.customerId === customer.id && u.status !== 'Inactive')
if (custUser) {
  check('22 customer can see own order', orders.canViewOrder(custUser, order(oid)))
}
const otherCust = read(K.DEMO_USERS).find((u) => u.customerId && u.customerId !== customer.id)
if (otherCust) check('22 other customer cannot see the order', !orders.canViewOrder(otherCust, order(oid)))

// invoice
await as('finance')
const outPreInvoice = read(K.CUSTOMERS).find((c) => c.id === customer.id).creditBalance || 0
const g = invoice.generateInvoice(oid, {})
check('23 invoice generated for delivered order', g.ok, g.error || g.errors)
const g2 = invoice.generateInvoice(oid, {})
check('duplicate invoice prevented', !g2.ok)
const invRec = g.record || g.invoice || invoice.getActiveInvoiceForOrder(oid)
const balBefore = finance.invoiceBalance(invRec.id)
check('invoice opens with full balance', Math.abs(balBefore - invRec.totals.grandTotal) < 0.01, [balBefore, invRec.totals?.grandTotal])
const outBefore = read(K.CUSTOMERS).find((c) => c.id === customer.id).creditBalance || 0

// payment (Customer Receipts)
const finUser = auth.getCurrentUser()
const amt = invRec.totals.grandTotal
const pay = records.createRecord('customer_payments', { customerId: customer.id, paymentDate: today, method: 'Bank transfer', bankAccountId: read(K.BANK_ACCOUNTS)[0]?.id, amount: amt, reference: 'TEST-1', allocations: [{ invoiceId: invRec.id, amount: amt }] }, finUser)
check('24 payment recorded (draft receipt)', pay.ok, pay.error || pay.errors)
const payMod = (await imp('config/enterprise/modules/operations.js')).customerPayments
const actions = (payMod.actions || []).map((a) => a.id)
let posted = pay
for (const a of ['submit', 'post', 'approve']) {
  if (!actions.includes(a)) continue
  const rec = read(K.CUSTOMER_PAYMENTS).find((p) => p.id === pay.record.id)
  const def = payMod.actions.find((x) => x.id === a)
  if (!def.from.includes(rec.status)) continue
  const who = a === 'approve' ? await as('admin') : finUser
  posted = records.runAction('customer_payments', pay.record.id, a, { note: 'test' }, who)
}
const payRec = read(K.CUSTOMER_PAYMENTS).find((p) => p.id === pay.record?.id)
check('24 payment posted', payRec?.status === 'POSTED', [payRec?.status, posted.error])
check('25 invoice balance is zero after full payment', Math.abs(finance.invoiceBalance(invRec.id)) < 0.01, finance.invoiceBalance(invRec.id))
const outAfter = read(K.CUSTOMERS).find((c) => c.id === customer.id).creditBalance || 0
check('25 customer outstanding back to its pre-invoice level after full payment', Math.abs(outAfter - outPreInvoice) < 0.01, [outPreInvoice, outBefore, outAfter])
check('23 invoice adds to the customer outstanding', Math.abs(outBefore - outPreInvoice - amt) < 0.01, [outPreInvoice, outBefore, amt])
const dup = records.createRecord('customer_payments', { customerId: customer.id, paymentDate: today, method: 'Bank transfer', bankAccountId: read(K.BANK_ACCOUNTS)[0]?.id, amount: amt, reference: 'TEST-2', allocations: [{ invoiceId: invRec.id, amount: amt }] }, finUser)
check('duplicate payment against a settled invoice prevented', !dup.ok, dup)
const dupRef = records.createRecord('customer_payments', { customerId: customer.id, paymentDate: today, method: 'Bank transfer', amount: 10, reference: 'test-1' }, finUser)
check('duplicate receipt reference for the same customer prevented', !dupRef.ok && /already records/.test(dupRef.error || ''), dupRef)
const cxPaid = invoice.cancelInvoice(invRec.id, { reason: 'test' })
check('paid invoice cannot be cancelled', !cxPaid.ok, cxPaid)
// invoice cancellation reverses the outstanding
const oInv = (await mk(1))
await as('manager'); approval.approveOrder(oInv.id, { acknowledgeWarnings: true })
await as('finance')
const advInv = invoice.generateInvoice(oInv.id, {})
const outA = read(K.CUSTOMERS).find((c) => c.id === customer.id).creditBalance || 0
if (advInv.ok) {
  const cxi = invoice.cancelInvoice(advInv.record.id, { reason: 'raised in error' })
  const outB = read(K.CUSTOMERS).find((c) => c.id === customer.id).creditBalance || 0
  check('cancelling an unpaid invoice reverses the customer outstanding', cxi.ok && Math.abs(outA - outB - advInv.record.totals.grandTotal) < 0.01, [cxi.error, outA, outB])
} else check('advance invoice for approved order', false, advInv)
await as('manager'); orders.cancelOrder(oInv.id, { reason: 'test cleanup' })
// the customer form cannot overwrite the outstanding balance
await as('admin')
const custSvc = await imp('services/customerService.js')
const cRec = read(K.CUSTOMERS).find((c) => c.id === customer.id)
const balNow = cRec.creditBalance
const editInput = Object.fromEntries(Object.entries(cRec).map(([k, v]) => [k, v === null || v === undefined ? '' : typeof v === 'number' ? String(v) : v]))
const upd = custSvc.updateCustomer(customer.id, { ...editInput, creditBalance: '0' })
check('customer edit keeps the outstanding balance', upd.ok && read(K.CUSTOMERS).find((c) => c.id === customer.id).creditBalance === balNow, [upd.ok, upd.errors, balNow, read(K.CUSTOMERS).find((c) => c.id === customer.id).creditBalance])

// audit + communication
const audit = read(K.AUDIT_LOGS)
check('28 audit history records order approval', audit.some((a) => (a.recordId === oid || a.entityId === oid || (a.reference || '').includes(order(oid).orderNumber))))
check('27 notifications history contains the dispatch', read(K.NOTIFICATIONS).some((n) => (n.message || '').includes(dsp.dispatchNumber) || (n.link || '').includes(did)))

/* ------------------------------------------------------------------ negative cases */
// rejection
let o2 = await mk()
await as('manager')
const rj = approval.rejectOrder(o2.id, { reason: orderCfg.REJECTION_REASONS[0], remarks: 'Customer asked to cancel' })
check('order rejection works with reason', rj.ok && order(o2.id).orderStatus === S.REJECTED, rj.error)
check('rejected order holds no reservation', !reservation.openReservationLines(order(o2.id)).length)
const rjNoReason = approval.rejectOrder((await mk()).id, { reason: '', remarks: '' })
check('rejection without reason refused', !rjNoReason.ok)

// cancellation of an approved order releases its reservation
await as('manager')
let o3 = await mk(3)
await as('manager')
const resA = stocked.map((p) => inv(p.id, hubId).reservedQuantity || 0)
approval.approveOrder(o3.id, { acknowledgeWarnings: true })
const resB = stocked.map((p) => inv(p.id, hubId).reservedQuantity || 0)
check('approval of 2nd order reserves 3 per line', stocked.every((p, i) => resB[i] === resA[i] + 3), [resA, resB])
const cancelFn = orders.cancelOrder
check('order cancellation available in order service', typeof cancelFn === 'function')
if (cancelFn) {
  const noReason = cancelFn(o3.id, { reason: '' })
  check('cancellation without reason refused', !noReason.ok)
  const cx = cancelFn(o3.id, { reason: 'Customer changed plan' })
  check('approved order cancelled', cx.ok && order(o3.id).orderStatus === S.CANCELLED, cx.error)
  check('cancellation releases reservation', stocked.every((p, i) => (inv(p.id, hubId).reservedQuantity || 0) === resA[i]), [resA, stocked.map((p) => inv(p.id, hubId).reservedQuantity)])
  const again = cancelFn(o3.id, { reason: 'again' })
  check('cancelled order cannot be cancelled twice', !again.ok)
}

// insufficient stock
await as('salesman')
const big = orders.emptyOrderInput(auth.getCurrentUser())
const p0 = stocked[0]
Object.assign(big, addr(customer), { customerId: customer.id, hubId, paymentTerms: 'Cash on Delivery', items: [{ key: orders.newItemKey(), productId: p0.id, orderedQuantity: getAvailable(inv(p0.id, hubId)) + 1000 }] })
const bigV = orders.validateOrder(big, { mode: 'submit' })
const bigC = orders.createOrder(big)
let bigInfo = 'blocked at entry'
if (bigC.ok) {
  orders.submitOrder((bigC.record || bigC.order).id, orders.orderToInput(order((bigC.record || bigC.order).id)))
  await as('manager')
  const checks = approval.getApprovalChecks(order((bigC.record || bigC.order).id))
  const warnsStock = JSON.stringify(checks).toLowerCase().includes('stock')
  bigInfo = { warnsStock }
  check('insufficient stock is flagged at approval', warnsStock)
  const resBefore = inv(p0.id, hubId).reservedQuantity || 0
  const availB = getAvailable(inv(p0.id, hubId))
  const a = approval.approveOrder((bigC.record || bigC.order).id, { acknowledgeWarnings: true })
  if (a.ok) {
    check('reservation never exceeds available stock', (inv(p0.id, hubId).reservedQuantity || 0) - resBefore <= availB + 1e-9 && getAvailable(inv(p0.id, hubId)) >= -1e-9, [resBefore, inv(p0.id, hubId).reservedQuantity, availB])
    await as('cs')
    consolidation.consolidateOrder((bigC.record || bigC.order).id, { verified: Object.fromEntries(consolidation.VERIFICATION_STEPS.map((s) => [s.id || s.key, true])) })
    consolidation.markReadyForDispatch((bigC.record || bigC.order).id)
    await as('dispatcher')
    const d2 = planDispatch([(bigC.record || bigC.order).id])
    if (d2.ok) {
      const c2 = dispatch.confirmDispatch((d2.record || d2.dispatch).id, { acknowledged: true })
      check('dispatch confirmation blocked on insufficient stock', !c2.ok, c2)
      check('no negative inventory', getAvailable(inv(p0.id, hubId)) >= -1e-9)
      dispatch.cancelDispatch((d2.record || d2.dispatch).id, { reason: 'test cleanup' })
    }
    await as('manager')
    if (orders.cancelOrder) orders.cancelOrder((bigC.record || bigC.order).id, { reason: 'test cleanup' })
  }
} else {
  check('insufficient stock flagged on order entry', !!bigV?.warnings || !bigC.ok, bigV)
}
console.log('     insufficient-stock path:', JSON.stringify(bigInfo))
// partial delivery + failed delivery + reschedule
const flow = async (qty) => {
  const o = await mk(qty)
  await as('manager'); approval.approveOrder(o.id, { acknowledgeWarnings: true })
  await as('cs'); consolidation.consolidateOrder(o.id, { verified: Object.fromEntries(consolidation.VERIFICATION_STEPS.map((s) => [s.id || s.key, true])) }); consolidation.markReadyForDispatch(o.id)
  await as('dispatcher')
  await finishRoute(drvUserId)
  await as('dispatcher')
  const c = planDispatch([o.id], { preferDriverUser: drvUserId })
  if (!c.ok) return { error: c }
  const cf2 = dispatch.confirmDispatch((c.record || c.dispatch).id, { acknowledged: true })
  if (!cf2.ok) return { error: cf2 }
  const del = delivery.getDeliveries().find((x) => x.dispatchId === (c.record || c.dispatch).id)
  const d = read(K.DRIVERS).find((x) => x.id === dispatch.getDispatchById((c.record || c.dispatch).id).driverId)
  const du = read(K.DEMO_USERS).find((u) => u.id === d.userId)
  PASSWORDS[du.username] ||= 'Driver@123'
  return { o, del, du, dispatchId: (c.record || c.dispatch).id }
}
const f1 = await flow(4)
if (f1.error) check('partial delivery flow set-up', false, f1.error)
else {
  try { await as(f1.du.username) } catch (e) { check('driver demo login for second driver', false, e.message) }
  delivery.startDelivery(f1.del.id); delivery.markArrived(f1.del.id)
  const its = delivery.getDeliveryById(f1.del.id).items.map((it, i) => ({ ...it, deliveredQuantity: i === 0 ? 2 : (it.orderedQuantity ?? it.quantity), damagedQuantity: i === 0 ? 1 : 0, shortQuantity: i === 0 ? 1 : 0, rejectedQuantity: 0, shortfallReason: 'Damaged in transit' }))
  const pc = delivery.confirmDelivery(f1.del.id, { items: its, receivedBy: 'Receiver', otp: otp.getLatestOtp(f1.del.id)?.otp, pod, remarks: 'one carton damaged' })
  check('partial delivery recorded', pc.ok && order(f1.o.id).orderStatus === S.PARTIALLY_DELIVERED, [pc.error || pc.errors, order(f1.o.id).orderStatus])
  const over = delivery.validateDeliveryQuantities(delivery.getDeliveryById(f1.del.id), its.map((x) => ({ ...x, deliveredQuantity: 99 })), { receivedBy: 'x' })
  check('delivery quantity validation rejects over-delivery', over && Object.keys(over).length > 0, over)
}
const f2 = await flow(1)
if (f2.error) check('failed delivery flow set-up', false, f2.error)
else {
  await as(f2.du.username)
  delivery.startDelivery(f2.del.id)
  const fl = delivery.failDelivery(f2.del.id, { reason: 'Customer Not Available', remarks: 'shop closed' })
  check('failed delivery (customer unavailable) recorded', fl.ok && order(f2.o.id).orderStatus === S.DELIVERY_FAILED, [fl.error, order(f2.o.id).orderStatus])
  await as('dispatcher')
  const rv = delivery.reviewDelivery(f2.del.id, { returnToHub: true, requeue: true, remarks: 'reschedule tomorrow' })
  check('failed delivery re-queued for rescheduling', rv.ok && order(f2.o.id).orderStatus === S.READY_FOR_DISPATCH, [rv.error, order(f2.o.id).orderStatus])
  check('re-queued order reserves the returned stock again', ['RESERVED', 'PARTIAL'].includes(order(f2.o.id).reservation?.status), order(f2.o.id).reservation)
}

// unauthorised access
const cu = read(K.DEMO_USERS).find((u) => u.username === 'customer')
const dr = read(K.DEMO_USERS).find((u) => u.username === 'driver')
check('customer cannot approve orders', !can(cu, 'orders.approve'))
check('driver cannot generate invoices', !can(dr, 'invoices.manage'))
check('salesman cannot confirm dispatches', !can(read(K.DEMO_USERS).find((u) => u.username === 'salesman'), 'dispatch.manage'))
await as('salesman')
const unauth = approval.approveOrder((await mk()).id, {})
check('approval refused for a user without permission (service-level)', !unauth.ok, unauth)
await as('customer')
const custOrders = orders.getVisibleOrders(auth.getCurrentUser())
check('customer sees only own orders', custOrders.every((o) => o.customerId === auth.getCurrentUser().customerId))

// reservation integrity: reserved quantity per product × hub equals open-order reservations
const openRes = {}
read(K.ORDERS).forEach((o) => reservation.openReservationLines(o).forEach((l) => { const k = `${l.productId}|${o.hubId}`; openRes[k] = (openRes[k] || 0) + l.quantity }))
const mismatch = read(K.INVENTORY).filter((r) => Math.abs((r.reservedQuantity || 0) - (openRes[`${r.productId}|${r.hubId}`] || 0)) > 1e-6)
check('reserved stock equals open-order reservations (all products × hubs)', mismatch.length === 0, mismatch.slice(0, 3).map((r) => [r.productId, r.hubId, r.reservedQuantity, openRes[`${r.productId}|${r.hubId}`] || 0]))
check('no negative available stock anywhere', read(K.INVENTORY).every((r) => getAvailable(r) >= -1e-6), read(K.INVENTORY).filter((r) => getAvailable(r) < 0).slice(0, 3))

// AI replenishment hands over to procurement (one purchasing flow)
const repl = await imp('services/ai/replenishmentService.js')
await as('admin')
const rp = read(K.PRODUCTS).find((p) => p.status === 'Active' && p.trackInventory)
const sup = (storage.getItem(K.FORECAST_SETTINGS, {}) || {}).suppliers[0]
const rd = repl.createDraft({ hubId, supplierId: sup.id, lines: [{ productId: rp.id, quantity: 50 }], notes: 'harness' })
check('replenishment draft created', rd.ok, rd.error || rd.errors)
if (rd.ok) {
  repl.submitDraft(rd.record.id)
  await as('superadmin')
  const apd = repl.approveDraft(rd.record.id, 'ok')
  const cv = repl.convertDraft(rd.record.id)
  const prRec = read(K.PURCHASE_REQUISITIONS).find((x) => x.replenishmentDraftId === rd.record.id)
  check('approved replenishment becomes a submitted purchase requisition', apd.ok && cv.ok && prRec?.status === 'SUBMITTED' && prRec.lines?.[0]?.quantity === 50, [apd.error, cv.error, prRec?.status])
  check('replenishment no longer creates stock receipts or purchase orders by itself', read(K.STOCK_RECEIPTS).every((x) => x.referenceNumber !== rd.record.number))
}

// every report runs for every role that can see it
const reportSvc = await imp('services/reportService.js')
for (const u of ['superadmin', 'manager', 'finance', 'dispatcher', 'cs', 'salesman']) {
  const usr = await as(u)
  const ctx = reportSvc.buildReportContext(usr)
  const bad = reportSvc.visibleReports(usr).map((r) => [r.id, reportSvc.runReport(r, ctx).error]).filter(([, e]) => e)
  check(`reports run without errors for ${u} (${reportSvc.visibleReports(usr).length} visible)`, bad.length === 0, bad.slice(0, 3))
}
const inv2 = (await as('finance')) && reportSvc.runReport(reportSvc.getReport('fin-invoices'), reportSvc.buildReportContext(auth.getCurrentUser())).rows.find((r) => r.invoiceNumber === invRec.invoiceNumber)
check('invoice register shows the paid invoice as Paid', inv2?.status === 'Paid' && inv2.open === 0, inv2)

console.log(`\n${results.length - failures}/${results.length} checks passed`)
process.exit(failures ? 1 : 0)
