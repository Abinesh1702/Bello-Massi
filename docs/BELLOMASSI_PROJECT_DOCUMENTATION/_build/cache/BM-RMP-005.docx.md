---
title: "Cloud, Security, Performance, Reporting and Monitoring Roadmap"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-RMP-005 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Cloud, Security, Performance, Reporting and Monitoring Roadmap |
| Document ID | BM-RMP-005 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Future Roadmap |
| Related module(s) | All modules |
| Document owner | DevOps Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Plan the operational tracks — cloud deployment, production security, performance, reporting and monitoring / analytics.

## Scope

PROPOSED.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-RMP-001** (Prototype-to-Production Migration Roadmap (Master))
- **BM-INF-002** (Hosting Options — Cloud vs On-Premises Comparison)
- **BM-SEC-001** (Security Requirements Document)
- **BM-INF-008** (Monitoring, Logging and Alerting Plan)

| Track | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|---|---|---|---|---|
| Cloud deployment (**BM-INF-002** (Hosting Options — Cloud vs On-Premises Comparison)) | Hosting decision; IaC; test env | Staging | Production, DR | Autoscaling, cost optimisation |
| Production security (**BM-SEC-001** (Security Requirements Document)) | Threat model, secure coding, secrets | SAST / DAST in CI | Pen test, ASVS L2 review, incident runbook | ISO 27001 / SOC 2 only if required (no certification exists) |
| Performance | Targets agreed (NFR) | k6 scripts | Load test on staging, tuning | Read replica, caching |
| Reporting | Go-live report set (server queries) | Exports | Scheduled reports | BI / data warehouse |
| Monitoring and analytics (**BM-INF-008** (Monitoring, Logging and Alerting Plan)) | Structured logs, Sentry | Metrics, alerts | Dashboards, on-call | Product analytics, business KPIs |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |