# Notification API Design

## Document control

| Field | Value |
|---|---|
| Document title | Notification API Design |
| Document ID | BM-API-016 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | API and Integration |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Specify the proposed notification api endpoints for the Django REST backend.

## Scope

11 endpoints under /api/v1.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-API-001 — API Specification (Overview and Conventions)](BM-API-001_API_Specification.md)
- [BM-API-002 — API Endpoint Catalogue](BM-API-002_API_Endpoint_Catalogue.xlsx)
- [BM-SEC-003 — Authentication, Password, MFA and Session Management Design](../10_SECURITY_AND_COMPLIANCE/BM-SEC-003_Authentication_and_Session_Design.md)

## 1. Status

**PROPOSED.** No API exists in the prototype; the same behaviour is implemented today by browser services (see section 4). Paths, payloads and codes will be finalised during backend design.

## 2. Endpoints

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| GET | `/api/v1/notifications` | `(authenticated)` | Own notifications (user + role targets) |
| POST | `/api/v1/notifications/{id}/read` | `(authenticated)` | Mark read |
| POST | `/api/v1/notifications/read-all` | `(authenticated)` | Mark all read |
| PUT | `/api/v1/notifications/preferences` | `(authenticated)` | Muted categories, toasts, digest |
| GET | `/api/v1/automation/rules` | `communication.automation` | Event rules |
| PUT | `/api/v1/automation/rules/{event}` | `communication.automation` | Update rule |
| POST | `/api/v1/messages/email` | `communication.send` | Send email |
| POST | `/api/v1/messages/whatsapp` | `communication.send` | Send WhatsApp / SMS |
| POST | `/api/v1/webhooks/messaging/{provider}` | `(signed webhook)` | Delivery receipts |
| GET | `/api/v1/calls` | `communication.calls` | Call log (salesman: own) |
| POST | `/api/v1/calls` | `calls.manage` | Log call |

### GET `/api/v1/notifications`

| Item | Specification |
|---|---|
| Purpose | Own notifications (user + role targets) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `(authenticated)` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `?unread=true` |
| Response body | `page<Notification>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/notifications/{id}/read`

| Item | Specification |
|---|---|
| Purpose | Mark read |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `(authenticated)` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `204` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/notifications/read-all`

| Item | Specification |
|---|---|
| Purpose | Mark all read |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `(authenticated)` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `204` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### PUT `/api/v1/notifications/preferences`

| Item | Specification |
|---|---|
| Purpose | Muted categories, toasts, digest |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `(authenticated)` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `{muted[], toasts, digest}` |
| Response body | `Preferences` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/automation/rules`

| Item | Specification |
|---|---|
| Purpose | Event rules |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `communication.automation` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `list<AutomationRule>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### PUT `/api/v1/automation/rules/{event}`

| Item | Specification |
|---|---|
| Purpose | Update rule |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `communication.automation` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `AutomationRule` |
| Response body | `AutomationRule` |
| Validation / errors | 403 not admin |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/messages/email`

| Item | Specification |
|---|---|
| Purpose | Send email |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `communication.send` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `{to[], cc[], subject, body, template_id?, attachment_document_ids[]}` |
| Response body | `Message` |
| Validation / errors | 400 |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/messages/whatsapp`

| Item | Specification |
|---|---|
| Purpose | Send WhatsApp / SMS |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `communication.send` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `{to, body, template_id?}` |
| Response body | `Message` |
| Validation / errors | 400; 503 provider |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/webhooks/messaging/{provider}`

| Item | Specification |
|---|---|
| Purpose | Delivery receipts |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `(signed webhook)` |
| Request parameters | Path: `id`; query filters as listed in the body column when prefixed with `?` |
| Request body | `provider payload` |
| Response body | `204` |
| Validation / errors | 401 bad signature |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### GET `/api/v1/calls`

| Item | Specification |
|---|---|
| Purpose | Call log (salesman: own) |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `communication.calls` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `—` |
| Response body | `page<CallLog>` |
| Validation / errors | — |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

### POST `/api/v1/calls`

| Item | Specification |
|---|---|
| Purpose | Log call |
| Authentication | Bearer JWT access token (or signed webhook) |
| Required permission | `calls.manage` |
| Request parameters | —; query filters as listed in the body column when prefixed with `?` |
| Request body | `CallLog` |
| Response body | `CallLog` |
| Validation / errors | 400 follow-up date (RULE-043) |
| Business rules | Same as the prototype service; rule IDs in [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md) |

## 4. Prototype equivalent — VERIFIED

The browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `notifications` ([BM-DAT-003 — Data Dictionary (Proposed Production Schema)](../08_DATABASE_AND_DATA_DESIGN/BM-DAT-003_Data_Dictionary.xlsx)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |