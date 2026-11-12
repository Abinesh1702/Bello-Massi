---
title: "Functional Requirements — Delivery Tracking"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-TRK · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Delivery Tracking |
| Document ID | BM-FRD-TRK |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Delivery Tracking |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Delivery Tracking module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Delivery Tracking module (/dispatch/delivery-tracking, /dispatch/live-tracking, /customer/tracking/:id).

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
| Module code | `TRK` |
| Module name | Delivery Tracking |
| Current implementation status | **Simulated (DEMO GPS)** |
| Main routes | `/dispatch/delivery-tracking, /dispatch/live-tracking, /customer/tracking/:id` |
| Services / components | `trackingService, utils/demoGeo` |
| LocalStorage keys (prototype) | `bellomassi_driver_tracking` |


## 2. Purpose

Delivery tracking lists, live fleet map and customer tracking with DEMO GPS.

## 3. Business objectives

Office and customers know where deliveries are without phone calls.

Related business requirements: BR-011, BR-016.

## 4. User roles

- Administrator
- Customer Service
- Customer (portal / app)
- Dispatcher
- Sales Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `deliveries.view`, `tracking.fleet`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Delivery Tracking | `/dispatch/delivery-tracking` | `dispatch.tracking` |
| Delivery History | `/dispatch/delivery-history` | `dispatch.history` |
| Live Tracking (Demo GPS) | `/dispatch/live-tracking` | `tracking.fleet` |
| Track Delivery | `/customer/tracking/:id` | `customer.app` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-TRK-001 | P1 | Office users shall track every stop on active dispatches with status and times. | Administrator, Sales Manager, Customer Service, Dispatcher | VERIFIED | Implemented and working (prototype) |
| FR-TRK-002 | P2 | Administrators and Dispatchers shall see vehicle positions on a fleet map. | Administrator, Dispatcher | PROTOTYPE | Simulated in prototype |
| FR-TRK-003 | P1 | Production tracking shall push real GPS positions to the admin map (all vehicles) and the customer map (own order only) over WSS. | Administrator, Dispatcher, Customer (portal / app) | PROPOSED | Planned (production) |

## 8. Input fields

Filters (dispatch, driver, status)

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-TRK-001: expected behaviour — List shows live statuses.

## 11. Workflow

See **BM-WF-12** (WF-12 — Customer Tracking Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Tracking session active / stopped. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_driver_tracking`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Delivery tracking list; delivery history.

## 19. Audit requirements

Tracking sessions in `bellomassi_driver_tracking`. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-TRK-001 | List shows live statuses. | TC-TRK-001 |
| FR-TRK-002 | DEMO GPS positions move along a straight-line route. | TC-TRK-002 |
| FR-TRK-003 | Updates appear without refresh; customers never see the fleet. | TC-TRK-003 |

## 21. Current implementation status

**Simulated (DEMO GPS).** Labels: VERIFIED 1, PROTOTYPE 1, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Real GPS via mobile app, WebSocket push, geofenced arrival detection, ETA from Routes API.

- FR-TRK-003 (PROPOSED): Production tracking shall push real GPS positions to the admin map (all vehicles) and the customer map (own order only) over WSS.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |