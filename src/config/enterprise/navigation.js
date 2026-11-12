/**
 * Enterprise navigation: department groups, dashboards and the list / create / detail / edit routes of every
 * enterprise module. Merged into config/navigation.js, so menus, routes, breadcrumbs, global search and route
 * guards (ProtectedRoute → canAccessItem) use one source of truth.
 */
import {
  Gauge, TowerControl, Siren, Target, Handshake, CalendarDays, Award, Coins, Tags, Undo2, Repeat, Ticket, Store, ClipboardList,
  Truck, Smartphone, HandCoins, ShoppingCart, FileText, FileCheck2, Star, Ship, Container, Forklift, PackageOpen, PackageSearch,
  PackageCheck, MapPin, Layers3, ScanBarcode, ShieldAlert, ClipboardCheck, ThermometerSnowflake, Route, CalendarClock, Wrench, Fuel,
  Receipt, Wallet, Landmark, Banknote, Percent, CircleDollarSign, Scale, Users, UserPlus, BookUser, IdCard, Briefcase, Building,
} from 'lucide-react'

/** list + hidden create / detail / edit routes for one module. */
const mod = (def, { id, label, icon, description, keywords = [], basePath, permission, create = true }) => {
  const p = basePath
  const view = permission || def.view
  return [
    { id, label, icon, path: p, permission: view, page: 'enterpriseModule', module: def.id, view: 'list', description, keywords },
    ...(create ? [{ id: `${id}-new`, label: `New ${def.label}`, path: `${p}/new`, hidden: true, parent: id, permission: def.create, page: 'enterpriseModule', module: def.id, view: 'create' }] : []),
    { id: `${id}-detail`, label: `${def.label} details`, path: `${p}/:id`, hidden: true, parent: id, permission: view, page: 'enterpriseModule', module: def.id, view: 'detail' },
    ...(create ? [{ id: `${id}-edit`, label: `Edit ${def.label}`, path: `${p}/:id/edit`, hidden: true, parent: id, permission: def.edit || def.create, page: 'enterpriseModule', module: def.id, view: 'edit' }] : []),
  ]
}
/* Minimal permission map per module (mirrors the module definitions' permissions). */
const M = (id, label, view, create, edit) => ({ id, label, view, create, edit })

export const ENTERPRISE_MANAGEMENT_GROUP = {
  id: 'management', label: 'Management', icon: Gauge,
  children: [
    { id: 'mgmt-dashboard', label: 'Executive Dashboard', icon: Gauge, path: '/management/dashboard', permission: 'management.dashboard.view', page: 'enterpriseDashboard', dashboard: 'executive', description: 'Company-wide KPIs calculated from live records: sales, receivables, stock, deliveries, procurement, fleet, QA and people.', keywords: ['ceo', 'executive', 'kpi', 'management'] },
    { id: 'control-tower', label: 'Operations Control Tower', icon: TowerControl, path: '/operations/control-tower', permission: 'operations.controltower.view', page: 'controlTower', description: 'Live operational picture with clickable KPIs, alert centre, SLA status and exception management.', keywords: ['control tower', 'alerts', 'sla', 'operations'] },
    ...mod(M('operational_exceptions', 'exception', 'operations.exceptions.view', 'operations.exceptions.manage', 'operations.exceptions.manage'), { id: 'ops-exceptions', label: 'Exceptions', icon: Siren, basePath: '/operations/exceptions', description: 'Operational exceptions — assign, escalate and resolve with history.', keywords: ['exception', 'escalation', 'incident'] }),
  ],
}

export const ENTERPRISE_NAVIGATION = [
  {
    id: 'sales-crm', label: 'Sales & CRM', icon: Target,
    children: [
      { id: 'sales-dashboard', label: 'Sales Dashboard', icon: Gauge, path: '/sales/dashboard', permission: ['sales.targets.view', 'sales.opportunities.view'], page: 'enterpriseDashboard', dashboard: 'sales', description: 'Sales value, targets vs achievement, pipeline, returns and service tickets.', keywords: ['sales', 'targets', 'pipeline'] },
      ...mod(M('leads', 'lead', 'sales.leads.view', 'sales.leads.create', ['sales.leads.edit', 'sales.leads.manage']), { id: 'sales-leads', label: 'Leads', icon: Handshake, basePath: '/sales/leads', description: 'Prospects to qualify and convert.', keywords: ['lead', 'prospect', 'crm'] }),
      ...mod(M('opportunities', 'opportunity', 'sales.opportunities.view', 'sales.opportunities.manage', 'sales.opportunities.manage'), { id: 'sales-opportunities', label: 'Opportunities', icon: Target, basePath: '/sales/opportunities', description: 'Pipeline by stage, value and probability.', keywords: ['pipeline', 'deal', 'opportunity'] }),
      ...mod(M('sales_visits', 'activity', 'sales.activities.view', 'sales.activities.manage', 'sales.activities.manage'), { id: 'sales-activities', label: 'Visits & Activities', icon: CalendarDays, basePath: '/sales/activities', description: 'Customer visits, calls and tastings.', keywords: ['visit', 'call', 'activity'] }),
      ...mod(M('sales_targets', 'target', 'sales.targets.view', 'sales.commission.manage', 'sales.commission.manage'), { id: 'sales-targets', label: 'Targets', icon: Award, basePath: '/sales/targets', description: 'Monthly targets with live achievement.', keywords: ['target', 'quota', 'achievement'] }),
      ...mod(M('commission_rules', 'commission rule', 'sales.targets.view', 'sales.commission.manage', 'sales.commission.manage'), { id: 'sales-commission', label: 'Commission Rules', icon: Coins, basePath: '/sales/commission', description: 'Commission rates by segment.', keywords: ['commission', 'incentive'] }),
      ...mod(M('price_lists', 'price list', 'sales.pricing.view', 'sales.pricing.manage', 'sales.pricing.manage'), { id: 'sales-pricing', label: 'Price Lists', icon: Tags, basePath: '/sales/pricing', description: 'Segment and contract prices with approval.', keywords: ['price', 'contract price', 'discount'] }),
      ...mod(M('sales_returns', 'sales return', 'sales.returns.view', 'sales.returns.manage', 'sales.returns.manage'), { id: 'sales-returns', label: 'Sales Returns', icon: Undo2, basePath: '/sales/returns', description: 'Customer returns, stock receipt and credit notes.', keywords: ['return', 'credit note', 'rma'] }),
      ...mod(M('order_changes', 'order change', 'sales.orderchanges.request', 'sales.orderchanges.request', 'sales.orderchanges.request'), { id: 'sales-order-changes', label: 'Order Changes', icon: Repeat, basePath: '/sales/order-changes', description: 'Cancellation and delivery-change requests with approval.', keywords: ['cancel order', 'change', 'amend'] }),
    ],
  },
  {
    id: 'horeca-van', label: 'HORECA & Van Sales', icon: Store,
    children: [
      ...mod(M('horeca_accounts', 'HORECA account', 'horeca.view', 'horeca.manage', 'horeca.manage'), { id: 'horeca-accounts', label: 'HORECA Accounts', icon: Store, basePath: '/horeca', description: 'Hotel, restaurant and catering accounts with contracts and delivery windows.', keywords: ['horeca', 'hotel', 'restaurant', 'catering', 'chef'] }),
      ...mod(M('order_templates', 'standing order', 'horeca.view', 'horeca.manage', 'horeca.manage'), { id: 'horeca-templates', label: 'Standing Orders', icon: ClipboardList, basePath: '/horeca/templates', description: 'Recurring order templates that create draft orders.', keywords: ['standing order', 'template', 'recurring'] }),
      { id: 'van-dashboard', label: 'Van Sales Dashboard', icon: Gauge, path: '/van-sales', permission: 'vansales.view', page: 'enterpriseDashboard', dashboard: 'vansales', description: 'Routes, van stock, sales and cash settlement.', keywords: ['van sales', 'route sales'] },
      { id: 'van-app', label: 'Van Sales App', icon: Smartphone, path: '/van-sales/app', permission: 'vansales.app', page: 'vanSalesApp', description: 'Mobile van-sales screen: today’s route, van stock and quick sale.', keywords: ['van app', 'mobile', 'sell'] },
      ...mod(M('van_assignments', 'van route', 'vansales.view', 'vansales.manage', 'vansales.manage'), { id: 'van-routes', label: 'Van Routes', icon: Truck, basePath: '/van-sales/routes', description: 'Daily van loads, routes and settlement.', keywords: ['van', 'load', 'route'] }),
      ...mod(M('van_sales', 'van sale', 'vansales.view', ['vansales.app', 'vansales.manage'], 'vansales.manage'), { id: 'van-sales-list', label: 'Van Sales', icon: HandCoins, basePath: '/van-sales/sales', description: 'Sales from van stock.', keywords: ['van sale', 'cash sale'] }),
      ...mod(M('van_settlements', 'van settlement', 'vansales.view'), { id: 'van-settlements', label: 'Van Settlements', icon: Scale, basePath: '/van-sales/settlements', create: false, description: 'End-of-route cash and stock settlement.', keywords: ['settlement', 'cash variance'] }),
    ],
  },
  {
    id: 'service', label: 'Customer Service', icon: Ticket,
    children: [
      ...mod(M('service_tickets', 'ticket', ['service.tickets.view', 'customer.app'], ['service.tickets.manage', 'customer.app'], 'service.tickets.manage'), { id: 'service-tickets', label: 'Service Tickets', icon: Ticket, basePath: '/service/tickets', description: 'Complaints and queries with SLA, escalation and resolution.', keywords: ['complaint', 'ticket', 'sla', 'support'] }),
    ],
  },
  {
    id: 'procurement', label: 'Procurement', icon: ShoppingCart,
    children: [
      { id: 'proc-dashboard', label: 'Procurement Dashboard', icon: Gauge, path: '/procurement/dashboard', permission: ['procurement.po.view', 'procurement.requisitions.view'], page: 'enterpriseDashboard', dashboard: 'procurement', description: 'Requisitions, RFQs, open POs, receiving and supplier performance.', keywords: ['procurement', 'purchasing'] },
      ...mod(M('purchase_requisitions', 'requisition', 'procurement.requisitions.view', 'procurement.requisitions.create', 'procurement.requisitions.create'), { id: 'proc-requisitions', label: 'Purchase Requisitions', icon: FileText, basePath: '/procurement/requisitions', description: 'Internal requests to buy with approval.', keywords: ['pr', 'requisition'] }),
      ...mod(M('rfqs', 'RFQ', 'procurement.rfq.view', 'procurement.rfq.manage', 'procurement.rfq.manage'), { id: 'proc-rfqs', label: 'RFQs', icon: FileCheck2, basePath: '/procurement/rfqs', description: 'Requests for quotation and quote comparison.', keywords: ['rfq', 'quotation', 'tender'] }),
      ...mod(M('supplier_quotes', 'quote', ['procurement.rfq.view', 'supplierportal.access'], ['procurement.rfq.manage', 'supplierportal.access'], ['procurement.rfq.manage', 'supplierportal.access']), { id: 'proc-quotes', label: 'Supplier Quotes', icon: Coins, basePath: '/procurement/quotes', description: 'Quotes received against RFQs.', keywords: ['quote', 'price comparison'] }),
      ...mod(M('purchase_orders', 'purchase order', ['procurement.po.view', 'supplierportal.access'], 'procurement.po.create', 'procurement.po.create'), { id: 'proc-pos', label: 'Purchase Orders', icon: ShoppingCart, basePath: '/procurement/purchase-orders', description: 'POs with approval, supplier confirmation and receiving.', keywords: ['po', 'purchase order'] }),
      { id: 'proc-supplier-performance', label: 'Supplier Performance', icon: Star, path: '/procurement/suppliers-performance', permission: 'suppliers.performance.view', page: 'supplierPerformance', description: 'On-time delivery, quality acceptance, NCRs and spend per supplier.', keywords: ['supplier scorecard', 'vendor rating'] },
    ],
  },
  {
    id: 'import-export', label: 'Import & Export', icon: Ship,
    children: [
      { id: 'import-dashboard', label: 'Import Dashboard', icon: Gauge, path: '/import/dashboard', permission: 'import.shipments.view', page: 'enterpriseDashboard', dashboard: 'import', description: 'Shipments in transit, arrivals, customs and landed cost.', keywords: ['import', 'shipping', 'customs'] },
      ...mod(M('import_shipments', 'shipment', 'import.shipments.view', 'import.shipments.manage', 'import.shipments.manage'), { id: 'import-shipments', label: 'Shipments', icon: Container, basePath: '/import/shipments', description: 'Containers, documents, milestones and landed cost.', keywords: ['container', 'bl', 'landed cost', 'customs'] }),
    ],
  },
  {
    id: 'wms', label: 'Warehouse Operations', icon: Forklift,
    children: [
      { id: 'wms-dashboard', label: 'Warehouse Operations', icon: Gauge, path: '/warehouse/operations', permission: 'warehouse.tasks.view', page: 'enterpriseDashboard', dashboard: 'warehouse', description: 'Receiving, put-away, picking, packing and loading queues with productivity.', keywords: ['wms', 'warehouse tasks', 'productivity'] },
      ...mod(M('goods_receipts', 'goods receipt', 'warehouse.receiving.view', 'warehouse.receiving.manage', 'warehouse.receiving.manage'), { id: 'wms-receiving', label: 'Receiving (GRN)', icon: PackageOpen, basePath: '/warehouse/receiving', description: 'Goods receipts against POs with batch, expiry and QA hold.', keywords: ['grn', 'receiving', 'inbound'] }),
      ...mod(M('putaway_tasks', 'put-away task', 'warehouse.tasks.view', 'warehouse.putaway.manage', 'warehouse.putaway.manage'), { id: 'wms-putaway', label: 'Put-away', icon: Layers3, basePath: '/warehouse/putaway', description: 'Move received lots into bins.', keywords: ['putaway', 'bin'] }),
      ...mod(M('picking_tasks', 'pick task', 'warehouse.tasks.view', 'warehouse.picking.manage', 'warehouse.picking.manage'), { id: 'wms-picking', label: 'Picking', icon: PackageSearch, basePath: '/warehouse/picking', description: 'FEFO / FIFO pick lists and waves.', keywords: ['picking', 'fefo', 'wave'] }),
      ...mod(M('packing_tasks', 'packing task', 'warehouse.tasks.view', 'warehouse.packing.manage', 'warehouse.packing.manage'), { id: 'wms-packing', label: 'Packing', icon: PackageCheck, basePath: '/warehouse/packing', description: 'Package and label picked orders.', keywords: ['packing', 'label'] }),
      ...mod(M('loading_tasks', 'loading task', 'warehouse.tasks.view', 'warehouse.loading.manage', 'warehouse.loading.manage'), { id: 'wms-loading', label: 'Loading', icon: Truck, basePath: '/warehouse/loading', description: 'Vehicle loading with capacity check and seal number.', keywords: ['loading', 'seal', 'dock'] }),
      ...mod(M('warehouse_locations', 'location', 'warehouse.locations.view', 'warehouse.locations.manage', 'warehouse.locations.manage'), { id: 'wms-locations', label: 'Locations & Bins', icon: MapPin, basePath: '/warehouse/locations', description: 'Zone, aisle, rack, shelf and bin hierarchy.', keywords: ['location', 'bin', 'rack'] }),
    ],
  },
  {
    id: 'stock-control', label: 'Inventory Control', icon: ScanBarcode,
    children: [
      { id: 'inv-batches', label: 'Batches & Expiry', icon: ScanBarcode, path: '/inventory/batches', permission: 'inventory.batch.view', page: 'batchesPage', description: 'Lot-level stock by hub and bin with expiry, FEFO order, QA status and traceability.', keywords: ['batch', 'lot', 'expiry', 'fefo', 'traceability'] },
      ...mod(M('cycle_counts', 'cycle count', 'inventory.counts.view', 'inventory.counts.manage', 'inventory.counts.manage'), { id: 'inv-counts', label: 'Cycle Counts', icon: ClipboardCheck, basePath: '/inventory/counts', description: 'Physical counts with variance approval.', keywords: ['stock count', 'stocktake', 'variance'] }),
      ...mod(M('product_recalls', 'recall', 'inventory.recall.view', 'inventory.recall.manage', 'inventory.recall.manage'), { id: 'inv-recalls', label: 'Recalls', icon: ShieldAlert, basePath: '/inventory/recalls', description: 'Batch recalls with affected customers.', keywords: ['recall', 'withdrawal'] }),
    ],
  },
  {
    id: 'quality', label: 'Quality Assurance', icon: ClipboardCheck,
    children: [
      ...mod(M('qa_inspections', 'inspection', 'qa.inspection.view', 'qa.inspection.manage', 'qa.inspection.manage'), { id: 'qa-inspections', label: 'QA Inspections', icon: ClipboardCheck, basePath: '/qa/inspections', description: 'Inspections with hold, release and reject.', keywords: ['inspection', 'release', 'quarantine'] }),
      ...mod(M('temperature_logs', 'temperature reading', 'qa.inspection.view', ['qa.temperature.manage', 'warehouse.receiving.manage', 'driver.app'], 'qa.temperature.manage'), { id: 'qa-temperature', label: 'Temperature Logs', icon: ThermometerSnowflake, basePath: '/qa/temperature', description: 'Manual and simulated cold-chain readings.', keywords: ['temperature', 'cold chain', 'excursion'] }),
      ...mod(M('nonconformances', 'NCR', 'qa.inspection.view', 'qa.ncr.manage', 'qa.ncr.manage'), { id: 'qa-ncr', label: 'NCR & CAPA', icon: ShieldAlert, basePath: '/qa/ncr', description: 'Non-conformances with corrective and preventive actions.', keywords: ['ncr', 'capa', 'non-conformance'] }),
    ],
  },
  {
    id: 'logistics', label: 'Logistics', icon: Route,
    children: [
      { id: 'log-dashboard', label: 'Logistics Dashboard', icon: Gauge, path: '/logistics/dashboard', permission: 'logistics.planning.view', page: 'enterpriseDashboard', dashboard: 'logistics', description: 'On-time delivery, failed deliveries, reschedules and route plans.', keywords: ['logistics', 'delivery performance', 'otif'] },
      ...mod(M('route_plans', 'route plan', 'logistics.planning.view', 'logistics.planning.manage', 'logistics.planning.manage'), { id: 'log-routes', label: 'Route Plans', icon: Route, basePath: '/logistics/routes', description: 'Stops, windows and demo route optimisation.', keywords: ['route', 'optimise', 'stops'] }),
      ...mod(M('delivery_reschedules', 'reschedule', ['logistics.planning.view', 'driver.app'], ['logistics.planning.manage', 'driver.app', 'service.tickets.manage'], 'logistics.planning.manage'), { id: 'log-reschedules', label: 'Reschedules', icon: CalendarClock, basePath: '/logistics/reschedules', description: 'Delivery date / window change requests.', keywords: ['reschedule', 'delivery window'] }),
    ],
  },
  {
    id: 'fleet-ops', label: 'Fleet Operations', icon: Wrench,
    children: [
      { id: 'fleet-dashboard', label: 'Fleet Dashboard', icon: Gauge, path: '/fleet/dashboard', permission: ['fleet.analytics.view', 'fleet.maintenance.view'], page: 'enterpriseDashboard', dashboard: 'fleet', description: 'Availability, maintenance, fuel efficiency and cost per vehicle.', keywords: ['fleet', 'vehicles', 'km per litre'] },
      ...mod(M('vehicle_maintenance', 'maintenance job', 'fleet.maintenance.view', 'fleet.maintenance.manage', 'fleet.maintenance.manage'), { id: 'fleet-maintenance', label: 'Maintenance', icon: Wrench, basePath: '/fleet/maintenance', description: 'Service and repair jobs with cost approval.', keywords: ['maintenance', 'service', 'repair'] }),
      ...mod(M('fuel_logs', 'fuel entry', ['fleet.fuel.view', 'driver.app'], ['fleet.fuel.manage', 'driver.app'], 'fleet.fuel.manage'), { id: 'fleet-fuel', label: 'Fuel Logs', icon: Fuel, basePath: '/fleet/fuel', description: 'Fuel fills and efficiency.', keywords: ['fuel', 'diesel', 'litres'] }),
      ...mod(M('driver_expenses', 'driver expense', ['drivers.expenses.view', 'driver.app'], ['drivers.expenses.manage', 'driver.app'], 'drivers.expenses.manage'), { id: 'driver-expenses', label: 'Driver Expenses', icon: Receipt, basePath: '/drivers/expenses', description: 'Driver claims with approval and reimbursement.', keywords: ['toll', 'parking', 'driver claim'] }),
    ],
  },
  {
    id: 'finance', label: 'Finance', icon: Landmark,
    children: [
      { id: 'fin-dashboard', label: 'Finance Dashboard', icon: Gauge, path: '/finance/dashboard', permission: 'finance.dashboard.view', page: 'enterpriseDashboard', dashboard: 'finance', description: 'Receivables, payables, cash, collections and expenses — all calculated from records.', keywords: ['finance', 'cash flow', 'dso'] },
      { id: 'fin-receivables', label: 'Receivables & Aging', icon: CircleDollarSign, path: '/finance/receivables', permission: 'finance.ar.view', page: 'receivablesPage', description: 'AR aging, customer statements and credit hold.', keywords: ['ar', 'aging', 'statement', 'credit hold'] },
      ...mod(M('customer_payments', 'receipt', ['finance.ar.view', 'driver.app', 'customerportal.finance'], ['finance.ar.manage', 'driver.app', 'finance.cash.manage'], 'finance.ar.manage'), { id: 'fin-payments', label: 'Customer Receipts', icon: Wallet, basePath: '/finance/payments', description: 'Receipts allocated to invoices.', keywords: ['payment', 'receipt', 'collection'] }),
      ...mod(M('credit_notes', 'credit note', ['finance.ar.view', 'customerportal.finance'], ['finance.ar.manage', 'sales.returns.approve'], 'finance.ar.manage'), { id: 'fin-credit-notes', label: 'Credit Notes', icon: Undo2, basePath: '/finance/credit-notes', description: 'Customer credit notes with VAT.', keywords: ['credit note'] }),
      { id: 'fin-payables', label: 'Payables & Aging', icon: Scale, path: '/finance/payables', permission: 'finance.ap.view', page: 'payablesPage', description: 'AP aging and supplier balances.', keywords: ['ap', 'payables', 'supplier balance'] },
      ...mod(M('supplier_invoices', 'supplier invoice', ['finance.ap.view', 'supplierportal.access'], ['finance.ap.manage', 'supplierportal.access'], 'finance.ap.manage'), { id: 'fin-supplier-invoices', label: 'Supplier Invoices', icon: FileText, basePath: '/finance/payables/invoices', description: 'Supplier bills with 3-way match.', keywords: ['bill', '3-way match', 'supplier invoice'] }),
      ...mod(M('supplier_payments', 'supplier payment', ['finance.ap.view', 'supplierportal.access'], 'finance.ap.manage', 'finance.ap.manage'), { id: 'fin-supplier-payments', label: 'Supplier Payments', icon: HandCoins, basePath: '/finance/payables/payments', description: 'Payments to suppliers (recorded).', keywords: ['supplier payment'] }),
      ...mod(M('expenses', 'expense', 'finance.expenses.view', 'finance.expenses.manage', 'finance.expenses.manage'), { id: 'fin-expenses', label: 'Expenses', icon: Receipt, basePath: '/finance/expenses', description: 'Operating expenses with VAT and TRN.', keywords: ['expense', 'cost'] }),
      ...mod(M('bank_accounts', 'account', 'finance.cash.view', 'finance.cash.manage', 'finance.cash.manage'), { id: 'fin-cash', label: 'Bank & Cash', icon: Landmark, basePath: '/finance/cash', description: 'Bank and petty-cash balances.', keywords: ['bank', 'cash', 'balance'] }),
      ...mod(M('vouchers', 'voucher', 'finance.cash.view', 'finance.cash.manage', 'finance.cash.manage'), { id: 'fin-vouchers', label: 'Vouchers', icon: Banknote, basePath: '/finance/vouchers', description: 'Receipt, payment and journal vouchers.', keywords: ['voucher', 'journal'] }),
      ...mod(M('cash_closings', 'cash closing', 'finance.cash.view', 'finance.cash.manage', 'finance.cash.manage'), { id: 'fin-cash-closing', label: 'Daily Cash Closing', icon: Wallet, basePath: '/finance/cash-closing', description: 'Cash count vs receipts per hub.', keywords: ['cash closing', 'till'] }),
      { id: 'fin-vat', label: 'VAT Summary', icon: Percent, path: '/finance/vat', permission: 'finance.vat.view', page: 'vatPage', description: 'Output and input tax from records, with TRN checks (not filed with the FTA).', keywords: ['vat', 'trn', 'tax return'] },
    ],
  },
  {
    id: 'hr', label: 'Human Resources', icon: Users,
    children: [
      { id: 'hr-dashboard', label: 'HR Dashboard', icon: Gauge, path: '/hr/dashboard', permission: 'hr.dashboard.view', page: 'enterpriseDashboard', dashboard: 'hr', description: 'Headcount, attendance, leave, recruitment and document expiry.', keywords: ['hr', 'headcount', 'attendance'] },
      ...mod(M('employees', 'employee', ['hr.employees.view', 'ess.access'], 'hr.employees.manage', 'hr.employees.manage'), { id: 'hr-employees', label: 'Employees', icon: IdCard, basePath: '/hr/employees', description: 'Employee records linked to users and the organization.', keywords: ['employee', 'staff', 'visa', 'emirates id'] }),
      ...mod(M('job_requisitions', 'job requisition', 'hr.recruitment.view', 'hr.recruitment.manage', 'hr.recruitment.manage'), { id: 'hr-recruitment', label: 'Recruitment', icon: Briefcase, basePath: '/hr/recruitment', description: 'Job requisitions and headcount approval.', keywords: ['recruitment', 'vacancy', 'hiring'] }),
      ...mod(M('candidates', 'candidate', 'hr.recruitment.view', 'hr.recruitment.manage', 'hr.recruitment.manage'), { id: 'hr-candidates', label: 'Candidates', icon: UserPlus, basePath: '/hr/candidates', description: 'Candidate pipeline to hire.', keywords: ['candidate', 'interview', 'offer'] }),
      ...mod(M('employee_attendance', 'attendance record', ['hr.attendance.view', 'ess.access'], ['hr.attendance.manage', 'ess.access'], 'hr.attendance.manage'), { id: 'hr-attendance', label: 'Attendance', icon: CalendarDays, basePath: '/hr/attendance', description: 'Daily attendance (manual / demo device).', keywords: ['attendance', 'check in', 'late'] }),
      ...mod(M('leave_requests', 'leave request', ['hr.leave.view', 'ess.access'], ['hr.leave.view', 'ess.access'], 'hr.leave.approve'), { id: 'hr-leave', label: 'Leave', icon: CalendarClock, basePath: '/hr/leave', description: 'Leave requests and approvals.', keywords: ['leave', 'vacation', 'sick'] }),
      ...mod(M('salary_structures', 'salary structure', 'hr.payroll.view', 'hr.payroll.manage', 'hr.payroll.manage'), { id: 'hr-salary', label: 'Salary Structures', icon: Coins, basePath: '/hr/salary', description: 'Pay components per employee (demo).', keywords: ['salary', 'allowance'] }),
      ...mod(M('payroll', 'payroll run', 'hr.payroll.view', 'hr.payroll.manage', 'hr.payroll.manage'), { id: 'hr-payroll', label: 'Payroll (Demo)', icon: Banknote, basePath: '/hr/payroll', description: 'Demo payroll runs — no WPS / bank integration.', keywords: ['payroll', 'payslip', 'wps'] }),
    ],
  },
  {
    id: 'self-service', label: 'Self-Service & Portals', icon: BookUser,
    children: [
      { id: 'ess', label: 'My HR (Self-Service)', icon: BookUser, path: '/ess', permission: 'ess.access', page: 'essPage', description: 'Your employee profile, attendance, leave balance and requests, and payslips.', keywords: ['ess', 'my leave', 'payslip', 'self service'] },
      { id: 'supplier-portal', label: 'Supplier Portal', icon: Building, path: '/supplier', permission: 'supplierportal.access', page: 'supplierPortal', description: 'Your purchase orders, RFQs to quote, deliveries and invoices (your company only).', keywords: ['supplier portal', 'vendor'] },
      { id: 'supplier-finance', label: 'Supplier Finance', icon: Wallet, path: '/supplier/finance', permission: 'supplierportal.access', page: 'supplierPortal', portalTab: 'finance', description: 'Your invoices, payments and balance.', keywords: ['supplier invoice', 'payment status'] },
    ],
  },
]

/** Extra routes inside the existing driver and customer app groups. */
export const DRIVER_EXTRA_ITEMS = [
  { id: 'driver-expenses-app', label: 'Expenses & Cash', icon: Receipt, path: '/driver/expenses', permission: 'driver.app', page: 'driverExpenses', description: 'Your expense claims, fuel fills, cash collections and reschedule requests.', keywords: ['expenses', 'fuel', 'cash', 'reschedule'] },
]
export const CUSTOMER_EXTRA_ITEMS = [
  { id: 'customer-statement', label: 'Statement', icon: Scale, path: '/customer/statement', permission: 'customer.app', page: 'customerStatement', description: 'Your statement of account, receipts and credit notes.', keywords: ['statement', 'balance', 'payments'] },
  { id: 'customer-support', label: 'Support', icon: Ticket, path: '/customer/support', permission: 'customer.app', page: 'customerSupport', description: 'Raise and follow complaints and requests.', keywords: ['complaint', 'support', 'ticket'] },
]
