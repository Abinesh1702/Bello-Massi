# WF-04 — Sales Manager Approval Workflow

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

```mermaid
flowchart TD
    A[Order SUBMITTED, approval PENDING] --> B["Approval queue - oldest first"]
    B --> C[Open order - system runs the six approval checks]
    C --> E{Blocking check failed?}
    E -->|Yes| F([Approve not possible - fix data, return or reject])
    E -->|No| G{Manager action}
    G -->|Approve| H{Credit or stock warnings?}
    H -->|Yes| H1[Tick: I have reviewed the warnings]
    H -->|No| R{Remarks required by settings?}
    H1 --> R
    R -->|Yes| R1[Enter approval remarks]
    R -->|No| APP[APPROVED - consolidation PENDING]
    R1 --> APP
    APP --> N1([Salesman and Customer Service notified - ORDER_APPROVED])
    G -->|Return| RT[Reason from list + remarks]
    RT --> RET[RETURNED]
    RET --> N2([Salesman corrects highlighted section and resubmits])
    G -->|Reject| RJ[Reason from list + remarks]
    RJ --> REJ([REJECTED - final, salesman notified])
```

```mermaid
sequenceDiagram
    actor SE as Sales Executive
    participant OS as orderService
    actor SM as Sales Manager
    participant AS as approvalService
    actor CS as Customer Service
    SE->>OS: submitOrder()
    OS-->>SM: Notification "New order for approval" (+ warning flags)
    SM->>AS: getApprovalChecks()
    alt Approve
        SM->>AS: approveOrder(remarks, acknowledgeWarnings)
        AS-->>CS: "Order awaiting consolidation"
        AS-->>SE: "Order approved"
    else Return
        SM->>AS: returnOrderForCorrection(reason, remarks)
        AS-->>SE: "Order returned for correction" + edit link
        SE->>OS: resubmitOrder()
    else Reject
        SM->>AS: rejectOrder(reason, remarks)
        AS-->>SE: "Order rejected"
    end
```

Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Recorded decision with reason.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |