---
id: "BM-FRD-CRD"
title: "Functional Requirements — Credit Validation"
folder: "04"
file: "BM-FRD-CRD_Credit_Validation"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Credit Validation"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Credit Validation module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Credit Validation module (/customers/credit, /orders/approval/:id)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `CRD` |
| Module name | Credit Validation |
| Current implementation status | **Implemented with limitations (balance is a manual field; no payments)** |
| Main routes | `/customers/credit, /orders/approval/:id` |
| Services / components | `customerService.getOrderCreditPosition, approvalService` |
| LocalStorage keys (prototype) | `bellomassi_customers` |


## 2. Purpose

Credit limit check on every order, warning or block at approval, customer credit overview.

## 3. Business objectives

Credit exposure is visible and controlled at the moment of approval.

Related business requirements: BR-003, BR-018.

## 4. User roles

- Administrator
- Finance Executive
- Sales Executive (Salesman)
- Sales Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `customers.credit.view`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Customer Credit | `/customers/credit` | `customers.credit.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-CRD-001 | P1 | The system shall calculate the projected balance (current balance + order total) against the credit limit for every order. | Sales Executive (Salesman), Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-CRD-002 | P1 | Exceeding the credit limit shall be a warning by default and a blocking check when "Block when credit exceeded" is enabled. | Sales Manager, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-CRD-003 | P2 | Users shall view credit limits, balances and utilisation for all customers. | Administrator, Sales Manager, Finance Executive | VERIFIED | Implemented and working (prototype) |
| FR-CRD-004 | P1 | Customer balances shall be updated from invoices and payments. | Finance Executive | NOT IMPLEMENTED | Not implemented |
| FR-CRD-005 | P2 | Credit balances shall be synchronised from the finance system (SAP) in production. | Finance Executive | PROPOSED | Planned (production) |

## 8. Input fields

Credit enabled · credit limit · credit balance · credit days (customer master) · Application Settings › Approval: block when credit exceeded

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-CRD-001: expected behaviour — Credit position shown on order and approval screens.
- FR-CRD-002: expected behaviour — Approve is disabled when blocking is on and the limit is exceeded.
- FR-CRD-003: expected behaviour — Customer Credit page lists utilisation and over-limit customers.

## 11. Workflow

See {{ref:BM-WF-06}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Not applicable (check result: within limit / warning / block). Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Warning flag on approval notification.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-CRD-N01 | Credit block setting | Approve disabled; reason shown |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_customers`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Credit utilisation, over-limit customers (Customer and Finance categories).

## 19. Audit requirements

Approval record stores the credit warning flag. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-CRD-001 | Credit position shown on order and approval screens. | TC-CRD-001 |
| FR-CRD-002 | Approve is disabled when blocking is on and the limit is exceeded. | TC-CRD-002, TC-CRD-N01 |
| FR-CRD-003 | Customer Credit page lists utilisation and over-limit customers. | TC-CRD-003 |
| FR-CRD-004 | Not implemented: balance is a manually maintained field; payments are not recorded. | TC-CRD-004 |
| FR-CRD-005 | Balance reflects ERP receivables. | TC-CRD-005 |

## 21. Current implementation status

**Implemented with limitations (balance is a manual field; no payments).** Labels: VERIFIED 3, NOT IMPLEMENTED 1, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Balance from ERP receivables, payment posting, credit holds, Finance notification on exceptions.

- FR-CRD-004 (NOT IMPLEMENTED): Customer balances shall be updated from invoices and payments.
- FR-CRD-005 (PROPOSED): Credit balances shall be synchronised from the finance system (SAP) in production.
