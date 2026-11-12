import { useMemo } from 'react'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import MovementTable from '../../components/inventory/MovementTable'
import { useMasterData } from '../../hooks/useMasterData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { filterMovements, movementSign } from '../../services/inventoryService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { OPTIONS } from '../../config/masterData'

export default function MovementList() {
  const { movements, hubs, products, lookups } = useMasterData()
  const t = useTableQuery({ filters: ['hubId', 'productId', 'type', 'from', 'to'], sort: 'date', dir: 'desc' })
  const filtered = useMemo(() => filterMovements(movements, t.q, t.filters, lookups), [movements, t.q, t.filters, lookups])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, {
    product: (m) => lookups.products[m.productId]?.name || '', hub: (m) => lookups.hubs[m.hubId]?.name || '', type: (m) => m.movementType, reference: (m) => m.referenceNumber,
  }), [filtered, t.sort, t.dir, lookups])

  const onExport = () => {
    const n = downloadCsv(csvFilename('stock-movements'), rows, [
      { header: 'Movement ID', value: (m) => m.id }, { header: 'Movement Number', value: (m) => m.movementNumber }, { header: 'Date', value: (m) => m.date },
      { header: 'Product Code', value: (m) => lookups.products[m.productId]?.code || '' }, { header: 'Product', value: (m) => lookups.products[m.productId]?.name || 'Deleted product' },
      { header: 'Hub', value: (m) => lookups.hubs[m.hubId]?.name || 'Deleted hub' }, { header: 'Movement Type', value: (m) => m.movementType },
      { header: 'Quantity', value: (m) => movementSign(m) * m.quantity }, { header: 'Previous Quantity', value: (m) => m.previousQuantity }, { header: 'New Quantity', value: (m) => m.newQuantity },
      { header: 'Previous Available', value: (m) => m.previousAvailable }, { header: 'New Available', value: (m) => m.newAvailable },
      { header: 'Reference Number', value: (m) => m.referenceNumber }, { header: 'Created By', value: (m) => lookups.people[m.createdBy]?.name || 'System' }, { header: 'Notes', value: (m) => m.notes },
    ])
    toast.success(`Exported ${n} movements`)
  }

  return (
    <>
      <PageHeader title="Stock movements" description="The complete stock ledger. Every receipt, transfer and adjustment is recorded here." actions={<span className="inline-flex items-center gap-1.5 text-xs text-muted"><Lock size={13} /> Read-only ledger</span>} />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search movement no., reference, product, notes…" total={movements.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Movement type" allLabel="All types" value={t.filters.type} onChange={(v) => t.setFilter('type', v)} options={OPTIONS.movementTypes} />
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Product" allLabel="All products" value={t.filters.productId} onChange={(v) => t.setFilter('productId', v)} options={products.filter((p) => p.trackInventory).map((p) => ({ value: p.id, label: p.name }))} />
          <FilterInput label="From date" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} />
          <FilterInput label="To date" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} />
        </FilterToolbar>
        <MovementTable rows={rows} lookups={lookups} pageSize={15} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort} />
      </Card>
    </>
  )
}
