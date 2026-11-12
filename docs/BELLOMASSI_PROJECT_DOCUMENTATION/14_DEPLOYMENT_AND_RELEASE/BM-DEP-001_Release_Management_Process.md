# Release Management Process

## Document control

| Field | Value |
|---|---|
| Document title | Release Management Process |
| Document ID | BM-DEP-001 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Deployment and Release |
| Related module(s) | All modules |
| Document owner | Release Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define how releases are planned, approved, deployed and communicated.

## Scope

Production platform (PROPOSED). The prototype has no formal release process; version is tracked by APP_DATA_VERSION (8) only (VERIFIED).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-INF-007 — CI/CD Pipeline and Git Workflow](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-007_CICD_and_Git_Workflow.md)
- [BM-DEP-002 — Deployment Guide and Runbook](BM-DEP-002_Deployment_Guide.md)
- [BM-DEP-005 — Rollback Plan](BM-DEP-005_Rollback_Plan.md)
- [BM-DEP-007 — Deployment and Go-Live Checklists](BM-DEP-007_Deployment_Checklists.xlsx)

## 1. Release types

| Type | Content | Cadence (proposed) | Approval |
|---|---|---|---|
| Major | New modules, breaking API changes | Per phase | Client steering + release board |
| Minor | Features, non-breaking | Every 2–4 weeks | Release board |
| Patch | Defect fixes | As needed | Release manager + QA lead |
| Hotfix | Critical production fix | Immediately | Release manager; informed client |

## 2. Process

1. Scope agreed (release backlog) and change requests approved ([BM-RSK-003 — Change Management Process and Change Request Template](../18_RISK_AND_CHANGE_MANAGEMENT/BM-RSK-003_Change_Request_Process_and_Template.md)).
2. Code freeze; release branch / tag `vX.Y.Z`.
3. Deploy to staging; regression, UAT (if needed).
4. Release readiness review using checklists ([BM-DEP-007 — Deployment and Go-Live Checklists](BM-DEP-007_Deployment_Checklists.xlsx)).
5. Approval recorded (blank table below for each release).
6. Production deployment per [BM-DEP-002 — Deployment Guide and Runbook](BM-DEP-002_Deployment_Guide.md) in the agreed window.
7. Post-deployment verification; monitoring for 30 minutes; rollback criteria ([BM-DEP-005 — Rollback Plan](BM-DEP-005_Rollback_Plan.md)).
8. Release notes published ([BM-DEP-003 — Release Notes — Prototype Finalisation Release (Data Version 8)](BM-DEP-003_Release_Notes_Prototype_v8.md) for the format).

## 3. Release approval record (blank)

| Release | Date | QA lead | Release manager | Client approver | Decision |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## 4. Communication

Announce window 3 working days ahead (users, dispatch team, drivers). Driver app releases through store testing tracks;
force-update only when the API requires it.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |