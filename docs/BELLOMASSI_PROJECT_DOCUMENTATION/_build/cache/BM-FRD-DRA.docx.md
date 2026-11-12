---
title: "Functional Requirements — Driver and Vehicle Assignment"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-DRA · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Driver and Vehicle Assignment |
| Document ID | BM-FRD-DRA |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Driver and Vehicle Assignment |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Driver and Vehicle Assignment module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Driver and Vehicle Assignment module (/dispatch/assignments, /dispatch/drivers, /dispatch/vehicles).

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
| Module code | `DRA` |
| Module name | Driver and Vehicle Assignment |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/dispatch/assignments, /dispatch/drivers, /dispatch/vehicles` |
| Services / components | `dispatchService.assignDispatch, driverService, vehicleService` |
| LocalStorage keys (prototype) | `bellomassi_drivers, bellomassi_vehicles` |


## 2. Purpose

Assign compliant, available drivers and vehicles from the same hub with capacity checks.

## 3. Business objectives

Only available, compliant drivers and vehicles of the right hub and size are assigned.

Related business requirements: BR-006, BR-014, BR-021.

## 4. User roles

- Administrator
- Dispatcher
- Super Admin

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `dispatch.manage`, `fleet.view`, `fleet.manage`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Driver Assignment | `/dispatch/assignments` | `dispatch.manage` |
| Drivers | `/dispatch/drivers` | `fleet.view` |
| Vehicles | `/dispatch/vehicles` | `fleet.view` |
| New Driver | `/dispatch/drivers/create` | `fleet.manage` |
| Edit Driver | `/dispatch/drivers/:id/edit` | `fleet.manage` |
| Driver Details | `/dispatch/drivers/:id` | `fleet.view` |
| New Vehicle | `/dispatch/vehicles/create` | `fleet.manage` |
| Edit Vehicle | `/dispatch/vehicles/:id/edit` | `fleet.manage` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-DRA-001 | P1 | Dispatchers shall assign a driver and a vehicle to a planned dispatch. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DRA-002 | P1 | Drivers shall be refused when inactive, busy on another active dispatch, offline, from another hub, or with an expired or missing licence. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DRA-003 | P1 | Vehicles shall be refused when inactive, in maintenance, busy, from another hub, over capacity, or with expired required documents. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DRA-004 | P1 | Administrators shall maintain drivers (licence, hub, zone, vehicle, app login) and vehicles (number, type, capacity, hub, documents). | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Driver: code, name, mobile, employee number, licence number and expiry, hub, zone, vehicle, user login, status, availability · Vehicle: number, type, capacity + unit, hub, category, fuel, ownership, document dates, status

## 9. Validation rules

- **RULE-023** — Driver must be active, free, online, from the dispatch hub, with a valid licence and required documents. _(enforced by `driverAssignmentIssues`; message: Issue list.)_
- **RULE-024** — Vehicle must be active, not in maintenance, free, from the hub, within capacity and compliant. _(enforced by `vehicleAssignmentIssues`; message: Issue list.)_

## 10. Business rules

- FR-DRA-001: expected behaviour — Status ASSIGNED; driver notified.
- FR-DRA-002: expected behaviour — Specific refusal messages.
- FR-DRA-003: expected behaviour — "Load of N exceeds … capacity" etc.
- FR-DRA-004: expected behaviour — Records validated (Indian vehicle number format, unique licence).

## 11. Workflow

See **BM-WF-09** (WF-09 — Driver Assignment Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Driver availability Available / Assigned / On Delivery / Offline; vehicle Available / Assigned / In Transit / Maintenance / Inactive. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Driver: new dispatch assigned / removed.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-DRA-N01 | Driver with expired licence | "…driving licence expired on …" |
| TC-DRA-N02 | Vehicle over capacity | "Load of N exceeds … capacity" |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_drivers, bellomassi_vehicles`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Fleet category; driver performance.

## 19. Audit requirements

Dispatch timeline (assignment events). Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-DRA-001 | Status ASSIGNED; driver notified. | TC-DRA-001 |
| FR-DRA-002 | Specific refusal messages. | TC-DRA-002, TC-DRA-N01 |
| FR-DRA-003 | "Load of N exceeds … capacity" etc. | TC-DRA-003, TC-DRA-N02 |
| FR-DRA-004 | Records validated (Indian vehicle number format, unique licence). | TC-DRA-004 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 4. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Driver shift rosters, vehicle telematics, fatigue rules.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |