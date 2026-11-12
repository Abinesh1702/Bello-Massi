# WF-07 — Order Consolidation Workflow

## Document control

| Field | Value |
|---|---|
| Document title | WF-07 — Order Consolidation Workflow |
| Document ID | BM-WF-07 |
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

Specify consolidation in detail.

## Scope

Workflow WF-07 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-07 |
| Workflow name | Order Consolidation Workflow |
| Business purpose | Specify consolidation in detail. |
| Initiating role | Customer Service |
| Trigger | Approved order in queue |
| Preconditions | Order APPROVED, consolidation PENDING. |
| Final outcome | Order in ready queue. |
| Related requirements | FR-CON-001, FR-CON-002, FR-CON-003, FR-CON-004 |
| Related test cases | TC-CON-001, TC-CON-002, TC-CON-N01, TC-CON-003, TC-CON-004 |
| Detailed chapter | `docs/workflow/` chapter 05 |

## 2. Step-by-step process

1. Open order from queue.
2. Confirm: customer and address verified; hub confirmed; products and units checked; quantities match; hub stock reviewed.
3. Consolidate.
4. Mark ready for dispatch.

## 3. Decision points

All five checks?

## 4. Approval conditions

Checklist complete.

## 5. Rejection conditions

—

## 6. System actions

Consolidation record; notifications; ORDER_READY event.

## 7. User actions

Verification.

## 8. Status changes

APPROVED → CONSOLIDATED → READY_FOR_DISPATCH.

## 9. Notifications

Dispatcher, salesman.

## 10. Exception scenarios

"Only approved orders can be consolidated."; duplicate consolidation refused.

## 11. Workflow diagram

```mermaid
flowchart TD
    A[APPROVED order in queue] --> B[Open order] --> C{All 5 checks ticked?}
    C -->|No| D[Complete the verification checklist first] --> B
    C -->|Yes| E[CONSOLIDATED - Dispatcher notified] --> F[Mark ready for dispatch] --> G[READY_FOR_DISPATCH]
```

Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Order in ready queue.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |