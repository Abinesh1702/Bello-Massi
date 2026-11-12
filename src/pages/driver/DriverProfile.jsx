import { IdCard, Phone, Mail, Warehouse, MapPinned, Truck, Settings, Gauge, FileText, FolderOpen, LogOut, CalendarCheck } from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Avatar from '../../components/common/Avatar'
import InfoList from '../../components/common/InfoList'
import { ActiveStatusBadge, AvailabilityBadge, LicenseBadge } from '../../components/dispatch/DispatchBadges'
import { NoDriverRecord } from '../../components/driver/DriverUi'
import { useDriverWorkspace } from '../../hooks/useDriverWorkspace'
import { useAuth } from '../../hooks/useAuth'
import { useSignOut } from '../../hooks/useSignOut'
import { getDriverPerformance } from '../../services/driverService'
import { formatDate, formatPercent } from '../../utils/formatters'

/** Driver's own profile: identity, licence, hub / zone / vehicle and delivery performance. */
export default function DriverProfile() {
  const { user } = useAuth()
  const w = useDriverWorkspace()
  const signOut = useSignOut()
  if (!w.driver) return <NoDriverRecord />
  const d = w.driver
  const perf = getDriverPerformance(d.id, w.deliveries, w.dispatches)
  const vehicle = w.lk.vehicles[d.vehicleId]
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={d.name} color={user.avatarColor} image={user.avatarImage} size="lg" />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-ink">{d.name}</h1>
            <p className="text-sm text-muted tabular">{d.code} · Emp. {d.employeeNumber}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5"><ActiveStatusBadge status={d.status} /><AvailabilityBadge value={d.availability} /></div>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Stops closed', perf.closed], ['Delivered', perf.delivered], ['Failed', perf.failed], ['Success rate', formatPercent(perf.successRate || 0)]].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-line bg-surface p-3 shadow-sm"><p className="text-xs text-muted">{l}</p><p className="mt-1 text-xl font-semibold text-ink tabular">{v ?? 0}</p></div>
        ))}
      </div>
      <Card>
        <CardHeader title="Today" icon={CalendarCheck} />
        <div className="grid grid-cols-4 gap-2 text-center">
          {[['Stops', w.summary?.total || 0], ['Completed', w.summary?.completed || 0], ['Pending', w.summary?.pending || 0], ['Failed', w.summary?.failed || 0]].map(([l, v]) => (
            <div key={l}><p className="text-xs text-muted">{l}</p><p className="text-lg font-semibold text-ink tabular">{v}</p></div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Current vehicle: {w.vehicle ? `${w.vehicle.vehicleNumber} · ${w.vehicle.type}` : 'none assigned today'}</p>
      </Card>
      <Card>
        <CardHeader title="Details" icon={IdCard} />
        <InfoList columns={1} items={[
          { label: 'Mobile', value: <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-muted" aria-hidden />{d.mobile}</span> },
          { label: 'Email', value: <span className="inline-flex items-center gap-1.5"><Mail size={13} className="text-muted" aria-hidden />{d.email || '—'}</span> },
          { label: 'Driving licence', value: <span className="inline-flex flex-wrap items-center gap-1.5 tabular">{d.licenseNumber} <LicenseBadge driver={d} /></span> },
          { label: 'Licence expiry', value: formatDate(d.licenseExpiry) },
          { label: 'Hub', value: <span className="inline-flex items-center gap-1.5"><Warehouse size={13} className="text-muted" aria-hidden />{w.lk.hubs[d.hubId]?.name || '—'}</span> },
          { label: 'Zone', value: <span className="inline-flex items-center gap-1.5"><MapPinned size={13} className="text-muted" aria-hidden />{w.lk.zones[d.zoneId]?.name || '—'}</span> },
          { label: 'Regular vehicle', value: <span className="inline-flex items-center gap-1.5"><Truck size={13} className="text-muted" aria-hidden />{vehicle ? `${vehicle.vehicleNumber} · ${vehicle.type}` : '—'}</span> },
        ]} />
        <p className="mt-3 flex gap-1.5 text-xs text-muted"><Gauge size={14} className="shrink-0" aria-hidden />Profile details are maintained by the Dispatcher in Driver Management.</p>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={FileText} to="/driver/delivery-notes">Delivery notes</Button>
        <Button variant="secondary" icon={FolderOpen} to="/driver/documents">My documents</Button>
        <Button variant="secondary" icon={FolderOpen} to="/driver/expenses" data-testid="driver-expenses-link">Expenses & cash</Button>
      </div>
      <Button variant="secondary" icon={Settings} to="/settings" fullWidth>Preferences &amp; password</Button>
      <Button variant="danger-outline" icon={LogOut} onClick={signOut} fullWidth>Sign out</Button>
    </div>
  )
}
