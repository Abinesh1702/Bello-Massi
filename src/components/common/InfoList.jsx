import { cn } from '../../utils/helpers'

/** Definition list for detail pages. items: [{ label, value, span?: 2, hidden? }] */
export default function InfoList({ items, columns = 2, className }) {
  const cols = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' }
  return (
    <dl className={cn('grid gap-x-6 gap-y-4', cols[columns], className)}>
      {items.filter((i) => !i.hidden).map((i) => (
        <div key={i.label} className={cn('min-w-0', i.span === 2 && 'sm:col-span-2', i.span === 'full' && 'sm:col-span-full')}>
          <dt className="text-label">{i.label}</dt>
          <dd className="mt-0.5 text-sm text-ink break-words">{i.value === '' || i.value === null || i.value === undefined ? <span className="text-muted">—</span> : i.value}</dd>
        </div>
      ))}
    </dl>
  )
}
