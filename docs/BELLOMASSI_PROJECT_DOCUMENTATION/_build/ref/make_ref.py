import re, os, shutil, subprocess
X = 'x'
F = '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>'
def para(sid, name, ppr, rpr, based='Normal', nxt='BodyText', extra=''):
    return f'<w:style w:type="paragraph" w:styleId="{sid}"><w:name w:val="{name}"/><w:basedOn w:val="{based}"/><w:next w:val="{nxt}"/><w:qFormat/>{extra}<w:pPr>{ppr}</w:pPr><w:rPr>{rpr}</w:rPr></w:style>'
NAVY='232B5F'; NAVY2='34427A'; AMB='F5A623'
styles = {
 'Normal': para('Normal','Normal','<w:spacing w:after="80" w:line="264" w:lineRule="auto"/>', F+'<w:color w:val="1B2033"/><w:sz w:val="19"/><w:szCs w:val="19"/>', based='', nxt='Normal'),
 'BodyText': para('BodyText','Body Text','<w:spacing w:before="40" w:after="100"/>','', ),
 'FirstParagraph': para('FirstParagraph','First Paragraph','', '', based='BodyText'),
 'Compact': para('Compact','Compact','<w:spacing w:before="20" w:after="20"/>','<w:sz w:val="17"/><w:szCs w:val="17"/>', based='BodyText'),
 'Title': para('Title','Title','<w:spacing w:before="3600" w:after="240"/>', F+f'<w:b/><w:color w:val="{NAVY}"/><w:sz w:val="64"/><w:szCs w:val="64"/>', nxt='BodyText'),
 'Subtitle': para('Subtitle','Subtitle','<w:spacing w:before="0" w:after="480"/><w:pBdr><w:bottom w:val="single" w:sz="18" w:space="12" w:color="'+AMB+'"/></w:pBdr>', F+f'<w:color w:val="{NAVY2}"/><w:sz w:val="32"/><w:szCs w:val="32"/>'),
 'Author': para('Author','Author','<w:spacing w:before="120" w:after="60"/>', F+f'<w:b/><w:color w:val="{NAVY}"/><w:sz w:val="22"/>'),
 'Date': para('Date','Date','<w:spacing w:before="0" w:after="360"/>', F+'<w:color w:val="6B7285"/><w:sz w:val="22"/>'),
 'AbstractTitle': para('AbstractTitle','Abstract Title','<w:spacing w:before="240" w:after="60"/>', F+f'<w:b/><w:color w:val="{NAVY}"/><w:sz w:val="20"/>'),
 'Abstract': para('Abstract','Abstract','<w:spacing w:before="60" w:after="60"/>', F+'<w:color w:val="3B4256"/><w:sz w:val="20"/>'),
 'Heading1': para('Heading1','heading 1','<w:keepNext/><w:keepLines/><w:pageBreakBefore/><w:pBdr><w:bottom w:val="single" w:sz="18" w:space="6" w:color="'+AMB+'"/></w:pBdr><w:spacing w:before="0" w:after="240"/><w:outlineLvl w:val="0"/>', F+f'<w:b/><w:color w:val="{NAVY}"/><w:sz w:val="40"/><w:szCs w:val="40"/>'),
 'Heading2': para('Heading2','heading 2','<w:keepNext/><w:keepLines/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="3" w:color="DCE0EA"/></w:pBdr><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="1"/>', F+f'<w:b/><w:color w:val="{NAVY}"/><w:sz w:val="28"/><w:szCs w:val="28"/>'),
 'Heading3': para('Heading3','heading 3','<w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="2"/>', F+f'<w:b/><w:color w:val="{NAVY2}"/><w:sz w:val="23"/><w:szCs w:val="23"/>'),
 'TOCHeading': para('TOCHeading','TOC Heading','<w:keepNext/><w:pageBreakBefore/><w:pBdr><w:bottom w:val="single" w:sz="18" w:space="6" w:color="'+AMB+'"/></w:pBdr><w:spacing w:before="0" w:after="240"/>', F+f'<w:b/><w:color w:val="{NAVY}"/><w:sz w:val="40"/>', based='Heading1', nxt='Normal'),
 'TOC1': para('TOC1','toc 1','<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9628"/></w:tabs><w:spacing w:before="120" w:after="20"/>', F+f'<w:b/><w:color w:val="{NAVY}"/><w:sz w:val="19"/>', nxt='Normal'),
 'TOC2': para('TOC2','toc 2','<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9628"/></w:tabs><w:spacing w:before="0" w:after="0"/><w:ind w:left="320"/>', F+'<w:color w:val="3B4256"/><w:sz w:val="17"/>', nxt='Normal'),
 'ImageCaption': para('ImageCaption','Image Caption','<w:jc w:val="center"/><w:spacing w:before="40" w:after="200"/>', F+'<w:i/><w:color w:val="6B7285"/><w:sz w:val="16"/>', based='Normal'),
 'CaptionedFigure': para('CaptionedFigure','Captioned Figure','<w:keepNext/><w:jc w:val="center"/>','', based='Normal'),
 'Figure': para('Figure','Figure','<w:jc w:val="center"/><w:spacing w:before="120" w:after="160"/>','', based='Normal'),
}
s = open(f'{X}/word/styles.xml').read()
for sid, xml in styles.items():
    pat = re.compile(r'<w:style [^>]*w:styleId="%s"[^>]*>.*?</w:style>' % sid, re.S)
    if pat.search(s): s = pat.sub(lambda m: xml, s, count=1)
    else: s = s.replace('</w:styles>', xml + '</w:styles>')
s = s.replace('<w:basedOn w:val=""/>', '')
# character styles
s = re.sub(r'(<w:style [^>]*w:styleId="VerbatimChar".*?<w:rPr>).*?(</w:rPr>)', r'\1<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:color w:val="2A3270"/><w:sz w:val="16"/><w:shd w:val="clear" w:color="auto" w:fill="EEF0F8"/>\2', s, flags=re.S)
s = re.sub(r'(<w:style [^>]*w:styleId="Hyperlink".*?<w:rPr>).*?(</w:rPr>)', r'\1<w:color w:val="34427A"/>\2', s, flags=re.S)
table = f'''<w:style w:type="table" w:default="1" w:styleId="Table"><w:name w:val="Table"/><w:basedOn w:val="TableNormal"/><w:qFormat/>
<w:pPr><w:spacing w:before="20" w:after="20"/></w:pPr><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>
<w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="DCE0EA"/><w:bottom w:val="single" w:sz="4" w:color="DCE0EA"/><w:insideH w:val="single" w:sz="4" w:color="DCE0EA"/></w:tblBorders>
<w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>
<w:tblStylePr w:type="firstRow"><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:tblPr/><w:trPr><w:tblHeader/></w:trPr><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{NAVY}"/><w:vAlign w:val="bottom"/></w:tcPr></w:tblStylePr>
<w:tblStylePr w:type="band2Horz"><w:tblPr/><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F5F6FA"/></w:tcPr></w:tblStylePr></w:style>'''
s = re.sub(r'<w:style w:type="table" w:default="1" w:styleId="Table">.*?</w:style>', lambda m: table, s, flags=re.S)
s = re.sub(r'<w:rFonts w:asciiTheme="minorHAnsi"[^>]*/>', F, s, count=1)
open(f'{X}/word/styles.xml', 'w').write(s)

hdr = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="DCE0EA"/></w:pBdr><w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs><w:spacing w:after="0"/></w:pPr><w:r><w:rPr>{F}<w:b/><w:color w:val="{NAVY}"/><w:sz w:val="15"/></w:rPr><w:t>BELLOMASSI</w:t></w:r><w:r><w:rPr>{F}<w:color w:val="6B7285"/><w:sz w:val="15"/></w:rPr><w:tab/><w:t>DOCREFPLACEHOLDER</w:t></w:r></w:p></w:hdr>'''
fld = lambda code: f'<w:r><w:rPr>{F}<w:color w:val="6B7285"/><w:sz w:val="15"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr>{F}<w:sz w:val="15"/></w:rPr><w:instrText xml:space="preserve"> {code} </w:instrText></w:r><w:r><w:rPr>{F}<w:sz w:val="15"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr>{F}<w:color w:val="6B7285"/><w:sz w:val="15"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr>{F}<w:sz w:val="15"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>'
txt = lambda t: f'<w:r><w:rPr>{F}<w:color w:val="6B7285"/><w:sz w:val="15"/></w:rPr><w:t xml:space="preserve">{t}</w:t></w:r>'
ftr = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs><w:spacing w:after="0"/></w:pPr>{txt("Bellomassi Order-to-Delivery Platform · Draft for review")}<w:r><w:tab/></w:r>{txt("Page ")}{fld("PAGE")}{txt(" of ")}{fld("NUMPAGES")}</w:p></w:ftr>'''
open(f'{X}/word/header1.xml','w').write(hdr); open(f'{X}/word/footer1.xml','w').write(ftr)
r = open(f'{X}/word/_rels/document.xml.rels').read()
if 'header1.xml' not in r:
    r = r.replace('</Relationships>', '<Relationship Id="rIdHdr1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdFtr1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>')
open(f'{X}/word/_rels/document.xml.rels','w').write(r)
ct = open(f'{X}/[Content_Types].xml').read()
if 'header1.xml' not in ct:
    ct = ct.replace('</Types>', '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>')
open(f'{X}/[Content_Types].xml','w').write(ct)
d = open(f'{X}/word/document.xml').read()
sect = '<w:sectPr><w:headerReference w:type="default" r:id="rIdHdr1"/><w:footerReference w:type="default" r:id="rIdFtr1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1300" w:right="1134" w:bottom="1200" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/><w:titlePg/></w:sectPr>'
d = re.sub(r'<w:sectPr\s*/>|<w:sectPr>.*?</w:sectPr>', sect, d, flags=re.S)
if 'xmlns:r=' not in d.split('>')[1]: d = d.replace('<w:document ', '<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ', 1)
open(f'{X}/word/document.xml','w').write(d)
if os.path.exists('reference.docx'): os.remove('reference.docx')
subprocess.run('cd x && zip -qXr ../reference.docx "[Content_Types].xml" _rels docProps word', shell=True, check=True)
print('ok')
