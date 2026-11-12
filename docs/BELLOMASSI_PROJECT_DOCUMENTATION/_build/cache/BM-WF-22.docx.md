---
title: "WF-22 — Document Upload and Verification Workflow"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-WF-22 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | WF-22 — Document Upload and Verification Workflow |
| Document ID | BM-WF-22 |
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

Specify document upload and verification.

## Scope

Workflow WF-22 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-22 |
| Workflow name | Document Upload and Verification Workflow |
| Business purpose | Specify document upload and verification. |
| Initiating role | Any uploader |
| Trigger | Document uploaded |
| Preconditions | Active document type; user may upload for the record. |
| Final outcome | Verified document. |
| Related requirements | FR-DOC-001, FR-DOC-002, FR-DOC-003, FR-DOC-004 |
| Related test cases | TC-DOC-001, TC-DOC-N02, TC-DOC-002, TC-DOC-003, TC-DOC-N01, TC-DOC-004 |
| Detailed chapter | `docs/workflow/` chapter 13 |

## 2. Step-by-step process

1. Upload with type, record, file, fields.
2. OCR (if enabled) extracts fields (MOCK in prototype).
3. Reviewer corrects fields.
4. Verify or reject with reason.
5. Uploader replaces file after rejection.

## 3. Decision points

OCR type? Verify or reject?

## 4. Approval conditions

Reviewer verifies.

## 5. Rejection conditions

Reason mandatory.

## 6. System actions

OCR result kept with originals; expiry derived.

## 7. User actions

Uploader, reviewer.

## 8. Status changes

PENDING_OCR → OCR_COMPLETED → PENDING_REVIEW → VERIFIED / REJECTED.

## 9. Notifications

Expiry events.

## 10. Exception scenarios

File not stored; provider unavailable.

## 11. Workflow diagram



![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/41bdc2757dae.png){width=17.00cm}





![](/home/claude/bellomassi/docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build/cache/mm/7130fafeff7d.png){width=17.00cm}



Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Verified document.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |