---
title: "WF-09 — Driver Assignment Workflow"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-WF-09 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | WF-09 — Driver Assignment Workflow |
| Document ID | BM-WF-09 |
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

Specify driver and vehicle assignment with compliance checks.

## Scope

Workflow WF-09 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-09 |
| Workflow name | Driver Assignment Workflow |
| Business purpose | Specify driver and vehicle assignment with compliance checks. |
| Initiating role | Dispatcher |
| Trigger | Dispatch PLANNED |
| Preconditions | Dispatch PLANNED or ASSIGNED. |
| Final outcome | Compliant assignment. |
| Related requirements | FR-DRA-001, FR-DRA-002, FR-DRA-003, FR-VMS-002 |
| Related test cases | TC-DRA-001, TC-DRA-002, TC-DRA-N01, TC-DRA-003, TC-DRA-N02, TC-VMS-002 |
| Detailed chapter | `docs/workflow/` chapter 11 |

## 2. Step-by-step process

1. Open Driver Assignment.
2. Choose driver — system checks status, availability, hub, licence, required documents.
3. Choose vehicle — status, availability, hub, capacity vs load, required documents.
4. Save assignment; driver notified.

## 3. Decision points

Driver issues? Vehicle issues?

## 4. Approval conditions

No blocking issue.

## 5. Rejection conditions

Assignment refused with issue list.

## 6. System actions

`driverAssignmentIssues`, `vehicleAssignmentIssues`, VMS compliance.

## 7. User actions

Selection.

## 8. Status changes

PLANNED → ASSIGNED.

## 9. Notifications

Driver: "New dispatch assigned"; previous driver: "Removed from …".

## 10. Exception scenarios

Expired licence / documents, over capacity, busy resource.

## 11. Workflow diagram



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/04ef311459d4.png){width=15.43cm}



Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Compliant assignment.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |