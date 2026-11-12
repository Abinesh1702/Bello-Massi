import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { Link } from 'react-router-dom'
import Card, { CardHeader } from '../../common/Card'
import EmptyState from '../../common/EmptyState'
import { tooltipProps } from './chartTheme'
import { ResponsiveContainer } from 'recharts'

/** Donut with an HTML legend carrying counts + share (identity never colour-alone). */
export default function StatusDonutChart({ data, title = 'Order status distribution', subtitle = 'All orders by lifecycle stage', linkTo, linkLabel = 'View orders', centerLabel = 'orders', formatValue = (v) => v, formatTotal }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} action={linkTo && <Link to={linkTo} className="text-xs font-medium text-brand hover:underline">{linkLabel}</Link>} />
      {!total ? (
        <EmptyState compact title="Nothing to show yet" />
      ) : (
        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-5">
          <div className="relative h-[170px] w-[170px] shrink-0" role="img" aria-label={`${title}: ${data.map((d) => `${d.name} ${d.value}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="100%" paddingAngle={1.5} stroke="var(--surface)" strokeWidth={2} isAnimationActive={false}>
                  {data.map((d) => <Cell key={d.key || d.name} fill={d.color} />)}
                </Pie>
                <Tooltip {...tooltipProps} formatter={(v, n) => [formatValue(v), n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className={`${formatTotal ? 'text-base' : 'text-2xl'} font-semibold text-ink tabular leading-none`}>{formatTotal ? formatTotal(total) : total}</p>
                <p className="text-[11px] text-muted mt-1">{centerLabel}</p>
              </div>
            </div>
          </div>
          <ul className="w-full space-y-2">
            {data.map((d) => (
              <li key={d.key || d.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} aria-hidden />
                <span className="flex-1 truncate text-muted">{d.name}</span>
                <span className="font-semibold text-ink tabular">{formatValue(d.value)}</span>
                <span className="w-10 text-right text-xs text-muted tabular">{Math.round((d.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
