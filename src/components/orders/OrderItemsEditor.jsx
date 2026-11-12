import { Trash2, AlertTriangle, PackagePlus } from 'lucide-react'
import ProductPicker from './ProductPicker'
import EmptyState from '../common/EmptyState'
import Badge from '../common/Badge'
import { formatMoney, formatNumber } from '../../utils/formatters'
import { DECIMAL_UNITS } from '../../services/productService'
import { cn } from '../../utils/helpers'

const cell = 'h-9 w-full rounded-md border bg-surface px-2 text-sm text-right tabular focus:outline-none focus:ring-4 focus:ring-[var(--ring)]'

/**
 * Editable order lines. `priced` comes from orderService.priceOrderInput (the same function
 * the service uses on save), so on-screen totals always match the stored order.
 */
export default function OrderItemsEditor({ lines, priced, products, hubId, inventory, errors, onAdd, onChange, onRemove }) {
  const byKey = Object.fromEntries(priced.map((p) => [p.key, p]))
  return (
    <div className="space-y-4">
      <ProductPicker products={products} hubId={hubId} inventory={inventory} excludeIds={lines.map((l) => l.productId)} onPick={onAdd} error={errors.items} />
      {!lines.length ? (
        <EmptyState compact icon={PackagePlus} title="No products yet" description="Search above to add products to this order." />
      ) : (
        <div className="overflow-x-auto scroll-thin -mx-5 px-5">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 text-left">Product</th>
                <th className="py-2 pr-3 text-left">SKU</th>
                <th className="py-2 pr-3 text-right">Hub stock</th>
                <th className="py-2 pr-3 text-right w-24">Quantity</th>
                <th className="py-2 pr-3 text-left">Unit</th>
                <th className="py-2 pr-3 text-right">Unit price</th>
                <th className="py-2 pr-3 text-right w-20">Disc. %</th>
                <th className="py-2 pr-3 text-right">GST</th>
                <th className="py-2 pr-3 text-right">Line total</th>
                <th className="py-2 text-right"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const p = byKey[line.key] || {}
                const product = p.product
                const err = (f) => errors[`item:${line.key}:${f}`]
                const short = p.stockShort
                return (
                  <tr key={line.key} className={cn('border-b border-line align-top', short && 'bg-warning/5')}>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-ink">{p.productName || 'Unknown product'}</p>
                      <p className="text-xs text-muted tabular">{p.productCode}</p>
                      {err('productId') && <p className="text-xs text-danger mt-1" role="alert">{err('productId')}</p>}
                      {short && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-warning">
                          <AlertTriangle size={12} aria-hidden /> Exceeds available stock by {formatNumber(p.orderedQuantity - p.stockAvailable)} {p.unit}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-muted tabular">{p.sku}</td>
                    <td className="py-2.5 pr-3 text-right tabular">
                      {!p.tracked ? <span className="text-xs text-muted">N/A</span>
                        : !hubId ? <span className="text-xs text-muted">Select hub</span>
                          : (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className={p.stockAvailable <= 0 ? 'text-danger font-medium' : ''}>{formatNumber(p.stockAvailable ?? 0)}</span>
                              {p.stockAvailable <= 0 ? <Badge tone="danger">Out</Badge> : p.stockLow ? <Badge tone="warning">Low</Badge> : null}
                            </div>
                          )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <input
                        type="number"
                        min="0"
                        step={DECIMAL_UNITS.includes(p.unit) ? '0.01' : '1'}
                        inputMode="decimal"
                        aria-label={`Quantity for ${p.productName}`}
                        aria-invalid={Boolean(err('orderedQuantity')) || undefined}
                        value={line.orderedQuantity}
                        onChange={(e) => onChange(line.key, 'orderedQuantity', e.target.value)}
                        className={cn(cell, err('orderedQuantity') ? 'border-danger' : short ? 'border-warning' : 'border-line')}
                      />
                      {err('orderedQuantity') && <p className="text-xs text-danger mt-1 text-right" role="alert">{err('orderedQuantity')}</p>}
                    </td>
                    <td className="py-2.5 pr-3 text-muted">{p.unit}</td>
                    <td className="py-2.5 pr-3 text-right tabular">{formatMoney(p.unitPrice)}</td>
                    <td className="py-2.5 pr-3">
                      <input
                        type="number"
                        min="0"
                        max={product?.maxDiscountPercent || 0}
                        step="0.5"
                        aria-label={`Discount percent for ${p.productName}`}
                        aria-invalid={Boolean(err('discountPercentage')) || undefined}
                        disabled={!product?.discountAllowed}
                        title={product?.discountAllowed ? `Up to ${product.maxDiscountPercent}%` : 'No discount allowed'}
                        value={line.discountPercentage}
                        onChange={(e) => onChange(line.key, 'discountPercentage', e.target.value)}
                        className={cn(cell, err('discountPercentage') ? 'border-danger' : 'border-line', 'disabled:bg-surface-2 disabled:text-muted')}
                      />
                      {err('discountPercentage') && <p className="text-xs text-danger mt-1 text-right" role="alert">{err('discountPercentage')}</p>}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular text-muted">{p.taxPercentage}%</td>
                    <td className="py-2.5 pr-3 text-right">
                      <p className="font-semibold tabular">{formatMoney(p.totalAmount)}</p>
                      {p.discountAmount > 0 && <p className="text-xs text-success tabular">−{formatMoney(p.discountAmount)}</p>}
                    </td>
                    <td className="py-2.5 text-right">
                      <button type="button" onClick={() => onRemove(line.key)} className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-danger/10 hover:text-danger dark:hover:bg-danger/100/10" aria-label={`Remove ${p.productName}`}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
