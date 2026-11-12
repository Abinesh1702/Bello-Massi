---
title: "User Acceptance Testing (UAT) Plan"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-QA-003 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | User Acceptance Testing (UAT) Plan |
| Document ID | BM-QA-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Testing and Quality Assurance |
| Related module(s) | All modules |
| Document owner | QA Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Plan how client users will accept the system — participants, scenarios, process and sign-off.

## Scope

UAT has not started. Participants, dates and acceptance are PENDING CONFIRMATION. Signature fields are intentionally blank.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-QA-012** (UAT Test Cases)
- **BM-QA-001** (Test Strategy)
- **BM-HND-001** (Client Handover Document)

## 1. Objectives

Confirm that the system supports the client's order-to-delivery process for each role, with real-like data and devices,
before go-live.

## 2. Participants (to be nominated by the client)

| Role | Name | Department | Nominated |
|---|---|---|---|
| Salesman |  |  | ☐ |
| Sales Manager |  |  | ☐ |
| Customer Service |  |  | ☐ |
| Dispatcher |  |  | ☐ |
| Driver (2+) |  |  | ☐ |
| Finance |  |  | ☐ |
| Administrator |  |  | ☐ |
| Customer representative (if customer app in scope) |  |  | ☐ |

## 3. Scenarios

18 UAT cases in **BM-QA-012** (UAT Test Cases) covering order capture → approval → consolidation → dispatch → delivery with OTP / POD
→ delivery note → exception review, plus master data, users / roles and reports.

## 4. Process

1. Kick-off and training (role manuals **BM-MAN-003** (Office Web Application User Manual (All Office Roles))).
2. Users execute cases in staging, record result and evidence.
3. Defects logged per **BM-QA-004** (Defect Management Process and Bug Report Template); daily triage.
4. Fix, redeploy, retest.
5. UAT summary (**BM-QA-006** (Test Summary Report (Template) and Quality Metrics)) and sign-off.

## 5. Acceptance criteria

All UAT cases executed; no open Critical / High defects; Medium defects have an agreed plan; client confirms business
readiness.

## 6. Sign-off (blank — to be completed by the client)

| Role | Name | Decision (Accept / Accept with conditions / Reject) | Signature | Date |
|---|---|---|---|---|
| Client business owner |  |  |  |  |
| Client operations lead |  |  |  |  |
| Delivery project manager |  |  |  |  |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |