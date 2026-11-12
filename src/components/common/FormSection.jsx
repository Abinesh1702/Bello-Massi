import Card from './Card'
import { cn } from '../../utils/helpers'

/** Titled form section with a responsive field grid. */
export default function FormSection({ title, description, icon: Icon, children, className, columns = 2, aside }) {
  const cols = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }
  return (
    <Card className={className}>
      <div className="-mx-5 -mt-5 mb-5 flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-start gap-2.5">
          {Icon && (
            <span className="mt-px grid h-7 w-7 shrink-0 place-items-center rounded-md bg-surface-3 text-ink-2"><Icon size={15} aria-hidden /></span>
          )}
          <div>
            <h2 className="text-section-title">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
        </div>
        {aside}
      </div>
      <div className={cn('grid gap-x-5 gap-y-4', cols[columns])}>{children}</div>
    </Card>
  )
}

/** Sticky save/cancel bar at the bottom of long forms. */
export function FormActions({ children, note }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 mt-6 border-t border-line bg-surface/95 px-4 sm:px-6 lg:px-8 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_-8px_rgba(16,24,40,0.15)] backdrop-blur">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">{note}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">{children}</div>
      </div>
    </div>
  )
}
