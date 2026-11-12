---
title: "Limitations Document — Prototype vs Production"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-HND-011 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Limitations Document — Prototype vs Production |
| Document ID | BM-HND-011 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Client Handover |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

State clearly what the prototype does not do and what production requires.

## Scope

Prototype data version 8 (VERIFIED from source and FINALISATION.md).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-HND-010** (Known Issues Register)
- **BM-OVW-015** (Project Status and Implementation Summary)
- **BM-DOC-003** (Gap Analysis — Scope of Work, Prototype and Documentation)

## 1. Limitations

| # | Limitation | Consequence | Production requirement |
|---|---|---|---|
| L-01 | Frontend only, LocalStorage | Data in one browser; no sharing; no backup | Django API + PostgreSQL |
| L-02 | Browser-side authentication and RBAC | Not secure; can be bypassed | Server-side auth (JWT), MFA for admins, server RBAC |
| L-03 | DEMO GPS | No real vehicle positions | React Native background GPS + WebSockets |
| L-04 | OTP not sent | Customer must see OTP in the app | SMS / WhatsApp provider |
| L-05 | Delivery note not sent | Customer opens app to see it | Messaging / email sending |
| L-06 | Email / WhatsApp / AI / OCR in demo mode | No real messages, OCR or AI | Providers via gateway / backend |
| L-07 | No SAP integration | Masters maintained manually | Stage-2 SAP interface |
| L-08 | Web driver app | No background tracking, offline, push | Native app |
| L-09 | 24 reports without data | Empty by design | Capture payments, expenses etc. if needed |
| L-10 | No automated tests in repository | Verification not reproducible | Test suites in CI |
| L-11 | Demo data in India format | Not representative of a UAE operation | Client master data |
| L-12 | No monitoring, backups, DR | — | **BM-INF-008** (Monitoring, Logging and Alerting Plan), **BM-INF-009** (Backup and Disaster Recovery Plan) |

Known defects: **BM-HND-010** (Known Issues Register).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |