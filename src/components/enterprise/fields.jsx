import { Plus, Trash2 } from 'lucide-react'
import Input from '../common/Input'
import Select from '../common/Select'
import Textarea from '../common/Textarea'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { optionsFor, labelFor, recordFor } from '../../services/enterprise/lookupService'
import { formatDate, formatDateTime, formatMoney, formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const NUMERIC = ['number', 'money', 'percent', 'integer']
const SPAN = { 1: 'sm:col-span-1', 2: 'sm:col-span-2', 3: 'sm:col-span-3', 4: 'sm:col-span-4', 5: 'sm:col-span-5', 6: 'sm:col-span-6', 8: 'sm:col-span-8', 11: 'sm:col-span-11', 12: 'sm:col-span-12' }

/** Display a stored value according to its field definition. */
export function formatFieldValue(f, v, rec) {
  if (f.render) return f.render(v, rec)
  if (v === null || v === undefined || v === '') return '—'
  switch (f.type) {
    case 'money': return formatMoney(v)
    case 'number': case 'integer': return formatNumber(v)
    case 'percent': return `${Number(v).toFixed(1)}%`
    case 'date': return formatDate(v)
    case 'datetime': return formatDateTime(v)
    case 'boolean': return v ? 'Yes' : 'No'
    case 'lookup': return labelFor(f.lookup, v)
    case 'multilookup': return (v || []).map((x) => labelFor(f.lookup, x)).join(', ') || '—'
    case 'select': return (f.options || []).find((o) => (o.value ?? o) === v)?.label ?? String(v)
    case 'lines': return `${(v || []).length} line${(v || []).length === 1 ? '' : 's'}`
    default: return String(v)
  }
}

const optionList = (f, values) => {
  if (f.type === 'select') return (f.options || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  const opts = optionsFor(f.lookup).filter((o) => !f.filter || f.filter(o.record, values))
  return opts.filter((o) => !o.inactive || o.value === values?.[f.key]).map((o) => ({ value: o.value, label: o.label }))
}

/** One form control for a field definition. */
export function FieldInput({ f, values, onChange, error }) {
  const v = values[f.key]
  const set = (val) => onChange(f.key, val)
  const common = { label: f.label, hint: f.help, error, required: f.required, id: `fld-${f.key}`, disabled: f.readOnly }
  if (f.type === 'textarea') return <Textarea {...common} rows={f.rows || 3} value={v ?? ''} onChange={(e) => set(e.target.value)} />
  if (f.type === 'select' || f.type === 'lookup') return <Select {...common} value={v ?? ''} placeholder={f.placeholder || `Select ${f.label.toLowerCase()}…`} options={optionList(f, values)} onChange={(e) => set(e.target.value)} />
  if (f.type === 'multilookup') {
    const opts = optionList(f, values)
    const sel = new Set(v || [])
    return (
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-ink">{f.label}{f.required && <span className="text-danger ml-0.5">*</span>}</legend>
        <div className="max-h-40 overflow-auto rounded-lg border border-line p-2 scroll-thin">
          {opts.map((o) => (
            <label key={o.value} className="flex items-center gap-2 py-0.5 text-sm text-ink-2">
              <input type="checkbox" className="h-4 w-4 accent-[#232B5F]" checked={sel.has(o.value)} onChange={() => { const n = new Set(sel); if (n.has(o.value)) n.delete(o.value); else n.add(o.value); set([...n]) }} />{o.label}
            </label>
          ))}
        </div>
        {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      </fieldset>
    )
  }
  if (f.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 pt-6 text-sm text-ink">
        <input type="checkbox" className="h-4 w-4 accent-[#232B5F]" checked={Boolean(v)} onChange={(e) => set(e.target.checked)} disabled={f.readOnly} />{f.label}
      </label>
    )
  }
  const type = NUMERIC.includes(f.type) ? 'number' : f.type === 'date' ? 'date' : f.type === 'datetime' ? 'datetime-local' : f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : 'text'
  const step = f.type === 'money' ? '0.01' : f.type === 'integer' ? '1' : f.type === 'number' || f.type === 'percent' ? 'any' : undefined
  return <Input {...common} type={type} step={step} min={f.min} max={f.max} value={v ?? ''} onChange={(e) => set(e.target.value)} />
}

/** Editable line items (products, quantities, prices…). */
export function LinesEditor({ f, values, onChange, errors = {} }) {
  const lines = values[f.key] || []
  const setLines = (next) => onChange(f.key, next)
  const update = (i, key, val) => {
    const next = lines.map((ln, j) => (j === i ? { ...ln, [key]: val } : ln))
    // Default prices etc. from the chosen record (e.g. product purchase price)
    const col = f.columns.find((c) => c.key === key)
    if (col?.type === 'lookup' && col.fill) {
      const rec = recordFor(col.lookup, val)
      if (rec) Object.entries(col.fill(rec, values)).forEach(([k, x]) => { if (next[i][k] === undefined || next[i][k] === '' || next[i][k] === 0) next[i][k] = x })
    }
    setLines(next)
  }
  const blank = Object.fromEntries(f.columns.map((c) => [c.key, c.default ?? '']))
  return (
    <div className="space-y-2" data-testid={`lines-${f.key}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{f.label}{f.required && <span className="text-danger ml-0.5">*</span>}</p>
        {!f.readOnly && <Button size="xs" variant="secondary" icon={Plus} onClick={() => setLines([...lines, { ...blank }])}>Add line</Button>}
      </div>
      {errors[f.key] && <p className="text-xs text-danger" role="alert">{errors[f.key]}</p>}
      {lines.length === 0 ? <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-muted">No lines yet.</p> : (
        <div className="space-y-2">
          {lines.map((ln, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface-2/40 p-2.5 sm:grid-cols-12 sm:items-end">
              {f.columns.map((c) => {
                const err = errors[`${f.key}.${i}.${c.key}`]
                const span = c.span || (c.type === 'lookup' ? 4 : 2)
                const cf = { ...c, label: c.label, required: c.required }
                return (
                  <div key={c.key} className={cn('col-span-2', SPAN[span] || 'sm:col-span-2')}>
                    {c.computed ? (
                      <div className="text-sm"><p className="text-xs text-muted">{c.label}</p><p className="h-9 py-2 font-medium tabular text-ink">{formatFieldValue(c, c.computed(ln), ln)}</p></div>
                    ) : <FieldInput f={cf} values={ln} onChange={(k, val) => update(i, k, val)} error={err} />}
                  </div>
                )
              })}
              {!f.readOnly && (
                <div className="col-span-2 flex justify-end sm:col-span-1">
                  <button type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger" aria-label={`Remove line ${i + 1}`}><Trash2 size={15} aria-hidden /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Read-only line table for the detail page. */
export function LinesTable({ f, lines = [] }) {
  if (!lines.length) return <p className="text-sm text-muted">No lines.</p>
  const cols = f.columns.filter((c) => !c.hideInTable)
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
          <th className="py-2 pr-3">#</th>{cols.map((c) => <th key={c.key} className={cn('py-2 pr-3', ['money', 'number', 'integer', 'percent'].includes(c.type) && 'text-right')}>{c.label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-line">
          {lines.map((ln, i) => (
            <tr key={i}>
              <td className="py-2 pr-3 text-muted tabular">{i + 1}</td>
              {cols.map((c) => <td key={c.key} className={cn('py-2 pr-3 text-ink-2', ['money', 'number', 'integer', 'percent'].includes(c.type) && 'text-right tabular')}>{formatFieldValue(c, c.computed ? c.computed(ln) : ln[c.key], ln)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatusBadge({ def, status }) {
  const m = def.statuses?.[status] || { label: status, tone: 'neutral' }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}
