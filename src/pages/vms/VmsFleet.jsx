import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Eye, Pencil, FileText, Truck, UserRound } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import RowActions from '../../components/common/RowActions'
import EmptyState from '../../components/common/EmptyState'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import { ExpiryBadge } from '../../components/phase5/Badges'
import { ActiveStatusBadge, AvailabilityBadge, VehicleStatusBadge } from '../../components/dispatch/DispatchBadges'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { usePermission } from '../../hooks/usePermission'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { driverCompliance, vehicleCompliance, worstState } from '../../services/complianceService'
import { searchVehicles } from '../../services/vehicleService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { DISPATCH_OPTIONS } from '../../config/dispatchConfig'
import { EXPIRY_META, VMS_OPTIONS } from '../../config/vmsConfig'

const ON_ROAD = ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT']

/** The one vehicle register (Fleet & Vehicles › Vehicles): capacity, assignment, current dispatch, status and compliance. */
export function VmsVehicles() {
  const navigate = useNavigate()
  const d = usePhase5Data()
  const canVms = usePermission('vms.manage')
  const canFleet = usePermission('fleet.manage')
  const canManage = canVms || canFleet
  const current = useMemo(() => Object.fromEntries((d.dispatches || []).filter((x) => ON_ROAD.includes(x.status) && x.vehicleId).map((x) => [x.vehicleId, x])), [d.dispatches])
  const t = useTableQuery({ filters: ['hubId', 'status', 'type', 'compliance'], sort: 'vehicleNumber' })
  const rows = useMemo(() => {
    const list = searchVehicles(t.q, t.filters, d.vehicles).map((v) => ({ ...v, _worst: worstState(vehicleCompliance(v, d.vmsSettings)) }))
    const filtered = t.filters.compliance ? list.filter((v) => v._worst === t.filters.compliance) : list
    return sortRows(filtered, t.sort, t.dir, { vehicleNumber: (v) => v.vehicleNumber, compliance: (v) => EXPIRY_META[v._worst].rank })
  }, [d.vehicles, d.vmsSettings, t.q, t.filters, t.sort, t.dir])
  const onExport = () => {
    const n = downloadCsv(csvFilename('vms-vehicles'), rows, [
      ['Vehicle Number', (v) => v.vehicleNumber], ['Registration Number', (v) => v.registrationNumber], ['Type', (v) => v.type], ['Category', (v) => v.category], ['Manufacturer', (v) => v.manufacturer], ['Model', (v) => v.model],
      ['Year', (v) => v.manufacturingYear], ['Fuel', (v) => v.fuelType], ['Capacity', (v) => v.capacity], ['Unit', (v) => v.capacityUnit], ['Ownership', (v) => v.ownershipType], ['Owner', (v) => v.ownerName],
      ['Insurer', (v) => v.insuranceProvider], ['Policy', (v) => v.insurancePolicyNumber], ['Insurance Expiry', (v) => v.insuranceExpiry], ['RC Expiry', (v) => v.registrationExpiry], ['PUC Expiry', (v) => v.pollutionExpiry],
      ['Fitness Expiry', (v) => v.fitnessExpiry], ['Permit Expiry', (v) => v.permitExpiry], ['Hub', (v) => d.lk.hubs[v.hubId]?.name], ['Assigned Driver', (v) => d.lk.drivers[v.assignedDriverId]?.name || ''], ['Current Dispatch', (v) => current[v.id]?.dispatchNumber || ''], ['Status', (v) => v.status], ['Compliance', (v) => EXPIRY_META[v._worst].label],
    ].map(([header, value]) => ({ header, value })))
    toast.success(`Exported ${n} vehicles`)
  }
  return (
    <>
      <PageHeader title="Vehicles" description="The one fleet register: capacity, hub, driver, current dispatch, status and document compliance. Vehicles under maintenance, inactive or with expired critical documents cannot be assigned." actions={canManage && <Button icon={Plus} to="/vms/vehicles/create">Add vehicle</Button>} />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search number, registration, model…" total={d.vehicles.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={d.hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={DISPATCH_OPTIONS.vehicleStatuses} />
          <FilterSelect label="Type" allLabel="All types" value={t.filters.type} onChange={(v) => t.setFilter('type', v)} options={DISPATCH_OPTIONS.vehicleTypes} />
          <FilterSelect label="Compliance" allLabel="Any compliance" value={t.filters.compliance} onChange={(v) => t.setFilter('compliance', v)} options={VMS_OPTIONS.expiryStates} />
        </FilterToolbar>
        <DataTable caption="Vehicles" rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort} onRowClick={(v) => navigate(`/vms/vehicles/${v.id}`)}
          empty={<EmptyState icon={Truck} title="No vehicles match" />}
          columns={[
            { key: 'vehicleNumber', header: 'Vehicle', sortable: true, render: (v) => (<div><p className="font-medium tabular text-ink whitespace-nowrap">{v.vehicleNumber}</p><p className="text-xs text-muted">{v.type}{v.category ? ` · ${v.category}` : ''}</p></div>) },
            { key: 'm', header: 'Make / model', hideBelow: 'lg', render: (v) => <span className="text-sm">{[v.manufacturer, v.model].filter(Boolean).join(' ')}{v.manufacturingYear ? ` (${v.manufacturingYear})` : ''}</span> },
            { key: 'h', header: 'Hub', hideBelow: 'md', render: (v) => d.lk.hubs[v.hubId]?.name },
            { key: 'cap', header: 'Capacity', align: 'right', hideBelow: 'sm', render: (v) => <span className="whitespace-nowrap tabular">{v.capacity} {String(v.capacityUnit || '').toLowerCase()}</span> },
            { key: 'drv', header: 'Driver', hideBelow: 'xl', render: (v) => d.lk.drivers[v.assignedDriverId]?.name || <span className="text-muted">Pool</span> },
            { key: 'dsp', header: 'Current dispatch', hideBelow: 'xl', render: (v) => (current[v.id] ? <span className="tabular text-xs">{current[v.id].dispatchNumber}</span> : <span className="text-muted">—</span>) },
            { key: 'compliance', header: 'Compliance', sortable: true, render: (v) => <ExpiryBadge state={v._worst} /> },
            { key: 's', header: 'Status', render: (v) => <VehicleStatusBadge status={v.status} /> },
            { key: 'a', header: '', align: 'right', render: (v) => <RowActions label={`Actions for ${v.vehicleNumber}`} items={[{ label: 'View', icon: Eye, to: `/vms/vehicles/${v.id}` }, { label: 'Documents', icon: FileText, to: `/vms/vehicles/${v.id}/documents` }, { label: 'Edit', icon: Pencil, to: `/vms/vehicles/${v.id}/edit`, hidden: !canManage }]} /> },
          ]} />
      </Card>
    </>
  )
}

/** Drivers with their document compliance. */
export function VmsDrivers() {
  const navigate = useNavigate()
  const d = usePhase5Data()
  const t = useTableQuery({ filters: ['hubId', 'compliance'] })
  const rows = useMemo(() => d.drivers
    .map((x) => ({ ...x, _rows: driverCompliance(x, d.vmsSettings), _docs: d.documents.filter((doc) => doc.entityType === 'driver' && doc.entityId === x.id) }))
    .map((x) => ({ ...x, _worst: worstState(x._rows) }))
    .filter((x) => (!t.q || [x.name, x.code, x.licenseNumber].some((s) => String(s || '').toLowerCase().includes(t.q.toLowerCase())))
      && (!t.filters.hubId || x.hubId === t.filters.hubId) && (!t.filters.compliance || x._worst === t.filters.compliance)), [d, t.q, t.filters])
  return (
    <>
      <PageHeader title="Driver documents" description="Licence, ID, address proof and medical certificates for every driver, linked to the Driver Master." actions={<Button variant="secondary" icon={UserRound} to="/dispatch/drivers">Driver master</Button>} />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search driver, code, licence…" total={d.drivers.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset}>
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={d.hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Compliance" allLabel="Any compliance" value={t.filters.compliance} onChange={(v) => t.setFilter('compliance', v)} options={VMS_OPTIONS.expiryStates} />
        </FilterToolbar>
        <DataTable caption="Drivers" rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} onRowClick={(x) => navigate(`/vms/drivers/${x.id}/documents`)} columns={[
          { key: 'n', header: 'Driver', render: (x) => (<div><p className="font-medium text-ink">{x.name}</p><p className="text-xs text-muted tabular">{x.code} · {d.lk.hubs[x.hubId]?.city}</p></div>) },
          { key: 'l', header: 'Licence', hideBelow: 'md', render: (x) => <div><p className="text-xs tabular">{x.licenseNumber}</p><ExpiryBadge date={x.licenseExpiry} /></div> },
          { key: 'm', header: 'Medical', hideBelow: 'lg', render: (x) => <ExpiryBadge date={x.medicalExpiry} /> },
          { key: 'docs', header: 'Documents', align: 'right', hideBelow: 'sm', render: (x) => `${x._docs.filter((doc) => doc.status === 'VERIFIED').length}/${x._docs.length} verified` },
          { key: 'c', header: 'Compliance', render: (x) => <ExpiryBadge state={x._worst} /> },
          { key: 's', header: 'Status', hideBelow: 'sm', render: (x) => <div className="flex flex-wrap gap-1"><ActiveStatusBadge status={x.status} /><AvailabilityBadge value={x.availability} /></div> },
        ]} />
      </Card>
    </>
  )
}
