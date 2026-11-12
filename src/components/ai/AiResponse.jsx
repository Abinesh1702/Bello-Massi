import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, CheckCircle2, Download, ShieldAlert, XCircle } from 'lucide-react'
import Button from '../common/Button'
import Textarea from '../common/Textarea'
import { BlockChart } from './AiCharts'
import { ConfidenceNote, EngineLabel, SourcesNote } from './AiBadges'
import { cn } from '../../utils/helpers'
import { downloadCsv, csvFilename } from '../../services/csvService'

const KpiRow = ({ kpis }) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {kpis.map((k) => {
      const body = (
        <>
          <p className="truncate text-[11px] text-muted">{k.label}</p>
          <p className="mt-0.5 truncate text-base font-semibold tabular text-ink">{k.value}</p>
          {k.hint && <p className="truncate text-[11px] text-muted">{k.hint}</p>}
        </>
      )
      return k.path
        ? <Link key={k.label} to={k.path} className="rounded-lg border border-line bg-surface-2 px-3 py-2 hover:border-brand/30">{body}</Link>
        : <div key={k.label} className="rounded-lg border border-line bg-surface-2 px-3 py-2">{body}</div>
    })}
  </div>
)

const ResultTable = ({ table, title }) => (
  <div className="overflow-x-auto scroll-thin rounded-lg border border-line">
    <table className="min-w-full text-xs">
      <thead className="bg-surface-2 text-muted">
        <tr>{table.columns.map((c) => <th key={c.key} scope="col" className={cn('whitespace-nowrap px-3 py-2 font-medium', c.align === 'right' ? 'text-right' : 'text-left')}>{c.label}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-line">
        {table.rows.map((r) => (
          <tr key={r.id} className="hover:bg-surface-2/60">
            {table.columns.map((c, i) => (
              <td key={c.key} className={cn('px-3 py-2 align-top', c.align === 'right' ? 'text-right tabular whitespace-nowrap' : 'text-left')}>
                {i === 0 && r._path ? <Link to={r._path} className="font-medium text-brand hover:underline">{r[c.key]}</Link> : r[c.key] ?? '—'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    {table.total > table.rows.length && <p className="border-t border-line px-3 py-1.5 text-[11px] text-muted">Showing {table.rows.length} of {table.total}{title ? ` · ${title}` : ''}</p>}
  </div>
)

export function ProposalCard({ proposal, onResolve, busy }) {
  const [reason, setReason] = useState(proposal?.args?.reason || '')
  const [error, setError] = useState('')
  if (!proposal) return null
  const done = proposal.status !== 'pending'
  const go = async (confirm) => {
    if (confirm && proposal.needsReason && !reason.trim()) { setError('A reason is required.'); return }
    setError('')
    await onResolve(confirm, reason.trim())
  }
  return (
    <div className={cn('rounded-xl border p-3', done ? 'border-line bg-surface-2' : 'border-warning/50 bg-warning/5')} data-testid="ai-proposal">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink"><ShieldAlert size={16} className="text-warning" aria-hidden /> Confirmation required · {proposal.label}</p>
      <p className="mt-1 text-sm text-ink">{proposal.summary}</p>
      {proposal.affected?.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Affected record{proposal.affected.length > 1 ? 's' : ''}</p>
          <ul className="mt-1 space-y-0.5 text-xs text-ink">{proposal.affected.slice(0, 12).map((a) => <li key={a}>• {a}</li>)}{proposal.affected.length > 12 && <li className="text-muted">…and {proposal.affected.length - 12} more</li>}</ul>
        </div>
      )}
      {!done && proposal.needsReason && <Textarea className="mt-2" label="Reason" required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} error={error} />}
      {done ? (
        <p className={cn('mt-2 flex items-center gap-1.5 text-xs font-medium', proposal.status === 'confirmed' ? 'text-success' : 'text-muted')}>
          {proposal.status === 'confirmed' ? <CheckCircle2 size={14} aria-hidden /> : <XCircle size={14} aria-hidden />} {proposal.status === 'confirmed' ? 'Confirmed and executed' : 'Cancelled — nothing changed'}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => go(true)} loading={busy}>{proposal.kind === 'handoff' ? 'Confirm & open screen' : 'Confirm'}</Button>
          <Button size="sm" variant="secondary" onClick={() => go(false)} disabled={busy}>Cancel</Button>
        </div>
      )}
    </div>
  )
}

/**
 * Renders an assistant answer. onAction(action) handles navigate / tool actions;
 * onSuggestion(text) sends a suggested question; onResolve(confirm, reason) handles proposals.
 */
export default function AiResponse({ message, onAction, onSuggestion, onResolve, busy, compact = false }) {
  const b = message.blocks || {}
  return (
    <div className="space-y-3">
      {b.title && !compact && <p className="text-xs font-semibold uppercase tracking-wide text-muted">{b.title}</p>}
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{message.content ?? message.text}</p>
      {b.dataSummary && <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted"><span className="font-medium">Computed from your data:</span> {b.dataSummary}</p>}
      {b.kpis?.length > 0 && <KpiRow kpis={b.kpis} />}
      {b.chart && !compact && <BlockChart chart={b.chart} />}
      {b.table && <ResultTable table={compact ? { ...b.table, rows: b.table.rows.slice(0, 5), total: b.table.total || b.table.rows.length } : b.table} title={b.title} />}
      {b.warnings?.length > 0 && (
        <ul className="space-y-1">{b.warnings.map((w) => <li key={w} className="flex items-start gap-1.5 text-xs text-warning"><AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden /> <span className="text-ink">{w}</span></li>)}</ul>
      )}
      {message.proposal && <ProposalCard proposal={message.proposal} onResolve={onResolve} busy={busy} />}
      {b.actions?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {b.actions.map((a) => {
            if (a.type === 'download') {
              return b.table ? <Button key={a.label} size="xs" variant="secondary" icon={Download} onClick={() => downloadCsv(csvFilename('ai-answer'), b.table.rows, b.table.columns.map((c) => ({ header: c.label, value: (r) => r[c.key] ?? '' })))}>{a.label}</Button> : null
            }
            return <Button key={a.label} size="xs" variant={a.type === 'tool' ? 'primary' : 'secondary'} iconRight={a.type === 'navigate' ? ArrowUpRight : undefined} onClick={() => onAction?.(a)}>{a.label}</Button>
          })}
        </div>
      )}
      {b.suggestions?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {b.suggestions.map((s) => <button key={s} type="button" onClick={() => onSuggestion?.(s)} className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-ink hover:border-brand/40 hover:bg-surface-2">{s}</button>)}
        </div>
      )}
      <div className="space-y-1">
        <ConfidenceNote confidence={b.confidence} />
        <SourcesNote sources={b.sources} />
        <EngineLabel meta={message.meta} />
      </div>
    </div>
  )
}
