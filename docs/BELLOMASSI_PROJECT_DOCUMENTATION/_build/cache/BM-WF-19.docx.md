---
title: "WF-19 — Rejection Workflow"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-WF-19 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | WF-19 — Rejection Workflow |
| Document ID | BM-WF-19 |
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

Specify all rejection paths.

## Scope

Workflow WF-19 as implemented in the prototype, with production differences marked.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-WF-00** (Business Workflow Catalogue)
- **BM-SYS-008** (Requirement Traceability Matrix)

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
| Workflow ID | WF-19 |
| Workflow name | Rejection Workflow |
| Business purpose | Specify all rejection paths. |
| Initiating role | Sales Manager / reviewers |
| Trigger | Order, scrap, replenishment or document rejected |
| Preconditions | A request awaiting decision. |
| Final outcome | Requester informed. |
| Related requirements | FR-APR-005, FR-SCR-003, FR-DOC-003, FR-AI-003 |
| Related test cases | TC-APR-005, TC-APR-N02, TC-SCR-003, TC-SCR-N01, TC-DOC-003, TC-DOC-N01, TC-AI-003 |
| Detailed chapter | `docs/workflow/` chapter 07 |

## 2. Step-by-step process

1. Order: Sales Manager rejects with reason → REJECTED (final).
2. Scrap: approver rejects with reason → REJECTED.
3. Replenishment: Administrator rejects with reason → REJECTED.
4. Document: reviewer rejects with reason → REJECTED; uploader replaces file.

## 3. Decision points

Reject vs return (orders only).

## 4. Approval conditions

—

## 5. Rejection conditions

Reason mandatory in every case.

## 6. System actions

Decision records; notifications.

## 7. User actions

Approver.

## 8. Status changes

→ REJECTED.

## 9. Notifications

Requester notified / sees reason.

## 10. Exception scenarios

Missing reason refused.

## 11. Workflow diagram



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/943778cb7c33.png){width=17.00cm}



Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Requester informed.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |