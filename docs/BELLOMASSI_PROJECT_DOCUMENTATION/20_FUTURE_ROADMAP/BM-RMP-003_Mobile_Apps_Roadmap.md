# React Native Driver App and Customer App Roadmap

## Document control

| Field | Value |
|---|---|
| Document title | React Native Driver App and Customer App Roadmap |
| Document ID | BM-RMP-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Future Roadmap |
| Related module(s) | All modules |
| Document owner | Mobile Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Plan the native mobile applications.

## Scope

PROPOSED. Customer app is subject to decision X-01 (PENDING CONFIRMATION).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-RMP-001 — Prototype-to-Production Migration Roadmap (Master)](BM-RMP-001_Prototype_to_Production_Roadmap.md)
- [BM-UX-007 — Mobile UX — Driver App and Customer App](../12_UI_UX_AND_DESIGN/BM-UX-007_Mobile_UX_Driver_and_Customer.md)
- [BM-MAN-001 — Driver App User Manual](../15_USER_MANUALS/BM-MAN-001_Driver_App_User_Manual.md)
- [BM-MAN-002 — Customer App User Manual](../15_USER_MANUALS/BM-MAN-002_Customer_App_User_Manual.md)

## 1. Driver app

| Step | Scope |
|---|---|
| 1 | UX design from current web driver screens ([BM-UX-007 — Mobile UX — Driver App and Customer App](../12_UI_UX_AND_DESIGN/BM-UX-007_Mobile_UX_Driver_and_Customer.md)) |
| 2 | Auth, today, deliveries, stop detail, route |
| 3 | Start / arrive / OTP / POD (camera, signature) / fail flows against API |
| 4 | Background GPS with foreground service; WebSocket / HTTPS updates every 10–15 s while active |
| 5 | Offline queue and sync; push notifications |
| 6 | Device testing matrix; pilot; store release |

## 2. Customer app (if confirmed)

Catalog, cart, order, tracking with OTP display, delivery notes, invoices (if in scope), push notifications. Option:
keep a responsive web customer portal instead of a native app to reduce cost.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |