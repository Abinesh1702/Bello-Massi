import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Power, KeyRound, Trash2, Unlock, ShieldCheck, History, Building2, UserCog } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Avatar from '../../components/common/Avatar'
import InfoList from '../../components/common/InfoList'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { useUserActions } from '../../components/admin/UserActions'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { useAuth } from '../../hooks/useAuth'
import { getRoleLabel, userRoleCodes } from '../../config/roles'
import { getScopeLabel, MODULES, PERMISSION_BY_KEY } from '../../config/rbacCatalog'
import { effectivePermissions, scopeOf } from '../../services/rbacService'
import { getLockState } from '../../services/authService'
import { userReferences } from '../../services/userService'
import { AUDIT_ACTIONS } from '../../services/auditService'
import { STORAGE_KEYS } from '../../utils/constants'
import { formatDateTime, formatRelative } from '../../utils/formatters'

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, [])
  const roles = useStoredValue(STORAGE_KEYS.ROLES, [])
  useStoredValue(STORAGE_KEYS.AUTH, null)
  const org = useStoredValue(STORAGE_KEYS.ORGANIZATION, null)
  const hubs = useStoredValue(STORAGE_KEYS.HUBS, [])
  const customers = useStoredValue(STORAGE_KEYS.CUSTOMERS, [])
  const audit = useStoredValue(STORAGE_KEYS.AUDIT_LOGS, [])
  const activities = useStoredValue(STORAGE_KEYS.ACTIVITIES, [])
  const u = users.find((x) => x.id === id)
  const [tab, setTab] = useState('activity')
  const canEdit = usePermission('users.edit')
  const canManage = usePermission('users.manage')
  const canDelete = usePermission('users.delete')
  const canAudit = usePermission('audit.view')
  const ua = useUserActions({ onDeleted: () => navigate('/admin/users') })

  const perms = useMemo(() => (u ? effectivePermissions(u) : new Set()), [u])
  const byModule = useMemo(() => MODULES.map((m) => ({ ...m, keys: [...perms].filter((k) => PERMISSION_BY_KEY[k]?.module === m.id) })).filter((m) => m.keys.length), [perms])
  const rows = useMemo(() => {
    if (!u) return []
    const fromAudit = audit.filter((a) => a.userId === u.id || a.recordId === u.id).map((a) => ({ id: a.id, at: a.at, action: AUDIT_ACTIONS[a.action]?.label || a.action, tone: AUDIT_ACTIONS[a.action]?.tone, text: a.description, source: 'Audit' }))
    const fromActivity = activities.filter((a) => a.actorId === u.id).map((a) => ({ id: a.id, at: a.createdAt, action: 'Activity', tone: 'neutral', text: `${a.actorName} ${a.message}`, source: 'Activity' }))
    return [...fromAudit, ...fromActivity].sort((a, b) => (a.at < b.at ? 1 : -1))
  }, [u, audit, activities])

  if (!u) return <NotFoundRecord entity="user" backTo="/admin/users" />
  const lock = getLockState(u.id)
  const refs = userReferences(u.id)
  const self = u.id === me.id

  return (
    <>
      <PageHeader title={u.name} description={`${u.employeeId || ''} · ${u.email}`}
        actions={<>
          {canManage && lock.locked && <Button variant="secondary" icon={Unlock} onClick={() => ua.ask('unlock', u)}>Unlock</Button>}
          {canManage && !self && <Button variant="secondary" icon={KeyRound} onClick={() => ua.ask('reset', u)}>Reset demo password</Button>}
          {canManage && !self && <Button variant={u.status === 'active' ? 'danger-outline' : 'secondary'} icon={Power} onClick={() => ua.ask('status', u)}>{u.status === 'active' ? 'Deactivate' : 'Activate'}</Button>}
          {canDelete && !self && <Button variant="ghost" icon={Trash2} onClick={() => ua.ask('delete', u)}>Delete</Button>}
          {canEdit && <Button icon={Pencil} to={`/admin/users/${u.id}/edit`}>Edit</Button>}
        </>} />
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              <Avatar name={u.name} color={u.avatarColor} image={u.avatarImage} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-ink">{u.name}</p>
                <p className="truncate text-sm text-muted">{u.title || '—'}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone={u.status === 'active' ? 'success' : 'neutral'} dot>{u.status === 'active' ? 'Active' : 'Inactive'}</Badge>
                  {lock.locked && <Badge tone="danger">Locked until {formatDateTime(lock.lockedUntil)}</Badge>}
                  {u.mustChangePassword && <Badge tone="accent">Must change password</Badge>}
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Details" icon={UserCog} />
            <InfoList columns={1} items={[
              { label: 'Employee / User ID', value: u.employeeId },
              { label: 'Username', value: u.username },
              { label: 'Email', value: u.email },
              { label: 'Phone', value: u.phone },
              { label: 'Created', value: formatDateTime(u.createdAt) },
              { label: 'Last sign-in', value: u.lastLoginAt ? `${formatDateTime(u.lastLoginAt)} (${formatRelative(u.lastLoginAt)})` : 'Never' },
              { label: 'Failed sign-in attempts', value: lock.count ? String(lock.count) : '0' },
            ]} />
          </Card>
          <Card>
            <CardHeader title="Organization" icon={Building2} />
            <InfoList columns={1} items={[
              { label: 'Department', value: org?.departments?.find((d) => d.id === u.department)?.name },
              { label: 'Designation', value: org?.designations?.find((d) => d.id === u.designation)?.name },
              { label: 'Assigned hub', value: hubs.find((h) => h.id === u.hubId)?.name || 'All hubs' },
              { label: 'Linked customer', value: customers.find((c) => c.id === u.customerId)?.name, hidden: !u.customerId },
              { label: 'Linked supplier', value: u.supplierId, hidden: !u.supplierId },
              { label: 'Linked records', value: refs.length ? refs.join(', ') : 'None' },
            ]} />
          </Card>
        </div>
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader title="Roles & permissions" subtitle={`Data scope: ${getScopeLabel(scopeOf(u))} · ${perms.size} effective permissions`} icon={ShieldCheck}
              action={canManage && <Link to={`/admin/role-assignment?user=${u.id}`} className="text-xs font-medium text-brand hover:underline">Change roles</Link>} />
            <div className="flex flex-wrap gap-1.5">
              {userRoleCodes(u).map((r, i) => {
                const rid = roles.find((x) => x.code === r)?.id
                const badge = <Badge tone={i === 0 ? 'brand' : 'neutral'}>{getRoleLabel(r)}{i === 0 ? ' · primary' : ''}</Badge>
                return rid ? <Link key={r} to={`/admin/roles/${rid}`}>{badge}</Link> : <span key={r}>{badge}</span>
              })}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {byModule.map((m) => (
                <div key={m.id} className="rounded-lg border border-line p-3">
                  <p className="text-sm font-medium text-ink">{m.label} <span className="text-xs font-normal text-muted">· {m.keys.length}</span></p>
                  <ul className="mt-1 space-y-0.5 text-xs text-muted">
                    {m.keys.slice(0, 5).map((k) => <li key={k} className="truncate">{PERMISSION_BY_KEY[k].label}</li>)}
                    {m.keys.length > 5 && <li>+{m.keys.length - 5} more</li>}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="User activity" icon={History} action={canAudit && <Link to={`/admin/audit-logs?user=${u.id}`} className="text-xs font-medium text-brand hover:underline">Open in audit log</Link>} />
            <Tabs value={tab} onChange={setTab} tabs={[{ id: 'activity', label: `All (${rows.length})` }, { id: 'audit', label: 'Audit only' }]} className="mb-3" />
            <DataTable dense pageSize="default" rows={tab === 'audit' ? rows.filter((r) => r.source === 'Audit') : rows}
              empty={<p className="py-4 text-sm text-muted">No activity recorded for this user yet.</p>}
              columns={[
                { key: 'at', header: 'When', render: (r) => <span className="whitespace-nowrap text-xs text-muted">{formatDateTime(r.at)}</span> },
                { key: 'a', header: 'Action', render: (r) => <Badge tone={r.tone || 'neutral'}>{r.action}</Badge> },
                { key: 't', header: 'Description', render: (r) => <span className="text-ink">{r.text}</span> },
              ]} />
          </Card>
        </div>
      </div>
      {ua.dialogs}
    </>
  )
}
