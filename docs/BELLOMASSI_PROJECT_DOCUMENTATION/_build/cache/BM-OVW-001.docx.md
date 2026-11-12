---
title: "Project Overview Document"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-OVW-001 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Project Overview Document |
| Document ID | BM-OVW-001 |
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

Give every reader — client management, business users, developers, testers and operations — a single, accurate picture of what Bellomassi is, why it is needed, who uses it, what exists today and what is required for production.

## Scope

The Bellomassi Order-to-Delivery Management Platform — the current React / LocalStorage prototype and the planned production system.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- Scope of Work presentation, October 2026
- Driver App GPS Implementation Guide
- **BM-OVW-002** (Project Introduction)
- **BM-OVW-003** (Project Vision and Objectives)
- **BM-OVW-007** (Product Description)
- **BM-OVW-014** (Product Feature Catalogue)
- **BM-OVW-015** (Project Status and Implementation Summary)
- **BM-BRD-001** (Business Requirements Document (BRD))
- **BM-SOW-001** (Scope of Work)
- **BM-ARC-001** (High-Level Design (HLD))
- **BM-RMP-001** (Prototype-to-Production Migration Roadmap (Master))

## Contents

- 1. What Bellomassi is
- 2. Why the platform is required
- 3. Who uses it
- 4. How users interact with the system
- 5. Modules
- 6. What the current prototype demonstrates — VERIFIED / PROTOTYPE
- 7. What is required for production — PROPOSED
- 8. Documentation map

## 1. What Bellomassi is

Bellomassi is an **order-to-delivery management platform** for a frozen and chilled food distributor. It replaces orders
passed along by phone, email and WhatsApp with one digital record that flows from the salesman, through Sales Manager
approval and credit control, Customer Service consolidation and zone-based dispatch, to the driver's doorstep handover,
which the customer confirms with a one-time password (OTP). A delivery note is issued immediately.

The client Scope of Work (October 2026) defines three deliverables — the **Order Taking App**, the **Drivers App** and the
**Admin Panel** — on one shared platform with one order record, workflow and approvals, live notifications, an OTP
service, maps and routing, and an audit trail. Integration with **SAP** is planned as a second stage.

## 2. Why the platform is required

| Today (SOW slide 2) | With Bellomassi |
|---|---|
| Orders arrive by call, email and WhatsApp and are re-typed | Captured once in a structured order |
| Approvals and credit checks are chased manually | Every order approved in the app with a credit check |
| Planning is manual; drivers learn their stops late | Zone-based planning; drivers see tomorrow's list today |
| Handover disputes ("what was delivered, when?") | OTP-confirmed, time-stamped handover with delivery note |
| No single status per order | One live status per order for every role |

## 3. Who uses it

| User group | Application | Main job |
|---|---|---|
| Salesman | Order Taking App | Capture and submit orders, correct returned orders |
| Sales Manager | Order Taking App | Approve value, quantity and credit |
| Customer Service | Order Taking App | Verify and consolidate approved orders, release to dispatch |
| Dispatcher | Order Taking App | Plan dispatches by zone, assign drivers and vehicles |
| Driver | Drivers App | Deliver in sequence, confirm handover with the customer's OTP |
| Finance | Notifications (SOW) / Invoices (prototype) | Credit exceptions; invoicing scope PENDING CONFIRMATION |
| Administrator / management | Admin Panel | Users, master data, rules, monitoring, reports |
| Customer | OTP and delivery note (SOW); customer app (prototype, PENDING CONFIRMATION) | Confirm handover; optionally order and track |

The prototype additionally defines Super Admin, Warehouse Manager, Inventory Executive, QA Manager and Supplier roles
(13 roles in total) — their production scope is PENDING CONFIRMATION.

## 4. How users interact with the system

- **Office users** work in a responsive web application with a role-specific sidebar and dashboard.
- **Drivers** use a mobile-first app (prototype: web at `/driver`; production: React Native app — PROPOSED).
- **Customers** receive the OTP and the delivery note; in the prototype they can also use a mobile-first customer app at `/customer`.
- Every hand-off is announced by in-app notifications; customer messages need an SMS or WhatsApp provider (PROPOSED).

## 5. Modules

35 functional modules were identified in the source code (full list: **BM-OVW-014** (Product Feature Catalogue)). Core SOW modules: authentication
and roles, customer / product / zone master data, order capture, approval and credit, consolidation, dispatch and
assignment, driver app, OTP and proof of delivery, delivery notes, notifications, dashboards and reports. Prototype
extensions: inventory, scrap, warehouse and QA, VMS, documents and OCR, invoices, email, WhatsApp (OpenWA), automated
notifications, call history, customer app, AI assistant, forecasting and replenishment.

## 6. What the current prototype demonstrates — VERIFIED / PROTOTYPE

| Aspect | Fact (verified in source code, 12 Nov 2026) |
|---|---|
| Technology | React 19, Vite 8, Tailwind CSS 4, React Router 7, Recharts 3 — 391 source files, ≈46,500 lines |
| Data | Browser **LocalStorage** only (74 keys, ≈1 MB of seeded demo data, data version 8). No backend, no database. |
| Roles and access | 13 roles, 110 permission keys, data scopes, 197 screens defined in one navigation configuration |
| Workflows | Complete order-to-delivery flow with approval, consolidation, dispatch confirmation (stock deduction), driver stop flow, OTP, proof of delivery, delivery notes, exception review |
| Simulations | DEMO GPS, OTP shown in app (no SMS), email / WhatsApp demo sending, mock OCR, rule-based AI, manual call log |
| Not implemented | Payments, credit notes, refunds, cold-chain sensors, batch / expiry stock tracking, order cancellation after submission, SAP integration |

The prototype is suitable for **demonstration, requirement validation and UAT of business rules**. It is **not
production software**: data lives in one browser, security is simulated and integrations are not live.

## 7. What is required for production — PROPOSED

1. Django REST Framework backend with PostgreSQL (**BM-ARC-001** (High-Level Design (HLD)), **BM-DAT-002** (Proposed Production Database Design)).
2. Server-side authentication and RBAC enforcing the same 110 permission keys (**BM-SEC-003** (Authentication, Password, MFA and Session Management Design)).
3. React Native driver app with background GPS; WebSocket tracking (**BM-RMP-003** (React Native Driver App and Customer App Roadmap)).
4. SMS / WhatsApp provider for OTP and delivery notes; email provider; Google Maps / Routes API (**BM-API-019** (Integration Specification (External Systems))).
5. Cloud or on-premises hosting with CI/CD, monitoring, backups and disaster recovery (**BM-INF-003** (Infrastructure, Network Architecture and Server Specification)).
6. SAP integration in stage 2 (**BM-RMP-004** (Integrations Roadmap — SAP, Email, WhatsApp (OpenWA), OCR, Maps and SMS)).
7. Client decisions on the open scope items (**BM-HND-012** (Pending Requirements Document)).

## 8. Documentation map

This document is part of a 25-folder documentation repository. Start with **BM-IDX-002** (Bellomassi Documentation Master) for the structure and
**BM-IDX-001** (Bellomassi Documentation Index) for the full index.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |