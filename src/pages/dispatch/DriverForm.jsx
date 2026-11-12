import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UserRound, IdCard, Truck, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import FormSection, { FormActions } from '../../components/common/FormSection'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { LicenseBadge } from '../../components/dispatch/DispatchBadges'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useFormState } from '../../hooks/useFormState'
import { createDriver, emptyDriver, getDriverById, updateDriver } from '../../services/driverService'
import { DISPATCH_OPTIONS } from '../../config/dispatchConfig'

function DriverFormInner({ existing, hubs, zones, vehicles, drivers }) {
  const navigate = useNavigate()
  const f = useFormState(existing ? { ...existing, zoneId: existing.zoneId || '', vehicleId: existing.vehicleId || '' } : emptyDriver())
  const [saving, setSaving] = useState(false)
  const v = f.values
  const derived = ['Assigned', 'On Delivery'].includes(existing?.availability)
  const onHub = (e) => { f.setValues((x) => ({ ...x, hubId: e.target.value, zoneId: '', vehicleId: '' })); f.clearError('hubId') }
  const onSubmit = (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const res = existing ? updateDriver(existing.id, v) : createDriver(v)
    setSaving(false)
    if (!res.ok) {
      f.fail(res.errors)
      toast.error(res.errors.form || `Please fix ${Object.keys(res.errors).length} field(s) before saving.`)
      return
    }
    toast.success(existing ? 'Driver updated' : 'Driver added', { description: `${res.record.name} (${res.record.code})` })
    navigate(`/dispatch/drivers/${res.record.id}`, { replace: true })
  }
  const zoneOptions = zones.filter((z) => z.hubId === v.hubId).map((z) => ({ value: z.id, label: `${z.name}${z.status !== 'Active' ? ' (inactive)' : ''}` }))
  const vehicleOptions = vehicles.filter((x) => x.hubId === v.hubId).map((x) => {
    const owner = drivers.find((d) => d.vehicleId === x.id && d.id !== existing?.id)
    return { value: x.id, label: `${x.vehicleNumber} · ${x.type}${owner ? ` (regular: ${owner.name})` : ''}` }
  })
  const cancelTo = existing ? `/dispatch/drivers/${existing.id}` : '/dispatch/drivers'
  return (
    <>
      <PageHeader title={existing ? `Edit ${existing.name}` : 'Add driver'} description={existing ? existing.code : 'Register a delivery driver.'} actions={<Button variant="secondary" icon={X} to={cancelTo}>Cancel</Button>} />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <FormSection title="Driver" icon={UserRound} columns={3}>
          <Input label="Driver ID" value={existing?.id || 'Generated on save'} readOnly />
          <Input label="Driver code" required {...f.bind('code')} maxLength={12} />
          <Input label="Driver name" required {...f.bind('name')} maxLength={60} />
          <Input label="Employee number" {...f.bind('employeeNumber')} maxLength={20} />
          <Input label="Mobile number" required {...f.bind('mobile')} inputMode="tel" placeholder="+91 98400 11206" />
          <Input label="Email" type="email" {...f.bind('email')} />
          <Textarea label="Address" {...f.bind('address')} rows={2} className="sm:col-span-2 lg:col-span-3" maxLength={200} />
        </FormSection>
        <FormSection title="Licence" icon={IdCard} columns={3} aside={existing && <LicenseBadge driver={{ licenseExpiry: v.licenseExpiry }} />}>
          <Input label="Driving licence number" required {...f.bind('licenseNumber')} maxLength={24} />
          <Input label="Licence expiry date" required type="date" {...f.bind('licenseExpiry')} hint="Drivers with an expired licence cannot be assigned." />
        </FormSection>
        <FormSection title="Assignment" icon={Truck} columns={3}>
          <Select label="Assigned hub" required {...f.bind('hubId')} onChange={onHub} placeholder="Select hub" options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <Select label="Home zone" {...f.bind('zoneId')} placeholder={v.hubId ? 'No home zone' : 'Select a hub first'} options={zoneOptions} disabled={!v.hubId} />
          <Select label="Regular vehicle" {...f.bind('vehicleId')} placeholder={v.hubId ? 'No regular vehicle' : 'Select a hub first'} options={vehicleOptions} disabled={!v.hubId} />
          <Select label="Driver status" required {...f.bind('status')} options={DISPATCH_OPTIONS.driverStatuses} />
          {derived
            ? <Input label="Availability" value={`${existing.availability} (follows the current dispatch)`} readOnly />
            : <Select label="Availability" required {...f.bind('availability')} options={[{ value: 'Available', label: 'Available' }, { value: 'Offline', label: 'Offline' }]} hint="Assigned / On Delivery are set by dispatches." />}
          <div />
          <Textarea label="Notes" {...f.bind('notes')} rows={2} className="sm:col-span-2 lg:col-span-3" maxLength={300} />
        </FormSection>
        <FormActions note={f.dirty ? 'You have unsaved changes.' : 'Fields marked * are required.'}>
          <Button variant="secondary" to={cancelTo}>Cancel</Button>
          <Button type="submit" icon={Save} loading={saving}>{existing ? 'Save changes' : 'Add driver'}</Button>
        </FormActions>
      </form>
    </>
  )
}

export default function DriverForm() {
  const { id } = useParams()
  const { drivers, hubs, zones, vehicles } = useDispatchData()
  const props = { hubs, zones, vehicles, drivers }
  if (!id) return <DriverFormInner key="new" {...props} />
  const existing = getDriverById(id, drivers)
  if (!existing) return <NotFoundRecord entity="driver" backTo="/dispatch/drivers" backLabel="Back to drivers" />
  return <DriverFormInner key={existing.id} existing={existing} {...props} />
}
