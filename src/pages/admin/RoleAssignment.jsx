import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UsersRound, Pencil, Warehouse } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { useAuth } from '../../hooks/useAuth'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { assignHub, assignRoles } from '../../services/userService'
import { isSuperAdmin, effectivePermissions } from '../../services/rbacService'
import { getRoleLabel, ROLES, userRoleCodes } from '../../config/roles'
import { getScopeLabel } from '../../config/rbacCatalog'
import { STORAGE_KEYS } from '../../utils/constants'

/** User Role Assignment: primary + additional roles per user, and bulk hub assignment. */
export default function RoleAssignment() {
  const { user: me } = useAuth()
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, [])
  const roles = useStoredValue(STORAGE_KEYS.ROLES, [])
  const hubs = useStoredValue(STORAGE_KEYS.HUBS, [])
  const [params, setParams] = useSearchParams()
  const t = useTableQuery({ filters: ['role', 'hub'], sort: 'name' })
  const [selected, setSelected] = useState(() => new Set())
  const [bulkHub, setBulkHub] = useState('')
  const editingId = params.get('user')
  const editing = users.find((u) => u.id === editingId) || null
  const [draft, setDraft] = useState(null)
  const superOk = isSuperAdmin(me)

  const rows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const list = users
      .filter((u) => !q || [u.name, u.email, u.employeeId].some((v) => String(v || '').toLowerCase().includes(q)))
      .filter((u) => !t.filters.role || userRoleCodes(u).includes(t.filters.role))
      .filter((u) => !t.filters.hub || (t.filters.hub === 'none' ? !u.hubId : u.hubId === t.filters.hub))
      .map((u) => ({ ...u, roleName: getRoleLabel(u.role), perms: effectivePermissions(u).size, hubName: hubs.find((h) => h.id === u.hubId)?.name || '' }))
    return sortRows(list, t.sort, t.dir, { role: (u) => u.roleName, hub: (u) => u.hubName, perms: (u) => u.perms })
  }, [users, roles, hubs, t.q, t.filters, t.sort, t.dir]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = (u) => { setDraft({ role: u.role, additionalRoles: u.additionalRoles || [], hubId: u.hubId || '' }); setParams((p) => { const n = new URLSearchParams(p); n.set('user', u.id); return n }, { replace: true }) }
  const close = () => { setDraft(null); setParams((p) => { const n = new URLSearchParams(p); n.delete('user'); return n }, { replace: true }) }
  const d = draft || (editing ? { role: editing.role, additionalRoles: editing.additionalRoles || [], hubId: editing.hubId || '' } : null)

  const save = () => {
    const res = assignRoles(editing.id, { role: d.role, additionalRoles: d.additionalRoles })
    if (!res.ok) return toast.error(res.error)
    if ((editing.hubId || '') !== d.hubId) {
      const h = assignHub([editing.id], d.hubId)
      if (!h.ok) return toast.error(h.error)
    }
    toast.success(`Access updated for ${editing.name}`)
    close()
  }
  const applyHub = () => {
    const res = assignHub([...selected], bulkHub)
    if (!res.ok) return toast.error(res.error)
    toast.success(`Hub assigned to ${res.count} user${res.count === 1 ? '' : 's'}`)
    setSelected(new Set())
  }
  const toggle = (id) => setSelected((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const assignable = (r) => r.status === 'active' && (r.code !== ROLES.SUPER_ADMIN || superOk)

  return (
    <>
      <PageHeader title="User Role Assignment" description="Assign a primary role (dashboard and data scope) and optional additional roles (extra permissions) to each user, and assign hubs in bulk." />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search users…" total={users.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset}>
          <FilterSelect label="Role" allLabel="All roles" value={t.filters.role} onChange={(v) => t.setFilter('role', v)} options={roles.map((r) => ({ value: r.code, label: r.name }))} />
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hub} onChange={(v) => t.setFilter('hub', v)} options={[{ value: 'none', label: 'No hub' }, ...hubs.map((h) => ({ value: h.id, label: h.name }))]} />
        </FilterToolbar>
        {selected.size > 0 && (
          <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-brand/30 bg-surface-2 p-3">
            <p className="mr-auto self-center text-sm text-ink">{selected.size} selected</p>
            <Select label="Assign hub" value={bulkHub} onChange={(e) => setBulkHub(e.target.value)} options={[{ value: '', label: 'All hubs (none)' }, ...hubs.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: h.name }))]} className="w-56" />
            <Button icon={Warehouse} onClick={applyHub}>Apply hub</Button>
            <Button variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}
        <DataTable
          rows={rows}
          pageSize="default"
          sort={t.sort} dir={t.dir} onSort={t.setSort}
          page={t.page} onPageChange={t.setPage}
          columns={[
            { key: 'sel', header: <input type="checkbox" aria-label="Select all users" className="h-4 w-4 accent-[#232B5F]" checked={allOnPage} onChange={() => setSelected(allOnPage ? new Set() : new Set(rows.map((r) => r.id)))} />, render: (u) => <input type="checkbox" aria-label={`Select ${u.name}`} className="h-4 w-4 accent-[#232B5F]" checked={selected.has(u.id)} onChange={() => toggle(u.id)} onClick={(e) => e.stopPropagation()} /> },
            { key: 'name', header: 'User', sortable: true, render: (u) => <span><span className="block font-medium text-ink">{u.name}</span><span className="block text-xs text-muted">{u.employeeId} · {u.email}</span></span> },
            { key: 'role', header: 'Primary role', sortable: true, render: (u) => <Badge tone="brand">{u.roleName}</Badge> },
            { key: 'extra', header: 'Additional roles', render: (u) => (u.additionalRoles || []).length ? <span className="flex flex-wrap gap-1">{u.additionalRoles.map((r) => <Badge key={r} tone="neutral">{getRoleLabel(r)}</Badge>)}</span> : <span className="text-muted">—</span>, hideBelow: 'md' },
            { key: 'hub', header: 'Hub', sortable: true, render: (u) => u.hubName || <span className="text-muted">All hubs</span>, hideBelow: 'lg' },
            { key: 'perms', header: 'Permissions', sortable: true, align: 'right', render: (u) => u.perms, hideBelow: 'sm' },
            { key: 'act', header: <span className="sr-only">Edit</span>, align: 'right', render: (u) => <Button size="xs" variant="secondary" icon={Pencil} onClick={() => open(u)}>Assign</Button> },
          ]}
        />
      </Card>

      <Modal open={Boolean(editing && d)} onClose={close} title={`Assign roles · ${editing?.name || ''}`} icon={UsersRound}
        footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {editing && d && (
          <div className="space-y-4">
            <Select label="Primary role" value={d.role} onChange={(e) => setDraft({ ...d, role: e.target.value, additionalRoles: d.additionalRoles.filter((r) => r !== e.target.value) })}
              options={roles.filter((r) => assignable(r) || r.code === editing.role).map((r) => ({ value: r.code, label: r.name }))}
              hint={`Data scope: ${getScopeLabel(roles.find((r) => r.code === d.role)?.dataScope)}`} />
            <fieldset>
              <legend className="text-sm font-medium text-ink">Additional roles</legend>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {roles.filter((r) => r.code !== d.role && (assignable(r) || d.additionalRoles.includes(r.code))).map((r) => (
                  <label key={r.code} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-sm cursor-pointer hover:bg-surface-2">
                    <input type="checkbox" className="h-4 w-4 accent-[#232B5F]" checked={d.additionalRoles.includes(r.code)}
                      onChange={() => setDraft({ ...d, additionalRoles: d.additionalRoles.includes(r.code) ? d.additionalRoles.filter((x) => x !== r.code) : [...d.additionalRoles, r.code] })} />
                    <span className="truncate">{r.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Select label="Assigned hub" value={d.hubId} onChange={(e) => setDraft({ ...d, hubId: e.target.value })} options={[{ value: '', label: 'All hubs (none)' }, ...hubs.map((h) => ({ value: h.id, label: h.name }))]} />
            <p className="text-xs text-muted">Permissions of all roles are combined. The primary role decides the dashboard, landing page and which records the user sees.</p>
          </div>
        )}
      </Modal>
    </>
  )
}
