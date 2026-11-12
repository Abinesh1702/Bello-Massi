import { useState } from 'react'
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Select from '../common/Select'
import Textarea from '../common/Textarea'
import Checkbox from '../common/Checkbox'
import { approveOrder, getApprovalChecks, rejectOrder, returnOrderForCorrection } from '../../services/approvalService'
import { ORDER_OPTIONS } from '../../config/orderConfig'
import { formatMoney } from '../../utils/formatters'
import { getApprovalConfig } from '../../config/runtimeConfig'

const CONFIG = {
  approve: { title: 'Approve order', icon: CheckCircle2, cta: 'Approve order', tone: 'primary' },
  reject: { title: 'Reject order', icon: XCircle, cta: 'Reject order', tone: 'danger' },
  return: { title: 'Return for correction', icon: RotateCcw, cta: 'Return to salesman', tone: 'primary' },
}

/**
 * One dialog for all three decisions. Reject and return require a reason and remarks.
 * Approving with credit/stock warnings requires an explicit acknowledgement.
 */
export default function DecisionDialog({ order, kind, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')
  const [ack, setAck] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  if (!order || !kind) return null
  const cfg = CONFIG[kind]
  const warnings = kind === 'approve' ? getApprovalChecks(order).filter((c) => !c.ok) : []
  const blocking = warnings.filter((c) => c.severity === 'block')
  const soft = warnings.filter((c) => c.severity === 'warn')

  const submit = () => {
    if (busy) return
    setBusy(true)
    const res = kind === 'approve'
      ? approveOrder(order.id, { remarks, acknowledgeWarnings: ack })
      : kind === 'reject'
        ? rejectOrder(order.id, { reason, remarks })
        : returnOrderForCorrection(order.id, { reason, remarks })
    setBusy(false)
    if (!res.ok) {
      setErrors(res.errors || {})
      if (res.error && !res.errors?.reason && !res.errors?.remarks && !res.errors?.acknowledge) toast.error(res.error)
      return
    }
    const msg = { approve: 'approved', reject: 'rejected', return: 'returned for correction' }[kind]
    toast.success(`${res.record.orderNumber} ${msg}`, { description: kind === 'approve' ? 'Salesman and Customer Service have been notified.' : 'The salesman has been notified.' })
    onDone?.(res.record)
    onClose()
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      dismissible={!busy}
      title={`${cfg.title} · ${order.orderNumber}`}
      description={`${order.customerName} · ${formatMoney(order.totalAmount)} · ${order.salesmanName}`}
      icon={cfg.icon}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={cfg.tone === 'danger' ? 'danger' : 'primary'} onClick={submit} loading={busy} disabled={blocking.length > 0}>{cfg.cta}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {kind === 'approve' && blocking.length > 0 && (
          <div className="rounded-lg bg-danger/10 px-3 py-2.5 text-sm text-danger" role="alert">
            This order cannot be approved: {blocking.map((b) => b.detail).join(' ')} Return it for correction or reject it.
          </div>
        )}
        {kind !== 'approve' && (
          <Select
            label={kind === 'reject' ? 'Rejection reason' : 'Correction reason'}
            required
            placeholder="Select a reason"
            value={reason}
            onChange={(e) => { setReason(e.target.value); setErrors((x) => ({ ...x, reason: undefined })) }}
            error={errors.reason}
            options={kind === 'reject' ? ORDER_OPTIONS.rejectionReasons : ORDER_OPTIONS.returnReasons}
          />
        )}
        <Textarea
          label={kind === 'approve' ? (getApprovalConfig().requireApprovalRemarks ? 'Approval remarks' : 'Approval remarks (optional)') : 'Remarks'}
          required={kind !== 'approve'}
          rows={3}
          maxLength={500}
          value={remarks}
          onChange={(e) => { setRemarks(e.target.value); setErrors((x) => ({ ...x, remarks: undefined })) }}
          error={errors.remarks}
          placeholder={kind === 'return' ? 'Tell the salesman exactly what to change' : kind === 'reject' ? 'Explain why the order is rejected' : 'e.g. Approved — collect cheque on delivery'}
          data-autofocus
        />
        {kind === 'approve' && soft.length > 0 && blocking.length === 0 && (
          <div className="rounded-lg border border-warning/50 bg-warning/5 p-3">
            <ul className="mb-2 list-disc pl-5 text-sm text-ink space-y-1">{soft.map((w) => <li key={w.key}><strong>{w.label}:</strong> {w.detail}</li>)}</ul>
            <Checkbox label="I have reviewed these warnings and approve the order anyway" checked={ack} onChange={(e) => { setAck(e.target.checked); setErrors((x) => ({ ...x, acknowledge: undefined })) }} />
            {errors.acknowledge && <p className="mt-1 text-xs text-danger" role="alert">{errors.acknowledge}</p>}
          </div>
        )}
        {kind === 'approve' && <p className="text-xs text-muted">Approval does not deduct stock or post credit — those happen in later workflow steps.</p>}
      </div>
    </Modal>
  )
}
