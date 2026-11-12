import { useId } from 'react'
import { FieldShell } from './Input'
import { cn } from '../../utils/helpers'

export default function Textarea({ label, hint, error, className, id: idProp, required, rows = 3, ...rest }) {
  const autoId = useId()
  const id = idProp || autoId
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:ring-4 focus:ring-[var(--ring)]',
          error ? 'border-danger' : 'border-line focus:border-brand',
        )}
        {...rest}
      />
    </FieldShell>
  )
}
