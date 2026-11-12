---
title: "UI Content, Messages and Status Display Standards"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-UX-009 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | UI Content, Messages and Status Display Standards |
| Document ID | BM-UX-009 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | UI/UX and Design |
| Related module(s) | All modules |
| Document owner | UX Designer |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Standards for wording, messages, status labels, dates, numbers and currency on screens.

## Scope

Applies to web and mobile; current values VERIFIED from the prototype where stated.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-UX-002** (Design System and Style Guide)
- **BM-SYS-007** (Business Rules Catalogue)
- **BM-WF-17** (WF-17 — Communication Workflow)

## 1. Writing rules

- Use the user's words: "Approve", "Return for correction", "Reject", "Ready for dispatch".
- Buttons start with a verb; one primary action per screen area.
- Error messages say what happened and what to do ("Enter your mobile number or email and your password.").
- Confirmation dialogs name the object and the consequence ("Confirm dispatch BM-DSP-… — stock will be deducted").
- Toasts: success (short), info, error (with reason). Do not use toasts for information the user must keep.

## 2. Status display

Statuses are shown as badges (colour + label) and in timelines. The prototype uses 13 order statuses; the SOW lists 8 — the
mapping is PENDING CONFIRMATION (see **BM-WF-17** (WF-17 — Communication Workflow)). Colour mapping: success = delivered / approved / verified;
warning = pending / partial / expiring; danger = rejected / failed / blocked; info = in progress; neutral = draft.

## 3. Formats

| Item | Prototype (VERIFIED) | Production (PROPOSED) |
|---|---|---|
| Currency | AED with thousands separators (e.g. AED 4.6M on dashboards, full amounts in tables) | From company setting; PENDING CONFIRMATION (AED vs INR) |
| Dates | `12 Nov 2026`, day names on dashboards; dayjs with time zone | Same; time zone from settings |
| Document numbers | `BM-ORD-2026-00034`, `BM-DSP-2026-00016`, delivery and note sequences | Same format; server-generated |
| Phone / address | India format (+91, pincode, state) in seed data | Country-specific per decision |
| Demo markers | "DEMO PROTOTYPE", "DEMO GPS", "demo mode" | Removed in production |

## 4. Notifications content

In-app notifications are VERIFIED (notification centre). SMS / WhatsApp / email texts exist as templates in the prototype but
are not sent (Simulated). Templates must be approved by the client before go-live (PENDING CONFIRMATION).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |