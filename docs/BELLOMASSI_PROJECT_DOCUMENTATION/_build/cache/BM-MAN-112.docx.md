---
title: "Role User Manual — Customer (portal / customer app)"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-MAN-112 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Role User Manual — Customer (portal / customer app) |
| Document ID | BM-MAN-112 |
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

Explain to a Customer (portal / customer app) user how to sign in, find their screens and do their daily work in the Bellomassi prototype.

## Scope

Role CUSTOMER with its default permissions (VERIFIED from src/config/permissions.js and navigation.js). An Administrator can change permissions, so menus may differ.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- Workflow documentation chapter 04 (existing document
- reused)
- BM-UX-005 Screen Specifications
- **BM-MAN-003** (Office Web Application User Manual (All Office Roles))
- **BM-MAN-120** (Role Responsibility Matrix)
- **BM-SEC-005** (RBAC and Access Control Matrix)
- **BM-MAN-002** (Customer App User Manual)

## 1. Your role

A customer's staff orders products, tracks deliveries, shares the OTP and downloads delivery notes and invoices.

| Topic | Details |
|---|---|
| Purpose | A customer's staff orders products, tracks deliveries, shares the OTP and downloads delivery notes and invoices. |
| Login | `/customer/login` · **customer / Customer@123** or mobile **+91 98410 22310** (demo account — PROTOTYPE only; production accounts are issued by the Administrator) |
| Dashboard | `/customer/dashboard` (Home): Active orders, Pending approval, Delivered, Outstanding (current); "Your delivery is on the way" card with DEMO GPS; recent orders, delivery notes, notifications |
| Menus (bottom bar) | Home, Catalog, Cart, My Orders, Delivery Notes, Invoices, Payments, Profile |
| Data scope | One linked customer (`user.customerId`) |
| CRUD | Cart (add, change quantity, remove); place order; re-order to cart |
| Approvals | None — orders go to the Sales Manager |
| Reports | None |
| Notifications | Order placed, approved, out for delivery, delivered, delivery not completed |
| Cannot do | Cancel a placed order (Not Implemented); pay online or see payment history (Not Implemented — "No payments recorded in this prototype"); see other customers' data |
| Next responsible user | **Sales Manager** |
| Logout | Profile › Sign Out → `/customer/login` |

## 2. Getting started

1. Open the application address given by your Administrator.
2. Sign in with your user name (or mobile number / email) and password. After 5 wrong attempts the account is locked for 15 minutes (default security setting; an Administrator can unlock it).
3. You land on your dashboard. Use the menu (sidebar on desktop, bottom bar on phone) to move between screens.
4. Use the bell icon for notifications and the profile menu to change your password, preferences or to sign out.

## 3. Your daily work

The full step-by-step customer procedure is in **BM-MAN-002** (Customer App User Manual). In short: browse the catalog, add to cart, place the order, follow its status, track the delivery, share the OTP with the driver, download delivery notes and invoices.

## 4. Screens you use

![UX-CUS-LOGIN (prototype screenshot, demo data)](screenshots/UX-CUS-LOGIN.png){width=6.5cm}

![UX-CUS-DASH (prototype screenshot, demo data)](screenshots/UX-CUS-DASH.png){width=6.5cm}

![UX-CUS-CATALOG (prototype screenshot, demo data)](screenshots/UX-CUS-CATALOG.png){width=6.5cm}

![UX-CUS-CART (prototype screenshot, demo data)](screenshots/UX-CUS-CART.png){width=6.5cm}

![UX-CUS-ORDERS (prototype screenshot, demo data)](screenshots/UX-CUS-ORDERS.png){width=6.5cm}

## 5. Rules to remember

- Cancel a placed order (Not Implemented); pay online or see payment history (Not Implemented — "No payments recorded in this prototype"); see other customers' data
- Work only with the records in your data scope: One linked customer (`user.customerId`).
- After your step the next responsible user is: Sales Manager.

## 6. Prototype notes

This manual describes the prototype (PROTOTYPE). Data is stored only in your browser; demo markers show simulated
features (GPS, OTP messages, email / WhatsApp). Production behaviour may differ — see **BM-OVW-015** (Project Status and Implementation Summary).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |