# Product API Design

## Document control

| Field | Value |
|---|---|
| Document title | Product API Design |
| Document ID | BM-API-006 |
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

Specify the proposed product api endpoints for the Django REST backend.

## Scope

10 endpoints under /api/v1.

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
| GET | `/api/v1/products` | `products.view` | List / search products |
| POST | `/api/v1/products` | `products.manage` | Create product |
| GET | `/api/v1/products/{id}` | `products.view` | Product detail with stock per hub |
| PATCH | `/api/v1/products/{id}` | `products.manage` | Update |
| DELETE | `/api/v1/products/{id}` | `products.manage` | Soft delete |
| GET | `/api/v1/product-categories` | `products.view` | Categories |
| GET | `/api/v1/hubs` | `hubs.view` | Hubs |
| POST | `/api/v1/hubs` | `hubs.manage` | Create hub |
| GET | `/api/v1/zones` | `fleet.view` | Zones with pincodes |
| POST | `/api/v1/zones` | `fleet.manage` | Create zone |

### GET `/api/v1/products`

| Item | Specification |
|---|---|
| Purpose | List / search products |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `products.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `page<Product>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/products`

| Item | Specification |
|---|---|
| Purpose | Create product |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `products.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `Product` |
| Response body | `Product` |
| Validation / errors | 400; 409 duplicate code / SKU / barcode |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/products/{id}`

| Item | Specification |
|---|---|
| Purpose | Product detail with stock per hub |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `products.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `Product` |
| Validation / errors | 404 |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### PATCH `/api/v1/products/{id}`

| Item | Specification |
|---|---|
| Purpose | Update |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `products.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `partial Product` |
| Response body | `Product` |
| Validation / errors | 400 |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### DELETE `/api/v1/products/{id}`

| Item | Specification |
|---|---|
| Purpose | Soft delete |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `products.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `204` |
| Validation / errors | 409 referenced |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/product-categories`

| Item | Specification |
|---|---|
| Purpose | Categories |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `products.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<ProductCategory>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/hubs`

| Item | Specification |
|---|---|
| Purpose | Hubs |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `hubs.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<Hub>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/hubs`

| Item | Specification |
|---|---|
| Purpose | Create hub |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `hubs.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `Hub` |
| Response body | `Hub` |
| Validation / errors | 409 duplicate code / name |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/zones`

| Item | Specification |
|---|---|
| Purpose | Zones with pincodes |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `fleet.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<Zone>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/zones`

| Item | Specification |
|---|---|
| Purpose | Create zone |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `fleet.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `Zone + postal_codes[]` |
| Response body | `Zone` |
| Validation / errors | 400 at least one pincode; 409 name per hub |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `products` ([BM-DAT-003 — Data Dictionary (Proposed Production Schema)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-003_Data_Dictionary.xlsx)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |