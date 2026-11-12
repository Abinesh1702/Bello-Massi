---
title: "CI/CD Pipeline and Git Workflow"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-INF-007 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | CI/CD Pipeline and Git Workflow |
| Document ID | BM-INF-007 |
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

Define the branching model, commit and review rules and the build-test-deploy pipeline.

## Scope

PROPOSED. The prototype has no CI pipeline in the repository (NOT IMPLEMENTED); lint is available via `npm run lint` (VERIFIED).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-INF-006** (Docker Architecture and Deployment Guide)
- **BM-DEP-001** (Release Management Process)
- **BM-DEP-002** (Deployment Guide and Runbook)
- **BM-QA-001** (Test Strategy)

## 1. Git workflow

| Item | Rule |
|---|---|
| Model | Trunk-based: short-lived `feature/<ticket>-<slug>` branches from `main` |
| Hotfix | `hotfix/<ticket>` from the release tag, merged back to `main` |
| Commits | Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`) referencing the ticket |
| Pull requests | ≥ 1 reviewer approval; all checks green; no direct pushes to `main` |
| Versioning | Semantic versioning `MAJOR.MINOR.PATCH`; tag `vX.Y.Z` = release candidate |
| Protected | `main`, release tags; signed commits recommended |
| Secrets | Never committed; secret scanning blocks the PR |

## 2. Pipeline stages

| Stage | Trigger | Steps | Gate |
|---|---|---|---|
| Validate | Every PR | Lint (oxlint / ruff), type checks, unit tests, coverage | Must pass |
| Security | Every PR | SAST, dependency audit (npm audit / pip-audit), secret scan | No high / critical |
| Build | Merge to `main` | Web bundle, Docker images (tag = SHA), image scan | Must pass |
| Deploy test | Merge to `main` | Migrations + deploy to test, API + E2E tests | Must pass |
| Deploy staging | Release tag | Deploy, smoke, performance (k6), UAT | QA sign-off |
| Deploy production | Manual approval | Blue / green, migrations job, smoke, monitor 30 min | Release approval (**BM-DEP-001** (Release Management Process)) |

Diagram: DGM-17 in **BM-DGM-001** (Diagram Catalogue and Visual Documentation).

## 3. Mobile app pipeline

EAS Build (Expo) or Fastlane: build per release tag, internal testing track (Play Console / TestFlight), store release after
UAT approval. App version follows the API compatibility version.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |