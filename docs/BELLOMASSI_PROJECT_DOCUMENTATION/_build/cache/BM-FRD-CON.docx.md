---
title: "Functional Requirements — Order Consolidation (Customer Service)"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-CON · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Order Consolidation (Customer Service) |
| Document ID | BM-FRD-CON |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Order Consolidation (Customer Service) |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Order Consolidation (Customer Service) module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Order Consolidation (Customer Service) module (/orders/consolidation).

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
| Module code | `CON` |
| Module name | Order Consolidation (Customer Service) |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/orders/consolidation` |
| Services / components | `consolidationService` |
| LocalStorage keys (prototype) | `bellomassi_consolidations, bellomassi_orders` |


## 2. Purpose

Verify approved orders per salesman, consolidate and release to dispatch.

## 3. Business objectives

Customer Service checks each approved order against the warehouse before release.

Related business requirements: BR-005.

## 4. User roles

- Customer Service

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `orders.consolidation.view`, `orders.consolidate`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Order Consolidation | `/orders/consolidation` | `orders.consolidation.view` |
| Consolidate Order | `/orders/consolidation/:id` | `orders.consolidation.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-CON-001 | P1 | Customer Service shall see approved orders grouped per salesman, oldest approval first. | Customer Service | VERIFIED | Implemented and working (prototype) |
| FR-CON-002 | P1 | Customer Service shall confirm five verification checks and review hub stock before consolidating. | Customer Service | VERIFIED | Implemented and working (prototype) |
| FR-CON-003 | P1 | Customer Service shall release consolidated orders to dispatch. | Customer Service | VERIFIED | Implemented and working (prototype) |
| FR-CON-004 | P2 | Only approved orders shall be consolidated and only once. | Customer Service | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Five verification checks · consolidation notes

## 9. Validation rules

- **RULE-016** — Only approved orders can be consolidated; all five checks must be confirmed. _(enforced by `consolidationService`; message: "Complete the verification checklist first.")_
- **RULE-017** — Only consolidated orders can be marked ready for dispatch. _(enforced by `consolidationService.markReadyForDispatch`; message: Message.)_

## 10. Business rules

- FR-CON-001: expected behaviour — Queue by salesman displayed.
- FR-CON-002: expected behaviour — Status CONSOLIDATED; Dispatcher notified.
- FR-CON-003: expected behaviour — Status READY_FOR_DISPATCH; Dispatcher and salesman notified.
- FR-CON-004: expected behaviour — "Only approved orders can be consolidated."

## 11. Workflow

See **BM-WF-05** (WF-05 — Customer Service Workflow), **BM-WF-07** (WF-07 — Order Consolidation Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

APPROVED (consolidation PENDING) → CONSOLIDATED (COMPLETED) → READY_FOR_DISPATCH. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

- FR-CON-001: Customer Service shall see approved orders grouped per salesman, oldest approval first.
- FR-CON-002: Customer Service shall confirm five verification checks and review hub stock before consolidating.
- FR-CON-004: Only approved orders shall be consolidated and only once.

## 14. Notifications

Dispatcher on consolidation and release; salesman on release; automation ORDER_READY.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-CON-N01 | Consolidate with missing check | "Confirm every check before consolidating (1 left)." |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_consolidations, bellomassi_orders`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Consolidation queue by salesman (dashboard).

## 19. Audit requirements

Consolidation record + order timeline. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-CON-001 | Queue by salesman displayed. | TC-CON-001 |
| FR-CON-002 | Status CONSOLIDATED; Dispatcher notified. | TC-CON-002, TC-CON-N01 |
| FR-CON-003 | Status READY_FOR_DISPATCH; Dispatcher and salesman notified. | TC-CON-003 |
| FR-CON-004 | "Only approved orders can be consolidated." | TC-CON-004 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 4. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Batch consolidation per salesman, picking list generation.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |