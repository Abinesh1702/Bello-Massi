import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'
import storage from '../../services/storageService'
import StatCard from '../dashboard/StatCard'
import EmptyState from '../common/EmptyState'
import { cn } from '../../utils/helpers'

/** Re-render when any stored collection changes (dashboards compute from many collections). */
export const useStoreTick = () => {
  const [tick, setTick] = useState(0)
  useEffect(() => storage.subscribe(() => setTick((t) => t + 1)), [])
  return tick
}

/** KPI tiles. Each tile with `to` links to the records behind the number. */
export function KpiGrid({ items, cols = 4 }) {
  return (
    <div className={cn('mb-5 grid grid-cols-2 gap-3', cols === 3 ? 'lg:grid-cols-3' : cols === 6 ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-4')} data-testid="kpi-grid">
      {items.filter(Boolean).map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon || Layers} tone={k.tone || 'brand'} hint={k.hint} to={k.to} live />)}
    </div>
  )
}

/** Small read-only table. columns: [{ key, header, render?, align? }]; rows link with `to` when given. */
export function SimpleTable({ columns, rows, empty = 'Nothing to show.', rowTo, caption, max }) {
  const list = max ? rows.slice(0, max) : rows
  if (!rows.length) return <EmptyState compact title={empty} />
  return (
    <div className="-mx-1 overflow-x-auto scroll-thin">
      <table className="w-full min-w-[480px] text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
            {columns.map((c) => <th key={c.key} scope="col" className={cn('px-1 py-2', c.align === 'right' && 'text-right')}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {list.map((r, i) => (
            <tr key={r.id || i} className={cn(rowTo && 'hover:bg-surface-2')}>
              {columns.map((c, ci) => {
                const v = c.render ? c.render(r) : r[c.key]
                const to = rowTo ? rowTo(r) : null
                return (
                  <td key={c.key} className={cn('px-1 py-2 text-ink-2', c.align === 'right' && 'text-right tabular')}>
                    {to && ci === 0 ? <Link to={to} className="font-medium text-brand hover:underline">{v}</Link> : v}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {max && rows.length > max && <p className="mt-2 px-1 text-xs text-muted">Showing {max} of {rows.length}.</p>}
    </div>
  )
}

