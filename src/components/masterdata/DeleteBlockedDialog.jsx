import { Ban } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'

/** Explains why a record cannot be deleted and offers the safe alternative. */
export default function DeleteBlockedDialog({ open, onClose, title, reasons = [], suggestion, actionLabel, onAction }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={Ban}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {onAction && <Button onClick={() => { onAction(); onClose() }} data-autofocus>{actionLabel}</Button>}
        </>
      }
    >
      <ul className="space-y-1.5 text-sm text-ink list-disc pl-5">
        {reasons.map((r) => <li key={r}>{r}</li>)}
      </ul>
      {suggestion && <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-muted">{suggestion}</p>}
    </Modal>
  )
}
