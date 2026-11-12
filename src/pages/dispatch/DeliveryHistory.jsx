import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, ClipboardCheck, FileText, CheckCircle2, AlertTriangle, PackageCheck } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { DeliveryStatusBadge, OtpStatusBadge } from '../../components/dispatch/DispatchBadges'
import { ReviewDeliveryDialog } from '../../components/dispatch/DispatchDialogs'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { usePermission } from '../../hooks/usePermission'
import { searchDeliveries } from '../../services/deliveryService'
import { searchDeliveryNotes } from '../../services/deliveryNoteService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { DELIVERY_STATUS_META, DISPATCH_OPTIONS } from '../../config/dispatchConfig'
import { formatDateTime, formatNumber } from '../../utils/formatters'

const CLOSED = ['DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED', 'RETURNED']

export default function DeliveryHistory() {
  const navigate = useNavigate()
  const { deliveries, dispatches, notes, hubs, drivers, lk } = useDispatchData()
  const canReview = usePermission('dispatch.manage')
  const t = useTableQuery({ filters: ['tab', 'from', 'to', 'hubId', 'driverId', 'status'], sort: 'closedAt', dir: 'desc' })
  const tab = t.filters.tab || 'deliveries'
  const [reviewing, setReviewing] = useState(null)

  const closed = useMemo(() => deliveries.filter((d) => CLOSED.includes(d.status)).map((d) => ({ ...d, closedAt: d.completedAt || d.failedAt || d.updatedAt })), [deliveries])
  const review = closed.filter((d) => d.reviewStatus === 'PENDING')
  const base = tab === 'review' ? review : closed
  const filteredDel = useMemo(() => searchDeliveries(t.q, { ...t.filters, from: '', to: '' }, base, { dispatches }).filter((d) => (!t.filters.from || d.closedAt.slice(0, 10) >= t.filters.from) && (!t.filters.to || d.closedAt.slice(0, 10) <= t.filters.to)), [base, t.q, t.filters, dispatches])
  const delRows = useMemo(() => sortRows(filteredDel, t.sort, t.dir), [filteredDel, t.sort, t.dir])
  const noteRows = useMemo(() => sortRows(searchDeliveryNotes(t.q, t.filters, notes), t.sort === 'closedAt' ? 'deliveryDate' : t.sort, t.dir), [notes, t.q, t.filters, t.sort, t.dir])

  const onExport = () => {
    if (tab === 'notes') {
      const n = downloadCsv(csvFilename('delivery-notes'), noteRows, [
        { header: 'Delivery Note Number', value: (x) => x.noteNumber }, { header: 'Order Number', value: (x) => x.orderNumber }, { header: 'Dispatch Number', value: (x) => x.dispatchNumber },
        { header: 'Customer', value: (x) => x.customerName }, { header: 'Delivery Date', value: (x) => x.deliveryDate }, { header: 'Driver', value: (x) => x.driverName }, { header: 'Vehicle', value: (x) => x.vehicleNumber },
        { header: 'Hub', value: (x) => x.hubName }, { header: 'Delivered Qty', value: (x) => x.totalDelivered }, { header: 'Remaining Qty', value: (x) => x.totalRemaining }, { header: 'Damaged Qty', value: (x) => x.totalDamaged },
        { header: 'Status', value: (x) => DELIVERY_STATUS_META[x.deliveryStatus]?.label }, { header: 'OTP', value: (x) => x.otpStatus }, { header: 'Received By', value: (x) => x.customerAcknowledgement },
      ])
      toast.success(`Exported ${n} delivery notes`)
      return
    }
    const n = downloadCsv(csvFilename(tab === 'review' ? 'deliveries-to-review' : 'delivery-history'), delRows, [
      { header: 'Order Number', value: (d) => d.orderNumber }, { header: 'Customer', value: (d) => d.customerName }, { header: 'Dispatch Number', value: (d) => d.dispatchNumber },
      { header: 'Driver', value: (d) => lk.dispatches[d.dispatchId]?.driverName || '' }, { header: 'Status', value: (d) => DELIVERY_STATUS_META[d.status]?.label }, { header: 'Closed At', value: (d) => d.closedAt },
      { header: 'Delivered Qty', value: (d) => d.items.reduce((s, i) => s + i.deliveredQuantity, 0) }, { header: 'Remaining Qty', value: (d) => d.items.reduce((s, i) => s + i.remainingQuantity, 0) },
      { header: 'Damaged Qty', value: (d) => d.items.reduce((s, i) => s + i.damagedQuantity, 0) }, { header: 'Failure Reason', value: (d) => d.failureReason }, { header: 'Remarks', value: (d) => d.failureRemarks || d.remarks },
      { header: 'Review', value: (d) => d.reviewStatus || '' }, { header: 'Returned To Hub', value: (d) => (d.returnedToHub ? 'Yes' : 'No') }, { header: 'Delivery Note', value: (d) => d.deliveryNoteNumber || '' },
    ])
    toast.success(`Exported ${n} deliveries`)
  }

  const delColumns = [
    { key: 'orderNumber', header: 'Order / customer', sortable: true, render: (d) => (<div><p className="font-medium tabular whitespace-nowrap">{d.orderNumber}</p><p className="text-xs text-muted truncate max-w-[200px]">{d.customerName}</p></div>) },
    { key: 'dispatchNumber', header: 'Dispatch · driver', sortable: true, hideBelow: 'md', render: (d) => (<div><p className="text-xs tabular whitespace-nowrap">{d.dispatchNumber}</p><p className="text-xs text-muted">{lk.dispatches[d.dispatchId]?.driverName}</p></div>) },
    { key: 'qty', header: 'Delivered / dispatched', align: 'right', hideBelow: 'sm', render: (d) => <span className="tabular whitespace-nowrap">{formatNumber(d.items.reduce((s, i) => s + i.deliveredQuantity, 0))} / {formatNumber(d.items.reduce((s, i) => s + i.dispatchedQuantity, 0))}</span> },
    { key: 'reason', header: 'Outcome', hideBelow: 'lg', render: (d) => <span className="text-xs">{d.failureReason || (d.deliveryNoteNumber ? `Note ${d.deliveryNoteNumber}` : '—')}{d.reviewStatus === 'REVIEWED' ? ' · reviewed' : ''}{d.returnedToHub ? ' · returned to hub' : ''}</span> },
    { key: 'closedAt', header: 'Closed', sortable: true, hideBelow: 'md', render: (d) => <span className="text-xs whitespace-nowrap">{formatDateTime(d.closedAt)}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (d) => <DeliveryStatusBadge status={d.status} /> },
    ...(tab === 'review' && canReview ? [{ key: 'act', header: <span className="sr-only">Review</span>, align: 'right', render: (d) => <Button size="xs" variant="accent" icon={ClipboardCheck} onClick={(e) => { e.stopPropagation(); setReviewing(d.id) }}>Review</Button> }] : []),
  ]
  const noteColumns = [
    { key: 'noteNumber', header: 'Delivery note', sortable: true, render: (n) => (<div><p className="font-medium tabular whitespace-nowrap">{n.noteNumber}</p><p className="text-xs text-muted tabular">{n.orderNumber}</p></div>) },
    { key: 'customerName', header: 'Customer', sortable: true, render: (n) => <span className="block max-w-[200px] truncate">{n.customerName}</span> },
    { key: 'driverName', header: 'Driver', sortable: true, hideBelow: 'lg', render: (n) => n.driverName },
    { key: 'qty', header: 'Delivered', align: 'right', hideBelow: 'sm', render: (n) => <span className="tabular">{formatNumber(n.totalDelivered)}{n.totalRemaining ? ` (+${formatNumber(n.totalRemaining)} remaining)` : ''}</span> },
    { key: 'deliveryDate', header: 'Date', sortable: true, hideBelow: 'md', render: (n) => <span className="text-xs whitespace-nowrap">{formatDateTime(n.deliveryDate)}</span> },
    { key: 'otp', header: 'OTP', hideBelow: 'xl', render: (n) => <OtpStatusBadge status={n.otpStatus === 'Verified' ? 'VERIFIED' : 'NONE'} /> },
    { key: 'deliveryStatus', header: 'Status', render: (n) => <DeliveryStatusBadge status={n.deliveryStatus} /> },
  ]
  const rv = reviewing && deliveries.find((d) => d.id === reviewing)
  return (
    <>
      <PageHeader title="Delivery history" description="Closed deliveries, exceptions waiting for Dispatcher review, and the delivery note register." />
      <StatGrid cols={4}>
        <StatCard label="Delivered" value={closed.filter((d) => d.status === 'DELIVERED').length} icon={CheckCircle2} tone="success" />
        <StatCard label="Partial" value={closed.filter((d) => d.status === 'PARTIALLY_DELIVERED').length} icon={PackageCheck} tone="warning" />
        <StatCard label="Failed / returned" value={closed.filter((d) => ['FAILED', 'RETURNED'].includes(d.status)).length} icon={AlertTriangle} tone="danger" />
        <StatCard label="Needs review" value={review.length} icon={ClipboardCheck} tone="accent" to="/dispatch/delivery-history?tab=review" />
      </StatGrid>
      <Card className="mt-6">
        <Tabs value={tab} onChange={(v) => t.setFilter('tab', v === 'deliveries' ? '' : v)} className="mb-4" tabs={[
          { id: 'deliveries', label: `Closed deliveries (${closed.length})`, icon: History },
          { id: 'review', label: `Needs review (${review.length})`, icon: ClipboardCheck },
          { id: 'notes', label: `Delivery notes (${notes.length})`, icon: FileText },
        ]} />
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder={tab === 'notes' ? 'Search note, order, customer, driver…' : 'Search order, customer, dispatch…'} total={tab === 'notes' ? notes.length : base.length} filteredCount={tab === 'notes' ? noteRows.length : delRows.length} activeCount={t.activeFilterCount - (t.filters.tab ? 1 : 0)} onReset={() => { t.reset(); if (tab !== 'deliveries') t.setFilter('tab', tab) }} onExport={onExport}>
          <FilterInput label="From" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} title="Closed from" />
          <FilterInput label="To" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} title="Closed to" />
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Driver" allLabel="All drivers" value={t.filters.driverId} onChange={(v) => t.setFilter('driverId', v)} options={drivers.map((d) => ({ value: d.id, label: d.name }))} />
          <FilterSelect label="Status" allLabel="Any status" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={DISPATCH_OPTIONS.deliveryStatuses.filter((o) => CLOSED.includes(o.value))} />
        </FilterToolbar>
        {tab === 'notes'
          ? <DataTable caption="Delivery notes" columns={noteColumns} rows={noteRows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort} onRowClick={(n) => navigate(`/dispatch/delivery-notes/${n.id}`)} empty={<EmptyState icon={FileText} title="No delivery notes match" />} />
          : <DataTable caption="Deliveries" columns={delColumns} rows={delRows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort} onRowClick={(d) => navigate(`/dispatch/deliveries/${d.id}`)} empty={<EmptyState icon={History} title={tab === 'review' ? 'No exceptions waiting for review' : 'No deliveries match'} />} />}
      </Card>
      {rv && <ReviewDeliveryDialog key={rv.id} delivery={rv} open onClose={() => setReviewing(null)} />}
    </>
  )
}
