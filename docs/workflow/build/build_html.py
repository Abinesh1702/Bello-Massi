"""Build the consolidated HTML editions (screen + print) from out/combined.md."""
import re, os, json, base64, subprocess, html, datetime
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out')
DIST = os.path.join(os.path.dirname(HERE), 'dist'); os.makedirs(DIST, exist_ok=True)
VERSION = '1.0'; DATE = datetime.date.today().strftime('%d %B %Y')
TITLE = 'Bellomassi — Complete Application Workflow Documentation'
md = open(os.path.join(OUT, 'combined.md')).read()
chapters = json.load(open(os.path.join(OUT, 'chapters.json')))
CONTENT_W = 680      # CSS px usable width on A4 with 15 mm margins
MAX_H = 900          # CSS px max slice height on one printed page
os.makedirs(os.path.join(OUT, 'slices'), exist_ok=True)

def slices(h):
    """Cut a tall diagram PNG at near-white rows so each part fits one printed page."""
    im = Image.open(os.path.join(OUT, 'mm', h + '.png')).convert('RGB')
    W, H = im.size; w1 = W / 2
    s = min(1.0, CONTENT_W / w1); disp_w = w1 * s
    max_px = int(MAX_H / s * 2)       # rows (2x png) per slice
    if H <= max_px: return [(os.path.join('mm', h + '.png'), disp_w, H / 2 * s)]
    gray = im.convert('L'); px = gray.load()
    def blank(y):
        step = max(1, W // 400)
        return all(px[x, y] > 245 for x in range(0, W, step))
    cuts = [0]; y0 = 0
    while H - y0 > max_px:
        target = y0 + max_px; y = target
        while y > y0 + max_px * 0.55 and not blank(y): y -= 2
        if y <= y0 + max_px * 0.55: y = target
        cuts.append(y); y0 = y
    cuts.append(H)
    out = []
    for i in range(len(cuts) - 1):
        p = os.path.join('slices', f'{h}-{i}.png')
        im.crop((0, cuts[i], W, cuts[i + 1])).save(os.path.join(OUT, p))
        out.append((p, disp_w, (cuts[i + 1] - cuts[i]) / 2 * s))
    return out

def diagram_screen(h):
    svg = open(os.path.join(OUT, 'mm', h + '.svg'), 'rb').read()
    w = Image.open(os.path.join(OUT, 'mm', h + '.png')).size[0] / 2
    uri = 'data:image/svg+xml;base64,' + base64.b64encode(svg).decode()
    return f'<figure class="diagram"><img src="{uri}" style="width:{min(w, 1040):.0f}px" alt="Workflow diagram"></figure>'

def diagram_print(h, embed):
    parts = slices(h); res = []
    for i, (p, w, hh) in enumerate(parts):
        src = p if not embed else 'data:image/png;base64,' + base64.b64encode(open(os.path.join(OUT, p), 'rb').read()).decode()
        cap = f'<figcaption>Diagram continued ({i + 1} of {len(parts)})</figcaption>' if len(parts) > 1 else ''
        res.append(f'<figure class="diagram slice"><img src="{src}" style="width:{w:.0f}px;height:{hh:.0f}px" alt="Workflow diagram">{cap}</figure>')
    return '\n'.join(res)

def to_html(variant):
    def rep(m):
        h = m.group(1)
        return '\n\n<div class="dg" data-h="' + h + '"></div>\n\n'
    src = re.sub(r'!\[\]\(mm/(\w+)\.png\)\{\.diagram data-h="\w+"\}', rep, md)
    body = subprocess.run(['pandoc', '-f', 'commonmark_x', '-t', 'html5', '--wrap=none'], input=src, capture_output=True, text=True, check=True).stdout
    body = re.sub(r'<div class="dg" data-h="(\w+)"></div>', lambda m: diagram_screen(m.group(1)) if variant == 'screen' else diagram_print(m.group(1), embed=False), body)
    body = re.sub(r'<colgroup>.*?</colgroup>', '', body, flags=re.S)
    body = re.sub(r' style="width:[0-9.]+%;"', '', body)
    body = re.sub(r'<code>(.*?)</code>', lambda m: '<code>' + re.sub(r'([/_.,])(?=\w)', r'\1<wbr>', m.group(1)) + '</code>', body, flags=re.S)
    # dense tables (many columns) get a compact style
    def tcls(m):
        t = m.group(0)
        n = len(re.findall(r'<th', t.split('</thead>')[0]))
        t = re.sub(r'(<td[^>]*>)(.*?)(</td>)', lambda c: c.group(1) + re.sub(r'(?<=[A-Za-z])_(?=[A-Z])', '_<wbr>', c.group(2)) + c.group(3), t, flags=re.S)
        if n > 8: return t.replace('<table>', '<table class="wide">', 1)
        if n >= 6: return t.replace('<table>', '<table class="dense">', 1)
        return t
    body = re.sub(r'<table>.*?</table>', tcls, body, flags=re.S)
    # chapter sections (page break before each H1)
    body = re.sub(r'<h1 id="([^"]+)">', r'<h1 class="chapter" id="\1">', body)
    # TOC from H1/H2
    toc = []
    for lvl, hid, text in re.findall(r'<h([12])[^>]*id="([^"]+)"[^>]*>(.*?)</h\1>', body):
        t = re.sub('<[^>]+>', '', text)
        toc.append((int(lvl), hid, html.unescape(t)))
    json.dump(toc, open(os.path.join(OUT, 'toc.json'), 'w'))
    return body, toc

CSS = open(os.path.join(HERE, 'doc.css')).read()

def cover():
    return f'''<section class="cover">
<div class="brand"><span class="mark">B</span> BELLOMASSI</div>
<div class="cover-main">
<p class="kicker">Order-to-Delivery Platform</p>
<h1 class="cover-title">Complete Application<br>Workflow Documentation</h1>
<p class="cover-sub">Business workflows, role responsibilities, status lifecycles, screen guide and technical reference — prepared from the application source code.</p>
</div>
<table class="cover-meta"><tr><th>Version</th><td>{VERSION}</td></tr><tr><th>Date</th><td>{DATE}</td></tr>
<tr><th>Application</th><td>bellomassi-premium-ui · data version 8 · React 19 / Vite / LocalStorage prototype</td></tr>
<tr><th>Scope</th><td>13 roles · 36 modules · 197 screens · 38 workflow diagrams</td></tr>
<tr><th>Status</th><td>Documentation only — no application code, UI, routes or storage were changed</td></tr></table>
</section>'''

def toc_html(toc, pages=None):
    rows = []
    for lvl, hid, t in toc:
        pg = f'<span class="pg">{pages.get(hid, "")}</span>' if pages is not None else ''
        rows.append(f'<li class="l{lvl}"><a href="#{hid}"><span class="t">{html.escape(t)}</span>{"<span class=dots></span>" if pages is not None else ""}{pg}</a></li>')
    return '<section class="toc"><h2 class="toc-title">Contents</h2><ul>' + '\n'.join(rows) + '</ul></section>'

def page(inner, cls):
    return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bellomassi Workflow Documentation</title><style>{CSS}</style></head><body class="{cls}">{inner}</body></html>'

def write_toc(pages):
    toc = json.load(open(os.path.join(OUT, 'toc.json')))
    open(os.path.join(OUT, 'print-toc.html'), 'w').write(page(toc_html(toc, pages), 'print'))

if __name__ == '__main__':
    body, toc = to_html('screen')
    chapter_toc = [x for x in toc]
    open(os.path.join(DIST, 'Bellomassi-Workflow-Documentation.html'), 'w').write(
        page(cover() + toc_html(chapter_toc) + '<main class="content">' + body + '</main>', 'screen'))
    pbody, _ = to_html('print')
    open(os.path.join(OUT, 'print-body.html'), 'w').write(page('<main class="content">' + pbody + '</main>', 'print'))
    open(os.path.join(OUT, 'print-cover.html'), 'w').write(page(cover(), 'print'))
    print('toc entries', len(toc))
