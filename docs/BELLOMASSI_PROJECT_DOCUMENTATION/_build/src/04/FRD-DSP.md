---
id: "BM-FRD-DSP"
title: "Functional Requirements — Dispatch Management"
folder: "04"
file: "BM-FRD-DSP_Dispatch_Management"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Dispatch Management"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Dispatch Management module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Dispatch Management module (/dispatch/*)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `DSP` |
| Module name | Dispatch Management |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/dispatch/*` |
| Services / components | `dispatchService` |
| LocalStorage keys (prototype) | `bellomassi_dispatches, bellomassi_dispatch_timeline, bellomassi_deliveries` |


## 2. Purpose

Plan dispatches from ready orders, sequence stops, confirm loading (stock deduction), cancel.

## 3. Business objectives

Ready orders leave the hub on a planned, confirmed vehicle run with correct stock movements.

Related business requirements: BR-006, BR-007, BR-008.

## 4. User roles

- Administrator
- Dispatcher

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `dispatch.view`, `dispatch.manage`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Dispatch Dashboard | `/dispatch` | `dispatch.view` |
| Ready for Dispatch | `/dispatch/ready-orders` | `dispatch.ready.view` |
| Dispatch Planning | `/dispatch/planning` | `dispatch.view` |
| Delivery Reports | `/dispatch/reports` | `dispatch.reports` |
| New Dispatch | `/dispatch/create` | `dispatch.manage` |
| Edit Dispatch | `/dispatch/:id/edit` | `dispatch.manage` |
| Dispatch Details | `/dispatch/:id` | `dispatch.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-DSP-001 | P1 | Dispatchers shall create dispatches from ready orders for a hub, zone and date, saved as draft or planned. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DSP-002 | P1 | Orders not ready, already on another active dispatch or without a complete address shall be refused. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DSP-003 | P1 | Dispatchers shall set the stop sequence by drag and drop or move buttons; a suggested sequence (priority, pincode) is offered. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DSP-004 | P1 | Dispatchers shall confirm loading after a review tick; stock is deducted once and one delivery is created per order. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DSP-005 | P1 | Dispatchers shall cancel dispatches with a reason before any stop starts; confirmed dispatches reverse stock once. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DSP-006 | P2 | Dispatches shall be editable only while DRAFT, PLANNED or ASSIGNED. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DSP-007 | P1 | Dispatch status shall close automatically: COMPLETED when all stops are delivered, PARTIALLY_DELIVERED (Closed with exceptions) otherwise. | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DSP-008 | P1 | Dispatchers shall place orders into zones by drag and drop on a zone board (SOW slide 10). | Dispatcher | PENDING CONFIRMATION | Pending client confirmation |
| FR-DSP-009 | P1 | The system shall suggest the fastest route using distance and live traffic and warn when a VIP requested time may be missed. | Dispatcher | PROPOSED | Planned (production) |

## 8. Input fields

Hub · zone · dispatch date · orders · sequence · driver · vehicle · notes · confirmation tick · cancel reason + remarks

## 9. Validation rules

- **RULE-018** — Only READY_FOR_DISPATCH orders with a complete address and not on another active dispatch can be dispatched. _(enforced by `dispatchService.orderIneligibility`; message: Message per order.)_
- **RULE-019** — A dispatch can be edited only while DRAFT, PLANNED or ASSIGNED. _(enforced by `dispatchService.updateDispatch`; message: "…can no longer be edited.")_
- **RULE-020** — Confirmation requires an assigned driver and vehicle, a review tick and enough hub stock per line. _(enforced by `dispatchService.confirmDispatch`; message: "…needs N, only M available at the hub.")_
- **RULE-021** — Stock is deducted once at confirmation and reversed once on cancellation. _(enforced by `utils/dispatchStock`; message: stockDeducted / stockReversed flags.)_
- **RULE-022** — A dispatch cannot be cancelled after any stop has started; cancel needs a reason and remarks. _(enforced by `dispatchService.cancelDispatch`; message: Message.)_
- **RULE-030** — Dispatch closes COMPLETED when all stops delivered, otherwise PARTIALLY_DELIVERED (Closed with exceptions). _(enforced by `deliveryService`; message: Status.)_

## 10. Business rules

- FR-DSP-001: expected behaviour — Dispatch BM-DSP-… in DRAFT or PLANNED.
- FR-DSP-002: expected behaviour — Specific refusal message per order.
- FR-DSP-003: expected behaviour — Sequence saved; driver notified of changes.
- FR-DSP-004: expected behaviour — Status CONFIRMED; orders DISPATCHED; Stock Dispatch movements.
- FR-DSP-005: expected behaviour — Status CANCELLED; orders back to READY_FOR_DISPATCH.
- FR-DSP-006: expected behaviour — "…is confirmed and can no longer be edited."
- FR-DSP-007: expected behaviour — Status updates when the last stop closes.

## 11. Workflow

See {{ref:BM-WF-08}}, {{ref:BM-WF-20}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

DRAFT → PLANNED → ASSIGNED → CONFIRMED → IN_TRANSIT → COMPLETED / PARTIALLY_DELIVERED; CANCELLED. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

- FR-DSP-004: Dispatchers shall confirm loading after a review tick; stock is deducted once and one delivery is created per order.

## 14. Notifications

Driver (assigned, confirmed, sequence changed, removed, cancelled); Administrator on confirmation.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-DSP-N01 | Dispatch a non-ready order | "Only orders ready for dispatch can be dispatched." |
| TC-DSP-N02 | Confirm without review tick | "Review the orders, driver, vehicle, route and stock, then tick the confirmation." |
| TC-DSP-N03 | Stock short at confirmation | "…needs N, only M available at the hub."; not confirmed |
| TC-DSP-N04 | Confirm twice | "…already confirmed. Stock was deducted once…" |
| TC-DSP-N05 | Cancel after a stop started | Cancellation refused |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_dispatches, bellomassi_dispatch_timeline, bellomassi_deliveries`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Dispatch & Delivery category; Delivery Reports (`/dispatch/reports`).

## 19. Audit requirements

Dispatch timeline (`bellomassi_dispatch_timeline`). Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-DSP-001 | Dispatch BM-DSP-… in DRAFT or PLANNED. | TC-DSP-001 |
| FR-DSP-002 | Specific refusal message per order. | TC-DSP-002, TC-DSP-N01 |
| FR-DSP-003 | Sequence saved; driver notified of changes. | TC-DSP-003 |
| FR-DSP-004 | Status CONFIRMED; orders DISPATCHED; Stock Dispatch movements. | TC-DSP-004, TC-DSP-N02, TC-DSP-N03, TC-DSP-N04 |
| FR-DSP-005 | Status CANCELLED; orders back to READY_FOR_DISPATCH. | TC-DSP-005, TC-DSP-N05 |
| FR-DSP-006 | "…is confirmed and can no longer be edited." | TC-DSP-006 |
| FR-DSP-007 | Status updates when the last stop closes. | TC-DSP-007 |
| FR-DSP-008 | Prototype: zone chosen in the dispatch form; drag and drop exists for stop sequence only. | TC-DSP-008 |
| FR-DSP-009 | Prototype suggests sequence by priority and pincode only. | TC-DSP-009 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 7, PENDING CONFIRMATION 1, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Zone board drag and drop (G-03), route optimisation with traffic (G-04), multi-drop load planning, SAP delivery creation.

- FR-DSP-008 (PENDING CONFIRMATION): Dispatchers shall place orders into zones by drag and drop on a zone board (SOW slide 10).
- FR-DSP-009 (PROPOSED): The system shall suggest the fastest route using distance and live traffic and warn when a VIP requested time may be missed.
