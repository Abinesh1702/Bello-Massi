import { useMemo } from 'react'
import { ClipboardList, FileEdit, Clock, CheckCircle2, XCircle, RotateCcw, FilePlus2, ListOrdered, PhoneCall, Mail, MessageCircle } from 'lucide-react'
import StatCard, { StatGrid } from '../StatCard'
import { QuickActions } from '../QuickAction'
import Card from '../../common/Card'
import Button from '../../common/Button'
import RecentOrders from '../widgets/RecentOrders'
import PendingTasks from '../widgets/PendingTasks'
import OrderTrendChart from '../charts/OrderTrendChart'
import { getOrderTrend, inStatus, sumValue } from '../../../services/dashboardService'
import { ORDER_STATUS as S, POST_APPROVAL_STATUSES } from '../../../utils/constants'
import { formatCompactCurrency } from '../../../utils/formatters'
import { getOrderTrendForRange, trendAxisText } from '../../../utils/dashboardTrends'
import { rangeText } from '../../../utils/periods'

export default function SalesmanDashboard({ user, orders, range, previous }) {
  const mine = useMemo(() => orders.filter((o) => o.salesmanId === user.id || o.createdBy === user.id), [orders, user.id])
  const drafts = inStatus(mine, S.DRAFT)
  const pending = inStatus(mine, S.SUBMITTED)
  const approved = inStatus(mine, ...POST_APPROVAL_STATUSES)
  const rejected = inStatus(mine, S.REJECTED)
  const returned = inStatus(mine, S.RETURNED)
  const ready = inStatus(mine, S.READY_FOR_DISPATCH)
  const prevMine = previous ? previous.orders.filter((o) => o.salesmanId === user.id || o.createdBy === user.id) : null
  const cmp = (fn) => (prevMine ? { previous: fn(prevMine), current: fn(mine) } : undefined)

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden bg-navy! text-white border-navy! dark:bg-[#1d2550]!">
        <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-accent/20 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Quick create</p>
            <h2 className="mt-1 text-lg font-semibold">Got an order by call, email or WhatsApp?</h2>
            <p className="mt-1 text-sm text-white/70">Pick the customer, add items and quantities, then submit it for approval.</p>
          </div>
          <Button variant="accent" size="lg" icon={FilePlus2} to="/orders/create" className="self-start sm:self-auto">Create order</Button>
        </div>
      </Card>

      <StatGrid cols={6}>
        <StatCard label="My orders" value={mine.length} compare={cmp((x) => x.length)} icon={ClipboardList} tone="brand" hint={formatCompactCurrency(sumValue(mine))} to="/orders/my-orders" />
        <StatCard label="Draft orders" value={drafts.length} icon={FileEdit} tone="neutral" hint="Not yet submitted" to="/orders/my-orders?status=DRAFT" />
        <StatCard label="Pending approval" value={pending.length} compare={cmp((x) => inStatus(x, S.SUBMITTED).length)} icon={Clock} tone="warning" hint="With Sales Manager" to="/orders/my-orders?status=SUBMITTED" />
        <StatCard label="Approved orders" value={approved.length} compare={cmp((x) => inStatus(x, ...POST_APPROVAL_STATUSES).length)} icon={CheckCircle2} tone="success" hint={`${ready.length} ready for dispatch`} to="/orders/my-orders?approval=APPROVED" />
        <StatCard label="Returned orders" value={returned.length} icon={RotateCcw} tone="accent" hint="Need your correction" to="/orders/returned" />
        <StatCard label="Rejected orders" value={rejected.length} icon={XCircle} tone="danger" hint="See the manager’s reason" to="/orders/rejected" />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><RecentOrders orders={mine} title="My recent orders" showSalesman={false} /></div>
        <div className="space-y-6">
          <PendingTasks
            title="Needs your action"
            tasks={[
              { label: 'Returned for correction', description: 'Fix with the manager’s remarks and resubmit', count: returned.length, to: '/orders/returned', tone: 'warning' },
              { label: 'Drafts to submit', description: 'Finish and submit for approval', count: drafts.length, to: '/orders/my-orders?status=DRAFT', tone: 'neutral' },
              { label: 'Ready for dispatch', description: 'Released to the Dispatcher', count: ready.length, to: '/orders/my-orders?status=READY_FOR_DISPATCH', tone: 'success' },
            ]}
          />
          <QuickActions
            actions={[
              { icon: PhoneCall, label: 'Order from a call', to: '/orders/create?source=call' },
              { icon: Mail, label: 'Order from an email', to: '/orders/create?source=email' },
              { icon: MessageCircle, label: 'Order from WhatsApp', to: '/orders/create?source=whatsapp' },
              { icon: ListOrdered, label: 'Track my orders', to: '/orders/my-orders' },
            ]}
          />
        </div>
      </div>
      <OrderTrendChart data={range ? getOrderTrendForRange(mine, range, { allOrders: mine }) : getOrderTrend(mine, 14)} title="My order trend" subtitle={range ? `My orders created and delivered ${trendAxisText(range)} · ${range.start ? rangeText(range) : 'all time'}` : 'My orders created and delivered, last 14 days'} />
    </div>
  )
}
