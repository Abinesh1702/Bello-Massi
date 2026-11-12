import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackagePlus, Boxes, ClipboardList, AlertTriangle, ArrowRightLeft, CalendarClock, Truck, PackageX, ShoppingCart, Sliders } from 'lucide-react'
import StatCard, { StatGrid } from '../StatCard'
import { QuickActions } from '../QuickAction'
import Card, { CardHeader } from '../../common/Card'
import Badge from '../../common/Badge'
import DataTable from '../../common/DataTable'
import EmptyState from '../../common/EmptyState'
import { FilterSelect } from '../../common/FilterToolbar'
import { useOpsSnapshot } from '../../../hooks/useOpsSnapshot'
import { usePermission } from '../../../hooks/usePermission'
import { warehouseOps } from '../../../services/roleDashboardService'
import { getInventoryConfig } from '../../../config/runtimeConfig'
import { EXPIRY_META } from '../../../config/vmsConfig'
import { formatCompactCurrency, formatDate, formatNumber } from '../../../utils/formatters'
import { ORDER_STATUS_META } from '../../../utils/constants'
import { STOCK_STATUS } from '../../../config/masterData'

/**
 * Warehouse Manager (variant "warehouse") and Inventory Executive (variant "inventory"):
 * receiving, stock, picking, expiry and inventory alerts for one hub or all hubs.
 */
