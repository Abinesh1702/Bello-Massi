import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Package, Settings2, IndianRupee, Boxes, Save, X, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import FormSection, { FormActions } from '../../components/common/FormSection'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Toggle from '../../components/common/Toggle'
import Button from '../../components/common/Button'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import ImagePicker from '../../components/masterdata/ImagePicker'
import { useMasterData } from '../../hooks/useMasterData'
import { useFormState } from '../../hooks/useFormState'
import { createProduct, emptyProduct, getProductById, updateProduct } from '../../services/productService'
import { OPTIONS } from '../../config/masterData'
import { currencySymbol, formatCurrency, formatDateTime, formatPercent } from '../../utils/formatters'

const toForm = (p) => ({
  ...p,
  sellingPrice: String(p.sellingPrice), purchasePrice: String(p.purchasePrice), taxPercent: String(p.taxPercent),
  maxDiscountPercent: String(p.maxDiscountPercent || ''), minStockLevel: String(p.minStockLevel), reorderLevel: String(p.reorderLevel),
  maxStockLevel: p.maxStockLevel ? String(p.maxStockLevel) : '',
})

function ProductFormInner({ existing }) {
  const navigate = useNavigate()
  const f = useFormState(existing ? toForm(existing) : emptyProduct())
  const [saving, setSaving] = useState(false)
  const v = f.values
  const sell = Number(v.sellingPrice) || 0
  const buy = Number(v.purchasePrice) || 0
  const margin = sell > 0 ? ((sell - buy) / sell) * 100 : 0

  const onSubmit = (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const res = existing ? updateProduct(existing.id, v) : createProduct(v)
    setSaving(false)
    if (!res.ok) {
      f.fail(res.errors)
      const n = Object.keys(res.errors).length
      toast.error(res.errors.form || `Please fix ${n} field${n === 1 ? '' : 's'} before saving.`)
      return
    }
    toast.success(existing ? 'Product updated' : 'Product created', { description: `${res.record.name} (${res.record.code})` })
    navigate(`/products/${res.record.id}`, { replace: true })
  }

  const cancelTo = existing ? `/products/${existing.id}` : '/products'
  return (
    <>
      <PageHeader
        title={existing ? `Edit ${existing.name}` : 'Add product'}
        description={existing ? `${existing.code} · created ${formatDateTime(existing.createdAt)} · updated ${formatDateTime(existing.updatedAt)}` : 'Create a product with pricing and inventory rules.'}
        actions={<Button variant="secondary" icon={X} to={cancelTo}>Cancel</Button>}
      />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <FormSection title="Basic information" icon={Package} columns={3}>
          <div className="sm:col-span-2 lg:col-span-3"><ImagePicker product={v} onChange={(img) => f.setValue('image', img)} /></div>
          <Input label="Product ID" value={existing?.id || 'Generated on save'} readOnly />
          <Input label="Product code" required {...f.bind('code')} maxLength={20} hint="Unique, e.g. PRD-0031" />
          <Input label="Product name" required {...f.bind('name')} maxLength={80} />
          <Select label="Category" required {...f.bind('category')} options={OPTIONS.productCategories} />
          <Input label="Brand" {...f.bind('brand')} maxLength={40} />
          <Select label="Status" required {...f.bind('status')} options={OPTIONS.productStatuses} />
          <Textarea label="Description" {...f.bind('description')} rows={2} className="sm:col-span-2 lg:col-span-3" maxLength={400} />
        </FormSection>

        <FormSection title="Product configuration" icon={Settings2} columns={3}>
          <Input label="SKU" required {...f.bind('sku')} maxLength={30} hint="Unique stock-keeping unit" />
          <Input label="Barcode" {...f.bind('barcode')} inputMode="numeric" maxLength={14} hint="EAN/UPC, 8–14 digits" />
          <Select label="Unit of measurement" required {...f.bind('unit')} options={OPTIONS.units} />
          <Input label="Pack size" {...f.bind('packSize')} placeholder="10 × 1 kg" maxLength={40} />
          <Select label="Product type" required {...f.bind('productType')} options={OPTIONS.productTypes}
            onChange={(e) => { f.setValue('productType', e.target.value); if (e.target.value === 'Service') f.setValue('trackInventory', false) }} />
          <Select label="Storage condition" {...f.bind('storageCondition')} options={OPTIONS.storageConditions} />
        </FormSection>

        <FormSection title="Pricing" icon={IndianRupee} columns={3}>
          <Input label={`Selling price (${currencySymbol()})`} type="number" min="0" step="0.01" required {...f.bind('sellingPrice')} />
          <Input label={`Purchase price (${currencySymbol()})`} type="number" min="0" step="0.01" required {...f.bind('purchasePrice')} />
          <Select label="Tax (GST %)" required {...f.bind('taxPercent')} options={OPTIONS.taxRates} />
          <Toggle className="sm:col-span-2" label="Discount allowed" description="Salesmen may offer a discount up to the maximum." {...f.bindToggle('discountAllowed')} />
          {v.discountAllowed ? <Input label="Maximum discount (%)" type="number" min="0" max="100" step="0.5" required {...f.bind('maxDiscountPercent')} /> : <div />}
          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-3 gap-3 rounded-xl bg-surface-2 p-3 text-sm">
            <div><p className="text-xs text-muted">Price incl. GST</p><p className="font-semibold tabular">{formatCurrency(sell * (1 + (Number(v.taxPercent) || 0) / 100))}</p></div>
            <div><p className="text-xs text-muted">Gross margin</p><p className={`font-semibold tabular ${margin < 0 ? 'text-danger' : ''}`}>{formatPercent(margin, 1)}</p></div>
            <div><p className="text-xs text-muted">Margin per {v.unit}</p><p className="font-semibold tabular">{formatCurrency(sell - buy)}</p></div>
          </div>
        </FormSection>

        <FormSection title="Inventory configuration" icon={Boxes} columns={4} description="Defaults for new hub stock lines. Each hub can override its reorder level.">
          <Toggle className="sm:col-span-2 lg:col-span-4" label="Track inventory" description={v.productType === 'Service' ? 'Service products are never stocked.' : 'Keep stock quantities for this product at every hub.'}
            checked={v.trackInventory} onChange={(on) => f.setValue('trackInventory', on)} />
          {f.errors.trackInventory && <p className="sm:col-span-2 lg:col-span-4 text-xs text-danger -mt-2" role="alert">{f.errors.trackInventory}</p>}
          {v.trackInventory && (
            <>
              <Input label="Minimum stock" type="number" min="0" required {...f.bind('minStockLevel')} />
              <Input label="Reorder level" type="number" min="0" required {...f.bind('reorderLevel')} hint="Low stock at or below this" />
              <Input label="Maximum stock" type="number" min="0" {...f.bind('maxStockLevel')} hint="Above this = overstock" />
              <div className="flex items-end"><Toggle className="w-full" label="Allow negative stock" description="Adjustments may take stock below zero." {...f.bindToggle('allowNegativeStock')} /></div>
            </>
          )}
        </FormSection>

        <FormSection title="Notes" icon={StickyNote} columns={1}>
          <Textarea label="Internal notes" {...f.bind('notes')} rows={2} maxLength={500} />
        </FormSection>

        <FormActions note={f.dirty ? 'You have unsaved changes.' : 'Fields marked * are required.'}>
          <Button variant="secondary" to={cancelTo}>Cancel</Button>
          <Button type="submit" icon={Save} loading={saving}>{existing ? 'Save changes' : 'Create product'}</Button>
        </FormActions>
      </form>
    </>
  )
}

export default function ProductForm() {
  const { id } = useParams()
  const { products } = useMasterData()
  if (!id) return <ProductFormInner key="new" />
  const existing = getProductById(id, products)
  if (!existing) return <NotFoundRecord entity="product" backTo="/products" backLabel="Back to products" />
  return <ProductFormInner key={existing.id} existing={existing} />
}
