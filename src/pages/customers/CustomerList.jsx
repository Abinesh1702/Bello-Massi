import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserCheck, Crown, AlertTriangle, Plus, Eye, Pencil, Trash2, Ban } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import RowActions from '../../components/common/RowActions'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { CreditBadge, CustomerStatusBadge, VipBadge } from '../../components/masterdata/Badges'
import { useMasterData } from '../../hooks/useMasterData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { useDeleteFlow } from '../../hooks/useDeleteFlow'
import { deleteCustomer, getCreditInfo, getCustomerDeleteBlockers, getVipStatus, searchCustomers, updateCustomer } from '../../services/customerService'
import { downloadCsv, csvFilename } from '../../services/csvService'
import { customerCsvColumns } from './customerColumns'
import { CREDIT_STATUS, OPTIONS, VIP_STATUS } from '../../config/masterData'
import { formatCompactCurrency } from '../../utils/formatters'

const FILTERS = ['type', 'status', 'vip', 'credit', 'salesRepId', 'creditStatus']

export default function CustomerList() {
  const navigate = useNavigate()
  const { customers, salesReps, lookups } = useMasterData()
  const canManage = usePermission('customers.manage')
  const t = useTableQuery({ filters: FILTERS, sort: 'name' })

  const filtered = useMemo(() => searchCustomers(t.q, t.filters, customers), [customers, t.q, t.filters])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, {
    salesman: (c) => lookups.people[c.salesRepId]?.name || '',
    credit: (c) => getCreditInfo(c).utilisation,
    since: (c) => c.customerSince,
  }), [filtered, t.sort, t.dir, lookups])

  const kpi = useMemo(() => ({
    active: customers.filter((c) => c.status === 'Active').length,
    vip: customers.filter((c) => getVipStatus(c) === VIP_STATUS.ACTIVE).length,
    vipAll: customers.filter((c) => c.isVip).length,
    exceeded: customers.filter((c) => getCreditInfo(c).status === CREDIT_STATUS.EXCEEDED).length,
    near: customers.filter((c) => getCreditInfo(c).status === CREDIT_STATUS.NEAR).length,
  }), [customers])

  const del = useDeleteFlow({
    entity: 'customer',
    getBlockers: getCustomerDeleteBlockers,
    remove: deleteCustomer,
    alternative: canManage && {
      label: 'Mark as Inactive',
      suggestion: 'Inactive customers stay in order history and reports but are hidden from new orders.',
      run: (c) => {
        const res = updateCustomer(c.id, { ...c, status: 'Inactive' })
        if (res.ok) toast.success(`${c.name} marked Inactive`)
        else toast.error(Object.values(res.errors)[0])
      },
    },
  })

  const onExport = () => {
    const n = downloadCsv(csvFilename('customers'), rows, customerCsvColumns(lookups))
    toast.success(`Exported ${n} customer${n === 1 ? '' : 's'}`)
  }

  const columns = [
    {
      key: 'name', header: 'Customer', sortable: true,
      render: (c) => (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-ink">{c.name}</span>
            <VipBadge customer={c} />
          </div>
          <p className="text-xs text-muted tabular">{c.code} · {c.contactPerson}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', sortable: true, hideBelow: 'md', render: (c) => (<div><p>{c.type}</p><p className="text-xs text-muted">{c.category}</p></div>) },
    { key: 'city', header: 'City', sortable: true, hideBelow: 'lg' },
    { key: 'salesman', header: 'Salesman', sortable: true, hideBelow: 'xl', render: (c) => <span className="text-muted">{lookups.people[c.salesRepId]?.name || '—'}</span> },
    {
      key: 'credit', header: 'Credit', sortable: true, hideBelow: 'sm',
      render: (c) => {
        const info = getCreditInfo(c)
        return (
          <div>
            <CreditBadge status={info.status} />
            {info.enabled && <p className="text-xs text-muted mt-1 tabular">{formatCompactCurrency(info.available)} available</p>}
          </div>
        )
      },
    },
    { key: 'status', header: 'Status', sortable: true, render: (c) => <CustomerStatusBadge status={c.status} /> },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      render: (c) => (
        <RowActions
          label={`Actions for ${c.name}`}
          items={[
            { label: 'View', icon: Eye, to: `/customers/${c.id}` },
            { label: 'Edit', icon: Pencil, to: `/customers/${c.id}/edit`, hidden: !canManage },
            { label: 'Delete', icon: Trash2, danger: true, onClick: () => del.request(c), hidden: !canManage },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Customers"
        description="Customer accounts, contacts, credit configuration and VIP passes."
        actions={canManage && <Button icon={Plus} to="/customers/create">Add customer</Button>}
      />
      <StatGrid cols={4}>
        <StatCard label="Total customers" value={customers.length} icon={Users} tone="brand" hint={`${customers.length - kpi.active} inactive or blocked`} />
        <StatCard label="Active customers" value={kpi.active} icon={UserCheck} tone="success" to="/customers?status=Active" hint="Filter to active" />
        <StatCard label="VIP customers" value={kpi.vipAll} icon={Crown} tone="accent" to="/customers?vip=yes" hint={`${kpi.vip} with an active pass`} />
        <StatCard label="Credit exceeded" value={kpi.exceeded} icon={AlertTriangle} tone="danger" to={`/customers?creditStatus=${encodeURIComponent(CREDIT_STATUS.EXCEEDED)}`} hint={`${kpi.near} near limit`} />
      </StatGrid>

      <Card className="mt-6">
        <FilterToolbar
          query={t.q}
          onQuery={t.setQuery}
          placeholder="Search name, code, contact, city, GSTIN…"
          total={customers.length}
          filteredCount={rows.length}
          activeCount={t.activeFilterCount}
          onReset={t.reset}
          onExport={onExport}
        >
          <FilterSelect label="Customer type" allLabel="All types" value={t.filters.type} onChange={(v) => t.setFilter('type', v)} options={OPTIONS.customerTypes} />
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={OPTIONS.customerStatuses} />
          <FilterSelect label="VIP" allLabel="VIP: all" value={t.filters.vip} onChange={(v) => t.setFilter('vip', v)}
            options={[{ value: 'yes', label: 'VIP customers' }, { value: VIP_STATUS.ACTIVE, label: 'VIP pass active' }, { value: VIP_STATUS.EXPIRED, label: 'VIP pass expired' }, { value: 'no', label: 'Non-VIP' }]} />
          <FilterSelect label="Credit" allLabel="Credit: all" value={t.filters.credit} onChange={(v) => t.setFilter('credit', v)} options={[{ value: 'enabled', label: 'Credit enabled' }, { value: 'disabled', label: 'Credit disabled' }]} />
          <FilterSelect label="Credit status" allLabel="Any credit status" value={t.filters.creditStatus} onChange={(v) => t.setFilter('creditStatus', v)} options={OPTIONS.creditStatuses} />
          <FilterSelect label="Assigned salesman" allLabel="All salesmen" value={t.filters.salesRepId} onChange={(v) => t.setFilter('salesRepId', v)} options={salesReps.map((r) => ({ value: r.id, label: r.name }))} />
        </FilterToolbar>
        <DataTable
          caption="Customers"
          columns={columns}
          rows={rows}
          pageSize={10}
          page={t.page}
          onPageChange={t.setPage}
          sort={t.sort}
          dir={t.dir}
          onSort={t.setSort}
          onRowClick={(c) => navigate(`/customers/${c.id}`)}
          empty={
            <EmptyState
              icon={Ban}
              title={customers.length ? 'No customers match these filters' : 'No customers yet'}
              description={customers.length ? 'Try a different search or clear the filters.' : 'Add your first customer to get started.'}
              action={customers.length ? <Button variant="secondary" onClick={t.reset}>Clear filters</Button> : canManage && <Button icon={Plus} to="/customers/create">Add customer</Button>}
            />
          }
        />
      </Card>
      {del.dialogs}
    </>
  )
}
