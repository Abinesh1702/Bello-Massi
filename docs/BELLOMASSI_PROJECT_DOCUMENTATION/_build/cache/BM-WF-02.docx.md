---
title: "WF-02 — Order-to-Delivery Workflow"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-WF-02 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | WF-02 — Order-to-Delivery Workflow |
| Document ID | BM-WF-02 |
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

Specify the core order lifecycle and the system effect of each step.

## Scope

Workflow WF-02 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-02 |
| Workflow name | Order-to-Delivery Workflow |
| Business purpose | Specify the core order lifecycle and the system effect of each step. |
| Initiating role | Salesman |
| Trigger | Order submitted |
| Preconditions | Active customer, hub and products. |
| Final outcome | Delivered order with delivery note and stock movements. |
| Related requirements | FR-ORD-002, FR-APR-003, FR-CON-002, FR-CON-003, FR-DSP-001, FR-DSP-004, FR-DRV-002, FR-DRV-004 |
| Related test cases | TC-ORD-002, TC-APR-003, TC-APR-N01, TC-CON-002, TC-CON-N01, TC-CON-003, TC-DSP-001, TC-DSP-004, TC-DSP-N02, TC-DSP-N03, TC-DSP-N04, TC-DRV-002, TC-DRV-N01, TC-DRV-N02, TC-DRV-N03, TC-DRV-004 |
| Detailed chapter | `docs/workflow/` chapter 06 |

## 2. Step-by-step process

1. Create order and submit (number BM-ORD-… assigned).
2. Approval checks run; manager decides.
3. Customer Service ticks five checks and consolidates.
4. Order marked READY_FOR_DISPATCH.
5. Dispatcher creates dispatch and sequence; assigns resources; confirms — stock deducted and deliveries created; order DISPATCHED.
6. Driver starts (OUT_FOR_DELIVERY), reaches location (OTP issued), completes with OTP (DELIVERED / PARTIALLY_DELIVERED).

## 3. Decision points

Blocking checks; warnings; stock sufficient at confirmation; OTP; quantities.

## 4. Approval conditions

Approval, consolidation checklist, dispatch confirmation tick.

## 5. Rejection conditions

Rejection; cancellation of dispatch.

## 6. System actions

`submitOrder`, `approveOrder`, `consolidateOrder`, `markReadyForDispatch`, `createDispatch`, `assignDispatch`, `confirmDispatch`, `startDelivery`, `markArrived`, `confirmDelivery`.

## 7. User actions

Each role acts on its queue.

## 8. Status changes

As WF-01; dispatch DRAFT → PLANNED → ASSIGNED → CONFIRMED → IN_TRANSIT → COMPLETED.

## 9. Notifications

New order for approval; awaiting consolidation; ready for dispatch; dispatch assigned / confirmed; out for delivery; delivered.

## 10. Exception scenarios

Stock short at confirmation; non-compliant resources; wrong OTP; partial / failed delivery.

## 11. Workflow diagram



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/e6b350abc337.png){width=17.00cm}





![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/9b01a333a6d8.png){width=17.00cm}



Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Delivered order with delivery note and stock movements.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |