/**
 * Enterprise expansion — permission catalog (catalog version 4).
 * Each entry: [key, module, action, label, default system roles (existing role codes)].
 * Enterprise roles (config/enterprise/roles.js) list their own keys; Super Admin always has every key.
 * Keys are appended to rbacCatalog.PERMISSION_CATALOG, so they appear in Role Management and the Permission Matrix.
 */
export const ENTERPRISE_RBAC_MODULES = [
  { id: 'crm', label: 'CRM & Sales activity', group: 'Sales' },
  { id: 'salesmgmt', label: 'Sales management & pricing', group: 'Sales' },
  { id: 'horeca', label: 'HORECA sales', group: 'Sales' },
  { id: 'vansales', label: 'Van sales', group: 'Sales' },
  { id: 'service', label: 'Customer service', group: 'Sales' },
  { id: 'purchasing', label: 'Purchasing (PR, RFQ, PO)', group: 'Supply chain' },
  { id: 'import', label: 'Import & export', group: 'Supply chain' },
  { id: 'wms', label: 'Warehouse operations', group: 'Supply chain' },
  { id: 'batches', label: 'Batches, expiry & recall', group: 'Supply chain' },
  { id: 'qa', label: 'Quality assurance', group: 'Supply chain' },
  { id: 'logistics', label: 'Logistics planning', group: 'Operations' },
  { id: 'fleetops', label: 'Fleet maintenance & fuel', group: 'Operations' },
  { id: 'driverops', label: 'Driver expenses & cash', group: 'Operations' },
  { id: 'operations', label: 'Operations control tower', group: 'Operations' },
  { id: 'ar', label: 'Accounts receivable', group: 'Finance' },
  { id: 'ap', label: 'Accounts payable', group: 'Finance' },
  { id: 'expenses', label: 'Expenses', group: 'Finance' },
  { id: 'cashbank', label: 'Cash, bank & VAT', group: 'Finance' },
  { id: 'hr', label: 'HR & employees', group: 'HR' },
  { id: 'payroll', label: 'Payroll (prototype)', group: 'HR' },
  { id: 'ess', label: 'Employee self-service', group: 'HR' },
  { id: 'management', label: 'Management dashboards', group: 'General' },
  { id: 'portal', label: 'Supplier & customer portals', group: 'Portals' },
]

const A = 'ADMIN'
const SM = 'SALES_MANAGER'
const SE = 'SALESMAN'
const CS = 'CUSTOMER_SERVICE'
const DP = 'DISPATCHER'
const FI = 'FINANCE'
const WM = 'WAREHOUSE_MANAGER'
const IE = 'INVENTORY_EXECUTIVE'
const QA = 'QA_MANAGER'
const DR = 'DRIVER'
const CU = 'CUSTOMER'
const SU = 'SUPPLIER'

export const ENTERPRISE_PERMISSIONS = [
  // CRM
  ['sales.leads.view', 'crm', 'view', 'View leads', [A, SM, SE]],
  ['sales.leads.create', 'crm', 'create', 'Create leads', [A, SM, SE]],
  ['sales.leads.edit', 'crm', 'edit', 'Edit leads', [A, SM, SE]],
  ['sales.leads.manage', 'crm', 'manage', 'Assign, convert and close any lead', [A, SM]],
  ['sales.opportunities.view', 'crm', 'view', 'View opportunities / pipeline', [A, SM, SE]],
  ['sales.opportunities.manage', 'crm', 'manage', 'Create and update opportunities', [A, SM, SE]],
  ['sales.activities.view', 'crm', 'view', 'View visits, meetings and follow-ups', [A, SM, SE, CS]],
  ['sales.activities.manage', 'crm', 'manage', 'Plan and record visits, meetings and follow-ups', [A, SM, SE, CS]],
  // Sales management
  ['sales.targets.view', 'salesmgmt', 'view', 'View sales targets and achievement', [A, SM, SE, FI]],
  ['sales.commission.manage', 'salesmgmt', 'manage', 'Configure commission and incentive rules', [A, SM]],
  ['sales.pricing.view', 'salesmgmt', 'view', 'View price lists and margins', [A, SM, SE, FI]],
  ['sales.pricing.manage', 'salesmgmt', 'manage', 'Create and edit price lists', [A, SM]],
  ['sales.pricing.approve', 'salesmgmt', 'approve', 'Approve price lists', [A, SM, FI]],
  ['sales.returns.view', 'salesmgmt', 'view', 'View sales returns', [A, SM, SE, CS, FI, WM]],
  ['sales.returns.manage', 'salesmgmt', 'manage', 'Raise sales returns', [A, SM, SE, CS]],
  ['sales.returns.approve', 'salesmgmt', 'approve', 'Approve sales returns', [A, SM]],
  ['sales.orderchanges.request', 'salesmgmt', 'create', 'Request order cancellation / modification', [A, SM, SE, CS]],
  ['sales.orderchanges.approve', 'salesmgmt', 'approve', 'Approve order cancellation / modification', [A, SM]],
  // Customer service
  ['service.tickets.view', 'service', 'view', 'View complaints and service tickets', [A, SM, SE, CS, QA]],
  ['service.tickets.manage', 'service', 'manage', 'Create, assign and resolve tickets', [A, SM, CS, QA]],
  ['customers.approve', 'service', 'approve', 'Approve new customer accounts', [A, SM, FI]],
  // HORECA
  ['horeca.view', 'horeca', 'view', 'HORECA workspace', [A, SM, SE]],
  ['horeca.manage', 'horeca', 'manage', 'Manage HORECA accounts, contracts and order templates', [A, SM]],
  ['horeca.contracts.approve', 'horeca', 'approve', 'Approve HORECA contracts', [A, SM]],
  // Van sales
  ['vansales.view', 'vansales', 'view', 'Van sales dashboard and records', [A, SM, FI]],
  ['vansales.manage', 'vansales', 'manage', 'Assign vans, load and transfer van stock', [A, SM, WM]],
  ['vansales.app', 'vansales', 'create', 'Van sales app — sell, collect, return', [A]],
  ['vansales.settle.approve', 'vansales', 'approve', 'Approve van settlements', [A, SM, FI]],
  // Purchasing
  ['procurement.requisitions.view', 'purchasing', 'view', 'View purchase requisitions', [A, WM, IE, FI]],
  ['procurement.requisitions.create', 'purchasing', 'create', 'Raise purchase requisitions', [A, WM, IE]],
  ['procurement.requisitions.approve', 'purchasing', 'approve', 'Approve purchase requisitions', [A]],
  ['procurement.rfq.view', 'purchasing', 'view', 'View RFQs and supplier quotations', [A, WM, FI]],
  ['procurement.rfq.manage', 'purchasing', 'manage', 'Issue RFQs, record and compare quotations', [A]],
  ['procurement.rfq.approve', 'purchasing', 'approve', 'Award RFQs (creates the purchase order)', [A]],
  ['procurement.po.view', 'purchasing', 'view', 'View purchase orders', [A, WM, IE, FI, QA]],
  ['procurement.po.create', 'purchasing', 'create', 'Create and revise purchase orders', [A]],
  ['procurement.po.approve', 'purchasing', 'approve', 'Approve / cancel purchase orders', [A]],
  ['procurement.po.overreceive', 'purchasing', 'manage', 'Receive more than the ordered quantity', [A]],
  ['suppliers.performance.view', 'purchasing', 'view', 'Supplier performance, rating and price history', [A, FI, QA]],
  // Import & export
  ['import.shipments.view', 'import', 'view', 'View import / export shipments', [A, WM, FI]],
  ['import.shipments.manage', 'import', 'manage', 'Create and update shipments, milestones and documents', [A]],
  ['import.shipments.approve', 'import', 'approve', 'Approve customs clearance and close shipments', [A]],
  ['import.landedcost.manage', 'import', 'manage', 'Calculate and post landed cost', [A, FI]],
  // Warehouse operations
  ['warehouse.locations.view', 'wms', 'view', 'View warehouse locations and utilisation', [A, WM, IE, DP]],
  ['warehouse.locations.manage', 'wms', 'manage', 'Manage zones, aisles, racks and bins', [A, WM]],
  ['warehouse.receiving.view', 'wms', 'view', 'View goods receipts (GRN)', [A, WM, IE, QA, FI]],
  ['warehouse.receiving.manage', 'wms', 'manage', 'Receive goods against purchase orders', [A, WM, IE]],
  ['warehouse.putaway.manage', 'wms', 'manage', 'Putaway tasks', [A, WM, IE]],
  ['warehouse.picking.manage', 'wms', 'manage', 'Pick lists and pick confirmation', [A, WM, IE]],
  ['warehouse.packing.manage', 'wms', 'manage', 'Packing verification', [A, WM, IE]],
  ['warehouse.loading.manage', 'wms', 'manage', 'Loading plans, seals and dispatch release', [A, WM, DP]],
  ['warehouse.tasks.view', 'wms', 'view', 'Warehouse task queues and productivity', [A, WM, IE, DP]],
  // Batches & recall
  ['inventory.batch.view', 'batches', 'view', 'Batch / lot stock and expiry', [A, WM, IE, QA, DP]],
  ['inventory.batch.manage', 'batches', 'manage', 'Edit batch details and bin locations', [A, WM, IE]],
  ['inventory.recall.view', 'batches', 'view', 'View product recalls', [A, WM, QA]],
  ['inventory.recall.manage', 'batches', 'manage', 'Open and close product / batch recalls', [A, QA]],
  ['inventory.counts.view', 'batches', 'view', 'View cycle counts', [A, WM, IE, FI]],
  ['inventory.counts.manage', 'batches', 'manage', 'Record cycle / physical counts', [A, WM, IE]],
  ['inventory.counts.approve', 'batches', 'approve', 'Approve count variances (posts adjustments)', [A, WM]],
  // QA
  ['qa.inspection.view', 'qa', 'view', 'View QA inspections', [A, QA, WM, IE]],
  ['qa.inspection.manage', 'qa', 'manage', 'Record QA inspections', [A, QA]],
  ['qa.release', 'qa', 'approve', 'Release stock from QA hold / quarantine', [A, QA]],
  ['qa.reject', 'qa', 'reject', 'Reject stock (blocks it from sale)', [A, QA]],
  ['qa.ncr.manage', 'qa', 'manage', 'Non-conformance reports and CAPA', [A, QA]],
  ['qa.temperature.manage', 'qa', 'manage', 'Record cold-chain temperature readings', [A, QA, WM, DP]],
  // Logistics
  ['logistics.planning.view', 'logistics', 'view', 'Delivery scheduling, SLA and route performance', [A, DP, SM]],
  ['logistics.planning.manage', 'logistics', 'manage', 'Delivery windows, rescheduling and route optimisation demo', [A, DP]],
  ['logistics.planning.approve', 'logistics', 'approve', 'Publish route plans', [A, DP]],
  // Fleet
  ['fleet.maintenance.view', 'fleetops', 'view', 'View maintenance work orders', [A, DP]],
  ['fleet.maintenance.manage', 'fleetops', 'manage', 'Create and close maintenance work orders', [A]],
  ['fleet.maintenance.approve', 'fleetops', 'approve', 'Approve maintenance cost', [A]],
  ['fleet.fuel.view', 'fleetops', 'view', 'View fuel logs', [A, DP, FI]],
  ['fleet.fuel.manage', 'fleetops', 'manage', 'Record fuel entries', [A, DP, DR]],
  ['fleet.analytics.view', 'fleetops', 'view', 'Fleet utilisation and cost analytics', [A, DP, FI]],
  // Drivers
  ['drivers.expenses.manage', 'driverops', 'create', 'Submit own expenses and cash collections (driver app)', [DR]],
  ['drivers.expenses.view', 'driverops', 'view', 'View driver expenses, cash and settlements', [A, DP, FI]],
  ['drivers.expenses.approve', 'driverops', 'approve', 'Approve driver expenses and settlements', [A, FI]],
  // Operations
  ['operations.controltower.view', 'operations', 'view', 'Operations Control Tower', [A, DP, WM]],
  ['operations.exceptions.view', 'operations', 'view', 'View operational exceptions', [A, DP, WM, QA, CS]],
  ['operations.exceptions.manage', 'operations', 'manage', 'Assign, resolve and escalate exceptions', [A, DP]],
  ['management.dashboard.view', 'management', 'view', 'Management (CEO) dashboard', [A]],
  // AR
  ['finance.ar.view', 'ar', 'view', 'Receivables, payments, statements and aging', [A, FI]],
  ['finance.ar.manage', 'ar', 'manage', 'Record receipts, allocations, credit notes and refunds', [A, FI]],
  ['finance.credithold.manage', 'ar', 'approve', 'Place / release customer credit hold', [A, FI]],
  // AP
  ['finance.ap.view', 'ap', 'view', 'Payables, supplier invoices and aging', [A, FI]],
  ['finance.ap.manage', 'ap', 'manage', 'Record supplier invoices and payments', [A, FI]],
  ['finance.ap.approve', 'ap', 'approve', 'Approve supplier invoices for payment', [A]],
  // Expenses
  ['finance.expenses.view', 'expenses', 'view', 'View expense claims', [A, FI]],
  ['finance.expenses.manage', 'expenses', 'create', 'Submit expense claims', [A, FI, SM, SE, DP, WM]],
  ['finance.expenses.approve', 'expenses', 'approve', 'Approve and reimburse expense claims', [A, FI]],
  // Cash, bank, VAT
  ['finance.cash.view', 'cashbank', 'view', 'Cash register, bank accounts and vouchers', [A, FI]],
  ['finance.cash.manage', 'cashbank', 'manage', 'Bank accounts, vouchers and cash closing', [A, FI]],
  ['finance.cash.approve', 'cashbank', 'approve', 'Approve vouchers and cash-closing variances', [A, FI]],
  ['finance.vat.view', 'cashbank', 'view', 'VAT configuration, summary and TRN validation', [A, FI]],
  ['finance.dashboard.view', 'cashbank', 'view', 'Finance dashboard', [A, FI]],
  // HR
  ['hr.employees.view', 'hr', 'view', 'Employee master', [A]],
  ['hr.employees.manage', 'hr', 'manage', 'Create and edit employees', [A]],
  ['hr.recruitment.view', 'hr', 'view', 'Recruitment (requisitions, candidates, interviews)', [A]],
  ['hr.recruitment.manage', 'hr', 'manage', 'Manage recruitment pipeline and offers', [A]],
  ['hr.recruitment.approve', 'hr', 'approve', 'Approve job requisitions, offers and hiring', [A]],
  ['hr.attendance.view', 'hr', 'view', 'Attendance register', [A]],
  ['hr.attendance.manage', 'hr', 'manage', 'Record and correct attendance, approve corrections', [A]],
  ['hr.leave.view', 'hr', 'view', 'Leave applications and calendar', [A]],
  ['hr.leave.approve', 'hr', 'approve', 'Approve / reject leave', [A]],
  ['hr.payroll.view', 'payroll', 'view', 'Payroll runs and payslips (prototype)', [A]],
  ['hr.payroll.manage', 'payroll', 'manage', 'Salary structures and payroll calculation preview', [A]],
  ['hr.payroll.approve', 'payroll', 'approve', 'Approve payroll runs', [A]],
  ['hr.dashboard.view', 'hr', 'view', 'HR dashboard', [A]],
  ['ess.access', 'ess', 'view', 'Employee self-service (my attendance, leave, payslips, requests)', [A, SM, SE, CS, DP, FI, WM, IE, QA]],
  // Portals
  ['supplierportal.access', 'portal', 'view', 'Supplier portal — own POs, RFQs, shipments, invoices, payments', [SU]],
  ['customerportal.finance', 'portal', 'view', 'Customer portal — statement, payments and complaints', [CU]],
  ['reports.export', 'management', 'export', 'Export reports (CSV / print)', [A, SM, FI, WM, DP]],
]

