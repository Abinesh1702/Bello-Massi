import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { ClipboardList, Clock, BadgeCheck, IndianRupee, Plus, Eye, Pencil, Trash2, Copy, Gavel, Layers, XCircle, RotateCcw, FileEdit, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import RowActions from '../../components/common/RowActions'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { ApprovalStatusBadge, CreditWarningBadge, OrderStatusBadge, PriorityBadge, StockWarningBadge } from '../../components/orders/OrderBadges'
import { useMasterData } from '../../hooks/useMasterData'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { canEditOrder, canViewOrder, deleteDraftOrder, duplicateOrder, isOwnOrder } from '../../services/orderService'
import { isPending } from '../../services/approvalService'
import { isAwaitingConsolidation } from '../../services/consolidationService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { ORDER_OPTIONS } from '../../config/orderConfig'
import { APPROVAL_STATUS_META, ORDER_STATUS as S, ORDER_STATUS_META, POST_APPROVAL_STATUSES } from '../../utils/constants'
import { ROLES } from '../../config/roles'
import { formatCompactCurrency, formatDate, formatDateTime, formatMoney, formatNumber, formatRelative } from '../../utils/formatters'
import { scopeOf } from '../../services/rbacService'

const VARIANTS = {
  all: { title: 'Orders', description: 'Sales orders you can see, with live status from capture to dispatch.' },
  mine: { title: 'My orders', description: 'Orders you created or that are assigned to you — including your private drafts.' },
  rejected: { title: 'Rejected orders', description: 'Orders the Sales Manager rejected. They stay as history — duplicate one to start again.', status: S.REJECTED },
  returned: { title: 'Returned for correction', description: 'Orders sent back by the Sales Manager. Correct and resubmit them — the order number is kept.', status: S.RETURNED },
}

const FILTERS = ['status', 'approval', 'customerId', 'salesmanId', 'hubId', 'priority', 'from', 'to']

export default function OrderList({ variant = 'all' }) {
  const cfg = VARIANTS[variant]
  const navigate = useNavigate()
  const { user } = useAuth()
  const { orders, customers, hubs, salesReps } = useMasterData()
  const canCreate = usePermission('orders.create')
  const canApprove = usePermission('orders.approve')
  const canConsolidate = usePermission('orders.consolidate')
  const t = useTableQuery({ filters: FILTERS, sort: 'created', dir: 'desc' })
  const [toDelete, setToDelete] = useState(null)

  const base = useMemo(() => orders.filter((o) => {
    if (!canViewOrder(user, o)) return false
    if (variant === 'mine' && !isOwnOrder(user, o)) return false
    if (cfg.status && o.orderStatus !== cfg.status) return false
    return true
  }), [orders, user, variant, cfg.status])

  const filtered = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const f = t.filters
    return base.filter((o) => {
      if (q && ![o.orderNumber, o.customerName, o.customerCode, o.salesmanName, o.customerReference].some((v) => String(v || '').toLowerCase().includes(q))) return false
      if (f.status && o.orderStatus !== f.status) return false
      if (f.approval && o.approvalStatus !== f.approval) return false
      if (f.customerId && o.customerId !== f.customerId) return false
      if (f.salesmanId && o.salesmanId !== f.salesmanId) return false
      if (f.hubId && o.hubId !== f.hubId) return false
      if (f.priority && o.orderPriority !== f.priority) return false
      if (f.from && o.orderDate < f.from) return false
      if (f.to && o.orderDate > f.to) return false
      return true
    })
  }, [base, t.q, t.filters])

  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, {
    number: (o) => o.orderNumber || '', customer: (o) => o.customerName, salesman: (o) => o.salesmanName, hub: (o) => o.hubName,
    qty: (o) => o.totalQuantity, amount: (o) => o.totalAmount, status: (o) => ORDER_STATUS_META[o.orderStatus]?.step ?? 0,
    approval: (o) => o.approvalStatus, priority: (o) => ['Low', 'Normal', 'High', 'Urgent'].indexOf(o.orderPriority),
    delivery: (o) => o.requestedDeliveryDate, created: (o) => o.createdAt,
  }), [filtered, t.sort, t.dir])

  const statusOptions = useMemo(() => {
    const present = new Set(base.map((o) => o.orderStatus))
    return Object.keys(ORDER_STATUS_META).filter((k) => present.has(k)).map((k) => ({ value: k, label: ORDER_STATUS_META[k].label }))
  }, [base])

  const onDuplicate = (o) => {
    const res = duplicateOrder(o.id)
    if (!res.ok) return toast.error(res.error)
    toast.success('Duplicated as a new draft', { description: `Re-priced from today’s product master. Source: ${o.orderNumber || 'draft'}.` })
    navigate(`/orders/${res.record.id}/edit`)
  }
  const onDelete = () => {
    const res = deleteDraftOrder(toDelete.id)
    setToDelete(null)
    if (!res.ok) return toast.error(res.error)
    toast.success('Draft deleted')
  }

  const onExport = () => {
    const n = downloadCsv(csvFilename(variant === 'all' ? 'orders' : `${variant}-orders`), rows, [
      { header: 'Order Number', value: (o) => o.orderNumber || 'DRAFT' }, { header: 'Order Date', value: (o) => o.orderDate },
      { header: 'Customer Code', value: (o) => o.customerCode }, { header: 'Customer', value: (o) => o.customerName },
      { header: 'Salesman', value: (o) => o.salesmanName }, { header: 'Hub', value: (o) => o.hubName },
      { header: 'Order Type', value: (o) => o.orderType }, { header: 'Priority', value: (o) => o.orderPriority },
      { header: 'Lines', value: (o) => o.items.length }, { header: 'Total Quantity', value: (o) => o.totalQuantity },
      { header: 'Subtotal (INR)', value: (o) => o.subtotal.toFixed(2) }, { header: 'Discount (INR)', value: (o) => o.discountAmount.toFixed(2) },
      { header: 'Tax (INR)', value: (o) => o.taxAmount.toFixed(2) }, { header: 'Total (INR)', value: (o) => o.totalAmount.toFixed(2) },
      { header: 'Order Status', value: (o) => ORDER_STATUS_META[o.orderStatus]?.label }, { header: 'Approval Status', value: (o) => APPROVAL_STATUS_META[o.approvalStatus]?.label },
      { header: 'Requested Delivery', value: (o) => o.requestedDeliveryDate }, { header: 'Payment Terms', value: (o) => o.paymentTerms },
      { header: 'Credit Warning', value: (o) => o.creditWarning }, { header: 'Stock Warning', value: (o) => o.stockWarning },
      { header: 'Rejection / Return Reason', value: (o) => o.rejectionReason || o.returnReason || '' },
      { header: 'Remarks', value: (o) => o.rejectionRemarks || o.returnRemarks || o.approvalRemarks || '' },
      { header: 'Created At', value: (o) => o.createdAt }, { header: 'Submitted At', value: (o) => o.submittedAt || '' }, { header: 'Approved At', value: (o) => o.approvedAt || '' },
    ])
    toast.success(`Exported ${n} order${n === 1 ? '' : 's'}`)
  }

  const actionsFor = (o) => [
    { label: 'View', icon: Eye, to: `/orders/${o.id}` },
    { label: o.orderStatus === S.RETURNED ? 'Correct & resubmit' : 'Edit draft', icon: o.orderStatus === S.RETURNED ? RotateCcw : Pencil, to: `/orders/${o.id}/edit`, hidden: !canEditOrder(user, o) },
    { label: 'Review', icon: Gavel, to: `/orders/approval/${o.id}`, hidden: !(canApprove && isPending(o)) },
    { label: 'Consolidate', icon: Layers, to: `/orders/consolidation/${o.id}`, hidden: !(canConsolidate && (isAwaitingConsolidation(o) || o.orderStatus === S.CONSOLIDATED)) },
    { label: 'Duplicate as draft', icon: Copy, onClick: () => onDuplicate(o), hidden: !canCreate },
    { label: 'Delete draft', icon: Trash2, danger: true, onClick: () => setToDelete(o), hidden: !(o.orderStatus === S.DRAFT && (scopeOf(user) === ROLES.ADMIN || isOwnOrder(user, o))) },
  ]

  const columns = [
    {
      key: 'number', header: 'Order', sortable: true,
      render: (o) => (
        <div>
          <p className="font-medium tabular whitespace-nowrap">{o.orderNumber || <span className="text-muted">Draft</span>}</p>
          <p className="text-xs text-muted whitespace-nowrap">{formatDate(o.orderDate)}</p>
        </div>
      ),
    },
    {
      key: 'customer', header: 'Customer', sortable: true,
      render: (o) => (
        <div className="min-w-0">
          <p className="truncate max-w-[200px]">{o.customerName}</p>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {o.creditWarning && !['REJECTED', 'DRAFT'].includes(o.orderStatus) && <CreditWarningBadge label="Credit" />}
            {o.stockWarning && ['SUBMITTED', 'APPROVED'].includes(o.orderStatus) && <StockWarningBadge label="Stock" />}
          </div>
        </div>
      ),
    },
    { key: 'salesman', header: 'Salesman', sortable: true, hideBelow: 'lg', render: (o) => <span className="text-muted whitespace-nowrap">{o.salesmanName}</span> },
    { key: 'hub', header: 'Hub', sortable: true, hideBelow: 'xl', render: (o) => <span className="text-muted whitespace-nowrap">{o.hubName || '—'}</span> },
    { key: 'qty', header: 'Qty', align: 'right', sortable: true, hideBelow: 'md', render: (o) => formatNumber(o.totalQuantity) },
    { key: 'amount', header: 'Total', align: 'right', sortable: true, render: (o) => <span className="font-medium whitespace-nowrap">{formatMoney(o.totalAmount)}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (o) => <OrderStatusBadge status={o.orderStatus} /> },
    ...(variant === 'rejected' ? [{ key: 'reason', header: 'Reason', hideBelow: 'md', render: (o) => (<div className="max-w-[240px]"><p className="text-sm">{o.rejectionReason}</p><p className="text-xs text-muted truncate">{o.rejectionRemarks}</p></div>) }]
      : variant === 'returned' ? [{ key: 'reason', header: 'Correction needed', hideBelow: 'md', render: (o) => (<div className="max-w-[260px]"><p className="text-sm">{o.returnReason}</p><p className="text-xs text-muted truncate">{o.returnRemarks}</p></div>) }]
        : [{ key: 'approval', header: 'Approval', sortable: true, hideBelow: 'lg', render: (o) => <ApprovalStatusBadge status={o.approvalStatus} /> }]),
    { key: 'priority', header: 'Priority', sortable: true, hideBelow: 'xl', render: (o) => <PriorityBadge priority={o.orderPriority} /> },
    { key: 'delivery', header: 'Delivery', sortable: true, hideBelow: 'xl', render: (o) => <span className="text-xs text-muted whitespace-nowrap">{formatDate(o.requestedDeliveryDate)}</span> },
    { key: 'created', header: 'Created', sortable: true, hideBelow: 'xl', render: (o) => <span className="text-xs text-muted whitespace-nowrap" title={formatDateTime(o.createdAt)}>{formatRelative(o.createdAt)}</span> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (o) => <RowActions label={`Actions for ${o.orderNumber || 'draft order'}`} items={actionsFor(o)} /> },
  ]

  const sum = (list) => list.reduce((s, o) => s + o.totalAmount, 0)
  const kpis = variant === 'rejected' || variant === 'returned' ? (
    <StatGrid cols={3}>
      <StatCard label={variant === 'rejected' ? 'Rejected orders' : 'Awaiting correction'} value={base.length} icon={variant === 'rejected' ? XCircle : RotateCcw} tone={variant === 'rejected' ? 'danger' : 'warning'} hint={formatCompactCurrency(sum(base))} />
      <StatCard label="Most common reason" value={(() => { const c = {}; base.forEach((o) => { const r = o.rejectionReason || o.returnReason; c[r] = (c[r] || 0) + 1 }); return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || '—' })()} icon={Inbox} tone="neutral" />
      <StatCard label="Oldest" value={base.length ? formatRelative([...base].sort((a, b) => ((a.rejectedAt || a.returnedAt) > (b.rejectedAt || b.returnedAt) ? 1 : -1))[0][variant === 'rejected' ? 'rejectedAt' : 'returnedAt']) : '—'} icon={Clock} tone="info" />
    </StatGrid>
  ) : (
    <StatGrid cols={4}>
      <StatCard label={variant === 'mine' ? 'My orders' : 'Orders'} value={base.length} icon={ClipboardList} tone="brand" hint={`${base.filter((o) => o.orderStatus === S.DRAFT).length} drafts`} to={variant === 'mine' ? '/orders/my-orders?status=DRAFT' : undefined} />
      <StatCard label="Pending approval" value={base.filter((o) => o.orderStatus === S.SUBMITTED).length} icon={Clock} tone="warning" to={`${variant === 'mine' ? '/orders/my-orders' : '/orders'}?status=SUBMITTED`} hint="Filter list" />
      <StatCard label="Approved & beyond" value={base.filter((o) => POST_APPROVAL_STATUSES.includes(o.orderStatus)).length} icon={BadgeCheck} tone="success" to={`${variant === 'mine' ? '/orders/my-orders' : '/orders'}?approval=APPROVED`} hint="Filter list" />
      <StatCard label="Submitted value" value={formatCompactCurrency(sum(base.filter((o) => o.orderStatus !== S.DRAFT)))} icon={IndianRupee} tone="accent" hint="Incl. GST, excl. drafts" />
    </StatGrid>
  )

  return (
    <>
      <PageHeader title={cfg.title} description={cfg.description} actions={canCreate && <Button icon={Plus} to="/orders/create">Create order</Button>} />
      {kpis}
      <Card className="mt-6">
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search order number, customer, salesman, reference…" total={base.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          {!cfg.status && <FilterSelect label="Order status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={statusOptions} />}
          {!cfg.status && <FilterSelect label="Approval status" allLabel="Any approval" value={t.filters.approval} onChange={(v) => t.setFilter('approval', v)} options={Object.entries(APPROVAL_STATUS_META).map(([k, m]) => ({ value: k, label: m.label }))} />}
          <FilterSelect label="Customer" allLabel="All customers" value={t.filters.customerId} onChange={(v) => t.setFilter('customerId', v)} options={customers.map((c) => ({ value: c.id, label: c.name }))} />
          {scopeOf(user) !== ROLES.SALESMAN && <FilterSelect label="Salesman" allLabel="All salesmen" value={t.filters.salesmanId} onChange={(v) => t.setFilter('salesmanId', v)} options={salesReps.map((r) => ({ value: r.id, label: r.name }))} />}
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Priority" allLabel="Any priority" value={t.filters.priority} onChange={(v) => t.setFilter('priority', v)} options={ORDER_OPTIONS.priorities} />
          <FilterInput label="From order date" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} max={dayjs().format('YYYY-MM-DD')} />
          <FilterInput label="To order date" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} />
        </FilterToolbar>
        <DataTable
          caption={cfg.title}
          columns={columns}
          rows={rows}
          pageSize={12}
          page={t.page}
          onPageChange={t.setPage}
          sort={t.sort}
          dir={t.dir}
          onSort={t.setSort}
          onRowClick={(o) => navigate(`/orders/${o.id}`)}
          empty={
            <EmptyState
              icon={variant === 'returned' ? RotateCcw : variant === 'rejected' ? XCircle : FileEdit}
              title={base.length ? 'No orders match these filters' : variant === 'returned' ? 'Nothing to correct' : variant === 'rejected' ? 'No rejected orders' : 'No orders yet'}
              description={base.length ? 'Try a different search or clear the filters.' : undefined}
              action={base.length ? <Button variant="secondary" onClick={t.reset}>Clear filters</Button> : canCreate && variant !== 'rejected' && <Button icon={Plus} to="/orders/create">Create order</Button>}
            />
          }
        />
      </Card>
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        tone="danger"
        title="Delete this draft?"
        description={toDelete ? `The draft for ${toDelete.customerName} (${formatMoney(toDelete.totalAmount)}) will be removed. Submitted orders are never deleted.` : ''}
        confirmLabel="Delete draft"
      />
    </>
  )
}

export const MyOrders = () => <OrderList variant="mine" />
export const RejectedOrders = () => <OrderList variant="rejected" />
export const ReturnedOrders = () => <OrderList variant="returned" />
