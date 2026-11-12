import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowUpRight, CheckCheck, Eye, RotateCcw } from 'lucide-react'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { InsightStatusBadge, SeverityBadge, SourcesNote } from './AiBadges'
import { setInsightStatus } from '../../services/ai/insightService'
import { INSIGHT_STATUS } from '../../config/aiConfig'
import { formatDateTime, formatRelative } from '../../utils/formatters'

export default function InsightCard({ insight: i, canManage, compact = false }) {
  const set = (status) => { const r = setInsightStatus(i.id, status); if (!r.ok) toast.error(r.error); else toast.success(`Marked ${status.toLowerCase()}`) }
  return (
    <article className="rounded-xl border border-line bg-surface p-4 shadow-card" data-testid="insight-card">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={i.severity} />
        <InsightStatusBadge status={i.status} />
        <Badge tone="neutral">{i.typeLabel}</Badge>
        {i.demo && <Badge tone="accent">Uses demo baseline</Badge>}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-ink">{i.title}</h3>
      <p className="mt-1 text-sm text-muted">{i.description}</p>
      {!compact && i.data?.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{i.data.map((x) => <div key={x.label} className="rounded-lg bg-surface-2 px-2.5 py-1.5"><dt className="truncate text-[11px] text-muted">{x.label}</dt><dd className="truncate text-sm font-medium tabular text-ink">{x.value}</dd></div>)}</dl>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {i.entity?.path && <Link to={i.entity.path} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">{i.entity.label} <ArrowUpRight size={12} /></Link>}
        {i.action?.path && <Button size="xs" variant="secondary" to={i.action.path}>{i.action.label}</Button>}
        <span className="flex-1" />
        {canManage && i.status === INSIGHT_STATUS.NEW && <Button size="xs" variant="ghost" icon={Eye} onClick={() => set(INSIGHT_STATUS.REVIEWED)}>Mark reviewed</Button>}
        {canManage && i.status !== INSIGHT_STATUS.RESOLVED && <Button size="xs" variant="ghost" icon={CheckCheck} onClick={() => set(INSIGHT_STATUS.RESOLVED)}>Resolve</Button>}
        {canManage && i.status === INSIGHT_STATUS.RESOLVED && <Button size="xs" variant="ghost" icon={RotateCcw} onClick={() => set(INSIGHT_STATUS.NEW)}>Reopen</Button>}
      </div>
      {!compact && (
        <div className="mt-2 space-y-1">
          <SourcesNote sources={i.sources} />
          <p className="text-[11px] text-muted" title={formatDateTime(i.generatedAt)}>Generated {formatRelative(i.generatedAt)}{i.statusByName ? ` · ${i.status.toLowerCase()} by ${i.statusByName}` : i.statusBy === 'system' ? ' · auto-resolved (condition gone)' : ''}</p>
        </div>
      )}
    </article>
  )
}

