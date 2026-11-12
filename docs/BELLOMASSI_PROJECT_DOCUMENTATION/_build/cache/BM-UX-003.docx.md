---
title: "Information Architecture, Navigation and Sitemap"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-UX-003 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Information Architecture, Navigation and Sitemap |
| Document ID | BM-UX-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | UI/UX and Design |
| Related module(s) | All modules |
| Document owner | UX Designer |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Show how the screens are organised into applications, menu groups and sub-screens.

## Scope

All routes in src/config/navigation.js (VERIFIED). Menu visibility depends on the signed-in role.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- src/config/navigation.js
- src/components/layout/SidebarNav.jsx
- **BM-UX-004** (Screen Inventory)
- **BM-UX-001** (UI/UX Design Document)
- **BM-SEC-005** (RBAC and Access Control Matrix)

## 1. Applications

| Application | Entry | Layout | Users |
|---|---|---|---|
| Office web app | `/login` → role landing page | Sidebar + header (AppLayout) | All office roles |
| Driver app | `/driver/login` → `/driver/dashboard` | Mobile layout with bottom navigation (DriverLayout) | Driver |
| Customer app | `/customer/login` → `/customer/dashboard` | Mobile layout with bottom navigation (CustomerLayout) | Customer |

All three are the same React single-page application; the role decides which layout and menus are shown. The menu shows
only items the role has permission for; detail screens (marked "sub") are reached from list pages.

## 2. Navigation patterns (VERIFIED)

- **Sidebar** (office): grouped, collapsible menu groups; collapsible sidebar; mobile drawer below 1024 px.
- **Header**: breadcrumbs, global search (pages, customers, orders — Ctrl K), theme toggle, notification centre, profile menu, DEMO PROTOTYPE badge.
- **Bottom navigation** (driver: Today, Deliveries, Route, Completed, Profile; customer: Home, Catalog, Cart, Orders, Account).
- **Role landing page**: each role opens on its configured landing page after sign-in.

## 3. Sitemap

### Customer app (mobile) — My Account (Customer)

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-075 | Home | `/customer/dashboard` | menu |
| SCR-076 | Catalog | `/customer/catalog` | menu |
| SCR-077 | Cart | `/customer/cart` | menu |
| SCR-078 | My Orders | `/customer/orders` | menu |
| SCR-079 | Order | `/customer/orders/:id` | sub |
| SCR-080 | Track Delivery | `/customer/tracking/:id` | sub |
| SCR-081 | Delivery Notes | `/customer/delivery-notes` | menu |
| SCR-082 | Delivery Note | `/customer/delivery-notes/:id` | sub |
| SCR-083 | Invoices | `/customer/invoices` | menu |
| SCR-084 | Invoice | `/customer/invoices/:id` | sub |
| SCR-085 | Payments | `/customer/payments` | menu |
| SCR-086 | Profile | `/customer/profile` | menu |

### Driver app (mobile) — My Deliveries

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-064 | Today | `/driver/dashboard` | menu |
| SCR-065 | My Deliveries | `/driver/deliveries` | menu |
| SCR-066 | Route | `/driver/route` | menu |
| SCR-067 | Completed | `/driver/completed` | menu |
| SCR-068 | My Delivery Notes | `/driver/delivery-notes` | menu |
| SCR-069 | Driver Profile | `/driver/profile` | menu |
| SCR-070 | My Documents | `/driver/documents` | menu |
| SCR-071 | Document | `/driver/documents/:id` | sub |
| SCR-072 | Confirm Delivery | `/driver/deliveries/:id/confirm` | sub |
| SCR-073 | Delivery | `/driver/deliveries/:id` | sub |
| SCR-074 | Delivery Note | `/driver/delivery-notes/:id` | sub |

### Office web app — AI & Intelligence

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-163 | AI Overview | `/ai` | menu |
| SCR-164 | AI Assistant | `/ai/assistant` | menu |
| SCR-165 | Jarvis | `/ai/jarvis` | menu |
| SCR-166 | Forecasting | `/ai/forecasting` | menu |
| SCR-167 | Predictive Inventory | `/ai/predictive-inventory` | menu |
| SCR-168 | Replenishment | `/ai/replenishment` | menu |
| SCR-169 | AI Insights | `/ai/insights` | menu |
| SCR-170 | Model Management | `/ai/models` | menu |
| SCR-171 | AI Settings | `/ai/settings` | menu |
| SCR-172 | AI Activity | `/ai/activity` | sub |
| SCR-173 | New Forecast | `/ai/forecasting/new` | sub |
| SCR-174 | Forecast History | `/ai/forecasting/history` | sub |
| SCR-175 | Compare Forecasts | `/ai/forecasting/compare` | sub |
| SCR-176 | Forecast Report | `/ai/forecasting/:id/print` | sub |
| SCR-177 | Forecast | `/ai/forecasting/:id` | sub |
| SCR-178 | Reorder Recommendations | `/ai/predictive-inventory/reorder` | sub |
| SCR-179 | Inventory Risk Analysis | `/ai/predictive-inventory/risks` | sub |
| SCR-180 | Demand Forecasting | `/ai/predictive-inventory/demand` | sub |
| SCR-181 | Planning Parameters | `/ai/predictive-inventory/settings` | sub |
| SCR-182 | Prediction Detail | `/ai/predictive-inventory/lines/:id` | sub |
| SCR-183 | New Replenishment Draft | `/ai/replenishment/create` | sub |
| SCR-184 | Replenishment Draft | `/ai/replenishment/:id` | sub |

### Office web app — Administration

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-144 | User Management | `/admin/users` | menu |
| SCR-145 | Role Management | `/admin/roles` | menu |
| SCR-146 | Permission Matrix | `/admin/permissions` | menu |
| SCR-147 | User Role Assignment | `/admin/role-assignment` | menu |
| SCR-148 | Audit Log | `/admin/audit-logs` | menu |
| SCR-149 | Application Settings | `/admin/settings` | menu |
| SCR-150 | Create User | `/admin/users/create` | sub |
| SCR-151 | Edit User | `/admin/users/:id/edit` | sub |
| SCR-152 | User Details | `/admin/users/:id` | sub |
| SCR-153 | Create Role | `/admin/roles/create` | sub |
| SCR-154 | Edit Role | `/admin/roles/:id/edit` | sub |
| SCR-155 | Role Details | `/admin/roles/:id` | sub |

### Office web app — Communication

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-119 | Communication Center | `/communication` | menu |
| SCR-120 | Email | `/communication/email` | menu |
| SCR-121 | WhatsApp | `/communication/whatsapp` | menu |
| SCR-122 | Automated Notifications | `/communication/automation` | menu |
| SCR-123 | Call History | `/communication/calls` | menu |
| SCR-124 | Call Follow-ups | `/communication/calls/follow-ups` | menu |
| SCR-125 | All Calls | `/communication/calls/list` | sub |
| SCR-126 | Log a Call | `/communication/calls/create` | sub |
| SCR-127 | Edit Call | `/communication/calls/:id/edit` | sub |
| SCR-128 | Call Details | `/communication/calls/:id` | sub |
| SCR-129 | Compose Email | `/communication/email/compose` | sub |
| SCR-130 | Inbox | `/communication/email/inbox` | sub |
| SCR-131 | Sent | `/communication/email/sent` | sub |
| SCR-132 | Drafts | `/communication/email/drafts` | sub |
| SCR-133 | History | `/communication/email/history` | sub |
| SCR-134 | Email Templates | `/communication/email/templates` | sub |
| SCR-135 | New Template | `/communication/email/templates/create` | sub |
| SCR-136 | Edit Template | `/communication/email/templates/:id/edit` | sub |
| SCR-137 | Email Settings | `/communication/email/settings` | sub |
| SCR-138 | Compose | `/communication/whatsapp/compose` | sub |
| SCR-139 | History | `/communication/whatsapp/history` | sub |
| SCR-140 | WhatsApp Templates | `/communication/whatsapp/templates` | sub |
| SCR-141 | New Template | `/communication/whatsapp/templates/create` | sub |
| SCR-142 | Edit Template | `/communication/whatsapp/templates/:id/edit` | sub |
| SCR-143 | OpenWA Settings | `/communication/whatsapp/settings` | sub |

### Office web app — Customers

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-014 | Customer List | `/customers` | menu |
| SCR-015 | Customer Credit | `/customers/credit` | menu |
| SCR-016 | Add Customer | `/customers/create` | sub |
| SCR-017 | Customer Details | `/customers/:id` | sub |
| SCR-018 | Edit Customer | `/customers/:id/edit` | sub |

### Office web app — Dispatch

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-041 | Dispatch Dashboard | `/dispatch` | menu |
| SCR-042 | Ready for Dispatch | `/dispatch/ready-orders` | menu |
| SCR-043 | Dispatch Planning | `/dispatch/planning` | menu |
| SCR-044 | Driver Assignment | `/dispatch/assignments` | menu |
| SCR-045 | Delivery Tracking | `/dispatch/delivery-tracking` | menu |
| SCR-046 | Delivery History | `/dispatch/delivery-history` | menu |
| SCR-047 | Dispatch Zones | `/dispatch/zones` | menu |
| SCR-048 | Drivers | `/dispatch/drivers` | menu |
| SCR-049 | Vehicles | `/dispatch/vehicles` | menu |
| SCR-050 | Delivery Reports | `/dispatch/reports` | menu |
| SCR-051 | New Dispatch | `/dispatch/create` | sub |
| SCR-052 | New Zone | `/dispatch/zones/create` | sub |
| SCR-053 | Edit Zone | `/dispatch/zones/:id/edit` | sub |
| SCR-054 | Live Tracking (Demo GPS) | `/dispatch/live-tracking` | menu |
| SCR-055 | New Driver | `/dispatch/drivers/create` | sub |
| SCR-056 | Edit Driver | `/dispatch/drivers/:id/edit` | sub |
| SCR-057 | Driver Details | `/dispatch/drivers/:id` | sub |
| SCR-058 | New Vehicle | `/dispatch/vehicles/create` | sub |
| SCR-059 | Edit Vehicle | `/dispatch/vehicles/:id/edit` | sub |
| SCR-060 | Delivery Details | `/dispatch/deliveries/:id` | sub |
| SCR-061 | Delivery Note | `/dispatch/delivery-notes/:id` | sub |
| SCR-062 | Edit Dispatch | `/dispatch/:id/edit` | sub |
| SCR-063 | Dispatch Details | `/dispatch/:id` | sub |

### Office web app — Documents

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-098 | Document Repository | `/documents` | menu |
| SCR-099 | Upload Documents | `/documents/upload` | menu |
| SCR-100 | OCR Queue | `/documents/ocr-queue` | menu |
| SCR-101 | Verified | `/documents/verified` | menu |
| SCR-102 | Rejected | `/documents/rejected` | menu |
| SCR-103 | Document Types | `/documents/types` | menu |
| SCR-104 | Document Reports | `/documents/reports` | menu |
| SCR-105 | New Document Type | `/documents/types/create` | sub |
| SCR-106 | Edit Document Type | `/documents/types/:id/edit` | sub |
| SCR-107 | OCR Review | `/documents/:id/review` | sub |
| SCR-108 | Document | `/documents/:id` | sub |

### Office web app — General

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-019 | Products | `/products` | menu |
| SCR-020 | Suppliers | `/suppliers` | menu |
| SCR-021 | Hubs | `/hubs` | menu |
| SCR-192 | Add Product | `/products/create` | sub |
| SCR-193 | Product Details | `/products/:id` | sub |
| SCR-194 | Edit Product | `/products/:id/edit` | sub |
| SCR-195 | Add Hub | `/hubs/create` | sub |
| SCR-196 | Hub Details | `/hubs/:id` | sub |
| SCR-197 | Edit Hub | `/hubs/:id/edit` | sub |

### Office web app — Inventory

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-022 | Inventory Dashboard | `/inventory` | menu |
| SCR-023 | Warehouse Dashboard | `/warehouse` | menu |
| SCR-024 | QA & Cold Chain | `/quality` | menu |
| SCR-025 | Stock Overview | `/inventory/stock` | menu |
| SCR-026 | Low Stock | `/inventory/low-stock` | menu |
| SCR-027 | Stock Receipts | `/inventory/stock-receipts` | menu |
| SCR-028 | Stock Transfers | `/inventory/stock-transfers` | menu |
| SCR-029 | Stock Adjustments | `/inventory/stock-adjustments` | menu |
| SCR-030 | Stock Movements | `/inventory/movements` | menu |
| SCR-031 | Scrap Management | `/inventory/scrap` | menu |
| SCR-032 | Scrap Requests | `/inventory/scrap/requests` | sub |
| SCR-033 | New Scrap Request | `/inventory/scrap/requests/create` | sub |
| SCR-034 | Edit Scrap Request | `/inventory/scrap/requests/:id/edit` | sub |
| SCR-035 | Scrap Note | `/inventory/scrap/requests/:id/print` | sub |
| SCR-036 | Scrap Request | `/inventory/scrap/requests/:id` | sub |
| SCR-037 | Stock Details | `/inventory/stock/:id` | sub |
| SCR-038 | New Receipt | `/inventory/stock-receipts/create` | sub |
| SCR-039 | New Transfer | `/inventory/stock-transfers/create` | sub |
| SCR-040 | New Adjustment | `/inventory/stock-adjustments/create` | sub |

### Office web app — Invoices

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-109 | Invoice Dashboard | `/invoices/dashboard` | menu |
| SCR-110 | Invoices | `/invoices` | menu |
| SCR-111 | New Invoice | `/invoices/create` | menu |
| SCR-112 | Invoice Templates | `/invoices/templates` | menu |
| SCR-113 | Invoice Reports | `/invoices/reports` | menu |
| SCR-114 | New Template | `/invoices/templates/create` | sub |
| SCR-115 | Edit Template | `/invoices/templates/:id/edit` | sub |
| SCR-116 | Template Preview | `/invoices/templates/:id/preview` | sub |
| SCR-117 | Print Invoice | `/invoices/:id/print` | sub |
| SCR-118 | Invoice | `/invoices/:id` | sub |

### Office web app — Order Management

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-002 | Create Order | `/orders/create` | menu |
| SCR-003 | My Orders | `/orders/my-orders` | menu |
| SCR-004 | Order List | `/orders` | menu |
| SCR-005 | Order Approval | `/orders/approval` | menu |
| SCR-006 | Order Consolidation | `/orders/consolidation` | menu |
| SCR-007 | Returned Orders | `/orders/returned` | menu |
| SCR-008 | Rejected Orders | `/orders/rejected` | menu |
| SCR-009 | Order Reports | `/orders/reports` | menu |
| SCR-010 | Edit Order | `/orders/:id/edit` | sub |
| SCR-011 | Review Order | `/orders/approval/:id` | sub |
| SCR-012 | Consolidate Order | `/orders/consolidation/:id` | sub |
| SCR-013 | Order Details | `/orders/:id` | sub |

### Office web app — Organization

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-156 | Company | `/admin/organization/company` | menu |
| SCR-157 | Branches | `/admin/organization/branches` | menu |
| SCR-158 | Business Units | `/admin/organization/business-units` | menu |
| SCR-159 | Departments | `/admin/organization/departments` | menu |
| SCR-160 | Designations | `/admin/organization/designations` | menu |
| SCR-161 | Employee Master | `/admin/organization/employees` | menu |
| SCR-162 | Warehouse Master | `/admin/organization/warehouses` | menu |

### Office web app — Reports

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-185 | Reports Center | `/reports/center` | menu |
| SCR-186 | Report | `/reports/view/:id` | sub |

### Office web app — Vehicle Management

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-087 | VMS Dashboard | `/vms` | menu |
| SCR-088 | Vehicles | `/vms/vehicles` | menu |
| SCR-089 | Driver Documents | `/vms/drivers` | menu |
| SCR-090 | Document Expiry | `/vms/document-expiry` | menu |
| SCR-091 | VMS Reports | `/vms/reports` | menu |
| SCR-092 | Compliance Rules | `/vms/settings` | menu |
| SCR-093 | New Vehicle | `/vms/vehicles/create` | sub |
| SCR-094 | Edit Vehicle | `/vms/vehicles/:id/edit` | sub |
| SCR-095 | Vehicle Documents | `/vms/vehicles/:id/documents` | sub |
| SCR-096 | Vehicle Details | `/vms/vehicles/:id` | sub |
| SCR-097 | Driver Documents | `/vms/drivers/:id/documents` | sub |

### Public (no sign-in) — Public pages

| Screen ID | Screen | Route | Type |
|---|---|---|---|
| SCR-001 | Dashboard | `/dashboard` | menu |
| SCR-187 | My Profile | `/profile` | menu |
| SCR-188 | Notification Center | `/notifications` | menu |
| SCR-189 | Change Password | `/account/change-password` | menu |
| SCR-190 | Preferences | `/settings` | menu |
| SCR-191 | Sign Out | `/logout` | sub |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |