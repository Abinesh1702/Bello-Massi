import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { ChartLegend } from '../ChartCard'
import { axisProps, gridProps, SERIES, tooltipProps } from './chartTheme'
import { formatPercent } from '../../../utils/formatters'

export default function DeliveryPerformanceChart({ data, onTimeRate }) {
  const total = data.reduce((s, d) => s + d.onTime + d.late + d.problem, 0)
  return (
    <ChartCard
      title="Delivery performance"
      subtitle={`By hub · ${formatPercent(onTimeRate)} delivered on time`}
      isEmpty={!total}
      legend={<ChartLegend items={[{ label: 'On time', color: SERIES.c3 }, { label: 'Late', color: SERIES.c4 }, { label: 'Problem', color: SERIES.c5 }]} />}
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="32%">
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="hub" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} width={44} />
        <Tooltip {...tooltipProps} />
        <Bar dataKey="onTime" name="On time" stackId="d" fill={SERIES.c3} stroke="var(--surface)" strokeWidth={1} maxBarSize={36} />
        <Bar dataKey="late" name="Late" stackId="d" fill={SERIES.c4} stroke="var(--surface)" strokeWidth={1} maxBarSize={36} />
        <Bar dataKey="problem" name="Problem" stackId="d" fill={SERIES.c5} stroke="var(--surface)" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ChartCard>
  )
}
