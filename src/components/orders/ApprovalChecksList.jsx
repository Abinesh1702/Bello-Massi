import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '../../utils/helpers'

/** Approval checks: green = OK, amber = warning (needs acknowledgement), red = blocks approval. */
export default function ApprovalChecksList({ checks }) {
  return (
    <ul className="space-y-2.5">
      {checks.map((c) => {
        const Icon = c.ok ? CheckCircle2 : c.severity === 'block' ? XCircle : AlertTriangle
        return (
          <li key={c.key} className={cn('flex gap-3 rounded-lg border p-3', c.ok ? 'border-line' : c.severity === 'block' ? 'border-danger/40 bg-danger/5' : 'border-warning/50 bg-warning/5')}>
            <Icon size={18} className={cn('shrink-0 mt-0.5', c.ok ? 'text-success' : c.severity === 'block' ? 'text-danger' : 'text-warning')} aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{c.label} <span className="sr-only">{c.ok ? 'passed' : c.severity === 'block' ? 'failed' : 'warning'}</span></p>
              <p className="text-xs text-muted mt-0.5">{c.detail}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
