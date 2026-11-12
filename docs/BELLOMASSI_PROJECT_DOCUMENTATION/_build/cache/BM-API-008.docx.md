---
title: "Approval API Design"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-API-008 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Approval API Design |
| Document ID | BM-API-008 |
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

Specify the proposed approval api endpoints for the Django REST backend.

## Scope

8 endpoints under /api/v1.

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
| GET | `/api/v1/approvals/queue` | `orders.approval.view` | Submitted orders, oldest first |
| GET | `/api/v1/orders/{id}/approval-checks` | `orders.approval.view` | Six approval checks |
| POST | `/api/v1/orders/{id}/approve` | `orders.approve` | Approve |
| POST | `/api/v1/orders/{id}/return` | `orders.reject` | Return for correction |
| POST | `/api/v1/orders/{id}/reject` | `orders.reject` | Reject |
| GET | `/api/v1/consolidation/queue` | `orders.consolidation.view` | Approved orders grouped by salesman |
| POST | `/api/v1/orders/{id}/consolidate` | `orders.consolidate` | Consolidate with checklist |
| POST | `/api/v1/orders/{id}/ready-for-dispatch` | `orders.consolidate` | Release to dispatch |

### GET `/api/v1/approvals/queue`

| Item | Specification |
|---|---|
| Purpose | Submitted orders, oldest first |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.approval.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `page<Order>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### GET `/api/v1/orders/{id}/approval-checks`

| Item | Specification |
|---|---|
| Purpose | Six approval checks |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.approval.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `{checks[{key, severity, passed, message}]}` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/orders/{id}/approve`

| Item | Specification |
|---|---|
| Purpose | Approve |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.approve` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{remarks?, acknowledge_warnings, approved_items?[] (G-01, to confirm)}` |
| Response body | `Order (APPROVED)` |
| Validation / errors | 400 remarks required / warnings not acknowledged (RULE-012, RULE-013); 409 already decided (RULE-015); 422 blocking check (RULE-010, RULE-011) |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/orders/{id}/return`

| Item | Specification |
|---|---|
| Purpose | Return for correction |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.reject` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{reason, remarks}` |
| Response body | `Order (RETURNED)` |
| Validation / errors | 400 reason / remarks (RULE-014); 409 |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/orders/{id}/reject`

| Item | Specification |
|---|---|
| Purpose | Reject |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.reject` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{reason, remarks}` |
| Response body | `Order (REJECTED)` |
| Validation / errors | 400; 409 |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### GET `/api/v1/consolidation/queue`

| Item | Specification |
|---|---|
| Purpose | Approved orders grouped by salesman |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.consolidation.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<{salesman, orders[]}>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/orders/{id}/consolidate`

| Item | Specification |
|---|---|
| Purpose | Consolidate with checklist |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.consolidate` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{checks{5 booleans}, notes}` |
| Response body | `Order (CONSOLIDATED)` |
| Validation / errors | 400 checklist incomplete (RULE-016); 409 |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/orders/{id}/ready-for-dispatch`

| Item | Specification |
|---|---|
| Purpose | Release to dispatch |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.consolidate` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `Order (READY_FOR_DISPATCH)` |
| Validation / errors | 409 not consolidated (RULE-017) |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `order_approvals` (**BM-DAT-003** (Data Dictionary (Proposed Production Schema))).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |