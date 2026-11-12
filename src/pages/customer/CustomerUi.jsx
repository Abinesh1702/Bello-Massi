import { Link } from 'react-router-dom'
import { Building2, ChevronRight, Package } from 'lucide-react'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import { approvalLabel, customerStatusLabel, deliveryLabel, TRACK_STAGES } from '../../services/customerAppService'
import { ORDER_STATUS_META } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

export const NoCustomerLink = () => <EmptyState icon={Building2} title="No customer account linked" description="Your login is not linked to a customer account. Ask your Bellomassi account manager to link it in User Management." />

export const OrderStatusPill = ({ order }) => <Badge tone={ORDER_STATUS_META[order.orderStatus]?.tone || 'neutral'} dot>{customerStatusLabel(order)}</Badge>

const toneFor = (label) => (/deliver(ed)?$|Delivered/.test(label) ? 'success' : /fail|reject|Not accepted/i.test(label) ? 'danger' : /arrived|out for/i.test(label) ? 'accent' : 'neutral')

/** Order card used on Home and My Orders. */
export function OrderCard({ order, delivery }) {
  const dl = deliveryLabel(order, delivery)
  return (
    <li>
      <Link to={`/customer/orders/${order.id}`} className="block rounded-xl border border-line bg-surface p-4 shadow-sm hover:border-brand/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-ink tabular">{order.orderNumber}</p>
            <p className="text-xs text-muted">{formatDate(order.orderDate)} · {(order.items || []).length} item{(order.items || []).length === 1 ? '' : 's'} · {formatCurrency(order.totalAmount)}</p>
          </div>
          <ChevronRight size={18} className="mt-1 shrink-0 text-muted" aria-hidden />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <OrderStatusPill order={order} />
          <Badge tone={order.approvalStatus === 'APPROVED' ? 'success' : order.approvalStatus === 'REJECTED' ? 'danger' : 'warning'}>{approvalLabel(order)}</Badge>
          {dl !== '—' && <Badge tone={toneFor(dl)}>{dl}</Badge>}
        </div>
      </Link>
    </li>
  )
}

/** Vertical tracking timeline: Placed → … → Delivered. */
export function TrackTimeline({ stage, failed = false, rejected = false, times = {} }) {
  return (
    <ol className="relative space-y-3 before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-0.5 before:bg-line">
      {TRACK_STAGES.map((label, i) => {
        const done = i < stage || (i === stage && i === TRACK_STAGES.length - 1)
        const current = i === stage && !done
        return (
          <li key={label} className="relative flex items-start gap-3" aria-current={current ? 'step' : undefined}>
            <span className={cn('relative z-[1] mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold',
              done ? 'border-success bg-success text-white' : current ? (failed || rejected ? 'border-danger bg-danger text-white' : 'border-accent bg-accent text-navy') : 'border-line bg-surface text-muted')}>{i + 1}</span>
            <div className="min-w-0">
              <p className={cn('text-sm', current ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-muted')}>{label}{current && failed ? ' — not completed' : ''}{current && rejected ? ' — not accepted' : ''}</p>
              {times[i] && <p className="text-xs text-muted">{times[i]}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function ProductThumb({ product, className }) {
  return product?.image
    ? <img src={product.image} alt="" className={cn('rounded-lg object-cover', className)} />
    : <span className={cn('grid place-items-center rounded-lg bg-surface-2 text-muted', className)} aria-hidden><Package size={22} /></span>
}
