---
title: "Authentication API Design"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-API-003 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Authentication API Design |
| Document ID | BM-API-003 |
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

Specify the proposed authentication api endpoints for the Django REST backend.

## Scope

8 endpoints under /api/v1.

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
| POST | `/api/v1/auth/login` | `(public)` | Sign in with username / email / mobile and password |
| POST | `/api/v1/auth/mfa` | `(public, mfa token)` | Verify TOTP for privileged roles |
| POST | `/api/v1/auth/refresh` | `(refresh cookie)` | Rotate access token |
| POST | `/api/v1/auth/logout` | `(authenticated)` | Revoke refresh token |
| POST | `/api/v1/auth/password/forgot` | `(public)` | Send reset code by email / SMS |
| POST | `/api/v1/auth/password/reset` | `(public)` | Reset with code |
| POST | `/api/v1/auth/password/change` | `(authenticated)` | Change own password |
| GET | `/api/v1/auth/me` | `(authenticated)` | Current user, roles, permissions, scope |

### POST `/api/v1/auth/login`

| Item | Specification |
|---|---|
| Purpose | Sign in with username / email / mobile and password |
| Authentication | None (public endpoint, rate limited) |
| Required permission | `(public)` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `{identifier, password, app: office or driver or customer}` |
| Response body | `{access, refresh_expires, user, roles, permissions, landing_path}` |
| Validation / errors | 400 validation; 401 invalid credentials; 423 locked (RULE-001); 403 inactive (RULE-002) |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/auth/mfa`

| Item | Specification |
|---|---|
| Purpose | Verify TOTP for privileged roles |
| Authentication | None (public endpoint, rate limited) |
| Required permission | `(public, mfa token)` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `{mfa_token, code}` |
| Response body | `{access, user}` |
| Validation / errors | 401 wrong code; 429 too many attempts |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/auth/refresh`

| Item | Specification |
|---|---|
| Purpose | Rotate access token |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `(refresh cookie)` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `{access}` |
| Validation / errors | 401 expired / revoked refresh token |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/auth/logout`

| Item | Specification |
|---|---|
| Purpose | Revoke refresh token |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `(authenticated)` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `204` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/auth/password/forgot`

| Item | Specification |
|---|---|
| Purpose | Send reset code by email / SMS |
| Authentication | None (public endpoint, rate limited) |
| Required permission | `(public)` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `{identifier}` |
| Response body | `202 (always, no user enumeration)` |
| Validation / errors | 429 rate limit |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/auth/password/reset`

| Item | Specification |
|---|---|
| Purpose | Reset with code |
| Authentication | None (public endpoint, rate limited) |
| Required permission | `(public)` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `{identifier, code, new_password}` |
| Response body | `204` |
| Validation / errors | 400 invalid / expired code; password policy (RULE-004) |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/auth/password/change`

| Item | Specification |
|---|---|
| Purpose | Change own password |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `(authenticated)` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `{current_password, new_password}` |
| Response body | `204` |
| Validation / errors | 400 policy; 401 wrong current password |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### GET `/api/v1/auth/me`

| Item | Specification |
|---|---|
| Purpose | Current user, roles, permissions, scope |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `(authenticated)` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `{user, roles, permissions, data_scope}` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `users` (**BM-DAT-003** (Data Dictionary (Proposed Production Schema))).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |