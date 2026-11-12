---
id: "BM-FRD-NOTF"
title: "Functional Requirements — Notifications (in-app)"
folder: "04"
file: "BM-FRD-NOTF_Notifications_in_app"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Notifications (in-app)"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Notifications (in-app) module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Notifications (in-app) module (/notifications)."
---
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

Permission keys (from `src/config/rbacCatalog.js`): (all users). Default grants per role are in {{ref:BM-SEC-005}}.

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

See {{ref:BM-WF-23}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Unread → Read. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

—

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_notifications, bellomassi_notification_preferences`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

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
