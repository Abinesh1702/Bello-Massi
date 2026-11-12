# WF-01 — Overall Business Workflow

## Document control

| Field | Value |
|---|---|
| Document title | WF-01 — Overall Business Workflow |
| Document ID | BM-WF-01 |
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

Show the end-to-end business flow across all roles, from order capture to delivery note and invoice.

## Scope

Workflow WF-01 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-01 |
| Workflow name | Overall Business Workflow |
| Business purpose | Show the end-to-end business flow across all roles, from order capture to delivery note and invoice. |
| Initiating role | Salesman / Customer |
| Trigger | A customer need (order by call, email, WhatsApp or app) |
| Preconditions | Master data (customers, products, hubs, zones, drivers, vehicles, users) maintained; stock available at the hub. |
| Final outcome | Order delivered with OTP-verified proof and delivery note; invoice issued if in scope. |
| Related requirements | FR-ORD-002, FR-APR-003, FR-CON-003, FR-DSP-004, FR-DRV-004, FR-INVC-002 |
| Related test cases | TC-ORD-002, TC-APR-003, TC-APR-N01, TC-CON-003, TC-DSP-004, TC-DSP-N02, TC-DSP-N03, TC-DSP-N04, TC-DRV-004, TC-INVC-002, TC-INVC-N01, TC-INVC-N02 |
| Detailed chapter | `docs/workflow/` chapter 02 |

## 2. Step-by-step process

1. Salesman (or customer) captures and submits the order.
2. Sales Manager approves, returns or rejects it.
3. Customer Service verifies and consolidates, then releases to dispatch.
4. Dispatcher plans the dispatch, assigns driver and vehicle, confirms loading (stock deducted).
5. Driver delivers stops in sequence: start, reach location, OTP, proof, complete or fail.
6. Delivery note generated; Finance issues the invoice (if in scope); exceptions reviewed by the Dispatcher.

## 3. Decision points

Approve / return / reject; consolidation checks complete; driver and vehicle compliant; OTP valid; all quantities delivered.

## 4. Approval conditions

Sales Manager approval (all blocking checks pass, warnings acknowledged).

## 5. Rejection conditions

Rejection with reason (final) or return for correction.

## 6. System actions

Numbering, validation, notifications, timeline events, stock movements, delivery creation, OTP generation, delivery note.

## 7. User actions

Data entry, decisions, confirmations, handover.

## 8. Status changes

Order DRAFT → SUBMITTED → APPROVED → CONSOLIDATED → READY_FOR_DISPATCH → DISPATCHED → OUT_FOR_DELIVERY → DELIVERED (or exception statuses).

## 9. Notifications

Each hand-off notifies the next role in-app; automated email / WhatsApp per rule (demo).

## 10. Exception scenarios

See WF-18.

## 11. Workflow diagram

```mermaid
flowchart TD
    START([User signs in - office, driver or customer app]) --> DASH[Role dashboard with period filter]
    DASH --> SUP["Supporting work: master data, inventory, VMS, documents, communication"]
    DASH --> ORD[Sales Executive creates order]
    DASH --> CORD[Customer places order in the app]
    ORD --> SUB[SUBMITTED - approval PENDING]
    CORD --> SUB
    SUB --> APR{Sales Manager decision}
    APR -->|Return| RET[RETURNED - salesman corrects and resubmits]
    RET --> SUB
    APR -->|Reject| REJ([REJECTED - closed])
    APR -->|Approve| APP[APPROVED]
    APP --> CONS[Customer Service: 5 checks, consolidate]
    CONS --> RDY[READY_FOR_DISPATCH]
    RDY --> PLAN[Dispatcher plans dispatch: orders, zone, date, sequence]
    PLAN --> ASG[Assign compliant driver and vehicle]
    ASG --> CONF[Confirm dispatch: stock deducted, deliveries created - DISPATCHED]
    CONF --> START2[Driver starts stop - OUT_FOR_DELIVERY, DEMO GPS]
    START2 --> ARR[Reach location - OTP issued, simulated]
    ARR --> OTP{OTP correct?}
    OTP -->|No - retry| ARR
    OTP -->|Yes| QTY{All quantities delivered?}
    QTY -->|Yes| DEL[DELIVERED + delivery note]
    QTY -->|No| PDEL[PARTIALLY_DELIVERED + delivery note]
    START2 -->|Problem| FAIL[DELIVERY_FAILED]
    FAIL --> REV[Dispatcher reviews exception]
    PDEL --> REV
    REV -->|Return stock| RTH([RETURNED_TO_HUB])
    REV -->|Return and re-queue| RDY
    DEL --> INVC[Finance issues invoice]
    PDEL --> INVC
    INVC --> CUSTDOC([Customer sees delivery note and invoice])
    INVC --> RPT([Dashboards and Reports Center])
```

```mermaid
flowchart TD
    subgraph SALES[Sales Executive]
        S1[Create order / draft] --> S2[Submit order]
        S5[Correct and resubmit]
    end
    subgraph SM[Sales Manager]
        M1{Review checks} -->|Approve| M2[Approved]
        M1 -->|Return| M3[Returned]
        M1 -->|Reject| M4[Rejected]
    end
    subgraph WCS[Warehouse / Customer Service]
        W1[Verify and consolidate] --> W2[Mark ready for dispatch]
        W3[Receipts, transfers, adjustments, scrap]
    end
    subgraph DSP[Dispatch]
        D1[Plan dispatch] --> D2[Assign driver and vehicle] --> D3[Confirm - stock deducted]
        D4[Review failed / partial delivery]
    end
    subgraph DRV[Driver]
        R1[Start delivery] --> R2[Reach location] --> R3[Enter OTP, quantities, POD]
        R4[Report failure]
    end
    subgraph CUS[Customer]
        C1[Place order in app]
        C2[Track delivery, share OTP]
        C3[View delivery note and invoice]
    end
    subgraph FIN[Finance]
        F1[Issue invoice] --> F2[Monitor credit and outstanding]
    end

    C1 --> M1
    S2 --> M1
    M3 --> S5 --> M1
    M2 --> W1
    W2 --> D1
    D3 --> R1
    R1 --> C2
    R2 --> C2
    R3 --> C3
    R4 --> D4
    R3 --> F1
    M2 --> F1
    F1 --> C3
```

Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Order delivered with OTP-verified proof and delivery note; invoice issued if in scope.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |