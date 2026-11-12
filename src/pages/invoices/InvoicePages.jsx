import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ReceiptText, Plus, Printer, FileDown, ArrowLeft, Mail, MessageCircle, XCircle, IndianRupee, FileCheck2, Ban, LayoutTemplate, Eye, ClipboardList, Wallet } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import InfoList from '../../components/common/InfoList'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import SingleBarChart from '../../components/dashboard/charts/SingleBarChart'
import InvoiceDocument from '../../components/phase5/InvoiceDocument'
import { InvoiceStatusBadge } from '../../components/phase5/Badges'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { usePermission } from '../../hooks/usePermission'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../utils/constants'
import { invoiceBalances } from '../../services/enterprise/financeService'
import { useTableQuery } from '../../hooks/useTableQuery'
import { cancelInvoice, generateInvoice, invoiceEligibility, previewInvoice, searchInvoices, peekNextInvoiceNumber } from '../../services/invoiceService'
import { validateInvoiceTotals } from '../../services/invoiceCalculationService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { INVOICE_STATUS_META } from '../../config/invoiceConfig'
import { formatCompactCurrency, formatDate, formatMoney } from '../../utils/formatters'

const printInvoice = (pdf = false) => {
  if (pdf) toast.info('Choose “Save as PDF” as the printer', { description: 'The browser’s print dialog creates the PDF — nothing is uploaded.' })
  window.setTimeout(() => window.print(), pdf ? 300 : 0)
}

/* ---------------- list ---------------- */
const NONE = []
/** Receivable position per invoice from posted receipts and approved credit notes (refreshes when they change). */
const useInvoiceBalances = () => {
  const payments = useStoredValue(STORAGE_KEYS.CUSTOMER_PAYMENTS, NONE)
  const credits = useStoredValue(STORAGE_KEYS.CREDIT_NOTES, NONE)
  const invoices = useStoredValue(STORAGE_KEYS.INVOICES, NONE)
  return useMemo(() => Object.fromEntries(invoiceBalances().map((b) => [b.id, b])), [payments, credits, invoices]) // eslint-disable-line react-hooks/exhaustive-deps
}
function PaymentBadge({ invoice, balance }) {
  if (invoice.status === 'CANCELLED' || !balance) return <span className="text-xs text-muted">—</span>
  if (balance.status === 'PAID') return <Badge tone="success">Paid</Badge>
  if (balance.status === 'PARTIAL') return <Badge tone="warning">Part paid</Badge>
  return <Badge tone={balance.overdueDays > 0 ? 'danger' : 'info'}>{balance.overdueDays > 0 ? 'Overdue' : 'Open'}</Badge>
}

