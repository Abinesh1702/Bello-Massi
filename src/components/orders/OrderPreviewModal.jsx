import { Printer } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import OrderTotals from './OrderTotals'
import { formatDate, formatMoney, formatNumber } from '../../utils/formatters'

/** Read-only document view of the order as it will be submitted. */
export default function OrderPreviewModal({ input, priced, existing, nextNumber, lookups, onClose }) {
  const c = priced.customer
  const lines = priced.items.filter((i) => i.productId)
  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Order preview"
      description="This is how the order will appear to the Sales Manager."
      footer={<><Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button><Button onClick={onClose}>Close preview</Button></>}
    >
      <div className="rounded-xl border border-line p-5 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Sales order</p>
            <p className="text-lg font-semibold tabular">{existing?.orderNumber || `${nextNumber} (on submission)`}</p>
            <p className="text-muted">{formatDate(input.orderDate)} · {input.orderType} · {input.orderPriority} priority</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{c?.name || '—'}</p>
            <p className="text-muted">{c?.code} · {c?.contactPerson} · {c?.mobile}</p>
            <p className="text-muted">Salesman: {lookups.people[input.salesmanId]?.name || '—'}</p>
          </div>
        </div>
        <div className="grid gap-4 border-b border-line py-4 sm:grid-cols-3">
          <div><p className="text-xs text-muted">Deliver to</p><p>{input.deliveryAddress}, {input.deliveryCity}, {input.deliveryState} {input.deliveryPincode}</p></div>
          <div><p className="text-xs text-muted">Requested delivery</p><p>{formatDate(input.requestedDeliveryDate)}</p>{input.deliveryInstructions && <p className="text-muted">{input.deliveryInstructions}</p>}</div>
          <div><p className="text-xs text-muted">Hub · terms</p><p>{priced.hub?.name || '—'}</p><p className="text-muted">{input.paymentTerms}{input.customerReference ? ` · Ref ${input.customerReference}` : ''}</p></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] my-3">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted"><th className="py-1.5">Product</th><th className="py-1.5 text-right">Qty</th><th className="py-1.5 text-right">Price</th><th className="py-1.5 text-right">Disc.</th><th className="py-1.5 text-right">GST</th><th className="py-1.5 text-right">Total</th></tr></thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.key} className="border-t border-line">
                  <td className="py-1.5">{l.productName}<span className="text-muted"> · {l.sku}</span></td>
                  <td className="py-1.5 text-right tabular">{formatNumber(l.orderedQuantity)} {l.unit}</td>
                  <td className="py-1.5 text-right tabular">{formatMoney(l.unitPrice)}</td>
                  <td className="py-1.5 text-right tabular">{l.discountPercentage ? `${l.discountPercentage}%` : '—'}</td>
                  <td className="py-1.5 text-right tabular">{l.taxPercentage}%</td>
                  <td className="py-1.5 text-right tabular font-medium">{formatMoney(l.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ml-auto max-w-xs"><OrderTotals totals={priced.totals} /></div>
        {input.notes && <p className="mt-4 border-t border-line pt-3 text-muted">Notes: {input.notes}</p>}
      </div>
    </Modal>
  )
}
