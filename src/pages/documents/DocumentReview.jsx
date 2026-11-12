import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ScanText, Save, BadgeCheck, XCircle, RefreshCw, CheckCheck, FileText, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Modal from '../../components/common/Modal'
import InfoList from '../../components/common/InfoList'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { DocumentPreview } from '../../components/phase5/Documents'
import { DocumentStatusBadge, OcrProviderBadge, SimulatedOcrBadge } from '../../components/phase5/Badges'
import { formatBytes, userName } from '../../components/phase5/format'
import { OrderAccessDenied } from '../orders/OrderDetail'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { useAuth } from '../../hooks/useAuth'
import { canReview, canViewDocument, effectiveStatus, getDocumentById, rejectDocument, saveReview, validateFields, verifyDocument } from '../../services/documentService'
import { getOCRHistory, getProviders, processDocument } from '../../services/ocrService'
import { ENTITY_LABEL, OCR_FIELDS } from '../../config/documentConfig'
import { formatDateTime } from '../../utils/formatters'
import { can } from '../../config/permissions'

function ReviewInner({ doc, d, user }) {
  const navigate = useNavigate()
  const type = d.lk.types[doc.typeId]
  const fieldKeys = type?.fields || []
  const initial = () => Object.fromEntries(fieldKeys.map((k) => [k, String(doc.ocrFields?.[k] ?? (k === 'documentNumber' ? doc.documentNumber : k === 'issueDate' ? doc.issueDate : k === 'expiryDate' ? doc.expiryDate : '') ?? '')]))
  const [values, setValues] = useState(initial)
  const [remarks, setRemarks] = useState('')
  const [provider, setProvider] = useState('MOCK')
  const [busy, setBusy] = useState('')
  const [errors, setErrors] = useState({})
  const [rejecting, setRejecting] = useState(false)
  const [rejectRemarks, setRejectRemarks] = useState('')
  const [lastDocVersion, setLastDocVersion] = useState(doc.ocrProcessedAt)
  // When an OCR run lands, load its values into the form
  if (doc.ocrProcessedAt !== lastDocVersion) { setLastDocVersion(doc.ocrProcessedAt); setValues(initial()) }
  const allowed = canReview(user, doc)
  const locked = doc.status === 'VERIFIED'
  const live = validateFields(type, values)
  const runs = getOCRHistory(doc.id, d.ocrResults)
  const providers = getProviders()
  const payload = () => ({ fields: values, documentNumber: values.documentNumber ?? values.licenseNumber ?? values.gstNumber ?? values.panNumber ?? values.invoiceNumber, issueDate: values.issueDate, expiryDate: values.expiryDate })

  const runOcr = async () => {
    setBusy('ocr')
    const res = await processDocument(doc.id, { provider })
    setBusy('')
    if (!res.ok) { toast.error(res.error); return }
    toast.success(res.result.simulated ? 'Simulated OCR complete' : 'OCR complete', { description: res.result.simulated ? 'Fields pre-filled from the linked record — check them against the document.' : `${Object.values(res.result.fields).filter(Boolean).length} fields extracted.` })
  }
  const save = (accept = false) => {
    const res = saveReview(doc.id, { ...payload(), remarks: undefined })
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return false }
    toast.success(accept ? 'OCR values accepted' : 'Review saved')
    return true
  }
  const verify = () => {
    const res = verifyDocument(doc.id, { ...payload(), remarks })
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success('Document verified', { description: type?.vehicleField || type?.driverField ? 'The expiry date on the record was updated.' : undefined })
    navigate(`/documents/${doc.id}`, { replace: true })
  }
  const reject = () => {
    const res = rejectDocument(doc.id, { remarks: rejectRemarks })
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    setRejecting(false)
    toast.success('Document rejected', { description: 'The uploader has been notified.' })
    navigate(`/documents/${doc.id}`, { replace: true })
  }

  return (
    <>
      <PageHeader title={`OCR review · ${type?.name || doc.typeCode}`} description={`${doc.entityLabel} · ${ENTITY_LABEL[doc.entityType]}`} actions={<Button variant="secondary" icon={ArrowLeft} to={`/documents/${doc.id}`}>Document</Button>} />
      {!allowed && <p className="mb-4 rounded-lg bg-warning/10 px-3 py-2 text-sm text-ink">You can view this review but not verify it. {['vehicle', 'driver'].includes(doc.entityType) ? 'Vehicle and driver documents are verified by the Admin.' : 'Verification is done by Admin or Customer Service.'}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6 min-w-0">
          <Card><CardHeader title="Document" icon={FileText} action={<DocumentStatusBadge status={effectiveStatus(doc)} />} /><DocumentPreview doc={doc} height={520} /></Card>
          <Card>
            <CardHeader title="File & upload" />
            <InfoList columns={1} items={[
              { label: 'File', value: doc.fileId ? `${doc.fileName} · ${formatBytes(doc.fileSize)}` : 'Demo record — no file' },
              { label: 'Uploaded', value: `${formatDateTime(doc.uploadedAt)} by ${userName(d.users, doc.uploadedBy)}` },
              { label: 'Remarks', value: doc.remarks, hidden: !doc.remarks },
              { label: 'Previous rejection', value: doc.reviewRemarks, hidden: doc.status !== 'REJECTED' },
            ]} />
          </Card>
        </div>
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader title="Extracted fields" subtitle={doc.ocrProvider ? `Last OCR ${formatDateTime(doc.ocrProcessedAt)}` : 'OCR has not run — run it or type the values.'} icon={ScanText} action={<OcrProviderBadge provider={doc.ocrProvider} />} />
            {doc.ocrProvider === 'MOCK' && <p className="mb-3 flex gap-2 rounded-lg border border-dashed border-accent/60 bg-accent/10 px-3 py-2 text-xs text-ink"><AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />Simulated OCR did not read the image — values come from the linked record. Check each one against the document before verifying.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {fieldKeys.map((k) => {
                const def = OCR_FIELDS[k] || { label: k }
                const orig = doc.ocrOriginal && k in doc.ocrOriginal ? String(doc.ocrOriginal[k] ?? '') : null
                const changed = orig !== null && orig !== values[k]
                return (
                  <Input key={k} label={def.label} type={def.type === 'date' ? 'date' : def.type === 'number' ? 'number' : 'text'} value={values[k] ?? ''} disabled={locked || !allowed}
                    onChange={(e) => { setValues((x) => ({ ...x, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })) }}
                    error={errors[k] || live[k]} hint={changed ? `Original OCR value: ${orig || '(blank)'}` : def.hint} />
                )
              })}
            </div>
            {!locked && allowed && (
              <>
                <Textarea className="mt-4" label="Review remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} maxLength={300} placeholder="Optional note stored with the verification" />
                <div className="mt-4 flex flex-wrap items-end gap-2">
                  <Select label="OCR provider" value={provider} onChange={(e) => setProvider(e.target.value)} options={providers.map((p) => ({ value: p.id, label: `${p.label}${p.available ? '' : ' — unavailable'}` }))} className="min-w-[220px]" />
                  <Button variant="secondary" icon={doc.ocrProvider ? RefreshCw : ScanText} onClick={runOcr} loading={busy === 'ocr'} disabled={!type?.ocrEnabled}>{doc.ocrProvider ? 'Reprocess' : 'Run OCR'}</Button>
                </div>
                {provider === 'MOCK' && <div className="mt-2"><SimulatedOcrBadge /></div>}
                {!providers.find((p) => p.id === provider)?.available && <p className="mt-1 text-xs text-danger">{providers.find((p) => p.id === provider)?.unavailableReason}</p>}
                <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                  {can(user, 'documents.reject') && <Button variant="danger-outline" icon={XCircle} onClick={() => setRejecting(true)}>Reject</Button>}
                  {doc.ocrProvider && <Button variant="secondary" icon={CheckCheck} onClick={() => save(true)}>Accept OCR</Button>}
                  <Button variant="secondary" icon={Save} onClick={() => save(false)}>Save</Button>
                  <Button icon={BadgeCheck} onClick={verify}>Verify</Button>
                </div>
              </>
            )}
            {locked && <p className="mt-4 text-sm text-muted">Verified documents are locked. Replace the file to start a new review.</p>}
          </Card>
          {runs.length > 0 && (
            <Card>
              <CardHeader title="OCR history" />
              <ul className="divide-y divide-line text-sm">
                {runs.map((r) => (
                  <li key={r.id} className="py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-ink">{formatDateTime(r.processedAt)} · {userName(d.users, r.processedBy)}</span><OcrProviderBadge provider={r.provider} /></div>
                    <p className="text-xs text-muted">{Object.values(r.fields).filter(Boolean).length}/{Object.keys(r.fields).length} fields{r.confidence !== null ? ` · ${(r.confidence * 100).toFixed(0)}% ${r.simulated ? 'filled' : 'confidence'}` : ''} · {r.durationMs} ms</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
      <Modal open={rejecting} onClose={() => setRejecting(false)} size="sm" icon={XCircle} title="Reject document" description="The uploader sees this reason and can upload a replacement."
        footer={<><Button variant="secondary" onClick={() => setRejecting(false)}>Cancel</Button><Button variant="danger" onClick={reject}>Reject document</Button></>}>
        <Textarea label="Reason" required value={rejectRemarks} onChange={(e) => { setRejectRemarks(e.target.value); setErrors((x) => ({ ...x, remarks: undefined })) }} error={errors.remarks} rows={3} maxLength={300} />
      </Modal>
    </>
  )
}

export default function DocumentReview() {
  const { id } = useParams()
  const d = usePhase5Data()
  const { user } = useAuth()
  const doc = getDocumentById(id, d.documents)
  if (!doc) return <NotFoundRecord entity="document" backTo="/documents/ocr-queue" backLabel="Back to the OCR queue" />
  if (!canViewDocument(user, doc, { customers: d.customers, orders: d.orders, drivers: d.drivers })) return <OrderAccessDenied />
  return <ReviewInner key={doc.id} doc={doc} d={d} user={user} />
}
