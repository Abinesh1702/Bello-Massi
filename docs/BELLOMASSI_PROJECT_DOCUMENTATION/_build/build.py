"""Bellomassi documentation package builder.

Reads `_build/src/**/*.md` (Markdown + YAML front matter), adds the standard document-control block and revision
history, and writes for every document:  <folder>/<file>.md  ·  <folder>/<file>.docx  ·  <folder>/<file>.pdf (pdf: true).
Also writes `_build/data/registry.json` (used by the documentation index workbook).

Usage:  python3 build.py [--only ID[,ID]] [--no-pdf] [--no-docx]
Requires: pandoc, mermaid-cli (mmdc), Playwright (Node), python: pyyaml, lxml.
"""
import os, re, sys, json, hashlib, subprocess, base64, zipfile, html, datetime, glob
import yaml
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, 'src')
CACHE = os.path.join(HERE, 'cache')
sys.path.insert(0, HERE)
import post_docx

FOLDERS = {
    '01': '01_PROJECT_OVERVIEW', '02': '02_BUSINESS_REQUIREMENTS', '03': '03_SYSTEM_REQUIREMENTS',
    '04': '04_FUNCTIONAL_REQUIREMENTS', '05': '05_SCOPE_AND_PLANNING', '06': '06_BUSINESS_WORKFLOWS',
    '07': '07_SYSTEM_ARCHITECTURE', '08': '08_DATABASE_AND_DATA_DESIGN', '09': '09_API_AND_INTEGRATION',
    '10': '10_SECURITY_AND_COMPLIANCE', '11': '11_INFRASTRUCTURE_AND_DEVOPS', '12': '12_UI_UX_AND_DESIGN',
    '13': '13_TESTING_AND_QUALITY_ASSURANCE', '14': '14_DEPLOYMENT_AND_RELEASE', '15': '15_USER_MANUALS',
    '16': '16_ADMINISTRATION_AND_CONFIGURATION', '17': '17_PROJECT_MANAGEMENT', '18': '18_RISK_AND_CHANGE_MANAGEMENT',
    '19': '19_CLIENT_HANDOVER', '20': '20_FUTURE_ROADMAP', '21': '21_DIAGRAMS_AND_VISUAL_DOCUMENTATION',
    '22': '22_GLOSSARY_AND_REFERENCE', '23': '23_DOCUMENT_CONTROL', '24': '24_PROJECT_PRESENTATION',
    '25': '25_DOCUMENTATION_INDEX',
}
TODAY = '2026-11-12'
PREPARED = 'Project documentation team (AI-assisted draft prepared from source-code analysis)'
DEFAULT_STATUS = 'Draft — for client review'
LENIENT = '--lenient' in sys.argv
MISSING = set()
LABELS = ['VERIFIED', 'PROTOTYPE', 'PROPOSED', 'PENDING CONFIRMATION', 'NOT IMPLEMENTED', 'NOT VERIFIED']


def load_docs():
    docs = []
    for path in sorted(glob.glob(os.path.join(SRC, '**', '*.md'), recursive=True)):
        raw = open(path, encoding='utf-8').read()
        m = re.match(r'^---\n(.*?)\n---\n(.*)$', raw, re.S)
        if not m:
            sys.exit(f'missing front matter: {path}')
        meta = yaml.safe_load(m.group(1)); meta['body'] = m.group(2); meta['src'] = path
        for k in ('id', 'title', 'folder', 'file', 'purpose', 'scope'):
            if k not in meta: sys.exit(f'{path}: front matter needs {k}')
        meta['folder'] = str(meta['folder']).zfill(2)
        meta.setdefault('version', '1.0'); meta['version'] = str(meta['version'])
        meta.setdefault('status', DEFAULT_STATUS)
        meta.setdefault('category', FOLDERS[meta['folder']].split('_', 1)[1].replace('_', ' ').title())
        meta.setdefault('owner', 'Business Analyst')
        meta.setdefault('module', 'All modules')
        meta.setdefault('related', []); meta.setdefault('references', []); meta.setdefault('definitions', [])
        meta.setdefault('created', TODAY); meta.setdefault('updated', TODAY)
        meta.setdefault('history', [[meta['version'], TODAY, 'Documentation team', 'Initial draft prepared from analysis of the bellomassi-premium-ui source code and existing project documents.']])
        meta.setdefault('pdf', False); meta.setdefault('toc', None)
        docs.append(meta)
    ids = [d['id'] for d in docs]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup: sys.exit(f'duplicate document IDs: {dup}')
    return docs


def rel_link(src_doc, dst_doc):
    a = os.path.join(FOLDERS[src_doc['folder']]); b = os.path.join(FOLDERS[dst_doc['folder']], dst_doc['file'] + '.' + dst_doc.get('ext', 'md'))
    return os.path.relpath(b, a)


def control_block(d):
    rows = [('Document title', d['title']), ('Document ID', d['id']), ('Version', d['version']), ('Status', d['status']),
            ('Category', d['category']), ('Related module(s)', d['module']), ('Document owner', d['owner']),
            ('Prepared by', PREPARED), ('Reviewed by', '_Pending — not yet reviewed_'),
            ('Approval', '_Not approved — awaiting client review (no approval has been given)_'),
            ('Created date', d['created']), ('Last updated date', d['updated'])]
    t = '| Field | Value |\n|---|---|\n' + '\n'.join(f'| {a} | {b} |' for a, b in rows)
    return t


def expand(d, byid, mode):
    """mode md: relative links; mode doc: text references."""
    body = d['body']
    def ref(m):
        rid = m.group(1)
        if rid not in byid:
            if LENIENT: MISSING.add((d['id'], rid)); return f'**{rid}**'
            raise SystemExit(f"{d['id']}: unknown reference {rid}")
        t = byid[rid]
        if mode == 'md': return f"[{rid} — {t['title']}]({rel_link(d, t)})"
        return f"**{rid}** ({t['title']})"
    body = re.sub(r'\{\{ref:([A-Z0-9-]+)\}\}', ref, body)
    return body


def assemble(d, byid, mode):
    parts = []
    parts.append('## Document control\n\n' + control_block(d))
    parts.append('> **Status labels used in this document:** VERIFIED (confirmed in the current source code or existing documents) · '
                 'PROTOTYPE (works in the React/LocalStorage prototype with mock or simulated behaviour) · PROPOSED (recommended '
                 'production design, not built) · PENDING CONFIRMATION (needs a client decision) · NOT IMPLEMENTED · NOT VERIFIED.')
    parts.append('## Purpose\n\n' + d['purpose'].strip())
    parts.append('## Scope\n\n' + d['scope'].strip())
    defs = d['definitions']
    dtxt = '| Term | Definition |\n|---|---|\n' + '\n'.join(f'| {a} | {b} |' for a, b in defs) + '\n\n' if defs else ''
    gl = byid.get('BM-GLO-001')
    dtxt += ('Other terms: see ' + (f"{{{{ref:BM-GLO-001}}}}" if gl else 'the Project Glossary') + '.')
    parts.append('## Definitions\n\n' + dtxt)
    refs = list(d['references']) + [f'{{{{ref:{r}}}}}' for r in d['related'] if r in byid]
    parts.append('## References\n\n' + ('\n'.join(f'- {r}' for r in refs) if refs else '- Source code: `bellomassi-premium-ui` (React 19 / Vite 8, LocalStorage data version 8).'))
    body = d['body'].strip()
    if d['toc'] or (d['toc'] is None and body.count('\n## ') >= 6):
        heads = re.findall(r'^## (.+)$', body, re.M)
        parts.append('## Contents\n\n' + '\n'.join(f'- {h}' for h in heads))
    parts.append(body)
    hist = '| Version | Date | Author | Description |\n|---|---|---|---|\n' + '\n'.join(f'| {a} | {b} | {c} | {e} |' for a, b, c, e in d['history'])
    parts.append('## Revision history\n\n' + hist)
    text = '\n\n'.join(parts)
    d2 = dict(d, body=text)
    return expand(d2, byid, mode)


def mermaid_assets(code):
    h = hashlib.sha1(code.encode()).hexdigest()[:12]
    base = os.path.join(CACHE, 'mm', h)
    if not os.path.exists(base + '.png'):
        open(base + '.mmd', 'w').write(code)
        for ext, extra in (('.svg', []), ('.png', ['-s', '2', '-b', 'white'])):
            r = subprocess.run(['mmdc', '-p', os.path.join(HERE, 'puppeteer.json'), '-c', os.path.join(HERE, 'mermaid-config.json'),
                                '-i', base + '.mmd', '-o', base + ext, '-q'] + extra, capture_output=True, text=True)
            if r.returncode: raise SystemExit('mermaid failed: ' + code[:200] + r.stderr[-400:])
    return h


def image_width_cm(h):
    from PIL import Image
    w = Image.open(os.path.join(CACHE, 'mm', h + '.png')).size[0] / 2
    return min(17.0, w * 17.0 / 680)


def to_docx(d, text):
    def rep(m):
        h = mermaid_assets(m.group(1))
        return f'\n\n![]({os.path.join(CACHE, "mm", h + ".png")}){{width={image_width_cm(h):.2f}cm}}\n\n'
    text = re.sub(r'```mermaid\n(.*?)```', rep, text, flags=re.S)
    # local images (screenshots) are referenced relative to the output folder
    meta = f'---\ntitle: "{d["title"]}"\nsubtitle: "Bellomassi Order-to-Delivery Management Platform"\nauthor: "{d["id"]} · Version {d["version"]} · {d["status"]}"\ndate: "{d["updated"]}"\n---\n\n'
    out_dir = os.path.join(ROOT, FOLDERS[d['folder']])
    src = os.path.join(CACHE, d['id'] + '.docx.md'); open(src, 'w').write(meta + text)
    dst = os.path.join(out_dir, d['file'] + '.docx')
    raw = dst + '.raw'
    subprocess.run(['pandoc', '-f', 'commonmark_x+yaml_metadata_block', '-t', 'docx', '--reference-doc', os.path.join(HERE, 'ref', 'reference.docx'),
                    '--resource-path', out_dir + ':' + ROOT, '-o', raw, src], check=True)
    finish_docx(raw, dst, f'{d["id"]} · v{d["version"]}')
    os.remove(raw)


def finish_docx(src, dst, docref):
    from lxml import etree
    tmp = dst + '.tmp'
    with zipfile.ZipFile(src) as zin, zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename.endswith('/'): continue
            data = zin.read(item.filename)
            if item.filename == 'word/document.xml':
                root = etree.fromstring(data); post_docx.fix_tables(root); post_docx.reorder(root)
                data = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
            elif item.filename.startswith('word/header'):
                data = data.replace(b'DOCREFPLACEHOLDER', html.escape(docref).encode())
            elif item.filename == 'word/settings.xml':
                data = b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>'
            elif item.filename == '[Content_Types].xml':
                for ext, ct in ((b'png', b'image/png'), (b'jpeg', b'image/jpeg'), (b'jpg', b'image/jpeg'), (b'svg', b'image/svg+xml')):
                    if b'Extension="' + ext + b'"' not in data:
                        data = data.replace(b'</Types>', b'<Default Extension="' + ext + b'" ContentType="' + ct + b'"/></Types>')
            elif item.filename == 'word/numbering.xml':
                data = re.sub(rb'w:nsid w:val="([0-9A-Fa-f]+)"', lambda m: b'w:nsid w:val="' + m.group(1)[-8:].rjust(8, b'0') + b'"', data)
            elif item.filename == 'word/styles.xml':
                root2 = etree.fromstring(data); post_docx.reorder(root2)
                data = etree.tostring(root2, xml_declaration=True, encoding='UTF-8', standalone=True)
            zout.writestr(item, data)
    os.replace(tmp, dst)


CSS = open(os.path.join(HERE, 'doc.css')).read()


def to_html(d, text):
    out_dir = os.path.join(ROOT, FOLDERS[d['folder']])
    def rep(m):
        h = mermaid_assets(m.group(1))
        svg = open(os.path.join(CACHE, 'mm', h + '.svg'), 'rb').read()
        from PIL import Image
        w = Image.open(os.path.join(CACHE, 'mm', h + '.png')).size[0] / 2
        return f'\n\n<figure class="diagram"><img src="data:image/svg+xml;base64,{base64.b64encode(svg).decode()}" style="width:{min(w, 680):.0f}px"></figure>\n\n'
    text = re.sub(r'```mermaid\n(.*?)```', rep, text, flags=re.S)
    body = subprocess.run(['pandoc', '-f', 'commonmark_x', '-t', 'html5', '--wrap=none'], input=text, capture_output=True, text=True, check=True).stdout
    body = re.sub(r'<colgroup>.*?</colgroup>', '', body, flags=re.S)
    body = re.sub(r' style="width:[0-9.]+%;"', '', body)
    body = re.sub(r'<code>(.*?)</code>', lambda m: '<code>' + re.sub(r'([/_.,])(?=\w)', r'\1<wbr>', m.group(1)) + '</code>', body, flags=re.S)
    def tcls(m):
        t = m.group(0); n = len(re.findall(r'<th', t.split('</thead>')[0]))
        t = re.sub(r'(<td[^>]*>)(.*?)(</td>)', lambda c: c.group(1) + re.sub(r'(?<=[A-Za-z])_(?=[A-Z])', '_<wbr>', c.group(2)) + c.group(3), t, flags=re.S)
        if n > 8: return t.replace('<table>', '<table class="wide">', 1)
        if n >= 6: return t.replace('<table>', '<table class="dense">', 1)
        return t
    body = re.sub(r'<table>.*?</table>', tcls, body, flags=re.S)
    # images relative to output folder -> absolute file URLs
    body = re.sub(r'<img src="(?!data:|file:|http)([^"]+)"', lambda m: f'<img src="file://{os.path.abspath(os.path.join(out_dir, m.group(1)))}"', body)
    cover = f'''<section class="cover"><div class="brand"><span class="mark">B</span> BELLOMASSI</div><div class="cover-main"><p class="kicker">{html.escape(d["category"])}</p>
<h1 class="cover-title">{html.escape(d["title"])}</h1><p class="cover-sub">Bellomassi Order-to-Delivery Management Platform</p></div>
<table class="cover-meta"><tr><th>Document ID</th><td>{d["id"]}</td></tr><tr><th>Version</th><td>{d["version"]}</td></tr><tr><th>Status</th><td>{html.escape(d["status"])}</td></tr><tr><th>Date</th><td>{d["updated"]}</td></tr></table></section>'''
    head = f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{html.escape(d["title"])}</title><style>{CSS}</style></head>'
    p = os.path.join(CACHE, 'html', d['id'] + '.html'); open(p, 'w').write(f'{head}<body class="print"><main class="content">{body}</main></body></html>')
    c = os.path.join(CACHE, 'html', d['id'] + '.cover.html'); open(c, 'w').write(f'{head}<body class="print">{cover}</body></html>')
    return p, c


def run_pdfs(jobs):
    if not jobs: return
    jf = os.path.join(CACHE, 'pdfjobs.json'); json.dump(jobs, open(jf, 'w'))
    env = dict(os.environ, NODE_PATH=subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
    subprocess.run(['node', os.path.join(HERE, 'pdf_batch.cjs'), jf], check=True, env=env)
    from pypdf import PdfReader, PdfWriter
    for j in jobs:
        w = PdfWriter()
        for f in (j['pdf'] + '.cover', j['pdf'] + '.body'):
            for pg in PdfReader(f).pages: w.add_page(pg)
        w.add_metadata({'/Title': j['ref'], '/Author': 'Bellomassi project documentation (draft)'})
        with open(j['pdf'], 'wb') as fh: w.write(fh)
        os.remove(j['pdf'] + '.cover'); os.remove(j['pdf'] + '.body')


def main():
    args = sys.argv[1:]
    only = None
    if '--only' in args: only = set(args[args.index('--only') + 1].split(','))
    docs = load_docs(); byid = {d['id']: d for d in docs}
    xreg = os.path.join(HERE, 'data', 'xlsx_registry.json')
    if os.path.exists(xreg):
        for k, v in json.load(open(xreg)).items():
            if k in byid: sys.exit(f'ID used by both md and xlsx: {k}')
            byid[k] = v
    for k in FOLDERS.values(): os.makedirs(os.path.join(ROOT, k), exist_ok=True)
    jobs = []
    for d in docs:
        if only and d['id'] not in only: continue
        out_dir = os.path.join(ROOT, FOLDERS[d['folder']])
        md = f"# {d['title']}\n\n" + assemble(d, byid, 'md')
        open(os.path.join(out_dir, d['file'] + '.md'), 'w').write(md)
        doc_text = assemble(d, byid, 'doc')
        if '--no-docx' not in args: to_docx(d, doc_text)
        if d['pdf'] and '--no-pdf' not in args:
            body_html, cover_html = to_html(d, doc_text)
            jobs.append({'html': body_html, 'cover': cover_html, 'pdf': os.path.join(out_dir, d['file'] + '.pdf'), 'ref': f"{d['id']} · {d['title']} · v{d['version']}"})
        pass
    run_pdfs(jobs)
    reg = [{k: d[k] for k in ('id', 'title', 'folder', 'file', 'version', 'status', 'category', 'owner', 'module', 'related', 'created', 'updated', 'pdf')} for d in docs]
    json.dump(reg, open(os.path.join(HERE, 'data', 'registry.json'), 'w'), indent=1)
    print('documents', len(docs))
    if MISSING: print('MISSING TARGETS', sorted({b for a, b in MISSING}))


if __name__ == '__main__':
    main()
