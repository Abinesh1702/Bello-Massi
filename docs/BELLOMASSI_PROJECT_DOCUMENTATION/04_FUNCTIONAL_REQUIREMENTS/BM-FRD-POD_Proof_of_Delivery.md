# Functional Requirements — Proof of Delivery

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Proof of Delivery |
| Document ID | BM-FRD-POD |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Proof of Delivery |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Proof of Delivery module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Proof of Delivery module (/driver/deliveries/:id/confirm).

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

Permission keys (from `src/config/rbacCatalog.js`): `driver.app`. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

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

See [BM-WF-10 — WF-10 — Driver Delivery Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-10_Driver_Delivery_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Captured with the delivery. Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

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

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `bellomassi_delivery_pod, bellomassi_deliveries`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

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

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |