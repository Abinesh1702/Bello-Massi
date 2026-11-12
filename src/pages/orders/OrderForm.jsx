import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ClipboardList, Truck, Package, Save, Send, Eye, X, RotateCcw, MapPin, User, AlertTriangle, Info } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import FormSection from '../../components/common/FormSection'
import Card, { CardHeader } from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import OrderItemsEditor from '../../components/orders/OrderItemsEditor'
import OrderTotals from '../../components/orders/OrderTotals'
import CustomerCreditPanel from '../../components/orders/CustomerCreditPanel'
import OrderPreviewModal from '../../components/orders/OrderPreviewModal'
import { CreditWarningBadge, StockWarningBadge } from '../../components/orders/OrderBadges'
import { linkOrderToCall } from '../../services/callService'
import { useMasterData } from '../../hooks/useMasterData'
import { useAuth } from '../../hooks/useAuth'
import { useFormState } from '../../hooks/useFormState'
import {
  canEditOrder, createOrder, deliveryFromCustomer, editBlockReason, emptyOrderInput, getOrderById, newItemKey, orderToInput, peekNextOrderNumber,
  priceOrderInput, resubmitOrder, submitOrder, updateOrder, validateOrder,
} from '../../services/orderService'
import { ROLES } from '../../config/roles'
import { OPTIONS } from '../../config/masterData'
import { ORDER_OPTIONS, RETURN_REASON_SECTIONS } from '../../config/orderConfig'
import { ORDER_STATUS as S } from '../../utils/constants'
import { formatDateTime, formatMoney } from '../../utils/formatters'
import { cn } from '../../utils/helpers'
import { scopeOf } from '../../services/rbacService'

const TODAY = dayjs().format('YYYY-MM-DD')

const deliveryFrom = deliveryFromCustomer

function Highlight({ active, children }) {
  if (!active) return children
  return (
    <div className="relative rounded-xl ring-2 ring-accent ring-offset-2 ring-offset-canvas">
      <span className="absolute -top-2.5 right-4 z-[1] rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">Correction needed</span>
      {children}
    </div>
  )
}

function OrderFormInner({ existing }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { customers, products, hubs, inventory, salesReps, lookups } = useMasterData()
  const isAdmin = scopeOf(user) === ROLES.ADMIN
  const callId = params.get('callId')
  const returned = existing?.orderStatus === S.RETURNED

  const initial = useMemo(() => {
    if (existing) return orderToInput(existing)
    const base = emptyOrderInput(user)
    const c = lookups.customers[params.get('customerId')]
    if (params.get('source')) base.orderSource = params.get('source')
    if (c && c.status === 'Active') {
      Object.assign(base, deliveryFrom(c), {
        customerId: c.id,
        hubId: lookups.hubs[c.hubId]?.status === 'Active' ? c.hubId : '',
        paymentTerms: c.creditEnabled ? 'Credit' : 'Cash on Delivery',
        salesmanId: base.salesmanId || c.salesRepId || '',
      })
    }
    return base
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const f = useFormState(initial)
  const v = f.values
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [preview, setPreview] = useState(false)

  const priced = useMemo(() => priceOrderInput(v), [v, customers, products, hubs, inventory]) // eslint-disable-line react-hooks/exhaustive-deps
  const customer = priced.customer
  const hub = priced.hub
  const highlight = new Set(returned ? RETURN_REASON_SECTIONS[existing.returnReason] || [] : [])
  const nextNumber = useMemo(() => (existing?.orderNumber ? null : peekNextOrderNumber()), [existing])

  const customerOptions = customers
    .slice()
    .sort((a, b) => (a.salesRepId === user.id ? -1 : 0) - (b.salesRepId === user.id ? -1 : 0) || a.name.localeCompare(b.name))
    .map((c) => ({ value: c.id, label: `${c.name} · ${c.city}${c.status !== 'Active' ? ` (${c.status} — cannot order)` : ''}` }))
  const hubOptions = hubs.filter((h) => h.status === 'Active' || h.id === v.hubId).map((h) => ({ value: h.id, label: `${h.name}${h.status !== 'Active' ? ' (inactive)' : ''}` }))
  const salesmanOptions = salesReps.map((r) => ({ value: r.id, label: r.name }))

  const selectCustomer = (id) => {
    const c = lookups.customers[id]
    f.setValue('customerId', id)
    if (!c) return
    Object.entries(deliveryFrom(c)).forEach(([k, val]) => f.setValue(k, val))
    if (lookups.hubs[c.hubId]?.status === 'Active') f.setValue('hubId', c.hubId)
    f.setValue('paymentTerms', c.creditEnabled ? 'Credit' : 'Cash on Delivery')
    if (isAdmin && c.salesRepId) f.setValue('salesmanId', c.salesRepId)
    if (c.status !== 'Active') toast.error(`${c.name} is ${c.status.toLowerCase()} and cannot place orders.`)
  }

  const setLines = (fn) => f.setValues((x) => ({ ...x, items: fn(x.items) }))
  const addLine = (p) => {
    setLines((items) => [...items, { key: newItemKey(), productId: p.id, orderedQuantity: '1', discountPercentage: '0', itemNotes: '' }])
    f.clearError('items')
  }
  const changeLine = (key, field, value) => {
    setLines((items) => items.map((l) => (l.key === key ? { ...l, [field]: value } : l)))
    f.clearError(`item:${key}:${field}`)
  }
  const removeLine = (key) => setLines((items) => items.filter((l) => l.key !== key))

  const saveDraft = () => {
    if (saving) return
    setSaving(true)
    const res = existing ? updateOrder(existing.id, v) : createOrder(v)
    setSaving(false)
    if (!res.ok) {
      f.fail(res.errors || {})
      toast.error(res.errors?.form || 'Please fix the highlighted fields.')
      return
    }
    if (!existing && callId) linkOrderToCall(callId, res.record)
    toast.success(returned ? 'Changes saved' : 'Draft saved', { description: returned ? 'The order is still returned — resubmit it when ready.' : 'Drafts are private to you and never enter the approval queue.' })
    navigate(`/orders/${res.record.id}`, { replace: true })
  }

  const review = () => {
    const errors = validateOrder(v, { mode: 'submit' })
    if (Object.keys(errors).length) {
      f.fail(errors)
      const n = Object.keys(errors).length
      toast.error(`Please fix ${n} issue${n === 1 ? '' : 's'} before submitting.`)
      return
    }
    setConfirm(true)
  }

  const submit = () => {
    if (saving) return
    setSaving(true)
    const res = returned ? resubmitOrder(existing.id, v) : submitOrder(existing?.id || null, v)
    setSaving(false)
    setConfirm(false)
    if (!res.ok) {
      f.fail(res.errors || {})
      toast.error(res.error || 'The order could not be submitted.')
      return
    }
    if (!existing && callId) linkOrderToCall(callId, res.record)
    toast.success(`${res.record.orderNumber} ${returned ? 'resubmitted' : 'submitted'} for approval`, { description: 'The Sales Manager has been notified.' })
    navigate(`/orders/${res.record.id}`, { replace: true })
  }

  const cancelTo = existing ? `/orders/${existing.id}` : '/orders/my-orders'
  const title = !existing ? 'New sales order' : returned ? `Correct ${existing.orderNumber}` : 'Edit draft order'

  return (
    <>
      <PageHeader
        title={title}
        description={!existing ? 'Capture an order from a call, email, WhatsApp or visit. Drafts are private until you submit.' : returned ? 'Make the requested corrections, then resubmit. The order number and history are kept.' : `Draft · last saved ${formatDateTime(existing.updatedAt)}`}
        actions={<Button variant="secondary" icon={X} to={cancelTo}>Cancel</Button>}
      />

      {returned && (
        <div className="mb-6 rounded-xl border border-accent/60 bg-accent/10 p-4" role="alert">
          <div className="flex items-start gap-3">
            <RotateCcw size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0">
              <p className="font-semibold text-ink">Returned for correction: {existing.returnReason}</p>
              <p className="mt-1 text-sm text-ink">“{existing.returnRemarks}”</p>
              <p className="mt-1 text-xs text-muted">{lookups.people[existing.returnedBy]?.name || 'Sales Manager'} · {formatDateTime(existing.returnedAt)}{highlight.size ? ' · highlighted sections need your attention' : ''}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); review() }} noValidate className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2 min-w-0">
          <FormSection title="Order information" icon={ClipboardList} columns={3}>
            <Input label="Order number" value={existing?.orderNumber || `Assigned on submission (next ${nextNumber})`} readOnly hint="Generated automatically — cannot be edited" className="sm:col-span-2 lg:col-span-1" />
            <Input label="Order date" type="date" required max={TODAY} {...f.bind('orderDate')} />
            <Select label="Order source" {...f.bind('orderSource')} options={ORDER_OPTIONS.sources} />
            <Select label="Order type" required {...f.bind('orderType')} options={ORDER_OPTIONS.types} />
            <Select label="Priority" required {...f.bind('orderPriority')} options={ORDER_OPTIONS.priorities} />
            <Select label="Payment terms" required {...f.bind('paymentTerms')} options={ORDER_OPTIONS.paymentTerms} />
            <Select label="Customer" required placeholder="Select customer" {...f.bind('customerId')} onChange={(e) => selectCustomer(e.target.value)} options={customerOptions} className="sm:col-span-2" />
            {isAdmin ? (
              <Select label="Assigned salesman" required placeholder="Select salesman" {...f.bind('salesmanId')} options={salesmanOptions} />
            ) : (
              <Input label="Assigned salesman" value={lookups.people[v.salesmanId]?.name || user.name} readOnly />
            )}
            <Select label="Fulfilment hub" required placeholder="Select hub" {...f.bind('hubId')} options={hubOptions} className="sm:col-span-2" hint={customer && v.hubId && v.hubId !== customer.hubId ? `Customer’s preferred hub is ${lookups.hubs[customer.hubId]?.name || '—'}.` : undefined} />
            <Input label="Customer reference" {...f.bind('customerReference')} placeholder="PO number or message reference" maxLength={40} />
          </FormSection>

          <Highlight active={highlight.has('delivery')}>
            <FormSection
              title="Delivery information"
              icon={Truck}
              columns={3}
              aside={customer && <Button type="button" size="xs" variant="ghost" icon={MapPin} onClick={() => Object.entries(deliveryFrom(customer)).forEach(([k, val]) => f.setValue(k, val))}>Use customer address</Button>}
            >
              <Input label="Delivery address" required {...f.bind('deliveryAddress')} className="sm:col-span-2 lg:col-span-3" hint={customer ? 'Defaults to the customer address — change it for this order only if needed.' : undefined} />
              <Input label="City" required {...f.bind('deliveryCity')} />
              <Select label="State" required placeholder="Select state" {...f.bind('deliveryState')} options={OPTIONS.states} />
              <Input label="Pincode" required inputMode="numeric" maxLength={6} {...f.bind('deliveryPincode')} />
              <Input label="Requested delivery date" type="date" required min={v.orderDate} {...f.bind('requestedDeliveryDate')} />
              <Textarea label="Delivery instructions" rows={2} maxLength={300} {...f.bind('deliveryInstructions')} className="sm:col-span-2" placeholder="Gate, timing, cold-room or contact instructions" />
            </FormSection>
          </Highlight>

          <Highlight active={highlight.has('items')}>
            <Card>
              <CardHeader title="Products" subtitle={hub ? `Stock shown for ${hub.name}. Ordering does not deduct stock.` : 'Select a fulfilment hub to see stock.'} icon={Package}
                action={priced.stockWarning && <StockWarningBadge label="Stock shortage" />} />
              <OrderItemsEditor
                lines={v.items}
                priced={priced.items}
                products={products}
                hubId={v.hubId}
                inventory={inventory}
                errors={f.errors}
                onAdd={addLine}
                onChange={changeLine}
                onRemove={removeLine}
              />
              {priced.stockWarning && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2.5 text-sm text-warning">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden /> Some quantities exceed the stock available at {hub?.name}. You can still submit — the Sales Manager will review the shortage.
                </p>
              )}
            </Card>
          </Highlight>

          <FormSection title="Notes" columns={1}>
            <Textarea label="Internal notes" rows={2} maxLength={500} {...f.bind('notes')} placeholder="Anything the Sales Manager or Customer Service should know" />
          </FormSection>
        </div>

        <div className="space-y-6 xl:sticky xl:top-20 xl:self-start min-w-0">
          <Card>
            <CardHeader title="Customer" icon={User} />
            {customer ? <CustomerCreditPanel customer={customer} orderTotal={priced.totals.totalAmount} /> : <p className="text-sm text-muted">Select a customer to load contact, credit and VIP details.</p>}
            {f.errors.customerId && <p className="mt-3 text-sm text-danger" role="alert">{f.errors.customerId}</p>}
            {customer && !customer.creditEnabled && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted"><Info size={14} className="mt-px shrink-0" /> Credit is disabled for this customer — use Cash on Delivery or Advance Payment.</p>
            )}
          </Card>

          <Highlight active={highlight.has('summary')}>
            <Card>
              <CardHeader title="Order summary" action={<div className="flex gap-1">{priced.creditWarning && <CreditWarningBadge />}</div>} />
              <dl className="mb-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted">Customer</dt><dd className="text-right font-medium truncate">{customer?.name || '—'}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Hub</dt><dd className="text-right font-medium truncate">{hub?.name || '—'}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Lines</dt><dd className="text-right font-medium">{v.items.length}</dd></div>
              </dl>
              <OrderTotals totals={priced.totals} />
              {priced.creditWarning && customer?.creditEnabled && (
                <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger">
                  {priced.credit.alreadyExceeded ? 'This customer is already over the credit limit.' : `This order takes the customer ${formatMoney(priced.credit.projectedBalance - priced.credit.limit)} over the credit limit.`} You can still submit — the Sales Manager will decide.
                </p>
              )}
              <div className="mt-5 grid gap-2">
                <Button type="submit" icon={Send} fullWidth loading={saving && confirm}>{returned ? 'Resubmit for approval' : 'Submit for approval'}</Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" icon={Save} onClick={saveDraft} loading={saving && !confirm}>{returned ? 'Save changes' : 'Save draft'}</Button>
                  <Button variant="secondary" icon={Eye} onClick={() => setPreview(true)} disabled={!customer}>Preview</Button>
                </div>
                <Button variant="ghost" to={cancelTo} fullWidth>Cancel</Button>
              </div>
            </Card>
          </Highlight>
        </div>
      </form>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={submit}
        loading={saving}
        title={returned ? `Resubmit ${existing.orderNumber}?` : 'Submit this order for approval?'}
        description={`${customer?.name} · ${v.items.length} line${v.items.length === 1 ? '' : 's'} · ${formatMoney(priced.totals.totalAmount)}. The Sales Manager will be notified${returned ? '' : ' and an order number assigned'}.`}
        confirmLabel={returned ? 'Resubmit' : 'Submit order'}
      >
        {(priced.creditWarning || priced.stockWarning) && (
          <ul className="space-y-1.5 text-sm">
            {priced.creditWarning && <li className={cn('flex gap-2 text-danger')}><AlertTriangle size={15} className="mt-0.5 shrink-0" /> Credit limit warning will be shown to the Sales Manager.</li>}
            {priced.stockWarning && <li className="flex gap-2 text-warning"><AlertTriangle size={15} className="mt-0.5 shrink-0" /> Stock shortage at {hub?.name} will be shown to the Sales Manager.</li>}
          </ul>
        )}
      </ConfirmDialog>
      {preview && <OrderPreviewModal input={v} priced={priced} existing={existing} nextNumber={nextNumber} lookups={lookups} onClose={() => setPreview(false)} />}
    </>
  )
}

export default function OrderForm() {
  const { id } = useParams()
  const { orders } = useMasterData()
  const { user } = useAuth()
  if (!id) return <OrderFormInner key="new" />
  const existing = getOrderById(id, orders)
  if (!existing) return <NotFoundRecord entity="order" backTo="/orders" backLabel="Back to orders" />
  if (!canEditOrder(user, existing)) {
    return (
      <Card>
        <div className="flex flex-col items-center py-10 text-center">
          <AlertTriangle className="text-warning" size={28} />
          <p className="mt-3 font-semibold text-ink">This order can’t be edited</p>
          <p className="mt-1 max-w-md text-sm text-muted">{editBlockReason(user, existing)}</p>
          <Button className="mt-5" to={`/orders/${existing.id}`}>View order</Button>
        </div>
      </Card>
    )
  }
  return <OrderFormInner key={existing.id} existing={existing} />
}
