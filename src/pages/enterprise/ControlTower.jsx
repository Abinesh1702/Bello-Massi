import { useState } from 'react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { Siren, Truck, ThermometerSnowflake, Boxes, Wallet, ClipboardCheck, Ticket, ShoppingCart, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import FilterToolbar, { FilterSelect } from '../../components/common/FilterToolbar'
import { KpiGrid, SimpleTable, useStoreTick } from '../../components/enterprise/ui'
import { computeAlerts, logisticsKpis, qaKpis, raiseExceptionsFromAlerts } from '../../services/enterprise/analyticsService'
import { read } from '../../services/enterprise/recordService'
import { labelFor } from '../../services/enterprise/lookupService'
import { STORAGE_KEYS as K } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../config/permissions'
import { formatDateTime } from '../../utils/formatters'

const SEV_TONE = { Critical: 'danger', High: 'warning', Normal: 'info', Low: 'neutral' }

/** Operations control tower: live KPIs, alert centre computed from records, SLA status and exception management. */
export default function ControlTower() {
  useStoreTick()
  const { user } = useAuth()
  const [area, setArea] = useState('')
  const [sev, setSev] = useState('')
  const [q, setQ] = useState('')
  const alerts = computeAlerts()
  const lg = logisticsKpis()
  const qa = qaKpis()
  const exceptions = read(K.OPERATIONAL_EXCEPTIONS).filter((e) => !['CLOSED'].includes(e.status))
  const tickets = read(K.SERVICE_TICKETS).filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status))
  const breached = tickets.filter((t) => dayjs().isAfter(dayjs(t.slaDueAt)))
  const shown = alerts.filter((a) => (!area || a.area === area) && (!sev || a.severity === sev) && (!q || `${a.title} ${a.detail}`.toLowerCase().includes(q.toLowerCase())))
  const areas = [...new Set(alerts.map((a) => a.area))]
  const count = (a) => alerts.filter((x) => x.area === a).length
  const raise = () => {
    const r = raiseExceptionsFromAlerts(user)
    toast.success(r.created ? `${r.created} exception(s) raised from high / critical alerts` : 'Every high / critical alert already has an open exception')
  }
  return (
    <div data-testid="control-tower">
      <PageHeader title="Operations Control Tower" description="Live picture across logistics, inventory, quality, finance and service — computed from records each time the data changes. Temperatures shown are manual or simulated readings; no live sensors are connected."
        actions={can(user, 'operations.exceptions.manage') && <Button icon={Siren} onClick={raise} data-testid="raise-exceptions">Raise exceptions from alerts</Button>} />
      <KpiGrid cols={4} items={[
        { label: 'Alerts (all)', value: alerts.length, icon: AlertTriangle, tone: alerts.some((a) => a.severity === 'Critical') ? 'danger' : 'warning' },
        { label: 'Open exceptions', value: exceptions.length, icon: Siren, to: '/operations/exceptions', hint: `${exceptions.filter((e) => e.status === 'ESCALATED').length} escalated` },
        { label: 'On-time delivery', value: `${lg.onTimePct}%`, icon: Truck, to: '/logistics/dashboard', hint: `${lg.failed} failed · ${lg.inTransit} in transit` },
        { label: 'Temperature excursions', value: qa.excursions, icon: ThermometerSnowflake, to: '/qa/temperature?status=EXCURSION', tone: qa.excursions ? 'danger' : 'success' },
        { label: 'Lots blocked (QA / expiry)', value: qa.lotsBlocked, icon: ClipboardCheck, to: '/inventory/batches?qa=blocked' },
        { label: 'Stock alerts', value: count('Inventory'), icon: Boxes, to: '/inventory/low-stock' },
        { label: 'Overdue receivables', value: count('Finance'), icon: Wallet, to: '/finance/receivables' },
        { label: 'Tickets past SLA', value: breached.length, icon: Ticket, to: '/service/tickets', tone: breached.length ? 'danger' : 'success', hint: `${tickets.length} open` },
      ]} />
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Alert centre" subtitle="Click an alert to open the record. High / critical alerts can be raised as exceptions (no duplicates)." icon={AlertTriangle} />
          <FilterToolbar query={q} onQuery={setQ} placeholder="Search alerts…" total={alerts.length} filteredCount={shown.length} activeCount={[area, sev].filter(Boolean).length} onReset={() => { setArea(''); setSev(''); setQ('') }}>
            <FilterSelect label="Area" value={area} onChange={setArea} allLabel="All areas" options={areas.map((a) => ({ value: a, label: `${a} (${count(a)})` }))} />
            <FilterSelect label="Severity" value={sev} onChange={setSev} allLabel="All severities" options={['Critical', 'High', 'Normal'].map((s) => ({ value: s, label: s }))} />
          </FilterToolbar>
          <SimpleTable caption="Alerts" columns={[{ key: 'title', header: 'Alert' }, { key: 'detail', header: 'Detail' }, { key: 'area', header: 'Area' }, { key: 'severity', header: 'Severity', render: (a) => <Badge tone={SEV_TONE[a.severity]} dot>{a.severity}</Badge> }]} rows={shown} rowTo={(a) => a.link} max={40} empty="No alerts match." />
        </Card>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Open exceptions" icon={Siren} action={<Button size="xs" variant="secondary" to="/operations/exceptions">All</Button>} />
            <SimpleTable columns={[{ key: 'title', header: 'Exception' }, { key: 'status', header: 'Status' }, { key: 'assignedTo', header: 'Owner', render: (e) => (e.assignedTo ? labelFor('users', e.assignedTo) : '—') }]} rows={exceptions} rowTo={(e) => `/operations/exceptions/${e.id}`} max={8} empty="No open exceptions." />
          </Card>
          <Card>
            <CardHeader title="SLA watch" icon={Ticket} />
            <SimpleTable columns={[{ key: 'number', header: 'Ticket' }, { key: 'priority', header: 'Priority' }, { key: 'slaDueAt', header: 'Due', render: (t) => <span className={dayjs().isAfter(dayjs(t.slaDueAt)) ? 'font-medium text-danger' : ''}>{formatDateTime(t.slaDueAt)}</span> }]} rows={[...tickets].sort((a, b) => String(a.slaDueAt).localeCompare(b.slaDueAt))} rowTo={(t) => `/service/tickets/${t.id}`} max={6} empty="No open tickets." />
          </Card>
          <Card>
            <CardHeader title="Supply" icon={ShoppingCart} />
            <SimpleTable columns={[{ key: 'title', header: 'Purchase orders overdue' }]} rows={alerts.filter((a) => a.area === 'Procurement')} rowTo={(a) => a.link} max={5} empty="No overdue POs." />
          </Card>
        </div>
      </div>
    </div>
  )
}
