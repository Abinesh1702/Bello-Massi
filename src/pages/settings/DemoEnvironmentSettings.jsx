import { useMemo, useRef, useState } from 'react'
import { Database, Download, FlaskConical, HardDrive, RotateCcw, Upload, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import storage from '../../services/storageService'
import { getDatasetSummary } from '../../services/demoDataService'
import { useDashboardData } from '../../hooks/useDashboardData'
import { useMasterData } from '../../hooks/useMasterData'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { MAX_IMPORT_BYTES, STORAGE_KEYS } from '../../utils/constants'
import { downloadJson, readFileAsText } from '../../utils/helpers'
import { formatBytes, formatDateTime, formatPercent } from '../../utils/formatters'
import { usePermission } from '../../hooks/usePermission'
import { can } from '../../config/permissions'
import { getCurrentUser } from '../../services/authService'
import { syncCatalog } from '../../services/rbacService'
import { applyRuntimeConfig } from '../../services/appSettingsService'
import { logAudit } from '../../services/auditService'

export default function DemoEnvironmentSettings() {
  const { data, users } = useDashboardData()
  const master = useMasterData()
  const version = useStoredValue(STORAGE_KEYS.APP_VERSION, {})
  const approvals = useStoredValue(STORAGE_KEYS.APPROVALS, [])
  const consolidations = useStoredValue(STORAGE_KEYS.CONSOLIDATIONS, [])
  const timeline = useStoredValue(STORAGE_KEYS.ORDER_TIMELINE, [])
  const dispatches = useStoredValue(STORAGE_KEYS.DISPATCHES, [])
  const deliveries = useStoredValue(STORAGE_KEYS.DELIVERIES, [])
  const deliveryNotes = useStoredValue(STORAGE_KEYS.DELIVERY_NOTES, [])
  const documents = useStoredValue(STORAGE_KEYS.DOCUMENTS, [])
  const invoices = useStoredValue(STORAGE_KEYS.INVOICES, [])
  const emailHistory = useStoredValue(STORAGE_KEYS.EMAIL_HISTORY, [])
  const whatsappMessages = useStoredValue(STORAGE_KEYS.WHATSAPP_MESSAGES, [])
  const forecasts = useStoredValue(STORAGE_KEYS.FORECASTS, [])
  const insights = useStoredValue(STORAGE_KEYS.AI_INSIGHTS, [])
  const replenishments = useStoredValue(STORAGE_KEYS.REPLENISHMENT_DRAFTS, [])
  // Recompute usage whenever any stored data changes
  const usage = useMemo(() => storage.getStorageUsage(), [data, users, version]) // eslint-disable-line react-hooks/exhaustive-deps
  const summary = getDatasetSummary(data, users)
  const fileRef = useRef(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState(null) // { payload, summary, fileName }
  const [busy, setBusy] = useState(false)
  const canImport = usePermission('data.import')
  const afterBulkChange = () => { syncCatalog(); applyRuntimeConfig() }

  const onExport = () => {
    const payload = storage.exportAppData()
    downloadJson(payload, `bellomassi-demo-backup-${new Date().toISOString().slice(0, 10)}.json`)
    toast.success('Backup exported', { description: 'A JSON file with all demo data was downloaded.' })
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) return toast.error('File is too large for a demo backup (max 4 MB).')
    try {
      const text = await readFileAsText(file)
      let payload
      try {
        payload = JSON.parse(text)
      } catch {
        return toast.error('Import failed', { description: 'The file is not valid JSON.' })
      }
      const check = storage.validateImportPayload(payload)
      if (!check.ok) return toast.error('Import failed', { description: check.errors.slice(0, 3).join(' ') })
      setPendingImport({ payload, summary: check.summary, fileName: file.name })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const doImport = () => {
    if (!can(getCurrentUser(), 'data.import')) { setPendingImport(null); return toast.error('Your role does not have the Import permission.') }
    setBusy(true)
    const res = storage.importAppData(pendingImport.payload)
    if (res.ok) { afterBulkChange(); logAudit({ action: 'IMPORT', module: 'settings', entity: 'Backup', recordLabel: pendingImport.fileName, description: `Imported backup ${pendingImport.fileName}${res.summary?.migratedFrom ? ` (upgraded from data version ${res.summary.migratedFrom})` : ''}.` }) }
    setBusy(false)
    setPendingImport(null)
    if (!res.ok) return toast.error('Import failed', { description: res.errors.join(' ') })
    toast.success('Demo data imported', { description: `${res.summary.customers} customers, ${res.summary.products} products and ${res.summary.stockLines} stock lines restored${res.summary.migratedFrom ? ` (upgraded from data version ${res.summary.migratedFrom})` : ''}.` })
  }

  const doReset = () => {
    if (!can(getCurrentUser(), 'data.import')) { setConfirmReset(false); return toast.error('Your role does not have permission to reset demo data.') }
    setBusy(true)
    const res = storage.resetDemoData()
    if (res.ok) { afterBulkChange(); logAudit({ action: 'RESET', module: 'settings', entity: 'Demo data', recordLabel: 'All demo data', description: 'Demo data was reset to the sample dataset.' }) }
    setBusy(false)
    setConfirmReset(false)
    if (!res.ok) return toast.error(res.error)
    toast.success('Demo data reset', { description: 'Fresh sample data has been loaded. Your theme was kept.' })
  }

  const stats = [
    ['Users', summary.users], ['Customers', summary.customers], ['Products', summary.products], ['Hubs', summary.hubs],
    ['Zones', summary.zones], ['Drivers', summary.drivers], ['Orders', summary.orders], ['Stock lines', summary.stockRows],
    ['Approval decisions', approvals.length], ['Consolidations', consolidations.length], ['Timeline events', timeline.length],
    ['Dispatches', dispatches.length], ['Delivery stops', deliveries.length], ['Delivery notes', deliveryNotes.length],
    ['Documents', documents.length], ['Invoices', invoices.length], ['Emails', emailHistory.length], ['WhatsApp messages', whatsappMessages.length],
    ['Roles', (storage.getItem(STORAGE_KEYS.ROLES, []) || []).length], ['Audit entries', (storage.getItem(STORAGE_KEYS.AUDIT_LOGS, []) || []).length],
    ['Forecasts', forecasts.length], ['AI insights', insights.length], ['Replenishment drafts', replenishments.length],
    ['Stock receipts', master.receipts.length], ['Stock transfers', master.transfers.length], ['Adjustments', master.adjustments.length], ['Movements', master.movements.length],
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Prototype status" icon={FlaskConical} action={<Badge tone="accent" dot>Demo prototype</Badge>} />
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-muted">Storage</p>
            <p className="mt-1 flex items-center gap-1.5 font-medium text-ink">
              {usage.persistent ? <><CheckCircle2 size={15} className="text-success" /> Browser LocalStorage</> : <><AlertTriangle size={15} className="text-warning" /> In-memory only (this tab)</>}
            </p>
          </div>
          <div className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-muted">Data seeded</p>
            <p className="mt-1 font-medium text-ink">{formatDateTime(summary.seededAt)}</p>
          </div>
          <div className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-muted">Data version</p>
            <p className="mt-1 font-medium text-ink">v{version.dataVersion ?? '—'}{version.lastResetAt ? ` · reset ${formatDateTime(version.lastResetAt)}` : ''}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line px-3 py-2">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="text-lg font-semibold text-ink tabular">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <CardHeader title="Backup & restore" subtitle="Move demo data between browsers or keep a snapshot before a client walkthrough." icon={Database} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line p-4 flex flex-col">
            <p className="text-sm font-semibold text-ink">Export data</p>
            <p className="text-xs text-muted mt-1 mb-4">Download every demo record as a JSON backup. Your session is not included.</p>
            <Button className="mt-auto" variant="secondary" icon={Download} onClick={onExport}>Export JSON</Button>
          </div>
          <div className="rounded-xl border border-line p-4 flex flex-col">
            <p className="text-sm font-semibold text-ink">Import data</p>
            <p className="text-xs text-muted mt-1 mb-4">Restore a previous export. The file is validated before anything is replaced.</p>
            <Button className="mt-auto" variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()} disabled={!canImport} title={canImport ? undefined : 'Needs the Import permission'}>Import JSON</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={onFile} aria-label="Choose a backup file to import" />
          </div>
          <div className="rounded-xl border border-danger/30 p-4 flex flex-col">
            <p className="text-sm font-semibold text-ink">Reset demo data</p>
            <p className="text-xs text-muted mt-1 mb-4">Replace all data with fresh sample data. Profile edits and changes are lost.</p>
            <Button className="mt-auto" variant="danger-outline" icon={RotateCcw} onClick={() => setConfirmReset(true)} disabled={!canImport} title={canImport ? undefined : 'Needs the Import permission'}>Reset demo data</Button>
            {!canImport && <p className="mt-2 text-xs text-muted">Import and reset need the Settings › Import permission (Administrator).</p>}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="LocalStorage usage" subtitle={`${formatBytes(usage.totalBytes)} of about ${formatBytes(usage.quotaBytes)} available to this site`} icon={HardDrive} />
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(usage.percent)} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
          <div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${Math.max(1, usage.percent)}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted">{formatPercent(usage.percent, 1)} used (estimate)</p>
        <ul className="mt-4 divide-y divide-line">
          {usage.keys.map((k) => (
            <li key={k.key} className="flex items-center justify-between py-2 text-sm">
              <code className="text-xs text-ink">{k.key}</code>
              <span className="text-xs text-muted tabular">{formatBytes(k.bytes)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={doReset}
        loading={busy}
        tone="danger"
        title="Reset all demo data?"
        description="Users, customers, products, hubs, stock, orders, dispatches, documents (metadata), invoices, communication history, activity and notifications will be replaced with fresh sample data. Export a backup first if you want to keep your changes."
        confirmLabel="Reset data"
      />
      <ConfirmDialog
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        onConfirm={doImport}
        loading={busy}
        title="Replace current data with this backup?"
        description={pendingImport ? `${pendingImport.fileName} passed validation. Current demo data will be replaced.` : ''}
        confirmLabel="Import backup"
      >
        {pendingImport && (
          <dl className="grid grid-cols-3 gap-2 text-sm">
            {Object.entries(pendingImport.summary).filter(([k]) => k !== 'exportedAt').map(([k, v]) => (
              <div key={k} className="rounded-lg bg-surface-2 px-3 py-2">
                <dt className="text-xs text-muted capitalize">{k}</dt>
                <dd className="font-semibold text-ink tabular">{v}</dd>
              </div>
            ))}
            <div className="col-span-3 text-xs text-muted">Exported {formatDateTime(pendingImport.summary.exportedAt)}</div>
          </dl>
        )}
      </ConfirmDialog>
    </div>
  )
}
