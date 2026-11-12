---
title: "Authentication, Password, MFA and Session Management Design"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-SEC-003 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Authentication, Password, MFA and Session Management Design |
| Document ID | BM-SEC-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Security and Compliance |
| Related module(s) | All modules |
| Document owner | Security Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify authentication, password policy, MFA strategy and session management for production, compared with the prototype.

## Scope

Office web app, Drivers App, customer app.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SEC-001** (Security Requirements Document)
- **BM-API-003** (Authentication API Design)
- **BM-FRD-AUTH** (Functional Requirements — Authentication and Login)

## 1. Authentication design

| Aspect | Prototype (VERIFIED) | Production (PROPOSED) |
|---|---|---|
| Identifier | Email / username (office); mobile / email / username (driver, customer) | Same |
| Credential store | `bellomassi_demo_users`, FNV-1a demo hash | PostgreSQL `users.password_hash`, Argon2id |
| Tokens | Client session object | JWT access 15 min + refresh 8 h (office) / 30 days rotating (mobile, device-bound) |
| Lockout | 5 attempts / 15 min (Settings) | Same + IP throttling + alert |
| Inactive users | Blocked | Blocked |
| Forced change | After admin reset | After admin reset and first login |
| Reset | 6-digit code shown on screen | Code / link sent by email or SMS, 15-minute expiry, single use |
| Flow diagram | — | **BM-DGM-001** (Diagram Catalogue and Visual Documentation) (DGM-15) |

## 2. Password policy — PROPOSED

Minimum 10 characters (prototype default 8); upper, lower, digit; check against breached-password list; no reuse of
last 5; no expiry (NIST 800-63B) unless the client requires it; admin-set temporary passwords expire in 24 h.

## 3. MFA strategy — PROPOSED

| Role | MFA |
|---|---|
| Super Admin, Administrator, Finance | Mandatory TOTP (authenticator app) |
| Sales Manager, Dispatcher, Customer Service | Recommended; configurable |
| Salesman, Warehouse roles | Optional |
| Driver | Device binding + PIN on the app (no TOTP) |
| Customer | OTP by SMS for sign-in (optional) |

## 4. Session management

| Rule | Value |
|---|---|
| Idle timeout | 60 min office (configurable 5–1440, as prototype); mobile: token refresh, re-auth after 30 days |
| Absolute session | 12 h office |
| Concurrent sessions | Allowed; listed per user; admin can revoke |
| Logout | Revokes refresh token; clears local storage of tokens |
| Remember me | Office: longer refresh only on trusted devices |
| Storage | Web: refresh token in httpOnly Secure SameSite cookie; access token in memory |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |