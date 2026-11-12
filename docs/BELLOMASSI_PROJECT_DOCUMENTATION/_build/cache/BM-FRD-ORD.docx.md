---
title: "Functional Requirements — Salesman Order Management"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-FRD-ORD · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — Salesman Order Management |
| Document ID | BM-FRD-ORD |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | Salesman Order Management |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the Salesman Order Management module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the Salesman Order Management module (/orders/*).

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
| Module code | `ORD` |
| Module name | Salesman Order Management |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/orders/*` |
| Services / components | `orderService` |
| LocalStorage keys (prototype) | `bellomassi_orders, bellomassi_order_sequence, bellomassi_order_timeline` |


## 2. Purpose

Order capture, drafts, submission, resubmission after return, duplication and order tracking.

## 3. Business objectives

Capture every order once, correctly priced, and move it into approval with full history.

Related business requirements: BR-001, BR-004, BR-011.

## 4. User roles

- Administrator
- All signed-in users
- Customer (portal / app)
- Sales Executive (Salesman)
- Sales Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `orders.view`, `orders.create`. Default grants per role are in **BM-SEC-005** (RBAC and Access Control Matrix).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Create Order | `/orders/create` | `orders.create` |
| My Orders | `/orders/my-orders` | `orders.mine` |
| Order List | `/orders` | `orders.view` |
| Returned Orders | `/orders/returned` | `orders.corrections.view` |
| Rejected Orders | `/orders/rejected` | `orders.corrections.view` |
| Order Reports | `/orders/reports` | `orders.reports` |
| Edit Order | `/orders/:id/edit` | `orders.create` |
| Order Details | `/orders/:id` | `orders.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-ORD-001 | P1 | Salesmen shall create orders for a customer and hub with order type, priority, payment terms, order and requested delivery dates, delivery address and product lines. | Sales Executive (Salesman), Administrator | VERIFIED | Implemented and working (prototype) |
| FR-ORD-002 | P1 | Salesmen shall submit orders for approval; the system assigns an order number and notifies the Sales Manager. | Sales Executive (Salesman), Administrator | VERIFIED | Implemented and working (prototype) |
| FR-ORD-003 | P1 | The system shall validate order data: customer, salesman, hub, type, priority, payment terms, valid dates, address, 6-digit pincode, at least one line, total > 0. | Sales Executive (Salesman), Administrator | VERIFIED | Implemented and working (prototype) |
| FR-ORD-004 | P1 | The system shall show credit and stock warnings at submission without blocking it. | Sales Executive (Salesman), Administrator | VERIFIED | Implemented and working (prototype) |
| FR-ORD-005 | P1 | Salesmen shall correct and resubmit returned orders; the section matching the return reason is highlighted. | Sales Executive (Salesman) | VERIFIED | Implemented and working (prototype) |
| FR-ORD-006 | P2 | Only the creator's draft orders shall be deletable; submitted orders are kept for audit. | Sales Executive (Salesman), Administrator | VERIFIED | Implemented and working (prototype) |
| FR-ORD-007 | P2 | Users shall duplicate an existing order into a new draft. | Sales Executive (Salesman), Administrator | VERIFIED | Implemented and working (prototype) |
| FR-ORD-008 | P1 | Every order shall have a timeline of all events (created, submitted, decided, consolidated, dispatched, delivered). | All signed-in users | VERIFIED | Implemented and working (prototype) |
| FR-ORD-009 | P2 | Salesmen shall see only their own orders; other roles see orders according to their scope. | Sales Executive (Salesman) | VERIFIED | Implemented and working (prototype) |
| FR-ORD-010 | P2 | Cancelling a submitted order on customer request. | Sales Executive (Salesman), Sales Manager, Customer (portal / app) | NOT IMPLEMENTED | Not implemented |
| FR-ORD-011 | P2 | Orders shall record the source channel (call, email, WhatsApp, customer app) as described in the SOW. | Sales Executive (Salesman) | PENDING CONFIRMATION | Pending client confirmation |

## 8. Input fields

Customer · salesman · fulfilment hub · order type · priority · payment terms · order date · requested delivery date / time · delivery address, city, state, pincode · customer reference · remarks · lines (product, quantity, unit price, discount %, tax %)

## 9. Validation rules

- **RULE-006** — Requested delivery date cannot be before the order date; order date cannot be in the future. _(enforced by `orderService.validateOrder`; message: Field messages.)_
- **RULE-007** — An order needs at least one line and a total greater than zero. _(enforced by `orderService.validateOrder`; message: "Add at least one product." / "Order total must be greater than zero.")_
- **RULE-008** — Only the creator's draft orders can be deleted. _(enforced by `orderService.deleteOrder`; message: "Only draft orders can be deleted…")_
- **RULE-009** — Credit and stock shortfalls are warnings at submission. _(enforced by `orderService.submitOrder`; message: Warning flags.)_

## 10. Business rules

- FR-ORD-001: expected behaviour — Order saved as DRAFT with totals (subtotal, discount, tax, total).
- FR-ORD-002: expected behaviour — Status SUBMITTED, approval PENDING, number BM-ORD-…, notification "New order for approval".
- FR-ORD-003: expected behaviour — Errors shown per field; order not submitted.
- FR-ORD-004: expected behaviour — Warning flags stored on the order and shown to the approver.
- FR-ORD-005: expected behaviour — Status returns to SUBMITTED; timeline records the resubmission.
- FR-ORD-006: expected behaviour — "Only draft orders can be deleted…"
- FR-ORD-007: expected behaviour — New DRAFT with copied lines.
- FR-ORD-008: expected behaviour — Timeline shows each event with user and time.
- FR-ORD-009: expected behaviour — Order list filtered by scope.

## 11. Workflow

See **BM-WF-02** (WF-02 — Order-to-Delivery Workflow), **BM-WF-03** (WF-03 — Salesman Workflow) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

DRAFT → SUBMITTED → (RETURNED → SUBMITTED) → APPROVED / REJECTED → … (see WF-02). Full lists: **BM-GLO-003** (Quick Reference Card).

## 13. Approval rules

- FR-ORD-002: Salesmen shall submit orders for approval; the system assigns an order number and notifies the Sales Manager.

## 14. Notifications

Sales Manager: new / resubmitted order; salesman: approved, returned, rejected, ready for dispatch; automation ORDER_CREATED.

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-ORD-N01 | Submit without lines | "Add at least one product."; order not submitted |
| TC-ORD-N02 | Delivery date before order date | "Delivery date cannot be before the order date." |
| TC-ORD-N03 | Delete submitted order | Refused: only drafts can be deleted |
| TC-ORD-N04 | Salesman cannot see others' orders | Access denied / not listed |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See **BM-WF-18** (WF-18 — Exception Management Workflow).

## 17. Data dependencies

Reads / writes: `bellomassi_orders, bellomassi_order_sequence, bellomassi_order_timeline`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: **BM-DAT-002** (Proposed Production Database Design).

## 18. Reports

Order Reports (`/orders/reports`), Sales category in Reports Center.

## 19. Audit requirements

Order timeline (`bellomassi_order_timeline`) for every event. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-ORD-001 | Order saved as DRAFT with totals (subtotal, discount, tax, total). | TC-ORD-001, TC-LS-N02 |
| FR-ORD-002 | Status SUBMITTED, approval PENDING, number BM-ORD-…, notification "New order for approval". | TC-ORD-002 |
| FR-ORD-003 | Errors shown per field; order not submitted. | TC-ORD-003, TC-ORD-N01, TC-ORD-N02 |
| FR-ORD-004 | Warning flags stored on the order and shown to the approver. | TC-ORD-004 |
| FR-ORD-005 | Status returns to SUBMITTED; timeline records the resubmission. | TC-ORD-005 |
| FR-ORD-006 | "Only draft orders can be deleted…" | TC-ORD-006, TC-ORD-N03 |
| FR-ORD-007 | New DRAFT with copied lines. | TC-ORD-007 |
| FR-ORD-008 | Timeline shows each event with user and time. | TC-ORD-008 |
| FR-ORD-009 | Order list filtered by scope. | TC-ORD-009, TC-ORD-N04 |
| FR-ORD-010 | Not available; Sales Manager may reject with reason "Customer cancelled". PENDING CONFIRMATION of the cancellation rule. | TC-ORD-010 |
| FR-ORD-011 | Customer-app orders are tagged customer_app; office channel field to be confirmed. | TC-ORD-011 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 9, NOT IMPLEMENTED 1, PENDING CONFIRMATION 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Source channel capture, attachments (customer PO), price lists, order cancellation rule, SAP sales order creation.

- FR-ORD-010 (NOT IMPLEMENTED): Cancelling a submitted order on customer request.
- FR-ORD-011 (PENDING CONFIRMATION): Orders shall record the source channel (call, email, WhatsApp, customer app) as described in the SOW.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |