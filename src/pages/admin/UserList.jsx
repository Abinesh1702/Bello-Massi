import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Power, KeyRound, Trash2, Unlock, UsersRound } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Avatar from '../../components/common/Avatar'
import DataTable from '../../components/common/DataTable'
import RowActions from '../../components/common/RowActions'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import { useUserActions } from '../../components/admin/UserActions'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { useAuth } from '../../hooks/useAuth'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { getRoleLabel, userRoleCodes } from '../../config/roles'
import { getLockState } from '../../services/authService'
import { STORAGE_KEYS } from '../../utils/constants'
import { downloadCsv, csvFilename } from '../../services/csvService'
import { formatDate, formatDateTime } from '../../utils/formatters'

export default function UserList() {
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, [])
  const roles = useStoredValue(STORAGE_KEYS.ROLES, [])
  const org = useStoredValue(STORAGE_KEYS.ORGANIZATION, null)
  const hubs = useStoredValue(STORAGE_KEYS.HUBS, [])
  useStoredValue(STORAGE_KEYS.AUTH, null) // lock state
  const t = useTableQuery({ filters: ['role', 'status', 'department', 'hub'], sort: 'employeeId' })
  const canCreate = usePermission('users.create')
  const canEdit = usePermission('users.edit')
  const canManage = usePermission('users.manage')
  const canDelete = usePermission('users.delete')
  const ua = useUserActions()

  const dept = (id) => org?.departments?.find((d) => d.id === id)?.name || ''
  const desig = (id) => org?.designations?.find((d) => d.id === id)?.name || ''
  const hubName = (id) => hubs.find((h) => h.id === id)?.name || ''

  const rows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const list = users.map((u) => ({ ...u, locked: getLockState(u.id).locked, departmentName: dept(u.department), designationName: desig(u.designation), hubName: hubName(u.hubId), roleName: getRoleLabel(u.role) }))
      .filter((u) => !q || [u.name, u.email, u.username, u.employeeId, u.phone, u.departmentName, u.designationName].some((v) => String(v || '').toLowerCase().includes(q)))
      .filter((u) => !t.filters.role || userRoleCodes(u).includes(t.filters.role))
      .filter((u) => !t.filters.status || (t.filters.status === 'locked' ? u.locked : u.status === t.filters.status))
      .filter((u) => !t.filters.department || u.department === t.filters.department)
      .filter((u) => !t.filters.hub || (t.filters.hub === 'none' ? !u.hubId : u.hubId === t.filters.hub))
    return sortRows(list, t.sort, t.dir, { role: (u) => u.roleName, department: (u) => u.departmentName, hub: (u) => u.hubName })
  }, [users, roles, org, hubs, t.q, t.filters, t.sort, t.dir]) // eslint-disable-line react-hooks/exhaustive-deps

  const onExport = () => {
    const n = downloadCsv(csvFilename('users'), rows, [
      { header: 'Employee ID', value: (u) => u.employeeId }, { header: 'Name', value: (u) => u.name }, { header: 'Email', value: (u) => u.email },
      { header: 'Username', value: (u) => u.username }, { header: 'Phone', value: (u) => u.phone }, { header: 'Role', value: (u) => u.roleName },
      { header: 'Additional roles', value: (u) => (u.additionalRoles || []).map(getRoleLabel).join('; ') },
      { header: 'Department', value: (u) => u.departmentName }, { header: 'Designation', value: (u) => u.designationName }, { header: 'Assigned hub', value: (u) => u.hubName || 'All hubs' },
      { header: 'Status', value: (u) => (u.locked ? 'locked' : u.status) }, { header: 'Created', value: (u) => formatDate(u.createdAt) }, { header: 'Last sign-in', value: (u) => formatDateTime(u.lastLoginAt) },
    ])
    if (n) toast.success(`Exported ${n} users`)
  }

  return (
    <>
      <PageHeader title="User Management" description="Users, roles, departments and hubs. Passwords are demo-only and stored in this browser."
        actions={<>
          {canManage && <Button variant="secondary" icon={UsersRound} to="/admin/role-assignment">Assign roles</Button>}
          {canCreate && <Button icon={Plus} to="/admin/users/create">Create user</Button>}
        </>} />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search name, email, ID, phone…" total={users.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Role" allLabel="All roles" value={t.filters.role} onChange={(v) => t.setFilter('role', v)} options={roles.map((r) => ({ value: r.code, label: r.name }))} />
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'locked', label: 'Locked' }]} />
          <FilterSelect label="Department" allLabel="All departments" value={t.filters.department} onChange={(v) => t.setFilter('department', v)} options={(org?.departments || []).map((d) => ({ value: d.id, label: d.name }))} />
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hub} onChange={(v) => t.setFilter('hub', v)} options={[{ value: 'none', label: 'No hub (all hubs)' }, ...hubs.map((h) => ({ value: h.id, label: h.name }))]} />
        </FilterToolbar>
        <DataTable
          rows={rows}
          pageSize="default"
          sort={t.sort} dir={t.dir} onSort={t.setSort}
          page={t.page} onPageChange={t.setPage}
          onRowClick={(u) => navigate(`/admin/users/${u.id}`)}
          columns={[
            { key: 'employeeId', header: 'ID', sortable: true, render: (u) => <span className="tabular text-xs text-muted">{u.employeeId || '—'}</span>, hideBelow: 'md' },
            { key: 'name', header: 'User', sortable: true, render: (u) => (
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={u.name} color={u.avatarColor} image={u.avatarImage} size="sm" />
                <div className="min-w-0"><p className="truncate font-medium text-ink">{u.name}{u.id === me.id && <span className="ml-1 text-xs font-normal text-muted">(you)</span>}</p><p className="truncate text-xs text-muted">{u.email}</p></div>
              </div>
            ) },
            { key: 'phone', header: 'Phone', render: (u) => u.phone || '—', hideBelow: '2xl' },
            { key: 'role', header: 'Role', sortable: true, render: (u) => <span className="flex flex-wrap items-center gap-1"><Badge tone="brand">{u.roleName}</Badge>{(u.additionalRoles || []).length > 0 && <Badge tone="neutral" title={(u.additionalRoles || []).map(getRoleLabel).join(', ')}>+{u.additionalRoles.length}</Badge>}</span> },
            { key: 'department', header: 'Department', sortable: true, render: (u) => <span><span className="block text-ink">{u.departmentName || '—'}</span><span className="block text-xs text-muted">{u.designationName}</span></span>, hideBelow: 'lg' },
            { key: 'hub', header: 'Hub', sortable: true, render: (u) => u.hubName || <span className="text-muted">All hubs</span>, hideBelow: 'xl' },
            { key: 'status', header: 'Status', sortable: true, render: (u) => u.locked ? <Badge tone="danger" dot>Locked</Badge> : <Badge tone={u.status === 'active' ? 'success' : 'neutral'} dot>{u.status === 'active' ? 'Active' : 'Inactive'}</Badge> },
            { key: 'createdAt', header: 'Created', sortable: true, render: (u) => formatDate(u.createdAt), hideBelow: 'xl' },
            { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (u) => (
              <RowActions items={[
                { label: 'View', icon: Eye, onClick: () => navigate(`/admin/users/${u.id}`) },
                { label: 'Edit', icon: Pencil, onClick: () => navigate(`/admin/users/${u.id}/edit`), hidden: !canEdit },
                { label: u.status === 'active' ? 'Deactivate' : 'Activate', icon: Power, onClick: () => ua.ask('status', u), hidden: !canManage || u.id === me.id },
                { label: 'Unlock', icon: Unlock, onClick: () => ua.ask('unlock', u), hidden: !canManage || !u.locked },
                { label: 'Reset demo password', icon: KeyRound, onClick: () => ua.ask('reset', u), hidden: !canManage || u.id === me.id },
                { label: 'Delete', icon: Trash2, danger: true, onClick: () => ua.ask('delete', u), hidden: !canDelete || u.id === me.id },
              ]} />
            ) },
          ]}
        />
      </Card>
      {ua.dialogs}
    </>
  )
}
