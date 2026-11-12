---
title: "Customer App User Manual"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-MAN-002 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Customer App User Manual |
| Document ID | BM-MAN-002 |
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

Guide for customer staff to order products, follow orders, track deliveries, share the OTP and get delivery notes and invoices.

## Scope

Customer app of the prototype (VERIFIED with real screenshots captured 2026-11-12). The customer app is an extension beyond the SOW (X-01) — production scope PENDING CONFIRMATION.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- Workflow documentation chapter 09 — Customer workflow (existing document, reused)
- **BM-MAN-112** (Role User Manual — Customer (portal / customer app))
- **BM-UX-007** (Mobile UX — Driver App and Customer App)
- **BM-WF-09** (WF-09 — Driver Assignment Workflow)
- **BM-FRD-CAP** (Functional Requirements — Customer Application)

## Contents

- 1. Sign in
- 2. Home
- 3. Place an order
- 4. Follow your order
- 5. Track the delivery and share the OTP
- 6. Delivery notes, invoices, payments and profile
- 7. What you cannot do
- 8. Prototype limitations

## 1. Sign in

Open the customer app and sign in with the mobile number, email or user name given by Bellomassi. Your login is linked to
one customer account; you see only that account's data.

![Customer sign-in](screenshots/UX-CUS-LOGIN.png){width=6.5cm} ![Home](screenshots/UX-CUS-DASH.png){width=6.5cm}

## 2. Home

Active orders, pending approval, delivered, outstanding balance, a card for any delivery on its way (**Track delivery**),
recent orders, delivery notes and notifications. Bottom bar: **Home, Catalog, Cart, Orders, Account**.

## 3. Place an order

1. **Catalog** → search by name, code, SKU or brand, or choose a category.
2. Set the quantity and tap **Add**. Availability is shown (limited stock does not stop ordering).
3. **Cart** → change quantities or remove lines; check subtotal, discount, tax and total.
4. Choose the delivery address (registered or another), requested date (tomorrow up to 60 days), optional time, PO /
   reference and remarks.
5. Tap **Place order** and confirm. The order goes to the Sales Manager for approval (status *Pending approval*). A credit
   warning may appear; the order can still be placed and the Sales Manager decides.

![Catalog — product added](screenshots/MAN-CUS-01-catalog-added.png){width=6cm} ![Cart](screenshots/MAN-CUS-02-cart.png){width=6cm}

Known issue (prototype): in the cart, the amount shown on each product line is "AED 0" although subtotal, tax and total
are correct (see known issues list **BM-HND-010** (Known Issues Register)).

## 4. Follow your order

**Orders** lists your orders with filters; open one to see a 9-step tracker: Order placed → Pending approval → Approved →
Prepared → Dispatch planned → Out for delivery → Driver arrived → OTP verified → Delivered. **Reorder** copies a past
order into the cart.

## 5. Track the delivery and share the OTP

1. When the driver is on the way, open **Track delivery** — driver, vehicle and a map (DEMO GPS in the prototype).
2. When the driver arrives, the **OTP** appears in large digits with its expiry time.
3. Read the OTP to the driver **only when you have checked the goods**. Never share it before the driver is with you.

![Track delivery](screenshots/MAN-CUS-04-tracking.png){width=6.5cm}

## 6. Delivery notes, invoices, payments and profile

- **Delivery notes**: notes with quantities, signature and remarks; printable.
- **Invoices**: issued invoices; printable.
- **Payments**: not available in the prototype (shows an explanation and the balance).
- **Account / Profile**: your details and **Sign out**.

## 7. What you cannot do

Cancel or change an order after placing it (contact your sales representative); pay online; see other customers' data;
approve anything.

## 8. Prototype limitations

No SMS / WhatsApp messages are sent; the OTP is shown only in the app; map positions are simulated; data is stored in the
browser.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |