import { useId } from 'react'
import { ChevronDown, Search, X, Download } from 'lucide-react'
import Button from './Button'
import { cn } from '../../utils/helpers'

export function SearchInput({ value, onChange, placeholder = 'Search…', className, label = 'Search' }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-8 text-sm text-ink shadow-xs placeholder:text-muted/80 hover:border-line-strong focus:outline-none focus:ring-[3px] focus:ring-[var(--ring)] focus:border-brand"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-ink" aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

/** Compact filter select. options: [{value,label}]; `allLabel` is the empty choice. */
export function FilterSelect({ label, value, onChange, options, allLabel = 'All', className }) {
  const id = useId()
  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-9 w-full appearance-none rounded-lg border bg-surface pl-3 pr-8 text-sm shadow-xs focus:outline-none focus:ring-[3px] focus:ring-[var(--ring)] cursor-pointer',
          value ? 'border-brand/50 bg-brand/5 text-ink font-medium' : 'border-line text-ink-2 hover:border-line-strong',
        )}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden />
    </div>
  )
}

export function FilterInput({ label, className, ...rest }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <input id={id} className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-xs hover:border-line-strong focus:outline-none focus:ring-[3px] focus:ring-[var(--ring)] focus:border-brand" title={label} {...rest} />
    </div>
  )
}

/**
 * Search + filters + result count + reset + export, for list pages.
 */
export default function FilterToolbar({ query, onQuery, placeholder, children, total, filteredCount, activeCount, onReset, onExport, exportLabel = 'Export CSV' }) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput value={query} onChange={onQuery} placeholder={placeholder} className="lg:w-72 xl:w-80" />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center flex-1 [&>*]:sm:w-auto [&>*]:sm:min-w-36">{children}</div>
        {onExport && <Button variant="secondary" size="sm" icon={Download} onClick={onExport} className="self-start lg:self-auto">{exportLabel}</Button>}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="tabular" aria-live="polite">
          {filteredCount === total ? `${total} records` : `${filteredCount} of ${total} records`}
        </span>
        {activeCount > 0 && (
          <button type="button" onClick={onReset} className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
            <X size={12} /> Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
          </button>
        )}
      </div>
    </div>
  )
}
