# Dispatch API Design

## Document control

| Field | Value |
|---|---|
| Document title | Dispatch API Design |
| Document ID | BM-API-009 |
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

Specify the proposed dispatch api endpoints for the Django REST backend.

## Scope

11 endpoints under /api/v1.

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
| GET | `/api/v1/dispatches` | `dispatch.view` | List dispatches |
| GET | `/api/v1/dispatches/ready-orders` | `dispatch.view` | Orders ready for dispatch |
| POST | `/api/v1/dispatches` | `dispatch.manage` | Create draft / planned dispatch |
| PATCH | `/api/v1/dispatches/{id}` | `dispatch.manage` | Edit while DRAFT / PLANNED / ASSIGNED |
| PUT | `/api/v1/dispatches/{id}/sequence` | `dispatch.manage` | Change stop sequence |
| GET | `/api/v1/dispatches/{id}/suggested-sequence` | `dispatch.manage` | Suggested / optimised sequence (Routes API in production) |
| POST | `/api/v1/dispatches/{id}/assign` | `dispatch.manage` | Assign driver and vehicle |
| GET | `/api/v1/dispatches/{id}/confirmation-review` | `dispatch.manage` | Stock and resource review |
| POST | `/api/v1/dispatches/{id}/confirm` | `dispatch.manage` | Confirm loading; deduct stock once; create deliveries |
| POST | `/api/v1/dispatches/{id}/cancel` | `dispatch.manage` | Cancel; reverse stock once if confirmed |
| GET | `/api/v1/dispatches/{id}/timeline` | `dispatch.view` | Dispatch events |

### GET `/api/v1/dispatches`

| Item | Specification |
|---|---|
| Purpose | List dispatches |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `?date=&status=&hub=` |
| Response body | `page<Dispatch>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/dispatches/ready-orders`

| Item | Specification |
|---|---|
| Purpose | Orders ready for dispatch |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `?hub=&zone=` |
| Response body | `page<Order>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/dispatches`

| Item | Specification |
|---|---|
| Purpose | Create draft / planned dispatch |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `{hub_id, zone_id, dispatch_date, order_ids[], sequence[], driver_id?, vehicle_id?, status: DRAFT or PLANNED}` |
| Response body | `Dispatch + warnings` |
| Validation / errors | 400 ineligible order (RULE-018) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### PATCH `/api/v1/dispatches/{id}`

| Item | Specification |
|---|---|
| Purpose | Edit while DRAFT / PLANNED / ASSIGNED |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `partial Dispatch` |
| Response body | `Dispatch` |
| Validation / errors | 409 confirmed (RULE-019) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### PUT `/api/v1/dispatches/{id}/sequence`

| Item | Specification |
|---|---|
| Purpose | Change stop sequence |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{stops[{order_id, sequence}]}` |
| Response body | `Dispatch` |
| Validation / errors | 400 invalid sequence |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/dispatches/{id}/suggested-sequence`

| Item | Specification |
|---|---|
| Purpose | Suggested / optimised sequence (Routes API in production) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `{stops[], eta[]}` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/dispatches/{id}/assign`

| Item | Specification |
|---|---|
| Purpose | Assign driver and vehicle |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{driver_id, vehicle_id}` |
| Response body | `Dispatch (ASSIGNED)` |
| Validation / errors | 422 driver / vehicle issues (RULE-023, RULE-024, RULE-025) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/dispatches/{id}/confirmation-review`

| Item | Specification |
|---|---|
| Purpose | Stock and resource review |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `{orders, stock_check[], issues[]}` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/dispatches/{id}/confirm`

| Item | Specification |
|---|---|
| Purpose | Confirm loading; deduct stock once; create deliveries |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{acknowledged: true} + Idempotency-Key` |
| Response body | `Dispatch (CONFIRMED)` |
| Validation / errors | 400 not acknowledged; 409 already confirmed; 422 stock short (RULE-020) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/dispatches/{id}/cancel`

| Item | Specification |
|---|---|
| Purpose | Cancel; reverse stock once if confirmed |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{reason, remarks}` |
| Response body | `Dispatch (CANCELLED)` |
| Validation / errors | 409 stop started (RULE-022) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/dispatches/{id}/timeline`

| Item | Specification |
|---|---|
| Purpose | Dispatch events |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<Event>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `dispatches` ([BM-DAT-003 — Data Dictionary (Proposed Production Schema)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-003_Data_Dictionary.xlsx)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |