import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, AlertTriangle, ReceiptText, CreditCard, FileBarChart, Banknote, BadgeCheck, HandCoins } from 'lucide-react'
import StatCard, { StatGrid } from '../StatCard'
import CreditTable from '../widgets/CreditTable'
import SingleBarChart from '../charts/SingleBarChart'
import { getCreditOverview, inStatus, sumValue } from '../../../services/dashboardService'
import { ORDER_STATUS as S, POST_APPROVAL_STATUSES } from '../../../utils/constants'
import { formatCompactCurrency, formatMoney } from '../../../utils/formatters'
import Card, { CardHeader } from '../../common/Card'
import { useStoredValue } from '../../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../../utils/constants'
import { CREDIT_NEAR_THRESHOLD, CREDIT_STATUS } from '../../../config/masterData'
import { useDashboardPeriod } from '../../../hooks/useDashboardPeriod'
import { financeKpis } from '../../../services/enterprise/financeService'
import Button from '../../common/Button'
import { filterByPeriod } from '../../../utils/dashboardFilter'

const NONE = []

function LinkCard({ title, description, icon: Icon, to, actionLabel }) {
  return (
    <Card className="flex flex-col">
      <CardHeader title={title} icon={Icon} />
      <p className="text-sm text-muted">{description}</p>
      <div className="mt-auto pt-4"><Button variant="secondary" size="sm" to={to}>{actionLabel}</Button></div>
    </Card>
  )
}

function InvoiceCollections() {
  const all = useStoredValue(STORAGE_KEYS.INVOICES, NONE)
  const period = useDashboardPeriod()
  // Invoices are selected on their invoice date.
  const invoices = useMemo(() => filterByPeriod('invoices', all, period?.range), [all, period])
  const issued = invoices.filter((i) => i.status === 'ISSUED')
  const value = issued.reduce((a, i) => a + (Number(i.totals?.grandTotal) || 0), 0)
  const recent = [...issued].sort((a, b) => ((b.invoiceDate || b.createdAt) > (a.invoiceDate || a.createdAt) ? 1 : -1)).slice(0, 5)
  const payments = useStoredValue(STORAGE_KEYS.CUSTOMER_PAYMENTS, NONE)
  const credits = useStoredValue(STORAGE_KEYS.CREDIT_NOTES, NONE)
  const k = useMemo(() => financeKpis(), [all, payments, credits]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader title="Invoices" subtitle={`${issued.length} issued · ${formatCompactCurrency(value)}`} icon={ReceiptText} action={<Link to="/invoices" className="text-xs font-medium text-brand hover:underline">All invoices</Link>} />
        {recent.length === 0 ? <p className="text-sm text-muted">No invoices issued yet.</p> : (
          <ul className="divide-y divide-line text-sm">
            {recent.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                <Link to={`/invoices/${i.id}`} className="min-w-0 truncate font-medium text-ink hover:underline">{i.invoiceNumber} <span className="font-normal text-muted">· {i.customerName || i.snapshot?.customer?.name || ''}</span></Link>
                <span className="tabular text-ink">{formatMoney(i.totals?.grandTotal)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Collections" icon={HandCoins} action={<Link to="/finance/payments" className="text-xs font-medium text-brand hover:underline">Customer receipts</Link>} />
        <ul className="divide-y divide-line text-sm">
          <li className="flex items-center justify-between gap-3 py-2"><span className="text-muted">Received this month</span><span className="tabular font-semibold text-ink">{formatMoney(k.collectedMonth)}</span></li>
          <li className="flex items-center justify-between gap-3 py-2"><span className="text-muted">Open receivables</span><span className="tabular font-semibold text-ink">{formatMoney(k.ar)}</span></li>
          <li className="flex items-center justify-between gap-3 py-2"><span className="text-muted">Overdue</span><span className={`tabular font-semibold ${k.overdue > 0 ? 'text-danger' : 'text-ink'}`}>{formatMoney(k.overdue)}</span></li>
          <li className="flex items-center justify-between gap-3 py-2"><span className="text-muted">Open invoices</span><span className="tabular font-semibold text-ink">{k.openInvoices}</span></li>
        </ul>
        <p className="mt-3 text-xs text-muted">From posted receipts and approved credit notes allocated to invoices (Finance › Customer Receipts). No bank or accounting system is connected.</p>
      </Card>
    </div>
  )
}

export default function FinanceDashboard({ data, orders, previous }) {
  const invoicesAll = useStoredValue(STORAGE_KEYS.INVOICES, NONE)
  const credit = useMemo(() => getCreditOverview(data.customers), [data.customers])
  const exposure = credit.reduce((s, c) => s + c.outstanding, 0)
  const totalLimit = credit.reduce((s, c) => s + c.limit, 0)
  const over = credit.filter((c) => c.status === CREDIT_STATUS.EXCEEDED)
  const near = credit.filter((c) => c.status === CREDIT_STATUS.NEAR)
  const delivered = inStatus(orders, S.DELIVERED, S.PARTIALLY_DELIVERED)
  const invoicedIds = new Set(invoicesAll.filter((i) => i.status !== 'CANCELLED').map((i) => i.orderId))
  const toInvoice = delivered.filter((o) => !invoicedIds.has(o.id))
  const ar = financeKpis()
  const live = orders.filter((o) => o.status !== S.DRAFT)
  const approved = inStatus(live, ...POST_APPROVAL_STATUSES)
  const pending = inStatus(live, S.SUBMITTED)
  const flagged = live.filter((o) => o.creditWarning && [S.SUBMITTED, S.APPROVED, S.CONSOLIDATED].includes(o.status))
  const pl = previous ? previous.orders.filter((o) => o.status !== S.DRAFT) : null
  const cmpV = (fn) => (pl ? { previous: fn(pl), format: formatCompactCurrency } : undefined)
  const valueByStage = [
    { name: 'Pending approval', value: Math.round(sumValue(pending)) },
    { name: 'Approved', value: Math.round(sumValue(inStatus(live, S.APPROVED))) },
    { name: 'Consolidated', value: Math.round(sumValue(inStatus(live, S.CONSOLIDATED))) },
    { name: 'Ready for dispatch', value: Math.round(sumValue(inStatus(live, S.READY_FOR_DISPATCH))) },
    { name: 'In delivery', value: Math.round(sumValue(inStatus(live, S.DISPATCHED, S.OUT_FOR_DELIVERY))) },
    { name: 'Delivered', value: Math.round(sumValue(delivered)) },
    { name: 'Failed / returned', value: Math.round(sumValue(inStatus(live, S.DELIVERY_FAILED, S.RETURNED_TO_HUB))) },
  ]

  return (
    <div className="space-y-6">
      <StatGrid cols={6}>
        <StatCard label="Order value (submitted)" value={formatCompactCurrency(sumValue(live))} compare={cmpV((x) => sumValue(x)) && { ...cmpV((x) => sumValue(x)), current: sumValue(live) }} icon={Banknote} tone="info" hint={`${live.length} orders · ${formatCompactCurrency(sumValue(pending))} pending`} to="/orders" />
        <StatCard label="Approved order value" value={formatCompactCurrency(sumValue(approved))} compare={cmpV((x) => sumValue(inStatus(x, ...POST_APPROVAL_STATUSES))) && { ...cmpV((x) => sumValue(inStatus(x, ...POST_APPROVAL_STATUSES))), current: sumValue(approved) }} icon={BadgeCheck} tone="success" hint={`${approved.length} approved orders`} to="/orders?approval=APPROVED" />
        <StatCard label="Credit exposure" live value={formatCompactCurrency(exposure)} icon={Wallet} tone="brand" hint={`of ${formatCompactCurrency(totalLimit)} total limits`} to="/customers/credit" />
        <StatCard label="Over credit limit" live value={over.length} icon={AlertTriangle} tone="danger" hint={`${near.length} near limit (${CREDIT_NEAR_THRESHOLD}%+)`} to="/customers/credit" />
        <StatCard label="Delivered, to invoice" value={formatCompactCurrency(sumValue(toInvoice))} icon={ReceiptText} tone="success" hint={`${toInvoice.length} delivered order${toInvoice.length === 1 ? '' : 's'} without an invoice`} to="/invoices/dashboard" />
        <StatCard label="Open receivables" live value={formatCompactCurrency(ar.ar)} icon={HandCoins} tone="warning" hint={`${ar.openInvoices} open invoice${ar.openInvoices === 1 ? '' : 's'} · ${formatCompactCurrency(ar.overdue)} overdue`} to="/finance/receivables" />
      </StatGrid>

      <InvoiceCollections />

      <SingleBarChart
        title="Order value overview"
        subtitle="Value of submitted orders by stage (incl. tax)"
        data={valueByStage}
        valueFormatter={formatCompactCurrency}
        seriesName="Order value"
        height={260}
        action={<Link to="/reports/center?category=sales" className="text-xs font-medium text-brand hover:underline">Sales reports</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><CreditTable rows={credit} linkTo="/customers/credit" /></div>
        <div className="lg:col-span-2">
          <SingleBarChart
            title="Credit utilisation"
            subtitle="Outstanding as % of limit"
            data={credit.slice(0, 8).map((c) => ({ name: c.name.length > 16 ? `${c.name.slice(0, 15)}…` : c.name, value: Math.round(c.utilisation) }))}
            valueFormatter={(v) => `${v}%`}
            seriesName="Utilisation"
            height={300}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <LinkCard title="Credit control" icon={CreditCard} to="/customers/credit" actionLabel="Open customer credit"
          description={`${flagged.length} open order${flagged.length === 1 ? '' : 's'} flagged for credit-limit exceptions. Outstanding balances follow invoices, receipts and credit notes.`} />
        <LinkCard title="Invoicing" icon={ReceiptText} to="/invoices/dashboard" actionLabel="Open invoicing"
          description={`${toInvoice.length} delivered order${toInvoice.length === 1 ? '' : 's'} waiting for an invoice. Tax is a demo calculation — no statutory e-invoicing is connected.`} />
        <LinkCard title="Finance reports" icon={FileBarChart} to="/reports/center?category=finance" actionLabel="Open finance reports"
          description="Invoice register with payment status, receivables, invoices by customer, hub and month — in the Reports Center." />
      </div>
    </div>
  )
}
