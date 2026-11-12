---
title: "Assumptions and Dependencies"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-SYS-006 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Assumptions and Dependencies |
| Document ID | BM-SYS-006 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | System Requirements |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Record assumptions made in the requirements and the dependencies the project relies on.

## Scope

Production project; every assumption must be confirmed or replaced by a decision.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SYS-005** (System Constraints Document)
- **BM-PM-005** (Issue, Dependency and Decision Registers)
- **BM-HND-012** (Pending Requirements Document)

## 1. Assumptions

| ID | Assumption | Impact if wrong | Status |
|---|---|---|---|
| ASM-01 | The SOW (Oct 2026) is the functional baseline; prototype extensions are optional | Scope and estimate change | PENDING CONFIRMATION |
| ASM-02 | One company, several hubs; one currency per company | Data model change | PENDING CONFIRMATION |
| ASM-03 | Operating country rules (address, tax ID, phone) to follow the confirmed country | Validation and invoice changes | PENDING CONFIRMATION |
| ASM-04 | Drivers have compatible smartphones with data | Hardware cost | PENDING CONFIRMATION |
| ASM-05 | Customers have a mobile number able to receive SMS / WhatsApp | OTP fallback needed | PENDING CONFIRMATION |
| ASM-06 | One delivery per order per dispatch (no split shipments) | Model change | VERIFIED in prototype; confirm |
| ASM-07 | Stock is deducted at dispatch confirmation | Inventory integration design | VERIFIED in prototype; confirm with SAP owner |
| ASM-08 | Volumes are moderate (hundreds of orders / day, tens of drivers) | Capacity plan | PENDING CONFIRMATION |
| ASM-09 | Client provides master data in spreadsheet form for migration | Migration effort | PENDING CONFIRMATION |
| ASM-10 | English is the UI language | Localisation effort | PENDING CONFIRMATION (Arabic?) |

## 2. Dependencies

| ID | Dependency | Owner | Needed by |
|---|---|---|---|
| DEP-01 | Scope decisions (extensions, approved figures, cancellation rule) | Client | Phase 2 start |
| DEP-02 | Hosting decision and accounts | Client IT | Phase 2 environments |
| DEP-03 | Maps / routes account | Client | Phase 3 |
| DEP-04 | SMS / WhatsApp provider | Client | Phase 3 |
| DEP-05 | Email provider / domain DNS | Client IT | Phase 3 |
| DEP-06 | App store developer accounts | Client | Phase 3 |
| DEP-07 | Master data | Business owners | Phase 4 migration |
| DEP-08 | SAP interfaces and team | Client SAP team | Phase 5 |
| DEP-09 | UAT users and availability | Business owners | Phase 4 |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |