---
title: "Functional Requirements — Delivery OTP"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-OTP · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Delivery OTP |
| Document ID | BM-FRD-OTP |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Delivery OTP |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Delivery OTP module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Delivery OTP module (/driver/deliveries/:id/confirm).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SYS-002** (Software Requirements Specification (SRS))
- **BM-SYS-003** (Functional Requirements Document (Consolidated))
- **BM-SYS-008** (Requirement Traceability Matrix)
- **BM-QA-011** (Functional Test Cases)

## Contents

- 1. Module overview
- 2. Purpose
- 3. Business objectives
- 4. User roles
- 5. Access permissions
- 6. Screens
- 7. Functional requirements
- 8. Input fields
- 9. Validation rules
- 10. Business rules
- 11. Workflow
- 12. Status lifecycle
- 13. Approval rules
- 14. Notifications
- 15. Error scenarios
- 16. Exception handling
- 17. Data dependencies
- 18. Reports
- 19. Audit requirements
- 20. Acceptance criteria
- 21. Current implementation status
- 22. Future enhancement requirements

## 1. Module overview

| Item | Value |
|---|---|
| Module code | `OTP` |
| Module name | Delivery OTP |
| Current implementation status | **Simulated (no SMS / WhatsApp delivery)** |
| Main routes | `/driver/deliveries/:id/confirm` |
| Services / components | `otpService` |
| LocalStorage keys (prototype) | `bellomassi_delivery_otps` |


## 2. Purpose

6-digit handover code issued on arrival, verified before completion, attempt limits and expiry.

## 3. Business objectives

Each handover is confirmed by the customer, not only the driver.

Related business requirements: BR-009, BR-012.

## 4. User roles

- Administrator
- Customer (portal / app)
- Dispatcher
- Driver

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `driver.app`, `dispatch.otp.inspect`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Confirm Delivery | `/driver/deliveries/:id/confirm` | `driver.app` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-OTP-001 | P1 | A 6-digit OTP shall be issued on arrival, valid 10 minutes by default (1–60), shown to the customer. | Driver, Customer (portal / app) | PROTOTYPE | Simulated in prototype |
| FR-OTP-002 | P1 | Completion shall require the correct, unexpired OTP; 5 wrong attempts lock the OTP. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-OTP-003 | P2 | Drivers shall generate a new OTP when it has expired or is locked; the previous one is invalidated. | Driver | VERIFIED | Implemented and working (prototype) |
| FR-OTP-004 | P2 | Dispatchers shall be able to inspect a delivery's OTP status (dispatch.otp.inspect). | Dispatcher, Administrator | VERIFIED | Implemented and working (prototype) |
| FR-OTP-005 | P1 | Production OTPs shall be sent to the customer by SMS or WhatsApp and stored hashed. | Customer (portal / app) | PROPOSED | Planned (production) |

## 8. Input fields

6-digit code entry

## 9. Validation rules

- **RULE-027** — OTP is 6 digits, expires after 10 minutes (1–60), locks after 5 wrong attempts; a new OTP invalidates the old one. _(enforced by `otpService`; message: "This OTP has expired…", "Too many incorrect attempts…")_

## 10. Business rules

- FR-OTP-002: expected behaviour — Wrong OTP blocks completion; LOCKED after 5 attempts.
- FR-OTP-003: expected behaviour — New OTP ACTIVE; old INVALIDATED.
- FR-OTP-004: expected behaviour — OTP state visible to the Dispatcher.

## 11. Workflow

See **BM-WF-10** (WF-10 — Driver Delivery Workflow), **BM-WF-12** (WF-12 — Customer Tracking Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

ACTIVE → VERIFIED / EXPIRED / LOCKED / INVALIDATED. Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Customer sees OTP in app (prototype); SMS / WhatsApp in production.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-OTP-N01 | Wrong OTP | Error; attempt counted; delivery not completed |
| TC-OTP-N02 | Five wrong OTPs | "Too many incorrect attempts. Generate a new OTP." |
| TC-OTP-N03 | Expired OTP | "This OTP has expired. Generate a new one." |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_delivery_otps`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Delivery reports show OTP-verified deliveries.

## 19. Audit requirements

OTP record with attempts and timestamps. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-OTP-001 | OTP visible in the customer app; no SMS in the prototype. | TC-OTP-001 |
| FR-OTP-002 | Wrong OTP blocks completion; LOCKED after 5 attempts. | TC-OTP-002, TC-OTP-N01, TC-OTP-N02 |
| FR-OTP-003 | New OTP ACTIVE; old INVALIDATED. | TC-OTP-003, TC-OTP-N03 |
| FR-OTP-004 | OTP state visible to the Dispatcher. | TC-OTP-004 |
| FR-OTP-005 | Customer receives the code on their phone. | TC-OTP-005 |

## 21. Current implementation status

**Simulated (no SMS / WhatsApp delivery).** Labels: PROTOTYPE 1, VERIFIED 3, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

SMS / WhatsApp delivery, hashed storage, rate limiting, fallback verification with photo + supervisor approval.

- FR-OTP-005 (PROPOSED): Production OTPs shall be sent to the customer by SMS or WhatsApp and stored hashed.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |