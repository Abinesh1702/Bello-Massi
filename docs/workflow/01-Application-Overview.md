# 01 · Application Overview

## 1.1 What Bellomassi is

Bellomassi is an **order-to-delivery management system** for a frozen and chilled food distributor. It covers the full
chain from a salesman (or the customer) placing an order, through sales approval, warehouse preparation, dispatch
planning and the driver's doorstep delivery, to the delivery note and the customer invoice. Around this core it provides
inventory control, vehicle and driver compliance, document management with OCR, communication (email, WhatsApp, call
log), reporting, forecasting and an AI assistant.

The application in this repository is a **client-demo prototype**:

- It is a single React web application. There is **no backend server and no database**.
- All data lives in the **browser's LocalStorage** (application data version 8). Each browser has its own copy of the
  data; clearing site data resets it to the seeded demo data.
- Sign-in is a **browser-session simulation** with published demo passwords. It is not production authentication.
- Integrations (SMTP email, OpenWA WhatsApp, OCR, AI providers) have a **demo mode** that is active by default and an
  optional **backend gateway mode** that is only used when `VITE_INTEGRATION_GATEWAY_URL` is configured. Gateway mode is
  **Not Verified** in this document because no gateway was available.

## 1.2 The three user-facing apps

One code base serves three experiences. They share the same data and the same accounts.

| App | Entry | Who uses it | Layout |
|---|---|---|---|
| **Office web app** | `/login` → `/dashboard` | Super Admin, Administrator, Sales Executive, Sales Manager, Customer Service, Dispatcher, Finance, Warehouse Manager, Inventory Executive, QA Manager, Supplier | Sidebar + header (`components/layout/AppLayout`) |
| **Driver app** (mobile-first) | `/driver/login` → `/driver/dashboard` | Driver | Bottom tab bar (`DriverLayout`) |
| **Customer app** (mobile-first) | `/customer/login` → `/customer/dashboard` | Customer (portal user) | Bottom tab bar (`CustomerLayout`) |

## 1.3 Roles at a glance

Thirteen system roles are defined in `src/config/roles.js`. Administrators can also create **custom roles** (Role
Management) by choosing permissions from the catalog in `src/config/rbacCatalog.js`.

| Role code | Label | Workspace | Data scope (what records they see) |
|---|---|---|---|
| SUPER_ADMIN | Super Admin | Admin Panel | All records; can grant the Super Admin role |
| ADMIN | Administrator | Admin Panel | All records |
| SALESMAN | Sales Executive | Order Taking App | Own orders, own customers' documents and deliveries |
| SALES_MANAGER | Sales Manager | Order Taking App | All non-draft orders; customer and order documents |
| CUSTOMER_SERVICE | Customer Service | Order Taking App | Orders from approval onwards; all documents |
| DISPATCHER | Dispatcher | Order Taking App | Orders from consolidation onwards; fleet and hub documents |
| DRIVER | Driver | Drivers App | Own dispatches, deliveries and documents |
| FINANCE | Finance Executive | Notifications & Reports | All non-draft orders; invoices, customers, vendor documents |
| WAREHOUSE_MANAGER | Warehouse Manager | Warehouse | Dispatch & warehouse scope |
| INVENTORY_EXECUTIVE | Inventory Executive | Warehouse | Dispatch & warehouse scope |
| QA_MANAGER | QA Manager | Quality & Cold Chain | Dispatch & warehouse scope |
| CUSTOMER | Customer (Portal) | Customer Portal | One linked customer's orders, deliveries and invoices |
| SUPPLIER | Supplier (Portal) | Supplier Portal | One linked supplier's approved replenishment |

> Note: the role description of CUSTOMER in `roles.js` still says "read-only portal". In the current code the customer
> can **place orders** from the customer app (permission `customer.order`). This document follows the code.

## 1.4 Modules and implementation status

| Module | Main routes | Status |
|---|---|---|
| Authentication & session | `/login`, `/driver/login`, `/customer/login`, `/forgot-password`, `/reset-password`, `/logout` | Implemented (simulated security) |
| Role dashboards + period filter | `/dashboard`, `/driver/dashboard`, `/customer/dashboard` | Implemented |
| Master data — products, customers, hubs, suppliers, zones | `/products`, `/customers`, `/hubs`, `/suppliers`, `/dispatch/zones` | Implemented |
| Customer credit | `/customers/credit` | Partially Implemented (balance is maintained on the customer record; no payment entry) |
| Order management | `/orders/*` | Implemented |
| Order approval | `/orders/approval` | Implemented |
| Order consolidation | `/orders/consolidation` | Implemented |
| Inventory — stock, receipts, transfers, adjustments, movements, low stock | `/inventory/*` | Implemented |
| Scrap management | `/inventory/scrap/*` | Implemented |
| Warehouse dashboard / QA & cold chain | `/warehouse`, `/quality` | Implemented (temperature monitoring: Not Implemented — "No sensor integration") |
| Dispatch planning, assignment, confirmation | `/dispatch/*` | Implemented |
| Delivery tracking & live tracking | `/dispatch/delivery-tracking`, `/dispatch/live-tracking` | Simulated (DEMO GPS) |
| Driver app | `/driver/*` | Implemented (GPS and OTP simulated) |
| Delivery OTP | driver confirm screen, customer tracking | Simulated (no SMS) |
| Proof of delivery (photo / signature) | driver confirm screen | Implemented (stored in browser) |
| Delivery notes | `/dispatch/delivery-notes/:id` | Implemented |
| Customer app | `/customer/*` | Implemented (payments: Not Implemented) |
| Vehicle Management System (VMS) | `/vms/*` | Implemented |
| Documents & OCR | `/documents/*` | Implemented; OCR is Simulated in demo mode |
| Invoices & templates | `/invoices/*` | Implemented (demo tax, not GST-compliant) |
| Payments, credit notes, refunds, expenses | — | Not Implemented |
| Email | `/communication/email/*` | Simulated (demo mode); gateway mode Not Verified |
| WhatsApp (OpenWA) | `/communication/whatsapp/*` | Simulated (mock session); gateway mode Not Verified |
| Automated notifications | `/communication/automation` | Implemented (sends through the simulated channels) |
| Call history | `/communication/calls/*` | Implemented (manual call log; no telephony) |
| In-app notifications | `/notifications` | Implemented |
| Reports Center | `/reports/center` | Implemented — 118 reports, 24 have no source data in the prototype |
| AI Assistant, Jarvis, Insights | `/ai`, `/ai/assistant`, `/ai/jarvis`, `/ai/insights` | Simulated (rule-based intent engine; external AI provider Not Verified) |
| Forecasting, predictive inventory, model management | `/ai/forecasting`, `/ai/predictive-inventory`, `/ai/models` | Implemented (in-browser statistical models) |
| Replenishment (purchase requests) | `/ai/replenishment` | Implemented (stops at goods receipt; supplier invoicing Not Implemented) |
| Administration — users, roles, permissions, audit, settings, organization | `/admin/*` | Implemented |

## 1.5 Technology

| Layer | Technology |
|---|---|
| UI | React 19, React Router 7, Tailwind CSS v4, Lucide icons, Recharts 3, sonner (toasts) |
| Build | Vite 8 |
| Dates | dayjs with UTC and time-zone plugins (organisation time zone from Application Settings) |
| Persistence | `src/services/storageService.js` — the only module that reads or writes browser storage |
| Access control | `src/config/permissions.js` (`can(user, key)`), `src/services/rbacService.js`, `src/routes/ProtectedRoute.jsx` |
| Navigation | `src/config/navigation.js` — one list of 206 entries that drives routes, menus, breadcrumbs, search and access |

Architecture: **page → hook → service → storageService → LocalStorage.** Pages never write storage directly; every
business rule (who may do what, which status may move where) lives in a service function that returns
`{ ok: true, record }` or `{ ok: false, error, errors }`.

## 1.6 Data storage (LocalStorage)

All keys are prefixed `bellomassi_`. The full list from `src/utils/constants.js` (`STORAGE_KEYS`):

| Area | Keys |
|---|---|
| App & session | `app_version`, `demo_users`, `session`, `settings`, `demo_data`, `activities`, `theme`, `notifications`, `notification_preferences`, `auth` |
| Master data | `customers`, `products`, `hubs`, `dispatch_zones`, `drivers`, `vehicles`, `company`, `organization` |
| Inventory | `inventory`, `stock_receipts`, `stock_transfers`, `stock_adjustments`, `stock_movements`, `scrap_requests` |
| Orders | `orders`, `order_sequence`, `approvals`, `consolidations`, `order_timeline` |
| Dispatch & delivery | `dispatches`, `dispatch_sequence`, `deliveries`, `delivery_sequence`, `delivery_otps`, `delivery_notes`, `dispatch_timeline`, `driver_tracking`, `delivery_pod` |
| VMS & documents | `vms_settings`, `document_types`, `documents`, `ocr_results` |
| Invoices | `invoice_templates`, `invoices`, `invoice_settings` |
| Communication | `email_templates`, `email_drafts`, `email_history`, `email_inbox`, `email_settings`, `whatsapp_templates`, `whatsapp_messages`, `openwa_settings`, `communication_settings`, `notification_templates`, `notification_history`, `call_history` |
| AI & planning | `ai_settings`, `ai_conversations`, `ai_messages`, `ai_insights`, `ai_activity`, `jarvis_settings`, `jarvis_history`, `forecasts`, `forecast_settings`, `inventory_predictions`, `reorder_recommendations`, `ai_models`, `replenishment_drafts`, `sales_history` |
| Administration | `roles`, `permissions`, `audit_logs` |
| Customer app & reports | `customer_carts`, `report_prefs` |

Suppliers are stored inside `bellomassi_forecast_settings` (`suppliers` array), not in a key of their own.

## 1.7 What is simulated

These behaviours look real in a demo but no external system is involved. The UI labels each of them.

| Behaviour | Where | How it is simulated |
|---|---|---|
| GPS tracking | Driver app, customer tracking, Live Tracking | `utils/demoGeo` + `trackingService` move a marker along a straight-line route over time. Badge: **DEMO GPS**. |
| Delivery OTP | Driver confirm, customer tracking | `otpService` generates a 6-digit code stored in `bellomassi_delivery_otps`; it is shown in the customer app. **No SMS is sent.** |
| Email | Communication › Email, automation | Demo mode records `QUEUED_DEMO` → `SENT_DEMO` ("Sent · demo (not sent)"). |
| WhatsApp | Communication › WhatsApp, automation | Mock OpenWA session; messages recorded as "Sent · demo". |
| OCR | Documents › OCR Queue | MOCK provider pre-fills fields from the linked record, form values and file name; results are labelled "Simulated OCR". |
| AI Assistant / Jarvis | AI & Intelligence | A demo intent engine maps questions to permission-checked tools; voice uses the browser's speech API. |
| Phone calls | Call History | A manual call log — nothing is dialled. |
| Cold-chain temperatures | QA dashboard | No readings: "No sensor integration". |
| Password reset code | Forgot password | The 6-digit code is shown on screen (no email is sent). |

## 1.8 Coming Soon and placeholder items

| Item | Where | What the user sees | Classification |
|---|---|---|---|
| Credit history | Customer details (`/customers/:id`) | Panel with a "Later phase" badge: "Credit movements (invoices, payments and limit changes over time) arrive with invoicing." | Coming Soon |
| Credit limits / Invoices / Order reports panels | Finance dashboard | Three information panels with a "Later phase" badge. Each has a working button to an implemented module (Customer Credit, Invoices, Order Reports); the badge text is older than the invoice module. | UI Only (links work) |
| Coming Soon page | `src/pages/ComingSoon.jsx` | Generic page for modules of later phases. No route in `navigation.js` currently uses it. | Not used |
| Warehouse settings — picking strategy (FEFO), putaway confirmation, QA hold on receipt | Application Settings › Warehouse | Saved, but no workflow reads them | UI Only |

## 1.9 How the documentation was verified

- Roles, menus, permissions, routes and status values were exported directly from the source (`navigation.js`,
  `roles.js`, `permissions.js`, `rbacCatalog.js`, `orderConfig.js`, `dispatchConfig.js`, `reportService.js`) with a
  small read-only script (`scripts/dump-inventory.mjs`), so lists in this document match the code exactly.
- Business rules and messages were read from the service functions named in each chapter.
- Behaviour of the main flows was previously exercised with browser test suites (order-to-delivery, approval, dispatch,
  driver app, customer app, scrap, reports, dashboards for all 13 roles).
