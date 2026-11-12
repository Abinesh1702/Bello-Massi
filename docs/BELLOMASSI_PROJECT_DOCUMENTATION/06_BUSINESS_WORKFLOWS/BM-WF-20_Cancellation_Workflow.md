# WF-20 — Cancellation Workflow

## Document control

| Field | Value |
|---|---|
| Document title | WF-20 — Cancellation Workflow |
| Document ID | BM-WF-20 |
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

Specify cancellation paths and their stock effects.

## Scope

Workflow WF-20 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-20 |
| Workflow name | Cancellation Workflow |
| Business purpose | Specify cancellation paths and their stock effects. |
| Initiating role | Dispatcher / Finance / requester |
| Trigger | Dispatch, invoice, scrap or replenishment must be cancelled |
| Preconditions | A cancellable record. |
| Final outcome | Record cancelled cleanly. |
| Related requirements | FR-DSP-005, FR-INVC-003, FR-SCR-001, FR-ORD-010 |
| Related test cases | TC-DSP-005, TC-DSP-N05, TC-INVC-003, TC-INVC-N03, TC-SCR-001, TC-ORD-010 |
| Detailed chapter | `docs/workflow/` chapter 15 |

## 2. Step-by-step process

1. Dispatch: cancel with reason + remarks before any stop starts; orders back to READY_FOR_DISPATCH; stock reversed once if confirmed.
2. Invoice: cancel with reason; new invoice possible.
3. Scrap / replenishment: cancel while not completed.
4. Order: cancellation after submission NOT IMPLEMENTED (reject with "Customer cancelled").

## 3. Decision points

Cancellable state?

## 4. Approval conditions

—

## 5. Rejection conditions

—

## 6. System actions

Reversal movements; timeline.

## 7. User actions

Owner role.

## 8. Status changes

→ CANCELLED.

## 9. Notifications

Driver and Admin on dispatch cancellation.

## 10. Exception scenarios

Started dispatch cannot be cancelled.

## 11. Workflow diagram

```mermaid
flowchart TD
    A{What is cancelled?} -->|Dispatch| B{Any stop started?}
    B -->|Yes| B1([Refused])
    B -->|No| B2[Reason + remarks - CANCELLED]
    B2 --> B3{Was it confirmed?}
    B3 -->|Yes| B4[Stock reversed once - Stock Dispatch Reversal]
    B3 -->|No| B5[No stock effect]
    B4 --> B6([Orders back to READY_FOR_DISPATCH])
    B5 --> B6
    A -->|Invoice| C[Reason - CANCELLED - new invoice allowed]
    A -->|Scrap / replenishment| D[CANCELLED while not completed]
    A -->|Submitted order| E([Not implemented - reject with Customer cancelled])
```

Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Record cancelled cleanly.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |