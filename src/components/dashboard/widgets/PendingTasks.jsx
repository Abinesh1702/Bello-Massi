import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import Card, { CardHeader } from '../../common/Card'
import Badge from '../../common/Badge'
import EmptyState from '../../common/EmptyState'

/** tasks: [{ label, description, count, to, tone }] — only tasks with a count are shown. */
export default function PendingTasks({ tasks, title = 'Pending tasks' }) {
  const open = tasks.filter((t) => t.count > 0)
  return (
    <Card>
      <CardHeader title={title} subtitle={open.length ? `${open.reduce((s, t) => s + t.count, 0)} items need attention` : undefined} />
      {!open.length ? (
        <EmptyState compact icon={CheckCircle2} title="All caught up" description="No pending work in your queue." />
      ) : (
        <ul className="divide-y divide-line -my-1">
          {open.map((t) => (
            <li key={t.label}>
              <Link to={t.to} className="group flex items-center gap-3 py-2.5 rounded-md hover:bg-surface-2 -mx-2 px-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{t.label}</p>
                  {t.description && <p className="text-xs text-muted truncate">{t.description}</p>}
                </div>
                <Badge tone={t.tone || 'warning'}>{t.count}</Badge>
                <ChevronRight size={15} className="text-muted group-hover:translate-x-0.5 transition-transform" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
