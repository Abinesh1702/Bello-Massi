# Backend, Database, API, Frontend Integration and Auth / RBAC Roadmap

## Document control

| Field | Value |
|---|---|
| Document title | Backend, Database, API, Frontend Integration and Auth / RBAC Roadmap |
| Document ID | BM-RMP-002 |
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

Steps for building the Django backend, PostgreSQL database, REST API, integrating the React web app and implementing authentication and RBAC.

## Scope

PROPOSED (phases 2–4).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-RMP-001 — Prototype-to-Production Migration Roadmap (Master)](BM-RMP-001_Prototype_to_Production_Roadmap.md)
- [BM-ARC-001 — High-Level Design (HLD)](../07_SYSTEM_ARCHITECTURE/BM-ARC-001_High_Level_Design.md)
- [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md)
- [BM-API-001 — API Specification (Overview and Conventions)](../09_API_AND_INTEGRATION/BM-API-001_API_Specification.md)
- [BM-SEC-004 — Authorization and RBAC Design](../10_SECURITY_AND_COMPLIANCE/BM-SEC-004_Authorization_and_RBAC_Design.md)

## 1. Django backend

| Step | Deliverable |
|---|---|
| 1 | Project skeleton, settings per environment, Docker, CI |
| 2 | Apps per domain: accounts, masters, orders, approvals, dispatch, deliveries, tracking, documents, notifications |
| 3 | Port business rules from `src/services` (catalogue [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md)) with unit tests from prototype behaviour |
| 4 | Celery workers and outbox for integrations |
| 5 | Admin site for support (restricted) |

## 2. PostgreSQL

Schema from [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md) (50 proposed tables); constraints for status transitions and stock; audit columns; soft
delete; partitioned `location_points`; migration scripts; seed for reference data only.

## 3. REST API

v1 endpoints per [BM-API-002 — API Endpoint Catalogue](../09_API_AND_INTEGRATION/BM-API-002_API_Endpoint_Catalogue.xlsx) (140 proposed) and OpenAPI draft BM-API-018; contract tests; versioning
([BM-DEP-009 — Versioning Strategy and Release Notes Template](../14_DEPLOYMENT_AND_RELEASE/BM-DEP-009_Versioning_and_Release_Notes_Template.md)); rate limits; idempotency keys for confirm / OTP endpoints.

## 4. React frontend integration

1. Introduce API client layer with the same function signatures as current services.
2. Switch module by module (masters → orders → approval → consolidation → dispatch → deliveries).
3. Replace LocalStorage with server state (React Query or similar); keep only UI preferences locally.
4. Remove demo accounts, demo badges and simulators.

## 5. Authentication and RBAC

Django auth with Argon2id; JWT access + refresh; lockout and password policy (from current settings); MFA for admin roles;
roles / permissions / data scopes in database with the same 110 keys; object-level checks on every endpoint; audit
log server-side. Flow: DGM-15 in [BM-DGM-001 — Diagram Catalogue and Visual Documentation](../21_DIAGRAMS_AND_VISUAL_DOCUMENTATION/BM-DGM-001_Diagram_Catalogue.md).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |