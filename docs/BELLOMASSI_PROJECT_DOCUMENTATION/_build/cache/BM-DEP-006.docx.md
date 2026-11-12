---
title: "Post-Deployment Verification and Smoke Test Checklist"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-DEP-006 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Post-Deployment Verification and Smoke Test Checklist |
| Document ID | BM-DEP-006 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Deployment and Release |
| Related module(s) | All modules |
| Document owner | QA Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Quick checks executed after each deployment to confirm that the system works.

## Scope

Production and staging (PROPOSED); prototype checks can be run against `vite preview`.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-DEP-002** (Deployment Guide and Runbook)
- **BM-DEP-007** (Deployment and Go-Live Checklists)
- **BM-QA-011** (Functional Test Cases)

## 1. Smoke tests

| # | Check | Role | Expected |
|---|---|---|---|
| S-01 | Health endpoints return OK | — | 200 |
| S-02 | Sign in / sign out | Admin | Landing page shown |
| S-03 | Create and submit order | Salesman | Order number generated, status Submitted |
| S-04 | Approve order | Sales Manager | Status Approved, timeline entry |
| S-05 | Consolidate and mark ready | Customer Service | Ready for dispatch |
| S-06 | Create and confirm dispatch | Dispatcher | Stock deducted once; deliveries created |
| S-07 | Driver sees stop, arrives, OTP sent | Driver | OTP message received (real channel) |
| S-08 | Verify OTP, POD, delivery note | Driver | Note generated and sent |
| S-09 | Live map shows vehicle | Dispatcher | Position updates |
| S-10 | Customer tracking shows only own order | Customer | No other data visible |
| S-11 | Report opens | Admin | Data, export works |
| S-12 | Background jobs and integration log | Admin | No failures / dead letters |

Use dedicated test customer and driver accounts in production; cancel the test order afterwards.

## 2. Monitoring checks

Error rate, latency, queue length and logs reviewed for 30 minutes after release (**BM-INF-008** (Monitoring, Logging and Alerting Plan)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |