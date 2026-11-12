import { useMemo, useState } from 'react'
import { MapPinned, CheckCircle2, Route, Plus, Eye, Pencil, Trash2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import RowActions from '../../components/common/RowActions'
import Modal from '../../components/common/Modal'
import InfoList from '../../components/common/InfoList'
import Badge from '../../components/common/Badge'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { ActiveStatusBadge, DispatchStatusBadge } from '../../components/dispatch/DispatchBadges'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { useDeleteFlow } from '../../hooks/useDeleteFlow'
import { deleteZone, getZoneDeleteBlockers, searchZones, updateZone, zoneToInput } from '../../services/zoneService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { ACTIVE_DISPATCH_STATUSES, DISPATCH_OPTIONS } from '../../config/dispatchConfig'

export default function ZoneList() {
  const { zones, hubs, dispatches, customers, drivers, lk } = useDispatchData()
  const canManage = usePermission('fleet.manage')
  const t = useTableQuery({ filters: ['hubId', 'status', 'city'], sort: 'name' })
  const [viewing, setViewing] = useState(null)

  const active = useMemo(() => Object.fromEntries(zones.map((z) => [z.id, dispatches.filter((d) => d.zoneId === z.id && ACTIVE_DISPATCH_STATUSES.includes(d.status))])), [zones, dispatches])
  const counts = useMemo(() => Object.fromEntries(zones.map((z) => [z.id, { customers: customers.filter((c) => c.zoneId === z.id).length, drivers: drivers.filter((d) => d.zoneId === z.id).length }])), [zones, customers, drivers])
  const filtered = useMemo(() => searchZones(t.q, t.filters, zones), [zones, t.q, t.filters])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, { hub: (z) => lk.hubs[z.hubId]?.name, active: (z) => active[z.id]?.length ?? 0, pincodes: (z) => z.pincodes.length }), [filtered, t.sort, t.dir, lk, active])

  const del = useDeleteFlow({
    entity: 'zone', getBlockers: getZoneDeleteBlockers, remove: deleteZone, formatReason: (r) => `This zone ${r}.`,
    alternative: canManage && {
      label: 'Mark as Inactive',
      suggestion: 'Inactive zones keep their history but cannot receive new dispatches.',
      run: (z) => {
        const res = updateZone(z.id, { ...zoneToInput(z), status: 'Inactive' })
        if (res.ok) toast.success(`${z.name} marked Inactive`)
        else toast.error(Object.values(res.errors)[0])
      },
    },
  })

  const onExport = () => {
    const n = downloadCsv(csvFilename('dispatch-zones'), rows, [
      { header: 'Zone ID', value: (z) => z.id }, { header: 'Zone Code', value: (z) => z.code }, { header: 'Zone Name', value: (z) => z.name },
      { header: 'Description', value: (z) => z.description }, { header: 'Zone Manager', value: (z) => z.managerName }, { header: 'Hub', value: (z) => lk.hubs[z.hubId]?.name },
      { header: 'Status', value: (z) => z.status }, { header: 'City', value: (z) => z.city }, { header: 'State', value: (z) => z.state },
      { header: 'Pincodes', value: (z) => z.pincodes.join(' ') }, { header: 'Delivery Area', value: (z) => z.deliveryArea },
      { header: 'Active Dispatches', value: (z) => active[z.id]?.length ?? 0 }, { header: 'Customers', value: (z) => counts[z.id]?.customers ?? 0 }, { header: 'Notes', value: (z) => z.notes },
    ])
    toast.success(`Exported ${n} zone${n === 1 ? '' : 's'}`)
  }

  const columns = [
    { key: 'name', header: 'Zone', sortable: true, render: (z) => (<div><p className="font-medium text-ink">{z.name}</p><p className="text-xs text-muted tabular">{z.code}</p></div>) },
    { key: 'hub', header: 'Hub', sortable: true, hideBelow: 'md', render: (z) => lk.hubs[z.hubId]?.name || '—' },
    { key: 'city', header: 'City', sortable: true, hideBelow: 'lg', render: (z) => z.city },
    { key: 'managerName', header: 'Manager', sortable: true, hideBelow: 'xl', render: (z) => z.managerName || '—' },
    { key: 'pincodes', header: 'Pincodes', sortable: true, hideBelow: 'sm', render: (z) => <span className="text-xs text-muted tabular">{z.pincodes.slice(0, 3).join(', ')}{z.pincodes.length > 3 ? ` +${z.pincodes.length - 3}` : ''}</span> },
    { key: 'active', header: 'Active dispatches', align: 'right', sortable: true, hideBelow: 'md', render: (z) => (active[z.id]?.length ? <Badge tone="brand">{active[z.id].length}</Badge> : <span className="text-muted">0</span>) },
    { key: 'status', header: 'Status', sortable: true, render: (z) => <ActiveStatusBadge status={z.status} /> },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      render: (z) => (
        <RowActions label={`Actions for ${z.name}`} items={[
          { label: 'View', icon: Eye, onClick: () => setViewing(z) },
          { label: 'Edit', icon: Pencil, to: `/dispatch/zones/${z.id}/edit`, hidden: !canManage },
          { label: 'Delete', icon: Trash2, danger: true, onClick: () => del.request(z), hidden: !canManage },
        ]} />
      ),
    },
  ]

  const cities = [...new Set(zones.map((z) => z.city))].sort().map((c) => ({ value: c, label: c }))
  const viewZone = viewing && zones.find((z) => z.id === viewing.id)
  return (
    <>
      <PageHeader title="Dispatch zones" description="Delivery zones per hub with the pincodes they cover. Inactive zones cannot receive new dispatches." actions={canManage && <Button icon={Plus} to="/dispatch/zones/create">Add zone</Button>} />
      <StatGrid cols={4}>
        <StatCard label="Zones" value={zones.length} icon={MapPinned} tone="brand" hint={`${new Set(zones.map((z) => z.hubId)).size} hubs`} />
        <StatCard label="Active zones" value={zones.filter((z) => z.status === 'Active').length} icon={CheckCircle2} tone="success" to="/dispatch/zones?status=Active" />
        <StatCard label="Pincodes covered" value={zones.reduce((s, z) => s + z.pincodes.length, 0)} icon={MapPin} tone="info" />
        <StatCard label="Active dispatches" value={Object.values(active).reduce((s, a) => s + a.length, 0)} icon={Route} tone="accent" to="/dispatch/planning" />
      </StatGrid>
      <Card className="mt-6">
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search zone, code, pincode, area…" total={zones.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={DISPATCH_OPTIONS.zoneStatuses} />
          <FilterSelect label="City" allLabel="All cities" value={t.filters.city} onChange={(v) => t.setFilter('city', v)} options={cities} />
        </FilterToolbar>
        <DataTable caption="Dispatch zones" columns={columns} rows={rows} pageSize={10} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort}
          onRowClick={(z) => setViewing(z)}
          empty={<EmptyState icon={MapPinned} title={zones.length ? 'No zones match these filters' : 'No zones yet'} action={zones.length ? <Button variant="secondary" onClick={t.reset}>Clear filters</Button> : canManage && <Button icon={Plus} to="/dispatch/zones/create">Add zone</Button>} />} />
      </Card>
      <Modal open={Boolean(viewZone)} onClose={() => setViewing(null)} size="lg" icon={MapPinned} title={viewZone?.name} description={viewZone && `${viewZone.code} · ${lk.hubs[viewZone.hubId]?.name || ''}`}
        footer={<><Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>{canManage && viewZone && <Button icon={Pencil} to={`/dispatch/zones/${viewZone.id}/edit`}>Edit zone</Button>}</>}>
        {viewZone && (
          <div className="space-y-5">
            <InfoList columns={2} items={[
              { label: 'Status', value: <ActiveStatusBadge status={viewZone.status} /> },
              { label: 'Zone manager', value: viewZone.managerName },
              { label: 'City', value: viewZone.city }, { label: 'State', value: viewZone.state },
              { label: 'Delivery area', value: viewZone.deliveryArea, span: 2 },
              { label: 'Pincodes', value: <span className="flex flex-wrap gap-1">{viewZone.pincodes.map((p) => <Badge key={p}>{p}</Badge>)}</span>, span: 2 },
              { label: 'Description', value: viewZone.description, span: 2 },
              { label: 'Customers', value: counts[viewZone.id]?.customers ?? 0 }, { label: 'Home-zone drivers', value: counts[viewZone.id]?.drivers ?? 0 },
              { label: 'Notes', value: viewZone.notes, span: 2 },
            ]} />
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Active dispatches</p>
              {active[viewZone.id]?.length ? (
                <ul className="space-y-1.5">{active[viewZone.id].map((d) => <li key={d.id} className="flex items-center justify-between gap-2 text-sm"><Button variant="link" to={`/dispatch/${d.id}`}>{d.dispatchNumber}</Button><DispatchStatusBadge status={d.status} /></li>)}</ul>
              ) : <p className="text-sm text-muted">None.</p>}
            </div>
          </div>
        )}
      </Modal>
      {del.dialogs}
    </>
  )
}
