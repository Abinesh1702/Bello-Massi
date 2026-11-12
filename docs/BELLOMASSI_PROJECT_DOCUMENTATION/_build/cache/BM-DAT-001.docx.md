---
title: "Current Prototype Data Model (LocalStorage)"
subtitle: "Bellomassi Order-to-Delivery Management Platform"
author: "BM-DAT-001 · Version 1.0 · Draft — for client review"
date: "2026-11-12"
---

## Document control

| Field | Value |
|---|---|
| Document title | Current Prototype Data Model (LocalStorage) |
| Document ID | BM-DAT-001 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Database and Data Design |
| Related module(s) | All modules |
| Document owner | Solution Architect |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Document exactly how the prototype stores data: keys, objects, relationships, mock data, persistence, reset behaviour and limitations.

## Scope

All 74 LocalStorage keys of data version 8 (VERIFIED by seeding the application in a test harness).

## Definitions

Other terms: see **BM-GLO-001** (Project Glossary).

## References

- **BM-DAT-007** (Prototype Storage Dictionary)
- **BM-DAT-002** (Proposed Production Database Design)
- **BM-ARC-002** (Low-Level Design (LLD))

## Contents

- 1. Storage approach — VERIFIED
- 2. Key catalogue
- 3. Relationships between stored objects
- 4. Main object structures
- 5. Mock data
- 6. State persistence and update mechanism
- 7. Data reset behaviour
- 8. Prototype limitations

## 1. Storage approach — VERIFIED

- All data is stored in the browser's **LocalStorage** under keys prefixed `bellomassi_` (session optionally in sessionStorage).
- `src/services/storageService.js` is the only module that reads or writes storage: JSON parsing with fallbacks, read cache, change subscriptions (`useSyncExternalStore`), cross-tab `storage` events, multi-key **transactions**, data **versioning and migration** (current `APP_DATA_VERSION` = 8), seeding on first load, export / import with validation, reset to demo data and a usage report.
- Seeded demo dataset: **74 keys, ≈1025 KB**. Browser quota is typically ≈5 MB per origin.
- Nothing is shared between browsers or users: every device has its own copy of the data.

## 2. Key catalogue

| Key | Area | Shape | Seed records | Size (bytes) | Fields |
|---|---|---|---|---|---|
| `bellomassi_activities` | Session & app | array | 15 | 3692 | 8 |
| `bellomassi_ai_activity` | AI & planning | array | 0 | 2 | 0 |
| `bellomassi_ai_conversations` | AI & planning | array | 0 | 2 | 0 |
| `bellomassi_ai_insights` | AI & planning | array | 18 | 16089 | 18 |
| `bellomassi_ai_messages` | AI & planning | array | 0 | 2 | 0 |
| `bellomassi_ai_models` | AI & planning | array | 12 | 4236 | 13 |
| `bellomassi_ai_settings` | AI & planning | object | — | 312 | 17 |
| `bellomassi_app_version` | Session & app | object | — | 128 | 4 |
| `bellomassi_approvals` | Orders | array | 35 | 11024 | 12 |
| `bellomassi_audit_logs` | Administration | array | 1 | 271 | 11 |
| `bellomassi_call_history` | Communication | array | 26 | 25590 | 31 |
| `bellomassi_communication_settings` | Communication | object | — | 48 | 2 |
| `bellomassi_company` | Administration | object | — | 630 | 22 |
| `bellomassi_consolidations` | Orders | array | 29 | 21689 | 15 |
| `bellomassi_customer_carts` | Customer app & reports | object | — | 2 | 0 |
| `bellomassi_customers` | Master data | array | 20 | 16279 | 34 |
| `bellomassi_deliveries` | Dispatch & delivery | array | 21 | 42945 | 45 |
| `bellomassi_delivery_notes` | Dispatch & delivery | array | 17 | 26922 | 30 |
| `bellomassi_delivery_otps` | Dispatch & delivery | array | 17 | 4489 | 11 |
| `bellomassi_delivery_pod` | Dispatch & delivery | array | 0 | 2 | 0 |
| `bellomassi_delivery_sequence` | Dispatch & delivery | object | — | 29 | 2 |
| `bellomassi_demo_data` | Session & app | object | — | 284 | 2 |
| `bellomassi_demo_users` | Session & app | array | 13 | 6916 | 22 |
| `bellomassi_dispatch_sequence` | Dispatch & delivery | object | — | 29 | 2 |
| `bellomassi_dispatch_timeline` | Dispatch & delivery | array | 185 | 59710 | 12 |
| `bellomassi_dispatch_zones` | Master data | array | 8 | 3505 | 14 |
| `bellomassi_dispatches` | Dispatch & delivery | array | 20 | 38645 | 34 |
| `bellomassi_document_types` | VMS & documents | array | 21 | 8869 | 16 |
| `bellomassi_documents` | VMS & documents | array | 65 | 87531 | 32 |
| `bellomassi_driver_tracking` | Dispatch & delivery | object | — | 776 | 1 |
| `bellomassi_drivers` | Master data | array | 8 | 4163 | 19 |
| `bellomassi_email_drafts` | Communication | array | 2 | 1117 | 16 |
| `bellomassi_email_history` | Communication | array | 7 | 5112 | 21 |
| `bellomassi_email_inbox` | Communication | array | 7 | 2807 | 12 |
| `bellomassi_email_settings` | Communication | object | — | 409 | 7 |
| `bellomassi_email_templates` | Communication | array | 9 | 3446 | 9 |
| `bellomassi_forecast_settings` | AI & planning | object | — | 790 | 22 |
| `bellomassi_forecasts` | AI & planning | array | 2 | 16504 | 35 |
| `bellomassi_hubs` | Master data | array | 6 | 3300 | 20 |
| `bellomassi_inventory` | Inventory | array | 130 | 28507 | 10 |
| `bellomassi_inventory_predictions` | AI & planning | object | — | 186956 | 6 |
| `bellomassi_invoice_settings` | Invoices | object | — | 95 | 6 |
| `bellomassi_invoice_templates` | Invoices | array | 3 | 6468 | 28 |
| `bellomassi_invoices` | Invoices | array | 5 | 29156 | 31 |
| `bellomassi_jarvis_history` | AI & planning | array | 0 | 2 | 0 |
| `bellomassi_jarvis_settings` | AI & planning | object | — | 245 | 13 |
| `bellomassi_notification_history` | Communication | array | 3 | 934 | 12 |
| `bellomassi_notification_preferences` | Session & app | object | — | 2 | 0 |
| `bellomassi_notification_templates` | Communication | array | 11 | 2616 | 8 |
| `bellomassi_notifications` | Session & app | array | 19 | 5537 | 9 |
| `bellomassi_ocr_results` | VMS & documents | array | 63 | 26930 | 10 |
| `bellomassi_openwa_settings` | Communication | object | — | 245 | 10 |
| `bellomassi_order_sequence` | Orders | object | — | 52 | 3 |
| `bellomassi_order_timeline` | Orders | array | 231 | 71617 | 10 |
| `bellomassi_orders` | Orders | array | 41 | 128493 | 73 |
| `bellomassi_organization` | Administration | object | — | 9763 | 5 |
| `bellomassi_permissions` | Administration | object | — | 2169 | 3 |
| `bellomassi_products` | Master data | array | 30 | 18769 | 27 |
| `bellomassi_reorder_recommendations` | AI & planning | array | 11 | 7639 | 32 |
| `bellomassi_replenishment_drafts` | AI & planning | array | 1 | 1384 | 19 |
| `bellomassi_report_prefs` | Customer app & reports | object | — | 2 | 0 |
| `bellomassi_roles` | Administration | array | 13 | 15080 | 16 |
| `bellomassi_sales_history` | AI & planning | object | — | 14828 | 12 |
| `bellomassi_scrap_requests` | Inventory | array | 12 | 21147 | 39 |
| `bellomassi_settings` | Session & app | object | — | 110 | 4 |
| `bellomassi_stock_adjustments` | Inventory | array | 10 | 3099 | 12 |
| `bellomassi_stock_movements` | Inventory | array | 62 | 23351 | 18 |
| `bellomassi_stock_receipts` | Inventory | array | 28 | 8173 | 11 |
| `bellomassi_stock_transfers` | Inventory | array | 9 | 3211 | 13 |
| `bellomassi_theme` | Session & app | string | — | 7 | 0 |
| `bellomassi_vehicles` | Master data | array | 11 | 8705 | 28 |
| `bellomassi_vms_settings` | VMS & documents | object | — | 185 | 6 |
| `bellomassi_whatsapp_messages` | Communication | array | 6 | 3235 | 18 |
| `bellomassi_whatsapp_templates` | Communication | array | 9 | 2678 | 8 |

## 3. Relationships between stored objects

Relationships are held as ID references (no referential integrity in the browser); services check existence when they read.

| From | To | Reference | Cardinality |
|---|---|---|---|
| `orders` | `customers` | `customerId` | n:1 |
| `orders` | `demo_users` | `salesmanId / createdBy` | n:1 |
| `orders` | `hubs` | `hubId` | n:1 |
| `orders.items` | `products` | `productId` | n:1 |
| `approvals` | `orders` | `orderId` | n:1 |
| `consolidations` | `orders` | `orderId` | 1:1 |
| `order_timeline` | `orders` | `orderId` | n:1 |
| `dispatches` | `orders` | `orderIds[]` | 1:n |
| `dispatches` | `drivers` | `driverId` | n:1 |
| `dispatches` | `vehicles` | `vehicleId` | n:1 |
| `dispatches` | `dispatch_zones` | `zoneId` | n:1 |
| `deliveries` | `dispatches` | `dispatchId` | n:1 |
| `deliveries` | `orders` | `orderId` | n:1 |
| `delivery_otps` | `deliveries` | `deliveryId` | n:1 |
| `delivery_notes` | `deliveries` | `deliveryId` | 1:1 |
| `delivery_pod` | `deliveries` | `deliveryId` | 1:1 |
| `driver_tracking` | `deliveries` | `sessions[].deliveryId` | 1:1 |
| `customers` | `hubs` | `hubId` | n:1 |
| `customers` | `dispatch_zones` | `zoneId` | n:1 |
| `dispatch_zones` | `hubs` | `hubId` | n:1 |
| `drivers` | `demo_users` | `userId` | 1:1 |
| `demo_users` | `customers` | `customerId` | n:1 |
| `inventory` | `products` | `productId` | n:1 |
| `inventory` | `hubs` | `hubId` | n:1 |
| `stock_movements` | `inventory` | `hubId + productId` | n:1 |
| `scrap_requests` | `inventory` | `hubId + productId` | n:1 |
| `documents` | `document_types` | `typeId` | n:1 |
| `documents` | `(any entity)` | `entityType + entityId` | n:1 |
| `ocr_results` | `documents` | `documentId` | n:1 |
| `invoices` | `orders` | `orderId` | n:1 |
| `invoices` | `invoice_templates` | `templateId` | n:1 |
| `call_history` | `customers` | `customerId` | n:1 |
| `replenishment_drafts` | `forecast_settings.suppliers` | `supplierId` | n:1 |

## 4. Main object structures

Field lists below come from the seeded data (types inferred). The full list for every key is in **BM-DAT-007** (Prototype Storage Dictionary).

### `bellomassi_orders`

`dispatchId` (string), `deliveryId` (string), `vehicleId` (string), `dispatchedAt` (string), `outForDeliveryAt` (string), `deliveryNoteId` (string), `deliveryNoteNumber` (string), `id` (string), `orderNumber` (string), `orderDate` (string), `orderSource` (string), `customerId` (string), `customerName` (string), `customerCode` (string), `salesmanId` (string), `salesmanName` (string), `hubId` (string), `hubName` (string), `zoneId` (string), `orderType` (string), `orderPriority` (string), `deliveryAddress` (string), `deliveryCity` (string), `deliveryState` (string), `deliveryPincode` (string), `requestedDeliveryDate` (string), `deliveryInstructions` (string), `paymentTerms` (string), `creditDays` (number), `customerReference` (string), `notes` (string), `items` (array<object>), `subtotal` (number), `discountAmount` (number), `taxAmount` (number), `totalAmount` (number), `totalQuantity` (number), `lineCount` (number), `orderStatus` (string), `approvalStatus` (string), `consolidationStatus` (string), `creditWarning` (boolean), `stockWarning` (boolean), `resubmissionCount` (number), `duplicatedFrom` (null), `createdAt` (string), `updatedAt` (string), `createdBy` (string), `updatedBy` (string), `submittedAt` (string), `submittedBy` (string), `approvedAt` (string), `approvedBy` (string), `approvalRemarks` (string), `rejectedAt` (string), `rejectedBy` (string), `rejectionReason` (string), `rejectionRemarks` (string), `returnedAt` (string), `returnedBy` (string), `returnReason` (string), `returnRemarks` (string), `consolidatedAt` (string), `consolidatedBy` (string), `consolidationId` (string), `readyForDispatchAt` (string), `readyForDispatchBy` (string), `driverId` (string), `deliveryDate` (string), `deliveredAt` (string), `onTime` (boolean), `stockReserved` (boolean), `requestedDeliveryTime` (string)

### `bellomassi_dispatches`

`id` (string), `dispatchNumber` (string), `dispatchDate` (string), `hubId` (string), `zoneId` (string), `driverId` (string), `driverName` (string), `vehicleId` (string), `vehicleNumber` (string), `orderIds` (array<string>), `totalDeliveries` (number), `totalProducts` (number), `totalQuantity` (number), `totalValue` (number), `status` (string), `notes` (string), `createdBy` (string), `createdAt` (string), `updatedAt` (string), `assignedAt` (string), `assignedBy` (string), `confirmedAt` (string), `confirmedBy` (string), `startedAt` (string), `completedAt` (string), `cancelledAt` (null), `cancelledBy` (null), `cancelReason` (string), `cancelRemarks` (string), `stockDeducted` (boolean), `stockDeductedAt` (string), `stockSnapshot` (array<object>), `stockReversed` (boolean), `reversalMovementIds` (array<any>)

### `bellomassi_deliveries`

`id` (string), `dispatchId` (string), `dispatchNumber` (string), `orderId` (string), `orderNumber` (string), `customerId` (string), `customerName` (string), `customerMobile` (string), `contactPerson` (string), `deliveryAddress` (string), `city` (string), `pincode` (string), `instructions` (string), `priority` (string), `hubId` (string), `zoneId` (string), `driverId` (string), `vehicleId` (string), `sequence` (number), `status` (string), `items` (array<object>), `totalQuantity` (number), `totalAmount` (number), `attempt` (number), `startedAt` (string), `startedBy` (string), `completedAt` (string), `completedBy` (string), `failedAt` (string), `failureReason` (string), `failureRemarks` (string), `otpStatus` (string), `otpVerifiedAt` (string), `receivedBy` (string), `remarks` (string), `deliveryNoteId` (string), `deliveryNoteNumber` (string), `reviewStatus` (string), `reviewedAt` (null), `reviewedBy` (null), `reviewRemarks` (string), `returnedToHub` (boolean), `returnMovementIds` (array<any>), `createdAt` (string), `updatedAt` (string)

### `bellomassi_customers`

`id` (string), `code` (string), `name` (string), `businessName` (string), `type` (string), `category` (string), `contactPerson` (string), `mobile` (string), `altMobile` (string), `email` (string), `gstNumber` (string), `panNumber` (string), `addressLine1` (string), `addressLine2` (string), `city` (string), `state` (string), `pincode` (string), `country` (string), `status` (string), `customerSince` (string), `salesRepId` (string), `hubId` (string), `zoneId` (string), `notes` (string), `creditEnabled` (boolean), `creditLimit` (number), `creditBalance` (number), `creditDays` (number), `isVip` (boolean), `vipPassEnabled` (boolean), `vipPassNumber` (string), `vipPassExpiry` (string), `createdAt` (string), `updatedAt` (string)

### `bellomassi_products`

`id` (string), `code` (string), `sku` (string), `barcode` (string), `name` (string), `category` (string), `brand` (string), `description` (string), `status` (string), `unit` (string), `packSize` (string), `productType` (string), `storageCondition` (string), `sellingPrice` (number), `purchasePrice` (number), `taxPercent` (number), `discountAllowed` (boolean), `maxDiscountPercent` (number), `trackInventory` (boolean), `minStockLevel` (number), `reorderLevel` (number), `maxStockLevel` (number), `allowNegativeStock` (boolean), `image` (null), `notes` (string), `createdAt` (string), `updatedAt` (string)

### `bellomassi_inventory`

`id` (string), `productId` (string), `hubId` (string), `totalQuantity` (number), `reservedQuantity` (number), `damagedQuantity` (number), `minimumStock` (number), `reorderLevel` (number), `maximumStock` (number), `lastUpdated` (string)

### `bellomassi_scrap_requests`

`id` (string), `scrapNumber` (string), `status` (string), `productId` (string), `productName` (string), `productCode` (string), `category` (string), `unit` (string), `batchNumber` (string), `hubId` (string), `hubName` (string), `warehouseId` (null), `stockSource` (string), `quantity` (number), `unitCost` (number), `value` (number), `reason` (string), `remarks` (string), `photos` (array<any>), `documents` (array<any>), `requestDate` (string), `requestedBy` (string), `requestedByName` (string), `createdAt` (string), `updatedAt` (string), `submittedAt` (string), `approvedBy` (string), `approvedByName` (string), `approvedAt` (string), `approvalRemarks` (string), `rejectedBy` (string), `rejectedByName` (string), `rejectedAt` (string), `rejectionReason` (string), `writeOff` (object), `cancelledAt` (string), `cancelReason` (string), `demo` (boolean), `history` (array<object>)

### `bellomassi_documents`

`id` (string), `documentNumberRef` (string), `name` (string), `typeId` (string), `typeCode` (string), `entityType` (string), `entityId` (string), `entityLabel` (string), `documentNumber` (string), `issueDate` (string), `expiryDate` (string), `status` (string), `fileId` (null), `fileName` (string), `fileType` (string), `fileSize` (number), `storage` (string), `demoRecord` (boolean), `ocrProvider` (string), `ocrFields` (object), `ocrOriginal` (object), `ocrProcessedAt` (string), `verifiedBy` (string), `verifiedAt` (string), `rejectedBy` (string), `rejectedAt` (string), `reviewRemarks` (string), `remarks` (string), `uploadedBy` (string), `uploadedAt` (string), `updatedAt` (string), `history` (array<object>)

### `bellomassi_invoices`

`id` (string), `invoiceNumber` (string), `sequence` (number), `status` (string), `invoiceDate` (string), `dueDate` (string), `orderId` (string), `orderNumber` (string), `customerId` (string), `hubId` (string), `dispatchId` (string), `dispatchNumber` (string), `deliveryNoteId` (string), `deliveryNoteNumber` (string), `quantityBasis` (string), `templateId` (string), `templateVersion` (number), `templateSnapshot` (object), `customerSnapshot` (object), `hubSnapshot` (object), `calculationInput` (object), `totals` (object), `notes` (string), `demoTax` (boolean), `createdBy` (string), `createdByName` (string), `createdAt` (string), `cancelledAt` (null), `cancelledBy` (null), `cancelReason` (string), `emailedAt` (null)

### `bellomassi_demo_users`

`id` (string), `employeeId` (string), `name` (string), `email` (string), `username` (string), `role` (string), `additionalRoles` (array<any>), `title` (string), `phone` (string), `department` (string), `designation` (string), `avatarColor` (string), `avatarImage` (null), `hubId` (string), `customerId` (string), `supplierId` (string), `status` (string), `passwordHash` (string), `mustChangePassword` (boolean), `createdAt` (string), `createdBy` (string), `lastLoginAt` (null)

## 5. Mock data

Seed modules in `src/services/seed/` (`demoSeed`, `adminSeed`, `masterDataSeed`, `orderSeed`, `dispatchSeed`, `phase5Seed`, `phase6Seed`, `completionSeed`) create demo users, 20 customers, 30 products, 6 hubs, 8 zones, 8 drivers, 11 vehicles, 41 orders across all statuses, 20 dispatches, 21 deliveries, documents, invoices, messages, forecasts and insights. Dates are generated relative to "today" so the demo always looks current.

## 6. State persistence and update mechanism

| Mechanism | Behaviour |
|---|---|
| Write | Services call `setItem` / `transaction`; subscribers re-render |
| Read | `getItem` with cache; hooks use `useSyncExternalStore` |
| Cross-tab | `storage` event updates other tabs of the same browser |
| Session | `bellomassi_session` in localStorage ("Keep me signed in") or sessionStorage |
| Failure | If storage is blocked the app runs in memory and reports a storage issue; corrupted keys fall back to defaults |

## 7. Data reset behaviour

- **Reset demo data** (Administrator) re-seeds all business keys; AI data has its own reset.
- Clearing the browser's site data deletes everything; the next load seeds fresh demo data.
- **Export / import**: JSON export of all keys; import validates the payload and version before replacing data.
- Version upgrade: older snapshots are migrated forward step by step (e.g. v7 → v8 added scrap, calls, tracking, POD, carts, report preferences).

## 8. Prototype limitations

- Single-browser data; no concurrency control between users; no server-side validation.
- Images (POD, documents) stored as downscaled data URLs — limited by the ≈5 MB quota.
- No referential integrity, indexes or query language; reports scan arrays in memory.
- Passwords stored as a demo FNV-1a hash; demo passwords are published.
- No backups beyond manual export.
- Not suitable for production data — see **BM-DAT-002** (Proposed Production Database Design) and **BM-DAT-004** (Data Migration Strategy).

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |