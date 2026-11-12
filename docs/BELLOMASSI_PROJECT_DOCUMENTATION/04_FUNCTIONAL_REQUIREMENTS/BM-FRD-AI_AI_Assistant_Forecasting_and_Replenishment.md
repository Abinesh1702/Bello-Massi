# Functional Requirements — AI Assistant, Forecasting and Replenishment

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements — AI Assistant, Forecasting and Replenishment |
| Document ID | BM-FRD-AI |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Functional Requirements |
| Related module(s) | AI Assistant, Forecasting and Replenishment |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the functional requirements of the AI Assistant, Forecasting and Replenishment module as implemented in the prototype and as required for production.

## Scope

All screens, rules, statuses and integrations of the AI Assistant, Forecasting and Replenishment module (/ai/*).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-SYS-002 — Software Requirements Specification (SRS)](../03_SYSTEM_REQUIREMENTS/BM-SYS-002_Software_Requirements_Specification.md)
- [BM-SYS-003 — Functional Requirements Document (Consolidated)](../03_SYSTEM_REQUIREMENTS/BM-SYS-003_Functional_Requirements_Document.md)
- [BM-SYS-008 — Requirement Traceability Matrix](../03_SYSTEM_REQUIREMENTS/BM-SYS-008_Requirement_Traceability_Matrix.xlsx)
- [BM-QA-011 — Functional Test Cases](../13_TESTING_AND_QUALITY_ASSURANCE/BM-QA-011_Functional_Test_Cases.xlsx)

## Contents

- 1. Module overview
- 2. Purpose
- 3. Business objectives
- 4. User roles
- 5. Access permissions
- 6. Screens
- 7. Functional requirements
- 8. Input fields
- 9. Validation rules
- 10. Business rules
- 11. Workflow
- 12. Status lifecycle
- 13. Approval rules
- 14. Notifications
- 15. Error scenarios
- 16. Exception handling
- 17. Data dependencies
- 18. Reports
- 19. Audit requirements
- 20. Acceptance criteria
- 21. Current implementation status
- 22. Future enhancement requirements

## 1. Module overview

| Item | Value |
|---|---|
| Module code | `AI` |
| Module name | AI Assistant, Forecasting and Replenishment |
| Current implementation status | **Implemented with limitations (AI provider simulated)** |
| Main routes | `/ai/*` |
| Services / components | `aiChatService, forecastService, replenishmentService, insightService` |
| LocalStorage keys (prototype) | `bellomassi_ai_*, bellomassi_forecasts, bellomassi_replenishment_drafts` |


## 2. Purpose

Rule-based assistant and Jarvis, forecasting models, predictive inventory, insights and replenishment requests.

## 3. Business objectives

Planners get forecasts and reorder suggestions; users get quick answers.

Related business requirements: BR-031.

## 4. User roles

- Administrator
- Dispatcher
- Inventory Executive
- Sales Manager
- Warehouse Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `ai.*`, `jarvis.*`, `forecasting.*`, `inventory.predictions.*`, `inventory.replenishment.create`, `procurement.*`. Default grants per role are in [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx).

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| AI Overview | `/ai` | `ai.assistant.view` |
| AI Assistant | `/ai/assistant` | `ai.assistant.view` |
| Jarvis | `/ai/jarvis` | `jarvis.view` |
| Forecasting | `/ai/forecasting` | `forecasting.view` |
| Predictive Inventory | `/ai/predictive-inventory` | `inventory.predictions.view` |
| Replenishment | `/ai/replenishment` | `procurement.view` |
| AI Insights | `/ai/insights` | `ai.insights.view` |
| Model Management | `/ai/models` | `['forecasting.view', 'ai.models.manage']` |
| AI Settings | `/ai/settings` | `ai.settings.manage` |
| AI Activity | `/ai/activity` | `ai.assistant.view` |
| New Forecast | `/ai/forecasting/new` | `forecasting.generate` |
| Forecast History | `/ai/forecasting/history` | `forecasting.view` |
| Compare Forecasts | `/ai/forecasting/compare` | `forecasting.view` |
| Forecast Report | `/ai/forecasting/:id/print` | `forecasting.export` |
| Forecast | `/ai/forecasting/:id` | `forecasting.view` |
| Reorder Recommendations | `/ai/predictive-inventory/reorder` | `inventory.predictions.view` |
| Inventory Risk Analysis | `/ai/predictive-inventory/risks` | `inventory.predictions.view` |
| Demand Forecasting | `/ai/predictive-inventory/demand` | `inventory.predictions.view` |
| Planning Parameters | `/ai/predictive-inventory/settings` | `inventory.predictions.view` |
| Prediction Detail | `/ai/predictive-inventory/lines/:id` | `inventory.predictions.view` |
| New Replenishment Draft | `/ai/replenishment/create` | `inventory.replenishment.create` |
| Replenishment Draft | `/ai/replenishment/:id` | `procurement.view` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-AI-001 | P3 | Users shall ask business questions in natural language and receive tables and charts from permission-checked tools. | Most office roles | PROTOTYPE | Simulated in prototype |
| FR-AI-002 | P3 | Users shall generate demand forecasts with selectable models and accuracy metrics. | Administrator, Sales Manager | VERIFIED | Implemented and working (prototype) |
| FR-AI-003 | P2 | Users shall raise replenishment requests; Administrators approve, reject and convert them; stock receipts complete them. | Administrator, Dispatcher, Warehouse Manager, Inventory Executive | VERIFIED | Implemented and working (prototype) |
| FR-AI-004 | P3 | The system shall generate rule-based insights that users mark reviewed or resolved. | Most office roles | VERIFIED | Implemented and working (prototype) |
| FR-AI-005 | P3 | External AI providers (OpenJarvis, Ollama, Gemini, OpenAI-compatible). | Administrator | NOT VERIFIED | Not verified |

## 8. Input fields

Question text / voice · forecast target, scope, horizon, model · replenishment supplier, hub, lines

## 9. Validation rules

- **RULE-044** — Only Administrators approve, reject or convert replenishment requests; only creator or admin edits a draft. _(enforced by `replenishmentService`; message: Messages.)_

## 10. Business rules

- FR-AI-002: expected behaviour — Forecast saved and exportable.
- FR-AI-003: expected behaviour — DRAFT → SUBMITTED → APPROVED → CONVERTED → RECEIVED.
- FR-AI-004: expected behaviour — NEW → REVIEWED → RESOLVED.

## 11. Workflow

See [BM-WF-13 — WF-13 — Inventory Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-13_Inventory_Workflow.md) and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Replenishment DRAFT → SUBMITTED → APPROVED → CONVERTED → RECEIVED; insights NEW → REVIEWED → RESOLVED. Full lists: [BM-GLO-003 — Quick Reference Card](../22_GLOSSARY_AND_REFERENCE/BM-GLO-003_Quick_Reference.md).

## 13. Approval rules

- FR-AI-003: Users shall raise replenishment requests; Administrators approve, reject and convert them; stock receipts complete them.
- FR-AI-004: The system shall generate rule-based insights that users mark reviewed or resolved.

## 14. Notifications

Replenishment approval information.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See [BM-WF-18 — WF-18 — Exception Management Workflow](../06_BUSINESS_WORKFLOWS/BM-WF-18_Exception_Management_Workflow.md).

## 17. Data dependencies

Reads / writes: `bellomassi_ai_*, bellomassi_forecasts, bellomassi_replenishment_drafts`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: [BM-DAT-002 — Proposed Production Database Design](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-002_Production_Database_Design.md).

## 18. Reports

AI and Procurement categories.

## 19. Audit requirements

AI activity log; replenishment history. Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-AI-001 | Demo intent engine answers; write actions need confirmation. | TC-AI-001 |
| FR-AI-002 | Forecast saved and exportable. | TC-AI-002 |
| FR-AI-003 | DRAFT → SUBMITTED → APPROVED → CONVERTED → RECEIVED. | TC-AI-003 |
| FR-AI-004 | NEW → REVIEWED → RESOLVED. | TC-AI-004 |
| FR-AI-005 | Not verified. | TC-AI-005 |

## 21. Current implementation status

**Implemented with limitations (AI provider simulated).** Labels: PROTOTYPE 1, VERIFIED 3, NOT VERIFIED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Real LLM provider with data controls, server-side ML training, supplier collaboration.

- FR-AI-005 (NOT VERIFIED): External AI providers (OpenJarvis, Ollama, Gemini, OpenAI-compatible).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |