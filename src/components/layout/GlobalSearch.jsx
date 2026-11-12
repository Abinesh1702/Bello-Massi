import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { searchApp } from '../../services/searchService'
import { getNavigationForRole } from '../../config/navigation'
import { markAllAsRead } from '../../services/notificationService'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { useClickOutside } from '../../hooks/useClickOutside'
import { useSignOut } from '../../hooks/useSignOut'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../utils/constants'
import { cn } from '../../utils/helpers'

/** Searches pages, modules and quick actions available to the signed-in role. */
export default function GlobalSearch({ autoFocus = false, onDone, className }) {
  const { user } = useAuth()
  const { toggleTheme } = useTheme()
  const signOut = useSignOut()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const listId = useId()

  const suggestions = useMemo(
    () =>
      getNavigationForRole(user)
        .flatMap((g) => g.children || [g])
        .slice(0, 6)
        .map((i) => ({ id: i.id, kind: 'Page', label: i.label, hint: 'Suggested', icon: i.icon, path: i.path, action: 'navigate' })),
    [user],
  )
  const customers = useStoredValue(STORAGE_KEYS.CUSTOMERS, null)
  const products = useStoredValue(STORAGE_KEYS.PRODUCTS, null)
  const hubs = useStoredValue(STORAGE_KEYS.HUBS, null)
  const orders = useStoredValue(STORAGE_KEYS.ORDERS, null)
  const dispatches = useStoredValue(STORAGE_KEYS.DISPATCHES, null)
  const notes = useStoredValue(STORAGE_KEYS.DELIVERY_NOTES, null)
  const scrap = useStoredValue(STORAGE_KEYS.SCRAP_REQUESTS, null)
  const calls = useStoredValue(STORAGE_KEYS.CALL_HISTORY, null)
  const drivers = useStoredValue(STORAGE_KEYS.DRIVERS, null)
  const vehicles = useStoredValue(STORAGE_KEYS.VEHICLES, null)
  const deliveries = useStoredValue(STORAGE_KEYS.DELIVERIES, null)
  const results = useMemo(
    () => (query.trim() ? searchApp(query, user, 8, { customers, products, hubs, orders, dispatches, notes, scrap, calls, drivers, vehicles, deliveries, user }) : suggestions),
    [query, customers, products, hubs, orders, dispatches, notes, scrap, calls, drivers, vehicles, deliveries, user, suggestions],
  )

  const close = useCallback(() => {
    setOpen(false)
    setActive(0)
  }, [])
  useClickOutside(wrapRef, close, open)

  // Ctrl/Cmd + K focuses search (desktop instance only)
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
      return undefined
    }
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (!inputRef.current || inputRef.current.offsetParent === null) return
        e.preventDefault()
        inputRef.current.focus()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [autoFocus])

  const run = (result) => {
    if (!result) return
    switch (result.action) {
      case 'navigate':
        navigate(result.path)
        break
      case 'toggleTheme':
        toggleTheme()
        toast.success('Theme updated')
        break
      case 'markAllRead':
        markAllAsRead(user)
        toast.success('All notifications marked as read')
        break
      case 'logout':
        signOut()
        break
      default:
        break
    }
    setQuery('')
    close()
    inputRef.current?.blur()
    onDone?.()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[active])
    } else if (e.key === 'Escape') {
      close()
      inputRef.current?.blur()
      onDone?.()
    }
  }

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
        aria-label="Search pages, actions, customers, products and hubs"
        placeholder="Search pages, customers, products…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-14 text-sm text-ink placeholder:text-muted/80 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-[var(--ring)] focus:border-brand"
      />
      <kbd className="hidden md:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center rounded border border-line bg-surface px-1.5 text-[10px] font-medium text-muted pointer-events-none">
        Ctrl K
      </kbd>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-line bg-surface shadow-pop overflow-hidden animate-fade-in">
          {results.length ? (
            <ul id={listId} role="listbox" className="max-h-80 overflow-y-auto scroll-thin py-1.5">
              {!query.trim() && <li className="px-3 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Your modules</li>}
              {results.map((r, i) => {
                const Icon = r.icon || Zap
                return (
                  <li
                    key={r.id}
                    id={`${listId}-${r.id}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => run(r)}
                    className={cn('mx-1.5 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2', i === active && 'bg-surface-2')}
                  >
                    <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-md', r.kind === 'Action' ? 'bg-[#FEF3DC] text-[#8A5A00] dark:bg-amber-400/15 dark:text-amber-200' : 'bg-surface-2 text-brand')}>
                      <Icon size={16} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{r.label}</span>
                      <span className="block truncate text-xs text-muted">{r.kind} · {r.hint}</span>
                    </span>
                    {i === active && <CornerDownLeft size={14} className="text-muted" aria-hidden />}
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-ink">No matches for “{query}”</p>
              <p className="text-xs text-muted mt-1">Search covers pages, actions, customers, products and hubs available to your role.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
