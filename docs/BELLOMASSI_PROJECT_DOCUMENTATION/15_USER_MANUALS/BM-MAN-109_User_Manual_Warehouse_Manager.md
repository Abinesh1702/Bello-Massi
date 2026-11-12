# Role User Manual — Warehouse Manager

## Document control

| Field | Value |
|---|---|
| Document title | Role User Manual — Warehouse Manager |
| Document ID | BM-MAN-109 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | User Manuals |
| Related module(s) | All modules |
| Document owner | Training Lead |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Explain to a Warehouse Manager user how to sign in, find their screens and do their daily work in the Bellomassi prototype.

## Scope

Role WAREHOUSE_MANAGER with its default permissions (VERIFIED from src/config/permissions.js and navigation.js). An Administrator can change permissions, so menus may differ.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- Workflow documentation chapter 04 (existing document
- reused)
- BM-UX-005 Screen Specifications
- [BM-MAN-003 — Office Web Application User Manual (All Office Roles)](BM-MAN-003_Office_Web_App_User_Manual.md)
- [BM-MAN-120 — Role Responsibility Matrix](BM-MAN-120_Role_Responsibility_Matrix.xlsx)
- [BM-SEC-005 — RBAC and Access Control Matrix](../10_SECURITY_AND_COMPLIANCE/BM-SEC-005_RBAC_and_Access_Control_Matrix.xlsx)

## 1. Your role

Owns hub stock: receipts, transfers, adjustments, scrap approval, picking & loading view, document expiry.

| Topic | Details |
|---|---|
| Purpose | Owns hub stock: receipts, transfers, adjustments, scrap approval, picking & loading view, document expiry. |
| Login | `/login` · **warehouse / Warehouse@123** (demo account — PROTOTYPE only; production accounts are issued by the Administrator) |
| Dashboard | `WarehouseDashboard`: Stock value, Low / out of stock, Damaged / held, Expiry, Inventory alerts, Picking & loading (consolidated and ready orders at the hub), Current stock (lowest available first), vehicle & driver documents expired or due |
| Menus | Order List · Products, Suppliers, Hubs · **Inventory:** all 10 pages incl. Warehouse Dashboard and QA & Cold Chain · **Dispatch:** Dashboard, Ready for Dispatch, Dispatch Planning, Delivery History · **Documents** (5) · **AI:** Overview, Assistant, Jarvis, Forecasting, Predictive Inventory, Replenishment, AI Insights, Model Management · Reports Center |
| CRUD | Stock receipts, transfers, adjustments, min/max/reorder levels, scrap requests, replenishment drafts |
| Approvals | **Scrap requests** (approve / reject / post write-off) — not their own requests |
| Reports | Inventory, Procurement, Scrap, Dispatch & Delivery history, Supplier, AI |
| Notifications | Low stock alert, scrap requests pending approval, purchase approval information |
| Cannot do | Approve orders; dispatch; approve replenishment (Administrator only); manage products or hubs master data |
| Next responsible user | **Dispatcher** (stock ready for loading); **Administrator** (replenishment approval) |
| Logout | `/logout` → `/login` |

## 2. Getting started

1. Open the application address given by your Administrator.
2. Sign in with your user name (or mobile number / email) and password. After 5 wrong attempts the account is locked for 15 minutes (default security setting; an Administrator can unlock it).
3. You land on your dashboard. Use the menu (sidebar on desktop, bottom bar on phone) to move between screens.
4. Use the bell icon for notifications and the profile menu to change your password, preferences or to sign out.

## 3. Your daily work

1. Inventory alerts
2. receive goods (Stock Receipt, incl. replenishment receipts)
3. transfers between hubs
4. approve scrap
5. check picking list for today's dispatches

## 4. Screens you use

![UX-WAREHOUSE — captured with the Super Admin demo account (prototype screenshot, demo data)](screenshots/UX-WAREHOUSE.png){width=15cm}

![UX-STOCK — captured with the Super Admin demo account (prototype screenshot, demo data)](screenshots/UX-STOCK.png){width=15cm}

![UX-SCRAP — captured with the Super Admin demo account (prototype screenshot, demo data)](screenshots/UX-SCRAP.png){width=15cm}

## 5. Rules to remember

- Approve orders; dispatch; approve replenishment (Administrator only); manage products or hubs master data
- Work only with the records in your data scope: as configured.
- After your step the next responsible user is: Dispatcher (stock ready for loading); Administrator (replenishment approval).

## 6. Prototype notes

This manual describes the prototype (PROTOTYPE). Data is stored only in your browser; demo markers show simulated
features (GPS, OTP messages, email / WhatsApp). Production behaviour may differ — see [BM-OVW-015 — Project Status and Implementation Summary](../01_PROJECT_OVERVIEW/BM-OVW-015_Project_Status_and_Implementation_Summary.md).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |