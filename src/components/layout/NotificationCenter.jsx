import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { useClickOutside } from '../../hooks/useClickOutside'
import { getNotificationsForUser, getPreferences, markAllAsRead, markAsRead, markAsUnread } from '../../services/notificationService'
import { STORAGE_KEYS } from '../../utils/constants'
import { formatRelative } from '../../utils/formatters'
import { cn } from '../../utils/helpers'
import EmptyState from '../common/EmptyState'

const TYPE_ICON = {
  info: { icon: Info, cls: 'text-info bg-info/10' },
  success: { icon: CheckCircle2, cls: 'text-success bg-success/10' },
  warning: { icon: AlertTriangle, cls: 'text-warning bg-warning/10 dark:text-amber-300' },
  danger: { icon: XCircle, cls: 'text-danger bg-danger/10' },
}

export default function NotificationCenter() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const all = useStoredValue(STORAGE_KEYS.NOTIFICATIONS, [])
  const prefsStore = useStoredValue(STORAGE_KEYS.NOTIFICATION_PREFS, {})
  const prefs = useMemo(() => getPreferences(user.id, prefsStore), [user.id, prefsStore])
  const items = useMemo(() => getNotificationsForUser(user, all, { prefs }), [user, all, prefs])
  // Pop-up for notifications that arrive while signed in (preference: showToasts).
  const seen = useRef(null)
  useEffect(() => {
    const ids = new Set(items.map((n) => n.id))
    if (seen.current && prefs.showToasts !== false) {
      items.filter((n) => !n.read && !seen.current.has(n.id)).slice(0, 3).forEach((n) => toast.info(n.title, { description: n.message }))
    }
    seen.current = ids
  }, [items, prefs.showToasts])
  const unread = items.filter((n) => !n.read).length
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false), open)

  const shown = filter === 'unread' ? items.filter((n) => !n.read) : items

  const openItem = (n) => {
    markAsRead(n.id, user.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-ink hover:bg-surface-2"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-navy text-center ring-2 ring-surface tabular">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Notifications" className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 z-50 sm:w-96 rounded-xl border border-line bg-surface shadow-pop animate-fade-in">
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
            <div>
              <h2 className="text-sm font-semibold text-ink">Notifications</h2>
              <p className="text-xs text-muted">{unread ? `${unread} unread` : 'You are all caught up'}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                markAllAsRead(user, items.map((n) => n.id))
                toast.success('All notifications marked as read')
              }}
              disabled={!unread}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          </div>
          <div className="flex gap-1 px-4 pb-2" role="group" aria-label="Filter notifications">
            {['all', 'unread'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn('rounded-full px-2.5 py-1 text-xs font-medium capitalize', filter === f ? 'bg-navy text-white dark:bg-accent dark:text-navy' : 'text-muted hover:bg-surface-2')}
              >
                {f}
              </button>
            ))}
          </div>
          <ul className="max-h-[55vh] sm:max-h-96 overflow-y-auto scroll-thin border-t border-line">
            {shown.length === 0 && (
              <li><EmptyState compact icon={Bell} title="No unread notifications" description="New workflow alerts will appear here." /></li>
            )}
            {shown.map((n) => {
              const meta = TYPE_ICON[n.type] || TYPE_ICON.info
              const Icon = meta.icon
              return (
                <li key={n.id} className={cn('group relative flex gap-3 px-4 py-3 border-b border-line last:border-0', !n.read && 'bg-surface-2/70')}>
                  <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full', meta.cls)}>
                    <Icon size={15} aria-hidden />
                  </span>
                  <button type="button" onClick={() => openItem(n)} className="min-w-0 flex-1 text-left">
                    <span className={cn('block text-sm text-ink', !n.read && 'font-semibold')}>{n.title}</span>
                    <span className="block text-xs text-muted mt-0.5 line-clamp-2">{n.message}</span>
                    <span className="block text-[11px] text-muted mt-1">{formatRelative(n.createdAt)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => (n.read ? markAsUnread(n.id, user.id) : markAsRead(n.id, user.id))}
                    className="self-start rounded p-1 text-muted hover:text-ink hover:bg-surface"
                    title={n.read ? 'Mark as unread' : 'Mark as read'}
                    aria-label={n.read ? `Mark “${n.title}” as unread` : `Mark “${n.title}” as read`}
                  >
                    {n.read ? <Circle size={12} /> : <span className="block h-2.5 w-2.5 rounded-full bg-accent" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-line px-4 py-2.5 text-center">
            <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs font-medium text-brand hover:underline">Open notification center</Link>
          </div>
        </div>
      )}
    </div>
  )
}
