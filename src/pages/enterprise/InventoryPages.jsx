import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ScanBarcode, ShieldCheck, ShieldAlert, Ban, PauseCircle, GitBranch, Star } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import Textarea from '../../components/common/Textarea'
import DataTable from '../../components/common/DataTable'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import { KpiGrid, SimpleTable, useStoreTick } from '../../components/enterprise/ui'
import { QA_STATUS, expiryBand, isBlocked, isExpired, daysToExpiry, pickingRule, reconcile, setBatchStatus, traceBatches } from '../../services/enterprise/batchService'
import { supplierScore } from '../../services/enterprise/procurementService'
import { read } from '../../services/enterprise/recordService'
import { getSuppliers } from '../../services/supplierService'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../config/permissions'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { formatDate, formatDateTime, formatMoney, formatNumber } from '../../utils/formatters'
import { downloadCsv } from '../../services/csvService'

const ACTIONS = [
  { status: 'QA_HOLD', label: 'Put on QA hold', icon: PauseCircle, perm: 'qa.inspection.manage', tone: 'secondary' },
  { status: 'QUARANTINE', label: 'Quarantine', icon: ShieldAlert, perm: 'qa.inspection.manage', tone: 'secondary' },
  { status: 'AVAILABLE', label: 'Release', icon: ShieldCheck, perm: 'qa.release', tone: 'primary' },
  { status: 'REJECTED', label: 'Reject', icon: Ban, perm: 'qa.reject', tone: 'danger' },
]

/** Lot-level stock: batch, expiry, bin and QA status on top of the single stock ledger, with FEFO order and traceability. */
export function BatchesPage() {
  useStoreTick()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState(new Set())
  const [action, setAction] = useState(null)
  const [reason, setReason] = useState('')
  const [trace, setTrace] = useState(null)
  const [page, setPage] = useState(0)
  const f = { q: params.get('q') || '', hub: params.get('hub') || '', product: params.get('product') || '', qa: params.get('qa') || '', expiry: params.get('expiry') || '', location: params.get('location') || '' }
  const set = (k, v) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }); setPage(0) }
  const P = Object.fromEntries(read(K.PRODUCTS).map((p) => [p.id, p]))
  const H = Object.fromEntries(read(K.HUBS).map((h) => [h.id, h]))
  const L = Object.fromEntries(read(K.WAREHOUSE_LOCATIONS).map((l) => [l.id, l]))
  const lots = read(K.BATCHES).filter((b) => b.quantity > 0)
  const rows = useMemo(() => lots.filter((b) => {
    if (f.hub && b.hubId !== f.hub) return false
    if (f.product && b.productId !== f.product) return false
    if (f.location && b.locationId !== f.location) return false
    if (f.qa === 'blocked' && !isBlocked(b)) return false
    if (f.qa && f.qa !== 'blocked' && b.qaStatus !== f.qa) return false
    if (f.expiry === 'expired' && !isExpired(b)) return false
    if (['7', '30', '90'].includes(f.expiry) && !(b.expiryDate && daysToExpiry(b) <= Number(f.expiry))) return false
    if (f.q && !`${b.batchNumber} ${b.lotNumber} ${b.grnNumber || ''} ${b.supplierBatch || ''} ${P[b.productId]?.name || ''} ${b.sourceMovement || ''}`.toLowerCase().includes(f.q.toLowerCase())) return false
    return true
  }).sort((a, b) => String(a.expiryDate || '9999').localeCompare(b.expiryDate || '9999')), [lots, f.q, f.hub, f.product, f.qa, f.expiry, f.location, P])
  const mismatches = reconcile()
  const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const run = () => {
    const res = setBatchStatus([...selected], action.status, { reason: reason.trim(), user })
    if (!res.ok) { toast.error(res.error); return }
    toast.success(`${res.count} lot(s) → ${QA_STATUS[action.status].label}`)
    setSelected(new Set()); setAction(null); setReason('')
  }
  const cols = [
    { key: 'sel', header: '', render: (b) => <input type="checkbox" aria-label={`Select ${b.batchNumber}`} className="h-4 w-4 accent-[#232B5F]" checked={selected.has(b.id)} onChange={() => toggle(b.id)} onClick={(e) => e.stopPropagation()} /> },
    { key: 'batchNumber', header: 'Batch / lot', render: (b) => <span className="font-medium text-ink">{b.batchNumber}<span className="block text-xs text-muted">{b.lotNumber || b.supplierBatch || ''}</span></span> },
    { key: 'product', header: 'Product', render: (b) => P[b.productId]?.name || b.productId },
    { key: 'hub', header: 'Hub · bin', render: (b) => <>{H[b.hubId]?.name?.replace(/ Hub$/, '')}<span className="block text-xs text-muted">{L[b.locationId]?.code || 'Not put away'}</span></> },
    { key: 'quantity', header: 'Qty', align: 'right', render: (b) => <span className="tabular">{formatNumber(b.quantity)} {P[b.productId]?.unit}</span> },
    { key: 'expiry', header: 'Expiry', render: (b) => { const e = expiryBand(b); return <span>{b.expiryDate ? formatDate(b.expiryDate) : '—'} <Badge tone={e.tone}>{e.label}</Badge></span> } },
    { key: 'qa', header: 'QA status', render: (b) => <Badge tone={isExpired(b) ? 'danger' : QA_STATUS[b.qaStatus]?.tone} dot>{isExpired(b) ? 'Expired — blocked' : QA_STATUS[b.qaStatus]?.label}</Badge> },
    { key: 'source', header: 'Source', hideBelow: 'lg', render: (b) => <span className="text-xs">{b.grnNumber || b.sourceMovement}</span> },
  ]
  const onExport = () => downloadCsv('batches', rows.map((b) => ({ batch: b.batchNumber, lot: b.lotNumber, product: P[b.productId]?.name, hub: H[b.hubId]?.name, bin: L[b.locationId]?.code || '', quantity: b.quantity, expiry: b.expiryDate || '', qa: isExpired(b) ? 'EXPIRED' : b.qaStatus, grn: b.grnNumber || '' })), ['batch', 'lot', 'product', 'hub', 'bin', 'quantity', 'expiry', 'qa', 'grn'].map((k) => ({ key: k, header: k })))
  const blockedQty = lots.filter((b) => isBlocked(b)).reduce((s, b) => s + b.quantity, 0)
  return (
    <div data-testid="batches-page">
      <PageHeader title="Batches & Expiry" description={`Lot detail on top of the stock ledger (quantities always equal hub stock). Picking order: ${pickingRule()}. QA-held, quarantined, rejected and expired lots are excluded from available stock everywhere.`} />
      <KpiGrid items={[
        { label: 'Lots in stock', value: lots.length, icon: ScanBarcode },
        { label: 'Blocked lots', value: lots.filter((b) => isBlocked(b)).length, tone: 'warning', hint: `${formatNumber(blockedQty)} units not sellable` },
        { label: 'Expired', value: lots.filter((b) => isExpired(b)).length, tone: 'danger' },
        { label: 'Expiring ≤ 30 days', value: lots.filter((b) => !isExpired(b) && b.expiryDate && daysToExpiry(b) <= 30).length, tone: 'warning' },
      ]} />
      {mismatches.length > 0 && <p className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{mismatches.length} product × hub line(s) differ between lots and hub stock — run a cycle count to reconcile.</p>}
      <Card>
        <FilterToolbar query={f.q} onQuery={(v) => set('q', v)} placeholder="Search batch, lot, GRN or product…" total={lots.length} filteredCount={rows.length} activeCount={[f.hub, f.product, f.qa, f.expiry, f.location].filter(Boolean).length} onReset={() => { setParams({}, { replace: true }); setSelected(new Set()) }} onExport={can(user, 'data.export') ? onExport : undefined}>
          <FilterSelect label="Hub" value={f.hub} onChange={(v) => set('hub', v)} allLabel="All hubs" options={Object.values(H).map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Product" value={f.product} onChange={(v) => set('product', v)} allLabel="All products" options={Object.values(P).filter((p) => p.trackInventory).map((p) => ({ value: p.id, label: p.name }))} />
          <FilterSelect label="QA status" value={f.qa} onChange={(v) => set('qa', v)} allLabel="Any QA status" options={[{ value: 'blocked', label: 'Blocked (any reason)' }, ...Object.entries(QA_STATUS).map(([value, m]) => ({ value, label: m.label }))]} />
          <FilterSelect label="Expiry" value={f.expiry} onChange={(v) => set('expiry', v)} allLabel="Any expiry" options={[{ value: 'expired', label: 'Expired' }, { value: '7', label: '≤ 7 days' }, { value: '30', label: '≤ 30 days' }, { value: '90', label: '≤ 90 days' }]} />
        </FilterToolbar>
        {selected.size > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 px-3 py-2" data-testid="batch-bulk">
            <span className="text-sm font-medium text-ink">{selected.size} selected</span>
            {ACTIONS.filter((a) => can(user, a.perm)).map((a) => <Button key={a.status} size="xs" variant={a.tone} icon={a.icon} onClick={() => setAction(a)}>{a.label}</Button>)}
            <Button size="xs" variant="secondary" icon={GitBranch} onClick={() => setTrace([...selected])}>Trace</Button>
            <Button size="xs" variant="secondary" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}
        <DataTable columns={cols} rows={rows} onRowClick={(b) => setTrace([b.id])} page={page} onPageChange={setPage} pageSize={25} caption="Lots" />
      </Card>
      {action && (
        <Modal open onClose={() => setAction(null)} title={`${action.label} — ${selected.size} lot(s)`} description="The change is recorded on each lot's QA history and in the audit log. Blocked lots are subtracted from available stock immediately."
          footer={<><Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button><Button variant={action.tone === 'danger' ? 'danger' : 'primary'} onClick={run} data-testid="confirm-batch-action">{action.label}</Button></>}>
          <Textarea label={action.status === 'AVAILABLE' ? 'Release reason (required)' : 'Reason'} value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required={action.status === 'AVAILABLE'} />
        </Modal>
      )}
      {trace && <TraceModal ids={trace} onClose={() => setTrace(null)} P={P} H={H} />}
    </div>
  )
}

function TraceModal({ ids, onClose, P, H }) {
  const lots = read(K.BATCHES).filter((b) => ids.includes(b.id))
  const affected = traceBatches(ids)
  const customers = Object.fromEntries(read(K.CUSTOMERS).map((c) => [c.id, c.name]))
  const one = lots.length === 1 ? lots[0] : null
  return (
    <Modal open onClose={onClose} size="xl" title={one ? `Lot ${one.batchNumber}` : `Traceability — ${lots.length} lots`} description="Forward traceability from the stock ledger: which documents and customers received stock from these lots.">
      {one && (
        <dl className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[['Product', P[one.productId]?.name], ['Hub', H[one.hubId]?.name], ['Quantity left', `${one.quantity} of ${one.receivedQuantity}`], ['Expiry', one.expiryDate ? formatDate(one.expiryDate) : '—'], ['Mfg date', one.mfgDate ? formatDate(one.mfgDate) : '—'], ['Supplier batch', one.supplierBatch || '—'], ['Origin', one.originCountry || '—'], ['Received', `${formatDateTime(one.receivedAt)} · ${one.grnNumber || one.sourceMovement}`]].map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="text-ink">{v}</dd></div>)}
        </dl>
      )}
      <p className="mb-2 text-sm font-semibold text-ink">Orders / customers supplied</p>
      <SimpleTable columns={[{ key: 'orderNumber', header: 'Document' }, { key: 'customerId', header: 'Customer', render: (r) => customers[r.customerId] || '—' }, { key: 'quantity', header: 'Qty', align: 'right' }, { key: 'batches', header: 'Lots', render: (r) => r.batches.join(', ') }]} rows={affected} rowTo={(r) => (r.customerId ? `/orders/${r.orderId}` : null)} empty="No stock from these lots has gone to a customer yet." />
      {one && (
        <>
          <p className="mb-2 mt-4 text-sm font-semibold text-ink">Movement history</p>
          <SimpleTable columns={[{ key: 'at', header: 'When', render: (c) => formatDateTime(c.at) }, { key: 'type', header: 'Movement' }, { key: 'movementNumber', header: 'Ledger no.' }, { key: 'qty', header: 'Qty', align: 'right', render: (c) => (c.qty < 0 ? `+${-c.qty}` : `−${c.qty}`) }]} rows={[...(one.consumption || [])].reverse()} empty="No movements since receipt." />
          {(one.qaHistory || []).length > 0 && (
            <>
              <p className="mb-2 mt-4 text-sm font-semibold text-ink">QA history</p>
              <SimpleTable columns={[{ key: 'at', header: 'When', render: (h) => formatDateTime(h.at) }, { key: 'to', header: 'Status', render: (h) => QA_STATUS[h.to]?.label || h.to }, { key: 'by', header: 'By' }, { key: 'reason', header: 'Reason' }]} rows={[...one.qaHistory].reverse()} />
            </>
          )}
        </>
      )}
    </Modal>
  )
}

/** Supplier scorecards from POs, goods receipts and NCRs. */
export function SupplierPerformance() {
  useStoreTick()
  const rows = getSuppliers().map((s) => ({ ...supplierScore(s.id), id: s.id, name: s.name, leadTimeDays: s.leadTimeDays }))
  return (
    <div>
      <PageHeader title="Supplier Performance" description="On-time delivery (GRN date vs PO expected date), quality acceptance (received − rejected), non-conformances and spend — calculated from procurement and QA records." />
      <KpiGrid items={[
        { label: 'Suppliers', value: rows.length, icon: Star, to: '/suppliers' },
        { label: 'Spend (open + received POs)', value: formatMoney(rows.reduce((s, r) => s + r.value, 0)), to: '/procurement/purchase-orders' },
        { label: 'Receipts evaluated', value: rows.reduce((s, r) => s + r.receipts, 0), to: '/warehouse/receiving?status=POSTED' },
        { label: 'Supplier NCRs', value: rows.reduce((s, r) => s + r.ncrs, 0), to: '/qa/ncr', tone: 'warning' },
      ]} />
      <Card>
        <CardHeader title="Scorecard" subtitle="Score = 50 % on-time + 40 % quality + 10 % NCR-free (blank until there is receiving history)" />
        <SimpleTable columns={[
          { key: 'name', header: 'Supplier' }, { key: 'orders', header: 'POs', align: 'right' }, { key: 'value', header: 'Spend', align: 'right', render: (r) => formatMoney(r.value) },
          { key: 'receipts', header: 'GRNs', align: 'right' }, { key: 'onTimePct', header: 'On time', align: 'right', render: (r) => (r.onTimePct === null ? '—' : `${r.onTimePct}%`) },
          { key: 'qualityPct', header: 'Quality', align: 'right', render: (r) => (r.qualityPct === null ? '—' : `${r.qualityPct}%`) }, { key: 'ncrs', header: 'NCRs', align: 'right' },
          { key: 'leadTimeDays', header: 'Lead time', align: 'right', render: (r) => `${r.leadTimeDays} d` }, { key: 'score', header: 'Score', align: 'right', render: (r) => (r.score === null ? '—' : <Badge tone={r.score >= 85 ? 'success' : r.score >= 70 ? 'warning' : 'danger'}>{r.score}</Badge>) },
        ]} rows={rows} rowTo={(r) => `/procurement/purchase-orders?supplierId=${r.id}`} />
      </Card>
    </div>
  )
}
