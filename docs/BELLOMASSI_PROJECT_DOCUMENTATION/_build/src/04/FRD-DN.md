---
id: "BM-FRD-DN"
title: "Functional Requirements — Delivery Notes"
folder: "04"
file: "BM-FRD-DN_Delivery_Notes"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Delivery Notes"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Delivery Notes module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Delivery Notes module (/dispatch/delivery-notes/:id)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `DN` |
| Module name | Delivery Notes |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/dispatch/delivery-notes/:id` |
| Services / components | `deliveryNoteService` |
| LocalStorage keys (prototype) | `bellomassi_delivery_notes` |


## 2. Purpose

Automatic delivery note per completed stop, printable, visible to office, driver and customer.

## 3. Business objectives

The customer receives a delivery document immediately.

Related business requirements: BR-010.

## 4. User roles

- All signed-in users
- Customer (portal / app)
- Driver

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `deliveryNotes.view`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Delivery Note | `/dispatch/delivery-notes/:id` | `deliveryNotes.view` |
| My Delivery Notes | `/driver/delivery-notes` | `driver.app` |
| Delivery Note | `/driver/delivery-notes/:id` | `driver.app` |
| Delivery Notes | `/customer/delivery-notes` | `customer.app` |
| Delivery Note | `/customer/delivery-notes/:id` | `customer.app` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-DN-001 | P1 | A numbered delivery note (BM-DN-YYYY-NNNNN) shall be generated when a stop is completed (full or partial). | Driver | VERIFIED | Implemented and working (prototype) |
| FR-DN-002 | P1 | Delivery notes shall be printable and visible to office roles with permission, the driver and the customer. | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-DN-003 | P1 | The delivery note shall be sent to the customer instantly by SMS / WhatsApp / email (SOW slide 13). | Customer (portal / app) | PROPOSED | Planned (production) |

## 8. Input fields

(generated)

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-DN-001: expected behaviour — Note lists delivered, short and damaged quantities and receiver.
- FR-DN-002: expected behaviour — Print layout available.

## 11. Workflow

See {{ref:BM-WF-10}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Generated once per completed stop. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Customer notified on delivery.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_delivery_notes`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Delivery notes lists (office, driver, customer).

## 19. Audit requirements

Note number sequence and link to delivery. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-DN-001 | Note lists delivered, short and damaged quantities and receiver. | TC-DN-001 |
| FR-DN-002 | Print layout available. | TC-DN-002 |
| FR-DN-003 | Prototype: visible in the customer app only. | TC-DN-003 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 2, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Send by SMS / WhatsApp / email; PDF generation server-side; digital signature.

- FR-DN-003 (PROPOSED): The delivery note shall be sent to the customer instantly by SMS / WhatsApp / email (SOW slide 13).
