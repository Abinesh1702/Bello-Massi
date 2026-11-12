"""DEP-007 deployment checklists workbook."""
import xlsxlib
S = ['Not started', 'Done', 'N/A', 'Blocked']
pre = ['Release scope approved and change requests closed', 'All Critical / High defects closed', 'Regression suite passed on staging', 'UAT sign-off (major release)',
       'Release notes drafted', 'Database migration reviewed (backward compatible?)', 'On-demand backup / snapshot taken', 'Rollback plan reviewed', 'Maintenance window communicated',
       'Secrets / configuration changes prepared', 'Monitoring dashboards and alerts ready', 'Support team informed']
dep = ['Freeze deployments of other changes', 'Run migrations job', 'Deploy API / channels / workers to green', 'Health checks green', 'Switch traffic', 'Deploy web bundle / invalidate CDN',
       'Publish mobile build to track (if any)', 'Run smoke tests BM-DEP-006', 'Monitor 30 minutes']
post = ['Smoke tests passed', 'No error-rate increase', 'Integrations sending (SMS / WhatsApp / email)', 'GPS updates arriving', 'Release notes published', 'Stakeholders informed', 'Close change ticket']
golive = ['UAT signed by client', 'Master data loaded and reconciled', 'User accounts and roles created', 'Training completed per role', 'Driver devices prepared', 'Provider contracts active (maps, messaging)',
          'Production security review / pen test findings closed', 'Backups and restore test done', 'Hypercare roster agreed', 'Go / no-go decision recorded']
def rows(prefix, items): return [[f'{prefix}-{i:02d}', t, 'Not started', '', '', ''] for i, t in enumerate(items, 1)]
H = ['ID', 'Check', 'Status', 'Owner', 'Date', 'Evidence / comment']
W = [9, 60, 14, 18, 12, 40]
xlsxlib.write_book(dict(id='BM-DEP-007', title='Deployment and Go-Live Checklists', folder='14', file='BM-DEP-007_Deployment_Checklists', category='Deployment and Release',
    purpose='Working checklists for pre-deployment, deployment, post-deployment and go-live readiness. All items start as "Not started" — nothing has been executed.',
    scope='Production releases (PROPOSED).', related=['BM-DEP-001', 'BM-DEP-002', 'BM-DEP-004', 'BM-DEP-006'], references=['BM-DEP-002 Deployment Guide']), [
    dict(name='Pre-deployment', headers=H, rows=rows('PRE', pre), widths=W, validations={2: S}),
    dict(name='Deployment', headers=H, rows=rows('DEP', dep), widths=W, validations={2: S}),
    dict(name='Post-deployment', headers=H, rows=rows('POST', post), widths=W, validations={2: S}),
    dict(name='Go-live readiness', headers=H, rows=rows('GL', golive), widths=W, validations={2: S})])
print('dep ok')
