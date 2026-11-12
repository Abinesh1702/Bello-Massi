# 07 · Approval Workflow

Bellomassi has four approval processes in which one person decides on another person's request, plus two
**self-confirmation** steps (dispatch confirmation and delivery exception review) that work like approvals.

| Approval | Requester | Approver | Service | Status |
|---|---|---|---|---|
| Order approval | Sales Executive, Customer (app), Administrator | Sales Manager (Super Admin holds all keys; Administrator views only) | `approvalService` | Implemented |
| Scrap approval | Administrator, Dispatcher, Warehouse Manager, Inventory Executive, QA Manager | Warehouse Manager, Administrator (never the requester) | `scrapService` | Implemented |
| Replenishment approval | Administrator, Dispatcher, Warehouse Manager, Inventory Executive | Administrator (`procurement.approve`) | `services/ai/replenishmentService` | Implemented |
| Document verification | Any uploader (incl. Driver) | Administrator, Customer Service, QA Manager | `documentService` | Implemented |
| Dispatch confirmation | Dispatcher | Dispatcher (review tick) | `dispatchService.confirmDispatch` | Implemented |
| Delivery exception review | Driver (reports failure / partial) | Dispatcher, Administrator | `deliveryService.reviewDelivery` | Implemented |

## 7.1 Master flowchart 4 — Order approval

```mermaid
flowchart TD
    A[Order SUBMITTED, approval PENDING] --> B["Approval queue - oldest first"]
    B --> C[Open order - system runs the six approval checks]
    C --> E{Blocking check failed?}
    E -->|Yes| F([Approve not possible - fix data, return or reject])
    E -->|No| G{Manager action}
    G -->|Approve| H{Credit or stock warnings?}
    H -->|Yes| H1[Tick: I have reviewed the warnings]
    H -->|No| R{Remarks required by settings?}
    H1 --> R
    R -->|Yes| R1[Enter approval remarks]
    R -->|No| APP[APPROVED - consolidation PENDING]
    R1 --> APP
    APP --> N1([Salesman and Customer Service notified - ORDER_APPROVED])
    G -->|Return| RT[Reason from list + remarks]
    RT --> RET[RETURNED]
    RET --> N2([Salesman corrects highlighted section and resubmits])
    G -->|Reject| RJ[Reason from list + remarks]
    RJ --> REJ([REJECTED - final, salesman notified])
```

### Approval checks (`approvalService.getApprovalChecks`)

| Check | Severity | Passes when |
|---|---|---|
| Customer active | Block | Customer exists and status is Active |
| Hub active | Block | Hub exists and status is Active |
| Credit within limit | **Warn** (Block if Application Settings › Approval › *Block when credit exceeded* is on) | Credit enabled and the order does not take the balance over the limit |
| Stock available | Warn | Every inventory-tracked line is covered by hub stock |
| Order total valid | Block | Total > 0 and at least one line |
| Products active | Block | Every product is Active |

### Reasons

- **Rejection reasons** (`REJECTION_REASONS`): Credit limit exceeded, Duplicate order, Customer cancelled, Pricing not
  approved, Stock not available, Other.
- **Return reasons** (`RETURN_REASONS`): Quantity needs confirmation, Pricing or discount correction, Reduce order value
  (credit), Delivery details incomplete, Wrong product selected, Other. Each return reason highlights the matching
  section on the salesman's edit screen (`RETURN_REASON_SECTIONS`).

### What the system records

One transaction writes the updated order, an approval record in `bellomassi_approvals` (decision, reason, remarks,
decided by, order total, credit and stock warning flags) and a timeline event in `bellomassi_order_timeline`.

### Edge cases

- A draft cannot be decided: "Draft orders cannot be decided — the salesman has not submitted it."
- A second decision is refused: "BM-ORD-… has already been approved. No change was made."
- Only `orders.approve` may approve; only `orders.reject` may return or reject.

## 7.2 Order approval — swimlane

```mermaid
sequenceDiagram
    actor SE as Sales Executive
    participant OS as orderService
    actor SM as Sales Manager
    participant AS as approvalService
    actor CS as Customer Service
    SE->>OS: submitOrder()
    OS-->>SM: Notification "New order for approval" (+ warning flags)
    SM->>AS: getApprovalChecks()
    alt Approve
        SM->>AS: approveOrder(remarks, acknowledgeWarnings)
        AS-->>CS: "Order awaiting consolidation"
        AS-->>SE: "Order approved"
    else Return
        SM->>AS: returnOrderForCorrection(reason, remarks)
        AS-->>SE: "Order returned for correction" + edit link
        SE->>OS: resubmitOrder()
    else Reject
        SM->>AS: rejectOrder(reason, remarks)
        AS-->>SE: "Order rejected"
    end
```

## 7.3 Scrap approval

```mermaid
stateDiagram-v2
    [*] --> DRAFT: saveScrap (requester)
    DRAFT --> DRAFT: edit (requester only)
    DRAFT --> PENDING_APPROVAL: submitScrap
    PENDING_APPROVAL --> APPROVED: approveScrap (not requester)
    PENDING_APPROVAL --> REJECTED: rejectScrap (reason >= 5 chars)
    APPROVED --> COMPLETED: writeOffScrap - Scrap Write-off movement, once
    DRAFT --> CANCELLED: cancelScrap
    PENDING_APPROVAL --> CANCELLED: cancelScrap
    APPROVED --> CANCELLED: cancelScrap
    REJECTED --> [*]
    COMPLETED --> [*]
    CANCELLED --> [*]
```

| Rule | Message |
|---|---|
| Requester cannot approve own request | "You cannot approve your own scrap request." |
| Only drafts can be edited, only by the requester | "Only draft requests can be edited.", "Only the requester can edit this draft." |
| Rejection needs a reason | "Enter a rejection reason (at least 5 characters)." |
| Write-off only after approval, by an approver | "Only an approved scrap request can create a stock write-off.", "Only an approver can post a stock write-off." |
| Stock cannot go negative | "The write-off would make stock negative." |

Screens: `/inventory/scrap` (dashboard), `/inventory/scrap/requests`, `/inventory/scrap/requests/:id`, print
`/inventory/scrap/requests/:id/print`. Storage: `bellomassi_scrap_requests`, write-off in `bellomassi_stock_movements`.

## 7.4 Replenishment approval

```mermaid
stateDiagram-v2
    [*] --> DRAFT: createDraft (inventory.replenishment.create)
    DRAFT --> SUBMITTED: submitDraft
    SUBMITTED --> APPROVED: approveDraft (procurement.approve)
    SUBMITTED --> REJECTED: rejectDraft (reason required)
    APPROVED --> CONVERTED: convertDraft - "Awaiting goods receipt"
    CONVERTED --> RECEIVED: stock receipts cover every line (derived)
    DRAFT --> CANCELLED: cancelDraft (creator or admin)
    SUBMITTED --> CANCELLED: cancelDraft
    APPROVED --> CANCELLED: cancelDraft
    REJECTED --> [*]
    RECEIVED --> [*]
    CANCELLED --> [*]
```

- Only the creator or an Administrator can edit or cancel a draft.
- After conversion, each line has a link to **New Stock Receipt** pre-filled with hub, product, outstanding quantity
  and the request number as reference (`receiptLink`). When receipts referencing the request cover all lines, the status
  shows **Received**.
- The Supplier portal shows approved / converted requests for the linked supplier (read-only).

## 7.5 Document verification

```mermaid
stateDiagram-v2
    [*] --> PENDING_OCR: upload - type has OCR enabled
    [*] --> PENDING_REVIEW: upload - no OCR, verification required
    [*] --> VERIFIED: upload - no OCR, no verification required
    PENDING_OCR --> OCR_COMPLETED: processDocument (OCR provider)
    PENDING_OCR --> PENDING_REVIEW: saveReview (fields entered manually)
    OCR_COMPLETED --> PENDING_REVIEW: saveReview (fields corrected)
    REJECTED --> PENDING_REVIEW: saveReview
    OCR_COMPLETED --> VERIFIED: verifyDocument
    PENDING_REVIEW --> VERIFIED: verifyDocument
    PENDING_OCR --> REJECTED: rejectDocument (reason)
    OCR_COMPLETED --> REJECTED: rejectDocument (reason)
    PENDING_REVIEW --> REJECTED: rejectDocument (reason)
    REJECTED --> PENDING_OCR: replaceDocumentFile (OCR type)
    VERIFIED --> PENDING_OCR: replaceDocumentFile (OCR type)
    VERIFIED --> EXPIRED: expiry date passes (derived, effectiveStatus)
```

The initial status depends on the document type (`ocrEnabled`, `verificationRequired`). Replacing the file restarts the
review (PENDING_OCR for OCR types, otherwise PENDING_REVIEW). "Verified documents are locked. Replace the file to start a
new review." Verifying an OCR-type document needs OCR or manually saved fields first ("Run OCR (or enter the fields
manually and save) before verifying."). Rejection requires a reason "so the uploader knows what to fix." EXPIRED is not
stored — it is derived from the expiry date for any non-rejected document.

## 7.6 Dispatch confirmation and exception review

These are covered in chapters 11 and 15. Both require an explicit tick or remarks from the Dispatcher and are refused
when repeated ("…is already confirmed. Stock was deducted once and was not deducted again.", "…was already reviewed…
No change was made.").

## 7.7 Approval responsibilities

| Approval | Approve | Return | Reject | Who is notified |
|---|---|---|---|---|
| Order | Sales Manager | Sales Manager | Sales Manager | Salesman; Customer Service on approval |
| Scrap | Warehouse Manager / Administrator | — | Warehouse Manager / Administrator | (in-app list / dashboard) |
| Replenishment | Administrator | — | Administrator | (in-app list); Supplier portal shows approved requests |
| Document | Administrator / Customer Service / QA Manager | — | same | Uploader sees status and reason |
