"""Security workbooks: RBAC / access control matrix (SEC-005), security risk register (SEC-012)."""
import json, os
import xlsxlib
INV = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'inv.json')))
ROLES = ['SUPER_ADMIN', 'ADMIN', 'SALESMAN', 'SALES_MANAGER', 'CUSTOMER_SERVICE', 'DISPATCHER', 'DRIVER', 'FINANCE', 'WAREHOUSE_MANAGER', 'INVENTORY_EXECUTIVE', 'QA_MANAGER', 'CUSTOMER', 'SUPPLIER']
PERM = INV['permissions']
def has(r, k): return r == 'SUPER_ADMIN' or r in PERM.get(k, [])
def ok(r, perm):
    if not perm: return True
    return any(has(r, p.strip()) for p in str(perm).split(','))
labels = {}
def walk(o):
    if isinstance(o, list): [walk(x) for x in o]
    elif isinstance(o, dict):
        if isinstance(o.get('key'), str) and '.' in o['key'] and o.get('label'): labels[o['key']] = o['label']
        [walk(v) for v in o.values()]
walk(INV['catalog'])
perm_rows = [[k, labels.get(k, '')] + ['✓' if has(r, k) else '' for r in ROLES] for k in sorted(PERM)]
nav = [n for n in INV['nav'] if not n.get('redirectTo') and not n.get('public')]
scr_rows = [[n['label'], n['path'], n.get('permission') or '(signed in)'] + ['✓' if ok(r, n.get('permission')) else '' for r in ROLES] for n in nav]
meta = INV['roleMeta']
role_rows = [[r, (meta.get(r) or {}).get('label', ''), (meta.get(r) or {}).get('workspace', ''), (meta.get(r) or {}).get('scope', ''), sum(1 for k in PERM if has(r, k))] for r in ROLES]
xlsxlib.write_book(dict(id='BM-SEC-005', title='RBAC and Access Control Matrix', folder='10', file='BM-SEC-005_RBAC_and_Access_Control_Matrix', category='Security and Compliance',
    purpose='Default permission grants per role and screen access per role, exported from the source configuration (VERIFIED).', scope=f'13 roles × {len(PERM)} permission keys; {len(nav)} protected screens.',
    related=['BM-SEC-004', 'BM-MAN-120'], references=['src/config/permissions.js', 'src/config/rbacCatalog.js', 'src/config/navigation.js']), [
    dict(name='Roles', headers=['Role code', 'Label', 'Workspace', 'Data scope', 'Permission count'], rows=role_rows, widths=[22, 24, 26, 40, 14]),
    dict(name='Permission Matrix', headers=['Permission key', 'Meaning'] + ROLES, rows=perm_rows, widths=[30, 40] + [7] * len(ROLES)),
    dict(name='Screen Access Matrix', headers=['Screen', 'Route', 'Permission'] + ROLES, rows=scr_rows, widths=[28, 36, 26] + [7] * len(ROLES))])
risks = [
 ('SR-01', 'Prototype used with real data', 'Real customer data entered into the browser prototype (no encryption, published passwords)', 'High', 'Medium', 'Use demo data only; banner; production backend', 'Client IT', 'Open'),
 ('SR-02', 'Client-side authorisation bypass', 'Permission checks in the browser can be bypassed', 'High', 'High (prototype)', 'Server-side enforcement in production (SEC-REQ-06)', 'Architect', 'Open'),
 ('SR-03', 'Account takeover of privileged user', 'Phishing / password reuse', 'High', 'Medium', 'MFA, lockout, alerts', 'Security', 'Open'),
 ('SR-04', 'OTP interception or brute force', 'OTP shared or guessed', 'Medium', 'Low', 'Hash, expiry, attempts, rate limits, SMS to registered number', 'Architect', 'Open'),
 ('SR-05', 'Customer sees other customers / fleet locations', 'IDOR on tracking endpoints', 'High', 'Medium', 'Object scope; customer channel per order; tests ST-03', 'Architect', 'Open'),
 ('SR-06', 'Malicious file upload', 'Malware in documents / POD', 'High', 'Medium', 'Allow-list, AV scan, private storage', 'Architect', 'Open'),
 ('SR-07', 'WhatsApp number ban (OpenWA)', 'Unofficial client violates WhatsApp terms', 'Medium', 'High', 'Use official WhatsApp Business provider or SMS', 'Client', 'Open — decision needed'),
 ('SR-08', 'Location privacy complaint', 'Tracking outside working time', 'Medium', 'Low', 'Track only active deliveries; indicator; policy', 'Client HR', 'Open'),
 ('SR-09', 'Secrets leakage', 'API keys in code or browser', 'High', 'Medium', 'Secrets manager, scanning in CI', 'DevOps', 'Open'),
 ('SR-10', 'Dependency vulnerability', 'Vulnerable npm / pip packages', 'Medium', 'High', 'Automated scanning, patch SLA', 'DevOps', 'Open'),
 ('SR-11', 'Insider misuse / mass export', 'Bulk export of customer and credit data', 'Medium', 'Low', 'data.export permission, export audit, alerts', 'Client', 'Open'),
 ('SR-12', 'Backup compromise', 'Unencrypted or deletable backups', 'High', 'Low', 'Encrypted, object-lock, separate account', 'DevOps', 'Open'),
 ('SR-13', 'Third-party provider breach', 'Messaging / maps provider incident', 'Medium', 'Low', 'DPA, minimal data, key rotation', 'Client', 'Open'),
 ('SR-14', 'Weak TLS / misconfiguration', 'Insecure web server setup', 'Medium', 'Medium', 'Hardened config, SSL Labs check in go-live checklist', 'DevOps', 'Open'),
]
xlsxlib.write_book(dict(id='BM-SEC-012', title='Security Risk Register', folder='10', file='BM-SEC-012_Security_Risk_Register', category='Security and Compliance',
    purpose='Register of security risks with impact, likelihood, mitigation and owner.', scope='Prototype and production; ratings are initial assessments.', related=['BM-SEC-001', 'BM-RSK-002']), [
    dict(name='Risks', headers=['Risk ID', 'Risk', 'Description', 'Impact', 'Likelihood', 'Mitigation', 'Owner', 'Status'], rows=[list(r) for r in risks], widths=[8, 30, 46, 9, 14, 50, 14, 20],
         validations={7: ['Open', 'Open — decision needed', 'Mitigated', 'Accepted', 'Closed']})])
print('sec ok', len(perm_rows), len(scr_rows))
