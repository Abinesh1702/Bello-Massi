/** Global search: pages, modules, quick actions and the customers, products, hubs and orders the user can view. */
import { Users, Package, Warehouse, ClipboardList, Truck, FileText, PackageX, PhoneCall, FileBarChart, IdCard, Car, Navigation } from 'lucide-react'
import { NAV_ITEMS, canAccessItem } from '../config/navigation'
import { can } from '../config/permissions'
import { canViewOrder } from './orderService'
import { canViewCall } from './callService'
import { canViewDelivery } from './deliveryService'
import { visibleReports } from './reportService'
import { ORDER_STATUS_META } from '../utils/constants'

/** Actions are resolved by the header (see GlobalSearch) via their `action` id. */
export const SEARCH_ACTIONS = [
  { id: 'act-theme', label: 'Toggle light / dark theme', action: 'toggleTheme', keywords: ['dark mode', 'light mode', 'appearance'] },
  { id: 'act-export', label: 'Export demo data (JSON backup)', action: 'navigate', path: '/settings?tab=demo', keywords: ['backup', 'download', 'export'] },
  { id: 'act-import', label: 'Import demo data', action: 'navigate', path: '/settings?tab=demo', permission: 'data.import', keywords: ['restore', 'upload', 'import'] },
  { id: 'act-reset', label: 'Reset demo data', action: 'navigate', path: '/settings?tab=demo', keywords: ['reset', 'reseed', 'clear'] },
  { id: 'act-profile', label: 'Edit my profile', action: 'navigate', path: '/profile', keywords: ['name', 'avatar', 'phone'] },
  { id: 'act-password', label: 'Change demo password', action: 'navigate', path: '/account/change-password', keywords: ['password', 'security'] },
  { id: 'act-notification-center', label: 'Open notification center', action: 'navigate', path: '/notifications', keywords: ['notifications', 'alerts', 'inbox'] },
  { id: 'act-add-user', label: 'Create user', action: 'navigate', path: '/admin/users/create', permission: 'users.create', keywords: ['new user', 'add user', 'employee'] },
  { id: 'act-add-role', label: 'Create role', action: 'navigate', path: '/admin/roles/create', permission: 'roles.create', keywords: ['new role', 'permissions'] },
  { id: 'act-notifications', label: 'Mark all notifications as read', action: 'markAllRead', keywords: ['notifications', 'alerts'] },
  { id: 'act-logout', label: 'Sign out', action: 'navigate', path: '/logout', keywords: ['logout', 'log out', 'exit'] },
  { id: 'act-create-order', label: 'Create order', action: 'navigate', path: '/orders/create', permission: 'orders.create', keywords: ['new order', 'sales order', 'capture order'] },
  { id: 'act-approvals', label: 'Review pending approvals', action: 'navigate', path: '/orders/approval', permission: 'orders.approve', keywords: ['approve', 'pending', 'approval'] },
  { id: 'act-consolidate', label: 'Consolidate approved orders', action: 'navigate', path: '/orders/consolidation', permission: 'orders.consolidate', keywords: ['consolidation', 'ready for dispatch'] },
  { id: 'act-create-dispatch', label: 'New dispatch plan', action: 'navigate', path: '/dispatch/create', permission: 'dispatch.manage', keywords: ['dispatch', 'plan', 'route', 'assign driver'] },
  { id: 'act-add-customer', label: 'Add customer', action: 'navigate', path: '/customers/create', permission: 'customers.manage', keywords: ['new customer', 'create customer'] },
  { id: 'act-add-product', label: 'Add product', action: 'navigate', path: '/products/create', permission: 'products.manage', keywords: ['new product', 'create product', 'item'] },
  { id: 'act-add-hub', label: 'Add hub', action: 'navigate', path: '/hubs/create', permission: 'hubs.manage', keywords: ['new hub', 'warehouse'] },
  { id: 'act-receive', label: 'Receive stock (new GRN)', action: 'navigate', path: '/inventory/stock-receipts/create', permission: 'inventory.receipts.manage', keywords: ['grn', 'receipt', 'inward'] },
  { id: 'act-transfer', label: 'Transfer stock between hubs', action: 'navigate', path: '/inventory/stock-transfers/create', permission: 'inventory.transfers.manage', keywords: ['transfer', 'move'] },
  { id: 'act-adjust', label: 'Adjust stock', action: 'navigate', path: '/inventory/stock-adjustments/create', permission: 'inventory.adjustments.manage', keywords: ['adjustment', 'damaged', 'lost'] },
]

const normalise = (s) => String(s || '').toLowerCase().trim()

const score = (query, fields) => {
  let best = 0
  fields.forEach((f, i) => {
    const v = normalise(f)
    if (!v) return
    const weight = i === 0 ? 3 : 1
    if (v === query) best = Math.max(best, 10 * weight)
    else if (v.startsWith(query)) best = Math.max(best, 6 * weight)
    else if (v.includes(query)) best = Math.max(best, 3 * weight)
  })
  return best
}

