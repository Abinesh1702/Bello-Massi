---
id: "BM-FRD-CON"
title: "Functional Requirements — Order Consolidation (Customer Service)"
folder: "04"
file: "BM-FRD-CON_Order_Consolidation_Customer_Service"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Order Consolidation (Customer Service)"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Order Consolidation (Customer Service) module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Order Consolidation (Customer Service) module (/orders/consolidation)."
---
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

Permission keys (from `src/config/rbacCatalog.js`): `orders.consolidation.view`, `orders.consolidate`. Default grants per role are in {{ref:BM-SEC-005}}.

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

See {{ref:BM-WF-05}}, {{ref:BM-WF-07}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

APPROVED (consolidation PENDING) → CONSOLIDATED (COMPLETED) → READY_FOR_DISPATCH. Full lists: {{ref:BM-GLO-003}}.

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

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_consolidations, bellomassi_orders`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

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


