---
title: "Privacy Policy (Draft)"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-SEC-007 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Privacy Policy (Draft) |
| Document ID | BM-SEC-007 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Security and Compliance |
| Related module(s) | All modules |
| Document owner | Data Protection Officer (client) — PENDING CONFIRMATION |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Provide a draft privacy notice for customers, drivers and staff; requires legal review before publication.

## Scope

DRAFT — not legal advice; jurisdiction PENDING CONFIRMATION.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SEC-006** (Data Protection, Encryption and Backup Security Policy)
- **BM-DAT-005** (Data Retention Policy (Draft))

## Draft privacy notice

**Who we are.** Bellomassi [legal entity name — to be completed] operates the Bellomassi order and delivery platform.

**Data we collect.**
- Customers: business name, contact person, phone, email, delivery addresses, tax registration, orders, delivery
  confirmations (OTP use, receiver name, signature, photo), invoices.
- Drivers: name, phone, employee number, licence details and documents, location **only while a delivery is active**,
  delivery records.
- Staff users: name, contact details, role, activity and audit records.

**Why.** To take, approve, deliver and document orders; to confirm handover; to manage credit; to keep vehicles and
drivers compliant; to meet legal and accounting obligations.

**Sharing.** Service providers acting for us (hosting, maps, SMS / WhatsApp, email, OCR) under contracts; SAP / ERP
systems of Bellomassi; authorities where legally required. No sale of personal data.

**Retention.** As set out in the retention policy (summary: transactions 7 years, GPS points 90 days, POD 2 years).

**Rights.** Access, correction, deletion where applicable, objection — contact [privacy contact — to be completed].

**Security.** Encryption, access control, audit logging.

**Location tracking.** Drivers' phone location is shared only between "Start delivery" and completion of that delivery;
the app shows when tracking is active; customers see only the vehicle delivering their own order.

_Legal review required. Not approved._

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |