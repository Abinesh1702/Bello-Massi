import { Inbox } from 'lucide-react'
import { cn } from '../../utils/helpers'

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action, className, compact }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-6' : 'py-12', className)}>
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface-2 text-muted">
        <Icon size={19} aria-hidden />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="text-sm text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
