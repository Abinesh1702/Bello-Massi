# Customer API Design

## Document control

| Field | Value |
|---|---|
| Document title | Customer API Design |
| Document ID | BM-API-005 |
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

Specify the proposed customer api endpoints for the Django REST backend.

## Scope

8 endpoints under /api/v1.

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
| GET | `/api/v1/customers` | `customers.view` | List customers (scope: salesman sees assigned) |
| POST | `/api/v1/customers` | `customers.manage` | Create customer |
| GET | `/api/v1/customers/{id}` | `customers.view` | Customer detail incl. locations |
| PATCH | `/api/v1/customers/{id}` | `customers.manage` | Update customer |
| DELETE | `/api/v1/customers/{id}` | `customers.manage` | Soft delete |
| GET | `/api/v1/customers/{id}/credit-position` | `customers.credit.view` | Balance, limit, projected for an amount |
| GET | `/api/v1/customers/{id}/locations` | `customers.view` | Delivery locations |
| POST | `/api/v1/customers/{id}/locations` | `customers.manage` | Add location (geocoded) |

### GET `/api/v1/customers`

| Item | Specification |
|---|---|
| Purpose | List customers (scope: salesman sees assigned) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `customers.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `page<Customer>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/customers`

| Item | Specification |
|---|---|
| Purpose | Create customer |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `customers.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `Customer` |
| Response body | `Customer` |
| Validation / errors | 400 validation (codes, phone, tax IDs, pincode) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/customers/{id}`

| Item | Specification |
|---|---|
| Purpose | Customer detail incl. locations |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `customers.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `Customer` |
| Validation / errors | 404 / out of scope |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### PATCH `/api/v1/customers/{id}`

| Item | Specification |
|---|---|
| Purpose | Update customer |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `customers.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `partial Customer` |
| Response body | `Customer` |
| Validation / errors | 400 |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### DELETE `/api/v1/customers/{id}`

| Item | Specification |
|---|---|
| Purpose | Soft delete |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `customers.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `204` |
| Validation / errors | 409 referenced by orders |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/customers/{id}/credit-position`

| Item | Specification |
|---|---|
| Purpose | Balance, limit, projected for an amount |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `customers.credit.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `?amount=` |
| Response body | `{limit, balance, projected, exceeded}` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/customers/{id}/locations`

| Item | Specification |
|---|---|
| Purpose | Delivery locations |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `customers.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<CustomerLocation>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/customers/{id}/locations`

| Item | Specification |
|---|---|
| Purpose | Add location (geocoded) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `customers.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `CustomerLocation` |
| Response body | `CustomerLocation` |
| Validation / errors | 400 |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `customers` ([BM-DAT-003 — Data Dictionary (Proposed Production Schema)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-003_Data_Dictionary.xlsx)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |