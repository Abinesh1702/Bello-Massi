"""Diagram catalogue (21), architecture diagrams doc (07 ARC-003) and exported .mmd / .svg / .png files."""
import os, re, shutil
from data import diagrams
from gen_req import fm, write
import build
from gen_wf import CH
OUT = os.path.join(build.ROOT, build.FOLDERS['21'])
for sub in ('mermaid', 'svg', 'png'): os.makedirs(os.path.join(OUT, sub), exist_ok=True)

def code(v):
    c = v[2]
    return CH[c[1]][1][c[2]].rstrip('\n') if isinstance(c, tuple) else c

def slug(s): return re.sub(r'[^A-Za-z0-9]+', '_', s).strip('_')

rows = []; secs = []
for k, v in diagrams.D.items():
    c = code(v); name = f'{k}_{slug(v[0])}'
    open(os.path.join(OUT, 'mermaid', name + '.mmd'), 'w').write(c + '\n')
    h = build.mermaid_assets(c)
    shutil.copy(os.path.join(build.CACHE, 'mm', h + '.svg'), os.path.join(OUT, 'svg', name + '.svg'))
    shutil.copy(os.path.join(build.CACHE, 'mm', h + '.png'), os.path.join(OUT, 'png', name + '.png'))
    src = f"docs/workflow chapter {v[2][1]}" if isinstance(v[2], tuple) else 'this catalogue'
    rows.append(f'| {k} | {v[0]} | {v[1]} | `mermaid/{name}.mmd` · `svg/{name}.svg` · `png/{name}.png` | {src} |')
    secs.append(f'## {k} — {v[0]}\n\nLabel: **{v[1]}**\n\n```mermaid\n{c}\n```')
intro = ['## 1. Catalogue\n\nEditable sources are Mermaid (`.mmd`) files; previews are exported as SVG and PNG in this folder. Diagrams never show a production component as existing: labels state VERIFIED (prototype) or PROPOSED (target).\n\n| ID | Diagram | Label | Files | Source |\n|---|---|---|---|---|\n' + '\n'.join(rows),
         '## 2. Editing\n\nEdit the `.mmd` file and re-render with Mermaid CLI: `mmdc -i mermaid/<file>.mmd -o svg/<file>.svg`. The workflow diagrams (DGM-03 … DGM-09) are maintained in `docs/workflow/` and copied here.']
write('21', 'DGM-001.md', fm(id='BM-DGM-001', title='Diagram Catalogue and Visual Documentation', folder='21', file='BM-DGM-001_Diagram_Catalogue', category='Diagrams and Visual Documentation', owner='Solution Architect', pdf=True,
      related=['BM-ARC-003', 'BM-ARC-001', 'BM-WF-00'], purpose='Provide all required architecture, process, data and operations diagrams in one place with editable sources.',
      scope=f'{len(diagrams.D)} diagrams (system architecture, business process, workflows, lifecycle, roles, RBAC, ER, data flow, deployment, network, authentication, integration, CI/CD, backup and recovery).') + '\n\n'.join(intro + secs) + '\n')
arch = ['DGM-19', 'DGM-20', 'DGM-01', 'DGM-23', 'DGM-12', 'DGM-13', 'DGM-14', 'DGM-15', 'DGM-16', 'DGM-21', 'DGM-22', 'DGM-10']
titles = {'DGM-19': 'System context diagram', 'DGM-20': 'Component diagram', 'DGM-01': 'Application / logical architecture diagram', 'DGM-23': 'Order processing architecture', 'DGM-12': 'Data flow diagram',
          'DGM-13': 'Deployment architecture diagram', 'DGM-14': 'Network architecture', 'DGM-15': 'Authentication flow diagram', 'DGM-16': 'Integration architecture diagram', 'DGM-21': 'Driver delivery architecture',
          'DGM-22': 'Customer application architecture', 'DGM-10': 'RBAC diagram'}
t = [f"## {i}. {titles[k]} ({k})\n\nLabel: **{diagrams.D[k][1]}**\n\n```mermaid\n{code(diagrams.D[k])}\n```" for i, k in enumerate(arch, 1)]
write('07', 'ARC-003.md', fm(id='BM-ARC-003', title='Architecture Diagrams', folder='07', file='BM-ARC-003_Architecture_Diagrams', category='System Architecture', owner='Solution Architect', pdf=True,
      related=['BM-ARC-001', 'BM-ARC-002', 'BM-DGM-001'], purpose='Collect the architecture diagrams required for design review.', scope='Context, component, application, logical, order processing, data flow, deployment, network, authentication, integration, driver delivery, customer app and RBAC diagrams.') + '\n\n'.join(t) + '\n')
print('diagrams', len(diagrams.D))
