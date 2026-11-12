import { useId } from 'react'
import { cn } from '../../utils/helpers'

export const fieldClasses = (error, hasIcon) =>
  cn(
    'w-full h-9 rounded-lg border bg-surface text-sm text-ink placeholder:text-muted/70 shadow-xs',
    'transition-[border-color,box-shadow] focus:outline-none focus:ring-[3px] focus:ring-[var(--ring)]',
    error ? 'border-danger focus:border-danger' : 'border-line hover:border-line-strong focus:border-brand',
    hasIcon ? 'pl-9 pr-3' : 'px-3',
    'disabled:opacity-60 disabled:cursor-not-allowed read-only:bg-surface-2',
  )

export function FieldShell({ id, label, hint, error, required, children, className, labelAction }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
            {required && <span className="text-danger ml-0.5" aria-hidden>*</span>}
          </label>
          {labelAction}
        </div>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger" role="alert">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export default function Input({
  label, hint, error, icon: Icon, rightElement, className, inputClassName, id: idProp, required, labelAction, ref, ...rest
}) {
  const autoId = useId()
  const id = idProp || autoId
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className} labelAction={labelAction}>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden />}
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(fieldClasses(error, Boolean(Icon)), rightElement && 'pr-10', inputClassName)}
          {...rest}
        />
        {rightElement && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
    </FieldShell>
  )
}
