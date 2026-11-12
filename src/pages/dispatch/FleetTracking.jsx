import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Navigation, Crown, MapPinned, Info, Flag } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { DeliveryStatusBadge } from '../../components/dispatch/DispatchBadges'
import { DemoGpsBadge, DemoRouteMap, EtaLine, useNow } from '../../components/driver/DriverExtras'
import { ProgressBar } from '../../components/driver/DriverUi'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../utils/constants'
import { getSessionForDelivery, livePosition } from '../../services/trackingService'
import { etaPlan } from '../../utils/demoGeo'
import { formatTime } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const EMPTY_TRACK = { sessions: [] }

/** Dispatcher view of today's routes with simulated (DEMO GPS) positions, ETAs and VIP late warnings. */
export default function FleetTracking() {
  const data = useDispatchData()
  const tracking = useStoredValue(STORAGE_KEYS.DRIVER_TRACKING, EMPTY_TRACK)
  const now = useNow(5000)
  const [hubId, setHubId] = useState('')
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10))
  const routes = useMemo(() => data.dispatches.filter((d) => d.status === 'IN_TRANSIT' || (d.status === 'CONFIRMED' && d.dispatchDate <= todayIso))
    .filter((d) => !hubId || d.hubId === hubId)
    .map((dsp) => {
      const stops = data.deliveries.filter((x) => x.dispatchId === dsp.id && x.status !== 'CANCELLED').sort((a, b) => a.sequence - b.sequence)
      const withTimes = stops.map((s) => ({ ...s, requestedDeliveryTime: data.lk.orders[s.orderId]?.requestedDeliveryTime, requestedDeliveryDate: data.lk.orders[s.orderId]?.requestedDeliveryDate }))
      const plan = Object.fromEntries(etaPlan(withTimes, { hub: data.lk.hubs[dsp.hubId], customers: data.lk.customers }).map((p) => [p.id, p]))
      const active = stops.find((s) => s.status === 'OUT_FOR_DELIVERY')
      const session = active ? getSessionForDelivery(active.id, tracking.sessions || []) : null
      const done = stops.filter((s) => !['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(s.status)).length
      const vipLate = stops.filter((s) => data.lk.customers[s.customerId]?.isVip && plan[s.id]?.late)
      return { dsp, stops, plan, active, session, done, vipLate }
    }), [data, tracking, hubId, todayIso])
  const [selected, setSelected] = useState(null)
  const sel = routes.find((r) => r.dsp.id === selected) || routes[0]
  const pos = sel?.session ? livePosition(sel.session, now) : null
  const vipAlerts = routes.flatMap((r) => r.vipLate.map((s) => ({ r, s })))

  return (
    <>
      <PageHeader title="Live Tracking" description="Drivers on the road today with simulated positions and ETAs. The delivery sequence stays as you planned it." actions={<DemoGpsBadge />} />
      <p className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted"><Info size={14} className="mt-0.5 shrink-0" aria-hidden /><span><strong className="text-ink">DEMO GPS — SIMULATED.</strong> No vehicle or phone location is read. Positions move along an estimated route between the hub and stops once the driver taps Start delivery; ETAs assume 24 km/h city driving plus 12 minutes per stop.</span></p>
      <StatGrid cols={4}>
        <StatCard label="Routes today" value={routes.length} icon={Truck} tone="brand" />
        <StatCard label="Drivers on a delivery" value={routes.filter((r) => r.active).length} icon={Navigation} tone="info" />
        <StatCard label="Arrived, awaiting OTP" value={routes.filter((r) => r.active?.arrivedAt).length} icon={Flag} tone="warning" />
        <StatCard label="VIP late-arrival warnings" value={vipAlerts.length} icon={Crown} tone={vipAlerts.length ? 'danger' : 'success'} />
      </StatGrid>
      {vipAlerts.length > 0 && (
        <Card className="mt-6 border-danger/30">
          <CardHeader title="VIP timing warnings" subtitle="Estimated arrival is after the customer’s requested time. Re-sequence in the dispatch plan if needed — nothing is changed automatically." icon={Crown} />
          <ul className="divide-y divide-line">{vipAlerts.map(({ r, s }) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0"><Link to={`/dispatch/deliveries/${s.id}`} className="font-medium text-ink hover:text-brand">{s.customerName}</Link> <span className="text-muted">· stop {s.sequence} on {r.dsp.dispatchNumber} · {r.dsp.driverName}</span></span>
              <span className="text-xs text-danger tabular">ETA {formatTime(r.plan[s.id].eta)} · requested {formatTime(r.plan[s.id].requestedAt)}</span>
            </li>
          ))}</ul>
        </Card>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Routes" icon={MapPinned} action={<FilterSelect label="Hub" allLabel="All hubs" value={hubId} onChange={setHubId} options={data.hubs.map((h) => ({ value: h.id, label: h.name }))} className="w-40" />} />
          {routes.length ? (
            <ul className="space-y-2">{routes.map((r) => (
              <li key={r.dsp.id}>
                <button type="button" onClick={() => setSelected(r.dsp.id)} className={cn('w-full rounded-xl border p-3 text-left hover:border-brand/50', sel?.dsp.id === r.dsp.id ? 'border-brand ring-2 ring-[var(--ring)]' : 'border-line')}>
                  <div className="flex items-center justify-between gap-2"><span className="font-medium text-ink tabular">{r.dsp.dispatchNumber}</span>{r.vipLate.length > 0 && <Badge tone="danger">VIP late</Badge>}</div>
                  <p className="text-xs text-muted">{r.dsp.driverName} · {r.dsp.vehicleNumber}</p>
                  <ProgressBar className="mt-2" value={r.stops.length ? Math.round((r.done / r.stops.length) * 100) : 0} label={`${r.done} of ${r.stops.length} stops`} />
                  {r.active && <p className="mt-1 text-xs text-ink">{r.active.arrivedAt ? 'At' : 'Heading to'} {r.active.customerName}</p>}
                </button>
              </li>
            ))}</ul>
          ) : <EmptyState compact icon={Truck} title="No routes on the road" description="Confirmed and in-transit dispatches for today appear here." />}
        </Card>
        <Card className="lg:col-span-2">
          {sel ? (
            <>
              <CardHeader title={`${sel.dsp.dispatchNumber} · ${sel.dsp.driverName}`} subtitle={sel.active ? (sel.active.arrivedAt ? `Arrived at ${sel.active.customerName} ${formatTime(sel.active.arrivedAt)}` : pos ? `${pos.remainingKm} km to ${sel.active.customerName} · about ${pos.etaMinutes} min (simulated)` : '') : 'No delivery in progress'} icon={Navigation} />
              <DemoRouteMap badge={false} hub={data.lk.hubs[sel.dsp.hubId]} stops={sel.stops} customers={data.lk.customers} position={pos} highlightId={sel.active?.id} height={320} />
              <ol className="mt-4 divide-y divide-line">{sel.stops.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="min-w-0"><Link to={`/dispatch/deliveries/${s.id}`} className="text-sm font-medium text-ink hover:text-brand">{s.sequence}. {s.customerName}</Link>{data.lk.customers[s.customerId]?.isVip && <Badge tone="accent" className="ml-1.5">VIP</Badge>}<EtaLine plan={['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(s.status) ? sel.plan[s.id] : null} /></div>
                  <DeliveryStatusBadge status={s.status} />
                </li>
              ))}</ol>
            </>
          ) : <EmptyState icon={MapPinned} title="Select a route" />}
        </Card>
      </div>
    </>
  )
}
