# Reporting API Design

## Document control

| Field | Value |
|---|---|
| Document title | Reporting API Design |
| Document ID | BM-API-017 |
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

Specify the proposed reporting api endpoints for the Django REST backend.

## Scope

5 endpoints under /api/v1.

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
| GET | `/api/v1/dashboard/{role}` | `dashboard.view` | Role dashboard KPIs for a period |
| GET | `/api/v1/reports` | `reports.center` | Report catalogue filtered by permission |
| GET | `/api/v1/reports/{id}` | `reports.center + category permission` | Run report within data scope |
| GET | `/api/v1/reports/{id}/export` | `data.export` | Export CSV / XLSX |
| GET | `/api/v1/monitor/orders` | `dashboard.view` | Live order monitor snapshot (WebSocket channel `monitor.orders` for updates) |

### GET `/api/v1/dashboard/{role}`

| Item | Specification |
|---|---|
| Purpose | Role dashboard KPIs for a period |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dashboard.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `?from=&to=&compare=true` |
| Response body | `{kpis[], queues[], charts[]}` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/reports`

| Item | Specification |
|---|---|
| Purpose | Report catalogue filtered by permission |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `reports.center` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<{id, category, title, available}>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/reports/{id}`

| Item | Specification |
|---|---|
| Purpose | Run report within data scope |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `reports.center + category permission` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `?from=&to=&month=&year=&group_by=` |
| Response body | `{columns[], rows[], totals}` |
| Validation / errors | 403 category; 422 no source data |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/reports/{id}/export`

| Item | Specification |
|---|---|
| Purpose | Export CSV / XLSX |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `data.export` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `?format=csv` |
| Response body | `file` |
| Validation / errors | 403 |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/monitor/orders`

| Item | Specification |
|---|---|
| Purpose | Live order monitor snapshot (WebSocket channel `monitor.orders` for updates) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `dashboard.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `page<Order>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `orders` ([BM-DAT-003 — Data Dictionary (Proposed Production Schema)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-003_Data_Dictionary.xlsx)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |