---
title: "Document API Design"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-API-014 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Document API Design |
| Document ID | BM-API-014 |
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

Specify the proposed document api endpoints for the Django REST backend.

## Scope

9 endpoints under /api/v1.

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
| GET | `/api/v1/documents` | `documents.view` | Repository (scoped) |
| POST | `/api/v1/documents` | `documents.upload` | Upload (multipart, virus-scanned) |
| GET | `/api/v1/documents/{id}/download` | `documents.view` | Signed URL (short-lived) |
| POST | `/api/v1/documents/{id}/ocr` | `documents.review` | Run OCR |
| PATCH | `/api/v1/documents/{id}/review` | `documents.review` | Save corrected fields |
| POST | `/api/v1/documents/{id}/verify` | `documents.review` | Verify |
| POST | `/api/v1/documents/{id}/reject` | `documents.reject` | Reject |
| POST | `/api/v1/documents/{id}/replace` | `documents.upload` | Replace file (restarts review) |
| GET | `/api/v1/document-types` | `documents.view` | Document types |

### GET `/api/v1/documents`

| Item | Specification |
|---|---|
| Purpose | Repository (scoped) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `documents.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `?type=&entity=&status=` |
| Response body | `page<Document>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/documents`

| Item | Specification |
|---|---|
| Purpose | Upload (multipart, virus-scanned) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `documents.upload` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `file + {document_type_id, entity_type, entity_id, fields}` |
| Response body | `Document` |
| Validation / errors | 400 type / record / file; 403 out of scope (RULE-040); 413 too large; 415 type |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### GET `/api/v1/documents/{id}/download`

| Item | Specification |
|---|---|
| Purpose | Signed URL (short-lived) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `documents.view` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `{url, expires_at}` |
| Validation / errors | 404 |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/documents/{id}/ocr`

| Item | Specification |
|---|---|
| Purpose | Run OCR |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `documents.review` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `OcrResult` |
| Validation / errors | 409 not stored; 503 provider |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### PATCH `/api/v1/documents/{id}/review`

| Item | Specification |
|---|---|
| Purpose | Save corrected fields |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `documents.review` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{fields}` |
| Response body | `Document` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/documents/{id}/verify`

| Item | Specification |
|---|---|
| Purpose | Verify |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `documents.review` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `Document (VERIFIED)` |
| Validation / errors | 400 fields missing |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/documents/{id}/reject`

| Item | Specification |
|---|---|
| Purpose | Reject |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `documents.reject` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `{reason}` |
| Response body | `Document (REJECTED)` |
| Validation / errors | 400 reason |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### POST `/api/v1/documents/{id}/replace`

| Item | Specification |
|---|---|
| Purpose | Replace file (restarts review) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `documents.upload` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `file` |
| Response body | `Document` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

### GET `/api/v1/document-types`

| Item | Specification |
|---|---|
| Purpose | Document types |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `documents.view` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<DocumentType>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in **BM-SYS-007** (Business Rules Catalogue) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `documents` (**BM-DAT-003** (Data Dictionary (Proposed Production Schema))).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |