"""Copy only the screenshots each folder's documents reference into <folder>/screenshots/ (removes unreferenced copies)."""
import glob, os, re, shutil
from build import FOLDERS
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(H)
n = 0
for code, folder in FOLDERS.items():
    refs = set()
    for f in glob.glob(os.path.join(H, 'src', code, '*.md')):
        refs |= set(re.findall(r'screenshots/([A-Za-z0-9_.-]+\.png)', open(f).read()))
    d = os.path.join(ROOT, folder, 'screenshots')
    if os.path.isdir(d):
        for p in os.listdir(d):
            if p not in refs: os.remove(os.path.join(d, p))
    if refs:
        os.makedirs(d, exist_ok=True)
        for r in refs:
            src = os.path.join(H, 'shots', r)
            if not os.path.exists(src): raise SystemExit('missing screenshot ' + r)
            shutil.copy(src, d); n += 1
    elif os.path.isdir(d): os.rmdir(d)
print('screenshots copied', n)
