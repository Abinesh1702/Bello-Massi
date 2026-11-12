# Functional Requirements — Warehouse and QA Dashboards

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Warehouse and QA Dashboards |
| Document ID | BM-FRD-WQA |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Warehouse and QA Dashboards |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Warehouse and QA Dashboards module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Warehouse and QA Dashboards module (/warehouse, /quality).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-SYS-002 — Software Requirements Specification (SRS)](../03_SYSTEM_REQUIREMENTS/BM-SYS-002_Software_Requirements_Specification.md)
- [BM-SYS-003 — Functional Requirements Document (Consolidated)](../03_SYSTEM_REQUIREMENTS/BM-SYS-003_Functional_Requirements_Document.md)
- [BM-SYS-008 — Requirement Traceability Matrix](../03_SYSTEM_REQUIREMENTS/BM-SYS-008_Requirement_Traceability_Matrix.xlsx)
- [BM-QA-011 — Functional Test Cases](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-011_Functional_Test_Cases.xlsx)

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

Permission keys (from `src/config/rbacCatalog.js`): `warehouse.dashboard`, `warehouse.qa.view`. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

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

See [BM-WF-13 — WF-13 — Inventory Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-13_Inventory_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Not applicable. Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Low stock, expiring documents.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `(reads inventory, orders, documents)`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

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

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |