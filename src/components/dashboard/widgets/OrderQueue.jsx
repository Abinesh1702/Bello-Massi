import { Link } from 'react-router-dom'
import { ChevronRight, AlertTriangle, PackageX, Inbox } from 'lucide-react'
import Card, { CardHeader } from '../../common/Card'
import Badge from '../../common/Badge'
import EmptyState from '../../common/EmptyState'
import { formatMoney, formatRelative } from '../../../utils/formatters'
import { PRIORITY_TONE } from '../../../config/orderConfig'

/** Compact list of orders that need an action, each linking to its workspace page. */
export default function OrderQueue({ title, subtitle, orders, linkFor, viewAllTo, emptyTitle = 'Nothing waiting', limit = 6, timeField = 'submittedAt', badge }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} icon={Inbox} action={viewAllTo && orders.length > 0 && <Link to={viewAllTo} className="text-xs font-medium text-brand hover:underline">View all {orders.length}</Link>} />
      {!orders.length ? (
        <EmptyState compact icon={Inbox} title={emptyTitle} />
      ) : (
        <ul className="divide-y divide-line -my-1">
          {orders.slice(0, limit).map((o) => (
            <li key={o.id}>
              <Link to={linkFor(o)} className="group flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-md hover:bg-surface-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-ink truncate">{o.customerName}</span>
                    {o.orderPriority && o.orderPriority !== 'Normal' && <Badge tone={PRIORITY_TONE[o.orderPriority]}>{o.orderPriority}</Badge>}
                    {o.creditWarning && <Badge tone="danger"><AlertTriangle size={11} aria-hidden /> Credit</Badge>}
                    {o.stockWarning && <Badge tone="warning"><PackageX size={11} aria-hidden /> Stock</Badge>}
                    {badge?.(o)}
                  </div>
                  <p className="text-xs text-muted tabular truncate">{o.ref || o.orderNumber} · {o.salesmanName} · {o.hubName} · {formatRelative(o[timeField] || o.updatedAt)}</p>
                </div>
                <span className="text-sm font-semibold text-ink tabular whitespace-nowrap">{formatMoney(o.totalAmount)}</span>
                <ChevronRight size={16} className="text-muted group-hover:translate-x-0.5 transition-transform" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
