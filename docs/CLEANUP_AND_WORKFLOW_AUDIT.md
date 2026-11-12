# Workflow Restructuring, Code Cleanup & Functionality Audit (data v10)

The existing Bellomassi application was audited and corrected in place. Nothing was rebuilt; the application is still
React 19 · Vite 8 · Tailwind 4 · React Router 7 with LocalStorage as the only store (no backend, no database). All
demo accounts, existing data, RBAC, the driver and customer apps, the enterprise modules, the Mobile App Preview and
Project Documents are kept.

## 1. Audit — what was found

| # | Finding | Kind |
|---|---|---|
| 1 | Approving an order did **not reserve stock**. "Reserved" quantities existed only from seed data, and 26+ units per line were reserved for no order at all (phantom reservations). | Broken business rule |
| 2 | No direct order cancellation. Cancelling through a change request did not release stock, notify anyone, or reset approval/consolidation. That code also checked dispatch statuses that do not exist (`DISPATCHED`, `IN_PROGRESS`) and missed `IN_TRANSIT`. | Broken workflow |
| 3 | Issuing an invoice did **not** add to the customer's outstanding balance, while receipts reduced it. The balance could also be typed over on the customer form. | Data inconsistency |
| 4 | Customer app **Payments** said "payments are not captured in this prototype", even though receipts exist. Invoices showed no paid / open status anywhere. | Disconnected module |
| 5 | Finance dashboard: a "Collections — Not tracked" card and three "Later phase" panels for features that exist. The "Delivered, to invoice" KPI included already-invoiced orders, and "Outstanding" repeated "Credit exposure". | Misleading KPIs |
| 6 | Customer detail: a "Credit history — later phase" placeholder. | Placeholder UI |
| 7 | Reports Center listed 24 "unavailable" placeholder reports (payments, credit notes, supplier AP, expenses, fuel, maintenance, batches, cycle counts…) that are now captured. "Customer Ageing" said "payments are not captured". | Stale / misleading |
| 8 | Five separate report screens (Orders, Delivery, VMS, Documents, Invoices) duplicated the Reports Center with their own report definitions and a separate report component. | Duplicate code |
| 9 | Two Vehicles lists of the same records (Dispatch › Vehicles and VMS › Vehicles). Global search and the Vehicle Register report linked to `/dispatch/vehicles/<id>`, which does not exist ("Not found"). | Duplicate page + broken link |
| 10 | Two purchasing flows: AI replenishment drafts had their own approval and then expected manual stock receipts, in parallel to Procurement (PR → RFQ → PO → GRN). The "Procurement" report category was built from those drafts, not from purchase orders. | Parallel system |
| 11 | Sidebar: about 180 entries for Super Admin in 34 groups. Separate "Inventory" and "Inventory Control"; "Fleet Operations" apart from "Vehicle Management"; "Logistics" apart from "Dispatch"; "Invoices" apart from "Finance". Duplicate entries: Hub Master (redirect), Employee Master, Verified / Rejected documents (also tabs), Rejected Orders (an Order List filter), "New Invoice" (a button on the list). Driver-app and customer-app pages were listed in the office sidebar. | Confusing navigation |
| 12 | Scrap and Stock Adjustment pages calculated "available" themselves and ignored stock on QA hold. | Inconsistent rule |
| 13 | "Customer → delivery address" logic copied into the order form, customer cart and standing orders. | Duplicate logic |
| 14 | 2 unused services (`driverDocumentService`, `vehicleDocumentService`), an unreachable `ComingSoon` placeholder page, 52 exported functions and constants referenced nowhere (e.g. `deleteRecord`, `getRecord`, `hasRole`, `canAny`, `deepClone`, a duplicate `isToday`, a duplicate `DemoNote`). | Dead code |
| 15 | Cancelled orders were drawn as "Draft" in the order stepper. | UI bug |

No unused imports or variables were found before the change (oxlint `no-unused-vars`). No unused npm dependency was
found: `tailwindcss` is flagged by knip but is needed by `@tailwindcss/vite`.

## 2. Corrected workflows

**Order → inventory (reservation).** `src/utils/stockReservation.js` is the single reservation module, used by every service:
- **Approval** checks availability and reserves per line, never beyond available stock. The order shows *Reserved*, *Partly reserved* or *Awaiting stock*, and a timeline entry is written in the same transaction.
- **Consolidation** tops up anything that was short.
- **Dispatch confirmation** deducts on-hand stock once and releases the reservation with the same movement.
- **Dispatch cancellation** re-reserves the stock.
- **Order cancellation** releases the reservation.
- **Failed delivery re-queued** re-reserves the returned goods.
- Invariant (checked automatically): reserved stock for each product × hub = the open reservation lines of its orders. Inventory never goes negative.

**Order cancellation.** One path, `cancelOrder` in `orderService`:
- **Who:** Sales Manager / Admin (`sales.orderchanges.approve`). An approved order change request uses the same path.
- **Rules:**
  - Reason required.
  - Allowed from Submitted through Ready for dispatch.
  - Refused while the order is on a live dispatch.
- **Effects:**
  - Releases the reservation.
  - Notifies the salesman, Customer Service and the Dispatcher.
  - Writes a timeline entry.
- **UI:**
  - The order page has a **Cancel order** dialog (reason + remarks).
  - The salesman instead gets **Request change / cancellation**, which opens the change request with the order filled in.
- **Display:**
  - A cancelled banner on the order page.
  - The stepper stops with "Cancelled" after the last step the order reached.

**Invoice → payment → outstanding.** One receivable position for Finance, the customer page and the customer app:
- Issuing an invoice adds its total to the customer's outstanding balance.
- Posted receipts and approved credit notes reduce it.
- Cancelling an unpaid invoice reverses it; an invoice with receipts or credit notes cannot be cancelled.
- The customer form keeps the balance read-only after creation; it is an opening balance only when the customer is created.

Duplicate prevention:
- Receipts can never be allocated beyond an invoice's open balance.
- A second receipt with the same customer and reference is refused.
- Only one active invoice per order.

The balances are shown in:
- **Invoice list** — Payment column.
- **Invoice detail** — Payment card: received / credited, open, due, receipts, and a **Record receipt** button.
- **Customer detail** — live Account card.
- **Customer app** — Payments lists the customer's own receipts; Invoices shows Paid / Open / Overdue.
- **Finance dashboard** — real collections, open receivables and overdue amounts.

**AI replenishment → procurement.** An approved replenishment draft's **Send to procurement** creates a purchase requisition with the same lines, submitted for approval and linked both ways. Buying and receiving then follow the one procurement flow (PR → RFQ / PO → GRN → QA). Progress on the draft is read from that requisition's purchase orders. Drafts converted before this release keep their stock-receipt matching.

**Order fulfilment in one place.** The order's **Fulfilment** tab shows, each linked to its record:
- stock reservation per line
- consolidation
- pick, pack and loading tasks
- dispatch and delivery
- invoice

**Stock detail** lists the approved orders holding reserved stock.

## 3. Navigation (one menu per business area)

The sidebar is defined in one place (`SIDEBAR` + `PATCH` in `src/config/navigation.js`). There are 26 groups instead of 34, in order-to-delivery order:

Dashboard · Management · **Orders** (incl. order change requests and sales returns) · Sales & CRM · **Customers** (incl. HORECA accounts, standing orders, service tickets) · Van Sales · **Master Data** (products, suppliers, hubs) · **Procurement** (incl. import shipments) · **Inventory** (incl. batches, cycle counts, recalls, scrap) · **Warehouse** · Quality Assurance (incl. QA dashboard) · **Dispatch & Delivery** (incl. route plans, reschedules, delivery performance) · **Fleet & Vehicles** (VMS + maintenance, fuel, driver expenses) · Documents · **Finance** (incl. invoices) · Human Resources · Communication · Self-Service & Portals · AI & Intelligence · Reports · Administration · Organization · Project Workspace · My Account.

- Super Admin sidebar: 147 entries instead of 179. Every one of the 434 routes still exists.
- A per-user comparison of all 27 demo accounts confirms that **nobody lost access to any route**. Every hidden entry has a visible replacement for each user.
- Old URLs redirect:
  - `/orders/reports`, `/dispatch/reports`, `/vms/reports`, `/documents/reports`, `/invoices/reports` → Reports Center category.
  - `/dispatch/vehicles` → `/vms/vehicles`.
- Roles that only had a module report page also get `reports.center`, through the role definitions and the v10 migration. This covers 14 enterprise roles and any custom role.
- The one Vehicles register accepts `vms.view` **or** `fleet.view`, and shows capacity, regular driver, current dispatch, status and compliance.
- Driver-app and customer-app pages left the office sidebar. They keep their own tab bars, and office users see them in Mobile App Preview.

## 4. Reports Center (single report catalogue)

- **Added** (moved from the removed module pages):
  - Approval Decisions, Consolidation Register
  - Documents category: Document Register, by Type, by Entity, Document Expiry, OCR & Review
  - Invoices by Customer / Hub / Month
  - Vehicle Document Status, Vehicle & Driver Document Expiry (from the VMS compliance rules)
  - Stock Receipt Register, Replenishment Proposals
- **Improved:** Invoice Register and Receivable Summary now show received / credited, open balance and payment status.
- **Removed:**
  - 24 "unavailable" placeholders, now covered by the department reports.
  - Draft-based "purchase order" reports, which duplicated the real Purchasing reports.
  - Customer Ageing, which duplicated Receivables Aging and wrongly said payments are not captured.
  - A duplicate Driver Performance report.
- 144 reports, no duplicate ids. Every visible report runs without errors for six different roles.
- The viewer accepts `?from=&to=`, used by dashboard, insight and AI-assistant links.

## 5. Deleted files

`src/pages/ComingSoon.jsx` · `src/pages/orders/OrderReports.jsx` · `src/pages/dispatch/DispatchReports.jsx` ·
`src/pages/documents/DocumentReports.jsx` · `src/pages/dispatch/VehicleList.jsx` · `src/components/phase5/ReportWorkspace.jsx` ·
`src/components/dashboard/widgets/PlaceholderPanel.jsx` · `src/services/driverDocumentService.js` · `src/services/vehicleDocumentService.js`.

These functions were also removed: `VmsReports` and `InvoiceReports`, plus 52 exported symbols referenced nowhere (see section 1, row 14).

## 6. New files

- `src/utils/stockReservation.js` — reservation module.
- `src/components/orders/OrderFulfilmentPanel.jsx` — order Fulfilment tab.
- `scripts/workflow-check.mjs` — end-to-end business checks.
- `scripts/migration-check.mjs` — upgrade check against a saved snapshot.
- `scripts/nav-snapshot.mjs` — per-user menu and route access.
- This document.

## 7. Modified files

**Services:**
- `orderService` — cancellation, shared delivery-address helper.
- `approvalService` — reservation on approval.
- `consolidationService` — reservation top-up, stock review.
- `dispatchService` — reservation consume / restore.
- `deliveryService` — re-reservation on requeue.
- `invoiceService` — outstanding posting, cancel rules.
- `customerService` — `postCustomerBalance`, balance protected on edit.
- `enterprise/financeService` — uses `postCustomerBalance`.
- `enterprise/salesOpsService` — cancellation through `cancelOrder`, correct dispatch statuses.
- `ai/replenishmentService` — hand-over to procurement.
- `reportService` — catalogue cleanup, new reports, payment status.
- `storageService` — v10 migration, seed reconciliation.
- `searchService`, `ai/aiToolRegistry`, `ml/insightsEngine` — corrected links.
- `utils/dispatchStock`.

**Config:**
- `navigation.js` — sidebar layout.
- `enterprise/roles.js` — `reports.center` for report-page roles.
- `enterprise/modules/operations.js` — duplicate-receipt rule.
- `enterprise/modules/supply.js` — link from requisition back to replenishment.
- `orderConfig.js` — cancel reasons, timeline events.
- `aiConfig.js`, `utils/constants.js` (data v10).

**Pages and components:**
- `OrderDetail` — cancel, fulfilment.
- `OrderStepper` — cancelled state.
- `StockDetail` — reserved-for-orders list.
- `VmsFleet` — the one vehicle register.
- `VehicleForm`
- `InvoicePages` — payment status.
- `CustomerDocuments` — customer payments and invoice status.
- `CustomerDetail` — account card.
- `CustomerForm` — balance read-only.
- `CustomerCart`, `OrderForm` — shared address helper.
- `FinanceDashboard`, `AdminDashboard`, `WarehouseDashboard`, `DispatchOverview`, `Assignments`
- `ReplenishmentPages`
- `ReportViewer`
- `ScrapPages`, `AdjustmentCreate` — shared availability rule.
- `AppRoutes`

Files that only lost dead exports or unused imports are listed in the change set.

## 8. Retained important features

Everything functional was kept:
- the 13 original roles + 71 enterprise roles and all 27 demo accounts
- the driver app (OTP, POD, DEMO GPS) and the customer app
- every enterprise module
- AI assistant, Jarvis voice console, forecasting, predictive inventory, insights
- communication: email, WhatsApp demo mode, automation, calls
- documents with simulated OCR
- VMS compliance
- Mobile App Preview and Project Documents
- data export / import / reset

## 9. LocalStorage

The data version is now **10**. Migration v9 → v10 is idempotent:
1. It rebuilds reserved stock from the orders that hold it (approved / consolidated / ready, not yet loaded):
   - Each such order gets `order.reservation`.
   - Reserved stock that no order accounts for is released.
   - On-hand stock, movements and lots are not touched.
2. Roles with a module report permission get `reports.center`.

A new installation is seeded in the same consistent state.

## 10. Verification

| Check | Result |
|---|---|
| `npm run build` (production) | passes |
| `npx oxlint` | 0 errors, 26 warnings — same number as before. All are React fast-refresh / compiler hints that were already there. |
| `npm run check:workflow` — the 28-step scenario plus negative cases | **73 / 73 passed**. Steps: sales order → approval with reservation → consolidation → dispatch with vehicle + driver → driver start / arrive / wrong OTP / OTP / POD → delivered → dispatch completed → delivery note → customer isolation → invoice → duplicate invoice refused → receipt → zero balance → outstanding back → duplicate receipt refused → audit and notifications. Negative cases: rejection (with and without reason), cancellation releasing stock, insufficient stock (flagged, never over-reserved, dispatch blocked, no negative stock), partial delivery, over-delivery refused, failed delivery → requeue with re-reservation, unauthorized approve / invoice / dispatch, customer data isolation, invoice-cancel rules, customer form cannot overwrite the balance, replenishment → purchase requisition, every report for 6 roles, reservation invariant for all stock lines. |
| `npm run check:migration` on a real v9 dataset made by the previous release | all checks pass: user edits kept, stock untouched, reservations consistent, report access kept, idempotent |
| Browser (Playwright, production build) | 27 / 27 demo accounts sign in and land without errors · 278 static routes + 146 record detail pages without error screens or "not found" · 15 redirects land correctly · 38 targeted UI checks of the changed screens (sidebar, fulfilment, cancel dialog, stock reservations, vehicles, reports, finance, invoices, replenishment, customer app, 390 px phone width) |

## 11. Remaining limitations (prototype)

- Data lives in one browser (LocalStorage). Permissions and business rules are enforced in the browser service layer, not on a server.
- Email, WhatsApp, OCR and GPS keep their honest demo / simulated modes. No bank, tax authority, payroll or telephony is connected.
- A reservation never exceeds available stock. An order approved with a shortage stays *Partly reserved* / *Awaiting stock* until consolidation tops it up, and dispatch confirmation always re-checks stock.
- Customer balances seeded before v10 are demo opening balances. From v10 on they move only with invoices, receipts and credit notes.
- The order lifecycle ends at *Delivered*. "Completed" is shown through the Fulfilment tab (invoiced / paid) rather than as an extra order status, so existing data and reports keep their meaning.

## 12. Run

```bash
npm install
npm run dev              # http://localhost:5173
npm run build && npm run preview
npm run check:workflow   # end-to-end business checks (Node, no browser)
npm run check:migration -- <snapshot.json>   # upgrade check against a saved LocalStorage snapshot
```
