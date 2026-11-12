---
id: "BM-FRD-HUB"
title: "Functional Requirements — Hubs, Suppliers and Organisation Master"
folder: "04"
file: "BM-FRD-HUB_Hubs_Suppliers_and_Organisation_Master"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Hubs, Suppliers and Organisation Master"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Hubs, Suppliers and Organisation Master module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Hubs, Suppliers and Organisation Master module (/hubs, /suppliers, /admin/organization/*)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `HUB` |
| Module name | Hubs, Suppliers and Organisation Master |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/hubs, /suppliers, /admin/organization/*` |
| Services / components | `hubService, supplierService, organizationService` |
| LocalStorage keys (prototype) | `bellomassi_hubs, bellomassi_forecast_settings, bellomassi_company, bellomassi_organization` |


## 2. Purpose

Fulfilment hubs, suppliers, company profile and organisation structure.

## 3. Business objectives

Locations, suppliers and organisation data used by every workflow.

Related business requirements: BR-013.

## 4. User roles

- Administrator
- Super Admin

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `hubs.view`, `hubs.manage`, `suppliers.view`, `suppliers.manage`, `organization.view`, `organization.manage`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Suppliers | `/suppliers` | `suppliers.view` |
| Hubs | `/hubs` | `hubs.view` |
| Company | `/admin/organization/company` | `organization.view` |
| Branches | `/admin/organization/branches` | `organization.view` |
| Business Units | `/admin/organization/business-units` | `organization.view` |
| Departments | `/admin/organization/departments` | `organization.view` |
| Designations | `/admin/organization/designations` | `organization.view` |
| Employee Master | `/admin/organization/employees` | `['organization.view', 'users.view']` |
| Warehouse Master | `/admin/organization/warehouses` | `organization.view` |
| Add Hub | `/hubs/create` | `hubs.manage` |
| Hub Details | `/hubs/:id` | `hubs.view` |
| Edit Hub | `/hubs/:id/edit` | `hubs.manage` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-HUB-001 | P1 | Administrators shall maintain hubs (type, address, contacts, status). | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-HUB-002 | P2 | Administrators shall maintain suppliers with lead time and products for replenishment. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-HUB-003 | P3 | Administrators shall maintain the company profile and organisation structure (branches, business units, departments, designations, employees, warehouses). | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Hub: code, name, type, status, address, contacts, operating hours, cold rooms · Supplier: name, contact, lead time, products · Company: name, logo, address, currency, tax number

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-HUB-001: expected behaviour — Hub available for stock, orders and dispatch when Active.
- FR-HUB-002: expected behaviour — Supplier selectable on replenishment requests.
- FR-HUB-003: expected behaviour — Records saved and used on documents.

## 11. Workflow

See {{ref:BM-WF-13}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Hub: Active / Inactive. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

None.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_hubs, bellomassi_forecast_settings, bellomassi_company, bellomassi_organization`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Supplier and hub reports.

## 19. Audit requirements

Organisation changes audited. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-HUB-001 | Hub available for stock, orders and dispatch when Active. | TC-HUB-001 |
| FR-HUB-002 | Supplier selectable on replenishment requests. | TC-HUB-002 |
| FR-HUB-003 | Records saved and used on documents. | TC-HUB-003 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 3. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Branch-level settings, multi-company support.


