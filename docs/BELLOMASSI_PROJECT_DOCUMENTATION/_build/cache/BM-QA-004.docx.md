---
title: "Defect Management Process and Bug Report Template"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-QA-004 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Defect Management Process and Bug Report Template |
| Document ID | BM-QA-004 |
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

Define how defects are reported, classified, fixed, verified and closed, with a standard bug report template.

## Scope

All test phases and post-go-live support (PROPOSED).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-QA-001** (Test Strategy)
- **BM-QA-005** (Test Execution Report (Template))

## 1. Severity

| Severity | Definition | Example |
|---|---|---|
| Critical | System unusable, data loss / corruption, security breach, no workaround | Dispatch confirm deducts stock twice |
| High | Major function fails, workaround difficult | OTP cannot be verified |
| Medium | Function partly fails, workaround exists | Report filter wrong |
| Low | Cosmetic / text | Label misspelt |

## 2. Priority

P1 fix immediately · P2 fix in current cycle · P3 fix in next release · P4 backlog.

## 3. Workflow



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/5c8a24cf224f.png){width=10.53cm}



## 4. Bug report template

| Field | Content |
|---|---|
| Defect ID | BUG-#### (tool generated) |
| Title | Short description: what fails where |
| Module / screen | e.g. Dispatch — Confirm dispatch (`/dispatch/:id`) |
| Environment / build | Test / staging, build version |
| Role used | e.g. Dispatcher |
| Preconditions / data | Order number, dispatch number |
| Steps to reproduce | Numbered |
| Expected result | From test case / FRD |
| Actual result | What happened |
| Evidence | Screenshot, video, log, request id |
| Severity / priority | As above |
| Related test case / requirement | TC-…, FR-… |
| Reported by / date |  |
| Assigned to |  |
| Fix version / resolution |  |
| Retest result / date |  |

## 5. Tooling

Jira, Azure Boards or GitHub Issues (client choice — PENDING CONFIRMATION). Daily triage during test cycles.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |