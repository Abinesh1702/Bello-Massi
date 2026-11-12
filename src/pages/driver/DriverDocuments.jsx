import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Upload, Truck, IdCard, AlertTriangle, ChevronRight } from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import { UploadDocumentDialog } from '../../components/phase5/Documents'
import { DocumentStatusBadge, ExpiryBadge } from '../../components/phase5/Badges'
import { NoDriverRecord } from '../../components/driver/DriverUi'
import { useDriverWorkspace } from '../../hooks/useDriverWorkspace'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { driverCompliance, vehicleCompliance } from '../../services/complianceService'
import { effectiveStatus } from '../../services/documentService'
import { formatDate } from '../../utils/formatters'

const DocList = ({ docs, lk }) => (docs.length ? (
  <ul className="divide-y divide-line">
    {docs.map((x) => (
      <li key={x.id}>
        <Link to={`/driver/documents/${x.id}`} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0"><p className="font-medium text-ink">{lk.types[x.typeId]?.name}</p><p className="text-xs text-muted tabular">{x.documentNumber || 'No number yet'}{x.expiryDate ? ` · expires ${formatDate(x.expiryDate)}` : ''}</p><div className="mt-1"><DocumentStatusBadge status={effectiveStatus(x)} /></div></div>
          <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
        </Link>
      </li>
    ))}
  </ul>
) : <EmptyState compact icon={FileText} title="No documents yet" />)

/** Driver's own documents, the assigned vehicle's documents, expiry alerts and proof upload. */
export default function DriverDocuments() {
  const w = useDriverWorkspace()
  const d = usePhase5Data()
  const [upload, setUpload] = useState(null)
  if (!w.driver) return <NoDriverRecord />
  const me = d.lk.drivers[w.driver.id] || w.driver
  const vehicle = d.lk.vehicles[me.vehicleId]
  const myDocs = d.documents.filter((x) => x.entityType === 'driver' && x.entityId === me.id).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
  const vehDocs = vehicle ? d.documents.filter((x) => x.entityType === 'vehicle' && x.entityId === vehicle.id).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)) : []
  const alerts = [...driverCompliance(me, d.vmsSettings).map((r) => ({ ...r, owner: 'You' })), ...(vehicle ? vehicleCompliance(vehicle, d.vmsSettings).map((r) => ({ ...r, owner: vehicle.vehicleNumber })) : [])].filter((r) => r.date && ['EXPIRED', 'TODAY', 'WEEK', 'MONTH'].includes(r.state))
  const types = (entity) => d.documentTypes.filter((t) => t.active && t.entity === entity)
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">My documents</h1>
      {alerts.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader title="Expiry alerts" icon={AlertTriangle} />
          <ul className="space-y-2">{alerts.map((r) => <li key={`${r.owner}-${r.field}`} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-ink">{r.owner} · {r.label}</span><ExpiryBadge date={r.date} /></li>)}</ul>
          <p className="mt-2 text-xs text-muted">Upload the renewed document below. An expired required document stops new dispatch assignments.</p>
        </Card>
      )}
      <Card>
        <CardHeader title="Driver documents" subtitle="Licence, ID, address proof, medical certificate" icon={IdCard} action={<Button size="sm" icon={Upload} onClick={() => setUpload('driver')}>Upload</Button>} />
        <DocList docs={myDocs} lk={d.lk} />
      </Card>
      <Card>
        <CardHeader title={vehicle ? `Vehicle ${vehicle.vehicleNumber}` : 'Assigned vehicle'} subtitle={vehicle ? `${vehicle.type} · ${vehicle.model || ''}` : 'No regular vehicle assigned'} icon={Truck} action={vehicle && <Button size="sm" variant="secondary" icon={Upload} onClick={() => setUpload('vehicle')}>Upload</Button>} />
        {vehicle ? <DocList docs={vehDocs} lk={d.lk} /> : <EmptyState compact icon={Truck} title="No vehicle assigned" />}
      </Card>
      <UploadDocumentDialog open={upload === 'driver'} onClose={() => setUpload(null)} types={types('driver')} entity={{ type: 'driver', id: me.id, label: me.name }} title="Upload driver document" />
      {vehicle && <UploadDocumentDialog open={upload === 'vehicle'} onClose={() => setUpload(null)} types={types('vehicle')} entity={{ type: 'vehicle', id: vehicle.id, label: vehicle.vehicleNumber }} title={`Upload document · ${vehicle.vehicleNumber}`} />}
    </div>
  )
}
