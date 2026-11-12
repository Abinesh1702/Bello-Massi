# Project Presentation — Speaker Notes

## Document control

| Field | Value |
|---|---|
| Document title | Project Presentation — Speaker Notes |
| Document ID | BM-PRS-002 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Project Presentation |
| Related module(s) | All modules |
| Document owner | Project Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Speaker notes and sources for each slide of the project presentation (BM-PRS-001, PowerPoint).

## Scope

12 slides for a 20–25 minute review meeting with the client. Every figure is traceable to a document in this package.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-PRS-001 — Project Presentation](BM-PRS-001_Project_Presentation.pptx)
- [BM-OVW-015 — Project Status and Implementation Summary](../01_PROJECT_OVERVIEW/BM-OVW-015_Project_Status_and_Implementation_Summary.md)
- [BM-PM-005 — Issue, Dependency and Decision Registers](../17_PROJECT_MANAGEMENT/BM-PM-005_Issue_Dependency_Decision_Registers.xlsx)

| Slide | Title | Talking points | Source |
|---|---|---|---|
| 1 | From customer order to confirmed delivery | Purpose of the meeting: show the prototype, the documentation and the decisions needed. Everything is a draft; nothing is approved. | — |
| 2 | Where we are today | 35 modules, 179 functional requirements, 292 test cases (228 functional + 64 cross-cutting; none executed), document count from the index. Prototype runs in the browser; integrations simulated. | [BM-SYS-003 — Functional Requirements Document (Consolidated)](../03_SYSTEM_REQUIREMENTS/BM-SYS-003_Functional_Requirements_Document.md), [BM-QA-011 — Functional Test Cases](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-011_Functional_Test_Cases.xlsx), [BM-QA-013 — Cross-cutting Test Cases (Responsive, Persistence, Date Filters, Role Access, UI, Accessibility, Security, Performance)](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-013_Cross_Cutting_Test_Cases.xlsx), [BM-IDX-001 — Bellomassi Documentation Index](../25_DOCUMENTATION_INDEX/BELLOMASSI_DOCUMENTATION_INDEX.xlsx) |
| 3 | One record from order to delivery note | Six steps and owners; stock deducted at dispatch confirmation; OTP required; exceptions back to the Dispatcher. | [BM-WF-02 — WF-02 — Order-to-Delivery Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-02_Order_to_Delivery_Workflow.md) |
| 4 | The office web app | Real screenshots (demo data). Role dashboards, approval queue, 13 roles / 110 permissions. | [BM-UX-006 — Prototype Screenshot Gallery](../12_UI_UX_AND_DESIGN/BM-UX-006_Prototype_Screenshot_Gallery.md), [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx) |
| 5 | Driver and customer apps | Driver: arrive → OTP → POD → note. Customer: catalog, cart, tracking with OTP. Mobile web today; native driver app proposed. | [BM-MAN-001 — Driver App User Manual](../15_USER_MANUALS/BM-MAN-001_Driver_App_User_Manual.md), [BM-MAN-002 — Customer App User Manual](../15_USER_MANUALS/BM-MAN-002_Customer_App_User_Manual.md) |
| 6 | Most modules work — integrations are simulated | Module status counts from the feature inventory; what is simulated and what is not built. | [BM-OVW-016 — Project Feature Inventory](../01_PROJECT_OVERVIEW/BM-OVW-016_Project_Feature_Inventory.xlsx), [BM-HND-011 — Limitations Document — Prototype vs Production](../19_CLIENT_HANDOVER/BM-HND-011_Limitations_Document.md) |
| 7 | Gaps against the Scope of Work | Eight key gaps; full list of 14. | [BM-DOC-003 — Gap Analysis — Scope of Work, Prototype and Documentation](../23_DOCUMENT_CONTROL/BM-DOC-003_Gap_Analysis.md), [BM-HND-012 — Pending Requirements Document](../19_CLIENT_HANDOVER/BM-HND-012_Pending_Requirements.md) |
| 8 | The prototype goes beyond the SOW | Extensions grouped as a proposal for discussion — the client decides. | [BM-RSK-004 — Change Impact Analysis — Prototype Extensions and Gaps](../18_RISK_AND_CHANGE_MANAGEMENT/BM-RSK-004_Change_Impact_Analysis.md) |
| 9 | Indicative path to production | Phase durations are estimates; start date not agreed. | [BM-PLN-001 — Scope and Phase Plan](../05_SCOPE_AND_PLANNING/BM-PLN-001_Scope_and_Phase_Plan.md), [BM-PM-002 — Work Breakdown Structure](../17_PROJECT_MANAGEMENT/BM-PM-002_Work_Breakdown_Structure.xlsx) |
| 10 | Decisions we need from you | Eight decisions; record them in the decision log and the business approval form. | [BM-PM-005 — Issue, Dependency and Decision Registers](../17_PROJECT_MANAGEMENT/BM-PM-005_Issue_Dependency_Decision_Registers.xlsx), [BM-HND-005 — Business Approval Document](../19_CLIENT_HANDOVER/BM-HND-005_Business_Approval_Document.md) |
| 11 | What the documentation package contains | Walk through the folders; show the index. | [BM-IDX-002 — Bellomassi Documentation Master](../25_DOCUMENTATION_INDEX/BELLOMASSI_DOCUMENTATION_MASTER.md) |
| 12 | Next step | Gate G0 review, then G1. | [BM-PM-001 — Project Plan](../17_PROJECT_MANAGEMENT/BM-PM-001_Project_Plan.md) |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |