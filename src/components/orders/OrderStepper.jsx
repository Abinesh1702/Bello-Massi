import { Check, X, RotateCcw } from 'lucide-react'
import { ORDER_STATUS as S } from '../../utils/constants'
import { formatDateTime } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const STEPS = [
  { key: S.DRAFT, label: 'Draft', at: 'createdAt' },
  { key: S.SUBMITTED, label: 'Submitted', at: 'submittedAt' },
  { key: S.APPROVED, label: 'Approved', at: 'approvedAt' },
  { key: S.CONSOLIDATED, label: 'Consolidated', at: 'consolidatedAt' },
  { key: S.READY_FOR_DISPATCH, label: 'Ready', at: 'readyForDispatchAt' },
  { key: S.DISPATCHED, label: 'Dispatched', at: 'dispatchedAt' },
  { key: S.DELIVERED, label: 'Delivered', at: 'deliveredAt' },
]
const ORDER = {
  DRAFT: 0, SUBMITTED: 1, RETURNED: 1, REJECTED: 1, APPROVED: 2, CONSOLIDATED: 3, READY_FOR_DISPATCH: 4,
  DISPATCHED: 5, OUT_FOR_DELIVERY: 5, DELIVERY_FAILED: 5, RETURNED_TO_HUB: 5, PARTIALLY_DELIVERED: 6, DELIVERED: 6,
}
const LAST = STEPS.length - 1

/** Order workflow progress (Phase 3 + 4) with the timestamp of each completed step. */
export default function OrderStepper({ order }) {
  const cancelled = order.orderStatus === S.CANCELLED
  // A cancelled order stops after the last step it reached (from its timestamps)
  const reached = cancelled ? STEPS.reduce((n, st, i) => (order[st.at] ? i : n), 1) : null
  const current = cancelled ? Math.min(reached + 1, LAST) : ORDER[order.orderStatus] ?? 0
  const halted = cancelled ? 'cancelled' : order.orderStatus === S.REJECTED ? 'rejected' : order.orderStatus === S.RETURNED ? 'returned' : null
  const haltAt = cancelled ? current : 2
  return (
    <ol className="grid grid-cols-7 gap-1" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i < current || (i === current && !halted && i === LAST)
        const isCurrent = i === current
        const haltHere = halted && i === haltAt
        return (
          <li key={step.key} className="min-w-0" aria-current={isCurrent ? 'step' : undefined}>
            <div className={cn('h-1.5 rounded-full', done || (isCurrent && !halted) ? 'bg-[var(--chart-1)]' : haltHere ? (halted === 'returned' ? 'bg-warning' : 'bg-danger') : 'bg-surface-2')} />
            <div className="mt-2 flex items-center gap-1.5">
              <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                done || (isCurrent && !halted) ? 'bg-[var(--chart-1)] text-white' : haltHere ? (halted === 'returned' ? 'bg-warning text-navy' : 'bg-danger text-white') : 'bg-surface-2 text-muted')}>
                {haltHere ? (halted === 'returned' ? <RotateCcw size={11} /> : <X size={11} />) : done || isCurrent ? <Check size={11} /> : i + 1}
              </span>
              <span className={cn('truncate text-[11px] sm:text-xs font-medium', isCurrent || done ? 'text-ink' : 'text-muted', !isCurrent && 'max-sm:hidden')}>{haltHere ? ({ rejected: 'Rejected', returned: 'Returned', cancelled: 'Cancelled' })[halted] : step.label}</span>
            </div>
            <p className="mt-0.5 hidden sm:block truncate text-[11px] text-muted pl-6.5">
              {haltHere ? formatDateTime(order.cancelledAt || order.rejectedAt || order.returnedAt) : order[step.at] && (done || isCurrent) ? formatDateTime(order[step.at]) : ''}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
