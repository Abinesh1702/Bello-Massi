---
title: "Data Protection, Encryption and Backup Security Policy"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-SEC-006 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Data Protection, Encryption and Backup Security Policy |
| Document ID | BM-SEC-006 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Security and Compliance |
| Related module(s) | All modules |
| Document owner | Security Architect / Data Protection Officer (client) |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define how data is protected — classification, encryption, access, minimisation, backups and disposal.

## Scope

Production platform. Applicable laws (UAE PDPL, India DPDP Act 2023) depend on the confirmed operating country — PENDING CONFIRMATION.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SEC-001** (Security Requirements Document)
- **BM-SEC-007** (Privacy Policy (Draft))
- **BM-DAT-005** (Data Retention Policy (Draft))
- **BM-INF-009** (Backup and Disaster Recovery Plan)

## 1. Principles — PROPOSED

Lawful purpose · minimisation · least privilege · encryption in transit and at rest · retention limits (**BM-DAT-005** (Data Retention Policy (Draft))) ·
accountability through audit.

## 2. Encryption policy

| Item | Standard |
|---|---|
| Transport | TLS 1.2+ only; strong ciphers; HSTS |
| Database, object storage, backups | AES-256 at rest with KMS-managed keys; key rotation yearly |
| Sensitive fields (tax IDs, phone numbers) | Optional application-level encryption; masked in UI for roles without need |
| OTP | One-way hash (HMAC-SHA-256 with secret pepper) |
| Passwords | Argon2id |
| Mobile devices | Tokens in OS keystore; no business data cached beyond the day's deliveries |

## 3. Access to data

Role scope as in **BM-SEC-004** (Authorization and RBAC Design); production database access only via the application; DBA access through bastion with
MFA and session logging; no production data in development or test (masked copies only).

## 4. Backup security

Encrypted backups in a separate account / location; access limited to two named operators; restore tests quarterly;
backup deletion protected (object lock).

## 5. Disposal

Expired data deleted or anonymised by scheduled jobs; devices wiped on driver exit; certificates of deletion for
decommissioned storage.

## 6. Prototype

No encryption or protection — the prototype must contain demo data only (VERIFIED: seeded fictitious data).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |