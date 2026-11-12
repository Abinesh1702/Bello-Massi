import { useNavigate } from 'react-router-dom'
import { ListOrdered } from 'lucide-react'
import Card, { CardHeader } from '../../common/Card'
import DataTable from '../../common/DataTable'
import EmptyState from '../../common/EmptyState'
import { StatusBadge } from '../../common/Badge'
import { formatCurrency, formatRelative } from '../../../utils/formatters'
import { useAuth } from '../../../hooks/useAuth'
import { canAccessPath } from '../../../config/navigation'

/** Most recently updated orders. Rows open the Order List module when the role can access it. */
export default function RecentOrders({ orders, title = 'Recent orders', subtitle, limit = 6, showSalesman = true }) {
  const navigate = useNavigate()
  const { role } = useAuth()
  const canOpen = canAccessPath('/orders', role)
  const open = (o) => navigate(`/orders/${o.id}`)
  const rows = [...orders].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, limit)

  const columns = [
    {
      key: 'id',
      header: 'Order',
      render: (o) => (
        <div className="min-w-0">
          <p className="font-medium text-ink tabular whitespace-nowrap">{o.ref}</p>
          <p className="text-xs text-muted truncate max-w-[180px] sm:max-w-none">{o.customerName}</p>
        </div>
      ),
    },
    ...(showSalesman ? [{ key: 'salesman', header: 'Salesman', hideBelow: '2xl', render: (o) => <span className="text-muted whitespace-nowrap">{o.salesmanName}</span> }] : []),
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'value', header: 'Value', align: 'right', hideBelow: 'sm', render: (o) => <span className="whitespace-nowrap">{formatCurrency(o.totalValue)}</span> },
    { key: 'updated', header: 'Updated', align: 'right', hideBelow: '2xl', render: (o) => <span className="text-muted text-xs whitespace-nowrap">{formatRelative(o.updatedAt)}</span> },
  ]
  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle || `Latest ${rows.length} of ${orders.length}`}
        action={canOpen && <button type="button" onClick={() => navigate('/orders')} className="text-xs font-medium text-brand hover:underline">View all</button>}
      />
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={canOpen ? open : undefined}
        empty={<EmptyState compact icon={ListOrdered} title="No orders yet" description="Orders you work on will appear here." />}
      />
    </Card>
  )
}
