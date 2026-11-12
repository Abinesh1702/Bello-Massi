import { useState } from 'react'
import { toast } from 'sonner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import DeleteBlockedDialog from '../components/masterdata/DeleteBlockedDialog'

/**
 * Shared delete UX: blocked records explain why and offer a safe alternative;
 * deletable records require confirmation.
 *   const del = useDeleteFlow({ entity: 'customer', getBlockers, remove, onDeleted, alternative })
 *   del.request(record); …; {del.dialogs}
 */
const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export function useDeleteFlow({ entity, getBlockers, remove, onDeleted, alternative, formatReason = capitalise }) {
  const [target, setTarget] = useState(null)
  const [blocked, setBlocked] = useState(null)
  const [busy, setBusy] = useState(false)

  const request = (record) => {
    const reasons = getBlockers(record.id).map((b) => (typeof b === 'string' ? b : b.text))
    if (reasons.length) setBlocked({ record, reasons })
    else setTarget(record)
  }

  const confirm = () => {
    setBusy(true)
    const res = remove(target.id)
    setBusy(false)
    if (!res.ok) {
      toast.error(res.error)
      setTarget(null)
      return
    }
    toast.success(`${target.name} deleted`)
    const deleted = target
    setTarget(null)
    onDeleted?.(deleted)
  }

  const dialogs = (
    <>
      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={confirm}
        loading={busy}
        tone="danger"
        title={`Delete ${entity}?`}
        description={target ? `${target.name} will be permanently removed. This cannot be undone.` : ''}
        confirmLabel={`Delete ${entity}`}
      />
      <DeleteBlockedDialog
        open={Boolean(blocked)}
        onClose={() => setBlocked(null)}
        title={blocked ? `${blocked.record.name} can’t be deleted` : ''}
        reasons={blocked?.reasons.map(formatReason) || []}
        suggestion={alternative?.suggestion}
        actionLabel={alternative?.label}
        onAction={blocked && alternative?.run ? () => alternative.run(blocked.record) : undefined}
      />
    </>
  )
  return { request, dialogs }
}

export default useDeleteFlow
