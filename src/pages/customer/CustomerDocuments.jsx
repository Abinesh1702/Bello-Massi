import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileText, ReceiptText, Wallet, ArrowLeft, Printer, ChevronRight, Info, CreditCard } from 'lucide-react'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import InvoiceDocument from '../../components/phase5/InvoiceDocument'
import { ProgressBar } from '../../components/driver/DriverUi'
import { useCustomerWorkspace } from '../../hooks/useCustomerWorkspace'
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../../utils/formatters'
import { NoCustomerLink } from './CustomerUi'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../utils/constants'
import { invoiceBalances } from '../../services/enterprise/financeService'

const NONE = []
/** Live receivable position of the signed-in customer's invoices, keyed by invoice id. */
const useInvoiceBalances = (customerId) => {
  const payments = useStoredValue(STORAGE_KEYS.CUSTOMER_PAYMENTS, NONE)
  const credits = useStoredValue(STORAGE_KEYS.CREDIT_NOTES, NONE)
  const invoices = useStoredValue(STORAGE_KEYS.INVOICES, NONE)
  return useMemo(() => Object.fromEntries(invoiceBalances().filter((b) => b.customerId === customerId).map((b) => [b.id, b])), [customerId, payments, credits, invoices]) // eslint-disable-line react-hooks/exhaustive-deps
}

const Row = ({ to, title, sub, right }) => (
  <li><Link to={to} className="flex items-center justify-between gap-3 py-3 hover:text-brand">
    <div className="min-w-0"><p className="text-sm font-medium text-ink tabular">{title}</p><p className="text-xs text-muted truncate">{sub}</p></div>
    <span className="flex shrink-0 items-center gap-1.5">{right}<ChevronRight size={16} className="text-muted" aria-hidden /></span>
  </Link></li>
)

export function CustomerNotes() {
  const w = useCustomerWorkspace()
  if (!w.customer) return <NoCustomerLink />
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">Delivery notes</h1>
      <Card>
        {w.notes.length ? (
          <ul className="divide-y divide-line">{w.notes.map((n) => {
            const pod = w.pods.find((p) => p.deliveryId === n.deliveryId)
            const qty = (n.items || []).reduce((s, i) => s + (Number(i.deliveredQuantity) || 0), 0)
            return <Row key={n.id} to={`/customer/delivery-notes/${n.id}`} title={n.noteNumber} sub={`${n.orderNumber} · ${formatDate(n.deliveryDate)} · ${formatNumber(qty)} units · ${n.vehicleNumber || ''}`} right={pod?.signature ? <Badge tone="success">Signed</Badge> : null} />
          })}</ul>
        ) : <EmptyState compact icon={FileText} title="No delivery notes yet" description="A delivery note is issued when the driver verifies your OTP at delivery." />}
      </Card>
    </div>
  )
}

/** Payment status from posted receipts and approved credit notes (the same figures Finance sees). */
function InvoicePaymentBadge({ invoice, balance }) {
  if (invoice.status === 'CANCELLED') return <Badge tone="neutral">Cancelled</Badge>
  if (!balance) return null
  if (balance.status === 'PAID') return <Badge tone="success">Paid</Badge>
  if (balance.status === 'PARTIAL') return <Badge tone="warning">{formatCurrency(balance.balance)} open</Badge>
  return <Badge tone={balance.overdueDays > 0 ? 'danger' : 'info'}>{balance.overdueDays > 0 ? 'Overdue' : 'Open'}</Badge>
}

export function CustomerInvoices() {
  const w = useCustomerWorkspace()
  const balances = useInvoiceBalances(w.customer?.id)
  if (!w.customer) return <NoCustomerLink />
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">Invoices</h1>
      <Card>
        {w.invoices.length ? (
          <ul className="divide-y divide-line">{w.invoices.map((i) => (
            <Row key={i.id} to={`/customer/invoices/${i.id}`} title={i.invoiceNumber} sub={`${formatDate(i.invoiceDate)} · ${i.orderNumber}`}
              right={<><span className="text-sm font-semibold text-ink tabular">{formatCurrency(i.totals?.grandTotal)}</span><InvoicePaymentBadge invoice={i} balance={balances[i.id]} /></>} />
          ))}</ul>
        ) : <EmptyState compact icon={ReceiptText} title="No invoices yet" description="Invoices are issued by our finance team after delivery." />}
      </Card>
    </div>
  )
}

export function CustomerInvoice() {
  const { id } = useParams()
  const w = useCustomerWorkspace()
  if (!w.customer) return <NoCustomerLink />
  const inv = w.invoices.find((i) => i.id === id)
  if (!inv) return <NotFoundRecord entity="invoice" backTo="/customer/invoices" backLabel="Invoices" />
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" icon={ArrowLeft} to="/customer/invoices">Invoices</Button>
        <Button icon={Printer} onClick={() => window.print()}>Print / Save as PDF</Button>
      </div>
      <div className="overflow-x-auto"><InvoiceDocument invoice={inv} /></div>
    </div>
  )
}

export function CustomerPayments() {
  const w = useCustomerWorkspace()
  const allReceipts = useStoredValue(STORAGE_KEYS.CUSTOMER_PAYMENTS, NONE)
  if (!w.customer) return <NoCustomerLink />
  const c = w.customer
  const used = c.creditLimit ? Math.min(100, Math.round(((c.creditBalance || 0) / c.creditLimit) * 100)) : 0
  const invoiced = w.invoices.filter((i) => i.status !== 'CANCELLED').reduce((s, i) => s + (i.totals?.grandTotal || 0), 0)
  const receipts = allReceipts.filter((p) => p.customerId === c.id && ['POSTED', 'PENDING_DEPOSIT'].includes(p.status)).sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1))
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">Payments & balance</h1>
      <Card>
        <CardHeader title="Account balance" icon={Wallet} />
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xs text-muted">Outstanding</p><p className="text-2xl font-semibold text-ink tabular">{formatCurrency(c.creditBalance || 0)}</p></div>
          <div><p className="text-xs text-muted">Credit limit</p><p className="text-2xl font-semibold text-ink tabular">{c.creditEnabled ? formatCurrency(c.creditLimit) : 'No credit'}</p></div>
        </div>
        {c.creditEnabled && <ProgressBar className="mt-3" value={used} label={`Credit used · ${formatPercent(used)} · ${formatCurrency(Math.max(0, c.creditLimit - (c.creditBalance || 0)))} available`} />}
        <p className="mt-3 text-xs text-muted">Terms: {c.creditEnabled ? `${c.creditDays} days credit` : 'Cash on delivery'} · Invoiced to date: {formatCurrency(invoiced)}</p>
      </Card>
      <Card>
        <CardHeader title="Payment history" icon={CreditCard} action={<Button size="sm" variant="secondary" to="/customer/statement">Statement</Button>} />
        {receipts.length ? (
          <ul className="divide-y divide-line">{receipts.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0"><p className="text-sm font-medium text-ink">{p.number}</p><p className="text-xs text-muted">{formatDate(p.paymentDate)} · {p.method}{(p.allocations || []).length ? ` · ${(p.allocations || []).length} invoice${p.allocations.length === 1 ? '' : 's'}` : ''}</p></div>
              <div className="flex shrink-0 items-center gap-2"><span className="text-sm font-semibold tabular text-ink">{formatCurrency(p.amount)}</span><Badge tone={p.status === 'POSTED' ? 'success' : 'warning'}>{p.status === 'POSTED' ? 'Received' : 'Being deposited'}</Badge></div>
            </li>
          ))}</ul>
        ) : <EmptyState compact icon={Info} title="No payments recorded yet" description="Payments you make are recorded by our finance team and appear here once posted." />}
      </Card>
    </div>
  )
}
