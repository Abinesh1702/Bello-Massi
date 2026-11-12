import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import {
  PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, CheckCircle2, CalendarClock, CalendarDays, ShoppingCart, Plus, Eye, Pencil, Trash2, SearchX,
  Printer, ArrowLeft, StickyNote, AlarmClock, History, ListChecks, Info, UserRound, FilePlus2,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card, { CardHeader } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import InfoList from '../../components/common/InfoList'
import RowActions from '../../components/common/RowActions'
import Tabs from '../../components/common/Tabs'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Textarea from '../../components/common/Textarea'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import Timeline from '../../components/common/Timeline'
import FilterToolbar, { FilterInput, FilterSelect } from '../../components/common/FilterToolbar'
import StatCard, { StatGrid } from '../../components/dashboard/StatCard'
import SingleBarChart from '../../components/dashboard/charts/SingleBarChart'
import StackedBarChart from '../../components/dashboard/charts/StackedBarChart'
import StatusDonutChart from '../../components/dashboard/charts/StatusDonutChart'
import { SERIES } from '../../components/dashboard/charts/chartTheme'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { useAuth } from '../../hooks/useAuth'
import { useTableQuery, sortRows } from '../../hooks/useTableQuery'
import { can as canDo } from '../../config/permissions'
import { STORAGE_KEYS } from '../../utils/constants'
import {
  addCallNote, CALL_DIRECTIONS, CALL_OUTCOMES, CALL_STATUSES, canManageCall, canViewCall, completeFollowUp, deleteCall, followUpBucket, formatDuration,
  OUTCOME_TONE, scheduleFollowUp, STATUS_TONE,
} from '../../services/callService'
import { csvFilename, downloadCsv } from '../../services/csvService'
import { formatDate, formatDateTime, formatPercent } from '../../utils/formatters'

const EMPTY = []
const today = () => dayjs().format('YYYY-MM-DD')
const BUCKET_META = { today: { label: 'Due today', tone: 'warning' }, upcoming: { label: 'Upcoming', tone: 'info' }, overdue: { label: 'Overdue', tone: 'danger' }, completed: { label: 'Completed', tone: 'success' } }

/** Calls visible to the signed-in user (salesmen: their own). */
export const useVisibleCalls = () => {
  const { user } = useAuth()
  const all = useStoredValue(STORAGE_KEYS.CALL_HISTORY, EMPTY)
  return useMemo(() => all.filter((c) => canViewCall(user, c)), [all, user])
}

const SimulationNote = () => (
  <p className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted">
    <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
    <span><strong className="text-ink">SIMULATED CALL LOG.</strong> Calls are recorded manually by users — no telephone system is connected, and calls are not dialled or recorded by this prototype.</span>
  </p>
)

export const DirectionIcon = ({ c }) => {
  if (c.status === 'Missed') return <PhoneMissed size={15} className="text-danger" aria-label="Missed" />
  return c.direction === 'Incoming' ? <PhoneIncoming size={15} className="text-brand" aria-label="Incoming" /> : <PhoneOutgoing size={15} className="text-success" aria-label="Outgoing" />
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export function CallDashboard() {
  const calls = useVisibleCalls()
  const { user } = useAuth()
  const t = today()
  const weekStart = dayjs().startOf('week').format('YYYY-MM-DD')
  const connected = calls.filter((c) => c.status === 'Connected')
  const orders = calls.filter((c) => c.relatedOrderId || c.outcome === 'Order Received')
  const followPending = calls.filter((c) => ['today', 'overdue', 'upcoming'].includes(followUpBucket(c, t)))
  const days = Array.from({ length: 14 }, (_, i) => dayjs().subtract(13 - i, 'day'))
  const byDay = days.map((d) => {
    const dc = calls.filter((c) => c.callDate === d.format('YYYY-MM-DD'))
    return { name: d.format('DD MMM'), incoming: dc.filter((c) => c.direction === 'Incoming').length, outgoing: dc.filter((c) => c.direction === 'Outgoing').length }
  })
  const count = (key) => {
    const m = new Map()
    calls.forEach((c) => m.set(key(c), (m.get(key(c)) || 0) + 1))
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }
  const palette = [SERIES.c1, SERIES.c2, SERIES.c3, SERIES.c4, SERIES.c5, 'var(--muted)', '#94a3b8', '#64748b', '#475569']
  const outcomes = CALL_OUTCOMES.map((o, i) => ({ name: o, key: o, value: calls.filter((c) => c.outcome === o).length, color: palette[i] })).filter((d) => d.value)
  const conversion = connected.length ? (connected.filter((c) => c.relatedOrderId || c.outcome === 'Order Received').length / connected.length) * 100 : 0
  const bySalesman = count((c) => c.salesmanName).map((s) => ({ ...s, orders: calls.filter((c) => c.salesmanName === s.name && (c.relatedOrderId || c.outcome === 'Order Received')).length }))

  return (
    <>
      <PageHeader title="Call History" description="Calls with customers, the follow-ups they need and the orders they produced."
        actions={<>
          <Button variant="secondary" icon={ListChecks} to="/communication/calls/list">All calls</Button>
          <Button variant="secondary" icon={CalendarClock} to="/communication/calls/follow-ups">Follow-ups</Button>
          {canDo(user, 'calls.manage') && <Button icon={Plus} to="/communication/calls/create">Log a call</Button>}
        </>} />
      <SimulationNote />
      <StatGrid cols={4}>
        <StatCard label="Total calls" value={calls.length} icon={PhoneCall} tone="brand" to="/communication/calls/list" />
        <StatCard label="Incoming" value={calls.filter((c) => c.direction === 'Incoming').length} icon={PhoneIncoming} tone="info" to="/communication/calls/list?direction=Incoming" />
        <StatCard label="Outgoing" value={calls.filter((c) => c.direction === 'Outgoing').length} icon={PhoneOutgoing} tone="success" to="/communication/calls/list?direction=Outgoing" />
        <StatCard label="Connected" value={connected.length} icon={CheckCircle2} tone="success" hint={calls.length ? `${formatPercent((connected.length / calls.length) * 100)} of calls` : undefined} to="/communication/calls/list?status=Connected" />
        <StatCard label="Missed" value={calls.filter((c) => c.status === 'Missed').length} icon={PhoneMissed} tone="danger" to="/communication/calls/list?status=Missed" />
        <StatCard label="Follow-ups open" value={followPending.length} icon={AlarmClock} tone="warning" hint={`${calls.filter((c) => followUpBucket(c, t) === 'overdue').length} overdue`} to="/communication/calls/follow-ups" />
        <StatCard label="Today / this week" value={`${calls.filter((c) => c.callDate === t).length} / ${calls.filter((c) => c.callDate >= weekStart).length}`} icon={CalendarDays} tone="neutral" />
        <StatCard label="Orders from calls" value={orders.length} icon={ShoppingCart} tone="accent" hint={`${formatPercent(conversion)} of connected calls`} to="/communication/calls/list?outcome=Order%20Received" />
      </StatGrid>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <StackedBarChart title="Calls by day" subtitle="Last 14 days" data={byDay} series={[{ key: 'incoming', label: 'Incoming', color: SERIES.c2 }, { key: 'outgoing', label: 'Outgoing', color: SERIES.c1 }]} />
        <StatusDonutChart title="Outcome distribution" subtitle="All logged calls by outcome" data={outcomes} centerLabel="calls" linkTo="/communication/calls/list" linkLabel="View calls" />
        <StackedBarChart title="Calls and orders by salesman" subtitle="Call-to-order conversion per salesman" layout="vertical" data={bySalesman.map((s) => ({ name: s.name, orders: s.orders, other: s.value - s.orders }))}
          series={[{ key: 'orders', label: 'Produced an order', color: SERIES.c3 }, { key: 'other', label: 'Other outcome', color: SERIES.c4 }]} />
        <SingleBarChart title="Calls by customer" subtitle="Top 8 customers by number of calls" data={count((c) => c.customerName).slice(0, 8)} seriesName="Calls" />
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */

export function CallList() {
  const calls = useVisibleCalls()
  const { user } = useAuth()
  const t = useTableQuery({ filters: ['direction', 'status', 'outcome', 'salesmanId', 'customerId', 'followUp', 'from', 'to'], sort: 'callDate', dir: 'desc' })
  const [del, setDel] = useState(null)
  const customers = useMemo(() => [...new Map(calls.map((c) => [c.customerId, c.customerName])).entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label)), [calls])
  const salesmen = useMemo(() => [...new Map(calls.map((c) => [c.salesmanId, c.salesmanName])).entries()].map(([value, label]) => ({ value, label })), [calls])

  const rows = useMemo(() => {
    const q = t.q.trim().toLowerCase()
    const f = t.filters
    return sortRows(calls.filter((c) => {
      if (q && ![c.callNumber, c.customerName, c.contactPerson, c.phone, c.salesmanName, c.remarks, c.relatedOrderNumber].some((v) => String(v || '').toLowerCase().includes(q))) return false
      if (f.direction && c.direction !== f.direction) return false
      if (f.status && c.status !== f.status) return false
      if (f.outcome && c.outcome !== f.outcome) return false
      if (f.salesmanId && c.salesmanId !== f.salesmanId) return false
      if (f.customerId && c.customerId !== f.customerId) return false
      if (f.followUp && (f.followUp === 'none' ? c.followUpRequired : followUpBucket(c) !== f.followUp)) return false
      if (f.from && c.callDate < f.from) return false
      if (f.to && c.callDate > f.to) return false
      return true
    }), t.sort, t.dir, { callDate: (c) => `${c.callDate}T${c.callTime}`, durationSeconds: (c) => c.durationSeconds })
  }, [calls, t.q, t.filters, t.sort, t.dir])

  const onExport = () => {
    const n = downloadCsv(csvFilename('call-history'), rows, [
      { header: 'Call ID', value: (c) => c.callNumber }, { header: 'Date', value: (c) => c.callDate }, { header: 'Time', value: (c) => c.callTime },
      { header: 'Customer', value: (c) => c.customerName }, { header: 'Contact', value: (c) => c.contactPerson }, { header: 'Phone', value: (c) => c.phone },
      { header: 'Salesman', value: (c) => c.salesmanName }, { header: 'Direction', value: (c) => c.direction }, { header: 'Duration', value: (c) => formatDuration(c.durationSeconds) },
      { header: 'Status', value: (c) => c.status }, { header: 'Outcome', value: (c) => c.outcome }, { header: 'Follow-up Date', value: (c) => c.followUpDate || '' },
      { header: 'Follow-up Status', value: (c) => c.followUpStatus || '' }, { header: 'Related SO', value: (c) => c.relatedOrderNumber || '' }, { header: 'Remarks', value: (c) => c.remarks },
    ])
    if (n) toast.success(`Exported ${n} calls`)
  }
  const confirmDelete = () => {
    const res = deleteCall(del.id)
    if (!res.ok) toast.error(res.error)
    else toast.success(`${del.callNumber} deleted`)
    setDel(null)
  }

  return (
    <>
      <PageHeader title="All calls" description="Search, filter and export the call log."
        actions={<>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
          {canDo(user, 'calls.manage') && <Button icon={Plus} to="/communication/calls/create">Log a call</Button>}
        </>} />
      <SimulationNote />
      <Card>
        <FilterToolbar query={t.q} onQuery={t.setQuery} placeholder="Search call ID, customer, contact, phone, order…" total={calls.length} filteredCount={rows.length} activeCount={t.activeFilterCount} onReset={t.reset} onExport={onExport}>
          <FilterInput label="From date" type="date" value={t.filters.from} onChange={(e) => t.setFilter('from', e.target.value)} />
          <FilterInput label="To date" type="date" value={t.filters.to} onChange={(e) => t.setFilter('to', e.target.value)} />
          <FilterSelect label="Customer" allLabel="All customers" value={t.filters.customerId} onChange={(v) => t.setFilter('customerId', v)} options={customers} />
          <FilterSelect label="Salesman" allLabel="All salesmen" value={t.filters.salesmanId} onChange={(v) => t.setFilter('salesmanId', v)} options={salesmen} />
          <FilterSelect label="Direction" allLabel="Both directions" value={t.filters.direction} onChange={(v) => t.setFilter('direction', v)} options={CALL_DIRECTIONS.map((v) => ({ value: v, label: v }))} />
          <FilterSelect label="Status" allLabel="All statuses" value={t.filters.status} onChange={(v) => t.setFilter('status', v)} options={CALL_STATUSES.map((v) => ({ value: v, label: v }))} />
          <FilterSelect label="Outcome" allLabel="All outcomes" value={t.filters.outcome} onChange={(v) => t.setFilter('outcome', v)} options={CALL_OUTCOMES.map((v) => ({ value: v, label: v }))} />
          <FilterSelect label="Follow-up" allLabel="Any follow-up" value={t.filters.followUp} onChange={(v) => t.setFilter('followUp', v)} options={[...Object.entries(BUCKET_META).map(([value, m]) => ({ value, label: m.label })), { value: 'none', label: 'No follow-up' }]} />
        </FilterToolbar>
        <DataTable caption="Call history" rows={rows} pageSize={12} page={t.page} onPageChange={t.setPage} sort={t.sort} dir={t.dir} onSort={t.setSort}
          columns={[
            { key: 'callNumber', header: 'Call ID', sortable: true, render: (c) => <Link to={`/communication/calls/${c.id}`} className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline tabular"><DirectionIcon c={c} />{c.callNumber}</Link> },
            { key: 'callDate', header: 'Date / time', sortable: true, render: (c) => <span className="tabular whitespace-nowrap">{formatDate(c.callDate)} <span className="text-muted">{c.callTime}</span></span> },
            { key: 'customerName', header: 'Customer', sortable: true, render: (c) => <div className="min-w-0"><p className="truncate max-w-[180px]">{c.customerName}</p><p className="text-xs text-muted truncate max-w-[180px]">{c.contactPerson} · {c.phone}</p></div> },
            { key: 'salesmanName', header: 'Salesman', sortable: true, hideBelow: 'lg' },
            { key: 'direction', header: 'Direction', sortable: true, hideBelow: 'xl' },
            { key: 'durationSeconds', header: 'Duration', sortable: true, align: 'right', hideBelow: 'md', render: (c) => <span className="tabular">{formatDuration(c.durationSeconds)}</span> },
            { key: 'status', header: 'Status', sortable: true, hideBelow: 'md', render: (c) => <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge> },
            { key: 'outcome', header: 'Outcome', sortable: true, render: (c) => <Badge tone={OUTCOME_TONE[c.outcome]}>{c.outcome}</Badge> },
            { key: 'followUpDate', header: 'Follow-up', sortable: true, hideBelow: 'lg', render: (c) => { const b = followUpBucket(c); return b ? <span className="whitespace-nowrap"><Badge tone={BUCKET_META[b].tone}>{BUCKET_META[b].label}</Badge> <span className="text-xs text-muted tabular">{formatDate(c.followUpDate, 'DD MMM')}</span></span> : <span className="text-muted">—</span> } },
            { key: 'relatedOrderNumber', header: 'Related SO', hideBelow: 'xl', render: (c) => (c.relatedOrderId ? <Link to={`/orders/${c.relatedOrderId}`} className="text-brand hover:underline tabular">{c.relatedOrderNumber}</Link> : <span className="text-muted">—</span>) },
            { key: 'remarks', header: 'Remarks', hideBelow: '2xl', render: (c) => <span className="block max-w-[220px] truncate text-muted">{c.remarks}</span> },
            {
              key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (c) => (
                <RowActions label={`Actions for ${c.callNumber}`} items={[
                  { label: 'View', icon: Eye, to: `/communication/calls/${c.id}` },
                  { label: 'Edit', icon: Pencil, to: `/communication/calls/${c.id}/edit`, hidden: !canManageCall(user, c) },
                  { label: 'Create order', icon: FilePlus2, to: `/orders/create?customerId=${c.customerId}&source=call&callId=${c.id}`, hidden: !canDo(user, 'orders.create') || Boolean(c.relatedOrderId) },
                  { label: 'Delete', icon: Trash2, onClick: () => setDel(c), hidden: !canManageCall(user, c), danger: true },
                ]} />
              ),
            },
          ]}
          empty={<EmptyState icon={SearchX} title={calls.length ? 'No calls match' : 'No calls logged yet'} description={calls.length ? 'Try clearing a filter.' : 'Log calls with customers to track follow-ups and orders.'} action={canDo(user, 'calls.manage') && <Button icon={Plus} to="/communication/calls/create">Log a call</Button>} />}
        />
      </Card>
      <ConfirmDialog open={Boolean(del)} onClose={() => setDel(null)} onConfirm={confirmDelete} tone="danger" title={`Delete ${del?.callNumber || 'call'}?`} confirmLabel="Delete call"
        description="The call, its notes and follow-up are removed from the log. A linked sales order is not affected." />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Follow-up dialogs (shared by detail and follow-up board)            */
/* ------------------------------------------------------------------ */

export function FollowUpDialog({ mode, call, onClose }) {
  const [date, setDate] = useState(call?.followUpDate && call.followUpDate >= today() ? call.followUpDate : dayjs().add(1, 'day').format('YYYY-MM-DD'))
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  if (!call) return null
  const run = () => {
    const res = mode === 'complete' ? completeFollowUp(call.id, { notes: text }) : mode === 'note' ? addCallNote(call.id, text) : scheduleFollowUp(call.id, { date, notes: text })
    if (!res.ok) { setError(res.error); return }
    toast.success({ complete: 'Follow-up completed', note: 'Note added', schedule: 'Follow-up scheduled' }[mode])
    onClose()
  }
  const title = { complete: 'Complete follow-up', note: 'Add a note', schedule: call.followUpRequired && call.followUpStatus === 'Pending' ? 'Reschedule follow-up' : 'Schedule follow-up' }[mode]
  return (
    <Modal open onClose={onClose} title={title} description={`${call.callNumber} · ${call.customerName}`}
      footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={run}>{mode === 'complete' ? 'Mark complete' : mode === 'note' ? 'Add note' : 'Save'}</Button></>}>
      <div className="space-y-4">
        {mode === 'schedule' && <Input label="Follow-up date" type="date" min={call.callDate} value={date} onChange={(e) => { setDate(e.target.value); setError('') }} required />}
        <Textarea label={mode === 'note' ? 'Note' : 'Notes (optional)'} rows={3} maxLength={500} value={text} onChange={(e) => { setText(e.target.value); setError('') }} required={mode === 'note'} />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Detail                                                              */
/* ------------------------------------------------------------------ */

export function CallDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const all = useStoredValue(STORAGE_KEYS.CALL_HISTORY, EMPTY)
  const [dialog, setDialog] = useState(null)
  const [del, setDel] = useState(false)
  const c = all.find((x) => x.id === id)
  if (!c || !canViewCall(user, c)) return <NotFoundRecord entity="call" backTo="/communication/calls/list" />
  const manage = canManageCall(user, c)
  const bucket = followUpBucket(c)
  const createOrderTo = `/orders/create?customerId=${c.customerId}&source=call&callId=${c.id}`
  const onDelete = () => {
    const res = deleteCall(c.id)
    if (!res.ok) { toast.error(res.error); return }
    toast.success(`${c.callNumber} deleted`)
    navigate('/communication/calls/list', { replace: true })
  }
  return (
    <>
      <PageHeader title={c.callNumber} description={`${c.direction} call with ${c.customerName} · ${formatDate(c.callDate)} ${c.callTime}`}
        actions={<>
          <Button variant="ghost" icon={ArrowLeft} to="/communication/calls/list">All calls</Button>
          {manage && <Button variant="secondary" icon={Pencil} to={`/communication/calls/${c.id}/edit`}>Edit</Button>}
          {manage && <Button variant="secondary" icon={CalendarClock} onClick={() => setDialog('schedule')}>{c.followUpRequired && c.followUpStatus === 'Pending' ? 'Reschedule follow-up' : 'Schedule follow-up'}</Button>}
          {manage && c.followUpRequired && c.followUpStatus === 'Pending' && <Button icon={CheckCircle2} onClick={() => setDialog('complete')}>Mark follow-up complete</Button>}
          {c.relatedOrderId ? <Button variant="secondary" icon={ShoppingCart} to={`/orders/${c.relatedOrderId}`}>View {c.relatedOrderNumber}</Button>
            : canDo(user, 'orders.create') && <Button variant="secondary" icon={FilePlus2} to={createOrderTo}>Create sales order</Button>}
          {manage && <Button variant="danger-outline" icon={Trash2} onClick={() => setDel(true)}>Delete</Button>}
        </>}>
        <div className="mt-3 flex flex-wrap gap-2"><Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge><Badge tone={OUTCOME_TONE[c.outcome]}>{c.outcome}</Badge>{bucket && <Badge tone={BUCKET_META[bucket].tone}>Follow-up: {BUCKET_META[bucket].label}</Badge>}</div>
      </PageHeader>
      <SimulationNote />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Call" icon={PhoneCall} />
            <InfoList columns={3} items={[
              { label: 'Call ID', value: c.callNumber }, { label: 'Date', value: formatDate(c.callDate) }, { label: 'Time', value: c.callTime },
              { label: 'Customer', value: canDo(user, 'customers.view') ? <Link className="text-brand hover:underline" to={`/customers/${c.customerId}`}>{c.customerName}</Link> : c.customerName },
              { label: 'Contact person', value: c.contactPerson }, { label: 'Phone', value: c.phone ? <a className="text-brand hover:underline" href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a> : '' },
              { label: 'Salesman', value: c.salesmanName }, { label: 'Direction', value: c.direction }, { label: 'Duration', value: formatDuration(c.durationSeconds) },
              { label: 'Status', value: c.status }, { label: 'Outcome', value: c.outcome },
              { label: 'Related sales order', value: c.relatedOrderId ? <Link className="text-brand hover:underline" to={`/orders/${c.relatedOrderId}`}>{c.relatedOrderNumber}</Link> : 'None' },
              { label: 'Remarks', value: c.remarks, span: 'full' },
              { label: 'Logged by', value: `${c.createdByName || '—'} · ${formatDateTime(c.createdAt)}`, span: 'full' },
            ]} />
          </Card>
          <Card>
            <CardHeader title="Notes & history" icon={History} action={manage && <Button size="sm" variant="secondary" icon={StickyNote} onClick={() => setDialog('note')}>Add note</Button>} />
            <Timeline items={[...c.notes].reverse().map((n) => ({ id: n.id, title: n.text, description: n.byName, at: n.at }))} empty="No notes yet." />
          </Card>
        </div>
        <Card>
          <CardHeader title="Follow-up" icon={AlarmClock} />
          {c.followUpRequired ? (
            <InfoList columns={1} items={[
              { label: 'Status', value: <Badge tone={BUCKET_META[bucket].tone}>{BUCKET_META[bucket].label}</Badge> },
              { label: 'Follow-up date', value: formatDate(c.followUpDate) }, { label: 'Notes', value: c.followUpNotes },
              { label: 'Completed', value: c.followUpCompletedAt ? formatDateTime(c.followUpCompletedAt) : '', hidden: !c.followUpCompletedAt },
            ]} />
          ) : <EmptyState compact icon={CalendarClock} title="No follow-up" description="Schedule one if the customer needs a call back." action={manage && <Button size="sm" variant="secondary" onClick={() => setDialog('schedule')}>Schedule follow-up</Button>} />}
        </Card>
      </div>
      {dialog && <FollowUpDialog mode={dialog} call={c} onClose={() => setDialog(null)} />}
      <ConfirmDialog open={del} onClose={() => setDel(false)} onConfirm={onDelete} tone="danger" title={`Delete ${c.callNumber}?`} confirmLabel="Delete call" description="The call, its notes and follow-up are removed. A linked order is not affected." />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Follow-up board                                                     */
/* ------------------------------------------------------------------ */

export function CallFollowUps() {
  const calls = useVisibleCalls()
  const { user } = useAuth()
  const [tab, setTab] = useState('today')
  const [dialog, setDialog] = useState(null)
  const t = today()
  const groups = Object.fromEntries(Object.keys(BUCKET_META).map((k) => [k, calls.filter((c) => followUpBucket(c, t) === k).sort((a, b) => (k === 'completed' ? (b.followUpCompletedAt || '').localeCompare(a.followUpCompletedAt || '') : (a.followUpDate || '').localeCompare(b.followUpDate || '')))]))
  const rows = groups[tab]
  return (
    <>
      <PageHeader title="Call follow-ups" description="Customers to call back — due today, upcoming, overdue and completed." actions={<Button variant="secondary" icon={PhoneCall} to="/communication/calls">Call dashboard</Button>} />
      <StatGrid cols={4}>
        {Object.entries(BUCKET_META).map(([k, m]) => (
          <StatCard key={k} label={m.label} value={groups[k].length} icon={{ today: AlarmClock, upcoming: CalendarDays, overdue: CalendarClock, completed: CheckCircle2 }[k]} tone={m.tone} />
        ))}
      </StatGrid>
      <Card className="mt-6">
        <Tabs tabs={Object.entries(BUCKET_META).map(([id, m]) => ({ id, label: `${m.label} (${groups[id].length})` }))} value={tab} onChange={setTab} className="mb-4" />
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((c) => {
              const manage = canManageCall(user, c)
              return (
                <li key={c.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link to={`/communication/calls/${c.id}`} className="font-medium text-ink hover:text-brand">{c.customerName}</Link>
                    <p className="text-xs text-muted">{c.callNumber} · {c.contactPerson} · {c.phone} · {c.salesmanName}</p>
                    <p className="text-sm text-muted mt-0.5">{c.followUpNotes || c.remarks}</p>
                    <p className="text-xs mt-0.5"><span className="text-muted">{tab === 'completed' ? 'Completed' : 'Due'}:</span> <span className="tabular">{tab === 'completed' ? formatDateTime(c.followUpCompletedAt) : formatDate(c.followUpDate)}</span></p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {manage && tab !== 'completed' && <Button size="sm" icon={CheckCircle2} onClick={() => setDialog({ mode: 'complete', call: c })}>Complete</Button>}
                    {manage && tab !== 'completed' && <Button size="sm" variant="secondary" icon={CalendarClock} onClick={() => setDialog({ mode: 'schedule', call: c })}>Reschedule</Button>}
                    {manage && <Button size="sm" variant="secondary" icon={StickyNote} onClick={() => setDialog({ mode: 'note', call: c })}>Add note</Button>}
                    {canDo(user, 'orders.create') && !c.relatedOrderId && <Button size="sm" variant="secondary" icon={FilePlus2} to={`/orders/create?customerId=${c.customerId}&source=call&callId=${c.id}`}>Create order</Button>}
                    {canDo(user, 'customers.view') && <Button size="sm" variant="ghost" icon={UserRound} to={`/customers/${c.customerId}`}>Customer</Button>}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : <EmptyState compact icon={CheckCircle2} title={`No ${BUCKET_META[tab].label.toLowerCase()} follow-ups`} />}
      </Card>
      {dialog && <FollowUpDialog mode={dialog.mode} call={dialog.call} onClose={() => setDialog(null)} />}
    </>
  )
}

