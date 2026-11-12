import { useNavigate } from 'react-router-dom'
import { Eye, ScanText, ExternalLink } from 'lucide-react'
import DataTable from '../common/DataTable'
import EmptyState from '../common/EmptyState'
import RowActions from '../common/RowActions'
import { DocumentStatusBadge, ExpiryBadge, OcrProviderBadge } from './Badges'
import { effectiveStatus, entityPath, canReview } from '../../services/documentService'
import { useAuth } from '../../hooks/useAuth'
import { ENTITY_LABEL, QUEUE_STATUSES } from '../../config/documentConfig'
import { formatDate } from '../../utils/formatters'

/** Shared document list (repository, OCR queue, vehicle & driver documents). */
export default function DocumentTable({ rows, lk, showEntity = true, page, onPageChange, pageSize = 12, empty, caption = 'Documents', basePath = '/documents' }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const columns = [
    { key: 'name', header: 'Document', render: (d) => (<div className="min-w-0"><p className="font-medium text-ink truncate max-w-[260px]">{lk.types[d.typeId]?.name || d.typeCode}</p><p className="text-xs text-muted tabular truncate max-w-[260px]">{d.documentNumber || 'No number yet'} · {d.documentNumberRef}</p></div>) },
    ...(showEntity ? [{ key: 'entity', header: 'Related to', hideBelow: 'md', render: (d) => (<div><p className="text-ink truncate max-w-[200px]">{d.entityLabel || '—'}</p><p className="text-xs text-muted">{ENTITY_LABEL[d.entityType]}</p></div>) }] : []),
    { key: 'expiry', header: 'Expiry', hideBelow: 'lg', render: (d) => (d.expiryDate ? <div><p className="text-xs tabular">{formatDate(d.expiryDate)}</p><ExpiryBadge date={d.expiryDate} /></div> : <span className="text-xs text-muted">No expiry</span>) },
    { key: 'ocr', header: 'OCR', hideBelow: 'xl', render: (d) => (d.ocrProvider ? <OcrProviderBadge provider={d.ocrProvider} /> : <span className="text-xs text-muted">—</span>) },
    { key: 'status', header: 'Status', render: (d) => <DocumentStatusBadge status={effectiveStatus(d)} /> },
    { key: 'up', header: 'Uploaded', hideBelow: 'sm', render: (d) => <span className="text-xs whitespace-nowrap">{formatDate(d.uploadedAt)}</span> },
    {
      key: 'actions', header: '', align: 'right', render: (d) => (
        <RowActions label={`Actions for ${d.name}`} items={[
          { label: 'View', icon: Eye, to: `${basePath}/${d.id}` },
          { label: 'OCR review', icon: ScanText, to: `/documents/${d.id}/review`, hidden: !(canReview(user, d) && QUEUE_STATUSES.includes(d.status)) },
          { label: 'Open related record', icon: ExternalLink, to: entityPath(d.entityType, d.entityId), hidden: !entityPath(d.entityType, d.entityId) || !d.entityId },
        ]} />
      ),
    },
  ]
  return <DataTable caption={caption} rows={rows} columns={columns} pageSize={pageSize} page={page} onPageChange={onPageChange} onRowClick={(d) => navigate(`${basePath}/${d.id}`)} empty={empty || <EmptyState title="No documents" description="Nothing matches yet." />} />
}
