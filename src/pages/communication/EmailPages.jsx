import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, Send, Save, Inbox, FileText, History, Settings, PenSquare, RefreshCw, Plug, PlugZap, Unplug, Eye, Paperclip, X, RotateCcw, Trash2, MailOpen, Search, Star, AlertTriangle, CheckCircle2, ServerCog, FlaskConical } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Modal from '../../components/common/Modal'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import RowActions from '../../components/common/RowActions'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { ContextPicker, IntegrationBanner, VariableHelp, DemoNote } from '../../components/phase5/Comms'
import { MessageStatusBadge, SecretFieldNote } from '../../components/phase5/Badges'
import { userName } from '../../components/phase5/format'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { usePermission } from '../../hooks/usePermission'
import { useAuth } from '../../hooks/useAuth'
import { useTableQuery } from '../../hooks/useTableQuery'
import { deleteDraft, retryEmail, saveDraft, searchEmails, sendEmail, sendTestEmail } from '../../services/emailService'
import { connectInbox, disconnectInbox, getFolders, markAsRead, searchInbox, syncInbox } from '../../services/emailInboxService'
import { getEmailMode, saveSettings, testIMAPConnection, testSMTPConnection } from '../../services/emailSettingsService'
import { buildVariables, renderTemplate } from '../../services/emailTemplateService'
import { canViewDocument } from '../../services/documentService'
import { markInvoiceEmailed } from '../../services/invoiceService'
import { ENCRYPTION_OPTIONS, MESSAGE_STATUS_META, FAILED_STATUSES, SENT_STATUSES } from '../../config/communicationConfig'
import { GATEWAY_CONFIGURED } from '../../config/integrationConfig'
import { formatDateTime, formatRelative } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const NAV = [
  { id: 'overview', label: 'Overview', icon: Mail, to: '/communication/email' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, to: '/communication/email/inbox' },
  { id: 'sent', label: 'Sent', icon: Send, to: '/communication/email/sent' },
  { id: 'drafts', label: 'Drafts', icon: FileText, to: '/communication/email/drafts' },
  { id: 'history', label: 'History', icon: History, to: '/communication/email/history' },
  { id: 'templates', label: 'Templates', icon: PenSquare, to: '/communication/email/templates' },
]
export function EmailNav({ current }) {
  const navigate = useNavigate()
  const canInbox = usePermission('communication.inbox')
  return <Card className="mb-6"><Tabs value={current} onChange={(id) => navigate(NAV.find((n) => n.id === id).to)} tabs={NAV.filter((n) => n.id !== 'inbox' || canInbox)} /></Card>
}

/* ---------------- overview ---------------- */
export function EmailHome() {
  const d = usePhase5Data()
  const canSend = usePermission('communication.send')
  const canSettings = usePermission('communication.settings')
  const mode = getEmailMode(d.emailSettings)
  const h = d.emailHistory
  const s = d.emailSettings
  return (
    <>
      <PageHeader title="Email" description="Send through SMTP and read the shared inbox through IMAP — both via the backend gateway when real integration is enabled."
        actions={<div className="flex gap-2">{canSettings && <Button variant="secondary" icon={Settings} to="/communication/email/settings">Settings</Button>}{canSend && <Button icon={PenSquare} to="/communication/email/compose">Compose</Button>}</div>} />
      <IntegrationBanner mode={mode} channel="Email" settingsPath={canSettings ? '/communication/email/settings' : null} />
      <EmailNav current="overview" />
      <StatGrid cols={4}>
        <StatCard label="Drafts" value={d.emailDrafts.length} icon={FileText} tone="neutral" to="/communication/email/drafts" />
        <StatCard label="Inbox (unread)" value={`${d.emailInbox.filter((m) => m.folder === 'INBOX').length} (${d.emailInbox.filter((m) => !m.read).length})`} icon={Inbox} tone="info" to="/communication/email/inbox" />
        <StatCard label="Sent" value={h.filter((m) => SENT_STATUSES.includes(m.status)).length} icon={Send} tone="success" hint={`${h.filter((m) => m.status === 'SENT_DEMO').length} demo (not actually sent)`} to="/communication/email/sent" />
        <StatCard label="Failed" value={h.filter((m) => FAILED_STATUSES.includes(m.status)).length} icon={AlertTriangle} tone="danger" to="/communication/email/history?status=FAILED_DEMO" />
      </StatGrid>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Connection" icon={ServerCog} />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted">Mode</dt><dd className="text-ink">{s.mode === 'LIVE' ? 'Backend gateway' : 'Demo (simulated)'}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">SMTP (sending)</dt><dd className="text-right text-ink">{s.smtp.host ? `${s.smtp.host}:${s.smtp.port}` : 'Not configured'} · {s.smtpStatus.state.replace(/_/g, ' ').toLowerCase()}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">IMAP (inbox)</dt><dd className="text-right text-ink">{s.imap.host ? `${s.imap.host}:${s.imap.port}` : 'Not configured'} · {s.inboxConnected ? 'connected' : 'not connected'}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">Last inbox sync</dt><dd className="text-ink">{s.lastSyncAt ? formatRelative(s.lastSyncAt) : 'Never'}</dd></div>
          </dl>
        </Card>
        <Card>
          <CardHeader title="Recent email" icon={History} action={<Link to="/communication/email/history" className="text-xs font-medium text-brand hover:underline">History</Link>} />
          {h.length ? <ul className="divide-y divide-line">{[...h].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6).map((m) => <li key={m.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0 truncate"><span className="text-ink">{m.subject}</span> <span className="text-muted">→ {m.to.join(', ')}</span></span><MessageStatusBadge status={m.status} /></li>)}</ul> : <EmptyState compact title="No email yet" />}
        </Card>
      </div>
    </>
  )
}

/* ---------------- composer ---------------- */
export function EmailCompose() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const d = usePhase5Data()
  const { user } = useAuth()
  const draft = params.get('draftId') ? d.emailDrafts.find((x) => x.id === params.get('draftId')) : null
  const reply = params.get('replyTo') ? d.emailInbox.find((x) => x.id === params.get('replyTo')) : null
  const invoice = params.get('invoiceId') ? d.lk.invoices[params.get('invoiceId')] : null
  const invoiceTpl = d.emailTemplates.find((t) => t.code === 'INVOICE_EMAIL')
  const [v, setV] = useState(() => {
    if (draft) return { ...draft, to: draft.to.join(', '), cc: draft.cc.join(', '), bcc: draft.bcc.join(', ') }
    const ctx = { customerId: params.get('customerId') || invoice?.customerId || reply?.customerId || '', orderId: params.get('orderId') || invoice?.orderId || '', invoiceId: invoice?.id || '', deliveryNoteId: params.get('deliveryNoteId') || '' }
    const vars = buildVariables(ctx)
    const customer = d.lk.customers[ctx.customerId]
    return {
      to: reply?.from || invoice?.customerSnapshot?.email || customer?.email || '', cc: '', bcc: '',
      subject: reply ? `Re: ${reply.subject}` : invoice && invoiceTpl ? renderTemplate(invoiceTpl.subject, vars) : '',
      body: reply ? `\n\n— On ${formatDateTime(reply.receivedAt)}, ${reply.fromName || reply.from} wrote:\n> ${reply.body.split('\n').join('\n> ')}` : invoice && invoiceTpl ? renderTemplate(invoiceTpl.body, vars) : '',
      templateId: invoice && invoiceTpl ? invoiceTpl.id : '', attachments: [], ...ctx,
    }
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState('')
  const [preview, setPreview] = useState(false)
  const [draftId, setDraftId] = useState(draft?.id || null)
  const bodyRef = useRef(null)
  const mode = getEmailMode(d.emailSettings)
  const set = (k, val) => { setV((x) => ({ ...x, [k]: val })); setErrors((e) => ({ ...e, [k]: undefined })) }
  const vars = buildVariables(v)
  const applyTemplate = (id) => {
    const t = d.lk.emailTemplates[id]
    set('templateId', id)
    if (t) setV((x) => ({ ...x, templateId: id, subject: renderTemplate(t.subject, buildVariables(x)), body: renderTemplate(t.body, buildVariables(x)) }))
  }
  const refill = () => setV((x) => ({ ...x, subject: renderTemplate(x.subject, buildVariables(x)), body: renderTemplate(x.body, buildVariables(x)) }))
  const insert = (token) => {
    const el = bodyRef.current
    const pos = el?.selectionStart ?? v.body.length
    set('body', `${v.body.slice(0, pos)}${token}${v.body.slice(pos)}`)
  }
  const docs = d.documents.filter((x) => canViewDocument(user, x, d) && (!v.customerId && !v.orderId && !v.invoiceId ? true : [v.customerId, v.orderId, v.invoiceId, v.deliveryNoteId].includes(x.entityId)))
  const attach = (id) => { const doc = d.documents.find((x) => x.id === id); if (doc && !v.attachments.some((a) => a.documentId === id)) set('attachments', [...v.attachments, { documentId: id, name: doc.name }]) }
  const doSave = () => {
    const res = saveDraft(v, { id: draftId })
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    setDraftId(res.record.id)
    toast.success('Draft saved')
  }
  const doSend = async () => {
    setBusy('send')
    const res = await sendEmail(v, { draftId })
    setBusy('')
    if (!res.ok && !res.record) { setErrors(res.errors || {}); toast.error(res.error); return }
    if (v.invoiceId && res.ok) markInvoiceEmailed(v.invoiceId)
    if (res.demo) toast.success('Demo email recorded — nothing was sent', { description: `Status: ${MESSAGE_STATUS_META[res.record.status].label}` })
    else if (res.ok) toast.success('Accepted by the SMTP server', { description: 'Delivery is not confirmed until the provider reports it.' })
    else toast.error(`Not sent: ${res.error}`)
    navigate('/communication/email/history', { replace: true })
  }
  return (
    <>
      <PageHeader title={draft ? 'Edit draft' : reply ? 'Reply' : 'Compose email'} actions={<Button variant="secondary" icon={X} to="/communication/email">Close</Button>} />
      <IntegrationBanner mode={mode} channel="Email" />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="grid gap-3">
            <Input label="To" required value={v.to} onChange={(e) => set('to', e.target.value)} error={errors.to} placeholder="name@example.com, …" />
            <div className="grid gap-3 sm:grid-cols-2"><Input label="Cc" value={v.cc} onChange={(e) => set('cc', e.target.value)} error={errors.cc} /><Input label="Bcc" value={v.bcc} onChange={(e) => set('bcc', e.target.value)} error={errors.bcc} /></div>
            <Select label="Email template" placeholder="No template" value={v.templateId || ''} onChange={(e) => applyTemplate(e.target.value)} options={d.emailTemplates.filter((t) => t.active).map((t) => ({ value: t.id, label: t.name }))} />
            <Input label="Subject" required value={v.subject} onChange={(e) => set('subject', e.target.value)} error={errors.subject} maxLength={200} />
            <Textarea ref={bodyRef} label="Message" required value={v.body} onChange={(e) => set('body', e.target.value)} error={errors.body} rows={12} className="font-normal" />
            <VariableHelp onInsert={insert} />
            {v.attachments.length > 0 && <ul className="flex flex-wrap gap-2">{v.attachments.map((a) => <li key={a.documentId} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs"><Paperclip size={12} />{a.name}<button type="button" onClick={() => set('attachments', v.attachments.filter((x) => x.documentId !== a.documentId))} aria-label={`Remove ${a.name}`}><X size={12} /></button></li>)}</ul>}
            {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" icon={Eye} onClick={() => setPreview(true)}>Preview</Button>
            <Button variant="secondary" icon={Save} onClick={doSave}>Save draft</Button>
            <Button icon={Send} onClick={doSend} loading={busy === 'send'}>{mode === 'DEMO' ? 'Send (demo)' : 'Send'}</Button>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Related records" subtitle="Used for template variables and history" />
            <ContextPicker value={v} onChange={(ctx) => setV((x) => ({ ...x, ...ctx }))} />
            <Button className="mt-3" size="sm" variant="secondary" icon={RefreshCw} onClick={refill}>Fill variables</Button>
          </Card>
          <Card>
            <CardHeader title="Attach a document" icon={Paperclip} />
            <Select label="Document" placeholder={docs.length ? 'Choose document' : 'No documents for these records'} value="" onChange={(e) => attach(e.target.value)} options={docs.slice(0, 50).map((x) => ({ value: x.id, label: x.name }))} />
            <DemoNote>In backend mode the gateway fetches the file from document storage; temporary browser files cannot leave this device.</DemoNote>
          </Card>
          <Card><CardHeader title="Variables now" /><ul className="space-y-1 text-xs">{Object.entries(vars).filter(([, val]) => val).map(([k, val]) => <li key={k} className="flex justify-between gap-2"><span className="font-mono text-muted">{`{{${k}}}`}</span><span className="text-right text-ink">{val}</span></li>)}</ul></Card>
        </div>
      </div>
      <Modal open={preview} onClose={() => setPreview(false)} size="lg" icon={Eye} title="Preview" description={mode === 'DEMO' ? 'Demo mode — sending only records the message.' : 'Backend mode — the gateway sends through your SMTP server.'}>
        <div className="space-y-2 text-sm"><p><span className="text-muted">From:</span> {d.emailSettings.smtp.fromName} &lt;{d.emailSettings.smtp.fromEmail || 'not configured'}&gt;</p><p><span className="text-muted">To:</span> {v.to}</p><p className="font-semibold">{v.subject}</p><pre className="whitespace-pre-wrap rounded-lg bg-surface-2 p-3 font-sans text-ink">{v.body}</pre></div>
      </Modal>
    </>
  )
}

/* ---------------- inbox ---------------- */
export function EmailInbox() {
  const d = usePhase5Data()
  const navigate = useNavigate()
  const canSettings = usePermission('communication.settings')
  const [folder, setFolder] = useState('INBOX')
  const [q, setQ] = useState('')
  const [unread, setUnread] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [busy, setBusy] = useState(false)
  const s = d.emailSettings
  const mode = getEmailMode(s, 'imap')
  const list = useMemo(() => searchInbox(q, { folder, unread }, d.emailInbox).sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1)), [d.emailInbox, q, folder, unread])
  const msg = d.emailInbox.find((m) => m.id === openId)
  const open = async (m) => { setOpenId(m.id); if (!m.read) await markAsRead(m.id, true) }
  const sync = async () => { setBusy(true); const r = await syncInbox(); setBusy(false); if (!r.ok) toast.error(r.error); else toast.success(r.demo ? (r.added ? `${r.added} new demo message` : 'Demo inbox is up to date') : `${r.added} messages synced`) }
  return (
    <>
      <PageHeader title="Inbox" description="Shared mailbox read through IMAP by the backend gateway." actions={<div className="flex gap-2"><Button variant="secondary" icon={RefreshCw} onClick={sync} loading={busy}>Sync</Button><Button icon={PenSquare} to="/communication/email/compose">Compose</Button></div>} />
      <IntegrationBanner mode={mode} channel="Inbox (IMAP)" settingsPath={canSettings ? '/communication/email/settings' : null} />
      <EmailNav current="inbox" />
      {!s.inboxConnected && <p className="mb-4 rounded-lg bg-warning/10 px-3 py-2 text-sm text-ink">The inbox is not connected — showing the last synced messages. {canSettings ? <Link to="/communication/email/settings" className="font-medium text-brand hover:underline">Connect it in settings</Link> : 'Ask the Admin to connect it.'}</p>}
      <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card padded={false} className="h-fit p-2">
          <nav aria-label="Mail folders"><ul>{getFolders(d.emailInbox).map((f) => <li key={f.name}><button type="button" onClick={() => { setFolder(f.name); setOpenId(null) }} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm', folder === f.name ? 'bg-brand/10 font-medium text-brand' : 'text-ink hover:bg-surface-2')}><span>{f.name === 'INBOX' ? 'Inbox' : f.name}</span>{f.unread > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] text-white">{f.unread}</span>}</button></li>)}</ul></nav>
        </Card>
        <Card padded={false} className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
            <Input aria-label="Search inbox" icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search mail…" className="flex-1 min-w-[160px]" />
            <label className="flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={unread} onChange={(e) => setUnread(e.target.checked)} className="accent-[var(--brand)]" /> Unread only</label>
          </div>
          {list.length ? (
            <ul className="divide-y divide-line" aria-label="Messages">
              {list.map((m) => (
                <li key={m.id}><button type="button" onClick={() => open(m)} className={cn('block w-full px-4 py-3 text-left hover:bg-surface-2', openId === m.id && 'bg-brand/5')}>
                  <div className="flex items-center justify-between gap-2"><span className={cn('truncate text-sm', !m.read ? 'font-semibold text-ink' : 'text-ink')}>{m.fromName || m.from}</span><span className="shrink-0 text-xs text-muted">{formatRelative(m.receivedAt)}</span></div>
                  <p className={cn('truncate text-sm', !m.read ? 'font-medium text-ink' : 'text-muted')}>{m.starred && <Star size={12} className="mr-1 inline text-accent" />}{m.subject}</p>
                  <p className="truncate text-xs text-muted">{m.body.replace(/\s+/g, ' ').trim()}</p>
                  {m.demo && <span className="mt-1 inline-block rounded bg-accent/15 px-1.5 text-[10px] font-semibold uppercase text-[#8A5A00] dark:text-accent">demo</span>}
                </button></li>
              ))}
            </ul>
          ) : <EmptyState icon={Inbox} title="No messages" description={q ? 'Nothing matches your search.' : 'This folder is empty.'} />}
        </Card>
        <Card className="min-w-0 lg:col-span-2 xl:col-span-1">
          {msg ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0"><h2 className="text-lg font-semibold text-ink">{msg.subject}</h2><p className="text-sm text-muted">{msg.fromName} &lt;{msg.from}&gt; · {formatDateTime(msg.receivedAt)}</p></div>
                <div className="flex gap-1"><Button size="sm" variant="ghost" icon={msg.read ? Mail : MailOpen} onClick={() => markAsRead(msg.id, !msg.read)}>{msg.read ? 'Mark unread' : 'Mark read'}</Button><Button size="sm" icon={Send} onClick={() => navigate(`/communication/email/compose?replyTo=${msg.id}`)}>Reply</Button></div>
              </div>
              {msg.customerId && d.lk.customers[msg.customerId] && <p className="mt-2 text-xs text-muted">Customer: <Link to={`/customers/${msg.customerId}`} className="text-brand hover:underline">{d.lk.customers[msg.customerId].name}</Link></p>}
              <pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-ink">{msg.body}</pre>
              {msg.demo && <p className="mt-4 text-xs text-muted">Demo message — part of the seeded demo mailbox, not a real email.</p>}
            </div>
          ) : <EmptyState icon={MailOpen} title="Select a message" />}
        </Card>
      </div>
    </>
  )
}

/* ---------------- sent / drafts / history ---------------- */
export function EmailMailbox({ variant = 'history' }) {
  const navigate = useNavigate()
  const d = usePhase5Data()
  const canSend = usePermission('communication.send')
  const t = useTableQuery({ filters: ['status', 'customerId'] })
  const [open, setOpen] = useState(null)
  if (variant === 'drafts') {
    const drafts = [...d.emailDrafts].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    return (
      <>
        <PageHeader title="Drafts" actions={canSend && <Button icon={PenSquare} to="/communication/email/compose">Compose</Button>} />
        <EmailNav current="drafts" />
        <Card><DataTable caption="Drafts" rows={drafts} onRowClick={(m) => navigate(`/communication/email/compose?draftId=${m.id}`)} empty={<EmptyState icon={FileText} title="No drafts" />} columns={[
          { key: 's', header: 'Subject', render: (m) => <span className="font-medium">{m.subject || '(no subject)'}</span> },
          { key: 't', header: 'To', hideBelow: 'md', render: (m) => m.to.join(', ') || '—' },
          { key: 'u', header: 'Saved', render: (m) => formatRelative(m.updatedAt) },
          { key: 'a', header: '', align: 'right', render: (m) => <RowActions label={`Actions for ${m.subject}`} items={[{ label: 'Edit', icon: PenSquare, to: `/communication/email/compose?draftId=${m.id}` }, { label: 'Delete', icon: Trash2, danger: true, onClick: () => { deleteDraft(m.id); toast.success('Draft deleted') } }]} /> },
        ]} /></Card>
      </>
    )
  }
  const base = variant === 'sent' ? d.emailHistory.filter((m) => SENT_STATUSES.includes(m.status)) : d.emailHistory
  const rows = searchEmails(t.q, t.filters, base).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const retry = async (m) => { const r = await retryEmail(m.id); if (r.ok) toast.success(r.demo ? 'Demo retry recorded' : 'Accepted by the SMTP server'); else toast.error(r.error) }
  return (
    <>
      <PageHeader title={variant === 'sent' ? 'Sent' : 'Email history'} description="Demo sends are labelled “demo (not sent)”. Real sends show the SMTP provider’s answer — “Sent” means accepted, not delivered." actions={canSend && <Button icon={PenSquare} to="/communication/email/compose">Compose</Button>} />
      <EmailNav current={variant} />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search subject, recipient…" total={base.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset}>
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={Object.entries(MESSAGE_STATUS_META).filter(([k]) => k !== 'DRAFT').map(([value, m]) => ({ value, label: m.label }))} />
          <FilterSelect label="Customer" allLabel="All customers" value={t.filters.customerId} onChange={(v) => t.setFilter('customerId', v)} options={d.customers.map((c) => ({ value: c.id, label: c.name }))} />
        </FilterToolbar>
        <DataTable caption="Email" rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} onRowClick={setOpen} empty={<EmptyState icon={Mail} title="No email" />} columns={[
          { key: 's', header: 'Subject', render: (m) => (<div><p className="font-medium text-ink truncate max-w-[280px]">{m.subject}</p><p className="text-xs text-muted truncate max-w-[280px]">→ {m.to.join(', ')}</p></div>) },
          { key: 'r', header: 'Related', hideBelow: 'lg', render: (m) => <span className="text-xs">{[d.lk.customers[m.customerId]?.name, d.lk.orders[m.orderId]?.orderNumber, d.lk.invoices[m.invoiceId]?.invoiceNumber].filter(Boolean).join(' · ') || '—'}</span> },
          { key: 'b', header: 'By', hideBelow: 'md', render: (m) => <span className="text-xs">{m.automated ? 'Automation' : userName(d.users, m.createdBy)}</span> },
          { key: 'w', header: 'When', hideBelow: 'sm', render: (m) => <span className="text-xs whitespace-nowrap">{formatDateTime(m.createdAt)}</span> },
          { key: 'st', header: 'Status', render: (m) => <MessageStatusBadge status={m.status} /> },
          { key: 'a', header: '', align: 'right', render: (m) => FAILED_STATUSES.includes(m.status) && canSend && <Button size="xs" variant="secondary" icon={RotateCcw} onClick={(e) => { e.stopPropagation(); retry(m) }}>Retry</Button> },
        ]} />
      </Card>
      <Modal open={Boolean(open)} onClose={() => setOpen(null)} size="lg" icon={Mail} title={open?.subject} description={open && `To ${open.to.join(', ')} · ${formatDateTime(open.createdAt)}`}>
        {open && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2"><MessageStatusBadge status={open.status} />{open.mode === 'DEMO' && <span className="text-xs text-muted">Demo mode — no email left this browser.</span>}</div>
            {open.error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-danger">{open.error}</p>}
            <pre className="whitespace-pre-wrap rounded-lg bg-surface-2 p-3 font-sans text-ink">{open.body}</pre>
            {open.attachments?.length > 0 && <p className="text-xs text-muted">Attachments: {open.attachments.map((a) => a.name).join(', ')}</p>}
            <ol className="space-y-1 text-xs text-muted">{(open.events || []).map((e, i) => <li key={i}>{formatDateTime(e.at)} — {MESSAGE_STATUS_META[e.status]?.label || e.status}</li>)}</ol>
          </div>
        )}
      </Modal>
    </>
  )
}

export const EmailSent = () => <EmailMailbox variant="sent" />
export const EmailDrafts = () => <EmailMailbox variant="drafts" />
export const EmailHistory = () => <EmailMailbox variant="history" />

/* ---------------- settings ---------------- */
const st = (x) => ({ CONNECTED: ['success', CheckCircle2], FAILED: ['danger', AlertTriangle], DEMO_OK: ['warning', FlaskConical], INVALID: ['danger', AlertTriangle], PENDING: ['info', ServerCog], NOT_TESTED: ['neutral', Plug] })[x.state] || ['neutral', Plug]
function StatusLine({ status }) {
  const [tone, Icon] = st(status)
  return <p className={`mt-3 flex items-start gap-1.5 text-xs text-${tone === 'neutral' ? 'muted' : tone}`}><Icon size={13} className="mt-0.5 shrink-0" />{status.state === 'NOT_TESTED' ? 'Not tested yet.' : `${status.message} (${formatRelative(status.checkedAt)})`}</p> }

export function EmailSettings() {
  const d = usePhase5Data()
  const s = d.emailSettings
  const [v, setV] = useState(() => ({ mode: s.mode || 'DEMO', smtp: { ...s.smtp, port: String(s.smtp.port) }, imap: { ...s.imap, port: String(s.imap.port) } }))
  const [secrets, setSecrets] = useState({ smtpPassword: '', imapPassword: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState('')
  const [testTo, setTestTo] = useState('')
  const setPart = (part, k, val) => { setV((x) => ({ ...x, [part]: { ...x[part], [k]: val } })); setErrors((e) => ({ ...e, [`${part}.${k}`]: undefined })) }
  const run = async (key, fn) => { setBusy(key); const r = await fn(); setBusy(''); return r }
  const save = async () => {
    const r = await run('save', () => saveSettings(v, secrets))
    if (!r.ok) { setErrors(r.errors || {}); toast.error(r.error); return }
    setSecrets({ smtpPassword: '', imapPassword: '' })
    toast.success('Email settings saved', { description: r.secretsStored === 'gateway' ? 'Passwords were sent to the integration gateway — not stored in this browser.' : r.secretsStored === 'discarded' ? 'Demo mode: the passwords you typed were discarded, not stored.' : undefined })
  }
  const report = (r, label) => {
    if (r.ok && r.demo) toast.info(`${label}: demo check passed`, { description: r.status.message })
    else if (r.ok) toast.success(`${label}: connected`, { description: r.status.message })
    else toast.error(`${label}: ${r.error}`)
  }
  return (
    <>
      <PageHeader title="Email settings" description="SMTP sends email; IMAP reads the shared inbox. Real connections are made only by the backend integration gateway." actions={<Button icon={Save} onClick={save} loading={busy === 'save'}>Save settings</Button>} />
      <IntegrationBanner mode={getEmailMode(s)} channel="Email" />
      <Card className="mb-6">
        <CardHeader title="Integration mode" icon={ServerCog} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Mode" value={v.mode} onChange={(e) => setV((x) => ({ ...x, mode: e.target.value }))} options={[{ value: 'DEMO', label: 'Demo — simulate sending and inbox' }, { value: 'LIVE', label: 'Backend gateway — real SMTP / IMAP' }]} />
          <div className="text-xs text-muted sm:pt-7">{GATEWAY_CONFIGURED ? 'An integration gateway is configured for this build.' : 'No integration gateway is configured for this build (VITE_INTEGRATION_GATEWAY_URL), so backend mode stays “API integration pending”.'}</div>
        </div>
        <div className="mt-3"><SecretFieldNote /></div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="SMTP — sending" icon={Send} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="SMTP host" required value={v.smtp.host} onChange={(e) => setPart('smtp', 'host', e.target.value)} error={errors['smtp.host']} placeholder="smtp.example.com" />
            <Input label="SMTP port" required type="number" value={v.smtp.port} onChange={(e) => setPart('smtp', 'port', e.target.value)} error={errors['smtp.port']} />
            <Input label="SMTP username" required value={v.smtp.username} onChange={(e) => setPart('smtp', 'username', e.target.value)} error={errors['smtp.username']} autoComplete="off" />
            <Input label="SMTP password" type="password" value={secrets.smtpPassword} onChange={(e) => setSecrets((x) => ({ ...x, smtpPassword: e.target.value }))} autoComplete="new-password" hint={s.smtp.passwordSet ? 'Set in the gateway — type to replace' : 'Never stored in this browser'} />
            <Select label="Encryption" value={v.smtp.encryption} onChange={(e) => setPart('smtp', 'encryption', e.target.value)} options={ENCRYPTION_OPTIONS} error={errors['smtp.encryption']} />
            <Input label="From email" required value={v.smtp.fromEmail} onChange={(e) => setPart('smtp', 'fromEmail', e.target.value)} error={errors['smtp.fromEmail']} />
            <Input label="From name" required value={v.smtp.fromName} onChange={(e) => setPart('smtp', 'fromName', e.target.value)} error={errors['smtp.fromName']} />
            <Input label="Reply-To" value={v.smtp.replyTo} onChange={(e) => setPart('smtp', 'replyTo', e.target.value)} error={errors['smtp.replyTo']} />
          </div>
          {v.smtp.encryption === 'NONE' && <p className="mt-2 text-xs text-danger">Unencrypted SMTP is for demo only — never use it with real credentials.</p>}
          <StatusLine status={s.smtpStatus} />
          <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" icon={PlugZap} onClick={async () => report(await run('smtp', testSMTPConnection), 'SMTP')} loading={busy === 'smtp'}>Test SMTP connection</Button>
            <Input aria-label="Test email recipient" placeholder="test recipient" value={testTo} onChange={(e) => setTestTo(e.target.value)} className="min-w-[200px] flex-1" />
            <Button variant="secondary" icon={Send} onClick={async () => { const r = await run('test', () => sendTestEmail(testTo)); if (!r.ok && !r.record) toast.error(r.error); else toast.success(r.demo ? 'Demo test email recorded (not sent)' : r.ok ? 'Test email accepted by the SMTP server' : `Failed: ${r.error}`) }} loading={busy === 'test'}>Send test email</Button>
          </div>
        </Card>
        <Card>
          <CardHeader title="IMAP — inbox" icon={Inbox} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="IMAP host" required value={v.imap.host} onChange={(e) => setPart('imap', 'host', e.target.value)} error={errors['imap.host']} placeholder="imap.example.com" />
            <Input label="IMAP port" required type="number" value={v.imap.port} onChange={(e) => setPart('imap', 'port', e.target.value)} error={errors['imap.port']} />
            <Input label="IMAP username" required value={v.imap.username} onChange={(e) => setPart('imap', 'username', e.target.value)} error={errors['imap.username']} autoComplete="off" />
            <Input label="IMAP password" type="password" value={secrets.imapPassword} onChange={(e) => setSecrets((x) => ({ ...x, imapPassword: e.target.value }))} autoComplete="new-password" hint={s.imap.passwordSet ? 'Set in the gateway — type to replace' : 'Never stored in this browser'} />
            <Select label="Encryption" value={v.imap.encryption} onChange={(e) => setPart('imap', 'encryption', e.target.value)} options={ENCRYPTION_OPTIONS} error={errors['imap.encryption']} />
            <Input label="Mailbox folder" required value={v.imap.folder} onChange={(e) => setPart('imap', 'folder', e.target.value)} error={errors['imap.folder']} />
          </div>
          <StatusLine status={s.imapStatus} />
          <p className="mt-1 text-xs text-muted">Inbox: {s.inboxConnected ? `connected ${formatRelative(s.inboxConnectedAt)}` : 'not connected'} · last sync {s.lastSyncAt ? formatRelative(s.lastSyncAt) : 'never'}</p>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <Button variant="secondary" icon={PlugZap} onClick={async () => report(await run('imap', testIMAPConnection), 'IMAP')} loading={busy === 'imap'}>Test IMAP connection</Button>
            {s.inboxConnected
              ? <Button variant="secondary" icon={Unplug} onClick={async () => { const r = await run('disc', disconnectInbox); if (r.ok) toast.success('Inbox disconnected'); else toast.error(r.error) }}>Disconnect inbox</Button>
              : <Button icon={Plug} onClick={async () => { const r = await run('conn', connectInbox); if (r.ok) toast.success(r.demo ? 'Demo inbox connected' : 'Inbox connected through the gateway'); else toast.error(r.error) }} loading={busy === 'conn'}>Connect inbox</Button>}
            <Button variant="ghost" icon={RefreshCw} onClick={async () => { const r = await run('sync', syncInbox); if (r.ok) toast.success(r.demo ? 'Demo inbox synced' : `${r.added} messages synced`); else toast.error(r.error) }} loading={busy === 'sync'}>Sync inbox</Button>
          </div>
        </Card>
      </div>
    </>
  )
}
