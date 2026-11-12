---
id: "BM-FRD-EXC"
title: "Functional Requirements — Delivery Exception Review"
folder: "04"
file: "BM-FRD-EXC_Delivery_Exception_Review"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Delivery Exception Review"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Delivery Exception Review module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Delivery Exception Review module (/dispatch/deliveries/:id)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `EXC` |
| Module name | Delivery Exception Review |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/dispatch/deliveries/:id` |
| Services / components | `deliveryService.reviewDelivery` |
| LocalStorage keys (prototype) | `bellomassi_deliveries, bellomassi_stock_movements` |


## 2. Purpose

Failed and partial deliveries reviewed by the Dispatcher: return stock, re-queue.

## 3. Business objectives

Failed and partial deliveries never disappear: each is reviewed and stock corrected.

Related business requirements: BR-027.

## 4. User roles

- Administrator
- Dispatcher

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `dispatch.manage`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Delivery Details | `/dispatch/deliveries/:id` | `deliveries.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-EXC-001 | P1 | Dispatchers shall review failed and partial deliveries with remarks. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-EXC-002 | P1 | The review may return undelivered (not damaged) stock to the hub once. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-EXC-003 | P1 | A failed delivery whose goods are returned may be re-queued for a new dispatch. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Review remarks · return to hub · re-queue

## 9. Validation rules

- **RULE-031** — Only failed / partial deliveries are reviewed; remarks required; stock returned once; re-queue only for failed + returned. _(enforced by `deliveryService.reviewDelivery`; message: Messages.)_

## 10. Business rules

- FR-EXC-001: expected behaviour — Review status REVIEWED.
- FR-EXC-002: expected behaviour — Delivery Return movement posted once.
- FR-EXC-003: expected behaviour — Order READY_FOR_DISPATCH.

## 11. Workflow

See {{ref:BM-WF-18}}, {{ref:BM-WF-21}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Review PENDING → REVIEWED; delivery FAILED → RETURNED; order DELIVERY_FAILED → RETURNED_TO_HUB / READY_FOR_DISPATCH. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

- FR-EXC-001: Dispatchers shall review failed and partial deliveries with remarks.
- FR-EXC-002: The review may return undelivered (not damaged) stock to the hub once.

## 14. Notifications

Dispatcher and Administrator on failure; customer told the team will reschedule.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-EXC-N01 | Review without remarks | "Add review remarks." |
| TC-EXC-N02 | Return stock twice | Refused; already reviewed |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_deliveries, bellomassi_stock_movements`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Failed / partial delivery reports.

## 19. Audit requirements

Dispatch timeline + stock movements. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-EXC-001 | Review status REVIEWED. | TC-EXC-001, TC-EXC-N01 |
| FR-EXC-002 | Delivery Return movement posted once. | TC-EXC-002, TC-EXC-N02 |
| FR-EXC-003 | Order READY_FOR_DISPATCH. | TC-EXC-003 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 3. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Customer reschedule self-service, automatic re-planning.


