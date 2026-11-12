# Functional Requirements — User Management

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — User Management |
| Document ID | BM-FRD-USR |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | User Management |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the User Management module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the User Management module (/admin/users, /admin/role-assignment).

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
| Module code | `USR` |
| Module name | User Management |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/admin/users, /admin/role-assignment` |
| Services / components | `userService` |
| LocalStorage keys (prototype) | `bellomassi_demo_users, bellomassi_audit_logs` |


## 2. Purpose

Create and maintain user accounts, hub assignment, portal links, activation, unlock and password reset.

## 3. Business objectives

Administrators control who can use the platform, with which role, hub and portal link.

Related business requirements: BR-013.

## 4. User roles

- Administrator
- All signed-in users
- Super Admin

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `users.view`, `users.create`, `users.edit`, `users.delete`, `users.manage`. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| User Management | `/admin/users` | `users.view` |
| User Role Assignment | `/admin/role-assignment` | `users.manage` |
| Create User | `/admin/users/create` | `users.create` |
| Edit User | `/admin/users/:id/edit` | `users.edit` |
| User Details | `/admin/users/:id` | `users.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-USR-001 | P1 | Administrators shall create users with name, username, email, phone, role, home hub and (for portal users) the linked customer, driver or supplier. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-USR-002 | P1 | Administrators shall activate, deactivate, unlock and reset passwords of users. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-USR-003 | P1 | The system shall prevent users from deactivating their own account and only a Super Admin shall change a Super Admin. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-USR-004 | P2 | Administrators shall assign roles and the home hub to users in bulk. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-USR-005 | P2 | Users shall update their own name and phone and change their password. | All signed-in users | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Name · username · email · phone · role(s) · home hub · linked customer / driver / supplier · status · temporary password

## 9. Validation rules

- **RULE-005** — Users cannot deactivate themselves; only Super Admin changes Super Admin; drivers need a home hub. _(enforced by `userService`; message: Specific messages.)_

## 10. Business rules

- FR-USR-001: expected behaviour — User appears in the list and can sign in.
- FR-USR-002: expected behaviour — Status changes are effective at the next sign-in and recorded in the audit log.
- FR-USR-003: expected behaviour — "You cannot deactivate your own account." / "Only a Super Admin can change a Super Admin account."
- FR-USR-004: expected behaviour — Assignments saved; drivers require a home hub.
- FR-USR-005: expected behaviour — Profile saved after validation (name 2–60 characters).

## 11. Workflow

See [BM-WF-01 — WF-01 — Overall Business Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-01_Overall_Business_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

User: active ↔ inactive; locked → unlocked. Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None (audit only).

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `bellomassi_demo_users, bellomassi_audit_logs`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

## 18. Reports

User reports via Reports Center (Administration category where permitted).

## 19. Audit requirements

Create, update, activate, deactivate, delete, reset password, unlock, role change — all in `bellomassi_audit_logs`. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-USR-001 | User appears in the list and can sign in. | TC-USR-001 |
| FR-USR-002 | Status changes are effective at the next sign-in and recorded in the audit log. | TC-USR-002 |
| FR-USR-003 | "You cannot deactivate your own account." / "Only a Super Admin can change a Super Admin account." | TC-USR-003 |
| FR-USR-004 | Assignments saved; drivers require a home hub. | TC-USR-004 |
| FR-USR-005 | Profile saved after validation (name 2–60 characters). | TC-USR-005 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 5. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Self-service password reset by email / SMS, bulk import, SSO provisioning, last-login and session list per user.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |