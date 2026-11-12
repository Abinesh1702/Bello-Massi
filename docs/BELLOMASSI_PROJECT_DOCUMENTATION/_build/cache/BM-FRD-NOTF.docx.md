---
title: "Functional Requirements — Notifications (in-app)"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-NOTF · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Notifications (in-app) |
| Document ID | BM-FRD-NOTF |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Notifications (in-app) |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Notifications (in-app) module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Notifications (in-app) module (/notifications).

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
| Module code | `NOTF` |
| Module name | Notifications (in-app) |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/notifications` |
| Services / components | `notificationService` |
| LocalStorage keys (prototype) | `bellomassi_notifications, bellomassi_notification_preferences` |


## 2. Purpose

Notification bell and centre with categories, read state and preferences.

## 3. Business objectives

Users know what needs their attention.

Related business requirements: BR-012.

## 4. User roles

- All signed-in users

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): (all users). Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Notification Center | `/notifications` | `—` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-NOTF-001 | P1 | Users shall receive in-app notifications for workflow events addressed to their role, user, driver or customer record. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-NOTF-002 | P3 | Users shall mark notifications read and mute categories. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-NOTF-003 | P2 | Production apps shall send push notifications to drivers and customers. | All signed-in users | PROPOSED | Planned (production) |

## 8. Input fields

Mute categories · toasts · digest

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-NOTF-001: expected behaviour — Bell count and Notification Center.
- FR-NOTF-002: expected behaviour — Preferences saved per user.

## 11. Workflow

See **BM-WF-23** (WF-23 — Notification Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Unread → Read. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

—

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_notifications, bellomassi_notification_preferences`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

—

## 19. Audit requirements

— Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-NOTF-001 | Bell count and Notification Center. | TC-NOTF-001 |
| FR-NOTF-002 | Preferences saved per user. | TC-NOTF-002 |
| FR-NOTF-003 | Push received on the phone. | TC-NOTF-003 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 2, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Push notifications (FCM / APNs), email digests.

- FR-NOTF-003 (PROPOSED): Production apps shall send push notifications to drivers and customers.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |