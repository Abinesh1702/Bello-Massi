import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Route, ClipboardList, FileText, ClipboardCheck, MapPin, Phone, UserRound, Package, History, KeyRound, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import InfoList from '../../components/common/InfoList'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { PriorityBadge } from '../../components/orders/OrderBadges'
import { DeliveryStatusBadge, OtpStatusBadge } from '../../components/dispatch/DispatchBadges'
import DispatchTimeline from '../../components/dispatch/DispatchTimeline'
import OtpInspector from '../../components/dispatch/OtpInspector'
import { ReviewDeliveryDialog } from '../../components/dispatch/DispatchDialogs'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { canViewDelivery, getDeliveryById } from '../../services/deliveryService'
import { getTimelineForDelivery } from '../../services/dispatchTimelineService'
import { effectiveOtpStatus, getOtpsForDelivery } from '../../services/otpService'
import { formatDateTime, formatMoney, formatNumber } from '../../utils/formatters'
import { OrderAccessDenied } from '../orders/OrderDetail'

/** Shared item table: ordered / dispatched / delivered / remaining / damaged. */
export function DeliveryItemsTable({ items }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted"><th className="py-2 pr-3">Product</th><th className="py-2 pr-3 text-right">Ordered</th><th className="py-2 pr-3 text-right">Dispatched</th><th className="py-2 pr-3 text-right">Delivered</th><th className="py-2 pr-3 text-right">Remaining</th><th className="py-2 text-right">Damaged</th></tr></thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-line/60">
              <td className="py-2 pr-3"><p className="text-ink">{it.productName}</p><p className="text-xs text-muted tabular">{it.productCode} · {it.unit}</p></td>
              <td className="py-2 pr-3 text-right tabular">{formatNumber(it.orderedQuantity)}</td>
              <td className="py-2 pr-3 text-right tabular">{formatNumber(it.dispatchedQuantity)}</td>
              <td className="py-2 pr-3 text-right tabular font-medium">{formatNumber(it.deliveredQuantity)}</td>
              <td className="py-2 pr-3 text-right tabular">{formatNumber(it.remainingQuantity)}</td>
              <td className="py-2 text-right tabular">{formatNumber(it.damagedQuantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DeliveryDetail() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const { deliveries, orders, drivers, timeline, otps, lk } = useDispatchData()
  const canManage = usePermission('dispatch.manage')
  const canInspect = usePermission('dispatch.otp.inspect')
  const [reviewing, setReviewing] = useState(false)
  const tab = params.get('tab') || 'items'
  const delivery = getDeliveryById(id, deliveries)
  const events = useMemo(() => getTimelineForDelivery(id, timeline), [timeline, id])
  if (!delivery) return <NotFoundRecord entity="delivery" backTo="/dispatch/delivery-tracking" backLabel="Back to tracking" />
  if (!canViewDelivery(user, delivery, { orders, drivers })) return <OrderAccessDenied />
  const dispatch = lk.dispatches[delivery.dispatchId]
  const history = getOtpsForDelivery(id, otps)
  const setTab = (t) => { const p = new URLSearchParams(params); p.set('tab', t); setParams(p, { replace: true }) }

  return (
    <>
      <PageHeader title={`${delivery.orderNumber} · stop ${delivery.sequence}`} description={`${delivery.customerName} · ${delivery.dispatchNumber}`}
        actions={<>
          <Button variant="secondary" icon={ArrowLeft} to="/dispatch/delivery-tracking">Tracking</Button>
          <Button variant="ghost" icon={Route} to={`/dispatch/${delivery.dispatchId}`}>Dispatch</Button>
          <Button variant="ghost" icon={ClipboardList} to={`/orders/${delivery.orderId}`}>Order</Button>
          {delivery.deliveryNoteId && <Button variant="secondary" icon={FileText} to={`/dispatch/delivery-notes/${delivery.deliveryNoteId}`}>Delivery note</Button>}
          {canManage && delivery.reviewStatus === 'PENDING' && <Button variant="accent" icon={ClipboardCheck} onClick={() => setReviewing(true)}>Review exception</Button>}
        </>}>
        <div className="mt-3 flex flex-wrap gap-2"><DeliveryStatusBadge status={delivery.status} /><OtpStatusBadge status={delivery.otpStatus} />{delivery.reviewStatus === 'PENDING' && <span className="text-xs font-medium text-danger">Waiting for Dispatcher review</span>}{delivery.reviewStatus === 'REVIEWED' && <span className="text-xs text-muted">Reviewed {formatDateTime(delivery.reviewedAt)}</span>}</div>
      </PageHeader>
      {delivery.status === 'FAILED' || delivery.status === 'RETURNED' ? (
        <Card className="mb-6 border-danger/30"><p className="flex items-start gap-2 text-sm"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" /><span><span className="font-semibold">{delivery.failureReason}</span> · {formatDateTime(delivery.failedAt)} · attempt {delivery.attempt || 1}{delivery.failureRemarks ? ` — “${delivery.failureRemarks}”` : ''}{delivery.reviewRemarks ? ` · Review: ${delivery.reviewRemarks}` : ''}</span></p></Card>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Customer & address" icon={MapPin} />
            <InfoList columns={1} items={[
              { label: 'Customer', value: delivery.customerName },
              { label: 'Contact', value: <span className="inline-flex items-center gap-1"><Phone size={13} /> {delivery.contactPerson ? `${delivery.contactPerson} · ` : ''}{delivery.customerMobile}</span> },
              { label: 'Address', value: `${delivery.deliveryAddress}, ${delivery.city} ${delivery.pincode}` },
              { label: 'Instructions', value: delivery.instructions },
              { label: 'Priority', value: <PriorityBadge priority={delivery.priority} /> },
              { label: 'Value', value: formatMoney(delivery.totalAmount) },
            ]} />
          </Card>
          <Card>
            <CardHeader title="Driver" icon={UserRound} />
            <InfoList columns={1} items={[
              { label: 'Driver', value: dispatch?.driverName }, { label: 'Vehicle', value: dispatch?.vehicleNumber },
              { label: 'Started', value: formatDateTime(delivery.startedAt) }, { label: 'Completed', value: formatDateTime(delivery.completedAt) },
              { label: 'Received by', value: delivery.receivedBy }, { label: 'Remarks', value: delivery.remarks },
            ]} />
          </Card>
          {canInspect && (
            <Card>
              <CardHeader title="Delivery OTP" icon={KeyRound} subtitle="Prototype inspection for testing" />
              <OtpInspector otp={history[0]} />
              {history.length > 1 && <ul className="mt-3 space-y-1 text-xs text-muted">{history.slice(1).map((o) => <li key={o.id}>{formatDateTime(o.generatedAt)} · {effectiveOtpStatus(o).toLowerCase()} · {o.attempts} attempt(s)</li>)}</ul>}
            </Card>
          )}
        </div>
        <Card className="lg:col-span-2">
          <Tabs value={tab} onChange={setTab} className="mb-4" tabs={[{ id: 'items', label: 'Items', icon: Package }, { id: 'timeline', label: `Timeline (${events.length})`, icon: History }]} />
          {tab === 'items' ? <DeliveryItemsTable items={delivery.items} /> : <DispatchTimeline events={events} empty="No events for this delivery yet" />}
        </Card>
      </div>
      {reviewing && <ReviewDeliveryDialog key={delivery.id} delivery={delivery} open onClose={() => setReviewing(false)} />}
    </>
  )
}
