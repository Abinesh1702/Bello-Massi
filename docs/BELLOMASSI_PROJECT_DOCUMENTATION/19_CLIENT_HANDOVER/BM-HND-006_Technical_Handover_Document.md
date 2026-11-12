# Technical Handover Document

## Document control

| Field | Value |
|---|---|
| Document title | Technical Handover Document |
| Document ID | BM-HND-006 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Client Handover |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Give a technical team everything needed to run, understand and extend the prototype, and to start the production build.

## Scope

Prototype (VERIFIED). Production design references are PROPOSED.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-HND-007 — Source Code Handover Document](BM-HND-007_Source_Code_Handover.md)
- [BM-HND-008 — Configuration Handover Document](BM-HND-008_Configuration_Handover.md)
- [BM-ARC-001 — High-Level Design (HLD)](../07_SYSTEM_ARCHITECTURE/BM-ARC-001_High_Level_Design.md)
- [BM-ARC-002 — Low-Level Design (LLD)](../07_SYSTEM_ARCHITECTURE/BM-ARC-002_Low_Level_Design.md)
- [BM-DAT-001 — Current Prototype Data Model (LocalStorage)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-001_Prototype_Data_Model.md)
- [BM-DEP-002 — Deployment Guide and Runbook](../14_DEPLOYMENT_AND_RELEASE/BM-DEP-002_Deployment_Guide.md)

## 1. Architecture summary

Single-page React application; all business logic in browser services (`src/services`, 84 files); data in LocalStorage
(74 keys, about 1 MB seed); configuration in `src/config`; role-based layouts for office, driver and customer. No server.
Details: [BM-ARC-002 — Low-Level Design (LLD)](../07_SYSTEM_ARCHITECTURE/BM-ARC-002_Low_Level_Design.md) (LLD), [BM-DAT-001 — Current Prototype Data Model (LocalStorage)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-001_Prototype_Data_Model.md) (prototype data model), [BM-DAT-007 — Prototype Storage Dictionary](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-007_Prototype_Storage_Dictionary.xlsx) (storage dictionary).

## 2. How to run

See [BM-DEP-002 — Deployment Guide and Runbook](../14_DEPLOYMENT_AND_RELEASE/BM-DEP-002_Deployment_Guide.md) Part A: `npm install`, `npm run dev` / `npm run build`, `npx vite preview`, `npm run lint`.

## 3. Key technical facts

| Topic | Fact |
|---|---|
| Data version | 8, migrations in storage service on start-up |
| Auth | Browser demo hash, session in LocalStorage, lockout 5 / 15 min |
| RBAC | 13 roles, 110 permission keys, data scopes, landing pages (config + editable in UI) |
| Routing | 206 navigation entries / 197 screens (`src/config/navigation.js`) |
| Integrations | Optional gateway URL; otherwise demo mode (email, WhatsApp, AI, OCR, GPS simulated) |
| External runtime dependency | Google Fonts (Inter) |

## 4. Production build starting points

Business rules catalogue [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md), production database design [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md), API design [BM-API-001 — API Specification (Overview and Conventions)](../09_API_AND_INTEGRATION/BM-API-001_API_Specification.md)
and OpenAPI draft (BM-API-018), architecture [BM-ARC-001 — High-Level Design (HLD)](../07_SYSTEM_ARCHITECTURE/BM-ARC-001_High_Level_Design.md), security [BM-SEC-001 — Security Requirements Document](../10_SECURITY_AND_COMPLIANCE/BM-SEC-001_Security_Requirements.md), infrastructure
[BM-INF-003 — Infrastructure, Network Architecture and Server Specification](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-003_Infrastructure_and_Network_Architecture.md).

## 5. Acknowledgement (blank)

| Receiving technical lead | Signature | Date |
|---|---|---|
|  |  |  |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |