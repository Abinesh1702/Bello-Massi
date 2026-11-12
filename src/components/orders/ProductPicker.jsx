import { useId, useMemo, useRef, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import Badge from '../common/Badge'
import { useClickOutside } from '../../hooks/useClickOutside'
import { getHubStockLevel } from '../../services/orderService'
import { formatMoney, formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

/** Searchable product picker showing price, GST and live stock at the selected hub. */
export default function ProductPicker({ products, hubId, inventory, excludeIds = [], onPick, error }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef(null)
  const inputRef = useRef(null)
  const listId = useId()
  useClickOutside(ref, () => setOpen(false), open)

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    return products
      .filter((p) => p.status === 'Active' && !excludeIds.includes(p.id))
      .filter((p) => !query || [p.name, p.code, p.sku, p.brand, p.category].some((v) => String(v || '').toLowerCase().includes(query)))
      .slice(0, 8)
      .map((p) => ({ p, stock: p.trackInventory && hubId ? getHubStockLevel(p.id, hubId, inventory) : null }))
  }, [q, products, excludeIds, hubId, inventory])

  const pick = (r) => {
    if (!r) return
    onPick(r.p)
    setQ('')
    setActive(0)
    inputRef.current?.focus()
  }

  return (
    <div ref={ref} className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Search products to add"
        aria-invalid={Boolean(error) || undefined}
        placeholder="Search product name, code or SKU to add…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
          if (e.key === 'Enter') { e.preventDefault(); pick(results[active]) }
          if (e.key === 'Escape') setOpen(false)
        }}
        className={cn('h-10 w-full rounded-lg border bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted/80 focus:outline-none focus:ring-4 focus:ring-[var(--ring)]', error ? 'border-danger' : 'border-line focus:border-brand')}
      />
      {error && <p className="mt-1.5 text-xs text-danger" role="alert">{error}</p>}
      {open && (
        <ul id={listId} role="listbox" className="absolute z-40 left-0 right-0 mt-1.5 max-h-80 overflow-y-auto scroll-thin rounded-xl border border-line bg-surface p-1.5 shadow-pop">
          {!hubId && <li className="px-3 py-2 text-xs text-warning">Select a fulfilment hub to see stock availability.</li>}
          {results.length === 0 && <li className="px-3 py-3 text-sm text-muted">No matching active products.</li>}
          {results.map((r, i) => (
            <li
              key={r.p.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(r)}
              className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2', i === active && 'bg-surface-2')}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{r.p.name}</p>
                <p className="text-xs text-muted tabular">{r.p.code} · {r.p.sku} · {r.p.packSize || r.p.unit}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm tabular">{formatMoney(r.p.sellingPrice)} <span className="text-xs text-muted">/{r.p.unit} +{r.p.taxPercent}%</span></p>
                {!r.p.trackInventory ? <span className="text-xs text-muted">Not stocked</span>
                  : r.stock ? (r.stock.available <= 0 ? <Badge tone="danger">Out of stock</Badge>
                    : <span className={cn('text-xs tabular', r.stock.low ? 'text-warning' : 'text-muted')}>{formatNumber(r.stock.available)} available{r.stock.low ? ' · low' : ''}</span>) : null}
              </div>
              <Plus size={16} className="text-muted shrink-0" aria-hidden />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
