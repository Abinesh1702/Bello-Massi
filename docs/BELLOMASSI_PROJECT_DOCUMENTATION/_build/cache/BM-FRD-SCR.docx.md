---
title: "Functional Requirements — Scrap Management"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-SCR · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Scrap Management |
| Document ID | BM-FRD-SCR |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Scrap Management |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Scrap Management module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Scrap Management module (/inventory/scrap/*).

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
| Module code | `SCR` |
| Module name | Scrap Management |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/inventory/scrap/*` |
| Services / components | `scrapService` |
| LocalStorage keys (prototype) | `bellomassi_scrap_requests` |


## 2. Purpose

Scrap requests with evidence, approval by a different user and one-time stock write-off.

## 3. Business objectives

Write-offs are justified, approved by someone else and posted once.

Related business requirements: BR-020.

## 4. User roles

- Administrator
- Dispatcher
- Inventory Executive
- QA Manager
- Warehouse Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `inventory.scrap.view`, `scrap.create`, `scrap.approve`, `scrap.reject`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Scrap Management | `/inventory/scrap` | `inventory.scrap.view` |
| Scrap Requests | `/inventory/scrap/requests` | `inventory.scrap.view` |
| New Scrap Request | `/inventory/scrap/requests/create` | `scrap.create` |
| Edit Scrap Request | `/inventory/scrap/requests/:id/edit` | `scrap.create` |
| Scrap Note | `/inventory/scrap/requests/:id/print` | `inventory.scrap.view` |
| Scrap Request | `/inventory/scrap/requests/:id` | `inventory.scrap.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-SCR-001 | P1 | Users shall raise scrap requests with reason, quantity, stock source, batch and photo evidence. | Administrator, Dispatcher, Warehouse Manager, Inventory Executive, QA Manager | VERIFIED | Implemented and working (prototype) |
| FR-SCR-002 | P1 | Quantity shall not exceed eligible stock; photo required for Damaged, Packaging Damage and Contamination; batch required for batch-controlled products; no duplicate open request. | Administrator, Dispatcher, Warehouse Manager, Inventory Executive, QA Manager | VERIFIED | Implemented and working (prototype) |
| FR-SCR-003 | P1 | Approvers shall approve or reject requests; requesters cannot approve their own. | Administrator, Warehouse Manager | VERIFIED | Implemented and working (prototype) |
| FR-SCR-004 | P1 | Approvers shall post the stock write-off exactly once. | Administrator, Warehouse Manager | VERIFIED | Implemented and working (prototype) |
| FR-SCR-005 | P3 | A printable scrap note shall be available. | Administrator, Warehouse Manager | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Hub · product · stock source (available / damaged) · quantity · reason · batch number · expiry date · photo · notes · rejection reason

## 9. Validation rules

- **RULE-035** — Scrap quantity ≤ eligible stock (on hand in source minus other open requests); no duplicate open request. _(enforced by `scrapService.validateScrap`; message: Message.)_
- **RULE-036** — Photo proof required for Damaged, Packaging Damage, Contamination; batch required if batch-controlled. _(enforced by `scrapService.validateScrap`; message: Message.)_
- **RULE-037** — Requesters cannot approve their own scrap request; write-off only after approval and only once. _(enforced by `scrapService`; message: "You cannot approve your own scrap request.")_

## 10. Business rules

- FR-SCR-001: expected behaviour — DRAFT or PENDING_APPROVAL.
- FR-SCR-002: expected behaviour — Validation messages.
- FR-SCR-003: expected behaviour — APPROVED / REJECTED.
- FR-SCR-004: expected behaviour — COMPLETED; Scrap Write-off movement.
- FR-SCR-005: expected behaviour — Print layout.

## 11. Workflow

See **BM-WF-14** (WF-14 — Scrap Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

DRAFT → PENDING_APPROVAL → APPROVED → COMPLETED; REJECTED; CANCELLED. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

- FR-SCR-003: Approvers shall approve or reject requests; requesters cannot approve their own.
- FR-SCR-004: Approvers shall post the stock write-off exactly once.

## 14. Notifications

Pending scrap shown on warehouse dashboard.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-SCR-N01 | Approve own scrap request | "You cannot approve your own scrap request." |
| TC-SCR-N02 | Damaged without photo | Photo proof required |
| TC-SCR-N03 | Quantity above eligible | "Only N eligible…" |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_scrap_requests`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Scrap category (scrap by reason, value).

## 19. Audit requirements

Request history + Scrap Write-off movement. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-SCR-001 | DRAFT or PENDING_APPROVAL. | TC-SCR-001 |
| FR-SCR-002 | Validation messages. | TC-SCR-002, TC-SCR-N02, TC-SCR-N03 |
| FR-SCR-003 | APPROVED / REJECTED. | TC-SCR-003, TC-SCR-N01 |
| FR-SCR-004 | COMPLETED; Scrap Write-off movement. | TC-SCR-004 |
| FR-SCR-005 | Print layout. | TC-SCR-005 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 5. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Disposal certificate upload, value approval thresholds, SAP write-off posting.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |