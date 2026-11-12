import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRound, UserRoundCheck, Truck, ShieldAlert, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import RowActions from '../../components/common/RowActions'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { ActiveStatusBadge, AvailabilityBadge, LicenseBadge } from '../../components/dispatch/DispatchBadges'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { useDeleteFlow } from '../../hooks/useDeleteFlow'
import { deleteDriver, getDriverDeleteBlockers, licenseState, searchDrivers, updateDriver } from '../../services/driverService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { DISPATCH_OPTIONS, RESOURCE_DISPATCH_STATUSES } from '../../config/dispatchConfig'

export default function DriverList() {
  const navigate = useNavigate()
  const { drivers, hubs, zones, dispatches, lk } = useDispatchData()
  const canManage = usePermission('fleet.manage')
  const t = useTableQuery({ filters: ['hubId', 'zoneId', 'availability', 'status', 'license'], sort: 'name' })
  const current = useMemo(() => Object.fromEntries(drivers.map((d) => [d.id, dispatches.find((x) => x.driverId === d.id && RESOURCE_DISPATCH_STATUSES.includes(x.status)) || null])), [drivers, dispatches])
  const filtered = useMemo(() => searchDrivers(t.q, t.filters, drivers), [drivers, t.q, t.filters])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, { hub: (d) => lk.hubs[d.hubId]?.name, license: (d) => d.licenseExpiry }), [filtered, t.sort, t.dir, lk])

  const del = useDeleteFlow({
    entity: 'driver', getBlockers: getDriverDeleteBlockers, remove: deleteDriver, formatReason: (r) => `This driver ${r}.`,
    alternative: canManage && {
      label: 'Mark as Inactive', suggestion: 'Inactive drivers keep their delivery history but cannot be assigned.',
      run: (d) => {
        const res = updateDriver(d.id, { ...d, vehicleId: d.vehicleId || '', status: 'Inactive' })
        if (res.ok) toast.success(`${d.name} marked Inactive`)
        else toast.error(Object.values(res.errors)[0])
      },
    },
  })

  const onExport = () => {
    const n = downloadCsv(csvFilename('drivers'), rows, [
      { header: 'Driver ID', value: (d) => d.id }, { header: 'Driver Code', value: (d) => d.code }, { header: 'Driver Name', value: (d) => d.name },
      { header: 'Employee Number', value: (d) => d.employeeNumber }, { header: 'Mobile', value: (d) => d.mobile }, { header: 'Email', value: (d) => d.email },
      { header: 'Hub', value: (d) => lk.hubs[d.hubId]?.name }, { header: 'Zone', value: (d) => lk.zones[d.zoneId]?.name || '' },
      { header: 'Licence Number', value: (d) => d.licenseNumber }, { header: 'Licence Expiry', value: (d) => d.licenseExpiry }, { header: 'Licence State', value: (d) => licenseState(d).state },
      { header: 'Status', value: (d) => d.status }, { header: 'Availability', value: (d) => d.availability }, { header: 'Vehicle', value: (d) => lk.vehicles[d.vehicleId]?.vehicleNumber || '' },
      { header: 'Current Dispatch', value: (d) => current[d.id]?.dispatchNumber || '' }, { header: 'Address', value: (d) => d.address },
    ])
    toast.success(`Exported ${n} driver${n === 1 ? '' : 's'}`)
  }

  const columns = [
    { key: 'name', header: 'Driver', sortable: true, render: (d) => (<div><p className="font-medium text-ink">{d.name}</p><p className="text-xs text-muted tabular">{d.code} · {d.mobile}</p></div>) },
    { key: 'hub', header: 'Hub / zone', sortable: true, hideBelow: 'md', render: (d) => (<div><p>{lk.hubs[d.hubId]?.name || '—'}</p><p className="text-xs text-muted">{lk.zones[d.zoneId]?.name || 'No home zone'}</p></div>) },
    { key: 'vehicle', header: 'Vehicle', hideBelow: 'lg', render: (d) => <span className="tabular whitespace-nowrap">{lk.vehicles[d.vehicleId]?.vehicleNumber || '—'}</span> },
    { key: 'license', header: 'Licence', sortable: true, hideBelow: 'sm', render: (d) => <LicenseBadge driver={d} compact /> },
    { key: 'availability', header: 'Availability', sortable: true, render: (d) => <AvailabilityBadge value={d.availability} /> },
    { key: 'dispatch', header: 'Current dispatch', hideBelow: 'xl', render: (d) => (current[d.id] ? <span className="text-xs tabular">{current[d.id].dispatchNumber}</span> : <span className="text-muted">—</span>) },
    { key: 'status', header: 'Status', sortable: true, hideBelow: 'md', render: (d) => <ActiveStatusBadge status={d.status} /> },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      render: (d) => (
        <RowActions label={`Actions for ${d.name}`} items={[
          { label: 'View', icon: Eye, to: `/dispatch/drivers/${d.id}` },
          { label: 'Edit', icon: Pencil, to: `/dispatch/drivers/${d.id}/edit`, hidden: !canManage },
          { label: 'Delete', icon: Trash2, danger: true, onClick: () => del.request(d), hidden: !canManage },
        ]} />
      ),
    },
  ]
  const zoneOptions = zones.filter((z) => !t.filters.hubId || z.hubId === t.filters.hubId).map((z) => ({ value: z.id, label: z.name }))
  const licenceIssues = drivers.filter((d) => ['Expired', 'Expiring', 'Missing'].includes(licenseState(d).state)).length
  return (
    <>
      <PageHeader title="Drivers" description="Drivers per hub, their licence validity, vehicle and availability. Only active, available drivers with a valid licence can be assigned." actions={canManage && <Button icon={Plus} to="/dispatch/drivers/create">Add driver</Button>} />
      <StatGrid cols={4}>
        <StatCard label="Drivers" value={drivers.length} icon={UserRound} tone="brand" hint={`${drivers.filter((d) => d.status === 'Active').length} active`} />
        <StatCard label="Available now" value={drivers.filter((d) => d.availability === 'Available').length} icon={UserRoundCheck} tone="success" to="/dispatch/drivers?availability=Available" />
        <StatCard label="Assigned / on delivery" value={drivers.filter((d) => ['Assigned', 'On Delivery'].includes(d.availability)).length} icon={Truck} tone="accent" to="/dispatch/assignments" />
        <StatCard label="Licence attention" value={licenceIssues} icon={ShieldAlert} tone="danger" hint="Expired or expiring within 30 days" to="/dispatch/drivers?license=Expired" />
      </StatGrid>
      <Card className="mt-6">
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search name, code, mobile, licence…" total={drivers.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Zone" allLabel="All zones" value={t.filters.zoneId} onChange={(v) => t.setFilter('zoneId', v)} options={zoneOptions} />
          <FilterSelect label="Availability" allLabel="Any availability" value={t.filters.availability} onChange={(v) => t.setFilter('availability', v)} options={DISPATCH_OPTIONS.driverAvailability} />
          <FilterSelect label="Licence" allLabel="Any licence" value={t.filters.license} onChange={(v) => t.setFilter('license', v)} options={['Valid', 'Expiring', 'Expired'].map((x) => ({ value: x, label: x }))} />
        </FilterToolbar>
        <DataTable caption="Drivers" columns={columns} rows={rows} pageSize={10} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort} onRowClick={(d) => navigate(`/dispatch/drivers/${d.id}`)}
          empty={<EmptyState icon={UserRound} title={drivers.length ? 'No drivers match these filters' : 'No drivers yet'} action={drivers.length ? <Button variant="secondary" onClick={t.reset}>Clear filters</Button> : canManage && <Button icon={Plus} to="/dispatch/drivers/create">Add driver</Button>} />} />
      </Card>
      {del.dialogs}
    </>
  )
}
