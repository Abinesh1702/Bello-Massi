import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, FileClock, CheckCircle2, XCircle, Eye, Pencil, Check, X, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import DocumentList from '../../components/inventory/DocumentList'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import InfoList from '../../components/common/InfoList'
import RowActions from '../../components/common/RowActions'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { TransferStatusBadge } from '../../components/masterdata/Badges'
import { useMasterData } from '../../hooks/useMasterData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { cancelTransfer, completeTransfer } from '../../services/inventoryService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { OPTIONS, TRANSFER_STATUS as TS } from '../../config/masterData'
import { formatDate, formatDateTime, formatNumber } from '../../utils/formatters'

export default function TransferList() {
  const navigate = useNavigate()
  const { transfers, hubs, lookups } = useMasterData()
  const canManage = usePermission('inventory.transfers.manage')
  const t = useTableQuery({ filters: ['status', 'sourceHubId', 'destinationHubId'], sort: 'transferDate', dir: 'desc' })
  const [selected, setSelected] = useState(null)
  const [action, setAction] = useState(null) // { kind: 'complete'|'cancel', transfer }
  const [busy, setBusy] = useState(false)
  const name = (id, map) => map[id]?.name || 'Deleted'

  const filtered = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    return transfers.filter((x) => {
      if (q && ![x.transferNumber, x.notes, lookups.products[x.productId]?.name].some((v) => String(v || '').toLowerCase().includes(q))) return false
      if (t.filters.status && x.status !== t.filters.status) return false
      if (t.filters.sourceHubId && x.sourceHubId !== t.filters.sourceHubId) return false
      if (t.filters.destinationHubId && x.destinationHubId !== t.filters.destinationHubId) return false
      return true
    })
  }, [transfers, t.q, t.filters, lookups])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, { product: (x) => name(x.productId, lookups.products), transferDate: (x) => x.createdAt }), [filtered, t.sort, t.dir, lookups])
  const count = (s) => transfers.filter((x) => x.status === s).length

  const run = () => {
    setBusy(true)
    const res = action.kind === 'complete' ? completeTransfer(action.transfer.id) : cancelTransfer(action.transfer.id)
    setBusy(false)
    setAction(null)
    setSelected(null)
    if (!res.ok) return toast.error(res.error)
    toast.success(action.kind === 'complete' ? `${res.record.transferNumber} completed — stock moved` : `${res.record.transferNumber} cancelled — no stock moved`)
  }

  const onExport = () => {
    const n = downloadCsv(csvFilename('stock-transfers'), rows, [
      { header: 'Transfer Number', value: (x) => x.transferNumber }, { header: 'Transfer Date', value: (x) => x.transferDate }, { header: 'Status', value: (x) => x.status },
      { header: 'Source Hub', value: (x) => name(x.sourceHubId, lookups.hubs) }, { header: 'Destination Hub', value: (x) => name(x.destinationHubId, lookups.hubs) },
      { header: 'Product', value: (x) => name(x.productId, lookups.products) }, { header: 'Quantity', value: (x) => x.quantity }, { header: 'Notes', value: (x) => x.notes },
      { header: 'Completed At', value: (x) => x.completedAt || '' }, { header: 'Cancelled At', value: (x) => x.cancelledAt || '' },
    ])
    toast.success(`Exported ${n} transfers`)
  }

  const actionsFor = (x) => [
    { label: 'View', icon: Eye, onClick: () => setSelected(x) },
    { label: 'Edit draft', icon: Pencil, to: `/inventory/stock-transfers/create?edit=${x.id}`, hidden: !canManage || x.status !== TS.DRAFT },
    { label: 'Complete', icon: Check, onClick: () => setAction({ kind: 'complete', transfer: x }), hidden: !canManage || x.status !== TS.DRAFT },
    { label: 'Cancel', icon: X, danger: true, onClick: () => setAction({ kind: 'cancel', transfer: x }), hidden: !canManage || x.status !== TS.DRAFT },
  ]

  return (
    <DocumentList
      title="Stock transfers"
      description="Move stock between hubs. Only completed transfers change stock."
      canCreate={canManage}
      createTo="/inventory/stock-transfers/create"
      createLabel="New transfer"
      kpis={
        <StatGrid cols={4}>
          <StatCard label="All transfers" value={transfers.length} icon={ArrowRightLeft} tone="brand" />
          <StatCard label="Drafts" value={count(TS.DRAFT)} icon={FileClock} tone="warning" to={`/inventory/stock-transfers?status=${TS.DRAFT}`} hint="Awaiting completion" />
          <StatCard label="Completed" value={count(TS.COMPLETED)} icon={CheckCircle2} tone="success" to={`/inventory/stock-transfers?status=${TS.COMPLETED}`} hint="Stock moved" />
          <StatCard label="Cancelled" value={count(TS.CANCELLED)} icon={XCircle} tone="neutral" to={`/inventory/stock-transfers?status=${TS.CANCELLED}`} hint="No stock effect" />
        </StatGrid>
      }
    >
      <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search transfer no., product, notes…" total={transfers.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
        <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={OPTIONS.transferStatuses} />
        <FilterSelect label="Source hub" allLabel="Any source" value={t.filters.sourceHubId} onChange={(v) => t.setFilter('sourceHubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
        <FilterSelect label="Destination hub" allLabel="Any destination" value={t.filters.destinationHubId} onChange={(v) => t.setFilter('destinationHubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
      </FilterToolbar>
      <DataTable caption="Stock transfers" rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort} onRowClick={setSelected}
        columns={[
          { key: 'transferNumber', header: 'Transfer', sortable: true, render: (x) => (<div><p className="font-medium tabular">{x.transferNumber}</p><p className="text-xs text-muted">{formatDate(x.transferDate)}</p></div>) },
          { key: 'product', header: 'Product', sortable: true, render: (x) => <span className="truncate block max-w-[200px]">{name(x.productId, lookups.products)}</span> },
          { key: 'route', header: 'Route', hideBelow: 'md', render: (x) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{lookups.hubs[x.sourceHubId]?.city || '—'} <ArrowRight size={13} className="text-muted" /> {lookups.hubs[x.destinationHubId]?.city || '—'}</span> },
          { key: 'quantity', header: 'Qty', align: 'right', sortable: true, render: (x) => <span className="font-semibold tabular">{formatNumber(x.quantity)} <span className="text-xs font-normal text-muted">{lookups.products[x.productId]?.unit}</span></span> },
          { key: 'status', header: 'Status', sortable: true, render: (x) => <TransferStatusBadge status={x.status} /> },
          { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (x) => <RowActions label={`Actions for ${x.transferNumber}`} items={actionsFor(x)} /> },
        ]}
        empty={<EmptyState icon={ArrowRightLeft} title="No transfers match" action={canManage && <Button icon={ArrowRightLeft} to="/inventory/stock-transfers/create">New transfer</Button>} />}
      />

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.transferNumber || ''} description="Stock transfer"
        footer={selected && (
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            {canManage && selected.status === TS.DRAFT && (
              <>
                <Button variant="danger-outline" onClick={() => setAction({ kind: 'cancel', transfer: selected })}>Cancel transfer</Button>
                <Button variant="secondary" onClick={() => navigate(`/inventory/stock-transfers/create?edit=${selected.id}`)}>Edit</Button>
                <Button onClick={() => setAction({ kind: 'complete', transfer: selected })}>Complete</Button>
              </>
            )}
          </>
        )}>
        {selected && (
          <div className="space-y-4">
            <TransferStatusBadge status={selected.status} />
            <InfoList items={[
              { label: 'Transfer date', value: formatDate(selected.transferDate) },
              { label: 'Product', value: name(selected.productId, lookups.products) },
              { label: 'From', value: name(selected.sourceHubId, lookups.hubs) },
              { label: 'To', value: name(selected.destinationHubId, lookups.hubs) },
              { label: 'Quantity', value: `${formatNumber(selected.quantity)} ${lookups.products[selected.productId]?.unit || ''}` },
              { label: 'Created by', value: lookups.people[selected.createdBy]?.name },
              { label: 'Completed', value: selected.completedAt ? formatDateTime(selected.completedAt) : '' },
              { label: 'Cancelled', value: selected.cancelledAt ? formatDateTime(selected.cancelledAt) : '' },
              { label: 'Notes', value: selected.notes, span: 2 },
            ]} />
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(action)}
        onClose={() => setAction(null)}
        onConfirm={run}
        loading={busy}
        tone={action?.kind === 'cancel' ? 'danger' : 'primary'}
        title={action?.kind === 'complete' ? `Complete ${action?.transfer.transferNumber}?` : `Cancel ${action?.transfer.transferNumber}?`}
        description={action?.kind === 'complete'
          ? 'Available stock at the source is checked now. Stock moves immediately and cannot be reversed by cancelling.'
          : 'The draft will be cancelled. No stock will move.'}
        confirmLabel={action?.kind === 'complete' ? 'Complete transfer' : 'Cancel transfer'}
        cancelLabel="Keep draft"
      />
    </DocumentList>
  )
}
