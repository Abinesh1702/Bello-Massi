import { Link } from 'react-router-dom'
import { ChevronRight, Bell, ShieldCheck } from 'lucide-react'
import Card, { CardHeader } from '../../common/Card'
import Badge from '../../common/Badge'
import EmptyState from '../../common/EmptyState'
import { getNavigationForRole } from '../../../config/navigation'
import { getRoleLabel, userRoleCodes } from '../../../config/roles'
import { getScopeLabel } from '../../../config/rbacCatalog'
import { scopeOf, effectivePermissions } from '../../../services/rbacService'

/**
 * Dashboard for custom roles (and roles without the Dashboard permission): a workspace launcher built from the
 * modules the user's permissions open. No business figures are shown that the role could not see in the modules.
 */
export default function GenericDashboard({ user, restricted = false }) {
  const groups = getNavigationForRole(user).filter((g) => g.id !== 'settings')
  const perms = effectivePermissions(user)
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Your workspace" subtitle={restricted ? 'Your role does not include the Dashboard permission, so KPI widgets are hidden.' : 'Modules available to your roles'} icon={ShieldCheck} />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {userRoleCodes(user).map((r, i) => <Badge key={r} tone={i === 0 ? 'brand' : 'neutral'}>{getRoleLabel(r)}{i === 0 ? ' · primary' : ''}</Badge>)}
          <span className="text-muted">· data scope: {getScopeLabel(scopeOf(user))} · {perms.size} permissions</span>
        </div>
      </Card>
      {groups.length === 0 ? (
        <EmptyState icon={Bell} title="No modules assigned yet" description="Ask an administrator to grant permissions to your role. Your profile and notifications remain available." action={<Link to="/notifications" className="text-sm font-medium text-brand hover:underline">Open notifications</Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => {
            const items = g.children || [g]
            const Icon = g.icon
            return (
              <Card key={g.id}>
                <CardHeader title={g.label} icon={Icon} />
                <ul className="grid gap-1">
                  {items.map((i) => (
                    <li key={i.id}>
                      <Link to={i.path} className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-surface-2">
                        <span className="truncate">{i.label}</span>
                        <ChevronRight size={15} className="text-muted group-hover:translate-x-0.5 transition-transform" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
