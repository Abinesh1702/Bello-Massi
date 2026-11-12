# Technology Stack Document

## Document control

| Field | Value |
|---|---|
| Document title | Technology Stack Document |
| Document ID | BM-INF-001 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Infrastructure and DevOps |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

List the technologies of the prototype (VERIFIED) and the proposed production stack with reasons.

## Scope

Frontend, mobile, backend, data, integrations, infrastructure, tooling.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- package.json of bellomassi-premium-ui
- Driver App GPS Implementation Guide §10
- [BM-ARC-001 — High-Level Design (HLD)](../07_SYSTEM_ARCHITECTURE/BM-ARC-001_High_Level_Design.md)
- [BM-INF-003 — Infrastructure, Network Architecture and Server Specification](BM-INF-003_Infrastructure_and_Network_Architecture.md)

## 1. Prototype stack — VERIFIED (package.json)

| Layer | Technology | Version |
|---|---|---|
| UI framework | React, React DOM | ^19.3 |
| Build | Vite, @vitejs/plugin-react | ^8.3, ^6.1 |
| Styling | Tailwind CSS (@tailwindcss/vite) | ^4.3 |
| Routing | React Router DOM | ^7.18 |
| Charts | Recharts | ^3.10 |
| Icons | lucide-react | ^1.71 |
| Toasts | sonner | ^2.0 |
| Dates | dayjs (utc, timezone) | ^1.11 |
| Lint | oxlint | ^1.90 |
| Storage | Browser LocalStorage | — |
| Tests (developer) | Playwright scripts (outside the repository) | — |

## 2. Production stack — PROPOSED

| Layer | Technology | Reason |
|---|---|---|
| Web frontend | Existing React 19 + Vite app | Reuse prototype UI and rules |
| Mobile | React Native (Expo or bare) with background location | GPS guide; one code base Android / iOS |
| Backend | Python 3.12, Django 5, Django REST Framework | GPS guide; mature RBAC and admin |
| Real-time | Django Channels + Redis | WebSocket tracking (GPS guide) |
| Jobs | Celery + Redis / RabbitMQ, Celery beat | Messaging, OCR, reports, schedules |
| Database | PostgreSQL 16 (+ PostGIS optional) | GPS guide; relational integrity |
| Cache | Redis 7 | Cache, broker, channel layer |
| Files | S3-compatible object storage | POD, documents, invoices |
| Maps | Google Maps Platform, Routes API | GPS guide |
| Messaging | SMS / WhatsApp Business provider (to confirm) | OTP, delivery note |
| API docs | drf-spectacular (OpenAPI 3) | Contract-first |
| Web server | Nginx / managed load balancer | TLS, static |
| Containers | Docker, Docker Compose (dev), managed containers or Kubernetes (prod) | Portability |
| CI/CD | GitHub Actions or GitLab CI | Automation |
| Monitoring | Prometheus + Grafana or cloud native; Sentry; central logs | Observability |
| Tests | pytest, Playwright, Detox / Maestro (mobile), k6 (load) | Quality |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |