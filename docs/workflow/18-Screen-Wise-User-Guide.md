# 18 · Screen-Wise User Guide

Every screen in the application, in simple English. "Who" uses the role abbreviations from chapter 16 (SA Super Admin
can open every screen and is not repeated). Screens reached from a list (details, edit, print) are included after their
list.

## 18.1 Before you sign in

| Screen | Route | What you do here |
|---|---|---|
| Sign in | `/login` | Type your email or username and password. Tick "Keep me signed in" on your own computer. Pick a demo account from the list if you are trying the demo. |
| Driver sign in | `/driver/login` | Drivers sign in with mobile number, email or username. |
| Customer sign in | `/customer/login` | Customers sign in with mobile number, email or username. |
| Forgot password | `/forgot-password` | Get a 6-digit reset code (shown on screen in the demo) or restore the demo password. |
| Reset password | `/reset-password` | Enter the code and your new password. |
| Unauthorized | `/unauthorized` | You opened a page your role cannot use. Go back to your dashboard. |
| Not found | any unknown address | The page does not exist. Use the menu. |

## 18.2 Common controls

- **Sidebar** (office app): menu groups for your role; collapse it with the arrow. **Bottom bar** (driver and customer apps).
- **Header**: global search, notifications bell, theme, your name menu (profile, password, sign out).
- **Lists**: search box, filters, column sorting, pagination, export where allowed.
- **Forms**: required fields are marked; errors appear under the field; the save buttons stay at the bottom.
- **Status badges**: colours follow the status (green done, amber waiting, red problem, grey closed).
- **DEMO badges**: "DEMO GPS", "Simulated OCR", "Sent · demo" mark simulated behaviour.


## 18.3 Dashboard

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Dashboard | `/dashboard` | All | Your home page. Shows the numbers and work queues for your role. Pick a period at the top; click any card to open the list behind it. |

## 18.4 Order Management

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Create Order | `/orders/create` | AD, SE | Fill in customer, hub, delivery date and address, add products and quantities. Check the totals and warnings, then Save draft or Submit for approval. |
| My Orders | `/orders/my-orders` | AD, SE | All orders you created, with their status. Open one to see details, edit a draft or a returned order. |
| Order List | `/orders` | AD, SE, SM, CS, DP, FI, WM | Every order you are allowed to see. Search and filter by status, customer, salesman, hub or date. |
| Order Approval | `/orders/approval` | AD, SM | Orders waiting for your decision, oldest first. Open an order to approve, return or reject it. |
| Order Consolidation | `/orders/consolidation` | AD, CS | Approved orders waiting to be checked against the warehouse. Open one to consolidate it. |
| Returned Orders | `/orders/returned` | AD, SE, SM | Orders the Sales Manager sent back. Open one to see the reason, correct it and resubmit. |
| Rejected Orders | `/orders/rejected` | AD, SE, SM | Orders that were rejected, with the reason. They cannot be changed; duplicate one to start again. |
| Order Reports | `/orders/reports` | AD, SM, FI | Order totals and trends by status, salesman, customer and period. |
| Edit Order | `/orders/:id/edit` | AD, SE | Change a draft or a returned order. For a returned order the section to fix is highlighted. Resubmit when done. |
| Review Order | `/orders/approval/:id` | AD, SM | Review one order: approval checks (customer, hub, credit, stock, total, products), lines and history. Approve with optional remarks, or return / reject with a reason. |
| Consolidate Order | `/orders/consolidation/:id` | AD, CS | Tick the five verification checks, review hub stock, add notes, Consolidate, then Mark ready for dispatch. |
| Order Details | `/orders/:id` | AD, SE, SM, CS, DP, FI, WM | Everything about one order: lines, totals, approval, dispatch, delivery, invoice and the full timeline. |

## 18.5 Customers

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Customer List | `/customers` | AD, SE, SM, CS | List of customers. Search, filter and open a customer. |
| Customer Credit | `/customers/credit` | AD, SM, FI | Credit limit, balance and utilisation for every customer. Spot who is over the limit. |
| Add Customer | `/customers/create` | AD | Add a new customer: details, contacts, address, GST / PAN, hub, zone, sales rep and credit settings. |
| Customer Details | `/customers/:id` | AD, SE, SM, CS | One customer: profile, credit position, orders, deliveries and documents. |
| Edit Customer | `/customers/:id/edit` | AD | Change a customer's details or credit settings. |

## 18.6 Master data

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Products | `/products` | AD, SE, SM, CS, DP, FI, WM, IE, QA | Product catalogue with price, tax, unit and status. Open or add a product. |
| Suppliers | `/suppliers` | AD, SM, DP, FI, WM | Suppliers used for replenishment. Add or edit a supplier and its lead time. |
| Hubs | `/hubs` | AD, SM, CS, DP, WM, IE, QA | Hubs (warehouses / distribution points). Open or add a hub. |
| Add Product | `/products/create` | AD | Add a product: code, SKU, barcode, category, unit, price, tax, discount limit, storage and stock settings. |
| Product Details | `/products/:id` | AD, SE, SM, CS, DP, FI, WM, IE, QA | One product: details and stock at each hub. |
| Edit Product | `/products/:id/edit` | AD | Change a product. |
| Add Hub | `/hubs/create` | AD | Add a hub: code, name, type, address and contacts. |
| Hub Details | `/hubs/:id` | AD, SM, CS, DP, WM, IE, QA | One hub: details, stock, zones and fleet. |
| Edit Hub | `/hubs/:id/edit` | AD | Change a hub. |

## 18.7 Inventory

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Inventory Dashboard | `/inventory` | AD, DP, FI, WM, IE | Inventory overview: stock value, status mix, alerts and recent stock documents. |
| Warehouse Dashboard | `/warehouse` | AD, WM, IE, QA | Warehouse view: picking and loading for today, stock alerts, damaged stock and document expiry. |
| QA & Cold Chain | `/quality` | AD, WM, QA | QA view: documents to inspect, quarantine (damaged stock), expiries and the cold-chain card (no live sensors). |
| Stock Overview | `/inventory/stock` | AD, SE, SM, CS, DP, FI, WM, IE, QA | Stock for every product at every hub, with available quantity and status. |
| Low Stock | `/inventory/low-stock` | AD, SM, CS, DP, WM, IE, QA | Lines at or below the reorder level, or out of stock. Start a receipt, transfer or replenishment from here. |
| Stock Receipts | `/inventory/stock-receipts` | AD, DP, WM, IE, QA | List of goods received (GRN). Open one or create a new receipt. |
| Stock Transfers | `/inventory/stock-transfers` | AD, DP, WM, IE, QA | Transfers between hubs. Complete or cancel drafts. |
| Stock Adjustments | `/inventory/stock-adjustments` | AD, DP, WM, IE, QA | Stock corrections (increase, decrease, damaged, lost, correction) with reasons. |
| Stock Movements | `/inventory/movements` | AD, DP, WM, IE, QA | The stock ledger: every movement in and out with reference. |
| Scrap Management | `/inventory/scrap` | AD, DP, WM, IE, QA | Scrap overview: requests by status, value and reason. |
| Scrap Requests | `/inventory/scrap/requests` | AD, DP, WM, IE, QA | All scrap requests. Filter by status and open one. |
| New Scrap Request | `/inventory/scrap/requests/create` | AD, DP, WM, IE, QA | Request scrap: product, hub, stock source, quantity, reason, batch and photo. Save draft or submit. |
| Edit Scrap Request | `/inventory/scrap/requests/:id/edit` | AD, DP, WM, IE, QA | Change your draft scrap request. |
| Scrap Note | `/inventory/scrap/requests/:id/print` | AD, DP, WM, IE, QA | Printable scrap note. |
| Scrap Request | `/inventory/scrap/requests/:id` | AD, DP, WM, IE, QA | One scrap request: details, photo, history; approve, reject, write off or cancel depending on your role. |
| Stock Details | `/inventory/stock/:id` | AD, SE, SM, CS, DP, FI, WM, IE, QA | One stock line: quantities, recent movements, and minimum / reorder / maximum levels. |
| New Receipt | `/inventory/stock-receipts/create` | AD, WM, IE | Record goods received: hub, product, quantity, date and reference. Stock goes up immediately. |
| New Transfer | `/inventory/stock-transfers/create` | AD, WM, IE | Move stock from one hub to another. Save as draft or complete now. |
| New Adjustment | `/inventory/stock-adjustments/create` | AD, WM, QA | Correct stock with a type and reason. Posted immediately. |

## 18.8 Dispatch

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Dispatch Dashboard | `/dispatch` | AD, SM, CS, DP, FI, WM | Dispatch overview: ready orders, dispatches by status, deliveries, drivers, vehicles and performance charts. |
| Ready for Dispatch | `/dispatch/ready-orders` | AD, CS, DP, WM | Orders released by Customer Service and waiting to be planned. Select orders to start a dispatch. |
| Dispatch Planning | `/dispatch/planning` | AD, SM, CS, DP, FI, WM | All dispatches by date and status. Open one or create a new dispatch. |
| Driver Assignment | `/dispatch/assignments` | AD, DP | Dispatches that need a driver and vehicle. Assign only compliant, free resources from the same hub. |
| Delivery Tracking | `/dispatch/delivery-tracking` | AD, SM, CS, DP | Every stop on active dispatches with live status. |
| Delivery History | `/dispatch/delivery-history` | AD, SM, CS, DP, FI, WM | Closed stops. Failed and partial deliveries waiting for review are highlighted. |
| Dispatch Zones | `/dispatch/zones` | AD, DP | Delivery zones (pincode groups) for each hub. |
| Drivers | `/dispatch/drivers` | AD, DP | Driver list with availability, hub and licence status. |
| Vehicles | `/dispatch/vehicles` | AD, DP | Vehicle list with status, capacity and hub. |
| Delivery Reports | `/dispatch/reports` | AD, DP, FI | Delivery performance: on-time, failed, partial, by driver and zone. |
| New Dispatch | `/dispatch/create` | AD, DP | Build a dispatch: pick ready orders, hub, zone, date, put the stops in order, optionally assign driver and vehicle. Save draft or plan. |
| New Zone | `/dispatch/zones/create` | AD | Add a zone with its pincodes. |
| Edit Zone | `/dispatch/zones/:id/edit` | AD | Change a zone. |
| Live Tracking (Demo GPS) | `/dispatch/live-tracking` | AD, DP | Map with simulated (DEMO GPS) positions of vehicles on the road. |
| New Driver | `/dispatch/drivers/create` | AD | Add a driver: code, contact, hub, zone, licence, vehicle and app login. |
| Edit Driver | `/dispatch/drivers/:id/edit` | AD | Change a driver. |
| Driver Details | `/dispatch/drivers/:id` | AD, DP | One driver: profile, compliance and performance. |
| New Vehicle | `/dispatch/vehicles/create` | AD | Add a vehicle: number, type, capacity, hub, category, fuel, ownership and document dates. |
| Edit Vehicle | `/dispatch/vehicles/:id/edit` | AD | Change a vehicle. |
| Delivery Details | `/dispatch/deliveries/:id` | AD, SE, SM, CS, DP, FI, WM | One stop: items, delivered / damaged quantities, proof of delivery, OTP (for the Dispatcher) and the review panel for exceptions. |
| Delivery Note | `/dispatch/delivery-notes/:id` | AD, SE, SM, CS, DP, FI, WM | Printable delivery note (BM-DN number) with what was delivered and who received it. |
| Edit Dispatch | `/dispatch/:id/edit` | AD, DP | Change a dispatch that is still Draft, Planned or Assigned. |
| Dispatch Details | `/dispatch/:id` | AD, SM, CS, DP, FI, WM | One dispatch: stops, sequence, driver, vehicle, stock check, timeline. Confirm (loading sign-off) or cancel here. |

## 18.9 My Deliveries

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Today | `/driver/dashboard` | DR | Driver home: today's and tomorrow's stops, your next stop and your performance. |
| My Deliveries | `/driver/deliveries` | DR | All your stops. Tap one to open it. |
| Route | `/driver/route` | DR | Map of your stops in order (DEMO GPS). |
| Completed | `/driver/completed` | DR | Stops you have finished. |
| My Delivery Notes | `/driver/delivery-notes` | DR | Delivery notes for your completed stops. |
| Driver Profile | `/driver/profile` | DR | Your details and vehicle. Sign out from here. |
| My Documents | `/driver/documents` | DR | Your licence and other documents. Upload new ones. |
| Document | `/driver/documents/:id` | DR | One of your documents. |
| Confirm Delivery | `/driver/deliveries/:id/confirm` | DR | Enter what the customer accepted, who received it, optional signature and photo, then the customer's OTP to complete. |
| Delivery | `/driver/deliveries/:id` | DR | One stop: address, contact, items. Start delivery, Reach location, Complete with OTP, or Report issue. |
| Delivery Note | `/driver/delivery-notes/:id` | DR | A delivery note to show the customer. |

## 18.10 My Account (Customer)

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Home | `/customer/dashboard` | CU | Customer home: your orders, deliveries on the way, notes and balance. |
| Catalog | `/customer/catalog` | CU | Browse and search products and add them to your cart. |
| Cart | `/customer/cart` | CU | Check your cart, choose the delivery address and date, and place the order. |
| My Orders | `/customer/orders` | CU | Your orders with filters (active, pending, delivered). |
| Order | `/customer/orders/:id` | CU | One order: progress tracker, items, status. Reorder from here. |
| Track Delivery | `/customer/tracking/:id` | CU | Follow the driver on the map (DEMO GPS). When the driver arrives, your OTP is shown here. |
| Delivery Notes | `/customer/delivery-notes` | CU | Delivery notes for your deliveries. |
| Delivery Note | `/customer/delivery-notes/:id` | CU | One delivery note. |
| Invoices | `/customer/invoices` | CU | Your invoices. |
| Invoice | `/customer/invoices/:id` | CU | One invoice. |
| Payments | `/customer/payments` | CU | Your outstanding balance. Payment history is not available in this prototype. |
| Profile | `/customer/profile` | CU | Your account details. Sign out from here. |

## 18.11 Vehicle Management

| Screen | Route | Who | What you do here |
|---|---|---|---|
| VMS Dashboard | `/vms` | AD, DP, QA | Fleet compliance overview: vehicles and drivers by document status. |
| Vehicles | `/vms/vehicles` | AD, DP, QA | Vehicles with their compliance state. |
| Driver Documents | `/vms/drivers` | AD, DP, QA | Drivers and their documents. |
| Document Expiry | `/vms/document-expiry` | AD, DP, QA | All vehicle and driver documents sorted by urgency: expired, today, 7 days, 30 days. |
| VMS Reports | `/vms/reports` | AD, DP, QA | Fleet and compliance reports. |
| Compliance Rules | `/vms/settings` | AD | Choose which documents are required and when expiry blocks assignment. |
| New Vehicle | `/vms/vehicles/create` | AD | Add a vehicle (VMS). |
| Edit Vehicle | `/vms/vehicles/:id/edit` | AD | Change a vehicle (VMS). |
| Vehicle Documents | `/vms/vehicles/:id/documents` | AD, DP, QA | A vehicle's documents and expiry dates. |
| Vehicle Details | `/vms/vehicles/:id` | AD, DP, QA | One vehicle: details and compliance. |
| Driver Documents | `/vms/drivers/:id/documents` | AD, DP, QA | A driver's documents and expiry dates. |

## 18.12 Documents

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Document Repository | `/documents` | AD, SE, SM, CS, DP, FI, WM, IE, QA | All documents you may see. Search by type, record or status. |
| Upload Documents | `/documents/upload` | AD, SE, SM, CS, DP, FI, WM, IE, QA | Upload a document: type, what it belongs to, the record, the file and key fields. |
| OCR Queue | `/documents/ocr-queue` | AD, SE, SM, CS, DP, FI, WM, IE, QA | Documents waiting for OCR or review. |
| Verified | `/documents/verified` | AD, SE, SM, CS, DP, FI, WM, IE, QA | Verified documents. |
| Rejected | `/documents/rejected` | AD, SE, SM, CS, DP, FI, WM, IE, QA | Rejected documents with the reason. |
| Document Types | `/documents/types` | AD | Document types and the fields each one captures. |
| Document Reports | `/documents/reports` | AD, CS, QA | Document counts by type, status and expiry. |
| New Document Type | `/documents/types/create` | AD | Add a document type. |
| Edit Document Type | `/documents/types/:id/edit` | AD | Change a document type. |
| OCR Review | `/documents/:id/review` | AD, SE, SM, CS, DP, FI, WM, IE, QA | Check the extracted fields against the file, correct them, then verify or reject. |
| Document | `/documents/:id` | AD, SE, SM, CS, DP, FI, WM, IE, QA | One document: file, fields, status and history. |

## 18.13 Invoices

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Invoice Dashboard | `/invoices/dashboard` | AD, SM, FI | Invoice overview: issued value, orders delivered but not invoiced, recent invoices. |
| Invoices | `/invoices` | AD, SM, FI | All invoices. Search and open. |
| New Invoice | `/invoices/create` | AD, FI | Pick an order, choose template and options, check the live preview, then issue the invoice. |
| Invoice Templates | `/invoices/templates` | AD, FI | Invoice designs. Set the default template. |
| Invoice Reports | `/invoices/reports` | AD, FI | Invoice totals by status, customer and period. |
| New Template | `/invoices/templates/create` | AD, FI | Design a new invoice template. |
| Edit Template | `/invoices/templates/:id/edit` | AD, FI | Change an invoice template. |
| Template Preview | `/invoices/templates/:id/preview` | AD, SM, FI | See a template with sample data. |
| Print Invoice | `/invoices/:id/print` | AD, SM, FI | Print-ready invoice. |
| Invoice | `/invoices/:id` | AD, SM, FI | One invoice: lines, totals, status. Print, email or cancel. |

## 18.14 Communication

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Communication Center | `/communication` | AD, SE, SM, CS, DP, FI | Communication hub: email, WhatsApp, automation and calls at a glance. |
| Email | `/communication/email` | AD, SE, SM, CS, DP, FI | Email home: counts and mode (demo or live). |
| WhatsApp | `/communication/whatsapp` | AD, SE, SM, CS, DP, FI | WhatsApp home: session state and recent messages. |
| Automated Notifications | `/communication/automation` | AD | Switch automation on or off and set, for each business event, the channel, recipients and templates. See the send history. |
| Call History | `/communication/calls` | AD, SE, SM, CS | Call overview: today's calls, outcomes and follow-ups due. |
| Call Follow-ups | `/communication/calls/follow-ups` | AD, SE, SM, CS | Follow-ups by overdue, today and upcoming. Complete them here. |
| All Calls | `/communication/calls/list` | AD, SE, SM, CS | All calls you may see. |
| Log a Call | `/communication/calls/create` | AD, SE, SM, CS | Log a call: customer, direction, status, outcome, duration, notes and follow-up. |
| Edit Call | `/communication/calls/:id/edit` | AD, SE, SM, CS | Change a call. |
| Call Details | `/communication/calls/:id` | AD, SE, SM, CS | One call: details, notes, follow-up and linked order. |
| Compose Email | `/communication/email/compose` | AD, SE, SM, CS, DP, FI | Write an email (or use a template) and send it. In demo mode it is recorded, not sent. |
| Inbox | `/communication/email/inbox` | AD, SM, CS | Received emails (demo mailbox unless a live gateway is connected). |
| Sent | `/communication/email/sent` | AD, SE, SM, CS, DP, FI | Emails you sent and their status. |
| Drafts | `/communication/email/drafts` | AD, SE, SM, CS, DP, FI | Saved email drafts. |
| History | `/communication/email/history` | AD, SE, SM, CS, DP, FI | Full email log. |
| Email Templates | `/communication/email/templates` | AD, SE, SM, CS, DP, FI | Email templates with variables. |
| New Template | `/communication/email/templates/create` | AD | Add an email template. |
| Edit Template | `/communication/email/templates/:id/edit` | AD | Change an email template. |
| Email Settings | `/communication/email/settings` | AD | Email server settings (used only through the gateway). |
| Compose | `/communication/whatsapp/compose` | AD, SE, SM, CS, DP, FI | Write and send a WhatsApp message. In demo mode it is recorded, not sent. |
| History | `/communication/whatsapp/history` | AD, SE, SM, CS, DP, FI | WhatsApp message log. |
| WhatsApp Templates | `/communication/whatsapp/templates` | AD, SE, SM, CS, DP, FI | WhatsApp templates. |
| New Template | `/communication/whatsapp/templates/create` | AD | Add a WhatsApp template. |
| Edit Template | `/communication/whatsapp/templates/:id/edit` | AD | Change a WhatsApp template. |
| OpenWA Settings | `/communication/whatsapp/settings` | AD | OpenWA session settings (QR, start / stop) through the gateway. |

## 18.15 Administration

| Screen | Route | Who | What you do here |
|---|---|---|---|
| User Management | `/admin/users` | AD | All user accounts with role, hub and status. |
| Role Management | `/admin/roles` | AD | All roles with their data scope and number of users. |
| Permission Matrix | `/admin/permissions` | AD | Matrix of permissions by role. Change grants for editable roles. |
| User Role Assignment | `/admin/role-assignment` | AD | Give users their roles and home hub. |
| Audit Log | `/admin/audit-logs` | AD | Who changed what and when (administration and security events). |
| Application Settings | `/admin/settings` | AD | Company-wide settings: localisation, numbering, security, approval rules, inventory, warehouse, cold chain. |
| Create User | `/admin/users/create` | AD | Create a user: name, login, role, hub and (for portal users) the linked customer or driver. |
| Edit User | `/admin/users/:id/edit` | AD | Change a user. |
| User Details | `/admin/users/:id` | AD | One user: details, roles, status; reset password, unlock, activate / deactivate. |
| Create Role | `/admin/roles/create` | AD | Create a custom role: name, scope, landing page and permissions. |
| Edit Role | `/admin/roles/:id/edit` | AD | Change a role. |
| Role Details | `/admin/roles/:id` | AD | One role: permissions and users. |

## 18.16 Organization

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Company | `/admin/organization/company` | AD | Company profile used across the app and on documents. |
| Branches | `/admin/organization/branches` | AD | Branches. |
| Business Units | `/admin/organization/business-units` | AD | Business units. |
| Departments | `/admin/organization/departments` | AD | Departments. |
| Designations | `/admin/organization/designations` | AD | Job titles. |
| Employee Master | `/admin/organization/employees` | AD | Employee master linked to users. |
| Warehouse Master | `/admin/organization/warehouses` | AD | Warehouse master. |

## 18.17 AI & Intelligence

| Screen | Route | Who | What you do here |
|---|---|---|---|
| AI Overview | `/ai` | AD, SE, SM, CS, DP, FI, WM, IE, QA | AI overview: what the assistant, forecasting and insights can do. |
| AI Assistant | `/ai/assistant` | AD, SE, SM, CS, DP, FI, WM, IE, QA | Ask questions about your data in plain words and get tables and charts back. |
| Jarvis | `/ai/jarvis` | AD, SE, SM, CS, DP, FI, WM | Voice-style assistant ("Jarvis") for quick questions and actions with confirmation. |
| Forecasting | `/ai/forecasting` | AD, SM, DP, FI, WM | Forecast overview and recent forecasts. |
| Predictive Inventory | `/ai/predictive-inventory` | AD, SM, DP, FI, WM | Predicted stock needs, risks and reorder suggestions. |
| Replenishment | `/ai/replenishment` | AD, SM, DP, FI, WM, IE | Purchase requests to suppliers and their status. |
| AI Insights | `/ai/insights` | AD, SM, CS, DP, FI, WM, QA | Automatically found issues and opportunities. Mark them reviewed or resolved. |
| Model Management | `/ai/models` | AD, SM, DP, FI, WM | Forecasting models: enable or disable, see accuracy. |
| AI Settings | `/ai/settings` | AD | Choose the AI provider and data-sharing level. |
| AI Activity | `/ai/activity` | AD, SE, SM, CS, DP, FI, WM, IE, QA | Log of what the assistant did for you. |
| New Forecast | `/ai/forecasting/new` | AD, SM | Create a forecast: what, where, how far ahead, which model. |
| Forecast History | `/ai/forecasting/history` | AD, SM, DP, FI, WM | Past forecasts. |
| Compare Forecasts | `/ai/forecasting/compare` | AD, SM, DP, FI, WM | Compare forecasts side by side. |
| Forecast Report | `/ai/forecasting/:id/print` | AD, SM, FI | Printable forecast report. |
| Forecast | `/ai/forecasting/:id` | AD, SM, DP, FI, WM | One forecast with chart and accuracy. |
| Reorder Recommendations | `/ai/predictive-inventory/reorder` | AD, SM, DP, FI, WM | Suggested reorders. Add to a replenishment draft or dismiss. |
| Inventory Risk Analysis | `/ai/predictive-inventory/risks` | AD, SM, DP, FI, WM | Stock-out, excess, slow and non-moving risks. |
| Demand Forecasting | `/ai/predictive-inventory/demand` | AD, SM, DP, FI, WM | Demand forecast by product and hub. |
| Planning Parameters | `/ai/predictive-inventory/settings` | AD, SM, DP, FI, WM | Planning parameters (Administrator). |
| Prediction Detail | `/ai/predictive-inventory/lines/:id` | AD, SM, DP, FI, WM | Prediction for one product at one hub. |
| New Replenishment Draft | `/ai/replenishment/create` | AD, DP, WM, IE | Create a purchase request: supplier, hub, products and quantities. |
| Replenishment Draft | `/ai/replenishment/:id` | AD, SM, DP, FI, WM, IE | One purchase request: submit, approve, reject, convert, cancel, and receive goods. |

## 18.18 Reports

| Screen | Route | Who | What you do here |
|---|---|---|---|
| Reports Center | `/reports/center` | AD, SE, SM, CS, DP, FI, WM, IE, QA | All reports you may see. Search, favourite and open. |
| Report | `/reports/view/:id` | AD, SE, SM, CS, DP, FI, WM, IE, QA | Run a report: set dates and filters, view table and chart, export CSV or print. |

## 18.19 My Account

| Screen | Route | Who | What you do here |
|---|---|---|---|
| My Profile | `/profile` | All | Your profile. |
| Notification Center | `/notifications` | All | All your notifications. Mark them read and open the linked record. |
| Change Password | `/account/change-password` | All | Change your password (required after an administrator reset). |
| Preferences | `/settings` | All | Your preferences: theme and notifications. |
| Sign Out | `/logout` | All | Confirm sign out. |
