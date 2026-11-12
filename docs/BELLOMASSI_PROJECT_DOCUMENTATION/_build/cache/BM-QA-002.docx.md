---
title: "Test Plan (with Functional, Integration, Regression, Performance, Security and Mobile sub-plans)"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-QA-002 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Test Plan (with Functional, Integration, Regression, Performance, Security and Mobile sub-plans) |
| Document ID | BM-QA-002 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Testing and Quality Assurance |
| Related module(s) | All modules |
| Document owner | QA Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Plan the test activities for the production build — scope, items, schedule placeholders, resources and deliverables.

## Scope

Production platform release 1 (PROPOSED). Dates are placeholders until the project plan is agreed (PENDING CONFIRMATION).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-QA-001** (Test Strategy)
- **BM-QA-010** (Test Scenario Catalogue)
- **BM-QA-011** (Functional Test Cases)
- **BM-QA-003** (User Acceptance Testing (UAT) Plan)
- **BM-PLN-001** (Scope and Phase Plan)

## 1. Test items

Web app (office), driver app, customer app, REST API, WebSocket tracking, background jobs, integrations, database
migrations. Modules: all 35 module FRDs (**BM-SYS-003** (Functional Requirements Document (Consolidated))).

## 2. In scope / out of scope

| In scope | Out of scope |
|---|---|
| Functions in the agreed phase scope (**BM-PLN-002** (Phase-wise Scope Matrix)) | Third-party provider internals |
| Role permissions and data scope | SAP internal processes (stage 2 integration only) |
| Integrations against sandboxes | Hardware (phones) procurement |
| Performance on staging | Load beyond agreed volumes |

## 3. Sub-plans

| Sub-plan | Approach | Cases / reference | Exit |
|---|---|---|---|
| Functional | Execute functional and negative cases per module | **BM-QA-011** (Functional Test Cases) | All executed, no open Critical / High |
| Workflow / integration | 24 end-to-end scenarios across roles | **BM-QA-010** (Test Scenario Catalogue) | All pass |
| Regression | Automated E2E + API suite every build; full manual regression before release | CI | 100 % automated pass |
| Performance | k6 scripts: order submission, dispatch confirm, 50 drivers sending GPS every 10–15 s, 100 concurrent web users | NFR targets | Targets met or accepted |
| Security | ASVS L2 checklist, authorisation tests (IDOR, scope), dependency scan, external pen test | **BM-SEC-011** (Vulnerability Management and Security Testing Plan) | No open High; pen-test findings closed |
| Mobile | Device matrix (Android 10+ various vendors, iOS 16+), GPS background, low network, camera, battery | **BM-UX-007** (Mobile UX — Driver App and Customer App) | All pass on matrix |
| Accessibility | axe automated + manual on key journeys | **BM-UX-008** (Accessibility and Responsive Design Guidelines) | No critical issues |
| Migration | Trial load, reconciliation | **BM-DAT-004** (Data Migration Strategy) | Reconciled |

## 4. Schedule (placeholders)

| Activity | Start | End | Status |
|---|---|---|---|
| Test design and automation set-up | TBD | TBD | Not started |
| System test cycle 1 | TBD | TBD | Not started |
| System test cycle 2 (fixes + regression) | TBD | TBD | Not started |
| Performance and security | TBD | TBD | Not started |
| UAT | TBD | TBD | Not started |

## 5. Deliverables

Test cases (xlsx), automated suites, defect log, execution reports (**BM-QA-005** (Test Execution Report (Template))), test summary report
(**BM-QA-006** (Test Summary Report (Template) and Quality Metrics)), UAT sign-off (**BM-QA-003** (User Acceptance Testing (UAT) Plan)).

## 6. Risks

Late integration sandboxes; unclear status model (8 vs 13); country / tax decision; device availability for mobile tests;
test data from client. See **BM-RSK-002** (Project Risk Register).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |