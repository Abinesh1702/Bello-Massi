import {
  LayoutDashboard, ClipboardList, FilePlus2, ListOrdered, BadgeCheck, Layers,
  Boxes, Warehouse, PackageX, Truck, Route, UserRoundCheck, MapPinned, CalendarCheck,
  Users, CreditCard, MessagesSquare, Mail, MessageCircle, PhoneCall,
  ShieldCheck, UserCog, KeyRound, SlidersHorizontal, BarChart3, FileBarChart, FileText,
  PackageCheck, Map, IdCard, Car, ListChecks, CalendarClock, FolderOpen, Upload, ScanText, Settings2, LayoutTemplate, Zap,
  PackageSearch, ReceiptText, Undo2, XCircle, Settings, UserCircle2, PackagePlus, ArrowRightLeft, SlidersHorizontal as Sliders, History, AlertTriangle, Package,
  Sparkles, Bot, Mic, LineChart, Gauge, ClipboardCheck, Lightbulb, Cpu, BrainCircuit, Activity,
  Building2, GitBranch, Network, Briefcase, Award, Contact, ScrollText, Bell, Grid3x3, UsersRound, Factory, LockKeyhole, LogOut,
  Smartphone, Library, Navigation as NavigationIcon,
} from 'lucide-react'
import { matchPath } from 'react-router-dom'
import { can } from './permissions'
import { getUiConfig } from './runtimeConfig'
import { ENTERPRISE_MANAGEMENT_GROUP, ENTERPRISE_NAVIGATION, DRIVER_EXTRA_ITEMS, CUSTOMER_EXTRA_ITEMS } from './enterprise/navigation'

/**
 * Single source of truth for menus, routes, breadcrumbs, search and access control.
 * page: key of a page component in routes/AppRoutes.jsx
 * hidden: routable but not shown in the sidebar/search (create, detail and edit pages)
 * parent: id of the list item a hidden page belongs to (for breadcrumbs)
 * permission: permission key (or array = any of) checked with config/permissions.can() against the live roles,
 *   so role edits, custom roles and additional roles apply to menus, routes and search immediately.
 * public: any signed-in user (dashboard, profile, notifications, preferences).
 */
/** Every routable item, by area (the sidebar order and grouping is set by SIDEBAR below). */
const SOURCE = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    public: true, // the page itself shows KPIs only with dashboard.view (otherwise a module launcher)
    page: 'dashboard',
    description: 'Role-specific overview of orders, approvals, dispatch and deliveries.',
    keywords: ['home', 'overview', 'kpi'],
  },
  ENTERPRISE_MANAGEMENT_GROUP,
  {
    id: 'orders',
    label: 'Order Management',
    icon: ClipboardList,
    children: [
      {
        id: 'orders-create', label: 'Create Order', icon: FilePlus2, path: '/orders/create',
        permission: 'orders.create', page: 'orderForm',
        description: 'Capture orders received by call, email or WhatsApp — customer first, then items and quantities, then submit for approval.',
        keywords: ['new order', 'capture', 'salesman'],
      },
      {
        id: 'orders-mine', label: 'My Orders', icon: ClipboardList, path: '/orders/my-orders',
        permission: 'orders.mine', page: 'myOrders',
        description: 'Your drafts and submitted orders with their approval and consolidation status.',
        keywords: ['drafts', 'my orders', 'salesman'],
      },
      {
        id: 'orders-list', label: 'Order List', icon: ListOrdered, path: '/orders',
        permission: 'orders.view', page: 'orderList',
        description: 'Every order with its live status, full history, search, filters and export.',
        keywords: ['orders', 'status', 'history'],
      },
      {
        id: 'orders-approval', label: 'Order Approval', icon: BadgeCheck, path: '/orders/approval',
        permission: 'orders.approval.view', page: 'approvalQueue',
        description: 'Approval inbox for the Sales Manager — approve, return for correction or reject with a mandatory reason, including the credit-limit decision.',
        keywords: ['approve', 'reject', 'credit', 'manager'],
      },
      {
        id: 'orders-consolidation', label: 'Order Consolidation', icon: Layers, path: '/orders/consolidation',
        permission: 'orders.consolidation.view', page: 'consolidationQueue',
        description: 'Approved orders grouped per salesman, verified, consolidated and released to the Dispatcher.',
        keywords: ['customer service', 'consolidate', 'release', 'ready for dispatch'],
      },
      {
        id: 'orders-returned', label: 'Returned Orders', icon: Undo2, path: '/orders/returned',
        permission: 'orders.corrections.view', page: 'returnedOrders',
        description: 'Orders the Sales Manager sent back for correction — edit and resubmit.',
        keywords: ['correction', 'resubmit', 'returned'],
      },
      {
        id: 'orders-rejected', label: 'Rejected Orders', icon: XCircle, path: '/orders/rejected',
        permission: 'orders.corrections.view', page: 'rejectedOrders',
        description: 'Orders rejected by the Sales Manager, with the reason and remarks.',
        keywords: ['rejected', 'reason'],
      },
      {
        id: 'orders-reports', label: 'Order Reports', icon: FileBarChart, path: '/orders/reports',
        permission: 'orders.reports', page: 'orderReports',
        description: 'Order register, salesman, customer, status, approval, rejection and consolidation reports — exportable.',
        keywords: ['analytics', 'export', 'register', 'csv'],
      },
      { id: 'orders-edit', label: 'Edit Order', path: '/orders/:id/edit', hidden: true, parent: 'orders-list', permission: 'orders.create', page: 'orderForm' },
      { id: 'orders-approval-detail', label: 'Review Order', path: '/orders/approval/:id', hidden: true, parent: 'orders-approval', permission: 'orders.approval.view', page: 'approvalDetail' },
      { id: 'orders-consolidation-detail', label: 'Consolidate Order', path: '/orders/consolidation/:id', hidden: true, parent: 'orders-consolidation', permission: 'orders.consolidation.view', page: 'consolidationDetail' },
      { id: 'orders-detail', label: 'Order Details', path: '/orders/:id', hidden: true, parent: 'orders-list', permission: 'orders.view', page: 'orderDetail' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    children: [
      {
        id: 'customers-list', label: 'Customer List', icon: Users, path: '/customers',
        permission: 'customers.view', page: 'customerList',
        description: 'Customer accounts with contacts, addresses, credit configuration and VIP passes.',
        keywords: ['clients', 'accounts', 'vip', 'gst'],
      },
      {
        id: 'customers-credit', label: 'Customer Credit', icon: CreditCard, path: '/customers/credit',
        permission: 'customers.credit.view', page: 'customerCredit',
        description: 'Credit limits, balances, available credit and credit status.',
        keywords: ['credit limit', 'outstanding', 'finance'],
      },
      { id: 'customers-create', label: 'Add Customer', path: '/customers/create', hidden: true, parent: 'customers-list', permission: 'customers.manage', page: 'customerForm' },
      { id: 'customers-detail', label: 'Customer Details', path: '/customers/:id', hidden: true, parent: 'customers-list', permission: 'customers.view', page: 'customerDetail' },
      { id: 'customers-edit', label: 'Edit Customer', path: '/customers/:id/edit', hidden: true, parent: 'customers-list', permission: 'customers.manage', page: 'customerForm' },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    path: '/products',
    permission: 'products.view',
    page: 'productList',
    description: 'Product catalogue with pricing, units and inventory rules.',
    keywords: ['catalogue', 'items', 'sku', 'price'],
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: Factory,
    path: '/suppliers',
    permission: 'suppliers.view',
    page: 'supplierList',
    description: 'Supplier directory with lead times, minimum order values and replenishment history.',
    keywords: ['supplier', 'vendor', 'lead time'],
  },
  {
    id: 'hubs',
    label: 'Hubs',
    icon: Warehouse,
    path: '/hubs',
    permission: 'hubs.view',
    page: 'hubList',
    description: 'Hubs and warehouses with managers, locations and stock valuation.',
    keywords: ['warehouse', 'hub', 'location'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    children: [
      {
        id: 'inventory-dashboard', label: 'Inventory Dashboard', icon: LayoutDashboard, path: '/inventory',
        permission: 'inventory.dashboard', page: 'inventoryDashboard',
        description: 'Stock quantity, value, low-stock alerts and recent movements across all hubs.',
        keywords: ['stock', 'inventory', 'kpi'],
      },
      {
        id: 'inventory-warehouse', label: 'Warehouse Dashboard', icon: Warehouse, path: '/warehouse',
        permission: 'warehouse.dashboard', page: 'warehouseDashboard',
        description: 'Receiving, stock, picking readiness, expiry and inventory alerts per hub.',
        keywords: ['warehouse', 'receiving', 'picking'],
      },
      {
        id: 'inventory-quality', label: 'QA & Cold Chain', icon: ShieldCheck, path: '/quality',
        permission: 'warehouse.qa.view', page: 'qaDashboard',
        description: 'Inspection queue, quarantined stock, document expiry and cold-chain ranges.',
        keywords: ['qa', 'quality', 'quarantine', 'temperature', 'cold chain'],
      },
      {
        id: 'inventory-stock', label: 'Stock Overview', icon: PackageSearch, path: '/inventory/stock',
        permission: 'inventory.stock.view', page: 'stockOverview',
        description: 'Hub-wise stock: total, reserved, damaged and available quantities.',
        keywords: ['stock', 'availability', 'hub stock'],
      },
      {
        id: 'inventory-low', label: 'Low Stock', icon: AlertTriangle, path: '/inventory/low-stock',
        permission: 'inventory.lowstock.view', page: 'lowStock',
        description: 'Stock lines at or below their reorder level, and out-of-stock lines.',
        keywords: ['reorder', 'out of stock', 'alerts'],
      },
      {
        id: 'inventory-receipts', label: 'Stock Receipts', icon: PackagePlus, path: '/inventory/stock-receipts',
        permission: 'inventory.documents.view', page: 'receiptList',
        description: 'Goods received at hubs (GRN).',
        keywords: ['grn', 'receive', 'inward'],
      },
      {
        id: 'inventory-transfers', label: 'Stock Transfers', icon: ArrowRightLeft, path: '/inventory/stock-transfers',
        permission: 'inventory.documents.view', page: 'transferList',
        description: 'Move stock between hubs — draft, complete or cancel.',
        keywords: ['transfer', 'move stock'],
      },
      {
        id: 'inventory-adjustments', label: 'Stock Adjustments', icon: Sliders, path: '/inventory/stock-adjustments',
        permission: 'inventory.documents.view', page: 'adjustmentList',
        description: 'Increase, decrease, damaged, lost and correction adjustments with reasons.',
        keywords: ['adjust', 'damaged', 'lost', 'correction'],
      },
      {
        id: 'inventory-movements', label: 'Stock Movements', icon: History, path: '/inventory/movements',
        permission: 'inventory.movements.view', page: 'movementList',
        description: 'The read-only stock ledger with every movement.',
        keywords: ['ledger', 'history', 'movement'],
      },
      {
        id: 'inventory-scrap', label: 'Scrap Management', icon: PackageX, path: '/inventory/scrap',
        permission: 'inventory.scrap.view', page: 'scrapDashboard',
        description: 'Scrap requests for expired, damaged or rejected stock — approval, stock write-off, valuation and reports.',
        keywords: ['damaged', 'expired', 'write-off', 'scrap', 'disposal'],
      },
      { id: 'inventory-scrap-requests', label: 'Scrap Requests', path: '/inventory/scrap/requests', hidden: true, parent: 'inventory-scrap', permission: 'inventory.scrap.view', page: 'scrapList' },
      { id: 'inventory-scrap-create', label: 'New Scrap Request', path: '/inventory/scrap/requests/create', hidden: true, parent: 'inventory-scrap', permission: 'scrap.create', page: 'scrapForm' },
      { id: 'inventory-scrap-edit', label: 'Edit Scrap Request', path: '/inventory/scrap/requests/:id/edit', hidden: true, parent: 'inventory-scrap', permission: 'scrap.create', page: 'scrapForm' },
      { id: 'inventory-scrap-print', label: 'Scrap Note', path: '/inventory/scrap/requests/:id/print', hidden: true, parent: 'inventory-scrap', permission: 'inventory.scrap.view', page: 'scrapPrint' },
      { id: 'inventory-scrap-detail', label: 'Scrap Request', path: '/inventory/scrap/requests/:id', hidden: true, parent: 'inventory-scrap', permission: 'inventory.scrap.view', page: 'scrapDetail' },
      { id: 'inventory-stock-detail', label: 'Stock Details', path: '/inventory/stock/:id', hidden: true, parent: 'inventory-stock', permission: 'inventory.stock.view', page: 'stockDetail' },
      { id: 'inventory-receipt-create', label: 'New Receipt', path: '/inventory/stock-receipts/create', hidden: true, parent: 'inventory-receipts', permission: 'inventory.receipts.manage', page: 'receiptCreate' },
      { id: 'inventory-transfer-create', label: 'New Transfer', path: '/inventory/stock-transfers/create', hidden: true, parent: 'inventory-transfers', permission: 'inventory.transfers.manage', page: 'transferCreate' },
      { id: 'inventory-adjustment-create', label: 'New Adjustment', path: '/inventory/stock-adjustments/create', hidden: true, parent: 'inventory-adjustments', permission: 'inventory.adjustments.manage', page: 'adjustmentCreate' },
      { id: 'inventory-hub-stock', label: 'Hub Stock', path: '/inventory/hub-stock', hidden: true, permission: 'hubs.view', redirectTo: '/hubs' },
    ],
  },
  {
    id: 'dispatch',
    label: 'Dispatch',
    icon: Truck,
    children: [
      {
        id: 'dispatch-overview', label: 'Dispatch Dashboard', icon: LayoutDashboard, path: '/dispatch',
        permission: 'dispatch.view', page: 'dispatchDashboard',
        description: 'Ready orders, dispatch plans, drivers on the road and delivery outcomes.',
        keywords: ['dispatch', 'kpi', 'overview', 'logistics'],
      },
      {
        id: 'dispatch-ready', label: 'Ready for Dispatch', icon: PackageCheck, path: '/dispatch/ready-orders',
        permission: 'dispatch.ready.view', page: 'readyOrders',
        description: 'Orders released by Customer Service, waiting to be planned into a dispatch.',
        keywords: ['ready', 'queue', 'released'],
      },
      {
        id: 'dispatch-planning', label: 'Dispatch Planning', icon: Route, path: '/dispatch/planning',
        permission: 'dispatch.view', page: 'dispatchPlanning',
        description: 'Plan multi-order dispatches by hub and zone, set the delivery sequence and confirm loading.',
        keywords: ['plan', 'route', 'sequence', 'dispatch plan'],
      },
      {
        id: 'dispatch-assignments', label: 'Driver Assignment', icon: UserRoundCheck, path: '/dispatch/assignments',
        permission: 'dispatch.manage', page: 'dispatchAssignments',
        description: 'Assign drivers and vehicles to planned dispatches and confirm them.',
        keywords: ['driver', 'vehicle', 'assign', 'confirm'],
      },
      {
        id: 'dispatch-tracking', label: 'Delivery Tracking', icon: MapPinned, path: '/dispatch/delivery-tracking',
        permission: 'dispatch.tracking', page: 'deliveryTracking',
        description: 'Live status of every delivery stop: out for delivery, delivered, partial or failed.',
        keywords: ['track', 'live', 'status', 'otp'],
      },
      {
        id: 'dispatch-history', label: 'Delivery History', icon: History, path: '/dispatch/delivery-history',
        permission: 'dispatch.history', page: 'deliveryHistory',
        description: 'Closed deliveries, delivery notes and failed / partial deliveries awaiting review.',
        keywords: ['history', 'delivery notes', 'failed', 'review'],
      },
      {
        id: 'dispatch-zones', label: 'Dispatch Zones', icon: Map, path: '/dispatch/zones',
        permission: 'fleet.view', page: 'zoneList',
        description: 'Delivery zones per hub with their pincodes.',
        keywords: ['zones', 'pincode', 'area'],
      },
      {
        id: 'dispatch-drivers', label: 'Drivers', icon: IdCard, path: '/dispatch/drivers',
        permission: 'fleet.view', page: 'driverList',
        description: 'Driver records, licences, availability and delivery performance.',
        keywords: ['driver', 'licence', 'availability'],
      },
      {
        id: 'dispatch-vehicles', label: 'Vehicles', icon: Car, path: '/dispatch/vehicles',
        permission: 'fleet.view', page: 'vehicleList',
        description: 'Delivery vehicles, capacity and status.',
        keywords: ['vehicle', 'van', 'truck', 'capacity'],
      },
      {
        id: 'dispatch-reports', label: 'Delivery Reports', icon: FileBarChart, path: '/dispatch/reports',
        permission: 'dispatch.reports', page: 'dispatchReports',
        description: 'Dispatch register, driver performance, failed and partial deliveries, delivery notes, hub and zone reports.',
        keywords: ['reports', 'export', 'csv', 'performance'],
      },
      { id: 'dispatch-create', label: 'New Dispatch', path: '/dispatch/create', hidden: true, parent: 'dispatch-planning', permission: 'dispatch.manage', page: 'dispatchForm' },
      { id: 'dispatch-zone-create', label: 'New Zone', path: '/dispatch/zones/create', hidden: true, parent: 'dispatch-zones', permission: 'fleet.manage', page: 'zoneForm' },
      { id: 'dispatch-zone-edit', label: 'Edit Zone', path: '/dispatch/zones/:id/edit', hidden: true, parent: 'dispatch-zones', permission: 'fleet.manage', page: 'zoneForm' },
      {
        id: 'dispatch-live-tracking', label: 'Live Tracking (Demo GPS)', icon: MapPinned, path: '/dispatch/live-tracking',
        permission: 'tracking.fleet', page: 'fleetTracking',
        description: 'Drivers on the road with simulated DEMO GPS positions, ETAs and VIP late-arrival warnings.',
        keywords: ['gps', 'live', 'map', 'eta', 'vip'],
      },
      { id: 'dispatch-driver-create', label: 'New Driver', path: '/dispatch/drivers/create', hidden: true, parent: 'dispatch-drivers', permission: 'fleet.manage', page: 'driverForm' },
      { id: 'dispatch-driver-edit', label: 'Edit Driver', path: '/dispatch/drivers/:id/edit', hidden: true, parent: 'dispatch-drivers', permission: 'fleet.manage', page: 'driverForm' },
      { id: 'dispatch-driver-detail', label: 'Driver Details', path: '/dispatch/drivers/:id', hidden: true, parent: 'dispatch-drivers', permission: 'fleet.view', page: 'driverDetail' },
      { id: 'dispatch-vehicle-create', label: 'New Vehicle', path: '/dispatch/vehicles/create', hidden: true, parent: 'dispatch-vehicles', permission: 'fleet.manage', page: 'vehicleForm' },
      { id: 'dispatch-vehicle-edit', label: 'Edit Vehicle', path: '/dispatch/vehicles/:id/edit', hidden: true, parent: 'dispatch-vehicles', permission: 'fleet.manage', page: 'vehicleForm' },
      { id: 'dispatch-delivery-detail', label: 'Delivery Details', path: '/dispatch/deliveries/:id', hidden: true, parent: 'dispatch-tracking', permission: 'deliveries.view', page: 'deliveryDetail' },
      { id: 'dispatch-note', label: 'Delivery Note', path: '/dispatch/delivery-notes/:id', hidden: true, parent: 'dispatch-history', permission: 'deliveryNotes.view', page: 'deliveryNote' },
      { id: 'dispatch-edit', label: 'Edit Dispatch', path: '/dispatch/:id/edit', hidden: true, parent: 'dispatch-planning', permission: 'dispatch.manage', page: 'dispatchForm' },
      { id: 'dispatch-detail', label: 'Dispatch Details', path: '/dispatch/:id', hidden: true, parent: 'dispatch-planning', permission: 'dispatch.view', page: 'dispatchDetail' },
      // Phase 1 placeholders now served by the Phase 4 pages
      { id: 'dispatch-tracking-legacy', label: 'Delivery Tracking', path: '/dispatch/tracking', hidden: true, permission: 'dispatch.tracking', redirectTo: '/dispatch/delivery-tracking' },
      { id: 'my-deliveries-legacy', label: 'My Deliveries', path: '/deliveries', hidden: true, permission: 'driver.app', redirectTo: '/driver/deliveries' },
    ],
  },
  {
    id: 'driver',
    label: 'My Deliveries',
    icon: CalendarCheck,
    children: [
      { id: 'driver-dashboard', label: 'Today', icon: CalendarCheck, path: '/driver/dashboard', permission: 'driver.app', page: 'driverHome', description: "Today's dispatch, progress and next delivery.", keywords: ['driver', 'today', 'route'] },
      { id: 'driver-deliveries', label: 'My Deliveries', icon: ListChecks, path: '/driver/deliveries', permission: 'driver.app', page: 'driverDeliveries', description: 'Your delivery stops in sequence, upcoming dispatches and history.', keywords: ['driver', 'stops', 'history'] },
      { id: 'driver-route', label: 'Route', icon: Map, path: '/driver/route', permission: 'driver.app', page: 'driverRoute', description: 'Your stops on a DEMO GPS route map with ETAs.', keywords: ['route', 'map', 'eta'] },
      { id: 'driver-completed', label: 'Completed', icon: PackageCheck, path: '/driver/completed', permission: 'driver.app', page: 'driverCompleted', description: 'Deliveries you completed today with OTP and POD status.', keywords: ['completed', 'pod'] },
      { id: 'driver-notes', label: 'My Delivery Notes', icon: FileText, path: '/driver/delivery-notes', permission: 'driver.app', page: 'driverNotes', description: 'Delivery notes for your deliveries.', keywords: ['delivery note'] },
      { id: 'driver-profile', label: 'Driver Profile', icon: IdCard, path: '/driver/profile', permission: 'driver.app', page: 'driverProfile', description: 'Your driver details, licence and performance.', keywords: ['profile', 'licence'] },
      ...DRIVER_EXTRA_ITEMS,
      { id: 'driver-documents', label: 'My Documents', icon: FileText, path: '/driver/documents', permission: 'driver.app', page: 'driverDocuments', description: 'Your documents, your vehicle’s documents and expiry alerts.', keywords: ['documents', 'licence', 'upload proof'] },
      { id: 'driver-document', label: 'Document', path: '/driver/documents/:id', hidden: true, parent: 'driver-documents', permission: 'driver.app', page: 'driverDocument' },
      { id: 'driver-delivery-confirm', label: 'Confirm Delivery', path: '/driver/deliveries/:id/confirm', hidden: true, parent: 'driver-deliveries', permission: 'driver.app', page: 'driverConfirm' },
      { id: 'driver-delivery', label: 'Delivery', path: '/driver/deliveries/:id', hidden: true, parent: 'driver-deliveries', permission: 'driver.app', page: 'driverDelivery' },
      { id: 'driver-note', label: 'Delivery Note', path: '/driver/delivery-notes/:id', hidden: true, parent: 'driver-notes', permission: 'driver.app', page: 'driverNote' },
    ],
  },
  {
    id: 'customer',
    label: 'My Account (Customer)',
    icon: Contact,
    children: [
      { id: 'customer-dashboard', label: 'Home', icon: LayoutDashboard, path: '/customer/dashboard', permission: 'customer.app', page: 'customerHome', description: 'Your orders, deliveries and documents.', keywords: ['customer', 'home'] },
      { id: 'customer-catalog', label: 'Catalog', icon: Package, path: '/customer/catalog', permission: 'customer.app', page: 'customerCatalog', description: 'Browse products and add them to your cart.', keywords: ['catalog', 'products', 'shop'] },
      { id: 'customer-cart', label: 'Cart', icon: PackagePlus, path: '/customer/cart', permission: 'customer.order', page: 'customerCart', description: 'Review your cart and place an order.', keywords: ['cart', 'checkout'] },
      { id: 'customer-orders', label: 'My Orders', icon: ClipboardList, path: '/customer/orders', permission: 'customer.app', page: 'customerOrders', description: 'Your orders with approval and delivery status.', keywords: ['orders', 'history', 'reorder'] },
      { id: 'customer-order', label: 'Order', path: '/customer/orders/:id', hidden: true, parent: 'customer-orders', permission: 'customer.app', page: 'customerOrder' },
      { id: 'customer-tracking-list', label: 'Tracking', icon: NavigationIcon, path: '/customer/tracking', permission: 'customer.app', page: 'customerTrackingList', description: 'Deliveries on the way to you and recently delivered orders.', keywords: ['tracking', 'delivery', 'where is my order'] },
      { id: 'customer-tracking', label: 'Track Delivery', path: '/customer/tracking/:id', hidden: true, parent: 'customer-orders', permission: 'customer.app', page: 'customerTracking' },
      { id: 'customer-notes', label: 'Delivery Notes', icon: FileText, path: '/customer/delivery-notes', permission: 'customer.app', page: 'customerNotes', description: 'Delivery notes for your delivered orders.', keywords: ['delivery note', 'pod'] },
      { id: 'customer-note', label: 'Delivery Note', path: '/customer/delivery-notes/:id', hidden: true, parent: 'customer-notes', permission: 'customer.app', page: 'customerNote' },
      { id: 'customer-invoices', label: 'Invoices', icon: ReceiptText, path: '/customer/invoices', permission: 'customer.app', page: 'customerInvoices', description: 'Your invoices.', keywords: ['invoice', 'bill'] },
      { id: 'customer-invoice', label: 'Invoice', path: '/customer/invoices/:id', hidden: true, parent: 'customer-invoices', permission: 'customer.app', page: 'customerInvoice' },
      { id: 'customer-payments', label: 'Payments', icon: CreditCard, path: '/customer/payments', permission: 'customer.app', page: 'customerPayments', description: 'Outstanding balance and credit.', keywords: ['payments', 'outstanding', 'credit'] },
      { id: 'customer-profile', label: 'Profile', icon: UserCircle2, path: '/customer/profile', permission: 'customer.app', page: 'customerProfile', description: 'Your company details, addresses and credit.', keywords: ['profile', 'address'] },
      ...CUSTOMER_EXTRA_ITEMS,
    ],
  },
  {
    id: 'vms',
    label: 'Vehicle Management',
    icon: Truck,
    children: [
      { id: 'vms-dashboard', label: 'VMS Dashboard', icon: LayoutDashboard, path: '/vms', permission: 'vms.view', page: 'vmsDashboard', description: 'Fleet status, compliance and document expiry.', keywords: ['vms', 'fleet', 'compliance'] },
      { id: 'vms-vehicles', label: 'Vehicles', icon: Car, path: '/vms/vehicles', permission: 'vms.view', page: 'vmsVehicles', description: 'Vehicle register with specification, insurance and compliance.', keywords: ['vehicle', 'registration', 'insurance'] },
      { id: 'vms-drivers', label: 'Driver Documents', icon: IdCard, path: '/vms/drivers', permission: 'vms.view', page: 'vmsDrivers', description: 'Licence, ID, address proof and medical certificates.', keywords: ['driver', 'licence', 'medical'] },
      { id: 'vms-expiry', label: 'Document Expiry', icon: CalendarClock, path: '/vms/document-expiry', permission: 'vms.view', page: 'vmsExpiry', description: 'Expired and expiring vehicle and driver documents.', keywords: ['expiry', 'alerts', 'renewal'] },
      { id: 'vms-reports', label: 'VMS Reports', icon: FileBarChart, path: '/vms/reports', permission: 'vms.view', page: 'vmsReports', description: 'Vehicle register, expiry, document status and utilisation reports.', keywords: ['vms', 'reports'] },
      { id: 'vms-settings', label: 'Compliance Rules', icon: SlidersHorizontal, path: '/vms/settings', permission: 'vms.settings', page: 'vmsSettings', description: 'Required documents and expiry blocking for dispatch assignment.', keywords: ['compliance', 'rules', 'blocking'] },
      { id: 'vms-dashboard-alias', label: 'VMS Dashboard', path: '/vms/dashboard', hidden: true, permission: 'vms.view', redirectTo: '/vms' },
      { id: 'vms-vehicle-create', label: 'New Vehicle', path: '/vms/vehicles/create', hidden: true, parent: 'vms-vehicles', permission: 'vms.manage', page: 'vehicleForm' },
      { id: 'vms-vehicle-edit', label: 'Edit Vehicle', path: '/vms/vehicles/:id/edit', hidden: true, parent: 'vms-vehicles', permission: 'vms.manage', page: 'vehicleForm' },
      { id: 'vms-vehicle-docs', label: 'Vehicle Documents', path: '/vms/vehicles/:id/documents', hidden: true, parent: 'vms-vehicles', permission: 'vms.view', page: 'vmsVehicleDetail' },
      { id: 'vms-vehicle-detail', label: 'Vehicle Details', path: '/vms/vehicles/:id', hidden: true, parent: 'vms-vehicles', permission: 'vms.view', page: 'vmsVehicleDetail' },
      { id: 'vms-driver-docs', label: 'Driver Documents', path: '/vms/drivers/:id/documents', hidden: true, parent: 'vms-drivers', permission: 'vms.view', page: 'vmsDriverDocuments' },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FolderOpen,
    children: [
      { id: 'docs-repository', label: 'Document Repository', icon: FolderOpen, path: '/documents', permission: 'documents.view', page: 'documentRepository', description: 'All proofs and documents with OCR review and verification.', keywords: ['documents', 'proof', 'repository'] },
      { id: 'docs-upload', label: 'Upload Documents', icon: Upload, path: '/documents/upload', permission: 'documents.view', page: 'documentUpload', description: 'Upload one or more documents for an existing record.', keywords: ['upload', 'scan'] },
      { id: 'docs-queue', label: 'OCR Queue', icon: ScanText, path: '/documents/ocr-queue', permission: 'documents.view', page: 'ocrQueue', description: 'Documents waiting for OCR or review.', keywords: ['ocr', 'review', 'queue'] },
      { id: 'docs-verified', label: 'Verified', icon: BadgeCheck, path: '/documents/verified', permission: 'documents.view', page: 'verifiedDocuments', description: 'Verified documents.', keywords: ['verified'] },
      { id: 'docs-rejected', label: 'Rejected', icon: XCircle, path: '/documents/rejected', permission: 'documents.view', page: 'rejectedDocuments', description: 'Rejected documents awaiting replacement.', keywords: ['rejected'] },
      { id: 'docs-types', label: 'Document Types', icon: Settings2, path: '/documents/types', permission: 'documents.types', page: 'documentTypes', description: 'Configure document types and OCR fields.', keywords: ['types', 'configuration', 'ocr fields'] },
      { id: 'docs-reports', label: 'Document Reports', icon: FileBarChart, path: '/documents/reports', permission: 'documents.reports', page: 'documentReports', description: 'Document register, expiry and OCR reports.', keywords: ['reports'] },
      { id: 'docs-type-create', label: 'New Document Type', path: '/documents/types/create', hidden: true, parent: 'docs-types', permission: 'documents.types', page: 'documentTypeForm' },
      { id: 'docs-type-edit', label: 'Edit Document Type', path: '/documents/types/:id/edit', hidden: true, parent: 'docs-types', permission: 'documents.types', page: 'documentTypeForm' },
      { id: 'docs-review', label: 'OCR Review', path: '/documents/:id/review', hidden: true, parent: 'docs-queue', permission: 'documents.view', page: 'documentReview' },
      { id: 'docs-detail', label: 'Document', path: '/documents/:id', hidden: true, parent: 'docs-repository', permission: 'documents.view', page: 'documentDetail' },
    ],
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: ReceiptText,
    children: [
      { id: 'inv-dashboard', label: 'Invoice Dashboard', icon: LayoutDashboard, path: '/invoices/dashboard', permission: 'invoices.view', page: 'invoiceDashboard', description: 'Invoiced value and delivered orders still to invoice.', keywords: ['invoice', 'billing'] },
      { id: 'inv-list', label: 'Invoices', icon: ReceiptText, path: '/invoices', permission: 'invoices.view', page: 'invoiceList', description: 'Issued and cancelled invoices.', keywords: ['invoice', 'tax invoice'] },
      { id: 'inv-create', label: 'New Invoice', icon: FilePlus2, path: '/invoices/create', permission: 'invoices.manage', page: 'invoiceCreate', description: 'Generate an invoice for an approved order.', keywords: ['generate invoice'] },
      { id: 'inv-templates', label: 'Invoice Templates', icon: LayoutTemplate, path: '/invoices/templates', permission: 'invoices.templates', page: 'invoiceTemplates', description: 'Template builder and invoice numbering.', keywords: ['template', 'branding', 'numbering'] },
      { id: 'inv-reports', label: 'Invoice Reports', icon: FileBarChart, path: '/invoices/reports', permission: 'invoices.reports', page: 'invoiceReports', description: 'Invoice register and summaries.', keywords: ['reports'] },
      { id: 'inv-tpl-create', label: 'New Template', path: '/invoices/templates/create', hidden: true, parent: 'inv-templates', permission: 'invoices.templates', page: 'invoiceTemplateForm' },
      { id: 'inv-tpl-edit', label: 'Edit Template', path: '/invoices/templates/:id/edit', hidden: true, parent: 'inv-templates', permission: 'invoices.templates', page: 'invoiceTemplateForm' },
      { id: 'inv-tpl-preview', label: 'Template Preview', path: '/invoices/templates/:id/preview', hidden: true, parent: 'inv-templates', permission: 'invoices.view', page: 'invoiceTemplatePreview' },
      { id: 'inv-print', label: 'Print Invoice', path: '/invoices/:id/print', hidden: true, parent: 'inv-list', permission: 'invoices.view', page: 'invoicePrint' },
      { id: 'inv-detail', label: 'Invoice', path: '/invoices/:id', hidden: true, parent: 'inv-list', permission: 'invoices.view', page: 'invoiceDetail' },
    ],
  },
  // Enterprise departments (sales & CRM … HR, portals) — config/enterprise/navigation.js
  ...ENTERPRISE_NAVIGATION,
  {
    id: 'communication',
    label: 'Communication',
    icon: MessagesSquare,
    children: [
      { id: 'comm-center', label: 'Communication Center', icon: MessagesSquare, path: '/communication', permission: 'communication.view', page: 'communicationCenter', description: 'Email and WhatsApp drafts, inbox, sent, failed and templates.', keywords: ['communication', 'messages'] },
      { id: 'comm-email', label: 'Email', icon: Mail, path: '/communication/email', permission: 'communication.view', page: 'emailHome', description: 'SMTP sending and IMAP inbox through the backend gateway.', keywords: ['email', 'smtp', 'imap', 'inbox'] },
      { id: 'comm-whatsapp', label: 'WhatsApp', icon: MessageCircle, path: '/communication/whatsapp', permission: 'whatsapp.view', page: 'whatsappHome', description: 'WhatsApp through OpenWA, with a clearly labelled demo mode.', keywords: ['whatsapp', 'openwa'] },
      { id: 'comm-automation', label: 'Automated Notifications', icon: Zap, path: '/communication/automation', permission: 'communication.automation', page: 'automationSettings', description: 'Event-driven email / WhatsApp notifications.', keywords: ['automation', 'notification rules', 'events'] },
      {
        id: 'comm-calls', label: 'Call History', icon: PhoneCall, path: '/communication/calls',
        permission: 'communication.calls', page: 'callDashboard',
        description: 'Customer call log (manually recorded — no telephony connected) linked to customers, salesmen and the orders they produced.',
        keywords: ['calls', 'phone', 'call log'],
      },
      {
        id: 'comm-followups', label: 'Call Follow-ups', icon: CalendarClock, path: '/communication/calls/follow-ups',
        permission: 'communication.calls', page: 'callFollowUps',
        description: 'Follow-ups due today, upcoming, overdue and completed.',
        keywords: ['follow-up', 'call back', 'reminder'],
      },
      { id: 'comm-calls-list', label: 'All Calls', path: '/communication/calls/list', hidden: true, parent: 'comm-calls', permission: 'communication.calls', page: 'callList' },
      { id: 'comm-calls-create', label: 'Log a Call', path: '/communication/calls/create', hidden: true, parent: 'comm-calls', permission: 'calls.manage', page: 'callForm' },
      { id: 'comm-calls-edit', label: 'Edit Call', path: '/communication/calls/:id/edit', hidden: true, parent: 'comm-calls', permission: 'calls.manage', page: 'callForm' },
      { id: 'comm-calls-detail', label: 'Call Details', path: '/communication/calls/:id', hidden: true, parent: 'comm-calls', permission: 'communication.calls', page: 'callDetail' },
      { id: 'email-compose', label: 'Compose Email', path: '/communication/email/compose', hidden: true, parent: 'comm-email', permission: 'communication.send', page: 'emailCompose' },
      { id: 'email-inbox', label: 'Inbox', path: '/communication/email/inbox', hidden: true, parent: 'comm-email', permission: 'communication.inbox', page: 'emailInbox' },
      { id: 'email-sent', label: 'Sent', path: '/communication/email/sent', hidden: true, parent: 'comm-email', permission: 'communication.view', page: 'emailSent' },
      { id: 'email-drafts', label: 'Drafts', path: '/communication/email/drafts', hidden: true, parent: 'comm-email', permission: 'communication.send', page: 'emailDrafts' },
      { id: 'email-history', label: 'History', path: '/communication/email/history', hidden: true, parent: 'comm-email', permission: 'communication.view', page: 'emailHistory' },
      { id: 'email-templates', label: 'Email Templates', path: '/communication/email/templates', hidden: true, parent: 'comm-email', permission: 'communication.view', page: 'emailTemplateList' },
      { id: 'email-template-create', label: 'New Template', path: '/communication/email/templates/create', hidden: true, parent: 'email-templates', permission: 'communication.templates', page: 'emailTemplateForm' },
      { id: 'email-template-edit', label: 'Edit Template', path: '/communication/email/templates/:id/edit', hidden: true, parent: 'email-templates', permission: 'communication.templates', page: 'emailTemplateForm' },
      { id: 'email-settings', label: 'Email Settings', path: '/communication/email/settings', hidden: true, parent: 'comm-email', permission: 'communication.settings', page: 'emailSettings' },
      { id: 'wa-compose', label: 'Compose', path: '/communication/whatsapp/compose', hidden: true, parent: 'comm-whatsapp', permission: 'whatsapp.send', page: 'whatsappCompose' },
      { id: 'wa-history', label: 'History', path: '/communication/whatsapp/history', hidden: true, parent: 'comm-whatsapp', permission: 'whatsapp.view', page: 'whatsappHistory' },
      { id: 'wa-templates', label: 'WhatsApp Templates', path: '/communication/whatsapp/templates', hidden: true, parent: 'comm-whatsapp', permission: 'whatsapp.view', page: 'whatsappTemplateList' },
      { id: 'wa-template-create', label: 'New Template', path: '/communication/whatsapp/templates/create', hidden: true, parent: 'wa-templates', permission: 'communication.templates', page: 'whatsappTemplateForm' },
      { id: 'wa-template-edit', label: 'Edit Template', path: '/communication/whatsapp/templates/:id/edit', hidden: true, parent: 'wa-templates', permission: 'communication.templates', page: 'whatsappTemplateForm' },
      { id: 'wa-settings', label: 'OpenWA Settings', path: '/communication/whatsapp/settings', hidden: true, parent: 'comm-whatsapp', permission: 'communication.settings', page: 'whatsappSettings' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: ShieldCheck,
    children: [
      { id: 'admin-users', label: 'User Management', icon: UserCog, path: '/admin/users', permission: 'users.view', page: 'userList', description: 'Users, their roles, hubs and status — create, edit, activate, reset demo passwords and export.', keywords: ['users', 'accounts', 'employees', 'staff'] },
      { id: 'admin-roles', label: 'Role Management', icon: KeyRound, path: '/admin/roles', permission: 'roles.view', page: 'roleList', description: 'System and custom roles — create, edit, duplicate and delete, with module, page and action permissions.', keywords: ['roles', 'permissions', 'rbac'] },
      { id: 'admin-permissions', label: 'Permission Matrix', icon: Grid3x3, path: '/admin/permissions', permission: 'roles.view', page: 'permissionMatrix', description: 'Every role against every module and action in one grid.', keywords: ['matrix', 'permissions', 'access'] },
      { id: 'admin-assignment', label: 'User Role Assignment', icon: UsersRound, path: '/admin/role-assignment', permission: 'users.manage', page: 'roleAssignment', description: 'Assign primary and additional roles and hubs to users.', keywords: ['assign roles', 'multiple roles', 'hub'] },
      { id: 'admin-audit', label: 'Audit Log', icon: ScrollText, path: '/admin/audit-logs', permission: 'audit.view', page: 'auditLog', description: 'Who did what and when — logins, creates, edits, deletes, approvals, rejections, status and settings changes.', keywords: ['audit', 'history', 'log', 'trail'] },
      { id: 'admin-settings', label: 'Application Settings', icon: SlidersHorizontal, path: '/admin/settings', permission: 'settings.view', page: 'appSettings', description: 'General, localization, currency, numbering, notifications, security, approval, inventory, warehouse, cold chain, integration and AI settings.', keywords: ['configuration', 'numbering', 'timezone', 'currency', 'security'] },
      { id: 'admin-user-create', label: 'Create User', path: '/admin/users/create', hidden: true, parent: 'admin-users', permission: 'users.create', page: 'userForm' },
      { id: 'admin-user-edit', label: 'Edit User', path: '/admin/users/:id/edit', hidden: true, parent: 'admin-users', permission: 'users.edit', page: 'userForm' },
      { id: 'admin-user-detail', label: 'User Details', path: '/admin/users/:id', hidden: true, parent: 'admin-users', permission: 'users.view', page: 'userDetail' },
      { id: 'admin-role-create', label: 'Create Role', path: '/admin/roles/create', hidden: true, parent: 'admin-roles', permission: 'roles.create', page: 'roleForm' },
      { id: 'admin-role-edit', label: 'Edit Role', path: '/admin/roles/:id/edit', hidden: true, parent: 'admin-roles', permission: 'roles.edit', page: 'roleForm' },
      { id: 'admin-role-detail', label: 'Role Details', path: '/admin/roles/:id', hidden: true, parent: 'admin-roles', permission: 'roles.view', page: 'roleDetail' },
    ],
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: Building2,
    children: [
      { id: 'org-company', label: 'Company', icon: Building2, path: '/admin/organization/company', permission: 'organization.view', page: 'companyProfile', description: 'Company name, logo, address, country, currency and tax registration number.', keywords: ['company', 'trn', 'logo', 'address'] },
      { id: 'org-branches', label: 'Branches', icon: GitBranch, path: '/admin/organization/branches', permission: 'organization.view', page: 'orgBranches', description: 'Head office and branch offices.', keywords: ['branch', 'office'] },
      { id: 'org-units', label: 'Business Units', icon: Network, path: '/admin/organization/business-units', permission: 'organization.view', page: 'orgBusinessUnits', description: 'Business units for reporting and ownership.', keywords: ['business unit', 'division'] },
      { id: 'org-departments', label: 'Departments', icon: Briefcase, path: '/admin/organization/departments', permission: 'organization.view', page: 'orgDepartments', description: 'Departments by branch and business unit.', keywords: ['department'] },
      { id: 'org-designations', label: 'Designations', icon: Award, path: '/admin/organization/designations', permission: 'organization.view', page: 'orgDesignations', description: 'Job titles per department.', keywords: ['designation', 'job title', 'position'] },
      { id: 'org-employees', label: 'Employee Master', icon: Contact, path: '/admin/organization/employees', permission: ['organization.view', 'users.view'], page: 'employeeMaster', description: 'Employees with ID, department, designation, hub and role.', keywords: ['employee', 'staff', 'directory'] },
      { id: 'org-hubs', label: 'Hub Master', icon: Warehouse, path: '/admin/organization/hubs', permission: 'hubs.view', redirectTo: '/hubs', description: 'Hubs are managed in the Hubs master (Phase 2).', keywords: ['hub'] },
      { id: 'org-warehouses', label: 'Warehouse Master', icon: Boxes, path: '/admin/organization/warehouses', permission: 'organization.view', page: 'orgWarehouses', description: 'Storage areas inside each hub with type, temperature range and capacity.', keywords: ['warehouse', 'cold room', 'chiller', 'frozen'] },
    ],
  },
  {
    id: 'ai',
    label: 'AI & Intelligence',
    icon: BrainCircuit,
    children: [
      { id: 'ai-overview', label: 'AI Overview', icon: Sparkles, path: '/ai', permission: 'ai.assistant.view', page: 'aiOverview', description: 'AI insights, recommendations, provider status and recent AI activity.', keywords: ['ai', 'artificial intelligence', 'overview'] },
      { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, path: '/ai/assistant', permission: 'ai.assistant.view', page: 'aiAssistant', description: 'Ask questions about orders, stock, deliveries and sales in plain language.', keywords: ['chat', 'assistant', 'ask', 'question'] },
      { id: 'ai-jarvis', label: 'Jarvis', icon: Mic, path: '/ai/jarvis', permission: 'jarvis.view', page: 'jarvis', description: 'Voice and text command assistant.', keywords: ['voice', 'jarvis', 'speech', 'commands'] },
      { id: 'ai-forecasting', label: 'Forecasting', icon: LineChart, path: '/ai/forecasting', permission: 'forecasting.view', page: 'forecastDashboard', description: 'Sales, order and demand forecasts with backtest accuracy.', keywords: ['forecast', 'prediction', 'sales forecast', 'ml'] },
      { id: 'ai-predictive', label: 'Predictive Inventory', icon: Gauge, path: '/ai/predictive-inventory', permission: 'inventory.predictions.view', page: 'predictiveDashboard', description: 'Stock-out prediction, reorder points and inventory risk.', keywords: ['stock-out', 'reorder', 'replenishment', 'safety stock'] },
      { id: 'ai-replenishment', label: 'Replenishment', icon: ClipboardCheck, path: '/ai/replenishment', permission: 'procurement.view', page: 'replenishmentList', description: 'Replenishment drafts and approvals.', keywords: ['purchase', 'replenishment', 'draft'] },
      { id: 'ai-insights', label: 'AI Insights', icon: Lightbulb, path: '/ai/insights', permission: 'ai.insights.view', page: 'aiInsights', description: 'Automatically detected business signals.', keywords: ['insights', 'alerts', 'trends'] },
      { id: 'ai-models', label: 'Model Management', icon: Cpu, path: '/ai/models', permission: ['forecasting.view', 'ai.models.manage'], page: 'modelManagement', description: 'Forecasting and assistant models with real backtest performance.', keywords: ['models', 'ml models'] },
      { id: 'ai-settings', label: 'AI Settings', icon: Settings2, path: '/ai/settings', permission: 'ai.settings.manage', page: 'aiSettings', description: 'AI provider, OpenJarvis / Ollama connection and data-sharing policy.', keywords: ['openjarvis', 'ollama', 'provider', 'api'] },
      { id: 'ai-activity', label: 'AI Activity', icon: Activity, path: '/ai/activity', hidden: true, parent: 'ai-overview', permission: 'ai.assistant.view', page: 'aiActivity' },
      { id: 'ai-forecast-new', label: 'New Forecast', path: '/ai/forecasting/new', hidden: true, parent: 'ai-forecasting', permission: 'forecasting.generate', page: 'forecastCreate' },
      { id: 'ai-forecast-history', label: 'Forecast History', path: '/ai/forecasting/history', hidden: true, parent: 'ai-forecasting', permission: 'forecasting.view', page: 'forecastHistory' },
      { id: 'ai-forecast-compare', label: 'Compare Forecasts', path: '/ai/forecasting/compare', hidden: true, parent: 'ai-forecasting', permission: 'forecasting.view', page: 'forecastCompare' },
      { id: 'ai-forecast-print', label: 'Forecast Report', path: '/ai/forecasting/:id/print', hidden: true, parent: 'ai-forecasting', permission: 'forecasting.export', page: 'forecastPrint' },
      { id: 'ai-forecast-detail', label: 'Forecast', path: '/ai/forecasting/:id', hidden: true, parent: 'ai-forecasting', permission: 'forecasting.view', page: 'forecastDetail' },
      { id: 'ai-reorder', label: 'Reorder Recommendations', path: '/ai/predictive-inventory/reorder', hidden: true, parent: 'ai-predictive', permission: 'inventory.predictions.view', page: 'reorderRecommendations' },
      { id: 'ai-risks', label: 'Inventory Risk Analysis', path: '/ai/predictive-inventory/risks', hidden: true, parent: 'ai-predictive', permission: 'inventory.predictions.view', page: 'inventoryRisks' },
      { id: 'ai-demand', label: 'Demand Forecasting', path: '/ai/predictive-inventory/demand', hidden: true, parent: 'ai-predictive', permission: 'inventory.predictions.view', page: 'demandForecasting' },
      { id: 'ai-planning', label: 'Planning Parameters', path: '/ai/predictive-inventory/settings', hidden: true, parent: 'ai-predictive', permission: 'inventory.predictions.view', page: 'planningParameters' },
      { id: 'ai-line', label: 'Prediction Detail', path: '/ai/predictive-inventory/lines/:id', hidden: true, parent: 'ai-predictive', permission: 'inventory.predictions.view', page: 'predictionLine' },
      { id: 'ai-replenishment-create', label: 'New Replenishment Draft', path: '/ai/replenishment/create', hidden: true, parent: 'ai-replenishment', permission: 'inventory.replenishment.create', page: 'replenishmentCreate' },
      { id: 'ai-replenishment-detail', label: 'Replenishment Draft', path: '/ai/replenishment/:id', hidden: true, parent: 'ai-replenishment', permission: 'procurement.view', page: 'replenishmentDetail' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    children: [
      {
        id: 'reports-orders', label: 'Order Reports', icon: FileBarChart, path: '/reports', hidden: true,
        permission: 'orders.reports', redirectTo: '/reports/center?category=sales',
        description: 'Orders, approvals and rejections by period, salesman and customer — exportable.',
        keywords: ['analytics', 'export'],
      },
      {
        id: 'reports-delivery', label: 'Delivery Reports', icon: Truck, path: '/reports/deliveries', hidden: true,
        permission: 'dispatch.reports', redirectTo: '/reports/center?category=dispatch',
        description: 'On-time delivery, OTP confirmations and delivery problems by zone and driver.',
        keywords: ['on-time', 'performance'],
      },
      {
        id: 'reports-center', label: 'Reports Center', icon: FileBarChart, path: '/reports/center',
        permission: 'reports.center', page: 'reportsCenter',
        description: 'Every report in one place — sales, inventory, purchasing, delivery, finance, customers, documents, fleet, calls, scrap, HR and AI — with filters, charts and CSV.',
        keywords: ['reports', 'analytics', 'export', 'register'],
      },
      { id: 'reports-view', label: 'Report', path: '/reports/view/:id', hidden: true, parent: 'reports-center', permission: 'reports.center', page: 'reportViewer' },
      {
        id: 'reports-inventory', label: 'Inventory Reports', icon: FileText, path: '/reports/inventory', hidden: true,
        permission: 'reports.center', redirectTo: '/reports/center?category=inventory',
      },
      {
        id: 'reports-invoices', label: 'Invoice Reports', icon: ReceiptText, path: '/reports/invoices', hidden: true, redirectTo: '/reports/center?category=finance',
        permission: 'invoices.reports',
      },
    ],
  },
  {
    id: 'workspace',
    label: 'Project Workspace',
    icon: Library,
    children: [
      {
        id: 'mobile-preview', label: 'Mobile App Preview', icon: Smartphone, path: '/mobile-preview',
        permission: 'mobile.preview', page: 'mobilePreview',
        description: 'Device emulator running the real Driver and Customer apps in an Android or iPhone frame — sizes, rotation, zoom and fullscreen.',
        keywords: ['emulator', 'device', 'phone', 'mobile', 'driver app', 'customer app', 'preview'],
      },
      {
        id: 'project-documents', label: 'Project Documents', icon: Library, path: '/project-documents',
        permission: 'project.documents.view', page: 'projectDocuments',
        description: 'The project documentation library — open, preview and download documents one by one, by selection, by category or all as a ZIP.',
        keywords: ['documentation', 'brd', 'srs', 'manual', 'download', 'zip', 'pdf', 'word', 'excel'],
      },
    ],
  },
  {
    id: 'settings',
    label: 'My Account',
    icon: Settings,
    children: [
      { id: 'profile', label: 'My Profile', icon: UserCircle2, path: '/profile', public: true, page: 'userProfile', description: 'Your profile, roles, permissions, session and recent activity.', keywords: ['account', 'avatar', 'profile'] },
      { id: 'notifications', label: 'Notification Center', icon: Bell, path: '/notifications', public: true, page: 'notificationCenter', description: 'All notifications with categories, filters, read status, history and preferences.', keywords: ['alerts', 'notifications', 'inbox'] },
      { id: 'change-password', label: 'Change Password', icon: LockKeyhole, path: '/account/change-password', public: true, page: 'changePassword', description: 'Change your demo password.', keywords: ['password', 'security'] },
      { id: 'preferences', label: 'Preferences', icon: Settings, path: '/settings', public: true, page: 'settings', description: 'Theme, sidebar, demo environment, backup and reset.', keywords: ['theme', 'dark mode', 'export', 'import', 'reset demo'] },
      { id: 'logout', label: 'Sign Out', icon: LogOut, path: '/logout', hidden: true, public: true, page: 'logoutConfirm' },
    ],
  },
]

/** Routable pages that belong to a top-level item (no sidebar entry). */
const HIDDEN_TOP_LEVEL = [
  { id: 'products-create', label: 'Add Product', path: '/products/create', hidden: true, parent: 'products', permission: 'products.manage', page: 'productForm' },
  { id: 'products-detail', label: 'Product Details', path: '/products/:id', hidden: true, parent: 'products', permission: 'products.view', page: 'productDetail' },
  { id: 'products-edit', label: 'Edit Product', path: '/products/:id/edit', hidden: true, parent: 'products', permission: 'products.manage', page: 'productForm' },
  { id: 'hubs-create', label: 'Add Hub', path: '/hubs/create', hidden: true, parent: 'hubs', permission: 'hubs.manage', page: 'hubForm' },
  { id: 'hubs-detail', label: 'Hub Details', path: '/hubs/:id', hidden: true, parent: 'hubs', permission: 'hubs.view', page: 'hubDetail' },
  { id: 'hubs-edit', label: 'Edit Hub', path: '/hubs/:id/edit', hidden: true, parent: 'hubs', permission: 'hubs.manage', page: 'hubForm' },
]

/* ------------------------------------------------------------------ */
/* Sidebar: one menu per business area, in Order-to-Delivery order      */
/* ------------------------------------------------------------------ */

const REPORTS_AT = (category) => `/reports/center?category=${category}`
/** Module report pages were merged into the Reports Center; their URLs stay valid as redirects. */
const MOVED_TO_REPORTS = (category) => ({ hidden: true, page: undefined, redirectTo: REPORTS_AT(category) })

/**
 * Sidebar layout. Every source item appears exactly once: listed items bring their hidden create / detail / edit
 * pages (items whose `parent` chain leads to them). `patch` relabels, hides or redirects an item; `appOnly` groups
 * (driver and customer apps) stay routable but are not listed in the office sidebar — they have their own tab bars.
 */
const SIDEBAR = [
  { item: 'dashboard' },
  { id: 'management', items: ['mgmt-dashboard', 'control-tower', 'ops-exceptions'] },
  { id: 'orders', label: 'Orders', icon: ClipboardList, items: ['orders-create', 'orders-mine', 'orders-list', 'orders-approval', 'orders-consolidation', 'orders-returned', 'orders-rejected', 'sales-order-changes', 'sales-returns', 'orders-reports'] },
  { id: 'sales-crm', items: ['sales-dashboard', 'sales-leads', 'sales-opportunities', 'sales-activities', 'sales-targets', 'sales-commission', 'sales-pricing'] },
  { id: 'customers', items: ['customers-list', 'customers-credit', 'horeca-accounts', 'horeca-templates', 'service-tickets'] },
  { id: 'van-sales', label: 'Van Sales', icon: Truck, items: ['van-dashboard', 'van-app', 'van-routes', 'van-sales-list', 'van-settlements'] },
  { id: 'master-data', label: 'Master Data', icon: Package, items: ['products', 'suppliers', 'hubs'] },
  { id: 'procurement', items: ['proc-dashboard', 'proc-requisitions', 'proc-rfqs', 'proc-quotes', 'proc-pos', 'proc-supplier-performance', 'import-dashboard', 'import-shipments'] },
  { id: 'inventory', items: ['inventory-dashboard', 'inventory-stock', 'inventory-low', 'inv-batches', 'inventory-receipts', 'inventory-transfers', 'inventory-adjustments', 'inv-counts', 'inventory-movements', 'inventory-scrap', 'inv-recalls', 'inventory-hub-stock'] },
  { id: 'wms', label: 'Warehouse', items: ['wms-dashboard', 'inventory-warehouse', 'wms-receiving', 'wms-putaway', 'wms-picking', 'wms-packing', 'wms-loading', 'wms-locations'] },
  { id: 'quality', items: ['inventory-quality', 'qa-inspections', 'qa-temperature', 'qa-ncr'] },
  { id: 'dispatch', label: 'Dispatch & Delivery', items: ['dispatch-overview', 'dispatch-ready', 'dispatch-planning', 'log-routes', 'dispatch-assignments', 'dispatch-tracking', 'dispatch-live-tracking', 'dispatch-history', 'log-reschedules', 'log-dashboard', 'dispatch-zones', 'dispatch-reports', 'dispatch-tracking-legacy', 'my-deliveries-legacy'] },
  { id: 'fleet', label: 'Fleet & Vehicles', icon: Car, items: ['vms-dashboard', 'fleet-dashboard', 'vms-vehicles', 'dispatch-vehicles', 'dispatch-drivers', 'vms-drivers', 'vms-expiry', 'fleet-maintenance', 'fleet-fuel', 'driver-expenses', 'vms-settings', 'vms-reports', 'vms-dashboard-alias'] },
  { id: 'documents', items: ['docs-repository', 'docs-upload', 'docs-queue', 'docs-verified', 'docs-rejected', 'docs-types', 'docs-reports'] },
  { id: 'finance', items: ['fin-dashboard', 'inv-dashboard', 'inv-list', 'inv-create', 'fin-payments', 'fin-credit-notes', 'fin-receivables', 'fin-payables', 'fin-supplier-invoices', 'fin-supplier-payments', 'fin-expenses', 'fin-cash', 'fin-vouchers', 'fin-cash-closing', 'fin-vat', 'inv-templates', 'inv-reports'] },
  { id: 'hr' },
  { id: 'communication' },
  { id: 'self-service' },
  { id: 'ai', items: ['ai-overview', 'ai-assistant', 'ai-jarvis', 'ai-insights', 'ai-forecasting', 'ai-predictive', 'ai-replenishment', 'ai-models', 'ai-settings'] },
  { id: 'reports' },
  { id: 'admin' },
  { id: 'organization', items: ['org-company', 'org-branches', 'org-units', 'org-departments', 'org-designations', 'org-warehouses', 'org-employees', 'org-hubs'] },
  { id: 'workspace' },
  { id: 'settings' },
  { id: 'driver', appOnly: true },
  { id: 'customer', appOnly: true },
]

const PATCH = {
  // Filtered views that duplicate a list's own filters / tabs stay routable but leave the sidebar
  'orders-rejected': { hidden: true },
  'docs-verified': { hidden: true },
  'docs-rejected': { hidden: true },
  'inv-create': { hidden: true, parent: 'inv-list' },
  'org-hubs': { hidden: true },
  'org-employees': { hidden: true, description: 'User accounts by department and designation. Employee records are kept in Human Resources › Employees.' },
  'inventory-warehouse': { hidden: true, label: 'Warehouse Overview' },
  // One Vehicles list (VMS register with capacity, assignment and compliance)
  'dispatch-vehicles': { hidden: true, page: undefined, redirectTo: '/vms/vehicles' },
  'vms-vehicles': { permission: ['vms.view', 'fleet.view'], description: 'The one vehicle register: capacity, hub, regular driver, current dispatch, status and document compliance.' },
  'vms-vehicle-detail': { permission: ['vms.view', 'fleet.view'] },
  'vms-vehicle-docs': { permission: ['vms.view', 'fleet.view'] },
  'vms-vehicle-create': { permission: ['vms.manage', 'fleet.manage'] },
  'vms-vehicle-edit': { permission: ['vms.manage', 'fleet.manage'] },
  'dispatch-vehicle-create': { parent: 'vms-vehicles' },
  'dispatch-vehicle-edit': { parent: 'vms-vehicles' },
  // Clear names
  'wms-dashboard': { label: 'Warehouse Dashboard' },
  'inventory-quality': { label: 'QA Dashboard' },
  'log-dashboard': { label: 'Delivery Performance' },
  'vms-dashboard': { label: 'Fleet Compliance' },
  'dispatch-drivers': { label: 'Drivers' },
  'ai-jarvis': { label: 'Jarvis (Voice)' },
  'horeca-templates': { label: 'Standing Orders' },
  'service-tickets': { label: 'Service Tickets' },
  'sales-returns': { label: 'Sales Returns' },
  'sales-order-changes': { label: 'Order Change Requests' },
  // Report screens merged into the Reports Center
  'orders-reports': MOVED_TO_REPORTS('sales'),
  'dispatch-reports': MOVED_TO_REPORTS('dispatch'),
  'vms-reports': MOVED_TO_REPORTS('fleet'),
  'docs-reports': MOVED_TO_REPORTS('documents'),
  'inv-reports': MOVED_TO_REPORTS('finance'),
}

const SOURCE_GROUPS = Object.fromEntries(SOURCE.filter((e) => e.children).map((e) => [e.id, e]))
const SOURCE_ITEMS = SOURCE.flatMap((e) => (e.children ? e.children : [e])).concat(HIDDEN_TOP_LEVEL)
const childrenOf = (id) => SOURCE_ITEMS.filter((i) => i.parent === id && !i.children).flatMap((c) => [c, ...childrenOf(c.id)])
const patched = (item, extra = {}) => ({ ...item, ...(PATCH[item.id] || {}), ...extra })
const withChildren = (id) => {
  const item = SOURCE_ITEMS.find((i) => i.id === id)
  if (!item) throw new Error(`navigation: unknown item ${id}`)
  return [item, ...childrenOf(id)]
}

export const NAVIGATION = SIDEBAR.map((entry) => {
  if (entry.item) return patched(SOURCE_ITEMS.find((i) => i.id === entry.item))
  const source = SOURCE_GROUPS[entry.id] || {}
  const list = entry.items ? entry.items.flatMap(withChildren) : source.children
  const children = [...new globalThis.Map(list.map((i) => [i.id, i])).values()].map((i) => patched(i, entry.appOnly ? { hidden: true } : {}))
  return { id: entry.id, label: entry.label || source.label, icon: entry.icon || source.icon, appOnly: Boolean(entry.appOnly), children }
})

/** Flat list of every routable item, with its parent group attached. */
export const NAV_ITEMS = NAVIGATION.flatMap((entry) =>
  entry.children
    ? entry.children.map((child) => ({ ...child, group: { id: entry.id, label: entry.label } }))
    : [{ ...entry, group: null }],
)

export const findNavItemById = (id) => NAV_ITEMS.find((item) => item.id === id)

/** Exact path first, then route patterns (static segments win over :params, as in React Router). */
export const findNavItemByPath = (pathname) =>
  NAV_ITEMS.find((item) => item.path === pathname) ||
  NAV_ITEMS.filter((item) => item.path.includes(':')).find((item) => matchPath({ path: item.path, end: true }, pathname))

const permissionsOf = (item) => (Array.isArray(item.permission) ? item.permission : item.permission ? [item.permission] : [])

/**
 * subject: a user ({ role, additionalRoles }), a role code or an array of role codes.
 * AI pages also follow Application Settings › AI › "AI features enabled".
 */
export const canAccessItem = (item, subject) => {
  if (!item || !subject) return false
  if (item.group?.id === 'ai' && getUiConfig().aiFeaturesEnabled === false) return false
  if (item.public) return true
  const keys = permissionsOf(item)
  return keys.length > 0 && keys.some((k) => can(subject, k))
}

export const canAccessPath = (pathname, subject) => {
  const item = findNavItemByPath(pathname)
  return item ? canAccessItem(item, subject) : true
}

/** Navigation tree filtered for a user — groups with no visible children are removed. */
export const getNavigationForRole = (subject) =>
  NAVIGATION.map((entry) => {
    if (!entry.children) return canAccessItem({ ...entry, group: null }, subject) ? entry : null
    const children = entry.children.filter((c) => !c.hidden && canAccessItem({ ...c, group: { id: entry.id } }, subject))
    return children.length ? { ...entry, children } : null
  }).filter(Boolean)

/** Permission keys an item needs (for the Unauthorized page and Coming-soon notes). */
export const itemPermissions = permissionsOf
