"""Role manuals MAN-101..114 (from workflow chapter 04 + screenshots) and MAN-120 role responsibility matrix (xlsx)."""
import os, re, json
import xlsxlib
from gen_req import write, fm
H = os.path.dirname(os.path.abspath(__file__))
CH = open(os.path.join(H, '..', '..', 'workflow', '04-Role-Wise-Workflow.md')).read()
LOGOK = {l.split('\t')[0] for l in open(os.path.join(H, 'shots', '_log.tsv')).read().splitlines() if l.endswith('\tok')}
LOGOK |= {'UX-LOGIN', 'UX-DRV-LOGIN', 'UX-CUS-LOGIN'}
LOGROLE = {l.split('\t')[0]: l.split('\t')[1] for l in open(os.path.join(H, 'shots', '_log.tsv')).read().splitlines() if '\t' in l}
secs = {}
for m in re.finditer(r'^## 4\.(\d+) (.+?)\n(.*?)(?=^## |\Z)', CH, re.S | re.M):
    rows = {}
    for r in re.findall(r'^\| ([^|]+?) \| (.+?) \|$', m.group(3), re.M):
        if r[0] not in ('Topic', '---'): rows[r[0].strip()] = r[1].strip()
    secs[int(m.group(1))] = (m.group(2).strip(), rows)
ROLES = [  # n in ch04, code, manual id, screenshots
 (1, 'SUPER_ADMIN', 'MAN-101', ['UX-DASH-SA', 'UX-USERS', 'UX-ROLES', 'UX-PERMS', 'UX-AUDIT']),
 (2, 'ADMIN', 'MAN-102', ['UX-USERS', 'UX-ROLES', 'UX-SETTINGS', 'UX-COMPANY', 'UX-CUSTOMERS', 'UX-PRODUCTS']),
 (3, 'SALESMAN', 'MAN-103', ['UX-DASH-SE', 'UX-ORDER-CREATE', 'UX-MY-ORDERS', 'UX-CALLS']),
 (4, 'SALES_MANAGER', 'MAN-104', ['UX-DASH-SM', 'UX-APPROVAL', 'UX-APPROVAL-DETAIL', 'UX-CREDIT']),
 (5, 'CUSTOMER_SERVICE', 'MAN-105', ['UX-DASH-CS', 'UX-CONSOLIDATION']),
 (6, 'DISPATCHER', 'MAN-106', ['UX-DASH-DP', 'UX-READY', 'UX-PLANNING', 'UX-DISPATCH-CREATE', 'UX-DISPATCH-DETAIL', 'UX-LIVE', 'UX-DELIVERY-REVIEW']),
 (7, 'DRIVER', 'MAN-107', ['UX-DRV-LOGIN', 'UX-DRV-DASH', 'UX-DRV-DELIVERIES', 'UX-DRV-DELIVERY', 'UX-DRV-ROUTE', 'UX-DRV-COMPLETED']),
 (8, 'FINANCE', 'MAN-108', ['UX-DASH-FI', 'UX-INVOICE-DASH', 'UX-INVOICES']),
 (9, 'WAREHOUSE_MANAGER', 'MAN-109', ['UX-WAREHOUSE', 'UX-STOCK', 'UX-SCRAP']),
 (10, 'INVENTORY_EXECUTIVE', 'MAN-110', ['UX-INVENTORY', 'UX-MOVEMENTS', 'UX-SCRAP']),
 (11, 'QA_MANAGER', 'MAN-111', ['UX-QUALITY', 'UX-DOCUMENTS', 'UX-OCR']),
 (12, 'CUSTOMER', 'MAN-112', ['UX-CUS-LOGIN', 'UX-CUS-DASH', 'UX-CUS-CATALOG', 'UX-CUS-CART', 'UX-CUS-ORDERS']),
 (13, 'SUPPLIER', 'MAN-113', []),
]
CAPROLE = {'superadmin': 'Super Admin', 'salesman': 'Salesman', 'manager': 'Sales Manager', 'cs': 'Customer Service', 'dispatcher': 'Dispatcher', 'finance': 'Finance', 'driver': 'Driver', 'customer': 'Customer'}
def clean(s): return s.replace('**', '')
def steps(s):
    parts = [p.strip() for p in re.split(r'→', clean(s)) if p.strip()]
    return '\n'.join(f'{i}. {p}' for i, p in enumerate(parts, 1)) if len(parts) > 1 else clean(s)
MAN120 = []
for n, code, mid, shots in ROLES:
    name, r = secs[n]
    MAN120.append([code, name, clean(r.get('Purpose', '')), clean(r.get('Data scope', '')), clean(r.get('CRUD', r.get('CRUD / approvals', ''))), clean(r.get('Approvals', '')), clean(r.get('Cannot do', '')), clean(r.get('Next responsible user', ''))])
    fname = f'BM-{mid}_User_Manual_' + re.sub(r'[^A-Za-z]+', '_', name.split('(')[0]).strip('_')
    t = fm(id='BM-' + mid, title=f'Role User Manual — {name}', folder='15', file=fname, category='User Manuals', owner='Training Lead',
           related=['BM-MAN-003', 'BM-MAN-120', 'BM-SEC-005'] + (['BM-MAN-001'] if code == 'DRIVER' else ['BM-MAN-002'] if code == 'CUSTOMER' else []),
           purpose=f'Explain to a {name} user how to sign in, find their screens and do their daily work in the Bellomassi prototype.',
           scope=f'Role {code} with its default permissions (VERIFIED from src/config/permissions.js and navigation.js). An Administrator can change permissions, so menus may differ.',
           references=['Workflow documentation chapter 04 (existing document, reused)', 'BM-UX-005 Screen Specifications'])
    t += f'''## 1. Your role

{clean(r.get('Purpose', ''))}

| Topic | Details |
|---|---|
'''
    for k, v in r.items():
        if k in ('Daily workflow',): continue
        if k == 'Login': v = v + ' (demo account — PROTOTYPE only; production accounts are issued by the Administrator)'
        t += f'| {k} | {v} |\n'
    t += '''
## 2. Getting started

1. Open the application address given by your Administrator.
2. Sign in with your user name (or mobile number / email) and password. After 5 wrong attempts the account is locked for 15 minutes (default security setting; an Administrator can unlock it).
3. You land on your dashboard. Use the menu (sidebar on desktop, bottom bar on phone) to move between screens.
4. Use the bell icon for notifications and the profile menu to change your password, preferences or to sign out.
'''
    dw = r.get('Daily workflow', '')
    t += '\n## 3. Your daily work\n\n'
    if 'chapter 08' in dw: t += 'The full step-by-step driver procedure is in {{ref:BM-MAN-001}}. In short:\n\n' + steps(secs[7][1].get('Actions', '')) + '\n'
    elif 'chapter 09' in dw: t += 'The full step-by-step customer procedure is in {{ref:BM-MAN-002}}. In short: browse the catalog, add to cart, place the order, follow its status, track the delivery, share the OTP with the driver, download delivery notes and invoices.\n'
    else: t += steps(dw) + '\n'
    t += '\n## 4. Screens you use\n'
    if not shots: t += '\nNo screenshot was captured for this role. The supplier dashboard is read-only (see section 1).\n'
    for i, s in enumerate(shots):
        if s not in LOGOK: continue
        mob = s.startswith(('UX-DRV', 'UX-CUS'))
        cap = CAPROLE.get(LOGROLE.get(s, ''), '')
        note = f' — captured with the {cap} demo account' if cap and cap.upper().replace(' ', '_') != code and not (cap == 'Sales Manager' and code == 'SALES_MANAGER') else ''
        t += f'\n![{s}{note} (prototype screenshot, demo data)](screenshots/{s}.png){{width={"6.5cm" if mob else "15cm"}}}\n'
    t += f'''
## 5. Rules to remember

- {clean(r.get('Cannot do', 'Follow the permissions given to your role.'))}
- Work only with the records in your data scope: {clean(r.get('Data scope', 'as configured'))}.
- After your step the next responsible user is: {clean(r.get('Next responsible user', '—'))}.

## 6. Prototype notes

This manual describes the prototype (PROTOTYPE). Data is stored only in your browser; demo markers show simulated
features (GPS, OTP messages, email / WhatsApp). Production behaviour may differ — see {{{{ref:BM-OVW-015}}}}.
'''
    write('15', mid + '.md', t)
# MAN-114 Management (no system role)
t = fm(id='BM-MAN-114', title='Role User Manual — Management (Read-only Oversight)', folder='15', file='BM-MAN-114_User_Manual_Management', category='User Manuals', owner='Training Lead',
       related=['BM-MAN-003', 'BM-MAN-120', 'BM-SEC-004'], purpose='Guide for management users who need dashboards and reports without operational actions.',
       scope='PENDING CONFIRMATION — the prototype has no "Management" system role. This manual proposes how such users can be served with a custom role.',
       references=['Workflow documentation chapter 04 §4.14 Custom roles'])
t += '''## 1. Status

There is no Management role in the 13 system roles (VERIFIED). Management access is PENDING CONFIRMATION by the client.

## 2. Proposed set-up (using existing features)

1. Administrator opens **Role Management → Create role** (`/admin/roles/create`).
2. Name: "Management"; data scope: all records; landing page: Dashboard.
3. Grant view-only permissions, for example `dashboard.view`, `orders.view`, `reports.center`, `dispatch.view`, `inventory.dashboard`, `invoices.view` — no create / approve keys.
4. Assign the role to management users in **User Management**.

A custom role's dashboard is the permission-driven workspace launcher (VERIFIED), not the Super Admin operations
dashboard. If management needs the operations overview KPIs, a dedicated dashboard is PROPOSED.

## 3. Using the system

Sign in → Dashboard (period filter: today, week, month, custom, compare) → Reports Center (search, filter, export CSV,
print) → open orders or dispatches read-only.
'''
write('15', 'MAN-114.md', t)
MAN120.append(['MANAGEMENT (proposed)', 'Management', 'Oversight via dashboards and reports', 'All (read-only)', 'None', 'None', 'Operational actions', '—'])
xlsxlib.write_book(dict(id='BM-MAN-120', title='Role Responsibility Matrix', folder='15', file='BM-MAN-120_Role_Responsibility_Matrix', category='User Manuals',
    purpose='One-page view of what each role does, approves, cannot do and who is next in the process.', scope='13 system roles (VERIFIED) plus proposed Management role (PENDING CONFIRMATION).',
    related=['BM-SEC-005', 'BM-OVW-010'], references=['Workflow documentation chapter 04']), [
    dict(name='Role Responsibilities', headers=['Role code', 'Role', 'Purpose', 'Data scope', 'Create / update', 'Approvals', 'Cannot do', 'Next responsible user'], rows=MAN120, widths=[22, 22, 50, 30, 45, 35, 45, 30])])
print('man ok', len(ROLES))
