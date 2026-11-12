import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { ChartLegend } from '../ChartCard'
import { axisProps, gridProps, tooltipProps } from './chartTheme'

/**
 * Stacked bars for outcome breakdowns (delivered / partial / failed).
 * series: [{ key, label, color }] in fixed order — colours follow the outcome, never its rank.
 */
export default function StackedBarChart({ title, subtitle, data, xKey = 'name', series, height = 260, action, layout = 'horizontal' }) {
  const total = data.reduce((s, d) => s + series.reduce((x, k) => x + (Number(d[k.key]) || 0), 0), 0)
  const vertical = layout === 'vertical'
  return (
    <ChartCard title={title} subtitle={subtitle} action={action} height={height} isEmpty={!total}
      legend={<ChartLegend items={series.map((s) => ({ label: s.label, color: s.color, value: data.reduce((x, d) => x + (Number(d[s.key]) || 0), 0) }))} />}>
      <BarChart data={data} layout={vertical ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 12, left: vertical ? 8 : -18, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid {...gridProps} horizontal={!vertical} vertical={vertical} />
        {vertical ? <XAxis type="number" {...axisProps} allowDecimals={false} /> : <XAxis dataKey={xKey} {...axisProps} interval="preserveStartEnd" minTickGap={12} />}
        {vertical ? <YAxis type="category" dataKey={xKey} {...axisProps} width={110} /> : <YAxis {...axisProps} allowDecimals={false} width={44} />}
        <Tooltip {...tooltipProps} />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} stackId="s" fill={s.color} stroke="var(--surface)" strokeWidth={1} maxBarSize={vertical ? 22 : 36}
            radius={i === series.length - 1 ? (vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0} />
        ))}
      </BarChart>
    </ChartCard>
  )
}
