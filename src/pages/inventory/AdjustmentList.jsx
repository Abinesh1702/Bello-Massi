import { useMemo, useState } from 'react'
import { SlidersHorizontal, ShieldAlert, SearchX, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import DocumentList from '../../components/inventory/DocumentList'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import InfoList from '../../components/common/InfoList'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { useMasterData } from '../../hooks/useMasterData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { adjustmentEffect } from '../../services/inventoryService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { OPTIONS } from '../../config/masterData'
import { formatDate, formatDateTime, formatNumber } from '../../utils/formatters'

const TYPE_TONE = { Increase: 'success', Decrease: 'warning', Damaged: 'danger', Lost: 'danger', Correction: 'info' }

export default function AdjustmentList() {
  const { adjustments, hubs, lookups } = useMasterData()
  const canCreate = usePermission('inventory.adjustments.manage')
  const t = useTableQuery({ filters: ['type', 'hubId', 'reason'], sort: 'adjustmentDate', dir: 'desc' })
  const [selected, setSelected] = useState(null)
  const name = (id, map) => map[id]?.name || 'Deleted'
  const signed = (a) => (adjustmentEffect(a.type, a.direction, a.quantity)?.reducesAvailable ? '−' : '+')

  const filtered = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    return adjustments.filter((a) => {
      if (q && ![a.adjustmentNumber, a.notes, a.reason, lookups.products[a.productId]?.name].some((v) => String(v || '').toLowerCase().includes(q))) return false
      if (t.filters.type && a.type !== t.filters.type) return false
      if (t.filters.hubId && a.hubId !== t.filters.hubId) return false
      if (t.filters.reason && a.reason !== t.filters.reason) return false
      return true
    })
  }, [adjustments, t.q, t.filters, lookups])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, { product: (a) => name(a.productId, lookups.products), adjustmentDate: (a) => a.createdAt }), [filtered, t.sort, t.dir, lookups])
  const count = (...types) => adjustments.filter((a) => types.includes(a.type)).length

  const onExport = () => {
    const n = downloadCsv(csvFilename('stock-adjustments'), rows, [
      { header: 'Adjustment Number', value: (a) => a.adjustmentNumber }, { header: 'Date', value: (a) => a.adjustmentDate }, { header: 'Type', value: (a) => a.type },
      { header: 'Direction', value: (a) => a.direction || '' }, { header: 'Hub', value: (a) => name(a.hubId, lookups.hubs) }, { header: 'Product', value: (a) => name(a.productId, lookups.products) },
      { header: 'Quantity', value: (a) => a.quantity }, { header: 'Reason', value: (a) => a.reason }, { header: 'Notes', value: (a) => a.notes },
      { header: 'Created By', value: (a) => lookups.people[a.createdBy]?.name || '' },
    ])
    toast.success(`Exported ${n} adjustments`)
  }

  return (
    <DocumentList
      title="Stock adjustments"
      description="Corrections for damage, loss, expiry and counting differences — each with a reason and the user who made it."
      canCreate={canCreate}
      createTo="/inventory/stock-adjustments/create"
      createLabel="New adjustment"
      kpis={
        <StatGrid cols={4}>
          <StatCard label="All adjustments" value={adjustments.length} icon={SlidersHorizontal} tone="brand" />
          <StatCard label="Increases" value={count('Increase')} icon={Plus} tone="success" to="/inventory/stock-adjustments?type=Increase" />
          <StatCard label="Decreases & corrections" value={count('Decrease', 'Correction')} icon={Minus} tone="warning" />
          <StatCard label="Damaged / lost" value={count('Damaged', 'Lost')} icon={ShieldAlert} tone="danger" />
        </StatGrid>
      }
    >
      <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search adjustment no., product, notes…" total={adjustments.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
        <FilterSelect label="Type" allLabel="All types" value={t.filters.type} onChange={(v) => t.setFilter('type', v)} options={OPTIONS.adjustmentTypes} />
        <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
        <FilterSelect label="Reason" allLabel="All reasons" value={t.filters.reason} onChange={(v) => t.setFilter('reason', v)} options={OPTIONS.adjustmentReasons} />
      </FilterToolbar>
      <DataTable caption="Stock adjustments" rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort} onRowClick={setSelected}
        columns={[
          { key: 'adjustmentNumber', header: 'Adjustment', sortable: true, render: (a) => (<div><p className="font-medium tabular">{a.adjustmentNumber}</p><p className="text-xs text-muted">{formatDate(a.adjustmentDate)}</p></div>) },
          { key: 'product', header: 'Product', sortable: true, render: (a) => (<div className="min-w-0"><p className="truncate max-w-[200px]">{name(a.productId, lookups.products)}</p><p className="text-xs text-muted">{name(a.hubId, lookups.hubs)}</p></div>) },
          { key: 'type', header: 'Type', sortable: true, render: (a) => <Badge tone={TYPE_TONE[a.type]}>{a.type === 'Correction' ? `Correction ${a.direction === 'increase' ? '+' : '−'}` : a.type}</Badge> },
          { key: 'quantity', header: 'Qty', align: 'right', sortable: true, render: (a) => <span className="font-semibold tabular">{signed(a)}{formatNumber(a.quantity)}</span> },
          { key: 'reason', header: 'Reason', sortable: true, hideBelow: 'md', render: (a) => <span className="text-muted">{a.reason}</span> },
          { key: 'by', header: 'By', hideBelow: 'lg', render: (a) => <span className="text-muted">{lookups.people[a.createdBy]?.name || '—'}</span> },
        ]}
        empty={<EmptyState icon={SearchX} title="No adjustments match" action={canCreate && <Button icon={SlidersHorizontal} to="/inventory/stock-adjustments/create">New adjustment</Button>} />}
      />
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.adjustmentNumber || ''} description="Stock adjustment" footer={<Button onClick={() => setSelected(null)}>Close</Button>}>
        {selected && <InfoList items={[
          { label: 'Date', value: formatDate(selected.adjustmentDate) },
          { label: 'Type', value: <Badge tone={TYPE_TONE[selected.type]}>{selected.type}{selected.direction ? ` (${selected.direction})` : ''}</Badge> },
          { label: 'Hub', value: name(selected.hubId, lookups.hubs) },
          { label: 'Product', value: name(selected.productId, lookups.products) },
          { label: 'Quantity', value: `${signed(selected)}${formatNumber(selected.quantity)} ${lookups.products[selected.productId]?.unit || ''}` },
          { label: 'Reason', value: selected.reason },
          { label: 'Created by', value: lookups.people[selected.createdBy]?.name },
          { label: 'Recorded at', value: formatDateTime(selected.createdAt) },
          { label: 'Notes', value: selected.notes, span: 2 },
        ]} />}
      </Modal>
    </DocumentList>
  )
}
