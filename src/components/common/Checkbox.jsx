import { useId } from 'react'
import { cn } from '../../utils/helpers'

export default function Checkbox({ label, description, className, id: idProp, ...rest }) {
  const autoId = useId()
  const id = idProp || autoId
  return (
    <label htmlFor={id} className={cn('inline-flex items-start gap-2.5 cursor-pointer select-none', className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-line accent-[#232B5F] dark:accent-[#F5A623] cursor-pointer"
        {...rest}
      />
      <span>
        <span className="text-sm text-ink">{label}</span>
        {description && <span className="block text-xs text-muted mt-0.5">{description}</span>}
      </span>
    </label>
  )
}
