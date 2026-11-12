---
title: "WF-18 — Exception Management Workflow"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-WF-18 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | WF-18 — Exception Management Workflow |
| Document ID | BM-WF-18 |
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

Specify how exceptions are detected and resolved.

## Scope

Workflow WF-18 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-18 |
| Workflow name | Exception Management Workflow |
| Business purpose | Specify how exceptions are detected and resolved. |
| Initiating role | Any role |
| Trigger | Validation failure or operational exception |
| Preconditions | — |
| Final outcome | Exception resolved. |
| Related requirements | FR-EXC-001, FR-EXC-002, FR-EXC-003, FR-DRA-002, FR-OTP-002 |
| Related test cases | TC-EXC-001, TC-EXC-N01, TC-EXC-002, TC-EXC-N02, TC-EXC-003, TC-DRA-002, TC-DRA-N01, TC-OTP-002, TC-OTP-N01, TC-OTP-N02 |
| Detailed chapter | `docs/workflow/` chapter 15 |

## 2. Step-by-step process

1. Service detects the exception and refuses the action or moves the record to an exception status.
2. Named role resolves it (see register in docs/workflow chapter 15).

## 3. Decision points

Exception type.

## 4. Approval conditions

Depends on type.

## 5. Rejection conditions

—

## 6. System actions

Validation, idempotency, transactions.

## 7. User actions

Resolver role.

## 8. Status changes

Exception statuses: RETURNED, REJECTED, DELIVERY_FAILED, PARTIALLY_DELIVERED, RETURNED_TO_HUB, CANCELLED.

## 9. Notifications

Responsible role notified.

## 10. Exception scenarios

37 exceptions listed in docs/workflow 15.2.

## 11. Workflow diagram



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/24a7bf897b31.png){width=17.00cm}



Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Exception resolved.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |