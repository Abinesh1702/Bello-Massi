"""Combine docs/workflow/*.md into one markdown file and pre-render Mermaid diagrams.
Read-only with respect to the application; writes only into docs/workflow/build/out and docs/workflow/dist."""
import re, os, hashlib, subprocess, glob, json, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'out'); os.makedirs(os.path.join(OUT, 'mm'), exist_ok=True)
files = ['README.md'] + sorted(f for f in os.listdir(SRC) if re.match(r'\d\d-.*\.md$', f))
anchor = {f: ('about' if f == 'README.md' else 'ch-' + f[:2]) for f in files}

def render(code):
    h = hashlib.sha1(code.encode()).hexdigest()[:12]
    base = os.path.join(OUT, 'mm', h)
    if not os.path.exists(base + '.svg'):
        open(base + '.mmd', 'w').write(code)
        for ext, extra in (('.svg', []), ('.png', ['-s', '2', '-b', 'white'])):
            r = subprocess.run(['mmdc', '-p', os.path.join(HERE, 'puppeteer.json'), '-c', os.path.join(HERE, 'mermaid-config.json'),
                                '-i', base + '.mmd', '-o', base + ext, '-q'] + extra, capture_output=True, text=True)
            if r.returncode: sys.exit('mermaid failed ' + h + r.stderr[-500:])
    return h

parts = []; chapters = []; diag = 0
for f in files:
    s = open(os.path.join(SRC, f)).read()
    lines = s.split('\n')
    title = lines[0].lstrip('# ').strip()
    if f == 'README.md':
        title = 'About this document'
        body = '\n'.join(lines[1:])
        body = body.split('## Consolidated editions')[0] if False else body
    else:
        body = '\n'.join(lines[1:])
    chapters.append((anchor[f], title))
    # cross-file links -> anchors
    body = re.sub(r'\]\((\d\d-[A-Za-z0-9-]+\.md)\)', lambda m: '](#' + anchor.get(m.group(1), 'about') + ')', body)
    def rep(m):
        global diag
        diag += 1
        h = render(m.group(1))
        return f'\n\n![](mm/{h}.png){{.diagram data-h="{h}"}}\n\n'
    body = re.sub(r'```mermaid\n(.*?)```', rep, body, flags=re.S)
    parts.append(f'# {title} {{#{anchor[f]}}}\n' + body)
open(os.path.join(OUT, 'combined.md'), 'w').write('\n\n'.join(parts))
json.dump(chapters, open(os.path.join(OUT, 'chapters.json'), 'w'))
print('files', len(files), 'diagrams', diag)
