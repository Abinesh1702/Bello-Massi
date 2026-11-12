# Data Retention Policy (Draft)

## Document control

| Field | Value |
|---|---|
| Document title | Data Retention Policy (Draft) |
| Document ID | BM-DAT-005 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Database and Data Design |
| Related module(s) | All modules |
| Document owner | Data Protection Officer (client) — PENDING CONFIRMATION |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Propose retention periods per data category; final periods require client legal confirmation (UAE / India).

## Scope

Production data. All periods are PROPOSED / PENDING CONFIRMATION.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-DAT-002 — Proposed Production Database Design](BM-DAT-002_Production_Database_Design.md)
- [BM-SEC-006 — Data Protection, Encryption and Backup Security Policy](../10_SECURITY_AND_COMPLIANCE/BM-SEC-006_Data_Protection_and_Encryption_Policy.md)
- [BM-SEC-007 — Privacy Policy (Draft)](../10_SECURITY_AND_COMPLIANCE/BM-SEC-007_Privacy_Policy_Draft.md)

## 1. Proposed retention

| Data category | Examples | Proposed retention | Disposal |
|---|---|---|---|
| Orders, approvals, deliveries, delivery notes | `orders`, `order_approvals`, `deliveries`, `delivery_notes` | 7 years (commercial / tax records) | Archive then delete |
| Invoices (if in scope) | `invoices` | Per tax law (UAE VAT ≥ 5 years; India GST ≥ 6 years) — PENDING CONFIRMATION | Archive |
| POD photos and signatures | object storage | 2 years after delivery | Delete objects |
| GPS location points | `location_points` | 90 days (summary kept with delivery) | Drop monthly partitions |
| OTP records | `delivery_otps` | 90 days (hash only) | Delete |
| Messages log | `messages` | 1 year | Delete |
| Audit logs | `audit_logs` | 7 years | Archive |
| Documents (licences, RC, KYC) | `documents` | While relationship is active + 2 years | Delete objects |
| Inactive users | `users` | Anonymise 2 years after deactivation | Anonymise |
| Customer master | `customers` | Active + 7 years after last order | Anonymise |
| Backups | snapshots, WAL | 35 days | Automatic expiry |

## 2. Prototype

The prototype keeps data until the browser site data is cleared or demo data is reset — no retention rules apply.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |