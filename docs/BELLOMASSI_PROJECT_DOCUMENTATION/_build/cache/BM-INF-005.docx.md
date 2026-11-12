---
title: "Environment Configuration and Environment Variables Reference"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-INF-005 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Environment Configuration and Environment Variables Reference |
| Document ID | BM-INF-005 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Infrastructure and DevOps |
| Related module(s) | All modules |
| Document owner | DevOps Engineer |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Describe how each environment is set up and list configuration variables (existing prototype variable and proposed backend variables).

## Scope

Development, test, staging, production setup; environment variables.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-INF-003** (Infrastructure, Network Architecture and Server Specification)
- **BM-DEP-002** (Deployment Guide and Runbook)

## 1. Environment setup

| Step | Development | Test | Staging | Production |
|---|---|---|---|---|
| Source | Feature branch | `main` | Release tag | Release tag (approved) |
| Infrastructure | Docker Compose | IaC (Terraform) small | IaC production-like | IaC production |
| Data | Seed / fixtures | Synthetic, reset per run | Masked / synthetic, persistent | Real |
| Integrations | Mock adapters | Mock adapters | Provider sandboxes | Live providers |
| Access | Developers | Team | Team + UAT users | Users; admins via VPN |
| Deploy | Manual / hot reload | Automatic on merge | On tag | On approval (blue / green) |

Prototype (today): `npm install && npm run dev` (development) or `npm run build && npx vite preview` — VERIFIED.

## 2. Environment variables

| Variable | Component | Status | Description |
|---|---|---|---|
| `VITE_INTEGRATION_GATEWAY_URL` | Web (prototype) | VERIFIED (exists) | Optional gateway base URL; empty = simulated integrations |
| `VITE_API_BASE_URL` | Web | PROPOSED | REST API base URL |
| `VITE_WS_URL` | Web | PROPOSED | WebSocket URL |
| `VITE_GOOGLE_MAPS_KEY` | Web / mobile | PROPOSED | Browser-restricted Maps key |
| `DJANGO_SECRET_KEY` | API | PROPOSED | Secret (from secrets manager) |
| `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` | API | PROPOSED | Hosts and origins |
| `DATABASE_URL` | API, workers | PROPOSED | PostgreSQL connection (TLS) |
| `REDIS_URL` | API, workers, channels | PROPOSED | Redis |
| `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ENDPOINT` | API, workers | PROPOSED | Files |
| `JWT_ACCESS_MINUTES`, `JWT_REFRESH_HOURS` | API | PROPOSED | Token lifetimes |
| `OTP_PEPPER` | API | PROPOSED | Secret for OTP hashing |
| `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER_ID` | Workers | PROPOSED | Messaging |
| `WHATSAPP_PROVIDER`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | Workers | PROPOSED | WhatsApp Business |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` | Workers | PROPOSED | Email |
| `GOOGLE_ROUTES_KEY` | API | PROPOSED | Server-side routes key |
| `OCR_ENGINE`, `OCR_ENDPOINT` | Workers | PROPOSED | OCR |
| `SAP_BASE_URL`, `SAP_CLIENT_ID`, `SAP_SECRET` | Workers | PROPOSED (stage 2) | SAP |
| `SENTRY_DSN`, `LOG_LEVEL` | All | PROPOSED | Observability |
| `TIME_ZONE`, `DEFAULT_CURRENCY` | API | PROPOSED | Localisation defaults (also in settings) |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |