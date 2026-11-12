/**
 * Calendar helpers for the forecasting engine. Dates are local calendar days as 'YYYY-MM-DD' strings
 * so series line up with order dates regardless of time zone.
 */
import dayjs from 'dayjs'

export const dayKey = (d) => dayjs(d).format('YYYY-MM-DD')

/** Inclusive list of day keys from → to. */
export const dayRange = (from, to) => {
  const out = []
  let d = dayjs(from).startOf('day')
  const end = dayjs(to).startOf('day')
  while (!d.isAfter(end)) { out.push(d.format('YYYY-MM-DD')); d = d.add(1, 'day') }
  return out
}

/** Period key for a day at a granularity (weeks start Monday). */
export const periodKey = (day, granularity) => {
  const d = dayjs(day)
  if (granularity === 'week') {
    const dow = (d.day() + 6) % 7 // Monday = 0
    return d.subtract(dow, 'day').format('YYYY-MM-DD')
  }
  if (granularity === 'month') return d.format('YYYY-MM')
  if (granularity === 'quarter') return `${d.year()}-Q${Math.floor(d.month() / 3) + 1}`
  return d.format('YYYY-MM-DD')
}

export const periodLabel = (key, granularity) => {
  if (granularity === 'week') return `Wk ${dayjs(key).format('DD MMM')}`
  if (granularity === 'month') return dayjs(`${key}-01`).format('MMM YYYY')
  if (granularity === 'quarter') return key.replace('-', ' ')
  return dayjs(key).format('DD MMM')
}

/** Start day of the period after `key`. */
export const nextPeriodStart = (key, granularity) => {
  if (granularity === 'week') return dayjs(key).add(7, 'day').format('YYYY-MM-DD')
  if (granularity === 'month') return dayjs(`${key}-01`).add(1, 'month').format('YYYY-MM')
  if (granularity === 'quarter') {
    const [y, q] = key.split('-Q').map(Number)
    return q === 4 ? `${y + 1}-Q1` : `${y}-Q${q + 1}`
  }
  return dayjs(key).add(1, 'day').format('YYYY-MM-DD')
}

/** Number of periods that cover `days` days. */
export const periodsForDays = (days, granularity) => {
  const per = { day: 1, week: 7, month: 30, quarter: 91 }[granularity] || 1
  return Math.max(1, Math.ceil(days / per))
}

/**
 * Sum a daily series into periods. Partial leading/trailing periods are dropped (complete=true) so
 * a half-finished week or month does not look like a sales drop.
 */
export const aggregate = (days, values, granularity, { complete = true } = {}) => {
  if (granularity === 'day') return { keys: [...days], values: [...values], counts: days.map(() => 1) }
  const keys = []
  const sums = []
  const counts = []
  days.forEach((d, i) => {
    const k = periodKey(d, granularity)
    if (keys[keys.length - 1] !== k) { keys.push(k); sums.push(0); counts.push(0) }
    sums[sums.length - 1] += values[i]
    counts[counts.length - 1] += 1
  })
  if (!complete) return { keys, values: sums, counts }
  const full = { week: 7, month: 28, quarter: 89 }[granularity]
  const keep = counts.map((c) => c >= full)
  // only trim at the edges
  let a = 0
  let b = keys.length
  while (a < b && !keep[a]) a += 1
  while (b > a && !keep[b - 1]) b -= 1
  return { keys: keys.slice(a, b), values: sums.slice(a, b), counts: counts.slice(a, b) }
}

/** Future period keys after the last key. */
export const futureKeys = (lastKey, granularity, n) => {
  const out = []
  let k = lastKey
  for (let i = 0; i < n; i += 1) {
    k = granularity === 'day' ? dayjs(k).add(1, 'day').format('YYYY-MM-DD') : nextPeriodStart(k, granularity)
    out.push(granularity === 'week' ? dayjs(k).format('YYYY-MM-DD') : k)
  }
  return out
}

export const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0)
export const std = (a) => {
  if (a.length < 2) return 0
  const m = mean(a)
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1))
}

/** Least-squares slope per step. */
export const slope = (a) => {
  const n = a.length
  if (n < 2) return 0
  const mx = (n - 1) / 2
  const my = mean(a)
  let num = 0
  let den = 0
  a.forEach((y, x) => { num += (x - mx) * (y - my); den += (x - mx) ** 2 })
  return den ? num / den : 0
}

export const round = (v, d = 2) => {
  const f = 10 ** d
  return Math.round((Number(v) || 0) * f) / f
}
