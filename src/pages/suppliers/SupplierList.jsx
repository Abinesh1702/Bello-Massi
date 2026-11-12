import { useMemo, useState } from 'react'
import { Factory, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import DataTable from '../../components/common/DataTable'
import FilterToolbar from '../../components/common/FilterToolbar'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { usePermission } from '../../hooks/usePermission'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { saveSupplier } from '../../services/supplierService'
import { STORAGE_KEYS } from '../../utils/constants'
import { downloadCsv, csvFilename } from '../../services/csvService'
import { currencySymbol, formatCompactCurrency, formatMoney } from '../../utils/formatters'

/** Supplier directory — the suppliers used by replenishment planning, with their purchase activity. */
export default function SupplierList() {
  const fs = useStoredValue(STORAGE_KEYS.FORECAST_SETTINGS, null)
  const drafts = useStoredValue(STORAGE_KEYS.REPLENISHMENT_DRAFTS, [])
  const users = useStoredValue(STORAGE_KEYS.DEMO_USERS, [])
  const canManage = usePermission('suppliers.manage')
  const t = useTableQuery({ sort: 'name' })
  const [editing, setEditing] = useState(null)
  const [errors, setErrors] = useState({})

  const rows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const list = (fs?.suppliers || []).map((s) => {
      const mine = drafts.filter((d) => d.supplierId === s.id)
      return {
        ...s,
        open: mine.filter((d) => ['SUBMITTED', 'APPROVED', 'CONVERTED'].includes(d.status)).length,
        totalValue: mine.filter((d) => !['REJECTED', 'CANCELLED', 'DRAFT'].includes(d.status)).reduce((a, d) => a + (d.estimatedValue || 0), 0),
        portalUsers: users.filter((u) => u.supplierId === s.id).length,
      }
    }).filter((s) => !q || [s.name, s.contactEmail, ...(s.categories || [])].some((v) => String(v || '').toLowerCase().includes(q)))
    return sortRows(list, t.sort, t.dir)
  }, [fs, drafts, users, t.q, t.sort, t.dir])

  const save = () => {
    const res = saveSupplier(editing.id, editing)
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success(`${res.record.name} updated`)
    setEditing(null)
  }
  const onExport = () => {
    const n = downloadCsv(csvFilename('suppliers'), rows, [
      { header: 'Supplier', value: (s) => s.name }, { header: 'Lead time (days)', value: (s) => s.leadTimeDays }, { header: 'Minimum order value', value: (s) => s.minOrderValue },
      { header: 'Categories', value: (s) => (s.categories || []).join('; ') }, { header: 'Contact email', value: (s) => s.contactEmail || '' }, { header: 'Open requests', value: (s) => s.open },
    ])
    if (n) toast.success(`Exported ${n} suppliers`)
  }

  return (
    <>
      <PageHeader title="Suppliers" description="Suppliers used by replenishment planning. Lead times and minimum order values feed reorder recommendations." />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search suppliers…" total={(fs?.suppliers || []).length} filteredCount={rows.length} activeCount={t.q ? 1 : 0} onReset={t.reset} onExport={onExport} />
        <DataTable
          rows={rows}
          pageSize="default"
          sort={t.sort} dir={t.dir} onSort={t.setSort}
          columns={[
            { key: 'name', header: 'Supplier', sortable: true, render: (s) => <span className="flex items-center gap-2"><Factory size={15} className="text-muted" aria-hidden /><span className="font-medium text-ink">{s.name}</span></span> },
            { key: 'categories', header: 'Categories', render: (s) => (s.categories?.length ? <span className="flex flex-wrap gap-1">{s.categories.map((c) => <Badge key={c} tone="neutral">{c}</Badge>)}</span> : <span className="text-muted">All</span>), hideBelow: 'md' },
            { key: 'leadTimeDays', header: 'Lead time', sortable: true, align: 'right', render: (s) => `${s.leadTimeDays} days` },
            { key: 'minOrderValue', header: 'Min order', sortable: true, align: 'right', render: (s) => formatMoney(s.minOrderValue), hideBelow: 'sm' },
            { key: 'open', header: 'Open requests', sortable: true, align: 'right', render: (s) => s.open, hideBelow: 'lg' },
            { key: 'totalValue', header: 'Requested value', sortable: true, align: 'right', render: (s) => formatCompactCurrency(s.totalValue), hideBelow: 'xl' },
            { key: 'portal', header: 'Portal users', align: 'right', render: (s) => s.portalUsers, hideBelow: 'xl' },
            ...(canManage ? [{ key: 'act', header: <span className="sr-only">Edit</span>, align: 'right', render: (s) => <Button size="xs" variant="secondary" icon={Pencil} onClick={() => { setErrors({}); setEditing({ ...s, leadTimeDays: String(s.leadTimeDays), minOrderValue: String(s.minOrderValue), contactEmail: s.contactEmail || '', contactPhone: s.contactPhone || '' }) }}>Edit</Button> }] : []),
          ]}
        />
      </Card>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`Edit ${editing?.name || 'supplier'}`} icon={Factory}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save supplier</Button></>}>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Supplier name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} error={errors.name} required className="sm:col-span-2" />
            <Input label="Lead time (days)" type="number" min="1" value={editing.leadTimeDays} onChange={(e) => setEditing({ ...editing, leadTimeDays: e.target.value })} error={errors.leadTimeDays} required />
            <Input label={`Minimum order value (${currencySymbol()})`} type="number" min="0" value={editing.minOrderValue} onChange={(e) => setEditing({ ...editing, minOrderValue: e.target.value })} error={errors.minOrderValue} />
            <Input label="Contact email" type="email" value={editing.contactEmail} onChange={(e) => setEditing({ ...editing, contactEmail: e.target.value })} error={errors.contactEmail} />
            <Input label="Contact phone" value={editing.contactPhone} onChange={(e) => setEditing({ ...editing, contactPhone: e.target.value })} error={errors.contactPhone} />
          </div>
        )}
      </Modal>
    </>
  )
}
