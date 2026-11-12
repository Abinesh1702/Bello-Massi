---
title: "Functional Requirements — Customer Application"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-CAP · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Customer Application |
| Document ID | BM-FRD-CAP |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Customer Application |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Customer Application module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Customer Application module (/customer/*).

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
| Module code | `CAP` |
| Module name | Customer Application |
| Current implementation status | **Implemented with limitations (payments not implemented)** |
| Main routes | `/customer/*` |
| Services / components | `customerAppService` |
| LocalStorage keys (prototype) | `bellomassi_customer_carts, bellomassi_orders` |


## 2. Purpose

Mobile-first customer workflow: catalog, cart, order, tracking, OTP, delivery notes and invoices.

## 3. Business objectives

Customers order and follow deliveries without calling the sales team.

Related business requirements: BR-011, BR-016, BR-026.

## 4. User roles

- Customer (portal / app)

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `customer.app`, `customer.order`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Home | `/customer/dashboard` | `customer.app` |
| Catalog | `/customer/catalog` | `customer.app` |
| Cart | `/customer/cart` | `customer.order` |
| My Orders | `/customer/orders` | `customer.app` |
| Order | `/customer/orders/:id` | `customer.app` |
| Invoices | `/customer/invoices` | `customer.app` |
| Invoice | `/customer/invoices/:id` | `customer.app` |
| Payments | `/customer/payments` | `customer.app` |
| Profile | `/customer/profile` | `customer.app` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-CAP-001 | P1 | Customers shall browse and search active products with prices and add them to a cart. | Customer (portal / app) | VERIFIED | Implemented and working (prototype) |
| FR-CAP-002 | P1 | Customers shall place orders with delivery address, requested date (tomorrow to 60 days), time slot, reference and remarks. | Customer (portal / app) | VERIFIED | Implemented and working (prototype) |
| FR-CAP-003 | P1 | Customers shall follow each order with a stage tracker and customer-friendly labels. | Customer (portal / app) | VERIFIED | Implemented and working (prototype) |
| FR-CAP-004 | P1 | Customers shall track their own delivery on a map and see the OTP when the driver arrives. | Customer (portal / app) | VERIFIED | Implemented and working (prototype) |
| FR-CAP-005 | P2 | Customers shall view and print delivery notes and invoices. | Customer (portal / app) | VERIFIED | Implemented and working (prototype) |
| FR-CAP-006 | P2 | Customers shall reorder a past order into the cart. | Customer (portal / app) | VERIFIED | Implemented and working (prototype) |
| FR-CAP-007 | P2 | Customers shall pay online and see payment history. | Customer (portal / app) | NOT IMPLEMENTED | Not implemented |
| FR-CAP-008 | P2 | The customer app is an addition beyond the SOW (which lists Order Taking App, Drivers App and Admin Panel); inclusion in the production scope needs confirmation. | Customer (portal / app) | PENDING CONFIRMATION | Pending client confirmation |

## 8. Input fields

Cart quantities · delivery address (registered / other) · city · state · pincode · requested date · preferred time · PO reference · remarks

## 9. Validation rules

- **RULE-041** — Customer requested date from tomorrow up to 60 days ahead; login must be linked to a customer. _(enforced by `customerAppService`; message: Messages.)_

## 10. Business rules

- FR-CAP-001: expected behaviour — Cart persists per customer.
- FR-CAP-002: expected behaviour — Order SUBMITTED with source customer_app; cart cleared.
- FR-CAP-003: expected behaviour — Stages from Order placed to Delivered.
- FR-CAP-004: expected behaviour — Only own order's vehicle is visible.
- FR-CAP-005: expected behaviour — Documents listed for the linked customer only.
- FR-CAP-006: expected behaviour — Orderable lines copied to cart.

## 11. Workflow

See **BM-WF-11** (WF-11 — Customer Order Workflow), **BM-WF-12** (WF-12 — Customer Tracking Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Order statuses with customer labels (Pending approval, Under review, Approved, Being prepared, Out for delivery, Delivered…). Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Placed, approved, out for delivery, arrived (OTP), delivered, delivery not completed.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-CAP-N01 | Order with past date | "The earliest delivery date is tomorrow." |
| TC-CAP-N02 | Empty cart | "Your cart is empty" empty state |
| TC-CAP-N03 | View another customer's order | Not shown / access denied |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_customer_carts, bellomassi_orders`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

None (customer sees own lists).

## 19. Audit requirements

Order timeline records source customer_app. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-CAP-001 | Cart persists per customer. | TC-CAP-001 |
| FR-CAP-002 | Order SUBMITTED with source customer_app; cart cleared. | TC-CAP-002, TC-CAP-N01, TC-CAP-N02 |
| FR-CAP-003 | Stages from Order placed to Delivered. | TC-CAP-003 |
| FR-CAP-004 | Only own order's vehicle is visible. | TC-CAP-004 |
| FR-CAP-005 | Documents listed for the linked customer only. | TC-CAP-005 |
| FR-CAP-006 | Orderable lines copied to cart. | TC-CAP-006 |
| FR-CAP-007 | Page shows balance and "No payments recorded in this prototype". | TC-CAP-007 |
| FR-CAP-008 | Client decision recorded. | TC-CAP-008 |

## 21. Current implementation status

**Implemented with limitations (payments not implemented).** Labels: VERIFIED 6, NOT IMPLEMENTED 1, PENDING CONFIRMATION 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Payments, cancellation requests, push notifications, React Native customer app, multiple users per customer account.

- FR-CAP-007 (NOT IMPLEMENTED): Customers shall pay online and see payment history.
- FR-CAP-008 (PENDING CONFIRMATION): The customer app is an addition beyond the SOW (which lists Order Taking App, Drivers App and Admin Panel); inclusion in the production scope needs confirmation.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |