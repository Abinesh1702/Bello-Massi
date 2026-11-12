import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileText, ImageIcon, UploadCloud, FileWarning, Download, Info, X } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Input from '../common/Input'
import Select from '../common/Select'
import Textarea from '../common/Textarea'
import { FieldShell } from '../common/Input'
import { getFileUrl, validateFile, STORAGE_LABEL } from '../../services/documentStorageService'
import { uploadDocument } from '../../services/documentService'
import { FILE_LIMITS } from '../../config/documentConfig'
import { formatBytes } from './format'
import { cn } from '../../utils/helpers'

/** File chooser with drag & drop and client-side validation. */
export function FilePicker({ file, onChange, error, label = 'File', required = true }) {
  const id = useId()
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const pick = (f) => {
    if (!f) return
    const problem = validateFile(f)
    if (problem) { toast.error(problem); return }
    onChange(f)
  }
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={`PDF, JPG, PNG or WebP · up to ${FILE_LIMITS.maxBytes / 1048576} MB`}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]) }}
        className={cn('flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center', drag ? 'border-brand bg-brand/5' : error ? 'border-danger/60' : 'border-line')}
      >
        {file ? (
          <div className="flex items-center gap-2 text-sm">
            <FileText size={18} className="text-brand" aria-hidden />
            <span className="font-medium text-ink break-all">{file.name}</span>
            <span className="text-muted">{formatBytes(file.size)}</span>
            <button type="button" onClick={() => onChange(null)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface-2" aria-label="Remove file"><X size={14} /></button>
          </div>
        ) : (
          <>
            <UploadCloud size={26} className="text-muted" aria-hidden />
            <p className="text-sm text-muted">Drag a file here or</p>
          </>
        )}
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>{file ? 'Choose another file' : 'Browse files'}</Button>
        <input ref={inputRef} id={id} type="file" accept={FILE_LIMITS.acceptAttr} className="sr-only" aria-label={label} data-testid="file-input" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
      </div>
    </FieldShell>
  )
}

/** Preview a stored document file (image / PDF). Seeded demo records and files from another browser show why there is no preview. */
export function DocumentPreview({ doc, className, height = 420 }) {
  const [state, setState] = useState({ url: null, loading: Boolean(doc?.fileId), missing: false })
  useEffect(() => {
    let url = null
    let alive = true
    if (!doc?.fileId) return undefined
    getFileUrl(doc.fileId).then((u) => {
      url = u
      if (alive) setState({ url: u, loading: false, missing: !u })
    })
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [doc?.fileId])
  const box = cn('grid place-items-center rounded-xl border border-line bg-surface-2 text-center p-6', className)
  if (!doc?.fileId) return <div className={box} style={{ minHeight: 220 }}><div><FileText size={30} className="mx-auto text-muted" aria-hidden /><p className="mt-2 text-sm font-medium text-ink">Demo record — no file attached</p><p className="mt-1 text-xs text-muted max-w-xs">Seeded documents carry metadata only. Use “Replace file” to attach a scan.</p></div></div>
  if (state.loading) return <div className={box} style={{ minHeight: 220 }}><p className="text-sm text-muted">Loading preview…</p></div>
  if (state.missing) return <div className={box} style={{ minHeight: 220 }}><div><FileWarning size={30} className="mx-auto text-warning" aria-hidden /><p className="mt-2 text-sm font-medium text-ink">File not in this browser</p><p className="mt-1 text-xs text-muted max-w-xs">It was uploaded on another device or the browser’s site data was cleared. Temporary browser files are not shared or backed up.</p></div></div>
  const isImg = doc.fileType?.startsWith('image/')
  return (
    <div className={cn('space-y-2', className)}>
      {isImg
        ? <img src={state.url} alt={doc.name} className="mx-auto max-h-[480px] w-auto rounded-xl border border-line object-contain bg-surface-2" />
        : <object data={state.url} type="application/pdf" className="w-full rounded-xl border border-line" style={{ height }} aria-label={doc.name}><p className="p-4 text-sm text-muted">PDF preview is not supported in this browser — use Download.</p></object>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">{isImg ? <ImageIcon size={13} /> : <FileText size={13} />}{doc.fileName} · {formatBytes(doc.fileSize)} · {STORAGE_LABEL[doc.storage] || doc.storage}</span>
        <a href={state.url} download={doc.fileName} className="inline-flex items-center gap-1 font-medium text-brand hover:underline"><Download size={13} /> Download</a>
      </div>
    </div>
  )
}

/**
 * Upload dialog for a fixed entity (vehicle, driver, customer…) or with entity selection handled by the caller.
 * types: document types to offer. entity: { type, id, label }.
 */
export function UploadDocumentDialog({ open, onClose, types, entity, onDone, title = 'Upload document' }) {
  const [v, setV] = useState({ typeId: '', documentNumber: '', issueDate: '', expiryDate: '', remarks: '' })
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const type = types.find((t) => t.id === v.typeId)
  const set = (k) => (e) => { setV((x) => ({ ...x, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })) }
  const close = () => { if (!busy) { setV({ typeId: '', documentNumber: '', issueDate: '', expiryDate: '', remarks: '' }); setFile(null); setErrors({}); onClose() } }
  const submit = async () => {
    setBusy(true)
    const res = await uploadDocument({ ...v, entityType: entity.type, entityId: entity.id, entityLabel: entity.label, file })
    setBusy(false)
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success('Document uploaded', { description: `${res.record.name} · ${res.record.status === 'PENDING_OCR' ? 'ready for OCR' : 'awaiting review'}` })
    onDone?.(res.record)
    close()
  }
  return (
    <Modal open={open} onClose={close} size="lg" icon={UploadCloud} title={title} description={entity?.label}
      footer={<><Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button><Button icon={UploadCloud} onClick={submit} loading={busy}>Upload</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Document type" required placeholder="Select type" value={v.typeId} onChange={set('typeId')} options={types.map((t) => ({ value: t.id, label: t.name }))} error={errors.typeId} className="sm:col-span-2" />
        <Input label="Document number" value={v.documentNumber} onChange={set('documentNumber')} maxLength={40} hint={type?.ocrEnabled ? 'Optional — OCR can fill it' : undefined} />
        <Input label="Issue date" type="date" value={v.issueDate} onChange={set('issueDate')} error={errors.issueDate} />
        <Input label="Expiry date" type="date" value={v.expiryDate} onChange={set('expiryDate')} error={errors.expiryDate} hint={type?.expiryRequired ? 'Required before verification' : undefined} />
        <Textarea label="Remarks" value={v.remarks} onChange={set('remarks')} rows={2} maxLength={300} className="sm:col-span-2" />
        <div className="sm:col-span-2"><FilePicker file={file} onChange={(f) => { setFile(f); setErrors((x) => ({ ...x, file: undefined })) }} error={errors.file} /></div>
        {errors.entityId && <p role="alert" className="sm:col-span-2 text-sm text-danger">{errors.entityId}</p>}
        {errors.form && <p role="alert" className="sm:col-span-2 text-sm text-danger">{errors.form}</p>}
        <p className="sm:col-span-2 flex gap-1.5 text-xs text-muted"><Info size={13} className="mt-0.5 shrink-0" aria-hidden />Prototype storage: the file is kept in this browser only (temporary) and is not included in JSON backups. Production would store it on the backend (S3 / R2).</p>
      </div>
    </Modal>
  )
}

