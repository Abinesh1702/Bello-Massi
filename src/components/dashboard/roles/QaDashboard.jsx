import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ScanText, PackageX, CalendarClock, Thermometer, XCircle, Snowflake, FileCheck2, Sliders } from 'lucide-react'
import StatCard, { StatGrid } from '../StatCard'
import { QuickActions } from '../QuickAction'
import Card, { CardHeader } from '../../common/Card'
import Badge from '../../common/Badge'
import DataTable from '../../common/DataTable'
import EmptyState from '../../common/EmptyState'
import { useOpsSnapshot } from '../../../hooks/useOpsSnapshot'
import { usePermission } from '../../../hooks/usePermission'
import { qaOps } from '../../../services/roleDashboardService'
import { getSection } from '../../../services/appSettingsService'
import { EXPIRY_META } from '../../../config/vmsConfig'
import { formatDate, formatNumber, formatRelative } from '../../../utils/formatters'

/** QA Manager: inspections, quarantine, expiry and temperature alerts. */
export default function QaDashboard() {
  const snap = useOpsSnapshot()
  const m = useMemo(() => qaOps(snap), [snap])
  const cold = getSection('coldChain')
  const canAdjust = usePermission('inventory.adjustments.manage')
  const canReview = usePermission('documents.review')

  return (
    <div className="space-y-6">
      <StatGrid cols={4}>
        <StatCard label="Inspections pending" value={m.queue.length} compare={snap.previous ? { previous: qaOps(snap.previous).queue.length, invert: true } : undefined} icon={ScanText} tone={m.queue.length ? 'warning' : 'success'} hint={`${m.rejected.length} rejected documents awaiting replacement`} to="/documents/ocr-queue" />
        <StatCard label="Quarantine (damaged stock)" live value={formatNumber(m.damagedQty)} icon={PackageX} tone={m.damagedQty ? 'danger' : 'neutral'} hint={`${m.damaged.length} stock lines on hold`} to="/inventory/stock-adjustments" />
        <StatCard label="Expired documents" live value={m.expired.length} icon={CalendarClock} tone={m.expired.length ? 'danger' : 'success'} hint={`${m.soon.length} expire within the warning window`} to="/vms/document-expiry" />
        <StatCard label="Temperature alerts" value="—" icon={Thermometer} tone="neutral" hint="No sensor feed connected" />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Inspection queue" subtitle="Documents waiting for OCR review and verification" icon={FileCheck2} action={<Link to="/documents/ocr-queue" className="text-xs font-medium text-brand hover:underline">OCR queue</Link>} />
          <DataTable
            dense
            rows={m.queue.slice(0, 8)}
            empty={<EmptyState compact icon={FileCheck2} title="Queue is empty" description="Every uploaded document has been reviewed." />}
            columns={[
              { key: 'n', header: 'Document', render: (d) => <Link to={canReview ? `/documents/${d.id}/review` : `/documents/${d.id}`} className="font-medium text-ink hover:underline">{d.name}</Link> },
              { key: 't', header: 'Type', render: (d) => d.typeName || d.typeCode, hideBelow: 'md' },
              { key: 'e', header: 'Linked to', render: (d) => d.entityLabel || d.entityType, hideBelow: 'sm' },
              { key: 'u', header: 'Uploaded', render: (d) => formatRelative(d.uploadedAt || d.createdAt), hideBelow: 'sm' },
            ]}
          />
        </Card>
        <QuickActions
          actions={[
            canReview && { icon: ScanText, label: 'Review documents', description: 'OCR review, verify or reject', to: '/documents/ocr-queue', accent: true },
            canAdjust && { icon: Sliders, label: 'Quarantine stock', description: 'Record damaged / held stock', to: '/inventory/stock-adjustments/create' },
            { icon: CalendarClock, label: 'Document expiry', description: 'Vehicles & drivers', to: '/vms/document-expiry' },
          ].filter(Boolean)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Quarantine" subtitle="Current stock lines holding damaged quantity" icon={PackageX} />
          <DataTable
            dense
            rows={m.damaged.slice(0, 6)}
            empty={<EmptyState compact icon={PackageX} title="Nothing in quarantine" description="Damaged adjustments place stock on hold here." />}
            columns={[
              { key: 'p', header: 'Product', render: (r) => <Link to={`/inventory/stock/${r.id}`} className="font-medium text-ink hover:underline">{r.productName}</Link> },
              { key: 'h', header: 'Hub', render: (r) => r.hubName, hideBelow: 'sm' },
              { key: 'q', header: 'Damaged', align: 'right', render: (r) => `${formatNumber(r.damagedQuantity)} ${r.unit}` },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Expiry" subtitle="Vehicle & driver documents (expired first)" icon={CalendarClock} />
          <DataTable
            dense
            rows={[...m.expired, ...m.soon].slice(0, 6).map((r, i) => ({ ...r, id: `${r.ownerId}-${r.field}-${i}` }))}
            empty={<EmptyState compact icon={CalendarClock} title="No documents due" description="All tracked documents are valid." />}
            columns={[
              { key: 'o', header: 'Owner', render: (r) => r.ownerName },
              { key: 'l', header: 'Document', render: (r) => r.label, hideBelow: 'sm' },
              { key: 'd', header: 'Expiry', render: (r) => formatDate(r.date) },
              { key: 's', header: 'State', render: (r) => <Badge tone={EXPIRY_META[r.state]?.tone}>{EXPIRY_META[r.state]?.label}</Badge> },
            ]}
          />
          <p className="mt-3 text-xs text-muted">Product batch / lot expiry is not tracked in stock yet, so no product expiry is shown.</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Cold chain & temperature alerts" subtitle="Configured ranges from Application Settings › Cold Chain" icon={Snowflake} action={<Badge tone="neutral">No sensor integration</Badge>} />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-line p-4">
            <p className="text-xs font-medium text-muted">Frozen range</p>
            <p className="mt-1 text-lg font-semibold text-ink tabular">{cold.frozenMin}°C to {cold.frozenMax}°C</p>
            <p className="mt-1 text-xs text-muted">{m.coldItems.filter((p) => p.storageCondition === 'Frozen').length} active frozen products</p>
          </div>
          <div className="rounded-lg border border-line p-4">
            <p className="text-xs font-medium text-muted">Chilled range</p>
            <p className="mt-1 text-lg font-semibold text-ink tabular">{cold.chilledMin}°C to {cold.chilledMax}°C</p>
            <p className="mt-1 text-xs text-muted">{m.coldItems.filter((p) => p.storageCondition === 'Chilled').length} active chilled products</p>
          </div>
          <div className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
            <p className="flex items-center gap-1.5 font-medium text-ink"><XCircle size={15} aria-hidden /> No live readings</p>
            <p className="mt-1">Temperature alerts need data loggers or reefer telematics connected through the integration gateway. Excursions above {cold.excursionToleranceMinutes} minutes would be raised here.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
