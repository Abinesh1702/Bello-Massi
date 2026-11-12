"""Miscellaneous generated content: stakeholder tables, feature catalogue."""
import os, collections
from data import model, model2
from gen_req import fm, write, FRS, MOD
import xlsxlib
HERE = os.path.dirname(os.path.abspath(__file__))

def stakeholders():
    p = os.path.join(HERE, 'src', '01', 'OVW-009.md'); s = open(p).read()
    tbl = '| # | Stakeholder | Type | Interest | Influence | Responsibilities | Label |\n|---|---|---|---|---|---|---|\n' + '\n'.join(
        f'| SH-{i:02d} | {a} | {b} | {c} | {d} | {e} | {f} |' for i, (a, b, c, d, e, f) in enumerate(model2.STAKEHOLDERS, 1))
    if 'STAKEHOLDER_TABLE' in s: open(p, 'w').write(s.replace('STAKEHOLDER_TABLE', tbl))
    acts = ['Approve scope / BRD', 'Approve business rules', 'Provide master data', 'Provide SAP interfaces', 'Choose hosting', 'Choose messaging provider', 'Participate in UAT', 'Sign UAT', 'Go-live decision', 'Training attendance', 'Support after go-live']
    resp = {
        'Bellomassi management (client sponsor)': ['A', 'A', 'I', 'I', 'A', 'A', 'I', 'A', 'A', 'I', 'I'],
        'Sales Director / Sales Managers': ['C', 'R', 'C', 'I', 'I', 'I', 'R', 'R', 'C', 'R', 'I'],
        'Salesmen (Sales Executives)': ['I', 'C', 'I', 'I', 'I', 'I', 'R', 'I', 'I', 'R', 'I'],
        'Customer Service team': ['I', 'C', 'C', 'I', 'I', 'I', 'R', 'C', 'I', 'R', 'I'],
        'Dispatcher / Logistics Manager': ['C', 'R', 'R', 'I', 'I', 'C', 'R', 'R', 'C', 'R', 'I'],
        'Drivers': ['I', 'I', 'I', 'I', 'I', 'I', 'R', 'I', 'I', 'R', 'I'],
        'Finance team': ['C', 'R', 'C', 'C', 'I', 'I', 'R', 'R', 'C', 'R', 'I'],
        'Warehouse / Inventory / QA staff': ['I', 'C', 'R', 'I', 'I', 'I', 'R', 'C', 'I', 'R', 'I'],
        'Bellomassi customers': ['I', 'I', 'I', 'I', 'I', 'I', 'C', 'I', 'I', 'I', 'I'],
        'Client IT / SAP team': ['C', 'C', 'R', 'R', 'R', 'R', 'C', 'C', 'C', 'R', 'R'],
        'Delivery team — Project Manager': ['R', 'C', 'I', 'C', 'C', 'C', 'R', 'C', 'R', 'R', 'R'],
        'Delivery team — Business Analyst': ['R', 'R', 'C', 'C', 'I', 'I', 'R', 'C', 'C', 'R', 'C'],
        'Delivery team — Architect / Developers': ['C', 'C', 'C', 'R', 'R', 'R', 'C', 'I', 'C', 'C', 'R'],
        'Delivery team — QA': ['I', 'C', 'I', 'I', 'I', 'I', 'R', 'C', 'C', 'C', 'C'],
        'Delivery team — DevOps': ['I', 'I', 'I', 'C', 'R', 'C', 'I', 'I', 'C', 'I', 'R'],
        'Third parties: maps (Google), SMS / WhatsApp provider, email provider, cloud host': ['I', 'I', 'I', 'C', 'C', 'C', 'I', 'I', 'I', 'I', 'C'],
    }
    xlsxlib.write_book(dict(id='BM-OVW-010', title='Stakeholder Responsibility Matrix', folder='01', file='BM-OVW-010_Stakeholder_Responsibility_Matrix', category='Project Overview',
        purpose='RACI of stakeholders for key project decisions and activities (proposed; to be confirmed with the client).', scope='16 stakeholder groups x 11 activities.', related=['BM-OVW-009', 'BM-PM-004'],
        status='Draft — PROPOSED, pending client confirmation'), [
        dict(name='RACI', headers=['Stakeholder'] + acts, rows=[[k] + v for k, v in resp.items()], widths=[46] + [14] * len(acts)),
        dict(name='Legend', headers=['Code', 'Meaning'], rows=[['R', 'Responsible — does the work'], ['A', 'Accountable — final approval'], ['C', 'Consulted'], ['I', 'Informed']], widths=[8, 40])])

def feature_catalogue():
    t = ['## 1. Module catalogue\n\n| # | Code | Module | Purpose | Implementation status | FRs | FRD |\n|---|---|---|---|---|---|---|\n' +
         '\n'.join(f'| {i} | {m[0]} | {m[1]} | {m[2]} | {m[6]} | {sum(1 for f in FRS if f["module"] == m[0])} | {{{{ref:BM-FRD-{m[0]}}}}} |' for i, m in enumerate(model.MODULES, 1))]
    for m in model.MODULES:
        t.append(f'## {m[1]}\n\n' + '\n'.join(f"- **{f['id']}** — {f['text']} _({f['label']})_" for f in FRS if f['module'] == m[0]))
    write('01', 'OVW-014.md', fm(id='BM-OVW-014', title='Product Feature Catalogue', folder='01', file='BM-OVW-014_Product_Feature_Catalogue', category='Project Overview', owner='Product Manager',
          related=['BM-OVW-016', 'BM-SYS-003'], purpose='Catalogue every module and feature found in the source code with its implementation label.', scope='35 modules and 179 features (functional requirements).') + '\n\n'.join(t) + '\n')

def fill(path, ph, content):
    p = os.path.join(HERE, 'src', path); s = open(p).read()
    if ph in s: open(p, 'w').write(s.replace(ph, content))

def br_table():
    t = '| ID | P | Requirement | Business owner (role) | Source | Label | Functional requirements |\n|---|---|---|---|---|---|---|\n' + '\n'.join(
        f'| {b[0]} | {b[1]} | {b[6]} | {b[2]} | {b[4]} | {b[5]} | {b[7].replace(" ", ", ")} |' for b in model2.BRS)
    fill('02/BRD-001.md', 'BR_TABLE', t)

CORE = set('AUTH USR RBAC DASH CUS PRD HUB ORD APR CRD CON DSP ZON DRA TRK OTP POD DN EXC NOTF RPT SET DRV'.split())
def phase_of(f):
    t = (f['text'] + ' ' + f['function']).lower()
    if f['label'] == 'PROPOSED':
        if 'sap' in t: return 'Phase 5'
        if any(k in t for k in ('react native', 'gps', 'websocket', 'channels', 'sms', 'whatsapp', 'routes api', 'messaging', 'push', 'ocr', 'object storage', 'offline')): return 'Phase 3'
        return 'Phase 2'
    if f['label'] == 'PENDING CONFIRMATION': return 'Decision gate G0'
    if f['label'] in ('NOT IMPLEMENTED', 'NOT VERIFIED'): return 'Phase 5 (if confirmed)' if f['module'] not in CORE else 'Phase 2'
    return 'Phase 2' if f['module'] in CORE else 'Phase 5 (if extension confirmed)'

def phase_matrix():
    rows = [[f['id'], MOD[f['module']][1], f['text'], f['label'], 'Core (SOW)' if f['module'] in CORE else 'Extension', 'Done (prototype)' if f['label'] in ('VERIFIED', 'PROTOTYPE') else '—', phase_of(f), f['priority']] for f in FRS]
    c = collections.Counter(r[6] for r in rows)
    xlsxlib.write_book(dict(id='BM-PLN-002', title='Phase-wise Scope Matrix', folder='05', file='BM-PLN-002_Phase_wise_Scope_Matrix', category='Scope and Planning',
        purpose='Assign every functional requirement to a delivery phase (proposed).', scope=f'{len(rows)} functional requirements.', related=['BM-PLN-001', 'BM-SOW-001'],
        status='Draft — PROPOSED, pending client confirmation'), [
        dict(name='Requirements by phase', headers=['FR ID', 'Module', 'Requirement', 'Label', 'Scope type', 'Phase 1 prototype', 'Production phase (proposed)', 'Priority'], rows=rows, widths=[13, 24, 64, 20, 14, 16, 26, 8], label_col=3),
        dict(name='Summary', headers=['Production phase', 'Requirements'], rows=sorted([[k, v] for k, v in c.items()]), widths=[34, 14])])

if __name__ == '__main__':
    phase_matrix()
    stakeholders(); feature_catalogue(); br_table(); print('misc ok')
