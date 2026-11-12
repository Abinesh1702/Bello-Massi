import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Clock, CheckCircle2, XCircle, RotateCcw, IndianRupee, Gavel, Eye, Check, X, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import RowActions from '../../components/common/RowActions'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import DecisionDialog from '../../components/orders/DecisionDialog'
import { ApprovalStatusBadge, PriorityBadge } from '../../components/orders/OrderBadges'
import { CreditBadge } from '../../components/masterdata/Badges'
import Badge from '../../components/common/Badge'
import { useMasterData } from '../../hooks/useMasterData'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { getApprovalChecks, isPending } from '../../services/approvalService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { STORAGE_KEYS } from '../../utils/constants'
import { ORDER_OPTIONS } from '../../config/orderConfig'
import { formatCompactCurrency, formatDate, formatDateTime, formatMoney, formatNumber, formatRelative } from '../../utils/formatters'

export default function ApprovalQueue() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'decided' ? 'decided' : 'pending'
  const { orders, customers, hubs, products, inventory, salesReps } = useMasterData()
  const approvals = useStoredValue(STORAGE_KEYS.APPROVALS, [])
  const canApprove = usePermission('orders.approve')
  const canReject = usePermission('orders.reject')
  const canDecide = canApprove || canReject
  const t = useTableQuery({ filters: ['salesmanId', 'hubId', 'priority', 'flag', 'decision'], sort: tab === 'pending' ? 'submitted' : 'decided', dir: tab === 'pending' ? 'asc' : 'desc' })
  const [decision, setDecision] = useState(null) // { order, kind }

  const ctx = useMemo(() => ({ customers, hubs, products, inventory }), [customers, hubs, products, inventory])
  const pending = useMemo(() => orders.filter(isPending).map((o) => {
    const checks = getApprovalChecks(o, ctx)
    const credit = checks.find((c) => c.key === 'credit')
    const stock = checks.find((c) => c.key === 'stock')
    const customer = customers.find((c) => c.id === o.customerId)
    return { ...o, checks, creditOk: credit.ok, stockOk: stock.ok, blocked: checks.some((c) => c.severity === 'block' && !c.ok), customer }
  }), [orders, ctx, customers])

  const today = (iso) => iso && dayjs(iso).isSame(dayjs(), 'day')
  const kpi = {
    pending: pending.length,
    approvedToday: approvals.filter((a) => a.decision === 'APPROVED' && today(a.decidedAt)).length,
    rejectedToday: approvals.filter((a) => a.decision === 'REJECTED' && today(a.decidedAt)).length,
    returned: orders.filter((o) => o.orderStatus === 'RETURNED').length,
    amount: pending.reduce((s, o) => s + o.totalAmount, 0),
  }

  const filteredPending = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const f = t.filters
    return pending.filter((o) => {
      if (q && ![o.orderNumber, o.customerName, o.salesmanName].some((v) => String(v || '').toLowerCase().includes(q))) return false
      if (f.salesmanId && o.salesmanId !== f.salesmanId) return false
      if (f.hubId && o.hubId !== f.hubId) return false
      if (f.priority && o.orderPriority !== f.priority) return false
      if (f.flag === 'credit' && o.creditOk) return false
      if (f.flag === 'stock' && o.stockOk) return false
      if (f.flag === 'clean' && (!o.creditOk || !o.stockOk)) return false
      return true
    })
  }, [pending, t.q, t.filters])
  const pendingRows = useMemo(() => sortRows(filteredPending, t.sort, t.dir, {
    number: (o) => o.orderNumber, customer: (o) => o.customerName, salesman: (o) => o.salesmanName, hub: (o) => o.hubName, qty: (o) => o.totalQuantity,
    amount: (o) => o.totalAmount, credit: (o) => (o.creditOk ? 1 : 0), stock: (o) => (o.stockOk ? 1 : 0), priority: (o) => ['Low', 'Normal', 'High', 'Urgent'].indexOf(o.orderPriority),
    delivery: (o) => o.requestedDeliveryDate, submitted: (o) => o.submittedAt,
  }), [filteredPending, t.sort, t.dir])

  const decidedRows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const list = approvals.filter((a) => (!t.filters.decision || a.decision === t.filters.decision) && (!q || [a.orderNumber, a.reason, a.remarks, a.decidedByName].some((v) => String(v || '').toLowerCase().includes(q))))
    return sortRows(list, t.sort, t.dir, { decided: (a) => a.decidedAt, number: (a) => a.orderNumber, amount: (a) => a.orderTotal })
  }, [approvals, t.q, t.filters.decision, t.sort, t.dir])

  const onExport = () => {
    if (tab === 'pending') {
      const n = downloadCsv(csvFilename('approval-queue'), pendingRows, [
        { header: 'Order Number', value: (o) => o.orderNumber }, { header: 'Order Date', value: (o) => o.orderDate }, { header: 'Customer', value: (o) => o.customerName },
        { header: 'Salesman', value: (o) => o.salesmanName }, { header: 'Hub', value: (o) => o.hubName }, { header: 'Quantity', value: (o) => o.totalQuantity },
        { header: 'Total (INR)', value: (o) => o.totalAmount.toFixed(2) }, { header: 'Credit Check', value: (o) => (o.creditOk ? 'OK' : 'Warning') },
        { header: 'Stock Check', value: (o) => (o.stockOk ? 'OK' : 'Warning') }, { header: 'Priority', value: (o) => o.orderPriority },
        { header: 'Requested Delivery', value: (o) => o.requestedDeliveryDate }, { header: 'Submitted At', value: (o) => o.submittedAt },
      ])
      toast.success(`Exported ${n} pending orders`)
    } else {
      const n = downloadCsv(csvFilename('approval-decisions'), decidedRows, [
        { header: 'Order Number', value: (a) => a.orderNumber }, { header: 'Decision', value: (a) => a.decision }, { header: 'Reason', value: (a) => a.reason },
        { header: 'Remarks', value: (a) => a.remarks }, { header: 'Decided By', value: (a) => a.decidedByName }, { header: 'Decided At', value: (a) => a.decidedAt },
        { header: 'Order Total (INR)', value: (a) => Number(a.orderTotal).toFixed(2) },
      ])
      toast.success(`Exported ${n} decisions`)
    }
  }

  const pendingColumns = [
    { key: 'number', header: 'Order', sortable: true, render: (o) => (<div><p className="font-medium tabular whitespace-nowrap">{o.orderNumber}</p><p className="text-xs text-muted">{formatDate(o.orderDate)}</p></div>) },
    { key: 'customer', header: 'Customer', sortable: true, render: (o) => (<div className="min-w-0"><p className="truncate max-w-[180px]">{o.customerName}</p>{o.customer?.isVip && <Badge tone="accent">VIP</Badge>}</div>) },
    { key: 'salesman', header: 'Salesman', sortable: true, hideBelow: 'lg', render: (o) => <span className="text-muted whitespace-nowrap">{o.salesmanName}</span> },
    { key: 'hub', header: 'Hub', sortable: true, hideBelow: 'xl', render: (o) => <span className="text-muted whitespace-nowrap">{o.hubName}</span> },
    { key: 'qty', header: 'Qty', align: 'right', sortable: true, hideBelow: 'md', render: (o) => formatNumber(o.totalQuantity) },
    { key: 'amount', header: 'Total', align: 'right', sortable: true, render: (o) => <span className="font-medium whitespace-nowrap">{formatMoney(o.totalAmount)}</span> },
    { key: 'credit', header: 'Credit', sortable: true, hideBelow: 'sm', render: (o) => (o.creditOk ? <Badge tone="success">OK</Badge> : o.customer?.creditEnabled ? <CreditBadge status="Limit Exceeded" /> : <Badge tone="neutral">Disabled</Badge>) },
    { key: 'stock', header: 'Stock', sortable: true, hideBelow: 'sm', render: (o) => (o.stockOk ? <Badge tone="success">OK</Badge> : <Badge tone="warning">Short</Badge>) },
    { key: 'priority', header: 'Priority', sortable: true, hideBelow: 'lg', render: (o) => <PriorityBadge priority={o.orderPriority} /> },
    { key: 'delivery', header: 'Delivery', sortable: true, hideBelow: 'xl', render: (o) => <span className="text-xs text-muted whitespace-nowrap">{formatDate(o.requestedDeliveryDate)}</span> },
    { key: 'submitted', header: 'Submitted', sortable: true, hideBelow: 'md', render: (o) => <span className="text-xs text-muted whitespace-nowrap" title={formatDateTime(o.submittedAt)}>{formatRelative(o.submittedAt)}</span> },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      render: (o) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="xs" variant="secondary" icon={Gavel} to={`/orders/approval/${o.id}`} className="hidden md:inline-flex">Review</Button>
          <RowActions label={`Decide ${o.orderNumber}`} items={[
            { label: 'Review', icon: Eye, to: `/orders/approval/${o.id}` },
            { label: 'Approve', icon: Check, onClick: () => setDecision({ order: o, kind: 'approve' }), hidden: !canApprove || o.blocked },
            { label: 'Return for correction', icon: RotateCcw, onClick: () => setDecision({ order: o, kind: 'return' }), hidden: !canReject },
            { label: 'Reject', icon: X, danger: true, onClick: () => setDecision({ order: o, kind: 'reject' }), hidden: !canReject },
          ]} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Order approval"
        description={canDecide ? 'Review value, quantity, credit and stock — then approve, return for correction or reject with a reason.' : 'View-only: your role cannot approve or reject orders.'}
      />
      <StatGrid cols={6}>
        <StatCard label="Pending approval" value={kpi.pending} icon={Clock} tone="warning" />
        <StatCard label="Approved today" value={kpi.approvedToday} icon={CheckCircle2} tone="success" to="/orders/approval?tab=decided&decision=APPROVED" />
        <StatCard label="Rejected today" value={kpi.rejectedToday} icon={XCircle} tone="danger" to="/orders/approval?tab=decided&decision=REJECTED" />
        <StatCard label="Returned for correction" value={kpi.returned} icon={RotateCcw} tone="info" to="/orders/returned" />
        <StatCard label="Total approval amount" value={formatCompactCurrency(kpi.amount)} icon={IndianRupee} tone="accent" hint="Pending orders, incl. GST" />
        <StatCard label="With warnings" value={pending.filter((o) => !o.creditOk || !o.stockOk).length} icon={Inbox} tone="neutral" to="/orders/approval?flag=credit" hint="Credit or stock" />
      </StatGrid>

      <Card className="mt-6">
        <Tabs className="mb-4" value={tab} onChange={(id) => setParams(id === 'pending' ? {} : { tab: id }, { replace: true })} tabs={[{ id: 'pending', label: `Pending (${pending.length})`, icon: Clock }, { id: 'decided', label: `Decision history (${approvals.length})`, icon: Gavel }]} />
        {tab === 'pending' ? (
          <>
            <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search order, customer, salesman…" total={pending.length} filteredCount={pendingRows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
              <FilterSelect label="Warnings" allLabel="All orders" value={t.filters.flag} onChange={(v) => t.setFilter('flag', v)} options={[{ value: 'credit', label: 'Credit warning' }, { value: 'stock', label: 'Stock warning' }, { value: 'clean', label: 'No warnings' }]} />
              <FilterSelect label="Salesman" allLabel="All salesmen" value={t.filters.salesmanId} onChange={(v) => t.setFilter('salesmanId', v)} options={salesReps.map((r) => ({ value: r.id, label: r.name }))} />
              <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
              <FilterSelect label="Priority" allLabel="Any priority" value={t.filters.priority} onChange={(v) => t.setFilter('priority', v)} options={ORDER_OPTIONS.priorities} />
            </FilterToolbar>
            <DataTable caption="Pending approvals" columns={pendingColumns} rows={pendingRows} pageSize={10} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort}
              onRowClick={(o) => navigate(`/orders/approval/${o.id}`)}
              empty={<EmptyState icon={CheckCircle2} title={pending.length ? 'No orders match these filters' : 'Approval inbox is empty'} description={pending.length ? undefined : 'New submissions will appear here.'} />} />
          </>
        ) : (
          <>
            <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search order, reason, remarks…" total={approvals.length} filteredCount={decidedRows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
              <FilterSelect label="Decision" allLabel="All decisions" value={t.filters.decision} onChange={(v) => t.setFilter('decision', v)} options={[{ value: 'APPROVED', label: 'Approved' }, { value: 'RETURNED', label: 'Returned' }, { value: 'REJECTED', label: 'Rejected' }]} />
            </FilterToolbar>
            <DataTable caption="Approval decisions" rows={decidedRows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort}
              onRowClick={(a) => navigate(`/orders/${a.orderId}`)}
              columns={[
                { key: 'number', header: 'Order', sortable: true, render: (a) => <span className="font-medium tabular">{a.orderNumber}</span> },
                { key: 'decision', header: 'Decision', render: (a) => <ApprovalStatusBadge status={a.decision} /> },
                { key: 'reason', header: 'Reason / remarks', hideBelow: 'md', render: (a) => (<div className="max-w-sm"><p>{a.reason || '—'}</p><p className="text-xs text-muted truncate">{a.remarks}</p></div>) },
                { key: 'by', header: 'By', hideBelow: 'lg', render: (a) => a.decidedByName },
                { key: 'amount', header: 'Total', align: 'right', sortable: true, render: (a) => formatMoney(a.orderTotal) },
                { key: 'decided', header: 'When', sortable: true, render: (a) => <span className="text-xs text-muted whitespace-nowrap">{formatDateTime(a.decidedAt)}</span> },
              ]}
              empty={<EmptyState icon={Gavel} title="No decisions yet" />} />
          </>
        )}
      </Card>
      {decision && <DecisionDialog order={decision.order} kind={decision.kind} onClose={() => setDecision(null)} />}
    </>
  )
}
