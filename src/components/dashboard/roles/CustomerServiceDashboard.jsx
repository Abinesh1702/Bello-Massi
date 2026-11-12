import { useMemo } from 'react'
import { BadgeCheck, Layers, PackageCheck, Truck, Users } from 'lucide-react'
import StatCard, { StatGrid } from '../StatCard'
import Card, { CardHeader } from '../../common/Card'
import DataTable from '../../common/DataTable'
import EmptyState from '../../common/EmptyState'
import Button from '../../common/Button'
import StatusDonutChart from '../charts/StatusDonutChart'
import RecentOrders from '../widgets/RecentOrders'
import OrderQueue from '../widgets/OrderQueue'
import { getConsolidationQueue, getStatusDistribution, inStatus, sumValue } from '../../../services/dashboardService'
import { ORDER_STATUS as S, POST_APPROVAL_STATUSES } from '../../../utils/constants'
import { formatCompactCurrency, formatMoney } from '../../../utils/formatters'

export default function CustomerServiceDashboard({ orders, previous }) {
  const scoped = orders.filter((o) => POST_APPROVAL_STATUSES.includes(o.status))
  const awaiting = scoped.filter((o) => o.status === S.APPROVED && o.consolidationStatus === 'PENDING')
  const consolidated = inStatus(scoped, S.CONSOLIDATED)
  const ready = inStatus(scoped, S.READY_FOR_DISPATCH)
  const bySalesman = useMemo(() => getConsolidationQueue(orders), [orders])
  const prev = previous ? previous.orders.filter((o) => POST_APPROVAL_STATUSES.includes(o.status)) : null
  const cmp = (fn) => (prev ? { previous: fn(prev) } : undefined)

  return (
    <div className="space-y-6">
      <StatGrid cols={4}>
        <StatCard label="Approved orders" value={scoped.length} compare={cmp((x) => x.length)} icon={BadgeCheck} tone="brand" hint={formatCompactCurrency(sumValue(scoped))} to="/orders" />
        <StatCard label="Awaiting consolidation" value={awaiting.length} compare={cmp((x) => x.filter((o) => o.status === S.APPROVED && o.consolidationStatus === 'PENDING').length)} icon={Layers} tone="warning" hint={formatCompactCurrency(sumValue(awaiting))} to="/orders/consolidation" />
        <StatCard label="Consolidated orders" value={consolidated.length} compare={cmp((x) => inStatus(x, S.CONSOLIDATED).length)} icon={PackageCheck} tone="info" hint="Release to dispatch next" to="/orders/consolidation?tab=consolidated" />
        <StatCard label="Ready for dispatch" value={ready.length} compare={cmp((x) => inStatus(x, S.READY_FOR_DISPATCH).length)} icon={Truck} tone="success" hint="Handed to the Dispatcher" to="/orders/consolidation?tab=ready" />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <OrderQueue title="Consolidation queue" subtitle="Approved orders, oldest approval first" orders={[...awaiting].sort((a, b) => (a.approvedAt > b.approvedAt ? 1 : -1))} linkFor={(o) => `/orders/consolidation/${o.id}`} viewAllTo="/orders/consolidation" timeField="approvedAt" emptyTitle="Nothing to consolidate" />
          <Card>
            <CardHeader title="Queue by salesman" subtitle="Approved orders grouped per salesman" icon={Users} action={<Button size="sm" variant="secondary" to="/orders/consolidation?group=salesman">Open grouped view</Button>} />
            {bySalesman.length ? (
              <DataTable rowKey="salesman" rows={bySalesman} columns={[
                { key: 'salesman', header: 'Salesman', render: (r) => <span className="font-medium">{r.salesman}</span> },
                { key: 'orders', header: 'Orders', align: 'right' },
                { key: 'value', header: 'Value', align: 'right', render: (r) => formatMoney(r.value) },
              ]} />
            ) : <EmptyState compact icon={Layers} title="Nothing to consolidate" />}
          </Card>
        </div>
        <StatusDonutChart data={getStatusDistribution(scoped)} subtitle="Approved orders by stage" />
      </div>
      <RecentOrders orders={scoped} title="Recent approved orders" limit={8} />
    </div>
  )
}
