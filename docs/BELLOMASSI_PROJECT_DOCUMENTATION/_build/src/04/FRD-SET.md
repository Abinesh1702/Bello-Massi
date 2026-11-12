---
id: "BM-FRD-SET"
title: "Functional Requirements — System Settings and Audit"
folder: "04"
file: "BM-FRD-SET_System_Settings_and_Audit"
category: "Functional Requirements"
owner: "Business Analyst"
module: "System Settings and Audit"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the System Settings and Audit module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the System Settings and Audit module (/admin/settings, /admin/audit-logs)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `SET` |
| Module name | System Settings and Audit |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/admin/settings, /admin/audit-logs` |
| Services / components | `appSettingsService, auditService, storageService` |
| LocalStorage keys (prototype) | `bellomassi_settings, bellomassi_audit_logs` |


## 2. Purpose

Application settings (security, approval, inventory, localisation), audit log, data reset and export.

## 3. Business objectives

Behaviour is configured centrally and changes are traceable.

Related business requirements: BR-030.

## 4. User roles

- Administrator
- Super Admin

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `settings.view`, `settings.manage`, `audit.view`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Audit Log | `/admin/audit-logs` | `audit.view` |
| Application Settings | `/admin/settings` | `settings.view` |
| My Profile | `/profile` | `—` |
| Preferences | `/settings` | `—` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-SET-001 | P1 | Administrators shall configure security, approval, localisation, numbering, inventory, warehouse and cold-chain settings. | Administrator | VERIFIED | Implemented and working (prototype) |
| FR-SET-002 | P1 | Administrative and security events shall be recorded in the audit log. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-SET-003 | P2 | Administrators shall reset demo data and export / import the application data. | Administrator | VERIFIED | Implemented and working (prototype) |
| FR-SET-004 | P1 | Production data shall be stored in PostgreSQL with daily backups, point-in-time recovery and audit fields on every table. | Administrator | PROPOSED | Planned (production) |

## 8. Input fields

Security, approval, localisation, numbering, inventory, warehouse, cold-chain settings

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-SET-001: expected behaviour — Settings validated and applied.
- FR-SET-002: expected behaviour — User, role, settings and lockout events listed.
- FR-SET-003: expected behaviour — Data reset to seed; JSON export validated on import.

## 11. Workflow

See {{ref:BM-WF-01}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

— Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

- FR-SET-001: Administrators shall configure security, approval, localisation, numbering, inventory, warehouse and cold-chain settings.

## 14. Notifications

—

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-LS-N01 | LocalStorage blocked | App runs in memory; storage issue reported; data not persisted |
| TC-LS-N02 | Data persists after reload | Draft still present (LocalStorage) |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_settings, bellomassi_audit_logs`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Audit log.

## 19. Audit requirements

Every settings change audited. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-SET-001 | Settings validated and applied. | TC-SET-001 |
| FR-SET-002 | User, role, settings and lockout events listed. | TC-SET-002 |
| FR-SET-003 | Data reset to seed; JSON export validated on import. | TC-SET-003 |
| FR-SET-004 | Data shared across users and devices. | TC-SET-004 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 3, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Environment-specific configuration, feature flags, settings history with rollback.

- FR-SET-004 (PROPOSED): Production data shall be stored in PostgreSQL with daily backups, point-in-time recovery and audit fields on every table.
