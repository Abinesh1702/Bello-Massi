import { Link } from 'react-router-dom'
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../utils/helpers'
import { compareValues } from '../../utils/dashboardFilter'
import { formatNumber } from '../../utils/formatters'

const TONES = {
  brand: 'bg-brand/8 text-brand dark:bg-brand/15',
  accent: 'bg-accent/15 text-accent-ink',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  neutral: 'bg-surface-3 text-ink-2',
}

/**
 * Comparison line for a KPI: percentage change, absolute difference, direction and the previous value.
 * compare: { previous: number, current?: number, format?: fn, invert?: bool (lower is better) } — shown only when valid.
 */
export function CompareLine({ compare, value }) {
  if (!compare || compare.previous === null || compare.previous === undefined) return null
  const c = compareValues(compare.current ?? value, compare.previous)
  if (!c) return null
  const fmt = compare.format || formatNumber
  const good = compare.invert ? c.dir === 'down' : c.dir === 'up'
  const Icon = c.dir === 'up' ? TrendingUp : c.dir === 'down' ? TrendingDown : Minus
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted tabular" data-testid="kpi-compare">
      <span className={cn('inline-flex items-center gap-0.5 rounded px-1 py-px font-semibold', c.dir === 'flat' ? 'bg-surface-3 text-ink-2' : good ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
        <Icon size={11} aria-hidden />{c.pct === null ? (c.diff ? 'new' : '0%') : `${c.pct > 0 ? '+' : ''}${c.pct.toFixed(1)}%`}
      </span>
      <span>{c.diff > 0 ? '+' : c.diff < 0 ? '−' : '±'}{fmt(Math.abs(c.diff))} vs {fmt(c.previous)}</span>
    </p>
  )
}

/** KPI tile. When `to` is set the whole card links to the related module. `live` marks a current snapshot (not date-filtered). */
export default function StatCard({ label, value, icon: Icon, hint, tone = 'brand', to, footer, compare, live = false }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-snug text-muted">
          {label}
          {live && <span className="ml-1.5 inline-flex translate-y-[-1px] items-center rounded-full border border-line px-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted" title="Current position — not affected by the period filter">Current</span>}
        </p>
        {Icon && (
          <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', TONES[tone] || TONES.brand)}>
            <Icon size={16} aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-1.5 text-kpi text-ink truncate">{value}</p>
      <CompareLine compare={compare} value={typeof value === 'number' ? value : undefined} />
      {(hint || to) && (
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
          <span className="truncate">{hint}</span>
          {to && <ArrowUpRight size={14} className="shrink-0 text-muted/60 transition-colors group-hover:text-brand group-focus-visible:text-brand" aria-hidden />}
        </div>
      )}
      {footer}
    </>
  )
  const cls = 'group block min-w-0 rounded-xl border border-line bg-surface p-4 shadow-card transition-[border-color,box-shadow] duration-150'
  if (to) {
    return (
      <Link to={to} className={cn(cls, 'hover:border-line-strong hover:shadow-pop focus-visible:border-brand')} aria-label={`${label}: ${value}. Open module`}>
        {body}
      </Link>
    )
  }
  return <div className={cls}>{body}</div>
}

export function StatGrid({ children, cols = 4 }) {
  const map = { 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-3 xl:grid-cols-5', 6: 'lg:grid-cols-3 2xl:grid-cols-6' }
  return <div className={cn('grid grid-cols-2 gap-3 sm:gap-4', map[cols])}>{children}</div>
}
