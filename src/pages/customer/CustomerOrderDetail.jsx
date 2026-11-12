import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Navigation, RotateCcw, FileText, Package, MapPin, ShieldCheck, Truck, History, ReceiptText } from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import InfoList from '../../components/common/InfoList'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { useCustomerWorkspace } from '../../hooks/useCustomerWorkspace'
import { usePermission } from '../../hooks/usePermission'
import { approvalLabel, deliveryLabel, reorderToCart, trackStage } from '../../services/customerAppService'
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../../utils/formatters'
import { NoCustomerLink, OrderStatusPill, TrackTimeline } from './CustomerUi'

export default function CustomerOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const w = useCustomerWorkspace()
  const canOrder = usePermission('customer.order')
  if (!w.customer) return <NoCustomerLink />
  const o = w.orders.find((x) => x.id === id)
  if (!o) return <NotFoundRecord entity="order" backTo="/customer/orders" backLabel="My orders" />
  const d = w.deliveryOf(o.id)
  const dispatch = d ? w.lk.dispatches[d.dispatchId] : o.dispatchId ? w.lk.dispatches[o.dispatchId] : null
  const note = d?.deliveryNoteId ? w.lk.notes[d.deliveryNoteId] : null
  const invoice = w.invoices.find((i) => i.orderId === o.id && i.status !== 'CANCELLED')
  const events = w.timeline.filter((t) => t.orderId === o.id).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
  const trackable = Boolean(d) || ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)
  const reorder = () => {
    const res = reorderToCart(o)
    if (!res.ok) { toast.error(res.error); return }
    toast.success(`${res.added} product${res.added === 1 ? '' : 's'} added to your cart${res.skipped ? ` (${res.skipped} no longer available)` : ''}`)
    navigate('/customer/cart')
  }
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" icon={ArrowLeft} to="/customer/orders" className="-ml-2">My orders</Button>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="text-xs text-muted">Placed {formatDate(o.orderDate)}{o.orderSource === 'customer_app' ? ' in the app' : ''}</p><h1 className="text-xl font-semibold text-ink tabular">{o.orderNumber}</h1></div>
        <OrderStatusPill order={o} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {trackable ? <Button icon={Navigation} to={`/customer/tracking/${o.id}`}>Track delivery</Button> : <Button icon={Navigation} disabled>Tracking after dispatch</Button>}
        {canOrder && <Button variant="secondary" icon={RotateCcw} onClick={reorder}>Reorder</Button>}
      </div>

      <Card>
        <CardHeader title="Progress" icon={Truck} />
        <TrackTimeline stage={trackStage(o, d, dispatch)} failed={['DELIVERY_FAILED', 'RETURNED_TO_HUB'].includes(o.orderStatus)} rejected={o.orderStatus === 'REJECTED'} />
      </Card>

      <Card>
        <CardHeader title="Order" icon={ShieldCheck} />
        <InfoList items={[
          { label: 'Approval', value: approvalLabel(o) },
          { label: 'Delivery status', value: deliveryLabel(o, d) },
          { label: 'Payment terms', value: o.paymentTerms === 'Credit' ? `Credit · ${o.creditDays} days` : o.paymentTerms },
          { label: 'Your reference', value: o.customerReference },
          { label: 'Requested delivery', value: `${formatDate(o.requestedDeliveryDate)}${o.requestedDeliveryTime ? ` by ${o.requestedDeliveryTime}` : ''}` },
          { label: 'Credit check', value: o.creditWarning ? <Badge tone="warning">Over credit limit — under review</Badge> : 'Within credit limit' },
          { label: 'Rejection reason', value: o.rejectionReason ? `${o.rejectionReason}${o.rejectionRemarks ? ` — ${o.rejectionRemarks}` : ''}` : '', hidden: o.orderStatus !== 'REJECTED' },
          { label: 'Delivery remarks', value: o.deliveryInstructions, span: 2 },
        ]} />
      </Card>

      <Card>
        <CardHeader title="Items" subtitle={`${(o.items || []).length} product${(o.items || []).length === 1 ? '' : 's'}`} icon={Package} />
        <ul className="divide-y divide-line">
          {(o.items || []).map((it) => {
            const dl = d?.items?.find((x) => x.productId === it.productId)
            return (
              <li key={it.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0"><p className="text-sm text-ink">{it.productName}</p><p className="text-xs text-muted tabular">{formatNumber(it.orderedQuantity)} {it.unit} × {formatCurrency(it.unitPrice)}{it.discountPercentage ? ` · −${it.discountPercentage}%` : ''}{dl && dl.deliveredQuantity !== undefined && d.completedAt ? ` · delivered ${formatNumber(dl.deliveredQuantity)}` : ''}</p></div>
                <p className="text-sm font-semibold text-ink tabular whitespace-nowrap">{formatCurrency(it.lineTotal)}</p>
              </li>
            )
          })}
        </ul>
        <dl className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular">{formatCurrency(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="tabular">− {formatCurrency(o.discountAmount)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="tabular">{formatCurrency(o.taxAmount)}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="tabular">{formatCurrency(o.totalAmount)}</dd></div>
        </dl>
      </Card>

      <Card>
        <CardHeader title="Delivery address" icon={MapPin} />
        <p className="text-sm text-ink">{o.deliveryAddress}</p>
        <p className="text-xs text-muted">{[o.deliveryCity, o.deliveryState, o.deliveryPincode].filter(Boolean).join(', ')}</p>
        {d && <p className="mt-2 text-sm text-muted">Delivery {d.dispatchNumber} · {deliveryLabel(o, d)}{d.completedAt ? ` · ${formatDateTime(d.completedAt)}` : ''}</p>}
      </Card>

      {(note || invoice) && (
        <div className="grid grid-cols-2 gap-2">
          {note && <Button variant="secondary" icon={FileText} to={`/customer/delivery-notes/${note.id}`}>Delivery note</Button>}
          {invoice && <Button variant="secondary" icon={ReceiptText} to={`/customer/invoices/${invoice.id}`}>Invoice</Button>}
        </div>
      )}

      <Card>
        <CardHeader title="History" icon={History} />
        {events.length ? (
          <ul className="space-y-2">{events.map((e) => (
            <li key={e.id} className="text-sm"><p className="text-ink">{e.title || e.description || e.eventType?.replace(/_/g, ' ').toLowerCase()}</p><p className="text-xs text-muted">{formatDateTime(e.timestamp)}</p></li>
          ))}</ul>
        ) : <p className="text-sm text-muted">No history yet.</p>}
      </Card>
    </div>
  )
}
