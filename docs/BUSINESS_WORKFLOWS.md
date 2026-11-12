# Business Workflows — Enterprise Departments (data v9)

How the enterprise workflows run in the prototype, which role does each step, and what each step changes. Every step is a workflow action on a record (permission-checked in the service layer, recorded in the record history and the audit log). "No self-approval" means the user who created the record cannot approve it (Super Admin / `settings.manage` excepted for demos).

## 1. Procure-to-pay

| # | Step | Who (demo user) | Where | Effect |
|---|---|---|---|---|
| 1 | Raise purchase requisition | Warehouse / inventory / buyer | Procurement › Purchase Requisitions › New | PR `DRAFT` → *Submit* → `SUBMITTED` |
| 2 | Approve requisition (no self-approval) | Procurement Manager (`procurement`) | PR detail › Approve | `APPROVED` (Reject needs a reason) |
| 3a | Create RFQ and invite suppliers | Buyer (`buyer`) | PR › Create RFQ | RFQ `DRAFT`, PR `RFQ_ISSUED` |
| 3b | …or create the PO directly | Buyer | PR › Create PO directly | PO `DRAFT` from the PR lines |
| 4 | Issue RFQ | Buyer | RFQ › Issue to suppliers | Invited suppliers see it in the Supplier Portal (in-app only) |
| 5 | Submit quotes | Supplier (`supplier`) or buyer | Supplier Portal › Submit quote | Quote `SUBMITTED` (supplier can only quote for its own company, only if invited) |
| 6 | Compare & award (no self-approval) | Procurement Manager | RFQ › Close for evaluation → Award | Quote comparison table (★ lowest unit price, lowest total, fastest lead time); award creates the PO, winning quote `ACCEPTED`, others `REJECTED` |
| 7 | Approve PO (no self-approval) | Procurement Manager | PO › Approve | `APPROVED` |
| 8 | Send / supplier confirms | Buyer → Supplier | PO › Send to supplier → Confirm order | `SENT` → `CONFIRMED` with supplier ref. and confirmed date |
| 9 | Shipment (imports) | Import Executive (`import`) | Import & Export › Shipments | Milestones BOOKED → IN_TRANSIT → ARRIVED → CUSTOMS (documents checklist required) → CLEARED (declaration no. required) → DELIVERED → CLOSED (landed cost frozen) |
| 10 | Goods receipt (GRN) | Warehouse (`warehouse`, `whexec`) | PO › Receive goods (GRN) | Lines pre-filled with open quantity; batch + expiry required for frozen / chilled; expired goods refused; over-receipt needs *Approve over-receipt* |
| 11 | Post GRN | Warehouse | GRN › Post receipt | Accepted qty (received − rejected) → `createStockReceipt` (one ledger); lots created with batch/expiry; QA-required lots on **QA hold** (not available); PO → `PARTIALLY_RECEIVED` / `RECEIVED`; put-away tasks + QA inspection opened |
| 12 | Put-away | Warehouse executive | Warehouse › Put-away › Confirm | Lots assigned to a bin of the right storage type at the same hub |
| 13 | QA inspection | QA Manager (`qa`) / Inspector (`qainspector`) | QA › Inspections | Start → checklist → **Release** (all checks must pass, reason required → lots AVAILABLE) / Hold / **Reject** (lots REJECTED + NCR opened) |
| 14 | Supplier invoice | Accountant (`accountant`) or supplier | Finance › Supplier Invoices | Duplicate supplier invoice no. refused; TRN format check |
| 15 | 3-way match | Accountant | Invoice › Run 3-way match | PO price × received qty vs invoice (tolerance 1 %) → `MATCHED` / `VARIANCE` |
| 16 | Approve for payment (no self-approval) | Finance Manager (`financemanager`) | Invoice › Approve | Variance requires a reason |
| 17 | Supplier payment | Accountant → Finance Manager | Supplier Payments | Amount ≤ open balance; Approve (no self) → *Mark paid* (recorded only) → invoice `PARTIALLY_PAID` / `PAID` |

## 2. Order-to-cash extensions

- **Lead → opportunity → customer order**: Leads (Qualify → Convert creates an opportunity) → Opportunities (Proposal → Negotiation → Won/Lost) → *Create order* link opens Order Management for the customer.
- **Pricing**: Price list `DRAFT` → Submit → Approve (Sales Manager, no self-approval) → `ACTIVE`; discounts beyond the product's authorised limit are refused.
- **Credit control**: Finance › Receivables › *Place credit hold* (reason required). Order submission with *Credit* terms and van credit sales are refused while on hold. Posted receipts and approved credit notes reduce the customer's outstanding used by the order credit check.
- **Order change / cancellation**: Sales or CS raises a request → Sales Manager *Approve & apply* (no self-approval). Only orders not yet dispatched can change; cancellation sets order status `CANCELLED` (excluded from sales reports) with an order-timeline entry.
- **Sales return**: Requested → Approved (no self) → *Receive at hub* (resaleable qty back to stock as *Sales Return* movement into the lots the order consumed; damaged / expired not added) → *Issue credit note* → credit note `DRAFT` → Approve (no self) reduces the invoice balance.
- **Receipts**: Finance › Customer Receipts — allocations ≤ each invoice's open balance and ≤ amount received; *Post* needs the deposit account; *Reverse (bounced)* restores the outstanding.
- **Service tickets**: SLA by priority (Critical 4 h, High 8 h, Normal 24 h, Low 72 h); Start (assign) → Escalate → Resolve (resolution required) → Close / Reopen. Customers raise and follow tickets from the customer app (only their own).

## 3. HORECA and van sales

- **HORECA account** (linked to an existing customer — no duplicate customer): Draft → Submit contract → Approve (no self) → Active / Suspended. Standing orders create normal draft orders in Order Management.
- **Van sales**: Van route `PLANNED` (capacity, inactive van and double-booking checks) → *Load van* (Van Stock Load movements, FEFO lots; stock leaves the hub) → executive *Start route* in the Van Sales App → sales limited to what is on the van; credit sales blocked for credit-hold / credit-disabled customers → *Settle* (unsold stock returns as Van Stock Return into the same lots; expected cash from cash sales vs deposited) → settlement approved by the manager (variance needs a note).

## 4. Warehouse execution

Receiving (GRN) → Put-away → Picking (*Generate wave* creates pick tasks for consolidated / ready orders with FEFO/FIFO lot proposals; short lines shown; confirming refuses expired / QA-held lots) → Packing (packages, weight, labels) → Loading (dispatch, vehicle capacity, reefer temperature and seal number required) → existing Dispatch confirmation moves the stock (ledger unchanged). Cycle counts: Count → Submit → Approve (no self) posts a *Stock count correction* adjustment per variance.

## 5. Quality and food safety

QA hold on receipt, inspections (release / hold / reject), temperature logs (manual or simulated; excursions flagged and acknowledged with a note), NCR → Investigation (root cause required) → CAPA (corrective & preventive actions required) → Verification → Close (no self). Recall: select lots → *Activate* quarantines them everywhere and lists affected orders / customers from batch traceability.

## 6. Logistics, fleet and drivers

- Reschedule: driver (delivery › *Request reschedule*), CS or dispatcher raises → dispatcher approves → order's requested delivery date / window updated.
- Route plans: stops, windows, *Optimise (demo)*, publish; capacity, licence, inactive and double-booking checks.
- Maintenance: Requested → Approve cost (no self) → Into workshop (vehicle status *Maintenance*) → Complete (actual cost; > 20 % over estimate needs a note; vehicle *Available*).
- Fuel: odometer must increase; verified by the fleet team (no self). Driver expenses: Submitted → Approved (no self) → Reimbursed (recorded). Driver cash collection → *Collected (pending deposit)* → posted by finance.

## 7. HR

Job requisition → Approve (no self) → Open → candidates (Screening → Interview → Offer → **Hire** creates the employee record on probation) → requisition Filled. Attendance (manual / demo device / ESS check-in-out, late after 08:15). Leave from ESS → Approve (cannot approve own leave; 30-day annual entitlement and overlap checks). Salary structures → Payroll run → Calculate (gross − absence − fixed deductions) → Approve (no self) → *Mark paid (demo)* — no WPS / bank file.

## 8. Operations control

Control tower computes alerts from records (failed / late deliveries, temperature excursions, expired / expiring / QA-held lots, low stock, overdue receivables, SLA breaches, overdue POs, vehicle and employee document expiry). *Raise exceptions from alerts* creates one exception per high / critical alert (never duplicates an open one); exceptions are assigned, escalated, resolved (resolution required) and closed.