const recordResults = (query, role, records) => {
  if (!records || query.length < 2) return []
  const out = []
  const add = (list, perm, kind, icon, toPath, fields, hint, label = (r) => r.name) => {
    if (!can(role, perm)) return
    list.forEach((r) => {
      const sc = score(query, fields(r))
      if (sc > 0) out.push({ id: `${kind}-${r.id}`, kind, label: label(r), hint: hint(r), icon, path: toPath(r), action: 'navigate', score: sc - 0.5 })
    })
  }
  add(records.customers || [], 'customers.view', 'Customer', Users, (c) => `/customers/${c.id}`, (c) => [c.name, c.code, c.city, c.contactPerson, c.mobile], (c) => `${c.code} · ${c.city}`)
  add(records.products || [], 'products.view', 'Product', Package, (p) => `/products/${p.id}`, (p) => [p.name, p.code, p.sku, p.barcode, p.brand], (p) => `${p.code} · ${p.sku}`)
  add(records.hubs || [], 'hubs.view', 'Hub', Warehouse, (h) => `/hubs/${h.id}`, (h) => [h.name, h.code, h.city], (h) => `${h.code} · ${h.city}`)
  add(records.dispatches || [], 'dispatch.view', 'Dispatch', Truck, (d) => `/dispatch/${d.id}`, (d) => [d.dispatchNumber, d.driverName, d.vehicleNumber], (d) => [d.driverName || 'No driver', d.dispatchDate].filter(Boolean).join(' · '), (d) => d.dispatchNumber)
  add(records.notes || [], 'dispatch.history', 'Delivery note', FileText, (n) => `/dispatch/delivery-notes/${n.id}`, (n) => [n.noteNumber, n.orderNumber, n.customerName], (n) => `${n.customerName} · ${n.orderNumber}`, (n) => n.noteNumber)
  add(records.scrap || [], 'inventory.scrap.view', 'Scrap', PackageX, (r) => `/inventory/scrap/requests/${r.id}`, (r) => [r.scrapNumber, r.productName, r.batchNumber, r.hubName, r.reason], (r) => `${r.productName} · ${r.quantity} ${r.unit} · ${r.reason}`, (r) => r.scrapNumber)
  add((records.calls || []).filter((c) => canViewCall(records.user, c)), 'communication.calls', 'Call', PhoneCall, (c) => `/communication/calls/${c.id}`, (c) => [c.callNumber, c.customerName, c.contactPerson, c.phone, c.relatedOrderNumber], (c) => `${c.customerName} · ${c.outcome} · ${c.callDate}`, (c) => c.callNumber)
  add(records.drivers || [], 'fleet.view', 'Driver', IdCard, (d) => `/dispatch/drivers/${d.id}`, (d) => [d.name, d.code, d.mobile, d.licenseNumber], (d) => `${d.code} · ${d.availability || d.status}`)
  add(records.vehicles || [], 'fleet.view', 'Vehicle', Car, (v) => `/vms/vehicles/${v.id}`, (v) => [v.vehicleNumber, v.model, v.type], (v) => `${v.type} · ${v.status}`, (v) => v.vehicleNumber)
  add((records.deliveries || []).filter((d) => records.user && canViewDelivery(records.user, d, { orders: records.orders || [], drivers: records.drivers || [] })), 'deliveries.view', 'Delivery', Navigation, (d) => `/dispatch/deliveries/${d.id}`, (d) => [d.orderNumber, d.customerName, d.dispatchNumber, d.deliveryNoteNumber], (d) => `${d.customerName} · ${d.dispatchNumber} · ${d.status.toLowerCase().replace(/_/g, ' ')}`, (d) => `Delivery · ${d.orderNumber}`)
  if (records.user && can(role, 'reports.center')) {
    visibleReports(records.user).forEach((r) => {
      const sc = score(query, [r.title, r.description])
      if (sc > 0) out.push({ id: `Report-${r.id}`, kind: 'Report', label: r.title, hint: r.description, icon: FileBarChart, path: `/reports/view/${r.id}`, action: 'navigate', score: sc - 1 })
    })
  }
  // Orders: scoped per user (salesmen see their own, drafts stay private)
  if (records.user && can(role, 'orders.view')) {
    (records.orders || []).filter((o) => canViewOrder(records.user, o)).forEach((o) => {
      const sc = score(query, [o.orderNumber, o.customerName, o.customerCode, o.salesmanName])
      if (sc > 0) {
        out.push({
          id: `Order-${o.id}`, kind: 'Order', label: o.orderNumber || `Draft · ${o.customerName}`,
          hint: `${o.customerName} · ${ORDER_STATUS_META[o.orderStatus]?.label || o.orderStatus}`,
          icon: ClipboardList, path: `/orders/${o.id}`, action: 'navigate', score: sc - 0.5,
        })
      }
    })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 10)
}

export const searchApp = (rawQuery, role, limit = 8, records = null) => {
  const query = normalise(rawQuery)
  if (!query) return []
  const pages = NAV_ITEMS.filter((item) => !item.hidden && !item.redirectTo && canAccessItem(item, role)).map((item) => ({
    id: item.id,
    kind: item.page === 'comingSoon' ? 'Module' : 'Page',
    label: item.label,
    hint: item.group ? item.group.label : 'Main',
    icon: item.icon,
    path: item.path,
    action: 'navigate',
    score: score(query, [item.label, item.group?.label, item.description, ...(item.keywords || [])]),
  }))
  const actions = SEARCH_ACTIONS.filter((a) => !a.permission || can(role, a.permission)).map((a) => ({
    ...a,
    kind: 'Action',
    hint: 'Quick action',
    score: score(query, [a.label, ...(a.keywords || [])]),
  }))
  const nav = [...pages, ...actions]
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, limit)
  return [...nav, ...recordResults(query, role, records)]
}
