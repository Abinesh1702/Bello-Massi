import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import {
  PackageX, Plus, Clock3, CheckCircle2, XCircle, Coins, CalendarDays, Tags, Boxes, Eye, Pencil, Send, Ban, Printer, FileDown, SearchX,
  ShieldCheck, ArrowLeft, History, Paperclip, Image as ImageIcon, PackageMinus, ListChecks, BarChart3,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import InfoList from '../../components/common/InfoList'
import RowActions from '../../components/common/RowActions'
import Timeline from '../../components/common/Timeline'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import SingleBarChart from '../../components/dashboard/charts/SingleBarChart'
import StackedBarChart from '../../components/dashboard/charts/StackedBarChart'
import { SERIES } from '../../components/dashboard/charts/chartTheme'
import ScrapActionDialogs, { ScrapStatusBadge, scrapActionsFor } from '../../components/scrap/ScrapActionDialogs'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { useMasterData } from '../../hooks/useMasterData'
import { useAuth } from '../../hooks/useAuth'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { can as canDo } from '../../config/permissions'
import { STORAGE_KEYS } from '../../utils/constants'
import { getAvailable } from '../../utils/stock'
import { approvalStatusOf, SCRAP_REASONS, SCRAP_STATUS, SCRAP_STATUS_META } from '../../services/scrapService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { getAuditForRecord } from '../../services/auditService'
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../../utils/formatters'

const EMPTY = []
const WRITTEN = [SCRAP_STATUS.COMPLETED]
export const useScrapRequests = () => useStoredValue(STORAGE_KEYS.SCRAP_REQUESTS, EMPTY)
const useCan = () => {
  const { user } = useAuth()
  return { user, can: (k) => canDo(user, k) }
}

const groupSum = (rows, key, val) => {
  const m = new Map()
  rows.forEach((r) => m.set(key(r), (m.get(key(r)) || 0) + val(r)))
  return [...m.entries()].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })).sort((a, b) => b.value - a.value)
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export function ScrapDashboard() {
  const list = useScrapRequests()
  const { can } = useCan()
  const written = list.filter((r) => WRITTEN.includes(r.status))
  const monthStart = dayjs().startOf('month')
  const thisMonth = list.filter((r) => !dayjs(r.requestDate).isBefore(monthStart, 'day'))
  const byReason = groupSum(list.filter((r) => r.status !== SCRAP_STATUS.CANCELLED), (r) => r.reason, () => 1)
  const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month'))
  const trend = months.map((m) => {
    const inMonth = list.filter((r) => dayjs(r.requestDate).isSame(m, 'month'))
    return {
      name: m.format('MMM'),
      written: inMonth.filter((r) => r.status === SCRAP_STATUS.COMPLETED).length,
      open: inMonth.filter((r) => [SCRAP_STATUS.PENDING_APPROVAL, SCRAP_STATUS.APPROVED, SCRAP_STATUS.DRAFT].includes(r.status)).length,
      rejected: inMonth.filter((r) => [SCRAP_STATUS.REJECTED, SCRAP_STATUS.CANCELLED].includes(r.status)).length,
    }
  })
  const pending = list.filter((r) => r.status === SCRAP_STATUS.PENDING_APPROVAL)
  const awaiting = list.filter((r) => r.status === SCRAP_STATUS.APPROVED)

  return (
    <>
      <PageHeader title="Scrap Management" description="Expired, damaged and rejected stock — requested, approved, then written off from inventory with a full audit trail."
        actions={<>
          <Button variant="secondary" icon={ListChecks} to="/inventory/scrap/requests">All requests</Button>
          <Button variant="secondary" icon={BarChart3} to="/reports/center?category=scrap">Scrap reports</Button>
          {can('scrap.create') && <Button icon={Plus} to="/inventory/scrap/requests/create">New scrap request</Button>}
        </>} />
      <StatGrid cols={4}>
        <StatCard label="Total requests" value={list.length} icon={PackageX} tone="brand" to="/inventory/scrap/requests" />
        <StatCard label="Pending approval" value={pending.length} icon={Clock3} tone="warning" to="/inventory/scrap/requests?status=PENDING_APPROVAL" hint={awaiting.length ? `${awaiting.length} approved, awaiting write-off` : undefined} />
        <StatCard label="Approved" value={list.filter((r) => [SCRAP_STATUS.APPROVED, SCRAP_STATUS.COMPLETED].includes(r.status)).length} icon={CheckCircle2} tone="success" to="/inventory/scrap/requests?approval=Approved" />
        <StatCard label="Rejected" value={list.filter((r) => r.status === SCRAP_STATUS.REJECTED).length} icon={XCircle} tone="danger" to="/inventory/scrap/requests?status=REJECTED" />
        <StatCard label="Quantity written off" value={formatNumber(written.reduce((s, r) => s + r.quantity, 0))} icon={PackageMinus} tone="neutral" hint="units across all products" />
        <StatCard label="Scrap value" value={formatCurrency(written.reduce((s, r) => s + r.value, 0))} icon={Coins} tone="danger" hint="at purchase cost" />
        <StatCard label="This month" value={thisMonth.length} icon={CalendarDays} tone="info" hint={`${thisMonth.filter((r) => r.status === SCRAP_STATUS.COMPLETED).length} written off`} />
        <StatCard label="Top reason" value={byReason[0]?.name || '—'} icon={Tags} tone="accent" hint={byReason[0] ? `${byReason[0].value} request(s)` : 'No requests yet'} />
      </StatGrid>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <StackedBarChart title="Monthly scrap trend" subtitle="Requests by month and outcome (last 6 months)" data={trend}
          series={[{ key: 'written', label: 'Written off', color: SERIES.c1 }, { key: 'open', label: 'Open', color: SERIES.c4 }, { key: 'rejected', label: 'Rejected / cancelled', color: SERIES.c5 }]} />
        <SingleBarChart title="Scrap by reason" subtitle="Number of requests (excluding cancelled)" data={byReason} seriesName="Requests" />
        <SingleBarChart title="Scrap value by product" subtitle="Written-off value, top 8" data={groupSum(written, (r) => r.productName, (r) => r.value).slice(0, 8)} valueFormatter={formatCurrency} seriesName="Value" />
        <SingleBarChart title="Scrap value by hub" subtitle="Written-off value" data={groupSum(written, (r) => r.hubName, (r) => r.value)} valueFormatter={formatCurrency} seriesName="Value" />
        <SingleBarChart title="Quantity by category" subtitle="Units written off per product category" data={groupSum(written, (r) => r.category || 'Uncategorised', (r) => r.quantity)} seriesName="Quantity" />
        <Card>
          <CardHeader title="Waiting for action" subtitle="Pending approval and approved requests not yet written off" icon={Clock3} />
          {[...pending, ...awaiting].length ? (
            <ul className="divide-y divide-line">
              {[...pending, ...awaiting].slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Link to={`/inventory/scrap/requests/${r.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-surface-2 -mx-2 px-2 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{r.scrapNumber} · {r.productName}</p>
                      <p className="text-xs text-muted truncate">{formatNumber(r.quantity)} {r.unit} · {r.hubName} · {r.reason} · {r.requestedByName}</p>
                    </div>
                    <ScrapStatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <EmptyState compact icon={CheckCircle2} title="Nothing waiting" description="No scrap requests need a decision." />}
        </Card>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Request list                                                        */
/* ------------------------------------------------------------------ */

const FILTERS = ['status', 'approval', 'reason', 'hubId', 'warehouseId', 'productId', 'requestedBy', 'from', 'to']

export function ScrapList() {
  const list = useScrapRequests()
  const { user, can } = useCan()
  const { hubs, products } = useMasterData()
  const warehouses = useStoredValue(STORAGE_KEYS.ORGANIZATION, null)?.warehouses || EMPTY
  const t = useTableQuery({ filters: FILTERS, sort: 'requestDate', dir: 'desc' })
  const [action, setAction] = useState(null)
  const requesters = useMemo(() => [...new Map(list.map((r) => [r.requestedBy, r.requestedByName])).entries()].map(([value, label]) => ({ value, label })), [list])

  const rows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const f = t.filters
    const filtered = list.filter((r) => {
      if (q && ![r.scrapNumber, r.productName, r.productCode, r.batchNumber, r.hubName, r.remarks, r.requestedByName].some((v) => String(v || '').toLowerCase().includes(q))) return false
      if (f.status && r.status !== f.status) return false
      if (f.approval && approvalStatusOf(r) !== f.approval) return false
      if (f.reason && r.reason !== f.reason) return false
      if (f.hubId && r.hubId !== f.hubId) return false
      if (f.warehouseId && r.warehouseId !== f.warehouseId) return false
      if (f.productId && r.productId !== f.productId) return false
      if (f.requestedBy && r.requestedBy !== f.requestedBy) return false
      if (f.from && r.requestDate < f.from) return false
      if (f.to && r.requestDate > f.to) return false
      return true
    })
    return sortRows(filtered, t.sort, t.dir, { requestDate: (r) => r.createdAt })
  }, [list, t.q, t.filters, t.sort, t.dir])

  const onExport = () => {
    const n = downloadCsv(csvFilename('scrap-requests'), rows, [
      { header: 'Scrap No', value: (r) => r.scrapNumber }, { header: 'Request Date', value: (r) => r.requestDate }, { header: 'Status', value: (r) => SCRAP_STATUS_META[r.status].label },
      { header: 'Approval', value: approvalStatusOf }, { header: 'Product Code', value: (r) => r.productCode }, { header: 'Product', value: (r) => r.productName },
      { header: 'Category', value: (r) => r.category }, { header: 'Batch', value: (r) => r.batchNumber }, { header: 'Hub', value: (r) => r.hubName },
      { header: 'Stock Source', value: (r) => r.stockSource }, { header: 'Quantity', value: (r) => r.quantity }, { header: 'UOM', value: (r) => r.unit },
      { header: 'Unit Cost', value: (r) => r.unitCost }, { header: 'Value', value: (r) => r.value }, { header: 'Reason', value: (r) => r.reason },
      { header: 'Requested By', value: (r) => r.requestedByName }, { header: 'Approved / Rejected By', value: (r) => r.approvedByName || r.rejectedByName || '' },
      { header: 'Write-off Movement', value: (r) => r.writeOff?.movementNumber || '' }, { header: 'Remarks', value: (r) => r.remarks },
    ])
    if (n) toast.success(`Exported ${n} scrap requests`)
  }

  const actionItems = (r) => {
    const a = scrapActionsFor(r, user, can)
    return [
      { label: 'View', icon: Eye, to: `/inventory/scrap/requests/${r.id}` },
      { label: 'Edit draft', icon: Pencil, to: `/inventory/scrap/requests/${r.id}/edit`, hidden: !a.edit },
      { label: 'Submit', icon: Send, onClick: () => setAction({ type: 'submit', record: r }), hidden: !a.submit },
      { label: 'Approve', icon: CheckCircle2, onClick: () => setAction({ type: 'approve', record: r }), hidden: !a.approve },
      { label: 'Reject', icon: XCircle, onClick: () => setAction({ type: 'reject', record: r }), hidden: !a.reject, danger: true },
      { label: 'Write off stock', icon: PackageMinus, onClick: () => setAction({ type: 'writeOff', record: r }), hidden: !a.writeOff },
      { label: 'Cancel', icon: Ban, onClick: () => setAction({ type: 'cancel', record: r }), hidden: !a.cancel, danger: true },
      { label: 'Print scrap note', icon: Printer, to: `/inventory/scrap/requests/${r.id}/print` },
    ]
  }

  return (
    <>
      <PageHeader title="Scrap Requests" description="Every scrap request with its approval and write-off status."
        actions={<>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
          {can('scrap.create') && <Button icon={Plus} to="/inventory/scrap/requests/create">New scrap request</Button>}
        </>} />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search scrap no., product, batch, hub, requester…" total={list.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={Object.entries(SCRAP_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} />
          <FilterSelect label="Approval" allLabel="Any approval" value={t.filters.approval} onChange={(v) => t.setFilter('approval', v)} options={['Not submitted', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((v) => ({ value: v, label: v }))} />
          <FilterSelect label="Reason" allLabel="All reasons" value={t.filters.reason} onChange={(v) => t.setFilter('reason', v)} options={SCRAP_REASONS.map((v) => ({ value: v, label: v }))} />
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Warehouse" allLabel="All warehouses" value={t.filters.warehouseId} onChange={(v) => t.setFilter('warehouseId', v)} options={warehouses.filter((w) => !t.filters.hubId || w.hubId === t.filters.hubId).map((w) => ({ value: w.id, label: w.name }))} />
          <FilterSelect label="Product" allLabel="All products" value={t.filters.productId} onChange={(v) => t.setFilter('productId', v)} options={products.map((p) => ({ value: p.id, label: p.name }))} />
          <FilterSelect label="Requested by" allLabel="Anyone" value={t.filters.requestedBy} onChange={(v) => t.setFilter('requestedBy', v)} options={requesters} />
          <FilterInput label="From date" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} />
          <FilterInput label="To date" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} />
        </FilterToolbar>
        <DataTable caption="Scrap requests" rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort}
          columns={[
            { key: 'scrapNumber', header: 'Scrap no.', sortable: true, render: (r) => <Link to={`/inventory/scrap/requests/${r.id}`} className="font-medium text-brand hover:underline tabular">{r.scrapNumber}</Link> },
            { key: 'requestDate', header: 'Date', sortable: true, render: (r) => <span className="tabular">{formatDate(r.requestDate)}</span> },
            { key: 'productName', header: 'Product', sortable: true, render: (r) => <div className="min-w-0"><p className="truncate max-w-[200px]">{r.productName}</p><p className="text-xs text-muted">{r.batchNumber ? `Batch ${r.batchNumber}` : r.productCode}</p></div> },
            { key: 'hubName', header: 'Hub', sortable: true, hideBelow: 'md' },
            { key: 'quantity', header: 'Qty', sortable: true, align: 'right', render: (r) => <span className="font-semibold tabular">{formatNumber(r.quantity)} <span className="text-xs text-muted font-normal">{r.unit}</span></span> },
            { key: 'value', header: 'Value', sortable: true, align: 'right', hideBelow: 'lg', render: (r) => <span className="tabular">{formatCurrency(r.value)}</span> },
            { key: 'reason', header: 'Reason', sortable: true, hideBelow: 'lg' },
            { key: 'requestedByName', header: 'Requested by', sortable: true, hideBelow: 'xl' },
            { key: 'status', header: 'Status', sortable: true, render: (r) => <ScrapStatusBadge status={r.status} /> },
            { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (r) => <RowActions items={actionItems(r)} label={`Actions for ${r.scrapNumber}`} /> },
          ]}
          empty={<EmptyState icon={SearchX} title={list.length ? 'No scrap requests match' : 'No scrap requests yet'} description={list.length ? 'Try clearing a filter.' : 'Raise a request when stock expires, is damaged or fails QA.'}
            action={can('scrap.create') && <Button icon={Plus} to="/inventory/scrap/requests/create">New scrap request</Button>} />}
        />
      </Card>
      <ScrapActionDialogs action={action} onClose={() => setAction(null)} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Detail                                                              */
/* ------------------------------------------------------------------ */

export function ScrapDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const list = useScrapRequests()
  const { user, can } = useCan()
  const { inventory, movements } = useMasterData()
  const org = useStoredValue(STORAGE_KEYS.ORGANIZATION, null)
  const auditLogs = useStoredValue(STORAGE_KEYS.AUDIT_LOGS, EMPTY)
  const [action, setAction] = useState(null)
  const [showAudit, setShowAudit] = useState(false)
  const r = list.find((x) => x.id === id)
  const audit = useMemo(() => (r ? getAuditForRecord(r.id, auditLogs) : EMPTY), [r, auditLogs])
  if (!r) return <NotFoundRecord entity="scrap request" backTo="/inventory/scrap/requests" />
  const a = scrapActionsFor(r, user, can)
  const stock = inventory.find((s) => s.productId === r.productId && s.hubId === r.hubId)
  const movement = r.writeOff ? movements.find((m) => m.id === r.writeOff.movementId) : null
  const warehouse = (org?.warehouses || []).find((w) => w.id === r.warehouseId)
  const avail = stock ? getAvailable(stock) : 0

  return (
    <>
      <PageHeader title={r.scrapNumber} description={`${r.productName} · ${formatNumber(r.quantity)} ${r.unit} · ${r.hubName}`}
        actions={<>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/inventory/scrap/requests')}>Requests</Button>
          {a.edit && <Button variant="secondary" icon={Pencil} to={`/inventory/scrap/requests/${r.id}/edit`}>Edit draft</Button>}
          {a.submit && <Button icon={Send} onClick={() => setAction({ type: 'submit', record: r })}>Submit</Button>}
          {a.approve && <Button icon={CheckCircle2} onClick={() => setAction({ type: 'approve', record: r })}>Approve</Button>}
          {a.reject && <Button variant="danger-outline" icon={XCircle} onClick={() => setAction({ type: 'reject', record: r })}>Reject</Button>}
          {a.writeOff && <Button icon={PackageMinus} onClick={() => setAction({ type: 'writeOff', record: r })}>Write off stock</Button>}
          {a.cancel && <Button variant="danger-outline" icon={Ban} onClick={() => setAction({ type: 'cancel', record: r })}>Cancel</Button>}
          <Button variant="secondary" icon={Printer} to={`/inventory/scrap/requests/${r.id}/print`}>Print scrap note</Button>
          {can('audit.view') && <Button variant="secondary" icon={ShieldCheck} onClick={() => setShowAudit((v) => !v)}>{showAudit ? 'Hide audit' : 'View audit'}</Button>}
        </>}>
        <div className="mt-3 flex flex-wrap items-center gap-2"><ScrapStatusBadge status={r.status} /><span className="text-xs text-muted">Approval: {approvalStatusOf(r)}</span></div>
      </PageHeader>
      {a.selfApproval && <p className="mb-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-muted">You raised this request, so another approver must approve or reject it.</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Request" icon={PackageX} />
            <InfoList columns={3} items={[
              { label: 'Scrap number', value: r.scrapNumber }, { label: 'Request date', value: formatDate(r.requestDate) }, { label: 'Status', value: SCRAP_STATUS_META[r.status].label },
              { label: 'Product', value: <Link className="text-brand hover:underline" to={`/products/${r.productId}`}>{r.productName}</Link> }, { label: 'Code', value: r.productCode }, { label: 'Category', value: r.category },
              { label: 'Batch', value: r.batchNumber || 'Not batch-tracked' }, { label: 'Hub', value: r.hubName }, { label: 'Warehouse', value: warehouse?.name || 'Not specified' },
              { label: 'Stock source', value: r.stockSource === 'damaged' ? 'Damaged / quarantined' : 'Available stock' }, { label: 'Quantity', value: `${formatNumber(r.quantity)} ${r.unit}` }, { label: 'Unit cost', value: formatCurrency(r.unitCost) },
              { label: 'Scrap value', value: <strong>{formatCurrency(r.value)}</strong> }, { label: 'Reason', value: r.reason }, { label: 'Requested by', value: `${r.requestedByName} · ${formatDateTime(r.createdAt)}` },
              { label: 'Remarks', value: r.remarks, span: 'full' },
            ]} />
          </Card>
          <Card>
            <CardHeader title="Photos & supporting documents" icon={Paperclip} subtitle="Stored in this browser with the request" />
            {(r.photos.length || r.documents.length) ? (
              <div className="space-y-4">
                {r.photos.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{r.photos.map((p, i) => (
                  <a key={i} href={p.dataUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-line"><img src={p.dataUrl} alt={p.name || `Photo ${i + 1}`} className="h-28 w-full object-cover" /></a>
                ))}</div>}
                {r.documents.length > 0 && <ul className="space-y-1">{r.documents.map((d, i) => (
                  <li key={i}><a href={d.dataUrl} download={d.name} className="inline-flex items-center gap-2 text-sm text-brand hover:underline"><FileDown size={14} aria-hidden />{d.name}</a></li>
                ))}</ul>}
              </div>
            ) : <EmptyState compact icon={ImageIcon} title="No photos or documents" description={r.status === SCRAP_STATUS.DRAFT ? 'Edit the draft to attach photo proof.' : 'None were attached to this request.'} />}
          </Card>
          <Card>
            <CardHeader title="Stock movement" icon={Boxes} />
            {r.writeOff ? (
              <InfoList columns={3} items={[
                { label: 'Movement', value: movement ? <Link className="text-brand hover:underline" to={`/inventory/movements?q=${encodeURIComponent(r.writeOff.movementNumber)}`}>{r.writeOff.movementNumber}</Link> : r.writeOff.movementNumber },
                { label: 'Written off', value: `${formatNumber(r.writeOff.quantity)} ${r.unit}` }, { label: 'On hand', value: `${formatNumber(r.writeOff.previousQuantity)} → ${formatNumber(r.writeOff.newQuantity)}` },
                { label: 'Posted by', value: r.writeOff.byName }, { label: 'Posted at', value: formatDateTime(r.writeOff.at) }, { label: 'Valuation impact', value: `− ${formatCurrency(r.writeOff.value ?? r.value)}` },
              ]} />
            ) : (
              <div className="text-sm text-muted space-y-1">
                <p>No stock has been written off for this request{r.status === SCRAP_STATUS.APPROVED ? ' yet — an approver can post the write-off now.' : '.'}</p>
                {stock && <p>Current stock at {r.hubName}: <span className="text-ink tabular">{formatNumber(avail)} {r.unit} available</span>, <span className="text-ink tabular">{formatNumber(stock.damagedQuantity || 0)} damaged</span>, <span className="text-ink tabular">{formatNumber(stock.totalQuantity)} on hand</span>.</p>}
              </div>
            )}
          </Card>
          {showAudit && (
            <Card>
              <CardHeader title="Audit trail" icon={ShieldCheck} subtitle="Changes recorded in the audit log" />
              {audit.length ? <ul className="divide-y divide-line text-sm">{audit.map((l) => (
                <li key={l.id} className="py-2"><p className="text-ink">{l.description || l.action}</p><p className="text-xs text-muted">{l.userName || 'System'} · {formatDateTime(l.at)}</p></li>
              ))}</ul> : <EmptyState compact title="No audit entries yet" description="Seeded demo requests were created before auditing; new actions appear here." />}
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Approval" icon={ShieldCheck} />
            <InfoList columns={1} items={[
              { label: 'Approval status', value: approvalStatusOf(r) },
              { label: 'Approved by', value: r.approvedByName ? `${r.approvedByName} · ${formatDateTime(r.approvedAt)}` : '', hidden: !r.approvedBy },
              { label: 'Approval remarks', value: r.approvalRemarks, hidden: !r.approvedBy },
              { label: 'Rejected by', value: r.rejectedByName ? `${r.rejectedByName} · ${formatDateTime(r.rejectedAt)}` : '', hidden: !r.rejectedBy },
              { label: 'Rejection reason', value: r.rejectionReason, hidden: !r.rejectedBy },
              { label: 'Cancelled', value: r.cancelledAt ? `${formatDateTime(r.cancelledAt)}${r.cancelReason ? ` — ${r.cancelReason}` : ''}` : '', hidden: !r.cancelledAt },
            ]} />
          </Card>
          <Card>
            <CardHeader title="History" icon={History} />
            <Timeline items={[...r.history].reverse().map((h) => ({ id: h.id, title: `${h.action} — ${h.byName}`, description: h.note, at: h.at }))} />
          </Card>
        </div>
      </div>
      <ScrapActionDialogs action={action} onClose={() => setAction(null)} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Printable scrap note                                                */
/* ------------------------------------------------------------------ */

export function ScrapPrint() {
  const { id } = useParams()
  const list = useScrapRequests()
  const company = useStoredValue(STORAGE_KEYS.COMPANY, null)
  const [printedAt] = useState(() => new Date().toISOString())
  const r = list.find((x) => x.id === id)
  if (!r) return <NotFoundRecord entity="scrap request" backTo="/inventory/scrap/requests" />
  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" icon={ArrowLeft} to={`/inventory/scrap/requests/${r.id}`}>Back to request</Button>
        <Button icon={Printer} onClick={() => window.print()}>Print</Button>
      </div>
      <Card className="mx-auto max-w-3xl print-area">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-lg font-semibold text-ink">{company?.name || 'Bellomassi'}</p>
            <p className="text-xs text-muted">{[company?.addressLine1, company?.city, company?.country].filter(Boolean).join(', ')}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-ink">Scrap Note</p>
            <p className="text-sm tabular">{r.scrapNumber}</p>
            <p className="text-xs text-muted">{formatDate(r.requestDate)}</p>
          </div>
        </div>
        <div className="py-4"><InfoList columns={3} items={[
          { label: 'Status', value: SCRAP_STATUS_META[r.status].label }, { label: 'Hub', value: r.hubName }, { label: 'Reason', value: r.reason },
          { label: 'Requested by', value: r.requestedByName }, { label: 'Approved by', value: r.approvedByName || (r.rejectedByName ? `Rejected by ${r.rejectedByName}` : 'Not approved') },
          { label: 'Write-off movement', value: r.writeOff?.movementNumber || 'Not written off' },
        ]} /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-y border-line text-left text-xs text-muted"><th className="py-2 pr-3">Product</th><th className="py-2 pr-3">Batch</th><th className="py-2 pr-3 text-right">Qty</th><th className="py-2 pr-3 text-right">Unit cost</th><th className="py-2 text-right">Value</th></tr></thead>
            <tbody><tr className="border-b border-line"><td className="py-2 pr-3">{r.productName}<p className="text-xs text-muted">{r.productCode} · {r.category}</p></td><td className="py-2 pr-3">{r.batchNumber || '—'}</td><td className="py-2 pr-3 text-right tabular">{formatNumber(r.quantity)} {r.unit}</td><td className="py-2 pr-3 text-right tabular">{formatCurrency(r.unitCost)}</td><td className="py-2 text-right font-semibold tabular">{formatCurrency(r.value)}</td></tr></tbody>
          </table>
        </div>
        {r.remarks && <p className="mt-4 text-sm"><span className="text-muted">Remarks: </span>{r.remarks}</p>}
        <div className="mt-10 grid grid-cols-2 gap-8 text-xs text-muted">
          <div className="border-t border-line pt-2">Requested by — {r.requestedByName}</div>
          <div className="border-t border-line pt-2">Approved by — {r.approvedByName || '________________'}</div>
        </div>
        <p className="mt-6 text-[11px] text-muted">Generated by the Bellomassi prototype on {formatDateTime(printedAt)}.</p>
      </Card>
    </>
  )
}