export function InvoiceList() {
  const navigate = useNavigate()
  const d = usePhase5Data()
  const canManage = usePermission('invoices.manage')
  const t = useTableQuery({ filters: ['status', 'customerId', 'hubId', 'from', 'to'] })
  const rows = useMemo(() => searchInvoices(t.q, t.filters, d.invoices).sort((a, b) => (a.invoiceNumber < b.invoiceNumber ? 1 : -1)), [d.invoices, t.q, t.filters])
  const balances = useInvoiceBalances()
  const onExport = () => toast.success(`Exported ${downloadCsv(csvFilename('invoices'), rows, [
    ['Invoice Number', (i) => i.invoiceNumber], ['Invoice Date', (i) => i.invoiceDate], ['Due Date', (i) => i.dueDate], ['Order', (i) => i.orderNumber], ['Customer', (i) => i.customerSnapshot.name],
    ['Subtotal', (i) => i.totals.subtotal.toFixed(2)], ['Discount', (i) => (i.totals.itemDiscount + i.totals.orderDiscount).toFixed(2)], ['Tax (demo)', (i) => i.totals.taxAmount.toFixed(2)], ['Grand Total', (i) => i.totals.grandTotal.toFixed(2)],
    ['Status', (i) => INVOICE_STATUS_META[i.status].label], ['Received / credited', (i) => ((balances[i.id]?.paid || 0) + (balances[i.id]?.credited || 0)).toFixed(2)], ['Open balance', (i) => (i.status === 'CANCELLED' ? 0 : balances[i.id]?.balance ?? 0).toFixed(2)], ['Template', (i) => i.templateSnapshot.name],
  ].map(([header, value]) => ({ header, value })))} invoices`)
  return (
    <>
      <PageHeader title="Invoices" description="Issued invoices with their immutable snapshot. Tax is a configurable demo calculation." actions={canManage && <Button icon={Plus} to="/invoices/create">New invoice</Button>} />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search invoice, order, customer…" total={d.invoices.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={Object.entries(INVOICE_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} />
          <FilterSelect label="Customer" allLabel="All customers" value={t.filters.customerId} onChange={(v) => t.setFilter('customerId', v)} options={d.customers.map((c) => ({ value: c.id, label: c.name }))} />
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={d.hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterInput label="From" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} title="Invoice date from" />
          <FilterInput label="To" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} title="Invoice date to" />
        </FilterToolbar>
        <DataTable caption="Invoices" rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} onRowClick={(i) => navigate(`/invoices/${i.id}`)} empty={<EmptyState icon={ReceiptText} title="No invoices yet" />} columns={[
          { key: 'n', header: 'Invoice', render: (i) => (<div><p className="font-medium tabular whitespace-nowrap">{i.invoiceNumber}</p><p className="text-xs text-muted">{formatDate(i.invoiceDate)}</p></div>) },
          { key: 'c', header: 'Customer', render: (i) => <span className="block max-w-[220px] truncate">{i.customerSnapshot.name}</span> },
          { key: 'o', header: 'Order', hideBelow: 'md', render: (i) => <span className="tabular whitespace-nowrap">{i.orderNumber}</span> },
          { key: 'dn', header: 'Delivery note', hideBelow: 'xl', render: (i) => i.deliveryNoteNumber || '—' },
          { key: 't', header: 'Total', align: 'right', render: (i) => <span className="whitespace-nowrap">{formatMoney(i.totals.grandTotal)}</span> },
          { key: 's', header: 'Status', render: (i) => <InvoiceStatusBadge status={i.status} /> },
          { key: 'p', header: 'Payment', hideBelow: 'sm', render: (i) => <PaymentBadge invoice={i} balance={balances[i.id]} /> },
        ]} />
      </Card>
    </>
  )
}

/* ---------------- dashboard ---------------- */
export function InvoiceDashboard() {
  const d = usePhase5Data()
  const canManage = usePermission('invoices.manage')
  const issued = d.invoices.filter((i) => i.status === 'ISSUED')
  const value = issued.reduce((s, i) => s + i.totals.grandTotal, 0)
  const tax = issued.reduce((s, i) => s + i.totals.taxAmount, 0)
  const invoicedOrders = new Set(issued.map((i) => i.orderId))
  const toInvoice = d.orders.filter((o) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.orderStatus) && !invoicedOrders.has(o.id))
  const byMonth = Object.entries(issued.reduce((m, i) => { const k = i.invoiceDate.slice(0, 7); m[k] = (m[k] || 0) + i.totals.grandTotal; return m }, {})).sort(([a], [b]) => (a < b ? -1 : 1)).slice(-6).map(([k, v]) => ({ name: dayjs(`${k}-01`).format('MMM YY'), value: Math.round(v) }))
  const byCustomer = Object.values(issued.reduce((m, i) => { m[i.customerId] ||= { name: i.customerSnapshot.name.slice(0, 18), value: 0 }; m[i.customerId].value += Math.round(i.totals.grandTotal); return m }, {})).sort((a, b) => b.value - a.value).slice(0, 6)
  return (
    <>
      <PageHeader title="Invoice dashboard" description="Issued invoices, value and delivered orders still to invoice — from data stored in this browser." actions={canManage && <Button icon={Plus} to="/invoices/create">New invoice</Button>} />
      <StatGrid cols={4}>
        <StatCard label="Issued invoices" value={issued.length} icon={FileCheck2} tone="success" hint={`${d.invoices.length - issued.length} cancelled`} to="/invoices" />
        <StatCard label="Invoiced value" value={formatCompactCurrency(value)} icon={IndianRupee} tone="accent" hint={`${formatCompactCurrency(tax)} demo tax`} to="/reports/view/fin-invoices" />
        <StatCard label="Delivered, not invoiced" value={toInvoice.length} icon={ClipboardList} tone="warning" hint={formatCompactCurrency(toInvoice.reduce((s, o) => s + o.totalAmount, 0))} to="/invoices/create" />
        <StatCard label="Active templates" value={d.invoiceTemplates.filter((x) => x.active).length} icon={LayoutTemplate} tone="brand" hint={`Next number ${peekNextInvoiceNumber(d.invoiceSettings, d.invoices).number}`} to="/invoices/templates" />
      </StatGrid>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SingleBarChart title="Invoiced value by month" subtitle="Issued invoices (incl. demo tax)" data={byMonth} valueFormatter={formatCompactCurrency} seriesName="Value" height={240} />
        <SingleBarChart title="Top customers" subtitle="Issued invoice value" data={byCustomer} valueFormatter={formatCompactCurrency} seriesName="Value" height={240} />
      </div>
      <Card className="mt-6">
        <CardHeader title="Delivered orders waiting for an invoice" icon={ClipboardList} />
        {toInvoice.length ? (
          <ul className="divide-y divide-line">{toInvoice.slice(0, 8).map((o) => <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span><span className="font-medium tabular">{o.orderNumber}</span> <span className="text-muted">· {o.customerName} · {formatMoney(o.totalAmount)}</span></span>{canManage && <Button size="sm" variant="secondary" icon={ReceiptText} to={`/invoices/create?orderId=${o.id}`}>Invoice</Button>}</li>)}</ul>
        ) : <EmptyState compact title="Every delivered order is invoiced" />}
      </Card>
    </>
  )
}

/* ---------------- create ---------------- */
export function InvoiceCreate() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const d = usePhase5Data()
  const [v, setV] = useState({
    orderId: params.get('orderId') || '', templateId: d.invoiceTemplates.find((x) => x.isDefault)?.id || '', quantityBasis: 'DELIVERED', invoiceDate: dayjs().format('YYYY-MM-DD'), dueDate: '',
    discountType: 'NONE', discountValue: '0', shippingCharges: '0', additionalCharges: '0', chargesTaxPercentage: '0', taxMode: 'PRODUCT', flatTaxPercentage: '0', notes: '',
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => { setV((x) => ({ ...x, [k]: e.target.value })); setErrors({}) }
  const options = { templateId: v.templateId, quantityBasis: v.quantityBasis, invoiceDate: v.invoiceDate, dueDate: v.dueDate, orderDiscount: { type: v.discountType, value: Number(v.discountValue) || 0 }, shippingCharges: v.shippingCharges, additionalCharges: v.additionalCharges, chargesTaxPercentage: v.chargesTaxPercentage, taxMode: v.taxMode, flatTaxPercentage: v.flatTaxPercentage, notes: v.notes }
  const candidates = d.orders.filter((o) => o.orderNumber && !invoiceEligibility(o, d.invoices))
  const order = d.lk.orders[v.orderId]
  const reason = v.orderId ? invoiceEligibility(order, d.invoices) : null
  const preview = useMemo(() => (v.orderId && !reason ? previewInvoice(v.orderId, options) : null), [v, d.invoices, d.invoiceTemplates, reason]) // eslint-disable-line react-hooks/exhaustive-deps
  const submit = () => {
    setBusy(true)
    const res = generateInvoice(v.orderId, options)
    setBusy(false)
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success(`Invoice ${res.record.invoiceNumber} issued`, { description: 'Inventory, dispatch and delivery records were not changed.' })
    navigate(`/invoices/${res.record.id}`, { replace: true })
  }
  return (
    <>
      <PageHeader title="New invoice" description="Pick an approved order. Customer, product and price details come from existing records; totals are recalculated and the issued invoice is locked." actions={<Button variant="secondary" icon={ArrowLeft} to="/invoices">Invoices</Button>} />
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2 h-fit">
          <CardHeader title="Invoice details" icon={ReceiptText} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Order" required placeholder={candidates.length ? 'Select order' : 'No orders to invoice'} value={v.orderId} onChange={set('orderId')} options={(order && !candidates.includes(order) ? [order, ...candidates] : candidates).map((o) => ({ value: o.id, label: `${o.orderNumber} · ${o.customerName} · ${o.orderStatus.toLowerCase().replace(/_/g, ' ')}` }))} error={errors.orderId || reason} className="sm:col-span-2" />
            <Select label="Template" required value={v.templateId} onChange={set('templateId')} options={d.invoiceTemplates.filter((x) => x.active).map((x) => ({ value: x.id, label: `${x.name}${x.isDefault ? ' (default)' : ''}` }))} error={errors.templateId} className="sm:col-span-2" />
            <Select label="Quantities billed" value={v.quantityBasis} onChange={set('quantityBasis')} options={[{ value: 'DELIVERED', label: 'Delivered (from delivery note)' }, { value: 'ORDERED', label: 'Ordered' }]} hint="Delivered falls back to ordered when there is no delivery note." className="sm:col-span-2" />
            <Input label="Invoice date" type="date" value={v.invoiceDate} onChange={set('invoiceDate')} error={errors.invoiceDate} />
            <Input label="Due date" type="date" value={v.dueDate} onChange={set('dueDate')} error={errors.dueDate} />
            <Select label="Order discount" value={v.discountType} onChange={set('discountType')} options={[{ value: 'NONE', label: 'None' }, { value: 'PERCENT', label: 'Percent' }, { value: 'AMOUNT', label: 'Amount' }]} />
            <Input label={v.discountType === 'PERCENT' ? 'Discount %' : 'Discount amount'} type="number" min="0" value={v.discountValue} onChange={set('discountValue')} disabled={v.discountType === 'NONE'} error={errors.orderDiscount} />
            <Input label="Shipping charges" type="number" min="0" value={v.shippingCharges} onChange={set('shippingCharges')} error={errors.shippingCharges} />
            <Input label="Additional charges" type="number" min="0" value={v.additionalCharges} onChange={set('additionalCharges')} error={errors.additionalCharges} />
            <Input label="Tax on charges % (demo)" type="number" min="0" value={v.chargesTaxPercentage} onChange={set('chargesTaxPercentage')} error={errors.chargesTaxPercentage} />
            <Select label="Tax rate" value={v.taxMode} onChange={set('taxMode')} options={[{ value: 'PRODUCT', label: 'Product rate from order' }, { value: 'FLAT', label: 'Flat demo rate' }]} />
            {v.taxMode === 'FLAT' && <Input label="Flat demo tax %" type="number" min="0" value={v.flatTaxPercentage} onChange={set('flatTaxPercentage')} error={errors.flatTaxPercentage} />}
            <Textarea label="Notes on invoice" value={v.notes} onChange={set('notes')} rows={2} maxLength={300} className="sm:col-span-2" />
          </div>
          {errors.form && <p role="alert" className="mt-3 text-sm text-danger">{errors.form}</p>}
          <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4"><Button variant="secondary" to="/invoices">Cancel</Button><Button icon={FileCheck2} onClick={submit} loading={busy} disabled={!preview}>Issue invoice</Button></div>
        </Card>
        <div className="xl:col-span-3 min-w-0">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted"><Eye size={13} /> Live preview{preview ? ` · number ${preview.invoiceNumber} is reserved on issue` : ''}</p>
          {preview ? <InvoiceDocument invoice={preview} preview /> : <Card><EmptyState icon={ReceiptText} title={reason || 'Select an order to preview the invoice'} /></Card>}
        </div>
      </div>
    </>
  )
}

/* ---------------- detail / print ---------------- */
export function InvoiceDetail() {
  const { id } = useParams()
  const d = usePhase5Data()
  const canManage = usePermission('invoices.manage')
  const canSend = usePermission('communication.send')
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  const canReceipt = usePermission('finance.ar.manage')
  const canFinance = usePermission('finance.ar.view')
  const balances = useInvoiceBalances()
  const receiptsAll = useStoredValue(STORAGE_KEYS.CUSTOMER_PAYMENTS, NONE)
  const inv = d.lk.invoices[id]
  if (!inv) return <NotFoundRecord entity="invoice" backTo="/invoices" backLabel="Back to invoices" />
  const check = validateInvoiceTotals(inv)
  const bal = balances[inv.id]
  const applied = receiptsAll.filter((p) => ['POSTED', 'PENDING_DEPOSIT'].includes(p.status) && (p.allocations || []).some((a) => a.invoiceId === inv.id))
  const doCancel = () => {
    const res = cancelInvoice(inv.id, { reason })
    if (!res.ok) { setErr(res.errors?.reason || res.error); return }
    setCancelling(false)
    toast.success(`${inv.invoiceNumber} cancelled`, { description: 'The number stays used; the order can be invoiced again.' })
  }
  return (
    <>
      <div className="no-print"><PageHeader title={inv.invoiceNumber} description={`${inv.customerSnapshot.name} · ${inv.orderNumber} · ${formatMoney(inv.totals.grandTotal)}`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={ArrowLeft} to="/invoices">Invoices</Button>
            {canSend && <Button variant="ghost" icon={Mail} to={`/communication/email/compose?invoiceId=${inv.id}`}>Email</Button>}
            {canSend && <Button variant="ghost" icon={MessageCircle} to={`/communication/whatsapp/compose?invoiceId=${inv.id}`}>WhatsApp</Button>}
            <Button variant="secondary" icon={FileDown} onClick={() => printInvoice(true)}>Save as PDF</Button>
            <Button variant="secondary" icon={Printer} to={`/invoices/${inv.id}/print`}>Print view</Button>
            {canManage && inv.status === 'ISSUED' && <Button variant="danger-outline" icon={Ban} onClick={() => setCancelling(true)}>Cancel invoice</Button>}
          </div>
        )} /></div>
      <div className="grid gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3 min-w-0"><InvoiceDocument invoice={inv} /></div>
        <div className="no-print space-y-6">
          <Card>
            <CardHeader title="Record" action={<InvoiceStatusBadge status={inv.status} />} />
            <InfoList columns={1} items={[
              { label: 'Issued', value: `${formatDate(inv.createdAt)} by ${inv.createdByName}` },
              { label: 'Template', value: `${inv.templateSnapshot.name} (v${inv.templateVersion}) — snapshot` },
              { label: 'Quantities', value: inv.quantityBasis === 'DELIVERED' ? 'Delivered' : 'Ordered' },
              { label: 'Totals check', value: check.ok ? 'Recalculated — matches' : `Mismatch: ${check.issues[0]}` },
              { label: 'Cancelled', value: inv.cancelledAt ? `${formatDate(inv.cancelledAt)} — ${inv.cancelReason}` : '', hidden: !inv.cancelledAt },
              { label: 'Emailed', value: inv.emailedAt ? formatDate(inv.emailedAt) : '', hidden: !inv.emailedAt },
            ]} />
          </Card>
          {inv.status !== 'CANCELLED' && (
            <Card>
              <CardHeader title="Payment" action={<PaymentBadge invoice={inv} balance={bal} />} />
              <InfoList columns={1} items={[
                { label: 'Invoice total', value: formatMoney(inv.totals.grandTotal) },
                { label: 'Received / credited', value: formatMoney((bal?.paid || 0) + (bal?.credited || 0)) },
                { label: 'Open balance', value: formatMoney(bal?.balance ?? inv.totals.grandTotal) },
                { label: 'Due', value: inv.dueDate ? `${formatDate(inv.dueDate)}${bal?.overdueDays ? ` · ${bal.overdueDays} days overdue` : ''}` : '—' },
              ]} />
              {applied.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">{applied.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">{canFinance ? <Link to={`/finance/payments/${p.id}`} className="text-brand hover:underline">{p.number}</Link> : <span>{p.number}</span>}<span className="tabular text-muted">{formatMoney((p.allocations || []).filter((a) => a.invoiceId === inv.id).reduce((s, a) => s + Number(a.amount || 0), 0))}</span></li>
                ))}</ul>
              )}
              {canReceipt && (bal?.balance ?? 0) > 0 && <Button className="mt-3" size="sm" icon={Wallet} to={`/finance/payments/new?customerId=${inv.customerId}`} fullWidth>Record receipt</Button>}
            </Card>
          )}
          <Card><CardHeader title="Links" /><div className="flex flex-col gap-2"><Button variant="secondary" size="sm" icon={ClipboardList} to={`/orders/${inv.orderId}`}>Order {inv.orderNumber}</Button>{inv.deliveryNoteId && <Button variant="secondary" size="sm" icon={FileCheck2} to={`/dispatch/delivery-notes/${inv.deliveryNoteId}`}>Delivery note</Button>}</div></Card>
        </div>
      </div>
      <Modal open={cancelling} onClose={() => setCancelling(false)} size="sm" icon={XCircle} title={`Cancel ${inv.invoiceNumber}?`} description="The issued snapshot is kept unchanged and marked cancelled. The order can then be invoiced again with a new number."
        footer={<><Button variant="secondary" onClick={() => setCancelling(false)}>Keep invoice</Button><Button variant="danger" onClick={doCancel}>Cancel invoice</Button></>}>
        <Textarea label="Reason" required value={reason} onChange={(e) => { setReason(e.target.value); setErr('') }} error={err} rows={3} maxLength={200} />
      </Modal>
    </>
  )
}

export function InvoicePrint() {
  const { id } = useParams()
  const d = usePhase5Data()
  const inv = d.lk.invoices[id]
  if (!inv) return <NotFoundRecord entity="invoice" backTo="/invoices" backLabel="Back to invoices" />
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" icon={ArrowLeft} to={`/invoices/${inv.id}`}>Back</Button>
        <div className="flex gap-2"><Button variant="secondary" icon={FileDown} onClick={() => printInvoice(true)}>Save as PDF</Button><Button icon={Printer} onClick={() => printInvoice(false)}>Print</Button></div>
      </div>
      <InvoiceDocument invoice={inv} />
    </div>
  )
}

/* ---------------- reports ---------------- */
