import os, json, re, subprocess, pdfplumber
from pypdf import PdfReader, PdfWriter
import build_html as B
HERE = B.HERE; OUT = B.OUT; DIST = B.DIST
env = dict(os.environ, NODE_PATH=subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
def pdf(inp, out, mode):
    subprocess.run(['node', os.path.join(HERE, 'pdf.cjs'), inp, out, mode], check=True, env=env, cwd=OUT)
pdf(os.path.join(OUT, 'print-cover.html'), os.path.join(OUT, 'cover.pdf'), 'cover')
pdf(os.path.join(OUT, 'print-body.html'), os.path.join(OUT, 'body.pdf'), 'body')
norm = lambda t: re.sub(r'[^a-z0-9]+', '', t.lower())
texts = []; joined = []
with pdfplumber.open(os.path.join(OUT, 'body.pdf')) as doc:
    for p in doc.pages:
        ls = [norm(l) for l in (p.extract_text() or '').split('\n')]
        cand = set(ls) | {ls[i] + ls[i + 1] for i in range(len(ls) - 1)} | {ls[i] + ls[i + 1] + ls[i + 2] for i in range(len(ls) - 2)}
        texts.append(cand); joined.append(''.join(ls))
toc = json.load(open(os.path.join(OUT, 'toc.json')))
pages = {}; cur = 0; missing = []
for lvl, hid, t in toc:
    key = norm(t)
    for i in range(cur, len(texts)):
        if key and key in texts[i]:
            pages[hid] = i + 1; cur = i; break
    else:
        hit = next((i for i in range(cur, len(joined)) if key[:40] in joined[i]), None)
        if hit is None: missing.append(t); pages[hid] = cur + 1
        else: pages[hid] = hit + 1; cur = hit
print('body pages', len(texts), 'toc missing', len(missing), missing[:5])
B.write_toc(pages)
pdf(os.path.join(OUT, 'print-toc.html'), os.path.join(OUT, 'toc.pdf'), 'toc')
w = PdfWriter()
for f in ('cover.pdf', 'toc.pdf', 'body.pdf'):
    for p in PdfReader(os.path.join(OUT, f)).pages: w.add_page(p)
offset = len(PdfReader(os.path.join(OUT, 'cover.pdf')).pages) + len(PdfReader(os.path.join(OUT, 'toc.pdf')).pages)
parent = None
for lvl, hid, t in toc:
    if hid not in pages: continue
    if lvl == 1: parent = w.add_outline_item(t, offset + pages[hid] - 1)
    else: w.add_outline_item(t, offset + pages[hid] - 1, parent=parent)
w.add_metadata({'/Title': B.TITLE, '/Author': 'Bellomassi', '/Subject': 'Application workflow documentation v' + B.VERSION})
w.page_mode = '/UseOutlines'
dst = os.path.join(DIST, 'Bellomassi-Workflow-Documentation.pdf')
with open(dst, 'wb') as f: w.write(f)
print('pdf pages', len(w.pages), 'toc pages', offset - 1)
