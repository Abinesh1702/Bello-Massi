/**
 * Warehouse management (locations, put-away, picking, packing, loading), inventory control (cycle counts, recalls)
 * and quality assurance (inspections, temperature logs, non-conformance / CAPA).
 * Stock quantities never change here except through inventoryService (counts post adjustments) — lots, bins and
 * QA status are maintained by batchService on top of the same ledger.
 */
import dayjs from 'dayjs'
import { MapPin, PackageSearch, ThermometerSnowflake, ShieldAlert, ClipboardCheck } from 'lucide-react'
import { S, today, sum, count, productCol, qtyCol, statusKpis, r2 } from './common'
import { createRecord, read } from '../../../services/enterprise/recordService'
import { recordFor } from '../../../services/enterprise/lookupService'
import { allocate, assignBin, getBatches, isBlocked, isExpired, pickingRule, setBatchStatus, traceBatches } from '../../../services/enterprise/batchService'
import { createStockAdjustment } from '../../../services/inventoryService'
import { getAvailable } from '../../../utils/stock'
import { STORAGE_KEYS as K, ORDER_STATUS } from '../../../utils/constants'

const batchLabel = (ids) => (ids || []).map((id) => getBatches().find((b) => b.id === id)?.batchNumber || id).join(', ')

/* ---------------- Locations ---------------- */
export const locations = {
  id: 'warehouse_locations', key: K.WAREHOUSE_LOCATIONS, label: 'Location', plural: 'Warehouse locations', idPrefix: 'loc', basePath: '/warehouse/locations', auditModule: 'wms',
  description: 'Location hierarchy per hub: zone → aisle → rack → shelf → bin, with storage type and pallet capacity. Lots are put away into bins.',
  permissions: { view: 'warehouse.locations.view', create: 'warehouse.locations.manage', edit: 'warehouse.locations.manage' },
  statuses: { ACTIVE: S('Active', 'success'), BLOCKED: S('Blocked', 'danger') }, initialStatus: 'ACTIVE', titleField: 'code', defaultSort: 'code',
  initialValues: () => ({ level: 'BIN', storageType: 'Frozen', hubId: 'hub-che', capacityPallets: 4 }),
  fields: [
    { key: 'code', label: 'Location code', type: 'text', required: true },
    { key: 'hubId', label: 'Hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'level', label: 'Level', type: 'select', required: true, options: [{ value: 'ZONE', label: 'Zone' }, { value: 'AISLE', label: 'Aisle' }, { value: 'RACK', label: 'Rack' }, { value: 'SHELF', label: 'Shelf' }, { value: 'BIN', label: 'Bin' }] },
    { key: 'parentCode', label: 'Parent location code', type: 'text' },
    { key: 'storageType', label: 'Storage type', type: 'select', options: ['Frozen', 'Chilled', 'Ambient'], required: true },
    { key: 'capacityPallets', label: 'Capacity (pallets)', type: 'integer', min: 0 },
    { key: 'occupancy', label: 'Lots in location', type: 'integer', computed: true, render: (_, r) => count(getBatches(), (b) => b.locationId === r.id && b.quantity > 0) },
  ],
  validate: (v, ctx) => {
    const e = {}
    if (ctx.list.some((l) => l.id !== ctx.existing?.id && l.hubId === v.hubId && String(l.code).toUpperCase() === String(v.code || '').toUpperCase())) e.code = 'This code already exists at the hub.'
    if (v.parentCode && !ctx.list.some((l) => l.hubId === v.hubId && l.code === v.parentCode)) e.parentCode = 'Parent location not found at this hub.'
    return e
  },
  listColumns: ['code', 'hubId', 'level', 'storageType', 'capacityPallets', 'occupancy'], filters: ['hubId', 'level', 'storageType'], searchFields: ['parentCode'],
  kpis: (rs) => [{ label: 'Bins', value: count(rs, (r) => r.level === 'BIN'), filter: { level: 'BIN' }, icon: MapPin }, { label: 'Zones', value: count(rs, (r) => r.level === 'ZONE'), filter: { level: 'ZONE' } }, { label: 'Bins in use', value: new Set(getBatches().filter((b) => b.locationId && b.quantity > 0).map((b) => b.locationId)).size }, { label: 'Blocked', value: count(rs, (r) => r.status === 'BLOCKED'), filter: { status: 'BLOCKED' }, tone: 'danger' }],
  actions: [
    { id: 'block', label: 'Block', from: ['ACTIVE'], to: 'BLOCKED', permission: 'warehouse.locations.manage', note: 'required', tone: 'danger' },
    { id: 'unblock', label: 'Unblock', from: ['BLOCKED'], to: 'ACTIVE', permission: 'warehouse.locations.manage' },
  ],
  related: (r) => [{ label: 'Lots in this location', to: `/inventory/batches?location=${r.id}` }],
  detailTables: (r) => (r.level === 'BIN' ? [{ title: 'Lots in this bin', columns: [{ key: 'batchNumber', header: 'Lot' }, { key: 'productId', header: 'Product', render: (b) => recordFor('products', b.productId)?.name }, { key: 'quantity', header: 'Qty', align: 'right' }, { key: 'expiryDate', header: 'Expiry' }, { key: 'qaStatus', header: 'QA' }], rows: getBatches().filter((b) => b.locationId === r.id && b.quantity > 0), empty: 'Empty bin.' }] : [{ title: 'Child locations', columns: [{ key: 'code', header: 'Code' }, { key: 'level', header: 'Level' }, { key: 'storageType', header: 'Type' }], rows: read(K.WAREHOUSE_LOCATIONS).filter((l) => l.hubId === r.hubId && l.parentCode === r.code), rowTo: (l) => `/warehouse/locations/${l.id}`, empty: 'No child locations.' }]),
}

/* ---------------- Put-away ---------------- */
export const putaway = {
  id: 'putaway_tasks', key: K.PUTAWAY_TASKS, label: 'Put-away task', plural: 'Put-away tasks', numberPrefix: 'PUT', idPrefix: 'put', basePath: '/warehouse/putaway', auditModule: 'wms',
  description: 'Move received lots from the dock into a bin of the right storage type. Created automatically when a goods receipt is posted.',
  permissions: { view: 'warehouse.tasks.view', create: 'warehouse.putaway.manage', edit: 'warehouse.putaway.manage' },
  scope: { own: ['assignedTo'], hub: 'hubId' }, filters: ['hubId', 'grnId', 'assignedTo'],
  statuses: { OPEN: S('Open', 'warning'), IN_PROGRESS: S('In progress', 'info'), DONE: S('Done', 'success'), CANCELLED: S('Cancelled', 'neutral') },
  initialStatus: 'OPEN', editableIn: ['OPEN'],
  fields: [
    { key: 'productId', label: 'Product', type: 'lookup', lookup: 'products', required: true },
    { key: 'hubId', label: 'Hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0 },
    { key: 'batchNumber', label: 'Batch', type: 'text' },
    { key: 'grnId', label: 'Goods receipt', type: 'lookup', lookup: 'module:goods_receipts' },
    { key: 'storageType', label: 'Storage type', type: 'select', options: ['Frozen', 'Chilled', 'Ambient'] },
    { key: 'toLocationId', label: 'Put into bin', type: 'lookup', lookup: 'locations', filter: (l, v) => (!v.hubId || l.hubId === v.hubId) && (!v.storageType || l.storageType === v.storageType) && l.status !== 'BLOCKED' },
    { key: 'assignedTo', label: 'Assigned to', type: 'lookup', lookup: 'users' },
  ],
  listColumns: ['productId', 'batchNumber', 'quantity', 'hubId', 'toLocationId', 'assignedTo'],
  kpis: (rs) => statusKpis(rs, putaway, ['OPEN', 'IN_PROGRESS', 'DONE']),
  actions: [
    { id: 'start', label: 'Start', from: ['OPEN'], to: 'IN_PROGRESS', permission: 'warehouse.putaway.manage', effect: (r, { user }) => ({ patch: { assignedTo: r.assignedTo || user.id, startedAt: new Date().toISOString() } }) },
    {
      id: 'done', label: 'Confirm put-away', from: ['OPEN', 'IN_PROGRESS'], to: 'DONE', permission: 'warehouse.putaway.manage',
      inputs: [{ key: 'toLocationId', label: 'Bin', type: 'lookup', lookup: 'locations', required: true }],
      initialInputs: (r) => ({ toLocationId: r.toLocationId || '' }),
      effect: (r, { input, user }) => {
        const loc = recordFor('locations', input.values?.toLocationId)
        if (!loc) return { ok: false, error: 'Choose the bin the stock was put into.' }
        if (loc.hubId !== r.hubId) return { ok: false, error: 'That bin is at another hub.' }
        if (r.storageType && loc.storageType !== r.storageType) return { ok: false, error: `${r.storageType} product cannot go into a ${loc.storageType.toLowerCase()} bin.` }
        const lots = getBatches().filter((b) => b.productId === r.productId && b.hubId === r.hubId && (b.grnId === r.grnId || (r.batchNumber && b.batchNumber === r.batchNumber)) && b.quantity > 0)
        lots.forEach((b) => assignBin(b.id, loc.id, { user }))
        return { patch: { toLocationId: loc.id, completedAt: new Date().toISOString(), completedBy: user.id, lotsMoved: lots.length } }
      },
    },
    { id: 'cancel', label: 'Cancel', from: ['OPEN'], to: 'CANCELLED', permission: 'warehouse.putaway.manage', note: 'required', tone: 'secondary' },
  ],
}

/* ---------------- Picking ---------------- */
const PICKABLE = [ORDER_STATUS.CONSOLIDATED, ORDER_STATUS.READY_FOR_DISPATCH]
export const generatePickTasks = ({ user }) => {
  const tasks = read(K.PICKING_TASKS)
  const have = new Set(tasks.filter((t) => t.status !== 'CANCELLED').map((t) => t.orderId))
  const orders = read(K.ORDERS).filter((o) => PICKABLE.includes(o.orderStatus) && !have.has(o.id))
  if (!orders.length) return { ok: true, message: 'No consolidated / ready orders without a pick task.' }
  const wave = `W${dayjs().format('MMDD-HHmm')}`
  let n = 0
  orders.forEach((o) => {
    const lines = []
    o.items.forEach((it) => {
      const a = allocate(it.productId, o.hubId, it.orderedQuantity)
      a.lines.forEach((x) => lines.push({ productId: it.productId, batchId: x.batchId, batchNumber: x.batchNumber, expiryDate: x.expiryDate, locationId: x.locationId || '', quantity: x.quantity, pickedQty: x.quantity }))
      if (a.shortQuantity > 0) lines.push({ productId: it.productId, batchId: '', batchNumber: 'SHORT — no releasable lot', locationId: '', quantity: a.shortQuantity, pickedQty: 0 })
    })
    const r = createRecord('picking_tasks', { orderId: o.id, hubId: o.hubId, method: pickingRule(), waveRef: wave, lines }, user)
    if (r.ok) n += 1
  })
  return { ok: true, message: `${n} pick task(s) generated in wave ${wave} (${pickingRule()} lot allocation).` }
}
export const picking = {
  id: 'picking_tasks', key: K.PICKING_TASKS, label: 'Pick task', plural: 'Picking', numberPrefix: 'PICK', idPrefix: 'pick', basePath: '/warehouse/picking', auditModule: 'wms',
  description: 'Pick lists for consolidated / ready orders with FEFO (or FIFO) lot allocation by bin. Blocked, QA-held and expired lots are never proposed or accepted.',
  permissions: { view: 'warehouse.tasks.view', create: 'warehouse.picking.manage', edit: 'warehouse.picking.manage' },
  scope: { own: ['assignedTo'], hub: 'hubId' }, filters: ['hubId', 'method', 'waveRef'],
  statuses: { OPEN: S('Open', 'warning'), PICKING: S('Picking', 'info'), PICKED: S('Picked', 'success'), CANCELLED: S('Cancelled', 'neutral') },
  initialStatus: 'OPEN', editableIn: ['OPEN'],
  listActions: [{ id: 'gen', label: 'Generate wave', icon: PackageSearch, permission: 'warehouse.picking.manage', run: generatePickTasks }],
  fields: [
    { key: 'orderId', label: 'Order', type: 'lookup', lookup: 'orders', required: true, filter: (o) => PICKABLE.includes(o.orderStatus) },
    { key: 'hubId', label: 'Hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'method', label: 'Method', type: 'select', options: ['FEFO', 'FIFO', 'WAVE', 'BATCH', 'ZONE'], required: true },
    { key: 'waveRef', label: 'Wave', type: 'text' },
    { key: 'assignedTo', label: 'Picker', type: 'lookup', lookup: 'users' },
    { key: 'lines', label: 'Pick lines', type: 'lines', required: true, columns: [productCol({ span: 3 }), { key: 'batchId', label: 'Lot', type: 'lookup', lookup: 'batches', span: 3, filter: (b, ln) => !ln.productId || b.productId === ln.productId }, { key: 'locationId', label: 'Bin', type: 'lookup', lookup: 'locations', span: 2 }, qtyCol('quantity', 'To pick', { span: 1 }), { key: 'pickedQty', label: 'Picked', type: 'number', span: 2 }] },
  ],
  initialValues: () => ({ method: 'FEFO', lines: [] }),
  listColumns: ['orderId', 'hubId', 'method', 'waveRef', 'assignedTo'],
  kpis: (rs) => [...statusKpis(rs, picking, ['OPEN', 'PICKING', 'PICKED']), { label: 'Short lines', value: sum(rs.filter((r) => r.status !== 'CANCELLED'), (r) => count(r.lines, (l) => !l.batchId)), tone: 'danger' }],
  actions: [
    { id: 'start', label: 'Start picking', from: ['OPEN'], to: 'PICKING', permission: 'warehouse.picking.manage', effect: (r, { user }) => ({ patch: { assignedTo: r.assignedTo || user.id, startedAt: new Date().toISOString() } }) },
    {
      id: 'confirm', label: 'Confirm picked', from: ['PICKING'], to: 'PICKED', permission: 'warehouse.picking.manage',
      effect: (r, { user }) => {
        const lots = Object.fromEntries(getBatches().map((b) => [b.id, b]))
        for (const l of r.lines) {
          if (!(Number(l.pickedQty) > 0)) continue
          const b = lots[l.batchId]
          if (!b) return { ok: false, error: 'Every picked line needs a lot.' }
          if (isExpired(b)) return { ok: false, error: `Lot ${b.batchNumber} is expired and cannot be picked.` }
          if (isBlocked(b)) return { ok: false, error: `Lot ${b.batchNumber} is on ${b.qaStatus.replace('_', ' ').toLowerCase()} and cannot be picked.` }
          if (Number(l.pickedQty) > b.quantity + 1e-9) return { ok: false, error: `Lot ${b.batchNumber} only has ${b.quantity}.` }
        }
        const p = createRecord('packing_tasks', { pickingTaskId: r.id, orderId: r.orderId, hubId: r.hubId, packageType: 'Insulated carton' }, user, { system: true, silent: true })
        return { patch: { completedAt: new Date().toISOString(), packingTaskId: p.ok ? p.record.id : null, pickedTotal: sum(r.lines, (l) => l.pickedQty) } }
      },
    },
    { id: 'cancel', label: 'Cancel', from: ['OPEN', 'PICKING'], to: 'CANCELLED', permission: 'warehouse.picking.manage', note: 'required', tone: 'secondary' },
  ],
  related: (r) => [{ label: 'Order', to: `/orders/${r.orderId}` }, r.packingTaskId && { label: 'Packing task', to: `/warehouse/packing/${r.packingTaskId}` }],
}

export const packing = {
  id: 'packing_tasks', key: K.PACKING_TASKS, label: 'Packing task', plural: 'Packing', numberPrefix: 'PACK', idPrefix: 'pack', basePath: '/warehouse/packing', auditModule: 'wms',
  description: 'Pack picked orders: number of packages, package type, weight and labels.',
  permissions: { view: 'warehouse.tasks.view', create: 'warehouse.packing.manage', edit: 'warehouse.packing.manage' },
  scope: { hub: 'hubId' }, filters: ['hubId'],
  statuses: { OPEN: S('Open', 'warning'), PACKED: S('Packed', 'success'), CANCELLED: S('Cancelled', 'neutral') }, initialStatus: 'OPEN', editableIn: ['OPEN'],
  fields: [
    { key: 'orderId', label: 'Order', type: 'lookup', lookup: 'orders', required: true },
    { key: 'pickingTaskId', label: 'Pick task', type: 'lookup', lookup: 'module:picking_tasks' },
    { key: 'hubId', label: 'Hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'packageType', label: 'Package type', type: 'select', options: ['Insulated carton', 'Pallet (shrink-wrapped)', 'Crate', 'Gel-pack box'], required: true },
    { key: 'packages', label: 'Packages', type: 'integer', min: 0 },
    { key: 'totalWeightKg', label: 'Total weight (kg)', type: 'number', min: 0 },
    { key: 'labelsPrinted', label: 'Labels printed', type: 'boolean' },
  ],
  listColumns: ['orderId', 'hubId', 'packageType', 'packages', 'totalWeightKg'],
  kpis: (rs) => statusKpis(rs, packing, ['OPEN', 'PACKED']),
  actions: [{ id: 'pack', label: 'Mark packed', from: ['OPEN'], to: 'PACKED', permission: 'warehouse.packing.manage', inputs: [{ key: 'packages', label: 'Packages', type: 'integer', required: true }, { key: 'totalWeightKg', label: 'Weight (kg)', type: 'number', required: true }], effect: (r, { input, user }) => (!(Number(input.values?.packages) > 0) ? { ok: false, error: 'Enter the number of packages.' } : { patch: { packages: Number(input.values.packages), totalWeightKg: Number(input.values.totalWeightKg) || 0, labelsPrinted: true, packedBy: user.id, packedAt: new Date().toISOString() } }) }],
  related: (r) => [{ label: 'Order', to: `/orders/${r.orderId}` }],
}

export const loading = {
  id: 'loading_tasks', key: K.LOADING_TASKS, label: 'Loading task', plural: 'Loading', numberPrefix: 'LOAD', idPrefix: 'load', basePath: '/warehouse/loading', auditModule: 'wms',
  description: 'Vehicle loading per dispatch with capacity check, loading temperature and seal number.',
  permissions: { view: 'warehouse.tasks.view', create: 'warehouse.loading.manage', edit: 'warehouse.loading.manage' },
  scope: { hub: 'hubId' }, filters: ['hubId'],
  statuses: { PLANNED: S('Planned', 'info'), LOADING: S('Loading', 'warning'), SEALED: S('Loaded & sealed', 'success'), CANCELLED: S('Cancelled', 'neutral') }, initialStatus: 'PLANNED', editableIn: ['PLANNED'],
  fields: [
    { key: 'dispatchId', label: 'Dispatch', type: 'lookup', lookup: 'dispatches', required: true, onChange: (v) => { const d = recordFor('dispatches', v); return d ? { vehicleId: d.vehicleId, hubId: d.hubId, plannedQty: d.totalQuantity } : {} } },
    { key: 'vehicleId', label: 'Vehicle', type: 'lookup', lookup: 'vehicles', required: true },
    { key: 'hubId', label: 'Hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'plannedQty', label: 'Planned quantity', type: 'number', required: true, min: 0 },
    { key: 'dockDoor', label: 'Dock door', type: 'text' },
    { key: 'sealNumber', label: 'Seal number', type: 'text', readOnly: true },
    { key: 'loadingTemperature', label: 'Reefer temperature (°C)', type: 'number', readOnly: true },
  ],
  validate: (v) => {
    const veh = recordFor('vehicles', v.vehicleId)
    if (!veh) return {}
    if (['Inactive', 'Maintenance'].includes(veh.status)) return { vehicleId: `${veh.vehicleNumber} is ${veh.status.toLowerCase()}.` }
    if (veh.capacity && Number(v.plannedQty) > veh.capacity) return { plannedQty: `Exceeds ${veh.vehicleNumber} capacity of ${veh.capacity} ${veh.capacityUnit || 'units'}.` }
    return {}
  },
  listColumns: ['dispatchId', 'vehicleId', 'hubId', 'plannedQty', 'sealNumber'],
  kpis: (rs) => statusKpis(rs, loading, ['PLANNED', 'LOADING', 'SEALED']),
  actions: [
    { id: 'start', label: 'Start loading', from: ['PLANNED'], to: 'LOADING', permission: 'warehouse.loading.manage' },
    { id: 'seal', label: 'Loaded & sealed', from: ['LOADING'], to: 'SEALED', permission: 'warehouse.loading.manage', inputs: [{ key: 'sealNumber', label: 'Seal number', type: 'text', required: true }, { key: 'loadingTemperature', label: 'Reefer temperature (°C)', type: 'number', required: true }], effect: (r, { input }) => (!String(input.values?.sealNumber || '').trim() ? { ok: false, error: 'Enter the seal number.' } : input.values?.loadingTemperature === undefined || input.values?.loadingTemperature === '' ? { ok: false, error: 'Record the reefer temperature at loading.' } : { patch: { sealNumber: input.values.sealNumber.trim(), loadingTemperature: Number(input.values.loadingTemperature), sealedAt: new Date().toISOString() } }) },
    { id: 'cancel', label: 'Cancel', from: ['PLANNED', 'LOADING'], to: 'CANCELLED', permission: 'warehouse.loading.manage', note: 'required', tone: 'secondary' },
  ],
  related: (r) => [{ label: 'Dispatch', to: `/dispatch/${r.dispatchId}` }],
}

/* ---------------- Inventory control ---------------- */
export const cycleCounts = {
  id: 'cycle_counts', key: K.CYCLE_COUNTS, label: 'Cycle count', plural: 'Cycle counts', numberPrefix: 'CC', idPrefix: 'cc', basePath: '/inventory/counts', auditModule: 'batches',
  description: 'Physical counts against system stock. On approval, every variance is posted as a stock correction (adjustment) in the ledger.',
  permissions: { view: 'inventory.counts.view', create: 'inventory.counts.manage', edit: 'inventory.counts.manage' },
  scope: { hub: 'hubId' }, filters: ['hubId'],
  statuses: { DRAFT: S('Counting', 'neutral'), SUBMITTED: S('Submitted', 'warning'), APPROVED: S('Approved & posted', 'success'), REJECTED: S('Recount required', 'danger') },
  initialStatus: 'DRAFT', editableIn: ['DRAFT', 'REJECTED'],
  initialValues: () => ({ hubId: 'hub-che', countDate: today(), lines: [] }),
  fields: [
    { key: 'hubId', label: 'Hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'countDate', label: 'Count date', type: 'date', required: true },
    { key: 'scopeNote', label: 'Scope (zone / category)', type: 'text' },
    { key: 'lines', label: 'Count sheet', type: 'lines', required: true, columns: [
      productCol({ fill: (p, v) => ({ systemQty: read(K.INVENTORY).find((r) => r.productId === p.id && r.hubId === v.hubId)?.totalQuantity ?? 0 }) }),
      { key: 'systemQty', label: 'System qty', type: 'number', span: 2 }, qtyCol('countedQty', 'Counted'), { key: 'variance', label: 'Variance', type: 'number', span: 2, computed: (l) => r2((Number(l.countedQty) || 0) - (Number(l.systemQty) || 0)) },
    ] },
  ],
  compute: (r) => ({ varianceLines: count(r.lines, (l) => Math.abs((Number(l.countedQty) || 0) - (Number(l.systemQty) || 0)) > 0.0001), netVariance: sum(r.lines, (l) => (Number(l.countedQty) || 0) - (Number(l.systemQty) || 0)) }),
  listColumns: ['hubId', 'countDate', 'scopeNote', 'varianceLines', 'netVariance'],
  kpis: (rs) => [...statusKpis(rs, cycleCounts, ['DRAFT', 'SUBMITTED', 'APPROVED'], ClipboardCheck), { label: 'Accuracy (approved)', value: `${(() => { const ls = rs.filter((r) => r.status === 'APPROVED').flatMap((r) => r.lines); return ls.length ? Math.round((count(ls, (l) => Number(l.countedQty) === Number(l.systemQty)) / ls.length) * 100) : 100 })()}%` }],
  actions: [
    { id: 'submit', label: 'Submit count', from: ['DRAFT', 'REJECTED'], to: 'SUBMITTED', permission: 'inventory.counts.manage', effect: (r) => ({ patch: { lines: r.lines.map((l) => ({ ...l, systemQtyAtSubmit: read(K.INVENTORY).find((x) => x.productId === l.productId && x.hubId === r.hubId)?.totalQuantity ?? 0 })) } }) },
    {
      id: 'approve', label: 'Approve & post', from: ['SUBMITTED'], to: 'APPROVED', permission: 'inventory.counts.approve', noSelf: true,
      description: 'Each line with a difference between counted and current system quantity is posted as a stock correction.',
      effect: (r) => {
        const posted = []
        for (const l of r.lines) {
          const inv = read(K.INVENTORY).find((x) => x.productId === l.productId && x.hubId === r.hubId)
          const current = inv?.totalQuantity ?? 0
          const diff = r2((Number(l.countedQty) || 0) - current)
          if (Math.abs(diff) < 0.0001) continue
          if (diff < 0 && inv && -diff > getAvailable(inv) + 1e-9) return { ok: false, error: `Cannot reduce ${recordFor('products', l.productId)?.name}: ${Math.abs(diff)} exceeds unreserved available stock. Resolve reservations / QA holds first.` }
          const res = createStockAdjustment({ hubId: r.hubId, productId: l.productId, type: 'Correction', direction: diff > 0 ? 'increase' : 'decrease', quantity: Math.abs(diff), adjustmentDate: today(), reason: 'Physical Stock Correction', notes: `Cycle count ${r.number}` })
          if (!res.ok) return { ok: false, error: Object.values(res.errors || {})[0] || 'Adjustment failed.' }
          posted.push(res.record.adjustmentNumber)
        }
        return { patch: { adjustments: posted, postedAt: new Date().toISOString() } }
      },
    },
    { id: 'reject', label: 'Request recount', from: ['SUBMITTED'], to: 'REJECTED', permission: 'inventory.counts.approve', note: 'required', tone: 'danger' },
  ],
}

export const recalls = {
  id: 'product_recalls', key: K.PRODUCT_RECALLS, label: 'Product recall', plural: 'Product recalls', numberPrefix: 'RCL', idPrefix: 'rcl', basePath: '/inventory/recalls', auditModule: 'batches',
  description: 'Recall lots: activation quarantines the lots in every hub and lists the customers and orders that received them (from batch traceability).',
  permissions: { view: 'inventory.recall.view', create: 'inventory.recall.manage', edit: 'inventory.recall.manage' },
  statuses: { DRAFT: S('Draft', 'neutral'), ACTIVE: S('Active recall', 'danger'), CLOSED: S('Closed', 'success') }, initialStatus: 'DRAFT', editableIn: ['DRAFT'],
  initialValues: () => ({ severity: 'Class II', batchIds: [] }),
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, wide: true },
    { key: 'productId', label: 'Product', type: 'lookup', lookup: 'products', required: true },
    { key: 'batchIds', label: 'Lots', type: 'multilookup', lookup: 'batches', required: true, filter: (b, v) => !v.productId || b.productId === v.productId, render: (v) => batchLabel(v) },
    { key: 'severity', label: 'Severity', type: 'select', options: ['Class I (serious)', 'Class II', 'Class III', 'Market withdrawal'], required: true },
    { key: 'regulatorRef', label: 'Authority reference', type: 'text' },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true },
  ],
  listColumns: ['title', 'productId', 'severity', 'batchIds'],
  kpis: (rs) => statusKpis(rs, recalls, ['ACTIVE', 'CLOSED'], ShieldAlert),
  actions: [
    {
      id: 'activate', label: 'Activate recall', from: ['DRAFT'], to: 'ACTIVE', permission: 'inventory.recall.manage', tone: 'danger', description: 'Quarantines the lots (not sellable or pickable) and records the affected customers.',
      effect: (r, { user }) => {
        const res = setBatchStatus(r.batchIds, 'QUARANTINE', { reason: `Recall ${r.number}`, user, source: 'Recall' })
        if (!res.ok) return res
        const affected = traceBatches(r.batchIds)
        return { patch: { activatedAt: new Date().toISOString(), affected } }
      },
      notify: (r) => ({ title: `Recall ${r.number} active`, message: `${(r.affected || []).length} order(s) affected`, roles: ['ADMIN', 'QA_MANAGER', 'WAREHOUSE_MANAGER', 'CUSTOMER_SERVICE'], type: 'danger', link: `/inventory/recalls/${r.id}` }),
    },
    { id: 'close', label: 'Close recall', from: ['ACTIVE'], to: 'CLOSED', permission: 'inventory.recall.manage', note: 'required' },
  ],
  detailTables: (r) => [r.status !== 'DRAFT' && {
    title: 'Affected customers & orders', subtitle: 'From batch traceability at activation (stock ledger consumption).', empty: 'No recalled stock had reached a customer.', rowTo: (a) => `/orders/${a.orderId}`,
    columns: [{ key: 'orderNumber', header: 'Order / document' }, { key: 'customerId', header: 'Customer', render: (a) => recordFor('customers', a.customerId)?.name || '—' }, { key: 'quantity', header: 'Qty', align: 'right' }, { key: 'batches', header: 'Lots', render: (a) => (a.batches || []).join(', ') }],
    rows: r.affected || [],
  }, {
    title: 'Recalled lots', columns: [{ key: 'batchNumber', header: 'Lot' }, { key: 'hubId', header: 'Hub', render: (b) => recordFor('hubs', b.hubId)?.name }, { key: 'quantity', header: 'Qty in stock', align: 'right' }, { key: 'qaStatus', header: 'QA status' }],
    rows: getBatches().filter((b) => (r.batchIds || []).includes(b.id)),
  }],
}

/* ---------------- Quality assurance ---------------- */
const CHECKS = [['packagingOk', 'Packaging intact'], ['labelOk', 'Labels & dates correct'], ['temperatureOk', 'Temperature in range'], ['sensoryOk', 'Colour / odour / texture OK'], ['documentsOk', 'Certificates & documents OK']]
const lotsOfInspection = (r) => getBatches().filter((b) => (r.grnId && b.grnId === r.grnId) || (r.batchIds || []).includes(b.id)).map((b) => b.id)
export const qaInspections = {
  id: 'qa_inspections', key: K.QA_INSPECTIONS, label: 'QA inspection', plural: 'QA inspections', numberPrefix: 'QAI', idPrefix: 'qai', basePath: '/qa/inspections', auditModule: 'qa',
  description: 'Incoming, return and routine inspections. Release makes the lots sellable; hold / quarantine / reject keep them blocked everywhere (orders, picking, dispatch).',
  permissions: { view: 'qa.inspection.view', create: 'qa.inspection.manage', edit: 'qa.inspection.manage' },
  scope: { own: ['inspectorId'] }, filters: ['sourceType', 'hubId'],
  statuses: { PENDING: S('Pending', 'warning'), IN_PROGRESS: S('In progress', 'info'), RELEASED: S('Released', 'success'), ON_HOLD: S('On hold / quarantine', 'danger'), REJECTED: S('Rejected', 'danger') },
  initialStatus: 'PENDING', editableIn: ['PENDING', 'IN_PROGRESS'],
  initialValues: ({ user }) => ({ sourceType: 'Routine', plannedDate: today(), inspectorId: user?.id, hubId: user?.hubId || 'hub-che', batchIds: [] }),
  sections: [
    { title: 'Inspection', fields: ['sourceType', 'grnId', 'hubId', 'productId', 'batchIds', 'batchNumbers', 'plannedDate', 'inspectorId'] },
    { title: 'Checklist', fields: [...CHECKS.map(([k]) => k), 'measuredTemp'] },
    { title: 'Notes', fields: ['notes'] },
  ],
  fields: [
    { key: 'sourceType', label: 'Source', type: 'select', options: ['Goods receipt', 'Customer return', 'Routine', 'Customer complaint', 'Recall'], required: true },
    { key: 'grnId', label: 'Goods receipt', type: 'lookup', lookup: 'module:goods_receipts' },
    { key: 'hubId', label: 'Hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'productId', label: 'Product', type: 'lookup', lookup: 'products' },
    { key: 'batchIds', label: 'Lots', type: 'multilookup', lookup: 'batches', filter: (b, v) => (!v.productId || b.productId === v.productId) && (!v.hubId || b.hubId === v.hubId), render: (v) => batchLabel(v) || '—' },
    { key: 'batchNumbers', label: 'Batch numbers (GRN)', type: 'text', readOnly: true },
    { key: 'plannedDate', label: 'Planned date', type: 'date', required: true },
    { key: 'inspectorId', label: 'Inspector', type: 'lookup', lookup: 'users' },
    ...CHECKS.map(([key, label]) => ({ key, label, type: 'boolean' })),
    { key: 'measuredTemp', label: 'Measured core temperature (°C)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  validate: (v) => (!v.grnId && !(v.batchIds || []).length && v.sourceType !== 'Routine' ? { batchIds: 'Select the lots or the goods receipt being inspected.' } : {}),
  compute: (r) => ({ checksPassed: CHECKS.filter(([k]) => r[k]).length }),
  listColumns: ['sourceType', 'grnId', 'productId', 'hubId', 'plannedDate', 'inspectorId'],
  kpis: (rs) => [...statusKpis(rs, qaInspections, ['PENDING', 'IN_PROGRESS', 'ON_HOLD'], ClipboardCheck), { label: 'Lots on hold (all hubs)', value: count(getBatches(), (b) => b.quantity > 0 && b.qaStatus !== 'AVAILABLE'), tone: 'warning' }],
  actions: [
    { id: 'start', label: 'Start inspection', from: ['PENDING'], to: 'IN_PROGRESS', permission: 'qa.inspection.manage', effect: (r, { user }) => ({ patch: { inspectorId: r.inspectorId || user.id, startedAt: new Date().toISOString() } }) },
    {
      id: 'release', label: 'Release', from: ['IN_PROGRESS', 'ON_HOLD'], to: 'RELEASED', permission: 'qa.release', note: 'required',
      effect: (r, { user, input }) => {
        if (CHECKS.some(([k]) => !r[k])) return { ok: false, error: 'All checklist items must pass before release — edit the inspection or hold / reject instead.' }
        const ids = lotsOfInspection(r)
        if (ids.length) { const x = setBatchStatus(ids, 'AVAILABLE', { reason: `${r.number}: ${input.note}`, user, source: 'QA inspection' }); if (!x.ok) return x }
        return { patch: { decidedAt: new Date().toISOString(), decidedBy: user.id, lotsAffected: ids.length } }
      },
    },
    { id: 'hold', label: 'Hold / quarantine', from: ['IN_PROGRESS', 'PENDING'], to: 'ON_HOLD', permission: 'qa.inspection.manage', note: 'required', tone: 'secondary', effect: (r, { user, input }) => { const ids = lotsOfInspection(r); if (ids.length) { const x = setBatchStatus(ids, 'QUARANTINE', { reason: `${r.number}: ${input.note}`, user, source: 'QA inspection' }); if (!x.ok) return x } return { patch: { lotsAffected: ids.length } } } },
    {
      id: 'reject', label: 'Reject', from: ['IN_PROGRESS', 'ON_HOLD'], to: 'REJECTED', permission: 'qa.reject', note: 'required', tone: 'danger', description: 'Lots are marked rejected (never sellable) and a non-conformance report is opened.',
      effect: (r, { user, input }) => {
        const ids = lotsOfInspection(r)
        if (ids.length) { const x = setBatchStatus(ids, 'REJECTED', { reason: `${r.number}: ${input.note}`, user, source: 'QA inspection' }); if (!x.ok) return x }
        const grn = r.grnId ? read(K.GOODS_RECEIPTS).find((g) => g.id === r.grnId) : null
        const n = createRecord('nonconformances', { title: `Rejected at inspection ${r.number}`, sourceType: 'Inspection', referenceNumber: r.number, productId: r.productId || '', supplierId: grn?.supplierId || '', severity: 'Major', description: input.note, dueDate: dayjs().add(14, 'day').format('YYYY-MM-DD'), ownerId: user.id }, user, { system: true })
        return { patch: { decidedAt: new Date().toISOString(), decidedBy: user.id, lotsAffected: ids.length, ncrId: n.ok ? n.record.id : null, ncrNumber: n.ok ? n.record.number : null } }
      },
    },
  ],
  related: (r) => [r.grnId && { label: 'Goods receipt', to: `/warehouse/receiving/${r.grnId}` }, r.ncrId && { label: `NCR ${r.ncrNumber}`, to: `/qa/ncr/${r.ncrId}` }, { label: 'Lots', to: '/inventory/batches?qa=blocked' }],
}

export const temperatureLogs = {
  id: 'temperature_logs', key: K.TEMPERATURE_LOGS, label: 'Temperature reading', plural: 'Temperature logs', numberPrefix: 'TMP', idPrefix: 'tmp', basePath: '/qa/temperature', auditModule: 'qa',
  description: 'Cold-room and reefer temperature readings. Source is MANUAL (entered by staff) or SIMULATED (demo generator) — no live sensor is connected.',
  permissions: { view: 'qa.inspection.view', create: ['qa.temperature.manage', 'warehouse.receiving.manage', 'driver.app'], edit: 'qa.temperature.manage' },
  filters: ['hubId', 'area', 'source'],
  statuses: { IN_RANGE: S('In range', 'success'), EXCURSION: S('Excursion', 'danger'), ACKNOWLEDGED: S('Excursion acknowledged', 'warning') }, initialStatus: 'IN_RANGE', editableIn: [],
  initialValues: ({ user }) => ({ hubId: user?.hubId || 'hub-che', area: 'Frozen store', minAllowed: -25, maxAllowed: -18, recordedAt: dayjs().format('YYYY-MM-DDTHH:mm'), source: 'MANUAL' }),
  fields: [
    { key: 'hubId', label: 'Hub', type: 'lookup', lookup: 'hubs', required: true },
    { key: 'area', label: 'Area', type: 'select', options: ['Frozen store', 'Chilled store', 'Ambient store', 'Receiving dock', 'Dispatch dock', 'Reefer vehicle'], required: true, onChange: (v) => (v === 'Chilled store' ? { minAllowed: 0, maxAllowed: 5 } : v === 'Ambient store' ? { minAllowed: 10, maxAllowed: 25 } : { minAllowed: -25, maxAllowed: -18 }) },
    { key: 'vehicleId', label: 'Vehicle (reefer)', type: 'lookup', lookup: 'vehicles', hideIf: (v) => v.area !== 'Reefer vehicle' },
    { key: 'reading', label: 'Reading (°C)', type: 'number', required: true },
    { key: 'minAllowed', label: 'Min allowed', type: 'number', required: true },
    { key: 'maxAllowed', label: 'Max allowed', type: 'number', required: true },
    { key: 'recordedAt', label: 'Recorded at', type: 'datetime', required: true },
    { key: 'source', label: 'Source', type: 'select', required: true, options: [{ value: 'MANUAL', label: 'Manual entry' }, { value: 'SIMULATED', label: 'Simulated (demo)' }] },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  allowInitialStatus: false,
  compute: (r) => (r.status === 'ACKNOWLEDGED' ? {} : { status: Number(r.reading) < Number(r.minAllowed) || Number(r.reading) > Number(r.maxAllowed) ? 'EXCURSION' : 'IN_RANGE' }),
  listColumns: ['hubId', 'area', 'reading', 'minAllowed', 'maxAllowed', 'recordedAt', 'source'], defaultSort: 'recordedAt',
  kpis: (rs) => [{ label: 'Readings (24 h)', value: count(rs, (r) => dayjs().diff(dayjs(r.recordedAt), 'hour') <= 24), icon: ThermometerSnowflake }, { label: 'Open excursions', value: count(rs, (r) => r.status === 'EXCURSION'), filter: { status: 'EXCURSION' }, tone: 'danger' }, { label: 'Manual', value: count(rs, (r) => r.source === 'MANUAL'), filter: { source: 'MANUAL' } }, { label: 'Simulated', value: count(rs, (r) => r.source === 'SIMULATED'), filter: { source: 'SIMULATED' } }],
  actions: [{ id: 'ack', label: 'Acknowledge excursion', from: ['EXCURSION'], to: 'ACKNOWLEDGED', permission: 'qa.temperature.manage', note: 'required', effect: (r, { user }) => ({ patch: { acknowledgedBy: user.id, acknowledgedAt: new Date().toISOString() } }) }],
}

export const nonconformances = {
  id: 'nonconformances', key: K.NONCONFORMANCES, label: 'Non-conformance', plural: 'Non-conformance & CAPA', numberPrefix: 'NCR', idPrefix: 'ncr', basePath: '/qa/ncr', auditModule: 'qa',
  description: 'Non-conformance reports with root cause, corrective and preventive actions (CAPA), owner, due date and verification before closure.',
  permissions: { view: 'qa.inspection.view', create: 'qa.ncr.manage', edit: 'qa.ncr.manage' },
  filters: ['severity', 'sourceType'],
  statuses: { OPEN: S('Open', 'warning'), INVESTIGATION: S('Investigation', 'info'), CAPA: S('CAPA in progress', 'brand'), VERIFICATION: S('Verification', 'accent'), CLOSED: S('Closed', 'success') },
  initialStatus: 'OPEN', editableIn: ['OPEN', 'INVESTIGATION', 'CAPA', 'VERIFICATION'],
  initialValues: ({ user }) => ({ ownerId: user?.id, severity: 'Minor', sourceType: 'Inspection', dueDate: dayjs().add(14, 'day').format('YYYY-MM-DD') }),
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, wide: true },
    { key: 'sourceType', label: 'Source', type: 'select', options: ['Inspection', 'Customer complaint', 'Temperature excursion', 'Internal audit', 'Supplier', 'Recall'], required: true },
    { key: 'referenceNumber', label: 'Reference', type: 'text' },
    { key: 'productId', label: 'Product', type: 'lookup', lookup: 'products' },
    { key: 'supplierId', label: 'Supplier', type: 'lookup', lookup: 'suppliers' },
    { key: 'severity', label: 'Severity', type: 'select', options: ['Minor', 'Major', 'Critical'], required: true },
    { key: 'ownerId', label: 'Owner', type: 'lookup', lookup: 'users', required: true },
    { key: 'dueDate', label: 'Due date', type: 'date', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'rootCause', label: 'Root cause', type: 'textarea' },
    { key: 'correctiveAction', label: 'Corrective action', type: 'textarea' },
    { key: 'preventiveAction', label: 'Preventive action', type: 'textarea' },
  ],
  listColumns: ['title', 'sourceType', 'severity', 'ownerId', 'dueDate'],
  kpis: (rs) => [...statusKpis(rs, nonconformances, ['OPEN', 'CAPA'], ShieldAlert), { label: 'Overdue', value: count(rs, (r) => r.status !== 'CLOSED' && r.dueDate < today()), tone: 'danger' }, { label: 'Critical open', value: count(rs, (r) => r.status !== 'CLOSED' && r.severity === 'Critical'), tone: 'danger' }],
  actions: [
    { id: 'investigate', label: 'Start investigation', from: ['OPEN'], to: 'INVESTIGATION', permission: 'qa.ncr.manage' },
    { id: 'capa', label: 'Start CAPA', from: ['INVESTIGATION'], to: 'CAPA', permission: 'qa.ncr.manage', effect: (r) => (!String(r.rootCause || '').trim() ? { ok: false, error: 'Record the root cause first (Edit).' } : {}) },
    { id: 'verify', label: 'Send to verification', from: ['CAPA'], to: 'VERIFICATION', permission: 'qa.ncr.manage', effect: (r) => (!String(r.correctiveAction || '').trim() || !String(r.preventiveAction || '').trim() ? { ok: false, error: 'Record the corrective and preventive actions first (Edit).' } : {}) },
    { id: 'close', label: 'Verify & close', from: ['VERIFICATION'], to: 'CLOSED', permission: 'qa.release', noSelf: true, note: 'required' },
    { id: 'reopen', label: 'Back to CAPA', from: ['VERIFICATION'], to: 'CAPA', permission: 'qa.release', note: 'required', tone: 'secondary' },
  ],
}

export const WAREHOUSE_MODULES = [locations, putaway, picking, packing, loading, cycleCounts, recalls, qaInspections, temperatureLogs, nonconformances]
