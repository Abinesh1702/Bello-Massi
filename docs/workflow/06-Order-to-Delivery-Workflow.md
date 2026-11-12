# 06 · Order-to-Delivery Workflow

**Status:** Implemented end to end. GPS tracking and the delivery OTP are **Simulated** (no GPS device, no SMS).

## 6.1 Business summary

1. An order is raised by a **Sales Executive** (`/orders/create`) or by the **customer** (`/customer/cart`).
2. The **Sales Manager** approves it (or returns / rejects it).
3. **Customer Service** consolidates it after a five-point verification and marks it ready for dispatch.
4. The **Dispatcher** puts it on a dispatch with other orders for the same hub and date, assigns a compliant driver and
   vehicle, and confirms the dispatch. Stock leaves the hub at this moment.
5. The **Driver** delivers it in sequence: start → reach location → OTP → quantities and proof → complete (or fail).
6. A **delivery note** is generated; **Finance** issues the **invoice**; the **customer** sees both in the customer app.

## 6.2 Master flowchart 3 — Order-to-delivery

```mermaid
flowchart TD
    A([Customer need]) --> B{Who raises the order?}
    B -->|Sales Executive| C["Create order /orders/create"]
    B -->|Customer| D["Cart /customer/cart - Place order"]
    C --> E{Save draft or submit?}
    E -->|Save draft| F[DRAFT - editable, deletable]
    F --> E
    E -->|Submit| G[SUBMITTED - approval PENDING]
    D --> G
    G --> H{Sales Manager: approval checks}
    H -->|Blocking check fails| H1[Cannot approve - fix data]
    H -->|Return| I[RETURNED] --> J[Salesman edits and resubmits] --> G
    H -->|Reject| K([REJECTED - closed])
    H -->|Approve - warnings acknowledged| L[APPROVED - consolidation PENDING]
    L --> M{Customer Service: 5 checks confirmed?}
    M -->|No| M
    M -->|Yes| N[CONSOLIDATED]
    N --> O[READY_FOR_DISPATCH]
    O --> P[Dispatcher creates dispatch: orders, hub, zone, date, sequence]
    P --> Q[Dispatch PLANNED]
    Q --> R{Driver and vehicle compliant?}
    R -->|No| R1[Pick another driver / vehicle]
    R1 --> R
    R -->|Yes| S[Dispatch ASSIGNED - driver notified]
    S --> T{Dispatcher ticks review and confirms}
    T -->|Stock short| T1[Blocked - stock issue]
    T -->|OK| U[Dispatch CONFIRMED - stock deducted, deliveries created, order DISPATCHED]
    U --> V[Driver: Start delivery - next stop in sequence, dispatch date reached]
    V --> W[Order OUT_FOR_DELIVERY, dispatch IN_TRANSIT, DEMO GPS session]
    W --> X[Reach location - OTP issued, shown in customer app]
    X --> Y{OTP correct and unexpired?}
    Y -->|No| Y1[Retry - max 5 attempts, regenerate if expired] --> Y
    Y -->|Yes| Z{All quantities delivered?}
    Z -->|Yes| ZA[DELIVERED + delivery note BM-DN]
    Z -->|No| ZB[PARTIALLY_DELIVERED + delivery note]
    W -->|Problem| ZC[DELIVERY_FAILED - reason recorded]
    ZB --> RV[Dispatcher review]
    ZC --> RV
    RV -->|Return goods| RTH[RETURNED_TO_HUB]
    RV -->|Return and re-queue| O
    ZA --> INV[Finance issues invoice - ordered or delivered quantities]
    ZB --> INV
    INV --> END([Customer: delivery note + invoice in app])
    ZA --> DC{All stops closed?}
    DC -->|All delivered| DCC[Dispatch COMPLETED]
    DC -->|Some failed / partial| DCP[Dispatch PARTIALLY_DELIVERED - Closed with exceptions]
```

## 6.3 Swimlane — order lifecycle

```mermaid
sequenceDiagram
    actor SE as Sales Executive
    actor SM as Sales Manager
    actor CS as Warehouse / Customer Service
    actor DP as Dispatcher
    actor DR as Driver
    actor CU as Customer
    actor FI as Finance
    SE->>SM: submitOrder - SUBMITTED, notification "New order for approval"
    SM-->>SE: returnOrderForCorrection - RETURNED (optional loop)
    SE->>SM: resubmitOrder
    SM->>CS: approveOrder - APPROVED, "Order awaiting consolidation"
    CS->>CS: consolidateOrder - CONSOLIDATED
    CS->>DP: markReadyForDispatch - READY_FOR_DISPATCH
    DP->>DP: createDispatch - PLANNED
    DP->>DR: assignDispatch - ASSIGNED, "New dispatch assigned"
    DP->>DR: confirmDispatch - CONFIRMED, stock deducted, order DISPATCHED
    DR->>CU: startDelivery - OUT_FOR_DELIVERY, "Out for delivery" + DEMO GPS
    DR->>CU: markArrived - OTP issued (simulated)
    CU-->>DR: Tells OTP
    DR->>CU: confirmDelivery - DELIVERED, delivery note
    DR-->>DP: failDelivery - DELIVERY_FAILED (exception path)
    FI->>CU: generateInvoice - invoice ISSUED, visible in customer app
```

## 6.4 Step reference

| Step | Screen / route | Component | Service function | Permission | LocalStorage written |
|---|---|---|---|---|---|
| Create / draft | `/orders/create`, `/orders/:id/edit` | `orderForm` | `createOrder`, `updateOrder` | `orders.create` | `bellomassi_orders` |
| Submit | same | `orderForm` | `submitOrder` | `orders.create` | `orders`, `order_sequence`, `order_timeline`, `notifications`, `activities` |
| Customer order | `/customer/cart` | `CustomerCart` | `placeCustomerOrder` → submit | `customer.order` | as above + `customer_carts` cleared |
| Approve / return / reject | `/orders/approval/:id` | `approvalDetail` | `approveOrder`, `returnOrderForCorrection`, `rejectOrder` | `orders.approve`, `orders.reject` | `orders`, `approvals`, `order_timeline` |
| Resubmit | `/orders/:id/edit` | `orderForm` | `resubmitOrder` | `orders.create` | `orders`, `order_timeline` |
| Consolidate | `/orders/consolidation/:id` | `consolidationDetail` | `consolidateOrder` | `orders.consolidate` | `orders`, `consolidations`, `order_timeline` |
| Ready for dispatch | same | same | `markReadyForDispatch` | `orders.consolidate` | `orders`, `order_timeline` |
| Plan dispatch | `/dispatch/create` | `dispatchForm` | `createDispatch` | `dispatch.manage` | `dispatches`, `dispatch_sequence`, `dispatch_timeline`, `orders` (dispatchId) |
| Assign | `/dispatch/assignments`, `/dispatch/:id` | `dispatchAssignments`, `dispatchDetail` | `assignDispatch` | `dispatch.manage` | `dispatches`, `dispatch_timeline` |
| Confirm | `/dispatch/:id` | `dispatchDetail` | `confirmDispatch` | `dispatch.manage` | `dispatches`, `deliveries`, `inventory`, `stock_movements`, `orders`, timelines |
| Start | `/driver/deliveries/:id` | `DriverDeliveryDetail` | `startDelivery` | `driver.app` | `deliveries`, `dispatches`, `orders`, `driver_tracking` |
| Arrive | same | same | `markArrived` | `driver.app` | `deliveries`, `delivery_otps` |
| Complete | `/driver/deliveries/:id/confirm` | `DriverConfirmDelivery` | `confirmDelivery` | `driver.app` | `deliveries`, `delivery_notes`, `delivery_pod`, `orders`, `dispatches`, `delivery_otps` |
| Fail | `/driver/deliveries/:id` | `FailDeliveryDialog` | `failDelivery` | `driver.app` | `deliveries`, `orders`, `dispatches` |
| Review exception | `/dispatch/deliveries/:id` | `deliveryDetail` | `reviewDelivery` | `dispatch.manage` | `deliveries`, `orders`, `inventory`, `stock_movements` |
| Invoice | `/invoices/create` | `invoiceCreate` | `generateInvoice` | `invoices.manage` | `invoices`, `invoice_settings` |

## 6.5 Stock effect along the flow

| Moment | Stock effect | Movement type |
|---|---|---|
| Submit / approve | None — a **warning** is shown if hub stock is short | — |
| Consolidate | None — stock review is information only | — |
| Confirm dispatch | Hub stock reduced for every line, exactly once (`stockDeducted`) | Stock Dispatch |
| Cancel a confirmed dispatch | Stock restored once (`stockReversed`) | Stock Dispatch Reversal |
| Partial / failed delivery reviewed with "return to hub" | Undelivered (not damaged) quantity booked back once (`returnedToHub`) | Delivery Return |

## 6.6 Rules that stop the flow

| Where | Rule | Message (from code) |
|---|---|---|
| Submit | Required data | "Select a customer.", "Add at least one product.", "Delivery date cannot be before the order date." … |
| Approval | Blocking checks | "Cannot approve: …" (customer inactive, hub inactive, products inactive, total invalid, credit when blocking enabled) |
| Approval | Warnings | "Confirm that you have reviewed the credit and stock warnings." |
| Consolidation | Checklist | "Complete the verification checklist first." |
| Dispatch planning | Eligibility | "Only orders ready for dispatch can be dispatched.", "…is already on BM-DSP-…", "…has no complete delivery address." |
| Assignment | Compliance | Driver / vehicle issues (chapter 11) |
| Confirmation | Review | "Review the orders, driver, vehicle, route and stock, then tick the confirmation." |
| Start | Sequence / date / confirmation | "Stop N (…) comes first in the sequence.", "Waiting for the Dispatcher to confirm the dispatch.", "Planned for … — Start is available on that day.", "Finish your current delivery first." |
| Complete | OTP | Wrong / expired / locked OTP blocks completion |
| Complete | State | "Start the delivery before confirming it.", "…is already delivered. It was not confirmed again." |
| Invoice | Eligibility | "Draft orders cannot be invoiced.", "…already has invoice … Cancel it first to issue a new one." |
