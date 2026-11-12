---
title: "WF-14 — Scrap Workflow"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-WF-14 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | WF-14 — Scrap Workflow |
| Document ID | BM-WF-14 |
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

Specify scrap write-off.

## Scope

Workflow WF-14 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-14 |
| Workflow name | Scrap Workflow |
| Business purpose | Specify scrap write-off. |
| Initiating role | Warehouse / QA / Inventory staff |
| Trigger | Unusable stock found |
| Preconditions | Unusable stock at hub. |
| Final outcome | Stock written off with evidence. |
| Related requirements | FR-SCR-001, FR-SCR-002, FR-SCR-003, FR-SCR-004 |
| Related test cases | TC-SCR-001, TC-SCR-002, TC-SCR-N02, TC-SCR-N03, TC-SCR-003, TC-SCR-N01, TC-SCR-004 |
| Detailed chapter | `docs/workflow/` chapter 07, 10 |

## 2. Step-by-step process

1. Create request (reason, qty, source, batch, photo).
2. Submit.
3. Approver (not requester) approves or rejects.
4. Approver posts write-off once.

## 3. Decision points

Approve or reject.

## 4. Approval conditions

Different user with scrap.approve.

## 5. Rejection conditions

Reason ≥ 5 characters.

## 6. System actions

Eligibility check; Scrap Write-off movement.

## 7. User actions

Requester, approver.

## 8. Status changes

DRAFT → PENDING_APPROVAL → APPROVED → COMPLETED; REJECTED; CANCELLED.

## 9. Notifications

Pending requests on warehouse dashboard.

## 10. Exception scenarios

Quantity above eligible; missing photo / batch; duplicate.

## 11. Workflow diagram



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/d869b62c9a3c.png){width=17.00cm}





![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/2c250c7a6bc2.png){width=8.68cm}



Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Stock written off with evidence.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |