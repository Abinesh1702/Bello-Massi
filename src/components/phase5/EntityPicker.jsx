import Select from '../common/Select'
import Input from '../common/Input'
import { canViewDocument, entityName } from '../../services/documentService'
import { usePhase5Data } from '../../hooks/usePhase5Data'
import { useAuth } from '../../hooks/useAuth'

/** Pick the record a document belongs to, from existing masters only (scoped to what the user may see). */
export default function EntityPicker({ entityType, value, onChange, label, onLabelChange, error }) {
  const d = usePhase5Data()
  const { user } = useAuth()
  if (!entityType) return <Select label="Related record" disabled options={[]} placeholder="Choose an entity type first" />
  if (entityType === 'vendor' || entityType === 'other') {
    return <Input label={entityType === 'vendor' ? 'Vendor name' : 'Related to'} required value={label} onChange={(e) => onLabelChange(e.target.value)} error={error} maxLength={80} hint={entityType === 'vendor' ? 'No vendor master exists yet — enter the vendor’s name.' : undefined} />
  }
  const source = { customer: d.customers, vehicle: d.vehicles, driver: d.drivers, order: d.orders.filter((o) => o.orderNumber), deliveryNote: d.notes, invoice: d.invoices, hub: d.hubs, employee: d.users }[entityType] || []
  const ctx = { customers: d.customers, orders: d.orders, drivers: d.drivers }
  const options = source
    .filter((r) => canViewDocument(user, { entityType, entityId: r.id, uploadedBy: user.id }, ctx))
    .map((r) => ({ value: r.id, label: entityType === 'customer' ? `${r.name} (${r.code})` : entityType === 'order' ? `${r.orderNumber} · ${r.customerName}` : entityType === 'invoice' ? `${r.invoiceNumber} · ${r.customerSnapshot?.name}` : entityType === 'deliveryNote' ? `${r.noteNumber} · ${r.customerName}` : entityName(entityType, r) }))
  return <Select label="Related record" required placeholder={options.length ? 'Select record' : 'No records you can access'} value={value} onChange={(e) => onChange(e.target.value)} options={options} error={error} />
}
