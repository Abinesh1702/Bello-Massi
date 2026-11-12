# Project Organization Structure

## Document control

| Field | Value |
|---|---|
| Document title | Project Organization Structure |
| Document ID | BM-OVW-011 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Project Overview |
| Related module(s) | All modules |
| Document owner | Project Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Propose the governance and team structure for the production project.

## Scope

Proposed structure; actual names and appointments are PENDING CONFIRMATION.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-OVW-009 — Stakeholder Identification](BM-OVW-009_Stakeholder_Identification.md)
- [BM-PM-004 — Resource Allocation and RACI Matrix](../17_PROJECT_MANAGEMENT/BM-PM-004_Resources_and_RACI.xlsx)

## 1. Proposed structure — PROPOSED

```mermaid
flowchart TD
    SC[Steering Committee - client sponsor + delivery lead] --> PMC[Client Project Owner]
    SC --> PMV[Delivery Project Manager]
    PMC --> BO[Business Owners: Sales, Logistics, Finance, Warehouse]
    PMC --> CIT[Client IT / SAP team]
    PMV --> BA[Business Analyst]
    PMV --> ARCH[Solution Architect]
    ARCH --> BE[Backend developers - Django]
    ARCH --> FE[Frontend developers - React]
    ARCH --> MOB[Mobile developers - React Native]
    PMV --> QA[QA Lead and testers]
    PMV --> OPS[DevOps engineer]
    BO --> UAT[UAT users]
```

## 2. Roles

| Role | Responsibility |
|---|---|
| Steering Committee | Scope, budget, go-live decisions |
| Client Project Owner | Day-to-day decisions, access to business owners |
| Delivery Project Manager | Plan, status, risks, changes |
| Business Analyst | Requirements, traceability, UAT support |
| Solution Architect | Architecture, security, integrations |
| Developers | Build backend, web, mobile |
| QA | Test planning and execution |
| DevOps | Environments, CI/CD, monitoring, backups |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |