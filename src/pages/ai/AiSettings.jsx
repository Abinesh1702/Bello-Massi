import { useState } from 'react'
import { toast } from 'sonner'
import { Cloud, KeyRound, PlugZap, RotateCcw, Save, Server, ShieldCheck, Terminal } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Toggle from '../../components/common/Toggle'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { InfoNote, PrivacyNote, ProviderStatusBadge } from '../../components/ai/AiBadges'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { getProviderStatus, saveAiSettings, setCloudProvidersAllowed, testConnection } from '../../services/ai/aiProviderService'
import { isGatewayConfigured } from '../../services/integrationGateway'
import { logAiActivity } from '../../services/ai/aiActivityService'
import storage from '../../services/storageService'
import { AI_PROVIDERS, AI_STATUS, DATA_SHARING, PROVIDER_META } from '../../config/aiConfig'
import { formatDateTime } from '../../utils/formatters'

export default function AiSettings() {
  const d = usePhase6Data()
  const s = d.aiSettings
  const [form, setForm] = useState(() => ({ provider: s.provider, connection: s.connection, endpoint: s.endpoint, model: s.model, temperature: s.temperature, maxTokens: s.maxTokens, timeoutMs: s.timeoutMs, retries: s.retries, dataSharing: s.dataSharing, maxContextRows: s.maxContextRows, preferLocal: s.preferLocal, allowCloudProviders: s.allowCloudProviders }))
  const [apiKey, setApiKey] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState('')
  const [resetting, setResetting] = useState(false)
  const meta = PROVIDER_META[form.provider]
  const status = getProviderStatus(s)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const chooseProvider = (p) => {
    const m = PROVIDER_META[p]
    setForm((f) => ({ ...f, provider: p, connection: p === AI_PROVIDERS.DEMO ? 'none' : m.connections.includes(f.connection) ? f.connection : m.connections[0], endpoint: m.defaultEndpoint, model: m.defaultModel }))
    setErrors({})
  }
  const providers = Object.entries(PROVIDER_META).map(([value, m]) => ({ value, label: `${m.label}${m.cloud && !form.allowCloudProviders ? ' — disabled' : ''}` }))

  const save = async () => {
    setBusy('save')
    const r = await saveAiSettings(form, { apiKey })
    setBusy('')
    setErrors(r.errors || {})
    setApiKey('')
    if (!r.ok) return toast.error(r.error)
    if (r.secretsStored === 'gateway') toast.success('Saved. The API key was sent to the integration gateway and not stored in this browser.')
    else if (r.secretsStored === 'discarded') toast.warning('Saved. The API key was discarded — it can only be held by the integration gateway, which is not configured.')
    else toast.success('AI settings saved')
    return undefined
  }
  const test = async () => {
    setBusy('test')
    const r = await testConnection()
    setBusy('')
    if (r.ok) toast.success(r.status === AI_STATUS.DEMO ? r.message : `Connected · ${r.info?.model || 'model ready'}`)
    else toast.error(r.error)
  }
  const reset = () => {
    const r = storage.resetAiData()
    setResetting(false)
    if (!r.ok) return toast.error(r.error)
    logAiActivity({ kind: 'settings', action: 'reset_ai_demo_data' })
    return toast.success('AI demo data reset. Phase 1–5 data was not touched.')
  }

  return (
    <>
      <PageHeader title="AI settings" description="Choose the AI provider, how it is reached and what data it may receive. API keys are never stored in this browser."
        actions={<><Button variant="secondary" icon={PlugZap} loading={busy === 'test'} onClick={test}>Test connection</Button><Button icon={Save} loading={busy === 'save'} onClick={save}>Save</Button></>}>
        <div className="flex flex-wrap items-center gap-2 text-xs"><span className="text-muted">Current:</span><span className="font-medium text-ink">{PROVIDER_META[s.provider]?.label}</span><ProviderStatusBadge status={status} />{s.lastCheckedAt && <span className="text-muted">checked {formatDateTime(s.lastCheckedAt)}</span>}</div>
      </PageHeader>
      {s.lastError && status !== AI_STATUS.CONNECTED && s.provider !== AI_PROVIDERS.DEMO && <p className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink" role="alert">Last error: {s.lastError}</p>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Provider" icon={Server} subtitle={meta?.description} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="AI provider" value={form.provider} onChange={(e) => chooseProvider(e.target.value)} options={providers} error={errors.provider} />
              <Select label="Connection" value={form.connection} onChange={(e) => set('connection', e.target.value)} disabled={form.provider === AI_PROVIDERS.DEMO} error={errors.connection}
                options={form.provider === AI_PROVIDERS.DEMO ? [{ value: 'none', label: 'None (runs in browser)' }] : meta.connections.map((c) => ({ value: c, label: c === 'direct' ? 'Direct to local server (no API key)' : `Integration gateway${isGatewayConfigured() ? '' : ' — not configured'}` }))} />
              {form.provider !== AI_PROVIDERS.DEMO && <Input label="API endpoint" value={form.endpoint} onChange={(e) => set('endpoint', e.target.value)} placeholder={meta.defaultEndpoint || 'Gateway default'} error={errors.endpoint} hint={form.connection === 'direct' ? 'The browser calls this URL. The server must allow this app’s origin (CORS).' : 'Passed to the gateway; leave blank for its default.'} />}
              {form.provider !== AI_PROVIDERS.DEMO && <Input label="Model name" value={form.model} onChange={(e) => set('model', e.target.value)} placeholder={form.provider === AI_PROVIDERS.OPENJARVIS ? 'Server default (from /v1/info)' : ''} error={errors.model} />}
              {form.provider !== AI_PROVIDERS.DEMO && form.connection === 'gateway' && (
                <Input label="API key" type="password" autoComplete="new-password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} icon={KeyRound}
                  hint={isGatewayConfigured() ? 'Sent once to the gateway on Save, then cleared. Never stored here.' : 'No gateway configured — a key typed here is discarded, never stored.'} />
              )}
            </div>
            {meta?.capabilities && <p className="mt-3 text-xs text-muted"><b className="text-ink">Capabilities:</b> {meta.capabilities.join(' · ')}</p>}
          </Card>
          <Card>
            <CardHeader title="Request settings" icon={PlugZap} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Temperature" type="number" step="0.1" value={form.temperature} onChange={(e) => set('temperature', e.target.value)} error={errors.temperature} />
              <Input label="Max tokens" type="number" value={form.maxTokens} onChange={(e) => set('maxTokens', e.target.value)} error={errors.maxTokens} />
              <Input label="Timeout (ms)" type="number" value={form.timeoutMs} onChange={(e) => set('timeoutMs', e.target.value)} error={errors.timeoutMs} />
              <Input label="Retries on network error" type="number" value={form.retries} onChange={(e) => set('retries', e.target.value)} error={errors.retries} hint="Never retried on 4xx (bad request / auth)." />
            </div>
          </Card>
          <Card>
            <CardHeader title="Privacy & data sharing" icon={ShieldCheck} />
            <div className="space-y-4">
              <Select label="What the provider receives" value={form.dataSharing} onChange={(e) => set('dataSharing', e.target.value)} options={[{ value: DATA_SHARING.SUMMARIES, label: 'Question + permission-filtered result summary (recommended)' }, { value: DATA_SHARING.NONE, label: 'Question only — no application data' }]} />
              <Input label="Max rows per summary" type="number" min={1} max={50} value={form.maxContextRows} onChange={(e) => set('maxContextRows', e.target.value)} />
              <Toggle label="Allow cloud providers" description="Off by default. When off, Gemini / OpenAI-compatible cannot be selected and an active cloud provider falls back to Demo." checked={s.allowCloudProviders}
                onChange={(v) => { const r = setCloudProvidersAllowed(v); if (!r.ok) return toast.error(r.error); set('allowCloudProviders', v); if (!v && PROVIDER_META[form.provider]?.cloud) chooseProvider(AI_PROVIDERS.DEMO); return toast.success(v ? 'Cloud providers allowed' : 'Cloud providers disabled') }} />
              <Toggle label="Prefer local AI" description="Recommend OpenJarvis or Ollama when privacy is required." checked={form.preferLocal} onChange={(v) => set('preferLocal', v)} />
              <PrivacyNote>The assistant never sends the database to a provider. Each answer is computed by a permission-checked tool first; at most a short summary of that result is shared.</PrivacyNote>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Connecting OpenJarvis" icon={Terminal} />
            <ol className="list-decimal space-y-1.5 pl-4 text-xs text-muted">
              <li>Install OpenJarvis (Apache-2.0, Python 3.10–3.13) and an engine such as Ollama.</li>
              <li>Run <code className="rounded bg-surface-2 px-1 text-ink">jarvis serve</code> — default port 8000.</li>
              <li>For <b className="text-ink">direct</b> mode set <code className="rounded bg-surface-2 px-1 text-ink">OPENJARVIS_CORS_ORIGINS</code> to this app’s origin and leave <code className="rounded bg-surface-2 px-1 text-ink">OPENJARVIS_API_KEY</code> unset (local only).</li>
              <li>If the server needs an API key, use <b className="text-ink">gateway</b> mode so the key stays on the server.</li>
              <li>Test connection: checks <code className="text-ink">/health</code>, <code className="text-ink">/v1/info</code> and <code className="text-ink">/v1/models</code>. Chat uses <code className="text-ink">/v1/chat/completions</code>; Jarvis speech uses <code className="text-ink">/v1/speech/*</code>.</li>
            </ol>
          </Card>
          {s.modelInfo && (
            <Card>
              <CardHeader title="Verified model information" icon={Server} />
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted">Model</dt><dd className="text-ink">{s.modelInfo.model || '—'}</dd>
                <dt className="text-muted">Engine</dt><dd className="text-ink">{s.modelInfo.engine || '—'}</dd>
                {s.modelInfo.agent && <><dt className="text-muted">Agent</dt><dd className="text-ink">{s.modelInfo.agent}</dd></>}
                {s.modelInfo.models?.length > 0 && <><dt className="text-muted">Available</dt><dd className="text-xs text-ink">{s.modelInfo.models.join(', ')}</dd></>}
              </dl>
            </Card>
          )}
          <Card>
            <CardHeader title="Security" icon={Cloud} />
            <ul className="space-y-1.5 text-xs text-muted">
              <li>• API keys are never written to LocalStorage and are not in VITE_* variables.</li>
              <li>• Cloud providers are reachable only through the integration gateway.</li>
              <li>• Status shows <b className="text-ink">Connected</b> only after a successful health check and model response.</li>
              <li>• Every provider call, test and settings change is in the AI activity log (without credentials).</li>
            </ul>
          </Card>
          <Card>
            <CardHeader title="Demo AI data" icon={RotateCcw} />
            <p className="text-xs text-muted">Rebuild AI settings, conversations, Jarvis history, insights, forecasts, predictions, recommendations and replenishment drafts from current data. Orders, stock and other Phase 1–5 data are not touched.</p>
            <Button className="mt-3" variant="danger-outline" icon={RotateCcw} onClick={() => setResetting(true)}>Reset demo AI data</Button>
          </Card>
          <InfoNote>Demo mode is always available: if a provider is unreachable, the rule-based engine answers and says so.</InfoNote>
        </div>
      </div>
      <ConfirmDialog open={resetting} onClose={() => setResetting(false)} tone="danger" title="Reset demo AI data?" description="All AI conversations, Jarvis history, forecasts, insights statuses and replenishment drafts are replaced with fresh demo data." confirmLabel="Reset AI data" onConfirm={reset} />
    </>
  )
}
