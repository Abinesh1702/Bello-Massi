import { ArrowRight } from 'lucide-react'
import { StockStatusBadge } from '../masterdata/Badges'
import { getAvailable, getStockStatus } from '../../utils/stock'
import { formatNumber } from '../../utils/formatters'

/**
 * Before → after preview of a stock line for an operation.
 * record may be null (no stock yet at that hub). delta: { dTotal, dDamaged }
 */
export default function StockPreview({ label, record, product, delta, hubName }) {
  const base = record || { totalQuantity: 0, reservedQuantity: 0, damagedQuantity: 0, reorderLevel: product?.reorderLevel || 0, maximumStock: product?.maxStockLevel || 0 }
  const after = { ...base, totalQuantity: base.totalQuantity + (delta?.dTotal || 0), damagedQuantity: (base.damagedQuantity || 0) + (delta?.dDamaged || 0) }
  const negative = getAvailable(after) < 0
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}{hubName && <span className="normal-case font-normal"> · {hubName}</span>}</p>
      {!record && <p className="mt-1 text-xs text-muted">No stock line yet — one will be created.</p>}
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        {[
          ['On hand', base.totalQuantity, after.totalQuantity],
          ['Damaged', base.damagedQuantity || 0, after.damagedQuantity],
          ['Available', getAvailable(base), getAvailable(after)],
        ].map(([k, a, b]) => (
          <div key={k}>
            <p className="text-xs text-muted">{k}</p>
            <p className="mt-0.5 flex items-center gap-1 tabular">
              <span className="text-muted">{formatNumber(a)}</span>
              <ArrowRight size={12} className="text-muted" aria-hidden />
              <span className={`font-semibold ${k === 'Available' && negative ? 'text-danger' : 'text-ink'}`}>{formatNumber(b)}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span>Status after:</span> <StockStatusBadge status={getStockStatus(after)} />
        {product && <span className="ml-auto">Reorder at {formatNumber(base.reorderLevel)} {product.unit}</span>}
      </div>
    </div>
  )
}
