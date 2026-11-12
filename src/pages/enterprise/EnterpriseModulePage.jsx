import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Plus, Save, History, Link2, Layers } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Textarea from '../../components/common/Textarea'
import DataTable from '../../components/common/DataTable'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import InfoList from '../../components/common/InfoList'
import Timeline from '../../components/common/Timeline'
import Tabs from '../../components/common/Tabs'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import StatCard from '../../components/dashboard/StatCard'
import { FieldInput, LinesEditor, LinesTable, StatusBadge, formatFieldValue } from '../../components/enterprise/fields'
import { SimpleTable } from '../../components/enterprise/ui'
import { useAuth } from '../../hooks/useAuth'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { can } from '../../config/permissions'
import { downloadCsv } from '../../services/csvService'
import { ensureEnterpriseModules } from '../../config/enterprise/modules'
import {
  availableActions, canDo, createRecord, getModuleDef, isEditable, moduleForPath, runAction, scopeFilter, updateRecord,
} from '../../services/enterprise/recordService'
import { cn } from '../../utils/helpers'

ensureEnterpriseModules()

/* ---------- helpers ---------- */
const titleOf = (def, r) => (def.titleField ? r[def.titleField] : r.title || r.name || '')
const fieldsByKey = (def) => Object.fromEntries((def.fields || []).map((f) => [f.key, f]))

const useRecords = (def, user) => {
  const raw = useStoredValue(def.key, [])
  return useMemo(() => (Array.isArray(raw) ? raw.filter(scopeFilter(def, user)) : []), [raw, def, user])
}

/* ---------- LIST ---------- */
function ListView({ def, user }) {
  const navigate = useNavigate()
  const F = fieldsByKey(def)
  const filterKeys = ['status', ...(def.filters || [])]
  const t = useTableQuery({ filters: filterKeys, sort: def.defaultSort || 'createdAt', dir: 'desc' })
  const records = useRecords(def, user)
  const ctx = { user, records }
  const rows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    let list = records.filter((r) => {
      if (t.filters.status && r.status !== t.filters.status) return false
      for (const k of def.filters || []) {
        const v = t.filters[k]
        if (!v) continue
        const fn = def.filterFns?.[k]
        if (fn ? !fn(r, v) : String(r[k] ?? '') !== v) return false
      }
      if (!q) return true
      const hay = [r.number, titleOf(def, r), ...(def.searchFields || []).map((k) => (F[k] ? formatFieldValue(F[k], r[k], r) : r[k]))].join(' ').toLowerCase()
      return hay.includes(q)
    })
    list = sortRows(list, t.sort, t.dir)
    return list
  }, [records, t.q, t.filters, t.sort, t.dir]) // eslint-disable-line react-hooks/exhaustive-deps

  const cols = [
    ...(def.numberPrefix ? [{ key: 'number', header: 'Number', sortable: true, render: (r) => <span className="font-medium text-ink tabular">{r.number}</span> }] : []),
    ...(def.listColumns || []).map((k) => {
      const f = F[k] || { key: k, label: k }
      return { key: k, header: f.short || f.label, sortable: true, align: ['money', 'number', 'integer', 'percent'].includes(f.type) ? 'right' : undefined, hideBelow: f.hideBelow, render: (r) => <span className={cn(['money', 'number', 'integer'].includes(f.type) && 'tabular')}>{formatFieldValue(f, r[k], r)}</span> }
    }),
    { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge def={def} status={r.status} /> },
  ]
  const kpis = def.kpis ? def.kpis(records, ctx) : []
  const filterOptions = (k) => {
    const f = F[k]
    if (def.filterOptions?.[k]) return def.filterOptions[k](records)
    const vals = [...new Set(records.map((r) => r[k]).filter((x) => x !== undefined && x !== null && x !== ''))]
    return vals.map((v) => ({ value: String(v), label: f ? formatFieldValue(f, v, {}) : String(v) }))
  }
  const onExport = () => {
    const n = downloadCsv(def.id, rows.map((r) => Object.fromEntries(cols.map((c) => [c.key, c.key === 'status' ? def.statuses?.[r.status]?.label || r.status : F[c.key] ? formatFieldValue(F[c.key], r[c.key], r) : r[c.key]]))), cols.map((c) => ({ key: c.key, header: c.header })))
    if (n) toast.success(`Exported ${n} rows`)
  }
  const ListExtra = def.listExtra
  return (
    <div>
      <PageHeader title={def.plural} description={def.description}
        actions={(
          <>
            {(def.listActions || []).filter((a) => !a.permission || can(user, a.permission)).map((a) => (
              <Button key={a.id} variant="secondary" icon={a.icon} onClick={() => { const r = a.run({ user, records }); if (r?.ok === false) toast.error(r.error); else if (r?.message) toast.success(r.message) }}>{a.label}</Button>
            ))}
            {canDo(def, 'create', user) && !def.noCreate && <Button icon={Plus} to={`${def.basePath}/new`} data-testid="create-record">{def.createLabel || `New ${def.label.toLowerCase()}`}</Button>}
          </>
        )} />
      {kpis.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="module-kpis">
          {kpis.map((k) => (
            <button key={k.label} type="button" className="text-left" onClick={() => k.filter && Object.entries(k.filter).forEach(([fk, fv]) => t.setFilter(fk, fv))}>
              <StatCard label={k.label} value={k.value} icon={k.icon || Layers} tone={k.tone || 'brand'} hint={k.hint} />
            </button>
          ))}
        </div>
      )}
      {ListExtra && <ListExtra def={def} user={user} records={records} />}
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder={`Search ${def.plural.toLowerCase()}…`} total={records.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={can(user, 'data.export') ? onExport : undefined}>
          <FilterSelect label="Status" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} allLabel="All statuses"
            options={Object.entries(def.statuses || {}).map(([value, m]) => ({ value, label: m.label }))} />
          {(def.filters || []).map((k) => <FilterSelect key={k} label={F[k]?.label || def.filterLabels?.[k] || k} value={t.filters[k]} onChange={(v) => t.setFilter(k, v)} allLabel={`All ${(F[k]?.label || def.filterLabels?.[k] || k).toLowerCase()}`} options={filterOptions(k)} />)}
        </FilterToolbar>
        <DataTable columns={cols} rows={rows} onRowClick={(r) => navigate(`${def.basePath}/${r.id}`)} sort={t.sort} dir={t.dir} onSort={t.setSort} page={t.page} onPageChange={t.setPage} pageSize="default" caption={def.plural} />
      </Card>
    </div>
  )
}

/* ---------- FORM ---------- */
function FormView({ def, user, existing }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [values, setValues] = useState(() => {
    if (existing) return { ...existing }
    const init = def.initialValues ? def.initialValues({ user, params }) : {}
    ;(def.fields || []).forEach((f) => { if (params.get(f.key) && !f.readOnly) init[f.key] = params.get(f.key) })
    return init
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const onChange = (k, v) => {
    setValues((s) => {
      let n = { ...s, [k]: v }
      const f = (def.fields || []).find((x) => x.key === k)
      if (f?.onChange) n = { ...n, ...f.onChange(v, n) }
      return n
    })
    setErrors((e) => ({ ...e, [k]: undefined }))
  }
  const visible = (def.fields || []).filter((f) => !f.computed && !(f.hideIf && f.hideIf(values)) && !(existing && f.createOnly) && !(f.editOnly && !existing))
  const sections = def.sections || [{ title: `${def.label} details`, fields: visible.map((f) => f.key) }]
  const byKey = fieldsByKey(def)
  const submit = (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = Object.fromEntries(visible.map((f) => [f.key, values[f.key]]))
    const res = existing ? updateRecord(def.id, existing.id, payload, user) : createRecord(def.id, payload, user)
    setSaving(false)
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success(`${def.label} ${res.record.number || ''} ${existing ? 'updated' : 'created'}`)
    navigate(`${def.basePath}/${res.record.id}`, { replace: true })
  }
  const preview = def.compute ? def.compute(values, { user }) : {}
  return (
    <form onSubmit={submit} noValidate>
      <PageHeader title={existing ? `Edit ${def.label.toLowerCase()} ${existing.number || ''}` : def.createLabel || `New ${def.label.toLowerCase()}`} description={def.formHint}
        actions={<Button variant="secondary" icon={ArrowLeft} to={existing ? `${def.basePath}/${existing.id}` : def.basePath}>Cancel</Button>} />
      <div className="space-y-5">
        {sections.map((s) => {
          const fs = s.fields.map((k) => byKey[k]).filter((f) => f && visible.includes(f))
          if (!fs.length) return null
          return (
            <Card key={s.title}>
              <CardHeader title={s.title} subtitle={s.subtitle} />
              <div className="grid gap-4 sm:grid-cols-2">
                {fs.map((f) => (f.type === 'lines'
                  ? <div key={f.key} className="sm:col-span-2"><LinesEditor f={f} values={values} onChange={onChange} errors={errors} /></div>
                  : <div key={f.key} className={cn(f.wide || f.type === 'textarea' || f.type === 'multilookup' ? 'sm:col-span-2' : '')}><FieldInput f={f} values={values} onChange={onChange} error={errors[f.key]} /></div>))}
              </div>
            </Card>
          )
        })}
        {def.computedSummary && (
          <Card><CardHeader title="Calculated" /><InfoList columns={3} items={def.computedSummary.map((k) => ({ label: byKey[k]?.label || k, value: formatFieldValue(byKey[k] || { type: 'money' }, preview[k], preview) }))} /></Card>
        )}
        {errors.form && <p className="text-sm text-danger" role="alert">{errors.form}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" to={existing ? `${def.basePath}/${existing.id}` : def.basePath}>Cancel</Button>
          <Button type="submit" icon={Save} loading={saving} data-testid="save-record">{existing ? 'Save changes' : `Create ${def.label.toLowerCase()}`}</Button>
        </div>
      </div>
    </form>
  )
}

/* ---------- DETAIL ---------- */
function ActionDialog({ def, rec, action, onClose, user }) {
  const [note, setNote] = useState('')
  const [values, setValues] = useState(() => (action.initialInputs ? action.initialInputs(rec) : {}))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const run = () => {
    setBusy(true)
    const res = runAction(def.id, rec.id, action.id, { note, values }, user)
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    toast.success(`${action.label}: ${def.label} ${res.record.number || ''}`)
    onClose(res.record)
  }
  return (
    <Modal open onClose={() => onClose(null)} title={`${action.label} — ${def.label} ${rec.number || ''}`} description={action.confirm || action.description} size={action.inputs?.some((i) => i.type === 'lines') ? 'xl' : 'md'}
      footer={<><Button variant="secondary" onClick={() => onClose(null)}>Cancel</Button><Button variant={action.tone === 'danger' ? 'danger' : 'primary'} loading={busy} onClick={run} data-testid="confirm-action">{action.label}</Button></>}>
      <div className="space-y-3">
        {(action.inputs || []).map((f) => (f.type === 'lines'
          ? <LinesEditor key={f.key} f={f} values={values} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />
          : <FieldInput key={f.key} f={f} values={values} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />))}
        {action.note !== 'none' && <Textarea label={action.note === 'required' ? 'Reason / note' : 'Note (optional)'} required={action.note === 'required'} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />}
        {error && <p className="text-sm text-danger" role="alert" data-testid="action-error">{error}</p>}
      </div>
    </Modal>
  )
}

function DetailView({ def, user, rec }) {
  const [tab, setTab] = useState('details')
  const [action, setAction] = useState(null)
  const F = def.fields || []
  const actions = availableActions(def, rec, user)
  const editable = isEditable(def, rec) && (canDo(def, 'edit', user) || (def.ownerEditOnly && rec.createdBy === user?.id && canDo(def, 'create', user)))
  const lineFields = F.filter((f) => f.type === 'lines')
  const info = F.filter((f) => f.type !== 'lines' && !(f.hideIf && f.hideIf(rec)) && !f.hideInDetail).map((f) => ({ label: f.label, value: formatFieldValue(f, rec[f.key], rec), span: f.type === 'textarea' || f.wide ? 2 : undefined }))
  const related = def.related ? def.related(rec) : []
  const Extra = def.detailExtra
  const tabs = [{ id: 'details', label: 'Details' }, ...(lineFields.length ? [{ id: 'lines', label: 'Lines' }] : []), { id: 'history', label: `History (${(rec.history || []).length})` }]
  return (
    <div>
      <PageHeader
        title={`${def.label} ${rec.number || ''}`.trim()}
        description={titleOf(def, rec)}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge def={def} status={rec.status} />
            {actions.map((a) => <Button key={a.id} size="sm" variant={a.tone === 'danger' ? 'danger' : a.tone === 'secondary' ? 'secondary' : 'primary'} icon={a.icon} onClick={() => setAction(a)} data-testid={`action-${a.id}`}>{a.label}</Button>)}
            {editable && <Button size="sm" variant="secondary" icon={Pencil} to={`${def.basePath}/${rec.id}/edit`}>Edit</Button>}
            <Button size="sm" variant="secondary" icon={ArrowLeft} to={def.basePath}>Back</Button>
          </div>
        )} />
      {def.summary && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {def.summary(rec).map((s) => <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon || Layers} tone={s.tone || 'brand'} hint={s.hint} />)}
        </div>
      )}
      {Extra && <div className="mb-5"><Extra rec={rec} def={def} user={user} /></div>}
      {(def.detailTables ? def.detailTables(rec, { user }) : []).filter(Boolean).map((t) => (
        <Card key={t.title} className="mb-5" data-testid="detail-table">
          <CardHeader title={t.title} subtitle={t.subtitle} />
          <SimpleTable columns={t.columns} rows={t.rows} empty={t.empty} rowTo={t.rowTo} caption={t.title} />
        </Card>
      ))}
      <Card>
        <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-4 -mx-5 px-5" />
        {tab === 'details' && (
          <div className="space-y-5">
            <InfoList columns={3} items={[...info, { label: 'Created', value: `${formatFieldValue({ type: 'datetime' }, rec.createdAt)} · ${rec.createdByName || ''}` }, { label: 'Last updated', value: formatFieldValue({ type: 'datetime' }, rec.updatedAt) }]} />
            {related.length > 0 && (
              <div className="border-t border-line pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"><Link2 size={14} aria-hidden />Related</p>
                <div className="flex flex-wrap gap-2">{related.filter(Boolean).map((r) => <Link key={r.to + r.label} to={r.to} className="rounded-lg border border-line px-2.5 py-1 text-sm text-brand hover:bg-surface-2">{r.label}</Link>)}</div>
              </div>
            )}
          </div>
        )}
        {tab === 'lines' && lineFields.map((f) => <div key={f.key} className="mb-4"><p className="mb-2 text-sm font-semibold text-ink">{f.label}</p><LinesTable f={f} lines={rec[f.key]} /></div>)}
        {tab === 'history' && (
          <Timeline items={[...(rec.history || [])].reverse().map((h, i) => ({ id: `${h.at}-${i}`, icon: History, title: `${h.action}${h.to && h.from !== h.to ? ` → ${def.statuses?.[h.to]?.label || h.to}` : ''}`, description: `${h.byName || h.by}${h.note ? ` — ${h.note}` : ''}`, at: h.at }))} />
        )}
      </Card>
      {action && <ActionDialog def={def} rec={rec} action={action} user={user} onClose={() => setAction(null)} />}
    </div>
  )
}

/**
 * Generic page for every enterprise module. The navigation entry tells it the module (by path) and the view:
 * list (`/x`), create (`/x/new`), detail (`/x/:id`) or edit (`/x/:id/edit`).
 */
export default function EnterpriseModulePage({ navItem }) {
  const { pathname } = useLocation()
  const { id } = useParams()
  const { user } = useAuth()
  const def = (navItem?.module && getModuleDef(navItem.module)) || moduleForPath(pathname)
  const records = useStoredValue(def?.key || '__none__', [])
  if (!def) return <NotFoundRecord entity="page" backTo="/dashboard" backLabel="Dashboard" />
  const view = navItem?.view || 'list'
  if (view === 'list') return <ListView def={def} user={user} />
  if (view === 'create') {
    if (!canDo(def, 'create', user)) return <Navigate to="/unauthorized" replace />
    return <FormView def={def} user={user} />
  }
  const rec = (Array.isArray(records) ? records : []).find((r) => r.id === id)
  if (!rec || !scopeFilter(def, user)(rec)) return <NotFoundRecord entity={def.label.toLowerCase()} backTo={def.basePath} backLabel={`Back to ${def.plural.toLowerCase()}`} />
  if (view === 'edit') {
    if (!isEditable(def, rec) || !(canDo(def, 'edit', user) || (def.ownerEditOnly && rec.createdBy === user?.id && canDo(def, 'create', user)))) return <Navigate to={`${def.basePath}/${rec.id}`} replace />
    return <FormView key={rec.id} def={def} user={user} existing={rec} />
  }
  return <DetailView key={rec.id} def={def} user={user} rec={rec} />
}
