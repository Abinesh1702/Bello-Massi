---
title: "Gap Analysis — Scope of Work, Prototype and Documentation"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-DOC-003 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Gap Analysis — Scope of Work, Prototype and Documentation |
| Document ID | BM-DOC-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Document Control |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Compare what the client Scope of Work asks for, what the prototype actually implements, and what documentation existed, so that production scope, client decisions and missing documents are explicit.

## Scope

Functional scope (SOW vs source code), technical scope (prototype vs production), documentation scope (existing vs required by the A–Z documentation brief).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- Scope of Work presentation, October 2026
- Driver App GPS Implementation Guide
- Source code bellomassi-premium-ui (data version 8)
- **BM-DOC-001** (Existing Documentation Review and Inventory)
- **BM-DOC-002** (Document Inventory)
- **BM-OVW-015** (Project Status and Implementation Summary)
- **BM-BRD-001** (Business Requirements Document (BRD))
- **BM-SOW-001** (Scope of Work)
- **BM-HND-011** (Limitations Document — Prototype vs Production)
- **BM-HND-012** (Pending Requirements Document)

## Contents

- 1. Method
- 2. Functional gaps — SOW requirements not (fully) met by the prototype
- 3. Prototype features beyond the SOW (need scope confirmation)
- 4. Order status model — SOW vs code
- 5. Technical gaps — prototype vs production
- 6. Documentation gaps (before this package)
- 7. Information needed from the client

## 1. Method

1. Every SOW slide and GPS-guide section was turned into business requirements (BR-001 … BR-033, see **BM-BRD-001** (Business Requirements Document (BRD))).
2. The source code was analysed module by module (services, pages, routes, permissions, LocalStorage keys) and each
   functional requirement was labelled VERIFIED, PROTOTYPE, PROPOSED, PENDING CONFIRMATION, NOT IMPLEMENTED or NOT VERIFIED
   (179 functional requirements, see **BM-SYS-008** (Requirement Traceability Matrix)).
3. Existing documents were inventoried (**BM-DOC-001** (Existing Documentation Review and Inventory)) and compared with the documents required by the brief
   (**BM-DOC-002** (Document Inventory)).

## 2. Functional gaps — SOW requirements not (fully) met by the prototype

| # | SOW requirement | Prototype behaviour | Gap type | Requirement | Recommended action |
|---|---|---|---|---|---|
| G-01 | Sales Manager may set the approved value and quantity (slide 8) | Approves the order as submitted; changes go through "Return for correction" | Partially implemented | FR-APR-007 | Confirm with client; if required, add approved quantity per line with audit |
| G-02 | Finance notified on approval, flagged when credit exceeded (slides 8, 16) | Not notified | Not implemented | FR-APR-008 | Add Finance notification rule in backend phase |
| G-03 | Dispatcher drags orders into zone columns (slide 10) | Zone selected in the dispatch form; drag & drop only for stop sequence | Partially implemented | FR-DSP-008 | Build zone board in production web app |
| G-04 | Suggested fastest route with live traffic (slide 12; GPS guide §5) | Sequence by priority and pincode; simulated ETA | Simulated | FR-DSP-009 | Google Routes API integration |
| G-05 | Turn-by-turn navigation from a stop (slide 12) | Map link / demo route map | Simulated | FR-DRV-006 | Deep link to Google Maps / Waze in the mobile app |
| G-06 | OTP sent to the customer by SMS / WhatsApp (slides 13, 16) | OTP shown in the customer app; no message sent | Simulated | FR-OTP-005 | Select SMS / WhatsApp provider; hash OTPs server-side |
| G-07 | Delivery note sent instantly to the customer (slide 13) | Generated and visible in the app; not sent | Partially implemented | FR-DN-003 | Send via messaging provider / email |
| G-08 | Drivers App for iOS and Android (slide 4; GPS guide) | Responsive web app `/driver/*` | Prototype only | FR-DRV-010 | React Native app with background GPS |
| G-09 | Live order monitor (slide 15) | Dashboards and lists refresh on navigation; no server push | Partially implemented | FR-DASH-006 | WebSocket-based monitor |
| G-10 | Items updated from SAP in stage 2 (slides 4, 15) | Manual product master | Planned | FR-PRD-004 | SAP integration project (stage 2) |
| G-11 | Notification rules configurable "which events notify which roles, by which channel" (slide 15) | Automation rules for email / WhatsApp; in-app notifications fixed in code | Partially implemented | FR-AUTO-001 | Make in-app notification targets configurable |
| G-12 | Order channel (call / email / WhatsApp) captured (slide 7) | Not captured for office orders | Partially implemented | FR-ORD-011 | Add source channel field |
| G-13 | Real authentication (GPS guide §2: hashed passwords, tokens) | Browser demo hash, client-side session | Prototype only | FR-AUTH-012 | Django authentication with JWT |
| G-14 | Admin sees all vehicles, customer only own vehicle, live (GPS guide §9) | Implemented with DEMO GPS | Simulated | FR-TRK-003 | Django Channels + WSS |

## 3. Prototype features beyond the SOW (need scope confirmation)

| # | Feature | Where in code | Recommendation |
|---|---|---|---|
| X-01 | Customer self-service app (catalog, cart, ordering, tracking, invoices) | `/customer/*`, `customerAppService` | Confirm — high value but adds scope, security and support load |
| X-02 | Invoicing with templates and numbering | `/invoices/*` | SOW says invoicing stays outside; confirm or retire |
| X-03 | Inventory management, stock deduction at dispatch, low stock | `/inventory/*` | Confirm; may overlap with SAP inventory |
| X-04 | Scrap management with approval | `/inventory/scrap/*` | Confirm (overlaps SAP) |
| X-05 | Vehicle Management System and document compliance | `/vms/*` | Confirm — supports safe driver assignment |
| X-06 | Document management and OCR | `/documents/*` | Confirm; production OCR provider required |
| X-07 | Email and WhatsApp (OpenWA) communication, automation | `/communication/*` | Confirm provider; OpenWA is an unofficial WhatsApp client (policy risk) |
| X-08 | Call history | `/communication/calls/*` | Confirm |
| X-09 | Reports Center (118 reports) | `/reports/*` | Confirm the reports needed for go-live |
| X-10 | AI assistant, Jarvis, forecasting, replenishment, supplier portal | `/ai/*` | Treat as phase 5 enhancement unless confirmed |
| X-11 | Extra roles: Super Admin, Warehouse Manager, Inventory Executive, QA Manager, Customer, Supplier | `config/roles.js` | Confirm role list |

## 4. Order status model — SOW vs code

| SOW status (slide 17) | Code status(es) | Note |
|---|---|---|
| Draft | DRAFT | Same |
| Pending approval | SUBMITTED (approval PENDING) | Label differs |
| Returned for review | RETURNED | Same meaning |
| Rejected | REJECTED | Same |
| Approved | APPROVED | Same |
| With Customer Service | APPROVED (consolidation PENDING) → CONSOLIDATED | Code adds an explicit consolidated step |
| Ready for dispatch | READY_FOR_DISPATCH | Same |
| Planned in zone | READY_FOR_DISPATCH with `dispatchId` (dispatch PLANNED / ASSIGNED) | No separate order status |
| — | DISPATCHED | Code adds loading confirmation |
| Out for delivery | OUT_FOR_DELIVERY | Same |
| Delivered | DELIVERED, PARTIALLY_DELIVERED | Code adds partial delivery |
| Delivery problem (proposed) | DELIVERY_FAILED, RETURNED_TO_HUB | Implemented in code — confirm naming |

## 5. Technical gaps — prototype vs production

| Area | Prototype (VERIFIED in code) | Production need (PROPOSED) |
|---|---|---|
| Data | Browser LocalStorage, per-browser data, ≈1 MB seed, 74 keys | PostgreSQL shared database, backups, migrations |
| Backend | None (services run in the browser) | Django REST Framework API, Celery workers, Channels |
| Authentication | Demo users, FNV-1a hash, client session | Server auth, Argon2 hashes, JWT, MFA for admins |
| Authorisation | Service-layer `can()` checks in the browser | Server-side permission classes and object-level scope |
| Files | Images / documents as data URLs in browser storage | Object storage (S3-compatible), virus scan, signed URLs |
| GPS | DEMO GPS | Mobile GPS (background), WebSocket push |
| Messaging | Demo email / mock WhatsApp | SMTP provider, SMS / WhatsApp Business provider |
| OCR | MOCK provider | Server-side OCR engine |
| Maps | Static demo map | Google Maps Platform + Routes API |
| Mobile | Responsive web | React Native driver (and optional customer) apps |
| Deployment | Static Vite build | Containers, CI/CD, monitoring, environments |

## 6. Documentation gaps (before this package)

| Required document group | Existed? | Action taken |
|---|---|---|
| Project overview, vision, stakeholders | Partly (SOW slides 1–5, 18) | Created folder 01 |
| BRD, SOW document, BR traceability | SOW slides only | Created BRD, SOW document, BR traceability |
| SRD, SRS, FRD, NFR, business rules, RTM, change log | No | Created folder 03 |
| Module FRDs | No (workflow chapter 05 covers modules) | Created 35 module FRDs (folder 04) |
| Workflows | Yes (docs/workflow, current) | Preserved; created 24 workflow specifications (folder 06) |
| HLD / LLD / architecture diagrams | No (README architecture paragraph) | Created folder 07 |
| Data model (prototype) and production DB design | Partly (storage keys in docs) | Created folder 08 |
| API documentation | Gateway contract only | Created folder 09 (proposed API + OpenAPI) |
| Security documentation | Partly (RBAC doc) | Created folder 10 |
| Infrastructure / DevOps | No | Created folder 11 |
| UI/UX | Yes (design system) | Extended in folder 12 with screen inventory and real screenshots |
| QA documents and test cases | No (internal Playwright suites only) | Created folder 13 |
| Deployment and release | README run commands | Created folder 14 |
| User manuals | Workflow screen guide | Created folder 15 with real screenshots |
| PM, risk, change, handover, roadmap | No | Created folders 17–20 |
| Index and document control | No | Created folders 23 and 25 |

## 7. Information needed from the client

See **BM-HND-012** (Pending Requirements Document) (Pending Requirements) for the full list. The most important decisions:

1. Production scope of the prototype extensions in section 3.
2. Operating country rules (UAE vs India): address, tax IDs, currency, VAT / GST, phone formats.
3. SMS / WhatsApp provider for OTP and delivery notes; acceptance of OpenWA's policy risk.
4. Hosting choice (cloud provider or on-premises) and data residency.
5. SAP integration scope, interfaces and timing (stage 2).
6. Volumes for capacity planning (orders per day, drivers, customers, concurrent users).
7. Whether the Sales Manager edits approved quantities (G-01) and the cancellation rule for submitted orders.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |