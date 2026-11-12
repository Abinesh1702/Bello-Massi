import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Building2, Contact, MapPin, Briefcase, CreditCard, Crown, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import FormSection, { FormActions } from '../../components/common/FormSection'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Toggle from '../../components/common/Toggle'
import Button from '../../components/common/Button'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { CreditBadge } from '../../components/masterdata/Badges'
import Badge from '../../components/common/Badge'
import { useMasterData } from '../../hooks/useMasterData'
import { useFormState } from '../../hooks/useFormState'
import { createCustomer, emptyCustomer, getCreditInfo, getCustomerById, getVipStatus, updateCustomer, VIP_TONE } from '../../services/customerService'
import { OPTIONS } from '../../config/masterData'
import { currencySymbol, formatCurrency, formatPercent } from '../../utils/formatters'

const toForm = (c) => ({
  ...c,
  creditLimit: String(c.creditLimit ?? ''),
  creditBalance: String(c.creditBalance ?? '0'),
  creditDays: String(c.creditDays ?? ''),
})

function CustomerFormInner({ existing }) {
  const navigate = useNavigate()
  const { hubs, zones, salesReps } = useMasterData()
  const f = useFormState(existing ? toForm(existing) : emptyCustomer())
  const [saving, setSaving] = useState(false)
  const v = f.values

  const credit = getCreditInfo({ creditEnabled: v.creditEnabled, creditLimit: Number(v.creditLimit) || 0, creditBalance: Number(v.creditBalance) || 0 })
  const vipStatus = getVipStatus(v)
  const hubOptions = useMemo(() => hubs.filter((h) => h.status === 'Active' || h.id === v.hubId).map((h) => ({ value: h.id, label: `${h.name}${h.status === 'Active' ? '' : ' (inactive)'}` })), [hubs, v.hubId])
  const zoneOptions = zones.filter((z) => z.hubId === v.hubId && (z.status === 'Active' || z.id === v.zoneId)).map((z) => ({ value: z.id, label: z.name }))

  const onSubmit = (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const res = existing ? updateCustomer(existing.id, v) : createCustomer(v)
    setSaving(false)
    if (!res.ok) {
      f.fail(res.errors)
      const count = Object.keys(res.errors).length
      toast.error(res.errors.form || `Please fix ${count} field${count === 1 ? '' : 's'} before saving.`)
      return
    }
    toast.success(existing ? 'Customer updated' : 'Customer created', { description: `${res.record.name} (${res.record.code})` })
    navigate(`/customers/${res.record.id}`, { replace: true })
  }

  const cancelTo = existing ? `/customers/${existing.id}` : '/customers'
  return (
    <>
      <PageHeader
        title={existing ? `Edit ${existing.name}` : 'Add customer'}
        description={existing ? `${existing.code} · last updated ${new Date(existing.updatedAt).toLocaleDateString('en-IN')}` : 'Create a customer account with contact, address, credit and VIP details.'}
        actions={<Button variant="secondary" icon={X} to={cancelTo}>Cancel</Button>}
      />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <FormSection title="Basic information" icon={Building2} columns={3}>
          <Input label="Customer ID" value={existing?.id || 'Generated on save'} readOnly hint="Assigned automatically" />
          <Input label="Customer code" required {...f.bind('code')} maxLength={20} hint="Unique, e.g. CUS-021" />
          <Input label="Customer name" required {...f.bind('name')} maxLength={80} />
          <Input label="Business name" {...f.bind('businessName')} maxLength={100} hint="Registered / legal name" />
          <Select label="Customer type" required {...f.bind('type')} options={OPTIONS.customerTypes} />
          <Select label="Customer category" {...f.bind('category')} placeholder="Select category" options={OPTIONS.customerCategories} />
          <Input label="GST number" {...f.bind('gstNumber')} maxLength={15} placeholder="33ABCDE1234F1Z5" className="uppercase-input" />
          <Input label="PAN number" {...f.bind('panNumber')} maxLength={10} placeholder="ABCDE1234F" />
        </FormSection>

        <FormSection title="Contact" icon={Contact} columns={2}>
          <Input label="Contact person" required {...f.bind('contactPerson')} maxLength={60} />
          <Input label="Email" type="email" {...f.bind('email')} autoComplete="off" />
          <Input label="Mobile number" required {...f.bind('mobile')} inputMode="tel" placeholder="+91 98400 12345" />
          <Input label="Alternate mobile" {...f.bind('altMobile')} inputMode="tel" />
        </FormSection>

        <FormSection title="Address" icon={MapPin} columns={3}>
          <Input label="Address line 1" required {...f.bind('addressLine1')} className="sm:col-span-2 lg:col-span-2" />
          <Input label="Address line 2" {...f.bind('addressLine2')} />
          <Input label="City" required {...f.bind('city')} />
          <Select label="State" required {...f.bind('state')} options={OPTIONS.states} />
          <Input label="Pincode" required {...f.bind('pincode')} inputMode="numeric" maxLength={6} />
          <Input label="Country" {...f.bind('country')} />
        </FormSection>

        <FormSection title="Business information" icon={Briefcase} columns={3}>
          <Select label="Customer status" required {...f.bind('status')} options={OPTIONS.customerStatuses} hint={v.status === 'Blocked' ? 'Blocked customers cannot place new orders.' : undefined} />
          <Input label="Customer since" type="date" {...f.bind('customerSince')} max={new Date().toISOString().slice(0, 10)} />
          <Select label="Assigned salesman" {...f.bind('salesRepId')} placeholder="Unassigned" options={salesReps.map((r) => ({ value: r.id, label: r.name }))} />
          <Select label="Preferred hub" required {...f.bind('hubId')} placeholder="Select hub" options={hubOptions} onChange={(e) => { f.setValue('hubId', e.target.value); f.setValue('zoneId', '') }} />
          <Select label="Delivery zone" {...f.bind('zoneId')} placeholder={v.hubId ? (zoneOptions.length ? 'Select zone' : 'No zones for this hub') : 'Select a hub first'} options={zoneOptions} disabled={!zoneOptions.length} />
          <Textarea label="Notes" {...f.bind('notes')} rows={2} className="sm:col-span-2 lg:col-span-3" maxLength={500} />
        </FormSection>

        <FormSection
          title="Credit configuration"
          icon={CreditCard}
          description="Phase 2 manages credit configuration only. Credit transactions and invoices are not posted here."
          aside={<CreditBadge status={credit.status} />}
          columns={3}
        >
          <Toggle className="sm:col-span-2 lg:col-span-3" label="Credit enabled" description="Allow this customer to buy on credit up to a limit." {...f.bindToggle('creditEnabled')} />
          {v.creditEnabled && (
            <>
              <Input label={`Credit limit (${currencySymbol()})`} type="number" min="0" step="1000" required {...f.bind('creditLimit')} />
              {existing
                ? <Input label={`Outstanding balance (${currencySymbol()})`} type="number" value={v.creditBalance} disabled readOnly hint="Maintained by invoices, receipts and credit notes (Finance)." />
                : <Input label={`Opening balance (${currencySymbol()})`} type="number" min="0" step="1" {...f.bind('creditBalance')} hint="Amount already owed when the customer is created. Afterwards invoices and receipts update it." />}
              <Input label="Credit days" type="number" min="0" max="365" step="1" required {...f.bind('creditDays')} />
              <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-3 gap-3 rounded-xl bg-surface-2 p-3 text-sm">
                <div><p className="text-xs text-muted">Available credit</p><p className={`font-semibold tabular ${credit.available < 0 ? 'text-danger' : 'text-ink'}`}>{formatCurrency(credit.available)}</p></div>
                <div><p className="text-xs text-muted">Utilisation</p><p className="font-semibold tabular text-ink">{formatPercent(credit.utilisation)}</p></div>
                <div><p className="text-xs text-muted">Credit status</p><p className="font-semibold text-ink">{credit.status}</p></div>
              </div>
            </>
          )}
        </FormSection>

        <FormSection title="VIP" icon={Crown} description="Optional. VIP customers can hold a pass with an expiry date." aside={<Badge tone={VIP_TONE[vipStatus]}>{v.isVip ? `Pass ${vipStatus}` : 'Not VIP'}</Badge>} columns={3}>
          <Toggle className="sm:col-span-2 lg:col-span-3" label="VIP customer" description="Turn off to treat as a normal customer." checked={v.isVip} onChange={(on) => { f.setValue('isVip', on); if (!on) f.setValue('vipPassEnabled', false) }} />
          {v.isVip && (
            <>
              <Toggle className="sm:col-span-2 lg:col-span-3" label="VIP pass enabled" description="A pass needs a number and an expiry date. Expired passes are detected automatically." {...f.bindToggle('vipPassEnabled')} />
              {v.vipPassEnabled && (
                <>
                  <Input label="VIP pass number" required {...f.bind('vipPassNumber')} placeholder="VIP-2026-0040" maxLength={20} />
                  <Input label="VIP pass expiry" type="date" required {...f.bind('vipPassExpiry')} />
                  <div className="flex items-end pb-1"><p className="text-sm text-muted">Pass status: <strong className="text-ink">{vipStatus}</strong></p></div>
                </>
              )}
            </>
          )}
        </FormSection>

        <FormActions note={f.dirty ? 'You have unsaved changes.' : 'Fields marked * are required.'}>
          <Button variant="secondary" to={cancelTo}>Cancel</Button>
          <Button type="submit" icon={Save} loading={saving}>{existing ? 'Save changes' : 'Create customer'}</Button>
        </FormActions>
      </form>
    </>
  )
}

export default function CustomerForm() {
  const { id } = useParams()
  const { customers } = useMasterData()
  if (!id) return <CustomerFormInner key="new" />
  const existing = getCustomerById(id, customers)
  if (!existing) return <NotFoundRecord entity="customer" backTo="/customers" backLabel="Back to customers" />
  return <CustomerFormInner key={existing.id} existing={existing} />
}
