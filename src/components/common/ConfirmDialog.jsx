import { AlertTriangle, HelpCircle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  open, onClose, onConfirm, title = 'Are you sure?', description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  tone = 'primary', loading = false, children,
}) {
  const danger = tone === 'danger'
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      dismissible={!loading}
      title={title}
      description={description}
      size="sm"
      icon={danger ? AlertTriangle : HelpCircle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus>{confirmLabel}</Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
