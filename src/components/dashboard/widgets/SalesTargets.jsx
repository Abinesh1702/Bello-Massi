import { useMemo, useState } from 'react'
import { Target, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import Card, { CardHeader } from '../../common/Card'
import Button from '../../common/Button'
import Modal from '../../common/Modal'
import Input from '../../common/Input'
import { useStoredValue } from '../../../hooks/useLocalStorage'
import { usePermission } from '../../../hooks/usePermission'
import { getSalesTargets, saveSalesTargets, salesProgress } from '../../../services/roleDashboardService'
import { STORAGE_KEYS } from '../../../utils/constants'
import { currencySymbol, formatCompactCurrency, formatNumber, formatPercent } from '../../../utils/formatters'
import { cn } from '../../../utils/helpers'

function Bar({ pct, expected }) {
  return (
    <div className="relative mt-2 h-2.5 rounded-full bg-surface-2" role="img" aria-label={`${Math.round(pct)}% of target`}>
      <div className={cn('h-full rounded-full', pct >= expected ? 'bg-success' : 'bg-accent')} style={{ width: `${Math.min(100, pct)}%` }} />
      <span className="absolute -top-1 h-4.5 w-0.5 bg-ink/60" style={{ left: `${Math.min(100, expected)}%` }} title="Expected by today" />
    </div>
  )
}

/** Sales Manager: month-to-date progress against monthly targets (approved orders). */
export default function SalesTargets({ orders }) {
  const settings = useStoredValue(STORAGE_KEYS.SETTINGS, null)
  const targets = useMemo(() => getSalesTargets(), [settings]) // eslint-disable-line react-hooks/exhaustive-deps
  const p = useMemo(() => salesProgress(orders, targets), [orders, targets])
  const canEdit = usePermission('sales.targets.manage')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ monthlyValue: '', monthlyOrders: '' })
  const [errors, setErrors] = useState({})

  const open = () => { setForm({ monthlyValue: String(targets.monthlyValue), monthlyOrders: String(targets.monthlyOrders) }); setErrors({}); setEditing(true) }
  const save = () => {
    const res = saveSalesTargets(form)
    if (!res.ok) { setErrors(res.errors || {}); if (!res.errors) toast.error(res.error); return }
    toast.success('Sales targets updated')
    setEditing(false)
  }

  return (
    <Card>
      <CardHeader title="Sales targets" subtitle="This month · approved orders and later · not affected by the period filter" icon={Target}
        action={canEdit && <Button size="xs" variant="ghost" icon={Pencil} onClick={open}>Set targets</Button>} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted">Order value</p>
          <p className="mt-1 text-xl font-semibold text-ink tabular">{formatCompactCurrency(p.value)} <span className="text-sm font-normal text-muted">of {formatCompactCurrency(targets.monthlyValue)}</span></p>
          <Bar pct={p.valuePct} expected={p.expectedPct} />
          <p className="mt-1.5 text-xs text-muted">{formatPercent(p.valuePct)} achieved · run-rate {formatCompactCurrency(p.projectedValue)} by month end</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Orders</p>
          <p className="mt-1 text-xl font-semibold text-ink tabular">{formatNumber(p.orders)} <span className="text-sm font-normal text-muted">of {formatNumber(targets.monthlyOrders)}</span></p>
          <Bar pct={p.ordersPct} expected={p.expectedPct} />
          <p className="mt-1.5 text-xs text-muted">{formatPercent(p.ordersPct)} achieved · marker = expected by today ({formatPercent(p.expectedPct)})</p>
        </div>
      </div>
      {p.bySalesman.length > 0 && (
        <ul className="mt-5 divide-y divide-line border-t border-line text-sm">
          {p.bySalesman.slice(0, 5).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2"><span className="text-ink">{r.name}</span><span className="tabular text-muted">{r.orders} orders · {formatCompactCurrency(r.value)}</span></li>
          ))}
        </ul>
      )}
      <Modal open={editing} onClose={() => setEditing(false)} title="Monthly sales targets" size="sm" icon={Target}
        footer={<><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button onClick={save}>Save targets</Button></>}>
        <div className="grid gap-4">
          <Input label={`Order value target (${currencySymbol()})`} type="number" min="1" value={form.monthlyValue} onChange={(e) => setForm((f) => ({ ...f, monthlyValue: e.target.value }))} error={errors.monthlyValue} required />
          <Input label="Number of orders" type="number" min="1" step="1" value={form.monthlyOrders} onChange={(e) => setForm((f) => ({ ...f, monthlyOrders: e.target.value }))} error={errors.monthlyOrders} required />
        </div>
      </Modal>
    </Card>
  )
}
