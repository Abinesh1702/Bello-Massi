# 02 · Overall Workflow

## 2.1 The business in one paragraph

A **Sales Executive** (or the **customer** in the customer app) raises an order for a customer and a fulfilment hub.
The **Sales Manager** checks credit, stock and data quality and approves, returns or rejects it. **Customer Service**
verifies the approved order against the warehouse and consolidates it, then marks it ready for dispatch. The
**Dispatcher** groups ready orders into a dispatch, assigns a compliant driver and vehicle, and confirms the dispatch —
at that moment hub stock is deducted and a delivery record is created for each order. The **Driver** starts each stop in
sequence, records arrival, collects the customer's OTP, captures quantities and proof of delivery, and completes or fails
the stop. Completing a stop generates a **delivery note**. **Finance** issues the invoice from the order (on ordered or
delivered quantities). Failed and partial deliveries go back to the Dispatcher for review. Around this flow, the
warehouse roles keep stock accurate (receipts, transfers, adjustments, scrap), the QA Manager verifies documents and
watches expiry, and every step raises in-app notifications and optional email / WhatsApp messages.

## 2.2 Master flowchart 1 — Complete application workflow

```mermaid
flowchart TD
    START([User signs in - office, driver or customer app]) --> DASH[Role dashboard with period filter]
    DASH --> SUP["Supporting work: master data, inventory, VMS, documents, communication"]
    DASH --> ORD[Sales Executive creates order]
    DASH --> CORD[Customer places order in the app]
    ORD --> SUB[SUBMITTED - approval PENDING]
    CORD --> SUB
    SUB --> APR{Sales Manager decision}
    APR -->|Return| RET[RETURNED - salesman corrects and resubmits]
    RET --> SUB
    APR -->|Reject| REJ([REJECTED - closed])
    APR -->|Approve| APP[APPROVED]
    APP --> CONS[Customer Service: 5 checks, consolidate]
    CONS --> RDY[READY_FOR_DISPATCH]
    RDY --> PLAN[Dispatcher plans dispatch: orders, zone, date, sequence]
    PLAN --> ASG[Assign compliant driver and vehicle]
    ASG --> CONF[Confirm dispatch: stock deducted, deliveries created - DISPATCHED]
    CONF --> START2[Driver starts stop - OUT_FOR_DELIVERY, DEMO GPS]
    START2 --> ARR[Reach location - OTP issued, simulated]
    ARR --> OTP{OTP correct?}
    OTP -->|No - retry| ARR
    OTP -->|Yes| QTY{All quantities delivered?}
    QTY -->|Yes| DEL[DELIVERED + delivery note]
    QTY -->|No| PDEL[PARTIALLY_DELIVERED + delivery note]
    START2 -->|Problem| FAIL[DELIVERY_FAILED]
    FAIL --> REV[Dispatcher reviews exception]
    PDEL --> REV
    REV -->|Return stock| RTH([RETURNED_TO_HUB])
    REV -->|Return and re-queue| RDY
    DEL --> INVC[Finance issues invoice]
    PDEL --> INVC
    INVC --> CUSTDOC([Customer sees delivery note and invoice])
    INVC --> RPT([Dashboards and Reports Center])
```

## 2.3 Swimlane — who does what

```mermaid
flowchart TD
    subgraph SALES[Sales Executive]
        S1[Create order / draft] --> S2[Submit order]
        S5[Correct and resubmit]
    end
    subgraph SM[Sales Manager]
        M1{Review checks} -->|Approve| M2[Approved]
        M1 -->|Return| M3[Returned]
        M1 -->|Reject| M4[Rejected]
    end
    subgraph WCS[Warehouse / Customer Service]
        W1[Verify and consolidate] --> W2[Mark ready for dispatch]
        W3[Receipts, transfers, adjustments, scrap]
    end
    subgraph DSP[Dispatch]
        D1[Plan dispatch] --> D2[Assign driver and vehicle] --> D3[Confirm - stock deducted]
        D4[Review failed / partial delivery]
    end
    subgraph DRV[Driver]
        R1[Start delivery] --> R2[Reach location] --> R3[Enter OTP, quantities, POD]
        R4[Report failure]
    end
    subgraph CUS[Customer]
        C1[Place order in app]
        C2[Track delivery, share OTP]
        C3[View delivery note and invoice]
    end
    subgraph FIN[Finance]
        F1[Issue invoice] --> F2[Monitor credit and outstanding]
    end

    C1 --> M1
    S2 --> M1
    M3 --> S5 --> M1
    M2 --> W1
    W2 --> D1
    D3 --> R1
    R1 --> C2
    R2 --> C2
    R3 --> C3
    R4 --> D4
    R3 --> F1
    M2 --> F1
    F1 --> C3
```

## 2.4 Stages, owners and system effects

| # | Stage | Owner role | Route | Service function | Resulting order status | Notifications |
|---|---|---|---|---|---|---|
| 1 | Create / save draft | Sales Executive, Administrator | `/orders/create` | `orderService.createOrder` | DRAFT | — |
| 2 | Submit | Sales Executive, Administrator, Customer (app) | `/orders/create`, `/customer/cart` | `orderService.submitOrder`, `customerAppService.placeCustomerOrder` | SUBMITTED (approval PENDING) | Sales Manager; event ORDER_CREATED |
| 3a | Approve | Sales Manager | `/orders/approval/:id` | `approvalService.approveOrder` | APPROVED (consolidation PENDING) | Customer Service, salesman; event ORDER_APPROVED |
| 3b | Return for correction | Sales Manager | `/orders/approval/:id` | `approvalService.returnOrderForCorrection` | RETURNED | Salesman (link to edit) |
| 3c | Reject | Sales Manager | `/orders/approval/:id` | `approvalService.rejectOrder` | REJECTED | Salesman; event ORDER_REJECTED |
| 4 | Consolidate | Customer Service | `/orders/consolidation/:id` | `consolidationService.consolidateOrder` | CONSOLIDATED | Dispatcher |
| 5 | Ready for dispatch | Customer Service | `/orders/consolidation/:id` | `consolidationService.markReadyForDispatch` | READY_FOR_DISPATCH | Dispatcher; event ORDER_READY |
| 6 | Plan dispatch | Dispatcher, Administrator | `/dispatch/create` | `dispatchService.createDispatch` | (order linked to dispatch) | — |
| 7 | Assign driver & vehicle | Dispatcher, Administrator | `/dispatch/assignments`, `/dispatch/:id` | `dispatchService.assignDispatch` | — | Driver; event DISPATCH_ASSIGNED |
| 8 | Confirm dispatch | Dispatcher, Administrator | `/dispatch/:id` | `dispatchService.confirmDispatch` | DISPATCHED | Driver, Administrator |
| 9 | Start delivery | Driver | `/driver/deliveries/:id` | `deliveryService.startDelivery` | OUT_FOR_DELIVERY | Customer, Dispatcher; event DELIVERY_STARTED |
| 10 | Reach location | Driver | `/driver/deliveries/:id` | `deliveryService.markArrived` | OUT_FOR_DELIVERY (arrivedAt set, OTP issued) | Customer sees OTP |
| 11a | Complete | Driver | `/driver/deliveries/:id/confirm` | `deliveryService.confirmDelivery` | DELIVERED or PARTIALLY_DELIVERED | Customer, Dispatcher; event DELIVERY_COMPLETED |
| 11b | Fail | Driver | `/driver/deliveries/:id` | `deliveryService.failDelivery` | DELIVERY_FAILED | Administrator, Dispatcher, customer; event DELIVERY_FAILED |
| 12 | Review exception | Dispatcher, Administrator | `/dispatch/deliveries/:id` | `deliveryService.reviewDelivery` | RETURNED_TO_HUB or READY_FOR_DISPATCH (re-queue) | — |
| 13 | Invoice | Finance, Administrator | `/invoices/create` | `invoiceService.generateInvoice` | (order unchanged; invoice ISSUED) | event INVOICE_GENERATED |

## 2.5 Supporting workflows

| Workflow | Owner | Chapter |
|---|---|---|
| Stock receipt, transfer, adjustment, movement ledger | Warehouse Manager, Inventory Executive, QA Manager (adjustments) | 10 |
| Scrap request → approval → write-off | Warehouse roles / Dispatcher (request); Warehouse Manager / Administrator (approve) | 07, 10 |
| Replenishment draft → approval → goods receipt | Warehouse / Inventory / Dispatcher (draft); Administrator (approve) | 07, 10 |
| Vehicle and driver compliance (VMS) | Administrator; Dispatcher views | 11 |
| Documents and OCR review | Uploaders; Customer Service, QA Manager, Administrator review | 13 |
| Email, WhatsApp, automated notifications, call log | Sales, CS, Dispatch, Finance, Administrator | 13 |
| Dashboards, reports, forecasting, AI assistant | All office roles (by permission) | 14 |
| Users, roles, permissions, settings, audit | Super Admin, Administrator | 04, 05 |

## 2.6 Key rules that hold across the whole flow

- **One step at a time.** Each service refuses an action when the record is not in the expected status (for example,
  a dispatch can only be confirmed when it is `ASSIGNED`; a delivery can only be completed when it is
  `OUT_FOR_DELIVERY`).
- **Permissions are checked twice** — the route (`ProtectedRoute` + `navigation.js` permission) and the service
  (`can(user, key)`), so a hidden button cannot be bypassed.
- **Stock moves exactly once.** Dispatch confirmation deducts stock once (`stockDeducted` flag); cancellation reverses
  it once (`stockReversed`); a reviewed exception returns stock once (`returnedToHub`); a scrap request writes off once.
- **Everything is traceable.** Orders have a timeline (`bellomassi_order_timeline`), dispatches have a timeline
  (`bellomassi_dispatch_timeline`), administrative changes go to the audit log (`bellomassi_audit_logs`) and user
  activity to `bellomassi_activities`.
- **Nothing is deleted after submission.** Only draft orders can be deleted; submitted orders are kept for the audit
  trail.
