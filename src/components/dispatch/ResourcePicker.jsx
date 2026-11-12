import { UserRound, Truck, Check } from 'lucide-react'
import { AvailabilityBadge, LicenseBadge, VehicleStatusBadge } from './DispatchBadges'
import { driverAssignmentIssues } from '../../services/driverService'
import { vehicleAssignmentIssues } from '../../services/vehicleService'
import { formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const Option = ({ selected, disabled, onSelect, children, label, testId }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    aria-label={label}
    aria-disabled={disabled || undefined}
    data-testid={testId}
    onClick={() => !disabled && onSelect()}
    className={cn(
      'w-full rounded-xl border px-3 py-2.5 text-left transition-colors',
      selected ? 'border-accent bg-accent/10 ring-1 ring-accent' : 'border-line hover:bg-surface-2',
      disabled && 'opacity-60 cursor-not-allowed hover:bg-transparent',
    )}
  >
    {children}
  </button>
)

/**
 * Driver + vehicle selection for a dispatch. Every candidate at the hub is listed; those that fail
 * assignment validation are disabled with the reason shown.
 */
export default function ResourcePicker({ hubId, dispatchDate, dispatchId = null, load = 0, driverId, vehicleId, onDriver, onVehicle, drivers, vehicles, dispatches, errors = {} }) {
  const ctx = { hubId, dispatchDate, dispatchId, load }
  const hubDrivers = drivers.filter((d) => d.hubId === hubId)
  const hubVehicles = vehicles.filter((v) => v.hubId === hubId)
  if (!hubId) return <p className="text-sm text-muted">Select a hub to see its drivers and vehicles.</p>
  const driverRows = hubDrivers.map((d) => ({ d, issues: driverAssignmentIssues(d, ctx, dispatches) })).sort((a, b) => a.issues.length - b.issues.length)
  const vehicleRows = hubVehicles.map((v) => ({ v, issues: vehicleAssignmentIssues(v, ctx, dispatches) })).sort((a, b) => a.issues.length - b.issues.length || a.v.capacity - b.v.capacity)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"><UserRound size={15} aria-hidden /> Driver</p>
        <div role="radiogroup" aria-label="Driver" className="space-y-2">
          {driverRows.length === 0 && <p className="text-sm text-muted">No drivers at this hub.</p>}
          {driverRows.map(({ d, issues }) => (
            <Option key={d.id} selected={driverId === d.id} disabled={issues.length > 0} onSelect={() => onDriver(driverId === d.id ? '' : d.id)} label={`Driver ${d.name}`} testId={`driver-option-${d.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink">{driverId === d.id && <Check size={14} className="text-accent" aria-hidden />}{d.name} <span className="text-xs font-normal text-muted tabular">{d.code}</span></p>
                  <p className="text-xs text-muted">{d.mobile}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-1"><AvailabilityBadge value={d.availability} /><LicenseBadge driver={d} compact /></div>
              </div>
              {issues.map((x) => <p key={x.message} className="mt-1 text-xs text-danger">{x.message}</p>)}
            </Option>
          ))}
        </div>
        {errors.driverId && <p className="mt-2 text-xs text-danger" role="alert">{errors.driverId}</p>}
      </div>
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"><Truck size={15} aria-hidden /> Vehicle <span className="font-normal text-muted">· load {formatNumber(load)} units</span></p>
        <div role="radiogroup" aria-label="Vehicle" className="space-y-2">
          {vehicleRows.length === 0 && <p className="text-sm text-muted">No vehicles at this hub.</p>}
          {vehicleRows.map(({ v, issues }) => {
            const pct = v.capacity ? Math.min(100, (load / v.capacity) * 100) : 0
            return (
              <Option key={v.id} selected={vehicleId === v.id} disabled={issues.length > 0} onSelect={() => onVehicle(vehicleId === v.id ? '' : v.id)} label={`Vehicle ${v.vehicleNumber}`} testId={`vehicle-option-${v.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-ink tabular">{vehicleId === v.id && <Check size={14} className="text-accent" aria-hidden />}{v.vehicleNumber}</p>
                    <p className="text-xs text-muted truncate">{v.type} · {v.model}</p>
                  </div>
                  <VehicleStatusBadge status={v.status} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-surface-2 overflow-hidden" aria-hidden><div className={cn('h-full rounded-full', load > v.capacity ? 'bg-danger' : 'bg-[var(--chart-1)]')} style={{ width: `${pct}%` }} /></div>
                  <span className="text-[11px] text-muted tabular whitespace-nowrap">{formatNumber(load)} / {formatNumber(v.capacity)} {v.capacityUnit.toLowerCase()}</span>
                </div>
                {issues.map((x) => <p key={x.message} className="mt-1 text-xs text-danger">{x.message}</p>)}
              </Option>
            )
          })}
        </div>
        {errors.vehicleId && <p className="mt-2 text-xs text-danger" role="alert">{errors.vehicleId}</p>}
      </div>
    </div>
  )
}
