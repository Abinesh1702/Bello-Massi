# WF-24 — Reporting Workflow

## Document control

| Field | Value |
|---|---|
| Document title | WF-24 — Reporting Workflow |
| Document ID | BM-WF-24 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Business Workflows |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify dashboards and reports.

## Scope

Workflow WF-24 as implemented in the prototype, with production differences marked.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-WF-00 — Business Workflow Catalogue](BM-WF-00_Business_Workflow_Catalogue.md)
- [BM-SYS-008 — Requirement Traceability Matrix](../03_SYSTEM_REQUIREMENTS/BM-SYS-008_Requirement_Traceability_Matrix.xlsx)

## Contents

- 1. Workflow summary
- 2. Step-by-step process
- 3. Decision points
- 4. Approval conditions
- 5. Rejection conditions
- 6. System actions
- 7. User actions
- 8. Status changes
- 9. Notifications
- 10. Exception scenarios
- 11. Workflow diagram
- 12. Final outcome

## 1. Workflow summary

| Field | Value |
|---|---|
| Workflow ID | WF-24 |
| Workflow name | Reporting Workflow |
| Business purpose | Specify dashboards and reports. |
| Initiating role | Office roles |
| Trigger | User opens a dashboard or report |
| Preconditions | Report category permission. |
| Final outcome | Insight / export. |
| Related requirements | FR-RPT-001, FR-RPT-002, FR-DASH-002 |
| Related test cases | TC-RPT-001, TC-RPT-002, TC-DASH-002, TC-DASH-N01 |
| Detailed chapter | `docs/workflow/` chapter 14 |

## 2. Step-by-step process

1. Choose period on dashboard; compare.
2. Drill down to lists.
3. Open Reports Center; search / favourite.
4. Run report with filters; export CSV or print.

## 3. Decision points

Report has source data?

## 4. Approval conditions

—

## 5. Rejection conditions

—

## 6. System actions

`reportService.runReport` with data scope.

## 7. User actions

Analysis.

## 8. Status changes

—

## 9. Notifications

—

## 10. Exception scenarios

24 reports state "no source data".

## 11. Workflow diagram

```mermaid
flowchart TD
    A[User signs in] --> B[Role dashboard]
    B --> C{Choose period}
    C --> D[Preset / custom range / specific period]
    D --> E[KPIs, charts and queues recalculated on business dates]
    E --> F{Compare on?}
    F -->|Yes| G[Show change vs previous equivalent period]
    F -->|No| H[Values only]
    E --> I[Click KPI or queue row - module list pre-filtered]
    B --> J["Reports Center /reports/center"]
    J --> K[Categories visible by permission]
    K --> L[Search / category / favourites / recently viewed / popular]
    L --> M["Open report /reports/view/:id"]
    M --> N{Report has source data?}
    N -->|No| N1[No source data for this report - reason shown]
    N -->|Yes| O[Rows built from LocalStorage within the user's data scope]
    O --> P[Filters: date from / to, month, year, group by, column filters]
    P --> Q[Table + chart]
    Q --> R{Output}
    R -->|Export CSV| S[CSV download]
    R -->|Print| T[Print / PDF from browser]
    M --> U[View recorded - recent and popular lists]
    B --> AI["AI Assistant / Jarvis"]
    AI --> AI2[Question - intent - permission-checked tool - KPIs / table / chart]
```

Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Insight / export.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |