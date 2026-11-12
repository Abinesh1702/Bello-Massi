import { MapPin, Phone, Truck } from 'lucide-react'
import { StatusBadge } from '../../common/Badge'
import EmptyState from '../../common/EmptyState'
import { formatAddress } from '../../../services/customerService'

/** Driver stop list (mobile-first). */
export default function StopList({ stops, emptyTitle = 'No deliveries scheduled' }) {
  if (!stops.length) return <EmptyState compact icon={Truck} title={emptyTitle} />
  return (
    <ol className="space-y-2.5">
      {stops.map((o, i) => (
        <li key={o.id} className="flex gap-3 rounded-xl border border-line p-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-white text-sm font-semibold dark:bg-accent dark:text-navy tabular">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-ink">{o.customerName}</p>
              <StatusBadge status={o.status} />
            </div>
            <p className="mt-1 flex items-start gap-1.5 text-xs text-muted"><MapPin size={13} className="mt-px shrink-0" aria-hidden />{formatAddress(o.customer)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="tabular">{o.ref}</span>
              <span>{o.totalQuantity} ctn</span>
              {o.customer?.mobile && (
                <a href={`tel:${o.customer.mobile.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
                  <Phone size={12} aria-hidden /> {o.customer.contactPerson}
                </a>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
