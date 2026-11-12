"""Workflow specifications (folder 06). Diagrams: ('ch', 'NN', index) reuses docs/workflow chapter NN block; ('new', code)."""
W = {
'WF-01': dict(purpose='Show the end-to-end business flow across all roles, from order capture to delivery note and invoice.',
  pre='Master data (customers, products, hubs, zones, drivers, vehicles, users) maintained; stock available at the hub.',
  steps=['Salesman (or customer) captures and submits the order.', 'Sales Manager approves, returns or rejects it.', 'Customer Service verifies and consolidates, then releases to dispatch.', 'Dispatcher plans the dispatch, assigns driver and vehicle, confirms loading (stock deducted).', 'Driver delivers stops in sequence: start, reach location, OTP, proof, complete or fail.', 'Delivery note generated; Finance issues the invoice (if in scope); exceptions reviewed by the Dispatcher.'],
  decisions='Approve / return / reject; consolidation checks complete; driver and vehicle compliant; OTP valid; all quantities delivered.',
  approve='Sales Manager approval (all blocking checks pass, warnings acknowledged).', reject='Rejection with reason (final) or return for correction.',
  sys='Numbering, validation, notifications, timeline events, stock movements, delivery creation, OTP generation, delivery note.', user='Data entry, decisions, confirmations, handover.',
  status='Order DRAFT → SUBMITTED → APPROVED → CONSOLIDATED → READY_FOR_DISPATCH → DISPATCHED → OUT_FOR_DELIVERY → DELIVERED (or exception statuses).',
  notif='Each hand-off notifies the next role in-app; automated email / WhatsApp per rule (demo).', exc='See WF-18.', outcome='Order delivered with OTP-verified proof and delivery note; invoice issued if in scope.',
  diagrams=[('ch', '02', 0), ('ch', '02', 1)]),
'WF-02': dict(purpose='Specify the core order lifecycle and the system effect of each step.', pre='Active customer, hub and products.',
  steps=['Create order and submit (number BM-ORD-… assigned).', 'Approval checks run; manager decides.', 'Customer Service ticks five checks and consolidates.', 'Order marked READY_FOR_DISPATCH.', 'Dispatcher creates dispatch and sequence; assigns resources; confirms — stock deducted and deliveries created; order DISPATCHED.', 'Driver starts (OUT_FOR_DELIVERY), reaches location (OTP issued), completes with OTP (DELIVERED / PARTIALLY_DELIVERED).'],
  decisions='Blocking checks; warnings; stock sufficient at confirmation; OTP; quantities.', approve='Approval, consolidation checklist, dispatch confirmation tick.', reject='Rejection; cancellation of dispatch.',
  sys='`submitOrder`, `approveOrder`, `consolidateOrder`, `markReadyForDispatch`, `createDispatch`, `assignDispatch`, `confirmDispatch`, `startDelivery`, `markArrived`, `confirmDelivery`.', user='Each role acts on its queue.',
  status='As WF-01; dispatch DRAFT → PLANNED → ASSIGNED → CONFIRMED → IN_TRANSIT → COMPLETED.', notif='New order for approval; awaiting consolidation; ready for dispatch; dispatch assigned / confirmed; out for delivery; delivered.',
  exc='Stock short at confirmation; non-compliant resources; wrong OTP; partial / failed delivery.', outcome='Delivered order with delivery note and stock movements.',
  diagrams=[('ch', '06', 0), ('ch', '06', 1)]),
'WF-03': dict(purpose="Describe the salesman's daily work: capture, submit, correct returned orders, follow up calls.", pre='Salesman account; assigned customers.',
  steps=['Open dashboard → "Needs your action".', 'Correct returned orders (highlighted section) and resubmit.', 'Capture new orders (from calls, email, WhatsApp) — optionally from a call record.', 'Save draft or submit.', 'Log calls and follow-ups.', 'Track statuses and notifications.'],
  decisions='Draft or submit; respond to warnings.', approve='—', reject='Receives returns / rejections with reason.', sys='Validation, warnings, numbering, notifications.', user='Data entry, corrections.',
  status='DRAFT → SUBMITTED; RETURNED → SUBMITTED.', notif='Approved, returned, rejected, ready for dispatch.', exc='Validation errors; credit / stock warnings.', outcome='Orders submitted for approval.',
  diagrams=[('new', 'salesman')]),
'WF-04': dict(purpose='Specify the Sales Manager decision on submitted orders.', pre='Order SUBMITTED with approval PENDING.',
  steps=['Open approval queue (oldest first).', 'Open order; system runs six checks.', 'Approve (acknowledge warnings, remarks if required) or return / reject with reason and remarks.'],
  decisions='Blocking checks; warnings; decision.', approve='All blocking checks pass; warnings acknowledged; remarks given if required.', reject='Reason from list + remarks; reject is final; return sends back to salesman.',
  sys='Approval record + timeline in one transaction; notifications; automation events.', user='Review and decide.', status='SUBMITTED → APPROVED / RETURNED / REJECTED.',
  notif='Approved → salesman + Customer Service; returned / rejected → salesman.', exc='Repeated decision refused; draft cannot be decided.', outcome='Recorded decision with reason.',
  diagrams=[('ch', '07', 0), ('ch', '07', 1)]),
'WF-05': dict(purpose="Describe Customer Service's daily work.", pre='Approved orders exist.',
  steps=['Open consolidation queue grouped by salesman.', 'For each order tick the five checks, review stock, add notes, consolidate.', 'Mark ready for dispatch.', 'Review documents in the OCR queue.', 'Handle customer calls.'],
  decisions='All checks confirmed?', approve='Consolidation (checklist).', reject='Customer Service cannot reject; issues go to the Sales Manager / Administrator.', sys='Consolidation record, notifications.', user='Verification.',
  status='APPROVED → CONSOLIDATED → READY_FOR_DISPATCH.', notif='Dispatcher informed.', exc='Incomplete checklist; non-approved order.', outcome='Orders released to dispatch.', diagrams=[('ch', '05', 2)]),
'WF-06': dict(purpose='Specify how credit exposure is checked.', pre='Customer credit settings maintained.',
  steps=['On order entry and approval the system computes projected balance = balance + order total.', 'If projected balance > limit: credit warning flag.', 'At approval: warning must be acknowledged; if the setting blocks, Approve is disabled.', 'Manager may return with "Reduce order value (credit)" or reject with "Credit limit exceeded".'],
  decisions='Within limit? Blocking setting on?', approve='Acknowledged warning (non-blocking mode).', reject='Return / reject with credit reasons.', sys='`getOrderCreditPosition`, approval checks.', user='Manager decision.',
  status='No separate status; affects approval outcome.', notif='Warning flags on "New order for approval". Finance notification NOT IMPLEMENTED (G-02).', exc='Balance is not updated automatically (no payments).', outcome='Credit-controlled approval.', diagrams=[('new', 'credit')]),
'WF-07': dict(purpose='Specify consolidation in detail.', pre='Order APPROVED, consolidation PENDING.', steps=['Open order from queue.', 'Confirm: customer and address verified; hub confirmed; products and units checked; quantities match; hub stock reviewed.', 'Consolidate.', 'Mark ready for dispatch.'],
  decisions='All five checks?', approve='Checklist complete.', reject='—', sys='Consolidation record; notifications; ORDER_READY event.', user='Verification.', status='APPROVED → CONSOLIDATED → READY_FOR_DISPATCH.', notif='Dispatcher, salesman.', exc='"Only approved orders can be consolidated."; duplicate consolidation refused.', outcome='Order in ready queue.', diagrams=[('ch', '05', 2)]),
'WF-08': dict(purpose='Specify dispatch planning, confirmation and closing.', pre='READY_FOR_DISPATCH orders; active zones, drivers and vehicles.',
  steps=['Select ready orders, hub, zone, date.', 'Sequence stops (suggested or drag and drop).', 'Save draft or plan.', 'Assign driver and vehicle (WF-09).', 'Review and confirm loading — stock deducted once; deliveries created.', 'Monitor; dispatch closes when all stops close.'],
  decisions='Order eligible? Draft or plan? Stock sufficient?', approve='Dispatcher confirmation tick.', reject='Cancellation with reason (before any stop starts).', sys='Numbering BM-DSP-…, timeline, stock movements, deliveries, notifications.', user='Planning and confirmation.',
  status='DRAFT → PLANNED → ASSIGNED → CONFIRMED → IN_TRANSIT → COMPLETED / PARTIALLY_DELIVERED; CANCELLED.', notif='Driver assigned / confirmed / sequence updated / cancelled; Administrator on confirmation.', exc='Ineligible order; stock short; non-compliant resources.', outcome='Confirmed vehicle run.',
  diagrams=[('ch', '11', 0), ('ch', '11', 2)]),
'WF-09': dict(purpose='Specify driver and vehicle assignment with compliance checks.', pre='Dispatch PLANNED or ASSIGNED.',
  steps=['Open Driver Assignment.', 'Choose driver — system checks status, availability, hub, licence, required documents.', 'Choose vehicle — status, availability, hub, capacity vs load, required documents.', 'Save assignment; driver notified.'],
  decisions='Driver issues? Vehicle issues?', approve='No blocking issue.', reject='Assignment refused with issue list.', sys='`driverAssignmentIssues`, `vehicleAssignmentIssues`, VMS compliance.', user='Selection.',
  status='PLANNED → ASSIGNED.', notif='Driver: "New dispatch assigned"; previous driver: "Removed from …".', exc='Expired licence / documents, over capacity, busy resource.', outcome='Compliant assignment.', diagrams=[('new', 'assign')]),
'WF-10': dict(purpose="Specify the driver's stop workflow.", pre='Dispatch CONFIRMED; date reached; driver linked to user.',
  steps=['Open Today; tap next stop.', 'Start delivery (blocked if not next / not confirmed / future).', 'Drive (DEMO GPS in prototype).', 'Reach location — OTP issued.', 'Enter quantities, receiver, optional signature / photo, OTP.', 'Complete (DELIVERED / PARTIALLY_DELIVERED) or report failure.'],
  decisions='Can start? OTP valid? All delivered? Problem?', approve='OTP verification.', reject='Failure with reason.', sys='Tracking session, OTP, delivery note, notifications, dispatch closing.', user='Driver actions; customer gives OTP.',
  status='Delivery DISPATCHED → OUT_FOR_DELIVERY → DELIVERED / PARTIALLY_DELIVERED / FAILED.', notif='Customer and Dispatcher at each step.', exc='Wrong / expired / locked OTP; out of sequence; failure.', outcome='Stop closed with proof.',
  diagrams=[('ch', '08', 0), ('ch', '08', 1)]),
'WF-11': dict(purpose='Specify customer self-service ordering.', pre='Customer user linked to a customer record.',
  steps=['Browse catalog; add to cart.', 'Review cart totals and credit warning.', 'Enter delivery details (address, date tomorrow–60 days, time slot, reference, remarks).', 'Place order; confirm.', 'Order submitted for Sales Manager approval.'],
  decisions='Address registered or other; time slot.', approve='Sales Manager approval (WF-04).', reject='Manager rejects; customer sees "Not accepted".', sys='`placeCustomerOrder` → `submitOrder` (source customer_app; VIP → High priority).', user='Customer.',
  status='SUBMITTED (Pending approval).', notif='Order placed; later approved / rejected.', exc='Empty cart; invalid date; unlinked login.', outcome='Order in approval queue.', diagrams=[('ch', '09', 0)]),
'WF-12': dict(purpose='Specify customer delivery tracking and OTP handover.', pre='Customer has an order on a confirmed dispatch.',
  steps=['Driver starts the stop — customer notified "Out for delivery".', 'Customer opens Track delivery (DEMO GPS map, own vehicle only).', 'Driver reaches location — OTP shown in large digits with expiry.', 'Customer reads OTP to driver.', 'Delivery completed — delivery note available.'],
  decisions='—', approve='Customer OTP.', reject='Customer may refuse — driver records failure "Customer Refused".', sys='Tracking session; OTP; notifications.', user='Customer shares OTP.',
  status='OUT_FOR_DELIVERY → DELIVERED.', notif='Out for delivery; driver arrived; delivered / not completed.', exc='OTP expiry → new OTP.', outcome='Handover confirmed by the customer.', diagrams=[('new', 'tracking')]),
'WF-13': dict(purpose='Specify stock receipts, transfers, adjustments and replenishment.', pre='Hubs and products with inventory tracking.',
  steps=['Receive goods (GRN) — stock up.', 'Transfer between hubs — draft or complete.', 'Adjust stock with type and reason.', 'Review low stock; create replenishment draft; admin approves and converts; receive goods against it.'],
  decisions='Transfer now or draft; adjustment type.', approve='Replenishment approval by Administrator.', reject='Replenishment rejection with reason.', sys='Movement ledger; low-stock status.', user='Warehouse staff.',
  status='Transfer Draft → Completed / Cancelled; replenishment DRAFT → … → RECEIVED.', notif='Low stock alerts.', exc='Insufficient stock; inactive hub.', outcome='Accurate stock.', diagrams=[('ch', '10', 0), ('ch', '10', 2)]),
'WF-14': dict(purpose='Specify scrap write-off.', pre='Unusable stock at hub.', steps=['Create request (reason, qty, source, batch, photo).', 'Submit.', 'Approver (not requester) approves or rejects.', 'Approver posts write-off once.'],
  decisions='Approve or reject.', approve='Different user with scrap.approve.', reject='Reason ≥ 5 characters.', sys='Eligibility check; Scrap Write-off movement.', user='Requester, approver.', status='DRAFT → PENDING_APPROVAL → APPROVED → COMPLETED; REJECTED; CANCELLED.',
  notif='Pending requests on warehouse dashboard.', exc='Quantity above eligible; missing photo / batch; duplicate.', outcome='Stock written off with evidence.', diagrams=[('ch', '07', 2), ('ch', '10', 1)]),
'WF-15': dict(purpose='Specify vehicle and driver compliance management.', pre='Vehicles and drivers recorded.', steps=['Record document numbers and expiry dates; upload files.', 'Compliance computed per document.', 'Expiry register reviewed; scan raises events.', 'Assignment blocked for expired required documents.'],
  decisions='Required? Expired / warning / missing?', approve='Document verification (WF-22).', reject='—', sys='`complianceService`, expiry events.', user='Administrator / Dispatcher.', status='VALID / MONTH / WEEK / TODAY / EXPIRED / MISSING.', notif='DOCUMENT_EXPIRING / DOCUMENT_EXPIRED (automation).', exc='Assignment refused.', outcome='Only compliant fleet on the road.', diagrams=[('ch', '11', 1)]),
'WF-16': dict(purpose='Specify invoice issue and cancellation (scope to be confirmed).', pre='Order APPROVED or later without active invoice; active template.',
  steps=['New invoice — select order.', 'Choose template and options (quantity basis, dates, discount, charges, demo tax).', 'Preview; issue (BM-INV-YYYY-NNNNN).', 'Print / email (demo) / visible to customer.', 'Cancel with reason if wrong; reissue.'],
  decisions='Eligible? Quantity basis?', approve='—', reject='Cancellation.', sys='Snapshot, numbering, totals, event INVOICE_GENERATED.', user='Finance.', status='ISSUED → CANCELLED.', notif='Admin and Finance.', exc='Draft / unapproved order; duplicate; zero total.', outcome='Invoice issued.', diagrams=[('ch', '12', 0), ('ch', '12', 2)]),
'WF-17': dict(purpose='Specify manual and automated communication.', pre='Templates and settings; automation switched on for automated messages.',
  steps=['Workflow event fires.', 'In-app notification created.', 'Automation: check duplicate, switch, rule; resolve recipients; render template.', 'Send via email / WhatsApp (demo or gateway); log history.', 'Users may also compose messages manually.'],
  decisions='Automation on? Rule enabled? Channel?', approve='—', reject='—', sys='`fireEvent`, `sendEmail`, `sendWhatsapp`.', user='Compose, templates.', status='Message statuses (demo: SENT_DEMO).', notif='—', exc='Skipped (no rule / template / address).', outcome='Message logged.', diagrams=[('ch', '13', 0), ('ch', '13', 2)]),
'WF-18': dict(purpose='Specify how exceptions are detected and resolved.', pre='—', steps=['Service detects the exception and refuses the action or moves the record to an exception status.', 'Named role resolves it (see register in docs/workflow chapter 15).'],
  decisions='Exception type.', approve='Depends on type.', reject='—', sys='Validation, idempotency, transactions.', user='Resolver role.', status='Exception statuses: RETURNED, REJECTED, DELIVERY_FAILED, PARTIALLY_DELIVERED, RETURNED_TO_HUB, CANCELLED.', notif='Responsible role notified.', exc='37 exceptions listed in docs/workflow 15.2.', outcome='Exception resolved.', diagrams=[('ch', '15', 0)]),
'WF-19': dict(purpose='Specify all rejection paths.', pre='A request awaiting decision.', steps=['Order: Sales Manager rejects with reason → REJECTED (final).', 'Scrap: approver rejects with reason → REJECTED.', 'Replenishment: Administrator rejects with reason → REJECTED.', 'Document: reviewer rejects with reason → REJECTED; uploader replaces file.'],
  decisions='Reject vs return (orders only).', approve='—', reject='Reason mandatory in every case.', sys='Decision records; notifications.', user='Approver.', status='→ REJECTED.', notif='Requester notified / sees reason.', exc='Missing reason refused.', outcome='Requester informed.', diagrams=[('new', 'reject')]),
'WF-20': dict(purpose='Specify cancellation paths and their stock effects.', pre='A cancellable record.', steps=['Dispatch: cancel with reason + remarks before any stop starts; orders back to READY_FOR_DISPATCH; stock reversed once if confirmed.', 'Invoice: cancel with reason; new invoice possible.', 'Scrap / replenishment: cancel while not completed.', 'Order: cancellation after submission NOT IMPLEMENTED (reject with "Customer cancelled").'],
  decisions='Cancellable state?', approve='—', reject='—', sys='Reversal movements; timeline.', user='Owner role.', status='→ CANCELLED.', notif='Driver and Admin on dispatch cancellation.', exc='Started dispatch cannot be cancelled.', outcome='Record cancelled cleanly.', diagrams=[('new', 'cancel')]),
'WF-21': dict(purpose='Specify return delivery handling.', pre='Delivery FAILED or PARTIALLY_DELIVERED.', steps=['Driver records failure reason or shortfall.', 'Dispatcher opens delivery; enters review remarks.', 'Optionally return undelivered goods to hub (once).', 'For failed + returned: optionally re-queue the order.'],
  decisions='Return stock? Re-queue?', approve='Dispatcher review.', reject='—', sys='Delivery Return movement; order status update.', user='Dispatcher.', status='FAILED → RETURNED; order → RETURNED_TO_HUB or READY_FOR_DISPATCH.', notif='Failure notification to Admin, Dispatcher, customer.', exc='Second review refused.', outcome='Goods and order status corrected.', diagrams=[('ch', '15', 1)]),
'WF-22': dict(purpose='Specify document upload and verification.', pre='Active document type; user may upload for the record.', steps=['Upload with type, record, file, fields.', 'OCR (if enabled) extracts fields (MOCK in prototype).', 'Reviewer corrects fields.', 'Verify or reject with reason.', 'Uploader replaces file after rejection.'],
  decisions='OCR type? Verify or reject?', approve='Reviewer verifies.', reject='Reason mandatory.', sys='OCR result kept with originals; expiry derived.', user='Uploader, reviewer.', status='PENDING_OCR → OCR_COMPLETED → PENDING_REVIEW → VERIFIED / REJECTED.', notif='Expiry events.', exc='File not stored; provider unavailable.', outcome='Verified document.', diagrams=[('ch', '13', 1), ('ch', '07', 4)]),
'WF-23': dict(purpose='Specify in-app notifications.', pre='—', steps=['Service calls `pushNotification` with target role / user / driver / customer.', 'Bell count updates; toast unless muted.', 'User opens Notification Center and follows link.', 'Marked read.'],
  decisions='Muted category?', approve='—', reject='—', sys='`notificationService`.', user='Read / mute.', status='Unread → Read.', notif='—', exc='—', outcome='User informed.', diagrams=[('new', 'notify')]),
'WF-24': dict(purpose='Specify dashboards and reports.', pre='Report category permission.', steps=['Choose period on dashboard; compare.', 'Drill down to lists.', 'Open Reports Center; search / favourite.', 'Run report with filters; export CSV or print.'],
  decisions='Report has source data?', approve='—', reject='—', sys='`reportService.runReport` with data scope.', user='Analysis.', status='—', notif='—', exc='24 reports state "no source data".', outcome='Insight / export.', diagrams=[('ch', '14', 0)]),
}

NEW = {
'salesman': """flowchart TD
    A[Sign in - Salesman dashboard] --> B{Returned orders?}
    B -->|Yes| C[Open returned order - fix highlighted section] --> D[Resubmit]
    B -->|No| E[New order from call / email / WhatsApp]
    E --> F[Customer, hub, dates, address, lines]
    F --> G{Save draft or submit?}
    G -->|Draft| H[DRAFT]
    G -->|Submit| I[SUBMITTED - Sales Manager notified]
    D --> I
    I --> J[Log call and follow-up]
    J --> K[Track status and notifications]""",
'credit': """flowchart TD
    A[Order total entered] --> B[Projected balance = balance + order total]
    B --> C{Credit enabled and projected above limit?}
    C -->|No| OK([Within limit])
    C -->|Yes| W[Credit warning flag on order]
    W --> S{Setting: block when credit exceeded?}
    S -->|No| ACK[Manager acknowledges warning and may approve]
    S -->|Yes| BLK[Approve disabled]
    ACK --> D{Manager decision}
    BLK --> D2{Return or reject}
    D -->|Approve| AP([APPROVED])
    D -->|Return - reduce value| RT([RETURNED])
    D2 -->|Return| RT
    D2 -->|Reject - credit limit exceeded| RJ([REJECTED])""",
'assign': """flowchart TD
    A[Dispatch PLANNED] --> B[Select driver]
    B --> C{Active, free, online, same hub, licence valid, documents compliant?}
    C -->|No| C1[Issue list shown - choose another driver] --> B
    C -->|Yes| D[Select vehicle]
    D --> E{Active, not in maintenance, free, same hub, load within capacity, documents compliant?}
    E -->|No| E1[Issue list shown - choose another vehicle] --> D
    E -->|Yes| F[ASSIGNED - driver notified]""",
'tracking': """sequenceDiagram
    actor DR as Driver
    participant SYS as Platform
    actor CU as Customer
    DR->>SYS: Start delivery
    SYS-->>CU: Out for delivery - track (DEMO GPS, own vehicle only)
    DR->>SYS: Reach location
    SYS-->>CU: OTP shown in app (production - SMS / WhatsApp)
    CU-->>DR: Reads the OTP
    DR->>SYS: Enter OTP and complete
    SYS-->>CU: Delivered - delivery note available""",
'reject': """flowchart LR
    O[Order SUBMITTED] -->|Sales Manager: reason + remarks| OR([REJECTED - salesman notified])
    S[Scrap PENDING_APPROVAL] -->|Approver: reason 5+ chars| SR([REJECTED])
    P[Replenishment SUBMITTED] -->|Administrator: reason| PR([REJECTED])
    D[Document under review] -->|Reviewer: reason| DR([REJECTED - uploader replaces file])""",
'cancel': """flowchart TD
    A{What is cancelled?} -->|Dispatch| B{Any stop started?}
    B -->|Yes| B1([Refused])
    B -->|No| B2[Reason + remarks - CANCELLED]
    B2 --> B3{Was it confirmed?}
    B3 -->|Yes| B4[Stock reversed once - Stock Dispatch Reversal]
    B3 -->|No| B5[No stock effect]
    B4 --> B6([Orders back to READY_FOR_DISPATCH])
    B5 --> B6
    A -->|Invoice| C[Reason - CANCELLED - new invoice allowed]
    A -->|Scrap / replenishment| D[CANCELLED while not completed]
    A -->|Submitted order| E([Not implemented - reject with Customer cancelled])""",
'notify': """flowchart LR
    A[Workflow service] --> B[pushNotification - role / user / driver / customer]
    B --> C{Category muted?}
    C -->|No| D[Toast + bell count]
    C -->|Yes| E[Bell count only]
    D --> F[Notification Center]
    E --> F
    F --> G[Open linked record - marked read]""",
}
