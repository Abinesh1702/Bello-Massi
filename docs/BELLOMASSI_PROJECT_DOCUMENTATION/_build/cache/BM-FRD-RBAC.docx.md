---
title: "Functional Requirements — Role and Permission Management"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-RBAC · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Role and Permission Management |
| Document ID | BM-FRD-RBAC |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Role and Permission Management |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Role and Permission Management module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Role and Permission Management module (/admin/roles, /admin/permissions).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SYS-002** (Software Requirements Specification (SRS))
- **BM-SYS-003** (Functional Requirements Document (Consolidated))
- **BM-SYS-008** (Requirement Traceability Matrix)
- **BM-QA-011** (Functional Test Cases)

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
| Module code | `RBAC` |
| Module name | Role and Permission Management |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/admin/roles, /admin/permissions` |
| Services / components | `rbacService, config/permissions.js, config/rbacCatalog.js` |
| LocalStorage keys (prototype) | `bellomassi_roles, bellomassi_permissions` |


## 2. Purpose

System and custom roles, 110 permission keys, data scopes, landing pages, permission matrix.

## 3. Business objectives

Each role sees and does only what it needs; access is enforced in the business layer.

Related business requirements: BR-013.

## 4. User roles

- Administrator
- All signed-in users
- Super Admin

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `roles.view`, `roles.create`, `roles.edit`, `roles.delete`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Role Management | `/admin/roles` | `roles.view` |
| Permission Matrix | `/admin/permissions` | `roles.view` |
| Create Role | `/admin/roles/create` | `roles.create` |
| Edit Role | `/admin/roles/:id/edit` | `roles.edit` |
| Role Details | `/admin/roles/:id` | `roles.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-RBAC-001 | P1 | The system shall provide 13 system roles with default permissions, data scopes and landing pages. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-RBAC-002 | P1 | Administrators shall create custom roles with a name, data scope, landing page and any set of the 110 permission keys. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-RBAC-003 | P1 | Administrators shall view and edit the permission matrix for editable roles. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-RBAC-004 | P1 | Every business action shall be checked against the user's permissions in the service layer, not only by hiding buttons. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-RBAC-005 | P1 | Lists shall be limited by data scope: own records (Salesman), linked customer (Customer), own deliveries (Driver), etc. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-RBAC-006 | P1 | Production APIs shall enforce the same permission keys and data scopes server-side. | All signed-in users | PROPOSED | Planned (production) |

## 8. Input fields

Role name · code · description · data scope · landing page · permission keys · status

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-RBAC-001: expected behaviour — Roles listed with permission counts; locked roles cannot be deleted.
- FR-RBAC-002: expected behaviour — Users with the custom role see only permitted menus and a workspace launcher dashboard.
- FR-RBAC-003: expected behaviour — Matrix changes take effect immediately in menus and services.
- FR-RBAC-004: expected behaviour — Service returns a permission error when called without the key.
- FR-RBAC-005: expected behaviour — Salesman sees only own orders; driver cannot open another driver's delivery.

## 11. Workflow

See **BM-WF-01** (WF-01 — Overall Business Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Role: active / inactive; system / protected / locked flags. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_roles, bellomassi_permissions`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Permission matrix export.

## 19. Audit requirements

Role created / changed / deleted, permission changes. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-RBAC-001 | Roles listed with permission counts; locked roles cannot be deleted. | TC-RBAC-001 |
| FR-RBAC-002 | Users with the custom role see only permitted menus and a workspace launcher dashboard. | TC-RBAC-002 |
| FR-RBAC-003 | Matrix changes take effect immediately in menus and services. | TC-RBAC-003 |
| FR-RBAC-004 | Service returns a permission error when called without the key. | TC-RBAC-004 |
| FR-RBAC-005 | Salesman sees only own orders; driver cannot open another driver's delivery. | TC-RBAC-005, TC-DRV-N04, TC-CAP-N03 |
| FR-RBAC-006 | API returns 403 for missing permission and 404 for out-of-scope records. | TC-RBAC-006 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 5, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Server-side permission classes, object-level permissions, role approval workflow for privileged grants.

- FR-RBAC-006 (PROPOSED): Production APIs shall enforce the same permission keys and data scopes server-side.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |