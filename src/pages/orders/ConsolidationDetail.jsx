import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Truck, CheckCircle2, User, Warehouse, Package, ClipboardCheck, ExternalLink, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Checkbox from '../../components/common/Checkbox'
import Textarea from '../../components/common/Textarea'
import InfoList from '../../components/common/InfoList'
import DataTable from '../../components/common/DataTable'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import OrderTotals from '../../components/orders/OrderTotals'
import OrderStepper from '../../components/orders/OrderStepper'
import { ConsolidationStatusBadge, OrderStatusBadge, StockWarningBadge } from '../../components/orders/OrderBadges'
import { CustomerStatusBadge } from '../../components/masterdata/Badges'
import { OrderAccessDenied } from './OrderDetail'
import { useMasterData } from '../../hooks/useMasterData'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { canViewOrder, getOrderById } from '../../services/orderService'
import { consolidateOrder, getConsolidationForOrder, getStockReview, isAwaitingConsolidation, markReadyForDispatch, VERIFICATION_STEPS } from '../../services/consolidationService'
import { STORAGE_KEYS, ORDER_STATUS as S } from '../../utils/constants'
import { formatDate, formatDateTime, formatMoney, formatNumber } from '../../utils/formatters'

export default function ConsolidationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { orders, customers, hubs, inventory } = useMasterData()
  const consolidations = useStoredValue(STORAGE_KEYS.CONSOLIDATIONS, [])
  const canAct = usePermission('orders.consolidate')
  const [verified, setVerified] = useState({})
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null) // 'consolidate' | 'ready'
  const [busy, setBusy] = useState(false)
  const order = getOrderById(id, orders)
  const review = useMemo(() => (order ? getStockReview(order, inventory) : []), [order, inventory])
  const record = getConsolidationForOrder(id, consolidations)

  if (!order) return <NotFoundRecord entity="order" backTo="/orders/consolidation" backLabel="Back to consolidation" />
  if (!canViewOrder(user, order)) return <OrderAccessDenied />
  const customer = customers.find((c) => c.id === order.customerId)
  const hub = hubs.find((h) => h.id === order.hubId)
  const awaiting = isAwaitingConsolidation(order)
  const done = VERIFICATION_STEPS.filter((s) => verified[s.key]).length
  const shortLines = review.filter((l) => l.short)

  const run = () => {
    setBusy(true)
    const res = confirm === 'consolidate' ? consolidateOrder(order.id, { notes, verified }) : markReadyForDispatch(order.id)
    setBusy(false)
    const kind = confirm
    setConfirm(null)
    if (!res.ok) {
      setError(res.errors?.verified || '')
      return toast.error(res.error)
    }
    if (kind === 'consolidate') toast.success(`${order.orderNumber} consolidated · ${res.consolidation.consolidationNumber}`, { description: 'The Dispatcher has been notified. Mark it ready for dispatch when the order is prepared.' })
    else { toast.success(`${order.orderNumber} is ready for dispatch`, { description: 'The Dispatcher has been notified.' }); navigate('/orders/consolidation?tab=ready') }
  }

  return (
    <>
      <PageHeader
        title={`Consolidate ${order.orderNumber}`}
        description={`${order.customerName} · ${order.salesmanName} · approved ${formatDateTime(order.approvedAt)}`}
        actions={
          <>
            <Button variant="secondary" icon={ArrowLeft} to="/orders/consolidation">Consolidation queue</Button>
            <Button variant="secondary" icon={ExternalLink} to={`/orders/${id}`}>Full order</Button>
          </>
        }
      />
      <Card className="mb-6">
        <div className="mb-4 flex flex-wrap gap-2"><OrderStatusBadge status={order.orderStatus} /><ConsolidationStatusBadge status={order.consolidationStatus} /></div>
        <OrderStepper order={order} />
      </Card>

      {!awaiting && order.orderStatus !== S.CONSOLIDATED && order.orderStatus !== S.READY_FOR_DISPATCH && (
        <div className="mb-6 rounded-xl border border-line bg-surface-2 p-4 text-sm">Only approved orders can be consolidated. This order is <strong>{order.orderStatus.toLowerCase().replace(/_/g, ' ')}</strong>.</div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2 min-w-0">
          <Card>
            <CardHeader title="Products & stock review" subtitle={`Stock at ${order.hubName} right now — consolidation does not deduct stock`} icon={Package} action={shortLines.length > 0 && <StockWarningBadge label={`${shortLines.length} line${shortLines.length > 1 ? 's' : ''} short`} />} />
            <DataTable rows={review} dense columns={[
              { key: 'p', header: 'Product', render: (l) => (<div className="min-w-0"><p className="font-medium truncate max-w-[240px]">{l.productName}</p><p className="text-xs text-muted tabular">{l.productCode} · {l.sku}</p></div>) },
              { key: 'q', header: 'Ordered', align: 'right', render: (l) => <span className="font-semibold">{formatNumber(l.orderedQuantity)} <span className="text-xs font-normal text-muted">{l.unit}</span></span> },
              { key: 'a', header: 'Available now', align: 'right', render: (l) => (!l.tracked ? <span className="text-xs text-muted">Not stocked</span> : <span className={l.short ? 'text-danger font-medium' : ''}>{formatNumber(l.available)}</span>) },
              { key: 's', header: 'Coverage', render: (l) => (!l.tracked ? <Badge tone="neutral">N/A</Badge> : l.short ? <Badge tone="danger">Short {formatNumber(l.orderedQuantity - l.available)}</Badge> : <Badge tone="success">Covered</Badge>) },
              { key: 't', header: 'Line total', align: 'right', hideBelow: 'sm', render: (l) => formatMoney(l.totalAmount) },
            ]} />
            <div className="mt-4 ml-auto max-w-sm"><OrderTotals totals={order} /></div>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader title="Customer" icon={User} action={customer && <CustomerStatusBadge status={customer.status} />} />
              <InfoList columns={1} items={[
                { label: 'Customer', value: `${order.customerName} (${order.customerCode})` },
                { label: 'Contact', value: customer ? `${customer.contactPerson} · ${customer.mobile}` : '' },
                { label: 'Deliver to', value: `${order.deliveryAddress}, ${order.deliveryCity} ${order.deliveryPincode}` },
                { label: 'Requested delivery', value: formatDate(order.requestedDeliveryDate) },
                { label: 'Instructions', value: order.deliveryInstructions },
              ]} />
            </Card>
            <Card>
              <CardHeader title="Fulfilment hub" icon={Warehouse} action={hub && <Badge tone={hub.status === 'Active' ? 'success' : 'danger'}>{hub.status}</Badge>} />
              <InfoList columns={1} items={[
                { label: 'Hub', value: order.hubName },
                { label: 'Manager', value: hub ? `${hub.managerName} · ${hub.contactNumber}` : '' },
                { label: 'Operating hours', value: hub?.operatingHours },
                { label: 'Approved by', value: order.approvalRemarks ? `${order.approvalRemarks}` : 'No remarks' },
              ]} />
            </Card>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-20 xl:self-start min-w-0">
          {awaiting && canAct && (
            <Card className="border-brand/30">
              <CardHeader title="Verification" subtitle={`${done} of ${VERIFICATION_STEPS.length} checks confirmed`} icon={ClipboardCheck} />
              <div className="space-y-3">
                {VERIFICATION_STEPS.map((s) => (
                  <Checkbox key={s.key} label={s.label} checked={Boolean(verified[s.key])} onChange={(e) => { setVerified((v) => ({ ...v, [s.key]: e.target.checked })); setError('') }}
                    description={s.key === 'stock' && shortLines.length ? `${shortLines.length} line(s) currently short — note it for the Dispatcher.` : undefined} />
                ))}
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-surface-2 overflow-hidden" aria-hidden><div className="h-full rounded-full bg-[var(--chart-3)] transition-all" style={{ width: `${(done / VERIFICATION_STEPS.length) * 100}%` }} /></div>
              {error && <p className="mt-2 text-xs text-danger" role="alert">{error}</p>}
              <Textarea className="mt-4" label="Consolidation notes" rows={3} maxLength={400} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Packing, pallet or stock notes for the Dispatcher" />
              <Button className="mt-4" icon={Layers} fullWidth disabled={done < VERIFICATION_STEPS.length} onClick={() => setConfirm('consolidate')}>Confirm consolidation</Button>
            </Card>
          )}
          {record && (
            <Card>
              <CardHeader title="Consolidation record" icon={CheckCircle2} action={<ConsolidationStatusBadge status={record.status} />} />
              <InfoList columns={1} items={[
                { label: 'Number', value: <span className="tabular">{record.consolidationNumber}</span> },
                { label: 'Consolidated', value: `${formatDateTime(record.consolidationDate)} by ${record.consolidatedByName}` },
                { label: 'Products · quantity', value: `${record.productSummary.length} · ${formatNumber(record.totalQuantity)} units` },
                { label: 'Total', value: formatMoney(record.totalAmount) },
                { label: 'Notes', value: record.notes },
                { label: 'Ready for dispatch', value: record.readyForDispatchAt ? formatDateTime(record.readyForDispatchAt) : 'Not yet released' },
              ]} />
              {canAct && order.orderStatus === S.CONSOLIDATED && <Button className="mt-4" icon={Truck} fullWidth onClick={() => setConfirm('ready')}>Mark ready for dispatch</Button>}
              {order.orderStatus === S.READY_FOR_DISPATCH && <p className="mt-4 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2.5 text-sm text-success"><Truck size={16} /> Released to the Dispatcher.</p>}
            </Card>
          )}
          {awaiting && !canAct && <Card><p className="text-sm text-muted">View only — Customer Service consolidates orders.</p></Card>}
          <Card>
            <CardHeader title="Delivery" icon={MapPin} />
            <p className="text-sm">{order.deliveryAddress}, {order.deliveryCity}, {order.deliveryState} {order.deliveryPincode}</p>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={run}
        loading={busy}
        title={confirm === 'consolidate' ? `Consolidate ${order.orderNumber}?` : `Mark ${order.orderNumber} ready for dispatch?`}
        description={confirm === 'consolidate'
          ? `${order.items.length} products · ${formatNumber(order.totalQuantity)} units · ${formatMoney(order.totalAmount)}. The original order is kept unchanged; no stock is deducted and no delivery or invoice is created.`
          : 'The Dispatcher will see it in the dispatch queue.'}
        confirmLabel={confirm === 'consolidate' ? 'Consolidate order' : 'Mark ready'}
      />
    </>
  )
}
