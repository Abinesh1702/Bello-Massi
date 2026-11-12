import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Pencil, UserRoundCheck, PackageCheck, XCircle, Route, Truck, UserRound, MapPinned, Calendar, Warehouse, Boxes, IndianRupee,
  ListOrdered, History, PackageMinus, Save, RotateCcw, Undo2, Eye, FileText, ClipboardCheck, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import InfoList from '../../components/common/InfoList'
import EmptyState from '../../components/common/EmptyState'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { PriorityBadge } from '../../components/orders/OrderBadges'
import { DeliveryStatusBadge, DispatchStatusBadge, OtpStatusBadge } from '../../components/dispatch/DispatchBadges'
import SequenceEditor from '../../components/dispatch/SequenceEditor'
import DispatchTimeline from '../../components/dispatch/DispatchTimeline'
import OtpInspector from '../../components/dispatch/OtpInspector'
import { AssignDialog, CancelDispatchDialog, ConfirmDispatchDialog, ReviewDeliveryDialog } from '../../components/dispatch/DispatchDialogs'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { canViewDispatch, getDispatchById, getSuggestedSequence, updateSequence } from '../../services/dispatchService'
import { getTimelineForDispatch } from '../../services/dispatchTimelineService'
import { DISPATCH_STATUS_META, EDITABLE_DISPATCH_STATUSES } from '../../config/dispatchConfig'
import { formatDate, formatDateTime, formatMoney, formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/helpers'
import { OrderAccessDenied } from '../orders/OrderDetail'

const FLOW = ['PLANNED', 'ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'COMPLETED']

function DispatchStepper({ dispatch }) {
  const step = DISPATCH_STATUS_META[dispatch.status]?.step ?? 0
  const cancelled = dispatch.status === 'CANCELLED'
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Dispatch progress">
      {FLOW.map((k, i) => {
        const done = !cancelled && step >= i + 1
        const label = k === 'COMPLETED' && dispatch.status === 'PARTIALLY_DELIVERED' ? 'Closed (exceptions)' : DISPATCH_STATUS_META[k].label
        return (
          <li key={k} className="min-w-0">
            <div className={cn('h-1.5 rounded-full', done ? (k === 'COMPLETED' && dispatch.status === 'PARTIALLY_DELIVERED' ? 'bg-warning' : 'bg-[var(--chart-1)]') : cancelled ? 'bg-surface-2' : 'bg-surface-2')} />
            <p className={cn('mt-1.5 flex items-center gap-1 truncate text-[11px] sm:text-xs font-medium', done ? 'text-ink' : 'text-muted')}>{done && <Check size={11} aria-hidden />}{label}</p>
          </li>
        )
      })}
    </ol>
  )
}

export default function DispatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const data = useDispatchData()
  const { dispatches, deliveries, timeline, lk, otps } = data
  const canManage = usePermission('dispatch.manage')
  const canInspect = usePermission('dispatch.otp.inspect')
  const tab = params.get('tab') || 'stops'
  const [dialog, setDialog] = useState(null)
  const [draftSeq, setDraftSeq] = useState(null)

  const dispatch = getDispatchById(id, dispatches)
  const mine = useMemo(() => deliveries.filter((d) => d.dispatchId === id), [deliveries, id])
  const events = useMemo(() => getTimelineForDispatch(id, timeline), [timeline, id])
  if (!dispatch) return <NotFoundRecord entity="dispatch" backTo="/dispatch/planning" backLabel="Back to dispatches" />
  if (!canViewDispatch(user, dispatch)) return <OrderAccessDenied />

  const byOrder = Object.fromEntries(mine.map((d) => [d.orderId, d]))
  const sequence = draftSeq || dispatch.orderIds
  const active = ['DRAFT', 'PLANNED', 'ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'].includes(dispatch.status)
  const seqEditable = canManage && active
  const delivered = mine.filter((d) => d.status === 'DELIVERED').length
  const closed = mine.filter((d) => ['DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED', 'RETURNED'].includes(d.status)).length
  const startedAny = mine.some((d) => d.status !== 'DISPATCHED' && d.status !== 'CANCELLED')
  const canCancel = canManage && (EDITABLE_DISPATCH_STATUSES.includes(dispatch.status) || (dispatch.status === 'CONFIRMED' && !startedAny))

  const stops = sequence.map((oid) => {
    const o = lk.orders[oid]
    const d = byOrder[oid]
    const locked = Boolean(d && d.status !== 'DISPATCHED')
    return {
      id: oid,
      title: `${o?.orderNumber || oid} · ${o?.customerName || ''}`,
      subtitle: `${o?.deliveryAddress || ''}, ${o?.deliveryCity || ''} ${o?.deliveryPincode || ''} · ${formatNumber(o?.totalQuantity)} units`,
      locked,
      lockReason: locked ? (d.status === 'OUT_FOR_DELIVERY' ? 'In progress — keeps its position' : 'Completed — keeps its position') : null,
      aside: <>{o && <PriorityBadge priority={o.orderPriority} />}{d && <DeliveryStatusBadge status={d.status} />}</>,
    }
  })
  const saveSeq = () => {
    const res = updateSequence(dispatch.id, draftSeq)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Delivery sequence saved', { description: dispatch.driverId && dispatch.status !== 'DRAFT' ? 'The driver has been notified.' : undefined })
    setDraftSeq(null)
  }
  const setTab = (t) => { const p = new URLSearchParams(params); p.set('tab', t); setParams(p, { replace: true }) }
  const zone = lk.zones[dispatch.zoneId]
  const hub = lk.hubs[dispatch.hubId]
  const reviewing = dialog?.type === 'review' ? mine.find((d) => d.id === dialog.id) : null

  return (
    <>
      <PageHeader title={dispatch.dispatchNumber} description={`${hub?.name || ''} · ${zone?.name || 'No zone'} · ${formatDate(dispatch.dispatchDate)}`}
        actions={<>
          <Button variant="secondary" icon={ArrowLeft} to="/dispatch/planning">Dispatches</Button>
          {canManage && EDITABLE_DISPATCH_STATUSES.includes(dispatch.status) && <Button variant="secondary" icon={Pencil} to={`/dispatch/${dispatch.id}/edit`}>Edit plan</Button>}
          {canManage && ['PLANNED', 'ASSIGNED'].includes(dispatch.status) && <Button variant={dispatch.status === 'PLANNED' ? 'primary' : 'secondary'} icon={UserRoundCheck} onClick={() => setDialog({ type: 'assign' })}>{dispatch.status === 'PLANNED' ? 'Assign driver & vehicle' : 'Change driver'}</Button>}
          {canManage && dispatch.status === 'ASSIGNED' && <Button variant="accent" icon={PackageCheck} onClick={() => setDialog({ type: 'confirm' })}>Confirm dispatch</Button>}
          {canCancel && <Button variant="danger-outline" icon={XCircle} onClick={() => setDialog({ type: 'cancel' })}>Cancel</Button>}
        </>}>
        <div className="mt-3 flex flex-wrap items-center gap-2"><DispatchStatusBadge status={dispatch.status} />{dispatch.stockDeducted && !dispatch.stockReversed && <span className="text-xs text-muted">Stock deducted {formatDateTime(dispatch.stockDeductedAt)}</span>}{dispatch.stockReversed && <span className="text-xs text-muted">Stock reversed on cancellation</span>}</div>
      </PageHeader>

      {dispatch.status === 'CANCELLED' && (
        <Card className="mb-6 border-danger/30"><p className="text-sm text-ink"><span className="font-semibold text-danger">Cancelled</span> {formatDateTime(dispatch.cancelledAt)} — {dispatch.cancelReason}{dispatch.cancelRemarks ? ` · “${dispatch.cancelRemarks}”` : ''}{dispatch.stockReversed ? ` · ${dispatch.reversalMovementIds.length} reversal movement(s) restored stock.` : ' · no stock was affected.'}</p></Card>
      )}
      <Card className="mb-6"><DispatchStepper dispatch={dispatch} /></Card>

      <StatGrid cols={5}>
        <StatCard label="Stops" value={dispatch.totalDeliveries} icon={ListOrdered} tone="brand" hint={mine.length ? `${closed} closed · ${delivered} delivered` : 'Not yet dispatched'} />
        <StatCard label="Quantity" value={formatNumber(dispatch.totalQuantity)} icon={Boxes} tone="info" hint={`${dispatch.totalProducts} products`} />
        <StatCard label="Value" value={formatMoney(dispatch.totalValue)} icon={IndianRupee} tone="accent" />
        <StatCard label="Progress" value={mine.length ? `${Math.round((closed / mine.length) * 100)}%` : '—'} icon={Route} tone="success" hint={mine.length ? `${mine.length - closed} pending` : 'Starts after confirmation'} />
        <StatCard label="Vehicle load" value={lk.vehicles[dispatch.vehicleId] ? `${Math.round((dispatch.totalQuantity / lk.vehicles[dispatch.vehicleId].capacity) * 100)}%` : '—'} icon={Truck} tone="neutral" hint={dispatch.vehicleNumber || 'No vehicle yet'} />
      </StatGrid>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Dispatch" icon={Route} />
          <InfoList columns={1} items={[
            { label: 'Dispatch date', value: <span className="inline-flex items-center gap-1"><Calendar size={13} /> {formatDate(dispatch.dispatchDate)}</span> },
            { label: 'Hub', value: <span className="inline-flex items-center gap-1"><Warehouse size={13} /> {hub?.name}</span> },
            { label: 'Zone', value: <span className="inline-flex items-center gap-1"><MapPinned size={13} /> {zone?.name || '—'}</span> },
            { label: 'Driver', value: dispatch.driverId ? <span className="inline-flex items-center gap-1"><UserRound size={13} /> {lk.drivers[dispatch.driverId] && canManage ? <Button variant="link" to={`/dispatch/drivers/${dispatch.driverId}`}>{dispatch.driverName}</Button> : dispatch.driverName}</span> : 'Not assigned' },
            { label: 'Vehicle', value: dispatch.vehicleNumber ? `${dispatch.vehicleNumber} · ${lk.vehicles[dispatch.vehicleId]?.type || ''}` : 'Not assigned' },
            { label: 'Created', value: `${formatDateTime(dispatch.createdAt)}${dispatch.createdByName ? ` by ${dispatch.createdByName}` : ''}` },
            { label: 'Confirmed', value: formatDateTime(dispatch.confirmedAt) },
            { label: 'Started', value: formatDateTime(dispatch.startedAt) },
            { label: 'Completed', value: formatDateTime(dispatch.completedAt) },
            { label: 'Notes', value: dispatch.notes },
          ]} />
        </Card>
        <Card className="lg:col-span-2">
          <Tabs value={tab} onChange={setTab} className="mb-4" tabs={[
            { id: 'stops', label: `Stops (${dispatch.orderIds.length})`, icon: ListOrdered },
            { id: 'stock', label: 'Stock', icon: PackageMinus },
            { id: 'timeline', label: `Timeline (${events.length})`, icon: History },
          ]} />
          {tab === 'stops' && (
            <div className="space-y-4">
              {seqEditable ? (
                <>
                  <SequenceEditor stops={stops} onChange={setDraftSeq} />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setDraftSeq(getSuggestedSequence(dispatch))}>Reset to suggested</Button>
                    {draftSeq && <Button size="sm" variant="secondary" onClick={() => setDraftSeq(null)}>Discard</Button>}
                    <Button size="sm" icon={Save} onClick={saveSeq} disabled={!draftSeq || JSON.stringify(draftSeq) === JSON.stringify(dispatch.orderIds)}>Save sequence</Button>
                  </div>
                </>
              ) : (
                <ol className="space-y-2">{stops.map((s, i) => <li key={s.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-sm font-semibold tabular">{i + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.title}</p><p className="truncate text-xs text-muted">{s.subtitle}</p></div><div className="hidden sm:flex gap-1.5">{s.aside}</div></li>)}</ol>
              )}
              {mine.length > 0 && (
                <div>
                  <p className="mb-2 mt-2 text-sm font-semibold text-ink">Deliveries</p>
                  <ul className="divide-y divide-line rounded-xl border border-line">
                    {[...mine].sort((a, b) => a.sequence - b.sequence).map((d) => {
                      const latest = otps.filter((o) => o.deliveryId === d.id).sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1))[0]
                      return (
                        <li key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                          <span className="text-xs font-semibold text-muted tabular w-6">#{d.sequence}</span>
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{d.orderNumber} · {d.customerName}</p><p className="text-xs text-muted">{d.deliveryNoteNumber ? `Note ${d.deliveryNoteNumber}` : d.failureReason || (d.startedAt ? `Started ${formatDateTime(d.startedAt)}` : 'Not started')}</p></div>
                          <DeliveryStatusBadge status={d.status} />
                          {canInspect && d.status === 'OUT_FOR_DELIVERY' && <OtpInspector otp={latest} compact />}
                          {d.otpStatus === 'VERIFIED' && <OtpStatusBadge status="VERIFIED" />}
                          <div className="flex gap-1">
                            {canManage && d.reviewStatus === 'PENDING' && <Button size="xs" variant="accent" icon={ClipboardCheck} onClick={() => setDialog({ type: 'review', id: d.id })}>Review</Button>}
                            {d.deliveryNoteId && <Button size="xs" variant="secondary" icon={FileText} to={`/dispatch/delivery-notes/${d.deliveryNoteId}`}>Note</Button>}
                            <Button size="xs" variant="ghost" icon={Eye} onClick={() => navigate(`/dispatch/deliveries/${d.id}`)} aria-label={`Open delivery ${d.orderNumber}`}>Open</Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
          {tab === 'stock' && (
            dispatch.stockSnapshot.length ? (
              <div className="overflow-x-auto -mx-1 px-1">
                <p className="mb-3 text-sm text-muted">{dispatch.stockReversed ? 'Deducted on confirmation, then reversed on cancellation.' : 'Deducted exactly once when the dispatch was confirmed. Delivery confirmation does not move stock again.'}</p>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted"><th className="py-2 pr-3">Order</th><th className="py-2 pr-3">Product</th><th className="py-2 pr-3 text-right">Qty</th><th className="py-2 pr-3 text-right">Available</th><th className="py-2">Movement</th></tr></thead>
                  <tbody>
                    {dispatch.stockSnapshot.map((s) => (
                      <tr key={`${s.orderItemId}`} className="border-b border-line/60">
                        <td className="py-2 pr-3 tabular whitespace-nowrap">{s.orderNumber}</td>
                        <td className="py-2 pr-3">{s.productName}</td>
                        <td className="py-2 pr-3 text-right tabular whitespace-nowrap">{formatNumber(s.quantity)} {s.unit}</td>
                        <td className="py-2 pr-3 text-right tabular whitespace-nowrap">{s.previousAvailable !== null && s.previousAvailable !== undefined ? `${formatNumber(s.previousAvailable)} → ${formatNumber(s.newAvailable)}` : '—'}</td>
                        <td className="py-2 text-xs text-muted whitespace-nowrap">{s.movementNumber || (s.preLedger ? 'Before stock ledger' : s.tracked ? '—' : 'Not tracked')}{s.reservedReleased ? ` · reservation released (${s.reservedReleased})` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dispatch.stockReversed && <p className="mt-3 flex items-center gap-1.5 text-sm text-ink"><Undo2 size={14} /> {dispatch.reversalMovementIds.length} reversal movement(s) recorded.</p>}
              </div>
            ) : <EmptyState compact icon={PackageMinus} title="No stock has moved" description="Draft, planned and assigned dispatches never touch stock. Stock is deducted when the dispatch is confirmed." />
          )}
          {tab === 'timeline' && <DispatchTimeline events={events} />}
        </Card>
      </div>

      {dialog?.type === 'assign' && <AssignDialog key="assign" dispatch={dispatch} open onClose={() => setDialog(null)} />}
      {dialog?.type === 'confirm' && <ConfirmDispatchDialog key="confirm" dispatch={dispatch} open onClose={() => setDialog(null)} />}
      {dialog?.type === 'cancel' && <CancelDispatchDialog key="cancel" dispatch={dispatch} open onClose={() => setDialog(null)} />}
      {reviewing && <ReviewDeliveryDialog key={reviewing.id} delivery={reviewing} open onClose={() => setDialog(null)} />}
    </>
  )
}
