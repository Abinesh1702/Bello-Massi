import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Route, MapPinned, Truck, UserRound, Calendar, Columns3, List } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import { DispatchStatusBadge } from '../../components/dispatch/DispatchBadges'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { getUnplannedReadyOrders, searchDispatches } from '../../services/dispatchService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { DISPATCH_OPTIONS, DISPATCH_STATUS_META } from '../../config/dispatchConfig'
import { formatDate, formatMoney, formatNumber } from '../../utils/formatters'

const COLUMNS = ['DRAFT', 'PLANNED', 'ASSIGNED', 'CONFIRMED', 'IN_TRANSIT']

function PlanCard({ d, lk }) {
  return (
    <Link to={`/dispatch/${d.id}`} className="block rounded-xl border border-line bg-surface p-3 shadow-card hover:border-accent focus-visible:outline-2 focus-visible:outline-accent" data-testid={`plan-${d.dispatchNumber}`}>
      <p className="text-[13px] font-semibold text-ink tabular whitespace-nowrap">{d.dispatchNumber}</p>
      <p className="text-xs text-muted">{formatDate(d.dispatchDate, 'DD MMM YYYY')}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted"><MapPinned size={12} aria-hidden /> {lk.zones[d.zoneId]?.name || 'No zone'} · {lk.hubs[d.hubId]?.city || ''}</p>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><UserRound size={12} aria-hidden /> {d.driverName || <span className="text-warning">Driver needed</span>}{d.vehicleNumber ? ` · ${d.vehicleNumber}` : ''}</p>
      <p className="mt-2 text-xs text-ink">{d.totalDeliveries} stop{d.totalDeliveries === 1 ? '' : 's'} · {formatNumber(d.totalQuantity)} units · {formatMoney(d.totalValue)}</p>
    </Link>
  )
}

export default function DispatchPlanning() {
  const navigate = useNavigate()
  const { dispatches, orders, hubs, zones, drivers, lk } = useDispatchData()
  const canPlan = usePermission('dispatch.manage')
  const t = useTableQuery({ filters: ['view', 'hubId', 'zoneId', 'driverId', 'status', 'from', 'to'], sort: 'dispatchDate', dir: 'desc' })
  const view = t.filters.view || 'board'
  const filtered = useMemo(() => searchDispatches(t.q, t.filters, dispatches), [dispatches, t.q, t.filters])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, { zone: (d) => lk.zones[d.zoneId]?.name }), [filtered, t.sort, t.dir, lk])
  const unplanned = useMemo(() => getUnplannedReadyOrders(orders, dispatches), [orders, dispatches])
  const groups = useMemo(() => {
    const g = {}
    unplanned.forEach((o) => {
      const k = `${o.hubId}|${o.zoneId}`
      g[k] ||= { hubId: o.hubId, zoneId: o.zoneId, orders: 0, qty: 0, value: 0 }
      g[k].orders += 1
      g[k].qty += o.totalQuantity
      g[k].value += o.totalAmount
    })
    return Object.values(g).sort((a, b) => b.orders - a.orders)
  }, [unplanned])

  const onExport = () => {
    const n = downloadCsv(csvFilename('dispatches'), rows, [
      { header: 'Dispatch Number', value: (d) => d.dispatchNumber }, { header: 'Dispatch Date', value: (d) => d.dispatchDate }, { header: 'Hub', value: (d) => lk.hubs[d.hubId]?.name },
      { header: 'Zone', value: (d) => lk.zones[d.zoneId]?.name || '' }, { header: 'Driver', value: (d) => d.driverName || '' }, { header: 'Vehicle', value: (d) => d.vehicleNumber || '' },
      { header: 'Deliveries', value: (d) => d.totalDeliveries }, { header: 'Total Quantity', value: (d) => d.totalQuantity }, { header: 'Total Value', value: (d) => Number(d.totalValue).toFixed(2) },
      { header: 'Status', value: (d) => DISPATCH_STATUS_META[d.status]?.label }, { header: 'Created At', value: (d) => d.createdAt }, { header: 'Notes', value: (d) => d.notes },
    ])
    toast.success(`Exported ${n} dispatches`)
  }

  const columns = [
    { key: 'dispatchNumber', header: 'Dispatch', sortable: true, render: (d) => (<div><p className="font-medium tabular whitespace-nowrap">{d.dispatchNumber}</p><p className="text-xs text-muted">{lk.hubs[d.hubId]?.name}</p></div>) },
    { key: 'dispatchDate', header: 'Date', sortable: true, render: (d) => <span className="whitespace-nowrap">{formatDate(d.dispatchDate)}</span> },
    { key: 'zone', header: 'Zone', sortable: true, hideBelow: 'md', render: (d) => lk.zones[d.zoneId]?.name || '—' },
    { key: 'driverName', header: 'Driver / vehicle', sortable: true, hideBelow: 'lg', render: (d) => (<div><p>{d.driverName || '—'}</p><p className="text-xs text-muted tabular">{d.vehicleNumber || ''}</p></div>) },
    { key: 'totalDeliveries', header: 'Stops', align: 'right', sortable: true, hideBelow: 'sm', render: (d) => d.totalDeliveries },
    { key: 'totalValue', header: 'Value', align: 'right', sortable: true, hideBelow: 'xl', render: (d) => <span className="whitespace-nowrap">{formatMoney(d.totalValue)}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (d) => <DispatchStatusBadge status={d.status} /> },
  ]

  return (
    <>
      <PageHeader title="Dispatch planning" description="Group ready orders by zone, build dispatch plans, assign drivers and vehicles, then confirm to load and deduct stock."
        actions={canPlan && <Button icon={Plus} to="/dispatch/create">New dispatch plan</Button>} />
      <Card className="mb-6">
        <CardHeader title="Ready orders by zone" icon={MapPinned} subtitle={`${unplanned.length} order${unplanned.length === 1 ? '' : 's'} not yet on a plan`} action={<Button size="sm" variant="secondary" to="/dispatch/ready-orders">Ready queue</Button>} />
        {groups.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {groups.map((g) => (
              <div key={`${g.hubId}|${g.zoneId}`} className="rounded-xl border border-line p-3">
                <p className="text-sm font-semibold text-ink">{lk.zones[g.zoneId]?.name || 'No zone'}</p>
                <p className="text-xs text-muted">{lk.hubs[g.hubId]?.name}</p>
                <p className="mt-2 text-xs text-ink">{g.orders} order{g.orders === 1 ? '' : 's'} · {formatNumber(g.qty)} units · {formatMoney(g.value)}</p>
                {canPlan && <Button size="xs" className="mt-2" icon={Route} onClick={() => navigate(`/dispatch/create?hubId=${g.hubId}&zoneId=${g.zoneId}&orders=${unplanned.filter((o) => o.hubId === g.hubId && o.zoneId === g.zoneId).map((o) => o.id).join(',')}`)}>Plan this zone</Button>}
              </div>
            ))}
          </div>
        ) : <EmptyState compact title="Every ready order is on a plan" />}
      </Card>
      <Card>
        <Tabs value={view} onChange={(v) => t.setFilter('view', v === 'board' ? '' : v)} className="mb-4" tabs={[{ id: 'board', label: 'Board', icon: Columns3 }, { id: 'list', label: 'All dispatches', icon: List }]} />
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search dispatch, driver, vehicle…" total={dispatches.length} filteredCount={rows.length} activeCount={t.activeFilterCount - (t.filters.view ? 1 : 0)} onReset={() => { t.reset(); if (view !== 'board') t.setFilter('view', view) }} onExport={onExport}>
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Zone" allLabel="All zones" value={t.filters.zoneId} onChange={(v) => t.setFilter('zoneId', v)} options={zones.map((z) => ({ value: z.id, label: z.name }))} />
          <FilterSelect label="Driver" allLabel="All drivers" value={t.filters.driverId} onChange={(v) => t.setFilter('driverId', v)} options={drivers.map((d) => ({ value: d.id, label: d.name }))} />
          {view === 'list' && <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={DISPATCH_OPTIONS.dispatchStatuses} />}
          <FilterInput label="From date" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} title="Dispatch date from" />
          <FilterInput label="To date" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} title="Dispatch date to" />
        </FilterToolbar>
        {view === 'board' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {COLUMNS.map((st) => {
              const list = rows.filter((d) => d.status === st)
              return (
                <section key={st} aria-label={DISPATCH_STATUS_META[st].label} className="rounded-xl bg-surface-2/60 p-3">
                  <div className="mb-3 flex items-center justify-between"><DispatchStatusBadge status={st} /><span className="text-xs font-semibold text-muted tabular">{list.length}</span></div>
                  <div className="space-y-2">
                    {list.map((d) => <PlanCard key={d.id} d={d} lk={lk} />)}
                    {!list.length && <p className="py-4 text-center text-xs text-muted">None</p>}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <DataTable caption="Dispatches" columns={columns} rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort} onRowClick={(d) => navigate(`/dispatch/${d.id}`)}
            empty={<EmptyState icon={Truck} title="No dispatches match these filters" />} />
        )}
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><Calendar size={12} aria-hidden /> Completed and cancelled dispatches are listed under “All dispatches”.</p>
      </Card>
    </>
  )
}
