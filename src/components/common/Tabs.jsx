import { useRef } from 'react'
import { cn } from '../../utils/helpers'

/** Keyboard-accessible tabs (arrow keys move between tabs). tabs: [{ id, label, icon }] */
export default function Tabs({ tabs, value, onChange, className, orientation = 'horizontal' }) {
  const refs = useRef({})
  const onKeyDown = (e, index) => {
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
    if (e.key !== prevKey && e.key !== nextKey) return
    e.preventDefault()
    const next = tabs[(index + (e.key === nextKey ? 1 : -1) + tabs.length) % tabs.length]
    onChange(next.id)
    refs.current[next.id]?.focus()
  }
  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={cn(orientation === 'vertical' ? 'flex lg:flex-col gap-1 overflow-x-auto scroll-thin' : 'flex gap-1 border-b border-line overflow-x-auto scroll-thin', className)}
    >
      {tabs.map((t, i) => {
        const active = t.id === value
        const Icon = t.icon
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[t.id] = el }}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={active}
            aria-controls={`panel-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors',
              orientation === 'vertical'
                ? cn('rounded-lg px-3 py-2 text-left', active ? 'bg-surface text-ink shadow-card border border-line' : 'text-muted hover:text-ink hover:bg-surface-2 border border-transparent')
                : cn('px-3 py-2.5 -mb-px border-b-2', active ? 'border-brand text-ink dark:border-accent' : 'border-transparent text-muted hover:text-ink hover:border-line-strong'),
            )}
          >
            {Icon && <Icon size={16} aria-hidden />}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
