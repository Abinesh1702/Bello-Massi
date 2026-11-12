import Badge from '../common/Badge'
import InfoList from '../common/InfoList'
import { CreditBadge, CustomerStatusBadge, VipBadge } from '../masterdata/Badges'
import { getOrderCreditPosition } from '../../services/orderService'
import { getVipStatus, VIP_TONE } from '../../services/customerService'
import { formatMoney } from '../../utils/formatters'
import { cn } from '../../utils/helpers'

/** Customer, credit and VIP position, including the effect of this order (never posted in Phase 3). */
export default function CustomerCreditPanel({ customer, orderTotal = 0, showProjection = true }) {
  if (!customer) return <p className="text-sm text-danger">This customer record no longer exists.</p>
  const c = getOrderCreditPosition(customer, orderTotal)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <CustomerStatusBadge status={customer.status} />
        <CreditBadge status={c.status} />
        <VipBadge customer={customer} />
      </div>
      <InfoList items={[
        { label: 'Customer', value: `${customer.name} (${customer.code})` },
        { label: 'Type', value: `${customer.type}${customer.category ? ` · ${customer.category}` : ''}` },
        { label: 'Contact', value: `${customer.contactPerson} · ${customer.mobile}` },
        { label: 'Email', value: customer.email },
        { label: 'Credit limit', value: c.enabled ? formatMoney(c.limit) : 'Credit disabled' },
        { label: 'Current balance', value: c.enabled ? formatMoney(c.balance) : '—' },
        { label: 'Available credit', value: c.enabled ? <span className={c.available < 0 ? 'text-danger font-medium' : ''}>{formatMoney(c.available)}</span> : '—' },
        { label: 'Credit days', value: c.enabled ? `${c.days} days` : '—' },
        { label: 'VIP pass', value: customer.isVip ? <Badge tone={VIP_TONE[getVipStatus(customer)]}>{getVipStatus(customer)}</Badge> : 'Not VIP' },
      ]} />
      {showProjection && c.enabled && orderTotal > 0 && (
        <div className={cn('rounded-lg px-3 py-2.5 text-sm', c.exceedsAfterOrder ? 'bg-danger/10 text-danger dark:bg-danger/100/10' : 'bg-surface-2 text-muted')}>
          After this order: balance {formatMoney(c.projectedBalance)} · {c.exceedsAfterOrder ? `over limit by ${formatMoney(c.projectedBalance - c.limit)}` : `${formatMoney(c.projectedAvailable)} left`}.
          <span className="block text-xs mt-0.5 opacity-80">Projection only — credit is not posted until invoicing.</span>
        </div>
      )}
    </div>
  )
}
