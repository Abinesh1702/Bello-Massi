/** Shared Recharts styling so every chart reads as one system. */
export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: 'var(--muted)', fontSize: 11 },
}

export const gridProps = { stroke: 'var(--chart-grid)', strokeDasharray: '3 3', vertical: false }

export const tooltipProps = {
  cursor: { fill: 'var(--surface-2)', stroke: 'var(--line)' },
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 10,
    fontSize: 12,
    color: 'var(--ink)',
  },
  itemStyle: { color: 'var(--ink)', padding: 0 },
  labelStyle: { color: 'var(--ink)', fontWeight: 600, marginBottom: 4 },
}

export const SERIES = {
  c1: 'var(--chart-1)',
  c2: 'var(--chart-2)',
  c3: 'var(--chart-3)',
  c4: 'var(--chart-4)',
  c5: 'var(--chart-5)',
}
