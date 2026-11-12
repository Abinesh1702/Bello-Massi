import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { PackageCheck, FileText, ShieldCheck, PenLine, Camera } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import { DeliveryStatusBadge } from '../../components/dispatch/DispatchBadges'
import { NoDriverRecord } from '../../components/driver/DriverUi'
import { useDriverWorkspace } from '../../hooks/useDriverWorkspace'
import { formatNumber, formatTime } from '../../utils/formatters'

/** Deliveries the driver closed today: time, customer, order, quantity, OTP, POD and delivery note. */
export default function DriverCompleted() {
  const w = useDriverWorkspace()
  if (!w.driver) return <NoDriverRecord />
  const done = w.completedToday
  const failed = w.deliveries.filter((d) => d.failedAt && dayjs(d.failedAt).isSame(dayjs(), 'day'))
  const qty = (d) => d.items.reduce((s, i) => s + (Number(i.deliveredQuantity) || 0), 0)
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Completed today</h1>
        <p className="text-sm text-muted">{done.length} delivered · {failed.length} not delivered</p>
      </div>
      {done.length ? (
        <ul className="space-y-3">
          {done.map((d) => {
            const pod = w.pods.find((p) => p.deliveryId === d.id)
            return (
              <li key={d.id}>
                <Card className="!p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/driver/deliveries/${d.id}`} className="font-semibold text-ink hover:text-brand">{d.customerName}</Link>
                      <p className="text-xs text-muted tabular">{formatTime(d.completedAt)} · {d.orderNumber} · {formatNumber(qty(d))} of {formatNumber(d.totalQuantity)} units</p>
                    </div>
                    <DeliveryStatusBadge status={d.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone={d.otpStatus === 'VERIFIED' ? 'success' : 'warning'}><ShieldCheck size={11} aria-hidden />OTP {d.otpStatus === 'VERIFIED' ? 'verified' : 'not verified'}</Badge>
                    <Badge tone={pod ? 'success' : 'neutral'}>POD {pod ? 'captured' : 'not captured'}</Badge>
                    {pod?.signature && <Badge tone="info"><PenLine size={11} aria-hidden />Signature</Badge>}
                    {pod?.photo && <Badge tone="info"><Camera size={11} aria-hidden />Photo</Badge>}
                  </div>
                  {d.deliveryNoteId && <Button className="mt-3" size="sm" variant="secondary" icon={FileText} to={`/driver/delivery-notes/${d.deliveryNoteId}`}>Delivery note {d.deliveryNoteNumber}</Button>}
                </Card>
              </li>
            )
          })}
        </ul>
      ) : <Card><EmptyState icon={PackageCheck} title="Nothing completed yet today" description="Deliveries you confirm with the customer’s OTP appear here with their proof of delivery." action={<Button variant="secondary" to="/driver/dashboard">Back to Today</Button>} /></Card>}
      {failed.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-semibold text-ink">Not delivered today</p>
          <ul className="divide-y divide-line">{failed.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 py-2 text-sm"><Link to={`/driver/deliveries/${d.id}`} className="truncate text-ink hover:text-brand">{d.customerName}</Link><span className="shrink-0 text-xs text-muted">{d.failureReason}</span></li>
          ))}</ul>
        </Card>
      )}
    </div>
  )
}
