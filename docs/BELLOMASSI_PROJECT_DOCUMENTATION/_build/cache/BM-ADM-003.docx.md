---
title: "Master Data Management Guide"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-ADM-003 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Master Data Management Guide |
| Document ID | BM-ADM-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Administration and Configuration |
| Related module(s) | All modules |
| Document owner | Master Data Owner |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Explain how master data (customers, products, hubs, suppliers, zones, drivers, vehicles, document types) is created and maintained.

## Scope

Prototype screens (VERIFIED). Ownership of each master is PENDING CONFIRMATION by the client.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-ADM-001** (System Administration Guide)
- **BM-FRD-CUS** (Functional Requirements — Customer Management)
- **BM-FRD-PRD** (Functional Requirements — Product Catalogue)
- **BM-FRD-HUB** (Functional Requirements — Hubs, Suppliers and Organisation Master)
- **BM-FRD-ZON** (Functional Requirements — Zone Management)
- **BM-FRD-DRA** (Functional Requirements — Driver and Vehicle Assignment)
- **BM-FRD-VMS** (Functional Requirements — Vehicle Management System)
- **BM-DAT-004** (Data Migration Strategy)

## 1. Master data objects

| Object | Screen | Maintained by (default permission) | Key rules |
|---|---|---|---|
| Customers | `/customers` | Admin, Sales Manager (customers.*) | Unique code; tax IDs; hub; zone; sales rep; VIP; credit limit and balance (balance is manual in the prototype) |
| Products | `/products` | Admin | Code, SKU, barcode unique; unit; price; tax %; discount limit; storage condition; stock settings |
| Hubs | `/hubs` | Admin | Fulfilment hub per order; drivers and vehicles belong to a hub |
| Suppliers | `/suppliers` | Admin | Linked to supplier portal user |
| Zones | `/dispatch/zones` | Admin (fleet.manage) | Used for planning; customers mapped to zones |
| Drivers | `/dispatch/drivers` | Admin (fleet.manage) | Linked user; licence; hub; availability |
| Vehicles | `/dispatch/vehicles`, `/vms/vehicles` | Admin (fleet.manage) | Registration; capacity; documents (RC, insurance, fitness) |
| Document types | `/documents/types` | Admin | Required fields, expiry tracking, OCR fields |
| Invoice templates | `/invoices/templates` | Admin / Finance | Extension module |
| Message templates | Communication | Admin | Demo channels |

## 2. Procedures

1. Search before creating to avoid duplicates.
2. Fill mandatory fields; save; check audit entry.
3. Deactivate instead of delete when records are referenced (orders, dispatches).
4. Review weekly: customers without zone, products without price / tax, vehicles with expiring documents.

## 3. Production data load

Initial master data comes from client sources (not from demo seed) — mapping and reconciliation in **BM-DAT-004** (Data Migration Strategy).
SAP as master source is a stage-2 option (PENDING CONFIRMATION).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |