# Project Plan

## Document control

| Field | Value |
|---|---|
| Document title | Project Plan |
| Document ID | BM-PM-001 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Project Management |
| Related module(s) | All modules |
| Document owner | Project Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Overall plan for taking Bellomassi from prototype to production — objectives, phases, timeline, organisation, governance and controls.

## Scope

Phases 1–5. Timeline and effort are ESTIMATES with stated assumptions; no dates, milestones or approvals have been agreed with the client.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-PLN-001 — Scope and Phase Plan](../05_SCOPE_AND_PLANNING/BM-PLN-001_Scope_and_Phase_Plan.md)
- [BM-PLN-002 — Phase-wise Scope Matrix](../05_SCOPE_AND_PLANNING/BM-PLN-002_Phase_wise_Scope_Matrix.xlsx)
- [BM-PM-002 — Work Breakdown Structure](BM-PM-002_Work_Breakdown_Structure.xlsx)
- [BM-PM-003 — Deliverables Matrix](BM-PM-003_Deliverables_Matrix.xlsx)
- [BM-PM-004 — Resource Allocation and RACI Matrix](BM-PM-004_Resources_and_RACI.xlsx)
- [BM-PM-005 — Issue, Dependency and Decision Registers](BM-PM-005_Issue_Dependency_Decision_Registers.xlsx)
- [BM-RSK-001 — Risk Management Plan](../18_RISK_AND_CHANGE_MANAGEMENT/BM-RSK-001_Risk_Management_Plan.md)
- [BM-RSK-002 — Project Risk Register](../18_RISK_AND_CHANGE_MANAGEMENT/BM-RSK-002_Project_Risk_Register.xlsx)

## 1. Objectives

1. Confirm scope from the validated prototype (gate G0).
2. Build the production platform: backend, database, real authentication, integrations.
3. Deliver the native driver app with live GPS, OTP by message and instant delivery notes.
4. Go live with a pilot hub, then roll out.
5. Prepare stage-2 SAP integration and confirmed enhancements.

## 2. Current status (2026-11-12)

| Item | Status |
|---|---|
| Phase 1 prototype | Built — VERIFIED (source code) |
| Documentation | This package — draft for client review |
| Client approvals | None recorded |
| Phase 2 start | Not started; depends on gate G0 and hosting decision |

## 3. Phases and timeline (ESTIMATE)

Phases, entry / exit criteria and the indicative Gantt chart are in [BM-PLN-001 — Scope and Phase Plan](../05_SCOPE_AND_PLANNING/BM-PLN-001_Scope_and_Phase_Plan.md); requirement-to-phase mapping in
[BM-PLN-002 — Phase-wise Scope Matrix](../05_SCOPE_AND_PLANNING/BM-PLN-002_Phase_wise_Scope_Matrix.xlsx); work packages and effort in [BM-PM-002 — Work Breakdown Structure](BM-PM-002_Work_Breakdown_Structure.xlsx).

| Phase | Indicative duration | Main milestone |
|---|---|---|
| 2 Backend | 12–14 weeks | API + web app pass system test |
| 3 Mobile and integrations | ~9 weeks (overlapping phase 2) | Pilot-ready driver app |
| 4 Production deployment | 6–8 weeks | Go-live |
| 5 Enhancements | To be estimated | SAP integration |

Assumptions: start 4 January 2027 (not agreed); team per [BM-PM-004 — Resource Allocation and RACI Matrix](BM-PM-004_Resources_and_RACI.xlsx); scope without unconfirmed extensions; client
decisions within 5 working days; provider accounts available by phase 3.

## 4. Organisation and governance

| Body | Members | Frequency | Purpose |
|---|---|---|---|
| Steering committee | Client sponsor, PM, architect | Monthly / at gates | Scope, budget, go / no-go |
| Project meeting | PM, BA, leads, client PM | Weekly | Progress, issues, risks, decisions |
| Sprint ceremonies | Delivery team | 2-week sprints | Planning, review, retrospective |
| Change board | Sponsor, PM, BA | As needed | Change requests ([BM-RSK-003 — Change Management Process and Change Request Template](../18_RISK_AND_CHANGE_MANAGEMENT/BM-RSK-003_Change_Request_Process_and_Template.md)) |

## 5. Controls

| Control | Tool / document |
|---|---|
| Scope | BRD, SOW, RTM ([BM-SYS-008 — Requirement Traceability Matrix](../03_SYSTEM_REQUIREMENTS/BM-SYS-008_Requirement_Traceability_Matrix.xlsx)), change process |
| Schedule | WBS, sprint plans, status report ([BM-PM-007 — Project Status Report — 12 November 2026](BM-PM-007_Project_Status_Report.md)) |
| Risks / issues / dependencies / decisions | [BM-RSK-002 — Project Risk Register](../18_RISK_AND_CHANGE_MANAGEMENT/BM-RSK-002_Project_Risk_Register.xlsx), [BM-PM-005 — Issue, Dependency and Decision Registers](BM-PM-005_Issue_Dependency_Decision_Registers.xlsx) |
| Quality | Test strategy ([BM-QA-001 — Test Strategy](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-001_Test_Strategy.md)), definition of done |
| Communication | Weekly status report, steering minutes ([BM-PM-006 — Project Templates — Meeting Minutes, Sprint Planning and Status Report](BM-PM-006_Project_Templates.md)) |

## 6. Definition of done (per backlog item)

Code reviewed and merged; unit / API tests pass; acceptance criteria met; documentation updated; deployed to test; no
open Critical / High defects.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |