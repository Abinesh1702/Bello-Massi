# Software Requirements Specification (SRS)

## Document control

| Field | Value |
|---|---|
| Document title | Software Requirements Specification (SRS) |
| Document ID | BM-SYS-002 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | System Requirements |
| Related module(s) | All modules |
| Document owner | Business Analyst / Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the software requirements of the Bellomassi platform — functions, user classes, interfaces, quality attributes and data — for the production build, and record how the prototype satisfies them today.

## Scope

Office web application, Drivers App, customer app (if confirmed), backend services, integrations. Requirement IDs are unique across the package (SYS-REQ, FR, NFR, RULE).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- IEEE 29148 (structure inspiration)
- Scope of Work, October 2026
- [BM-SYS-001 — System Requirements Document (SRD)](BM-SYS-001_System_Requirements_Document.md)
- [BM-SYS-003 — Functional Requirements Document (Consolidated)](BM-SYS-003_Functional_Requirements_Document.md)
- [BM-SYS-004 — Non-Functional Requirements](BM-SYS-004_Non_Functional_Requirements.md)
- [BM-SYS-007 — Business Rules Catalogue](BM-SYS-007_Business_Rules_Catalogue.md)
- [BM-SYS-008 — Requirement Traceability Matrix](BM-SYS-008_Requirement_Traceability_Matrix.xlsx)
- [BM-BRD-001 — Business Requirements Document (BRD)](../02_BUSINESS_REQUIREMENTS/BM-BRD-001_Business_Requirements_Document.md)
- [BM-ARC-001 — High-Level Design (HLD)](../07_SYSTEM_ARCHITECTURE/BM-ARC-001_High_Level_Design.md)
- [BM-API-001 — API Specification (Overview and Conventions)](../09_API_AND_INTEGRATION/BM-API-001_API_Specification.md)

## Contents

- 1. System overview
- 2. System context
- 3. System-level requirements
- 4. Product functions
- 5. User classes and roles
- 6. Functional requirements
- 7. Non-functional requirements
- 8. External interfaces
- 9. Hardware requirements
- 10. Software requirements
- 11. Performance requirements
- 12. Security requirements
- 13. Availability, scalability and reliability
- 14. Usability and maintainability
- 15. Data requirements
- 16. Acceptance criteria

## 1. System overview

Bellomassi manages the order-to-delivery process of a food distributor: order capture, approval with credit control,
consolidation, zone-based dispatch, driver delivery with OTP and proof of delivery, delivery notes, notifications,
administration and reporting. The current implementation is a **frontend prototype** (React 19, LocalStorage);
production requires a backend (Django REST Framework, PostgreSQL) and mobile apps (React Native) — **PROPOSED**.

## 2. System context

```mermaid
flowchart LR
    SE[Salesman] --> SYS((Bellomassi platform))
    SM[Sales Manager] --> SYS
    CS[Customer Service] --> SYS
    DP[Dispatcher] --> SYS
    DR[Driver - mobile] --> SYS
    AD[Administrator / management] --> SYS
    FI[Finance] --> SYS
    CU[Customer] --> SYS
    SYS --> MAP[Maps and routing provider - PROPOSED]
    SYS --> MSG[SMS / WhatsApp provider - PROPOSED]
    SYS --> EM[Email provider - PROPOSED]
    SYS --> SAP[SAP ERP - stage 2, PROPOSED]
    SYS --> OCR[OCR engine - PROPOSED]
```

## 3. System-level requirements

| ID | Requirement | Label |
|---|---|---|
| SYS-REQ-001 | The system shall maintain one order record from capture to delivery with a complete timeline. | VERIFIED |
| SYS-REQ-002 | The system shall enforce role-based access with permission keys and data scopes on every action. | VERIFIED (prototype client-side) / PROPOSED (server-side) |
| SYS-REQ-003 | The system shall provide an office web application, a driver mobile application and an administration panel. | VERIFIED (web) / PROPOSED (native mobile) |
| SYS-REQ-004 | The system shall notify the responsible role at every workflow hand-off. | VERIFIED (in-app) |
| SYS-REQ-005 | The system shall verify each delivery with a customer OTP and generate a delivery note. | VERIFIED (OTP shown in app) / PROPOSED (SMS / WhatsApp) |
| SYS-REQ-006 | The system shall store data centrally, shared by all users and devices, with backups. | PROPOSED (prototype: per-browser LocalStorage) |
| SYS-REQ-007 | The system shall track drivers' locations during active deliveries and show them to authorised users. | PROTOTYPE (DEMO GPS) / PROPOSED |
| SYS-REQ-008 | The system shall integrate with SAP for items, stock, customers and credit in stage 2. | PROPOSED |
| SYS-REQ-009 | The system shall keep an audit trail of administrative, security and workflow events. | VERIFIED |
| SYS-REQ-010 | The system shall provide dashboards and exportable reports per role. | VERIFIED |

## 4. Product functions

35 modules with 179 functional requirements — summary in [BM-SYS-003 — Functional Requirements Document (Consolidated)](BM-SYS-003_Functional_Requirements_Document.md), detail per module in folder 04
(e.g. [BM-FRD-ORD — Functional Requirements — Salesman Order Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-ORD_Salesman_Order_Management.md), [BM-FRD-APR — Functional Requirements — Sales Manager Approval](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-APR_Sales_Manager_Approval.md), [BM-FRD-DSP — Functional Requirements — Dispatch Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DSP_Dispatch_Management.md), [BM-FRD-DRV — Functional Requirements — Driver Application](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DRV_Driver_Application.md)).

## 5. User classes and roles

| User class | Roles (code) | Device | Frequency | Technical skill |
|---|---|---|---|---|
| Sales | SALESMAN, SALES_MANAGER | Mobile and desktop | Daily, high | Basic |
| Operations office | CUSTOMER_SERVICE, DISPATCHER | Desktop / tablet | Daily, high | Basic to medium |
| Field | DRIVER | Smartphone | Daily, high | Basic |
| Finance | FINANCE | Desktop | Daily | Medium |
| Warehouse (extension) | WAREHOUSE_MANAGER, INVENTORY_EXECUTIVE, QA_MANAGER | Desktop / tablet | Daily | Basic |
| Administration | SUPER_ADMIN, ADMIN | Desktop | Daily | Medium to high |
| External | CUSTOMER, SUPPLIER | Smartphone / desktop | Occasional | Basic |

Role details: [BM-MAN-120 — Role Responsibility Matrix](../15_USER_MANUALS/BM-MAN-120_Role_Responsibility_Matrix.xlsx), permission matrix [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 6. Functional requirements

See [BM-SYS-003 — Functional Requirements Document (Consolidated)](BM-SYS-003_Functional_Requirements_Document.md) (consolidated, unique IDs FR-<MODULE>-NNN) and the 35 module FRDs. Business rules: [BM-SYS-007 — Business Rules Catalogue](BM-SYS-007_Business_Rules_Catalogue.md).

## 7. Non-functional requirements

See [BM-SYS-004 — Non-Functional Requirements](BM-SYS-004_Non_Functional_Requirements.md) (NFR-PERF, NFR-SCAL, NFR-AVL, NFR-REL, NFR-SEC, NFR-USE, NFR-ACC, NFR-MNT, NFR-DATA, NFR-COMP,
NFR-PORT, NFR-OBS).

## 8. External interfaces

| Interface | Type | Prototype | Production |
|---|---|---|---|
| User interface — office | Responsive web (React) | VERIFIED | Same, connected to API |
| User interface — driver | Mobile | Web `/driver` VERIFIED | React Native PROPOSED |
| User interface — customer | Mobile | Web `/customer` VERIFIED | PENDING CONFIRMATION |
| REST API | HTTPS JSON | None | PROPOSED ([BM-API-001 — API Specification (Overview and Conventions)](../09_API_AND_INTEGRATION/BM-API-001_API_Specification.md)) |
| Real-time | WebSocket (WSS) | None | PROPOSED |
| Maps / routing | Google Maps JS, Routes API | Static demo map | PROPOSED |
| Messaging | SMS / WhatsApp provider API | Demo / mock | PROPOSED |
| Email | SMTP / IMAP or provider API | Demo; gateway contract NOT VERIFIED | PROPOSED |
| OCR | Server OCR API | Mock | PROPOSED |
| SAP | RFC / OData / IDoc (to confirm) | None | PROPOSED (stage 2) |

## 9. Hardware requirements

| Item | Requirement | Label |
|---|---|---|
| Office workstation | Any device with a current browser; 1366×768 minimum | VERIFIED |
| Driver phone | Android 10+ or iOS 15+, GPS, camera, mobile data, ≥ 3 GB RAM | PROPOSED |
| Servers | See [BM-INF-003 — Infrastructure, Network Architecture and Server Specification](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-003_Infrastructure_and_Network_Architecture.md) | PROPOSED |

## 10. Software requirements

Browsers: current Chrome, Edge, Safari, Firefox (VERIFIED for the prototype). Production stack: Python 3.12, Django 5,
DRF, PostgreSQL 16, Redis, Celery, Django Channels, Nginx, Docker; React 19 / Vite; React Native — [BM-INF-001 — Technology Stack Document](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-001_Technology_Stack.md).

## 11. Performance requirements

NFR-PERF-001 … NFR-PERF-004. No production measurements exist; targets are PROPOSED.

## 12. Security requirements

NFR-SEC-001 … NFR-SEC-007 and the security package ([BM-SEC-001 — Security Requirements Document](../10_SECURITY_AND_COMPLIANCE/BM-SEC-001_Security_Requirements.md)).

## 13. Availability, scalability and reliability

NFR-AVL-001 (99.5% target), NFR-SCAL-001/002, NFR-REL-001 … 003.

## 14. Usability and maintainability

NFR-USE-001 … 003, NFR-ACC-001, NFR-MNT-001 … 003.

## 15. Data requirements

| Data | Requirement |
|---|---|
| Master data | Customers, products, hubs, zones, drivers, vehicles, users, roles — maintained in the Admin Panel; SAP later |
| Transactions | Orders, approvals, consolidations, dispatches, deliveries, OTPs, PODs, delivery notes, stock movements, scrap, documents, invoices, messages |
| Retention | PENDING CONFIRMATION ([BM-DAT-005 — Data Retention Policy (Draft)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-005_Data_Retention_Policy.md)) |
| Model | Prototype model [BM-DAT-001 — Current Prototype Data Model (LocalStorage)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-001_Prototype_Data_Model.md); production schema [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md) |

## 16. Acceptance criteria

1. Every FR labelled VERIFIED passes its test cases on the production build ([BM-QA-011 — Functional Test Cases](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-011_Functional_Test_Cases.xlsx)).
2. PROPOSED requirements are implemented or formally deferred by change request.
3. PENDING CONFIRMATION items are decided and the baseline updated ([BM-SYS-009 — Requirement Change Log](BM-SYS-009_Requirement_Change_Log.xlsx)).
4. NFR targets are measured in staging and accepted.
5. UAT scenarios pass and are signed ([BM-QA-012 — UAT Test Cases](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-012_UAT_Test_Cases.xlsx), [BM-HND-004 — UAT Sign-Off Document](../19_CLIENT_HANDOVER/BM-HND-004_UAT_Sign_Off.md)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |