---
id: "BM-FRD-AUTO"
title: "Functional Requirements — Automated Notifications"
folder: "04"
file: "BM-FRD-AUTO_Automated_Notifications"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Automated Notifications"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Automated Notifications module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Automated Notifications module (/communication/automation)."
---
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

Permission keys (from `src/config/rbacCatalog.js`): `communication.automation`. Default grants per role are in {{ref:BM-SEC-005}}.

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

See {{ref:BM-WF-17}}, {{ref:BM-WF-23}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

History: SKIPPED / SENT_DEMO / SENT / PARTIAL / FAILED. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

This module sends them.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_notification_templates, bellomassi_notification_history`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

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


