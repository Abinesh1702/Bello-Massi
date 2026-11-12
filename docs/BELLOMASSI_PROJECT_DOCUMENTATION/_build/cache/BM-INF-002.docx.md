---
title: "Hosting Options — Cloud vs On-Premises Comparison"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-INF-002 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Hosting Options — Cloud vs On-Premises Comparison |
| Document ID | BM-INF-002 |
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

Compare AWS, Azure, DigitalOcean and on-premises hosting to support the client's hosting decision.

## Scope

Qualitative comparison; costs are indicative estimates in BM-INF-004, not quotations. Decision PENDING CONFIRMATION.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-INF-003** (Infrastructure, Network Architecture and Server Specification)
- **BM-INF-004** (Infrastructure Cost Estimation (ESTIMATE))

## 1. Comparison

| Criterion | AWS | Azure | DigitalOcean | On-premises |
|---|---|---|---|---|
| Middle East region | Yes (UAE, Bahrain) | Yes (UAE North / Central) | No ME region (nearest Bangalore / Frankfurt) | Client data centre |
| India region | Yes (Mumbai, Hyderabad) | Yes (Pune, Chennai…) | Bangalore | Client data centre |
| Managed PostgreSQL | RDS / Aurora | Azure Database for PostgreSQL | Managed Databases | Self-managed |
| Managed Redis | ElastiCache | Azure Cache for Redis | Managed Redis | Self-managed |
| Containers | ECS / Fargate, EKS | Container Apps, AKS | App Platform, DOKS | Docker / Kubernetes on VMs |
| Object storage | S3 | Blob Storage | Spaces | MinIO |
| Security / compliance tooling | Extensive | Extensive; strong with Microsoft 365 / Entra ID | Basic | Client responsibility |
| Operations effort | Medium | Medium | Low | High |
| Cost level (indicative) | Medium | Medium | Low | High upfront, low monthly |
| Data residency | In-country regions available | In-country regions available | Limited | Full control |
| Skills needed | AWS | Azure | Generalist | Infrastructure team |

## 2. Recommendation — PROPOSED, PENDING CONFIRMATION

1. If the client uses Microsoft 365 / Entra ID → **Azure UAE North** (SSO, same tenant).
2. Otherwise → **AWS me-central-1 (UAE)** with managed services.
3. DigitalOcean only for non-production (test / demo) because of region and compliance limits.
4. On-premises only if data-residency policy requires it and an operations team exists.

If the operating country is India, use the equivalent Indian regions.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |