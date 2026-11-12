import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, PackageCheck, Truck, Wallet, ShoppingBag, FileText, Bell, Navigation, ArrowRight, LayoutGrid } from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import { DemoGpsBadge } from '../../components/driver/DriverExtras'
import { useCustomerWorkspace } from '../../hooks/useCustomerWorkspace'
import { formatCurrency, formatDate, formatRelative, formatTime } from '../../utils/formatters'
import { NoCustomerLink, OrderCard } from './CustomerUi'
import { DashboardPeriodProvider } from '../../context/DashboardPeriodContext'
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar'
import { useDashboardPeriod } from '../../hooks/useDashboardPeriod'
import { useAuth } from '../../hooks/useAuth'
import { filterByPeriod } from '../../utils/dashboardFilter'
import { CompareLine } from '../../components/dashboard/StatCard'

const Kpi = ({ label, value, icon: Icon, tone, to, compare, live }) => (
  <Link to={to} className="rounded-xl border border-line bg-surface p-3 shadow-sm hover:border-brand/50">
    <div className="flex items-center justify-between"><p className="text-xs text-muted">{label}</p><Icon size={16} className={tone} aria-hidden /></div>
    <p className="mt-1 text-xl font-semibold text-ink tabular truncate">{value}</p>
    {compare && <CompareLine compare={compare} />}
    {live && <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Current</p>}
  </Link>
)

export default function CustomerHome() {
  const { user } = useAuth()
  return (
    <DashboardPeriodProvider id={`customer:${user.id}`} defaultKey="all">
      <CustomerHomeInner />
    </DashboardPeriodProvider>
  )
}

function CustomerHomeInner() {
  const w = useCustomerWorkspace()
  const period = useDashboardPeriod()
  const [today] = useState(() => new Date().toISOString())
  if (!w.customer) return <NoCustomerLink />
  const { customer } = w
  // Order KPIs, recent orders and delivery notes follow the selected period (order date / delivery date).
  const orders = filterByPeriod('orders', w.orders, period?.range)
  const notes = filterByPeriod('notes', w.notes, period?.range)
  const prevOrders = period?.compare ? filterByPeriod('orders', w.orders, period.previous) : null
  const cmp = (fn) => (prevOrders ? { previous: fn(prevOrders), current: fn(orders) } : undefined)
  const isActive = (o) => ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)
  const isPending = (o) => ['SUBMITTED', 'RETURNED'].includes(o.orderStatus)
  const isDelivered = (o) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.orderStatus)
  const pending = orders.filter((o) => ['SUBMITTED', 'RETURNED'].includes(o.orderStatus))
  const active = orders.filter((o) => ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus))
  const delivered = orders.filter((o) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.orderStatus))
  const onRoad = w.deliveries.filter((d) => d.status === 'OUT_FOR_DELIVERY' || (d.status === 'DISPATCHED' && w.lk.dispatches[d.dispatchId]?.status === 'IN_TRANSIT'))
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted">{formatDate(today)}</p>
        <h1 className="text-xl font-semibold text-ink">Welcome, {w.user.name.split(' ')[0]}</h1>
        <p className="text-sm text-muted">{customer.name} · {customer.code}</p>
      </div>
      <DashboardFilterBar kinds={['orders', 'notes']} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Active orders" value={active.length} compare={cmp((x) => x.filter(isActive).length)} icon={Truck} tone="text-info" to="/customer/orders?status=active" />
        <Kpi label="Pending approval" value={pending.length} compare={cmp((x) => x.filter(isPending).length)} icon={Clock} tone="text-warning" to="/customer/orders?status=pending" />
        <Kpi label="Delivered" value={delivered.length} compare={cmp((x) => x.filter(isDelivered).length)} icon={PackageCheck} tone="text-success" to="/customer/orders?status=delivered" />
        <Kpi label="Outstanding" live value={formatCurrency(customer.creditBalance || 0)} icon={Wallet} tone="text-danger" to="/customer/payments" />
      </div>

      {onRoad.map((d) => {
        const order = w.lk.orders[d.orderId]
        return (
          <Card key={d.id} className="border-accent/60">
            <CardHeader title={d.arrivedAt ? 'Your driver has arrived' : d.status === 'OUT_FOR_DELIVERY' ? 'Your delivery is on the way' : 'Your order is on the vehicle'} subtitle={`${d.orderNumber} · stop ${d.sequence}`} icon={Navigation} action={<DemoGpsBadge />} />
            <p className="text-sm text-ink">{w.lk.drivers[d.driverId]?.name} · {w.lk.vehicles[d.vehicleId]?.vehicleNumber}</p>
            {d.arrivedAt ? <p className="mt-1 text-sm text-ink">Arrived {formatTime(d.arrivedAt)} — share your delivery OTP with the driver.</p> : d.startedAt && <p className="mt-1 text-xs text-muted">Started {formatTime(d.startedAt)}</p>}
            <Button className="mt-3" icon={Navigation} fullWidth to={`/customer/tracking/${order?.id || d.orderId}`}>{d.arrivedAt ? 'Show OTP & track' : 'Track delivery'}</Button>
          </Card>
        )
      })}

      <div className="grid grid-cols-2 gap-2">
        <Button icon={LayoutGrid} to="/customer/catalog">Browse catalog</Button>
        <Button variant="secondary" icon={ShoppingBag} to="/customer/cart">Cart{w.cart.items.length ? ` (${w.cart.items.length})` : ''}</Button>
      </div>

      <Card>
        <CardHeader title="Recent orders" icon={ShoppingBag} action={<Link to="/customer/orders" className="text-xs font-medium text-brand hover:underline">All orders</Link>} />
        {orders.length ? <ul className="space-y-2.5">{orders.slice(0, 3).map((o) => <OrderCard key={o.id} order={o} delivery={w.deliveryOf(o.id)} />)}</ul>
          : <EmptyState compact icon={ShoppingBag} title="No orders yet" description="Place your first order from the catalog." action={<Button size="sm" to="/customer/catalog">Browse catalog</Button>} />}
      </Card>

      <Card>
        <CardHeader title="Recent delivery notes" icon={FileText} action={<Link to="/customer/delivery-notes" className="text-xs font-medium text-brand hover:underline">All</Link>} />
        {notes.length ? (
          <ul className="divide-y divide-line">{notes.slice(0, 3).map((n) => (
            <li key={n.id}><Link to={`/customer/delivery-notes/${n.id}`} className="flex items-center justify-between gap-2 py-2.5 text-sm hover:text-brand"><span className="tabular">{n.noteNumber} · {n.orderNumber}</span><span className="flex items-center gap-1 text-xs text-muted">{formatDate(n.deliveryDate)}<ArrowRight size={13} aria-hidden /></span></Link></li>
          ))}</ul>
        ) : <p className="text-sm text-muted">Delivery notes appear here after each delivery.</p>}
      </Card>

      <Card>
        <CardHeader title="Notifications" icon={Bell} action={<Link to="/notifications" className="text-xs font-medium text-brand hover:underline">All</Link>} />
        {w.notifications.length ? (
          <ul className="divide-y divide-line">{w.notifications.slice(0, 4).map((n) => (
            <li key={n.id} className="py-2">{n.link ? <Link to={n.link} className="text-sm text-ink hover:text-brand">{n.title}</Link> : <p className="text-sm text-ink">{n.title}</p>}<p className="text-xs text-muted">{n.message}</p><p className="text-[11px] text-muted">{formatRelative(n.createdAt)}</p></li>
          ))}</ul>
        ) : <p className="text-sm text-muted">You’re all caught up.</p>}
      </Card>
    </div>
  )
}
