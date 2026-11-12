# System Constraints Document

## Document control

| Field | Value |
|---|---|
| Document title | System Constraints Document |
| Document ID | BM-SYS-005 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | System Requirements |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Record constraints that limit design choices.

## Scope

Business, technical, regulatory and prototype constraints.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-SYS-006 — Assumptions and Dependencies](BM-SYS-006_Assumptions_and_Dependencies.md)
- [BM-SYS-002 — Software Requirements Specification (SRS)](BM-SYS-002_Software_Requirements_Specification.md)

## 1. Constraints

| ID | Type | Constraint | Source | Label |
|---|---|---|---|---|
| CON-01 | Technical | Production backend: Python Django + REST; PostgreSQL; Django Channels for WebSockets | GPS guide §10 | PROPOSED (client-preferred stack) |
| CON-02 | Technical | Driver app built with React Native | GPS guide §1, §10 | PROPOSED |
| CON-03 | Technical | Web frontend React (existing prototype code reused) | Prototype | VERIFIED |
| CON-04 | Technical | Mobile GPS depends on phone permissions, battery, connectivity; stops if the phone is off | GPS guide §8 | VERIFIED (guide) |
| CON-05 | Commercial | Maps / routes and messaging are usage-billed third-party services | GPS guide §12; SOW slide 16 | VERIFIED (guide) |
| CON-06 | Policy | WhatsApp via OpenWA is an unofficial client — risk of number ban; official WhatsApp Business Platform requires approved templates | Industry practice | PENDING CONFIRMATION |
| CON-07 | Regulatory | Tax invoices must follow UAE VAT or India GST rules if invoicing is in scope | Country rules | PENDING CONFIRMATION |
| CON-08 | Regulatory | Location tracking only during active deliveries with driver awareness | GPS guide §8, §12 | PROPOSED |
| CON-09 | Prototype | Data lives in one browser (≈5 MB quota); no sharing between users | storageService | VERIFIED |
| CON-10 | Prototype | Demo passwords are published; client-side session | authService | VERIFIED |
| CON-11 | Schedule | SAP integration only in stage 2 | SOW slides 4, 15 | VERIFIED |
| CON-12 | Organisation | Accounts are created by administrators; no self-registration for drivers | GPS guide §2 | VERIFIED (guide) |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |