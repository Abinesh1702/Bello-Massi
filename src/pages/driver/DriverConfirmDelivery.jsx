import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { ArrowLeft, KeyRound, RefreshCw, CheckCircle2, Package, ShieldAlert, Camera, PenLine, X, FileCheck2 } from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Textarea from '../../components/common/Textarea'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { OtpStatusBadge, SimulatedOtpBadge } from '../../components/dispatch/DispatchBadges'
import { NoDriverRecord } from '../../components/driver/DriverUi'
import { DeliveryFlow, SignaturePad } from '../../components/driver/DriverExtras'
import Select from '../../components/common/Select'
import { readScrapFile } from '../../services/scrapService'
import { OrderAccessDenied } from '../orders/OrderDetail'
import { useDriverWorkspace } from '../../hooks/useDriverWorkspace'
import { confirmDelivery } from '../../services/deliveryService'
import { effectiveOtpStatus, generateOtp, getLatestOtp } from '../../services/otpService'
import { DELIVERY_STATUS as DL } from '../../config/dispatchConfig'
import { formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const remainingLabel = (expiresAt, now) => {
  const s = Math.max(0, dayjs(expiresAt).diff(now, 'second'))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** OTP-verified delivery confirmation with per-item delivered / damaged quantities (full or partial). */
export default function DriverConfirmDelivery() {
  const { id } = useParams()
  const navigate = useNavigate()
  const w = useDriverWorkspace()
  const d = w.lk.deliveries[id]
  const [qty, setQty] = useState(() => Object.fromEntries((d?.items || []).map((it) => [it.id, { deliveredQuantity: String(it.dispatchedQuantity), damagedQuantity: '0' }])))
  const [receivedBy, setReceivedBy] = useState(d?.contactPerson || '')
  const [remarks, setRemarks] = useState('')
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => dayjs())
  const [done, setDone] = useState(false)
  const [rejected, setRejected] = useState({})
  const [shortReason, setShortReason] = useState('')
  const [customerRemarks, setCustomerRemarks] = useState('')
  const [signature, setSignature] = useState(null)
  const [photo, setPhoto] = useState(null)
  useEffect(() => { const t = window.setInterval(() => setNow(dayjs()), 1000); return () => window.clearInterval(t) }, [])

  if (!w.driver) return <NoDriverRecord />
  if (!d) return <NotFoundRecord entity="delivery" backTo="/driver/deliveries" backLabel="Back to deliveries" />
  if (d.driverId !== w.driver.id) return <OrderAccessDenied />
  if (d.status !== DL.OUT_FOR_DELIVERY) {
    if (done) return null // just confirmed — navigating to the delivery note
    if (d.status === DL.DISPATCHED) toast.info('Start the delivery first.', { id: `start-${id}` })
    return <Navigate to={`/driver/deliveries/${id}`} replace />
  }

  const otp = getLatestOtp(id, w.otps)
  const otpStatus = otp ? effectiveOtpStatus(otp, now) : 'NONE'
  const live = otpStatus === 'ACTIVE'
  const set = (itemId, field, value) => { setQty((q) => ({ ...q, [itemId]: { ...q[itemId], [field]: value } })); setErrors({}) }
  const lines = d.items.map((it) => {
    const dq = Number(qty[it.id]?.deliveredQuantity) || 0
    const mq = Number(qty[it.id]?.damagedQuantity) || 0
    return { ...it, dq, mq, rem: it.dispatchedQuantity - dq - mq }
  })
  const partial = lines.some((l) => l.dq !== l.dispatchedQuantity)
  const short = lines.some((l) => l.rem > 0)
  const takePhoto = async (file) => {
    if (!file) return
    try { const f = await readScrapFile(file, { maxDim: 900, quality: 0.6 }); setPhoto(f.dataUrl) } catch (err) { toast.error(err.message) }
  }

  const requestOtp = () => {
    const res = generateOtp(id)
    if (!res.ok) { toast.error(res.error); return }
    setCode('')
    setErrors({})
    toast.success(res.regenerated ? 'New OTP generated — the previous one no longer works' : 'OTP generated', { description: 'Simulated: shown on screen, no SMS or WhatsApp is sent.' })
  }

  const submit = () => {
    setBusy(true)
    setDone(true)
    const res = confirmDelivery(id, { items: d.items.map((it) => ({ id: it.id, ...qty[it.id] })), receivedBy, remarks, otp: code, pod: { signature, photo, customerRemarks, rejected, shortReason } })
    setBusy(false)
    if (!res.ok) {
      setDone(false)
      setErrors(res.errors || {})
      toast.error(res.error)
      return
    }
    toast.success(res.record.status === DL.DELIVERED ? `Delivered to ${d.customerName}` : `Partial delivery recorded for ${d.customerName}`, { description: `Delivery note ${res.note.noteNumber} generated.` })
    navigate(`/driver/delivery-notes/${res.note.id}`, { replace: true })
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" icon={ArrowLeft} to={`/driver/deliveries/${id}`} className="-ml-2">Back to stop</Button>
      <div>
        <p className="text-xs text-muted tabular">Stop {d.sequence} · {d.orderNumber}</p>
        <h1 className="text-xl font-semibold text-ink">Confirm delivery</h1>
        <p className="text-sm text-muted">{d.customerName}</p>
      </div>
      <DeliveryFlow step={live ? 4 : 3} />

      <Card>
        <CardHeader title="Delivered quantities" subtitle="Enter what the customer accepted. Anything not delivered or damaged stays on record as remaining." icon={Package} />
        <ul className="divide-y divide-line">
          {lines.map((l) => (
            <li key={l.id} className="py-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-ink">{l.productName}</p>
                <p className="text-xs text-muted tabular whitespace-nowrap">Dispatched {formatNumber(l.dispatchedQuantity)} {l.unit}</p>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Input label="Delivered" type="number" inputMode="decimal" min="0" value={qty[l.id].deliveredQuantity} onChange={(e) => set(l.id, 'deliveredQuantity', e.target.value)} error={errors[`item:${l.id}:delivered`]} aria-label={`Delivered quantity for ${l.productName}`} />
                <Input label="Damaged" type="number" inputMode="decimal" min="0" value={qty[l.id].damagedQuantity} onChange={(e) => set(l.id, 'damagedQuantity', e.target.value)} error={errors[`item:${l.id}:damaged`]} aria-label={`Damaged quantity for ${l.productName}`} />
                <div><p className="mb-1.5 text-sm font-medium text-ink">Remaining</p><p className={cn('flex h-10 items-center rounded-lg bg-surface-2 px-3 text-sm tabular', l.rem < 0 ? 'text-danger' : 'text-ink')} data-testid={`remaining-${l.productCode}`}>{formatNumber(l.rem)}</p></div>
              </div>
            </li>
          ))}
        </ul>
        {partial && <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-ink">This will be recorded as a <strong>partial delivery</strong>. No new order is created for the remaining quantity — the Dispatcher reviews it.</p>}
        {errors.form && <p role="alert" className="mt-2 text-sm text-danger">{errors.form}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label="Received by" required value={receivedBy} onChange={(e) => { setReceivedBy(e.target.value); setErrors({}) }} error={errors.receivedBy} maxLength={80} placeholder="Customer's name" />
          <Textarea label="Delivery remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} maxLength={300} className="sm:col-span-2" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Proof of delivery" subtitle="Signature, photo and the customer’s remarks are stored with the delivery note." icon={FileCheck2} />
        {short && (
          <div className="mb-4 space-y-3 rounded-lg border border-line p-3">
            <p className="text-sm font-medium text-ink">Not delivered — how much did the customer reject?</p>
            {lines.filter((l) => l.rem > 0).map((l) => (
              <Input key={l.id} label={`${l.productName} — rejected (of ${formatNumber(l.rem)} not delivered)`} type="number" inputMode="decimal" min="0" value={rejected[l.id] ?? ''} placeholder="0"
                onChange={(e) => { setRejected((r) => ({ ...r, [l.id]: e.target.value })); setErrors({}) }} error={errors[`item:${l.id}:rejected`]} />
            ))}
            <Select label="Reason for the shortfall" placeholder="Select a reason" value={shortReason} onChange={(e) => setShortReason(e.target.value)}
              options={['Short supplied', 'Rejected — quality', 'Rejected — damaged', 'Rejected — not ordered', 'Customer requested less', 'Other'].map((v) => ({ value: v, label: v }))} />
          </div>
        )}
        <Textarea label="Customer remarks" value={customerRemarks} onChange={(e) => setCustomerRemarks(e.target.value)} rows={2} maxLength={300} error={errors.customerRemarks} />
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink"><PenLine size={15} aria-hidden />Customer signature</p>
          <SignaturePad value={signature} onChange={setSignature} />
          {errors.signature && <p className="text-xs text-danger" role="alert">{errors.signature}</p>}
        </div>
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink"><Camera size={15} aria-hidden />Delivery photo</p>
          {photo ? (
            <div className="relative inline-block">
              <img src={photo} alt="Proof of delivery" className="max-h-48 rounded-lg border border-line object-contain" />
              <button type="button" onClick={() => setPhoto(null)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white" aria-label="Remove photo"><X size={14} /></button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 py-4 text-sm text-muted hover:border-brand hover:text-ink">
              <Camera size={16} aria-hidden />Take or choose a photo (optional)
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { takePhoto(e.target.files?.[0]); e.target.value = '' }} />
            </label>
          )}
          {errors.photo && <p className="text-xs text-danger" role="alert">{errors.photo}</p>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Customer OTP" subtitle="Ask the customer for the 6-digit code to confirm the handover." icon={KeyRound} action={<SimulatedOtpBadge />} />
        {otp && (
          <div className={cn('rounded-xl border border-dashed p-3', live ? 'border-accent/60 bg-accent/10' : 'border-line bg-surface-2')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted">Prototype only — in production this reaches the customer, not the driver</p>
              <OtpStatusBadge status={otpStatus} />
            </div>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.35em] text-ink" data-testid="demo-otp">{live ? otp.otp : '••••••'}</p>
            {live && <p className="text-xs text-muted tabular">Expires in {remainingLabel(otp.expiresAt, now)} · {otp.maxAttempts - otp.attempts} attempt{otp.maxAttempts - otp.attempts === 1 ? '' : 's'} left</p>}
          </div>
        )}
        <div className="mt-3 space-y-3">
          <Button variant={otp ? 'secondary' : 'primary'} icon={otp ? RefreshCw : KeyRound} fullWidth onClick={requestOtp}>{otp ? 'Regenerate OTP' : 'Generate OTP'}</Button>
          <Input label="Enter OTP" value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}) }} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6 digits" error={errors.otp} disabled={!live} inputClassName="font-mono text-lg tracking-[0.3em]" />
          {!live && otp && <p className="flex gap-1.5 text-xs text-muted"><ShieldAlert size={14} className="shrink-0" aria-hidden />{otpStatus === 'EXPIRED' ? 'This OTP has expired.' : otpStatus === 'LOCKED' ? 'Too many incorrect attempts.' : 'This OTP can no longer be used.'} Generate a new one.</p>}
        </div>
      </Card>

      <div className="sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 -mx-3 sm:-mx-4 border-t border-line bg-surface/95 px-3 sm:px-4 py-3 backdrop-blur shadow-[0_-6px_16px_-10px_rgba(16,24,40,0.25)]">
        <Button icon={CheckCircle2} size="lg" fullWidth onClick={submit} loading={busy} disabled={!live || code.length !== 6}>{partial ? 'Verify OTP & confirm partial delivery' : 'Verify OTP & complete delivery'}</Button>
      </div>
      <p className="text-center text-xs text-muted">A wrong OTP blocks completion. The delivery note is generated only after the OTP is verified.</p>
      <p className="text-center text-xs text-muted">Stock already left the hub at dispatch confirmation — confirming a delivery does not deduct stock again.</p>
    </div>
  )
}
