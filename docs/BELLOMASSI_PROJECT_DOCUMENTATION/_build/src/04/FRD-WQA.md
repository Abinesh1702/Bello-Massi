---
id: "BM-FRD-WQA"
title: "Functional Requirements — Warehouse and QA Dashboards"
folder: "04"
file: "BM-FRD-WQA_Warehouse_and_QA_Dashboards"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Warehouse and QA Dashboards"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Warehouse and QA Dashboards module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Warehouse and QA Dashboards module (/warehouse, /quality)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `WQA` |
| Module name | Warehouse and QA Dashboards |
| Current implementation status | **Implemented with limitations (no temperature sensors)** |
| Main routes | `/warehouse, /quality` |
| Services / components | `useOpsSnapshot` |
| LocalStorage keys (prototype) | `(reads inventory, orders, documents)` |


## 2. Purpose

Picking & loading view, inventory alerts, quarantine, inspections and document expiry; cold-chain card.

## 3. Business objectives

Warehouse and QA staff see their priorities on one screen.

Related business requirements: BR-032.

## 4. User roles

- Administrator
- Inventory Executive
- QA Manager
- Warehouse Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `warehouse.dashboard`, `warehouse.qa.view`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Warehouse Dashboard | `/warehouse` | `warehouse.dashboard` |
| QA & Cold Chain | `/quality` | `warehouse.qa.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-WQA-001 | P2 | Warehouse users shall see picking & loading, inventory alerts, damaged stock and document expiry. | Administrator, Warehouse Manager, Inventory Executive, QA Manager | VERIFIED | Implemented and working (prototype) |
| FR-WQA-002 | P2 | QA users shall see inspection queues, quarantine, expired documents and the cold-chain card. | Administrator, Warehouse Manager, QA Manager | VERIFIED | Implemented and working (prototype) |
| FR-WQA-003 | P2 | Live cold-chain temperature monitoring and excursion alerts. | QA Manager | NOT IMPLEMENTED | Not implemented |

## 8. Input fields

(read-only dashboards)

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-WQA-001: expected behaviour — Dashboard lists consolidated / ready orders per hub.
- FR-WQA-002: expected behaviour — Cold-chain card states "No sensor integration".

## 11. Workflow

See {{ref:BM-WF-13}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Not applicable. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Low stock, expiring documents.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `(reads inventory, orders, documents)`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Inventory, scrap and document reports.

## 19. Audit requirements

Not applicable. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-WQA-001 | Dashboard lists consolidated / ready orders per hub. | TC-WQA-001 |
| FR-WQA-002 | Cold-chain card states "No sensor integration". | TC-WQA-002 |
| FR-WQA-003 | Not available (ranges configured only). | TC-WQA-003 |

## 21. Current implementation status

**Implemented with limitations (no temperature sensors).** Labels: VERIFIED 2, NOT IMPLEMENTED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Temperature sensor integration with excursion alerts, QA hold on receipt, FEFO picking lists.

- FR-WQA-003 (NOT IMPLEMENTED): Live cold-chain temperature monitoring and excursion alerts.
