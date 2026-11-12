import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PackagePlus, X, CheckCircle2 } from 'lucide-react'
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
import { createStockReceipt, nextReceiptNumber, validateReceipt } from '../../services/inventoryService'
import { formatNumber } from '../../utils/formatters'
import { getWarehouseConfig } from '../../config/runtimeConfig'

export const stockableProductOptions = (products) =>
  products.filter((p) => p.trackInventory && p.status === 'Active').sort((a, b) => a.name.localeCompare(b.name)).map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))

export default function ReceiptCreate() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { hubs, products, inventory, lookups } = useMasterData()
  const f = useFormState({
    receiptDate: dayjs().format('YYYY-MM-DD'),
    hubId: params.get('hubId') || getWarehouseConfig().defaultReceivingHubId || '',
    productId: params.get('productId') || '',
    quantity: params.get('quantity') || '',
    // Prefilled when arriving from an approved replenishment (Phase 6) so the receipt links back to it
    referenceNumber: params.get('reference') || '',
    notes: '',
  })
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const v = f.values
  const product = lookups.products[v.productId]
  const hub = lookups.hubs[v.hubId]
  const record = inventory.find((r) => r.productId === v.productId && r.hubId === v.hubId) || null
  const q = Number(v.quantity) || 0
  const number = useMemo(() => nextReceiptNumber(), [inventory]) // eslint-disable-line react-hooks/exhaustive-deps

  const review = (e) => {
    e.preventDefault()
    const errors = validateReceipt(v)
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
    const res = createStockReceipt(v)
    setSaving(false)
    setConfirming(false)
    if (!res.ok) {
      f.fail(res.errors)
      toast.error(res.errors.form || 'Receipt could not be saved.')
      return
    }
    toast.success(`Stock received · ${res.record.receiptNumber}`, { description: `${formatNumber(res.record.quantity)} ${product.unit} of ${product.name} added at ${hub.name}.` })
    navigate('/inventory/stock-receipts', { replace: true })
  }

  return (
    <>
      <PageHeader title="New stock receipt" description="Record goods received at a hub. Stock increases when you confirm." actions={<Button variant="secondary" icon={X} to="/inventory/stock-receipts">Cancel</Button>} />
      <form onSubmit={review} noValidate className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <FormSection title="Receipt details" icon={PackagePlus} columns={2}>
            <Input label="Receipt number" value={number} readOnly hint="Generated automatically" />
            <Input label="Receipt date" type="date" required max={dayjs().format('YYYY-MM-DD')} {...f.bind('receiptDate')} />
            <Select label="Hub" required placeholder="Select hub" {...f.bind('hubId')} options={hubs.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: h.name }))} />
            <Select label="Product" required placeholder="Select product" {...f.bind('productId')} options={stockableProductOptions(products)} />
            <Input label={`Quantity${product ? ` (${product.unit})` : ''}`} type="number" min="0" step={['KG', 'LTR', 'MTR'].includes(product?.unit) ? '0.01' : '1'} required {...f.bind('quantity')} />
            <Input label="Reference number" {...f.bind('referenceNumber')} placeholder="PO / supplier invoice no." maxLength={40} />
            <Textarea label="Notes" {...f.bind('notes')} rows={2} className="sm:col-span-2" maxLength={300} placeholder="Supplier, vehicle, batch or temperature notes" />
          </FormSection>
        </div>
        <div className="space-y-4">
          {product && hub ? (
            <StockPreview label="After receipt" record={record} product={product} hubName={hub.name} delta={{ dTotal: q }} />
          ) : (
            <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">Select a hub and product to preview the stock change.</p>
          )}
        </div>
        <div className="lg:col-span-3">
          <FormActions note="Receipts cannot be edited after confirmation. Correct mistakes with a stock adjustment.">
            <Button variant="secondary" to="/inventory/stock-receipts">Cancel</Button>
            <Button type="submit" icon={CheckCircle2}>Review & confirm</Button>
          </FormActions>
        </div>
      </form>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={confirm}
        loading={saving}
        title="Confirm stock receipt"
        description="Stock will be added to the hub and a movement record created."
        confirmLabel="Confirm receipt"
      >
        {product && hub && (
          <InfoList items={[
            { label: 'Receipt', value: number },
            { label: 'Date', value: v.receiptDate },
            { label: 'Hub', value: hub.name },
            { label: 'Product', value: product.name },
            { label: 'Quantity', value: <strong>+{formatNumber(q)} {product.unit}</strong> },
            { label: 'Reference', value: v.referenceNumber },
          ]} />
        )}
      </ConfirmDialog>
    </>
  )
}
