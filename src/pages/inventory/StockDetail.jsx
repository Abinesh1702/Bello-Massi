import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Boxes, PackagePlus, ArrowRightLeft, SlidersHorizontal, Settings2, History, Warehouse, Package, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import InfoList from '../../components/common/InfoList'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { StockStatusBadge } from '../../components/masterdata/Badges'
import ProductThumb from '../../components/masterdata/ProductThumb'
import MovementTable from '../../components/inventory/MovementTable'
import StockByHubTable from '../../components/inventory/StockByHubTable'
import { useMasterData } from '../../hooks/useMasterData'
import { usePermission } from '../../hooks/usePermission'
import { updateStockLevels } from '../../services/inventoryService'
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/formatters'
import { openReservationLines } from '../../utils/stockReservation'
import { ORDER_STATUS_META } from '../../utils/constants'

function LevelsModal({ line, onClose }) {
  const [v, setV] = useState({ minimumStock: String(line.minimumStock), reorderLevel: String(line.reorderLevel), maximumStock: String(line.maximumStock || '') })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => { setV((x) => ({ ...x, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })) }
  const save = () => {
    const res = updateStockLevels(line.id, v)
    if (!res.ok) return setErrors(res.errors)
    toast.success('Stock levels updated')
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Stock levels for this hub" description={`${line.productName} at ${line.hubName}`} size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save levels</Button></>}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Minimum" type="number" min="0" value={v.minimumStock} onChange={set('minimumStock')} error={errors.minimumStock} data-autofocus />
        <Input label="Reorder level" type="number" min="0" value={v.reorderLevel} onChange={set('reorderLevel')} error={errors.reorderLevel} />
        <Input label="Maximum" type="number" min="0" value={v.maximumStock} onChange={set('maximumStock')} error={errors.maximumStock} />
      </div>
      <p className="mt-3 text-xs text-muted">Low stock is flagged when available quantity is at or below the reorder level; overstock when on-hand exceeds the maximum.</p>
    </Modal>
  )
}

export default function StockDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { stockRows, movements, lookups, orders } = useMasterData()
  const canOperate = usePermission('inventory.receipts.manage')
  const canSeeMoves = usePermission('inventory.movements.view')
  const canSeeProduct = usePermission('products.view')
  const canSeeHub = usePermission('hubs.view')
  const [editing, setEditing] = useState(false)
  const line = stockRows.find((r) => r.id === id)
  const across = useMemo(() => (line ? stockRows.filter((r) => r.productId === line.productId) : []), [stockRows, line])
  const moves = useMemo(() => (line ? movements.filter((m) => m.productId === line.productId && m.hubId === line.hubId) : []), [movements, line])
  // Reserved quantity is traceable to the approved orders holding it (utils/stockReservation)
  const holders = useMemo(() => (line ? orders.filter((o) => o.hubId === line.hubId).flatMap((o) => openReservationLines(o).filter((l) => l.productId === line.productId).map((l) => ({ order: o, quantity: l.quantity }))) : []), [orders, line])

  if (!line) return <NotFoundRecord entity="stock line" backTo="/inventory/stock" backLabel="Back to stock" />
  const qs = `productId=${line.productId}`

  return (
    <>
      <PageHeader
        title={line.productName}
        description={`${line.productCode} at ${line.hubName}`}
        actions={
          <>
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>Back</Button>
            {canOperate && <Button variant="secondary" icon={Settings2} onClick={() => setEditing(true)}>Stock levels</Button>}
          </>
        }
      />
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ProductThumb product={line.product} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2"><StockStatusBadge status={line.status} /><span className="text-sm text-muted">{line.category}</span></div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {canSeeProduct && line.product ? <button type="button" onClick={() => navigate(`/products/${line.productId}`)} className="inline-flex items-center gap-1.5 text-brand hover:underline"><Package size={14} /> Product details</button> : null}
              {canSeeHub && line.hub ? <button type="button" onClick={() => navigate(`/hubs/${line.hubId}`)} className="inline-flex items-center gap-1.5 text-brand hover:underline"><Warehouse size={14} /> {line.hubName}</button> : <span className="text-muted">{line.hubName}</span>}
              <span className="text-muted">Last updated {formatDateTime(line.lastUpdated)}</span>
            </div>
          </div>
          {canOperate && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" icon={PackagePlus} to={`/inventory/stock-receipts/create?${qs}&hubId=${line.hubId}`}>Receive</Button>
              <Button size="sm" variant="secondary" icon={ArrowRightLeft} to={`/inventory/stock-transfers/create?${qs}&sourceHubId=${line.hubId}`}>Transfer</Button>
              <Button size="sm" variant="secondary" icon={SlidersHorizontal} to={`/inventory/stock-adjustments/create?${qs}&hubId=${line.hubId}`}>Adjust</Button>
            </div>
          )}
        </div>
      </Card>

      <StatGrid cols={6}>
        <StatCard label="Total quantity" value={formatNumber(line.totalQuantity)} icon={Boxes} tone="brand" hint={line.unit} />
        <StatCard label="Reserved" value={formatNumber(line.reservedQuantity)} icon={Boxes} tone="info" hint={`${holders.length} approved order${holders.length === 1 ? '' : 's'}`} />
        <StatCard label="Damaged" value={formatNumber(line.damagedQuantity)} icon={Boxes} tone="danger" hint="Not saleable" />
        <StatCard label="Available" value={formatNumber(line.available)} icon={Boxes} tone={line.available <= line.reorderLevel ? 'warning' : 'success'} hint={line.qaHoldQuantity ? `Total − reserved − damaged − ${formatNumber(line.qaHoldQuantity)} on QA hold` : 'Total − reserved − damaged'} />
        <StatCard label="Reorder level" value={formatNumber(line.reorderLevel)} icon={Settings2} tone="neutral" hint={`Min ${line.minimumStock} · Max ${line.maximumStock || '—'}`} />
        <StatCard label="Stock value" value={formatCurrency(line.value)} icon={Boxes} tone="accent" hint="At purchase price" />
      </StatGrid>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="This product across all hubs" icon={Warehouse} />
          <StockByHubTable rows={across} mode="hub" />
        </Card>
        <Card>
          <CardHeader title="Stock line" icon={Settings2} />
          <InfoList columns={1} items={[
            { label: 'Stock ID', value: <code className="text-xs">{line.id}</code> },
            { label: 'Product', value: `${line.productName} (${line.productCode})` },
            { label: 'Hub', value: line.hubName },
            { label: 'Negative stock', value: line.product?.allowNegativeStock ? 'Allowed for this product' : 'Not allowed' },
          ]} />
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Reserved for orders" subtitle="Approved orders holding this stock until their dispatch is confirmed" icon={ClipboardList} />
        {holders.length ? (
          <ul className="divide-y divide-line text-sm">
            {holders.map(({ order: o, quantity }) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link to={`/orders/${o.id}`} className="font-medium text-brand hover:underline">{o.orderNumber}</Link>
                <span className="min-w-0 flex-1 truncate text-muted">{o.customerName} · {ORDER_STATUS_META[o.orderStatus]?.label || o.orderStatus}</span>
                <span className="tabular font-medium text-ink">{formatNumber(quantity)} {line.unit}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No approved order is holding this stock.</p>}
      </Card>

      {canSeeMoves && (
        <Card className="mt-6">
          <CardHeader title="Movement history at this hub" subtitle={`${moves.length} movements`} icon={History} />
          <MovementTable rows={moves} lookups={lookups} showProduct={false} showHub={false} pageSize={10} />
        </Card>
      )}
      {editing && <LevelsModal line={line} onClose={() => setEditing(false)} />}
    </>
  )
}
