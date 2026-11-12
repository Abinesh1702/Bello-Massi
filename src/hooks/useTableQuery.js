import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * List state (search, filters, sort, page) kept in the URL so it survives
 * opening a record and pressing Back, and can be shared as a link.
 *   const t = useTableQuery({ filters: ['type','status'], sort: 'name' })
 */
export const useTableQuery = ({ filters: filterKeys = [], sort: defaultSort = '', dir: defaultDir = 'asc' } = {}) => {
  const [params, setParams] = useSearchParams()
  // React Router's functional setSearchParams sees the params of the last render, so two quick
  // updates (fast typing, filter + search) could overwrite each other. Track the latest value here.
  const latest = useRef(params)
  useLayoutEffect(() => {
    latest.current = params
  }, [params])

  const state = useMemo(() => ({
    q: params.get('q') || '',
    filters: Object.fromEntries(filterKeys.map((k) => [k, params.get(k) || ''])),
    sort: params.get('sort') || defaultSort,
    dir: params.get('dir') === 'desc' ? 'desc' : params.get('dir') === 'asc' ? 'asc' : defaultDir,
    page: Math.max(0, Number(params.get('page') || 1) - 1),
  }), [params, filterKeys, defaultSort, defaultDir]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback((patch, resetPage = true) => {
    const next = new URLSearchParams(latest.current)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) next.delete(k)
      else next.set(k, String(v))
    })
    if (resetPage) next.delete('page')
    latest.current = next
    setParams(next, { replace: true })
  }, [setParams])

  return {
    ...state,
    activeFilterCount: Object.values(state.filters).filter(Boolean).length + (state.q ? 1 : 0),
    setQuery: (q) => update({ q }),
    setFilter: (key, value) => update({ [key]: value }),
    setSort: (key) => update({ sort: key, dir: state.sort === key && state.dir === 'asc' ? 'desc' : 'asc' }, false),
    setPage: (page) => update({ page: page > 0 ? page + 1 : '' }, false),
    reset: () => update(Object.fromEntries(['q', ...filterKeys].map((k) => [k, '']))),
  }
}

/** Generic sorter used with useTableQuery. accessors: { key: row => value } */
export const sortRows = (rows, sort, dir, accessors = {}) => {
  if (!sort) return rows
  const get = accessors[sort] || ((r) => r[sort])
  const factor = dir === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const va = get(a)
    const vb = get(b)
    if (va === vb) return 0
    if (va === null || va === undefined || va === '') return 1
    if (vb === null || vb === undefined || vb === '') return -1
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor
    return String(va).localeCompare(String(vb), 'en', { numeric: true, sensitivity: 'base' }) * factor
  })
}

export default useTableQuery
