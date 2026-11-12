import { useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Upload, Truck, FileText, History, CalendarCheck, ShieldCheck, UserRound, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import InfoList from '../../components/common/InfoList'
import EmptyState from '../../components/common/EmptyState'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import DocumentTable from '../../components/phase5/DocumentTable'
import { UploadDocumentDialog } from '../../components/phase5/Documents'
import { ExpiryBadge } from '../../components/phase5/Badges'
import { ActiveStatusBadge, AvailabilityBadge, DispatchStatusBadge, VehicleStatusBadge } from '../../components/dispatch/DispatchBadges'
import { OrderAccessDenied } from '../orders/OrderDetail'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { usePermission } from '../../hooks/usePermission'
import { useAuth } from '../../hooks/useAuth'
import { driverCompliance, driverComplianceIssues, vehicleCompliance, vehicleComplianceIssues } from '../../services/complianceService'
import { canUploadFor } from '../../services/documentService'
import { formatDate, formatDateTime, formatNumber } from '../../utils/formatters'
import { scopeOf } from '../../services/rbacService'

function ComplianceList({ rows }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.field} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
          <span className="text-ink">{r.label}{r.required && <span className="ml-1.5 text-[11px] font-medium uppercase tracking-wide text-danger">required</span>}</span>
          <span className="flex items-center gap-2 text-xs text-muted">{r.date ? formatDate(r.date) : 'Not on record'} <ExpiryBadge date={r.date} /></span>
        </li>
      ))}
    </ul>
  )
}

const BlockNotice = ({ issues }) => (issues.length ? (
  <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 dark:bg-danger/100/10" role="alert">
    <p className="flex items-center gap-1.5 text-sm font-semibold text-danger"><AlertTriangle size={15} aria-hidden /> Blocked from new dispatch assignments</p>
    <ul className="mt-1 list-disc pl-5 text-sm text-ink">{issues.map((i) => <li key={i.message}>{i.message}</li>)}</ul>
  </div>
) : null)

/** Vehicle details: overview, documents, history and availability. /vms/vehicles/:id and /vms/vehicles/:id/documents */
export function VmsVehicleDetail() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const d = usePhase5Data()
  const { user } = useAuth()
  const canManage = usePermission('vms.manage')
  const [uploading, setUploading] = useState(false)
  const v = d.lk.vehicles[id]
  const tab = pathname.endsWith('/documents') ? 'documents' : params.get('tab') || 'overview'
  if (!v) return <NotFoundRecord entity="vehicle" backTo="/vms/vehicles" backLabel="Back to vehicles" />
  const docs = d.documents.filter((x) => x.entityType === 'vehicle' && x.entityId === v.id).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
  const rows = vehicleCompliance(v, d.vmsSettings)
  const issues = vehicleComplianceIssues(v, undefined, d.vmsSettings)
  const dispatches = d.dispatches.filter((x) => x.vehicleId === v.id).sort((a, b) => (a.dispatchDate < b.dispatchDate ? 1 : -1))
  const active = dispatches.filter((x) => ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'].includes(x.status))
  const history = [
    ...d.activities.filter((a) => a.entityType === 'vehicle' && a.entityId === v.id).map((a) => ({ at: a.createdAt, text: `${a.actorName} ${a.message}` })),
    ...docs.flatMap((x) => x.history.map((h) => ({ at: h.at, text: `${d.lk.types[x.typeId]?.name}: ${h.action.toLowerCase().replace(/_/g, ' ')}${h.note ? ` — ${h.note}` : ''}` }))),
    ...dispatches.map((x) => ({ at: x.createdAt, text: `Planned on ${x.dispatchNumber} (${x.driverName || 'no driver'}) for ${formatDate(x.dispatchDate)} — ${x.status.toLowerCase().replace(/_/g, ' ')}` })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 40)
  const types = d.documentTypes.filter((t) => t.active && t.entity === 'vehicle')
  const go = (tabId) => navigate(tabId === 'documents' ? `/vms/vehicles/${v.id}/documents` : `/vms/vehicles/${v.id}${tabId === 'overview' ? '' : `?tab=${tabId}`}`)

  return (
    <>
      <PageHeader title={v.vehicleNumber} description={`${[v.manufacturer, v.model].filter(Boolean).join(' ')} · ${v.type} · ${d.lk.hubs[v.hubId]?.name || ''}`}
        actions={<div className="flex flex-wrap gap-2"><Button variant="secondary" icon={ArrowLeft} to="/vms/vehicles">Vehicles</Button>{canUploadFor(user, 'vehicle') && <Button variant="secondary" icon={Upload} onClick={() => setUploading(true)}>Upload document</Button>}{canManage && <Button icon={Pencil} to={`/vms/vehicles/${v.id}/edit`}>Edit</Button>}</div>} />
      <BlockNotice issues={issues} />
      <Card className="mb-6"><Tabs value={tab} onChange={go} tabs={[{ id: 'overview', label: 'Overview', icon: Truck }, { id: 'documents', label: `Documents (${docs.length})`, icon: FileText }, { id: 'history', label: 'History', icon: History }, { id: 'availability', label: 'Availability', icon: CalendarCheck }]} /></Card>
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Vehicle" icon={Truck} action={<VehicleStatusBadge status={v.status} />} />
            <InfoList items={[
              { label: 'Vehicle ID', value: v.id }, { label: 'Registration number', value: v.registrationNumber || v.vehicleNumber },
              { label: 'Type / category', value: [v.type, v.category].filter(Boolean).join(' · ') }, { label: 'Manufacturer / model', value: [v.manufacturer, v.model].filter(Boolean).join(' ') || '—' },
              { label: 'Manufacturing year', value: v.manufacturingYear || '—' }, { label: 'Fuel', value: v.fuelType || '—' },
              { label: 'Capacity', value: `${formatNumber(v.capacity)} ${String(v.capacityUnit).toLowerCase()}` }, { label: 'Hub', value: d.lk.hubs[v.hubId]?.name },
              { label: 'Ownership', value: [v.ownershipType, v.ownerName].filter(Boolean).join(' · ') || '—' }, { label: 'Assigned driver', value: d.lk.drivers[v.assignedDriverId]?.name || '—' },
              { label: 'Insurance', value: [v.insuranceProvider, v.insurancePolicyNumber].filter(Boolean).join(' · ') || '—' },
              { label: 'Created / updated', value: `${formatDate(v.createdAt)} · ${formatDate(v.updatedAt)}` },
              { label: 'Remarks', value: v.remarks || v.notes, hidden: !(v.remarks || v.notes), span: 2 },
            ]} />
          </Card>
          <Card><CardHeader title="Compliance" subtitle="Required documents block assignment when expired" icon={ShieldCheck} /><ComplianceList rows={rows} /></Card>
        </div>
      )}
      {tab === 'documents' && (
        <Card>
          <CardHeader title="Vehicle documents" subtitle="RC, insurance, PUC, fitness, permit, road tax — verified documents update the compliance dates." icon={FileText} action={canUploadFor(user, 'vehicle') && <Button size="sm" icon={Upload} onClick={() => setUploading(true)}>Upload</Button>} />
          <DocumentTable rows={docs} lk={d.lk} showEntity={false} caption="Vehicle documents" empty={<EmptyState icon={FileText} title="No documents yet" description="Upload the RC, insurance and fitness certificate." />} />
        </Card>
      )}
      {tab === 'history' && (
        <Card>
          <CardHeader title="Vehicle history" icon={History} />
          {history.length ? <ol className="space-y-3">{history.map((h, i) => <li key={`${h.at}-${i}`} className="text-sm"><p className="text-ink">{h.text}</p><p className="text-xs text-muted">{formatDateTime(h.at)}</p></li>)}</ol> : <EmptyState compact title="No history yet" />}
        </Card>
      )}
      {tab === 'availability' && (
        <Card>
          <CardHeader title="Availability" subtitle={active.length ? `On ${active.map((x) => x.dispatchNumber).join(', ')}` : issues.length ? 'Not assignable until compliance is fixed' : v.status === 'Available' ? 'Free for new dispatches' : `Status: ${v.status}`} icon={CalendarCheck} action={<VehicleStatusBadge status={v.status} />} />
          {dispatches.length ? (
            <ul className="divide-y divide-line">{dispatches.slice(0, 15).map((x) => <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><button type="button" className="text-left hover:underline" onClick={() => navigate(`/dispatch/${x.id}`)}><span className="font-medium tabular">{x.dispatchNumber}</span> <span className="text-muted">· {formatDate(x.dispatchDate)} · {x.driverName || 'no driver'} · {x.totalDeliveries} stops</span></button><DispatchStatusBadge status={x.status} /></li>)}</ul>
          ) : <EmptyState compact title="Never dispatched" />}
        </Card>
      )}
      <UploadDocumentDialog open={uploading} onClose={() => setUploading(false)} types={types} entity={{ type: 'vehicle', id: v.id, label: v.vehicleNumber }} title={`Upload document · ${v.vehicleNumber}`} onDone={() => go('documents')} />
    </>
  )
}

/** Driver documents (linked to the Driver Master). */
export function VmsDriverDocuments() {
  const { id } = useParams()
  const d = usePhase5Data()
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const drv = d.lk.drivers[id]
  if (!drv) return <NotFoundRecord entity="driver" backTo="/vms/drivers" backLabel="Back to drivers" />
  if (scopeOf(user) === 'DRIVER' && drv.userId !== user.id) return <OrderAccessDenied />
  const docs = d.documents.filter((x) => x.entityType === 'driver' && x.entityId === drv.id).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
  const issues = [...driverComplianceIssues(drv, undefined, d.vmsSettings), ...(driverCompliance(drv, d.vmsSettings).find((r) => r.field === 'licenseExpiry' && r.state === 'EXPIRED') ? [{ message: `${drv.name}: driving licence expired.` }] : [])]
  return (
    <>
      <PageHeader title={`${drv.name} · documents`} description={`${drv.code} · ${d.lk.hubs[drv.hubId]?.name || ''} · licence ${drv.licenseNumber}`}
        actions={<div className="flex flex-wrap gap-2"><Button variant="secondary" icon={ArrowLeft} to="/vms/drivers">Drivers</Button><Button variant="ghost" icon={UserRound} to={`/dispatch/drivers/${drv.id}`}>Driver profile</Button>{canUploadFor(user, 'driver') && <Button icon={Upload} onClick={() => setUploading(true)}>Upload document</Button>}</div>} />
      <BlockNotice issues={issues} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card><CardHeader title="Compliance" icon={ShieldCheck} action={<div className="flex gap-1"><ActiveStatusBadge status={drv.status} /><AvailabilityBadge value={drv.availability} /></div>} /><ComplianceList rows={driverCompliance(drv, d.vmsSettings)} /></Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Documents" subtitle="Driving licence, ID, address proof, medical certificate" icon={FileText} />
          <DocumentTable rows={docs} lk={d.lk} showEntity={false} caption="Driver documents" empty={<EmptyState icon={FileText} title="No documents yet" />} />
        </Card>
      </div>
      <UploadDocumentDialog open={uploading} onClose={() => setUploading(false)} types={d.documentTypes.filter((t) => t.active && t.entity === 'driver')} entity={{ type: 'driver', id: drv.id, label: drv.name }} title={`Upload document · ${drv.name}`} />
    </>
  )
}
