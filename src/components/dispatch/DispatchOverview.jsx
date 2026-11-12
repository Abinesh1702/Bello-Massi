import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PackageCheck, Route, UserRoundCheck, PackageMinus, Truck, CheckCircle2, AlertTriangle, PackageSearch, UserRound, Car,
  Navigation, ClipboardCheck, FileText, Clock,
} from 'lucide-react'
import Card, { CardHeader } from '../common/Card'
import Button from '../common/Button'
import EmptyState from '../common/EmptyState'
import StatCard, { StatGrid } from '../dashboard/StatCard'
import SingleBarChart from '../dashboard/charts/SingleBarChart'
import dayjs from 'dayjs'
import { useDashboardPeriod } from '../../hooks/useDashboardPeriod'
import { filterByPeriod } from '../../utils/dashboardFilter'
import { rangeText } from '../../utils/periods'
import StackedBarChart from '../dashboard/charts/StackedBarChart'
import StatusDonutChart from '../dashboard/charts/StatusDonutChart'
import { DeliveryStatusBadge, DispatchStatusBadge } from './DispatchBadges'
import { useDispatchData } from '../../hooks/useDispatchData'
import { usePermission } from '../../hooks/usePermission'
import {
  getCompletionTrend, getDeliveryStatusDistribution, getDispatchKpis, getDispatchTrend, getDriverOutcomes, getZoneOutcomes, OUTCOME_SERIES,
} from '../../services/dispatchAnalytics'
import { formatDate, formatNumber, formatRelative } from '../../utils/formatters'

const ListCard = ({ title, icon, to, linkLabel = 'View all', rows, empty, render }) => (
  <Card>
    <CardHeader title={title} icon={icon} action={to && <Link to={to} className="text-xs font-medium text-brand hover:underline">{linkLabel}</Link>} />
    {rows.length ? <ul className="divide-y divide-line -my-1">{rows.map(render)}</ul> : <EmptyState compact title={empty} />}
  </Card>
)

/** Dispatch & delivery overview — /dispatch and the Dispatcher's dashboard. */
export default function DispatchOverview() {
  const raw = useDispatchData()
  const period = useDashboardPeriod()
  const range = period?.range || null
  // On a dashboard the dated collections follow the selected period (dispatch date, delivery completion date, order
  // date, note date); drivers and vehicles stay current. On /dispatch (no period) nothing is filtered.
  const data = useMemo(() => (range?.start ? { ...raw, dispatches: filterByPeriod('dispatches', raw.dispatches, range), deliveries: filterByPeriod('deliveries', raw.deliveries, range), orders: filterByPeriod('orders', raw.orders, range), notes: filterByPeriod('notes', raw.notes, range) } : raw), [raw, range])
  const { dispatches, deliveries, notes, drivers, zones, lk } = data
  const axis = useMemo(() => {
    if (!range?.start) return { n: 14, now: undefined, text: 'last 14 days' }
    const today = dayjs()
    const end = dayjs(range.end).isAfter(today) ? today : dayjs(range.end)
    const n = Math.max(1, Math.min(62, end.diff(dayjs(range.start), 'day') + 1))
    return { n, now: end, text: n < end.diff(dayjs(range.start), 'day') + 1 ? `last ${n} days of ${rangeText(range)}` : rangeText(range) }
  }, [range])
  const canManage = usePermission('dispatch.manage')
  const k = useMemo(() => getDispatchKpis(data), [data])
  const trend = useMemo(() => getDispatchTrend(dispatches, axis.n, axis.now), [dispatches, axis])
  const completion = useMemo(() => getCompletionTrend(deliveries, axis.n, axis.now), [deliveries, axis])
  const distribution = useMemo(() => getDeliveryStatusDistribution(deliveries.filter((d) => d.status !== 'CANCELLED')), [deliveries])
  const byDriver = useMemo(() => getDriverOutcomes(deliveries, drivers).slice(0, 8), [deliveries, drivers])
  const byZone = useMemo(() => getZoneOutcomes(deliveries, dispatches, zones).slice(0, 8), [deliveries, dispatches, zones])
  const recent = [...dispatches].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 6)
  const inTransit = deliveries.filter((d) => d.status === 'OUT_FOR_DELIVERY' || (d.status === 'DISPATCHED' && lk.dispatches[d.dispatchId]?.status === 'IN_TRANSIT')).sort((a, b) => a.sequence - b.sequence).slice(0, 6)
  const failed = deliveries.filter((d) => d.reviewStatus === 'PENDING').slice(0, 6)
  const pending = dispatches.filter((d) => ['DRAFT', 'PLANNED'].includes(d.status)).slice(0, 6)
  const recentNotes = [...notes].sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1)).slice(0, 6)

  return (
    <div className="space-y-6">
      <StatGrid cols={5}>
        <StatCard label="Ready for dispatch" value={k.ready} icon={PackageCheck} tone="accent" hint={`${k.readyUnplanned} not yet planned`} to="/dispatch/ready-orders" />
        <StatCard label="Planned dispatches" value={k.planned} icon={Route} tone="info" hint={`${k.drafts} draft${k.drafts === 1 ? '' : 's'} · driver needed`} to="/dispatch/assignments" />
        <StatCard label="Assigned dispatches" value={k.assigned} icon={UserRoundCheck} tone="brand" hint="To be confirmed" to="/dispatch/assignments" />
        <StatCard label="Confirmed dispatches" value={k.confirmed} icon={PackageMinus} tone="accent" hint="Loaded, not started" to="/dispatch/planning" />
        <StatCard label="In transit" value={k.inTransit} icon={Truck} tone="warning" hint={`${k.outForDelivery} stop${k.outForDelivery === 1 ? '' : 's'} out now`} to="/dispatch/delivery-tracking?dispatchStatus=IN_TRANSIT" />
      </StatGrid>
      <StatGrid cols={5}>
        <StatCard label="Completed deliveries" value={k.completedDeliveries} icon={CheckCircle2} tone="success" to="/dispatch/delivery-history" />
        <StatCard label="Failed deliveries" value={k.failedDeliveries} icon={AlertTriangle} tone="danger" hint={`${k.pendingReview} awaiting review`} to="/dispatch/delivery-history?tab=review" />
        <StatCard label="Partial deliveries" value={k.partialDeliveries} icon={PackageSearch} tone="warning" to="/dispatch/delivery-tracking?status=PARTIALLY_DELIVERED" />
        <StatCard label="Active drivers" live value={k.activeDrivers} icon={UserRound} tone="brand" hint={`${k.availableDrivers} available now`} to="/dispatch/drivers" />
        <StatCard label="Available vehicles" live value={k.availableVehicles} icon={Car} tone="info" hint={`of ${k.totalVehicles}`} to="/vms/vehicles?status=Available" />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <SingleBarChart title="Dispatch trend" subtitle={`Dispatches per dispatch date, ${axis.text}`} data={trend} seriesName="Dispatches" height={240} />
        <StackedBarChart title="Delivery completion trend" subtitle={`Outcomes recorded per day, ${axis.text}`} data={completion} series={OUTCOME_SERIES} height={240} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <StatusDonutChart data={distribution} title="Delivery status distribution" subtitle="All delivery stops" linkTo="/dispatch/delivery-tracking" linkLabel="Tracking" centerLabel="stops" />
        <StackedBarChart title="Driver performance" subtitle="Closed stops per driver" data={byDriver} series={OUTCOME_SERIES} layout="vertical" height={Math.max(220, byDriver.length * 34)} />
        <StackedBarChart title="Zone delivery performance" subtitle="Closed stops per zone" data={byZone} series={OUTCOME_SERIES} layout="vertical" height={Math.max(220, byZone.length * 34)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ListCard title="Recent dispatches" icon={Route} to="/dispatch/planning?view=list" rows={recent} empty="No dispatches yet" render={(d) => (
          <li key={d.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1"><Link to={`/dispatch/${d.id}`} className="text-sm font-medium text-ink hover:text-brand tabular">{d.dispatchNumber}</Link><p className="truncate text-xs text-muted">{formatDate(d.dispatchDate)} · {d.driverName || 'no driver'} · {d.totalDeliveries} stops</p></div>
            <DispatchStatusBadge status={d.status} />
          </li>
        )} />
        <ListCard title="In-transit deliveries" icon={Navigation} to="/dispatch/delivery-tracking?dispatchStatus=IN_TRANSIT" rows={inTransit} empty="Nothing on the road" render={(d) => (
          <li key={d.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1"><Link to={`/dispatch/deliveries/${d.id}`} className="text-sm font-medium text-ink hover:text-brand">{d.orderNumber}</Link><p className="truncate text-xs text-muted">Stop {d.sequence} · {d.customerName} · {lk.dispatches[d.dispatchId]?.driverName}</p></div>
            <DeliveryStatusBadge status={d.status} />
          </li>
        )} />
        <ListCard title="Failed / partial — review" icon={ClipboardCheck} to="/dispatch/delivery-history?tab=review" rows={failed} empty="No exceptions waiting" render={(d) => (
          <li key={d.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1"><Link to={`/dispatch/deliveries/${d.id}`} className="text-sm font-medium text-ink hover:text-brand">{d.orderNumber}</Link><p className="truncate text-xs text-muted">{d.customerName} · {d.failureReason || 'Partial delivery'}</p></div>
            <DeliveryStatusBadge status={d.status} />
          </li>
        )} />
        <ListCard title="Pending assignments" icon={Clock} to="/dispatch/assignments" rows={pending} empty="Every plan has a driver" render={(d) => (
          <li key={d.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1"><Link to={`/dispatch/${d.id}`} className="text-sm font-medium text-ink hover:text-brand tabular">{d.dispatchNumber}</Link><p className="truncate text-xs text-muted">{formatDate(d.dispatchDate)} · {lk.zones[d.zoneId]?.name || 'no zone'} · {formatNumber(d.totalQuantity)} units</p></div>
            <DispatchStatusBadge status={d.status} />
          </li>
        )} />
        <ListCard title="Recent delivery notes" icon={FileText} to="/dispatch/delivery-history?tab=notes" rows={recentNotes} empty="No delivery notes yet" render={(n) => (
          <li key={n.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1"><Link to={`/dispatch/delivery-notes/${n.id}`} className="text-sm font-medium text-ink hover:text-brand tabular">{n.noteNumber}</Link><p className="truncate text-xs text-muted">{n.customerName} · {formatRelative(n.generatedAt)}</p></div>
            <DeliveryStatusBadge status={n.deliveryStatus} />
          </li>
        )} />
        {canManage && (
          <Card>
            <CardHeader title="Quick actions" icon={Truck} />
            <div className="grid gap-2">
              <Button icon={Route} to="/dispatch/create">New dispatch plan</Button>
              <Button variant="secondary" icon={PackageCheck} to="/dispatch/ready-orders">Ready-for-dispatch queue</Button>
              <Button variant="secondary" icon={UserRoundCheck} to="/dispatch/assignments">Assign drivers</Button>
              <Button variant="secondary" icon={Navigation} to="/dispatch/delivery-tracking">Track deliveries</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
