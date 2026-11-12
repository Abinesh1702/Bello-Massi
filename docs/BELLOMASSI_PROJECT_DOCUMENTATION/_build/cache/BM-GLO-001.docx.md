---
title: "Project Glossary"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-GLO-001 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Project Glossary |
| Document ID | BM-GLO-001 |
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

Define business and technical terms used across the documentation so that all documents use the same meaning.

## Scope

Business, prototype and production terms.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-GLO-002** (Acronyms and Abbreviations)
- **BM-GLO-003** (Quick Reference Card)
- **BM-OVW-012** (Project Glossary and Acronyms (Overview Extract))

## 1. Business terms

| Term | Definition |
|---|---|
| Order | Customer request for products, captured by a salesman (office) or the customer (customer app); identified as BM-ORD-YYYY-NNNNN |
| Order source | Where the order was captured: office (salesman) or `customer_app` |
| Approval | Sales Manager decision on a submitted order: approve, return for correction or reject |
| Return for correction | Approval outcome sending the order back to the salesman with a reason |
| Credit limit / credit position | Customer limit compared with current balance plus the order value; exceeding it gives a warning (or block if configured) |
| Consolidation | Customer Service verification of approved orders (checks) and release as Ready for dispatch |
| Ready for dispatch | Order status after consolidation; visible to the Dispatcher |
| Hub | Fulfilment location from which orders are delivered; drivers and vehicles belong to a hub |
| Zone | Delivery area used to group orders when planning dispatches |
| Dispatch | A planned trip: date, zone, driver, vehicle and ordered stops (BM-DSP-YYYY-NNNNN) |
| Dispatch confirmation | Dispatcher's loading check; stock is deducted and the driver can start |
| Stop / delivery | One order delivered within a dispatch; has its own status |
| Sequence | Order of stops set by the Dispatcher; the driver follows it |
| OTP (delivery OTP) | 6-digit one-time code issued when the driver arrives; the customer gives it to the driver to confirm handover |
| POD (proof of delivery) | Delivered / damaged / rejected quantities, receiver, signature, photo, remarks |
| Delivery note | Document generated for each completed stop (BM-DN-YYYY-NNNNN) |
| Partial delivery | Delivery where not all dispatched quantities were accepted |
| Delivery exception | Failed or partial delivery reviewed by the Dispatcher (return stock or re-queue) |
| VIP customer | Customer flag giving higher priority and timing alerts |
| Scrap | Stock written off after an approved scrap request |
| Replenishment | Purchase request to a supplier (draft → approval) |
| VMS | Vehicle Management System — vehicle / driver documents and compliance rules for assignment |
| Supplier portal | Read-only supplier view of approved requests and receipts |

## 2. Prototype terms

| Term | Definition |
|---|---|
| Prototype | The React application that runs in the browser with LocalStorage and simulated integrations |
| LocalStorage | Browser storage used by the prototype; data stays in one browser |
| Seed data | Demo records loaded on first visit |
| Data version | `APP_DATA_VERSION` (8) controlling seed and migrations |
| DEMO GPS | Simulated positions and ETAs (`utils/demoGeo.js`) |
| Demo mode | Integration running without a real provider; labelled in the UI |
| Permission key | Named right, e.g. `orders.approve`; 110 keys exist |
| Data scope | Which records a role can see (own, linked customer, all…) |
| Landing page | First screen after sign-in for a role |
| Workspace launcher | Dashboard for custom roles listing permitted modules |

## 3. Production terms

| Term | Definition |
|---|---|
| Backend | Server application (Django) proposed for production |
| API | REST interface `/api/v1/…` between apps and backend |
| WebSocket | Persistent connection for live tracking and updates (Django Channels) |
| Outbox | Table of pending integration messages processed by workers |
| PITR | Point-in-time recovery of the database |
| RPO / RTO | Maximum data loss / downtime targets |
| Blue / green deployment | Two production environments; traffic switched after checks |
| Hypercare | Intensive support period after go-live |

## 4. Documentation labels

| Label | Meaning |
|---|---|
| VERIFIED | Confirmed from the current source code or existing documents |
| PROTOTYPE | Implemented in the prototype with mock data, LocalStorage or simulation |
| PROPOSED | Recommended for production, not yet developed |
| PENDING CONFIRMATION | Needs client clarification |
| NOT IMPLEMENTED | Not present in the prototype |
| NOT VERIFIED | Cannot be confirmed from current materials |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |