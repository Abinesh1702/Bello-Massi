---
title: "System Administration Guide"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-ADM-001 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | System Administration Guide |
| Document ID | BM-ADM-001 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Administration and Configuration |
| Related module(s) | All modules |
| Document owner | System Administrator |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Explain how administrators manage users, roles, permissions, organisation data and audit logs.

## Scope

Administration features of the prototype (VERIFIED). Production differences are marked PROPOSED.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- docs/RBAC_AND_ADMINISTRATION.md (existing document, reused)
- **BM-ADM-002** (Application Configuration Reference)
- **BM-ADM-003** (Master Data Management Guide)
- **BM-ADM-004** (Monitoring and Maintenance Guide)
- **BM-MAN-101** (Role User Manual — Super Admin)
- **BM-MAN-102** (Role User Manual — Administrator)
- **BM-SEC-004** (Authorization and RBAC Design)
- **BM-SEC-005** (RBAC and Access Control Matrix)

## 1. Administrator roles

| Role | Can do | Cannot do |
|---|---|---|
| Super Admin | Everything, including Super Admin accounts and locked system roles | Delete / deactivate own account |
| Administrator | Users, roles (non-locked), settings, master data, organisation, templates | Manage Super Admin accounts |

## 2. User management (`/admin/users`)

| Task | Steps |
|---|---|
| Create user | Users → Create → name, email, user name, phone, role, hub, department / designation; link to driver / customer / supplier record when needed → Save. First password is set and must be changed at first sign-in (setting) |
| Edit / change role | Open user → Edit → change role or additional roles → Save (audit logged) |
| Deactivate / activate | Row action → Deactivate (user cannot sign in) |
| Unlock | Row action → Unlock (after lockout) |
| Reset password | Row action → Reset password → new temporary password; force change at next sign-in |
| Role assignment | `/admin/role-assignment` — bulk view of users per role |

![User management (prototype screenshot)](screenshots/UX-USERS.png){width=15cm}

## 3. Roles and permissions (`/admin/roles`, `/admin/permissions`)

1. **Create role**: name, description, data scope, landing page, permission keys (grouped by module).
2. **Edit role**: system roles can be edited except locked keys; Super Admin role is locked.
3. **Permission matrix**: role × permission grid; changes apply at the user's next page load.
4. Custom roles get the workspace launcher dashboard.

Default grants: **BM-SEC-005** (RBAC and Access Control Matrix). Production: roles and permissions enforced on the server (PROPOSED, **BM-SEC-004** (Authorization and RBAC Design)).

## 4. Organisation set-up (`/admin/organization/*`)

Company profile, branches, business units, departments, designations, warehouses and employees. Company profile holds
country, base currency, time zone and tax registration — used by formatters and documents.

## 5. Audit log (`/admin/audit-logs`)

Every create / update / delete, sign-in, failed sign-in, lockout, permission change and setting change is written with
user, time, entity and description. Filter by user, module, action and date; export CSV. In the prototype the log is
kept in the browser (VERIFIED); production keeps it in the database with retention (**BM-SEC-008** (Audit Logging and Security Monitoring Policy)).

## 6. Daily / weekly admin checklist

| Frequency | Check |
|---|---|
| Daily | Locked accounts, failed sign-ins, notifications for document expiry |
| Weekly | Users without sign-in for 30 days; drivers / vehicles with expiring documents (VMS) |
| Monthly | Role and permission review; leavers deactivated |
| On change | Settings changes recorded with reason |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |