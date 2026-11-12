import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Truck, CheckCircle2, PauseCircle, Route, Wrench, Navigation, AlertTriangle, CalendarClock, UserX, UserRound, Plus, ShieldCheck, Activity, FileCheck2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import SingleBarChart from '../../components/dashboard/charts/SingleBarChart'
import StatusDonutChart from '../../components/dashboard/charts/StatusDonutChart'
import StackedBarChart from '../../components/dashboard/charts/StackedBarChart'
import { ExpiryBadge } from '../../components/phase5/Badges'
import { VehicleStatusBadge } from '../../components/dispatch/DispatchBadges'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { usePermission } from '../../hooks/usePermission'
import { expiryRegister } from '../../services/complianceService'
import { scanDocumentExpiries } from '../../services/automationService'
import { effectiveStatus } from '../../services/documentService'
import { VEHICLE_STATUSES, VEHICLE_TYPES } from '../../config/dispatchConfig'
import { EXPIRY_META } from '../../config/vmsConfig'
import { formatDate, formatRelative } from '../../utils/formatters'

const STATUS_COLORS = { Available: 'var(--chart-3)', Assigned: 'var(--chart-1)', 'In Transit': 'var(--chart-2)', Maintenance: 'var(--chart-4)', Inactive: 'var(--chart-5)' }
const EXPIRY_SERIES = [
  { key: 'EXPIRED', label: 'Expired', color: 'var(--chart-5)' },
  { key: 'SOON', label: 'Within 30 days', color: 'var(--chart-4)' },
  { key: 'VALID', label: 'Valid', color: 'var(--chart-3)' },
]
const bucket = (s) => (s === 'EXPIRED' ? 'EXPIRED' : ['TODAY', 'WEEK', 'MONTH'].includes(s) ? 'SOON' : s === 'VALID' ? 'VALID' : null)

export default function VmsDashboard() {
  const d = usePhase5Data()
  const canManage = usePermission('vms.manage')
  // Expiry alerts are generated (once per document date) whenever the dashboard opens
  useEffect(() => { scanDocumentExpiries() }, [])
  const reg = useMemo(() => expiryRegister({ vehicles: d.vehicles, drivers: d.drivers, settings: d.vmsSettings }), [d.vehicles, d.drivers, d.vmsSettings])
  const v = d.vehicles
  const vReg = reg.filter((r) => r.ownerType === 'vehicle' && r.date)
  const dReg = reg.filter((r) => r.ownerType === 'driver' && r.date)
  const soon = (r) => ['TODAY', 'WEEK', 'MONTH'].includes(r.state)
  const ownersWith = (rows, fn) => new Set(rows.filter(fn).map((r) => r.ownerId)).size
  const expiryBy = (rows) => [...new Set(rows.map((r) => r.label))].map((label) => {
    const list = rows.filter((r) => r.label === label)
    return { name: label, ...Object.fromEntries(EXPIRY_SERIES.map((s) => [s.key, list.filter((r) => bucket(r.state) === s.key).length])) }
  })
  const alerts = reg.filter((r) => r.date && (r.state === 'EXPIRED' || soon(r))).sort((a, b) => EXPIRY_META[a.state].rank - EXPIRY_META[b.state].rank || (a.date < b.date ? -1 : 1)).slice(0, 8)
  const activities = d.activities.filter((a) => ['vehicle', 'document'].includes(a.entityType) || a.type === 'VEHICLE').slice(0, 8)
  const fleetDocs = d.documents.filter((x) => ['vehicle', 'driver'].includes(x.entityType))
  const verification = ['VERIFIED', 'PENDING_REVIEW', 'OCR_COMPLETED', 'PENDING_OCR', 'REJECTED', 'EXPIRED'].map((s) => ({ s, n: fleetDocs.filter((x) => effectiveStatus(x) === s).length }))

  return (
    <>
      <PageHeader title="Vehicle Management" description="Fleet status, compliance documents and expiry — calculated from the vehicles, drivers and documents stored in this browser."
        actions={canManage && <Button icon={Plus} to="/vms/vehicles/create">Add vehicle</Button>} />
      <StatGrid cols={4}>
        <StatCard label="Total vehicles" value={v.length} icon={Truck} tone="brand" to="/vms/vehicles" />
        <StatCard label="Active vehicles" value={v.filter((x) => x.status !== 'Inactive').length} icon={CheckCircle2} tone="success" hint={`${v.filter((x) => x.status === 'Inactive').length} inactive`} to="/vms/vehicles" />
        <StatCard label="Available" value={v.filter((x) => x.status === 'Available').length} icon={Navigation} tone="info" to="/vms/vehicles?status=Available" />
        <StatCard label="Assigned · in transit" value={`${v.filter((x) => x.status === 'Assigned').length} · ${v.filter((x) => x.status === 'In Transit').length}`} icon={Route} tone="accent" to="/vms/vehicles?status=Assigned" />
      </StatGrid>
      <div className="mt-4"><StatGrid cols={4}>
        <StatCard label="Under maintenance" value={v.filter((x) => x.status === 'Maintenance').length} icon={Wrench} tone="warning" to="/vms/vehicles?status=Maintenance" />
        <StatCard label="Inactive vehicles" value={v.filter((x) => x.status === 'Inactive').length} icon={PauseCircle} tone="neutral" to="/vms/vehicles?status=Inactive" />
        <StatCard label="Expired vehicle documents" value={vReg.filter((r) => r.state === 'EXPIRED').length} icon={AlertTriangle} tone="danger" hint={`${vReg.filter(soon).length} expiring within 30 days`} to="/vms/document-expiry?owner=vehicle&state=EXPIRED" />
        <StatCard label="Drivers with expired documents" value={ownersWith(dReg, (r) => r.state === 'EXPIRED')} icon={UserX} tone="danger" hint={`${ownersWith(dReg, soon)} with documents expiring soon`} to="/vms/document-expiry?owner=driver" />
      </StatGrid></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <StatusDonutChart title="Vehicle status" subtitle="All vehicles" data={VEHICLE_STATUSES.map((s) => ({ name: s, value: v.filter((x) => x.status === s).length, color: STATUS_COLORS[s] }))} linkTo="/vms/vehicles" linkLabel="Vehicles" centerLabel="vehicles" />
        <SingleBarChart title="Vehicle type" subtitle="Vehicles per type" data={VEHICLE_TYPES.map((t) => ({ name: t, value: v.filter((x) => x.type === t).length })).filter((x) => x.value)} seriesName="Vehicles" height={240} />
        <SingleBarChart title="Hub-wise vehicles" subtitle="Vehicles per hub" data={d.hubs.map((h) => ({ name: h.city || h.name, value: v.filter((x) => x.hubId === h.id).length })).filter((x) => x.value)} seriesName="Vehicles" height={240} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <StackedBarChart title="Vehicle document expiry" subtitle="Compliance dates on vehicle records" data={expiryBy(vReg)} series={EXPIRY_SERIES} layout="vertical" height={240} />
        <StackedBarChart title="Driver document expiry" subtitle="Licence and medical certificate dates" data={expiryBy(dReg)} series={EXPIRY_SERIES} layout="vertical" height={240} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Expiry alerts" subtitle="Expired or due within 30 days" icon={CalendarClock} action={<Link to="/vms/document-expiry" className="text-xs font-medium text-brand hover:underline">All expiries</Link>} />
          {alerts.length ? (
            <ul className="divide-y divide-line">
              {alerts.map((r) => (
                <li key={`${r.ownerId}-${r.field}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <Link to={r.ownerType === 'vehicle' ? `/vms/vehicles/${r.ownerId}/documents` : `/vms/drivers/${r.ownerId}/documents`} className="min-w-0 hover:underline">
                    <span className="font-medium text-ink">{r.ownerName}</span> <span className="text-muted">· {r.label}{r.required ? '' : ' (not required)'}</span>
                  </Link>
                  <span className="flex items-center gap-2 text-xs text-muted">{formatDate(r.date)} <ExpiryBadge date={r.date} /></span>
                </li>
              ))}
            </ul>
          ) : <EmptyState compact icon={ShieldCheck} title="No expiries in the next 30 days" />}
        </Card>
        <Card>
          <CardHeader title="Document verification" subtitle="Vehicle and driver documents" icon={FileCheck2} action={<Link to="/documents/ocr-queue" className="text-xs font-medium text-brand hover:underline">OCR queue</Link>} />
          <ul className="space-y-2 text-sm">{verification.map(({ s, n }) => <li key={s} className="flex justify-between"><span className="text-muted">{({ VERIFIED: 'Verified', PENDING_REVIEW: 'Pending review', OCR_COMPLETED: 'OCR completed', PENDING_OCR: 'Pending OCR', REJECTED: 'Rejected', EXPIRED: 'Expired' })[s]}</span><span className="font-medium tabular text-ink">{n}</span></li>)}</ul>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Vehicle availability" icon={Truck} action={<Link to="/vms/vehicles" className="text-xs font-medium text-brand hover:underline">Vehicles</Link>} />
          <ul className="divide-y divide-line">
            {[...v].sort((a, b) => VEHICLE_STATUSES.indexOf(a.status) - VEHICLE_STATUSES.indexOf(b.status)).slice(0, 8).map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-2 py-2 text-sm"><Link to={`/vms/vehicles/${x.id}`} className="hover:underline"><span className="font-medium tabular text-ink">{x.vehicleNumber}</span> <span className="text-muted">· {x.type} · {d.lk.hubs[x.hubId]?.city}</span></Link><VehicleStatusBadge status={x.status} /></li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Recent vehicle activity" icon={Activity} />
          {activities.length ? <ul className="divide-y divide-line">{activities.map((a) => <li key={a.id} className="py-2 text-sm"><p className="text-ink"><span className="font-medium">{a.actorName || 'System'}</span> {a.message}</p><p className="text-xs text-muted">{formatRelative(a.createdAt)}</p></li>)}</ul> : <EmptyState compact icon={UserRound} title="No vehicle activity yet" />}
        </Card>
      </div>
    </>
  )
}
