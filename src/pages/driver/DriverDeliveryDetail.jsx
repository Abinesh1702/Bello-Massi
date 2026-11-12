import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CalendarClock,
  ArrowLeft, Play, KeyRound, AlertTriangle, FileText, MapPin, UserRound, Package, Lock, MessageSquareText, CircleCheck, Map as MapIcon, Flag, Clock,
} from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { PriorityBadge } from '../../components/orders/OrderBadges'
import { DeliveryStatusBadge } from '../../components/dispatch/DispatchBadges'
import { ContactActions, FailDeliveryDialog, NoDriverRecord, ProgressBar } from '../../components/driver/DriverUi'
import { DeliveryFlow, DemoGpsBadge, DemoRouteMap, EtaLine, flowStep, useNow, VipBadge } from '../../components/driver/DriverExtras'
import { OrderAccessDenied } from '../orders/OrderDetail'
import { useDriverWorkspace } from '../../hooks/useDriverWorkspace'
import { getNextStop, isFutureDispatch, markArrived, startDelivery } from '../../services/deliveryService'
import { getSessionForDelivery, livePosition } from '../../services/trackingService'
import { DELIVERY_STATUS as DL, TERMINAL_DELIVERY_STATUSES } from '../../config/dispatchConfig'
import { formatDate, formatDateTime, formatNumber, formatTime } from '../../utils/formatters'

/** A single stop for the driver: details, contact, start, reach location, OTP, complete, report issue, delivery note. */
export default function DriverDeliveryDetail() {
  const { id } = useParams()
  const w = useDriverWorkspace()
  const [starting, setStarting] = useState(false)
  const [arriving, setArriving] = useState(false)
  const [failing, setFailing] = useState(false)
  const now = useNow(4000)
  if (!w.driver) return <NoDriverRecord />
  const any = w.lk.deliveries[id]
  if (!any) return <NotFoundRecord entity="delivery" backTo="/driver/deliveries" backLabel="Back to deliveries" />
  if (any.driverId !== w.driver.id) return <OrderAccessDenied />
  const d = any
  const dispatch = w.lk.dispatches[d.dispatchId]
  const order = w.lk.orders[d.orderId]
  const customer = w.lk.customers[d.customerId]
  const siblings = w.deliveries.filter((x) => x.dispatchId === d.dispatchId)
  const next = getNextStop(siblings)
  const terminal = TERMINAL_DELIVERY_STATUSES.includes(d.status)
  const dispatchReady = dispatch && ['CONFIRMED', 'IN_TRANSIT'].includes(dispatch.status)
  const future = isFutureDispatch(dispatch)
  const blocker = d.status !== DL.DISPATCHED ? null
    : future ? `Planned for ${formatDate(dispatch.dispatchDate)} — Start is available on that day.`
      : !dispatchReady ? 'Waiting for the Dispatcher to confirm the dispatch.'
        : siblings.some((x) => x.status === DL.OUT_FOR_DELIVERY) ? 'Finish your current delivery first.'
          : next && next.id !== d.id ? `Stop ${next.sequence} (${next.customerName}) comes first in the sequence.` : null
  const session = getSessionForDelivery(d.id, w.sessions)
  const pos = d.status === DL.OUT_FOR_DELIVERY ? livePosition(session, now) : null
  const plan = w.plan[d.id]

  const doStart = () => {
    const res = startDelivery(d.id)
    setStarting(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success(`Out for delivery — ${d.customerName}`, { description: 'Tracking started (DEMO GPS). The Dispatcher and customer can follow the simulated route.' })
  }
  const doArrive = () => {
    const res = markArrived(d.id)
    setArriving(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Arrival recorded', { description: res.otp ? 'Customer OTP issued (simulated) — ask the customer for the code.' : 'Ask the customer for the OTP.' })
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" icon={ArrowLeft} to="/driver/dashboard" className="-ml-2">Today</Button>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted tabular">Stop {d.sequence} · {d.orderNumber} · {d.dispatchNumber}</p>
          <h1 className="text-xl font-semibold text-ink">{d.customerName}</h1>
        </div>
        <div className="flex flex-wrap gap-1.5">{customer?.isVip && <VipBadge />}<DeliveryStatusBadge status={d.status} />{d.priority && <PriorityBadge priority={d.priority} />}</div>
      </div>

      <Card><DeliveryFlow step={flowStep(d, dispatch)} failed={['FAILED', 'RETURNED'].includes(d.status)} /></Card>

      {terminal && (
        <div className="flex gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-muted"><Lock size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{d.status === DL.DELIVERED ? `Delivered ${formatDateTime(d.completedAt)} · received by ${d.receivedBy}. This delivery is read-only.`
            : d.status === DL.PARTIALLY_DELIVERED ? `Partially delivered ${formatDateTime(d.completedAt)}. The remaining quantity stays with the Dispatcher for review.`
              : d.status === DL.FAILED || d.status === DL.RETURNED ? `Failed ${formatDateTime(d.failedAt)} — ${d.failureReason}. The Dispatcher reviews it.` : 'This delivery is closed.'}</span>
        </div>
      )}

      {d.status === DL.OUT_FOR_DELIVERY && (
        <Card className="border-accent/60">
          <CardHeader title={d.arrivedAt ? 'At the customer' : 'On the way'} icon={MapIcon} action={<DemoGpsBadge />} />
          <DemoRouteMap badge={false} hub={w.lk.hubs[d.hubId]} stops={siblings.sort((a, b) => a.sequence - b.sequence)} customers={w.lk.customers} position={pos} highlightId={d.id} height={200} />
          {pos && (
            d.arrivedAt
              ? <p className="mt-2 text-sm text-ink">Arrived {formatTime(d.arrivedAt)}. Ask the customer for the delivery OTP.</p>
              : <><p className="mt-2 text-sm text-ink tabular">{pos.remainingKm} km to go · about {pos.etaMinutes} min (simulated)</p><ProgressBar className="mt-2" value={Math.round(pos.progress * 100)} label="Simulated route progress" /></>
          )}
          <p className="mt-2 text-xs text-muted">Started {formatDateTime(d.startedAt)}{session ? ` · route ${session.distanceKm} km (est.)` : ''}</p>
        </Card>
      )}

      <Card>
        <CardHeader title="Deliver to" icon={MapPin} />
        <p className="text-sm text-ink">{d.deliveryAddress}</p>
        <p className="text-xs text-muted">{[d.city, d.pincode].filter(Boolean).join(' · ')}</p>
        {(d.contactPerson || d.customerMobile) && <p className="mt-2 flex items-center gap-1.5 text-sm text-ink"><UserRound size={14} className="text-muted" aria-hidden />{[d.contactPerson, d.customerMobile].filter(Boolean).join(' · ')}</p>}
        {(order?.requestedDeliveryDate || order?.requestedDeliveryTime) && <p className="mt-2 flex items-center gap-1.5 text-sm text-ink"><Clock size={14} className="text-muted" aria-hidden />Requested {formatDate(order.requestedDeliveryDate)}{order.requestedDeliveryTime ? ` by ${order.requestedDeliveryTime}` : ''}</p>}
        {!terminal && <EtaLine plan={plan} className="mt-1" />}
        {d.instructions && <p className="mt-2 flex gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-sm text-ink"><MessageSquareText size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden />{d.instructions}</p>}
        <div className="mt-3 space-y-2">
          <ContactActions d={d} />
          <Button variant="secondary" icon={MapIcon} to={`/driver/route?stop=${d.id}`} fullWidth>Show on route map</Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Items" subtitle={`${formatNumber(d.totalQuantity)} units dispatched · ${d.items.length} line${d.items.length === 1 ? '' : 's'}`} icon={Package} />
        <ul className="divide-y divide-line">
          {d.items.map((it) => (
            <li key={it.id} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0"><p className="text-sm text-ink">{it.productName}</p><p className="text-xs text-muted tabular">{it.productCode} · {it.unit}</p></div>
                <p className="text-sm font-semibold text-ink tabular whitespace-nowrap">{formatNumber(it.dispatchedQuantity)} {it.unit}</p>
              </div>
              {terminal && <p className="mt-1 text-xs text-muted tabular">Delivered {formatNumber(it.deliveredQuantity)} · short {formatNumber(it.remainingQuantity)} · damaged {formatNumber(it.damagedQuantity)}</p>}
            </li>
          ))}
        </ul>
      </Card>

      {!terminal && (
        <div className="sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 -mx-3 sm:-mx-4 border-t border-line bg-surface/95 px-3 sm:px-4 py-3 backdrop-blur shadow-[0_-6px_16px_-10px_rgba(16,24,40,0.25)] space-y-2" data-testid="driver-actions">
          {d.status === DL.DISPATCHED && (
            <>
              <Button icon={future ? Lock : Play} size="lg" fullWidth onClick={() => setStarting(true)} disabled={Boolean(blocker)}>Start delivery</Button>
              {blocker && <p className="text-center text-xs text-muted">{blocker}</p>}
            </>
          )}
          {d.status === DL.OUT_FOR_DELIVERY && !d.arrivedAt && <Button icon={Flag} size="lg" fullWidth onClick={() => setArriving(true)}>Reach location</Button>}
          {d.status === DL.OUT_FOR_DELIVERY && (
            <>
              <Button icon={KeyRound} size="lg" variant={d.arrivedAt ? 'primary' : 'secondary'} fullWidth to={`/driver/deliveries/${d.id}/confirm`}>{d.arrivedAt ? 'Enter OTP & complete' : 'Complete delivery (OTP)'}</Button>
              <Button variant="danger-outline" icon={AlertTriangle} fullWidth onClick={() => setFailing(true)}>Report issue / mark failed</Button>
            </>
          )}
        </div>
      )}
      {d.deliveryNoteId && <Button variant="secondary" icon={FileText} fullWidth to={`/driver/delivery-notes/${d.deliveryNoteId}`}>View delivery note {d.deliveryNoteNumber}</Button>}
      {/* Enterprise: ask dispatch to move this delivery (approval updates the order's delivery date) */}
      {!['DELIVERED', 'CANCELLED'].includes(d.status) && <Button variant="secondary" icon={CalendarClock} fullWidth to={`/logistics/reschedules/new?orderId=${d.orderId}`} data-testid="driver-reschedule">Request reschedule</Button>}
      {[DL.DELIVERED, DL.PARTIALLY_DELIVERED].includes(d.status) && <p className="flex items-center justify-center gap-1.5 text-xs text-success"><CircleCheck size={14} aria-hidden />OTP verified (simulated){w.pods.some((p) => p.deliveryId === d.id) ? ' · proof of delivery captured' : ''}</p>}

      <ConfirmDialog open={starting} onClose={() => setStarting(false)} onConfirm={doStart} title="Start this delivery?" confirmLabel="Start delivery"
        description={`You are heading to ${d.customerName}. The order goes Out for Delivery, a DEMO GPS tracking session starts and the Dispatcher and customer are notified.`} />
      <ConfirmDialog open={arriving} onClose={() => setArriving(false)} onConfirm={doArrive} title="Reached the customer?" confirmLabel="I have arrived"
        description="Your arrival time is recorded and the customer’s delivery OTP is issued (simulated — shown in the customer app, no SMS is sent)." />
      <FailDeliveryDialog delivery={d} open={failing} onClose={() => setFailing(false)} />
    </div>
  )
}
