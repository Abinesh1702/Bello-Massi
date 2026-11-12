import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Navigation, CheckCircle2, AlertTriangle, PackageCheck, Eye, Route, UserRound, FileText, History } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import RowActions from '../../components/common/RowActions'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { DeliveryStatusBadge, DispatchStatusBadge, OtpStatusBadge } from '../../components/dispatch/DispatchBadges'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { searchDeliveries } from '../../services/deliveryService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { DELIVERY_STATUS_META, DISPATCH_OPTIONS, DISPATCH_STATUS_META, TERMINAL_DELIVERY_STATUSES } from '../../config/dispatchConfig'
import { formatDate, formatRelative } from '../../utils/formatters'

/** Live view of every delivery stop created by confirmed dispatches. */
export default function DeliveryTracking() {
  const navigate = useNavigate()
  const { deliveries, dispatches, hubs, zones, drivers, customers, lk } = useDispatchData()
  const canDrivers = usePermission('fleet.view')
  const t = useTableQuery({ filters: ['from', 'to', 'hubId', 'zoneId', 'driverId', 'dispatchStatus', 'status', 'customerId', 'order'], sort: 'updatedAt', dir: 'desc' })
  const visible = useMemo(() => deliveries.filter((d) => d.status !== 'CANCELLED'), [deliveries])
  const filtered = useMemo(() => searchDeliveries(t.q, t.filters, visible, { dispatches }), [visible, t.q, t.filters, dispatches])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, { date: (d) => lk.dispatches[d.dispatchId]?.dispatchDate, driver: (d) => lk.dispatches[d.dispatchId]?.driverName }), [filtered, t.sort, t.dir, lk])
  const progress = (d) => {
    const mine = deliveries.filter((x) => x.dispatchId === d.dispatchId && x.status !== 'CANCELLED')
    return `${mine.filter((x) => TERMINAL_DELIVERY_STATUSES.includes(x.status)).length}/${mine.length}`
  }

  const onExport = () => {
    const n = downloadCsv(csvFilename('delivery-tracking'), rows, [
      { header: 'Dispatch Number', value: (d) => d.dispatchNumber }, { header: 'Order Number', value: (d) => d.orderNumber }, { header: 'Customer', value: (d) => d.customerName },
      { header: 'Driver', value: (d) => lk.dispatches[d.dispatchId]?.driverName || '' }, { header: 'Vehicle', value: (d) => lk.dispatches[d.dispatchId]?.vehicleNumber || '' },
      { header: 'Hub', value: (d) => lk.hubs[d.hubId]?.name }, { header: 'Zone', value: (d) => lk.zones[lk.dispatches[d.dispatchId]?.zoneId]?.name || '' },
      { header: 'Dispatch Date', value: (d) => lk.dispatches[d.dispatchId]?.dispatchDate }, { header: 'Stop', value: (d) => d.sequence },
      { header: 'Delivery Status', value: (d) => DELIVERY_STATUS_META[d.status]?.label }, { header: 'Dispatch Status', value: (d) => DISPATCH_STATUS_META[lk.dispatches[d.dispatchId]?.status]?.label || '' },
      { header: 'Dispatch Progress', value: (d) => progress(d) }, { header: 'OTP Status', value: (d) => d.otpStatus }, { header: 'Delivery Note', value: (d) => d.deliveryNoteNumber || '' },
      { header: 'Last Updated', value: (d) => d.updatedAt },
    ])
    toast.success(`Exported ${n} deliveries`)
  }

  const columns = [
    { key: 'orderNumber', header: 'Order / customer', sortable: true, render: (d) => (<div><p className="font-medium tabular whitespace-nowrap">{d.orderNumber}</p><p className="text-xs text-muted truncate max-w-[200px]">{d.customerName}</p></div>) },
    { key: 'dispatchNumber', header: 'Dispatch', sortable: true, hideBelow: 'md', render: (d) => (<div><p className="tabular text-xs whitespace-nowrap">{d.dispatchNumber} · stop {d.sequence}</p><div className="mt-0.5"><DispatchStatusBadge status={lk.dispatches[d.dispatchId]?.status} /></div></div>) },
    { key: 'driver', header: 'Driver / vehicle', sortable: true, hideBelow: 'lg', render: (d) => (<div><p>{lk.dispatches[d.dispatchId]?.driverName}</p><p className="text-xs text-muted tabular">{lk.dispatches[d.dispatchId]?.vehicleNumber}</p></div>) },
    { key: 'zone', header: 'Hub / zone', hideBelow: '2xl', render: (d) => (<div><p>{lk.hubs[d.hubId]?.city}</p><p className="text-xs text-muted">{lk.zones[lk.dispatches[d.dispatchId]?.zoneId]?.name}</p></div>) },
    { key: 'date', header: 'Date', sortable: true, hideBelow: 'xl', render: (d) => <span className="whitespace-nowrap">{formatDate(lk.dispatches[d.dispatchId]?.dispatchDate)}</span> },
    { key: 'status', header: 'Delivery', sortable: true, render: (d) => <DeliveryStatusBadge status={d.status} /> },
    { key: 'progress', header: 'Progress', align: 'right', hideBelow: 'sm', render: (d) => <span className="tabular">{progress(d)}</span> },
    { key: 'otp', header: 'OTP', hideBelow: 'xl', render: (d) => <OtpStatusBadge status={d.otpStatus} /> },
    { key: 'note', header: 'Note', hideBelow: '2xl', render: (d) => (d.deliveryNoteNumber ? <span className="tabular text-xs">{d.deliveryNoteNumber}</span> : <span className="text-muted">—</span>) },
    { key: 'updatedAt', header: 'Updated', sortable: true, hideBelow: 'lg', render: (d) => <span className="text-xs text-muted whitespace-nowrap">{formatRelative(d.updatedAt)}</span> },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      render: (d) => (
        <RowActions label={`Actions for ${d.orderNumber}`} items={[
          { label: 'View delivery', icon: Eye, to: `/dispatch/deliveries/${d.id}` },
          { label: 'View timeline', icon: History, to: `/dispatch/deliveries/${d.id}?tab=timeline` },
          { label: 'View dispatch', icon: Route, to: `/dispatch/${d.dispatchId}` },
          { label: 'View driver', icon: UserRound, to: `/dispatch/drivers/${d.driverId}`, hidden: !canDrivers || !lk.drivers[d.driverId] },
          { label: 'Delivery note', icon: FileText, to: `/dispatch/delivery-notes/${d.deliveryNoteId}`, hidden: !d.deliveryNoteId },
        ]} />
      ),
    },
  ]
  const count = (st) => visible.filter((d) => st.includes(d.status)).length
  return (
    <>
      <PageHeader title="Delivery tracking" description="Every stop of every confirmed dispatch, updated as drivers start and close deliveries." />
      <StatGrid cols={5}>
        <StatCard label="Dispatched, not started" value={count(['DISPATCHED'])} icon={Truck} tone="info" to="/dispatch/delivery-tracking?status=DISPATCHED" />
        <StatCard label="Out for delivery" value={count(['OUT_FOR_DELIVERY'])} icon={Navigation} tone="accent" to="/dispatch/delivery-tracking?status=OUT_FOR_DELIVERY" />
        <StatCard label="Delivered" value={count(['DELIVERED'])} icon={CheckCircle2} tone="success" to="/dispatch/delivery-tracking?status=DELIVERED" />
        <StatCard label="Partial" value={count(['PARTIALLY_DELIVERED'])} icon={PackageCheck} tone="warning" to="/dispatch/delivery-tracking?status=PARTIALLY_DELIVERED" />
        <StatCard label="Failed / returned" value={count(['FAILED', 'RETURNED'])} icon={AlertTriangle} tone="danger" to="/dispatch/delivery-tracking?status=FAILED" />
      </StatGrid>
      <Card className="mt-6">
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search order, customer, dispatch, note…" total={visible.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterInput label="From date" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} title="Dispatch date from" />
          <FilterInput label="To date" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} title="Dispatch date to" />
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Zone" allLabel="All zones" value={t.filters.zoneId} onChange={(v) => t.setFilter('zoneId', v)} options={zones.map((z) => ({ value: z.id, label: z.name }))} />
          <FilterSelect label="Driver" allLabel="All drivers" value={t.filters.driverId} onChange={(v) => t.setFilter('driverId', v)} options={drivers.map((d) => ({ value: d.id, label: d.name }))} />
          <FilterSelect label="Dispatch status" allLabel="Any dispatch status" value={t.filters.dispatchStatus} onChange={(v) => t.setFilter('dispatchStatus', v)} options={DISPATCH_OPTIONS.dispatchStatuses.filter((o) => !['DRAFT', 'PLANNED', 'ASSIGNED'].includes(o.value))} />
          <FilterSelect label="Delivery status" allLabel="Any delivery status" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={DISPATCH_OPTIONS.deliveryStatuses.filter((o) => o.value !== 'CANCELLED')} />
          <FilterSelect label="Customer" allLabel="All customers" value={t.filters.customerId} onChange={(v) => t.setFilter('customerId', v)} options={customers.filter((c) => visible.some((d) => d.customerId === c.id)).map((c) => ({ value: c.id, label: c.name }))} />
          <FilterInput label="Order number" value={t.filters.order} onChange={(e) => t.setFilter('order', e.target.value)} placeholder="Order no." />
        </FilterToolbar>
        <DataTable caption="Delivery tracking" columns={columns} rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort} onRowClick={(d) => navigate(`/dispatch/deliveries/${d.id}`)}
          empty={<EmptyState icon={Truck} title="No deliveries match these filters" />} />
      </Card>
    </>
  )
}
