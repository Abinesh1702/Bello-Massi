# Audit Logging and Security Monitoring Policy

## Document control

| Field | Value |
|---|---|
| Document title | Audit Logging and Security Monitoring Policy |
| Document ID | BM-SEC-008 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Security and Compliance |
| Related module(s) | All modules |
| Document owner | Security Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define what is logged, how logs are protected and how security events are monitored.

## Scope

Application audit log, workflow timelines, security events, infrastructure logs.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-SEC-001 — Security Requirements Document](BM-SEC-001_Security_Requirements.md)
- [BM-INF-008 — Monitoring, Logging and Alerting Plan](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-008_Monitoring_and_Logging.md)
- [BM-FRD-SET — Functional Requirements — System Settings and Audit](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-SET_System_Settings_and_Audit.md)

## 1. Current prototype — VERIFIED

`bellomassi_audit_logs` (administrative and security events: users, roles, settings, account lock), order timeline,
dispatch timeline, activity log — all in the browser, editable by anyone with developer tools.

## 2. Production audit policy — PROPOSED

| Event class | Examples | Store | Retention |
|---|---|---|---|
| Security | Login success / failure, lockout, MFA, password change / reset, token revocation | `audit_logs` + SIEM | 7 years / 1 year |
| Privilege | Role created / changed, permission grant, user activation | `audit_logs` | 7 years |
| Business workflow | Submit, approve, return, reject, consolidate, confirm, cancel, deliver, fail, review, write-off, invoice | `order_events`, `dispatch` timeline, `audit_logs` | 7 years |
| Data export | Report export, bulk download | `audit_logs` | 2 years |
| Integration | Messages sent, webhook received, failures | `messages`, integration log | 1 year |

Logs are append-only (no UPDATE / DELETE privilege for the application role), time-synchronised (NTP), include user,
role, IP, user agent, correlation ID, before / after values (sensitive fields masked).

## 3. Security monitoring — PROPOSED

| Alert | Threshold |
|---|---|
| Failed logins | > 20 / 5 min from one IP; any Super Admin lockout |
| Privilege change | Any grant of Super Admin / Admin |
| Mass export | > 5 exports / 10 min by one user |
| OTP abuse | > 3 OTP lock-outs / hour per driver |
| API errors | 5xx rate > 2% for 5 min |
| Webhook signature failures | Any |

Dashboards and on-call routing per [BM-INF-008 — Monitoring, Logging and Alerting Plan](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-008_Monitoring_and_Logging.md); incidents handled per [BM-SEC-010 — Security Incident Response Plan](BM-SEC-010_Security_Incident_Response_Plan.md).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |