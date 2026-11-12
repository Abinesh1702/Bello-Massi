---
title: "Driver App User Manual"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-MAN-001 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Driver App User Manual |
| Document ID | BM-MAN-001 |
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

Step-by-step guide for drivers to deliver their stops with OTP and proof of delivery.

## Scope

Driver app of the prototype (mobile web, VERIFIED with real screenshots captured 2026-11-12). GPS and OTP messages are simulated (PROTOTYPE). The native app is PROPOSED and may look different.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- Workflow documentation chapter 08 — Driver workflow (existing document, reused)
- **BM-MAN-107** (Role User Manual — Driver)
- **BM-UX-007** (Mobile UX — Driver App and Customer App)
- **BM-WF-08** (WF-08 — Dispatch Workflow)
- **BM-FRD-DRV** (Functional Requirements — Driver Application)
- **BM-FRD-OTP** (Functional Requirements — Delivery OTP)
- **BM-FRD-POD** (Functional Requirements — Proof of Delivery)

## Contents

- 1. Before you start
- 2. Sign in
- 3. Today screen
- 4. Deliver a stop
- 5. OTP rules
- 6. When you cannot deliver
- 7. Quantity rules
- 8. After delivery
- 9. What you cannot do
- 10. Prototype limitations

## 1. Before you start

- You need a driver account linked to your driver record. Your Administrator gives you the address of the app, your
  user name (mobile number, email or user name) and a first password.
- Keep your phone charged and mobile data on.
- The Dispatcher must **confirm** your dispatch (vehicle loaded) before you can start. A dispatch dated tomorrow shows
  under *Tomorrow's plan* with Start disabled.

## 2. Sign in

1. Open the driver app and enter your mobile number, email or user name and your password.
2. Tap **Sign in**. You land on **Today**.
3. Wrong password 5 times locks the account for 15 minutes; ask your Administrator to unlock it.

![Driver sign-in](screenshots/UX-DRV-LOGIN.png){width=6.5cm} ![Today](screenshots/UX-DRV-DASH.png){width=6.5cm}

## 3. Today screen

Shows your dispatch number, number of stops, pending / completed / active counts, tomorrow's stops, the next stop and
your performance. The bottom bar has **Today, Deliveries, Route, Completed, Profile**.

## 4. Deliver a stop

Stops must be delivered **in the sequence set by the Dispatcher**. Only one stop can be out for delivery at a time.

| Step | What you do | What the system does |
|---|---|---|
| 1 | Open the next stop from Today or Deliveries | Shows customer, address, items, map (DEMO GPS) |
| 2 | Tap **Start delivery** and confirm | Stop becomes *Out for delivery*; customer and Dispatcher are notified |
| 3 | Use **Navigate** to open your maps app, or **Call** the customer | — |
| 4 | At the customer, tap **Reach location** → **I have arrived** | Arrival time recorded; a 6-digit OTP is issued to the customer (shown in the customer app — no SMS in the prototype) |
| 5 | Tap **Enter OTP & complete** | Opens the confirmation form |
| 6 | Enter delivered and damaged quantities per product, name of receiver, remarks; optional rejected quantity and reason, signature, photo, customer remarks | Remaining quantities are calculated |
| 7 | Ask the customer for the OTP, type it, tap **Verify OTP & complete delivery** | Stop becomes *Delivered* or *Partially delivered*; delivery note generated |
| 8 | Go to the next stop | When all stops are closed the dispatch is completed |

![Stop out for delivery](screenshots/MAN-DRV-01-stop.png){width=5.2cm} ![Reach location](screenshots/MAN-DRV-04-reach-dialog.png){width=5.2cm} ![Arrived — OTP issued](screenshots/MAN-DRV-05-arrived.png){width=5.2cm}

![Confirm delivery form (full page)](screenshots/MAN-DRV-07-pod-form-full.png){width=6.5cm}

## 5. OTP rules

| Rule | Value |
|---|---|
| Length | 6 digits |
| Valid for | 10 minutes (default setting) |
| Wrong attempts | 5 → code locked; a new code must be generated |
| Without the correct OTP | The delivery cannot be completed |

## 6. When you cannot deliver

Tap **Report issue / mark failed** and choose a reason: Customer Not Available, Customer Refused, Customer Requested
Reschedule, Incorrect Address, Damaged Goods, Partial Delivery or Other. Add remarks. The Dispatcher reviews the stop and
decides to return the stock or re-plan it.

## 7. Quantity rules

- Delivered quantity is required, whole units, not more than dispatched.
- Damaged / rejected cannot exceed what was not delivered.
- Receiver name is required. Photo and signature each max 350 KB.

## 8. After delivery

- **Completed** lists closed stops with OTP and POD status.
- **Delivery notes** shows the generated notes (BM-DN-…), which you can show to the customer.
- **Profile** shows your details, today's statistics and **Sign out**.

![Route (DEMO GPS)](screenshots/UX-DRV-ROUTE.png){width=6.5cm} ![Completed](screenshots/UX-DRV-COMPLETED.png){width=6.5cm}

## 9. What you cannot do

See or change another driver's stops; change the stop order; start a future-dated dispatch; complete without the OTP;
reopen a closed stop; use office screens.

## 10. Prototype limitations

Positions on the map are simulated ("DEMO GPS"); the OTP is not sent by SMS / WhatsApp; data is kept only in the phone's
browser; no offline mode or push notifications. These are planned for the production app (**BM-UX-007** (Mobile UX — Driver App and Customer App)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |