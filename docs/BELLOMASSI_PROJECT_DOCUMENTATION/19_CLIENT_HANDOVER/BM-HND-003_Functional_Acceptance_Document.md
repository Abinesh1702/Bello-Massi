# Functional Acceptance Document

## Document control

| Field | Value |
|---|---|
| Document title | Functional Acceptance Document |
| Document ID | BM-HND-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Client Handover |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Record, module by module, whether the client accepts the delivered functionality.

## Scope

Prototype modules (35). The "Delivered status" column is VERIFIED from source analysis; the acceptance columns are blank — no acceptance has been given.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-SYS-008 — Requirement Traceability Matrix](../03_SYSTEM_REQUIREMENTS/BM-SYS-008_Requirement_Traceability_Matrix.xlsx)
- [BM-QA-011 — Functional Test Cases](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-011_Functional_Test_Cases.xlsx)
- [BM-HND-004 — UAT Sign-Off Document](BM-HND-004_UAT_Sign_Off.md)
- [BM-OVW-016 — Project Feature Inventory](../01_PROJECT_OVERVIEW/BM-OVW-016_Project_Feature_Inventory.xlsx)

## 1. Acceptance by module

| Module | Delivered status (prototype) | Accepted? (Yes / No / With conditions) | Conditions / remarks | Client initials |
|---|---|---|---|---|
| Authentication and login | Implemented with limitations (browser-only) |  |  |  |
| User, role and permission management | Implemented (prototype) |  |  |  |
| Dashboards and period filter | Implemented (prototype) |  |  |  |
| Customers, products, hubs, suppliers | Implemented (prototype) |  |  |  |
| Order capture (salesman) | Implemented (prototype) |  |  |  |
| Sales Manager approval and credit | Implemented; credit balance manual |  |  |  |
| Consolidation (Customer Service) | Implemented (prototype) |  |  |  |
| Zones, dispatch planning, assignment | Implemented; zone board partial |  |  |  |
| Driver app, OTP, POD, delivery notes | Implemented; GPS / OTP sending simulated |  |  |  |
| Tracking | Simulated (DEMO GPS) |  |  |  |
| Exceptions review | Implemented (prototype) |  |  |  |
| Customer app | Implemented (extension) |  |  |  |
| Inventory, scrap, warehouse / QA | Implemented (extension) |  |  |  |
| VMS, documents / OCR | Implemented; OCR simulated (extension) |  |  |  |
| Invoicing | Implemented (extension; outside SOW) |  |  |  |
| Email, WhatsApp, calls, automation | Simulated / demo mode (extension) |  |  |  |
| Reports Center | Implemented; 24 reports without data |  |  |  |
| AI, forecasting, replenishment | Simulated / rule-based (extension) |  |  |  |

Full list of 179 functional requirements with status: [BM-SYS-008 — Requirement Traceability Matrix](../03_SYSTEM_REQUIREMENTS/BM-SYS-008_Requirement_Traceability_Matrix.xlsx).

## 2. Sign-off (blank)

| Role | Name | Signature | Date |
|---|---|---|---|
| Client business owner |  |  |  |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |