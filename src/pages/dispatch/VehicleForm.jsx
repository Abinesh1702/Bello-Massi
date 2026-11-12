import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Truck, Save, X, ShieldCheck, CalendarClock, UserRound } from 'lucide-react'
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
import { createVehicle, emptyVehicle, getVehicleById, updateVehicle } from '../../services/vehicleService'
import { DISPATCH_OPTIONS } from '../../config/dispatchConfig'
import { VMS_OPTIONS } from '../../config/vmsConfig'

/** The one vehicle register (Fleet & Vehicles › Vehicles); /dispatch/vehicles/* links resolve here too. */
const VEHICLES_PATH = '/vms/vehicles'

function VehicleFormInner({ existing, hubs, drivers }) {
  const navigate = useNavigate()
  const base = VEHICLES_PATH
  const f = useFormState(existing ? { ...emptyVehicle(), ...existing, capacity: String(existing.capacity ?? ''), manufacturingYear: String(existing.manufacturingYear ?? ''), assignedDriverId: existing.assignedDriverId || '' } : emptyVehicle())
  const [saving, setSaving] = useState(false)
  const v = f.values
  // Assigned is set by dispatches; by hand a vehicle is Available, under Maintenance or Inactive
  const statusOptions = DISPATCH_OPTIONS.vehicleStatuses.filter((o) => !['Assigned', 'In Transit'].includes(o.value) || existing?.status === o.value)
  const onSubmit = (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const res = existing ? updateVehicle(existing.id, v) : createVehicle(v)
    setSaving(false)
    if (!res.ok) {
      f.fail(res.errors)
      toast.error(res.errors.form || `Please fix ${Object.keys(res.errors).length} field(s) before saving.`)
      return
    }
    toast.success(existing ? 'Vehicle updated' : 'Vehicle added', { description: `${res.record.vehicleNumber} · ${res.record.status}` })
    navigate(base.startsWith('/vms') ? `${base}/${res.record.id}` : base, { replace: true })
  }
  return (
    <>
      <PageHeader title={existing ? `Edit ${existing.vehicleNumber}` : 'Add vehicle'} description={existing ? `${existing.type} · ${existing.model}` : 'Register a delivery vehicle at a hub.'} actions={<Button variant="secondary" icon={X} to={base}>Cancel</Button>} />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <FormSection title="Vehicle" icon={Truck} columns={3}>
          <Input label="Vehicle ID" value={existing?.id || 'Generated on save'} readOnly />
          <Input label="Vehicle number" required {...f.bind('vehicleNumber')} placeholder="TN 01 BX 4521" maxLength={16} />
          <Select label="Vehicle type" required {...f.bind('type')} options={DISPATCH_OPTIONS.vehicleTypes} />
          <Input label="Vehicle model" {...f.bind('model')} maxLength={60} />
          <Input label="Capacity" required type="number" min="1" step="1" {...f.bind('capacity')} hint="Compared with the dispatch's total quantity" />
          <Select label="Capacity unit" required {...f.bind('capacityUnit')} options={DISPATCH_OPTIONS.capacityUnits} />
          <Select label="Assigned hub" required {...f.bind('hubId')} placeholder="Select hub" options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <Select label="Vehicle status" required {...f.bind('status')} options={statusOptions} hint={existing?.status === 'Assigned' ? 'Assigned follows the vehicle’s dispatch.' : 'Assigned is set automatically by dispatch assignment.'} />
          <div />
          <Textarea label="Remarks" {...f.bind('notes')} rows={2} className="sm:col-span-2 lg:col-span-3" maxLength={300} />
        </FormSection>
        <FormSection title="Registration & specification" description="Vehicle Management System details." icon={ShieldCheck} columns={3}>
          <Input label="Registration number" {...f.bind('registrationNumber')} placeholder="Same as vehicle number if blank" maxLength={16} />
          <Select label="Vehicle category" {...f.bind('category')} options={VMS_OPTIONS.categories} />
          <Select label="Fuel type" {...f.bind('fuelType')} options={VMS_OPTIONS.fuelTypes} />
          <Input label="Manufacturer" {...f.bind('manufacturer')} maxLength={40} />
          <Input label="Manufacturing year" type="number" inputMode="numeric" {...f.bind('manufacturingYear')} />
          <Select label="Ownership type" {...f.bind('ownershipType')} options={VMS_OPTIONS.ownership} />
          <Input label="Owner name" {...f.bind('ownerName')} maxLength={80} className="sm:col-span-2" />
        </FormSection>
        <FormSection title="Insurance & compliance dates" description="Verified documents update these dates automatically. Expired required documents block dispatch assignment." icon={CalendarClock} columns={3}>
          <Input label="Insurance provider" {...f.bind('insuranceProvider')} maxLength={60} />
          <Input label="Insurance policy number" {...f.bind('insurancePolicyNumber')} maxLength={40} />
          <Input label="Insurance expiry" type="date" {...f.bind('insuranceExpiry')} />
          <Input label="Registration (RC) expiry" type="date" {...f.bind('registrationExpiry')} />
          <Input label="Pollution certificate expiry" type="date" {...f.bind('pollutionExpiry')} />
          <Input label="Fitness certificate expiry" type="date" {...f.bind('fitnessExpiry')} />
          <Input label="Permit expiry" type="date" {...f.bind('permitExpiry')} />
        </FormSection>
        <FormSection title="Assignment" icon={UserRound} columns={3}>
          <Select label="Assigned driver" {...f.bind('assignedDriverId')} placeholder="No regular driver" options={drivers.filter((d) => d.hubId === v.hubId && d.status === 'Active').map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))} hint={v.hubId ? 'Active drivers at the selected hub' : 'Select a hub first'} />
        </FormSection>
        <FormActions note={f.dirty ? 'You have unsaved changes.' : 'Fields marked * are required.'}>
          <Button variant="secondary" to={base}>Cancel</Button>
          <Button type="submit" icon={Save} loading={saving}>{existing ? 'Save changes' : 'Add vehicle'}</Button>
        </FormActions>
      </form>
    </>
  )
}

export default function VehicleForm() {
  const { id } = useParams()
  const { vehicles, hubs, drivers } = useDispatchData()
  if (!id) return <VehicleFormInner key="new" hubs={hubs} drivers={drivers} />
  const existing = getVehicleById(id, vehicles)
  if (!existing) return <NotFoundRecord entity="vehicle" backTo={VEHICLES_PATH} backLabel="Back to vehicles" />
  return <VehicleFormInner key={existing.id} existing={existing} hubs={hubs} drivers={drivers} />
}
