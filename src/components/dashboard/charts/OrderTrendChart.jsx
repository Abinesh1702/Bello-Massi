import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { ChartLegend } from '../ChartCard'
import { axisProps, gridProps, SERIES, tooltipProps } from './chartTheme'

export default function OrderTrendChart({ data, title = 'Order trend', subtitle = 'Orders created and delivered per day' }) {
  const total = data.reduce((s, d) => s + d.created, 0)
  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      isEmpty={!total}
      legend={<ChartLegend items={[{ label: 'Created', color: SERIES.c1, value: total }, { label: 'Delivered', color: SERIES.c3, value: data.reduce((s, d) => s + d.delivered, 0) }]} />}
    >
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES.c1} stopOpacity={0.22} />
            <stop offset="100%" stopColor={SERIES.c1} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" minTickGap={18} />
        <YAxis {...axisProps} allowDecimals={false} width={44} />
        <Tooltip {...tooltipProps} cursor={{ stroke: 'var(--muted)', strokeDasharray: '3 3' }} />
        <Area type="monotone" dataKey="created" name="Created" stroke={SERIES.c1} strokeWidth={2} fill="url(#gCreated)" activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} />
        <Area type="monotone" dataKey="delivered" name="Delivered" stroke={SERIES.c3} strokeWidth={2} fill="none" activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} />
      </AreaChart>
    </ChartCard>
  )
}
