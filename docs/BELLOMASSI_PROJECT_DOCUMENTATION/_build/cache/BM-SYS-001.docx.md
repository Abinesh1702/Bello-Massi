---
title: "System Requirements Document (SRD)"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-SYS-001 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | System Requirements Document (SRD) |
| Document ID | BM-SYS-001 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | System Requirements |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

State the system-level requirements (platform, environment, capacity, integrations) that the production solution must satisfy.

## Scope

Production system; prototype facts given for comparison.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-SYS-002** (Software Requirements Specification (SRS))
- **BM-ARC-001** (High-Level Design (HLD))
- **BM-INF-001** (Technology Stack Document)

## 1. System requirements

| ID | Area | Requirement | Prototype today | Label |
|---|---|---|---|---|
| SRD-001 | Platform | Web application served over HTTPS for office users | Static Vite build, any web server | PROPOSED (HTTPS) |
| SRD-002 | Platform | Native mobile app for drivers (Android, iOS) | Responsive web | PROPOSED |
| SRD-003 | Backend | REST API (Django REST Framework) with token authentication | None | PROPOSED |
| SRD-004 | Data | PostgreSQL 16 with daily backups and PITR | LocalStorage (per browser) | PROPOSED |
| SRD-005 | Real-time | WebSocket channel for tracking and live monitor | None | PROPOSED |
| SRD-006 | Jobs | Background workers for messaging, OCR, reports, expiry scans | In-browser on page load | PROPOSED |
| SRD-007 | Files | Object storage for PODs, documents, invoices | Data URLs in LocalStorage | PROPOSED |
| SRD-008 | Integrations | Maps / routes, SMS / WhatsApp, email, OCR; SAP stage 2 | Simulated | PROPOSED |
| SRD-009 | Environments | Development, test, staging, production | Developer machine | PROPOSED |
| SRD-010 | Observability | Central logs, metrics, alerts, uptime checks | Browser console | PROPOSED |
| SRD-011 | Capacity | Sized to confirmed volumes (orders / day, drivers, users) | ≈1 MB demo data | PENDING CONFIRMATION |
| SRD-012 | Localisation | Organisation time zone, currency, date format configurable | VERIFIED (Application Settings) | VERIFIED |
| SRD-013 | Browsers | Current Chrome, Edge, Safari, Firefox | VERIFIED | VERIFIED |

## 2. Related documents

Functional requirements **BM-SYS-003** (Functional Requirements Document (Consolidated)) · NFRs **BM-SYS-004** (Non-Functional Requirements) · architecture **BM-ARC-001** (High-Level Design (HLD)) · infrastructure **BM-INF-003** (Infrastructure, Network Architecture and Server Specification).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |