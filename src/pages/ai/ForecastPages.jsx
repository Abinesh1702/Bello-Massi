import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { AlertTriangle, BarChart3, CalendarRange, Download, Eye, GitCompare, History, LineChart as LineIcon, Package, Plus, Printer, ShoppingCart, Sigma, Target, Trash2, TrendingUp, Wand2 } from 'lucide-react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import Badge from '../../components/common/Badge'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { FilterSelect, SearchInput } from '../../components/common/FilterToolbar'
import { ForecastChart } from '../../components/ai/AiCharts'
import { InfoNote, QualityMeter, SourcesNote, StatisticalBadge } from '../../components/ai/AiBadges'
import { axisProps, gridProps, SERIES, tooltipProps } from '../../components/dashboard/charts/chartTheme'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { usePermission } from '../../hooks/usePermission'
import { deleteForecast, downloadForecastCsv, evaluateForecast, forecastKpis, generateForecast, previewForecast, targetLabel } from '../../services/ai/forecastService'
import { isGatewayConfigured } from '../../services/integrationGateway'
import { emptyForecastRequest, validateForecastRequest } from '../../services/ml/forecastBuilder'
import { periodLabel } from '../../services/ml/timeSeries'
import { FORECAST_GRANULARITY, FORECAST_HORIZONS, FORECAST_LEVELS, FORECAST_MODEL_META, FORECAST_MODELS, FORECAST_STATUS, FORECAST_TARGETS, INSUFFICIENT_DATA_MESSAGE } from '../../config/aiConfig'
import { PRODUCT_CATEGORIES } from '../../config/masterData'
import { formatCompactCurrency, formatDateTime, formatMoney, formatNumber } from '../../utils/formatters'

const valueFmt = (f) => (f?.request?.target === 'revenue' ? formatMoney : formatNumber)
const metricOrDash = (v, suffix = '') => (v === null || v === undefined ? '—' : `${formatNumber(v)}${suffix}`)

export const StatusBadgeFc = ({ status }) => (status === FORECAST_STATUS.COMPLETED ? <Badge tone="success" dot>Completed</Badge> : status === FORECAST_STATUS.INSUFFICIENT_DATA ? <Badge tone="warning" dot>Insufficient data</Badge> : <Badge tone="danger" dot>Failed</Badge>)

function MetricsGrid({ metrics, money }) {
  if (!metrics) return <p className="text-sm text-muted">No holdout backtest was possible, so no accuracy metrics are shown.</p>
  const f = money ? formatMoney : formatNumber
  const items = [
    ['MAE', f(metrics.mae), 'Mean absolute error'],
    ['RMSE', f(metrics.rmse), 'Root mean squared error'],
    ['MAPE', metrics.mape === null ? 'Not defined' : `${metrics.mape}%`, metrics.mapeExcluded ? `Excludes ${metrics.mapeExcluded} zero-actual period(s)` : 'Mean absolute % error'],
    ['Bias', `${metrics.bias >= 0 ? '+' : ''}${f(metrics.bias)}`, metrics.bias >= 0 ? 'Over-forecast on average' : 'Under-forecast on average'],
    ['WAPE', metrics.wape === null ? '—' : `${metrics.wape}%`, 'Weighted absolute % error'],
    ['Accuracy', metrics.accuracy === null ? '—' : `${metrics.accuracy}%`, '1 − WAPE on the holdout'],
  ]
  return (
    <div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map(([k, v, h]) => <div key={k} className="rounded-lg border border-line bg-surface-2 px-3 py-2"><dt className="text-[11px] text-muted">{k}</dt><dd className="text-sm font-semibold tabular text-ink">{v}</dd><dd className="text-[10px] text-muted">{h}</dd></div>)}
      </dl>
      <p className="mt-2 text-[11px] text-muted">Measured on the last {metrics.points} period(s) held out from fitting — not estimated.</p>
    </div>
  )
}

function ModelInfo({ f }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted">Model</dt><dd className="text-ink">{f.modelName}</dd>
      <dt className="text-muted">Version</dt><dd className="tabular text-ink">{f.modelVersion}</dd>
      <dt className="text-muted">Engine</dt><dd className="text-ink">{f.engine === 'BACKEND' ? 'Backend ML service' : 'Browser (statistical)'}</dd>
      <dt className="text-muted">Requested</dt><dd className="text-ink">{FORECAST_MODEL_META[f.request.model]?.label || f.request.model}</dd>
      <dt className="text-muted">History</dt><dd className="text-ink">{dayjs(f.historyPeriod.from).format('DD MMM YY')} – {dayjs(f.historyPeriod.to).format('DD MMM YY')} · {f.historyPeriod.periods} periods</dd>
      <dt className="text-muted">Horizon</dt><dd className="text-ink">{f.horizonDays} days · {f.horizonPeriods} {f.granularity}(s)</dd>
      {f.params && Object.entries(f.params).filter(([k]) => k !== 'indices').map(([k, v]) => <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="tabular text-ink">{String(v)}</dd></div>)}
    </dl>
  )
}

/* ---------------- Dashboard ---------------- */

export default function ForecastDashboard() {
  const d = usePhase6Data()
  const navigate = useNavigate()
  const canGenerate = usePermission('forecasting.generate')
  const k = useMemo(() => forecastKpis(d.forecasts, d.prediction), [d.forecasts, d.prediction])
  const primary = k.sales || d.forecasts.find((f) => f.status === FORECAST_STATUS.COMPLETED)
  const evaluated = useMemo(() => d.forecasts.filter((f) => f.status === FORECAST_STATUS.COMPLETED).map((f) => ({ f, ev: evaluateForecast(f) })).find((x) => x.ev.rows.length >= 3), [d.forecasts])
  const actuals = useMemo(() => (primary ? Object.fromEntries(evaluateForecast(primary).rows.map((r) => [r.key, r.actual])) : {}), [primary])
  const [quick, setQuick] = useState({ target: 'revenue', horizonDays: 30, granularity: 'day' })
  const [busy, setBusy] = useState(false)
  const runQuick = async () => {
    setBusy(true)
    const r = await generateForecast({ ...emptyForecastRequest(), ...quick, model: d.forecastSettings.defaultModel })
    setBusy(false)
    if (!r.ok) return toast.error(r.error)
    toast[r.record.status === FORECAST_STATUS.COMPLETED ? 'success' : 'warning'](r.record.status === FORECAST_STATUS.COMPLETED ? `${r.record.number} generated` : INSUFFICIENT_DATA_MESSAGE)
    return navigate(`/ai/forecasting/${r.record.id}`)
  }
  return (
    <>
      <PageHeader title="Forecasting" description="Sales, order and demand forecasts from platform history (and the labelled demo baseline). Models are statistical formulas run in this browser — not trained machine-learning models."
        actions={<>
          <Button variant="secondary" icon={History} to="/ai/forecasting/history">History</Button>
          <Button variant="secondary" icon={GitCompare} to="/ai/forecasting/compare">Compare</Button>
          {canGenerate && <Button icon={Plus} to="/ai/forecasting/new">New forecast</Button>}
        </>} />
      <StatGrid cols={3}>
        <StatCard label="Forecasted sales" value={k.sales ? formatCompactCurrency(k.sales.predictedTotal) : '—'} icon={TrendingUp} tone="brand" hint={k.sales ? `next ${k.sales.horizonDays} days · ${k.sales.number}` : 'Generate a revenue forecast'} to={k.sales ? `/ai/forecasting/${k.sales.id}` : undefined} />
        <StatCard label="Forecasted orders" value={k.orders ? formatNumber(k.orders.predictedTotal) : '—'} icon={ShoppingCart} tone="info" hint={k.orders ? `next ${k.orders.horizonDays} days` : 'No order-count forecast yet'} to={k.orders ? `/ai/forecasting/${k.orders.id}` : undefined} />
        <StatCard label="Forecasted demand (units)" value={k.demand ? formatNumber(k.demand.predictedTotal) : '—'} icon={Package} tone="accent" hint={k.demand ? `next ${k.demand.horizonDays} days` : 'No demand forecast yet'} to={k.demand ? `/ai/forecasting/${k.demand.id}` : undefined} />
        <StatCard label="Average forecast accuracy" value={k.accuracy === null ? 'n/a' : `${k.accuracy}%`} icon={Target} tone="success" hint={k.accuracy === null ? 'No backtested forecasts yet' : `1 − WAPE across ${k.accuracyCount} backtest(s)`} />
        <StatCard label="Products at risk" value={k.atRisk ?? '—'} icon={AlertTriangle} tone="warning" hint="Critical + high stock-out risk" to="/ai/predictive-inventory/risks" />
        <StatCard label="Expected stock-outs" value={k.stockouts ?? '—'} icon={Package} tone="danger" hint={`within ${d.forecastSettings.forecastHorizonDays} days`} to="/ai/predictive-inventory" />
      </StatGrid>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="self-start xl:col-span-2">
          <CardHeader title={primary ? primary.name : 'Historical and forecast trend'} subtitle={primary ? `${primary.number} · generated ${formatDateTime(primary.createdAt)} · horizon ${primary.horizonDays} days` : 'No forecast yet'} icon={LineIcon}
            action={primary && <Link to={`/ai/forecasting/${primary.id}`} className="text-xs font-medium text-brand hover:underline">Details</Link>} />
          {primary ? (
            <>
              <div className="mb-2 flex flex-wrap gap-2"><StatisticalBadge engine={primary.engine} />{primary.usesDemoData && <Badge tone="accent">Includes demo baseline</Badge>}</div>
              <ForecastChart forecast={primary} actuals={actuals} height={380} historyPoints={60} />
            </>
          ) : <EmptyState icon={LineIcon} title="No forecast yet" description={canGenerate ? 'Use “New forecast” to create one.' : 'Ask a Sales Manager or Administrator to generate one.'} />}
        </Card>
        <div className="space-y-6">
          {canGenerate && (
            <Card>
              <CardHeader title="Quick forecast" icon={Wand2} subtitle={`Default model: ${FORECAST_MODEL_META[d.forecastSettings.defaultModel]?.label}`} />
              <div className="space-y-3">
                <Select label="Forecast" value={quick.target} onChange={(e) => setQuick((q) => ({ ...q, target: e.target.value }))} options={FORECAST_TARGETS} />
                <Select label="Period" value={quick.granularity} onChange={(e) => setQuick((q) => ({ ...q, granularity: e.target.value }))} options={FORECAST_GRANULARITY} />
                <div>
                  <p className="text-sm font-medium text-ink">Horizon</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Horizon">
                    {FORECAST_HORIZONS.map((h) => <button key={h} type="button" role="radio" aria-checked={quick.horizonDays === h} onClick={() => setQuick((q) => ({ ...q, horizonDays: h }))} className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${quick.horizonDays === h ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink hover:bg-surface-2'}`}>{h} d</button>)}
                  </div>
                </div>
                <Button fullWidth icon={Sigma} onClick={runQuick} loading={busy}>Generate</Button>
              </div>
            </Card>
          )}
          {primary && (
            <Card>
              <CardHeader title="Model & data" icon={Sigma} />
              <div className="space-y-4">
                <ModelInfo f={primary} />
                <QualityMeter quality={primary.quality} compact />
                <SourcesNote sources={primary.sources} />
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Actual vs predicted" subtitle={evaluated ? `${evaluated.f.number} · ${evaluated.f.name}` : 'Appears once a forecast’s dates have passed'} icon={GitCompare} />
          {evaluated ? (
            <>
              <div style={{ height: 220 }} role="img" aria-label="Actual versus predicted">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evaluated.ev.rows.map((r) => ({ label: periodLabel(r.key, evaluated.f.granularity), actual: r.actual, predicted: r.predicted }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis {...axisProps} width={60} tickFormatter={(v) => (evaluated.f.request.target === 'revenue' ? formatCompactCurrency(v) : formatNumber(v))} />
                    <Tooltip {...tooltipProps} formatter={(v) => valueFmt(evaluated.f)(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line dataKey="actual" name="Actual" stroke={SERIES.c1} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                    <Line dataKey="predicted" name="Predicted" stroke={SERIES.c2} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3"><MetricsGrid metrics={evaluated.ev.metrics} money={evaluated.f.request.target === 'revenue'} /></div>
              <p className="mt-2 text-[11px] text-muted">Actuals are booked platform orders for dates after the forecast was generated.</p>
            </>
          ) : <EmptyState compact icon={GitCompare} title="Nothing to compare yet" description="Actual-vs-predicted needs at least three forecast periods that are already in the past." />}
        </Card>
        <Card>
          <CardHeader title="Recent forecasts" icon={BarChart3} action={<Link to="/ai/forecasting/history" className="text-xs font-medium text-brand hover:underline">All</Link>} />
          <ForecastTable forecasts={d.forecasts.slice(0, 6)} compact />
        </Card>
      </div>
    </>
  )
}

function ForecastTable({ forecasts, compact, selectable, selected = [], onToggle }) {
  return (
    <DataTable
      rows={forecasts}
      dense
      pageSize={compact ? undefined : 15}
      empty={<EmptyState compact icon={LineIcon} title="No forecasts" />}
      columns={[
        ...(selectable ? [{ key: 'sel', header: <span className="sr-only">Select</span>, render: (f) => <input type="checkbox" aria-label={`Select ${f.number}`} checked={selected.includes(f.id)} onChange={() => onToggle(f.id)} className="h-4 w-4 accent-[var(--brand)]" /> }] : []),
        { key: 'n', header: 'Forecast', render: (f) => <div className="min-w-0"><Link to={`/ai/forecasting/${f.id}`} className="font-medium text-brand hover:underline tabular">{f.number}</Link><p className="truncate text-xs text-muted max-w-[260px]">{f.name}</p></div> },
        { key: 't', header: 'Target', hideBelow: 'md', render: (f) => targetLabel(f.request.target) },
        { key: 'm', header: 'Model', hideBelow: 'lg', render: (f) => f.modelName },
        { key: 'v', header: 'Forecast total', align: 'right', render: (f) => (f.status === FORECAST_STATUS.COMPLETED ? valueFmt(f)(f.predictedTotal) : '—') },
        { key: 'a', header: 'Accuracy', align: 'right', hideBelow: 'sm', render: (f) => (f.metrics?.accuracy !== null && f.metrics?.accuracy !== undefined ? `${f.metrics.accuracy}%` : '—') },
        { key: 's', header: 'Status', render: (f) => <StatusBadgeFc status={f.status} /> },
        ...(compact ? [] : [{ key: 'd', header: 'Generated', hideBelow: 'md', render: (f) => <span className="text-xs text-muted whitespace-nowrap">{formatDateTime(f.createdAt)}</span> }]),
      ]}
    />
  )
}

/* ---------------- Create ---------------- */

export function ForecastCreate() {
  const d = usePhase6Data()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [r, setR] = useState(() => {
    const base = emptyForecastRequest()
    const productId = params.get('productId') || ''
    const hubId = params.get('hubId') || ''
    return {
      ...base,
      target: params.get('target') || base.target,
      horizonDays: Number(params.get('horizonDays')) || base.horizonDays,
      granularity: params.get('granularity') || base.granularity,
      level: productId ? 'product' : hubId ? 'hub' : 'total',
      model: d.forecastSettings.defaultModel,
      filters: { ...base.filters, productId, hubId },
    }
  })
  const [custom, setCustom] = useState(!FORECAST_HORIZONS.includes(r.horizonDays))
  const [errors, setErrors] = useState({})
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [engine, setEngine] = useState(d.forecastSettings.engine || 'PROTOTYPE')
  const set = (k, v) => { setR((x) => ({ ...x, [k]: v })); setPreview(null) }
  const setF = (k, v) => { setR((x) => ({ ...x, filters: { ...x.filters, [k]: v } })); setPreview(null) }
  const enabledModels = d.models.filter((m) => m.kind === 'forecasting' && m.engine === 'PROTOTYPE' && m.enabled).map((m) => m.code)
  const modelOptions = [FORECAST_MODELS.AUTO, ...Object.keys(FORECAST_MODEL_META).filter((m) => m !== 'AUTO' && enabledModels.includes(m))].map((m) => ({ value: m, label: FORECAST_MODEL_META[m].label }))
  const products = d.products.filter((p) => p.status === 'Active').sort((a, b) => a.name.localeCompare(b.name))
  const hubs = d.hubs.filter((h) => h.status === 'Active')
  const customers = d.customers.filter((c) => c.status === 'Active').sort((a, b) => a.name.localeCompare(b.name))

  const check = () => {
    const e = validateForecastRequest(r)
    setErrors(e)
    if (Object.keys(e).length) toast.error('Please fix the highlighted fields.')
    return !Object.keys(e).length
  }
  const runPreview = () => { if (check()) setPreview(previewForecast(r)) }
  const save = async () => {
    if (!check()) return
    setBusy(true)
    const res = await generateForecast(r, { engine })
    setBusy(false)
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast[res.record.status === FORECAST_STATUS.COMPLETED ? 'success' : 'warning'](res.record.status === FORECAST_STATUS.COMPLETED ? `${res.record.number} saved` : INSUFFICIENT_DATA_MESSAGE)
    navigate(`/ai/forecasting/${res.record.id}`)
  }

  return (
    <>
      <PageHeader title="New forecast" description="Choose what to forecast, the scope and horizon. Preview runs instantly in the browser; Generate saves it to forecast history." />
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save() }} noValidate>
            <Input label="Name (optional)" value={r.name} onChange={(e) => set('name', e.target.value)} maxLength={80} placeholder="e.g. Chennai revenue — next quarter" />
            <Select label="Forecast" required value={r.target} onChange={(e) => set('target', e.target.value)} options={FORECAST_TARGETS} error={errors.target} />
            <Select label="Level" value={r.level} onChange={(e) => { const level = e.target.value; setR((x) => ({ ...x, level, filters: { hubId: level === 'hub' || level === 'product' ? x.filters.hubId : '', productId: level === 'product' ? x.filters.productId : '', customerId: level === 'customer' ? x.filters.customerId : '', category: level === 'category' ? x.filters.category : '' } })); setPreview(null) }} options={FORECAST_LEVELS} />
            {r.level === 'product' && <Select label="Product" required value={r.filters.productId} onChange={(e) => setF('productId', e.target.value)} options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))} placeholder="Select a product" error={errors.productId} />}
            {r.level === 'customer' && <Select label="Customer" required value={r.filters.customerId} onChange={(e) => setF('customerId', e.target.value)} options={customers.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select a customer" error={errors.customerId} />}
            {r.level === 'category' && <Select label="Category" required value={r.filters.category} onChange={(e) => setF('category', e.target.value)} options={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder="Select a category" error={errors.category} />}
            {(r.level === 'hub' || r.level === 'product') && <Select label={r.level === 'hub' ? 'Hub' : 'Hub (optional)'} required={r.level === 'hub'} value={r.filters.hubId} onChange={(e) => setF('hubId', e.target.value)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} placeholder={r.level === 'hub' ? 'Select a hub' : 'All hubs'} error={errors.hubId} />}
            <Select label="Sales period" value={r.granularity} onChange={(e) => set('granularity', e.target.value)} options={FORECAST_GRANULARITY} error={errors.granularity} />
            <div>
              <p className="text-sm font-medium text-ink">Forecast horizon</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Forecast horizon">
                {FORECAST_HORIZONS.map((h) => <button key={h} type="button" role="radio" aria-checked={!custom && r.horizonDays === h} onClick={() => { setCustom(false); set('horizonDays', h) }} className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${!custom && r.horizonDays === h ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink hover:bg-surface-2'}`}>{h} days</button>)}
                <button type="button" role="radio" aria-checked={custom} onClick={() => setCustom(true)} className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${custom ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink hover:bg-surface-2'}`}>Custom</button>
              </div>
              {custom && <Input className="mt-2" label="Custom horizon (days)" type="number" min={1} max={365} value={r.horizonDays} onChange={(e) => set('horizonDays', e.target.value === '' ? '' : Number(e.target.value))} error={errors.horizonDays} />}
              {!custom && errors.horizonDays && <p className="mt-1 text-xs text-danger">{errors.horizonDays}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="History from" type="date" value={r.historyFrom} onChange={(e) => set('historyFrom', e.target.value)} error={errors.historyFrom} hint={`Default: last ${d.forecastSettings.historyDays} days`} />
              <Input label="History to" type="date" value={r.historyTo} onChange={(e) => set('historyTo', e.target.value)} error={errors.historyTo} hint="Default: yesterday" />
            </div>
            <Select label="Model" value={r.model} onChange={(e) => set('model', e.target.value)} options={modelOptions} hint={FORECAST_MODEL_META[r.model]?.description} />
            <Select label="Engine" value={engine} onChange={(e) => setEngine(e.target.value)} options={[{ value: 'PROTOTYPE', label: 'Prototype (browser, statistical)' }, { value: 'BACKEND', label: `Backend ML service${isGatewayConfigured() ? '' : ' — integration pending'}` }]} hint={engine === 'BACKEND' && !isGatewayConfigured() ? 'Backend ML needs the integration gateway. Generating will fail until it is configured.' : undefined} />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" icon={Eye} onClick={runPreview}>Preview</Button>
              <Button type="submit" icon={Sigma} loading={busy}>Generate &amp; save</Button>
              <Button variant="ghost" to="/ai/forecasting">Cancel</Button>
            </div>
          </form>
        </Card>
        <Card>
          <CardHeader title="Preview" subtitle="Not saved until you generate" icon={LineIcon} />
          {!preview ? <EmptyState icon={Eye} title="No preview yet" description="Press Preview to run the model on current data." />
            : preview.status !== FORECAST_STATUS.COMPLETED ? (
              <div className="space-y-3"><EmptyState icon={AlertTriangle} title={preview.message} description={preview.notes.join(' ')} /><QualityMeter quality={preview.quality} /><SourcesNote sources={preview.sources} /></div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2"><StatisticalBadge /><span className="text-sm text-ink">{preview.modelName}</span><span className="text-sm font-semibold tabular text-ink">Total {valueFmt(preview)(preview.predictedTotal)}</span></div>
                <ForecastChart forecast={preview} height={280} />
                <MetricsGrid metrics={preview.metrics} money={preview.request.target === 'revenue'} />
                {preview.notes.length > 0 && <InfoNote>{preview.notes.join(' ')}</InfoNote>}
                <SourcesNote sources={preview.sources} />
              </div>
            )}
        </Card>
      </div>
    </>
  )
}

/* ---------------- Detail ---------------- */

export function ForecastDetail({ print = false }) {
  const { id } = useParams()
  const d = usePhase6Data()
  const navigate = useNavigate()
  const canExport = usePermission('forecasting.export')
  const canGenerate = usePermission('forecasting.generate')
  const [deleting, setDeleting] = useState(false)
  const f = d.lk.forecasts[id]
  const ev = useMemo(() => (f ? evaluateForecast(f) : { rows: [], metrics: null }), [f])
  if (!f) return <NotFoundRecord entity="forecast" backTo="/ai/forecasting/history" backLabel="Forecast history" />
  const fmt = valueFmt(f)
  const actual = Object.fromEntries(ev.rows.map((r) => [r.key, r.actual]))
  const ok = f.status === FORECAST_STATUS.COMPLETED
  const body = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2"><StatusBadgeFc status={f.status} /><StatisticalBadge engine={f.engine} />{f.usesDemoData && <Badge tone="accent">Includes demo baseline</Badge>}{f.seeded && <Badge tone="neutral">Demo seed</Badge>}</div>
      {!ok ? (
        <Card>
          <EmptyState icon={AlertTriangle} title={f.message || INSUFFICIENT_DATA_MESSAGE} description={f.notes.join(' ')} />
          <div className="mx-auto mt-2 max-w-md"><QualityMeter quality={f.quality} /></div>
        </Card>
      ) : (
        <>
          <StatGrid cols={4}>
            <StatCard label="Forecast total" value={f.request.target === 'revenue' ? formatCompactCurrency(f.predictedTotal) : formatNumber(f.predictedTotal)} icon={TrendingUp} hint={`${f.horizonDays} days ahead`} />
            <StatCard label="Backtest accuracy" value={f.metrics?.accuracy === null || f.metrics?.accuracy === undefined ? 'n/a' : `${f.metrics.accuracy}%`} icon={Target} tone="success" hint="1 − WAPE on holdout" />
            <StatCard label="Data quality" value={`${f.quality.score}/100`} icon={Sigma} tone="info" hint={f.quality.label} />
            <StatCard label="Interval" value={f.sigma === null ? 'n/a' : `±${f.confidenceLevel}%`} icon={CalendarRange} tone="accent" hint="approx., from residuals" />
          </StatGrid>
          <Card>
            <CardHeader title="History, backtest and forecast" subtitle={`${targetLabel(f.request.target)} · ${f.scope} · ${f.granularity}`} icon={LineIcon} />
            <ForecastChart forecast={f} actuals={actual} height={print ? 280 : 340} historyPoints={print ? 60 : 120} />
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader title="Evaluation metrics" subtitle="Holdout backtest" icon={Target} /><MetricsGrid metrics={f.metrics} money={f.request.target === 'revenue'} /></Card>
            <Card><CardHeader title="Model information" icon={Sigma} /><ModelInfo f={f} />
              {f.candidates?.length > 1 && (
                <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Models compared (holdout RMSE)</p>
                  <ul className="mt-1 space-y-1 text-xs">{f.candidates.map((c) => <li key={c.model} className="flex justify-between"><span className={c.model === f.model ? 'font-semibold text-ink' : 'text-muted'}>{c.label}{c.model === f.model ? ' ✓' : ''}</span><span className="tabular text-muted">{c.available ? fmt(c.rmse) : 'not enough history'}</span></li>)}</ul>
                </div>
              )}
            </Card>
          </div>
          <Card>
            <CardHeader title="Actual vs predicted" subtitle={ev.rows.length ? `${ev.rows.length} elapsed period(s)` : 'No forecast period has passed yet'} icon={GitCompare} />
            {ev.rows.length ? <><MetricsGrid metrics={ev.metrics} money={f.request.target === 'revenue'} /></> : <p className="text-sm text-muted">Actuals appear here as the forecast dates pass and orders are booked.</p>}
          </Card>
          <Card>
            <CardHeader title="Predicted values" icon={BarChart3} />
            <DataTable rows={f.predictions.map((p) => ({ ...p, id: p.key }))} dense pageSize={print ? undefined : 15} columns={[
              { key: 'k', header: 'Period', render: (p) => <span className="tabular">{periodLabel(p.key, f.granularity)}</span> },
              { key: 'v', header: 'Forecast', align: 'right', render: (p) => fmt(p.value) },
              { key: 'l', header: 'Lower', align: 'right', render: (p) => (p.lower === null ? '—' : fmt(p.lower)) },
              { key: 'u', header: 'Upper', align: 'right', render: (p) => (p.upper === null ? '—' : fmt(p.upper)) },
              { key: 'a', header: 'Actual', align: 'right', render: (p) => (actual[p.key] === undefined ? '—' : fmt(actual[p.key])) },
            ]} />
          </Card>
        </>
      )}
      <Card><CardHeader title="Data quality & sources" icon={Sigma} /><div className="grid gap-6 md:grid-cols-2"><QualityMeter quality={f.quality} /><div className="space-y-2"><SourcesNote sources={f.sources} />{f.notes.length > 0 && <InfoNote>{f.notes.join(' ')}</InfoNote>}<p className="text-xs text-muted">Generated {formatDateTime(f.createdAt)} by {f.createdByName} · forecast date {dayjs(f.asOf).format('DD MMM YYYY')}</p></div></div></Card>
    </div>
  )
  if (print) {
    return (
      <>
        <div className="no-print mb-4 flex flex-wrap gap-2"><Button variant="secondary" to={`/ai/forecasting/${f.id}`}>Back</Button><Button icon={Printer} onClick={() => window.print()}>Print</Button></div>
        <div className="print-area space-y-4"><div><h1 className="text-xl font-semibold text-ink">{f.number} · {f.name}</h1><p className="text-sm text-muted">Bellomassi forecast report · {formatDateTime(f.createdAt)} · prototype statistical model, not a trained ML prediction</p></div>{body}</div>
      </>
    )
  }
  return (
    <>
      <PageHeader title={`${f.number} · ${f.name}`} description={`${targetLabel(f.request.target)} · ${f.scope} · ${f.granularity} periods · horizon ${f.horizonDays} days`}
        actions={<>
          {canExport && ok && <Button variant="secondary" icon={Download} onClick={() => downloadForecastCsv(f)}>Download CSV</Button>}
          {canExport && <Button variant="secondary" icon={Printer} to={`/ai/forecasting/${f.id}/print`}>Print report</Button>}
          <Button variant="secondary" icon={GitCompare} to={`/ai/forecasting/compare?ids=${f.id}`}>Compare</Button>
          {canGenerate && <Button variant="danger-outline" icon={Trash2} onClick={() => setDeleting(true)}>Delete</Button>}
        </>} />
      {body}
      <ConfirmDialog open={deleting} onClose={() => setDeleting(false)} tone="danger" title={`Delete ${f.number}?`} description="The forecast is removed from history. This does not affect any business data." confirmLabel="Delete"
        onConfirm={() => { const r = deleteForecast(f.id); setDeleting(false); if (!r.ok) return toast.error(r.error); toast.success('Forecast deleted'); return navigate('/ai/forecasting/history') }} />
    </>
  )
}

export const ForecastPrint = () => <ForecastDetail print />

/* ---------------- History ---------------- */

export function ForecastHistory() {
  const d = usePhase6Data()
  const [q, setQ] = useState('')
  const [target, setTarget] = useState('')
  const [status, setStatus] = useState('')
  const rows = d.forecasts.filter((f) => (!q || `${f.number} ${f.name} ${f.modelName}`.toLowerCase().includes(q.toLowerCase())) && (!target || f.request.target === target) && (!status || f.status === status))
  return (
    <>
      <PageHeader title="Forecast history" description="Every generated forecast with its model, status and backtest accuracy." actions={<Button variant="secondary" icon={GitCompare} to="/ai/forecasting/compare">Compare</Button>} />
      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search number, name or model" className="w-full sm:w-72" />
          <FilterSelect label="Target" allLabel="All targets" value={target} onChange={setTarget} options={FORECAST_TARGETS} />
          <FilterSelect label="Status" allLabel="All statuses" value={status} onChange={setStatus} options={[{ value: FORECAST_STATUS.COMPLETED, label: 'Completed' }, { value: FORECAST_STATUS.INSUFFICIENT_DATA, label: 'Insufficient data' }]} />
        </div>
        <ForecastTable forecasts={rows} />
      </Card>
    </>
  )
}

/* ---------------- Compare ---------------- */

export function ForecastCompare() {
  const d = usePhase6Data()
  const [params, setParams] = useSearchParams()
  const selected = (params.get('ids') || '').split(',').filter((x) => d.lk.forecasts[x])
  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id].slice(-4)
    setParams(next.length ? { ids: next.join(',') } : {})
  }
  const list = selected.map((id) => d.lk.forecasts[id])
  const comparable = list.length > 1 && list.every((f) => f.granularity === list[0].granularity && f.request.target === list[0].request.target)
  const keys = [...new Set(list.flatMap((f) => f.predictions.map((p) => p.key)))].sort()
  const data = keys.map((k) => ({ label: list[0] ? periodLabel(k, list[0].granularity) : k, ...Object.fromEntries(list.map((f) => [f.number, f.predictions.find((p) => p.key === k)?.value ?? null])) }))
  const colors = [SERIES.c1, SERIES.c2, SERIES.c3, SERIES.c4]
  return (
    <>
      <PageHeader title="Compare forecasts" description="Select up to four forecasts. Charts overlay forecasts with the same target and period." />
      {list.length > 0 && (
        <Card className="mb-6">
          <CardHeader title="Side by side" icon={GitCompare} />
          <div className="overflow-x-auto scroll-thin">
            <table className="min-w-full text-sm">
              <thead><tr className="text-left text-xs text-muted"><th className="py-2 pr-4 font-medium">Metric</th>{list.map((f) => <th key={f.id} className="py-2 pr-4 font-medium"><Link to={`/ai/forecasting/${f.id}`} className="text-brand hover:underline">{f.number}</Link></th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {[
                  ['Name', (f) => f.name], ['Target', (f) => targetLabel(f.request.target)], ['Scope', (f) => f.scope], ['Model', (f) => f.modelName], ['Status', (f) => <StatusBadgeFc status={f.status} />],
                  ['Horizon', (f) => `${f.horizonDays} d · ${f.granularity}`], ['Forecast total', (f) => (f.status === FORECAST_STATUS.COMPLETED ? valueFmt(f)(f.predictedTotal) : '—')],
                  ['MAE', (f) => metricOrDash(f.metrics?.mae)], ['RMSE', (f) => metricOrDash(f.metrics?.rmse)], ['MAPE', (f) => (f.metrics ? (f.metrics.mape === null ? 'Not defined' : `${f.metrics.mape}%`) : '—')],
                  ['Bias', (f) => metricOrDash(f.metrics?.bias)], ['Accuracy (1 − WAPE)', (f) => metricOrDash(f.metrics?.accuracy, '%')], ['Data quality', (f) => `${f.quality.score}/100`], ['Generated', (f) => formatDateTime(f.createdAt)],
                ].map(([label, fn]) => <tr key={label}><th scope="row" className="py-2 pr-4 text-left text-xs font-medium text-muted">{label}</th>{list.map((f) => <td key={f.id} className="py-2 pr-4 tabular text-ink">{fn(f)}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          {list.length > 1 && (comparable ? (
            <div className="mt-4" style={{ height: 280 }} role="img" aria-label="Forecast comparison chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis {...axisProps} width={60} tickFormatter={(v) => (list[0].request.target === 'revenue' ? formatCompactCurrency(v) : formatNumber(v))} />
                  <Tooltip {...tooltipProps} formatter={(v) => (v === null ? '—' : valueFmt(list[0])(v))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {list.map((f, i) => <Line key={f.id} dataKey={f.number} stroke={colors[i]} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <InfoNote className="mt-4">The chart overlay needs forecasts with the same target and period; the table above still compares them.</InfoNote>)}
        </Card>
      )}
      <Card>
        <CardHeader title="Choose forecasts" subtitle={`${selected.length} of 4 selected`} />
        <ForecastTable forecasts={d.forecasts} selectable selected={selected} onToggle={toggle} />
      </Card>
    </>
  )
}
