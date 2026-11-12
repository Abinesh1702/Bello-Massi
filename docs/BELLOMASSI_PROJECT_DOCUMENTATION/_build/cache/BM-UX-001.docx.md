---
title: "UI/UX Design Document"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-UX-001 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | UI/UX Design Document |
| Document ID | BM-UX-001 |
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

Describe the user experience of the Bellomassi platform — users, principles, layouts and key journeys — as built in the prototype and as proposed for production.

## Scope

Office web app, Driver app and Customer app. Current UI is VERIFIED from the prototype; production changes are PROPOSED.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- Project doc: UI design system and dashboard filter
- src/styles/index.css, src/components/common, src/components/layout
- **BM-UX-002** (Design System and Style Guide)
- **BM-UX-003** (Information Architecture, Navigation and Sitemap)
- **BM-UX-004** (Screen Inventory)
- **BM-UX-005** (Screen Specifications)
- **BM-UX-006** (Prototype Screenshot Gallery)
- **BM-UX-007** (Mobile UX — Driver App and Customer App)
- **BM-UX-008** (Accessibility and Responsive Design Guidelines)
- **BM-UX-009** (UI Content, Messages and Status Display Standards)

## 1. Users and their main jobs

| User | Device | Main jobs | Landing screen |
|---|---|---|---|
| Salesman | Laptop / tablet | Capture and submit orders, follow up returns | Dashboard |
| Sales Manager | Laptop | Approve, return or reject orders; watch credit | Dashboard → Order Approval |
| Customer Service | Desktop | Verify and consolidate approved orders | Dashboard → Consolidation |
| Dispatcher | Desktop (large screen) | Plan by zone, assign driver and vehicle, confirm dispatch, monitor, review exceptions | Dashboard |
| Driver | Phone | See today's stops, navigate, arrive, OTP, POD, delivery note | Driver Today |
| Customer | Phone | Order from catalogue, track, view delivery notes and invoices | Customer Home |
| Finance | Desktop | Invoices, credit position | Dashboard |
| Admin / Super Admin | Desktop | Users, roles, settings, master data, audit | Dashboard |
| Warehouse / Inventory / QA | Desktop / tablet | Stock, scrap, inspections, documents | Role dashboard |

## 2. Design principles (VERIFIED in the prototype)

1. **One record, one status** — every order and delivery shows its status badge and timeline.
2. **Role-first** — the menu, dashboard and landing page change by role; users see only what they can act on.
3. **Queues over searches** — work screens are queues (pending approval, ready for dispatch, exceptions).
4. **Explain the blocker** — checks (credit, stock, documents) are shown before the action, with the reason.
5. **Honest prototype** — demo markers (DEMO PROTOTYPE, DEMO GPS, demo mode for email / WhatsApp) show what is simulated.
6. **Mobile for the field** — driver and customer apps are thumb-friendly single-column layouts with bottom navigation.

## 3. Layouts

| Layout | Structure | Screenshot |
|---|---|---|
| Office (AppLayout) | Collapsible grouped sidebar, header with breadcrumbs, global search, theme, notifications, profile | UX-DASH-SA |
| Driver (DriverLayout) | Navy header, cards, bottom navigation (Today, Deliveries, Route, Completed, Profile) | UX-DRV-DASH |
| Customer (CustomerLayout) | Header, cards, bottom navigation (Home, Catalog, Cart, Orders, Account) | UX-CUS-DASH |
| Sign-in | Split screen (office) / mobile card (driver, customer) with demo account selector | UX-LOGIN |

![Office dashboard — Super Admin (prototype screenshot)](screenshots/UX-DASH-SA.png){width=16cm}

## 4. Key journeys

| Journey | Screens (in order) | Spec |
|---|---|---|
| Create and submit order | Create Order → Preview → Submit → My Orders | UX-ORDER-CREATE, UX-MY-ORDERS |
| Approve order | Order Approval queue → Approval detail (6 checks) → Approve / Return / Reject | UX-APPROVAL, UX-APPROVAL-DETAIL |
| Consolidate | Consolidation queue → verify → Ready for dispatch | UX-CONSOLIDATION |
| Plan and dispatch | Ready Orders → Planning (zones) → Create dispatch → Confirm | UX-READY, UX-PLANNING, UX-DISPATCH-CREATE |
| Deliver | Driver Today → Delivery → Navigate → Arrive → OTP → POD → Delivery note | UX-DRV-DELIVERY, UX-DRV-ROUTE |
| Track | Delivery Tracking / Live Tracking; customer tracking | UX-TRACKING, UX-LIVE |
| Review exception | Delivery detail → return stock / re-queue | UX-DELIVERY-REVIEW |
| Customer order | Catalog → Cart → Submit → Orders → Track | UX-CUS-CATALOG, UX-CUS-CART |

All screen specifications are in **BM-UX-005** (Screen Specifications); the full screen list in **BM-UX-004** (Screen Inventory).

## 5. Known UX gaps

| ID | Gap | Label |
|---|---|---|
| UXG-01 | Zone planning is a list / filter view, not the drag-and-drop board described in the SOW | PARTIAL — PENDING CONFIRMATION |
| UXG-02 | Live tracking uses DEMO GPS, not real device positions | PROTOTYPE |
| UXG-03 | Driver app is a responsive web app, not a native React Native app (no background GPS, push notifications or offline mode) | NOT IMPLEMENTED (native) |
| UXG-04 | Address and phone formats are India-style (pincode, +91) while the company profile is Dubai / AED | PENDING CONFIRMATION |
| UXG-05 | No usability testing with real users has been carried out | NOT VERIFIED |
| UXG-06 | Arabic / RTL support not present | NOT IMPLEMENTED |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |