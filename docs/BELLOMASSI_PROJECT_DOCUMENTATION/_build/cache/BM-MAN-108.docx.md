---
title: "Role User Manual — Finance Executive"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-MAN-108 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Role User Manual — Finance Executive |
| Document ID | BM-MAN-108 |
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

Explain to a Finance Executive user how to sign in, find their screens and do their daily work in the Bellomassi prototype.

## Scope

Role FINANCE with its default permissions (VERIFIED from src/config/permissions.js and navigation.js). An Administrator can change permissions, so menus may differ.

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

Issues and cancels customer invoices, manages invoice templates and numbering, watches credit exposure.

| Topic | Details |
|---|---|
| Purpose | Issues and cancels customer invoices, manages invoice templates and numbering, watches credit exposure. |
| Login | `/login` · **finance / Finance@123** (demo account — PROTOTYPE only; production accounts are issued by the Administrator) |
| Dashboard | `FinanceDashboard`: Order value (submitted), Approved order value, Delivered to invoice, Invoices issued, Collections, Outstanding (customer balances), Credit exposure, Credit utilisation, Over credit limit, Order value overview |
| Menus | Order List, Order Reports · Customer Credit · Products, Suppliers · Inventory Dashboard, Stock Overview · **Dispatch:** Dispatch Dashboard, Dispatch Planning, Delivery History, Delivery Reports · **Documents** (5) · **Invoices:** Invoice Dashboard, Invoices, New Invoice, Invoice Templates, Invoice Reports · **Communication:** Center, Email, WhatsApp · **AI:** AI Overview, Assistant, Jarvis, Forecasting, Predictive Inventory, Replenishment, AI Insights, Model Management · Reports Center |
| Data scope | All non-draft orders; invoices, customers, vendor documents |
| CRUD | Invoices (issue, cancel), invoice templates, invoice numbering settings; email invoice (demo) |
| Approvals | None in the order flow; replenishment approval is **not** granted to Finance by default |
| Reports | Finance, Sales, Dispatch & Delivery, Inventory, Procurement, Supplier, AI |
| Notifications | Invoice generated; purchase approval information |
| Cannot do | Record payments, credit notes or refunds (**Not Implemented**); change a customer's credit balance (Customer master is Administrator only); approve orders |
| Next responsible user | **Customer** (receives invoice) |
| Logout | `/logout` → `/login` |

## 2. Getting started

1. Open the application address given by your Administrator.
2. Sign in with your user name (or mobile number / email) and password. After 5 wrong attempts the account is locked for 15 minutes (default security setting; an Administrator can unlock it).
3. You land on your dashboard. Use the menu (sidebar on desktop, bottom bar on phone) to move between screens.
4. Use the bell icon for notifications and the profile menu to change your password, preferences or to sign out.

## 3. Your daily work

1. Invoice Dashboard
2. New Invoice for delivered / approved orders
3. print or email
4. review outstanding and credit utilisation
5. reports

## 4. Screens you use

![UX-DASH-FI (prototype screenshot, demo data)](screenshots/UX-DASH-FI.png){width=15cm}

![UX-INVOICE-DASH (prototype screenshot, demo data)](screenshots/UX-INVOICE-DASH.png){width=15cm}

![UX-INVOICES — captured with the Super Admin demo account (prototype screenshot, demo data)](screenshots/UX-INVOICES.png){width=15cm}

## 5. Rules to remember

- Record payments, credit notes or refunds (Not Implemented); change a customer's credit balance (Customer master is Administrator only); approve orders
- Work only with the records in your data scope: All non-draft orders; invoices, customers, vendor documents.
- After your step the next responsible user is: Customer (receives invoice).

## 6. Prototype notes

This manual describes the prototype (PROTOTYPE). Data is stored only in your browser; demo markers show simulated
features (GPS, OTP messages, email / WhatsApp). Production behaviour may differ — see **BM-OVW-015** (Project Status and Implementation Summary).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |