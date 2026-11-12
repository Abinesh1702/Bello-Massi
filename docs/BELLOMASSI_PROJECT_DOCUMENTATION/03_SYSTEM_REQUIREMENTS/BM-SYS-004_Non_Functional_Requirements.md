# Non-Functional Requirements

## Document control

| Field | Value |
|---|---|
| Document title | Non-Functional Requirements |
| Document ID | BM-SYS-004 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | System Requirements |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define quality attributes: performance, scalability, availability, reliability, security, usability, accessibility, maintainability, data, compliance, portability and observability.

## Scope

Prototype (verified behaviour) and production targets (proposed).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-SYS-002 — Software Requirements Specification (SRS)](BM-SYS-002_Software_Requirements_Specification.md)
- [BM-SEC-001 — Security Requirements Document](../10_SECURITY_AND_COMPLIANCE/BM-SEC-001_Security_Requirements.md)
- [BM-INF-003 — Infrastructure, Network Architecture and Server Specification](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-003_Infrastructure_and_Network_Architecture.md)
- [BM-QA-002 — Test Plan (with Functional, Integration, Regression, Performance, Security and Mobile sub-plans)](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-002_Test_Plan.md)

## Contents

- Overview
- Performance
- Scalability
- Availability
- Reliability
- Security
- Usability
- Accessibility
- Maintainability
- Data
- Compliance
- Portability
- Observability

## Overview

Non-functional requirements describe how well the system must work. Values marked PROPOSED are targets for the production build; no real performance measurement of a production system exists yet. Values marked VERIFIED describe behaviour confirmed in the prototype source code.

## Performance

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-PERF-001 | API responses for list and detail endpoints shall complete within 500 ms at the 95th percentile under normal load. | Load test report (no real measurement exists yet). | PROPOSED |
| NFR-PERF-002 | Dashboard pages shall render within 3 s on a 4G mobile connection. | Lighthouse / WebPageTest on staging. | PROPOSED |
| NFR-PERF-003 | Driver GPS updates shall be ingested and pushed to authorised maps within 5 s. | End-to-end tracking test. | PROPOSED |
| NFR-PERF-004 | The prototype keeps all demo data (about 1 MB across 74 keys) within the browser storage quota and degrades to in-memory storage if storage is blocked. | storageService usage / issues report. | VERIFIED |

## Scalability

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-SCAL-001 | The backend shall scale horizontally (stateless API containers behind a load balancer). | Two or more API instances serve traffic. | PROPOSED |
| NFR-SCAL-002 | Capacity planning shall be based on confirmed volumes (orders per day, drivers, customers, concurrent users). | Client provides volumes. | PENDING CONFIRMATION |

## Availability

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-AVL-001 | Production availability target 99.5% monthly excluding planned maintenance. | Uptime monitoring report. | PROPOSED |

## Reliability

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-REL-001 | State-changing actions shall be idempotent: repeating an approval, confirmation, delivery or write-off shall not change data twice. | Services return "No change was made." | VERIFIED |
| NFR-REL-002 | Multi-record changes shall be atomic (all keys written together or none). | storageService.transaction used by workflow services. | VERIFIED |
| NFR-REL-003 | Daily database backups with point-in-time recovery; RPO ≤ 24 h (15 min with WAL archiving), RTO ≤ 4 h. | Restore drill evidence. | PROPOSED |

## Security

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-SEC-001 | All traffic shall use TLS 1.2+ (HTTPS / WSS). | SSL Labs grade A. | PROPOSED |
| NFR-SEC-002 | Passwords shall be hashed server-side with Argon2id or PBKDF2; the prototype's browser hash is for demo only. | Code review. | PROPOSED |
| NFR-SEC-003 | Authorisation shall be enforced in the service layer for every action (prototype) and in every API (production). | RBAC test plan. | VERIFIED |
| NFR-SEC-004 | Personal data (customers, drivers, addresses, phone numbers) shall be encrypted at rest and access-logged. | Security review. | PROPOSED |
| NFR-SEC-005 | Uploaded files shall be type-checked, size-limited and virus-scanned before storage. | File upload tests. | PROPOSED |
| NFR-SEC-006 | OTPs shall be stored hashed, expire, be rate-limited and never be returned by APIs to drivers. | OTP security tests. | PROPOSED |
| NFR-SEC-007 | Customers shall only see their own orders, tracking and documents; drivers only their own deliveries. | Role-based access tests. | VERIFIED |

## Usability

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-USE-001 | Driver and customer screens shall be usable on 390 px wide phones with 44–56 px touch targets and sticky primary actions. | Responsive tests (137 pages at 390 px without overflow). | VERIFIED |
| NFR-USE-002 | All dates shall use the organisation time zone and the configured date format. | Localisation settings. | VERIFIED |
| NFR-USE-003 | Simulated behaviour shall be labelled in the UI (DEMO GPS, Simulated OCR, Sent · demo). | UI review. | VERIFIED |

## Accessibility

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-ACC-001 | The UI shall meet WCAG 2.1 AA (contrast, keyboard navigation, labels, focus states). | Accessibility audit (partial support exists: focus rings, aria labels, reduced motion). | PROPOSED |

## Maintainability

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-MNT-001 | Business rules shall live in service modules separate from pages (page → hook → service → storage). | Architecture review. | VERIFIED |
| NFR-MNT-002 | Navigation, routes, breadcrumbs and permissions shall be defined in one configuration (navigation.js). | Code review. | VERIFIED |
| NFR-MNT-003 | Automated unit, API and end-to-end tests shall run in CI on every merge. | CI pipeline reports. | PROPOSED |

## Data

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-DATA-001 | Prototype data shall be versioned (data version 8) and migrated forward automatically on load. | Migration tests. | VERIFIED |
| NFR-DATA-002 | Production tables shall carry created / updated by and at fields and soft-delete flags where history matters. | Schema review. | PROPOSED |
| NFR-DATA-003 | Retention periods for orders, POD photos, GPS points and documents shall follow client legal requirements (UAE / India). | Client confirmation. | PENDING CONFIRMATION |

## Compliance

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-COMP-001 | Tax invoices shall comply with the applicable regime (UAE VAT / India GST e-invoicing) if invoicing is in scope. | Tax advisor sign-off. | PENDING CONFIRMATION |
| NFR-COMP-002 | Location tracking shall only run during active deliveries with clear in-app indication and driver consent. | Privacy review. | PROPOSED |

## Portability

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-PORT-001 | The prototype shall run in current Chrome, Edge, Safari and Firefox without installation. | Browser smoke test. | VERIFIED |

## Observability

| ID | Requirement | Measure / acceptance | Label |
|---|---|---|---|
| NFR-OBS-001 | Production services shall emit structured logs, metrics and traces with alerting. | Monitoring dashboard. | PROPOSED |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |