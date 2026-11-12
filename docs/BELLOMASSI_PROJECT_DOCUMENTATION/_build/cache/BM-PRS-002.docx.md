---
title: "Project Presentation — Speaker Notes"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-PRS-002 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Project Presentation — Speaker Notes |
| Document ID | BM-PRS-002 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Project Presentation |
| Related module(s) | All modules |
| Document owner | Project Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Speaker notes and sources for each slide of the project presentation (BM-PRS-001, PowerPoint).

## Scope

12 slides for a 20–25 minute review meeting with the client. Every figure is traceable to a document in this package.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-PRS-001** (Project Presentation)
- **BM-OVW-015** (Project Status and Implementation Summary)
- **BM-PM-005** (Issue, Dependency and Decision Registers)

| Slide | Title | Talking points | Source |
|---|---|---|---|
| 1 | From customer order to confirmed delivery | Purpose of the meeting: show the prototype, the documentation and the decisions needed. Everything is a draft; nothing is approved. | — |
| 2 | Where we are today | 35 modules, 179 functional requirements, 292 test cases (228 functional + 64 cross-cutting; none executed), document count from the index. Prototype runs in the browser; integrations simulated. | **BM-SYS-003** (Functional Requirements Document (Consolidated)), **BM-QA-011** (Functional Test Cases), **BM-QA-013** (Cross-cutting Test Cases (Responsive, Persistence, Date Filters, Role Access, UI, Accessibility, Security, Performance)), **BM-IDX-001** (Bellomassi Documentation Index) |
| 3 | One record from order to delivery note | Six steps and owners; stock deducted at dispatch confirmation; OTP required; exceptions back to the Dispatcher. | **BM-WF-02** (WF-02 — Order-to-Delivery Workflow) |
| 4 | The office web app | Real screenshots (demo data). Role dashboards, approval queue, 13 roles / 110 permissions. | **BM-UX-006** (Prototype Screenshot Gallery), **BM-SEC-005** (RBAC and Access Control Matrix) |
| 5 | Driver and customer apps | Driver: arrive → OTP → POD → note. Customer: catalog, cart, tracking with OTP. Mobile web today; native driver app proposed. | **BM-MAN-001** (Driver App User Manual), **BM-MAN-002** (Customer App User Manual) |
| 6 | Most modules work — integrations are simulated | Module status counts from the feature inventory; what is simulated and what is not built. | **BM-OVW-016** (Project Feature Inventory), **BM-HND-011** (Limitations Document — Prototype vs Production) |
| 7 | Gaps against the Scope of Work | Eight key gaps; full list of 14. | **BM-DOC-003** (Gap Analysis — Scope of Work, Prototype and Documentation), **BM-HND-012** (Pending Requirements Document) |
| 8 | The prototype goes beyond the SOW | Extensions grouped as a proposal for discussion — the client decides. | **BM-RSK-004** (Change Impact Analysis — Prototype Extensions and Gaps) |
| 9 | Indicative path to production | Phase durations are estimates; start date not agreed. | **BM-PLN-001** (Scope and Phase Plan), **BM-PM-002** (Work Breakdown Structure) |
| 10 | Decisions we need from you | Eight decisions; record them in the decision log and the business approval form. | **BM-PM-005** (Issue, Dependency and Decision Registers), **BM-HND-005** (Business Approval Document) |
| 11 | What the documentation package contains | Walk through the folders; show the index. | **BM-IDX-002** (Bellomassi Documentation Master) |
| 12 | Next step | Gate G0 review, then G1. | **BM-PM-001** (Project Plan) |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |