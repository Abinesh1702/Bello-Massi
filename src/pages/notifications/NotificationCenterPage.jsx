import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Circle, Settings2, History, Archive, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Tabs from '../../components/common/Tabs'
import Toggle from '../../components/common/Toggle'
import EmptyState from '../../components/common/EmptyState'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import { useAuth } from '../../hooks/useAuth'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { useTableQuery } from '../../hooks/useTableQuery'
import {
  NOTIFICATION_CATEGORIES, dismissNotification, getCategoryLabel, getNotificationsForUser, getPreferences, markAllAsRead, markAsRead, markAsUnread, savePreferences,
} from '../../services/notificationService'
import { getNotificationConfig } from '../../config/runtimeConfig'
import { STORAGE_KEYS } from '../../utils/constants'
import { formatDateTime, formatRelative } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const TYPE_ICON = {
  info: { icon: Info, cls: 'text-info bg-info/10' },
  success: { icon: CheckCircle2, cls: 'text-success bg-success/10' },
  warning: { icon: AlertTriangle, cls: 'text-warning bg-warning/10 dark:text-amber-300' },
  danger: { icon: XCircle, cls: 'text-danger bg-danger/10' },
}
const PAGE = 20

/** Notification Center: list, read / unread, mark all read, categories, filters, preferences and history. */
export default function NotificationCenterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const all = useStoredValue(STORAGE_KEYS.NOTIFICATIONS, [])
  const prefsStore = useStoredValue(STORAGE_KEYS.NOTIFICATION_PREFS, {})
  const prefs = getPreferences(user.id, prefsStore)
  const t = useTableQuery({ filters: ['tab', 'category', 'type', 'state'] })
  const tab = t.filters.tab || 'inbox'
  const [limit, setLimit] = useState(PAGE)
  const allowMuting = getNotificationConfig().allowUserMuting !== false

  const inbox = useMemo(() => getNotificationsForUser(user, all, { prefs }), [user, all, prefs])
  const history = useMemo(() => getNotificationsForUser(user, all, { includeMuted: true, prefs }), [user, all, prefs])
  const source = tab === 'history' ? history : inbox
  const rows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    return source.filter((n) => (!q || [n.title, n.message].some((v) => String(v || '').toLowerCase().includes(q)))
      && (!t.filters.category || n.category === t.filters.category)
      && (!t.filters.type || n.type === t.filters.type)
      && (!t.filters.state || (t.filters.state === 'unread' ? !n.read : n.read)))
  }, [source, t.q, t.filters])
  const unread = inbox.filter((n) => !n.read).length
  const counts = useMemo(() => Object.fromEntries(NOTIFICATION_CATEGORIES.map((c) => [c.id, inbox.filter((n) => n.category === c.id && !n.read).length])), [inbox])

  const open = (n) => { markAsRead(n.id, user.id); if (n.link) navigate(n.link) }
  const toggleMute = (cat, muted) => {
    const set = new Set(prefs.mutedCategories)
    if (muted) set.add(cat)
    else set.delete(cat)
    savePreferences(user.id, { mutedCategories: [...set] })
    toast.success(muted ? `${getCategoryLabel(cat)} muted` : `${getCategoryLabel(cat)} unmuted`)
  }

  return (
    <>
      <PageHeader title="Notification Center" description="Workflow alerts for your roles. Muted categories stay in History."
        actions={tab !== 'preferences' && <Button variant="secondary" icon={CheckCheck} disabled={!unread} onClick={() => { markAllAsRead(user, inbox.map((n) => n.id)); toast.success('All notifications marked as read') }}>Mark all read</Button>} />
      <Tabs className="mb-4" value={tab} onChange={(id) => { t.setFilter('tab', id === 'inbox' ? '' : id); setLimit(PAGE) }}
        tabs={[{ id: 'inbox', label: `Inbox${unread ? ` (${unread})` : ''}`, icon: Bell }, { id: 'history', label: 'History', icon: History }, { id: 'preferences', label: 'Preferences', icon: Settings2 }]} />

      {tab === 'preferences' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Categories" subtitle={allowMuting ? 'Muted categories are hidden from the bell and inbox but kept in History.' : 'Muting is switched off by your administrator.'} icon={Settings2} />
            <ul className="divide-y divide-line">
              {NOTIFICATION_CATEGORIES.map((c) => {
                const orgOff = (getNotificationConfig().disabledCategories || []).includes(c.id)
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-sm text-ink">{c.label}{orgOff && <span className="ml-2 text-xs text-muted">(switched off for the organisation)</span>}</span>
                    <Toggle checked={!prefs.mutedCategories.includes(c.id)} disabled={!allowMuting || orgOff} onChange={(on) => toggleMute(c.id, !on)} label={<span className="sr-only">Show {c.label}</span>} />
                  </li>
                )
              })}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Delivery" icon={Bell} />
            <Toggle checked={prefs.showToasts !== false} onChange={(on) => { savePreferences(user.id, { showToasts: on }); toast.success('Preference saved') }} label="Show a pop-up when a new notification arrives" description="Applies while you are signed in on this browser." />
            <p className="mt-4 text-xs text-muted">Email and WhatsApp alerts are configured as automation rules by an administrator (Communication › Automated Notifications). In-app notifications live in this browser only.</p>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
          <Card className="min-w-0">
            <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search notifications…" total={source.length} filteredCount={rows.length} activeCount={['category', 'type', 'state'].filter((k) => t.filters[k]).length + (t.q ? 1 : 0)} onReset={() => { t.reset(); if (tab !== 'inbox') t.setFilter('tab', tab) }}>
              <FilterSelect label="Category" allLabel="All categories" value={t.filters.category} onChange={(v) => t.setFilter('category', v)} options={NOTIFICATION_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
              <FilterSelect label="Type" allLabel="All types" value={t.filters.type} onChange={(v) => t.setFilter('type', v)} options={[{ value: 'info', label: 'Info' }, { value: 'success', label: 'Success' }, { value: 'warning', label: 'Warning' }, { value: 'danger', label: 'Critical' }]} />
              <FilterSelect label="Read state" allLabel="Read & unread" value={t.filters.state} onChange={(v) => t.setFilter('state', v)} options={[{ value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }]} />
            </FilterToolbar>
            {rows.length === 0 ? <EmptyState icon={Bell} title="No notifications" description="Nothing matches these filters." /> : (
              <ul className="-mx-5 border-t border-line">
                {rows.slice(0, limit).map((n) => {
                  const meta = TYPE_ICON[n.type] || TYPE_ICON.info
                  const Icon = meta.icon
                  return (
                    <li key={n.id} className={cn('flex gap-3 border-b border-line px-5 py-3.5', !n.read && 'bg-surface-2/70')} data-testid="notification-row">
                      <span className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full', meta.cls)}><Icon size={16} aria-hidden /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={cn('text-sm text-ink', !n.read && 'font-semibold')}>{n.title}</p>
                          <Badge tone="neutral">{getCategoryLabel(n.category)}</Badge>
                          {tab === 'history' && n.dismissed && <Badge tone="neutral">Archived</Badge>}
                          {tab === 'history' && prefs.mutedCategories.includes(n.category) && <Badge tone="neutral">Muted</Badge>}
                        </div>
                        <p className="mt-0.5 text-sm text-muted">{n.message}</p>
                        <p className="mt-1 text-xs text-muted" title={formatDateTime(n.createdAt)}>{formatRelative(n.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 items-start gap-1">
                        {n.link && <Button size="xs" variant="ghost" icon={ExternalLink} onClick={() => open(n)}>Open</Button>}
                        <button type="button" onClick={() => (n.read ? markAsUnread(n.id, user.id) : markAsRead(n.id, user.id))} className="rounded p-1.5 text-muted hover:bg-surface hover:text-ink" aria-label={n.read ? `Mark “${n.title}” as unread` : `Mark “${n.title}” as read`} title={n.read ? 'Mark as unread' : 'Mark as read'}>
                          {n.read ? <Circle size={13} /> : <span className="block h-2.5 w-2.5 rounded-full bg-accent" />}
                        </button>
                        {tab === 'inbox' && <button type="button" onClick={() => { dismissNotification(n.id, user.id); toast.success('Archived — still available in History') }} className="rounded p-1.5 text-muted hover:bg-surface hover:text-ink" aria-label={`Archive “${n.title}”`} title="Archive"><Archive size={14} /></button>}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {rows.length > limit && <div className="pt-4 text-center"><Button variant="secondary" size="sm" onClick={() => setLimit((l) => l + PAGE)}>Show more ({rows.length - limit} left)</Button></div>}
          </Card>
          <Card>
            <CardHeader title="Categories" subtitle="Unread in your inbox" />
            <ul className="space-y-1">
              {NOTIFICATION_CATEGORIES.filter((c) => counts[c.id] || inbox.some((n) => n.category === c.id)).map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => t.setFilter('category', t.filters.category === c.id ? '' : c.id)} className={cn('flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm hover:bg-surface-2', t.filters.category === c.id && 'bg-surface-2 font-medium')}>
                    <span className="text-ink">{c.label}</span>{counts[c.id] > 0 ? <Badge tone="accent">{counts[c.id]}</Badge> : <span className="text-xs text-muted">0</span>}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </>
  )
}
