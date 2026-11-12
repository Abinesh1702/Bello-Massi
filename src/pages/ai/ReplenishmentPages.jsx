import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, ClipboardList, PackageCheck, PackagePlus, Plus, Send, Trash2, X, XCircle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import Timeline from '../../components/common/Timeline'
import { InfoNote, ReplenishmentStatusBadge } from '../../components/ai/AiBadges'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { usePhase6Data } from '../../hooks/usePhase6Data'
import { approveDraft, cancelDraft, convertDraft, createDraft, effectiveDraftStatus, receiptLink, receiptProgress, rejectDraft, submitDraft, updateDraft } from '../../services/ai/replenishmentService'
import { REPLENISHMENT_STATUS as S } from '../../config/aiConfig'
import { formatDateTime, formatMoney, formatNumber } from '../../utils/formatters'

export default function ReplenishmentList() {
  const d = usePhase6Data()
  const canCreate = usePermission('inventory.replenishment.create')
  const [tab, setTab] = useState('open')
  const rows = useMemo(() => d.drafts.map((x) => ({ ...x, eff: effectiveDraftStatus(x, d.receipts) })).filter((x) => (tab === 'open' ? [S.DRAFT, S.SUBMITTED, S.APPROVED, S.CONVERTED].includes(x.eff) : tab === 'done' ? [S.RECEIVED, S.REJECTED, S.CANCELLED].includes(x.eff) : true)), [d.drafts, d.receipts, tab])
  return (
    <>
      <PageHeader title="Replenishment" description="Drafts created from AI reorder recommendations or by hand. Draft → submitted → approved → goods receipt. Only posted stock receipts change stock."
        actions={<>
          <Button variant="secondary" icon={PackagePlus} to="/ai/predictive-inventory/reorder">Reorder recommendations</Button>
          {canCreate && <Button icon={Plus} to="/ai/replenishment/create">New draft</Button>}
        </>} />
      <Card>
        <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ id: 'open', label: 'In progress' }, { id: 'done', label: 'Closed' }, { id: 'all', label: 'All' }]} />
        <DataTable rows={rows} dense pageSize={15} empty={<EmptyState compact icon={ClipboardList} title="No replenishment drafts" description={canCreate ? 'Create one from the reorder recommendations.' : undefined} />}
          columns={[
            { key: 'n', header: 'Draft', render: (x) => <Link to={`/ai/replenishment/${x.id}`} className="font-medium text-brand hover:underline tabular">{x.number}</Link> },
            { key: 'h', header: 'Destination hub', render: (x) => d.lk.hubs[x.hubId]?.name || '—' },
            { key: 's', header: 'Supplier', hideBelow: 'md', render: (x) => x.supplierName },
            { key: 'l', header: 'Lines', align: 'right', render: (x) => x.lines.length },
            { key: 'v', header: 'Est. value', align: 'right', hideBelow: 'sm', render: (x) => formatMoney(x.estimatedValue) },
            { key: 'st', header: 'Status', render: (x) => <ReplenishmentStatusBadge status={x.eff} /> },
            { key: 'c', header: 'Created', hideBelow: 'lg', render: (x) => <span className="text-xs text-muted">{x.createdByName} · {formatDateTime(x.createdAt)}</span> },
          ]} />
      </Card>
    </>
  )
}

function LinesEditor({ lines, setLines, products, errors }) {
  const opts = products.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <div key={l.key} className="grid items-start gap-2 sm:grid-cols-[1fr_120px_auto]">
          <Select label={i === 0 ? 'Product' : undefined} aria-label={`Product line ${i + 1}`} value={l.productId} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))} options={opts} placeholder="Select a product" error={errors[`lines.${i}.productId`]} />
          <div>
            {i === 0 && <span className="mb-1.5 block text-sm font-medium text-ink">Quantity</span>}
            <input type="number" min={0} aria-label={`Quantity line ${i + 1}`} value={l.quantity} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} className={`h-10 w-full rounded-lg border bg-surface px-3 text-sm tabular ${errors[`lines.${i}.quantity`] ? 'border-danger' : 'border-line'}`} />
            {errors[`lines.${i}.quantity`] && <p className="mt-1 text-xs text-danger">{errors[`lines.${i}.quantity`]}</p>}
          </div>
          <div className={i === 0 ? 'sm:pt-7' : ''}><Button variant="ghost" size="sm" icon={X} aria-label={`Remove line ${i + 1}`} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} disabled={lines.length <= 1} /></div>
        </div>
      ))}
      {errors.lines && <p className="text-xs text-danger">{errors.lines}</p>}
      <Button size="sm" variant="secondary" icon={Plus} onClick={() => setLines((ls) => [...ls, { key: Date.now(), productId: '', quantity: '' }])}>Add product</Button>
    </div>
  )
}

export function ReplenishmentCreate() {
  const d = usePhase6Data()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [hubId, setHubId] = useState(params.get('hubId') || '')
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([{ key: 1, productId: params.get('productId') || '', quantity: '' }])
  const [errors, setErrors] = useState({})
  const products = d.products.filter((p) => p.status === 'Active' && p.trackInventory !== false).sort((a, b) => a.name.localeCompare(b.name))
  const save = (e) => {
    e.preventDefault()
    const r = createDraft({ hubId, supplierId, notes, source: 'manual', lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) })
    setErrors(r.errors || {})
    if (!r.ok) return toast.error(r.error)
    if (r.warnings?.length) toast.warning(r.warnings.join(' '))
    toast.success(`Draft ${r.record.number} created`)
    return navigate(`/ai/replenishment/${r.record.id}`)
  }
  return (
    <>
      <PageHeader title="New replenishment draft" description="A draft does not change stock. Submit it for approval when ready." />
      <Card className="max-w-3xl">
        <form className="space-y-4" onSubmit={save} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Destination hub" required value={hubId} onChange={(e) => setHubId(e.target.value)} options={d.hubs.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: h.name }))} placeholder="Select a hub" error={errors.hubId} />
            <Select label="Supplier" required value={supplierId} onChange={(e) => setSupplierId(e.target.value)} options={d.forecastSettings.suppliers.map((s) => ({ value: s.id, label: `${s.name} · ${s.leadTimeDays} d lead time` }))} placeholder="Select a supplier" error={errors.supplierId} />
          </div>
          <LinesEditor lines={lines} setLines={setLines} products={products} errors={errors} />
          <Textarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} error={errors.notes} />
          <div className="flex gap-2"><Button type="submit" icon={PackagePlus}>Create draft</Button><Button variant="ghost" to="/ai/replenishment">Cancel</Button></div>
        </form>
      </Card>
    </>
  )
}

export function ReplenishmentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const d = usePhase6Data()
  const canCreate = usePermission('inventory.replenishment.create')
  const canManage = usePermission('inventory.predictions.manage')
  const canApprove = usePermission('procurement.approve')
  const canRejectDraft = usePermission('procurement.reject')
  const canReceive = usePermission('inventory.receipts.manage')
  const draft = d.lk.drafts[id]
  const [edit, setEdit] = useState(null)
  const [errors, setErrors] = useState({})
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState(null)
  if (!draft) return <NotFoundRecord entity="replenishment draft" backTo="/ai/replenishment" backLabel="Replenishment" />
  const progress = receiptProgress(draft, d.receipts)
  const status = effectiveDraftStatus(draft, d.receipts)
  const owner = draft.createdBy === user.id || canManage
  const act = (fn, msg) => { const r = fn(); if (!r.ok) { toast.error(r.error); return false } toast.success(msg); return true }
  const products = d.products.filter((p) => p.status === 'Active' && p.trackInventory !== false)
  const startEdit = () => setEdit(draft.lines.map((l, i) => ({ key: i, productId: l.productId, quantity: l.quantity, recommendationId: l.recommendationId, recommendedQty: l.recommendedQty })))
  const saveEdit = () => {
    const r = updateDraft(draft.id, { lines: edit.map((l) => ({ productId: l.productId, quantity: l.quantity, recommendationId: l.recommendationId || null, recommendedQty: l.recommendedQty || null })) })
    setErrors(r.errors || {})
    if (!r.ok) return toast.error(r.error)
    if (r.warnings?.length) toast.warning(r.warnings.join(' '))
    setEdit(null)
    return toast.success('Draft updated')
  }
  return (
    <>
      <PageHeader title={draft.number} description={`${d.lk.hubs[draft.hubId]?.name} · ${draft.supplierName} · lead time ${draft.leadTimeDays} days · ${formatMoney(draft.estimatedValue)}`}
        actions={<>
          {status === S.DRAFT && owner && !edit && <Button variant="secondary" onClick={startEdit}>Edit quantities</Button>}
          {status === S.DRAFT && canCreate && !edit && <Button icon={Send} onClick={() => setConfirm('submit')}>Submit for approval</Button>}
          {status === S.SUBMITTED && canApprove && <Button icon={CheckCircle2} onClick={() => setConfirm('approve')}>Approve</Button>}
          {status === S.SUBMITTED && canRejectDraft && <Button variant="danger-outline" icon={XCircle} onClick={() => { setReason(''); setRejecting(true) }}>Reject</Button>}
          {status === S.APPROVED && canApprove && <Button icon={PackageCheck} onClick={() => setConfirm('convert')}>Send to procurement</Button>}
          {draft.requisitionId && <Button variant="secondary" to={`/procurement/requisitions/${draft.requisitionId}`}>Requisition {draft.requisitionNumber}</Button>}
          {[S.DRAFT, S.SUBMITTED, S.APPROVED].includes(status) && owner && <Button variant="ghost" icon={Trash2} onClick={() => setConfirm('cancel')}>Cancel</Button>}
        </>}>
        <div className="flex flex-wrap items-center gap-2"><ReplenishmentStatusBadge status={status} />{draft.source === 'ai' && <span className="text-xs text-muted">From AI reorder recommendations</span>}</div>
      </PageHeader>
      <InfoNote className="mb-4">Stock has not changed. {draft.requisitionId
        ? (status === S.RECEIVED ? `All lines were received on the purchase order of requisition ${draft.requisitionNumber}.` : `Sent to procurement as requisition ${draft.requisitionNumber}. Buying and receiving follow the procurement flow (approval → RFQ / PO → goods receipt); progress below comes from its purchase order.`)
        : status === S.CONVERTED ? 'Post a Stock Receipt for each line when goods arrive — receipts referencing this number update the progress below.' : status === S.RECEIVED ? 'All lines have been received.' : 'After approval, send the draft to procurement: a purchase requisition with these lines is raised for approval and buying.'}</InfoNote>
      {draft.rejectionReason && <p className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">Rejected: {draft.rejectionReason}</p>}
      {draft.warnings?.length > 0 && <ul className="mb-4 space-y-1 text-xs text-warning">{draft.warnings.map((w) => <li key={w}>⚠ <span className="text-ink">{w}</span></li>)}</ul>}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Lines" icon={ClipboardList} />
          {edit ? (
            <div className="space-y-3"><LinesEditor lines={edit} setLines={setEdit} products={products} errors={errors} /><div className="flex gap-2"><Button onClick={saveEdit}>Save</Button><Button variant="ghost" onClick={() => { setEdit(null); setErrors({}) }}>Cancel</Button></div></div>
          ) : (
            <DataTable rows={progress.lines.map((l) => ({ ...l, id: l.productId }))} dense columns={[
              { key: 'p', header: 'Product', render: (l) => <div><Link to={`/products/${l.productId}`} className="font-medium text-brand hover:underline">{l.productName}</Link><p className="text-xs text-muted">{l.productCode}</p></div> },
              { key: 'r', header: 'Recommended', align: 'right', hideBelow: 'sm', render: (l) => (l.recommendedQty ? formatNumber(l.recommendedQty) : '—') },
              { key: 'q', header: 'Quantity', align: 'right', render: (l) => <span className="font-semibold tabular">{formatNumber(l.quantity)} <span className="text-xs font-normal text-muted">{l.unit}</span></span> },
              { key: 'c', header: 'Value', align: 'right', hideBelow: 'md', render: (l) => formatMoney(l.quantity * l.unitCost) },
              { key: 'rc', header: 'Received', align: 'right', render: (l) => <span className="tabular">{formatNumber(l.received)} / {formatNumber(l.quantity)}</span> },
              { key: 'a', header: <span className="sr-only">Actions</span>, render: (l) => (draft.requisitionId
                ? (l.receipts.length ? <span className="text-xs text-muted">PO {l.receipts.map((r) => r.number).join(', ')}</span> : status === S.CONVERTED ? <span className="text-xs text-muted">Awaiting purchase order</span> : null)
                : status === S.CONVERTED && l.outstanding > 0 ? (canReceive ? <Button size="xs" variant="secondary" icon={PackageCheck} to={receiptLink(draft, l)}>Record receipt</Button> : <span className="text-xs text-muted">Awaiting receipt</span>) : l.receipts.length ? <span className="text-xs text-muted">{l.receipts.map((r) => r.number).join(', ')}</span> : null) },
            ]} />
          )}
          {draft.notes && <p className="mt-3 text-sm text-muted">Notes: {draft.notes}</p>}
        </Card>
        <Card>
          <CardHeader title="History" />
          <Timeline items={(draft.history || []).slice().reverse().map((h, i) => ({ id: `${h.at}-${i}`, title: h.action, description: [h.byName, h.note].filter(Boolean).join(' · '), at: h.at, tone: h.action === 'Rejected' || h.action === 'Cancelled' ? 'danger' : h.action === 'Approved' ? 'success' : 'brand' }))} />
        </Card>
      </div>
      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} tone={confirm === 'cancel' ? 'danger' : 'primary'}
        title={{ submit: 'Submit for approval?', approve: `Approve ${draft.number}?`, convert: 'Send to procurement?', cancel: `Cancel ${draft.number}?` }[confirm] || ''}
        description={{ submit: 'An Administrator will be notified to approve it.', approve: 'Approval accepts the proposal; Procurement then approves and places the purchase. Stock changes only when goods are received.', convert: 'A purchase requisition with these lines is created and submitted for approval. Buying and receiving then follow the procurement flow.', cancel: 'Linked recommendations become open again.' }[confirm] || ''}
        confirmLabel={{ submit: 'Submit', approve: 'Approve', convert: 'Send to procurement', cancel: 'Cancel draft' }[confirm] || 'Confirm'} cancelLabel="Back"
        onConfirm={() => {
          const map = { submit: [() => submitDraft(draft.id), 'Submitted for approval'], approve: [() => approveDraft(draft.id), 'Approved'], convert: [() => convertDraft(draft.id), 'Purchase requisition raised for approval'], cancel: [() => cancelDraft(draft.id), 'Cancelled'] }
          act(...map[confirm])
          setConfirm(null)
        }} />
      <Modal open={rejecting} onClose={() => setRejecting(false)} title={`Reject ${draft.number}`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setRejecting(false)}>Back</Button><Button variant="danger" onClick={() => { if (act(() => rejectDraft(draft.id, reason), 'Rejected')) setRejecting(false) }}>Reject</Button></>}>
        <Textarea label="Reason" required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-autofocus />
      </Modal>
    </>
  )
}

