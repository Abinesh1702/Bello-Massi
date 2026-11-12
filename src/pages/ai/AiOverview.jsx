import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowUpRight, Bot, Lightbulb, LineChart, MessageSquare, Mic, PackagePlus, Send, Server, Settings2, Sparkles, Target } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import DataTable from '../../components/common/DataTable'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import InsightCard from '../../components/ai/InsightCard'
import { DemoAiBadge, PrivacyNote, ProviderStatusBadge, RiskBadge } from '../../components/ai/AiBadges'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { getProviderStatus } from '../../services/ai/aiProviderService'
import { visibleInsights } from '../../services/ai/insightService'
import { forecastKpis } from '../../services/ai/forecastService'
import { EXAMPLE_QUESTIONS } from '../../services/ai/aiIntentService'
import { AI_PROVIDERS, AI_STATUS, PROVIDER_META, RISK_META } from '../../config/aiConfig'
import { formatCompactCurrency, formatNumber, formatRelative } from '../../utils/formatters'

export default function AiOverview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const d = usePhase6Data()
  const can = {
    insights: usePermission('ai.insights.view'), manageInsights: usePermission('ai.insights.manage'), forecast: usePermission('forecasting.view'),
    predict: usePermission('inventory.predictions.view'), settings: usePermission('ai.settings.manage'), use: usePermission('ai.assistant.use'), jarvis: usePermission('jarvis.view'),
  }
  const [q, setQ] = useState('')
  const status = getProviderStatus(d.aiSettings)
  const insights = useMemo(() => (can.insights ? visibleInsights(user, d.insights) : []), [can.insights, user, d.insights])
  const open = insights.filter((i) => i.status === 'NEW')
  const k = useMemo(() => forecastKpis(d.forecasts, d.prediction), [d.forecasts, d.prediction])
  const recs = d.recommendations.filter((r) => r.status === 'OPEN').sort((a, b) => RISK_META[a.risk].rank - RISK_META[b.risk].rank)
  const myActivity = d.activity.filter((a) => a.userId === user.id).slice(0, 8)
  const myChats = d.conversations.filter((c) => c.userId === user.id)
  const ask = (e) => { e.preventDefault(); if (q.trim()) navigate(`/ai/assistant?q=${encodeURIComponent(q.trim())}`) }

  return (
    <>
      <PageHeader title="AI & Intelligence" description="Assistant, Jarvis, forecasting, predictive inventory and insights — all limited to the data your role can see."
        actions={<>{can.jarvis && <Button variant="secondary" icon={Mic} to="/ai/jarvis">Jarvis</Button>}<Button icon={MessageSquare} to="/ai/assistant">Open assistant</Button></>}>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">Provider:</span><span className="font-medium text-ink">{PROVIDER_META[d.aiSettings.provider]?.label}</span><ProviderStatusBadge status={status} />
          {d.aiSettings.provider === AI_PROVIDERS.DEMO && <DemoAiBadge />}
        </div>
      </PageHeader>

      {can.use && (
        <Card className="mb-6 bg-gradient-to-r from-[#232B5F] to-[#34427a] text-white">
          <form onSubmit={ask} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#F5A623]"><Sparkles size={20} aria-hidden /></span><p className="text-sm font-semibold">Ask anything about your business</p></div>
            <label htmlFor="ai-overview-q" className="sr-only">Question</label>
            <input id="ai-overview-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={EXAMPLE_QUESTIONS[0]} className="h-10 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/60 focus:border-[#F5A623] focus:outline-none" />
            <Button type="submit" variant="accent" icon={Send}>Ask</Button>
          </form>
        </Card>
      )}

      <StatGrid cols={4}>
        <StatCard label="Open insights" value={can.insights ? open.length : '—'} icon={Lightbulb} tone="accent" hint={can.insights ? `${open.filter((i) => ['critical', 'high'].includes(i.severity)).length} critical / high` : 'Not available for your role'} to={can.insights ? '/ai/insights' : undefined} />
        <StatCard label="Reorder recommendations" value={can.predict ? recs.length : '—'} icon={PackagePlus} tone="warning" hint={can.predict ? `${recs.filter((r) => r.risk === 'CRITICAL').length} critical` : 'Not available for your role'} to={can.predict ? '/ai/predictive-inventory/reorder' : undefined} />
        <StatCard label="Forecasted sales" value={can.forecast && k.sales ? formatCompactCurrency(k.sales.predictedTotal) : '—'} icon={LineChart} tone="brand" hint={can.forecast && k.sales ? `next ${k.sales.horizonDays} days · statistical` : can.forecast ? 'No forecast yet' : 'Not available for your role'} to={can.forecast ? '/ai/forecasting' : undefined} />
        <StatCard label="My conversations" value={myChats.length} icon={Bot} tone="info" hint={`${d.messages.filter((m) => m.userId === user.id && m.role === 'user').length} questions asked`} to="/ai/assistant" />
      </StatGrid>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-ink">Business insights</h2>{can.insights && <Link to="/ai/insights" className="text-xs font-medium text-brand hover:underline">All insights</Link>}</div>
          {!can.insights ? <Card><EmptyState compact icon={Lightbulb} title="Insights are not available for your role" /></Card>
            : open.length ? <div className="grid gap-4 md:grid-cols-2">{open.slice(0, 4).map((i) => <InsightCard key={i.id} insight={i} canManage={can.manageInsights} compact />)}</div>
              : <Card><EmptyState compact icon={Lightbulb} title="No new insights" /></Card>}
          {can.predict && (
            <Card>
              <CardHeader title="AI recommendations" subtitle="Most urgent reorder suggestions" icon={Target} action={<Link to="/ai/predictive-inventory/reorder" className="text-xs font-medium text-brand hover:underline">Review all</Link>} />
              <DataTable rows={recs.slice(0, 6)} dense empty={<EmptyState compact icon={PackagePlus} title="No open recommendations" />} columns={[
                { key: 'p', header: 'Product', render: (r) => <div><p className="font-medium text-ink">{r.productName}</p><p className="text-xs text-muted">{r.hubName}</p></div> },
                { key: 'r', header: 'Risk', render: (r) => <RiskBadge risk={r.risk} /> },
                { key: 'q', header: 'Recommended', align: 'right', render: (r) => `${formatNumber(r.recommendedQty)} ${r.unit}` },
                { key: 'w', header: 'Why', hideBelow: 'lg', render: (r) => <span className="block max-w-[280px] text-xs text-muted">{r.reason}</span> },
              ]} />
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Recent AI activity" icon={Activity} action={<Link to="/ai/activity" className="text-xs font-medium text-brand hover:underline">History</Link>} />
            {myActivity.length ? (
              <ul className="space-y-2.5">{myActivity.map((a) => <li key={a.id} className="flex items-start justify-between gap-2 text-sm"><span className="min-w-0"><span className="block truncate text-ink">{a.action.replace(/_/g, ' ')}</span><span className="block truncate text-xs text-muted">{a.summary || a.kind}</span></span><span className="shrink-0 text-[11px] text-muted">{formatRelative(a.at)}</span></li>)}</ul>
            ) : <EmptyState compact icon={Activity} title="No AI activity yet" />}
          </Card>
          <Card>
            <CardHeader title="AI provider" icon={Server} />
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between gap-2"><span className="text-ink">{PROVIDER_META[d.aiSettings.provider]?.short}</span><ProviderStatusBadge status={status} /></p>
              <p className="text-xs text-muted">{status === AI_STATUS.CONNECTED ? `Verified ${formatRelative(d.aiSettings.lastCheckedAt)} · ${d.aiSettings.modelInfo?.model || d.aiSettings.model || 'server model'}` : status === AI_STATUS.DEMO ? 'Demo mode: deterministic rule-based answers. No external AI is called.' : d.aiSettings.lastError || 'Not yet verified.'}</p>
              <PrivacyNote>Cloud providers are {d.aiSettings.allowCloudProviders ? 'allowed' : 'disabled'}; local AI is preferred for privacy.</PrivacyNote>
              {can.settings && <Button size="sm" variant="secondary" icon={Settings2} to="/ai/settings">AI settings</Button>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Try asking" icon={MessageSquare} />
            <ul className="space-y-1.5">{EXAMPLE_QUESTIONS.slice(0, 6).map((x) => <li key={x}><Link to={`/ai/assistant?q=${encodeURIComponent(x)}`} className="inline-flex items-center gap-1 text-sm text-brand hover:underline">{x} <ArrowUpRight size={12} /></Link></li>)}</ul>
          </Card>
          {open.some((i) => i.severity === 'critical') && <p className="flex items-center gap-1.5 text-xs text-danger"><AlertTriangle size={14} /> Critical insights need attention.</p>}
        </div>
      </div>
    </>
  )
}
