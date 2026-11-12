/**
 * Department and management KPIs plus the control-tower alert feed. Every number is computed from the prototype
 * records at the moment it is shown — nothing is stored or hard-coded.
 */
import dayjs from 'dayjs'
import storage from '../storageService'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { getAvailable, isLowOrOut } from '../../utils/stock'
import { financeKpis, invoiceBalances } from './financeService'
import { createRecord, read } from './recordService'
import { isBlocked, isExpired } from './batchService'
import { salesAchieved } from './salesOpsService'
import { supplierScore } from './procurementService'
import { getSuppliers } from '../supplierService'

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100
const today = () => dayjs().format('YYYY-MM-DD')
const monthStart = () => dayjs().startOf('month').format('YYYY-MM-DD')
const isSale = (o) => !['DRAFT', 'REJECTED', 'RETURNED', 'CANCELLED'].includes(o.orderStatus)
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const sum = (l, f) => r2((l || []).reduce((s, x) => s + (Number(f(x)) || 0), 0))
const count = (l, f) => (l || []).filter(f).length
const byMonth = (rows, dateOf, valueOf, months = 6) => {
  const out = []
  for (let i = months - 1; i >= 0; i -= 1) {
    const m = dayjs().subtract(i, 'month')
    const key = m.format('YYYY-MM')
    out.push({ name: m.format('MMM'), value: sum(rows.filter((r) => String(dateOf(r) || '').startsWith(key)), valueOf) })
  }
  return out
}

export const salesKpis = () => {
  const orders = read(K.ORDERS)
  const ms = monthStart()
  const monthOrders = orders.filter((o) => isSale(o) && o.orderDate >= ms)
  const targets = read(K.SALES_TARGETS).filter((t) => t.period === dayjs().format('YYYY-MM') && t.status === 'ACTIVE')
  const targetValue = sum(targets, (t) => t.targetValue)
  const achieved = r2(targets.reduce((s, t) => s + salesAchieved(t.ownerId, t.period, orders), 0))
  const opps = read(K.OPPORTUNITIES)
  const open = opps.filter((o) => !['WON', 'LOST'].includes(o.status))
  return {
    salesMonth: sum(monthOrders, (o) => o.totalAmount), ordersMonth: monthOrders.length, avgOrder: monthOrders.length ? r2(sum(monthOrders, (o) => o.totalAmount) / monthOrders.length) : 0,
    targetValue, achieved, achievementPct: pct(achieved, targetValue), pipeline: sum(open, (o) => o.value), weighted: sum(open, (o) => (o.value * o.probability) / 100),
    leadsOpen: count(read(K.LEADS), (l) => !['CONVERTED', 'LOST'].includes(l.status)), returnsOpen: count(read(K.SALES_RETURNS), (r) => ['REQUESTED', 'APPROVED'].includes(r.status)),
    ticketsOpen: count(read(K.SERVICE_TICKETS), (t) => !['RESOLVED', 'CLOSED'].includes(t.status)), pendingApproval: count(orders, (o) => o.orderStatus === 'SUBMITTED'),
    trend: byMonth(orders.filter(isSale), (o) => o.orderDate, (o) => o.totalAmount),
    bySalesman: Object.values(orders.filter((o) => isSale(o) && o.orderDate >= ms).reduce((m, o) => { m[o.salesmanName || o.salesmanId] ||= { name: o.salesmanName || o.salesmanId, value: 0 }; m[o.salesmanName || o.salesmanId].value = r2(m[o.salesmanName || o.salesmanId].value + o.totalAmount); return m }, {})).sort((a, b) => b.value - a.value).slice(0, 8),
    targets,
  }
}

