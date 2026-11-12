import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Minus, Plus, ShoppingCart, SearchX, Info } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import EmptyState from '../../components/common/EmptyState'
import InfoList from '../../components/common/InfoList'
import { SearchInput } from '../../components/common/FilterToolbar'
import { useCustomerWorkspace } from '../../hooks/useCustomerWorkspace'
import { usePermission } from '../../hooks/usePermission'
import { addToCart, availabilityOf } from '../../services/customerAppService'
import { DECIMAL_UNITS } from '../../services/productService'
import { formatCurrency } from '../../utils/formatters'
import { cn } from '../../utils/helpers'
import { NoCustomerLink, ProductThumb } from './CustomerUi'

export function QtyStepper({ value, onChange, unit, min = 1 }) {
  const step = DECIMAL_UNITS.includes(unit) ? 0.5 : 1
  return (
    <div className="inline-flex items-center rounded-lg border border-line">
      <button type="button" className="grid h-9 w-9 place-items-center text-muted hover:text-ink disabled:opacity-40" onClick={() => onChange(Math.max(min, Number(value) - step))} disabled={Number(value) <= min} aria-label="Decrease quantity"><Minus size={15} /></button>
      <input type="number" inputMode="decimal" min={min} step={step} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-14 border-x border-line bg-transparent text-center text-sm tabular focus:outline-none" aria-label="Quantity" />
      <button type="button" className="grid h-9 w-9 place-items-center text-muted hover:text-ink" onClick={() => onChange(Number(value) + step)} aria-label="Increase quantity"><Plus size={15} /></button>
    </div>
  )
}

export default function CustomerCatalog() {
  const w = useCustomerWorkspace()
  const canOrder = usePermission('customer.order')
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [qty, setQty] = useState({})
  const [detail, setDetail] = useState(null)
  const q = params.get('q') || ''
  const cat = params.get('category') || ''
  const set = (k, v) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }) }
  const products = useMemo(() => w.products.filter((p) => p.status === 'Active' && p.sellingPrice > 0), [w.products])
  const categories = [...new Set(products.map((p) => p.category))].sort()
  if (!w.customer) return <NoCustomerLink />
  const list = products.filter((p) => (!cat || p.category === cat) && (!q || [p.name, p.code, p.sku, p.brand, p.description].some((s) => String(s || '').toLowerCase().includes(q.toLowerCase()))))
  const inCart = (id) => w.cart.items.find((i) => i.productId === id)?.quantity
  const add = (p) => {
    const n = qty[p.id] ?? 1
    const res = addToCart(p.id, n)
    if (!res.ok) { toast.error(res.error); return }
    toast.success(`${p.name} added to cart`, { description: `${res.quantity} ${p.unit} in your cart`, action: { label: 'View cart', onClick: () => navigate('/customer/cart') } })
    setQty((x) => ({ ...x, [p.id]: 1 }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-ink">Catalog</h1>
          <p className="text-sm text-muted">{list.length} product{list.length === 1 ? '' : 's'} · prices before tax</p>
        </div>
        <Button size="sm" variant="secondary" icon={ShoppingCart} to="/customer/cart">Cart ({w.cart.items.length})</Button>
      </div>
      <SearchInput value={q} onChange={(v) => set('q', v)} placeholder="Search products, SKU…" label="Search products" />
      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 scroll-thin" role="group" aria-label="Categories">
        {['', ...categories].map((c) => (
          <button key={c || 'all'} type="button" onClick={() => set('category', c)} aria-pressed={cat === c}
            className={cn('shrink-0 rounded-full border px-3 py-1.5 text-sm', cat === c ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted hover:text-ink')}>{c || 'All'}</button>
        ))}
      </div>
      {list.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((p) => {
            const a = availabilityOf(p, w.customer.hubId, w.inventory)
            return (
              <li key={p.id}>
                <Card className="!p-3 h-full flex flex-col">
                  <button type="button" onClick={() => setDetail(p)} className="flex gap-3 text-left">
                    <ProductThumb product={p} className="h-16 w-16 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-ink leading-snug">{p.name}</p>
                      <p className="text-xs text-muted tabular">{p.sku} · {p.packSize || p.unit}</p>
                      <p className="mt-1 text-sm font-semibold text-ink tabular">{formatCurrency(p.sellingPrice)} <span className="text-xs font-normal text-muted">/ {p.unit}</span></p>
                    </div>
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={a.tone}>{a.label}</Badge>
                    <Badge tone="neutral">{p.category}</Badge>
                    {inCart(p.id) && <Badge tone="brand">{inCart(p.id)} in cart</Badge>}
                  </div>
                  {canOrder && (
                    <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                      <QtyStepper value={qty[p.id] ?? 1} unit={p.unit} onChange={(v) => setQty((x) => ({ ...x, [p.id]: v }))} />
                      <Button size="sm" icon={ShoppingCart} onClick={() => add(p)}>Add</Button>
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      ) : <Card><EmptyState icon={SearchX} title="No products match" description="Try another search or category." action={<Button variant="secondary" onClick={() => setParams({}, { replace: true })}>Clear filters</Button>} /></Card>}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name || ''} description={detail ? `${detail.code} · ${detail.sku}` : ''}
        footer={<><Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>{canOrder && detail && <Button icon={ShoppingCart} onClick={() => { add(detail); setDetail(null) }}>Add {qty[detail.id] ?? 1} {detail.unit}</Button>}</>}>
        {detail && (
          <div className="space-y-4">
            <div className="flex gap-3"><ProductThumb product={detail} className="h-20 w-20 shrink-0" /><p className="text-sm text-muted">{detail.description || 'No description.'}</p></div>
            <InfoList items={[
              { label: 'Price', value: `${formatCurrency(detail.sellingPrice)} / ${detail.unit}` }, { label: 'Tax', value: `${detail.taxPercent}%` },
              { label: 'Pack size', value: detail.packSize }, { label: 'Unit of measure', value: detail.unit },
              { label: 'Brand', value: detail.brand }, { label: 'Storage', value: detail.storageCondition },
              { label: 'Availability', value: availabilityOf(detail, w.customer.hubId, w.inventory).label }, { label: 'Category', value: detail.category },
            ]} />
            {availabilityOf(detail, w.customer.hubId, w.inventory).note && <p className="flex gap-1.5 text-xs text-muted"><Info size={13} className="shrink-0" aria-hidden />{availabilityOf(detail, w.customer.hubId, w.inventory).note}</p>}
            {canOrder && <div className="flex items-center gap-3"><span className="text-sm text-muted">Quantity</span><QtyStepper value={qty[detail.id] ?? 1} unit={detail.unit} onChange={(v) => setQty((x) => ({ ...x, [detail.id]: v }))} /></div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
