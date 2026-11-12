---
title: "Functional Requirements — Document Management and OCR"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-DOC · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Document Management and OCR |
| Document ID | BM-FRD-DOC |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Document Management and OCR |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Document Management and OCR module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Document Management and OCR module (/documents/*).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SYS-002** (Software Requirements Specification (SRS))
- **BM-SYS-003** (Functional Requirements Document (Consolidated))
- **BM-SYS-008** (Requirement Traceability Matrix)
- **BM-QA-011** (Functional Test Cases)

## Contents

- 1. Module overview
- 2. Purpose
- 3. Business objectives
- 4. User roles
- 5. Access permissions
- 6. Screens
- 7. Functional requirements
- 8. Input fields
- 9. Validation rules
- 10. Business rules
- 11. Workflow
- 12. Status lifecycle
- 13. Approval rules
- 14. Notifications
- 15. Error scenarios
- 16. Exception handling
- 17. Data dependencies
- 18. Reports
- 19. Audit requirements
- 20. Acceptance criteria
- 21. Current implementation status
- 22. Future enhancement requirements

## 1. Module overview

| Item | Value |
|---|---|
| Module code | `DOC` |
| Module name | Document Management and OCR |
| Current implementation status | **Implemented with limitations (OCR simulated)** |
| Main routes | `/documents/*` |
| Services / components | `documentService, ocrService, documentStorageService` |
| LocalStorage keys (prototype) | `bellomassi_documents, bellomassi_ocr_results, bellomassi_document_types` |


## 2. Purpose

Document repository, upload, OCR field capture, review, verification, rejection and expiry.

## 3. Business objectives

Documents are stored once, read automatically and verified before use.

Related business requirements: BR-022.

## 4. User roles

- Administrator
- Customer Service
- QA Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `documents.view`, `documents.upload`, `documents.review`, `documents.reject`, `documents.types`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Document Repository | `/documents` | `documents.view` |
| Upload Documents | `/documents/upload` | `documents.view` |
| OCR Queue | `/documents/ocr-queue` | `documents.view` |
| Verified | `/documents/verified` | `documents.view` |
| Rejected | `/documents/rejected` | `documents.view` |
| Document Types | `/documents/types` | `documents.types` |
| Document Reports | `/documents/reports` | `documents.reports` |
| New Document Type | `/documents/types/create` | `documents.types` |
| Edit Document Type | `/documents/types/:id/edit` | `documents.types` |
| OCR Review | `/documents/:id/review` | `documents.view` |
| Document | `/documents/:id` | `documents.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-DOC-001 | P1 | Users shall upload documents for records they may access, with type, linked record, file and key fields. | Most office roles | VERIFIED | Implemented and working (prototype) |
| FR-DOC-002 | P1 | The system shall extract fields with OCR and let reviewers correct them (originals kept). | Administrator, Customer Service, QA Manager | PROTOTYPE | Simulated in prototype |
| FR-DOC-003 | P1 | Reviewers shall verify or reject documents; rejection requires a reason. | Administrator, Customer Service, QA Manager | VERIFIED | Implemented and working (prototype) |
| FR-DOC-004 | P2 | Administrators shall maintain document types (fields, expiry, OCR, verification). | Administrator | VERIFIED | Implemented and working (prototype) |
| FR-DOC-005 | P1 | Production OCR shall run server-side (e.g. Tesseract / cloud OCR) with virus scanning of uploads. | Administrator | PROPOSED | Planned (production) |

## 8. Input fields

Document type · entity · record · file · document number · issue / expiry dates · extracted fields · review notes · rejection reason

## 9. Validation rules

- **RULE-040** — Users may upload only for records in their scope; verified documents are locked until the file is replaced; rejection needs a reason. _(enforced by `documentService`; message: Messages.)_

## 10. Business rules

- FR-DOC-001: expected behaviour — Status PENDING_OCR, PENDING_REVIEW or VERIFIED by type settings.
- FR-DOC-003: expected behaviour — VERIFIED (locked) or REJECTED.
- FR-DOC-004: expected behaviour — Built-in VMS codes cannot be changed.

## 11. Workflow

See **BM-WF-22** (WF-22 — Document Upload and Verification Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

PENDING_OCR → OCR_COMPLETED → PENDING_REVIEW → VERIFIED / REJECTED; EXPIRED (derived). Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

- FR-DOC-002: The system shall extract fields with OCR and let reviewers correct them (originals kept).
- FR-DOC-003: Reviewers shall verify or reject documents; rejection requires a reason.

## 14. Notifications

Expiry events; uploader sees rejection reason.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-DOC-N01 | Reject without reason | Validation error |
| TC-DOC-N02 | Upload for out-of-scope record | "You can only upload documents for your own records." |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_documents, bellomassi_ocr_results, bellomassi_document_types`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Document Reports (`/documents/reports`).

## 19. Audit requirements

OCR results keep original values; review history. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-DOC-001 | Status PENDING_OCR, PENDING_REVIEW or VERIFIED by type settings. | TC-DOC-001, TC-DOC-N02 |
| FR-DOC-002 | MOCK OCR pre-fills from the linked record (labelled Simulated OCR). | TC-DOC-002 |
| FR-DOC-003 | VERIFIED (locked) or REJECTED. | TC-DOC-003, TC-DOC-N01 |
| FR-DOC-004 | Built-in VMS codes cannot be changed. | TC-DOC-004 |
| FR-DOC-005 | Real field extraction; files never executed. | TC-DOC-005 |

## 21. Current implementation status

**Implemented with limitations (OCR simulated).** Labels: VERIFIED 3, PROTOTYPE 1, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Server-side OCR, virus scanning, object storage, retention rules.

- FR-DOC-005 (PROPOSED): Production OCR shall run server-side (e.g. Tesseract / cloud OCR) with virus scanning of uploads.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |