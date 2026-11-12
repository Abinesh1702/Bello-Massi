---
title: "Go-Live and Cutover Plan"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-DEP-004 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Go-Live and Cutover Plan |
| Document ID | BM-DEP-004 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Deployment and Release |
| Related module(s) | All modules |
| Document owner | Project Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Plan the move from current manual / prototype operation to the production platform.

## Scope

PROPOSED. Go-live date, pilot hub and participants are PENDING CONFIRMATION. Go-live has not happened.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-DEP-002** (Deployment Guide and Runbook)
- **BM-DEP-005** (Rollback Plan)
- **BM-DAT-004** (Data Migration Strategy)
- **BM-QA-003** (User Acceptance Testing (UAT) Plan)
- **BM-HND-001** (Client Handover Document)

## 1. Approach

Pilot first (one hub, a small group of drivers and salesmen, 2–4 weeks), then phased rollout to remaining hubs. Parallel
run of the existing order process during the pilot as fallback.

## 2. Readiness criteria

| Area | Criterion |
|---|---|
| UAT | Signed (**BM-QA-003** (User Acceptance Testing (UAT) Plan)) |
| Data | Master data loaded and reconciled (**BM-DAT-004** (Data Migration Strategy)) |
| Users | Accounts created, roles assigned, training done |
| Devices | Driver phones with app installed, permissions granted |
| Integrations | Maps, SMS / WhatsApp, email live and tested |
| Support | Hypercare team and contacts published (**BM-HND-014** (Support and Maintenance Agreement (Draft))) |
| Rollback | Plan rehearsed (**BM-DEP-005** (Rollback Plan)) |

## 3. Cutover timeline (relative)

| When | Activity | Owner |
|---|---|---|
| T-10 days | Readiness review; freeze master data changes | PM |
| T-5 days | Final data extract and trial load | Data lead |
| T-2 days | Production deployment; smoke tests | DevOps |
| T-1 day | Final delta load; user accounts activated; go / no-go meeting | PM, client |
| T (go-live) | First orders entered in the new system; dispatch from system; hypercare on site | All |
| T+1…T+14 | Hypercare: daily stand-up, defect triage, adoption monitoring | Support |
| T+30 | Pilot review; decision on rollout | Client steering |

## 4. Go / no-go record (blank)

| Date | Decision | Conditions | Client approver | Signature |
|---|---|---|---|---|
|  |  |  |  |  |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |