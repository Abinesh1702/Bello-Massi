# Product Feature Catalogue

## Document control

| Field | Value |
|---|---|
| Document title | Product Feature Catalogue |
| Document ID | BM-OVW-014 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | Project Overview |
| Related module(s) | All modules |
| Document owner | Product Manager |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

Catalogue every module and feature found in the source code with its implementation label.

## Scope

35 modules and 179 features (functional requirements).

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-OVW-016 — Project Feature Inventory](BM-OVW-016_Project_Feature_Inventory.xlsx)
- [BM-SYS-003 — Functional Requirements Document (Consolidated)](../03_SYSTEM_REQUIREMENTS/BM-SYS-003_Functional_Requirements_Document.md)

## Contents

- 1. Module catalogue
- Authentication and Login
- User Management
- Role and Permission Management
- Dashboards and Analytics
- Customer Management
- Product Catalogue
- Hubs, Suppliers and Organisation Master
- Salesman Order Management
- Sales Manager Approval
- Credit Validation
- Order Consolidation (Customer Service)
- Dispatch Management
- Zone Management
- Driver and Vehicle Assignment
- Driver Application
- Customer Application
- Delivery Tracking
- Delivery OTP
- Proof of Delivery
- Delivery Notes
- Delivery Exception Review
- Inventory Management
- Scrap Management
- Warehouse and QA Dashboards
- Vehicle Management System
- Document Management and OCR
- Invoice Customisation and Invoicing
- Email Communication
- OpenWA (WhatsApp) Communication
- Automated Notifications
- Call History
- Notifications (in-app)
- Reports
- AI Assistant, Forecasting and Replenishment
- System Settings and Audit

## 1. Module catalogue

| # | Code | Module | Purpose | Implementation status | FRs | FRD |
|---|---|---|---|---|---|---|
| 1 | AUTH | Authentication and Login | Sign-in for office, driver and customer apps; session, lockout, password reset and sign-out. | Implemented with limitations (browser-only demo security) | 13 | [BM-FRD-AUTH — Functional Requirements — Authentication and Login](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-AUTH_Authentication_and_Login.md) |
| 2 | USR | User Management | Create and maintain user accounts, hub assignment, portal links, activation, unlock and password reset. | Implemented and working (prototype) | 5 | [BM-FRD-USR — Functional Requirements — User Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-USR_User_Management.md) |
| 3 | RBAC | Role and Permission Management | System and custom roles, 110 permission keys, data scopes, landing pages, permission matrix. | Implemented and working (prototype) | 6 | [BM-FRD-RBAC — Functional Requirements — Role and Permission Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-RBAC_Role_and_Permission_Management.md) |
| 4 | DASH | Dashboards and Analytics | Role dashboards with KPIs, queues, charts and the universal period filter with comparison. | Implemented and working (prototype) | 6 | [BM-FRD-DASH — Functional Requirements — Dashboards and Analytics](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DASH_Dashboards_and_Analytics.md) |
| 5 | CUS | Customer Management | Customer master: contacts, address, tax IDs, hub, zone, sales representative, VIP flag and credit settings. | Implemented and working (prototype) | 5 | [BM-FRD-CUS — Functional Requirements — Customer Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-CUS_Customer_Management.md) |
| 6 | PRD | Product Catalogue | Product master: codes, SKU, barcode, category, unit, price, tax, discount limit, storage condition and stock settings. | Implemented and working (prototype) | 4 | [BM-FRD-PRD — Functional Requirements — Product Catalogue](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-PRD_Product_Catalogue.md) |
| 7 | HUB | Hubs, Suppliers and Organisation Master | Fulfilment hubs, suppliers, company profile and organisation structure. | Implemented and working (prototype) | 3 | [BM-FRD-HUB — Functional Requirements — Hubs, Suppliers and Organisation Master](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-HUB_Hubs_Suppliers_and_Organisation_Master.md) |
| 8 | ORD | Salesman Order Management | Order capture, drafts, submission, resubmission after return, duplication and order tracking. | Implemented and working (prototype) | 11 | [BM-FRD-ORD — Functional Requirements — Salesman Order Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-ORD_Salesman_Order_Management.md) |
| 9 | APR | Sales Manager Approval | Approve, return for correction or reject submitted orders after automatic checks. | Implemented and working (prototype) | 8 | [BM-FRD-APR — Functional Requirements — Sales Manager Approval](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-APR_Sales_Manager_Approval.md) |
| 10 | CRD | Credit Validation | Credit limit check on every order, warning or block at approval, customer credit overview. | Implemented with limitations (balance is a manual field; no payments) | 5 | [BM-FRD-CRD — Functional Requirements — Credit Validation](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-CRD_Credit_Validation.md) |
| 11 | CON | Order Consolidation (Customer Service) | Verify approved orders per salesman, consolidate and release to dispatch. | Implemented and working (prototype) | 4 | [BM-FRD-CON — Functional Requirements — Order Consolidation (Customer Service)](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-CON_Order_Consolidation_Customer_Service.md) |
| 12 | DSP | Dispatch Management | Plan dispatches from ready orders, sequence stops, confirm loading (stock deduction), cancel. | Implemented and working (prototype) | 9 | [BM-FRD-DSP — Functional Requirements — Dispatch Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DSP_Dispatch_Management.md) |
| 13 | ZON | Zone Management | Delivery zones as pincode groups per hub; zone of each order and neighbouring-zone warning. | Implemented and working (prototype) | 2 | [BM-FRD-ZON — Functional Requirements — Zone Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-ZON_Zone_Management.md) |
| 14 | DRA | Driver and Vehicle Assignment | Assign compliant, available drivers and vehicles from the same hub with capacity checks. | Implemented and working (prototype) | 4 | [BM-FRD-DRA — Functional Requirements — Driver and Vehicle Assignment](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DRA_Driver_and_Vehicle_Assignment.md) |
| 15 | DRV | Driver Application | Mobile-first driver workflow: today / tomorrow plan, start, reach location, OTP, POD, complete or fail. | Implemented with limitations (web app; GPS simulated) | 11 | [BM-FRD-DRV — Functional Requirements — Driver Application](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DRV_Driver_Application.md) |
| 16 | CAP | Customer Application | Mobile-first customer workflow: catalog, cart, order, tracking, OTP, delivery notes and invoices. | Implemented with limitations (payments not implemented) | 8 | [BM-FRD-CAP — Functional Requirements — Customer Application](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-CAP_Customer_Application.md) |
| 17 | TRK | Delivery Tracking | Delivery tracking lists, live fleet map and customer tracking with DEMO GPS. | Simulated (DEMO GPS) | 3 | [BM-FRD-TRK — Functional Requirements — Delivery Tracking](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-TRK_Delivery_Tracking.md) |
| 18 | OTP | Delivery OTP | 6-digit handover code issued on arrival, verified before completion, attempt limits and expiry. | Simulated (no SMS / WhatsApp delivery) | 5 | [BM-FRD-OTP — Functional Requirements — Delivery OTP](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-OTP_Delivery_OTP.md) |
| 19 | POD | Proof of Delivery | Delivered / damaged quantities, receiver, signature, photo and customer remarks. | Implemented with limitations (stored in browser) | 3 | [BM-FRD-POD — Functional Requirements — Proof of Delivery](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-POD_Proof_of_Delivery.md) |
| 20 | DN | Delivery Notes | Automatic delivery note per completed stop, printable, visible to office, driver and customer. | Implemented and working (prototype) | 3 | [BM-FRD-DN — Functional Requirements — Delivery Notes](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DN_Delivery_Notes.md) |
| 21 | EXC | Delivery Exception Review | Failed and partial deliveries reviewed by the Dispatcher: return stock, re-queue. | Implemented and working (prototype) | 3 | [BM-FRD-EXC — Functional Requirements — Delivery Exception Review](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-EXC_Delivery_Exception_Review.md) |
| 22 | INV | Inventory Management | Stock per product per hub, receipts, transfers, adjustments, movement ledger, low stock and levels. | Implemented and working (prototype) | 8 | [BM-FRD-INV — Functional Requirements — Inventory Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-INV_Inventory_Management.md) |
| 23 | SCR | Scrap Management | Scrap requests with evidence, approval by a different user and one-time stock write-off. | Implemented and working (prototype) | 5 | [BM-FRD-SCR — Functional Requirements — Scrap Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-SCR_Scrap_Management.md) |
| 24 | WQA | Warehouse and QA Dashboards | Picking & loading view, inventory alerts, quarantine, inspections and document expiry; cold-chain card. | Implemented with limitations (no temperature sensors) | 3 | [BM-FRD-WQA — Functional Requirements — Warehouse and QA Dashboards](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-WQA_Warehouse_and_QA_Dashboards.md) |
| 25 | VMS | Vehicle Management System | Vehicle and driver document compliance, expiry register, rules that block assignment. | Implemented and working (prototype) | 5 | [BM-FRD-VMS — Functional Requirements — Vehicle Management System](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-VMS_Vehicle_Management_System.md) |
| 26 | DOC | Document Management and OCR | Document repository, upload, OCR field capture, review, verification, rejection and expiry. | Implemented with limitations (OCR simulated) | 5 | [BM-FRD-DOC — Functional Requirements — Document Management and OCR](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DOC_Document_Management_and_OCR.md) |
| 27 | INVC | Invoice Customisation and Invoicing | Invoice templates, numbering, generation from orders, print, email (demo) and cancellation. | Implemented with limitations (demo tax; outside SOW) | 6 | [BM-FRD-INVC — Functional Requirements — Invoice Customisation and Invoicing](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-INVC_Invoice_Customisation_and_Invoicing.md) |
| 28 | EML | Email Communication | Compose, drafts, sent, history, templates, inbox and settings for email. | Simulated (demo mode); gateway not verified | 4 | [BM-FRD-EML — Functional Requirements — Email Communication](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-EML_Email_Communication.md) |
| 29 | OWA | OpenWA (WhatsApp) Communication | Compose and log WhatsApp messages, templates and OpenWA session settings. | Simulated (mock session); gateway not verified | 3 | [BM-FRD-OWA — Functional Requirements — OpenWA (WhatsApp) Communication](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-OWA_OpenWA_WhatsApp_Communication.md) |
| 30 | AUTO | Automated Notifications | Event-driven email / WhatsApp rules with recipients, templates, de-duplication and history. | Implemented over simulated channels | 2 | [BM-FRD-AUTO — Functional Requirements — Automated Notifications](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-AUTO_Automated_Notifications.md) |
| 31 | CALL | Call History | Manual call log with outcomes, notes, follow-ups and linked orders. | Implemented and working (manual log, no telephony) | 2 | [BM-FRD-CALL — Functional Requirements — Call History](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-CALL_Call_History.md) |
| 32 | NOTF | Notifications (in-app) | Notification bell and centre with categories, read state and preferences. | Implemented and working (prototype) | 3 | [BM-FRD-NOTF — Functional Requirements — Notifications (in-app)](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-NOTF_Notifications_in_app.md) |
| 33 | RPT | Reports | Reports Center with 118 reports in 11 categories, filters, favourites, CSV export and print; module report pages. | Implemented with limitations (24 reports without source data) | 3 | [BM-FRD-RPT — Functional Requirements — Reports](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-RPT_Reports.md) |
| 34 | AI | AI Assistant, Forecasting and Replenishment | Rule-based assistant and Jarvis, forecasting models, predictive inventory, insights and replenishment requests. | Implemented with limitations (AI provider simulated) | 5 | [BM-FRD-AI — Functional Requirements — AI Assistant, Forecasting and Replenishment](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-AI_AI_Assistant_Forecasting_and_Replenishment.md) |
| 35 | SET | System Settings and Audit | Application settings (security, approval, inventory, localisation), audit log, data reset and export. | Implemented and working (prototype) | 4 | [BM-FRD-SET — Functional Requirements — System Settings and Audit](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-SET_System_Settings_and_Audit.md) |

## Authentication and Login

- **FR-AUTH-001** — The system shall authenticate office users by email or username and password and open the role landing page. _(VERIFIED)_
- **FR-AUTH-002** — The driver app shall accept mobile number, email or username as the identifier. _(VERIFIED)_
- **FR-AUTH-003** — The customer app shall accept mobile number, email or username as the identifier. _(VERIFIED)_
- **FR-AUTH-004** — The system shall lock an account for the configured lockout period after the configured number of failed attempts (default 5 attempts, 15 minutes). _(VERIFIED)_
- **FR-AUTH-005** — The system shall block sign-in for inactive accounts with a clear message. _(VERIFIED)_
- **FR-AUTH-006** — The system shall sign users out after the configured idle period (default 60 minutes). _(VERIFIED)_
- **FR-AUTH-007** — "Keep me signed in" shall persist the session across browser restarts; otherwise the session ends with the tab. _(VERIFIED)_
- **FR-AUTH-008** — Users shall reset a forgotten password with a 6-digit code valid for 15 minutes. _(PROTOTYPE)_
- **FR-AUTH-009** — Users shall be forced to change their password after an administrator reset when the setting is enabled. _(VERIFIED)_
- **FR-AUTH-010** — Sign-out shall return the user to the sign-in page of the app they were using. _(VERIFIED)_
- **FR-AUTH-011** — Every route shall require sign-in and the route's permission; unauthorised users see the Unauthorized page. _(VERIFIED)_
- **FR-AUTH-012** — Production authentication shall use server-side hashed passwords (Argon2/PBKDF2) and short-lived JWT access tokens with refresh tokens. _(PROPOSED)_
- **FR-AUTH-013** — Privileged roles shall use multi-factor authentication (TOTP) in production. _(PROPOSED)_

## User Management

- **FR-USR-001** — Administrators shall create users with name, username, email, phone, role, home hub and (for portal users) the linked customer, driver or supplier. _(VERIFIED)_
- **FR-USR-002** — Administrators shall activate, deactivate, unlock and reset passwords of users. _(VERIFIED)_
- **FR-USR-003** — The system shall prevent users from deactivating their own account and only a Super Admin shall change a Super Admin. _(VERIFIED)_
- **FR-USR-004** — Administrators shall assign roles and the home hub to users in bulk. _(VERIFIED)_
- **FR-USR-005** — Users shall update their own name and phone and change their password. _(VERIFIED)_

## Role and Permission Management

- **FR-RBAC-001** — The system shall provide 13 system roles with default permissions, data scopes and landing pages. _(VERIFIED)_
- **FR-RBAC-002** — Administrators shall create custom roles with a name, data scope, landing page and any set of the 110 permission keys. _(VERIFIED)_
- **FR-RBAC-003** — Administrators shall view and edit the permission matrix for editable roles. _(VERIFIED)_
- **FR-RBAC-004** — Every business action shall be checked against the user's permissions in the service layer, not only by hiding buttons. _(VERIFIED)_
- **FR-RBAC-005** — Lists shall be limited by data scope: own records (Salesman), linked customer (Customer), own deliveries (Driver), etc. _(VERIFIED)_
- **FR-RBAC-006** — Production APIs shall enforce the same permission keys and data scopes server-side. _(PROPOSED)_

## Dashboards and Analytics

- **FR-DASH-001** — Each role shall see a dashboard with the KPIs and work queues for that role. _(VERIFIED)_
- **FR-DASH-002** — Every dashboard shall offer period presets (Today … All Time), custom range and specific periods including the April–March financial year. _(VERIFIED)_
- **FR-DASH-003** — Dashboards shall optionally compare the selected period with the previous equivalent period. _(VERIFIED)_
- **FR-DASH-004** — Current positions (stock, credit balance, fleet) shall be labelled Current and not filtered by period. _(VERIFIED)_
- **FR-DASH-005** — KPI cards and queue rows shall drill down into the filtered module list. _(VERIFIED)_
- **FR-DASH-006** — Management shall have a live order monitor with real-time status updates (server push). _(PROPOSED)_

## Customer Management

- **FR-CUS-001** — Administrators shall create customers with code, type, contacts, address, tax IDs, hub, zone, sales representative, VIP flag and credit settings. _(VERIFIED)_
- **FR-CUS-002** — Customer data shall be validated (unique code, 10-digit mobile, email, PAN AAAAA9999A, GSTIN containing PAN, 6-digit pincode). _(VERIFIED)_
- **FR-CUS-003** — Users shall view customer details with credit position, orders, deliveries and documents within their scope. _(VERIFIED)_
- **FR-CUS-004** — Customers referenced by orders or other records shall not be deletable. _(VERIFIED)_
- **FR-CUS-005** — Customer address and tax fields shall follow the operating country (UAE: emirate, TRN, +971 vs India: pincode, GSTIN/PAN, +91). _(PENDING CONFIRMATION)_

## Product Catalogue

- **FR-PRD-001** — Administrators shall maintain products with code, SKU, barcode, category, unit, price, tax %, maximum discount, storage condition and stock settings. _(VERIFIED)_
- **FR-PRD-002** — Product codes, SKUs and barcodes shall be unique; tax 0–100%; maximum stock greater than minimum. _(VERIFIED)_
- **FR-PRD-003** — Inactive or discontinued products shall not be orderable and shall block approval of orders containing them. _(VERIFIED)_
- **FR-PRD-004** — Item master and quantities shall be synchronised from SAP in stage two (today updated manually from emails). _(PROPOSED)_

## Hubs, Suppliers and Organisation Master

- **FR-HUB-001** — Administrators shall maintain hubs (type, address, contacts, status). _(VERIFIED)_
- **FR-HUB-002** — Administrators shall maintain suppliers with lead time and products for replenishment. _(VERIFIED)_
- **FR-HUB-003** — Administrators shall maintain the company profile and organisation structure (branches, business units, departments, designations, employees, warehouses). _(VERIFIED)_

## Salesman Order Management

- **FR-ORD-001** — Salesmen shall create orders for a customer and hub with order type, priority, payment terms, order and requested delivery dates, delivery address and product lines. _(VERIFIED)_
- **FR-ORD-002** — Salesmen shall submit orders for approval; the system assigns an order number and notifies the Sales Manager. _(VERIFIED)_
- **FR-ORD-003** — The system shall validate order data: customer, salesman, hub, type, priority, payment terms, valid dates, address, 6-digit pincode, at least one line, total > 0. _(VERIFIED)_
- **FR-ORD-004** — The system shall show credit and stock warnings at submission without blocking it. _(VERIFIED)_
- **FR-ORD-005** — Salesmen shall correct and resubmit returned orders; the section matching the return reason is highlighted. _(VERIFIED)_
- **FR-ORD-006** — Only the creator's draft orders shall be deletable; submitted orders are kept for audit. _(VERIFIED)_
- **FR-ORD-007** — Users shall duplicate an existing order into a new draft. _(VERIFIED)_
- **FR-ORD-008** — Every order shall have a timeline of all events (created, submitted, decided, consolidated, dispatched, delivered). _(VERIFIED)_
- **FR-ORD-009** — Salesmen shall see only their own orders; other roles see orders according to their scope. _(VERIFIED)_
- **FR-ORD-010** — Cancelling a submitted order on customer request. _(NOT IMPLEMENTED)_
- **FR-ORD-011** — Orders shall record the source channel (call, email, WhatsApp, customer app) as described in the SOW. _(PENDING CONFIRMATION)_

## Sales Manager Approval

- **FR-APR-001** — Sales Managers shall see an approval queue of submitted orders, oldest first. _(VERIFIED)_
- **FR-APR-002** — The system shall run six checks: customer active, hub active, credit within limit, stock available, total valid, products active. _(VERIFIED)_
- **FR-APR-003** — Sales Managers shall approve orders; warnings must be acknowledged and remarks entered when required by settings. _(VERIFIED)_
- **FR-APR-004** — Sales Managers shall return orders for correction with a reason from a list and remarks. _(VERIFIED)_
- **FR-APR-005** — Sales Managers shall reject orders with a reason from a list and remarks. _(VERIFIED)_
- **FR-APR-006** — Draft or already-decided orders shall not be decided again. _(VERIFIED)_
- **FR-APR-007** — The Sales Manager shall be able to set the approved value and quantity (SOW slide 8). _(PENDING CONFIRMATION)_
- **FR-APR-008** — Finance shall be notified of approved orders, flagged when the credit limit is exceeded (SOW slides 8 and 16). _(NOT IMPLEMENTED)_

## Credit Validation

- **FR-CRD-001** — The system shall calculate the projected balance (current balance + order total) against the credit limit for every order. _(VERIFIED)_
- **FR-CRD-002** — Exceeding the credit limit shall be a warning by default and a blocking check when "Block when credit exceeded" is enabled. _(VERIFIED)_
- **FR-CRD-003** — Users shall view credit limits, balances and utilisation for all customers. _(VERIFIED)_
- **FR-CRD-004** — Customer balances shall be updated from invoices and payments. _(NOT IMPLEMENTED)_
- **FR-CRD-005** — Credit balances shall be synchronised from the finance system (SAP) in production. _(PROPOSED)_

## Order Consolidation (Customer Service)

- **FR-CON-001** — Customer Service shall see approved orders grouped per salesman, oldest approval first. _(VERIFIED)_
- **FR-CON-002** — Customer Service shall confirm five verification checks and review hub stock before consolidating. _(VERIFIED)_
- **FR-CON-003** — Customer Service shall release consolidated orders to dispatch. _(VERIFIED)_
- **FR-CON-004** — Only approved orders shall be consolidated and only once. _(VERIFIED)_

## Dispatch Management

- **FR-DSP-001** — Dispatchers shall create dispatches from ready orders for a hub, zone and date, saved as draft or planned. _(VERIFIED)_
- **FR-DSP-002** — Orders not ready, already on another active dispatch or without a complete address shall be refused. _(VERIFIED)_
- **FR-DSP-003** — Dispatchers shall set the stop sequence by drag and drop or move buttons; a suggested sequence (priority, pincode) is offered. _(VERIFIED)_
- **FR-DSP-004** — Dispatchers shall confirm loading after a review tick; stock is deducted once and one delivery is created per order. _(VERIFIED)_
- **FR-DSP-005** — Dispatchers shall cancel dispatches with a reason before any stop starts; confirmed dispatches reverse stock once. _(VERIFIED)_
- **FR-DSP-006** — Dispatches shall be editable only while DRAFT, PLANNED or ASSIGNED. _(VERIFIED)_
- **FR-DSP-007** — Dispatch status shall close automatically: COMPLETED when all stops are delivered, PARTIALLY_DELIVERED (Closed with exceptions) otherwise. _(VERIFIED)_
- **FR-DSP-008** — Dispatchers shall place orders into zones by drag and drop on a zone board (SOW slide 10). _(PENDING CONFIRMATION)_
- **FR-DSP-009** — The system shall suggest the fastest route using distance and live traffic and warn when a VIP requested time may be missed. _(PROPOSED)_

## Zone Management

- **FR-ZON-001** — Administrators shall maintain zones per hub with a list of pincodes. _(VERIFIED)_
- **FR-ZON-002** — The system shall warn when a dispatch mixes orders from non-neighbouring zones. _(VERIFIED)_

## Driver and Vehicle Assignment

- **FR-DRA-001** — Dispatchers shall assign a driver and a vehicle to a planned dispatch. _(VERIFIED)_
- **FR-DRA-002** — Drivers shall be refused when inactive, busy on another active dispatch, offline, from another hub, or with an expired or missing licence. _(VERIFIED)_
- **FR-DRA-003** — Vehicles shall be refused when inactive, in maintenance, busy, from another hub, over capacity, or with expired required documents. _(VERIFIED)_
- **FR-DRA-004** — Administrators shall maintain drivers (licence, hub, zone, vehicle, app login) and vehicles (number, type, capacity, hub, documents). _(VERIFIED)_

## Driver Application

- **FR-DRV-001** — Drivers shall see today's and tomorrow's stops published by the Dispatcher, the next stop and their performance. _(VERIFIED)_
- **FR-DRV-002** — Drivers shall start a stop only when the dispatch is confirmed, the date has arrived, no other stop is active and it is next in sequence. _(VERIFIED)_
- **FR-DRV-003** — Drivers shall record arrival at the customer, which issues the delivery OTP. _(VERIFIED)_
- **FR-DRV-004** — Drivers shall complete a stop with delivered / damaged quantities, receiver name, optional signature and photo, and the customer's OTP. _(VERIFIED)_
- **FR-DRV-005** — Drivers shall report a failed delivery with a reason from the list and remarks. _(VERIFIED)_
- **FR-DRV-006** — Drivers shall view the route of their stops on a map. _(VERIFIED)_
- **FR-DRV-007** — Drivers shall call or message the customer contact from the stop screen. _(VERIFIED)_
- **FR-DRV-008** — Drivers shall view and upload their own documents (licence, medical). _(VERIFIED)_
- **FR-DRV-009** — VIP stops shall show a VIP badge; the driver follows the sequence published by the Dispatcher. _(VERIFIED)_
- **FR-DRV-010** — The production driver app shall be a React Native app with background GPS (10–15 s updates) during active deliveries only. _(PROPOSED)_
- **FR-DRV-011** — The production driver app shall queue status updates when offline and sync when connectivity returns. _(PROPOSED)_

## Customer Application

- **FR-CAP-001** — Customers shall browse and search active products with prices and add them to a cart. _(VERIFIED)_
- **FR-CAP-002** — Customers shall place orders with delivery address, requested date (tomorrow to 60 days), time slot, reference and remarks. _(VERIFIED)_
- **FR-CAP-003** — Customers shall follow each order with a stage tracker and customer-friendly labels. _(VERIFIED)_
- **FR-CAP-004** — Customers shall track their own delivery on a map and see the OTP when the driver arrives. _(VERIFIED)_
- **FR-CAP-005** — Customers shall view and print delivery notes and invoices. _(VERIFIED)_
- **FR-CAP-006** — Customers shall reorder a past order into the cart. _(VERIFIED)_
- **FR-CAP-007** — Customers shall pay online and see payment history. _(NOT IMPLEMENTED)_
- **FR-CAP-008** — The customer app is an addition beyond the SOW (which lists Order Taking App, Drivers App and Admin Panel); inclusion in the production scope needs confirmation. _(PENDING CONFIRMATION)_

## Delivery Tracking

- **FR-TRK-001** — Office users shall track every stop on active dispatches with status and times. _(VERIFIED)_
- **FR-TRK-002** — Administrators and Dispatchers shall see vehicle positions on a fleet map. _(PROTOTYPE)_
- **FR-TRK-003** — Production tracking shall push real GPS positions to the admin map (all vehicles) and the customer map (own order only) over WSS. _(PROPOSED)_

## Delivery OTP

- **FR-OTP-001** — A 6-digit OTP shall be issued on arrival, valid 10 minutes by default (1–60), shown to the customer. _(PROTOTYPE)_
- **FR-OTP-002** — Completion shall require the correct, unexpired OTP; 5 wrong attempts lock the OTP. _(VERIFIED)_
- **FR-OTP-003** — Drivers shall generate a new OTP when it has expired or is locked; the previous one is invalidated. _(VERIFIED)_
- **FR-OTP-004** — Dispatchers shall be able to inspect a delivery's OTP status (dispatch.otp.inspect). _(VERIFIED)_
- **FR-OTP-005** — Production OTPs shall be sent to the customer by SMS or WhatsApp and stored hashed. _(PROPOSED)_

## Proof of Delivery

- **FR-POD-001** — Proof of delivery shall capture receiver name, optional signature and photo (≤ 350 KB each) and customer remarks (≤ 300 characters). _(VERIFIED)_
- **FR-POD-002** — Delivered quantity shall not exceed the dispatched quantity; damaged and rejected quantities are recorded. _(VERIFIED)_
- **FR-POD-003** — Production POD images shall be stored in object storage with signed URLs and retention rules. _(PROPOSED)_

## Delivery Notes

- **FR-DN-001** — A numbered delivery note (BM-DN-YYYY-NNNNN) shall be generated when a stop is completed (full or partial). _(VERIFIED)_
- **FR-DN-002** — Delivery notes shall be printable and visible to office roles with permission, the driver and the customer. _(VERIFIED)_
- **FR-DN-003** — The delivery note shall be sent to the customer instantly by SMS / WhatsApp / email (SOW slide 13). _(PROPOSED)_

## Delivery Exception Review

- **FR-EXC-001** — Dispatchers shall review failed and partial deliveries with remarks. _(VERIFIED)_
- **FR-EXC-002** — The review may return undelivered (not damaged) stock to the hub once. _(VERIFIED)_
- **FR-EXC-003** — A failed delivery whose goods are returned may be re-queued for a new dispatch. _(VERIFIED)_

## Inventory Management

- **FR-INV-001** — Warehouse users shall record goods receipts that increase hub stock immediately. _(VERIFIED)_
- **FR-INV-002** — Warehouse users shall transfer stock between hubs as a draft or completed immediately. _(VERIFIED)_
- **FR-INV-003** — Authorised users shall adjust stock (increase, decrease, damaged, lost, correction) with a reason. _(VERIFIED)_
- **FR-INV-004** — Every stock change shall be written to the movement ledger. _(VERIFIED)_
- **FR-INV-005** — Users shall set minimum, reorder and maximum levels per stock line. _(VERIFIED)_
- **FR-INV-006** — Stock cannot go negative unless the product allows it; completed transfers are not posted twice. _(VERIFIED)_
- **FR-INV-007** — Batch and expiry tracking per stock line, FEFO picking and cycle counting. _(NOT IMPLEMENTED)_
- **FR-INV-008** — Stock positions shall be synchronised with SAP in stage two. _(PROPOSED)_

## Scrap Management

- **FR-SCR-001** — Users shall raise scrap requests with reason, quantity, stock source, batch and photo evidence. _(VERIFIED)_
- **FR-SCR-002** — Quantity shall not exceed eligible stock; photo required for Damaged, Packaging Damage and Contamination; batch required for batch-controlled products; no duplicate open request. _(VERIFIED)_
- **FR-SCR-003** — Approvers shall approve or reject requests; requesters cannot approve their own. _(VERIFIED)_
- **FR-SCR-004** — Approvers shall post the stock write-off exactly once. _(VERIFIED)_
- **FR-SCR-005** — A printable scrap note shall be available. _(VERIFIED)_

## Warehouse and QA Dashboards

- **FR-WQA-001** — Warehouse users shall see picking & loading, inventory alerts, damaged stock and document expiry. _(VERIFIED)_
- **FR-WQA-002** — QA users shall see inspection queues, quarantine, expired documents and the cold-chain card. _(VERIFIED)_
- **FR-WQA-003** — Live cold-chain temperature monitoring and excursion alerts. _(NOT IMPLEMENTED)_

## Vehicle Management System

- **FR-VMS-001** — The system shall compute compliance per vehicle and driver document (Valid, 30 days, 7 days, today, expired, missing). _(VERIFIED)_
- **FR-VMS-002** — Administrators shall define required documents and blocking rules; an expired required document always blocks assignment. _(VERIFIED)_
- **FR-VMS-003** — Authorised users shall upload vehicle and driver documents with expiry dates. _(VERIFIED)_
- **FR-VMS-004** — Opening the expiry register shall raise DOCUMENT_EXPIRING / DOCUMENT_EXPIRED events. _(VERIFIED)_
- **FR-VMS-005** — Fuel, maintenance and trip cost tracking. _(NOT IMPLEMENTED)_

## Document Management and OCR

- **FR-DOC-001** — Users shall upload documents for records they may access, with type, linked record, file and key fields. _(VERIFIED)_
- **FR-DOC-002** — The system shall extract fields with OCR and let reviewers correct them (originals kept). _(PROTOTYPE)_
- **FR-DOC-003** — Reviewers shall verify or reject documents; rejection requires a reason. _(VERIFIED)_
- **FR-DOC-004** — Administrators shall maintain document types (fields, expiry, OCR, verification). _(VERIFIED)_
- **FR-DOC-005** — Production OCR shall run server-side (e.g. Tesseract / cloud OCR) with virus scanning of uploads. _(PROPOSED)_

## Invoice Customisation and Invoicing

- **FR-INVC-001** — Finance shall maintain invoice templates (layout, fonts, colours, sections, default). _(VERIFIED)_
- **FR-INVC-002** — Finance shall issue one invoice per approved-or-later order on ordered or delivered quantities with discounts and charges. _(VERIFIED)_
- **FR-INVC-003** — Finance shall cancel an invoice with a reason, after which a new invoice can be issued. _(VERIFIED)_
- **FR-INVC-004** — Finance shall configure invoice numbering (prefix, year, digits). _(VERIFIED)_
- **FR-INVC-005** — The SOW states invoicing stays outside the application; the prototype includes invoicing. Production scope must be confirmed. _(PENDING CONFIRMATION)_
- **FR-INVC-006** — Payments, receipts, credit notes and refunds. _(NOT IMPLEMENTED)_

## Email Communication

- **FR-EML-001** — Users shall compose and send emails with templates and document attachments. _(PROTOTYPE)_
- **FR-EML-002** — Administrators shall maintain email templates with variables. _(VERIFIED)_
- **FR-EML-003** — Users shall read the mailbox. _(PROTOTYPE)_
- **FR-EML-004** — Live SMTP / IMAP through the integration gateway. _(NOT VERIFIED)_

## OpenWA (WhatsApp) Communication

- **FR-OWA-001** — Users shall send WhatsApp messages using templates. _(PROTOTYPE)_
- **FR-OWA-002** — Live OpenWA session (QR, start / stop) through the gateway. _(NOT VERIFIED)_
- **FR-OWA-003** — The customer messaging provider (SMS or WhatsApp; OpenWA is unofficial) must be confirmed at kickoff (SOW slide 16). _(PENDING CONFIRMATION)_

## Automated Notifications

- **FR-AUTO-001** — Administrators shall configure per-event rules (channel, recipients, templates) and a master switch. _(VERIFIED)_
- **FR-AUTO-002** — Workflow events shall trigger messages once per record (de-duplicated) and be logged in history. _(VERIFIED)_

## Call History

- **FR-CALL-001** — Users shall log calls with direction, status, outcome, duration and notes. _(VERIFIED)_
- **FR-CALL-002** — Users shall schedule and complete follow-ups and link orders to calls. _(VERIFIED)_

## Notifications (in-app)

- **FR-NOTF-001** — Users shall receive in-app notifications for workflow events addressed to their role, user, driver or customer record. _(VERIFIED)_
- **FR-NOTF-002** — Users shall mark notifications read and mute categories. _(VERIFIED)_
- **FR-NOTF-003** — Production apps shall send push notifications to drivers and customers. _(PROPOSED)_

## Reports

- **FR-RPT-001** — Users shall browse 118 reports in 11 categories filtered by permission, with search, favourites and recent. _(VERIFIED)_
- **FR-RPT-002** — Reports shall run with date, month, year and grouping filters within the user's data scope and export to CSV or print. _(VERIFIED)_
- **FR-RPT-003** — Reports without source data shall say so with the reason. _(VERIFIED)_

## AI Assistant, Forecasting and Replenishment

- **FR-AI-001** — Users shall ask business questions in natural language and receive tables and charts from permission-checked tools. _(PROTOTYPE)_
- **FR-AI-002** — Users shall generate demand forecasts with selectable models and accuracy metrics. _(VERIFIED)_
- **FR-AI-003** — Users shall raise replenishment requests; Administrators approve, reject and convert them; stock receipts complete them. _(VERIFIED)_
- **FR-AI-004** — The system shall generate rule-based insights that users mark reviewed or resolved. _(VERIFIED)_
- **FR-AI-005** — External AI providers (OpenJarvis, Ollama, Gemini, OpenAI-compatible). _(NOT VERIFIED)_

## System Settings and Audit

- **FR-SET-001** — Administrators shall configure security, approval, localisation, numbering, inventory, warehouse and cold-chain settings. _(VERIFIED)_
- **FR-SET-002** — Administrative and security events shall be recorded in the audit log. _(VERIFIED)_
- **FR-SET-003** — Administrators shall reset demo data and export / import the application data. _(VERIFIED)_
- **FR-SET-004** — Production data shall be stored in PostgreSQL with daily backups, point-in-time recovery and audit fields on every table. _(PROPOSED)_

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |