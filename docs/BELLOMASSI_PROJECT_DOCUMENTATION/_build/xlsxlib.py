"""Shared helper for the documentation workbooks (consistent styling + document-control sheet + registry)."""
import os, json
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
from build import FOLDERS, TODAY, PREPARED, DEFAULT_STATUS

NAVY = '232B5F'; AMBER = 'F5A623'; SOFT = 'F5F6FA'; LINE = 'DCE0EA'
HFONT = Font(name='Arial', bold=True, color='FFFFFF', size=10)
BFONT = Font(name='Arial', size=9)
HFILL = PatternFill('solid', fgColor=NAVY)
BAND = PatternFill('solid', fgColor=SOFT)
THIN = Border(bottom=Side(style='thin', color=LINE))
LABEL_FILLS = {
    'VERIFIED': 'D9F2E3', 'PROTOTYPE': 'E3E8FA', 'PROPOSED': 'FFF1D6', 'PENDING CONFIRMATION': 'FDE2E1',
    'NOT IMPLEMENTED': 'EDEDED', 'NOT VERIFIED': 'F3E8FF',
}
REG = os.path.join(HERE, 'data', 'xlsx_registry.json')


def _control(ws, meta):
    ws.title = 'Document Control'
    ws['A1'] = meta['title']; ws['A1'].font = Font(name='Arial', bold=True, size=16, color=NAVY)
    ws['A2'] = 'Bellomassi Order-to-Delivery Management Platform'; ws['A2'].font = Font(name='Arial', size=10, color='6B7285')
    rows = [('Document ID', meta['id']), ('Version', meta.get('version', '1.0')), ('Status', meta.get('status', DEFAULT_STATUS)),
            ('Category', meta.get('category', '')), ('Related module(s)', meta.get('module', 'All modules')),
            ('Owner', meta.get('owner', 'Business Analyst')), ('Prepared by', PREPARED), ('Reviewed by', 'Pending — not yet reviewed'),
            ('Approval', 'Not approved — awaiting client review'), ('Created date', meta.get('created', TODAY)),
            ('Last updated date', meta.get('updated', TODAY)), ('Purpose', meta['purpose']), ('Scope', meta.get('scope', '')),
            ('References', '; '.join(meta.get('references', []))),
            ('Status labels', 'VERIFIED · PROTOTYPE · PROPOSED · PENDING CONFIRMATION · NOT IMPLEMENTED · NOT VERIFIED')]
    for i, (a, b) in enumerate(rows, start=4):
        ws.cell(i, 1, a).font = Font(name='Arial', bold=True, size=10, color=NAVY)
        c = ws.cell(i, 2, b); c.font = Font(name='Arial', size=10); c.alignment = Alignment(wrap_text=True, vertical='top')
    r = len(rows) + 6
    ws.cell(r, 1, 'Revision history').font = Font(name='Arial', bold=True, size=11, color=NAVY)
    for j, h in enumerate(['Version', 'Date', 'Author', 'Description'], 1):
        c = ws.cell(r + 1, j, h); c.font = HFONT; c.fill = HFILL
    for k, row in enumerate(meta.get('history', [[meta.get('version', '1.0'), TODAY, 'Documentation team', 'Initial draft prepared from source-code analysis.']])):
        for j, v in enumerate(row, 1):
            c = ws.cell(r + 2 + k, j, v); c.font = BFONT; c.alignment = Alignment(wrap_text=True, vertical='top')
    ws.column_dimensions['A'].width = 22; ws.column_dimensions['B'].width = 95
    ws.column_dimensions['C'].width = 22; ws.column_dimensions['D'].width = 60


def write_book(meta, sheets):
    """meta: id,title,folder,file,purpose,scope,...; sheets: list of dict(name, headers, rows, widths=None, label_col=None, validations={col:[..]})."""
    wb = Workbook(); _control(wb.active, meta)
    for sh in sheets:
        ws = wb.create_sheet(sh['name'][:31])
        hdr = sh['headers']
        for j, h in enumerate(hdr, 1):
            c = ws.cell(1, j, h); c.font = HFONT; c.fill = HFILL
            c.alignment = Alignment(wrap_text=True, vertical='center')
        for i, row in enumerate(sh['rows'], start=2):
            for j, v in enumerate(row, 1):
                if isinstance(v, (list, tuple)): v = ', '.join(map(str, v))
                c = ws.cell(i, j, v); c.font = BFONT; c.alignment = Alignment(wrap_text=True, vertical='top'); c.border = THIN
                if i % 2 == 0: c.fill = BAND
            lc = sh.get('label_col')
            if lc is not None:
                v = str(row[lc]) if lc < len(row) else ''
                for lab, col in LABEL_FILLS.items():
                    if v.upper().startswith(lab):
                        ws.cell(i, lc + 1).fill = PatternFill('solid', fgColor=col); break
        widths = sh.get('widths') or [min(60, max(10, max([len(str(h))] + [len(str(r[j])) if j < len(r) else 0 for r in sh['rows'][:200]]) * 0.9)) for j, h in enumerate(hdr)]
        for j, w in enumerate(widths, 1): ws.column_dimensions[get_column_letter(j)].width = w
        ws.freeze_panes = 'A2'
        if sh['rows']: ws.auto_filter.ref = f'A1:{get_column_letter(len(hdr))}{len(sh["rows"]) + 1}'
        ws.row_dimensions[1].height = 30
        for col, choices in (sh.get('validations') or {}).items():
            dv = DataValidation(type='list', formula1='"' + ','.join(choices) + '"', allow_blank=True)
            ws.add_data_validation(dv); L = get_column_letter(col + 1)
            dv.add(f'{L}2:{L}{max(2, len(sh["rows"]) + 200)}')
        ws.sheet_view.zoomScale = 90
    out_dir = os.path.join(ROOT, FOLDERS[str(meta['folder']).zfill(2)])
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, meta['file'] + '.xlsx'); wb.save(path)
    reg = json.load(open(REG)) if os.path.exists(REG) else {}
    reg[meta['id']] = {k: meta.get(k) for k in ('id', 'title', 'folder', 'file', 'category', 'owner', 'module', 'related')}
    reg[meta['id']].update(version=meta.get('version', '1.0'), status=meta.get('status', DEFAULT_STATUS), created=TODAY, updated=TODAY, ext='xlsx',
                           folder=str(meta['folder']).zfill(2), related=meta.get('related', []))
    json.dump(reg, open(REG, 'w'), indent=1)
    return path
