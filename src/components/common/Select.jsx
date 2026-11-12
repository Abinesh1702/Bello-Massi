import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { FieldShell, fieldClasses } from './Input'
import { cn } from '../../utils/helpers'

/** options: [{ value, label }] */
export default function Select({ label, hint, error, options = [], placeholder, className, id: idProp, required, ...rest }) {
  const autoId = useId()
  const id = idProp || autoId
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className="relative">
        <select
          id={id}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          className={cn(fieldClasses(error, false), 'appearance-none pr-9 cursor-pointer')}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden />
      </div>
    </FieldShell>
  )
}
