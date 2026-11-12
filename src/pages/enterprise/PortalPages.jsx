/**
 * Supplier portal, employee self-service, van sales app, driver expenses & cash, customer statement and support.
 * Every list goes through recordService.listRecords (permission + data scope), so a supplier only ever sees its own
 * documents, a customer its own account and a driver / employee their own records.
 */
import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { Building, FileText, ShoppingCart, Wallet, LogIn, LogOut, CalendarClock, Plus, Truck, HandCoins, Receipt, Fuel, Banknote, Ticket, Scale, Play, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import EmptyState from '../../components/common/EmptyState'
import Tabs from '../../components/common/Tabs'
import { KpiGrid, SimpleTable, useStoreTick } from '../../components/enterprise/ui'
import { StatusBadge } from '../../components/enterprise/fields'
import { createRecord, getModuleDef, listRecords, patchRecord, read, runAction } from '../../services/enterprise/recordService'
import { labelFor } from '../../services/enterprise/lookupService'
import { customerStatement, invoiceBalances, supplierInvoiceBalances } from '../../services/enterprise/financeService'
import { vanStock } from '../../services/enterprise/vanSalesService'
import { getSuppliers } from '../../services/supplierService'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../config/permissions'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { formatDate, formatMoney, formatNumber } from '../../utils/formatters'

const money = (v) => formatMoney(v || 0)
const st = (moduleId) => (r) => <StatusBadge def={getModuleDef(moduleId)} status={r.status} />

/* ---------------- Supplier portal ---------------- */
export function SupplierPortal({ navItem }) {
  useStoreTick()
  const { user } = useAuth()
  const internal = !user?.supplierId
  const [pick, setPick] = useState(getSuppliers()[0]?.id || '')
  const supplierId = user?.supplierId || pick
  const supplier = getSuppliers().find((s) => s.id === supplierId)
  const mine = (moduleId) => listRecords(moduleId, user).filter((r) => r.supplierId === supplierId)
  const pos = mine('purchase_orders')
  const rfqs = read(K.RFQS).filter((r) => r.status === 'ISSUED' && (r.supplierIds || []).includes(supplierId))
  const quotes = mine('supplier_quotes')
  const grns = mine('goods_receipts').filter((g) => g.status === 'POSTED')
  const invoices = mine('supplier_invoices')
  const payments = mine('supplier_payments')
  const balances = supplierInvoiceBalances().filter((b) => b.supplierId === supplierId)
  const finance = navItem?.portalTab === 'finance'
  if (!supplierId) return <EmptyState title="No supplier linked" description="Your account is not linked to a supplier." />
  return (
    <div data-testid="supplier-portal">
      <PageHeader title={finance ? 'Supplier Finance' : 'Supplier Portal'} description={`${supplier?.name || ''} — your purchase orders, RFQs, deliveries, invoices and payments. Other suppliers' data is never shown.`}
        actions={internal && <div className="w-64"><Select label="Preview as supplier (internal users)" value={pick} options={getSuppliers().map((s) => ({ value: s.id, label: s.name }))} onChange={(e) => setPick(e.target.value)} /></div>} />
      <KpiGrid items={[
        { label: 'POs to confirm', value: pos.filter((p) => p.status === 'SENT').length, icon: ShoppingCart, to: '/procurement/purchase-orders?status=SENT' },
        { label: 'Open POs', value: pos.filter((p) => ['APPROVED', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(p.status)).length, to: '/procurement/purchase-orders' },
        { label: 'RFQs to quote', value: rfqs.filter((r) => !quotes.some((q) => q.rfqId === r.id)).length, icon: FileText, to: '/procurement/quotes' },
        { label: 'Balance due to you', value: money(balances.reduce((s, b) => s + b.balance, 0)), icon: Wallet, to: '/finance/payables/invoices' },
      ]} />
      {!finance ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader title="Purchase orders" icon={ShoppingCart} />
            <SimpleTable columns={[{ key: 'number', header: 'PO' }, { key: 'orderDate', header: 'Date', render: (p) => formatDate(p.orderDate) }, { key: 'expectedDate', header: 'Delivery', render: (p) => formatDate(p.expectedDate) }, { key: 'total', header: 'Value', align: 'right', render: (p) => money(p.total) }, { key: 'status', header: 'Status', render: st('purchase_orders') }]} rows={pos} rowTo={(p) => `/procurement/purchase-orders/${p.id}`} empty="No purchase orders yet." />
          </Card>
          <Card>
            <CardHeader title="Requests for quotation" icon={FileText} />
            <SimpleTable columns={[{ key: 'number', header: 'RFQ' }, { key: 'title', header: 'Title' }, { key: 'responseDue', header: 'Due', render: (r) => formatDate(r.responseDue) }, { key: 'q', header: 'Your quote', render: (r) => { const q = quotes.find((x) => x.rfqId === r.id); return q ? q.number : (can(user, 'supplierportal.access') || can(user, 'procurement.rfq.manage')) ? <Button size="xs" to={`/procurement/quotes/new?rfqId=${r.id}`}>Submit quote</Button> : '—' } }]} rows={rfqs} rowTo={(r) => { const q = quotes.find((x) => x.rfqId === r.id); return q ? `/procurement/quotes/${q.id}` : null }} empty="No open RFQs." />
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader title="Deliveries received" subtitle="Posted goods receipts" />
            <SimpleTable columns={[{ key: 'number', header: 'GRN' }, { key: 'receivedDate', header: 'Received', render: (g) => formatDate(g.receivedDate) }, { key: 'lines', header: 'Accepted / rejected', render: (g) => `${formatNumber(g.lines.reduce((s, l) => s + (l.receivedQty || 0) - (l.rejectedQty || 0), 0))} / ${formatNumber(g.lines.reduce((s, l) => s + (l.rejectedQty || 0), 0))}` }]} rows={grns} rowTo={(g) => `/warehouse/receiving/${g.id}`} empty="No deliveries received yet." />
          </Card>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader title="Your invoices" icon={FileText} action={(can(user, 'supplierportal.access') || can(user, 'finance.ap.manage')) && <Button size="xs" icon={Plus} to="/finance/payables/invoices/new">Submit invoice</Button>} />
            <SimpleTable columns={[{ key: 'supplierInvoiceNo', header: 'Invoice' }, { key: 'invoiceDate', header: 'Date', render: (i) => formatDate(i.invoiceDate) }, { key: 'total', header: 'Total', align: 'right', render: (i) => money(i.total) }, { key: 'bal', header: 'Balance', align: 'right', render: (i) => money(balances.find((b) => b.id === i.id)?.balance ?? 0) }, { key: 'status', header: 'Status', render: st('supplier_invoices') }]} rows={invoices} rowTo={(i) => `/finance/payables/invoices/${i.id}`} empty="No invoices submitted." />
          </Card>
          <Card>
            <CardHeader title="Payments" icon={Wallet} />
            <SimpleTable columns={[{ key: 'number', header: 'Payment' }, { key: 'paymentDate', header: 'Date', render: (p) => formatDate(p.paymentDate) }, { key: 'amount', header: 'Amount', align: 'right', render: (p) => money(p.amount) }, { key: 'status', header: 'Status', render: st('supplier_payments') }]} rows={payments} rowTo={(p) => `/finance/payables/payments/${p.id}`} empty="No payments yet." />
          </Card>
        </div>
      )}
    </div>
  )
}

/* ---------------- Employee self-service ---------------- */
export function EssPage() {
  useStoreTick()
  const { user } = useAuth()
  const emp = read(K.EMPLOYEES).find((e) => e.userId === user?.id)
  const [tab, setTab] = useState('overview')
  if (!emp) return <><PageHeader title="My HR" /><EmptyState icon={Building} title="No employee record linked" description="HR has not linked an employee record to your user account yet." /></>
  const year = String(dayjs().year())
  const leaves = listRecords('leave_requests', user).filter((l) => l.employeeId === emp.id)
  const usedAnnual = leaves.filter((l) => l.leaveType === 'Annual leave' && ['APPROVED', 'PENDING'].includes(l.status) && String(l.fromDate).startsWith(year)).reduce((s, l) => s + (l.days || 0), 0)
  const usedSick = leaves.filter((l) => l.leaveType === 'Sick leave' && l.status === 'APPROVED' && String(l.fromDate).startsWith(year)).reduce((s, l) => s + (l.days || 0), 0)
  const att = listRecords('employee_attendance', user).filter((a) => a.employeeId === emp.id).sort((a, b) => String(b.date).localeCompare(a.date))
  const todayRec = att.find((a) => a.date === dayjs().format('YYYY-MM-DD'))
  const payslips = read(K.PAYROLL).filter((p) => ['APPROVED', 'PAID_DEMO'].includes(p.status)).flatMap((p) => (p.lines || []).filter((l) => l.employeeId === emp.id).map((l) => ({ ...l, id: `${p.id}-${l.employeeId}`, period: p.period, status: p.status })))
  const checkIn = () => {
    const r = createRecord('employee_attendance', { employeeId: emp.id, userId: user.id, date: dayjs().format('YYYY-MM-DD'), checkIn: dayjs().format('HH:mm'), checkOut: '', source: 'ESS', remarks: 'Self-service check-in' }, user)
    if (r.ok) toast.success('Checked in'); else toast.error(r.error)
  }
  const checkOut = () => {
    if (!todayRec || todayRec.userId !== user.id) return
    const out = dayjs().format('HH:mm')
    if (out <= todayRec.checkIn) { toast.error('Check-out must be after check-in.'); return }
    patchRecord('employee_attendance', todayRec.id, { checkOut: out }, { user, action: 'Self-service check-out' })
    toast.success('Checked out')
  }
  return (
    <div data-testid="ess-page">
      <PageHeader title="My HR (Self-Service)" description={`${emp.name} · ${emp.employeeCode} · ${labelFor('designations', emp.designationId)} · ${labelFor('departments', emp.departmentId)}`}
        actions={<>{!todayRec && <Button icon={LogIn} onClick={checkIn} data-testid="ess-checkin">Check in</Button>}{todayRec && !todayRec.checkOut && todayRec.checkIn && <Button variant="secondary" icon={LogOut} onClick={checkOut} data-testid="ess-checkout">Check out</Button>}<Button variant="secondary" icon={CalendarClock} to="/hr/leave/new">Apply for leave</Button></>} />
      <KpiGrid items={[
        { label: 'Annual leave left', value: `${30 - usedAnnual} d`, hint: `${usedAnnual} used / requested this year` },
        { label: 'Sick leave used', value: `${usedSick} d`, hint: 'of 15 days (demo policy)' },
        { label: 'Today', value: todayRec ? `${todayRec.checkIn || '—'} → ${todayRec.checkOut || '…'}` : 'Not checked in' },
        { label: 'Payslips', value: payslips.length },
      ]} />
      <Card>
        <Tabs tabs={[{ id: 'overview', label: 'Profile' }, { id: 'attendance', label: 'Attendance' }, { id: 'leave', label: 'Leave' }, { id: 'pay', label: 'Payslips' }]} value={tab} onChange={setTab} className="mb-4 -mx-5 px-5" />
        {tab === 'overview' && (
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            {[['Email', emp.email], ['Phone', emp.phone || '—'], ['Joined', formatDate(emp.joinDate)], ['Branch', labelFor('branches', emp.branchId)], ['Reports to', labelFor('employees', emp.reportingManagerId)], ['Work location', labelFor('hubs', emp.workLocationHubId)], ['Passport expiry', emp.passportExpiry ? formatDate(emp.passportExpiry) : '—'], ['Visa expiry', emp.visaExpiry ? formatDate(emp.visaExpiry) : '—'], ['Emirates ID expiry', emp.emiratesIdExpiry ? formatDate(emp.emiratesIdExpiry) : '—']].map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="text-ink">{v}</dd></div>)}
          </dl>
        )}
        {tab === 'attendance' && <SimpleTable columns={[{ key: 'date', header: 'Date', render: (a) => formatDate(a.date) }, { key: 'checkIn', header: 'In' }, { key: 'checkOut', header: 'Out' }, { key: 'hoursWorked', header: 'Hours', align: 'right' }, { key: 'status', header: 'Status', render: st('employee_attendance') }]} rows={att} max={20} empty="No attendance yet." />}
        {tab === 'leave' && <SimpleTable columns={[{ key: 'number', header: 'Request' }, { key: 'leaveType', header: 'Type' }, { key: 'fromDate', header: 'From', render: (l) => formatDate(l.fromDate) }, { key: 'toDate', header: 'To', render: (l) => formatDate(l.toDate) }, { key: 'days', header: 'Days', align: 'right' }, { key: 'status', header: 'Status', render: st('leave_requests') }]} rows={leaves} rowTo={(l) => `/hr/leave/${l.id}`} empty="No leave requests." />}
        {tab === 'pay' && (
          <>
            <p className="mb-3 text-xs text-muted">Demo payslips from the prototype payroll — no WPS or bank transfer is involved.</p>
            <SimpleTable columns={[{ key: 'period', header: 'Month' }, { key: 'gross', header: 'Gross', align: 'right', render: (l) => money(l.gross) }, { key: 'absenceDeduction', header: 'Absence', align: 'right', render: (l) => money(l.absenceDeduction) }, { key: 'net', header: 'Net', align: 'right', render: (l) => <span className="font-semibold">{money(l.net)}</span> }]} rows={payslips} empty="No approved payroll yet." />
          </>
        )}
      </Card>
    </div>
  )
}

/* ---------------- Van sales app ---------------- */
export function VanSalesApp() {
  useStoreTick()
  const { user } = useAuth()
  const manager = can(user, 'vansales.manage')
  const routes = listRecords('van_assignments', user).filter((a) => ['PLANNED', 'LOADED', 'ON_ROUTE'].includes(a.status) && (manager || a.salesExecId === user.id))
  const [routeId, setRouteId] = useState('')
  const route = routes.find((r) => r.id === routeId) || routes[0]
  const [sale, setSale] = useState({ customerId: '', paymentMode: 'Cash', qty: {} })
  const [settle, setSettle] = useState(false)
  const [cash, setCash] = useState('')
  const customers = useMemo(() => read(K.CUSTOMERS).filter((c) => c.status === 'Active'), [])
  const stock = route ? vanStock(route) : []
  const P = Object.fromEntries(read(K.PRODUCTS).map((p) => [p.id, p]))
  const sales = route ? read(K.VAN_SALES).filter((s) => s.assignmentId === route.id) : []
  const act = (id, input = {}) => { const r = runAction('van_assignments', route.id, id, input, user); if (r.ok) toast.success('Done'); else toast.error(r.error); return r }
  const sell = () => {
    const lines = Object.entries(sale.qty).filter(([, q]) => Number(q) > 0).map(([productId, quantity]) => ({ productId, quantity: Number(quantity), unitPrice: P[productId]?.sellingPrice || 0 }))
    if (!lines.length) { toast.error('Enter at least one quantity.'); return }
    const r = createRecord('van_sales', { assignmentId: route.id, customerId: sale.customerId, paymentMode: sale.paymentMode, salesExecId: user.id, lines }, user)
    if (!r.ok) { toast.error(r.error); return }
    toast.success(`Sale ${r.record.number} — ${money(r.record.total)}`)
    setSale({ customerId: '', paymentMode: sale.paymentMode, qty: {} })
  }
  return (
    <div className="mx-auto max-w-2xl" data-testid="van-app">
      <PageHeader title="Van Sales" description="Today’s route, stock on the van and quick sales. Stock moves through the stock ledger (load, sale, return)." />
      {!route ? <EmptyState icon={Truck} title="No active route" description="Your manager has not planned a van route for you." action={manager && <Button icon={Plus} to="/van-sales/routes/new">Plan a route</Button>} /> : (
        <>
          {routes.length > 1 && <div className="mb-4"><Select label="Route" value={route.id} options={routes.map((r) => ({ value: r.id, label: `${r.number} · ${r.routeName} · ${labelFor('users', r.salesExecId)}` }))} onChange={(e) => setRouteId(e.target.value)} /></div>}
          <Card className="mb-4">
            <CardHeader title={`${route.routeName}`} subtitle={`${route.number} · ${formatDate(route.routeDate)} · ${labelFor('vehicles', route.vehicleId)}`} icon={Truck} action={<StatusBadge def={getModuleDef('van_assignments')} status={route.status} />} />
            <div className="flex flex-wrap gap-2">
              {route.status === 'PLANNED' && can(user, 'vansales.manage') && <Button size="sm" icon={Truck} onClick={() => act('load')} data-testid="van-load">Load van</Button>}
              {route.status === 'LOADED' && <Button size="sm" icon={Play} onClick={() => act('start')} data-testid="van-start">Start route</Button>}
              {['LOADED', 'ON_ROUTE'].includes(route.status) && <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => setSettle(true)} data-testid="van-settle">End route & settle</Button>}
              <Button size="sm" variant="secondary" to={`/van-sales/routes/${route.id}`}>Route details</Button>
            </div>
          </Card>
          <Card className="mb-4">
            <CardHeader title="Van stock" icon={HandCoins} />
            <SimpleTable columns={[{ key: 'productId', header: 'Product', render: (s) => P[s.productId]?.name }, { key: 'loaded', header: 'Loaded', align: 'right' }, { key: 'sold', header: 'Sold', align: 'right' }, { key: 'onVan', header: 'On van', align: 'right', render: (s) => <span className="font-semibold">{s.onVan}</span> }]} rows={stock} />
          </Card>
          {route.status === 'ON_ROUTE' && (
            <Card className="mb-4" data-testid="van-sale-form">
              <CardHeader title="New sale" icon={Plus} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Customer" value={sale.customerId} placeholder="Select customer…" options={customers.map((c) => ({ value: c.id, label: c.name }))} onChange={(e) => setSale({ ...sale, customerId: e.target.value })} />
                <Select label="Payment" value={sale.paymentMode} options={['Cash', 'Credit', 'Card'].map((x) => ({ value: x, label: x }))} onChange={(e) => setSale({ ...sale, paymentMode: e.target.value })} />
              </div>
              <div className="mt-3 space-y-2">
                {stock.filter((s) => s.onVan > 0).map((s) => (
                  <div key={s.productId} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate">{P[s.productId]?.name} <span className="text-muted">· {money(P[s.productId]?.sellingPrice)} · {s.onVan} left</span></span>
                    <Input aria-label={`Quantity of ${P[s.productId]?.name}`} type="number" min={0} max={s.onVan} className="w-24" value={sale.qty[s.productId] || ''} onChange={(e) => setSale({ ...sale, qty: { ...sale.qty, [s.productId]: e.target.value } })} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end"><Button icon={HandCoins} onClick={sell} disabled={!sale.customerId} data-testid="van-sell">Record sale</Button></div>
            </Card>
          )}
          <Card>
            <CardHeader title="Sales on this route" />
            <SimpleTable columns={[{ key: 'number', header: 'Sale' }, { key: 'customerId', header: 'Customer', render: (s) => labelFor('customers', s.customerId) }, { key: 'paymentMode', header: 'Pay' }, { key: 'total', header: 'Total', align: 'right', render: (s) => money(s.total) }]} rows={sales} rowTo={(s) => `/van-sales/sales/${s.id}`} empty="No sales yet." />
          </Card>
          {settle && (
            <Modal open onClose={() => setSettle(false)} title="End route & settle" description={`Unsold stock returns to the hub. Expected cash from cash sales: ${money(sales.filter((s) => s.paymentMode === 'Cash' && s.status === 'COMPLETED').reduce((x, s) => x + s.total, 0))}.`}
              footer={<><Button variant="secondary" onClick={() => setSettle(false)}>Cancel</Button><Button onClick={() => { const r = act('settle', { values: { cashDeposited: cash } }); if (r.ok) setSettle(false) }} data-testid="van-settle-confirm">Settle</Button></>}>
              <Input label="Cash deposited" type="number" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} />
            </Modal>
          )}
        </>
      )}
    </div>
  )
}

/* ---------------- Driver: expenses, fuel, cash, reschedules ---------------- */
export function DriverExpenses() {
  useStoreTick()
  const { user } = useAuth()
  const exp = listRecords('driver_expenses', user)
  const fuel = listRecords('fuel_logs', user)
  const cash = listRecords('customer_payments', user)
  const res = listRecords('delivery_reschedules', user)
  return (
    <div data-testid="driver-expenses">
      <PageHeader title="Expenses & Cash" description="Your claims, fuel fills, cash collected from customers and reschedule requests." />
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button icon={Receipt} to="/drivers/expenses/new">Expense</Button>
        <Button icon={Fuel} variant="secondary" to="/fleet/fuel/new">Fuel fill</Button>
        <Button icon={Banknote} variant="secondary" to="/finance/payments/new">Cash collected</Button>
        <Button icon={CalendarClock} variant="secondary" to="/logistics/reschedules/new">Reschedule</Button>
      </div>
      <div className="space-y-4">
        <Card><CardHeader title="Expense claims" icon={Receipt} /><SimpleTable columns={[{ key: 'number', header: 'Claim' }, { key: 'expenseType', header: 'Type' }, { key: 'amount', header: 'Amount', align: 'right', render: (r) => money(r.amount) }, { key: 'status', header: 'Status', render: st('driver_expenses') }]} rows={exp} rowTo={(r) => `/drivers/expenses/${r.id}`} empty="No claims." /></Card>
        <Card><CardHeader title="Cash collected" icon={Banknote} /><SimpleTable columns={[{ key: 'number', header: 'Receipt' }, { key: 'customerId', header: 'Customer', render: (r) => labelFor('customers', r.customerId) }, { key: 'amount', header: 'Amount', align: 'right', render: (r) => money(r.amount) }, { key: 'status', header: 'Status', render: st('customer_payments') }]} rows={cash} rowTo={(r) => `/finance/payments/${r.id}`} empty="No cash collections." /></Card>
        <Card><CardHeader title="Fuel fills" icon={Fuel} /><SimpleTable columns={[{ key: 'number', header: 'Entry' }, { key: 'date', header: 'Date', render: (r) => formatDate(r.date) }, { key: 'litres', header: 'Litres', align: 'right' }, { key: 'amount', header: 'Amount', align: 'right', render: (r) => money(r.amount) }]} rows={fuel} rowTo={(r) => `/fleet/fuel/${r.id}`} empty="No fuel entries." /></Card>
        <Card><CardHeader title="Reschedule requests" icon={CalendarClock} /><SimpleTable columns={[{ key: 'number', header: 'Request' }, { key: 'orderId', header: 'Order', render: (r) => labelFor('orders', r.orderId) }, { key: 'newDate', header: 'New date', render: (r) => formatDate(r.newDate) }, { key: 'status', header: 'Status', render: st('delivery_reschedules') }]} rows={res} rowTo={(r) => `/logistics/reschedules/${r.id}`} empty="No requests." /></Card>
      </div>
    </div>
  )
}

/* ---------------- Customer: statement & support ---------------- */
export function CustomerStatement() {
  useStoreTick()
  const { user } = useAuth()
  if (!user?.customerId) return <EmptyState title="No customer account linked" />
  const rows = customerStatement(user.customerId)
  const open = invoiceBalances().filter((b) => b.customerId === user.customerId && b.balance > 0)
  const credits = listRecords('credit_notes', user).filter((c) => c.status === 'APPROVED')
  return (
    <div data-testid="customer-statement">
      <PageHeader title="Statement of account" description="Invoices, payments received and credit notes on your account." />
      <KpiGrid cols={3} items={[
        { label: 'Balance due', value: money(open.reduce((s, b) => s + b.balance, 0)), icon: Scale },
        { label: 'Overdue', value: money(open.filter((b) => b.overdueDays > 0).reduce((s, b) => s + b.balance, 0)), tone: open.some((b) => b.overdueDays > 0) ? 'danger' : 'success' },
        { label: 'Credit notes', value: credits.length },
      ]} />
      <Card>
        <SimpleTable caption="Statement" columns={[{ key: 'date', header: 'Date', render: (r) => formatDate(r.date) }, { key: 'type', header: 'Type' }, { key: 'ref', header: 'Ref.' }, { key: 'debit', header: 'Debit', align: 'right', render: (r) => (r.debit ? money(r.debit) : '') }, { key: 'credit', header: 'Credit', align: 'right', render: (r) => (r.credit ? money(r.credit) : '') }, { key: 'balance', header: 'Balance', align: 'right', render: (r) => money(r.balance) }]} rows={rows} empty="No transactions yet." />
      </Card>
    </div>
  )
}

export function CustomerSupport() {
  useStoreTick()
  const { user } = useAuth()
  const tickets = listRecords('service_tickets', user)
  return (
    <div data-testid="customer-support">
      <PageHeader title="Support" description="Complaints, delivery issues and requests to Bellomassi customer service." actions={<Button icon={Ticket} to="/service/tickets/new">New request</Button>} />
      <Card>
        {tickets.length === 0 ? <EmptyState icon={Ticket} title="No requests yet" description="Raise a request and customer service will respond within the SLA." /> : (
          <SimpleTable columns={[{ key: 'number', header: 'Ticket' }, { key: 'subject', header: 'Subject' }, { key: 'category', header: 'Category' }, { key: 'status', header: 'Status', render: (t) => <Badge tone={getModuleDef('service_tickets').statuses[t.status]?.tone}>{getModuleDef('service_tickets').statuses[t.status]?.label}</Badge> }]} rows={tickets} rowTo={(t) => `/service/tickets/${t.id}`} />
        )}
      </Card>
    </div>
  )
}
