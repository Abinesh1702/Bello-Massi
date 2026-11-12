import { useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  Truck, MapPinned, Warehouse, CalendarDays, Play, KeyRound, FileText, History, PackageCheck, ListChecks, Clock, Navigation, CalendarClock, Bell, Crown, Map as MapIcon, MapPin, Lock,
} from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import { DispatchStatusBadge } from '../../components/dispatch/DispatchBadges'
import { NoDriverRecord, ProgressBar, StopCard, ContactActions } from '../../components/driver/DriverUi'
import { DemoGpsBadge, EtaLine, VipBadge, useNow } from '../../components/driver/DriverExtras'
import { useDriverWorkspace } from '../../hooks/useDriverWorkspace'
import { useAuth } from '../../hooks/useAuth'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../utils/constants'
import { livePosition, getSessionForDelivery } from '../../services/trackingService'
import { isForUser } from '../../services/notificationService'
import { DashboardPeriodProvider } from '../../context/DashboardPeriodContext'
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar'
import DriverPerformance from '../../components/driver/DriverPerformance'
import { formatDate, formatNumber, formatRelative, formatTime } from '../../utils/formatters'

const EMPTY = []
const Kpi = ({ label, value, icon: Icon, tone, to }) => {
  const body = (
    <>
      <div className="flex items-center justify-between"><p className="text-xs text-muted">{label}</p><Icon size={16} className={tone} aria-hidden /></div>
      <p className="mt-1 text-2xl font-semibold text-ink tabular">{value}</p>
    </>
  )
  return to ? <Link to={to} className="rounded-xl border border-line bg-surface p-3 shadow-sm hover:border-brand/50">{body}</Link> : <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">{body}</div>
}

/** Driver home: KPIs, today's plan, active delivery with DEMO GPS, next stop, VIP alerts, route summary, tomorrow and notifications. */
export default function DriverHome() {
  const { user } = useAuth()
  return (
    <DashboardPeriodProvider id={`driver:${user.id}`} defaultKey="today">
      <DriverHomeInner />
    </DashboardPeriodProvider>
  )
}

function DriverHomeInner() {
  const w = useDriverWorkspace()
  const { user } = useAuth()
  const notifications = useStoredValue(STORAGE_KEYS.NOTIFICATIONS, EMPTY)
  const [today] = useState(() => new Date().toISOString())
  const now = useNow(5000)
  if (!w.driver) return <NoDriverRecord />
  const { driver, current, stops, next, summary, vehicle, zone, hub, plan, tomorrow } = w
  const lastNote = [...w.notes].sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1))[0]
  const active = stops.find((d) => d.status === 'OUT_FOR_DELIVERY')
  const session = active ? getSessionForDelivery(active.id, w.sessions) : null
  const pos = livePosition(session, now)
  const vip = stops.filter((d) => w.lk.customers[d.customerId]?.isVip && ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(d.status))
  const lateVip = vip.filter((d) => plan[d.id]?.late)
  const open = stops.filter((d) => ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(d.status))
  const remainingKm = open.reduce((s, d) => s + (plan[d.id]?.distanceKm || 0), 0)
  const finishEta = open.length ? plan[open[open.length - 1].id]?.eta : null
  const myNotes = notifications.filter((n) => isForUser(n, user)).slice(0, 3)
  const tomorrowOrders = (d) => (d.orderIds || []).map((id) => w.lk.orders[id]).filter(Boolean)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted">{formatDate(today)}</p>
        <h1 className="text-xl font-semibold text-ink">Hello, {driver.name.split(' ')[0]}</h1>
        <p className="text-sm text-muted">{current ? `${summary.pending} stop${summary.pending === 1 ? '' : 's'} to go on ${current.dispatchNumber}.` : 'No route for today yet.'}</p>
      </div>

      <p className="-mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Today · live</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Kpi label="Today's deliveries" value={summary.total} icon={ListChecks} tone="text-brand" to="/driver/deliveries" />
        <Kpi label="Pending" value={summary.pending} icon={Clock} tone="text-warning" to="/driver/deliveries" />
        <Kpi label="Completed" value={summary.completed} icon={PackageCheck} tone="text-success" to="/driver/completed" />
        <Kpi label="Active" value={summary.active} icon={Navigation} tone="text-info" to={active ? `/driver/deliveries/${active.id}` : undefined} />
        <Kpi label="Tomorrow" value={summary.tomorrow} icon={CalendarClock} tone="text-muted" />
      </div>

      <DashboardFilterBar kinds={['deliveries']} />
      <DriverPerformance deliveries={w.deliveries} pods={w.pods} />

      {lateVip.length > 0 && (
        <div className="flex gap-2 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-ink" role="alert">
          <Crown size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden />
          <span><strong>VIP timing:</strong> {lateVip.map((d) => d.customerName).join(', ')} — estimated arrival is after the requested time. Keep the Dispatcher’s sequence; the Dispatcher has been shown the same warning.</span>
        </div>
      )}

      {!current ? (
        <Card><EmptyState icon={Truck} title="No dispatch for today" description={tomorrow.length ? 'Your next route is planned — see Tomorrow’s plan below.' : 'The Dispatcher has not assigned you a route yet. New assignments appear here and in your notifications.'} action={<Button variant="secondary" icon={History} to="/driver/deliveries?tab=history">Delivery history</Button>} /></Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted">Today’s plan</p>
                <p className="text-lg font-semibold text-ink tabular">{current.dispatchNumber}</p>
              </div>
              <DispatchStatusBadge status={current.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex gap-2"><CalendarDays size={15} className="mt-0.5 text-muted" aria-hidden /><div><dt className="text-xs text-muted">Dispatch date</dt><dd className="text-ink">{formatDate(current.dispatchDate)}</dd></div></div>
              <div className="flex gap-2"><Truck size={15} className="mt-0.5 text-muted" aria-hidden /><div><dt className="text-xs text-muted">Vehicle</dt><dd className="text-ink tabular">{vehicle ? `${vehicle.vehicleNumber} · ${vehicle.type}` : '—'}</dd></div></div>
              <div className="flex gap-2"><Warehouse size={15} className="mt-0.5 text-muted" aria-hidden /><div><dt className="text-xs text-muted">Hub</dt><dd className="text-ink">{hub?.name || '—'}</dd></div></div>
              <div className="flex gap-2"><MapPinned size={15} className="mt-0.5 text-muted" aria-hidden /><div><dt className="text-xs text-muted">Delivery zone</dt><dd className="text-ink">{zone?.name || 'Mixed'}</dd></div></div>
            </dl>
            <ProgressBar className="mt-4" value={summary.progress} label={`${summary.completed + summary.failed} of ${summary.total} stops closed`} />
            {current.status === 'ASSIGNED' && <p className="mt-3 rounded-lg bg-info/10 px-3 py-2 text-xs text-info">Waiting for the Dispatcher to confirm loading. You can start once the dispatch is confirmed.</p>}
          </Card>

          {active && (
            <Card className="border-accent/60">
              <CardHeader title="Active delivery" subtitle={`Stop ${active.sequence} · ${active.orderNumber}`} icon={Navigation} action={<DemoGpsBadge />} />
              <p className="font-semibold text-ink">{active.customerName}</p>
              <p className="text-sm text-muted">{active.deliveryAddress}</p>
              {pos && <p className="mt-2 text-sm text-ink tabular">{active.arrivedAt ? `Arrived ${formatTime(active.arrivedAt)} — collect the customer OTP.` : `${pos.remainingKm} km to go · about ${pos.etaMinutes} min (simulated)`}</p>}
              {pos && !active.arrivedAt && <ProgressBar className="mt-2" value={Math.round(pos.progress * 100)} label="Simulated route progress" />}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button icon={active.arrivedAt ? KeyRound : MapPin} to={active.arrivedAt ? `/driver/deliveries/${active.id}/confirm` : `/driver/deliveries/${active.id}`}>{active.arrivedAt ? 'Enter OTP' : 'Open stop'}</Button>
                <Button variant="secondary" icon={MapIcon} to="/driver/route">Route map</Button>
              </div>
            </Card>
          )}

          {next && !active && (
            <Card className="border-brand/40">
              <CardHeader title="Next stop" subtitle={`Stop ${next.sequence} of ${summary.total}`} icon={Play} />
              <div className="flex flex-wrap items-center gap-1.5"><p className="font-semibold text-ink">{next.customerName}</p>{w.lk.customers[next.customerId]?.isVip && <VipBadge />}</div>
              <p className="text-sm text-muted">{next.deliveryAddress}</p>
              <p className="mt-1 text-xs text-muted tabular">{next.orderNumber} · {formatNumber(next.totalQuantity)} units{next.contactPerson ? ` · ${next.contactPerson}` : ''}</p>
              <EtaLine plan={plan[next.id]} className="mt-1" />
              <div className="mt-3 space-y-2">
                <ContactActions d={next} />
                <Button icon={Play} to={`/driver/deliveries/${next.id}`} fullWidth size="lg" disabled={!['CONFIRMED', 'IN_TRANSIT'].includes(current.status)}>Start delivery</Button>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Route summary" icon={MapIcon} action={<DemoGpsBadge />} />
            <dl className="grid grid-cols-3 gap-3 text-center">
              <div><dt className="text-xs text-muted">Stops left</dt><dd className="text-lg font-semibold text-ink tabular">{open.length}</dd></div>
              <div><dt className="text-xs text-muted">Distance left</dt><dd className="text-lg font-semibold text-ink tabular">{Math.round(remainingKm * 10) / 10} km</dd></div>
              <div><dt className="text-xs text-muted">Finish (est.)</dt><dd className="text-lg font-semibold text-ink tabular">{finishEta ? formatTime(finishEta) : '—'}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-muted">Estimates use simulated distances in the Dispatcher’s sequence — the sequence is never changed automatically.</p>
            <Button className="mt-3" variant="secondary" icon={MapIcon} to="/driver/route" fullWidth>Open route map</Button>
          </Card>

          <Card padded={false}>
            <div className="px-4 pt-4"><CardHeader title="Delivery sequence" subtitle={`Set by the Dispatcher${vip.length ? ` · ${vip.length} VIP stop${vip.length === 1 ? '' : 's'}` : ''}`} icon={ListChecks} /></div>
            <ul className="space-y-2.5 px-3 pb-3">{stops.map((d) => <StopCard key={d.id} d={d} highlight={(active || next)?.id === d.id} vip={w.lk.customers[d.customerId]?.isVip} plan={plan[d.id]} />)}</ul>
          </Card>
        </>
      )}

      <Card>
        <CardHeader title="Tomorrow’s plan" icon={CalendarClock} subtitle="Planned dispatches cannot be started before their date" />
        {tomorrow.length ? (
          <ul className="space-y-3">
            {tomorrow.map((d) => (
              <li key={d.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink tabular">{d.dispatchNumber} · {formatDate(d.dispatchDate)}</p>
                  <DispatchStatusBadge status={d.status} />
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {tomorrowOrders(d).map((o, i) => (
                    <li key={o.id} className="flex items-center justify-between gap-2"><span className="truncate">{i + 1}. {o.customerName}{w.lk.customers[o.customerId]?.isVip ? ' · VIP' : ''}</span><span className="shrink-0 text-xs text-muted tabular">{formatNumber(o.totalQuantity)} units</span></li>
                  ))}
                </ul>
                <Button className="mt-3" icon={Lock} fullWidth disabled>Start available on {dayjs(d.dispatchDate).format('DD MMM')}</Button>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">Nothing planned for tomorrow yet.</p>}
      </Card>

      <Card>
        <CardHeader title="Notifications" icon={Bell} />
        {myNotes.length ? (
          <ul className="divide-y divide-line">{myNotes.map((n) => (
            <li key={n.id} className="py-2"><p className="text-sm text-ink">{n.title}</p><p className="text-xs text-muted">{n.message}</p><p className="text-[11px] text-muted">{formatRelative(n.createdAt)}</p></li>
          ))}</ul>
        ) : <p className="text-sm text-muted">No notifications.</p>}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={PackageCheck} to="/driver/completed">Completed today</Button>
        <Button variant="secondary" icon={FileText} to={lastNote ? `/driver/delivery-notes/${lastNote.id}` : '/driver/delivery-notes'}>{lastNote ? 'Last delivery note' : 'Delivery notes'}</Button>
      </div>
    </div>
  )
}
