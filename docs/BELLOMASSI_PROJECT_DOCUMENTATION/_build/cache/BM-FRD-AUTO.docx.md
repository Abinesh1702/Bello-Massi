---
title: "Functional Requirements — Automated Notifications"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-AUTO · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Automated Notifications |
| Document ID | BM-FRD-AUTO |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Automated Notifications |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Automated Notifications module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Automated Notifications module (/communication/automation).

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
| Module code | `AUTO` |
| Module name | Automated Notifications |
| Current implementation status | **Implemented over simulated channels** |
| Main routes | `/communication/automation` |
| Services / components | `automationService` |
| LocalStorage keys (prototype) | `bellomassi_notification_templates, bellomassi_notification_history` |


## 2. Purpose

Event-driven email / WhatsApp rules with recipients, templates, de-duplication and history.

## 3. Business objectives

Customers and staff are informed automatically at key events.

Related business requirements: BR-012, BR-024.

## 4. User roles

- Administrator

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `communication.automation`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Automated Notifications | `/communication/automation` | `communication.automation` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-AUTO-001 | P2 | Administrators shall configure per-event rules (channel, recipients, templates) and a master switch. | Administrator | VERIFIED | Implemented and working (prototype) |
| FR-AUTO-002 | P2 | Workflow events shall trigger messages once per record (de-duplicated) and be logged in history. | System | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Master switch · per event: enabled, channel, recipient rule, email template, WhatsApp template

## 9. Validation rules

- **RULE-042** — Automated messages are sent once per event and record; skipped when automation is off, no rule or no template. _(enforced by `automationService.fireEvent`; message: History SKIPPED with reason.)_

## 10. Business rules

- FR-AUTO-001: expected behaviour — 11 events configurable.
- FR-AUTO-002: expected behaviour — History shows SENT_DEMO / SKIPPED with reason.

## 11. Workflow

See **BM-WF-17** (WF-17 — Communication Workflow), **BM-WF-23** (WF-23 — Notification Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

History: SKIPPED / SENT_DEMO / SENT / PARTIAL / FAILED. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

This module sends them.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_notification_templates, bellomassi_notification_history`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Notification history.

## 19. Audit requirements

History records every attempt. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-AUTO-001 | 11 events configurable. | TC-AUTO-001 |
| FR-AUTO-002 | History shows SENT_DEMO / SKIPPED with reason. | TC-AUTO-002 |

## 21. Current implementation status

**Implemented over simulated channels.** Labels: VERIFIED 2. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Configurable in-app targets, quiet hours, retries with back-off.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |