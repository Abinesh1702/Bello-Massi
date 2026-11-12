import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import DataTable from '../common/DataTable'
import EmptyState from '../common/EmptyState'
import { MovementTypeBadge } from '../masterdata/Badges'
import MovementDetailModal from './MovementDetailModal'
import { movementSign } from '../../services/inventoryService'
import { formatDateTime, formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

/** Read-only movement ledger table with a detail modal. Movements are never editable. */
export default function MovementTable({ rows, lookups, pageSize = 10, showProduct = true, showHub = true, sort, dir, onSort, page, onPageChange, dense }) {
  const [selected, setSelected] = useState(null)
  const columns = [
    { key: 'date', header: 'Date', sortable: true, render: (m) => (<div><p className="tabular whitespace-nowrap">{formatDateTime(m.date)}</p><p className="text-xs text-muted tabular">{m.movementNumber}</p></div>) },
    ...(showProduct ? [{ key: 'product', header: 'Product', sortable: true, render: (m) => { const p = lookups.products[m.productId]; return (<div className="min-w-0"><p className="font-medium truncate max-w-[200px]">{p?.name || 'Deleted product'}</p><p className="text-xs text-muted tabular">{p?.code || m.productId}</p></div>) } }] : []),
    ...(showHub ? [{ key: 'hub', header: 'Hub', sortable: true, hideBelow: 'md', render: (m) => lookups.hubs[m.hubId]?.name || 'Deleted hub' }] : []),
    { key: 'type', header: 'Type', sortable: true, render: (m) => <MovementTypeBadge type={m.movementType} /> },
    {
      key: 'quantity', header: 'Qty', align: 'right', sortable: true,
      render: (m) => {
        const sign = movementSign(m)
        return <span className={cn('font-semibold tabular', sign > 0 ? 'text-success' : 'text-danger')}>{sign > 0 ? '+' : '−'}{formatNumber(m.quantity)}</span>
      },
    },
    { key: 'balance', header: 'Available', align: 'right', hideBelow: 'sm', render: (m) => <span className="text-muted tabular whitespace-nowrap">{formatNumber(m.previousAvailable)} → <span className="text-ink">{formatNumber(m.newAvailable)}</span></span> },
    { key: 'reference', header: 'Reference', sortable: true, hideBelow: 'lg', render: (m) => <span className="tabular text-muted">{m.referenceNumber}</span> },
    { key: 'by', header: 'By', hideBelow: 'xl', render: (m) => <span className="text-muted">{lookups.people[m.createdBy]?.name || 'System'}</span> },
  ]
  return (
    <>
      <DataTable
        caption="Stock movements"
        columns={columns}
        rows={rows}
        pageSize={pageSize}
        page={page}
        onPageChange={onPageChange}
        sort={sort}
        dir={dir}
        onSort={onSort}
        dense={dense}
        onRowClick={setSelected}
        empty={<EmptyState compact icon={ArrowRightLeft} title="No stock movements" description="Receipts, transfers and adjustments will appear here." />}
      />
      <MovementDetailModal movement={selected} lookups={lookups} onClose={() => setSelected(null)} />
    </>
  )
}
