import { Lock } from 'lucide-react'
import Modal from '../common/Modal'
import InfoList from '../common/InfoList'
import Button from '../common/Button'
import { MovementTypeBadge } from '../masterdata/Badges'
import { movementSign } from '../../services/inventoryService'
import { formatDateTime, formatNumber } from '../../utils/formatters'

export default function MovementDetailModal({ movement: m, lookups, onClose }) {
  const p = m ? lookups.products[m.productId] : null
  const h = m ? lookups.hubs[m.hubId] : null
  return (
    <Modal
      open={Boolean(m)}
      onClose={onClose}
      title={m ? m.movementNumber : ''}
      description="Stock movement record"
      size="md"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {m && (
        <div className="space-y-4">
          <MovementTypeBadge type={m.movementType} />
          <InfoList items={[
            { label: 'Date', value: formatDateTime(m.date) },
            { label: 'Reference', value: m.referenceNumber },
            { label: 'Product', value: p ? `${p.name} (${p.code})` : 'Deleted product' },
            { label: 'Hub', value: h?.name || 'Deleted hub' },
            { label: 'Quantity', value: `${movementSign(m) > 0 ? '+' : '−'}${formatNumber(m.quantity)} ${p?.unit || ''}` },
            { label: 'Created by', value: lookups.people[m.createdBy]?.name || 'System' },
            { label: 'On hand (before → after)', value: `${formatNumber(m.previousQuantity)} → ${formatNumber(m.newQuantity)}` },
            { label: 'Available (before → after)', value: `${formatNumber(m.previousAvailable)} → ${formatNumber(m.newAvailable)}` },
            { label: 'Notes', value: m.notes, span: 2 },
          ]} />
          <p className="flex items-center gap-1.5 text-xs text-muted"><Lock size={12} /> Movement records are permanent and cannot be edited or deleted.</p>
        </div>
      )}
    </Modal>
  )
}
