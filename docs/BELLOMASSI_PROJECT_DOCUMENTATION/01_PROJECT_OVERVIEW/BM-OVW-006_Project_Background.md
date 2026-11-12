# Project Background

## Document control

| Field | Value |
|---|---|
| Document title | Project Background |
| Document ID | BM-OVW-006 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Project Overview |
| Related module(s) | All modules |
| Document owner | Project Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Record how the project and the prototype evolved.

## Scope

From the Scope of Work (October 2026) to the current prototype (12 November 2026).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-OVW-002 — Project Introduction](BM-OVW-002_Project_Introduction.md)
- [BM-DOC-001 — Existing Documentation Review and Inventory](../23_DOCUMENT_CONTROL/BM-DOC-001_Existing_Documentation_Review.md)

## 1. History — VERIFIED from project records

| Step | Content | Result |
|---|---|---|
| Scope of Work (Oct 2026) | Order Taking App, Drivers App, Admin Panel; SAP in stage 2 | Client-facing baseline (not signed) |
| Driver App GPS guide | React Native app, mobile GPS, Django backend, Google Maps / Routes | Technical direction |
| Prototype phase 1 | Foundation, authentication, dashboards; then RBAC and administration | Implemented |
| Phase 2 | Customers, products, hubs, inventory | Implemented |
| Phase 3 | Orders, approval, consolidation | Implemented |
| Phase 4 | Dispatch, driver assignment, delivery, OTP, delivery notes | Implemented |
| Phase 5 | VMS, documents and OCR, invoices, email, WhatsApp | Implemented (integrations simulated) |
| Phase 6 | AI assistant, Jarvis, forecasting, predictive inventory | Implemented (simulated provider) |
| Finalisation | Scrap, calls, reports center, driver and customer apps | Implemented (data version 8) |
| Premium UI | Design system, universal dashboard period filter | Implemented |
| Workflow documentation | 20-chapter workflow documentation | Delivered 12 Nov 2026 |
| A–Z documentation | This repository | In progress — draft |

## 2. Important context

- Prototype phases added modules beyond the SOW; none has a recorded client approval ([BM-DOC-001 — Existing Documentation Review and Inventory](../23_DOCUMENT_CONTROL/BM-DOC-001_Existing_Documentation_Review.md)).
- The prototype company profile is Dubai / AED while master data uses Indian address and tax formats — operating country
  rules are PENDING CONFIRMATION.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |