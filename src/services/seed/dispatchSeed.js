/**
 * Phase 4 seed + migration: turns the Phase 1–3 operational data (zones and drivers inside
 * bellomassi_demo_data, orders already planned / out for delivery / delivered) into the dispatch
 * model — zones, drivers, vehicles, dispatches, deliveries, OTPs, delivery notes and the dispatch
 * timeline. Pure: used for fresh seeding and for upgrading version-3 browser data and backups.
 */
import dayjs from 'dayjs'
import { seededRandom } from '../../utils/helpers'
import { deductDispatchStock, mergeMovements } from '../../utils/dispatchStock'
import { DISPATCH_EVENTS } from '../../config/dispatchConfig'
import { getNumberingPrefix } from '../../config/runtimeConfig'

const pad = (n, w) => String(n).padStart(w, '0')
export const formatDispatchNumber = (year, n) => `${getNumberingPrefix('dispatch')}-${year}-${pad(n, 5)}`
export const formatDeliveryNoteNumber = (year, n) => `${getNumberingPrefix('deliveryNote')}-${year}-${pad(n, 5)}`

const ZONE_DETAILS = {
  'z-che-a': { code: 'ZN-CHE-N', name: 'Chennai North', manager: 'Senthil Kumar', city: 'Chennai', state: 'Tamil Nadu', pincodes: ['600001', '600004', '600011', '600012', '600021', '600081'], area: 'Parrys, Mylapore, Perambur, Tondiarpet', description: 'North and central-north Chennai — hotels, caterers and wholesale markets.' },
  'z-che-b': { code: 'ZN-CHE-S', name: 'Chennai South', manager: 'Senthil Kumar', city: 'Chennai', state: 'Tamil Nadu', pincodes: ['600018', '600020', '600041', '600042', '600096'], area: 'Teynampet, Adyar, Thiruvanmiyur, Velachery, Perungudi', description: 'South Chennai and the OMR corridor.' },
  'z-che-c': { code: 'ZN-CHE-C', name: 'Chennai Central', manager: 'Senthil Kumar', city: 'Chennai', state: 'Tamil Nadu', pincodes: ['600017', '600024', '600026', '600032', '600083'], area: 'T. Nagar, Kodambakkam, Vadapalani, Guindy, Ashok Nagar', description: 'Central Chennai and the Guindy industrial estate.' },
  'z-cbe-a': { code: 'ZN-CBE', name: 'Coimbatore', manager: 'Karthikeyan R', city: 'Coimbatore', state: 'Tamil Nadu', pincodes: ['641002', '641004', '641012', '641018', '641035'], area: 'RS Puram, Peelamedu, Gandhipuram, Race Course, Saravanampatti', description: 'Coimbatore city routes from the Coimbatore hub.' },
  'z-blr-a': { code: 'ZN-BLR-N', name: 'Bangalore North', manager: 'Shivakumar B', city: 'Bengaluru', state: 'Karnataka', pincodes: ['560003', '560010', '560022', '560024', '560055'], area: 'Malleswaram, Rajajinagar, Yeshwanthpur, Hebbal', description: 'North Bengaluru including the Yeshwanthpur wholesale belt.' },
  'z-blr-b': { code: 'ZN-BLR-S', name: 'Bangalore South', manager: 'Shivakumar B', city: 'Bengaluru', state: 'Karnataka', pincodes: ['560034', '560041', '560068', '560076', '560095'], area: 'Koramangala, Jayanagar, BTM Layout, HSR Layout', description: 'South Bengaluru restaurants and modern trade.' },
  'z-mdu-a': { code: 'ZN-MDU', name: 'Madurai', manager: 'Murali Pandian', city: 'Madurai', state: 'Tamil Nadu', pincodes: ['625001', '625002', '625010', '625020'], area: 'Town Hall Road, Masi Streets, Anna Nagar, KK Nagar', description: 'Madurai city routes.' },
  'z-hyd-a': { code: 'ZN-HYD', name: 'Hyderabad', manager: 'Venkat Rao', city: 'Hyderabad', state: 'Telangana', pincodes: ['500003', '500016', '500034', '500039', '500081'], area: 'Uppal, Banjara Hills, Begumpet, Secunderabad, Madhapur', description: 'Hyderabad and Secunderabad routes.' },
}

const DRIVER_DETAILS = {
  'drv-01': { zoneId: 'z-che-a', licenseYears: 3, address: '12 Kamaraj Street, Perambur, Chennai 600011' },
  'drv-02': { zoneId: 'z-che-b', licenseYears: 2, address: '4/7 Bharathi Nagar, Velachery, Chennai 600042' },
  'drv-03': { zoneId: 'z-che-c', licenseYears: 4, address: '22 Arcot Road, Vadapalani, Chennai 600026' },
  'drv-04': { zoneId: 'z-cbe-a', licenseYears: 1, address: '9 Sathy Road, Gandhipuram, Coimbatore 641012' },
  'drv-05': { zoneId: 'z-blr-a', licenseYears: 2, address: '31 8th Cross, Malleswaram, Bengaluru 560003' },
  'drv-06': { zoneId: 'z-hyd-a', licenseDays: -1, address: '5-2-14 Uppal Main Road, Hyderabad 500039', notes: 'Licence expired — renewal submitted to RTO. Cannot be assigned until updated.' },
  'drv-07': { zoneId: 'z-mdu-a', licenseDays: 18, address: '17 North Veli Street, Madurai 625001', notes: 'Off duty this week.' },
  'drv-08': { zoneId: 'z-blr-b', licenseYears: 3, address: '64 1st Main, BTM Layout, Bengaluru 560076' },
}

const VEHICLE_FROM_TYPE = (label = '') => {
  if (/5 T/.test(label)) return { type: 'Truck', model: 'Eicher Pro 2075 Reefer', capacity: 900 }
  if (/truck/i.test(label)) return { type: 'Truck', model: 'Tata LPT 709 Reefer', capacity: 600 }
  if (/van/i.test(label)) return { type: 'Van', model: 'Ashok Leyland Dost Reefer', capacity: 300 }
  return { type: 'Other', model: label || 'Vehicle', capacity: 200 }
}

const EXTRA_VEHICLES = [
  { id: 'veh-09', vehicleNumber: 'TN 10 MV 9091', type: 'Mini Truck', model: 'Mahindra Furio 7 Reefer', capacity: 450, hubId: 'hub-che', status: 'Available', notes: 'Pool vehicle — no default driver.' },
  { id: 'veh-10', vehicleNumber: 'TN 01 RX 3344', type: 'Van', model: 'Tata Ace Gold Reefer', capacity: 250, hubId: 'hub-che', status: 'Maintenance', notes: 'Refrigeration unit service — back in 3 days.' },
  { id: 'veh-11', vehicleNumber: 'TN 22 BK 0077', type: 'Bike', model: 'TVS XL100 with cool box', capacity: 40, hubId: 'hub-che', status: 'Inactive', notes: 'Retired from service.' },
]

const LEGACY_DELIVERY = ['PLANNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_PROBLEM']
const RESERVED_STATUSES = ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH', 'PLANNED']

export const buildZones = (legacyZones = [], hubs = [], now = dayjs()) =>
  legacyZones.map((z) => {
    const d = ZONE_DETAILS[z.id] || {}
    const hub = hubs.find((h) => h.id === z.hubId) || {}
    return {
      id: z.id,
      code: d.code || `ZN-${String(z.id).toUpperCase().slice(-5)}`,
      name: d.name || z.name,
      description: d.description || '',
      managerName: d.manager || hub.managerName || '',
      hubId: z.hubId,
      status: 'Active',
      city: d.city || hub.city || '',
      state: d.state || hub.state || '',
      pincodes: d.pincodes || [],
      deliveryArea: d.area || '',
      notes: '',
      createdAt: now.subtract(200, 'day').toISOString(),
      updatedAt: now.subtract(30, 'day').toISOString(),
    }
  })

export const buildFleet = (legacyDrivers = [], now = dayjs()) => {
  const vehicles = []
  const drivers = legacyDrivers.map((d, i) => {
    const det = DRIVER_DETAILS[d.id] || {}
    const vId = `veh-${pad(i + 1, 2)}`
    const v = VEHICLE_FROM_TYPE(d.vehicleType)
    if (d.vehicleNo) {
      vehicles.push({ id: vId, vehicleNumber: d.vehicleNo, type: v.type, model: v.model, capacity: v.capacity, capacityUnit: 'Units', hubId: d.hubId, status: 'Available', notes: d.vehicleType || '', createdAt: now.subtract(300, 'day').toISOString(), updatedAt: now.subtract(20, 'day').toISOString() })
    }
    const expiry = det.licenseDays !== undefined ? now.add(det.licenseDays, 'day') : now.add(det.licenseYears || 2, 'year').subtract(i * 23, 'day')
    const first = d.name.split(' ')[0].toLowerCase()
    return {
      id: d.id,
      code: `DRV-${pad(i + 1, 3)}`,
      name: d.name,
      employeeNumber: `EMP-D${1040 + i}`,
      mobile: d.phone || '',
      email: `${first}.driver@bellomassi.demo`,
      hubId: d.hubId,
      zoneId: det.zoneId || '',
      licenseNumber: d.licenseNo || '',
      licenseExpiry: expiry.format('YYYY-MM-DD'),
      status: 'Active',
      availability: d.status === 'off_duty' ? 'Offline' : 'Available',
      vehicleId: d.vehicleNo ? vId : null,
      address: det.address || '',
      notes: det.notes || '',
      userId: d.userId || null,
      createdAt: now.subtract(400 - i * 10, 'day').toISOString(),
      updatedAt: now.subtract(15, 'day').toISOString(),
    }
  })
  EXTRA_VEHICLES.forEach((x) => vehicles.push({ ...x, capacityUnit: 'Units', createdAt: now.subtract(250, 'day').toISOString(), updatedAt: now.subtract(3, 'day').toISOString() }))
  return { drivers, vehicles }
}

/** Driver / vehicle status that follows from their active dispatches (manual Offline / Maintenance / Inactive kept). */
export const deriveDriverAvailability = (driver, dispatches) => {
  const mine = dispatches.filter((d) => d.driverId === driver.id && ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'].includes(d.status))
  if (mine.some((d) => d.status === 'IN_TRANSIT')) return 'On Delivery'
  if (mine.length) return 'Assigned'
  if (driver.status !== 'Active') return 'Offline'
  return driver.availability === 'Offline' ? 'Offline' : 'Available'
}
export const deriveVehicleStatus = (vehicle, dispatches) => {
  if (['Maintenance', 'Inactive'].includes(vehicle.status)) return vehicle.status
  const mine = dispatches.filter((d) => d.vehicleId === vehicle.id && ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'].includes(d.status))
  if (mine.some((d) => d.status === 'IN_TRANSIT')) return 'In Transit'
  return mine.length ? 'Assigned' : 'Available'
}

/**
 * Build the whole dispatch model from a data snapshot.
 * input: { orders, orderTimeline, customers, products, hubs, users, legacyZones, legacyDrivers, inventory, movements, seededAt, now }
 */
export const buildDispatchData = (input) => {
  const now = input.now || dayjs()
  const rand = seededRandom(4044)
  const today = now.format('YYYY-MM-DD')
  const zones = buildZones(input.legacyZones, input.hubs, now)
  const { drivers, vehicles } = buildFleet(input.legacyDrivers, now)
  const D = Object.fromEntries(drivers.map((d) => [d.id, d]))
  const V = Object.fromEntries(vehicles.map((v) => [v.id, v]))
  const H = Object.fromEntries((input.hubs || []).map((h) => [h.id, h]))
  const C = Object.fromEntries((input.customers || []).map((c) => [c.id, c]))
  const people = Object.fromEntries([...(input.users || []), ...drivers].map((u) => [u.id, u.name]))
  const nameOf = (id) => people[id] || 'System'
  const dispatcherId = (input.users || []).find((u) => u.role === 'DISPATCHER')?.id || 'u-dispatcher'
  const seededAt = input.seededAt || now.toISOString()

  // Seeded reservations (Phase 2 inventory) belong to orders approved before the demo was seeded
  let orders = (input.orders || []).map((o) => ({
    ...o,
    stockReserved: o.stockReserved ?? Boolean(RESERVED_STATUSES.includes(o.orderStatus) && o.approvedAt && o.approvedAt <= seededAt && /^ord-\d{4}$/.test(o.id)),
  }))
  const tl = input.orderTimeline || []
  const at = (orderId, type) => tl.filter((e) => e.orderId === orderId && e.eventType === type).map((e) => e.timestamp).sort().slice(-1)[0] || null
  const remarkOf = (orderId, type) => tl.filter((e) => e.orderId === orderId && e.eventType === type).slice(-1)[0]?.remarks || ''

  // Group legacy delivery-stage orders by driver and delivery day
  const groups = {}
  orders.filter((o) => LEGACY_DELIVERY.includes(o.orderStatus) && o.driverId).forEach((o) => {
    const day = dayjs(o.deliveryDate || o.requestedDeliveryDate).format('YYYY-MM-DD')
    const key = `${o.driverId}|${day}`
    ;(groups[key] ||= { driverId: o.driverId, day, orders: [] }).orders.push(o)
  })

  const dispatches = []
  const deliveries = []
  const otps = []
  const notes = []
  const timeline = []
  let inventory = input.inventory || []
  let movements = input.movements || []
  const busy = new Set()
  const orderPatch = {}
  const ev = (dispatch, type, ts, { orderId = null, deliveryId = null, userId = dispatcherId, remarks = '', description } = {}) => timeline.push({
    id: `dtl-${timeline.length + 1}`, dispatchId: dispatch.id, dispatchNumber: dispatch.dispatchNumber, orderId, deliveryId, eventType: type,
    title: DISPATCH_EVENTS[type], description: description || DISPATCH_EVENTS[type], userId, userName: nameOf(userId), timestamp: ts, remarks,
  })

  const ordered = Object.values(groups).sort((a, b) => {
    const s = (g) => Math.min(...g.orders.map((o) => +new Date(at(o.id, 'PLANNED') || o.readyForDispatchAt || o.createdAt)))
    return s(a) - s(b)
  })
  // Active work first claims drivers: in-transit groups before future plans
  const live = (g) => g.orders.some((o) => o.orderStatus !== 'PLANNED')
  ;[...ordered.filter(live), ...ordered.filter((g) => !live(g))].forEach((g) => {
    const dsOrders = g.orders
    const allPlanned = !live(g)
    const terminal = (o) => ['DELIVERED', 'DELIVERY_PROBLEM'].includes(o.orderStatus)
    let status
    if (!allPlanned) status = dsOrders.every(terminal) ? (dsOrders.every((o) => o.orderStatus === 'DELIVERED') ? 'COMPLETED' : 'PARTIALLY_DELIVERED') : 'IN_TRANSIT'
    else if (busy.has(g.driverId)) status = 'PLANNED'
    else status = g.day > today ? 'ASSIGNED' : 'CONFIRMED'
    if (['IN_TRANSIT', 'ASSIGNED', 'CONFIRMED'].includes(status)) busy.add(g.driverId)

    const driver = status === 'PLANNED' ? null : D[g.driverId]
    const vehicle = driver?.vehicleId ? V[driver.vehicleId] : null
    const first = dsOrders[0]
    const plannedTimes = dsOrders.map((o) => at(o.id, 'PLANNED') || o.readyForDispatchAt || o.createdAt).sort()
    const outTimes = dsOrders.map((o) => at(o.id, 'OUT_FOR_DELIVERY')).filter(Boolean).sort()
    const createdAt = plannedTimes[0]
    const confirmedAt = ['IN_TRANSIT', 'COMPLETED', 'PARTIALLY_DELIVERED', 'CONFIRMED'].includes(status)
      ? (outTimes[0] ? dayjs(outTimes[0]).subtract(45, 'minute') : dayjs(plannedTimes.slice(-1)[0]).add(30, 'minute')).toISOString()
      : null
    const safeConfirmed = confirmedAt && dayjs(confirmedAt).isAfter(now) ? now.subtract(20, 'minute').toISOString() : confirmedAt
    const zoneCounts = {}
    dsOrders.forEach((o) => { zoneCounts[o.zoneId] = (zoneCounts[o.zoneId] || 0) + 1 })
    const zoneId = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    // Stop order: finished stops first (in completion order), then the one on the road, then pending
    const rank = (o) => (o.orderStatus === 'DELIVERED' ? 0 : o.orderStatus === 'DELIVERY_PROBLEM' ? 1 : o.orderStatus === 'OUT_FOR_DELIVERY' ? 2 : 3)
    const stops = [...dsOrders].sort((a, b) => rank(a) - rank(b) || String(at(a.id, 'DELIVERED') || a.createdAt).localeCompare(String(at(b.id, 'DELIVERED') || b.createdAt)))

    const dispatch = {
      id: `dsp-${pad(dispatches.length + 1, 4)}`,
      dispatchNumber: null,
      dispatchDate: g.day,
      hubId: first.hubId,
      zoneId,
      driverId: driver?.id || null,
      driverName: driver?.name || null,
      vehicleId: vehicle?.id || null,
      vehicleNumber: vehicle?.vehicleNumber || null,
      orderIds: stops.map((o) => o.id),
      totalDeliveries: stops.length,
      totalProducts: new Set(stops.flatMap((o) => o.items.map((it) => it.productId))).size,
      totalQuantity: stops.reduce((s, o) => s + o.totalQuantity, 0),
      totalValue: Math.round(stops.reduce((s, o) => s + o.totalAmount, 0) * 100) / 100,
      status,
      notes: status === 'PLANNED' ? 'Driver to be assigned — regular driver is on another route.' : '',
      createdBy: dispatcherId,
      createdAt,
      updatedAt: createdAt,
      assignedAt: driver ? createdAt : null,
      assignedBy: driver ? dispatcherId : null,
      confirmedAt: safeConfirmed,
      confirmedBy: safeConfirmed ? dispatcherId : null,
      startedAt: outTimes[0] || null,
      completedAt: null,
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: '',
      cancelRemarks: '',
      stockDeducted: Boolean(safeConfirmed),
      stockDeductedAt: safeConfirmed,
      stockSnapshot: [],
      stockReversed: false,
      reversalMovementIds: [],
    }
    dispatches.push(dispatch)

    // Stock: seeded-reserved orders still at the hub leave it now (exactly once); earlier stops pre-date the ledger
    if (safeConfirmed) {
      const toDeduct = stops.filter((o) => o.orderStatus === 'PLANNED')
      const prior = stops.filter((o) => o.orderStatus !== 'PLANNED')
      if (toDeduct.length) {
        const res = deductDispatchStock({ inventory, movements, orders: toDeduct, hubId: dispatch.hubId, products: input.products || [], dispatch: { ...dispatch, dispatchNumber: '__DSP__' }, userId: dispatcherId, at: safeConfirmed })
        if (res.ok) {
          inventory = res.inventory
          dispatch.__created = res.created
          dispatch.stockSnapshot.push(...res.snapshot)
          movements = mergeMovements(res.created, movements)
          toDeduct.forEach((o) => { orderPatch[o.id] = { ...(orderPatch[o.id] || {}), stockReserved: false } })
        }
      }
      prior.forEach((o) => o.items.forEach((it) => dispatch.stockSnapshot.push({ orderId: o.id, orderNumber: o.orderNumber, orderItemId: it.id, productId: it.productId, productName: it.productName, unit: it.unit, quantity: it.orderedQuantity, tracked: true, preLedger: true, movementId: null, reservedReleased: 0, previousAvailable: null, newAvailable: null })))
    }

    // Deliveries exist from confirmation onwards
    if (safeConfirmed) {
      stops.forEach((o, i) => {
        const outAt = at(o.id, 'OUT_FOR_DELIVERY')
        const doneAt = at(o.id, 'DELIVERED')
        const failAt = at(o.id, 'DELIVERY_PROBLEM')
        const st = o.orderStatus === 'DELIVERED' ? 'DELIVERED' : o.orderStatus === 'DELIVERY_PROBLEM' ? 'FAILED' : o.orderStatus === 'OUT_FOR_DELIVERY' ? 'OUT_FOR_DELIVERY' : 'DISPATCHED'
        const customer = C[o.customerId] || {}
        const deliveryId = `dlv-${pad(deliveries.length + 1, 4)}`
        const delivered = st === 'DELIVERED'
        const delivery = {
          id: deliveryId,
          dispatchId: dispatch.id,
          dispatchNumber: null,
          orderId: o.id,
          orderNumber: o.orderNumber,
          customerId: o.customerId,
          customerName: o.customerName,
          customerMobile: customer.mobile || '',
          contactPerson: customer.contactPerson || '',
          deliveryAddress: o.deliveryAddress,
          city: o.deliveryCity,
          pincode: o.deliveryPincode,
          instructions: o.deliveryInstructions || '',
          priority: o.orderPriority,
          hubId: o.hubId,
          zoneId: o.zoneId,
          driverId: dispatch.driverId,
          vehicleId: dispatch.vehicleId,
          sequence: i + 1,
          status: st,
          items: o.items.map((it) => ({
            id: `${deliveryId}-${it.id}`, orderItemId: it.id, productId: it.productId, productCode: it.productCode, productName: it.productName, unit: it.unit,
            orderedQuantity: it.orderedQuantity, dispatchedQuantity: it.orderedQuantity,
            deliveredQuantity: delivered ? it.orderedQuantity : 0, damagedQuantity: 0, remainingQuantity: delivered ? 0 : it.orderedQuantity,
          })),
          totalQuantity: o.totalQuantity,
          totalAmount: o.totalAmount,
          attempt: 1,
          startedAt: outAt,
          startedBy: outAt ? dispatch.driverId : null,
          completedAt: delivered ? doneAt : null,
          completedBy: delivered ? dispatch.driverId : null,
          failedAt: st === 'FAILED' ? failAt : null,
          failureReason: st === 'FAILED' ? 'Customer Not Available' : '',
          failureRemarks: st === 'FAILED' ? remarkOf(o.id, 'DELIVERY_PROBLEM') || 'Customer premises closed on arrival.' : '',
          otpStatus: delivered ? 'VERIFIED' : 'NONE',
          otpVerifiedAt: delivered ? doneAt : null,
          receivedBy: delivered ? customer.contactPerson || 'Store manager' : '',
          remarks: delivered ? 'Delivered in good condition.' : '',
          deliveryNoteId: null,
          deliveryNoteNumber: null,
          reviewStatus: st === 'FAILED' ? 'PENDING' : null,
          reviewedAt: null,
          reviewedBy: null,
          reviewRemarks: '',
          returnedToHub: false,
          returnMovementIds: [],
          createdAt: safeConfirmed,
          updatedAt: doneAt || failAt || outAt || safeConfirmed,
        }
        deliveries.push(delivery)
        if (delivered) {
          const gen = dayjs(doneAt).subtract(6, 'minute')
          otps.push({ id: `otp-${pad(otps.length + 1, 4)}`, deliveryId, orderId: o.id, otp: String(100000 + Math.floor(rand() * 900000)), generatedAt: gen.toISOString(), expiresAt: gen.add(10, 'minute').toISOString(), attempts: 1, maxAttempts: 5, verifiedAt: doneAt, status: 'VERIFIED', simulated: true })
        }
        orderPatch[o.id] = {
          ...(orderPatch[o.id] || {}),
          orderStatus: st === 'DELIVERED' ? 'DELIVERED' : st === 'FAILED' ? 'DELIVERY_FAILED' : st === 'OUT_FOR_DELIVERY' ? 'OUT_FOR_DELIVERY' : 'DISPATCHED',
          dispatchId: dispatch.id, deliveryId, driverId: dispatch.driverId, vehicleId: dispatch.vehicleId,
          dispatchedAt: safeConfirmed, outForDeliveryAt: outAt, deliveredAt: delivered ? doneAt : null,
        }
      })
    } else {
      stops.forEach((o) => { orderPatch[o.id] = { ...(orderPatch[o.id] || {}), orderStatus: 'READY_FOR_DISPATCH', dispatchId: dispatch.id, driverId: dispatch.driverId, vehicleId: dispatch.vehicleId } })
    }

    const mine = deliveries.filter((d) => d.dispatchId === dispatch.id)
    const finished = mine.map((d) => d.completedAt || d.failedAt).filter(Boolean).sort()
    if (['COMPLETED', 'PARTIALLY_DELIVERED'].includes(status)) dispatch.completedAt = finished.slice(-1)[0] || null
    dispatch.updatedAt = [dispatch.completedAt, ...finished, ...outTimes, safeConfirmed, createdAt].filter(Boolean).sort().slice(-1)[0]
    dispatch.__events = () => {
      ev(dispatch, 'DISPATCH_CREATED', createdAt, { description: `${dispatch.dispatchNumber} · ${stops.length} orders · ${H[dispatch.hubId]?.name || ''}` })
      ev(dispatch, 'DISPATCH_PLANNED', createdAt)
      if (driver) {
        ev(dispatch, 'DRIVER_ASSIGNED', createdAt, { description: `${driver.name} (${driver.code})` })
        if (vehicle) ev(dispatch, 'VEHICLE_ASSIGNED', createdAt, { description: `${vehicle.vehicleNumber} · ${vehicle.type}` })
      }
      if (safeConfirmed) ev(dispatch, 'DISPATCH_CONFIRMED', safeConfirmed, { description: `${dispatch.totalQuantity} units dispatched from ${H[dispatch.hubId]?.name || 'hub'}` })
      if (dispatch.startedAt) ev(dispatch, 'DISPATCH_STARTED', dispatch.startedAt, { userId: driver?.userId || driver?.id })
      mine.forEach((d) => {
        const by = driver?.userId || driver?.id
        if (d.startedAt) ev(dispatch, 'DELIVERY_STARTED', d.startedAt, { orderId: d.orderId, deliveryId: d.id, userId: by, description: `Stop ${d.sequence} · ${d.orderNumber} · ${d.customerName}` })
        if (d.status === 'DELIVERED') {
          ev(dispatch, 'DELIVERY_COMPLETED', d.completedAt, { orderId: d.orderId, deliveryId: d.id, userId: by, description: `${d.orderNumber} · OTP verified (simulated)` })
          ev(dispatch, 'DELIVERY_NOTE_GENERATED', d.completedAt, { orderId: d.orderId, deliveryId: d.id, userId: by, description: d.deliveryNoteNumber })
        }
        if (d.status === 'FAILED') ev(dispatch, 'DELIVERY_FAILED', d.failedAt, { orderId: d.orderId, deliveryId: d.id, userId: by, description: `${d.orderNumber} · ${d.failureReason}`, remarks: d.failureRemarks })
      })
      if (dispatch.completedAt) ev(dispatch, 'DISPATCH_COMPLETED', dispatch.completedAt, { description: `${mine.filter((d) => d.status === 'DELIVERED').length} of ${mine.length} delivered` })
    }
  })

  // Numbers follow creation time
  const year = now.year()
  dispatches.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)).forEach((d, i) => {
    d.dispatchNumber = formatDispatchNumber(dayjs(d.createdAt).year(), i + 1)
    deliveries.filter((x) => x.dispatchId === d.id).forEach((x) => { x.dispatchNumber = d.dispatchNumber })
  })
  movements = movements.map((m) => (m.referenceNumber === '__DSP__' ? { ...m, referenceNumber: dispatches.find((d) => d.id === m.dispatchId)?.dispatchNumber || m.referenceNumber, notes: m.notes.replace('__DSP__', dispatches.find((d) => d.id === m.dispatchId)?.dispatchNumber || '') } : m))
  dispatches.forEach((d) => d.stockSnapshot.forEach((s) => { if (s.movementId) s.movementNumber = movements.find((m) => m.id === s.movementId)?.movementNumber || s.movementNumber }))

  // Delivery notes in completion order
  deliveries.filter((d) => d.status === 'DELIVERED').sort((a, b) => (a.completedAt < b.completedAt ? -1 : 1)).forEach((d, i) => {
    const dispatch = dispatches.find((x) => x.id === d.dispatchId)
    const noteNumber = formatDeliveryNoteNumber(dayjs(d.completedAt).year(), i + 1)
    const id = `dn-${pad(i + 1, 4)}`
    d.deliveryNoteId = id
    d.deliveryNoteNumber = noteNumber
    orderPatch[d.orderId] = { ...(orderPatch[d.orderId] || {}), deliveryNoteId: id, deliveryNoteNumber: noteNumber }
    notes.push(buildNoteRecord({ id, noteNumber, delivery: d, dispatch, driver: D[dispatch.driverId], vehicle: V[dispatch.vehicleId], hub: H[d.hubId], generatedAt: d.completedAt, generatedBy: D[dispatch.driverId]?.userId || dispatch.driverId }))
  })
  dispatches.forEach((d) => { d.__events?.(); delete d.__events; delete d.__created })
  timeline.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))

  orders = orders.map((o) => {
    const p = orderPatch[o.id]
    // Any leftover legacy status (no driver recorded) falls back to its Phase 4 equivalent
    const legacy = o.orderStatus === 'PLANNED' ? 'READY_FOR_DISPATCH' : o.orderStatus === 'DELIVERY_PROBLEM' ? 'DELIVERY_FAILED' : o.orderStatus
    return { dispatchId: null, deliveryId: null, vehicleId: null, dispatchedAt: null, outForDeliveryAt: null, deliveryNoteId: null, deliveryNoteNumber: null, ...o, orderStatus: legacy, ...(p || {}) }
  })

  drivers.forEach((d) => { d.availability = deriveDriverAvailability(d, dispatches) })
  vehicles.forEach((v) => { v.status = deriveVehicleStatus(v, dispatches) })

  return {
    zones, drivers, vehicles, dispatches, deliveries, otps, notes, timeline, orders, inventory, movements,
    dispatchSequence: { year, lastNumber: dispatches.length },
    deliverySequence: { year, lastNumber: notes.length },
  }
}

/** Delivery-note document (pure). */
export const buildNoteRecord = ({ id, noteNumber, delivery, dispatch, driver, vehicle, hub, generatedAt, generatedBy }) => ({
  id,
  noteNumber,
  dispatchId: dispatch?.id || delivery.dispatchId,
  dispatchNumber: dispatch?.dispatchNumber || delivery.dispatchNumber,
  deliveryId: delivery.id,
  orderId: delivery.orderId,
  orderNumber: delivery.orderNumber,
  customerId: delivery.customerId,
  customerName: delivery.customerName,
  customerAddress: [delivery.deliveryAddress, delivery.city, delivery.pincode].filter(Boolean).join(', '),
  customerMobile: delivery.customerMobile,
  deliveryDate: delivery.completedAt || generatedAt,
  driverId: driver?.id || delivery.driverId,
  driverName: driver?.name || dispatch?.driverName || '',
  vehicleId: vehicle?.id || delivery.vehicleId,
  vehicleNumber: vehicle?.vehicleNumber || dispatch?.vehicleNumber || '',
  hubId: delivery.hubId,
  hubName: hub?.name || '',
  items: delivery.items.map((it) => ({
    productId: it.productId, productCode: it.productCode, productName: it.productName, unit: it.unit,
    orderedQuantity: it.orderedQuantity, dispatchedQuantity: it.dispatchedQuantity, deliveredQuantity: it.deliveredQuantity,
    remainingQuantity: it.remainingQuantity, damagedQuantity: it.damagedQuantity,
  })),
  totalDelivered: delivery.items.reduce((s, it) => s + it.deliveredQuantity, 0),
  totalRemaining: delivery.items.reduce((s, it) => s + it.remainingQuantity, 0),
  totalDamaged: delivery.items.reduce((s, it) => s + it.damagedQuantity, 0),
  deliveryStatus: delivery.status,
  otpStatus: delivery.otpStatus === 'VERIFIED' ? 'Verified' : 'Not verified',
  otpVerifiedAt: delivery.otpVerifiedAt,
  customerAcknowledgement: delivery.receivedBy || '',
  remarks: delivery.remarks || '',
  generatedAt,
  generatedBy,
  simulatedOtp: true,
})
