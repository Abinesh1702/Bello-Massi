"""Generate requirement-driven documents: module FRDs (04), consolidated FRD / NFR / rules (03), workbooks (BR trace, RTM,
change log, feature inventory, test scenarios, functional and UAT test cases)."""
import os, json, re, collections
from data import model, model2, modextra
import xlsxlib
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, 'src')
INV = json.load(open(os.path.join(HERE, 'data', 'inv.json')))
FRS = model.frs(); MOD = {m[0]: m for m in model.MODULES}
R = model.ROLE_NAMES

PREFIX = {
 'AUTH': ['/login', '/forgot', '/reset', '/logout', '/account', '/unauthorized'], 'USR': ['/admin/users', '/admin/role-assignment'],
 'RBAC': ['/admin/roles', '/admin/permissions'], 'DASH': ['/dashboard'], 'CUS': ['/customers'], 'PRD': ['/products'],
 'HUB': ['/hubs', '/suppliers', '/admin/organization'], 'ORD': ['/orders/create', '/orders/my-orders', '/orders/returned', '/orders/rejected', '/orders/reports', '/orders/:id', '/orders'],
 'APR': ['/orders/approval'], 'CRD': ['/customers/credit'], 'CON': ['/orders/consolidation'],
 'DSP': ['/dispatch/ready-orders', '/dispatch/planning', '/dispatch/create', '/dispatch/:id', '/dispatch/reports', '/dispatch'], 'ZON': ['/dispatch/zones'],
 'DRA': ['/dispatch/assignments', '/dispatch/drivers', '/dispatch/vehicles'], 'DRV': ['/driver'], 'CAP': ['/customer/'],
 'TRK': ['/dispatch/delivery-tracking', '/dispatch/live-tracking', '/dispatch/delivery-history', '/customer/tracking'], 'OTP': ['/driver/deliveries/:id/confirm'],
 'POD': ['/driver/deliveries/:id/confirm'], 'DN': ['/dispatch/delivery-notes', '/driver/delivery-notes', '/customer/delivery-notes'],
 'EXC': ['/dispatch/deliveries'], 'INV': ['/inventory'], 'SCR': ['/inventory/scrap'], 'WQA': ['/warehouse', '/quality'], 'VMS': ['/vms'],
 'DOC': ['/documents'], 'INVC': ['/invoices'], 'EML': ['/communication/email'], 'OWA': ['/communication/whatsapp'],
 'AUTO': ['/communication/automation'], 'CALL': ['/communication/calls'], 'NOTF': ['/notifications'], 'RPT': ['/reports'], 'AI': ['/ai'],
 'SET': ['/admin/settings', '/admin/audit-logs', '/settings', '/profile'],
}
EXCLUDE = {'ORD': ['/orders/approval', '/orders/consolidation'], 'DSP': ['/dispatch/zones', '/dispatch/assignments', '/dispatch/drivers', '/dispatch/vehicles', '/dispatch/delivery', '/dispatch/live', '/dispatch/deliveries'],
           'INV': ['/inventory/scrap'], 'CUS': ['/customers/credit'], 'CAP': ['/customer/tracking', '/customer/delivery-notes']}


def screens(code):
    out = []
    for n in INV['nav']:
        if n.get('redirectTo'): continue
        p = n['path']
        if any(p.startswith(x) for x in PREFIX[code]) and not any(p.startswith(x) for x in EXCLUDE.get(code, [])):
            out.append((n['label'], p, n.get('permission') or '—'))
    return out


def roles_text(s):
    if s in ('most', 'many'): return 'Most office roles'
    if s == 'office roles': return 'Office roles'
    if s == '(system)': return 'System'
    return ', '.join(R.get(x, x) for x in s.split())


# ---------- test cases ----------
def build_tcs():
    tcs = []; fr2tc = collections.defaultdict(list); cnt = collections.Counter()
    for f in FRS:
        m = f['module']; cnt[m] += 1; tid = f'TC-{m}-{cnt[m]:03d}'
        role = f['roles'].split()[0] if f['roles'] not in ('most', 'many', 'office roles', '(system)') else 'AD'
        exe = f['label'] in ('VERIFIED', 'PROTOTYPE')
        steps = (f"1. Sign in as {R.get(role, role)} ({model.DEMO.get(role, 'demo account')}).\n2. Open {f['route']}.\n3. Perform: {f['text']}\n4. Check the result."
                 if exe else f"Not executable on the prototype ({f['label']}). Execute against the production build when implemented: {f['text']}")
        tcs.append(dict(id=tid, module=m, fr=f['id'], scenario=f['text'], pre='Demo data loaded (Settings › Reset demo data if needed); user signed out.' if exe else 'Production feature available.',
                        steps=steps, data=model.DEMO.get(role, '') if exe else '', expected=f['expected'], priority=f['priority'], kind='Positive', label=f['label'],
                        status='Not executed' if exe else 'Blocked — not implemented'))
        fr2tc[f['id']].append(tid)
    for n in model2.NEGS:
        tid, m, sc, role, steps, exp, pr, fr = n
        role0 = role.split()[0]
        tcs.append(dict(id=tid, module=m, fr=fr, scenario=sc, pre='Demo data loaded; user signed out.', steps='1. Sign in as ' + R.get(role0, role0) + ' (' + model.DEMO.get(role0, '') + ').\n2. ' + steps.replace('; ', '.\n3. ', 1).replace('; ', '.\n4. '),
                        data=model.DEMO.get(role0, ''), expected=exp, priority=pr, kind='Negative', label='VERIFIED', status='Not executed'))
        fr2tc[fr].append(tid)
    return tcs, fr2tc


TCS, FR2TC = build_tcs()
BR_OF = collections.defaultdict(list)
for b in model2.BRS:
    for x in b[7].split(): BR_OF[x].append(b[0])
MOD_BR = {}
for b in model2.BRS: MOD_BR.setdefault(b[3], b[0])
for f in FRS:
    if not BR_OF[f['id']]: BR_OF[f['id']].append(MOD_BR.get(f['module'], 'BR-013'))


def write(folder, name, text):
    p = os.path.join(SRC, folder, name); open(p, 'w').write(text)


def fm(**k):
    lines = ['---']
    for a, b in k.items():
        if isinstance(b, list): lines.append(f'{a}: [{", ".join(b)}]')
        else: lines.append(f'{a}: {json.dumps(b, ensure_ascii=False)}')
    lines.append('---\n')
    return '\n'.join(lines)


def frd(m):
    code, name, purpose, routes, services, keys, impl = m
    x = modextra.X[code]; frs = [f for f in FRS if f['module'] == code]
    roles = sorted({r for f in frs for r in f['roles'].split() if r in R})
    scr = screens(code)
    rules = [r for r in model2.RULES if r[1] == code]
    negs = [n for n in model2.NEGS if n[1] == code]
    t = []
    t.append(f"## 1. Module overview\n\n| Item | Value |\n|---|---|\n| Module code | `{code}` |\n| Module name | {name} |\n| Current implementation status | **{impl}** |\n| Main routes | `{routes}` |\n| Services / components | `{services}` |\n| LocalStorage keys (prototype) | `{keys}` |\n")
    t.append(f"## 2. Purpose\n\n{purpose}")
    t.append(f"## 3. Business objectives\n\n{x['obj']}\n\nRelated business requirements: " + ', '.join(sorted({b for f in frs for b in BR_OF[f['id']]})) + '.')
    t.append('## 4. User roles\n\n' + ('\n'.join(f'- {R[r]}' for r in roles) if roles else '- See functional requirements.'))
    t.append(f"## 5. Access permissions\n\nPermission keys (from `src/config/rbacCatalog.js`): {x['perms']}. Default grants per role are in {{{{ref:BM-SEC-005}}}}.")
    t.append('## 6. Screens\n\n' + ('| Screen | Route | Permission |\n|---|---|---|\n' + '\n'.join(f'| {a} | `{b}` | `{c}` |' for a, b, c in scr) if scr else 'No dedicated screen (works inside other modules\' screens).'))
    t.append('## 7. Functional requirements\n\n| ID | Priority | Requirement | Roles | Label | Implementation status |\n|---|---|---|---|---|---|\n' +
             '\n'.join(f"| {f['id']} | {f['priority']} | {f['text']} | {roles_text(f['roles'])} | {f['label']} | {f['impl']} |" for f in frs))
    t.append(f"## 8. Input fields\n\n{x['fields']}")
    t.append('## 9. Validation rules\n\n' + ('\n'.join(f'- **{r[0]}** — {r[2]} _(enforced by `{r[3]}`; message: {r[4]})_' for r in rules) if rules else '- Standard required-field and format validation on the forms of this module (see the service named in section 1).'))
    t.append('## 10. Business rules\n\n' + '\n'.join(f"- {f['id']}: expected behaviour — {f['expected']}" for f in frs if f['label'] == 'VERIFIED'))
    t.append(f"## 11. Workflow\n\nSee {', '.join('{{ref:BM-WF-' + w.strip().split('-')[1] + '}}' for w in x['wf'].split(','))} and the workflow chapters in `docs/workflow/`.")
    t.append(f"## 12. Status lifecycle\n\n{x['status']} Full lists: {{{{ref:BM-GLO-003}}}}.")
    apr = [f for f in frs if any(k in f['text'].lower() for k in ('approv', 'reject', 'verify', 'review'))]
    t.append('## 13. Approval rules\n\n' + ('\n'.join(f"- {f['id']}: {f['text']}" for f in apr) if apr else 'No approval step in this module.'))
    t.append(f"## 14. Notifications\n\n{x['notif']}")
    t.append('## 15. Error scenarios\n\n' + ('| Test case | Scenario | Expected |\n|---|---|---|\n' + '\n'.join(f'| {n[0]} | {n[2]} | {n[5]} |' for n in negs) if negs else 'Field validation errors and permission errors as described in sections 9 and 5.'))
    t.append('## 16. Exception handling\n\nServices return `{ ok: false, error, errors }`; the page shows the message (toast or field error) and **nothing is saved**. Repeated actions are refused with "No change was made." Multi-record changes are written in one storage transaction. See {{ref:BM-WF-18}}.')
    t.append(f"## 17. Data dependencies\n\nReads / writes: `{keys}`. Depends on master data (customers, products, hubs, users) where applicable. Production entities: {{{{ref:BM-DAT-002}}}}.")
    t.append(f"## 18. Reports\n\n{x['reports']}")
    t.append(f"## 19. Audit requirements\n\n{x['audit']} Production: every create / update / status change shall record user, timestamp, before / after values (PROPOSED).")
    t.append('## 20. Acceptance criteria\n\n| Requirement | Acceptance criterion | Test cases |\n|---|---|---|\n' + '\n'.join(f"| {f['id']} | {f['expected']} | {', '.join(FR2TC[f['id']])} |" for f in frs))
    t.append(f"## 21. Current implementation status\n\n**{impl}.** Labels: " + ', '.join(f'{k} {v}' for k, v in collections.Counter(f['label'] for f in frs).items()) + '. ' +
             'The prototype runs entirely in the browser with LocalStorage; it is not production-ready backend functionality.')
    t.append(f"## 22. Future enhancement requirements\n\n{x['future']}\n\n" + '\n'.join(f"- {f['id']} ({f['label']}): {f['text']}" for f in frs if f['label'] in ('PROPOSED', 'PENDING CONFIRMATION', 'NOT IMPLEMENTED', 'NOT VERIFIED')))
    meta = fm(id=f'BM-FRD-{code}', title=f'Functional Requirements — {name}', folder='04', file=f'BM-FRD-{code}_{re.sub(r"[^A-Za-z0-9]+", "_", name).strip("_")}',
              category='Functional Requirements', owner='Business Analyst', module=name,
              related=['BM-SYS-002', 'BM-SYS-003', 'BM-SYS-008', 'BM-QA-011'],
              purpose=f'Specify the functional requirements of the {name} module as implemented in the prototype and as required for production.',
              scope=f'All screens, rules, statuses and integrations of the {name} module ({routes}).')
    write('04', f'FRD-{code}.md', meta + '\n\n'.join(t) + '\n')


def sys_docs():
    # consolidated FRD
    t = ['## 1. Requirement summary\n\n| Module | FRs | VERIFIED | PROTOTYPE | PROPOSED | PENDING | NOT IMPL. | NOT VERIFIED |\n|---|---|---|---|---|---|---|---|']
    for m in model.MODULES:
        c = collections.Counter(f['label'] for f in FRS if f['module'] == m[0])
        t.append(f"| {m[1]} ({m[0]}) | {sum(c.values())} | {c['VERIFIED']} | {c['PROTOTYPE']} | {c['PROPOSED']} | {c['PENDING CONFIRMATION']} | {c['NOT IMPLEMENTED']} | {c['NOT VERIFIED']} |")
    c = collections.Counter(f['label'] for f in FRS)
    t.append(f"| **Total** | **{len(FRS)}** | {c['VERIFIED']} | {c['PROTOTYPE']} | {c['PROPOSED']} | {c['PENDING CONFIRMATION']} | {c['NOT IMPLEMENTED']} | {c['NOT VERIFIED']} |")
    t = ['\n'.join(t)]
    for m in model.MODULES:
        frs = [f for f in FRS if f['module'] == m[0]]
        t.append(f"## {m[1]} ({m[0]})\n\nDetail: {{{{ref:BM-FRD-{m[0]}}}}}\n\n| ID | P | Requirement | Expected result | Label |\n|---|---|---|---|---|\n" +
                 '\n'.join(f"| {f['id']} | {f['priority']} | {f['text']} | {f['expected']} | {f['label']} |" for f in frs))
    write('03', 'SYS-003.md', fm(id='BM-SYS-003', title='Functional Requirements Document (Consolidated)', folder='03', file='BM-SYS-003_Functional_Requirements_Document',
          related=['BM-SYS-002', 'BM-SYS-008', 'BM-BRD-001'], purpose='List every functional requirement of the platform with a unique ID, priority, expected result and implementation label.',
          scope='All 35 modules; detailed specifications per module are in folder 04.', pdf=True) + '\n\n'.join(t) + '\n')
    # NFR
    cats = collections.OrderedDict()
    for n in model2.NFRS: cats.setdefault(n[1], []).append(n)
    t = [f'## {k}\n\n| ID | Requirement | Measure / acceptance | Label |\n|---|---|---|---|\n' + '\n'.join(f'| {n[0]} | {n[3]} | {n[4]} | {n[2]} |' for n in v) for k, v in cats.items()]
    t.insert(0, '## Overview\n\nNon-functional requirements describe how well the system must work. Values marked PROPOSED are targets for the production build; no real performance measurement of a production system exists yet. Values marked VERIFIED describe behaviour confirmed in the prototype source code.')
    write('03', 'SYS-004.md', fm(id='BM-SYS-004', title='Non-Functional Requirements', folder='03', file='BM-SYS-004_Non_Functional_Requirements',
          related=['BM-SYS-002', 'BM-SEC-001', 'BM-INF-003', 'BM-QA-002'], purpose='Define quality attributes: performance, scalability, availability, reliability, security, usability, accessibility, maintainability, data, compliance, portability and observability.',
          scope='Prototype (verified behaviour) and production targets (proposed).') + '\n\n'.join(t) + '\n')
    # rules
    cats = collections.OrderedDict()
    for r in model2.RULES: cats.setdefault(r[1], []).append(r)
    t = ['## Overview\n\nEach rule is enforced in the named service function of the prototype (VERIFIED in source code). The production backend must enforce the same rules server-side.']
    for k, v in cats.items():
        t.append(f"## {MOD[k][1]} ({k})\n\n| ID | Rule | Enforced by | Message / effect |\n|---|---|---|---|\n" + '\n'.join(f'| {r[0]} | {r[2]} | `{r[3]}` | {r[4]} |' for r in v))
    write('03', 'SYS-007.md', fm(id='BM-SYS-007', title='Business Rules Catalogue', folder='03', file='BM-SYS-007_Business_Rules_Catalogue',
          related=['BM-SYS-003', 'BM-SYS-002'], purpose='Catalogue every business rule enforced by the system with its ID, enforcing component and user message.',
          scope='44 rules across authentication, orders, approval, consolidation, dispatch, assignment, delivery, OTP, inventory, scrap, invoices, documents, customer app, automation, calls and replenishment.') + '\n\n'.join(t) + '\n')


def workbooks():
    xlsxlib.write_book(dict(id='BM-BRD-002', title='Business Requirement Traceability', folder='02', file='BM-BRD-002_Business_Requirement_Traceability', category='Business Requirements',
        purpose='Trace each business requirement to modules, functional requirements and test cases with acceptance status.', scope='33 business requirements from the SOW, GPS guide and phase briefs.',
        related=['BM-BRD-001', 'BM-SYS-008'], references=['Scope of Work Oct 2026', 'Driver App GPS Implementation Guide']), [dict(name='BR Traceability',
        headers=['Business Requirement ID', 'Requirement Description', 'Priority', 'Business Owner', 'Source', 'Related Module', 'Related Functional Requirements', 'Related Test Cases', 'Label', 'Acceptance Status'],
        rows=[[b[0], b[6], b[1], b[2] + ' (PENDING CONFIRMATION of name)', b[4], MOD[b[3]][1], b[7].replace(' ', ', '), ', '.join(t for x in b[7].split() for t in FR2TC[x]), b[5], 'Not accepted — awaiting UAT'] for b in model2.BRS],
        widths=[12, 60, 8, 26, 20, 24, 40, 40, 18, 22], label_col=8)])
    rows = []
    for f in FRS:
        rows.append([f['id'], MOD[f['module']][1], f['text'], f['priority'], ', '.join(BR_OF[f['id']]), f'BM-FRD-{f["module"]}', f['route'], f['function'], ', '.join(FR2TC[f['id']]), f['label'], f['impl'], 'Not executed'])
    xlsxlib.write_book(dict(id='BM-SYS-008', title='Requirement Traceability Matrix', folder='03', file='BM-SYS-008_Requirement_Traceability_Matrix', category='System Requirements',
        purpose='Trace business requirements to functional requirements, design elements (route, function), FRD documents and test cases.', scope=f'{len(FRS)} functional requirements, {len(model2.BRS)} business requirements, {len(TCS)} test cases.',
        related=['BM-BRD-002', 'BM-SYS-003', 'BM-QA-011']), [
        dict(name='FR to BR and Tests', headers=['FR ID', 'Module', 'Requirement', 'Priority', 'Business Requirement(s)', 'FRD Document', 'Route / Screen', 'Service / Component', 'Test Case(s)', 'Label', 'Implementation Status', 'Test Status'], rows=rows,
             widths=[13, 22, 60, 7, 16, 16, 28, 30, 26, 18, 26, 14], label_col=9),
        dict(name='NFR', headers=['NFR ID', 'Category', 'Requirement', 'Measure / Acceptance', 'Label'], rows=[[n[0], n[1], n[3], n[4], n[2]] for n in model2.NFRS], widths=[14, 16, 70, 50, 20], label_col=4),
        dict(name='Coverage Summary', headers=['Module', 'FRs', 'Test cases', 'FRs without test case'], rows=[[m[1], sum(1 for f in FRS if f['module'] == m[0]), sum(1 for t in TCS if t['module'] == m[0]), sum(1 for f in FRS if f['module'] == m[0] and not FR2TC[f['id']])] for m in model.MODULES], widths=[40, 8, 12, 20])])
    xlsxlib.write_book(dict(id='BM-SYS-009', title='Requirement Change Log', folder='03', file='BM-SYS-009_Requirement_Change_Log', category='System Requirements',
        purpose='Record every change to the requirements baseline with reason, impact and decision.', scope='Requirements baseline v1.0 (12 Nov 2026) and the scope extensions made during prototype phases.', related=['BM-RSK-003', 'BM-SYS-008']), [
        dict(name='Change Log', headers=['Change ID', 'Date', 'Requirement(s)', 'Change Description', 'Source / Requested By', 'Reason', 'Impact', 'Decision', 'Decided By', 'Status'],
             rows=[['RCL-001', '2026-11-12', 'All', 'Requirements baseline v1.0 created from SOW, GPS guide and source code', 'Documentation team', 'Documentation package', 'None', 'Baseline for review', '—', 'Open — awaiting client review'],
                   ['RCL-002', 'Prototype phases 2–6', 'FR-INV-*, FR-SCR-*, FR-VMS-*, FR-DOC-*, FR-INVC-*, FR-EML-*, FR-OWA-*, FR-AI-*', 'Modules added beyond the SOW in prototype phases', 'Phase briefs', 'Prototype exploration', 'Scope, cost, timeline', 'PENDING CONFIRMATION', '—', 'Open'],
                   ['RCL-003', 'Finalisation phase', 'FR-CAP-*', 'Customer self-service app added', 'Finalisation brief', 'Customer experience', 'Scope, security', 'PENDING CONFIRMATION', '—', 'Open'],
                   ['RCL-004', '2026-11-12', 'FR-APR-007, FR-APR-008, FR-DSP-008', 'SOW items found not implemented as described (approved figures, Finance notification, zone board)', 'Gap analysis', 'SOW compliance', 'Backend phase effort', 'To be scheduled', '—', 'Open']],
             widths=[10, 14, 30, 50, 22, 22, 18, 22, 14, 22],
             validations={9: ['Open', 'Approved', 'Rejected', 'Implemented', 'Closed']})])
    feat = [[m[0], m[1], m[2], m[3], m[4], m[6], sum(1 for f in FRS if f['module'] == m[0]), f'BM-FRD-{m[0]}'] for m in model.MODULES]
    xlsxlib.write_book(dict(id='BM-OVW-016', title='Project Feature Inventory', folder='01', file='BM-OVW-016_Project_Feature_Inventory', category='Project Overview',
        purpose='Inventory of every module and feature found in the source code with its implementation classification.', scope='35 modules, 179 functional requirements, 197 screens.', related=['BM-OVW-014', 'BM-OVW-015']), [
        dict(name='Modules', headers=['Code', 'Module', 'Purpose', 'Routes', 'Services', 'Implementation Status', 'FR Count', 'FRD'], rows=feat, widths=[8, 30, 60, 40, 40, 36, 9, 14]),
        dict(name='Features (FR level)', headers=['FR ID', 'Module', 'Feature / Requirement', 'Implementation Status', 'Label', 'Route', 'Function'],
             rows=[[f['id'], MOD[f['module']][1], f['text'], f['impl'], f['label'], f['route'], f['function']] for f in FRS], widths=[13, 24, 70, 28, 20, 28, 30], label_col=4),
        dict(name='Screens', headers=['Group', 'Screen', 'Route', 'Permission', 'Page component'], rows=[[(n['group'] or {}).get('label', 'General') if isinstance(n.get('group'), dict) else 'General', n['label'], n['path'], n.get('permission') or '—', n.get('page') or ''] for n in INV['nav'] if not n.get('redirectTo')], widths=[22, 30, 40, 30, 24])])
    tc_headers = ['Test Case ID', 'Module', 'Test Scenario', 'Type', 'Related Requirement', 'Preconditions', 'Test Steps', 'Test Data', 'Expected Result', 'Actual Result', 'Status', 'Priority', 'Defect ID', 'Tester', 'Execution Date']
    tc_rows = [[t['id'], MOD[t['module']][1], t['scenario'], t['kind'], t['fr'], t['pre'], t['steps'], t['data'], t['expected'], '', t['status'], t['priority'], '', '', ''] for t in TCS]
    val = {10: ['Not executed', 'Pass', 'Fail', 'Blocked', 'Blocked — not implemented', 'Not applicable']}
    xlsxlib.write_book(dict(id='BM-QA-011', title='Functional Test Cases', folder='13', file='BM-QA-011_Functional_Test_Cases', category='Testing and Quality Assurance',
        purpose='Executable functional test cases (positive and negative) linked to requirements. Actual results are blank: no formal test execution has been recorded.', scope=f'{len(TCS)} test cases across 35 modules.', related=['BM-QA-002', 'BM-SYS-008']), [
        dict(name='Test Cases', headers=tc_headers, rows=tc_rows, widths=[13, 20, 46, 9, 13, 30, 50, 22, 44, 24, 18, 8, 10, 12, 12], validations=val)])
    # scenarios
    scen = [[f'TS-{i:03d}', MOD[m[0]][1], f'Verify {MOD[m[0]][1].lower()} — ' + m[2], ', '.join(t['id'] for t in TCS if t['module'] == m[0]), m[6]] for i, m in enumerate(model.MODULES, 1)]
    scen += [[f'TS-{len(scen) + i:03d}', 'Cross-module', w[1], ', '.join(t for x in w[5].split() for t in FR2TC[x])[:600], w[0]] for i, w in enumerate(model2.WFS, 1)]
    xlsxlib.write_book(dict(id='BM-QA-010', title='Test Scenario Catalogue', folder='13', file='BM-QA-010_Test_Scenario_Catalogue', category='Testing and Quality Assurance',
        purpose='High-level test scenarios per module and per end-to-end workflow with their test cases.', scope='35 module scenarios + 24 workflow scenarios.', related=['BM-QA-011', 'BM-QA-002']), [
        dict(name='Scenarios', headers=['Scenario ID', 'Area', 'Scenario', 'Test Cases', 'Module status / Workflow'], rows=scen, widths=[10, 26, 70, 60, 30])])
    # UAT
    uat_flows = [
        ('UAT-01', 'Order to delivery — happy path', 'SE, SM, CS, DP, DR, CU', '1. Salesman creates and submits an order. 2. Sales Manager approves. 3. Customer Service consolidates and releases. 4. Dispatcher plans, assigns and confirms. 5. Driver starts, reaches, enters customer OTP, completes. 6. Customer sees the delivery note.', 'Order DELIVERED; delivery note issued; stock deducted once; every role notified.'),
        ('UAT-02', 'Order returned and resubmitted', 'SE, SM', 'Sales Manager returns an order with reason; salesman corrects and resubmits; manager approves.', 'Reason visible to salesman; order approved after resubmission; timeline complete.'),
        ('UAT-03', 'Order rejected', 'SE, SM', 'Sales Manager rejects with reason.', 'Order REJECTED; salesman notified with reason.'),
        ('UAT-04', 'Credit limit exception', 'SM, AD', 'Submit an order above credit; approve with acknowledgement; enable blocking and retry.', 'Warning acknowledged; approval blocked when setting is on.'),
        ('UAT-05', 'Partial delivery and review', 'DR, DP', 'Driver delivers less than dispatched; Dispatcher reviews and returns stock.', 'PARTIALLY_DELIVERED; Delivery Return movement once.'),
        ('UAT-06', 'Failed delivery and re-queue', 'DR, DP', 'Driver marks failed (customer not available); Dispatcher returns goods and re-queues.', 'Order back to READY_FOR_DISPATCH; stock returned once.'),
        ('UAT-07', 'Driver blocked by compliance', 'AD, DP', 'Expire a driver licence; try to assign.', 'Assignment refused with licence message.'),
        ('UAT-08', 'Customer self-service order', 'CU, SM', 'Customer orders from catalog; manager approves.', 'Order with source customer_app approved.'),
        ('UAT-09', 'Customer tracking and OTP', 'CU, DR', 'Customer opens tracking when driver arrives and reads OTP.', 'Only own vehicle visible; OTP shown; delivery completes with it.'),
        ('UAT-10', 'Stock receipt, transfer, adjustment', 'IE, WM', 'Receive goods; transfer to another hub; adjust damaged stock.', 'Stock and ledger correct.'),
        ('UAT-11', 'Scrap with approval', 'IE, WM', 'Raise scrap with photo; warehouse manager approves and writes off.', 'Write-off posted once; requester cannot approve own request.'),
        ('UAT-12', 'Invoice (if in scope)', 'FI', 'Issue invoice on delivered quantities; cancel and reissue.', 'Correct totals; one active invoice per order.'),
        ('UAT-13', 'Document verification', 'DR, QA', 'Driver uploads licence; QA reviews and verifies.', 'Document VERIFIED; expiry tracked.'),
        ('UAT-14', 'Role access', 'All', 'Each role signs in and opens menus.', 'Only permitted menus; restricted pages show Unauthorized.'),
        ('UAT-15', 'Dashboard period filter', 'All office roles', 'Change periods and compare.', 'KPIs match filtered lists.'),
        ('UAT-16', 'Reports and export', 'SM, FI, AD', 'Run reports and export CSV.', 'CSV matches on-screen data.'),
        ('UAT-17', 'User administration', 'AD', 'Create, deactivate, unlock a user; reset password.', 'Effective at next sign-in; audit entries.'),
        ('UAT-18', 'Mobile usability', 'DR, CU', 'Complete driver and customer flows on a phone.', 'All actions reachable; no horizontal scroll.'),
    ]
    xlsxlib.write_book(dict(id='BM-QA-012', title='UAT Test Cases', folder='13', file='BM-QA-012_UAT_Test_Cases', category='Testing and Quality Assurance',
        purpose='Business-level user acceptance test cases for client users. Execution, results and sign-off are blank until UAT is performed.', scope='18 end-to-end business scenarios.', related=['BM-QA-003', 'BM-HND-004']), [
        dict(name='UAT Cases', headers=['UAT ID', 'Business Scenario', 'Roles', 'Steps', 'Expected Result', 'Actual Result', 'Status', 'Business Tester', 'Execution Date', 'Comments'],
             rows=[[a, b, c, d, e, '', 'Not executed', '', '', ''] for a, b, c, d, e in uat_flows], widths=[9, 30, 16, 70, 46, 24, 14, 16, 14, 24],
             validations={6: ['Not executed', 'Pass', 'Fail', 'Blocked']})])
    json.dump({'tcs': len(TCS), 'fr2tc': FR2TC, 'br_of': BR_OF}, open(os.path.join(HERE, 'data', 'trace.json'), 'w'))


if __name__ == '__main__':
    for m in model.MODULES: frd(m)
    sys_docs(); workbooks()
    print('FRDs', len(model.MODULES), 'TCs', len(TCS))
