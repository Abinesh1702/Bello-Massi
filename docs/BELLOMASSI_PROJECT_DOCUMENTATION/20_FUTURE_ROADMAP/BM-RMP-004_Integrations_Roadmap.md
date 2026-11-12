# Integrations Roadmap — SAP, Email, WhatsApp (OpenWA), OCR, Maps and SMS

## Document control

| Field | Value |
|---|---|
| Document title | Integrations Roadmap — SAP, Email, WhatsApp (OpenWA), OCR, Maps and SMS |
| Document ID | BM-RMP-004 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Future Roadmap |
| Related module(s) | All modules |
| Document owner | Integration Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Plan each external integration from current demo mode to production.

## Scope

All integrations are currently demo / simulated (VERIFIED); production steps PROPOSED; SAP timing PENDING CONFIRMATION.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-RMP-001 — Prototype-to-Production Migration Roadmap (Master)](BM-RMP-001_Prototype_to_Production_Roadmap.md)
- [BM-API-019 — Integration Specification (External Systems)](../09_API_AND_INTEGRATION/BM-API-019_Integration_Specification.md)
- [BM-INF-005 — Environment Configuration and Environment Variables Reference](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-005_Environment_Configuration.md)

| Integration | Today | Phase | Steps | Decision needed |
|---|---|---|---|---|
| Maps / Routes | Map links, DEMO GPS | 3 | API keys, server-side routes, ETA, map display | Billing account |
| SMS (OTP, notes) | Not sent | 3 | Provider, sender ID, templates, delivery receipts | Provider |
| WhatsApp | OpenWA demo mode | 3 | Replace OpenWA with official WhatsApp Business API provider; template approval; opt-in | Provider; OpenWA retirement |
| Email | Demo mode / optional gateway | 3 | SMTP / API provider, SPF / DKIM, templates, bounce handling | Domain |
| OCR | Simulated | 5 | Engine selection (cloud or self-hosted), field mapping per document type, review queue | Provider |
| SAP | Not implemented | 5 | Interface specification (items, customers, prices, invoices), middleware / API, error handling, reconciliation | SAP version and access |

Common pattern: outbox → worker → provider → integration log → retries → dead letter (DGM-16 in [BM-DGM-001 — Diagram Catalogue and Visual Documentation](../21_DIAGRAMS_AND_VISUAL_DOCUMENTATION/BM-DGM-001_Diagram_Catalogue.md)).
Details per integration: [BM-API-019 — Integration Specification (External Systems)](../09_API_AND_INTEGRATION/BM-API-019_Integration_Specification.md).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |