import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Warehouse, UserRound, MapPin, Snowflake, Save, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import FormSection, { FormActions } from '../../components/common/FormSection'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { useMasterData } from '../../hooks/useMasterData'
import { useFormState } from '../../hooks/useFormState'
import { createHub, emptyHub, getHubById, updateHub } from '../../services/hubService'
import { OPTIONS } from '../../config/masterData'
import { formatNumber } from '../../utils/formatters'

function HubFormInner({ existing, stockUnits }) {
  const navigate = useNavigate()
  const f = useFormState(existing ? { ...existing, capacityPallets: String(existing.capacityPallets ?? ''), coldRooms: String(existing.coldRooms ?? '') } : emptyHub())
  const [saving, setSaving] = useState(false)
  const v = f.values

  const onSubmit = (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const res = existing ? updateHub(existing.id, v) : createHub(v)
    setSaving(false)
    if (!res.ok) {
      f.fail(res.errors)
      const n = Object.keys(res.errors).length
      toast.error(res.errors.form || `Please fix ${n} field${n === 1 ? '' : 's'} before saving.`)
      return
    }
    toast.success(existing ? 'Hub updated' : 'Hub created', { description: `${res.record.name} (${res.record.code})` })
    navigate(`/hubs/${res.record.id}`, { replace: true })
  }

  const cancelTo = existing ? `/hubs/${existing.id}` : '/hubs'
  return (
    <>
      <PageHeader title={existing ? `Edit ${existing.name}` : 'Add hub'} description={existing ? existing.code : 'Register a new hub or warehouse.'} actions={<Button variant="secondary" icon={X} to={cancelTo}>Cancel</Button>} />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <FormSection title="Hub details" icon={Warehouse} columns={3}>
          <Input label="Hub ID" value={existing?.id || 'Generated on save'} readOnly />
          <Input label="Hub code" required {...f.bind('code')} maxLength={6} hint="2–6 letters/numbers, e.g. TRY" />
          <Input label="Hub name" required {...f.bind('name')} maxLength={60} />
          <Select label="Hub type" required {...f.bind('hubType')} options={OPTIONS.hubTypes} />
          <Select label="Hub status" required {...f.bind('status')} options={OPTIONS.hubStatuses} />
          <Input label="Operating hours" {...f.bind('operatingHours')} placeholder="Mon–Sat 06:00–21:00" maxLength={60} />
          {existing && v.status === 'Inactive' && stockUnits > 0 && (
            <p className="sm:col-span-2 lg:col-span-3 flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2.5 text-sm text-warning">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> This hub still holds {formatNumber(stockUnits)} units. Inactive hubs cannot receive stock, but you can still transfer stock out.
            </p>
          )}
        </FormSection>
        <FormSection title="Manager & contact" icon={UserRound} columns={3}>
          <Input label="Hub manager" required {...f.bind('managerName')} maxLength={60} />
          <Input label="Contact number" required {...f.bind('contactNumber')} inputMode="tel" placeholder="+91 44 2625 1100" />
          <Input label="Email" type="email" {...f.bind('email')} />
        </FormSection>
        <FormSection title="Location" icon={MapPin} columns={3}>
          <Input label="Address line 1" required {...f.bind('addressLine1')} className="sm:col-span-2" />
          <Input label="Address line 2" {...f.bind('addressLine2')} />
          <Input label="City" required {...f.bind('city')} />
          <Select label="State" required {...f.bind('state')} options={OPTIONS.states} />
          <Input label="Pincode" required {...f.bind('pincode')} inputMode="numeric" maxLength={6} />
          <Input label="Country" {...f.bind('country')} />
        </FormSection>
        <FormSection title="Capacity & notes" icon={Snowflake} columns={3}>
          <Input label="Pallet positions" type="number" min="0" step="1" {...f.bind('capacityPallets')} />
          <Input label="Cold rooms" type="number" min="0" step="1" {...f.bind('coldRooms')} />
          <div />
          <Textarea label="Notes" {...f.bind('notes')} rows={2} className="sm:col-span-2 lg:col-span-3" maxLength={500} />
        </FormSection>
        <FormActions note={f.dirty ? 'You have unsaved changes.' : 'Fields marked * are required.'}>
          <Button variant="secondary" to={cancelTo}>Cancel</Button>
          <Button type="submit" icon={Save} loading={saving}>{existing ? 'Save changes' : 'Create hub'}</Button>
        </FormActions>
      </form>
    </>
  )
}

export default function HubForm() {
  const { id } = useParams()
  const { hubs, inventory } = useMasterData()
  if (!id) return <HubFormInner key="new" />
  const existing = getHubById(id, hubs)
  if (!existing) return <NotFoundRecord entity="hub" backTo="/hubs" backLabel="Back to hubs" />
  const units = inventory.filter((r) => r.hubId === id).reduce((s, r) => s + r.totalQuantity, 0)
  return <HubFormInner key={existing.id} existing={existing} stockUnits={units} />
}
