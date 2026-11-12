---
title: "Functional Requirements — Dashboards and Analytics"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-DASH · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Dashboards and Analytics |
| Document ID | BM-FRD-DASH |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Dashboards and Analytics |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Dashboards and Analytics module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Dashboards and Analytics module (/dashboard, /driver/dashboard, /customer/dashboard).

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
| Module code | `DASH` |
| Module name | Dashboards and Analytics |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/dashboard, /driver/dashboard, /customer/dashboard` |
| Services / components | `useDashboardData, useOpsSnapshot, utils/dashboardFilter` |
| LocalStorage keys (prototype) | `(reads all collections)` |


## 2. Purpose

Role dashboards with KPIs, queues, charts and the universal period filter with comparison.

## 3. Business objectives

Every user starts the day from one screen with their numbers and queues.

Related business requirements: BR-011, BR-015, BR-028.

## 4. User roles

- Administrator
- All signed-in users
- Super Admin

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `dashboard.view`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Dashboard | `/dashboard` | `—` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-DASH-001 | P1 | Each role shall see a dashboard with the KPIs and work queues for that role. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-DASH-002 | P1 | Every dashboard shall offer period presets (Today … All Time), custom range and specific periods including the April–March financial year. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-DASH-003 | P2 | Dashboards shall optionally compare the selected period with the previous equivalent period. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-DASH-004 | P2 | Current positions (stock, credit balance, fleet) shall be labelled Current and not filtered by period. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-DASH-005 | P2 | KPI cards and queue rows shall drill down into the filtered module list. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-DASH-006 | P2 | Management shall have a live order monitor with real-time status updates (server push). | Administrator, Super Admin | PROPOSED | Planned (production) |

## 8. Input fields

Period preset · custom start / end date · specific period (day, week, month, quarter, half-year, year, financial year) · compare toggle

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-DASH-001: expected behaviour — Dashboard component matches the role (Admin, Salesman, Sales Manager, CS, Dispatcher, Finance, Warehouse, QA, Supplier).
- FR-DASH-002: expected behaviour — KPIs, tables and charts follow the selected period.
- FR-DASH-003: expected behaviour — KPI shows % change, difference and previous value.
- FR-DASH-004: expected behaviour — "Current" label shown on those KPIs.
- FR-DASH-005: expected behaviour — Clicking "Pending approval" opens the approval queue.

## 11. Workflow

See **BM-WF-24** (WF-24 — Reporting Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Not applicable. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-DASH-N01 | Custom range start after end | Message; range not applied |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `(reads all collections)`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Dashboards are themselves the summary reports; drill-down to lists.

## 19. Audit requirements

Not audited (read-only). Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-DASH-001 | Dashboard component matches the role (Admin, Salesman, Sales Manager, CS, Dispatcher, Finance, Warehouse, QA, Supplier). | TC-DASH-001 |
| FR-DASH-002 | KPIs, tables and charts follow the selected period. | TC-DASH-002, TC-DASH-N01 |
| FR-DASH-003 | KPI shows % change, difference and previous value. | TC-DASH-003 |
| FR-DASH-004 | "Current" label shown on those KPIs. | TC-DASH-004 |
| FR-DASH-005 | Clicking "Pending approval" opens the approval queue. | TC-DASH-005 |
| FR-DASH-006 | Status changes appear without page refresh. | TC-DASH-006 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 5, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Server-side aggregation, live monitor via WebSocket, saved views, scheduled email digests.

- FR-DASH-006 (PROPOSED): Management shall have a live order monitor with real-time status updates (server push).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |