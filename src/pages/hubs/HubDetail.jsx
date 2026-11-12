import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Boxes, IndianRupee, AlertTriangle, Package, UserRound, Phone, Mail, MapPin, Clock, History, ArrowRightLeft, PackagePlus } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import InfoList from '../../components/common/InfoList'
import Timeline from '../../components/common/Timeline'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { SearchInput, FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { HubStatusBadge } from '../../components/masterdata/Badges'
import MovementTable from '../../components/inventory/MovementTable'
import StockByHubTable from '../../components/inventory/StockByHubTable'
import { useMasterData } from '../../hooks/useMasterData'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { useDeleteFlow } from '../../hooks/useDeleteFlow'
import { deleteHub, formatHubAddress, getHubById, getHubDeleteBlockers } from '../../services/hubService'
import { filterStockRows, getHubStockSummary } from '../../services/inventoryService'
import { hubDeleteAlternative } from './HubList'
import { STORAGE_KEYS } from '../../utils/constants'
import { OPTIONS } from '../../config/masterData'
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/formatters'

export default function HubDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hubs, stockRows, movements, lookups, customers } = useMasterData()
  const activities = useStoredValue(STORAGE_KEYS.ACTIVITIES, [])
  const canManage = usePermission('hubs.manage')
  const canSeeMoves = usePermission('inventory.movements.view')
  const canStock = usePermission('inventory.receipts.manage')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const hub = getHubById(id, hubs)

  const del = useDeleteFlow({ entity: 'hub', getBlockers: getHubDeleteBlockers, remove: deleteHub, formatReason: (r) => `This hub ${r}.`, onDeleted: () => navigate('/hubs', { replace: true }), alternative: hubDeleteAlternative(canManage) })

  const lines = useMemo(() => stockRows.filter((r) => r.hubId === id), [stockRows, id])
  const shown = useMemo(() => filterStockRows(lines, q, { status }), [lines, q, status])
  const moves = useMemo(() => movements.filter((m) => m.hubId === id), [movements, id])
  const timeline = useMemo(() => activities.filter((a) => a.entityType === 'hub' && a.entityId === id)
    .map((a) => ({ id: a.id, title: `${a.actorName} ${a.message}`, at: a.createdAt, icon: Pencil }))
    .concat(hub ? [{ id: 'created', title: 'Hub created', at: hub.createdAt, icon: PackagePlus }] : [])
    .sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 10), [activities, id, hub])

  if (!hub) return <NotFoundRecord entity="hub" backTo="/hubs" backLabel="Back to hubs" />
  const s = getHubStockSummary(lines, [hub])[0]

  return (
    <>
      <PageHeader
        title={hub.name}
        description={`${hub.code} · ${hub.hubType}`}
        actions={
          <>
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>Back</Button>
            {canManage && <Button variant="danger-outline" icon={Trash2} onClick={() => del.request(hub)}>Delete</Button>}
            {canManage && <Button icon={Pencil} to={`/hubs/${id}/edit`}>Edit</Button>}
          </>
        }
      />
      {hub.status === 'Inactive' && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          <AlertTriangle size={17} className="shrink-0 text-warning mt-0.5" /> This hub is inactive. It cannot receive stock or new orders. {s.quantity > 0 && 'Transfer the remaining stock to another hub before deleting it.'}
        </div>
      )}
      <StatGrid cols={4}>
        <StatCard label="Products in stock" value={s.products} icon={Package} tone="brand" hint={`${s.lines} stock lines`} />
        <StatCard label="Total quantity" value={formatNumber(s.quantity)} icon={Boxes} tone="info" hint={`${formatNumber(s.available)} available · ${formatNumber(s.reserved)} reserved`} />
        <StatCard label="Stock valuation" value={formatCurrency(s.value)} icon={IndianRupee} tone="accent" hint="At purchase price" />
        <StatCard label="Low stock" value={s.low + s.out} icon={AlertTriangle} tone={s.out ? 'danger' : 'warning'} to={`/inventory/low-stock?hubId=${id}`} hint={`${s.out} out of stock`} />
      </StatGrid>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Hub stock"
              subtitle="Stock by product at this hub"
              icon={Boxes}
              action={canStock && hub.status === 'Active' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" icon={PackagePlus} to={`/inventory/stock-receipts/create?hubId=${id}`}>Receive</Button>
                  <Button size="sm" variant="secondary" icon={ArrowRightLeft} to={`/inventory/stock-transfers/create?sourceHubId=${id}`}>Transfer out</Button>
                </div>
              )}
            />
            <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px]">
              <SearchInput value={q} onChange={setQ} placeholder="Search products at this hub…" />
              <FilterSelect label="Stock status" allLabel="All stock statuses" value={status} onChange={setStatus} options={OPTIONS.stockStatuses} />
            </div>
            <StockByHubTable rows={shown} mode="product" pageSize={10} />
          </Card>
          {canSeeMoves && (
            <Card>
              <CardHeader title="Recent movements" subtitle={`${moves.length} movements at this hub`} icon={History} />
              <MovementTable rows={moves} lookups={lookups} showHub={false} pageSize={8} dense />
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Hub manager" icon={UserRound} action={<HubStatusBadge status={hub.status} />} />
            <p className="font-semibold text-ink">{hub.managerName}</p>
            <div className="mt-3 space-y-2 text-sm">
              <a href={`tel:${hub.contactNumber.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-brand"><Phone size={15} className="text-muted" /> {hub.contactNumber}</a>
              {hub.email && <a href={`mailto:${hub.email}`} className="flex items-center gap-2 hover:text-brand truncate"><Mail size={15} className="text-muted" /> {hub.email}</a>}
              <p className="flex items-center gap-2"><Clock size={15} className="text-muted" /> {hub.operatingHours || '—'}</p>
            </div>
          </Card>
          <Card>
            <CardHeader title="Location" icon={MapPin} />
            <p className="text-sm text-ink">{formatHubAddress(hub)}</p>
            <InfoList className="mt-4" items={[
              { label: 'City', value: hub.city },
              { label: 'State', value: hub.state },
              { label: 'Pincode', value: hub.pincode },
              { label: 'Country', value: hub.country },
              { label: 'Pallet positions', value: formatNumber(hub.capacityPallets) },
              { label: 'Cold rooms', value: hub.coldRooms },
              { label: 'Customers (preferred)', value: <Badge tone="brand">{customers.filter((c) => c.hubId === id).length}</Badge> },
              { label: 'Updated', value: formatDateTime(hub.updatedAt) },
              { label: 'Notes', value: hub.notes, span: 2 },
            ]} />
          </Card>
          <Card>
            <CardHeader title="Activity" icon={History} />
            <Timeline items={timeline} />
          </Card>
        </div>
      </div>
      {del.dialogs}
    </>
  )
}
