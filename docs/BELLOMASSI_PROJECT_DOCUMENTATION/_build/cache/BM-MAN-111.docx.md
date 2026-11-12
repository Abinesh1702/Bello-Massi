---
title: "Role User Manual — QA Manager"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-MAN-111 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Role User Manual — QA Manager |
| Document ID | BM-MAN-111 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | User Manuals |
| Related module(s) | All modules |
| Document owner | Training Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Explain to a QA Manager user how to sign in, find their screens and do their daily work in the Bellomassi prototype.

## Scope

Role QA_MANAGER with its default permissions (VERIFIED from src/config/permissions.js and navigation.js). An Administrator can change permissions, so menus may differ.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- Workflow documentation chapter 04 (existing document
- reused)
- BM-UX-005 Screen Specifications
- **BM-MAN-003** (Office Web Application User Manual (All Office Roles))
- **BM-MAN-120** (Role Responsibility Matrix)
- **BM-SEC-005** (RBAC and Access Control Matrix)

## 1. Your role

Quality and cold chain: document verification, expiry, quarantine (damaged stock), adjustments.

| Topic | Details |
|---|---|
| Purpose | Quality and cold chain: document verification, expiry, quarantine (damaged stock), adjustments. |
| Login | `/login` · **qa / Quality@123** (demo account — PROTOTYPE only; production accounts are issued by the Administrator) |
| Dashboard | `QaDashboard`: Inspections pending, Inspection queue (documents waiting for OCR review and verification), Quarantine (damaged stock), Expired documents, Expiry (vehicle & driver documents), **Cold chain & temperature alerts — "No sensor integration", "No live readings"** |
| Menus | Products, Hubs · **Inventory:** Warehouse Dashboard, QA & Cold Chain, Stock Overview, Low Stock, Stock Receipts, Stock Transfers, Stock Adjustments, Stock Movements, Scrap Management · **VMS:** Dashboard, Vehicles, Driver Documents, Document Expiry, VMS Reports · **Documents:** 5 pages + Document Reports · **AI:** Overview, Assistant, AI Insights · Reports Center |
| CRUD | Stock adjustments (e.g. damaged, expired), scrap requests, documents (upload, review, reject) |
| Approvals | Document verification / rejection |
| Reports | Scrap, AI, Fleet (via `vms.view`) |
| Cannot do | Approve scrap (unless granted); create receipts or transfers; dispatch; invoice |
| Next responsible user | **Warehouse Manager** (scrap approval) |
| Logout | `/logout` → `/login` |

## 2. Getting started

1. Open the application address given by your Administrator.
2. Sign in with your user name (or mobile number / email) and password. After 5 wrong attempts the account is locked for 15 minutes (default security setting; an Administrator can unlock it).
3. You land on your dashboard. Use the menu (sidebar on desktop, bottom bar on phone) to move between screens.
4. Use the bell icon for notifications and the profile menu to change your password, preferences or to sign out.

## 3. Your daily work

1. Inspection queue
2. verify / reject documents
3. check expiries
4. adjust damaged stock
5. raise scrap

## 4. Screens you use

![UX-QUALITY — captured with the Super Admin demo account (prototype screenshot, demo data)](screenshots/UX-QUALITY.png){width=15cm}

![UX-DOCUMENTS — captured with the Super Admin demo account (prototype screenshot, demo data)](screenshots/UX-DOCUMENTS.png){width=15cm}

![UX-OCR — captured with the Super Admin demo account (prototype screenshot, demo data)](screenshots/UX-OCR.png){width=15cm}

## 5. Rules to remember

- Approve scrap (unless granted); create receipts or transfers; dispatch; invoice
- Work only with the records in your data scope: as configured.
- After your step the next responsible user is: Warehouse Manager (scrap approval).

## 6. Prototype notes

This manual describes the prototype (PROTOTYPE). Data is stored only in your browser; demo markers show simulated
features (GPS, OTP messages, email / WhatsApp). Production behaviour may differ — see **BM-OVW-015** (Project Status and Implementation Summary).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |