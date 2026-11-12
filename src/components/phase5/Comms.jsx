import { Link } from 'react-router-dom'
import { FlaskConical, PlugZap, Server, Info } from 'lucide-react'
import Select from '../common/Select'
import { IntegrationModeBadge } from './Badges'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../config/roles'
import { TEMPLATE_VARIABLES } from '../../config/communicationConfig'
import { INTEGRATION_MODE, INTEGRATION_MODE_META, GATEWAY_CONFIGURED } from '../../config/integrationConfig'
import { scopeOf } from '../../services/rbacService'

/** Records the current user may reference in a message (salesmen: own customers / orders only). */
export const useMessageContext = () => {
  const d = usePhase5Data()
  const { user } = useAuth()
  const own = scopeOf(user) === ROLES.SALESMAN
  const customers = own ? d.customers.filter((c) => c.salesRepId === user.id) : d.customers
  const orders = d.orders.filter((o) => o.orderNumber && (!own || o.salesmanId === user.id || o.createdBy === user.id))
  const orderIds = new Set(orders.map((o) => o.id))
  return {
    d, customers, orders,
    invoices: d.invoices.filter((i) => !own || orderIds.has(i.orderId)),
    notes: d.notes.filter((n) => !own || orderIds.has(n.orderId)),
    dispatches: d.dispatches.filter((x) => !own || x.orderIds.some((id) => orderIds.has(id))),
  }
}

/** Customer / order / dispatch / invoice / delivery note selects. value: { customerId, orderId, dispatchId, invoiceId, deliveryNoteId } */
export function ContextPicker({ value, onChange, show = ['customerId', 'orderId', 'invoiceId', 'deliveryNoteId'] }) {
  const ctx = useMessageContext()
  const set = (k, v) => {
    const next = { ...value, [k]: v }
    // Picking a related record fills in its customer / order
    if (k === 'orderId' && v) next.customerId = ctx.d.lk.orders[v]?.customerId || next.customerId
    if (k === 'invoiceId' && v) { const i = ctx.d.lk.invoices[v]; next.orderId = i?.orderId || next.orderId; next.customerId = i?.customerId || next.customerId }
    if (k === 'deliveryNoteId' && v) { const n = ctx.d.lk.notes[v]; next.orderId = n?.orderId || next.orderId; next.customerId = n?.customerId || next.customerId; next.dispatchId = n?.dispatchId || next.dispatchId }
    if (k === 'customerId' && value.orderId && ctx.d.lk.orders[value.orderId]?.customerId !== v) next.orderId = ''
    onChange(next)
  }
  const ordersFor = ctx.orders.filter((o) => !value.customerId || o.customerId === value.customerId)
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {show.includes('customerId') && <Select label="Related customer" placeholder="None" value={value.customerId || ''} onChange={(e) => set('customerId', e.target.value)} options={ctx.customers.map((c) => ({ value: c.id, label: c.name }))} />}
      {show.includes('orderId') && <Select label="Related order" placeholder="None" value={value.orderId || ''} onChange={(e) => set('orderId', e.target.value)} options={ordersFor.map((o) => ({ value: o.id, label: `${o.orderNumber} · ${o.customerName}` }))} />}
      {show.includes('dispatchId') && <Select label="Related dispatch" placeholder="None" value={value.dispatchId || ''} onChange={(e) => set('dispatchId', e.target.value)} options={ctx.dispatches.filter((x) => !value.orderId || x.orderIds.includes(value.orderId)).map((x) => ({ value: x.id, label: `${x.dispatchNumber} · ${x.driverName || 'no driver'}` }))} />}
      {show.includes('invoiceId') && <Select label="Related invoice" placeholder="None" value={value.invoiceId || ''} onChange={(e) => set('invoiceId', e.target.value)} options={ctx.invoices.filter((i) => !value.customerId || i.customerId === value.customerId).map((i) => ({ value: i.id, label: `${i.invoiceNumber} · ${i.customerSnapshot.name}` }))} />}
      {show.includes('deliveryNoteId') && <Select label="Related delivery note" placeholder="None" value={value.deliveryNoteId || ''} onChange={(e) => set('deliveryNoteId', e.target.value)} options={ctx.notes.filter((n) => !value.customerId || n.customerId === value.customerId).map((n) => ({ value: n.id, label: `${n.noteNumber} · ${n.customerName}` }))} />}
    </div>
  )
}

export function VariableHelp({ onInsert }) {
  return (
    <details className="rounded-lg border border-line px-3 py-2 text-xs">
      <summary className="cursor-pointer font-medium text-ink">Template variables</summary>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TEMPLATE_VARIABLES.map((v) => (
          <button key={v.key} type="button" onClick={() => onInsert?.(`{{${v.key}}}`)} className="rounded-md bg-surface-2 px-2 py-1 font-mono text-[11px] text-ink hover:bg-brand/10" title={`${v.label} — e.g. ${v.sample}`}>{`{{${v.key}}}`}</button>
        ))}
      </div>
      <p className="mt-2 text-muted">Values come from the selected customer, order, dispatch, invoice or delivery note.</p>
    </details>
  )
}

/** Banner that states plainly whether a channel is simulated or real. */
export function IntegrationBanner({ mode, channel, settingsPath }) {
  const demo = mode === INTEGRATION_MODE.DEMO
  const Icon = demo ? FlaskConical : mode === INTEGRATION_MODE.CONNECTED ? PlugZap : Server
  return (
    <div className={`mb-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3 ${demo ? 'border-accent/50 bg-accent/10' : mode === INTEGRATION_MODE.CONNECTED ? 'border-success/40 bg-success/10' : 'border-info/40 bg-info/10'}`} role="status">
      <div className="flex gap-2.5">
        <Icon size={18} className="mt-0.5 shrink-0 text-ink" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-ink">{channel}: {INTEGRATION_MODE_META[mode]?.label}</p>
          <p className="text-xs text-muted">{demo ? `Simulated — messages are recorded as “demo” and nothing is sent. ${GATEWAY_CONFIGURED ? 'A backend gateway is configured; switch to backend mode in settings to send for real.' : 'Real sending needs the backend integration gateway (VITE_INTEGRATION_GATEWAY_URL).'}` : INTEGRATION_MODE_META[mode]?.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2"><IntegrationModeBadge mode={mode} />{settingsPath && <Link to={settingsPath} className="text-xs font-medium text-brand hover:underline">Settings</Link>}</div>
    </div>
  )
}

export const DemoNote = ({ children }) => <p className="flex gap-1.5 text-xs text-muted"><Info size={13} className="mt-0.5 shrink-0" aria-hidden />{children}</p>
