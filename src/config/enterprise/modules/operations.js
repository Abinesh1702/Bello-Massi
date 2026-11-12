/**
 * Logistics (reschedules, route plans, operational exceptions), fleet (maintenance, fuel), driver expenses,
 * finance (receipts, credit notes, expenses, bank accounts, vouchers, cash closing) and HR (employees, recruitment,
 * attendance, leave, salary structures, demo payroll).
 */
import dayjs from 'dayjs'
import { AlertTriangle, Wrench, Fuel, Receipt, Wallet, Users, CalendarDays, Banknote } from 'lucide-react'
import { S, today, sum, count, money, statusKpis, r2, PRIORITIES } from './common'
import { createRecord, patchRecord, read } from '../../../services/enterprise/recordService'
import { recordFor } from '../../../services/enterprise/lookupService'
import { adjustCustomerOutstanding, bankBalance, invoiceBalance, validateTrn, vatOn } from '../../../services/enterprise/financeService'
import { STORAGE_KEYS as K } from '../../../utils/constants'
import storage from '../../../services/storageService'
import { can } from '../../permissions'

const driverOfUser = (user) => read(K.DRIVERS).find((d) => d.userId === user?.id) || null
const employeeOfUser = (user) => read(K.EMPLOYEES).find((e) => e.userId === user?.id) || null

/* ---------------- Logistics ---------------- */
const RESCHEDULABLE = ['SUBMITTED', 'APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH', 'DELIVERY_FAILED', 'RETURNED_TO_HUB']
export const reschedules = {
  id: 'delivery_reschedules', key: K.DELIVERY_RESCHEDULES, label: 'Reschedule request', plural: 'Delivery reschedules', numberPrefix: 'RSC', idPrefix: 'rsc', basePath: '/logistics/reschedules', auditModule: 'logistics',
  description: 'Requests from drivers, customer service or customers to move a delivery to another date / window. Approval updates the order’s requested delivery date.',
  permissions: { view: ['logistics.planning.view', 'driver.app'], create: ['logistics.planning.manage', 'driver.app', 'service.tickets.manage'], edit: 'logistics.planning.manage' },
  scope: { driver: 'driverId', hub: 'hubId' }, filters: ['reason', 'hubId'],
  statuses: { REQUESTED: S('Requested', 'warning'), APPROVED: S('Approved', 'success'), REJECTED: S('Rejected', 'danger') }, initialStatus: 'REQUESTED', editableIn: ['REQUESTED'],
  initialValues: ({ user, params }) => {
    const o = read(K.ORDERS).find((x) => x.id === params?.get('orderId'))
    return { driverId: driverOfUser(user)?.id || '', __driverLock: driverOfUser(user)?.id || '', newDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), newWindow: '09:00–12:00', reason: 'Customer closed', ...(o ? { orderId: o.id, hubId: o.hubId, customerId: o.customerId, currentDate: o.requestedDeliveryDate } : {}) }
  },
  fields: [
    { key: 'orderId', label: 'Order', type: 'lookup', lookup: 'orders', required: true, filter: (o, v) => (RESCHEDULABLE.includes(o.orderStatus) || ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)) && (!v.__driverLock || o.driverId === v.__driverLock), onChange: (v) => { const o = recordFor('orders', v); return o ? { hubId: o.hubId, customerId: o.customerId, currentDate: o.requestedDeliveryDate } : {} } },
    { key: 'customerId', label: 'Customer', type: 'lookup', lookup: 'customers', readOnly: true },
    { key: 'hubId', label: 'Hub', type: 'lookup', lookup: 'hubs', readOnly: true },
    { key: 'currentDate', label: 'Current delivery date', type: 'date', readOnly: true },
    { key: 'newDate', label: 'New date', type: 'date', required: true },
    { key: 'newWindow', label: 'New window', type: 'select', options: ['06:00–09:00', '09:00–12:00', '12:00–15:00', '15:00–18:00', '18:00–21:00'], required: true },
    { key: 'reason', label: 'Reason', type: 'select', options: ['Customer closed', 'Customer requested', 'Receiver unavailable', 'Vehicle issue', 'Address problem', 'Weather / traffic', 'Other'], required: true },
    { key: 'driverId', label: 'Driver', type: 'lookup', lookup: 'drivers', filter: (d, v) => !v.__driverLock || d.id === v.__driverLock },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  validate: (v) => (v.newDate && v.newDate < today() ? { newDate: 'The new date cannot be in the past.' } : {}),
  listColumns: ['orderId', 'customerId', 'currentDate', 'newDate', 'newWindow', 'reason'],
  kpis: (rs) => statusKpis(rs, reschedules, ['REQUESTED', 'APPROVED', 'REJECTED']),
  actions: [
    {
      id: 'approve', label: 'Approve', from: ['REQUESTED'], to: 'APPROVED', permission: 'logistics.planning.manage',
      effect: (r, { user }) => {
        const orders = read(K.ORDERS)
        const o = orders.find((x) => x.id === r.orderId)
        if (!o) return { ok: false, error: 'Order not found.' }
        if (['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.orderStatus)) return { ok: false, error: `Order is ${o.orderStatus.toLowerCase()} — nothing to reschedule.` }
        const res = patchRecordOrder(o, { requestedDeliveryDate: r.newDate, requestedDeliveryWindow: r.newWindow })
        return res.ok ? { patch: { approvedBy: user.id } } : res
      },
      notify: (r) => ({ title: `Delivery rescheduled (${r.number})`, message: `New date ${r.newDate} ${r.newWindow}`, roles: ['DISPATCHER', 'CUSTOMER_SERVICE'], link: `/orders/${r.orderId}` }),
    },
    { id: 'reject', label: 'Reject', from: ['REQUESTED'], to: 'REJECTED', permission: 'logistics.planning.manage', note: 'required', tone: 'danger' },
  ],
  related: (r) => [{ label: 'Order', to: `/orders/${r.orderId}` }],
}
const patchRecordOrder = (o, patch) => storage.setItem(K.ORDERS, read(K.ORDERS).map((x) => (x.id === o.id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x)))

/** Demo route optimisation: groups stops by zone then pincode (nearest-neighbour proxy). Clearly labelled as simulated. */
const optimise = (stops) => [...stops].map((s) => ({ ...s, _o: read(K.ORDERS).find((o) => o.id === s.orderId) })).sort((a, b) => String(a._o?.zoneId).localeCompare(String(b._o?.zoneId)) || String(a._o?.deliveryPincode).localeCompare(String(b._o?.deliveryPincode))).map(({ _o, ...s }, i) => ({ ...s, sequence: i + 1, eta: dayjs().hour(7).minute(0).add(i * 35, 'minute').format('HH:mm') }))
export const routePlans = {
  id: 'route_plans', key: K.ROUTE_PLANS, label: 'Route plan', plural: 'Route plans', numberPrefix: 'RTE', idPrefix: 'rte', basePath: '/logistics/routes', auditModule: 'logistics',
  description: 'Plan stops for a vehicle and driver with delivery windows. "Optimise" re-sequences stops by zone and pincode — a DEMO heuristic, not a live routing engine.',
  permissions: { view: 'logistics.planning.view', create: 'logistics.planning.manage', edit: 'logistics.planning.manage' },
  scope: { hub: 'hubId', driver: 'driverId' }, filters: ['hubId', 'routeDate'],
  statuses: { DRAFT: S('Draft', 'neutral'), OPTIMISED: S('Optimised (demo)', 'accent'), PUBLISHED: S('Published', 'success'), CANCELLED: S('Cancelled', 'neutral') }, initialStatus: 'DRAFT', editableIn: ['DRAFT', 'OPTIMISED'],
  initialValues: () => ({ routeDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), hubId: 'hub-che', lines: [] }),
  fields: [
    { key: 'name', label: 'Route name', type: 'text', required: true },
    { key: 'routeDate', label: 'Date', type: 'date', required: true },
    { key: 'hubId', label: 'Hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'vehicleId', label: 'Vehicle', type: 'lookup', lookup: 'vehicles', required: true, filter: (v, x) => !x.hubId || v.hubId === x.hubId },
    { key: 'driverId', label: 'Driver', type: 'lookup', lookup: 'drivers', required: true, filter: (d, x) => !x.hubId || d.hubId === x.hubId },
    { key: 'lines', label: 'Stops', type: 'lines', required: true, columns: [{ key: 'orderId', label: 'Order', type: 'lookup', lookup: 'orders', required: true, span: 4, filter: (o) => ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH'].includes(o.orderStatus) }, { key: 'window', label: 'Window', type: 'select', options: ['06:00–09:00', '09:00–12:00', '12:00–15:00', '15:00–18:00'], span: 3 }, { key: 'sequence', label: 'Seq.', type: 'integer', span: 1 }, { key: 'eta', label: 'ETA (demo)', type: 'text', span: 2 }] },
  ],
  compute: (r) => ({ stops: (r.lines || []).length, plannedQty: sum(r.lines, (l) => read(K.ORDERS).find((o) => o.id === l.orderId)?.totalQuantity || 0) }),
  validate: (v, ctx) => {
    const e = {}
    const veh = recordFor('vehicles', v.vehicleId)
    const drv = recordFor('drivers', v.driverId)
    const qty = sum(v.lines, (l) => read(K.ORDERS).find((o) => o.id === l.orderId)?.totalQuantity || 0)
    if (veh && ['Inactive', 'Maintenance'].includes(veh.status)) e.vehicleId = `${veh.vehicleNumber} is ${veh.status.toLowerCase()}.`
    else if (veh?.capacity && qty > veh.capacity) e.vehicleId = `Planned ${qty} exceeds ${veh.vehicleNumber} capacity (${veh.capacity}).`
    if (drv && drv.status !== 'Active') e.driverId = `${drv.name} is ${String(drv.status).toLowerCase()}.`
    if (drv?.licenseExpiry && drv.licenseExpiry < (v.routeDate || today())) e.driverId = `${drv.name}'s licence has expired.`
    if (ctx.list.some((p) => p.id !== ctx.existing?.id && p.routeDate === v.routeDate && ['OPTIMISED', 'PUBLISHED', 'DRAFT'].includes(p.status) && (p.driverId === v.driverId || p.vehicleId === v.vehicleId))) e.driverId = 'Driver or vehicle already has a route plan that day.'
    const seen = new Set()
    ;(v.lines || []).forEach((l, i) => { if (seen.has(l.orderId)) e[`lines.${i}.orderId`] = 'Order listed twice.'; seen.add(l.orderId) })
    return e
  },
  listColumns: ['name', 'routeDate', 'hubId', 'vehicleId', 'driverId', 'stops', 'plannedQty'],
  kpis: (rs) => statusKpis(rs, routePlans, ['DRAFT', 'OPTIMISED', 'PUBLISHED']),
  actions: [
    { id: 'optimise', label: 'Optimise (demo)', from: ['DRAFT', 'OPTIMISED'], to: 'OPTIMISED', permission: 'logistics.planning.manage', note: 'none', description: 'Re-sequences the stops by zone and pincode and estimates ETAs at 35 minutes per stop. Simulated — no live maps or traffic.', effect: (r) => ({ patch: { lines: optimise(r.lines), optimisedAt: new Date().toISOString() } }) },
    { id: 'publish', label: 'Publish', from: ['DRAFT', 'OPTIMISED'], to: 'PUBLISHED', permission: 'logistics.planning.approve', notify: (r) => ({ title: `Route ${r.name} published`, message: `${r.stops} stops on ${r.routeDate}`, roles: ['DISPATCHER'], link: `/logistics/routes/${r.id}` }) },
    { id: 'cancel', label: 'Cancel', from: ['DRAFT', 'OPTIMISED', 'PUBLISHED'], to: 'CANCELLED', permission: 'logistics.planning.manage', note: 'required', tone: 'secondary' },
  ],
  related: () => [{ label: 'Dispatch planning', to: '/dispatch/planning' }],
}

export const exceptions = {
  id: 'operational_exceptions', key: K.OPERATIONAL_EXCEPTIONS, label: 'Exception', plural: 'Operational exceptions', numberPrefix: 'EXC', idPrefix: 'exc', basePath: '/operations/exceptions', auditModule: 'operations',
  description: 'Late and failed deliveries, temperature excursions, stock shortages, expiring lots, overdue receivables and vehicle issues — assigned, escalated and resolved with a full history.',
  permissions: { view: 'operations.exceptions.view', create: 'operations.exceptions.manage', edit: 'operations.exceptions.manage' },
  scope: { own: ['assignedTo'] }, filters: ['type', 'severity', 'assignedTo'],
  statuses: { OPEN: S('Open', 'warning'), ASSIGNED: S('Assigned', 'info'), ESCALATED: S('Escalated', 'danger'), RESOLVED: S('Resolved', 'success'), CLOSED: S('Closed', 'neutral') }, initialStatus: 'OPEN', editableIn: ['OPEN', 'ASSIGNED', 'ESCALATED'],
  initialValues: () => ({ type: 'Other', severity: 'Normal', dueAt: dayjs().add(4, 'hour').format('YYYY-MM-DDTHH:mm') }),
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, wide: true },
    { key: 'type', label: 'Type', type: 'select', options: ['Late delivery', 'Failed delivery', 'Temperature excursion', 'Stock shortage', 'Expiring stock', 'QA hold', 'Overdue receivable', 'Vehicle issue', 'Document expiry', 'Other'], required: true },
    { key: 'severity', label: 'Severity', type: 'select', options: PRIORITIES, required: true },
    { key: 'referenceLabel', label: 'Reference', type: 'text' },
    { key: 'link', label: 'Link', type: 'text', hideInDetail: true },
    { key: 'assignedTo', label: 'Assigned to', type: 'lookup', lookup: 'users' },
    { key: 'dueAt', label: 'Resolve by', type: 'datetime', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'resolution', label: 'Resolution', type: 'textarea', readOnly: true },
  ],
  listColumns: ['title', 'type', 'severity', 'referenceLabel', 'assignedTo', 'dueAt'],
  kpis: (rs) => [...statusKpis(rs, exceptions, ['OPEN', 'ASSIGNED', 'ESCALATED'], AlertTriangle), { label: 'Overdue', value: count(rs, (r) => !['RESOLVED', 'CLOSED'].includes(r.status) && dayjs().isAfter(dayjs(r.dueAt))), tone: 'danger' }],
  actions: [
    { id: 'assign', label: 'Assign', from: ['OPEN', 'ASSIGNED', 'ESCALATED'], to: 'ASSIGNED', permission: 'operations.exceptions.manage', inputs: [{ key: 'assignedTo', label: 'Assign to', type: 'lookup', lookup: 'users', required: true }], note: 'none', effect: (r, { input }) => (!input.values?.assignedTo ? { ok: false, error: 'Choose a person.' } : { patch: { assignedTo: input.values.assignedTo } }), notify: (r) => ({ title: `Exception ${r.number} assigned to you`, message: r.title, userIds: [r.assignedTo], link: `/operations/exceptions/${r.id}`, type: 'warning' }) },
    { id: 'escalate', label: 'Escalate', from: ['OPEN', 'ASSIGNED'], to: 'ESCALATED', permission: 'operations.exceptions.manage', note: 'required', tone: 'danger', notify: (r) => ({ title: `Exception escalated: ${r.title}`, message: r.number, roles: ['ADMIN', 'SUPER_ADMIN'], link: `/operations/exceptions/${r.id}`, type: 'danger' }) },
    { id: 'resolve', label: 'Resolve', from: ['OPEN', 'ASSIGNED', 'ESCALATED'], to: 'RESOLVED', permission: 'operations.exceptions.manage', note: 'required', effect: (r, { input }) => ({ patch: { resolution: input.note, resolvedAt: new Date().toISOString() } }) },
    { id: 'close', label: 'Close', from: ['RESOLVED'], to: 'CLOSED', permission: 'operations.exceptions.manage' },
  ],
  related: (r) => [r.link && { label: r.referenceLabel || 'Open source record', to: r.link }],
}

/* ---------------- Fleet ---------------- */
export const maintenance = {
  id: 'vehicle_maintenance', key: K.VEHICLE_MAINTENANCE, label: 'Maintenance job', plural: 'Vehicle maintenance', numberPrefix: 'MNT', idPrefix: 'mnt', basePath: '/fleet/maintenance', auditModule: 'fleetops',
  description: 'Preventive service, breakdowns, tyres and reefer-unit work with cost approval. A vehicle under active maintenance is shown as unavailable for planning.',
  permissions: { view: 'fleet.maintenance.view', create: 'fleet.maintenance.manage', edit: 'fleet.maintenance.manage' },
  filters: ['vehicleId', 'jobType'],
  statuses: { REQUESTED: S('Requested', 'warning'), APPROVED: S('Approved', 'info'), IN_PROGRESS: S('In workshop', 'brand'), COMPLETED: S('Completed', 'success'), CANCELLED: S('Cancelled', 'neutral') }, initialStatus: 'REQUESTED', editableIn: ['REQUESTED'],
  initialValues: () => ({ jobType: 'Preventive service', scheduledDate: dayjs().add(3, 'day').format('YYYY-MM-DD') }),
  fields: [
    { key: 'vehicleId', label: 'Vehicle', type: 'lookup', lookup: 'vehicles', required: true },
    { key: 'jobType', label: 'Job type', type: 'select', options: ['Preventive service', 'Breakdown repair', 'Tyres', 'Reefer unit', 'Body work', 'Inspection / fitness'], required: true },
    { key: 'scheduledDate', label: 'Scheduled', type: 'date', required: true },
    { key: 'odometer', label: 'Odometer (km)', type: 'integer', min: 0 },
    { key: 'vendor', label: 'Workshop / vendor', type: 'text' },
    { key: 'estimatedCost', label: 'Estimated cost', type: 'money', required: true, min: 0 },
    { key: 'actualCost', label: 'Actual cost', type: 'money', readOnly: true },
    { key: 'description', label: 'Work description', type: 'textarea', required: true },
  ],
  listColumns: ['vehicleId', 'jobType', 'scheduledDate', 'vendor', 'estimatedCost', 'actualCost'],
  kpis: (rs) => [...statusKpis(rs, maintenance, ['REQUESTED', 'IN_PROGRESS'], Wrench), { label: 'Cost this month', value: money(sum(rs.filter((r) => r.status === 'COMPLETED' && String(r.completedAt).slice(0, 7) === dayjs().format('YYYY-MM')), (r) => r.actualCost)) }, { label: 'Due ≤ 7 days', value: count(rs, (r) => ['REQUESTED', 'APPROVED'].includes(r.status) && dayjs(r.scheduledDate).diff(dayjs(), 'day') <= 7) }],
  actions: [
    { id: 'approve', label: 'Approve cost', from: ['REQUESTED'], to: 'APPROVED', permission: 'fleet.maintenance.approve', noSelf: true },
    { id: 'start', label: 'Into workshop', from: ['APPROVED'], to: 'IN_PROGRESS', permission: 'fleet.maintenance.manage', effect: (r) => { setVehicleStatus(r.vehicleId, 'Maintenance'); return { patch: { startedAt: new Date().toISOString() } } } },
    { id: 'complete', label: 'Complete', from: ['IN_PROGRESS'], to: 'COMPLETED', permission: 'fleet.maintenance.manage', inputs: [{ key: 'actualCost', label: 'Actual cost', type: 'money', required: true }], effect: (r, { input }) => { const c = Number(input.values?.actualCost); if (!Number.isFinite(c) || c < 0) return { ok: false, error: 'Enter the actual cost.' }; if (c > r.estimatedCost * 1.2 && String(input.note || '').trim().length < 3) return { ok: false, error: 'Actual cost is more than 20 % over the estimate — enter a note.' }; setVehicleStatus(r.vehicleId, 'Available'); return { patch: { actualCost: c, completedAt: new Date().toISOString() } } } },
    { id: 'cancel', label: 'Cancel', from: ['REQUESTED', 'APPROVED'], to: 'CANCELLED', permission: 'fleet.maintenance.manage', note: 'required', tone: 'secondary' },
  ],
}
const setVehicleStatus = (id, status) => storage.setItem(K.VEHICLES, read(K.VEHICLES).map((v) => (v.id === id && v.status !== 'Inactive' ? { ...v, status, updatedAt: new Date().toISOString() } : v)))

export const fuelLogs = {
  id: 'fuel_logs', key: K.FUEL_LOGS, label: 'Fuel entry', plural: 'Fuel logs', numberPrefix: 'FUEL', idPrefix: 'fuel', basePath: '/fleet/fuel', auditModule: 'fleetops',
  description: 'Fuel fills by vehicle and driver with odometer, litres and price — used for km/l and cost per km analytics.',
  permissions: { view: ['fleet.fuel.view', 'driver.app'], create: ['fleet.fuel.manage', 'driver.app'], edit: 'fleet.fuel.manage' },
  scope: { driver: 'driverId' }, filters: ['vehicleId', 'driverId'],
  statuses: { SUBMITTED: S('Submitted', 'warning'), VERIFIED: S('Verified', 'success'), REJECTED: S('Rejected', 'danger') }, initialStatus: 'SUBMITTED', editableIn: ['SUBMITTED'],
  initialValues: ({ user }) => { const d = driverOfUser(user); return { driverId: d?.id || '', __driverLock: d?.id || '', vehicleId: d?.vehicleId || '', date: today(), paymentMode: 'Fuel card' } },
  fields: [
    { key: 'vehicleId', label: 'Vehicle', type: 'lookup', lookup: 'vehicles', required: true },
    { key: 'driverId', label: 'Driver', type: 'lookup', lookup: 'drivers', required: true, filter: (d, v) => !v.__driverLock || d.id === v.__driverLock },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'odometer', label: 'Odometer (km)', type: 'integer', required: true, min: 0 },
    { key: 'litres', label: 'Litres', type: 'number', required: true, min: 0.1 },
    { key: 'pricePerLitre', label: 'Price / litre', type: 'money', required: true, min: 0 },
    { key: 'station', label: 'Station', type: 'text' },
    { key: 'paymentMode', label: 'Paid by', type: 'select', options: ['Fuel card', 'Cash (reimburse)', 'Company account'], required: true },
  ],
  compute: (r) => ({ amount: r2((Number(r.litres) || 0) * (Number(r.pricePerLitre) || 0)) }), computedSummary: ['amount'],
  validate: (v, ctx) => {
    const prev = ctx.list.filter((f) => f.vehicleId === v.vehicleId && f.id !== ctx.existing?.id && f.status !== 'REJECTED').sort((a, b) => b.odometer - a.odometer)[0]
    return prev && Number(v.odometer) <= prev.odometer && v.date >= prev.date ? { odometer: `Odometer must be higher than the last fill (${prev.odometer} km).` } : {}
  },
  listColumns: ['vehicleId', 'driverId', 'date', 'odometer', 'litres', 'amount'],
  kpis: (rs) => [{ label: 'Litres this month', value: sum(rs.filter((r) => String(r.date).slice(0, 7) === dayjs().format('YYYY-MM') && r.status !== 'REJECTED'), (r) => r.litres), icon: Fuel }, { label: 'Fuel cost this month', value: money(sum(rs.filter((r) => String(r.date).slice(0, 7) === dayjs().format('YYYY-MM') && r.status !== 'REJECTED'), (r) => r.amount)) }, ...statusKpis(rs, fuelLogs, ['SUBMITTED', 'VERIFIED'])],
  actions: [
    { id: 'verify', label: 'Verify', from: ['SUBMITTED'], to: 'VERIFIED', permission: 'fleet.fuel.manage', noSelf: true },
    { id: 'reject', label: 'Reject', from: ['SUBMITTED'], to: 'REJECTED', permission: 'fleet.fuel.manage', note: 'required', tone: 'danger' },
  ],
}

export const driverExpenses = {
  id: 'driver_expenses', key: K.DRIVER_EXPENSES, label: 'Driver expense', plural: 'Driver expenses', numberPrefix: 'DEX', idPrefix: 'dex', basePath: '/drivers/expenses', auditModule: 'driverops',
  description: 'Tolls, parking, meals and small repairs claimed by drivers from the driver app, approved by the supervisor and reimbursed by finance (recorded only).',
  permissions: { view: ['drivers.expenses.view', 'driver.app'], create: ['drivers.expenses.manage', 'driver.app'], edit: 'drivers.expenses.manage' },
  scope: { driver: 'driverId' }, filters: ['expenseType', 'driverId'],
  statuses: { SUBMITTED: S('Submitted', 'warning'), APPROVED: S('Approved', 'info'), REJECTED: S('Rejected', 'danger'), REIMBURSED: S('Reimbursed', 'success') }, initialStatus: 'SUBMITTED', editableIn: ['SUBMITTED'],
  initialValues: ({ user }) => ({ driverId: driverOfUser(user)?.id || '', __driverLock: driverOfUser(user)?.id || '', date: today(), expenseType: 'Toll' }),
  fields: [
    { key: 'driverId', label: 'Driver', type: 'lookup', lookup: 'drivers', required: true, filter: (d, v) => !v.__driverLock || d.id === v.__driverLock },
    { key: 'expenseType', label: 'Type', type: 'select', options: ['Toll', 'Parking', 'Meals', 'Minor repair', 'Loading charges', 'Other'], required: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'amount', label: 'Amount', type: 'money', required: true, min: 0.01, max: 50000 },
    { key: 'dispatchId', label: 'Dispatch', type: 'lookup', lookup: 'dispatches' },
    { key: 'receiptRef', label: 'Receipt / bill no.', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  validate: (v) => (v.date > today() ? { date: 'Date cannot be in the future.' } : {}),
  listColumns: ['driverId', 'expenseType', 'date', 'amount', 'receiptRef'],
  kpis: (rs) => [...statusKpis(rs, driverExpenses, ['SUBMITTED', 'APPROVED'], Receipt), { label: 'Approved, unpaid', value: money(sum(rs.filter((r) => r.status === 'APPROVED'), (r) => r.amount)) }],
  actions: [
    { id: 'approve', label: 'Approve', from: ['SUBMITTED'], to: 'APPROVED', permission: 'drivers.expenses.approve', noSelf: true },
    { id: 'reject', label: 'Reject', from: ['SUBMITTED'], to: 'REJECTED', permission: 'drivers.expenses.approve', note: 'required', tone: 'danger' },
    { id: 'reimburse', label: 'Mark reimbursed', from: ['APPROVED'], to: 'REIMBURSED', permission: 'finance.expenses.approve', description: 'Records the reimbursement — no payment is made from the prototype.' },
  ],
}

/* ---------------- Finance ---------------- */
export const customerPayments = {
  id: 'customer_payments', key: K.CUSTOMER_PAYMENTS, label: 'Customer receipt', plural: 'Customer receipts', numberPrefix: 'RCPT', idPrefix: 'rcpt', basePath: '/finance/payments', auditModule: 'ar',
  description: 'Money received from customers, allocated to invoices (never more than an invoice’s open balance). Posting reduces the customer’s outstanding used by order credit checks. Driver cash collections are posted here after deposit.',
  permissions: { view: ['finance.ar.view', 'driver.app', 'customerportal.finance'], create: ['finance.ar.manage', 'driver.app', 'finance.cash.manage'], edit: 'finance.ar.manage' },
  scope: { customer: 'customerId', driver: 'collectedByDriverId' }, filters: ['customerId', 'method'],
  statuses: { DRAFT: S('Draft', 'neutral'), PENDING_DEPOSIT: S('Collected — pending deposit', 'warning'), POSTED: S('Posted', 'success'), REVERSED: S('Reversed', 'danger') }, initialStatus: 'DRAFT', editableIn: ['DRAFT', 'PENDING_DEPOSIT'],
  initialValues: ({ user }) => { const d = driverOfUser(user); return { paymentDate: today(), method: d ? 'Driver cash collection' : 'Bank transfer', collectedByDriverId: d?.id || '', allocations: [] } },
  fields: [
    { key: 'customerId', label: 'Customer', type: 'lookup', lookup: 'customers', required: true },
    { key: 'paymentDate', label: 'Date', type: 'date', required: true },
    { key: 'amount', label: 'Amount received', type: 'money', required: true, min: 0.01 },
    { key: 'method', label: 'Method', type: 'select', options: ['Bank transfer', 'Cheque', 'Cash', 'Card', 'Driver cash collection'], required: true },
    { key: 'bankAccountId', label: 'Deposited to', type: 'lookup', lookup: 'bankAccounts' },
    { key: 'reference', label: 'Reference / cheque no.', type: 'text' },
    { key: 'collectedByDriverId', label: 'Collected by driver', type: 'lookup', lookup: 'drivers', hideIf: (v) => v.method !== 'Driver cash collection' },
    { key: 'allocations', label: 'Allocate to invoices', type: 'lines', columns: [{ key: 'invoiceId', label: 'Invoice', type: 'lookup', lookup: 'invoices', required: true, span: 6, fill: (i) => ({ amount: invoiceBalance(i.id) }) }, { key: 'open', label: 'Open balance', type: 'money', span: 3, computed: (l) => invoiceBalance(l.invoiceId) }, { key: 'amount', label: 'Allocate', type: 'money', required: true, span: 2 }] },
  ],
  compute: (r) => ({ allocated: sum(r.allocations, (a) => a.amount), unallocated: r2((Number(r.amount) || 0) - sum(r.allocations, (a) => a.amount)) }), computedSummary: ['allocated', 'unallocated'],
  validate: (v, ctx = {}) => {
    const e = {}
    const alloc = sum(v.allocations, (a) => a.amount)
    if (alloc > (Number(v.amount) || 0) + 0.009) e.allocations = 'Allocations exceed the amount received.'
    // Duplicate receipt: same customer + reference already recorded (and not reversed)
    const ref = String(v.reference || '').trim().toLowerCase()
    const twin = ref && (ctx.list || read(K.CUSTOMER_PAYMENTS)).find((p) => p.id !== ctx.existing?.id && p.id !== v.id && p.customerId === v.customerId && p.status !== 'REVERSED' && String(p.reference || '').trim().toLowerCase() === ref)
    if (twin) e.reference = `Receipt ${twin.number} already records reference “${v.reference}” for this customer.`
    const inv = read(K.INVOICES)
    ;(v.allocations || []).forEach((a, i) => {
      const iv = inv.find((x) => x.id === a.invoiceId)
      if (iv && iv.customerId !== v.customerId) e[`allocations.${i}.invoiceId`] = 'Invoice belongs to another customer.'
      if (Number(a.amount) > invoiceBalance(a.invoiceId) + 0.009) e[`allocations.${i}.amount`] = `More than the open balance (${money(invoiceBalance(a.invoiceId))}).`
      if (!(Number(a.amount) > 0)) e[`allocations.${i}.amount`] = 'Enter an amount.'
    })
    if (v.method === 'Driver cash collection' && !v.collectedByDriverId) e.collectedByDriverId = 'Choose the driver who collected the cash.'
    return e
  },
  listColumns: ['customerId', 'paymentDate', 'method', 'amount', 'unallocated', 'reference'],
  kpis: (rs) => [{ label: 'Posted this month', value: money(sum(rs.filter((r) => r.status === 'POSTED' && String(r.paymentDate).slice(0, 7) === dayjs().format('YYYY-MM')), (r) => r.amount)), icon: Wallet }, ...statusKpis(rs, customerPayments, ['PENDING_DEPOSIT', 'DRAFT']), { label: 'Unallocated cash', value: money(sum(rs.filter((r) => r.status === 'POSTED'), (r) => r.unallocated)) }],
  actions: [
    { id: 'collected', label: 'Mark collected (pending deposit)', from: ['DRAFT'], to: 'PENDING_DEPOSIT', permission: ['driver.app', 'finance.cash.manage', 'finance.ar.manage'], when: (r) => ['Cash', 'Driver cash collection', 'Cheque'].includes(r.method) },
    {
      id: 'post', label: 'Post receipt', from: ['DRAFT', 'PENDING_DEPOSIT'], to: 'POSTED', permission: 'finance.ar.manage',
      inputs: [{ key: 'bankAccountId', label: 'Deposited to', type: 'lookup', lookup: 'bankAccounts', required: true }], initialInputs: (r) => ({ bankAccountId: r.bankAccountId || '' }),
      effect: (r, { input }) => {
        const acct = input.values?.bankAccountId || r.bankAccountId
        if (!acct) return { ok: false, error: 'Choose the bank / cash account the money was deposited to.' }
        for (const a of r.allocations || []) if (Number(a.amount) > invoiceBalance(a.invoiceId) + 0.009) return { ok: false, error: 'An allocation is now more than the invoice’s open balance — edit the receipt.' }
        adjustCustomerOutstanding(r.customerId, -Number(r.amount || 0))
        return { patch: { bankAccountId: acct, postedAt: new Date().toISOString() } }
      },
    },
    { id: 'reverse', label: 'Reverse (bounced)', from: ['POSTED'], to: 'REVERSED', permission: 'finance.ar.manage', note: 'required', tone: 'danger', effect: (r) => { adjustCustomerOutstanding(r.customerId, Number(r.amount || 0)); return {} } },
  ],
  related: (r) => [{ label: 'Customer statement', to: `/finance/receivables?customer=${r.customerId}` }, ...(r.allocations || []).map((a) => ({ label: `Invoice ${recordFor('invoices', a.invoiceId)?.invoiceNumber || ''}`, to: `/invoices/${a.invoiceId}` }))],
}

export const creditNotes = {
  id: 'credit_notes', key: K.CREDIT_NOTES, label: 'Credit note', plural: 'Credit notes', numberPrefix: 'CN', idPrefix: 'cn', basePath: '/finance/credit-notes', auditModule: 'ar',
  description: 'Customer credit notes for returns, price corrections and short deliveries, with VAT. Approval (by another user) reduces the invoice balance and the customer outstanding.',
  permissions: { view: ['finance.ar.view', 'customerportal.finance'], create: ['finance.ar.manage', 'sales.returns.approve'], edit: 'finance.ar.manage' },
  scope: { customer: 'customerId' }, filters: ['customerId'],
  statuses: { DRAFT: S('Draft', 'neutral'), APPROVED: S('Approved', 'success'), CANCELLED: S('Cancelled', 'neutral') }, initialStatus: 'DRAFT', editableIn: ['DRAFT'],
  initialValues: () => ({ date: today() }),
  fields: [
    { key: 'customerId', label: 'Customer', type: 'lookup', lookup: 'customers', required: true },
    { key: 'invoiceId', label: 'Against invoice', type: 'lookup', lookup: 'invoices', filter: (i, v) => !v.customerId || i.customerId === v.customerId },
    { key: 'salesReturnId', label: 'Sales return', type: 'lookup', lookup: 'module:sales_returns', readOnly: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'reason', label: 'Reason', type: 'text', required: true, wide: true },
    { key: 'amount', label: 'Amount before VAT', type: 'money', required: true, min: 0.01 },
  ],
  compute: (r) => { const vat = vatOn(r.amount); return { vatAmount: vat, total: r2((Number(r.amount) || 0) + vat) } }, computedSummary: ['vatAmount', 'total'],
  validate: (v) => (v.invoiceId && r2((Number(v.amount) || 0) + vatOn(v.amount)) > invoiceBalance(v.invoiceId) + 0.009 ? { amount: `Credit (incl. VAT) exceeds the invoice open balance of ${money(invoiceBalance(v.invoiceId))}.` } : {}),
  listColumns: ['customerId', 'invoiceId', 'date', 'reason', 'total'],
  kpis: (rs) => [...statusKpis(rs, creditNotes, ['DRAFT', 'APPROVED']), { label: 'Credited (approved)', value: money(sum(rs.filter((r) => r.status === 'APPROVED'), (r) => r.total)) }],
  actions: [
    { id: 'approve', label: 'Approve', from: ['DRAFT'], to: 'APPROVED', permission: 'finance.ar.manage', noSelf: true, effect: (r) => { if (r.invoiceId && r.total > invoiceBalance(r.invoiceId) + 0.009) return { ok: false, error: 'The invoice no longer has that much open balance.' }; adjustCustomerOutstanding(r.customerId, -Number(r.total || 0)); return {} } },
    { id: 'cancel', label: 'Cancel', from: ['DRAFT'], to: 'CANCELLED', permission: 'finance.ar.manage', note: 'required', tone: 'secondary' },
  ],
  related: (r) => [r.invoiceId && { label: 'Invoice', to: `/invoices/${r.invoiceId}` }, r.salesReturnId && { label: 'Sales return', to: `/sales/returns/${r.salesReturnId}` }],
}

export const expenses = {
  id: 'expenses', key: K.EXPENSES, label: 'Expense', plural: 'Expenses', numberPrefix: 'EXP', idPrefix: 'exp', basePath: '/finance/expenses', auditModule: 'expenses',
  description: 'Operating expenses with VAT and supplier TRN, approval and payment recording.',
  permissions: { view: 'finance.expenses.view', create: 'finance.expenses.manage', edit: 'finance.expenses.manage' },
  filters: ['category', 'departmentId'],
  statuses: { SUBMITTED: S('Submitted', 'warning'), APPROVED: S('Approved', 'info'), PAID: S('Paid (recorded)', 'success'), REJECTED: S('Rejected', 'danger') }, initialStatus: 'SUBMITTED', editableIn: ['SUBMITTED'],
  initialValues: () => ({ date: today(), category: 'Utilities', vatApplicable: true }),
  fields: [
    { key: 'category', label: 'Category', type: 'select', options: ['Utilities', 'Rent', 'Repairs & maintenance', 'Office supplies', 'Travel', 'Marketing', 'Professional fees', 'Telecom', 'Insurance', 'Other'], required: true },
    { key: 'description', label: 'Description', type: 'text', required: true, wide: true },
    { key: 'vendor', label: 'Vendor', type: 'text', required: true },
    { key: 'vendorTrn', label: 'Vendor TRN', type: 'text' },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'departmentId', label: 'Department', type: 'lookup', lookup: 'departments' },
    { key: 'amount', label: 'Amount before VAT', type: 'money', required: true, min: 0.01 },
    { key: 'vatApplicable', label: 'VAT applicable', type: 'boolean' },
    { key: 'paidFromAccountId', label: 'Paid from', type: 'lookup', lookup: 'bankAccounts', readOnly: true },
  ],
  compute: (r) => { const vat = r.vatApplicable ? vatOn(r.amount) : 0; return { vatAmount: vat, total: r2((Number(r.amount) || 0) + vat) } }, computedSummary: ['vatAmount', 'total'],
  validate: (v) => { const t = validateTrn(v.vendorTrn); return t ? { vendorTrn: t } : v.vatApplicable && !v.vendorTrn && Number(v.amount) > 10000 ? { vendorTrn: 'Enter the vendor TRN to recover VAT on expenses above 10,000.' } : {} },
  listColumns: ['category', 'description', 'vendor', 'date', 'total'],
  kpis: (rs) => [...statusKpis(rs, expenses, ['SUBMITTED', 'APPROVED'], Banknote), { label: 'This month', value: money(sum(rs.filter((r) => ['APPROVED', 'PAID'].includes(r.status) && String(r.date).slice(0, 7) === dayjs().format('YYYY-MM')), (r) => r.total)) }, { label: 'Input VAT (approved)', value: money(sum(rs.filter((r) => ['APPROVED', 'PAID'].includes(r.status)), (r) => r.vatAmount)) }],
  actions: [
    { id: 'approve', label: 'Approve', from: ['SUBMITTED'], to: 'APPROVED', permission: 'finance.expenses.approve', noSelf: true },
    { id: 'reject', label: 'Reject', from: ['SUBMITTED'], to: 'REJECTED', permission: 'finance.expenses.approve', note: 'required', tone: 'danger' },
    { id: 'pay', label: 'Record payment', from: ['APPROVED'], to: 'PAID', permission: 'finance.cash.manage', inputs: [{ key: 'paidFromAccountId', label: 'Paid from', type: 'lookup', lookup: 'bankAccounts', required: true }], effect: (r, { input }) => (!input.values?.paidFromAccountId ? { ok: false, error: 'Choose the account.' } : { patch: { paidFromAccountId: input.values.paidFromAccountId, paidAt: new Date().toISOString() } }) },
  ],
}

export const bankAccounts = {
  id: 'bank_accounts', key: K.BANK_ACCOUNTS, label: 'Bank / cash account', plural: 'Bank & cash accounts', idPrefix: 'bank', basePath: '/finance/cash', auditModule: 'cashbank',
  description: 'Bank and petty-cash accounts. Balances are opening balance + posted receipts − recorded supplier / expense payments ± posted vouchers. No bank feed is connected.',
  permissions: { view: 'finance.cash.view', create: 'finance.cash.manage', edit: 'finance.cash.manage' },
  statuses: { ACTIVE: S('Active', 'success'), INACTIVE: S('Inactive', 'neutral') }, initialStatus: 'ACTIVE', titleField: 'bankName',
  fields: [
    { key: 'bankName', label: 'Bank / account name', type: 'text', required: true },
    { key: 'accountType', label: 'Type', type: 'select', options: ['Current account', 'Savings', 'Petty cash', 'Cash in hand'], required: true },
    { key: 'accountNumber', label: 'Account number', type: 'text', required: true },
    { key: 'iban', label: 'IBAN', type: 'text' },
    { key: 'currency', label: 'Currency', type: 'select', options: ['Base currency', 'AED', 'USD', 'EUR', 'INR'], required: true },
    { key: 'openingBalance', label: 'Opening balance', type: 'money', required: true },
    { key: 'balance', label: 'Current balance', type: 'money', computed: true, render: (_, r) => money(bankBalance(r.id)) },
  ],
  validate: (v) => (v.iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(String(v.iban).replace(/\s/g, '').toUpperCase()) ? { iban: 'Enter a valid IBAN (e.g. AE07 0331 2345 6789 0123 456).' } : {}),
  listColumns: ['bankName', 'accountType', 'accountNumber', 'currency', 'balance'],
  kpis: (rs) => [{ label: 'Total cash & bank', value: money(sum(rs.filter((r) => r.status === 'ACTIVE'), (r) => bankBalance(r.id))), icon: Wallet }, { label: 'Accounts', value: count(rs, (r) => r.status === 'ACTIVE') }],
  actions: [{ id: 'deactivate', label: 'Deactivate', from: ['ACTIVE'], to: 'INACTIVE', permission: 'finance.cash.manage', note: 'required', tone: 'secondary' }, { id: 'activate', label: 'Activate', from: ['INACTIVE'], to: 'ACTIVE', permission: 'finance.cash.manage' }],
  related: (r) => [{ label: 'Vouchers', to: `/finance/vouchers?bankAccountId=${r.id}` }],
}

export const vouchers = {
  id: 'vouchers', key: K.VOUCHERS, label: 'Voucher', plural: 'Vouchers', numberPrefix: 'VCH', idPrefix: 'vch', basePath: '/finance/vouchers', auditModule: 'cashbank',
  description: 'Receipt, payment, journal and contra vouchers for movements not captured elsewhere (bank charges, petty cash top-ups, adjustments).',
  permissions: { view: 'finance.cash.view', create: 'finance.cash.manage', edit: 'finance.cash.manage' },
  filters: ['voucherType', 'bankAccountId'],
  statuses: { DRAFT: S('Draft', 'neutral'), APPROVED: S('Approved', 'info'), POSTED: S('Posted', 'success'), CANCELLED: S('Cancelled', 'neutral') }, initialStatus: 'DRAFT', editableIn: ['DRAFT'],
  initialValues: () => ({ voucherType: 'Payment', date: today() }),
  fields: [
    { key: 'voucherType', label: 'Type', type: 'select', options: ['Receipt', 'Payment', 'Journal', 'Contra'], required: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'bankAccountId', label: 'Account', type: 'lookup', lookup: 'bankAccounts', required: true },
    { key: 'counterparty', label: 'Counterparty', type: 'text' },
    { key: 'amount', label: 'Amount', type: 'money', required: true, min: 0.01 },
    { key: 'narration', label: 'Narration', type: 'textarea', required: true },
  ],
  listColumns: ['voucherType', 'date', 'bankAccountId', 'counterparty', 'amount'],
  actions: [
    { id: 'approve', label: 'Approve', from: ['DRAFT'], to: 'APPROVED', permission: 'finance.cash.approve', noSelf: true },
    { id: 'post', label: 'Post', from: ['APPROVED'], to: 'POSTED', permission: 'finance.cash.manage', effect: (r) => (r.voucherType === 'Payment' && bankBalance(r.bankAccountId) < Number(r.amount) ? { ok: false, error: 'Insufficient balance in the account for this payment.' } : {}) },
    { id: 'cancel', label: 'Cancel', from: ['DRAFT', 'APPROVED'], to: 'CANCELLED', permission: 'finance.cash.manage', note: 'required', tone: 'secondary' },
  ],
}

export const cashClosings = {
  id: 'cash_closings', key: K.CASH_CLOSINGS, label: 'Cash closing', plural: 'Daily cash closing', numberPrefix: 'CCL', idPrefix: 'ccl', basePath: '/finance/cash-closing', auditModule: 'cashbank',
  description: 'End-of-day cash count per hub against cash receipts recorded that day. Variances need approval.',
  permissions: { view: 'finance.cash.view', create: 'finance.cash.manage', edit: 'finance.cash.manage' },
  filters: ['hubId'],
  statuses: { SUBMITTED: S('Submitted', 'warning'), APPROVED: S('Approved', 'success'), DISPUTED: S('Disputed', 'danger') }, initialStatus: 'SUBMITTED', editableIn: ['SUBMITTED'],
  initialValues: ({ user }) => ({ hubId: user?.hubId || 'hub-che', date: today(), openingCash: 0 }),
  fields: [
    { key: 'hubId', label: 'Hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'openingCash', label: 'Opening cash', type: 'money', required: true, min: 0 },
    { key: 'cashPayments', label: 'Cash paid out', type: 'money', min: 0 },
    { key: 'countedCash', label: 'Counted cash', type: 'money', required: true, min: 0 },
  ],
  compute: (r) => {
    const custHub = Object.fromEntries(read(K.CUSTOMERS).map((c) => [c.id, c.hubId]))
    const receipts = sum(read(K.CUSTOMER_PAYMENTS).filter((p) => ['POSTED', 'PENDING_DEPOSIT'].includes(p.status) && ['Cash', 'Driver cash collection'].includes(p.method) && p.paymentDate === r.date && custHub[p.customerId] === r.hubId), (p) => p.amount)
    const vanCash = sum(read(K.VAN_SETTLEMENTS).filter((s) => s.routeDate === r.date && s.hubId === r.hubId), (s) => s.cashDeposited)
    const expected = r2((Number(r.openingCash) || 0) + receipts + vanCash - (Number(r.cashPayments) || 0))
    return { cashReceipts: receipts, vanCash, expectedCash: expected, variance: r2((Number(r.countedCash) || 0) - expected) }
  },
  computedSummary: ['cashReceipts', 'vanCash', 'expectedCash', 'variance'],
  validate: (v, ctx) => (ctx.list.some((c) => c.id !== ctx.existing?.id && c.hubId === v.hubId && c.date === v.date) ? { date: 'This hub is already closed for that day.' } : {}),
  listColumns: ['hubId', 'date', 'expectedCash', 'countedCash', 'variance'],
  actions: [
    { id: 'approve', label: 'Approve', from: ['SUBMITTED', 'DISPUTED'], to: 'APPROVED', permission: 'finance.cash.approve', noSelf: true, effect: (r, { input }) => (Math.abs(r.variance) > 0.009 && String(input.note || '').trim().length < 3 ? { ok: false, error: 'There is a variance — enter a note.' } : {}) },
    { id: 'dispute', label: 'Dispute', from: ['SUBMITTED'], to: 'DISPUTED', permission: 'finance.cash.approve', note: 'required', tone: 'danger' },
  ],
}

/* ---------------- HR ---------------- */
export const employees = {
  id: 'employees', key: K.EMPLOYEES, label: 'Employee', plural: 'Employees', idPrefix: 'emp', basePath: '/hr/employees', auditModule: 'hr',
  description: 'HR employee records linked to user accounts: department, designation, branch, business unit, reporting manager, work location, roles, documents and status.',
  permissions: { view: ['hr.employees.view', 'ess.access'], create: 'hr.employees.manage', edit: 'hr.employees.manage' },
  scope: { own: ['userId'] }, titleField: 'name', defaultSort: 'employeeCode', filters: ['departmentId', 'branchId', 'employmentType'],
  statuses: { ACTIVE: S('Active', 'success'), ON_LEAVE: S('On leave', 'info'), PROBATION: S('Probation', 'warning'), RESIGNED: S('Resigned', 'neutral'), TERMINATED: S('Terminated', 'danger') }, initialStatus: 'ACTIVE', editableIn: ['ACTIVE', 'ON_LEAVE', 'PROBATION'],
  initialValues: () => ({ joinDate: today(), employmentType: 'Full-time', branchId: 'br-dxb', businessUnitId: 'bu-shared', nationality: '' }),
  sections: [
    { title: 'Employee', fields: ['name', 'employeeCode', 'userId', 'email', 'phone', 'nationality', 'joinDate', 'employmentType'] },
    { title: 'Organization', fields: ['departmentId', 'designationId', 'branchId', 'businessUnitId', 'reportingManagerId', 'workLocationHubId', 'primaryRole', 'additionalRoles'] },
    { title: 'Documents (expiry tracking)', fields: ['passportExpiry', 'visaExpiry', 'emiratesIdExpiry', 'labourCardExpiry'] },
  ],
  fields: [
    { key: 'name', label: 'Full name', type: 'text', required: true },
    { key: 'employeeCode', label: 'Employee ID', type: 'text', required: true },
    { key: 'userId', label: 'User account', type: 'lookup', lookup: 'users' },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone', type: 'phone' },
    { key: 'nationality', label: 'Nationality', type: 'text' },
    { key: 'joinDate', label: 'Join date', type: 'date', required: true },
    { key: 'employmentType', label: 'Employment type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Intern'], required: true },
    { key: 'departmentId', label: 'Department', type: 'lookup', lookup: 'departments', required: true },
    { key: 'designationId', label: 'Designation', type: 'lookup', lookup: 'designations', required: true },
    { key: 'branchId', label: 'Branch', type: 'lookup', lookup: 'branches', required: true },
    { key: 'businessUnitId', label: 'Business unit', type: 'lookup', lookup: 'businessUnits' },
    { key: 'reportingManagerId', label: 'Reporting manager', type: 'lookup', lookup: 'employees' },
    { key: 'workLocationHubId', label: 'Work location', type: 'lookup', lookup: 'hubs' },
    { key: 'primaryRole', label: 'Primary role', type: 'lookup', lookup: 'roles' },
    { key: 'additionalRoles', label: 'Additional roles', type: 'multilookup', lookup: 'roles' },
    { key: 'passportExpiry', label: 'Passport expiry', type: 'date' },
    { key: 'visaExpiry', label: 'Visa expiry', type: 'date' },
    { key: 'emiratesIdExpiry', label: 'Emirates ID expiry', type: 'date' },
    { key: 'labourCardExpiry', label: 'Labour card expiry', type: 'date' },
  ],
  validate: (v, ctx) => {
    const e = {}
    if (ctx.list.some((x) => x.id !== ctx.existing?.id && String(x.employeeCode).toUpperCase() === String(v.employeeCode || '').toUpperCase())) e.employeeCode = 'Employee ID already exists.'
    if (v.userId && ctx.list.some((x) => x.id !== ctx.existing?.id && x.userId === v.userId)) e.userId = 'This user account is already linked to another employee.'
    if (v.reportingManagerId && v.reportingManagerId === ctx.existing?.id) e.reportingManagerId = 'An employee cannot report to themselves.'
    return e
  },
  listColumns: ['employeeCode', 'name', 'departmentId', 'designationId', 'branchId', 'reportingManagerId'], searchFields: ['email', 'employeeCode'],
  kpis: (rs) => [{ label: 'Active employees', value: count(rs, (r) => ['ACTIVE', 'PROBATION'].includes(r.status)), icon: Users, filter: { status: 'ACTIVE' } }, { label: 'On leave', value: count(rs, (r) => r.status === 'ON_LEAVE'), filter: { status: 'ON_LEAVE' } }, { label: 'Visa / ID expiring ≤ 60 d', value: count(rs, (r) => ['visaExpiry', 'emiratesIdExpiry', 'passportExpiry'].some((k) => r[k] && dayjs(r[k]).diff(dayjs(), 'day') <= 60)), tone: 'warning' }, { label: 'Departments', value: new Set(rs.map((r) => r.departmentId)).size }],
  actions: [
    { id: 'leave', label: 'Mark on leave', from: ['ACTIVE'], to: 'ON_LEAVE', permission: 'hr.employees.manage' },
    { id: 'return', label: 'Back from leave', from: ['ON_LEAVE'], to: 'ACTIVE', permission: 'hr.employees.manage' },
    { id: 'confirm', label: 'Confirm probation', from: ['PROBATION'], to: 'ACTIVE', permission: 'hr.employees.manage' },
    { id: 'resign', label: 'Resigned', from: ['ACTIVE', 'PROBATION', 'ON_LEAVE'], to: 'RESIGNED', permission: 'hr.employees.manage', note: 'required', tone: 'secondary' },
    { id: 'terminate', label: 'Terminate', from: ['ACTIVE', 'PROBATION', 'ON_LEAVE'], to: 'TERMINATED', permission: 'hr.employees.manage', note: 'required', tone: 'danger' },
  ],
  related: (r) => [r.userId && { label: 'User account', to: `/admin/users/${r.userId}` }, { label: 'Leave', to: `/hr/leave?employeeId=${r.id}` }, { label: 'Attendance', to: `/hr/attendance?employeeId=${r.id}` }],
}

export const jobRequisitions = {
  id: 'job_requisitions', key: K.JOB_REQUISITIONS, label: 'Job requisition', plural: 'Job requisitions', numberPrefix: 'JR', idPrefix: 'jr', basePath: '/hr/recruitment', auditModule: 'hr',
  description: 'Approved headcount requests. Candidates are tracked against an open requisition; hiring a candidate creates the employee record.',
  permissions: { view: 'hr.recruitment.view', create: 'hr.recruitment.manage', edit: 'hr.recruitment.manage' },
  filters: ['departmentId'],
  statuses: { DRAFT: S('Draft', 'neutral'), PENDING_APPROVAL: S('Pending approval', 'warning'), OPEN: S('Open', 'info'), FILLED: S('Filled', 'success'), CANCELLED: S('Cancelled', 'neutral'), REJECTED: S('Rejected', 'danger') }, initialStatus: 'DRAFT', editableIn: ['DRAFT', 'REJECTED'],
  initialValues: () => ({ headcount: 1, employmentType: 'Full-time' }),
  fields: [
    { key: 'title', label: 'Position', type: 'text', required: true },
    { key: 'departmentId', label: 'Department', type: 'lookup', lookup: 'departments', required: true },
    { key: 'designationId', label: 'Designation', type: 'lookup', lookup: 'designations' },
    { key: 'headcount', label: 'Headcount', type: 'integer', required: true, min: 1 },
    { key: 'employmentType', label: 'Employment type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Intern'], required: true },
    { key: 'salaryBudget', label: 'Monthly salary budget', type: 'money', min: 0 },
    { key: 'justification', label: 'Justification', type: 'textarea', required: true },
  ],
  compute: (r) => ({ hired: count(read(K.CANDIDATES), (c) => c.jobRequisitionId === r.id && c.status === 'HIRED') }),
  listColumns: ['title', 'departmentId', 'headcount', 'hired', 'salaryBudget'],
  kpis: (rs) => statusKpis(rs, jobRequisitions, ['PENDING_APPROVAL', 'OPEN', 'FILLED']),
  actions: [
    { id: 'submit', label: 'Submit', from: ['DRAFT', 'REJECTED'], to: 'PENDING_APPROVAL', permission: 'hr.recruitment.manage' },
    { id: 'approve', label: 'Approve', from: ['PENDING_APPROVAL'], to: 'OPEN', permission: 'hr.recruitment.approve', noSelf: true },
    { id: 'reject', label: 'Reject', from: ['PENDING_APPROVAL'], to: 'REJECTED', permission: 'hr.recruitment.approve', note: 'required', tone: 'danger' },
    { id: 'cancel', label: 'Cancel', from: ['DRAFT', 'OPEN'], to: 'CANCELLED', permission: 'hr.recruitment.manage', note: 'required', tone: 'secondary' },
  ],
  related: (r) => [{ label: 'Candidates', to: `/hr/candidates?jobRequisitionId=${r.id}` }],
}

export const candidates = {
  id: 'candidates', key: K.CANDIDATES, label: 'Candidate', plural: 'Candidates', idPrefix: 'can', basePath: '/hr/candidates', auditModule: 'hr', titleField: 'name',
  description: 'Recruitment pipeline from application to offer. "Hire" creates the employee record (no contract or visa process is triggered).',
  permissions: { view: 'hr.recruitment.view', create: 'hr.recruitment.manage', edit: 'hr.recruitment.manage' },
  filters: ['jobRequisitionId', 'source'],
  statuses: { APPLIED: S('Applied', 'info'), SCREENING: S('Screening', 'brand'), INTERVIEW: S('Interview', 'accent'), OFFERED: S('Offered', 'warning'), HIRED: S('Hired', 'success'), REJECTED: S('Rejected', 'danger') }, initialStatus: 'APPLIED', editableIn: ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED'],
  initialValues: ({ params }) => ({ jobRequisitionId: params?.get('jobRequisitionId') || '', source: 'Job portal' }),
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone', type: 'phone' },
    { key: 'jobRequisitionId', label: 'Position', type: 'lookup', lookup: 'module:job_requisitions', required: true, filter: (j) => j.status === 'OPEN' },
    { key: 'source', label: 'Source', type: 'select', options: ['Job portal', 'Referral', 'Agency', 'LinkedIn', 'Walk-in'], required: true },
    { key: 'expectedSalary', label: 'Expected salary', type: 'money', min: 0 },
    { key: 'interviewDate', label: 'Interview date', type: 'date' },
    { key: 'rating', label: 'Rating (1–5)', type: 'integer', min: 1, max: 5 },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  listColumns: ['name', 'jobRequisitionId', 'source', 'interviewDate', 'rating'],
  kpis: (rs) => statusKpis(rs, candidates, ['APPLIED', 'INTERVIEW', 'OFFERED', 'HIRED']),
  actions: [
    { id: 'screen', label: 'Screening', from: ['APPLIED'], to: 'SCREENING', permission: 'hr.recruitment.manage' },
    { id: 'interview', label: 'Interview', from: ['SCREENING'], to: 'INTERVIEW', permission: 'hr.recruitment.manage' },
    { id: 'offer', label: 'Make offer', from: ['INTERVIEW'], to: 'OFFERED', permission: 'hr.recruitment.approve' },
    {
      id: 'hire', label: 'Hire', from: ['OFFERED'], to: 'HIRED', permission: 'hr.recruitment.approve',
      effect: (r, { user }) => {
        const jr = read(K.JOB_REQUISITIONS).find((j) => j.id === r.jobRequisitionId)
        if (!jr || jr.status !== 'OPEN') return { ok: false, error: 'The position is not open.' }
        const hired = count(read(K.CANDIDATES), (c) => c.jobRequisitionId === jr.id && c.status === 'HIRED')
        if (hired >= jr.headcount) return { ok: false, error: 'All positions on this requisition are filled.' }
        const code = `EMP-${String(1000 + read(K.EMPLOYEES).length + 1).padStart(4, '0')}`
        const e = createRecord('employees', { name: r.name, employeeCode: code, email: r.email, phone: r.phone || '', joinDate: dayjs().add(14, 'day').format('YYYY-MM-DD'), employmentType: jr.employmentType, departmentId: jr.departmentId, designationId: jr.designationId || '', branchId: 'br-dxb' }, user, { system: true })
        if (!e.ok) return e
        patchRecord('employees', e.record.id, { status: 'PROBATION' }, { user, action: 'Joined on probation' })
        if (hired + 1 >= jr.headcount) patchRecord('job_requisitions', jr.id, { status: 'FILLED' }, { user, action: 'All positions filled' })
        return { patch: { employeeId: e.record.id } }
      },
    },
    { id: 'reject', label: 'Reject', from: ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED'], to: 'REJECTED', permission: 'hr.recruitment.manage', note: 'required', tone: 'danger' },
  ],
  related: (r) => [r.employeeId && { label: 'Employee record', to: `/hr/employees/${r.employeeId}` }],
}

const hoursBetween = (a, b) => (a && b ? r2(dayjs(`2000-01-01T${b}`).diff(dayjs(`2000-01-01T${a}`), 'minute') / 60) : 0)
export const attendance = {
  id: 'employee_attendance', key: K.EMPLOYEE_ATTENDANCE, label: 'Attendance record', plural: 'Attendance', idPrefix: 'att', basePath: '/hr/attendance', auditModule: 'hr',
  description: 'Daily attendance. Entries are manual or DEMO device imports — no biometric device is connected.',
  permissions: { view: ['hr.attendance.view', 'ess.access'], create: ['hr.attendance.manage', 'ess.access'], edit: 'hr.attendance.manage' },
  scope: { own: ['userId'] }, filters: ['employeeId', 'date', 'source'], defaultSort: 'date',
  statuses: { PRESENT: S('Present', 'success'), LATE: S('Late', 'warning'), ABSENT: S('Absent', 'danger'), HALF_DAY: S('Half day', 'info'), REGULARISED: S('Regularised', 'brand') }, initialStatus: 'PRESENT', editableIn: ['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY'],
  initialValues: ({ user }) => { const e = employeeOfUser(user); return { employeeId: e?.id || '', userId: user?.id, date: today(), checkIn: '08:00', checkOut: '17:00', source: 'MANUAL' } },
  fields: [
    { key: 'employeeId', label: 'Employee', type: 'lookup', lookup: 'employees', required: true, onChange: (v) => ({ userId: recordFor('employees', v)?.userId || '' }) },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'checkIn', label: 'Check in (HH:mm)', type: 'text' },
    { key: 'checkOut', label: 'Check out (HH:mm)', type: 'text' },
    { key: 'source', label: 'Source', type: 'select', options: [{ value: 'MANUAL', label: 'Manual' }, { value: 'DEMO_DEVICE', label: 'Demo device import' }, { value: 'ESS', label: 'Self-service' }], required: true },
    { key: 'remarks', label: 'Remarks', type: 'text' },
  ],
  compute: (r) => { const h = hoursBetween(r.checkIn, r.checkOut); const st = r.status === 'REGULARISED' ? 'REGULARISED' : !r.checkIn ? 'ABSENT' : r.checkIn > '08:15' ? 'LATE' : h > 0 && h < 5 ? 'HALF_DAY' : 'PRESENT'; return { hoursWorked: h, status: st } },
  validate: (v, ctx) => {
    const e = {}
    if (v.checkIn && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.checkIn)) e.checkIn = 'Use HH:mm.'
    if (v.checkOut && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.checkOut)) e.checkOut = 'Use HH:mm.'
    if (v.checkIn && v.checkOut && v.checkOut <= v.checkIn) e.checkOut = 'Check out must be after check in.'
    if (v.date > today()) e.date = 'Cannot record future attendance.'
    if (ctx.list.some((a) => a.id !== ctx.existing?.id && a.employeeId === v.employeeId && a.date === v.date)) e.date = 'Attendance for this employee and date already exists.'
    return e
  },
  listColumns: ['employeeId', 'date', 'checkIn', 'checkOut', 'hoursWorked', 'source'],
  kpis: (rs) => [{ label: 'Present today', value: count(rs, (r) => r.date === today() && ['PRESENT', 'LATE', 'HALF_DAY', 'REGULARISED'].includes(r.status)), icon: CalendarDays }, { label: 'Late today', value: count(rs, (r) => r.date === today() && r.status === 'LATE'), filter: { status: 'LATE' } }, { label: 'Absent today', value: count(rs, (r) => r.date === today() && r.status === 'ABSENT'), tone: 'danger' }, { label: 'Avg hours (7 d)', value: (() => { const l = rs.filter((r) => dayjs().diff(dayjs(r.date), 'day') <= 7 && r.hoursWorked > 0); return l.length ? r2(sum(l, (r) => r.hoursWorked) / l.length) : 0 })() }],
  actions: [{ id: 'regularise', label: 'Regularise', from: ['LATE', 'ABSENT', 'HALF_DAY'], to: 'REGULARISED', permission: 'hr.attendance.manage', note: 'required' }],
}

export const leaveRequests = {
  id: 'leave_requests', key: K.LEAVE_REQUESTS, label: 'Leave request', plural: 'Leave requests', numberPrefix: 'LV', idPrefix: 'lv', basePath: '/hr/leave', auditModule: 'hr',
  description: 'Leave applications from employee self-service with manager / HR approval and balance by type.',
  permissions: { view: ['hr.leave.view', 'ess.access'], create: ['hr.leave.view', 'ess.access'], edit: 'hr.leave.approve' },
  scope: { own: ['userId'] }, ownerEditOnly: true, filters: ['leaveType', 'employeeId'],
  statuses: { PENDING: S('Pending', 'warning'), APPROVED: S('Approved', 'success'), REJECTED: S('Rejected', 'danger'), CANCELLED: S('Cancelled', 'neutral') }, initialStatus: 'PENDING', editableIn: ['PENDING'],
  initialValues: ({ user }) => { const e = employeeOfUser(user); return { employeeId: e?.id || '', userId: user?.id, leaveType: 'Annual leave', fromDate: dayjs().add(7, 'day').format('YYYY-MM-DD'), toDate: dayjs().add(8, 'day').format('YYYY-MM-DD') } },
  fields: [
    { key: 'employeeId', label: 'Employee', type: 'lookup', lookup: 'employees', required: true, onChange: (v) => ({ userId: recordFor('employees', v)?.userId || '' }) },
    { key: 'leaveType', label: 'Leave type', type: 'select', options: ['Annual leave', 'Sick leave', 'Emergency leave', 'Unpaid leave', 'Hajj leave', 'Maternity / paternity'], required: true },
    { key: 'fromDate', label: 'From', type: 'date', required: true },
    { key: 'toDate', label: 'To', type: 'date', required: true },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true },
  ],
  compute: (r) => ({ days: r.fromDate && r.toDate ? Math.max(0, dayjs(r.toDate).diff(dayjs(r.fromDate), 'day') + 1) : 0 }), computedSummary: ['days'],
  validate: (v, ctx) => {
    const e = {}
    if (v.toDate < v.fromDate) e.toDate = 'End date must be on or after the start date.'
    const days = dayjs(v.toDate).diff(dayjs(v.fromDate), 'day') + 1
    if (v.leaveType === 'Annual leave') {
      const used = sum(ctx.list.filter((l) => l.id !== ctx.existing?.id && l.employeeId === v.employeeId && l.leaveType === 'Annual leave' && ['PENDING', 'APPROVED'].includes(l.status) && String(l.fromDate).slice(0, 4) === String(v.fromDate).slice(0, 4)), (l) => l.days)
      if (used + days > 30) e.toDate = `Exceeds the 30-day annual entitlement (${30 - used} days left).`
    }
    if (ctx.list.some((l) => l.id !== ctx.existing?.id && l.employeeId === v.employeeId && ['PENDING', 'APPROVED'].includes(l.status) && l.fromDate <= v.toDate && l.toDate >= v.fromDate)) e.fromDate = 'Overlaps another leave request.'
    if (ctx.user && !ctx.existing && v.userId !== ctx.user.id && !can(ctx.user, 'hr.leave.approve')) e.employeeId = 'You can only apply for your own leave.'
    return e
  },
  listColumns: ['employeeId', 'leaveType', 'fromDate', 'toDate', 'days'],
  kpis: (rs) => [...statusKpis(rs, leaveRequests, ['PENDING', 'APPROVED']), { label: 'On leave today', value: count(rs, (r) => r.status === 'APPROVED' && r.fromDate <= today() && r.toDate >= today()) }],
  actions: [
    { id: 'approve', label: 'Approve', from: ['PENDING'], to: 'APPROVED', permission: 'hr.leave.approve', noSelf: true, effect: (r, { user }) => (r.userId === user.id ? { ok: false, error: 'You cannot approve your own leave.' } : {}) },
    { id: 'reject', label: 'Reject', from: ['PENDING'], to: 'REJECTED', permission: 'hr.leave.approve', note: 'required', tone: 'danger' },
    { id: 'cancel', label: 'Cancel request', from: ['PENDING', 'APPROVED'], to: 'CANCELLED', permission: ['ess.access', 'hr.leave.approve'], note: 'required', tone: 'secondary', when: (r) => r.fromDate > today() },
  ],
}

export const salaryStructures = {
  id: 'salary_structures', key: K.SALARY_STRUCTURES, label: 'Salary structure', plural: 'Salary structures', idPrefix: 'sal', basePath: '/hr/salary', auditModule: 'payroll',
  description: 'Monthly pay components per employee (demo). Restricted to payroll roles.',
  permissions: { view: 'hr.payroll.view', create: 'hr.payroll.manage', edit: 'hr.payroll.manage' },
  statuses: { ACTIVE: S('Active', 'success'), INACTIVE: S('Superseded', 'neutral') }, initialStatus: 'ACTIVE',
  initialValues: () => ({ effectiveFrom: dayjs().startOf('month').format('YYYY-MM-DD'), basic: 0, housing: 0, transport: 0, otherAllowances: 0, fixedDeductions: 0 }),
  fields: [
    { key: 'employeeId', label: 'Employee', type: 'lookup', lookup: 'employees', required: true },
    { key: 'effectiveFrom', label: 'Effective from', type: 'date', required: true },
    { key: 'basic', label: 'Basic', type: 'money', required: true, min: 0 },
    { key: 'housing', label: 'Housing', type: 'money', min: 0 },
    { key: 'transport', label: 'Transport', type: 'money', min: 0 },
    { key: 'otherAllowances', label: 'Other allowances', type: 'money', min: 0 },
    { key: 'fixedDeductions', label: 'Fixed deductions', type: 'money', min: 0 },
  ],
  compute: (r) => { const gross = r2(sum([r.basic, r.housing, r.transport, r.otherAllowances], (x) => x)); return { gross, net: r2(gross - (Number(r.fixedDeductions) || 0)) } }, computedSummary: ['gross', 'net'],
  validate: (v, ctx) => (ctx.list.some((s) => s.id !== ctx.existing?.id && s.employeeId === v.employeeId && s.status === 'ACTIVE') && !ctx.existing ? { employeeId: 'This employee already has an active structure — supersede it first.' } : {}),
  listColumns: ['employeeId', 'effectiveFrom', 'basic', 'gross', 'net'],
  actions: [{ id: 'supersede', label: 'Supersede', from: ['ACTIVE'], to: 'INACTIVE', permission: 'hr.payroll.manage', note: 'required', tone: 'secondary' }],
}

export const buildPayrollLines = (period) => {
  const start = dayjs(`${period}-01`)
  const days = start.daysInMonth()
  const emps = Object.fromEntries(read(K.EMPLOYEES).map((e) => [e.id, e]))
  const att = read(K.EMPLOYEE_ATTENDANCE).filter((a) => String(a.date).startsWith(period))
  const unpaid = read(K.LEAVE_REQUESTS).filter((l) => l.status === 'APPROVED' && l.leaveType === 'Unpaid leave' && String(l.fromDate).startsWith(period))
  return read(K.SALARY_STRUCTURES).filter((s) => s.status === 'ACTIVE' && emps[s.employeeId] && !['RESIGNED', 'TERMINATED'].includes(emps[s.employeeId].status)).map((s) => {
    const absent = count(att, (a) => a.employeeId === s.employeeId && a.status === 'ABSENT') + sum(unpaid.filter((l) => l.employeeId === s.employeeId), (l) => l.days)
    const gross = s.gross || r2(sum([s.basic, s.housing, s.transport, s.otherAllowances], (x) => x))
    const absenceDeduction = r2((gross / days) * absent)
    return { employeeId: s.employeeId, gross, absentDays: absent, absenceDeduction, fixedDeductions: Number(s.fixedDeductions) || 0, net: r2(gross - absenceDeduction - (Number(s.fixedDeductions) || 0)) }
  })
}
export const payroll = {
  id: 'payroll', key: K.PAYROLL, label: 'Payroll run', plural: 'Payroll (demo)', numberPrefix: 'PAY', idPrefix: 'pay', basePath: '/hr/payroll', auditModule: 'payroll',
  description: 'DEMO payroll: gross from salary structures less absence (attendance + unpaid leave) and fixed deductions. No WPS file, bank transfer or labour-law compliance integration is live.',
  permissions: { view: 'hr.payroll.view', create: 'hr.payroll.manage', edit: 'hr.payroll.manage' },
  statuses: { DRAFT: S('Draft', 'neutral'), CALCULATED: S('Calculated', 'info'), APPROVED: S('Approved', 'accent'), PAID_DEMO: S('Marked paid (demo)', 'success'), CANCELLED: S('Cancelled', 'neutral') }, initialStatus: 'DRAFT', editableIn: ['DRAFT'],
  initialValues: () => ({ period: dayjs().subtract(1, 'month').format('YYYY-MM'), lines: [] }),
  fields: [
    { key: 'period', label: 'Month (YYYY-MM)', type: 'text', required: true },
    { key: 'notes', label: 'Notes', type: 'textarea' },
    { key: 'lines', label: 'Payslips', type: 'lines', readOnly: true, columns: [{ key: 'employeeId', label: 'Employee', type: 'lookup', lookup: 'employees', span: 4 }, { key: 'gross', label: 'Gross', type: 'money', span: 2 }, { key: 'absentDays', label: 'Absent days', type: 'number', span: 1 }, { key: 'absenceDeduction', label: 'Absence ded.', type: 'money', span: 2 }, { key: 'net', label: 'Net', type: 'money', span: 2 }] },
  ],
  compute: (r) => ({ employeesCount: (r.lines || []).length, totalGross: sum(r.lines, (l) => l.gross), totalNet: sum(r.lines, (l) => l.net) }),
  validate: (v, ctx) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(v.period || ''))) return { period: 'Use YYYY-MM.' }
    if (ctx.list.some((p) => p.id !== ctx.existing?.id && p.period === v.period && p.status !== 'CANCELLED')) return { period: 'A payroll run for this month already exists.' }
    return {}
  },
  listColumns: ['period', 'employeesCount', 'totalGross', 'totalNet'],
  kpis: (rs) => [...statusKpis(rs, payroll, ['DRAFT', 'CALCULATED', 'APPROVED']), { label: 'Last net payroll', value: money(rs.filter((r) => r.status === 'PAID_DEMO').sort((a, b) => String(b.period).localeCompare(a.period))[0]?.totalNet || 0) }],
  actions: [
    { id: 'calculate', label: 'Calculate', from: ['DRAFT', 'CALCULATED'], to: 'CALCULATED', permission: 'hr.payroll.manage', note: 'none', effect: (r) => { const lines = buildPayrollLines(r.period); return lines.length ? { patch: { lines, calculatedAt: new Date().toISOString() } } : { ok: false, error: 'No active salary structures to calculate.' } } },
    { id: 'approve', label: 'Approve', from: ['CALCULATED'], to: 'APPROVED', permission: 'hr.payroll.approve', noSelf: true },
    { id: 'pay', label: 'Mark paid (demo)', from: ['APPROVED'], to: 'PAID_DEMO', permission: 'hr.payroll.manage', description: 'Marks the run as paid in the prototype only. No WPS / bank file is produced or sent.' },
    { id: 'cancel', label: 'Cancel', from: ['DRAFT', 'CALCULATED'], to: 'CANCELLED', permission: 'hr.payroll.manage', note: 'required', tone: 'secondary' },
  ],
}

export const OPERATIONS_MODULES = [reschedules, routePlans, exceptions, maintenance, fuelLogs, driverExpenses, customerPayments, creditNotes, expenses, bankAccounts, vouchers, cashClosings, employees, jobRequisitions, candidates, attendance, leaveRequests, salaryStructures, payroll]
