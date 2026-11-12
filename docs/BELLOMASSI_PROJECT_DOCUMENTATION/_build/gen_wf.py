"""Generate the workflow catalogue and 24 workflow specifications (folder 06)."""
import os, re, json
from data import model2, wfdata
from gen_req import fm, write, FR2TC
WFDIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'workflow')
CH = {}
for f in os.listdir(WFDIR):
    if re.match(r'\d\d-', f): CH[f[:2]] = (f, re.findall(r'```mermaid\n(.*?)```', open(os.path.join(WFDIR, f)).read(), re.S))
rows = []
for w in model2.WFS:
    wid, name, role, trig, outc, frs, ch = w
    d = wfdata.W[wid]; num = wid.split('-')[1]
    t = [f"## 1. Workflow summary\n\n| Field | Value |\n|---|---|\n| Workflow ID | {wid} |\n| Workflow name | {name} |\n| Business purpose | {d['purpose']} |\n| Initiating role | {role} |\n| Trigger | {trig} |\n| Preconditions | {d['pre']} |\n| Final outcome | {d['outcome']} |\n| Related requirements | {frs.replace(' ', ', ')} |\n| Related test cases | {', '.join(t for x in frs.split() for t in FR2TC.get(x, []))} |\n| Detailed chapter | `docs/workflow/` chapter {ch} |"]
    t.append('## 2. Step-by-step process\n\n' + '\n'.join(f'{i}. {s}' for i, s in enumerate(d['steps'], 1)))
    t.append(f"## 3. Decision points\n\n{d['decisions']}")
    t.append(f"## 4. Approval conditions\n\n{d['approve']}")
    t.append(f"## 5. Rejection conditions\n\n{d['reject']}")
    t.append(f"## 6. System actions\n\n{d['sys']}")
    t.append(f"## 7. User actions\n\n{d['user']}")
    t.append(f"## 8. Status changes\n\n{d['status']}")
    t.append(f"## 9. Notifications\n\n{d['notif']}")
    t.append(f"## 10. Exception scenarios\n\n{d['exc']}")
    dg = []
    for x in d['diagrams']:
        code = CH[x[1]][1][x[2]] if x[0] == 'ch' else wfdata.NEW[x[1]]
        dg.append('```mermaid\n' + code.rstrip('\n') + '\n```')
    t.append('## 11. Workflow diagram\n\n' + '\n\n'.join(dg) + '\n\nImplementation label: diagrams describe the **prototype behaviour (VERIFIED in source code)** unless a step is marked PROPOSED / NOT IMPLEMENTED.')
    t.append(f"## 12. Final outcome\n\n{d['outcome']}")
    fname = f"BM-WF-{num}_{re.sub(r'[^A-Za-z0-9]+', '_', name).strip('_')}"
    write('06', f'WF-{num}.md', fm(id=f'BM-WF-{num}', title=f'{wid} — {name}', folder='06', file=fname, category='Business Workflows', owner='Business Analyst',
          related=['BM-WF-00', 'BM-SYS-008'], purpose=d['purpose'], scope=f'Workflow {wid} as implemented in the prototype, with production differences marked.') + '\n\n'.join(t) + '\n')
    rows.append(f'| {wid} | {{{{ref:BM-WF-{num}}}}} | {role} | {trig} | {outc} |')
cat = ['## 1. Workflow catalogue\n\n| ID | Workflow | Initiating role | Trigger | Outcome |\n|---|---|---|---|---|\n' + '\n'.join(rows),
       '## 2. Relationship to the existing workflow documentation\n\nThe complete workflow documentation delivered on 12 November 2026 (`docs/workflow/`, 20 chapters, 38 diagrams, HTML / PDF / DOCX editions) is **preserved unchanged** and remains the narrative source. The 24 specifications in this folder restate each workflow in the standard enterprise format (ID, purpose, initiating role, preconditions, trigger, steps, decisions, approval / rejection conditions, system and user actions, status changes, notifications, exceptions, outcome) and link it to requirements and test cases.',
       '## 3. Order lifecycle (overview)\n\n```mermaid\n' + CH['17'][1][0].rstrip('\n') + '\n```']
write('06', 'WF-00.md', fm(id='BM-WF-00', title='Business Workflow Catalogue', folder='06', file='BM-WF-00_Business_Workflow_Catalogue', category='Business Workflows', pdf=True,
      related=['BM-SYS-008', 'BM-ARC-001'], purpose='Index of all 24 business workflows with links to their specifications and to the existing workflow documentation.',
      scope='Order-to-delivery, approval, consolidation, dispatch, driver, customer, inventory, scrap, VMS, invoice, communication, exceptions, rejection, cancellation, returns, documents, notifications, reporting.') + '\n\n'.join(cat) + '\n')
print('workflows', len(rows))
