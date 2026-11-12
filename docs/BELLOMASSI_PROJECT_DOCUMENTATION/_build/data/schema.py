"""Proposed production schema (PostgreSQL / Django). PROPOSED — derived from the prototype objects in data/storage.json.
Column spec: 'name type [PK] [FK:table] [UQ] [NN] [IDX] | description'. Every table also gets the AUDIT columns."""
AUDIT = ['created_at timestamptz NN | Creation time', 'created_by_id bigint FK:users | Creating user', 'updated_at timestamptz NN | Last update time',
         'updated_by_id bigint FK:users | Last updating user']
SOFT = ['is_deleted boolean NN | Soft-delete flag (default false)', 'deleted_at timestamptz | Soft-delete time']

T = {
 # app, table, prototype key, description, soft delete, columns
 'users': ('accounts', 'bellomassi_demo_users', 'User accounts for all roles', True, [
   'id bigserial PK | Surrogate key', 'username varchar(60) UQ NN | Sign-in name', 'email varchar(254) UQ NN | Email', 'phone varchar(20) IDX | Mobile (E.164)',
   'full_name varchar(120) NN | Display name', 'password_hash varchar(255) NN | Argon2id hash', 'status varchar(20) NN | active / inactive',
   'home_hub_id bigint FK:hubs | Home hub', 'customer_id bigint FK:customers | Linked customer (portal users)', 'driver_id bigint FK:drivers | Linked driver',
   'supplier_id bigint FK:suppliers | Linked supplier', 'must_change_password boolean NN | Forced change', 'failed_attempts smallint NN | Failed sign-ins',
   'locked_until timestamptz | Lockout end', 'last_login_at timestamptz | Last sign-in', 'mfa_enabled boolean NN | MFA flag']),
 'roles': ('accounts', 'bellomassi_roles', 'System and custom roles', True, [
   'id bigserial PK | Key', 'code varchar(40) UQ NN | e.g. SALES_MANAGER', 'name varchar(80) NN | Label', 'description text | Description', 'data_scope varchar(30) NN | ADMIN, SALESMAN, CUSTOMER …',
   'landing_path varchar(120) NN | Landing page', 'is_system boolean NN | System role', 'is_locked boolean NN | Cannot be changed', 'status varchar(20) NN | active / inactive']),
 'permissions': ('accounts', 'bellomassi_permissions', 'Permission catalogue (110 keys)', False, [
   'id bigserial PK | Key', 'key varchar(80) UQ NN | e.g. orders.approve', 'module varchar(40) NN | Module group', 'label varchar(120) NN | Description']),
 'role_permissions': ('accounts', 'bellomassi_roles.permissions', 'Permissions granted to a role', False, [
   'id bigserial PK | Key', 'role_id bigint FK:roles NN | Role', 'permission_id bigint FK:permissions NN | Permission']),
 'user_roles': ('accounts', 'bellomassi_demo_users.roles', 'Roles assigned to a user', False, [
   'id bigserial PK | Key', 'user_id bigint FK:users NN | User', 'role_id bigint FK:roles NN | Role', 'is_primary boolean NN | Primary role']),
 'company': ('core', 'bellomassi_company', 'Company profile', False, [
   'id bigserial PK | Key', 'name varchar(160) NN | Legal name', 'tax_number varchar(40) | TRN / GSTIN', 'currency char(3) NN | ISO currency', 'timezone varchar(60) NN | IANA time zone',
   'country varchar(60) NN | Country', 'address text | Address', 'logo_url varchar(500) | Logo in object storage', 'fiscal_year_start_month smallint NN | 1–12']),
 'hubs': ('masterdata', 'bellomassi_hubs', 'Fulfilment hubs / warehouses', True, [
   'id bigserial PK | Key', 'code varchar(6) UQ NN | Hub code', 'name varchar(120) UQ NN | Name', 'hub_type varchar(30) NN | Main, Regional, Branch …', 'status varchar(20) NN | Active / Inactive',
   'address_line1 varchar(200) | Address', 'city varchar(80) | City', 'state varchar(80) | State / emirate', 'postal_code varchar(12) | Pincode / PO box', 'latitude numeric(9,6) | Location', 'longitude numeric(9,6) | Location',
   'phone varchar(20) | Phone', 'email varchar(254) | Email']),
 'zones': ('masterdata', 'bellomassi_dispatch_zones', 'Delivery zones per hub', True, [
   'id bigserial PK | Key', 'code varchar(12) UQ NN | Zone code', 'name varchar(80) NN | Name (unique per hub)', 'hub_id bigint FK:hubs NN | Hub', 'status varchar(20) NN | Active / Inactive']),
 'zone_postal_codes': ('masterdata', 'bellomassi_dispatch_zones.pincodes', 'Pincodes of a zone', False, [
   'id bigserial PK | Key', 'zone_id bigint FK:zones NN | Zone', 'postal_code varchar(12) NN IDX | Pincode']),
 'customers': ('masterdata', 'bellomassi_customers', 'Customer accounts', True, [
   'id bigserial PK | Key', 'code varchar(20) UQ NN | Customer code', 'name varchar(160) NN | Name', 'customer_type varchar(30) NN | Type', 'status varchar(20) NN | Active / Inactive / Blocked',
   'contact_person varchar(120) | Contact', 'mobile varchar(20) NN | Mobile', 'email varchar(254) | Email', 'tax_number varchar(20) | GSTIN / TRN', 'pan varchar(10) | PAN (India)',
   'hub_id bigint FK:hubs NN | Fulfilment hub', 'zone_id bigint FK:zones | Zone', 'sales_rep_id bigint FK:users | Salesman', 'is_vip boolean NN | VIP',
   'credit_enabled boolean NN | Credit allowed', 'credit_limit numeric(14,2) NN | Limit', 'credit_balance numeric(14,2) NN | Outstanding (from ERP in production)', 'credit_days smallint | Terms',
   'sap_customer_no varchar(20) UQ | SAP key (stage 2)']),
 'customer_locations': ('masterdata', 'bellomassi_customers.address*', 'Delivery locations of a customer', True, [
   'id bigserial PK | Key', 'customer_id bigint FK:customers NN | Customer', 'label varchar(60) | e.g. Main store', 'address_line1 varchar(200) NN | Address', 'address_line2 varchar(200) | Address', 'city varchar(80) NN | City',
   'state varchar(80) | State', 'postal_code varchar(12) | Pincode', 'latitude numeric(9,6) | Geocode', 'longitude numeric(9,6) | Geocode', 'is_default boolean NN | Default location', 'delivery_instructions text | Notes']),
 'product_categories': ('masterdata', 'bellomassi_products.category', 'Product categories', False, [
   'id bigserial PK | Key', 'name varchar(80) UQ NN | Category']),
 'products': ('masterdata', 'bellomassi_products', 'Item catalogue', True, [
   'id bigserial PK | Key', 'code varchar(20) UQ NN | Product code', 'sku varchar(40) UQ | SKU', 'barcode varchar(14) UQ | EAN / UPC', 'name varchar(160) NN | Name', 'brand varchar(80) | Brand',
   'category_id bigint FK:product_categories | Category', 'unit varchar(10) NN | Unit (ctn, kg …)', 'unit_price numeric(12,2) NN | Price', 'tax_percent numeric(5,2) NN | Tax %', 'max_discount_percent numeric(5,2) | Discount cap',
   'storage_condition varchar(10) NN | Frozen / Chilled / Ambient', 'track_inventory boolean NN | Stock tracked', 'allow_negative_stock boolean NN | Negative allowed', 'batch_controlled boolean NN | Batch required for scrap',
   'status varchar(20) NN | Active / Inactive / Discontinued', 'sap_material_no varchar(40) UQ | SAP key (stage 2)']),
 'suppliers': ('masterdata', 'bellomassi_forecast_settings.suppliers', 'Suppliers', True, [
   'id bigserial PK | Key', 'name varchar(160) NN | Name', 'contact_person varchar(120) | Contact', 'phone varchar(20) | Phone', 'email varchar(254) | Email', 'lead_time_days smallint | Lead time']),
 'orders': ('orders', 'bellomassi_orders', 'Sales orders', True, [
   'id bigserial PK | Key', 'order_number varchar(30) UQ NN | BM-ORD-…', 'customer_id bigint FK:customers NN IDX | Customer', 'salesman_id bigint FK:users NN IDX | Salesman', 'hub_id bigint FK:hubs NN | Hub',
   'delivery_location_id bigint FK:customer_locations | Delivery location', 'order_type varchar(20) NN | Type', 'priority varchar(10) NN | Low / Normal / High / Urgent', 'payment_terms varchar(20) NN | Credit / COD',
   'source_channel varchar(20) NN | call / email / whatsapp / customer_app', 'order_date date NN | Order date', 'requested_delivery_date date NN IDX | Requested date', 'requested_delivery_time time | Requested time',
   'status varchar(30) NN IDX | DRAFT … RETURNED_TO_HUB', 'approval_status varchar(20) NN | PENDING / APPROVED …', 'consolidation_status varchar(20) NN | NOT_STARTED / PENDING / COMPLETED',
   'subtotal numeric(14,2) NN | Subtotal', 'discount_amount numeric(14,2) NN | Discount', 'tax_amount numeric(14,2) NN | Tax', 'total_amount numeric(14,2) NN | Total',
   'credit_warning boolean NN | Credit flag', 'stock_warning boolean NN | Stock flag', 'customer_reference varchar(40) | PO ref', 'remarks text | Remarks', 'submitted_at timestamptz | Submitted', 'version integer NN | Optimistic lock']),
 'order_items': ('orders', 'bellomassi_orders.items', 'Order lines', False, [
   'id bigserial PK | Key', 'order_id bigint FK:orders NN IDX | Order', 'product_id bigint FK:products NN | Product', 'quantity numeric(12,3) NN | Ordered qty', 'approved_quantity numeric(12,3) | Approved qty (G-01, to confirm)',
   'unit_price numeric(12,2) NN | Price', 'discount_percent numeric(5,2) NN | Discount', 'tax_percent numeric(5,2) NN | Tax', 'line_total numeric(14,2) NN | Total']),
 'order_approvals': ('orders', 'bellomassi_approvals', 'Approval decisions', False, [
   'id bigserial PK | Key', 'order_id bigint FK:orders NN IDX | Order', 'decision varchar(10) NN | APPROVED / RETURNED / REJECTED', 'reason varchar(60) | Reason code', 'remarks text | Remarks',
   'decided_by_id bigint FK:users NN | Sales Manager', 'decided_at timestamptz NN | Time', 'order_total numeric(14,2) NN | Total at decision', 'credit_warning boolean NN | Flag', 'stock_warning boolean NN | Flag']),
 'consolidations': ('orders', 'bellomassi_consolidations', 'Customer Service verification', False, [
   'id bigserial PK | Key', 'order_id bigint FK:orders UQ NN | Order', 'checks jsonb NN | Five checks', 'notes text | Notes', 'consolidated_by_id bigint FK:users NN | User', 'consolidated_at timestamptz NN | Time', 'ready_at timestamptz | Released']),
 'order_events': ('orders', 'bellomassi_order_timeline', 'Order timeline', False, [
   'id bigserial PK | Key', 'order_id bigint FK:orders NN IDX | Order', 'event_type varchar(40) NN | Event', 'from_status varchar(30) | Before', 'to_status varchar(30) | After', 'actor_id bigint FK:users | User', 'occurred_at timestamptz NN | Time', 'details jsonb | Payload']),
 'drivers': ('logistics', 'bellomassi_drivers', 'Drivers', True, [
   'id bigserial PK | Key', 'code varchar(12) UQ NN | Driver code', 'full_name varchar(120) NN | Name', 'mobile varchar(20) UQ NN | Mobile', 'employee_no varchar(30) UQ | Employee no.', 'licence_no varchar(30) UQ NN | Licence',
   'licence_expiry date NN | Expiry', 'hub_id bigint FK:hubs NN | Hub', 'zone_id bigint FK:zones | Zone', 'default_vehicle_id bigint FK:vehicles | Vehicle', 'status varchar(20) NN | Active / Inactive', 'availability varchar(20) NN | Available / Assigned / On Delivery / Offline']),
 'vehicles': ('logistics', 'bellomassi_vehicles', 'Vehicles', True, [
   'id bigserial PK | Key', 'registration_no varchar(20) UQ NN | Plate', 'vehicle_type varchar(30) NN | Type', 'capacity numeric(10,2) NN | Capacity', 'capacity_unit varchar(10) NN | kg / ctn / pallets', 'hub_id bigint FK:hubs NN | Hub',
   'category varchar(20) | Category', 'fuel_type varchar(20) | Fuel', 'ownership varchar(20) | Owned / leased', 'status varchar(20) NN | Available / Maintenance / Inactive …']),
 'dispatches': ('logistics', 'bellomassi_dispatches', 'Vehicle runs', False, [
   'id bigserial PK | Key', 'dispatch_number varchar(30) UQ NN | BM-DSP-…', 'hub_id bigint FK:hubs NN | Hub', 'zone_id bigint FK:zones | Zone', 'dispatch_date date NN IDX | Date', 'driver_id bigint FK:drivers IDX | Driver',
   'vehicle_id bigint FK:vehicles | Vehicle', 'status varchar(30) NN IDX | DRAFT … CANCELLED', 'stock_deducted boolean NN | Once flag', 'stock_reversed boolean NN | Once flag', 'confirmed_at timestamptz | Confirmed', 'confirmed_by_id bigint FK:users | Dispatcher',
   'cancel_reason varchar(60) | Reason', 'cancel_remarks text | Remarks', 'total_load numeric(12,2) | Load', 'notes text | Notes', 'version integer NN | Optimistic lock']),
 'dispatch_stops': ('logistics', 'bellomassi_dispatches.orderIds/sequence', 'Orders on a dispatch in sequence', False, [
   'id bigserial PK | Key', 'dispatch_id bigint FK:dispatches NN | Dispatch', 'order_id bigint FK:orders NN | Order', 'sequence smallint NN | Stop no.', 'is_locked boolean NN | Fixed position']),
 'deliveries': ('logistics', 'bellomassi_deliveries', 'One delivery per order per dispatch', False, [
   'id bigserial PK | Key', 'delivery_number varchar(30) UQ NN | Number', 'dispatch_id bigint FK:dispatches NN IDX | Dispatch', 'order_id bigint FK:orders NN IDX | Order', 'driver_id bigint FK:drivers NN IDX | Driver',
   'sequence smallint NN | Stop', 'status varchar(30) NN IDX | DISPATCHED … CANCELLED', 'started_at timestamptz | Start', 'arrived_at timestamptz | Arrival', 'arrived_lat numeric(9,6) | Arrival location', 'arrived_lng numeric(9,6) | Arrival location',
   'completed_at timestamptz | Completion', 'failed_at timestamptz | Failure', 'failure_reason varchar(60) | Reason', 'failure_remarks text | Remarks', 'received_by varchar(120) | Receiver',
   'review_status varchar(20) | PENDING / REVIEWED', 'reviewed_by_id bigint FK:users | Dispatcher', 'review_remarks text | Remarks', 'returned_to_hub boolean NN | Once flag']),
 'delivery_items': ('logistics', 'bellomassi_deliveries.items', 'Delivered quantities per line', False, [
   'id bigserial PK | Key', 'delivery_id bigint FK:deliveries NN | Delivery', 'order_item_id bigint FK:order_items NN | Line', 'dispatched_qty numeric(12,3) NN | Dispatched', 'delivered_qty numeric(12,3) | Delivered',
   'damaged_qty numeric(12,3) | Damaged', 'rejected_qty numeric(12,3) | Rejected', 'short_reason varchar(60) | Reason']),
 'delivery_otps': ('logistics', 'bellomassi_delivery_otps', 'Delivery OTPs', False, [
   'id bigserial PK | Key', 'delivery_id bigint FK:deliveries NN IDX | Delivery', 'otp_hash varchar(128) NN | Hashed code (never plain)', 'status varchar(20) NN | ACTIVE / VERIFIED / EXPIRED / INVALIDATED / LOCKED',
   'attempts smallint NN | Wrong attempts', 'expires_at timestamptz NN | Expiry', 'sent_channel varchar(20) | sms / whatsapp', 'verified_at timestamptz | Verified']),
 'proofs_of_delivery': ('logistics', 'bellomassi_delivery_pod', 'POD evidence', False, [
   'id bigserial PK | Key', 'delivery_id bigint FK:deliveries UQ NN | Delivery', 'signature_object_key varchar(300) | Object storage key', 'photo_object_key varchar(300) | Object storage key', 'customer_remarks varchar(300) | Remarks', 'captured_at timestamptz NN | Time']),
 'delivery_notes': ('logistics', 'bellomassi_delivery_notes', 'Delivery notes', False, [
   'id bigserial PK | Key', 'note_number varchar(30) UQ NN | BM-DN-YYYY-NNNNN', 'delivery_id bigint FK:deliveries UQ NN | Delivery', 'order_id bigint FK:orders NN | Order', 'delivery_date date NN | Date', 'pdf_object_key varchar(300) | PDF', 'sent_at timestamptz | Sent to customer']),
 'tracking_sessions': ('logistics', 'bellomassi_driver_tracking', 'GPS tracking per delivery', False, [
   'id bigserial PK | Key', 'delivery_id bigint FK:deliveries NN | Delivery', 'driver_id bigint FK:drivers NN | Driver', 'started_at timestamptz NN | Start', 'ended_at timestamptz | End', 'last_lat numeric(9,6) | Last position', 'last_lng numeric(9,6) | Last position', 'last_seen_at timestamptz | Last update']),
 'location_points': ('logistics', '(not stored in prototype)', 'GPS points (partitioned by month)', False, [
   'id bigserial PK | Key', 'session_id bigint FK:tracking_sessions NN IDX | Session', 'recorded_at timestamptz NN IDX | Device time', 'lat numeric(9,6) NN | Latitude', 'lng numeric(9,6) NN | Longitude', 'accuracy_m numeric(6,1) | Accuracy', 'speed_kmh numeric(5,1) | Speed', 'heading smallint | Heading']),
 'stock_items': ('inventory', 'bellomassi_inventory', 'Stock per product per hub', False, [
   'id bigserial PK | Key', 'hub_id bigint FK:hubs NN | Hub', 'product_id bigint FK:products NN | Product', 'total_qty numeric(12,3) NN | On hand', 'reserved_qty numeric(12,3) NN | Reserved', 'damaged_qty numeric(12,3) NN | Damaged',
   'min_level numeric(12,3) | Minimum', 'reorder_level numeric(12,3) | Reorder', 'max_level numeric(12,3) | Maximum', 'version integer NN | Optimistic lock']),
 'stock_movements': ('inventory', 'bellomassi_stock_movements', 'Movement ledger', False, [
   'id bigserial PK | Key', 'hub_id bigint FK:hubs NN IDX | Hub', 'product_id bigint FK:products NN IDX | Product', 'movement_type varchar(40) NN | Receipt, Transfer In/Out, Adjustment, Damage, Lost, Dispatch, Reversal, Delivery Return, Scrap Write-off',
   'quantity numeric(12,3) NN | Signed qty', 'balance_after numeric(12,3) | Balance', 'reference_type varchar(30) | Source doc type', 'reference_id bigint | Source doc', 'occurred_at timestamptz NN IDX | Time']),
 'stock_receipts': ('inventory', 'bellomassi_stock_receipts', 'Goods receipts', False, [
   'id bigserial PK | Key', 'receipt_number varchar(30) UQ NN | GRN-…', 'hub_id bigint FK:hubs NN | Hub', 'product_id bigint FK:products NN | Product', 'quantity numeric(12,3) NN | Qty', 'receipt_date date NN | Date', 'reference varchar(40) | Supplier doc / RPL no.', 'replenishment_id bigint FK:replenishment_requests | Request']),
 'stock_transfers': ('inventory', 'bellomassi_stock_transfers', 'Inter-hub transfers', False, [
   'id bigserial PK | Key', 'transfer_number varchar(30) UQ NN | TRF-…', 'from_hub_id bigint FK:hubs NN | Source', 'to_hub_id bigint FK:hubs NN | Destination', 'product_id bigint FK:products NN | Product', 'quantity numeric(12,3) NN | Qty', 'status varchar(20) NN | Draft / Completed / Cancelled', 'transfer_date date NN | Date']),
 'stock_adjustments': ('inventory', 'bellomassi_stock_adjustments', 'Stock adjustments', False, [
   'id bigserial PK | Key', 'adjustment_number varchar(30) UQ NN | ADJ-…', 'hub_id bigint FK:hubs NN | Hub', 'product_id bigint FK:products NN | Product', 'adjustment_type varchar(20) NN | Increase / Decrease / Damaged / Lost / Correction', 'quantity numeric(12,3) NN | Qty', 'reason varchar(60) NN | Reason', 'notes text | Notes']),
 'scrap_requests': ('inventory', 'bellomassi_scrap_requests', 'Scrap requests', False, [
   'id bigserial PK | Key', 'request_number varchar(30) UQ NN | SCR-…', 'hub_id bigint FK:hubs NN | Hub', 'product_id bigint FK:products NN | Product', 'stock_source varchar(20) NN | available / damaged', 'quantity numeric(12,3) NN | Qty',
   'reason varchar(40) NN | Reason', 'batch_no varchar(40) | Batch', 'photo_object_key varchar(300) | Evidence', 'status varchar(20) NN | DRAFT … CANCELLED', 'requested_by_id bigint FK:users NN | Requester', 'approved_by_id bigint FK:users | Approver (≠ requester)', 'rejection_reason text | Reason', 'written_off_at timestamptz | Write-off']),
 'replenishment_requests': ('inventory', 'bellomassi_replenishment_drafts', 'Purchase requests', False, [
   'id bigserial PK | Key', 'request_number varchar(30) UQ NN | RPL-…', 'supplier_id bigint FK:suppliers NN | Supplier', 'hub_id bigint FK:hubs NN | Hub', 'status varchar(20) NN | DRAFT … RECEIVED', 'lines jsonb NN | Products and quantities', 'decided_by_id bigint FK:users | Administrator', 'rejection_reason text | Reason']),
 'document_types': ('documents', 'bellomassi_document_types', 'Document types', False, [
   'id bigserial PK | Key', 'code varchar(30) UQ NN | e.g. VEH_RC', 'name varchar(80) NN | Name', 'entity varchar(20) NN | vehicle / driver / customer …', 'fields jsonb NN | Fields to capture', 'expiry_required boolean NN | Expiry', 'warning_days smallint | Warning', 'ocr_enabled boolean NN | OCR', 'verification_required boolean NN | Review', 'is_builtin boolean NN | Locked code']),
 'documents': ('documents', 'bellomassi_documents', 'Stored documents', True, [
   'id bigserial PK | Key', 'document_type_id bigint FK:document_types NN | Type', 'entity_type varchar(20) NN | Entity', 'entity_id bigint NN IDX | Record', 'object_key varchar(300) NN | File in object storage', 'file_name varchar(200) NN | Name',
   'mime_type varchar(80) NN | MIME', 'size_bytes integer NN | Size', 'sha256 char(64) NN | Checksum', 'document_number varchar(60) | Number', 'issue_date date | Issued', 'expiry_date date IDX | Expiry', 'fields jsonb | Verified fields',
   'status varchar(20) NN | PENDING_OCR … REJECTED', 'reviewed_by_id bigint FK:users | Reviewer', 'rejection_reason text | Reason', 'virus_scan_status varchar(20) NN | pending / clean / infected']),
 'ocr_results': ('documents', 'bellomassi_ocr_results', 'OCR extraction results', False, [
   'id bigserial PK | Key', 'document_id bigint FK:documents NN | Document', 'provider varchar(20) NN | Engine', 'raw_fields jsonb NN | Extracted (original)', 'confidence numeric(4,3) | Confidence', 'processed_at timestamptz NN | Time']),
 'invoice_templates': ('billing', 'bellomassi_invoice_templates', 'Invoice templates', True, [
   'id bigserial PK | Key', 'code varchar(30) UQ NN | Code', 'name varchar(80) NN | Name', 'layout jsonb NN | Page, fonts, colours, sections', 'is_default boolean NN | Default', 'status varchar(20) NN | Active / Inactive']),
 'invoices': ('billing', 'bellomassi_invoices', 'Customer invoices (scope to confirm)', False, [
   'id bigserial PK | Key', 'invoice_number varchar(30) UQ NN | BM-INV-YYYY-NNNNN', 'order_id bigint FK:orders NN IDX | Order', 'customer_id bigint FK:customers NN | Customer', 'template_id bigint FK:invoice_templates NN | Template',
   'quantity_basis varchar(10) NN | ORDERED / DELIVERED', 'invoice_date date NN | Date', 'due_date date | Due', 'grand_total numeric(14,2) NN | Total', 'snapshot jsonb NN | Frozen order / customer / lines', 'status varchar(20) NN | ISSUED / CANCELLED', 'cancel_reason text | Reason']),
 'notifications': ('comms', 'bellomassi_notifications', 'In-app notifications', False, [
   'id bigserial PK | Key', 'recipient_user_id bigint FK:users IDX | User target', 'recipient_role varchar(40) IDX | Role target', 'category varchar(30) NN | Category', 'title varchar(160) NN | Title', 'message text | Text', 'link varchar(300) | Deep link', 'read_at timestamptz | Read']),
 'message_templates': ('comms', 'bellomassi_email_templates / whatsapp_templates', 'Email / WhatsApp / SMS templates', True, [
   'id bigserial PK | Key', 'channel varchar(10) NN | email / whatsapp / sms', 'code varchar(40) UQ NN | Code', 'subject varchar(200) | Email subject', 'body text NN | Body with variables', 'provider_template_id varchar(80) | WhatsApp approved template']),
 'messages': ('comms', 'bellomassi_email_history / whatsapp_messages', 'Outbound messages', False, [
   'id bigserial PK | Key', 'channel varchar(10) NN | Channel', 'to_address varchar(254) NN | Recipient', 'subject varchar(200) | Subject', 'body text | Body', 'status varchar(20) NN | QUEUED … FAILED', 'provider_message_id varchar(120) | Provider id', 'related_type varchar(30) | Record type', 'related_id bigint | Record', 'error text | Error']),
 'automation_rules': ('comms', 'bellomassi_notification_templates', 'Event rules', False, [
   'id bigserial PK | Key', 'event varchar(40) UQ NN | e.g. DELIVERY_COMPLETED', 'enabled boolean NN | On / off', 'channel varchar(10) NN | email / whatsapp / both', 'recipient_rule varchar(30) NN | Customer / salesman / operations / owner', 'email_template_id bigint FK:message_templates | Template', 'whatsapp_template_id bigint FK:message_templates | Template']),
 'call_logs': ('comms', 'bellomassi_call_history', 'Call history', True, [
   'id bigserial PK | Key', 'customer_id bigint FK:customers NN | Customer', 'user_id bigint FK:users NN | Caller', 'direction varchar(10) NN | Incoming / Outgoing', 'status varchar(20) NN | Connected …', 'outcome varchar(30) NN | Outcome', 'duration_sec integer | Duration', 'notes text | Notes', 'follow_up_date date | Follow-up', 'follow_up_done_at timestamptz | Done', 'order_id bigint FK:orders | Linked order']),
 'settings': ('core', 'bellomassi_settings', 'Application settings', False, [
   'id bigserial PK | Key', 'section varchar(40) NN | Section', 'key varchar(80) NN | Key', 'value jsonb NN | Value']),
 'sequences': ('core', 'bellomassi_order_sequence / dispatch_sequence …', 'Document number sequences', False, [
   'id bigserial PK | Key', 'name varchar(40) UQ NN | Sequence name', 'prefix varchar(20) NN | Prefix', 'year smallint | Year', 'next_value integer NN | Next']),
 'audit_logs': ('core', 'bellomassi_audit_logs', 'Audit trail (append-only)', False, [
   'id bigserial PK | Key', 'actor_id bigint FK:users | User', 'action varchar(60) NN IDX | Action', 'entity_type varchar(40) NN | Entity', 'entity_id varchar(40) | Record', 'before jsonb | Before', 'after jsonb | After', 'ip_address inet | IP', 'occurred_at timestamptz NN IDX | Time']),
}


def columns(name):
    app, key, desc, soft, cols = T[name]
    out = []
    for c in cols + AUDIT + (SOFT if soft else []):
        spec, d = [x.strip() for x in c.split('|')]
        p = spec.split(); col, typ = p[0], p[1]; flags = p[2:]
        fk = next((f.split(':')[1] for f in flags if f.startswith('FK:')), '')
        out.append(dict(name=col, type=typ, pk='PK' in flags, fk=fk, unique='UQ' in flags, notnull='NN' in flags or 'PK' in flags, index='IDX' in flags or bool(fk), desc=d))
    return out
