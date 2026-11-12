---
id: "BM-FRD-SCR"
title: "Functional Requirements — Scrap Management"
folder: "04"
file: "BM-FRD-SCR_Scrap_Management"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Scrap Management"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Scrap Management module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Scrap Management module (/inventory/scrap/*)."
---
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

Permission keys (from `src/config/rbacCatalog.js`): `inventory.scrap.view`, `scrap.create`, `scrap.approve`, `scrap.reject`. Default grants per role are in {{ref:BM-SEC-005}}.

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

See {{ref:BM-WF-14}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

DRAFT → PENDING_APPROVAL → APPROVED → COMPLETED; REJECTED; CANCELLED. Full lists: {{ref:BM-GLO-003}}.

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

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_scrap_requests`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

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


