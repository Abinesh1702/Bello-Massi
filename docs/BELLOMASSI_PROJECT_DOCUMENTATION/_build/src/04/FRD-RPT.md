---
id: "BM-FRD-RPT"
title: "Functional Requirements — Reports"
folder: "04"
file: "BM-FRD-RPT_Reports"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Reports"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Reports module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Reports module (/reports/center, /reports/view/:id)."
---
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

Permission keys (from `src/config/rbacCatalog.js`): `reports.center` + category permissions. Default grants per role are in {{ref:BM-SEC-005}}.

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

See {{ref:BM-WF-24}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

— Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

—

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_report_prefs`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

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


