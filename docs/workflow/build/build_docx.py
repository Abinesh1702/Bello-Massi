import re, os, json, subprocess, zipfile
import build_html as B
OUT = B.OUT; DIST = B.DIST
md = open(os.path.join(OUT, 'combined.md')).read()
def rep(m):
    parts = B.slices(m.group(1)); res = []
    for i, (p, w, h) in enumerate(parts):
        wcm = min(17.0, w * 17.0 / 680)
        res.append(f'![]({p}){{width={wcm:.2f}cm}}')
        if len(parts) > 1: res.append(f'*Diagram continued ({i + 1} of {len(parts)})*')
    return '\n\n' + '\n\n'.join(res) + '\n\n'
md = re.sub(r'!\[\]\(mm/(\w+)\.png\)\{\.diagram data-h="\w+"\}', rep, md)
meta = f'''---
title: "Complete Application Workflow Documentation"
subtitle: "Bellomassi Order-to-Delivery Platform"
author: "Version {B.VERSION} · bellomassi-premium-ui · application data version 8"
date: "{B.DATE}"
abstract: "Business workflows, role responsibilities, status lifecycles, a screen-by-screen guide and a technical reference for every module, prepared from the application source code. Scope: 13 roles, 36 modules, 197 screens, 38 workflow diagrams. Documentation only: no application code, UI, routes or LocalStorage were changed."
toc-title: "Contents"
---

'''
src = os.path.join(OUT, 'docx.md'); open(src, 'w').write(meta + md)
dst = os.path.join(DIST, 'Bellomassi-Workflow-Documentation.docx')
subprocess.run(['pandoc', '-f', 'commonmark_x+yaml_metadata_block', '-t', 'docx', '--toc', '--toc-depth=2',
                '--reference-doc', os.path.join(B.HERE, 'ref', 'reference.docx'), '-o', dst, src], check=True, cwd=OUT)
print('docx written', os.path.getsize(dst))

# ---- post-process: table widths + pre-filled TOC with page numbers from a LibreOffice render ----
import post_docx, pdfplumber, shutil, tempfile
raw = dst + '.raw.docx'; shutil.move(dst, raw)
heads = post_docx.process(raw, dst, {})
tmpd = tempfile.mkdtemp()
shutil.copy(dst, os.path.join(tmpd, 'd.docx'))
subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', tmpd, os.path.join(tmpd, 'd.docx')], capture_output=True, timeout=600)
norm = lambda t: re.sub(r'[^a-z0-9]+', '', t.lower())
pages = {}; cur = 0
with pdfplumber.open(os.path.join(tmpd, 'd.pdf')) as d:
    lines = []
    for p in d.pages:
        ls = [norm(l) for l in (p.extract_text() or '').split('\n')]
        lines.append(set(ls) | {ls[i] + ls[i + 1] for i in range(len(ls) - 1)})
    npages = len(lines)
# skip the cover and contents pages when searching
start = next(i for i, s in enumerate(lines) if norm('About this document') in s and i > 1)
cur = start
for lvl, bm, t in heads:
    k = norm(t)
    for i in range(cur, npages):
        if k in lines[i]: pages[bm] = i + 1; cur = i; break
print('docx pages', npages, 'toc resolved', len(pages), 'of', len(heads))
post_docx.process(raw, dst, pages)
os.remove(raw)
subprocess.run(['zip', '-d', dst, '*/'], capture_output=True)
