import { useState } from 'react'
import { ArrowDown, ArrowUp, GripVertical, Lock } from 'lucide-react'
import { cn } from '../../utils/helpers'

/**
 * Delivery sequence with drag & drop and move up / down buttons (keyboard friendly).
 * stops: [{ id, title, subtitle, aside, locked, lockReason }] in the current order.
 * Locked stops (started or finished) keep their position; onChange receives the new id order.
 */
export default function SequenceEditor({ stops, onChange, disabled = false, emptyText = 'No stops yet.' }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  const keepsLocks = (next) => next.every((id, i) => !stops.find((s) => s.id === id)?.locked || stops[i]?.id === id)
  const apply = (next) => { if (keepsLocks(next)) onChange(next.map((x) => x)) }
  const ids = stops.map((s) => s.id)

  const move = (from, to) => {
    if (disabled || to < 0 || to >= stops.length || from === to) return
    if (stops[from].locked || stops[to].locked) return
    const next = [...ids]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    apply(next)
  }

  if (!stops.length) return <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{emptyText}</p>

  return (
    <ol className="space-y-2" aria-label="Delivery sequence">
      {stops.map((s, i) => {
        const canUp = !disabled && !s.locked && i > 0 && !stops[i - 1].locked
        const canDown = !disabled && !s.locked && i < stops.length - 1 && !stops[i + 1].locked
        return (
          <li
            key={s.id}
            draggable={!disabled && !s.locked}
            onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', s.id) }}
            onDragOver={(e) => { if (dragIndex !== null && !s.locked) { e.preventDefault(); setOverIndex(i) } }}
            onDragLeave={() => setOverIndex((v) => (v === i ? null : v))}
            onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) move(dragIndex, i); setDragIndex(null); setOverIndex(null) }}
            onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
            data-testid={`stop-${i + 1}`}
            className={cn(
              'flex items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 transition-shadow',
              overIndex === i && dragIndex !== i ? 'border-accent ring-2 ring-accent/30' : 'border-line',
              dragIndex === i && 'opacity-60',
              s.locked && 'bg-surface-2/60',
            )}
          >
            <span className={cn('hidden sm:grid h-8 w-6 place-items-center text-muted', !s.locked && !disabled && 'cursor-grab active:cursor-grabbing')} aria-hidden>
              {s.locked ? <Lock size={14} /> : <GripVertical size={16} />}
            </span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-white text-sm font-semibold tabular dark:bg-[#4453a8]" aria-label={`Stop ${i + 1}`}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{s.title}</p>
              {s.subtitle && <p className="truncate text-xs text-muted">{s.subtitle}</p>}
              {s.locked && s.lockReason && <p className="text-[11px] text-muted mt-0.5">{s.lockReason}</p>}
            </div>
            {s.aside && <div className="hidden md:flex shrink-0 items-center gap-1.5">{s.aside}</div>}
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={() => move(i, i - 1)} disabled={!canUp} aria-label={`Move ${s.title} up`} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink hover:bg-surface-2 disabled:opacity-30 disabled:pointer-events-none"><ArrowUp size={15} /></button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={!canDown} aria-label={`Move ${s.title} down`} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink hover:bg-surface-2 disabled:opacity-30 disabled:pointer-events-none"><ArrowDown size={15} /></button>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
