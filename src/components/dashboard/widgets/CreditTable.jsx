import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import Card, { CardHeader } from '../../common/Card'
import DataTable from '../../common/DataTable'
import Badge from '../../common/Badge'
import { formatCompactCurrency, formatPercent } from '../../../utils/formatters'
import { cn } from '../../../utils/helpers'
import { CREDIT_NEAR_THRESHOLD } from '../../../config/masterData'

const barTone = (u) => (u > 100 ? 'bg-danger' : u >= CREDIT_NEAR_THRESHOLD ? 'bg-warning' : 'bg-[var(--chart-1)]')

export default function CreditTable({ rows, limit = 8, title = 'Customer credit overview', linkTo }) {
  const navigate = useNavigate()
  const columns = [
    { key: 'name', header: 'Customer', render: (r) => (<div><p className="font-medium text-ink">{r.name}</p><p className="text-xs text-muted">{r.city}</p></div>) },
    { key: 'limit', header: 'Limit', align: 'right', hideBelow: 'sm', render: (r) => <span className="whitespace-nowrap">{formatCompactCurrency(r.limit)}</span> },
    { key: 'outstanding', header: 'Outstanding', align: 'right', render: (r) => <span className="whitespace-nowrap">{formatCompactCurrency(r.outstanding)}</span> },
    {
      key: 'utilisation',
      header: 'Utilisation',
      render: (r) => (
        <div className="flex items-center gap-2 min-w-[150px]">
          <div className="h-1.5 flex-1 min-w-12 rounded-full bg-surface-2 overflow-hidden" aria-hidden>
            <div className={cn('h-full rounded-full', barTone(r.utilisation))} style={{ width: `${Math.min(100, r.utilisation)}%` }} />
          </div>
          <span className="w-11 text-right text-xs font-medium tabular text-ink">{formatPercent(r.utilisation)}</span>
          {r.utilisation > 100 && <Badge tone="danger"><AlertTriangle size={11} aria-hidden /> Over</Badge>}
        </div>
      ),
    },
  ]
  return (
    <Card>
      <CardHeader
        title={title}
        subtitle="Active customers, highest utilisation first"
        action={linkTo && <button type="button" onClick={() => navigate(linkTo)} className="text-xs font-medium text-brand hover:underline">Open credit module</button>}
      />
      <DataTable columns={columns} rows={rows.slice(0, limit)} dense />
    </Card>
  )
}
