/**
 * Department and management dashboards. Every KPI is calculated from live prototype records at render time and
 * links to the records behind it.
 */
import dayjs from 'dayjs'
import {
  BadgeDollarSign, Target, ShoppingCart, PackageOpen, Truck, Wrench, Landmark, Users, Ship, AlertTriangle, ClipboardCheck,
  Wallet, Scale, Receipt, Fuel, Timer, CalendarClock, Siren, Boxes, HandCoins, Smartphone,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import SingleBarChart from '../../components/dashboard/charts/SingleBarChart'
import { KpiGrid, SimpleTable, useStoreTick } from '../../components/enterprise/ui'
import { executiveKpis, fleetKpis, hrKpis, importKpis, logisticsKpis, procurementKpis, salesKpis, vanKpis, warehouseKpis, computeAlerts } from '../../services/enterprise/analyticsService'
import { financeKpis, arAging, apAging } from '../../services/enterprise/financeService'
import { read } from '../../services/enterprise/recordService'
import { labelFor } from '../../services/enterprise/lookupService'
import { formatCompactCurrency, formatMoney, formatNumber } from '../../utils/formatters'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../config/permissions'

const money = (v) => formatMoney(v || 0)
const compact = (v) => formatCompactCurrency(v || 0)

function Grid2({ children }) { return <div className="grid gap-5 xl:grid-cols-2">{children}</div> }

function ExecutiveDashboard() {
  const k = executiveKpis()
  const alerts = computeAlerts().slice(0, 8)
  return (
    <>
      <PageHeader title="Executive Dashboard" description="Company-wide position calculated from the live records of every department. Click a figure to open the records behind it." actions={<Button variant="secondary" to="/operations/control-tower" icon={Siren}>Control tower</Button>} />
      <KpiGrid items={[
        { label: 'Sales this month', value: compact(k.sales.salesMonth), icon: BadgeDollarSign, to: '/orders', hint: `${k.sales.ordersMonth} orders` },
        { label: 'Target achievement', value: `${k.sales.achievementPct}%`, icon: Target, to: '/sales/targets', hint: `${compact(k.sales.achieved)} of ${compact(k.sales.targetValue)}`, tone: k.sales.achievementPct >= 80 ? 'success' : 'warning' },
        { label: 'Receivables', value: compact(k.finance.ar), icon: Wallet, to: '/finance/receivables', hint: `${compact(k.finance.overdue)} overdue`, tone: k.finance.overdue ? 'warning' : 'brand' },
        { label: 'Cash & bank', value: compact(k.finance.cash), icon: Landmark, to: '/finance/cash' },
        { label: 'Stock value (cost)', value: compact(k.stockValue), icon: Boxes, to: '/inventory', hint: `${k.lowStock} low / out of stock lines` },
        { label: 'On-time delivery', value: `${k.logistics.onTimePct}%`, icon: Truck, to: '/logistics/dashboard', hint: `${k.logistics.failed} failed` },
        { label: 'Open purchase orders', value: compact(k.procurement.poOpenValue), icon: ShoppingCart, to: '/procurement/purchase-orders', hint: `${k.procurement.poOpen} POs · ${k.procurement.poOverdue} overdue` },
        { label: 'Payables', value: compact(k.finance.ap), icon: Scale, to: '/finance/payables' },
        { label: 'QA blocked lots', value: k.qa.lotsBlocked, icon: ClipboardCheck, to: '/inventory/batches?qa=blocked', tone: k.qa.lotsBlocked ? 'warning' : 'success', hint: `${k.qa.ncrOpen} open NCRs` },
        { label: 'Fleet utilisation', value: `${k.fleet.utilisation}%`, icon: Truck, to: '/fleet/dashboard', hint: `${k.fleet.inMaintenance} in maintenance` },
        { label: 'Headcount', value: k.hr.headcount, icon: Users, to: '/hr/employees', hint: `${k.hr.onLeave} on leave today` },
        { label: 'Pipeline (weighted)', value: compact(k.sales.weighted), icon: Target, to: '/sales/opportunities' },
      ]} />
      <Grid2>
        <SingleBarChart title="Sales by month" subtitle="Booked orders (drafts, rejected and cancelled excluded)" data={k.sales.trend} valueFormatter={compact} seriesName="Sales" />
        <Card>
          <CardHeader title="Top alerts" subtitle="From the control tower" icon={AlertTriangle} action={<Button size="xs" variant="secondary" to="/operations/control-tower">All alerts</Button>} />
          <SimpleTable columns={[{ key: 'title', header: 'Alert' }, { key: 'area', header: 'Area' }, { key: 'severity', header: 'Severity' }]} rows={alerts} rowTo={(a) => a.link} empty="No alerts — everything within limits." />
        </Card>
        <SingleBarChart title="Sales by salesperson (this month)" data={k.sales.bySalesman} valueFormatter={compact} seriesName="Sales" />
        <Card>
          <CardHeader title="Receivables aging" subtitle="Top customers by open balance" icon={Wallet} />
          <SimpleTable columns={[{ key: 'customer', header: 'Customer' }, { key: 'total', header: 'Open', align: 'right', render: (r) => money(r.total) }, { key: 'd90p', header: '90+ d', align: 'right', render: (r) => money(r.d30 + r.d60 + r.d90 + r.d90p) }]} rows={arAging()} max={6} rowTo={(r) => `/finance/receivables?customer=${r.customerId}`} empty="No open receivables." />
        </Card>
      </Grid2>
    </>
  )
}

function SalesDashboard() {
  const k = salesKpis()
  return (
    <>
      <PageHeader title="Sales Dashboard" description="Sales value, targets, pipeline, returns and service from live orders and CRM records." />
      <KpiGrid items={[
        { label: 'Sales this month', value: compact(k.salesMonth), icon: BadgeDollarSign, to: '/orders', hint: `${k.ordersMonth} orders · avg ${compact(k.avgOrder)}` },
        { label: 'Target achievement', value: `${k.achievementPct}%`, icon: Target, to: '/sales/targets', tone: k.achievementPct >= 80 ? 'success' : 'warning' },
        { label: 'Open pipeline', value: compact(k.pipeline), icon: Target, to: '/sales/opportunities', hint: `weighted ${compact(k.weighted)}` },
        { label: 'Orders awaiting approval', value: k.pendingApproval, icon: Timer, to: '/orders/approval' },
        { label: 'Open leads', value: k.leadsOpen, to: '/sales/leads' },
        { label: 'Returns in progress', value: k.returnsOpen, to: '/sales/returns' },
        { label: 'Open service tickets', value: k.ticketsOpen, to: '/service/tickets', tone: k.ticketsOpen ? 'warning' : 'success' },
        { label: 'HORECA accounts', value: read(K.HORECA_ACCOUNTS).filter((a) => a.status === 'ACTIVE').length, to: '/horeca' },
      ]} />
      <Grid2>
        <SingleBarChart title="Sales by month" data={k.trend} valueFormatter={compact} seriesName="Sales" />
        <SingleBarChart title="Sales by salesperson (this month)" data={k.bySalesman} valueFormatter={compact} seriesName="Sales" />
        <Card className="xl:col-span-2">
          <CardHeader title="Targets this month" subtitle="Achievement from live orders" icon={Target} />
          <SimpleTable columns={[{ key: 'ownerId', header: 'Sales person', render: (t) => labelFor('users', t.ownerId) }, { key: 'targetValue', header: 'Target', align: 'right', render: (t) => money(t.targetValue) }]} rows={k.targets} rowTo={(t) => `/sales/targets/${t.id}`} empty="No targets set for this month." />
        </Card>
      </Grid2>
    </>
  )
}

function VanDashboard() {
  const k = vanKpis()
  const routes = read(K.VAN_ASSIGNMENTS).filter((a) => a.routeDate >= dayjs().subtract(7, 'day').format('YYYY-MM-DD'))
  return (
    <>
      <PageHeader title="Van Sales Dashboard" description="Routes, van sales and settlements. Van stock is loaded from and returned to hub stock through the single stock ledger." actions={<Button to="/van-sales/app" icon={Smartphone}>Open van app</Button>} />
      <KpiGrid items={[
        { label: 'Routes today', value: k.routesToday, icon: Truck, to: '/van-sales/routes' },
        { label: 'On route now', value: k.onRoute, to: '/van-sales/routes?status=ON_ROUTE' },
        { label: 'Sales today', value: `${k.salesToday} · ${compact(k.valueToday)}`, icon: HandCoins, to: '/van-sales/sales' },
        { label: 'Sales this month', value: compact(k.valueMonth), to: '/van-sales/sales' },
        { label: 'Settlements to approve', value: k.settlementsPending, to: '/van-sales/settlements?status=SUBMITTED', tone: k.settlementsPending ? 'warning' : 'success' },
        { label: 'Net cash variance', value: money(k.variance), to: '/van-sales/settlements', tone: k.variance < 0 ? 'danger' : 'success' },
      ]} cols={3} />
      <Card>
        <CardHeader title="Recent routes" icon={Truck} />
        <SimpleTable columns={[{ key: 'number', header: 'Route' }, { key: 'routeName', header: 'Name' }, { key: 'routeDate', header: 'Date' }, { key: 'salesExecId', header: 'Executive', render: (r) => labelFor('users', r.salesExecId) }, { key: 'status', header: 'Status' }]} rows={routes} rowTo={(r) => `/van-sales/routes/${r.id}`} empty="No routes in the last 7 days." />
      </Card>
    </>
  )
}

function ProcurementDashboard() {
  const k = procurementKpis()
  return (
    <>
      <PageHeader title="Procurement Dashboard" description="Requisitions, RFQs, purchase orders, receiving and supplier performance from live records." />
      <KpiGrid items={[
        { label: 'Requisitions to approve', value: k.prPending, icon: Timer, to: '/procurement/requisitions?status=SUBMITTED' },
        { label: 'RFQs open', value: k.rfqOpen, to: '/procurement/rfqs' },
        { label: 'POs to approve', value: k.poPending, to: '/procurement/purchase-orders?status=PENDING_APPROVAL', tone: k.poPending ? 'warning' : 'brand' },
        { label: 'Open PO value', value: compact(k.poOpenValue), icon: ShoppingCart, to: '/procurement/purchase-orders', hint: `${k.poOpen} POs` },
        { label: 'POs overdue', value: k.poOverdue, to: '/procurement/purchase-orders', tone: k.poOverdue ? 'danger' : 'success' },
        { label: 'GRNs to post', value: k.grnDraft, icon: PackageOpen, to: '/warehouse/receiving?status=DRAFT' },
        { label: 'Invoice variances', value: k.invoicesVariance, to: '/finance/payables/invoices?status=VARIANCE', tone: k.invoicesVariance ? 'warning' : 'success' },
        { label: 'Active suppliers', value: k.suppliers.length, to: '/suppliers' },
      ]} />
      <Grid2>
        <SingleBarChart title="PO value by month" data={k.spendTrend} valueFormatter={compact} seriesName="PO value" />
        <Card>
          <CardHeader title="Supplier performance" subtitle="On-time %, quality acceptance % and spend" />
          <SimpleTable columns={[{ key: 'name', header: 'Supplier' }, { key: 'orders', header: 'POs', align: 'right' }, { key: 'onTimePct', header: 'On time', align: 'right', render: (r) => (r.onTimePct === null ? '—' : `${r.onTimePct}%`) }, { key: 'qualityPct', header: 'Quality', align: 'right', render: (r) => (r.qualityPct === null ? '—' : `${r.qualityPct}%`) }, { key: 'value', header: 'Spend', align: 'right', render: (r) => compact(r.value) }]} rows={k.suppliers} rowTo={() => '/procurement/suppliers-performance'} />
        </Card>
      </Grid2>
    </>
  )
}

function ImportDashboard() {
  const k = importKpis()
  return (
    <>
      <PageHeader title="Import Dashboard" description="Shipments, port arrivals, customs and landed cost." />
      <KpiGrid items={[
        { label: 'In transit', value: k.inTransit, icon: Ship, to: '/import/shipments?status=IN_TRANSIT' },
        { label: 'At port / customs', value: k.atPort, to: '/import/shipments' },
        { label: 'Arriving ≤ 7 days', value: k.arriving7, to: '/import/shipments' },
        { label: 'Late (ETA passed)', value: k.late, tone: k.late ? 'danger' : 'success', to: '/import/shipments' },
        { label: 'Goods value in pipeline', value: compact(k.goodsValue), to: '/import/shipments' },
        { label: 'Freight, duty & charges', value: compact(k.extraCost), to: '/import/shipments' },
        { label: 'Shipments missing documents', value: k.missingDocs, tone: k.missingDocs ? 'warning' : 'success', to: '/import/shipments' },
      ]} />
      <SingleBarChart title="Shipments by milestone" data={k.byStatus} seriesName="Shipments" />
    </>
  )
}

function WarehouseDashboard() {
  const { user } = useAuth()
  const k = warehouseKpis(can(user, 'warehouse.locations.manage') ? null : user?.hubId)
  return (
    <>
      <PageHeader title="Warehouse Operations" description="Task queues, lot status and productivity. Quantities come from the stock ledger; lots and bins from the batch layer." />
      <KpiGrid items={[
        { label: 'GRNs to post', value: k.receivingOpen, icon: PackageOpen, to: '/warehouse/receiving?status=DRAFT' },
        { label: 'Put-away open', value: k.putawayOpen, to: '/warehouse/putaway' },
        { label: 'Picking open', value: k.pickingOpen, to: '/warehouse/picking' },
        { label: 'Packing open', value: k.packingOpen, to: '/warehouse/packing' },
        { label: 'Loading open', value: k.loadingOpen, to: '/warehouse/loading' },
        { label: 'Tasks done today', value: k.tasksDoneToday, tone: 'success' },
        { label: 'Lots on QA hold', value: k.lotsOnHold, to: '/inventory/batches?qa=blocked', tone: k.lotsOnHold ? 'warning' : 'success' },
        { label: 'Expired / expiring ≤ 7 d', value: `${k.lotsExpired} / ${k.lotsExpiring7}`, to: '/inventory/batches?expiry=7', tone: k.lotsExpired ? 'danger' : 'brand' },
        { label: 'Bins in use', value: `${k.binsUsed} / ${k.bins}`, to: '/warehouse/locations?level=BIN' },
        { label: 'Counts awaiting approval', value: k.counts, to: '/inventory/counts?status=SUBMITTED' },
      ]} />
      <SingleBarChart title="Productivity today" subtitle="Tasks completed per person" data={k.productivity} seriesName="Tasks" />
    </>
  )
}

function LogisticsDashboard() {
  const k = logisticsKpis()
  return (
    <>
      <PageHeader title="Logistics Dashboard" description="Delivery performance, reschedules and route plans." />
      <KpiGrid items={[
        { label: 'On-time delivery', value: `${k.onTimePct}%`, icon: Truck, to: '/dispatch/delivery-history', hint: `${k.delivered} delivered` },
        { label: 'Failed deliveries', value: k.failed, tone: k.failed ? 'danger' : 'success', to: '/dispatch/delivery-history' },
        { label: 'In transit', value: k.inTransit, to: '/dispatch/delivery-tracking' },
        { label: 'Ready to dispatch', value: k.readyToDispatch, to: '/dispatch/ready-orders' },
        { label: 'Active dispatches', value: k.dispatchesActive, to: '/dispatch' },
        { label: 'Reschedules to decide', value: k.reschedulesOpen, icon: CalendarClock, to: '/logistics/reschedules?status=REQUESTED' },
        { label: 'Route plans (upcoming)', value: k.routesPlanned, to: '/logistics/routes' },
      ]} />
      <SingleBarChart title="Deliveries completed by hub" data={k.byHub} seriesName="Deliveries" />
    </>
  )
}

function FleetDashboard() {
  const k = fleetKpis()
  return (
    <>
      <PageHeader title="Fleet Dashboard" description="Availability, maintenance, fuel efficiency and compliance." />
      <KpiGrid items={[
        { label: 'Active vehicles', value: k.vehicles, icon: Truck, to: '/vms/vehicles' },
        { label: 'Available', value: k.available, tone: 'success', to: '/vms/vehicles' },
        { label: 'Utilisation', value: `${k.utilisation}%`, to: '/dispatch/live-tracking' },
        { label: 'In maintenance', value: k.inMaintenance, icon: Wrench, to: '/fleet/maintenance?status=IN_PROGRESS', tone: k.inMaintenance ? 'warning' : 'success' },
        { label: 'Open maintenance jobs', value: k.maintenanceOpen, to: '/fleet/maintenance' },
        { label: 'Maintenance cost (month)', value: money(k.maintenanceCostMonth), to: '/fleet/maintenance?status=COMPLETED' },
        { label: 'Fuel cost (month)', value: money(k.fuelCostMonth), icon: Fuel, to: '/fleet/fuel', hint: `${formatNumber(k.fuelLitresMonth)} L` },
        { label: 'Documents expiring ≤ 30 d', value: k.docsExpiring, to: '/vms/document-expiry', tone: k.docsExpiring ? 'warning' : 'success' },
        { label: 'Driver claims to approve', value: k.expensesPending, icon: Receipt, to: '/drivers/expenses?status=SUBMITTED' },
      ]} />
      <SingleBarChart title="Fuel efficiency (km / litre)" subtitle="From odometer readings between fills" data={k.efficiency} seriesName="km/L" />
    </>
  )
}

function FinanceDashboard() {
  const k = financeKpis()
  const ap = apAging()
  return (
    <>
      <PageHeader title="Finance Dashboard" description="Receivables, payables, cash and expenses — all figures computed from invoices, receipts, credit notes, supplier bills, expenses and vouchers in the prototype." />
      <KpiGrid items={[
        { label: 'Receivables', value: compact(k.ar), icon: Wallet, to: '/finance/receivables', hint: `${k.openInvoices} open invoices` },
        { label: 'Overdue', value: compact(k.overdue), tone: k.overdue ? 'danger' : 'success', to: '/finance/receivables' },
        { label: 'Collected this month', value: compact(k.collectedMonth), to: '/finance/payments?status=POSTED' },
        { label: 'Invoiced this month', value: compact(k.salesMonth), to: '/invoices' },
        { label: 'Payables', value: compact(k.ap), icon: Scale, to: '/finance/payables' },
        { label: 'Expenses this month', value: compact(k.expensesMonth), icon: Receipt, to: '/finance/expenses' },
        { label: 'Cash & bank', value: compact(k.cash), icon: Landmark, to: '/finance/cash' },
        { label: 'VAT summary', value: 'Open', to: '/finance/vat' },
      ]} />
      <Grid2>
        <Card>
          <CardHeader title="Receivables by customer" icon={Wallet} />
          <SimpleTable columns={[{ key: 'customer', header: 'Customer' }, { key: 'current', header: 'Not due', align: 'right', render: (r) => money(r.current) }, { key: 'over', header: 'Overdue', align: 'right', render: (r) => money(r.d30 + r.d60 + r.d90 + r.d90p) }, { key: 'total', header: 'Total', align: 'right', render: (r) => money(r.total) }]} rows={arAging()} rowTo={(r) => `/finance/receivables?customer=${r.customerId}`} max={8} empty="No open receivables." />
        </Card>
        <Card>
          <CardHeader title="Payables by supplier" icon={Scale} />
          <SimpleTable columns={[{ key: 'supplier', header: 'Supplier' }, { key: 'invoices', header: 'Bills', align: 'right' }, { key: 'total', header: 'Open', align: 'right', render: (r) => money(r.total) }]} rows={ap} rowTo={() => '/finance/payables'} empty="No open payables." />
        </Card>
      </Grid2>
    </>
  )
}

function HrDashboard() {
  const k = hrKpis()
  return (
    <>
      <PageHeader title="HR Dashboard" description="Headcount, attendance, leave, recruitment and document expiry from HR records." />
      <KpiGrid items={[
        { label: 'Headcount', value: k.headcount, icon: Users, to: '/hr/employees' },
        { label: `Attendance (${k.attendanceDate ? dayjs(k.attendanceDate).format('DD MMM') : '—'})`, value: `${k.attendancePct}%`, to: '/hr/attendance', hint: `${k.late} late` },
        { label: 'On leave today', value: k.onLeave, to: '/hr/leave?status=APPROVED' },
        { label: 'Leave to approve', value: k.leavePending, to: '/hr/leave?status=PENDING', tone: k.leavePending ? 'warning' : 'success' },
        { label: 'Open positions', value: k.openPositions, to: '/hr/recruitment?status=OPEN' },
        { label: 'Candidates in process', value: k.candidates, to: '/hr/candidates' },
        { label: 'Visa / ID expiring ≤ 60 d', value: k.docsExpiring, to: '/hr/employees', tone: k.docsExpiring ? 'warning' : 'success' },
      ]} />
      <SingleBarChart title="Headcount by department" data={k.byDept} seriesName="Employees" />
    </>
  )
}

const DASHBOARDS = { executive: ExecutiveDashboard, sales: SalesDashboard, vansales: VanDashboard, procurement: ProcurementDashboard, import: ImportDashboard, warehouse: WarehouseDashboard, logistics: LogisticsDashboard, fleet: FleetDashboard, finance: FinanceDashboard, hr: HrDashboard }

export default function EnterpriseDashboard({ navItem }) {
  useStoreTick()
  const D = DASHBOARDS[navItem?.dashboard] || ExecutiveDashboard
  return <div data-testid={`dashboard-${navItem?.dashboard || 'executive'}`}><D /></div>
}

