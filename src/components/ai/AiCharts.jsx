import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisProps, gridProps, SERIES, tooltipProps } from '../dashboard/charts/chartTheme'
import { formatCompact, formatCompactCurrency, formatMoney, formatNumber } from '../../utils/formatters'
import { periodLabel } from '../../services/ml/timeSeries'

const COLORS = [SERIES.c1, SERIES.c3, SERIES.c2, SERIES.c4, SERIES.c5]
const fmt = (money) => (money ? (v) => formatCompactCurrency(v) : (v) => formatCompact(v))
const tip = (money) => (money ? (v) => (v === null || v === undefined ? '—' : formatMoney(v)) : (v) => (v === null || v === undefined ? '—' : formatNumber(v)))

/** Small chart inside an assistant answer. chart: { kind: bar|area|forecast, xKey, series, data, money } */
export function BlockChart({ chart, height = 220 }) {
  if (!chart?.data?.length) return null
  const { kind, xKey = 'name', series = [], data, money } = chart
  return (
    <div style={{ height }} role="img" aria-label="Chart of the answer data" className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {kind === 'forecast' ? (
          <ComposedChart data={data.map((d) => ({ ...d, band: d.lower !== undefined && d.lower !== null ? [d.lower, d.upper] : undefined }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={xKey} {...axisProps} interval="preserveStartEnd" minTickGap={24} />
            <YAxis {...axisProps} width={56} tickFormatter={fmt(money)} />
            <Tooltip {...tooltipProps} formatter={(v, n) => [Array.isArray(v) ? `${tip(money)(v[0])} – ${tip(money)(v[1])}` : tip(money)(v), n]} />
            <Area type="monotone" dataKey="band" name="Interval" stroke="none" fill={SERIES.c4} fillOpacity={0.18} isAnimationActive={false} />
            <Line type="monotone" dataKey="actual" name="Actual" stroke={SERIES.c1} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="forecast" name="Forecast" stroke={SERIES.c2} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          </ComposedChart>
        ) : kind === 'area' ? (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={xKey} {...axisProps} interval="preserveStartEnd" minTickGap={20} />
            <YAxis {...axisProps} width={56} tickFormatter={fmt(money)} />
            <Tooltip {...tooltipProps} formatter={(v) => tip(money)(v)} />
            {series.map((s, i) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />)}
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={xKey} {...axisProps} interval={0} angle={data.length > 5 ? -20 : 0} textAnchor={data.length > 5 ? 'end' : 'middle'} height={data.length > 5 ? 52 : 28} />
            <YAxis {...axisProps} width={56} tickFormatter={fmt(money)} />
            <Tooltip {...tooltipProps} formatter={(v) => tip(money)(v)} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={COLORS[i]} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />)}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Forecast detail chart: history, holdout backtest (predicted vs actual), forecast with interval,
 * and actuals that arrived after the forecast was generated.
 */
export function ForecastChart({ forecast, actuals = {}, height = 320, historyPoints = 90 }) {
  if (!forecast) return null
  const g = forecast.granularity
  const money = forecast.request?.target === 'revenue'
  const hk = forecast.history.keys.slice(-historyPoints)
  const hv = forecast.history.values.slice(-historyPoints)
  const bt = forecast.backtest ? Object.fromEntries(forecast.backtest.keys.map((k, i) => [k, forecast.backtest.predicted[i]])) : {}
  const data = [
    ...hk.map((k, i) => ({ key: k, label: periodLabel(k, g), actual: hv[i], backtest: bt[k] ?? null })),
    ...forecast.predictions.map((p) => ({ key: p.key, label: periodLabel(p.key, g), forecast: p.value, band: p.lower !== null ? [p.lower, p.upper] : undefined, actual: actuals[p.key] ?? null })),
  ]
  return (
    <div style={{ height }} role="img" aria-label={`${forecast.name}: history and forecast chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={28} />
          <YAxis {...axisProps} width={60} tickFormatter={fmt(money)} />
          <Tooltip {...tooltipProps} formatter={(v, n) => [Array.isArray(v) ? `${tip(money)(v[0])} – ${tip(money)(v[1])}` : tip(money)(v), n]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="band" name={`${forecast.confidenceLevel || 95}% interval (approx.)`} stroke="none" fill={SERIES.c4} fillOpacity={0.2} isAnimationActive={false} />
          <Line type="monotone" dataKey="actual" name="Actual" stroke={SERIES.c1} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="backtest" name="Backtest prediction" stroke={SERIES.c3} strokeWidth={2} strokeDasharray="2 3" dot={false} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="forecast" name="Forecast" stroke={SERIES.c2} strokeWidth={2.5} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
