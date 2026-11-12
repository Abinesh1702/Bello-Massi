---
title: "Integration Specification (External Systems)"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-API-019 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Integration Specification (External Systems) |
| Document ID | BM-API-019 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | API and Integration |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify each external integration — purpose, direction, data, protocol, error handling — and its current status.

## Scope

Maps and routing, SMS / WhatsApp, email, OCR, push notifications, SAP, AI providers.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- docs/INTEGRATION_GATEWAY.md
- Driver App GPS Implementation Guide §6, §10, §12
- **BM-API-001** (API Specification (Overview and Conventions))
- **BM-ARC-001** (High-Level Design (HLD))
- **BM-SEC-009** (File Upload, OCR, OTP, Email and OpenWA Security)
- **BM-RMP-004** (Integrations Roadmap — SAP, Email, WhatsApp (OpenWA), OCR, Maps and SMS)

## 1. Integration overview

| Integration | Purpose | Direction | Prototype | Production proposal | Status |
|---|---|---|---|---|---|
| Google Maps Platform (JS, Geocoding) | Maps, customer geocoding | Outbound | Static demo map | Maps JS in web / RN apps; geocode customer locations | PROPOSED |
| Google Routes API | Route order, ETA with traffic, VIP time warnings | Outbound | Sequence by priority + pincode | Optimise waypoints per dispatch; ETA per stop | PROPOSED |
| SMS provider | OTP, delivery note link | Outbound + delivery webhook | OTP shown in app | Transactional SMS with sender ID | PROPOSED / PENDING CONFIRMATION |
| WhatsApp | OTP, delivery note, notifications | Outbound + webhook | Mock OpenWA session | WhatsApp Business Platform (official) recommended; OpenWA only if client accepts the risk | PENDING CONFIRMATION |
| Email | Notifications, invoices, documents | Outbound (+ inbound IMAP optional) | Demo mode (SENT_DEMO) | Transactional provider or SMTP relay with SPF / DKIM / DMARC | PROPOSED |
| OCR | Extract fields from licences, RC, insurance | Outbound | MOCK provider | Server OCR (Tesseract / cloud OCR) via worker | PROPOSED |
| Push (FCM / APNs) | Driver and customer push | Outbound | None | Firebase Cloud Messaging / APNs | PROPOSED |
| SAP | Items, stock, customers, credit, sales orders, deliveries | Bidirectional | None | Stage 2 — interface to be confirmed (OData, RFC/BAPI or IDoc) | PROPOSED |
| AI providers | Assistant answers | Outbound | DEMO engine | Optional; only with data-protection approval | NOT VERIFIED |

## 2. Common integration design — PROPOSED

- **Outbox pattern**: business transaction writes an outbox row; a Celery worker sends it; at-least-once with
  idempotent providers keys.
- **Retries**: exponential back-off (1, 5, 15, 60 min), then dead-letter with alert.
- **Logging**: request / response metadata (no secrets, masked phone numbers) in `messages` / integration log.
- **Secrets**: provider keys in a secrets manager; never in the browser.
- **Sandbox**: every adapter has a mock implementation (as in the prototype) used in tests and demo environments.

## 3. Message content (customer)

| Event | Channel | Template (example) |
|---|---|---|
| Driver arrives | SMS / WhatsApp | "Bellomassi: your delivery OTP for order {order_number} is {otp}. Valid {minutes} min. Share it only with the driver." |
| Delivery confirmed | SMS / WhatsApp / email | "Delivered: {order_number}. Delivery note {note_number}: {short_link}" |
| Delivery not completed | SMS / WhatsApp | "We could not deliver {order_number} ({reason}). Our team will contact you to reschedule." |

## 4. SAP integration (stage 2) — PROPOSED, scope to confirm

| Object | Direction | Frequency | Key mapping |
|---|---|---|---|
| Material (item) master | SAP → Bellomassi | Daily + on change | `products.sap_material_no` |
| Customer master and credit | SAP → Bellomassi | Daily + on change | `customers.sap_customer_no` |
| Stock per plant / storage location | SAP → Bellomassi | Hourly | `hubs` ↔ plant mapping |
| Approved sales order | Bellomassi → SAP | Real time | `orders.order_number` ↔ SAP order |
| Delivery / goods issue | Bellomassi → SAP | On dispatch confirmation | `dispatches` ↔ outbound delivery |
| Proof of delivery | Bellomassi → SAP | On completion | Delivery note number |

## 5. Existing gateway contract (prototype) — NOT VERIFIED

The prototype defines HTTP endpoints for a gateway (`/email/send`, `/email/imap/messages`, `/openwa/sessions/:name/…`,
`/ocr/process`, `/ai/chat`, `/ml/forecast`). They are documented in `docs/INTEGRATION_GATEWAY.md` and can be reused as
the internal interface of the integration workers; they have never run against a live gateway.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |