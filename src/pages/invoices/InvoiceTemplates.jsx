import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, LayoutTemplate, Copy, Star, Power, Pencil, Eye, Save, X, ArrowUp, ArrowDown, Hash, Building2, Palette, ListChecks, ImagePlus, ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import DataTable from '../../components/common/DataTable'
import RowActions from '../../components/common/RowActions'
import EmptyState from '../../components/common/EmptyState'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Toggle from '../../components/common/Toggle'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import InvoiceDocument from '../../components/phase5/InvoiceDocument'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { usePermission } from '../../hooks/usePermission'
import { duplicateTemplate, emptyTemplate, saveTemplate, setDefaultTemplate, setTemplateActive } from '../../services/invoiceTemplateService'
import { peekNextInvoiceNumber, saveInvoiceSettings } from '../../services/invoiceService'
import { buildInvoiceRecord } from '../../utils/invoiceSnapshot'
import { CURRENCIES, FONTS, FOOTER_LAYOUTS, HEADER_LAYOUTS, INVOICE_FIELDS, NUMBER_FORMATS, PAGE_FORMATS } from '../../config/invoiceConfig'
import { formatDate } from '../../utils/formatters'

/** A realistic preview: the template applied to a real delivered order (nothing is saved). */
const useSampleInvoice = (template) => {
  const d = usePhase5Data()
  const [now] = useState(() => new Date().toISOString())
  return useMemo(() => {
    const order = d.orders.find((o) => o.orderStatus === 'DELIVERED' && o.deliveryNoteId) || d.orders.find((o) => o.orderNumber && o.items?.length)
    if (!order || !template) return null
    const note = d.notes.find((n) => n.id === order.deliveryNoteId) || null
    return buildInvoiceRecord({
      id: 'sample', invoiceNumber: peekNextInvoiceNumber(d.invoiceSettings, d.invoices).number, sequence: 0, order, customer: d.lk.customers[order.customerId], products: d.products,
      hub: d.lk.hubs[order.hubId], dispatch: note ? d.lk.dispatches[note.dispatchId] : null, note, template, options: { quantityBasis: 'DELIVERED', shippingCharges: 500 }, user: null, now,
    })
  }, [d, template, now])
}

export function InvoiceTemplates() {
  const navigate = useNavigate()
  const d = usePhase5Data()
  const canEdit = usePermission('invoices.templates')
  const [num, setNum] = useState(() => ({ ...d.invoiceSettings, startingNumber: String(d.invoiceSettings.startingNumber), digits: String(d.invoiceSettings.digits), year: String(d.invoiceSettings.year) }))
  const [numErr, setNumErr] = useState({})
  const run = (res, msg) => (res.ok ? toast.success(msg) : toast.error(res.error))
  const draftSettings = { ...num, startingNumber: Number(num.startingNumber) || 1, digits: Number(num.digits) || 5, year: Number(num.year) || d.invoiceSettings.year, lastNumber: d.invoiceSettings.lastNumber }
  const saveNumbering = (e) => {
    e.preventDefault()
    const res = saveInvoiceSettings(num)
    if (!res.ok) { setNumErr(res.errors || {}); toast.error(res.error); return }
    toast.success('Numbering saved', { description: `Next invoice: ${res.next}` })
  }
  return (
    <>
      <PageHeader title="Invoice templates" description="Layout, branding, fields and numbering for invoices. Editing a template never changes invoices already issued." actions={canEdit && <Button icon={Plus} to="/invoices/templates/create">New template</Button>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <DataTable caption="Templates" rows={d.invoiceTemplates} onRowClick={(t) => navigate(`/invoices/templates/${t.id}/preview`)} empty={<EmptyState icon={LayoutTemplate} title="No templates" />} columns={[
            { key: 'n', header: 'Template', render: (t) => (<div><p className="font-medium text-ink">{t.name}</p><p className="text-xs text-muted tabular">{t.code} · v{t.version || 1}</p></div>) },
            { key: 'p', header: 'Page', hideBelow: 'md', render: (t) => PAGE_FORMATS.find((p) => p.value === t.pageFormat)?.label },
            { key: 'c', header: 'Colours', hideBelow: 'sm', render: (t) => <span className="inline-flex gap-1">{[t.primaryColor, t.accentColor].map((c) => <span key={c} className="h-5 w-5 rounded-full border border-line" style={{ background: c }} title={c} />)}</span> },
            { key: 'u', header: 'Used by', align: 'right', hideBelow: 'md', render: (t) => d.invoices.filter((i) => i.templateId === t.id).length },
            { key: 's', header: 'Status', render: (t) => <div className="flex flex-wrap gap-1">{t.isDefault && <Badge tone="accent">Default</Badge>}<Badge tone={t.active ? 'success' : 'neutral'} dot>{t.active ? 'Active' : 'Inactive'}</Badge></div> },
            { key: 'a', header: '', align: 'right', render: (t) => (
              <RowActions label={`Actions for ${t.name}`} items={[
                { label: 'Preview', icon: Eye, to: `/invoices/templates/${t.id}/preview` },
                { label: 'Edit', icon: Pencil, to: `/invoices/templates/${t.id}/edit`, hidden: !canEdit },
                { label: 'Duplicate', icon: Copy, hidden: !canEdit, onClick: () => run(duplicateTemplate(t.id), `Duplicated ${t.name}`) },
                { label: 'Set as default', icon: Star, hidden: !canEdit || t.isDefault, onClick: () => run(setDefaultTemplate(t.id), `${t.name} is now the default`) },
                { label: t.active ? 'Deactivate' : 'Activate', icon: Power, hidden: !canEdit, onClick: () => run(setTemplateActive(t.id, !t.active), `${t.name} ${t.active ? 'deactivated' : 'activated'}`) },
              ]} />
            ) },
          ]} />
        </Card>
        <Card className="h-fit">
          <CardHeader title="Invoice numbering" subtitle={`Next: ${peekNextInvoiceNumber(draftSettings, d.invoices).number}`} icon={Hash} />
          <form onSubmit={saveNumbering} noValidate className="grid gap-3 sm:grid-cols-2">
            <Input label="Prefix" value={num.prefix} onChange={(e) => { setNum((x) => ({ ...x, prefix: e.target.value })); setNumErr({}) }} error={numErr.prefix} disabled={!canEdit} />
            <Input label="Year" type="number" value={num.year} onChange={(e) => setNum((x) => ({ ...x, year: e.target.value }))} error={numErr.year} disabled={!canEdit || !num.includeYear} />
            <Input label="Starting number" type="number" min="1" value={num.startingNumber} onChange={(e) => setNum((x) => ({ ...x, startingNumber: e.target.value }))} error={numErr.startingNumber} disabled={!canEdit} />
            <Input label="Digits" type="number" min="3" max="8" value={num.digits} onChange={(e) => setNum((x) => ({ ...x, digits: e.target.value }))} error={numErr.digits} disabled={!canEdit} />
            <Toggle className="sm:col-span-2" label="Include year" checked={num.includeYear} onChange={(x) => setNum((s) => ({ ...s, includeYear: x }))} disabled={!canEdit} />
            <p className="sm:col-span-2 text-xs text-muted">Numbers are never reused: if a number already exists, the next free one is taken.</p>
            {canEdit && <Button type="submit" icon={Save} className="sm:col-span-2">Save numbering</Button>}
          </form>
        </Card>
      </div>
    </>
  )
}

function TemplateEditor({ existing }) {
  const navigate = useNavigate()
  const [t, setT] = useState(() => (existing ? JSON.parse(JSON.stringify(existing)) : emptyTemplate()))
  const [errors, setErrors] = useState({})
  const sample = useSampleInvoice(t)
  const set = (k, val) => { setT((x) => ({ ...x, [k]: val })); setErrors((e) => ({ ...e, [k]: undefined })) }
  const setCo = (k, val) => { setT((x) => ({ ...x, company: { ...x.company, [k]: val } })); setErrors({}) }
  const move = (i, dir) => setT((x) => { const f = [...x.fields]; const j = i + dir; if (j < 0 || j >= f.length) return x; [f[i], f[j]] = [f[j], f[i]]; return { ...x, fields: f } })
  const toggleField = (key) => setT((x) => ({ ...x, fields: x.fields.map((f) => (f.key === key ? { ...f, visible: !f.visible } : f)) }))
  const onLogo = (file) => {
    if (!file) return
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) { toast.error('Use a PNG, JPG, WebP or SVG logo.'); return }
    if (file.size > 200 * 1024) { toast.error('Logo must be under 200 KB.'); return }
    const r = new FileReader()
    r.onload = () => setCo('logo', r.result)
    r.readAsDataURL(file)
  }
  const save = () => {
    const res = saveTemplate(t, { id: existing?.id })
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success(existing ? `Template saved as version ${res.record.version}` : 'Template created', { description: existing ? 'Issued invoices keep the version they were issued with.' : undefined })
    navigate('/invoices/templates', { replace: true })
  }
  const label = Object.fromEntries(INVOICE_FIELDS.map((f) => [f.key, f]))
  return (
    <>
      <PageHeader title={existing ? `Edit ${existing.name}` : 'New invoice template'} description="Changes appear in the live preview on the right." actions={<div className="flex gap-2"><Button variant="secondary" icon={X} to="/invoices/templates">Cancel</Button><Button icon={Save} onClick={save}>Save template</Button></div>} />
      <div className="grid gap-6 2xl:grid-cols-2">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader title="Template" icon={LayoutTemplate} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Template name" required value={t.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={60} />
              <Input label="Template code" required value={t.code} onChange={(e) => set('code', e.target.value)} error={errors.code} maxLength={12} />
              <Input label="Invoice title" required value={t.invoiceTitle} onChange={(e) => set('invoiceTitle', e.target.value)} error={errors.invoiceTitle} maxLength={40} />
              <Toggle label="Active" checked={t.active} onChange={(x) => set('active', x)} disabled={existing?.isDefault} description={existing?.isDefault ? 'Default template stays active' : undefined} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Company" icon={Building2} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Company name" required value={t.company.name} onChange={(e) => setCo('name', e.target.value)} error={errors.companyName} />
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Company logo</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={t.company.logo === 'builtin' ? 'primary' : 'secondary'} onClick={() => setCo('logo', 'builtin')}>Bellomassi logo</Button>
                  <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 text-sm hover:bg-surface-2"><ImagePlus size={14} /> Upload<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} /></label>
                  {t.company.logo && <Button size="sm" variant="ghost" onClick={() => setCo('logo', '')}>None</Button>}
                </div>
                {errors.logo && <p className="mt-1 text-xs text-danger">{errors.logo}</p>}
              </div>
              <Textarea label="Company address" required value={t.company.address} onChange={(e) => setCo('address', e.target.value)} error={errors.companyAddress} rows={2} className="sm:col-span-2" />
              <Input label="GST number" value={t.company.gstNumber} onChange={(e) => setCo('gstNumber', e.target.value.toUpperCase())} error={errors.companyGst} />
              <Input label="PAN number" value={t.company.panNumber} onChange={(e) => setCo('panNumber', e.target.value.toUpperCase())} error={errors.companyPan} />
              <Input label="Phone" value={t.company.phone} onChange={(e) => setCo('phone', e.target.value)} />
              <Input label="Email" value={t.company.email} onChange={(e) => setCo('email', e.target.value)} error={errors.companyEmail} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Layout & style" icon={Palette} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Select label="Page size" value={t.pageFormat} onChange={(e) => set('pageFormat', e.target.value)} options={PAGE_FORMATS} error={errors.pageFormat} />
              {t.pageFormat === 'CUSTOM' && <Input label="Width (mm)" type="number" value={t.customWidth} onChange={(e) => set('customWidth', e.target.value)} error={errors.customWidth} />}
              {t.pageFormat === 'CUSTOM' && <Input label="Height (mm)" type="number" value={t.customHeight} onChange={(e) => set('customHeight', e.target.value)} error={errors.customHeight} />}
              <Select label="Header layout" value={t.headerLayout} onChange={(e) => set('headerLayout', e.target.value)} options={HEADER_LAYOUTS} />
              <Select label="Footer layout" value={t.footerLayout} onChange={(e) => set('footerLayout', e.target.value)} options={FOOTER_LAYOUTS} />
              <Select label="Font" value={t.font} onChange={(e) => set('font', e.target.value)} options={FONTS} />
              <Input label="Font size (pt)" type="number" min="8" max="14" value={t.fontSize} onChange={(e) => set('fontSize', e.target.value)} error={errors.fontSize} />
              <Input label="Primary colour" value={t.primaryColor} onChange={(e) => set('primaryColor', e.target.value)} error={errors.primaryColor} rightElement={<input type="color" aria-label="Pick primary colour" value={/^#[0-9a-f]{6}$/i.test(t.primaryColor) ? t.primaryColor : '#232b5f'} onChange={(e) => set('primaryColor', e.target.value)} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent" />} />
              <Input label="Accent colour" value={t.accentColor} onChange={(e) => set('accentColor', e.target.value)} error={errors.accentColor} rightElement={<input type="color" aria-label="Pick accent colour" value={/^#[0-9a-f]{6}$/i.test(t.accentColor) ? t.accentColor : '#f5a623'} onChange={(e) => set('accentColor', e.target.value)} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent" />} />
              <Select label="Currency" value={t.currency} onChange={(e) => set('currency', e.target.value)} options={CURRENCIES} />
              <Select label="Number format" value={t.numberFormat} onChange={(e) => set('numberFormat', e.target.value)} options={NUMBER_FORMATS} />
              <Textarea label="Header text" value={t.headerText} onChange={(e) => set('headerText', e.target.value)} rows={2} className="sm:col-span-3" maxLength={200} />
              <Textarea label="Footer text" value={t.footerText} onChange={(e) => set('footerText', e.target.value)} rows={2} className="sm:col-span-3" maxLength={300} />
              <Textarea label="Terms & conditions" value={t.terms} onChange={(e) => set('terms', e.target.value)} rows={3} className="sm:col-span-3" maxLength={1000} />
              <Textarea label="Payment instructions" value={t.paymentInstructions} onChange={(e) => set('paymentInstructions', e.target.value)} rows={2} className="sm:col-span-2" maxLength={300} />
              <Input label="Signature label" value={t.signatureLabel} onChange={(e) => set('signatureLabel', e.target.value)} maxLength={60} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Fields" subtitle="Show / hide and order. Order applies to item columns and reference rows." icon={ListChecks} />
            {errors.fields && <p className="mb-2 text-sm text-danger" role="alert">{errors.fields}</p>}
            <ul className="divide-y divide-line" aria-label="Invoice fields">
              {t.fields.map((f, i) => (
                <li key={f.key} className="flex items-center justify-between gap-2 py-1.5">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.visible} disabled={label[f.key]?.locked} onChange={() => toggleField(f.key)} className="h-4 w-4 accent-[var(--brand)]" aria-label={`Show ${label[f.key]?.label}`} />{label[f.key]?.label}<span className="text-xs text-muted">{label[f.key]?.section}</span></label>
                  <span className="flex gap-1"><Button size="icon-sm" variant="ghost" icon={ArrowUp} aria-label={`Move ${label[f.key]?.label} up`} onClick={() => move(i, -1)} disabled={i === 0} /><Button size="icon-sm" variant="ghost" icon={ArrowDown} aria-label={`Move ${label[f.key]?.label} down`} onClick={() => move(i, 1)} disabled={i === t.fields.length - 1} /></span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="min-w-0 2xl:sticky 2xl:top-20 h-fit">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted"><Eye size={13} /> Live preview with a real delivered order</p>
          {sample ? <InvoiceDocument invoice={sample} preview /> : <Card><EmptyState title="No orders available for a preview" /></Card>}
        </div>
      </div>
    </>
  )
}

export function InvoiceTemplateForm() {
  const { id } = useParams()
  const d = usePhase5Data()
  if (!id) return <TemplateEditor key="new" />
  const existing = d.lk.templates[id]
  if (!existing) return <NotFoundRecord entity="template" backTo="/invoices/templates" backLabel="Back to templates" />
  return <TemplateEditor key={existing.id} existing={existing} />
}

export function InvoiceTemplatePreview() {
  const { id } = useParams()
  const d = usePhase5Data()
  const canEdit = usePermission('invoices.templates')
  const tpl = d.lk.templates[id]
  const sample = useSampleInvoice(tpl)
  if (!tpl) return <NotFoundRecord entity="template" backTo="/invoices/templates" backLabel="Back to templates" />
  return (
    <>
      <PageHeader title={`Preview · ${tpl.name}`} description={`${tpl.code} · version ${tpl.version || 1} · updated ${formatDate(tpl.updatedAt)}`} actions={<div className="flex gap-2"><Button variant="secondary" icon={ArrowLeft} to="/invoices/templates">Templates</Button>{canEdit && <Button icon={Pencil} to={`/invoices/templates/${tpl.id}/edit`}>Edit</Button>}</div>} />
      {sample ? <InvoiceDocument invoice={sample} preview /> : <Card><EmptyState title="No orders available for a preview" /></Card>}
    </>
  )
}
