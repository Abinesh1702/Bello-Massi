import { useMemo } from 'react'
import dayjs from 'dayjs'
import { CalendarCheck, Clock, PackageCheck, Navigation, KeyRound, Truck } from 'lucide-react'
import StatCard, { StatGrid } from '../StatCard'
import Card, { CardHeader } from '../../common/Card'
import Button from '../../common/Button'
import EmptyState from '../../common/EmptyState'
import StopList from '../widgets/StopList'
import { getDriverDay } from '../../../services/dashboardService'
import { getDriverForUser } from '../../../services/demoDataService'

export default function DriverDashboard({ user, data, orders }) {
  const driver = getDriverForUser(user.id, data)
  const day = useMemo(() => (driver ? getDriverDay(orders, driver.id) : null), [driver, orders])

  if (!driver) {
    return (
      <Card>
        <EmptyState icon={Truck} title="No driver profile linked" description="Ask the administrator to link your account to a driver profile." />
      </Card>
    )
  }
  const progress = day.today.length ? Math.round((day.completed.length / day.today.length) * 100) : 0

  return (
    <div className="space-y-5 max-w-3xl">
      <Card className="bg-navy! text-white border-navy! dark:bg-[#1d2550]!">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-accent font-semibold">{dayjs().format('dddd, DD MMM')}</p>
            <p className="mt-1 text-lg font-semibold">{driver.vehicleNo}</p>
            <p className="text-sm text-white/70">{driver.vehicleType}</p>
          </div>
          <Truck size={28} className="text-accent" aria-hidden />
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-sm">
            <span>Delivery progress</span>
            <span className="font-semibold tabular">{day.completed.length}/{day.today.length} · {progress}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/15 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Today's delivery progress">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </Card>

      <StatGrid cols={3}>
        <StatCard label="Today's deliveries" value={day.today.length} icon={CalendarCheck} tone="brand" to="/deliveries" />
        <StatCard label="Pending" value={day.pending.length} icon={Clock} tone="warning" to="/deliveries" />
        <StatCard label="Completed" value={day.completed.length} icon={PackageCheck} tone="success" to="/deliveries" />
      </StatGrid>

      <Card>
        <CardHeader title="Today's delivery list" subtitle="In planned order" action={<Button size="sm" icon={Navigation} to="/deliveries">Start route</Button>} />
        <StopList stops={day.today} emptyTitle="No deliveries today" />
      </Card>

      <Card>
        <CardHeader title="Tomorrow's plan" subtitle="Published by the Dispatcher" />
        {day.tomorrow.length ? <StopList stops={day.tomorrow} /> : <EmptyState compact icon={CalendarCheck} title="No plan published yet" />}
      </Card>

      <Card className="flex items-start gap-3">
        <KeyRound size={18} className="text-accent shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-muted">
          Fastest-route suggestions, navigation and OTP handover with Delivery Note arrive with the <strong className="text-ink">Drivers App</strong> module in a later phase.
        </p>
      </Card>
    </div>
  )
}
