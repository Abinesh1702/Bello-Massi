---
title: "Architecture Diagrams"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-ARC-003 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Architecture Diagrams |
| Document ID | BM-ARC-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | System Architecture |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Collect the architecture diagrams required for design review.

## Scope

Context, component, application, logical, order processing, data flow, deployment, network, authentication, integration, driver delivery, customer app and RBAC diagrams.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-ARC-001** (High-Level Design (HLD))
- **BM-ARC-002** (Low-Level Design (LLD))
- **BM-DGM-001** (Diagram Catalogue and Visual Documentation)

## Contents

- 1. System context diagram (DGM-19)
- 2. Component diagram (DGM-20)
- 3. Application / logical architecture diagram (DGM-01)
- 4. Order processing architecture (DGM-23)
- 5. Data flow diagram (DGM-12)
- 6. Deployment architecture diagram (DGM-13)
- 7. Network architecture (DGM-14)
- 8. Authentication flow diagram (DGM-15)
- 9. Integration architecture diagram (DGM-16)
- 10. Driver delivery architecture (DGM-21)
- 11. Customer application architecture (DGM-22)
- 12. RBAC diagram (DGM-10)

## 1. System context diagram (DGM-19)

Label: **VERIFIED (actors) / PROPOSED (external systems)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/fdcd6b4e5e0a.png){width=17.00cm}



## 2. Component diagram (DGM-20)

Label: **VERIFIED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/8a94846f0143.png){width=17.00cm}



## 3. Application / logical architecture diagram (DGM-01)

Label: **VERIFIED (prototype) / PROPOSED (target)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/827ba86b0560.png){width=17.00cm}



## 4. Order processing architecture (DGM-23)

Label: **VERIFIED (logic) / PROPOSED (server)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/5e2c4bc1159d.png){width=17.00cm}



## 5. Data flow diagram (DGM-12)

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/259d95dfaf40.png){width=17.00cm}



## 6. Deployment architecture diagram (DGM-13)

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/4de5ca52245c.png){width=17.00cm}



## 7. Network architecture (DGM-14)

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/a05c841d415b.png){width=17.00cm}



## 8. Authentication flow diagram (DGM-15)

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/9d0b0b2411d8.png){width=17.00cm}



## 9. Integration architecture diagram (DGM-16)

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/deafe897f126.png){width=17.00cm}



## 10. Driver delivery architecture (DGM-21)

Label: **PROPOSED**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/ba0494bd4cba.png){width=17.00cm}



## 11. Customer application architecture (DGM-22)

Label: **VERIFIED (prototype) / PROPOSED (production)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/58b24d28fb4c.png){width=17.00cm}



## 12. RBAC diagram (DGM-10)

Label: **VERIFIED (prototype) / PROPOSED (server enforcement)**



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/f4c296791e02.png){width=17.00cm}



## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |