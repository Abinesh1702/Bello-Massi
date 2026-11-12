---
title: "Vulnerability Management and Security Testing Plan"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-SEC-011 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Vulnerability Management and Security Testing Plan |
| Document ID | BM-SEC-011 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Security and Compliance |
| Related module(s) | All modules |
| Document owner | Security Architect / QA Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define how vulnerabilities are found, prioritised and fixed, and which security tests are run before go-live.

## Scope

Production code, dependencies, containers, infrastructure and mobile apps. No security test has been performed yet.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SEC-001** (Security Requirements Document)
- **BM-QA-002** (Test Plan (with Functional, Integration, Regression, Performance, Security and Mobile sub-plans))
- **BM-INF-007** (CI/CD Pipeline and Git Workflow)

## 1. Vulnerability management

| Activity | Tool (proposal) | Frequency | SLA to fix |
|---|---|---|---|
| Dependency scanning | Dependabot / pip-audit / npm audit | Every PR + weekly | Critical 7 d, High 30 d |
| SAST | Bandit (Python), ESLint security / Semgrep | Every PR | Before merge |
| Container scanning | Trivy | Every build | Critical before deploy |
| Infrastructure scanning | Cloud security posture tool / OpenSCAP | Weekly | High 30 d |
| DAST | OWASP ZAP baseline | Each release to staging | Before production |
| Penetration test | Independent tester | Before go-live, then yearly | Per report |

## 2. Security test plan

| ID | Test | Expected |
|---|---|---|
| ST-01 | Authentication brute force | Lockout after 5; IP throttling |
| ST-02 | Token replay after logout | Refresh rejected |
| ST-03 | IDOR — customer opens another customer's order / tracking | 404 |
| ST-04 | IDOR — driver opens another driver's delivery | 404 |
| ST-05 | Privilege escalation — salesman calls approve endpoint | 403 |
| ST-06 | OTP brute force | Locked after 5; rate-limit regenerate |
| ST-07 | OTP leakage | OTP never in API responses or logs |
| ST-08 | File upload — executable / polyglot / oversize | Rejected; scanned |
| ST-09 | Injection (SQL, template, CSV export formula) | Escaped / blocked |
| ST-10 | XSS in names, remarks, templates | Escaped output |
| ST-11 | CORS / CSRF | Only allowed origins; CSRF protected cookies |
| ST-12 | Webhook signature | Unsigned requests rejected |
| ST-13 | TLS configuration | Grade A; no weak ciphers |
| ST-14 | Mobile app storage | Tokens in keystore; no sensitive cache |

Results are recorded in the security test report (not yet produced).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |