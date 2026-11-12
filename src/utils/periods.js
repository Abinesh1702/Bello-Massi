/**
 * Reusable period logic for dashboard filters (presentation only — no stored data is changed).
 *
 * A "range" is { key, start, end, label, granularity } with start/end as dayjs values at day boundaries, in the
 * organisation time zone (end = end of day, inclusive). `null` start/end = All Time.
 *
 * Financial year (default April – March, configurable start month):
 *   FY 2026–27 = 01-Apr-2026 … 31-Mar-2027 · Q1 Apr–Jun, Q2 Jul–Sep, Q3 Oct–Dec, Q4 Jan–Mar · H1 Apr–Sep, H2 Oct–Mar.
 */
import dayjs from 'dayjs'
import { toOrgTime } from './formatters'

export const DEFAULT_FY_START_MONTH = 4 // April (1–12)

export const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'last_7', label: 'Last 7 Days' },
  { key: 'last_30', label: 'Last 30 Days' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'mtd', label: 'Month to Date' },
  { key: 'this_quarter', label: 'This Quarter' },
  { key: 'last_quarter', label: 'Last Quarter' },
  { key: 'qtd', label: 'Quarter to Date' },
  { key: 'this_half', label: 'This Half-Year' },
  { key: 'last_half', label: 'Last Half-Year' },
  { key: 'htd', label: 'Half-Year to Date' },
  { key: 'this_year', label: 'This Year' },
  { key: 'last_year', label: 'Last Year' },
  { key: 'ytd', label: 'Year to Date' },
  { key: 'custom', label: 'Custom Date Range' },
  { key: 'all', label: 'All Time' },
]
export const PRESET_GROUPS = [
  ['Days', ['today', 'yesterday', 'last_7', 'last_30']],
  ['Weeks & months', ['this_week', 'last_week', 'this_month', 'last_month', 'mtd']],
  ['Quarters & halves', ['this_quarter', 'last_quarter', 'qtd', 'this_half', 'last_half', 'htd']],
  ['Years', ['this_year', 'last_year', 'ytd']],
  ['Other', ['all', 'custom']],
]
export const presetLabel = (key) => PRESETS.find((p) => p.key === key)?.label || key

/** "Now" in the organisation time zone. */
export const orgNow = () => toOrgTime(new Date().toISOString())

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const monthName = (m) => MONTHS[(m - 1 + 12) % 12]

/** Financial year containing `d` → { startYear, start, end, label }. */
export const fiscalYearOf = (d, startMonth = DEFAULT_FY_START_MONTH) => {
  const m = d.month() + 1
  const startYear = m >= startMonth ? d.year() : d.year() - 1
  const start = dayjs(new Date(startYear, startMonth - 1, 1))
  const end = start.add(12, 'month').subtract(1, 'day')
  const label = startMonth === 1 ? `FY ${startYear}` : `FY ${startYear}–${String(startYear + 1).slice(-2)}`
  return { startYear, start, end, label }
}
/** Fiscal quarter (1–4) / half (1–2) containing d. */
const fiscalIndex = (d, startMonth, months) => {
  const fy = fiscalYearOf(d, startMonth)
  const offset = (d.year() - fy.start.year()) * 12 + d.month() - fy.start.month()
  const idx = Math.floor(offset / months)
  return { fy, idx, start: fy.start.add(idx * months, 'month'), end: fy.start.add((idx + 1) * months, 'month').subtract(1, 'day') }
}
export const fiscalQuarterOf = (d, startMonth = DEFAULT_FY_START_MONTH) => {
  const r = fiscalIndex(d, startMonth, 3)
  return { ...r, label: `Q${r.idx + 1} ${r.fy.label}` }
}
export const fiscalHalfOf = (d, startMonth = DEFAULT_FY_START_MONTH) => {
  const r = fiscalIndex(d, startMonth, 6)
  return { ...r, label: `H${r.idx + 1} ${r.fy.label}` }
}

const sod = (d) => dayjs(new Date(d.year(), d.month(), d.date()))
const eod = (d) => sod(d).add(1, 'day').subtract(1, 'millisecond')
const make = (key, start, end, label, extra = {}) => ({ key, start: start ? sod(start) : null, end: end ? eod(end) : null, label, ...extra })

/**
 * Resolve a preset (or a custom / specific period) to a range.
 * opts: { from, to } for custom ('YYYY-MM-DD'), { fyStartMonth }, { now }.
 * Weeks start on Monday. "This …" periods run to the end of the period; "… to Date" periods stop today.
 */
export const resolveRange = (key, opts = {}) => {
  const fyStart = opts.fyStartMonth || DEFAULT_FY_START_MONTH
  const now = opts.now ? dayjs(opts.now) : orgNow()
  const today = sod(now)
  const weekStart = today.subtract((today.day() + 6) % 7, 'day')
  const L = presetLabel(key)
  switch (key) {
    case 'today': return make(key, today, today, L)
    case 'yesterday': return make(key, today.subtract(1, 'day'), today.subtract(1, 'day'), L)
    case 'this_week': return make(key, weekStart, weekStart.add(6, 'day'), L)
    case 'last_week': return make(key, weekStart.subtract(7, 'day'), weekStart.subtract(1, 'day'), L)
    case 'last_7': return make(key, today.subtract(6, 'day'), today, L)
    case 'last_30': return make(key, today.subtract(29, 'day'), today, L)
    case 'this_month': return make(key, today.startOf('month'), today.endOf('month'), L)
    case 'last_month': { const m = today.subtract(1, 'month'); return make(key, m.startOf('month'), m.endOf('month'), L) }
    case 'mtd': return make(key, today.startOf('month'), today, L)
    case 'this_quarter': { const q = fiscalQuarterOf(today, fyStart); return make(key, q.start, q.end, `${L} (${q.label})`) }
    case 'last_quarter': { const q = fiscalQuarterOf(fiscalQuarterOf(today, fyStart).start.subtract(1, 'day'), fyStart); return make(key, q.start, q.end, `${L} (${q.label})`) }
    case 'qtd': { const q = fiscalQuarterOf(today, fyStart); return make(key, q.start, today, `${L} (${q.label})`) }
    case 'this_half': { const h = fiscalHalfOf(today, fyStart); return make(key, h.start, h.end, `${L} (${h.label})`) }
    case 'last_half': { const h = fiscalHalfOf(fiscalHalfOf(today, fyStart).start.subtract(1, 'day'), fyStart); return make(key, h.start, h.end, `${L} (${h.label})`) }
    case 'htd': { const h = fiscalHalfOf(today, fyStart); return make(key, h.start, today, `${L} (${h.label})`) }
    case 'this_year': return make(key, today.startOf('year'), today.endOf('year'), `${L} (${today.year()})`)
    case 'last_year': { const y = today.subtract(1, 'year'); return make(key, y.startOf('year'), y.endOf('year'), `${L} (${y.year()})`) }
    case 'ytd': return make(key, today.startOf('year'), today, `${L} (${today.year()})`)
    case 'custom': {
      const v = validateCustomRange(opts.from, opts.to)
      if (!v.ok) return null
      return make(key, dayjs(opts.from), dayjs(opts.to), `${dayjs(opts.from).format('DD-MMM-YYYY')} – ${dayjs(opts.to).format('DD-MMM-YYYY')}`)
    }
    case 'all': return make('all', null, null, 'All Time')
    default: return null
  }
}

/** Specific periods for the advanced picker. type: day | week | month | quarter | half | year | fy; value: string. */
export const resolveSpecific = (type, value, fyStartMonth = DEFAULT_FY_START_MONTH) => {
  if (!value) return null
  const k = `period:${type}:${value}`
  if (type === 'day') { const d = dayjs(value); return d.isValid() ? make(k, d, d, d.format('DD-MMM-YYYY')) : null }
  if (type === 'week') { // value = 'YYYY-MM-DD' of any day in the week
    const d = dayjs(value); if (!d.isValid()) return null
    const s = d.subtract((d.day() + 6) % 7, 'day')
    return make(k, s, s.add(6, 'day'), `Week of ${s.format('DD-MMM-YYYY')}`)
  }
  if (type === 'month') { const d = dayjs(`${value}-01`); return d.isValid() ? make(k, d.startOf('month'), d.endOf('month'), d.format('MMMM YYYY')) : null }
  if (type === 'year') { const y = Number(value); return y ? make(k, dayjs(new Date(y, 0, 1)), dayjs(new Date(y, 11, 31)), `Calendar year ${y}`) : null }
  if (type === 'fy' || type === 'quarter' || type === 'half') {
    // value: 'YYYY' (FY start year) or 'YYYY-Q1' / 'YYYY-H2'
    const [y, part] = String(value).split('-')
    const fy = fiscalYearOf(dayjs(new Date(Number(y), fyStartMonth - 1, 1)), fyStartMonth)
    if (type === 'fy') return make(k, fy.start, fy.end, `${fy.label} (${fy.start.format('DD-MMM-YYYY')} – ${fy.end.format('DD-MMM-YYYY')})`)
    const n = Number(String(part || '').slice(1))
    const size = type === 'quarter' ? 3 : 6
    const max = type === 'quarter' ? 4 : 2
    if (!(n >= 1 && n <= max)) return null
    const s = fy.start.add((n - 1) * size, 'month')
    return make(k, s, s.add(size, 'month').subtract(1, 'day'), `${type === 'quarter' ? 'Q' : 'H'}${n} ${fy.label}`)
  }
  return null
}

export const validateCustomRange = (from, to) => {
  if (!from && !to) return { ok: false, error: 'Choose a start date and an end date.' }
  if (!from) return { ok: false, error: 'Choose a start date.' }
  if (!to) return { ok: false, error: 'Choose an end date.' }
  const a = dayjs(from)
  const b = dayjs(to)
  if (!a.isValid() || !b.isValid()) return { ok: false, error: 'Enter valid dates.' }
  if (a.isAfter(b, 'day')) return { ok: false, error: 'The start date must be on or before the end date.' }
  if (b.diff(a, 'year') > 20) return { ok: false, error: 'Choose a range shorter than 20 years.' }
  return { ok: true }
}

/** The previous period of equal length (for comparisons). All Time has none. */
export const previousRange = (range) => {
  if (!range?.start || !range?.end) return null
  const len = sod(range.end).diff(range.start, 'day') + 1
  // Whole calendar months / quarters / halves / years compare to the previous whole unit.
  const wholeMonths = range.start.date() === 1 && sod(range.end).add(1, 'day').date() === 1
  if (wholeMonths) {
    const months = Math.round(sod(range.end).add(1, 'day').diff(range.start, 'month', true))
    const s = range.start.subtract(months, 'month')
    return make(`prev:${range.key}`, s, range.start.subtract(1, 'day'), `${s.format('DD-MMM-YYYY')} – ${range.start.subtract(1, 'day').format('DD-MMM-YYYY')}`)
  }
  const s = range.start.subtract(len, 'day')
  const e = range.start.subtract(1, 'day')
  return make(`prev:${range.key}`, s, e, `${s.format('DD-MMM-YYYY')} – ${e.format('DD-MMM-YYYY')}`)
}

/** Is an ISO / date string inside the range? (null range or All Time = always). Values without a date are excluded from bounded ranges. */
export const inRange = (value, range) => {
  if (!range || (!range.start && !range.end)) return true
  if (!value) return false
  let local
  if (String(value).length === 10) local = dayjs(value)
  else {
    const d = toOrgTime(value)
    if (!d.isValid()) return false
    local = dayjs(new Date(d.year(), d.month(), d.date(), d.hour(), d.minute()))
  }
  if (!local.isValid()) return false
  return !local.isBefore(range.start) && !local.isAfter(range.end)
}

export const rangeText = (range) => {
  if (!range) return ''
  if (!range.start) return 'All dates'
  const a = range.start.format('DD-MMM-YYYY')
  const b = range.end.format('DD-MMM-YYYY')
  return a === b ? a : `${a} – ${b}`
}

/** Bucketing for trend charts: daily (≤ 45 days), weekly (≤ 26 weeks), otherwise monthly. Bounded by `fallbackStart` for All Time. */
export const trendBuckets = (range, { fallbackStart, maxEnd } = {}) => {
  const start = range?.start || (fallbackStart ? sod(dayjs(fallbackStart)) : sod(orgNow()).subtract(13, 'day'))
  let end = range?.end ? sod(range.end) : sod(orgNow())
  if (maxEnd && end.isAfter(maxEnd)) end = sod(maxEnd)
  if (end.isBefore(start)) end = start
  const days = end.diff(start, 'day') + 1
  const unit = days <= 45 ? 'day' : days <= 182 ? 'week' : 'month'
  const out = []
  let cur = unit === 'month' ? start.startOf('month') : unit === 'week' ? start.subtract((start.day() + 6) % 7, 'day') : start
  while (!cur.isAfter(end) && out.length < 400) {
    const next = cur.add(1, unit)
    const bs = cur.isBefore(start) ? start : cur
    const be = next.subtract(1, 'day').isAfter(end) ? end : next.subtract(1, 'day')
    out.push({ start: bs, end: eod(be), label: unit === 'day' ? cur.format('DD MMM') : unit === 'week' ? `${bs.format('DD MMM')}` : cur.format('MMM YY') })
    cur = next
  }
  return { unit, buckets: out }
}
