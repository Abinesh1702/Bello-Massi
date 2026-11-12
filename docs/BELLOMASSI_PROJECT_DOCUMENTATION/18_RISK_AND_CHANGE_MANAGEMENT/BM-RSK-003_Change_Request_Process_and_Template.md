# Change Management Process and Change Request Template

## Document control

| Field | Value |
|---|---|
| Document title | Change Management Process and Change Request Template |
| Document ID | BM-RSK-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Risk and Change Management |
| Related module(s) | All modules |
| Document owner | Project Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define how changes to the agreed scope are requested, analysed, approved and recorded.

## Scope

Applies after the scope baseline (gate G0). PROPOSED process.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-RSK-004 — Change Impact Analysis — Prototype Extensions and Gaps](BM-RSK-004_Change_Impact_Analysis.md)
- [BM-SYS-009 — Requirement Change Log](../03_SYSTEM_REQUIREMENTS/BM-SYS-009_Requirement_Change_Log.xlsx)
- [BM-PM-001 — Project Plan](../17_PROJECT_MANAGEMENT/BM-PM-001_Project_Plan.md)

## 1. Process

1. Requester submits a change request (template below).
2. BA logs it in the change log ([BM-SYS-009 — Requirement Change Log](../03_SYSTEM_REQUIREMENTS/BM-SYS-009_Requirement_Change_Log.xlsx)).
3. Impact analysis ([BM-RSK-004 — Change Impact Analysis — Prototype Extensions and Gaps](BM-RSK-004_Change_Impact_Analysis.md)) — scope, effort, schedule, cost, risk, documents.
4. Change board decides: approve / reject / defer.
5. Approved changes update the baseline documents (BRD, SOW, RTM) and the plan.

## 2. Change request template

| Field | Content |
|---|---|
| CR ID | CR-### |
| Title | |
| Requested by / date | |
| Description | What should change |
| Reason / business benefit | |
| Affected modules / requirements | FR / BR IDs |
| Priority | Must / Should / Could |
| Impact analysis | Reference to analysis |
| Effort and cost estimate | ESTIMATE |
| Schedule impact | |
| Decision | Approve / Reject / Defer |
| Approved by (blank) | Name, signature, date |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |