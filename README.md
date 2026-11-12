# Bellomassi — Order-to-Delivery Management System (Prototype)

Client-demo **frontend prototype**. React + Vite, LocalStorage persistence, **no backend**.

> DEMO PROTOTYPE · Data lives in your browser · Demo credentials are not production authentication.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build
```

Requires Node 20.19+ (or 22.12+).

## Demo accounts

Sign in with the **email or the username**. All accounts are listed on the login screen (dropdown and list).

| Role | Username | Email | Password |
|---|---|---|---|
| Super Admin | superadmin | superadmin@bellomassi.demo | Super@123 |
| Administrator | admin | admin@bellomassi.demo | Admin@123 |
| Sales Manager | manager | manager@bellomassi.demo | Manager@123 |
| Sales Executive | salesman | salesman@bellomassi.demo | Sales@123 |
| Customer Service | cs | cs@bellomassi.demo | Cs@123 |
| Warehouse Manager | warehouse | warehouse@bellomassi.demo | Warehouse@123 |
| Inventory Executive | inventory | inventory@bellomassi.demo | Inventory@123 |
| Dispatcher | dispatcher | dispatcher@bellomassi.demo | Dispatch@123 |
| Driver | driver | driver@bellomassi.demo | Driver@123 |
| Finance Executive | finance | finance@bellomassi.demo | Finance@123 |
| QA Manager | qa | qa@bellomassi.demo | Quality@123 |
| Customer (portal) | customer | customer@bellomassi.demo | Customer@123 |
| Supplier (portal) | supplier | supplier@bellomassi.demo | Supplier@123 |
| CEO | ceo | ceo@bellomassi.demo | Ceo@123 |
| Operations Manager | operations | operations@bellomassi.demo | Ops@123 |
| HORECA Sales Executive | horeca | horeca@bellomassi.demo | Horeca@123 |
| Van Sales Executive | vansales | vansales@bellomassi.demo | Van@123 |
| Procurement Manager | procurement | procurement@bellomassi.demo | Procure@123 |
| Procurement Executive | buyer | buyer@bellomassi.demo | Buyer@123 |
| Import Executive | import | import@bellomassi.demo | Import@123 |
| Warehouse Executive | whexec | whexec@bellomassi.demo | Whexec@123 |
| QA Inspector | qainspector | qainspector@bellomassi.demo | Inspect@123 |
| Fleet Manager | fleet | fleet@bellomassi.demo | Fleet@123 |
| Finance Manager | financemanager | financemanager@bellomassi.demo | FinMgr@123 |
| Accountant | accountant | accountant@bellomassi.demo | Account@123 |
| HR Manager | hr | hr@bellomassi.demo | Hr@123 |
| HR Executive | hrexec | hrexec@bellomassi.demo | HrExec@123 |

**Driver and customer mobile apps** (same application, same accounts): open `/driver/login` or `/customer/login`
and sign in with the mobile number, email or username — e.g. driver `+91 98400 11206` / `Driver@123`,
customer `+91 98410 22310` / `Customer@123`.

These are public demo credentials. Authentication is a **browser session simulation** — not secure authentication.

## Architecture

```
React UI  →  hooks (useStoredValue, useAuth, useSettings …)  →  services  →  storageService  →  LocalStorage
```

- `src/services/storageService.js` — the **only** module that touches browser storage. JSON safety, in-memory
  fallback, cache + subscriptions, versioned seeding, corruption repair, reset, export, validated import, usage.
- `src/services/seed/demoSeed.js` — deterministic demo data (7 users, 10 customers, 15 products, 5 hubs, 8 zones,
  75 stock rows, 8 drivers, 41 orders with full history, activities, notifications).
- `src/config/navigation.js` — single source for menus, routes, breadcrumbs, search and access (each item names a permission key).
- `src/config/rbacCatalog.js` — modules, actions, every permission key, data scopes. `src/config/permissions.js` — default grants
  and `can()`, which resolves through the live roles in `bellomassi_roles` (see `docs/RBAC_AND_ADMINISTRATION.md`).
- `src/config/runtimeConfig.js` — localization / numbering / security values used by formatters and services,
  filled from Application Settings and the company profile.

### Storage keys

`bellomassi_app_version`, `bellomassi_demo_users`, `bellomassi_session`, `bellomassi_settings`,
`bellomassi_demo_data`, `bellomassi_activities`, `bellomassi_theme`, `bellomassi_notifications`, plus the per-phase keys
listed below. Phase 1 completion added `bellomassi_roles`, `bellomassi_permissions`, `bellomassi_company`,
`bellomassi_organization`, `bellomassi_audit_logs`, `bellomassi_notification_preferences` and `bellomassi_auth`.
Schema version: `APP_DATA_VERSION` (now **10**) in `src/utils/constants.js`; migrations run on start-up and on import.

Session: **Keep me signed in** → localStorage (survives restarts); otherwise sessionStorage. Idle sessions end after the
timeout in Application Settings › Security. Passwords are stored only as a demo FNV-1a fingerprint — not cryptographic security.

## Phase status

- **Phase 1** — Foundation, authentication & dashboard shell ✅ — completed with RBAC, user / role management,
  organization master, application settings, audit log and notification center (data version 7)
- **Phase 2** — Customer, product, hub & inventory management ✅
- **Phase 3** — Order management, approval & consolidation ✅
- **Phase 4** — Dispatch management, driver assignment & delivery ✅
- **Phase 5** — VMS, OCR document management, invoice customization, SMTP/IMAP email & OpenWA WhatsApp ✅
- **Phase 6** — AI Assistant, Jarvis voice assistant, forecasting & predictive inventory ✅
- **Finalisation (data v8)** — Scrap Management, Call History, Reports Center (118 reports), driver mobile app completion
  (Reach location, OTP, POD, DEMO GPS route, tomorrow's plan), customer mobile app, live tracking ✅ — see
  [`docs/FINALISATION.md`](docs/FINALISATION.md)
- **UI/UX & dashboard period filter** — design-system refresh across the app and a universal date filter on every
  dashboard (presets, financial year, custom range, comparison) ✅ — see [`docs/UI_DESIGN_SYSTEM.md`](docs/UI_DESIGN_SYSTEM.md)
- **Project workspace** — Mobile App Preview (`/mobile-preview`, device emulator running the real driver and customer
  apps) and Project Documents (`/project-documents`, documentation library with preview, download and ZIP export) ✅ —
  see [`docs/MOBILE_PREVIEW_AND_PROJECT_DOCUMENTS.md`](docs/MOBILE_PREVIEW_AND_PROJECT_DOCUMENTS.md)
- **Workflow restructuring & cleanup (data v10)** — stock reserved at approval and released on cancellation, one order
  cancellation path, invoices → receipts → outstanding balance kept consistent, AI replenishment handed to procurement,
  one Reports Center (module report screens merged), one vehicle register, sidebar with one menu per business area,
  dead code removed ✅ — see [`docs/CLEANUP_AND_WORKFLOW_AUDIT.md`](docs/CLEANUP_AND_WORKFLOW_AUDIT.md).
  Checks: `npm run check:workflow`, `npm run check:migration -- <snapshot.json>`
- **Enterprise ERP expansion (data v9)** — Sales & CRM, HORECA, van sales, customer service, procurement (PR → RFQ →
  quotes → PO → GRN → QA → 3-way match → payment), import & export with landed cost, warehouse operations (locations,
  put-away, FEFO picking, packing, loading), batches / expiry / recall on the single stock ledger, QA & food safety,
  logistics, fleet, driver expenses, finance (AR, AP, expenses, bank & cash, VAT), HR (employees, recruitment,
  attendance, leave, demo payroll, self-service), operations control tower, management dashboards, supplier portal,
  71 enterprise roles, 14 new demo users and 48 new reports ✅ — see [`docs/ENTERPRISE_MODULES.md`](docs/ENTERPRISE_MODULES.md),
  [`docs/DEPARTMENT_ROLE_MATRIX.md`](docs/DEPARTMENT_ROLE_MATRIX.md), [`docs/BUSINESS_WORKFLOWS.md`](docs/BUSINESS_WORKFLOWS.md),
  [`docs/LOCALSTORAGE_DATA_MODEL.md`](docs/LOCALSTORAGE_DATA_MODEL.md) and [`docs/IMPLEMENTATION_PROGRESS.md`](docs/IMPLEMENTATION_PROGRESS.md)

## Phase 2 — modules & routes

| Module | Routes |
|---|---|
| Customers | `/customers`, `/customers/create`, `/customers/:id`, `/customers/:id/edit`, `/customers/credit` |
| Products | `/products`, `/products/create`, `/products/:id`, `/products/:id/edit` |
| Hubs | `/hubs`, `/hubs/create`, `/hubs/:id`, `/hubs/:id/edit` |
| Inventory | `/inventory`, `/inventory/stock`, `/inventory/stock/:id`, `/inventory/low-stock`, `/inventory/movements` |
| Stock documents | `/inventory/stock-receipts(/create)`, `/inventory/stock-transfers(/create)`, `/inventory/stock-adjustments(/create)` |

### Storage keys (data version 2)
`bellomassi_customers`, `bellomassi_products`, `bellomassi_hubs`, `bellomassi_inventory`, `bellomassi_stock_receipts`,
`bellomassi_stock_transfers`, `bellomassi_stock_adjustments`, `bellomassi_stock_movements` — plus the Phase 1 keys.
Browsers and backups holding Phase 1 (version 1) data are migrated automatically on start-up / import.

### Services
`customerService`, `productService`, `hubService`, `inventoryService` (all CRUD + validation), `csvService`,
`activityService`. Stock operations write stock, document and movement ledger in one rolled-back-on-failure transaction.

### Permissions
Fine-grained UI permissions in `src/config/permissions.js` (e.g. `customers.manage`, `inventory.receipts.manage`).
Admin manages everything; other roles are view-only per the Phase 2 matrix; Driver has no master-data access.

### Product categories & units
The Phase 2 lists (Industrial, Electrical, … / PCS, BOX, …) are included, plus Frozen Food, Chilled Food and CTN for
Bellomassi's catalogue. Edit `src/config/masterData.js` to change them.

## Phase 3 — order management, approval & consolidation

Workflow: `DRAFT → SUBMITTED → APPROVED → CONSOLIDATED → READY_FOR_DISPATCH`, with `SUBMITTED → RETURNED → (edit) → SUBMITTED`
and `SUBMITTED → REJECTED` (final). Order numbers (`BM-ORD-2026-00001`) are assigned on submission from a stored sequence
and never reused; drafts have no number and are private to their creator (and Admin).

| Page | Route | Who |
|---|---|---|
| Create / edit order | `/orders/create`, `/orders/:id/edit` | Salesman (own drafts/returned), Admin |
| My orders | `/orders/my-orders` | Salesman, Admin |
| Order list / details | `/orders`, `/orders/:id` | All roles except Driver (scoped per role) |
| Approval queue / review | `/orders/approval`, `/orders/approval/:id` | Sales Manager decides; Admin views |
| Consolidation queue / detail | `/orders/consolidation`, `/orders/consolidation/:id` | Customer Service acts; Admin views |
| Returned / rejected | `/orders/returned`, `/orders/rejected` | Salesman, Sales Manager, Admin |
| Order reports (7 reports + CSV) | `/orders/reports` (`/reports` redirects) | Admin, Sales Manager, Finance |

### Storage keys (data version 3)
`bellomassi_orders`, `bellomassi_order_sequence`, `bellomassi_approvals`, `bellomassi_consolidations`,
`bellomassi_order_timeline`. Version 2 data (orders inside `bellomassi_demo_data`) is converted automatically.

### Services
`orderService` (CRUD, validation, pricing, numbering, role visibility), `approvalService` (checks, approve / reject /
return with mandatory reason + remarks), `consolidationService` (verification, `CON-YYYY-NNNN`, ready for dispatch),
`orderTimelineService` (append-only audit trail). Amounts are computed in paise (`src/utils/orderMath.js`).

### Prototype boundaries
Approval and consolidation **do not** deduct stock, post stock movements, create invoices or post credit — those belong
to later phases. Notifications are in-app only (no email/WhatsApp is sent).

## Phase 4 — dispatch management, driver assignment & delivery

Workflow: `READY_FOR_DISPATCH → dispatch plan (DRAFT / PLANNED) → ASSIGNED (driver + vehicle) → CONFIRMED (stock deducted once)
→ IN_TRANSIT (driver starts) → per stop: DELIVERED / PARTIALLY_DELIVERED / FAILED (OTP-confirmed, delivery note) → COMPLETED`
(or "closed with exceptions" when any stop failed or was partial). Dispatch numbers `BM-DSP-2026-00001`, delivery notes `BM-DN-2026-00001`.

| Area | Routes | Who |
|---|---|---|
| Dispatch dashboard | `/dispatch` | Admin, Dispatcher, Sales Manager, Customer Service, Finance (Dispatcher's home dashboard) |
| Ready orders | `/dispatch/ready-orders` | Admin, Dispatcher, Customer Service |
| Planning, create / edit, detail | `/dispatch/planning`, `/dispatch/create`, `/dispatch/:id`, `/dispatch/:id/edit` | Dispatcher + Admin manage; office roles view |
| Driver assignment | `/dispatch/assignments` | Dispatcher, Admin |
| Tracking / history / delivery detail / notes | `/dispatch/delivery-tracking`, `/dispatch/delivery-history`, `/dispatch/deliveries/:id`, `/dispatch/delivery-notes/:id` | per permission (salesmen: own orders' notes) |
| Zones / drivers / vehicles | `/dispatch/zones…`, `/dispatch/drivers…`, `/dispatch/vehicles…` | Admin manages, Dispatcher views |
| Delivery reports (9) | `/dispatch/reports` | Admin, Dispatcher, Finance |
| Driver app (mobile) | `/driver/dashboard`, `/driver/deliveries`, `/driver/deliveries/:id`, `/driver/deliveries/:id/confirm`, `/driver/delivery-notes`, `/driver/profile` | Driver only |

### Stock policy
Stock leaves the hub **once**, when the Dispatcher confirms the loaded dispatch (`Stock Dispatch` movements linked to the
dispatch and order). Planning, assigning, editing and cancelling before confirmation never touch stock. Cancelling a
confirmed dispatch before the driver starts restores stock with `Stock Dispatch Reversal` movements (exactly once).
Delivery confirmation never deducts stock again; undelivered goods from failed / partial stops return to the hub only
when the Dispatcher reviews the exception (`Delivery Return`, once).

### Simulated OTP
Six digits, 10-minute expiry (configurable), 5 attempts, regeneration invalidates the previous code. The code is shown
on screen with a **SIMULATED OTP** badge and in the Dispatcher/Admin OTP inspector — no SMS, WhatsApp or other
provider is contacted.

### Storage keys (data version 4)
`bellomassi_dispatches`, `bellomassi_dispatch_sequence`, `bellomassi_drivers`, `bellomassi_vehicles`,
`bellomassi_dispatch_zones`, `bellomassi_deliveries`, `bellomassi_delivery_sequence`, `bellomassi_delivery_otps`,
`bellomassi_delivery_notes`, `bellomassi_dispatch_timeline`. Version 3 data and backups are upgraded automatically.

### Delivery note PDF
"Download PDF" opens the browser print dialog with a dedicated print layout (choose *Save as PDF*); no PDF library or
backend is used.

## Phase 5 — VMS, documents & OCR, invoices, email & WhatsApp

> **Demo vs real.** Everything below runs in the browser. OCR is **simulated** (values come from the linked record and
> are labelled *SIMULATED OCR*), emails and WhatsApp messages are recorded as **"demo (not sent)"**, and invoice tax is a
> **demo rate** — not statutory GST. Real SMTP / IMAP / OpenWA / OCR requires the backend integration gateway described
> in [`docs/INTEGRATION_GATEWAY.md`](docs/INTEGRATION_GATEWAY.md); set `VITE_INTEGRATION_GATEWAY_URL` (see `.env.example`).
> No passwords, API keys or session credentials are ever written to LocalStorage.

| Area | Routes | Who |
|---|---|---|
| VMS | `/vms`, `/vms/vehicles…`, `/vms/drivers…`, `/vms/document-expiry`, `/vms/reports`, `/vms/settings` | Admin manages; Dispatcher views + uploads; settings Admin only |
| Documents & OCR | `/documents`, `/documents/upload`, `/documents/ocr-queue`, `/documents/verified`, `/documents/rejected`, `/documents/:id`, `/documents/:id/review`, `/documents/types…`, `/documents/reports` | Upload: all roles (scoped); review: Admin + Customer Service (vehicle/driver docs Admin only); types: Admin |
| Invoices | `/invoices`, `/invoices/dashboard`, `/invoices/create`, `/invoices/:id`, `/invoices/:id/print`, `/invoices/templates…`, `/invoices/reports` | Admin + Finance manage; Sales Manager views |
| Email | `/communication/email` (+ `/compose`, `/inbox`, `/sent`, `/drafts`, `/history`, `/templates…`, `/settings`) | Office roles send; inbox Admin/CS/Sales Manager; settings + templates Admin |
| WhatsApp (OpenWA) | `/communication/whatsapp` (+ `/compose`, `/history`, `/templates…`, `/settings`) | Office roles send; settings + templates Admin |
| Communication Center / automation | `/communication`, `/communication/automation` | Office roles view; rules Admin |
| Driver documents | `/driver/documents`, `/driver/documents/:id` | Driver (own + assigned vehicle) |

**Compliance blocking.** Required vehicle documents (RC, insurance, fitness by default) and the driver licence are
checked when a dispatch is assigned: an expired one blocks the assignment (critical), documents inside the warning
window can be set to block too (`/vms/settings`). Verifying a renewed document moves the expiry onto the vehicle/driver.

**Files.** Document files live in browser IndexedDB (temporary prototype storage); LocalStorage holds metadata only.
Backups export metadata, not files — after restoring on another browser, documents show "file not available".

**Invoices.** Numbers `BM-INV-2026-00001`, never reused (a cancelled number is skipped). Issuing stores an immutable
snapshot of template, customer, hub, lines and totals; editing a template later never changes issued invoices.
Invoicing never changes stock, dispatches or deliveries. "Save as PDF" uses the browser print dialog.

**Automation.** 11 events (order created/approved/rejected/ready, dispatch assigned, delivery started/completed/failed,
invoice generated, document expiring/expired). Each event is sent at most once per record (dedupe key in
`bellomassi_notification_history`), including when triggered twice at the same time.

### Storage keys (data version 5)
`bellomassi_vms_settings`, `bellomassi_document_types`, `bellomassi_documents`, `bellomassi_ocr_results`,
`bellomassi_invoice_templates`, `bellomassi_invoices`, `bellomassi_invoice_settings`, `bellomassi_email_templates`,
`bellomassi_email_drafts`, `bellomassi_email_history`, `bellomassi_email_inbox`, `bellomassi_email_settings`,
`bellomassi_whatsapp_templates`, `bellomassi_whatsapp_messages`, `bellomassi_openwa_settings`,
`bellomassi_communication_settings`, `bellomassi_notification_templates`, `bellomassi_notification_history`.
Vehicle/driver documents share `bellomassi_documents` (no duplicate collections). Version 4 data and backups are
upgraded automatically.

## Phase 6 — AI Assistant, Jarvis, forecasting & predictive inventory

> **Demo vs real.** The assistant and Jarvis run a **rule-based intent engine** over permission-checked tools
> (labelled *Demo AI · rule-based*). Forecasts and stock-out predictions use **statistical formulas** in the browser
> (moving average, weighted MA, exponential smoothing, Holt trend, seasonal baseline) — labelled *Statistical model ·
> not trained ML*. Accuracy figures come only from real holdout backtests. Forecast history before the first platform
> order uses a **synthetic demo baseline** (`bellomassi_sales_history`), flagged wherever it is used and switchable off
> in Planning parameters. OpenJarvis / Ollama / cloud providers and backend ML are integration-ready (see
> `docs/INTEGRATION_GATEWAY.md`); the UI never shows *Connected* without a verified response.

| Area | Routes | Who |
|---|---|---|
| AI overview / assistant / activity | `/ai`, `/ai/assistant`, `/ai/activity` | All office roles (not Driver) |
| Jarvis (voice + text) | `/ai/jarvis` + floating button | All office roles |
| Forecasting | `/ai/forecasting`, `/new`, `/history`, `/compare`, `/:id`, `/:id/print` | View: Admin, Sales Manager, Dispatcher, Finance · generate: Admin, Sales Manager · export: + Finance |
| Predictive inventory | `/ai/predictive-inventory` (+ `/reorder`, `/risks`, `/demand`, `/settings`, `/lines/:id`) | View: Admin, Sales Manager, Dispatcher, Finance · parameters: Admin |
| Replenishment | `/ai/replenishment`, `/create`, `/:id` | Create: Admin, Dispatcher · approve / convert: Admin |
| Insights | `/ai/insights` | View: Admin, SM, CS, Dispatcher, Finance · review/resolve: Admin, SM, Dispatcher |
| Models / AI settings | `/ai/models`, `/ai/settings` | Models: forecasting roles view, Admin manages · settings: Admin |

**Safety.** Every assistant/Jarvis action goes through `services/ai/aiToolRegistry.js` (input validation, permission
and record-scope checks, structured results, audit log). Write tools (replenishment draft, approve/reject order) and
hand-offs (cancel order, stock adjustment, invoice change, customer deletion, assignment, dispatch, email, WhatsApp,
payments) show the affected records and run only after **Confirm**. No arbitrary code or shell execution exists.

**Replenishment never changes stock.** Draft → submitted → approved → converted; stock changes only when a Stock
Receipt (prefilled with the draft number as reference) is posted in Inventory.

**Browser limits.** Voice input needs the Web Speech API (Chrome, Edge, Safari; not Firefox) over HTTPS or localhost
and microphone permission; text commands always work. Voice output uses `speechSynthesis` (voices vary by OS).

### Storage keys (data version 6)
`bellomassi_ai_settings`, `bellomassi_ai_conversations`, `bellomassi_ai_messages`, `bellomassi_ai_insights`,
`bellomassi_ai_activity`, `bellomassi_jarvis_settings`, `bellomassi_jarvis_history`, `bellomassi_forecasts`,
`bellomassi_forecast_settings`, `bellomassi_inventory_predictions`, `bellomassi_reorder_recommendations`,
`bellomassi_ai_models`, `bellomassi_replenishment_drafts`, `bellomassi_sales_history` (synthetic demo baseline).
Version 5 data and backups upgrade automatically; *AI Settings → Reset demo AI data* rebuilds only these keys.

## Phase 1 completion — foundation, authentication, RBAC & administration

Details: [`docs/RBAC_AND_ADMINISTRATION.md`](docs/RBAC_AND_ADMINISTRATION.md).

| Area | Routes |
|---|---|
| Authentication | `/login`, `/forgot-password`, `/reset-password`, `/account/change-password`, `/profile`, `/logout` |
| Users & roles | `/admin/users` (+ `/create`, `/:id`, `/:id/edit`), `/admin/roles` (+ `/create`, `/:id`, `/:id/edit`), `/admin/permissions`, `/admin/role-assignment` |
| Organization | `/admin/organization/company`, `/branches`, `/business-units`, `/departments`, `/designations`, `/employees`, `/hubs` (→ `/hubs`), `/warehouses` |
| Settings & audit | `/admin/settings?section=general…ai` (13 sections), `/admin/audit-logs` |
| Notifications | `/notifications` (inbox, history, preferences) |
| Dashboards | `/dashboard` (per role), `/warehouse`, `/quality`, `/suppliers` |

- 13 system roles, custom roles, multiple roles per user (permissions are combined; the primary role sets the dashboard and data scope).
- Permissions are checked in navigation, routes, buttons **and again in the services before every action**.
- Localization defaults: United Arab Emirates · AED · Asia/Dubai. Amounts are displayed in the base currency without
  exchange-rate conversion; the Phase 2–6 demo records are Indian operations data (Chennai etc.), shown as an
  "India Operations" branch of a UAE head office.
