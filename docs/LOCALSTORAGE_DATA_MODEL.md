# LocalStorage Data Model — Enterprise collections (data v9, v10)

## Migration v9 → v10 (idempotent)

- `order.reservation` = `{ status: RESERVED | PARTIAL | SHORT | CONSUMED | RELEASED, lines: { [orderItemId]: qty }, untracked, reservedAt, updatedAt }`
  (utils/stockReservation.js). `inventory.reservedQuantity` for each product × hub equals the open reservation lines.
  The migration rebuilds reservations from approved / consolidated / ready orders not yet loaded, and releases reserved
  stock no order accounts for. The legacy `order.stockReserved` flag is cleared.
- Roles that hold a former module report permission (`orders.reports`, `dispatch.reports`, `invoices.reports`,
  `documents.reports`, `vms.view`) gain `reports.center`.
- From v10, `customer.creditBalance` is posted by invoices (+), receipts / credit notes (−) and invoice cancellation (−).


All data lives in browser LocalStorage through `storageService` (no other storage). Data version **9**. New keys: 52 collections + 2 objects. Every enterprise record carries: `id` (unique), `number` (document number where the module numbers documents), `status`, `createdAt`, `createdBy`, `createdByName`, `updatedAt`, `updatedBy` and `history[]` (`{ at, by, byName, action, from, to, note }`); create / edit / workflow actions are also written to `bellomassi_audit_logs`.

## Migration v8 → v9 (idempotent)

- Adds the 14 enterprise demo users only if their id, email and username are all free; never changes existing users.
- Adds missing enterprise roles (and the Supplier role's landing page `/supplier` only when it was still the default `/dashboard`).
- Adds missing departments / designations and suppliers `sup-04…06`.
- Seeds each enterprise key **only if it does not exist**, built from the live data so references are real; lots (`bellomassi_batches`) are opened from current inventory with the ledger cursor (`bellomassi_batch_ledger_state`) set to all existing movements.
- A key that later becomes corrupted is rebuilt from the live data, not from a fresh seed. Re-running the app never duplicates data; *Reset demo data* rebuilds everything consistently.

## Collections

### `bellomassi_leads` — Leads

Module `leads` · route `/sales/leads` · number `LEAD-YYYY-NNNNN` · statuses: `NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`

| Field | Type | Required | Notes |
|---|---|---|---|
| `company` | text | yes | Company / outlet |
| `contactName` | text | yes | Contact person |
| `phone` | phone | yes | Phone |
| `email` | email |  | Email |
| `segment` | select | yes | Segment |
| `source` | select | yes | Source |
| `city` | text |  | City |
| `estimatedValue` | money |  | Estimated monthly value |
| `ownerId` | lookup → users | yes | Owner |
| `nextFollowUp` | date |  | Next follow-up |
| `notes` | textarea |  | Notes |

### `bellomassi_opportunities` — Opportunities

Module `opportunities` · route `/sales/opportunities` · number `OPP-YYYY-NNNNN` · statuses: `PROSPECTING`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | yes | Opportunity |
| `customerId` | lookup → customers |  | Customer (if existing) |
| `leadId` | lookup → module:leads |  | Lead |
| `segment` | select |  | Segment |
| `value` | money | yes | Value |
| `probability` | percent | yes | Probability % |
| `expectedClose` | date | yes | Expected close |
| `ownerId` | lookup → users | yes | Owner |
| `competitor` | text |  | Competitor |
| `notes` | textarea |  | Notes |

### `bellomassi_sales_visits` — Sales activities

Module `sales_visits` · route `/sales/activities` · number `ACT-YYYY-NNNNN` · statuses: `PLANNED`, `COMPLETED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `activityType` | select | yes | Type |
| `customerId` | lookup → customers |  | Customer |
| `leadId` | lookup → module:leads |  | Lead |
| `activityDate` | date | yes | Date |
| `purpose` | text | yes | Purpose |
| `ownerId` | lookup → users | yes | Sales person |
| `outcome` | textarea |  | Outcome |

### `bellomassi_sales_targets` — Sales targets

Module `sales_targets` · route `/sales/targets` · number `TGT-YYYY-NNNNN` · statuses: `ACTIVE`, `CLOSED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `ownerId` | lookup → users | yes | Sales person |
| `period` | text | yes | Month (YYYY-MM) |
| `targetValue` | money | yes | Target value |
| `achieved` | money |  | Achieved (calculated) |
| `achievement` | percent |  | Achievement (calculated) |

### `bellomassi_commission_rules` — Commission rules

Module `commission_rules` · route `/sales/commission` · number `COM-YYYY-NNNNN` · statuses: `ACTIVE`, `INACTIVE`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | text | yes | Rule name |
| `segment` | select | yes | Segment |
| `ratePercent` | percent | yes | Commission % |
| `minAchievementPct` | percent | yes | Minimum achievement % |
| `notes` | textarea |  | Notes |

### `bellomassi_price_lists` — Price lists

Module `price_lists` · route `/sales/pricing` · number `PL-YYYY-NNNNN` · statuses: `DRAFT`, `PENDING_APPROVAL`, `ACTIVE`, `REJECTED`, `INACTIVE`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | text | yes | Name |
| `segment` | select | yes | Segment |
| `customerId` | lookup → customers |  | Customer (contract price) |
| `validFrom` | date | yes | Valid from |
| `validTo` | date | yes | Valid to |
| `lines` | lines | yes | Prices — line fields: `productId`, `listPrice`, `price`, `minQty`, `disc` |

### `bellomassi_sales_returns` — Sales returns

Module `sales_returns` · route `/sales/returns` · number `SRN-YYYY-NNNNN` · statuses: `REQUESTED`, `APPROVED`, `RECEIVED`, `CREDITED`, `REJECTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `customerId` | lookup → customers | yes | Customer |
| `orderId` | lookup → orders |  | Original order |
| `hubId` | lookup → hubs | yes | Return to hub |
| `returnDate` | date | yes | Return date |
| `reason` | select | yes | Reason |
| `ownerId` | lookup → users |  | Raised by (system-set) |
| `lines` | lines | yes | Returned items — line fields: `productId`, `quantity`, `unitPrice`, `condition`, `amount` |
| `notes` | textarea |  | Notes |

### `bellomassi_order_change_requests` — Order change requests

Module `order_changes` · route `/sales/order-changes` · number `OCR-YYYY-NNNNN` · statuses: `PENDING`, `APPROVED`, `REJECTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `orderId` | lookup → orders | yes | Order |
| `changeType` | select | yes | Change |
| `requestedValue` | text |  | New value (date YYYY-MM-DD, address or instructions) |
| `reason` | textarea | yes | Reason |
| `ownerId` | lookup → users |  | Requested by (system-set) |

### `bellomassi_service_tickets` — Service tickets

Module `service_tickets` · route `/service/tickets` · number `TKT-YYYY-NNNNN` · statuses: `OPEN`, `IN_PROGRESS`, `ESCALATED`, `RESOLVED`, `CLOSED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `subject` | text | yes | Subject |
| `customerId` | lookup → customers | yes | Customer |
| `orderId` | lookup → orders |  | Order |
| `category` | select | yes | Category |
| `priority` | select | yes | Priority |
| `channel` | select | yes | Channel |
| `assignedTo` | lookup → users |  | Assigned to |
| `slaDueAt` | datetime |  | SLA due (system-set) |
| `description` | textarea | yes | Description |
| `resolution` | textarea |  | Resolution (system-set) |

### `bellomassi_horeca_accounts` — HORECA accounts

Module `horeca_accounts` · route `/horeca` · number `HRC-YYYY-NNNNN` · statuses: `DRAFT`, `PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`, `EXPIRED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `customerId` | lookup → customers | yes | Customer |
| `outletType` | select | yes | Outlet type |
| `outlets` | integer |  | Outlets |
| `chefContact` | text |  | Executive chef |
| `purchaseContact` | text |  | Purchasing contact |
| `accountManagerId` | lookup → users | yes | Account manager |
| `priceListId` | lookup → module:price_lists |  | Contract price list |
| `contractStart` | date | yes | Contract start |
| `contractEnd` | date | yes | Contract end |
| `deliveryWindow` | select | yes | Delivery window |
| `monthlyVolumeTarget` | money |  | Monthly volume target |
| `notes` | textarea |  | Notes |

### `bellomassi_order_templates` — Standing orders

Module `order_templates` · route `/horeca/templates` · number `TPL-YYYY-NNNNN` · statuses: `ACTIVE`, `PAUSED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | text | yes | Template name |
| `customerId` | lookup → customers | yes | Customer |
| `frequency` | select | yes | Frequency |
| `deliveryDay` | select | yes | Delivery day |
| `lastOrderNumber` | text |  | Last order (system-set) |
| `lines` | lines | yes | Items — line fields: `productId`, `quantity` |

### `bellomassi_van_assignments` — Van routes

Module `van_assignments` · route `/van-sales/routes` · number `VAN-YYYY-NNNNN` · statuses: `PLANNED`, `LOADED`, `ON_ROUTE`, `SETTLED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `routeName` | text | yes | Route |
| `routeDate` | date | yes | Date |
| `hubId` | lookup → hubs | yes | Load from hub |
| `vehicleId` | lookup → vehicles | yes | Van |
| `salesExecId` | lookup → users | yes | Van sales executive |
| `lines` | lines | yes | Van load — line fields: `productId`, `loadedQty` |

### `bellomassi_van_sales` — Van sales

Module `van_sales` · route `/van-sales/sales` · number `VS-YYYY-NNNNN` · statuses: `COMPLETED`, `VOIDED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `assignmentId` | lookup → module:van_assignments | yes | Van route |
| `customerId` | lookup → customers | yes | Customer |
| `paymentMode` | select | yes | Payment |
| `salesExecId` | lookup → users |  | Sales executive (system-set) |
| `lines` | lines | yes | Items — line fields: `productId`, `quantity`, `unitPrice`, `amount` |

### `bellomassi_van_settlements` — Van settlements

Module `van_settlements` · route `/van-sales/settlements` · number `VST-YYYY-NNNNN` · statuses: `SUBMITTED`, `APPROVED`, `DISPUTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `assignmentId` | lookup → module:van_assignments |  | Van route |
| `salesExecId` | lookup → users |  | Sales executive |
| `routeDate` | date |  | Route date |
| `salesCount` | integer |  | Sales |
| `salesValue` | money |  | Sales value |
| `expectedCash` | money |  | Expected cash |
| `cashDeposited` | money |  | Cash deposited |
| `variance` | money |  | Variance |

### `bellomassi_purchase_requisitions` — Purchase requisitions

Module `purchase_requisitions` · route `/procurement/requisitions` · number `PR-YYYY-NNNNN` · statuses: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `RFQ_ISSUED`, `PO_CREATED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | yes | Title |
| `hubId` | lookup → hubs | yes | Deliver to hub |
| `requiredBy` | date | yes | Required by |
| `priority` | select | yes | Priority |
| `requestedBy` | lookup → users |  | Requested by (system-set) |
| `justification` | textarea | yes | Justification |
| `lines` | lines | yes | Items — line fields: `productId`, `quantity`, `estimatedPrice`, `amount` |

### `bellomassi_rfqs` — Requests for quotation

Module `rfqs` · route `/procurement/rfqs` · number `RFQ-YYYY-NNNNN` · statuses: `DRAFT`, `ISSUED`, `EVALUATION`, `AWARDED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | yes | Title |
| `requisitionId` | lookup → module:purchase_requisitions |  | Requisition |
| `hubId` | lookup → hubs | yes | Deliver to hub |
| `responseDue` | date | yes | Quotes due |
| `supplierIds` | multilookup → suppliers | yes | Invited suppliers |
| `lines` | lines | yes | Items — line fields: `productId`, `quantity` |

### `bellomassi_supplier_quotes` — Supplier quotes

Module `supplier_quotes` · route `/procurement/quotes` · number `SQ-YYYY-NNNNN` · statuses: `SUBMITTED`, `SHORTLISTED`, `ACCEPTED`, `REJECTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `rfqId` | lookup → module:rfqs | yes | RFQ |
| `supplierId` | lookup → suppliers | yes | Supplier |
| `validUntil` | date | yes | Valid until |
| `leadTimeDays` | integer | yes | Lead time (days) |
| `paymentTerms` | select | yes | Payment terms |
| `incoterm` | select |  | Incoterm |
| `lines` | lines | yes | Prices — line fields: `productId`, `quantity`, `unitPrice`, `amount` |

### `bellomassi_purchase_orders` — Purchase orders

Module `purchase_orders` · route `/procurement/purchase-orders` · number `PO-YYYY-NNNNN` · statuses: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SENT`, `CONFIRMED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CLOSED`, `REJECTED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `supplierId` | lookup → suppliers | yes | Supplier |
| `hubId` | lookup → hubs | yes | Deliver to hub |
| `orderDate` | date | yes | Order date |
| `expectedDate` | date | yes | Expected delivery |
| `currency` | select | yes | Currency |
| `incoterm` | select |  | Incoterm |
| `paymentTerms` | select | yes | Payment terms |
| `requisitionId` | lookup → module:purchase_requisitions |  | Requisition (system-set) |
| `supplierRef` | text |  | Supplier confirmation ref. (system-set) |
| `lines` | lines | yes | Items — line fields: `productId`, `quantity`, `unitPrice`, `taxPercent`, `receivedQty`, `amount` |
| `notes` | textarea |  | Notes |

### `bellomassi_goods_receipts` — Goods receipts (GRN)

Module `goods_receipts` · route `/warehouse/receiving` · number `RCV-YYYY-NNNNN` · statuses: `DRAFT`, `POSTED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `purchaseOrderId` | lookup → module:purchase_orders |  | Purchase order |
| `supplierId` | lookup → suppliers | yes | Supplier |
| `hubId` | lookup → hubs | yes | Receiving hub |
| `receivedDate` | date | yes | Received date |
| `deliveryNoteRef` | text |  | Supplier delivery note |
| `vehicleTemperature` | number |  | Truck temperature (°C) |
| `qaRequired` | boolean |  | Hold for QA inspection |
| `lines` | lines | yes | Received lines — line fields: `productId`, `orderedQty`, `receivedQty`, `rejectedQty`, `batchNumber`, `expiryDate`, `mfgDate`, `locationId`, `unitCost` |
| `notes` | textarea |  | Notes |

### `bellomassi_supplier_invoices` — Supplier invoices

Module `supplier_invoices` · route `/finance/payables/invoices` · number `SINV-YYYY-NNNNN` · statuses: `RECEIVED`, `MATCHED`, `VARIANCE`, `APPROVED`, `PARTIALLY_PAID`, `PAID`, `REJECTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `supplierId` | lookup → suppliers | yes | Supplier |
| `purchaseOrderId` | lookup → module:purchase_orders |  | Purchase order |
| `supplierInvoiceNo` | text | yes | Supplier invoice no. |
| `supplierTrn` | text |  | Supplier TRN |
| `invoiceDate` | date | yes | Invoice date |
| `dueDate` | date | yes | Due date |
| `subtotal` | money | yes | Amount before VAT |
| `vatAmount` | money | yes | VAT |
| `notes` | textarea |  | Notes |

### `bellomassi_supplier_payments` — Supplier payments

Module `supplier_payments` · route `/finance/payables/payments` · number `SPAY-YYYY-NNNNN` · statuses: `DRAFT`, `APPROVED`, `PAID`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `supplierInvoiceId` | lookup → module:supplier_invoices | yes | Supplier invoice |
| `supplierId` | lookup → suppliers | yes | Supplier |
| `amount` | money | yes | Amount |
| `paymentDate` | date | yes | Payment date |
| `method` | select | yes | Method |
| `bankAccountId` | lookup → bankAccounts | yes | Paid from |
| `reference` | text |  | Reference |

### `bellomassi_import_shipments` — Import & export shipments

Module `import_shipments` · route `/import/shipments` · number `SHP-YYYY-NNNNN` · statuses: `BOOKED`, `IN_TRANSIT`, `ARRIVED`, `CUSTOMS`, `CLEARED`, `DELIVERED`, `CLOSED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `direction` | select | yes | Direction |
| `mode` | select | yes | Mode |
| `purchaseOrderId` | lookup → module:purchase_orders |  | Purchase order |
| `supplierId` | lookup → suppliers |  | Supplier / consignee |
| `originPort` | text | yes | Origin port |
| `destinationPort` | text | yes | Destination port |
| `incoterm` | select |  | Incoterm |
| `blNumber` | text |  | B/L / AWB number |
| `containerNumbers` | text |  | Container numbers |
| `containerType` | select |  | Container type |
| `etd` | date | yes | ETD |
| `eta` | date | yes | ETA |
| `ata` | date |  | Actual arrival |
| `customsDeclarationNo` | text |  | Customs declaration no. |
| `docCommercialInvoice` | boolean |  | Commercial invoice |
| `docPackingList` | boolean |  | Packing list |
| `docBillOfLading` | boolean |  | Bill of lading / AWB |
| `docCertificateOfOrigin` | boolean |  | Certificate of origin |
| `docHealthCertificate` | boolean |  | Health certificate |
| `docHalalCertificate` | boolean |  | Halal certificate |
| `freightCost` | money |  | Freight |
| `insuranceCost` | money |  | Insurance |
| `dutyCost` | money |  | Customs duty |
| `clearingCost` | money |  | Clearing & port charges |
| `otherCost` | money |  | Other |
| `allocationBasis` | select | yes | Allocate costs by |
| `lines` | lines | yes | Goods — line fields: `productId`, `quantity`, `weightKg`, `unitValue`, `amount` |
| `notes` | textarea |  | Notes |

### `bellomassi_warehouse_locations` — Warehouse locations

Module `warehouse_locations` · route `/warehouse/locations` · statuses: `ACTIVE`, `BLOCKED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | text | yes | Location code |
| `hubId` | lookup → hubs | yes | Hub |
| `level` | select | yes | Level |
| `parentCode` | text |  | Parent location code |
| `storageType` | select | yes | Storage type |
| `capacityPallets` | integer |  | Capacity (pallets) |
| `occupancy` | integer |  | Lots in location (calculated) |

### `bellomassi_putaway_tasks` — Put-away tasks

Module `putaway_tasks` · route `/warehouse/putaway` · number `PUT-YYYY-NNNNN` · statuses: `OPEN`, `IN_PROGRESS`, `DONE`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `productId` | lookup → products | yes | Product |
| `hubId` | lookup → hubs | yes | Hub |
| `quantity` | number | yes | Quantity |
| `batchNumber` | text |  | Batch |
| `grnId` | lookup → module:goods_receipts |  | Goods receipt |
| `storageType` | select |  | Storage type |
| `toLocationId` | lookup → locations |  | Put into bin |
| `assignedTo` | lookup → users |  | Assigned to |

### `bellomassi_picking_tasks` — Picking

Module `picking_tasks` · route `/warehouse/picking` · number `PICK-YYYY-NNNNN` · statuses: `OPEN`, `PICKING`, `PICKED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `orderId` | lookup → orders | yes | Order |
| `hubId` | lookup → hubs | yes | Hub |
| `method` | select | yes | Method |
| `waveRef` | text |  | Wave |
| `assignedTo` | lookup → users |  | Picker |
| `lines` | lines | yes | Pick lines — line fields: `productId`, `batchId`, `locationId`, `quantity`, `pickedQty` |

### `bellomassi_packing_tasks` — Packing

Module `packing_tasks` · route `/warehouse/packing` · number `PACK-YYYY-NNNNN` · statuses: `OPEN`, `PACKED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `orderId` | lookup → orders | yes | Order |
| `pickingTaskId` | lookup → module:picking_tasks |  | Pick task |
| `hubId` | lookup → hubs | yes | Hub |
| `packageType` | select | yes | Package type |
| `packages` | integer |  | Packages |
| `totalWeightKg` | number |  | Total weight (kg) |
| `labelsPrinted` | boolean |  | Labels printed |

### `bellomassi_loading_tasks` — Loading

Module `loading_tasks` · route `/warehouse/loading` · number `LOAD-YYYY-NNNNN` · statuses: `PLANNED`, `LOADING`, `SEALED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `dispatchId` | lookup → dispatches | yes | Dispatch |
| `vehicleId` | lookup → vehicles | yes | Vehicle |
| `hubId` | lookup → hubs | yes | Hub |
| `plannedQty` | number | yes | Planned quantity |
| `dockDoor` | text |  | Dock door |
| `sealNumber` | text |  | Seal number (system-set) |
| `loadingTemperature` | number |  | Reefer temperature (°C) (system-set) |

### `bellomassi_cycle_counts` — Cycle counts

Module `cycle_counts` · route `/inventory/counts` · number `CC-YYYY-NNNNN` · statuses: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `hubId` | lookup → hubs | yes | Hub |
| `countDate` | date | yes | Count date |
| `scopeNote` | text |  | Scope (zone / category) |
| `lines` | lines | yes | Count sheet — line fields: `productId`, `systemQty`, `countedQty`, `variance` |

### `bellomassi_product_recalls` — Product recalls

Module `product_recalls` · route `/inventory/recalls` · number `RCL-YYYY-NNNNN` · statuses: `DRAFT`, `ACTIVE`, `CLOSED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | yes | Title |
| `productId` | lookup → products | yes | Product |
| `batchIds` | multilookup → batches | yes | Lots |
| `severity` | select | yes | Severity |
| `regulatorRef` | text |  | Authority reference |
| `reason` | textarea | yes | Reason |

### `bellomassi_qa_inspections` — QA inspections

Module `qa_inspections` · route `/qa/inspections` · number `QAI-YYYY-NNNNN` · statuses: `PENDING`, `IN_PROGRESS`, `RELEASED`, `ON_HOLD`, `REJECTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `sourceType` | select | yes | Source |
| `grnId` | lookup → module:goods_receipts |  | Goods receipt |
| `hubId` | lookup → hubs | yes | Hub |
| `productId` | lookup → products |  | Product |
| `batchIds` | multilookup → batches |  | Lots |
| `batchNumbers` | text |  | Batch numbers (GRN) (system-set) |
| `plannedDate` | date | yes | Planned date |
| `inspectorId` | lookup → users |  | Inspector |
| `packagingOk` | boolean |  | Packaging intact |
| `labelOk` | boolean |  | Labels & dates correct |
| `temperatureOk` | boolean |  | Temperature in range |
| `sensoryOk` | boolean |  | Colour / odour / texture OK |
| `documentsOk` | boolean |  | Certificates & documents OK |
| `measuredTemp` | number |  | Measured core temperature (°C) |
| `notes` | textarea |  | Notes |

### `bellomassi_temperature_logs` — Temperature logs

Module `temperature_logs` · route `/qa/temperature` · number `TMP-YYYY-NNNNN` · statuses: `IN_RANGE`, `EXCURSION`, `ACKNOWLEDGED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `hubId` | lookup → hubs | yes | Hub |
| `area` | select | yes | Area |
| `vehicleId` | lookup → vehicles |  | Vehicle (reefer) |
| `reading` | number | yes | Reading (°C) |
| `minAllowed` | number | yes | Min allowed |
| `maxAllowed` | number | yes | Max allowed |
| `recordedAt` | datetime | yes | Recorded at |
| `source` | select | yes | Source |
| `notes` | textarea |  | Notes |

### `bellomassi_nonconformances` — Non-conformance & CAPA

Module `nonconformances` · route `/qa/ncr` · number `NCR-YYYY-NNNNN` · statuses: `OPEN`, `INVESTIGATION`, `CAPA`, `VERIFICATION`, `CLOSED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | yes | Title |
| `sourceType` | select | yes | Source |
| `referenceNumber` | text |  | Reference |
| `productId` | lookup → products |  | Product |
| `supplierId` | lookup → suppliers |  | Supplier |
| `severity` | select | yes | Severity |
| `ownerId` | lookup → users | yes | Owner |
| `dueDate` | date | yes | Due date |
| `description` | textarea | yes | Description |
| `rootCause` | textarea |  | Root cause |
| `correctiveAction` | textarea |  | Corrective action |
| `preventiveAction` | textarea |  | Preventive action |

### `bellomassi_delivery_reschedules` — Delivery reschedules

Module `delivery_reschedules` · route `/logistics/reschedules` · number `RSC-YYYY-NNNNN` · statuses: `REQUESTED`, `APPROVED`, `REJECTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `orderId` | lookup → orders | yes | Order |
| `customerId` | lookup → customers |  | Customer (system-set) |
| `hubId` | lookup → hubs |  | Hub (system-set) |
| `currentDate` | date |  | Current delivery date (system-set) |
| `newDate` | date | yes | New date |
| `newWindow` | select | yes | New window |
| `reason` | select | yes | Reason |
| `driverId` | lookup → drivers |  | Driver |
| `notes` | textarea |  | Notes |

### `bellomassi_route_plans` — Route plans

Module `route_plans` · route `/logistics/routes` · number `RTE-YYYY-NNNNN` · statuses: `DRAFT`, `OPTIMISED`, `PUBLISHED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | text | yes | Route name |
| `routeDate` | date | yes | Date |
| `hubId` | lookup → hubs | yes | Hub |
| `vehicleId` | lookup → vehicles | yes | Vehicle |
| `driverId` | lookup → drivers | yes | Driver |
| `lines` | lines | yes | Stops — line fields: `orderId`, `window`, `sequence`, `eta` |

### `bellomassi_operational_exceptions` — Operational exceptions

Module `operational_exceptions` · route `/operations/exceptions` · number `EXC-YYYY-NNNNN` · statuses: `OPEN`, `ASSIGNED`, `ESCALATED`, `RESOLVED`, `CLOSED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | yes | Title |
| `type` | select | yes | Type |
| `severity` | select | yes | Severity |
| `referenceLabel` | text |  | Reference |
| `link` | text |  | Link |
| `assignedTo` | lookup → users |  | Assigned to |
| `dueAt` | datetime | yes | Resolve by |
| `description` | textarea |  | Description |
| `resolution` | textarea |  | Resolution (system-set) |

### `bellomassi_vehicle_maintenance` — Vehicle maintenance

Module `vehicle_maintenance` · route `/fleet/maintenance` · number `MNT-YYYY-NNNNN` · statuses: `REQUESTED`, `APPROVED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `vehicleId` | lookup → vehicles | yes | Vehicle |
| `jobType` | select | yes | Job type |
| `scheduledDate` | date | yes | Scheduled |
| `odometer` | integer |  | Odometer (km) |
| `vendor` | text |  | Workshop / vendor |
| `estimatedCost` | money | yes | Estimated cost |
| `actualCost` | money |  | Actual cost (system-set) |
| `description` | textarea | yes | Work description |

### `bellomassi_fuel_logs` — Fuel logs

Module `fuel_logs` · route `/fleet/fuel` · number `FUEL-YYYY-NNNNN` · statuses: `SUBMITTED`, `VERIFIED`, `REJECTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `vehicleId` | lookup → vehicles | yes | Vehicle |
| `driverId` | lookup → drivers | yes | Driver |
| `date` | date | yes | Date |
| `odometer` | integer | yes | Odometer (km) |
| `litres` | number | yes | Litres |
| `pricePerLitre` | money | yes | Price / litre |
| `station` | text |  | Station |
| `paymentMode` | select | yes | Paid by |

### `bellomassi_driver_expenses` — Driver expenses

Module `driver_expenses` · route `/drivers/expenses` · number `DEX-YYYY-NNNNN` · statuses: `SUBMITTED`, `APPROVED`, `REJECTED`, `REIMBURSED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `driverId` | lookup → drivers | yes | Driver |
| `expenseType` | select | yes | Type |
| `date` | date | yes | Date |
| `amount` | money | yes | Amount |
| `dispatchId` | lookup → dispatches |  | Dispatch |
| `receiptRef` | text |  | Receipt / bill no. |
| `notes` | textarea |  | Notes |

### `bellomassi_customer_payments` — Customer receipts

Module `customer_payments` · route `/finance/payments` · number `RCPT-YYYY-NNNNN` · statuses: `DRAFT`, `PENDING_DEPOSIT`, `POSTED`, `REVERSED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `customerId` | lookup → customers | yes | Customer |
| `paymentDate` | date | yes | Date |
| `amount` | money | yes | Amount received |
| `method` | select | yes | Method |
| `bankAccountId` | lookup → bankAccounts |  | Deposited to |
| `reference` | text |  | Reference / cheque no. |
| `collectedByDriverId` | lookup → drivers |  | Collected by driver |
| `allocations` | lines |  | Allocate to invoices — line fields: `invoiceId`, `open`, `amount` |

### `bellomassi_credit_notes` — Credit notes

Module `credit_notes` · route `/finance/credit-notes` · number `CN-YYYY-NNNNN` · statuses: `DRAFT`, `APPROVED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `customerId` | lookup → customers | yes | Customer |
| `invoiceId` | lookup → invoices |  | Against invoice |
| `salesReturnId` | lookup → module:sales_returns |  | Sales return (system-set) |
| `date` | date | yes | Date |
| `reason` | text | yes | Reason |
| `amount` | money | yes | Amount before VAT |

### `bellomassi_expenses` — Expenses

Module `expenses` · route `/finance/expenses` · number `EXP-YYYY-NNNNN` · statuses: `SUBMITTED`, `APPROVED`, `PAID`, `REJECTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `category` | select | yes | Category |
| `description` | text | yes | Description |
| `vendor` | text | yes | Vendor |
| `vendorTrn` | text |  | Vendor TRN |
| `date` | date | yes | Date |
| `departmentId` | lookup → departments |  | Department |
| `amount` | money | yes | Amount before VAT |
| `vatApplicable` | boolean |  | VAT applicable |
| `paidFromAccountId` | lookup → bankAccounts |  | Paid from (system-set) |

### `bellomassi_bank_accounts` — Bank & cash accounts

Module `bank_accounts` · route `/finance/cash` · statuses: `ACTIVE`, `INACTIVE`

| Field | Type | Required | Notes |
|---|---|---|---|
| `bankName` | text | yes | Bank / account name |
| `accountType` | select | yes | Type |
| `accountNumber` | text | yes | Account number |
| `iban` | text |  | IBAN |
| `currency` | select | yes | Currency |
| `openingBalance` | money | yes | Opening balance |
| `balance` | money |  | Current balance (calculated) |

### `bellomassi_vouchers` — Vouchers

Module `vouchers` · route `/finance/vouchers` · number `VCH-YYYY-NNNNN` · statuses: `DRAFT`, `APPROVED`, `POSTED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `voucherType` | select | yes | Type |
| `date` | date | yes | Date |
| `bankAccountId` | lookup → bankAccounts | yes | Account |
| `counterparty` | text |  | Counterparty |
| `amount` | money | yes | Amount |
| `narration` | textarea | yes | Narration |

### `bellomassi_cash_closings` — Daily cash closing

Module `cash_closings` · route `/finance/cash-closing` · number `CCL-YYYY-NNNNN` · statuses: `SUBMITTED`, `APPROVED`, `DISPUTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `hubId` | lookup → hubs | yes | Hub |
| `date` | date | yes | Date |
| `openingCash` | money | yes | Opening cash |
| `cashPayments` | money |  | Cash paid out |
| `countedCash` | money | yes | Counted cash |

### `bellomassi_employees` — Employees

Module `employees` · route `/hr/employees` · statuses: `ACTIVE`, `ON_LEAVE`, `PROBATION`, `RESIGNED`, `TERMINATED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | text | yes | Full name |
| `employeeCode` | text | yes | Employee ID |
| `userId` | lookup → users |  | User account |
| `email` | email | yes | Email |
| `phone` | phone |  | Phone |
| `nationality` | text |  | Nationality |
| `joinDate` | date | yes | Join date |
| `employmentType` | select | yes | Employment type |
| `departmentId` | lookup → departments | yes | Department |
| `designationId` | lookup → designations | yes | Designation |
| `branchId` | lookup → branches | yes | Branch |
| `businessUnitId` | lookup → businessUnits |  | Business unit |
| `reportingManagerId` | lookup → employees |  | Reporting manager |
| `workLocationHubId` | lookup → hubs |  | Work location |
| `primaryRole` | lookup → roles |  | Primary role |
| `additionalRoles` | multilookup → roles |  | Additional roles |
| `passportExpiry` | date |  | Passport expiry |
| `visaExpiry` | date |  | Visa expiry |
| `emiratesIdExpiry` | date |  | Emirates ID expiry |
| `labourCardExpiry` | date |  | Labour card expiry |

### `bellomassi_job_requisitions` — Job requisitions

Module `job_requisitions` · route `/hr/recruitment` · number `JR-YYYY-NNNNN` · statuses: `DRAFT`, `PENDING_APPROVAL`, `OPEN`, `FILLED`, `CANCELLED`, `REJECTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | yes | Position |
| `departmentId` | lookup → departments | yes | Department |
| `designationId` | lookup → designations |  | Designation |
| `headcount` | integer | yes | Headcount |
| `employmentType` | select | yes | Employment type |
| `salaryBudget` | money |  | Monthly salary budget |
| `justification` | textarea | yes | Justification |

### `bellomassi_candidates` — Candidates

Module `candidates` · route `/hr/candidates` · statuses: `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFERED`, `HIRED`, `REJECTED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | text | yes | Name |
| `email` | email | yes | Email |
| `phone` | phone |  | Phone |
| `jobRequisitionId` | lookup → module:job_requisitions | yes | Position |
| `source` | select | yes | Source |
| `expectedSalary` | money |  | Expected salary |
| `interviewDate` | date |  | Interview date |
| `rating` | integer |  | Rating (1–5) |
| `notes` | textarea |  | Notes |

### `bellomassi_employee_attendance` — Attendance

Module `employee_attendance` · route `/hr/attendance` · statuses: `PRESENT`, `LATE`, `ABSENT`, `HALF_DAY`, `REGULARISED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `employeeId` | lookup → employees | yes | Employee |
| `date` | date | yes | Date |
| `checkIn` | text |  | Check in (HH:mm) |
| `checkOut` | text |  | Check out (HH:mm) |
| `source` | select | yes | Source |
| `remarks` | text |  | Remarks |

### `bellomassi_leave_requests` — Leave requests

Module `leave_requests` · route `/hr/leave` · number `LV-YYYY-NNNNN` · statuses: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `employeeId` | lookup → employees | yes | Employee |
| `leaveType` | select | yes | Leave type |
| `fromDate` | date | yes | From |
| `toDate` | date | yes | To |
| `reason` | textarea | yes | Reason |

### `bellomassi_salary_structures` — Salary structures

Module `salary_structures` · route `/hr/salary` · statuses: `ACTIVE`, `INACTIVE`

| Field | Type | Required | Notes |
|---|---|---|---|
| `employeeId` | lookup → employees | yes | Employee |
| `effectiveFrom` | date | yes | Effective from |
| `basic` | money | yes | Basic |
| `housing` | money |  | Housing |
| `transport` | money |  | Transport |
| `otherAllowances` | money |  | Other allowances |
| `fixedDeductions` | money |  | Fixed deductions |

### `bellomassi_payroll` — Payroll (demo)

Module `payroll` · route `/hr/payroll` · number `PAY-YYYY-NNNNN` · statuses: `DRAFT`, `CALCULATED`, `APPROVED`, `PAID_DEMO`, `CANCELLED`

| Field | Type | Required | Notes |
|---|---|---|---|
| `period` | text | yes | Month (YYYY-MM) |
| `notes` | textarea |  | Notes |
| `lines` | lines |  | Payslips — line fields: `employeeId`, `gross`, `absentDays`, `absenceDeduction`, `net` (system-set) |

### `bellomassi_batches` — stock lots (batch layer)

`{ id, batchNumber, lotNumber, productId, hubId, locationId, quantity, receivedQuantity, mfgDate, expiryDate, supplierBatch, originCountry, supplierId, grnId, grnNumber, sourceMovement, sourceType, qaStatus: AVAILABLE|QA_HOLD|QUARANTINE|REJECTED, qaHistory[], receivedAt, consumption[{ movementId, movementNumber, type, orderId, orderNumber, qty, at }] }`. Invariant: Σ lot quantity per product × hub = `inventory.totalQuantity` (checked on the Batches page).

### `bellomassi_batch_ledger_state`

`{ processedIds[], unmatched[], transferPool{}, syncedAt }` — which stock movements have been replayed into lots.

### `bellomassi_enterprise_settings`

`{ version, finance: { vatRate (5), matchTolerancePct (1) }, warehouse: { pickingRule: 'FEFO' | 'FIFO' }, approvals: {} }`

## Changes to existing collections

- `bellomassi_inventory` rows gain `qaHoldQuantity` (maintained by batchService, subtracted by `getAvailable`).
- `bellomassi_stock_movements` gain types *Van Stock Load*, *Van Stock Return*, *Sales Return*.
- `bellomassi_orders` may have status `CANCELLED` (+ `cancelledAt`, `cancelReason`, `cancelRequestNumber`), `requestedDeliveryWindow`.
- `bellomassi_customers` may have `creditHold`, `creditHoldReason`, `creditHoldAt`; `creditBalance` changes when receipts / credit notes post.
- `bellomassi_roles` gain `department`; `bellomassi_organization` gains 10 departments and 14 designations; `bellomassi_forecast_settings.suppliers` gains 3 suppliers.

## Django / database migration notes

Each collection maps to one table (plus a child table for each `lines` field and a shared `record_history` table keyed by module + record id). Module definitions translate to DRF serializers (fields, validation) and viewsets with `@action` endpoints for workflow actions; `permissions` map to Django permissions; `scope` maps to queryset filters. Stock movements and lots become two tables with a database transaction per posting (the browser version uses `storage.transaction`).
