---
title: "Scope of Work"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-SOW-001 · Version 1.1 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Scope of Work |
| Document ID | BM-SOW-001 |
| Version | 1.1 |
| Status | Draft — for client review |
| Category | Business Requirements |
| Related module(s) | All modules |
| Document owner | Project Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Define the scope of the production project — what will be built, by whom, in which phases, what is excluded — based on the October 2026 Scope of Work presentation and the prototype.

## Scope

Production delivery of the Bellomassi platform (backend, web, mobile, integrations, deployment). The existing prototype is an input, not the deliverable.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- Bellomassi Scope of Work presentation, October 2026
- Driver App GPS Implementation Guide
- **BM-BRD-001** (Business Requirements Document (BRD))
- **BM-PLN-001** (Scope and Phase Plan)
- **BM-PLN-002** (Phase-wise Scope Matrix)
- **BM-DOC-003** (Gap Analysis — Scope of Work, Prototype and Documentation)
- **BM-RSK-004** (Change Impact Analysis — Prototype Extensions and Gaps)

## Contents

- 1. Baseline — VERIFIED from the SOW presentation (October 2026)
- 2. In-scope features — production
- 3. Scope to be confirmed — prototype extensions
- 4. Out-of-scope features
- 5. Phase-wise scope — PROPOSED
- 6. Client responsibilities
- 7. Development (delivery team) responsibilities
- 8. Third-party dependencies
- 9. Deliverables
- 10. Exclusions and assumptions
- 11. Scope acceptance

## 1. Baseline — VERIFIED from the SOW presentation (October 2026)

| SOW item | Content |
|---|---|
| Deliverables | Order Taking App (mobile + web), Drivers App (iOS + Android), Admin Panel (web) |
| Roles | Salesman, Sales Manager, Customer Service, Dispatcher, Driver, Finance (notifications), Administrator |
| Lifecycle | Capture → approve → consolidate → dispatch → plan received → route guided → OTP handover → delivery note |
| Shared platform | One order record, workflow and approvals, live notifications, OTP service, maps and routing, audit trail |
| Notifications | In-app for staff; SMS or WhatsApp to the customer for OTP and delivery note |
| Status model | Draft, Pending approval, Approved, With Customer Service, Ready for dispatch, Planned in zone, Out for delivery, Delivered; Returned for review, Rejected; "Delivery problem" proposed |
| Second stage | SAP integration replacing manual item updates |
| Boundary | After OTP confirmation and delivery note, the app's job ends; invoicing stays outside |

## 2. In-scope features — production

| # | Feature | SOW ref | Prototype status |
|---|---|---|---|
| S-01 | Users, roles and permissions | slide 15 | VERIFIED |
| S-02 | Customers and locations, credit limits | slide 15 | VERIFIED (locations single address) |
| S-03 | Item catalogue (manual now, SAP later) | slides 4, 15 | VERIFIED |
| S-04 | Zones and drivers | slide 15 | VERIFIED |
| S-05 | Order capture, submission, tracking, amend and resubmit | slide 7 | VERIFIED |
| S-06 | Approval inbox: accept, review (return), reject with reason; credit decision | slide 8 | VERIFIED; approved figures G-01 not built |
| S-07 | Finance notified on approval, flagged on credit exception | slides 8, 16 | NOT IMPLEMENTED (G-02) |
| S-08 | Consolidation per salesman and release | slide 9 | VERIFIED |
| S-09 | Zone planning by drag and drop; assign to drivers; publish plan | slide 10 | Partly (G-03) |
| S-10 | Next-day plan for drivers | slide 12 | VERIFIED |
| S-11 | Suggested fastest route with live traffic; navigation | slide 12 | PROPOSED (G-04, G-05) |
| S-12 | OTP sent to the customer; driver confirms | slide 13 | Simulated (G-06) |
| S-13 | Delivery note sent to the customer | slide 13 | Generated, not sent (G-07) |
| S-14 | Live order monitor | slide 15 | Partly (G-09) |
| S-15 | Approval / credit / notification rules | slide 15 | Partly (G-11) |
| S-16 | Reports and export | slide 15 | VERIFIED |
| S-17 | Audit trail | slide 4 | VERIFIED |
| S-18 | Live GPS tracking (admin all, customer own) | GPS guide | Simulated (G-14) |
| S-19 | SAP integration — stage 2 | slides 4, 15 | PROPOSED |

## 3. Scope to be confirmed — prototype extensions

X-01 customer app · X-02 invoicing · X-03 inventory · X-04 scrap · X-05 VMS · X-06 documents / OCR · X-07 email and
WhatsApp · X-08 call history · X-09 118-report Reports Center · X-10 AI and forecasting · X-11 extra roles. Each is
**PENDING CONFIRMATION**; recommendation and impact in **BM-RSK-004** (Change Impact Analysis — Prototype Extensions and Gaps).

## 4. Out-of-scope features

Invoicing / finance documents (SOW slide 13) unless X-02 is approved · payments and receipts · credit notes, refunds ·
supplier invoicing · fuel and maintenance costing · temperature sensor hardware · dedicated vehicle GPS hardware ·
driver self-registration · customer payments online.

## 5. Phase-wise scope — PROPOSED

| Phase | Content | Status |
|---|---|---|
| Phase 1 — Prototype | React / LocalStorage prototype of all workflows | **Complete** (not production) |
| Phase 2 — Backend | Django REST API, PostgreSQL, authentication and RBAC, all SOW workflows server-side, web app integration | Not started |
| Phase 3 — Integrations and mobile | React Native Drivers App with GPS, Google Maps / Routes, SMS / WhatsApp, email, WebSockets | Not started |
| Phase 4 — Production deployment | Infrastructure, security hardening, data migration, UAT, training, go-live, hypercare | Not started |
| Phase 5 — Enhancements | SAP integration (stage 2), confirmed extensions, analytics | Not started |

Detailed plan: **BM-PLN-001** (Scope and Phase Plan) and **BM-PM-001** (Project Plan).

## 6. Client responsibilities

- Confirm scope decisions and business rules in time for each phase.
- Provide master data (customers with locations and credit, items, zones, drivers, vehicles, users).
- Provide and pay for third-party accounts (maps, SMS / WhatsApp, email, hosting) or approve their procurement.
- Provide SAP interface specifications and SAP team availability (stage 2).
- Provide UAT users, test data and timely sign-off; organise training attendance.
- Provide drivers with compatible smartphones and data plans.

## 7. Development (delivery team) responsibilities

- Design, build, test and document the backend, web and mobile applications.
- Configure environments, CI/CD, monitoring and backups.
- Integrate the agreed providers; support data migration.
- Support UAT, train key users, provide hypercare after go-live.

## 8. Third-party dependencies

| Dependency | Use | Status |
|---|---|---|
| Google Maps Platform, Routes API | Maps, route, ETA | PENDING CONFIRMATION (account) |
| SMS provider or WhatsApp Business provider | OTP, delivery note | PENDING CONFIRMATION |
| OpenWA (unofficial WhatsApp client) | Prototype integration design | Policy risk — not recommended for production without client acceptance |
| Email provider (SMTP) | Notifications, documents | PENDING CONFIRMATION |
| Cloud provider or on-premises servers | Hosting | PENDING CONFIRMATION |
| SAP | Items, stock, customers, credit (stage 2) | PENDING CONFIRMATION |
| Apple / Google developer accounts | Mobile app distribution | PENDING CONFIRMATION |

## 9. Deliverables

Production source code (backend, web, mobile) · deployed environments (test, staging, production) · documentation
package (this repository, maintained) · test evidence and UAT records · training material · handover documents
(**BM-HND-002** (Project Deliverables Checklist (Handover))).

## 10. Exclusions and assumptions

Exclusions are section 4. Assumptions: **BM-SYS-006** (Assumptions and Dependencies). Estimates of cost and effort are in **BM-PM-001** (Project Plan) and
**BM-INF-004** (Infrastructure Cost Estimation (ESTIMATE)) and are **estimates only**.

## 11. Scope acceptance

Not accepted. Signature fields intentionally blank.

| Role | Name | Signature | Date |
|---|---|---|---|
| Client Project Sponsor | | | |
| Client Project Owner | | | |
| Delivery Project Manager | | | |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-10 | Client presentation | Scope of Work presentation (18 slides): Order Taking App, Drivers App, Admin Panel. |
| 1.1 | 2026-11-12 | Documentation team | Converted into a document; prototype deltas, phase-wise scope, responsibilities, deliverables and exclusions added. Not approved. |