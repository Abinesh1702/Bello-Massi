import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Card, { CardHeader } from '../common/Card'
import { cn } from '../../utils/helpers'

/** Single quick action. Provide `to` (navigation) or `onClick`. */
export default function QuickAction({ icon: Icon, label, description, to, onClick, accent }) {
  const cls = cn(
    'group flex w-full items-center gap-3 rounded-lg border border-line p-3 text-left transition-colors hover:border-brand/30 hover:bg-surface-2',
  )
  const inner = (
    <>
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', accent ? 'bg-accent text-navy' : 'bg-surface-2 text-brand group-hover:bg-surface')}>
        <Icon size={17} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block truncate text-xs text-muted">{description}</span>}
      </span>
      <ChevronRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
    </>
  )
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>
}

export function QuickActions({ title = 'Quick actions', actions }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="grid gap-2">
        {actions.map((a) => <QuickAction key={a.label} {...a} />)}
      </div>
    </Card>
  )
}
