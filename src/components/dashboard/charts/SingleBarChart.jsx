import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from '../ChartCard'
import { axisProps, gridProps, SERIES, tooltipProps } from './chartTheme'

/** Single-series horizontal bar chart (one hue — magnitude by category). */
export default function SingleBarChart({ title, subtitle, data, dataKey = 'value', nameKey = 'name', valueFormatter = (v) => v, height = 240, seriesName = 'Value', action }) {
  const total = data.reduce((s, d) => s + (d[dataKey] || 0), 0)
  return (
    <ChartCard title={title} subtitle={subtitle} isEmpty={!total} height={height} action={action}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" {...axisProps} allowDecimals={false} tickFormatter={valueFormatter} />
        <YAxis type="category" dataKey={nameKey} {...axisProps} width={112} />
        <Tooltip {...tooltipProps} formatter={(v) => [valueFormatter(v), seriesName]} />
        <Bar dataKey={dataKey} name={seriesName} fill={SERIES.c1} radius={[0, 4, 4, 0]} maxBarSize={20}>
          <LabelList dataKey={dataKey} position="right" formatter={valueFormatter} style={{ fill: 'var(--ink)', fontSize: 11, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ChartCard>
  )
}
