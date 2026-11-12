import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, MessageCircle, Inbox, Send, AlertTriangle, FileText, PenSquare, Zap, Save, History, BellRing } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import Select from '../../components/common/Select'
import Toggle from '../../components/common/Toggle'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { IntegrationModeBadge, MessageStatusBadge } from '../../components/phase5/Badges'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { usePermission } from '../../hooks/usePermission'
import { getEmailMode } from '../../services/emailSettingsService'
import { getIntegrationMode } from '../../services/openWAService'
import { renderTemplate, sampleVariables } from '../../services/emailTemplateService'
import { saveRule, setAutomationEnabled } from '../../services/automationService'
import { CHANNELS, EVENT_LABEL, FAILED_STATUSES, RECIPIENT_RULES, SENT_STATUSES } from '../../config/communicationConfig'
import { formatDateTime, formatRelative } from '../../utils/formatters'

export default function CommunicationCenter() {
  const d = usePhase5Data()
  const canSend = usePermission('communication.send')
  const canInbox = usePermission('communication.inbox')
  const canAuto = usePermission('communication.automation')
  const e = d.emailHistory
  const w = d.whatsappMessages
  const recent = [
    ...e.map((m) => ({ id: m.id, channel: 'Email', icon: Mail, to: m.to.join(', '), text: m.subject, status: m.status, at: m.createdAt, automated: m.automated })),
    ...w.map((m) => ({ id: m.id, channel: 'WhatsApp', icon: MessageCircle, to: m.recipient, text: m.body, status: m.status, at: m.createdAt, automated: m.automated })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 10)
  return (
    <>
      <PageHeader title="Communication Center" description="Email and WhatsApp in one place: drafts, inbox, sent and failed messages, templates and automated notifications."
        actions={canSend && <div className="flex gap-2"><Button variant="secondary" icon={MessageCircle} to="/communication/whatsapp/compose">WhatsApp</Button><Button icon={PenSquare} to="/communication/email/compose">Email</Button></div>} />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card><div className="flex items-center justify-between gap-2"><Link to="/communication/email" className="flex items-center gap-2 font-semibold text-ink hover:underline"><Mail size={18} /> Email integration</Link><IntegrationModeBadge mode={getEmailMode(d.emailSettings)} /></div><p className="mt-1 text-xs text-muted">SMTP {d.emailSettings.smtp.host || 'not configured'} · inbox {d.emailSettings.inboxConnected ? 'connected' : 'not connected'}</p></Card>
        <Card><div className="flex items-center justify-between gap-2"><Link to="/communication/whatsapp" className="flex items-center gap-2 font-semibold text-ink hover:underline"><MessageCircle size={18} /> OpenWA WhatsApp</Link><IntegrationModeBadge mode={getIntegrationMode(d.openwaSettings)} /></div><p className="mt-1 text-xs text-muted">Session “{d.openwaSettings.sessionName}” · {d.openwaSettings.sessionStatus.replace(/_/g, ' ')}</p></Card>
      </div>
      <StatGrid cols={4}>
        <StatCard label="Email drafts" value={d.emailDrafts.length} icon={FileText} tone="neutral" to="/communication/email/drafts" />
        {canInbox && <StatCard label="Inbox messages" value={d.emailInbox.length} icon={Inbox} tone="info" hint={`${d.emailInbox.filter((m) => !m.read).length} unread`} to="/communication/email/inbox" />}
        <StatCard label="Sent emails" value={e.filter((m) => SENT_STATUSES.includes(m.status)).length} icon={Send} tone="success" hint={`${e.filter((m) => m.status === 'SENT_DEMO').length} demo`} to="/communication/email/sent" />
        <StatCard label="Failed emails" value={e.filter((m) => FAILED_STATUSES.includes(m.status)).length} icon={AlertTriangle} tone="danger" to="/communication/email/history" />
      </StatGrid>
      <div className="mt-4"><StatGrid cols={4}>
        <StatCard label="WhatsApp drafts" value={w.filter((m) => m.status === 'DRAFT').length} icon={FileText} tone="neutral" to="/communication/whatsapp/history?status=DRAFT" />
        <StatCard label="Sent WhatsApp" value={w.filter((m) => SENT_STATUSES.includes(m.status)).length} icon={Send} tone="success" hint={`${w.filter((m) => m.status === 'SENT_DEMO').length} demo`} to="/communication/whatsapp/history" />
        <StatCard label="Failed WhatsApp" value={w.filter((m) => FAILED_STATUSES.includes(m.status)).length} icon={AlertTriangle} tone="danger" to="/communication/whatsapp/history" />
        <StatCard label="Templates" value={d.emailTemplates.length + d.whatsappTemplates.length} icon={PenSquare} tone="brand" hint={`${d.emailTemplates.length} email · ${d.whatsappTemplates.length} WhatsApp`} to="/communication/email/templates" />
      </StatGrid></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent communications" icon={History} />
          {recent.length ? <ul className="divide-y divide-line">{recent.map((r) => <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="flex min-w-0 items-center gap-2"><r.icon size={15} className="shrink-0 text-muted" /><span className="min-w-0 truncate"><span className="text-ink">{r.text}</span> <span className="text-muted">→ {r.to}{r.automated ? ' · automated' : ''} · {formatRelative(r.at)}</span></span></span><MessageStatusBadge status={r.status} /></li>)}</ul> : <EmptyState compact title="No communications yet" />}
        </Card>
        <Card>
          <CardHeader title="Automated notifications" icon={Zap} action={canAuto && <Link to="/communication/automation" className="text-xs font-medium text-brand hover:underline">Configure</Link>} />
          <p className="text-sm text-ink">{d.notificationTemplates.filter((r) => r.enabled).length} of {d.notificationTemplates.length} events enabled · automation {d.communicationSettings.automationEnabled ? 'on' : 'off'}</p>
          <ul className="mt-3 space-y-1.5 text-xs">{d.notificationHistory.slice(0, 5).map((h) => <li key={h.id} className="flex justify-between gap-2"><span className="truncate text-muted">{EVENT_LABEL[h.event]}</span><span className="shrink-0 text-ink">{h.status === 'SKIPPED' ? 'skipped' : h.status.toLowerCase().replace(/_/g, ' ')}</span></li>)}</ul>
        </Card>
      </div>
    </>
  )
}

/** Automated notification rules (Admin). */
export function AutomationSettings() {
  const d = usePhase5Data()
  const canEdit = usePermission('communication.automation')
  const [editing, setEditing] = useState(null)
  const [errors, setErrors] = useState({})
  const sample = sampleVariables()
  const save = () => {
    const r = saveRule(editing.id, editing)
    if (!r.ok) { setErrors(r.errors || {}); toast.error(r.error); return }
    setEditing(null)
    toast.success(`${EVENT_LABEL[r.record.event]} saved`)
  }
  const et = editing && d.lk.emailTemplates[editing.emailTemplateId]
  const wt = editing && d.lk.whatsappTemplates[editing.whatsappTemplateId]
  return (
    <>
      <PageHeader title="Automated notifications" description="Messages generated from workflow events. Each event is sent at most once per record; demo mode records simulated messages only." />
      <Card className="mb-6">
        <Toggle label="Automation enabled" description="Switch off to stop all automated email and WhatsApp messages (events are still logged as skipped)." checked={d.communicationSettings.automationEnabled} onChange={(x) => { const r = setAutomationEnabled(x); if (r.ok === false) toast.error(r.error); else toast.success(`Automation ${x ? 'enabled' : 'disabled'}`) }} disabled={!canEdit} />
      </Card>
      <Card className="mb-6">
        <CardHeader title="Events" icon={BellRing} />
        <DataTable caption="Notification rules" rows={d.notificationTemplates} onRowClick={canEdit ? (r) => { setErrors({}); setEditing({ ...r }) } : undefined} columns={[
          { key: 'e', header: 'Event', render: (r) => <span className="font-medium">{EVENT_LABEL[r.event]}</span> },
          { key: 'c', header: 'Channel', render: (r) => CHANNELS.find((c) => c.value === r.channel)?.label },
          { key: 'r', header: 'Recipients', hideBelow: 'md', render: (r) => RECIPIENT_RULES.find((x) => x.value === r.recipientRule)?.label },
          { key: 't', header: 'Templates', hideBelow: 'lg', render: (r) => <span className="text-xs">{[['EMAIL', 'BOTH'].includes(r.channel) && d.lk.emailTemplates[r.emailTemplateId]?.name, ['WHATSAPP', 'BOTH'].includes(r.channel) && d.lk.whatsappTemplates[r.whatsappTemplateId]?.name].filter(Boolean).join(' · ')}</span> },
          { key: 'n', header: 'Sent', align: 'right', hideBelow: 'sm', render: (r) => d.notificationHistory.filter((h) => h.event === r.event && h.status !== 'SKIPPED').length },
          { key: 's', header: 'Status', render: (r) => <Badge tone={r.enabled ? 'success' : 'neutral'} dot>{r.enabled ? 'Enabled' : 'Disabled'}</Badge> },
        ]} />
      </Card>
      <Card>
        <CardHeader title="Notification history" icon={History} />
        <DataTable caption="Notification history" rows={d.notificationHistory} pageSize={10} empty={<EmptyState compact title="No automated notifications yet" />} columns={[
          { key: 'e', header: 'Event', render: (h) => EVENT_LABEL[h.event] },
          { key: 'c', header: 'Channel', hideBelow: 'sm', render: (h) => h.channel },
          { key: 'r', header: 'Recipient', hideBelow: 'md', render: (h) => <span className="text-xs">{h.recipient || '—'}</span> },
          { key: 'w', header: 'When', hideBelow: 'sm', render: (h) => <span className="text-xs">{formatDateTime(h.createdAt)}</span> },
          { key: 's', header: 'Result', render: (h) => (h.status === 'SKIPPED' || h.status === 'PARTIAL' ? <span className="text-xs text-muted" title={h.note}>{h.status === 'SKIPPED' ? `Skipped — ${h.note || h.results?.[0]?.note || ''}` : 'Partly failed'}</span> : <MessageStatusBadge status={h.status} />) },
        ]} />
      </Card>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} size="lg" icon={Zap} title={editing ? EVENT_LABEL[editing.event] : ''}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button icon={Save} onClick={save}>Save rule</Button></>}>
        {editing && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle className="sm:col-span-2" label="Enabled" checked={editing.enabled} onChange={(x) => setEditing((r) => ({ ...r, enabled: x }))} />
            <Select label="Channel" value={editing.channel} onChange={(e) => setEditing((r) => ({ ...r, channel: e.target.value }))} options={CHANNELS} />
            <Select label="Recipient rule" value={editing.recipientRule} onChange={(e) => setEditing((r) => ({ ...r, recipientRule: e.target.value }))} options={RECIPIENT_RULES} />
            {['EMAIL', 'BOTH'].includes(editing.channel) && <Select label="Email template" value={editing.emailTemplateId} onChange={(e) => setEditing((r) => ({ ...r, emailTemplateId: e.target.value }))} options={d.emailTemplates.map((t) => ({ value: t.id, label: t.name }))} error={errors.emailTemplateId} />}
            {['WHATSAPP', 'BOTH'].includes(editing.channel) && <Select label="WhatsApp template" value={editing.whatsappTemplateId} onChange={(e) => setEditing((r) => ({ ...r, whatsappTemplateId: e.target.value }))} options={d.whatsappTemplates.map((t) => ({ value: t.id, label: t.name }))} error={errors.whatsappTemplateId} />}
            <div className="sm:col-span-2 space-y-2 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Message preview (sample values)</p>
              {['EMAIL', 'BOTH'].includes(editing.channel) && et && <div className="rounded-lg bg-surface-2 p-3"><p className="font-semibold">{renderTemplate(et.subject, sample)}</p><pre className="mt-1 whitespace-pre-wrap font-sans text-xs">{renderTemplate(et.body, sample)}</pre></div>}
              {['WHATSAPP', 'BOTH'].includes(editing.channel) && wt && <div className="rounded-lg bg-[#d9fdd3] p-3 text-xs text-[#111b21]">{renderTemplate(wt.body, sample)}</div>}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
