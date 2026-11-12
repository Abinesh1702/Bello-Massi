import { useEffect, useId, useRef, useState } from 'react'
import { CalendarRange, ChevronDown, RotateCcw, SlidersHorizontal, X, GitCompareArrows, CalendarDays, Info, Check } from 'lucide-react'
import dayjs from 'dayjs'
import Button from '../common/Button'
import { fieldClasses } from '../common/Input'
import { useDashboardPeriod } from '../../hooks/useDashboardPeriod'
import { monthName, orgNow, PRESET_GROUPS, presetLabel, previousRange, rangeText, validateCustomRange, fiscalYearOf } from '../../utils/periods'
import { DATE_FIELD_LABELS } from '../../utils/dashboardFilter'
import { cn } from '../../utils/helpers'

const SPECIFIC_TYPES = [
  { value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }, { value: 'quarter', label: 'Quarter' },
  { value: 'half', label: 'Half-year' }, { value: 'year', label: 'Calendar year' }, { value: 'fy', label: 'Financial year' },
]

/** Close a popover on outside click / Escape. */
const useDismiss = (open, onClose) => {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const key = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [open, onClose])
  return ref
}

function PresetSelect({ p, id, className }) {
  const value = p.state.specific ? '__specific' : p.state.key
  return (
    <div className={cn('relative', className)}>
      <select id={id} aria-label="Period" value={value} onChange={(e) => { if (e.target.value !== '__specific') p.setPreset(e.target.value) }}
        className={cn(fieldClasses(false, true), 'h-9 appearance-none pr-8 cursor-pointer font-medium')}>
        {p.state.specific && <option value="__specific">Specific period</option>}
        {PRESET_GROUPS.map(([g, keys]) => (
          <optgroup key={g} label={g}>{keys.map((k) => <option key={k} value={k}>{presetLabel(k)}</option>)}</optgroup>
        ))}
      </select>
      <CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
      <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  )
}

function CustomRangeForm({ p, onDone }) {
  const today = orgNow().format('YYYY-MM-DD')
  const [from, setFrom] = useState(p.state.custom?.from || (p.range.start ? p.range.start.format('YYYY-MM-DD') : orgNow().startOf('month').format('YYYY-MM-DD')))
  const [to, setTo] = useState(p.state.custom?.to || (p.range.end ? p.range.end.format('YYYY-MM-DD') : today))
  const [error, setError] = useState('')
  const fid = useId()
  const apply = () => {
    const v = validateCustomRange(from, to)
    if (!v.ok) { setError(v.error); return }
    p.applyCustom(from, to)
    onDone()
  }
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink">Custom date range</p>
      <div className="grid grid-cols-2 gap-2">
        <label htmlFor={`${fid}-f`} className="space-y-1"><span className="text-xs font-medium text-muted">Start date</span>
          <input id={`${fid}-f`} type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setError('') }} className={cn(fieldClasses(Boolean(error), false), 'h-9')} /></label>
        <label htmlFor={`${fid}-t`} className="space-y-1"><span className="text-xs font-medium text-muted">End date</span>
          <input id={`${fid}-t`} type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setError('') }} className={cn(fieldClasses(Boolean(error), false), 'h-9')} /></label>
      </div>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      {from && to && !error && validateCustomRange(from, to).ok && <p className="text-xs text-muted">From <strong className="text-ink">{dayjs(from).format('DD-MMM-YYYY')}</strong> to <strong className="text-ink">{dayjs(to).format('DD-MMM-YYYY')}</strong> · {dayjs(to).diff(dayjs(from), 'day') + 1} days</p>}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button size="sm" variant="ghost" onClick={() => { setFrom(''); setTo(''); setError('') }}>Clear</Button>
        <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={onDone}>Cancel</Button><Button size="sm" onClick={apply}>Apply</Button></div>
      </div>
    </div>
  )
}

function SpecificPeriodForm({ p, onDone }) {
  const now = orgNow()
  const fy = fiscalYearOf(now, p.state.fyStartMonth)
  const [type, setType] = useState(p.state.specific?.type || 'month')
  const defaults = { day: now.format('YYYY-MM-DD'), week: now.format('YYYY-MM-DD'), month: now.format('YYYY-MM'), quarter: `${fy.startYear}-Q1`, half: `${fy.startYear}-H1`, year: String(now.year()), fy: String(fy.startYear) }
  const [value, setValue] = useState(p.state.specific?.value || defaults[type])
  const years = Array.from({ length: 6 }, (_, i) => now.year() - i)
  const fyYears = Array.from({ length: 6 }, (_, i) => fy.startYear - i)
  const fyLabel = (y) => fiscalYearOf(dayjs(new Date(y, p.state.fyStartMonth - 1, 1)), p.state.fyStartMonth).label
  const fid = useId()
  const sel = cn(fieldClasses(false, false), 'h-9 cursor-pointer')
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink">Specific period</p>
      <label htmlFor={`${fid}-t`} className="block space-y-1"><span className="text-xs font-medium text-muted">Period type</span>
        <select id={`${fid}-t`} className={sel} value={type} onChange={(e) => { setType(e.target.value); setValue(defaults[e.target.value]) }}>
          {SPECIFIC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select></label>
      <label htmlFor={`${fid}-v`} className="block space-y-1"><span className="text-xs font-medium text-muted">{SPECIFIC_TYPES.find((t) => t.value === type)?.label}</span>
        {type === 'day' || type === 'week' ? <input id={`${fid}-v`} type="date" className={sel} value={value} onChange={(e) => setValue(e.target.value)} />
          : type === 'month' ? <input id={`${fid}-v`} type="month" className={sel} value={value} onChange={(e) => setValue(e.target.value)} />
            : type === 'year' ? <select id={`${fid}-v`} className={sel} value={value} onChange={(e) => setValue(e.target.value)}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
              : type === 'fy' ? <select id={`${fid}-v`} className={sel} value={value} onChange={(e) => setValue(e.target.value)}>{fyYears.map((y) => <option key={y} value={y}>{fyLabel(y)}</option>)}</select>
                : <select id={`${fid}-v`} className={sel} value={value} onChange={(e) => setValue(e.target.value)}>
                  {fyYears.flatMap((y) => (type === 'quarter' ? [1, 2, 3, 4] : [1, 2]).map((n) => {
                    const v = `${y}-${type === 'quarter' ? 'Q' : 'H'}${n}`
                    return <option key={v} value={v}>{type === 'quarter' ? 'Q' : 'H'}{n} {fyLabel(y)}</option>
                  }))}
                </select>}
      </label>
      {type === 'week' && <p className="text-xs text-muted">Pick any day — the week runs Monday to Sunday.</p>}
      <label htmlFor={`${fid}-fy`} className="block space-y-1"><span className="text-xs font-medium text-muted">Financial year starts in</span>
        <select id={`${fid}-fy`} className={sel} value={p.state.fyStartMonth} onChange={(e) => p.setFyStartMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{monthName(m)}{m === 4 ? ' (default)' : ''}</option>)}
        </select></label>
      <p className="text-xs text-muted">Quarters and half-years follow the financial year: Q1 starts in {monthName(p.state.fyStartMonth)}, H1 covers {monthName(p.state.fyStartMonth)}–{monthName(p.state.fyStartMonth + 5)}.</p>
      <div className="flex justify-end gap-2 pt-1"><Button size="sm" variant="secondary" onClick={onDone}>Cancel</Button><Button size="sm" onClick={() => { p.applySpecific(type, value); onDone() }} disabled={!value}>Apply</Button></div>
    </div>
  )
}

function Popover({ label, icon: Icon, active, children, align = 'left', testId }) {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-testid={testId}
        className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors', active ? 'border-brand/50 bg-brand/5 text-ink font-medium' : 'border-line bg-surface text-muted hover:text-ink hover:border-line-strong')}>
        <Icon size={15} aria-hidden />{label}
      </button>
      {open && (
        <div role="dialog" aria-label={label} className={cn('absolute top-full z-40 mt-1.5 w-80 rounded-xl border border-line bg-surface p-4 shadow-pop animate-fade-in', align === 'right' ? 'right-0' : 'left-0')}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

/** Shows which date each collection uses. */
function DateFieldHelp({ kinds }) {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  if (!kinds?.length) return null
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" aria-label="Which dates are filtered" aria-expanded={open}><Info size={16} /></button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1.5 w-72 rounded-xl border border-line bg-surface p-4 text-xs shadow-pop">
          <p className="mb-2 font-semibold text-ink">Dates used by this dashboard</p>
          <ul className="space-y-1 text-muted">{kinds.map((k) => DATE_FIELD_LABELS[k] && <li key={k}>• {DATE_FIELD_LABELS[k]}</li>)}</ul>
          <p className="mt-2 text-muted">Stock levels, credit balances and master data are always current (marked “Current”).</p>
        </div>
      )}
    </div>
  )
}

/**
 * Universal dashboard period toolbar. Desktop/tablet: inline, wrapping toolbar. Mobile: one compact button that opens
 * a bottom sheet with the same controls. Must be rendered inside <DashboardPeriodProvider>.
 */
export default function DashboardFilterBar({ kinds = [], allowCompare = true, className, title }) {
  const p = useDashboardPeriod()
  const [sheet, setSheet] = useState(false)
  const [sheetMode, setSheetMode] = useState(null)
  const pid = useId()
  if (!p) return null
  const label = p.state.specific || p.state.key === 'custom' ? p.range.label : presetLabel(p.state.key)
  const text = rangeText(p.range)

  return (
    <div className={cn('no-print', className)} data-testid="dashboard-filter">
      {/* Desktop / tablet */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 shadow-xs">
        {title && <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted">{title}</span>}
        <label htmlFor={pid} className="sr-only">Period</label>
        <PresetSelect p={p} id={pid} className="w-52" />
        <Popover label="Date range" icon={CalendarRange} active={p.state.key === 'custom' && !p.state.specific} testId="filter-custom">{(close) => <CustomRangeForm p={p} onDone={close} />}</Popover>
        <Popover label="Specific period" icon={SlidersHorizontal} active={Boolean(p.state.specific)} testId="filter-specific">{(close) => <SpecificPeriodForm p={p} onDone={close} />}</Popover>
        {allowCompare && (
          <button type="button" onClick={() => p.setCompare(!p.state.compare)} disabled={!p.range.start} aria-pressed={p.state.compare}
            className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed', p.state.compare ? 'border-brand/50 bg-brand/5 font-medium text-ink' : 'border-line bg-surface text-muted hover:text-ink')}
            title={p.range.start ? 'Compare with the previous equivalent period' : 'Choose a bounded period to compare'}>
            {p.state.compare ? <Check size={15} aria-hidden /> : <GitCompareArrows size={15} aria-hidden />}Compare
          </button>
        )}
        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          <span className="truncate rounded-md bg-surface-2 px-2.5 py-1 text-xs text-ink tabular" data-testid="active-range" title={p.compare ? `vs ${rangeText(p.previous)}` : undefined}>
            <span className="text-muted">Showing </span>{text}{p.compare && <span className="text-muted"> · vs {rangeText(p.previous)}</span>}
          </span>
          <DateFieldHelp kinds={kinds} />
          {!p.isDefault && <Button size="sm" variant="ghost" icon={RotateCcw} onClick={p.reset}>Reset</Button>}
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden flex items-center gap-2">
        <button type="button" onClick={() => { setSheet(true); setSheetMode(null) }} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left shadow-xs" data-testid="filter-mobile">
          <CalendarDays size={16} className="shrink-0 text-brand" aria-hidden />
          <span className="min-w-0"><span className="block truncate text-sm font-medium text-ink">{label}</span><span className="block truncate text-[11px] text-muted tabular">{text}{p.compare ? ' · comparing' : ''}</span></span>
          <SlidersHorizontal size={16} className="ml-auto shrink-0 text-muted" aria-hidden />
        </button>
        {!p.isDefault && <button type="button" onClick={p.reset} className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-muted" aria-label="Reset period"><RotateCcw size={16} /></button>}
      </div>
      {sheet && (
        <div className="sm:hidden fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Dashboard period">
          <button type="button" className="absolute inset-0 bg-black/40 animate-fade-in" aria-label="Close" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-pop animate-sheet-up">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden />
            <div className="mb-3 flex items-center justify-between"><p className="text-base font-semibold text-ink">Period</p><button type="button" onClick={() => setSheet(false)} className="rounded p-1 text-muted" aria-label="Close"><X size={18} /></button></div>
            {sheetMode === 'custom' ? <CustomRangeForm p={p} onDone={() => setSheet(false)} />
              : sheetMode === 'specific' ? <SpecificPeriodForm p={p} onDone={() => setSheet(false)} />
                : (
                  <div className="space-y-4">
                    {PRESET_GROUPS.map(([g, keys]) => (
                      <div key={g}>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{g}</p>
                        <div className="flex flex-wrap gap-2">
                          {keys.map((k) => (
                            <button key={k} type="button" aria-pressed={p.state.key === k && !p.state.specific}
                              onClick={() => { if (k === 'custom') setSheetMode('custom'); else { p.setPreset(k); setSheet(false) } }}
                              className={cn('rounded-full border px-3 py-1.5 text-sm', p.state.key === k && !p.state.specific ? 'border-brand bg-brand text-white' : 'border-line text-ink')}>{presetLabel(k)}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button variant="secondary" icon={SlidersHorizontal} fullWidth onClick={() => setSheetMode('specific')}>Specific day, week, month, quarter or financial year…</Button>
                    {allowCompare && (
                      <label className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 text-sm">
                        <span><span className="block font-medium text-ink">Compare with previous period</span><span className="text-xs text-muted">{p.range.start ? `vs ${rangeText(previousRangeSafe(p))}` : 'Not available for All Time'}</span></span>
                        <input type="checkbox" className="h-5 w-5 accent-[var(--brand)]" checked={p.state.compare} disabled={!p.range.start} onChange={(e) => p.setCompare(e.target.checked)} />
                      </label>
                    )}
                    <Button variant="ghost" icon={RotateCcw} fullWidth onClick={() => { p.reset(); setSheet(false) }}>Reset to {presetLabel(p.defaultKey)}</Button>
                  </div>
                )}
          </div>
        </div>
      )}
    </div>
  )
}

const previousRangeSafe = (p) => p.previous || previousRange(p.range)

/** Small pill for widgets that are not date-filtered (current snapshots). */
export function CurrentBadge({ className }) {
  return <span className={cn('inline-flex items-center rounded-full border border-line px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-muted', className)} title="Current position — not affected by the period filter">Current</span>
}
