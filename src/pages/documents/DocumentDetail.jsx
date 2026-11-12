import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ScanText, RefreshCw, ExternalLink, History, FileText, ListChecks } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import InfoList from '../../components/common/InfoList'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { DocumentPreview } from '../../components/phase5/Documents'
import { DocumentStatusBadge, ExpiryBadge, OcrProviderBadge } from '../../components/phase5/Badges'
import { formatBytes, userName } from '../../components/phase5/format'
import { OrderAccessDenied } from '../orders/OrderDetail'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { useAuth } from '../../hooks/useAuth'
import { canReview, canUploadFor, canViewDocument, effectiveStatus, entityPath, getDocumentById, replaceDocumentFile } from '../../services/documentService'
import { getOCRHistory } from '../../services/ocrService'
import { validateFile, STORAGE_LABEL } from '../../services/documentStorageService'
import { ENTITY_LABEL, OCR_FIELDS, QUEUE_STATUSES, FILE_LIMITS } from '../../config/documentConfig'
import { formatDate, formatDateTime } from '../../utils/formatters'
import { scopeOf } from '../../services/rbacService'

const ACTION_LABEL = { UPLOADED: 'Uploaded', OCR_PROCESSED: 'OCR processed', FIELDS_EDITED: 'Fields reviewed', VERIFIED: 'Verified', REJECTED: 'Rejected', FILE_REPLACED: 'File replaced' }

export default function DocumentDetail({ backTo = '/documents' }) {
  const { id } = useParams()
  const d = usePhase5Data()
  const { user } = useAuth()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const doc = getDocumentById(id, d.documents)
  if (!doc) return <NotFoundRecord entity="document" backTo={backTo} backLabel="Back to documents" />
  if (!canViewDocument(user, doc, { customers: d.customers, orders: d.orders, drivers: d.drivers })) return <OrderAccessDenied />
  const type = d.lk.types[doc.typeId]
  const runs = getOCRHistory(doc.id, d.ocrResults)
  const status = effectiveStatus(doc)
  const related = doc.entityId ? entityPath(doc.entityType, doc.entityId) : null
  const replace = async (file) => {
    const problem = validateFile(file)
    if (problem) { toast.error(problem); return }
    setBusy(true)
    const res = await replaceDocumentFile(doc.id, file)
    setBusy(false)
    if (!res.ok) toast.error(res.error)
    else toast.success('File replaced', { description: 'The document is back in the OCR / review queue.' })
  }
  return (
    <>
      <PageHeader title={type?.name || doc.typeCode} description={`${doc.entityLabel} · ${ENTITY_LABEL[doc.entityType]} · ${doc.documentNumberRef}`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={ArrowLeft} to={backTo}>Back</Button>
            {related && scopeOf(user) !== 'DRIVER' && <Button variant="ghost" icon={ExternalLink} to={related}>Related record</Button>}
            {canUploadFor(user, doc.entityType) && <Button variant="secondary" icon={RefreshCw} onClick={() => fileRef.current?.click()} loading={busy}>Replace file</Button>}
            {canReview(user, doc) && (QUEUE_STATUSES.includes(doc.status) || doc.status === 'REJECTED') && <Button icon={ScanText} to={`/documents/${doc.id}/review`}>OCR review</Button>}
          </div>
        )} />
      <input ref={fileRef} type="file" accept={FILE_LIMITS.acceptAttr} className="sr-only" aria-label="Replacement file" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) replace(f) }} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6 min-w-0">
          <Card><CardHeader title="Preview" icon={FileText} action={<DocumentStatusBadge status={status} />} /><DocumentPreview doc={doc} /></Card>
          <Card>
            <CardHeader title="Document history" icon={History} />
            <ol className="relative space-y-4 border-l border-line pl-5">
              {[...doc.history].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`}>
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden />
                  <p className="text-sm font-medium text-ink">{ACTION_LABEL[h.action] || h.action}</p>
                  <p className="text-xs text-muted">{formatDateTime(h.at)} · {h.byName || userName(d.users, h.by)}</p>
                  {h.note && <p className="mt-0.5 text-sm text-ink">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <Card>
            <CardHeader title="Details" icon={ListChecks} />
            <InfoList columns={1} items={[
              { label: 'Document name', value: doc.name },
              { label: 'Document number', value: doc.documentNumber || '—' },
              { label: 'Related to', value: `${doc.entityLabel} (${ENTITY_LABEL[doc.entityType]})` },
              { label: 'Issue date', value: doc.issueDate ? formatDate(doc.issueDate) : '—' },
              { label: 'Expiry', value: doc.expiryDate ? <span className="inline-flex flex-wrap items-center gap-2">{formatDate(doc.expiryDate)} <ExpiryBadge date={doc.expiryDate} /></span> : type?.expiryRequired ? 'Required — not captured yet' : 'Does not expire' },
              { label: 'File', value: doc.fileId ? `${doc.fileName} · ${formatBytes(doc.fileSize)} · ${STORAGE_LABEL[doc.storage]}` : 'Demo record — no file' },
              { label: 'Uploaded', value: `${formatDateTime(doc.uploadedAt)} by ${userName(d.users, doc.uploadedBy)}` },
              { label: 'Verified', value: doc.verifiedAt ? `${formatDateTime(doc.verifiedAt)} by ${userName(d.users, doc.verifiedBy)}` : '', hidden: !doc.verifiedAt },
              { label: 'Rejected', value: doc.rejectedAt ? `${formatDateTime(doc.rejectedAt)} by ${userName(d.users, doc.rejectedBy)}` : '', hidden: !doc.rejectedAt },
              { label: 'Review remarks', value: doc.reviewRemarks, hidden: !doc.reviewRemarks },
              { label: 'Remarks', value: doc.remarks, hidden: !doc.remarks },
            ]} />
          </Card>
          <Card>
            <CardHeader title="Extracted fields" icon={ScanText} action={<OcrProviderBadge provider={doc.ocrProvider} />} />
            {Object.keys(doc.ocrFields || {}).length ? (
              <dl className="divide-y divide-line">
                {Object.entries(doc.ocrFields).map(([k, val]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <dt className="text-muted">{OCR_FIELDS[k]?.label || k}</dt>
                    <dd className="text-right text-ink break-words">{String(val || '—')}{doc.ocrOriginal && k in doc.ocrOriginal && String(doc.ocrOriginal[k] ?? '') !== String(val ?? '') && <span className="block text-[11px] text-muted">OCR read: {String(doc.ocrOriginal[k] || '—')}</span>}</dd>
                  </div>
                ))}
              </dl>
            ) : <p className="text-sm text-muted">{type?.ocrEnabled ? 'OCR has not run yet.' : 'OCR is off for this document type — fields are entered manually.'}</p>}
            {runs.length > 0 && <p className="mt-3 text-xs text-muted">{runs.length} OCR run{runs.length === 1 ? '' : 's'} · last {formatDateTime(runs[0].processedAt)} · {runs[0].note}</p>}
          </Card>
        </div>
      </div>
    </>
  )
}
