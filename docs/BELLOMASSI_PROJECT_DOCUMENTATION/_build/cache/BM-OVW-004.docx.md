---
title: "Business Problem Statement"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-OVW-004 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Business Problem Statement |
| Document ID | BM-OVW-004 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Project Overview |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Describe the business problems the platform must solve.

## Scope

Current order-to-delivery operation as described in the Scope of Work.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-OVW-003** (Project Vision and Objectives)
- **BM-BRD-001** (Business Requirements Document (BRD))

## 1. Problem statement

Bellomassi's sales team receives orders by phone, email and WhatsApp (SOW slide 2). Orders are passed along and re-typed,
approvals and credit checks are chased manually, delivery planning depends on individuals, drivers learn their routes late
and there is no customer-confirmed proof of handover. Management has no single live view of order status.

## 2. Problems and impact

| # | Problem | Business impact | Addressed by |
|---|---|---|---|
| P-01 | Multiple order channels, manual re-entry | Errors in items and quantities, lost orders | Order capture (BR-001) |
| P-02 | Approval and credit checks outside a system | Shipments to customers over their credit limit; slow decisions | Approval and credit (BR-002, BR-003) |
| P-03 | No consolidation step with clear ownership | Orders released incomplete | Consolidation (BR-005) |
| P-04 | Manual planning; late driver information | Inefficient routes, late deliveries | Zone dispatch, next-day plan (BR-006, BR-007, BR-008) |
| P-05 | No proof of handover | Disputes about what was delivered and when | OTP, POD, delivery note (BR-009, BR-010, BR-033) |
| P-06 | No single status | Calls between departments; poor customer information | One status, notifications (BR-011, BR-012) |
| P-07 | Item data maintained from emails | Inconsistent master data | Admin Panel now; SAP later (BR-014, BR-018) |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |