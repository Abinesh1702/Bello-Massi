# Test Strategy

## Document control

| Field | Value |
|---|---|
| Document title | Test Strategy |
| Document ID | BM-QA-001 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Testing and Quality Assurance |
| Related module(s) | All modules |
| Document owner | QA Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define how the Bellomassi platform will be tested — levels, types, environments, tools, entry / exit criteria and responsibilities.

## Scope

Prototype verification (current) and production platform testing (PROPOSED). No production test execution has taken place.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- docs/FINALISATION.md §13 Verification performed
- [BM-QA-002 — Test Plan (with Functional, Integration, Regression, Performance, Security and Mobile sub-plans)](BM-QA-002_Test_Plan.md)
- [BM-QA-003 — User Acceptance Testing (UAT) Plan](BM-QA-003_UAT_Plan.md)
- [BM-QA-004 — Defect Management Process and Bug Report Template](BM-QA-004_Defect_Management_Process.md)
- [BM-QA-010 — Test Scenario Catalogue](BM-QA-010_Test_Scenario_Catalogue.xlsx)
- [BM-QA-011 — Functional Test Cases](BM-QA-011_Functional_Test_Cases.xlsx)
- [BM-QA-012 — UAT Test Cases](BM-QA-012_UAT_Test_Cases.xlsx)
- [BM-SYS-004 — Non-Functional Requirements](../03_SYSTEM_REQUIREMENTS/BM-SYS-004_Non_Functional_Requirements.md)

## Contents

- 1. Current test position
- 2. Test levels
- 3. Test types
- 4. Environments and data
- 5. Entry and exit criteria
- 6. Defects
- 7. Metrics
- 8. Roles

## 1. Current test position

| Item | Status | Label |
|---|---|---|
| Production build `vite build` | Passed on 2026-11-12 during documentation | VERIFIED |
| Lint `oxlint` | Exit code 0, about 20 warnings, no errors (2026-11-12) | VERIFIED |
| Developer browser checks (13 roles × pages, 71 scenarios, 83 Phase-1, 30 regression, 31 migration, 118 reports, 137 pages at 390 px) | Reported in FINALISATION.md; scripts are not in the repository | NOT VERIFIED (independently) |
| Automated unit / API tests in repository | None | NOT IMPLEMENTED |
| Formal system test, UAT, performance, security tests | Not performed | NOT VERIFIED |

## 2. Test levels

| Level | What | Who | Tools (proposed) |
|---|---|---|---|
| Unit | Services, rules (credit, stock, OTP, status transitions) | Developers | pytest, Vitest |
| Integration / API | Endpoints, permissions, data scope, transactions | Developers + QA | pytest + DRF test client, Postman / Newman |
| System (E2E) | Full workflows across roles | QA | Playwright (web), Maestro / Detox (mobile) |
| Regression | Re-run of automated suites each release | QA (CI) | CI pipeline |
| UAT | Business acceptance by client users | Client key users | [BM-QA-003 — User Acceptance Testing (UAT) Plan](BM-QA-003_UAT_Plan.md), [BM-QA-012 — UAT Test Cases](BM-QA-012_UAT_Test_Cases.xlsx) |

## 3. Test types

| Type | Focus | Reference |
|---|---|---|
| Functional | 179 functional requirements; 228 functional test cases | [BM-QA-011 — Functional Test Cases](BM-QA-011_Functional_Test_Cases.xlsx) |
| Negative | 49 negative cases (invalid input, blocked transitions) | [BM-QA-011 — Functional Test Cases](BM-QA-011_Functional_Test_Cases.xlsx) |
| Role / permission | Every role × screen and action; data scope isolation | [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx) |
| Workflow | 24 workflows end to end | [BM-QA-010 — Test Scenario Catalogue](BM-QA-010_Test_Scenario_Catalogue.xlsx) |
| Mobile / device | Driver app on representative Android / iOS phones; GPS, camera, offline | [BM-UX-007 — Mobile UX — Driver App and Customer App](../12_UI_UX_AND_DESIGN/BM-UX-007_Mobile_UX_Driver_and_Customer.md) |
| Integration | Maps, SMS / WhatsApp, email, OCR, SAP (sandbox) | [BM-API-019 — Integration Specification (External Systems)](../09_API_AND_INTEGRATION/BM-API-019_Integration_Specification.md) |
| Performance | Load on API and WebSocket; targets from NFRs | [BM-SYS-004 — Non-Functional Requirements](../03_SYSTEM_REQUIREMENTS/BM-SYS-004_Non_Functional_Requirements.md) |
| Security | OWASP ASVS L2 checks, pen test before go-live | [BM-SEC-011 — Vulnerability Management and Security Testing Plan](../10_SECURITY_AND_COMPLIANCE/BM-SEC-011_Vulnerability_Management_and_Security_Testing.md) |
| Accessibility | WCAG 2.2 AA checks | [BM-UX-008 — Accessibility and Responsive Design Guidelines](../12_UI_UX_AND_DESIGN/BM-UX-008_Accessibility_and_Responsive_Design.md) |
| Data migration | Counts, balances, reconciliation | [BM-DAT-004 — Data Migration Strategy](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-004_Data_Migration_Strategy.md) |
| Backup / restore | Restore test | [BM-INF-009 — Backup and Disaster Recovery Plan](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-009_Backup_and_Disaster_Recovery.md) |

## 4. Environments and data

Test and staging environments as [BM-INF-003 — Infrastructure, Network Architecture and Server Specification](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-003_Infrastructure_and_Network_Architecture.md). Synthetic data only; no production personal data in test. Provider
sandboxes for integrations. Fixed seed for repeatable automated runs.

## 5. Entry and exit criteria

| Phase | Entry | Exit |
|---|---|---|
| System test | Build deployed to test; smoke passed; test cases reviewed | 100 % planned cases executed; no open Critical / High; Medium with agreed workaround |
| UAT | System test exit met; UAT users trained; UAT data loaded | All UAT cases executed; no open Critical / High; client sign-off ([BM-QA-003 — User Acceptance Testing (UAT) Plan](BM-QA-003_UAT_Plan.md)) |
| Release | UAT signed; release checklist complete | Go-live approval ([BM-DEP-001 — Release Management Process](../14_DEPLOYMENT_AND_RELEASE/BM-DEP-001_Release_Management_Process.md)) |

## 6. Defects

Severity and priority definitions, workflow and template: [BM-QA-004 — Defect Management Process and Bug Report Template](BM-QA-004_Defect_Management_Process.md).

## 7. Metrics

Execution progress (% executed / passed), defect counts by severity and status, defect density per module, requirements
coverage (requirements with ≥ 1 passed test), automation coverage, reopened rate, UAT pass rate. Reporting:
[BM-QA-005 — Test Execution Report (Template)](BM-QA-005_Test_Execution_Report_Template.md) and [BM-QA-006 — Test Summary Report (Template) and Quality Metrics](BM-QA-006_Test_Summary_Report_Template.md). No metrics exist yet.

## 8. Roles

| Role | Responsibility |
|---|---|
| QA Lead | Strategy, plan, reporting, exit decision proposal |
| QA Engineers | Test design, execution, automation, defect logging |
| Developers | Unit / integration tests, defect fixing |
| Client key users | UAT execution and acceptance |
| Project Manager | Schedule, risk, sign-off coordination |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |