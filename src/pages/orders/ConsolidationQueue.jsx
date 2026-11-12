import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Layers, PackageCheck, Truck, IndianRupee, Clock, Users, Rows3, Eye, History } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import RowActions from '../../components/common/RowActions'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { ConsolidationStatusBadge, OrderStatusBadge, StockWarningBadge } from '../../components/orders/OrderBadges'
import { useMasterData } from '../../hooks/useMasterData'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { getStockReview, isAwaitingConsolidation, markReadyForDispatch } from '../../services/consolidationService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { STORAGE_KEYS, ORDER_STATUS as S } from '../../utils/constants'
import { formatCompactCurrency, formatDate, formatDateTime, formatMoney, formatNumber, formatRelative } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const TABS = { awaiting: 'Awaiting consolidation', consolidated: 'Consolidated', ready: 'Ready for dispatch', history: 'Consolidation history' }

export default function ConsolidationQueue() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = TABS[params.get('tab')] ? params.get('tab') : 'awaiting'
  const grouped = params.get('group') === 'salesman'
  const { orders, hubs, salesReps, inventory } = useMasterData()
  const consolidations = useStoredValue(STORAGE_KEYS.CONSOLIDATIONS, [])
  const canAct = usePermission('orders.consolidate')
  const t = useTableQuery({ filters: ['salesmanId', 'hubId'], sort: 'approved', dir: 'asc' })
  const [ready, setReady] = useState(null)
  const [busy, setBusy] = useState(false)

  const lists = useMemo(() => ({
    awaiting: orders.filter(isAwaitingConsolidation).map((o) => ({ ...o, stockShort: getStockReview(o, inventory).some((l) => l.short) })),
    consolidated: orders.filter((o) => o.orderStatus === S.CONSOLIDATED),
    ready: orders.filter((o) => o.orderStatus === S.READY_FOR_DISPATCH),
  }), [orders, inventory])
  const today = (iso) => iso && dayjs(iso).isSame(dayjs(), 'day')

  const source = useMemo(() => (tab === 'history' ? [] : lists[tab]), [tab, lists])
  const filtered = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    return source.filter((o) => (!q || [o.orderNumber, o.customerName, o.salesmanName].some((v) => String(v || '').toLowerCase().includes(q)))
      && (!t.filters.salesmanId || o.salesmanId === t.filters.salesmanId) && (!t.filters.hubId || o.hubId === t.filters.hubId))
  }, [source, t.q, t.filters])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, {
    number: (o) => o.orderNumber, customer: (o) => o.customerName, salesman: (o) => o.salesmanName, hub: (o) => o.hubName, lines: (o) => o.items.length,
    qty: (o) => o.totalQuantity, amount: (o) => o.totalAmount, approved: (o) => o.approvedAt, consolidated: (o) => o.consolidatedAt, readyAt: (o) => o.readyForDispatchAt,
  }), [filtered, t.sort, t.dir])
  const historyRows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    return consolidations.filter((c) => !q || [c.consolidationNumber, c.orderNumber, c.consolidatedByName].some((v) => String(v || '').toLowerCase().includes(q)))
      .filter((c) => !t.filters.hubId || c.hubId === t.filters.hubId)
      .sort((a, b) => (a.consolidationDate < b.consolidationDate ? 1 : -1))
  }, [consolidations, t.q, t.filters.hubId])

  const doReady = () => {
    setBusy(true)
    const res = markReadyForDispatch(ready.id)
    setBusy(false)
    setReady(null)
    if (!res.ok) return toast.error(res.error)
    toast.success(`${res.record.orderNumber} is ready for dispatch`, { description: 'The Dispatcher has been notified.' })
  }

  const onExport = () => {
    if (tab === 'history') {
      const n = downloadCsv(csvFilename('consolidations'), historyRows, [
        { header: 'Consolidation Number', value: (c) => c.consolidationNumber }, { header: 'Order Number', value: (c) => c.orderNumber },
        { header: 'Consolidated By', value: (c) => c.consolidatedByName }, { header: 'Consolidation Date', value: (c) => c.consolidationDate },
        { header: 'Hub', value: (c) => hubs.find((h) => h.id === c.hubId)?.name || '' }, { header: 'Products', value: (c) => c.productSummary.length },
        { header: 'Total Quantity', value: (c) => c.totalQuantity }, { header: 'Total (INR)', value: (c) => Number(c.totalAmount).toFixed(2) },
        { header: 'Status', value: (c) => c.status }, { header: 'Ready For Dispatch At', value: (c) => c.readyForDispatchAt || '' }, { header: 'Notes', value: (c) => c.notes },
      ])
      return toast.success(`Exported ${n} consolidations`)
    }
    const n = downloadCsv(csvFilename(`consolidation-${tab}`), rows, [
      { header: 'Order Number', value: (o) => o.orderNumber }, { header: 'Order Date', value: (o) => o.orderDate }, { header: 'Customer', value: (o) => o.customerName },
      { header: 'Salesman', value: (o) => o.salesmanName }, { header: 'Hub', value: (o) => o.hubName }, { header: 'Product Count', value: (o) => o.items.length },
      { header: 'Total Quantity', value: (o) => o.totalQuantity }, { header: 'Total (INR)', value: (o) => o.totalAmount.toFixed(2) },
      { header: 'Approved At', value: (o) => o.approvedAt }, { header: 'Consolidation Status', value: (o) => o.consolidationStatus }, { header: 'Order Status', value: (o) => o.orderStatus },
    ])
    toast.success(`Exported ${n} orders`)
  }

  const actionsFor = (o) => [
    { label: 'Open workspace', icon: Layers, to: `/orders/consolidation/${o.id}`, hidden: !canAct || tab !== 'awaiting' },
    { label: 'Mark ready for dispatch', icon: Truck, onClick: () => setReady(o), hidden: !canAct || o.orderStatus !== S.CONSOLIDATED },
    { label: 'View order', icon: Eye, to: `/orders/${o.id}` },
  ]

  const columns = [
    { key: 'number', header: 'Order', sortable: true, render: (o) => (<div><p className="font-medium tabular whitespace-nowrap">{o.orderNumber}</p><p className="text-xs text-muted">{formatDate(o.orderDate)}</p></div>) },
    { key: 'customer', header: 'Customer', sortable: true, render: (o) => (<div className="min-w-0"><p className="truncate max-w-[200px]">{o.customerName}</p>{o.stockShort && <StockWarningBadge label="Stock short now" />}</div>) },
    { key: 'salesman', header: 'Salesman', sortable: true, hideBelow: 'lg', render: (o) => <span className="text-muted whitespace-nowrap">{o.salesmanName}</span> },
    { key: 'hub', header: 'Hub', sortable: true, hideBelow: 'md', render: (o) => <span className="whitespace-nowrap">{o.hubName}</span> },
    { key: 'lines', header: 'Products', align: 'right', sortable: true, hideBelow: 'xl' , render: (o) => o.items.length },
    { key: 'qty', header: 'Qty', align: 'right', sortable: true, hideBelow: 'sm', render: (o) => formatNumber(o.totalQuantity) },
    { key: 'amount', header: 'Total', align: 'right', sortable: true, render: (o) => <span className="font-medium whitespace-nowrap">{formatMoney(o.totalAmount)}</span> },
    tab === 'awaiting'
      ? { key: 'approved', header: 'Approved', sortable: true, hideBelow: 'md', render: (o) => <span className="text-xs text-muted whitespace-nowrap" title={formatDateTime(o.approvedAt)}>{formatRelative(o.approvedAt)}</span> }
      : tab === 'consolidated'
        ? { key: 'consolidated', header: 'Consolidated', sortable: true, hideBelow: 'md', render: (o) => <span className="text-xs text-muted whitespace-nowrap">{formatRelative(o.consolidatedAt)}</span> }
        : { key: 'readyAt', header: 'Released', sortable: true, hideBelow: 'md', render: (o) => <span className="text-xs text-muted whitespace-nowrap">{formatRelative(o.readyForDispatchAt)}</span> },
    { key: 'status', header: 'Consolidation', hideBelow: 'lg', render: (o) => (tab === 'awaiting' ? <ConsolidationStatusBadge status={o.consolidationStatus} /> : <OrderStatusBadge status={o.orderStatus} />) },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      render: (o) => (
        <div className="flex items-center justify-end gap-1">
          {canAct && tab === 'awaiting' && <Button size="xs" icon={Layers} to={`/orders/consolidation/${o.id}`} className="hidden md:inline-flex">Consolidate</Button>}
          {canAct && tab === 'consolidated' && <Button size="xs" icon={Truck} onClick={() => setReady(o)} className="hidden md:inline-flex">Mark ready</Button>}
          <RowActions label={`Actions for ${o.orderNumber}`} items={actionsFor(o)} />
        </div>
      ),
    },
  ]

  const groups = useMemo(() => {
    const g = {}
    rows.forEach((o) => { (g[o.salesmanName] ||= []).push(o) })
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]))
  }, [rows])

  return (
    <>
      <PageHeader
        title="Order consolidation"
        description={canAct ? 'Verify approved orders per salesman, consolidate them, then release them to dispatch.' : 'View-only: consolidation is done by Customer Service.'}
      />
      <StatGrid cols={6}>
        <StatCard label="Awaiting consolidation" value={lists.awaiting.length} icon={Clock} tone="warning" to="/orders/consolidation" hint="Approved orders" />
        <StatCard label="Pending consolidation value" value={formatCompactCurrency(lists.awaiting.reduce((s, o) => s + o.totalAmount, 0))} icon={IndianRupee} tone="accent" hint="Incl. GST" />
        <StatCard label="Consolidated orders" value={lists.consolidated.length} icon={PackageCheck} tone="info" to="/orders/consolidation?tab=consolidated" hint="To release to dispatch" />
        <StatCard label="Ready for dispatch" value={lists.ready.length} icon={Truck} tone="success" to="/orders/consolidation?tab=ready" hint="Handed to Dispatcher" />
        <StatCard label="Consolidated today" value={consolidations.filter((c) => today(c.consolidationDate)).length} icon={Layers} tone="brand" to="/orders/consolidation?tab=history" />
        <StatCard label="Salesmen in queue" value={new Set(lists.awaiting.map((o) => o.salesmanId)).size} icon={Users} tone="neutral" to="/orders/consolidation?group=salesman" />
      </StatGrid>

      <Card className="mt-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={tab} onChange={(id) => setParams(id === 'awaiting' ? {} : { tab: id }, { replace: true })} className="border-b-0"
            tabs={[
              { id: 'awaiting', label: `Awaiting (${lists.awaiting.length})`, icon: Clock },
              { id: 'consolidated', label: `Consolidated (${lists.consolidated.length})`, icon: PackageCheck },
              { id: 'ready', label: `Ready (${lists.ready.length})`, icon: Truck },
              { id: 'history', label: 'History', icon: History },
            ]} />
          {tab === 'awaiting' && (
            <div className="inline-flex self-start rounded-lg border border-line p-0.5" role="group" aria-label="Queue layout">
              {[[false, 'List', Rows3], [true, 'By salesman', Users]].map(([g, label, Icon]) => (
                <button key={label} type="button" aria-pressed={grouped === g} onClick={() => { const p = new URLSearchParams(params); if (g) p.set('group', 'salesman'); else p.delete('group'); setParams(p, { replace: true }) }}
                  className={cn('inline-flex items-center gap-1.5 rounded-md px-3 h-8 text-sm', grouped === g ? 'bg-navy text-white dark:bg-accent dark:text-navy' : 'text-muted hover:text-ink')}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder={tab === 'history' ? 'Search consolidation or order number…' : 'Search order, customer, salesman…'} total={tab === 'history' ? consolidations.length : source.length} filteredCount={tab === 'history' ? historyRows.length : rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          {tab !== 'history' && <FilterSelect label="Salesman" allLabel="All salesmen" value={t.filters.salesmanId} onChange={(v) => t.setFilter('salesmanId', v)} options={salesReps.map((r) => ({ value: r.id, label: r.name }))} />}
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
        </FilterToolbar>

        {tab === 'history' ? (
          <DataTable caption="Consolidation history" rows={historyRows} pageSize={12} onRowClick={(c) => navigate(`/orders/${c.orderId}`)}
            columns={[
              { key: 'n', header: 'Consolidation', render: (c) => (<div><p className="font-medium tabular">{c.consolidationNumber}</p><p className="text-xs text-muted tabular">{c.orderNumber}</p></div>) },
              { key: 'by', header: 'By', hideBelow: 'md', render: (c) => c.consolidatedByName },
              { key: 'date', header: 'Date', render: (c) => <span className="text-xs whitespace-nowrap">{formatDateTime(c.consolidationDate)}</span> },
              { key: 'hub', header: 'Hub', hideBelow: 'lg', render: (c) => hubs.find((h) => h.id === c.hubId)?.name || '—' },
              { key: 'qty', header: 'Qty', align: 'right', hideBelow: 'sm', render: (c) => formatNumber(c.totalQuantity) },
              { key: 'amount', header: 'Total', align: 'right', render: (c) => formatMoney(c.totalAmount) },
              { key: 'ready', header: 'Released', hideBelow: 'md', render: (c) => (c.readyForDispatchAt ? <span className="text-xs text-success">{formatRelative(c.readyForDispatchAt)}</span> : <span className="text-xs text-muted">Not yet</span>) },
            ]}
            empty={<EmptyState icon={History} title="No consolidations yet" />} />
        ) : grouped && tab === 'awaiting' ? (
          groups.length ? (
            <div className="space-y-5">
              {groups.map(([salesman, list]) => (
                <div key={salesman} className="rounded-xl border border-line">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2/60 px-4 py-2.5">
                    <p className="font-semibold text-ink">{salesman} <span className="text-sm font-normal text-muted">· {list.length} order{list.length > 1 ? 's' : ''}</span></p>
                    <p className="text-sm font-medium tabular">{formatMoney(list.reduce((s, o) => s + o.totalAmount, 0))}</p>
                  </div>
                  <ul className="divide-y divide-line">
                    {list.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{o.customerName} {o.stockShort && <StockWarningBadge label="Stock short now" />}</p>
                          <p className="text-xs text-muted tabular">{o.orderNumber} · {o.hubName} · {o.items.length} products · {formatNumber(o.totalQuantity)} units · approved {formatRelative(o.approvedAt)}</p>
                        </div>
                        <span className="font-medium tabular">{formatMoney(o.totalAmount)}</span>
                        {canAct ? <Button size="sm" icon={Layers} to={`/orders/consolidation/${o.id}`}>Consolidate</Button> : <Button size="sm" variant="secondary" to={`/orders/${o.id}`}>View</Button>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Layers} title="Nothing to consolidate" />
        ) : (
          <DataTable caption={TABS[tab]} columns={columns} rows={rows} pageSize={10} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort}
            onRowClick={(o) => navigate(tab === 'awaiting' && canAct ? `/orders/consolidation/${o.id}` : `/orders/${o.id}`)}
            empty={<EmptyState icon={tab === 'ready' ? Truck : Layers} title={source.length ? 'No orders match these filters' : tab === 'awaiting' ? 'Nothing to consolidate' : tab === 'consolidated' ? 'No consolidated orders waiting for release' : 'No orders ready for dispatch'} />} />
        )}
      </Card>
      <ConfirmDialog open={Boolean(ready)} onClose={() => setReady(null)} onConfirm={doReady} loading={busy}
        title={`Mark ${ready?.orderNumber} ready for dispatch?`} description={ready ? `${ready.customerName} · ${formatMoney(ready.totalAmount)} at ${ready.hubName}. The Dispatcher will be notified. Stock is not deducted at this step.` : ''} confirmLabel="Mark ready" />
    </>
  )
}
