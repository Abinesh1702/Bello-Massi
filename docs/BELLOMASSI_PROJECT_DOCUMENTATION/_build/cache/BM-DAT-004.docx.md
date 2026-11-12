---
title: "Data Migration Strategy"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-DAT-004 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Data Migration Strategy |
| Document ID | BM-DAT-004 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Database and Data Design |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define how data reaches the production database — master data load, prototype data handling and schema migrations.

## Scope

Go-live data load and ongoing schema changes. All content is PROPOSED.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-DAT-002** (Proposed Production Database Design)
- **BM-DAT-001** (Current Prototype Data Model (LocalStorage))
- **BM-DEP-002** (Deployment Guide and Runbook)
- **BM-RMP-002** (Backend, Database, API, Frontend Integration and Auth / RBAC Roadmap)

## 1. Principles

1. **Prototype demo data is not migrated** to production — it is fictitious seed data. Only client master data is loaded.
2. Master data is loaded from client spreadsheets (or SAP extracts in stage 2) through validated import scripts that
   apply the same rules as the application (codes, formats, uniqueness).
3. Every load is repeatable (idempotent upsert by business key) and produces a reconciliation report.
4. Schema changes use Django migrations, reviewed in pull requests, applied automatically in CI/CD, with backward-compatible
   steps (expand → migrate data → contract).

## 2. Migration scope

| Data | Source | Load method | Validation |
|---|---|---|---|
| Users and roles | Client list; role mapping to the 13 roles | Admin import command | Unique username / email; role exists |
| Hubs, zones, pincodes | Client spreadsheet | Import command | Unique codes; pincodes not in two zones of one hub |
| Customers and locations | Client / SAP extract | Import command + geocoding job | Mandatory fields, tax IDs per country, credit values |
| Products and categories | Client / SAP extract | Import command | Unique code, SKU, barcode; tax % range |
| Drivers and vehicles | Client spreadsheet | Import command | Licence and vehicle number formats, document expiry |
| Opening stock (if inventory in scope) | Physical count / SAP | Receipt per hub with reference "Opening balance" | Totals reconciled with count sheet |
| Open orders at go-live | Manual | Entered by users or imported as SUBMITTED | Business owner sign-off |

## 3. Prototype export (optional)

The prototype can export its data as JSON (Settings › export). A mapping script from prototype keys to tables is possible
(see **BM-DAT-001** (Current Prototype Data Model (LocalStorage)) for keys and **BM-DAT-003** (Data Dictionary (Proposed Production Schema)) for target columns) — useful for **test data**, not for production.

## 4. Cut-over plan

1. Freeze master-data changes (T-3 days). 2. Final extract and load into staging; reconciliation; business sign-off.
3. Load into production (T-1). 4. Smoke test. 5. Open for users (T0). 6. Hypercare.

## 5. Rollback

Restore the pre-load snapshot; re-run corrected load. No production transactions exist before T0.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |