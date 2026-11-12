---
title: "Role User Manual — Sales Manager"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-MAN-104 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Role User Manual — Sales Manager |
| Document ID | BM-MAN-104 |
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

Explain to a Sales Manager user how to sign in, find their screens and do their daily work in the Bellomassi prototype.

## Scope

Role SALES_MANAGER with its default permissions (VERIFIED from src/config/permissions.js and navigation.js). An Administrator can change permissions, so menus may differ.

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

Approves, returns or rejects submitted orders after checking credit, stock and data quality; watches sales performance.

| Topic | Details |
|---|---|
| Purpose | Approves, returns or rejects submitted orders after checking credit, stock and data quality; watches sales performance. |
| Login | `/login` · **manager / Manager@123** (demo account — PROTOTYPE only; production accounts are issued by the Administrator) |
| Dashboard | `SalesManagerDashboard`: Pending approvals, Returned orders, Recent pending orders (oldest first), Active accounts and credit position |
| Menus | **Order Management:** Order List, Order Approval, Returned Orders, Rejected Orders, Order Reports · **Customers:** Customer List, Customer Credit · Products, Suppliers, Hubs · **Inventory:** Stock Overview, Low Stock · **Dispatch:** Dispatch Dashboard, Dispatch Planning, Delivery Tracking, Delivery History · **Documents** (5 pages) · **Invoices:** Invoice Dashboard, Invoices · **Communication:** Center, Email, WhatsApp, Call History, Call Follow-ups · **AI:** AI Overview, AI Assistant, Jarvis, Forecasting, Predictive Inventory, Replenishment, AI Insights, Model Management · Reports Center |
| Data scope | All submitted and later orders (not other users' drafts) |
| CRUD | Sales targets (`sales.targets.manage`); calls; documents upload; forecasts (generate / export) |
| Approvals | **Order approval** — Approve (`orders.approve`), Return for correction and Reject (`orders.reject`) |
| Reports | Sales, Inventory, Procurement, Dispatch & Delivery (history), Customer, Supplier, Communication, AI categories |
| Notifications | "New order for approval", "Order resubmitted" (with credit / stock warning flags) |
| Cannot do | Create orders; consolidate; plan or confirm dispatches; issue invoices; manage master data |
| Next responsible user | **Customer Service** (approved) or **Sales Executive** (returned) |
| Logout | `/logout` → `/login` |

## 2. Getting started

1. Open the application address given by your Administrator.
2. Sign in with your user name (or mobile number / email) and password. After 5 wrong attempts the account is locked for 15 minutes (default security setting; an Administrator can unlock it).
3. You land on your dashboard. Use the menu (sidebar on desktop, bottom bar on phone) to move between screens.
4. Use the bell icon for notifications and the profile menu to change your password, preferences or to sign out.

## 3. Your daily work

1. Order Approval queue (oldest first)
2. open each order
3. read approval checks
4. approve / return / reject
5. check returned orders
6. review credit position and reports

## 4. Screens you use

![UX-DASH-SM (prototype screenshot, demo data)](screenshots/UX-DASH-SM.png){width=15cm}

![UX-APPROVAL (prototype screenshot, demo data)](screenshots/UX-APPROVAL.png){width=15cm}

![UX-APPROVAL-DETAIL (prototype screenshot, demo data)](screenshots/UX-APPROVAL-DETAIL.png){width=15cm}

![UX-CREDIT — captured with the Super Admin demo account (prototype screenshot, demo data)](screenshots/UX-CREDIT.png){width=15cm}

## 5. Rules to remember

- Create orders; consolidate; plan or confirm dispatches; issue invoices; manage master data
- Work only with the records in your data scope: All submitted and later orders (not other users' drafts).
- After your step the next responsible user is: Customer Service (approved) or Sales Executive (returned).

## 6. Prototype notes

This manual describes the prototype (PROTOTYPE). Data is stored only in your browser; demo markers show simulated
features (GPS, OTP messages, email / WhatsApp). Production behaviour may differ — see **BM-OVW-015** (Project Status and Implementation Summary).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |