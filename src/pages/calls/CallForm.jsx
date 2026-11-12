import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { PhoneCall, CalendarClock, Save, Info } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import FormSection, { FormActions } from '../../components/common/FormSection'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Toggle from '../../components/common/Toggle'
import Button from '../../components/common/Button'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { useMasterData } from '../../hooks/useMasterData'
import { useFormState } from '../../hooks/useFormState'
import { useAuth } from '../../hooks/useAuth'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { scopeOf } from '../../services/rbacService'
import { ROLES } from '../../config/roles'
import { STORAGE_KEYS } from '../../utils/constants'
import {
  CALL_DIRECTIONS, CALL_OUTCOMES, CALL_STATUSES, canManageCall, FOLLOW_UP_OUTCOMES, nextCallNumber, salesmanOptions, saveCall,
} from '../../services/callService'

const EMPTY = []

export default function CallForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const all = useStoredValue(STORAGE_KEYS.CALL_HISTORY, EMPTY)
  const existing = id ? all.find((c) => c.id === id) : null
  if (id && (!existing || !canManageCall(user, existing))) return <NotFoundRecord entity="call" backTo="/communication/calls/list" />
  return <CallFormInner key={id || 'new'} existing={existing} />
}

function CallFormInner({ existing }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { customers, orders } = useMasterData()
  const ownOnly = scopeOf(user) === ROLES.SALESMAN
  const preCustomer = customers.find((c) => c.id === params.get('customerId'))
  const f = useFormState(existing ? {
    customerId: existing.customerId, contactPerson: existing.contactPerson, phone: existing.phone, salesmanId: existing.salesmanId, direction: existing.direction,
    callDate: existing.callDate, callTime: existing.callTime, durationMinutes: String(Math.floor(existing.durationSeconds / 60)), durationSeconds: String(existing.durationSeconds % 60),
    status: existing.status, outcome: existing.outcome, remarks: existing.remarks, followUpRequired: existing.followUpRequired, followUpDate: existing.followUpDate || '',
    followUpNotes: existing.followUpNotes || '', relatedOrderId: existing.relatedOrderId || '',
  } : {
    customerId: preCustomer?.id || '', contactPerson: preCustomer?.contactPerson || '', phone: preCustomer?.mobile || '',
    salesmanId: ownOnly ? user.id : preCustomer?.salesRepId || '', direction: 'Outgoing', callDate: dayjs().format('YYYY-MM-DD'), callTime: dayjs().format('HH:mm'),
    durationMinutes: '', durationSeconds: '', status: 'Connected', outcome: '', remarks: '', followUpRequired: false, followUpDate: '', followUpNotes: '', relatedOrderId: '',
  })
  const [saving, setSaving] = useState(false)
  const v = f.values
  const salesmen = useMemo(() => salesmanOptions(), [])
  const customerOrders = orders.filter((o) => o.customerId === v.customerId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 25)
  const number = useMemo(() => existing?.callNumber || nextCallNumber(), [existing])

  const pickCustomer = (cid) => {
    const c = customers.find((x) => x.id === cid)
    f.setValue('customerId', cid)
    f.setValue('relatedOrderId', '')
    if (c) {
      f.setValue('contactPerson', c.contactPerson || '')
      f.setValue('phone', c.mobile || c.phone || '')
      if (!ownOnly && c.salesRepId && salesmen.some((s) => s.value === c.salesRepId)) f.setValue('salesmanId', c.salesRepId)
    }
  }
  const pickOutcome = (o) => {
    f.setValue('outcome', o)
    if (FOLLOW_UP_OUTCOMES.includes(o) && !v.followUpRequired) {
      f.setValue('followUpRequired', true)
      if (!v.followUpDate) f.setValue('followUpDate', dayjs().add(1, 'day').format('YYYY-MM-DD'))
    }
  }
  const pickStatus = (s) => {
    f.setValue('status', s)
    if (s !== 'Connected') { f.setValue('durationMinutes', '0'); f.setValue('durationSeconds', '0') }
  }

  const submit = (e) => {
    e.preventDefault()
    setSaving(true)
    const res = saveCall(v, { id: existing?.id })
    setSaving(false)
    if (!res.ok) { f.fail(res.errors || {}); toast.error(res.error); return }
    toast.success(existing ? `${res.record.callNumber} updated` : `${res.record.callNumber} logged`)
    navigate(`/communication/calls/${res.record.id}`)
  }

  return (
    <>
      <PageHeader title={existing ? `Edit ${existing.callNumber}` : 'Log a call'} description="Record a call you made or received. This is a manual log — no telephony is connected." />
      <form onSubmit={submit} noValidate className="space-y-6">
        <FormSection title="Call" icon={PhoneCall} description={`Call ID ${number}`}>
          <Select label="Customer" required placeholder="Select a customer" options={customers.filter((c) => c.status === 'Active' || c.id === v.customerId).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))} {...f.bind('customerId')} onChange={(e) => pickCustomer(e.target.value)} />
          <Input label="Contact person" maxLength={80} {...f.bind('contactPerson')} />
          <Input label="Phone" required type="tel" maxLength={20} {...f.bind('phone')} />
          <Select label="Salesman" required placeholder="Select the salesman" disabled={ownOnly} options={salesmen} {...f.bind('salesmanId')} hint={ownOnly ? 'Calls you log are linked to you.' : undefined} />
          <Select label="Direction" required options={CALL_DIRECTIONS.map((d) => ({ value: d, label: d }))} {...f.bind('direction')} />
          <Select label="Call status" required options={CALL_STATUSES.map((d) => ({ value: d, label: d }))} {...f.bind('status')} onChange={(e) => pickStatus(e.target.value)} />
          <Input label="Date" required type="date" max={dayjs().format('YYYY-MM-DD')} {...f.bind('callDate')} />
          <Input label="Time" required type="time" {...f.bind('callTime')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (min)" type="number" min="0" max="600" inputMode="numeric" {...f.bind('durationMinutes')} />
            <Input label="Seconds" type="number" min="0" max="59" inputMode="numeric" {...f.bind('durationSeconds')} />
          </div>
          <Select label="Outcome" required placeholder="Select the outcome" options={CALL_OUTCOMES.map((d) => ({ value: d, label: d }))} {...f.bind('outcome')} onChange={(e) => pickOutcome(e.target.value)} />
          <Select label="Related sales order" placeholder={v.customerId ? (customerOrders.length ? 'None' : 'This customer has no orders') : 'Select a customer first'} disabled={!v.customerId}
            options={customerOrders.map((o) => ({ value: o.id, label: `${o.orderNumber} · ${dayjs(o.orderDate).format('DD MMM')}` }))} {...f.bind('relatedOrderId')} />
          <Textarea label="Remarks" rows={3} maxLength={500} className="sm:col-span-2" {...f.bind('remarks')} />
        </FormSection>
        <FormSection title="Follow-up" icon={CalendarClock} description="Follow-ups appear on the follow-up board and the salesman’s notifications.">
          <Toggle label="Follow-up required" description="Call the customer back on a set date." className="sm:col-span-2" {...f.bindToggle('followUpRequired')} />
          {v.followUpRequired && <>
            <Input label="Follow-up date" required type="date" min={v.callDate} {...f.bind('followUpDate')} />
            <Textarea label="Follow-up notes" rows={2} maxLength={300} {...f.bind('followUpNotes')} />
          </>}
        </FormSection>
        <FormActions note={<span className="inline-flex items-center gap-1.5"><Info size={14} aria-hidden />To create a sales order from this call, open the call after saving and choose “Create sales order”.</span>}>
          <Button variant="secondary" onClick={() => navigate(existing ? `/communication/calls/${existing.id}` : '/communication/calls')}>Cancel</Button>
          <Button type="submit" icon={Save} loading={saving}>{existing ? 'Save changes' : 'Save call'}</Button>
        </FormActions>
      </form>
    </>
  )
}
