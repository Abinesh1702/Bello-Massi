import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRoundCheck, Truck, Clock, PackageCheck, UserRound } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { AvailabilityBadge, DispatchStatusBadge, LicenseBadge, VehicleStatusBadge } from '../../components/dispatch/DispatchBadges'
import { AssignDialog, ConfirmDispatchDialog } from '../../components/dispatch/DispatchDialogs'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { RESOURCE_DISPATCH_STATUSES } from '../../config/dispatchConfig'
import { formatDate, formatNumber } from '../../utils/formatters'

export default function Assignments() {
  const navigate = useNavigate()
  const { dispatches, drivers, vehicles, hubs, lk } = useDispatchData()
  const [tab, setTab] = useState('pending')
  const [hubId, setHubId] = useLocalStorage('bellomassi_ui_assign_hub', '', 'session')
  const [dialog, setDialog] = useState(null)
  const inHub = (x) => !hubId || x.hubId === hubId
  const pending = dispatches.filter((d) => d.status === 'PLANNED' && inHub(d))
  const assigned = dispatches.filter((d) => d.status === 'ASSIGNED' && inHub(d))
  const live = dispatches.filter((d) => ['CONFIRMED', 'IN_TRANSIT'].includes(d.status) && inHub(d))
  const list = tab === 'pending' ? pending : tab === 'assigned' ? assigned : live
  const current = (field, id) => dispatches.find((d) => d[field] === id && RESOURCE_DISPATCH_STATUSES.includes(d.status))

  const columns = [
    { key: 'n', header: 'Dispatch', render: (d) => (<div><p className="font-medium tabular whitespace-nowrap">{d.dispatchNumber}</p><p className="text-xs text-muted">{formatDate(d.dispatchDate)}</p></div>) },
    { key: 'z', header: 'Hub / zone', hideBelow: 'md', render: (d) => (<div><p>{lk.hubs[d.hubId]?.name}</p><p className="text-xs text-muted">{lk.zones[d.zoneId]?.name || '—'}</p></div>) },
    { key: 'load', header: 'Stops · units', hideBelow: 'sm', render: (d) => `${d.totalDeliveries} · ${formatNumber(d.totalQuantity)}` },
    { key: 'dr', header: 'Driver / vehicle', render: (d) => (d.driverName ? <div><p>{d.driverName}</p><p className="text-xs text-muted tabular">{d.vehicleNumber}</p></div> : <span className="text-warning text-sm">Not assigned</span>) },
    { key: 'st', header: 'Status', hideBelow: 'md', render: (d) => <DispatchStatusBadge status={d.status} /> },
    {
      key: 'act', header: <span className="sr-only">Actions</span>, align: 'right',
      render: (d) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {['PLANNED', 'ASSIGNED'].includes(d.status) && <Button size="xs" variant={d.status === 'PLANNED' ? 'primary' : 'secondary'} icon={UserRoundCheck} onClick={() => setDialog({ type: 'assign', d })}>{d.status === 'PLANNED' ? 'Assign' : 'Reassign'}</Button>}
          {d.status === 'ASSIGNED' && <Button size="xs" variant="accent" icon={PackageCheck} onClick={() => setDialog({ type: 'confirm', d })}>Confirm</Button>}
        </div>
      ),
    },
  ]
  const hubDrivers = drivers.filter(inHub)
  const hubVehicles = vehicles.filter(inHub)
  return (
    <>
      <PageHeader title="Driver assignment" description="Assign drivers and vehicles to planned dispatches and confirm assigned ones. Drivers must be active, available, at the same hub and hold a valid licence."
        actions={<FilterSelect label="Hub" allLabel="All hubs" value={hubId} onChange={setHubId} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />} />
      <StatGrid cols={4}>
        <StatCard label="Awaiting assignment" value={pending.length} icon={Clock} tone="warning" />
        <StatCard label="Assigned, to confirm" value={assigned.length} icon={UserRoundCheck} tone="brand" />
        <StatCard label="Available drivers" value={hubDrivers.filter((d) => d.availability === 'Available' && d.status === 'Active').length} icon={UserRound} tone="success" hint={`of ${hubDrivers.length}`} />
        <StatCard label="Available vehicles" value={hubVehicles.filter((v) => v.status === 'Available').length} icon={Truck} tone="info" hint={`of ${hubVehicles.length}`} />
      </StatGrid>
      <Card className="mt-6">
        <Tabs value={tab} onChange={setTab} className="mb-4" tabs={[
          { id: 'pending', label: `Awaiting assignment (${pending.length})` }, { id: 'assigned', label: `Assigned (${assigned.length})` }, { id: 'live', label: `Confirmed / in transit (${live.length})` },
        ]} />
        <DataTable caption="Dispatch assignments" columns={columns} rows={list} pageSize={10} onRowClick={(d) => navigate(`/dispatch/${d.id}`)} empty={<EmptyState compact icon={UserRoundCheck} title="Nothing here" description={tab === 'pending' ? 'Every planned dispatch has a driver.' : undefined} />} />
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Driver availability" icon={UserRound} action={<Button size="sm" variant="secondary" to="/dispatch/drivers">All drivers</Button>} />
          <ul className="divide-y divide-line">
            {hubDrivers.map((d) => { const c = current('driverId', d.id); return (
              <li key={d.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-muted">{lk.hubs[d.hubId]?.city} · {c ? c.dispatchNumber : 'no active dispatch'}</p></div>
                <LicenseBadge driver={d} compact /><AvailabilityBadge value={d.availability} />
              </li>
            ) })}
            {!hubDrivers.length && <li className="py-4 text-sm text-muted">No drivers.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Vehicle availability" icon={Truck} action={<Button size="sm" variant="secondary" to="/vms/vehicles">All vehicles</Button>} />
          <ul className="divide-y divide-line">
            {hubVehicles.map((v) => { const c = current('vehicleId', v.id); return (
              <li key={v.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium tabular">{v.vehicleNumber}</p><p className="text-xs text-muted">{v.type} · {formatNumber(v.capacity)} {v.capacityUnit.toLowerCase()}{c ? ` · ${c.dispatchNumber}` : ''}</p></div>
                <VehicleStatusBadge status={v.status} />
              </li>
            ) })}
            {!hubVehicles.length && <li className="py-4 text-sm text-muted">No vehicles.</li>}
          </ul>
        </Card>
      </div>
      {dialog?.type === 'assign' && <AssignDialog key={dialog.d.id} dispatch={dispatches.find((x) => x.id === dialog.d.id)} open onClose={() => setDialog(null)} />}
      {dialog?.type === 'confirm' && <ConfirmDispatchDialog key={dialog.d.id} dispatch={dispatches.find((x) => x.id === dialog.d.id)} open onClose={() => setDialog(null)} />}
    </>
  )
}
