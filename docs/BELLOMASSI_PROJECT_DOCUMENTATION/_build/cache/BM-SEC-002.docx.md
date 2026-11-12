---
title: "Security Architecture"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-SEC-002 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Security Architecture |
| Document ID | BM-SEC-002 |
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

Describe the layered security architecture of the production platform, including API security, encryption and monitoring.

## Scope

PROPOSED production controls; prototype status for comparison.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SEC-001** (Security Requirements Document)
- **BM-ARC-001** (High-Level Design (HLD))
- **BM-INF-010** (Infrastructure Security, Scalability and Cloud Migration Plan)

## 1. Layers



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/e403496807c6.png){width=6.15cm}



## 2. API security — PROPOSED

| Control | Design |
|---|---|
| Authentication | Bearer JWT (15 min), refresh rotation, revocation list in Redis |
| Authorisation | DRF permission class per view mapped to permission keys; queryset scoped by role data scope |
| Input validation | Serializers with the prototype's rules; reject unknown fields |
| Output filtering | Never return password hashes, OTP values, secrets; mask phone / tax IDs for roles that do not need them |
| Rate limiting | Login 5/min/IP, OTP verify 5 per OTP, regenerate 3/10 min, general 600/min/user |
| CORS | Allow-list of web origins only |
| Idempotency | Keys on state-changing workflow endpoints |
| Error handling | No stack traces; correlation ID in responses |
| Webhooks | HMAC signature + timestamp tolerance |

## 3. Encryption

| Data | In transit | At rest |
|---|---|---|
| API / WebSocket | TLS 1.2+ | — |
| PostgreSQL | TLS between app and DB | Storage encryption (provider KMS / LUKS on-premises) |
| Object storage | TLS | Server-side encryption (KMS) |
| Backups | TLS | Encrypted with separate key |
| Secrets | TLS | Secrets manager (KMS) |
| Mobile app | TLS with certificate validation | Tokens in Keychain / Keystore |

## 4. Monitoring

Security events (failed logins, lockouts, permission changes, role grants, exports, OTP lock-outs, webhook failures)
forwarded to the central log platform with alerts — see **BM-SEC-008** (Audit Logging and Security Monitoring Policy).

## 5. Prototype comparison

None of these controls exist in the prototype except the permission model, lockout / idle-timeout logic and the audit log
— all running client-side (PROTOTYPE).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |