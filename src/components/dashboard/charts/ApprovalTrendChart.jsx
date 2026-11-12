import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { ChartLegend } from '../ChartCard'
import { axisProps, gridProps, SERIES, tooltipProps } from './chartTheme'

export default function ApprovalTrendChart({ data, subtitle = 'Decisions per day, last 7 days' }) {
  const sum = (k) => data.reduce((s, d) => s + d[k], 0)
  return (
    <ChartCard
      title="Approval trend"
      subtitle={subtitle}
      isEmpty={!sum('approved') && !sum('returned') && !sum('rejected')}
      legend={<ChartLegend items={[{ label: 'Approved', color: SERIES.c1, value: sum('approved') }, { label: 'Returned', color: SERIES.c4, value: sum('returned') }, { label: 'Rejected', color: SERIES.c5, value: sum('rejected') }]} />}
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2} barCategoryGap="24%">
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} width={44} />
        <Tooltip {...tooltipProps} />
        <Bar dataKey="approved" name="Approved" fill={SERIES.c1} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="returned" name="Returned" fill={SERIES.c4} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="rejected" name="Rejected" fill={SERIES.c5} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ChartCard>
  )
}
