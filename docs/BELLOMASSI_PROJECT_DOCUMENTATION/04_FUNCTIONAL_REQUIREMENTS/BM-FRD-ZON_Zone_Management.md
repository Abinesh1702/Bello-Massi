# Functional Requirements — Zone Management

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Zone Management |
| Document ID | BM-FRD-ZON |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Zone Management |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Zone Management module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Zone Management module (/dispatch/zones).

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
| Module code | `ZON` |
| Module name | Zone Management |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/dispatch/zones` |
| Services / components | `zoneService` |
| LocalStorage keys (prototype) | `bellomassi_dispatch_zones` |


## 2. Purpose

Delivery zones as pincode groups per hub; zone of each order and neighbouring-zone warning.

## 3. Business objectives

Every order falls into a delivery zone that drives planning.

Related business requirements: BR-006, BR-014.

## 4. User roles

- Administrator
- Dispatcher
- Super Admin

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `fleet.view`, `fleet.manage`. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Dispatch Zones | `/dispatch/zones` | `fleet.view` |
| New Zone | `/dispatch/zones/create` | `fleet.manage` |
| Edit Zone | `/dispatch/zones/:id/edit` | `fleet.manage` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-ZON-001 | P1 | Administrators shall maintain zones per hub with a list of pincodes. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-ZON-002 | P2 | The system shall warn when a dispatch mixes orders from non-neighbouring zones. | Dispatcher | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Zone code · name · hub · pincodes · neighbouring zones · status

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-ZON-001: expected behaviour — Zone saved; code unique; at least one pincode.
- FR-ZON-002: expected behaviour — Neighbouring-zone warning shown.

## 11. Workflow

See [BM-WF-08 — WF-08 — Dispatch Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-08_Dispatch_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Zone: Active / Inactive. Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `bellomassi_dispatch_zones`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

## 18. Reports

Zone delivery performance (dispatch dashboard).

## 19. Audit requirements

Activity log. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-ZON-001 | Zone saved; code unique; at least one pincode. | TC-ZON-001 |
| FR-ZON-002 | Neighbouring-zone warning shown. | TC-ZON-002 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 2. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Polygon zones on a map with geocoded customer locations.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |