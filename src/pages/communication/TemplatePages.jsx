import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Save, X, PenSquare, Eye } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import DataTable from '../../components/common/DataTable'
import RowActions from '../../components/common/RowActions'
import EmptyState from '../../components/common/EmptyState'
import Input from '../../components/common/Input'
import Textarea from '../../components/common/Textarea'
import Toggle from '../../components/common/Toggle'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { VariableHelp } from '../../components/phase5/Comms'
import { EmailNav } from './EmailPages'
import { WhatsappNav } from './WhatsappPages'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { usePermission } from '../../hooks/usePermission'
import { deleteEmailTemplate, renderTemplate, sampleVariables, saveEmailTemplate } from '../../services/emailTemplateService'
import { deleteWhatsappTemplate, saveWhatsappTemplate } from '../../services/whatsappTemplateService'
import { formatDate } from '../../utils/formatters'

const CH = {
  EMAIL: { title: 'Email templates', base: '/communication/email/templates', list: (d) => d.emailTemplates, save: saveEmailTemplate, remove: deleteEmailTemplate, Nav: () => <EmailNav current="templates" />, subject: true },
  WHATSAPP: { title: 'WhatsApp templates', base: '/communication/whatsapp/templates', list: (d) => d.whatsappTemplates, save: saveWhatsappTemplate, remove: deleteWhatsappTemplate, Nav: () => <WhatsappNav current="templates" />, subject: false },
}

export function MessageTemplateList({ channel = 'EMAIL' }) {
  const c = CH[channel]
  const navigate = useNavigate()
  const d = usePhase5Data()
  const canEdit = usePermission('communication.templates')
  const rows = c.list(d)
  const usedBy = (t) => d.notificationTemplates.filter((r) => r.emailTemplateId === t.id || r.whatsappTemplateId === t.id).length
  return (
    <>
      <PageHeader title={c.title} description="Reusable messages with {{variables}} filled from real customers, orders, dispatches, invoices and delivery notes." actions={canEdit && <Button icon={Plus} to={`${c.base}/create`}>New template</Button>} />
      <c.Nav />
      <Card>
        <DataTable caption={c.title} rows={rows} onRowClick={canEdit ? (t) => navigate(`${c.base}/${t.id}/edit`) : undefined} empty={<EmptyState icon={PenSquare} title="No templates" />} columns={[
          { key: 'n', header: 'Template', render: (t) => (<div><p className="font-medium text-ink">{t.name}</p>{c.subject && <p className="text-xs text-muted truncate max-w-[320px]">{t.subject}</p>}</div>) },
          { key: 'b', header: 'Message', hideBelow: 'lg', render: (t) => <span className="block max-w-md truncate text-xs text-muted">{t.body.replace(/\n/g, ' ')}</span> },
          { key: 'u', header: 'Automations', align: 'right', hideBelow: 'md', render: (t) => usedBy(t) },
          { key: 'd', header: 'Updated', hideBelow: 'sm', render: (t) => formatDate(t.updatedAt) },
          { key: 's', header: 'Status', render: (t) => <div className="flex flex-wrap gap-1">{t.builtIn && <Badge tone="info">Built-in</Badge>}<Badge tone={t.active ? 'success' : 'neutral'} dot>{t.active ? 'Active' : 'Inactive'}</Badge></div> },
          { key: 'a', header: '', align: 'right', render: (t) => canEdit && <RowActions label={`Actions for ${t.name}`} items={[{ label: 'Edit', icon: Pencil, to: `${c.base}/${t.id}/edit` }, { label: 'Delete', icon: Trash2, danger: true, hidden: t.builtIn, onClick: () => { const r = c.remove(t.id); if (r.ok) toast.success('Template deleted'); else toast.error(r.error) } }]} /> },
        ]} />
      </Card>
    </>
  )
}

function TemplateEditor({ channel, existing }) {
  const c = CH[channel]
  const navigate = useNavigate()
  const [v, setV] = useState(() => (existing ? { ...existing } : { name: '', subject: '', body: '', active: true }))
  const [errors, setErrors] = useState({})
  const bodyRef = useRef(null)
  const sample = sampleVariables()
  const set = (k, val) => { setV((x) => ({ ...x, [k]: val })); setErrors((e) => ({ ...e, [k]: undefined })) }
  const insert = (token) => { const pos = bodyRef.current?.selectionStart ?? v.body.length; set('body', `${v.body.slice(0, pos)}${token}${v.body.slice(pos)}`) }
  const save = (e) => {
    e.preventDefault()
    const r = c.save(v, { id: existing?.id })
    if (!r.ok) { setErrors(r.errors || {}); toast.error(r.error); return }
    toast.success(existing ? 'Template saved' : 'Template created')
    navigate(c.base, { replace: true })
  }
  return (
    <>
      <PageHeader title={existing ? `Edit ${existing.name}` : `New ${channel === 'EMAIL' ? 'email' : 'WhatsApp'} template`} actions={<Button variant="secondary" icon={X} to={c.base}>Cancel</Button>} />
      <form onSubmit={save} noValidate className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="grid gap-3">
            <Input label="Template name" required value={v.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={60} />
            {c.subject && <Input label="Subject" required value={v.subject} onChange={(e) => set('subject', e.target.value)} error={errors.subject} maxLength={200} />}
            <Textarea ref={bodyRef} label="Message" required value={v.body} onChange={(e) => set('body', e.target.value)} error={errors.body} rows={channel === 'EMAIL' ? 12 : 6} hint={channel === 'WHATSAPP' ? `${v.body.length}/4096 characters` : undefined} />
            <VariableHelp onInsert={insert} />
            <Toggle label="Active" description="Inactive templates are hidden from the composer." checked={v.active} onChange={(x) => set('active', x)} />
          </div>
          <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4"><Button variant="secondary" to={c.base}>Cancel</Button><Button type="submit" icon={Save}>Save template</Button></div>
        </Card>
        <Card>
          <CardHeader title="Preview with sample values" icon={Eye} />
          {channel === 'EMAIL' ? (
            <div className="space-y-2 text-sm"><p className="font-semibold text-ink">{renderTemplate(v.subject, sample) || '(subject)'}</p><pre className="whitespace-pre-wrap rounded-lg bg-surface-2 p-3 font-sans text-ink">{renderTemplate(v.body, sample) || '(message)'}</pre></div>
          ) : (
            <div className="rounded-xl bg-[#e5ddd5] p-4 dark:bg-[#0b141a]"><div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-sm text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">{renderTemplate(v.body, sample) || '(message)'}</div></div>
          )}
        </Card>
      </form>
    </>
  )
}

export function MessageTemplateForm({ channel = 'EMAIL' }) {
  const { id } = useParams()
  const d = usePhase5Data()
  if (!id) return <TemplateEditor key="new" channel={channel} />
  const existing = CH[channel].list(d).find((t) => t.id === id)
  if (!existing) return <NotFoundRecord entity="template" backTo={CH[channel].base} backLabel="Back to templates" />
  return <TemplateEditor key={existing.id} channel={channel} existing={existing} />
}

export const EmailTemplateList = () => <MessageTemplateList channel="EMAIL" />
export const EmailTemplateForm = () => <MessageTemplateForm channel="EMAIL" />
export const WhatsappTemplateList = () => <MessageTemplateList channel="WHATSAPP" />
export const WhatsappTemplateForm = () => <MessageTemplateForm channel="WHATSAPP" />
