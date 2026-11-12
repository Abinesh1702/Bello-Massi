---
id: "BM-FRD-AI"
title: "Functional Requirements — AI Assistant, Forecasting and Replenishment"
folder: "04"
file: "BM-FRD-AI_AI_Assistant_Forecasting_and_Replenishment"
category: "Functional Requirements"
owner: "Business Analyst"
module: "AI Assistant, Forecasting and Replenishment"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the AI Assistant, Forecasting and Replenishment module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the AI Assistant, Forecasting and Replenishment module (/ai/*)."
---
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

Permission keys (from `src/config/rbacCatalog.js`): `ai.*`, `jarvis.*`, `forecasting.*`, `inventory.predictions.*`, `inventory.replenishment.create`, `procurement.*`. Default grants per role are in {{ref:BM-SEC-005}}.

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

See {{ref:BM-WF-13}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Replenishment DRAFT → SUBMITTED → APPROVED → CONVERTED → RECEIVED; insights NEW → REVIEWED → RESOLVED. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

- FR-AI-003: Users shall raise replenishment requests; Administrators approve, reject and convert them; stock receipts complete them.
- FR-AI-004: The system shall generate rule-based insights that users mark reviewed or resolved.

## 14. Notifications

Replenishment approval information.

## 15. Error scenarios

Field validation errors and permission errors as described in sections 9 and 5.

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_ai_*, bellomassi_forecasts, bellomassi_replenishment_drafts`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

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
