import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Clock, KeyRound, History, LogOut, Building2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import InfoList from '../../components/common/InfoList'
import Timeline from '../../components/common/Timeline'
import { ProfileForm } from '../settings/ProfileSettings'
import { useAuth } from '../../hooks/useAuth'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { getRoleLabel } from '../../config/roles'
import { getScopeLabel, MODULES, PERMISSION_BY_KEY } from '../../config/rbacCatalog'
import { getSessionInfo } from '../../services/authService'
import { AUDIT_ACTIONS } from '../../services/auditService'
import { STORAGE_KEYS } from '../../utils/constants'
import { formatDateTime } from '../../utils/formatters'

/** User Profile: editable profile, roles & permissions, session and the user's own recent activity. */
export default function UserProfile() {
  const { user, roles, scope, permissions } = useAuth()
  const org = useStoredValue(STORAGE_KEYS.ORGANIZATION, null)
  const hubs = useStoredValue(STORAGE_KEYS.HUBS, [])
  const audit = useStoredValue(STORAGE_KEYS.AUDIT_LOGS, [])
  const session = getSessionInfo()
  const byModule = useMemo(() => MODULES.map((m) => ({ ...m, count: [...permissions].filter((k) => PERMISSION_BY_KEY[k]?.module === m.id).length })).filter((m) => m.count), [permissions])
  const mine = useMemo(() => audit.filter((a) => a.userId === user.id).slice(0, 12).map((a) => ({
    id: a.id, title: AUDIT_ACTIONS[a.action]?.label || a.action, description: a.description, at: a.at,
    tone: AUDIT_ACTIONS[a.action]?.tone === 'danger' ? 'danger' : AUDIT_ACTIONS[a.action]?.tone === 'success' ? 'success' : 'brand',
  })), [audit, user.id])
  const dept = org?.departments?.find((d) => d.id === user.department)?.name
  const desig = org?.designations?.find((d) => d.id === user.designation)?.name

  return (
    <>
      <PageHeader title="My profile" description="Your details, roles, permissions and recent activity."
        actions={<><Button variant="secondary" icon={KeyRound} to="/account/change-password">Change password</Button><Button variant="ghost" icon={LogOut} to="/logout">Sign out</Button></>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6 min-w-0">
          <ProfileForm key={`${user.id}-${user.updatedAt || ''}`} />
          <Card>
            <CardHeader title="Recent activity" subtitle="From the audit log" icon={History} />
            <Timeline items={mine} empty="No recorded activity yet." />
          </Card>
        </div>
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader title="Employment" icon={Building2} />
            <InfoList columns={1} items={[
              { label: 'Employee ID', value: user.employeeId },
              { label: 'Username', value: user.username },
              { label: 'Department', value: dept },
              { label: 'Designation', value: desig },
              { label: 'Assigned hub', value: hubs.find((h) => h.id === user.hubId)?.name || 'All hubs' },
            ]} />
          </Card>
          <Card>
            <CardHeader title="Roles & access" subtitle="Assigned by an administrator" icon={ShieldCheck} />
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r, i) => <Badge key={r} tone={i === 0 ? 'brand' : 'neutral'}>{getRoleLabel(r)}{i === 0 ? ' (primary)' : ''}</Badge>)}
            </div>
            <p className="mt-3 text-xs text-muted">Data scope: <strong className="text-ink">{getScopeLabel(scope)}</strong> · {permissions.size} permissions</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {byModule.map((m) => <li key={m.id} className="flex justify-between"><span className="text-muted">{m.label}</span><span className="tabular text-ink">{m.count}</span></li>)}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Session" subtitle="Session simulation — not a secure token" icon={Clock} />
            <InfoList columns={1} items={[
              { label: 'Signed in', value: formatDateTime(session?.startedAt) },
              { label: 'Last activity', value: formatDateTime(session?.lastActiveAt) },
              { label: 'Inactivity timeout', value: session ? `${session.timeoutMinutes} minutes` : '—' },
              { label: 'Keep me signed in', value: session?.remember ? 'On' : 'Off — ends when the browser closes' },
              { label: 'Previous sign-in', value: formatDateTime(user.lastLoginAt) },
            ]} />
            <p className="mt-3 text-xs text-muted"><Link to="/notifications" className="text-brand hover:underline">Notification preferences</Link></p>
          </Card>
        </div>
      </div>
    </>
  )
}