export const procurementKpis = () => {
  const pos = read(K.PURCHASE_ORDERS)
  const open = pos.filter((p) => ['APPROVED', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(p.status))
  return {
    prPending: count(read(K.PURCHASE_REQUISITIONS), (r) => r.status === 'SUBMITTED'), rfqOpen: count(read(K.RFQS), (r) => ['ISSUED', 'EVALUATION'].includes(r.status)),
    poPending: count(pos, (p) => p.status === 'PENDING_APPROVAL'), poOpen: open.length, poOpenValue: sum(open, (p) => p.total),
    poOverdue: count(open, (p) => p.expectedDate < today()), grnDraft: count(read(K.GOODS_RECEIPTS), (g) => g.status === 'DRAFT'),
    invoicesVariance: count(read(K.SUPPLIER_INVOICES), (s) => s.status === 'VARIANCE'),
    spendTrend: byMonth(pos.filter((p) => !['DRAFT', 'CANCELLED', 'REJECTED'].includes(p.status)), (p) => p.orderDate, (p) => p.total),
    suppliers: getSuppliers().map((s) => ({ ...supplierScore(s.id), name: s.name })).sort((a, b) => b.value - a.value),
  }
}

export const warehouseKpis = (hubId = null) => {
  const f = (l) => (hubId ? l.filter((x) => x.hubId === hubId) : l)
  const batches = f(read(K.BATCHES)).filter((b) => b.quantity > 0)
  const done = (list) => list.filter((t) => ['DONE', 'PICKED', 'PACKED', 'SEALED'].includes(t.status) && String(t.updatedAt).slice(0, 10) === today())
  const tasks = [...f(read(K.PUTAWAY_TASKS)), ...f(read(K.PICKING_TASKS)), ...f(read(K.PACKING_TASKS)), ...f(read(K.LOADING_TASKS))]
  const users = Object.fromEntries((storage.getItem(K.DEMO_USERS, []) || []).map((u) => [u.id, u.name]))
  const prod = {}
  done(tasks).forEach((t) => { const who = users[t.assignedTo || t.updatedBy] || 'Unassigned'; prod[who] = (prod[who] || 0) + 1 })
  return {
    receivingOpen: count(f(read(K.GOODS_RECEIPTS)), (g) => g.status === 'DRAFT'), putawayOpen: count(f(read(K.PUTAWAY_TASKS)), (t) => ['OPEN', 'IN_PROGRESS'].includes(t.status)),
    pickingOpen: count(f(read(K.PICKING_TASKS)), (t) => ['OPEN', 'PICKING'].includes(t.status)), packingOpen: count(f(read(K.PACKING_TASKS)), (t) => t.status === 'OPEN'),
    loadingOpen: count(f(read(K.LOADING_TASKS)), (t) => ['PLANNED', 'LOADING'].includes(t.status)), tasksDoneToday: done(tasks).length,
    lotsOnHold: count(batches, (b) => b.qaStatus !== 'AVAILABLE'), lotsExpired: count(batches, (b) => isExpired(b)), lotsExpiring7: count(batches, (b) => !isExpired(b) && b.expiryDate && dayjs(b.expiryDate).diff(dayjs(), 'day') <= 7),
    binsUsed: new Set(batches.filter((b) => b.locationId).map((b) => b.locationId)).size, bins: count(f(read(K.WAREHOUSE_LOCATIONS)), (l) => l.level === 'BIN'),
    productivity: Object.entries(prod).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    counts: count(f(read(K.CYCLE_COUNTS)), (c) => c.status === 'SUBMITTED'),
  }
}

export const logisticsKpis = () => {
  const deliveries = read(K.DELIVERIES)
  const done = deliveries.filter((d) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(d.status))
  const orders = Object.fromEntries(read(K.ORDERS).map((o) => [o.id, o]))
  const onTime = done.filter((d) => { const o = orders[d.orderId]; return o && d.completedAt && dayjs(d.completedAt).format('YYYY-MM-DD') <= o.requestedDeliveryDate })
  return {
    delivered: done.length, onTimePct: pct(onTime.length, done.length), failed: count(deliveries, (d) => d.status === 'FAILED' || d.status === 'DELIVERY_FAILED'),
    inTransit: count(deliveries, (d) => ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(d.status)),
    reschedulesOpen: count(read(K.DELIVERY_RESCHEDULES), (r) => r.status === 'REQUESTED'), routesPlanned: count(read(K.ROUTE_PLANS), (r) => ['DRAFT', 'OPTIMISED', 'PUBLISHED'].includes(r.status) && r.routeDate >= today()),
    readyToDispatch: count(Object.values(orders), (o) => o.orderStatus === 'READY_FOR_DISPATCH'), dispatchesActive: count(read(K.DISPATCHES), (d) => ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'].includes(d.status)),
    byHub: Object.values(read(K.HUBS).map((h) => ({ name: h.name.replace(/ Hub$/, ''), value: count(done, (d) => d.hubId === h.id) }))).filter((x) => x.value),
  }
}

export const fleetKpis = () => {
  const vehicles = read(K.VEHICLES).filter((v) => v.status !== 'Inactive')
  const fuel = read(K.FUEL_LOGS).filter((f) => f.status !== 'REJECTED')
  const effByVehicle = vehicles.map((v) => {
    const fills = fuel.filter((f) => f.vehicleId === v.id).sort((a, b) => a.odometer - b.odometer)
    if (fills.length < 2) return null
    const km = fills[fills.length - 1].odometer - fills[0].odometer
    const litres = sum(fills.slice(1), (f) => f.litres)
    const cost = sum(fills.slice(1), (f) => f.amount)
    return { name: v.vehicleNumber, value: litres ? r2(km / litres) : 0, costPerKm: km ? r2(cost / km) : 0 }
  }).filter(Boolean)
  const maint = read(K.VEHICLE_MAINTENANCE)
  return {
    vehicles: vehicles.length, available: count(vehicles, (v) => v.status === 'Available'), inMaintenance: count(vehicles, (v) => v.status === 'Maintenance'),
    utilisation: pct(count(vehicles, (v) => ['In Transit', 'Assigned', 'On Trip'].includes(v.status)), vehicles.length),
    maintenanceOpen: count(maint, (m) => ['REQUESTED', 'APPROVED', 'IN_PROGRESS'].includes(m.status)), maintenanceCostMonth: sum(maint.filter((m) => m.status === 'COMPLETED' && String(m.completedAt).slice(0, 7) === dayjs().format('YYYY-MM')), (m) => m.actualCost),
    fuelCostMonth: sum(fuel.filter((f) => String(f.date).slice(0, 7) === dayjs().format('YYYY-MM')), (f) => f.amount), fuelLitresMonth: sum(fuel.filter((f) => String(f.date).slice(0, 7) === dayjs().format('YYYY-MM')), (f) => f.litres),
    efficiency: effByVehicle, expensesPending: count(read(K.DRIVER_EXPENSES), (e) => e.status === 'SUBMITTED'),
    docsExpiring: count(vehicles, (v) => ['insuranceExpiry', 'registrationExpiry', 'fitnessExpiry', 'permitExpiry', 'pollutionExpiry'].some((k) => v[k] && dayjs(v[k]).diff(dayjs(), 'day') <= 30)),
  }
}

export const hrKpis = () => {
  const emps = read(K.EMPLOYEES)
  const active = emps.filter((e) => ['ACTIVE', 'PROBATION', 'ON_LEAVE'].includes(e.status))
  const att = read(K.EMPLOYEE_ATTENDANCE)
  const lastDay = [...new Set(att.map((a) => a.date))].sort().pop()
  const dayAtt = att.filter((a) => a.date === lastDay)
  const depts = Object.fromEntries((storage.getItem(K.ORGANIZATION, {})?.departments || []).map((d) => [d.id, d.name]))
  const byDept = {}
  active.forEach((e) => { const n = depts[e.departmentId] || 'Unassigned'; byDept[n] = (byDept[n] || 0) + 1 })
  return {
    headcount: active.length, onLeave: count(read(K.LEAVE_REQUESTS), (l) => l.status === 'APPROVED' && l.fromDate <= today() && l.toDate >= today()),
    leavePending: count(read(K.LEAVE_REQUESTS), (l) => l.status === 'PENDING'), attendanceDate: lastDay, attendancePct: pct(count(dayAtt, (a) => a.status !== 'ABSENT'), dayAtt.length), late: count(dayAtt, (a) => a.status === 'LATE'),
    openPositions: sum(read(K.JOB_REQUISITIONS).filter((j) => j.status === 'OPEN'), (j) => j.headcount - (j.hired || 0)), candidates: count(read(K.CANDIDATES), (c) => !['HIRED', 'REJECTED'].includes(c.status)),
    docsExpiring: count(active, (e) => ['visaExpiry', 'emiratesIdExpiry', 'passportExpiry', 'labourCardExpiry'].some((k) => e[k] && dayjs(e[k]).diff(dayjs(), 'day') <= 60)),
    byDept: Object.entries(byDept).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
  }
}

export const importKpis = () => {
  const s = read(K.IMPORT_SHIPMENTS)
  const live = s.filter((x) => !['CLOSED', 'CANCELLED', 'DELIVERED'].includes(x.status))
  return {
    inTransit: count(s, (x) => x.status === 'IN_TRANSIT'), atPort: count(s, (x) => ['ARRIVED', 'CUSTOMS'].includes(x.status)), arriving7: count(s, (x) => ['BOOKED', 'IN_TRANSIT'].includes(x.status) && dayjs(x.eta).diff(dayjs(), 'day') <= 7),
    late: count(live, (x) => !x.ata && x.eta < today()), goodsValue: sum(live, (x) => x.goodsValue), extraCost: sum(live, (x) => x.extraCost),
    missingDocs: count(live, (x) => (x.docsComplete || 0) < 6), byStatus: ['BOOKED', 'IN_TRANSIT', 'ARRIVED', 'CUSTOMS', 'CLEARED'].map((st) => ({ name: st.replace('_', ' ').toLowerCase(), value: count(s, (x) => x.status === st) })),
  }
}

export const vanKpis = () => {
  const a = read(K.VAN_ASSIGNMENTS)
  const sales = read(K.VAN_SALES).filter((x) => x.status === 'COMPLETED')
  const st = read(K.VAN_SETTLEMENTS)
  return {
    routesToday: count(a, (x) => x.routeDate === today()), onRoute: count(a, (x) => x.status === 'ON_ROUTE'), salesToday: count(sales, (x) => String(x.createdAt).slice(0, 10) === today()),
    valueToday: sum(sales.filter((x) => String(x.createdAt).slice(0, 10) === today()), (x) => x.total), valueMonth: sum(sales.filter((x) => String(x.createdAt) >= monthStart()), (x) => x.total),
    settlementsPending: count(st, (x) => x.status === 'SUBMITTED'), variance: sum(st, (x) => x.variance),
  }
}

export const qaKpis = () => {
  const lots = read(K.BATCHES).filter((b) => b.quantity > 0)
  return {
    inspectionsOpen: count(read(K.QA_INSPECTIONS), (i) => ['PENDING', 'IN_PROGRESS'].includes(i.status)), lotsBlocked: count(lots, (b) => isBlocked(b)),
    qtyBlocked: sum(lots.filter((b) => isBlocked(b)), (b) => b.quantity), excursions: count(read(K.TEMPERATURE_LOGS), (t) => t.status === 'EXCURSION'),
    ncrOpen: count(read(K.NONCONFORMANCES), (n) => n.status !== 'CLOSED'), recallsActive: count(read(K.PRODUCT_RECALLS), (r) => r.status === 'ACTIVE'),
  }
}

export const executiveKpis = () => {
  const s = salesKpis()
  const f = financeKpis()
  const inv = read(K.INVENTORY)
  const products = Object.fromEntries(read(K.PRODUCTS).map((p) => [p.id, p]))
  return {
    sales: s, finance: f, logistics: logisticsKpis(), procurement: procurementKpis(), fleet: fleetKpis(), hr: hrKpis(), qa: qaKpis(),
    stockValue: sum(inv, (r) => (r.totalQuantity || 0) * (products[r.productId]?.purchasePrice || 0)), lowStock: count(inv, (r) => isLowOrOut(r)),
    availableUnits: sum(inv, (r) => Math.max(0, getAvailable(r))),
  }
}

/* ---------- Control tower alerts (computed from live records) ---------- */
const SEV = { Critical: 4, High: 3, Normal: 2, Low: 1 }
export const computeAlerts = () => {
  const out = []
  const push = (a) => out.push(a)
  const orders = Object.fromEntries(read(K.ORDERS).map((o) => [o.id, o]))
  const products = Object.fromEntries(read(K.PRODUCTS).map((p) => [p.id, p]))
  const hubs = Object.fromEntries(read(K.HUBS).map((h) => [h.id, h]))
  read(K.DELIVERIES).filter((d) => ['FAILED', 'DELIVERY_FAILED'].includes(d.status)).forEach((d) => push({ sourceKey: `failed:${d.orderId}`, type: 'Failed delivery', severity: 'High', area: 'Logistics', title: `Failed delivery — ${d.orderNumber}`, detail: `${d.customerName}: ${d.failureReason || 'reason not recorded'}`, link: `/dispatch/deliveries/${d.id}`, ref: d.orderNumber }))
  Object.values(orders).filter((o) => ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus) && o.requestedDeliveryDate < today()).forEach((o) => push({ sourceKey: `late:${o.id}`, type: 'Late delivery', severity: 'High', area: 'Logistics', title: `Late — ${o.orderNumber}`, detail: `${o.customerName} · due ${o.requestedDeliveryDate}`, link: `/orders/${o.id}`, ref: o.orderNumber }))
  read(K.TEMPERATURE_LOGS).filter((t) => t.status === 'EXCURSION').forEach((t) => push({ sourceKey: `temp:${t.id}`, type: 'Temperature excursion', severity: 'Critical', area: 'Quality', title: `Temperature excursion ${t.number}`, detail: `${hubs[t.hubId]?.name || ''} ${t.area}: ${t.reading} °C (${t.source === 'SIMULATED' ? 'simulated' : 'manual'} reading)`, link: `/qa/temperature/${t.id}`, ref: t.number }))
  const lots = read(K.BATCHES).filter((b) => b.quantity > 0)
  lots.filter((b) => isExpired(b)).forEach((b) => push({ sourceKey: `expired:${b.id}`, type: 'Expiring stock', severity: 'High', area: 'Inventory', title: `Expired lot ${b.batchNumber}`, detail: `${products[b.productId]?.name} · ${b.quantity} at ${hubs[b.hubId]?.name} — blocked from sale`, link: `/inventory/batches?q=${encodeURIComponent(b.batchNumber)}`, ref: b.batchNumber }))
  lots.filter((b) => !isExpired(b) && b.expiryDate && dayjs(b.expiryDate).diff(dayjs(), 'day') <= 7).forEach((b) => push({ sourceKey: `expiring:${b.id}`, type: 'Expiring stock', severity: 'Normal', area: 'Inventory', title: `Lot ${b.batchNumber} expires ${dayjs(b.expiryDate).format('DD MMM')}`, detail: `${products[b.productId]?.name} · ${b.quantity} at ${hubs[b.hubId]?.name}`, link: `/inventory/batches?q=${encodeURIComponent(b.batchNumber)}`, ref: b.batchNumber }))
  lots.filter((b) => ['QA_HOLD', 'QUARANTINE'].includes(b.qaStatus)).forEach((b) => push({ sourceKey: `qa:${b.id}`, type: 'QA hold', severity: 'Normal', area: 'Quality', title: `Lot ${b.batchNumber} on ${b.qaStatus === 'QA_HOLD' ? 'QA hold' : 'quarantine'}`, detail: `${products[b.productId]?.name} · ${b.quantity} not sellable`, link: '/qa/inspections', ref: b.batchNumber }))
  read(K.INVENTORY).filter((r) => isLowOrOut(r)).forEach((r) => push({ sourceKey: `low:${r.id}`, type: 'Stock shortage', severity: getAvailable(r) <= 0 ? 'High' : 'Normal', area: 'Inventory', title: `${getAvailable(r) <= 0 ? 'Out of stock' : 'Low stock'}: ${products[r.productId]?.name}`, detail: `${hubs[r.hubId]?.name} · ${r2(getAvailable(r))} available (reorder ${r.reorderLevel})`, link: '/inventory/low-stock', ref: products[r.productId]?.code }))
  invoiceBalances().filter((b) => b.balance > 0 && b.overdueDays > 30).forEach((b) => push({ sourceKey: `ar:${b.id}`, type: 'Overdue receivable', severity: b.overdueDays > 60 ? 'High' : 'Normal', area: 'Finance', title: `Overdue ${b.overdueDays} d — ${b.invoiceNumber}`, detail: `Balance ${b.balance}`, link: `/finance/receivables?customer=${b.customerId}`, ref: b.invoiceNumber }))
  read(K.SERVICE_TICKETS).filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status) && dayjs().isAfter(dayjs(t.slaDueAt))).forEach((t) => push({ sourceKey: `sla:${t.id}`, type: 'Other', severity: t.priority === 'Critical' ? 'Critical' : 'High', area: 'Customer service', title: `SLA breached — ${t.number}`, detail: t.subject, link: `/service/tickets/${t.id}`, ref: t.number }))
  read(K.PURCHASE_ORDERS).filter((p) => ['APPROVED', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(p.status) && p.expectedDate < today()).forEach((p) => push({ sourceKey: `po:${p.id}`, type: 'Other', severity: 'Normal', area: 'Procurement', title: `PO ${p.number} overdue`, detail: `Expected ${p.expectedDate}`, link: `/procurement/purchase-orders/${p.id}`, ref: p.number }))
  read(K.VEHICLES).filter((v) => v.status !== 'Inactive').forEach((v) => ['insuranceExpiry', 'registrationExpiry', 'fitnessExpiry', 'permitExpiry'].forEach((k) => { if (v[k] && dayjs(v[k]).diff(dayjs(), 'day') <= 15) push({ sourceKey: `vdoc:${v.id}:${k}`, type: 'Document expiry', severity: dayjs(v[k]).isBefore(dayjs()) ? 'High' : 'Normal', area: 'Fleet', title: `${v.vehicleNumber}: ${k.replace('Expiry', '')} expires ${dayjs(v[k]).format('DD MMM YYYY')}`, detail: 'Renew before the vehicle is planned again.', link: `/vms/vehicles/${v.id}`, ref: v.vehicleNumber }) }))
  read(K.EMPLOYEES).filter((e) => ['ACTIVE', 'PROBATION', 'ON_LEAVE'].includes(e.status)).forEach((e) => ['visaExpiry', 'emiratesIdExpiry'].forEach((k) => { if (e[k] && dayjs(e[k]).diff(dayjs(), 'day') <= 30) push({ sourceKey: `edoc:${e.id}:${k}`, type: 'Document expiry', severity: 'Normal', area: 'HR', title: `${e.name}: ${k === 'visaExpiry' ? 'visa' : 'Emirates ID'} expires ${dayjs(e[k]).format('DD MMM YYYY')}`, detail: e.employeeCode, link: `/hr/employees/${e.id}`, ref: e.employeeCode }) }))
  return out.sort((a, b) => SEV[b.severity] - SEV[a.severity])
}

/** Raise exceptions for High / Critical alerts that do not already have an open exception (no duplicates). */
export const raiseExceptionsFromAlerts = (user) => {
  const existing = new Set(read(K.OPERATIONAL_EXCEPTIONS).filter((e) => !['CLOSED'].includes(e.status)).map((e) => e.sourceKey).filter(Boolean))
  const alerts = computeAlerts().filter((a) => ['High', 'Critical'].includes(a.severity) && !existing.has(a.sourceKey))
  let n = 0
  alerts.forEach((a) => {
    const r = createRecord('operational_exceptions', { title: a.title, type: a.type, severity: a.severity, referenceLabel: a.ref || '', link: a.link, description: `${a.area}: ${a.detail}`, dueAt: dayjs().add(a.severity === 'Critical' ? 2 : 8, 'hour').format('YYYY-MM-DDTHH:mm') }, user, { silent: true })
    if (r.ok) {
      const list = read(K.OPERATIONAL_EXCEPTIONS)
      storage.setItem(K.OPERATIONAL_EXCEPTIONS, list.map((x) => (x.id === r.record.id ? { ...x, sourceKey: a.sourceKey } : x)))
      n += 1
    }
  })
  return { ok: true, created: n }
}
