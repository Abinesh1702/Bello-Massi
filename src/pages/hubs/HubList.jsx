import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warehouse, CheckCircle2, IndianRupee, AlertTriangle, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import RowActions from '../../components/common/RowActions'
import Badge from '../../components/common/Badge'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { HubStatusBadge } from '../../components/masterdata/Badges'
import { useMasterData } from '../../hooks/useMasterData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { useDeleteFlow } from '../../hooks/useDeleteFlow'
import { deleteHub, getHubDeleteBlockers, searchHubs, updateHub, formatHubAddress } from '../../services/hubService'
import { getHubStockSummary } from '../../services/inventoryService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { OPTIONS } from '../../config/masterData'
import { formatCompactCurrency, formatNumber } from '../../utils/formatters'

export const hubDeleteAlternative = (canManage) => canManage && {
  label: 'Mark as Inactive',
  suggestion: 'Inactive hubs keep their stock and history but stop receiving stock and new orders. Move the stock out with a transfer, then delete if needed.',
  run: (h) => {
    const res = updateHub(h.id, { ...h, status: 'Inactive' })
    if (res.ok) toast.success(`${h.name} marked Inactive`)
    else toast.error(Object.values(res.errors)[0])
  },
}

export default function HubList() {
  const navigate = useNavigate()
  const { hubs, stockRows } = useMasterData()
  const canManage = usePermission('hubs.manage')
  const t = useTableQuery({ filters: ['hubType', 'status'], sort: 'name' })

  const summary = useMemo(() => Object.fromEntries(getHubStockSummary(stockRows, hubs).map((s) => [s.id, s])), [stockRows, hubs])
  const filtered = useMemo(() => searchHubs(t.q, t.filters, hubs), [hubs, t.q, t.filters])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, {
    location: (h) => h.city, products: (h) => summary[h.id]?.products ?? 0, value: (h) => summary[h.id]?.value ?? 0, low: (h) => (summary[h.id]?.low ?? 0) + (summary[h.id]?.out ?? 0),
  }), [filtered, t.sort, t.dir, summary])

  const del = useDeleteFlow({ entity: 'hub', getBlockers: getHubDeleteBlockers, remove: deleteHub, formatReason: (r) => `This hub ${r}.`, alternative: hubDeleteAlternative(canManage) })
  const totals = Object.values(summary)

  const onExport = () => {
    const n = downloadCsv(csvFilename('hubs'), rows, [
      { header: 'Hub ID', value: (h) => h.id },
      { header: 'Hub Code', value: (h) => h.code },
      { header: 'Hub Name', value: (h) => h.name },
      { header: 'Hub Type', value: (h) => h.hubType },
      { header: 'Status', value: (h) => h.status },
      { header: 'Manager', value: (h) => h.managerName },
      { header: 'Contact Number', value: (h) => h.contactNumber },
      { header: 'Email', value: (h) => h.email },
      { header: 'Address', value: (h) => formatHubAddress(h) },
      { header: 'City', value: (h) => h.city },
      { header: 'State', value: (h) => h.state },
      { header: 'Pincode', value: (h) => h.pincode },
      { header: 'Operating Hours', value: (h) => h.operatingHours },
      { header: 'Products in Stock', value: (h) => summary[h.id]?.products ?? 0 },
      { header: 'Total Quantity', value: (h) => summary[h.id]?.quantity ?? 0 },
      { header: 'Stock Value (INR)', value: (h) => Math.round(summary[h.id]?.value ?? 0) },
      { header: 'Low Stock Lines', value: (h) => summary[h.id]?.low ?? 0 },
      { header: 'Out of Stock Lines', value: (h) => summary[h.id]?.out ?? 0 },
    ])
    toast.success(`Exported ${n} hub${n === 1 ? '' : 's'}`)
  }

  const columns = [
    { key: 'name', header: 'Hub', sortable: true, render: (h) => (<div><p className="font-medium text-ink">{h.name}</p><p className="text-xs text-muted tabular">{h.code} · {h.hubType}</p></div>) },
    { key: 'location', header: 'Location', sortable: true, hideBelow: 'md', render: (h) => (<div><p>{h.city}</p><p className="text-xs text-muted">{h.state}</p></div>) },
    { key: 'managerName', header: 'Manager', sortable: true, hideBelow: 'lg', render: (h) => (<div><p>{h.managerName}</p><p className="text-xs text-muted">{h.contactNumber}</p></div>) },
    { key: 'products', header: 'Products', align: 'right', sortable: true, hideBelow: 'sm', render: (h) => formatNumber(summary[h.id]?.products ?? 0) },
    { key: 'value', header: 'Stock value', align: 'right', sortable: true, hideBelow: 'sm', render: (h) => formatCompactCurrency(summary[h.id]?.value ?? 0) },
    { key: 'low', header: 'Low / out', align: 'right', sortable: true, hideBelow: 'md', render: (h) => { const s = summary[h.id]; const n = (s?.low ?? 0) + (s?.out ?? 0); return n ? <Badge tone={s?.out ? 'danger' : 'warning'}>{n}</Badge> : <span className="text-muted">0</span> } },
    { key: 'status', header: 'Status', sortable: true, render: (h) => <HubStatusBadge status={h.status} /> },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      render: (h) => (
        <RowActions label={`Actions for ${h.name}`} items={[
          { label: 'View', icon: Eye, to: `/hubs/${h.id}` },
          { label: 'Edit', icon: Pencil, to: `/hubs/${h.id}/edit`, hidden: !canManage },
          { label: 'Delete', icon: Trash2, danger: true, onClick: () => del.request(h), hidden: !canManage },
        ]} />
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Hubs" description="Warehouses and distribution hubs, their managers and the stock they hold." actions={canManage && <Button icon={Plus} to="/hubs/create">Add hub</Button>} />
      <StatGrid cols={4}>
        <StatCard label="Total hubs" value={hubs.length} icon={Warehouse} tone="brand" hint={`${new Set(hubs.map((h) => h.state)).size} states`} />
        <StatCard label="Active hubs" value={hubs.filter((h) => h.status === 'Active').length} icon={CheckCircle2} tone="success" to="/hubs?status=Active" hint="Filter to active" />
        <StatCard label="Stock value" value={formatCompactCurrency(totals.reduce((s, x) => s + x.value, 0))} icon={IndianRupee} tone="accent" hint="All hubs, at purchase price" />
        <StatCard label="Low / out lines" value={totals.reduce((s, x) => s + x.low + x.out, 0)} icon={AlertTriangle} tone="warning" hint="Across all hubs" />
      </StatGrid>
      <Card className="mt-6">
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search hub, code, city, manager…" total={hubs.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Hub type" allLabel="All hub types" value={t.filters.hubType} onChange={(v) => t.setFilter('hubType', v)} options={OPTIONS.hubTypes} />
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={OPTIONS.hubStatuses} />
        </FilterToolbar>
        <DataTable caption="Hubs" columns={columns} rows={rows} pageSize={10} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort}
          onRowClick={(h) => navigate(`/hubs/${h.id}`)}
          empty={<EmptyState icon={Warehouse} title={hubs.length ? 'No hubs match these filters' : 'No hubs yet'} action={hubs.length ? <Button variant="secondary" onClick={t.reset}>Clear filters</Button> : canManage && <Button icon={Plus} to="/hubs/create">Add hub</Button>} />} />
      </Card>
      {del.dialogs}
    </>
  )
}
