import { FilePlus2, Pencil, Send, CheckCircle2, XCircle, RotateCcw, RefreshCw, Layers, Truck, Copy, MapPin, PackageCheck, AlertTriangle, Lock } from 'lucide-react'
import EmptyState from '../common/EmptyState'
import { formatDateTime } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const META = {
  DRAFT_CREATED: { icon: FilePlus2, tone: 'text-muted' },
  ORDER_UPDATED: { icon: Pencil, tone: 'text-muted' },
  SUBMITTED: { icon: Send, tone: 'text-info' },
  RESUBMITTED: { icon: RefreshCw, tone: 'text-info' },
  APPROVED: { icon: CheckCircle2, tone: 'text-success' },
  REJECTED: { icon: XCircle, tone: 'text-danger' },
  RETURNED: { icon: RotateCcw, tone: 'text-warning' },
  CONSOLIDATED: { icon: Layers, tone: 'text-brand' },
  READY_FOR_DISPATCH: { icon: Truck, tone: 'text-success' },
  DUPLICATED: { icon: Copy, tone: 'text-muted' },
  PLANNED: { icon: MapPin, tone: 'text-brand' },
  OUT_FOR_DELIVERY: { icon: Truck, tone: 'text-accent' },
  DELIVERED: { icon: PackageCheck, tone: 'text-success' },
  DELIVERY_PROBLEM: { icon: AlertTriangle, tone: 'text-danger' },
  ADDED_TO_DISPATCH: { icon: MapPin, tone: 'text-brand' },
  REMOVED_FROM_DISPATCH: { icon: RotateCcw, tone: 'text-muted' },
  DISPATCHED: { icon: Truck, tone: 'text-brand' },
  PARTIALLY_DELIVERED: { icon: PackageCheck, tone: 'text-warning' },
  DELIVERY_FAILED: { icon: AlertTriangle, tone: 'text-danger' },
  RETURNED_TO_HUB: { icon: RotateCcw, tone: 'text-muted' },
  REQUEUED_FOR_DISPATCH: { icon: RefreshCw, tone: 'text-info' },
  DISPATCH_CANCELLED: { icon: XCircle, tone: 'text-muted' },
}

/** Chronological (oldest → newest), append-only order history. */
export default function OrderTimeline({ events }) {
  if (!events.length) return <EmptyState compact title="No timeline events yet" />
  return (
    <>
      <ol className="relative space-y-5 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-line" aria-label="Order timeline">
        {events.map((e) => {
          const m = META[e.eventType] || META.ORDER_UPDATED
          const Icon = m.icon
          return (
            <li key={e.id} className="relative flex gap-3">
              <span className={cn('relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-surface', m.tone)}><Icon size={15} aria-hidden /></span>
              <div className="min-w-0 pt-1">
                <p className="text-sm font-medium text-ink">{e.title}</p>
                <p className="text-xs text-muted">{e.userName} · {formatDateTime(e.timestamp)}</p>
                {e.remarks && <p className="mt-1.5 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink">{e.remarks}</p>}
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><Lock size={12} /> Timeline entries are permanent and cannot be edited.</p>
    </>
  )
}
