"""Requirements model for the documentation package (single source for FRDs, SRS, RTM, test cases).

Every functional requirement line:  ID | priority | label | impl | roles | route | function | requirement | expected result
  label  = VERIFIED / PROTOTYPE / PROPOSED / PENDING CONFIRMATION / NOT IMPLEMENTED / NOT VERIFIED
Role codes: SA AD SE SM CS DP DR FI WM IE QA CU SU ALL
"""

ROLE_NAMES = {
    'SA': 'Super Admin', 'AD': 'Administrator', 'SE': 'Sales Executive (Salesman)', 'SM': 'Sales Manager', 'CS': 'Customer Service',
    'DP': 'Dispatcher', 'DR': 'Driver', 'FI': 'Finance Executive', 'WM': 'Warehouse Manager', 'IE': 'Inventory Executive',
    'QA': 'QA Manager', 'CU': 'Customer (portal / app)', 'SU': 'Supplier (portal)', 'ALL': 'All signed-in users',
}
DEMO = {'SA': 'superadmin / Super@123', 'AD': 'admin / Admin@123', 'SE': 'salesman / Sales@123', 'SM': 'manager / Manager@123',
        'CS': 'cs / Cs@123', 'DP': 'dispatcher / Dispatch@123', 'DR': 'driver / Driver@123', 'FI': 'finance / Finance@123',
        'WM': 'warehouse / Warehouse@123', 'IE': 'inventory / Inventory@123', 'QA': 'qa / Quality@123', 'CU': 'customer / Customer@123',
        'SU': 'supplier / Supplier@123', 'ALL': 'any demo account'}

# code, name, FRD document id, short purpose, key routes, services, storage keys, overall implementation status
MODULES = [
    ('AUTH', 'Authentication and Login', 'Sign-in for office, driver and customer apps; session, lockout, password reset and sign-out.', '/login, /driver/login, /customer/login, /forgot-password, /reset-password, /logout', 'authService, SessionWatcher, ProtectedRoute', 'bellomassi_demo_users, bellomassi_session, bellomassi_auth', 'Implemented with limitations (browser-only demo security)'),
    ('USR', 'User Management', 'Create and maintain user accounts, hub assignment, portal links, activation, unlock and password reset.', '/admin/users, /admin/role-assignment', 'userService', 'bellomassi_demo_users, bellomassi_audit_logs', 'Implemented and working (prototype)'),
    ('RBAC', 'Role and Permission Management', 'System and custom roles, 110 permission keys, data scopes, landing pages, permission matrix.', '/admin/roles, /admin/permissions', 'rbacService, config/permissions.js, config/rbacCatalog.js', 'bellomassi_roles, bellomassi_permissions', 'Implemented and working (prototype)'),
    ('DASH', 'Dashboards and Analytics', 'Role dashboards with KPIs, queues, charts and the universal period filter with comparison.', '/dashboard, /driver/dashboard, /customer/dashboard', 'useDashboardData, useOpsSnapshot, utils/dashboardFilter', '(reads all collections)', 'Implemented and working (prototype)'),
    ('CUS', 'Customer Management', 'Customer master: contacts, address, tax IDs, hub, zone, sales representative, VIP flag and credit settings.', '/customers', 'customerService', 'bellomassi_customers', 'Implemented and working (prototype)'),
    ('PRD', 'Product Catalogue', 'Product master: codes, SKU, barcode, category, unit, price, tax, discount limit, storage condition and stock settings.', '/products', 'productService', 'bellomassi_products', 'Implemented and working (prototype)'),
    ('HUB', 'Hubs, Suppliers and Organisation Master', 'Fulfilment hubs, suppliers, company profile and organisation structure.', '/hubs, /suppliers, /admin/organization/*', 'hubService, supplierService, organizationService', 'bellomassi_hubs, bellomassi_forecast_settings, bellomassi_company, bellomassi_organization', 'Implemented and working (prototype)'),
    ('ORD', 'Salesman Order Management', 'Order capture, drafts, submission, resubmission after return, duplication and order tracking.', '/orders/*', 'orderService', 'bellomassi_orders, bellomassi_order_sequence, bellomassi_order_timeline', 'Implemented and working (prototype)'),
    ('APR', 'Sales Manager Approval', 'Approve, return for correction or reject submitted orders after automatic checks.', '/orders/approval', 'approvalService', 'bellomassi_orders, bellomassi_approvals', 'Implemented and working (prototype)'),
    ('CRD', 'Credit Validation', 'Credit limit check on every order, warning or block at approval, customer credit overview.', '/customers/credit, /orders/approval/:id', 'customerService.getOrderCreditPosition, approvalService', 'bellomassi_customers', 'Implemented with limitations (balance is a manual field; no payments)'),
    ('CON', 'Order Consolidation (Customer Service)', 'Verify approved orders per salesman, consolidate and release to dispatch.', '/orders/consolidation', 'consolidationService', 'bellomassi_consolidations, bellomassi_orders', 'Implemented and working (prototype)'),
    ('DSP', 'Dispatch Management', 'Plan dispatches from ready orders, sequence stops, confirm loading (stock deduction), cancel.', '/dispatch/*', 'dispatchService', 'bellomassi_dispatches, bellomassi_dispatch_timeline, bellomassi_deliveries', 'Implemented and working (prototype)'),
    ('ZON', 'Zone Management', 'Delivery zones as pincode groups per hub; zone of each order and neighbouring-zone warning.', '/dispatch/zones', 'zoneService', 'bellomassi_dispatch_zones', 'Implemented and working (prototype)'),
    ('DRA', 'Driver and Vehicle Assignment', 'Assign compliant, available drivers and vehicles from the same hub with capacity checks.', '/dispatch/assignments, /dispatch/drivers, /dispatch/vehicles', 'dispatchService.assignDispatch, driverService, vehicleService', 'bellomassi_drivers, bellomassi_vehicles', 'Implemented and working (prototype)'),
    ('DRV', 'Driver Application', 'Mobile-first driver workflow: today / tomorrow plan, start, reach location, OTP, POD, complete or fail.', '/driver/*', 'deliveryService, trackingService', 'bellomassi_deliveries, bellomassi_driver_tracking', 'Implemented with limitations (web app; GPS simulated)'),
    ('CAP', 'Customer Application', 'Mobile-first customer workflow: catalog, cart, order, tracking, OTP, delivery notes and invoices.', '/customer/*', 'customerAppService', 'bellomassi_customer_carts, bellomassi_orders', 'Implemented with limitations (payments not implemented)'),
    ('TRK', 'Delivery Tracking', 'Delivery tracking lists, live fleet map and customer tracking with DEMO GPS.', '/dispatch/delivery-tracking, /dispatch/live-tracking, /customer/tracking/:id', 'trackingService, utils/demoGeo', 'bellomassi_driver_tracking', 'Simulated (DEMO GPS)'),
    ('OTP', 'Delivery OTP', '6-digit handover code issued on arrival, verified before completion, attempt limits and expiry.', '/driver/deliveries/:id/confirm', 'otpService', 'bellomassi_delivery_otps', 'Simulated (no SMS / WhatsApp delivery)'),
    ('POD', 'Proof of Delivery', 'Delivered / damaged quantities, receiver, signature, photo and customer remarks.', '/driver/deliveries/:id/confirm', 'deliveryService.confirmDelivery', 'bellomassi_delivery_pod, bellomassi_deliveries', 'Implemented with limitations (stored in browser)'),
    ('DN', 'Delivery Notes', 'Automatic delivery note per completed stop, printable, visible to office, driver and customer.', '/dispatch/delivery-notes/:id', 'deliveryNoteService', 'bellomassi_delivery_notes', 'Implemented and working (prototype)'),
    ('EXC', 'Delivery Exception Review', 'Failed and partial deliveries reviewed by the Dispatcher: return stock, re-queue.', '/dispatch/deliveries/:id', 'deliveryService.reviewDelivery', 'bellomassi_deliveries, bellomassi_stock_movements', 'Implemented and working (prototype)'),
    ('INV', 'Inventory Management', 'Stock per product per hub, receipts, transfers, adjustments, movement ledger, low stock and levels.', '/inventory/*', 'inventoryService', 'bellomassi_inventory, bellomassi_stock_*', 'Implemented and working (prototype)'),
    ('SCR', 'Scrap Management', 'Scrap requests with evidence, approval by a different user and one-time stock write-off.', '/inventory/scrap/*', 'scrapService', 'bellomassi_scrap_requests', 'Implemented and working (prototype)'),
    ('WQA', 'Warehouse and QA Dashboards', 'Picking & loading view, inventory alerts, quarantine, inspections and document expiry; cold-chain card.', '/warehouse, /quality', 'useOpsSnapshot', '(reads inventory, orders, documents)', 'Implemented with limitations (no temperature sensors)'),
    ('VMS', 'Vehicle Management System', 'Vehicle and driver document compliance, expiry register, rules that block assignment.', '/vms/*', 'complianceService, vehicleService', 'bellomassi_vms_settings, bellomassi_documents', 'Implemented and working (prototype)'),
    ('DOC', 'Document Management and OCR', 'Document repository, upload, OCR field capture, review, verification, rejection and expiry.', '/documents/*', 'documentService, ocrService, documentStorageService', 'bellomassi_documents, bellomassi_ocr_results, bellomassi_document_types', 'Implemented with limitations (OCR simulated)'),
    ('INVC', 'Invoice Customisation and Invoicing', 'Invoice templates, numbering, generation from orders, print, email (demo) and cancellation.', '/invoices/*', 'invoiceService, invoiceTemplateService, invoiceCalculationService', 'bellomassi_invoices, bellomassi_invoice_templates, bellomassi_invoice_settings', 'Implemented with limitations (demo tax; outside SOW)'),
    ('EML', 'Email Communication', 'Compose, drafts, sent, history, templates, inbox and settings for email.', '/communication/email/*', 'emailService, emailInboxService', 'bellomassi_email_*', 'Simulated (demo mode); gateway not verified'),
    ('OWA', 'OpenWA (WhatsApp) Communication', 'Compose and log WhatsApp messages, templates and OpenWA session settings.', '/communication/whatsapp/*', 'openWAService, whatsappMessageService', 'bellomassi_whatsapp_*, bellomassi_openwa_settings', 'Simulated (mock session); gateway not verified'),
    ('AUTO', 'Automated Notifications', 'Event-driven email / WhatsApp rules with recipients, templates, de-duplication and history.', '/communication/automation', 'automationService', 'bellomassi_notification_templates, bellomassi_notification_history', 'Implemented over simulated channels'),
    ('CALL', 'Call History', 'Manual call log with outcomes, notes, follow-ups and linked orders.', '/communication/calls/*', 'callService', 'bellomassi_call_history', 'Implemented and working (manual log, no telephony)'),
    ('NOTF', 'Notifications (in-app)', 'Notification bell and centre with categories, read state and preferences.', '/notifications', 'notificationService', 'bellomassi_notifications, bellomassi_notification_preferences', 'Implemented and working (prototype)'),
    ('RPT', 'Reports', 'Reports Center with 118 reports in 11 categories, filters, favourites, CSV export and print; module report pages.', '/reports/center, /reports/view/:id', 'reportService', 'bellomassi_report_prefs', 'Implemented with limitations (24 reports without source data)'),
    ('AI', 'AI Assistant, Forecasting and Replenishment', 'Rule-based assistant and Jarvis, forecasting models, predictive inventory, insights and replenishment requests.', '/ai/*', 'aiChatService, forecastService, replenishmentService, insightService', 'bellomassi_ai_*, bellomassi_forecasts, bellomassi_replenishment_drafts', 'Implemented with limitations (AI provider simulated)'),
    ('SET', 'System Settings and Audit', 'Application settings (security, approval, inventory, localisation), audit log, data reset and export.', '/admin/settings, /admin/audit-logs', 'appSettingsService, auditService, storageService', 'bellomassi_settings, bellomassi_audit_logs', 'Implemented and working (prototype)'),
]

FR_TEXT = r"""
# ---------------- AUTH ----------------
FR-AUTH-001 | P1 | VERIFIED | ALL | /login | authService.login | The system shall authenticate office users by email or username and password and open the role landing page. | Valid credentials open the landing page of the user's role.
FR-AUTH-002 | P1 | VERIFIED | DR | /driver/login | authService.login | The driver app shall accept mobile number, email or username as the identifier. | Driver signs in with +91 98400 11206 / Driver@123 and lands on /driver/dashboard.
FR-AUTH-003 | P1 | VERIFIED | CU | /customer/login | authService.login | The customer app shall accept mobile number, email or username as the identifier. | Customer signs in with +91 98410 22310 / Customer@123 and lands on /customer/dashboard.
FR-AUTH-004 | P1 | VERIFIED | ALL | /login | authService.login | The system shall lock an account for the configured lockout period after the configured number of failed attempts (default 5 attempts, 15 minutes). | Sixth attempt shows "Too many failed attempts. This account is locked for 15 minutes."
FR-AUTH-005 | P1 | VERIFIED | ALL | /login | authService.login | The system shall block sign-in for inactive accounts with a clear message. | "This account is inactive. Contact your administrator to reactivate it."
FR-AUTH-006 | P1 | VERIFIED | ALL | (all pages) | SessionWatcher | The system shall sign users out after the configured idle period (default 60 minutes). | Session ends after inactivity; user returns to the sign-in page of the same app.
FR-AUTH-007 | P2 | VERIFIED | ALL | /login | authService | "Keep me signed in" shall persist the session across browser restarts; otherwise the session ends with the tab. | Session stored in localStorage when ticked, sessionStorage otherwise.
FR-AUTH-008 | P2 | PROTOTYPE | ALL | /forgot-password | authService.requestPasswordReset | Users shall reset a forgotten password with a 6-digit code valid for 15 minutes. | Code is displayed on screen in the prototype (no email is sent).
FR-AUTH-009 | P1 | VERIFIED | ALL | /account/change-password | authService.changeDemoPassword | Users shall be forced to change their password after an administrator reset when the setting is enabled. | User is redirected to /account/change-password?required=1 until the password is changed.
FR-AUTH-010 | P1 | VERIFIED | ALL | /logout | signOutTarget | Sign-out shall return the user to the sign-in page of the app they were using. | Driver → /driver/login, customer → /customer/login, office → /login.
FR-AUTH-011 | P1 | VERIFIED | ALL | (all routes) | ProtectedRoute | Every route shall require sign-in and the route's permission; unauthorised users see the Unauthorized page. | Opening /admin/users as Salesman shows /unauthorized.
FR-AUTH-012 | P1 | PROPOSED | ALL | API | Django auth | Production authentication shall use server-side hashed passwords (Argon2/PBKDF2) and short-lived JWT access tokens with refresh tokens. | No credentials or password hashes are stored in the browser.
FR-AUTH-013 | P2 | PROPOSED | AD SA FI | API | MFA | Privileged roles shall use multi-factor authentication (TOTP) in production. | Admin sign-in requires a second factor.
# ---------------- USR ----------------
FR-USR-001 | P1 | VERIFIED | AD SA | /admin/users/create | userService.createUser | Administrators shall create users with name, username, email, phone, role, home hub and (for portal users) the linked customer, driver or supplier. | User appears in the list and can sign in.
FR-USR-002 | P1 | VERIFIED | AD SA | /admin/users/:id | userService | Administrators shall activate, deactivate, unlock and reset passwords of users. | Status changes are effective at the next sign-in and recorded in the audit log.
FR-USR-003 | P1 | VERIFIED | AD SA | /admin/users | userService | The system shall prevent users from deactivating their own account and only a Super Admin shall change a Super Admin. | "You cannot deactivate your own account." / "Only a Super Admin can change a Super Admin account."
FR-USR-004 | P2 | VERIFIED | AD SA | /admin/role-assignment | userService | Administrators shall assign roles and the home hub to users in bulk. | Assignments saved; drivers require a home hub.
FR-USR-005 | P2 | VERIFIED | ALL | /profile | authService.updateUserProfile | Users shall update their own name and phone and change their password. | Profile saved after validation (name 2–60 characters).
# ---------------- RBAC ----------------
FR-RBAC-001 | P1 | VERIFIED | AD SA | /admin/roles | rbacService | The system shall provide 13 system roles with default permissions, data scopes and landing pages. | Roles listed with permission counts; locked roles cannot be deleted.
FR-RBAC-002 | P1 | VERIFIED | AD SA | /admin/roles/create | rbacService.createRole | Administrators shall create custom roles with a name, data scope, landing page and any set of the 110 permission keys. | Users with the custom role see only permitted menus and a workspace launcher dashboard.
FR-RBAC-003 | P1 | VERIFIED | AD SA | /admin/permissions | rbacService | Administrators shall view and edit the permission matrix for editable roles. | Matrix changes take effect immediately in menus and services.
FR-RBAC-004 | P1 | VERIFIED | ALL | (all services) | can(user, key) | Every business action shall be checked against the user's permissions in the service layer, not only by hiding buttons. | Service returns a permission error when called without the key.
FR-RBAC-005 | P1 | VERIFIED | ALL | (all lists) | data scope filters | Lists shall be limited by data scope: own records (Salesman), linked customer (Customer), own deliveries (Driver), etc. | Salesman sees only own orders; driver cannot open another driver's delivery.
FR-RBAC-006 | P1 | PROPOSED | ALL | API | DRF permissions | Production APIs shall enforce the same permission keys and data scopes server-side. | API returns 403 for missing permission and 404 for out-of-scope records.
# ---------------- DASH ----------------
FR-DASH-001 | P1 | VERIFIED | ALL | /dashboard | RoleDashboard | Each role shall see a dashboard with the KPIs and work queues for that role. | Dashboard component matches the role (Admin, Salesman, Sales Manager, CS, Dispatcher, Finance, Warehouse, QA, Supplier).
FR-DASH-002 | P1 | VERIFIED | ALL | /dashboard | DashboardFilterBar | Every dashboard shall offer period presets (Today … All Time), custom range and specific periods including the April–March financial year. | KPIs, tables and charts follow the selected period.
FR-DASH-003 | P2 | VERIFIED | ALL | /dashboard | DashboardPeriodContext | Dashboards shall optionally compare the selected period with the previous equivalent period. | KPI shows % change, difference and previous value.
FR-DASH-004 | P2 | VERIFIED | ALL | /dashboard | dashboardFilter | Current positions (stock, credit balance, fleet) shall be labelled Current and not filtered by period. | "Current" label shown on those KPIs.
FR-DASH-005 | P2 | VERIFIED | ALL | /dashboard | StatCard | KPI cards and queue rows shall drill down into the filtered module list. | Clicking "Pending approval" opens the approval queue.
FR-DASH-006 | P2 | PROPOSED | AD SA | /monitor | live order monitor | Management shall have a live order monitor with real-time status updates (server push). | Status changes appear without page refresh.
# ---------------- CUS ----------------
FR-CUS-001 | P1 | VERIFIED | AD SA | /customers/create | customerService.createCustomer | Administrators shall create customers with code, type, contacts, address, tax IDs, hub, zone, sales representative, VIP flag and credit settings. | Customer saved and available for ordering.
FR-CUS-002 | P1 | VERIFIED | AD SA | /customers/create | customerService.validateCustomer | Customer data shall be validated (unique code, 10-digit mobile, email, PAN AAAAA9999A, GSTIN containing PAN, 6-digit pincode). | Invalid fields show messages; record is not saved.
FR-CUS-003 | P2 | VERIFIED | AD SA SE SM CS | /customers/:id | customerService | Users shall view customer details with credit position, orders, deliveries and documents within their scope. | Salesman sees only assigned customers' documents.
FR-CUS-004 | P2 | VERIFIED | AD SA | /customers | customerService.deleteCustomer | Customers referenced by orders or other records shall not be deletable. | Delete is blocked and the blocking records are listed.
FR-CUS-005 | P1 | PENDING CONFIRMATION | AD | /customers | customer master | Customer address and tax fields shall follow the operating country (UAE: emirate, TRN, +971 vs India: pincode, GSTIN/PAN, +91). | Client confirms country rules before production.
# ---------------- PRD ----------------
FR-PRD-001 | P1 | VERIFIED | AD SA | /products/create | productService.createProduct | Administrators shall maintain products with code, SKU, barcode, category, unit, price, tax %, maximum discount, storage condition and stock settings. | Product saved and orderable when Active.
FR-PRD-002 | P1 | VERIFIED | AD SA | /products/create | productService.validateProduct | Product codes, SKUs and barcodes shall be unique; tax 0–100%; maximum stock greater than minimum. | Duplicate or invalid values are rejected.
FR-PRD-003 | P2 | VERIFIED | most | /products | productService | Inactive or discontinued products shall not be orderable and shall block approval of orders containing them. | Approval check "Products active" fails.
FR-PRD-004 | P2 | PROPOSED | AD | API | SAP item sync | Item master and quantities shall be synchronised from SAP in stage two (today updated manually from emails). | Items updated automatically from SAP.
# ---------------- HUB ----------------
FR-HUB-001 | P1 | VERIFIED | AD SA | /hubs/create | hubService | Administrators shall maintain hubs (type, address, contacts, status). | Hub available for stock, orders and dispatch when Active.
FR-HUB-002 | P2 | VERIFIED | AD SA | /suppliers | supplierService.saveSupplier | Administrators shall maintain suppliers with lead time and products for replenishment. | Supplier selectable on replenishment requests.
FR-HUB-003 | P3 | VERIFIED | AD SA | /admin/organization/company | organizationService | Administrators shall maintain the company profile and organisation structure (branches, business units, departments, designations, employees, warehouses). | Records saved and used on documents.
# ---------------- ORD ----------------
FR-ORD-001 | P1 | VERIFIED | SE AD | /orders/create | orderService.createOrder | Salesmen shall create orders for a customer and hub with order type, priority, payment terms, order and requested delivery dates, delivery address and product lines. | Order saved as DRAFT with totals (subtotal, discount, tax, total).
FR-ORD-002 | P1 | VERIFIED | SE AD | /orders/create | orderService.submitOrder | Salesmen shall submit orders for approval; the system assigns an order number and notifies the Sales Manager. | Status SUBMITTED, approval PENDING, number BM-ORD-…, notification "New order for approval".
FR-ORD-003 | P1 | VERIFIED | SE AD | /orders/create | orderService.validateOrder | The system shall validate order data: customer, salesman, hub, type, priority, payment terms, valid dates, address, 6-digit pincode, at least one line, total > 0. | Errors shown per field; order not submitted.
FR-ORD-004 | P1 | VERIFIED | SE AD | /orders/create | orderService | The system shall show credit and stock warnings at submission without blocking it. | Warning flags stored on the order and shown to the approver.
FR-ORD-005 | P1 | VERIFIED | SE | /orders/:id/edit | orderService.resubmitOrder | Salesmen shall correct and resubmit returned orders; the section matching the return reason is highlighted. | Status returns to SUBMITTED; timeline records the resubmission.
FR-ORD-006 | P2 | VERIFIED | SE AD | /orders/my-orders | orderService.deleteOrder | Only the creator's draft orders shall be deletable; submitted orders are kept for audit. | "Only draft orders can be deleted…"
FR-ORD-007 | P2 | VERIFIED | SE AD | /orders/:id | orderService.duplicateOrder | Users shall duplicate an existing order into a new draft. | New DRAFT with copied lines.
FR-ORD-008 | P1 | VERIFIED | ALL | /orders/:id | orderService | Every order shall have a timeline of all events (created, submitted, decided, consolidated, dispatched, delivered). | Timeline shows each event with user and time.
FR-ORD-009 | P2 | VERIFIED | SE | /orders | orderService | Salesmen shall see only their own orders; other roles see orders according to their scope. | Order list filtered by scope.
FR-ORD-010 | P2 | NOT IMPLEMENTED | SE SM CU | /orders/:id | (none) | Cancelling a submitted order on customer request. | Not available; Sales Manager may reject with reason "Customer cancelled". PENDING CONFIRMATION of the cancellation rule.
FR-ORD-011 | P2 | PENDING CONFIRMATION | SE | /orders/create | channel capture | Orders shall record the source channel (call, email, WhatsApp, customer app) as described in the SOW. | Customer-app orders are tagged customer_app; office channel field to be confirmed.
# ---------------- APR ----------------
FR-APR-001 | P1 | VERIFIED | SM | /orders/approval | approvalService | Sales Managers shall see an approval queue of submitted orders, oldest first. | Queue lists SUBMITTED / PENDING orders.
FR-APR-002 | P1 | VERIFIED | SM | /orders/approval/:id | approvalService.getApprovalChecks | The system shall run six checks: customer active, hub active, credit within limit, stock available, total valid, products active. | Checks displayed with pass / warn / block.
FR-APR-003 | P1 | VERIFIED | SM | /orders/approval/:id | approvalService.approveOrder | Sales Managers shall approve orders; warnings must be acknowledged and remarks entered when required by settings. | Status APPROVED, consolidation PENDING, Customer Service and salesman notified.
FR-APR-004 | P1 | VERIFIED | SM | /orders/approval/:id | approvalService.returnOrderForCorrection | Sales Managers shall return orders for correction with a reason from a list and remarks. | Status RETURNED; salesman notified with edit link.
FR-APR-005 | P1 | VERIFIED | SM | /orders/approval/:id | approvalService.rejectOrder | Sales Managers shall reject orders with a reason from a list and remarks. | Status REJECTED (final); salesman notified.
FR-APR-006 | P1 | VERIFIED | SM | /orders/approval/:id | approvalService | Draft or already-decided orders shall not be decided again. | "…has already been approved. No change was made."
FR-APR-007 | P1 | PENDING CONFIRMATION | SM | /orders/approval/:id | (none) | The Sales Manager shall be able to set the approved value and quantity (SOW slide 8). | Not implemented: the prototype approves the order as submitted; return for correction is used instead.
FR-APR-008 | P1 | NOT IMPLEMENTED | SM FI | (notification) | approvalService | Finance shall be notified of approved orders, flagged when the credit limit is exceeded (SOW slides 8 and 16). | Not implemented: approval notifies Customer Service and the salesman only.
# ---------------- CRD ----------------
FR-CRD-001 | P1 | VERIFIED | SE SM | /orders/create | customerService.getOrderCreditPosition | The system shall calculate the projected balance (current balance + order total) against the credit limit for every order. | Credit position shown on order and approval screens.
FR-CRD-002 | P1 | VERIFIED | SM AD | /admin/settings | approvalService | Exceeding the credit limit shall be a warning by default and a blocking check when "Block when credit exceeded" is enabled. | Approve is disabled when blocking is on and the limit is exceeded.
FR-CRD-003 | P2 | VERIFIED | AD SM FI | /customers/credit | customerService | Users shall view credit limits, balances and utilisation for all customers. | Customer Credit page lists utilisation and over-limit customers.
FR-CRD-004 | P1 | NOT IMPLEMENTED | FI | (none) | (none) | Customer balances shall be updated from invoices and payments. | Not implemented: balance is a manually maintained field; payments are not recorded.
FR-CRD-005 | P2 | PROPOSED | FI | API | SAP / ERP | Credit balances shall be synchronised from the finance system (SAP) in production. | Balance reflects ERP receivables.
# ---------------- CON ----------------
FR-CON-001 | P1 | VERIFIED | CS | /orders/consolidation | consolidationService | Customer Service shall see approved orders grouped per salesman, oldest approval first. | Queue by salesman displayed.
FR-CON-002 | P1 | VERIFIED | CS | /orders/consolidation/:id | consolidationService.consolidateOrder | Customer Service shall confirm five verification checks and review hub stock before consolidating. | Status CONSOLIDATED; Dispatcher notified.
FR-CON-003 | P1 | VERIFIED | CS | /orders/consolidation/:id | consolidationService.markReadyForDispatch | Customer Service shall release consolidated orders to dispatch. | Status READY_FOR_DISPATCH; Dispatcher and salesman notified.
FR-CON-004 | P2 | VERIFIED | CS | /orders/consolidation/:id | consolidationService | Only approved orders shall be consolidated and only once. | "Only approved orders can be consolidated."
# ---------------- DSP ----------------
FR-DSP-001 | P1 | VERIFIED | DP AD | /dispatch/create | dispatchService.createDispatch | Dispatchers shall create dispatches from ready orders for a hub, zone and date, saved as draft or planned. | Dispatch BM-DSP-… in DRAFT or PLANNED.
FR-DSP-002 | P1 | VERIFIED | DP AD | /dispatch/create | dispatchService.orderIneligibility | Orders not ready, already on another active dispatch or without a complete address shall be refused. | Specific refusal message per order.
FR-DSP-003 | P1 | VERIFIED | DP AD | /dispatch/:id | SequenceEditor, dispatchService.updateSequence | Dispatchers shall set the stop sequence by drag and drop or move buttons; a suggested sequence (priority, pincode) is offered. | Sequence saved; driver notified of changes.
FR-DSP-004 | P1 | VERIFIED | DP AD | /dispatch/:id | dispatchService.confirmDispatch | Dispatchers shall confirm loading after a review tick; stock is deducted once and one delivery is created per order. | Status CONFIRMED; orders DISPATCHED; Stock Dispatch movements.
FR-DSP-005 | P1 | VERIFIED | DP AD | /dispatch/:id | dispatchService.cancelDispatch | Dispatchers shall cancel dispatches with a reason before any stop starts; confirmed dispatches reverse stock once. | Status CANCELLED; orders back to READY_FOR_DISPATCH.
FR-DSP-006 | P2 | VERIFIED | DP AD | /dispatch/:id/edit | dispatchService.updateDispatch | Dispatches shall be editable only while DRAFT, PLANNED or ASSIGNED. | "…is confirmed and can no longer be edited."
FR-DSP-007 | P1 | VERIFIED | DP AD | /dispatch/:id | dispatchService | Dispatch status shall close automatically: COMPLETED when all stops are delivered, PARTIALLY_DELIVERED (Closed with exceptions) otherwise. | Status updates when the last stop closes.
FR-DSP-008 | P1 | PENDING CONFIRMATION | DP | /dispatch/planning | (partial) | Dispatchers shall place orders into zones by drag and drop on a zone board (SOW slide 10). | Prototype: zone chosen in the dispatch form; drag and drop exists for stop sequence only.
FR-DSP-009 | P1 | PROPOSED | DP | API | Google Routes API | The system shall suggest the fastest route using distance and live traffic and warn when a VIP requested time may be missed. | Prototype suggests sequence by priority and pincode only.
# ---------------- ZON ----------------
FR-ZON-001 | P1 | VERIFIED | AD SA | /dispatch/zones/create | zoneService | Administrators shall maintain zones per hub with a list of pincodes. | Zone saved; code unique; at least one pincode.
FR-ZON-002 | P2 | VERIFIED | DP | /dispatch/create | dispatchService | The system shall warn when a dispatch mixes orders from non-neighbouring zones. | Neighbouring-zone warning shown.
# ---------------- DRA ----------------
FR-DRA-001 | P1 | VERIFIED | DP AD | /dispatch/assignments | dispatchService.assignDispatch | Dispatchers shall assign a driver and a vehicle to a planned dispatch. | Status ASSIGNED; driver notified.
FR-DRA-002 | P1 | VERIFIED | DP AD | /dispatch/assignments | driverAssignmentIssues | Drivers shall be refused when inactive, busy on another active dispatch, offline, from another hub, or with an expired or missing licence. | Specific refusal messages.
FR-DRA-003 | P1 | VERIFIED | DP AD | /dispatch/assignments | vehicleAssignmentIssues | Vehicles shall be refused when inactive, in maintenance, busy, from another hub, over capacity, or with expired required documents. | "Load of N exceeds … capacity" etc.
FR-DRA-004 | P1 | VERIFIED | AD SA | /dispatch/drivers, /dispatch/vehicles | driverService, vehicleService | Administrators shall maintain drivers (licence, hub, zone, vehicle, app login) and vehicles (number, type, capacity, hub, documents). | Records validated (Indian vehicle number format, unique licence).
# ---------------- DRV ----------------
FR-DRV-001 | P1 | VERIFIED | DR | /driver/dashboard | DriverHome | Drivers shall see today's and tomorrow's stops published by the Dispatcher, the next stop and their performance. | Today plan listed; tomorrow plan visible with Start disabled.
FR-DRV-002 | P1 | VERIFIED | DR | /driver/deliveries/:id | deliveryService.startDelivery | Drivers shall start a stop only when the dispatch is confirmed, the date has arrived, no other stop is active and it is next in sequence. | Blocker message shown otherwise; status OUT_FOR_DELIVERY when allowed.
FR-DRV-003 | P1 | VERIFIED | DR | /driver/deliveries/:id | deliveryService.markArrived | Drivers shall record arrival at the customer, which issues the delivery OTP. | arrivedAt recorded; OTP issued (simulated).
FR-DRV-004 | P1 | VERIFIED | DR | /driver/deliveries/:id/confirm | deliveryService.confirmDelivery | Drivers shall complete a stop with delivered / damaged quantities, receiver name, optional signature and photo, and the customer's OTP. | DELIVERED or PARTIALLY_DELIVERED; delivery note generated.
FR-DRV-005 | P1 | VERIFIED | DR | /driver/deliveries/:id | deliveryService.failDelivery | Drivers shall report a failed delivery with a reason from the list and remarks. | FAILED; Dispatcher and customer notified.
FR-DRV-006 | P2 | VERIFIED | DR | /driver/route | DriverRoute | Drivers shall view the route of their stops on a map. | DEMO route map displayed (simulated).
FR-DRV-007 | P2 | VERIFIED | DR | /driver/deliveries/:id | ContactActions | Drivers shall call or message the customer contact from the stop screen. | Phone / WhatsApp links open the device app.
FR-DRV-008 | P2 | VERIFIED | DR | /driver/documents | documentService | Drivers shall view and upload their own documents (licence, medical). | Upload goes to the review queue.
FR-DRV-009 | P1 | VERIFIED | DR | /driver/dashboard | DriverHome | VIP stops shall show a VIP badge; the driver follows the sequence published by the Dispatcher. | VIP badge displayed.
FR-DRV-010 | P1 | PROPOSED | DR | React Native app | background GPS | The production driver app shall be a React Native app with background GPS (10–15 s updates) during active deliveries only. | Location continues when the phone is locked; last update time shown.
FR-DRV-011 | P2 | PROPOSED | DR | React Native app | offline queue | The production driver app shall queue status updates when offline and sync when connectivity returns. | No data loss in poor coverage.
# ---------------- CAP ----------------
FR-CAP-001 | P1 | VERIFIED | CU | /customer/catalog | customerAppService | Customers shall browse and search active products with prices and add them to a cart. | Cart persists per customer.
FR-CAP-002 | P1 | VERIFIED | CU | /customer/cart | customerAppService.placeCustomerOrder | Customers shall place orders with delivery address, requested date (tomorrow to 60 days), time slot, reference and remarks. | Order SUBMITTED with source customer_app; cart cleared.
FR-CAP-003 | P1 | VERIFIED | CU | /customer/orders/:id | CustomerOrderDetail | Customers shall follow each order with a stage tracker and customer-friendly labels. | Stages from Order placed to Delivered.
FR-CAP-004 | P1 | VERIFIED | CU | /customer/tracking/:id | CustomerTracking | Customers shall track their own delivery on a map and see the OTP when the driver arrives. | Only own order's vehicle is visible.
FR-CAP-005 | P2 | VERIFIED | CU | /customer/delivery-notes | CustomerDocuments | Customers shall view and print delivery notes and invoices. | Documents listed for the linked customer only.
FR-CAP-006 | P2 | VERIFIED | CU | /customer/orders/:id | customerAppService.reorderToCart | Customers shall reorder a past order into the cart. | Orderable lines copied to cart.
FR-CAP-007 | P2 | NOT IMPLEMENTED | CU | /customer/payments | (none) | Customers shall pay online and see payment history. | Page shows balance and "No payments recorded in this prototype".
FR-CAP-008 | P2 | PENDING CONFIRMATION | CU | /customer/* | scope | The customer app is an addition beyond the SOW (which lists Order Taking App, Drivers App and Admin Panel); inclusion in the production scope needs confirmation. | Client decision recorded.
# ---------------- TRK ----------------
FR-TRK-001 | P1 | VERIFIED | AD SM CS DP | /dispatch/delivery-tracking | deliveryService | Office users shall track every stop on active dispatches with status and times. | List shows live statuses.
FR-TRK-002 | P2 | PROTOTYPE | AD DP | /dispatch/live-tracking | trackingService | Administrators and Dispatchers shall see vehicle positions on a fleet map. | DEMO GPS positions move along a straight-line route.
FR-TRK-003 | P1 | PROPOSED | AD DP CU | API + WebSocket | Django Channels | Production tracking shall push real GPS positions to the admin map (all vehicles) and the customer map (own order only) over WSS. | Updates appear without refresh; customers never see the fleet.
# ---------------- OTP ----------------
FR-OTP-001 | P1 | PROTOTYPE | DR CU | /driver/deliveries/:id | otpService.generateOtp | A 6-digit OTP shall be issued on arrival, valid 10 minutes by default (1–60), shown to the customer. | OTP visible in the customer app; no SMS in the prototype.
FR-OTP-002 | P1 | VERIFIED | DR | /driver/deliveries/:id/confirm | otpService.evaluateOtp | Completion shall require the correct, unexpired OTP; 5 wrong attempts lock the OTP. | Wrong OTP blocks completion; LOCKED after 5 attempts.
FR-OTP-003 | P2 | VERIFIED | DR | /driver/deliveries/:id/confirm | otpService | Drivers shall generate a new OTP when it has expired or is locked; the previous one is invalidated. | New OTP ACTIVE; old INVALIDATED.
FR-OTP-004 | P2 | VERIFIED | DP AD | /dispatch/deliveries/:id | OtpInspector | Dispatchers shall be able to inspect a delivery's OTP status (dispatch.otp.inspect). | OTP state visible to the Dispatcher.
FR-OTP-005 | P1 | PROPOSED | CU | API | SMS / WhatsApp provider | Production OTPs shall be sent to the customer by SMS or WhatsApp and stored hashed. | Customer receives the code on their phone.
# ---------------- POD ----------------
FR-POD-001 | P1 | VERIFIED | DR | /driver/deliveries/:id/confirm | deliveryService.validatePod | Proof of delivery shall capture receiver name, optional signature and photo (≤ 350 KB each) and customer remarks (≤ 300 characters). | POD stored with the delivery.
FR-POD-002 | P1 | VERIFIED | DR | /driver/deliveries/:id/confirm | deliveryService | Delivered quantity shall not exceed the dispatched quantity; damaged and rejected quantities are recorded. | Validation messages per line.
FR-POD-003 | P1 | PROPOSED | DR | API | object storage | Production POD images shall be stored in object storage with signed URLs and retention rules. | No images in browser storage.
# ---------------- DN ----------------
FR-DN-001 | P1 | VERIFIED | DR | (automatic) | deliveryNoteService | A numbered delivery note (BM-DN-YYYY-NNNNN) shall be generated when a stop is completed (full or partial). | Note lists delivered, short and damaged quantities and receiver.
FR-DN-002 | P1 | VERIFIED | ALL | /dispatch/delivery-notes/:id | DeliveryNote | Delivery notes shall be printable and visible to office roles with permission, the driver and the customer. | Print layout available.
FR-DN-003 | P1 | PROPOSED | CU | API | messaging | The delivery note shall be sent to the customer instantly by SMS / WhatsApp / email (SOW slide 13). | Prototype: visible in the customer app only.
# ---------------- EXC ----------------
FR-EXC-001 | P1 | VERIFIED | DP AD | /dispatch/deliveries/:id | deliveryService.reviewDelivery | Dispatchers shall review failed and partial deliveries with remarks. | Review status REVIEWED.
FR-EXC-002 | P1 | VERIFIED | DP AD | /dispatch/deliveries/:id | deliveryService.reviewDelivery | The review may return undelivered (not damaged) stock to the hub once. | Delivery Return movement posted once.
FR-EXC-003 | P1 | VERIFIED | DP AD | /dispatch/deliveries/:id | deliveryService.reviewDelivery | A failed delivery whose goods are returned may be re-queued for a new dispatch. | Order READY_FOR_DISPATCH.
# ---------------- INV ----------------
FR-INV-001 | P1 | VERIFIED | AD WM IE | /inventory/stock-receipts/create | inventoryService.createStockReceipt | Warehouse users shall record goods receipts that increase hub stock immediately. | GRN created; Stock Receipt movement.
FR-INV-002 | P1 | VERIFIED | AD WM IE | /inventory/stock-transfers/create | inventoryService.createStockTransfer | Warehouse users shall transfer stock between hubs as a draft or completed immediately. | Transfer Out / In movements on completion.
FR-INV-003 | P1 | VERIFIED | AD WM QA | /inventory/stock-adjustments/create | inventoryService.createStockAdjustment | Authorised users shall adjust stock (increase, decrease, damaged, lost, correction) with a reason. | Movement posted immediately.
FR-INV-004 | P1 | VERIFIED | most | /inventory/movements | inventoryService | Every stock change shall be written to the movement ledger. | Ledger shows type, quantity, reference, user and time.
FR-INV-005 | P2 | VERIFIED | AD WM IE | /inventory/stock/:id | inventoryService.updateStockLevels | Users shall set minimum, reorder and maximum levels per stock line. | Low Stock list uses the reorder level.
FR-INV-006 | P1 | VERIFIED | AD WM IE | /inventory/stock-transfers | inventoryService | Stock cannot go negative unless the product allows it; completed transfers are not posted twice. | "Only N available…" / "already completed".
FR-INV-007 | P2 | NOT IMPLEMENTED | WM | /inventory | (none) | Batch and expiry tracking per stock line, FEFO picking and cycle counting. | Settings exist (UI only); not enforced.
FR-INV-008 | P2 | PROPOSED | WM | API | SAP stock sync | Stock positions shall be synchronised with SAP in stage two. | Stock reconciled with ERP.
# ---------------- SCR ----------------
FR-SCR-001 | P1 | VERIFIED | AD DP WM IE QA | /inventory/scrap/requests/create | scrapService.saveScrap | Users shall raise scrap requests with reason, quantity, stock source, batch and photo evidence. | DRAFT or PENDING_APPROVAL.
FR-SCR-002 | P1 | VERIFIED | AD DP WM IE QA | /inventory/scrap/requests/create | scrapService.validateScrap | Quantity shall not exceed eligible stock; photo required for Damaged, Packaging Damage and Contamination; batch required for batch-controlled products; no duplicate open request. | Validation messages.
FR-SCR-003 | P1 | VERIFIED | AD WM | /inventory/scrap/requests/:id | scrapService.approveScrap | Approvers shall approve or reject requests; requesters cannot approve their own. | APPROVED / REJECTED.
FR-SCR-004 | P1 | VERIFIED | AD WM | /inventory/scrap/requests/:id | scrapService.writeOffScrap | Approvers shall post the stock write-off exactly once. | COMPLETED; Scrap Write-off movement.
FR-SCR-005 | P3 | VERIFIED | AD WM | /inventory/scrap/requests/:id/print | ScrapNote | A printable scrap note shall be available. | Print layout.
# ---------------- WQA ----------------
FR-WQA-001 | P2 | VERIFIED | AD WM IE QA | /warehouse | WarehouseDashboard | Warehouse users shall see picking & loading, inventory alerts, damaged stock and document expiry. | Dashboard lists consolidated / ready orders per hub.
FR-WQA-002 | P2 | VERIFIED | AD WM QA | /quality | QaDashboard | QA users shall see inspection queues, quarantine, expired documents and the cold-chain card. | Cold-chain card states "No sensor integration".
FR-WQA-003 | P2 | NOT IMPLEMENTED | QA | /quality | (none) | Live cold-chain temperature monitoring and excursion alerts. | Not available (ranges configured only).
# ---------------- VMS ----------------
FR-VMS-001 | P1 | VERIFIED | AD DP QA | /vms | complianceService | The system shall compute compliance per vehicle and driver document (Valid, 30 days, 7 days, today, expired, missing). | Expiry register sorted by urgency.
FR-VMS-002 | P1 | VERIFIED | AD | /vms/settings | complianceService | Administrators shall define required documents and blocking rules; an expired required document always blocks assignment. | Assignment blocked with the specific document message.
FR-VMS-003 | P2 | VERIFIED | AD CS DP | /vms/vehicles/:id/documents | documentService | Authorised users shall upload vehicle and driver documents with expiry dates. | Document enters the review flow.
FR-VMS-004 | P2 | VERIFIED | AD | /vms/document-expiry | automationService.scanDocumentExpiries | Opening the expiry register shall raise DOCUMENT_EXPIRING / DOCUMENT_EXPIRED events. | Automated notification when a rule is enabled.
FR-VMS-005 | P3 | NOT IMPLEMENTED | AD | /vms | (none) | Fuel, maintenance and trip cost tracking. | Related reports show "no source data".
# ---------------- DOC ----------------
FR-DOC-001 | P1 | VERIFIED | most | /documents/upload | documentService.uploadDocument | Users shall upload documents for records they may access, with type, linked record, file and key fields. | Status PENDING_OCR, PENDING_REVIEW or VERIFIED by type settings.
FR-DOC-002 | P1 | PROTOTYPE | AD CS QA | /documents/ocr-queue | ocrService.processDocument | The system shall extract fields with OCR and let reviewers correct them (originals kept). | MOCK OCR pre-fills from the linked record (labelled Simulated OCR).
FR-DOC-003 | P1 | VERIFIED | AD CS QA | /documents/:id/review | documentService.verifyDocument | Reviewers shall verify or reject documents; rejection requires a reason. | VERIFIED (locked) or REJECTED.
FR-DOC-004 | P2 | VERIFIED | AD | /documents/types | documentTypeService | Administrators shall maintain document types (fields, expiry, OCR, verification). | Built-in VMS codes cannot be changed.
FR-DOC-005 | P1 | PROPOSED | AD | API | OCR engine | Production OCR shall run server-side (e.g. Tesseract / cloud OCR) with virus scanning of uploads. | Real field extraction; files never executed.
# ---------------- INVC ----------------
FR-INVC-001 | P2 | VERIFIED | AD FI | /invoices/templates | invoiceTemplateService | Finance shall maintain invoice templates (layout, fonts, colours, sections, default). | Template preview available.
FR-INVC-002 | P2 | VERIFIED | AD FI | /invoices/create | invoiceService.generateInvoice | Finance shall issue one invoice per approved-or-later order on ordered or delivered quantities with discounts and charges. | Invoice BM-INV-YYYY-NNNNN ISSUED with frozen snapshot.
FR-INVC-003 | P2 | VERIFIED | AD FI | /invoices/:id | invoiceService.cancelInvoice | Finance shall cancel an invoice with a reason, after which a new invoice can be issued. | CANCELLED; order invoiceable again.
FR-INVC-004 | P2 | VERIFIED | AD FI | /admin/settings | invoiceService.updateInvoiceSettings | Finance shall configure invoice numbering (prefix, year, digits). | Next number follows settings.
FR-INVC-005 | P1 | PENDING CONFIRMATION | FI | /invoices | scope | The SOW states invoicing stays outside the application; the prototype includes invoicing. Production scope must be confirmed. | Client decision recorded.
FR-INVC-006 | P2 | NOT IMPLEMENTED | FI | (none) | (none) | Payments, receipts, credit notes and refunds. | Not available.
# ---------------- EML ----------------
FR-EML-001 | P2 | PROTOTYPE | SE SM CS DP FI AD | /communication/email/compose | emailService.sendEmail | Users shall compose and send emails with templates and document attachments. | Demo mode records SENT_DEMO ("not sent").
FR-EML-002 | P2 | VERIFIED | AD | /communication/email/templates | emailService | Administrators shall maintain email templates with variables. | Templates render with record values.
FR-EML-003 | P3 | PROTOTYPE | AD SM CS | /communication/email/inbox | emailInboxService | Users shall read the mailbox. | Seeded demo mailbox.
FR-EML-004 | P2 | NOT VERIFIED | AD | /communication/email/settings | integrationGateway | Live SMTP / IMAP through the integration gateway. | Not verified (no gateway available).
# ---------------- OWA ----------------
FR-OWA-001 | P2 | PROTOTYPE | SE SM CS DP FI AD | /communication/whatsapp/compose | openWAService | Users shall send WhatsApp messages using templates. | Mock provider records "Sent · demo".
FR-OWA-002 | P2 | NOT VERIFIED | AD | /communication/whatsapp/settings | integrationGateway | Live OpenWA session (QR, start / stop) through the gateway. | Not verified.
FR-OWA-003 | P1 | PENDING CONFIRMATION | AD | (scope) | provider choice | The customer messaging provider (SMS or WhatsApp; OpenWA is unofficial) must be confirmed at kickoff (SOW slide 16). | Decision recorded in the decision log.
# ---------------- AUTO ----------------
FR-AUTO-001 | P2 | VERIFIED | AD | /communication/automation | automationService | Administrators shall configure per-event rules (channel, recipients, templates) and a master switch. | 11 events configurable.
FR-AUTO-002 | P2 | VERIFIED | (system) | (services) | automationService.fireEvent | Workflow events shall trigger messages once per record (de-duplicated) and be logged in history. | History shows SENT_DEMO / SKIPPED with reason.
# ---------------- CALL ----------------
FR-CALL-001 | P3 | VERIFIED | SE SM CS AD | /communication/calls/create | callService | Users shall log calls with direction, status, outcome, duration and notes. | Call saved; salesmen see their own calls only.
FR-CALL-002 | P3 | VERIFIED | SE SM CS AD | /communication/calls/follow-ups | callService | Users shall schedule and complete follow-ups and link orders to calls. | Follow-ups grouped overdue / today / upcoming.
# ---------------- NOTF ----------------
FR-NOTF-001 | P1 | VERIFIED | ALL | /notifications | notificationService | Users shall receive in-app notifications for workflow events addressed to their role, user, driver or customer record. | Bell count and Notification Center.
FR-NOTF-002 | P3 | VERIFIED | ALL | /settings | notificationService | Users shall mark notifications read and mute categories. | Preferences saved per user.
FR-NOTF-003 | P2 | PROPOSED | ALL | mobile push | FCM / APNs | Production apps shall send push notifications to drivers and customers. | Push received on the phone.
# ---------------- RPT ----------------
FR-RPT-001 | P2 | VERIFIED | office roles | /reports/center | reportService | Users shall browse 118 reports in 11 categories filtered by permission, with search, favourites and recent. | Only permitted categories visible.
FR-RPT-002 | P2 | VERIFIED | office roles | /reports/view/:id | reportService.runReport | Reports shall run with date, month, year and grouping filters within the user's data scope and export to CSV or print. | CSV downloaded; print layout.
FR-RPT-003 | P3 | VERIFIED | office roles | /reports/view/:id | reportService | Reports without source data shall say so with the reason. | 24 reports show "no source data".
# ---------------- AI ----------------
FR-AI-001 | P3 | PROTOTYPE | most | /ai/assistant | aiChatService | Users shall ask business questions in natural language and receive tables and charts from permission-checked tools. | Demo intent engine answers; write actions need confirmation.
FR-AI-002 | P3 | VERIFIED | AD SM | /ai/forecasting/new | forecastService | Users shall generate demand forecasts with selectable models and accuracy metrics. | Forecast saved and exportable.
FR-AI-003 | P2 | VERIFIED | AD DP WM IE | /ai/replenishment/create | replenishmentService | Users shall raise replenishment requests; Administrators approve, reject and convert them; stock receipts complete them. | DRAFT → SUBMITTED → APPROVED → CONVERTED → RECEIVED.
FR-AI-004 | P3 | VERIFIED | many | /ai/insights | insightService | The system shall generate rule-based insights that users mark reviewed or resolved. | NEW → REVIEWED → RESOLVED.
FR-AI-005 | P3 | NOT VERIFIED | AD | /ai/settings | aiProvider | External AI providers (OpenJarvis, Ollama, Gemini, OpenAI-compatible). | Not verified.
# ---------------- SET ----------------
FR-SET-001 | P1 | VERIFIED | AD | /admin/settings | appSettingsService | Administrators shall configure security, approval, localisation, numbering, inventory, warehouse and cold-chain settings. | Settings validated and applied.
FR-SET-002 | P1 | VERIFIED | AD SA | /admin/audit-logs | auditService | Administrative and security events shall be recorded in the audit log. | User, role, settings and lockout events listed.
FR-SET-003 | P2 | VERIFIED | AD | /admin/settings | storageService.resetDemoData, exportAppData, importAppData | Administrators shall reset demo data and export / import the application data. | Data reset to seed; JSON export validated on import.
FR-SET-004 | P1 | PROPOSED | AD | API | PostgreSQL | Production data shall be stored in PostgreSQL with daily backups, point-in-time recovery and audit fields on every table. | Data shared across users and devices.
"""


IMPL = {'VERIFIED': 'Implemented and working (prototype)', 'PROTOTYPE': 'Simulated in prototype', 'PROPOSED': 'Planned (production)',
        'PENDING CONFIRMATION': 'Pending client confirmation', 'NOT IMPLEMENTED': 'Not implemented', 'NOT VERIFIED': 'Not verified'}


def frs():
    out = []
    for line in FR_TEXT.strip().splitlines():
        line = line.strip()
        if not line or line.startswith('#'): continue
        p = [x.strip() for x in line.split('|')]
        assert len(p) == 8, line
        fid, pr, label, roles, route, fn, req, exp = p
        assert label in IMPL, line
        out.append(dict(id=fid, module=fid.split('-')[1], priority=pr, label=label, roles=roles, route=route, function=fn,
                        text=req, expected=exp, impl=IMPL[label]))
    return out
