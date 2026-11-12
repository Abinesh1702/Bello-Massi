# Application Configuration Reference

## Document control

| Field | Value |
|---|---|
| Document title | Application Configuration Reference |
| Document ID | BM-ADM-002 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Administration and Configuration |
| Related module(s) | All modules |
| Document owner | System Administrator |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

List every configurable setting, its default and where it is changed.

## Scope

Settings screens (`/admin/settings`, 13 tabs) and configuration modules of the prototype (VERIFIED from src/config and the Settings screen).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- src/config/runtimeConfig.js, src/config/dispatchConfig.js, src/config/vmsConfig.js
- [BM-ADM-001 — System Administration Guide](BM-ADM-001_System_Administration_Guide.md)
- [BM-INF-005 — Environment Configuration and Environment Variables Reference](../11_INFRASTRUCTURE_AND_DEVOPS/BM-INF-005_Environment_Configuration.md)
- [BM-SYS-007 — Business Rules Catalogue](../03_SYSTEM_REQUIREMENTS/BM-SYS-007_Business_Rules_Catalogue.md)

## 1. Settings tabs (VERIFIED)

General · Company · Localization · Currency · Numbering · Notifications · Security · Approval Settings · Inventory
Settings · Warehouse Settings · Cold Chain Settings · Integration Settings · AI Settings.

## 2. Defaults

| Area | Setting | Default | Note |
|---|---|---|---|
| Organisation | Country / currency / time zone | United Arab Emirates / AED / Asia/Dubai | Seed master data uses India formats — PENDING CONFIRMATION |
| Localisation | Number locale, date, time | en-AE, `DD MMM YYYY`, `h:mm A` | |
| Currency | Display, decimals, compact style | symbol, 2, international (K/M) | Indian style (L/Cr) available |
| Numbering | Order, dispatch, delivery note, replenishment, forecast, employee prefixes | BM-ORD, BM-DSP, BM-DN, RPL, FC, EMP | |
| General | Application name, rows per page, prototype badge, AI features, Jarvis button, support email | Bellomassi, 10, on, on, on, support@bellomassi.demo | Support e-mail is a demo address |
| Security | Session timeout; max failed attempts; lockout; password min length; mixed password; reset code validity; force change after reset | 60 min; 5; 15 min; 8; yes; 15 min; yes | |
| Approval | Require approval remarks; block when credit exceeded; rejection remarks min length | no; no (warning only); 5 | Credit block policy PENDING CONFIRMATION |
| Notifications | Disabled categories; allow muting; max stored | none; yes; 400 | |
| Inventory | Default minimum / reorder / maximum stock; expiry warning days | 10 / 20 / 200; 30 | |
| Warehouse | Default receiving hub | (none) | |
| OTP | Length; max attempts; expiry (min–max) | 6; 5; 10 min (1–60) | `dispatchConfig.js` |
| VMS | Required vehicle documents; required driver documents; block on expired; block on warning; warning days; block on missing | RC, insurance, fitness; licence; yes; no; 7; no | `/vms/settings` |
| Integrations | Gateway URL (`VITE_INTEGRATION_GATEWAY_URL`), email, WhatsApp (OpenWA) settings | Empty → demo mode | Live integration NOT VERIFIED |

## 3. Change control

Settings changes are audit-logged (VERIFIED). In production, changes to security, approval and OTP settings should
require a change request ([BM-RSK-003 — Change Management Process and Change Request Template](../18_RISK_AND_CHANGE_MANAGEMENT/BM-RSK-003_Change_Request_Process_and_Template.md)).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |