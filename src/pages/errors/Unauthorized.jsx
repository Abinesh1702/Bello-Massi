import { useLocation } from 'react-router-dom'
import { LayoutDashboard, ShieldAlert } from 'lucide-react'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { findNavItemByPath, itemPermissions } from '../../config/navigation'
import { PERMISSION_BY_KEY } from '../../config/rbacCatalog'
import { landingPathFor } from '../../services/rbacService'
import { getRoleLabel } from '../../config/roles'

export default function Unauthorized() {
  const { user } = useAuth()
  const { state } = useLocation()
  const target = state?.from ? findNavItemByPath(state.from) : null
  return (
    <div className="min-h-[60vh] grid place-items-center text-center px-4">
      <div className="max-w-md">
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger">
          <ShieldAlert size={26} aria-hidden />
        </span>
        <p className="text-sm font-semibold text-danger">Access restricted</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {target ? `${target.label} isn't available for your role` : "You don't have access to this page"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          You are signed in as <strong className="text-ink">{getRoleLabel(user?.role)}</strong>. Ask an administrator if you need access.
        </p>
        {target && itemPermissions(target).length > 0 && (
          <p className="mt-2 text-xs text-muted">Required permission: {itemPermissions(target).map((k) => PERMISSION_BY_KEY[k]?.label || k).join(' or ')}</p>
        )}
        <p className="mt-3 text-xs text-muted">Prototype note: access is enforced in the browser (menus, routes, buttons and service checks) — there is no server.</p>
        <div className="mt-6">
          <Button to={landingPathFor(user)} icon={LayoutDashboard}>Back to my workspace</Button>
        </div>
      </div>
    </div>
  )
}
