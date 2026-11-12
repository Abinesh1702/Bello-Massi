# Rollback Plan

## Document control

| Field | Value |
|---|---|
| Document title | Rollback Plan |
| Document ID | BM-DEP-005 |
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

Define when and how a release is rolled back.

## Scope

Production releases (PROPOSED) and the prototype (VERIFIED approach).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-DEP-002 — Deployment Guide and Runbook](BM-DEP-002_Deployment_Guide.md)
- [BM-INF-009 — Backup and Disaster Recovery Plan](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-009_Backup_and_Disaster_Recovery.md)
- [BM-DEP-004 — Go-Live and Cutover Plan](BM-DEP-004_Go_Live_and_Cutover_Plan.md)

## 1. Rollback triggers

Critical defect without quick fix; error rate > 5 % for 10 minutes; data integrity issue (stock, orders, OTP); security
issue; failed smoke tests.

## 2. Procedure

| Case | Action |
|---|---|
| Application only (no schema change) | Switch traffic back to previous (blue) version; verify health |
| Backward-compatible migration | Switch back; keep schema (expand / contract pattern) |
| Non-compatible migration | Stop writes; restore snapshot or PITR to pre-release point; redeploy previous version; reconcile transactions made since release |
| Mobile app | Halt staged rollout; re-publish previous build; server keeps old API version |
| Prototype | Redeploy previous `dist/`; browsers keep LocalStorage data — a lower APP_DATA_VERSION does not down-migrate, so users may need to clear site data |

## 3. After rollback

Inform users; record incident; root-cause analysis; fix and re-release through the normal process.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |