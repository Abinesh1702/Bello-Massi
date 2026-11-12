import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { UploadCloud, X, FileText, Info, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import FormSection, { FormActions } from '../../components/common/FormSection'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import { FilePicker } from '../../components/phase5/Documents'
import EntityPicker from '../../components/phase5/EntityPicker'
import { formatBytes } from '../../components/phase5/format'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { useAuth } from '../../hooks/useAuth'
import { canUploadFor, uploadDocument } from '../../services/documentService'
import { DOCUMENT_ENTITIES } from '../../config/documentConfig'

/**
 * Upload one or several files. Each file becomes its own document of the chosen type for the chosen record,
 * then enters the OCR / review workflow.
 */
export default function DocumentUpload() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const d = usePhase5Data()
  const [v, setV] = useState({ entityType: params.get('entityType') || '', entityId: params.get('entityId') || '', entityLabel: '', typeId: '', name: '', documentNumber: '', issueDate: '', expiryDate: '', remarks: '' })
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k, val) => { setV((x) => ({ ...x, [k]: val })); setErrors((x) => ({ ...x, [k]: undefined, form: undefined })) }
  const entities = DOCUMENT_ENTITIES.filter((e) => canUploadFor(user, e.value))
  const types = d.documentTypes.filter((t) => t.active && (!v.entityType || t.entity === v.entityType || t.entity === 'any'))
  const multiple = files.length > 1

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (!files.length) { setErrors({ file: 'Choose at least one file.' }); toast.error('Choose at least one file.'); return }
    setBusy(true)
    const done = []
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const res = await uploadDocument({ ...v, name: multiple ? '' : v.name, documentNumber: multiple ? '' : v.documentNumber, file })
      if (!res.ok) { setBusy(false); setErrors(res.errors || {}); toast.error(done.length ? `${done.length} uploaded, then: ${res.error}` : res.error); return }
      done.push(res.record)
    }
    setBusy(false)
    toast.success(done.length === 1 ? 'Document uploaded' : `${done.length} documents uploaded`, { description: done[0].status === 'PENDING_OCR' ? 'Waiting in the OCR queue.' : 'Waiting for review.' })
    navigate(done.length === 1 ? `/documents/${done[0].id}/review` : '/documents/ocr-queue', { replace: true })
  }

  return (
    <>
      <PageHeader title="Upload documents" description="Attach proofs to an existing record. OCR-enabled types go to the OCR queue; you can upload several files at once." actions={<Button variant="secondary" icon={X} to="/documents">Cancel</Button>} />
      <form onSubmit={submit} noValidate className="space-y-6">
        <FormSection title="What is it for?" icon={FileText} columns={3}>
          <Select label="Entity type" required placeholder="Select entity" value={v.entityType} onChange={(e) => { set('entityType', e.target.value); set('entityId', ''); set('typeId', '') }} options={entities.map((x) => ({ value: x.value, label: x.label }))} error={errors.entityType} />
          <EntityPicker entityType={v.entityType} value={v.entityId} onChange={(x) => set('entityId', x)} label={v.entityLabel} onLabelChange={(x) => set('entityLabel', x)} error={errors.entityId || errors.entityLabel} />
          <Select label="Document type" required placeholder={v.entityType ? 'Select type' : 'Choose an entity type first'} value={v.typeId} onChange={(e) => set('typeId', e.target.value)} options={types.map((t) => ({ value: t.id, label: `${t.name}${t.ocrEnabled ? '' : ' (no OCR)'}` }))} error={errors.typeId} disabled={!v.entityType} />
        </FormSection>
        <FormSection title="Details" description={multiple ? 'Name and document number are taken from OCR / review for each file when uploading several.' : 'Optional — OCR can fill these.'} icon={Info} columns={3}>
          <Input label="Document name" value={v.name} onChange={(e) => set('name', e.target.value)} disabled={multiple} placeholder="Generated if blank" maxLength={120} />
          <Input label="Document number" value={v.documentNumber} onChange={(e) => set('documentNumber', e.target.value)} disabled={multiple} maxLength={40} />
          <div />
          <Input label="Issue date" type="date" value={v.issueDate} onChange={(e) => set('issueDate', e.target.value)} error={errors.issueDate} />
          <Input label="Expiry date" type="date" value={v.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} error={errors.expiryDate} />
          <div />
          <Textarea label="Remarks" value={v.remarks} onChange={(e) => set('remarks', e.target.value)} rows={2} maxLength={300} className="sm:col-span-2 lg:col-span-3" />
        </FormSection>
        <FormSection title="Files" icon={UploadCloud} columns={1}>
          <FilePicker file={null} onChange={(f) => { if (f) { if (files.some((x) => x.name === f.name && x.size === f.size)) { toast.info(`${f.name} is already in the list.`); return } setFiles((x) => [...x, f].slice(0, 10)); setErrors((x) => ({ ...x, file: undefined })) } }} error={errors.file} label="Add file" required={!files.length} />
          {files.length > 0 && (
            <ul className="divide-y divide-line rounded-xl border border-line" aria-label="Files to upload">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2"><FileText size={15} className="text-brand shrink-0" aria-hidden /><span className="truncate">{f.name}</span><span className="text-xs text-muted shrink-0">{formatBytes(f.size)}</span></span>
                  <Button variant="ghost" size="icon-sm" icon={Trash2} aria-label={`Remove ${f.name}`} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} />
                </li>
              ))}
            </ul>
          )}
          <p className="flex gap-1.5 text-xs text-muted"><Info size={13} className="mt-0.5 shrink-0" aria-hidden />Up to 10 files per upload. Files are kept in this browser only (temporary prototype storage) — production stores them on the backend.</p>
        </FormSection>
        {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
        <FormActions note="Fields marked * are required.">
          <Button variant="secondary" to="/documents">Cancel</Button>
          <Button type="submit" icon={UploadCloud} loading={busy}>{files.length > 1 ? `Upload ${files.length} files` : 'Upload'}</Button>
        </FormActions>
      </form>
    </>
  )
}
