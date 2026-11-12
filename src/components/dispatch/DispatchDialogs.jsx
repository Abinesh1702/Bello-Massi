import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { UserRoundCheck, PackageCheck, XCircle, ClipboardCheck, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Checkbox from '../common/Checkbox'
import Select from '../common/Select'
import Textarea from '../common/Textarea'
import Input from '../common/Input'
import ResourcePicker from './ResourcePicker'
import { useDispatchData } from '../../hooks/useDispatchData'
import { assignDispatch, cancelDispatch, confirmDispatch, getConfirmationReview } from '../../services/dispatchService'
import { reviewDelivery } from '../../services/deliveryService'
import { DISPATCH_OPTIONS, DELIVERY_STATUS as DL } from '../../config/dispatchConfig'
import { formatDate, formatMoney, formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

/** Assign or change the driver and vehicle of a PLANNED / ASSIGNED dispatch. */
export function AssignDialog({ dispatch, open, onClose }) {
  const { drivers, vehicles, dispatches } = useDispatchData()
  const [driverId, setDriverId] = useState(dispatch?.driverId || '')
  const [vehicleId, setVehicleId] = useState(dispatch?.vehicleId || '')
  const [date, setDate] = useState(dispatch?.dispatchDate || '')
  const [errors, setErrors] = useState({})
  if (!dispatch) return null
  const submit = () => {
    const res = assignDispatch(dispatch.id, { driverId, vehicleId, dispatchDate: date })
    if (!res.ok) {
      setErrors(res.errors || {})
      toast.error(res.error)
      return
    }
    toast.success(`${res.record.driverName} assigned to ${res.record.dispatchNumber}`, { description: `${res.record.vehicleNumber} · the driver has been notified.` })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} size="xl" icon={UserRoundCheck} title={`Assign driver & vehicle — ${dispatch.dispatchNumber}`}
      description={`${dispatch.totalDeliveries} stops · ${formatNumber(dispatch.totalQuantity)} units. Only active, available drivers with a valid licence and vehicles with enough capacity at this hub can be chosen.`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={UserRoundCheck} onClick={submit} disabled={!driverId || !vehicleId}>Assign</Button></>}>
      <div className="space-y-5">
        <Input label="Dispatch date" type="date" value={date} onChange={(e) => setDate(e.target.value)} error={errors.dispatchDate} className="max-w-xs" />
        <ResourcePicker hubId={dispatch.hubId} dispatchDate={date} dispatchId={dispatch.id} load={dispatch.totalQuantity} driverId={driverId} vehicleId={vehicleId}
          onDriver={setDriverId} onVehicle={setVehicleId} drivers={drivers} vehicles={vehicles} dispatches={dispatches} errors={errors} />
        {errors.form && <p className="text-sm text-danger" role="alert">{errors.form}</p>}
      </div>
    </Modal>
  )
}

const CHECKS = [
  ['orders', 'Orders and quantities reviewed'],
  ['driver', 'Driver identity and licence checked'],
  ['vehicle', 'Vehicle condition and capacity checked'],
  ['route', 'Route sequence reviewed'],
  ['addresses', 'Delivery addresses verified'],
  ['stock', 'Stock picked and loaded'],
]

/** Final review before stock leaves the hub. */
export function ConfirmDispatchDialog({ dispatch, open, onClose }) {
  const data = useDispatchData()
  const review = useMemo(() => (dispatch ? getConfirmationReview(dispatch) : null), [dispatch, data]) // eslint-disable-line react-hooks/exhaustive-deps
  const [checked, setChecked] = useState({})
  const [busy, setBusy] = useState(false)
  if (!dispatch || !review) return null
  const all = CHECKS.every(([k]) => checked[k])
  const blocked = review.blocks.length > 0
  const submit = () => {
    if (busy) return
    setBusy(true)
    const res = confirmDispatch(dispatch.id, { acknowledged: all })
    setBusy(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success(`${res.record.dispatchNumber} confirmed`, { description: `${res.movements.length} stock movement${res.movements.length === 1 ? '' : 's'} recorded · driver notified.` })
    onClose()
  }
  const driver = data.lk.drivers[dispatch.driverId]
  const vehicle = data.lk.vehicles[dispatch.vehicleId]
  return (
    <Modal open={open} onClose={busy ? undefined : onClose} size="xl" icon={PackageCheck} title={`Confirm dispatch ${dispatch.dispatchNumber}`}
      description="Confirming deducts the dispatched quantities from hub stock once and records Stock Dispatch movements. It cannot be undone except by a controlled reversal before the driver starts."
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button icon={PackageCheck} onClick={submit} loading={busy} disabled={blocked || !all}>Confirm dispatch</Button></>}>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          {[['Stops', dispatch.totalDeliveries], ['Units', formatNumber(dispatch.totalQuantity)], ['Value', formatMoney(dispatch.totalValue)], ['Date', formatDate(dispatch.dispatchDate)]].map(([l, v]) => (
            <div key={l} className="rounded-lg bg-surface-2 px-3 py-2"><p className="text-[11px] text-muted">{l}</p><p className="text-sm font-semibold text-ink tabular">{v}</p></div>
          ))}
        </div>
        <p className="text-sm text-ink"><span className="text-muted">Driver:</span> {driver?.name || '—'} · <span className="text-muted">Vehicle:</span> {vehicle ? `${vehicle.vehicleNumber} (${formatNumber(vehicle.capacity)} ${vehicle.capacityUnit.toLowerCase()})` : '—'}</p>
        {blocked && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5" role="alert">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-danger"><AlertTriangle size={15} /> Cannot confirm yet</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-ink space-y-0.5">{review.blocks.map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
        )}
        {review.warnings.map((w) => <p key={w} className="flex items-start gap-2 text-xs text-muted"><Info size={13} className="mt-0.5 shrink-0" /> {w}</p>)}
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Stock review — {data.lk.hubs[dispatch.hubId]?.name}</p>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted"><th className="py-2 pr-3">Product</th><th className="py-2 pr-3 text-right">To dispatch</th><th className="py-2 pr-3 text-right">Available</th><th className="py-2 text-right">After</th></tr></thead>
              <tbody>
                {review.stock.map((l) => (
                  <tr key={l.productId} className="border-b border-line/60">
                    <td className="py-2 pr-3"><p className="text-ink">{l.productName}</p><p className="text-xs text-muted">{l.orders.join(', ')}</p></td>
                    <td className="py-2 pr-3 text-right tabular">{formatNumber(l.quantity)} {l.unit}</td>
                    <td className={cn('py-2 pr-3 text-right tabular', l.short && 'text-danger font-semibold')}>{l.tracked ? formatNumber(l.available) : 'Not tracked'}</td>
                    <td className="py-2 text-right tabular">{l.tracked ? formatNumber(l.available - l.quantity) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Dispatcher checklist</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {CHECKS.map(([k, label]) => <Checkbox key={k} label={label} checked={Boolean(checked[k])} onChange={(e) => setChecked((c) => ({ ...c, [k]: e.target.checked }))} disabled={blocked} />)}
          </div>
        </fieldset>
      </div>
    </Modal>
  )
}

/** Cancel a dispatch — with stock reversal when it was already confirmed. */
export function CancelDispatchDialog({ dispatch, open, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors] = useState({})
  if (!dispatch) return null
  const confirmed = dispatch.status === 'CONFIRMED'
  const submit = () => {
    const res = cancelDispatch(dispatch.id, { reason, remarks })
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success(`${dispatch.dispatchNumber} cancelled`, { description: confirmed ? `${res.reversal.length} reversal movement${res.reversal.length === 1 ? '' : 's'} restored the stock.` : 'Orders are back in the ready queue. No stock was affected.' })
    onClose()
    onDone?.()
  }
  return (
    <Modal open={open} onClose={onClose} size="md" icon={XCircle} title={`Cancel ${dispatch.dispatchNumber}?`}
      description={confirmed ? 'This dispatch is confirmed: its stock will be returned to the hub with reversal movements, exactly once. The driver is notified.' : 'Nothing has left the hub, so stock is not affected. The orders return to the ready-for-dispatch queue.'}
      footer={<><Button variant="secondary" onClick={onClose}>Keep dispatch</Button><Button variant="danger" icon={XCircle} onClick={submit}>{confirmed ? 'Cancel & reverse stock' : 'Cancel dispatch'}</Button></>}>
      <div className="space-y-4">
        <Select label="Reason" required value={reason} onChange={(e) => { setReason(e.target.value); setErrors({}) }} options={DISPATCH_OPTIONS.cancelReasons} placeholder="Select a reason" error={errors.reason} />
        <Textarea label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} error={errors.remarks} maxLength={300} hint={reason === 'Other' ? 'Required for “Other”.' : undefined} />
      </div>
    </Modal>
  )
}

/** Dispatcher review of a failed or partial delivery. */
export function ReviewDeliveryDialog({ delivery, open, onClose }) {
  const failed = delivery?.status === DL.FAILED
  const [remarks, setRemarks] = useState('')
  const [returnToHub, setReturnToHub] = useState(true)
  const [requeue, setRequeue] = useState(failed)
  const [errors, setErrors] = useState({})
  if (!delivery) return null
  const remaining = delivery.items.reduce((s, it) => s + it.remainingQuantity, 0)
  const damaged = delivery.items.reduce((s, it) => s + it.damagedQuantity, 0)
  const submit = () => {
    const res = reviewDelivery(delivery.id, { remarks, returnToHub: returnToHub && remaining > 0, requeue: failed && returnToHub && requeue })
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success(`${delivery.orderNumber} reviewed`, { description: [res.movements.length && `${res.movements.reduce((s, m) => s + m.quantity, 0)} units returned to stock`, res.requeued && 'order back in the ready queue'].filter(Boolean).join(' · ') || 'Review recorded.' })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} size="md" icon={ClipboardCheck} title={`Review ${failed ? 'failed' : 'partial'} delivery — ${delivery.orderNumber}`}
      description={failed ? `${delivery.failureReason}${delivery.failureRemarks ? ` — “${delivery.failureRemarks}”` : ''}` : `${remaining} units were not delivered and ${damaged} were damaged.`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={CheckCircle2} onClick={submit}>Record review</Button></>}>
      <div className="space-y-4">
        {remaining > 0 && <Checkbox label={`Return ${formatNumber(remaining)} undelivered units to ${failed ? 'hub' : 'hub'} stock`} description="Records a Delivery Return movement once. Damaged units are not restocked." checked={returnToHub} onChange={(e) => setReturnToHub(e.target.checked)} />}
        {failed && <Checkbox label="Re-queue the order for a new dispatch" description="The order goes back to Ready for Dispatch. Requires the goods to be returned to the hub." checked={requeue && returnToHub} disabled={!returnToHub} onChange={(e) => setRequeue(e.target.checked)} />}
        <Textarea label="Review remarks" required value={remarks} onChange={(e) => { setRemarks(e.target.value); setErrors({}) }} rows={3} error={errors.remarks} maxLength={300} />
      </div>
    </Modal>
  )
}
