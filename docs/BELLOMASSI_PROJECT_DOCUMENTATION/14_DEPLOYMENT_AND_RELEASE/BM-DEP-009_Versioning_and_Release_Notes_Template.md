# Versioning Strategy and Release Notes Template

## Document control

| Field | Value |
|---|---|
| Document title | Versioning Strategy and Release Notes Template |
| Document ID | BM-DEP-009 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Deployment and Release |
| Related module(s) | All modules |
| Document owner | Release Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define version numbers for applications, API, data and documents, and provide the release notes template.

## Scope

PROPOSED for production. Prototype versioning (APP_DATA_VERSION = 8, package version) is VERIFIED.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-DEP-001 — Release Management Process](BM-DEP-001_Release_Management_Process.md)
- [BM-DEP-003 — Release Notes — Prototype Finalisation Release (Data Version 8)](BM-DEP-003_Release_Notes_Prototype_v8.md)
- [BM-INF-007 — CI/CD Pipeline and Git Workflow](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-007_CICD_and_Git_Workflow.md)

## 1. Version numbers

| Item | Scheme | Example |
|---|---|---|
| Web app, API, workers | Semantic `MAJOR.MINOR.PATCH` (same release number) | 1.4.2 |
| Mobile app | Semantic version + build number | 1.4.2 (142) |
| API contract | URL major version `/api/v1/`; additive changes within v1 | v1 |
| Database schema | Migration sequence per app | orders.0012 |
| Prototype data | `APP_DATA_VERSION` integer with browser migrations (current 8) | 8 |
| Documents | `vMAJOR.MINOR` — minor for edits, major after approval | v1.0 |

## 2. Rules

MAJOR = breaking change (API, data, process); MINOR = new features; PATCH = fixes. Git tag `vX.Y.Z` per release;
changelog generated from conventional commits; mobile minimum supported version enforced by API header.

## 3. Release notes template

| Section | Content |
|---|---|
| Release | Version, date, environment |
| Summary | 2–3 sentences for business users |
| New features | Per module, with FR references |
| Improvements | |
| Fixed defects | Defect IDs and titles |
| Known issues | With workaround ([BM-HND-010 — Known Issues Register](../19_CLIENT_HANDOVER/BM-HND-010_Known_Issues_Register.xlsx)) |
| Data / configuration changes | Migrations, new settings, permissions added |
| Actions for users | Training, re-login, app update |
| Rollback note | Whether rollback is possible without data restore |
| Approval | Blank fields: QA lead / Release manager / Client approver — name, date, signature |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |