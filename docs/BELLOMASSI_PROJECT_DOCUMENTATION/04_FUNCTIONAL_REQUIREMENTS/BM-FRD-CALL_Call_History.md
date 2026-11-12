# Functional Requirements — Call History

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Call History |
| Document ID | BM-FRD-CALL |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Call History |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Call History module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Call History module (/communication/calls/*).

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
| Module code | `CALL` |
| Module name | Call History |
| Current implementation status | **Implemented and working (manual log, no telephony)** |
| Main routes | `/communication/calls/*` |
| Services / components | `callService` |
| LocalStorage keys (prototype) | `bellomassi_call_history` |


## 2. Purpose

Manual call log with outcomes, notes, follow-ups and linked orders.

## 3. Business objectives

Customer conversations are recorded and followed up.

Related business requirements: BR-025.

## 4. User roles

- Administrator
- Customer Service
- Sales Executive (Salesman)
- Sales Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `communication.calls`, `calls.manage`. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Call History | `/communication/calls` | `communication.calls` |
| Call Follow-ups | `/communication/calls/follow-ups` | `communication.calls` |
| All Calls | `/communication/calls/list` | `communication.calls` |
| Log a Call | `/communication/calls/create` | `calls.manage` |
| Edit Call | `/communication/calls/:id/edit` | `calls.manage` |
| Call Details | `/communication/calls/:id` | `communication.calls` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-CALL-001 | P3 | Users shall log calls with direction, status, outcome, duration and notes. | Sales Executive (Salesman), Sales Manager, Customer Service, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-CALL-002 | P3 | Users shall schedule and complete follow-ups and link orders to calls. | Sales Executive (Salesman), Sales Manager, Customer Service, Administrator | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Customer · direction · status · outcome · duration · notes · follow-up date · linked order

## 9. Validation rules

- **RULE-043** — Follow-up date cannot be before the call; notes ≤ 500 characters; salesmen see own calls. _(enforced by `callService`; message: Messages.)_

## 10. Business rules

- FR-CALL-001: expected behaviour — Call saved; salesmen see their own calls only.
- FR-CALL-002: expected behaviour — Follow-ups grouped overdue / today / upcoming.

## 11. Workflow

See [BM-WF-03 — WF-03 — Salesman Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-03_Salesman_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Follow-up open → completed. Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Follow-ups due on the call dashboard.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `bellomassi_call_history`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

## 18. Reports

Communication reports (calls by outcome).

## 19. Audit requirements

Call record history. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-CALL-001 | Call saved; salesmen see their own calls only. | TC-CALL-001 |
| FR-CALL-002 | Follow-ups grouped overdue / today / upcoming. | TC-CALL-002 |

## 21. Current implementation status

**Implemented and working (manual log, no telephony).** Labels: VERIFIED 2. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Telephony / click-to-call integration.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |