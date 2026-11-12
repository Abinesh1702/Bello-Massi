import { useMemo } from 'react'
import { ClipboardList, TrendingUp, Boxes, ShoppingCart, Truck, PackageCheck, Wallet, Lightbulb } from 'lucide-react'
import StatCard, { StatGrid } from '../StatCard'
import { usePermission } from '../../../hooks/usePermission'
import { useOpsSnapshot } from '../../../hooks/useOpsSnapshot'
import { useStoredValue } from '../../../hooks/useLocalStorage'
import { adminOps } from '../../../services/roleDashboardService'
import { ORDER_STATUS as S, STORAGE_KEYS } from '../../../utils/constants'
import { inRange } from '../../../utils/periods'
import { formatCompactCurrency, formatNumber } from '../../../utils/formatters'

const NONE = []
const DELIVERED = [S.DELIVERED, S.PARTIALLY_DELIVERED]

/**
 * Admin / Super Admin: one strip across orders, sales, inventory, purchase, dispatch, delivery, finance and AI.
 * All Time shows the original rolling windows (30 / 7 days). A bounded period shows the same measures for that
 * period: orders on order date, sales on delivered date, deliveries on completion date, invoices on invoice date.
 */
export default function OpsOverview() {
  const snap = useOpsSnapshot()
  const allOrders = useStoredValue(STORAGE_KEYS.ORDERS, NONE)
  const range = snap.range
  const bounded = Boolean(range?.start)
  const m = useMemo(() => adminOps(snap), [snap])
  const p = useMemo(() => {
    if (!bounded) return null
    const sales = (r) => allOrders.filter((o) => DELIVERED.includes(o.orderStatus) && inRange(o.deliveredAt || o.updatedAt, r))
    const cur = sales(range)
    const prev = snap.previous ? sales(snap.previous.range) : null
    const delivered = (list) => list.filter((d) => d.status === 'DELIVERED').length
    return {
      salesValue: cur.reduce((a, o) => a + (Number(o.totalAmount) || 0), 0), salesCount: cur.length,
      prevSalesValue: prev ? prev.reduce((a, o) => a + (Number(o.totalAmount) || 0), 0) : null,
      delivered: delivered(snap.deliveries), prevDelivered: snap.previous ? delivered(snap.previous.deliveries) : null,
      prevOrders: snap.previous ? snap.previous.orders.length : null,
      prevInvoiced: snap.previous ? adminOps(snap.previous).finance.invoiced : null,
    }
  }, [bounded, allOrders, range, snap])
  const showAi = usePermission('ai.insights.view')
  const showFinance = usePermission('finance.view')
  const cmp = (previous, format) => (previous === null || previous === undefined ? undefined : { previous, format })
  return (
    <section aria-label="Operations overview" className="space-y-2">
      <h2 className="text-section-title">Operations overview</h2>
      <StatGrid cols={4}>
        <StatCard label="Orders" value={formatNumber(m.orders.total)} compare={p && cmp(p.prevOrders) && { ...cmp(p.prevOrders), current: m.orders.total }} icon={ClipboardList} tone="brand"
          hint={bounded ? `${m.orders.pending} pending approval` : `${m.orders.last30} in 30 days · ${m.orders.pending} pending`} to="/orders" />
        {bounded
          ? <StatCard label="Sales (delivered)" value={formatCompactCurrency(p.salesValue)} compare={cmp(p.prevSalesValue, formatCompactCurrency) && { ...cmp(p.prevSalesValue, formatCompactCurrency), current: p.salesValue }} icon={TrendingUp} tone="success" hint={`${p.salesCount} delivered orders`} to="/orders/reports" />
          : <StatCard label="Sales (delivered, 30 days)" value={formatCompactCurrency(m.sales.delivered30Value)} icon={TrendingUp} tone="success" hint={`${m.sales.delivered30} delivered orders`} to="/orders/reports" />}
        <StatCard label="Inventory value" live value={formatCompactCurrency(m.inventory.value)} icon={Boxes} tone="info" hint={`${m.inventory.low} low · ${m.inventory.out} out of stock`} to="/inventory" />
        <StatCard label="Purchase (replenishment)" value={m.purchase.submitted} icon={ShoppingCart} tone="warning" hint={`awaiting approval · ${m.purchase.approved} approved (${formatCompactCurrency(m.purchase.openValue)} open)`} to="/ai/replenishment" />
        <StatCard label="Dispatch" value={m.dispatch.active} icon={Truck} tone="accent" hint={`active dispatches · ${m.dispatch.ready} orders not yet planned`} to="/dispatch" />
        {bounded
          ? <StatCard label="Deliveries completed" value={p.delivered} compare={cmp(p.prevDelivered) && { ...cmp(p.prevDelivered), current: p.delivered }} icon={PackageCheck} tone="success" hint={`${m.delivery.out} out now · ${m.delivery.failed} failed to review`} to="/dispatch/delivery-tracking" />
          : <StatCard label="Delivery (7 days)" value={m.delivery.delivered7} icon={PackageCheck} tone="success" hint={`delivered · ${m.delivery.out} out now · ${m.delivery.failed} failed to review`} to="/dispatch/delivery-tracking" />}
        {showFinance
          ? <StatCard label="Finance — invoiced" value={formatCompactCurrency(m.finance.invoiced)} compare={p && cmp(p.prevInvoiced, formatCompactCurrency) && { ...cmp(p.prevInvoiced, formatCompactCurrency), current: m.finance.invoiced }} icon={Wallet} tone="brand" hint={`${m.finance.invoices} invoices · ${formatCompactCurrency(m.finance.outstanding)} credit outstanding`} to="/invoices/dashboard" />
          : <StatCard label="Finance" value="—" icon={Wallet} tone="neutral" hint="Not available for your role" />}
        {showAi
          ? <StatCard label="AI insights" value={m.ai.open} icon={Lightbulb} tone={m.ai.critical ? 'danger' : 'accent'} hint={`open · ${m.ai.critical} critical — rule-based signals`} to="/ai/insights" />
          : <StatCard label="AI insights" value="—" icon={Lightbulb} tone="neutral" hint="Not available for your role" />}
      </StatGrid>
    </section>
  )
}
