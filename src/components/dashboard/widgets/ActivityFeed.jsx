import { Activity } from 'lucide-react'
import Card, { CardHeader } from '../../common/Card'
import EmptyState from '../../common/EmptyState'
import Avatar from '../../common/Avatar'
import { formatRelative } from '../../../utils/formatters'

export default function ActivityFeed({ activities, users = [], limit = 8, title = 'Recent activity' }) {
  const colors = Object.fromEntries(users.map((u) => [u.id, { color: u.avatarColor, image: u.avatarImage }]))
  const items = activities.slice(0, limit)
  return (
    <Card>
      <CardHeader title={title} subtitle="Across the order-to-delivery flow" />
      {!items.length ? (
        <EmptyState compact icon={Activity} title="No activity yet" />
      ) : (
        <ol className="relative space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-line">
          {items.map((a) => (
            <li key={a.id} className="relative flex gap-3">
              <Avatar name={a.actorName} color={colors[a.actorId]?.color || '#64748B'} image={colors[a.actorId]?.image} size="sm" />
              <div className="min-w-0 pt-0.5">
                <p className="text-sm text-ink leading-snug">
                  <span className="font-medium">{a.actorName}</span> <span className="text-muted">{a.message}</span>
                </p>
                <p className="text-xs text-muted mt-0.5">{formatRelative(a.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
