import { Link } from 'react-router-dom'
import { Truck, FileText } from 'lucide-react'
import Card, { CardHeader } from '../common/Card'
import InfoList from '../common/InfoList'
import Button from '../common/Button'
import { DeliveryStatusBadge, DispatchStatusBadge } from './DispatchBadges'
import { useDispatchData } from '../../hooks/useDispatchData'
import { usePermission } from '../../hooks/usePermission'
import { formatDate, formatDateTime, formatNumber } from '../../utils/formatters'

/** Dispatch & delivery status of one order (order detail page) — includes the delivery note link. */
export default function OrderDeliveryCard({ order }) {
  const { deliveries, dispatches, lk } = useDispatchData()
  const canDispatch = usePermission('dispatch.view')
  const canNotes = usePermission('deliveryNotes.view')
  const attempts = deliveries.filter((d) => d.orderId === order.id && d.status !== 'CANCELLED').sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const delivery = attempts[0]
  const dispatch = delivery ? lk.dispatches[delivery.dispatchId] : dispatches.find((d) => d.id === order.dispatchId && d.status !== 'CANCELLED')
  const dsp = (d) => (canDispatch ? <Link className="text-brand hover:underline tabular" to={`/dispatch/${d.id}`}>{d.dispatchNumber}</Link> : <span className="tabular">{d.dispatchNumber}</span>)
  const delivered = delivery ? delivery.items.reduce((s, it) => s + (it.deliveredQuantity || 0), 0) : 0
  const remaining = delivery ? delivery.items.reduce((s, it) => s + (it.remainingQuantity || 0), 0) : 0
  return (
    <Card>
      <CardHeader title="Dispatch & delivery" icon={Truck} action={delivery ? <DeliveryStatusBadge status={delivery.status} /> : dispatch ? <DispatchStatusBadge status={dispatch.status} /> : null} />
      {!dispatch && !delivery ? (
        <p className="text-sm text-muted">{order.orderStatus === 'READY_FOR_DISPATCH' ? 'Ready — waiting for the Dispatcher to plan it into a dispatch.' : 'Not dispatched yet.'}</p>
      ) : (
        <InfoList columns={1} items={[
          { label: 'Dispatch', value: dispatch ? <span>{dsp(dispatch)} · {formatDate(dispatch.dispatchDate)}</span> : '—' },
          { label: 'Driver', value: dispatch?.driverName ? `${dispatch.driverName}${dispatch.vehicleNumber ? ` · ${dispatch.vehicleNumber}` : ''}` : 'To be assigned' },
          { label: 'Stop', value: delivery ? `${delivery.sequence} of ${dispatch?.totalDeliveries ?? '—'}${delivery.attempt > 1 ? ` · attempt ${delivery.attempt}` : ''}` : '', hidden: !delivery },
          { label: 'Out for delivery', value: formatDateTime(delivery?.startedAt), hidden: !delivery?.startedAt },
          { label: 'Delivered', value: delivery?.completedAt ? `${formatDateTime(delivery.completedAt)} · ${formatNumber(delivered)} units${remaining ? `, ${formatNumber(remaining)} remaining` : ''} · received by ${delivery.receivedBy}` : '', hidden: !delivery?.completedAt },
          { label: 'Failed', value: delivery?.failedAt ? `${formatDateTime(delivery.failedAt)} · ${delivery.failureReason}` : '', hidden: !delivery?.failedAt },
          { label: 'Earlier attempts', value: attempts.slice(1).map((a) => `${a.dispatchNumber} (${a.status.toLowerCase().replace(/_/g, ' ')})`).join(', '), hidden: attempts.length < 2 },
        ]} />
      )}
      {delivery?.deliveryNoteId && canNotes && (
        <Button className="mt-3" variant="secondary" size="sm" icon={FileText} to={`/dispatch/delivery-notes/${delivery.deliveryNoteId}`}>Delivery note {delivery.deliveryNoteNumber}</Button>
      )}
    </Card>
  )
}
