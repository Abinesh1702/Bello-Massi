import { Bot, Database, FlaskConical, Gauge, Info, ShieldCheck, Sigma } from 'lucide-react'
import Badge from '../common/Badge'
import { AI_STATUS_META, INSIGHT_STATUS_META, REPLENISHMENT_META, RISK_META, SEVERITY_META } from '../../config/aiConfig'
import { cn } from '../../utils/helpers'

export const ProviderStatusBadge = ({ status }) => {
  const m = AI_STATUS_META[status] || AI_STATUS_META.DEMO
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

export const DemoAiBadge = ({ className }) => (
  <Badge tone="accent" className={className}><FlaskConical size={12} aria-hidden /> Demo AI · rule-based</Badge>
)

/** Shown on every forecast / prediction produced by the browser engine. */
export const StatisticalBadge = ({ engine = 'PROTOTYPE', className }) => (engine === 'BACKEND'
  ? <Badge tone="info" className={className}><Sigma size={12} aria-hidden /> Backend ML service</Badge>
  : <Badge tone="accent" className={className}><Sigma size={12} aria-hidden /> Statistical model · not trained ML</Badge>)

export const RiskBadge = ({ risk }) => {
  const m = RISK_META[risk] || RISK_META.LOW
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

export const SeverityBadge = ({ severity }) => {
  const m = SEVERITY_META[severity] || SEVERITY_META.low
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

export const InsightStatusBadge = ({ status }) => {
  const m = INSIGHT_STATUS_META[status] || INSIGHT_STATUS_META.NEW
  return <Badge tone={m.tone}>{m.label}</Badge>
}

export const ReplenishmentStatusBadge = ({ status }) => {
  const m = REPLENISHMENT_META[status] || { label: status, tone: 'neutral' }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

export const EngineLabel = ({ meta }) => {
  if (!meta) return null
  return meta.demo
    ? <span className="inline-flex items-center gap-1 text-[11px] text-muted"><FlaskConical size={12} aria-hidden className="text-accent" /> {meta.label}</span>
    : <span className="inline-flex items-center gap-1 text-[11px] text-muted"><Bot size={12} aria-hidden className="text-success" /> {meta.label} · grounded on permitted data</span>
}

/** Data-source indicator. A source containing "demo" is highlighted. */
export const SourcesNote = ({ sources = [], className }) => {
  if (!sources?.length) return null
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted', className)}>
      <Database size={12} aria-hidden />
      <span className="font-medium">Data:</span>
      {sources.map((s) => {
        const label = typeof s === 'string' ? s : `${s.label}${s.from ? ` (${s.from} → ${s.to})` : ''}`
        return <span key={label} className={cn('rounded px-1.5 py-0.5', /demo|synthetic/i.test(label) ? 'bg-accent/15 text-ink' : 'bg-surface-2')}>{label}</span>
      })}
    </p>
  )
}

export const ConfidenceNote = ({ confidence }) => {
  if (!confidence) return null
  const tone = confidence.level === 'high' ? 'success' : confidence.level === 'medium' ? 'info' : 'warning'
  return (
    <p className="flex items-start gap-1.5 text-[11px] text-muted">
      <Gauge size={12} className="mt-0.5 shrink-0" aria-hidden />
      <span><Badge tone={tone}>{confidence.level} confidence</Badge> <span className="ml-1">{confidence.note}</span></span>
    </p>
  )
}

/** Data quality score 0–100 with its explanation. */
export const QualityMeter = ({ quality, compact }) => {
  if (!quality) return null
  const tone = quality.score >= 75 ? 'bg-success' : quality.score >= 50 ? 'bg-warning' : 'bg-danger'
  return (
    <div>
      <div className="flex items-center justify-between text-xs"><span className="text-muted">Data quality</span><span className="font-semibold tabular text-ink">{quality.score}/100 · {quality.label}</span></div>
      <div className="mt-1 h-1.5 rounded-full bg-surface-2" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={quality.score} aria-label="Data quality"><div className={cn('h-1.5 rounded-full', tone)} style={{ width: `${quality.score}%` }} /></div>
      {!compact && (
        <ul className="mt-2 space-y-1 text-[11px] text-muted">
          {quality.parts.map((p) => <li key={p.key} className="flex justify-between gap-2"><span>{p.label} ({p.weight}%)</span><span className="tabular">{Math.round(p.value * 100)}% · {p.detail}</span></li>)}
        </ul>
      )}
    </div>
  )
}

export const PrivacyNote = ({ children }) => (
  <p className="flex items-start gap-1.5 text-xs text-muted"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-success" aria-hidden /> <span>{children}</span></p>
)

export const InfoNote = ({ children, className }) => (
  <p className={cn('flex items-start gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted', className)}><Info size={14} className="mt-0.5 shrink-0" aria-hidden /> <span>{children}</span></p>
)
