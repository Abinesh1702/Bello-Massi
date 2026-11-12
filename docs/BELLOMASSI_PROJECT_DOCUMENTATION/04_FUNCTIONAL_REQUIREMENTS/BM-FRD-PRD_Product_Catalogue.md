# Functional Requirements — Product Catalogue

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Product Catalogue |
| Document ID | BM-FRD-PRD |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Product Catalogue |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Product Catalogue module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Product Catalogue module (/products).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-SYS-002 — Software Requirements Specification (SRS)](../03_SYSTEM_REQUIREMENTS/BM-SYS-002_Software_Requirements_Specification.md)
- [BM-SYS-003 — Functional Requirements Document (Consolidated)](../03_SYSTEM_REQUIREMENTS/BM-SYS-003_Functional_Requirements_Document.md)
- [BM-SYS-008 — Requirement Traceability Matrix](../03_SYSTEM_REQUIREMENTS/BM-SYS-008_Requirement_Traceability_Matrix.xlsx)
- [BM-QA-011 — Functional Test Cases](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-011_Functional_Test_Cases.xlsx)

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
| Module code | `PRD` |
| Module name | Product Catalogue |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/products` |
| Services / components | `productService` |
| LocalStorage keys (prototype) | `bellomassi_products` |


## 2. Purpose

Product master: codes, SKU, barcode, category, unit, price, tax, discount limit, storage condition and stock settings.

## 3. Business objectives

A controlled item catalogue for orders, stock and invoices.

Related business requirements: BR-014, BR-018.

## 4. User roles

- Administrator
- Super Admin

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `products.view`, `products.manage`. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Products | `/products` | `products.view` |
| Add Product | `/products/create` | `products.manage` |
| Product Details | `/products/:id` | `products.view` |
| Edit Product | `/products/:id/edit` | `products.manage` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-PRD-001 | P1 | Administrators shall maintain products with code, SKU, barcode, category, unit, price, tax %, maximum discount, storage condition and stock settings. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-PRD-002 | P1 | Product codes, SKUs and barcodes shall be unique; tax 0–100%; maximum stock greater than minimum. | Administrator, Super Admin | VERIFIED | Implemented and working (prototype) |
| FR-PRD-003 | P2 | Inactive or discontinued products shall not be orderable and shall block approval of orders containing them. | Most office roles | VERIFIED | Implemented and working (prototype) |
| FR-PRD-004 | P2 | Item master and quantities shall be synchronised from SAP in stage two (today updated manually from emails). | Administrator | PROPOSED | Planned (production) |

## 8. Input fields

Code · SKU · barcode · name · brand · category · product type · unit · pack size · price · tax % · maximum discount % · storage condition · track inventory · allow negative stock · batch controlled · minimum / maximum stock · status

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-PRD-001: expected behaviour — Product saved and orderable when Active.
- FR-PRD-002: expected behaviour — Duplicate or invalid values are rejected.
- FR-PRD-003: expected behaviour — Approval check "Products active" fails.

## 11. Workflow

See [BM-WF-13 — WF-13 — Inventory Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-13_Inventory_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Product: Active / Inactive / Discontinued. Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

## 13. Approval rules

- FR-PRD-003: Inactive or discontinued products shall not be orderable and shall block approval of orders containing them.

## 14. Notifications

Low stock alerts (inventory).

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `bellomassi_products`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

## 18. Reports

Inventory and sales reports by product.

## 19. Audit requirements

Activity log entries. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-PRD-001 | Product saved and orderable when Active. | TC-PRD-001 |
| FR-PRD-002 | Duplicate or invalid values are rejected. | TC-PRD-002 |
| FR-PRD-003 | Approval check "Products active" fails. | TC-PRD-003 |
| FR-PRD-004 | Items updated automatically from SAP. | TC-PRD-004 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 3, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

SAP item master sync (stage 2), product images, price lists per customer group.

- FR-PRD-004 (PROPOSED): Item master and quantities shall be synchronised from SAP in stage two (today updated manually from emails).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |