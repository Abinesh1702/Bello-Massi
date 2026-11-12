---
title: "WF-04 — Sales Manager Approval Workflow"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-WF-04 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | WF-04 — Sales Manager Approval Workflow |
| Document ID | BM-WF-04 |
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

Specify the Sales Manager decision on submitted orders.

## Scope

Workflow WF-04 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-04 |
| Workflow name | Sales Manager Approval Workflow |
| Business purpose | Specify the Sales Manager decision on submitted orders. |
| Initiating role | Sales Manager |
| Trigger | Order SUBMITTED |
| Preconditions | Order SUBMITTED with approval PENDING. |
| Final outcome | Recorded decision with reason. |
| Related requirements | FR-APR-001, FR-APR-002, FR-APR-003, FR-APR-004, FR-APR-005 |
| Related test cases | TC-APR-001, TC-APR-002, TC-APR-N04, TC-APR-003, TC-APR-N01, TC-APR-004, TC-APR-005, TC-APR-N02 |
| Detailed chapter | `docs/workflow/` chapter 07 |

## 2. Step-by-step process

1. Open approval queue (oldest first).
2. Open order; system runs six checks.
3. Approve (acknowledge warnings, remarks if required) or return / reject with reason and remarks.

## 3. Decision points

Blocking checks; warnings; decision.

## 4. Approval conditions

All blocking checks pass; warnings acknowledged; remarks given if required.

## 5. Rejection conditions

Reason from list + remarks; reject is final; return sends back to salesman.

## 6. System actions

Approval record + timeline in one transaction; notifications; automation events.

## 7. User actions

Review and decide.

## 8. Status changes

SUBMITTED → APPROVED / RETURNED / REJECTED.

## 9. Notifications

Approved → salesman + Customer Service; returned / rejected → salesman.

## 10. Exception scenarios

Repeated decision refused; draft cannot be decided.

## 11. Workflow diagram



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/f8b6128f1234.png){width=17.00cm}





![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/8c68e4c6f105.png){width=17.00cm}



Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Recorded decision with reason.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |