import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapPinned, MapPin, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import FormSection, { FormActions } from '../../components/common/FormSection'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useFormState } from '../../hooks/useFormState'
import { createZone, emptyZone, getZoneById, parsePincodes, updateZone, zoneToInput } from '../../services/zoneService'
import { DISPATCH_OPTIONS } from '../../config/dispatchConfig'
import { OPTIONS } from '../../config/masterData'

function ZoneFormInner({ existing, hubs }) {
  const navigate = useNavigate()
  const f = useFormState(existing ? zoneToInput(existing) : emptyZone())
  const [saving, setSaving] = useState(false)
  const v = f.values
  const onHub = (e) => {
    const hub = hubs.find((h) => h.id === e.target.value)
    f.setValues((x) => ({ ...x, hubId: e.target.value, ...(hub && !x.city ? { city: hub.city, state: hub.state } : {}) }))
    f.clearError('hubId')
  }
  const onSubmit = (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const res = existing ? updateZone(existing.id, v) : createZone(v)
    setSaving(false)
    if (!res.ok) {
      f.fail(res.errors)
      toast.error(res.errors.form || `Please fix ${Object.keys(res.errors).length} field(s) before saving.`)
      return
    }
    toast.success(existing ? 'Zone updated' : 'Zone created', { description: `${res.record.name} (${res.record.code})` })
    navigate('/dispatch/zones', { replace: true })
  }
  const pins = parsePincodes(v.pincodes)
  return (
    <>
      <PageHeader title={existing ? `Edit ${existing.name}` : 'Add dispatch zone'} description={existing ? existing.code : 'Group delivery pincodes of one hub into a zone.'} actions={<Button variant="secondary" icon={X} to="/dispatch/zones">Cancel</Button>} />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <FormSection title="Zone details" icon={MapPinned} columns={3}>
          <Input label="Zone ID" value={existing?.id || 'Generated on save'} readOnly />
          <Input label="Zone code" required {...f.bind('code')} maxLength={12} hint="Unique, e.g. ZN-CHE-N" />
          <Input label="Zone name" required {...f.bind('name')} maxLength={60} />
          <Select label="Hub" required {...f.bind('hubId')} onChange={onHub} placeholder="Select hub" options={hubs.map((h) => ({ value: h.id, label: `${h.name}${h.status !== 'Active' ? ' (inactive)' : ''}` }))} />
          <Select label="Zone status" required {...f.bind('status')} options={DISPATCH_OPTIONS.zoneStatuses} hint={v.status === 'Inactive' ? 'Inactive zones cannot receive new dispatches.' : undefined} />
          <Input label="Zone manager" {...f.bind('managerName')} maxLength={60} />
          <Textarea label="Description" {...f.bind('description')} rows={2} className="sm:col-span-2 lg:col-span-3" maxLength={300} />
        </FormSection>
        <FormSection title="Coverage" icon={MapPin} columns={3}>
          <Input label="City" required {...f.bind('city')} />
          <Select label="State" {...f.bind('state')} options={OPTIONS.states} />
          <Input label="Delivery area" {...f.bind('deliveryArea')} placeholder="Neighbourhoods covered" />
          <Textarea label="Pincodes" required {...f.bind('pincodes')} rows={2} className="sm:col-span-2 lg:col-span-3" hint={`Separate with commas or spaces · ${pins.length} pincode${pins.length === 1 ? '' : 's'}`} />
          <Textarea label="Notes" {...f.bind('notes')} rows={2} className="sm:col-span-2 lg:col-span-3" maxLength={300} />
        </FormSection>
        <FormActions note={f.dirty ? 'You have unsaved changes.' : 'Fields marked * are required.'}>
          <Button variant="secondary" to="/dispatch/zones">Cancel</Button>
          <Button type="submit" icon={Save} loading={saving}>{existing ? 'Save changes' : 'Create zone'}</Button>
        </FormActions>
      </form>
    </>
  )
}

export default function ZoneForm() {
  const { id } = useParams()
  const { zones, hubs } = useDispatchData()
  if (!id) return <ZoneFormInner key="new" hubs={hubs} />
  const existing = getZoneById(id, zones)
  if (!existing) return <NotFoundRecord entity="zone" backTo="/dispatch/zones" backLabel="Back to zones" />
  return <ZoneFormInner key={existing.id} existing={existing} hubs={hubs} />
}
