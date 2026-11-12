import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Activity, Bot, Plus, Server, Sigma, Star } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Toggle from '../../components/common/Toggle'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import { InfoNote, ProviderStatusBadge } from '../../components/ai/AiBadges'
import { usePermission } from '../../hooks/usePermission'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { checkBackendModel, MODEL_STATUS_META, modelPerformance, registerBackendModel, setModelEnabled } from '../../services/ai/aiModelService'
import { saveForecastSettings } from '../../services/ai/forecastService'
import { getProviderStatus } from '../../services/ai/aiProviderService'
import { isGatewayConfigured } from '../../services/integrationGateway'
import { FORECAST_MODEL_META, FORECAST_MODELS, PROVIDER_META } from '../../config/aiConfig'
import { formatDateTime } from '../../utils/formatters'

const StatusBadge = ({ status }) => { const m = MODEL_STATUS_META[status] || { label: status, tone: 'neutral' }; return <Badge tone={m.tone} dot>{m.label}</Badge> }

export default function ModelManagement() {
  const d = usePhase6Data()
  const canManage = usePermission('ai.models.manage')
  const canTune = usePermission('forecasting.generate')
  const perf = useMemo(() => modelPerformance(d.forecasts), [d.forecasts])
  const [registering, setRegistering] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', library: '', endpoint: '/ml/forecast', version: '', description: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(null)
  const s = d.forecastSettings
  const [tune, setTune] = useState({ maWindow: s.maWindow, sesAlpha: s.sesAlpha, holtAlpha: s.holtAlpha, holtBeta: s.holtBeta, confidenceLevel: s.confidenceLevel, historyDays: s.historyDays })
  const forecasting = d.models.filter((m) => m.kind === 'forecasting')
  const assistant = d.models.filter((m) => m.kind === 'assistant')
  const providerStatus = getProviderStatus(d.aiSettings)
  const enabledCodes = forecasting.filter((m) => m.engine === 'PROTOTYPE' && m.enabled).map((m) => m.code)

  const toggle = (m, v) => { const r = setModelEnabled(m.id, v); if (!r.ok) toast.error(r.error); else toast.success(`${m.name} ${v ? 'enabled' : 'disabled'}`) }
  const check = async (m) => { setBusy(m.id); const r = await checkBackendModel(m.id); setBusy(null); if (r.ok) toast.success(`${m.name} is ready`); else toast.error(r.error) }
  const register = () => {
    const r = registerBackendModel(form)
    setErrors(r.errors || {})
    if (!r.ok) return toast.error(r.error)
    setRegistering(false)
    return toast.success('Model registered — integration pending until its health check passes')
  }
  const saveTune = () => {
    const r = saveForecastSettings(Object.fromEntries(Object.entries(tune).map(([k, v]) => [k, Number(v)])))
    setErrors(r.errors || {})
    if (!r.ok) return toast.error(r.error)
    return toast.success('Forecasting parameters saved')
  }

  return (
    <>
      <PageHeader title="Model management" description="Forecasting models, their real backtest performance, and the assistant model. Prototype models are statistical formulas — none is a trained ML model."
        actions={canManage && <Button icon={Plus} onClick={() => { setForm({ name: '', code: '', library: '', endpoint: '/ml/forecast', version: '', description: '' }); setErrors({}); setRegistering(true) }}>Register backend model</Button>} />
      {!isGatewayConfigured() && <InfoNote className="mb-4">Backend ML integration is pending: no integration gateway is configured, so backend models cannot be checked or used. Prototype models keep working.</InfoNote>}
      <Card className="mb-6">
        <CardHeader title="Forecasting models" icon={Sigma} subtitle="Performance is averaged from stored forecasts’ holdout backtests only" />
        <DataTable rows={forecasting} dense columns={[
          { key: 'n', header: 'Model', render: (m) => <div><p className="flex items-center gap-1.5 font-medium text-ink">{m.name}{s.defaultModel === m.code && <Badge tone="brand"><Star size={11} /> Default</Badge>}</p><p className="max-w-[380px] text-xs text-muted">{m.description}</p></div> },
          { key: 'e', header: 'Engine', render: (m) => (m.engine === 'PROTOTYPE' ? <Badge tone="accent">Browser · statistical</Badge> : <Badge tone="info">Backend · {m.library}</Badge>) },
          { key: 'v', header: 'Version', hideBelow: 'md', render: (m) => <span className="tabular text-xs">{m.version}</span> },
          { key: 's', header: 'Status', render: (m) => <StatusBadge status={m.enabled ? m.status : m.status === 'ACTIVE' ? 'DISABLED' : m.status} /> },
          { key: 'p', header: 'Backtests · accuracy', align: 'right', hideBelow: 'lg', render: (m) => (perf[m.code] ? <span className="tabular text-xs">{perf[m.code].count} · {perf[m.code].accuracy === null ? 'n/a' : `${perf[m.code].accuracy}%`}</span> : <span className="text-xs text-muted">no forecasts</span>) },
          { key: 'a', header: <span className="sr-only">Actions</span>, render: (m) => (canManage ? (m.engine === 'PROTOTYPE'
            ? <div className="flex items-center gap-2"><Toggle checked={m.enabled} onChange={(v) => toggle(m, v)} label={<span className="sr-only">Enable {m.name}</span>} />{m.enabled && s.defaultModel !== m.code && <Button size="xs" variant="ghost" onClick={() => { const r = saveForecastSettings({ defaultModel: m.code }); if (!r.ok) toast.error(r.error); else toast.success(`${m.name} is now the default`) }}>Make default</Button>}</div>
            : <div className="flex items-center gap-2"><Button size="xs" variant="secondary" icon={Activity} loading={busy === m.id} onClick={() => check(m)}>Health check</Button>{m.status === 'ACTIVE' && <Toggle checked={m.enabled} onChange={(v) => toggle(m, v)} label={<span className="sr-only">Enable {m.name}</span>} />}</div>) : null) },
        ]} />
        {canManage && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Default forecasting model:</span>
            <Select aria-label="Default forecasting model" value={s.defaultModel} onChange={(e) => { const r = saveForecastSettings({ defaultModel: e.target.value }); if (!r.ok) toast.error(r.error); else toast.success('Default model saved') }}
              options={[FORECAST_MODELS.AUTO, ...enabledCodes].map((c) => ({ value: c, label: FORECAST_MODEL_META[c]?.label || c }))} className="w-64" />
          </div>
        )}
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Forecasting parameters" icon={Sigma} subtitle="Applied to new forecasts" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Moving-average window (days)" type="number" value={tune.maWindow} onChange={(e) => setTune((t) => ({ ...t, maWindow: e.target.value }))} error={errors.maWindow} disabled={!canTune} />
            <Input label="History used (days)" type="number" value={tune.historyDays} onChange={(e) => setTune((t) => ({ ...t, historyDays: e.target.value }))} error={errors.historyDays} disabled={!canTune} />
            <Input label="Smoothing α (SES)" type="number" step="0.05" value={tune.sesAlpha} onChange={(e) => setTune((t) => ({ ...t, sesAlpha: e.target.value }))} error={errors.sesAlpha} disabled={!canTune} />
            <Input label="Holt α (level)" type="number" step="0.05" value={tune.holtAlpha} onChange={(e) => setTune((t) => ({ ...t, holtAlpha: e.target.value }))} error={errors.holtAlpha} disabled={!canTune} />
            <Input label="Holt β (trend)" type="number" step="0.05" value={tune.holtBeta} onChange={(e) => setTune((t) => ({ ...t, holtBeta: e.target.value }))} error={errors.holtBeta} disabled={!canTune} />
            <Select label="Confidence interval" value={String(tune.confidenceLevel)} onChange={(e) => setTune((t) => ({ ...t, confidenceLevel: Number(e.target.value) }))} options={[80, 90, 95, 99].map((v) => ({ value: String(v), label: `${v}%` }))} error={errors.confidenceLevel} disabled={!canTune} />
          </div>
          {canTune && <Button className="mt-4" onClick={saveTune}>Save parameters</Button>}
        </Card>
        <Card>
          <CardHeader title="Assistant models" icon={Bot} />
          <DataTable rows={assistant} dense columns={[
            { key: 'n', header: 'Model', render: (m) => <div><p className="font-medium text-ink">{m.name}</p><p className="text-xs text-muted">{m.description}</p></div> },
            { key: 's', header: 'Status', render: (m) => (m.code === 'DEMO' ? <StatusBadge status="ACTIVE" /> : m.code === d.aiSettings.provider ? <ProviderStatusBadge status={providerStatus} /> : <StatusBadge status="INTEGRATION_PENDING" />) },
          ]} />
          <div className="mt-3 space-y-1 text-xs text-muted">
            <p className="flex items-center gap-1.5"><Server size={12} /> Active provider: {PROVIDER_META[d.aiSettings.provider]?.label}{d.aiSettings.modelInfo?.model ? ` · ${d.aiSettings.modelInfo.model}` : ''}</p>
            {d.aiSettings.lastCheckedAt && <p>Last checked {formatDateTime(d.aiSettings.lastCheckedAt)}</p>}
          </div>
        </Card>
      </div>
      <Modal open={registering} onClose={() => setRegistering(false)} title="Register backend model" description="The model stays “integration pending” until the gateway’s /ml/models/{code} health check returns ready."
        footer={<><Button variant="secondary" onClick={() => setRegistering(false)}>Cancel</Button><Button onClick={register}>Register</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} data-autofocus />
          <Input label="Code" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} error={errors.code} hint="e.g. BE_XGB" />
          <Input label="Library" required value={form.library} onChange={(e) => setForm((f) => ({ ...f, library: e.target.value }))} error={errors.library} hint="e.g. scikit-learn" />
          <Input label="Gateway path" required value={form.endpoint} onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))} error={errors.endpoint} />
          <Input label="Version" value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} />
          <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
      </Modal>
    </>
  )
}
