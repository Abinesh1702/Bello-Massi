# Configuration Handover Document

## Document control

| Field | Value |
|---|---|
| Document title | Configuration Handover Document |
| Document ID | BM-HND-008 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Client Handover |
| Related module(s) | All modules |
| Document owner | System Administrator |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Record the configuration delivered with the prototype and what must be configured for production.

## Scope

Prototype defaults (VERIFIED); production values PENDING CONFIRMATION. No secrets are recorded in this document.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-ADM-002 — Application Configuration Reference](../16_ADMINISTRATION_AND_CONFIGURATION/BM-ADM-002_Application_Configuration_Reference.md)
- [BM-INF-005 — Environment Configuration and Environment Variables Reference](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-005_Environment_Configuration.md)
- [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx)

## 1. Delivered configuration

| Area | Where | Reference |
|---|---|---|
| Application settings (13 tabs) | `/admin/settings`, defaults in `runtimeConfig.js` | [BM-ADM-002 — Application Configuration Reference](../16_ADMINISTRATION_AND_CONFIGURATION/BM-ADM-002_Application_Configuration_Reference.md) |
| Roles and permissions | `src/config/permissions.js`, editable in Role Management | [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx) |
| Navigation | `src/config/navigation.js` | [BM-UX-004 — Screen Inventory](../12_UI_UX_AND_DESIGN/BM-UX-004_Screen_Inventory.xlsx) |
| OTP, statuses | `src/config/dispatchConfig.js` | [BM-ADM-002 — Application Configuration Reference](../16_ADMINISTRATION_AND_CONFIGURATION/BM-ADM-002_Application_Configuration_Reference.md) |
| VMS rules | `src/config/vmsConfig.js`, `/vms/settings` | [BM-ADM-002 — Application Configuration Reference](../16_ADMINISTRATION_AND_CONFIGURATION/BM-ADM-002_Application_Configuration_Reference.md) |
| Environment | `.env.example` → `VITE_INTEGRATION_GATEWAY_URL` (empty) | [BM-INF-005 — Environment Configuration and Environment Variables Reference](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-005_Environment_Configuration.md) |
| Demo accounts | 13 accounts on sign-in screen | Must not exist in production |

## 2. Production configuration to be provided by the client

Company profile (legal name, address, tax registration), currency and tax rates, numbering prefixes, users and roles,
hubs, zones, drivers, vehicles, document types, message templates, provider credentials (stored in a secrets manager),
domains and certificates.

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |