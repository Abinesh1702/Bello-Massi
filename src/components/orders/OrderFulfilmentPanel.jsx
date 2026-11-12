import { Link } from 'react-router-dom'
import { Boxes, Layers, PackageSearch, PackageCheck, Truck, MapPinned, ReceiptText, CheckCircle2, Circle, AlertTriangle } from 'lucide-react'
import Card, { CardHeader } from '../common/Card'
import Badge from '../common/Badge'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { RESERVATION_META, reservedQtyFor } from '../../utils/stockReservation'
import { formatDateTime, formatNumber } from '../../utils/formatters'

const E = []

/**
 * Order → fulfilment chain in one place: stock reservation per line, consolidation, warehouse pick / pack / load
 * tasks, dispatch, delivery and invoice — each linked to its own record. Read-only; every step is done on its page.
 */
export default function OrderFulfilmentPanel({ order, consolidation }) {
  const picks = useStoredValue(K.PICKING_TASKS, E)
  const packs = useStoredValue(K.PACKING_TASKS, E)
  const loads = useStoredValue(K.LOADING_TASKS, E)
  const dispatches = useStoredValue(K.DISPATCHES, E)
  const deliveries = useStoredValue(K.DELIVERIES, E)
  const invoices = useStoredValue(K.INVOICES, E)
  const canWms = usePermission('warehouse.tasks.view')
  const canDispatch = usePermission('dispatch.view')
  const canInvoices = usePermission('invoices.view')

  const res = order.reservation
  const resMeta = res ? RESERVATION_META[res.status] : order.stockReserved ? RESERVATION_META.RESERVED : null
  const pick = picks.find((t) => t.orderId === order.id && t.status !== 'CANCELLED')
  const pack = packs.find((t) => t.orderId === order.id && t.status !== 'CANCELLED')
  const dispatch = dispatches.find((d) => d.id === order.dispatchId) || dispatches.find((d) => (d.orderIds || []).includes(order.id) && d.status !== 'CANCELLED')
  const load = dispatch ? loads.find((t) => t.dispatchId === dispatch.id && t.status !== 'CANCELLED') : null
  const delivery = deliveries.find((d) => d.id === order.deliveryId) || deliveries.filter((d) => d.orderId === order.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0]
  const invoice = invoices.find((i) => i.orderId === order.id && i.status !== 'CANCELLED')

  const steps = [
    { key: 'res', icon: Boxes, label: 'Stock reserved', done: Boolean(resMeta) && ['RESERVED', 'CONSUMED'].includes(res?.status || 'RESERVED'), warn: ['PARTIAL', 'SHORT'].includes(res?.status), detail: resMeta ? `${resMeta.label}${res?.reservedAt ? ` · ${formatDateTime(res.reservedAt)}` : ''}` : 'Reserved when the Sales Manager approves the order' },
    { key: 'con', icon: Layers, label: 'Consolidated', done: Boolean(consolidation), detail: consolidation ? `${consolidation.consolidationNumber} · ${formatDateTime(consolidation.consolidationDate)}` : 'Customer Service verifies and consolidates' },
    { key: 'pick', icon: PackageSearch, label: 'Picked', done: pick?.status === 'PICKED', detail: pick ? `${pick.number} · ${pick.status.toLowerCase()}` : 'Optional warehouse pick list (FEFO)', to: pick && canWms ? `/warehouse/picking/${pick.id}` : null },
    { key: 'pack', icon: PackageCheck, label: 'Packed', done: pack?.status === 'PACKED', detail: pack ? `${pack.number} · ${pack.status.toLowerCase()}` : 'Created when picking is confirmed', to: pack && canWms ? `/warehouse/packing/${pack.id}` : null },
    { key: 'dsp', icon: Truck, label: 'Dispatched', done: Boolean(dispatch?.stockDeducted), detail: dispatch ? `${dispatch.dispatchNumber} · ${dispatch.status.toLowerCase().replace(/_/g, ' ')}${load ? ` · loading ${load.number}` : ''}` : 'Planned by the Dispatcher', to: dispatch && canDispatch ? `/dispatch/${dispatch.id}` : null },
    { key: 'dlv', icon: MapPinned, label: 'Delivered', done: ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(delivery?.status), warn: ['FAILED', 'RETURNED'].includes(delivery?.status), detail: delivery ? `${delivery.status.toLowerCase().replace(/_/g, ' ')}${delivery.completedAt ? ` · ${formatDateTime(delivery.completedAt)}` : ''}` : 'Driver app: OTP and proof of delivery', to: delivery && canDispatch ? `/dispatch/deliveries/${delivery.id}` : null },
    { key: 'inv', icon: ReceiptText, label: 'Invoiced', done: Boolean(invoice), detail: invoice ? `${invoice.invoiceNumber} · ${formatDateTime(invoice.issuedAt || invoice.createdAt)}` : 'Finance invoices the delivered quantity', to: invoice && canInvoices ? `/invoices/${invoice.id}` : null },
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2 min-w-0">
        <CardHeader title="Fulfilment" subtitle="Each step links to the record where it is done" icon={Truck} />
        <ol className="space-y-1">
          {steps.map((s) => {
            const Icon = s.done ? CheckCircle2 : s.warn ? AlertTriangle : Circle
            const body = (
              <div className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
                <Icon size={18} className={`mt-0.5 shrink-0 ${s.done ? 'text-success' : s.warn ? 'text-warning' : 'text-line-strong'}`} aria-hidden />
                <s.icon size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{s.label}</p>
                  <p className="text-xs text-muted">{s.detail}</p>
                </div>
              </div>
            )
            return <li key={s.key}>{s.to ? <Link to={s.to} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg">{body}</Link> : body}</li>
          })}
        </ol>
      </Card>
      <Card className="min-w-0">
        <CardHeader title="Stock reservation" icon={Boxes} action={resMeta && <Badge tone={resMeta.tone}>{resMeta.label}</Badge>} />
        {resMeta ? (
          <ul className="divide-y divide-line text-sm">
            {order.items.map((it) => {
              const reserved = res?.status === 'CONSUMED' ? Number(res.lines?.[it.id]) || 0 : reservedQtyFor(order, it)
              const untracked = res?.untracked?.includes(it.id)
              return (
                <li key={it.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-ink">{it.productName}</span>
                  <span className="shrink-0 tabular text-xs text-muted">{untracked ? 'not stock-tracked' : `${formatNumber(reserved)} / ${formatNumber(it.orderedQuantity)} ${it.unit}`}</span>
                </li>
              )
            })}
          </ul>
        ) : <p className="text-sm text-muted">No stock is held for this order yet. Approval reserves available stock at {order.hubName}; consolidation tops up anything that was short.</p>}
        {res?.status === 'RELEASED' && <p className="mt-3 text-xs text-muted">Released {formatDateTime(res.releasedAt)}{res.releaseReason ? ` — ${res.releaseReason}` : ''}.</p>}
      </Card>
    </div>
  )
}
