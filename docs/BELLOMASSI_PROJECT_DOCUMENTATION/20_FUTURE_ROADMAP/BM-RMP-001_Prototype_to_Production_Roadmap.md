# Prototype-to-Production Migration Roadmap (Master)

## Document control

| Field | Value |
|---|---|
| Document title | Prototype-to-Production Migration Roadmap (Master) |
| Document ID | BM-RMP-001 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Future Roadmap |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

One view of all roadmap tracks across the five phases.

## Scope

Phase 1 is complete (VERIFIED); phases 2–5 are PROPOSED with indicative timing (ESTIMATE, not agreed).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-RMP-002 — Backend, Database, API, Frontend Integration and Auth / RBAC Roadmap](BM-RMP-002_Backend_Database_API_Frontend_Auth_Roadmap.md)
- [BM-RMP-003 — React Native Driver App and Customer App Roadmap](BM-RMP-003_Mobile_Apps_Roadmap.md)
- [BM-RMP-004 — Integrations Roadmap — SAP, Email, WhatsApp (OpenWA), OCR, Maps and SMS](BM-RMP-004_Integrations_Roadmap.md)
- [BM-RMP-005 — Cloud, Security, Performance, Reporting and Monitoring Roadmap](BM-RMP-005_Cloud_Security_Performance_Reporting_Monitoring_Roadmap.md)
- [BM-PLN-001 — Scope and Phase Plan](../05_SCOPE_AND_PLANNING/BM-PLN-001_Scope_and_Phase_Plan.md)
- [BM-INF-010 — Infrastructure Security, Scalability and Cloud Migration Plan](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-010_Infrastructure_Security_Scaling_and_Migration.md)

## 1. Phases

| Phase | Name | Status |
|---|---|---|
| 1 | Prototype | Complete |
| 2 | Backend | Proposed |
| 3 | Integrations and mobile | Proposed |
| 4 | Production deployment | Proposed |
| 5 | Enhancements | Proposed |

## 2. Tracks × phases

| # | Track | Phase 1 (done) | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Detail |
|---|---|---|---|---|---|---|---|
| 1 | Prototype-to-production migration | Rules and UI validated | Replace browser services by API | Replace simulators | Data migration, cut-over | — | this document |
| 2 | Django backend | — | Core modules | Integration workers | Hardening | Extensions | [BM-RMP-002 — Backend, Database, API, Frontend Integration and Auth / RBAC Roadmap](BM-RMP-002_Backend_Database_API_Frontend_Auth_Roadmap.md) |
| 3 | PostgreSQL database | LocalStorage model | Schema, migrations | Tracking partitions | Backups, DR | Reporting replica | [BM-RMP-002 — Backend, Database, API, Frontend Integration and Auth / RBAC Roadmap](BM-RMP-002_Backend_Database_API_Frontend_Auth_Roadmap.md) |
| 4 | REST API | Service contracts in browser | v1 core endpoints | Tracking, OTP, webhooks | Freeze v1 | Additions | [BM-RMP-002 — Backend, Database, API, Frontend Integration and Auth / RBAC Roadmap](BM-RMP-002_Backend_Database_API_Frontend_Auth_Roadmap.md) |
| 5 | React frontend integration | Complete UI | API clients per module | Live data (WebSocket) | Remove demo code | Enhancements | [BM-RMP-002 — Backend, Database, API, Frontend Integration and Auth / RBAC Roadmap](BM-RMP-002_Backend_Database_API_Frontend_Auth_Roadmap.md) |
| 6 | React Native driver app | Web driver app | Design | Build + GPS | Store release, pilot | Offline improvements | [BM-RMP-003 — React Native Driver App and Customer App Roadmap](BM-RMP-003_Mobile_Apps_Roadmap.md) |
| 7 | React Native customer app | Web customer app | Decision (X-01) | Build if confirmed | Release | — | [BM-RMP-003 — React Native Driver App and Customer App Roadmap](BM-RMP-003_Mobile_Apps_Roadmap.md) |
| 8 | Authentication and RBAC | Browser RBAC | Server auth + RBAC | Mobile tokens | MFA, review | SSO | [BM-RMP-002 — Backend, Database, API, Frontend Integration and Auth / RBAC Roadmap](BM-RMP-002_Backend_Database_API_Frontend_Auth_Roadmap.md) |
| 9 | SAP integration | — | — | Interface spec | — | Build | [BM-RMP-004 — Integrations Roadmap — SAP, Email, WhatsApp (OpenWA), OCR, Maps and SMS](BM-RMP-004_Integrations_Roadmap.md) |
| 10 | Email integration | Demo mode | — | Provider live | — | Inbox features | [BM-RMP-004 — Integrations Roadmap — SAP, Email, WhatsApp (OpenWA), OCR, Maps and SMS](BM-RMP-004_Integrations_Roadmap.md) |
| 11 | OpenWA / WhatsApp | Demo mode | Decision: official provider | Provider live | — | — | [BM-RMP-004 — Integrations Roadmap — SAP, Email, WhatsApp (OpenWA), OCR, Maps and SMS](BM-RMP-004_Integrations_Roadmap.md) |
| 12 | OCR integration | Simulated | — | — | — | Provider live | [BM-RMP-004 — Integrations Roadmap — SAP, Email, WhatsApp (OpenWA), OCR, Maps and SMS](BM-RMP-004_Integrations_Roadmap.md) |
| 13 | Cloud deployment | Static host | Environments, IaC | Staging | Production | Scale | [BM-RMP-005 — Cloud, Security, Performance, Reporting and Monitoring Roadmap](BM-RMP-005_Cloud_Security_Performance_Reporting_Monitoring_Roadmap.md) |
| 14 | Production security | Prototype only | Secure design | Testing | Pen test, go-live controls | Certification if required | [BM-RMP-005 — Cloud, Security, Performance, Reporting and Monitoring Roadmap](BM-RMP-005_Cloud_Security_Performance_Reporting_Monitoring_Roadmap.md) |
| 15 | Performance optimisation | — | Baselines | Load tests | Tuning | Caching / replicas | [BM-RMP-005 — Cloud, Security, Performance, Reporting and Monitoring Roadmap](BM-RMP-005_Cloud_Security_Performance_Reporting_Monitoring_Roadmap.md) |
| 16 | Reporting enhancement | 118 reports (browser) | Server reports (go-live set) | — | — | BI / warehouse | [BM-RMP-005 — Cloud, Security, Performance, Reporting and Monitoring Roadmap](BM-RMP-005_Cloud_Security_Performance_Reporting_Monitoring_Roadmap.md) |
| 17 | Monitoring and analytics | — | Logging | Metrics, alerts | Dashboards, on-call | Product analytics | [BM-RMP-005 — Cloud, Security, Performance, Reporting and Monitoring Roadmap](BM-RMP-005_Cloud_Security_Performance_Reporting_Monitoring_Roadmap.md) |

## 3. Indicative timeline

See Gantt chart in [BM-PLN-001 — Scope and Phase Plan](../05_SCOPE_AND_PLANNING/BM-PLN-001_Scope_and_Phase_Plan.md) (ESTIMATE; assumed start not agreed).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |