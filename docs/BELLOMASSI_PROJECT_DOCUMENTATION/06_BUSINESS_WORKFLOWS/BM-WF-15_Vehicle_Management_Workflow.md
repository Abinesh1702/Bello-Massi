# WF-15 — Vehicle Management Workflow

## Document control

| Field | Value |
|---|---|
| Document title | WF-15 — Vehicle Management Workflow |
| Document ID | BM-WF-15 |
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

Specify vehicle and driver compliance management.

## Scope

Workflow WF-15 as implemented in the prototype, with production differences marked.

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
| Workflow ID | WF-15 |
| Workflow name | Vehicle Management Workflow |
| Business purpose | Specify vehicle and driver compliance management. |
| Initiating role | Administrator |
| Trigger | Vehicle / driver document recorded or expiring |
| Preconditions | Vehicles and drivers recorded. |
| Final outcome | Only compliant fleet on the road. |
| Related requirements | FR-VMS-001, FR-VMS-002, FR-VMS-003, FR-VMS-004 |
| Related test cases | TC-VMS-001, TC-VMS-002, TC-VMS-003, TC-VMS-004 |
| Detailed chapter | `docs/workflow/` chapter 11 |

## 2. Step-by-step process

1. Record document numbers and expiry dates; upload files.
2. Compliance computed per document.
3. Expiry register reviewed; scan raises events.
4. Assignment blocked for expired required documents.

## 3. Decision points

Required? Expired / warning / missing?

## 4. Approval conditions

Document verification (WF-22).

## 5. Rejection conditions

—

## 6. System actions

`complianceService`, expiry events.

## 7. User actions

Administrator / Dispatcher.

## 8. Status changes

VALID / MONTH / WEEK / TODAY / EXPIRED / MISSING.

## 9. Notifications

DOCUMENT_EXPIRING / DOCUMENT_EXPIRED (automation).

## 10. Exception scenarios

Assignment refused.

## 11. Workflow diagram

```mermaid
flowchart TD
    A[Vehicle / driver record: expiry dates] --> C[complianceService]
    B[Uploaded VMS documents] --> C
    S["Compliance rules /vms/settings"] --> C
    C --> D{State per document}
    D --> E1[Valid]
    D --> E2[Within 30 days]
    D --> E3[Within 7 days]
    D --> E4[Expires today]
    D --> E5[Expired]
    D --> E6[Not on record]
    E5 -->|Required document| BLK[Assignment blocked - always]
    E3 -->|Required and blockOnWarning on| BLK
    E6 -->|Required and blockOnMissing on| BLK
    C --> REG["Document expiry register /vms/document-expiry"]
    REG --> SCAN[scanDocumentExpiries - events DOCUMENT_EXPIRING / DOCUMENT_EXPIRED]
    SCAN --> AUTO[Automated notification if rule enabled]
```

Implementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.

## 12. Final outcome

Only compliant fleet on the road.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |