---
title: "Stakeholder Identification"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-OVW-009 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Stakeholder Identification |
| Document ID | BM-OVW-009 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Project Overview |
| Related module(s) | All modules |
| Document owner | Project Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Identify stakeholders, their interests and influence.

## Scope

Client, end users, customers, delivery team and third parties. Names are not available in the project materials and must be supplied by the client.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-OVW-010** (Stakeholder Responsibility Matrix)
- **BM-OVW-011** (Project Organization Structure)
- **BM-PM-004** (Resource Allocation and RACI Matrix)

## 1. Stakeholder register

Names, contact details and approval authority are **PENDING CONFIRMATION** — no names were provided in the project materials.

| # | Stakeholder | Type | Interest | Influence | Responsibilities | Label |
|---|---|---|---|---|---|---|
| SH-01 | Bellomassi management (client sponsor) | Client | Business value, approval of scope, budget | High | Approve BRD, SOW, UAT sign-off, go-live decision | PENDING CONFIRMATION (names to be provided) |
| SH-02 | Sales Director / Sales Managers | Client — business owner | Order approval, credit control, sales visibility | High | Approve sales and approval rules; UAT of order and approval flows | PENDING CONFIRMATION |
| SH-03 | Salesmen (Sales Executives) | Client — end user | Fast order capture on mobile | Medium | Use the Order Taking App; UAT participants | VERIFIED role in SOW |
| SH-04 | Customer Service team | Client — end user | Consolidation, document review | Medium | Consolidate and release orders; UAT | VERIFIED role in SOW |
| SH-05 | Dispatcher / Logistics Manager | Client — business owner | Zone planning, fleet, delivery performance | High | Approve dispatch rules; UAT of dispatch and tracking | VERIFIED role in SOW |
| SH-06 | Drivers | Client — end user | Simple mobile workflow, navigation, OTP | Medium | Use the Drivers App; pilot participants | VERIFIED role in SOW |
| SH-07 | Finance team | Client — business owner | Credit exposure, invoicing scope, ERP alignment | High | Confirm invoicing scope and credit rules; SAP alignment | PENDING CONFIRMATION |
| SH-08 | Warehouse / Inventory / QA staff | Client — end user | Stock accuracy, scrap, quality | Medium | Use inventory and scrap modules (beyond SOW) | PENDING CONFIRMATION (scope) |
| SH-09 | Bellomassi customers | External user | Order accuracy, delivery visibility, OTP security | Medium | Receive OTP and delivery notes; optional customer app | PENDING CONFIRMATION (customer app scope) |
| SH-10 | Client IT / SAP team | Client — technical | SAP integration, hosting, security | High | Provide SAP interfaces, hosting decision, security requirements | PENDING CONFIRMATION |
| SH-11 | Delivery team — Project Manager | Vendor | Plan, scope, delivery | High | Plan, report status, manage risks and changes | PROPOSED |
| SH-12 | Delivery team — Business Analyst | Vendor | Requirements, documentation, UAT support | Medium | Maintain BRD/SRS/FRDs and traceability | PROPOSED |
| SH-13 | Delivery team — Architect / Developers | Vendor | Design and build | Medium | Backend, web, mobile, integrations | PROPOSED |
| SH-14 | Delivery team — QA | Vendor | Quality | Medium | Test plans, execution, defect management | PROPOSED |
| SH-15 | Delivery team — DevOps | Vendor | Environments, CI/CD, monitoring | Medium | Infrastructure, deployments, backups | PROPOSED |
| SH-16 | Third parties: maps (Google), SMS / WhatsApp provider, email provider, cloud host | Supplier | Service usage and terms | Medium | Provide APIs and accounts | PENDING CONFIRMATION |

## 2. Engagement approach — PROPOSED

| Group | Engagement |
|---|---|
| High influence, high interest (sponsor, business owners) | Fortnightly steering review, scope and UAT sign-off |
| End users | Demos per sprint, UAT, training |
| Customers | Pilot feedback on OTP and delivery note |
| Third parties | Account set-up and technical onboarding |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |