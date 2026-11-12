import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Send, Trash2, Copy, Gavel, Layers, Truck, RotateCcw, XCircle, CheckCircle2, User, Warehouse, MapPin, CreditCard, History, ClipboardList, Lock, ShieldAlert, Package, Ban, Repeat } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Tabs from '../../components/common/Tabs'
import InfoList from '../../components/common/InfoList'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import Modal from '../../components/common/Modal'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import OrderFulfilmentPanel from '../../components/orders/OrderFulfilmentPanel'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import OrderStepper from '../../components/orders/OrderStepper'
import OrderItemsTable from '../../components/orders/OrderItemsTable'
import OrderTotals from '../../components/orders/OrderTotals'
import OrderTimeline from '../../components/orders/OrderTimeline'
import CustomerCreditPanel from '../../components/orders/CustomerCreditPanel'
import OrderDeliveryCard from '../../components/dispatch/OrderDeliveryCard'
import { ApprovalStatusBadge, ConsolidationStatusBadge, CreditWarningBadge, OrderStatusBadge, PriorityBadge, StockWarningBadge } from '../../components/orders/OrderBadges'
import { useMasterData } from '../../hooks/useMasterData'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { cancelBlockReason, cancelOrder, canEditOrder, canViewOrder, deleteDraftOrder, duplicateOrder, getOrderById, isOwnOrder, submitOrder } from '../../services/orderService'
import { getApprovalHistory, isPending } from '../../services/approvalService'
import { getConsolidationForOrder, isAwaitingConsolidation, markReadyForDispatch } from '../../services/consolidationService'
import { getOrderTimelineByOrderId } from '../../services/orderTimelineService'
import { STORAGE_KEYS, ORDER_STATUS as S } from '../../utils/constants'
import { ROLES } from '../../config/roles'
import { ORDER_OPTIONS, ORDER_SOURCES } from '../../config/orderConfig'
import { formatDate, formatDateTime, formatMoney } from '../../utils/formatters'
import { scopeOf } from '../../services/rbacService'

export function OrderAccessDenied() {
  return (
    <Card>
      <EmptyState icon={ShieldAlert} title="You don’t have access to this order" description="Orders are visible according to your role — for example, drafts are private to the salesman who created them." action={<Button to="/orders">Back to orders</Button>} />
    </Card>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { orders, customers, hubs, inventory, lookups } = useMasterData()
  const timelineAll = useStoredValue(STORAGE_KEYS.ORDER_TIMELINE, [])
  const approvalsAll = useStoredValue(STORAGE_KEYS.APPROVALS, [])
  const consolidationsAll = useStoredValue(STORAGE_KEYS.CONSOLIDATIONS, [])
  const canCreate = usePermission('orders.create')
  const canApprove = usePermission('orders.approve')
  const canConsolidate = usePermission('orders.consolidate')
  const canCancel = usePermission('sales.orderchanges.approve')
  const canRequestChange = usePermission('sales.orderchanges.request')
  const dispatchesAll = useStoredValue(STORAGE_KEYS.DISPATCHES, [])
  const [cancelling, setCancelling] = useState(null) // { reason, remarks, errors }
  const [tab, setTab] = useState('overview')
  const [action, setAction] = useState(null) // 'submit' | 'delete' | 'ready'
  const [busy, setBusy] = useState(false)

  const order = getOrderById(id, orders)
  const events = useMemo(() => getOrderTimelineByOrderId(id, timelineAll), [id, timelineAll])
  const approvals = useMemo(() => getApprovalHistory(id, approvalsAll), [id, approvalsAll])
  const consolidation = useMemo(() => getConsolidationForOrder(id, consolidationsAll), [id, consolidationsAll])

  if (!order) return <NotFoundRecord entity="order" backTo="/orders" backLabel="Back to orders" />
  if (!canViewOrder(user, order)) return <OrderAccessDenied />

  const customer = customers.find((c) => c.id === order.customerId)
  const hub = hubs.find((h) => h.id === order.hubId)
  const editable = canEditOrder(user, order)
  const ownerOrAdmin = scopeOf(user) === ROLES.ADMIN || isOwnOrder(user, order)
  const showStock = [ROLES.ADMIN, ROLES.SALES_MANAGER, ROLES.CUSTOMER_SERVICE, ROLES.SALESMAN].includes(scopeOf(user)) && [S.DRAFT, S.SUBMITTED, S.RETURNED, S.APPROVED, S.CONSOLIDATED].includes(order.orderStatus)
  const name = (uid) => lookups.people[uid]?.name || (uid ? 'Unknown user' : '—')

  const run = () => {
    setBusy(true)
    let res
    if (action === 'submit') res = submitOrder(order.id)
    if (action === 'delete') res = deleteDraftOrder(order.id)
    if (action === 'ready') res = markReadyForDispatch(order.id)
    setBusy(false)
    const kind = action
    setAction(null)
    if (!res.ok) {
      if (kind === 'submit' && res.errors && !res.errors.form) {
        toast.error('This draft is incomplete', { description: 'Open it in the editor to fill in the highlighted fields.' })
        navigate(`/orders/${order.id}/edit`)
        return
      }
      return toast.error(res.error || 'Action failed')
    }
    if (kind === 'submit') toast.success(`${res.record.orderNumber} submitted for approval`, { description: 'The Sales Manager has been notified.' })
    if (kind === 'ready') toast.success(`${order.orderNumber} is ready for dispatch`, { description: 'The Dispatcher has been notified.' })
    if (kind === 'delete') { toast.success('Draft deleted'); navigate('/orders/my-orders', { replace: true }) }
  }
  const cancelWhy = cancelBlockReason(order, dispatchesAll)
  const onCancel = () => {
    const reason = cancelling.reason === 'Other' ? cancelling.remarks.trim() : cancelling.reason
    if (!cancelling.reason) return setCancelling({ ...cancelling, errors: { reason: 'Choose a reason.' } })
    if (cancelling.reason === 'Other' && cancelling.remarks.trim().length < 3) return setCancelling({ ...cancelling, errors: { remarks: 'Describe the reason.' } })
    const res = cancelOrder(order.id, { reason, remarks: cancelling.reason === 'Other' ? '' : cancelling.remarks })
    if (!res.ok) return toast.error(res.error)
    setCancelling(null)
    return toast.success(`${order.orderNumber} cancelled`, { description: res.released ? `${res.released} reserved units are available again.` : 'The salesman has been notified.' })
  }
  const onDuplicate = () => {
    const res = duplicateOrder(order.id)
    if (!res.ok) return toast.error(res.error)
    toast.success('Duplicated as a new draft')
    navigate(`/orders/${res.record.id}/edit`)
  }

  const actions = (
    <>
      <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>Back</Button>
      {canCreate && <Button variant="secondary" icon={Copy} onClick={onDuplicate}>Duplicate</Button>}
      {order.orderStatus === S.DRAFT && ownerOrAdmin && <Button variant="danger-outline" icon={Trash2} onClick={() => setAction('delete')}>Delete draft</Button>}
      {editable && order.orderStatus === S.DRAFT && <Button variant="secondary" icon={Pencil} to={`/orders/${id}/edit`}>Edit</Button>}
      {editable && order.orderStatus === S.DRAFT && <Button icon={Send} onClick={() => setAction('submit')}>Submit for approval</Button>}
      {editable && order.orderStatus === S.RETURNED && <Button icon={RotateCcw} to={`/orders/${id}/edit`}>Correct & resubmit</Button>}
      {canApprove && isPending(order) && <Button icon={Gavel} to={`/orders/approval/${id}`}>Review & decide</Button>}
      {canConsolidate && isAwaitingConsolidation(order) && <Button icon={Layers} to={`/orders/consolidation/${id}`}>Consolidate</Button>}
      {canConsolidate && order.orderStatus === S.CONSOLIDATED && <Button icon={Truck} onClick={() => setAction('ready')}>Mark ready for dispatch</Button>}
      {canCancel && !cancelWhy && <Button variant="danger-outline" icon={Ban} onClick={() => setCancelling({ reason: '', remarks: '', errors: {} })}>Cancel order</Button>}
      {!canCancel && canRequestChange && !cancelWhy && <Button variant="secondary" icon={Repeat} to={`/sales/order-changes/new?orderId=${order.id}`}>Request change / cancellation</Button>}
    </>
  )

  return (
    <>
      <PageHeader title={order.orderNumber || 'Draft order'} description={`${order.customerName} · ${formatDate(order.orderDate)} · ${order.orderType}`} actions={actions} />

      <Card className="mb-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.orderStatus} />
          <ApprovalStatusBadge status={order.approvalStatus} />
          <PriorityBadge priority={order.orderPriority} />
          {order.creditWarning && <CreditWarningBadge />}
          {order.stockWarning && <StockWarningBadge label="Stock shortage at submission" />}
          {order.resubmissionCount > 0 && <Badge tone="info">Resubmitted ×{order.resubmissionCount}</Badge>}
          {!editable && ![S.DRAFT, S.RETURNED].includes(order.orderStatus) && <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted"><Lock size={12} /> Locked — {order.orderStatus === S.SUBMITTED ? 'awaiting approval' : 'no longer editable'}</span>}
        </div>
        <OrderStepper order={order} />
      </Card>

      {order.orderStatus === S.RETURNED && (
        <Banner tone="warning" icon={RotateCcw} title={`Returned for correction: ${order.returnReason}`} text={order.returnRemarks} meta={`${name(order.returnedBy)} · ${formatDateTime(order.returnedAt)}`} />
      )}
      {order.orderStatus === S.REJECTED && (
        <Banner tone="danger" icon={XCircle} title={`Rejected: ${order.rejectionReason}`} text={order.rejectionRemarks} meta={`${name(order.rejectedBy)} · ${formatDateTime(order.rejectedAt)} · Duplicate the order to start a new draft.`} />
      )}
      {order.orderStatus === S.CANCELLED && (
        <Banner tone="danger" icon={Ban} title={`Cancelled: ${order.cancelReason || 'no reason recorded'}`} text={order.cancelRemarks} meta={[name(order.cancelledBy), formatDateTime(order.cancelledAt), order.cancelRequestNumber && `request ${order.cancelRequestNumber}`].filter(Boolean).join(' · ')} />
      )}
      {order.orderStatus === S.DRAFT && (
        <Banner tone="neutral" icon={Lock} title="Private draft" text="Only you and administrators can see this draft. It has no order number yet and does not enter the approval queue until you submit it." />
      )}

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview', icon: ClipboardList },
          { id: 'timeline', label: `Timeline (${events.length})`, icon: History },
          { id: 'approvals', label: `Approval history (${approvals.length})`, icon: Gavel },
          { id: 'consolidation', label: 'Fulfilment', icon: Truck },
        ]}
      />

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'overview' && (
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2 min-w-0">
              <Card>
                <CardHeader title="Products" subtitle={showStock ? `${order.items.length} lines · current ${order.hubName} stock shown for reference` : `${order.items.length} lines`} icon={Package} />
                <OrderItemsTable order={order} inventory={showStock ? inventory : null} />
                <div className="mt-4 ml-auto max-w-sm"><OrderTotals totals={order} /></div>
              </Card>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader title="Delivery" icon={MapPin} />
                  <InfoList columns={1} items={[
                    { label: 'Address', value: `${order.deliveryAddress}, ${order.deliveryCity}, ${order.deliveryState} ${order.deliveryPincode}` },
                    { label: 'Requested delivery date', value: formatDate(order.requestedDeliveryDate) },
                    { label: 'Instructions', value: order.deliveryInstructions },
                  ]} />
                </Card>
                <Card>
                  <CardHeader title="Order details" icon={ClipboardList} />
                  <InfoList columns={1} items={[
                    { label: 'Order source', value: ORDER_SOURCES.find((s) => s.value === order.orderSource)?.label },
                    { label: 'Payment terms', value: order.paymentTerms === 'Credit' ? `Credit · ${order.creditDays} days` : order.paymentTerms },
                    { label: 'Customer reference', value: order.customerReference },
                    { label: 'Created', value: `${formatDateTime(order.createdAt)} by ${name(order.createdBy)}` },
                    { label: 'Last updated', value: `${formatDateTime(order.updatedAt)} by ${name(order.updatedBy)}` },
                    { label: 'Duplicated from', value: order.duplicatedFrom ? (lookupNumber(orders, order.duplicatedFrom)) : '' },
                    { label: 'Notes', value: order.notes },
                  ]} />
                </Card>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader title="Approval" icon={CheckCircle2} action={<ApprovalStatusBadge status={order.approvalStatus} />} />
                  <InfoList columns={1} items={[
                    { label: 'Submitted', value: order.submittedAt ? `${formatDateTime(order.submittedAt)} by ${name(order.submittedBy)}` : 'Not submitted' },
                    { label: 'Approved', value: order.approvedAt ? `${formatDateTime(order.approvedAt)} by ${name(order.approvedBy)}` : '', hidden: !order.approvedAt },
                    { label: 'Approval remarks', value: order.approvalRemarks, hidden: !order.approvedAt },
                    { label: 'Rejected', value: order.rejectedAt ? `${formatDateTime(order.rejectedAt)} by ${name(order.rejectedBy)}` : '', hidden: !order.rejectedAt },
                    { label: 'Returned', value: order.returnedAt ? `${formatDateTime(order.returnedAt)} by ${name(order.returnedBy)}` : '', hidden: !order.returnedAt },
                  ]} />
                </Card>
                <Card>
                  <CardHeader title="Consolidation" icon={Layers} action={<ConsolidationStatusBadge status={order.consolidationStatus} />} />
                  <InfoList columns={1} items={[
                    { label: 'Consolidation', value: consolidation ? `${consolidation.consolidationNumber} · ${formatDateTime(consolidation.consolidationDate)} by ${consolidation.consolidatedByName}` : order.consolidationStatus === 'PENDING' ? 'In the Customer Service queue' : 'Not started' },
                    { label: 'Ready for dispatch', value: order.readyForDispatchAt ? `${formatDateTime(order.readyForDispatchAt)} by ${name(order.readyForDispatchBy)}` : '' },
                  ]} />
                </Card>
                <OrderDeliveryCard order={order} />
              </div>
            </div>
            <div className="space-y-6 min-w-0">
              <Card>
                <CardHeader title="Customer & credit" icon={CreditCard} />
                <CustomerCreditPanel customer={customer} orderTotal={[S.DRAFT, S.SUBMITTED, S.RETURNED].includes(order.orderStatus) ? order.totalAmount : 0} showProjection={[S.DRAFT, S.SUBMITTED, S.RETURNED].includes(order.orderStatus)} />
                {customer && order.customerName !== customer.name && <p className="mt-3 text-xs text-muted">Ordered as “{order.customerName}” — the customer has since been renamed.</p>}
              </Card>
              <Card>
                <CardHeader title="Salesman" icon={User} />
                <p className="font-medium text-ink">{order.salesmanName}</p>
                <p className="text-sm text-muted">{lookups.people[order.salesmanId]?.phone || lookups.people[order.salesmanId]?.title || 'Sales team'}</p>
              </Card>
              <Card>
                <CardHeader title="Fulfilment hub" icon={Warehouse} />
                <p className="font-medium text-ink">{order.hubName || '—'}</p>
                {hub && <p className="text-sm text-muted">{hub.city} · {hub.managerName} · {hub.contactNumber}</p>}
                {hub && hub.status !== 'Active' && <Badge tone="danger" className="mt-2">Hub inactive</Badge>}
              </Card>
            </div>
          </div>
        )}

        {tab === 'timeline' && (
          <Card><CardHeader title="Order timeline" subtitle="Oldest first · every change is recorded" icon={History} /><OrderTimeline events={events} /></Card>
        )}

        {tab === 'approvals' && (
          <Card>
            <CardHeader title="Approval history" subtitle="Every decision by the Sales Manager" icon={Gavel} />
            <DataTable
              rows={approvals}
              columns={[
                { key: 'decision', header: 'Decision', render: (a) => <ApprovalStatusBadge status={a.decision} /> },
                { key: 'by', header: 'By', render: (a) => a.decidedByName },
                { key: 'at', header: 'When', render: (a) => formatDateTime(a.decidedAt) },
                { key: 'reason', header: 'Reason / remarks', render: (a) => (<div className="max-w-md"><p>{a.reason || '—'}</p><p className="text-xs text-muted">{a.remarks}</p></div>) },
                { key: 'total', header: 'Order total', align: 'right', hideBelow: 'md', render: (a) => formatMoney(a.orderTotal) },
              ]}
              empty={<EmptyState compact icon={Gavel} title="No decisions yet" description={order.orderStatus === S.DRAFT ? 'Submit the order to send it for approval.' : 'Waiting for the Sales Manager.'} />}
            />
          </Card>
        )}

        {tab === 'consolidation' && <OrderFulfilmentPanel order={order} consolidation={consolidation} />}
        {tab === 'consolidation' && (
          <Card className="mt-6">
            <CardHeader title="Consolidation" icon={Layers} action={<ConsolidationStatusBadge status={order.consolidationStatus} />} />
            {consolidation ? (
              <InfoList columns={3} items={[
                { label: 'Consolidation number', value: consolidation.consolidationNumber },
                { label: 'Consolidated by', value: consolidation.consolidatedByName },
                { label: 'Date', value: formatDateTime(consolidation.consolidationDate) },
                { label: 'Hub', value: lookups.hubs[consolidation.hubId]?.name },
                { label: 'Total quantity', value: consolidation.totalQuantity },
                { label: 'Total amount', value: formatMoney(consolidation.totalAmount) },
                { label: 'Ready for dispatch', value: consolidation.readyForDispatchAt ? formatDateTime(consolidation.readyForDispatchAt) : 'Not yet' },
                { label: 'Products', value: consolidation.productSummary.map((p) => `${p.productName} × ${p.quantity} ${p.unit}`).join('; '), span: 'full' },
                { label: 'Notes', value: consolidation.notes, span: 'full' },
              ]} />
            ) : (
              <EmptyState compact icon={Layers} title={order.consolidationStatus === 'PENDING' ? 'Waiting in the consolidation queue' : 'Not consolidated'} description="Customer Service consolidates approved orders before releasing them to dispatch." />
            )}
          </Card>
        )}
      </div>

      <Modal open={Boolean(cancelling)} onClose={() => setCancelling(null)} title={`Cancel ${order.orderNumber}?`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setCancelling(null)}>Keep order</Button><Button variant="danger" icon={Ban} onClick={onCancel}>Cancel order</Button></>}>
        {cancelling && (
          <div className="space-y-4">
            <p className="text-sm text-muted">The order leaves the approval / fulfilment queues{order.reservation && ['RESERVED', 'PARTIAL'].includes(order.reservation.status) ? ' and its reserved stock becomes available again' : ''}. The salesman, Customer Service and the Dispatcher are notified. This cannot be undone.</p>
            <Select label="Reason" required value={cancelling.reason} onChange={(e) => setCancelling({ ...cancelling, reason: e.target.value, errors: {} })} options={ORDER_OPTIONS.cancelReasons} placeholder="Select a reason" error={cancelling.errors.reason} data-autofocus />
            <Textarea label={cancelling.reason === 'Other' ? 'Describe the reason' : 'Remarks'} required={cancelling.reason === 'Other'} rows={3} value={cancelling.remarks} onChange={(e) => setCancelling({ ...cancelling, remarks: e.target.value, errors: {} })} error={cancelling.errors.remarks} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(action)}
        onClose={() => setAction(null)}
        onConfirm={run}
        loading={busy}
        tone={action === 'delete' ? 'danger' : 'primary'}
        title={action === 'submit' ? 'Submit this draft for approval?' : action === 'delete' ? 'Delete this draft?' : `Mark ${order.orderNumber} ready for dispatch?`}
        description={action === 'submit' ? `${order.customerName} · ${formatMoney(order.totalAmount)}. An order number will be assigned and the Sales Manager notified.` : action === 'delete' ? 'The draft will be removed permanently.' : 'The Dispatcher will see it in the dispatch queue. Stock is not deducted at this step.'}
        confirmLabel={action === 'submit' ? 'Submit order' : action === 'delete' ? 'Delete draft' : 'Mark ready'}
      />
    </>
  )
}

const lookupNumber = (orders, id) => orders.find((o) => o.id === id)?.orderNumber || 'a draft order'

function Banner({ tone, icon: Icon, title, text, meta }) {
  const cls = { warning: 'border-accent/60 bg-accent/10', danger: 'border-danger/40 bg-danger/10', neutral: 'border-line bg-surface-2' }[tone]
  return (
    <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${cls}`} role="status">
      <Icon size={18} className={tone === 'danger' ? 'text-danger mt-0.5 shrink-0' : tone === 'warning' ? 'text-accent mt-0.5 shrink-0' : 'text-muted mt-0.5 shrink-0'} aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold text-ink">{title}</p>
        {text && <p className="mt-1 text-sm text-ink">{tone === 'neutral' ? text : `“${text}”`}</p>}
        {meta && <p className="mt-1 text-xs text-muted">{meta}</p>}
      </div>
    </div>
  )
}
