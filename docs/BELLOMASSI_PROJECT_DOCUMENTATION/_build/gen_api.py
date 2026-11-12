"""API documents (folder 09): domain API designs, endpoint catalogue workbook, OpenAPI 3.0 YAML (all PROPOSED)."""
import os, re, collections, yaml
from data import api, schema
from gen_req import fm, write
import xlsxlib, build
EPS = api.parse()
BYDOC = collections.OrderedDict()
for e in EPS: BYDOC.setdefault((e['doc'], e['domain'], e['resource']), []).append(e)

def domain_docs():
    for (num, name, res), eps in BYDOC.items():
        t = ['## 1. Status\n\n**PROPOSED.** No API exists in the prototype; the same behaviour is implemented today by browser services (see section 4). Paths, payloads and codes will be finalised during backend design.',
             '## 2. Endpoints\n\n| Method | Endpoint | Permission | Purpose |\n|---|---|---|---|\n' + '\n'.join(f"| {e['method']} | `{e['path']}` | `{e['perm']}` | {e['purpose']} |" for e in eps)]
        for e in eps:
            t.append(f"### {e['method']} `{e['path']}`\n\n| Item | Specification |\n|---|---|\n| Purpose | {e['purpose']} |\n| Authentication | {'None (public endpoint, rate limited)' if 'public' in e['perm'] else 'Bearer JWT access token (or signed webhook)'} |\n| Required permission | `{e['perm']}` |\n| Request parameters | {'Path: `id`' if '{id}' in e['path'] or '{' in e['path'] else '—'}; query filters as listed in the body column when prefixed with `?` |\n| Request body | `{e['body']}` |\n| Response body | `{e['response']}` |\n| Validation / errors | {e['errors']} |\n| Business rules | Same as the prototype service; rule IDs in {{{{ref:BM-SYS-007}}}} |")
        t.append(f"## 4. Prototype equivalent — VERIFIED\n\nThe browser services that implement this behaviour today are listed in the related module FRDs; resource fields come from the proposed table `{res}` ({{{{ref:BM-DAT-003}}}}).")
        write('09', f'API-{num}.md', fm(id=f'BM-API-{num}', title=f'{name} Design', folder='09', file=f'BM-API-{num}_{re.sub(r"[^A-Za-z0-9]+", "_", name)}_Design', category='API and Integration', owner='Solution Architect',
              related=['BM-API-001', 'BM-API-002', 'BM-SEC-003'], purpose=f'Specify the proposed {name.lower()} endpoints for the Django REST backend.', scope=f'{len(eps)} endpoints under /api/v1.') + '\n\n'.join(t) + '\n')

def catalogue():
    rows = [[f"EP-{i:03d}", e['domain'], e['method'], e['path'], e['perm'], e['purpose'], e['body'], e['response'], e['errors'], 'PROPOSED', f"BM-API-{e['doc']}"] for i, e in enumerate(EPS, 1)]
    xlsxlib.write_book(dict(id='BM-API-002', title='API Endpoint Catalogue', folder='09', file='BM-API-002_API_Endpoint_Catalogue', category='API and Integration', status='Draft — PROPOSED design, not implemented',
        purpose='Catalogue of all proposed REST endpoints with permissions, payloads and errors.', scope=f'{len(EPS)} endpoints in 15 domains.', related=['BM-API-001']), [
        dict(name='Endpoints', headers=['Endpoint ID', 'Domain', 'Method', 'Path', 'Permission', 'Purpose', 'Request', 'Response', 'Errors / Rules', 'Label', 'Design document'], rows=rows, widths=[10, 18, 8, 40, 26, 40, 40, 34, 44, 11, 13], label_col=9)])

PGT = {'bigserial': ('integer', 'int64'), 'bigint': ('integer', 'int64'), 'integer': ('integer', None), 'smallint': ('integer', None), 'boolean': ('boolean', None), 'date': ('string', 'date'),
       'timestamptz': ('string', 'date-time'), 'time': ('string', 'time'), 'jsonb': ('object', None), 'text': ('string', None), 'inet': ('string', None)}
def jtype(t):
    b = t.split('(')[0]
    if b in PGT: return PGT[b]
    if b in ('numeric',): return ('number', None)
    return ('string', None)

def openapi():
    comps = {}
    for tb in schema.T:
        props = {}; req = []
        for c in schema.columns(tb):
            if c['name'] in ('password_hash', 'otp_hash', 'is_deleted', 'deleted_at'): continue
            ty, fmt = jtype(c['type']); p = {'type': ty, 'description': c['desc']}
            if fmt: p['format'] = fmt
            if c['pk'] or c['name'] in ('created_at', 'updated_at', 'created_by_id', 'updated_by_id'): p['readOnly'] = True
            props[c['name']] = p
            if c['notnull'] and not c['pk'] and c['name'] not in ('created_at', 'updated_at'): req.append(c['name'])
        name = ''.join(w.capitalize() for w in tb.rstrip('s').split('_')) if not tb.endswith('ies') else ''.join(w.capitalize() for w in (tb[:-3] + 'y').split('_'))
        comps[name] = {'type': 'object', 'properties': props, 'required': req}
    comps['Error'] = {'type': 'object', 'properties': {'code': {'type': 'string'}, 'message': {'type': 'string'}, 'errors': {'type': 'object', 'additionalProperties': {'type': 'string'}}}}
    paths = {}
    for e in EPS:
        p = e['path'].replace('/api/v1', '')
        op = {'summary': e['purpose'], 'tags': [e['domain']], 'x-permission': e['perm'], 'x-errors': e['errors'], 'x-request': e['body'], 'x-response': e['response'],
              'responses': {'200': {'description': e['response']}, '400': {'description': 'Validation error', 'content': {'application/json': {'schema': {'$ref': '#/components/schemas/Error'}}}},
                            '401': {'description': 'Not authenticated'}, '403': {'description': 'Missing permission or out of scope'}}}
        params = [{'name': x, 'in': 'path', 'required': True, 'schema': {'type': 'string'}} for x in re.findall(r'\{(\w+)\}', p)]
        if params: op['parameters'] = params
        if e['method'] in ('POST', 'PUT', 'PATCH') and e['body'] != '—': op['requestBody'] = {'description': e['body'], 'content': {'application/json': {'schema': {'type': 'object'}}}}
        if 'public' in e['perm']: op['security'] = []
        paths.setdefault(p, {})[e['method'].lower()] = op
    doc = {'openapi': '3.0.3', 'info': {'title': 'Bellomassi Order-to-Delivery API (PROPOSED)', 'version': '0.1.0-draft', 'description': 'Proposed API — NOT IMPLEMENTED. Generated from the documentation package (BM-API-002). Schemas follow the proposed database design (BM-DAT-002).'},
           'servers': [{'url': 'https://api.example.com/api/v1', 'description': 'Placeholder — no server exists'}], 'security': [{'bearerAuth': []}],
           'components': {'securitySchemes': {'bearerAuth': {'type': 'http', 'scheme': 'bearer', 'bearerFormat': 'JWT'}}, 'schemas': comps}, 'paths': paths}
    out = os.path.join(build.ROOT, build.FOLDERS['09'], 'BM-API-018_openapi_proposed.yaml')
    open(out, 'w').write('# BM-API-018 · OpenAPI 3.0 specification · PROPOSED (not implemented) · Draft 2026-11-12\n' + yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=140))
    return len(paths)

if __name__ == '__main__':
    domain_docs(); catalogue(); print('paths', openapi())
