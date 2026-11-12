import { ShieldCheck, ShieldAlert } from 'lucide-react'
import Logo from '../common/Logo'
import { DELIVERY_STATUS_META } from '../../config/dispatchConfig'
import { formatDate, formatDateTime, formatNumber } from '../../utils/formatters'
import { appConfig } from '../../config/appConfig'

const Field = ({ label, children }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted print:text-slate-500">{label}</p>
    <p className="mt-0.5 text-sm text-ink print:text-black break-words">{children || '—'}</p>
  </div>
)

/** Printable delivery note. Rendered inside `.print-area` so only the document prints. */
export default function DeliveryNoteDocument({ note, pod = null }) {
  const status = DELIVERY_STATUS_META[note.deliveryStatus]?.label || note.deliveryStatus
  const verified = note.otpStatus === 'Verified'
  return (
    <article className="print-area mx-auto max-w-4xl rounded-2xl border border-line bg-surface p-5 sm:p-8 shadow-card print:shadow-none print:border-0 print:p-0 print:bg-white" aria-label={`Delivery note ${note.noteNumber}`}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-navy pb-4 dark:border-[#4453a8] print:border-black">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-navy p-2"><Logo className="h-9 w-auto" /></div>
          <div>
            <p className="text-lg font-bold text-ink print:text-black">{appConfig.name}</p>
            <p className="text-xs text-muted print:text-slate-600">{note.hubName} · {appConfig.subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted print:text-slate-600">Delivery note</p>
          <p className="text-xl font-bold text-ink tabular print:text-black" data-testid="note-number">{note.noteNumber}</p>
          <p className="text-xs text-muted print:text-slate-600">Generated {formatDateTime(note.generatedAt)}</p>
        </div>
      </header>

      <section className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl bg-surface-2 p-4 print:bg-white print:border print:border-slate-300">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Deliver to</p>
          <p className="text-base font-semibold text-ink print:text-black">{note.customerName}</p>
          <p className="mt-1 text-sm text-ink print:text-black">{note.customerAddress}</p>
          <p className="mt-1 text-sm text-muted print:text-slate-600">{note.customerMobile}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Order">{note.orderNumber}</Field>
          <Field label="Dispatch">{note.dispatchNumber}</Field>
          <Field label="Delivery date">{formatDate(note.deliveryDate)}</Field>
          <Field label="Delivery status">{status}</Field>
          <Field label="Driver">{note.driverName}</Field>
          <Field label="Vehicle">{note.vehicleNumber}</Field>
        </div>
      </section>

      <section className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted print:border-black print:text-black">
                <th className="py-2 pr-3">#</th><th className="py-2 pr-3">Product</th><th className="py-2 pr-3 text-right">Ordered</th><th className="py-2 pr-3 text-right">Dispatched</th>
                <th className="py-2 pr-3 text-right">Delivered</th><th className="py-2 pr-3 text-right">Remaining</th><th className="py-2 text-right">Damaged</th>
              </tr>
            </thead>
            <tbody>
              {note.items.map((it, i) => (
                <tr key={`${it.productId}-${i}`} className="border-b border-line/60 print:border-slate-300">
                  <td className="py-2 pr-3 text-muted tabular">{i + 1}</td>
                  <td className="py-2 pr-3"><p className="text-ink print:text-black">{it.productName}</p><p className="text-xs text-muted tabular">{it.productCode} · {it.unit}</p></td>
                  <td className="py-2 pr-3 text-right tabular">{formatNumber(it.orderedQuantity)}</td>
                  <td className="py-2 pr-3 text-right tabular">{formatNumber(it.dispatchedQuantity)}</td>
                  <td className="py-2 pr-3 text-right tabular font-semibold">{formatNumber(it.deliveredQuantity)}</td>
                  <td className="py-2 pr-3 text-right tabular">{formatNumber(it.remainingQuantity)}</td>
                  <td className="py-2 text-right tabular">{formatNumber(it.damagedQuantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold text-ink print:text-black">
                <td className="py-2 pr-3" colSpan={4}>Quantity summary</td>
                <td className="py-2 pr-3 text-right tabular" data-testid="note-delivered">{formatNumber(note.totalDelivered)}</td>
                <td className="py-2 pr-3 text-right tabular" data-testid="note-remaining">{formatNumber(note.totalRemaining)}</td>
                <td className="py-2 text-right tabular">{formatNumber(note.totalDamaged)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-3">
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 ${verified ? 'bg-green-50 text-green-800 dark:bg-green-500/10 dark:text-green-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'} print:bg-white print:text-black print:border print:border-slate-300`}>
            {verified ? <ShieldCheck size={18} className="shrink-0" /> : <ShieldAlert size={18} className="shrink-0" />}
            <div>
              <p className="text-sm font-semibold">OTP {verified ? 'verified' : 'not verified'}{note.otpVerifiedAt ? ` · ${formatDateTime(note.otpVerifiedAt)}` : ''}</p>
              <p className="text-xs">Simulated OTP — prototype only, no SMS or WhatsApp message was sent.</p>
            </div>
          </div>
          <Field label="Received by (customer acknowledgement)">{note.customerAcknowledgement}</Field>
          <Field label="Delivery remarks">{note.remarks}</Field>
          {pod?.customerRemarks && <Field label="Customer remarks">{pod.customerRemarks}</Field>}
          {pod && Object.keys(pod.rejected || {}).length > 0 && (
            <Field label="Rejected by customer">{pod.lines.filter((l) => l.rejected).map((l) => `${l.productName}: ${l.rejected} ${l.unit}`).join(' · ')}{pod.shortReason ? ` — ${pod.shortReason}` : ''}</Field>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 self-end">
          <div>
            {pod?.signature ? <img src={pod.signature} alt="Customer signature" className="h-16 w-full object-contain border-b border-dashed border-line" /> : <div className="h-16 border-b border-dashed border-line print:border-slate-500" />}
            <p className="mt-1 text-xs text-muted print:text-slate-600">Customer signature{pod?.signature ? ' (captured on delivery)' : ''}</p>
          </div>
          <div><div className="h-16 border-b border-dashed border-line print:border-slate-500" /><p className="mt-1 text-xs text-muted print:text-slate-600">Driver signature</p></div>
          {pod?.photo && (
            <div className="col-span-2">
              <img src={pod.photo} alt="Proof of delivery" className="max-h-48 rounded-lg border border-line object-contain" />
              <p className="mt-1 text-xs text-muted">Proof-of-delivery photo</p>
            </div>
          )}
        </div>
      </section>
      <footer className="mt-6 border-t border-line pt-3 text-[11px] text-muted print:text-slate-500">
        {appConfig.name} prototype · generated in the browser from demo data · not a tax invoice.
      </footer>
    </article>
  )
}
