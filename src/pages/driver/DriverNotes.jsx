import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Search, ChevronRight } from 'lucide-react'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import EmptyState from '../../components/common/EmptyState'
import { DeliveryStatusBadge } from '../../components/dispatch/DispatchBadges'
import { NoDriverRecord } from '../../components/driver/DriverUi'
import { useDriverWorkspace } from '../../hooks/useDriverWorkspace'
import { searchDeliveryNotes } from '../../services/deliveryNoteService'
import { formatDateTime, formatNumber } from '../../utils/formatters'

/** The driver's own delivery notes, newest first. */
export default function DriverNotes() {
  const w = useDriverWorkspace()
  const [q, setQ] = useState('')
  if (!w.driver) return <NoDriverRecord />
  const notes = searchDeliveryNotes(q, {}, w.notes).sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1))
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">Delivery notes</h1>
      <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search note, order or customer…" aria-label="Search delivery notes" />
      {notes.length ? (
        <ul className="space-y-2.5">
          {notes.map((n) => (
            <li key={n.id}>
              <Link to={`/driver/delivery-notes/${n.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm hover:border-brand/50">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><FileText size={18} aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink tabular">{n.noteNumber}</p>
                  <p className="text-sm text-ink truncate">{n.customerName}</p>
                  <p className="text-xs text-muted tabular">{n.orderNumber} · {formatNumber(n.totalDelivered)} delivered{n.totalRemaining ? ` · ${formatNumber(n.totalRemaining)} remaining` : ''} · {formatDateTime(n.generatedAt)}</p>
                  <div className="mt-1.5"><DeliveryStatusBadge status={n.deliveryStatus} /></div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : <Card><EmptyState icon={FileText} title={q ? 'No matching delivery notes' : 'No delivery notes yet'} description="A note is generated each time you confirm a delivery." /></Card>}
    </div>
  )
}
