import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { ShoppingCart, Trash2, MapPin, Send, LayoutGrid, AlertTriangle, CalendarDays } from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { useCustomerWorkspace } from '../../hooks/useCustomerWorkspace'
import { placeCustomerOrder, priceCart, removeFromCart, setCartQuantity } from '../../services/customerAppService'
import { deliveryFromCustomer } from '../../services/orderService'
import { formatCurrency } from '../../utils/formatters'
import { NoCustomerLink, ProductThumb } from './CustomerUi'
import { QtyStepper } from './CustomerCatalog'

const SLOTS = ['', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '16:00', '18:00']

export default function CustomerCart() {
  const w = useCustomerWorkspace()
  const navigate = useNavigate()
  const c = w.customer
  const [form, setForm] = useState(() => ({
    address: 'primary', ...deliveryFromCustomer(c),
    requestedDeliveryDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), requestedDeliveryTime: '', remarks: '', customerReference: '',
  }))
  const [errors, setErrors] = useState({})
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const priced = useMemo(() => (c ? priceCart(c, w.cart.items) : null), [c, w.cart.items])
  if (!c) return <NoCustomerLink />
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })) }
  const t = priced?.totals || {}

  const place = () => {
    setBusy(true)
    const res = placeCustomerOrder(form)
    setBusy(false)
    setConfirm(false)
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success(`Order ${res.record.orderNumber} placed`, { description: 'It is now waiting for approval. You will be notified at each step.' })
    navigate(`/customer/orders/${res.record.id}`, { replace: true })
  }

  if (!w.cart.items.length) return <Card><EmptyState icon={ShoppingCart} title="Your cart is empty" description="Add products from the catalog to place an order." action={<Button icon={LayoutGrid} to="/customer/catalog">Browse catalog</Button>} /></Card>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">Cart</h1>
      <Card padded={false}>
        <ul className="divide-y divide-line">
          {priced.items.map((it) => (
            <li key={it.productId} className="flex gap-3 p-3">
              <ProductThumb product={it.product} className="h-14 w-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="font-medium text-ink leading-snug">{it.productName}</p><p className="text-xs text-muted tabular">{formatCurrency(it.unitPrice)} / {it.unit} · tax {it.taxPercentage}%</p></div>
                  <button type="button" onClick={() => { removeFromCart(it.productId); toast.success(`${it.productName} removed`) }} className="rounded p-1.5 text-muted hover:text-danger" aria-label={`Remove ${it.productName}`}><Trash2 size={16} /></button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <QtyStepper value={it.orderedQuantity} unit={it.unit} onChange={(v) => { if (v === '' || Number(v) <= 0) return; const r = setCartQuantity(it.productId, v); if (!r.ok) toast.error(r.error) }} />
                  <p className="font-semibold text-ink tabular">{formatCurrency(it.lineTotal)}</p>
                </div>
                {it.stockShort && <p className="mt-1 text-xs text-warning">Limited stock at your hub — delivery may take longer.</p>}
              </div>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 border-t border-line p-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular">{formatCurrency(t.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="tabular">− {formatCurrency(t.discountAmount)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="tabular">{formatCurrency(t.taxAmount)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular">{formatCurrency(t.totalAmount)}</dd></div>
        </dl>
        {priced.creditWarning && <p className="mx-4 mb-4 flex gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-ink"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" aria-hidden />This order takes your account over its credit limit. You can still place it — our sales manager reviews it before approval.</p>}
      </Card>

      <Card>
        <CardHeader title="Delivery" icon={MapPin} />
        <div className="space-y-3">
          <Select label="Deliver to" value={form.address} onChange={(e) => {
            const v = e.target.value
            set('address', v)
            if (v === 'primary') setForm((f) => ({ ...f, address: v, ...deliveryFromCustomer(c) }))
          }} options={[{ value: 'primary', label: `Registered address — ${c.city}` }, { value: 'other', label: 'Another address' }]} />
          <Textarea label="Address" rows={2} value={form.deliveryAddress} onChange={(e) => { set('deliveryAddress', e.target.value); set('address', 'other') }} error={errors.deliveryAddress} maxLength={200} />
          <div className="grid grid-cols-3 gap-2">
            <Input label="City" value={form.deliveryCity} onChange={(e) => set('deliveryCity', e.target.value)} error={errors.deliveryCity} />
            <Input label="State" value={form.deliveryState} onChange={(e) => set('deliveryState', e.target.value)} error={errors.deliveryState} />
            <Input label="Pincode" inputMode="numeric" value={form.deliveryPincode} onChange={(e) => set('deliveryPincode', e.target.value)} error={errors.deliveryPincode} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Requested date" type="date" icon={CalendarDays} min={dayjs().add(1, 'day').format('YYYY-MM-DD')} value={form.requestedDeliveryDate} onChange={(e) => set('requestedDeliveryDate', e.target.value)} error={errors.requestedDeliveryDate} />
            <Select label="Preferred time" value={form.requestedDeliveryTime} onChange={(e) => set('requestedDeliveryTime', e.target.value)} error={errors.requestedDeliveryTime} options={SLOTS.map((s) => ({ value: s, label: s ? `By ${s}` : 'Any time' }))} />
          </div>
          <Input label="Your PO / reference (optional)" value={form.customerReference} onChange={(e) => set('customerReference', e.target.value)} maxLength={40} />
          <Textarea label="Remarks for delivery (optional)" rows={2} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} error={errors.remarks} maxLength={300} />
          <p className="text-xs text-muted">Payment terms: {c.creditEnabled ? `Credit, ${c.creditDays} days` : 'Cash on delivery'}.</p>
        </div>
      </Card>
      {errors.items && <p role="alert" className="text-sm text-danger">{errors.items}</p>}
      <div className="sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 -mx-3 sm:-mx-4 border-t border-line bg-surface/95 px-3 sm:px-4 py-3 backdrop-blur shadow-[0_-6px_16px_-10px_rgba(16,24,40,0.25)]">
        <Button icon={Send} size="lg" fullWidth onClick={() => setConfirm(true)}>Place order · {formatCurrency(t.totalAmount)}</Button>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={place} loading={busy} title="Place this order?" confirmLabel="Place order"
        description={`${priced.items.length} product${priced.items.length === 1 ? '' : 's'} · ${formatCurrency(t.totalAmount)} · delivery requested ${dayjs(form.requestedDeliveryDate).format('DD MMM')}${form.requestedDeliveryTime ? ` by ${form.requestedDeliveryTime}` : ''}. The order goes to our sales team for approval.`} />
    </div>
  )
}
