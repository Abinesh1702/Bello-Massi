"""Proposed REST API (PROPOSED — nothing implemented). Line: METHOD | path | permission | purpose | request body | response | rules / errors
Base path /api/v1. Permission keys are the real keys from src/config/rbacCatalog.js. Resource schema = table in data/schema.py."""
API = {
 ('003', 'Authentication API', 'users'): r"""
POST | /auth/login | (public) | Sign in with username / email / mobile and password | {identifier, password, app: office or driver or customer} | {access, refresh_expires, user, roles, permissions, landing_path} | 400 validation; 401 invalid credentials; 423 locked (RULE-001); 403 inactive (RULE-002)
POST | /auth/mfa | (public, mfa token) | Verify TOTP for privileged roles | {mfa_token, code} | {access, user} | 401 wrong code; 429 too many attempts
POST | /auth/refresh | (refresh cookie) | Rotate access token | — | {access} | 401 expired / revoked refresh token
POST | /auth/logout | (authenticated) | Revoke refresh token | — | 204 | —
POST | /auth/password/forgot | (public) | Send reset code by email / SMS | {identifier} | 202 (always, no user enumeration) | 429 rate limit
POST | /auth/password/reset | (public) | Reset with code | {identifier, code, new_password} | 204 | 400 invalid / expired code; password policy (RULE-004)
POST | /auth/password/change | (authenticated) | Change own password | {current_password, new_password} | 204 | 400 policy; 401 wrong current password
GET | /auth/me | (authenticated) | Current user, roles, permissions, scope | — | {user, roles, permissions, data_scope} | —
""",
 ('004', 'User API', 'users'): r"""
GET | /users | users.view | List users with filters (role, hub, status, search) | — | page<User> | —
POST | /users | users.manage | Create user | User (without password_hash) + temporary_password | User | 400 validation; 409 duplicate username / email
GET | /users/{id} | users.view | User detail | — | User | 404
PATCH | /users/{id} | users.manage | Update user | partial User | User | 403 Super Admin protection (RULE-005)
POST | /users/{id}/deactivate | users.manage | Deactivate | — | User | 400 cannot deactivate self (RULE-005)
POST | /users/{id}/activate | users.manage | Activate | — | User | —
POST | /users/{id}/unlock | users.manage | Clear lockout | — | User | —
POST | /users/{id}/reset-password | users.manage | Admin reset; forces change on next sign-in | — | {temporary_password_sent: true} | —
PUT | /users/{id}/roles | users.edit | Assign roles and home hub | {role_ids[], home_hub_id} | User | 400 driver needs hub
GET | /roles | roles.view | List roles | — | list<Role> | —
POST | /roles | roles.create | Create custom role | Role + permission_keys[] | Role | 409 duplicate code
PATCH | /roles/{id} | roles.edit | Update role / permissions | partial Role | Role | 403 locked role
GET | /permissions | roles.view | Permission catalogue (110 keys) | — | list<Permission> | —
GET | /audit-logs | audit.view | Audit trail with filters | — | page<AuditLog> | —
""",
 ('005', 'Customer API', 'customers'): r"""
GET | /customers | customers.view | List customers (scope: salesman sees assigned) | — | page<Customer> | —
POST | /customers | customers.manage | Create customer | Customer | Customer | 400 validation (codes, phone, tax IDs, pincode)
GET | /customers/{id} | customers.view | Customer detail incl. locations | — | Customer | 404 / out of scope
PATCH | /customers/{id} | customers.manage | Update customer | partial Customer | Customer | 400
DELETE | /customers/{id} | customers.manage | Soft delete | — | 204 | 409 referenced by orders
GET | /customers/{id}/credit-position | customers.credit.view | Balance, limit, projected for an amount | ?amount= | {limit, balance, projected, exceeded} | —
GET | /customers/{id}/locations | customers.view | Delivery locations | — | list<CustomerLocation> | —
POST | /customers/{id}/locations | customers.manage | Add location (geocoded) | CustomerLocation | CustomerLocation | 400
""",
 ('006', 'Product API', 'products'): r"""
GET | /products | products.view | List / search products | — | page<Product> | —
POST | /products | products.manage | Create product | Product | Product | 400; 409 duplicate code / SKU / barcode
GET | /products/{id} | products.view | Product detail with stock per hub | — | Product | 404
PATCH | /products/{id} | products.manage | Update | partial Product | Product | 400
DELETE | /products/{id} | products.manage | Soft delete | — | 204 | 409 referenced
GET | /product-categories | products.view | Categories | — | list<ProductCategory> | —
GET | /hubs | hubs.view | Hubs | — | list<Hub> | —
POST | /hubs | hubs.manage | Create hub | Hub | Hub | 409 duplicate code / name
GET | /zones | fleet.view | Zones with pincodes | — | list<Zone> | —
POST | /zones | fleet.manage | Create zone | Zone + postal_codes[] | Zone | 400 at least one pincode; 409 name per hub
""",
 ('007', 'Order API', 'orders'): r"""
GET | /orders | orders.view | List orders within data scope | ?status=&customer=&salesman=&from=&to= | page<Order> | —
POST | /orders | orders.create | Create draft order | Order + items[] | Order (DRAFT) | 400 validation (RULE-006, RULE-007)
GET | /orders/{id} | orders.view | Order with items, approvals, timeline | — | Order | 404 / out of scope
PATCH | /orders/{id} | orders.create | Update draft or returned order | partial Order + items[] | Order | 409 not editable in status
DELETE | /orders/{id} | orders.create | Delete own draft | — | 204 | 409 only drafts (RULE-008)
POST | /orders/{id}/submit | orders.create | Submit for approval | Idempotency-Key header | Order (SUBMITTED) + warnings | 400 validation
POST | /orders/{id}/resubmit | orders.create | Resubmit returned order | — | Order (SUBMITTED) | 409 not RETURNED
POST | /orders/{id}/duplicate | orders.create | Copy into new draft | — | Order (DRAFT) | —
GET | /orders/{id}/timeline | orders.view | Order events | — | list<OrderEvent> | —
""",
 ('008', 'Approval API', 'order_approvals'): r"""
GET | /approvals/queue | orders.approval.view | Submitted orders, oldest first | — | page<Order> | —
GET | /orders/{id}/approval-checks | orders.approval.view | Six approval checks | — | {checks[{key, severity, passed, message}]} | —
POST | /orders/{id}/approve | orders.approve | Approve | {remarks?, acknowledge_warnings, approved_items?[] (G-01, to confirm)} | Order (APPROVED) | 400 remarks required / warnings not acknowledged (RULE-012, RULE-013); 409 already decided (RULE-015); 422 blocking check (RULE-010, RULE-011)
POST | /orders/{id}/return | orders.reject | Return for correction | {reason, remarks} | Order (RETURNED) | 400 reason / remarks (RULE-014); 409
POST | /orders/{id}/reject | orders.reject | Reject | {reason, remarks} | Order (REJECTED) | 400; 409
GET | /consolidation/queue | orders.consolidation.view | Approved orders grouped by salesman | — | list<{salesman, orders[]}> | —
POST | /orders/{id}/consolidate | orders.consolidate | Consolidate with checklist | {checks{5 booleans}, notes} | Order (CONSOLIDATED) | 400 checklist incomplete (RULE-016); 409
POST | /orders/{id}/ready-for-dispatch | orders.consolidate | Release to dispatch | — | Order (READY_FOR_DISPATCH) | 409 not consolidated (RULE-017)
""",
 ('009', 'Dispatch API', 'dispatches'): r"""
GET | /dispatches | dispatch.view | List dispatches | ?date=&status=&hub= | page<Dispatch> | —
GET | /dispatches/ready-orders | dispatch.view | Orders ready for dispatch | ?hub=&zone= | page<Order> | —
POST | /dispatches | dispatch.manage | Create draft / planned dispatch | {hub_id, zone_id, dispatch_date, order_ids[], sequence[], driver_id?, vehicle_id?, status: DRAFT or PLANNED} | Dispatch + warnings | 400 ineligible order (RULE-018)
PATCH | /dispatches/{id} | dispatch.manage | Edit while DRAFT / PLANNED / ASSIGNED | partial Dispatch | Dispatch | 409 confirmed (RULE-019)
PUT | /dispatches/{id}/sequence | dispatch.manage | Change stop sequence | {stops[{order_id, sequence}]} | Dispatch | 400 invalid sequence
GET | /dispatches/{id}/suggested-sequence | dispatch.manage | Suggested / optimised sequence (Routes API in production) | — | {stops[], eta[]} | —
POST | /dispatches/{id}/assign | dispatch.manage | Assign driver and vehicle | {driver_id, vehicle_id} | Dispatch (ASSIGNED) | 422 driver / vehicle issues (RULE-023, RULE-024, RULE-025)
GET | /dispatches/{id}/confirmation-review | dispatch.manage | Stock and resource review | — | {orders, stock_check[], issues[]} | —
POST | /dispatches/{id}/confirm | dispatch.manage | Confirm loading; deduct stock once; create deliveries | {acknowledged: true} + Idempotency-Key | Dispatch (CONFIRMED) | 400 not acknowledged; 409 already confirmed; 422 stock short (RULE-020)
POST | /dispatches/{id}/cancel | dispatch.manage | Cancel; reverse stock once if confirmed | {reason, remarks} | Dispatch (CANCELLED) | 409 stop started (RULE-022)
GET | /dispatches/{id}/timeline | dispatch.view | Dispatch events | — | list<Event> | —
""",
 ('010', 'Driver API', 'drivers'): r"""
GET | /driver/me | driver.app | Logged-in driver profile and vehicle | — | Driver | 404 no driver linked
GET | /driver/deliveries/today | driver.app | Today's stops (VIP first, then sequence) | — | list<Delivery> | —
GET | /driver/deliveries/tomorrow | driver.app | Tomorrow's plan (start disabled) | — | list<Delivery> | —
GET | /driver/deliveries/{id} | driver.app | Stop detail (own only) | — | Delivery | 404 not own (scope)
GET | /driver/documents | driver.app | Own documents | — | list<Document> | —
GET | /drivers | fleet.view | Driver list | — | page<Driver> | —
POST | /drivers | fleet.manage | Create driver (and app login) | Driver + user | Driver | 400 licence / hub / zone rules
GET | /drivers/{id}/assignment-issues | dispatch.manage | Assignment issues for a dispatch | ?dispatch_id= | {issues[]} | —
""",
 ('011', 'Delivery API', 'deliveries'): r"""
POST | /deliveries/{id}/start | driver.app | Start stop; open tracking session | — | Delivery (OUT_FOR_DELIVERY) | 409 blockers (RULE-026)
POST | /tracking/location | driver.app | Send GPS points (batch) | {session_id, points[{lat, lng, accuracy, speed, heading, recorded_at}]} | 202 | 403 no active session
POST | /deliveries/{id}/arrived | driver.app | Record arrival; generate and send OTP | {lat, lng} | Delivery | 409 not out for delivery
POST | /deliveries/{id}/otp/regenerate | driver.app | New OTP (old invalidated) | — | {expires_at} | 429 rate limit
POST | /deliveries/{id}/complete | driver.app | Verify OTP, record quantities and POD, close stop, issue note | {otp, items[{order_item_id, delivered_qty, damaged_qty, rejected_qty, short_reason}], received_by, customer_remarks, signature (file), photo (file)} | Delivery + DeliveryNote | 400 POD validation (RULE-028); 422 OTP wrong / expired / locked (RULE-027); 409 already closed
POST | /deliveries/{id}/fail | driver.app | Report failure | {reason, remarks} | Delivery (FAILED) | 409 not out for delivery
POST | /deliveries/{id}/review | dispatch.manage | Review failed / partial delivery | {remarks, return_to_hub, requeue} | Delivery | 400 remarks; 409 reviewed / not reviewable (RULE-031)
GET | /deliveries | deliveries.view | Delivery tracking list | ?dispatch=&status=&date= | page<Delivery> | —
GET | /deliveries/{id}/otp-status | dispatch.otp.inspect | OTP status (never the code) | — | {status, attempts, expires_at} | —
GET | /delivery-notes/{id} | deliveryNotes.view | Delivery note (PDF link) | — | DeliveryNote | 404 / scope
GET | /customer/orders/{id}/tracking | customer.app | Customer view: own order's vehicle position | — | {driver, vehicle, last_position, eta, otp_visible?} | 404 not own order
""",
 ('012', 'Inventory API', 'stock_items'): r"""
GET | /inventory/stock | inventory.stock.view | Stock per hub / product | ?hub=&status= | page<StockItem> | —
PATCH | /inventory/stock/{id}/levels | inventory.receipts.manage | Set min / reorder / max | {min_level, reorder_level, max_level} | StockItem | 400 reorder > max
POST | /inventory/receipts | inventory.receipts.manage | Goods receipt | StockReceipt | StockReceipt | 400 inactive hub (RULE-034)
POST | /inventory/transfers | inventory.transfers.manage | Create transfer (draft or complete) | StockTransfer + complete: bool | StockTransfer | 422 insufficient stock (RULE-033)
POST | /inventory/transfers/{id}/complete | inventory.transfers.manage | Complete draft transfer | — | StockTransfer | 409 already completed
POST | /inventory/adjustments | inventory.adjustments.manage | Adjust stock | StockAdjustment | StockAdjustment | 422 would go negative (RULE-032)
GET | /inventory/movements | inventory.stock.view | Movement ledger | ?hub=&product=&from=&to= | page<StockMovement> | —
POST | /scrap-requests | scrap.create | Create scrap request (multipart photo) | ScrapRequest | ScrapRequest | 400 eligibility, photo, batch, duplicate (RULE-035, RULE-036)
POST | /scrap-requests/{id}/submit | scrap.create | Submit | — | ScrapRequest | 409
POST | /scrap-requests/{id}/approve | scrap.approve | Approve (not own) | — | ScrapRequest | 403 own request (RULE-037)
POST | /scrap-requests/{id}/reject | scrap.reject | Reject | {reason} | ScrapRequest | 400 reason
POST | /scrap-requests/{id}/write-off | scrap.approve | Post write-off once | — | ScrapRequest (COMPLETED) | 409 not approved / done
POST | /replenishment-requests | inventory.replenishment.create | Create request | ReplenishmentRequest | ReplenishmentRequest | 400
POST | /replenishment-requests/{id}/approve | procurement.approve | Approve | — | ReplenishmentRequest | 403
""",
 ('013', 'Vehicle API', 'vehicles'): r"""
GET | /vehicles | fleet.view | Vehicle list | — | page<Vehicle> | —
POST | /vehicles | fleet.manage | Create vehicle | Vehicle | Vehicle | 400 number format; 409 duplicate
PATCH | /vehicles/{id} | fleet.manage | Update vehicle / status | partial Vehicle | Vehicle | —
GET | /vms/compliance | vms.view | Compliance per vehicle and driver | — | list<{entity, documents[{type, expiry, state}]}> | —
GET | /vms/expiry-register | vms.view | Documents by urgency | ?state= | page | —
GET | /vms/rules | vms.settings | Compliance rules | — | ComplianceRules | —
PUT | /vms/rules | vms.settings | Update rules | ComplianceRules | ComplianceRules | 400
""",
 ('014', 'Document API', 'documents'): r"""
GET | /documents | documents.view | Repository (scoped) | ?type=&entity=&status= | page<Document> | —
POST | /documents | documents.upload | Upload (multipart, virus-scanned) | file + {document_type_id, entity_type, entity_id, fields} | Document | 400 type / record / file; 403 out of scope (RULE-040); 413 too large; 415 type
GET | /documents/{id}/download | documents.view | Signed URL (short-lived) | — | {url, expires_at} | 404
POST | /documents/{id}/ocr | documents.review | Run OCR | — | OcrResult | 409 not stored; 503 provider
PATCH | /documents/{id}/review | documents.review | Save corrected fields | {fields} | Document | —
POST | /documents/{id}/verify | documents.review | Verify | — | Document (VERIFIED) | 400 fields missing
POST | /documents/{id}/reject | documents.reject | Reject | {reason} | Document (REJECTED) | 400 reason
POST | /documents/{id}/replace | documents.upload | Replace file (restarts review) | file | Document | —
GET | /document-types | documents.view | Document types | — | list<DocumentType> | —
""",
 ('015', 'Invoice API', 'invoices'): r"""
GET | /invoices | invoices.view | List invoices | — | page<Invoice> | —
POST | /invoices/preview | invoices.manage | Calculate without saving | {order_id, template_id, quantity_basis, invoice_date, due_date, discount, charges} | {lines, totals} | 400 options (RULE-039)
POST | /invoices | invoices.manage | Issue invoice (snapshot) | same as preview | Invoice (ISSUED) | 409 not eligible / already invoiced (RULE-038)
POST | /invoices/{id}/cancel | invoices.manage | Cancel | {reason} | Invoice (CANCELLED) | 400 reason; 409 already cancelled
GET | /invoices/{id}/pdf | invoices.view | PDF (signed URL) | — | {url} | —
GET | /invoice-templates | invoices.templates | Templates | — | list<InvoiceTemplate> | —
POST | /invoice-templates | invoices.templates | Create template | InvoiceTemplate | InvoiceTemplate | 400
""",
 ('016', 'Notification API', 'notifications'): r"""
GET | /notifications | (authenticated) | Own notifications (user + role targets) | ?unread=true | page<Notification> | —
POST | /notifications/{id}/read | (authenticated) | Mark read | — | 204 | —
POST | /notifications/read-all | (authenticated) | Mark all read | — | 204 | —
PUT | /notifications/preferences | (authenticated) | Muted categories, toasts, digest | {muted[], toasts, digest} | Preferences | —
GET | /automation/rules | communication.automation | Event rules | — | list<AutomationRule> | —
PUT | /automation/rules/{event} | communication.automation | Update rule | AutomationRule | AutomationRule | 403 not admin
POST | /messages/email | communication.send | Send email | {to[], cc[], subject, body, template_id?, attachment_document_ids[]} | Message | 400
POST | /messages/whatsapp | communication.send | Send WhatsApp / SMS | {to, body, template_id?} | Message | 400; 503 provider
POST | /webhooks/messaging/{provider} | (signed webhook) | Delivery receipts | provider payload | 204 | 401 bad signature
GET | /calls | communication.calls | Call log (salesman: own) | — | page<CallLog> | —
POST | /calls | calls.manage | Log call | CallLog | CallLog | 400 follow-up date (RULE-043)
""",
 ('017', 'Reporting API', 'orders'): r"""
GET | /dashboard/{role} | dashboard.view | Role dashboard KPIs for a period | ?from=&to=&compare=true | {kpis[], queues[], charts[]} | —
GET | /reports | reports.center | Report catalogue filtered by permission | — | list<{id, category, title, available}> | —
GET | /reports/{id} | reports.center + category permission | Run report within data scope | ?from=&to=&month=&year=&group_by= | {columns[], rows[], totals} | 403 category; 422 no source data
GET | /reports/{id}/export | data.export | Export CSV / XLSX | ?format=csv | file | 403
GET | /monitor/orders | dashboard.view | Live order monitor snapshot (WebSocket channel `monitor.orders` for updates) | — | page<Order> | —
""",
}


def parse():
    out = []
    for (num, name, res), txt in API.items():
        for line in txt.strip().splitlines():
            p = [x.strip() for x in line.split('|')]
            assert len(p) == 7, line
            out.append(dict(doc=num, domain=name, resource=res, method=p[0], path='/api/v1' + p[1], perm=p[2], purpose=p[3], body=p[4], response=p[5], errors=p[6]))
    return out
