import { useMemo, useState } from 'react'
import { Wallet, AlertTriangle, Gauge, Ban, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import InfoList from '../../components/common/InfoList'
import Badge from '../../components/common/Badge'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { CreditBadge, VipBadge } from '../../components/masterdata/Badges'
import { useMasterData } from '../../hooks/useMasterData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { getCreditInfo, getVipStatus, searchCustomers, VIP_TONE } from '../../services/customerService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { CREDIT_NEAR_THRESHOLD, CREDIT_STATUS, OPTIONS } from '../../config/masterData'
import { formatCompactCurrency, formatCurrency, formatDate, formatPercent } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

/** Credit configuration overview. Finance can view it; only Admin edits (via the customer form). */
export default function CustomerCredit() {
  const { customers, salesReps, lookups } = useMasterData()
  const canEdit = usePermission('customers.manage')
  const canOpenCustomer = usePermission('customers.view')
  const t = useTableQuery({ filters: ['creditStatus', 'salesRepId', 'status'], sort: 'utilisation', dir: 'desc' })
  const [selected, setSelected] = useState(null)

  const withCredit = useMemo(() => customers.map((c) => ({ ...c, credit: getCreditInfo(c) })), [customers])
  const filtered = useMemo(() => searchCustomers(t.q, t.filters, withCredit), [withCredit, t.q, t.filters])
  const rows = useMemo(() => sortRows(filtered, t.sort, t.dir, {
    limit: (c) => c.credit.limit, balance: (c) => c.credit.balance, available: (c) => c.credit.available,
    utilisation: (c) => (c.credit.enabled ? c.credit.utilisation : -1), days: (c) => c.credit.days, creditStatus: (c) => c.credit.status,
  }), [filtered, t.sort, t.dir])

  const enabled = withCredit.filter((c) => c.credit.enabled)
  const exposure = enabled.reduce((s, c) => s + c.credit.balance, 0)
  const limits = enabled.reduce((s, c) => s + c.credit.limit, 0)
  const count = (st) => withCredit.filter((c) => c.credit.status === st).length

  const onExport = () => {
    const n = downloadCsv(csvFilename('customer-credit'), rows, [
      { header: 'Customer Code', value: (c) => c.code },
      { header: 'Customer Name', value: (c) => c.name },
      { header: 'Status', value: (c) => c.status },
      { header: 'Credit Enabled', value: (c) => c.credit.enabled },
      { header: 'Credit Limit (INR)', value: (c) => c.credit.limit },
      { header: 'Current Balance (INR)', value: (c) => c.credit.balance },
      { header: 'Available Credit (INR)', value: (c) => c.credit.available },
      { header: 'Utilisation %', value: (c) => c.credit.utilisation.toFixed(1) },
      { header: 'Credit Days', value: (c) => c.credit.days },
      { header: 'Credit Status', value: (c) => c.credit.status },
      { header: 'Salesman', value: (c) => lookups.people[c.salesRepId]?.name || '' },
    ])
    toast.success(`Exported ${n} rows`)
  }

  const columns = [
    { key: 'name', header: 'Customer', sortable: true, render: (c) => (<div><p className="font-medium text-ink">{c.name}</p><p className="text-xs text-muted tabular">{c.code} · {c.status}</p></div>) },
    { key: 'limit', header: 'Limit', align: 'right', sortable: true, hideBelow: 'sm', render: (c) => (c.credit.enabled ? formatCompactCurrency(c.credit.limit) : '—') },
    { key: 'balance', header: 'Balance', align: 'right', sortable: true, render: (c) => (c.credit.enabled ? formatCompactCurrency(c.credit.balance) : '—') },
    { key: 'available', header: 'Available', align: 'right', sortable: true, hideBelow: 'md', render: (c) => (c.credit.enabled ? <span className={c.credit.available < 0 ? 'text-danger font-medium' : ''}>{formatCompactCurrency(c.credit.available)}</span> : '—') },
    {
      key: 'utilisation', header: 'Utilisation', sortable: true, hideBelow: 'lg',
      render: (c) => (c.credit.enabled ? (
        <div className="flex items-center gap-2 min-w-[130px]">
          <div className="h-1.5 flex-1 min-w-12 rounded-full bg-surface-2 overflow-hidden" aria-hidden>
            <div className={cn('h-full rounded-full', c.credit.utilisation > 100 ? 'bg-danger' : c.credit.utilisation >= CREDIT_NEAR_THRESHOLD ? 'bg-warning' : 'bg-[var(--chart-1)]')} style={{ width: `${Math.min(100, c.credit.utilisation)}%` }} />
          </div>
          <span className="w-11 text-right text-xs font-medium tabular">{formatPercent(c.credit.utilisation)}</span>
        </div>
      ) : <span className="text-muted text-xs">—</span>),
    },
    { key: 'days', header: 'Days', align: 'right', sortable: true, hideBelow: 'xl', render: (c) => (c.credit.enabled ? c.credit.days : '—') },
    { key: 'creditStatus', header: 'Status', sortable: true, render: (c) => <CreditBadge status={c.credit.status} /> },
  ]

  return (
    <>
      <PageHeader title="Customer credit" description={`Credit limits, balances and status. Near limit at ${CREDIT_NEAR_THRESHOLD}% utilisation.`} />
      <StatGrid cols={4}>
        <StatCard label="Credit exposure" value={formatCompactCurrency(exposure)} icon={Wallet} tone="brand" hint={`of ${formatCompactCurrency(limits)} in limits`} />
        <StatCard label="Limit exceeded" value={count(CREDIT_STATUS.EXCEEDED)} icon={AlertTriangle} tone="danger" to={`/customers/credit?creditStatus=${encodeURIComponent(CREDIT_STATUS.EXCEEDED)}`} hint="Filter list" />
        <StatCard label="Near limit" value={count(CREDIT_STATUS.NEAR)} icon={Gauge} tone="warning" to={`/customers/credit?creditStatus=${encodeURIComponent(CREDIT_STATUS.NEAR)}`} hint="Filter list" />
        <StatCard label="Credit disabled" value={count(CREDIT_STATUS.DISABLED)} icon={Ban} tone="neutral" to={`/customers/credit?creditStatus=${encodeURIComponent(CREDIT_STATUS.DISABLED)}`} hint="Cash customers" />
      </StatGrid>
      <Card className="mt-6">
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search customer, code, city…" total={customers.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Credit status" allLabel="All credit statuses" value={t.filters.creditStatus} onChange={(v) => t.setFilter('creditStatus', v)} options={OPTIONS.creditStatuses} />
          <FilterSelect label="Customer status" allLabel="All customers" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={OPTIONS.customerStatuses} />
          <FilterSelect label="Salesman" allLabel="All salesmen" value={t.filters.salesRepId} onChange={(v) => t.setFilter('salesRepId', v)} options={salesReps.map((r) => ({ value: r.id, label: r.name }))} />
        </FilterToolbar>
        <DataTable columns={columns} rows={rows} pageSize={10} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort}
          onRowClick={setSelected} empty={<EmptyState compact title="No customers match" action={<Button variant="secondary" onClick={t.reset}>Clear filters</Button>} />} />
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || ''}
        description={selected ? `${selected.code} · credit and VIP configuration` : ''}
        size="md"
        footer={
          <>
            {canOpenCustomer && selected && <Button variant="secondary" to={`/customers/${selected.id}`}>Open customer</Button>}
            {canEdit && selected && <Button icon={Pencil} to={`/customers/${selected.id}/edit`}>Edit configuration</Button>}
            {!canOpenCustomer && <Button onClick={() => setSelected(null)}>Close</Button>}
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2"><CreditBadge status={selected.credit.status} /><VipBadge customer={selected} showDisabled /></div>
            <InfoList items={[
              { label: 'Credit enabled', value: selected.credit.enabled ? 'Yes' : 'No' },
              { label: 'Credit days', value: selected.credit.enabled ? `${selected.credit.days} days` : '—' },
              { label: 'Credit limit', value: formatCurrency(selected.credit.limit) },
              { label: 'Current balance', value: formatCurrency(selected.credit.balance) },
              { label: 'Available credit', value: formatCurrency(selected.credit.available) },
              { label: 'Utilisation', value: selected.credit.enabled ? formatPercent(selected.credit.utilisation, 1) : '—' },
              { label: 'VIP pass', value: selected.isVip ? (selected.vipPassEnabled ? selected.vipPassNumber : 'Disabled') : 'Not VIP' },
              { label: 'VIP expiry', value: selected.vipPassExpiry ? <span>{formatDate(selected.vipPassExpiry)} <Badge tone={VIP_TONE[getVipStatus(selected)]}>{getVipStatus(selected)}</Badge></span> : '—' },
            ]} />
            {!canEdit && <p className="text-xs text-muted">View only. Credit configuration is changed by an administrator.</p>}
          </div>
        )}
      </Modal>
    </>
  )
}
