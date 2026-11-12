---
id: "BM-FRD-CUS"
title: "Functional Requirements — Customer Management"
folder: "04"
file: "BM-FRD-CUS_Customer_Management"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Customer Management"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Customer Management module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Customer Management module (/customers)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `CUS` |
| Module name | Customer Management |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/customers` |
| Services / components | `customerService` |
| LocalStorage keys (prototype) | `bellomassi_customers` |


## 2. Purpose

Customer master: contacts, address, tax IDs, hub, zone, sales representative, VIP flag and credit settings.

## 3. Business objectives

Accurate customer master with delivery location and credit settings for ordering and approval.

Related business requirements: BR-014.

## 4. User roles

- Administrator
- Customer Service
- Super Admin
- Sales Executive (Salesman)
- Sales Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `customers.view`, `customers.manage`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Customer List | `/customers` | `customers.view` |
| Add Customer | `/customers/create` | `customers.manage` |
| Customer Details | `/customers/:id` | `customers.view` |
| Edit Customer | `/customers/:id/edit` | `customers.manage` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-CUS-001 | P1 | Administrators shall create customers with code, type, contacts, address, tax IDs, hub, zone, sales representative, VIP flag and credit settings. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-CUS-002 | P1 | Customer data shall be validated (unique code, 10-digit mobile, email, PAN AAAAA9999A, GSTIN containing PAN, 6-digit pincode). | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-CUS-003 | P2 | Users shall view customer details with credit position, orders, deliveries and documents within their scope. | Administrator, Super Admin, Sales Executive (Salesman), Sales Manager, Customer Service | VERIFIED | Implemented and working (prototype) |
| FR-CUS-004 | P2 | Customers referenced by orders or other records shall not be deletable. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-CUS-005 | P1 | Customer address and tax fields shall follow the operating country (UAE: emirate, TRN, +971 vs India: pincode, GSTIN/PAN, +91). | Administrator | PENDING CONFIRMATION | Pending client confirmation |

## 8. Input fields

Code · name · type · status · contact person · mobile · email · address lines · city · state · pincode · GSTIN · PAN · hub · zone · sales representative · VIP · credit enabled · credit limit · credit balance · credit days · customer since

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-CUS-001: expected behaviour — Customer saved and available for ordering.
- FR-CUS-002: expected behaviour — Invalid fields show messages; record is not saved.
- FR-CUS-003: expected behaviour — Salesman sees only assigned customers' documents.
- FR-CUS-004: expected behaviour — Delete is blocked and the blocking records are listed.

## 11. Workflow

See {{ref:BM-WF-06}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Customer: Active / Inactive / Blocked. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_customers`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Customer reports category (sales by customer, credit utilisation, VIP).

## 19. Audit requirements

Changes recorded in activity log (prototype); full field-level audit PROPOSED. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-CUS-001 | Customer saved and available for ordering. | TC-CUS-001 |
| FR-CUS-002 | Invalid fields show messages; record is not saved. | TC-CUS-002 |
| FR-CUS-003 | Salesman sees only assigned customers' documents. | TC-CUS-003 |
| FR-CUS-004 | Delete is blocked and the blocking records are listed. | TC-CUS-004 |
| FR-CUS-005 | Client confirms country rules before production. | TC-CUS-005 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 4, PENDING CONFIRMATION 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Multiple delivery locations per customer with geo-coordinates, SAP customer sync, credit balance from ERP.

- FR-CUS-005 (PENDING CONFIRMATION): Customer address and tax fields shall follow the operating country (UAE: emirate, TRN, +971 vs India: pincode, GSTIN/PAN, +91).
