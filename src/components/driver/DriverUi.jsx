import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { MapPin, Phone, Navigation, ChevronRight, AlertTriangle, UserX, Package } from 'lucide-react'
import Button from '../common/Button'
import Modal from '../common/Modal'
import Select from '../common/Select'
import Textarea from '../common/Textarea'
import EmptyState from '../common/EmptyState'
import { DeliveryStatusBadge } from '../dispatch/DispatchBadges'
import { PriorityBadge } from '../orders/OrderBadges'
import { failDelivery } from '../../services/deliveryService'
import { navigationUrl } from '../../hooks/useDriverWorkspace'
import { EtaLine, VipBadge } from './DriverExtras'
import { DISPATCH_OPTIONS } from '../../config/dispatchConfig'
import { formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

export function ProgressBar({ value, label = 'Delivery progress', className }) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs text-muted"><span>{label}</span><span className="font-semibold text-ink tabular">{value}%</span></div>
      <div className="mt-1.5 h-2.5 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function NoDriverRecord() {
  return <EmptyState icon={UserX} title="No driver profile linked" description="Your login is not linked to a driver record. Ask the Dispatcher or Admin to link it in Driver Management." />
}

/** One delivery stop as a tappable card (driver plan / list). */
export function StopCard({ d, highlight = false, vip = false, plan = null }) {
  return (
    <li>
      <Link to={`/driver/deliveries/${d.id}`} className={cn('block rounded-xl border bg-surface p-4 shadow-sm hover:border-brand/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]', highlight ? 'border-brand ring-1 ring-brand/30' : 'border-line')}>
        <div className="flex items-start gap-3">
          <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold tabular', highlight ? 'bg-brand text-white' : 'bg-surface-2 text-ink')} aria-label={`Stop ${d.sequence}`}>{d.sequence}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-semibold text-ink truncate">{d.customerName}</p>
              {vip && <VipBadge />}
              {d.priority && d.priority !== 'Normal' && <PriorityBadge priority={d.priority} />}
            </div>
            <p className="text-xs text-muted tabular">{d.orderNumber} · {formatNumber(d.totalQuantity)} units</p>
            <p className="mt-1.5 flex gap-1.5 text-sm text-ink"><MapPin size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden /><span className="line-clamp-2">{d.deliveryAddress}{d.pincode && !String(d.deliveryAddress).includes(d.pincode) ? ` · ${d.pincode}` : ''}</span></p>
            {d.instructions && <p className="mt-1 text-xs text-muted line-clamp-1">“{d.instructions}”</p>}
            {plan && ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(d.status) && <EtaLine plan={plan} className="mt-1" />}
            <div className="mt-2 flex flex-wrap items-center gap-1.5"><DeliveryStatusBadge status={d.status} />{d.status === 'OUT_FOR_DELIVERY' && d.arrivedAt && <span className="text-xs text-muted">Arrived — awaiting OTP</span>}</div>
          </div>
          <ChevronRight size={18} className="mt-2 shrink-0 text-muted" aria-hidden />
        </div>
      </Link>
    </li>
  )
}

/** Call + navigate buttons for a stop. */
export function ContactActions({ d, size = 'md' }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="secondary" size={size} icon={Phone} href={d.customerMobile ? `tel:${d.customerMobile.replace(/\s/g, '')}` : undefined} disabled={!d.customerMobile} fullWidth>Call</Button>
      <Button variant="secondary" size={size} icon={Navigation} href={navigationUrl(d)} target="_blank" rel="noreferrer" fullWidth>Navigate</Button>
    </div>
  )
}

/** Driver reports a failed delivery: reason required, remarks required for “Other”. */
export function FailDeliveryDialog({ delivery, open, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  if (!delivery) return null
  const submit = () => {
    setBusy(true)
    const res = failDelivery(delivery.id, { reason, remarks })
    setBusy(false)
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success(`${delivery.orderNumber} marked as failed`, { description: 'The Dispatcher has been notified for review.' })
    onClose()
    onDone?.(res)
  }
  return (
    <Modal open={open} onClose={busy ? undefined : onClose} size="sm" icon={AlertTriangle} title="Mark delivery failed" description={`${delivery.customerName} · ${delivery.orderNumber}`}
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button variant="danger" onClick={submit} loading={busy}>Mark failed</Button></>}>
      <div className="space-y-4">
        <Select label="Failure reason" required placeholder="Select a reason" options={DISPATCH_OPTIONS.failureReasons} value={reason} onChange={(e) => { setReason(e.target.value); setErrors({}) }} error={errors.reason} />
        <Textarea label="Remarks" required={reason === 'Other'} value={remarks} onChange={(e) => { setRemarks(e.target.value); setErrors({}) }} error={errors.remarks} rows={3} maxLength={300} placeholder="What happened at the door?" />
        <p className="flex gap-2 text-xs text-muted"><Package size={14} className="shrink-0" aria-hidden />The goods stay on the vehicle. The Dispatcher reviews the failure and decides whether to return them to the hub.</p>
      </div>
    </Modal>
  )
}
