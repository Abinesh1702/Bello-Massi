import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Save, KeyRound, Pencil, Copy, Trash2, RotateCcw, Lock, ShieldCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import InfoList from '../../components/common/InfoList'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import DataTable from '../../components/common/DataTable'
import PermissionMatrixEditor from '../../components/admin/PermissionMatrixEditor'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { codeFromName, createRole, deleteRole, duplicateRole, getRoleById, isLockedRole, isProtectedRole, resetRolePermissions, updateRole, usersWithRole } from '../../services/rbacService'
import { DATA_SCOPES, getScopeLabel, LANDING_PAGES, PERMISSION_CATALOG } from '../../config/rbacCatalog'
import { STORAGE_KEYS } from '../../utils/constants'
import { DEPARTMENTS } from '../../config/enterprise/roles'
import { formatDateTime } from '../../utils/formatters'

const COLORS = ['#232B5F', '#0E7490', '#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#B45309', '#0369A1', '#9F1239', '#4D7C0F']
const EMPTY = { name: '', code: '', description: '', workspace: '', department: '', dataScope: 'SALESMAN', landingPath: '/dashboard', color: COLORS[1], status: 'active', permissions: ['dashboard.view'] }

/** Create Role / Edit Role (with the permission matrix). */
export default function RoleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const roles = useStoredValue(STORAGE_KEYS.ROLES, [])
  const existing = id ? getRoleById(id, roles) : null
  const [form, setForm] = useState(() => (existing ? { ...EMPTY, ...existing } : EMPTY))
  const [codeTouched, setCodeTouched] = useState(Boolean(existing))
  const [errors, setErrors] = useState({})
  const [confirm, setConfirm] = useState(false)

  if (id && !existing) return <NotFoundRecord entity="role" backTo="/admin/roles" />
  // Super Admin is locked: its permissions cannot be edited, so show the read-only detail instead.
  if (existing && isLockedRole(existing)) return <Navigate to={`/admin/roles/${existing.id}`} replace />

  const set = (k) => (e) => {
    const v = e?.target ? e.target.value : e
    setForm((f) => ({ ...f, [k]: v, ...(k === 'name' && !codeTouched && !existing ? { code: codeFromName(v) } : {}) }))
    setErrors((x) => ({ ...x, [k]: undefined }))
  }
  const removed = existing ? existing.permissions.filter((k) => !form.permissions.includes(k)).length : 0
  const added = existing ? form.permissions.filter((k) => !existing.permissions.includes(k)).length : form.permissions.length

  const save = () => {
    const res = existing ? updateRole(existing.id, form) : createRole(form)
    setConfirm(false)
    if (!res.ok) {
      setErrors(res.errors || {})
      toast.error(res.error)
      return
    }
    toast.success(existing ? `${res.record.name} updated` : `${res.record.name} created`)
    navigate(`/admin/roles/${res.record.id}`)
  }
  const onSubmit = (e) => { e.preventDefault(); if (existing && (removed || added)) setConfirm(true); else save() }

  return (
    <>
      <PageHeader title={existing ? `Edit role · ${existing.name}` : 'Create role'} description={existing?.system ? 'System role — the code and data scope are fixed; name, description, status and permissions can be changed.' : 'Define the role, its data scope and the modules, pages and actions it can use.'} />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card>
          <CardHeader title="Role details" icon={KeyRound} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Input label="Role name" value={form.name} onChange={set('name')} error={errors.name} required maxLength={40} />
            <Input label="Role code" value={form.code} onChange={(e) => { setCodeTouched(true); set('code')({ target: { value: e.target.value.toUpperCase() } }) }} error={errors.code} required disabled={Boolean(existing)} hint={existing ? 'Codes cannot change once created.' : 'Capital letters, digits and underscores.'} />
            <Select label="Status" value={form.status} onChange={set('status')} error={errors.status} disabled={existing && isProtectedRole(existing)} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
            <Select label="Data scope" value={form.dataScope} onChange={set('dataScope')} error={errors.dataScope} disabled={existing?.system} hint={DATA_SCOPES.find((s) => s.id === form.dataScope)?.description} options={DATA_SCOPES.map((s) => ({ value: s.id, label: s.label }))} />
            <Select label="Landing page after sign-in" value={form.landingPath} onChange={set('landingPath')} error={errors.landingPath} options={LANDING_PAGES} />
            <Input label="Workspace label" value={form.workspace} onChange={set('workspace')} placeholder="e.g. Warehouse" maxLength={40} />
            <Select label="Department" value={form.department || ''} onChange={set('department')} placeholder="Select department…" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} />
            <Textarea label="Description" value={form.description} onChange={set('description')} error={errors.description} rows={2} className="md:col-span-2" maxLength={240} />
            <div>
              <p className="text-sm font-medium text-ink">Colour</p>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Role colour">
                {COLORS.map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={form.color === c} aria-label={`Colour ${c}`} onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-surface ${form.color === c ? 'ring-2 ring-accent' : ''}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Permissions" subtitle="Module permissions (rows), action permissions (columns) and individual page / action permissions (expand a module)" icon={ShieldCheck} />
          {errors.permissions && <p className="mb-2 text-sm text-danger">{errors.permissions}</p>}
          <PermissionMatrixEditor value={form.permissions} onChange={(p) => setForm((f) => ({ ...f, permissions: p }))} />
        </Card>
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface/95 py-3 pl-4 pr-20 backdrop-blur sm:-mx-6 sm:pl-6 lg:-mx-8 lg:pl-8 lg:pr-24">
          <span className="mr-auto text-xs text-muted">{form.permissions.length} permissions{existing ? ` · +${added} / −${removed} vs saved` : ''}</span>
          <Button variant="secondary" to={existing ? `/admin/roles/${existing.id}` : '/admin/roles'}>Cancel</Button>
          <Button type="submit" icon={Save}>{existing ? 'Save changes' : 'Create role'}</Button>
        </div>
      </form>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={save} confirmLabel="Save permissions"
        title="Change role permissions?" description={`${added} permission${added === 1 ? '' : 's'} added and ${removed} removed. Changes apply immediately to every user holding ${existing?.name}.`} />
    </>
  )
}

/** Role detail (read-only matrix, users holding the role, actions). */
export function RoleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const roles = useStoredValue(STORAGE_KEYS.ROLES, [])
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, [])
  const role = getRoleById(id, roles)
  const canEdit = usePermission('roles.edit')
  const canCreate = usePermission('roles.create')
  const canDelete = usePermission('roles.delete')
  const [confirm, setConfirm] = useState(null)
  const holders = useMemo(() => (role ? usersWithRole(role.code, users) : []), [role, users])
  if (!role) return <NotFoundRecord entity="role" backTo="/admin/roles" />
  const perms = role.locked ? PERMISSION_CATALOG.map((p) => p.key) : role.permissions

  const run = (fn, ok) => {
    const res = fn()
    setConfirm(null)
    if (!res.ok) return toast.error(res.error)
    toast.success(ok(res))
    return res
  }

  return (
    <>
      <PageHeader title={role.name} description={role.description}
        actions={<>
          {canCreate && <Button variant="secondary" icon={Copy} onClick={() => { const r = run(() => duplicateRole(role.id), (x) => `Created ${x.record.name}`); if (r?.ok) navigate(`/admin/roles/${r.record.id}/edit`) }}>Duplicate</Button>}
          {canEdit && role.system && !role.locked && <Button variant="secondary" icon={RotateCcw} onClick={() => setConfirm('reset')}>Reset to defaults</Button>}
          {canDelete && !role.system && <Button variant="danger-outline" icon={Trash2} onClick={() => setConfirm('delete')}>Delete</Button>}
          {canEdit && !role.locked && <Button icon={Pencil} to={`/admin/roles/${role.id}/edit`}>Edit role</Button>}
        </>} />
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Role" icon={KeyRound} action={<Badge tone={role.status === 'active' ? 'success' : 'neutral'} dot>{role.status === 'active' ? 'Active' : 'Inactive'}</Badge>} />
            <InfoList columns={1} items={[
              { label: 'Code', value: <code>{role.code}</code> },
              { label: 'Type', value: <span className="flex flex-wrap gap-1.5"><Badge tone={role.system ? 'brand' : 'accent'}>{role.system ? 'System' : 'Custom'}</Badge>{role.protected && <Badge tone="neutral">Protected — cannot be deleted</Badge>}{role.locked && <Badge tone="neutral"><Lock size={11} className="mr-0.5" />Locked full access</Badge>}</span> },
              { label: 'Department', value: role.department || '—' },
              { label: 'Data scope', value: `${getScopeLabel(role.dataScope)} — ${DATA_SCOPES.find((s) => s.id === role.dataScope)?.description || ''}` },
              { label: 'Landing page', value: LANDING_PAGES.find((p) => p.value === role.landingPath)?.label || role.landingPath },
              { label: 'Permissions', value: `${perms.length} of ${PERMISSION_CATALOG.length}` },
              { label: 'Last updated', value: formatDateTime(role.updatedAt) },
            ]} />
          </Card>
          <Card>
            <CardHeader title="Users with this role" subtitle={`${holders.length} user${holders.length === 1 ? '' : 's'}`} icon={Users} />
            <DataTable dense rows={holders} pageSize={8} onRowClick={(u) => navigate(`/admin/users/${u.id}`)}
              empty={<p className="text-sm text-muted">No user holds this role.</p>}
              columns={[
                { key: 'n', header: 'User', render: (u) => <span className="font-medium text-ink">{u.name}</span> },
                { key: 'p', header: 'As', render: (u) => <Badge tone={u.role === role.code ? 'brand' : 'neutral'}>{u.role === role.code ? 'Primary' : 'Additional'}</Badge> },
                { key: 's', header: 'Status', render: (u) => <Badge tone={u.status === 'active' ? 'success' : 'neutral'}>{u.status}</Badge> },
              ]} />
          </Card>
        </div>
        <Card className="min-w-0">
          <CardHeader title="Permission matrix" icon={ShieldCheck} />
          <PermissionMatrixEditor value={perms} readOnly lockedNote={role.locked ? 'Super Admin always has every permission; this cannot be changed.' : 'Read-only view — use Edit role to change permissions.'} />
        </Card>
      </div>
      <ConfirmDialog open={confirm === 'delete'} onClose={() => setConfirm(null)} tone="danger" confirmLabel="Delete role" title={`Delete ${role.name}?`}
        description="Only custom roles without users can be deleted. This cannot be undone."
        onConfirm={() => { const r = run(() => deleteRole(role.id), (x) => `${x.record.name} deleted`); if (r?.ok) navigate('/admin/roles') }} />
      <ConfirmDialog open={confirm === 'reset'} onClose={() => setConfirm(null)} confirmLabel="Reset permissions" title={`Reset ${role.name} to its default permissions?`}
        description="Custom changes to this system role's permissions are replaced by the shipped defaults."
        onConfirm={() => run(() => resetRolePermissions(role.id), () => 'Permissions reset to defaults')} />
    </>
  )
}
