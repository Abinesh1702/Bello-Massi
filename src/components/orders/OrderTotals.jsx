import { formatMoney, formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

/** Subtotal − discount + tax = grand total. */
export default function OrderTotals({ totals, className, compact }) {
  const rows = [
    ['Subtotal', formatMoney(totals.subtotal)],
    ['Discount', totals.discountAmount ? `− ${formatMoney(totals.discountAmount)}` : formatMoney(0)],
    ['Tax (GST)', formatMoney(totals.taxAmount)],
  ]
  return (
    <dl className={cn('space-y-2 text-sm', className)}>
      {!compact && (
        <div className="flex justify-between text-muted"><dt>Total quantity</dt><dd className="tabular text-ink">{formatNumber(totals.totalQuantity)}</dd></div>
      )}
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between text-muted"><dt>{k}</dt><dd className="tabular text-ink">{v}</dd></div>
      ))}
      <div className="flex items-baseline justify-between border-t border-line pt-2.5">
        <dt className="font-semibold text-ink">Grand total</dt>
        <dd className="text-xl font-semibold tabular text-ink">{formatMoney(totals.totalAmount)}</dd>
      </div>
    </dl>
  )
}
