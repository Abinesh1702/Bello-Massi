import { PackageX } from 'lucide-react'
import DataTable from '../common/DataTable'
import EmptyState from '../common/EmptyState'
import { StockWarningBadge } from './OrderBadges'
import { formatMoney, formatNumber } from '../../utils/formatters'
import { getHubStockLevel } from '../../services/orderService'

/**
 * Read-only order lines. With `inventory`, shows the CURRENT hub stock next to each line
 * (information only — Phase 3 never deducts stock).
 */
export default function OrderItemsTable({ order, inventory }) {
  const rows = order.items.map((it) => {
    const s = inventory ? getHubStockLevel(it.productId, order.hubId, inventory) : null
    return { ...it, hubStock: s, short: s?.exists && it.orderedQuantity > s.available }
  })
  return (
    <DataTable
      caption="Order lines"
      rows={rows}
      dense
      columns={[
        { key: 'product', header: 'Product', render: (it) => (<div className="min-w-0"><p className="font-medium truncate max-w-[220px]">{it.productName}</p><p className="text-xs text-muted tabular">{it.productCode} · {it.sku}</p>{it.itemNotes && <p className="text-xs text-muted italic">{it.itemNotes}</p>}</div>) },
        { key: 'qty', header: 'Qty', align: 'right', render: (it) => <span className="font-semibold">{formatNumber(it.orderedQuantity)} <span className="text-xs font-normal text-muted">{it.unit}</span></span> },
        { key: 'price', header: 'Unit price', align: 'right', hideBelow: 'sm', render: (it) => formatMoney(it.unitPrice) },
        { key: 'disc', header: 'Disc.', align: 'right', hideBelow: 'md', render: (it) => (it.discountPercentage ? `${it.discountPercentage}%` : '—') },
        { key: 'tax', header: 'GST', align: 'right', hideBelow: 'md', render: (it) => `${it.taxPercentage}%` },
        ...(inventory ? [{
          key: 'stock', header: 'Hub stock now', align: 'right', hideBelow: 'lg',
          render: (it) => (!it.hubStock?.exists ? <span className="text-xs text-muted">Not stocked</span> : (
            <div className="flex flex-col items-end gap-0.5">
              <span className={it.short ? 'text-danger font-medium' : ''}>{formatNumber(it.hubStock.available)}</span>
              {it.short && <StockWarningBadge label={`Short ${formatNumber(it.orderedQuantity - it.hubStock.available)}`} />}
            </div>
          )),
        }] : []),
        { key: 'total', header: 'Line total', align: 'right', render: (it) => <span className="font-semibold">{formatMoney(it.totalAmount)}</span> },
      ]}
      empty={<EmptyState compact icon={PackageX} title="No products on this order" />}
    />
  )
}
