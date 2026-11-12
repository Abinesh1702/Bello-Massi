---
title: "Functional Requirements — OpenWA (WhatsApp) Communication"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-OWA · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — OpenWA (WhatsApp) Communication |
| Document ID | BM-FRD-OWA |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | OpenWA (WhatsApp) Communication |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the OpenWA (WhatsApp) Communication module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the OpenWA (WhatsApp) Communication module (/communication/whatsapp/*).

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
| Module code | `OWA` |
| Module name | OpenWA (WhatsApp) Communication |
| Current implementation status | **Simulated (mock session); gateway not verified** |
| Main routes | `/communication/whatsapp/*` |
| Services / components | `openWAService, whatsappMessageService` |
| LocalStorage keys (prototype) | `bellomassi_whatsapp_*, bellomassi_openwa_settings` |


## 2. Purpose

Compose and log WhatsApp messages, templates and OpenWA session settings.

## 3. Business objectives

Staff send WhatsApp messages with templates and a log.

Related business requirements: BR-013, BR-024.

## 4. User roles

- Administrator
- Customer Service
- Dispatcher
- Finance Executive
- Sales Executive (Salesman)
- Sales Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `communication.view`, `communication.send`, `communication.settings`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| WhatsApp | `/communication/whatsapp` | `whatsapp.view` |
| Compose | `/communication/whatsapp/compose` | `whatsapp.send` |
| History | `/communication/whatsapp/history` | `whatsapp.view` |
| WhatsApp Templates | `/communication/whatsapp/templates` | `whatsapp.view` |
| New Template | `/communication/whatsapp/templates/create` | `communication.templates` |
| Edit Template | `/communication/whatsapp/templates/:id/edit` | `communication.templates` |
| OpenWA Settings | `/communication/whatsapp/settings` | `communication.settings` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-OWA-001 | P2 | Users shall send WhatsApp messages using templates. | Sales Executive (Salesman), Sales Manager, Customer Service, Dispatcher, Finance Executive, Administrator | PROTOTYPE | Simulated in prototype |
| FR-OWA-002 | P2 | Live OpenWA session (QR, start / stop) through the gateway. | Administrator | NOT VERIFIED | Not verified |
| FR-OWA-003 | P1 | The customer messaging provider (SMS or WhatsApp; OpenWA is unofficial) must be confirmed at kickoff (SOW slide 16). | Administrator | PENDING CONFIRMATION | Pending client confirmation |

## 8. Input fields

Recipient number · message · template · OpenWA base URL, session, API key

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules



## 11. Workflow

See **BM-WF-17** (WF-17 — Communication Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Message statuses as email; session created / qr_ready / ready / disconnected. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_whatsapp_*, bellomassi_openwa_settings`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Communication category.

## 19. Audit requirements

WhatsApp message log. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-OWA-001 | Mock provider records "Sent · demo". | TC-OWA-001 |
| FR-OWA-002 | Not verified. | TC-OWA-002 |
| FR-OWA-003 | Decision recorded in the decision log. | TC-OWA-003 |

## 21. Current implementation status

**Simulated (mock session); gateway not verified.** Labels: PROTOTYPE 1, NOT VERIFIED 1, PENDING CONFIRMATION 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

WhatsApp Business Platform (official) or SMS provider; opt-in management.

- FR-OWA-002 (NOT VERIFIED): Live OpenWA session (QR, start / stop) through the gateway.
- FR-OWA-003 (PENDING CONFIRMATION): The customer messaging provider (SMS or WhatsApp; OpenWA is unofficial) must be confirmed at kickoff (SOW slide 16).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |