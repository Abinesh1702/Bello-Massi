# 16 · Role Responsibility Matrix

Role abbreviations: **SA** Super Admin · **AD** Administrator · **SE** Sales Executive · **SM** Sales Manager · **CS**
Customer Service · **DP** Dispatcher · **DR** Driver · **FI** Finance · **WM** Warehouse Manager · **IE** Inventory
Executive · **QA** QA Manager · **CU** Customer · **SU** Supplier.

Legend: **R** responsible (does the work) · **A** approves / decides · **C** can act or contribute · **V** view only ·
blank = no access. Derived from the default permissions in `src/config/permissions.js` and the service rules.

## 16.1 Process responsibility matrix

| Process step | SA | AD | SE | SM | CS | DP | DR | FI | WM | IE | QA | CU | SU |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Maintain customers | R | R | V | V | V |  |  |  |  |  |  |  |  |
| Maintain products | R | R | V | V | V | V |  | V | V | V | V |  |  |
| Maintain hubs | R | R |  | V | V | V |  |  | V | V | V |  |  |
| Maintain suppliers | R | R |  | V |  | V |  | V | V |  |  |  |  |
| Maintain zones, drivers, vehicles | R | R |  |  |  | V |  |  |  |  |  |  |  |
| Create / submit order | C | C | R |  |  |  |  |  |  |  |  | R |  |
| Approve / return / reject order | A | V |  | A |  |  |  |  |  |  |  |  |  |
| Correct returned order | C | C | R |  |  |  |  |  |  |  |  |  |  |
| Consolidate, mark ready for dispatch | C | V |  |  | R |  |  |  |  |  |  |  |  |
| Plan dispatch, assign driver and vehicle | R | R |  | V | V | R |  | V | V |  |  |  |  |
| Confirm dispatch (stock deducted) | R | R |  |  |  | R |  |  |  |  |  |  |  |
| Cancel dispatch | R | R |  |  |  | R |  |  |  |  |  |  |  |
| Deliver (start, arrive, OTP, POD, complete / fail) | C* |  |  |  |  |  | R |  |  |  |  | C (shares OTP) |  |
| Review failed / partial delivery | A | A |  |  |  | A |  |  |  |  |  |  |  |
| Issue / cancel invoice | R | R |  | V |  |  |  | R |  |  |  | V |  |
| Invoice templates and numbering | R | R |  |  |  |  |  | R |  |  |  |  |  |
| Stock receipt | R | R |  |  |  | V |  |  | R | R | V |  |  |
| Stock transfer | R | R |  |  |  | V |  |  | R | R | V |  |  |
| Stock adjustment | R | R |  |  |  | V |  |  | R | V | R |  |  |
| Scrap request | R | R |  |  |  | R |  |  | R | R | R |  |  |
| Scrap approval / write-off | A | A |  |  |  |  |  |  | A |  |  |  |  |
| Replenishment draft | R | R |  |  |  | R |  |  | R | R |  |  |  |
| Replenishment approval / convert | A | A |  |  |  |  |  |  |  |  |  |  |  |
| View approved replenishment |  |  |  |  |  |  |  |  |  |  |  |  | V |
| Vehicle / driver compliance rules | R | R |  |  |  |  |  |  |  |  |  |  |  |
| Upload VMS documents | R | R |  |  | R | R |  |  |  |  |  |  |  |
| Upload documents | R | R | R | R | R | R | R | R | R | R | R |  |  |
| Verify / reject documents | A | A |  |  | A |  |  |  |  |  | A |  |  |
| Document types | R | R |  |  |  |  |  |  |  |  |  |  |  |
| Send email / WhatsApp | R | R | R | R | R | R |  | R |  |  |  |  |  |
| Automation rules | R | R |  |  |  |  |  |  |  |  |  |  |  |
| Call log and follow-ups | R | R | R (own) | R | R |  |  |  |  |  |  |  |  |
| Reports Center | V | V | V | V | V | V |  | V | V | V | V |  |  |
| Generate forecasts | R | R |  | R |  |  |  |  |  |  |  |  |  |
| Users, roles, permissions | R | R |  |  |  |  |  |  |  |  |  |  |  |
| Application settings, organization | R | R |  |  |  |  |  |  |  |  |  |  |  |
| Audit log | V | V |  |  |  |  |  |  |  |  |  |  |  |

\* Super Admin holds `driver.app` and `customer.app` but can only act in those apps if the user is linked to a
driver or customer record.

## 16.2 Hand-off matrix (who passes work to whom)

| From | Hand-off | To | Trigger in code |
|---|---|---|---|
| Sales Executive / Customer | Submitted order | Sales Manager | `submitOrder` notification |
| Sales Manager | Returned order | Sales Executive | `returnOrderForCorrection` notification with edit link |
| Sales Manager | Approved order | Customer Service | `approveOrder` notification |
| Customer Service | Ready order | Dispatcher | `markReadyForDispatch` notification |
| Dispatcher | Assigned / confirmed dispatch | Driver | `assignDispatch`, `confirmDispatch` notifications |
| Driver | Delivery started / arrived / completed | Customer | `startDelivery`, `markArrived`, `confirmDelivery` notifications |
| Driver | Failed / partial delivery | Dispatcher | `failDelivery` notification ("Review required") |
| Driver | Delivered order | Finance | Delivery note; "Delivered, to invoice" on Finance dashboard |
| Finance | Invoice | Customer | Invoice visible in customer app; automation INVOICE_GENERATED |
| Inventory Executive / QA | Scrap request | Warehouse Manager | Scrap queue (PENDING_APPROVAL) |
| Warehouse / Inventory / Dispatcher | Replenishment draft | Administrator | Replenishment list (SUBMITTED) |
| Administrator | Approved replenishment | Supplier, warehouse | Supplier portal; receipt links |
| Any uploader | Document | Customer Service / QA / Administrator | OCR queue |

## 16.3 Permission matrix (default grants)

All 110 permission keys from `src/config/rbacCatalog.js` with the default grant per system role
(`src/config/permissions.js`). Super Admin always holds every key. Administrators can change grants for non-locked
roles in **Role Management**.

| Permission key | Meaning | SA | AD | SE | SM | CS | DP | DR | FI | WM | IE | QA | CU | SU |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `dashboard.view` | Role dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `customers.view` | Customer list & details | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |  |
| `customers.manage` | Create, edit and delete customers | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `customers.credit.view` | Customer credit | ✓ | ✓ |  | ✓ |  |  |  | ✓ |  |  |  |  |  |
| `products.view` | Product catalogue | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |  |  |
| `products.manage` | Create, edit and delete products | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `suppliers.view` | Supplier directory | ✓ | ✓ |  | ✓ |  | ✓ |  | ✓ | ✓ |  |  |  |  |
| `suppliers.manage` | Edit supplier records | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `hubs.view` | Hubs & warehouses | ✓ | ✓ |  | ✓ | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |  |  |
| `hubs.manage` | Create, edit and delete hubs | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `inventory.dashboard` | Inventory dashboard | ✓ | ✓ |  |  |  | ✓ |  | ✓ | ✓ | ✓ |  |  |  |
| `inventory.stock.view` | Stock overview | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |  |  |
| `inventory.lowstock.view` | Low stock | ✓ | ✓ |  | ✓ | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |  |  |
| `inventory.movements.view` | Stock movement ledger | ✓ | ✓ |  |  |  | ✓ |  |  | ✓ | ✓ | ✓ |  |  |
| `inventory.documents.view` | Receipts, transfers & adjustments lists | ✓ | ✓ |  |  |  | ✓ |  |  | ✓ | ✓ | ✓ |  |  |
| `inventory.receipts.manage` | Receive stock (GRN) | ✓ | ✓ |  |  |  |  |  |  | ✓ | ✓ |  |  |  |
| `inventory.transfers.manage` | Stock transfers between hubs | ✓ | ✓ |  |  |  |  |  |  | ✓ | ✓ |  |  |  |
| `inventory.adjustments.manage` | Post stock adjustments | ✓ | ✓ |  |  |  |  |  |  | ✓ |  | ✓ |  |  |
| `inventory.scrap.view` | Scrap management | ✓ | ✓ |  |  |  | ✓ |  |  | ✓ | ✓ | ✓ |  |  |
| `scrap.create` | Create, edit & submit scrap requests | ✓ | ✓ |  |  |  | ✓ |  |  | ✓ | ✓ | ✓ |  |  |
| `scrap.approve` | Approve scrap & post the stock write-off | ✓ | ✓ |  |  |  |  |  |  | ✓ |  |  |  |  |
| `scrap.reject` | Reject scrap requests | ✓ | ✓ |  |  |  |  |  |  | ✓ |  |  |  |  |
| `warehouse.dashboard` | Warehouse dashboard | ✓ | ✓ |  |  |  |  |  |  | ✓ | ✓ | ✓ |  |  |
| `warehouse.qa.view` | QA & cold-chain overview | ✓ | ✓ |  |  |  |  |  |  | ✓ |  | ✓ |  |  |
| `orders.view` | Order list & details | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |  |  |  |
| `orders.create` | Create & edit sales orders | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |
| `orders.mine` | My orders | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |
| `orders.corrections.view` | Returned & rejected orders | ✓ | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |  |  |
| `orders.approval.view` | Approval queue | ✓ | ✓ |  | ✓ |  |  |  |  |  |  |  |  |  |
| `orders.approve` | Approve orders | ✓ |  |  | ✓ |  |  |  |  |  |  |  |  |  |
| `orders.reject` | Reject or return orders | ✓ |  |  | ✓ |  |  |  |  |  |  |  |  |  |
| `orders.consolidation.view` | Consolidation queue | ✓ | ✓ |  |  | ✓ |  |  |  |  |  |  |  |  |
| `orders.consolidate` | Consolidate & release orders | ✓ |  |  |  | ✓ |  |  |  |  |  |  |  |  |
| `orders.reports` | Order reports | ✓ | ✓ |  | ✓ |  |  |  | ✓ |  |  |  |  |  |
| `sales.targets.manage` | Set sales targets | ✓ | ✓ |  | ✓ |  |  |  |  |  |  |  |  |  |
| `customer.app` | Customer app — catalogue, own orders, tracking & documents | ✓ |  |  |  |  |  |  |  |  |  |  | ✓ |  |
| `customer.order` | Customer app — place orders | ✓ |  |  |  |  |  |  |  |  |  |  | ✓ |  |
| `tracking.fleet` | Live fleet map (demo GPS) | ✓ | ✓ |  |  |  | ✓ |  |  |  |  |  |  |  |
| `dispatch.view` | Dispatch dashboard & planning | ✓ | ✓ |  | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |  |  |  |
| `dispatch.ready.view` | Ready-for-dispatch queue | ✓ | ✓ |  |  | ✓ | ✓ |  |  | ✓ |  |  |  |  |
| `dispatch.manage` | Create dispatches & assign drivers / vehicles | ✓ | ✓ |  |  |  | ✓ |  |  |  |  |  |  |  |
| `dispatch.tracking` | Delivery tracking | ✓ | ✓ |  | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |
| `dispatch.history` | Delivery history | ✓ | ✓ |  | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |  |  |  |
| `dispatch.reports` | Delivery reports | ✓ | ✓ |  |  |  | ✓ |  | ✓ |  |  |  |  |  |
| `dispatch.otp.inspect` | Inspect simulated delivery OTPs | ✓ | ✓ |  |  |  | ✓ |  |  |  |  |  |  |  |
| `deliveries.view` | Delivery details | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |  |  |  |
| `fleet.view` | Zones, drivers & vehicles | ✓ | ✓ |  |  |  | ✓ |  |  |  |  |  |  |  |
| `fleet.manage` | Manage zones, drivers & vehicles | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `deliveryNotes.view` | Delivery notes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |  |  |  |
| `driver.app` | Driver app — run deliveries & confirm with OTP | ✓ |  |  |  |  |  | ✓ |  |  |  |  |  |  |
| `vms.view` | VMS dashboard, register & expiry | ✓ | ✓ |  |  |  | ✓ |  |  |  |  | ✓ |  |  |
| `vms.manage` | Manage vehicle register | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `vms.documents.upload` | Upload vehicle & driver documents | ✓ | ✓ |  |  | ✓ | ✓ |  |  |  |  |  |  |  |
| `vms.settings` | Compliance rules | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `documents.view` | Document repository | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |  |  |
| `documents.upload` | Upload documents | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |
| `documents.review` | Run OCR review & verify documents | ✓ | ✓ |  |  | ✓ |  |  |  |  |  | ✓ |  |  |
| `documents.reject` | Reject documents | ✓ | ✓ |  |  | ✓ |  |  |  |  |  | ✓ |  |  |
| `documents.types` | Document types & OCR fields | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `documents.reports` | Document reports | ✓ | ✓ |  |  | ✓ |  |  |  |  |  | ✓ |  |  |
| `invoices.view` | Invoices | ✓ | ✓ |  | ✓ |  |  |  | ✓ |  |  |  |  |  |
| `invoices.manage` | Generate & cancel invoices | ✓ | ✓ |  |  |  |  |  | ✓ |  |  |  |  |  |
| `invoices.templates` | Invoice templates & numbering | ✓ | ✓ |  |  |  |  |  | ✓ |  |  |  |  |  |
| `invoices.reports` | Invoice reports | ✓ | ✓ |  |  |  |  |  | ✓ |  |  |  |  |  |
| `communication.view` | Communication center, sent & history | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ |  |  |  |  |  |
| `communication.send` | Compose & send email | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ |  |  |  |  |  |
| `communication.inbox` | Email inbox | ✓ | ✓ |  | ✓ | ✓ |  |  |  |  |  |  |  |  |
| `communication.templates` | Email & WhatsApp templates | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `communication.settings` | SMTP / IMAP & OpenWA settings | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `communication.automation` | Automated notification rules | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `communication.calls` | Call history | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |  |
| `calls.manage` | Log, edit and delete call records & follow-ups | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |  |
| `whatsapp.view` | WhatsApp home & history | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ |  |  |  |  |  |
| `whatsapp.send` | Compose & send WhatsApp | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ |  |  |  |  |  |
| `ai.assistant.view` | AI overview & assistant | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |  |  |
| `ai.assistant.use` | Ask the AI assistant | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |  |  |
| `ai.insights.view` | AI insights | ✓ | ✓ |  | ✓ | ✓ | ✓ |  | ✓ | ✓ |  | ✓ |  |  |
| `ai.insights.manage` | Acknowledge & resolve insights | ✓ | ✓ |  | ✓ |  | ✓ |  |  |  |  |  |  |  |
| `jarvis.view` | Jarvis | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |  |  |  |
| `jarvis.use` | Use Jarvis commands | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |  |  |  |
| `forecasting.view` | Forecasting | ✓ | ✓ |  | ✓ |  | ✓ |  | ✓ | ✓ |  |  |  |  |
| `forecasting.generate` | Generate forecasts | ✓ | ✓ |  | ✓ |  |  |  |  |  |  |  |  |  |
| `forecasting.export` | Export & print forecasts | ✓ | ✓ |  | ✓ |  |  |  | ✓ |  |  |  |  |  |
| `inventory.predictions.view` | Predictive inventory | ✓ | ✓ |  | ✓ |  | ✓ |  | ✓ | ✓ |  |  |  |  |
| `inventory.predictions.manage` | Planning parameters & recommendation status | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `inventory.replenishment.create` | Create & submit replenishment drafts | ✓ | ✓ |  |  |  | ✓ |  |  | ✓ | ✓ |  |  |  |
| `procurement.view` | Replenishment drafts | ✓ | ✓ |  | ✓ |  | ✓ |  | ✓ | ✓ | ✓ |  |  |  |
| `procurement.approve` | Approve & convert replenishment drafts | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `procurement.reject` | Reject replenishment drafts | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `ai.settings.manage` | AI provider settings | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `ai.models.manage` | Model management | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `reports.inventory` | Inventory reports | ✓ | ✓ |  | ✓ |  |  |  | ✓ | ✓ |  |  |  |  |
| `reports.center` | Reports center (each report also needs its module permission) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |  |  |
| `data.export` | Export CSV files | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |  |  |
| `data.import` | Import a backup | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `finance.view` | Finance overview (outstanding & collections) | ✓ | ✓ |  |  |  |  |  | ✓ |  |  |  |  |  |
| `settings.view` | Application settings (read-only) | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `settings.manage` | Change application settings | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `organization.view` | Organization master | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `organization.manage` | Edit organization master | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `users.view` | Users | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `users.create` | Create users | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `users.edit` | Edit users | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `users.delete` | Delete users | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `users.manage` | Activate / deactivate users, reset demo passwords, assign roles & hubs | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `roles.view` | Roles & permission matrix | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `roles.create` | Create & duplicate roles | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `roles.edit` | Edit roles & permissions | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `roles.delete` | Delete custom roles | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
| `audit.view` | Audit log | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  |  |
