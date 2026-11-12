# Functional Requirements — Reports

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Reports |
| Document ID | BM-FRD-RPT |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Reports |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Reports module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Reports module (/reports/center, /reports/view/:id).

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
| Module code | `RPT` |
| Module name | Reports |
| Current implementation status | **Implemented with limitations (24 reports without source data)** |
| Main routes | `/reports/center, /reports/view/:id` |
| Services / components | `reportService` |
| LocalStorage keys (prototype) | `bellomassi_report_prefs` |


## 2. Purpose

Reports Center with 118 reports in 11 categories, filters, favourites, CSV export and print; module report pages.

## 3. Business objectives

Management and teams analyse performance and export data.

Related business requirements: BR-015.

## 4. User roles

- See functional requirements.

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `reports.center` + category permissions. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Reports Center | `/reports/center` | `reports.center` |
| Report | `/reports/view/:id` | `reports.center` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-RPT-001 | P2 | Users shall browse 118 reports in 11 categories filtered by permission, with search, favourites and recent. | Office roles | VERIFIED | Implemented and working (prototype) |
| FR-RPT-002 | P2 | Reports shall run with date, month, year and grouping filters within the user's data scope and export to CSV or print. | Office roles | VERIFIED | Implemented and working (prototype) |
| FR-RPT-003 | P3 | Reports without source data shall say so with the reason. | Office roles | VERIFIED | Implemented and working (prototype) |

## 8. Input fields

Date from / to · month · year · group by · column filters

## 9. Validation rules

- Standard required-field and format validation on the forms of this module (see the service named in section 1).

## 10. Business rules

- FR-RPT-001: expected behaviour — Only permitted categories visible.
- FR-RPT-002: expected behaviour — CSV downloaded; print layout.
- FR-RPT-003: expected behaviour — 24 reports show "no source data".

## 11. Workflow

See [BM-WF-24 — WF-24 — Reporting Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-24_Reporting_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

— Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

—

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `bellomassi_report_prefs`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

## 18. Reports

118 reports in 11 categories.

## 19. Audit requirements

Report views tracked for recent / popular lists (`bellomassi_report_prefs`). Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-RPT-001 | Only permitted categories visible. | TC-RPT-001 |
| FR-RPT-002 | CSV downloaded; print layout. | TC-RPT-002 |
| FR-RPT-003 | 24 reports show "no source data". | TC-RPT-003 |

## 21. Current implementation status

**Implemented with limitations (24 reports without source data).** Labels: VERIFIED 3. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Server-side reporting, scheduled reports, BI connector.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |