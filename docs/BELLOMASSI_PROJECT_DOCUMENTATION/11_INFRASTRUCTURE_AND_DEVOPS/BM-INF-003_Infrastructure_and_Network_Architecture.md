# Infrastructure, Network Architecture and Server Specification

## Document control

| Field | Value |
|---|---|
| Document title | Infrastructure, Network Architecture and Server Specification |
| Document ID | BM-INF-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Infrastructure and DevOps |
| Related module(s) | All modules |
| Document owner | DevOps Engineer |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify environments, network layout and server sizing for the production platform.

## Scope

PROPOSED; sizing assumes moderate volumes (hundreds of orders / day, ≤ 50 drivers, ≤ 100 concurrent users) — PENDING CONFIRMATION (NFR-SCAL-002).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-INF-002 — Hosting Options — Cloud vs On-Premises Comparison](BM-INF-002_Hosting_Options_Comparison.md)
- [BM-INF-004 — Infrastructure Cost Estimation (ESTIMATE)](BM-INF-004_Infrastructure_Cost_Estimate.xlsx)
- [BM-INF-006 — Docker Architecture and Deployment Guide](BM-INF-006_Docker_Architecture_and_Deployment.md)
- [BM-ARC-001 — High-Level Design (HLD)](../07_SYSTEM_ARCHITECTURE/BM-ARC-001_High_Level_Design.md)
- [BM-DGM-001 — Diagram Catalogue and Visual Documentation](../21_DIAGRAMS_AND_VISUAL_DOCUMENTATION/BM-DGM-001_Diagram_Catalogue.md)

## 1. Environments

| Environment | Purpose | Data | Size |
|---|---|---|---|
| Development | Developers' machines (Docker Compose) | Seed / synthetic | Local |
| Test | Automated tests, QA | Synthetic | Small (1 node) |
| Staging | UAT, release rehearsal, performance tests | Masked copy / synthetic | Production-like (smaller) |
| Production | Live | Real | As below |
| DR | Disaster recovery | Replicated backups | Cold / warm standby |

## 2. Network architecture

Public subnet: load balancer (443 only), NAT gateway. Private application subnet: API, Channels, workers. Private data
subnet: PostgreSQL, Redis. Egress allow-list to providers. Admin access via VPN or bastion with MFA. Diagram: DGM-14 in
[BM-DGM-001 — Diagram Catalogue and Visual Documentation](../21_DIAGRAMS_AND_VISUAL_DOCUMENTATION/BM-DGM-001_Diagram_Catalogue.md).

## 3. Server specification — production (indicative)

| Component | Spec (each) | Count | Notes |
|---|---|---|---|
| API containers | 1 vCPU, 2 GB | 2–4 (autoscale) | Gunicorn / Uvicorn |
| Channels (WebSocket) | 0.5 vCPU, 1 GB | 2 | Sticky not needed (Redis layer) |
| Celery workers | 1 vCPU, 2 GB | 2 (messaging, OCR / reports) | OCR may need 2 GB+ |
| Celery beat | 0.25 vCPU, 0.5 GB | 1 | Single instance |
| PostgreSQL | 2 vCPU, 8 GB, 100 GB SSD | Primary + standby | PITR enabled |
| Redis | 1 GB | 1 (+ replica) | Cache, broker, channels |
| Object storage | 100 GB start | — | Versioning, lifecycle rules |
| Load balancer + WAF | Managed | 1 | TLS certificates |
| CDN | Managed | — | Web app static files |

## 4. Prototype hosting — VERIFIED

The prototype is a static site (`npm run build` → `dist/`) that can be served by any web server or static host; no
server-side components.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |