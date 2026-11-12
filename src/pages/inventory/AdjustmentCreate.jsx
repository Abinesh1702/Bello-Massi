import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, CheckCircle2, Plus, Minus, ShieldAlert, SearchX, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import PageHeader from '../../components/common/PageHeader'
import FormSection, { FormActions } from '../../components/common/FormSection'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import InfoList from '../../components/common/InfoList'
import StockPreview from '../../components/inventory/StockPreview'
import { useMasterData } from '../../hooks/useMasterData'
import { useFormState } from '../../hooks/useFormState'
import { useAuth } from '../../hooks/useAuth'
import { adjustmentEffect, createStockAdjustment, nextAdjustmentNumber, validateAdjustment } from '../../services/inventoryService'
import { OPTIONS } from '../../config/masterData'
import { formatNumber } from '../../utils/formatters'
import { getAvailable } from '../../utils/stock'
import { cn } from '../../utils/helpers'

const TYPES = [
  { id: 'Increase', icon: Plus, text: 'Add stock found or returned' },
  { id: 'Decrease', icon: Minus, text: 'Remove stock (expired, count variance)' },
  { id: 'Damaged', icon: ShieldAlert, text: 'Move available stock to damaged' },
  { id: 'Lost', icon: SearchX, text: 'Write off missing stock' },
  { id: 'Correction', icon: Wrench, text: 'Fix a data entry error (+ or −)' },
]
const DEFAULT_REASON = { Increase: 'Physical Stock Correction', Decrease: 'Physical Stock Correction', Damaged: 'Damaged Stock', Lost: 'Lost Stock', Correction: 'Data Correction' }

export default function AdjustmentCreate() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { hubs, products, inventory, lookups } = useMasterData()
  const f = useFormState({
    adjustmentDate: dayjs().format('YYYY-MM-DD'), hubId: params.get('hubId') || '', productId: params.get('productId') || '',
    type: 'Decrease', direction: 'decrease', quantity: '', reason: 'Physical Stock Correction', notes: '',
  })
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const v = f.values
  const product = lookups.products[v.productId]
  const hub = lookups.hubs[v.hubId]
  const record = inventory.find((r) => r.productId === v.productId && r.hubId === v.hubId) || null
  const q = Number(v.quantity) || 0
  const effect = adjustmentEffect(v.type, v.direction, q)
  const number = useMemo(() => nextAdjustmentNumber(), [inventory]) // eslint-disable-line react-hooks/exhaustive-deps

  const review = (e) => {
    e.preventDefault()
    const errors = validateAdjustment(v)
    if (Object.keys(errors).length) {
      f.fail(errors)
      toast.error('Please fix the highlighted fields.')
      return
    }
    setConfirming(true)
  }
  const confirm = () => {
    if (saving) return
    setSaving(true)
    const res = createStockAdjustment(v)
    setSaving(false)
    setConfirming(false)
    if (!res.ok) {
      f.fail(res.errors)
      toast.error(res.errors.form || 'Adjustment could not be saved.')
      return
    }
    toast.success(`Adjustment recorded · ${res.record.adjustmentNumber}`)
    navigate('/inventory/stock-adjustments', { replace: true })
  }

  return (
    <>
      <PageHeader title="New stock adjustment" description="Correct stock with a reason. Every adjustment is recorded in the movement history." actions={<Button variant="secondary" icon={X} to="/inventory/stock-adjustments">Cancel</Button>} />
      <form onSubmit={review} noValidate className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <FormSection title="Adjustment type" icon={SlidersHorizontal} columns={1}>
            <div role="radiogroup" aria-label="Adjustment type" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TYPES.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={v.type === t.id}
                  onClick={() => { f.setValue('type', t.id); f.setValue('reason', DEFAULT_REASON[t.id]) }}
                  className={cn('flex items-start gap-3 rounded-xl border p-3 text-left transition', v.type === t.id ? 'border-accent ring-2 ring-accent/30 bg-accent/5' : 'border-line hover:border-brand/30')}>
                  <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', v.type === t.id ? 'bg-accent text-navy' : 'bg-surface-2 text-brand')}><t.icon size={16} /></span>
                  <span><span className="block text-sm font-medium text-ink">{t.id}</span><span className="block text-xs text-muted">{t.text}</span></span>
                </button>
              ))}
            </div>
            {v.type === 'Correction' && (
              <Select label="Correction direction" required {...f.bind('direction')} options={[{ value: 'increase', label: 'Add stock (+)' }, { value: 'decrease', label: 'Remove stock (−)' }]} className="sm:max-w-xs" />
            )}
          </FormSection>
          <FormSection title="Details" columns={2}>
            <Input label="Adjustment number" value={number} readOnly />
            <Input label="Date" type="date" required max={dayjs().format('YYYY-MM-DD')} {...f.bind('adjustmentDate')} />
            <Select label="Hub" required placeholder="Select hub" {...f.bind('hubId')} options={hubs.map((h) => ({ value: h.id, label: `${h.name}${h.status === 'Inactive' ? ' (inactive)' : ''}` }))} />
            <Select label="Product" required placeholder="Select product" {...f.bind('productId')} options={products.filter((p) => p.trackInventory).map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))} />
            <Input label={`Quantity${product ? ` (${product.unit})` : ''}`} type="number" min="0" required {...f.bind('quantity')}
              hint={record && product ? `${formatNumber(Math.max(0, getAvailable(record)))} ${product.unit} available` : undefined} />
            <Select label="Reason" required {...f.bind('reason')} options={OPTIONS.adjustmentReasons} />
            <Textarea label="Notes" required={v.reason === 'Other'} {...f.bind('notes')} rows={2} className="sm:col-span-2" maxLength={300} />
            <Input label="Created by" value={user?.name || ''} readOnly />
          </FormSection>
        </div>
        <div>
          {product && hub && effect ? <StockPreview label="After adjustment" record={record} product={product} hubName={hub.name} delta={{ dTotal: effect.dTotal, dDamaged: effect.dDamaged }} />
            : <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">Select a hub and product to preview.</p>}
          {v.type === 'Damaged' && <p className="mt-3 text-xs text-muted">Damaged stock stays on hand but is no longer available to sell.</p>}
        </div>
        <div className="lg:col-span-3">
          <FormActions note="Adjustments are permanent. Reverse a mistake with an opposite adjustment.">
            <Button variant="secondary" to="/inventory/stock-adjustments">Cancel</Button>
            <Button type="submit" icon={CheckCircle2}>Review & confirm</Button>
          </FormActions>
        </div>
      </form>
      <ConfirmDialog open={confirming} onClose={() => setConfirming(false)} onConfirm={confirm} loading={saving} tone={effect?.reducesAvailable ? 'danger' : 'primary'} title="Confirm stock adjustment" description="Stock will change immediately and a movement will be recorded." confirmLabel="Confirm adjustment">
        {product && hub && (
          <InfoList items={[
            { label: 'Type', value: v.type === 'Correction' ? `Correction (${v.direction})` : v.type },
            { label: 'Quantity', value: <strong>{effect?.reducesAvailable ? '−' : '+'}{formatNumber(q)} {product.unit}</strong> },
            { label: 'Product', value: product.name },
            { label: 'Hub', value: hub.name },
            { label: 'Reason', value: v.reason, span: 2 },
          ]} />
        )}
      </ConfirmDialog>
    </>
  )
}
