import { useMemo, useState } from 'react'
import { ScrollText, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import InfoList from '../../components/common/InfoList'
import DataTable from '../../components/common/DataTable'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { AUDIT_ACTIONS } from '../../services/auditService'
import { MODULES, getModuleLabel } from '../../config/rbacCatalog'
import { getRoleLabel } from '../../config/roles'
import { STORAGE_KEYS } from '../../utils/constants'
import { downloadCsv, csvFilename } from '../../services/csvService'
import { formatDateTime } from '../../utils/formatters'

export default function AuditLog() {
  const logs = useStoredValue(STORAGE_KEYS.AUDIT_LOGS, [])
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, [])
  const t = useTableQuery({ filters: ['user', 'action', 'module', 'from', 'to'], sort: 'at', dir: 'desc' })
  const [open, setOpen] = useState(null)

  const rows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const f = t.filters
    const list = logs.filter((a) =>
      (!q || [a.description, a.entity, a.recordLabel, a.recordId, a.userName, a.id].some((v) => String(v || '').toLowerCase().includes(q)))
      && (!f.user || (f.user === 'system' ? !a.userId : a.userId === f.user))
      && (!f.action || a.action === f.action)
      && (!f.module || a.module === f.module)
      && (!f.from || a.at.slice(0, 10) >= f.from)
      && (!f.to || a.at.slice(0, 10) <= f.to))
    return sortRows(list, t.sort, t.dir, { user: (a) => a.userName, module: (a) => getModuleLabel(a.module) })
  }, [logs, t.q, t.filters, t.sort, t.dir])

  const onExport = () => {
    const n = downloadCsv(csvFilename('audit-log'), rows, [
      { header: 'Log ID', value: (a) => a.id }, { header: 'Timestamp', value: (a) => a.at }, { header: 'User', value: (a) => a.userName },
      { header: 'Role', value: (a) => (a.userRole ? getRoleLabel(a.userRole) : '') }, { header: 'Action', value: (a) => AUDIT_ACTIONS[a.action]?.label || a.action },
      { header: 'Module', value: (a) => getModuleLabel(a.module) }, { header: 'Entity', value: (a) => a.entity }, { header: 'Record ID', value: (a) => a.recordId || '' },
      { header: 'Record', value: (a) => a.recordLabel }, { header: 'Description', value: (a) => a.description },
      { header: 'Previous value', value: (a) => (a.changes || []).map((c) => `${c.field}: ${c.previous}`).join(' | ') },
      { header: 'New value', value: (a) => (a.changes || []).map((c) => `${c.field}: ${c.next}`).join(' | ') },
    ])
    if (n) toast.success(`Exported ${n} audit entries`)
  }

  const userOptions = [{ value: 'system', label: 'System' }, ...users.map((u) => ({ value: u.id, label: u.name }))]

  return (
    <>
      <PageHeader title="Audit Log" description="Logins, logouts, creates, edits, deletes, approvals, rejections, status and settings changes — recorded automatically across all modules." />
      <div className="mb-4 flex gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-3 text-xs text-muted">
        <ShieldAlert size={16} className="shrink-0 text-accent mt-px" aria-hidden />
        <span>Prototype audit trail: kept in this browser (latest 3,000 entries) and not tamper-proof. Secrets such as passwords are never recorded — only that they changed.</span>
      </div>
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search description, record, user…" total={logs.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="User" allLabel="All users" value={t.filters.user} onChange={(v) => t.setFilter('user', v)} options={userOptions} />
          <FilterSelect label="Action" allLabel="All actions" value={t.filters.action} onChange={(v) => t.setFilter('action', v)} options={Object.entries(AUDIT_ACTIONS).map(([k, v]) => ({ value: k, label: v.label }))} />
          <FilterSelect label="Module" allLabel="All modules" value={t.filters.module} onChange={(v) => t.setFilter('module', v)} options={MODULES.map((m) => ({ value: m.id, label: m.label }))} />
          <FilterInput label="From" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} />
          <FilterInput label="To" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} />
        </FilterToolbar>
        <DataTable
          rows={rows}
          pageSize="default"
          sort={t.sort} dir={t.dir} onSort={t.setSort}
          page={t.page} onPageChange={t.setPage}
          onRowClick={setOpen}
          empty={<p className="py-8 text-center text-sm text-muted">No audit entries match these filters.</p>}
          columns={[
            { key: 'at', header: 'Timestamp', sortable: true, render: (a) => <span className="whitespace-nowrap text-xs text-muted tabular">{formatDateTime(a.at)}</span> },
            { key: 'user', header: 'User', sortable: true, render: (a) => <span className="whitespace-nowrap text-ink">{a.userName}</span>, hideBelow: 'sm' },
            { key: 'action', header: 'Action', sortable: true, render: (a) => <Badge tone={AUDIT_ACTIONS[a.action]?.tone || 'neutral'}>{AUDIT_ACTIONS[a.action]?.label || a.action}</Badge> },
            { key: 'module', header: 'Module', sortable: true, render: (a) => getModuleLabel(a.module), hideBelow: 'lg' },
            { key: 'entity', header: 'Entity', render: (a) => <span><span className="block text-ink">{a.entity}</span><span className="block text-xs text-muted truncate max-w-40">{a.recordLabel}</span></span>, hideBelow: 'md' },
            { key: 'description', header: 'Description', render: (a) => <span className="line-clamp-2 text-ink">{a.description}</span> },
            { key: 'changes', header: 'Changes', align: 'right', render: (a) => (a.changes?.length ? <Badge tone="neutral">{a.changes.length}</Badge> : <span className="text-muted">—</span>), hideBelow: 'xl' },
          ]}
        />
      </Card>
      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title="Audit entry" icon={ScrollText} size="lg">
        {open && (
          <div className="space-y-5">
            <InfoList items={[
              { label: 'Log ID', value: <code className="text-xs">{open.id}</code> },
              { label: 'Timestamp', value: formatDateTime(open.at) },
              { label: 'User', value: `${open.userName}${open.userRole ? ` · ${getRoleLabel(open.userRole)}` : ''}` },
              { label: 'Action', value: <Badge tone={AUDIT_ACTIONS[open.action]?.tone}>{AUDIT_ACTIONS[open.action]?.label || open.action}</Badge> },
              { label: 'Module', value: getModuleLabel(open.module) },
              { label: 'Entity', value: open.entity },
              { label: 'Record ID', value: open.recordId ? <code className="text-xs">{open.recordId}</code> : '—' },
              { label: 'Record', value: open.recordLabel },
              { label: 'Description', value: open.description, span: 2 },
            ]} />
            <div>
              <h3 className="text-sm font-semibold text-ink">Previous and new values</h3>
              {open.changes?.length ? (
                <div className="relative mt-2 overflow-x-auto rounded-lg border border-line">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-2/70 text-xs text-muted"><tr><th className="px-3 py-2 text-left">Field</th><th className="px-3 py-2 text-left">Previous value</th><th className="px-3 py-2 text-left">New value</th></tr></thead>
                    <tbody>
                      {open.changes.map((c) => (
                        <tr key={c.field} className="border-t border-line align-top">
                          <td className="px-3 py-2 font-medium text-ink">{c.field}</td>
                          <td className="px-3 py-2 text-muted break-all">{c.previous}</td>
                          <td className="px-3 py-2 text-ink break-all">{c.next}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="mt-1 text-sm text-muted">No field-level changes for this event.</p>}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
