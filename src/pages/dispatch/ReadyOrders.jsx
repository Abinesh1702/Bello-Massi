import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackageCheck, Route, Boxes, IndianRupee, Eye, Plus, Truck } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import RowActions from '../../components/common/RowActions'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { PriorityBadge } from '../../components/orders/OrderBadges'
import { DispatchStatusBadge } from '../../components/dispatch/DispatchBadges'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { isActiveDispatch } from '../../services/dispatchService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { ORDER_STATUS as S } from '../../utils/constants'
import { ORDER_OPTIONS } from '../../config/orderConfig'
import { formatCompactCurrency, formatDate, formatMoney, formatNumber } from '../../utils/formatters'

const PRIORITY_RANK = { Urgent: 0, High: 1, Normal: 2, Low: 3 }

/** Orders released by Customer Service (READY_FOR_DISPATCH) — the only orders that can be dispatched. */
export default function ReadyOrders() {
  const navigate = useNavigate()
  const { orders, hubs, zones, customers, lk } = useDispatchData()
  const canPlan = usePermission('dispatch.manage')
  const t = useTableQuery({ filters: ['customerId', 'hubId', 'zoneId', 'priority', 'plan', 'from', 'to'], sort: 'priority' })
  const [selected, setSelected] = useState([])

  const ready = useMemo(() => orders.filter((o) => o.orderStatus === S.READY_FOR_DISPATCH).map((o) => {
    const plan = o.dispatchId && isActiveDispatch(lk.dispatches[o.dispatchId]) ? lk.dispatches[o.dispatchId] : null
    return { ...o, plan, customerMobile: lk.customers[o.customerId]?.mobile || '', zoneName: lk.zones[o.zoneId]?.name || '—', productCount: o.items.length }
  }), [orders, lk])
  const filtered = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const f = t.filters
    return ready.filter((o) => {
      if (q && ![o.orderNumber, o.customerName, o.deliveryAddress, o.deliveryPincode, o.plan?.dispatchNumber].some((v) => String(v || '').toLowerCase().includes(q))) return false
      if (f.customerId && o.customerId !== f.customerId) return false
      if (f.hubId && o.hubId !== f.hubId) return false
      if (f.zoneId && o.zoneId !== f.zoneId) return false
      if (f.priority && o.orderPriority !== f.priority) return false
      if (f.plan === 'unplanned' && o.plan) return false
      if (f.plan === 'planned' && !o.plan) return false
      if (f.from && o.requestedDeliveryDate < f.from) return false
      if (f.to && o.requestedDeliveryDate > f.to) return false
      return true
    })
  }, [ready, t.q, t.filters])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, {
    priority: (o) => `${PRIORITY_RANK[o.orderPriority] ?? 2}-${o.requestedDeliveryDate}`, date: (o) => o.requestedDeliveryDate, amount: (o) => o.totalAmount, qty: (o) => o.totalQuantity, hub: (o) => o.hubName, zone: (o) => o.zoneName,
  }), [filtered, t.sort, t.dir])

  const selectable = (o) => canPlan && !o.plan
  const selRows = rows.filter((o) => selected.includes(o.id))
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const pageSel = rows.filter(selectable)
  const allSelected = pageSel.length > 0 && pageSel.every((o) => selected.includes(o.id))

  const createFrom = (list) => {
    const hubsInSel = [...new Set(list.map((o) => o.hubId))]
    if (!list.length) return toast.error('Select at least one unplanned order.')
    if (hubsInSel.length > 1) return toast.error('Selected orders come from different hubs.', { description: 'A dispatch can only carry orders from one fulfilment hub.' })
    navigate(`/dispatch/create?hubId=${hubsInSel[0]}&orders=${list.map((o) => o.id).join(',')}`)
    return null
  }

  const onExport = () => {
    const n = downloadCsv(csvFilename('ready-for-dispatch'), rows, [
      { header: 'Order Number', value: (o) => o.orderNumber }, { header: 'Customer', value: (o) => o.customerName }, { header: 'Customer Mobile', value: (o) => o.customerMobile },
      { header: 'Hub', value: (o) => o.hubName }, { header: 'Zone', value: (o) => o.zoneName }, { header: 'Products', value: (o) => o.productCount },
      { header: 'Total Quantity', value: (o) => o.totalQuantity }, { header: 'Order Amount', value: (o) => o.totalAmount.toFixed(2) },
      { header: 'Delivery Address', value: (o) => o.deliveryAddress }, { header: 'Pincode', value: (o) => o.deliveryPincode },
      { header: 'Requested Delivery Date', value: (o) => o.requestedDeliveryDate }, { header: 'Priority', value: (o) => o.orderPriority },
      { header: 'Dispatch Status', value: (o) => (o.plan ? `${o.plan.dispatchNumber} (${o.plan.status})` : 'Not planned') },
    ])
    toast.success(`Exported ${n} orders`)
  }

  const columns = [
    ...(canPlan ? [{
      key: 'sel', header: <input type="checkbox" aria-label="Select all unplanned orders" className="h-4 w-4 accent-[#232B5F]" checked={allSelected} onChange={() => setSelected(allSelected ? [] : pageSel.map((o) => o.id))} />,
      render: (o) => <input type="checkbox" aria-label={`Select ${o.orderNumber}`} className="h-4 w-4 accent-[#232B5F] disabled:opacity-30" disabled={!selectable(o)} checked={selected.includes(o.id)} onChange={() => toggle(o.id)} onClick={(e) => e.stopPropagation()} />,
    }] : []),
    { key: 'orderNumber', header: 'Order', sortable: true, render: (o) => (<div><p className="font-medium tabular whitespace-nowrap">{o.orderNumber}</p><p className="text-xs text-muted">{o.productCount} products</p></div>) },
    { key: 'customerName', header: 'Customer', sortable: true, render: (o) => (<div className="max-w-[220px]"><p className="truncate">{o.customerName}</p><p className="text-xs text-muted tabular">{o.customerMobile}</p></div>) },
    { key: 'hub', header: 'Hub / zone', sortable: true, hideBelow: 'lg', render: (o) => (<div><p className="whitespace-nowrap">{o.hubName}</p><p className="text-xs text-muted">{o.zoneName}</p></div>) },
    { key: 'address', header: 'Delivery address', hideBelow: '2xl', render: (o) => <span className="block max-w-[220px] truncate text-xs" title={o.deliveryAddress}>{o.deliveryAddress} · {o.deliveryPincode}</span> },
    { key: 'qty', header: 'Qty', align: 'right', sortable: true, hideBelow: 'md', render: (o) => formatNumber(o.totalQuantity) },
    { key: 'amount', header: 'Amount', align: 'right', sortable: true, hideBelow: 'sm', render: (o) => <span className="whitespace-nowrap">{formatMoney(o.totalAmount)}</span> },
    { key: 'date', header: 'Requested', sortable: true, hideBelow: 'xl', render: (o) => <span className="whitespace-nowrap">{formatDate(o.requestedDeliveryDate)}</span> },
    { key: 'priority', header: 'Priority', sortable: true, hideBelow: 'md', render: (o) => <PriorityBadge priority={o.orderPriority} /> },
    { key: 'plan', header: 'Dispatch status', render: (o) => (o.plan ? <div className="space-y-0.5"><DispatchStatusBadge status={o.plan.status} /><p className="text-[11px] text-muted tabular">{o.plan.dispatchNumber}</p></div> : <span className="text-xs text-muted whitespace-nowrap">Not planned</span>) },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      render: (o) => (
        <RowActions label={`Actions for ${o.orderNumber}`} items={[
          { label: 'View order', icon: Eye, to: `/orders/${o.id}` },
          { label: 'Create dispatch', icon: Plus, onClick: () => createFrom([o]), hidden: !selectable(o) },
          { label: 'Open dispatch', icon: Truck, to: o.plan ? `/dispatch/${o.plan.id}` : undefined, hidden: !o.plan },
        ]} />
      ),
    },
  ]

  const unplanned = ready.filter((o) => !o.plan)
  return (
    <>
      <PageHeader title="Ready for dispatch" description="Orders released by Customer Service. Only these orders can be dispatched — drafts, submitted, returned, rejected and unconsolidated orders never appear here."
        actions={canPlan && <Button icon={Route} onClick={() => createFrom(selRows)} disabled={!selRows.length}>Create dispatch{selRows.length ? ` (${selRows.length})` : ''}</Button>} />
      <StatGrid cols={4}>
        <StatCard label="Ready orders" value={ready.length} icon={PackageCheck} tone="brand" hint={`${unplanned.length} not yet planned`} to="/dispatch/ready-orders?plan=unplanned" />
        <StatCard label="In a dispatch plan" value={ready.length - unplanned.length} icon={Route} tone="info" to="/dispatch/ready-orders?plan=planned" />
        <StatCard label="Units to dispatch" value={formatNumber(unplanned.reduce((s, o) => s + o.totalQuantity, 0))} icon={Boxes} tone="accent" hint="Unplanned orders" />
        <StatCard label="Value to dispatch" value={formatCompactCurrency(unplanned.reduce((s, o) => s + o.totalAmount, 0))} icon={IndianRupee} tone="success" hint="Unplanned orders, incl. GST" />
      </StatGrid>
      <Card className="mt-6">
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search order, customer, address, pincode…" total={ready.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Customer" allLabel="All customers" value={t.filters.customerId} onChange={(v) => t.setFilter('customerId', v)} options={customers.filter((c) => ready.some((o) => o.customerId === c.id)).map((c) => ({ value: c.id, label: c.name }))} />
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Zone" allLabel="All zones" value={t.filters.zoneId} onChange={(v) => t.setFilter('zoneId', v)} options={zones.filter((z) => !t.filters.hubId || z.hubId === t.filters.hubId).map((z) => ({ value: z.id, label: z.name }))} />
          <FilterSelect label="Priority" allLabel="All priorities" value={t.filters.priority} onChange={(v) => t.setFilter('priority', v)} options={ORDER_OPTIONS.priorities} />
          <FilterSelect label="Dispatch status" allLabel="Planned & unplanned" value={t.filters.plan} onChange={(v) => t.setFilter('plan', v)} options={[{ value: 'unplanned', label: 'Not planned' }, { value: 'planned', label: 'In a plan' }]} />
          <FilterInput label="Requested from" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} title="Requested delivery from" />
          <FilterInput label="Requested to" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} title="Requested delivery to" />
        </FilterToolbar>
        {canPlan && selRows.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-accent/10 px-3 py-2 text-sm">
            <span className="font-medium text-ink">{selRows.length} selected</span>
            <span className="text-muted">{formatNumber(selRows.reduce((s, o) => s + o.totalQuantity, 0))} units · {formatMoney(selRows.reduce((s, o) => s + o.totalAmount, 0))}</span>
            <Button size="sm" icon={Route} onClick={() => createFrom(selRows)}>Create dispatch</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
          </div>
        )}
        <DataTable caption="Orders ready for dispatch" columns={columns} rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort} onRowClick={(o) => navigate(`/orders/${o.id}`)}
          empty={<EmptyState icon={PackageCheck} title={ready.length ? 'No orders match these filters' : 'No orders are ready for dispatch'} description={ready.length ? undefined : 'Customer Service releases consolidated orders to this queue.'} action={ready.length ? <Button variant="secondary" onClick={t.reset}>Clear filters</Button> : null} />} />
      </Card>
    </>
  )
}
