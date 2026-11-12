# Deployment Guide and Runbook

## Document control

| Field | Value |
|---|---|
| Document title | Deployment Guide and Runbook |
| Document ID | BM-DEP-002 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Deployment and Release |
| Related module(s) | All modules |
| Document owner | DevOps Engineer |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Step-by-step instructions to run the prototype (VERIFIED) and to deploy the production platform (PROPOSED).

## Scope

Part A prototype; Part B production. Commands in Part A were executed on 2026-11-12.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-INF-005 — Environment Configuration and Environment Variables Reference](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-005_Environment_Configuration.md)
- [BM-INF-006 — Docker Architecture and Deployment Guide](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-006_Docker_Architecture_and_Deployment.md)
- [BM-INF-007 — CI/CD Pipeline and Git Workflow](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-007_CICD_and_Git_Workflow.md)
- [BM-DEP-005 — Rollback Plan](BM-DEP-005_Rollback_Plan.md)
- [BM-DEP-006 — Post-Deployment Verification and Smoke Test Checklist](BM-DEP-006_Post_Deployment_Verification.md)

## 1. Part A — Prototype (VERIFIED)

Requirements: Node.js 20+ and npm.

```bash
npm install            # install dependencies
npm run dev            # development server (http://localhost:5173)
npm run build          # production bundle in dist/
npx vite preview       # serve dist/ (http://localhost:4173)
npm run lint           # oxlint
```

Hosting: copy `dist/` to any static web host; configure SPA fallback (all routes → `index.html`). Optional variable
`VITE_INTEGRATION_GATEWAY_URL` at build time. Data is seeded into each browser's LocalStorage on first visit
(APP_DATA_VERSION 8); a new version migrates existing browser data. Clearing site data resets the demo.

Demo accounts are listed on the sign-in screen (prototype only — never use them in production).

## 2. Part B — Production deployment (PROPOSED)

### 2.1 First-time setup

1. Provision infrastructure with IaC (network, database, Redis, storage, container service, load balancer, DNS, TLS).
2. Create secrets in the secrets manager ([BM-INF-005 — Environment Configuration and Environment Variables Reference](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-005_Environment_Configuration.md)).
3. Build and push images (`bellomassi-web`, `bellomassi-api`, `bellomassi-worker`).
4. Run database migrations job (`python manage.py migrate`).
5. Create the first Super Admin (management command), roles and permissions seed.
6. Load master data ([BM-DAT-004 — Data Migration Strategy](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-004_Data_Migration_Strategy.md)).
7. Deploy API, channels, workers, beat, web.
8. Configure providers (maps keys, SMS / WhatsApp, email) and verify webhooks.
9. Run smoke tests ([BM-DEP-006 — Post-Deployment Verification and Smoke Test Checklist](BM-DEP-006_Post_Deployment_Verification.md)).

### 2.2 Routine release

1. Confirm release approval ([BM-DEP-001 — Release Management Process](BM-DEP-001_Release_Management_Process.md)).
2. Announce maintenance window if migrations are not backward compatible.
3. Take on-demand database snapshot.
4. Run migrations job (backward-compatible migrations first).
5. Deploy new version to the idle (green) environment; health checks pass.
6. Switch traffic; monitor errors and latency for 30 minutes.
7. Smoke tests; publish release notes.
8. If rollback criteria are met → [BM-DEP-005 — Rollback Plan](BM-DEP-005_Rollback_Plan.md).

### 2.3 Mobile app

Build signed artefacts (EAS / Fastlane), upload to internal testing, pilot drivers verify, promote to production track.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |