---
title: "Server, Domain / DNS, SSL and Database Setup Guide"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-DEP-008 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Server, Domain / DNS, SSL and Database Setup Guide |
| Document ID | BM-DEP-008 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Deployment and Release |
| Related module(s) | All modules |
| Document owner | DevOps Engineer |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Configuration steps for servers, domains, TLS certificates, database set-up and schema migrations for each environment.

## Scope

PROPOSED for production. Domain names, provider and certificate authority are PENDING CONFIRMATION. Examples use placeholder names.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-INF-003** (Infrastructure, Network Architecture and Server Specification)
- **BM-INF-005** (Environment Configuration and Environment Variables Reference)
- **BM-INF-006** (Docker Architecture and Deployment Guide)
- **BM-DEP-002** (Deployment Guide and Runbook)
- **BM-DAT-002** (Proposed Production Database Design)
- **BM-DAT-004** (Data Migration Strategy)

## Contents

- 1. Environments
- 2. Server / container configuration
- 3. Domain and DNS
- 4. SSL / TLS certificates
- 5. Database set-up (PostgreSQL)
- 6. Database migrations
- 7. Application configuration

## 1. Environments

| Environment | Web | API | Notes |
|---|---|---|---|
| Local development | `http://localhost:5173` | `http://localhost:8000` | Docker Compose (**BM-INF-006** (Docker Architecture and Deployment Guide)) |
| Test | `https://test.<domain>` | `https://api.test.<domain>` | Auto-deploy from `main` |
| Staging | `https://staging.<domain>` | `https://api.staging.<domain>` | Production-like; UAT |
| Production | `https://app.<domain>` | `https://api.<domain>` | Customer-facing |

## 2. Server / container configuration

| Item | Setting |
|---|---|
| OS / base image | Minimal Linux (Debian slim / Alpine), patched monthly |
| Runtime | Gunicorn + Uvicorn workers (ASGI); workers = 2 × vCPU + 1 |
| Time zone | UTC on servers; business time zone in application settings |
| Limits | Request body 15 MB (uploads); timeouts 30 s (API), 300 s (reports export job) |
| Health | `/healthz` (liveness), `/readyz` (DB + Redis) |
| Logging | JSON to stdout; collected centrally (**BM-INF-008** (Monitoring, Logging and Alerting Plan)) |
| Users | Non-root; read-only root file system |

## 3. Domain and DNS

1. Register / choose the domain (client decision).
2. Create records: `app` → CDN / load balancer (CNAME or alias); `api` → load balancer; `ws` (optional) → load balancer.
3. Set TTL 300 s before go-live, raise to 3600 s afterwards.
4. Add SPF, DKIM and DMARC records for the sending domain of emails.
5. Enable DNSSEC if the registrar supports it.

## 4. SSL / TLS certificates

1. Use managed certificates (AWS ACM / Azure-managed / Let's Encrypt via cert-manager).
2. Validate by DNS; include `app`, `api` (and `ws`) names.
3. TLS 1.2+ only, HSTS (`max-age=31536000; includeSubDomains`), redirect HTTP → HTTPS.
4. Monitor expiry (alert < 21 days); auto-renew.

## 5. Database set-up (PostgreSQL)

1. Create managed PostgreSQL 16 instance in private subnet, Multi-AZ / zone-redundant, storage encrypted.
2. Parameter group: `timezone=UTC`, `log_min_duration_statement=500ms`, connections sized for workers.
3. Create database `bellomassi`, application user (DML only), migration user (DDL), read-only reporting user.
4. Enforce TLS connections; restrict security group to the app subnet.
5. Enable automated backups (35 days) and PITR (**BM-INF-009** (Backup and Disaster Recovery Plan)).
6. Extensions as needed: `pgcrypto`, `pg_trgm` (search), PostGIS (optional).

## 6. Database migrations

| Rule | Detail |
|---|---|
| Tool | Django migrations, committed with code |
| Execution | One-off job before traffic switch (`python manage.py migrate --noinput`) |
| Compatibility | Expand → migrate data → contract over two releases for breaking changes |
| Review | Every migration reviewed for locks on large tables |
| Backup | Snapshot before each production migration |
| Data migration from prototype / client sources | **BM-DAT-004** (Data Migration Strategy) |

## 7. Application configuration

Configuration via environment variables and the Admin settings screens (company, security, OTP, numbering, VMS rules,
notification templates). Reference: **BM-INF-005** (Environment Configuration and Environment Variables Reference) and **BM-ADM-002** (Application Configuration Reference).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |