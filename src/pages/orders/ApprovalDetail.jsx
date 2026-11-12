import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, X, RotateCcw, ShieldCheck, Package, MapPin, User, History, ExternalLink, Gavel } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import InfoList from '../../components/common/InfoList'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import OrderItemsTable from '../../components/orders/OrderItemsTable'
import OrderTotals from '../../components/orders/OrderTotals'
import OrderTimeline from '../../components/orders/OrderTimeline'
import CustomerCreditPanel from '../../components/orders/CustomerCreditPanel'
import ApprovalChecksList from '../../components/orders/ApprovalChecksList'
import DecisionDialog from '../../components/orders/DecisionDialog'
import { ApprovalStatusBadge, OrderStatusBadge, PriorityBadge } from '../../components/orders/OrderBadges'
import { OrderAccessDenied } from './OrderDetail'
import { useMasterData } from '../../hooks/useMasterData'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { canViewOrder, getOrderById } from '../../services/orderService'
import { getApprovalChecks, isPending } from '../../services/approvalService'
import { getOrderTimelineByOrderId } from '../../services/orderTimelineService'
import { STORAGE_KEYS } from '../../utils/constants'
import { formatDate, formatDateTime } from '../../utils/formatters'

export default function ApprovalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { orders, customers, hubs, products, inventory, lookups } = useMasterData()
  const timelineAll = useStoredValue(STORAGE_KEYS.ORDER_TIMELINE, [])
  const canApprove = usePermission('orders.approve')
  const canReject = usePermission('orders.reject')
  const canDecide = canApprove || canReject
  const [kind, setKind] = useState(null)
  const order = getOrderById(id, orders)
  const checks = useMemo(() => (order ? getApprovalChecks(order, { customers, hubs, products, inventory }) : []), [order, customers, hubs, products, inventory])
  const events = useMemo(() => getOrderTimelineByOrderId(id, timelineAll), [id, timelineAll])

  if (!order) return <NotFoundRecord entity="order" backTo="/orders/approval" backLabel="Back to approval queue" />
  if (!canViewOrder(user, order)) return <OrderAccessDenied />
  const customer = customers.find((c) => c.id === order.customerId)
  const pending = isPending(order)
  const blocked = checks.some((c) => c.severity === 'block' && !c.ok)
  const warnings = checks.filter((c) => !c.ok).length

  return (
    <>
      <PageHeader
        title={`Review ${order.orderNumber}`}
        description={`${order.customerName} · submitted ${formatDateTime(order.submittedAt)} by ${order.salesmanName}${order.resubmissionCount ? ` · resubmission ${order.resubmissionCount}` : ''}`}
        actions={
          <>
            <Button variant="secondary" icon={ArrowLeft} to="/orders/approval">Approval queue</Button>
            <Button variant="secondary" icon={ExternalLink} to={`/orders/${id}`}>Full order</Button>
          </>
        }
      />

      {!pending && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 p-4 text-sm">
          <Gavel size={18} className="text-muted" />
          <span>This order is no longer pending — it is <strong>{order.approvalStatus.toLowerCase()}</strong>. No further decision can be made.</span>
          <ApprovalStatusBadge status={order.approvalStatus} />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2 min-w-0">
          <Card>
            <CardHeader title="Order header" icon={Gavel} action={<div className="flex gap-1.5"><OrderStatusBadge status={order.orderStatus} /><ApprovalStatusBadge status={order.approvalStatus} /></div>} />
            <InfoList columns={3} items={[
              { label: 'Order number', value: <span className="tabular">{order.orderNumber}</span> },
              { label: 'Order date', value: formatDate(order.orderDate) },
              { label: 'Type · priority', value: <span className="inline-flex items-center gap-1.5">{order.orderType} <PriorityBadge priority={order.orderPriority} /></span> },
              { label: 'Salesman', value: order.salesmanName },
              { label: 'Customer', value: order.customerName },
              { label: 'Hub', value: order.hubName },
              { label: 'Payment terms', value: order.paymentTerms === 'Credit' ? `Credit · ${order.creditDays} days` : order.paymentTerms },
              { label: 'Customer reference', value: order.customerReference },
              { label: 'Notes', value: order.notes },
            ]} />
          </Card>

          <Card>
            <CardHeader title="Product details" subtitle={`Current stock at ${order.hubName} shown for each line`} icon={Package} />
            <OrderItemsTable order={order} inventory={inventory} />
            <div className="mt-4 ml-auto max-w-sm"><OrderTotals totals={order} /></div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader title="Delivery information" icon={MapPin} />
              <InfoList columns={1} items={[
                { label: 'Address', value: order.deliveryAddress },
                { label: 'City · state · pincode', value: `${order.deliveryCity}, ${order.deliveryState} ${order.deliveryPincode}` },
                { label: 'Requested delivery', value: formatDate(order.requestedDeliveryDate) },
                { label: 'Instructions', value: order.deliveryInstructions },
              ]} />
            </Card>
            <Card>
              <CardHeader title="History" icon={History} />
              <OrderTimeline events={events.slice(-5)} />
            </Card>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-20 xl:self-start min-w-0">
          {pending && canDecide && (
            <Card className="border-brand/30">
              <CardHeader title="Decision" subtitle={blocked ? 'Approval is blocked — return or reject.' : warnings ? `${warnings} warning${warnings > 1 ? 's' : ''} to review` : 'All checks passed'} icon={ShieldCheck} />
              <div className="grid gap-2">
                {canApprove && <Button icon={Check} onClick={() => setKind('approve')} disabled={blocked} fullWidth>Approve</Button>}
                {canReject && <Button variant="secondary" icon={RotateCcw} onClick={() => setKind('return')} fullWidth>Return for correction</Button>}
                {canReject && <Button variant="danger-outline" icon={X} onClick={() => setKind('reject')} fullWidth>Reject</Button>}
              </div>
              <p className="mt-3 text-xs text-muted">Reject and return need a reason and remarks. The salesman is notified either way.</p>
            </Card>
          )}
          {pending && !canDecide && <Card><p className="text-sm text-muted">View only — your role cannot approve or reject orders.</p></Card>}
          <Card>
            <CardHeader title="Approval checks" icon={ShieldCheck} />
            <ApprovalChecksList checks={checks} />
          </Card>
          <Card>
            <CardHeader title="Customer information" icon={User} />
            <CustomerCreditPanel customer={customer} orderTotal={pending ? order.totalAmount : 0} showProjection={pending} />
            <p className="mt-3 text-xs text-muted">Salesman: {order.salesmanName}{lookups.people[order.salesmanId]?.phone ? ` · ${lookups.people[order.salesmanId].phone}` : ''}</p>
          </Card>
        </div>
      </div>
      {kind && <DecisionDialog order={order} kind={kind} onClose={() => setKind(null)} onDone={() => navigate('/orders/approval')} />}
    </>
  )
}
