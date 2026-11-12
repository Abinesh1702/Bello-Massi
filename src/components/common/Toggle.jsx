import { useId } from 'react'
import { cn } from '../../utils/helpers'

/** Accessible switch. */
export default function Toggle({ checked, onChange, label, description, disabled, className }) {
  const id = useId()
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <label htmlFor={id} className="text-sm font-medium text-ink cursor-pointer">{label}</label>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-navy dark:bg-accent' : 'bg-line',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  )
}
