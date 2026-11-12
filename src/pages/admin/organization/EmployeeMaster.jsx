import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../../components/common/PageHeader'
import Card from '../../../components/common/Card'
import Badge from '../../../components/common/Badge'
import Button from '../../../components/common/Button'
import Avatar from '../../../components/common/Avatar'
import DataTable from '../../../components/common/DataTable'
import FilterToolbar, { FilterSelect } from '../../../components/common/FilterToolbar'
import { useStoredValue } from '../../../hooks/useLocalStorage'
import { usePermission } from '../../../hooks/usePermission'
import { useTableQuery, sortRows } from '../../../hooks/useTableQuery'
import { getRoleLabel } from '../../../config/roles'
import { STORAGE_KEYS } from '../../../utils/constants'
import { downloadCsv, csvFilename } from '../../../services/csvService'
import { formatDate } from '../../../utils/formatters'

/** Employee Master — every user account seen through the organisation structure. Accounts are maintained in User Management. */
export default function EmployeeMaster() {
  const navigate = useNavigate()
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, [])
  const org = useStoredValue(STORAGE_KEYS.ORGANIZATION, null)
  const hubs = useStoredValue(STORAGE_KEYS.HUBS, [])
  const canView = usePermission('users.view')
  const canCreate = usePermission('users.create')
  const t = useTableQuery({ filters: ['department', 'designation', 'branch', 'type'], sort: 'employeeId' })

  const rows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const deps = org?.departments || []
    const list = users.map((u) => {
      const dep = deps.find((d) => d.id === u.department)
      return {
        ...u,
        departmentName: dep?.name || '',
        designationName: org?.designations?.find((d) => d.id === u.designation)?.name || '',
        branchId: dep?.branchId || '',
        branchName: org?.branches?.find((b) => b.id === dep?.branchId)?.name || '',
        businessUnitName: org?.businessUnits?.find((b) => b.id === dep?.businessUnitId)?.name || '',
        hubName: hubs.find((h) => h.id === u.hubId)?.name || '',
        external: String(u.employeeId || '').startsWith('EXT') || u.department === 'dep-external',
      }
    }).filter((u) => (!q || [u.name, u.employeeId, u.email, u.departmentName, u.designationName].some((v) => String(v || '').toLowerCase().includes(q)))
      && (!t.filters.department || u.department === t.filters.department)
      && (!t.filters.designation || u.designation === t.filters.designation)
      && (!t.filters.branch || u.branchId === t.filters.branch)
      && (!t.filters.type || (t.filters.type === 'external' ? u.external : !u.external)))
    return sortRows(list, t.sort, t.dir, { department: (u) => u.departmentName, designation: (u) => u.designationName, branch: (u) => u.branchName })
  }, [users, org, hubs, t.q, t.filters, t.sort, t.dir])

  const onExport = () => {
    const n = downloadCsv(csvFilename('employees'), rows, [
      { header: 'Employee ID', value: (u) => u.employeeId }, { header: 'Name', value: (u) => u.name }, { header: 'Email', value: (u) => u.email }, { header: 'Phone', value: (u) => u.phone },
      { header: 'Department', value: (u) => u.departmentName }, { header: 'Designation', value: (u) => u.designationName }, { header: 'Business unit', value: (u) => u.businessUnitName },
      { header: 'Branch', value: (u) => u.branchName }, { header: 'Hub', value: (u) => u.hubName }, { header: 'Role', value: (u) => getRoleLabel(u.role) }, { header: 'Status', value: (u) => u.status },
      { header: 'Joined', value: (u) => formatDate(u.createdAt) },
    ])
    if (n) toast.success(`Exported ${n} employees`)
  }

  return (
    <>
      <PageHeader title="Employee Master" description="Employees and portal users by department, designation, branch and hub. Accounts are maintained in User Management."
        actions={canCreate && <Button icon={Plus} to="/admin/users/create">Add employee</Button>} />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search employees…" total={users.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Department" allLabel="All departments" value={t.filters.department} onChange={(v) => t.setFilter('department', v)} options={(org?.departments || []).map((d) => ({ value: d.id, label: d.name }))} />
          <FilterSelect label="Designation" allLabel="All designations" value={t.filters.designation} onChange={(v) => t.setFilter('designation', v)} options={(org?.designations || []).map((d) => ({ value: d.id, label: d.name }))} />
          <FilterSelect label="Branch" allLabel="All branches" value={t.filters.branch} onChange={(v) => t.setFilter('branch', v)} options={(org?.branches || []).map((b) => ({ value: b.id, label: b.name }))} />
          <FilterSelect label="Type" allLabel="Employees & portal" value={t.filters.type} onChange={(v) => t.setFilter('type', v)} options={[{ value: 'internal', label: 'Employees' }, { value: 'external', label: 'Portal users' }]} />
        </FilterToolbar>
        <DataTable
          rows={rows}
          pageSize="default"
          sort={t.sort} dir={t.dir} onSort={t.setSort}
          page={t.page} onPageChange={t.setPage}
          onRowClick={canView ? (u) => navigate(`/admin/users/${u.id}`) : undefined}
          columns={[
            { key: 'employeeId', header: 'Employee ID', sortable: true, render: (u) => <span className="tabular text-xs">{u.employeeId || '—'}</span> },
            { key: 'name', header: 'Name', sortable: true, render: (u) => <span className="flex items-center gap-2"><Avatar name={u.name} color={u.avatarColor} image={u.avatarImage} size="sm" /><span className="min-w-0"><span className="block truncate font-medium text-ink">{u.name}</span><span className="block truncate text-xs text-muted">{u.email}</span></span></span> },
            { key: 'department', header: 'Department', sortable: true, render: (u) => u.departmentName || '—', hideBelow: 'sm' },
            { key: 'designation', header: 'Designation', sortable: true, render: (u) => u.designationName || '—', hideBelow: 'md' },
            { key: 'branch', header: 'Branch', sortable: true, render: (u) => u.branchName || '—', hideBelow: 'lg' },
            { key: 'hub', header: 'Hub', render: (u) => u.hubName || 'All hubs', hideBelow: 'xl' },
            { key: 'status', header: 'Status', render: (u) => <Badge tone={u.status === 'active' ? 'success' : 'neutral'} dot>{u.external ? 'Portal · ' : ''}{u.status === 'active' ? 'Active' : 'Inactive'}</Badge> },
          ]}
        />
      </Card>
    </>
  )
}
