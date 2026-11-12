import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Route, Save, X, Plus, Minus, MapPinned, ListOrdered, UserRoundCheck, Gauge, AlertTriangle, Info, Wand2, FileText, Lock } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Checkbox from '../../components/common/Checkbox'
import EmptyState from '../../components/common/EmptyState'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { PriorityBadge } from '../../components/orders/OrderBadges'
import SequenceEditor from '../../components/dispatch/SequenceEditor'
import ResourcePicker from '../../components/dispatch/ResourcePicker'
import { DispatchStatusBadge } from '../../components/dispatch/DispatchBadges'
import { useDispatchData } from '../../hooks/useDispatchData'
import { createDispatch, getDispatchById, getEligibleOrders, peekNextDispatchNumber, suggestSequence, updateDispatch, validateDispatch } from '../../services/dispatchService'
import { EDITABLE_DISPATCH_STATUSES } from '../../config/dispatchConfig'
import { formatMoney, formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

const TODAY = dayjs().format('YYYY-MM-DD')

function Workspace({ existing, initial }) {
  const navigate = useNavigate()
  const data = useDispatchData()
  const { hubs, zones, drivers, vehicles, dispatches, lk } = data
  const [v, setV] = useState(initial)
  const [errors, setErrors] = useState({})
  const [allZones, setAllZones] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (patch) => { setV((x) => ({ ...x, ...patch })); setErrors({}) }

  const dispatchId = existing?.id || null
  const candidates = useMemo(() => (v.hubId ? getEligibleOrders({ hubId: v.hubId, dispatchId }, data.orders, dispatches) : []), [v.hubId, dispatchId, data.orders, dispatches])
  const available = candidates.filter((o) => !v.orderIds.includes(o.id) && (allZones || !v.zoneId || o.zoneId === v.zoneId))
  const byZone = available.reduce((acc, o) => { (acc[o.zoneId || ''] ||= []).push(o); return acc }, {})
  const selected = v.orderIds.map((id) => lk.orders[id]).filter(Boolean)
  const check = useMemo(() => validateDispatch(v, { mode: 'plan', dispatchId }), [v, dispatchId, data]) // eslint-disable-line react-hooks/exhaustive-deps
  const vehicle = lk.vehicles[v.vehicleId]
  const load = check.totals.totalQuantity
  const hubZones = zones.filter((z) => z.hubId === v.hubId)

  const add = (ids) => set({ orderIds: [...v.orderIds, ...ids.filter((x) => !v.orderIds.includes(x))] })
  const remove = (id) => set({ orderIds: v.orderIds.filter((x) => x !== id) })
  const onHub = (hubId) => set({ hubId, zoneId: '', orderIds: [], driverId: '', vehicleId: '' })

  const save = (mode) => {
    if (busy) return
    setBusy(true)
    const res = existing ? updateDispatch(existing.id, v, { mode }) : createDispatch(v, { mode })
    setBusy(false)
    if (!res.ok) {
      setErrors(res.errors || {})
      toast.error(res.error || 'Please fix the highlighted items.')
      return
    }
    const r = res.record
    toast.success(existing ? `${r.dispatchNumber} updated` : `${r.dispatchNumber} ${r.status === 'DRAFT' ? 'saved as draft' : 'created'}`, {
      description: r.status === 'ASSIGNED' ? `${r.driverName} and ${r.vehicleNumber} assigned — confirm the dispatch when the vehicle is loaded.` : r.status === 'PLANNED' ? 'Assign a driver and vehicle next.' : 'Complete the plan later.',
    })
    navigate(`/dispatch/${r.id}`, { replace: true })
  }

  const draftAllowed = !existing || existing.status === 'DRAFT'
  const stops = selected.map((o) => ({
    id: o.id,
    title: `${o.orderNumber} · ${o.customerName}`,
    subtitle: `${o.deliveryAddress}, ${o.deliveryCity} ${o.deliveryPincode} · ${formatNumber(o.totalQuantity)} units`,
    aside: <><PriorityBadge priority={o.orderPriority} /><button type="button" onClick={() => remove(o.id)} aria-label={`Remove ${o.orderNumber}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-danger hover:bg-surface-2"><Minus size={15} /></button></>,
  }))

  return (
    <>
      <PageHeader title={existing ? `Edit ${existing.dispatchNumber}` : 'New dispatch plan'} description={existing ? 'Change orders, sequence, date, zone, driver or vehicle. Nothing touches stock until the dispatch is confirmed.' : `Will be numbered ${peekNextDispatchNumber()}. Select ready orders from one hub, arrange the route and assign a driver and vehicle.`}
        actions={<Button variant="secondary" icon={X} to={existing ? `/dispatch/${existing.id}` : '/dispatch/planning'}>Cancel</Button>}>
        {existing && <div className="mt-3"><DispatchStatusBadge status={existing.status} /></div>}
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="1 · Hub, date & zone" icon={MapPinned} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Dispatching hub" required value={v.hubId} onChange={(e) => onHub(e.target.value)} placeholder="Select hub" error={errors.hubId}
                options={hubs.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: h.name }))} />
              <Input label="Dispatch date" required type="date" min={TODAY} value={v.dispatchDate} onChange={(e) => set({ dispatchDate: e.target.value })} error={errors.dispatchDate} />
              <Select label="Delivery zone" required value={v.zoneId} onChange={(e) => set({ zoneId: e.target.value })} error={errors.zoneId} className="sm:col-span-2" disabled={!v.hubId}
                placeholder={v.hubId ? 'Select zone' : 'Select a hub first'} options={hubZones.map((z) => ({ value: z.id, label: `${z.name}${z.status !== 'Active' ? ' (inactive — cannot be used)' : ''}` }))} />
            </div>
          </Card>
          <Card>
            <CardHeader title="2 · Ready orders" icon={ListOrdered} subtitle={v.hubId ? `${candidates.length} eligible at ${lk.hubs[v.hubId]?.name}` : 'Select a hub to load its ready orders'}
              action={v.zoneId && <Checkbox label="Show all zones" checked={allZones} onChange={(e) => setAllZones(e.target.checked)} />} />
            {!v.hubId && <EmptyState compact icon={MapPinned} title="No hub selected" />}
            {v.hubId && !available.length && <EmptyState compact title={candidates.length ? 'Every eligible order is already on this plan' : 'No orders ready for dispatch at this hub'} description={!allZones && v.zoneId && candidates.length > selected.length ? 'Tick “Show all zones” to see orders in neighbouring zones.' : undefined} />}
            <div className="space-y-4">
              {Object.entries(byZone).map(([zid, list]) => (
                <div key={zid || 'none'}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{lk.zones[zid]?.name || 'No zone'} · {list.length}</p>
                    <Button size="xs" variant="ghost" icon={Plus} onClick={() => add(list.map((o) => o.id))}>Add all</Button>
                  </div>
                  <ul className="space-y-1.5">
                    {list.map((o) => (
                      <li key={o.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink"><span className="tabular">{o.orderNumber}</span> · {o.customerName}</p>
                          <p className="truncate text-xs text-muted">{o.deliveryPincode} · {formatNumber(o.totalQuantity)} units · {formatMoney(o.totalAmount)}</p>
                        </div>
                        {o.orderPriority !== 'Normal' && <PriorityBadge priority={o.orderPriority} />}
                        <Button size="xs" variant="secondary" icon={Plus} onClick={() => add([o.id])} aria-label={`Add ${o.orderNumber}`}>Add</Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-3">
          <Card>
            <CardHeader title="3 · Delivery sequence" icon={Route} subtitle="Drag stops or use the arrows. The driver follows this order."
              action={selected.length > 1 && <Button size="sm" variant="secondary" icon={Wand2} onClick={() => set({ orderIds: suggestSequence(selected).map((o) => o.id) })}>Suggest route</Button>} />
            <SequenceEditor stops={stops} onChange={(orderIds) => set({ orderIds })} emptyText="Add ready orders from the list to build the route." />
            {errors.orderIds && <p className="mt-2 text-sm text-danger" role="alert">{errors.orderIds}</p>}
          </Card>
          <Card>
            <CardHeader title="4 · Load summary" icon={Gauge} />
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
              {[['Orders', check.totals.totalDeliveries], ['Products', check.totals.totalProducts], ['Quantity', formatNumber(check.totals.totalQuantity)], ['Value', formatMoney(check.totals.totalValue)], ['Est. load', vehicle ? `${formatNumber(load)} / ${formatNumber(vehicle.capacity)}` : formatNumber(load)]].map(([l, x]) => (
                <div key={l} className="rounded-lg bg-surface-2 px-3 py-2 min-w-0"><p className="text-[11px] text-muted">{l}</p><p className="truncate text-sm font-semibold text-ink tabular">{x}</p></div>
              ))}
            </div>
            {vehicle && (
              <div className="mt-3">
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={vehicle.capacity} aria-valuenow={load} aria-label="Vehicle load">
                  <div className={cn('h-full rounded-full', load > vehicle.capacity ? 'bg-danger' : 'bg-[var(--chart-1)]')} style={{ width: `${Math.min(100, (load / vehicle.capacity) * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted">{Math.round((load / vehicle.capacity) * 100)}% of {vehicle.vehicleNumber}'s capacity</p>
              </div>
            )}
            {check.warnings.map((w) => <p key={w} className="mt-3 flex items-start gap-2 text-xs text-warning"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {w}</p>)}
          </Card>
          <Card>
            <CardHeader title="5 · Driver & vehicle" icon={UserRoundCheck} subtitle="Optional now — a plan without a driver is saved as Planned and assigned later." />
            <ResourcePicker hubId={v.hubId} dispatchDate={v.dispatchDate} dispatchId={dispatchId} load={load} driverId={v.driverId} vehicleId={v.vehicleId}
              onDriver={(driverId) => set({ driverId })} onVehicle={(vehicleId) => set({ vehicleId })} drivers={drivers} vehicles={vehicles} dispatches={dispatches} errors={errors} />
          </Card>
          <Card>
            <Textarea label="Dispatch notes" value={v.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} maxLength={300} />
            {errors.form && <p className="mt-3 text-sm text-danger" role="alert">{errors.form}</p>}
            <p className="mt-3 flex items-start gap-2 text-xs text-muted"><Info size={13} className="mt-0.5 shrink-0" /> Saving a plan never changes stock. Stock is deducted once, when the Dispatcher confirms the loaded vehicle.</p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {draftAllowed && <Button variant="secondary" icon={FileText} onClick={() => save('draft')} loading={busy}>Save draft</Button>}
              <Button icon={Save} onClick={() => save('plan')} loading={busy}>{existing && existing.status !== 'DRAFT' ? 'Save changes' : v.driverId && v.vehicleId ? 'Create & assign' : 'Create plan'}</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

export default function DispatchForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { dispatches, orders } = useDispatchData()
  if (!id) {
    const preIds = (params.get('orders') || '').split(',').filter(Boolean)
    const pre = preIds.map((x) => orders.find((o) => o.id === x)).filter(Boolean)
    const hubId = params.get('hubId') || pre[0]?.hubId || ''
    const zoneCounts = pre.reduce((a, o) => ({ ...a, [o.zoneId]: (a[o.zoneId] || 0) + 1 }), {})
    const zoneId = params.get('zoneId') || Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
    const initial = { hubId, dispatchDate: TODAY, zoneId, orderIds: suggestSequence(pre.filter((o) => o.hubId === hubId)).map((o) => o.id), driverId: '', vehicleId: '', notes: '' }
    return <Workspace key="new" initial={initial} />
  }
  const existing = getDispatchById(id, dispatches)
  if (!existing) return <NotFoundRecord entity="dispatch" backTo="/dispatch/planning" backLabel="Back to planning" />
  if (!EDITABLE_DISPATCH_STATUSES.includes(existing.status)) {
    return <EmptyState icon={Lock} title={`${existing.dispatchNumber} can no longer be edited`} description="Confirmed, in-transit, completed and cancelled dispatches are locked. Delivery sequence of pending stops can still be changed on the dispatch page." action={<Button to={`/dispatch/${existing.id}`}>Open dispatch</Button>} />
  }
  const initial = { hubId: existing.hubId, dispatchDate: existing.dispatchDate || TODAY, zoneId: existing.zoneId, orderIds: existing.orderIds, driverId: existing.driverId || '', vehicleId: existing.vehicleId || '', notes: existing.notes || '' }
  return <Workspace key={existing.id} existing={existing} initial={initial} />
}
