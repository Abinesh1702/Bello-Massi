import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, CheckCircle2, Boxes, AlertTriangle, Plus, Eye, Pencil, Trash2, PackageSearch } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import RowActions from '../../components/common/RowActions'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import ProductThumb from '../../components/masterdata/ProductThumb'
import { ProductStatusBadge } from '../../components/masterdata/Badges'
import { useMasterData } from '../../hooks/useMasterData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { useDeleteFlow } from '../../hooks/useDeleteFlow'
import { deleteProduct, getProductDeleteBlockers, searchProducts, updateProduct } from '../../services/productService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { OPTIONS, STOCK_STATUS } from '../../config/masterData'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export default function ProductList() {
  const navigate = useNavigate()
  const { products, stockRows } = useMasterData()
  const canManage = usePermission('products.manage')
  const canSeeStock = usePermission('inventory.stock.view')
  const t = useTableQuery({ filters: ['category', 'status', 'tracking'], sort: 'name' })

  const stockByProduct = useMemo(() => {
    const m = {}
    stockRows.forEach((r) => {
      m[r.productId] ||= { available: 0, total: 0, low: 0, out: 0 }
      m[r.productId].available += Math.max(0, r.available)
      m[r.productId].total += r.totalQuantity
      if (r.status === STOCK_STATUS.LOW) m[r.productId].low += 1
      if (r.status === STOCK_STATUS.OUT) m[r.productId].out += 1
    })
    return m
  }, [stockRows])

  const filtered = useMemo(() => searchProducts(t.q, t.filters, products), [products, t.q, t.filters])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, {
    price: (p) => p.sellingPrice,
    stock: (p) => (p.trackInventory ? stockByProduct[p.id]?.available ?? 0 : null),
  }), [filtered, t.sort, t.dir, stockByProduct])

  const del = useDeleteFlow({
    entity: 'product',
    getBlockers: getProductDeleteBlockers,
    remove: deleteProduct,
    alternative: canManage && {
      label: 'Mark as Inactive',
      suggestion: 'Inactive products keep their stock history but cannot be received or sold.',
      run: (p) => {
        const res = updateProduct(p.id, { ...p, status: 'Inactive' })
        if (res.ok) toast.success(`${p.name} marked Inactive`)
        else toast.error(Object.values(res.errors)[0])
      },
    },
  })

  const lowProducts = Object.values(stockByProduct).filter((s) => s.low || s.out).length

  const onExport = () => {
    const n = downloadCsv(csvFilename('products'), rows, [
      { header: 'Product ID', value: (p) => p.id },
      { header: 'Product Code', value: (p) => p.code },
      { header: 'Product Name', value: (p) => p.name },
      { header: 'SKU', value: (p) => p.sku },
      { header: 'Barcode', value: (p) => p.barcode },
      { header: 'Category', value: (p) => p.category },
      { header: 'Brand', value: (p) => p.brand },
      { header: 'Status', value: (p) => p.status },
      { header: 'Product Type', value: (p) => p.productType },
      { header: 'Unit', value: (p) => p.unit },
      { header: 'Pack Size', value: (p) => p.packSize },
      { header: 'Storage', value: (p) => p.storageCondition },
      { header: 'Selling Price (INR)', value: (p) => p.sellingPrice },
      { header: 'Purchase Price (INR)', value: (p) => p.purchasePrice },
      { header: 'Tax %', value: (p) => p.taxPercent },
      { header: 'Discount Allowed', value: (p) => p.discountAllowed },
      { header: 'Max Discount %', value: (p) => p.maxDiscountPercent },
      { header: 'Track Inventory', value: (p) => p.trackInventory },
      { header: 'Minimum Stock', value: (p) => p.minStockLevel },
      { header: 'Reorder Level', value: (p) => p.reorderLevel },
      { header: 'Maximum Stock', value: (p) => p.maxStockLevel },
      { header: 'Allow Negative Stock', value: (p) => p.allowNegativeStock },
      { header: 'Available Stock (all hubs)', value: (p) => (p.trackInventory ? stockByProduct[p.id]?.available ?? 0 : '') },
      { header: 'Created', value: (p) => p.createdAt },
      { header: 'Updated', value: (p) => p.updatedAt },
    ])
    toast.success(`Exported ${n} product${n === 1 ? '' : 's'}`)
  }

  const columns = [
    {
      key: 'name', header: 'Product', sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3 min-w-0">
          <ProductThumb product={p} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-ink truncate max-w-[220px] sm:max-w-none">{p.name}</p>
            <p className="text-xs text-muted tabular">{p.code} · {p.sku}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true, hideBelow: 'md', render: (p) => (<div><p>{p.category}</p><p className="text-xs text-muted">{p.brand}</p></div>) },
    { key: 'unit', header: 'Unit', sortable: true, hideBelow: 'lg', render: (p) => (<div><p>{p.unit}</p><p className="text-xs text-muted">{p.packSize}</p></div>) },
    { key: 'price', header: 'Price', align: 'right', sortable: true, hideBelow: 'sm', render: (p) => (<div><p>{formatCurrency(p.sellingPrice)}</p><p className="text-xs text-muted">+{p.taxPercent}% GST</p></div>) },
    ...(canSeeStock ? [{
      key: 'stock', header: 'Available', align: 'right', sortable: true,
      render: (p) => {
        if (!p.trackInventory) return <Badge tone="neutral">Not tracked</Badge>
        const s = stockByProduct[p.id]
        return (
          <div>
            <p className="tabular">{formatNumber(s?.available || 0)} <span className="text-xs text-muted">{p.unit}</span></p>
            {s?.out ? <p className="text-xs text-danger">{s.out} hub{s.out > 1 ? 's' : ''} out</p> : s?.low ? <p className="text-xs text-warning">{s.low} hub{s.low > 1 ? 's' : ''} low</p> : null}
          </div>
        )
      },
    }] : []),
    { key: 'status', header: 'Status', sortable: true, render: (p) => <ProductStatusBadge status={p.status} /> },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      render: (p) => (
        <RowActions label={`Actions for ${p.name}`} items={[
          { label: 'View', icon: Eye, to: `/products/${p.id}` },
          { label: 'Edit', icon: Pencil, to: `/products/${p.id}/edit`, hidden: !canManage },
          { label: 'Delete', icon: Trash2, danger: true, onClick: () => del.request(p), hidden: !canManage },
        ]} />
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Products" description="Product catalogue, pricing and inventory configuration." actions={canManage && <Button icon={Plus} to="/products/create">Add product</Button>} />
      <StatGrid cols={4}>
        <StatCard label="Total products" value={products.length} icon={Package} tone="brand" hint={`${new Set(products.map((p) => p.category)).size} categories`} />
        <StatCard label="Active products" value={products.filter((p) => p.status === 'Active').length} icon={CheckCircle2} tone="success" to="/products?status=Active" hint="Filter to active" />
        <StatCard label="Inventory tracked" value={products.filter((p) => p.trackInventory).length} icon={Boxes} tone="info" to="/products?tracking=tracked" hint="Stock kept per hub" />
        <StatCard label="Low / out of stock" value={lowProducts} icon={AlertTriangle} tone="warning" to={canSeeStock ? '/inventory/low-stock' : undefined} hint="Products with a low hub" />
      </StatGrid>
      <Card className="mt-6">
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search name, code, SKU, barcode, brand…" total={products.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Category" allLabel="All categories" value={t.filters.category} onChange={(v) => t.setFilter('category', v)} options={OPTIONS.productCategories} />
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={OPTIONS.productStatuses} />
          <FilterSelect label="Inventory tracking" allLabel="Tracking: all" value={t.filters.tracking} onChange={(v) => t.setFilter('tracking', v)} options={[{ value: 'tracked', label: 'Tracked' }, { value: 'untracked', label: 'Not tracked' }]} />
        </FilterToolbar>
        <DataTable caption="Products" columns={columns} rows={rows} pageSize={10} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort}
          onRowClick={(p) => navigate(`/products/${p.id}`)}
          empty={<EmptyState icon={PackageSearch} title={products.length ? 'No products match these filters' : 'No products yet'} action={products.length ? <Button variant="secondary" onClick={t.reset}>Clear filters</Button> : canManage && <Button icon={Plus} to="/products/create">Add product</Button>} />}
        />
      </Card>
      {del.dialogs}
    </>
  )
}
