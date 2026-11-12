---
title: "Pending Requirements Document"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-HND-012 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Pending Requirements Document |
| Document ID | BM-HND-012 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Client Handover |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

List requirements from the SOW and related guides that are not (fully) met by the prototype, and open questions needing client clarification.

## Scope

Based on the gap analysis (G-01 … G-14) and open questions; status as of 2026-11-12.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-DOC-003** (Gap Analysis — Scope of Work, Prototype and Documentation)
- **BM-PLN-002** (Phase-wise Scope Matrix)
- **BM-SYS-008** (Requirement Traceability Matrix)

## 1. SOW requirements not fully met

| Gap | Requirement | Status | Target phase |
|---|---|---|---|
| G-01 | Sales Manager sets approved value / quantity | Partially implemented — PENDING CONFIRMATION | 2 |
| G-02 | Finance notified on approval / credit exceeded | NOT IMPLEMENTED | 2 |
| G-03 | Zone drag-and-drop board | Partially implemented | 2 |
| G-04 | Fastest route with live traffic | Simulated | 3 |
| G-05 | Turn-by-turn navigation | Simulated (map link) | 3 |
| G-06 | OTP by SMS / WhatsApp | Simulated | 3 |
| G-07 | Delivery note sent instantly | Partially implemented | 3 |
| G-08 | Native iOS / Android driver app | Prototype only (web) | 3 |
| G-09 | Live order monitor | Partially implemented | 3 |
| G-10 | Items from SAP | Planned | 5 |
| G-11 | Configurable notification rules | Partially implemented | 2 |
| G-12 | Order channel captured | Partially implemented | 2 |
| G-13 | Real authentication | Prototype only | 2 |
| G-14 | Live tracking with role scope | Simulated | 3 |

## 2. Questions for the client

1. Which country, currency, tax and address format apply?
2. Which extensions (X-01 … X-11) stay in scope?
3. Is invoicing in or out of scope?
4. Which order status model is used (8 or 13 statuses)?
5. Should credit excess warn or block?
6. Which messaging channel and provider for OTP and delivery notes?
7. Hosting preference and data-residency rules?
8. SAP version, interface type and timing?
9. Is a Management role needed?
10. Is Arabic / RTL required?
11. Volumes: orders per day, drivers, users (for sizing)?
12. Retention periods for GPS, POD, documents?

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |