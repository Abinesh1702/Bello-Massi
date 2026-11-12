---
title: "Functional Requirements — Email Communication"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-EML · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Email Communication |
| Document ID | BM-FRD-EML |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Email Communication |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Email Communication module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Email Communication module (/communication/email/*).

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
| Module code | `EML` |
| Module name | Email Communication |
| Current implementation status | **Simulated (demo mode); gateway not verified** |
| Main routes | `/communication/email/*` |
| Services / components | `emailService, emailInboxService` |
| LocalStorage keys (prototype) | `bellomassi_email_*` |


## 2. Purpose

Compose, drafts, sent, history, templates, inbox and settings for email.

## 3. Business objectives

Staff email customers from the platform with a record of what was sent.

Related business requirements: BR-024.

## 4. User roles

- Administrator
- Customer Service
- Dispatcher
- Finance Executive
- Sales Executive (Salesman)
- Sales Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `communication.view`, `communication.send`, `communication.inbox`, `communication.templates`, `communication.settings`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Email | `/communication/email` | `communication.view` |
| Compose Email | `/communication/email/compose` | `communication.send` |
| Inbox | `/communication/email/inbox` | `communication.inbox` |
| Sent | `/communication/email/sent` | `communication.view` |
| Drafts | `/communication/email/drafts` | `communication.send` |
| History | `/communication/email/history` | `communication.view` |
| Email Templates | `/communication/email/templates` | `communication.view` |
| New Template | `/communication/email/templates/create` | `communication.templates` |
| Edit Template | `/communication/email/templates/:id/edit` | `communication.templates` |
| Email Settings | `/communication/email/settings` | `communication.settings` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-EML-001 | P2 | Users shall compose and send emails with templates and document attachments. | Sales Executive (Salesman), Sales Manager, Customer Service, Dispatcher, Finance Executive, Administrator | PROTOTYPE | Simulated in prototype |
| FR-EML-002 | P2 | Administrators shall maintain email templates with variables. | Administrator | VERIFIED | Implemented and working (prototype) |
| FR-EML-003 | P3 | Users shall read the mailbox. | Administrator, Sales Manager, Customer Service | PROTOTYPE | Simulated in prototype |
| FR-EML-004 | P2 | Live SMTP / IMAP through the integration gateway. | Administrator | NOT VERIFIED | Not verified |

## 8. Input fields

To · CC · subject · body · template · attachments · SMTP / IMAP settings

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-EML-002: expected behaviour — Templates render with record values.

## 11. Workflow

See **BM-WF-17** (WF-17 — Communication Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

DRAFT → QUEUED → SENDING → SENT → DELIVERED / FAILED; demo: QUEUED_DEMO → SENT_DEMO. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_email_*`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Communication category.

## 19. Audit requirements

Email history. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-EML-001 | Demo mode records SENT_DEMO ("not sent"). | TC-EML-001 |
| FR-EML-002 | Templates render with record values. | TC-EML-002 |
| FR-EML-003 | Seeded demo mailbox. | TC-EML-003 |
| FR-EML-004 | Not verified (no gateway available). | TC-EML-004 |

## 21. Current implementation status

**Simulated (demo mode); gateway not verified.** Labels: PROTOTYPE 2, VERIFIED 1, NOT VERIFIED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Transactional email provider (SES / SendGrid / M365), bounce handling, DKIM / SPF / DMARC.

- FR-EML-004 (NOT VERIFIED): Live SMTP / IMAP through the integration gateway.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |