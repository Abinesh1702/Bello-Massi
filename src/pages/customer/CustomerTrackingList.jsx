import { Link } from 'react-router-dom'
import { ChevronRight, Navigation, PackageCheck, Truck } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import { DemoGpsBadge } from '../../components/driver/DriverExtras'
import { useCustomerWorkspace } from '../../hooks/useCustomerWorkspace'
import { deliveryLabel } from '../../services/customerAppService'
import { formatDate, formatTime } from '../../utils/formatters'
import { NoCustomerLink } from './CustomerUi'

const ON_THE_WAY = ['DISPATCHED', 'OUT_FOR_DELIVERY']
const DONE = ['DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED', 'RETURNED']

function TrackRow({ order, delivery, w }) {
  const driver = delivery ? w.lk.drivers[delivery.driverId] : null
  const label = deliveryLabel(order, delivery)
  const tone = delivery?.status === 'OUT_FOR_DELIVERY' ? 'accent' : delivery?.status === 'DELIVERED' ? 'success' : ['FAILED', 'RETURNED'].includes(delivery?.status) ? 'danger' : 'info'
  return (
    <li>
      <Link to={`/customer/tracking/${order.id}`} className="block rounded-xl border border-line bg-surface p-4 shadow-sm hover:border-brand/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-ink tabular">{order.orderNumber}</p>
            <p className="text-xs text-muted">
              {[
                driver ? driver.name : 'Driver not assigned yet',
                driver?.vehicleNo,
                delivery?.arrivedAt && delivery.status === 'OUT_FOR_DELIVERY' ? `arrived ${formatTime(delivery.arrivedAt)}` : null,
                delivery?.completedAt ? formatDate(delivery.completedAt) : null,
              ].filter(Boolean).join(' · ')}
            </p>
          </div>
          <ChevronRight size={18} className="mt-1 shrink-0 text-muted" aria-hidden />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={tone} dot>{label}</Badge>
          {delivery?.status === 'OUT_FOR_DELIVERY' && <DemoGpsBadge />}
        </div>
      </Link>
    </li>
  )
}

/** Customer › Tracking: the customer's own deliveries on the way, then recently completed ones. */
export default function CustomerTrackingList() {
  const w = useCustomerWorkspace()
  if (!w.customer) return <NoCustomerLink />
  const rows = w.orders.map((o) => ({ order: o, delivery: w.deliveryOf(o.id) }))
  const active = rows.filter((r) => ON_THE_WAY.includes(r.delivery?.status) || (!r.delivery && ['CONSOLIDATED', 'READY_FOR_DISPATCH'].includes(r.order.orderStatus)))
  const recent = rows.filter((r) => DONE.includes(r.delivery?.status)).slice(0, 10)
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold text-ink">Tracking</h1><p className="text-sm text-muted">Follow your deliveries. The delivery OTP appears on the order’s tracking screen when the driver arrives.</p></div>
      <section aria-labelledby="track-active" className="space-y-2">
        <h2 id="track-active" className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Truck size={15} aria-hidden />On the way ({active.length})</h2>
        {active.length ? <ul className="space-y-2.5">{active.map((r) => <TrackRow key={r.order.id} {...r} w={w} />)}</ul>
          : <Card><EmptyState compact icon={Navigation} title="Nothing on the way" description="Orders appear here once they are prepared for dispatch." action={<Button size="sm" variant="secondary" to="/customer/orders">My orders</Button>} /></Card>}
      </section>
      <section aria-labelledby="track-recent" className="space-y-2">
        <h2 id="track-recent" className="flex items-center gap-1.5 text-sm font-semibold text-ink"><PackageCheck size={15} aria-hidden />Recently delivered ({recent.length})</h2>
        {recent.length ? <ul className="space-y-2.5">{recent.map((r) => <TrackRow key={r.order.id} {...r} w={w} />)}</ul>
          : <p className="text-sm text-muted">No completed deliveries yet.</p>}
      </section>
    </div>
  )
}
