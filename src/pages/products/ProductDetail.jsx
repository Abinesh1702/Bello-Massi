import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Boxes, IndianRupee, Settings2, History, PackagePlus, ArrowRightLeft, SlidersHorizontal, Warehouse } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import InfoList from '../../components/common/InfoList'
import Timeline from '../../components/common/Timeline'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import ProductThumb from '../../components/masterdata/ProductThumb'
import { ProductStatusBadge, StorageTag } from '../../components/masterdata/Badges'
import MovementTable from '../../components/inventory/MovementTable'
import StockByHubTable from '../../components/inventory/StockByHubTable'
import { useMasterData } from '../../hooks/useMasterData'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { useDeleteFlow } from '../../hooks/useDeleteFlow'
import { deleteProduct, getProductById, getProductDeleteBlockers, updateProduct } from '../../services/productService'
import { STORAGE_KEYS } from '../../utils/constants'
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from '../../utils/formatters'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, stockRows, movements, lookups } = useMasterData()
  const activities = useStoredValue(STORAGE_KEYS.ACTIVITIES, [])
  const canManage = usePermission('products.manage')
  const canSeeStock = usePermission('inventory.stock.view')
  const canSeeMoves = usePermission('inventory.movements.view')
  const canReceive = usePermission('inventory.receipts.manage')
  const product = getProductById(id, products)

  const del = useDeleteFlow({
    entity: 'product',
    getBlockers: getProductDeleteBlockers,
    remove: deleteProduct,
    onDeleted: () => navigate('/products', { replace: true }),
    alternative: canManage && {
      label: 'Mark as Inactive',
      suggestion: 'Inactive products keep their stock history but cannot be received or sold.',
      run: (p) => { const res = updateProduct(p.id, { ...p, status: 'Inactive' }); if (res.ok) toast.success(`${p.name} marked Inactive`) },
    },
  })

  const lines = useMemo(() => stockRows.filter((r) => r.productId === id), [stockRows, id])
  const moves = useMemo(() => movements.filter((m) => m.productId === id), [movements, id])
  const timeline = useMemo(() => activities.filter((a) => a.entityType === 'product' && a.entityId === id)
    .map((a) => ({ id: a.id, title: `${a.actorName} ${a.message}`, at: a.createdAt, icon: Pencil }))
    .concat(product ? [{ id: 'created', title: 'Product created', at: product.createdAt, icon: PackagePlus }] : [])
    .sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 12), [activities, id, product])

  if (!product) return <NotFoundRecord entity="product" backTo="/products" backLabel="Back to products" />

  const sum = (k) => lines.reduce((s, r) => s + (r[k] || 0), 0)
  const margin = product.sellingPrice ? ((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100 : 0

  return (
    <>
      <PageHeader
        title={product.name}
        description={`${product.code} · SKU ${product.sku}`}
        actions={
          <>
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>Back</Button>
            {canManage && <Button variant="danger-outline" icon={Trash2} onClick={() => del.request(product)}>Delete</Button>}
            {canManage && <Button icon={Pencil} to={`/products/${id}/edit`}>Edit</Button>}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-col gap-5 sm:flex-row">
              <ProductThumb product={product} size="xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <ProductStatusBadge status={product.status} />
                  <Badge tone="brand">{product.category}</Badge>
                  <Badge tone="neutral">{product.productType}</Badge>
                  {!product.trackInventory && <Badge tone="neutral">Inventory not tracked</Badge>}
                </div>
                <p className="mt-3 text-sm text-muted">{product.description || 'No description.'}</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <span><span className="text-muted">Brand</span> <strong className="text-ink">{product.brand || '—'}</strong></span>
                  <span><span className="text-muted">Pack</span> <strong className="text-ink">{product.packSize || '—'}</strong></span>
                  <span><span className="text-muted">Unit</span> <strong className="text-ink">{product.unit}</strong></span>
                  <StorageTag condition={product.storageCondition} />
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-ink tabular">{formatCurrency(product.sellingPrice)} <span className="text-sm font-normal text-muted">per {product.unit} + {product.taxPercent}% GST</span></p>
              </div>
            </div>
          </Card>

          {product.trackInventory && canSeeStock && (
            <>
              <StatGrid cols={4}>
                <StatCard label="On hand (all hubs)" value={formatNumber(sum('totalQuantity'))} icon={Boxes} tone="brand" hint={product.unit} />
                <StatCard label="Available" value={formatNumber(lines.reduce((s, r) => s + Math.max(0, r.available), 0))} icon={Boxes} tone="success" hint={`${formatNumber(sum('reservedQuantity'))} reserved`} />
                <StatCard label="Damaged" value={formatNumber(sum('damagedQuantity'))} icon={Boxes} tone="danger" hint="Not saleable" />
                <StatCard label="Stock value" value={formatCurrency(sum('value'))} icon={IndianRupee} tone="accent" hint="At purchase price" />
              </StatGrid>
              <Card>
                <CardHeader
                  title="Stock by hub"
                  icon={Warehouse}
                  subtitle={`${lines.length} hub${lines.length === 1 ? '' : 's'} carry this product`}
                  action={canReceive && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" icon={PackagePlus} to={`/inventory/stock-receipts/create?productId=${id}`}>Receive</Button>
                      <Button size="sm" variant="secondary" icon={ArrowRightLeft} to={`/inventory/stock-transfers/create?productId=${id}`}>Transfer</Button>
                      <Button size="sm" variant="secondary" icon={SlidersHorizontal} to={`/inventory/stock-adjustments/create?productId=${id}`}>Adjust</Button>
                    </div>
                  )}
                />
                <StockByHubTable rows={lines} mode="hub" />
              </Card>
            </>
          )}

          {canSeeMoves && product.trackInventory && (
            <Card>
              <CardHeader title="Movement history" subtitle={`${moves.length} movements`} icon={History} />
              <MovementTable rows={moves} lookups={lookups} showProduct={false} pageSize={8} dense />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Pricing" icon={IndianRupee} />
            <InfoList columns={1} items={[
              { label: 'Selling price', value: formatCurrency(product.sellingPrice) },
              { label: 'Purchase price', value: formatCurrency(product.purchasePrice) },
              { label: 'Gross margin', value: `${formatPercent(margin, 1)} (${formatCurrency(product.sellingPrice - product.purchasePrice)})` },
              { label: 'Tax', value: `${product.taxPercent}% GST` },
              { label: 'Discount', value: product.discountAllowed ? `Allowed up to ${product.maxDiscountPercent}%` : 'Not allowed' },
            ]} />
          </Card>
          <Card>
            <CardHeader title="Configuration" icon={Settings2} />
            <InfoList columns={1} items={[
              { label: 'Product ID', value: <code className="text-xs">{product.id}</code> },
              { label: 'Barcode', value: product.barcode && <span className="tabular">{product.barcode}</span> },
              { label: 'Track inventory', value: product.trackInventory ? 'Yes' : 'No' },
              { label: 'Stock levels (default)', value: product.trackInventory ? `Min ${product.minStockLevel} · Reorder ${product.reorderLevel} · Max ${product.maxStockLevel || '—'}` : '—' },
              { label: 'Negative stock', value: product.allowNegativeStock ? 'Allowed' : 'Not allowed' },
              { label: 'Created', value: formatDateTime(product.createdAt) },
              { label: 'Updated', value: formatDateTime(product.updatedAt) },
              { label: 'Notes', value: product.notes },
            ]} />
          </Card>
          <Card>
            <CardHeader title="Activity" icon={History} />
            <Timeline items={timeline} />
          </Card>
        </div>
      </div>
      {del.dialogs}
    </>
  )
}
