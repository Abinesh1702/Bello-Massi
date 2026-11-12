---
id: "BM-FRD-OWA"
title: "Functional Requirements — OpenWA (WhatsApp) Communication"
folder: "04"
file: "BM-FRD-OWA_OpenWA_WhatsApp_Communication"
category: "Functional Requirements"
owner: "Business Analyst"
module: "OpenWA (WhatsApp) Communication"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the OpenWA (WhatsApp) Communication module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the OpenWA (WhatsApp) Communication module (/communication/whatsapp/*)."
---
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

Permission keys (from `src/config/rbacCatalog.js`): `communication.view`, `communication.send`, `communication.settings`. Default grants per role are in {{ref:BM-SEC-005}}.

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

See {{ref:BM-WF-17}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Message statuses as email; session created / qr_ready / ready / disconnected. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_whatsapp_*, bellomassi_openwa_settings`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

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
