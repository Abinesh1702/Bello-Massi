# 13 · Communication & Documents Workflow

| Feature | Status |
|---|---|
| In-app notifications | Implemented |
| Automated notifications (rules per event) | Implemented — delivered through the simulated channels in demo mode |
| Email (compose, drafts, sent, history, templates, inbox) | **Simulated** in demo mode ("Sent · demo (not sent)"); gateway SMTP / IMAP mode **Not Verified** |
| WhatsApp via OpenWA | **Simulated** (mock session); gateway mode **Not Verified** |
| Call history and follow-ups | Implemented as a manual log (no telephony) |
| Documents repository, upload, review, verify, reject | Implemented |
| OCR | **Simulated** (MOCK provider); browser OCR unavailable; backend OCR **Not Verified** |

## 13.1 Master flowchart 10 — Communication workflow

```mermaid
flowchart TD
    EV[Workflow event in a service] --> NOTE[In-app notification - bell and Notification center]
    EV --> FE[fireEvent - automation]
    MAN[User composes email or WhatsApp] --> SEND
    FE --> CHK{Not a duplicate, automation on, rule enabled?}
    CHK -->|No| SKIP([History: SKIPPED with reason])
    CHK -->|Yes| REC[Resolve recipients and render template]
    REC --> SEND{Channel and mode}
    SEND -->|Email demo| ED[SENT_DEMO - not sent]
    SEND -->|Email gateway| EG[SENT - accepted by SMTP]
    SEND -->|WhatsApp mock| WD[Sent - demo]
    SEND -->|WhatsApp gateway| WG[Handed to WhatsApp]
    ED --> HIS[(Message and notification history)]
    EG --> HIS
    WD --> HIS
    WG --> HIS
    CALL[Log a call] --> FU{Follow-up needed?}
    FU -->|Yes| FU1[Schedule - overdue / today / upcoming - complete]
    FU -->|No| CL([Call logged, order can be linked])
```

## 13.2 In-app notifications

| Item | Details |
|---|---|
| Created by | Workflow services (`notifyOrder`, `notifyDispatch`, `notifyCustomer`, `pushNotification`) |
| Addressed to | Roles, a specific user (e.g. the order's salesman), a driver, or a customer |
| Storage | `bellomassi_notifications`; preferences `bellomassi_notification_preferences` (muted categories, toasts, digest) |
| Screens | Header bell dropdown; `/notifications` (Notification Center) |
| Actions | Mark read, mark all read, filter by category, open linked record |

Key notifications by event:

| Event | Recipients |
|---|---|
| Order submitted / resubmitted | Sales Manager ("New order for approval"), salesman |
| Order approved | Salesman, Customer Service ("Order awaiting consolidation") |
| Order returned / rejected | Salesman |
| Order consolidated / ready for dispatch | Dispatcher; salesman on ready |
| Dispatch assigned / changed / sequence updated / cancelled | Driver; Administrator / Dispatcher |
| Dispatch confirmed | Driver; Administrator |
| Out for delivery / driver arrived / delivered / not completed | Customer; Dispatcher |
| Delivery failed | Administrator, Dispatcher ("Review required"), customer |
| Invoice issued | Administrator, Finance |

## 13.3 Email

| Step | Route | Notes |
|---|---|---|
| Home | `/communication/email` | Counts, mode (Demo / Live) |
| Compose | `/communication/email/compose` | To, CC, subject, body, template, attachments from documents |
| Drafts | `/communication/email/drafts` | `bellomassi_email_drafts` |
| Sent / History | `/communication/email/sent`, `/history` | `bellomassi_email_history` with status |
| Inbox | `/communication/email/inbox` | Seeded demo mailbox; "sync" may add a simulated message (`bellomassi_email_inbox`) |
| Templates | `/communication/email/templates` | Variables such as customer, order, invoice fields |
| Settings | `/communication/email/settings` | SMTP / IMAP settings, encryption; credentials are only used by the gateway |

## 13.4 WhatsApp (OpenWA)

| Step | Route | Notes |
|---|---|---|
| Home | `/communication/whatsapp` | Session state; "Connected" only when OpenWA reports `ready` |
| Compose | `/communication/whatsapp/compose` | Recipient (country code default 91), message, template |
| History | `/communication/whatsapp/history` | `bellomassi_whatsapp_messages` |
| Templates | `/communication/whatsapp/templates` | `bellomassi_whatsapp_templates` |
| OpenWA settings | `/communication/whatsapp/settings` | Session start / stop / QR through the gateway; mock in demo |

## 13.5 Call history

| Step | Details |
|---|---|
| Log a call | Customer, direction (Incoming / Outgoing), status (Connected, Missed, Busy, No Answer, Voicemail), outcome, duration, notes |
| Outcomes | Order Received, Interested, Follow-up Required, No Response, Busy, Not Interested, Complaint, Payment Follow-up, Other |
| Follow-up | Suggested for Follow-up Required, Interested, Complaint, Payment Follow-up, No Response; date must not be before the call |
| Notes | Add notes (≤ 500 characters) |
| Order link | Link an order created from the call |
| Visibility | Salesmen see only their own calls; Sales Manager, Customer Service and Administrator see all |
| Storage | `bellomassi_call_history` |

## 13.6 Documents and OCR

```mermaid
flowchart TD
    A["Upload /documents/upload"] --> B{Type active, entity and record chosen, file chosen, allowed for this record?}
    B -->|No| A
    B -->|Yes| C{Document type settings}
    C -->|OCR enabled| D[PENDING_OCR - appears in OCR queue]
    C -->|Verification required, no OCR| E[PENDING_REVIEW]
    C -->|No verification| V[VERIFIED]
    D --> F{OCR provider}
    F -->|MOCK - demo| G[Fields pre-filled from linked record, form values, file name - labelled Simulated OCR]
    F -->|BROWSER| G2[Reports unavailable - not bundled]
    F -->|BACKEND| G3[Gateway /ocr/process - Not Verified]
    G --> H[OCR_COMPLETED]
    H --> I["Review /documents/:id/review - correct fields, originals kept for audit"]
    E --> I
    I --> J{Reviewer decision}
    J -->|Verify| V
    J -->|Reject with reason| R[REJECTED - uploader sees reason]
    R --> K[Replace file] --> D
    V --> X{Expiry date passed?}
    X -->|Yes| EXP[Shown as EXPIRED; DOCUMENT_EXPIRED event when scanned]
    X -->|Within warning days| WARN[DOCUMENT_EXPIRING event when scanned]
```

| Item | Details |
|---|---|
| Who uploads | Most office roles and the Driver (own records only for scoped roles) |
| Who reviews | Administrator, Customer Service, QA Manager (`documents.review`, `documents.reject`) |
| Document types | `/documents/types` (Administrator): code, name, entity, fields to capture, expiry required, warning days, OCR enabled, verification required. Built-in codes (e.g. VEH_RC, VEH_INSURANCE, DRV_LICENSE) cannot change because VMS rules refer to them. |
| Storage | `bellomassi_documents`, files via `documentStorageService`, OCR results `bellomassi_ocr_results`, types `bellomassi_document_types` |
| Lists | Repository, OCR queue (PENDING_OCR, OCR_COMPLETED, PENDING_REVIEW), Verified, Rejected, Document reports |

## 13.7 Communication — swimlane

```mermaid
sequenceDiagram
    participant SVC as Workflow service
    participant NS as notificationService
    participant AU as automationService
    participant EM as emailService
    participant WA as openWAService
    actor U as Office user
    actor C as Customer
    SVC->>NS: pushNotification (role / user / customer)
    NS-->>U: Bell + Notification center
    NS-->>C: Customer app notifications
    SVC->>AU: fireEvent(event, ids)
    AU->>AU: switch on? rule enabled? duplicate?
    AU->>EM: sendEmail (template)
    EM-->>AU: SENT_DEMO (demo) / SENT (gateway)
    AU->>WA: sendWhatsapp (template)
    WA-->>AU: Sent demo / 201 from OpenWA
    AU->>AU: Log notification history
```
