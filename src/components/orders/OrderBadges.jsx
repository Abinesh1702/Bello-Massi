import { AlertTriangle, PackageX, Flag } from 'lucide-react'
import Badge, { StatusBadge } from '../common/Badge'
import { APPROVAL_STATUS_META, CONSOLIDATION_STATUS_META } from '../../utils/constants'
import { PRIORITY_TONE } from '../../config/orderConfig'

export const OrderStatusBadge = ({ status }) => <StatusBadge status={status} />

export const ApprovalStatusBadge = ({ status }) => {
  const m = APPROVAL_STATUS_META[status] || { label: status, tone: 'neutral' }
  return <Badge tone={m.tone}>{m.label}</Badge>
}

export const ConsolidationStatusBadge = ({ status }) => {
  const m = CONSOLIDATION_STATUS_META[status] || { label: status, tone: 'neutral' }
  return <Badge tone={m.tone}>{m.label}</Badge>
}

export const PriorityBadge = ({ priority }) => (
  <Badge tone={PRIORITY_TONE[priority] || 'neutral'} className="gap-1"><Flag size={10} aria-hidden /> {priority}</Badge>
)

export const CreditWarningBadge = ({ label = 'Credit warning' }) => (
  <Badge tone="danger" className="gap-1"><AlertTriangle size={11} aria-hidden /> {label}</Badge>
)

export const StockWarningBadge = ({ label = 'Stock short' }) => (
  <Badge tone="warning" className="gap-1"><PackageX size={11} aria-hidden /> {label}</Badge>
)

