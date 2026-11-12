import { useMemo } from 'react'
import { ClipboardList, Clock, BadgeCheck, Layers, Truck, XCircle, FilePlus2, UserCog, Download, PackagePlus, FileBarChart } from 'lucide-react'
import StatCard, { StatGrid } from '../StatCard'
import { QuickActions } from '../QuickAction'
import OrderTrendChart from '../charts/OrderTrendChart'
import StatusDonutChart from '../charts/StatusDonutChart'
import DeliveryPerformanceChart from '../charts/DeliveryPerformanceChart'
import RecentOrders from '../widgets/RecentOrders'
import ActivityFeed from '../widgets/ActivityFeed'
import PendingTasks from '../widgets/PendingTasks'
import LowStockAlerts from '../widgets/LowStockAlerts'
import OpsOverview from './OpsOverview'
import { getDeliveryPerformanceByHub, getOnTimeRate, getOrderTrend, getStatusDistribution, inStatus, sumValue } from '../../../services/dashboardService'
import { ORDER_STATUS as S } from '../../../utils/constants'
import { getOrderTrendForRange, trendAxisText } from '../../../utils/dashboardTrends'
import { rangeText } from '../../../utils/periods'
import { formatCompactCurrency, formatNumber } from '../../../utils/formatters'

export default function AdminDashboard({ data, orders, activities, users, range, previous }) {
  const m = useMemo(() => ({
    submitted: inStatus(orders, S.SUBMITTED),
    approved: inStatus(orders, S.APPROVED),
    consolidated: inStatus(orders, S.CONSOLIDATED),
    ready: inStatus(orders, S.READY_FOR_DISPATCH),
    rejected: inStatus(orders, S.REJECTED),
    returned: inStatus(orders, S.RETURNED),
    trend: range ? getOrderTrendForRange(orders, range, { allOrders: data.orders }) : getOrderTrend(orders, 14),
    distribution: getStatusDistribution(orders),
    performance: getDeliveryPerformanceByHub(orders, data.hubs),
    onTime: getOnTimeRate(orders),
  }), [orders, data, range])
  const po = previous?.orders
  const cmp = (fn, format) => (po ? { previous: fn(po), format } : undefined)
  const live = orders.filter((o) => o.status !== S.DRAFT)

  const tasks = [
    { label: 'Orders awaiting approval', description: 'Sales Manager decision needed', count: m.submitted.length, to: '/orders/approval', tone: 'warning' },
    { label: 'Returned for correction', description: 'Waiting for salesmen to amend', count: m.returned.length, to: '/orders/returned', tone: 'warning' },
    { label: 'Approved, awaiting consolidation', description: 'With Customer Service', count: m.approved.length, to: '/orders/consolidation', tone: 'info' },
    { label: 'Consolidated, not yet released', description: 'To be marked ready for dispatch', count: m.consolidated.length, to: '/orders/consolidation?tab=consolidated', tone: 'brand' },
    { label: 'Failed deliveries', description: 'Dispatcher review needed', count: inStatus(orders, S.DELIVERY_FAILED).length, to: '/dispatch/delivery-history?tab=review', tone: 'danger' },
    { label: 'Ready, not yet planned', description: 'Waiting in the dispatch queue', count: orders.filter((o) => o.status === S.READY_FOR_DISPATCH && !o.dispatchId).length, to: '/dispatch/ready-orders', tone: 'accent' },
  ]

  return (
    <div className="space-y-6">
      <OpsOverview />
      <section aria-label="Order pipeline" className="space-y-2">
      <h2 className="text-section-title">Order pipeline</h2>
      <StatGrid cols={6}>
        <StatCard label="Total orders" value={formatNumber(orders.length)} compare={cmp((x) => x.length) && { ...cmp((x) => x.length), current: orders.length }} icon={ClipboardList} tone="brand" hint={`${formatCompactCurrency(sumValue(live))} submitted value`} to="/orders" />
        <StatCard label="Pending approval" value={m.submitted.length} compare={cmp((x) => inStatus(x, S.SUBMITTED).length)} icon={Clock} tone="warning" hint={formatCompactCurrency(sumValue(m.submitted))} to="/orders/approval" />
        <StatCard label="Approved" value={m.approved.length} compare={cmp((x) => inStatus(x, S.APPROVED).length)} icon={BadgeCheck} tone="info" hint="Awaiting consolidation" to="/orders?status=APPROVED" />
        <StatCard label="Consolidated" value={m.consolidated.length} compare={cmp((x) => inStatus(x, S.CONSOLIDATED).length)} icon={Layers} tone="accent" hint="Not yet released" to="/orders?status=CONSOLIDATED" />
        <StatCard label="Ready for dispatch" value={m.ready.length} compare={cmp((x) => inStatus(x, S.READY_FOR_DISPATCH).length)} icon={Truck} tone="success" hint={formatCompactCurrency(sumValue(m.ready))} to="/orders?status=READY_FOR_DISPATCH" />
        <StatCard label="Rejected" value={m.rejected.length} compare={cmp((x) => inStatus(x, S.REJECTED).length) && { ...cmp((x) => inStatus(x, S.REJECTED).length), invert: true }} icon={XCircle} tone="danger" hint={`${m.returned.length} returned for correction`} to="/orders/rejected" />
      </StatGrid>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><OrderTrendChart data={m.trend} subtitle={range ? `Orders created and delivered ${trendAxisText(range)} · ${range.start ? rangeText(range) : 'all time'}` : 'Orders created and delivered per day, last 14 days'} /></div>
        <StatusDonutChart data={m.distribution} linkTo="/orders" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><DeliveryPerformanceChart data={m.performance} onTimeRate={m.onTime} /></div>
        <PendingTasks tasks={tasks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><RecentOrders orders={orders} limit={7} /></div>
        <QuickActions
          actions={[
            { icon: FilePlus2, label: 'Create order', description: 'Capture a new customer order', to: '/orders/create', accent: true },
            { icon: FileBarChart, label: 'Sales reports', description: 'Register, approvals, consolidation', to: '/reports/center?category=sales' },
            { icon: PackagePlus, label: 'Receive stock', description: 'Record a stock receipt (GRN)', to: '/inventory/stock-receipts/create' },
            { icon: UserCog, label: 'Manage users', description: 'Users and role access', to: '/admin/users' },
            { icon: Download, label: 'Backup demo data', description: 'Export, import or reset', to: '/settings?tab=demo' },
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><ActivityFeed activities={activities} users={users} limit={10} /></div>
        <LowStockAlerts limit={6} />
      </div>
    </div>
  )
}
