# Functional Requirements Document (Consolidated)

## Document control

| Field | Value |
|---|---|
| Document title | Functional Requirements Document (Consolidated) |
| Document ID | BM-SYS-003 |
| Version | 1.0 |
| Status | Draft — for client review |
| Category | System Requirements |
| Related module(s) | All modules |
| Document owner | Business Analyst |
| Prepared by | Project documentation team (AI-assisted draft prepared from source-code analysis) |
| Reviewed by | _Pending — not yet reviewed_ |
| Approval | _Not approved — awaiting client review (no approval has been given)_ |
| Created date | 2026-11-12 |
| Last updated date | 2026-11-12 |

> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.

## Purpose

List every functional requirement of the platform with a unique ID, priority, expected result and implementation label.

## Scope

All 35 modules; detailed specifications per module are in folder 04.

## Definitions

Other terms: see [BM-GLO-001 — Project Glossary](../22_GLOSSARY_AND_REFERENCE/BM-GLO-001_Project_Glossary.md).

## References

- [BM-SYS-002 — Software Requirements Specification (SRS)](BM-SYS-002_Software_Requirements_Specification.md)
- [BM-SYS-008 — Requirement Traceability Matrix](BM-SYS-008_Requirement_Traceability_Matrix.xlsx)
- [BM-BRD-001 — Business Requirements Document (BRD)](../02_BUSINESS_REQUIREMENTS/BM-BRD-001_Business_Requirements_Document.md)

## Contents

- 1. Requirement summary
- Authentication and Login (AUTH)
- User Management (USR)
- Role and Permission Management (RBAC)
- Dashboards and Analytics (DASH)
- Customer Management (CUS)
- Product Catalogue (PRD)
- Hubs, Suppliers and Organisation Master (HUB)
- Salesman Order Management (ORD)
- Sales Manager Approval (APR)
- Credit Validation (CRD)
- Order Consolidation (Customer Service) (CON)
- Dispatch Management (DSP)
- Zone Management (ZON)
- Driver and Vehicle Assignment (DRA)
- Driver Application (DRV)
- Customer Application (CAP)
- Delivery Tracking (TRK)
- Delivery OTP (OTP)
- Proof of Delivery (POD)
- Delivery Notes (DN)
- Delivery Exception Review (EXC)
- Inventory Management (INV)
- Scrap Management (SCR)
- Warehouse and QA Dashboards (WQA)
- Vehicle Management System (VMS)
- Document Management and OCR (DOC)
- Invoice Customisation and Invoicing (INVC)
- Email Communication (EML)
- OpenWA (WhatsApp) Communication (OWA)
- Automated Notifications (AUTO)
- Call History (CALL)
- Notifications (in-app) (NOTF)
- Reports (RPT)
- AI Assistant, Forecasting and Replenishment (AI)
- System Settings and Audit (SET)

## 1. Requirement summary

| Module | FRs | VERIFIED | PROTOTYPE | PROPOSED | PENDING | NOT IMPL. | NOT VERIFIED |
|---|---|---|---|---|---|---|---|
| Authentication and Login (AUTH) | 13 | 10 | 1 | 2 | 0 | 0 | 0 |
| User Management (USR) | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Role and Permission Management (RBAC) | 6 | 5 | 0 | 1 | 0 | 0 | 0 |
| Dashboards and Analytics (DASH) | 6 | 5 | 0 | 1 | 0 | 0 | 0 |
| Customer Management (CUS) | 5 | 4 | 0 | 0 | 1 | 0 | 0 |
| Product Catalogue (PRD) | 4 | 3 | 0 | 1 | 0 | 0 | 0 |
| Hubs, Suppliers and Organisation Master (HUB) | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Salesman Order Management (ORD) | 11 | 9 | 0 | 0 | 1 | 1 | 0 |
| Sales Manager Approval (APR) | 8 | 6 | 0 | 0 | 1 | 1 | 0 |
| Credit Validation (CRD) | 5 | 3 | 0 | 1 | 0 | 1 | 0 |
| Order Consolidation (Customer Service) (CON) | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Dispatch Management (DSP) | 9 | 7 | 0 | 1 | 1 | 0 | 0 |
| Zone Management (ZON) | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Driver and Vehicle Assignment (DRA) | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Driver Application (DRV) | 11 | 9 | 0 | 2 | 0 | 0 | 0 |
| Customer Application (CAP) | 8 | 6 | 0 | 0 | 1 | 1 | 0 |
| Delivery Tracking (TRK) | 3 | 1 | 1 | 1 | 0 | 0 | 0 |
| Delivery OTP (OTP) | 5 | 3 | 1 | 1 | 0 | 0 | 0 |
| Proof of Delivery (POD) | 3 | 2 | 0 | 1 | 0 | 0 | 0 |
| Delivery Notes (DN) | 3 | 2 | 0 | 1 | 0 | 0 | 0 |
| Delivery Exception Review (EXC) | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Inventory Management (INV) | 8 | 6 | 0 | 1 | 0 | 1 | 0 |
| Scrap Management (SCR) | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Warehouse and QA Dashboards (WQA) | 3 | 2 | 0 | 0 | 0 | 1 | 0 |
| Vehicle Management System (VMS) | 5 | 4 | 0 | 0 | 0 | 1 | 0 |
| Document Management and OCR (DOC) | 5 | 3 | 1 | 1 | 0 | 0 | 0 |
| Invoice Customisation and Invoicing (INVC) | 6 | 4 | 0 | 0 | 1 | 1 | 0 |
| Email Communication (EML) | 4 | 1 | 2 | 0 | 0 | 0 | 1 |
| OpenWA (WhatsApp) Communication (OWA) | 3 | 0 | 1 | 0 | 1 | 0 | 1 |
| Automated Notifications (AUTO) | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Call History (CALL) | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Notifications (in-app) (NOTF) | 3 | 2 | 0 | 1 | 0 | 0 | 0 |
| Reports (RPT) | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| AI Assistant, Forecasting and Replenishment (AI) | 5 | 3 | 1 | 0 | 0 | 0 | 1 |
| System Settings and Audit (SET) | 4 | 3 | 0 | 1 | 0 | 0 | 0 |
| **Total** | **179** | 136 | 8 | 17 | 7 | 8 | 3 |

## Authentication and Login (AUTH)

Detail: [BM-FRD-AUTH — Functional Requirements — Authentication and Login](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-AUTH_Authentication_and_Login.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-AUTH-001 | P1 | The system shall authenticate office users by email or username and password and open the role landing page. | Valid credentials open the landing page of the user's role. | VERIFIED |
| FR-AUTH-002 | P1 | The driver app shall accept mobile number, email or username as the identifier. | Driver signs in with +91 98400 11206 / Driver@123 and lands on /driver/dashboard. | VERIFIED |
| FR-AUTH-003 | P1 | The customer app shall accept mobile number, email or username as the identifier. | Customer signs in with +91 98410 22310 / Customer@123 and lands on /customer/dashboard. | VERIFIED |
| FR-AUTH-004 | P1 | The system shall lock an account for the configured lockout period after the configured number of failed attempts (default 5 attempts, 15 minutes). | Sixth attempt shows "Too many failed attempts. This account is locked for 15 minutes." | VERIFIED |
| FR-AUTH-005 | P1 | The system shall block sign-in for inactive accounts with a clear message. | "This account is inactive. Contact your administrator to reactivate it." | VERIFIED |
| FR-AUTH-006 | P1 | The system shall sign users out after the configured idle period (default 60 minutes). | Session ends after inactivity; user returns to the sign-in page of the same app. | VERIFIED |
| FR-AUTH-007 | P2 | "Keep me signed in" shall persist the session across browser restarts; otherwise the session ends with the tab. | Session stored in localStorage when ticked, sessionStorage otherwise. | VERIFIED |
| FR-AUTH-008 | P2 | Users shall reset a forgotten password with a 6-digit code valid for 15 minutes. | Code is displayed on screen in the prototype (no email is sent). | PROTOTYPE |
| FR-AUTH-009 | P1 | Users shall be forced to change their password after an administrator reset when the setting is enabled. | User is redirected to /account/change-password?required=1 until the password is changed. | VERIFIED |
| FR-AUTH-010 | P1 | Sign-out shall return the user to the sign-in page of the app they were using. | Driver → /driver/login, customer → /customer/login, office → /login. | VERIFIED |
| FR-AUTH-011 | P1 | Every route shall require sign-in and the route's permission; unauthorised users see the Unauthorized page. | Opening /admin/users as Salesman shows /unauthorized. | VERIFIED |
| FR-AUTH-012 | P1 | Production authentication shall use server-side hashed passwords (Argon2/PBKDF2) and short-lived JWT access tokens with refresh tokens. | No credentials or password hashes are stored in the browser. | PROPOSED |
| FR-AUTH-013 | P2 | Privileged roles shall use multi-factor authentication (TOTP) in production. | Admin sign-in requires a second factor. | PROPOSED |

## User Management (USR)

Detail: [BM-FRD-USR — Functional Requirements — User Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-USR_User_Management.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-USR-001 | P1 | Administrators shall create users with name, username, email, phone, role, home hub and (for portal users) the linked customer, driver or supplier. | User appears in the list and can sign in. | VERIFIED |
| FR-USR-002 | P1 | Administrators shall activate, deactivate, unlock and reset passwords of users. | Status changes are effective at the next sign-in and recorded in the audit log. | VERIFIED |
| FR-USR-003 | P1 | The system shall prevent users from deactivating their own account and only a Super Admin shall change a Super Admin. | "You cannot deactivate your own account." / "Only a Super Admin can change a Super Admin account." | VERIFIED |
| FR-USR-004 | P2 | Administrators shall assign roles and the home hub to users in bulk. | Assignments saved; drivers require a home hub. | VERIFIED |
| FR-USR-005 | P2 | Users shall update their own name and phone and change their password. | Profile saved after validation (name 2–60 characters). | VERIFIED |

## Role and Permission Management (RBAC)

Detail: [BM-FRD-RBAC — Functional Requirements — Role and Permission Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-RBAC_Role_and_Permission_Management.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-RBAC-001 | P1 | The system shall provide 13 system roles with default permissions, data scopes and landing pages. | Roles listed with permission counts; locked roles cannot be deleted. | VERIFIED |
| FR-RBAC-002 | P1 | Administrators shall create custom roles with a name, data scope, landing page and any set of the 110 permission keys. | Users with the custom role see only permitted menus and a workspace launcher dashboard. | VERIFIED |
| FR-RBAC-003 | P1 | Administrators shall view and edit the permission matrix for editable roles. | Matrix changes take effect immediately in menus and services. | VERIFIED |
| FR-RBAC-004 | P1 | Every business action shall be checked against the user's permissions in the service layer, not only by hiding buttons. | Service returns a permission error when called without the key. | VERIFIED |
| FR-RBAC-005 | P1 | Lists shall be limited by data scope: own records (Salesman), linked customer (Customer), own deliveries (Driver), etc. | Salesman sees only own orders; driver cannot open another driver's delivery. | VERIFIED |
| FR-RBAC-006 | P1 | Production APIs shall enforce the same permission keys and data scopes server-side. | API returns 403 for missing permission and 404 for out-of-scope records. | PROPOSED |

## Dashboards and Analytics (DASH)

Detail: [BM-FRD-DASH — Functional Requirements — Dashboards and Analytics](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DASH_Dashboards_and_Analytics.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-DASH-001 | P1 | Each role shall see a dashboard with the KPIs and work queues for that role. | Dashboard component matches the role (Admin, Salesman, Sales Manager, CS, Dispatcher, Finance, Warehouse, QA, Supplier). | VERIFIED |
| FR-DASH-002 | P1 | Every dashboard shall offer period presets (Today … All Time), custom range and specific periods including the April–March financial year. | KPIs, tables and charts follow the selected period. | VERIFIED |
| FR-DASH-003 | P2 | Dashboards shall optionally compare the selected period with the previous equivalent period. | KPI shows % change, difference and previous value. | VERIFIED |
| FR-DASH-004 | P2 | Current positions (stock, credit balance, fleet) shall be labelled Current and not filtered by period. | "Current" label shown on those KPIs. | VERIFIED |
| FR-DASH-005 | P2 | KPI cards and queue rows shall drill down into the filtered module list. | Clicking "Pending approval" opens the approval queue. | VERIFIED |
| FR-DASH-006 | P2 | Management shall have a live order monitor with real-time status updates (server push). | Status changes appear without page refresh. | PROPOSED |

## Customer Management (CUS)

Detail: [BM-FRD-CUS — Functional Requirements — Customer Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-CUS_Customer_Management.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-CUS-001 | P1 | Administrators shall create customers with code, type, contacts, address, tax IDs, hub, zone, sales representative, VIP flag and credit settings. | Customer saved and available for ordering. | VERIFIED |
| FR-CUS-002 | P1 | Customer data shall be validated (unique code, 10-digit mobile, email, PAN AAAAA9999A, GSTIN containing PAN, 6-digit pincode). | Invalid fields show messages; record is not saved. | VERIFIED |
| FR-CUS-003 | P2 | Users shall view customer details with credit position, orders, deliveries and documents within their scope. | Salesman sees only assigned customers' documents. | VERIFIED |
| FR-CUS-004 | P2 | Customers referenced by orders or other records shall not be deletable. | Delete is blocked and the blocking records are listed. | VERIFIED |
| FR-CUS-005 | P1 | Customer address and tax fields shall follow the operating country (UAE: emirate, TRN, +971 vs India: pincode, GSTIN/PAN, +91). | Client confirms country rules before production. | PENDING CONFIRMATION |

## Product Catalogue (PRD)

Detail: [BM-FRD-PRD — Functional Requirements — Product Catalogue](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-PRD_Product_Catalogue.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-PRD-001 | P1 | Administrators shall maintain products with code, SKU, barcode, category, unit, price, tax %, maximum discount, storage condition and stock settings. | Product saved and orderable when Active. | VERIFIED |
| FR-PRD-002 | P1 | Product codes, SKUs and barcodes shall be unique; tax 0–100%; maximum stock greater than minimum. | Duplicate or invalid values are rejected. | VERIFIED |
| FR-PRD-003 | P2 | Inactive or discontinued products shall not be orderable and shall block approval of orders containing them. | Approval check "Products active" fails. | VERIFIED |
| FR-PRD-004 | P2 | Item master and quantities shall be synchronised from SAP in stage two (today updated manually from emails). | Items updated automatically from SAP. | PROPOSED |

## Hubs, Suppliers and Organisation Master (HUB)

Detail: [BM-FRD-HUB — Functional Requirements — Hubs, Suppliers and Organisation Master](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-HUB_Hubs_Suppliers_and_Organisation_Master.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-HUB-001 | P1 | Administrators shall maintain hubs (type, address, contacts, status). | Hub available for stock, orders and dispatch when Active. | VERIFIED |
| FR-HUB-002 | P2 | Administrators shall maintain suppliers with lead time and products for replenishment. | Supplier selectable on replenishment requests. | VERIFIED |
| FR-HUB-003 | P3 | Administrators shall maintain the company profile and organisation structure (branches, business units, departments, designations, employees, warehouses). | Records saved and used on documents. | VERIFIED |

## Salesman Order Management (ORD)

Detail: [BM-FRD-ORD — Functional Requirements — Salesman Order Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-ORD_Salesman_Order_Management.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-ORD-001 | P1 | Salesmen shall create orders for a customer and hub with order type, priority, payment terms, order and requested delivery dates, delivery address and product lines. | Order saved as DRAFT with totals (subtotal, discount, tax, total). | VERIFIED |
| FR-ORD-002 | P1 | Salesmen shall submit orders for approval; the system assigns an order number and notifies the Sales Manager. | Status SUBMITTED, approval PENDING, number BM-ORD-…, notification "New order for approval". | VERIFIED |
| FR-ORD-003 | P1 | The system shall validate order data: customer, salesman, hub, type, priority, payment terms, valid dates, address, 6-digit pincode, at least one line, total > 0. | Errors shown per field; order not submitted. | VERIFIED |
| FR-ORD-004 | P1 | The system shall show credit and stock warnings at submission without blocking it. | Warning flags stored on the order and shown to the approver. | VERIFIED |
| FR-ORD-005 | P1 | Salesmen shall correct and resubmit returned orders; the section matching the return reason is highlighted. | Status returns to SUBMITTED; timeline records the resubmission. | VERIFIED |
| FR-ORD-006 | P2 | Only the creator's draft orders shall be deletable; submitted orders are kept for audit. | "Only draft orders can be deleted…" | VERIFIED |
| FR-ORD-007 | P2 | Users shall duplicate an existing order into a new draft. | New DRAFT with copied lines. | VERIFIED |
| FR-ORD-008 | P1 | Every order shall have a timeline of all events (created, submitted, decided, consolidated, dispatched, delivered). | Timeline shows each event with user and time. | VERIFIED |
| FR-ORD-009 | P2 | Salesmen shall see only their own orders; other roles see orders according to their scope. | Order list filtered by scope. | VERIFIED |
| FR-ORD-010 | P2 | Cancelling a submitted order on customer request. | Not available; Sales Manager may reject with reason "Customer cancelled". PENDING CONFIRMATION of the cancellation rule. | NOT IMPLEMENTED |
| FR-ORD-011 | P2 | Orders shall record the source channel (call, email, WhatsApp, customer app) as described in the SOW. | Customer-app orders are tagged customer_app; office channel field to be confirmed. | PENDING CONFIRMATION |

## Sales Manager Approval (APR)

Detail: [BM-FRD-APR — Functional Requirements — Sales Manager Approval](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-APR_Sales_Manager_Approval.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-APR-001 | P1 | Sales Managers shall see an approval queue of submitted orders, oldest first. | Queue lists SUBMITTED / PENDING orders. | VERIFIED |
| FR-APR-002 | P1 | The system shall run six checks: customer active, hub active, credit within limit, stock available, total valid, products active. | Checks displayed with pass / warn / block. | VERIFIED |
| FR-APR-003 | P1 | Sales Managers shall approve orders; warnings must be acknowledged and remarks entered when required by settings. | Status APPROVED, consolidation PENDING, Customer Service and salesman notified. | VERIFIED |
| FR-APR-004 | P1 | Sales Managers shall return orders for correction with a reason from a list and remarks. | Status RETURNED; salesman notified with edit link. | VERIFIED |
| FR-APR-005 | P1 | Sales Managers shall reject orders with a reason from a list and remarks. | Status REJECTED (final); salesman notified. | VERIFIED |
| FR-APR-006 | P1 | Draft or already-decided orders shall not be decided again. | "…has already been approved. No change was made." | VERIFIED |
| FR-APR-007 | P1 | The Sales Manager shall be able to set the approved value and quantity (SOW slide 8). | Not implemented: the prototype approves the order as submitted; return for correction is used instead. | PENDING CONFIRMATION |
| FR-APR-008 | P1 | Finance shall be notified of approved orders, flagged when the credit limit is exceeded (SOW slides 8 and 16). | Not implemented: approval notifies Customer Service and the salesman only. | NOT IMPLEMENTED |

## Credit Validation (CRD)

Detail: [BM-FRD-CRD — Functional Requirements — Credit Validation](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-CRD_Credit_Validation.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-CRD-001 | P1 | The system shall calculate the projected balance (current balance + order total) against the credit limit for every order. | Credit position shown on order and approval screens. | VERIFIED |
| FR-CRD-002 | P1 | Exceeding the credit limit shall be a warning by default and a blocking check when "Block when credit exceeded" is enabled. | Approve is disabled when blocking is on and the limit is exceeded. | VERIFIED |
| FR-CRD-003 | P2 | Users shall view credit limits, balances and utilisation for all customers. | Customer Credit page lists utilisation and over-limit customers. | VERIFIED |
| FR-CRD-004 | P1 | Customer balances shall be updated from invoices and payments. | Not implemented: balance is a manually maintained field; payments are not recorded. | NOT IMPLEMENTED |
| FR-CRD-005 | P2 | Credit balances shall be synchronised from the finance system (SAP) in production. | Balance reflects ERP receivables. | PROPOSED |

## Order Consolidation (Customer Service) (CON)

Detail: [BM-FRD-CON — Functional Requirements — Order Consolidation (Customer Service)](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-CON_Order_Consolidation_Customer_Service.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-CON-001 | P1 | Customer Service shall see approved orders grouped per salesman, oldest approval first. | Queue by salesman displayed. | VERIFIED |
| FR-CON-002 | P1 | Customer Service shall confirm five verification checks and review hub stock before consolidating. | Status CONSOLIDATED; Dispatcher notified. | VERIFIED |
| FR-CON-003 | P1 | Customer Service shall release consolidated orders to dispatch. | Status READY_FOR_DISPATCH; Dispatcher and salesman notified. | VERIFIED |
| FR-CON-004 | P2 | Only approved orders shall be consolidated and only once. | "Only approved orders can be consolidated." | VERIFIED |

## Dispatch Management (DSP)

Detail: [BM-FRD-DSP — Functional Requirements — Dispatch Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DSP_Dispatch_Management.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-DSP-001 | P1 | Dispatchers shall create dispatches from ready orders for a hub, zone and date, saved as draft or planned. | Dispatch BM-DSP-… in DRAFT or PLANNED. | VERIFIED |
| FR-DSP-002 | P1 | Orders not ready, already on another active dispatch or without a complete address shall be refused. | Specific refusal message per order. | VERIFIED |
| FR-DSP-003 | P1 | Dispatchers shall set the stop sequence by drag and drop or move buttons; a suggested sequence (priority, pincode) is offered. | Sequence saved; driver notified of changes. | VERIFIED |
| FR-DSP-004 | P1 | Dispatchers shall confirm loading after a review tick; stock is deducted once and one delivery is created per order. | Status CONFIRMED; orders DISPATCHED; Stock Dispatch movements. | VERIFIED |
| FR-DSP-005 | P1 | Dispatchers shall cancel dispatches with a reason before any stop starts; confirmed dispatches reverse stock once. | Status CANCELLED; orders back to READY_FOR_DISPATCH. | VERIFIED |
| FR-DSP-006 | P2 | Dispatches shall be editable only while DRAFT, PLANNED or ASSIGNED. | "…is confirmed and can no longer be edited." | VERIFIED |
| FR-DSP-007 | P1 | Dispatch status shall close automatically: COMPLETED when all stops are delivered, PARTIALLY_DELIVERED (Closed with exceptions) otherwise. | Status updates when the last stop closes. | VERIFIED |
| FR-DSP-008 | P1 | Dispatchers shall place orders into zones by drag and drop on a zone board (SOW slide 10). | Prototype: zone chosen in the dispatch form; drag and drop exists for stop sequence only. | PENDING CONFIRMATION |
| FR-DSP-009 | P1 | The system shall suggest the fastest route using distance and live traffic and warn when a VIP requested time may be missed. | Prototype suggests sequence by priority and pincode only. | PROPOSED |

## Zone Management (ZON)

Detail: [BM-FRD-ZON — Functional Requirements — Zone Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-ZON_Zone_Management.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-ZON-001 | P1 | Administrators shall maintain zones per hub with a list of pincodes. | Zone saved; code unique; at least one pincode. | VERIFIED |
| FR-ZON-002 | P2 | The system shall warn when a dispatch mixes orders from non-neighbouring zones. | Neighbouring-zone warning shown. | VERIFIED |

## Driver and Vehicle Assignment (DRA)

Detail: [BM-FRD-DRA — Functional Requirements — Driver and Vehicle Assignment](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DRA_Driver_and_Vehicle_Assignment.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-DRA-001 | P1 | Dispatchers shall assign a driver and a vehicle to a planned dispatch. | Status ASSIGNED; driver notified. | VERIFIED |
| FR-DRA-002 | P1 | Drivers shall be refused when inactive, busy on another active dispatch, offline, from another hub, or with an expired or missing licence. | Specific refusal messages. | VERIFIED |
| FR-DRA-003 | P1 | Vehicles shall be refused when inactive, in maintenance, busy, from another hub, over capacity, or with expired required documents. | "Load of N exceeds … capacity" etc. | VERIFIED |
| FR-DRA-004 | P1 | Administrators shall maintain drivers (licence, hub, zone, vehicle, app login) and vehicles (number, type, capacity, hub, documents). | Records validated (Indian vehicle number format, unique licence). | VERIFIED |

## Driver Application (DRV)

Detail: [BM-FRD-DRV — Functional Requirements — Driver Application](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DRV_Driver_Application.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-DRV-001 | P1 | Drivers shall see today's and tomorrow's stops published by the Dispatcher, the next stop and their performance. | Today plan listed; tomorrow plan visible with Start disabled. | VERIFIED |
| FR-DRV-002 | P1 | Drivers shall start a stop only when the dispatch is confirmed, the date has arrived, no other stop is active and it is next in sequence. | Blocker message shown otherwise; status OUT_FOR_DELIVERY when allowed. | VERIFIED |
| FR-DRV-003 | P1 | Drivers shall record arrival at the customer, which issues the delivery OTP. | arrivedAt recorded; OTP issued (simulated). | VERIFIED |
| FR-DRV-004 | P1 | Drivers shall complete a stop with delivered / damaged quantities, receiver name, optional signature and photo, and the customer's OTP. | DELIVERED or PARTIALLY_DELIVERED; delivery note generated. | VERIFIED |
| FR-DRV-005 | P1 | Drivers shall report a failed delivery with a reason from the list and remarks. | FAILED; Dispatcher and customer notified. | VERIFIED |
| FR-DRV-006 | P2 | Drivers shall view the route of their stops on a map. | DEMO route map displayed (simulated). | VERIFIED |
| FR-DRV-007 | P2 | Drivers shall call or message the customer contact from the stop screen. | Phone / WhatsApp links open the device app. | VERIFIED |
| FR-DRV-008 | P2 | Drivers shall view and upload their own documents (licence, medical). | Upload goes to the review queue. | VERIFIED |
| FR-DRV-009 | P1 | VIP stops shall show a VIP badge; the driver follows the sequence published by the Dispatcher. | VIP badge displayed. | VERIFIED |
| FR-DRV-010 | P1 | The production driver app shall be a React Native app with background GPS (10–15 s updates) during active deliveries only. | Location continues when the phone is locked; last update time shown. | PROPOSED |
| FR-DRV-011 | P2 | The production driver app shall queue status updates when offline and sync when connectivity returns. | No data loss in poor coverage. | PROPOSED |

## Customer Application (CAP)

Detail: [BM-FRD-CAP — Functional Requirements — Customer Application](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-CAP_Customer_Application.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-CAP-001 | P1 | Customers shall browse and search active products with prices and add them to a cart. | Cart persists per customer. | VERIFIED |
| FR-CAP-002 | P1 | Customers shall place orders with delivery address, requested date (tomorrow to 60 days), time slot, reference and remarks. | Order SUBMITTED with source customer_app; cart cleared. | VERIFIED |
| FR-CAP-003 | P1 | Customers shall follow each order with a stage tracker and customer-friendly labels. | Stages from Order placed to Delivered. | VERIFIED |
| FR-CAP-004 | P1 | Customers shall track their own delivery on a map and see the OTP when the driver arrives. | Only own order's vehicle is visible. | VERIFIED |
| FR-CAP-005 | P2 | Customers shall view and print delivery notes and invoices. | Documents listed for the linked customer only. | VERIFIED |
| FR-CAP-006 | P2 | Customers shall reorder a past order into the cart. | Orderable lines copied to cart. | VERIFIED |
| FR-CAP-007 | P2 | Customers shall pay online and see payment history. | Page shows balance and "No payments recorded in this prototype". | NOT IMPLEMENTED |
| FR-CAP-008 | P2 | The customer app is an addition beyond the SOW (which lists Order Taking App, Drivers App and Admin Panel); inclusion in the production scope needs confirmation. | Client decision recorded. | PENDING CONFIRMATION |

## Delivery Tracking (TRK)

Detail: [BM-FRD-TRK — Functional Requirements — Delivery Tracking](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-TRK_Delivery_Tracking.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-TRK-001 | P1 | Office users shall track every stop on active dispatches with status and times. | List shows live statuses. | VERIFIED |
| FR-TRK-002 | P2 | Administrators and Dispatchers shall see vehicle positions on a fleet map. | DEMO GPS positions move along a straight-line route. | PROTOTYPE |
| FR-TRK-003 | P1 | Production tracking shall push real GPS positions to the admin map (all vehicles) and the customer map (own order only) over WSS. | Updates appear without refresh; customers never see the fleet. | PROPOSED |

## Delivery OTP (OTP)

Detail: [BM-FRD-OTP — Functional Requirements — Delivery OTP](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-OTP_Delivery_OTP.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-OTP-001 | P1 | A 6-digit OTP shall be issued on arrival, valid 10 minutes by default (1–60), shown to the customer. | OTP visible in the customer app; no SMS in the prototype. | PROTOTYPE |
| FR-OTP-002 | P1 | Completion shall require the correct, unexpired OTP; 5 wrong attempts lock the OTP. | Wrong OTP blocks completion; LOCKED after 5 attempts. | VERIFIED |
| FR-OTP-003 | P2 | Drivers shall generate a new OTP when it has expired or is locked; the previous one is invalidated. | New OTP ACTIVE; old INVALIDATED. | VERIFIED |
| FR-OTP-004 | P2 | Dispatchers shall be able to inspect a delivery's OTP status (dispatch.otp.inspect). | OTP state visible to the Dispatcher. | VERIFIED |
| FR-OTP-005 | P1 | Production OTPs shall be sent to the customer by SMS or WhatsApp and stored hashed. | Customer receives the code on their phone. | PROPOSED |

## Proof of Delivery (POD)

Detail: [BM-FRD-POD — Functional Requirements — Proof of Delivery](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-POD_Proof_of_Delivery.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-POD-001 | P1 | Proof of delivery shall capture receiver name, optional signature and photo (≤ 350 KB each) and customer remarks (≤ 300 characters). | POD stored with the delivery. | VERIFIED |
| FR-POD-002 | P1 | Delivered quantity shall not exceed the dispatched quantity; damaged and rejected quantities are recorded. | Validation messages per line. | VERIFIED |
| FR-POD-003 | P1 | Production POD images shall be stored in object storage with signed URLs and retention rules. | No images in browser storage. | PROPOSED |

## Delivery Notes (DN)

Detail: [BM-FRD-DN — Functional Requirements — Delivery Notes](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DN_Delivery_Notes.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-DN-001 | P1 | A numbered delivery note (BM-DN-YYYY-NNNNN) shall be generated when a stop is completed (full or partial). | Note lists delivered, short and damaged quantities and receiver. | VERIFIED |
| FR-DN-002 | P1 | Delivery notes shall be printable and visible to office roles with permission, the driver and the customer. | Print layout available. | VERIFIED |
| FR-DN-003 | P1 | The delivery note shall be sent to the customer instantly by SMS / WhatsApp / email (SOW slide 13). | Prototype: visible in the customer app only. | PROPOSED |

## Delivery Exception Review (EXC)

Detail: [BM-FRD-EXC — Functional Requirements — Delivery Exception Review](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-EXC_Delivery_Exception_Review.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-EXC-001 | P1 | Dispatchers shall review failed and partial deliveries with remarks. | Review status REVIEWED. | VERIFIED |
| FR-EXC-002 | P1 | The review may return undelivered (not damaged) stock to the hub once. | Delivery Return movement posted once. | VERIFIED |
| FR-EXC-003 | P1 | A failed delivery whose goods are returned may be re-queued for a new dispatch. | Order READY_FOR_DISPATCH. | VERIFIED |

## Inventory Management (INV)

Detail: [BM-FRD-INV — Functional Requirements — Inventory Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-INV_Inventory_Management.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-INV-001 | P1 | Warehouse users shall record goods receipts that increase hub stock immediately. | GRN created; Stock Receipt movement. | VERIFIED |
| FR-INV-002 | P1 | Warehouse users shall transfer stock between hubs as a draft or completed immediately. | Transfer Out / In movements on completion. | VERIFIED |
| FR-INV-003 | P1 | Authorised users shall adjust stock (increase, decrease, damaged, lost, correction) with a reason. | Movement posted immediately. | VERIFIED |
| FR-INV-004 | P1 | Every stock change shall be written to the movement ledger. | Ledger shows type, quantity, reference, user and time. | VERIFIED |
| FR-INV-005 | P2 | Users shall set minimum, reorder and maximum levels per stock line. | Low Stock list uses the reorder level. | VERIFIED |
| FR-INV-006 | P1 | Stock cannot go negative unless the product allows it; completed transfers are not posted twice. | "Only N available…" / "already completed". | VERIFIED |
| FR-INV-007 | P2 | Batch and expiry tracking per stock line, FEFO picking and cycle counting. | Settings exist (UI only); not enforced. | NOT IMPLEMENTED |
| FR-INV-008 | P2 | Stock positions shall be synchronised with SAP in stage two. | Stock reconciled with ERP. | PROPOSED |

## Scrap Management (SCR)

Detail: [BM-FRD-SCR — Functional Requirements — Scrap Management](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-SCR_Scrap_Management.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-SCR-001 | P1 | Users shall raise scrap requests with reason, quantity, stock source, batch and photo evidence. | DRAFT or PENDING_APPROVAL. | VERIFIED |
| FR-SCR-002 | P1 | Quantity shall not exceed eligible stock; photo required for Damaged, Packaging Damage and Contamination; batch required for batch-controlled products; no duplicate open request. | Validation messages. | VERIFIED |
| FR-SCR-003 | P1 | Approvers shall approve or reject requests; requesters cannot approve their own. | APPROVED / REJECTED. | VERIFIED |
| FR-SCR-004 | P1 | Approvers shall post the stock write-off exactly once. | COMPLETED; Scrap Write-off movement. | VERIFIED |
| FR-SCR-005 | P3 | A printable scrap note shall be available. | Print layout. | VERIFIED |

## Warehouse and QA Dashboards (WQA)

Detail: [BM-FRD-WQA — Functional Requirements — Warehouse and QA Dashboards](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-WQA_Warehouse_and_QA_Dashboards.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-WQA-001 | P2 | Warehouse users shall see picking & loading, inventory alerts, damaged stock and document expiry. | Dashboard lists consolidated / ready orders per hub. | VERIFIED |
| FR-WQA-002 | P2 | QA users shall see inspection queues, quarantine, expired documents and the cold-chain card. | Cold-chain card states "No sensor integration". | VERIFIED |
| FR-WQA-003 | P2 | Live cold-chain temperature monitoring and excursion alerts. | Not available (ranges configured only). | NOT IMPLEMENTED |

## Vehicle Management System (VMS)

Detail: [BM-FRD-VMS — Functional Requirements — Vehicle Management System](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-VMS_Vehicle_Management_System.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-VMS-001 | P1 | The system shall compute compliance per vehicle and driver document (Valid, 30 days, 7 days, today, expired, missing). | Expiry register sorted by urgency. | VERIFIED |
| FR-VMS-002 | P1 | Administrators shall define required documents and blocking rules; an expired required document always blocks assignment. | Assignment blocked with the specific document message. | VERIFIED |
| FR-VMS-003 | P2 | Authorised users shall upload vehicle and driver documents with expiry dates. | Document enters the review flow. | VERIFIED |
| FR-VMS-004 | P2 | Opening the expiry register shall raise DOCUMENT_EXPIRING / DOCUMENT_EXPIRED events. | Automated notification when a rule is enabled. | VERIFIED |
| FR-VMS-005 | P3 | Fuel, maintenance and trip cost tracking. | Related reports show "no source data". | NOT IMPLEMENTED |

## Document Management and OCR (DOC)

Detail: [BM-FRD-DOC — Functional Requirements — Document Management and OCR](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-DOC_Document_Management_and_OCR.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-DOC-001 | P1 | Users shall upload documents for records they may access, with type, linked record, file and key fields. | Status PENDING_OCR, PENDING_REVIEW or VERIFIED by type settings. | VERIFIED |
| FR-DOC-002 | P1 | The system shall extract fields with OCR and let reviewers correct them (originals kept). | MOCK OCR pre-fills from the linked record (labelled Simulated OCR). | PROTOTYPE |
| FR-DOC-003 | P1 | Reviewers shall verify or reject documents; rejection requires a reason. | VERIFIED (locked) or REJECTED. | VERIFIED |
| FR-DOC-004 | P2 | Administrators shall maintain document types (fields, expiry, OCR, verification). | Built-in VMS codes cannot be changed. | VERIFIED |
| FR-DOC-005 | P1 | Production OCR shall run server-side (e.g. Tesseract / cloud OCR) with virus scanning of uploads. | Real field extraction; files never executed. | PROPOSED |

## Invoice Customisation and Invoicing (INVC)

Detail: [BM-FRD-INVC — Functional Requirements — Invoice Customisation and Invoicing](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-INVC_Invoice_Customisation_and_Invoicing.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-INVC-001 | P2 | Finance shall maintain invoice templates (layout, fonts, colours, sections, default). | Template preview available. | VERIFIED |
| FR-INVC-002 | P2 | Finance shall issue one invoice per approved-or-later order on ordered or delivered quantities with discounts and charges. | Invoice BM-INV-YYYY-NNNNN ISSUED with frozen snapshot. | VERIFIED |
| FR-INVC-003 | P2 | Finance shall cancel an invoice with a reason, after which a new invoice can be issued. | CANCELLED; order invoiceable again. | VERIFIED |
| FR-INVC-004 | P2 | Finance shall configure invoice numbering (prefix, year, digits). | Next number follows settings. | VERIFIED |
| FR-INVC-005 | P1 | The SOW states invoicing stays outside the application; the prototype includes invoicing. Production scope must be confirmed. | Client decision recorded. | PENDING CONFIRMATION |
| FR-INVC-006 | P2 | Payments, receipts, credit notes and refunds. | Not available. | NOT IMPLEMENTED |

## Email Communication (EML)

Detail: [BM-FRD-EML — Functional Requirements — Email Communication](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-EML_Email_Communication.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-EML-001 | P2 | Users shall compose and send emails with templates and document attachments. | Demo mode records SENT_DEMO ("not sent"). | PROTOTYPE |
| FR-EML-002 | P2 | Administrators shall maintain email templates with variables. | Templates render with record values. | VERIFIED |
| FR-EML-003 | P3 | Users shall read the mailbox. | Seeded demo mailbox. | PROTOTYPE |
| FR-EML-004 | P2 | Live SMTP / IMAP through the integration gateway. | Not verified (no gateway available). | NOT VERIFIED |

## OpenWA (WhatsApp) Communication (OWA)

Detail: [BM-FRD-OWA — Functional Requirements — OpenWA (WhatsApp) Communication](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-OWA_OpenWA_WhatsApp_Communication.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-OWA-001 | P2 | Users shall send WhatsApp messages using templates. | Mock provider records "Sent · demo". | PROTOTYPE |
| FR-OWA-002 | P2 | Live OpenWA session (QR, start / stop) through the gateway. | Not verified. | NOT VERIFIED |
| FR-OWA-003 | P1 | The customer messaging provider (SMS or WhatsApp; OpenWA is unofficial) must be confirmed at kickoff (SOW slide 16). | Decision recorded in the decision log. | PENDING CONFIRMATION |

## Automated Notifications (AUTO)

Detail: [BM-FRD-AUTO — Functional Requirements — Automated Notifications](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-AUTO_Automated_Notifications.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-AUTO-001 | P2 | Administrators shall configure per-event rules (channel, recipients, templates) and a master switch. | 11 events configurable. | VERIFIED |
| FR-AUTO-002 | P2 | Workflow events shall trigger messages once per record (de-duplicated) and be logged in history. | History shows SENT_DEMO / SKIPPED with reason. | VERIFIED |

## Call History (CALL)

Detail: [BM-FRD-CALL — Functional Requirements — Call History](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-CALL_Call_History.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-CALL-001 | P3 | Users shall log calls with direction, status, outcome, duration and notes. | Call saved; salesmen see their own calls only. | VERIFIED |
| FR-CALL-002 | P3 | Users shall schedule and complete follow-ups and link orders to calls. | Follow-ups grouped overdue / today / upcoming. | VERIFIED |

## Notifications (in-app) (NOTF)

Detail: [BM-FRD-NOTF — Functional Requirements — Notifications (in-app)](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-NOTF_Notifications_in_app.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-NOTF-001 | P1 | Users shall receive in-app notifications for workflow events addressed to their role, user, driver or customer record. | Bell count and Notification Center. | VERIFIED |
| FR-NOTF-002 | P3 | Users shall mark notifications read and mute categories. | Preferences saved per user. | VERIFIED |
| FR-NOTF-003 | P2 | Production apps shall send push notifications to drivers and customers. | Push received on the phone. | PROPOSED |

## Reports (RPT)

Detail: [BM-FRD-RPT — Functional Requirements — Reports](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-RPT_Reports.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-RPT-001 | P2 | Users shall browse 118 reports in 11 categories filtered by permission, with search, favourites and recent. | Only permitted categories visible. | VERIFIED |
| FR-RPT-002 | P2 | Reports shall run with date, month, year and grouping filters within the user's data scope and export to CSV or print. | CSV downloaded; print layout. | VERIFIED |
| FR-RPT-003 | P3 | Reports without source data shall say so with the reason. | 24 reports show "no source data". | VERIFIED |

## AI Assistant, Forecasting and Replenishment (AI)

Detail: [BM-FRD-AI — Functional Requirements — AI Assistant, Forecasting and Replenishment](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-AI_AI_Assistant_Forecasting_and_Replenishment.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-AI-001 | P3 | Users shall ask business questions in natural language and receive tables and charts from permission-checked tools. | Demo intent engine answers; write actions need confirmation. | PROTOTYPE |
| FR-AI-002 | P3 | Users shall generate demand forecasts with selectable models and accuracy metrics. | Forecast saved and exportable. | VERIFIED |
| FR-AI-003 | P2 | Users shall raise replenishment requests; Administrators approve, reject and convert them; stock receipts complete them. | DRAFT → SUBMITTED → APPROVED → CONVERTED → RECEIVED. | VERIFIED |
| FR-AI-004 | P3 | The system shall generate rule-based insights that users mark reviewed or resolved. | NEW → REVIEWED → RESOLVED. | VERIFIED |
| FR-AI-005 | P3 | External AI providers (OpenJarvis, Ollama, Gemini, OpenAI-compatible). | Not verified. | NOT VERIFIED |

## System Settings and Audit (SET)

Detail: [BM-FRD-SET — Functional Requirements — System Settings and Audit](../04_FUNCTIONAL_REQUIREMENTS/BM-FRD-SET_System_Settings_and_Audit.md)

| ID | P | Requirement | Expected result | Label |
|---|---|---|---|---|
| FR-SET-001 | P1 | Administrators shall configure security, approval, localisation, numbering, inventory, warehouse and cold-chain settings. | Settings validated and applied. | VERIFIED |
| FR-SET-002 | P1 | Administrative and security events shall be recorded in the audit log. | User, role, settings and lockout events listed. | VERIFIED |
| FR-SET-003 | P2 | Administrators shall reset demo data and export / import the application data. | Data reset to seed; JSON export validated on import. | VERIFIED |
| FR-SET-004 | P1 | Production data shall be stored in PostgreSQL with daily backups, point-in-time recovery and audit fields on every table. | Data shared across users and devices. | PROPOSED |

## Revision history

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-11-12 | Documentation team | Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents. |