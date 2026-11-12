# Test Summary Report (Template) and Quality Metrics

## Document control

| Field | Value |
|---|---|
| Document title | Test Summary Report (Template) and Quality Metrics |
| Document ID | BM-QA-006 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Testing and Quality Assurance |
| Related module(s) | All modules |
| Document owner | QA Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Template for the end-of-phase test summary and the definitions of quality metrics.

## Scope

Template only. No test summary can be issued yet (NOT VERIFIED).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-QA-001 — Test Strategy](BM-QA-001_Test_Strategy.md)
- [BM-QA-005 — Test Execution Report (Template)](BM-QA-005_Test_Execution_Report_Template.md)
- [BM-QA-003 — User Acceptance Testing (UAT) Plan](BM-QA-003_UAT_Plan.md)

## 1. Summary template

| Section | Content to complete |
|---|---|
| Scope tested | Modules, builds, environments |
| Approach | Levels and types executed vs plan |
| Results | Totals executed / passed / failed / blocked |
| Requirements coverage | Requirements with passed tests / total |
| Open defects | By severity with workaround and plan |
| Deviations | From plan and why |
| Risks for release | Residual risks |
| Recommendation | Go / Go with conditions / No go (QA view) |
| Sign-off | Blank fields below |

## 2. Metrics definitions

| Metric | Formula | Target (proposed) |
|---|---|---|
| Execution rate | executed ÷ planned | 100 % |
| Pass rate | passed ÷ executed | ≥ 95 % at exit |
| Requirements coverage | requirements with ≥ 1 passed test ÷ in-scope requirements | 100 % (Must) |
| Defect density | defects ÷ module (or KLOC) | Trend down |
| Open Critical / High at exit | count | 0 |
| Reopen rate | reopened ÷ fixed | < 10 % |
| Automation coverage | automated cases ÷ regression cases | ≥ 60 % |
| Mean time to fix (Critical) | avg hours | < 24 h |

## 3. Sign-off (blank)

| Role | Name | Signature | Date |
|---|---|---|---|
| QA Lead |  |  |  |
| Project Manager |  |  |  |
| Client representative |  |  |  |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |