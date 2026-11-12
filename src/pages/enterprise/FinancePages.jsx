import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { Wallet, Scale, Lock, Unlock, Percent, Plus, FileText } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import Textarea from '../../components/common/Textarea'
import { KpiGrid, SimpleTable, useStoreTick } from '../../components/enterprise/ui'
import { AGING_BUCKETS, apAging, arAging, customerStatement, financeKpis, invoiceBalances, setCreditHold, supplierInvoiceBalances, unappliedCash, validateTrn, vatRate, vatSummary } from '../../services/enterprise/financeService'
import { read } from '../../services/enterprise/recordService'
import { getSuppliers } from '../../services/supplierService'
import { logAudit } from '../../services/auditService'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../config/permissions'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { formatDate, formatMoney } from '../../utils/formatters'

const money = (v) => formatMoney(v || 0)
const agingCols = (nameKey, nameHeader) => [
  { key: nameKey, header: nameHeader },
  ...AGING_BUCKETS.map((b) => ({ key: b.id, header: b.label, align: 'right', render: (r) => money(r[b.id]) })),
  { key: 'total', header: 'Total', align: 'right', render: (r) => <span className="font-semibold text-ink">{money(r.total)}</span> },
]

/** Receivables aging, customer statements and credit hold. */
export function ReceivablesPage() {
  useStoreTick()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const customerId = params.get('customer') || ''
  const [hold, setHold] = useState(null)
  const [reason, setReason] = useState('')
  const aging = arAging()
  const k = financeKpis()
  const customers = read(K.CUSTOMERS)
  const customer = customers.find((c) => c.id === customerId)
  const statement = (customerId ? customerStatement(customerId) : [])
  const open = invoiceBalances().filter((b) => b.balance > 0 && (!customerId || b.customerId === customerId))
  const applyHold = () => {
    if (hold && reason.trim().length < 3) { toast.error('Enter a reason for the credit hold.'); return }
    setCreditHold(customer.id, hold, reason.trim())
    logAudit({ action: 'STATUS_CHANGE', module: 'ar', entity: 'Customer', recordId: customer.id, recordLabel: customer.name, description: `Credit hold ${hold ? 'placed' : 'released'} for ${customer.name}${reason ? ` — ${reason}` : ''}.` })
    toast.success(hold ? 'Credit hold placed — credit orders and van credit sales are blocked' : 'Credit hold released')
    setHold(null); setReason('')
  }
  return (
    <div data-testid="receivables-page">
      <PageHeader title="Receivables & Aging" description="Open invoice balances = invoice total − posted receipts − approved credit notes. Aging by days past due date."
        actions={can(user, 'finance.ar.manage') && <Button icon={Plus} to={`/finance/payments/new${customerId ? `?customerId=${customerId}` : ''}`}>Record receipt</Button>} />
      <KpiGrid items={[
        { label: 'Total receivables', value: money(k.ar), icon: Wallet },
        { label: 'Overdue', value: money(k.overdue), tone: k.overdue ? 'danger' : 'success' },
        { label: 'Collected this month', value: money(k.collectedMonth), to: '/finance/payments?status=POSTED' },
        { label: 'Unapplied cash', value: money(unappliedCash()), to: '/finance/payments' },
      ]} />
      <Card className="mb-5">
        <CardHeader title="Aging by customer" subtitle="Click a customer for the statement" />
        <SimpleTable columns={agingCols('customer', 'Customer')} rows={aging} rowTo={(r) => `/finance/receivables?customer=${r.customerId}`} empty="No open receivables." />
      </Card>
      <Card>
        <CardHeader title={customer ? `Statement — ${customer.name}` : 'Customer statement'} subtitle={customer ? `Credit limit ${money(customer.creditLimit)} · outstanding on account ${money(customer.creditBalance)}${customer.creditHold ? ' · ON CREDIT HOLD' : ''}` : 'Choose a customer'}
          action={customer && can(user, 'finance.credithold.manage') && (customer.creditHold
            ? <Button size="sm" variant="secondary" icon={Unlock} onClick={() => setHold(false)} data-testid="release-hold">Release credit hold</Button>
            : <Button size="sm" variant="danger" icon={Lock} onClick={() => setHold(true)} data-testid="place-hold">Place credit hold</Button>)} />
        <div className="mb-4 max-w-sm">
          <Select label="Customer" value={customerId} placeholder="Select customer…" options={customers.map((c) => ({ value: c.id, label: c.name }))} onChange={(e) => setParams(e.target.value ? { customer: e.target.value } : {}, { replace: true })} />
        </div>
        {customer && (
          <>
            {customer.creditHold && <Badge tone="danger" dot className="mb-3">Credit hold: {customer.creditHoldReason}</Badge>}
            <SimpleTable caption="Statement" columns={[{ key: 'date', header: 'Date', render: (r) => formatDate(r.date) }, { key: 'type', header: 'Type' }, { key: 'ref', header: 'Reference' }, { key: 'debit', header: 'Debit', align: 'right', render: (r) => (r.debit ? money(r.debit) : '') }, { key: 'credit', header: 'Credit', align: 'right', render: (r) => (r.credit ? money(r.credit) : '') }, { key: 'balance', header: 'Balance', align: 'right', render: (r) => money(r.balance) }]} rows={statement} rowTo={(r) => r.link} empty="No invoices or receipts for this customer." />
          </>
        )}
        <p className="mb-2 mt-5 text-sm font-semibold text-ink">Open invoices{customer ? '' : ' (all customers)'}</p>
        <SimpleTable columns={[{ key: 'invoiceNumber', header: 'Invoice' }, { key: 'dueDate', header: 'Due', render: (b) => formatDate(b.dueDate) }, { key: 'total', header: 'Total', align: 'right', render: (b) => money(b.total) }, { key: 'paid', header: 'Paid / credited', align: 'right', render: (b) => money(b.paid + b.credited) }, { key: 'balance', header: 'Balance', align: 'right', render: (b) => money(b.balance) }, { key: 'overdueDays', header: 'Overdue', align: 'right', render: (b) => (b.overdueDays ? <Badge tone={b.overdueDays > 60 ? 'danger' : 'warning'}>{b.overdueDays} d</Badge> : '—') }]} rows={open} rowTo={(b) => `/invoices/${b.id}`} empty="No open invoices." />
      </Card>
      {hold !== null && customer && (
        <Modal open onClose={() => setHold(null)} title={hold ? `Place ${customer.name} on credit hold` : `Release credit hold for ${customer.name}`} description={hold ? 'Credit-term orders and van credit sales are refused while the hold is in place.' : 'The customer can buy on credit again within their limit.'}
          footer={<><Button variant="secondary" onClick={() => setHold(null)}>Cancel</Button><Button variant={hold ? 'danger' : 'primary'} onClick={applyHold} data-testid="confirm-hold">{hold ? 'Place hold' : 'Release'}</Button></>}>
          <Textarea label={hold ? 'Reason (required)' : 'Note'} value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
        </Modal>
      )}
    </div>
  )
}

/** Payables aging and supplier bill balances. */
export function PayablesPage() {
  useStoreTick()
  const { user } = useAuth()
  const aging = apAging()
  const bills = supplierInvoiceBalances().filter((b) => b.balance > 0)
  const sup = Object.fromEntries(getSuppliers().map((s) => [s.id, s.name]))
  return (
    <div data-testid="payables-page">
      <PageHeader title="Payables & Aging" description="Open supplier bills = bill total − payments marked paid. No payment is sent from the prototype."
        actions={can(user, 'finance.ap.manage') && <Button icon={FileText} to="/finance/payables/invoices/new">Record supplier invoice</Button>} />
      <KpiGrid items={[
        { label: 'Total payables', value: money(aging.reduce((s, r) => s + r.total, 0)), icon: Scale },
        { label: 'Overdue', value: money(aging.reduce((s, r) => s + r.d30 + r.d60 + r.d90 + r.d90p, 0)), tone: 'warning' },
        { label: 'Bills to approve', value: read(K.SUPPLIER_INVOICES).filter((s) => ['RECEIVED', 'MATCHED', 'VARIANCE'].includes(s.status)).length, to: '/finance/payables/invoices' },
        { label: 'Payments to approve', value: read(K.SUPPLIER_PAYMENTS).filter((p) => p.status === 'DRAFT').length, to: '/finance/payables/payments?status=DRAFT' },
      ]} />
      <Card className="mb-5"><CardHeader title="Aging by supplier" /><SimpleTable columns={agingCols('supplier', 'Supplier')} rows={aging} empty="No open payables." /></Card>
      <Card>
        <CardHeader title="Open supplier bills" />
        <SimpleTable columns={[{ key: 'number', header: 'Bill' }, { key: 'supplierId', header: 'Supplier', render: (b) => sup[b.supplierId] || b.supplierId }, { key: 'supplierInvoiceNo', header: 'Supplier ref.' }, { key: 'dueDate', header: 'Due', render: (b) => formatDate(b.dueDate) }, { key: 'balance', header: 'Balance', align: 'right', render: (b) => money(b.balance) }, { key: 'status', header: 'Status' }]} rows={bills} rowTo={(b) => `/finance/payables/invoices/${b.id}`} empty="No open bills." />
      </Card>
    </div>
  )
}

/** VAT summary from records + TRN format check. Not a tax return and not submitted to the FTA. */
export function VatPage() {
  useStoreTick()
  const [from, setFrom] = useState(dayjs().startOf('quarter').format('YYYY-MM-DD'))
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'))
  const [trn, setTrn] = useState('')
  const v = vatSummary(from, to)
  const trnErr = trn ? validateTrn(trn) : null
  const company = read(K.COMPANY)
  return (
    <div data-testid="vat-page">
      <PageHeader title="VAT Summary" description={`Output tax from issued invoices, less approved credit notes; input tax from approved supplier bills and expenses. Standard rate for new enterprise documents: ${vatRate()} %. Prototype summary only — not filed with the Federal Tax Authority.`} />
      <Card className="mb-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="text-sm"><p className="text-xs text-muted">Company TRN / tax no.</p><p className="pt-2 font-medium text-ink">{company?.trn || company?.vatNumber || company?.gstNumber || 'Not set in Company Profile'}</p></div>
        </div>
      </Card>
      <KpiGrid items={[
        { label: 'Taxable sales', value: money(v.outputBase), icon: Percent, hint: `${v.invoices} invoices`, to: '/invoices' },
        { label: 'Output tax', value: money(v.output) },
        { label: 'Credit-note tax', value: money(v.creditVat), to: '/finance/credit-notes' },
        { label: 'Input tax (bills + expenses)', value: money(v.input), hint: `${money(v.inputSup)} + ${money(v.inputExp)}`, to: '/finance/expenses' },
      ]} />
      <Card className="mb-5">
        <CardHeader title="Net position" />
        <p className="text-2xl font-semibold tabular text-ink" data-testid="vat-net">{money(v.payable)}</p>
        <p className="text-sm text-muted">{v.payable >= 0 ? 'Payable (output − input)' : 'Refundable (input exceeds output)'} for {formatDate(from)} – {formatDate(to)}.</p>
      </Card>
      <Card>
        <CardHeader title="TRN check" subtitle="Format check only (15 digits, starts with 100) — not verified with the FTA." />
        <div className="max-w-sm"><Input label="TRN" value={trn} onChange={(e) => setTrn(e.target.value)} error={trnErr} hint={trn && !trnErr ? 'Format is valid.' : undefined} /></div>
      </Card>
    </div>
  )
}
