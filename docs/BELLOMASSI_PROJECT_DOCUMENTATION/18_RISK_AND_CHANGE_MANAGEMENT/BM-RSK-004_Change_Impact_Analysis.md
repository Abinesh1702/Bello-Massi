# Change Impact Analysis — Prototype Extensions and Gaps

## Document control

| Field | Value |
|---|---|
| Document title | Change Impact Analysis — Prototype Extensions and Gaps |
| Document ID | BM-RSK-004 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Risk and Change Management |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Analyse the impact of keeping prototype extensions (X-01 … X-11) and closing SOW gaps (G-01 … G-14) in production; provide the impact-analysis template.

## Scope

Qualitative impact; effort ranges are ESTIMATES. Decisions are PENDING CONFIRMATION.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-RSK-003 — Change Management Process and Change Request Template](BM-RSK-003_Change_Request_Process_and_Template.md)
- [BM-DOC-003 — Gap Analysis — Scope of Work, Prototype and Documentation](../23_DOCUMENT_CONTROL/BM-DOC-003_Gap_Analysis.md)
- [BM-PLN-002 — Phase-wise Scope Matrix](../05_SCOPE_AND_PLANNING/BM-PLN-002_Phase_wise_Scope_Matrix.xlsx)

## 1. Impact of extensions

| ID | Extension | Production impact if kept | Effort (ESTIMATE, person-weeks) | Recommendation |
|---|---|---|---|---|
| X-01 | Customer app | Second mobile app or responsive web; customer accounts, security, support | 6–10 | Decide at G0; can follow in phase 5 |
| X-02 | Invoicing | Conflicts with SOW (outside); tax compliance; SAP overlap | 4–8 | Retire unless client confirms |
| X-03 | Inventory | Stock deduction at dispatch needed for reliability; SAP overlap | 4–6 | Keep minimal stock check; confirm source of truth |
| X-04 | Scrap | Approvals, write-offs | 2–3 | Phase 5 |
| X-05 | VMS | Driver / vehicle compliance at assignment | 3–4 | Keep (safety) if confirmed |
| X-06 | Documents / OCR | OCR provider, storage, AV scanning | 4–6 | Phase 5 |
| X-07 | Email / WhatsApp | Providers, templates, opt-in | 3–5 | Keep messaging needed for OTP; others phase 5 |
| X-08 | Call history | Simple CRUD | 1–2 | Optional |
| X-09 | Reports Center | Re-implement queries server-side | 4–8 (for 118) | Select go-live reports |
| X-10 | AI | Models, data, governance | TBD | Phase 5 |
| X-11 | Extra roles | RBAC set-up | 1 | Confirm role list |

## 2. Impact of closing SOW gaps

| ID | Gap | Impact | Phase |
|---|---|---|---|
| G-01 | Approved value / quantity change | Approval UI + rules | 2 |
| G-02 | Finance notification | Notification rule | 2 |
| G-03 | Zone drag-board | New planning UI | 2 |
| G-04 | Fastest route with traffic | Routes API | 3 |
| G-05 | Turn-by-turn navigation | Deep link | 3 |
| G-06 | OTP by SMS / WhatsApp | Provider | 3 |
| G-07 | Delivery note sent | Provider / email | 3 |
| G-08 | Native driver app | React Native | 3 |
| G-09 | Live order monitor | WebSockets | 3 |
| G-10 | SAP items | Integration | 5 |
| G-11 | Configurable notification rules | Settings UI + engine | 2 |
| G-12 | Order channel | Field | 2 |
| G-13 | Real authentication | Backend | 2 |
| G-14 | Live tracking scope | Channels | 3 |

## 3. Impact analysis template

Requirement(s) affected · modules / screens · data model · API · integrations · security · tests · documents · effort ·
schedule · cost · risks · recommendation.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |