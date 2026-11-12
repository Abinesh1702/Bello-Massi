---
id: "BM-FRD-POD"
title: "Functional Requirements — Proof of Delivery"
folder: "04"
file: "BM-FRD-POD_Proof_of_Delivery"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Proof of Delivery"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Proof of Delivery module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Proof of Delivery module (/driver/deliveries/:id/confirm)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `POD` |
| Module name | Proof of Delivery |
| Current implementation status | **Implemented with limitations (stored in browser)** |
| Main routes | `/driver/deliveries/:id/confirm` |
| Services / components | `deliveryService.confirmDelivery` |
| LocalStorage keys (prototype) | `bellomassi_delivery_pod, bellomassi_deliveries` |


## 2. Purpose

Delivered / damaged quantities, receiver, signature, photo and customer remarks.

## 3. Business objectives

Disputes over what was delivered are settled by evidence.

Related business requirements: BR-033.

## 4. User roles

- Driver

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `driver.app`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Confirm Delivery | `/driver/deliveries/:id/confirm` | `driver.app` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-POD-001 | P1 | Proof of delivery shall capture receiver name, optional signature and photo (≤ 350 KB each) and customer remarks (≤ 300 characters). | Driver | VERIFIED | Implemented and working (prototype) |
| FR-POD-002 | P1 | Delivered quantity shall not exceed the dispatched quantity; damaged and rejected quantities are recorded. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-POD-003 | P1 | Production POD images shall be stored in object storage with signed URLs and retention rules. | Driver | PROPOSED | Planned (production) |

## 8. Input fields

Received by · signature · photo · customer remarks · line quantities

## 9. Validation rules

- **RULE-028** — Delivered quantity ≤ dispatched; receiver name required; photo / signature ≤ 350 KB; remarks ≤ 300 characters. _(enforced by `deliveryService.validatePod`; message: Field messages.)_

## 10. Business rules

- FR-POD-001: expected behaviour — POD stored with the delivery.
- FR-POD-002: expected behaviour — Validation messages per line.

## 11. Workflow

See {{ref:BM-WF-10}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Captured with the delivery. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

- FR-POD-002: Delivered quantity shall not exceed the dispatched quantity; damaged and rejected quantities are recorded.

## 14. Notifications

Customer and Dispatcher on completion.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-POD-N01 | Delivered more than dispatched | Validation error on the line |
| TC-POD-N02 | Missing receiver name | "Enter the name of the person who received the goods." |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_delivery_pod, bellomassi_deliveries`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Delivery note.

## 19. Audit requirements

POD record linked to delivery (`bellomassi_delivery_pod`). Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-POD-001 | POD stored with the delivery. | TC-POD-001, TC-POD-N02 |
| FR-POD-002 | Validation messages per line. | TC-POD-002, TC-POD-N01 |
| FR-POD-003 | No images in browser storage. | TC-POD-003 |

## 21. Current implementation status

**Implemented with limitations (stored in browser).** Labels: VERIFIED 2, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Object storage, image compression, geo-stamp and time-stamp watermark.

- FR-POD-003 (PROPOSED): Production POD images shall be stored in object storage with signed URLs and retention rules.
