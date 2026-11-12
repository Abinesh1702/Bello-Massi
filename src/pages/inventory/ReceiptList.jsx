import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { PackagePlus, CalendarDays, Boxes } from 'lucide-react'
import { toast } from 'sonner'
import DocumentList from '../../components/inventory/DocumentList'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import InfoList from '../../components/common/InfoList'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { useMasterData } from '../../hooks/useMasterData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { formatDate, formatDateTime, formatNumber } from '../../utils/formatters'

export default function ReceiptList() {
  const { receipts, hubs, products, lookups } = useMasterData()
  const canCreate = usePermission('inventory.receipts.manage')
  const t = useTableQuery({ filters: ['hubId', 'productId', 'from', 'to'], sort: 'receiptDate', dir: 'desc' })
  const [selected, setSelected] = useState(null)
  const name = (id, map) => map[id]?.name || 'Deleted'

  const filtered = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    return receipts.filter((r) => {
      if (q && ![r.receiptNumber, r.referenceNumber, r.notes, lookups.products[r.productId]?.name, lookups.hubs[r.hubId]?.name].some((x) => String(x || '').toLowerCase().includes(q))) return false
      if (t.filters.hubId && r.hubId !== t.filters.hubId) return false
      if (t.filters.productId && r.productId !== t.filters.productId) return false
      if (t.filters.from && r.receiptDate < t.filters.from) return false
      if (t.filters.to && r.receiptDate > t.filters.to) return false
      return true
    })
  }, [receipts, t.q, t.filters, lookups])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, { product: (r) => name(r.productId, lookups.products), hub: (r) => name(r.hubId, lookups.hubs), receiptDate: (r) => r.createdAt }), [filtered, t.sort, t.dir, lookups])
  const last30 = receipts.filter((r) => dayjs(r.receiptDate).isAfter(dayjs().subtract(30, 'day')))

  const onExport = () => {
    const n = downloadCsv(csvFilename('stock-receipts'), rows, [
      { header: 'Receipt Number', value: (r) => r.receiptNumber }, { header: 'Receipt Date', value: (r) => r.receiptDate },
      { header: 'Hub', value: (r) => name(r.hubId, lookups.hubs) }, { header: 'Product Code', value: (r) => lookups.products[r.productId]?.code || '' },
      { header: 'Product', value: (r) => name(r.productId, lookups.products) }, { header: 'Quantity', value: (r) => r.quantity },
      { header: 'Unit', value: (r) => lookups.products[r.productId]?.unit || '' }, { header: 'Reference', value: (r) => r.referenceNumber },
      { header: 'Notes', value: (r) => r.notes }, { header: 'Created By', value: (r) => lookups.people[r.createdBy]?.name || '' },
    ])
    toast.success(`Exported ${n} receipts`)
  }

  return (
    <DocumentList
      title="Stock receipts"
      description="Goods received at hubs (GRN). Each receipt increases stock and creates a movement."
      canCreate={canCreate}
      createTo="/inventory/stock-receipts/create"
      createLabel="New receipt"
      kpis={
        <StatGrid cols={3}>
          <StatCard label="Total receipts" value={receipts.length} icon={PackagePlus} tone="brand" />
          <StatCard label="Last 30 days" value={last30.length} icon={CalendarDays} tone="info" hint={`${new Set(last30.map((r) => r.productId)).size} products`} />
          <StatCard label="Units received (30 days)" value={formatNumber(last30.reduce((s, r) => s + r.quantity, 0))} icon={Boxes} tone="success" hint="Mixed units" />
        </StatGrid>
      }
    >
      <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search receipt no., reference, product…" total={receipts.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
        <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
        <FilterSelect label="Product" allLabel="All products" value={t.filters.productId} onChange={(v) => t.setFilter('productId', v)} options={products.filter((p) => p.trackInventory).map((p) => ({ value: p.id, label: p.name }))} />
        <FilterInput label="From date" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} />
        <FilterInput label="To date" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} />
      </FilterToolbar>
      <DataTable caption="Stock receipts" rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort} onRowClick={setSelected}
        columns={[
          { key: 'receiptNumber', header: 'Receipt', sortable: true, render: (r) => (<div><p className="font-medium tabular">{r.receiptNumber}</p><p className="text-xs text-muted">{formatDate(r.receiptDate)}</p></div>) },
          { key: 'product', header: 'Product', sortable: true, render: (r) => <span className="truncate block max-w-[220px]">{name(r.productId, lookups.products)}</span> },
          { key: 'hub', header: 'Hub', sortable: true, hideBelow: 'md', render: (r) => name(r.hubId, lookups.hubs) },
          { key: 'quantity', header: 'Qty', align: 'right', sortable: true, render: (r) => <span className="font-semibold text-success">+{formatNumber(r.quantity)} <span className="text-xs font-normal text-muted">{lookups.products[r.productId]?.unit}</span></span> },
          { key: 'referenceNumber', header: 'Reference', sortable: true, hideBelow: 'lg', render: (r) => <span className="tabular text-muted">{r.referenceNumber || '—'}</span> },
          { key: 'by', header: 'By', hideBelow: 'xl', render: (r) => <span className="text-muted">{lookups.people[r.createdBy]?.name || '—'}</span> },
        ]}
        empty={<EmptyState icon={PackagePlus} title="No receipts match" action={canCreate && <Button icon={PackagePlus} to="/inventory/stock-receipts/create">New receipt</Button>} />}
      />
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.receiptNumber || ''} description="Stock receipt" footer={<Button onClick={() => setSelected(null)}>Close</Button>}>
        {selected && <InfoList items={[
          { label: 'Receipt date', value: formatDate(selected.receiptDate) },
          { label: 'Status', value: selected.status },
          { label: 'Hub', value: name(selected.hubId, lookups.hubs) },
          { label: 'Product', value: name(selected.productId, lookups.products) },
          { label: 'Quantity', value: `${formatNumber(selected.quantity)} ${lookups.products[selected.productId]?.unit || ''}` },
          { label: 'Reference', value: selected.referenceNumber },
          { label: 'Created by', value: lookups.people[selected.createdBy]?.name },
          { label: 'Recorded at', value: formatDateTime(selected.createdAt) },
          { label: 'Notes', value: selected.notes, span: 2 },
        ]} />}
      </Modal>
    </DocumentList>
  )
}
