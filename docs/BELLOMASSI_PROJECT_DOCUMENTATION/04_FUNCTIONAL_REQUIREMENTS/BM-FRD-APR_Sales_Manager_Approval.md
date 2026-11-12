# Functional Requirements — Sales Manager Approval

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Sales Manager Approval |
| Document ID | BM-FRD-APR |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Sales Manager Approval |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Sales Manager Approval module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Sales Manager Approval module (/orders/approval).

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
| Module code | `APR` |
| Module name | Sales Manager Approval |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/orders/approval` |
| Services / components | `approvalService` |
| LocalStorage keys (prototype) | `bellomassi_orders, bellomassi_approvals` |


## 2. Purpose

Approve, return for correction or reject submitted orders after automatic checks.

## 3. Business objectives

Nothing ships without a recorded manager decision on value, quantity and credit.

Related business requirements: BR-002, BR-003, BR-004, BR-012.

## 4. User roles

- Finance Executive
- Sales Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `orders.approval.view`, `orders.approve`, `orders.reject`. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Order Approval | `/orders/approval` | `orders.approval.view` |
| Review Order | `/orders/approval/:id` | `orders.approval.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-APR-001 | P1 | Sales Managers shall see an approval queue of submitted orders, oldest first. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-002 | P1 | The system shall run six checks: customer active, hub active, credit within limit, stock available, total valid, products active. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-003 | P1 | Sales Managers shall approve orders; warnings must be acknowledged and remarks entered when required by settings. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-004 | P1 | Sales Managers shall return orders for correction with a reason from a list and remarks. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-005 | P1 | Sales Managers shall reject orders with a reason from a list and remarks. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-006 | P1 | Draft or already-decided orders shall not be decided again. | Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-APR-007 | P1 | The Sales Manager shall be able to set the approved value and quantity (SOW slide 8). | Sales Manager | PENDING CONFIRMATION | Pending client confirmation |
| FR-APR-008 | P1 | Finance shall be notified of approved orders, flagged when the credit limit is exceeded (SOW slides 8 and 16). | Sales Manager, Finance Executive | NOT IMPLEMENTED | Not implemented |

## 8. Input fields

Decision (approve / return / reject) · reason (return / rejection list) · remarks · warning acknowledgement

## 9. Validation rules

- **RULE-010** — Approval requires customer active, hub active, products active and total valid. _(enforced by `approvalService.getApprovalChecks`; message: "Cannot approve: …")_
- **RULE-011** — Credit over limit blocks approval only when "Block when credit exceeded" is on. _(enforced by `approvalService`; message: Warning or block.)_
- **RULE-012** — Warnings must be acknowledged before approval. _(enforced by `approvalService.approveOrder`; message: "Confirm that you have reviewed the credit and stock warnings.")_
- **RULE-013** — Approval remarks are required when the setting requires them. _(enforced by `approvalService.approveOrder`; message: "Approval remarks are required.")_
- **RULE-014** — Return and rejection need a reason from the list and remarks (minimum 5 characters by default). _(enforced by `approvalService`; message: Validation messages.)_
- **RULE-015** — Orders are decided once; drafts cannot be decided. _(enforced by `approvalService`; message: "…has already been approved. No change was made.")_

## 10. Business rules

- FR-APR-001: expected behaviour — Queue lists SUBMITTED / PENDING orders.
- FR-APR-002: expected behaviour — Checks displayed with pass / warn / block.
- FR-APR-003: expected behaviour — Status APPROVED, consolidation PENDING, Customer Service and salesman notified.
- FR-APR-004: expected behaviour — Status RETURNED; salesman notified with edit link.
- FR-APR-005: expected behaviour — Status REJECTED (final); salesman notified.
- FR-APR-006: expected behaviour — "…has already been approved. No change was made."

## 11. Workflow

See [BM-WF-04 — WF-04 — Sales Manager Approval Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-04_Sales_Manager_Approval_Workflow.md), [BM-WF-19 — WF-19 — Rejection Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-19_Rejection_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

SUBMITTED → APPROVED / RETURNED / REJECTED; approvalStatus PENDING → APPROVED / RETURNED / REJECTED. Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

## 13. Approval rules

- FR-APR-001: Sales Managers shall see an approval queue of submitted orders, oldest first.
- FR-APR-003: Sales Managers shall approve orders; warnings must be acknowledged and remarks entered when required by settings.
- FR-APR-005: Sales Managers shall reject orders with a reason from a list and remarks.
- FR-APR-007: The Sales Manager shall be able to set the approved value and quantity (SOW slide 8).
- FR-APR-008: Finance shall be notified of approved orders, flagged when the credit limit is exceeded (SOW slides 8 and 16).

## 14. Notifications

Salesman and Customer Service on approval; salesman on return / rejection; automation ORDER_APPROVED / ORDER_REJECTED.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-APR-N01 | Approve with unacknowledged warning | "Confirm that you have reviewed the credit and stock warnings." |
| TC-APR-N02 | Reject without reason | Validation error; order unchanged |
| TC-APR-N03 | Approve twice | "…has already been approved. No change was made." |
| TC-APR-N04 | Inactive customer blocks approval | Approve disabled: "Cannot approve: customer…" |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `bellomassi_orders, bellomassi_approvals`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

## 18. Reports

Approval reports (approval time, rejection reasons).

## 19. Audit requirements

Approval record (`bellomassi_approvals`) + order timeline event. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-APR-001 | Queue lists SUBMITTED / PENDING orders. | TC-APR-001 |
| FR-APR-002 | Checks displayed with pass / warn / block. | TC-APR-002, TC-APR-N04 |
| FR-APR-003 | Status APPROVED, consolidation PENDING, Customer Service and salesman notified. | TC-APR-003, TC-APR-N01 |
| FR-APR-004 | Status RETURNED; salesman notified with edit link. | TC-APR-004 |
| FR-APR-005 | Status REJECTED (final); salesman notified. | TC-APR-005, TC-APR-N02 |
| FR-APR-006 | "…has already been approved. No change was made." | TC-APR-006, TC-APR-N03 |
| FR-APR-007 | Not implemented: the prototype approves the order as submitted; return for correction is used instead. | TC-APR-007 |
| FR-APR-008 | Not implemented: approval notifies Customer Service and the salesman only. | TC-APR-008 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 6, PENDING CONFIRMATION 1, NOT IMPLEMENTED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Edit approved quantities (G-01), Finance notification (G-02), approval limits by value, delegation when manager absent.

- FR-APR-007 (PENDING CONFIRMATION): The Sales Manager shall be able to set the approved value and quantity (SOW slide 8).
- FR-APR-008 (NOT IMPLEMENTED): Finance shall be notified of approved orders, flagged when the credit limit is exceeded (SOW slides 8 and 16).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |