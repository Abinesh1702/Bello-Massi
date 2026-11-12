import { cn } from '../../utils/helpers'
import { ORDER_STATUS_META } from '../../utils/constants'

// Status colours come from the theme tokens, so Light and Dark stay consistent.
const TONES = {
  neutral: 'bg-surface-3 text-ink-2 ring-line-strong/60',
  info: 'bg-info/10 text-info ring-info/20',
  success: 'bg-success/10 text-success ring-success/20',
  warning: 'bg-warning/10 text-warning ring-warning/25',
  danger: 'bg-danger/10 text-danger ring-danger/20',
  brand: 'bg-brand/8 text-brand ring-brand/15 dark:bg-brand/15',
  accent: 'bg-accent/15 text-accent-ink ring-accent/30',
}

export default function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11.5px] font-medium leading-4 ring-1 ring-inset whitespace-nowrap', TONES[tone] || TONES.neutral, className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const meta = ORDER_STATUS_META[status] || { label: status, tone: 'neutral' }
  return <Badge tone={meta.tone} dot>{meta.label}</Badge>
}
