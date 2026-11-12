# Enterprise Modules — Bellomassi ERP & Order-to-Delivery (data v9)

Frontend-only LocalStorage prototype. The enterprise departments extend the existing application (same login, roles, navigation, design system, stock ledger, orders, customers, invoices, Reports Center). Nothing in the prototype connects to a real bank, tax authority, payroll/WPS, sensor, OCR, email or WhatsApp provider.

## Architecture in one paragraph

Every enterprise module is a **definition** (`src/config/enterprise/modules/*.js`) registered with one **record engine** (`src/services/enterprise/recordService.js`). The engine provides list / create / edit / detail, workflow actions (`from` statuses → `to`, required permission, required note, *no self-approval*), document numbering `PREFIX-YYYY-NNNNN`, history on every record, audit-log entries and the data-scope filter (own / customer / supplier / driver / hub). One generic page (`src/pages/enterprise/EnterpriseModulePage.jsx`) renders every module from its definition, so there are no placeholder pages. Effects that touch other ledgers call the owning service: `inventoryService` (one stock ledger), `batchService` (lots / expiry / QA hold on top of that ledger), `procurementService`, `financeService`, `salesOpsService`, `vanSalesService`, `analyticsService`.

## Module catalogue (51 record modules)

| Group | Module | Route | Storage key | Number | Statuses | Workflow actions | View / create permission | Data scope |
|---|---|---|---|---|---|---|---|---|
| Sales & CRM | Leads | `/sales/leads` | `bellomassi_leads` | LEAD-YYYY-NNNNN | New → Contacted → Qualified → Converted → Lost | Mark contacted, Qualify, Convert to opportunity, Mark lost | sales.leads.view / sales.leads.create | own: ownerId |
| Sales & CRM | Opportunities | `/sales/opportunities` | `bellomassi_opportunities` | OPP-YYYY-NNNNN | Prospecting → Proposal sent → Negotiation → Won → Lost | Proposal sent, Negotiation, Mark won, Mark lost | sales.opportunities.view / sales.opportunities.manage | own: ownerId |
| Sales & CRM | Sales activities | `/sales/activities` | `bellomassi_sales_visits` | ACT-YYYY-NNNNN | Planned → Completed → Cancelled | Complete, Cancel | sales.activities.view / sales.activities.manage | own: ownerId |
| Sales & CRM | Sales targets | `/sales/targets` | `bellomassi_sales_targets` | TGT-YYYY-NNNNN | Active → Closed | Close period | sales.targets.view / sales.commission.manage | own: ownerId |
| Sales & CRM | Commission rules | `/sales/commission` | `bellomassi_commission_rules` | COM-YYYY-NNNNN | Active → Inactive | Deactivate, Activate | sales.targets.view / sales.commission.manage | role scope |
| Sales & CRM | Price lists | `/sales/pricing` | `bellomassi_price_lists` | PL-YYYY-NNNNN | Draft → Pending approval → Active → Rejected → Inactive | Submit for approval, Approve (no self-approval), Reject, Deactivate | sales.pricing.view / sales.pricing.manage | role scope |
| Sales & CRM | Sales returns | `/sales/returns` | `bellomassi_sales_returns` | SRN-YYYY-NNNNN | Requested → Approved → Received → Credited → Rejected | Approve return (no self-approval), Reject, Receive at hub, Issue credit note | sales.returns.view / sales.returns.manage | own: ownerId; customer: customerId |
| Sales & CRM | Order change requests | `/sales/order-changes` | `bellomassi_order_change_requests` | OCR-YYYY-NNNNN | Pending → Approved & applied → Rejected | Approve & apply (no self-approval), Reject | sales.orderchanges.request / sales.orderchanges.request | own: ownerId |
| Customer Service | Service tickets | `/service/tickets` | `bellomassi_service_tickets` | TKT-YYYY-NNNNN | Open → In progress → Escalated → Resolved → Closed | Start work, Escalate, Resolve, Close, Reopen | service.tickets.view / customer.app / service.tickets.manage / customer.app | customer: customerId |
| HORECA & Van Sales | HORECA accounts | `/horeca` | `bellomassi_horeca_accounts` | HRC-YYYY-NNNNN | Draft → Contract pending approval → Active contract → Suspended → Expired | Submit contract, Approve contract (no self-approval), Return to draft, Suspend, Reactivate | horeca.view / horeca.manage | own: accountManagerId |
| HORECA & Van Sales | Standing orders | `/horeca/templates` | `bellomassi_order_templates` | TPL-YYYY-NNNNN | Active → Paused | Create order, Pause, Resume | horeca.view / horeca.manage | role scope |
| HORECA & Van Sales | Van routes | `/van-sales/routes` | `bellomassi_van_assignments` | VAN-YYYY-NNNNN | Planned → Loaded → On route → Settled → Cancelled | Load van, Start route, Settle, Cancel | vansales.view / vansales.manage | own: salesExecId |
| HORECA & Van Sales | Van sales | `/van-sales/sales` | `bellomassi_van_sales` | VS-YYYY-NNNNN | Completed → Voided | Void sale | vansales.view / vansales.app / vansales.manage | own: salesExecId |
| HORECA & Van Sales | Van settlements | `/van-sales/settlements` | `bellomassi_van_settlements` | VST-YYYY-NNNNN | Submitted → Approved → Disputed | Approve (no self-approval), Dispute | vansales.view / vansales.settle.approve | own: salesExecId |
| Procurement | Purchase requisitions | `/procurement/requisitions` | `bellomassi_purchase_requisitions` | PR-YYYY-NNNNN | Draft → Pending approval → Approved → Rejected → RFQ issued → PO created → Cancelled | Submit, Approve (no self-approval), Reject, Create RFQ, Create PO directly, Cancel | procurement.requisitions.view / procurement.requisitions.create | own: requestedBy |
| Procurement | Requests for quotation | `/procurement/rfqs` | `bellomassi_rfqs` | RFQ-YYYY-NNNNN | Draft → Issued to suppliers → Under evaluation → Awarded → Cancelled | Issue to suppliers, Close for evaluation, Award (no self-approval), Cancel | procurement.rfq.view / procurement.rfq.manage | role scope |
| Procurement | Supplier quotes | `/procurement/quotes` | `bellomassi_supplier_quotes` | SQ-YYYY-NNNNN | Submitted → Shortlisted → Accepted → Not selected | Shortlist, Not selected | procurement.rfq.view / supplierportal.access / procurement.rfq.manage / supplierportal.access | supplier: supplierId |
| Procurement | Purchase orders | `/procurement/purchase-orders` | `bellomassi_purchase_orders` | PO-YYYY-NNNNN | Draft → Pending approval → Approved → Sent to supplier → Supplier confirmed → Partially received → Received → Closed → Rejected → Cancelled | Submit for approval, Approve (no self-approval), Reject, Send to supplier, Confirm order, Close, Cancel | procurement.po.view / supplierportal.access / procurement.po.create | supplier: supplierId |
| Warehouse Operations | Goods receipts (GRN) | `/warehouse/receiving` | `bellomassi_goods_receipts` | RCV-YYYY-NNNNN | Draft → Posted → Cancelled | Post receipt, Cancel draft | warehouse.receiving.view / warehouse.receiving.manage | supplier: supplierId |
| Finance | Supplier invoices | `/finance/payables/invoices` | `bellomassi_supplier_invoices` | SINV-YYYY-NNNNN | Received → Matched → Price / qty variance → Approved for payment → Partially paid → Paid → Rejected | Run 3-way match, Approve for payment (no self-approval), Reject | finance.ap.view / supplierportal.access / finance.ap.manage / supplierportal.access | supplier: supplierId |
| Finance | Supplier payments | `/finance/payables/payments` | `bellomassi_supplier_payments` | SPAY-YYYY-NNNNN | Draft → Approved → Paid (recorded) → Cancelled | Approve (no self-approval), Mark paid, Cancel | finance.ap.view / supplierportal.access / finance.ap.manage | supplier: supplierId |
| Import & Export | Import & export shipments | `/import/shipments` | `bellomassi_import_shipments` | SHP-YYYY-NNNNN | Booked → In transit → Arrived at port → Customs clearance → Cleared → Delivered to warehouse → Closed → Cancelled | Departed, Arrived, Start customs clearance, Cleared, Delivered to warehouse, Close (costs final), Cancel | import.shipments.view / import.shipments.manage | supplier: supplierId |
| Warehouse Operations | Warehouse locations | `/warehouse/locations` | `bellomassi_warehouse_locations` | — | Active → Blocked | Block, Unblock | warehouse.locations.view / warehouse.locations.manage | role scope |
| Warehouse Operations | Put-away tasks | `/warehouse/putaway` | `bellomassi_putaway_tasks` | PUT-YYYY-NNNNN | Open → In progress → Done → Cancelled | Start, Confirm put-away, Cancel | warehouse.tasks.view / warehouse.putaway.manage | own: assignedTo; hub: hubId |
| Warehouse Operations | Picking | `/warehouse/picking` | `bellomassi_picking_tasks` | PICK-YYYY-NNNNN | Open → Picking → Picked → Cancelled | Start picking, Confirm picked, Cancel | warehouse.tasks.view / warehouse.picking.manage | own: assignedTo; hub: hubId |
| Warehouse Operations | Packing | `/warehouse/packing` | `bellomassi_packing_tasks` | PACK-YYYY-NNNNN | Open → Packed → Cancelled | Mark packed | warehouse.tasks.view / warehouse.packing.manage | hub: hubId |
| Warehouse Operations | Loading | `/warehouse/loading` | `bellomassi_loading_tasks` | LOAD-YYYY-NNNNN | Planned → Loading → Loaded & sealed → Cancelled | Start loading, Loaded & sealed, Cancel | warehouse.tasks.view / warehouse.loading.manage | hub: hubId |
| Inventory Control | Cycle counts | `/inventory/counts` | `bellomassi_cycle_counts` | CC-YYYY-NNNNN | Counting → Submitted → Approved & posted → Recount required | Submit count, Approve & post (no self-approval), Request recount | inventory.counts.view / inventory.counts.manage | hub: hubId |
| Inventory Control | Product recalls | `/inventory/recalls` | `bellomassi_product_recalls` | RCL-YYYY-NNNNN | Draft → Active recall → Closed | Activate recall, Close recall | inventory.recall.view / inventory.recall.manage | role scope |
| Quality Assurance | QA inspections | `/qa/inspections` | `bellomassi_qa_inspections` | QAI-YYYY-NNNNN | Pending → In progress → Released → On hold / quarantine → Rejected | Start inspection, Release, Hold / quarantine, Reject | qa.inspection.view / qa.inspection.manage | own: inspectorId |
| Quality Assurance | Temperature logs | `/qa/temperature` | `bellomassi_temperature_logs` | TMP-YYYY-NNNNN | In range → Excursion → Excursion acknowledged | Acknowledge excursion | qa.inspection.view / qa.temperature.manage / warehouse.receiving.manage / driver.app | role scope |
| Quality Assurance | Non-conformance & CAPA | `/qa/ncr` | `bellomassi_nonconformances` | NCR-YYYY-NNNNN | Open → Investigation → CAPA in progress → Verification → Closed | Start investigation, Start CAPA, Send to verification, Verify & close (no self-approval), Back to CAPA | qa.inspection.view / qa.ncr.manage | role scope |
| Logistics | Delivery reschedules | `/logistics/reschedules` | `bellomassi_delivery_reschedules` | RSC-YYYY-NNNNN | Requested → Approved → Rejected | Approve, Reject | logistics.planning.view / driver.app / logistics.planning.manage / driver.app / service.tickets.manage | driver: driverId; hub: hubId |
| Logistics | Route plans | `/logistics/routes` | `bellomassi_route_plans` | RTE-YYYY-NNNNN | Draft → Optimised (demo) → Published → Cancelled | Optimise (demo), Publish, Cancel | logistics.planning.view / logistics.planning.manage | hub: hubId; driver: driverId |
| Management | Operational exceptions | `/operations/exceptions` | `bellomassi_operational_exceptions` | EXC-YYYY-NNNNN | Open → Assigned → Escalated → Resolved → Closed | Assign, Escalate, Resolve, Close | operations.exceptions.view / operations.exceptions.manage | own: assignedTo |
| Fleet Operations | Vehicle maintenance | `/fleet/maintenance` | `bellomassi_vehicle_maintenance` | MNT-YYYY-NNNNN | Requested → Approved → In workshop → Completed → Cancelled | Approve cost (no self-approval), Into workshop, Complete, Cancel | fleet.maintenance.view / fleet.maintenance.manage | role scope |
| Fleet Operations | Fuel logs | `/fleet/fuel` | `bellomassi_fuel_logs` | FUEL-YYYY-NNNNN | Submitted → Verified → Rejected | Verify (no self-approval), Reject | fleet.fuel.view / driver.app / fleet.fuel.manage / driver.app | driver: driverId |
| Fleet Operations | Driver expenses | `/drivers/expenses` | `bellomassi_driver_expenses` | DEX-YYYY-NNNNN | Submitted → Approved → Rejected → Reimbursed | Approve (no self-approval), Reject, Mark reimbursed | drivers.expenses.view / driver.app / drivers.expenses.manage / driver.app | driver: driverId |
| Finance | Customer receipts | `/finance/payments` | `bellomassi_customer_payments` | RCPT-YYYY-NNNNN | Draft → Collected — pending deposit → Posted → Reversed | Mark collected (pending deposit), Post receipt, Reverse (bounced) | finance.ar.view / driver.app / customerportal.finance / finance.ar.manage / driver.app / finance.cash.manage | customer: customerId; driver: collectedByDriverId |
| Finance | Credit notes | `/finance/credit-notes` | `bellomassi_credit_notes` | CN-YYYY-NNNNN | Draft → Approved → Cancelled | Approve (no self-approval), Cancel | finance.ar.view / customerportal.finance / finance.ar.manage / sales.returns.approve | customer: customerId |
| Finance | Expenses | `/finance/expenses` | `bellomassi_expenses` | EXP-YYYY-NNNNN | Submitted → Approved → Paid (recorded) → Rejected | Approve (no self-approval), Reject, Record payment | finance.expenses.view / finance.expenses.manage | role scope |
| Finance | Bank & cash accounts | `/finance/cash` | `bellomassi_bank_accounts` | — | Active → Inactive | Deactivate, Activate | finance.cash.view / finance.cash.manage | role scope |
| Finance | Vouchers | `/finance/vouchers` | `bellomassi_vouchers` | VCH-YYYY-NNNNN | Draft → Approved → Posted → Cancelled | Approve (no self-approval), Post, Cancel | finance.cash.view / finance.cash.manage | role scope |
| Finance | Daily cash closing | `/finance/cash-closing` | `bellomassi_cash_closings` | CCL-YYYY-NNNNN | Submitted → Approved → Disputed | Approve (no self-approval), Dispute | finance.cash.view / finance.cash.manage | role scope |
| Human Resources | Employees | `/hr/employees` | `bellomassi_employees` | — | Active → On leave → Probation → Resigned → Terminated | Mark on leave, Back from leave, Confirm probation, Resigned, Terminate | hr.employees.view / ess.access / hr.employees.manage | own: userId |
| Human Resources | Job requisitions | `/hr/recruitment` | `bellomassi_job_requisitions` | JR-YYYY-NNNNN | Draft → Pending approval → Open → Filled → Cancelled → Rejected | Submit, Approve (no self-approval), Reject, Cancel | hr.recruitment.view / hr.recruitment.manage | role scope |
| Human Resources | Candidates | `/hr/candidates` | `bellomassi_candidates` | — | Applied → Screening → Interview → Offered → Hired → Rejected | Screening, Interview, Make offer, Hire, Reject | hr.recruitment.view / hr.recruitment.manage | role scope |
| Human Resources | Attendance | `/hr/attendance` | `bellomassi_employee_attendance` | — | Present → Late → Absent → Half day → Regularised | Regularise | hr.attendance.view / ess.access / hr.attendance.manage / ess.access | own: userId |
| Human Resources | Leave requests | `/hr/leave` | `bellomassi_leave_requests` | LV-YYYY-NNNNN | Pending → Approved → Rejected → Cancelled | Approve (no self-approval), Reject, Cancel request | hr.leave.view / ess.access / hr.leave.view / ess.access | own: userId |
| Human Resources | Salary structures | `/hr/salary` | `bellomassi_salary_structures` | — | Active → Superseded | Supersede | hr.payroll.view / hr.payroll.manage | role scope |
| Human Resources | Payroll (demo) | `/hr/payroll` | `bellomassi_payroll` | PAY-YYYY-NNNNN | Draft → Calculated → Approved → Marked paid (demo) → Cancelled | Calculate, Approve (no self-approval), Mark paid (demo), Cancel | hr.payroll.view / hr.payroll.manage | role scope |

## Purpose-built pages

| Page | Route | Permission | What it does |
|---|---|---|---|
| Executive Dashboard | `/management/dashboard` | management.dashboard.view | Company-wide KPIs calculated from live records: sales, receivables, stock, deliveries, procurement, fleet, QA and people. |
| Operations Control Tower | `/operations/control-tower` | operations.controltower.view | Live operational picture with clickable KPIs, alert centre, SLA status and exception management. |
| Expenses & Cash | `/driver/expenses` | driver.app | Your expense claims, fuel fills, cash collections and reschedule requests. |
| Statement | `/customer/statement` | customer.app | Your statement of account, receipts and credit notes. |
| Support | `/customer/support` | customer.app | Raise and follow complaints and requests. |
| Sales Dashboard | `/sales/dashboard` | sales.targets.view / sales.opportunities.view | Sales value, targets vs achievement, pipeline, returns and service tickets. |
| Van Sales Dashboard | `/van-sales` | vansales.view | Routes, van stock, sales and cash settlement. |
| Van Sales App | `/van-sales/app` | vansales.app | Mobile van-sales screen: today’s route, van stock and quick sale. |
| Procurement Dashboard | `/procurement/dashboard` | procurement.po.view / procurement.requisitions.view | Requisitions, RFQs, open POs, receiving and supplier performance. |
| Supplier Performance | `/procurement/suppliers-performance` | suppliers.performance.view | On-time delivery, quality acceptance, NCRs and spend per supplier. |
| Import Dashboard | `/import/dashboard` | import.shipments.view | Shipments in transit, arrivals, customs and landed cost. |
| Warehouse Operations | `/warehouse/operations` | warehouse.tasks.view | Receiving, put-away, picking, packing and loading queues with productivity. |
| Batches & Expiry | `/inventory/batches` | inventory.batch.view | Lot-level stock by hub and bin with expiry, FEFO order, QA status and traceability. |
| Logistics Dashboard | `/logistics/dashboard` | logistics.planning.view | On-time delivery, failed deliveries, reschedules and route plans. |
| Fleet Dashboard | `/fleet/dashboard` | fleet.analytics.view / fleet.maintenance.view | Availability, maintenance, fuel efficiency and cost per vehicle. |
| Finance Dashboard | `/finance/dashboard` | finance.dashboard.view | Receivables, payables, cash, collections and expenses — all calculated from records. |
| Receivables & Aging | `/finance/receivables` | finance.ar.view | AR aging, customer statements and credit hold. |
| Payables & Aging | `/finance/payables` | finance.ap.view | AP aging and supplier balances. |
| VAT Summary | `/finance/vat` | finance.vat.view | Output and input tax from records, with TRN checks (not filed with the FTA). |
| HR Dashboard | `/hr/dashboard` | hr.dashboard.view | Headcount, attendance, leave, recruitment and document expiry. |
| My HR (Self-Service) | `/ess` | ess.access | Your employee profile, attendance, leave balance and requests, and payslips. |
| Supplier Portal | `/supplier` | supplierportal.access | Your purchase orders, RFQs to quote, deliveries and invoices (your company only). |
| Supplier Finance | `/supplier/finance` | supplierportal.access | Your invoices, payments and balance. |

## Integration with existing modules

- **Customers** — HORECA accounts, templates, tickets, receipts and credit notes reference the existing customer master (no second customer record). Finance credit hold sets `customer.creditHold`; order submission with Credit terms and van credit sales are refused while it is on.
- **Orders** — order-change approval writes to the existing order (timeline event `CHANGE_APPLIED` / `CANCELLED`; new status `CANCELLED`, excluded from sales reports). Standing orders create normal draft orders through `orderService.createOrder`.
- **Stock** — one ledger. Goods receipts use `createStockReceipt`; van load / return and sales returns use `postStockMovement` (types *Van Stock Load*, *Van Stock Return*, *Sales Return*); cycle counts post `createStockAdjustment`. `batchService` replays every movement into lots (FEFO consumption, return to the consumed lots, transfers carry lots) and writes blocked quantities (QA hold, quarantine, rejected, expired) to `inventory.qaHoldQuantity`, which `getAvailable()` subtracts — so blocked stock cannot be ordered, picked or dispatched anywhere.
- **Invoices** — AR balances are invoice total − posted receipts − approved credit notes; posting a receipt reduces `customer.creditBalance` used by the order credit check.
- **Vehicles / drivers** — maintenance sets vehicle status (*Maintenance* / *Available*); route plans and van routes validate capacity, inactive vehicles, inactive drivers, licence expiry and double booking. Drivers record expenses, fuel, cash collections and reschedule requests from the driver app (Profile → Expenses & cash; delivery → Request reschedule).
- **Users / roles** — HR employees link to user accounts; roles carry a department; ESS uses the logged-in user's employee record.
- **Reports Center** — 48 enterprise reports in 14 new categories use the existing viewer, export and favourites.

## Simulated / demo features (labelled in the UI)

- Route optimisation (zone + pincode heuristic, 35-minute ETA spacing) — *Optimise (demo)*.
- Temperature readings — source *Manual entry* or *Simulated (demo)*; no live sensors.
- Payroll — *Payroll (Demo)*, *Mark paid (demo)*; no WPS file, bank transfer or labour-law integration.
- Payments, bank balances, VAT — recorded/calculated in the prototype only; VAT summary is not filed with the FTA; TRN check is a format check.
- Supplier/customer notifications — in-app notifications only; no real email/WhatsApp is sent.
