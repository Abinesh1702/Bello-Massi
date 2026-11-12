import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, UserCog, ShieldCheck, Building2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Toggle from '../../components/common/Toggle'
import Checkbox from '../../components/common/Checkbox'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { useAuth } from '../../hooks/useAuth'
import { createUser, getUserById, nextEmployeeId, updateUser } from '../../services/userService'
import { isSuperAdmin } from '../../services/rbacService'
import { passwordPolicyText } from '../../services/authService'
import { ROLES } from '../../config/roles'
import { getScopeLabel } from '../../config/rbacCatalog'
import { STORAGE_KEYS } from '../../utils/constants'

const blank = () => ({
  name: '', email: '', username: '', employeeId: nextEmployeeId(), phone: '', title: '', role: '', additionalRoles: [],
  department: '', designation: '', hubId: '', customerId: '', supplierId: '', status: 'active', password: '', confirmPassword: '', mustChangePassword: true,
})

/** Create User / Edit User. */
export default function UserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, [])
  const roles = useStoredValue(STORAGE_KEYS.ROLES, [])
  const org = useStoredValue(STORAGE_KEYS.ORGANIZATION, null)
  const hubs = useStoredValue(STORAGE_KEYS.HUBS, [])
  const customers = useStoredValue(STORAGE_KEYS.CUSTOMERS, [])
  const forecastSettings = useStoredValue(STORAGE_KEYS.FORECAST_SETTINGS, null)
  const existing = id ? getUserById(id, users) : null
  const canManage = usePermission('users.manage')
  const [form, setForm] = useState(() => (existing ? { ...blank(), ...existing, employeeId: existing.employeeId || '', additionalRoles: existing.additionalRoles || [], hubId: existing.hubId || '', customerId: existing.customerId || '', supplierId: existing.supplierId || '', department: existing.department || '', designation: existing.designation || '' } : blank()))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const role = roles.find((r) => r.code === form.role)
  const superOk = isSuperAdmin(me)
  const roleOptions = useMemo(() => roles.filter((r) => (r.status === 'active' || r.code === existing?.role) && (r.code !== ROLES.SUPER_ADMIN || superOk || existing?.role === ROLES.SUPER_ADMIN)), [roles, superOk, existing])
  const designations = (org?.designations || []).filter((d) => !form.department || d.departmentId === form.department)

  if (id && !existing) return <NotFoundRecord entity="user" backTo="/admin/users" />

  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setForm((f) => {
      const next = { ...f, [k]: v }
      if (k === 'department' && !(org?.designations || []).some((d) => d.id === f.designation && d.departmentId === v)) next.designation = ''
      if (k === 'role') next.additionalRoles = f.additionalRoles.filter((r) => r !== v)
      if (k === 'email' && !existing && !f.username) next.username = String(v).split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '')
      return next
    })
    setErrors((x) => ({ ...x, [k]: undefined }))
  }
  const toggleExtra = (code) => setForm((f) => ({ ...f, additionalRoles: f.additionalRoles.includes(code) ? f.additionalRoles.filter((c) => c !== code) : [...f.additionalRoles, code] }))

  const onSubmit = (e) => {
    e.preventDefault()
    setSaving(true)
    const res = existing ? updateUser(existing.id, form) : createUser(form)
    setSaving(false)
    if (!res.ok) {
      setErrors(res.errors || {})
      toast.error(res.error)
      return
    }
    toast.success(existing ? `${res.record.name} updated` : `${res.record.name} created`, existing ? undefined : { description: 'They can sign in with the email or username and the demo password you set.' })
    navigate(`/admin/users/${res.record.id}`)
  }

  const roleLocked = existing && !canManage
  return (
    <>
      <PageHeader title={existing ? `Edit ${existing.name}` : 'Create user'} description={existing ? `${existing.email} · ${existing.employeeId || ''}` : 'Add an employee or portal user, assign roles and a hub.'} />
      <form onSubmit={onSubmit} noValidate className="space-y-6 max-w-5xl">
        <Card>
          <CardHeader title="Identity" icon={UserCog} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Input label="Full name" value={form.name} onChange={set('name')} error={errors.name} required maxLength={60} autoComplete="off" />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} required autoComplete="off" />
            <Input label="Username" value={form.username} onChange={set('username')} error={errors.username} required hint="Used to sign in instead of the email." autoComplete="off" />
            <Input label="Employee / User ID" value={form.employeeId} onChange={set('employeeId')} error={errors.employeeId} required />
            <Input label="Phone" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="+971 50 123 4567" inputMode="tel" />
            <Input label="Job title" value={form.title} onChange={set('title')} maxLength={60} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Organization" icon={Building2} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Select label="Department" value={form.department} onChange={set('department')} error={errors.department} required placeholder="Choose a department" options={(org?.departments || []).filter((d) => d.status === 'active' || d.id === form.department).map((d) => ({ value: d.id, label: d.name }))} />
            <Select label="Designation" value={form.designation} onChange={set('designation')} error={errors.designation} required placeholder={form.department ? 'Choose a designation' : 'Choose a department first'} options={designations.filter((d) => d.status === 'active' || d.id === form.designation).map((d) => ({ value: d.id, label: d.name }))} />
            <Select label="Assigned hub" value={form.hubId} onChange={set('hubId')} error={errors.hubId} disabled={roleLocked} hint="Leave empty for users who work across all hubs." options={[{ value: '', label: 'All hubs (none)' }, ...hubs.map((h) => ({ value: h.id, label: `${h.name}${h.status !== 'Active' ? ' (inactive)' : ''}` }))]} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Roles & access" subtitle={roleLocked ? 'Changing roles, hub and status needs the users.manage permission.' : 'The primary role decides the dashboard and data scope; additional roles add permissions.'} icon={ShieldCheck} />
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Primary role" value={form.role} onChange={set('role')} error={errors.role} required disabled={roleLocked} placeholder="Choose a role" options={roleOptions.map((r) => ({ value: r.code, label: `${r.name}${r.status !== 'active' ? ' (inactive)' : ''}` }))}
              hint={role ? `Data scope: ${getScopeLabel(role.dataScope)}` : undefined} />
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-ink">Status</p>
              <Toggle checked={form.status === 'active'} onChange={(on) => set('status')(on ? 'active' : 'inactive')} disabled={roleLocked || existing?.id === me.id} label={form.status === 'active' ? 'Active — can sign in' : 'Inactive — sign-in blocked'} />
              {errors.status && <p className="text-xs text-danger">{errors.status}</p>}
            </div>
            {role?.dataScope === 'CUSTOMER' && (
              <Select label="Linked customer" value={form.customerId} onChange={set('customerId')} error={errors.customerId} required placeholder="Choose a customer" options={customers.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))} />
            )}
            {role?.dataScope === 'SUPPLIER' && (
              <Select label="Linked supplier" value={form.supplierId} onChange={set('supplierId')} error={errors.supplierId} required placeholder="Choose a supplier" options={(forecastSettings?.suppliers || []).map((s) => ({ value: s.id, label: s.name }))} />
            )}
          </div>
          <fieldset className="mt-5" disabled={roleLocked}>
            <legend className="text-sm font-medium text-ink">Additional roles <span className="font-normal text-muted">(optional — permissions are combined)</span></legend>
            {errors.additionalRoles && <p className="mt-1 text-xs text-danger">{errors.additionalRoles}</p>}
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {roles.filter((r) => r.code !== form.role && r.status === 'active' && (r.code !== ROLES.SUPER_ADMIN || superOk)).map((r) => (
                <label key={r.code} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surface-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 accent-[#232B5F]" checked={form.additionalRoles.includes(r.code)} onChange={() => toggleExtra(r.code)} />
                  <span className="min-w-0 flex-1 truncate text-ink">{r.name}</span>
                  {!r.system && <Badge tone="accent">Custom</Badge>}
                </label>
              ))}
            </div>
          </fieldset>
        </Card>

        {!existing && (
          <Card>
            <CardHeader title="Initial demo password" subtitle={`${passwordPolicyText()} · stored only as a demo fingerprint in this browser`} icon={KeyRound} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} required />
              <Input label="Confirm password" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} required />
              <Checkbox className="md:col-span-2" label="Ask the user to change this password at first sign-in" checked={form.mustChangePassword} onChange={set('mustChangePassword')} />
            </div>
          </Card>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" to={existing ? `/admin/users/${existing.id}` : '/admin/users'}>Cancel</Button>
          <Button type="submit" icon={Save} loading={saving}>{existing ? 'Save changes' : 'Create user'}</Button>
        </div>
      </form>
    </>
  )
}
