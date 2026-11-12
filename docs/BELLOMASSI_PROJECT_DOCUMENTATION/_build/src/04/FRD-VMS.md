---
id: "BM-FRD-VMS"
title: "Functional Requirements — Vehicle Management System"
folder: "04"
file: "BM-FRD-VMS_Vehicle_Management_System"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Vehicle Management System"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Vehicle Management System module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Vehicle Management System module (/vms/*)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `VMS` |
| Module name | Vehicle Management System |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/vms/*` |
| Services / components | `complianceService, vehicleService` |
| LocalStorage keys (prototype) | `bellomassi_vms_settings, bellomassi_documents` |


## 2. Purpose

Vehicle and driver document compliance, expiry register, rules that block assignment.

## 3. Business objectives

No vehicle or driver with expired mandatory papers goes on the road.

Related business requirements: BR-021.

## 4. User roles

- Administrator
- Customer Service
- Dispatcher
- QA Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `vms.view`, `vms.manage`, `vms.documents.upload`, `vms.settings`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| VMS Dashboard | `/vms` | `vms.view` |
| Vehicles | `/vms/vehicles` | `vms.view` |
| Driver Documents | `/vms/drivers` | `vms.view` |
| Document Expiry | `/vms/document-expiry` | `vms.view` |
| VMS Reports | `/vms/reports` | `vms.view` |
| Compliance Rules | `/vms/settings` | `vms.settings` |
| New Vehicle | `/vms/vehicles/create` | `vms.manage` |
| Edit Vehicle | `/vms/vehicles/:id/edit` | `vms.manage` |
| Vehicle Documents | `/vms/vehicles/:id/documents` | `vms.view` |
| Vehicle Details | `/vms/vehicles/:id` | `vms.view` |
| Driver Documents | `/vms/drivers/:id/documents` | `vms.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-VMS-001 | P1 | The system shall compute compliance per vehicle and driver document (Valid, 30 days, 7 days, today, expired, missing). | Administrator, Dispatcher, QA Manager | VERIFIED | Implemented and working (prototype) |
| FR-VMS-002 | P1 | Administrators shall define required documents and blocking rules; an expired required document always blocks assignment. | Administrator | VERIFIED | Implemented and working (prototype) |
| FR-VMS-003 | P2 | Authorised users shall upload vehicle and driver documents with expiry dates. | Administrator, Customer Service, Dispatcher | VERIFIED | Implemented and working (prototype) |
| FR-VMS-004 | P2 | Opening the expiry register shall raise DOCUMENT_EXPIRING / DOCUMENT_EXPIRED events. | Administrator | VERIFIED | Implemented and working (prototype) |
| FR-VMS-005 | P3 | Fuel, maintenance and trip cost tracking. | Administrator | NOT IMPLEMENTED | Not implemented |

## 8. Input fields

Vehicle documents: RC, insurance, PUC, fitness, permit (number, expiry, file) · driver documents: licence, medical · rules: required documents, warning days, block flags

## 9. Validation rules

- **RULE-025** — An expired required document always blocks assignment; warning and missing blocks are optional. _(enforced by `complianceService`; message: Block message.)_

## 10. Business rules

- FR-VMS-001: expected behaviour — Expiry register sorted by urgency.
- FR-VMS-002: expected behaviour — Assignment blocked with the specific document message.
- FR-VMS-003: expected behaviour — Document enters the review flow.
- FR-VMS-004: expected behaviour — Automated notification when a rule is enabled.

## 11. Workflow

See {{ref:BM-WF-15}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Expiry: VALID / MONTH / WEEK / TODAY / EXPIRED / MISSING. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

DOCUMENT_EXPIRING / DOCUMENT_EXPIRED automation events.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_vms_settings, bellomassi_documents`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

VMS reports, Fleet category.

## 19. Audit requirements

Document history; settings changes audited. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-VMS-001 | Expiry register sorted by urgency. | TC-VMS-001 |
| FR-VMS-002 | Assignment blocked with the specific document message. | TC-VMS-002 |
| FR-VMS-003 | Document enters the review flow. | TC-VMS-003 |
| FR-VMS-004 | Automated notification when a rule is enabled. | TC-VMS-004 |
| FR-VMS-005 | Related reports show "no source data". | TC-VMS-005 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 4, NOT IMPLEMENTED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Fuel, maintenance and trip costs; telematics; renewal workflow.

- FR-VMS-005 (NOT IMPLEMENTED): Fuel, maintenance and trip cost tracking.
