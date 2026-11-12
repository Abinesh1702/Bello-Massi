---
title: "Release Notes — Prototype Finalisation Release (Data Version 8)"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-DEP-003 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Release Notes — Prototype Finalisation Release (Data Version 8) |
| Document ID | BM-DEP-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Deployment and Release |
| Related module(s) | All modules |
| Document owner | Release Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Publish the release notes of the current prototype release, reused from the existing project document FINALISATION.md, with documentation-team annotations.

## Scope

Prototype release, LocalStorage data version 8. This is a PROTOTYPE release, not a production release; nothing has been deployed to production.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- docs/FINALISATION.md (existing document E-14, reused without content changes)
- **BM-DEP-001** (Release Management Process)
- **BM-OVW-015** (Project Status and Implementation Summary)
- **BM-DOC-001** (Existing Documentation Review and Inventory)

## 0. Documentation-team notes

| Item | Note |
|---|---|
| Release type | PROTOTYPE (frontend only, LocalStorage) |
| Build / lint | Re-checked 2026-11-12: build passed, lint exit 0 with warnings — VERIFIED |
| "Verification performed" (§13) | Developer checks; scripts not in the repository — NOT VERIFIED independently |
| Production status | NOT IMPLEMENTED — no backend, no live integrations |
| Approval | No client approval of this release is recorded |

The original text follows unchanged (headings shifted one level).

## Original release notes

Frontend-only, LocalStorage prototype. No backend, no external services. Everything below runs in the existing
React + Vite application — the driver and customer apps are mobile layouts of the **same** app, chosen by the
signed-in user's data scope.

### 1. Modules completed

| Module | Where | Notes |
|---|---|---|
| Inventory Scrap Management | Inventory › Scrap Management (`/inventory/scrap`) | Dashboard, request list, create/edit draft, detail, print scrap note, approval, stock write-off |
| Communication Call History | Communication › Call History / Call Follow-ups | Manual call log (no telephony), follow-ups, create order from call |
| Reports Center | Reports › Reports Center (`/reports/center`) | 118 reports in 11 categories, one report viewer |
| Driver mobile app | `/driver/*` | Completed: login, dashboard, Reach location, OTP, POD, route, completed, tomorrow's plan |
| Customer mobile app | `/customer/*` | New: login, dashboard, catalog, cart, orders, tracking, documents, payments, profile |
| Live Tracking (DEMO GPS) | Dispatch › Live Tracking | Dispatcher view of simulated positions, ETAs and VIP warnings |

### 2. New pages

- Scrap: `/inventory/scrap`, `/inventory/scrap/requests`, `/requests/create`, `/requests/:id`, `/requests/:id/edit`, `/requests/:id/print`
- Calls: `/communication/calls`, `/calls/list`, `/calls/create`, `/calls/:id`, `/calls/:id/edit`, `/calls/follow-ups`
- Reports: `/reports/center`, `/reports/view/:id` (`/reports/inventory` now redirects to the center)
- Driver: `/driver/login`, `/driver/route`, `/driver/completed`
- Customer: `/customer/login`, `/customer/dashboard`, `/customer/catalog`, `/customer/cart`, `/customer/orders`,
  `/customer/orders/:id`, `/customer/tracking/:id`, `/customer/delivery-notes`, `/customer/delivery-notes/:id`,
  `/customer/invoices`, `/customer/invoices/:id`, `/customer/payments`, `/customer/profile`
- Dispatch: `/dispatch/live-tracking`

### 3. Improved existing pages

- Driver Today, stop detail, confirm delivery, profile, bottom navigation (Today · Deliveries · Route · Completed · Profile)
- Delivery note document — shows the captured customer signature, POD photo, customer remarks and rejected quantities
- Order form — opened from a call (`?customerId=&callId=`) links the new order back to the call
- Global search — now also finds scrap requests, calls, reports, drivers, vehicles and deliveries
- Dashboard — customers are redirected to the customer app; sign-out returns driver/customer users to their app login

### 4. Driver app

Mobile/email/username sign-in (no self-registration, simulated "forgot password", demo indicator, remember me) ·
KPIs: today, pending, completed, active, tomorrow · active delivery card with DEMO GPS progress · next stop with ETA ·
VIP timing alerts · route summary (stops/distance left, estimated finish) · Dispatcher's sequence (never re-ordered) ·
tomorrow's plan with a disabled Start · notifications · stop detail with status flow
(Assigned → Planned → Out for delivery → Arrived → OTP verification → Delivered), call (`tel:`), navigate (maps link),
route map · **Start** opens a tracking session · **Reach location** records the arrival and issues the customer OTP ·
OTP (wrong code blocks completion) · POD: delivered / damaged / short / rejected quantities, shortfall reason, customer
remarks, signature canvas, photo · failure outcomes (customer not available, refused, reschedule, …) · completed list
with OTP and POD status · profile with today's stats and sign out. A dispatch dated in the future cannot be started
(enforced in the service, not just the UI).

### 5. Customer app

Own account only (orders, deliveries, driver/vehicle and tracking of the customer's **own** orders) · dashboard counts,
outstanding, active delivery, recent orders, notes, notifications · catalog with search, categories, availability,
details and quantity · cart with subtotal / discount / tax / total, address, requested date and time, remarks · orders
placed in the app enter the normal approval workflow (Submitted → Sales Manager) · orders list with filters and
reorder · order detail with approval, credit, items, address, history, delivery note / invoice links · tracking
timeline (Placed → … → Delivered), DEMO GPS map, OTP shown after the driver arrives · delivery notes (with signature),
invoices (printable), payments (honest empty state + balance), profile.

### 6. Reports

118 reports across Sales, Inventory, Procurement, Dispatch & Delivery, Finance, Customer, Supplier, Fleet,
Communication, Scrap and AI. Landing page: counts per category, search, category filter, favourites, recently viewed,
popular. Viewer: KPIs, chart, search, sort, pagination, date from/to, month, year, dynamic filters (customer, supplier,
product, category, hub, warehouse, salesman, driver, vehicle, status, zone — shown when the report has the field),
column selection, grouping with subtotals, totals, CSV (`bellomassi-<report>-<date>.csv`), print (all rows), refresh.
Every number is computed from LocalStorage at open/refresh. **24 reports have no source data in this prototype**
(payments, credit notes, refunds, supplier invoices/payments, expenses, fuel, maintenance, batch/expiry dates, cycle
counts, returns) and show a "No source data" explanation instead of invented totals.

### 7. Scrap workflow

Draft → Submitted / Pending approval → Approved or Rejected → Stock written off → Completed (or Cancelled).
Reasons: Expired, Damaged, Quality Rejected, Temperature Excursion, Contamination, Packaging Damage, Other.
Rules enforced in `services/scrapService.js` and `inventoryService.postScrapWriteOff`: only an approved request can be
written off, exactly once; quantity must be > 0 and ≤ eligible stock (available or damaged source, minus other open
requests); never negative; duplicate open requests blocked; photo proof required for damage/contamination reasons;
batch required for batch-controlled products; requesters cannot approve their own request; every action re-checks
permissions (`scrap.create`, `scrap.approve`, `scrap.reject`). The write-off reduces stock and records a
"Scrap Write-off" movement in one transaction; valuation uses the product purchase price.

### 8. Calls

Call ID, date, time, customer, contact, phone, salesman, direction, duration, status, outcome, remarks, follow-up,
related sales order. Salesmen see only their own calls. Follow-up board: due today, upcoming, overdue, completed — with
complete, reschedule, add note, create order, open customer. Labelled **SIMULATED CALL LOG** — no calls are dialled,
connected or recorded.

### 9. Integrations (all simulated, labelled)

- **DEMO GPS** — positions/ETAs from `utils/demoGeo.js` (deterministic coordinates, 24 km/h + 12 min per stop). No device location is read.
- **Demo OTP** — shown in the driver and customer apps; no SMS is sent.
- **Call log** — manual entry; no telephony.
- Navigation buttons open a standard maps link in the phone's maps app; no API key is used or stored.

### 10. New LocalStorage keys

`bellomassi_scrap_requests`, `bellomassi_call_history`, `bellomassi_driver_tracking`, `bellomassi_delivery_pod`,
`bellomassi_customer_carts`, `bellomassi_report_prefs`. Existing keys reused: inventory, stock movements, orders,
deliveries, OTPs, delivery notes, notifications, roles. Migration v7 → v8 adds the keys, seeds demo scrap/calls (posting
completed write-offs consistently into the stock ledger), grants new permissions to system roles and sets the Customer
landing page. Nothing existing is removed.

### 11. Permissions added

`scrap.create`, `scrap.approve`, `scrap.reject` (view: `inventory.scrap.view`), `calls.manage` (view:
`communication.calls`), `customer.app`, `customer.order`, `tracking.fleet`, `reports.center`. Editable in Role Management.
Prototype-level RBAC — enforced in the browser, not production security.

### 12. Demo workflow (≈10 minutes)

1. **Customer** (`/customer/login`, Use demo account) → Catalog → add 2 products → Cart → Place order.
2. **Sales Manager** (`manager`) → Order Approval → approve the new order.
3. **Inventory Executive** (`inventory`) → Scrap Management → New scrap request → submit.
   **Warehouse Manager** (`warehouse`) → open it → Approve & write off → see the stock movement.
4. **Salesman** (`salesman`) → Call History → Log a call (outcome Interested → follow-up) → Create sales order.
5. **Driver** (`/driver/login`, Use demo account) → Today → active stop → Reach location → Enter OTP (try a wrong
   code first) → signature + photo → Verify OTP → delivery note with POD → Start the next stop.
6. **Customer** → Home → Track delivery → OTP appears once the driver has arrived.
7. **Dispatcher** → Dispatch › Live Tracking; assign tomorrow's PLANNED dispatch to Murugan → the driver sees it under
   Tomorrow's plan with Start disabled.
8. **Admin** → Reports Center → Scrap Register / Sales by Customer → filter, group, export CSV, print.

### 13. Verification performed

Build (`vite build`) and lint pass. Automated browser checks: 13 roles × every sidebar page (no errors); 71 scenario
checks (driver, customer, scrap, calls, reports, cross-account isolation); 83 Phase 1 checks; 30 regression checks;
31 migration checks from a real v7 browser snapshot; 118 reports open without errors; 137 pages at 390 px with no
horizontal overflow.

### 14. Known limitations

- Frontend-only: data lives in one browser; two browsers do not share data.
- GPS, ETAs, OTP delivery and call logging are simulations.
- Payments, credit notes, supplier invoices/payments, expenses, fuel and maintenance are not captured, so their
  reports are empty by design. Batch and expiry dates are not tracked on stock.
- Photos and signatures are stored downscaled in LocalStorage (≈5 MB browser quota).
- Customer cancellations/edits after placing an order go through the sales team.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |