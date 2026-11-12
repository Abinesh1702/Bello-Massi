"""UI/UX generated docs: screenshots copy, UX-003 sitemap, UX-004 screen inventory (xlsx), UX-005 screen specs, UX-006 gallery."""
import json, os, shutil, glob
import xlsxlib
from gen_req import write, fm
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(H)
INV = json.load(open(os.path.join(H, 'data', 'inv.json')))
META = json.load(open(os.path.join(H, 'shots', '_meta.json')))
LOG = {l.split('\t')[0]: l.split('\t') for l in open(os.path.join(H, 'shots', '_log.tsv')).read().splitlines() if '\t' in l}
for f in ():
    d = os.path.join(ROOT, f, 'screenshots'); os.makedirs(d, exist_ok=True)
    for p in glob.glob(os.path.join(H, 'shots', '*.png')): shutil.copy(p, d)
PERM = INV['permissions']; RM = INV['roleMeta']
ROLES = ['SUPER_ADMIN', 'ADMIN', 'SALESMAN', 'SALES_MANAGER', 'CUSTOMER_SERVICE', 'DISPATCHER', 'DRIVER', 'FINANCE', 'WAREHOUSE_MANAGER', 'INVENTORY_EXECUTIVE', 'QA_MANAGER', 'CUSTOMER', 'SUPPLIER']
def roles_for(p):
    if not p: return ['all signed-in roles']
    return [r for r in ROLES if r == 'SUPER_ADMIN' or any(r in PERM.get(k.strip(), []) for k in str(p).split(','))]
def layout(n):
    if n.get('public'): return 'Public (no sign-in)'
    p = n['path']
    return 'Driver app (mobile)' if p.startswith('/driver') else 'Customer app (mobile)' if p.startswith('/customer/') else 'Office web app'
route2shot = {v[2]: k for k, v in LOG.items() if len(v) > 4 and v[4] == 'ok'}
def shot_for(path):
    for r, k in route2shot.items():
        if r == path: return k
        a, b = r.split('/'), path.split('/')
        if len(a) == len(b) and all(x == y or y.startswith(':') for x, y in zip(a, b)): return k
    return ''
nav = [n for n in INV['nav'] if not n.get('redirectTo')]
rows = []
for i, n in enumerate(nav, 1):
    rows.append([f'SCR-{i:03d}', n['group']['label'] if n.get('group') else '', n['label'], n['path'], n.get('page', ''), layout(n),
                 'Detail / sub-screen' if n.get('hidden') else 'Menu item', n.get('permission') or ('(public)' if n.get('public') else '(signed in)'),
                 ', '.join(roles_for(n.get('permission'))) if not n.get('public') else 'Anyone', n.get('description', ''),
                 ('screenshots/' + shot_for(n['path']) + '.png') if shot_for(n['path']) else '', 'VERIFIED (route exists in navigation.js)'])
SCR_ID = {r[3]: r[0] for r in rows}
xlsxlib.write_book(dict(id='BM-UX-004', title='Screen Inventory', folder='12', file='BM-UX-004_Screen_Inventory', category='UI/UX and Design',
    purpose='Complete list of screens (routes) of the prototype with access rules and links to real screenshots.',
    scope=f'{len(rows)} route entries from src/config/navigation.js; {len(route2shot)} screens captured as screenshots on 2026-11-12.',
    related=['BM-UX-003', 'BM-UX-005', 'BM-SEC-005'], references=['src/config/navigation.js', 'src/config/permissions.js']), [
    dict(name='Screens', headers=['Screen ID', 'Module / menu group', 'Screen', 'Route', 'Page component key', 'Application', 'Type', 'Permission', 'Roles with access (default)', 'Description', 'Screenshot', 'Label'],
         rows=rows, widths=[10, 22, 28, 34, 22, 20, 16, 26, 40, 50, 30, 30], label_col=11)])
# ---------- UX-003 sitemap
groups = {}
for n in nav:
    if n.get('public'): g = 'Public pages'
    else: g = n['group']['label'] if n.get('group') else 'General'
    groups.setdefault((layout(n) if not n.get('public') else 'Public (no sign-in)', g), []).append(n)
t = fm(id='BM-UX-003', title='Information Architecture, Navigation and Sitemap', folder='12', file='BM-UX-003_Navigation_and_Sitemap', category='UI/UX and Design', owner='UX Designer',
       related=['BM-UX-004', 'BM-UX-001', 'BM-SEC-005'], purpose='Show how the screens are organised into applications, menu groups and sub-screens.',
       scope='All routes in src/config/navigation.js (VERIFIED). Menu visibility depends on the signed-in role.', references=['src/config/navigation.js', 'src/components/layout/SidebarNav.jsx'])
t += '''## 1. Applications

| Application | Entry | Layout | Users |
|---|---|---|---|
| Office web app | `/login` → role landing page | Sidebar + header (AppLayout) | All office roles |
| Driver app | `/driver/login` → `/driver/dashboard` | Mobile layout with bottom navigation (DriverLayout) | Driver |
| Customer app | `/customer/login` → `/customer/dashboard` | Mobile layout with bottom navigation (CustomerLayout) | Customer |

All three are the same React single-page application; the role decides which layout and menus are shown. The menu shows
only items the role has permission for; detail screens (marked "sub") are reached from list pages.

## 2. Navigation patterns (VERIFIED)

- **Sidebar** (office): grouped, collapsible menu groups; collapsible sidebar; mobile drawer below 1024 px.
- **Header**: breadcrumbs, global search (pages, customers, orders — Ctrl K), theme toggle, notification centre, profile menu, DEMO PROTOTYPE badge.
- **Bottom navigation** (driver: Today, Deliveries, Route, Completed, Profile; customer: Home, Catalog, Cart, Orders, Account).
- **Role landing page**: each role opens on its configured landing page after sign-in.

## 3. Sitemap
'''
for (app, g), items in sorted(groups.items()):
    t += f'\n### {app} — {g}\n\n| Screen ID | Screen | Route | Type |\n|---|---|---|---|\n'
    for n in items:
        t += f"| {SCR_ID[n['path']]} | {n['label']} | `{n['path']}` | {'sub' if n.get('hidden') else 'menu'} |\n"
write('12', 'UX-003.md', t)
# ---------- UX-005 screen specifications for captured screens
ORDER = list(META)
navby = {}
for n in nav: navby.setdefault(n['path'], n)
t = fm(id='BM-UX-005', title='Screen Specifications', folder='12', file='BM-UX-005_Screen_Specifications', category='UI/UX and Design', owner='UX Designer',
       related=['BM-UX-004', 'BM-UX-006', 'BM-FRD-ORD', 'BM-SEC-005'], purpose='Specify the key screens: purpose, users, access, layout content, fields, actions and states, each with a real screenshot.',
       scope=f'{len(ORDER)} key screens captured from the running prototype (build of 2026-11-12, demo seed data). Remaining screens are listed in BM-UX-004.',
       references=['Screenshots captured with Playwright from `vite preview` of the prototype', 'src/config/navigation.js'])
t += '''## 1. How to read this document

Content lists (headings, fields, buttons, table columns) were read from the rendered screen at capture time, so they reflect
the prototype as built (VERIFIED for the demo data shown). Field names followed by `*` are mandatory in the form. The
screenshots show demo data only. Behaviour behind buttons is specified in the FRDs ({{ref:BM-SYS-003}}).

Common states for every list screen: loading, empty state with call to action, filtered-empty, error boundary. Common
states for forms: validation messages under fields, disabled submit while saving, toast on success / error.
'''
for k in ORDER:
    lg = LOG.get(k); m = META[k]
    if not lg: continue
    route = lg[2]
    n = next((navby[p] for p in navby if p == route), None)
    if not n:
        for p, x in navby.items():
            a, b = p.split('/'), route.split('/')
            if len(a) == len(b) and all(y == z or y.startswith(':') for y, z in zip(a, b)): n = x; break
    n = n or {}
    title = (m['h1'] or [n.get('label', k)])[0]
    t += f"\n## {k} — {n.get('label', title)}\n\n"
    t += '| Item | Value |\n|---|---|\n'
    t += f"| Screen ID | {SCR_ID.get(n.get('path'), '—')} |\n| Route | `{n.get('path', route)}` (captured: `{route}`) |\n| Application | {layout(n) if n else ''} |\n"
    t += f"| Permission | {n.get('permission') or '(signed in)'} |\n| Captured as role | {lg[1]} |\n| Roles with access | {', '.join(roles_for(n.get('permission')))} |\n"
    t += f"| Purpose | {n.get('description') or title} |\n| Page heading | {', '.join(m['h1']) or '—'} |\n"
    if m['h2']: t += f"| Sections | {'; '.join(m['h2'][:18])} |\n"
    if m['labels']: t += f"| Fields / filters | {'; '.join(m['labels'][:30])} |\n"
    if m['th']: t += f"| Table columns | {'; '.join(m['th'][:20])} |\n"
    if m['tabs']: t += f"| Tabs | {'; '.join(m['tabs'])} |\n"
    if m['buttons']: t += f"| Actions | {'; '.join(b for b in m['buttons'][:25])} |\n"
    mob = 'Mobile' in layout(n) or k.startswith(('UX-DRV', 'UX-CUS'))
    rt = n.get('path', route)
    if 'LOGIN' in k: ty = 'sign-in'
    elif rt.endswith(('/create', '/edit')) or any(b in m['buttons'] for b in ('Submit for approval', 'Save', 'Save draft', 'Create', 'Place order')): ty = 'form'
    elif rt in ('/dashboard', '/warehouse', '/quality', '/inventory', '/vms', '/ai', '/communication', '/invoices/dashboard') or rt.endswith('/dashboard'): ty = 'dashboard'
    elif m['th'] or rt.count('/') == 1 or rt.split('/')[-1] in ('list', 'requests', 'stock', 'movements', 'templates'): ty = 'list'
    else: ty = 'detail'
    LAY = {'Office web app': 'Office layout: sidebar, header (breadcrumbs, search, notifications, profile), page header, content cards',
           'Driver app (mobile)': 'Driver layout: navy header with demo badge and notifications, single-column cards, bottom navigation',
           'Customer app (mobile)': 'Customer layout: header, single-column cards, bottom navigation'}
    COMP = {'list': 'PageHeader, FilterToolbar, DataTable (sort, paging), Badge, RowActions, EmptyState', 'form': 'PageHeader, FormSection, Input / Select / Textarea / Checkbox, Button (primary / secondary), ConfirmDialog, toasts',
            'dashboard': 'Period filter, KPI cards, charts (Recharts), queue tables, quick links', 'detail': 'PageHeader with status Badge, InfoList, Tabs / Cards, Timeline, action Buttons, ConfirmDialog',
            'sign-in': 'Logo, Input, password field with show / hide, Checkbox, Button, demo account selector (prototype only)'}
    VAL = {'form': 'Mandatory fields marked *; inline messages under fields; service-level validation re-checked on save (see FRD business rules)', 'sign-in': 'Identifier and password required; e-mail format; lockout after 5 failures',
           'list': 'Filter inputs only', 'dashboard': 'Period filter: valid date range', 'detail': 'Action pre-conditions checked by the service (status, permission, data scope); refusal message shown'}
    t += f"| Screen type | {ty} |\n| Layout | {LAY.get(layout(n), LAY['Office web app']) if n else ''} |\n| Components | {COMP[ty]} |\n| Validation | {VAL[ty]} |\n"
    t += f"| Responsive behaviour | {'Designed for 360–430 px; single column; bottom navigation' if mob else 'Sidebar fixed ≥ 1024 px, drawer below; grids collapse to one column; tables scroll horizontally inside the card'} |\n"
    t += f"| Empty state | {'EmptyState with explanation and call to action' if ty in ('list', 'dashboard') else 'Not found / access denied message for missing record' if ty == 'detail' else 'Blank form with defaults'} |\n"
    t += "| Loading state | Spinner / skeleton while data is read (prototype reads are near-instant from LocalStorage) |\n"
    t += f"| Error state | {'Field errors + error toast; ErrorBoundary for unexpected errors' if ty in ('form', 'sign-in') else 'ErrorBoundary page; action refusals as error toast'} |\n"
    t += f"| Success state | {'Success toast and navigation to the record / landing page' if ty in ('form', 'sign-in') else 'Success toast after actions; badges and timeline update immediately' if ty == 'detail' else 'Data displayed with counts'} |\n"
    w = '8cm' if 'Mobile' in layout(n) or k.startswith(('UX-DRV', 'UX-CUS')) else '16cm'
    t += f"\n![{k} — {n.get('label', title)} (prototype screenshot, demo data)](screenshots/{k}.png){{width={w}}}\n"
write('12', 'UX-005.md', t)
# ---------- UX-006 gallery (PDF-friendly)
t = fm(id='BM-UX-006', title='Prototype Screenshot Gallery', folder='12', file='BM-UX-006_Prototype_Screenshot_Gallery', category='UI/UX and Design', owner='UX Designer', pdf=True,
       related=['BM-UX-005', 'BM-UX-004'], purpose='Visual reference of the prototype screens for client review.',
       scope='Real screenshots captured 2026-11-12 from the prototype build with demo seed data; no mock-ups. Desktop 1440×900, mobile 390×844.',
       references=['shots.cjs capture script in _build'])
t += '## 1. Notes\n\nAll images are actual screenshots of the running prototype (PROTOTYPE). Data shown is demo seed data, not client data. The "DEMO PROTOTYPE" badge and "DEMO GPS" markers are part of the prototype UI.\n'
sec = [('Office web app — administration and master data', ('UX-LOGIN', 'UX-DASH-SA', 'UX-USERS', 'UX-ROLES', 'UX-PERMS', 'UX-AUDIT', 'UX-SETTINGS', 'UX-COMPANY', 'UX-CUSTOMERS', 'UX-CUSTOMER-DETAIL', 'UX-CREDIT', 'UX-PRODUCTS', 'UX-HUBS', 'UX-SUPPLIERS')),
       ('Order to dispatch', ('UX-DASH-SE', 'UX-ORDER-CREATE', 'UX-MY-ORDERS', 'UX-ORDERS', 'UX-ORDER-DETAIL', 'UX-DASH-SM', 'UX-APPROVAL', 'UX-APPROVAL-DETAIL', 'UX-DASH-CS', 'UX-CONSOLIDATION', 'UX-DASH-DP', 'UX-READY', 'UX-PLANNING', 'UX-DISPATCH-LIST', 'UX-DISPATCH-DETAIL', 'UX-DISPATCH-CREATE', 'UX-ZONES', 'UX-DRIVERS', 'UX-VEHICLES')),
       ('Delivery monitoring', ('UX-TRACKING', 'UX-LIVE', 'UX-DELIVERY-REVIEW', 'UX-DN', 'UX-DELIVERY-HISTORY')),
       ('Extensions — inventory, VMS, documents, invoices, communication, AI, reports', ('UX-INVENTORY', 'UX-STOCK', 'UX-MOVEMENTS', 'UX-SCRAP', 'UX-WAREHOUSE', 'UX-QUALITY', 'UX-VMS', 'UX-VMS-EXPIRY', 'UX-DOCUMENTS', 'UX-OCR', 'UX-DASH-FI', 'UX-INVOICE-DASH', 'UX-INVOICES', 'UX-INVOICE-TPL', 'UX-EMAIL', 'UX-WHATSAPP', 'UX-CALLS', 'UX-AI', 'UX-FORECAST', 'UX-REPORTS', 'UX-NOTIFICATIONS')),
       ('Driver app (mobile)', ('UX-DRV-LOGIN', 'UX-DRV-DASH', 'UX-DRV-DELIVERIES', 'UX-DRV-DELIVERY', 'UX-DRV-ROUTE', 'UX-DRV-COMPLETED', 'UX-DRV-NOTES', 'UX-DRV-PROFILE')),
       ('Customer app (mobile)', ('UX-CUS-LOGIN', 'UX-CUS-DASH', 'UX-CUS-CATALOG', 'UX-CUS-CART', 'UX-CUS-ORDERS', 'UX-CUS-ORDER', 'UX-CUS-NOTES', 'UX-CUS-INVOICES', 'UX-CUS-PROFILE'))]
for i, (h, ks) in enumerate(sec, 2):
    t += f'\n## {i}. {h}\n'
    for k in ks:
        if not os.path.exists(os.path.join(H, 'shots', k + '.png')): continue
        lab = (navby.get(LOG[k][2]) or {}).get('label') if k in LOG else None
        lab = lab or (META.get(k, {}).get('h1') or [k])[0] if k in META else ('Sign-in screen' if 'LOGIN' in k else k)
        w = '7cm' if k.startswith(('UX-DRV', 'UX-CUS')) else '16cm'
        t += f'\n![{k} — {lab}](screenshots/{k}.png){{width={w}}}\n'
write('12', 'UX-006.md', t)
print('ux ok', len(rows), len(route2shot))
