/**
 * Enterprise roles (catalog v4). Seeded into bellomassi_roles as predefined, editable system roles by
 * rbacService.syncCatalog — existing roles, custom roles and administrator edits are never overwritten.
 *
 * Roles that already exist are NOT duplicated:
 *   Super Admin = SUPER_ADMIN · System Administrator = ADMIN · Sales Executive = SALESMAN · Sales Manager = SALES_MANAGER
 *   Customer Service Executive = CUSTOMER_SERVICE · Dispatcher = DISPATCHER · Delivery Driver = DRIVER
 *   Finance Executive = FINANCE · Warehouse Manager = WAREHOUSE_MANAGER · Inventory Controller = INVENTORY_EXECUTIVE
 *   QA Manager = QA_MANAGER · Customer = CUSTOMER · Supplier = SUPPLIER
 *
 * scope = data scope (existing codes): ADMIN (all records), SALESMAN (own), SALES_MANAGER, CUSTOMER_SERVICE,
 * DISPATCHER (operations), DRIVER (own deliveries), FINANCE, CUSTOMER (linked customer), SUPPLIER (linked supplier).
 */

/* ---------- Permission bundles (existing + enterprise keys) ---------- */
const ESS = ['dashboard.view', 'ess.access', 'finance.expenses.manage']
const REPORTS = ['reports.center', 'reports.export']
const SALES_READ = ['customers.view', 'products.view', 'orders.view', 'sales.targets.view', 'sales.pricing.view', 'sales.leads.view', 'sales.opportunities.view', 'sales.activities.view', 'service.tickets.view', 'orders.reports']
const SALES_WORK = [...SALES_READ, 'orders.create', 'orders.mine', 'orders.corrections.view', 'sales.leads.create', 'sales.leads.edit', 'sales.opportunities.manage', 'sales.activities.manage', 'sales.returns.view', 'sales.returns.manage', 'sales.orderchanges.request', 'calls.manage', 'communication.calls', 'customers.credit.view']
const SALES_MGMT = [...SALES_WORK, 'sales.leads.manage', 'sales.targets.manage', 'sales.commission.manage', 'sales.pricing.manage', 'sales.pricing.approve', 'sales.returns.approve', 'sales.orderchanges.approve', 'orders.approval.view', 'orders.approve', 'orders.reject', 'customers.manage', 'customers.approve', 'service.tickets.manage', 'horeca.view', 'vansales.view', ...REPORTS]
const HORECA = ['horeca.view', 'horeca.manage']
const VAN = ['vansales.view', 'vansales.app']
const PROC_READ = ['suppliers.view', 'procurement.view', 'procurement.requisitions.view', 'procurement.rfq.view', 'procurement.po.view', 'suppliers.performance.view', 'products.view']
const PROC_WORK = [...PROC_READ, 'procurement.requisitions.create', 'procurement.rfq.manage', 'procurement.po.create', 'suppliers.manage', 'inventory.replenishment.create', 'import.shipments.view', 'documents.view', 'documents.upload']
const PROC_MGMT = [...PROC_WORK, 'procurement.rfq.approve', 'procurement.requisitions.approve', 'procurement.po.approve', 'procurement.approve', 'procurement.reject', 'procurement.po.overreceive', ...REPORTS]
const IMPORT_WORK = ['import.shipments.view', 'import.shipments.manage', 'procurement.po.view', 'suppliers.view', 'products.view', 'documents.view', 'documents.upload']
const WMS_READ = ['warehouse.dashboard', 'inventory.dashboard', 'inventory.stock.view', 'inventory.lowstock.view', 'inventory.movements.view', 'hubs.view', 'products.view', 'warehouse.locations.view', 'warehouse.tasks.view', 'inventory.batch.view', 'warehouse.receiving.view', 'procurement.po.view']
const WMS_TASKS = [...WMS_READ, 'warehouse.receiving.manage', 'warehouse.putaway.manage', 'warehouse.picking.manage', 'warehouse.packing.manage', 'warehouse.loading.manage', 'qa.temperature.manage']
const WMS_MGMT = [...WMS_TASKS, 'warehouse.locations.manage', 'inventory.batch.manage', 'inventory.receipts.manage', 'inventory.transfers.manage', 'inventory.adjustments.manage', 'inventory.counts.view', 'inventory.counts.manage', 'inventory.counts.approve', 'inventory.recall.view', 'inventory.scrap.view', 'scrap.create', 'procurement.requisitions.view', 'procurement.requisitions.create', 'warehouse.qa.view', 'qa.inspection.view', 'operations.exceptions.view', 'dispatch.ready.view', ...REPORTS, 'reports.inventory']
const QA_READ = ['warehouse.qa.view', 'qa.inspection.view', 'inventory.batch.view', 'inventory.stock.view', 'products.view', 'documents.view', 'warehouse.receiving.view', 'inventory.recall.view', 'service.tickets.view']
const QA_WORK = [...QA_READ, 'qa.inspection.manage', 'qa.temperature.manage', 'qa.ncr.manage', 'documents.upload']
const QA_MGMT = [...QA_WORK, 'qa.release', 'qa.reject', 'inventory.recall.manage', 'documents.review', 'documents.reject', 'service.tickets.manage', 'suppliers.performance.view', ...REPORTS]
const LOG_READ = ['dispatch.view', 'dispatch.ready.view', 'dispatch.history', 'deliveries.view', 'dispatch.tracking', 'tracking.fleet', 'fleet.view', 'logistics.planning.view', 'operations.exceptions.view', 'dispatch.reports']
const LOG_WORK = [...LOG_READ, 'dispatch.manage', 'logistics.planning.manage', 'logistics.planning.approve', 'warehouse.loading.manage', 'qa.temperature.manage']
const FLEET_WORK = ['fleet.view', 'fleet.manage', 'vms.view', 'vms.manage', 'vms.documents.upload', 'fleet.maintenance.view', 'fleet.maintenance.manage', 'fleet.fuel.view', 'fleet.fuel.manage', 'fleet.analytics.view', 'tracking.fleet', 'documents.view']
const DRIVER_APP = ['dashboard.view', 'driver.app', 'drivers.expenses.manage', 'fleet.fuel.manage', 'ess.access']
const FIN_READ = ['finance.view', 'finance.dashboard.view', 'invoices.view', 'invoices.reports', 'finance.ar.view', 'finance.ap.view', 'finance.expenses.view', 'finance.cash.view', 'finance.vat.view', 'customers.view', 'customers.credit.view', 'suppliers.view', 'orders.view', 'drivers.expenses.view']
const FIN_WORK = [...FIN_READ, 'finance.ar.manage', 'finance.ap.manage', 'invoices.manage', 'finance.cash.manage', ...REPORTS]
const FIN_MGMT = [...FIN_WORK, 'finance.cash.approve', 'finance.ap.approve', 'finance.expenses.approve', 'finance.credithold.manage', 'drivers.expenses.approve', 'vansales.settle.approve', 'sales.pricing.approve', 'customers.approve', 'invoices.templates', 'procurement.po.view', 'vansales.view']
const HR_READ = ['hr.dashboard.view', 'hr.employees.view', 'hr.attendance.view', 'hr.leave.view', 'hr.recruitment.view', 'organization.view', 'users.view']
const HR_MGMT = [...HR_READ, 'hr.recruitment.approve', 'hr.employees.manage', 'hr.attendance.manage', 'hr.leave.approve', 'hr.recruitment.manage', 'hr.payroll.view', 'hr.payroll.manage', 'hr.payroll.approve', 'organization.manage', ...REPORTS]
const MGMT_READ = ['management.dashboard.view', 'operations.controltower.view', 'operations.exceptions.view', 'finance.dashboard.view', 'hr.dashboard.view', 'sales.targets.view', 'orders.view', 'customers.view', 'products.view', 'inventory.dashboard', 'warehouse.dashboard', 'dispatch.view', 'fleet.view', 'fleet.analytics.view', 'finance.view', 'finance.ar.view', 'finance.ap.view', 'procurement.view', 'procurement.po.view', 'import.shipments.view', 'qa.inspection.view', 'horeca.view', 'vansales.view', 'logistics.planning.view', 'sales.opportunities.view', 'invoices.view', ...REPORTS, 'reports.inventory', 'orders.reports', 'dispatch.reports', 'invoices.reports', 'ai.insights.view', 'forecasting.view', 'audit.view']
const ADMIN_BASE = ['settings.view', 'organization.view', 'users.view', 'roles.view', 'audit.view', 'dashboard.view']

/** Module report pages were merged into the Reports Center: a role holding one of their keys also opens the center. */
export const REPORT_PAGE_KEYS = ['orders.reports', 'dispatch.reports', 'invoices.reports', 'documents.reports', 'vms.view']
export const withReportsCenter = (perms) => (perms.some((k) => REPORT_PAGE_KEYS.includes(k)) && !perms.includes('reports.center') ? [...perms, 'reports.center'] : perms)
const R = (code, name, department, scope, landing, perms, description) => ({ code, name, department, scope, landing, permissions: withReportsCenter([...new Set(perms)]), description })

export const ENTERPRISE_ROLES = [
  // A. Administration
  R('IT_ADMIN', 'IT Administrator', 'IT / System Administration', 'ADMIN', '/dashboard', [...ADMIN_BASE, 'users.create', 'users.edit', 'users.manage', 'settings.manage', 'data.export', 'data.import', 'mobile.preview', 'project.documents.view'], 'Users, devices, application settings, backups and environment health.'),
  R('APP_ADMIN', 'Application Administrator', 'IT / System Administration', 'ADMIN', '/dashboard', [...ADMIN_BASE, 'settings.manage', 'organization.manage', 'roles.create', 'roles.edit', 'communication.templates', 'invoices.templates', 'documents.types', 'mobile.preview', 'project.documents.view'], 'Configures workflows, templates, numbering and application options.'),
  R('MASTER_DATA_ADMIN', 'Master Data Administrator', 'IT / System Administration', 'ADMIN', '/customers', ['dashboard.view', 'customers.view', 'customers.manage', 'customers.approve', 'products.view', 'products.manage', 'suppliers.view', 'suppliers.manage', 'hubs.view', 'hubs.manage', 'fleet.view', 'fleet.manage', 'organization.view', 'organization.manage', 'warehouse.locations.view', 'warehouse.locations.manage', 'sales.pricing.view'], 'Owns customer, product, supplier, hub, location and fleet master data.'),
  R('SECURITY_ADMIN', 'Security Administrator', 'IT / System Administration', 'ADMIN', '/admin/audit-logs', [...ADMIN_BASE, 'roles.create', 'roles.edit', 'users.edit', 'project.documents.view', 'project.documents.restricted'], 'Reviews access, roles, permissions and the audit trail.'),
  R('AUDIT_VIEWER', 'Audit Viewer', 'IT / System Administration', 'ADMIN', '/admin/audit-logs', ['dashboard.view', 'audit.view', 'users.view', 'roles.view', 'finance.view', 'finance.ar.view', 'finance.ap.view', 'invoices.view', 'orders.view', 'inventory.movements.view', ...REPORTS], 'Read-only access to the audit log and financial / stock registers.'),
  // B. Management
  R('CEO', 'CEO / Managing Director', 'Management', 'ADMIN', '/management/dashboard', [...MGMT_READ, 'project.documents.view', 'mobile.preview'], 'Company-wide KPIs, approvals escalated to management and the control tower.'),
  R('GENERAL_MANAGER', 'General Manager', 'Management', 'ADMIN', '/management/dashboard', [...MGMT_READ, 'operations.exceptions.manage', 'procurement.po.approve', 'sales.orderchanges.approve', 'finance.expenses.approve', 'hr.leave.approve', 'project.documents.view'], 'Runs day-to-day operations across departments.'),
  R('OPERATIONS_DIRECTOR', 'Operations Director / Manager', 'Operations', 'ADMIN', '/operations/control-tower', [...MGMT_READ, 'operations.exceptions.manage', ...LOG_WORK, 'warehouse.tasks.view', 'fleet.maintenance.view', 'fleet.fuel.view', 'project.documents.view'], 'Owns the control tower, SLAs, exceptions and escalations.'),
  R('SALES_DIRECTOR', 'Sales Director', 'Sales', 'ADMIN', '/sales/dashboard', [...SALES_MGMT, ...HORECA, 'horeca.contracts.approve', 'vansales.manage', 'vansales.settle.approve', 'management.dashboard.view', 'finance.ar.view'], 'Sales strategy, targets, pricing approval and channel performance.'),
  R('FINANCE_MANAGER', 'Finance Manager', 'Finance', 'FINANCE', '/finance/dashboard', [...FIN_MGMT, 'management.dashboard.view', 'import.landedcost.manage', 'import.shipments.view', 'procurement.po.approve', 'hr.payroll.view', 'hr.payroll.approve'], 'Receivables, payables, cash, VAT, approvals and financial reporting.'),
  R('SUPPLY_CHAIN_MANAGER', 'Supply Chain Manager', 'Operations', 'ADMIN', '/procurement/dashboard', [...PROC_MGMT, ...WMS_READ, 'import.shipments.view', 'import.shipments.approve', 'forecasting.view', 'inventory.predictions.view', 'operations.controltower.view', 'qa.inspection.view'], 'End-to-end supply: demand, purchasing, import, warehouse availability.'),
  R('LOGISTICS_MANAGER', 'Logistics Manager', 'Logistics', 'DISPATCHER', '/logistics/dashboard', [...LOG_WORK, ...FLEET_WORK, 'operations.controltower.view', 'operations.exceptions.manage', 'drivers.expenses.view', 'drivers.expenses.approve', ...REPORTS], 'Dispatch, routes, delivery SLA, drivers and fleet.'),
  R('HR_MANAGER', 'HR Manager', 'HR', 'ADMIN', '/hr/dashboard', [...HR_MGMT, ...ESS], 'Employees, recruitment, attendance, leave and payroll.'),
  // C. Sales
  R('SALES_REP', 'Sales Representative', 'Sales', 'SALESMAN', '/sales/dashboard', [...SALES_WORK, ...ESS], 'Field sales: visits, leads and order capture for own accounts.'),
  R('SALES_COORDINATOR', 'Sales Coordinator', 'Sales', 'SALES_MANAGER', '/sales/dashboard', [...SALES_WORK, 'sales.leads.manage', 'orders.approval.view', ...ESS], 'Coordinates the sales team, follow-ups and order corrections.'),
  R('HORECA_SALES_MANAGER', 'HORECA Sales Manager', 'HORECA Sales', 'SALES_MANAGER', '/horeca', [...SALES_MGMT, ...HORECA, 'horeca.contracts.approve', ...ESS], 'Hotel, restaurant and catering accounts, contracts and pricing.'),
  R('HORECA_SALES_EXEC', 'HORECA Sales Executive', 'HORECA Sales', 'SALESMAN', '/horeca', [...SALES_WORK, ...HORECA, ...ESS], 'Manages assigned HORECA accounts, templates and recurring orders.'),
  R('KEY_ACCOUNT_MANAGER', 'Key Account Manager', 'HORECA Sales', 'SALES_MANAGER', '/horeca', [...SALES_WORK, ...HORECA, 'sales.pricing.manage', ...ESS], 'Key accounts, contracts, SLA and demand planning.'),
  R('VAN_SALES_MANAGER', 'Van Sales Manager', 'Van Sales', 'SALES_MANAGER', '/van-sales', [...SALES_READ, 'vansales.view', 'vansales.manage', 'vansales.settle.approve', 'vansales.app', 'sales.returns.view', 'sales.returns.approve', ...REPORTS, ...ESS], 'Routes, van loading, settlements and cash variance.'),
  R('VAN_SALES_EXEC', 'Van Sales Executive', 'Van Sales', 'SALESMAN', '/van-sales/app', [...VAN, 'customers.view', 'products.view', 'sales.activities.manage', 'sales.returns.manage', ...ESS], 'Sells from the van on an assigned route, collects payment, settles daily.'),
  R('VAN_SALES_DRIVER', 'Van Sales Driver', 'Van Sales', 'SALESMAN', '/van-sales/app', [...VAN, 'customers.view', 'products.view', 'fleet.fuel.manage', 'drivers.expenses.manage', ...ESS], 'Drives the sales van, sells and collects on the route.'),
  R('CS_MANAGER', 'Customer Service Manager', 'Customer Service', 'CUSTOMER_SERVICE', '/service/tickets', [...SALES_READ, 'orders.consolidation.view', 'orders.consolidate', 'service.tickets.manage', 'sales.activities.manage', 'sales.returns.view', 'sales.returns.approve', 'sales.orderchanges.request', 'sales.orderchanges.approve', 'communication.view', 'communication.send', ...REPORTS, ...ESS], 'Customer service team, complaints, SLA and consolidation.'),
  R('SALES_ORDER_CONTROLLER', 'Sales Order Controller', 'Customer Service', 'CUSTOMER_SERVICE', '/orders', [...SALES_READ, 'orders.consolidation.view', 'orders.consolidate', 'sales.orderchanges.request', 'sales.returns.view', 'dispatch.ready.view', ...ESS], 'Order accuracy, changes, cancellations and release to the warehouse.'),
  // D. Procurement
  R('PROCUREMENT_MANAGER', 'Procurement Manager', 'Procurement', 'ADMIN', '/procurement/dashboard', [...PROC_MGMT, 'import.shipments.view', 'finance.ap.view', ...ESS], 'Approves requisitions and purchase orders; manages suppliers and contracts.'),
  R('PROCUREMENT_EXEC', 'Procurement Executive', 'Procurement', 'ADMIN', '/procurement/dashboard', [...PROC_WORK, ...ESS], 'Raises RFQs, compares quotations and prepares purchase orders.'),
  R('BUYER', 'Buyer', 'Procurement', 'ADMIN', '/procurement/purchase-orders', [...PROC_WORK, ...ESS], 'Buys against approved requisitions within delegated limits.'),
  R('PURCHASE_COORDINATOR', 'Purchase Coordinator', 'Procurement', 'ADMIN', '/procurement/purchase-orders', [...PROC_READ, 'procurement.requisitions.create', 'warehouse.receiving.view', 'import.shipments.view', ...ESS], 'Tracks POs, delivery schedules and receipts.'),
  R('SUPPLIER_RELATIONSHIP_MANAGER', 'Supplier Relationship Manager', 'Procurement', 'ADMIN', '/procurement/suppliers-performance', [...PROC_READ, 'suppliers.manage', 'qa.inspection.view', 'documents.view', ...ESS], 'Supplier performance, rating, contracts and documents.'),
  // E. Import & export
  R('IMPORT_MANAGER', 'Import Manager', 'Import & Export', 'ADMIN', '/import/dashboard', [...IMPORT_WORK, 'import.shipments.approve', 'import.landedcost.manage', ...REPORTS, ...ESS], 'Import / export programme, customs clearance and landed cost.'),
  R('IMPORT_EXEC', 'Import Executive', 'Import & Export', 'ADMIN', '/import/dashboard', [...IMPORT_WORK, ...ESS], 'Shipment register, documents and milestones.'),
  R('EXPORT_EXEC', 'Export Executive', 'Import & Export', 'ADMIN', '/import/shipments', [...IMPORT_WORK, ...ESS], 'Export shipments and documentation.'),
  R('SHIPPING_COORDINATOR', 'Shipping Coordinator', 'Import & Export', 'ADMIN', '/import/shipments', [...IMPORT_WORK, 'warehouse.receiving.view', ...ESS], 'Bookings, containers, ETA / ETD and arrival coordination.'),
  R('CUSTOMS_DOC_EXEC', 'Customs Documentation Executive', 'Import & Export', 'ADMIN', '/import/shipments', [...IMPORT_WORK, ...ESS], 'Customs declarations, certificates and clearance documents.'),
  // F. Warehouse & inventory
  R('WAREHOUSE_SUPERVISOR', 'Warehouse Supervisor', 'Warehouse', 'DISPATCHER', '/warehouse/operations', [...WMS_TASKS, 'inventory.counts.view', 'inventory.counts.manage', 'operations.exceptions.view', ...ESS], 'Supervises receiving, putaway, picking, packing and loading.'),
  R('WAREHOUSE_EXEC', 'Warehouse Executive', 'Warehouse', 'DISPATCHER', '/warehouse/operations', [...WMS_TASKS, ...ESS], 'Executes warehouse tasks.'),
  R('RECEIVING_CLERK', 'Receiving Clerk', 'Warehouse', 'DISPATCHER', '/warehouse/receiving', [...WMS_READ, 'warehouse.receiving.manage', 'qa.temperature.manage', ...ESS], 'Receives goods against purchase orders.'),
  R('PUTAWAY_OPERATOR', 'Putaway Operator', 'Warehouse', 'DISPATCHER', '/warehouse/putaway', [...WMS_READ, 'warehouse.putaway.manage', ...ESS], 'Moves received stock to bin locations.'),
  R('PICKER', 'Picker', 'Warehouse', 'DISPATCHER', '/warehouse/picking', [...WMS_READ, 'warehouse.picking.manage', ...ESS], 'Picks orders (FEFO) and reports short picks.'),
  R('PACKER', 'Packer', 'Warehouse', 'DISPATCHER', '/warehouse/packing', [...WMS_READ, 'warehouse.packing.manage', ...ESS], 'Packs and verifies orders.'),
  R('LOADING_SUPERVISOR', 'Loading Supervisor', 'Warehouse', 'DISPATCHER', '/warehouse/loading', [...WMS_READ, 'warehouse.loading.manage', 'dispatch.view', 'qa.temperature.manage', ...ESS], 'Loading plans, capacity checks, seals and dispatch release.'),
  R('INVENTORY_MANAGER', 'Inventory Manager', 'Inventory Control', 'DISPATCHER', '/inventory', [...WMS_MGMT, 'inventory.predictions.view', 'forecasting.view', 'inventory.recall.manage', ...ESS], 'Stock accuracy, valuation, counts, ageing and replenishment.'),
  R('STOCK_AUDITOR', 'Stock Auditor', 'Inventory Control', 'DISPATCHER', '/inventory/counts', [...WMS_READ, 'inventory.counts.view', 'inventory.counts.manage', 'inventory.movements.view', ...REPORTS, ...ESS], 'Cycle and physical counts, variance investigation.'),
  // G. QA
  R('QA_OFFICER', 'QA Officer', 'Quality Assurance', 'DISPATCHER', '/qa/inspections', [...QA_WORK, ...ESS], 'Inspections, NCRs and documentation.'),
  R('QA_INSPECTOR', 'Quality Inspector', 'Quality Assurance', 'DISPATCHER', '/qa/inspections', [...QA_WORK, ...ESS], 'Incoming, batch and temperature inspections.'),
  R('FOOD_SAFETY_OFFICER', 'Food Safety Officer', 'Quality Assurance', 'DISPATCHER', '/qa/ncr', [...QA_MGMT, ...ESS], 'Food safety documents, recalls and CAPA.'),
  R('COLD_CHAIN_CONTROLLER', 'Cold Chain Controller', 'Quality Assurance', 'DISPATCHER', '/qa/temperature', [...QA_READ, 'qa.temperature.manage', 'fleet.view', ...ESS], 'Cold-chain readings and temperature excursions.'),
  // H. Logistics & fleet
  R('DISPATCH_SUPERVISOR', 'Dispatch Supervisor', 'Logistics', 'DISPATCHER', '/dispatch', [...LOG_WORK, 'operations.exceptions.manage', 'drivers.expenses.view', ...ESS], 'Dispatch team, exceptions and reattempts.'),
  R('ROUTE_PLANNER', 'Route Planner', 'Logistics', 'DISPATCHER', '/logistics/routes', [...LOG_READ, 'logistics.planning.manage', ...ESS], 'Route sequence, delivery windows and capacity.'),
  R('FLEET_MANAGER', 'Fleet Manager', 'Fleet Management', 'DISPATCHER', '/fleet/dashboard', [...FLEET_WORK, 'fleet.maintenance.approve', 'drivers.expenses.view', 'drivers.expenses.approve', ...REPORTS, ...ESS], 'Vehicles, maintenance, fuel, compliance and fleet cost.'),
  R('FLEET_SUPERVISOR', 'Fleet Supervisor', 'Fleet Management', 'DISPATCHER', '/fleet/dashboard', [...FLEET_WORK, ...ESS], 'Daily vehicle availability and maintenance follow-up.'),
  R('FLEET_MAINT_EXEC', 'Fleet Maintenance Executive', 'Fleet Management', 'DISPATCHER', '/fleet/maintenance', ['fleet.view', 'vms.view', 'fleet.maintenance.view', 'fleet.maintenance.manage', 'fleet.fuel.view', ...ESS], 'Work orders, repairs and spare parts.'),
  R('TRANSPORT_COORDINATOR', 'Transport Coordinator', 'Logistics', 'DISPATCHER', '/logistics/dashboard', [...LOG_READ, 'fleet.fuel.view', 'fleet.maintenance.view', ...ESS], 'Vehicle and driver availability for dispatch.'),
  // I. Drivers
  R('HEAVY_VEHICLE_DRIVER', 'Heavy Vehicle Driver', 'Drivers', 'DRIVER', '/driver/dashboard', DRIVER_APP, 'Drives heavy / reefer trucks on assigned dispatches.'),
  R('DRIVER_SUPERVISOR', 'Driver Supervisor', 'Drivers', 'DISPATCHER', '/dispatch/drivers', [...LOG_READ, 'drivers.expenses.view', 'drivers.expenses.approve', 'fleet.fuel.view', 'hr.attendance.view', ...ESS], 'Driver attendance, availability, incidents and settlements.'),
  // J. Finance
  R('ACCOUNTANT', 'Accountant', 'Finance', 'FINANCE', '/finance/dashboard', [...FIN_WORK, ...ESS], 'Books receipts, payments, vouchers and reconciliations.'),
  R('AR_EXEC', 'Accounts Receivable Executive', 'Finance', 'FINANCE', '/finance/receivables', [...FIN_READ, 'finance.ar.manage', ...REPORTS, ...ESS], 'Customer receipts, allocation, statements and collections.'),
  R('AP_EXEC', 'Accounts Payable Executive', 'Finance', 'FINANCE', '/finance/payables', [...FIN_READ, 'finance.ap.manage', 'procurement.po.view', 'warehouse.receiving.view', ...REPORTS, ...ESS], 'Supplier invoices, matching and payments.'),
  R('CREDIT_CONTROLLER', 'Credit Controller', 'Finance', 'FINANCE', '/finance/receivables', [...FIN_READ, 'finance.ar.manage', 'finance.credithold.manage', 'orders.approval.view', ...ESS], 'Credit limits, holds, aging and collection follow-up.'),
  R('CASHIER', 'Cashier', 'Finance', 'FINANCE', '/finance/cash', [...FIN_READ, 'finance.cash.manage', 'finance.ar.manage', ...ESS], 'Cash receipts, payments and daily cash closing.'),
  R('BILLING_EXEC', 'Billing Executive', 'Finance', 'FINANCE', '/invoices', [...FIN_READ, 'invoices.manage', ...ESS], 'Customer invoices and credit notes.'),
  R('FINANCE_AUDITOR', 'Finance Auditor', 'Finance', 'FINANCE', '/finance/dashboard', [...FIN_READ, 'audit.view', ...REPORTS, ...ESS], 'Read-only review of financial records.'),
  // K. HR
  R('HR_EXEC', 'HR Executive', 'HR', 'ADMIN', '/hr/dashboard', [...HR_READ, 'hr.employees.manage', 'hr.attendance.manage', 'hr.recruitment.manage', ...ESS], 'Employee records, attendance and recruitment.'),
  R('RECRUITER', 'Recruiter', 'HR', 'ADMIN', '/hr/recruitment', ['hr.recruitment.view', 'hr.recruitment.manage', 'hr.employees.view', ...ESS], 'Job openings, candidates, interviews and offers.'),
  R('PAYROLL_EXEC', 'Payroll Executive', 'HR', 'ADMIN', '/hr/payroll', ['hr.employees.view', 'hr.attendance.view', 'hr.payroll.view', 'hr.payroll.manage', ...ESS], 'Salary structures and payroll calculation (prototype).'),
  R('ATTENDANCE_ADMIN', 'Attendance Administrator', 'HR', 'ADMIN', '/hr/attendance', ['hr.employees.view', 'hr.attendance.view', 'hr.attendance.manage', 'hr.leave.view', ...ESS], 'Shifts, attendance corrections and monthly attendance.'),
  R('EMPLOYEE', 'Employee (Self-Service)', 'HR', 'SALESMAN', '/ess', ESS, 'Own profile, attendance, leave, payslips and requests.'),
  // L. Portal users
  R('CUSTOMER_BUYER', 'Customer Buyer', 'Portal', 'CUSTOMER', '/customer/dashboard', ['dashboard.view', 'customer.app', 'customer.order'], 'Places orders for the linked customer account.'),
  R('CUSTOMER_APPROVER', 'Customer Approver', 'Portal', 'CUSTOMER', '/customer/dashboard', ['dashboard.view', 'customer.app', 'customer.order', 'customerportal.finance'], 'Reviews the account’s orders, deliveries and statements.'),
  R('CUSTOMER_FINANCE', 'Customer Finance User', 'Portal', 'CUSTOMER', '/customer/statement', ['dashboard.view', 'customer.app', 'customerportal.finance'], 'Statement, invoices and payment history of the linked account.'),
  R('SUPPLIER_SALES', 'Supplier Sales User', 'Portal', 'SUPPLIER', '/supplier', ['dashboard.view', 'supplierportal.access'], 'Confirms POs, submits quotations and updates shipments for the linked supplier.'),
  R('SUPPLIER_FINANCE', 'Supplier Finance User', 'Portal', 'SUPPLIER', '/supplier/finance', ['dashboard.view', 'supplierportal.access'], 'Invoice and payment status and statement of the linked supplier.'),
]

export const ENTERPRISE_ROLE_CODES = ENTERPRISE_ROLES.map((r) => r.code)
export const ENTERPRISE_ROLE_BY_CODE = Object.fromEntries(ENTERPRISE_ROLES.map((r) => [r.code, r]))

/** Departments of the 13 original system roles (for the department × role matrix). */
export const SYSTEM_ROLE_DEPARTMENTS = {
  SUPER_ADMIN: 'IT / System Administration', ADMIN: 'IT / System Administration', SALESMAN: 'Sales', SALES_MANAGER: 'Sales',
  CUSTOMER_SERVICE: 'Customer Service', DISPATCHER: 'Logistics', DRIVER: 'Drivers', FINANCE: 'Finance', WAREHOUSE_MANAGER: 'Warehouse',
  INVENTORY_EXECUTIVE: 'Inventory Control', QA_MANAGER: 'Quality Assurance', CUSTOMER: 'Portal', SUPPLIER: 'Portal',
}

export const DEPARTMENTS = [
  'Sales', 'HORECA Sales', 'Van Sales', 'Customer Service', 'Procurement', 'Import & Export', 'Warehouse', 'Inventory Control',
  'Quality Assurance', 'Logistics', 'Fleet Management', 'Drivers', 'Finance', 'HR', 'Operations', 'IT / System Administration', 'Management',
]
