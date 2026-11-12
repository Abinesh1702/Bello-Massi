---
id: "BM-FRD-INV"
title: "Functional Requirements — Inventory Management"
folder: "04"
file: "BM-FRD-INV_Inventory_Management"
category: "Functional Requirements"
owner: "Business Analyst"
module: "Inventory Management"
related: [BM-SYS-002, BM-SYS-003, BM-SYS-008, BM-QA-011]
purpose: "Specify the functional requirements of the Inventory Management module as implemented in the prototype and as required for production."
scope: "All screens, rules, statuses and integrations of the Inventory Management module (/inventory/*)."
---
## 1. Module overview

| Item | Value |
|---|---|
| Module code | `INV` |
| Module name | Inventory Management |
| Current implementation status | **Implemented and working (prototype)** |
| Main routes | `/inventory/*` |
| Services / components | `inventoryService` |
| LocalStorage keys (prototype) | `bellomassi_inventory, bellomassi_stock_*` |


## 2. Purpose

Stock per product per hub, receipts, transfers, adjustments, movement ledger, low stock and levels.

## 3. Business objectives

Stock per hub is accurate and every change is traceable.

Related business requirements: BR-018, BR-019.

## 4. User roles

- Administrator
- Inventory Executive
- QA Manager
- Warehouse Manager

## 5. Access permissions

Permission keys (from `src/config/rbacCatalog.js`): `inventory.dashboard`, `inventory.stock.view`, `inventory.movements.view`, `inventory.lowstock.view`, `inventory.receipts.manage`, `inventory.transfers.manage`, `inventory.adjustments.manage`. Default grants per role are in {{ref:BM-SEC-005}}.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| Inventory Dashboard | `/inventory` | `inventory.dashboard` |
| Stock Overview | `/inventory/stock` | `inventory.stock.view` |
| Low Stock | `/inventory/low-stock` | `inventory.lowstock.view` |
| Stock Receipts | `/inventory/stock-receipts` | `inventory.documents.view` |
| Stock Transfers | `/inventory/stock-transfers` | `inventory.documents.view` |
| Stock Adjustments | `/inventory/stock-adjustments` | `inventory.documents.view` |
| Stock Movements | `/inventory/movements` | `inventory.movements.view` |
| Stock Details | `/inventory/stock/:id` | `inventory.stock.view` |
| New Receipt | `/inventory/stock-receipts/create` | `inventory.receipts.manage` |
| New Transfer | `/inventory/stock-transfers/create` | `inventory.transfers.manage` |
| New Adjustment | `/inventory/stock-adjustments/create` | `inventory.adjustments.manage` |

## 7. Functional requirements

| ID | Priority | Requirement | Roles | Label | Implementation status |
|---|---|---|---|---|---|
| FR-INV-001 | P1 | Warehouse users shall record goods receipts that increase hub stock immediately. | Administrator, Warehouse Manager, Inventory Executive | VERIFIED | Implemented and working (prototype) |
| FR-INV-002 | P1 | Warehouse users shall transfer stock between hubs as a draft or completed immediately. | Administrator, Warehouse Manager, Inventory Executive | VERIFIED | Implemented and working (prototype) |
| FR-INV-003 | P1 | Authorised users shall adjust stock (increase, decrease, damaged, lost, correction) with a reason. | Administrator, Warehouse Manager, QA Manager | VERIFIED | Implemented and working (prototype) |
| FR-INV-004 | P1 | Every stock change shall be written to the movement ledger. | Most office roles | VERIFIED | Implemented and working (prototype) |
| FR-INV-005 | P2 | Users shall set minimum, reorder and maximum levels per stock line. | Administrator, Warehouse Manager, Inventory Executive | VERIFIED | Implemented and working (prototype) |
| FR-INV-006 | P1 | Stock cannot go negative unless the product allows it; completed transfers are not posted twice. | Administrator, Warehouse Manager, Inventory Executive | VERIFIED | Implemented and working (prototype) |
| FR-INV-007 | P2 | Batch and expiry tracking per stock line, FEFO picking and cycle counting. | Warehouse Manager | NOT IMPLEMENTED | Not implemented |
| FR-INV-008 | P2 | Stock positions shall be synchronised with SAP in stage two. | Warehouse Manager | PROPOSED | Planned (production) |

## 8. Input fields

Receipt: hub, product, quantity, date, reference · Transfer: source hub, destination hub, product, quantity, date, notes · Adjustment: hub, product, type, direction, quantity, reason, notes · Levels: minimum, reorder, maximum

## 9. Validation rules

- **RULE-032** — Stock cannot be removed beyond available unless the product allows negative stock. _(enforced by `inventoryService.validateAdjustment`; message: "Cannot remove more than…")_
- **RULE-033** — Transfer hubs must differ; the source must hold the quantity at completion. _(enforced by `inventoryService.validateTransfer`; message: "Only N available at…")_
- **RULE-034** — Inactive hubs cannot receive stock. _(enforced by `inventoryService.validateReceipt`; message: "…is inactive and cannot receive stock.")_

## 10. Business rules

- FR-INV-001: expected behaviour — GRN created; Stock Receipt movement.
- FR-INV-002: expected behaviour — Transfer Out / In movements on completion.
- FR-INV-003: expected behaviour — Movement posted immediately.
- FR-INV-004: expected behaviour — Ledger shows type, quantity, reference, user and time.
- FR-INV-005: expected behaviour — Low Stock list uses the reorder level.
- FR-INV-006: expected behaviour — "Only N available…" / "already completed".

## 11. Workflow

See {{ref:BM-WF-13}} and the workflow chapters in `docs/workflow/`.

## 12. Status lifecycle

Transfer Draft → Completed / Cancelled; stock status In Stock / Low Stock / Out of Stock / Overstock. Full lists: {{ref:BM-GLO-003}}.

## 13. Approval rules

No approval step in this module.

## 14. Notifications

Low stock alerts (dashboard, notifications).

## 15. Error scenarios

| Test case | Scenario | Expected |
|---|---|---|
| TC-INV-N01 | Transfer more than available | "Only N … available at …" |
| TC-INV-N02 | Receipt at inactive hub | "…is inactive and cannot receive stock." |

## 16. Exception handling

Services return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.

## 17. Data dependencies

Reads / writes: `bellomassi_inventory, bellomassi_stock_*`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{ref:BM-DAT-002}}.

## 18. Reports

Inventory category (stock on hand, movements, low stock, valuation).

## 19. Audit requirements

Movement ledger (`bellomassi_stock_movements`). Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).

## 20. Acceptance criteria

| Requirement | Acceptance criterion | Test cases |
|---|---|---|
| FR-INV-001 | GRN created; Stock Receipt movement. | TC-INV-001, TC-INV-N02 |
| FR-INV-002 | Transfer Out / In movements on completion. | TC-INV-002 |
| FR-INV-003 | Movement posted immediately. | TC-INV-003 |
| FR-INV-004 | Ledger shows type, quantity, reference, user and time. | TC-INV-004 |
| FR-INV-005 | Low Stock list uses the reorder level. | TC-INV-005 |
| FR-INV-006 | "Only N available…" / "already completed". | TC-INV-006, TC-INV-N01 |
| FR-INV-007 | Settings exist (UI only); not enforced. | TC-INV-007 |
| FR-INV-008 | Stock reconciled with ERP. | TC-INV-008 |

## 21. Current implementation status

**Implemented and working (prototype).** Labels: VERIFIED 6, NOT IMPLEMENTED 1, PROPOSED 1. The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.

## 22. Future enhancement requirements

Batch / expiry tracking, FEFO picking, cycle counts, SAP stock sync, barcode scanning.

- FR-INV-007 (NOT IMPLEMENTED): Batch and expiry tracking per stock line, FEFO picking and cycle counting.
- FR-INV-008 (PROPOSED): Stock positions shall be synchronised with SAP in stage two.
