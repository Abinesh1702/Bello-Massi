import { PackageCheck, PackageMinus, AlertTriangle, ShieldCheck, Boxes, FileCheck2 } from 'lucide-react'
import Card, { CardHeader } from '../common/Card'
import { CompareLine } from '../dashboard/StatCard'
import { useDashboardPeriod } from '../../hooks/useDashboardPeriod'
import { filterByPeriod } from '../../utils/dashboardFilter'
import { rangeText } from '../../utils/periods'
import { formatNumber } from '../../utils/formatters'

const measure = (list, pods) => {
  const done = list.filter((d) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(d.status))
  return {
    delivered: list.filter((d) => d.status === 'DELIVERED').length,
    partial: list.filter((d) => d.status === 'PARTIALLY_DELIVERED').length,
    failed: list.filter((d) => ['FAILED', 'RETURNED'].includes(d.status)).length,
    units: done.reduce((s, d) => s + d.items.reduce((a, i) => a + (Number(i.deliveredQuantity) || 0), 0), 0),
    otp: done.filter((d) => d.otpStatus === 'VERIFIED').length,
    pod: done.filter((d) => pods.some((p) => p.deliveryId === d.id)).length,
  }
}

/** The driver's delivery results for the selected period (deliveries on their completion date). */
export default function DriverPerformance({ deliveries, pods }) {
  const p = useDashboardPeriod()
  const closed = deliveries.filter((d) => d.completedAt || d.failedAt)
  const cur = measure(filterByPeriod('deliveries', closed, p?.range), pods)
  const prev = p?.compare ? measure(filterByPeriod('deliveries', closed, p.previous), pods) : null
  const tiles = [
    ['delivered', 'Delivered', PackageCheck, 'text-success'], ['partial', 'Partial', PackageMinus, 'text-warning'], ['failed', 'Not delivered', AlertTriangle, 'text-danger', true],
    ['units', 'Units delivered', Boxes, 'text-brand'], ['otp', 'OTP verified', ShieldCheck, 'text-info'], ['pod', 'POD captured', FileCheck2, 'text-info'],
  ]
  return (
    <Card>
      <CardHeader title="My performance" subtitle={p?.range?.start ? rangeText(p.range) : 'All time'} icon={PackageCheck} />
      <dl className="grid grid-cols-3 gap-3">
        {tiles.map(([k, label, Icon, tone, invert]) => (
          <div key={k} className="min-w-0 rounded-lg bg-surface-2 p-2.5">
            <dt className="flex items-center gap-1 text-[11px] text-muted"><Icon size={12} className={tone} aria-hidden /><span className="truncate">{label}</span></dt>
            <dd className="mt-0.5 text-lg font-semibold text-ink tabular">{formatNumber(cur[k])}</dd>
            {prev && <CompareLine compare={{ previous: prev[k], current: cur[k], invert }} />}
          </div>
        ))}
      </dl>
      {!closed.length && <p className="mt-2 text-xs text-muted">No completed deliveries yet.</p>}
    </Card>
  )
}
