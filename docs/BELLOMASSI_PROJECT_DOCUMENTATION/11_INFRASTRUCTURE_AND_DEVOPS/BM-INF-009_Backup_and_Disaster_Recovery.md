# Backup and Disaster Recovery Plan

## Document control

| Field | Value |
|---|---|
| Document title | Backup and Disaster Recovery Plan |
| Document ID | BM-INF-009 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Infrastructure and DevOps |
| Related module(s) | All modules |
| Document owner | DevOps Engineer |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define backup scope, frequency, retention, recovery objectives and the restore procedure.

## Scope

PROPOSED. Prototype data lives in each browser's LocalStorage and has no backup except manual export (NOT IMPLEMENTED as a backup feature).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-INF-003 — Infrastructure, Network Architecture and Server Specification](BM-INF-003_Infrastructure_and_Network_Architecture.md)
- [BM-DAT-005 — Data Retention Policy (Draft)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-005_Data_Retention_Policy.md)
- [BM-DEP-005 — Rollback Plan](../14_DEPLOYMENT_AND_RELEASE/BM-DEP-005_Rollback_Plan.md)

## 1. Objectives (proposed, PENDING CONFIRMATION)

| Objective | Target |
|---|---|
| RPO (max data loss) | 15 minutes |
| RTO (max downtime) | 4 hours |
| Backup retention | Daily 35 days; monthly 12 months |

## 2. Backup scope

| Item | Method | Frequency | Location |
|---|---|---|---|
| PostgreSQL | Managed snapshots + continuous WAL (PITR) | Daily + continuous | Same region + copy to second region |
| Object storage (POD, documents, invoices) | Versioning + cross-region replication | Continuous | Second region |
| Configuration / IaC | Git | Every change | Git hosting |
| Secrets | Secrets manager with backup / export policy | On change | Provider |
| Redis | Not backed up (cache / transient) | — | — |

Diagram: DGM-18 in [BM-DGM-001 — Diagram Catalogue and Visual Documentation](../21_DIAGRAMS_AND_VISUAL_DOCUMENTATION/BM-DGM-001_Diagram_Catalogue.md).

## 3. Restore procedure (summary)

1. Declare incident; decide on PITR target time.
2. Restore database to new instance at target time; verify row counts and latest orders.
3. Point staging-like DR environment (IaC) to restored database and replicated bucket.
4. Run smoke tests; switch DNS / load balancer.
5. Reconcile: deliveries and OTPs created after the restore point are re-checked with drivers.
6. Post-incident review.

## 4. Testing

Restore test quarterly (database to a scratch instance) and a full DR rehearsal yearly. Results recorded — none performed
yet (NOT VERIFIED).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |