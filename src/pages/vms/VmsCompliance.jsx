import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarClock, Truck, UserRound, AlertTriangle, Settings2, Save, ShieldCheck, Bell, CalendarX } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import Input from '../../components/common/Input'
import Checkbox from '../../components/common/Checkbox'
import Toggle from '../../components/common/Toggle'
import FormSection, { FormActions } from '../../components/common/FormSection'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import { ExpiryBadge } from '../../components/phase5/Badges'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { usePermission } from '../../hooks/usePermission'
import { useTableQuery } from '../../hooks/useTableQuery'
import { countByState, expiryRegister, saveVmsSettings } from '../../services/complianceService'
import { scanDocumentExpiries } from '../../services/automationService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { EXPIRY_META, VEHICLE_EXPIRY_FIELDS, DRIVER_EXPIRY_FIELDS, VMS_OPTIONS } from '../../config/vmsConfig'
import { formatDate } from '../../utils/formatters'

const ownerPath = (r) => (r.ownerType === 'vehicle' ? `/vms/vehicles/${r.ownerId}/documents` : `/vms/drivers/${r.ownerId}/documents`)

/** Vehicle and driver expiry dashboard with alerts. */
export function DocumentExpiry() {
  const navigate = useNavigate()
  const d = usePhase5Data()
  const [params] = useSearchParams()
  const [alerting, setAlerting] = useState(false)
  const t = useTableQuery({ filters: ['owner', 'state', 'hubId', 'required'] })
  const owner = t.filters.owner || params.get('owner') || 'vehicle'
  useEffect(() => { scanDocumentExpiries() }, [])
  const all = useMemo(() => expiryRegister({ vehicles: d.vehicles, drivers: d.drivers, settings: d.vmsSettings }), [d.vehicles, d.drivers, d.vmsSettings])
  const scoped = all.filter((r) => r.ownerType === owner)
  const rows = scoped
    .filter((r) => (!t.filters.state || r.state === t.filters.state) && (!t.filters.hubId || r.hubId === t.filters.hubId) && (t.filters.required !== 'yes' || r.required)
      && (!t.q || r.ownerName.toLowerCase().includes(t.q.toLowerCase()) || r.label.toLowerCase().includes(t.q.toLowerCase())))
    .sort((a, b) => EXPIRY_META[a.state].rank - EXPIRY_META[b.state].rank || String(a.date).localeCompare(String(b.date)))
    .map((r) => ({ ...r, key: `${r.ownerId}-${r.field}` }))
  const c = countByState(scoped)
  const sendAlerts = async () => {
    setAlerting(true)
    const r = await scanDocumentExpiries()
    setAlerting(false)
    if (r.fired.length) toast.success(`${r.fired.length} new expiry alert${r.fired.length === 1 ? '' : 's'} processed`, { description: 'Per-channel results (demo or provider status) are in Automated Notifications history.' })
    else toast.info('No new alerts — every expiry was already notified once')
  }
  const onExport = () => toast.success(`Exported ${downloadCsv(csvFilename(`expiry-${owner}`), rows, [
    { header: owner === 'vehicle' ? 'Vehicle' : 'Driver', value: (r) => r.ownerName }, { header: 'Document', value: (r) => r.label }, { header: 'Required', value: (r) => (r.required ? 'Yes' : 'No') },
    { header: 'Expiry Date', value: (r) => r.date }, { header: 'State', value: (r) => EXPIRY_META[r.state].label }, { header: 'Days', value: (r) => (r.days ?? '') }, { header: 'Hub', value: (r) => d.lk.hubs[r.hubId]?.name },
  ])} rows`)
  return (
    <>
      <PageHeader title="Document expiry" description={`Expiry dates of vehicle and driver documents. Expired required documents block dispatch assignment${d.vmsSettings.blockOnWarning ? `; documents expiring within ${d.vmsSettings.warningDays} days also block` : ''}.`}
        actions={<Button variant="secondary" icon={Bell} loading={alerting} onClick={sendAlerts}>Send expiry alerts</Button>} />
      <Card className="mb-6"><Tabs value={owner} onChange={(id) => t.setFilter('owner', id)} tabs={[{ id: 'vehicle', label: 'Vehicle documents', icon: Truck }, { id: 'driver', label: 'Driver documents', icon: UserRound }]} /></Card>
      <StatGrid cols={5}>
        <StatCard label="Expired" value={c.EXPIRED} icon={CalendarX} tone="danger" />
        <StatCard label="Expires today" value={c.TODAY} icon={AlertTriangle} tone="danger" />
        <StatCard label="Within 7 days" value={c.WEEK} icon={CalendarClock} tone="warning" />
        <StatCard label="Within 30 days" value={c.MONTH} icon={CalendarClock} tone="accent" />
        <StatCard label="Valid" value={c.VALID} icon={ShieldCheck} tone="success" hint={c.MISSING ? `${c.MISSING} not on record` : undefined} />
      </StatGrid>
      <Card className="mt-6">
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder={`Search ${owner}s or documents…`} total={scoped.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterSelect label="Expiry state" allLabel="All states" value={t.filters.state} onChange={(v) => t.setFilter('state', v)} options={VMS_OPTIONS.expiryStates} />
          <FilterSelect label="Hub" allLabel="All hubs" value={t.filters.hubId} onChange={(v) => t.setFilter('hubId', v)} options={d.hubs.map((h) => ({ value: h.id, label: h.name }))} />
          <FilterSelect label="Required" allLabel="All documents" value={t.filters.required} onChange={(v) => t.setFilter('required', v)} options={[{ value: 'yes', label: 'Required for dispatch' }]} />
        </FilterToolbar>
        <DataTable caption="Expiry register" rows={rows} rowKey="key" pageSize={15} page={t.page} onPageChange={t.setPage} onRowClick={(r) => navigate(ownerPath(r))}
          empty={<EmptyState icon={ShieldCheck} title="Nothing matches" />}
          columns={[
            { key: 'o', header: owner === 'vehicle' ? 'Vehicle' : 'Driver', render: (r) => (<div><p className="font-medium text-ink">{r.ownerName}</p><p className="text-xs text-muted">{d.lk.hubs[r.hubId]?.city}</p></div>) },
            { key: 'l', header: 'Document', render: (r) => <span>{r.label}{r.required && <span className="ml-1.5 text-[11px] font-medium uppercase text-danger">required</span>}</span> },
            { key: 'd', header: 'Expiry date', render: (r) => (r.date ? formatDate(r.date) : <span className="text-muted">Not on record</span>) },
            { key: 's', header: 'State', render: (r) => <ExpiryBadge date={r.date} state={r.date ? undefined : r.state} /> },
          ]}
        />
      </Card>
    </>
  )
}

/** Admin compliance rules used by dispatch assignment validation. */
export function VmsSettings() {
  const d = usePhase5Data()
  const canEdit = usePermission('vms.settings')
  const [v, setV] = useState(() => ({ ...d.vmsSettings, warningDays: String(d.vmsSettings.warningDays) }))
  const [errors, setErrors] = useState({})
  const toggle = (k, code) => setV((x) => ({ ...x, [k]: x[k].includes(code) ? x[k].filter((c) => c !== code) : [...x[k], code] }))
  const save = (e) => {
    e.preventDefault()
    const res = saveVmsSettings(v)
    if (!res.ok) { setErrors(res.errors || {}); toast.error(res.error); return }
    toast.success('Compliance rules saved', { description: 'Dispatch assignment checks use them immediately.' })
  }
  return (
    <>
      <PageHeader title="VMS compliance rules" description="Which documents are required for dispatch, and how strictly expiry blocks assignment." />
      <form onSubmit={save} noValidate className="space-y-6">
        <FormSection title="Required vehicle documents" description="An expired required document always blocks the vehicle (critical)." icon={Truck} columns={3}>
          {VEHICLE_EXPIRY_FIELDS.map((f) => <Checkbox key={f.docCode} label={f.label} checked={v.requiredVehicleDocs.includes(f.docCode)} onChange={() => toggle('requiredVehicleDocs', f.docCode)} disabled={!canEdit} />)}
        </FormSection>
        <FormSection title="Required driver documents" icon={UserRound} columns={3}>
          {DRIVER_EXPIRY_FIELDS.map((f) => <Checkbox key={f.docCode} label={f.label} checked={v.requiredDriverDocs.includes(f.docCode)} onChange={() => toggle('requiredDriverDocs', f.docCode)} disabled={!canEdit} />)}
        </FormSection>
        <FormSection title="Blocking level" icon={Settings2} columns={2}>
          <Toggle label="Block on expired documents (critical)" description="Always on — an expired required document cannot be assigned." checked onChange={() => {}} disabled />
          <Toggle label="Block on warning-level expiry" description="Also block when a required document expires within the warning window of the dispatch date." checked={v.blockOnWarning} onChange={(x) => setV((s) => ({ ...s, blockOnWarning: x }))} disabled={!canEdit} />
          <Input label="Warning window (days)" type="number" min="1" max="90" value={v.warningDays} onChange={(e) => { setV((s) => ({ ...s, warningDays: e.target.value })); setErrors({}) }} error={errors.warningDays} disabled={!canEdit} />
          <Toggle label="Block when a required date is missing" description="Treat a missing expiry date as non-compliant." checked={v.blockOnMissing} onChange={(x) => setV((s) => ({ ...s, blockOnMissing: x }))} disabled={!canEdit} />
        </FormSection>
        {canEdit && <FormActions note="Changes apply to new assignments and to dispatch confirmation checks."><Button type="submit" icon={Save}>Save rules</Button></FormActions>}
      </form>
      <Card className="mt-6"><CardHeader title="Where these rules apply" icon={ShieldCheck} /><p className="text-sm text-muted">Dispatch planning and driver assignment hide blocked drivers and vehicles with the reason, and dispatch confirmation re-checks them. Inactive, under-maintenance and busy vehicles, and inactive drivers or drivers with an expired licence, are always blocked.</p></Card>
    </>
  )
}
