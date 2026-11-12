# Functional Requirements — Delivery Notes

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Delivery Notes |
| Document ID | BM-FRD-DN |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Delivery Notes |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Delivery Notes module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Delivery Notes module (/dispatch/delivery-notes/:id).

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
| Module code | `DN` |
| Module name | Delivery Notes |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/dispatch/delivery-notes/:id` |
| Services / components | `deliveryNoteService` |
| LocalStorage keys (prototype) | `bellomassi_delivery_notes` |


## 2. Purpose

Automatic delivery note per completed stop, printable, visible to office, driver and customer.

## 3. Business objectives

The customer receives a delivery document immediately.

Related business requirements: BR-010.

## 4. User roles

- All signed-in users
- Customer (portal / app)
- Driver

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `deliveryNotes.view`. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Delivery Note | `/dispatch/delivery-notes/:id` | `deliveryNotes.view` |
| My Delivery Notes | `/driver/delivery-notes` | `driver.app` |
| Delivery Note | `/driver/delivery-notes/:id` | `driver.app` |
| Delivery Notes | `/customer/delivery-notes` | `customer.app` |
| Delivery Note | `/customer/delivery-notes/:id` | `customer.app` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-DN-001 | P1 | A numbered delivery note (BM-DN-YYYY-NNNNN) shall be generated when a stop is completed (full or partial). | Driver | VERIFIED | Implemented and working (prototype) |
| FR-DN-002 | P1 | Delivery notes shall be printable and visible to office roles with permission, the driver and the customer. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-DN-003 | P1 | The delivery note shall be sent to the customer instantly by SMS / WhatsApp / email (SOW slide 13). | Customer (portal / app) | PROPOSED | Planned (production) |

## 8. Input fields

(generated)

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-DN-001: expected behaviour — Note lists delivered, short and damaged quantities and receiver.
- FR-DN-002: expected behaviour — Print layout available.

## 11. Workflow

See [BM-WF-10 — WF-10 — Driver Delivery Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-10_Driver_Delivery_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Generated once per completed stop. Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Customer notified on delivery.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `bellomassi_delivery_notes`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

## 18. Reports

Delivery notes lists (office, driver, customer).

## 19. Audit requirements

Note number sequence and link to delivery. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-DN-001 | Note lists delivered, short and damaged quantities and receiver. | TC-DN-001 |
| FR-DN-002 | Print layout available. | TC-DN-002 |
| FR-DN-003 | Prototype: visible in the customer app only. | TC-DN-003 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 2, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Send by SMS / WhatsApp / email; PDF generation server-side; digital signature.

- FR-DN-003 (PROPOSED): The delivery note shall be sent to the customer instantly by SMS / WhatsApp / email (SOW slide 13).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |