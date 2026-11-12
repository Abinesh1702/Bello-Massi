---
title: "Inventory API Design"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-API-012 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Inventory API Design |
| Document ID | BM-API-012 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | API and Integration |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the proposed inventory api endpoints for the Django REST backend.

## Scope

14 endpoints under /api/v1.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-API-001** (API Specification (Overview and Conventions))
- **BM-API-002** (API Endpoint Catalogue)
- **BM-SEC-003** (Authentication, Password, MFA and Session Management Design)

## 1. Status

**PROPOSED.** No API exists in the prototype; the same behaviour is implemented today by browser services (see section 4). Paths, payloads and codes will be finalised during backend design.

## 2. Endpoints

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| GET | `/api/v1/inventory/stock` | `inventory.stock.view` | Stock per hub / product |
| PATCH | `/api/v1/inventory/stock/{id}/levels` | `inventory.receipts.manage` | Set min / reorder / max |
| POST | `/api/v1/inventory/receipts` | `inventory.receipts.manage` | Goods receipt |
| POST | `/api/v1/inventory/transfers` | `inventory.transfers.manage` | Create transfer (draft or complete) |
| POST | `/api/v1/inventory/transfers/{id}/complete` | `inventory.transfers.manage` | Complete draft transfer |
| POST | `/api/v1/inventory/adjustments` | `inventory.adjustments.manage` | Adjust stock |
| GET | `/api/v1/inventory/movements` | `inventory.stock.view` | Movement ledger |
| POST | `/api/v1/scrap-requests` | `scrap.create` | Create scrap request (multipart photo) |
| POST | `/api/v1/scrap-requests/{id}/submit` | `scrap.create` | Submit |
| POST | `/api/v1/scrap-requests/{id}/approve` | `scrap.approve` | Approve (not own) |
| POST | `/api/v1/scrap-requests/{id}/reject` | `scrap.reject` | Reject |
| POST | `/api/v1/scrap-requests/{id}/write-off` | `scrap.approve` | Post write-off once |
| POST | `/api/v1/replenishment-requests` | `inventory.replenishment.create` | Create request |
| POST | `/api/v1/replenishment-requests/{id}/approve` | `procurement.approve` | Approve |

### GET `/api/v1/inventory/stock`

| Item | Specification |
|---|---|
| Purpose | Stock per hub / product |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `inventory.stock.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `?hub=&status=` |
| Response body | `page<StockItem>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### PATCH `/api/v1/inventory/stock/{id}/levels`

| Item | Specification |
|---|---|
| Purpose | Set min / reorder / max |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `inventory.receipts.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{min_level, reorder_level, max_level}` |
| Response body | `StockItem` |
| Validation / errors | 400 reorder > max |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/inventory/receipts`

| Item | Specification |
|---|---|
| Purpose | Goods receipt |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `inventory.receipts.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `StockReceipt` |
| Response body | `StockReceipt` |
| Validation / errors | 400 inactive hub (RULE-034) |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/inventory/transfers`

| Item | Specification |
|---|---|
| Purpose | Create transfer (draft or complete) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `inventory.transfers.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `StockTransfer + complete: bool` |
| Response body | `StockTransfer` |
| Validation / errors | 422 insufficient stock (RULE-033) |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/inventory/transfers/{id}/complete`

| Item | Specification |
|---|---|
| Purpose | Complete draft transfer |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `inventory.transfers.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `StockTransfer` |
| Validation / errors | 409 already completed |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/inventory/adjustments`

| Item | Specification |
|---|---|
| Purpose | Adjust stock |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `inventory.adjustments.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `StockAdjustment` |
| Response body | `StockAdjustment` |
| Validation / errors | 422 would go negative (RULE-032) |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### GET `/api/v1/inventory/movements`

| Item | Specification |
|---|---|
| Purpose | Movement ledger |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `inventory.stock.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `?hub=&product=&from=&to=` |
| Response body | `page<StockMovement>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/scrap-requests`

| Item | Specification |
|---|---|
| Purpose | Create scrap request (multipart photo) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `scrap.create` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `ScrapRequest` |
| Response body | `ScrapRequest` |
| Validation / errors | 400 eligibility, photo, batch, duplicate (RULE-035, RULE-036) |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/scrap-requests/{id}/submit`

| Item | Specification |
|---|---|
| Purpose | Submit |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `scrap.create` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `ScrapRequest` |
| Validation / errors | 409 |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/scrap-requests/{id}/approve`

| Item | Specification |
|---|---|
| Purpose | Approve (not own) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `scrap.approve` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `ScrapRequest` |
| Validation / errors | 403 own request (RULE-037) |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/scrap-requests/{id}/reject`

| Item | Specification |
|---|---|
| Purpose | Reject |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `scrap.reject` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{reason}` |
| Response body | `ScrapRequest` |
| Validation / errors | 400 reason |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/scrap-requests/{id}/write-off`

| Item | Specification |
|---|---|
| Purpose | Post write-off once |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `scrap.approve` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `ScrapRequest (COMPLETED)` |
| Validation / errors | 409 not approved / done |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/replenishment-requests`

| Item | Specification |
|---|---|
| Purpose | Create request |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `inventory.replenishment.create` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `ReplenishmentRequest` |
| Response body | `ReplenishmentRequest` |
| Validation / errors | 400 |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/replenishment-requests/{id}/approve`

| Item | Specification |
|---|---|
| Purpose | Approve |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `procurement.approve` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `ReplenishmentRequest` |
| Validation / errors | 403 |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `stock_items` (**BM-DAT-003** (Data Dictionary (Proposed Production Schema))).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |