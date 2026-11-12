---
title: "Support and Maintenance Agreement (Draft)"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-HND-014 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Support and Maintenance Agreement (Draft) |
| Document ID | BM-HND-014 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Client Handover |
| Related module(s) | All modules |
| Document owner | Project Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Draft structure and proposed service levels for support and maintenance after go-live.

## Scope

DRAFT for discussion — not agreed, not signed. Service levels and hours are PROPOSED; commercial terms are intentionally omitted.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-HND-015** (Warranty and Support Scope (Draft))
- **BM-INF-008** (Monitoring, Logging and Alerting Plan)
- **BM-ADM-004** (Monitoring and Maintenance Guide)

## 1. Services

| Service | Description |
|---|---|
| Hypercare | 2 weeks after go-live, daily stand-up, on-site / remote support |
| Incident support | Fix production incidents per severity |
| Problem management | Root-cause analysis for repeated incidents |
| Minor changes | Small changes within an agreed monthly allowance |
| Maintenance | Security patches, dependency updates, OS / image updates |
| Monitoring | Alert handling (**BM-INF-008** (Monitoring, Logging and Alerting Plan)) |

## 2. Proposed service levels

| Severity | Response | Workaround target | Hours |
|---|---|---|---|
| P1 Critical | 30 min | 4 h | 24×7 (proposed) |
| P2 High | 2 h | 1 business day | Business hours |
| P3 Medium | 1 business day | Next release | Business hours |
| P4 Low | 3 business days | Backlog | Business hours |

## 3. Contacts (blank)

| Role | Name | Phone | Email |
|---|---|---|---|
| Client support coordinator |  |  |  |
| Vendor support lead |  |  |  |
| Escalation |  |  |  |

## 4. Signatures (blank)

| Party | Name | Signature | Date |
|---|---|---|---|
| Client |  |  |  |
| Vendor |  |  |  |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |