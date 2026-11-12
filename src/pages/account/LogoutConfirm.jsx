import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Avatar from '../../components/common/Avatar'
import { useAuth } from '../../hooks/useAuth'
import { useSignOutNow } from '../../hooks/useSignOut'
import { getRoleLabel } from '../../config/roles'
import { getSessionInfo } from '../../services/authService'
import { formatDateTime } from '../../utils/formatters'

/** Logout confirmation. Cancel returns to the previous page. */
export default function LogoutConfirm() {
  const { user, remember } = useAuth()
  const navigate = useNavigate()
  const signOutNow = useSignOutNow()
  const session = getSessionInfo()
  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="text-center">
        <div className="flex flex-col items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger dark:bg-danger/100/15"><LogOut size={22} aria-hidden /></span>
          <h1 className="mt-4 text-xl font-semibold text-ink">Sign out?</h1>
          <p className="mt-1 text-sm text-muted">You will need to sign in again to use Bellomassi on this browser.</p>
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-line px-4 py-3 text-left">
            <Avatar name={user.name} color={user.avatarColor} image={user.avatarImage} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">{getRoleLabel(user.role)} · signed in {formatDateTime(session?.startedAt)}</p>
              {remember && <p className="text-xs text-muted">“Keep me signed in” is on for this browser.</p>}
            </div>
          </div>
          <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/dashboard'))}>Cancel</Button>
            <Button variant="danger" icon={LogOut} onClick={() => signOutNow('manual')} data-autofocus>Sign out</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
