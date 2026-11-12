# Vehicle API Design

## Document control

| Field | Value |
|---|---|
| Document title | Vehicle API Design |
| Document ID | BM-API-013 |
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

Specify the proposed vehicle api endpoints for the Django REST backend.

## Scope

7 endpoints under /api/v1.

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
| GET | `/api/v1/vehicles` | `fleet.view` | Vehicle list |
| POST | `/api/v1/vehicles` | `fleet.manage` | Create vehicle |
| PATCH | `/api/v1/vehicles/{id}` | `fleet.manage` | Update vehicle / status |
| GET | `/api/v1/vms/compliance` | `vms.view` | Compliance per vehicle and driver |
| GET | `/api/v1/vms/expiry-register` | `vms.view` | Documents by urgency |
| GET | `/api/v1/vms/rules` | `vms.settings` | Compliance rules |
| PUT | `/api/v1/vms/rules` | `vms.settings` | Update rules |

### GET `/api/v1/vehicles`

| Item | Specification |
|---|---|
| Purpose | Vehicle list |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `fleet.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `page<Vehicle>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/vehicles`

| Item | Specification |
|---|---|
| Purpose | Create vehicle |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `fleet.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `Vehicle` |
| Response body | `Vehicle` |
| Validation / errors | 400 number format; 409 duplicate |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### PATCH `/api/v1/vehicles/{id}`

| Item | Specification |
|---|---|
| Purpose | Update vehicle / status |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `fleet.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `partial Vehicle` |
| Response body | `Vehicle` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/vms/compliance`

| Item | Specification |
|---|---|
| Purpose | Compliance per vehicle and driver |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `vms.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<{entity, documents[{type, expiry, state}]}>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/vms/expiry-register`

| Item | Specification |
|---|---|
| Purpose | Documents by urgency |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `vms.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `?state=` |
| Response body | `page` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/vms/rules`

| Item | Specification |
|---|---|
| Purpose | Compliance rules |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `vms.settings` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `ComplianceRules` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### PUT `/api/v1/vms/rules`

| Item | Specification |
|---|---|
| Purpose | Update rules |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `vms.settings` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `ComplianceRules` |
| Response body | `ComplianceRules` |
| Validation / errors | 400 |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `vehicles` ([BM-DAT-003 — Data Dictionary (Proposed Production Schema)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-003_Data_Dictionary.xlsx)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |