---
title: "WF-08 — Dispatch Workflow"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-WF-08 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | WF-08 — Dispatch Workflow |
| Document ID | BM-WF-08 |
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

Specify dispatch planning, confirmation and closing.

## Scope

Workflow WF-08 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-08 |
| Workflow name | Dispatch Workflow |
| Business purpose | Specify dispatch planning, confirmation and closing. |
| Initiating role | Dispatcher |
| Trigger | Orders READY_FOR_DISPATCH |
| Preconditions | READY_FOR_DISPATCH orders; active zones, drivers and vehicles. |
| Final outcome | Confirmed vehicle run. |
| Related requirements | FR-DSP-001, FR-DSP-002, FR-DSP-003, FR-DSP-004, FR-DSP-005, FR-DSP-007 |
| Related test cases | TC-DSP-001, TC-DSP-002, TC-DSP-N01, TC-DSP-003, TC-DSP-004, TC-DSP-N02, TC-DSP-N03, TC-DSP-N04, TC-DSP-005, TC-DSP-N05, TC-DSP-007 |
| Detailed chapter | `docs/workflow/` chapter 11 |

## 2. Step-by-step process

1. Select ready orders, hub, zone, date.
2. Sequence stops (suggested or drag and drop).
3. Save draft or plan.
4. Assign driver and vehicle (WF-09).
5. Review and confirm loading — stock deducted once; deliveries created.
6. Monitor; dispatch closes when all stops close.

## 3. Decision points

Order eligible? Draft or plan? Stock sufficient?

## 4. Approval conditions

Dispatcher confirmation tick.

## 5. Rejection conditions

Cancellation with reason (before any stop starts).

## 6. System actions

Numbering BM-DSP-…, timeline, stock movements, deliveries, notifications.

## 7. User actions

Planning and confirmation.

## 8. Status changes

DRAFT → PLANNED → ASSIGNED → CONFIRMED → IN_TRANSIT → COMPLETED / PARTIALLY_DELIVERED; CANCELLED.

## 9. Notifications

Driver assigned / confirmed / sequence updated / cancelled; Administrator on confirmation.

## 10. Exception scenarios

Ineligible order; stock short; non-compliant resources.

## 11. Workflow diagram



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/fe85814da394.png){width=17.00cm}





![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/47ca4a2e6281.png){width=17.00cm}



Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Confirmed vehicle run.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |