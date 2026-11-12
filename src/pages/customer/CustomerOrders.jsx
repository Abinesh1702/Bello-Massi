import { useSearchParams } from 'react-router-dom'
import { ShoppingBag, SearchX } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import { SearchInput } from '../../components/common/FilterToolbar'
import { useCustomerWorkspace } from '../../hooks/useCustomerWorkspace'
import { cn } from '../../utils/helpers'
import { NoCustomerLink, OrderCard } from './CustomerUi'

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending', test: (o) => ['SUBMITTED', 'RETURNED'].includes(o.orderStatus) },
  { id: 'active', label: 'In progress', test: (o) => ['APPROVED', 'CONSOLIDATED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus) },
  { id: 'delivered', label: 'Delivered', test: (o) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.orderStatus) },
  { id: 'issues', label: 'Issues', test: (o) => ['REJECTED', 'DELIVERY_FAILED', 'RETURNED_TO_HUB'].includes(o.orderStatus) },
]

export default function CustomerOrders() {
  const w = useCustomerWorkspace()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const status = params.get('status') || ''
  const set = (k, v) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }) }
  if (!w.customer) return <NoCustomerLink />
  const f = FILTERS.find((x) => x.id === status)
  const list = w.orders.filter((o) => (!f?.test || f.test(o)) && (!q || [o.orderNumber, o.customerReference, ...(o.items || []).map((i) => i.productName)].some((s) => String(s || '').toLowerCase().includes(q.toLowerCase()))))
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2">
        <div><h1 className="text-xl font-semibold text-ink">My orders</h1><p className="text-sm text-muted">{w.orders.length} order{w.orders.length === 1 ? '' : 's'}</p></div>
        <Button size="sm" icon={ShoppingBag} to="/customer/catalog">New order</Button>
      </div>
      <SearchInput value={q} onChange={(v) => set('q', v)} placeholder="Search order number, product, PO…" label="Search orders" />
      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 scroll-thin" role="group" aria-label="Filter by status">
        {FILTERS.map((x) => (
          <button key={x.id || 'all'} type="button" onClick={() => set('status', x.id)} aria-pressed={status === x.id}
            className={cn('shrink-0 rounded-full border px-3 py-1.5 text-sm', status === x.id ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted hover:text-ink')}>
            {x.label} ({x.test ? w.orders.filter(x.test).length : w.orders.length})
          </button>
        ))}
      </div>
      {list.length ? <ul className="space-y-2.5">{list.map((o) => <OrderCard key={o.id} order={o} delivery={w.deliveryOf(o.id)} />)}</ul>
        : <Card><EmptyState icon={w.orders.length ? SearchX : ShoppingBag} title={w.orders.length ? 'No orders match' : 'No orders yet'} description={w.orders.length ? 'Try another filter.' : 'Place your first order from the catalog.'} action={!w.orders.length && <Button to="/customer/catalog">Browse catalog</Button>} /></Card>}
    </div>
  )
}
