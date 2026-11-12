---
title: "Role User Manual — Management (Read-only Oversight)"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-MAN-114 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Role User Manual — Management (Read-only Oversight) |
| Document ID | BM-MAN-114 |
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

Guide for management users who need dashboards and reports without operational actions.

## Scope

PENDING CONFIRMATION — the prototype has no "Management" system role. This manual proposes how such users can be served with a custom role.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- Workflow documentation chapter 04 §4.14 Custom roles
- **BM-MAN-003** (Office Web Application User Manual (All Office Roles))
- **BM-MAN-120** (Role Responsibility Matrix)
- **BM-SEC-004** (Authorization and RBAC Design)

## 1. Status

There is no Management role in the 13 system roles (VERIFIED). Management access is PENDING CONFIRMATION by the client.

## 2. Proposed set-up (using existing features)

1. Administrator opens **Role Management → Create role** (`/admin/roles/create`).
2. Name: "Management"; data scope: all records; landing page: Dashboard.
3. Grant view-only permissions, for example `dashboard.view`, `orders.view`, `reports.center`, `dispatch.view`, `inventory.dashboard`, `invoices.view` — no create / approve keys.
4. Assign the role to management users in **User Management**.

A custom role's dashboard is the permission-driven workspace launcher (VERIFIED), not the Super Admin operations
dashboard. If management needs the operations overview KPIs, a dedicated dashboard is PROPOSED.

## 3. Using the system

Sign in → Dashboard (period filter: today, week, month, custom, compare) → Reports Center (search, filter, export CSV,
print) → open orders or dispatches read-only.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |