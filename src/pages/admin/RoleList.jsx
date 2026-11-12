import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Copy, Pencil, Trash2, Eye, Lock, ShieldCheck, Power, Grid3x3 } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import DataTable from '../../components/common/DataTable'
import RowActions from '../../components/common/RowActions'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { deleteRole, duplicateRole, setRoleStatus, usersWithRole, isProtectedRole, isLockedRole } from '../../services/rbacService'
import { getScopeLabel, PERMISSION_CATALOG } from '../../config/rbacCatalog'
import { STORAGE_KEYS } from '../../utils/constants'
import { downloadCsv, csvFilename } from '../../services/csvService'
import { formatDate } from '../../utils/formatters'

export default function RoleList() {
  const navigate = useNavigate()
  const roles = useStoredValue(STORAGE_KEYS.ROLES, [])
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, [])
  const t = useTableQuery({ filters: ['type', 'status', 'department'], sort: 'name' })
  const canCreate = usePermission('roles.create')
  const canEdit = usePermission('roles.edit')
  const canDelete = usePermission('roles.delete')
  const [toDelete, setToDelete] = useState(null)
  const [toToggle, setToToggle] = useState(null)

  const rows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const list = roles.map((r) => ({ ...r, userCount: usersWithRole(r.code, users).length, permCount: r.locked ? PERMISSION_CATALOG.length : r.permissions.length }))
      .filter((r) => !q || [r.name, r.code, r.description, r.department].some((v) => String(v || '').toLowerCase().includes(q)))
      .filter((r) => !t.filters.type || (t.filters.type === 'system' ? r.system : !r.system))
      .filter((r) => !t.filters.status || r.status === t.filters.status)
      .filter((r) => !t.filters.department || r.department === t.filters.department)
    return sortRows(list, t.sort, t.dir, { users: (r) => r.userCount, permissions: (r) => r.permCount })
  }, [roles, users, t.q, t.filters, t.sort, t.dir])

  const onDuplicate = (r) => {
    const res = duplicateRole(r.id)
    if (!res.ok) return toast.error(res.error)
    toast.success(`Created ${res.record.name}`, { description: 'Review its permissions before assigning it.' })
    navigate(`/admin/roles/${res.record.id}/edit`)
  }
  const onDelete = () => {
    const res = deleteRole(toDelete.id)
    setToDelete(null)
    if (!res.ok) return toast.error(res.error)
    toast.success(`${res.record.name} deleted`)
  }
  const onToggle = () => {
    const next = toToggle.status === 'active' ? 'inactive' : 'active'
    const res = setRoleStatus(toToggle.id, next)
    setToToggle(null)
    if (!res.ok) return toast.error(res.error)
    toast.success(`${res.record.name} ${next === 'active' ? 'activated' : 'deactivated'}`)
  }
  const onExport = () => {
    const n = downloadCsv(csvFilename('roles'), rows, [
      { header: 'Code', value: (r) => r.code }, { header: 'Name', value: (r) => r.name }, { header: 'Type', value: (r) => (r.system ? 'System' : 'Custom') },
      { header: 'Status', value: (r) => r.status }, { header: 'Data scope', value: (r) => getScopeLabel(r.dataScope) }, { header: 'Users', value: (r) => r.userCount },
      { header: 'Permissions', value: (r) => r.permCount }, { header: 'Description', value: (r) => r.description },
    ])
    if (n) toast.success(`Exported ${n} roles`)
  }

  return (
    <>
      <PageHeader title="Role Management" description="System and custom roles with their module, page and action permissions. Protected system roles cannot be deleted."
        actions={<>
          <Button variant="secondary" icon={Grid3x3} to="/admin/permissions">Permission matrix</Button>
          {canCreate && <Button icon={Plus} to="/admin/roles/create">Create role</Button>}
        </>} />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search roles…" total={roles.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Type" allLabel="All types" value={t.filters.type} onChange={(v) => t.setFilter('type', v)} options={[{ value: 'system', label: 'System' }, { value: 'custom', label: 'Custom' }]} />
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          <FilterSelect label="Department" allLabel="All departments" value={t.filters.department} onChange={(v) => t.setFilter('department', v)} options={[...new Set(roles.map((r) => r.department).filter(Boolean))].sort().map((d) => ({ value: d, label: d }))} />
        </FilterToolbar>
        <DataTable
          rows={rows}
          pageSize="default"
          sort={t.sort} dir={t.dir} onSort={t.setSort}
          page={t.page} onPageChange={t.setPage}
          onRowClick={(r) => navigate(`/admin/roles/${r.id}`)}
          columns={[
            { key: 'name', header: 'Role', sortable: true, render: (r) => (
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-medium text-ink"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />{r.name}{isLockedRole(r) ? <Lock size={13} className="text-muted" aria-label="Locked" /> : isProtectedRole(r) ? <ShieldCheck size={13} className="text-muted" aria-label="Protected" /> : null}</p>
                <p className="truncate text-xs text-muted">{r.code}</p>
              </div>
            ) },
            { key: 'type', header: 'Type', render: (r) => <Badge tone={r.system ? 'brand' : 'accent'}>{r.system ? 'System' : 'Custom'}</Badge>, hideBelow: 'sm' },
            { key: 'department', header: 'Department', sortable: true, render: (r) => r.department || '—', hideBelow: 'md' },
            { key: 'scope', header: 'Data scope', render: (r) => getScopeLabel(r.dataScope), hideBelow: 'lg' },
            { key: 'users', header: 'Users', sortable: true, align: 'right', render: (r) => r.userCount },
            { key: 'permissions', header: 'Permissions', sortable: true, align: 'right', render: (r) => r.permCount, hideBelow: 'md' },
            { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'} dot>{r.status === 'active' ? 'Active' : 'Inactive'}</Badge> },
            { key: 'updatedAt', header: 'Updated', sortable: true, render: (r) => formatDate(r.updatedAt), hideBelow: 'xl' },
            { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (r) => (
              <RowActions items={[
                { label: 'View', icon: Eye, onClick: () => navigate(`/admin/roles/${r.id}`) },
                { label: 'Edit', icon: Pencil, onClick: () => navigate(`/admin/roles/${r.id}/edit`), hidden: !canEdit || isLockedRole(r) },
                { label: 'Duplicate', icon: Copy, onClick: () => onDuplicate(r), hidden: !canCreate },
                { label: r.status === 'active' ? 'Deactivate' : 'Activate', icon: Power, onClick: () => setToToggle(r), hidden: !canEdit || isProtectedRole(r) },
                { label: 'Delete', icon: Trash2, danger: true, onClick: () => setToDelete(r), hidden: !canDelete || r.system },
              ]} />
            ) },
          ]}
        />
      </Card>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={onDelete} tone="danger" confirmLabel="Delete role"
        title={`Delete ${toDelete?.name}?`} description="Custom roles can be deleted only when no user holds them. This cannot be undone." />
      <ConfirmDialog open={Boolean(toToggle)} onClose={() => setToToggle(null)} onConfirm={onToggle} tone={toToggle?.status === 'active' ? 'danger' : 'primary'}
        confirmLabel={toToggle?.status === 'active' ? 'Deactivate' : 'Activate'} title={`${toToggle?.status === 'active' ? 'Deactivate' : 'Activate'} ${toToggle?.name}?`}
        description={toToggle?.status === 'active' ? 'Users whose primary role is inactive cannot sign in, and the role grants no permissions while inactive.' : 'The role grants its permissions again.'} />
    </>
  )
}
