# Functional Requirements — Credit Validation

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Credit Validation |
| Document ID | BM-FRD-CRD |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Credit Validation |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Credit Validation module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Credit Validation module (/customers/credit, /orders/approval/:id).

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
| Module code | `CRD` |
| Module name | Credit Validation |
| Current implementation status | **Implemented with limitations (balance is a manual field; no payments)** |
| Main routes | `/customers/credit, /orders/approval/:id` |
| Services / components | `customerService.getOrderCreditPosition, approvalService` |
| LocalStorage keys (prototype) | `bellomassi_customers` |


## 2. Purpose

Credit limit check on every order, warning or block at approval, customer credit overview.

## 3. Business objectives

Credit exposure is visible and controlled at the moment of approval.

Related business requirements: BR-003, BR-018.

## 4. User roles

- Administrator
- Finance Executive
- Sales Executive (Salesman)
- Sales Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `customers.credit.view`. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Customer Credit | `/customers/credit` | `customers.credit.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-CRD-001 | P1 | The system shall calculate the projected balance (current balance + order total) against the credit limit for every order. | Sales Executive (Salesman), Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-CRD-002 | P1 | Exceeding the credit limit shall be a warning by default and a blocking check when "Block when credit exceeded" is enabled. | Sales Manager, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-CRD-003 | P2 | Users shall view credit limits, balances and utilisation for all customers. | Administrator, Sales Manager, Finance Executive | VERIFIED | Implemented and working (prototype) |
| FR-CRD-004 | P1 | Customer balances shall be updated from invoices and payments. | Finance Executive | NOT IMPLEMENTED | Not implemented |
| FR-CRD-005 | P2 | Credit balances shall be synchronised from the finance system (SAP) in production. | Finance Executive | PROPOSED | Planned (production) |

## 8. Input fields

Credit enabled · credit limit · credit balance · credit days (customer master) · Application Settings › Approval: block when credit exceeded

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-CRD-001: expected behaviour — Credit position shown on order and approval screens.
- FR-CRD-002: expected behaviour — Approve is disabled when blocking is on and the limit is exceeded.
- FR-CRD-003: expected behaviour — Customer Credit page lists utilisation and over-limit customers.

## 11. Workflow

See [BM-WF-06 — WF-06 — Credit Validation Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-06_Credit_Validation_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Not applicable (check result: within limit / warning / block). Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Warning flag on approval notification.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-CRD-N01 | Credit block setting | Approve disabled; reason shown |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `bellomassi_customers`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

## 18. Reports

Credit utilisation, over-limit customers (Customer and Finance categories).

## 19. Audit requirements

Approval record stores the credit warning flag. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-CRD-001 | Credit position shown on order and approval screens. | TC-CRD-001 |
| FR-CRD-002 | Approve is disabled when blocking is on and the limit is exceeded. | TC-CRD-002, TC-CRD-N01 |
| FR-CRD-003 | Customer Credit page lists utilisation and over-limit customers. | TC-CRD-003 |
| FR-CRD-004 | Not implemented: balance is a manually maintained field; payments are not recorded. | TC-CRD-004 |
| FR-CRD-005 | Balance reflects ERP receivables. | TC-CRD-005 |

## 21. Current implementation status

**Implemented with limitations (balance is a manual field; no payments).** Labels: VERIFIED 3, NOT IMPLEMENTED 1, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Balance from ERP receivables, payment posting, credit holds, Finance notification on exceptions.

- FR-CRD-004 (NOT IMPLEMENTED): Customer balances shall be updated from invoices and payments.
- FR-CRD-005 (PROPOSED): Credit balances shall be synchronised from the finance system (SAP) in production.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |