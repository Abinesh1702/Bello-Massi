import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Boxes, IndianRupee, AlertTriangle, PackageX, Warehouse, PackagePlus, ArrowRightLeft, SlidersHorizontal, History } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import Badge from '../../components/common/Badge'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import SingleBarChart from '../../components/dashboard/charts/SingleBarChart'
import StatusDonutChart from '../../components/dashboard/charts/StatusDonutChart'
import LowStockChart from '../../components/inventory/LowStockChart'
import MovementTable from '../../components/inventory/MovementTable'
import { StockStatusBadge, HubStatusBadge } from '../../components/masterdata/Badges'
import { useMasterData } from '../../hooks/useMasterData'
import { usePermission } from '../../hooks/usePermission'
import { getHubStockSummary, getLowStockProducts, getStockSummary } from '../../services/inventoryService'
import { formatCompactCurrency, formatCurrency, formatNumber } from '../../utils/formatters'

const SLOTS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export default function InventoryDashboard() {
  const navigate = useNavigate()
  const { products, hubs, stockRows, movements, lookups } = useMasterData()
  const canOperate = usePermission('inventory.receipts.manage')
  const canSeeMoves = usePermission('inventory.movements.view')
  const canSeeLow = usePermission('inventory.lowstock.view')
  const canSeeHubs = usePermission('hubs.view')

  const summary = useMemo(() => getStockSummary(stockRows, products, hubs), [stockRows, products, hubs])
  const hubSummary = useMemo(() => getHubStockSummary(stockRows, hubs), [stockRows, hubs])
  const low = useMemo(() => getLowStockProducts(stockRows), [stockRows])

  // Category distribution by value: top 4 categories + "Other" (fixed palette order, never cycled)
  const categories = useMemo(() => {
    const byCat = {}
    stockRows.forEach((r) => { byCat[r.category] = (byCat[r.category] || 0) + r.value })
    const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 4).map(([name, value], i) => ({ key: name, name, value: Math.round(value), color: SLOTS[i] }))
    const rest = sorted.slice(4).reduce((s, [, v]) => s + v, 0)
    return rest ? [...top, { key: 'other', name: 'Other categories', value: Math.round(rest), color: SLOTS[4] }] : top
  }, [stockRows])

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock across every hub — quantities, value, low-stock alerts and recent movements."
        actions={canOperate && (
          <>
            <Button variant="secondary" icon={SlidersHorizontal} to="/inventory/stock-adjustments/create">Adjust</Button>
            <Button variant="secondary" icon={ArrowRightLeft} to="/inventory/stock-transfers/create">Transfer</Button>
            <Button icon={PackagePlus} to="/inventory/stock-receipts/create">Receive stock</Button>
          </>
        )}
      />
      <StatGrid cols={6}>
        <StatCard label="Total products" value={summary.totalProducts} icon={Package} tone="brand" hint={`${summary.trackedProducts} track inventory`} to="/products" />
        <StatCard label="Total stock quantity" value={formatNumber(summary.totalQuantity)} icon={Boxes} tone="info" hint={`${formatNumber(summary.availableQuantity)} available · mixed units`} to="/inventory/stock" />
        <StatCard label="Total stock value" value={formatCompactCurrency(summary.totalValue)} icon={IndianRupee} tone="accent" hint="At purchase price" to="/inventory/stock" />
        <StatCard label="Low stock products" value={summary.lowStockProducts} icon={AlertTriangle} tone="warning" hint={`${summary.lowStockLines} hub lines`} to={canSeeLow ? '/inventory/low-stock' : undefined} />
        <StatCard label="Out of stock products" value={summary.outOfStockProducts} icon={PackageX} tone="danger" hint={`${summary.outOfStockLines} hub lines`} to={canSeeLow ? `/inventory/low-stock?status=${encodeURIComponent('Out of Stock')}` : undefined} />
        <StatCard label="Active hubs" value={summary.activeHubs} icon={Warehouse} tone="success" hint={`${summary.totalHubs} hubs in total`} to={canSeeHubs ? '/hubs' : undefined} />
      </StatGrid>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SingleBarChart
            title="Stock by hub"
            subtitle="Stock value at purchase price"
            data={hubSummary.filter((h) => h.lines).map((h) => ({ name: h.city, value: Math.round(h.value) }))}
            valueFormatter={formatCompactCurrency}
            seriesName="Stock value"
            height={260}
          />
        </div>
        <StatusDonutChart
          title="Inventory by category"
          subtitle="Share of stock value"
          data={categories}
          centerLabel="stock value"
          formatValue={formatCompactCurrency}
          formatTotal={formatCompactCurrency}
          linkTo="/inventory/stock"
          linkLabel="View stock"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2"><LowStockChart data={hubSummary.filter((h) => h.lines).map((h) => ({ name: h.city, low: h.low, out: h.out }))} /></div>
        <Card className="lg:col-span-3">
          <CardHeader title="Low stock products" subtitle="Lowest availability first" action={canSeeLow && <Button size="sm" variant="secondary" to="/inventory/low-stock">View all {low.length}</Button>} />
          <DataTable
            rows={low.slice(0, 6)}
            dense
            onRowClick={(r) => navigate(`/inventory/stock/${r.id}`)}
            columns={[
              { key: 'product', header: 'Product', render: (r) => (<div className="min-w-0"><p className="font-medium truncate max-w-[200px]">{r.productName}</p><p className="text-xs text-muted">{r.hubName}</p></div>) },
              { key: 'available', header: 'Available', align: 'right', render: (r) => <span className="font-semibold">{formatNumber(r.available)} <span className="text-xs font-normal text-muted">{r.unit}</span></span> },
              { key: 'reorder', header: 'Reorder at', align: 'right', hideBelow: 'sm', render: (r) => formatNumber(r.reorderLevel) },
              { key: 'status', header: 'Status', render: (r) => <StockStatusBadge status={r.status} /> },
            ]}
          />
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Hub stock summary" subtitle="Products, quantity, valuation and alerts per hub" icon={Warehouse} />
        <DataTable
          rows={hubSummary}
          onRowClick={canSeeHubs ? (h) => navigate(`/hubs/${h.id}`) : undefined}
          columns={[
            { key: 'name', header: 'Hub', render: (h) => (<div><p className="font-medium">{h.name}</p><p className="text-xs text-muted">{h.city}</p></div>) },
            { key: 'products', header: 'Products', align: 'right', render: (h) => h.products },
            { key: 'quantity', header: 'On hand', align: 'right', hideBelow: 'sm', render: (h) => formatNumber(h.quantity) },
            { key: 'available', header: 'Available', align: 'right', hideBelow: 'md', render: (h) => formatNumber(h.available) },
            { key: 'damaged', header: 'Damaged', align: 'right', hideBelow: 'lg', render: (h) => formatNumber(h.damaged) },
            { key: 'value', header: 'Value', align: 'right', render: (h) => formatCurrency(h.value) },
            { key: 'alerts', header: 'Low / out', align: 'right', hideBelow: 'sm', render: (h) => (h.low + h.out ? <Badge tone={h.out ? 'danger' : 'warning'}>{h.low} / {h.out}</Badge> : <span className="text-muted">—</span>) },
            { key: 'status', header: 'Status', hideBelow: 'md', render: (h) => <HubStatusBadge status={h.status} /> },
          ]}
        />
      </Card>

      {canSeeMoves && (
        <Card className="mt-6">
          <CardHeader title="Recent stock movements" icon={History} action={<Button size="sm" variant="secondary" to="/inventory/movements">All movements</Button>} />
          <MovementTable rows={movements.slice(0, 8)} lookups={lookups} pageSize={null} dense />
        </Card>
      )}
    </>
  )
}
