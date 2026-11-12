---
title: "Infrastructure Security, Scalability and Cloud Migration Plan"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-INF-010 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Infrastructure Security, Scalability and Cloud Migration Plan |
| Document ID | BM-INF-010 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Infrastructure and DevOps |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Infrastructure hardening controls, scaling approach and the path from the browser prototype to the hosted platform.

## Scope

PROPOSED.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-INF-003** (Infrastructure, Network Architecture and Server Specification)
- **BM-SEC-001** (Security Requirements Document)
- **BM-DAT-004** (Data Migration Strategy)
- **BM-PLN-001** (Scope and Phase Plan)

## 1. Infrastructure security controls

| Control | Detail |
|---|---|
| Network | Private subnets for app and data; security groups least privilege; no public DB |
| Edge | WAF with managed rules, rate limiting, DDoS protection, TLS 1.2+ only, HSTS |
| Identity | Cloud IAM with MFA, no shared accounts, role-based admin, break-glass account |
| Secrets | Secrets manager; rotation every 90 days or on staff change |
| Encryption | At rest (DB, storage, backups) with managed keys; in transit everywhere |
| Hosts / images | Minimal base images, patched monthly, image scanning, no SSH to containers |
| Logging | Cloud audit trail enabled, retained 1 year |
| Access review | Quarterly review of cloud and application admin accounts |

## 2. Scalability

| Component | Scaling | Trigger |
|---|---|---|
| API | Horizontal (stateless) | CPU > 60 % / latency |
| Channels | Horizontal with Redis layer | Connections |
| Workers | Horizontal per queue | Queue length |
| PostgreSQL | Vertical, then read replica for reports | CPU / IO |
| location_points | Monthly partitions, archive older than retention | Size |
| Static web | CDN | — |

Load targets are NOT VERIFIED; performance tests in staging must confirm them (**BM-QA-001** (Test Strategy)).

## 3. Migration from prototype to hosted platform

| Step | Activity |
|---|---|
| 1 | Freeze rules: export business rules and statuses from the prototype services (see **BM-SYS-007** (Business Rules Catalogue)) |
| 2 | Build backend modules and API per **BM-API-001** (API Specification (Overview and Conventions)) |
| 3 | Replace browser services with API clients module by module (keep UI) |
| 4 | Load master data from client sources (not from demo seed) per **BM-DAT-004** (Data Migration Strategy) |
| 5 | Remove simulators and demo credentials; enable real integrations |
| 6 | Pilot with one hub and a few drivers; then full rollout |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |