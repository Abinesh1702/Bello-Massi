import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Grid3x3, Save, Undo2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import PermissionMatrixEditor from '../../components/admin/PermissionMatrixEditor'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { updateRole } from '../../services/rbacService'
import { MODULES, PERMISSION_CATALOG, keysForModule } from '../../config/rbacCatalog'
import { STORAGE_KEYS } from '../../utils/constants'
import { downloadCsv, csvFilename } from '../../services/csvService'
import { cn } from '../../utils/helpers'

/** All roles × modules overview, plus inline editing of one role's matrix. */
export default function PermissionMatrix() {
  const roles = useStoredValue(STORAGE_KEYS.ROLES, [])
  const canEdit = usePermission('roles.edit')
  const [roleId, setRoleId] = useState(() => roles.find((r) => r.code === 'SALES_MANAGER')?.id || roles[0]?.id)
  const role = roles.find((r) => r.id === roleId)
  const [draft, setDraft] = useState(null) // { roleId, permissions }
  const [confirm, setConfirm] = useState(false)
  const value = draft?.roleId === roleId ? draft.permissions : role?.locked ? PERMISSION_CATALOG.map((p) => p.key) : role?.permissions || []
  const dirty = Boolean(draft && draft.roleId === roleId)

  const overview = useMemo(() => MODULES.map((m) => {
    const keys = keysForModule(m.id)
    return { ...m, total: keys.length, cells: roles.map((r) => (r.locked ? keys.length : keys.filter((k) => r.permissions.includes(k)).length)) }
  }), [roles])

  const save = () => {
    const res = updateRole(role.id, { ...role, permissions: draft.permissions })
    setConfirm(false)
    if (!res.ok) return toast.error(res.error)
    setDraft(null)
    toast.success(`${role.name} permissions saved`)
  }
  const exportCsv = () => {
    const n = downloadCsv(csvFilename('permission-matrix'), PERMISSION_CATALOG, [
      { header: 'Module', value: (p) => MODULES.find((m) => m.id === p.module)?.label },
      { header: 'Action', value: (p) => p.action },
      { header: 'Permission', value: (p) => p.label },
      { header: 'Key', value: (p) => p.key },
      { header: 'Kind', value: (p) => p.kind },
      ...roles.map((r) => ({ header: r.name, value: (p) => (r.locked || r.permissions.includes(p.key) ? 'Yes' : '') })),
    ])
    if (n) toast.success(`Exported ${n} permissions × ${roles.length} roles`)
  }

  return (
    <>
      <PageHeader title="Permission Matrix" description="Which modules each role can use, and the full module × action matrix of one role." actions={<Button variant="secondary" onClick={exportCsv}>Export CSV</Button>} />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Overview" subtitle="Granted permissions per module and role" icon={Grid3x3} />
          <div className="relative overflow-x-auto scroll-thin rounded-lg border border-line">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-surface-2/70">
                <tr>
                  <th scope="col" className="sticky left-0 z-10 bg-surface-2 px-3 py-2 text-left text-xs font-semibold text-muted">Module</th>
                  {roles.map((r) => (
                    <th key={r.id} scope="col" className="px-2 py-2 text-center text-[11px] font-semibold text-muted">
                      <button type="button" onClick={() => setRoleId(r.id)} className={cn('rounded px-1 hover:text-brand', r.id === roleId && 'text-brand underline underline-offset-4')}>{r.name}</button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overview.map((m) => (
                  <tr key={m.id} className="border-t border-line">
                    <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-1.5 text-left font-medium text-ink">{m.label}</th>
                    {m.cells.map((n, i) => (
                      <td key={roles[i].id} className="px-2 py-1.5 text-center">
                        <span className={cn('inline-block min-w-12 rounded px-1.5 py-0.5 text-xs tabular', n === 0 ? 'text-muted/60' : n === m.total ? 'bg-success/10 text-success dark:bg-success/100/15 dark:text-green-300' : 'bg-warning/10 text-warning dark:bg-warning/100/15 dark:text-amber-300')} title={`${roles[i].name}: ${n} of ${m.total} ${m.label} permissions`}>
                          {n === 0 ? '—' : `${n}/${m.total}`}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">Green: full module access · amber: partial · —: none. Select a role name to edit its matrix below.</p>
        </Card>

        {role && (
          <Card>
            <CardHeader title={`${role.name} — module × action permissions`} subtitle={role.description} icon={role.locked ? Lock : Grid3x3}
              action={<Link to={`/admin/roles/${role.id}`} className="text-xs font-medium text-brand hover:underline">Role details</Link>} />
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <Select label="Role" value={roleId} onChange={(e) => setRoleId(e.target.value)} options={roles.map((r) => ({ value: r.id, label: `${r.name}${r.system ? '' : ' (custom)'}` }))} className="w-64" />
              {role.status !== 'active' && <Badge tone="neutral">Inactive — grants nothing until activated</Badge>}
              {dirty && <Badge tone="accent">Unsaved changes</Badge>}
            </div>
            <PermissionMatrixEditor
              value={value}
              readOnly={!canEdit || role.locked}
              lockedNote={role.locked ? 'Super Admin always has every permission.' : !canEdit ? 'You can view but not change permissions.' : undefined}
              onChange={(p) => setDraft({ roleId, permissions: p })}
            />
            {canEdit && !role.locked && (
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" icon={Undo2} disabled={!dirty} onClick={() => setDraft(null)}>Discard</Button>
                <Button icon={Save} disabled={!dirty} onClick={() => setConfirm(true)}>Save permissions</Button>
              </div>
            )}
          </Card>
        )}
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={save} confirmLabel="Save permissions"
        title={`Save ${role?.name} permissions?`} description="Changes apply immediately to every user holding this role — menus, pages, buttons and service checks." />
    </>
  )
}
