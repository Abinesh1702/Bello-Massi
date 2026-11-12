import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { ArrowLeft, Truck, Phone, KeyRound, FileText, Navigation, ShieldCheck, Info } from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { DemoGpsBadge, DemoRouteMap, useNow } from '../../components/driver/DriverExtras'
import { ProgressBar } from '../../components/driver/DriverUi'
import { useCustomerWorkspace } from '../../hooks/useCustomerWorkspace'
import { getLatestOtp, effectiveOtpStatus } from '../../services/otpService'
import { getSessionForDelivery, livePosition } from '../../services/trackingService'
import { deliveryLabel, trackStage } from '../../services/customerAppService'
import { formatDateTime, formatTime } from '../../utils/formatters'
import { NoCustomerLink, TrackTimeline } from './CustomerUi'

/**
 * Tracking for the customer's OWN order only: stages, driver and vehicle of this delivery, simulated position
 * (DEMO GPS) and — once the driver has arrived — the delivery OTP to share.
 */
export default function CustomerTracking() {
  const { id } = useParams()
  const w = useCustomerWorkspace()
  const now = useNow(4000)
  if (!w.customer) return <NoCustomerLink />
  const o = w.orders.find((x) => x.id === id)
  if (!o) return <NotFoundRecord entity="order" backTo="/customer/orders" backLabel="My orders" />
  const d = w.deliveryOf(o.id)
  const dispatch = d ? w.lk.dispatches[d.dispatchId] : null
  const driver = d ? w.lk.drivers[d.driverId] : null
  const vehicle = d ? w.lk.vehicles[d.vehicleId] : null
  const session = d ? getSessionForDelivery(d.id, w.sessions) : null
  const pos = d?.status === 'OUT_FOR_DELIVERY' ? livePosition(session, now) : null
  const otp = d ? getLatestOtp(d.id, w.otps) : null
  const otpLive = otp && effectiveOtpStatus(otp, dayjs(now)) === 'ACTIVE'
  const stage = trackStage(o, d, dispatch)
  const times = { 0: o.submittedAt && formatDateTime(o.submittedAt), 2: o.approvedAt && formatDateTime(o.approvedAt), 5: d?.startedAt && formatDateTime(d.startedAt), 6: d?.arrivedAt && formatDateTime(d.arrivedAt), 7: d?.otpVerifiedAt && formatDateTime(d.otpVerifiedAt), 8: d?.completedAt && formatDateTime(d.completedAt) }
  // Only this delivery's own stop is drawn — never other customers' stops on the route.
  const myStop = d ? [{ ...d, sequence: 1 }] : []

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" icon={ArrowLeft} to={`/customer/orders/${o.id}`} className="-ml-2">{o.orderNumber}</Button>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><p className="text-xs text-muted tabular">{o.orderNumber}</p><h1 className="text-xl font-semibold text-ink">Track delivery</h1><p className="text-sm text-muted">{deliveryLabel(o, d)}</p></div>
        {d?.status === 'OUT_FOR_DELIVERY' && <DemoGpsBadge />}
      </div>

      {d?.status === 'OUT_FOR_DELIVERY' && d.arrivedAt && (
        <Card className="border-accent/70 bg-accent/5">
          <CardHeader title="Your driver has arrived" subtitle={`Arrived ${formatTime(d.arrivedAt)} — share this code with the driver to receive your goods`} icon={KeyRound} />
          {otpLive ? (
            <>
              <p className="font-mono text-4xl font-semibold tracking-[0.35em] text-ink text-center" data-testid="customer-otp">{otp.otp}</p>
              <p className="mt-1 text-center text-xs text-muted tabular">Valid until {formatTime(otp.expiresAt)}</p>
            </>
          ) : <p className="text-sm text-muted">The OTP has expired. Ask the driver to issue a new one — it will appear here.</p>}
          <p className="mt-3 flex gap-1.5 text-xs text-muted"><Info size={13} className="mt-0.5 shrink-0" aria-hidden />Demo OTP — shown in the app only. No SMS is sent in this prototype. Never share it before the goods are in front of you.</p>
        </Card>
      )}

      {d?.status === 'OUT_FOR_DELIVERY' && (
        <Card>
          <CardHeader title={d.arrivedAt ? 'At your address' : 'On the way'} icon={Navigation} action={<DemoGpsBadge />} />
          <DemoRouteMap badge={false} hub={w.lk.hubs[d.hubId]} stops={myStop} customers={w.lk.customers} position={pos} highlightId={d.id} height={220} />
          {pos && !d.arrivedAt && <><p className="mt-2 text-sm text-ink tabular">About {pos.etaMinutes} min away · {pos.remainingKm} km (simulated estimate)</p><ProgressBar className="mt-2" value={Math.round(pos.progress * 100)} label="Simulated progress" /></>}
          {!session && <p className="mt-2 text-sm text-muted">Live position is shown once the driver starts your delivery.</p>}
          <p className="mt-2 text-[11px] text-muted">Position is simulated for the demo — not real GPS.</p>
        </Card>
      )}

      {d ? (
        <Card>
          <CardHeader title="Driver & vehicle" icon={Truck} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-medium text-ink">{driver?.name || '—'}</p><p className="text-sm text-muted tabular">{vehicle ? `${vehicle.vehicleNumber} · ${vehicle.type}` : '—'}</p></div>
            {driver?.mobile && d.status === 'OUT_FOR_DELIVERY' && <Button variant="secondary" icon={Phone} href={`tel:${driver.mobile.replace(/\s/g, '')}`}>Call driver</Button>}
          </div>
          {d.status === 'DISPATCHED' && <p className="mt-2 text-sm text-muted">Your order is loaded{dispatch?.status === 'IN_TRANSIT' ? ' and the vehicle is on its route' : ''}. Tracking starts when the driver heads to you.</p>}
          {['DELIVERED', 'PARTIALLY_DELIVERED'].includes(d.status) && <p className="mt-2 flex items-center gap-1.5 text-sm text-success"><ShieldCheck size={15} aria-hidden />Delivered {formatDateTime(d.completedAt)} · received by {d.receivedBy} · OTP verified</p>}
          {['FAILED', 'RETURNED'].includes(d.status) && <p className="mt-2 text-sm text-danger">Not delivered — {d.failureReason}. Our team will contact you.</p>}
        </Card>
      ) : (
        <Card><EmptyState compact icon={Truck} title="Not dispatched yet" description="Driver and vehicle details appear here once your order is loaded for delivery." /></Card>
      )}

      {d?.deliveryNoteId && <Button icon={FileText} fullWidth to={`/customer/delivery-notes/${d.deliveryNoteId}`}>View delivery note {d.deliveryNoteNumber}</Button>}

      <Card>
        <CardHeader title="Status" icon={Navigation} />
        <TrackTimeline stage={stage} failed={['DELIVERY_FAILED', 'RETURNED_TO_HUB'].includes(o.orderStatus)} rejected={o.orderStatus === 'REJECTED'} times={times} />
      </Card>
    </div>
  )
}
