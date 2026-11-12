---
title: "Business Rules Catalogue"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-SYS-007 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Business Rules Catalogue |
| Document ID | BM-SYS-007 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | System Requirements |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Catalogue every business rule enforced by the system with its ID, enforcing component and user message.

## Scope

44 rules across authentication, orders, approval, consolidation, dispatch, assignment, delivery, OTP, inventory, scrap, invoices, documents, customer app, automation, calls and replenishment.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SYS-003** (Functional Requirements Document (Consolidated))
- **BM-SYS-002** (Software Requirements Specification (SRS))

## Contents

- Overview
- Authentication and Login (AUTH)
- User Management (USR)
- Salesman Order Management (ORD)
- Sales Manager Approval (APR)
- Order Consolidation (Customer Service) (CON)
- Dispatch Management (DSP)
- Driver and Vehicle Assignment (DRA)
- Vehicle Management System (VMS)
- Driver Application (DRV)
- Delivery OTP (OTP)
- Proof of Delivery (POD)
- Delivery Exception Review (EXC)
- Inventory Management (INV)
- Scrap Management (SCR)
- Invoice Customisation and Invoicing (INVC)
- Document Management and OCR (DOC)
- Customer Application (CAP)
- Automated Notifications (AUTO)
- Call History (CALL)
- AI Assistant, Forecasting and Replenishment (AI)

## Overview

Each rule is enforced in the named service function of the prototype (VERIFIED in source code). The production backend must enforce the same rules server-side.

## Authentication and Login (AUTH)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-001 | Account locks after 5 failed sign-ins for 15 minutes (configurable 3–20 / 1–1440). | `authService.login` | "Too many failed attempts…" |
| RULE-002 | Inactive accounts cannot sign in. | `authService.login` | "This account is inactive…" |
| RULE-003 | Session ends after 60 minutes idle (configurable 5–1440). | `SessionWatcher` | Signed out. |
| RULE-004 | Password minimum length 8 with mixed characters (configurable). | `authService.passwordPolicy` | Policy message. |

## User Management (USR)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-005 | Users cannot deactivate themselves; only Super Admin changes Super Admin; drivers need a home hub. | `userService` | Specific messages. |

## Salesman Order Management (ORD)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-006 | Requested delivery date cannot be before the order date; order date cannot be in the future. | `orderService.validateOrder` | Field messages. |
| RULE-007 | An order needs at least one line and a total greater than zero. | `orderService.validateOrder` | "Add at least one product." / "Order total must be greater than zero." |
| RULE-008 | Only the creator's draft orders can be deleted. | `orderService.deleteOrder` | "Only draft orders can be deleted…" |
| RULE-009 | Credit and stock shortfalls are warnings at submission. | `orderService.submitOrder` | Warning flags. |

## Sales Manager Approval (APR)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-010 | Approval requires customer active, hub active, products active and total valid. | `approvalService.getApprovalChecks` | "Cannot approve: …" |
| RULE-011 | Credit over limit blocks approval only when "Block when credit exceeded" is on. | `approvalService` | Warning or block. |
| RULE-012 | Warnings must be acknowledged before approval. | `approvalService.approveOrder` | "Confirm that you have reviewed the credit and stock warnings." |
| RULE-013 | Approval remarks are required when the setting requires them. | `approvalService.approveOrder` | "Approval remarks are required." |
| RULE-014 | Return and rejection need a reason from the list and remarks (minimum 5 characters by default). | `approvalService` | Validation messages. |
| RULE-015 | Orders are decided once; drafts cannot be decided. | `approvalService` | "…has already been approved. No change was made." |

## Order Consolidation (Customer Service) (CON)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-016 | Only approved orders can be consolidated; all five checks must be confirmed. | `consolidationService` | "Complete the verification checklist first." |
| RULE-017 | Only consolidated orders can be marked ready for dispatch. | `consolidationService.markReadyForDispatch` | Message. |

## Dispatch Management (DSP)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-018 | Only READY_FOR_DISPATCH orders with a complete address and not on another active dispatch can be dispatched. | `dispatchService.orderIneligibility` | Message per order. |
| RULE-019 | A dispatch can be edited only while DRAFT, PLANNED or ASSIGNED. | `dispatchService.updateDispatch` | "…can no longer be edited." |
| RULE-020 | Confirmation requires an assigned driver and vehicle, a review tick and enough hub stock per line. | `dispatchService.confirmDispatch` | "…needs N, only M available at the hub." |
| RULE-021 | Stock is deducted once at confirmation and reversed once on cancellation. | `utils/dispatchStock` | stockDeducted / stockReversed flags. |
| RULE-022 | A dispatch cannot be cancelled after any stop has started; cancel needs a reason and remarks. | `dispatchService.cancelDispatch` | Message. |
| RULE-030 | Dispatch closes COMPLETED when all stops delivered, otherwise PARTIALLY_DELIVERED (Closed with exceptions). | `deliveryService` | Status. |

## Driver and Vehicle Assignment (DRA)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-023 | Driver must be active, free, online, from the dispatch hub, with a valid licence and required documents. | `driverAssignmentIssues` | Issue list. |
| RULE-024 | Vehicle must be active, not in maintenance, free, from the hub, within capacity and compliant. | `vehicleAssignmentIssues` | Issue list. |

## Vehicle Management System (VMS)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-025 | An expired required document always blocks assignment; warning and missing blocks are optional. | `complianceService` | Block message. |

## Driver Application (DRV)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-026 | A stop can start only if the dispatch is CONFIRMED / IN_TRANSIT, the date has arrived, it is next in sequence and no other stop is out. | `deliveryService.startDelivery` | Blocker text. |
| RULE-029 | Everything delivered → DELIVERED; any shortfall → PARTIALLY_DELIVERED. | `deliveryService.confirmDelivery` | Status. |

## Delivery OTP (OTP)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-027 | OTP is 6 digits, expires after 10 minutes (1–60), locks after 5 wrong attempts; a new OTP invalidates the old one. | `otpService` | "This OTP has expired…", "Too many incorrect attempts…" |

## Proof of Delivery (POD)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-028 | Delivered quantity ≤ dispatched; receiver name required; photo / signature ≤ 350 KB; remarks ≤ 300 characters. | `deliveryService.validatePod` | Field messages. |

## Delivery Exception Review (EXC)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-031 | Only failed / partial deliveries are reviewed; remarks required; stock returned once; re-queue only for failed + returned. | `deliveryService.reviewDelivery` | Messages. |

## Inventory Management (INV)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-032 | Stock cannot be removed beyond available unless the product allows negative stock. | `inventoryService.validateAdjustment` | "Cannot remove more than…" |
| RULE-033 | Transfer hubs must differ; the source must hold the quantity at completion. | `inventoryService.validateTransfer` | "Only N available at…" |
| RULE-034 | Inactive hubs cannot receive stock. | `inventoryService.validateReceipt` | "…is inactive and cannot receive stock." |

## Scrap Management (SCR)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-035 | Scrap quantity ≤ eligible stock (on hand in source minus other open requests); no duplicate open request. | `scrapService.validateScrap` | Message. |
| RULE-036 | Photo proof required for Damaged, Packaging Damage, Contamination; batch required if batch-controlled. | `scrapService.validateScrap` | Message. |
| RULE-037 | Requesters cannot approve their own scrap request; write-off only after approval and only once. | `scrapService` | "You cannot approve your own scrap request." |

## Invoice Customisation and Invoicing (INVC)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-038 | One active invoice per order; only APPROVED-or-later orders; cancelling requires a reason. | `invoiceService.invoiceEligibility` | Messages. |
| RULE-039 | Invoice total must be greater than zero; due date not before invoice date; demo tax ≤ 40%. | `invoiceService.validateInvoiceOptions` | Messages. |

## Document Management and OCR (DOC)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-040 | Users may upload only for records in their scope; verified documents are locked until the file is replaced; rejection needs a reason. | `documentService` | Messages. |

## Customer Application (CAP)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-041 | Customer requested date from tomorrow up to 60 days ahead; login must be linked to a customer. | `customerAppService` | Messages. |

## Automated Notifications (AUTO)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-042 | Automated messages are sent once per event and record; skipped when automation is off, no rule or no template. | `automationService.fireEvent` | History SKIPPED with reason. |

## Call History (CALL)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-043 | Follow-up date cannot be before the call; notes ≤ 500 characters; salesmen see own calls. | `callService` | Messages. |

## AI Assistant, Forecasting and Replenishment (AI)

| ID | Rule | Enforced by | Message / effect |
|---|---|---|---|
| RULE-044 | Only Administrators approve, reject or convert replenishment requests; only creator or admin edits a draft. | `replenishmentService` | Messages. |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |