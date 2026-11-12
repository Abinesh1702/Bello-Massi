import { cn } from '../../utils/helpers'

export default function Card({ className, children, padded = true, as: Tag = 'section', ...rest }) {
  return (
    <Tag className={cn('min-w-0 rounded-xl border border-line bg-surface shadow-card', padded && 'p-5', className)} {...rest}>
      {children}
    </Tag>
  )
}

export function CardHeader({ title, subtitle, action, icon: Icon, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon && (
          <span className="mt-px grid h-7 w-7 shrink-0 place-items-center rounded-md bg-surface-3 text-ink-2">
            <Icon size={15} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-section-title leading-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
