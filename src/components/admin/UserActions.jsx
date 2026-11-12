import { useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Copy } from 'lucide-react'
import ConfirmDialog from '../common/ConfirmDialog'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { deleteUser, resetUserPassword, setUserStatus, unlockUser } from '../../services/userService'

/**
 * Shared confirm flows for user actions (list and detail pages).
 * const ua = useUserActions(); ua.ask('status' | 'reset' | 'delete' | 'unlock', user); render {ua.dialogs}
 */
export function useUserActions({ onDeleted } = {}) {
  const [pending, setPending] = useState(null) // { kind, user }
  const [temp, setTemp] = useState(null) // { user, password, mustChangePassword }

  const close = () => setPending(null)
  const run = () => {
    const { kind, user } = pending
    let res
    if (kind === 'status') res = setUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')
    if (kind === 'reset') res = resetUserPassword(user.id)
    if (kind === 'delete') res = deleteUser(user.id)
    if (kind === 'unlock') res = unlockUser(user.id)
    setPending(null)
    if (!res.ok) return toast.error(res.error)
    if (kind === 'status') toast.success(`${user.name} ${user.status === 'active' ? 'deactivated' : 'activated'}`)
    if (kind === 'reset') setTemp({ user, password: res.password, mustChangePassword: res.mustChangePassword })
    if (kind === 'delete') { toast.success(`${user.name} deleted`); onDeleted?.(user) }
    if (kind === 'unlock') toast.success(`${user.name} unlocked`)
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(temp.password); toast.success('Copied') } catch { toast.error('Copy is not available — select the password instead.') }
  }

  const k = pending?.kind
  const u = pending?.user
  const dialogs = (
    <>
      <ConfirmDialog
        open={Boolean(pending)}
        onClose={close}
        onConfirm={run}
        tone={k === 'delete' || (k === 'status' && u?.status === 'active') ? 'danger' : 'primary'}
        confirmLabel={{ status: u?.status === 'active' ? 'Deactivate' : 'Activate', reset: 'Reset password', delete: 'Delete user', unlock: 'Unlock' }[k] || 'Confirm'}
        title={{ status: `${u?.status === 'active' ? 'Deactivate' : 'Activate'} ${u?.name}?`, reset: `Reset ${u?.name}'s demo password?`, delete: `Delete ${u?.name}?`, unlock: `Unlock ${u?.name}?` }[k]}
        description={{
          status: u?.status === 'active' ? 'Inactive users cannot sign in. Their records and history are kept.' : 'The user can sign in again with their current password.',
          reset: 'A temporary demo password is generated and shown once. The user must choose a new password at the next sign-in (Security settings).',
          delete: 'Users linked to orders, customers or a driver record cannot be deleted — deactivate them instead. This cannot be undone.',
          unlock: 'Clears the failed sign-in counter so the user can try again immediately.',
        }[k]}
      />
      <Modal open={Boolean(temp)} onClose={() => setTemp(null)} title="Temporary demo password" icon={KeyRound} size="sm"
        footer={<Button onClick={() => setTemp(null)}>Done</Button>}>
        <p className="text-sm text-muted">Share this with {temp?.user.name}. It is shown only once.</p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-base font-semibold tracking-wide text-ink" data-testid="temp-password">{temp?.password}</code>
          <Button variant="secondary" size="sm" icon={Copy} onClick={copy}>Copy</Button>
        </div>
        {temp?.mustChangePassword && <p className="mt-3 text-xs text-muted">They will be asked to choose a new password after signing in.</p>}
        <p className="mt-2 text-xs text-muted">Prototype: passwords are stored as a demo fingerprint in this browser — not real password security.</p>
      </Modal>
    </>
  )
  return { ask: (kind, user) => setPending({ kind, user }), dialogs }
}
