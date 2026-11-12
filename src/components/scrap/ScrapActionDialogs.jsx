import { useState } from 'react'
import { toast } from 'sonner'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Textarea from '../common/Textarea'
import Checkbox from '../common/Checkbox'
import Badge from '../common/Badge'
import { approveScrap, cancelScrap, rejectScrap, SCRAP_STATUS, SCRAP_STATUS_META, submitScrap, writeOffScrap } from '../../services/scrapService'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export function ScrapStatusBadge({ status }) {
  const m = SCRAP_STATUS_META[status] || { label: status, tone: 'neutral' }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

/** Which workflow actions the user may take on a request (UI hint — the service re-checks everything). */
export const scrapActionsFor = (r, user, can) => {
  const mine = r.requestedBy === user?.id
  return {
    edit: r.status === SCRAP_STATUS.DRAFT && can('scrap.create') && (mine || can('scrap.approve')),
    submit: r.status === SCRAP_STATUS.DRAFT && can('scrap.create'),
    approve: r.status === SCRAP_STATUS.PENDING_APPROVAL && can('scrap.approve') && !mine,
    reject: r.status === SCRAP_STATUS.PENDING_APPROVAL && can('scrap.reject') && !mine,
    writeOff: r.status === SCRAP_STATUS.APPROVED && !r.writeOff && can('scrap.approve'),
    cancel: [SCRAP_STATUS.DRAFT, SCRAP_STATUS.PENDING_APPROVAL, SCRAP_STATUS.APPROVED].includes(r.status) && (can('scrap.approve') || (mine && can('scrap.create'))),
    selfApproval: r.status === SCRAP_STATUS.PENDING_APPROVAL && mine && can('scrap.approve'),
  }
}

/**
 * One dialog host for submit / approve / reject / write-off / cancel.
 * action: { type, record } | null
 */
export default function ScrapActionDialogs({ action, onClose, onDone }) {
  const [remarks, setRemarks] = useState('')
  const [writeNow, setWriteNow] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const r = action?.record
  const type = action?.type
  const close = () => { setRemarks(''); setError(''); setWriteNow(true); onClose() }

  const run = () => {
    setBusy(true)
    let res
    if (type === 'submit') res = submitScrap(r.id)
    else if (type === 'approve') res = approveScrap(r.id, { remarks, writeOffNow: writeNow })
    else if (type === 'reject') res = rejectScrap(r.id, { reason: remarks })
    else if (type === 'writeOff') res = writeOffScrap(r.id)
    else if (type === 'cancel') res = cancelScrap(r.id, { reason: remarks })
    setBusy(false)
    if (!res?.ok) { setError(res?.error || 'Action failed.'); return }
    const msg = {
      submit: `${r.scrapNumber} submitted for approval`,
      approve: res.record?.status === SCRAP_STATUS.COMPLETED ? `${r.scrapNumber} approved and written off` : `${r.scrapNumber} approved`,
      reject: `${r.scrapNumber} rejected`, writeOff: `${r.scrapNumber} written off`, cancel: `${r.scrapNumber} cancelled`,
    }[type]
    toast.success(msg, { description: res.movement || res.record?.writeOff ? `Stock movement ${res.record?.writeOff?.movementNumber} posted · ${formatNumber(res.record?.writeOff?.quantity)} ${r.unit} removed` : undefined })
    if (res.writeOffError) toast.error('Approved, but the stock write-off failed', { description: res.writeOffError })
    close()
    onDone?.(res.record)
  }

  if (!r) return null
  const title = { submit: 'Submit for approval', approve: 'Approve scrap request', reject: 'Reject scrap request', writeOff: 'Post stock write-off', cancel: 'Cancel scrap request' }[type]
  const confirm = { submit: 'Submit', approve: writeNow ? 'Approve & write off' : 'Approve', reject: 'Reject', writeOff: 'Write off stock', cancel: 'Cancel request' }[type]
  return (
    <Modal open={Boolean(action)} onClose={busy ? undefined : close} title={title} description={`${r.scrapNumber} · ${r.productName} · ${r.hubName}`} size="md"
      footer={<><Button variant="secondary" onClick={close} disabled={busy}>Close</Button><Button variant={['reject', 'cancel'].includes(type) ? 'danger' : 'primary'} onClick={run} loading={busy}>{confirm}</Button></>}>
      <div className="space-y-4">
        <div className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
          <p><span className="text-muted">Quantity:</span> <strong className="tabular">{formatNumber(r.quantity)} {r.unit}</strong> from {r.stockSource === 'damaged' ? 'damaged / quarantined' : 'available'} stock</p>
          <p><span className="text-muted">Value:</span> <strong className="tabular">{formatCurrency(r.value)}</strong> · <span className="text-muted">Reason:</span> {r.reason}</p>
        </div>
        {(type === 'approve' || type === 'writeOff') && (
          <p className="text-sm text-muted">Writing off reduces the on-hand stock at {r.hubName} by {formatNumber(r.quantity)} {r.unit} and records a “Scrap Write-off” stock movement. It can only happen once per request.</p>
        )}
        {type === 'approve' && <Checkbox label="Post the stock write-off now" description="Untick to approve only; an approver can post the write-off later." checked={writeNow} onChange={(e) => setWriteNow(e.target.checked)} />}
        {['approve', 'reject', 'cancel'].includes(type) && (
          <Textarea label={type === 'reject' ? 'Rejection reason' : type === 'cancel' ? 'Reason for cancelling' : 'Approval remarks'} required={type === 'reject'} rows={3} value={remarks} onChange={(e) => { setRemarks(e.target.value); setError('') }} maxLength={300} />
        )}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
