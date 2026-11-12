# Monitoring and Maintenance Guide

## Document control

| Field | Value |
|---|---|
| Document title | Monitoring and Maintenance Guide |
| Document ID | BM-ADM-004 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Administration and Configuration |
| Related module(s) | All modules |
| Document owner | System Administrator |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Routine maintenance tasks for the prototype (VERIFIED behaviour) and the production platform (PROPOSED).

## Scope

Data housekeeping, backups, updates, health checks, support routines.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-INF-008 — Monitoring, Logging and Alerting Plan](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-008_Monitoring_and_Logging.md)
- [BM-INF-009 — Backup and Disaster Recovery Plan](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-009_Backup_and_Disaster_Recovery.md)
- [BM-DEP-005 — Rollback Plan](../14_DEPLOYMENT_AND_RELEASE/BM-DEP-005_Rollback_Plan.md)
- [BM-HND-014 — Support and Maintenance Agreement (Draft)](../19_CLIENT_HANDOVER/BM-HND-014_Support_and_Maintenance_Agreement_Draft.md)

## 1. Prototype maintenance (VERIFIED behaviour)

| Task | How |
|---|---|
| Reset demo data | Clear the site data of the browser; the seed loads again on next visit |
| Data version | `bellomassi_app_version` = 8; newer builds migrate automatically |
| Storage quota | About 5 MB per browser; photos / signatures stored downscaled — clear old demo data if quota is reached |
| "Backup" | No backup feature — data exists only in that browser (NOT IMPLEMENTED) |
| Updates | Replace the static `dist/` files; users reload |

## 2. Production maintenance (PROPOSED)

| Frequency | Task | Owner |
|---|---|---|
| Continuous | Monitoring and alerts ([BM-INF-008 — Monitoring, Logging and Alerting Plan](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-008_Monitoring_and_Logging.md)) | DevOps / support |
| Daily | Check failed jobs, dead letters, integration errors; backup success | Support |
| Weekly | Review security alerts, locked accounts, disk / DB growth | Admin / DevOps |
| Monthly | OS / image patching; dependency updates; access review; restore test of a sample | DevOps |
| Quarterly | DR restore test; capacity review; role review | DevOps / client |
| Yearly | DR rehearsal; penetration test; certificate / licence renewals | Security |

## 3. Data housekeeping (PROPOSED)

Archive GPS points older than retention; purge expired OTPs; rotate logs; archive closed orders per retention policy
([BM-DAT-005 — Data Retention Policy (Draft)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-005_Data_Retention_Policy.md)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |