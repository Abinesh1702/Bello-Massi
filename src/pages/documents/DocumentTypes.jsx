import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Settings2, Save, X, Pencil, Power } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import DataTable from '../../components/common/DataTable'
import RowActions from '../../components/common/RowActions'
import FormSection, { FormActions } from '../../components/common/FormSection'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Toggle from '../../components/common/Toggle'
import Checkbox from '../../components/common/Checkbox'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { usePermission } from '../../hooks/usePermission'
import { useFormState } from '../../hooks/useFormState'
import { createDocumentType, emptyDocumentType, updateDocumentType } from '../../services/documentTypeService'
import { DOCUMENT_ENTITIES, ENTITY_LABEL, OCR_FIELDS } from '../../config/documentConfig'

export default function DocumentTypes() {
  const navigate = useNavigate()
  const d = usePhase5Data()
  const canManage = usePermission('documents.types')
  const toggle = (t) => {
    const res = updateDocumentType(t.id, { ...t, active: !t.active })
    if (res.ok) toast.success(`${t.name} ${t.active ? 'deactivated' : 'activated'}`)
    else toast.error(res.error)
  }
  const used = (t) => d.documents.filter((x) => x.typeId === t.id).length
  return (
    <>
      <PageHeader title="Document types" description="Configure the kinds of documents people can upload, the OCR fields each one captures, and verification / expiry rules — no code changes needed."
        actions={canManage && <Button icon={Plus} to="/documents/types/create">New document type</Button>} />
      <Card>
        <DataTable caption="Document types" rows={d.documentTypes} pageSize={15} onRowClick={canManage ? (t) => navigate(`/documents/types/${t.id}/edit`) : undefined} columns={[
          { key: 'n', header: 'Type', render: (t) => (<div><p className="font-medium text-ink">{t.name}</p><p className="text-xs text-muted tabular">{t.code}{t.builtIn ? ' · built-in' : ''}</p></div>) },
          { key: 'e', header: 'Applies to', hideBelow: 'sm', render: (t) => (t.entity === 'any' ? 'Any record' : ENTITY_LABEL[t.entity]) },
          { key: 'f', header: 'OCR fields', hideBelow: 'lg', render: (t) => <span className="text-xs text-muted">{t.fields.map((f) => OCR_FIELDS[f]?.label || f).join(', ')}</span> },
          { key: 'r', header: 'Rules', hideBelow: 'md', render: (t) => (<div className="flex flex-wrap gap-1">{t.ocrEnabled && <Badge tone="info">OCR</Badge>}{t.verificationRequired && <Badge tone="brand">Verify</Badge>}{t.expiryRequired && <Badge tone="warning">Expiry · {t.warningDays}d warning</Badge>}</div>) },
          { key: 'u', header: 'Documents', align: 'right', hideBelow: 'md', render: (t) => used(t) },
          { key: 's', header: 'Status', render: (t) => <Badge tone={t.active ? 'success' : 'neutral'} dot>{t.active ? 'Active' : 'Inactive'}</Badge> },
          { key: 'a', header: '', align: 'right', render: (t) => canManage && <RowActions label={`Actions for ${t.name}`} items={[{ label: 'Edit', icon: Pencil, to: `/documents/types/${t.id}/edit` }, { label: t.active ? 'Deactivate' : 'Activate', icon: Power, onClick: () => toggle(t) }]} /> },
        ]} />
      </Card>
    </>
  )
}

function TypeFormInner({ existing }) {
  const navigate = useNavigate()
  const f = useFormState(existing ? { ...existing, warningDays: String(existing.warningDays) } : { ...emptyDocumentType(), warningDays: '30' })
  const [saving, setSaving] = useState(false)
  const v = f.values
  const toggleField = (k) => f.setValue('fields', v.fields.includes(k) ? v.fields.filter((x) => x !== k) : [...v.fields, k])
  const submit = (e) => {
    e.preventDefault()
    setSaving(true)
    const res = existing ? updateDocumentType(existing.id, v) : createDocumentType(v)
    setSaving(false)
    if (!res.ok) { f.fail(res.errors || {}); toast.error(res.error); return }
    toast.success(existing ? 'Document type updated' : 'Document type created', { description: res.record.name })
    navigate('/documents/types', { replace: true })
  }
  return (
    <>
      <PageHeader title={existing ? `Edit ${existing.name}` : 'New document type'} description="Users can upload this type as soon as it is active." actions={<Button variant="secondary" icon={X} to="/documents/types">Cancel</Button>} />
      <form onSubmit={submit} noValidate className="space-y-6">
        <FormSection title="Document type" icon={Settings2} columns={3}>
          <Input label="Document type name" required {...f.bind('name')} maxLength={60} />
          <Input label="Document code" required {...f.bind('code')} maxLength={20} hint="e.g. FSSAI_LICENSE" disabled={existing?.builtIn} />
          <Select label="Applicable entity" required {...f.bind('entity')} options={[{ value: 'any', label: 'Any record' }, ...DOCUMENT_ENTITIES.map((x) => ({ value: x.value, label: x.label }))]} />
          <Textarea label="Description" {...f.bind('description')} rows={2} maxLength={200} className="sm:col-span-2 lg:col-span-3" />
        </FormSection>
        <FormSection title="Fields to capture (OCR)" description="Pick the fields extracted by OCR and shown on the review screen." columns={1}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="OCR fields">
            {Object.entries(OCR_FIELDS).map(([k, def]) => <Checkbox key={k} label={def.label} checked={v.fields.includes(k)} onChange={() => toggleField(k)} />)}
          </div>
          {f.errors.fields && <p role="alert" className="text-sm text-danger">{f.errors.fields}</p>}
        </FormSection>
        <FormSection title="Rules" columns={2}>
          <Toggle label="OCR enabled" description="New uploads go to the OCR queue." {...f.bindToggle('ocrEnabled')} />
          <Toggle label="Verification required" description="A reviewer must verify before the document counts." {...f.bindToggle('verificationRequired')} />
          <Toggle label="Expiry required" description="An expiry date must be captured before verification." {...f.bindToggle('expiryRequired')} />
          <Input label="Expiry warning (days)" type="number" min="0" max="365" {...f.bind('warningDays')} />
          <Toggle label="Active" description="Inactive types cannot be chosen for new uploads." {...f.bindToggle('active')} />
        </FormSection>
        <FormActions note="Built-in codes are fixed because VMS compliance rules refer to them.">
          <Button variant="secondary" to="/documents/types">Cancel</Button>
          <Button type="submit" icon={Save} loading={saving}>{existing ? 'Save changes' : 'Create type'}</Button>
        </FormActions>
      </form>
    </>
  )
}

export function DocumentTypeForm() {
  const { id } = useParams()
  const d = usePhase5Data()
  if (!id) return <TypeFormInner key="new" />
  const existing = d.lk.types[id]
  if (!existing) return <NotFoundRecord entity="document type" backTo="/documents/types" backLabel="Back to document types" />
  return <TypeFormInner key={existing.id} existing={existing} />
}
