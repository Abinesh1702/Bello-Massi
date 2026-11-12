import { useParams } from 'react-router-dom'
import { ArrowLeft, Printer, FileDown, Route, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import Button from '../../components/common/Button'
import NotFoundRecord from '../../components/common/NotFoundRecord'
import DeliveryNoteDocument from '../../components/dispatch/DeliveryNoteDocument'
import { useDispatchData } from '../../hooks/useDispatchData'
import { useAuth } from '../../hooks/useAuth'
import { useStoredValue } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../utils/constants'
import { usePermission } from '../../hooks/usePermission'
import { canViewDeliveryNote, getDeliveryNoteById } from '../../services/deliveryNoteService'
import { OrderAccessDenied } from '../orders/OrderDetail'

/**
 * Delivery note viewer with print. "Download PDF" uses the browser's print dialog (Save as PDF) —
 * no PDF library or backend service is involved.
 */
const EMPTY = []

export default function DeliveryNotePage({ driverView = false, customerView = false }) {
  const { id } = useParams()
  const { user } = useAuth()
  const { notes, orders, drivers } = useDispatchData()
  const canDispatch = usePermission('dispatch.view')
  const pods = useStoredValue(STORAGE_KEYS.DELIVERY_POD, EMPTY)
  const note = getDeliveryNoteById(id, notes)
  const back = customerView ? '/customer/delivery-notes' : driverView ? '/driver/delivery-notes' : '/dispatch/delivery-history?tab=notes'
  if (!note) return <NotFoundRecord entity="delivery note" backTo={back} backLabel="Back to delivery notes" />
  if (!canViewDeliveryNote(user, note, { orders, drivers })) return <OrderAccessDenied />
  const print = () => window.print()
  const pdf = () => {
    toast.info('Choose “Save as PDF” as the printer', { description: 'The browser’s print dialog creates the PDF — nothing is uploaded.' })
    window.setTimeout(() => window.print(), 300)
  }
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" icon={ArrowLeft} to={back}>Back</Button>
        <div className="flex flex-wrap gap-2">
          {!driverView && !customerView && canDispatch && <Button variant="ghost" icon={Route} to={`/dispatch/${note.dispatchId}`}>Dispatch</Button>}
          {!driverView && !customerView && <Button variant="ghost" icon={ClipboardList} to={`/orders/${note.orderId}`}>Order</Button>}
          {customerView && <Button variant="ghost" icon={ClipboardList} to={`/customer/orders/${note.orderId}`}>Order</Button>}
          <Button variant="secondary" icon={FileDown} onClick={pdf}>Download PDF</Button>
          <Button icon={Printer} onClick={print}>Print</Button>
        </div>
      </div>
      <DeliveryNoteDocument note={note} pod={pods.find((p) => p.deliveryId === note.deliveryId) || null} />
    </div>
  )
}

export const DriverDeliveryNotePage = () => <DeliveryNotePage driverView />
export const CustomerDeliveryNotePage = () => <DeliveryNotePage customerView />
