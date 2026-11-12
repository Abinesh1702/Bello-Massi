---
title: "WF-05 — Customer Service Workflow"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-WF-05 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | WF-05 — Customer Service Workflow |
| Document ID | BM-WF-05 |
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

Describe Customer Service's daily work.

## Scope

Workflow WF-05 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-05 |
| Workflow name | Customer Service Workflow |
| Business purpose | Describe Customer Service's daily work. |
| Initiating role | Customer Service |
| Trigger | Order APPROVED |
| Preconditions | Approved orders exist. |
| Final outcome | Orders released to dispatch. |
| Related requirements | FR-CON-001, FR-CON-002, FR-CON-003, FR-DOC-003 |
| Related test cases | TC-CON-001, TC-CON-002, TC-CON-N01, TC-CON-003, TC-DOC-003, TC-DOC-N01 |
| Detailed chapter | `docs/workflow/` chapter 04 |

## 2. Step-by-step process

1. Open consolidation queue grouped by salesman.
2. For each order tick the five checks, review stock, add notes, consolidate.
3. Mark ready for dispatch.
4. Review documents in the OCR queue.
5. Handle customer calls.

## 3. Decision points

All checks confirmed?

## 4. Approval conditions

Consolidation (checklist).

## 5. Rejection conditions

Customer Service cannot reject; issues go to the Sales Manager / Administrator.

## 6. System actions

Consolidation record, notifications.

## 7. User actions

Verification.

## 8. Status changes

APPROVED → CONSOLIDATED → READY_FOR_DISPATCH.

## 9. Notifications

Dispatcher informed.

## 10. Exception scenarios

Incomplete checklist; non-approved order.

## 11. Workflow diagram



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/d7d25ba32d91.png){width=12.60cm}



Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Orders released to dispatch.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |