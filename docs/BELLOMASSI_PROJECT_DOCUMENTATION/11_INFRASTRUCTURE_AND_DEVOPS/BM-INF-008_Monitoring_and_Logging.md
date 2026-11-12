# Monitoring, Logging and Alerting Plan

## Document control

| Field | Value |
|---|---|
| Document title | Monitoring, Logging and Alerting Plan |
| Document ID | BM-INF-008 |
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

Define what is monitored, how logs are collected and when alerts fire.

## Scope

PROPOSED for production. The prototype has no monitoring (it runs only in the browser); in-app audit and integration logs exist in LocalStorage (VERIFIED, prototype only).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-INF-003 — Infrastructure, Network Architecture and Server Specification](BM-INF-003_Infrastructure_and_Network_Architecture.md)
- [BM-SEC-008 — Audit Logging and Security Monitoring Policy](../10_SECURITY_AND_COMPLIANCE/BM-SEC-008_Audit_Logging_and_Security_Monitoring.md)
- [BM-HND-014 — Support and Maintenance Agreement (Draft)](../19_CLIENT_HANDOVER/BM-HND-014_Support_and_Maintenance_Agreement_Draft.md)

## 1. Monitoring

| Area | Metric | Alert threshold (proposed) |
|---|---|---|
| Availability | Health checks `/healthz`, external uptime check | 2 failed checks in 2 min |
| API | Request rate, p95 latency, 5xx rate | p95 > 1 s for 10 min; 5xx > 2 % |
| WebSocket | Connected clients, message lag | Lag > 10 s |
| Workers | Queue length, task failures, retries | Queue > 500 for 10 min; failures > 5 % |
| Database | CPU, connections, replication lag, storage | CPU > 80 %; lag > 60 s; storage > 80 % |
| Redis | Memory, evictions | Memory > 80 % |
| Integrations | Send failures by provider, dead-letter count | Any dead letter; failure > 10 % |
| GPS | Active sessions without update | No update > 5 min during active delivery |
| Business | Orders stuck in status > threshold, failed deliveries | Daily report / dashboard |
| Security | Failed logins, lockouts, permission denials | Spike vs. baseline |
| Certificates | Days to expiry | < 21 days |

## 2. Logging

Structured JSON logs with timestamp, level, service, request id, user id (no secrets, no full OTPs, no passwords),
shipped to a central store (CloudWatch / Azure Monitor / Loki). Retention: application logs 30 days hot, 1 year archive;
audit log as [BM-SEC-008 — Audit Logging and Security Monitoring Policy](../10_SECURITY_AND_COMPLIANCE/BM-SEC-008_Audit_Logging_and_Security_Monitoring.md). Errors to Sentry with release tags.

## 3. Alert routing

| Severity | Example | Channel | Response |
|---|---|---|---|
| P1 | Production down, data loss risk | Phone / SMS + chat | 30 min |
| P2 | Major feature failing (OTP, dispatch) | Chat + email | 2 h (business hours) |
| P3 | Degraded / single integration retrying | Ticket | Next business day |

Response times are proposals subject to the support agreement (PENDING CONFIRMATION).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |