import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { AlertTriangle, ArrowRightLeft, Boxes, Calculator, ClipboardList, Gauge, IndianRupee, PackageMinus, PackagePlus, RefreshCw, Settings2, ShieldAlert, Sigma, TrendingDown, TrendingUp, Undo2, X } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import Textarea from '../../components/common/Textarea'
import Toggle from '../../components/common/Toggle'
import Modal from '../../components/common/Modal'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import ChartCard, { ChartLegend } from '../../components/dashboard/ChartCard'
import StackedBarChart from '../../components/dashboard/charts/StackedBarChart'
import StatusDonutChart from '../../components/dashboard/charts/StatusDonutChart'
import { FilterSelect, SearchInput } from '../../components/common/FilterToolbar'
import { InfoNote, RiskBadge, SourcesNote, StatisticalBadge } from '../../components/ai/AiBadges'
import { axisProps, gridProps, SERIES, tooltipProps } from '../../components/dashboard/charts/chartTheme'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { usePermission } from '../../hooks/usePermission'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../utils/constants'
import { dismissRecommendation, isPredictionStale, reopenRecommendation, runPrediction } from '../../services/ai/inventoryPredictionService'
import { createDraft } from '../../services/ai/replenishmentService'
import { saveForecastSettings } from '../../services/ai/forecastService'
import { getDataBundle, getIndex } from '../../services/ai/dataBundle'
import { demandSeries } from '../../services/ml/demandData'
import { FORECAST_MODEL_META, RECOMMENDATION_STATUS, RISK, RISK_FLAGS, RISK_META, SERVICE_LEVEL_Z } from '../../config/aiConfig'
import { currencySymbol, formatCompactCurrency, formatDate, formatDateTime, formatMoney, formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const RISK_COLORS = { CRITICAL: 'var(--chart-5)', HIGH: 'var(--chart-2)', MEDIUM: 'var(--chart-4)', LOW: 'var(--chart-3)' }
const n1 = (v) => formatNumber(Math.round((Number(v) || 0) * 10) / 10)
const lineId = (r) => `${r.productId}--${r.hubId}`

function PredictionHeader({ prediction, title, description, extra }) {
  const [busy, setBusy] = useState(false)
  const stale = isPredictionStale(prediction)
  const run = () => {
    setBusy(true)
    const r = runPrediction()
    setBusy(false)
    if (!r.ok) return toast.error(r.error)
    return toast.success(`Prediction updated · ${r.record.summary.reorder} reorder recommendation(s)`)
  }
  return (
    <PageHeader title={title} description={description}
      actions={<>{extra}<Button variant={stale ? 'primary' : 'secondary'} icon={RefreshCw} loading={busy} onClick={run}>{stale ? 'Re-run prediction' : 'Run prediction'}</Button></>}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <StatisticalBadge />
        {prediction?.settings?.includeBaseline && <Badge tone="accent">Demand history includes demo baseline</Badge>}
        {prediction && <span>Last run {formatDateTime(prediction.generatedAt)} · basis: {prediction.settings?.basis || 'dispatched'} · lookback {prediction.settings?.lookbackDays} d</span>}
        {stale && <Badge tone="warning" dot>Stock or orders changed since this run</Badge>}
      </div>
    </PageHeader>
  )
}

const PredictiveNav = () => (
  <div className="mb-4 flex flex-wrap gap-2">
    {[['/ai/predictive-inventory', 'Dashboard'], ['/ai/predictive-inventory/reorder', 'Reorder recommendations'], ['/ai/predictive-inventory/risks', 'Risk analysis'], ['/ai/predictive-inventory/demand', 'Demand forecasting'], ['/ai/replenishment', 'Replenishment drafts'], ['/ai/predictive-inventory/settings', 'Planning parameters']].map(([to, label]) => (
      <Link key={to} to={to} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2">{label}</Link>
    ))}
  </div>
)

/* ---------------- Dashboard ---------------- */

export default function PredictiveDashboard() {
  const d = usePhase6Data()
  const movements = useStoredValue(STORAGE_KEYS.STOCK_MOVEMENTS, [])
  const p = d.prediction
  const [hubId, setHubId] = useState('')
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const rows = useMemo(() => (p?.rows || []).filter((r) => (!hubId || r.hubId === hubId)), [p, hubId])
  const s = p?.summary
  const byProduct = useMemo(() => {
    const m = {}
    rows.forEach((r) => { const g = (m[r.productId] ||= { name: r.productName, stock: 0, demand: 0 }); g.stock += r.available; g.demand += r.forecastDemand })
    return Object.values(m).sort((a, b) => b.demand - a.demand).slice(0, 10).map((g) => ({ ...g, name: g.name.length > 14 ? `${g.name.slice(0, 13)}…` : g.name, stock: Math.round(g.stock), demand: Math.round(g.demand) }))
  }, [rows])
  const trend = useMemo(() => {
    const IN = ['Stock Receipt', 'Stock Transfer In', 'Stock Adjustment Increase', 'Stock Dispatch Reversal', 'Delivery Return']
    let level = rows.reduce((t, r) => t + r.onHand, 0)
    const hubSet = new Set(rows.map((r) => r.hubId))
    const net = {}
    movements.filter((m) => hubSet.has(m.hubId)).forEach((m) => { const k = dayjs(m.date).format('YYYY-MM-DD'); net[k] = (net[k] || 0) + (IN.includes(m.movementType) ? 1 : -1) * (Number(m.quantity) || 0) })
    const out = []
    for (let i = 0; i < 30; i += 1) {
      const day = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
      out.unshift({ day: dayjs(day).format('DD MMM'), stock: Math.round(level) })
      level -= net[day] || 0
    }
    return out
  }, [rows, movements])
  const reorderByHub = useMemo(() => {
    const m = {}
    rows.filter((r) => r.recommendedQty > 0).forEach((r) => { m[r.hubName] = (m[r.hubName] || 0) + r.recommendedQty })
    return Object.entries(m).map(([name, value]) => ({ name: name.replace(' Hub', '').replace(' Central', ''), value }))
  }, [rows])
  const demandByCat = useMemo(() => {
    const m = {}
    rows.forEach((r) => { m[r.category] = (m[r.category] || 0) + r.forecastDemand })
    return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value)
  }, [rows])
  const top = rows.filter((r) => r.risk === RISK.CRITICAL || r.risk === RISK.HIGH).filter((r) => !q || `${r.productName} ${r.productCode} ${r.hubName}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => RISK_META[a.risk].rank - RISK_META[b.risk].rank || (a.coverageDays ?? 0) - (b.coverageDays ?? 0))
  if (!p) return <EmptyState icon={Gauge} title="No prediction yet" description="Run a prediction to analyse stock against forecast demand." action={<Button icon={RefreshCw} onClick={() => { const r = runPrediction(); if (!r.ok) toast.error(r.error) }}>Run prediction</Button>} />
  return (
    <>
      <PredictionHeader prediction={p} title="Predictive Inventory" description="Stock coverage, stock-out dates and reorder points from current stock and statistical demand forecasts. Running a prediction never changes stock." />
      <PredictiveNav />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <FilterSelect label="Hub" allLabel="All hubs" value={hubId} onChange={setHubId} options={d.hubs.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: h.name }))} />
      </div>
      <StatGrid cols={6}>
        <StatCard label="Total inventory value" value={formatCompactCurrency(rows.reduce((t, r) => t + r.value, 0))} icon={IndianRupee} tone="brand" hint="at purchase price" />
        <StatCard label="Low stock products" value={rows.filter((r) => r.flags.includes(RISK_FLAGS.LOW_STOCK)).length} icon={PackageMinus} tone="warning" to="/inventory/low-stock" hint="≤ reorder level" />
        <StatCard label="Predicted stock-outs" value={rows.filter((r) => r.daysUntilStockout !== null && r.daysUntilStockout <= (p.settings?.horizon || 14) && r.avgDaily > 0).length} icon={AlertTriangle} tone="danger" hint={`within ${p.settings?.horizon || 14} days`} to="/ai/predictive-inventory/risks?flag=stockout" />
        <StatCard label="Reorder recommendations" value={rows.filter((r) => r.recommendedQty > 0).length} icon={PackagePlus} tone="info" to="/ai/predictive-inventory/reorder" />
        <StatCard label="Excess inventory" value={rows.filter((r) => r.flags.includes(RISK_FLAGS.EXCESS) || r.flags.includes(RISK_FLAGS.NON_MOVING)).length} icon={Boxes} tone="accent" to="/ai/predictive-inventory/risks?flag=excess" hint="lines" />
        <StatCard label="Inventory risk score" value={`${hubId ? Math.round(rows.reduce((t, r) => t + r.riskScore, 0) / Math.max(1, rows.length)) : s.riskScore}/100`} icon={Gauge} tone={s.riskScore >= 50 ? 'danger' : s.riskScore >= 30 ? 'warning' : 'success'} hint="mean line risk (higher = worse)" />
      </StatGrid>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Current stock vs forecast demand" subtitle={`Top 10 products by forecast demand · next ${p.settings?.horizon || 14} days`} isEmpty={!byProduct.length}
          legend={<ChartLegend items={[{ label: 'Available stock', color: SERIES.c1 }, { label: 'Forecast demand', color: SERIES.c2 }]} />}>
          <BarChart data={byProduct} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid {...gridProps} /><XAxis dataKey="name" {...axisProps} interval={0} angle={-25} textAnchor="end" height={60} /><YAxis {...axisProps} width={48} />
            <Tooltip {...tooltipProps} /><Bar dataKey="stock" name="Available stock" fill={SERIES.c1} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} /><Bar dataKey="demand" name="Forecast demand" fill={SERIES.c2} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Stock trend" subtitle="Units on hand, last 30 days (rebuilt from stock movements)" isEmpty={!trend.length}>
          <AreaChart data={trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid {...gridProps} /><XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" minTickGap={24} /><YAxis {...axisProps} width={56} />
            <Tooltip {...tooltipProps} /><Area dataKey="stock" name="On hand" stroke={SERIES.c1} fill={SERIES.c1} fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
          </AreaChart>
        </ChartCard>
        <ChartCard title="Forecast demand by category" subtitle={`Units · next ${p.settings?.horizon || 14} days`} isEmpty={!demandByCat.length}>
          <BarChart data={demandByCat} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
            <CartesianGrid {...gridProps} horizontal={false} vertical /><XAxis type="number" {...axisProps} /><YAxis type="category" dataKey="name" {...axisProps} width={96} />
            <Tooltip {...tooltipProps} /><Bar dataKey="value" name="Forecast units" fill={SERIES.c2} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Recommended reorder quantity" subtitle="Units by hub" isEmpty={!reorderByHub.length} emptyText="No reorder is recommended.">
          <BarChart data={reorderByHub} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid {...gridProps} /><XAxis dataKey="name" {...axisProps} /><YAxis {...axisProps} width={48} />
            <Tooltip {...tooltipProps} /><Bar dataKey="value" name="Units" fill={SERIES.c3} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
          </BarChart>
        </ChartCard>
        <StackedBarChart title="Stock-out risk by hub" subtitle="Stock lines per risk level" data={(hubId ? s.byHub.filter((h) => h.hubId === hubId) : s.byHub).map((h) => ({ ...h, name: h.hubName.replace(' Hub', '') }))} series={Object.keys(RISK_META).map((k) => ({ key: k, label: RISK_META[k].label, color: RISK_COLORS[k] }))} height={260} />
        <div className="grid gap-6 sm:grid-cols-2">
          <StatusDonutChart title="Inventory value by category" subtitle="At purchase price" data={s.byCategory.slice(0, 5).map((c, i) => ({ name: c.name, value: Math.round(c.value), color: [SERIES.c1, SERIES.c2, SERIES.c3, SERIES.c4, SERIES.c5][i] }))} centerLabel="value" formatValue={(v) => formatCompactCurrency(v)} formatTotal={(v) => formatCompactCurrency(v)} />
          <StatusDonutChart title="Risk distribution" subtitle="Stock lines" data={Object.keys(RISK_META).map((k) => ({ name: RISK_META[k].label, value: rows.filter((r) => r.risk === k).length, color: RISK_COLORS[k] }))} centerLabel="lines" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Stock-out predictions" subtitle="Critical and high risk lines" icon={ShieldAlert} action={<SearchInput value={q} onChange={setQ} placeholder="Product or hub" className="w-48" />} />
          <RiskTable rows={top} pageSize={8} />
        </Card>
        <SampleCalculation />
      </div>
    </>
  )
}

function RiskTable({ rows, pageSize = 15, showFlags = false }) {
  return (
    <DataTable rows={rows} dense pageSize={pageSize} empty={<EmptyState compact icon={ShieldAlert} title="No lines match" />}
      columns={[
        { key: 'p', header: 'Product', render: (r) => <div className="min-w-0"><Link to={`/ai/predictive-inventory/lines/${lineId(r)}`} className="font-medium text-brand hover:underline">{r.productName}</Link><p className="text-xs text-muted">{r.hubName}</p></div> },
        { key: 'a', header: 'Available', align: 'right', render: (r) => `${n1(r.available)} ${r.unit}` },
        { key: 'f', header: 'Forecast/day', align: 'right', hideBelow: 'md', render: (r) => n1(r.forecastDaily) },
        { key: 'c', header: 'Coverage', align: 'right', render: (r) => (r.coverageDays === null ? '—' : `${n1(r.coverageDays)} d`) },
        { key: 'd', header: 'Stock-out', hideBelow: 'sm', render: (r) => (r.daysUntilStockout === null ? '—' : r.daysUntilStockout <= 0 ? <span className="font-medium text-danger">Now</span> : formatDate(r.stockoutDate, 'DD MMM')) },
        { key: 'lt', header: 'Lead time', align: 'right', hideBelow: 'lg', render: (r) => `${r.leadTimeDays} d` },
        { key: 'r', header: 'Risk', render: (r) => <RiskBadge risk={r.risk} /> },
        ...(showFlags ? [{ key: 'fl', header: 'Flags', hideBelow: 'xl', render: (r) => <div className="flex flex-wrap gap-1">{r.flags.map((f) => <Badge key={f} tone="neutral">{f}</Badge>)}</div> }] : []),
        { key: 'q', header: 'Reorder', align: 'right', render: (r) => (r.recommendedQty ? <span className="font-semibold">{formatNumber(r.recommendedQty)}</span> : '—') },
      ]} />
  )
}

/** The spec's worked example, clearly marked as a sample — not Bellomassi data. */
function SampleCalculation() {
  const stock = 120
  const demand = 20
  const lead = 8
  const coverage = stock / demand
  return (
    <Card>
      <CardHeader title="How risk is decided" subtitle="Sample prediction · illustrative numbers, not your data" icon={Calculator} />
      <Badge tone="accent">Sample · Demo mode</Badge>
      <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-sm">
        <dt className="text-muted">Product</dt><dd className="text-ink">Engine Oil (sample)</dd>
        <dt className="text-muted">Current stock</dt><dd className="tabular text-ink">{stock} units</dd>
        <dt className="text-muted">Average demand</dt><dd className="tabular text-ink">{demand} units/day</dd>
        <dt className="text-muted">Stock coverage</dt><dd className="tabular text-ink">{coverage} days</dd>
        <dt className="text-muted">Supplier lead time</dt><dd className="tabular text-ink">{lead} days</dd>
        <dt className="text-muted">Risk</dt><dd><RiskBadge risk="CRITICAL" /></dd>
        <dt className="text-muted">Recommendation</dt><dd className="font-medium text-ink">Reorder immediately</dd>
      </dl>
      <ul className="mt-3 space-y-1 text-xs text-muted">
        <li><b className="text-ink">Critical</b> — coverage shorter than the lead time (stock runs out before resupply).</li>
        <li><b className="text-ink">High</b> — coverage inside lead time + safety buffer.</li>
        <li><b className="text-ink">Medium</b> — projected position at or below the reorder point.</li>
        <li><b className="text-ink">Low</b> — enough stock for lead time, safety stock and the review period.</li>
      </ul>
    </Card>
  )
}

/* ---------------- Reorder recommendations + replenishment workflow ---------------- */

export function ReorderRecommendations() {
  const d = usePhase6Data()
  const navigate = useNavigate()
  const canCreate = usePermission('inventory.replenishment.create')
  const [tab, setTab] = useState(RECOMMENDATION_STATUS.OPEN)
  const [hubId, setHubId] = useState('')
  const [risk, setRisk] = useState('')
  const [selected, setSelected] = useState({})
  const [supplierId, setSupplierId] = useState('')
  const [destHub, setDestHub] = useState('')
  const [notes, setNotes] = useState('')
  const [dismissing, setDismissing] = useState(null)
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState({})
  const rows = d.recommendations.filter((r) => r.status === tab && (!hubId || r.hubId === hubId) && (!risk || r.risk === risk)).sort((a, b) => RISK_META[a.risk].rank - RISK_META[b.risk].rank)
  const chosen = Object.entries(selected).filter(([, v]) => v.on).map(([id, v]) => ({ rec: d.recommendations.find((r) => r.id === id), qty: v.qty })).filter((x) => x.rec)
  const chosenHubs = [...new Set(chosen.map((c) => c.rec.hubId))]
  const toggle = (r) => setSelected((s) => ({ ...s, [r.id]: s[r.id]?.on ? { ...s[r.id], on: false } : { on: true, qty: s[r.id]?.qty ?? r.recommendedQty } }))
  const setQty = (r, v) => setSelected((s) => ({ ...s, [r.id]: { on: true, qty: v } }))
  const suppliers = d.forecastSettings.suppliers
  const effectiveHub = destHub || chosenHubs[0] || ''
  const value = chosen.reduce((t, c) => t + (Number(c.qty) || 0) * (c.rec.unitCost || 0), 0)

  const generate = () => {
    const e = {}
    if (!chosen.length) e.lines = 'Select at least one product.'
    if (chosenHubs.length > 1 && !destHub) e.hub = 'Selected recommendations belong to different hubs. Choose one destination hub or select one hub at a time.'
    if (!supplierId) e.supplier = 'Select a supplier.'
    setErrors(e)
    if (Object.keys(e).length) return toast.error(Object.values(e)[0])
    const res = createDraft({ hubId: effectiveHub, supplierId, notes, source: 'ai', lines: chosen.map((c) => ({ productId: c.rec.productId, quantity: Number(c.qty), recommendedQty: c.rec.recommendedQty, recommendationId: c.rec.id })) })
    if (!res.ok) { setErrors(res.errors || {}); return toast.error(res.errors ? Object.values(res.errors)[0] : res.error) }
    if (res.warnings?.length) toast.warning(res.warnings.join(' '))
    toast.success(`Draft ${res.record.number} created — review and submit it for approval`)
    setSelected({})
    return navigate(`/ai/replenishment/${res.record.id}`)
  }

  return (
    <>
      <PredictionHeader prediction={d.prediction} title="Reorder recommendations" description="Review AI reorder suggestions, adjust quantities, choose a supplier and destination hub, then generate a replenishment draft. Drafts never change stock." />
      <PredictiveNav />
      <InfoNote className="mb-4">Reorder point = average daily demand × lead time + safety stock. Recommended quantity = target stock − (available − committed orders + incoming), never negative, rounded up to the product MOQ and pack multiple.</InfoNote>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <Tabs className="mb-4" value={tab} onChange={(v) => { setTab(v); setSelected({}) }} tabs={[
            { id: RECOMMENDATION_STATUS.OPEN, label: `Open (${d.recommendations.filter((r) => r.status === 'OPEN').length})` },
            { id: RECOMMENDATION_STATUS.IN_DRAFT, label: `In a draft (${d.recommendations.filter((r) => r.status === 'IN_DRAFT').length})` },
            { id: RECOMMENDATION_STATUS.DISMISSED, label: `Dismissed (${d.recommendations.filter((r) => r.status === 'DISMISSED').length})` },
          ]} />
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <FilterSelect label="Hub" allLabel="All hubs" value={hubId} onChange={setHubId} options={d.hubs.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: h.name }))} />
            <FilterSelect label="Risk" allLabel="All risks" value={risk} onChange={setRisk} options={Object.keys(RISK_META).map((k) => ({ value: k, label: RISK_META[k].label }))} />
          </div>
          <DataTable rows={rows} dense pageSize={20} empty={<EmptyState compact icon={PackagePlus} title={tab === 'OPEN' ? 'No open recommendations' : 'Nothing here'} description={tab === 'OPEN' ? 'Projected stock is above every reorder point.' : undefined} />}
            columns={[
              ...(tab === 'OPEN' && canCreate ? [{ key: 'sel', header: <span className="sr-only">Select</span>, render: (r) => <input type="checkbox" checked={Boolean(selected[r.id]?.on)} onChange={() => toggle(r)} className="h-4 w-4 accent-[var(--brand)]" aria-label={`Select ${r.productName} at ${r.hubName}`} /> }] : []),
              { key: 'p', header: 'Product', render: (r) => <div><Link to={`/ai/predictive-inventory/lines/${r.productId}--${r.hubId}`} className="font-medium text-brand hover:underline">{r.productName}</Link><p className="text-xs text-muted">{r.hubName} · {r.supplierName || 'default supplier'}</p></div> },
              { key: 'risk', header: 'Risk', render: (r) => <RiskBadge risk={r.risk} /> },
              { key: 'pos', header: 'Avail. / committed / incoming', align: 'right', hideBelow: 'lg', render: (r) => <span className="tabular text-xs">{n1(r.available)} / {n1(r.committed)} / {n1(r.incoming)}</span> },
              { key: 'rop', header: 'ROP · safety', align: 'right', hideBelow: 'md', render: (r) => <span className="tabular text-xs">{n1(r.reorderPoint)} · {n1(r.safetyStock)}</span> },
              { key: 'date', header: 'Order by', hideBelow: 'sm', render: (r) => formatDate(r.suggestedReorderDate, 'DD MMM') },
              { key: 'q', header: 'Quantity', align: 'right', render: (r) => (tab === 'OPEN' && canCreate && selected[r.id]?.on
                ? <input type="number" min={0} value={selected[r.id].qty} onChange={(e) => setQty(r, e.target.value)} aria-label={`Quantity for ${r.productName}`} className="h-8 w-20 rounded-md border border-line bg-surface px-2 text-right text-sm tabular" />
                : <span className="font-semibold tabular">{formatNumber(r.recommendedQty)} <span className="text-xs font-normal text-muted">{r.unit}</span></span>) },
              { key: 'act', header: <span className="sr-only">Actions</span>, render: (r) => (tab === 'OPEN' && canCreate ? <Button size="xs" variant="ghost" icon={X} onClick={() => { setDismissing(r); setReason('') }}>Dismiss</Button>
                : tab === 'DISMISSED' && canCreate ? <Button size="xs" variant="ghost" icon={Undo2} onClick={() => { const x = reopenRecommendation(r.id); if (!x.ok) toast.error(x.error) }}>Reopen</Button>
                  : r.draftId ? <Link to={`/ai/replenishment/${r.draftId}`} className="text-xs text-brand hover:underline">Open draft</Link> : null) },
            ]} />
        </Card>
        {canCreate ? (
          <Card className="h-fit xl:sticky xl:top-20">
            <CardHeader title="Replenishment draft" subtitle={`${chosen.length} product(s) selected`} icon={ClipboardList} />
            <div className="space-y-3">
              <Select label="Supplier" required value={supplierId} onChange={(e) => setSupplierId(e.target.value)} options={suppliers.map((s) => ({ value: s.id, label: `${s.name} · ${s.leadTimeDays} d` }))} placeholder="Select a supplier" error={errors.supplier || errors.supplierId} />
              <Select label="Destination hub" value={destHub} onChange={(e) => setDestHub(e.target.value)} options={d.hubs.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: h.name }))} placeholder={chosenHubs.length === 1 ? `${d.lk.hubs[chosenHubs[0]]?.name} (from selection)` : 'From selection'} error={errors.hub || errors.hubId} />
              <Textarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
              <p className="text-xs text-muted">Estimated value {formatMoney(value)} at purchase price.</p>
              {errors.lines && <p className="text-xs text-danger">{errors.lines}</p>}
              <Button fullWidth icon={PackagePlus} onClick={generate} disabled={!chosen.length}>Generate replenishment draft</Button>
              <p className="text-[11px] text-muted">Next: review the draft → submit for approval → Administrator approves → record goods receipts in Inventory. Only receipts change stock.</p>
            </div>
          </Card>
        ) : <InfoNote>Your role can view recommendations. Creating replenishment drafts needs the Dispatcher or Administrator role.</InfoNote>}
      </div>
      <Modal open={Boolean(dismissing)} onClose={() => setDismissing(null)} title="Dismiss recommendation" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDismissing(null)}>Cancel</Button><Button onClick={() => { const r = dismissRecommendation(dismissing.id, reason); if (!r.ok) return toast.error(r.error); setDismissing(null); return toast.success('Recommendation dismissed') }}>Dismiss</Button></>}>
        <p className="mb-3 text-sm text-ink">{dismissing?.productName} at {dismissing?.hubName}: {formatNumber(dismissing?.recommendedQty)} {dismissing?.unit}</p>
        <Textarea label="Reason" required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} data-autofocus />
      </Modal>
    </>
  )
}

/* ---------------- Risk analysis ---------------- */

const FLAG_FILTERS = [
  ['stockout', RISK_FLAGS.STOCKOUT], ['low', RISK_FLAGS.LOW_STOCK], ['excess', RISK_FLAGS.EXCESS], ['slow', RISK_FLAGS.SLOW], ['nonmoving', RISK_FLAGS.NON_MOVING],
  ['highdemand', RISK_FLAGS.HIGH_DEMAND], ['spike', RISK_FLAGS.SPIKE], ['imbalance', RISK_FLAGS.IMBALANCE],
]

export function InventoryRisks() {
  const d = usePhase6Data()
  const [params, setParams] = useSearchParams()
  const flagKey = params.get('flag') || ''
  const flag = FLAG_FILTERS.find(([k]) => k === flagKey)?.[1]
  const [hubId, setHubId] = useState('')
  const all = useMemo(() => d.prediction?.rows || [], [d.prediction])
  const rows = all.filter((r) => (!flag || r.flags.includes(flag) || (flagKey === 'excess' && r.flags.includes(RISK_FLAGS.NON_MOVING))) && (!hubId || r.hubId === hubId) && (flag || r.flags.length))
    .sort((a, b) => RISK_META[a.risk].rank - RISK_META[b.risk].rank || (b.impact?.value || 0) - (a.impact?.value || 0))
  const hubBalance = useMemo(() => {
    const m = {}
    all.forEach((r) => { const g = (m[r.hubId] ||= { name: r.hubName.replace(' Hub', ''), under: 0, over: 0 }); if (r.risk === RISK.CRITICAL || r.risk === RISK.HIGH) g.under += 1; if (r.flags.includes(RISK_FLAGS.EXCESS)) g.over += 1 })
    return Object.values(m)
  }, [all])
  return (
    <>
      <PredictionHeader prediction={d.prediction} title="Inventory risk analysis" description="Stock-out risk, low, excess, slow-moving and non-moving stock, demand spikes and imbalance between hubs — each with reason, suggested action and estimated impact." />
      <PredictiveNav />
      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Risk type">
        <button type="button" onClick={() => setParams({})} aria-pressed={!flagKey} className={cn('rounded-full border px-3 py-1 text-xs font-medium', !flagKey ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink')}>All flagged ({all.filter((r) => r.flags.length).length})</button>
        {FLAG_FILTERS.map(([k, label]) => <button key={k} type="button" onClick={() => setParams({ flag: k })} aria-pressed={flagKey === k} className={cn('rounded-full border px-3 py-1 text-xs font-medium', flagKey === k ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink')}>{label} ({all.filter((r) => r.flags.includes(label) || (k === 'excess' && r.flags.includes(RISK_FLAGS.NON_MOVING))).length})</button>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <div className="mb-4"><FilterSelect label="Hub" allLabel="All hubs" value={hubId} onChange={setHubId} options={d.hubs.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: h.name }))} /></div>
          <DataTable rows={rows} dense pageSize={15} empty={<EmptyState compact icon={ShieldAlert} title="No lines with this risk" />}
            columns={[
              { key: 'p', header: 'Product · hub', render: (r) => <div><Link to={`/ai/predictive-inventory/lines/${lineId(r)}`} className="font-medium text-brand hover:underline">{r.productName}</Link><p className="text-xs text-muted">{r.hubName}</p></div> },
              { key: 'q', header: 'Current qty', align: 'right', render: (r) => n1(r.onHand) },
              { key: 'f', header: 'Forecast demand', align: 'right', hideBelow: 'md', render: (r) => n1(r.forecastDemand) },
              { key: 'r', header: 'Risk', render: (r) => <RiskBadge risk={r.risk} /> },
              { key: 'why', header: 'Reason', hideBelow: 'lg', render: (r) => <span className="block max-w-[260px] text-xs text-muted">{r.reason}</span> },
              { key: 'a', header: 'Suggested action', render: (r) => <div className="text-xs"><p className="text-ink">{r.action}</p>{r.transferSuggestion && <Link to={`/inventory/stock-transfers/create?sourceHubId=${r.transferSuggestion.fromHubId}&destinationHubId=${r.hubId}&productId=${r.productId}`} className="mt-0.5 inline-flex items-center gap-1 text-brand hover:underline"><ArrowRightLeft size={12} /> Transfer {r.transferSuggestion.quantity} from {r.transferSuggestion.fromHubName}</Link>}</div> },
              { key: 's', header: 'Suggested qty', align: 'right', hideBelow: 'sm', render: (r) => (r.recommendedQty ? formatNumber(r.recommendedQty) : r.transferSuggestion ? formatNumber(r.transferSuggestion.quantity) : '—') },
              { key: 'i', header: 'Estimated impact', align: 'right', hideBelow: 'xl', render: (r) => (r.impact ? <span className="text-xs"><span className="font-medium tabular text-ink">{formatMoney(r.impact.value)}</span><br /><span className="text-muted">{r.impact.label}</span></span> : '—') },
            ]} />
        </Card>
        <ChartCard title="Hub balance" subtitle="Lines at stock-out risk vs lines in excess" isEmpty={!hubBalance.length} legend={<ChartLegend items={[{ label: 'At risk (critical/high)', color: SERIES.c5 }, { label: 'Excess', color: SERIES.c4 }]} />}>
          <BarChart data={hubBalance} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid {...gridProps} /><XAxis dataKey="name" {...axisProps} /><YAxis {...axisProps} allowDecimals={false} width={36} />
            <Tooltip {...tooltipProps} /><Bar dataKey="under" name="At risk" fill={SERIES.c5} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} /><Bar dataKey="over" name="Excess" fill={SERIES.c4} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          </BarChart>
        </ChartCard>
      </div>
    </>
  )
}

/* ---------------- Demand forecasting table ---------------- */

export function DemandForecasting() {
  const d = usePhase6Data()
  const [q, setQ] = useState('')
  const [hubId, setHubId] = useState('')
  const [trend, setTrend] = useState('')
  const rows = (d.prediction?.rows || []).filter((r) => (!q || `${r.productName} ${r.productCode}`.toLowerCase().includes(q.toLowerCase())) && (!hubId || r.hubId === hubId) && (!trend || r.trend === trend))
    .sort((a, b) => b.avgDaily - a.avgDaily)
  const basis = d.prediction?.settings?.basis || 'dispatched'
  return (
    <>
      <PredictionHeader prediction={d.prediction} title="Demand forecasting" description="Per product and hub: historical consumption, average demand, trend, variability, weekday seasonality, upcoming demand and stock coverage." />
      <PredictiveNav />
      <InfoNote className="mb-4">Demand basis is <b>{basis}</b> quantity. Ordered, dispatched and delivered quantities are shown separately because orders are not fulfilled demand until dispatched and delivered. Change the basis in Planning parameters.</InfoNote>
      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <SearchInput value={q} onChange={setQ} placeholder="Product name or code" className="w-full sm:w-64" />
          <FilterSelect label="Hub" allLabel="All hubs" value={hubId} onChange={setHubId} options={d.hubs.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Trend" allLabel="All trends" value={trend} onChange={setTrend} options={['Increasing', 'Stable', 'Decreasing'].map((t) => ({ value: t, label: t }))} />
        </div>
        <DataTable rows={rows} dense pageSize={20} empty={<EmptyState compact icon={Sigma} title="No lines" />}
          columns={[
            { key: 'p', header: 'Product · hub', render: (r) => <div><Link to={`/ai/predictive-inventory/lines/${lineId(r)}`} className="font-medium text-brand hover:underline">{r.productName}</Link><p className="text-xs text-muted">{r.hubName}</p></div> },
            { key: 'h', header: `Ordered / dispatched / delivered (${d.prediction?.settings?.lookbackDays || 56} d)`, align: 'right', hideBelow: 'xl', render: (r) => <span className="tabular text-xs">{n1(r.history.ordered)} / {n1(r.history.dispatched)} / {n1(r.history.delivered)}</span> },
            { key: 'a', header: 'Avg / day · week · month', align: 'right', render: (r) => <span className="tabular text-xs">{n1(r.avgDaily)} · {n1(r.avgWeekly)} · {n1(r.avgMonthly)}</span> },
            { key: 'f', header: `Forecast (${d.prediction?.settings?.horizon || 14} d)`, align: 'right', render: (r) => <span className="tabular">{n1(r.forecastDemand)}<span className="block text-[10px] text-muted">{r.forecastModel === 'HIST_AVG' ? 'historical avg' : FORECAST_MODEL_META[r.forecastModel]?.short}</span></span> },
            { key: 't', header: 'Trend', hideBelow: 'md', render: (r) => <span className={cn('inline-flex items-center gap-1 text-xs', r.trend === 'Increasing' ? 'text-success' : r.trend === 'Decreasing' ? 'text-danger' : 'text-muted')}>{r.trend === 'Increasing' ? <TrendingUp size={13} /> : r.trend === 'Decreasing' ? <TrendingDown size={13} /> : null}{r.trend} ({r.trendPctWeek > 0 ? '+' : ''}{r.trendPctWeek}%/wk)</span> },
            { key: 'v', header: 'Variability (CV)', align: 'right', hideBelow: 'lg', render: (r) => (r.cv === null ? '—' : r.cv) },
            { key: 's', header: 'Weekday pattern', hideBelow: '2xl', render: (r) => <span className="flex h-5 items-end gap-0.5" aria-label={`Weekday factors ${r.weekdayFactors.join(', ')}`}>{r.weekdayFactors.map((v, i) => <span key={i} className="w-1.5 rounded-sm bg-[var(--chart-1)]" style={{ height: `${Math.min(100, v * 50)}%` }} />)}</span> },
            { key: 'u', header: 'Next 7 days', align: 'right', render: (r) => n1(r.upcoming7) },
            { key: 'c', header: 'Coverage', align: 'right', render: (r) => (r.coverageDays === null ? '—' : `${n1(r.coverageDays)} d`) },
          ]} />
      </Card>
    </>
  )
}

/* ---------------- Line detail ---------------- */

export function PredictionLineDetail() {
  const { id } = useParams()
  const d = usePhase6Data()
  const [productId, hubId] = String(id).split('--')
  const r = (d.prediction?.rows || []).find((x) => x.productId === productId && x.hubId === hubId)
  const series = useMemo(() => {
    if (!r) return []
    const b = getDataBundle()
    const lb = r.lookbackDays
    const s = demandSeries(getIndex(b), productId, hubId, { from: dayjs().subtract(lb, 'day').format('YYYY-MM-DD'), to: dayjs().subtract(1, 'day').format('YYYY-MM-DD') })
    return s.days.map((day, i) => ({ day: dayjs(day).format('DD MMM'), ordered: s.ordered[i], dispatched: s.dispatched[i], delivered: s.delivered[i] }))
  }, [r, productId, hubId])
  if (!r) return <NotFoundRecord entity="prediction line" backTo="/ai/predictive-inventory" backLabel="Predictive inventory" />
  const z = SERVICE_LEVEL_Z[d.forecastSettings.serviceLevel] || 1.6449
  const rec = d.recommendations.find((x) => x.productId === productId && x.hubId === hubId)
  return (
    <>
      <PageHeader title={`${r.productName} · ${r.hubName}`} description={`${r.productCode} · ${r.category} · prediction run ${formatDateTime(d.prediction.generatedAt)}`}
        actions={<>
          <Button variant="secondary" to={`/products/${r.productId}`}>View product</Button>
          <Button variant="secondary" to={`/inventory/stock/${r.stockId}`}>View inventory</Button>
          {rec?.status === 'OPEN' && <Button icon={PackagePlus} to="/ai/predictive-inventory/reorder">Reorder</Button>}
        </>}>
        <div className="flex flex-wrap gap-2"><RiskBadge risk={r.risk} />{r.flags.map((f) => <Badge key={f}>{f}</Badge>)}<StatisticalBadge /></div>
      </PageHeader>
      <StatGrid cols={4}>
        <StatCard label="Available" value={`${n1(r.available)} ${r.unit}`} icon={Boxes} hint={`on hand ${n1(r.onHand)} · reserved ${n1(r.reserved)} · damaged ${n1(r.damaged)}`} />
        <StatCard label="Stock coverage" value={r.coverageDays === null ? '—' : `${n1(r.coverageDays)} days`} icon={Gauge} tone={r.risk === 'CRITICAL' ? 'danger' : r.risk === 'HIGH' ? 'warning' : 'success'} hint={r.stockoutDate ? `stock-out ~${formatDate(r.stockoutDate)}` : 'no demand'} />
        <StatCard label="Reorder point" value={n1(r.reorderPoint)} icon={Calculator} tone="info" hint={`position ${n1(r.position)}`} />
        <StatCard label="Recommended order" value={r.recommendedQty ? formatNumber(r.recommendedQty) : 'None'} icon={PackagePlus} tone="accent" hint={r.recommendedQty ? `order by ${formatDate(r.suggestedReorderDate, 'DD MMM')}` : r.action} />
      </StatGrid>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Daily demand history" subtitle={`Last ${r.lookbackDays} days · basis: ${r.basis}`} icon={Sigma} />
          <div style={{ height: 280 }} role="img" aria-label="Daily ordered, dispatched and delivered quantities">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid {...gridProps} /><XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" minTickGap={24} /><YAxis {...axisProps} width={40} />
                <Tooltip {...tooltipProps} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ordered" name="Ordered" fill={SERIES.c4} maxBarSize={8} isAnimationActive={false} />
                <Line dataKey="dispatched" name="Dispatched" stroke={SERIES.c1} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="delivered" name="Delivered" stroke={SERIES.c3} strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <SourcesNote className="mt-2" sources={d.prediction.settings?.includeBaseline ? ['Platform orders & deliveries', 'Demo historical baseline (synthetic) before the first platform order'] : ['Platform orders & deliveries']} />
        </Card>
        <Card>
          <CardHeader title="Calculation" icon={Calculator} subtitle="Every number is derived — nothing is estimated by hand" />
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-muted">Average daily demand</dt><dd className="tabular text-ink">{n1(r.avgDaily)}</dd>
            <dt className="text-muted">σ daily demand</dt><dd className="tabular text-ink">{n1(r.stdDaily)}</dd>
            <dt className="text-muted">Forecast / day ({r.forecastModel === 'HIST_AVG' ? 'historical avg' : FORECAST_MODEL_META[r.forecastModel]?.short})</dt><dd className="tabular text-ink">{n1(r.forecastDaily)}</dd>
            <dt className="text-muted">Lead time</dt><dd className="tabular text-ink">{r.leadTimeDays} d</dd>
            <dd className="col-span-2 -mt-1 text-[11px] text-muted">{r.leadTimeSource}</dd>
            <dt className="text-muted">Safety stock</dt><dd className="tabular text-ink">{n1(r.safetyStock)}</dd>
            <dd className="col-span-2 -mt-1 text-[11px] text-muted">{r.safetyMethod}{r.safetyMethod.startsWith('Statistical') ? ` = ${z} × ${n1(r.stdDaily)} × √${r.leadTimeDays}` : ''}</dd>
            <dt className="text-muted">Reorder point</dt><dd className="tabular text-ink">{n1(r.reorderPoint)}</dd>
            <dd className="col-span-2 -mt-1 text-[11px] text-muted">{n1(r.avgDaily)} × {r.leadTimeDays} + {n1(r.safetyStock)}</dd>
            <dt className="text-muted">Target stock</dt><dd className="tabular text-ink">{n1(r.targetStock)}{r.targetCapped ? ' (hub max)' : ''}</dd>
            <dt className="text-muted">Available − committed + incoming</dt><dd className="tabular text-ink">{n1(r.available)} − {n1(r.committed)} + {n1(r.incoming)} = {n1(r.position)}</dd>
            <dt className="text-muted">MOQ · pack multiple</dt><dd className="tabular text-ink">{r.moq} · {r.packMultiple}</dd>
            <dt className="font-medium text-ink">Recommended quantity</dt><dd className="font-semibold tabular text-ink">{formatNumber(r.recommendedQty)}</dd>
          </dl>
          <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink">{r.reason} <b>{r.action}.</b></p>
          {r.impact && <p className="mt-2 text-xs text-muted">{r.impact.label}: <span className="font-medium text-ink">{formatMoney(r.impact.value)}</span></p>}
        </Card>
      </div>
    </>
  )
}

/* ---------------- Planning parameters ---------------- */

export function PlanningParameters() {
  const d = usePhase6Data()
  const canManage = usePermission('inventory.predictions.manage')
  const s = d.forecastSettings
  const [form, setForm] = useState(() => ({
    demandBasis: s.demandBasis, lookbackDays: s.lookbackDays, forecastHorizonDays: s.forecastHorizonDays, defaultLeadTimeDays: s.defaultLeadTimeDays, safetyDays: s.safetyDays,
    serviceLevel: s.serviceLevel, reviewPeriodDays: s.reviewPeriodDays, excessCoverageDays: s.excessCoverageDays, slowMovingCoverageDays: s.slowMovingCoverageDays, spikeFactor: s.spikeFactor,
  }))
  const [suppliers, setSuppliers] = useState(() => s.suppliers.map((x) => ({ ...x })))
  const [params, setParams] = useState(() => ({ ...s.productParams }))
  const [errors, setErrors] = useState({})
  const [q, setQ] = useState('')
  const products = d.products.filter((p) => p.status === 'Active' && p.trackInventory !== false && (!q || `${p.name} ${p.code}`.toLowerCase().includes(q.toLowerCase())))
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setParam = (pid, k, v) => setParams((p) => ({ ...p, [pid]: { ...(p[pid] || {}), [k]: v } }))
  const save = () => {
    const cleanParams = Object.fromEntries(Object.entries(params).map(([pid, p]) => [pid, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v !== undefined))]).filter(([, p]) => Object.keys(p).length))
    const r = saveForecastSettings({ ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, k === 'demandBasis' ? v : Number(v)])), suppliers: suppliers.map((x) => ({ ...x, leadTimeDays: Number(x.leadTimeDays), minOrderValue: Number(x.minOrderValue) || 0 })), productParams: cleanParams })
    setErrors(r.errors || {})
    if (!r.ok) return toast.error(r.error)
    const run = runPrediction()
    return toast.success(run.ok ? 'Planning parameters saved and prediction re-run' : 'Saved')
  }
  if (!canManage) return <><PageHeader title="Planning parameters" /><InfoNote>Only an Administrator can change planning parameters.</InfoNote></>
  return (
    <>
      <PageHeader title="Planning parameters" description="Lead times, safety stock, service level, supplier and product constraints used by predictive inventory." actions={<Button icon={Settings2} onClick={save}>Save &amp; re-run</Button>} />
      <PredictiveNav />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Demand & safety stock" icon={Sigma} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Demand basis" value={form.demandBasis} onChange={(e) => set('demandBasis', e.target.value)} options={[{ value: 'dispatched', label: 'Dispatched quantity (recommended)' }, { value: 'delivered', label: 'Delivered quantity' }, { value: 'ordered', label: 'Ordered quantity' }]} error={errors.demandBasis} />
            <Select label="Service level" value={String(form.serviceLevel)} onChange={(e) => set('serviceLevel', Number(e.target.value))} options={[90, 95, 97.5, 99].map((v) => ({ value: String(v), label: `${v}% (z ${SERVICE_LEVEL_Z[v]})` }))} error={errors.serviceLevel} />
            <Input label="Demand lookback (days)" type="number" value={form.lookbackDays} onChange={(e) => set('lookbackDays', e.target.value)} error={errors.lookbackDays} />
            <Input label="Forecast horizon (days)" type="number" value={form.forecastHorizonDays} onChange={(e) => set('forecastHorizonDays', e.target.value)} error={errors.forecastHorizonDays} />
            <Input label="Default lead time (days)" type="number" value={form.defaultLeadTimeDays} onChange={(e) => set('defaultLeadTimeDays', e.target.value)} error={errors.defaultLeadTimeDays} />
            <Input label="Safety days (fallback)" type="number" value={form.safetyDays} onChange={(e) => set('safetyDays', e.target.value)} error={errors.safetyDays} hint="Used when fewer than 14 active days of history" />
            <Input label="Review period (days)" type="number" value={form.reviewPeriodDays} onChange={(e) => set('reviewPeriodDays', e.target.value)} error={errors.reviewPeriodDays} />
            <Input label="Spike factor" type="number" step="0.1" value={form.spikeFactor} onChange={(e) => set('spikeFactor', e.target.value)} error={errors.spikeFactor} hint="Last 7 days vs earlier average" />
            <Input label="Excess coverage (days)" type="number" value={form.excessCoverageDays} onChange={(e) => set('excessCoverageDays', e.target.value)} error={errors.excessCoverageDays} />
            <Input label="Slow-moving coverage (days)" type="number" value={form.slowMovingCoverageDays} onChange={(e) => set('slowMovingCoverageDays', e.target.value)} error={errors.slowMovingCoverageDays} />
          </div>
          <div className="mt-4"><Toggle label="Include demo historical baseline" description="Use the synthetic 180-day demo history before the first platform order. Switch off to forecast from platform data only." checked={s.includeDemoBaseline} onChange={(v) => { const r = saveForecastSettings({ includeDemoBaseline: v }); if (!r.ok) toast.error(r.error); else { runPrediction(); toast.success(v ? 'Demo baseline included' : 'Platform data only — some forecasts may report insufficient data') } }} /></div>
        </Card>
        <Card>
          <CardHeader title="Suppliers" icon={ClipboardList} subtitle="Lead time and minimum order value" action={<Button size="xs" variant="secondary" icon={PackagePlus} onClick={() => setSuppliers((l) => [...l, { id: `sup-${Date.now().toString(36)}`, name: '', leadTimeDays: 7, minOrderValue: 0, categories: [] }])}>Add supplier</Button>} />
          <div className="space-y-3">
            {suppliers.map((x, i) => (
              <div key={x.id} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_110px_140px_auto]">
                <Input label="Name" value={x.name} onChange={(e) => setSuppliers((l) => l.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} error={errors[`suppliers.${i}.name`]} />
                <Input label="Lead time (d)" type="number" value={x.leadTimeDays} onChange={(e) => setSuppliers((l) => l.map((y, j) => (j === i ? { ...y, leadTimeDays: e.target.value } : y)))} error={errors[`suppliers.${i}.leadTimeDays`]} />
                <Input label={`Min order (${currencySymbol()})`} type="number" value={x.minOrderValue} onChange={(e) => setSuppliers((l) => l.map((y, j) => (j === i ? { ...y, minOrderValue: e.target.value } : y)))} />
                <div className="flex items-end"><Button size="sm" variant="ghost" icon={X} aria-label={`Remove ${x.name || 'supplier'}`} disabled={suppliers.length <= 1} onClick={() => setSuppliers((l) => l.filter((_, j) => j !== i))} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader title="Product constraints" subtitle="Blank = default (supplier lead time, MOQ 10, pack 5)" icon={Boxes} action={<SearchInput value={q} onChange={setQ} placeholder="Find product" className="w-48" />} />
        <DataTable rows={products} dense pageSize={12} columns={[
          { key: 'p', header: 'Product', render: (p) => <div><p className="font-medium text-ink">{p.name}</p><p className="text-xs text-muted">{p.code} · {p.category}</p></div> },
          { key: 'lt', header: 'Lead time (d)', render: (p) => <input type="number" min={1} aria-label={`Lead time for ${p.name}`} value={params[p.id]?.leadTimeDays ?? ''} onChange={(e) => setParam(p.id, 'leadTimeDays', e.target.value)} className={cn('h-8 w-20 rounded-md border bg-surface px-2 text-sm', errors[`productParams.${p.id}.leadTimeDays`] ? 'border-danger' : 'border-line')} /> },
          { key: 'moq', header: 'MOQ', render: (p) => <input type="number" min={0} aria-label={`MOQ for ${p.name}`} value={params[p.id]?.moq ?? ''} onChange={(e) => setParam(p.id, 'moq', e.target.value)} className="h-8 w-20 rounded-md border border-line bg-surface px-2 text-sm" /> },
          { key: 'pk', header: 'Pack multiple', render: (p) => <input type="number" min={1} aria-label={`Pack multiple for ${p.name}`} value={params[p.id]?.packMultiple ?? ''} onChange={(e) => setParam(p.id, 'packMultiple', e.target.value)} className="h-8 w-20 rounded-md border border-line bg-surface px-2 text-sm" /> },
          { key: 's', header: 'Supplier', render: (p) => <select aria-label={`Supplier for ${p.name}`} value={params[p.id]?.supplierId ?? ''} onChange={(e) => setParam(p.id, 'supplierId', e.target.value)} className="h-8 rounded-md border border-line bg-surface px-2 text-sm"><option value="">By category</option>{suppliers.map((x) => <option key={x.id} value={x.id}>{x.name || 'Unnamed'}</option>)}</select> },
        ]} />
      </Card>
    </>
  )
}
