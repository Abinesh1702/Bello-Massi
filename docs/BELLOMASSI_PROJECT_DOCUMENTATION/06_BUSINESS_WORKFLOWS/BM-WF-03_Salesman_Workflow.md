# WF-03 — Salesman Workflow

## Document control

| Field | Value |
|---|---|
| Document title | WF-03 — Salesman Workflow |
| Document ID | BM-WF-03 |
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

Describe the salesman's daily work: capture, submit, correct returned orders, follow up calls.

## Scope

Workflow WF-03 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-03 |
| Workflow name | Salesman Workflow |
| Business purpose | Describe the salesman's daily work: capture, submit, correct returned orders, follow up calls. |
| Initiating role | Salesman |
| Trigger | Start of day / customer request |
| Preconditions | Salesman account; assigned customers. |
| Final outcome | Orders submitted for approval. |
| Related requirements | FR-ORD-001, FR-ORD-002, FR-ORD-005, FR-CALL-001 |
| Related test cases | TC-ORD-001, TC-LS-N02, TC-ORD-002, TC-ORD-005, TC-CALL-001 |
| Detailed chapter | `docs/workflow/` chapter 04 |

## 2. Step-by-step process

1. Open dashboard → "Needs your action".
2. Correct returned orders (highlighted section) and resubmit.
3. Capture new orders (from calls, email, WhatsApp) — optionally from a call record.
4. Save draft or submit.
5. Log calls and follow-ups.
6. Track statuses and notifications.

## 3. Decision points

Draft or submit; respond to warnings.

## 4. Approval conditions

—

## 5. Rejection conditions

Receives returns / rejections with reason.

## 6. System actions

Validation, warnings, numbering, notifications.

## 7. User actions

Data entry, corrections.

## 8. Status changes

DRAFT → SUBMITTED; RETURNED → SUBMITTED.

## 9. Notifications

Approved, returned, rejected, ready for dispatch.

## 10. Exception scenarios

Validation errors; credit / stock warnings.

## 11. Workflow diagram

```mermaid
flowchart TD
    A[Sign in - Salesman dashboard] --> B{Returned orders?}
    B -->|Yes| C[Open returned order - fix highlighted section] --> D[Resubmit]
    B -->|No| E[New order from call / email / WhatsApp]
    E --> F[Customer, hub, dates, address, lines]
    F --> G{Save draft or submit?}
    G -->|Draft| H[DRAFT]
    G -->|Submit| I[SUBMITTED - Sales Manager notified]
    D --> I
    I --> J[Log call and follow-up]
    J --> K[Track status and notifications]
```

Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Orders submitted for approval.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |