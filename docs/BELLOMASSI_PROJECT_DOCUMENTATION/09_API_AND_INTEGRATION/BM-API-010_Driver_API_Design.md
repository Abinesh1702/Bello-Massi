# Driver API Design

## Document control

| Field | Value |
|---|---|
| Document title | Driver API Design |
| Document ID | BM-API-010 |
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

Specify the proposed driver api endpoints for the Django REST backend.

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
| GET | `/api/v1/driver/me` | `driver.app` | Logged-in driver profile and vehicle |
| GET | `/api/v1/driver/deliveries/today` | `driver.app` | Today's stops (VIP first, then sequence) |
| GET | `/api/v1/driver/deliveries/tomorrow` | `driver.app` | Tomorrow's plan (start disabled) |
| GET | `/api/v1/driver/deliveries/{id}` | `driver.app` | Stop detail (own only) |
| GET | `/api/v1/driver/documents` | `driver.app` | Own documents |
| GET | `/api/v1/drivers` | `fleet.view` | Driver list |
| POST | `/api/v1/drivers` | `fleet.manage` | Create driver (and app login) |
| GET | `/api/v1/drivers/{id}/assignment-issues` | `dispatch.manage` | Assignment issues for a dispatch |

### GET `/api/v1/driver/me`

| Item | Specification |
|---|---|
| Purpose | Logged-in driver profile and vehicle |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `driver.app` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `Driver` |
| Validation / errors | 404 no driver linked |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/driver/deliveries/today`

| Item | Specification |
|---|---|
| Purpose | Today's stops (VIP first, then sequence) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `driver.app` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<Delivery>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/driver/deliveries/tomorrow`

| Item | Specification |
|---|---|
| Purpose | Tomorrow's plan (start disabled) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `driver.app` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<Delivery>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/driver/deliveries/{id}`

| Item | Specification |
|---|---|
| Purpose | Stop detail (own only) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `driver.app` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `Delivery` |
| Validation / errors | 404 not own (scope) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/driver/documents`

| Item | Specification |
|---|---|
| Purpose | Own documents |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `driver.app` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<Document>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/drivers`

| Item | Specification |
|---|---|
| Purpose | Driver list |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `fleet.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `page<Driver>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/drivers`

| Item | Specification |
|---|---|
| Purpose | Create driver (and app login) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `fleet.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `Driver + user` |
| Response body | `Driver` |
| Validation / errors | 400 licence / hub / zone rules |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/drivers/{id}/assignment-issues`

| Item | Specification |
|---|---|
| Purpose | Assignment issues for a dispatch |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dispatch.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `?dispatch_id=` |
| Response body | `{issues[]}` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `drivers` ([BM-DAT-003 — Data Dictionary (Proposed Production Schema)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-003_Data_Dictionary.xlsx)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |