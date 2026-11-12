import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Phone, Mail, MapPin, CreditCard, Crown, ClipboardList, History, UserPlus, ReceiptText, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge, { StatusBadge } from '../../components/common/Badge'
import InfoList from '../../components/common/InfoList'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import Timeline from '../../components/common/Timeline'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import Avatar from '../../components/common/Avatar'
import { CreditBadge, CustomerStatusBadge, VipBadge } from '../../components/masterdata/Badges'
import { useMasterData } from '../../hooks/useMasterData'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { useDeleteFlow } from '../../hooks/useDeleteFlow'
import { deleteCustomer, formatAddress, getCreditInfo, getCustomerById, getCustomerDeleteBlockers, getVipStatus, updateCustomer, VIP_TONE } from '../../services/customerService'
import { STORAGE_KEYS } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import { canViewOrder } from '../../services/orderService'
import { CREDIT_NEAR_THRESHOLD, VIP_STATUS } from '../../config/masterData'
import { formatCurrency, formatDate, formatMoney, formatPercent } from '../../utils/formatters'
import { cn } from '../../utils/helpers'
import dayjs from 'dayjs'
import { invoiceBalances } from '../../services/enterprise/financeService'

const NONE = []
/** Receivables of one customer: open invoices and recent receipts (the same records Finance and the customer app use). */
function CustomerAccountCard({ customer }) {
  const invoices = useStoredValue(STORAGE_KEYS.INVOICES, NONE)
  const payments = useStoredValue(STORAGE_KEYS.CUSTOMER_PAYMENTS, NONE)
  const credits = useStoredValue(STORAGE_KEYS.CREDIT_NOTES, NONE)
  const canFinance = usePermission('finance.ar.view')
  const canInvoices = usePermission('invoices.view')
  const balances = useMemo(() => invoiceBalances().filter((b) => b.customerId === customer.id), [customer.id, invoices, payments, credits]) // eslint-disable-line react-hooks/exhaustive-deps
  const open = balances.filter((b) => b.balance > 0)
  const receipts = payments.filter((p) => p.customerId === customer.id && p.status === 'POSTED').sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1)).slice(0, 3)
  return (
    <Card>
      <CardHeader title="Account" icon={ReceiptText} action={canFinance && <Button size="sm" variant="secondary" to={`/finance/receivables?customer=${customer.id}`}>Statement</Button>} />
      <InfoList columns={2} items={[
        { label: 'Outstanding balance', value: formatCurrency(customer.creditBalance || 0) },
        { label: 'Open invoices', value: `${open.length} · ${formatMoney(open.reduce((s, b) => s + b.balance, 0))}` },
        { label: 'Overdue', value: formatMoney(open.filter((b) => b.overdueDays > 0).reduce((s, b) => s + b.balance, 0)) },
        { label: 'Last receipt', value: receipts[0] ? `${formatMoney(receipts[0].amount)} · ${formatDate(receipts[0].paymentDate)}` : 'None yet' },
      ]} />
      {open.length > 0 && (
        <ul className="mt-3 divide-y divide-line text-sm">
          {open.slice(0, 4).map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-2 py-1.5">
              {canInvoices ? <Link to={`/invoices/${b.id}`} className="font-medium text-brand hover:underline">{b.invoiceNumber}</Link> : <span className="font-medium text-ink">{b.invoiceNumber}</span>}
              <span className={cn('tabular text-xs', b.overdueDays > 0 ? 'text-danger' : 'text-muted')}>{formatMoney(b.balance)}{b.overdueDays > 0 ? ` · ${b.overdueDays} d overdue` : ''}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">Invoices add to the balance; posted receipts and approved credit notes reduce it.</p>
    </Card>
  )
}

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { customers, orders, lookups, zones } = useMasterData()
  const activities = useStoredValue(STORAGE_KEYS.ACTIVITIES, [])
  const orderTimeline = useStoredValue(STORAGE_KEYS.ORDER_TIMELINE, [])
  const { user } = useAuth()
  const canManage = usePermission('customers.manage')
  const canCreateOrder = usePermission('orders.create')
  const customer = getCustomerById(id, customers)

  const del = useDeleteFlow({
    entity: 'customer',
    getBlockers: getCustomerDeleteBlockers,
    remove: deleteCustomer,
    onDeleted: () => navigate('/customers', { replace: true }),
    alternative: canManage && {
      label: 'Mark as Inactive',
      suggestion: 'Inactive customers stay in order history and reports but are hidden from new orders.',
      run: (c) => {
        const res = updateCustomer(c.id, { ...c, status: 'Inactive' })
        if (res.ok) toast.success(`${c.name} marked Inactive`)
      },
    },
  })

  // Only orders this role may see (e.g. drafts stay private to their creator)
  const customerOrders = useMemo(() => orders.filter((o) => o.customerId === id && canViewOrder(user, o)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [orders, id, user])

  const timeline = useMemo(() => {
    if (!customer) return []
    const fromLog = activities.filter((a) => a.entityType === 'customer' && a.entityId === id).map((a) => ({ id: a.id, title: `${a.actorName} ${a.message}`, at: a.createdAt, icon: Pencil }))
    const ids = new Set(customerOrders.map((o) => o.id))
    const byId = Object.fromEntries(customerOrders.map((o) => [o.id, o]))
    const fromOrders = orderTimeline
      .filter((e) => ids.has(e.orderId) && ['SUBMITTED', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'RETURNED', 'READY_FOR_DISPATCH', 'DELIVERED'].includes(e.eventType))
      .map((e) => ({ id: e.id, title: `${byId[e.orderId].orderNumber || 'Draft'} — ${e.title.toLowerCase()}`, description: `${formatMoney(byId[e.orderId].totalAmount)} · by ${e.userName}`, at: e.timestamp, icon: ClipboardList }))
    return [...fromLog, ...fromOrders, { id: 'created', title: 'Customer account created', at: customer.createdAt, icon: UserPlus }]
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 15)
  }, [activities, orderTimeline, customerOrders, customer, id])

  if (!customer) return <NotFoundRecord entity="customer" backTo="/customers" backLabel="Back to customers" />

  const credit = getCreditInfo(customer)
  const vip = getVipStatus(customer)
  const hub = lookups.hubs[customer.hubId]
  const zone = zones.find((z) => z.id === customer.zoneId)
  const daysToExpiry = customer.vipPassExpiry ? dayjs(customer.vipPassExpiry).diff(dayjs(), 'day') : null

  return (
    <>
      <PageHeader
        title={customer.name}
        description={`${customer.code} · ${customer.type}${customer.category ? ` · ${customer.category}` : ''}`}
        actions={
          <>
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>Back</Button>
            {canManage && <Button variant="danger-outline" icon={Trash2} onClick={() => del.request(customer)}>Delete</Button>}
            {canManage && <Button icon={Pencil} to={`/customers/${id}/edit`}>Edit</Button>}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar name={customer.name} color="#232B5F" size="lg" className="ring-line" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CustomerStatusBadge status={customer.status} />
                  <VipBadge customer={customer} />
                  <CreditBadge status={credit.status} />
                </div>
                <p className="mt-2 text-sm text-muted">{customer.businessName}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                  <a href={`tel:${customer.mobile.replace(/\s/g, '')}`} className="flex items-center gap-2 text-ink hover:text-brand"><Phone size={15} className="text-muted" /> {customer.mobile}{customer.altMobile && <span className="text-muted">· {customer.altMobile}</span>}</a>
                  {customer.email ? <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-ink hover:text-brand truncate"><Mail size={15} className="text-muted" /> {customer.email}</a> : <span className="flex items-center gap-2 text-muted"><Mail size={15} /> No email</span>}
                  <p className="flex items-start gap-2 text-ink sm:col-span-2"><MapPin size={15} className="mt-0.5 shrink-0 text-muted" /> {formatAddress(customer)}</p>
                </div>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-line pt-4">
              {[
                ['Orders', customerOrders.length],
                ['Order value', formatCurrency(customerOrders.filter((o) => o.orderStatus !== 'DRAFT').reduce((s, o) => s + o.totalAmount, 0))],
                ['Customer since', formatDate(customer.customerSince)],
                ['Last order', customerOrders[0] ? formatDate(customerOrders[0].createdAt) : '—'],
              ].map(([k, val]) => (
                <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="mt-0.5 font-semibold text-ink tabular">{val}</dd></div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Business information" icon={Building2} />
            <InfoList
              columns={3}
              items={[
                { label: 'Customer ID', value: <code className="text-xs">{customer.id}</code> },
                { label: 'Contact person', value: customer.contactPerson },
                { label: 'Assigned salesman', value: lookups.people[customer.salesRepId]?.name },
                { label: 'Preferred hub', value: hub ? hub.name : customer.hubId ? 'Deleted hub' : '' },
                { label: 'Delivery zone', value: zone?.name },
                { label: 'GSTIN', value: customer.gstNumber && <span className="tabular">{customer.gstNumber}</span> },
                { label: 'PAN', value: customer.panNumber && <span className="tabular">{customer.panNumber}</span> },
                { label: 'Country', value: customer.country },
                { label: 'Last updated', value: formatDate(customer.updatedAt) },
                { label: 'Notes', value: customer.notes, span: 'full' },
              ]}
            />
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader title="Credit configuration" icon={CreditCard} action={<CreditBadge status={credit.status} />} />
              {credit.enabled ? (
                <>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted">Available credit</p>
                      <p className={cn('text-2xl font-semibold tabular', credit.available < 0 ? 'text-danger' : 'text-ink')}>{formatCurrency(credit.available)}</p>
                    </div>
                    <p className="text-sm text-muted tabular">{formatPercent(credit.utilisation)} used</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(credit.utilisation)} aria-valuemin={0} aria-valuemax={100} aria-label="Credit utilisation">
                    <div className={cn('h-full rounded-full', credit.utilisation > 100 ? 'bg-danger' : credit.utilisation >= CREDIT_NEAR_THRESHOLD ? 'bg-warning' : 'bg-[var(--chart-1)]')} style={{ width: `${Math.min(100, credit.utilisation)}%` }} />
                  </div>
                  <InfoList className="mt-4" items={[
                    { label: 'Credit limit', value: formatCurrency(credit.limit) },
                    { label: 'Current balance', value: formatCurrency(credit.balance) },
                    { label: 'Credit days', value: `${credit.days} days` },
                    { label: 'Near-limit alert at', value: `${CREDIT_NEAR_THRESHOLD}% utilisation` },
                  ]} />
                </>
              ) : (
                <EmptyState compact icon={CreditCard} title="Credit disabled" description="This customer pays on delivery." />
              )}
            </Card>

            <Card>
              <CardHeader title="VIP" icon={Crown} action={customer.isVip ? <Badge tone={VIP_TONE[vip]}>{`Pass ${vip}`}</Badge> : <Badge tone="neutral">Not VIP</Badge>} />
              {customer.isVip ? (
                <InfoList items={[
                  { label: 'VIP customer', value: 'Yes' },
                  { label: 'VIP pass', value: customer.vipPassEnabled ? 'Enabled' : 'Disabled' },
                  { label: 'Pass number', value: customer.vipPassNumber && <span className="tabular">{customer.vipPassNumber}</span> },
                  { label: 'Expiry', value: customer.vipPassExpiry ? `${formatDate(customer.vipPassExpiry)}${daysToExpiry !== null ? ` (${daysToExpiry < 0 ? `expired ${-daysToExpiry} days ago` : `${daysToExpiry} days left`})` : ''}` : '' },
                  { label: 'Pass status', value: <Badge tone={VIP_TONE[vip]}>{vip}</Badge>, span: 2 },
                ]} />
              ) : (
                <EmptyState compact icon={Crown} title="Normal customer" description={canManage ? 'Edit the customer to enable VIP.' : undefined} />
              )}
              {vip === VIP_STATUS.EXPIRED && <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">The VIP pass has expired. Renew it by setting a new expiry date.</p>}
            </Card>
          </div>

          <Card>
            <CardHeader title="Order history" subtitle="Orders you can see for this customer" icon={ClipboardList} action={canCreateOrder && customer.status === 'Active' && <Button size="sm" variant="secondary" to={`/orders/create?customerId=${id}`}>New order</Button>} />
            <DataTable
              rows={customerOrders}
              pageSize={5}
              dense
              onRowClick={(o) => navigate(`/orders/${o.id}`)}
              columns={[
                { key: 'id', header: 'Order', render: (o) => <span className="font-medium tabular">{o.orderNumber || 'Draft'}</span> },
                { key: 'date', header: 'Date', hideBelow: 'sm', render: (o) => formatDate(o.orderDate) },
                { key: 'items', header: 'Items', align: 'right', hideBelow: 'md', render: (o) => o.items.length },
                { key: 'value', header: 'Value', align: 'right', render: (o) => formatMoney(o.totalAmount) },
                { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.orderStatus} /> },
              ]}
              empty={<EmptyState compact icon={ClipboardList} title="No orders yet" description="Orders for this customer will appear here." />}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Activity timeline" icon={History} />
            <Timeline items={timeline} />
          </Card>
          <CustomerAccountCard customer={customer} />
        </div>
      </div>
      {del.dialogs}
    </>
  )
}
