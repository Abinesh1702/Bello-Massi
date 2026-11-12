# Source Code Handover Document

## Document control

| Field | Value |
|---|---|
| Document title | Source Code Handover Document |
| Document ID | BM-HND-007 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Client Handover |
| Related module(s) | All modules |
| Document owner | Technical Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Describe the delivered source code, its structure, dependencies and how to transfer it.

## Scope

Prototype source as delivered in bellomassi-premium-ui-with-docs.zip (VERIFIED). The delivered folder is not a Git repository.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-HND-006 — Technical Handover Document](BM-HND-006_Technical_Handover_Document.md)
- [BM-ARC-002 — Low-Level Design (LLD)](../07_SYSTEM_ARCHITECTURE/BM-ARC-002_Low_Level_Design.md)
- [BM-INF-007 — CI/CD Pipeline and Git Workflow](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-007_CICD_and_Git_Workflow.md)

## 1. Structure (VERIFIED)

| Folder | Files | Content |
|---|---|---|
| `src/pages` | 134 | Screens per module |
| `src/components` | 121 | Common, layout, dashboard, module components |
| `src/services` | 84 | Business logic and storage access |
| `src/hooks` | 19 | Data hooks |
| `src/config` | 15 | Navigation, roles, permissions, statuses, settings |
| `src/utils` | 11 | Formatting, maths, demo geo |
| `src/context`, `src/routes`, `src/styles`, `src/assets` | 8 | App providers, routes, CSS tokens, assets |
| Root | — | `package.json`, `vite.config.js`, `index.html`, `.env.example`, `.oxlintrc.json`, `README.md` |
| `docs/` | — | Existing documents and this package |

Total about 46.7k lines of JS / JSX / CSS.

## 2. Dependencies

Runtime: react, react-dom, react-router-dom, recharts, lucide-react, sonner, dayjs, tailwindcss. Dev: vite,
@vitejs/plugin-react, oxlint. Licences: all open-source (MIT / ISC) per their packages — licence audit NOT VERIFIED.

## 3. Transfer procedure (proposed)

1. Create a client-owned Git repository; import the source; tag `prototype-v8`.
2. Add branch protection and CI ([BM-INF-007 — CI/CD Pipeline and Git Workflow](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-007_CICD_and_Git_Workflow.md)).
3. Remove `node_modules` and `dist` from version control (`.gitignore` exists).
4. Confirm no secrets are present (`.env.example` contains no values — VERIFIED).

## 4. Documentation tooling

`docs/BELLOMASSI_PROJECT_DOCUMENTATION/_build` contains the generators used to create this package (Python / Node), and
`_build/tools` the read-only helpers that export navigation, permissions and seed data for documentation. They do not
change the application.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |