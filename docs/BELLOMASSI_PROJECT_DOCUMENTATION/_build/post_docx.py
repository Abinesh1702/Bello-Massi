"""Post-process the pandoc DOCX: proportional table column widths and a pre-filled table of contents."""
import re, sys, zipfile, shutil, os, json, subprocess, html
from lxml import etree
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
q = lambda t: '{%s}%s' % (W, t)
TOTAL = 9628

def text(el): return ''.join(el.itertext())

def fix_tables(root):
    for tbl in root.iter(q('tbl')):
        rows = tbl.findall(q('tr'))
        if not rows: continue
        ncol = max(len(r.findall(q('tc'))) for r in rows)
        maxlen = [0] * ncol; maxword = [0] * ncol
        for r in rows:
            for i, tc in enumerate(r.findall(q('tc'))):
                t = text(tc).strip()
                maxlen[i] = max(maxlen[i], len(t))
                maxword[i] = max([maxword[i]] + [len(w) for w in re.split(r'[\s/_.]+', t)])
        weight = [max(min(maxlen[i], 70), maxword[i] * 1.1, 4) + 3 for i in range(ncol)]
        if ncol > 8:   # matrices: first columns wide, tick columns narrow
            weight = [max(min(maxlen[i], 40), 4) + 2 for i in range(ncol)]
        s = sum(weight); widths = [int(TOTAL * w / s) for w in weight]
        tblPr = tbl.find(q('tblPr'))
        tw = tblPr.find(q('tblW'))
        tw.set(q('type'), 'dxa'); tw.set(q('w'), str(TOTAL))
        lay = tblPr.find(q('tblLayout'))
        if lay is None: lay = etree.SubElement(tblPr, q('tblLayout'))
        lay.set(q('type'), 'fixed')
        grid = tbl.find(q('tblGrid'))
        for g in list(grid): grid.remove(g)
        for wdt in widths: etree.SubElement(grid, q('gridCol')).set(q('w'), str(wdt))
        for r in rows:
            for i, tc in enumerate(r.findall(q('tc'))):
                tcPr = tc.find(q('tcPr'))
                if tcPr is None: tcPr = etree.Element(q('tcPr')); tc.insert(0, tcPr)
                tcw = tcPr.find(q('tcW'))
                if tcw is None: tcw = etree.Element(q('tcW')); tcPr.insert(0, tcw)
                tcw.set(q('type'), 'dxa'); tcw.set(q('w'), str(widths[i] if i < ncol else 500))

def headings(root):
    out = []
    for p in root.iter(q('p')):
        ps = p.find(q('pPr') + '/' + q('pStyle'))
        if ps is None or ps.get(q('val')) not in ('Heading1', 'Heading2'): continue
        bm = p.find(q('bookmarkStart'))
        prev = p.getprevious()
        if bm is None and prev is not None and prev.tag == q('bookmarkStart'): bm = prev
        if bm is None: continue
        out.append((1 if ps.get(q('val')) == 'Heading1' else 2, bm.get(q('name')), text(p).strip()))
    return out

def run(xml): return etree.fromstring(f'<w:r xmlns:w="{W}">{xml}</w:r>')

def fill_toc(root, heads, pages):
    sdt = next(s for s in root.iter(q('sdt')) if s.find('.//' + q('docPartGallery')) is not None)
    content = sdt.find(q('sdtContent'))
    ps = content.findall(q('p'))
    content.remove(ps[1])
    n = len(heads)
    for i, (lvl, bm, t) in enumerate(heads):
        p = etree.SubElement(content, q('p'))
        ppr = etree.SubElement(p, q('pPr')); etree.SubElement(ppr, q('pStyle')).set(q('val'), f'TOC{lvl}')
        if i == 0:
            p.append(run('<w:fldChar w:fldCharType="begin"/>'))
            p.append(run('<w:instrText xml:space="preserve">TOC \\o "1-2" \\h \\z \\u</w:instrText>'))
            p.append(run('<w:fldChar w:fldCharType="separate"/>'))
        hl = etree.SubElement(p, q('hyperlink')); hl.set(q('anchor'), bm); hl.set(q('history'), '1')
        hl.append(run(f'<w:t xml:space="preserve">{html.escape(t)}</w:t>'))
        hl.append(run('<w:tab/>'))
        hl.append(run(f'<w:t>{pages.get(bm, "")}</w:t>'))
        if i == n - 1: p.append(run('<w:fldChar w:fldCharType="end"/>'))

PPR = ['pStyle','keepNext','keepLines','pageBreakBefore','framePr','widowControl','numPr','suppressLineNumbers','pBdr','shd','tabs','suppressAutoHyphens','kinsoku','wordWrap','overflowPunct','topLinePunct','autoSpaceDE','autoSpaceDN','bidi','adjustRightInd','snapToGrid','spacing','ind','contextualSpacing','mirrorIndents','suppressOverlap','jc','textDirection','textAlignment','textboxTightWrap','outlineLvl','divId','cnfStyle','rPr','sectPr','pPrChange']
TBLPR = ['tblStyle','tblpPr','tblOverlap','bidiVisual','tblStyleRowBandSize','tblStyleColBandSize','tblW','jc','tblCellSpacing','tblInd','tblBorders','shd','tblLayout','tblCellMar','tblLook','tblCaption','tblDescription']
def reorder(root):
    for tag, order in (('pPr', PPR), ('tblPr', TBLPR)):
        for el in root.iter(q(tag)):
            kids = list(el)
            key = lambda c: order.index(etree.QName(c).localname) if etree.QName(c).localname in order else len(order)
            kids.sort(key=key)
            for c in kids: el.remove(c)
            for c in kids: el.append(c)

def process(src, dst, pages):
    tmp = dst + '.tmp'
    with zipfile.ZipFile(src) as zin, zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == 'word/document.xml':
                root = etree.fromstring(data)
                fix_tables(root)
                heads = headings(root)
                fill_toc(root, heads, pages)
                reorder(root)
                data = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
            if item.filename == 'word/settings.xml':
                data = b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>'
            if item.filename == '[Content_Types].xml' and b'Extension="png"' not in data:
                data = data.replace(b'</Types>', b'<Default Extension="png" ContentType="image/png"/></Types>')
            if item.filename == 'word/numbering.xml':
                data = re.sub(rb'w:nsid w:val="([0-9A-Fa-f]+)"', lambda m: b'w:nsid w:val="' + m.group(1)[-8:].rjust(8, b'0') + b'"', data)
            if item.filename == 'word/styles.xml':
                root2 = etree.fromstring(data); reorder(root2)
                data = etree.tostring(root2, xml_declaration=True, encoding='UTF-8', standalone=True)
            if item.filename.endswith('/'): continue
            zout.writestr(item, data)
    os.replace(tmp, dst)
    return heads
