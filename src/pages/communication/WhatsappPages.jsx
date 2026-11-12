import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { MessageCircle, Send, History, PenSquare, Settings, PlugZap, Unplug, RefreshCw, Save, X, RotateCcw, Smartphone, CheckCircle2, AlertTriangle, ServerCog, QrCode, Activity, Clock } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { ContextPicker, IntegrationBanner, VariableHelp } from '../../components/phase5/Comms'
import { IntegrationModeBadge, MessageStatusBadge, SecretFieldNote } from '../../components/phase5/Badges'
import { userName } from '../../components/phase5/format'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { usePermission } from '../../hooks/usePermission'
import { useTableQuery } from '../../hooks/useTableQuery'
import { connectSession, disconnectSession, getConnectionStatus, getIntegrationMode, saveSettings, testConnection, validatePhoneNumber } from '../../services/openWAService'
import { retryWhatsapp, saveWhatsappDraft, sendWhatsapp, deleteWhatsappDraft } from '../../services/whatsappMessageService'
import { buildVariables, renderTemplate } from '../../services/emailTemplateService'
import { COUNTRY_CODES, FAILED_STATUSES, MESSAGE_STATUS_META, SENT_STATUSES } from '../../config/communicationConfig'
import { GATEWAY_CONFIGURED } from '../../config/integrationConfig'
import { formatDateTime, formatRelative } from '../../utils/formatters'

const NAV = [
  { id: 'overview', label: 'Overview', icon: MessageCircle, to: '/communication/whatsapp' },
  { id: 'compose', label: 'Compose', icon: PenSquare, to: '/communication/whatsapp/compose' },
  { id: 'history', label: 'History', icon: History, to: '/communication/whatsapp/history' },
  { id: 'templates', label: 'Templates', icon: PenSquare, to: '/communication/whatsapp/templates' },
]
export function WhatsappNav({ current }) {
  const navigate = useNavigate()
  return <Card className="mb-6"><Tabs value={current} onChange={(id) => navigate(NAV.find((n) => n.id === id).to)} tabs={NAV} /></Card>
}

const SESSION_LABEL = { demo_ready: 'Demo session connected (simulated)', demo_stopped: 'Demo session disconnected', not_started: 'Not started', ready: 'Ready — connected to WhatsApp', qr_ready: 'Waiting for QR scan', initializing: 'Initialising', authenticating: 'Authenticating', disconnected: 'Disconnected', failed: 'Failed', action_required: 'Action required on the phone', unreachable: 'OpenWA unreachable', not_found: 'Session not found on OpenWA', unknown: 'Unknown — refresh status', created: 'Created' }

/* ---------------- overview / session dashboard ---------------- */
export function WhatsappHome() {
  const d = usePhase5Data()
  const canSettings = usePermission('communication.settings')
  const canSend = usePermission('communication.send')
  const [busy, setBusy] = useState('')
  const s = d.openwaSettings
  const mode = getIntegrationMode(s)
  const m = d.whatsappMessages
  const act = async (key, fn, ok) => { setBusy(key); const r = await fn(); setBusy(''); if (r.ok) toast.success(r.message || ok); else toast.error(r.error); return r }
  return (
    <>
      <PageHeader title="WhatsApp (OpenWA)" description="WhatsApp messages through an OpenWA gateway. The OpenWA API key lives only in the backend proxy."
        actions={<div className="flex gap-2">{canSettings && <Button variant="secondary" icon={Settings} to="/communication/whatsapp/settings">Settings</Button>}{canSend && <Button icon={PenSquare} to="/communication/whatsapp/compose">Compose</Button>}</div>} />
      <IntegrationBanner mode={mode} channel="WhatsApp" settingsPath={canSettings ? '/communication/whatsapp/settings' : null} />
      <WhatsappNav current="overview" />
      <StatGrid cols={4}>
        <StatCard label="Total messages" value={m.length} icon={MessageCircle} tone="brand" to="/communication/whatsapp/history" />
        <StatCard label="Sent" value={m.filter((x) => SENT_STATUSES.includes(x.status)).length} icon={CheckCircle2} tone="success" hint={`${m.filter((x) => x.status === 'SENT_DEMO').length} demo (not actually sent)`} to="/communication/whatsapp/history" />
        <StatCard label="Failed" value={m.filter((x) => FAILED_STATUSES.includes(x.status)).length} icon={AlertTriangle} tone="danger" to="/communication/whatsapp/history?status=FAILED_DEMO" />
        <StatCard label="Drafts" value={m.filter((x) => x.status === 'DRAFT').length} icon={PenSquare} tone="neutral" to="/communication/whatsapp/history?status=DRAFT" />
      </StatGrid>
      <Card className="mt-6">
        <CardHeader title="Session" subtitle={`OpenWA session “${s.sessionName}”`} icon={Smartphone} action={<IntegrationModeBadge mode={mode} />} />
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-xs text-muted">Session status</dt><dd className="text-ink" data-testid="wa-session-status">{SESSION_LABEL[s.sessionStatus] || s.sessionStatus}</dd></div>
          <div><dt className="text-xs text-muted">Last connected</dt><dd className="text-ink">{s.lastConnectedAt ? formatDateTime(s.lastConnectedAt) : 'Never'}</dd></div>
          <div><dt className="text-xs text-muted">Last checked</dt><dd className="text-ink">{s.lastCheckedAt ? formatRelative(s.lastCheckedAt) : 'Never'}</dd></div>
          <div><dt className="text-xs text-muted">Phone</dt><dd className="text-ink">{s.phone ? `+${s.phone}` : s.mode === 'LIVE' ? '—' : 'Demo'}</dd></div>
        </dl>
        {s.lastError && <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{s.lastError}</p>}
        {s.qr && s.qrStatus === 'ready' && <div className="mt-4 flex items-center gap-4"><img src={s.qr} alt="WhatsApp QR code" className="h-40 w-40 rounded-lg border border-line bg-white p-2" /><p className="text-sm text-muted">Scan with WhatsApp → Linked devices on the business phone, then refresh the status.</p></div>}
        {canSettings && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            {['demo_ready', 'ready'].includes(s.sessionStatus)
              ? <Button variant="secondary" icon={Unplug} onClick={() => act('disc', disconnectSession, 'Session disconnected')} loading={busy === 'disc'}>Disconnect session</Button>
              : <Button icon={PlugZap} onClick={() => act('conn', connectSession, s.mode === 'LIVE' ? 'Session started' : 'Demo session connected')} loading={busy === 'conn'}>{s.mode === 'LIVE' ? 'Connect session' : 'Connect demo session'}</Button>}
            <Button variant="secondary" icon={RefreshCw} onClick={() => act('refresh', getConnectionStatus, 'Status refreshed')} loading={busy === 'refresh'}>Refresh status</Button>
            <Button variant="ghost" icon={Activity} onClick={() => act('test', testConnection, 'Connection test passed')} loading={busy === 'test'}>Test connection</Button>
          </div>
        )}
      </Card>
      <Card className="mt-6">
        <CardHeader title="Recent messages" icon={Clock} />
        {m.length ? <ul className="divide-y divide-line">{[...m].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6).map((x) => <li key={x.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0 truncate"><span className="tabular text-ink">{x.recipient || '—'}</span> <span className="text-muted">· {x.body.slice(0, 60)}</span></span><MessageStatusBadge status={x.status} /></li>)}</ul> : <EmptyState compact title="No messages yet" />}
      </Card>
    </>
  )
}

/* ---------------- composer ---------------- */
export function WhatsappCompose() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const d = usePhase5Data()
  const s = d.openwaSettings
  const invoice = params.get('invoiceId') ? d.lk.invoices[params.get('invoiceId')] : null
  const invTpl = d.whatsappTemplates.find((t) => t.code === 'INVOICE_NOTIFICATION')
  const [v, setV] = useState(() => {
    const ctx = { customerId: params.get('customerId') || invoice?.customerId || '', orderId: params.get('orderId') || invoice?.orderId || '', invoiceId: invoice?.id || '', dispatchId: params.get('dispatchId') || '', deliveryNoteId: params.get('deliveryNoteId') || '' }
    const c = d.lk.customers[ctx.customerId]
    return { ...ctx, recipient: c?.mobile || invoice?.customerSnapshot?.mobile || '', countryCode: s.countryCode || '91', templateId: invoice && invTpl ? invTpl.id : '', body: invoice && invTpl ? renderTemplate(invTpl.body, buildVariables(ctx)) : '' }
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const mode = getIntegrationMode(s)
  const set = (k, val) => { setV((x) => ({ ...x, [k]: val })); setErrors((e) => ({ ...e, [k]: undefined })) }
  const phone = v.recipient ? validatePhoneNumber(v.recipient, v.countryCode) : null
  const onContext = (ctx) => setV((x) => {
    const c = d.lk.customers[ctx.customerId]
    return { ...x, ...ctx, recipient: ctx.customerId !== x.customerId && c?.mobile ? c.mobile : x.recipient }
  })
  const applyTemplate = (id) => { const t = d.lk.whatsappTemplates[id]; setV((x) => ({ ...x, templateId: id, body: t ? renderTemplate(t.body, buildVariables(x)) : x.body })) }
  const send = async () => {
    setBusy(true)
    const r = await sendWhatsapp(v)
    setBusy(false)
    if (!r.ok && !r.record) { setErrors(r.errors || {}); toast.error(r.error); return }
    if (r.ok) toast.success(r.demo ? 'Demo message recorded — nothing was sent' : 'Handed to WhatsApp by OpenWA', { description: r.demo ? undefined : 'Delivery is confirmed only by later status updates.' })
    else toast.error(`Not sent: ${r.error}`)
    navigate('/communication/whatsapp/history', { replace: true })
  }
  const draft = () => { const r = saveWhatsappDraft(v); if (r.ok) { toast.success('Draft saved'); navigate('/communication/whatsapp/history?status=DRAFT') } else toast.error(r.error) }
  return (
    <>
      <PageHeader title="New WhatsApp message" actions={<Button variant="secondary" icon={X} to="/communication/whatsapp">Close</Button>} />
      <IntegrationBanner mode={mode} channel="WhatsApp" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="grid gap-3">
            <ContextPicker value={v} onChange={onContext} show={['customerId', 'orderId', 'dispatchId', 'invoiceId', 'deliveryNoteId']} />
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <Select label="Country" value={v.countryCode} onChange={(e) => set('countryCode', e.target.value)} options={COUNTRY_CODES} />
              <Input label="Recipient mobile" required inputMode="tel" value={v.recipient} onChange={(e) => set('recipient', e.target.value)} error={errors.recipient || (phone && !phone.ok ? phone.error : undefined)} hint={phone?.ok ? `Will send to ${phone.e164}` : 'Auto-filled from the customer'} />
            </div>
            <Select label="Template" placeholder="No template" value={v.templateId} onChange={(e) => applyTemplate(e.target.value)} options={d.whatsappTemplates.filter((t) => t.active).map((t) => ({ value: t.id, label: t.name }))} />
            <Textarea label="Message" required value={v.body} onChange={(e) => set('body', e.target.value)} error={errors.body} rows={6} hint={`${v.body.length}/4096`} />
            <VariableHelp onInsert={(tok) => set('body', `${v.body}${tok}`)} />
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => set('body', renderTemplate(v.body, buildVariables(v)))}>Fill variables</Button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4 sm:flex sm:justify-end">
            <Button variant="secondary" onClick={draft}>Save draft</Button>
            <Button icon={Send} onClick={send} loading={busy}>{mode === 'DEMO' ? 'Send demo message' : 'Send message'}</Button>
          </div>
        </Card>
        <Card>
          <CardHeader title="Preview" subtitle={phone?.ok ? phone.e164 : 'Recipient'} icon={Smartphone} />
          <div className="rounded-xl bg-[#e5ddd5] p-4 dark:bg-[#0b141a]" style={{ minHeight: 160 }}>
            <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-sm text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">{v.body || 'Your message'}<span className="mt-1 block text-right text-[10px] opacity-60">{mode === 'DEMO' ? 'demo — not sent' : 'via OpenWA'}</span></div>
          </div>
        </Card>
      </div>
    </>
  )
}

/* ---------------- history ---------------- */
export function WhatsappHistory() {
  const navigate = useNavigate()
  const d = usePhase5Data()
  const canSend = usePermission('communication.send')
  const t = useTableQuery({ filters: ['status', 'customerId'] })
  const rows = d.whatsappMessages.filter((m) => (!t.filters.status || m.status === t.filters.status) && (!t.filters.customerId || m.customerId === t.filters.customerId) && (!t.q || [m.recipient, m.body].some((x) => String(x || '').toLowerCase().includes(t.q.toLowerCase())))).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const retry = async (m) => { const r = await retryWhatsapp(m.id); if (r.ok) toast.success(r.demo ? 'Demo retry recorded' : 'Handed to WhatsApp'); else toast.error(r.error) }
  return (
    <>
      <PageHeader title="WhatsApp history" description="Demo messages are labelled “demo (not sent)”. Real statuses come from OpenWA’s responses." actions={canSend && <Button icon={PenSquare} to="/communication/whatsapp/compose">Compose</Button>} />
      <WhatsappNav current="history" />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search number or text…" total={d.whatsappMessages.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset}>
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={Object.entries(MESSAGE_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} />
          <FilterSelect label="Customer" allLabel="All customers" value={t.filters.customerId} onChange={(v) => t.setFilter('customerId', v)} options={d.customers.map((c) => ({ value: c.id, label: c.name }))} />
        </FilterToolbar>
        <DataTable caption="WhatsApp messages" rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} empty={<EmptyState icon={MessageCircle} title="No messages" />} columns={[
          { key: 'id', header: 'Message', hideBelow: 'xl', render: (m) => <span className="text-xs tabular text-muted">{m.id}</span> },
          { key: 'r', header: 'Recipient', render: (m) => (<div><p className="tabular text-ink whitespace-nowrap">{m.recipient || '—'}</p><p className="text-xs text-muted">{d.lk.customers[m.customerId]?.name || ''}</p></div>) },
          { key: 'b', header: 'Message', render: (m) => <span className="block max-w-[320px] truncate text-sm">{m.body}</span> },
          { key: 'e', header: 'Related', hideBelow: 'lg', render: (m) => <span className="text-xs">{[d.lk.orders[m.orderId]?.orderNumber, d.lk.dispatches[m.dispatchId]?.dispatchNumber, d.lk.invoices[m.invoiceId]?.invoiceNumber].filter(Boolean).join(' · ') || '—'}</span> },
          { key: 'by', header: 'By', hideBelow: 'md', render: (m) => <span className="text-xs">{m.automated ? 'Automation' : userName(d.users, m.createdBy)} · {formatRelative(m.createdAt)}</span> },
          { key: 's', header: 'Status', render: (m) => <div><MessageStatusBadge status={m.status} />{m.error && <p className="mt-1 max-w-[220px] text-xs text-danger">{m.error}</p>}</div> },
          { key: 'a', header: '', align: 'right', render: (m) => (canSend && FAILED_STATUSES.includes(m.status) ? <Button size="xs" variant="secondary" icon={RotateCcw} onClick={() => retry(m)}>Retry</Button> : m.status === 'DRAFT' && canSend ? <div className="flex justify-end gap-1"><Button size="xs" variant="secondary" onClick={() => navigate(`/communication/whatsapp/compose?customerId=${m.customerId || ''}&orderId=${m.orderId || ''}`)}>Open</Button><Button size="xs" variant="ghost" onClick={() => { deleteWhatsappDraft(m.id); toast.success('Draft deleted') }}>Delete</Button></div> : null) },
        ]} />
      </Card>
    </>
  )
}

/* ---------------- settings ---------------- */
export function WhatsappSettings() {
  const d = usePhase5Data()
  const s = d.openwaSettings
  const [v, setV] = useState(() => ({ mode: s.mode, baseUrl: s.baseUrl, apiEndpoint: s.apiEndpoint, sessionName: s.sessionName, countryCode: s.countryCode, apiToken: '' }))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k, val) => { setV((x) => ({ ...x, [k]: val })); setErrors((e) => ({ ...e, [k]: undefined })) }
  const save = async () => {
    setBusy(true)
    const r = await saveSettings(v)
    setBusy(false)
    if (!r.ok) { setErrors(r.errors || {}); toast.error(r.error); return }
    setV((x) => ({ ...x, apiToken: '' }))
    toast.success('OpenWA settings saved', { description: r.tokenDiscarded ? 'The API token you typed was discarded — it is never stored in this browser.' : undefined })
  }
  return (
    <>
      <PageHeader title="OpenWA settings" description="Connection details for the OpenWA WhatsApp gateway. The browser talks only to the Bellomassi integration gateway, which adds OpenWA’s X-API-Key." actions={<Button icon={Save} onClick={save} loading={busy}>Save settings</Button>} />
      <IntegrationBanner mode={getIntegrationMode(s)} channel="WhatsApp" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Configuration" icon={ServerCog} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Integration mode" value={v.mode} onChange={(e) => set('mode', e.target.value)} options={[{ value: 'DEMO', label: 'Demo mode (simulated)' }, { value: 'LIVE', label: 'Real — through backend gateway' }]} className="sm:col-span-2" />
            <Input label="OpenWA base URL" value={v.baseUrl} onChange={(e) => set('baseUrl', e.target.value)} error={errors.baseUrl} placeholder="https://openwa.example.com" hint="Where your OpenWA server runs (used by the gateway)." />
            <Input label="API endpoint" value={v.apiEndpoint} onChange={(e) => set('apiEndpoint', e.target.value)} error={errors.apiEndpoint} hint="OpenWA serves its REST API under /api." />
            <Input label="Session name" value={v.sessionName} onChange={(e) => set('sessionName', e.target.value)} error={errors.sessionName} hint="3–50 letters, numbers or hyphens." />
            <Select label="Default country code" value={v.countryCode} onChange={(e) => set('countryCode', e.target.value)} options={COUNTRY_CODES} error={errors.countryCode} />
            <Input label="API token" type="password" value={v.apiToken} onChange={(e) => set('apiToken', e.target.value)} autoComplete="new-password" placeholder={s.tokenSet ? 'Stored in the gateway — type to replace' : 'Sent to the gateway only'} className="sm:col-span-2" />
          </div>
          <div className="mt-3"><SecretFieldNote /></div>
        </Card>
        <Card>
          <CardHeader title="Status" icon={QrCode} action={<IntegrationModeBadge mode={getIntegrationMode(s)} />} />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted">API configuration</dt><dd className="text-right text-ink">{s.mode === 'LIVE' ? (GATEWAY_CONFIGURED ? (s.tokenSet ? 'Gateway configured · token set' : 'Gateway configured · token not confirmed') : 'Pending — no gateway in this build') : 'Not needed in demo mode'}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">Session</dt><dd className="text-right text-ink">{SESSION_LABEL[s.sessionStatus] || s.sessionStatus}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">QR code</dt><dd className="text-right text-ink">{s.qrStatus === 'ready' ? 'Ready to scan' : s.qrStatus === 'unavailable' ? 'Not available' : '—'}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">Last connected</dt><dd className="text-right text-ink">{s.lastConnectedAt ? formatDateTime(s.lastConnectedAt) : 'Never'}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-muted">“Connected” is shown only after OpenWA (through the gateway) reports the session as <code>ready</code>. Manage the session from the WhatsApp overview.</p>
          <Button className="mt-3" variant="secondary" icon={Smartphone} to="/communication/whatsapp">Session dashboard</Button>
        </Card>
      </div>
    </>
  )
}
