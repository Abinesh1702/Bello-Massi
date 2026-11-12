---
title: "Functional Requirements — Driver Application"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-DRV · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Driver Application |
| Document ID | BM-FRD-DRV |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Driver Application |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Driver Application module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Driver Application module (/driver/*).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SYS-002** (Software Requirements Specification (SRS))
- **BM-SYS-003** (Functional Requirements Document (Consolidated))
- **BM-SYS-008** (Requirement Traceability Matrix)
- **BM-QA-011** (Functional Test Cases)

## Contents

- 1. Module overview
- 2. Purpose
- 3. Business objectives
- 4. User roles
- 5. Access permissions
- 6. Screens
- 7. Functional requirements
- 8. Input fields
- 9. Validation rules
- 10. Business rules
- 11. Workflow
- 12. Status lifecycle
- 13. Approval rules
- 14. Notifications
- 15. Error scenarios
- 16. Exception handling
- 17. Data dependencies
- 18. Reports
- 19. Audit requirements
- 20. Acceptance criteria
- 21. Current implementation status
- 22. Future enhancement requirements

## 1. Module overview

| Item | Value |
|---|---|
| Module code | `DRV` |
| Module name | Driver Application |
| Current implementation status | **Implemented with limitations (web app; GPS simulated)** |
| Main routes | `/driver/*` |
| Services / components | `deliveryService, trackingService` |
| LocalStorage keys (prototype) | `bellomassi_deliveries, bellomassi_driver_tracking` |


## 2. Purpose

Mobile-first driver workflow: today / tomorrow plan, start, reach location, OTP, POD, complete or fail.

## 3. Business objectives

Drivers complete each stop quickly, in order, with verifiable proof.

Related business requirements: BR-007, BR-008, BR-009, BR-017, BR-027.

## 4. User roles

- Driver

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `driver.app`, `documents.upload`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Today | `/driver/dashboard` | `driver.app` |
| My Deliveries | `/driver/deliveries` | `driver.app` |
| Route | `/driver/route` | `driver.app` |
| Completed | `/driver/completed` | `driver.app` |
| My Delivery Notes | `/driver/delivery-notes` | `driver.app` |
| Driver Profile | `/driver/profile` | `driver.app` |
| My Documents | `/driver/documents` | `driver.app` |
| Document | `/driver/documents/:id` | `driver.app` |
| Confirm Delivery | `/driver/deliveries/:id/confirm` | `driver.app` |
| Delivery | `/driver/deliveries/:id` | `driver.app` |
| Delivery Note | `/driver/delivery-notes/:id` | `driver.app` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-DRV-001 | P1 | Drivers shall see today's and tomorrow's stops published by the Dispatcher, the next stop and their performance. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-DRV-002 | P1 | Drivers shall start a stop only when the dispatch is confirmed, the date has arrived, no other stop is active and it is next in sequence. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-DRV-003 | P1 | Drivers shall record arrival at the customer, which issues the delivery OTP. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-DRV-004 | P1 | Drivers shall complete a stop with delivered / damaged quantities, receiver name, optional signature and photo, and the customer's OTP. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-DRV-005 | P1 | Drivers shall report a failed delivery with a reason from the list and remarks. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-DRV-006 | P2 | Drivers shall view the route of their stops on a map. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-DRV-007 | P2 | Drivers shall call or message the customer contact from the stop screen. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-DRV-008 | P2 | Drivers shall view and upload their own documents (licence, medical). | Driver | VERIFIED | Implemented and working (prototype) |
| FR-DRV-009 | P1 | VIP stops shall show a VIP badge; the driver follows the sequence published by the Dispatcher. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-DRV-010 | P1 | The production driver app shall be a React Native app with background GPS (10–15 s updates) during active deliveries only. | Driver | PROPOSED | Planned (production) |
| FR-DRV-011 | P2 | The production driver app shall queue status updates when offline and sync when connectivity returns. | Driver | PROPOSED | Planned (production) |

## 8. Input fields

Delivered quantity · damaged quantity · rejected quantity · shortfall reason · received by · signature · photo · customer remarks · OTP · failure reason + remarks

## 9. Validation rules

- **RULE-026** — A stop can start only if the dispatch is CONFIRMED / IN_TRANSIT, the date has arrived, it is next in sequence and no other stop is out. _(enforced by `deliveryService.startDelivery`; message: Blocker text.)_
- **RULE-029** — Everything delivered → DELIVERED; any shortfall → PARTIALLY_DELIVERED. _(enforced by `deliveryService.confirmDelivery`; message: Status.)_

## 10. Business rules

- FR-DRV-001: expected behaviour — Today plan listed; tomorrow plan visible with Start disabled.
- FR-DRV-002: expected behaviour — Blocker message shown otherwise; status OUT_FOR_DELIVERY when allowed.
- FR-DRV-003: expected behaviour — arrivedAt recorded; OTP issued (simulated).
- FR-DRV-004: expected behaviour — DELIVERED or PARTIALLY_DELIVERED; delivery note generated.
- FR-DRV-005: expected behaviour — FAILED; Dispatcher and customer notified.
- FR-DRV-006: expected behaviour — DEMO route map displayed (simulated).
- FR-DRV-007: expected behaviour — Phone / WhatsApp links open the device app.
- FR-DRV-008: expected behaviour — Upload goes to the review queue.
- FR-DRV-009: expected behaviour — VIP badge displayed.

## 11. Workflow

See **BM-WF-10** (WF-10 — Driver Delivery Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Delivery DISPATCHED → OUT_FOR_DELIVERY → DELIVERED / PARTIALLY_DELIVERED / FAILED. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Customer: out for delivery, arrived, delivered, not completed; Dispatcher: in transit, failed; automation DELIVERY_STARTED / COMPLETED / FAILED.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-DRV-N01 | Start out of sequence | Disabled: "Stop 1 (…) comes first in the sequence." |
| TC-DRV-N02 | Start before confirmation | "Waiting for the Dispatcher to confirm the dispatch." |
| TC-DRV-N03 | Start tomorrow's stop | "Planned for … — Start is available on that day." |
| TC-DRV-N04 | Access another driver's delivery | Access denied |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_deliveries, bellomassi_driver_tracking`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Driver performance on Today screen; delivery reports for office.

## 19. Audit requirements

Dispatch timeline and delivery record (timestamps, user). Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-DRV-001 | Today plan listed; tomorrow plan visible with Start disabled. | TC-DRV-001 |
| FR-DRV-002 | Blocker message shown otherwise; status OUT_FOR_DELIVERY when allowed. | TC-DRV-002, TC-DRV-N01, TC-DRV-N02, TC-DRV-N03 |
| FR-DRV-003 | arrivedAt recorded; OTP issued (simulated). | TC-DRV-003 |
| FR-DRV-004 | DELIVERED or PARTIALLY_DELIVERED; delivery note generated. | TC-DRV-004 |
| FR-DRV-005 | FAILED; Dispatcher and customer notified. | TC-DRV-005 |
| FR-DRV-006 | DEMO route map displayed (simulated). | TC-DRV-006 |
| FR-DRV-007 | Phone / WhatsApp links open the device app. | TC-DRV-007 |
| FR-DRV-008 | Upload goes to the review queue. | TC-DRV-008 |
| FR-DRV-009 | VIP badge displayed. | TC-DRV-009 |
| FR-DRV-010 | Location continues when the phone is locked; last update time shown. | TC-DRV-010 |
| FR-DRV-011 | No data loss in poor coverage. | TC-DRV-011 |

## 21. Current implementation status

**Implemented with limitations (web app; GPS simulated).** Labels: VERIFIED 9, PROPOSED 2. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

React Native app, background GPS, offline queue, barcode scan of items, turn-by-turn navigation deep links.

- FR-DRV-010 (PROPOSED): The production driver app shall be a React Native app with background GPS (10–15 s updates) during active deliveries only.
- FR-DRV-011 (PROPOSED): The production driver app shall queue status updates when offline and sync when connectivity returns.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |