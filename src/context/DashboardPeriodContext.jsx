import { createContext, useCallback, useMemo, useState } from 'react'
import { DEFAULT_FY_START_MONTH, previousRange, resolveRange, resolveSpecific } from '../utils/periods'

export const DashboardPeriodContext = createContext(null)

// Remember each dashboard's selection while the app is open (in memory only — nothing is written to storage).
const memory = new Map()

/**
 * Holds one dashboard's period selection. Every date-dependent widget inside reads the same range, so KPIs, charts
 * and tables always agree. `id` keys the in-memory selection; `defaultKey` is what Reset restores.
 */
export function DashboardPeriodProvider({ id = 'dashboard', defaultKey = 'all', children }) {
  const initial = memory.get(id) || { key: defaultKey, custom: null, specific: null, compare: false, fyStartMonth: DEFAULT_FY_START_MONTH }
  const [state, setState] = useState(initial)
  const update = useCallback((patch) => setState((s) => { const n = { ...s, ...patch }; memory.set(id, n); return n }), [id])

  const range = useMemo(() => {
    if (state.specific) return resolveSpecific(state.specific.type, state.specific.value, state.fyStartMonth) || resolveRange('all')
    if (state.key === 'custom' && state.custom) return resolveRange('custom', { from: state.custom.from, to: state.custom.to, fyStartMonth: state.fyStartMonth }) || resolveRange('all')
    return resolveRange(state.key, { fyStartMonth: state.fyStartMonth }) || resolveRange('all')
  }, [state])
  const prev = useMemo(() => (state.compare ? previousRange(range) : null), [state.compare, range])

  const value = useMemo(() => ({
    id, range, previous: prev, compare: state.compare && Boolean(prev), state, defaultKey,
    isDefault: state.key === defaultKey && !state.specific && !state.compare,
    setPreset: (key) => update({ key, specific: null, ...(key === 'custom' ? {} : { custom: null }) }),
    applyCustom: (from, to) => update({ key: 'custom', custom: { from, to }, specific: null }),
    applySpecific: (type, v) => update({ specific: { type, value: v } }),
    setCompare: (compare) => update({ compare }),
    setFyStartMonth: (m) => update({ fyStartMonth: m }),
    reset: () => update({ key: defaultKey, custom: null, specific: null, compare: false }),
  }), [id, range, prev, state, defaultKey, update])
  return <DashboardPeriodContext.Provider value={value}>{children}</DashboardPeriodContext.Provider>
}
