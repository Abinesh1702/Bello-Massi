# Quick Reference Card

## Document control

| Field | Value |
|---|---|
| Document title | Quick Reference Card |
| Document ID | BM-GLO-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Glossary and Reference |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

One-page reference of statuses, number formats, main routes and key rules.

## Scope

Prototype values (VERIFIED from src/config and src/utils/constants.js).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](BM-GLO-001_Project_Glossary.md).

## References

- [BM-GLO-001 — Project Glossary](BM-GLO-001_Project_Glossary.md)
- [BM-WF-17 — WF-17 — Communication Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-17_Communication_Workflow.md)
- [BM-ADM-002 — Application Configuration Reference](../16_ADMINISTRATION_AND_CONFIGURATION/BM-ADM-002_Application_Configuration_Reference.md)

## 1. Statuses

| Object | Statuses (prototype) |
|---|---|
| Order (13) | DRAFT, SUBMITTED, RETURNED, REJECTED, APPROVED, CONSOLIDATED, READY_FOR_DISPATCH, DISPATCHED, OUT_FOR_DELIVERY, PARTIALLY_DELIVERED, DELIVERED, DELIVERY_FAILED, RETURNED_TO_HUB |
| Dispatch (8) | DRAFT, PLANNED, ASSIGNED, CONFIRMED, IN_TRANSIT, PARTIALLY_DELIVERED, COMPLETED, CANCELLED |
| Delivery (7) | DISPATCHED, OUT_FOR_DELIVERY, DELIVERED, PARTIALLY_DELIVERED, FAILED, RETURNED, CANCELLED |
| OTP (5) | ACTIVE, VERIFIED, EXPIRED, INVALIDATED, LOCKED |

The SOW lists 8 order statuses — mapping PENDING CONFIRMATION ([BM-WF-17 — WF-17 — Communication Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-17_Communication_Workflow.md)).

## 2. Number formats

| Document | Format | Example |
|---|---|---|
| Order | BM-ORD-YYYY-NNNNN | BM-ORD-2026-00034 |
| Dispatch | BM-DSP-YYYY-NNNNN | BM-DSP-2026-00016 |
| Delivery note | BM-DN-YYYY-NNNNN | BM-DN-2026-00012 |
| Replenishment / forecast / employee | RPL-, FC-, EMP- | — |

## 3. Key rules

| Rule | Value |
|---|---|
| Sign-in lockout | 5 failed attempts → 15 minutes |
| Session timeout | 60 minutes |
| OTP | 6 digits, 10 minutes, 5 attempts |
| Stock deduction | At dispatch confirmation |
| Driver | Stops in Dispatcher's sequence; one active stop; no future-dated start |
| Customer order date | Tomorrow to 60 days ahead |
| Photo / signature | ≤ 350 KB each |

## 4. Main entry routes

| App | Route |
|---|---|
| Office | `/login` → `/dashboard` |
| Driver | `/driver/login` → `/driver/dashboard` |
| Customer | `/customer/login` → `/customer/dashboard` |
| Approval | `/orders/approval` |
| Consolidation | `/orders/consolidation` |
| Dispatch | `/dispatch/ready-orders`, `/dispatch/planning`, `/dispatch/create` |
| Tracking | `/dispatch/live-tracking` |
| Reports | `/reports/center` |
| Admin | `/admin/users`, `/admin/roles`, `/admin/settings` |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |