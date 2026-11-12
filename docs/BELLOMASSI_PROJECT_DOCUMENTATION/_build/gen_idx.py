"""DOC-002 document inventory, IDX-001 BELLOMASSI_DOCUMENTATION_INDEX.xlsx, IDX-003 brief coverage map. Run after build.py."""
import json, os, re, glob
import xlsxlib
from build import FOLDERS
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(H)
REG = json.load(open(os.path.join(H, 'data', 'registry.json')))
XREG = json.load(open(os.path.join(H, 'data', 'xlsx_registry.json')))
SELF = {'BM-DOC-002', 'BM-IDX-001', 'BM-IDX-003'}
docs = {d['id']: dict(d, ext='md') for d in REG}
for k, v in XREG.items(): docs[k] = v
# planned self entries (so the index lists itself even on first run)
docs.setdefault('BM-DOC-002', dict(id='BM-DOC-002', title='Document Inventory', folder='23', file='BM-DOC-002_Document_Inventory', ext='xlsx', category='Document Control', owner='Documentation Lead', module=None, related=['BM-DOC-001', 'BM-IDX-001'], version='1.0', status='Draft — for client review', created='2026-11-12', updated='2026-11-12'))
docs.setdefault('BM-IDX-001', dict(id='BM-IDX-001', title='Bellomassi Documentation Index', folder='25', file='BELLOMASSI_DOCUMENTATION_INDEX', ext='xlsx', category='Documentation Index', owner='Documentation Lead', module=None, related=['BM-IDX-002'], version='1.0', status='Draft — for client review', created='2026-11-12', updated='2026-11-12'))
docs.setdefault('BM-IDX-003', dict(id='BM-IDX-003', title='Documentation Coverage Map (Brief to Documents)', folder='25', file='BM-IDX-003_Documentation_Coverage_Map', ext='xlsx', category='Documentation Index', owner='Documentation Lead', module=None, related=['BM-IDX-002'], version='1.0', status='Draft — for client review', created='2026-11-12', updated='2026-11-12'))
def files_of(d):
    folder = FOLDERS[str(d['folder']).zfill(2)]
    if d.get('ext') in ('xlsx', 'pptx'): return [f"{folder}/{d['file']}.{d['ext']}"]
    out = [f"{folder}/{d['file']}.md", f"{folder}/{d['file']}.docx"]
    if d.get('pdf'): out.append(f"{folder}/{d['file']}.pdf")
    return out
def key(i):
    m = re.match(r'BM-([A-Z]+)-(\d+|[A-Z]+)', i); return (int(FOLDERS_REV.get(i, '99')), i)
FOLDERS_REV = {d['id']: str(d['folder']).zfill(2) for d in docs.values()}
order = sorted(docs, key=key)
# extra (non-document) files
extras = [('BM-API-018', 'OpenAPI 3 Specification (Proposed)', '09', '09_API_AND_INTEGRATION/BM-API-018_openapi_proposed.yaml', 'API and Integration', 'Solution Architect', 'All modules', 'BM-API-001, BM-API-002'),
          ('—', 'Mermaid diagram sources (23)', '21', '21_DIAGRAMS_AND_VISUAL_DOCUMENTATION/mermaid/*.mmd', 'Diagrams', 'Solution Architect', 'All modules', 'BM-DGM-001'),
          ('—', 'Diagram renders (SVG and PNG)', '21', '21_DIAGRAMS_AND_VISUAL_DOCUMENTATION/svg/*.svg, png/*.png', 'Diagrams', 'Solution Architect', 'All modules', 'BM-DGM-001'),
          ('—', 'Prototype screenshots (real captures 2026-11-12)', '12', '12_UI_UX_AND_DESIGN/screenshots/*.png, 15_USER_MANUALS/screenshots/*.png, 16_ADMINISTRATION_AND_CONFIGURATION/screenshots/*.png', 'UI/UX', 'UX Designer', 'All modules', 'BM-UX-005, BM-UX-006'),
          ('—', 'Root copies of the index and master file', '25', 'BELLOMASSI_DOCUMENTATION_INDEX.xlsx, BELLOMASSI_DOCUMENTATION_MASTER.md (package root)', 'Documentation Index', 'Documentation Lead', 'All modules', 'BM-IDX-001, BM-IDX-002')]
rows = []
for i in order:
    d = docs[i]
    rows.append([d['id'], d['title'], d.get('category') or '', d.get('version', '1.0'), d.get('status', ''), '\n'.join(files_of(d)), d.get('owner') or 'Business Analyst',
                 d.get('module') or 'All modules', ', '.join(d.get('related') or []), d.get('created', '2026-11-12'), d.get('updated', '2026-11-12'), 'Not reviewed', 'Not approved'])
for e in extras:
    rows.append([e[0], e[1], e[4], '1.0', 'Draft — for client review', e[3], e[5], e[6], e[7], '2026-11-12', '2026-11-12', 'Not reviewed', 'Not approved'])
counts = {}
for i in order: counts[FOLDERS[FOLDERS_REV[i]]] = counts.get(FOLDERS[FOLDERS_REV[i]], 0) + 1
fmt = {'md': 0, 'docx': 0, 'pdf': 0, 'xlsx': 0, 'pptx': 0}
for i in order:
    for f in files_of(docs[i]): fmt[f.rsplit('.', 1)[1]] += 1
summary = [[k, v] for k, v in sorted(counts.items())] + [['TOTAL documents (IDs)', len(order)], ['Markdown files', fmt['md']], ['Word files', fmt['docx']], ['PDF files', fmt['pdf']], ['Excel files', fmt['xlsx']], ['PowerPoint files', fmt['pptx']]]
H13 = ['Document ID', 'Document Name', 'Category', 'Version', 'Status', 'File Path', 'Owner', 'Related Module', 'Related Documents', 'Created Date', 'Updated Date', 'Review Status', 'Approval Status']
xlsxlib.write_book(dict(id='BM-IDX-001', title='Bellomassi Documentation Index', folder='25', file='BELLOMASSI_DOCUMENTATION_INDEX', category='Documentation Index',
    purpose='Master index of every document and supporting file in the documentation package.', scope=f'{len(order)} documents plus supporting files. No document is reviewed or approved yet.',
    related=['BM-IDX-002', 'BM-IDX-003', 'BM-DOC-002'], references=['BELLOMASSI_DOCUMENTATION_MASTER.md']), [
    dict(name='Documentation Index', headers=H13, rows=rows, widths=[12, 50, 22, 8, 22, 60, 20, 26, 40, 12, 12, 13, 13]),
    dict(name='Summary', headers=['Folder / format', 'Count'], rows=summary, widths=[50, 10])])
# ---------- DOC-002 inventory: Document | Existing | Status | Action
ex = []
for line in open(os.path.join(H, 'src', '23', 'existing_docs.md')):
    m = re.match(r'^\| (E-\d+) \| (.+?) \| (.+)\|$', line.strip())
    if m:
        cells = [c.strip() for c in m.group(3).split('|')]
        ex.append([m.group(1), m.group(2).replace('`', ''), 'Yes', cells[-2] if len(cells) >= 2 else '', cells[-1] if cells else '', '—'])
inv = [[r[0], r[1], 'Yes', 'Existing — ' + re.sub(r'\*\*', '', r[3]), 'Reviewed; preserved unchanged; ' + re.sub(r'\*\*', '', r[4]), 'BM-DOC-001'] for r in ex]
for i in order:
    d = docs[i]
    reuse = {'BM-DEP-003': 'Created — reuses E-14 text unchanged', 'BM-WF-00': 'Created — reuses E-18 diagrams'}.get(i, 'Created')
    if d['id'].startswith('BM-WF-'): reuse = 'Created — reuses workflow documentation (E-18) diagrams and facts'
    if d['id'].startswith('BM-MAN-1'): reuse = 'Created — generated from workflow chapter 04 (E-18)'
    inv.append([d['id'], d['title'], 'No', d.get('status', ''), reuse, ', '.join(files_of(d))])
tot = dict(existing=len(ex), created=len(order), updated=0)
xlsxlib.write_book(dict(id='BM-DOC-002', title='Document Inventory', folder='23', file='BM-DOC-002_Document_Inventory', category='Document Control',
    purpose='Inventory of existing and new documents with existence, status and action taken (Document | Existing | Status | Action).',
    scope=f'{len(ex)} existing items reviewed (none modified); {len(order)} documents created in this package.', related=['BM-DOC-001', 'BM-IDX-001'], references=['BM-DOC-001 Existing Documentation Review']), [
    dict(name='Document Inventory', headers=['Document ref / ID', 'Document', 'Existing', 'Status', 'Action', 'File(s) / reference'], rows=inv, widths=[14, 60, 9, 40, 50, 60]),
    dict(name='Totals', headers=['Measure', 'Count'], rows=[['Existing items reviewed', tot['existing']], ['Existing documents modified', 0], ['Existing documents reused (referenced / text reused)', tot['existing']],
         ['New documents created (IDs)', tot['created']], ['Documents pending (not created)', 0]], widths=[50, 10])])
# ---------- IDX-003 coverage map
items = []
t = open('/mnt/user-data/attachments/0991170d-32a9-505b-854f-c546a3123765/3b9989c7-attachment.txt').read()
secs = re.split(r'^# (\d+)\. (.+)$', t, flags=re.M)
for i in range(1, len(secs), 3):
    n, title, body = int(secs[i]), secs[i + 1], secs[i + 2]
    for a, b in re.findall(r'^(\d+)\. (.+)$', body, re.M):
        if 4 <= n <= 21: items.append((n, title.title(), int(a), b.strip()))
M = {4: {i: f'BM-OVW-{i:03d}' for i in range(1, 16)}, 6: {i: f'BM-SYS-{i:03d}' for i in range(1, 10)},
     8: {i: f'BM-WF-{i:02d}' for i in range(1, 25)}, 12: {i: f'BM-API-{i:03d}' for i in range(1, 18)}, 21: {}}
M[4].update({12: 'BM-GLO-001, BM-OVW-012', 13: 'BM-GLO-002, BM-OVW-012', 14: 'BM-OVW-014, BM-OVW-016'})
M[6][3] = 'BM-SYS-003 + 35 module FRDs (BM-FRD-*)'
M[9] = {1: 'BM-MAN-101', 2: 'BM-MAN-102', 3: 'BM-MAN-103', 4: 'BM-MAN-104', 5: 'BM-MAN-105', 6: 'BM-MAN-106', 7: 'BM-MAN-107, BM-MAN-001', 8: 'BM-MAN-112, BM-MAN-002', 9: 'BM-MAN-108', 10: 'BM-MAN-114 (PENDING CONFIRMATION — no Management role in system)'}
M[12][1] = 'BM-API-001, BM-API-018 (OpenAPI YAML), BM-API-019 (integrations)'
M[13] = {1: 'BM-SEC-001', 2: 'BM-SEC-002', 3: 'BM-SEC-003', 4: 'BM-SEC-004', 5: 'BM-SEC-005', 6: 'BM-SEC-005', 7: 'BM-SEC-003 §2', 8: 'BM-SEC-003 §3', 9: 'BM-SEC-003 §4', 10: 'BM-SEC-002 §2',
         11: 'BM-SEC-006 §2', 12: 'BM-SEC-006', 13: 'BM-SEC-007', 14: 'BM-SEC-008 §2', 15: 'BM-SEC-008 §3', 16: 'BM-SEC-006 §4', 17: 'BM-SEC-009 §1', 18: 'BM-SEC-009 §2', 19: 'BM-SEC-009 §3',
         20: 'BM-SEC-009 §5', 21: 'BM-SEC-009 §6', 22: 'BM-SEC-010', 23: 'BM-SEC-011 §1', 24: 'BM-SEC-011 §2', 25: 'BM-SEC-012'}
M[14] = {1: 'BM-INF-001', 2: 'BM-INF-002', 3: 'BM-INF-003', 4: 'BM-INF-003 §3', 5: 'BM-INF-004', 6: 'BM-INF-003 §2', 7: 'BM-INF-005', 8: 'BM-INF-006', 9: 'BM-INF-006, BM-DEP-002', 10: 'BM-INF-007 §2', 11: 'BM-INF-007 §1',
         12: 'BM-INF-005 §1, BM-DEP-002 Part A', 13: 'BM-INF-005 §1', 14: 'BM-INF-005 §1', 15: 'BM-INF-005 §1, BM-DEP-002 Part B', 16: 'BM-INF-005 §2', 17: 'BM-INF-008', 18: 'BM-INF-009', 19: 'BM-INF-009',
         20: 'BM-INF-010 §1', 21: 'BM-INF-010 §2', 22: 'BM-INF-010 §3'}
M[15] = {1: 'BM-UX-001', 2: 'BM-UX-002', 3: 'BM-UX-002 §1', 4: 'BM-UX-002 §2', 5: 'BM-UX-002 §3', 6: 'BM-UX-008 §3', 7: 'BM-UX-001 §3, BM-UX-008 §3', 8: 'BM-UX-008 §3', 9: 'BM-UX-007 §1, §4', 10: 'BM-UX-007 §2',
         11: 'BM-UX-001, BM-UX-005', 12: 'BM-UX-003', 13: 'BM-UX-004', 14: 'BM-UX-005', 15: 'BM-UX-008', 16: 'BM-UX-005 (validation rows), BM-UX-009', 17: 'BM-UX-001 §2, BM-UX-009'}
M[16] = {1: 'BM-QA-001', 2: 'BM-QA-002', 3: 'BM-QA-010', 4: 'BM-QA-011', 5: 'BM-QA-002 §3', 6: 'BM-QA-002 §3', 7: 'BM-QA-002 §3', 8: 'BM-QA-002 §3, BM-QA-013', 9: 'BM-QA-002 §3, BM-QA-013', 10: 'BM-QA-013, BM-SEC-005',
         11: 'BM-SEC-011 §2, BM-QA-002 §3', 12: 'BM-QA-002 §3, BM-QA-013', 13: 'BM-QA-003', 14: 'BM-QA-012', 15: 'BM-QA-004', 16: 'BM-QA-004 §4', 17: 'BM-QA-005', 18: 'BM-QA-006', 19: 'BM-QA-006 §2', 20: 'BM-SYS-008'}
M[17] = {1: 'BM-DEP-004, BM-DEP-001', 2: 'BM-DEP-002', 3: 'BM-DEP-008 §2', 4: 'BM-DEP-008 §3', 5: 'BM-DEP-008 §4', 6: 'BM-INF-006', 7: 'BM-DEP-008 §5', 8: 'BM-DEP-008 §6, BM-DAT-004', 9: 'BM-INF-005',
         10: 'BM-DEP-008 §7, BM-ADM-002', 11: 'BM-DEP-001', 12: 'BM-DEP-009 §1–2', 13: 'BM-DEP-009 §3', 14: 'BM-DEP-005', 15: 'BM-DEP-007 (Pre-deployment)', 16: 'BM-DEP-007 (Go-live readiness)', 17: 'BM-DEP-006', 18: 'BM-ADM-004, BM-INF-008'}
M[19] = {1: 'BM-PM-001', 2: 'BM-PLN-001 §2', 3: 'BM-PLN-001, BM-PLN-002', 4: 'BM-PM-002', 5: 'BM-PM-003', 6: 'BM-PM-004 (Resources)', 7: 'BM-OVW-010, BM-MAN-120', 8: 'BM-PM-004 (RACI)', 9: 'BM-RSK-002', 10: 'BM-PM-005 (Issues)',
         11: 'BM-PM-005 (Dependencies)', 12: 'BM-RSK-003', 13: 'BM-RSK-004', 14: 'BM-PM-005 (Decision Log)', 15: 'BM-PM-006 §1', 16: 'BM-PM-007', 17: 'BM-PM-006 §2', 18: 'BM-PM-008'}
M[20] = {i: f'BM-HND-{i:03d}' for i in range(1, 17)}
M[21] = {1: 'BM-RMP-001', 2: 'BM-RMP-002 §1', 3: 'BM-RMP-002 §2', 4: 'BM-RMP-002 §3', 5: 'BM-RMP-002 §4', 6: 'BM-RMP-003 §1', 7: 'BM-RMP-003 §2', 8: 'BM-RMP-002 §5', 9: 'BM-RMP-004', 10: 'BM-RMP-004', 11: 'BM-RMP-004', 12: 'BM-RMP-004',
         13: 'BM-RMP-005', 14: 'BM-RMP-005', 15: 'BM-RMP-005', 16: 'BM-RMP-005', 17: 'BM-RMP-005'}
FRDSEC = 'Section {n} of every module FRD (BM-FRD-*, 35 documents)'
cov = []
for n, title, a, b in items:
    tgt = FRDSEC.format(n=a) if n == 7 else M.get(n, {}).get(a, '')
    cov.append([f'§{n}.{a}', title, b, tgt, 'Covered' if tgt else 'NOT COVERED'])
extra_cov = [('§5.1', 'Business Requirements', 'BRD (18 sections incl. blank approval)', 'BM-BRD-001'), ('§5.2', 'Business Requirements', 'Scope of Work', 'BM-SOW-001'), ('§5.3', 'Business Requirements', 'Business requirement traceability', 'BM-BRD-002'),
    ('§10.1', 'System Architecture', 'HLD', 'BM-ARC-001'), ('§10.2', 'System Architecture', 'LLD', 'BM-ARC-002'), ('§10.3', 'System Architecture', 'Architecture diagrams (11)', 'BM-ARC-003, BM-DGM-001'),
    ('§11.A', 'Database', 'Current prototype data model', 'BM-DAT-001, BM-DAT-007'), ('§11.B', 'Database', 'Proposed production database design + ER diagram', 'BM-DAT-002'), ('§11', 'Database', 'Data dictionary', 'BM-DAT-003'),
    ('§11', 'Database', 'Data migration document', 'BM-DAT-004'), ('§11', 'Database', 'Data retention document', 'BM-DAT-005'), ('§16', 'Testing', 'Excel test cases with required columns', 'BM-QA-011, BM-QA-012, BM-QA-013'),
    ('§18', 'User Manuals', 'Driver manual', 'BM-MAN-001'), ('§18', 'User Manuals', 'Customer manual', 'BM-MAN-002'), ('§18', 'User Manuals', 'Office / Admin manual', 'BM-MAN-003, BM-ADM-001'),
    ('§22', 'Diagrams', '18 required diagrams (Mermaid + SVG / PNG)', 'BM-DGM-001 (DGM-01 … DGM-23)'), ('§26', 'Documentation Index', 'BELLOMASSI_DOCUMENTATION_INDEX.xlsx', 'BM-IDX-001'), ('§26', 'Documentation Index', 'BELLOMASSI_DOCUMENTATION_MASTER.md', 'BM-IDX-002'),
    ('§3', 'Repository', '25 folders', 'Package root'), ('§2', 'Analysis', 'Feature inventory, document inventory, gap analysis', 'BM-OVW-016, BM-DOC-001, BM-DOC-002, BM-DOC-003')]
for a, b, c, d in extra_cov: cov.append([a, b, c, d, 'Covered'])
allids = set(docs) | {'BM-API-018'}
for r in cov:
    for i in re.findall(r'BM-[A-Z]+-[0-9A-Z]+', r[3]):
        if i not in allids and not i.startswith('BM-FRD-') and i != 'BM-DGM-01': raise SystemExit(f'coverage map refers to unknown {i} ({r[0]})')
xlsxlib.write_book(dict(id='BM-IDX-003', title='Documentation Coverage Map (Brief to Documents)', folder='25', file='BM-IDX-003_Documentation_Coverage_Map', category='Documentation Index',
    purpose='Show where every document requested in the documentation brief is covered. Where several requested items are combined in one document, the section is given.',
    scope=f'{len(cov)} requested items from the brief (sections 2–26).', related=['BM-IDX-001', 'BM-IDX-002'], references=['Documentation brief (3b9989c7-attachment.txt)']), [
    dict(name='Coverage', headers=['Brief ref', 'Brief section', 'Requested document / item', 'Covered by', 'Coverage'], rows=cov, widths=[9, 30, 50, 60, 12])])
print('idx ok', len(order), 'docs;', len(cov), 'brief items;', sum(1 for r in cov if r[4] != 'Covered'), 'not covered')
