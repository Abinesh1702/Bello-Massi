import { Crown, Snowflake, Thermometer, Sun } from 'lucide-react'
import Badge from '../common/Badge'
import { CREDIT_TONE, getCreditInfo, getVipStatus, STATUS_TONE as CUSTOMER_TONE, VIP_TONE } from '../../services/customerService'
import { STATUS_TONE as PRODUCT_TONE } from '../../services/productService'
import { STATUS_TONE as HUB_TONE } from '../../services/hubService'
import { STOCK_STATUS_TONE } from '../../utils/stock'
import { MOVEMENT_TYPES as MT, TRANSFER_STATUS as TS, VIP_STATUS } from '../../config/masterData'

export const CustomerStatusBadge = ({ status }) => <Badge tone={CUSTOMER_TONE[status] || 'neutral'} dot>{status}</Badge>
export const ProductStatusBadge = ({ status }) => <Badge tone={PRODUCT_TONE[status] || 'neutral'} dot>{status}</Badge>
export const HubStatusBadge = ({ status }) => <Badge tone={HUB_TONE[status] || 'neutral'} dot>{status}</Badge>
export const StockStatusBadge = ({ status }) => <Badge tone={STOCK_STATUS_TONE[status] || 'neutral'} dot>{status}</Badge>

export const CreditBadge = ({ customer, status: given }) => {
  const status = given || getCreditInfo(customer).status
  return <Badge tone={CREDIT_TONE[status]}>{status}</Badge>
}

/** VIP marker for lists: shown only for VIP customers, with pass state. */
export const VipBadge = ({ customer, showDisabled = false }) => {
  if (!customer?.isVip) return showDisabled ? <Badge tone="neutral">Not VIP</Badge> : null
  const s = getVipStatus(customer)
  const label = s === VIP_STATUS.ACTIVE ? 'VIP' : s === VIP_STATUS.EXPIRED ? 'VIP · Pass expired' : 'VIP · No pass'
  return (
    <Badge tone={VIP_TONE[s]} className="gap-1">
      <Crown size={11} aria-hidden /> {label}
    </Badge>
  )
}

const TRANSFER_TONE = { [TS.DRAFT]: 'warning', [TS.COMPLETED]: 'success', [TS.CANCELLED]: 'neutral' }
export const TransferStatusBadge = ({ status }) => <Badge tone={TRANSFER_TONE[status]} dot>{status}</Badge>

const MOVE_TONE = {
  [MT.RECEIPT]: 'success', [MT.TRANSFER_IN]: 'info', [MT.TRANSFER_OUT]: 'brand', [MT.ADJ_INCREASE]: 'success',
  [MT.ADJ_DECREASE]: 'warning', [MT.DAMAGE]: 'danger', [MT.LOST]: 'danger',
}
export const MovementTypeBadge = ({ type }) => <Badge tone={MOVE_TONE[type] || 'neutral'}>{type}</Badge>

const STORAGE_ICON = { Frozen: Snowflake, Chilled: Thermometer, Ambient: Sun }
export const StorageTag = ({ condition }) => {
  const Icon = STORAGE_ICON[condition] || Sun
  return <span className="inline-flex items-center gap-1 text-xs text-muted"><Icon size={12} aria-hidden /> {condition}</span>
}
