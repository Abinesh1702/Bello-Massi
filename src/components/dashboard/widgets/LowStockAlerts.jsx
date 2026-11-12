import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import Card, { CardHeader } from '../../common/Card'
import EmptyState from '../../common/EmptyState'
import { StockStatusBadge } from '../../masterdata/Badges'
import { useMasterData } from '../../../hooks/useMasterData'
import { getLowStockProducts } from '../../../services/inventoryService'
import { formatNumber } from '../../../utils/formatters'

/** Dashboard widget: the most urgent low / out-of-stock lines. */
export default function LowStockAlerts({ limit = 5 }) {
  const { stockRows } = useMasterData()
  const low = useMemo(() => getLowStockProducts(stockRows), [stockRows])
  return (
    <Card>
      <CardHeader
        title="Low stock alerts"
        subtitle={low.length ? `${low.length} stock lines need replenishment` : undefined}
        icon={AlertTriangle}
        action={low.length > 0 && <Link to="/inventory/low-stock" className="text-xs font-medium text-brand hover:underline">View all</Link>}
      />
      {!low.length ? (
        <EmptyState compact icon={CheckCircle2} title="All stock above reorder level" />
      ) : (
        <ul className="divide-y divide-line -my-1">
          {low.slice(0, limit).map((r) => (
            <li key={r.id}>
              <Link to={`/inventory/stock/${r.id}`} className="group flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-md hover:bg-surface-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{r.productName}</p>
                  <p className="text-xs text-muted">{r.hubName} · {formatNumber(r.available)} {r.unit} left (reorder {formatNumber(r.reorderLevel)})</p>
                </div>
                <StockStatusBadge status={r.status} />
                <ChevronRight size={15} className="text-muted group-hover:translate-x-0.5 transition-transform" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