export default function WarehouseDashboard({ user, variant = 'warehouse' }) {
  const snap = useOpsSnapshot()
  const [hubId, setHubId] = useState(user?.hubId || '')
  const m = useMemo(() => warehouseOps(snap, { hubId }), [snap, hubId])
  // With a bounded period, receipts are those dated in the period (instead of the rolling 7 days).
  const bounded = Boolean(snap.range?.start)
  const periodReceipts = useMemo(() => {
    if (!bounded) return null
    const list = snap.receipts.filter((r) => !hubId || r.hubId === hubId)
    return { count: list.length, quantity: list.reduce((a, r) => a + (Number(r.quantity) || 0), 0), list: [...list].sort((a, b) => ((b.receiptDate || b.createdAt) > (a.receiptDate || a.createdAt) ? 1 : -1)) }
  }, [bounded, snap, hubId])
  const rec = periodReceipts || m.receipts7
  const prevReceipts = snap.previous ? snap.previous.receipts.filter((r) => !hubId || r.hubId === hubId).length : null
  const canReceive = usePermission('inventory.receipts.manage')
  const canTransfer = usePermission('inventory.transfers.manage')
  const canAdjust = usePermission('inventory.adjustments.manage')
  const canDraft = usePermission('inventory.replenishment.create')
  const hubs = snap.hubs.filter((h) => h.status === 'Active')
  const expiryDays = getInventoryConfig().expiryWarningDays

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted max-w-2xl">
          {variant === 'inventory' ? 'Receipts, transfers and stock accuracy' : 'Receiving, stock, picking readiness, expiry and inventory alerts'} for {hubId ? hubs.find((h) => h.id === hubId)?.name || 'the selected hub' : 'all hubs'}.
        </p>
        <FilterSelect label="Hub" allLabel="All hubs" value={hubId} onChange={setHubId} options={hubs.map((h) => ({ value: h.id, label: h.name }))} className="w-56" />
      </div>

      <StatGrid cols={5}>
        <StatCard label={bounded ? 'Receipts' : 'Receipts (7 days)'} value={rec.count} compare={prevReceipts !== null && bounded ? { previous: prevReceipts } : undefined} icon={PackagePlus} tone="success" hint={`${formatNumber(rec.quantity)} units received`} to="/inventory/stock-receipts" />
        <StatCard label="Stock value" live value={formatCompactCurrency(m.stockValue)} icon={Boxes} tone="brand" hint={`${m.stockLines} stock lines`} to="/inventory/stock" />
        <StatCard label={variant === 'inventory' ? 'Open transfers' : 'Picking queue'} value={variant === 'inventory' ? m.transfersOpen.length : m.picking.length} icon={variant === 'inventory' ? ArrowRightLeft : ClipboardList} tone="accent" hint={variant === 'inventory' ? 'Draft transfers to complete' : `${m.loading.length} dispatches being loaded`} to={variant === 'inventory' ? '/inventory/stock-transfers' : '/dispatch/ready-orders'} />
        <StatCard label="Low / out of stock" live value={m.low.length} icon={AlertTriangle} tone={m.low.length ? 'warning' : 'success'} hint="At or below reorder level" to="/inventory/low-stock" />
        <StatCard label="Damaged / held" live value={formatNumber(m.damagedQty)} icon={PackageX} tone={m.damagedQty ? 'danger' : 'neutral'} hint={`${m.damaged.length} lines with damaged stock`} to="/inventory/stock-adjustments" />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Inventory alerts" subtitle="Current stock · lowest available first" icon={AlertTriangle} action={<Link to="/inventory/low-stock" className="text-xs font-medium text-brand hover:underline">All low stock</Link>} />
          <DataTable
            dense
            rows={m.low.slice(0, 8)}
            empty={<EmptyState compact icon={Boxes} title="No stock alerts" description="Every line is above its reorder level." />}
            columns={[
              { key: 'p', header: 'Product', render: (r) => <Link to={`/inventory/stock/${r.id}`} className="font-medium text-ink hover:underline">{r.productName}</Link> },
              { key: 'h', header: 'Hub', render: (r) => r.hubName, hideBelow: 'md' },
              { key: 'a', header: 'Available', align: 'right', render: (r) => `${formatNumber(r.available)} ${r.unit}` },
              { key: 'r', header: 'Reorder at', align: 'right', render: (r) => formatNumber(r.reorderLevel ?? r.product?.reorderLevel ?? 0), hideBelow: 'sm' },
              { key: 's', header: 'Status', render: (r) => <Badge tone={r.status === STOCK_STATUS.OUT ? 'danger' : 'warning'}>{r.status}</Badge> },
            ]}
          />
        </Card>
        <QuickActions
          actions={[
            canReceive && { icon: PackagePlus, label: 'Receive stock', description: 'Record a goods receipt (GRN)', to: '/inventory/stock-receipts/create', accent: true },
            canTransfer && { icon: ArrowRightLeft, label: 'Transfer stock', description: 'Move stock between hubs', to: '/inventory/stock-transfers/create' },
            canAdjust && { icon: Sliders, label: 'Adjust stock', description: 'Damaged, lost or corrections', to: '/inventory/stock-adjustments/create' },
            canDraft && { icon: ShoppingCart, label: 'Replenishment draft', description: 'Raise a purchase request', to: '/ai/replenishment/create' },
          ].filter(Boolean)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={variant === 'inventory' ? 'Recent receipts' : 'Receiving'} subtitle={bounded ? 'Goods received in the selected period' : 'Goods received in the last 7 days'} icon={PackagePlus} />
          <DataTable
            dense
            rows={rec.list.slice(0, 6)}
            empty={<EmptyState compact icon={PackagePlus} title={bounded ? 'No receipts in this period' : 'No receipts this week'} description="Receipts recorded at this hub appear here." />}
            columns={[
              { key: 'n', header: 'Receipt', render: (r) => <span className="font-medium text-ink">{r.receiptNumber}</span> },
              { key: 'p', header: 'Product', render: (r) => snap.products.find((p) => p.id === r.productId)?.name || '—' },
              { key: 'q', header: 'Qty', align: 'right', render: (r) => formatNumber(r.quantity) },
              { key: 'd', header: 'Date', render: (r) => formatDate(r.receiptDate || r.createdAt), hideBelow: 'sm' },
            ]}
          />
          {m.incoming.length > 0 && (
            <p className="mt-3 text-xs text-muted">{m.incoming.length} approved replenishment draft{m.incoming.length === 1 ? '' : 's'} sent to procurement and awaiting goods receipt — <Link to="/warehouse/receiving" className="text-brand hover:underline">open receiving</Link>.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Picking & loading" subtitle="Consolidated and ready orders at the hub" icon={Truck} action={<Link to="/dispatch/ready-orders" className="text-xs font-medium text-brand hover:underline">Ready queue</Link>} />
          <DataTable
            dense
            rows={m.picking.slice(0, 6)}
            empty={<EmptyState compact icon={ClipboardList} title="Nothing to pick" description="Orders appear here once Customer Service consolidates them." />}
            columns={[
              { key: 'n', header: 'Order', render: (o) => <Link to={`/orders/${o.id}`} className="font-medium text-ink hover:underline">{o.orderNumber}</Link> },
              { key: 'c', header: 'Customer', render: (o) => o.customerName, hideBelow: 'sm' },
              { key: 'q', header: 'Units', align: 'right', render: (o) => formatNumber(o.totalQuantity) },
              { key: 's', header: 'Status', render: (o) => <Badge tone={ORDER_STATUS_META[o.orderStatus]?.tone}>{o.dispatchId ? 'In a dispatch plan' : ORDER_STATUS_META[o.orderStatus]?.label}</Badge> },
            ]}
          />
        </Card>
      </div>

      <Card>
        <CardHeader title="Expiry" subtitle={`Vehicle & driver documents expired or due within the VMS warning windows · product warning window ${expiryDays} days`} icon={CalendarClock} action={<Link to="/vms/document-expiry" className="text-xs font-medium text-brand hover:underline">Document expiry</Link>} />
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <DataTable
            dense
            rows={m.docs.slice(0, 6).map((r, i) => ({ ...r, id: `${r.ownerId || r.owner}-${r.label}-${i}` }))}
            empty={<EmptyState compact icon={CalendarClock} title="No documents due" description="All vehicle and driver documents are valid." />}
            columns={[
              { key: 'o', header: 'Owner', render: (r) => r.ownerName || r.owner },
              { key: 'l', header: 'Document', render: (r) => r.label },
              { key: 'd', header: 'Expiry', render: (r) => formatDate(r.date), hideBelow: 'sm' },
              { key: 's', header: 'State', render: (r) => <Badge tone={EXPIRY_META[r.state]?.tone}>{EXPIRY_META[r.state]?.label || r.state}</Badge> },
            ]}
          />
          <div className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
            <p className="font-medium text-ink">Product batch expiry</p>
            <p className="mt-1">Stock is tracked by product and hub, without batch or lot expiry dates yet, so no product expiry count is shown. Once batch tracking is added, lines within {expiryDays} days of expiry will appear here (FEFO picking).</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
