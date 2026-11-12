# Order API Design

## Document control

| Field | Value |
|---|---|
| Document title | Order API Design |
| Document ID | BM-API-007 |
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

Specify the proposed order api endpoints for the Django REST backend.

## Scope

9 endpoints under /api/v1.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-API-001 — API Specification (Overview and Conventions)](BM-API-001_API_Specification.md)
- [BM-API-002 — API Endpoint Catalogue](BM-API-002_API_Endpoint_Catalogue.xlsx)
- [BM-SEC-003 — Authentication, Password, MFA and Session Management Design](../10_SECURITY_AND_COMPLIANCE/BM-SEC-003_Authentication_and_Session_Design.md)

## 1. Status

**PROPOSED.** No API exists in the prototype; the same behaviour is implemented today by browser services (see section 4). Paths, payloads and codes will be finalised during backend design.

## 2. Endpoints

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| GET | `/api/v1/orders` | `orders.view` | List orders within data scope |
| POST | `/api/v1/orders` | `orders.create` | Create draft order |
| GET | `/api/v1/orders/{id}` | `orders.view` | Order with items, approvals, timeline |
| PATCH | `/api/v1/orders/{id}` | `orders.create` | Update draft or returned order |
| DELETE | `/api/v1/orders/{id}` | `orders.create` | Delete own draft |
| POST | `/api/v1/orders/{id}/submit` | `orders.create` | Submit for approval |
| POST | `/api/v1/orders/{id}/resubmit` | `orders.create` | Resubmit returned order |
| POST | `/api/v1/orders/{id}/duplicate` | `orders.create` | Copy into new draft |
| GET | `/api/v1/orders/{id}/timeline` | `orders.view` | Order events |

### GET `/api/v1/orders`

| Item | Specification |
|---|---|
| Purpose | List orders within data scope |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `?status=&customer=&salesman=&from=&to=` |
| Response body | `page<Order>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/orders`

| Item | Specification |
|---|---|
| Purpose | Create draft order |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.create` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `Order + items[]` |
| Response body | `Order (DRAFT)` |
| Validation / errors | 400 validation (RULE-006, RULE-007) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/orders/{id}`

| Item | Specification |
|---|---|
| Purpose | Order with items, approvals, timeline |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `Order` |
| Validation / errors | 404 / out of scope |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### PATCH `/api/v1/orders/{id}`

| Item | Specification |
|---|---|
| Purpose | Update draft or returned order |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.create` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `partial Order + items[]` |
| Response body | `Order` |
| Validation / errors | 409 not editable in status |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### DELETE `/api/v1/orders/{id}`

| Item | Specification |
|---|---|
| Purpose | Delete own draft |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.create` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `204` |
| Validation / errors | 409 only drafts (RULE-008) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/orders/{id}/submit`

| Item | Specification |
|---|---|
| Purpose | Submit for approval |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.create` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `Idempotency-Key header` |
| Response body | `Order (SUBMITTED) + warnings` |
| Validation / errors | 400 validation |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/orders/{id}/resubmit`

| Item | Specification |
|---|---|
| Purpose | Resubmit returned order |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.create` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `Order (SUBMITTED)` |
| Validation / errors | 409 not RETURNED |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/orders/{id}/duplicate`

| Item | Specification |
|---|---|
| Purpose | Copy into new draft |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.create` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `Order (DRAFT)` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/orders/{id}/timeline`

| Item | Specification |
|---|---|
| Purpose | Order events |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `orders.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<OrderEvent>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `orders` ([BM-DAT-003 — Data Dictionary (Proposed Production Schema)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-003_Data_Dictionary.xlsx)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |