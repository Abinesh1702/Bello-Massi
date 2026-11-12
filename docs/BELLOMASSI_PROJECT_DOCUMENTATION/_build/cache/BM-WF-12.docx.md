---
title: "WF-12 — Customer Tracking Workflow"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-WF-12 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | WF-12 — Customer Tracking Workflow |
| Document ID | BM-WF-12 |
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

Specify customer delivery tracking and OTP handover.

## Scope

Workflow WF-12 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-12 |
| Workflow name | Customer Tracking Workflow |
| Business purpose | Specify customer delivery tracking and OTP handover. |
| Initiating role | Customer |
| Trigger | Driver starts the stop |
| Preconditions | Customer has an order on a confirmed dispatch. |
| Final outcome | Handover confirmed by the customer. |
| Related requirements | FR-CAP-003, FR-CAP-004, FR-OTP-001, FR-CAP-005 |
| Related test cases | TC-CAP-003, TC-CAP-004, TC-OTP-001, TC-CAP-005 |
| Detailed chapter | `docs/workflow/` chapter 09 |

## 2. Step-by-step process

1. Driver starts the stop — customer notified "Out for delivery".
2. Customer opens Track delivery (DEMO GPS map, own vehicle only).
3. Driver reaches location — OTP shown in large digits with expiry.
4. Customer reads OTP to driver.
5. Delivery completed — delivery note available.

## 3. Decision points

—

## 4. Approval conditions

Customer OTP.

## 5. Rejection conditions

Customer may refuse — driver records failure "Customer Refused".

## 6. System actions

Tracking session; OTP; notifications.

## 7. User actions

Customer shares OTP.

## 8. Status changes

OUT_FOR_DELIVERY → DELIVERED.

## 9. Notifications

Out for delivery; driver arrived; delivered / not completed.

## 10. Exception scenarios

OTP expiry → new OTP.

## 11. Workflow diagram



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/9f041b1a6847.png){width=13.50cm}



Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Handover confirmed by the customer.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |