---
id: "BM-FRD-CALL"
title: "Functional Requirements — Call History"
folder: "04"
file: "BM-FRD-CALL_Call_History"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Call History"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Call History module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Call History module (/communication/calls/*)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `CALL` |
| Module name | Call History |
| Current implementation status | **Implemented and working (manual log, no telephony)** |
| Main routes | `/communication/calls/*` |
| Services / components | `callService` |
| LocalStorage keys (prototype) | `bellomassi_call_history` |


## 2. Purpose

Manual call log with outcomes, notes, follow-ups and linked orders.

## 3. Business objectives

Customer conversations are recorded and followed up.

Related business requirements: BR-025.

## 4. User roles

- Administrator
- Customer Service
- Sales Executive (Salesman)
- Sales Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `communication.calls`, `calls.manage`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Call History | `/communication/calls` | `communication.calls` |
| Call Follow-ups | `/communication/calls/follow-ups` | `communication.calls` |
| All Calls | `/communication/calls/list` | `communication.calls` |
| Log a Call | `/communication/calls/create` | `calls.manage` |
| Edit Call | `/communication/calls/:id/edit` | `calls.manage` |
| Call Details | `/communication/calls/:id` | `communication.calls` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-CALL-001 | P3 | Users shall log calls with direction, status, outcome, duration and notes. | Sales Executive (Salesman), Sales Manager, Customer Service, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-CALL-002 | P3 | Users shall schedule and complete follow-ups and link orders to calls. | Sales Executive (Salesman), Sales Manager, Customer Service, Administrator | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Customer · direction · status · outcome · duration · notes · follow-up date · linked order

## 9. Validation rules

- **RULE-043** — Follow-up date cannot be before the call; notes ≤ 500 characters; salesmen see own calls. _(enforced by `callService`; message: Messages.)_

## 10. Business rules

- FR-CALL-001: expected behaviour — Call saved; salesmen see their own calls only.
- FR-CALL-002: expected behaviour — Follow-ups grouped overdue / today / upcoming.

## 11. Workflow

See {{ref:BM-WF-03}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Follow-up open → completed. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Follow-ups due on the call dashboard.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_call_history`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Communication reports (calls by outcome).

## 19. Audit requirements

Call record history. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-CALL-001 | Call saved; salesmen see their own calls only. | TC-CALL-001 |
| FR-CALL-002 | Follow-ups grouped overdue / today / upcoming. | TC-CALL-002 |

## 21. Current implementation status

**Implemented and working (manual log, no telephony).** Labels: VERIFIED 2. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Telephony / click-to-call integration.


