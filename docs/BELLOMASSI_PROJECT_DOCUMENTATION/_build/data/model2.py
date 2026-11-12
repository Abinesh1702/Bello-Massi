"""Business requirements, non-functional requirements, business rules, negative test cases, workflows, stakeholders."""

# BR id | priority | business owner | module | source | label | requirement | related FRs (space separated)
BR_TEXT = r"""
BR-001 | P1 | Sales Director | ORD | SOW slide 2, 7 | VERIFIED | Every customer order received by call, email or WhatsApp shall be captured once in one structured digital record. | FR-ORD-001 FR-ORD-002 FR-ORD-003 FR-ORD-011
BR-002 | P1 | Sales Director | APR | SOW slide 8 | VERIFIED | No order shall be shipped without Sales Manager approval of value, quantity and credit position. | FR-APR-001 FR-APR-002 FR-APR-003 FR-APR-007
BR-003 | P1 | Finance Manager | CRD | SOW slide 8, 18 | VERIFIED | Every order shall be checked against the customer's credit limit and exceptions shall be flagged. | FR-CRD-001 FR-CRD-002 FR-CRD-003 FR-APR-008
BR-004 | P1 | Sales Director | APR | SOW slide 8 | VERIFIED | Returned and rejected orders shall always carry the manager's reason back to the salesman. | FR-APR-004 FR-APR-005 FR-ORD-005
BR-005 | P1 | Operations Manager | CON | SOW slide 9 | VERIFIED | Customer Service shall receive only approved orders, grouped per salesman, verify them and release them to dispatch. | FR-CON-001 FR-CON-002 FR-CON-003 FR-CON-004
BR-006 | P1 | Logistics Manager | DSP | SOW slide 10 | VERIFIED | The Dispatcher shall plan deliveries by zone and assign orders to drivers and vehicles. | FR-DSP-001 FR-DSP-002 FR-DSP-008 FR-ZON-001 FR-ZON-002 FR-DRA-001
BR-007 | P1 | Logistics Manager | DSP | SOW slide 10, 12 | VERIFIED | Drivers shall see the next day's delivery plan the day before. | FR-DRV-001 FR-DSP-004
BR-008 | P1 | Logistics Manager | DSP | SOW slide 12; GPS guide §5 | PROPOSED | Each driver shall receive a suggested fastest route using distance and live traffic, with VIP requested times respected or warned. | FR-DSP-003 FR-DSP-009 FR-DRV-009
BR-009 | P1 | Operations Manager | OTP | SOW slide 13 | VERIFIED | Every handover shall be confirmed with a one-time password given by the customer. | FR-OTP-001 FR-OTP-002 FR-OTP-003 FR-OTP-005 FR-DRV-003 FR-DRV-004
BR-010 | P1 | Operations Manager | DN | SOW slide 13 | VERIFIED | A delivery note shall be issued to the customer as soon as the handover is confirmed. | FR-DN-001 FR-DN-002 FR-DN-003
BR-011 | P1 | Operations Manager | ORD | SOW slide 17 | VERIFIED | Every order shall have one clear status visible to every role, with a full history. | FR-ORD-008 FR-DASH-001 FR-TRK-001 FR-CAP-003
BR-012 | P1 | Management | NOTF | SOW slide 16 | VERIFIED | The right person shall be notified at each workflow event (in-app; customers by SMS or WhatsApp). | FR-NOTF-001 FR-AUTO-001 FR-AUTO-002 FR-APR-008 FR-OTP-005
BR-013 | P1 | IT / Administrator | RBAC | SOW slide 15 | VERIFIED | Administrators shall control users, roles and what each role can see and do. | FR-USR-001 FR-USR-002 FR-RBAC-001 FR-RBAC-002 FR-RBAC-003 FR-RBAC-004 FR-RBAC-005
BR-014 | P1 | IT / Administrator | CUS | SOW slide 15 | VERIFIED | Administrators shall maintain customers, delivery locations, credit limits, items, zones and drivers. | FR-CUS-001 FR-CUS-002 FR-PRD-001 FR-ZON-001 FR-DRA-004
BR-015 | P2 | Management | RPT | SOW slide 15 | VERIFIED | Management shall monitor orders live and export reports on orders, approvals, dispatch and delivery performance. | FR-RPT-001 FR-RPT-002 FR-DASH-002 FR-DASH-006
BR-016 | P1 | Logistics Manager | TRK | GPS guide §1, §6, §9 | PROTOTYPE | Admin users shall see all active vehicles live; each customer shall see only the vehicle of their own order. | FR-TRK-001 FR-TRK-002 FR-TRK-003 FR-CAP-004
BR-017 | P1 | Logistics Manager | DRV | GPS guide §2–§4, §8 | PROPOSED | The driver app shall be a mobile app with admin-created accounts and background GPS during active deliveries only. | FR-DRV-002 FR-DRV-010 FR-DRV-011 FR-AUTH-002
BR-018 | P2 | IT / Administrator | PRD | SOW slide 4, 15 | PROPOSED | Items and quantities shall be updated from SAP in a second stage (today from emails). | FR-PRD-004 FR-INV-008 FR-CRD-005
BR-019 | P2 | Warehouse Manager | INV | Phase 2 brief | VERIFIED | Stock per product and hub shall be controlled with receipts, transfers, adjustments and a movement ledger. | FR-INV-001 FR-INV-002 FR-INV-003 FR-INV-004 FR-INV-005 FR-INV-006
BR-020 | P2 | Warehouse Manager | SCR | Finalisation brief | VERIFIED | Unusable stock shall be written off only after approval by a different user, with evidence. | FR-SCR-001 FR-SCR-002 FR-SCR-003 FR-SCR-004
BR-021 | P2 | Fleet Manager | VMS | Phase 5 brief | VERIFIED | Vehicles and drivers with expired mandatory documents shall not be assigned to deliveries. | FR-VMS-001 FR-VMS-002 FR-VMS-003 FR-VMS-004 FR-DRA-002 FR-DRA-003
BR-022 | P2 | Operations Manager | DOC | Phase 5 brief | PROTOTYPE | Business documents shall be stored centrally, read by OCR and verified before use. | FR-DOC-001 FR-DOC-002 FR-DOC-003 FR-DOC-004 FR-DOC-005
BR-023 | P2 | Finance Manager | INVC | Phase 5 brief (beyond SOW) | PENDING CONFIRMATION | Customer invoices shall be produced from orders with branded templates (SOW keeps invoicing outside the app). | FR-INVC-001 FR-INVC-002 FR-INVC-003 FR-INVC-004 FR-INVC-005
BR-024 | P2 | Sales Director | EML | Phase 5 brief | PROTOTYPE | Staff shall communicate with customers by email and WhatsApp from the platform, manually and automatically. | FR-EML-001 FR-EML-002 FR-OWA-001 FR-OWA-003 FR-AUTO-001
BR-025 | P3 | Sales Director | CALL | Finalisation brief | VERIFIED | Customer calls and follow-ups shall be logged and linked to orders. | FR-CALL-001 FR-CALL-002
BR-026 | P2 | Customer Experience | CAP | Finalisation brief (beyond SOW) | PENDING CONFIRMATION | Customers shall order, track deliveries and access delivery notes and invoices in a self-service app. | FR-CAP-001 FR-CAP-002 FR-CAP-003 FR-CAP-004 FR-CAP-005 FR-CAP-006 FR-CAP-008
BR-027 | P2 | Operations Manager | EXC | Phase 4 brief | VERIFIED | Failed and partial deliveries shall be reviewed and resolved by the Dispatcher with stock returned correctly. | FR-EXC-001 FR-EXC-002 FR-EXC-003 FR-DRV-005
BR-028 | P2 | Management | DASH | UI/filter brief | VERIFIED | Every dashboard shall be filterable by period, including the financial year, with comparison to the previous period. | FR-DASH-002 FR-DASH-003 FR-DASH-004 FR-DASH-005
BR-029 | P1 | IT / Security | AUTH | GPS guide §2; Phase 1 brief | VERIFIED | Only authorised users with active accounts shall sign in; sessions shall expire and accounts lock after repeated failures. | FR-AUTH-001 FR-AUTH-004 FR-AUTH-005 FR-AUTH-006 FR-AUTH-011 FR-AUTH-012 FR-AUTH-013
BR-030 | P1 | IT / Security | SET | Phase 1 brief | VERIFIED | Administrative actions shall be auditable and configuration shall be centrally managed. | FR-SET-001 FR-SET-002 FR-SET-003 FR-SET-004
BR-031 | P3 | Management | AI | Phase 6 brief | PROTOTYPE | Management shall get demand forecasts, reorder suggestions and an assistant for business questions. | FR-AI-001 FR-AI-002 FR-AI-003 FR-AI-004 FR-AI-005
BR-032 | P2 | Quality Manager | WQA | Finalisation brief | VERIFIED | Warehouse and QA staff shall see picking, quarantine, inspections and document expiry in one place. | FR-WQA-001 FR-WQA-002 FR-WQA-003
BR-033 | P1 | Operations Manager | POD | SOW slide 13; Phase 4 brief | VERIFIED | Proof of delivery (quantities, receiver, signature, photo) shall be captured with every handover. | FR-POD-001 FR-POD-002 FR-POD-003
"""

# NFR id | category | label | requirement | measure / acceptance
NFR_TEXT = r"""
NFR-PERF-001 | Performance | PROPOSED | API responses for list and detail endpoints shall complete within 500 ms at the 95th percentile under normal load. | Load test report (no real measurement exists yet).
NFR-PERF-002 | Performance | PROPOSED | Dashboard pages shall render within 3 s on a 4G mobile connection. | Lighthouse / WebPageTest on staging.
NFR-PERF-003 | Performance | PROPOSED | Driver GPS updates shall be ingested and pushed to authorised maps within 5 s. | End-to-end tracking test.
NFR-PERF-004 | Performance | VERIFIED | The prototype keeps all demo data (about 1 MB across 74 keys) within the browser storage quota and degrades to in-memory storage if storage is blocked. | storageService usage / issues report.
NFR-SCAL-001 | Scalability | PROPOSED | The backend shall scale horizontally (stateless API containers behind a load balancer). | Two or more API instances serve traffic.
NFR-SCAL-002 | Scalability | PENDING CONFIRMATION | Capacity planning shall be based on confirmed volumes (orders per day, drivers, customers, concurrent users). | Client provides volumes.
NFR-AVL-001 | Availability | PROPOSED | Production availability target 99.5% monthly excluding planned maintenance. | Uptime monitoring report.
NFR-REL-001 | Reliability | VERIFIED | State-changing actions shall be idempotent: repeating an approval, confirmation, delivery or write-off shall not change data twice. | Services return "No change was made."
NFR-REL-002 | Reliability | VERIFIED | Multi-record changes shall be atomic (all keys written together or none). | storageService.transaction used by workflow services.
NFR-REL-003 | Reliability | PROPOSED | Daily database backups with point-in-time recovery; RPO ≤ 24 h (15 min with WAL archiving), RTO ≤ 4 h. | Restore drill evidence.
NFR-SEC-001 | Security | PROPOSED | All traffic shall use TLS 1.2+ (HTTPS / WSS). | SSL Labs grade A.
NFR-SEC-002 | Security | PROPOSED | Passwords shall be hashed server-side with Argon2id or PBKDF2; the prototype's browser hash is for demo only. | Code review.
NFR-SEC-003 | Security | VERIFIED | Authorisation shall be enforced in the service layer for every action (prototype) and in every API (production). | RBAC test plan.
NFR-SEC-004 | Security | PROPOSED | Personal data (customers, drivers, addresses, phone numbers) shall be encrypted at rest and access-logged. | Security review.
NFR-SEC-005 | Security | PROPOSED | Uploaded files shall be type-checked, size-limited and virus-scanned before storage. | File upload tests.
NFR-SEC-006 | Security | PROPOSED | OTPs shall be stored hashed, expire, be rate-limited and never be returned by APIs to drivers. | OTP security tests.
NFR-SEC-007 | Security | VERIFIED | Customers shall only see their own orders, tracking and documents; drivers only their own deliveries. | Role-based access tests.
NFR-USE-001 | Usability | VERIFIED | Driver and customer screens shall be usable on 390 px wide phones with 44–56 px touch targets and sticky primary actions. | Responsive tests (137 pages at 390 px without overflow).
NFR-USE-002 | Usability | VERIFIED | All dates shall use the organisation time zone and the configured date format. | Localisation settings.
NFR-USE-003 | Usability | VERIFIED | Simulated behaviour shall be labelled in the UI (DEMO GPS, Simulated OCR, Sent · demo). | UI review.
NFR-ACC-001 | Accessibility | PROPOSED | The UI shall meet WCAG 2.1 AA (contrast, keyboard navigation, labels, focus states). | Accessibility audit (partial support exists: focus rings, aria labels, reduced motion).
NFR-MNT-001 | Maintainability | VERIFIED | Business rules shall live in service modules separate from pages (page → hook → service → storage). | Architecture review.
NFR-MNT-002 | Maintainability | VERIFIED | Navigation, routes, breadcrumbs and permissions shall be defined in one configuration (navigation.js). | Code review.
NFR-MNT-003 | Maintainability | PROPOSED | Automated unit, API and end-to-end tests shall run in CI on every merge. | CI pipeline reports.
NFR-DATA-001 | Data | VERIFIED | Prototype data shall be versioned (data version 8) and migrated forward automatically on load. | Migration tests.
NFR-DATA-002 | Data | PROPOSED | Production tables shall carry created / updated by and at fields and soft-delete flags where history matters. | Schema review.
NFR-DATA-003 | Data | PENDING CONFIRMATION | Retention periods for orders, POD photos, GPS points and documents shall follow client legal requirements (UAE / India). | Client confirmation.
NFR-COMP-001 | Compliance | PENDING CONFIRMATION | Tax invoices shall comply with the applicable regime (UAE VAT / India GST e-invoicing) if invoicing is in scope. | Tax advisor sign-off.
NFR-COMP-002 | Compliance | PROPOSED | Location tracking shall only run during active deliveries with clear in-app indication and driver consent. | Privacy review.
NFR-PORT-001 | Portability | VERIFIED | The prototype shall run in current Chrome, Edge, Safari and Firefox without installation. | Browser smoke test.
NFR-OBS-001 | Observability | PROPOSED | Production services shall emit structured logs, metrics and traces with alerting. | Monitoring dashboard.
"""

# Business rules: id | module | rule | enforced by | message / effect
RULE_TEXT = r"""
RULE-001 | AUTH | Account locks after 5 failed sign-ins for 15 minutes (configurable 3–20 / 1–1440). | authService.login | "Too many failed attempts…"
RULE-002 | AUTH | Inactive accounts cannot sign in. | authService.login | "This account is inactive…"
RULE-003 | AUTH | Session ends after 60 minutes idle (configurable 5–1440). | SessionWatcher | Signed out.
RULE-004 | AUTH | Password minimum length 8 with mixed characters (configurable). | authService.passwordPolicy | Policy message.
RULE-005 | USR | Users cannot deactivate themselves; only Super Admin changes Super Admin; drivers need a home hub. | userService | Specific messages.
RULE-006 | ORD | Requested delivery date cannot be before the order date; order date cannot be in the future. | orderService.validateOrder | Field messages.
RULE-007 | ORD | An order needs at least one line and a total greater than zero. | orderService.validateOrder | "Add at least one product." / "Order total must be greater than zero."
RULE-008 | ORD | Only the creator's draft orders can be deleted. | orderService.deleteOrder | "Only draft orders can be deleted…"
RULE-009 | ORD | Credit and stock shortfalls are warnings at submission. | orderService.submitOrder | Warning flags.
RULE-010 | APR | Approval requires customer active, hub active, products active and total valid. | approvalService.getApprovalChecks | "Cannot approve: …"
RULE-011 | APR | Credit over limit blocks approval only when "Block when credit exceeded" is on. | approvalService | Warning or block.
RULE-012 | APR | Warnings must be acknowledged before approval. | approvalService.approveOrder | "Confirm that you have reviewed the credit and stock warnings."
RULE-013 | APR | Approval remarks are required when the setting requires them. | approvalService.approveOrder | "Approval remarks are required."
RULE-014 | APR | Return and rejection need a reason from the list and remarks (minimum 5 characters by default). | approvalService | Validation messages.
RULE-015 | APR | Orders are decided once; drafts cannot be decided. | approvalService | "…has already been approved. No change was made."
RULE-016 | CON | Only approved orders can be consolidated; all five checks must be confirmed. | consolidationService | "Complete the verification checklist first."
RULE-017 | CON | Only consolidated orders can be marked ready for dispatch. | consolidationService.markReadyForDispatch | Message.
RULE-018 | DSP | Only READY_FOR_DISPATCH orders with a complete address and not on another active dispatch can be dispatched. | dispatchService.orderIneligibility | Message per order.
RULE-019 | DSP | A dispatch can be edited only while DRAFT, PLANNED or ASSIGNED. | dispatchService.updateDispatch | "…can no longer be edited."
RULE-020 | DSP | Confirmation requires an assigned driver and vehicle, a review tick and enough hub stock per line. | dispatchService.confirmDispatch | "…needs N, only M available at the hub."
RULE-021 | DSP | Stock is deducted once at confirmation and reversed once on cancellation. | utils/dispatchStock | stockDeducted / stockReversed flags.
RULE-022 | DSP | A dispatch cannot be cancelled after any stop has started; cancel needs a reason and remarks. | dispatchService.cancelDispatch | Message.
RULE-023 | DRA | Driver must be active, free, online, from the dispatch hub, with a valid licence and required documents. | driverAssignmentIssues | Issue list.
RULE-024 | DRA | Vehicle must be active, not in maintenance, free, from the hub, within capacity and compliant. | vehicleAssignmentIssues | Issue list.
RULE-025 | VMS | An expired required document always blocks assignment; warning and missing blocks are optional. | complianceService | Block message.
RULE-026 | DRV | A stop can start only if the dispatch is CONFIRMED / IN_TRANSIT, the date has arrived, it is next in sequence and no other stop is out. | deliveryService.startDelivery | Blocker text.
RULE-027 | OTP | OTP is 6 digits, expires after 10 minutes (1–60), locks after 5 wrong attempts; a new OTP invalidates the old one. | otpService | "This OTP has expired…", "Too many incorrect attempts…"
RULE-028 | POD | Delivered quantity ≤ dispatched; receiver name required; photo / signature ≤ 350 KB; remarks ≤ 300 characters. | deliveryService.validatePod | Field messages.
RULE-029 | DRV | Everything delivered → DELIVERED; any shortfall → PARTIALLY_DELIVERED. | deliveryService.confirmDelivery | Status.
RULE-030 | DSP | Dispatch closes COMPLETED when all stops delivered, otherwise PARTIALLY_DELIVERED (Closed with exceptions). | deliveryService | Status.
RULE-031 | EXC | Only failed / partial deliveries are reviewed; remarks required; stock returned once; re-queue only for failed + returned. | deliveryService.reviewDelivery | Messages.
RULE-032 | INV | Stock cannot be removed beyond available unless the product allows negative stock. | inventoryService.validateAdjustment | "Cannot remove more than…"
RULE-033 | INV | Transfer hubs must differ; the source must hold the quantity at completion. | inventoryService.validateTransfer | "Only N available at…"
RULE-034 | INV | Inactive hubs cannot receive stock. | inventoryService.validateReceipt | "…is inactive and cannot receive stock."
RULE-035 | SCR | Scrap quantity ≤ eligible stock (on hand in source minus other open requests); no duplicate open request. | scrapService.validateScrap | Message.
RULE-036 | SCR | Photo proof required for Damaged, Packaging Damage, Contamination; batch required if batch-controlled. | scrapService.validateScrap | Message.
RULE-037 | SCR | Requesters cannot approve their own scrap request; write-off only after approval and only once. | scrapService | "You cannot approve your own scrap request."
RULE-038 | INVC | One active invoice per order; only APPROVED-or-later orders; cancelling requires a reason. | invoiceService.invoiceEligibility | Messages.
RULE-039 | INVC | Invoice total must be greater than zero; due date not before invoice date; demo tax ≤ 40%. | invoiceService.validateInvoiceOptions | Messages.
RULE-040 | DOC | Users may upload only for records in their scope; verified documents are locked until the file is replaced; rejection needs a reason. | documentService | Messages.
RULE-041 | CAP | Customer requested date from tomorrow up to 60 days ahead; login must be linked to a customer. | customerAppService | Messages.
RULE-042 | AUTO | Automated messages are sent once per event and record; skipped when automation is off, no rule or no template. | automationService.fireEvent | History SKIPPED with reason.
RULE-043 | CALL | Follow-up date cannot be before the call; notes ≤ 500 characters; salesmen see own calls. | callService | Messages.
RULE-044 | AI | Only Administrators approve, reject or convert replenishment requests; only creator or admin edits a draft. | replenishmentService | Messages.
"""

# Negative / edge test cases: TC id | module | scenario | role | steps | expected | priority | related FR
NEG_TEXT = r"""
TC-AUTH-N01 | AUTH | Wrong password | ALL | Open /login; enter admin / wrong; Sign in | "The email/username or password is incorrect…"; failed attempt counted | P1 | FR-AUTH-001
TC-AUTH-N02 | AUTH | Lockout after 5 failures | ALL | Enter a wrong password 5 times for one account; try again with the correct password | Account locked for 15 minutes; correct password refused until unlock | P1 | FR-AUTH-004
TC-AUTH-N03 | AUTH | Inactive user | AD | Deactivate a user as admin; sign in as that user | "This account is inactive…" | P1 | FR-AUTH-005
TC-AUTH-N04 | AUTH | Unauthorised route | SE | Sign in as salesman; open /admin/users | Unauthorized page; no data shown | P1 | FR-AUTH-011
TC-AUTH-N05 | AUTH | Expired reset code | ALL | Request a reset code; wait past expiry (or change clock); submit | "This code has expired. Request a new code." | P2 | FR-AUTH-008
TC-ORD-N01 | ORD | Submit without lines | SE | Create order; select customer; no products; Submit | "Add at least one product."; order not submitted | P1 | FR-ORD-003
TC-ORD-N02 | ORD | Delivery date before order date | SE | Set requested date earlier than order date; Submit | "Delivery date cannot be before the order date." | P1 | FR-ORD-003
TC-ORD-N03 | ORD | Delete submitted order | SE | Open a SUBMITTED order; try Delete | Refused: only drafts can be deleted | P2 | FR-ORD-006
TC-ORD-N04 | ORD | Salesman cannot see others' orders | SE | Sign in as salesman; open another salesman's order URL | Access denied / not listed | P1 | FR-ORD-009
TC-APR-N01 | APR | Approve with unacknowledged warning | SM | Open order with credit warning; Approve without ticking acknowledgement | "Confirm that you have reviewed the credit and stock warnings." | P1 | FR-APR-003
TC-APR-N02 | APR | Reject without reason | SM | Open order; Reject; leave reason empty | Validation error; order unchanged | P1 | FR-APR-005
TC-APR-N03 | APR | Approve twice | SM | Approve an order; open it again and try to approve | "…has already been approved. No change was made." | P1 | FR-APR-006
TC-APR-N04 | APR | Inactive customer blocks approval | SM | Make customer inactive (admin); open their submitted order | Approve disabled: "Cannot approve: customer…" | P1 | FR-APR-002
TC-CRD-N01 | CRD | Credit block setting | AD SM | Enable "Block when credit exceeded"; open an over-limit order | Approve disabled; reason shown | P1 | FR-CRD-002
TC-CON-N01 | CON | Consolidate with missing check | CS | Open approved order; tick 4 of 5 checks; Consolidate | "Confirm every check before consolidating (1 left)." | P1 | FR-CON-002
TC-DSP-N01 | DSP | Dispatch a non-ready order | DP | Try to add an APPROVED (not ready) order to a dispatch | "Only orders ready for dispatch can be dispatched." | P1 | FR-DSP-002
TC-DSP-N02 | DSP | Confirm without review tick | DP | Open ASSIGNED dispatch; Confirm without ticking | "Review the orders, driver, vehicle, route and stock, then tick the confirmation." | P1 | FR-DSP-004
TC-DSP-N03 | DSP | Stock short at confirmation | DP | Reduce hub stock below the order quantity; confirm dispatch | "…needs N, only M available at the hub."; not confirmed | P1 | FR-DSP-004
TC-DSP-N04 | DSP | Confirm twice | DP | Confirm a dispatch; repeat confirm | "…already confirmed. Stock was deducted once…" | P1 | FR-DSP-004
TC-DSP-N05 | DSP | Cancel after a stop started | DP | Start a stop as driver; try to cancel the dispatch | Cancellation refused | P2 | FR-DSP-005
TC-DRA-N01 | DRA | Driver with expired licence | DP | Set driver licence expiry in the past; assign | "…driving licence expired on …" | P1 | FR-DRA-002
TC-DRA-N02 | DRA | Vehicle over capacity | DP | Assign a small vehicle to a heavy dispatch | "Load of N exceeds … capacity" | P1 | FR-DRA-003
TC-DRV-N01 | DRV | Start out of sequence | DR | Open stop 2 while stop 1 is pending; Start | Disabled: "Stop 1 (…) comes first in the sequence." | P1 | FR-DRV-002
TC-DRV-N02 | DRV | Start before confirmation | DR | Assigned but unconfirmed dispatch; open stop | "Waiting for the Dispatcher to confirm the dispatch." | P1 | FR-DRV-002
TC-DRV-N03 | DRV | Start tomorrow's stop | DR | Open a stop of tomorrow's dispatch | "Planned for … — Start is available on that day." | P1 | FR-DRV-002
TC-DRV-N04 | DRV | Access another driver's delivery | DR | Open /driver/deliveries/<id of other driver> | Access denied | P1 | FR-RBAC-005
TC-OTP-N01 | OTP | Wrong OTP | DR | Reach location; enter wrong OTP; complete | Error; attempt counted; delivery not completed | P1 | FR-OTP-002
TC-OTP-N02 | OTP | Five wrong OTPs | DR | Enter a wrong OTP 5 times | "Too many incorrect attempts. Generate a new OTP." | P1 | FR-OTP-002
TC-OTP-N03 | OTP | Expired OTP | DR | Wait past expiry; enter the old OTP | "This OTP has expired. Generate a new one." | P1 | FR-OTP-003
TC-POD-N01 | POD | Delivered more than dispatched | DR | Enter delivered quantity above dispatched | Validation error on the line | P1 | FR-POD-002
TC-POD-N02 | POD | Missing receiver name | DR | Leave Received by empty; complete | "Enter the name of the person who received the goods." | P1 | FR-POD-001
TC-EXC-N01 | EXC | Review without remarks | DP | Open failed delivery; Review with empty remarks | "Add review remarks." | P2 | FR-EXC-001
TC-EXC-N02 | EXC | Return stock twice | DP | Review with return to hub; try again | Refused; already reviewed | P2 | FR-EXC-002
TC-INV-N01 | INV | Transfer more than available | IE | Transfer quantity above source available; Complete | "Only N … available at …" | P1 | FR-INV-006
TC-INV-N02 | INV | Receipt at inactive hub | IE | Make hub inactive; create receipt | "…is inactive and cannot receive stock." | P2 | FR-INV-001
TC-SCR-N01 | SCR | Approve own scrap request | WM | Create and submit request as warehouse; approve it as the same user | "You cannot approve your own scrap request." | P1 | FR-SCR-003
TC-SCR-N02 | SCR | Damaged without photo | IE | Reason Damaged, no photo; Submit | Photo proof required | P1 | FR-SCR-002
TC-SCR-N03 | SCR | Quantity above eligible | IE | Quantity larger than available; Submit | "Only N eligible…" | P1 | FR-SCR-002
TC-INVC-N01 | INVC | Invoice a draft order | FI | New invoice; choose a draft order | "Draft orders cannot be invoiced." | P2 | FR-INVC-002
TC-INVC-N02 | INVC | Second invoice for same order | FI | Issue invoice; try to issue another for the same order | "…already has invoice … Cancel it first…" | P2 | FR-INVC-002
TC-INVC-N03 | INVC | Cancel without reason | FI | Cancel invoice with empty reason | "Give a reason for cancelling." | P2 | FR-INVC-003
TC-DOC-N01 | DOC | Reject without reason | QA | Open document review; Reject with no reason | Validation error | P2 | FR-DOC-003
TC-DOC-N02 | DOC | Upload for out-of-scope record | SE | Upload a document for another salesman's customer | "You can only upload documents for your own records." | P2 | FR-DOC-001
TC-CAP-N01 | CAP | Order with past date | CU | Cart; requested date today; Place order | "The earliest delivery date is tomorrow." | P1 | FR-CAP-002
TC-CAP-N02 | CAP | Empty cart | CU | Open cart with no items | "Your cart is empty" empty state | P2 | FR-CAP-002
TC-CAP-N03 | CAP | View another customer's order | CU | Open /customer/orders/<other customer order> | Not shown / access denied | P1 | FR-RBAC-005
TC-DASH-N01 | DASH | Custom range start after end | ALL | Dashboard; Custom range with start after end; Apply | Message; range not applied | P2 | FR-DASH-002
TC-LS-N01 | SET | LocalStorage blocked | ALL | Block site storage in the browser; open the app | App runs in memory; storage issue reported; data not persisted | P2 | NFR-PERF-004
TC-LS-N02 | SET | Data persists after reload | ALL | Create a draft order; reload the browser | Draft still present (LocalStorage) | P1 | FR-ORD-001
"""

# Workflows: WF id | name | initiating role | trigger | outcome | related FRs | source chapter in docs/workflow
WF_TEXT = r"""
WF-01 | Overall Business Workflow | Salesman / Customer | A customer need (order by call, email, WhatsApp or app) | Order delivered, delivery note and invoice available | FR-ORD-002 FR-APR-003 FR-CON-003 FR-DSP-004 FR-DRV-004 FR-INVC-002 | 02
WF-02 | Order-to-Delivery Workflow | Salesman | Order submitted | Order DELIVERED / PARTIALLY_DELIVERED with delivery note | FR-ORD-002 FR-APR-003 FR-CON-002 FR-CON-003 FR-DSP-001 FR-DSP-004 FR-DRV-002 FR-DRV-004 | 06
WF-03 | Salesman Workflow | Salesman | Start of day / customer request | Orders submitted; returned orders corrected | FR-ORD-001 FR-ORD-002 FR-ORD-005 FR-CALL-001 | 04
WF-04 | Sales Manager Approval Workflow | Sales Manager | Order SUBMITTED | APPROVED, RETURNED or REJECTED | FR-APR-001 FR-APR-002 FR-APR-003 FR-APR-004 FR-APR-005 | 07
WF-05 | Customer Service Workflow | Customer Service | Order APPROVED | READY_FOR_DISPATCH | FR-CON-001 FR-CON-002 FR-CON-003 FR-DOC-003 | 04
WF-06 | Credit Validation Workflow | System / Sales Manager | Order submitted or opened for approval | Credit warning acknowledged, order returned / rejected, or approval blocked | FR-CRD-001 FR-CRD-002 FR-CRD-003 | 07
WF-07 | Order Consolidation Workflow | Customer Service | Approved order in queue | CONSOLIDATED then READY_FOR_DISPATCH | FR-CON-001 FR-CON-002 FR-CON-003 FR-CON-004 | 05
WF-08 | Dispatch Workflow | Dispatcher | Orders READY_FOR_DISPATCH | Dispatch CONFIRMED (stock deducted) and closed | FR-DSP-001 FR-DSP-002 FR-DSP-003 FR-DSP-004 FR-DSP-005 FR-DSP-007 | 11
WF-09 | Driver Assignment Workflow | Dispatcher | Dispatch PLANNED | Dispatch ASSIGNED with compliant driver and vehicle | FR-DRA-001 FR-DRA-002 FR-DRA-003 FR-VMS-002 | 11
WF-10 | Driver Delivery Workflow | Driver | Dispatch CONFIRMED and date reached | Stops DELIVERED / PARTIALLY_DELIVERED / FAILED | FR-DRV-001 FR-DRV-002 FR-DRV-003 FR-DRV-004 FR-DRV-005 FR-OTP-002 FR-POD-001 | 08
WF-11 | Customer Order Workflow | Customer | Customer opens the catalog | Order submitted for approval | FR-CAP-001 FR-CAP-002 FR-CAP-006 | 09
WF-12 | Customer Tracking Workflow | Customer | Driver starts the stop | Customer shares OTP; delivery note visible | FR-CAP-003 FR-CAP-004 FR-OTP-001 FR-CAP-005 | 09
WF-13 | Inventory Workflow | Warehouse / Inventory staff | Goods arrive, move or are found different | Stock and ledger updated | FR-INV-001 FR-INV-002 FR-INV-003 FR-INV-004 FR-INV-005 | 10
WF-14 | Scrap Workflow | Warehouse / QA / Inventory staff | Unusable stock found | Stock written off once after approval | FR-SCR-001 FR-SCR-002 FR-SCR-003 FR-SCR-004 | 07, 10
WF-15 | Vehicle Management Workflow | Administrator | Vehicle / driver document recorded or expiring | Compliance state updated; assignment blocked when required | FR-VMS-001 FR-VMS-002 FR-VMS-003 FR-VMS-004 | 11
WF-16 | Invoice Workflow | Finance | Order approved or delivered | Invoice ISSUED (or CANCELLED and reissued) | FR-INVC-001 FR-INVC-002 FR-INVC-003 FR-INVC-004 | 12
WF-17 | Communication Workflow | System / user | Workflow event or manual message | Message logged (demo send) and in-app notification | FR-EML-001 FR-OWA-001 FR-AUTO-001 FR-AUTO-002 FR-NOTF-001 | 13
WF-18 | Exception Management Workflow | Any role | Validation failure or operational exception | Exception resolved by the named role | FR-EXC-001 FR-EXC-002 FR-EXC-003 FR-DRA-002 FR-OTP-002 | 15
WF-19 | Rejection Workflow | Sales Manager / reviewers | Order, scrap, replenishment or document rejected | Requester informed with reason; record closed or corrected | FR-APR-005 FR-SCR-003 FR-DOC-003 FR-AI-003 | 07
WF-20 | Cancellation Workflow | Dispatcher / Finance / requester | Dispatch, invoice, scrap or replenishment must be cancelled | Record CANCELLED; stock / order restored once | FR-DSP-005 FR-INVC-003 FR-SCR-001 FR-ORD-010 | 15
WF-21 | Return Delivery Workflow | Driver / Dispatcher | Delivery failed or partially accepted | Goods returned to hub; order RETURNED_TO_HUB or re-queued | FR-DRV-005 FR-EXC-001 FR-EXC-002 FR-EXC-003 | 15
WF-22 | Document Upload and Verification Workflow | Any uploader | Document uploaded | VERIFIED or REJECTED | FR-DOC-001 FR-DOC-002 FR-DOC-003 FR-DOC-004 | 13
WF-23 | Notification Workflow | System | Any workflow event | In-app notification and optional automated message | FR-NOTF-001 FR-NOTF-002 FR-AUTO-002 | 13
WF-24 | Reporting Workflow | Office roles | User opens a dashboard or report | KPIs, tables, CSV export or print | FR-RPT-001 FR-RPT-002 FR-DASH-002 | 14
"""

STAKEHOLDERS = [
    # name, type, interest, influence, responsibilities, label
    ('Bellomassi management (client sponsor)', 'Client', 'Business value, approval of scope, budget', 'High', 'Approve BRD, SOW, UAT sign-off, go-live decision', 'PENDING CONFIRMATION (names to be provided)'),
    ('Sales Director / Sales Managers', 'Client — business owner', 'Order approval, credit control, sales visibility', 'High', 'Approve sales and approval rules; UAT of order and approval flows', 'PENDING CONFIRMATION'),
    ('Salesmen (Sales Executives)', 'Client — end user', 'Fast order capture on mobile', 'Medium', 'Use the Order Taking App; UAT participants', 'VERIFIED role in SOW'),
    ('Customer Service team', 'Client — end user', 'Consolidation, document review', 'Medium', 'Consolidate and release orders; UAT', 'VERIFIED role in SOW'),
    ('Dispatcher / Logistics Manager', 'Client — business owner', 'Zone planning, fleet, delivery performance', 'High', 'Approve dispatch rules; UAT of dispatch and tracking', 'VERIFIED role in SOW'),
    ('Drivers', 'Client — end user', 'Simple mobile workflow, navigation, OTP', 'Medium', 'Use the Drivers App; pilot participants', 'VERIFIED role in SOW'),
    ('Finance team', 'Client — business owner', 'Credit exposure, invoicing scope, ERP alignment', 'High', 'Confirm invoicing scope and credit rules; SAP alignment', 'PENDING CONFIRMATION'),
    ('Warehouse / Inventory / QA staff', 'Client — end user', 'Stock accuracy, scrap, quality', 'Medium', 'Use inventory and scrap modules (beyond SOW)', 'PENDING CONFIRMATION (scope)'),
    ('Bellomassi customers', 'External user', 'Order accuracy, delivery visibility, OTP security', 'Medium', 'Receive OTP and delivery notes; optional customer app', 'PENDING CONFIRMATION (customer app scope)'),
    ('Client IT / SAP team', 'Client — technical', 'SAP integration, hosting, security', 'High', 'Provide SAP interfaces, hosting decision, security requirements', 'PENDING CONFIRMATION'),
    ('Delivery team — Project Manager', 'Vendor', 'Plan, scope, delivery', 'High', 'Plan, report status, manage risks and changes', 'PROPOSED'),
    ('Delivery team — Business Analyst', 'Vendor', 'Requirements, documentation, UAT support', 'Medium', 'Maintain BRD/SRS/FRDs and traceability', 'PROPOSED'),
    ('Delivery team — Architect / Developers', 'Vendor', 'Design and build', 'Medium', 'Backend, web, mobile, integrations', 'PROPOSED'),
    ('Delivery team — QA', 'Vendor', 'Quality', 'Medium', 'Test plans, execution, defect management', 'PROPOSED'),
    ('Delivery team — DevOps', 'Vendor', 'Environments, CI/CD, monitoring', 'Medium', 'Infrastructure, deployments, backups', 'PROPOSED'),
    ('Third parties: maps (Google), SMS / WhatsApp provider, email provider, cloud host', 'Supplier', 'Service usage and terms', 'Medium', 'Provide APIs and accounts', 'PENDING CONFIRMATION'),
]


def parse(text, n):
    rows = []
    for line in text.strip().splitlines():
        line = line.strip()
        if not line or line.startswith('#'): continue
        p = [x.strip() for x in line.split('|')]
        assert len(p) == n, (n, line)
        rows.append(p)
    return rows


BRS = parse(BR_TEXT, 8)
NFRS = parse(NFR_TEXT, 5)
RULES = parse(RULE_TEXT, 5)
NEGS = parse(NEG_TEXT, 8)
WFS = parse(WF_TEXT, 7)
