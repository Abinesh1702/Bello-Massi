import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, PackageX, PackagePlus, ArrowRightLeft, CheckCircle2, Warehouse } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { StockStatusBadge } from '../../components/masterdata/Badges'
import { useMasterData } from '../../hooks/useMasterData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { filterStockRows, getLowStockProducts } from '../../services/inventoryService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { OPTIONS, STOCK_STATUS } from '../../config/masterData'
import { formatNumber } from '../../utils/formatters'

export default function LowStock() {
  const navigate = useNavigate()
  const { hubs, stockRows } = useMasterData()
  const canOperate = usePermission('inventory.receipts.manage')
  const t = useTableQuery({ filters: ['hubId', 'category', 'status'], sort: 'shortfall', dir: 'desc' })
  const all = useMemo(() => getLowStockProducts(stockRows), [stockRows])
  const filtered = useMemo(() => filterStockRows(all, t.q, t.filters), [all, t.q, t.filters])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, { shortfall: (r) => r.reorderLevel - r.available }), [filtered, t.sort, t.dir])
  const out = all.filter((r) => r.status === STOCK_STATUS.OUT)
  const hubsAffected = new Set(all.map((r) => r.hubId)).size

  const onExport = () => {
    const n = downloadCsv(csvFilename('low-stock'), rows, [
      { header: 'Product Code', value: (r) => r.productCode }, { header: 'Product Name', value: (r) => r.productName }, { header: 'Category', value: (r) => r.category },
      { header: 'Hub', value: (r) => r.hubName }, { header: 'Available', value: (r) => r.available }, { header: 'Unit', value: (r) => r.unit },
      { header: 'Reorder Level', value: (r) => r.reorderLevel }, { header: 'Suggested Reorder Qty', value: (r) => Math.max(0, (r.maximumStock || r.reorderLevel * 2) - r.totalQuantity) },
      { header: 'Status', value: (r) => r.status },
    ])
    toast.success(`Exported ${n} rows`)
  }

  return (
    <>
      <PageHeader title="Low stock alerts" description="Stock lines at or below their reorder level, and lines with nothing available." />
      <StatGrid cols={3}>
        <StatCard label="Low stock lines" value={all.length - out.length} icon={AlertTriangle} tone="warning" to={`/inventory/low-stock?status=${encodeURIComponent(STOCK_STATUS.LOW)}`} hint="Available ≤ reorder level" />
        <StatCard label="Out of stock lines" value={out.length} icon={PackageX} tone="danger" to={`/inventory/low-stock?status=${encodeURIComponent(STOCK_STATUS.OUT)}`} hint="Nothing available" />
        <StatCard label="Hubs affected" value={hubsAffected} icon={Warehouse} tone="brand" hint={`of ${hubs.filter((h) => h.status === 'Active').length} active hubs`} />
      </StatGrid>
      <Card className="mt-6">
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search product, code, hub…" total={all.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Category" allLabel="All categories" value={t.filters.category} onChange={(v) => t.setFilter('category', v)} options={OPTIONS.productCategories} />
          <FilterSelect label="Status" allLabel="Low and out" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={[{ value: STOCK_STATUS.LOW, label: STOCK_STATUS.LOW }, { value: STOCK_STATUS.OUT, label: STOCK_STATUS.OUT }]} />
        </FilterToolbar>
        <DataTable
          caption="Low stock"
          rows={rows}
          pageSize={12}
          page={t.page}
          onPageChange={t.setPage}
          sort={t.sort}
          dir={t.dir}
          onSort={t.setSort}
          onRowClick={(r) => navigate(`/inventory/stock/${r.id}`)}
          columns={[
            { key: 'productName', header: 'Product', sortable: true, render: (r) => (<div className="min-w-0"><p className="font-medium truncate max-w-[220px]">{r.productName}</p><p className="text-xs text-muted tabular">{r.productCode} · {r.category}</p></div>) },
            { key: 'hubName', header: 'Hub', sortable: true },
            { key: 'available', header: 'Available', align: 'right', sortable: true, render: (r) => <span className="font-semibold">{formatNumber(r.available)} <span className="text-xs font-normal text-muted">{r.unit}</span></span> },
            { key: 'reorderLevel', header: 'Reorder at', align: 'right', sortable: true, hideBelow: 'sm', render: (r) => formatNumber(r.reorderLevel) },
            { key: 'shortfall', header: 'Shortfall', align: 'right', sortable: true, hideBelow: 'md', render: (r) => <span className="text-danger tabular">{formatNumber(Math.max(0, r.reorderLevel - r.available))}</span> },
            { key: 'status', header: 'Status', sortable: true, render: (r) => <StockStatusBadge status={r.status} /> },
            ...(canOperate ? [{
              key: 'act', header: <span className="sr-only">Actions</span>, align: 'right',
              render: (r) => (
                <div className="flex justify-end gap-1">
                  <Button size="xs" variant="secondary" icon={PackagePlus} to={`/inventory/stock-receipts/create?productId=${r.productId}&hubId=${r.hubId}`} aria-label={`Receive ${r.productName} at ${r.hubName}`}>Receive</Button>
                  <Button size="xs" variant="ghost" icon={ArrowRightLeft} to={`/inventory/stock-transfers/create?productId=${r.productId}&destinationHubId=${r.hubId}`} aria-label={`Transfer ${r.productName} to ${r.hubName}`} className="hidden sm:inline-flex">Transfer in</Button>
                </div>
              ),
            }] : []),
          ]}
          empty={<EmptyState icon={CheckCircle2} title={all.length ? 'No lines match these filters' : 'No low stock'} description={all.length ? undefined : 'Every stock line is above its reorder level.'} />}
        />
      </Card>
    </>
  )
}
