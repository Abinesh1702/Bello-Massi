import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRightLeft, X, Save, CheckCircle2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import PageHeader from '../../components/common/PageHeader'
import FormSection, { FormActions } from '../../components/common/FormSection'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import StockPreview from '../../components/inventory/StockPreview'
import { useMasterData } from '../../hooks/useMasterData'
import { useFormState } from '../../hooks/useFormState'
import { completeTransfer, createStockTransfer, nextTransferNumber, updateDraftTransfer, validateTransfer } from '../../services/inventoryService'
import { TRANSFER_STATUS } from '../../config/masterData'
import { getAvailable } from '../../utils/stock'
import { formatNumber } from '../../utils/formatters'
import { stockableProductOptions } from './ReceiptCreate'

function TransferForm({ draft }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { hubs, products, inventory, lookups } = useMasterData()
  const f = useFormState(draft ? {
    transferDate: draft.transferDate, sourceHubId: draft.sourceHubId, destinationHubId: draft.destinationHubId,
    productId: draft.productId, quantity: String(draft.quantity), notes: draft.notes,
  } : {
    transferDate: dayjs().format('YYYY-MM-DD'),
    sourceHubId: params.get('sourceHubId') || '',
    destinationHubId: params.get('destinationHubId') || '',
    productId: params.get('productId') || '',
    quantity: '',
    notes: '',
  })
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const v = f.values
  const product = lookups.products[v.productId]
  const src = lookups.hubs[v.sourceHubId]
  const dest = lookups.hubs[v.destinationHubId]
  const srcRec = inventory.find((r) => r.productId === v.productId && r.hubId === v.sourceHubId) || null
  const destRec = inventory.find((r) => r.productId === v.productId && r.hubId === v.destinationHubId) || null
  const q = Number(v.quantity) || 0
  const number = useMemo(() => draft?.transferNumber || nextTransferNumber(), [draft])

  // Hubs that actually hold the selected product are listed first with their availability
  const sourceOptions = hubs.map((h) => {
    const rec = inventory.find((r) => r.productId === v.productId && r.hubId === h.id)
    return { value: h.id, label: `${h.name}${v.productId ? ` — ${formatNumber(rec ? Math.max(0, getAvailable(rec)) : 0)} available` : ''}${h.status === 'Inactive' ? ' (inactive)' : ''}` }
  })
  const destOptions = hubs.filter((h) => h.status === 'Active' && h.id !== v.sourceHubId).map((h) => ({ value: h.id, label: h.name }))

  const saveDraft = () => {
    if (saving) return
    setSaving(true)
    const res = draft ? updateDraftTransfer(draft.id, v) : createStockTransfer(v, { complete: false })
    setSaving(false)
    if (!res.ok) {
      f.fail(res.errors)
      toast.error(res.errors.form || 'Please fix the highlighted fields.')
      return
    }
    toast.success(`Draft saved · ${res.record.transferNumber}`, { description: 'No stock has moved yet.' })
    navigate('/inventory/stock-transfers', { replace: true })
  }

  const review = (e) => {
    e.preventDefault()
    const errors = validateTransfer(v, { forCompletion: true })
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
    let res
    if (draft) {
      const upd = updateDraftTransfer(draft.id, v)
      res = upd.ok ? completeTransfer(draft.id) : { ok: false, errors: upd.errors }
    } else {
      res = createStockTransfer(v, { complete: true })
    }
    setSaving(false)
    setConfirming(false)
    if (!res.ok) {
      if (res.errors) f.fail(res.errors)
      toast.error(res.error || res.errors?.form || 'Transfer could not be completed.')
      return
    }
    toast.success(`Transfer completed · ${res.record.transferNumber}`, { description: `${formatNumber(res.record.quantity)} ${product.unit} moved from ${src.name} to ${dest.name}.` })
    navigate('/inventory/stock-transfers', { replace: true })
  }

  return (
    <>
      <PageHeader
        title={draft ? `Edit draft ${draft.transferNumber}` : 'New stock transfer'}
        description="Move stock between hubs. Drafts don’t change stock; completing a transfer moves it."
        actions={<Button variant="secondary" icon={X} to="/inventory/stock-transfers">Cancel</Button>}
      />
      <form onSubmit={review} noValidate className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FormSection title="Transfer details" icon={ArrowRightLeft} columns={2}>
            <Input label="Transfer number" value={number} readOnly />
            <Input label="Transfer date" type="date" required max={dayjs().format('YYYY-MM-DD')} {...f.bind('transferDate')} />
            <Select label="Product" required placeholder="Select product" {...f.bind('productId')} options={stockableProductOptions(products)} className="sm:col-span-2" />
            <Select label="Source hub" required placeholder="Select source hub" {...f.bind('sourceHubId')} options={sourceOptions} />
            <Select label="Destination hub" required placeholder="Select destination hub" {...f.bind('destinationHubId')} options={destOptions} />
            <Input label={`Quantity${product ? ` (${product.unit})` : ''}`} type="number" min="0" required {...f.bind('quantity')}
              hint={srcRec && product ? `${formatNumber(Math.max(0, getAvailable(srcRec)))} ${product.unit} available at source` : undefined} />
            <div />
            <Textarea label="Notes" {...f.bind('notes')} rows={2} className="sm:col-span-2" maxLength={300} />
          </FormSection>
        </div>
        <div className="space-y-4">
          {product && src ? <StockPreview label="Source after transfer" record={srcRec} product={product} hubName={src.name} delta={{ dTotal: -q }} /> : <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">Select a product and source hub to preview.</p>}
          {product && dest && <StockPreview label="Destination after transfer" record={destRec} product={product} hubName={dest.name} delta={{ dTotal: q }} />}
        </div>
        <div className="lg:col-span-3">
          <FormActions note="Cancelled and draft transfers never change stock.">
            <Button variant="secondary" to="/inventory/stock-transfers">Cancel</Button>
            <Button variant="secondary" icon={Save} onClick={saveDraft} loading={saving && !confirming}>Save as draft</Button>
            <Button type="submit" icon={CheckCircle2}>Review & complete</Button>
          </FormActions>
        </div>
      </form>
      <ConfirmDialog open={confirming} onClose={() => setConfirming(false)} onConfirm={confirm} loading={saving} title="Complete this transfer?" description="Stock will be reduced at the source and increased at the destination. Completed transfers cannot be cancelled." confirmLabel="Complete transfer">
        {product && src && dest && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 p-4 text-sm">
            <div><p className="text-xs text-muted">From</p><p className="font-medium">{src.name}</p></div>
            <div className="text-center"><ArrowRight className="mx-auto text-muted" size={18} /><p className="font-semibold tabular">{formatNumber(q)} {product.unit}</p></div>
            <div className="text-right"><p className="text-xs text-muted">To</p><p className="font-medium">{dest.name}</p></div>
          </div>
        )}
        {product && <p className="mt-3 text-sm text-muted">{product.name}</p>}
      </ConfirmDialog>
    </>
  )
}

export default function TransferCreate() {
  const [params] = useSearchParams()
  const { transfers } = useMasterData()
  const editId = params.get('edit')
  if (!editId) return <TransferForm key="new" />
  const draft = transfers.find((t) => t.id === editId)
  if (!draft) return <NotFoundRecord entity="transfer" backTo="/inventory/stock-transfers" backLabel="Back to transfers" />
  if (draft.status !== TRANSFER_STATUS.DRAFT) return <NotFoundRecord entity="draft transfer" backTo="/inventory/stock-transfers" backLabel="Back to transfers" />
  return <TransferForm key={draft.id} draft={draft} />
}
