import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Lock } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { SearchInput } from '../common/FilterToolbar'
import { ACTIONS, MODULES, PERMISSION_CATALOG, keysForCell, keysForModule } from '../../config/rbacCatalog'
import { cn } from '../../utils/helpers'

function TriCheckbox({ state, onChange, disabled, label }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = state === 'some' }, [state])
  return (
    <input
      ref={ref}
      type="checkbox"
      className="h-4 w-4 rounded border-line accent-[#232B5F] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
      checked={state === 'all'}
      onChange={onChange}
      disabled={disabled}
      aria-label={label}
      aria-checked={state === 'some' ? 'mixed' : state === 'all'}
    />
  )
}

const stateOf = (keys, set) => {
  if (!keys.length) return 'none'
  const n = keys.filter((k) => set.has(k)).length
  return n === 0 ? 'off' : n === keys.length ? 'all' : 'some'
}

/**
 * Module × action permission matrix. Each cell groups the page and action permissions of that module and action;
 * expand a module to set individual page / action permissions. value: string[]; onChange(next: string[]).
 */
export default function PermissionMatrixEditor({ value = [], onChange, readOnly = false, lockedNote }) {
  const set = useMemo(() => new Set(value), [value])
  const [open, setOpen] = useState(() => new Set())
  const [q, setQ] = useState('')
  const modules = MODULES.filter((m) => {
    if (!q.trim()) return true
    const t = q.trim().toLowerCase()
    return m.label.toLowerCase().includes(t) || PERMISSION_CATALOG.some((p) => p.module === m.id && (p.label.toLowerCase().includes(t) || p.key.includes(t)))
  })

  const apply = (keys, on) => {
    if (readOnly) return
    const next = new Set(set)
    keys.forEach((k) => (on ? next.add(k) : next.delete(k)))
    onChange?.([...next])
  }
  const toggleOpen = (id) => setOpen((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  const groups = [...new Set(modules.map((m) => m.group))]

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Filter modules or permissions…" className="w-full sm:w-72" label="Filter permissions" />
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{set.size} of {PERMISSION_CATALOG.length} permissions</span>
          {!readOnly && (
            <>
              <Button size="xs" variant="secondary" onClick={() => onChange?.(PERMISSION_CATALOG.map((p) => p.key))}>Select all</Button>
              <Button size="xs" variant="ghost" onClick={() => onChange?.([])}>Clear all</Button>
            </>
          )}
        </div>
      </div>
      {readOnly && lockedNote && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-muted"><Lock size={13} aria-hidden /> {lockedNote}</p>
      )}
      <div className="relative overflow-x-auto scroll-thin rounded-lg border border-line">
        <table className="w-full min-w-[820px] text-sm" aria-label="Permission matrix">
          <thead className="bg-surface-2/70">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-surface-2 px-3 py-2 text-left text-xs font-semibold text-muted">Module</th>
              {ACTIONS.map((a) => <th key={a.id} scope="col" className="px-2 py-2 text-center text-xs font-semibold text-muted">{a.label}</th>)}
              <th scope="col" className="px-2 py-2 text-center text-xs font-semibold text-muted">All</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g}>
                <tr><th colSpan={ACTIONS.length + 2} scope="colgroup" className="bg-surface px-3 pt-3 pb-1 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">{g}</th></tr>
                {modules.filter((m) => m.group === g).map((m) => {
                  const modKeys = keysForModule(m.id)
                  const expanded = open.has(m.id) || Boolean(q.trim())
                  return (
                    <Fragment key={m.id}>
                      <tr className="border-t border-line">
                        <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-2 text-left font-medium text-ink">
                          <button type="button" onClick={() => toggleOpen(m.id)} className="inline-flex items-center gap-1.5 hover:text-brand" aria-expanded={expanded} aria-controls={`perm-${m.id}`}>
                            <ChevronRight size={14} className={cn('transition-transform', expanded && 'rotate-90')} aria-hidden />
                            {m.label}
                          </button>
                        </th>
                        {ACTIONS.map((a) => {
                          const keys = keysForCell(m.id, a.id)
                          const st = stateOf(keys, set)
                          return (
                            <td key={a.id} className="px-2 py-2 text-center">
                              {st === 'none'
                                ? <span className="text-muted/50" title="No separate permission for this action">—</span>
                                : <TriCheckbox state={st} disabled={readOnly} label={`${m.label} — ${a.label}`} onChange={() => apply(keys, st !== 'all')} />}
                            </td>
                          )
                        })}
                        <td className="px-2 py-2 text-center">
                          <TriCheckbox state={stateOf(modKeys, set)} disabled={readOnly} label={`${m.label} — all permissions`} onChange={() => apply(modKeys, stateOf(modKeys, set) !== 'all')} />
                        </td>
                      </tr>
                      {expanded && (
                        <tr id={`perm-${m.id}`} className="bg-surface-2/40">
                          <td colSpan={ACTIONS.length + 2} className="px-3 py-2">
                            <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-3">
                              {PERMISSION_CATALOG.filter((p) => p.module === m.id).map((p) => (
                                <li key={p.key}>
                                  <label className={cn('flex items-start gap-2 rounded px-1 py-0.5', !readOnly && 'cursor-pointer hover:bg-surface')}>
                                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#232B5F]" checked={set.has(p.key)} disabled={readOnly} onChange={(e) => apply([p.key], e.target.checked)} />
                                    <span className="min-w-0">
                                      <span className="flex flex-wrap items-center gap-1.5 text-sm text-ink">{p.label}<Badge tone={p.kind === 'page' ? 'info' : 'accent'}>{p.kind === 'page' ? 'Page' : 'Action'}</Badge><span className="text-[11px] text-muted">{ACTIONS.find((a) => a.id === p.action)?.label}</span></span>
                                      <code className="block text-[11px] text-muted">{p.key}</code>
                                    </span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">“—” means the module has no separate permission for that action (it is covered by another cell, usually Manage). Page permissions control menus and routes; action permissions are checked again by the service before every change.</p>
    </div>
  )
}
