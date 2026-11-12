import { useMemo } from 'react'
import { ClipboardList, Truck, ReceiptText, Wallet, PackageCheck, Factory, CalendarClock, Info } from 'lucide-react'
import StatCard, { StatGrid } from '../StatCard'
import Card, { CardHeader } from '../../common/Card'
import Badge, { StatusBadge } from '../../common/Badge'
import DataTable from '../../common/DataTable'
import EmptyState from '../../common/EmptyState'
import InfoList from '../../common/InfoList'
import { useOpsSnapshot } from '../../../hooks/useOpsSnapshot'
import { customerPortal, supplierPortal } from '../../../services/roleDashboardService'
import { DELIVERY_STATUS_META } from '../../../config/dispatchConfig'
import { REPLENISHMENT_META } from '../../../config/aiConfig'
import { formatCompactCurrency, formatDate, formatMoney, formatNumber } from '../../../utils/formatters'

function PortalNote({ children }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-3 text-xs text-ink">
      <Info size={16} className="shrink-0 text-accent mt-px" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

/** Customer portal (read-only): one customer account's orders, deliveries, invoices and credit. */
export function CustomerPortalDashboard({ user }) {
  const snap = useOpsSnapshot()
  const p = useMemo(() => customerPortal(user.customerId, snap), [user.customerId, snap])
  if (!p.customer) {
    return <EmptyState icon={Info} title="No customer account linked" description="Ask an administrator to link your portal user to a customer account in User Management." />
  }
  const delivered = p.orders.filter((o) => o.orderStatus === 'DELIVERED')
  const upcoming = p.deliveries.filter((d) => ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(d.status))
  const invoiced = p.invoices.filter((i) => i.status === 'ISSUED')
  return (
    <div className="space-y-6">
      <PortalNote>Customer portal preview — read-only view of <strong>{p.customer.name}</strong>. Ordering, payments and statements from the portal are not part of this prototype.</PortalNote>
      <StatGrid cols={4}>
        <StatCard label="Open orders" value={p.open.length} icon={ClipboardList} tone="brand" hint={`${p.orders.length} orders in total`} />
        <StatCard label="Deliveries on the way" value={upcoming.length} icon={Truck} tone="accent" hint={`${delivered.length} delivered orders`} />
        <StatCard label="Invoices" value={invoiced.length} icon={ReceiptText} tone="info" hint={formatCompactCurrency(invoiced.reduce((a, i) => a + (Number(i.totals?.grandTotal) || 0), 0))} />
        <StatCard label="Credit available" live value={p.credit?.enabled === false ? '—' : formatCompactCurrency(p.credit?.available || 0)} icon={Wallet} tone={p.credit?.status === 'EXCEEDED' ? 'danger' : 'success'} hint={p.credit?.enabled === false ? 'Cash terms' : `of ${formatCompactCurrency(p.credit?.limit || 0)} limit`} />
      </StatGrid>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="My orders" subtitle="Newest first" icon={ClipboardList} />
          <DataTable
            dense
            pageSize="default"
            rows={p.orders}
            empty={<EmptyState compact icon={ClipboardList} title="No orders yet" />}
            columns={[
              { key: 'n', header: 'Order', render: (o) => <span className="font-medium text-ink">{o.orderNumber}</span> },
              { key: 'd', header: 'Date', render: (o) => formatDate(o.submittedAt || o.createdAt), hideBelow: 'sm' },
              { key: 'v', header: 'Value', align: 'right', render: (o) => formatMoney(o.totalAmount) },
              { key: 's', header: 'Status', render: (o) => <StatusBadge status={o.orderStatus} /> },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Account" icon={Wallet} />
          <InfoList columns={1} items={[
            { label: 'Customer', value: `${p.customer.name} (${p.customer.code})` },
            { label: 'Contact', value: p.customer.contactPerson },
            { label: 'Delivery address', value: [p.customer.addressLine1, p.customer.city].filter(Boolean).join(', ') },
            { label: 'Payment terms', value: p.customer.creditEnabled ? `${p.customer.creditDays} days credit` : 'Cash' },
          ]} />
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Deliveries" icon={Truck} />
          <DataTable
            dense
            rows={[...p.deliveries].sort((a, b) => ((b.deliveredAt || b.dispatchedAt || '') > (a.deliveredAt || a.dispatchedAt || '') ? 1 : -1)).slice(0, 6)}
            empty={<EmptyState compact icon={Truck} title="No deliveries yet" />}
            columns={[
              { key: 'o', header: 'Order', render: (d) => d.orderNumber },
              { key: 'd', header: 'Date', render: (d) => formatDate(d.deliveredAt || d.dispatchedAt), hideBelow: 'sm' },
              { key: 's', header: 'Status', render: (d) => <Badge tone={DELIVERY_STATUS_META[d.status]?.tone}>{DELIVERY_STATUS_META[d.status]?.label || d.status}</Badge> },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Invoices" icon={ReceiptText} />
          <DataTable
            dense
            rows={p.invoices.slice(0, 6)}
            empty={<EmptyState compact icon={ReceiptText} title="No invoices yet" />}
            columns={[
              { key: 'n', header: 'Invoice', render: (i) => i.invoiceNumber },
              { key: 'd', header: 'Date', render: (i) => formatDate(i.invoiceDate || i.createdAt), hideBelow: 'sm' },
              { key: 'v', header: 'Amount', align: 'right', render: (i) => formatMoney(i.totals?.grandTotal) },
              { key: 's', header: 'Status', render: (i) => <Badge tone={i.status === 'ISSUED' ? 'success' : 'neutral'}>{i.status === 'ISSUED' ? 'Issued' : 'Cancelled'}</Badge> },
            ]}
          />
        </Card>
      </div>
    </div>
  )
}

/** Supplier portal (read-only): approved replenishment addressed to one supplier. */
export function SupplierPortalDashboard({ user }) {
  const snap = useOpsSnapshot()
  const p = useMemo(() => supplierPortal(user.supplierId, snap), [user.supplierId, snap])
  if (!p.supplier) {
    return <EmptyState icon={Info} title="No supplier linked" description="Ask an administrator to link your portal user to a supplier in User Management." />
  }
  const open = p.drafts.filter((d) => ['APPROVED', 'CONVERTED'].includes(d.status))
  const hubName = (id) => p.hubs.find((h) => h.id === id)?.name || '—'
  return (
    <div className="space-y-6">
      <PortalNote>Supplier portal preview — read-only view of approved replenishment for <strong>{p.supplier.name}</strong>. Order acknowledgement, ASN and invoicing from the portal are not part of this prototype.</PortalNote>
      <StatGrid cols={4}>
        <StatCard label="Open purchase requests" value={open.length} icon={PackageCheck} tone="brand" hint={formatCompactCurrency(open.reduce((a, d) => a + (d.estimatedValue || 0), 0))} />
        <StatCard label="Lines requested" value={open.reduce((a, d) => a + d.lines.length, 0)} icon={ClipboardList} tone="info" hint={`${formatNumber(open.reduce((a, d) => a + d.lines.reduce((s, l) => s + l.quantity, 0), 0))} units`} />
        <StatCard label="Lead time" value={`${p.supplier.leadTimeDays} days`} icon={CalendarClock} tone="accent" hint="Planning parameter" />
        <StatCard label="Goods receipts" value={p.receipts.length} icon={Factory} tone="success" hint="Received against your requests" />
      </StatGrid>
      <Card>
        <CardHeader title="Approved replenishment" subtitle="Requests approved by Bellomassi, newest first" icon={PackageCheck} />
        {p.drafts.length === 0 ? (
          <EmptyState compact icon={PackageCheck} title="No approved requests" description="Approved replenishment addressed to you appears here." />
        ) : (
          <div className="space-y-4">
            {p.drafts.map((d) => (
              <div key={d.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{d.number} <span className="font-normal text-muted">· deliver to {hubName(d.hubId)}</span></p>
                  <Badge tone={REPLENISHMENT_META[d.status]?.tone}>{REPLENISHMENT_META[d.status]?.label || d.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">Approved {formatDate(d.approvedAt || d.createdAt)} · estimated value {formatMoney(d.estimatedValue)}</p>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {d.lines.map((l) => (
                    <li key={l.productId} className="flex justify-between gap-3 py-1.5"><span className="text-ink">{l.productName}</span><span className="tabular text-muted">{formatNumber(l.quantity)} {l.unit}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
