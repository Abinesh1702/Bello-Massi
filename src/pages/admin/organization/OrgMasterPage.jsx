import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, GitBranch, Network, Briefcase, Award, Boxes } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../../components/common/PageHeader'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import Textarea from '../../../components/common/Textarea'
import Toggle from '../../../components/common/Toggle'
import DataTable from '../../../components/common/DataTable'
import RowActions from '../../../components/common/RowActions'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import FilterToolbar, { FilterSelect } from '../../../components/common/FilterToolbar'
import { useStoredValue } from '../../../hooks/useLocalStorage'
import { usePermission } from '../../../hooks/usePermission'
import { useTableQuery, sortRows } from '../../../hooks/useTableQuery'
import { DESIGNATION_LEVELS, ORG_MASTERS, WAREHOUSE_TYPES, deleteMasterRecord, referencesTo, saveMasterRecord } from '../../../services/organizationService'
import { getSection } from '../../../services/appSettingsService'
import { STORAGE_KEYS } from '../../../utils/constants'
import { downloadCsv, csvFilename } from '../../../services/csvService'
import { formatDate, formatNumber } from '../../../utils/formatters'

/**
 * Field definitions per master. f: [key, label, kind, options/extra]
 * kinds: text | textarea | select | number | toggle
 */
const CONFIG = {
  branches: {
    icon: GitBranch, description: 'Head office and branch offices.',
    fields: () => [
      ['code', 'Code', 'text'], ['name', 'Branch name', 'text'], ['country', 'Country', 'text'], ['city', 'City', 'text'],
      ['address', 'Address', 'text', { span: 2 }], ['manager', 'Branch manager', 'text'], ['phone', 'Phone', 'text'],
      ['isHeadOffice', 'Head office', 'toggle'], ['status', 'Active', 'status'], ['description', 'Description', 'textarea', { span: 2 }],
    ],
    columns: (ctx) => [
      { key: 'city', header: 'Location', render: (r) => `${r.city}, ${r.country}` },
      { key: 'manager', header: 'Manager', render: (r) => r.manager || '—', hideBelow: 'md' },
      { key: 'head', header: 'Type', render: (r) => (r.isHeadOffice ? <Badge tone="brand">Head office</Badge> : <Badge tone="neutral">Branch</Badge>), hideBelow: 'sm' },
      { key: 'deps', header: 'Departments', align: 'right', render: (r) => ctx.org.departments.filter((d) => d.branchId === r.id).length, hideBelow: 'lg' },
    ],
    empty: { country: 'United Arab Emirates', city: '', address: '', manager: '', phone: '', isHeadOffice: false },
  },
  businessUnits: {
    icon: Network, description: 'Business units for ownership and reporting.',
    fields: () => [['code', 'Code', 'text'], ['name', 'Business unit name', 'text'], ['head', 'Head of unit', 'text'], ['description', 'Description', 'textarea', { span: 2 }], ['status', 'Active', 'status']],
    columns: (ctx) => [
      { key: 'head', header: 'Head', render: (r) => r.head || '—', hideBelow: 'sm' },
      { key: 'description', header: 'Description', render: (r) => <span className="line-clamp-1 text-muted">{r.description || '—'}</span>, hideBelow: 'lg' },
      { key: 'deps', header: 'Departments', align: 'right', render: (r) => ctx.org.departments.filter((d) => d.businessUnitId === r.id).length },
    ],
    empty: { head: '' },
  },
  departments: {
    icon: Briefcase, description: 'Departments by business unit and branch.',
    fields: (ctx) => [
      ['code', 'Code', 'text'], ['name', 'Department name', 'text'],
      ['businessUnitId', 'Business unit', 'select', ctx.org.businessUnits.map((b) => ({ value: b.id, label: b.name }))],
      ['branchId', 'Branch', 'select', ctx.org.branches.map((b) => ({ value: b.id, label: b.name }))],
      ['description', 'Description', 'textarea', { span: 2 }], ['status', 'Active', 'status'],
    ],
    columns: (ctx) => [
      { key: 'bu', header: 'Business unit', render: (r) => ctx.org.businessUnits.find((b) => b.id === r.businessUnitId)?.name || '—', hideBelow: 'sm' },
      { key: 'br', header: 'Branch', render: (r) => ctx.org.branches.find((b) => b.id === r.branchId)?.name || '—', hideBelow: 'md' },
      { key: 'users', header: 'Employees', align: 'right', render: (r) => ctx.users.filter((u) => u.department === r.id).length },
    ],
    empty: { businessUnitId: '', branchId: '' },
  },
  designations: {
    icon: Award, description: 'Job titles per department.',
    fields: (ctx) => [
      ['code', 'Code', 'text'], ['name', 'Designation', 'text'],
      ['departmentId', 'Department', 'select', ctx.org.departments.map((d) => ({ value: d.id, label: d.name }))],
      ['level', 'Level', 'select', DESIGNATION_LEVELS.map((l) => ({ value: l, label: l }))],
      ['description', 'Description', 'textarea', { span: 2 }], ['status', 'Active', 'status'],
    ],
    columns: (ctx) => [
      { key: 'dep', header: 'Department', render: (r) => ctx.org.departments.find((d) => d.id === r.departmentId)?.name || '—', hideBelow: 'sm' },
      { key: 'level', header: 'Level', render: (r) => <Badge tone="neutral">{r.level}</Badge>, hideBelow: 'md' },
      { key: 'users', header: 'Employees', align: 'right', render: (r) => ctx.users.filter((u) => u.designation === r.id).length },
    ],
    empty: { departmentId: '', level: 'Staff' },
  },
  warehouses: {
    icon: Boxes, description: 'Storage areas inside each hub with storage type, temperature range and pallet capacity.',
    fields: (ctx) => [
      ['code', 'Code', 'text'], ['name', 'Warehouse name', 'text'],
      ['hubId', 'Hub', 'select', ctx.hubs.map((h) => ({ value: h.id, label: `${h.name}${h.status !== 'Active' ? ' (inactive)' : ''}` }))],
      ['type', 'Storage type', 'select', WAREHOUSE_TYPES.map((t) => ({ value: t, label: t }))],
      ['temperatureMin', 'Min temperature °C', 'number'], ['temperatureMax', 'Max temperature °C', 'number'],
      ['capacityPallets', 'Capacity (pallets)', 'number'], ['status', 'Active', 'status'], ['description', 'Notes', 'textarea', { span: 2 }],
    ],
    columns: (ctx) => [
      { key: 'hub', header: 'Hub', render: (r) => ctx.hubs.find((h) => h.id === r.hubId)?.name || '—', hideBelow: 'sm' },
      { key: 'type', header: 'Type', render: (r) => <Badge tone={r.type === 'Frozen' ? 'info' : r.type === 'Chilled' ? 'brand' : r.type === 'Quarantine' ? 'danger' : 'neutral'}>{r.type}</Badge> },
      { key: 'temp', header: 'Range', render: (r) => (r.temperatureMin === null || r.temperatureMin === undefined ? 'Ambient' : `${r.temperatureMin}°C … ${r.temperatureMax}°C`), hideBelow: 'md' },
      { key: 'cap', header: 'Pallets', align: 'right', render: (r) => formatNumber(r.capacityPallets), hideBelow: 'lg' },
    ],
    empty: { hubId: '', type: 'Frozen', temperatureMin: '', temperatureMax: '', capacityPallets: '0' },
  },
}

const EMPTY_LIST = []

function MasterPage({ type }) {
  const meta = ORG_MASTERS[type]
  const cfg = CONFIG[type]
  const org = useStoredValue(STORAGE_KEYS.ORGANIZATION, { branches: [], businessUnits: [], departments: [], designations: [], warehouses: [] })
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, [])
  const hubs = useStoredValue(STORAGE_KEYS.HUBS, [])
  const canManage = usePermission('organization.manage')
  const t = useTableQuery({ filters: ['status'], sort: 'code' })
  const [editing, setEditing] = useState(null) // { id|null, values }
  const [errors, setErrors] = useState({})
  const [toDelete, setToDelete] = useState(null)
  const ctx = { org, users, hubs }
  const list = org[type] || EMPTY_LIST

  const rows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    return sortRows(list.filter((r) => (!q || [r.code, r.name, r.description, r.city].some((v) => String(v || '').toLowerCase().includes(q))) && (!t.filters.status || r.status === t.filters.status)), t.sort, t.dir)
  }, [list, t.q, t.filters, t.sort, t.dir])

  const openNew = () => {
    const base = { code: '', name: '', description: '', status: 'active', ...cfg.empty }
    if (type === 'warehouses') {
      const cold = getSection('coldChain')
      base.temperatureMin = String(cold.frozenMin)
      base.temperatureMax = String(cold.frozenMax)
    }
    setErrors({})
    setEditing({ id: null, values: base })
  }
  const openEdit = (r) => { setErrors({}); setEditing({ id: r.id, values: Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v ?? ''])) }) }
  const setVal = (k, v) => {
    setEditing((e) => {
      const values = { ...e.values, [k]: v }
      if (type === 'warehouses' && k === 'type') {
        const cold = getSection('coldChain')
        if (v === 'Frozen') { values.temperatureMin = String(cold.frozenMin); values.temperatureMax = String(cold.frozenMax) }
        if (v === 'Chilled') { values.temperatureMin = String(cold.chilledMin); values.temperatureMax = String(cold.chilledMax) }
        if (v === 'Ambient') { values.temperatureMin = ''; values.temperatureMax = '' }
      }
      return { ...e, values }
    })
    setErrors((x) => ({ ...x, [k]: undefined }))
  }
  const save = () => {
    const res = saveMasterRecord(type, editing.values, editing.id)
    if (!res.ok) { setErrors(res.errors || {}); if (!res.errors || res.errors.form) toast.error(res.error); return }
    toast.success(`${meta.label} ${editing.id ? 'updated' : 'created'}`)
    setEditing(null)
  }
  const remove = () => {
    const res = deleteMasterRecord(type, toDelete.id)
    setToDelete(null)
    if (!res.ok) return toast.error(res.error)
    toast.success(`${res.record.name} deleted`)
  }
  const onExport = () => {
    const keys = cfg.fields(ctx).map(([k, label]) => [k, label])
    const n = downloadCsv(csvFilename(`org-${type}`), rows, keys.map(([k, label]) => ({ header: label, value: (r) => r[k] })))
    if (n) toast.success(`Exported ${n} ${meta.plural.toLowerCase()}`)
  }

  const Icon = cfg.icon
  const fields = editing ? cfg.fields(ctx) : []
  const ambient = type === 'warehouses' && editing?.values.type === 'Ambient'
  return (
    <>
      <PageHeader title={meta.plural} description={cfg.description} actions={canManage && <Button icon={Plus} onClick={openNew}>Add {meta.label.toLowerCase()}</Button>} />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder={`Search ${meta.plural.toLowerCase()}…`} total={list.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        </FilterToolbar>
        <DataTable
          rows={rows}
          pageSize="default"
          sort={t.sort} dir={t.dir} onSort={t.setSort}
          page={t.page} onPageChange={t.setPage}
          onRowClick={canManage ? openEdit : undefined}
          columns={[
            { key: 'code', header: 'Code', sortable: true, render: (r) => <code className="text-xs">{r.code}</code> },
            { key: 'name', header: 'Name', sortable: true, render: (r) => <span className="font-medium text-ink">{r.name}</span> },
            ...cfg.columns(ctx),
            { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'} dot>{r.status === 'active' ? 'Active' : 'Inactive'}</Badge> },
            { key: 'updatedAt', header: 'Updated', sortable: true, render: (r) => formatDate(r.updatedAt), hideBelow: 'xl' },
            ...(canManage ? [{ key: 'act', header: <span className="sr-only">Actions</span>, align: 'right', render: (r) => (
              <RowActions items={[
                { label: 'Edit', icon: Pencil, onClick: () => openEdit(r) },
                { label: 'Delete', icon: Trash2, danger: true, onClick: () => setToDelete(r) },
              ]} />
            ) }] : []),
          ]}
        />
      </Card>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`${editing?.id ? 'Edit' : 'Add'} ${meta.label.toLowerCase()}`} icon={Icon} size="lg"
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>{editing?.id ? 'Save changes' : `Add ${meta.label.toLowerCase()}`}</Button></>}>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            {errors.form && <p className="sm:col-span-2 text-sm text-danger">{errors.form}</p>}
            {fields.map(([k, label, kind, extra]) => {
              const span = extra && !Array.isArray(extra) && extra.span === 2 ? 'sm:col-span-2' : ''
              const v = editing.values[k] ?? ''
              if (kind === 'status') return <div key={k} className="pt-6"><Toggle checked={v === 'active'} onChange={(on) => setVal('status', on ? 'active' : 'inactive')} label={v === 'active' ? 'Active' : 'Inactive'} /></div>
              if (kind === 'toggle') return <div key={k} className="pt-6"><Toggle checked={Boolean(v)} onChange={(on) => setVal(k, on)} label={label} /></div>
              if (kind === 'select') return <Select key={k} label={label} value={v} onChange={(e) => setVal(k, e.target.value)} error={errors[k]} required placeholder={`Choose ${label.toLowerCase()}`} options={extra} className={span} />
              if (kind === 'textarea') return <Textarea key={k} label={label} value={v} onChange={(e) => setVal(k, e.target.value)} rows={2} className={span} maxLength={240} />
              if (kind === 'number') return <Input key={k} label={label} type="number" value={v} onChange={(e) => setVal(k, e.target.value)} error={errors[k]} disabled={ambient && k.startsWith('temperature')} className={span} />
              return <Input key={k} label={label} value={v} onChange={(e) => setVal(k, k === 'code' ? e.target.value.toUpperCase() : e.target.value)} error={errors[k]} required={['code', 'name', 'country', 'city'].includes(k)} className={span} />
            })}
            {editing.id && referencesTo(type, editing.id, org).length > 0 && (
              <p className="sm:col-span-2 text-xs text-muted">In use by {referencesTo(type, editing.id, org).join(' and ')}.</p>
            )}
          </div>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} tone="danger" confirmLabel="Delete"
        title={`Delete ${toDelete?.name}?`} description="Records still used by departments, designations or users cannot be deleted — set them to inactive instead." />
    </>
  )
}

export const Branches = () => <MasterPage type="branches" />
export const BusinessUnits = () => <MasterPage type="businessUnits" />
export const Departments = () => <MasterPage type="departments" />
export const Designations = () => <MasterPage type="designations" />
export const Warehouses = () => <MasterPage type="warehouses" />
export default Branches
