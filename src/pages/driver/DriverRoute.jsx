import { useSearchParams, Link } from 'react-router-dom'
import { Map as MapIcon, Navigation, Truck, ListChecks, Info } from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import { DeliveryStatusBadge } from '../../components/dispatch/DispatchBadges'
import { NoDriverRecord } from '../../components/driver/DriverUi'
import { DemoGpsBadge, DemoRouteMap, EtaLine, useNow, VipBadge } from '../../components/driver/DriverExtras'
import { useDriverWorkspace, navigationUrl } from '../../hooks/useDriverWorkspace'
import { getSessionForDelivery, livePosition } from '../../services/trackingService'
import { cn } from '../../utils/helpers'

/** Today's route on a schematic DEMO GPS map with ETAs in the Dispatcher's sequence. */
export default function DriverRoute() {
  const w = useDriverWorkspace()
  const [params] = useSearchParams()
  const now = useNow(4000)
  if (!w.driver) return <NoDriverRecord />
  const { current, stops, plan } = w
  if (!current) return <Card><EmptyState icon={MapIcon} title="No route today" description="Your route appears here once the Dispatcher assigns and confirms a dispatch." action={<Button variant="secondary" to="/driver/dashboard">Back to Today</Button>} /></Card>
  const active = stops.find((d) => d.status === 'OUT_FOR_DELIVERY')
  const pos = active ? livePosition(getSessionForDelivery(active.id, w.sessions), now) : null
  const focus = params.get('stop') || active?.id || w.next?.id
  const openStops = stops.filter((d) => ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(d.status))
  const km = openStops.reduce((s, d) => s + (plan[d.id]?.distanceKm || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted tabular">{current.dispatchNumber}</p>
          <h1 className="text-xl font-semibold text-ink">Route</h1>
        </div>
        <DemoGpsBadge />
      </div>
      <DemoRouteMap hub={w.hub} stops={stops} customers={w.lk.customers} position={pos} highlightId={focus} height={300} />
      <p className="flex gap-1.5 text-xs text-muted"><Info size={14} className="shrink-0" aria-hidden />Positions, distances and ETAs are simulated for the demo. The stop order is the Dispatcher’s sequence and is never changed automatically — use “Navigate” to open directions in your phone’s maps app.</p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <Card className="!p-3"><p className="text-xs text-muted">Stops left</p><p className="text-lg font-semibold tabular">{openStops.length}</p></Card>
        <Card className="!p-3"><p className="text-xs text-muted">Distance left</p><p className="text-lg font-semibold tabular">{Math.round(km * 10) / 10} km</p></Card>
        <Card className="!p-3"><p className="text-xs text-muted">Vehicle</p><p className="text-sm font-semibold tabular truncate">{w.vehicle?.vehicleNumber || '—'}</p></Card>
      </div>
      <Card padded={false}>
        <div className="px-4 pt-4"><CardHeader title="Stops in sequence" icon={ListChecks} /></div>
        <ol className="divide-y divide-line">
          {stops.map((d) => (
            <li key={d.id} className={cn('flex gap-3 px-4 py-3', focus === d.id && 'bg-accent/10')}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-semibold tabular">{d.sequence}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5"><Link to={`/driver/deliveries/${d.id}`} className="font-medium text-ink hover:text-brand truncate">{d.customerName}</Link>{w.lk.customers[d.customerId]?.isVip && <VipBadge />}</div>
                <p className="text-xs text-muted truncate">{d.deliveryAddress}</p>
                {['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(d.status) && <EtaLine plan={plan[d.id]} className="mt-0.5" />}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <DeliveryStatusBadge status={d.status} />
                  {['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(d.status) && <Button size="xs" variant="secondary" icon={Navigation} href={navigationUrl(d)} target="_blank" rel="noreferrer">Navigate</Button>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      {active && <Button icon={Truck} fullWidth to={`/driver/deliveries/${active.id}`}>Open active delivery</Button>}
    </div>
  )
}
