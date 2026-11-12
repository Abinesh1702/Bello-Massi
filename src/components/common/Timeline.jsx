import { History } from 'lucide-react'
import EmptyState from './EmptyState'
import { formatDateTime, formatRelative } from '../../utils/formatters'

/** Vertical timeline. items: [{ id, title, description?, at, icon?, tone? }] newest first. */
export default function Timeline({ items, empty = 'No activity yet.' }) {
  if (!items.length) return <EmptyState compact icon={History} title={empty} />
  return (
    <ol className="relative space-y-4 before:absolute before:left-[13px] before:top-1 before:bottom-1 before:w-px before:bg-line">
      {items.map((it) => {
        const Icon = it.icon || History
        return (
          <li key={it.id} className="relative flex gap-3">
            <span className="relative z-[1] grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted"><Icon size={13} aria-hidden /></span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm text-ink leading-snug">{it.title}</p>
              {it.description && <p className="text-xs text-muted mt-0.5">{it.description}</p>}
              <p className="text-[11px] text-muted mt-0.5" title={formatDateTime(it.at)}>{formatRelative(it.at)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
