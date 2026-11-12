# Functional Requirements — Invoice Customisation and Invoicing

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Invoice Customisation and Invoicing |
| Document ID | BM-FRD-INVC |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Invoice Customisation and Invoicing |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Invoice Customisation and Invoicing module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Invoice Customisation and Invoicing module (/invoices/*).

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
| Module code | `INVC` |
| Module name | Invoice Customisation and Invoicing |
| Current implementation status | **Implemented with limitations (demo tax; outside SOW)** |
| Main routes | `/invoices/*` |
| Services / components | `invoiceService, invoiceTemplateService, invoiceCalculationService` |
| LocalStorage keys (prototype) | `bellomassi_invoices, bellomassi_invoice_templates, bellomassi_invoice_settings` |


## 2. Purpose

Invoice templates, numbering, generation from orders, print, email (demo) and cancellation.

## 3. Business objectives

Invoices are produced consistently from order data (if invoicing is in scope).

Related business requirements: BR-023.

## 4. User roles

- Administrator
- Finance Executive

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `invoices.view`, `invoices.manage`, `invoices.templates`. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Invoice Dashboard | `/invoices/dashboard` | `invoices.view` |
| Invoices | `/invoices` | `invoices.view` |
| New Invoice | `/invoices/create` | `invoices.manage` |
| Invoice Templates | `/invoices/templates` | `invoices.templates` |
| Invoice Reports | `/invoices/reports` | `invoices.reports` |
| New Template | `/invoices/templates/create` | `invoices.templates` |
| Edit Template | `/invoices/templates/:id/edit` | `invoices.templates` |
| Template Preview | `/invoices/templates/:id/preview` | `invoices.view` |
| Print Invoice | `/invoices/:id/print` | `invoices.view` |
| Invoice | `/invoices/:id` | `invoices.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-INVC-001 | P2 | Finance shall maintain invoice templates (layout, fonts, colours, sections, default). | Administrator, Finance Executive | VERIFIED | Implemented and working (prototype) |
| FR-INVC-002 | P2 | Finance shall issue one invoice per approved-or-later order on ordered or delivered quantities with discounts and charges. | Administrator, Finance Executive | VERIFIED | Implemented and working (prototype) |
| FR-INVC-003 | P2 | Finance shall cancel an invoice with a reason, after which a new invoice can be issued. | Administrator, Finance Executive | VERIFIED | Implemented and working (prototype) |
| FR-INVC-004 | P2 | Finance shall configure invoice numbering (prefix, year, digits). | Administrator, Finance Executive | VERIFIED | Implemented and working (prototype) |
| FR-INVC-005 | P1 | The SOW states invoicing stays outside the application; the prototype includes invoicing. Production scope must be confirmed. | Finance Executive | PENDING CONFIRMATION | Pending client confirmation |
| FR-INVC-006 | P2 | Payments, receipts, credit notes and refunds. | Finance Executive | NOT IMPLEMENTED | Not implemented |

## 8. Input fields

Order · template · quantity basis · invoice date · due date · order discount (none / amount / percent) · shipping · additional charges · demo tax % · cancel reason

## 9. Validation rules

- **RULE-038** — One active invoice per order; only APPROVED-or-later orders; cancelling requires a reason. _(enforced by `invoiceService.invoiceEligibility`; message: Messages.)_
- **RULE-039** — Invoice total must be greater than zero; due date not before invoice date; demo tax ≤ 40%. _(enforced by `invoiceService.validateInvoiceOptions`; message: Messages.)_

## 10. Business rules

- FR-INVC-001: expected behaviour — Template preview available.
- FR-INVC-002: expected behaviour — Invoice BM-INV-YYYY-NNNNN ISSUED with frozen snapshot.
- FR-INVC-003: expected behaviour — CANCELLED; order invoiceable again.
- FR-INVC-004: expected behaviour — Next number follows settings.

## 11. Workflow

See [BM-WF-16 — WF-16 — Invoice Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-16_Invoice_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

ISSUED → CANCELLED. Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

## 13. Approval rules

- FR-INVC-002: Finance shall issue one invoice per approved-or-later order on ordered or delivered quantities with discounts and charges.

## 14. Notifications

Administrator and Finance on issue; automation INVOICE_GENERATED.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-INVC-N01 | Invoice a draft order | "Draft orders cannot be invoiced." |
| TC-INVC-N02 | Second invoice for same order | "…already has invoice … Cancel it first…" |
| TC-INVC-N03 | Cancel without reason | "Give a reason for cancelling." |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `bellomassi_invoices, bellomassi_invoice_templates, bellomassi_invoice_settings`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

## 18. Reports

Invoice Reports; Finance category.

## 19. Audit requirements

Invoice snapshot is frozen; cancellation reason stored. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-INVC-001 | Template preview available. | TC-INVC-001 |
| FR-INVC-002 | Invoice BM-INV-YYYY-NNNNN ISSUED with frozen snapshot. | TC-INVC-002, TC-INVC-N01, TC-INVC-N02 |
| FR-INVC-003 | CANCELLED; order invoiceable again. | TC-INVC-003, TC-INVC-N03 |
| FR-INVC-004 | Next number follows settings. | TC-INVC-004 |
| FR-INVC-005 | Client decision recorded. | TC-INVC-005 |
| FR-INVC-006 | Not available. | TC-INVC-006 |

## 21. Current implementation status

**Implemented with limitations (demo tax; outside SOW).** Labels: VERIFIED 4, PENDING CONFIRMATION 1, NOT IMPLEMENTED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Confirm scope; VAT / GST compliance, e-invoicing, payments, credit notes, SAP billing.

- FR-INVC-005 (PENDING CONFIRMATION): The SOW states invoicing stays outside the application; the prototype includes invoicing. Production scope must be confirmed.
- FR-INVC-006 (NOT IMPLEMENTED): Payments, receipts, credit notes and refunds.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |