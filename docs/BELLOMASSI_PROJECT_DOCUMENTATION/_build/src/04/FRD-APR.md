---
id: "BM-FRD-APR"
title: "Functional Requirements — Sales Manager Approval"
folder: "04"
file: "BM-FRD-APR_Sales_Manager_Approval"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Sales Manager Approval"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Sales Manager Approval module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Sales Manager Approval module (/orders/approval)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `APR` |
| Module name | Sales Manager Approval |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/orders/approval` |
| Services / components | `approvalService` |
| LocalStorage keys (prototype) | `bellomassi_orders, bellomassi_approvals` |


## 2. Purpose

Approve, return for correction or reject submitted orders after automatic checks.

## 3. Business objectives

Nothing ships without a recorded manager decision on value, quantity and credit.

Related business requirements: BR-002, BR-003, BR-004, BR-012.

## 4. User roles

- Finance Executive
- Sales Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `orders.approval.view`, `orders.approve`, `orders.reject`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Order Approval | `/orders/approval` | `orders.approval.view` |
| Review Order | `/orders/approval/:id` | `orders.approval.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-APR-001 | P1 | Sales Managers shall see an approval queue of submitted orders, oldest first. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-002 | P1 | The system shall run six checks: customer active, hub active, credit within limit, stock available, total valid, products active. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-003 | P1 | Sales Managers shall approve orders; warnings must be acknowledged and remarks entered when required by settings. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-004 | P1 | Sales Managers shall return orders for correction with a reason from a list and remarks. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-005 | P1 | Sales Managers shall reject orders with a reason from a list and remarks. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-006 | P1 | Draft or already-decided orders shall not be decided again. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-007 | P1 | The Sales Manager shall be able to set the approved value and quantity (SOW slide 8). | Sales Manager | PENDING CONFIRMATION | Pending client confirmation |
| FR-APR-008 | P1 | Finance shall be notified of approved orders, flagged when the credit limit is exceeded (SOW slides 8 and 16). | Sales Manager, Finance Executive | NOT IMPLEMENTED | Not implemented |

## 8. Input fields

Decision (approve / return / reject) · reason (return / rejection list) · remarks · warning acknowledgement

## 9. Validation rules

- **RULE-010** — Approval requires customer active, hub active, products active and total valid. _(enforced by `approvalService.getApprovalChecks`; message: "Cannot approve: …")_
- **RULE-011** — Credit over limit blocks approval only when "Block when credit exceeded" is on. _(enforced by `approvalService`; message: Warning or block.)_
- **RULE-012** — Warnings must be acknowledged before approval. _(enforced by `approvalService.approveOrder`; message: "Confirm that you have reviewed the credit and stock warnings.")_
- **RULE-013** — Approval remarks are required when the setting requires them. _(enforced by `approvalService.approveOrder`; message: "Approval remarks are required.")_
- **RULE-014** — Return and rejection need a reason from the list and remarks (minimum 5 characters by default). _(enforced by `approvalService`; message: Validation messages.)_
- **RULE-015** — Orders are decided once; drafts cannot be decided. _(enforced by `approvalService`; message: "…has already been approved. No change was made.")_

## 10. Business rules

- FR-APR-001: expected behaviour — Queue lists SUBMITTED / PENDING orders.
- FR-APR-002: expected behaviour — Checks displayed with pass / warn / block.
- FR-APR-003: expected behaviour — Status APPROVED, consolidation PENDING, Customer Service and salesman notified.
- FR-APR-004: expected behaviour — Status RETURNED; salesman notified with edit link.
- FR-APR-005: expected behaviour — Status REJECTED (final); salesman notified.
- FR-APR-006: expected behaviour — "…has already been approved. No change was made."

## 11. Workflow

See {{ref:BM-WF-04}}, {{ref:BM-WF-19}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

SUBMITTED → APPROVED / RETURNED / REJECTED; approvalStatus PENDING → APPROVED / RETURNED / REJECTED. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

- FR-APR-001: Sales Managers shall see an approval queue of submitted orders, oldest first.
- FR-APR-003: Sales Managers shall approve orders; warnings must be acknowledged and remarks entered when required by settings.
- FR-APR-005: Sales Managers shall reject orders with a reason from a list and remarks.
- FR-APR-007: The Sales Manager shall be able to set the approved value and quantity (SOW slide 8).
- FR-APR-008: Finance shall be notified of approved orders, flagged when the credit limit is exceeded (SOW slides 8 and 16).

## 14. Notifications

Salesman and Customer Service on approval; salesman on return / rejection; automation ORDER_APPROVED / ORDER_REJECTED.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-APR-N01 | Approve with unacknowledged warning | "Confirm that you have reviewed the credit and stock warnings." |
| TC-APR-N02 | Reject without reason | Validation error; order unchanged |
| TC-APR-N03 | Approve twice | "…has already been approved. No change was made." |
| TC-APR-N04 | Inactive customer blocks approval | Approve disabled: "Cannot approve: customer…" |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_orders, bellomassi_approvals`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Approval reports (approval time, rejection reasons).

## 19. Audit requirements

Approval record (`bellomassi_approvals`) + order timeline event. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-APR-001 | Queue lists SUBMITTED / PENDING orders. | TC-APR-001 |
| FR-APR-002 | Checks displayed with pass / warn / block. | TC-APR-002, TC-APR-N04 |
| FR-APR-003 | Status APPROVED, consolidation PENDING, Customer Service and salesman notified. | TC-APR-003, TC-APR-N01 |
| FR-APR-004 | Status RETURNED; salesman notified with edit link. | TC-APR-004 |
| FR-APR-005 | Status REJECTED (final); salesman notified. | TC-APR-005, TC-APR-N02 |
| FR-APR-006 | "…has already been approved. No change was made." | TC-APR-006, TC-APR-N03 |
| FR-APR-007 | Not implemented: the prototype approves the order as submitted; return for correction is used instead. | TC-APR-007 |
| FR-APR-008 | Not implemented: approval notifies Customer Service and the salesman only. | TC-APR-008 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 6, PENDING CONFIRMATION 1, NOT IMPLEMENTED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Edit approved quantities (G-01), Finance notification (G-02), approval limits by value, delegation when manager absent.

- FR-APR-007 (PENDING CONFIRMATION): The Sales Manager shall be able to set the approved value and quantity (SOW slide 8).
- FR-APR-008 (NOT IMPLEMENTED): Finance shall be notified of approved orders, flagged when the credit limit is exceeded (SOW slides 8 and 16).
