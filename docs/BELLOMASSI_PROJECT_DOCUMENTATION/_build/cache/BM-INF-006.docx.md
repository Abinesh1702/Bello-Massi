---
title: "Docker Architecture and Deployment Guide"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-INF-006 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Docker Architecture and Deployment Guide |
| Document ID | BM-INF-006 |
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

Define container images, Compose layout for development and the container deployment approach.

## Scope

PROPOSED — no Dockerfiles exist in the prototype repository.

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-INF-003** (Infrastructure, Network Architecture and Server Specification)
- **BM-DEP-002** (Deployment Guide and Runbook)
- **BM-INF-007** (CI/CD Pipeline and Git Workflow)

## 1. Images

| Image | Base | Contents |
|---|---|---|
| `bellomassi-web` | `node:22-alpine` (build) → `nginx:1.27-alpine` | Vite build output + Nginx config |
| `bellomassi-api` | `python:3.12-slim` | Django, DRF, Gunicorn / Uvicorn (ASGI for Channels) |
| `bellomassi-worker` | same as api | Celery worker / beat (different command) |
| Third-party | `postgres:16`, `redis:7`, `minio` (dev), `clamav` | Dev / test only (managed services in prod) |

## 2. Development compose (example)

```yaml
services:
  db:      { image: postgres:16, environment: { POSTGRES_DB: bellomassi, POSTGRES_PASSWORD: dev }, ports: ["5432:5432"] }
  redis:   { image: redis:7 }
  minio:   { image: minio/minio, command: server /data, ports: ["9000:9000"] }
  api:     { build: ./backend, command: uvicorn config.asgi:application --host 0.0.0.0 --port 8000 --reload,
             env_file: .env.dev, depends_on: [db, redis, minio], ports: ["8000:8000"] }
  worker:  { build: ./backend, command: celery -A config worker -l info, env_file: .env.dev, depends_on: [db, redis] }
  beat:    { build: ./backend, command: celery -A config beat -l info, env_file: .env.dev, depends_on: [redis] }
  web:     { build: ./frontend, ports: ["5173:80"] }
```

## 3. Rules

Non-root users; read-only file systems where possible; health checks (`/healthz`, `/readyz`); one process per
container; images scanned (Trivy) and signed; tags = git SHA + semantic version; configuration only by environment
variables / secrets.

## 4. Production deployment

Managed container service (ECS Fargate / Azure Container Apps) or Kubernetes; rolling or blue / green deployment;
database migrations run as a one-off job before switching traffic. Steps: **BM-DEP-002** (Deployment Guide and Runbook).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |