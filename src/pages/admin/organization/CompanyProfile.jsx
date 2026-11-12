import { useRef, useState } from 'react'
import { Building2, Save, Undo2, Upload, Trash2, Landmark, MapPin, Globe2 } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../../components/common/PageHeader'
import Card, { CardHeader } from '../../../components/common/Card'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import { useStoredValue } from '../../../hooks/useLocalStorage'
import { usePermission } from '../../../hooks/usePermission'
import { saveCompany } from '../../../services/organizationService'
import { OPTIONS } from '../../../services/appSettingsService'
import { STORAGE_KEYS } from '../../../utils/constants'
import { formatDateTime } from '../../../utils/formatters'

const MAX_LOGO_BYTES = 300 * 1024

const fromCompany = (c) => ({
  name: c?.name || '', legalName: c?.legalName || '', tagline: c?.tagline || '', logo: c?.logo || null,
  addressLine1: c?.addressLine1 || '', addressLine2: c?.addressLine2 || '', city: c?.city || '', region: c?.region || '', postalCode: c?.postalCode || '',
  country: c?.country || 'United Arab Emirates', currency: c?.currency || 'AED', timezone: c?.timezone || 'Asia/Dubai',
  phone: c?.phone || '', email: c?.email || '', website: c?.website || '',
  taxRegistrationLabel: c?.taxRegistrationLabel || 'TRN', taxRegistrationNumber: c?.taxRegistrationNumber || '', tradeLicenseNumber: c?.tradeLicenseNumber || '',
})

/** Organization › Company: identity, logo, address, country, currency and tax registration. */
export default function CompanyProfile() {
  const company = useStoredValue(STORAGE_KEYS.COMPANY, null)
  const canManage = usePermission('organization.manage')
  const [form, setForm] = useState(() => fromCompany(company))
  const [errors, setErrors] = useState({})
  const [confirm, setConfirm] = useState(false)
  const fileRef = useRef(null)
  const dirty = JSON.stringify(form) !== JSON.stringify(fromCompany(company))
  const ro = !canManage
  const identityChange = company && ['country', 'currency', 'timezone'].some((k) => form[k] !== company[k])

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })) }
  const onLogo = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) return toast.error('Use a PNG, JPG, SVG or WebP image.')
    if (file.size > MAX_LOGO_BYTES) return toast.error('Logo must be 300 KB or smaller (it is stored in the browser).')
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, logo: String(reader.result) }))
    reader.onerror = () => toast.error('This image could not be read.')
    reader.readAsDataURL(file)
  }
  const save = () => {
    const res = saveCompany(form)
    setConfirm(false)
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success('Company profile saved')
  }
  const onSubmit = (e) => { e.preventDefault(); if (identityChange) setConfirm(true); else save() }

  return (
    <>
      <PageHeader title="Company" description="Legal identity used on documents and as the organisation's localization defaults." actions={company?.updatedAt && <span className="text-xs text-muted">Last updated {formatDateTime(company.updatedAt)}</span>} />
      <form onSubmit={onSubmit} noValidate className="space-y-6 max-w-5xl">
        <Card>
          <CardHeader title="Identity" icon={Building2} />
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="shrink-0">
              <p className="text-sm font-medium text-ink">Company logo</p>
              <div className="mt-2 grid h-28 w-28 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-surface-2">
                {form.logo ? <img src={form.logo} alt="Company logo" className="max-h-full max-w-full object-contain" /> : <Building2 size={28} className="text-muted" aria-hidden />}
              </div>
              {!ro && (
                <div className="mt-2 flex gap-1.5">
                  <Button type="button" size="xs" variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>Upload</Button>
                  {form.logo && <Button type="button" size="xs" variant="ghost" icon={Trash2} onClick={() => setForm((f) => ({ ...f, logo: null }))}>Remove</Button>}
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" onChange={onLogo} aria-label="Upload company logo" />
                </div>
              )}
              {errors.logo && <p className="mt-1 text-xs text-danger">{errors.logo}</p>}
            </div>
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <Input label="Company name" value={form.name} onChange={set('name')} error={errors.name} required disabled={ro} />
              <Input label="Registered legal name" value={form.legalName} onChange={set('legalName')} error={errors.legalName} required disabled={ro} />
              <Input label="Tagline" value={form.tagline} onChange={set('tagline')} disabled={ro} className="sm:col-span-2" />
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Address & contact" icon={MapPin} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Address line 1" value={form.addressLine1} onChange={set('addressLine1')} error={errors.addressLine1} required disabled={ro} className="lg:col-span-2" />
            <Input label="Address line 2 / PO Box" value={form.addressLine2} onChange={set('addressLine2')} disabled={ro} />
            <Input label="City" value={form.city} onChange={set('city')} error={errors.city} required disabled={ro} />
            <Input label="Emirate / region" value={form.region} onChange={set('region')} disabled={ro} />
            <Input label="Postal code" value={form.postalCode} onChange={set('postalCode')} disabled={ro} hint="Optional in the UAE" />
            <Input label="Phone" value={form.phone} onChange={set('phone')} error={errors.phone} disabled={ro} placeholder="+971 4 555 0100" />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} disabled={ro} />
            <Input label="Website" value={form.website} onChange={set('website')} disabled={ro} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Country, currency & timezone" subtitle="Organisation defaults used by every formatter (display only — amounts are not converted)" icon={Globe2} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Country" value={form.country} onChange={set('country')} error={errors.country} required disabled={ro} options={OPTIONS.country.map((c) => ({ value: c, label: c }))} />
            <Select label="Base currency" value={form.currency} onChange={set('currency')} error={errors.currency} required disabled={ro} options={OPTIONS.currency} />
            <Select label="Timezone" value={form.timezone} onChange={set('timezone')} error={errors.timezone} required disabled={ro} options={OPTIONS.timezone} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Tax & registration" icon={Landmark} action={<Badge tone="neutral">Recorded only — no tax filing</Badge>} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Tax number label" value={form.taxRegistrationLabel} onChange={set('taxRegistrationLabel')} disabled={ro} options={[{ value: 'TRN', label: 'TRN (UAE VAT)' }, { value: 'VAT No.', label: 'VAT No.' }, { value: 'GSTIN', label: 'GSTIN (India)' }, { value: 'Tax ID', label: 'Tax ID' }]} />
            <Input label="Tax registration number" value={form.taxRegistrationNumber} onChange={set('taxRegistrationNumber')} error={errors.taxRegistrationNumber} required disabled={ro} hint={form.country === 'United Arab Emirates' ? '15 digits' : undefined} inputMode="numeric" />
            <Input label="Trade licence number" value={form.tradeLicenseNumber} onChange={set('tradeLicenseNumber')} disabled={ro} />
          </div>
          <p className="mt-3 text-xs text-muted">The prototype stores these details for documents and display. It does not validate them with the tax authority or claim tax compliance.</p>
        </Card>
        {!ro && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" icon={Undo2} disabled={!dirty} onClick={() => { setForm(fromCompany(company)); setErrors({}) }}>Discard</Button>
            <Button type="submit" icon={Save} disabled={!dirty}>Save company</Button>
          </div>
        )}
      </form>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={save} confirmLabel="Save company"
        title="Change country, currency or timezone?" description="Amounts, dates and times across the app are displayed with the new settings. Stored amounts are not converted between currencies." />
    </>
  )
}
