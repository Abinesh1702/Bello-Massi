import { useSearchParams } from 'react-router-dom'
import { ListChecks, History, CalendarClock } from 'lucide-react'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import EmptyState from '../../components/common/EmptyState'
import { DispatchStatusBadge } from '../../components/dispatch/DispatchBadges'
import { NoDriverRecord, StopCard } from '../../components/driver/DriverUi'
import { useDriverWorkspace } from '../../hooks/useDriverWorkspace'
import { PENDING_DELIVERY_STATUSES } from '../../config/dispatchConfig'
import { formatDate } from '../../utils/formatters'

const TABS = [
  { id: 'today', label: 'Current route', icon: ListChecks },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
  { id: 'history', label: 'History', icon: History },
]

/** The driver's own deliveries: current route, upcoming assigned dispatches, and completed / failed history. */
export default function DriverDeliveries() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((t) => t.id === params.get('tab'))?.id || 'today'
  const w = useDriverWorkspace()
  if (!w.driver) return <NoDriverRecord />
  const upcoming = w.dispatches.filter((d) => d.id !== w.current?.id && ['ASSIGNED', 'CONFIRMED'].includes(d.status)).sort((a, b) => (a.dispatchDate < b.dispatchDate ? -1 : 1))
  const history = w.deliveries.filter((d) => !PENDING_DELIVERY_STATUSES.includes(d.status)).sort((a, b) => ((a.completedAt || a.failedAt || a.updatedAt) < (b.completedAt || b.failedAt || b.updatedAt) ? 1 : -1))

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">My deliveries</h1>
      <Card padded={false} className="px-2"><Tabs value={tab} onChange={(id) => setParams({ tab: id }, { replace: true })} tabs={TABS} /></Card>

      {tab === 'today' && (w.current ? (
        <>
          <div className="flex items-center justify-between gap-2 text-sm"><span className="font-medium text-ink tabular">{w.current.dispatchNumber} · {formatDate(w.current.dispatchDate)}</span><DispatchStatusBadge status={w.current.status} /></div>
          <ul className="space-y-2.5">{w.stops.map((d) => <StopCard key={d.id} d={d} highlight={w.next?.id === d.id} />)}</ul>
        </>
      ) : <Card><EmptyState icon={ListChecks} title="No active route" description="Assigned dispatches appear here." /></Card>)}

      {tab === 'upcoming' && (upcoming.length ? (
        <div className="space-y-4">
          {upcoming.map((dsp) => (
            <div key={dsp.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm"><span className="font-medium text-ink tabular">{dsp.dispatchNumber} · {formatDate(dsp.dispatchDate)}</span><DispatchStatusBadge status={dsp.status} /></div>
              {w.deliveries.some((d) => d.dispatchId === dsp.id)
                ? <ul className="space-y-2.5">{w.deliveries.filter((d) => d.dispatchId === dsp.id).sort((a, b) => a.sequence - b.sequence).map((d) => <StopCard key={d.id} d={d} />)}</ul>
                : <p className="rounded-lg border border-dashed border-line px-3 py-2 text-xs text-muted">{dsp.totalDeliveries} stop{dsp.totalDeliveries === 1 ? '' : 's'} · stops appear once the Dispatcher confirms loading.</p>}
            </div>
          ))}
        </div>
      ) : <Card><EmptyState icon={CalendarClock} title="Nothing upcoming" description="No other dispatches are assigned to you." /></Card>)}

      {tab === 'history' && (history.length
        ? <ul className="space-y-2.5">{history.map((d) => <StopCard key={d.id} d={d} />)}</ul>
        : <Card><EmptyState icon={History} title="No delivery history yet" /></Card>)}
    </div>
  )
}
