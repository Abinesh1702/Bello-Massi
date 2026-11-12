import {
  FilePlus2, Route, UserRoundCheck, Truck, ListOrdered, PackageCheck, PlayCircle, Navigation, KeyRound, CheckCircle2, AlertTriangle,
  FileText, ClipboardCheck, Undo2, Flag, XCircle, RotateCcw, Pencil, PackageMinus,
} from 'lucide-react'
import EmptyState from '../common/EmptyState'
import { formatDateTime } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const META = {
  DISPATCH_CREATED: { icon: FilePlus2, tone: 'text-muted' },
  DISPATCH_PLANNED: { icon: Route, tone: 'text-info' },
  DISPATCH_UPDATED: { icon: Pencil, tone: 'text-muted' },
  DRIVER_ASSIGNED: { icon: UserRoundCheck, tone: 'text-brand' },
  VEHICLE_ASSIGNED: { icon: Truck, tone: 'text-brand' },
  SEQUENCE_UPDATED: { icon: ListOrdered, tone: 'text-muted' },
  DISPATCH_CONFIRMED: { icon: PackageMinus, tone: 'text-accent' },
  DISPATCH_STARTED: { icon: PlayCircle, tone: 'text-info' },
  DELIVERY_STARTED: { icon: Navigation, tone: 'text-info' },
  DRIVER_ARRIVED: { icon: Navigation, tone: 'text-accent' },
  OTP_GENERATED: { icon: KeyRound, tone: 'text-muted' },
  DELIVERY_COMPLETED: { icon: CheckCircle2, tone: 'text-success' },
  PARTIAL_DELIVERY: { icon: PackageCheck, tone: 'text-warning' },
  DELIVERY_FAILED: { icon: AlertTriangle, tone: 'text-danger' },
  DELIVERY_NOTE_GENERATED: { icon: FileText, tone: 'text-success' },
  DELIVERY_REVIEWED: { icon: ClipboardCheck, tone: 'text-brand' },
  STOCK_RETURNED: { icon: Undo2, tone: 'text-info' },
  DISPATCH_COMPLETED: { icon: Flag, tone: 'text-success' },
  DISPATCH_CANCELLED: { icon: XCircle, tone: 'text-danger' },
  STOCK_REVERSED: { icon: RotateCcw, tone: 'text-info' },
}

/** Chronological, append-only dispatch / delivery history. */
export default function DispatchTimeline({ events, empty = 'No dispatch events yet' }) {
  if (!events.length) return <EmptyState compact title={empty} />
  return (
    <ol className="relative space-y-5 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-line" aria-label="Dispatch timeline">
      {events.map((e) => {
        const m = META[e.eventType] || META.DISPATCH_UPDATED
        const Icon = m.icon
        return (
          <li key={e.id} className="relative flex gap-3">
            <span className={cn('relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-surface', m.tone)}><Icon size={14} aria-hidden /></span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium text-ink leading-snug">{e.title}</p>
              {e.description && <p className="text-xs text-muted mt-0.5 break-words">{e.description}</p>}
              {e.remarks && <p className="mt-1 rounded-md bg-surface-2 px-2 py-1 text-xs text-ink break-words">“{e.remarks}”</p>}
              <p className="text-[11px] text-muted mt-1">{formatDateTime(e.timestamp)} · {e.userName}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
