import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, ScanText, BadgeCheck, XCircle, Upload, Clock, AlertTriangle, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import DocumentTable from '../../components/phase5/DocumentTable'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { useTableQuery } from '../../hooks/useTableQuery'
import { canViewDocument, effectiveStatus, expiryState, searchDocuments } from '../../services/documentService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { DOCUMENT_ENTITIES, DOCUMENT_STATUS_META, ENTITY_LABEL, QUEUE_STATUSES } from '../../config/documentConfig'
import { VMS_OPTIONS } from '../../config/vmsConfig'

const VARIANTS = {
  all: { title: 'Document repository', description: 'Every proof and document across customers, fleet, orders, deliveries and invoices — with OCR review and verification.', filter: () => true },
  queue: { title: 'OCR queue', description: 'Documents waiting for OCR processing or review.', filter: (d) => QUEUE_STATUSES.includes(d.status) },
  verified: { title: 'Verified documents', description: 'Documents checked and verified by a reviewer.', filter: (d) => d.status === 'VERIFIED' },
  rejected: { title: 'Rejected documents', description: 'Documents sent back with a reason — the uploader can replace the file.', filter: (d) => d.status === 'REJECTED' },
}
const TABS = [
  { id: 'all', label: 'All', icon: FolderOpen, to: '/documents' },
  { id: 'queue', label: 'OCR queue', icon: ScanText, to: '/documents/ocr-queue' },
  { id: 'verified', label: 'Verified', icon: BadgeCheck, to: '/documents/verified' },
  { id: 'rejected', label: 'Rejected', icon: XCircle, to: '/documents/rejected' },
]

/** Central repository and its OCR-queue / verified / rejected views. */
export function DocumentRepository({ variant = 'all' }) {
  const d = usePhase5Data()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canUpload = usePermission('documents.upload')
  const canTypes = usePermission('documents.types')
  const t = useTableQuery({ filters: ['typeId', 'entityType', 'status', 'expiry', 'from', 'to'] })
  const V = VARIANTS[variant]
  const visible = useMemo(() => d.documents.filter((doc) => canViewDocument(user, doc, { customers: d.customers, orders: d.orders, drivers: d.drivers })), [d.documents, d.customers, d.orders, d.drivers, user])
  const scoped = useMemo(() => visible.filter(V.filter), [visible, V])
  const rows = useMemo(() => searchDocuments(t.q, t.filters, scoped, { types: d.documentTypes }).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)), [scoped, t.q, t.filters, d.documentTypes])
  const count = (fn) => visible.filter(fn).length
  const onExport = () => {
    const n = downloadCsv(csvFilename(`documents-${variant}`), rows, [
      { header: 'Reference', value: (x) => x.documentNumberRef }, { header: 'Document Type', value: (x) => d.lk.types[x.typeId]?.name }, { header: 'Document Number', value: (x) => x.documentNumber },
      { header: 'Entity Type', value: (x) => ENTITY_LABEL[x.entityType] }, { header: 'Related To', value: (x) => x.entityLabel }, { header: 'Issue Date', value: (x) => x.issueDate },
      { header: 'Expiry Date', value: (x) => x.expiryDate }, { header: 'Status', value: (x) => DOCUMENT_STATUS_META[effectiveStatus(x)].label }, { header: 'OCR Provider', value: (x) => x.ocrProvider || '' },
      { header: 'File', value: (x) => x.fileName || 'Demo record (no file)' }, { header: 'Uploaded By', value: (x) => d.lk.users[x.uploadedBy]?.name || '' }, { header: 'Uploaded At', value: (x) => x.uploadedAt },
    ])
    toast.success(`Exported ${n} documents`)
  }
  const typeOptions = d.documentTypes.map((x) => ({ value: x.id, label: x.name }))

  return (
    <>
      <PageHeader title={V.title} description={V.description} actions={<div className="flex flex-wrap gap-2">{canTypes && <Button variant="secondary" icon={Settings2} to="/documents/types">Document types</Button>}{canUpload && <Button icon={Upload} to="/documents/upload">Upload</Button>}</div>} />
      <StatGrid cols={4}>
        <StatCard label="Documents" value={visible.length} icon={FolderOpen} tone="brand" to="/documents" />
        <StatCard label="In OCR / review queue" value={count((x) => QUEUE_STATUSES.includes(x.status))} icon={Clock} tone="warning" to="/documents/ocr-queue" />
        <StatCard label="Verified" value={count((x) => effectiveStatus(x) === 'VERIFIED')} icon={BadgeCheck} tone="success" to="/documents/verified" />
        <StatCard label="Expired / expiring ≤30d" value={count((x) => x.expiryDate && ['EXPIRED', 'TODAY', 'WEEK', 'MONTH'].includes(expiryState(x.expiryDate).state))} icon={AlertTriangle} tone="danger" to="/documents?expiry=EXPIRED" />
      </StatGrid>
      <Card className="mt-6">
        <Tabs value={variant} onChange={(id) => navigate(TABS.find((x) => x.id === id).to)} tabs={TABS} />
        <div className="mt-4">
          <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search name, number, related record…" total={scoped.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
            <FilterSelect label="Document type" allLabel="All types" value={t.filters.typeId} onChange={(v) => t.setFilter('typeId', v)} options={typeOptions} />
            <FilterSelect label="Entity" allLabel="All entities" value={t.filters.entityType} onChange={(v) => t.setFilter('entityType', v)} options={DOCUMENT_ENTITIES.map((x) => ({ value: x.value, label: x.label }))} />
            {variant === 'all' && <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={Object.entries(DOCUMENT_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} />}
            <FilterSelect label="Expiry" allLabel="Any expiry" value={t.filters.expiry} onChange={(v) => t.setFilter('expiry', v)} options={VMS_OPTIONS.expiryStates} />
            <FilterInput label="Uploaded from" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} title="Uploaded from" />
            <FilterInput label="Uploaded to" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} title="Uploaded to" />
          </FilterToolbar>
          <DocumentTable rows={rows} lk={d.lk} page={t.page} onPageChange={t.setPage} caption={V.title} />
        </div>
      </Card>
    </>
  )
}

export default function DocumentRepositoryPage() { return <DocumentRepository variant="all" /> }
export const OcrQueue = () => <DocumentRepository variant="queue" />
export const VerifiedDocuments = () => <DocumentRepository variant="verified" />
export const RejectedDocuments = () => <DocumentRepository variant="rejected" />
