import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Download, Printer, RefreshCw, Star, Columns3, Layers, Info, Ban, SearchX, FilterX } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import Checkbox from '../../components/common/Checkbox'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { SearchInput, FilterSelect, FilterInput } from '../../components/common/FilterToolbar'
import ChartCard from '../../components/dashboard/ChartCard'
import { axisProps, gridProps, SERIES, tooltipProps } from '../../components/dashboard/charts/chartTheme'
import { useAuth } from '../../hooks/useAuth'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../utils/constants'
import { sortRows } from '../../hooks/useTableQuery'
import {
  buildReportContext, canViewReport, categoryOf, getReport, getReportPrefs, recordReportView, runReport, toggleFavoriteReport,
} from '../../services/reportService'
import { downloadCsv } from '../../services/csvService'
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent } from '../../utils/formatters'

const FILTER_FIELDS = [
  ['customer', 'Customer'], ['supplier', 'Supplier'], ['product', 'Product'], ['category', 'Category'], ['hub', 'Hub'], ['warehouse', 'Warehouse'],
  ['salesman', 'Salesman'], ['driver', 'Driver'], ['vehicle', 'Vehicle'], ['status', 'Status'], ['zone', 'Zone'],
]
const EMPTY = {}
const ISO = /^\d{4}-\d{2}-\d{2}$/
const BAD = /(fail|reject|cancel|overdue|expired|out of stock|late|missed|danger|critical|high)/i
const WARN = /(pending|low|partial|draft|submitted|expiring|warning|medium|returned|busy)/i
const GOOD = /(deliver|complete|approved|verified|on time|connected|in stock|valid|received|written off|positive|active|success)/i
const toneOf = (v) => (BAD.test(v) ? 'danger' : WARN.test(v) ? 'warning' : GOOD.test(v) ? 'success' : 'neutral')

export const formatCell = (type, v) => {
  if (v === null || v === undefined || v === '') return '—'
  switch (type) {
    case 'currency': return formatCurrency(v)
    case 'number': return formatNumber(v)
    case 'percent': return formatPercent(v, 1)
    case 'date': return formatDate(v)
    case 'datetime': return formatDateTime(v)
    default: return String(v)
  }
}

export default function ReportViewer() {
  const { id } = useParams()
  const { user } = useAuth()
  const report = getReport(id)
  if (!report || !canViewReport(user, report)) return <NotFoundRecord entity="report" backTo="/reports/center" backLabel="All reports" />
  return <Viewer key={id} report={report} />
}

function Viewer({ report }) {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const prefsAll = useStoredValue(STORAGE_KEYS.REPORT_PREFS, EMPTY)
  const isFav = getReportPrefs(user.id, prefsAll).favorites.includes(report.id)
  const [version, setVersion] = useState(0)
  const [refreshedAt, setRefreshedAt] = useState(() => new Date().toISOString())
  const { rows: allRows, columns, error } = useMemo(() => runReport(report, buildReportContext(user)), [report, user, version]) // eslint-disable-line react-hooks/exhaustive-deps
  const [q, setQ] = useState('')
  // Links from dashboards, insights and the AI assistant can open a report for a period (?from=YYYY-MM-DD&to=…)
  const [f, setF] = useState(() => ({ from: ISO.test(params.get('from') || '') ? params.get('from') : '', to: ISO.test(params.get('to') || '') ? params.get('to') : '', month: '', year: '' }))
  const [hidden, setHidden] = useState([])
  const [groupBy, setGroupBy] = useState('')
  const [sort, setSort] = useState({ key: '', dir: 'asc' })
  const [page, setPage] = useState(0)
  const [printAll, setPrintAll] = useState(false)
  const [showCols, setShowCols] = useState(false)

  useEffect(() => { recordReportView(user.id, report.id) }, [user.id, report.id])
  useEffect(() => {
    if (!printAll) return undefined
    const t = window.setTimeout(() => { window.print(); setPrintAll(false) }, 150)
    return () => window.clearTimeout(t)
  }, [printAll])

  const hasDate = allRows.some((r) => r.date)
  const months = useMemo(() => [...new Set(allRows.map((r) => (r.date ? String(r.date).slice(0, 7) : '')).filter(Boolean))].sort().reverse(), [allRows])
  const years = [...new Set(months.map((m) => m.slice(0, 4)))]
  const dynFilters = FILTER_FIELDS.map(([key, label]) => ({ key, label, options: [...new Set(allRows.map((r) => r[key]).filter((v) => v !== undefined && v !== null && v !== ''))].map(String).sort() }))
    .filter((d) => d.options.length > 1 || (d.options.length === 1 && allRows.length > 1 && f[d.key]))
  const setFilter = (k, v) => { setF((x) => ({ ...x, [k]: v })); setPage(0) }

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase()
    const out = allRows.filter((r) => {
      if (f.from && (!r.date || r.date < f.from)) return false
      if (f.to && (!r.date || r.date > f.to)) return false
      if (f.month && String(r.date || '').slice(0, 7) !== f.month) return false
      if (f.year && String(r.date || '').slice(0, 4) !== f.year) return false
      if (FILTER_FIELDS.some(([k]) => f[k] && String(r[k] ?? '') !== f[k])) return false
      if (ql && !columns.some((c) => String(r[c.key] ?? '').toLowerCase().includes(ql))) return false
      return true
    })
    return sort.key ? sortRows(out, sort.key, sort.dir) : out
  }, [allRows, f, q, columns, sort])

  const visibleCols = columns.filter((c) => !hidden.includes(c.key))
  const sumCols = columns.filter((c) => c.sum)
  const totals = Object.fromEntries(sumCols.map((c) => [c.key, rows.reduce((s, r) => s + (Number(r[c.key]) || 0), 0)]))
  const groupCols = columns.filter((c) => ['text', 'badge', 'date'].includes(c.type))
  const grouped = useMemo(() => {
    if (!groupBy) return null
    const m = new Map()
    rows.forEach((r) => { const k = r[groupBy] ?? '—'; if (!m.has(k)) m.set(k, []); m.get(k).push(r) })
    return [...m.entries()].map(([k, list]) => ({ id: String(k), group: k, count: list.length, ...Object.fromEntries(sumCols.map((c) => [c.key, list.reduce((s, r) => s + (Number(r[c.key]) || 0), 0)])) }))
      .sort((a, b) => b.count - a.count)
  }, [groupBy, rows, sumCols])

  const chartData = useMemo(() => {
    if (!report.chart) return []
    const { by, value, sort: chartSort } = report.chart
    const m = new Map()
    rows.forEach((r) => { const k = r[by] || '—'; m.set(k, (m.get(k) || 0) + (value === 'count' ? 1 : Number(r[value]) || 0)) })
    let data = [...m.entries()].map(([name, v]) => ({ name: String(name), value: Math.round(v * 100) / 100 }))
    data = chartSort === 'label' ? data.sort((a, b) => (a.name < b.name ? -1 : 1)).slice(-14) : data.sort((a, b) => b.value - a.value).slice(0, 12)
    return data
  }, [report.chart, rows])
  const chartCol = report.chart ? columns.find((c) => c.key === report.chart.value) : null
  const chartFmt = (v) => (chartCol ? formatCell(chartCol.type, v) : formatNumber(v))

  const kpis = report.kpis ? report.kpis(rows) : [{ label: 'Records', value: rows.length, type: 'number' }, ...sumCols.slice(0, 3).map((c) => ({ label: c.label, value: totals[c.key], type: c.type }))]
  const activeFilters = Object.values(f).filter(Boolean).length + (q ? 1 : 0)
  const fileBase = `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${dayjs().format('YYYY-MM-DD')}`

  const onExport = () => {
    const src = grouped || rows
    const cols = grouped
      ? [{ header: columns.find((c) => c.key === groupBy)?.label || 'Group', value: (r) => r.group }, { header: 'Records', value: (r) => r.count }, ...sumCols.map((c) => ({ header: c.label, value: (r) => r[c.key] }))]
      : visibleCols.map((c) => ({ header: c.label, value: (r) => (r[c.key] ?? '') }))
    const n = downloadCsv(`bellomassi-${fileBase}.csv`, src, cols)
    if (n) toast.success(`Exported ${n} row${n === 1 ? '' : 's'}`, { description: `bellomassi-${fileBase}.csv` })
    else if (!src.length) toast.error('Nothing to export — the report has no rows for these filters.')
  }
  const refresh = () => { setVersion((v) => v + 1); setRefreshedAt(new Date().toISOString()); toast.success('Report refreshed from the latest data') }
  const reset = () => { setF({ from: '', to: '', month: '', year: '' }); setQ(''); setPage(0) }
  const cat = categoryOf(report.category)

  const tableColumns = visibleCols.map((c) => ({
    key: c.key, header: c.label, sortable: true, align: ['currency', 'number', 'percent'].includes(c.type) ? 'right' : 'left',
    render: (r) => {
      const v = r[c.key]
      if (c.type === 'badge' && v) return <Badge tone={toneOf(String(v))}>{String(v)}</Badge>
      if (c === visibleCols[0] && r.link) return <Link to={r.link} className="font-medium text-brand hover:underline">{formatCell(c.type, v)}</Link>
      return <span className={['currency', 'number', 'percent'].includes(c.type) ? 'tabular' : ''}>{formatCell(c.type, v)}</span>
    },
  }))

  return (
    <>
      <PageHeader title={report.title} description={report.description}
        actions={<div className="no-print flex flex-wrap gap-2">
          <Button variant="ghost" icon={ArrowLeft} to={`/reports/center?category=${report.category}`}>Reports</Button>
          <Button variant="secondary" icon={Star} onClick={() => toggleFavoriteReport(user.id, report.id)} aria-pressed={isFav}>{isFav ? 'Favourite' : 'Add to favourites'}</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Refresh</Button>
          <Button variant="secondary" icon={Printer} onClick={() => setPrintAll(true)} disabled={!rows.length}>Print</Button>
          <Button icon={Download} onClick={onExport} disabled={!rows.length}>Export CSV</Button>
        </div>}>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          <Badge tone="brand">{cat?.label}</Badge>
          <span>Generated {formatDateTime(refreshedAt)} from data in this browser</span>
        </div>
      </PageHeader>

      {report.note && !report.unavailable && <p className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted"><Info size={14} className="mt-0.5 shrink-0" aria-hidden />{report.note}</p>}

      {report.unavailable ? (
        <Card><EmptyState icon={Ban} title="No source data for this report" description={report.unavailable} action={<Button variant="secondary" to="/reports/center">Browse reports</Button>} /></Card>
      ) : error ? (
        <Card><EmptyState icon={Ban} title="This report could not be built" description={error} action={<Button variant="secondary" icon={RefreshCw} onClick={refresh}>Try again</Button>} /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {kpis.map((k) => (
              <Card key={k.label} className="!p-4">
                <p className="text-xs text-muted">{k.label}</p>
                <p className="mt-1 text-lg font-semibold text-ink tabular truncate">{formatCell(k.type, k.value)}</p>
              </Card>
            ))}
          </div>

          <Card className="no-print mb-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <SearchInput value={q} onChange={(v) => { setQ(v); setPage(0) }} placeholder="Search in this report…" className="flex-1 sm:max-w-sm" />
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <Button size="sm" variant="secondary" icon={Columns3} onClick={() => setShowCols((s) => !s)} aria-expanded={showCols}>Columns ({visibleCols.length}/{columns.length})</Button>
                  <FilterSelect label="Group by" allLabel="No grouping" value={groupBy} onChange={(v) => { setGroupBy(v); setPage(0) }} options={groupCols.map((c) => ({ value: c.key, label: `Group by ${c.label.toLowerCase()}` }))} className="w-48" />
                  {activeFilters > 0 && <Button size="sm" variant="ghost" icon={FilterX} onClick={reset}>Clear ({activeFilters})</Button>}
                </div>
              </div>
              {showCols && (
                <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-lg border border-line p-3">
                  {columns.map((c) => (
                    <Checkbox key={c.key} label={c.label} checked={!hidden.includes(c.key)} disabled={!hidden.includes(c.key) && visibleCols.length === 1}
                      onChange={(e) => setHidden((h) => (e.target.checked ? h.filter((k) => k !== c.key) : [...h, c.key]))} />
                  ))}
                </div>
              )}
              {(hasDate || dynFilters.length > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {hasDate && <>
                    <FilterInput label="Date from" type="date" value={f.from} onChange={(e) => setFilter('from', e.target.value)} />
                    <FilterInput label="Date to" type="date" value={f.to} onChange={(e) => setFilter('to', e.target.value)} />
                    <FilterSelect label="Month" allLabel="Any month" value={f.month} onChange={(v) => setFilter('month', v)} options={months.map((m) => ({ value: m, label: dayjs(`${m}-01`).format('MMM YYYY') }))} />
                    <FilterSelect label="Year" allLabel="Any year" value={f.year} onChange={(v) => setFilter('year', v)} options={years.map((y) => ({ value: y, label: y }))} />
                  </>}
                  {dynFilters.map((d) => (
                    <FilterSelect key={d.key} label={d.label} allLabel={`All ${d.label.toLowerCase()}s`} value={f[d.key] || ''} onChange={(v) => setFilter(d.key, v)} options={d.options.map((o) => ({ value: o, label: o }))} />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {report.chart && chartData.length > 0 && (
            <ChartCard title={`${chartCol?.label || 'Records'} by ${columns.find((c) => c.key === report.chart.by)?.label.toLowerCase() || report.chart.by}`} subtitle={report.chart.sort === 'label' ? 'In order' : 'Top values for the current filters'} height={Math.max(200, chartData.length * 30 + 40)} className="mb-6 print-keep">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid {...gridProps} horizontal={false} vertical />
                <XAxis type="number" {...axisProps} tickFormatter={chartFmt} />
                <YAxis type="category" dataKey="name" {...axisProps} width={140} tickFormatter={(v) => (String(v).length > 20 ? `${String(v).slice(0, 19)}…` : v)} />
                <Tooltip {...tooltipProps} formatter={(v) => [chartFmt(v), chartCol?.label || 'Records']} />
                <Bar dataKey="value" fill={SERIES.c1} radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false} />
              </BarChart>
            </ChartCard>
          )}

          <Card>
            <CardHeader title={grouped ? `Grouped by ${columns.find((c) => c.key === groupBy)?.label.toLowerCase()}` : 'Report data'} subtitle={`${rows.length} of ${allRows.length} records`} icon={grouped ? Layers : undefined} />
            {grouped ? (
              <DataTable caption={`${report.title} grouped`} rows={grouped} pageSize={printAll ? null : 20}
                columns={[
                  { key: 'group', header: columns.find((c) => c.key === groupBy)?.label, render: (r) => formatCell(columns.find((c) => c.key === groupBy)?.type, r.group) },
                  { key: 'count', header: 'Records', align: 'right', render: (r) => <span className="tabular">{formatNumber(r.count)}</span> },
                  ...sumCols.map((c) => ({ key: c.key, header: c.label, align: 'right', render: (r) => <span className="tabular">{formatCell(c.type, r[c.key])}</span> })),
                ]} />
            ) : (
              <DataTable caption={report.title} rows={rows} pageSize={printAll ? null : 15} page={page} onPageChange={setPage} sort={sort.key} dir={sort.dir}
                onSort={(k) => setSort((s) => ({ key: k, dir: s.key === k && s.dir === 'asc' ? 'desc' : 'asc' }))} columns={tableColumns}
                empty={<EmptyState icon={SearchX} title={allRows.length ? 'No records match these filters' : 'No data yet'} description={allRows.length ? 'Clear a filter to see more.' : 'This report has no records in the current data. It fills automatically as the related workflow is used.'}
                  action={activeFilters > 0 && <Button variant="secondary" icon={FilterX} onClick={reset}>Clear filters</Button>} />} />
            )}
            {sumCols.length > 0 && rows.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-3 text-sm">
                <span className="font-medium text-ink">Totals ({rows.length} records)</span>
                {sumCols.map((c) => <span key={c.key} className="text-muted">{c.label}: <strong className="text-ink tabular">{formatCell(c.type, totals[c.key])}</strong></span>)}
              </div>
            )}
          </Card>
        </>
      )}
    </>
  )
}
