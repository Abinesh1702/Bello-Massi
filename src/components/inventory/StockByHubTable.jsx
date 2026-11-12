import { useNavigate } from 'react-router-dom'
import DataTable from '../common/DataTable'
import EmptyState from '../common/EmptyState'
import { StockStatusBadge } from '../masterdata/Badges'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { Warehouse } from 'lucide-react'

/** Stock lines for one product (by hub) or one hub (by product). mode: 'hub' | 'product' */
export default function StockByHubTable({ rows, mode = 'hub', canOpen = true, pageSize }) {
  const navigate = useNavigate()
  const first = mode === 'hub'
    ? { key: 'hubName', header: 'Hub', render: (r) => (<div><p className="font-medium">{r.hubName}</p><p className="text-xs text-muted">{r.hub?.status === 'Inactive' ? 'Inactive hub' : r.hub?.city}</p></div>) }
    : { key: 'productName', header: 'Product', render: (r) => (<div className="min-w-0"><p className="font-medium truncate max-w-[220px]">{r.productName}</p><p className="text-xs text-muted tabular">{r.productCode} · {r.category}</p></div>) }
  return (
    <DataTable
      rows={rows}
      pageSize={pageSize}
      dense
      onRowClick={canOpen ? (r) => navigate(`/inventory/stock/${r.id}`) : undefined}
      columns={[
        first,
        { key: 'total', header: 'On hand', align: 'right', render: (r) => formatNumber(r.totalQuantity) },
        { key: 'reserved', header: 'Reserved', align: 'right', hideBelow: 'md', render: (r) => formatNumber(r.reservedQuantity) },
        { key: 'damaged', header: 'Damaged', align: 'right', hideBelow: 'md', render: (r) => formatNumber(r.damagedQuantity) },
        { key: 'available', header: 'Available', align: 'right', render: (r) => <span className="font-semibold">{formatNumber(r.available)}</span> },
        { key: 'reorder', header: 'Reorder', align: 'right', hideBelow: 'lg', render: (r) => formatNumber(r.reorderLevel) },
        { key: 'value', header: 'Value', align: 'right', hideBelow: 'xl', render: (r) => formatCurrency(r.value) },
        { key: 'status', header: 'Status', render: (r) => <StockStatusBadge status={r.status} /> },
      ]}
      empty={<EmptyState compact icon={Warehouse} title="No stock lines" description="Stock appears here after the first receipt or transfer." />}
    />
  )
}
