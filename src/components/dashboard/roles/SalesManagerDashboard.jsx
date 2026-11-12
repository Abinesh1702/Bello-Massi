import { useState } from 'react'
import dayjs from 'dayjs'
import { Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import StatCard, { StatGrid } from '../StatCard'
import ApprovalTrendChart from '../charts/ApprovalTrendChart'
import CreditTable from '../widgets/CreditTable'
import RecentOrders from '../widgets/RecentOrders'
import OrderQueue from '../widgets/OrderQueue'
import SalesTargets from '../widgets/SalesTargets'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import Card, { CardHeader } from '../../common/Card'
import { getApprovalTrend, getCreditOverview, historyEventAt, inStatus, isToday, sumValue } from '../../../services/dashboardService'
import { ORDER_STATUS as S, STORAGE_KEYS } from '../../../utils/constants'
import { useStoredValue } from '../../../hooks/useLocalStorage'
import { formatCompactCurrency } from '../../../utils/formatters'
import { getApprovalTrendForRange } from '../../../utils/dashboardTrends'
import { rangeText } from '../../../utils/periods'
import { CurrentBadge } from '../DashboardFilterBar'

const EMPTY = []

export default function SalesManagerDashboard({ data, orders, timeline = [], range, previous }) {
  const [thisMonth] = useState(() => dayjs().format('YYYY-MM'))
  // Sales targets are monthly by definition — they always use all orders of the current month.
  const allOrders = useStoredValue(STORAGE_KEYS.ORDERS, EMPTY)
  const visible = orders.filter((o) => o.status !== S.DRAFT)
  const pending = inStatus(visible, S.SUBMITTED).sort((a, b) => (a.submittedAt > b.submittedAt ? 1 : -1))
  const approvedToday = visible.filter((o) => isToday(historyEventAt(o, S.APPROVED)))
  const rejectedToday = visible.filter((o) => isToday(historyEventAt(o, S.REJECTED)))
  const returned = inStatus(visible, S.RETURNED)
  const bounded = Boolean(range?.start)
  // Decisions in the selected period come from the approval timeline (decision date); All Time keeps "today".
  const decided = (tl, type) => tl.filter((e) => e.eventType === type)
  const prevVisible = previous ? previous.orders.filter((o) => o.status !== S.DRAFT) : null
  const approvedLabel = bounded ? 'Approved in period' : 'Approved today'
  const rejectedLabel = bounded ? 'Rejected in period' : 'Rejected today'
  const approvedN = bounded ? decided(timeline, S.APPROVED).length : approvedToday.length
  const rejectedN = bounded ? decided(timeline, S.REJECTED).length : rejectedToday.length

  return (
    <div className="space-y-6">
      <StatGrid cols={4}>
        <StatCard label="Pending approvals" value={pending.length} compare={prevVisible ? { previous: inStatus(prevVisible, S.SUBMITTED).length } : undefined} icon={Clock} tone="warning" hint={`${formatCompactCurrency(sumValue(pending))} in the inbox`} to="/orders/approval" />
        <StatCard label={approvedLabel} value={approvedN} compare={previous && bounded ? { previous: decided(previous.timeline, S.APPROVED).length } : undefined} icon={CheckCircle2} tone="success" hint={bounded ? 'Approval decisions' : formatCompactCurrency(sumValue(approvedToday))} to="/orders/approval?tab=decided" />
        <StatCard label={rejectedLabel} value={rejectedN} compare={previous && bounded ? { previous: decided(previous.timeline, S.REJECTED).length, invert: true } : undefined} icon={XCircle} tone="danger" hint="Always with a reason" to="/orders/rejected" />
        <StatCard label="Returned orders" value={returned.length} icon={RotateCcw} tone="info" hint="Waiting for salesmen" to="/orders/returned" />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <OrderQueue title="Recent pending orders" subtitle="Oldest first · open to review and decide" orders={pending} linkFor={(o) => `/orders/approval/${o.id}`} viewAllTo="/orders/approval" emptyTitle="Approval inbox is empty" />
        </div>
        <div className="lg:col-span-2"><ApprovalTrendChart data={range ? getApprovalTrendForRange(timeline, range) : getApprovalTrend(timeline, 7)} subtitle={range ? `Decisions · ${range.start ? rangeText(range) : 'all time'}` : undefined} /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><SalesTargets orders={allOrders} /></div>
        <Card className="lg:col-span-2">
          <CardHeader title={<span className="inline-flex items-center gap-2">Customers <CurrentBadge /></span>} subtitle="Active accounts and credit position" icon={Users} action={<Link to="/customers" className="text-xs font-medium text-brand hover:underline">Customer list</Link>} />
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs text-muted">Active customers</dt><dd className="mt-1 text-xl font-semibold text-ink tabular">{data.customers.filter((c) => c.status === 'Active').length}</dd></div>
            <div><dt className="text-xs text-muted">{bounded ? 'Ordered in period' : 'Ordered this month'}</dt><dd className="mt-1 text-xl font-semibold text-ink tabular">{new Set((bounded ? visible : visible.filter((o) => (o.submittedAt || '').slice(0, 7) === thisMonth)).map((o) => o.customerId)).size}</dd></div>
            <div><dt className="text-xs text-muted">Over credit limit</dt><dd className="mt-1 text-xl font-semibold text-danger tabular">{getCreditOverview(data.customers).filter((c) => c.status === 'EXCEEDED').length}</dd></div>
            <div><dt className="text-xs text-muted">VIP pass holders</dt><dd className="mt-1 text-xl font-semibold text-ink tabular">{data.customers.filter((c) => c.vipPassEnabled).length}</dd></div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CreditTable rows={getCreditOverview(data.customers)} limit={6} linkTo="/customers/credit" />
        <RecentOrders orders={visible} limit={6} />
      </div>
    </div>
  )
}
