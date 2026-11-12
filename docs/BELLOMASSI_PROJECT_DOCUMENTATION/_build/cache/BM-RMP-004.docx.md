---
title: "Integrations Roadmap — SAP, Email, WhatsApp (OpenWA), OCR, Maps and SMS"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-RMP-004 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

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

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-RMP-001** (Prototype-to-Production Migration Roadmap (Master))
- **BM-API-019** (Integration Specification (External Systems))
- **BM-INF-005** (Environment Configuration and Environment Variables Reference)

| Integration | Today | Phase | Steps | Decision needed |
|---|---|---|---|---|
| Maps / Routes | Map links, DEMO GPS | 3 | API keys, server-side routes, ETA, map display | Billing account |
| SMS (OTP, notes) | Not sent | 3 | Provider, sender ID, templates, delivery receipts | Provider |
| WhatsApp | OpenWA demo mode | 3 | Replace OpenWA with official WhatsApp Business API provider; template approval; opt-in | Provider; OpenWA retirement |
| Email | Demo mode / optional gateway | 3 | SMTP / API provider, SPF / DKIM, templates, bounce handling | Domain |
| OCR | Simulated | 5 | Engine selection (cloud or self-hosted), field mapping per document type, review queue | Provider |
| SAP | Not implemented | 5 | Interface specification (items, customers, prices, invoices), middleware / API, error handling, reconciliation | SAP version and access |

Common pattern: outbox → worker → provider → integration log → retries → dead letter (DGM-16 in **BM-DGM-001** (Diagram Catalogue and Visual Documentation)).
Details per integration: **BM-API-019** (Integration Specification (External Systems)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |