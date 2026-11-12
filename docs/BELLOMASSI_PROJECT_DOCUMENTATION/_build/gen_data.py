"""Generate data-design documents (folder 08): prototype data model, production database design with ER diagrams,
data dictionary workbooks."""
import os, json, collections
from data import schema
from gen_req import fm, write
import xlsxlib
HERE = os.path.dirname(os.path.abspath(__file__))
ST = json.load(open(os.path.join(HERE, 'data', 'storage.json')))

AREA = {
 'Session & app': ['app_version', 'demo_users', 'session', 'settings', 'demo_data', 'activities', 'theme', 'notifications', 'notification_preferences', 'auth'],
 'Administration': ['roles', 'permissions', 'audit_logs', 'company', 'organization'],
 'Master data': ['customers', 'products', 'hubs', 'dispatch_zones', 'drivers', 'vehicles'],
 'Orders': ['orders', 'order_sequence', 'approvals', 'consolidations', 'order_timeline'],
 'Dispatch & delivery': ['dispatches', 'dispatch_sequence', 'deliveries', 'delivery_sequence', 'delivery_otps', 'delivery_notes', 'dispatch_timeline', 'driver_tracking', 'delivery_pod'],
 'Inventory': ['inventory', 'stock_receipts', 'stock_transfers', 'stock_adjustments', 'stock_movements', 'scrap_requests'],
 'VMS & documents': ['vms_settings', 'document_types', 'documents', 'ocr_results'],
 'Invoices': ['invoice_templates', 'invoices', 'invoice_settings'],
 'Communication': ['email_templates', 'email_drafts', 'email_history', 'email_inbox', 'email_settings', 'whatsapp_templates', 'whatsapp_messages', 'openwa_settings', 'communication_settings', 'notification_templates', 'notification_history', 'call_history'],
 'AI & planning': ['ai_settings', 'ai_conversations', 'ai_messages', 'ai_insights', 'ai_activity', 'jarvis_settings', 'jarvis_history', 'forecasts', 'forecast_settings', 'inventory_predictions', 'reorder_recommendations', 'ai_models', 'replenishment_drafts', 'sales_history'],
 'Customer app & reports': ['customer_carts', 'report_prefs'],
}
AREA_OF = {f'bellomassi_{k}': a for a, ks in AREA.items() for k in ks}
REL = [
 ('orders', 'customers', 'customerId', 'n:1'), ('orders', 'demo_users', 'salesmanId / createdBy', 'n:1'), ('orders', 'hubs', 'hubId', 'n:1'),
 ('orders.items', 'products', 'productId', 'n:1'), ('approvals', 'orders', 'orderId', 'n:1'), ('consolidations', 'orders', 'orderId', '1:1'),
 ('order_timeline', 'orders', 'orderId', 'n:1'), ('dispatches', 'orders', 'orderIds[]', '1:n'), ('dispatches', 'drivers', 'driverId', 'n:1'),
 ('dispatches', 'vehicles', 'vehicleId', 'n:1'), ('dispatches', 'dispatch_zones', 'zoneId', 'n:1'), ('deliveries', 'dispatches', 'dispatchId', 'n:1'),
 ('deliveries', 'orders', 'orderId', 'n:1'), ('delivery_otps', 'deliveries', 'deliveryId', 'n:1'), ('delivery_notes', 'deliveries', 'deliveryId', '1:1'),
 ('delivery_pod', 'deliveries', 'deliveryId', '1:1'), ('driver_tracking', 'deliveries', 'sessions[].deliveryId', '1:1'), ('customers', 'hubs', 'hubId', 'n:1'),
 ('customers', 'dispatch_zones', 'zoneId', 'n:1'), ('dispatch_zones', 'hubs', 'hubId', 'n:1'), ('drivers', 'demo_users', 'userId', '1:1'),
 ('demo_users', 'customers', 'customerId', 'n:1'), ('inventory', 'products', 'productId', 'n:1'), ('inventory', 'hubs', 'hubId', 'n:1'),
 ('stock_movements', 'inventory', 'hubId + productId', 'n:1'), ('scrap_requests', 'inventory', 'hubId + productId', 'n:1'), ('documents', 'document_types', 'typeId', 'n:1'),
 ('documents', '(any entity)', 'entityType + entityId', 'n:1'), ('ocr_results', 'documents', 'documentId', 'n:1'), ('invoices', 'orders', 'orderId', 'n:1'),
 ('invoices', 'invoice_templates', 'templateId', 'n:1'), ('call_history', 'customers', 'customerId', 'n:1'), ('replenishment_drafts', 'forecast_settings.suppliers', 'supplierId', 'n:1'),
]


def prototype_doc():
    t = ['## 1. Storage approach — VERIFIED\n\n- All data is stored in the browser\'s **LocalStorage** under keys prefixed `bellomassi_` (session optionally in sessionStorage).\n'
         '- `src/services/storageService.js` is the only module that reads or writes storage: JSON parsing with fallbacks, read cache, change subscriptions (`useSyncExternalStore`), cross-tab `storage` events, multi-key **transactions**, data **versioning and migration** (current `APP_DATA_VERSION` = 8), seeding on first load, export / import with validation, reset to demo data and a usage report.\n'
         f'- Seeded demo dataset: **{len(ST)} keys, ≈{sum(v["bytes"] for v in ST.values()) // 1024} KB**. Browser quota is typically ≈5 MB per origin.\n'
         '- Nothing is shared between browsers or users: every device has its own copy of the data.']
    t.append('## 2. Key catalogue\n\n| Key | Area | Shape | Seed records | Size (bytes) | Fields |\n|---|---|---|---|---|---|\n' + '\n'.join(
        f"| `{k}` | {AREA_OF.get(k, 'Other')} | {v['kind']} | {v['count'] if v['count'] is not None else '—'} | {v['bytes']} | {len(v['fields'])} |" for k, v in ST.items()))
    t.append('## 3. Relationships between stored objects\n\nRelationships are held as ID references (no referential integrity in the browser); services check existence when they read.\n\n| From | To | Reference | Cardinality |\n|---|---|---|---|\n' +
             '\n'.join(f'| `{a}` | `{b}` | `{c}` | {d} |' for a, b, c, d in REL))
    t.append('## 4. Main object structures\n\nField lists below come from the seeded data (types inferred). The full list for every key is in {{ref:BM-DAT-007}}.')
    for k in ['bellomassi_orders', 'bellomassi_dispatches', 'bellomassi_deliveries', 'bellomassi_customers', 'bellomassi_products', 'bellomassi_inventory', 'bellomassi_scrap_requests', 'bellomassi_documents', 'bellomassi_invoices', 'bellomassi_demo_users']:
        f = ST[k]['fields']
        t.append(f"### `{k}`\n\n" + ', '.join(f'`{a}` ({b})' for a, b in f.items()))
    t.append('## 5. Mock data\n\nSeed modules in `src/services/seed/` (`demoSeed`, `adminSeed`, `masterDataSeed`, `orderSeed`, `dispatchSeed`, `phase5Seed`, `phase6Seed`, `completionSeed`) create demo users, 20 customers, 30 products, 6 hubs, 8 zones, 8 drivers, 11 vehicles, 41 orders across all statuses, 20 dispatches, 21 deliveries, documents, invoices, messages, forecasts and insights. Dates are generated relative to "today" so the demo always looks current.')
    t.append('## 6. State persistence and update mechanism\n\n| Mechanism | Behaviour |\n|---|---|\n| Write | Services call `setItem` / `transaction`; subscribers re-render |\n| Read | `getItem` with cache; hooks use `useSyncExternalStore` |\n| Cross-tab | `storage` event updates other tabs of the same browser |\n| Session | `bellomassi_session` in localStorage ("Keep me signed in") or sessionStorage |\n| Failure | If storage is blocked the app runs in memory and reports a storage issue; corrupted keys fall back to defaults |')
    t.append('## 7. Data reset behaviour\n\n- **Reset demo data** (Administrator) re-seeds all business keys; AI data has its own reset.\n- Clearing the browser\'s site data deletes everything; the next load seeds fresh demo data.\n- **Export / import**: JSON export of all keys; import validates the payload and version before replacing data.\n- Version upgrade: older snapshots are migrated forward step by step (e.g. v7 → v8 added scrap, calls, tracking, POD, carts, report preferences).')
    t.append('## 8. Prototype limitations\n\n- Single-browser data; no concurrency control between users; no server-side validation.\n- Images (POD, documents) stored as downscaled data URLs — limited by the ≈5 MB quota.\n- No referential integrity, indexes or query language; reports scan arrays in memory.\n- Passwords stored as a demo FNV-1a hash; demo passwords are published.\n- No backups beyond manual export.\n- Not suitable for production data — see {{ref:BM-DAT-002}} and {{ref:BM-DAT-004}}.')
    write('08', 'DAT-001.md', fm(id='BM-DAT-001', title='Current Prototype Data Model (LocalStorage)', folder='08', file='BM-DAT-001_Prototype_Data_Model', category='Database and Data Design', owner='Solution Architect',
          related=['BM-DAT-007', 'BM-DAT-002', 'BM-ARC-002'], purpose='Document exactly how the prototype stores data: keys, objects, relationships, mock data, persistence, reset behaviour and limitations.',
          scope=f'All {len(ST)} LocalStorage keys of data version 8 (VERIFIED by seeding the application in a test harness).') + '\n\n'.join(t) + '\n')
    rows = []
    for k, v in ST.items():
        if v['fields']:
            for f, ty in v['fields'].items(): rows.append([k, AREA_OF.get(k, 'Other'), v['kind'], f, ty])
        else:
            rows.append([k, AREA_OF.get(k, 'Other'), v['kind'], '(value)', v['kind']])
    xlsxlib.write_book(dict(id='BM-DAT-007', title='Prototype Storage Dictionary', folder='08', file='BM-DAT-007_Prototype_Storage_Dictionary', category='Database and Data Design',
        purpose='Field-level dictionary of every LocalStorage key in the prototype (types inferred from seeded data).', scope=f'{len(ST)} keys, {len(rows)} fields.', related=['BM-DAT-001']), [
        dict(name='Keys', headers=['Key', 'Area', 'Shape', 'Seed records', 'Bytes', 'Sample (truncated)'], rows=[[k, AREA_OF.get(k, 'Other'), v['kind'], v['count'], v['bytes'], v['sample'][:300]] for k, v in ST.items()], widths=[34, 20, 9, 10, 10, 90]),
        dict(name='Fields', headers=['Key', 'Area', 'Shape', 'Field', 'Type (inferred)'], rows=rows, widths=[34, 20, 9, 30, 20])])


DOMAINS = {
 'Identity and access': ['users', 'roles', 'permissions', 'role_permissions', 'user_roles'],
 'Master data': ['company', 'hubs', 'zones', 'zone_postal_codes', 'customers', 'customer_locations', 'product_categories', 'products', 'suppliers'],
 'Orders': ['orders', 'order_items', 'order_approvals', 'consolidations', 'order_events'],
 'Logistics': ['drivers', 'vehicles', 'dispatches', 'dispatch_stops', 'deliveries', 'delivery_items', 'delivery_otps', 'proofs_of_delivery', 'delivery_notes', 'tracking_sessions', 'location_points'],
 'Inventory': ['stock_items', 'stock_movements', 'stock_receipts', 'stock_transfers', 'stock_adjustments', 'scrap_requests', 'replenishment_requests'],
 'Documents and billing': ['document_types', 'documents', 'ocr_results', 'invoice_templates', 'invoices'],
 'Communication and platform': ['notifications', 'message_templates', 'messages', 'automation_rules', 'call_logs', 'settings', 'sequences', 'audit_logs'],
}


def er(tables):
    lines = ['erDiagram']
    for tb in tables:
        for c in schema.columns(tb):
            if c['fk'] and c['name'] not in ('created_by_id', 'updated_by_id') and (c['fk'] in tables or c['fk'] in ('users', 'customers', 'orders', 'hubs', 'products')):
                lines.append(f'    {c["fk"]} ||--o{{ {tb} : "{c["name"]}"')
    for tb in tables:
        cols = [c for c in schema.columns(tb) if c['pk'] or c['fk'] or c['name'] in ('status', 'code', 'order_number', 'dispatch_number', 'name')][:7]
        lines.append(f'    {tb} {{')
        for c in cols:
            typ = c['type'].split('(')[0]
            k = ' PK' if c['pk'] else (' FK' if c['fk'] else (' UK' if c['unique'] else ''))
            lines.append(f'        {typ} {c["name"]}{k}')
        lines.append('    }')
    return '\n'.join(lines)


def production_doc():
    t = ['## 1. Design principles — PROPOSED\n\n- PostgreSQL 16, Django ORM migrations; surrogate `bigserial` keys; business numbers unique.\n- Every table has audit columns `created_at`, `created_by_id`, `updated_at`, `updated_by_id`.\n- Master data uses **soft delete** (`is_deleted`, `deleted_at`); transactions are never deleted (cancel / status instead).\n- Status columns are `varchar` with CHECK constraints listing the exact prototype status codes.\n- Money `numeric(14,2)`; quantities `numeric(12,3)`; times `timestamptz` (UTC) displayed in the organisation time zone.\n- Optimistic locking (`version`) on orders, dispatches and stock rows; `SELECT … FOR UPDATE` in stock and status transitions.\n- Files in object storage; only keys stored in the database. OTPs stored hashed.\n- GPS points partitioned by month; retention per {{ref:BM-DAT-005}}.',
         f'## 2. Table catalogue\n\n| Domain | Table | Django app | Prototype source | Description | Columns |\n|---|---|---|---|---|---|\n' + '\n'.join(
             f'| {dom} | `{tb}` | {schema.T[tb][0]} | `{schema.T[tb][1]}` | {schema.T[tb][2]} | {len(schema.columns(tb))} |' for dom, tbs in DOMAINS.items() for tb in tbs)]
    for dom, tbs in DOMAINS.items():
        t.append(f'## ER diagram — {dom}\n\n```mermaid\n{er(tbs)}\n```')
    t.append('## Column definitions\n\nAll columns with type, keys and constraints are in {{ref:BM-DAT-003}}. Summary of keys per table:\n\n| Table | Primary key | Foreign keys | Unique | Indexed |\n|---|---|---|---|---|\n' + '\n'.join(
        f"| `{tb}` | id | {', '.join(c['name'] + '→' + c['fk'] for c in schema.columns(tb) if c['fk'] and c['name'] not in ('created_by_id', 'updated_by_id')) or '—'} | {', '.join(c['name'] for c in schema.columns(tb) if c['unique']) or '—'} | {', '.join(c['name'] for c in schema.columns(tb) if c['index'] and not c['fk']) or '—'} |" for tb in schema.T))
    t.append('## Constraints and indexes\n\n| Constraint | Definition |\n|---|---|\n| Status checks | `orders.status IN (DRAFT, SUBMITTED, RETURNED, REJECTED, APPROVED, CONSOLIDATED, READY_FOR_DISPATCH, DISPATCHED, OUT_FOR_DELIVERY, PARTIALLY_DELIVERED, DELIVERED, DELIVERY_FAILED, RETURNED_TO_HUB)`; similar for dispatches, deliveries, OTPs, scrap, documents, invoices |\n| One active invoice per order | Partial unique index `invoices(order_id) WHERE status = \'ISSUED\'` |\n| One open scrap per hub+product+source | Partial unique index on `scrap_requests` where status in (DRAFT, PENDING_APPROVAL, APPROVED) |\n| One stock row per hub+product | Unique `(hub_id, product_id)` on `stock_items` |\n| Unique stop | Unique `(dispatch_id, order_id)` and `(dispatch_id, sequence)` on `dispatch_stops` |\n| One active dispatch per order | Partial unique on `dispatch_stops(order_id)` joined to non-cancelled dispatch (enforced in service + trigger) |\n| Zone name per hub | Unique `(hub_id, name)` on `zones` |\n| Non-negative stock | CHECK `total_qty >= 0` unless product allows negative (service-level) |\n| Scrap approver ≠ requester | CHECK `approved_by_id <> requested_by_id` |\n| Frequent queries | Indexes on `orders(status, requested_delivery_date)`, `orders(salesman_id, status)`, `deliveries(driver_id, status)`, `dispatches(dispatch_date, status)`, `stock_movements(hub_id, product_id, occurred_at)`, `documents(expiry_date)`, `audit_logs(occurred_at)` |')
    t.append('## Status fields\n\nExact values: {{ref:BM-GLO-003}}. They are identical to the prototype so that the frontend status metadata can be reused.')
    t.append('## Audit fields and soft delete\n\nAudit columns on every table; `audit_logs` is append-only (no UPDATE / DELETE grants for the application role). Soft delete on: users, roles, hubs, zones, customers, customer_locations, products, suppliers, documents, templates, call logs. Business transactions (orders, dispatches, deliveries, movements, invoices) are never deleted; drafts may be hard-deleted by their owner.')
    t.append('## Data retention and migration\n\nSee {{ref:BM-DAT-005}} and {{ref:BM-DAT-004}}.')
    write('08', 'DAT-002.md', fm(id='BM-DAT-002', title='Proposed Production Database Design', folder='08', file='BM-DAT-002_Production_Database_Design', category='Database and Data Design', owner='Solution Architect', pdf=True,
          related=['BM-DAT-003', 'BM-DAT-001', 'BM-DAT-004', 'BM-DAT-005', 'BM-ARC-002', 'BM-API-001'], purpose='Propose the PostgreSQL schema for the Django backend, derived from the prototype data objects. Nothing in this document exists yet — all content is PROPOSED.',
          scope=f'{len(schema.T)} tables in 7 domains with columns, keys, constraints, indexes, status, audit and soft-delete rules.') + '\n\n'.join(t) + '\n')
    rows = [[dom, tb, schema.T[tb][0], c['name'], c['type'], 'Y' if c['pk'] else '', c['fk'], 'Y' if c['unique'] else '', 'NOT NULL' if c['notnull'] else 'NULL', 'Y' if c['index'] else '', c['desc'], schema.T[tb][1]]
            for dom, tbs in DOMAINS.items() for tb in tbs for c in schema.columns(tb)]
    xlsxlib.write_book(dict(id='BM-DAT-003', title='Data Dictionary (Proposed Production Schema)', folder='08', file='BM-DAT-003_Data_Dictionary', category='Database and Data Design', status='Draft — PROPOSED design, not implemented',
        purpose='Column-level data dictionary of the proposed PostgreSQL schema.', scope=f'{len(schema.T)} tables, {len(rows)} columns.', related=['BM-DAT-002']), [
        dict(name='Tables', headers=['Domain', 'Table', 'Django app', 'Description', 'Prototype source', 'Soft delete', 'Columns'],
             rows=[[dom, tb, schema.T[tb][0], schema.T[tb][2], schema.T[tb][1], 'Y' if schema.T[tb][3] else '', len(schema.columns(tb))] for dom, tbs in DOMAINS.items() for tb in tbs], widths=[24, 24, 12, 40, 40, 10, 9]),
        dict(name='Columns', headers=['Domain', 'Table', 'App', 'Column', 'Type', 'PK', 'FK to', 'Unique', 'Null', 'Indexed', 'Description', 'Prototype source'], rows=rows, widths=[20, 22, 10, 22, 16, 5, 18, 7, 9, 8, 40, 30])])


if __name__ == '__main__':
    prototype_doc(); production_doc(); print('data docs ok')
