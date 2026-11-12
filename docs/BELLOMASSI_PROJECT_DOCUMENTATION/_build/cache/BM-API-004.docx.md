---
title: "User API Design"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-API-004 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | User API Design |
| Document ID | BM-API-004 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | API and Integration |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the proposed user api endpoints for the Django REST backend.

## Scope

14 endpoints under /api/v1.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-API-001** (API Specification (Overview and Conventions))
- **BM-API-002** (API Endpoint Catalogue)
- **BM-SEC-003** (Authentication, Password, MFA and Session Management Design)

## 1. Status

**PROPOSED.** No API exists in the prototype; the same behaviour is implemented today by browser services (see section 4). Paths, payloads and codes will be finalised during backend design.

## 2. Endpoints

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| GET | `/api/v1/users` | `users.view` | List users with filters (role, hub, status, search) |
| POST | `/api/v1/users` | `users.manage` | Create user |
| GET | `/api/v1/users/{id}` | `users.view` | User detail |
| PATCH | `/api/v1/users/{id}` | `users.manage` | Update user |
| POST | `/api/v1/users/{id}/deactivate` | `users.manage` | Deactivate |
| POST | `/api/v1/users/{id}/activate` | `users.manage` | Activate |
| POST | `/api/v1/users/{id}/unlock` | `users.manage` | Clear lockout |
| POST | `/api/v1/users/{id}/reset-password` | `users.manage` | Admin reset; forces change on next sign-in |
| PUT | `/api/v1/users/{id}/roles` | `users.edit` | Assign roles and home hub |
| GET | `/api/v1/roles` | `roles.view` | List roles |
| POST | `/api/v1/roles` | `roles.create` | Create custom role |
| PATCH | `/api/v1/roles/{id}` | `roles.edit` | Update role / permissions |
| GET | `/api/v1/permissions` | `roles.view` | Permission catalogue (110 keys) |
| GET | `/api/v1/audit-logs` | `audit.view` | Audit trail with filters |

### GET `/api/v1/users`

| Item | Specification |
|---|---|
| Purpose | List users with filters (role, hub, status, search) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `users.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `page<User>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/users`

| Item | Specification |
|---|---|
| Purpose | Create user |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `users.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `User (without password_hash) + temporary_password` |
| Response body | `User` |
| Validation / errors | 400 validation; 409 duplicate username / email |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### GET `/api/v1/users/{id}`

| Item | Specification |
|---|---|
| Purpose | User detail |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `users.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `User` |
| Validation / errors | 404 |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### PATCH `/api/v1/users/{id}`

| Item | Specification |
|---|---|
| Purpose | Update user |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `users.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `partial User` |
| Response body | `User` |
| Validation / errors | 403 Super Admin protection (RULE-005) |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/users/{id}/deactivate`

| Item | Specification |
|---|---|
| Purpose | Deactivate |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `users.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `User` |
| Validation / errors | 400 cannot deactivate self (RULE-005) |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/users/{id}/activate`

| Item | Specification |
|---|---|
| Purpose | Activate |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `users.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `User` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/users/{id}/unlock`

| Item | Specification |
|---|---|
| Purpose | Clear lockout |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `users.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `User` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/users/{id}/reset-password`

| Item | Specification |
|---|---|
| Purpose | Admin reset; forces change on next sign-in |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `users.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `{temporary_password_sent: true}` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### PUT `/api/v1/users/{id}/roles`

| Item | Specification |
|---|---|
| Purpose | Assign roles and home hub |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `users.edit` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{role_ids[], home_hub_id}` |
| Response body | `User` |
| Validation / errors | 400 driver needs hub |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### GET `/api/v1/roles`

| Item | Specification |
|---|---|
| Purpose | List roles |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `roles.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<Role>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/roles`

| Item | Specification |
|---|---|
| Purpose | Create custom role |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `roles.create` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `Role + permission_keys[]` |
| Response body | `Role` |
| Validation / errors | 409 duplicate code |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### PATCH `/api/v1/roles/{id}`

| Item | Specification |
|---|---|
| Purpose | Update role / permissions |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `roles.edit` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `partial Role` |
| Response body | `Role` |
| Validation / errors | 403 locked role |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### GET `/api/v1/permissions`

| Item | Specification |
|---|---|
| Purpose | Permission catalogue (110 keys) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `roles.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<Permission>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### GET `/api/v1/audit-logs`

| Item | Specification |
|---|---|
| Purpose | Audit trail with filters |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `audit.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `page<AuditLog>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `users` (**BM-DAT-003** (Data Dictionary (Proposed Production Schema))).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |