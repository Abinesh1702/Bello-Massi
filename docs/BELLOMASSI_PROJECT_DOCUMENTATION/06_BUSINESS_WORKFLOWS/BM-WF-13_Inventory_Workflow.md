# WF-13 — Inventory Workflow

## Document control

| Field | Value |
|---|---|
| Document title | WF-13 — Inventory Workflow |
| Document ID | BM-WF-13 |
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

Specify stock receipts, transfers, adjustments and replenishment.

## Scope

Workflow WF-13 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-13 |
| Workflow name | Inventory Workflow |
| Business purpose | Specify stock receipts, transfers, adjustments and replenishment. |
| Initiating role | Warehouse / Inventory staff |
| Trigger | Goods arrive, move or are found different |
| Preconditions | Hubs and products with inventory tracking. |
| Final outcome | Accurate stock. |
| Related requirements | FR-INV-001, FR-INV-002, FR-INV-003, FR-INV-004, FR-INV-005 |
| Related test cases | TC-INV-001, TC-INV-N02, TC-INV-002, TC-INV-003, TC-INV-004, TC-INV-005 |
| Detailed chapter | `docs/workflow/` chapter 10 |

## 2. Step-by-step process

1. Receive goods (GRN) — stock up.
2. Transfer between hubs — draft or complete.
3. Adjust stock with type and reason.
4. Review low stock; create replenishment draft; admin approves and converts; receive goods against it.

## 3. Decision points

Transfer now or draft; adjustment type.

## 4. Approval conditions

Replenishment approval by Administrator.

## 5. Rejection conditions

Replenishment rejection with reason.

## 6. System actions

Movement ledger; low-stock status.

## 7. User actions

Warehouse staff.

## 8. Status changes

Transfer Draft → Completed / Cancelled; replenishment DRAFT → … → RECEIVED.

## 9. Notifications

Low stock alerts.

## 10. Exception scenarios

Insufficient stock; inactive hub.

## 11. Workflow diagram

```mermaid
flowchart LR
    R["Stock receipt: total + qty"] --> L[(Inventory row + movement ledger)]
    T["Stock transfer completed: source - qty, destination + qty"] --> L
    A1["Adjustment Increase / Correction up: + qty"] --> L
    A2["Adjustment Decrease / Lost / Correction down: - qty"] --> L
    A3["Adjustment Damaged: damaged + qty"] --> L
    D1["Dispatch confirmed: Stock Dispatch - qty"] --> L
    D2["Dispatch cancelled after confirm: Reversal + qty"] --> L
    D3["Exception review, return to hub: Delivery Return + qty"] --> L
    S1["Scrap approved and written off: - qty"] --> L
    L --> LS{Available at or below reorder level?}
    LS -->|Yes| LOW[Low Stock list, dashboards, predictive inventory]
    LOW --> RP[Replenishment request]
    RP --> R
    LS -->|No| OK([In stock])
```

```mermaid
flowchart TD
    SH[(Sales history)] --> FC[Forecast models: MA, WMA, SES, Holt, Seasonal, Auto]
    FC --> PR["Predictive inventory /ai/predictive-inventory"]
    PR --> RR[Reorder recommendations - OPEN]
    PR --> RK["Risk flags: Stock-out risk, Low stock, Excess, Slow-moving, Non-moving, High demand, Demand spike, Hub imbalance"]
    RR -->|Add to draft| RD[Replenishment DRAFT - IN_DRAFT]
    RR -->|Dismiss| DM[DISMISSED]
    RD --> SB[SUBMITTED] --> AP{Administrator}
    AP -->|Approve| AV[APPROVED] --> CV[CONVERTED - Awaiting goods receipt]
    AP -->|Reject| RJ([REJECTED])
    CV --> GR[Stock receipt per line, reference = request number] --> RC([RECEIVED])
```

Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Accurate stock.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |