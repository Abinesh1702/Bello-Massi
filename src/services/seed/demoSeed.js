/**
 * Pure builders for the demo dataset. No storage access here — storageService
 * calls these when seeding and demoDataService reads the result.
 * Data is deterministic (seeded PRNG) but dated relative to the seeding moment.
 */
import dayjs from 'dayjs'
import { ENTERPRISE_DEMO_CREDENTIALS } from './enterpriseSeed'
import { ROLES } from '../../config/roles'
/**
 * The seed generates orders with the Phase 1 status vocabulary (PENDING_APPROVAL, WITH_CS);
 * seed/orderSeed.js converts them to the Phase 3 workflow. Kept local so the seed stays stable.
 */
const S = {
  DRAFT: 'DRAFT', PENDING_APPROVAL: 'PENDING_APPROVAL', RETURNED: 'RETURNED', REJECTED: 'REJECTED', APPROVED: 'APPROVED',
  WITH_CS: 'WITH_CS', READY_FOR_DISPATCH: 'READY_FOR_DISPATCH', PLANNED: 'PLANNED', OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED', DELIVERY_PROBLEM: 'DELIVERY_PROBLEM',
}
import { demoHash, seededRandom } from '../../utils/helpers'
import { buildCatalogue, PHASE1_PRODUCT_IDS } from './masterDataSeed'
import { formatCurrency } from '../../utils/formatters'

/**
 * Public demo credentials (shown on the login screen). Only demo hashes are written to storage.
 * PROTOTYPE ONLY — these are published demo accounts, not secure credentials.
 * Existing Phase 1–6 accounts keep their ids, emails and passwords.
 */
export const DEMO_CREDENTIALS = [
  { id: 'u-superadmin', email: 'superadmin@bellomassi.demo', username: 'superadmin', password: 'Super@123', role: ROLES.SUPER_ADMIN, name: 'Omar Al Mansoori', title: 'Group IT Director', color: '#0F172A', phone: '+971 50 120 4401', hubId: null, department: 'dep-admin', designation: 'des-it-director', employeeId: 'EMP-0001' },
  { id: 'u-admin', email: 'admin@bellomassi.demo', username: 'admin', password: 'Admin@123', role: ROLES.ADMIN, name: 'Arjun Mehta', title: 'System Administrator', color: '#232B5F', phone: '+91 98400 11201', hubId: 'hub-che', department: 'dep-admin', designation: 'des-sysadmin', employeeId: 'EMP-0002' },
  { id: 'u-salesman', email: 'salesman@bellomassi.demo', username: 'salesman', password: 'Sales@123', role: ROLES.SALESMAN, name: 'Karthik Raman', title: 'Field Sales Executive', color: '#0E7490', phone: '+91 98400 11202', hubId: 'hub-che', department: 'dep-sales', designation: 'des-sales-exec', employeeId: 'EMP-0003' },
  { id: 'u-manager', email: 'manager@bellomassi.demo', username: 'manager', password: 'Manager@123', role: ROLES.SALES_MANAGER, name: 'Priya Natarajan', title: 'Sales Manager — South', color: '#7C3AED', phone: '+91 98400 11203', hubId: 'hub-che', department: 'dep-sales', designation: 'des-sales-manager', employeeId: 'EMP-0004' },
  { id: 'u-cs', email: 'cs@bellomassi.demo', username: 'cs', password: 'Cs@123', role: ROLES.CUSTOMER_SERVICE, name: 'Divya Srinivasan', title: 'Customer Service Lead', color: '#DB2777', phone: '+91 98400 11204', hubId: 'hub-che', department: 'dep-cs', designation: 'des-cs-lead', employeeId: 'EMP-0005' },
  { id: 'u-dispatcher', email: 'dispatcher@bellomassi.demo', username: 'dispatcher', password: 'Dispatch@123', role: ROLES.DISPATCHER, name: 'Suresh Kumar', title: 'Dispatch Coordinator', color: '#EA580C', phone: '+91 98400 11205', hubId: 'hub-che', department: 'dep-logistics', designation: 'des-dispatch', employeeId: 'EMP-0006' },
  { id: 'u-driver', email: 'driver@bellomassi.demo', username: 'driver', password: 'Driver@123', role: ROLES.DRIVER, name: 'Murugan Selvam', title: 'Delivery Driver', color: '#16A34A', phone: '+91 98400 11206', hubId: 'hub-che', department: 'dep-logistics', designation: 'des-driver', employeeId: 'EMP-0007' },
  { id: 'u-finance', email: 'finance@bellomassi.demo', username: 'finance', password: 'Finance@123', role: ROLES.FINANCE, name: 'Anitha Rao', title: 'Finance Executive', color: '#B45309', phone: '+91 98400 11207', hubId: 'hub-che', department: 'dep-finance', designation: 'des-finance-exec', employeeId: 'EMP-0008' },
  { id: 'u-warehouse', email: 'warehouse@bellomassi.demo', username: 'warehouse', password: 'Warehouse@123', role: ROLES.WAREHOUSE_MANAGER, name: 'Ramesh Iyer', title: 'Warehouse Manager — Chennai', color: '#0369A1', phone: '+91 98400 11208', hubId: 'hub-che', department: 'dep-warehouse', designation: 'des-wh-manager', employeeId: 'EMP-0009' },
  { id: 'u-inventory', email: 'inventory@bellomassi.demo', username: 'inventory', password: 'Inventory@123', role: ROLES.INVENTORY_EXECUTIVE, name: 'Naveen Gowda', title: 'Inventory Executive — Bengaluru', color: '#4D7C0F', phone: '+91 98450 11209', hubId: 'hub-blr', department: 'dep-warehouse', designation: 'des-inv-exec', employeeId: 'EMP-0010' },
  { id: 'u-qa', email: 'qa@bellomassi.demo', username: 'qa', password: 'Quality@123', role: ROLES.QA_MANAGER, name: 'Fatima Sheikh', title: 'QA & Cold Chain Manager', color: '#9F1239', phone: '+971 55 310 2210', hubId: 'hub-che', department: 'dep-qa', designation: 'des-qa-manager', employeeId: 'EMP-0011' },
  { id: 'u-customer', email: 'customer@bellomassi.demo', username: 'customer', password: 'Customer@123', role: ROLES.CUSTOMER, name: 'Joseph Daniel', title: 'F&B Manager, Marina Hotels', color: '#155E75', phone: '+91 98410 22310', hubId: 'hub-che', department: 'dep-external', designation: 'des-portal', employeeId: 'EXT-0001', customerId: 'c-010' },
  { id: 'u-supplier', email: 'supplier@bellomassi.demo', username: 'supplier', password: 'Supplier@123', role: ROLES.SUPPLIER, name: 'Hassan Rahman', title: 'Key Account Manager, Coastal Frozen Foods', color: '#6D28D9', phone: '+971 52 440 1188', hubId: null, department: 'dep-external', designation: 'des-portal', employeeId: 'EXT-0002', supplierId: 'sup-01' },
]

// Enterprise expansion (data v9): CEO, operations, HORECA, van sales, procurement, import, warehouse, QA, fleet,
// finance manager, accountant and HR demo accounts. Appended so existing accounts keep their order and ids.
DEMO_CREDENTIALS.push(...ENTERPRISE_DEMO_CREDENTIALS)


export const buildDemoUser = (c, i, now = dayjs()) => ({
  id: c.id,
  employeeId: c.employeeId,
  name: c.name,
  email: c.email,
  username: c.username,
  role: c.role,
  additionalRoles: [],
  title: c.title,
  phone: c.phone,
  department: c.department,
  designation: c.designation,
  avatarColor: c.color,
  avatarImage: null,
  hubId: c.hubId,
  customerId: c.customerId || null,
  supplierId: c.supplierId || null,
  status: 'active',
  passwordHash: demoHash(c.password),
  mustChangePassword: false,
  createdAt: now.subtract(130 - i, 'day').toISOString(),
  createdBy: 'system',
  lastLoginAt: null,
})

export const buildDemoUsers = (now = dayjs()) => DEMO_CREDENTIALS.map((c, i) => buildDemoUser(c, i, now))

const ZONES = [
  { id: 'z-che-a', name: 'Zone A — Chennai North', hubId: 'hub-che' },
  { id: 'z-che-b', name: 'Zone B — Chennai South', hubId: 'hub-che' },
  { id: 'z-che-c', name: 'Zone C — Chennai West', hubId: 'hub-che' },
  { id: 'z-cbe-a', name: 'Zone A — Coimbatore City', hubId: 'hub-cbe' },
  { id: 'z-blr-a', name: 'Zone A — Bengaluru North', hubId: 'hub-blr' },
  { id: 'z-blr-b', name: 'Zone B — Bengaluru South', hubId: 'hub-blr' },
  { id: 'z-mdu-a', name: 'Zone A — Madurai City', hubId: 'hub-mdu' },
  { id: 'z-hyd-a', name: 'Zone A — Hyderabad East', hubId: 'hub-hyd' },
]

const SALES_REPS = [
  { id: 'u-salesman', name: 'Karthik Raman', userId: 'u-salesman', hubId: 'hub-che' },
  { id: 'sr-vignesh', name: 'Vignesh Babu', userId: null, hubId: 'hub-che' },
  { id: 'sr-meena', name: 'Meena Krishnan', userId: null, hubId: 'hub-blr' },
]

const DRIVERS = [
  { id: 'drv-01', name: 'Murugan Selvam', userId: 'u-driver', phone: '+91 98400 11206', licenseNo: 'TN01 2016 0045821', vehicleNo: 'TN 01 BX 4521', vehicleType: 'Reefer truck · 3 T', hubId: 'hub-che', status: 'on_route' },
  { id: 'drv-02', name: 'Prakash Arumugam', userId: null, phone: '+91 98400 33102', licenseNo: 'TN02 2014 0033190', vehicleNo: 'TN 02 CK 7788', vehicleType: 'Reefer truck · 3 T', hubId: 'hub-che', status: 'on_route' },
  { id: 'drv-03', name: 'Dinesh Kumar', userId: null, phone: '+91 98400 33103', licenseNo: 'TN09 2018 0071234', vehicleNo: 'TN 09 AZ 1203', vehicleType: 'Reefer van · 1.5 T', hubId: 'hub-che', status: 'available' },
  { id: 'drv-04', name: 'Rajendran Pillai', userId: null, phone: '+91 98420 33104', licenseNo: 'TN37 2015 0022817', vehicleNo: 'TN 37 DM 3390', vehicleType: 'Reefer truck · 3 T', hubId: 'hub-cbe', status: 'available' },
  { id: 'drv-05', name: 'Manjunath Gowda', userId: null, phone: '+91 98450 33105', licenseNo: 'KA04 2017 0098812', vehicleNo: 'KA 04 MK 5521', vehicleType: 'Reefer truck · 5 T', hubId: 'hub-blr', status: 'on_route' },
  { id: 'drv-06', name: 'Ravi Teja', userId: null, phone: '+91 98490 33106', licenseNo: 'TS07 2019 0011456', vehicleNo: 'TS 07 UB 8812', vehicleType: 'Reefer van · 1.5 T', hubId: 'hub-hyd', status: 'available' },
  { id: 'drv-07', name: 'Pandiyan Raj', userId: null, phone: '+91 98430 33107', licenseNo: 'TN59 2013 0067331', vehicleNo: 'TN 59 BQ 2210', vehicleType: 'Reefer van · 1.5 T', hubId: 'hub-mdu', status: 'off_duty' },
  { id: 'drv-08', name: 'Syed Ameer', userId: null, phone: '+91 98450 33108', licenseNo: 'KA01 2020 0054410', vehicleNo: 'KA 01 HN 6604', vehicleType: 'Reefer truck · 3 T', hubId: 'hub-blr', status: 'available' },
]

const DRIVER_BY_HUB = {
  'hub-che': ['drv-01', 'drv-02', 'drv-03'],
  'hub-cbe': ['drv-04'],
  'hub-blr': ['drv-05', 'drv-08'],
  'hub-mdu': ['drv-07'],
  'hub-hyd': ['drv-06'],
}

/**
 * Order plan: [status, customerId, daysAgoCreated, driverOverride?, deliveryOffsetDays?]
 * Tuned so every role's dashboard has meaningful numbers.
 */
const ORDER_PLAN = [
  [S.DELIVERED, 'c-001', 13], [S.DELIVERED, 'c-004', 13], [S.DELIVERED, 'c-002', 12],
  [S.DELIVERED, 'c-006', 11], [S.DELIVERED, 'c-010', 10], [S.DELIVERED, 'c-005', 10],
  [S.DELIVERED, 'c-003', 9], [S.DELIVERED, 'c-008', 8], [S.DELIVERED, 'c-001', 7],
  [S.DELIVERED, 'c-007', 7], [S.DELIVERED, 'c-004', 6], [S.DELIVERED, 'c-002', 5],
  [S.DELIVERED, 'c-010', 4], [S.DELIVERED, 'c-005', 4], [S.DELIVERED, 'c-008', 3],
  [S.DELIVERED, 'c-001', 1, 'drv-01', 1], [S.DELIVERED, 'c-010', 1, 'drv-01', 1],
  [S.DELIVERY_PROBLEM, 'c-003', 2],
  [S.OUT_FOR_DELIVERY, 'c-002', 1, 'drv-01', 1], [S.OUT_FOR_DELIVERY, 'c-004', 1, 'drv-05', 1],
  [S.PLANNED, 'c-010', 1, 'drv-01', 1], [S.PLANNED, 'c-001', 1, 'drv-01', 2], [S.PLANNED, 'c-006', 1, 'drv-04', 2],
  [S.READY_FOR_DISPATCH, 'c-002', 1], [S.READY_FOR_DISPATCH, 'c-008', 1], [S.READY_FOR_DISPATCH, 'c-005', 2],
  [S.WITH_CS, 'c-001', 1], [S.WITH_CS, 'c-007', 1], [S.WITH_CS, 'c-004', 0],
  [S.APPROVED, 'c-010', 0], [S.APPROVED, 'c-008', 0],
  [S.PENDING_APPROVAL, 'c-001', 0], [S.PENDING_APPROVAL, 'c-002', 0], [S.PENDING_APPROVAL, 'c-010', 0], [S.PENDING_APPROVAL, 'c-005', 1],
  [S.RETURNED, 'c-002', 1], [S.RETURNED, 'c-003', 1],
  [S.REJECTED, 'c-010', 0], [S.REJECTED, 'c-004', 2],
  [S.DRAFT, 'c-001', 0], [S.DRAFT, 'c-002', 0],
]

const FLOW = [S.DRAFT, S.PENDING_APPROVAL, S.APPROVED, S.WITH_CS, S.READY_FOR_DISPATCH, S.PLANNED, S.OUT_FOR_DELIVERY, S.DELIVERED]
const ACTOR_FOR = {
  [S.DRAFT]: 'salesman', [S.PENDING_APPROVAL]: 'salesman', [S.APPROVED]: 'u-manager', [S.RETURNED]: 'u-manager',
  [S.REJECTED]: 'u-manager', [S.WITH_CS]: 'u-cs', [S.READY_FOR_DISPATCH]: 'u-cs', [S.PLANNED]: 'u-dispatcher',
  [S.OUT_FOR_DELIVERY]: 'driver', [S.DELIVERED]: 'driver', [S.DELIVERY_PROBLEM]: 'driver',
}
const NOTE_FOR = {
  [S.RETURNED]: ['Quantity of Mozzarella above usual run-rate — please confirm with customer.', 'Customer near credit limit — reduce order value or collect payment first.'],
  [S.REJECTED]: ['Duplicate of an order already submitted by phone.', 'Credit limit exceeded and outstanding over 60 days.'],
  [S.DELIVERY_PROBLEM]: ['Customer premises closed on arrival — reschedule required.'],
}
const CHANNELS = ['call', 'email', 'whatsapp']

const buildOrders = (now, CUSTOMERS, PRODUCTS) => {
  const rand = seededRandom(20261110)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const customers = Object.fromEntries(CUSTOMERS.map((c) => [c.id, c]))
  const notesUsed = {}

  return ORDER_PLAN.map(([status, customerId, daysAgo, driverOverride, deliveryOffset], index) => {
    const customer = customers[customerId]
    const created = now
      .subtract(daysAgo, 'day')
      .hour(daysAgo === 0 ? Math.max(8, now.hour() - 1 - (index % 5)) : 9 + Math.floor(rand() * 8))
      .minute(Math.floor(rand() * 60))
      .second(0)
    const createdAt = created.isAfter(now) ? now.subtract(15 + index, 'minute') : created

    // 2–5 line items
    const lineCount = 2 + Math.floor(rand() * 4)
    const productPool = [...PRODUCTS].sort(() => rand() - 0.5).slice(0, lineCount)
    const items = productPool.map((p) => ({
      productId: p.id,
      quantity: 5 + Math.floor(rand() * 36),
      unitPrice: p.sellingPrice,
    }))
    const totalValue = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
    const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0)

    const salesmanId = customer.salesRepId
    const hubDrivers = DRIVER_BY_HUB[customer.hubId]
    const needsDriver = [S.PLANNED, S.OUT_FOR_DELIVERY, S.DELIVERED, S.DELIVERY_PROBLEM].includes(status)
    const driverId = needsDriver ? driverOverride || pick(hubDrivers) : null
    const driverUser = DRIVERS.find((d) => d.id === driverId)?.userId || driverId

    // Build a consistent history up to the current status
    let path
    if (status === S.RETURNED || status === S.REJECTED) path = [S.DRAFT, S.PENDING_APPROVAL, status]
    else if (status === S.DELIVERY_PROBLEM) path = [...FLOW.slice(0, 7), status]
    else path = FLOW.slice(0, FLOW.indexOf(status) + 1)

    // Delivery date and the time the order reached its current status
    const deliveryDate = needsDriver
      ? createdAt.add(deliveryOffset || 1 + (index % 2), 'day').startOf('day')
      : null
    const clamp = (t, minsAgo) => (t.isAfter(now) ? now.subtract(minsAgo, 'minute') : t)
    let endAt
    if (status === S.DELIVERED) {
      const late = !deliveryOffset && index % 6 === 4
      endAt = clamp(deliveryDate.add(late ? 1 : 0, 'day').hour(10 + (index % 6)).minute(Math.floor(rand() * 60)), 25 + index * 2)
    } else if (status === S.OUT_FOR_DELIVERY || status === S.DELIVERY_PROBLEM) {
      endAt = clamp(deliveryDate.hour(9 + (index % 3)).minute(15), 30 + index)
    } else {
      endAt = clamp(createdAt.add(path.length * 80, 'minute'), 8 + index)
    }
    if (!endAt.isAfter(createdAt)) endAt = createdAt.add(Math.min(5, Math.max(1, now.diff(createdAt, 'minute'))), 'minute')

    const steps = Math.max(1, path.length - 1)
    const history = path.map((st, i) => {
      const actor = ACTOR_FOR[st]
      const byUserId = actor === 'salesman' ? salesmanId : actor === 'driver' ? driverUser : actor
      const at = i === 0 ? createdAt : createdAt.add(Math.round((endAt.diff(createdAt, 'minute') * i) / steps), 'minute')
      let note = null
      if (NOTE_FOR[st]) {
        notesUsed[st] = (notesUsed[st] || 0) + 1
        note = NOTE_FOR[st][(notesUsed[st] - 1) % NOTE_FOR[st].length]
      }
      return { status: st, at: at.toISOString(), byUserId, note }
    })
    const last = history[history.length - 1]
    const safeDeliveredAt = status === S.DELIVERED ? last.at : null

    const approval = history.find((h) => h.status === S.APPROVED)
    return {
      id: `ORD-2026-${1001 + index}`,
      customerId,
      salesmanId,
      hubId: customer.hubId,
      zoneId: customer.zoneId,
      channel: CHANNELS[index % 3],
      items,
      totalValue,
      totalQuantity,
      status,
      createdAt: createdAt.toISOString(),
      updatedAt: last.at,
      deliveryDate: deliveryDate ? deliveryDate.toISOString() : null,
      deliveredAt: safeDeliveredAt,
      onTime: safeDeliveredAt ? !dayjs(safeDeliveredAt).isAfter(dayjs(deliveryDate).endOf('day')) : null,
      driverId,
      approvedBy: approval ? approval.byUserId : null,
      approvedAt: approval ? approval.at : null,
      creditExceeded: customer.creditEnabled && customer.creditBalance + totalValue > customer.creditLimit,
      reason: last.note,
      history,
    }
  })
}

/**
 * Operational data (zones, sales reps, drivers, orders). Customers/products/hubs and stock
 * live in their own storage keys from Phase 2 (see masterDataSeed.js).
 */
export const buildDemoData = (now = dayjs(), catalogue = buildCatalogue(now)) => ({
  zones: ZONES,
  salesReps: SALES_REPS,
  drivers: DRIVERS,
  orders: buildOrders(now, catalogue.customers, catalogue.products.filter((p) => PHASE1_PRODUCT_IDS.includes(p.id))),
  seededAt: now.toISOString(),
})

const ACTIVITY_VERB = {
  DRAFT_CREATED: 'saved a draft for', SUBMITTED: 'submitted', APPROVED: 'approved', RETURNED: 'returned for correction',
  REJECTED: 'rejected', CONSOLIDATED: 'consolidated', READY_FOR_DISPATCH: 'marked ready for dispatch', PLANNED: 'planned in zone',
  OUT_FOR_DELIVERY: 'started delivery of', DELIVERED: 'confirmed OTP delivery of', DELIVERY_PROBLEM: 'reported a delivery problem on',
}

/** Recent activity derived from the order timeline so it always matches the order data. */
export const buildActivities = ({ timeline, orders, seededAt }) => {
  const byId = Object.fromEntries(orders.map((o) => [o.id, o]))
  const events = [...timeline]
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 14)
    .map((t) => ({
      id: `act-${t.id}`,
      type: t.eventType,
      actorId: t.userId,
      actorName: t.userName,
      message: `${ACTIVITY_VERB[t.eventType] || t.title.toLowerCase()} ${t.orderNumber || 'a draft order'} · ${byId[t.orderId]?.customerName || ''}`,
      entityType: 'order',
      entityId: t.orderId,
      createdAt: t.timestamp,
    }))
  return [
    {
      id: 'act-system-init', type: 'SYSTEM', actorId: null, actorName: 'System',
      message: 'initialised the demo environment with sample data', entityType: 'system', entityId: null,
      createdAt: seededAt,
    },
    ...events,
  ]
}

export const buildNotifications = (now = dayjs(), { lowStockCount = 0 } = {}) => {
  const at = (mins) => now.subtract(mins, 'minute').toISOString()
  return [
    { id: 'n-welcome', title: 'Welcome to Bellomassi', message: 'Your order-to-delivery workspace is ready. Explore your dashboard to get started.', type: 'info', roles: null, link: '/dashboard', createdAt: at(1), readBy: [] },
    { id: 'n-init', title: 'Demo environment initialised', message: 'Demo users, customers, products, hubs and drivers have been created in this browser.', type: 'success', roles: null, link: '/settings', createdAt: at(2), readBy: [] },
    { id: 'n-orders', title: 'Sample order data loaded', message: '41 sample orders across the full lifecycle are available — drafts, approvals, consolidation and delivery.', type: 'info', roles: null, link: '/dashboard', createdAt: at(3), readBy: [] },
    { id: 'n-phase1', title: 'Dispatch & delivery is live', message: 'Plan dispatches, assign drivers and vehicles, confirm stock out of the hub and track OTP-confirmed deliveries (OTP is simulated).', type: 'success', roles: null, link: '/settings', createdAt: at(4), readBy: [] },
    { id: 'n-approvals', title: '4 orders awaiting approval', message: 'Orders from ABC Enterprises, Chennai Industrial Supplies and 2 others need your decision.', type: 'warning', roles: [ROLES.SALES_MANAGER], link: '/orders/approval', createdAt: at(20), readBy: [] },
    { id: 'n-returned', title: 'Order returned for review', message: 'BM-ORD-2026-00036 was returned by Priya Natarajan with a reason. Amend and resubmit.', type: 'warning', roles: [ROLES.SALESMAN], link: '/orders/returned', createdAt: at(95), readBy: [] },
    { id: 'n-cs', title: '2 orders awaiting consolidation', message: 'Approved orders are waiting in the consolidation queue.', type: 'info', roles: [ROLES.CUSTOMER_SERVICE], link: '/orders/consolidation', createdAt: at(30), readBy: [] },
    { id: 'n-dispatch', title: 'Orders ready for dispatch', message: 'Customer Service released orders for zone planning. One dispatch for tomorrow still needs a driver.', type: 'info', roles: [ROLES.DISPATCHER], link: '/dispatch/ready-orders', createdAt: at(45), readBy: [] },
    { id: 'n-driver', title: "Today's dispatch is on the road", message: 'Your Chennai North route is in transit. Open your delivery plan for the next stop.', type: 'info', roles: [ROLES.DRIVER], link: '/driver/dashboard', createdAt: at(60), readBy: [] },
    ...(lowStockCount ? [{ id: 'n-lowstock', title: `${lowStockCount} stock lines need replenishment`, message: 'Low and out-of-stock items were found across hubs. Review them and raise stock receipts or transfers.', type: 'warning', roles: [ROLES.ADMIN, ROLES.DISPATCHER, ROLES.SALES_MANAGER, ROLES.CUSTOMER_SERVICE], link: '/inventory/low-stock', createdAt: at(10), readBy: [] }] : []),
    { id: 'n-credit', title: 'Credit limit exceeded', message: `Metro Wholesale is over its credit limit by ${formatCurrency(68000)}. Approval was flagged.`, type: 'danger', roles: [ROLES.FINANCE, ROLES.ADMIN], link: '/customers/credit', createdAt: at(75), readBy: [] },
  ]
}

export const DEFAULT_SETTINGS = {
  sidebarCollapsed: false,
  sidebarStartCollapsed: false,
  sidebarAutoCloseMobile: true,
  dashboardRangeDays: 14,
}

export const DEFAULT_THEME = 'light'
