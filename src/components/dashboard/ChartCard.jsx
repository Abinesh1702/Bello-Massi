import { ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'
import Card, { CardHeader } from '../common/Card'
import EmptyState from '../common/EmptyState'

/** Card wrapper for a Recharts chart with consistent header, height and empty state. */
export default function ChartCard({ title, subtitle, action, height = 260, isEmpty, emptyText = 'No data for this period.', children, legend, className }) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      {legend}
      {isEmpty ? (
        <div style={{ height }} className="grid place-items-center">
          <EmptyState compact icon={BarChart3} title="Nothing to chart yet" description={emptyText} />
        </div>
      ) : (
        <div style={{ height }} role="img" aria-label={`${title} chart`}>
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

/** HTML legend (keeps text in ink tokens; colour only on the swatch). items: [{ label, color, value? }] */
export function ChartLegend({ items }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} aria-hidden />
          {i.label}
          {i.value !== undefined && <span className="font-semibold text-ink tabular">{i.value}</span>}
        </li>
      ))}
    </ul>
  )
}
