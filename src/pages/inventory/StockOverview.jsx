import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, LayoutList, Rows3 } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import { StockStatusBadge } from '../../components/masterdata/Badges'
import { useMasterData } from '../../hooks/useMasterData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { filterStockRows } from '../../services/inventoryService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { OPTIONS } from '../../config/masterData'
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

/** Hub-wise stock lines. "By product" view aggregates the same lines across hubs. */
export default function StockOverview() {
  const navigate = useNavigate()
  const { products, hubs, stockRows } = useMasterData()
  const t = useTableQuery({ filters: ['productId', 'hubId', 'category', 'status', 'view'], sort: 'productName' })
  const byProduct = t.filters.view === 'product'

  const filtered = useMemo(() => filterStockRows(stockRows, t.q, t.filters), [stockRows, t.q, t.filters])
  const aggregated = useMemo(() => {
    if (!byProduct) return filtered
    const m = {}
    filtered.forEach((r) => {
      m[r.productId] ||= { id: r.productId, productId: r.productId, productName: r.productName, productCode: r.productCode, category: r.category, unit: r.unit, hubs: 0, totalQuantity: 0, reservedQuantity: 0, damagedQuantity: 0, available: 0, value: 0, low: 0 }
      const a = m[r.productId]
      a.hubs += 1
      a.totalQuantity += r.totalQuantity
      a.reservedQuantity += r.reservedQuantity
      a.damagedQuantity += r.damagedQuantity
      a.available += r.available
      a.value += r.value
      if (r.status === 'Low Stock' || r.status === 'Out of Stock') a.low += 1
    })
    return Object.values(m)
  }, [filtered, byProduct])
  const rows = useMemo(() => sortRows(aggregated, t.sort, t.dir, { lastUpdated: (r) => r.lastUpdated }), [aggregated, t.sort, t.dir])

  const onExport = () => {
    const n = downloadCsv(csvFilename(byProduct ? 'stock-by-product' : 'inventory'), rows, byProduct ? [
      { header: 'Product Code', value: (r) => r.productCode }, { header: 'Product Name', value: (r) => r.productName }, { header: 'Category', value: (r) => r.category },
      { header: 'Hubs', value: (r) => r.hubs }, { header: 'Total Quantity', value: (r) => r.totalQuantity }, { header: 'Reserved', value: (r) => r.reservedQuantity },
      { header: 'Damaged', value: (r) => r.damagedQuantity }, { header: 'Available', value: (r) => r.available }, { header: 'Unit', value: (r) => r.unit },
      { header: 'Value (INR)', value: (r) => Math.round(r.value) }, { header: 'Low/Out Hubs', value: (r) => r.low },
    ] : [
      { header: 'Stock ID', value: (r) => r.id }, { header: 'Product Code', value: (r) => r.productCode }, { header: 'Product Name', value: (r) => r.productName },
      { header: 'Category', value: (r) => r.category }, { header: 'Hub', value: (r) => r.hubName }, { header: 'Total Quantity', value: (r) => r.totalQuantity },
      { header: 'Reserved Quantity', value: (r) => r.reservedQuantity }, { header: 'Damaged Quantity', value: (r) => r.damagedQuantity },
      { header: 'Available Quantity', value: (r) => r.available }, { header: 'Unit', value: (r) => r.unit }, { header: 'Minimum Stock', value: (r) => r.minimumStock },
      { header: 'Reorder Level', value: (r) => r.reorderLevel }, { header: 'Maximum Stock', value: (r) => r.maximumStock }, { header: 'Stock Status', value: (r) => r.status },
      { header: 'Value (INR)', value: (r) => Math.round(r.value) }, { header: 'Last Updated', value: (r) => r.lastUpdated },
    ])
    toast.success(`Exported ${n} rows`)
  }

  const lineColumns = [
    { key: 'productCode', header: 'Code', sortable: true, hideBelow: 'lg', render: (r) => <span className="tabular text-muted">{r.productCode}</span> },
    { key: 'productName', header: 'Product', sortable: true, render: (r) => (<div className="min-w-0"><p className="font-medium truncate max-w-[220px]">{r.productName}</p><p className="text-xs text-muted">{r.category}</p></div>) },
    { key: 'hubName', header: 'Hub', sortable: true, render: (r) => <span className="whitespace-nowrap">{r.hubName}</span> },
    { key: 'totalQuantity', header: 'Total', align: 'right', sortable: true, hideBelow: 'sm', render: (r) => formatNumber(r.totalQuantity) },
    { key: 'reservedQuantity', header: 'Reserved', align: 'right', sortable: true, hideBelow: 'md' , render: (r) => formatNumber(r.reservedQuantity) },
    { key: 'damagedQuantity', header: 'Damaged', align: 'right', sortable: true, hideBelow: 'md', render: (r) => formatNumber(r.damagedQuantity) },
    { key: 'available', header: 'Available', align: 'right', sortable: true, render: (r) => <span className="font-semibold">{formatNumber(r.available)} <span className="text-xs font-normal text-muted">{r.unit}</span></span> },
    { key: 'reorderLevel', header: 'Reorder', align: 'right', sortable: true, hideBelow: 'lg', render: (r) => formatNumber(r.reorderLevel) },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <StockStatusBadge status={r.status} /> },
    { key: 'lastUpdated', header: 'Updated', sortable: true, hideBelow: 'xl', render: (r) => <span className="text-muted text-xs whitespace-nowrap">{formatDate(r.lastUpdated)}</span> },
  ]
  const productColumns = [
    { key: 'productName', header: 'Product', sortable: true, render: (r) => (<div className="min-w-0"><p className="font-medium truncate max-w-[240px]">{r.productName}</p><p className="text-xs text-muted tabular">{r.productCode} · {r.category}</p></div>) },
    { key: 'hubs', header: 'Hubs', align: 'right', sortable: true, hideBelow: 'sm' },
    { key: 'totalQuantity', header: 'Total', align: 'right', sortable: true, hideBelow: 'sm', render: (r) => formatNumber(r.totalQuantity) },
    { key: 'reservedQuantity', header: 'Reserved', align: 'right', sortable: true, hideBelow: 'md', render: (r) => formatNumber(r.reservedQuantity) },
    { key: 'available', header: 'Available', align: 'right', sortable: true, render: (r) => <span className="font-semibold">{formatNumber(r.available)} <span className="text-xs font-normal text-muted">{r.unit}</span></span> },
    { key: 'value', header: 'Value', align: 'right', sortable: true, hideBelow: 'lg', render: (r) => formatCurrency(r.value) },
    { key: 'low', header: 'Alerts', align: 'right', sortable: true, render: (r) => (r.low ? <span className="text-xs font-medium text-warning">{r.low} hub{r.low > 1 ? 's' : ''} low</span> : <span className="text-xs text-muted">—</span>) },
  ]

  return (
    <>
      <PageHeader
        title="Stock overview"
        description="Available = total − reserved − damaged. Stock is held separately at every hub."
        actions={
          <div className="inline-flex rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="Stock view">
            {[['', 'By hub line', Rows3], ['product', 'By product', LayoutList]].map(([v, label, Icon]) => (
              <button key={label} type="button" aria-pressed={(t.filters.view || '') === v} onClick={() => t.setFilter('view', v)}
                className={cn('inline-flex items-center gap-1.5 rounded-md px-3 h-8 text-sm', (t.filters.view || '') === v ? 'bg-navy text-white dark:bg-accent dark:text-navy' : 'text-muted hover:text-ink')}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        }
      />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search product, code, SKU, hub…" total={byProduct ? new Set(stockRows.map((r) => r.productId)).size : stockRows.length} filteredCount={rows.length} activeCount={t.activeFilterCount - (t.filters.view ? 1 : 0)} onReset={() => { t.reset(); }} onExport={onExport}>
          <FilterSelect label="Product" allLabel="All products" value={t.filters.productId} onChange={(v) => t.setFilter('productId', v)} options={products.filter((p) => p.trackInventory).map((p) => ({ value: p.id, label: p.name }))} />
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Category" allLabel="All categories" value={t.filters.category} onChange={(v) => t.setFilter('category', v)} options={OPTIONS.productCategories} />
          <FilterSelect label="Stock status" allLabel="All stock statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={OPTIONS.stockStatuses} />
        </FilterToolbar>
        <DataTable
          caption="Stock"
          columns={byProduct ? productColumns : lineColumns}
          rows={rows}
          pageSize={12}
          page={t.page}
          onPageChange={t.setPage}
          sort={t.sort}
          dir={t.dir}
          onSort={t.setSort}
          onRowClick={(r) => (byProduct ? navigate(`/inventory/stock?productId=${r.productId}`) : navigate(`/inventory/stock/${r.id}`))}
          empty={<EmptyState icon={Boxes} title="No stock lines match" action={<Button variant="secondary" onClick={t.reset}>Clear filters</Button>} />}
        />
      </Card>
    </>
  )
}
