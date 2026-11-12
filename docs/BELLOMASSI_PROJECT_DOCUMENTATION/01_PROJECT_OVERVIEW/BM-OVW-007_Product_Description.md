# Product Description

## Document control

| Field | Value |
|---|---|
| Document title | Product Description |
| Document ID | BM-OVW-007 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Project Overview |
| Related module(s) | All modules |
| Document owner | Product Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Describe the product as it presents itself to users.

## Scope

Office web application, driver app, customer app, shared platform services.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-OVW-008 — Product Capability Overview](BM-OVW-008_Product_Capability_Overview.md)
- [BM-OVW-014 — Product Feature Catalogue](BM-OVW-014_Product_Feature_Catalogue.md)
- [BM-UX-008 — Accessibility and Responsive Design Guidelines](../12_UI_UX_AND_DESIGN/BM-UX-008_Accessibility_and_Responsive_Design.md)

## 1. Product components

| Component | Prototype (VERIFIED) | Production (PROPOSED) |
|---|---|---|
| Office web application (Order Taking App + Admin Panel) | React SPA, sidebar per role, 197 screens, role dashboards | Same React app connected to the REST API |
| Drivers App | Mobile-first web app at `/driver/*` (Today, deliveries, stop, confirm with OTP, route, notes, profile, documents) | React Native app (Android / iOS) with background GPS |
| Customer app | Mobile-first web app at `/customer/*` (home, catalog, cart, orders, tracking, notes, invoices, payments, profile) | Web or React Native — PENDING CONFIRMATION |
| Shared platform | Services in the browser: workflow rules, notifications, OTP, numbering, audit, LocalStorage | Django REST API, PostgreSQL, Celery, Channels, object storage, messaging providers |

## 2. Key product principles

- **One order record** with a timeline from draft to delivery.
- **Role-based workspaces**: each role sees only its menus, data scope and queues.
- **Rules in the business layer**: every action is validated by a service, not only the screen.
- **Idempotent actions**: an approval, confirmation, delivery or write-off cannot happen twice.
- **Honest simulation**: simulated features are labelled (DEMO GPS, Simulated OCR, Sent · demo).

## 3. Demo access — VERIFIED

13 demo accounts (e.g. `admin / Admin@123`, `salesman / Sales@123`, `driver / Driver@123`, `customer / Customer@123`).
Full list: [BM-MAN-003 — Office Web Application User Manual (All Office Roles)](../15_USER_MANUALS/BM-MAN-003_Office_Web_App_User_Manual.md).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |