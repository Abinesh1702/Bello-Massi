# Department & Role Matrix (data v9)

17 departments are configurable in Administration › Organization › Departments (ten were added with the enterprise release; existing departments were kept). Every role has a code, name, department, description, landing page, data scope, status and permission set. The 13 existing system roles were **kept unchanged** (their equivalents were not duplicated); 71 enterprise roles were added through the same role store, so Role Management, the Permission Matrix, navigation, route guards and global search use them immediately.

## Departments

- Sales
- HORECA Sales
- Van Sales
- Customer Service
- Procurement
- Import & Export
- Warehouse
- Inventory Control
- Quality Assurance
- Logistics
- Fleet Management
- Drivers
- Finance
- HR
- Operations
- IT / System Administration
- Management

## Existing system roles (unchanged, now with a department)

| Code | Name | Department | Data scope |
|---|---|---|---|
| `SUPER_ADMIN` | Super Admin | IT / System Administration | ADMIN |
| `ADMIN` | Administrator | IT / System Administration | ADMIN |
| `SALESMAN` | Sales Executive | Sales | SALESMAN |
| `SALES_MANAGER` | Sales Manager | Sales | SALES_MANAGER |
| `CUSTOMER_SERVICE` | Customer Service | Customer Service | CUSTOMER_SERVICE |
| `DISPATCHER` | Dispatcher | Logistics | DISPATCHER |
| `DRIVER` | Driver | Drivers | DRIVER |
| `FINANCE` | Finance Executive | Finance | FINANCE |
| `WAREHOUSE_MANAGER` | Warehouse Manager | Warehouse | DISPATCHER |
| `INVENTORY_EXECUTIVE` | Inventory Executive | Inventory Control | DISPATCHER |
| `QA_MANAGER` | QA Manager | Quality Assurance | DISPATCHER |
| `CUSTOMER` | Customer (Portal) | Portal | CUSTOMER |
| `SUPPLIER` | Supplier (Portal) | Portal | SUPPLIER |

## Enterprise roles

Data scope codes: ADMIN = all records; SALESMAN = own records; DISPATCHER = hub / operational; DRIVER = own deliveries & claims; CUSTOMER = linked customer only; SUPPLIER = linked supplier only; FINANCE / SALES_MANAGER / CUSTOMER_SERVICE = department-wide.

| Code | Role | Department | Landing page | Data scope | Permissions | Description |
|---|---|---|---|---|---|---|
| `IT_ADMIN` | IT Administrator | IT / System Administration | `/dashboard` | ADMIN | 14 | Users, devices, application settings, backups and environment health. |
| `APP_ADMIN` | Application Administrator | IT / System Administration | `/dashboard` | ADMIN | 15 | Configures workflows, templates, numbering and application options. |
| `MASTER_DATA_ADMIN` | Master Data Administrator | IT / System Administration | `/customers` | ADMIN | 17 | Owns customer, product, supplier, hub, location and fleet master data. |
| `SECURITY_ADMIN` | Security Administrator | IT / System Administration | `/admin/audit-logs` | ADMIN | 11 | Reviews access, roles, permissions and the audit trail. |
| `AUDIT_VIEWER` | Audit Viewer | IT / System Administration | `/admin/audit-logs` | ADMIN | 12 | Read-only access to the audit log and financial / stock registers. |
| `CEO` | CEO / Managing Director | Management | `/management/dashboard` | ADMIN | 37 | Company-wide KPIs, approvals escalated to management and the control tower. |
| `GENERAL_MANAGER` | General Manager | Management | `/management/dashboard` | ADMIN | 41 | Runs day-to-day operations across departments. |
| `OPERATIONS_DIRECTOR` | Operations Director / Manager | Operations | `/operations/control-tower` | ADMIN | 50 | Owns the control tower, SLAs, exceptions and escalations. |
| `SALES_DIRECTOR` | Sales Director | Sales | `/sales/dashboard` | ADMIN | 46 | Sales strategy, targets, pricing approval and channel performance. |
| `FINANCE_MANAGER` | Finance Manager | Finance | `/finance/dashboard` | FINANCE | 37 | Receivables, payables, cash, VAT, approvals and financial reporting. |
| `SUPPLY_CHAIN_MANAGER` | Supply Chain Manager | Operations | `/procurement/dashboard` | ADMIN | 38 | End-to-end supply: demand, purchasing, import, warehouse availability. |
| `LOGISTICS_MANAGER` | Logistics Manager | Logistics | `/logistics/dashboard` | DISPATCHER | 31 | Dispatch, routes, delivery SLA, drivers and fleet. |
| `HR_MANAGER` | HR Manager | HR | `/hr/dashboard` | ADMIN | 21 | Employees, recruitment, attendance, leave and payroll. |
| `SALES_REP` | Sales Representative | Sales | `/sales/dashboard` | SALESMAN | 26 | Field sales: visits, leads and order capture for own accounts. |
| `SALES_COORDINATOR` | Sales Coordinator | Sales | `/sales/dashboard` | SALES_MANAGER | 28 | Coordinates the sales team, follow-ups and order corrections. |
| `HORECA_SALES_MANAGER` | HORECA Sales Manager | HORECA Sales | `/horeca` | SALES_MANAGER | 45 | Hotel, restaurant and catering accounts, contracts and pricing. |
| `HORECA_SALES_EXEC` | HORECA Sales Executive | HORECA Sales | `/horeca` | SALESMAN | 28 | Manages assigned HORECA accounts, templates and recurring orders. |
| `KEY_ACCOUNT_MANAGER` | Key Account Manager | HORECA Sales | `/horeca` | SALES_MANAGER | 29 | Key accounts, contracts, SLA and demand planning. |
| `VAN_SALES_MANAGER` | Van Sales Manager | Van Sales | `/van-sales` | SALES_MANAGER | 21 | Routes, van loading, settlements and cash variance. |
| `VAN_SALES_EXEC` | Van Sales Executive | Van Sales | `/van-sales/app` | SALESMAN | 9 | Sells from the van on an assigned route, collects payment, settles daily. |
| `VAN_SALES_DRIVER` | Van Sales Driver | Van Sales | `/van-sales/app` | SALESMAN | 9 | Drives the sales van, sells and collects on the route. |
| `CS_MANAGER` | Customer Service Manager | Customer Service | `/service/tickets` | CUSTOMER_SERVICE | 25 | Customer service team, complaints, SLA and consolidation. |
| `SALES_ORDER_CONTROLLER` | Sales Order Controller | Customer Service | `/orders` | CUSTOMER_SERVICE | 18 | Order accuracy, changes, cancellations and release to the warehouse. |
| `PROCUREMENT_MANAGER` | Procurement Manager | Procurement | `/procurement/dashboard` | ADMIN | 27 | Approves requisitions and purchase orders; manages suppliers and contracts. |
| `PROCUREMENT_EXEC` | Procurement Executive | Procurement | `/procurement/dashboard` | ADMIN | 18 | Raises RFQs, compares quotations and prepares purchase orders. |
| `BUYER` | Buyer | Procurement | `/procurement/purchase-orders` | ADMIN | 18 | Buys against approved requisitions within delegated limits. |
| `PURCHASE_COORDINATOR` | Purchase Coordinator | Procurement | `/procurement/purchase-orders` | ADMIN | 13 | Tracks POs, delivery schedules and receipts. |
| `SUPPLIER_RELATIONSHIP_MANAGER` | Supplier Relationship Manager | Procurement | `/procurement/suppliers-performance` | ADMIN | 13 | Supplier performance, rating, contracts and documents. |
| `IMPORT_MANAGER` | Import Manager | Import & Export | `/import/dashboard` | ADMIN | 14 | Import / export programme, customs clearance and landed cost. |
| `IMPORT_EXEC` | Import Executive | Import & Export | `/import/dashboard` | ADMIN | 10 | Shipment register, documents and milestones. |
| `EXPORT_EXEC` | Export Executive | Import & Export | `/import/shipments` | ADMIN | 10 | Export shipments and documentation. |
| `SHIPPING_COORDINATOR` | Shipping Coordinator | Import & Export | `/import/shipments` | ADMIN | 11 | Bookings, containers, ETA / ETD and arrival coordination. |
| `CUSTOMS_DOC_EXEC` | Customs Documentation Executive | Import & Export | `/import/shipments` | ADMIN | 10 | Customs declarations, certificates and clearance documents. |
| `WAREHOUSE_SUPERVISOR` | Warehouse Supervisor | Warehouse | `/warehouse/operations` | DISPATCHER | 24 | Supervises receiving, putaway, picking, packing and loading. |
| `WAREHOUSE_EXEC` | Warehouse Executive | Warehouse | `/warehouse/operations` | DISPATCHER | 21 | Executes warehouse tasks. |
| `RECEIVING_CLERK` | Receiving Clerk | Warehouse | `/warehouse/receiving` | DISPATCHER | 17 | Receives goods against purchase orders. |
| `PUTAWAY_OPERATOR` | Putaway Operator | Warehouse | `/warehouse/putaway` | DISPATCHER | 16 | Moves received stock to bin locations. |
| `PICKER` | Picker | Warehouse | `/warehouse/picking` | DISPATCHER | 16 | Picks orders (FEFO) and reports short picks. |
| `PACKER` | Packer | Warehouse | `/warehouse/packing` | DISPATCHER | 16 | Packs and verifies orders. |
| `LOADING_SUPERVISOR` | Loading Supervisor | Warehouse | `/warehouse/loading` | DISPATCHER | 18 | Loading plans, capacity checks, seals and dispatch release. |
| `INVENTORY_MANAGER` | Inventory Manager | Inventory Control | `/inventory` | DISPATCHER | 44 | Stock accuracy, valuation, counts, ageing and replenishment. |
| `STOCK_AUDITOR` | Stock Auditor | Inventory Control | `/inventory/counts` | DISPATCHER | 19 | Cycle and physical counts, variance investigation. |
| `QA_OFFICER` | QA Officer | Quality Assurance | `/qa/inspections` | DISPATCHER | 16 | Inspections, NCRs and documentation. |
| `QA_INSPECTOR` | Quality Inspector | Quality Assurance | `/qa/inspections` | DISPATCHER | 16 | Incoming, batch and temperature inspections. |
| `FOOD_SAFETY_OFFICER` | Food Safety Officer | Quality Assurance | `/qa/ncr` | DISPATCHER | 25 | Food safety documents, recalls and CAPA. |
| `COLD_CHAIN_CONTROLLER` | Cold Chain Controller | Quality Assurance | `/qa/temperature` | DISPATCHER | 14 | Cold-chain readings and temperature excursions. |
| `DISPATCH_SUPERVISOR` | Dispatch Supervisor | Logistics | `/dispatch` | DISPATCHER | 20 | Dispatch team, exceptions and reattempts. |
| `ROUTE_PLANNER` | Route Planner | Logistics | `/logistics/routes` | DISPATCHER | 14 | Route sequence, delivery windows and capacity. |
| `FLEET_MANAGER` | Fleet Manager | Fleet Management | `/fleet/dashboard` | DISPATCHER | 20 | Vehicles, maintenance, fuel, compliance and fleet cost. |
| `FLEET_SUPERVISOR` | Fleet Supervisor | Fleet Management | `/fleet/dashboard` | DISPATCHER | 15 | Daily vehicle availability and maintenance follow-up. |
| `FLEET_MAINT_EXEC` | Fleet Maintenance Executive | Fleet Management | `/fleet/maintenance` | DISPATCHER | 8 | Work orders, repairs and spare parts. |
| `TRANSPORT_COORDINATOR` | Transport Coordinator | Logistics | `/logistics/dashboard` | DISPATCHER | 15 | Vehicle and driver availability for dispatch. |
| `HEAVY_VEHICLE_DRIVER` | Heavy Vehicle Driver | Drivers | `/driver/dashboard` | DRIVER | 5 | Drives heavy / reefer trucks on assigned dispatches. |
| `DRIVER_SUPERVISOR` | Driver Supervisor | Drivers | `/dispatch/drivers` | DISPATCHER | 17 | Driver attendance, availability, incidents and settlements. |
| `ACCOUNTANT` | Accountant | Finance | `/finance/dashboard` | FINANCE | 23 | Books receipts, payments, vouchers and reconciliations. |
| `AR_EXEC` | Accounts Receivable Executive | Finance | `/finance/receivables` | FINANCE | 20 | Customer receipts, allocation, statements and collections. |
| `AP_EXEC` | Accounts Payable Executive | Finance | `/finance/payables` | FINANCE | 22 | Supplier invoices, matching and payments. |
| `CREDIT_CONTROLLER` | Credit Controller | Finance | `/finance/receivables` | FINANCE | 20 | Credit limits, holds, aging and collection follow-up. |
| `CASHIER` | Cashier | Finance | `/finance/cash` | FINANCE | 19 | Cash receipts, payments and daily cash closing. |
| `BILLING_EXEC` | Billing Executive | Finance | `/invoices` | FINANCE | 18 | Customer invoices and credit notes. |
| `FINANCE_AUDITOR` | Finance Auditor | Finance | `/finance/dashboard` | FINANCE | 20 | Read-only review of financial records. |
| `HR_EXEC` | HR Executive | HR | `/hr/dashboard` | ADMIN | 13 | Employee records, attendance and recruitment. |
| `RECRUITER` | Recruiter | HR | `/hr/recruitment` | ADMIN | 6 | Job openings, candidates, interviews and offers. |
| `PAYROLL_EXEC` | Payroll Executive | HR | `/hr/payroll` | ADMIN | 7 | Salary structures and payroll calculation (prototype). |
| `ATTENDANCE_ADMIN` | Attendance Administrator | HR | `/hr/attendance` | ADMIN | 7 | Shifts, attendance corrections and monthly attendance. |
| `EMPLOYEE` | Employee (Self-Service) | HR | `/ess` | SALESMAN | 3 | Own profile, attendance, leave, payslips and requests. |
| `CUSTOMER_BUYER` | Customer Buyer | Portal | `/customer/dashboard` | CUSTOMER | 3 | Places orders for the linked customer account. |
| `CUSTOMER_APPROVER` | Customer Approver | Portal | `/customer/dashboard` | CUSTOMER | 4 | Reviews the account’s orders, deliveries and statements. |
| `CUSTOMER_FINANCE` | Customer Finance User | Portal | `/customer/statement` | CUSTOMER | 3 | Statement, invoices and payment history of the linked account. |
| `SUPPLIER_SALES` | Supplier Sales User | Portal | `/supplier` | SUPPLIER | 2 | Confirms POs, submits quotations and updates shipments for the linked supplier. |
| `SUPPLIER_FINANCE` | Supplier Finance User | Portal | `/supplier/finance` | SUPPLIER | 2 | Invoice and payment status and statement of the linked supplier. |

## Enterprise permissions (112 keys, catalog v4)

| Key | Module | Action | Label | Default existing roles |
|---|---|---|---|---|
| `sales.leads.view` | CRM & Sales activity | view | View leads | ADMIN, SALES_MANAGER, SALESMAN |
| `sales.leads.create` | CRM & Sales activity | create | Create leads | ADMIN, SALES_MANAGER, SALESMAN |
| `sales.leads.edit` | CRM & Sales activity | edit | Edit leads | ADMIN, SALES_MANAGER, SALESMAN |
| `sales.leads.manage` | CRM & Sales activity | manage | Assign, convert and close any lead | ADMIN, SALES_MANAGER |
| `sales.opportunities.view` | CRM & Sales activity | view | View opportunities / pipeline | ADMIN, SALES_MANAGER, SALESMAN |
| `sales.opportunities.manage` | CRM & Sales activity | manage | Create and update opportunities | ADMIN, SALES_MANAGER, SALESMAN |
| `sales.activities.view` | CRM & Sales activity | view | View visits, meetings and follow-ups | ADMIN, SALES_MANAGER, SALESMAN, CUSTOMER_SERVICE |
| `sales.activities.manage` | CRM & Sales activity | manage | Plan and record visits, meetings and follow-ups | ADMIN, SALES_MANAGER, SALESMAN, CUSTOMER_SERVICE |
| `sales.targets.view` | Sales management & pricing | view | View sales targets and achievement | ADMIN, SALES_MANAGER, SALESMAN, FINANCE |
| `sales.commission.manage` | Sales management & pricing | manage | Configure commission and incentive rules | ADMIN, SALES_MANAGER |
| `sales.pricing.view` | Sales management & pricing | view | View price lists and margins | ADMIN, SALES_MANAGER, SALESMAN, FINANCE |
| `sales.pricing.manage` | Sales management & pricing | manage | Create and edit price lists | ADMIN, SALES_MANAGER |
| `sales.pricing.approve` | Sales management & pricing | approve | Approve price lists | ADMIN, SALES_MANAGER, FINANCE |
| `sales.returns.view` | Sales management & pricing | view | View sales returns | ADMIN, SALES_MANAGER, SALESMAN, CUSTOMER_SERVICE, FINANCE, WAREHOUSE_MANAGER |
| `sales.returns.manage` | Sales management & pricing | manage | Raise sales returns | ADMIN, SALES_MANAGER, SALESMAN, CUSTOMER_SERVICE |
| `sales.returns.approve` | Sales management & pricing | approve | Approve sales returns | ADMIN, SALES_MANAGER |
| `sales.orderchanges.request` | Sales management & pricing | create | Request order cancellation / modification | ADMIN, SALES_MANAGER, SALESMAN, CUSTOMER_SERVICE |
| `sales.orderchanges.approve` | Sales management & pricing | approve | Approve order cancellation / modification | ADMIN, SALES_MANAGER |
| `service.tickets.view` | Customer service | view | View complaints and service tickets | ADMIN, SALES_MANAGER, SALESMAN, CUSTOMER_SERVICE, QA_MANAGER |
| `service.tickets.manage` | Customer service | manage | Create, assign and resolve tickets | ADMIN, SALES_MANAGER, CUSTOMER_SERVICE, QA_MANAGER |
| `customers.approve` | Customer service | approve | Approve new customer accounts | ADMIN, SALES_MANAGER, FINANCE |
| `horeca.view` | HORECA sales | view | HORECA workspace | ADMIN, SALES_MANAGER, SALESMAN |
| `horeca.manage` | HORECA sales | manage | Manage HORECA accounts, contracts and order templates | ADMIN, SALES_MANAGER |
| `horeca.contracts.approve` | HORECA sales | approve | Approve HORECA contracts | ADMIN, SALES_MANAGER |
| `vansales.view` | Van sales | view | Van sales dashboard and records | ADMIN, SALES_MANAGER, FINANCE |
| `vansales.manage` | Van sales | manage | Assign vans, load and transfer van stock | ADMIN, SALES_MANAGER, WAREHOUSE_MANAGER |
| `vansales.app` | Van sales | create | Van sales app — sell, collect, return | ADMIN |
| `vansales.settle.approve` | Van sales | approve | Approve van settlements | ADMIN, SALES_MANAGER, FINANCE |
| `procurement.requisitions.view` | Purchasing (PR, RFQ, PO) | view | View purchase requisitions | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE, FINANCE |
| `procurement.requisitions.create` | Purchasing (PR, RFQ, PO) | create | Raise purchase requisitions | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE |
| `procurement.requisitions.approve` | Purchasing (PR, RFQ, PO) | approve | Approve purchase requisitions | ADMIN |
| `procurement.rfq.view` | Purchasing (PR, RFQ, PO) | view | View RFQs and supplier quotations | ADMIN, WAREHOUSE_MANAGER, FINANCE |
| `procurement.rfq.manage` | Purchasing (PR, RFQ, PO) | manage | Issue RFQs, record and compare quotations | ADMIN |
| `procurement.rfq.approve` | Purchasing (PR, RFQ, PO) | approve | Award RFQs (creates the purchase order) | ADMIN |
| `procurement.po.view` | Purchasing (PR, RFQ, PO) | view | View purchase orders | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE, FINANCE, QA_MANAGER |
| `procurement.po.create` | Purchasing (PR, RFQ, PO) | create | Create and revise purchase orders | ADMIN |
| `procurement.po.approve` | Purchasing (PR, RFQ, PO) | approve | Approve / cancel purchase orders | ADMIN |
| `procurement.po.overreceive` | Purchasing (PR, RFQ, PO) | manage | Receive more than the ordered quantity | ADMIN |
| `suppliers.performance.view` | Purchasing (PR, RFQ, PO) | view | Supplier performance, rating and price history | ADMIN, FINANCE, QA_MANAGER |
| `import.shipments.view` | Import & export | view | View import / export shipments | ADMIN, WAREHOUSE_MANAGER, FINANCE |
| `import.shipments.manage` | Import & export | manage | Create and update shipments, milestones and documents | ADMIN |
| `import.shipments.approve` | Import & export | approve | Approve customs clearance and close shipments | ADMIN |
| `import.landedcost.manage` | Import & export | manage | Calculate and post landed cost | ADMIN, FINANCE |
| `warehouse.locations.view` | Warehouse operations | view | View warehouse locations and utilisation | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE, DISPATCHER |
| `warehouse.locations.manage` | Warehouse operations | manage | Manage zones, aisles, racks and bins | ADMIN, WAREHOUSE_MANAGER |
| `warehouse.receiving.view` | Warehouse operations | view | View goods receipts (GRN) | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE, QA_MANAGER, FINANCE |
| `warehouse.receiving.manage` | Warehouse operations | manage | Receive goods against purchase orders | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE |
| `warehouse.putaway.manage` | Warehouse operations | manage | Putaway tasks | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE |
| `warehouse.picking.manage` | Warehouse operations | manage | Pick lists and pick confirmation | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE |
| `warehouse.packing.manage` | Warehouse operations | manage | Packing verification | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE |
| `warehouse.loading.manage` | Warehouse operations | manage | Loading plans, seals and dispatch release | ADMIN, WAREHOUSE_MANAGER, DISPATCHER |
| `warehouse.tasks.view` | Warehouse operations | view | Warehouse task queues and productivity | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE, DISPATCHER |
| `inventory.batch.view` | Batches, expiry & recall | view | Batch / lot stock and expiry | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE, QA_MANAGER, DISPATCHER |
| `inventory.batch.manage` | Batches, expiry & recall | manage | Edit batch details and bin locations | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE |
| `inventory.recall.view` | Batches, expiry & recall | view | View product recalls | ADMIN, WAREHOUSE_MANAGER, QA_MANAGER |
| `inventory.recall.manage` | Batches, expiry & recall | manage | Open and close product / batch recalls | ADMIN, QA_MANAGER |
| `inventory.counts.view` | Batches, expiry & recall | view | View cycle counts | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE, FINANCE |
| `inventory.counts.manage` | Batches, expiry & recall | manage | Record cycle / physical counts | ADMIN, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE |
| `inventory.counts.approve` | Batches, expiry & recall | approve | Approve count variances (posts adjustments) | ADMIN, WAREHOUSE_MANAGER |
| `qa.inspection.view` | Quality assurance | view | View QA inspections | ADMIN, QA_MANAGER, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE |
| `qa.inspection.manage` | Quality assurance | manage | Record QA inspections | ADMIN, QA_MANAGER |
| `qa.release` | Quality assurance | approve | Release stock from QA hold / quarantine | ADMIN, QA_MANAGER |
| `qa.reject` | Quality assurance | reject | Reject stock (blocks it from sale) | ADMIN, QA_MANAGER |
| `qa.ncr.manage` | Quality assurance | manage | Non-conformance reports and CAPA | ADMIN, QA_MANAGER |
| `qa.temperature.manage` | Quality assurance | manage | Record cold-chain temperature readings | ADMIN, QA_MANAGER, WAREHOUSE_MANAGER, DISPATCHER |
| `logistics.planning.view` | Logistics planning | view | Delivery scheduling, SLA and route performance | ADMIN, DISPATCHER, SALES_MANAGER |
| `logistics.planning.manage` | Logistics planning | manage | Delivery windows, rescheduling and route optimisation demo | ADMIN, DISPATCHER |
| `logistics.planning.approve` | Logistics planning | approve | Publish route plans | ADMIN, DISPATCHER |
| `fleet.maintenance.view` | Fleet maintenance & fuel | view | View maintenance work orders | ADMIN, DISPATCHER |
| `fleet.maintenance.manage` | Fleet maintenance & fuel | manage | Create and close maintenance work orders | ADMIN |
| `fleet.maintenance.approve` | Fleet maintenance & fuel | approve | Approve maintenance cost | ADMIN |
| `fleet.fuel.view` | Fleet maintenance & fuel | view | View fuel logs | ADMIN, DISPATCHER, FINANCE |
| `fleet.fuel.manage` | Fleet maintenance & fuel | manage | Record fuel entries | ADMIN, DISPATCHER, DRIVER |
| `fleet.analytics.view` | Fleet maintenance & fuel | view | Fleet utilisation and cost analytics | ADMIN, DISPATCHER, FINANCE |
| `drivers.expenses.manage` | Driver expenses & cash | create | Submit own expenses and cash collections (driver app) | DRIVER |
| `drivers.expenses.view` | Driver expenses & cash | view | View driver expenses, cash and settlements | ADMIN, DISPATCHER, FINANCE |
| `drivers.expenses.approve` | Driver expenses & cash | approve | Approve driver expenses and settlements | ADMIN, FINANCE |
| `operations.controltower.view` | Operations control tower | view | Operations Control Tower | ADMIN, DISPATCHER, WAREHOUSE_MANAGER |
| `operations.exceptions.view` | Operations control tower | view | View operational exceptions | ADMIN, DISPATCHER, WAREHOUSE_MANAGER, QA_MANAGER, CUSTOMER_SERVICE |
| `operations.exceptions.manage` | Operations control tower | manage | Assign, resolve and escalate exceptions | ADMIN, DISPATCHER |
| `management.dashboard.view` | Management dashboards | view | Management (CEO) dashboard | ADMIN |
| `finance.ar.view` | Accounts receivable | view | Receivables, payments, statements and aging | ADMIN, FINANCE |
| `finance.ar.manage` | Accounts receivable | manage | Record receipts, allocations, credit notes and refunds | ADMIN, FINANCE |
| `finance.credithold.manage` | Accounts receivable | approve | Place / release customer credit hold | ADMIN, FINANCE |
| `finance.ap.view` | Accounts payable | view | Payables, supplier invoices and aging | ADMIN, FINANCE |
| `finance.ap.manage` | Accounts payable | manage | Record supplier invoices and payments | ADMIN, FINANCE |
| `finance.ap.approve` | Accounts payable | approve | Approve supplier invoices for payment | ADMIN |
| `finance.expenses.view` | Expenses | view | View expense claims | ADMIN, FINANCE |
| `finance.expenses.manage` | Expenses | create | Submit expense claims | ADMIN, FINANCE, SALES_MANAGER, SALESMAN, DISPATCHER, WAREHOUSE_MANAGER |
| `finance.expenses.approve` | Expenses | approve | Approve and reimburse expense claims | ADMIN, FINANCE |
| `finance.cash.view` | Cash, bank & VAT | view | Cash register, bank accounts and vouchers | ADMIN, FINANCE |
| `finance.cash.manage` | Cash, bank & VAT | manage | Bank accounts, vouchers and cash closing | ADMIN, FINANCE |
| `finance.cash.approve` | Cash, bank & VAT | approve | Approve vouchers and cash-closing variances | ADMIN, FINANCE |
| `finance.vat.view` | Cash, bank & VAT | view | VAT configuration, summary and TRN validation | ADMIN, FINANCE |
| `finance.dashboard.view` | Cash, bank & VAT | view | Finance dashboard | ADMIN, FINANCE |
| `hr.employees.view` | HR & employees | view | Employee master | ADMIN |
| `hr.employees.manage` | HR & employees | manage | Create and edit employees | ADMIN |
| `hr.recruitment.view` | HR & employees | view | Recruitment (requisitions, candidates, interviews) | ADMIN |
| `hr.recruitment.manage` | HR & employees | manage | Manage recruitment pipeline and offers | ADMIN |
| `hr.recruitment.approve` | HR & employees | approve | Approve job requisitions, offers and hiring | ADMIN |
| `hr.attendance.view` | HR & employees | view | Attendance register | ADMIN |
| `hr.attendance.manage` | HR & employees | manage | Record and correct attendance, approve corrections | ADMIN |
| `hr.leave.view` | HR & employees | view | Leave applications and calendar | ADMIN |
| `hr.leave.approve` | HR & employees | approve | Approve / reject leave | ADMIN |
| `hr.payroll.view` | Payroll (prototype) | view | Payroll runs and payslips (prototype) | ADMIN |
| `hr.payroll.manage` | Payroll (prototype) | manage | Salary structures and payroll calculation preview | ADMIN |
| `hr.payroll.approve` | Payroll (prototype) | approve | Approve payroll runs | ADMIN |
| `hr.dashboard.view` | HR & employees | view | HR dashboard | ADMIN |
| `ess.access` | Employee self-service | view | Employee self-service (my attendance, leave, payslips, requests) | ADMIN, SALES_MANAGER, SALESMAN, CUSTOMER_SERVICE, DISPATCHER, FINANCE, WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE, QA_MANAGER |
| `supplierportal.access` | Supplier & customer portals | view | Supplier portal — own POs, RFQs, shipments, invoices, payments | SUPPLIER |
| `customerportal.finance` | Supplier & customer portals | view | Customer portal — statement, payments and complaints | CUSTOMER |
| `reports.export` | Management dashboards | export | Export reports (CSV / print) | ADMIN, SALES_MANAGER, FINANCE, WAREHOUSE_MANAGER, DISPATCHER |

## Demo users added (published demo credentials — prototype only)

| Username | Email | Password | Role | Employee ID | Department | Landing |
|---|---|---|---|---|---|---|
| ceo | ceo@bellomassi.demo | `Ceo@123` | CEO | EMP-0101 | dep-management | `/management/dashboard` |
| operations | operations@bellomassi.demo | `Ops@123` | OPERATIONS_DIRECTOR | EMP-0102 | dep-operations | `/operations/control-tower` |
| horeca | horeca@bellomassi.demo | `Horeca@123` | HORECA_SALES_EXEC | EMP-0103 | dep-horeca | `/horeca` |
| vansales | vansales@bellomassi.demo | `Van@123` | VAN_SALES_EXEC | EMP-0104 | dep-vansales | `/van-sales/app` |
| procurement | procurement@bellomassi.demo | `Procure@123` | PROCUREMENT_MANAGER | EMP-0105 | dep-procurement | `/procurement/dashboard` |
| buyer | buyer@bellomassi.demo | `Buyer@123` | PROCUREMENT_EXEC | EMP-0106 | dep-procurement | `/procurement/dashboard` |
| import | import@bellomassi.demo | `Import@123` | IMPORT_EXEC | EMP-0107 | dep-import | `/import/dashboard` |
| whexec | whexec@bellomassi.demo | `Whexec@123` | WAREHOUSE_EXEC | EMP-0108 | dep-warehouse | `/warehouse/operations` |
| qainspector | qainspector@bellomassi.demo | `Inspect@123` | QA_INSPECTOR | EMP-0109 | dep-qa | `/qa/inspections` |
| fleet | fleet@bellomassi.demo | `Fleet@123` | FLEET_MANAGER | EMP-0110 | dep-fleet | `/fleet/dashboard` |
| financemanager | financemanager@bellomassi.demo | `FinMgr@123` | FINANCE_MANAGER | EMP-0111 | dep-finance | `/finance/dashboard` |
| accountant | accountant@bellomassi.demo | `Account@123` | ACCOUNTANT | EMP-0112 | dep-finance | `/finance/dashboard` |
| hr | hr@bellomassi.demo | `Hr@123` | HR_MANAGER | EMP-0113 | dep-hr | `/hr/dashboard` |
| hrexec | hrexec@bellomassi.demo | `HrExec@123` | HR_EXEC | EMP-0114 | dep-hr | `/hr/dashboard` |
