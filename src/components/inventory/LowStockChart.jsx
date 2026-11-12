import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { ChartLegend } from '../dashboard/ChartCard'
import { axisProps, gridProps, SERIES, tooltipProps } from '../dashboard/charts/chartTheme'

/** Low vs out-of-stock lines per hub (stacked). */
export default function LowStockChart({ data }) {
  const total = data.reduce((s, d) => s + d.low + d.out, 0)
  return (
    <ChartCard
      title="Low stock overview"
      subtitle="Stock lines at or below reorder level, by hub"
      isEmpty={!total}
      emptyText="Every stock line is above its reorder level."
      legend={<ChartLegend items={[{ label: 'Low stock', color: SERIES.c4, value: data.reduce((s, d) => s + d.low, 0) }, { label: 'Out of stock', color: SERIES.c5, value: data.reduce((s, d) => s + d.out, 0) }]} />}
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="32%">
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="name" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} width={44} />
        <Tooltip {...tooltipProps} />
        <Bar dataKey="low" name="Low stock" stackId="s" fill={SERIES.c4} stroke="var(--surface)" strokeWidth={1} maxBarSize={36} />
        <Bar dataKey="out" name="Out of stock" stackId="s" fill={SERIES.c5} stroke="var(--surface)" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ChartCard>
  )
}
