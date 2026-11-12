/**
 * RBAC catalog — the single definition of modules, actions, permission keys, system roles and data scopes.
 *
 * Every permission key that the app checks (navigation, routes, buttons and service actions) is listed here,
 * attached to one module × action cell of the permission matrix. A cell can hold several keys (e.g. Inventory › View
 * holds the stock, low-stock and movement pages); toggling the cell grants or revokes all of them, and each key can
 * also be set individually as a page or action permission.
 *
 * Prototype only: permissions are enforced in the browser by the same code paths that would call a server.
 */
import { ENTERPRISE_PERMISSIONS, ENTERPRISE_RBAC_MODULES } from './enterprise/permissionCatalog'

export const ACTIONS = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
  { id: 'approve', label: 'Approve' },
  { id: 'reject', label: 'Reject' },
  { id: 'export', label: 'Export' },
  { id: 'import', label: 'Import' },
  { id: 'manage', label: 'Manage' },
]

export const MODULES = [
  { id: 'dashboard', label: 'Dashboard', group: 'General' },
  { id: 'customers', label: 'Customers', group: 'Master data' },
  { id: 'products', label: 'Products', group: 'Master data' },
  { id: 'suppliers', label: 'Suppliers', group: 'Master data' },
  { id: 'procurement', label: 'Procurement', group: 'Supply chain' },
  { id: 'inventory', label: 'Inventory', group: 'Supply chain' },
  { id: 'warehouse', label: 'Warehouse', group: 'Supply chain' },
  { id: 'sales', label: 'Sales', group: 'Order to cash' },
  { id: 'orders', label: 'Orders', group: 'Order to cash' },
  { id: 'dispatch', label: 'Dispatch', group: 'Logistics' },
  { id: 'delivery', label: 'Delivery', group: 'Logistics' },
  { id: 'vms', label: 'VMS', group: 'Logistics' },
  { id: 'documents', label: 'Documents', group: 'Documents & billing' },
  { id: 'invoices', label: 'Invoices', group: 'Documents & billing' },
  { id: 'email', label: 'Email', group: 'Communication' },
  { id: 'whatsapp', label: 'WhatsApp', group: 'Communication' },
  { id: 'ai', label: 'AI', group: 'Intelligence' },
  { id: 'reports', label: 'Reports', group: 'Intelligence' },
  { id: 'finance', label: 'Finance', group: 'Order to cash' },
  { id: 'settings', label: 'Settings', group: 'Administration' },
  { id: 'project', label: 'Project workspace', group: 'Administration' },
  ...ENTERPRISE_RBAC_MODULES,
]

/** kind: 'page' gates a screen or menu item; 'action' gates a button / service operation. */
const P = (key, module, action, label, kind = 'action', note = '') => ({ key, module, action, label, kind, note })

export const PERMISSION_CATALOG = [
  P('dashboard.view', 'dashboard', 'view', 'Role dashboard', 'page'),

  P('customers.view', 'customers', 'view', 'Customer list & details', 'page'),
  P('customers.credit.view', 'customers', 'view', 'Customer credit', 'page'),
  P('customers.manage', 'customers', 'manage', 'Create, edit and delete customers'),

  P('products.view', 'products', 'view', 'Product catalogue', 'page'),
  P('products.manage', 'products', 'manage', 'Create, edit and delete products'),

  P('suppliers.view', 'suppliers', 'view', 'Supplier directory', 'page'),
  P('suppliers.manage', 'suppliers', 'manage', 'Edit supplier records'),

  P('procurement.view', 'procurement', 'view', 'Replenishment drafts', 'page'),
  P('inventory.replenishment.create', 'procurement', 'create', 'Create & submit replenishment drafts'),
  P('procurement.approve', 'procurement', 'approve', 'Approve & convert replenishment drafts'),
  P('procurement.reject', 'procurement', 'reject', 'Reject replenishment drafts'),

  P('inventory.dashboard', 'inventory', 'view', 'Inventory dashboard', 'page'),
  P('inventory.stock.view', 'inventory', 'view', 'Stock overview', 'page'),
  P('inventory.lowstock.view', 'inventory', 'view', 'Low stock', 'page'),
  P('inventory.movements.view', 'inventory', 'view', 'Stock movement ledger', 'page'),
  P('inventory.documents.view', 'inventory', 'view', 'Receipts, transfers & adjustments lists', 'page'),
  P('inventory.scrap.view', 'inventory', 'view', 'Scrap management', 'page'),
  P('scrap.create', 'inventory', 'create', 'Create, edit & submit scrap requests'),
  P('scrap.approve', 'inventory', 'approve', 'Approve scrap & post the stock write-off'),
  P('scrap.reject', 'inventory', 'reject', 'Reject scrap requests'),
  P('inventory.predictions.view', 'inventory', 'view', 'Predictive inventory', 'page'),
  P('inventory.adjustments.manage', 'inventory', 'edit', 'Post stock adjustments'),
  P('inventory.predictions.manage', 'inventory', 'manage', 'Planning parameters & recommendation status'),

  P('warehouse.dashboard', 'warehouse', 'view', 'Warehouse dashboard', 'page'),
  P('warehouse.qa.view', 'warehouse', 'view', 'QA & cold-chain overview', 'page'),
  P('hubs.view', 'warehouse', 'view', 'Hubs & warehouses', 'page'),
  P('inventory.receipts.manage', 'warehouse', 'create', 'Receive stock (GRN)'),
  P('inventory.transfers.manage', 'warehouse', 'edit', 'Stock transfers between hubs'),
  P('hubs.manage', 'warehouse', 'manage', 'Create, edit and delete hubs'),

  P('orders.mine', 'sales', 'view', 'My orders', 'page'),
  P('orders.corrections.view', 'sales', 'view', 'Returned & rejected orders', 'page'),
  P('orders.create', 'sales', 'create', 'Create & edit sales orders'),
  P('sales.targets.manage', 'sales', 'manage', 'Set sales targets'),
  P('calls.manage', 'sales', 'edit', 'Log, edit and delete call records & follow-ups'),
  P('customer.app', 'sales', 'view', 'Customer app — catalogue, own orders, tracking & documents', 'page'),
  P('customer.order', 'sales', 'create', 'Customer app — place orders'),

  P('orders.view', 'orders', 'view', 'Order list & details', 'page'),
  P('orders.approval.view', 'orders', 'view', 'Approval queue', 'page'),
  P('orders.consolidation.view', 'orders', 'view', 'Consolidation queue', 'page'),
  P('orders.approve', 'orders', 'approve', 'Approve orders'),
  P('orders.reject', 'orders', 'reject', 'Reject or return orders'),
  P('orders.consolidate', 'orders', 'manage', 'Consolidate & release orders'),

  P('dispatch.view', 'dispatch', 'view', 'Dispatch dashboard & planning', 'page'),
  P('dispatch.ready.view', 'dispatch', 'view', 'Ready-for-dispatch queue', 'page'),
  P('dispatch.history', 'dispatch', 'view', 'Delivery history', 'page'),
  P('fleet.view', 'dispatch', 'view', 'Zones, drivers & vehicles', 'page'),
  P('dispatch.manage', 'dispatch', 'create', 'Create dispatches & assign drivers / vehicles'),
  P('fleet.manage', 'dispatch', 'manage', 'Manage zones, drivers & vehicles'),
  P('dispatch.otp.inspect', 'dispatch', 'manage', 'Inspect simulated delivery OTPs'),

  P('dispatch.tracking', 'delivery', 'view', 'Delivery tracking', 'page'),
  P('tracking.fleet', 'delivery', 'view', 'Live fleet map (demo GPS)', 'page'),
  P('deliveries.view', 'delivery', 'view', 'Delivery details', 'page'),
  P('deliveryNotes.view', 'delivery', 'view', 'Delivery notes', 'page'),
  P('driver.app', 'delivery', 'manage', 'Driver app — run deliveries & confirm with OTP'),

  P('vms.view', 'vms', 'view', 'VMS dashboard, register & expiry', 'page'),
  P('vms.documents.upload', 'vms', 'create', 'Upload vehicle & driver documents'),
  P('vms.manage', 'vms', 'manage', 'Manage vehicle register'),
  P('vms.settings', 'vms', 'manage', 'Compliance rules'),

  P('documents.view', 'documents', 'view', 'Document repository', 'page'),
  P('documents.upload', 'documents', 'create', 'Upload documents'),
  P('documents.review', 'documents', 'approve', 'Run OCR review & verify documents'),
  P('documents.reject', 'documents', 'reject', 'Reject documents'),
  P('documents.types', 'documents', 'manage', 'Document types & OCR fields'),
  P('documents.reports', 'documents', 'export', 'Document reports'),

  P('invoices.view', 'invoices', 'view', 'Invoices', 'page'),
  P('invoices.manage', 'invoices', 'create', 'Generate & cancel invoices'),
  P('invoices.reports', 'invoices', 'export', 'Invoice reports'),
  P('invoices.templates', 'invoices', 'manage', 'Invoice templates & numbering'),

  P('communication.view', 'email', 'view', 'Communication center, sent & history', 'page'),
  P('communication.inbox', 'email', 'view', 'Email inbox', 'page'),
  P('communication.send', 'email', 'create', 'Compose & send email'),
  P('communication.templates', 'email', 'manage', 'Email & WhatsApp templates'),
  P('communication.settings', 'email', 'manage', 'SMTP / IMAP & OpenWA settings'),
  P('communication.automation', 'email', 'manage', 'Automated notification rules'),
  P('communication.calls', 'email', 'view', 'Call history', 'page'),

  P('whatsapp.view', 'whatsapp', 'view', 'WhatsApp home & history', 'page'),
  P('whatsapp.send', 'whatsapp', 'create', 'Compose & send WhatsApp'),

  P('ai.assistant.view', 'ai', 'view', 'AI overview & assistant', 'page'),
  P('ai.insights.view', 'ai', 'view', 'AI insights', 'page'),
  P('jarvis.view', 'ai', 'view', 'Jarvis', 'page'),
  P('forecasting.view', 'ai', 'view', 'Forecasting', 'page'),
  P('ai.assistant.use', 'ai', 'create', 'Ask the AI assistant'),
  P('jarvis.use', 'ai', 'create', 'Use Jarvis commands'),
  P('forecasting.generate', 'ai', 'create', 'Generate forecasts'),
  P('ai.insights.manage', 'ai', 'edit', 'Acknowledge & resolve insights'),
  P('forecasting.export', 'ai', 'export', 'Export & print forecasts'),
  P('ai.settings.manage', 'ai', 'manage', 'AI provider settings'),
  P('ai.models.manage', 'ai', 'manage', 'Model management'),

  P('orders.reports', 'reports', 'view', 'Order reports', 'page'),
  P('dispatch.reports', 'reports', 'view', 'Delivery reports', 'page'),
  P('reports.inventory', 'reports', 'view', 'Inventory reports', 'page'),
  P('reports.center', 'reports', 'view', 'Reports center (each report also needs its module permission)', 'page'),
  P('data.export', 'reports', 'export', 'Export CSV files', 'action', 'Checked by every CSV export in the app.'),

  P('finance.view', 'finance', 'view', 'Finance overview (outstanding & collections)', 'page'),

  P('settings.view', 'settings', 'view', 'Application settings (read-only)', 'page'),
  P('organization.view', 'settings', 'view', 'Organization master', 'page'),
  P('users.view', 'settings', 'view', 'Users', 'page'),
  P('roles.view', 'settings', 'view', 'Roles & permission matrix', 'page'),
  P('audit.view', 'settings', 'view', 'Audit log', 'page'),
  P('users.create', 'settings', 'create', 'Create users'),
  P('roles.create', 'settings', 'create', 'Create & duplicate roles'),
  P('users.edit', 'settings', 'edit', 'Edit users'),
  P('roles.edit', 'settings', 'edit', 'Edit roles & permissions'),
  P('users.delete', 'settings', 'delete', 'Delete users'),
  P('roles.delete', 'settings', 'delete', 'Delete custom roles'),
  P('data.import', 'settings', 'import', 'Import a backup'),
  P('users.manage', 'settings', 'manage', 'Activate / deactivate users, reset demo passwords, assign roles & hubs'),
  P('settings.manage', 'settings', 'manage', 'Change application settings'),
  P('organization.manage', 'settings', 'manage', 'Edit organization master'),

  P('mobile.preview', 'project', 'view', 'Mobile App Preview (device emulator for the driver and customer apps)', 'page'),
  P('project.documents.view', 'project', 'view', 'Project Documents library — open and download internal / shareable documents', 'page'),
  P('project.documents.restricted', 'project', 'manage', 'Project Documents — restricted documents (security, infrastructure, risk registers)', 'action', 'Without it restricted documents are listed but cannot be opened, downloaded or zipped.'),

  // Enterprise expansion (catalog v4) — config/enterprise/permissionCatalog.js
  ...ENTERPRISE_PERMISSIONS.map(([key, module, action, label]) => P(key, module, action, label, action === 'view' ? 'page' : 'action')),
]

export const CATALOG_VERSION = 4
export const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.map((p) => p.key)
export const PERMISSION_BY_KEY = Object.fromEntries(PERMISSION_CATALOG.map((p) => [p.key, p]))
export const keysForCell = (module, action) => PERMISSION_CATALOG.filter((p) => p.module === module && p.action === action).map((p) => p.key)
export const keysForModule = (module) => PERMISSION_CATALOG.filter((p) => p.module === module).map((p) => p.key)
export const getModuleLabel = (id) => MODULES.find((m) => m.id === id)?.label ?? id

/**
 * Data scope decides WHICH records a role sees inside a module it can open (e.g. a Sales Executive sees own orders).
 * Custom roles pick one of these. Values reuse the system role codes that define each behaviour.
 */
export const DATA_SCOPES = [
  { id: 'ADMIN', label: 'All records', description: 'Every record in every module the role can open.' },
  { id: 'SALES_MANAGER', label: 'Submitted & approved orders', description: 'All non-draft orders; customer and order documents.' },
  { id: 'SALESMAN', label: 'Own records', description: 'Only own orders, own customers’ documents and deliveries.' },
  { id: 'CUSTOMER_SERVICE', label: 'Post-approval orders', description: 'Orders from approval onwards; all documents.' },
  { id: 'FINANCE', label: 'Finance view', description: 'All non-draft orders; invoices, customers and vendor documents.' },
  { id: 'DISPATCHER', label: 'Dispatch & warehouse', description: 'Orders from consolidation onwards; fleet and hub documents.' },
  { id: 'DRIVER', label: 'Own deliveries', description: 'Only own dispatches, deliveries and documents (driver app).' },
  { id: 'CUSTOMER', label: 'Linked customer', description: 'Read-only portal view of one customer’s orders, deliveries and invoices.' },
  { id: 'SUPPLIER', label: 'Linked supplier', description: 'Read-only portal view of one supplier’s approved replenishment.' },
]
export const getScopeLabel = (id) => DATA_SCOPES.find((s) => s.id === id)?.label ?? id

/** Landing pages a role can be sent to after sign-in. */
export const LANDING_PAGES = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/driver/dashboard', label: 'Driver app — Today' },
  { value: '/orders', label: 'Order list' },
  { value: '/orders/approval', label: 'Order approval' },
  { value: '/dispatch', label: 'Dispatch dashboard' },
  { value: '/inventory', label: 'Inventory dashboard' },
  { value: '/notifications', label: 'Notification center' },
  { value: '/customer/dashboard', label: 'Customer app — Home' },
  { value: '/reports/center', label: 'Reports center' },
  // Enterprise department landing pages
  ...[
    ['/management/dashboard', 'Executive dashboard'], ['/operations/control-tower', 'Operations control tower'], ['/sales/dashboard', 'Sales dashboard'],
    ['/horeca', 'HORECA accounts'], ['/van-sales', 'Van sales dashboard'], ['/van-sales/app', 'Van sales app'], ['/service/tickets', 'Service tickets'],
    ['/procurement/dashboard', 'Procurement dashboard'], ['/procurement/purchase-orders', 'Purchase orders'], ['/procurement/suppliers-performance', 'Supplier performance'],
    ['/import/dashboard', 'Import dashboard'], ['/import/shipments', 'Shipments'], ['/warehouse/operations', 'Warehouse operations'], ['/warehouse/receiving', 'Receiving (GRN)'],
    ['/warehouse/putaway', 'Put-away'], ['/warehouse/picking', 'Picking'], ['/warehouse/packing', 'Packing'], ['/warehouse/loading', 'Loading'], ['/inventory/counts', 'Cycle counts'],
    ['/qa/inspections', 'QA inspections'], ['/qa/ncr', 'NCR & CAPA'], ['/qa/temperature', 'Temperature logs'], ['/logistics/dashboard', 'Logistics dashboard'], ['/logistics/routes', 'Route plans'],
    ['/fleet/dashboard', 'Fleet dashboard'], ['/fleet/maintenance', 'Fleet maintenance'], ['/finance/dashboard', 'Finance dashboard'], ['/finance/receivables', 'Receivables'],
    ['/finance/payables', 'Payables'], ['/finance/cash', 'Bank & cash'], ['/hr/dashboard', 'HR dashboard'], ['/hr/recruitment', 'Recruitment'], ['/hr/payroll', 'Payroll (demo)'],
    ['/hr/attendance', 'Attendance'], ['/ess', 'My HR (self-service)'], ['/customer/statement', 'Customer app — Statement'], ['/supplier', 'Supplier portal'], ['/supplier/finance', 'Supplier portal — Finance'],
    ['/customers', 'Customer list'],
  ].map(([value, label]) => ({ value, label })),
]
