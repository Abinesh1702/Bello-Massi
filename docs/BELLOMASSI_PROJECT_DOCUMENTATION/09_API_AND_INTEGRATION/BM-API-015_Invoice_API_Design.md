# Invoice API Design

## Document control

| Field | Value |
|---|---|
| Document title | Invoice API Design |
| Document ID | BM-API-015 |
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

Specify the proposed invoice api endpoints for the Django REST backend.

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
| GET | `/api/v1/invoices` | `invoices.view` | List invoices |
| POST | `/api/v1/invoices/preview` | `invoices.manage` | Calculate without saving |
| POST | `/api/v1/invoices` | `invoices.manage` | Issue invoice (snapshot) |
| POST | `/api/v1/invoices/{id}/cancel` | `invoices.manage` | Cancel |
| GET | `/api/v1/invoices/{id}/pdf` | `invoices.view` | PDF (signed URL) |
| GET | `/api/v1/invoice-templates` | `invoices.templates` | Templates |
| POST | `/api/v1/invoice-templates` | `invoices.templates` | Create template |

### GET `/api/v1/invoices`

| Item | Specification |
|---|---|
| Purpose | List invoices |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `invoices.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `page<Invoice>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/invoices/preview`

| Item | Specification |
|---|---|
| Purpose | Calculate without saving |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `invoices.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `{order_id, template_id, quantity_basis, invoice_date, due_date, discount, charges}` |
| Response body | `{lines, totals}` |
| Validation / errors | 400 options (RULE-039) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/invoices`

| Item | Specification |
|---|---|
| Purpose | Issue invoice (snapshot) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `invoices.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `same as preview` |
| Response body | `Invoice (ISSUED)` |
| Validation / errors | 409 not eligible / already invoiced (RULE-038) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/invoices/{id}/cancel`

| Item | Specification |
|---|---|
| Purpose | Cancel |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `invoices.manage` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{reason}` |
| Response body | `Invoice (CANCELLED)` |
| Validation / errors | 400 reason; 409 already cancelled |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/invoices/{id}/pdf`

| Item | Specification |
|---|---|
| Purpose | PDF (signed URL) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `invoices.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `{url}` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/invoice-templates`

| Item | Specification |
|---|---|
| Purpose | Templates |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `invoices.templates` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<InvoiceTemplate>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/invoice-templates`

| Item | Specification |
|---|---|
| Purpose | Create template |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `invoices.templates` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `InvoiceTemplate` |
| Response body | `InvoiceTemplate` |
| Validation / errors | 400 |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `invoices` ([BM-DAT-003 — Data Dictionary (Proposed Production Schema)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-003_Data_Dictionary.xlsx)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |