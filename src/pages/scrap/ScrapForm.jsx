import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { PackageX, Save, Send, Camera, Paperclip, X, Boxes } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import FormSection, { FormActions } from '../../components/common/FormSection'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import InfoList from '../../components/common/InfoList'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { useMasterData } from '../../hooks/useMasterData'
import { useFormState } from '../../hooks/useFormState'
import { useAuth } from '../../hooks/useAuth'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../utils/constants'
import {
  eligibleFor, nextScrapNumber, PHOTO_REQUIRED_REASONS, readScrapFile, saveScrap, SCRAP_REASONS, SCRAP_STATUS, STOCK_SOURCES,
} from '../../services/scrapService'
import { formatCurrency, formatNumber, formatBytes } from '../../utils/formatters'
import { useScrapRequests } from './ScrapPages'

const EMPTY = []

export default function ScrapForm() {
  const { id } = useParams()
  const list = useScrapRequests()
  const existing = id ? list.find((r) => r.id === id) : null
  if (id && !existing) return <NotFoundRecord entity="scrap request" backTo="/inventory/scrap/requests" />
  if (existing && existing.status !== SCRAP_STATUS.DRAFT) return <NotFoundRecord entity="draft scrap request" backTo={`/inventory/scrap/requests/${existing.id}`} backLabel="Back to request" />
  return <ScrapFormInner key={id || 'new'} existing={existing} />
}

function ScrapFormInner({ existing }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { products, hubs, inventory, lookups } = useMasterData()
  const warehouses = useStoredValue(STORAGE_KEYS.ORGANIZATION, null)?.warehouses || EMPTY
  const f = useFormState(existing ? {
    productId: existing.productId, hubId: existing.hubId, warehouseId: existing.warehouseId || '', batchNumber: existing.batchNumber, stockSource: existing.stockSource,
    quantity: String(existing.quantity), reason: existing.reason, remarks: existing.remarks, requestDate: existing.requestDate, photos: existing.photos, documents: existing.documents,
  } : {
    productId: params.get('productId') || '', hubId: params.get('hubId') || user?.hubId || '', warehouseId: '', batchNumber: '', stockSource: 'available',
    quantity: '', reason: '', remarks: '', requestDate: dayjs().format('YYYY-MM-DD'), photos: [], documents: [],
  })
  const [saving, setSaving] = useState(null)
  const v = f.values
  const product = lookups.products[v.productId]
  const number = useMemo(() => existing?.scrapNumber || nextScrapNumber(), [existing])
  const elig = useMemo(() => (v.productId && v.hubId ? eligibleFor({ productId: v.productId, hubId: v.hubId, source: v.stockSource }, existing?.id) : null), [v.productId, v.hubId, v.stockSource, existing, inventory]) // eslint-disable-line react-hooks/exhaustive-deps
  const q = Number(v.quantity) || 0
  const value = product ? Math.round(q * (Number(product.purchasePrice) || 0) * 100) / 100 : 0
  const hubWarehouses = warehouses.filter((w) => w.hubId === v.hubId && w.status !== 'inactive')

  const addFiles = async (field, files, images) => {
    const picked = [...files].slice(0, 4 - (v[field] || []).length)
    if (!picked.length) { toast.error('You can attach up to 4 files here.'); return }
    try {
      const read = await Promise.all(picked.map((file) => {
        if (images && !file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`)
        if (!images && file.size > 300 * 1024) throw new Error(`${file.name} is larger than 300 KB.`)
        return readScrapFile(file)
      }))
      f.setValue(field, [...(v[field] || []), ...read])
    } catch (err) {
      toast.error(err.message)
    }
  }

  const save = (submit) => {
    setSaving(submit ? 'submit' : 'draft')
    const res = saveScrap(v, { id: existing?.id, submit })
    setSaving(null)
    if (!res.ok) {
      f.fail(res.errors || {})
      toast.error(res.error)
      return
    }
    toast.success(submit ? `${res.record.scrapNumber} submitted for approval` : `${res.record.scrapNumber} saved as draft`)
    navigate(`/inventory/scrap/requests/${res.record.id}`)
  }

  return (
    <>
      <PageHeader title={existing ? `Edit ${existing.scrapNumber}` : 'New scrap request'} description="Request a write-off for expired, damaged or rejected stock. Stock is only reduced after approval." />
      <form onSubmit={(e) => { e.preventDefault(); save(true) }} noValidate className="space-y-6">
        <FormSection title="Stock to scrap" icon={PackageX} description="Choose the stock line; the eligible quantity already excludes reserved stock and other open scrap requests."
          aside={<InfoList columns={1} items={[
            { label: 'Scrap number', value: <span className="tabular">{number}</span> },
            { label: 'Requested by', value: existing?.requestedByName || user?.name },
            { label: 'Category', value: product?.category },
            { label: 'Unit of measure', value: product?.unit },
          ]} />}>
          <Select label="Product" required placeholder="Select a product" options={products.filter((p) => p.status !== 'Inactive' || p.id === v.productId).map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))} {...f.bind('productId')} />
          <Input label="Batch number" required={Boolean(product?.batchControlled)} hint={product?.batchControlled ? 'Required — this product is batch-controlled.' : 'Optional — this product is not batch-controlled.'} maxLength={40} {...f.bind('batchNumber')} />
          <Select label="Hub" required placeholder="Select a hub" options={hubs.map((h) => ({ value: h.id, label: h.name }))} {...f.bind('hubId')} onChange={(e) => { f.setValue('hubId', e.target.value); f.setValue('warehouseId', '') }} />
          <Select label="Warehouse / store" placeholder={hubWarehouses.length ? 'Not specified' : 'No warehouses set up for this hub'} options={hubWarehouses.map((w) => ({ value: w.id, label: w.name }))} {...f.bind('warehouseId')} />
          <Select label="Stock source" required options={STOCK_SOURCES} {...f.bind('stockSource')} hint="Damaged stock was moved to quarantine by a stock adjustment." />
          <Input label={`Quantity${product ? ` (${product.unit})` : ''}`} required type="number" min="0" step="any" inputMode="decimal" {...f.bind('quantity')}
            hint={elig ? `Eligible: ${formatNumber(elig.eligible)} ${product?.unit || ''}${elig.committed ? ` · ${formatNumber(elig.committed)} in other open requests` : ''}` : 'Select a product and hub to see eligible stock.'} />
          {elig && (
            <div className="sm:col-span-2 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted"><Boxes size={14} aria-hidden />{v.stockSource === 'damaged' ? 'Damaged stock' : 'Available stock'}: <strong className="text-ink tabular">{formatNumber(elig.onHand)}</strong></span>
              <span className="text-muted">Eligible: <strong className="text-ink tabular">{formatNumber(elig.eligible)}</strong></span>
              <span className="text-muted">Scrap value: <strong className="text-ink tabular">{formatCurrency(value)}</strong> <span className="text-xs">at {formatCurrency(product?.purchasePrice || 0)} / {product?.unit}</span></span>
            </div>
          )}
        </FormSection>

        <FormSection title="Reason & evidence" icon={Camera} description={`Photo proof is required for: ${PHOTO_REQUIRED_REASONS.join(', ')}. Images are resized and kept in this browser only.`}>
          <Select label="Scrap reason" required placeholder="Select a reason" options={SCRAP_REASONS.map((r) => ({ value: r, label: r }))} {...f.bind('reason')} />
          <Input label="Request date" required type="date" max={dayjs().format('YYYY-MM-DD')} {...f.bind('requestDate')} />
          <Textarea label="Remarks" required={v.reason === 'Other'} rows={3} maxLength={500} className="sm:col-span-2" {...f.bind('remarks')} />
          <FileField label="Photo proof" icon={Camera} accept="image/*" files={v.photos} error={f.errors.photos} onAdd={(files) => addFiles('photos', files, true)} onRemove={(i) => f.setValue('photos', v.photos.filter((_, x) => x !== i))} />
          <FileField label="Supporting documents" icon={Paperclip} accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.csv,.txt" files={v.documents} hint="QA report, temperature log… up to 300 KB each." onAdd={(files) => addFiles('documents', files, false)} onRemove={(i) => f.setValue('documents', v.documents.filter((_, x) => x !== i))} />
        </FormSection>

        <FormActions note="Submitting sends the request to a Warehouse Manager or Administrator for approval. Stock is not reduced until it is approved and written off.">
          <Button variant="secondary" onClick={() => navigate(existing ? `/inventory/scrap/requests/${existing.id}` : '/inventory/scrap')}>Cancel</Button>
          <Button variant="secondary" icon={Save} loading={saving === 'draft'} onClick={() => save(false)}>Save draft</Button>
          <Button type="submit" icon={Send} loading={saving === 'submit'}>Submit for approval</Button>
        </FormActions>
      </form>
    </>
  )
}

function FileField({ label, icon: Icon, accept, files = [], onAdd, onRemove, error, hint }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-ink mb-1.5">{label}</p>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 py-3 text-sm text-muted hover:border-brand hover:text-ink">
        <Icon size={16} aria-hidden /> Add {label.toLowerCase()}
        <input type="file" multiple accept={accept} className="sr-only" aria-invalid={Boolean(error) || undefined} onChange={(e) => { onAdd(e.target.files); e.target.value = '' }} />
      </label>
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-line px-2 py-1.5 text-sm">
              {file.type?.startsWith('image/') ? <img src={file.dataUrl} alt="" className="h-8 w-8 rounded object-cover" /> : <Paperclip size={14} className="text-muted" aria-hidden />}
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted">{formatBytes(file.size)}</span>
              <button type="button" onClick={() => onRemove(i)} className="rounded p-1 text-muted hover:text-danger" aria-label={`Remove ${file.name}`}><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
